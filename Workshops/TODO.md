# Workshop TODO — gaps to fill

A running checklist of everything the workshop still needs from you. Grouped by page.
Items are things only you can supply (photos, real data, lab quotes, video IDs) or
decisions to make. Tick them off as you go.

Legend: 📸 image/screenshot needed · 🔗 link needed · ✍️ writing needed · 📊 data needed · ❓ decision needed

---

## Landing page (`README.md`)

- [ ] ✍️ Add the **"Eelgrass Workshop Skills Checklist"** (placeholder comment near the Objectives list).
- [ ] ❓ Confirm the flipped ordering reads right: the two jobs are now listed **Making the data useful → Collecting the data** (plan-then-collect), to match the Section 2 → 3 order.

## Part 1 — Background (`01_Background/README.md`)

- [ ] ❓ The three carbon-curve GIFs are now wired to `images/download (Null).gif`, `download (pulse).gif`, and `download.gif`. Confirm each caption matches the correct animation (baseline equilibrium / single disturbance+recovery / pulse+press collapse).
- [ ] 🗑️ `images/download (1).gif` is unused — delete it or wire it in if it belongs somewhere.

## Part 2 — Project Planning (`02_Project_Planning/README.md`)

- [ ] 🔗 Step 1: Google Earth Engine boundary-drawing tool — replace *(link to be added)*.
- [ ] 🔗 Step 2: remote-sensing / auto-stratification method — replace *(links to be added)*.
- [ ] 🔗 Step 5 video callout: swap the playlist link for the **direct** *"Site Selection and Required Materials"* video URL.
- [ ] ❓ **Two sheets or three?** The intro says the calculator has *three sheets* but only Sheet 1 and Sheet 2 are documented. Either add a "Sheet 3" description or change the count to "two sheets."
- [ ] 📸 A small screenshot/GIF of the calculator's **"check precision after survey"** cells (SE / t-value / relative precision rows) to sit under the post-survey RME section.
- [ ] 📸 **Margin-of-error comparison** (new "See it for yourself" block in Step 4): calculator at ±20% vs ±10% side by side, *n* readout circled (~17 vs ~68).
- [ ] 📸 **Variability comparison** (same block): a smooth vs patchy meadow at the same target precision, showing *n* roughly quadruple as CV goes 0.5 → 1.0.
- [x] ✅ Worked example precision target: **resolved — ±20% at 90% confidence**, matching the default in the GEE sampling tool (`DEFAULT_MARGIN_OF_ERROR: 20`, `DEFAULT_CONFIDENCE: 90`). Standardised across Part 2, the worked example, and `00_config.R` (`TARGET_MARGIN <- 0.20`). Campaign sized at **23 cores** (spatial tool, site priors); the spreadsheet's uniform-area figure is 17.

- [ ] 🔄 **Re-render the report and figures.** The prose figures in Part 4 are now the
  six-core pipeline output, but the build artifacts still carry the old `TARGET_MARGIN`
  of 0.10: `eelgrass_carbon_report.html` reads "Precision target ±10% — NOT met", which is
  now "±20% — met". Re-run `source("run_pipeline.R")` then
  `quarto::quarto_render("eelgrass_carbon_report.qmd")`, and refresh
  `outputs/prior_to_posterior.png`.

## Part 3 — Field Methods (`03_Field_Methods/README.md`)

- [ ] 📸 **NFLD corer photos** for the underwater / stop-cap section.
- [ ] 📸 A real field photo in **each of the 5 coring steps** (left-hand cells currently say *[Paste field photo]*).
- [ ] 📸 A workshop photo of the team coring / extruding, to anchor the "Extrude and section" step.
- [ ] 🔗 **Core Depths** video (step 1): needs its own direct URL — the old link pointed at the same clip as "Site Selection." Currently linked to the playlist with the position flagged.
- [ ] 🔗 **DIY extrusion-device blueprint PDF** — replace *(link to be added)*.

## Part 4 — Data Interpretation (`04_Data_Interpretation/README.md`)

- [ ] 📸 Bagged samples next to the completed field data sheet ("arriving back from the field").
- [ ] 📸 The digital data sheet with example rows filled in, showing typed vs. auto-calculated columns.
- [ ] 📸 The example lab **submission** sheet, filled in.
- [ ] 📸 An example lab **result** sheet, with notes on mapping columns onto `soc_g_kg` / `bulk_density_g_cm3`.
- [ ] 📸 A rendered plot from the R pipeline (SOC depth profile or kriging map) + a screenshot of `eelgrass_carbon_report.html`.
- [ ] 📸 An example summary figure / one-page results summary.
- [ ] 📊 **Lab directory table** — add real labs: website, contact, analyses, cost per sample, "quoted on" date.
- [ ] 📊 **Sandy eelgrass DBD row** in the bulk-density table — add your real NFLD/BC measured values.
- [ ] ✍️ **Section 3 "Reporting and using the results"** — "Interpreting the numbers" and "Communicating with partners" are both *(to be written)*. This is the workshop's closing beat.
- [ ] ✍️ Tidy the **References** into your preferred citation style; confirm the Boundary Bay reference.

## R pipeline (`04_Data_Interpretation/DataAnalysisWorkflow/`)

- [ ] 🔴 **Run the pipeline locally and confirm it executes.** R was not available in the environment where the rewrite was done, so the new `mpspline2` / `survey` / `gstat` code is written against documented APIs but **has not been executed**. Run `source("run_pipeline.R")` and fix anything that surfaces before circulating.
- [ ] ⚠️ **Re-render the report.** `eelgrass_carbon_report.qmd`/`.html` still reflects the previous dataset, the old compaction schema, *and* the old estimator. It must be rebuilt against the current scripts — it's the first artifact a non-R reviewer opens.
- [ ] 📊 **Set real `STRATUM_AREAS_M2`** in `00_config.R`. The worked example uses 1.8 ha marsh / 3.2 ha eelgrass as placeholders; these are the weights in the stratified estimator, so they drive the headline number.
- [ ] 📊 **Replace the constructed covariates** (`water_depth_m`, `dist_to_shore_m`, `eelgrass_density`) in `core_locations.csv` with real values, or extract from rasters with `terra`.
- [ ] ❓ Confirm `PRIMARY_DEPTH_CM = 25` is the right primary reporting depth (it's the depth all six example cores reached, and matches Röhr et al. 2018 / Fourqurean et al. 2012).
- [ ] ❓ Confirm `UTM_EPSG` per site — 32610 (UTM 10N) for BC, 32621 (UTM 21N) for Newfoundland.

---

## Reviewer-readiness — remaining judgement calls

- [ ] 📸 **Compaction method diagrams** (Part 3, Step 3) — a blank two-panel table is in
  place: left cell for **Method A** (reading graduations on the tube), right cell for
  **Method B** (inside vs. outside distance from the tube top).
- [ ] ❓ **Detecting change over time.** Between-stratum comparison is now covered (a
  design-based t-test in `04`). If the project also needs to detect change between
  *survey years*, that requires a minimum-detectable-difference calculation at the design
  stage, which Part 2 does not currently cover. Add only if repeat monitoring is in scope.
- [ ] ❓ **Confirm the 10 × 10 m plot assumption** (`PLOT_AREA_M2` in `00_config.R`).
  Every sample-size number in Part 2 now derives from it — a 5 ha inlet holds 500 plots,
  which is what brings the finite-population correction into play.

## Enhancements — implemented

- [x] **Sample Size Visualizer to *show* the math** (Part 2): added a "What drives sample size?"
  table with rough approximations (E, CV, confidence, area) and a "See it for yourself" block.
  Remaining: supply the two comparison screenshots listed under Part 2 above.
- [x] **Reorganized Part 2** (A + B + C): roadmap table moved up front; sampling theory trimmed to
  a short primer; all how-many-samples math consolidated into Step 4; steps rebuilt as uniform
  side-by-side cards each opening with the question they answer.
- [x] **Rebuilt the analysis on established packages** so methods are citable rather than
  audited line-by-line: `mpspline2` (mass-preserving spline) for depth harmonization,
  `survey` (design-based stratified estimation) replacing the pooled mean, `gstat` for
  ordinary **and** regression kriging with a covariate-screening lesson.
- [x] **Fixed the statistical defects** found in review: strata now drive the estimator;
  inference runs on per-core totals rather than treating depth slices as independent;
  the vacuous spline R²/RMSE diagnostics are gone; non-monotonic profiles are flagged,
  never filtered; extrapolated share of stock is reported per stratum and per core.
- [x] **Fixed the bugs:** `%||%` defined before use, `Untitled.R` → `run_pipeline.R`,
  mislabelled "0-100 cm" output, CRS doc/code mismatch, stale data-dictionary examples.
