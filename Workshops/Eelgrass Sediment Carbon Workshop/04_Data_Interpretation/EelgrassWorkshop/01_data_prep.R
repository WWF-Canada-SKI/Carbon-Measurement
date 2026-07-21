# 01_data_prep.R
# Load, merge, and QC core data.
# Run this first — it produces `cores_raw` used by all downstream scripts.

library(dplyr)
library(readr)

source("00_config.R")

# ── Load CSVs ────────────────────────────────────────────────────────────────
locations <- read_csv(LOCATIONS_FILE, show_col_types = FALSE)
samples   <- read_csv(SAMPLES_FILE,   show_col_types = FALSE)

cat("Locations:", nrow(locations), "cores\n")
cat("Samples:",   nrow(samples),   "rows\n")

# ── Merge and compute derived columns ────────────────────────────────────────
cores_raw <- samples |>
  left_join(locations, by = "core_id") |>
  mutate(
    depth_cm           = (depth_top_cm + depth_bottom_cm) / 2,
    layer_thickness_cm = depth_bottom_cm - depth_top_cm
  )

# ── Fill missing bulk density from defaults ──────────────────────────────────
cores_raw <- cores_raw |>
  mutate(
    bd_estimated = is.na(bulk_density_g_cm3),
    bulk_density_g_cm3 = if_else(
      bd_estimated,
      sapply(stratum, function(s) BD_DEFAULTS[[s]] %||% NA_real_),
      bulk_density_g_cm3
    )
  )

cat("BD defaults applied to", sum(cores_raw$bd_estimated), "samples\n")

# ── Compute raw carbon stock per sample layer ────────────────────────────────
cores_raw <- cores_raw |>
  mutate(
    carbon_stock_kg_m2 = (soc_g_kg * bulk_density_g_cm3 * layer_thickness_cm) / 100
  )

# ── Basic QC flags ───────────────────────────────────────────────────────────
cores_raw <- cores_raw |>
  mutate(
    qc_soc_flag = soc_g_kg < QC_SOC_MIN | soc_g_kg > QC_SOC_MAX,
    qc_bd_flag  = bulk_density_g_cm3 < QC_BD_MIN | bulk_density_g_cm3 > QC_BD_MAX
  )

n_flagged <- sum(cores_raw$qc_soc_flag | cores_raw$qc_bd_flag, na.rm = TRUE)
cat("QC flags:", n_flagged, "samples outside thresholds\n")
cat("Final dataset:", nrow(cores_raw), "samples from", n_distinct(cores_raw$core_id), "cores\n")

# Quick look
print(head(cores_raw))
