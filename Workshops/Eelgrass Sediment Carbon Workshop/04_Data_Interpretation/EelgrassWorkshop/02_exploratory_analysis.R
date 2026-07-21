# 02_exploratory_analysis.R
# Exploratory data analysis — depth profiles, spatial map, stock distributions.
# Requires: cores_raw from 01_data_prep.R

library(dplyr)
library(ggplot2)

source("00_config.R")

# Run 01 if cores_raw doesn't exist yet
if (!exists("cores_raw")) source("01_data_prep.R")

# ── 1. SOC depth profiles ───────────────────────────────────────────────────
p_profiles <- ggplot(
  cores_raw |> arrange(core_id, depth_cm),
  aes(x = soc_g_kg, y = depth_cm, group = core_id, colour = core_id)
) +
  geom_path(linewidth = 0.6) +
  geom_point(size = 1.5) +
  scale_y_reverse(name = "Depth (cm)") +
  scale_x_continuous(name = "SOC (g/kg)") +
  theme_bw(base_size = 12) +
  labs(title = "SOC depth profiles by core",
       subtitle = SITE_NAME,
       colour = "Core")

print(p_profiles)

# ── 2. Bulk density depth profiles ──────────────────────────────────────────
p_bd <- ggplot(
  cores_raw |> arrange(core_id, depth_cm),
  aes(x = bulk_density_g_cm3, y = depth_cm, group = core_id, colour = core_id)
) +
  geom_path(linewidth = 0.6) +
  geom_point(size = 1.5) +
  scale_y_reverse(name = "Depth (cm)") +
  scale_x_continuous(name = expression("Bulk density (g cm"^{-3}*")")) +
  theme_bw(base_size = 12) +
  labs(title = "Bulk density depth profiles",
       colour = "Core")

print(p_bd)

# ── 3. Core locations map ───────────────────────────────────────────────────
p_map <- ggplot(
  cores_raw |> distinct(core_id, longitude, latitude, water_depth_m),
  aes(x = longitude, y = latitude, colour = water_depth_m)
) +
  geom_point(size = 4) +
  scale_colour_viridis_c(option = "C", name = "Water\ndepth (m)") +
  coord_sf() +
  theme_bw(base_size = 12) +
  labs(title = "Core locations",
       subtitle = SITE_NAME,
       x = "Longitude", y = "Latitude")

print(p_map)

# ── 4. Total raw carbon stock per core ──────────────────────────────────────
core_totals <- cores_raw |>
  group_by(core_id) |>
  summarise(
    total_stock_kg_m2 = sum(carbon_stock_kg_m2, na.rm = TRUE),
    max_depth         = max(depth_bottom_cm),
    .groups = "drop"
  )

p_stocks <- ggplot(core_totals, aes(x = core_id, y = total_stock_kg_m2)) +
  geom_col(fill = "#2E8B57", alpha = 0.8) +
  theme_bw(base_size = 12) +
  labs(title = "Total carbon stock per core (raw, pre-harmonization)",
       x = NULL,
       y = expression("Carbon stock (kg C m"^{-2}*")"))

print(p_stocks)

# ── 5. Summary table ────────────────────────────────────────────────────────
cat("\n── Summary statistics ──\n")
summary_tbl <- cores_raw |>
  summarise(
    n_cores    = n_distinct(core_id),
    n_samples  = n(),
    soc_mean   = mean(soc_g_kg, na.rm = TRUE),
    soc_sd     = sd(soc_g_kg, na.rm = TRUE),
    bd_mean    = mean(bulk_density_g_cm3, na.rm = TRUE),
    bd_sd      = sd(bulk_density_g_cm3, na.rm = TRUE),
    stock_mean = mean(carbon_stock_kg_m2, na.rm = TRUE),
    stock_sd   = sd(carbon_stock_kg_m2, na.rm = TRUE)
  )
print(as.data.frame(summary_tbl))
