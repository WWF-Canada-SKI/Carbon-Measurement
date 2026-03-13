# Terrestrial Carbon Sampling Design Tools


A suite of Google Earth Engine (GEE) applications for planning and implementing field sampling designs in terrestrial ecosystems (forests and upland habitats). Tools are designed for carbon quantification and follow statistical frameworks for sample size estimation.


| Resource | Link |
|---|---|
| GEE App Library | [blue-carbon-hub.projects.earthengine.app](https://blue-carbon-hub.projects.earthengine.app/) |
| Carbon Learning Library | [wwf.ca/carbon-measurement](https://wwf.ca/carbon-measurement/) |


## Tools Overview
Each app generates exportable sampling point shapefiles and includes an integrated sample size calculator. All tools use an equal-area projection (EPSG:3978 — Statistics Canada Lambert) appropriate for Canadian applications.


| Tool | Best Use Case |
|---|---|
| **Random Sampling** | Unbiased coverage across an AOI with no prior spatial knowledge |
| **Systematic Sampling** | Regular grid-based coverage; reduces spatial autocorrelation bias; efficient for large continuous forest stands |
| **Composite Sampling** | Hierarchical designs pairing High Resolution (HR) soil cores with composite subsamples |
| **Stratified-Random Sampling** | Ecosystems with distinct habitat classes (e.g., forest type, stand age, disturbance history); improves precision by reducing within-stratum variance |


## Getting Started
### 1. Open the app
Navigate to the [GEE App Library](https://blue-carbon-hub.projects.earthengine.app/) and select the tool appropriate for your sampling strategy (see table above).


### 2. Define your Area of Interest (AOI)
Use the map drawing tools to delineate your project boundary, or upload an existing polygon asset.


### 3. Calculate sample size
Enter your target confidence level, acceptable margin of error, and coefficient of variation (CV) — or accept the Canadian forest carbon defaults.


### 4. Generate samples
Click **Generate Samples**.


### 5. Export
Export sample points as GeoJSON, Shapefile, or CSV for use in field navigation software or further analysis.


## Notes
- All tools are designed for **Canadian terrestrial ecosystems** and use EPSG:3978. Users applying these tools outside Canada should verify that the projection is appropriate for their region.
- Sample outputs are intended as **starting points** — field crews should review generated points against high-resolution imagery before deployment.
