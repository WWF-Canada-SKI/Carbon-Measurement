# 05_kriging.R
# Spatial interpolation of carbon stocks using kriging.
# Two approaches:
#   A) Ordinary kriging — interpolates using spatial autocorrelation only
#   B) Universal kriging — adds water depth as an external drift variable
#
# Requires: cores_harmonized from 03_depth_harmonization.R
# Packages: sf, gstat, sp (install if needed)

library(dplyr)
library(ggplot2)
library(sf)
library(gstat)
library(sp)

source("00_config.R")

if (!exists("cores_harmonized")) source("03_depth_harmonization.R")

# ── Prepare total stock per core (summed across depth intervals) ─────────────
core_stocks <- cores_harmonized |>
  group_by(core_id, latitude, longitude, water_depth_m) |>
  summarise(
    total_stock_kg_m2 = sum(carbon_stock_kg_m2, na.rm = TRUE),
    .groups = "drop"
  )

cat("Kriging", nrow(core_stocks), "core locations\n")

# ── Convert to sf ────────────────────────────────────────────────────────────
cores_sf <- st_as_sf(core_stocks, coords = c("longitude", "latitude"), crs = 4326)

# Project to UTM Zone 21N (appropriate for western Newfoundland)
cores_utm <- st_transform(cores_sf, crs = 32621)
coords_utm <- st_coordinates(cores_utm)
cores_utm$x <- coords_utm[, 1]
cores_utm$y <- coords_utm[, 2]

# ── Create prediction grid ──────────────────────────────────────────────────
# Build a regular grid covering the core extent + buffer
bbox <- st_bbox(cores_utm)
buffer <- 200  # metres
grid_res <- 25 # metres

grid_pts <- expand.grid(
  x = seq(bbox["xmin"] - buffer, bbox["xmax"] + buffer, by = grid_res),
  y = seq(bbox["ymin"] - buffer, bbox["ymax"] + buffer, by = grid_res)
)
grid_sf <- st_as_sf(grid_pts, coords = c("x", "y"), crs = 32621)

# Assign water depth to grid by IDW from core locations (simple approximation)
# In practice you'd use a bathymetry raster here
sp_cores <- as(cores_utm, "Spatial")
sp_grid  <- as(grid_sf, "Spatial")

idw_depth <- idw(water_depth_m ~ 1, locations = sp_cores, newdata = sp_grid, idp = 2)
grid_pts$water_depth_m <- idw_depth$var1.pred

cat("Prediction grid:", nrow(grid_pts), "points\n")

# ══════════════════════════════════════════════════════════════════════════════
# A) ORDINARY KRIGING
# ══════════════════════════════════════════════════════════════════════════════

cat("\n── A) Ordinary Kriging ──\n")

# Convert cores to SpatialPointsDataFrame for gstat
sp_cores_df <- SpatialPointsDataFrame(
  coords = cbind(cores_utm$x, cores_utm$y),
  data = data.frame(
    total_stock = cores_utm$total_stock_kg_m2,
    water_depth_m = cores_utm$water_depth_m
  ),
  proj4string = CRS("+init=epsg:32621")
)

# Empirical variogram
vg_ok <- variogram(total_stock ~ 1, data = sp_cores_df)
cat("Empirical variogram computed\n")

# Fit variogram model — try spherical
vg_fit_ok <- tryCatch(
  fit.variogram(vg_ok, vgm(psill = var(core_stocks$total_stock_kg_m2),
                            model = "Sph",
                            range = max(dist(coords_utm)) / 2,
                            nugget = 0.1)),
  error = function(e) {
    message("Spherical fit failed, trying exponential: ", e$message)
    fit.variogram(vg_ok, vgm(psill = var(core_stocks$total_stock_kg_m2),
                              model = "Exp",
                              range = max(dist(coords_utm)) / 3,
                              nugget = 0.1))
  }
)

cat("Fitted variogram model:\n")
print(vg_fit_ok)

# Plot variogram
p_vario_ok <- plot(vg_ok, vg_fit_ok, main = "Ordinary Kriging — Variogram")
print(p_vario_ok)

# Krige onto the prediction grid
sp_grid_ok <- SpatialPointsDataFrame(
  coords = cbind(grid_pts$x, grid_pts$y),
  data = grid_pts,
  proj4string = CRS("+init=epsg:32621")
)

ok_result <- krige(total_stock ~ 1,
                   locations = sp_cores_df,
                   newdata = sp_grid_ok,
                   model = vg_fit_ok)

grid_pts$ok_pred <- ok_result$var1.pred
grid_pts$ok_var  <- ok_result$var1.var

# Plot ordinary kriging result
p_ok <- ggplot(grid_pts, aes(x = x, y = y, fill = ok_pred)) +
  geom_tile() +
  scale_fill_viridis_c(option = "D",
                       name = expression("kg C m"^{-2})) +
  geom_point(data = data.frame(x = cores_utm$x, y = cores_utm$y),
             colour = "red", size = 2.5, shape = 21, fill = "white") +
  coord_equal() +
  theme_bw(base_size = 12) +
  labs(title = "Ordinary Kriging — Total Carbon Stock",
       subtitle = SITE_NAME,
       x = "Easting (m)", y = "Northing (m)")

print(p_ok)

# Kriging standard error
p_ok_se <- ggplot(grid_pts, aes(x = x, y = y, fill = sqrt(ok_var))) +
  geom_tile() +
  scale_fill_viridis_c(option = "A",
                       name = expression("SE (kg C m"^{-2}*")")) +
  geom_point(data = data.frame(x = cores_utm$x, y = cores_utm$y),
             colour = "red", size = 2.5, shape = 21, fill = "white") +
  coord_equal() +
  theme_bw(base_size = 12) +
  labs(title = "Ordinary Kriging — Prediction Standard Error",
       x = "Easting (m)", y = "Northing (m)")

print(p_ok_se)


# ══════════════════════════════════════════════════════════════════════════════
# B) UNIVERSAL KRIGING (with water depth as external drift)
# ══════════════════════════════════════════════════════════════════════════════

cat("\n── B) Universal Kriging (water depth as drift) ──\n")

# Empirical variogram of residuals after removing water depth trend
vg_uk <- variogram(total_stock ~ water_depth_m, data = sp_cores_df)

vg_fit_uk <- tryCatch(
  fit.variogram(vg_uk, vgm(psill = var(core_stocks$total_stock_kg_m2) * 0.5,
                            model = "Sph",
                            range = max(dist(coords_utm)) / 2,
                            nugget = 0.1)),
  error = function(e) {
    message("Spherical fit failed, trying exponential: ", e$message)
    fit.variogram(vg_uk, vgm(psill = var(core_stocks$total_stock_kg_m2) * 0.5,
                              model = "Exp",
                              range = max(dist(coords_utm)) / 3,
                              nugget = 0.1))
  }
)

cat("Fitted variogram model (universal):\n")
print(vg_fit_uk)

p_vario_uk <- plot(vg_uk, vg_fit_uk, main = "Universal Kriging — Variogram")
print(p_vario_uk)

# Krige with water depth as drift
sp_grid_uk <- SpatialPointsDataFrame(
  coords = cbind(grid_pts$x, grid_pts$y),
  data = grid_pts,
  proj4string = CRS("+init=epsg:32621")
)

uk_result <- krige(total_stock ~ water_depth_m,
                   locations = sp_cores_df,
                   newdata = sp_grid_uk,
                   model = vg_fit_uk)

grid_pts$uk_pred <- uk_result$var1.pred
grid_pts$uk_var  <- uk_result$var1.var

# Plot universal kriging result
p_uk <- ggplot(grid_pts, aes(x = x, y = y, fill = uk_pred)) +
  geom_tile() +
  scale_fill_viridis_c(option = "D",
                       name = expression("kg C m"^{-2})) +
  geom_point(data = data.frame(x = cores_utm$x, y = cores_utm$y),
             colour = "red", size = 2.5, shape = 21, fill = "white") +
  coord_equal() +
  theme_bw(base_size = 12) +
  labs(title = "Universal Kriging — Total Carbon Stock (drift: water depth)",
       subtitle = SITE_NAME,
       x = "Easting (m)", y = "Northing (m)")

print(p_uk)

# ── Compare OK vs UK ────────────────────────────────────────────────────────
grid_pts$diff <- grid_pts$uk_pred - grid_pts$ok_pred

p_diff <- ggplot(grid_pts, aes(x = x, y = y, fill = diff)) +
  geom_tile() +
  scale_fill_gradient2(low = "#d73027", mid = "white", high = "#1a9850",
                       midpoint = 0,
                       name = expression(Delta~"kg C m"^{-2})) +
  geom_point(data = data.frame(x = cores_utm$x, y = cores_utm$y),
             colour = "black", size = 2.5, shape = 21, fill = "white") +
  coord_equal() +
  theme_bw(base_size = 12) +
  labs(title = "Difference: Universal Kriging - Ordinary Kriging",
       x = "Easting (m)", y = "Northing (m)")

print(p_diff)

cat("\n── Summary ──\n")
cat(sprintf("Ordinary kriging mean: %.2f kg C/m²\n", mean(grid_pts$ok_pred, na.rm = TRUE)))
cat(sprintf("Universal kriging mean: %.2f kg C/m²\n", mean(grid_pts$uk_pred, na.rm = TRUE)))
cat(sprintf("Mean absolute difference: %.2f kg C/m²\n", mean(abs(grid_pts$diff), na.rm = TRUE)))
