# 04_simple_extrapolation.R
# Non-spatial carbon stock estimation: mean stocks per depth interval,
# total stock per unit area, and (optionally) total stock for the AOI.
# Requires: cores_harmonized from 03_depth_harmonization.R

library(dplyr)

source("00_config.R")

if (!exists("cores_harmonized")) source("03_depth_harmonization.R")

# ── Per-depth summary statistics ─────────────────────────────────────────────
depth_summary <- cores_harmonized |>
  group_by(depth_cm_midpoint, thickness_cm) |>
  summarise(
    n_cores          = n_distinct(core_id),
    mean_soc         = mean(soc_harmonized, na.rm = TRUE),
    sd_soc           = sd(soc_harmonized, na.rm = TRUE),
    mean_bd          = mean(bd_harmonized, na.rm = TRUE),
    mean_stock       = mean(carbon_stock_kg_m2, na.rm = TRUE),
    sd_stock         = sd(carbon_stock_kg_m2, na.rm = TRUE),
    se_stock         = sd_stock / sqrt(n_cores),
    ci90_lower       = mean_stock - qt(0.95, n_cores - 1) * se_stock,
    ci90_upper       = mean_stock + qt(0.95, n_cores - 1) * se_stock,
    pct_extrapolated = mean(is_extrapolated) * 100,
    .groups = "drop"
  )

cat("\n── Carbon stocks by depth interval ──\n")
print(as.data.frame(depth_summary |>
  select(depth_cm_midpoint, n_cores, mean_stock, sd_stock, ci90_lower, ci90_upper, pct_extrapolated)))

# ── Total stock per unit area (sum across depths) ────────────────────────────
total_stock <- depth_summary |>
  summarise(
    total_kg_m2   = sum(mean_stock),
    total_MgC_ha  = sum(mean_stock) * 10,
    se_total      = sqrt(sum(se_stock^2)),
    ci90_lower    = total_kg_m2 - 1.645 * se_total,
    ci90_upper    = total_kg_m2 + 1.645 * se_total
  )

cat("\n── Total carbon stock (0-100 cm) ──\n")
cat(sprintf("  Mean:  %.2f kg C/m²  (%.1f Mg C/ha)\n",
            total_stock$total_kg_m2, total_stock$total_MgC_ha))
cat(sprintf("  90%% CI: [%.2f, %.2f] kg C/m²\n",
            total_stock$ci90_lower, total_stock$ci90_upper))

# ── Per-core total stock ─────────────────────────────────────────────────────
core_totals <- cores_harmonized |>
  group_by(core_id, latitude, longitude, water_depth_m) |>
  summarise(
    total_stock_kg_m2  = sum(carbon_stock_kg_m2, na.rm = TRUE),
    total_stock_MgC_ha = total_stock_kg_m2 * 10,
    .groups = "drop"
  )

cat("\n── Per-core totals ──\n")
print(as.data.frame(core_totals))

# ── Area-weighted total (if AOI available) ───────────────────────────────────
if (!is.null(AOI_FILE) && file.exists(AOI_FILE)) {
  library(sf)
  aoi <- st_read(AOI_FILE, quiet = TRUE)
  total_area_m2 <- as.numeric(sum(st_area(aoi)))
  cat(sprintf("\nAOI area: %.1f ha\n", total_area_m2 / 10000))
  cat(sprintf("Estimated total stock: %.1f Mg C\n",
              total_stock$total_kg_m2 * total_area_m2 / 1000))
} else {
  cat("\nNo AOI file — reporting per-unit-area densities only.\n")
  cat("Set AOI_FILE in 00_config.R to compute total stock for your site.\n")
}

# ── Plot: stock by depth with 90% CI ────────────────────────────────────────
library(ggplot2)

p_extrapolation <- ggplot(depth_summary,
  aes(x = mean_stock, y = factor(depth_cm_midpoint))) +
  geom_col(fill = "#2E8B57", alpha = 0.7) +
  geom_errorbarh(aes(xmin = pmax(0, ci90_lower), xmax = ci90_upper),
                 height = 0.3) +
  scale_y_discrete(name = "Depth midpoint (cm)",
                   limits = rev(as.character(DEPTH_MIDPOINTS))) +
  theme_bw(base_size = 12) +
  labs(title = "Mean carbon stock by depth interval (90% CI)",
       subtitle = SITE_NAME,
       x = expression("Carbon stock (kg C m"^{-2}*")"))

print(p_extrapolation)
