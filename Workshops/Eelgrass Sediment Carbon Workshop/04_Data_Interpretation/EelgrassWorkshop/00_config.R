# 00_config.R
# Site-specific settings for eelgrass carbon stock analysis.
# Edit this file for your site — all other scripts read from here.

# ── Project metadata ─────────────────────────────────────────────────────────
PROJECT_NAME <- "Newfoundland_Eelgrass_Workshop_2026"
SITE_NAME    <- "Bay of Islands, West Coast NL"

# ── File paths ───────────────────────────────────────────────────────────────
DATA_DIR    <- "data"
OUTPUT_DIR  <- "outputs"

LOCATIONS_FILE   <- file.path(DATA_DIR, "core_locations.csv")
SAMPLES_FILE     <- file.path(DATA_DIR, "core_samples.csv")
COMPACTION_FILE  <- file.path(DATA_DIR, "core_compaction.csv")

# Area of Interest boundary (shapefile, GeoJSON, or GPKG).
# Set to NULL if not available — extrapolation will report densities only.
AOI_FILE          <- NULL
AOI_STRATUM_FIELD <- NULL

# ── Standard depth intervals ─────────────────────────────────────────────────
# Depth bins for harmonization. Modify if your cores are shallower.
DEPTH_INTERVALS <- data.frame(
  depth_top      = c( 0, 15, 30,  50),
  depth_bottom   = c(15, 30, 50, 100),
  depth_midpoint = c(7.5, 22.5, 40, 75),
  thickness_cm   = c(15, 15, 20, 50)
)
DEPTH_MIDPOINTS <- DEPTH_INTERVALS$depth_midpoint

# ── Bulk density defaults (g/cm³) ────────────────────────────────────────────
# Applied where bulk_density_g_cm3 is missing. Keyed by stratum.
BD_DEFAULTS <- list(
  "SG" = 0.75
)

# ── QC thresholds ────────────────────────────────────────────────────────────
QC_SOC_MIN <- 0      # g/kg
QC_SOC_MAX <- 200    # g/kg — eelgrass sediments are typically lower than salt marsh
QC_BD_MIN  <- 0.1    # g/cm³
QC_BD_MAX  <- 2.0    # g/cm³

# ── Stratum colours (for plots) ─────────────────────────────────────────────
STRATUM_COLORS <- c("SG" = "#2E8B57")
