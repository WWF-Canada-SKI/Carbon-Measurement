# 03_depth_harmonization.R
# Harmonize depth profiles to standard depth intervals using spline interpolation.
# Uses decompacted cores (from 01b) if available; falls back to raw cores.
# Produces `cores_harmonized` — one row per core x depth interval.
# Requires: cores_decompacted from 01b_compaction_correction.R (preferred)
#           OR cores_raw from 01_data_prep.R (fallback)

library(dplyr)

source("00_config.R")

# Use decompacted cores if available, otherwise fall back to raw
if (!exists("cores_decompacted") && !exists("cores_raw")) {
  tryCatch({
    source("01b_compaction_correction.R")
    cat("Using decompacted cores for harmonization\n")
  }, error = function(e) {
    message("BlueCarbon not available — falling back to raw cores: ", e$message)
    source("01_data_prep.R")
  })
}

cores_input <- if (exists("cores_decompacted")) cores_decompacted else cores_raw
input_label <- if (exists("cores_decompacted")) "decompacted" else "raw"
cat("Harmonizing from:", input_label, "cores\n")

# ── Null coalescing operator ─────────────────────────────────────────────────
`%||%` <- function(a, b) if (!is.null(a)) a else b

# ── Hybrid spline + exponential decay ────────────────────────────────────────
# Within measured range: monotone Hermite spline (monoH.FC).
# Beyond measured range: exponential decay if SOC decreases with depth,
# otherwise constant extrapolation from the deepest measurement.
fit_hybrid_profile <- function(depths, values, targets) {
  if (length(depths) < 2) return(rep(NA_real_, length(targets)))
  max_d <- max(depths)

  fn <- tryCatch(splinefun(depths, values, method = "monoH.FC"), error = function(e) NULL)
  if (is.null(fn)) return(rep(NA_real_, length(targets)))

  # Check for decreasing SOC with depth (Spearman rho < -0.3)
  decay <- NULL
  rho <- tryCatch(
    cor(depths, values, method = "spearman", use = "complete.obs"),
    error = function(e) NA_real_
  )
  if (!is.na(rho) && rho < -0.3 && length(depths) >= 3)
    try(decay <- lm(log(values + 0.1) ~ depths), silent = TRUE)

  sapply(targets, function(d) {
    if (d <= max_d) {
      fn(d)
    } else if (d > max_d * 2.5) {
      NA_real_
    } else if (!is.null(decay) && coef(decay)[2] < 0) {
      exp(predict(decay, newdata = data.frame(depths = d))) - 0.1
    } else {
      values[which.max(depths)]
    }
  })
}

# ── Spline fit diagnostics ───────────────────────────────────────────────────
get_diagnostics <- function(core_df) {
  tryCatch({
    fn    <- splinefun(core_df$depth_cm, core_df$soc_g_kg, method = "monoH.FC")
    preds <- fn(core_df$depth_cm)
    resid <- core_df$soc_g_kg - preds
    list(
      rmse = sqrt(mean(resid^2)),
      r2   = 1 - sum(resid^2) / sum((core_df$soc_g_kg - mean(core_df$soc_g_kg))^2)
    )
  }, error = function(e) list(rmse = NA_real_, r2 = NA_real_))
}

# ── Process one core ─────────────────────────────────────────────────────────
process_core <- function(core_df, standard_depths, thicknesses) {
  depths   <- core_df$depth_cm
  soc_pred <- fit_hybrid_profile(depths, core_df$soc_g_kg, standard_depths)

  bd_fn <- tryCatch(
    splinefun(depths, core_df$bulk_density_g_cm3, method = "monoH.FC"),
    error = function(e) NULL
  )
  if (is.null(bd_fn)) return(NULL)

  bd_last <- core_df$bulk_density_g_cm3[which.max(depths)]
  bd_pred <- sapply(standard_depths, function(d) {
    if (d <= max(depths)) bd_fn(d) else bd_last
  })

  diag <- get_diagnostics(core_df)

  data.frame(
    core_id           = core_df$core_id[1],
    stratum           = core_df$stratum[1],
    latitude          = core_df$latitude[1],
    longitude         = core_df$longitude[1],
    water_depth_m     = core_df$water_depth_m[1],
    depth_cm_midpoint = standard_depths,
    thickness_cm      = thicknesses,
    soc_harmonized    = pmax(0, soc_pred),
    bd_harmonized     = pmax(0, bd_pred),
    is_extrapolated   = standard_depths > max(depths),
    rmse              = diag$rmse,
    r2                = diag$r2
  )
}

# ── Run harmonization ────────────────────────────────────────────────────────
cores_qa <- cores_input |>
  filter(!is.na(depth_cm), !is.na(soc_g_kg), !is.na(bulk_density_g_cm3)) |>
  arrange(core_id, depth_cm)

core_ids <- unique(cores_qa$core_id)
cat("Processing", length(core_ids), "cores...\n")

results <- lapply(core_ids, function(id) {
  sub <- cores_qa |> filter(core_id == id) |> arrange(depth_cm)
  if (nrow(sub) < 2) return(NULL)
  tryCatch(
    process_core(sub, DEPTH_MIDPOINTS, DEPTH_INTERVALS$thickness_cm),
    error = function(e) { message("  Skipping ", id, ": ", e$message); NULL }
  )
})

cores_harmonized <- bind_rows(results) |>
  mutate(carbon_stock_kg_m2 = (soc_harmonized * bd_harmonized * thickness_cm) / 100) |>
  filter(!is.na(carbon_stock_kg_m2))

# ── QA: monotonic SOC decrease with depth ────────────────────────────────────
mono_check <- cores_harmonized |>
  group_by(core_id) |>
  summarise(
    qa_monotonic = cor(depth_cm_midpoint, soc_harmonized, use = "complete.obs") < -0.3,
    .groups = "drop"
  )
cores_harmonized <- cores_harmonized |> left_join(mono_check, by = "core_id")

cat("Harmonization complete.", n_distinct(cores_harmonized$core_id), "cores\n")
cat("Rows:", nrow(cores_harmonized), "\n")

# ── Quick visual check ──────────────────────────────────────────────────────
library(ggplot2)

p_harmonized <- ggplot(cores_harmonized,
  aes(x = carbon_stock_kg_m2, y = depth_cm_midpoint,
      group = core_id, colour = core_id)) +
  geom_path(linewidth = 0.6) +
  geom_point(aes(shape = is_extrapolated), size = 2) +
  scale_y_reverse(name = "Depth midpoint (cm)") +
  scale_shape_manual(values = c("FALSE" = 16, "TRUE" = 1),
                     labels = c("Interpolated", "Extrapolated")) +
  theme_bw(base_size = 12) +
  labs(title = "Harmonized carbon stocks by depth",
       x = expression("Carbon stock (kg C m"^{-2}*")"),
       colour = "Core", shape = "Method")

print(p_harmonized)
