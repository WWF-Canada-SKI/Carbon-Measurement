# 01b_compaction_correction.R
# Estimate and correct for percussion core compaction using the BlueCarbon package.
# Produces `cores_decompacted` — cores with corrected depths and bulk density.
# Requires: cores_raw from 01_data_prep.R
# Package:  BlueCarbon (install with install.packages("BlueCarbon"))

library(dplyr)
library(readr)
library(BlueCarbon)

source("00_config.R")

if (!exists("cores_raw")) source("01_data_prep.R")

# ── Load compaction field measurements ───────────────────────────────────────
# Each core has:
#   sampler_length    — total length of coring tube
#   internal_distance — distance from tube top to sediment surface INSIDE tube
#   external_distance — distance from tube top to sediment surface OUTSIDE tube
comp_meas <- read_csv(COMPACTION_FILE, show_col_types = FALSE)

cat("Compaction measurements for", nrow(comp_meas), "cores\n")

# ── Compute compaction ratio per core ────────────────────────────────────────
# recovered_length = sampler_length - internal_distance (what we got)
# true_length      = sampler_length - external_distance (what was actually there)
# compaction_ratio = recovered / true (< 1 means compression occurred)
# To decompact: divide each sample depth by the ratio
comp_pct <- comp_meas |>
  mutate(
    recovered_length = sampler_length - internal_distance,
    true_length      = sampler_length - external_distance,
    compaction_ratio = recovered_length / true_length,
    compaction       = 1 - compaction_ratio
  )

cat("\n── Compaction ratios ──\n")
print(comp_pct |> select(core_id, true_length, recovered_length, compaction_ratio))

# ── Prepare samples for decompaction ─────────────────────────────────────────
samples <- read_csv(SAMPLES_FILE, show_col_types = FALSE) |>
  left_join(select(comp_pct, core_id, compaction), by = "core_id") |>
  mutate(
    compaction = coalesce(compaction, 0),
    soc_pct    = soc_g_kg / 10
  )

# Rename columns to BlueCarbon defaults to avoid duplicate-name issues
names(samples)[names(samples) == "depth_top_cm"]       <- "mind"
names(samples)[names(samples) == "depth_bottom_cm"]    <- "maxd"
names(samples)[names(samples) == "bulk_density_g_cm3"] <- "dbd"

# ── Apply decompaction ───────────────────────────────────────────────────────
# Corrects depth intervals and bulk density for compaction.
# Decompacted depths are longer (core expands), BD decreases (same mass, more volume).
decompacted <- decompact(
  samples,
  core       = "core_id",
  compaction = "compaction",
  mind       = "mind",
  maxd       = "maxd",
  dbd        = "dbd"
)

# Rename back to project conventions
names(decompacted)[names(decompacted) == "mind"] <- "depth_top_cm"
names(decompacted)[names(decompacted) == "maxd"] <- "depth_bottom_cm"
names(decompacted)[names(decompacted) == "dbd"]  <- "bulk_density_g_cm3"

# ── Gap-fill with estimate_h() ───────────────────────────────────────────────
# Fills depth gaps between non-contiguous samples using midpoint splits.
decompacted_h <- estimate_h(
  decompacted,
  core = "core_id",
  mind = "mind_corrected",
  maxd = "maxd_corrected"
)

# ── Build cores_decompacted in the same format as cores_raw ──────────────────
locations <- read_csv(LOCATIONS_FILE, show_col_types = FALSE)

cores_decompacted <- decompacted_h |>
  mutate(
    depth_top_cm       = mind_corrected,
    depth_bottom_cm    = maxd_corrected,
    bulk_density_g_cm3 = dbd_corrected,
    depth_cm           = (mind_corrected + maxd_corrected) / 2,
    layer_thickness_cm = h,
    carbon_stock_kg_m2 = soc_g_kg * dbd_corrected * h / 100,
    bd_estimated       = FALSE
  ) |>
  left_join(select(locations, core_id, stratum, latitude, longitude, water_depth_m),
            by = "core_id")

cat("\nDecompaction complete.\n")
cat("Cores:", n_distinct(cores_decompacted$core_id), "\n")
cat("Rows:", nrow(cores_decompacted), "\n")

# ── Visualizations ───────────────────────────────────────────────────────────
library(ggplot2)

# Compaction ratio bar chart
p_compaction <- ggplot(comp_pct, aes(x = reorder(core_id, compaction_ratio), y = compaction_ratio)) +
  geom_col(fill = "#e76f51", alpha = 0.85) +
  geom_text(aes(label = round(compaction_ratio, 3)),
            vjust = -0.5, size = 3.5) +
  geom_hline(yintercept = 1, linetype = "dashed", colour = "grey50") +
  labs(title = "Compaction ratio per core",
       subtitle = "Ratio = recovered length / true length. Values < 1 indicate compression.",
       x = NULL, y = "Compaction ratio") +
  ylim(0, 1.1) +
  theme_bw(base_size = 12)

print(p_compaction)

# Depth shift visualization
raw_samples <- read_csv(SAMPLES_FILE, show_col_types = FALSE)
comparison <- raw_samples |>
  select(core_id, depth_top_raw = depth_top_cm, depth_bottom_raw = depth_bottom_cm) |>
  bind_cols(
    decompacted |>
      select(depth_top_corr = mind_corrected, depth_bottom_corr = maxd_corrected)
  ) |>
  mutate(
    depth_mid_raw  = (depth_top_raw + depth_bottom_raw) / 2,
    depth_mid_corr = (depth_top_corr + depth_bottom_corr) / 2
  )

p_depth_shift <- ggplot(comparison) +
  geom_segment(aes(x = depth_mid_raw, xend = depth_mid_corr,
                   y = core_id, yend = core_id),
               colour = "grey60", linewidth = 0.5) +
  geom_point(aes(x = depth_mid_raw, y = core_id), colour = "#6baed6",
             size = 2.5, shape = 16) +
  geom_point(aes(x = depth_mid_corr, y = core_id), colour = "#e76f51",
             size = 2.5, shape = 17) +
  labs(title = "Depth correction: raw vs decompacted",
       subtitle = "Blue circles = raw depths, orange triangles = corrected depths",
       x = "Depth midpoint (cm)", y = NULL) +
  theme_bw(base_size = 12)

print(p_depth_shift)
