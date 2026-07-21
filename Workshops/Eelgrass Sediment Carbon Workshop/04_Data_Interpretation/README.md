# 4 — Data Interpretation

*From sediment samples to carbon-stock estimates.*

[← 3 — Field Methods](../03_Field_Methods/) · [Back to main guide](../README.md)

---

## Overview

This section covers what happens after the cores come out of the field: sending samples
to a lab, understanding what the lab returns, and analysing those results with the
eelgrass carbon workflow in R. It follows WWF-Canada's field guide (*Part 3: Sample
Analysis* and *Part 4: Calculating Carbon Stocks*, pp. 15–19 of the
[Coastal Blue Carbon Field Guide](../Coastal-Blue-Carbon-Field-Guide-FINAL.pdf)), with a
dedicated [Lab Guide](Lab-Guide-Eng-2026.pdf) for the laboratory procedures.

The three stages:

1. [Submitting to a lab](#1-submitting-to-a-lab)
2. [Expected lab results](#2-expected-lab-results)
3. [The eelgrass R workflow](#3-the-eelgrass-r-workflow)

---

## 1. Submitting to a lab

For every core sampling location, the calculation ultimately needs three things:
**sediment depth (cm)**, **dry bulk density (g/cm³)**, and **organic carbon (%)**
(field guide, p.15). Bulk density can be measured with a scale and drying oven; carbon
usually goes to a specialist lab:

> "Carbon analysis requires more equipment, and often at this stage, the samples will be
> sent to a laboratory specializing in carbon analysis."
>
> — WWF-Canada, *[Measuring Carbon in Coastal Sediments](../Coastal-Blue-Carbon-Field-Guide-FINAL.pdf)* (2026), p.15

Samples should be frozen at −20 °C for storage, then thawed at 5–6 °C for 2–5 days,
dried at 65 °C to a stable weight, and ground homogeneous before analysis. See the
[Lab Guide](Lab-Guide-Eng-2026.pdf) for the full procedure and packaging requirements.

> 🎥 **CHECK OUT THE VIDEO** — *"Core Sample Analysis"* · [workshop playlist](https://www.youtube.com/playlist?list=PLLsjpJMfNDP5w78ZJNDUvMj1VoRG_qSwd) *(swap in the direct video link)*

> 📝 *To add — which lab(s) you use, turnaround expectations, and how much material to
> send per depth interval.*

---

## 2. Expected lab results

The lab returns two quantities per sample slice, which map onto the analysis inputs:

| Lab measurement | Analysis field | Notes |
|---|---|---|
| Organic carbon | `soc_g_kg` | Often measured by loss-on-ignition (LOI₅₅₀); for best accuracy the guide recommends total carbon on an elemental analyser (p.16) |
| Dry bulk density | `bulk_density_g_cm3` | Dry mass ÷ original sample volume (p.17) |

> "for the most accurate results, samples should be sent to a laboratory for total carbon
> measurement using an elemental analyser."
>
> — WWF-Canada, *[Measuring Carbon in Coastal Sediments](../Coastal-Blue-Carbon-Field-Guide-FINAL.pdf)* (2026), p.16

Typical eelgrass sediments return **lower organic carbon than salt-marsh or mangrove
soils** — the analysis QC thresholds reflect this (SOC flagged above 200 g/kg).

> 📸 **[SCREENSHOT NEEDED]** — an example lab result sheet, with notes on how to read the
> columns and map them onto `soc_g_kg` and `bulk_density_g_cm3`.

---

## 3. The eelgrass R workflow

A complete, reproducible R pipeline takes the lab results through compaction correction,
depth harmonisation, carbon-stock estimation, and spatial interpolation.

**👉 See [`EelgrassWorkshop/`](EelgrassWorkshop/) — full documentation is in its
[README](EelgrassWorkshop/README.md).**

The pipeline in brief:

| Stage | Script | Does |
|-------|--------|------|
| Data prep | [`01_data_prep.R`](EelgrassWorkshop/01_data_prep.R) | Load, merge, and QC core data |
| Compaction correction | [`01b_compaction_correction.R`](EelgrassWorkshop/01b_compaction_correction.R) | Correct percussion-core compression (uses the field measurements from [Section 3](../03_Field_Methods/)) |
| Exploratory analysis | [`02_exploratory_analysis.R`](EelgrassWorkshop/02_exploratory_analysis.R) | Depth profiles, maps, summaries |
| Depth harmonization | [`03_depth_harmonization.R`](EelgrassWorkshop/03_depth_harmonization.R) | Standardise cores to common depths |
| Estimation | [`04_simple_extrapolation.R`](EelgrassWorkshop/04_simple_extrapolation.R) | Mean stocks + confidence intervals |
| Spatial analysis | [`05_kriging.R`](EelgrassWorkshop/05_kriging.R) | Interpolate stocks across the meadow |

A pre-rendered report — [`EelgrassWorkshop/eelgrass_carbon_report.html`](EelgrassWorkshop/eelgrass_carbon_report.html)
— walks through the whole analysis and can be opened in any browser without running R.

> 📸 **[SCREENSHOT NEEDED]** — a rendered plot from the pipeline (e.g. the SOC depth
> profile from [`02_exploratory_analysis.R`](EelgrassWorkshop/02_exploratory_analysis.R)
> or a kriging map from [`05_kriging.R`](EelgrassWorkshop/05_kriging.R)), plus a screenshot
> of the rendered `eelgrass_carbon_report.html`.

### How the carbon-stock formula relates to the guide

The single line the pipeline uses is the field guide's equations 3–6 (pp. 17–18) combined:

```
Carbon stock (kg C/m²) = SOC (g/kg) × bulk density (g/cm³) × layer thickness (cm) ÷ 100
```

Per slice, the guide computes sediment carbon density = bulk density × (%C ⁄ 100),
multiplies by the depth interval to get g C/cm², sums the slices, and ×10 to reach
kg C/m². Because organic carbon in g/kg is ten times %C, that whole chain reduces to the
one formula above — then summing slices per core, averaging across cores, and scaling by
area gives the site total (guide equations 7–10).

---

## In this section

- [`EelgrassWorkshop/`](EelgrassWorkshop/) — the R analysis pipeline (with its own detailed README).
- [`Lab-Guide-Eng-2026.pdf`](Lab-Guide-Eng-2026.pdf) — WWF-Canada laboratory procedures guide.
- `images/` — lab result screenshots and analysis figures.

> **Iteration note:** the R pipeline under `EelgrassWorkshop/` was left untouched in this
> docs pass. Quotes are verified against the field-guide PDF (pp. 15–19); the video link
> points to the [playlist](https://www.youtube.com/playlist?list=PLLsjpJMfNDP5w78ZJNDUvMj1VoRG_qSwd)
> with the title to look for.
