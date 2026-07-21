# Eelgrass Carbon Stock Analysis

A reproducible R pipeline for estimating sediment carbon stocks in an eelgrass
(*Zostera marina*) meadow, from raw sediment-core measurements through to
spatially interpolated carbon-stock maps.

**Site:** Bay of Islands, West Coast Newfoundland
**Data:** 6 sediment cores (EG01–EG06), 38 sediment samples

---

## Contents

```
EelgrassWorkshop/
├── 00_config.R                  # Site settings — edit this first
├── 01_data_prep.R               # Load, merge, and QC core data
├── 01b_compaction_correction.R  # Correct for percussion-core compaction
├── 02_exploratory_analysis.R    # Depth profiles, maps, summary stats
├── 03_depth_harmonization.R     # Standardise cores to common depth intervals
├── 04_simple_extrapolation.R    # Mean stocks + confidence intervals
├── 05_kriging.R                 # Spatial interpolation (ordinary + universal)
├── Untitled.R                   # Convenience script — runs the whole pipeline
├── eelgrass_carbon_report.qmd   # Quarto report tying it all together
├── eelgrass_carbon_report.html  # Pre-rendered report (open in a browser)
└── data/
    ├── core_locations.csv       # One row per core — position, stratum, depth
    ├── core_samples.csv         # One row per sediment slice — SOC and BD
    └── core_compaction.csv      # Field measurements for compaction correction
```

---

## Requirements

- **R** (≥ 4.1 recommended, for the native `|>` pipe)
- **Quarto** (only needed to render the report) — https://quarto.org/

### R packages

```r
install.packages(c(
  "dplyr", "readr", "tidyr", "ggplot2", "knitr",  # data wrangling + plots
  "BlueCarbon",                                     # compaction correction
  "sf", "gstat", "sp"                              # spatial analysis / kriging
))
```

| Package | Used for |
|---------|----------|
| `dplyr`, `readr`, `tidyr` | Data loading and manipulation |
| `ggplot2` | All plots |
| `knitr` | Report tables |
| `BlueCarbon` | Core decompaction (`decompact()`, `estimate_h()`) |
| `sf`, `sp`, `gstat` | Spatial data handling and kriging |

The pipeline **degrades gracefully**: if `BlueCarbon` is not installed, depth
harmonization falls back to the raw (uncorrected) cores instead of failing.

---

## How to run

### Option 1 — Run the whole pipeline

```r
# From within the EelgrassWorkshop/ directory:
source("Untitled.R")   # runs 00 → 05, then renders the report
```

### Option 2 — Run stages individually

Each script `source()`s the ones it depends on, so you can start anywhere:

```r
source("00_config.R")
source("01_data_prep.R")
source("02_exploratory_analysis.R")
# ...and so on
```

### Option 3 — Just read the report

Open `eelgrass_carbon_report.html` in any web browser. It's fully self-contained
(embedded plots and tables) — no R required.

> **Working directory:** scripts use relative paths (`data/…`), so run them from
> inside the `EelgrassWorkshop/` folder (or open the folder as an RStudio project).

---

## The pipeline, stage by stage

### `00_config.R` — Configuration
The one file you edit for a new site. Sets project/site names, file paths, the
standard depth intervals, default bulk densities, QC thresholds, and plot colours.
Every other script reads its settings from here.

### `01_data_prep.R` — Data preparation
Loads and merges `core_locations.csv` and `core_samples.csv`, fills any missing
bulk-density values from the per-stratum defaults, computes raw carbon stock per
sample layer, and flags samples that fall outside QC thresholds. Produces
`cores_raw`.

### `01b_compaction_correction.R` — Compaction correction
Percussion coring compresses sediment, so recovered core length is shorter than
the sediment column it came from. Using the field measurements in
`core_compaction.csv`, this computes a **compaction ratio** per core and uses the
`BlueCarbon` package to "stretch" depths back to true values and adjust bulk
density accordingly. Produces `cores_decompacted`.

- `recovered_length = sampler_length − internal_distance`
- `true_length = sampler_length − external_distance`
- `compaction_ratio = recovered_length / true_length` (< 1 means compression)

### `02_exploratory_analysis.R` — Exploratory analysis
SOC and bulk-density depth profiles, a map of core locations coloured by water
depth, total raw stock per core, and a summary statistics table.

### `03_depth_harmonization.R` — Depth harmonization
Cores are sampled at different depth intervals, so they can't be compared or
averaged directly. This fits a **monotone Hermite spline** within the measured
range and an **exponential-decay (or constant) extrapolation** below it, then
evaluates SOC and bulk density at the standard depth intervals defined in
`00_config.R`. Uses decompacted cores when available, otherwise raw cores.
Produces `cores_harmonized` (one row per core × depth interval).

### `04_simple_extrapolation.R` — Non-spatial estimation
Mean carbon stock per depth interval with 90% confidence intervals, total stock
per unit area (kg C/m² and Mg C/ha), and per-core totals. If an Area-of-Interest
boundary is supplied in `00_config.R`, it also reports total stock for the whole
site.

### `05_kriging.R` — Spatial interpolation
Interpolates total carbon stock across the meadow two ways:
- **Ordinary kriging** — uses spatial autocorrelation only.
- **Universal kriging** — adds water depth as an external drift variable.

Both fit an empirical variogram, predict onto a regular grid (projected to UTM
Zone 21N), and map predictions plus prediction standard error.

> ⚠️ **With only 6 cores, variogram fitting is unreliable and kriging predictions
> carry high uncertainty.** These maps are illustrative — treat the patterns as
> hypotheses to test with more sampling, not definitive carbon maps.

---

## Data dictionary

### `core_locations.csv` — one row per core
| Column | Type | Description |
|--------|------|-------------|
| `core_id` | text | Unique core identifier (e.g. `EG01`) |
| `longitude` | number | Decimal degrees (WGS84) |
| `latitude` | number | Decimal degrees (WGS84) |
| `stratum` | text | Habitat stratum (`SG` = seagrass) |
| `water_depth_m` | number | Water depth at the core location (m) |

### `core_samples.csv` — one row per sediment slice
| Column | Type | Description |
|--------|------|-------------|
| `core_id` | text | Links to `core_locations.csv` |
| `depth_top_cm` | number | Top of the sample slice (cm below sediment surface) |
| `depth_bottom_cm` | number | Bottom of the sample slice (cm) |
| `soc_g_kg` | number | Soil organic carbon (g C / kg dry sediment) |
| `bulk_density_g_cm3` | number | Dry bulk density (g/cm³); blank = use default |

### `core_compaction.csv` — one row per core
| Column | Type | Description |
|--------|------|-------------|
| `core_id` | text | Links to `core_locations.csv` |
| `sampler_length` | number | Total length of the coring tube (cm) |
| `internal_distance` | number | Tube top → sediment surface *inside* the tube (cm) |
| `external_distance` | number | Tube top → sediment surface *outside* the tube (cm) |

---

## Adapting this to your own site

1. Replace the three CSVs in `data/` with your own, keeping the same column names.
2. Edit `00_config.R`:
   - `PROJECT_NAME`, `SITE_NAME`
   - `DEPTH_INTERVALS` if your cores are shallower/deeper
   - `BD_DEFAULTS` per stratum
   - QC thresholds (`QC_SOC_*`, `QC_BD_*`)
   - `STRATUM_COLORS` for plots
   - `AOI_FILE` — point to a shapefile/GeoJSON/GPKG boundary to get a total
     site-wide carbon estimate (leave `NULL` for densities only).
3. Re-run the pipeline or re-render the report.

---

## Key output

Carbon stock for each sample layer is:

```
Carbon stock (kg C/m²) = SOC (g/kg) × bulk density (g/cm³) × layer thickness (cm) ÷ 100
```

Summed over depth, this gives total stock per core (kg C/m² or Mg C/ha); averaged
across cores it gives a site-level density; and interpolated spatially it gives a
carbon-stock map.
