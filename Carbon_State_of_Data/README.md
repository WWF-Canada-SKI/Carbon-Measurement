# State of Carbon Data in Canada

Canada has a wealth of carbon data, but finding the right dataset, understanding what it represents and applying it to a particular place can be difficult. Information is spread across research publications, government portals and data archives, with different formats, methods and access requirements.

This report brings those resources together to help communities, researchers, conservation practitioners and decision-makers understand what is available and how it can support their work. It covers ground observations, environmental variables and mapped estimates of forest biomass and soil carbon, including peat.

The report has three main focuses:

1. **[Data and summaries](#1-data-and-summaries):** what data exist, what they contain and how to access them.
2. **[Comparisons](#2-comparisons):** how the data differ and which products can be compared meaningfully.
3. **[How to use](#3-how-to-use):** practical tools for using the data, with Google Earth Engine apps planned.

Each focus follows the same structure: **Forests** and **Soils**, each organised into **ground data, covariates and maps**.

**Existing report:** [Browse the source project's website](https://cathald.github.io/Carbon_Data_SOD/). This repository is being assembled from that work. Catalogue downloads and access examples are available from the source links below; Google Earth Engine apps are planned.

## Understanding the data

Ground observations provide measurements at specific plots, trees, soil profiles or cores. Some carbon quantities are measured directly; others are estimated from measurements, such as tree dimensions or soil carbon concentration and bulk density. Their uncertainty depends on the sampling and calculation methods.

**Covariates** are environmental variables used to describe conditions or help estimate carbon beyond the sampled locations. They include vegetation, climate, terrain, geology and information from optical, radar and LiDAR observations. A variable's use in a study does not, by itself, establish its predictive importance elsewhere.

**Maps** extend estimates across a landscape using observations, covariates and modelling or other upscaling methods. Their suitability depends on the quantity represented, geographic coverage, dates, spatial support and uncertainty.

Forests and soils are presented separately because their observations, methods and products often differ. They remain ecologically connected: vegetation supplies organic matter to soils, while soil conditions influence vegetation growth. Forest-floor and soil carbon beneath forests are included under Soils, with links to relevant forest resources.

## 1. Data and summaries

The tables below summarise the source catalogue and your dataset shortlist. Expand a table to see its records. Inclusion does not mean that a dataset is hosted in this new repository. Access, source terms and unresolved definitions remain specific to each resource.

### Forests

#### Ground data

Forest inventories, plot measurements and sampled-tree datasets. Retain measurement dates, plot support, coordinate accuracy and the method used to estimate biomass or carbon.

<details>
<summary>View forest ground datasets</summary>

| Resource | Measurements and geographic context | Access and connection to studies |
|---|---|---|
| Canada's National Forest Inventory (NFI) | National ground-plot forest measurements | [Access/contact](https://nfi.nfis.org/en/contact) and [request form](https://nfi.nfis.org/en/datarequestform); coordinate precision and redistribution require confirmation |
| Québec permanent sample plots | Tree and ecological observations in 400 m² plots, principally south of 52° N | [Public GeoPackage and documentation](https://www.donneesquebec.ca/recherche/dataset/placettes-echantillons-permanentes-1970-a-aujourd-hui); used for SCANFI external validation |
| New Brunswick Continuous Land Inventory (CLI) | Regional forest plots used by Betts et al. | [Study](https://onlinelibrary.wiley.com/doi/full/10.1111/gcb.17541) and [analysis archive](https://doi.org/10.6084/m9.figshare.27055528.v1); complete geolocated inventory availability remains to be checked |
| NRCan ENFOR sampled-tree biomass | Canadian tree-level destructive biomass measurements | [Dataset](https://open.canada.ca/data/en/dataset/fbad665e-8ac9-4635-9f84-e4fd53a6253c); supports national allometric equations |
| NASA ABoVE burned/unburned forest plots | Field measurements and derived carbon pools in Alaska, Northwest Territories and Saskatchewan, 1983–2016 | [Published CSV dataset](https://daac.ornl.gov/ABOVE/guides/ABoVE_Plot_Data_Burned_Sites.html); boreal disturbance applications |
| Ontario Vegetation Sampling Network (VSN) | Ground plots supporting Ontario's LiDAR-enhanced forest inventory | [Government description](https://publications.gc.ca/collections/collection_2025/rncan-nrcan/Fo123-2-40-2025-eng.pdf); public measurement download not yet confirmed |

</details>

#### Covariates

Environmental variables used by forest studies, including canopy structure, optical reflectance, radar, climate and terrain. Study-level performance is distinct from the importance of an individual covariate.

<details>
<summary>View forest studies, model grids and predictor evidence</summary>

| Study | Geographic modelling context | Model/map grid | Predictor evidence |
|---|---|---|---|
| [Betts et al. 2024](https://onlinelibrary.wiley.com/doi/full/10.1111/gcb.17541) | New Brunswick; overlapping 60 × 60 km local zones plus a province-wide model | 30 m | 54 Landsat CCDC features; held-out biomass correlation r = 0.77 |
| [Sothe et al. 2022](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2021GB007213) | Canada-wide forest mapping; reference observations concentrated in BC with additional provinces | 250 m | 58 of 78 predictors retained; canopy-height metrics ranked highest, followed by PALSAR and Landsat variables; five-fold R² = 0.52 |
| [Qin et al. 2025](https://doi.org/10.1016/j.isprsjprs.2025.05.022) | Canada's treed lands | 30 m | Seasonal Sentinel-1/2 and annual L-band SAR; stratified ten-fold validation; exact feature definitions and rankings still to extract |
| [Guindon et al. 2024 — SCANFI](https://doi.org/10.1139/cjfr-2023-0118) | National output assembled from regional tile models | 30 m | Summer/winter Landsat, climate, terrain and auxiliary predictors; photo-plot training and external ground validation |

</details>

<details>
<summary>View candidate forest covariates and source products</summary>

These are candidate extraction recipes from the earlier planning work, not a claim that a new extraction workflow has been implemented. The source notebook and pilot are archived separately. Match each recipe to the study's actual source release, time window and preprocessing.

| Covariate family | Variables to extract or derive | Source pixel spacing | Intended modelling grid/context | Source and implementation status |
|---|---|---|---|---|
| Landsat reflectance | Blue, green, red, NIR, SWIR1, SWIR2 | 30 m | Regional 30 m; national 250 m after aggregation | [Collection 2 Landsat 8 example](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C02_T1_L2); sensor/date harmonization required for longer series |
| Landsat temporal features | CCDC intercept, trend, three sine/cosine pairs and fitting RMSE per band; summer/winter reflectance composites | Derived from 30 m observations | Betts regional 30 m and SCANFI tile models | Derived features with study-specific fitting/composite rules |
| Canopy height | Maximum, p85 and p95 height | 250 m mapped product; underlying LiDAR observations are samples | Sothe national 250 m | [Study-linked height collection](https://gee-community-catalog.org/projects/scs/), `projects/sat-io/open-datasets/carbon_stocks_ca/ch`; image/band selection pending |
| L-band radar | HH and HV backscatter | 25 m | National 30 m or 250 m stacks | [PALSAR yearly mosaics](https://developers.google.com/earth-engine/datasets/catalog/JAXA_ALOS_PALSAR_YEARLY_SAR); match release, years and calibration to the study |
| C-band radar | VV and VH backscatter; seasonal summaries | Collection includes different resolutions; choose a documented acquisition subset | Qin-style national 30 m; study-specific 250 m use | [Sentinel-1 GRD](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD), `COPERNICUS/S1_GRD`; seasonal definitions pending |
| Sentinel-2 reflectance | Red, red-edge, NIR and SWIR bands; seasonal summaries | 10–20 m for these bands | Qin-style national 30 m | [Harmonized surface reflectance](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED); exact subset and seasonal windows pending |
| Terrain | Elevation, slope and study-defined topographic indices | Depends on source DEM | Study-specific regional/national grids | Exact DEM, index definitions and neighbourhoods pending methods extraction |
| Climate and radiation | Study-defined temperature, precipitation and radiation summaries | Depends on source product | National gradients and regional context | Exact variables, temporal periods and datasets pending methods extraction |
| Ecological context | Forest type, species context and soil type where supported by methods | Depends on source product | Stratification, conversion or predictor role recorded separately | Exact study roles and retained variables pending; not all contextual layers are biomass predictors |

</details>

#### Maps

Forest biomass and carbon maps. Aboveground biomass is distinct from carbon, and products that include different vegetation pools cannot be interpreted as equivalent totals.

<details>
<summary>View forest map products</summary>

| Resource | Description | Access |
|---|---|---|
| McMaster/WWF forest carbon | Canadian forest carbon stock and uncertainty at 250 m; aboveground, belowground and dead plant material, in kg C/m² | [Awesome GEE](https://gee-community-catalog.org/projects/scs/) |
| SCANFI v1.2 | Canadian 2020 forest attributes at 30 m; aboveground biomass in tonnes/ha | [Earth Engine catalogue](https://developers.google.com/earth-engine/datasets/catalog/projects_gcpm041u-lemur_assets_scanfi_v12_SCANFI_v1_2) |
| ESA CCI Biomass v6 | Aboveground woody biomass and standard deviation in Mg/ha; selected years from 2007–2022 | [Awesome GEE](https://gee-community-catalog.org/projects/cci_agb/) |
| Canadian Satellite-Based Forest Inventory | Modelled forest polygons with biomass, structure, species and disturbance attributes | [Awesome GEE](https://gee-community-catalog.org/projects/ca_sbfi/) |

</details>

<details>
<summary>View SBFI biomass and area fields</summary>

| Field | Meaning | Units |
|---|---|---|
| `088_STRUCTURE_AGB_AVG` | Mean aboveground biomass density | tonnes/ha |
| `089_STRUCTURE_AGB_SD` | Within-polygon biomass variation | tonnes/ha |
| `091_STRUCTURE_AGB_TOTAL` | Total aboveground biomass | tonnes |
| `003_AREA_HA` | Polygon area | ha |

The biomass SD describes within-polygon variation; it is not automatically a prediction-error estimate. Mean biomass density (tonnes/ha) and total biomass (tonnes) are different quantities.

</details>

<details>
<summary>View an additional regional forest map</summary>

| Addition | Canadian relevance and support | Access/status |
|---|---|---|
| Lamping coastal forest biomass | Coastal BC/Alaska, 30 m; live biomass and structural attributes | [GeoTIFF archive](https://doi.org/10.5281/zenodo.13932139); biomass is not automatically carbon |

</details>

### Soils

#### Ground data

Soil profiles, peat cores and sediment observations. The preparation counts below refer to source-project versions; they are not a deduplicated count of Canadian locations. Janousek includes Canadian, US and Mexican Pacific coast records. Riley records are sampling-location groups whose separate core identities remain unresolved.

<details>
<summary>View soil profile and layer preparations</summary>

| Preparation | Profile/location rows | Layer rows | Source-project asset names | Original resource |
|---|---:|---:|---|---|
| WoSIS Canada | 8,825 | 43,055 | `wosis_canada_profiles_v2`; `wosis_canada_layers_v2` | [ISRIC WoSIS](https://docs.isric.org/globaldata/wosis/) |
| National Pedon Database | 9,017 | 48,371 | `npdb_canada_profiles_v1`; `npdb_canada_layers_v1` | [CanSIS NPDB](https://sis.agr.gc.ca/cansis/nsdb/npdb/index.html) |
| NRCan peat profiles (source preparation named canpeat) | 1,217 | 37,072 | `canpeat_profiles_v1`; `canpeat_layers_v1` | [Confirmed provider](https://app.geo.ca/en-ca/map-browser/record/e287b0dd-8b07-435b-8a76-0c7ec84ac228); [Bauer et al. 2024](https://doi.org/10.1002/ecy.4398) |
| Janousek coastal blue carbon | 1,284 | 23,018 | `janousek_profiles_v1`; `janousek_layers_v1` | [Janousek et al. 2025](https://doi.org/10.1029/2024GB008239); [Smithsonian archive](https://doi.org/10.25573/serc.28127486.v1); Pacific coast across Canada, US and Mexico |
| Riley preparation | 347 sampling-location groups | 1,584 | `riley_profiles_v1`; `riley_layers_v1` | Exact OGS report(s), table and release pending |

Layers are repeated depth observations within profiles. Preserve measured/estimated flags and depth datum. Riley bulk-density units remain unverified and should be excluded from quantitative density comparisons. The source names `canpeat_*` refer to the NRCan peat database; the Can-Peat metadata portal and C-PEAT synthesis are separate resources.

</details>

<details>
<summary>View further soil, peat, wetland and agroforestry ground resources</summary>

| Addition | Canadian relevance and support | Access/status |
|---|---|---|
| Shaw upland forest soil database | 3,253 pedons; forest-floor and mineral soil to 100 cm | [Data paper and supplements](https://doi.org/10.1002/ecy.2159); assess reuse terms and shared-profile overlap |
| Martens coastal BC peatlands | Six peatlands; new field observations alongside reused NRCan peat records | [2026 paper](https://doi.org/10.1038/s41598-026-44791-z), [data citation](https://doi.org/10.5281/zenodo.17533263); files not yet inspected |
| Gross Alberta agroforestry | Local grassland/cropland/hedgerow/shelterbelt biomass, deadwood and soil pools | [Dryad CSV data](https://doi.org/10.5061/dryad.0zpc86711); coordinates/schema need checking |
| Pendea freshwater wetlands | Lake Simcoe watershed; eight 50 cm cores in marshes/swamps | [Paper](https://doi.org/10.1029/2023JG007561), [Borealis archive](https://doi.org/10.5683/SP3/OJRV2I); retain depth versus dated-horizon distinctions |
| Clayoquot marsh cores | Seven BC marshes; 34 cores and multiple stock-depth supports | [PANGAEA download](https://doi.org/10.1594/PANGAEA.947825); check overlap with Janousek |

Gross spans vegetation, deadwood and soil pools. Martens and the coastal compilations can reuse observations from other datasets; check source IDs before adding site counts.

</details>

#### Covariates

Environmental variables used by soil and peat studies. Keep the source grid, geographic context, dates and prediction depth separate from the model's output grid. Proposed variables, documented inputs and retained predictors have different evidence.

<details>
<summary>View soil studies, targets and modelling context</summary>

| Study/product | Geographic training and application context | Map grid/support | Covariate evidence and target |
|---|---|---|---|
| [Sothe et al. 2022 — Geoderma](https://doi.org/10.1016/j.geoderma.2021.115402) | Canada; spatial and vertical SOC modelling | 250 m | 40 candidates, 25-variable model; depth, surface temperature and elevation ranked highest; SOC concentration |
| [Sothe et al. 2022 — GBC](https://doi.org/10.1029/2021GB007213) | Canada; WoSIS plus Lehigh peatland sites | 250 m | SOC and bulk density modelled separately; depth, elevation, climate and vegetation; derived stocks |
| [Poggio et al. 2021 — SoilGrids 2.0](https://doi.org/10.5194/soil-7-217-2021) | Global; approximately 240,000 profiles including restricted-use inputs | 250 m | Over 400 candidate environmental layers; spatially stratified ten-fold validation |
| [Geng et al. 2025](https://doi.org/10.1038/s41597-025-05460-4) | Canada; observations concentrated in southern agricultural regions | 100 m | 70 covariates; bias-corrected RF/QRF; national/regional application |
| [Hengl et al. 2023 — Alberta](https://doi.org/10.1139/facets-2023-0040) | Alberta agricultural lands; 404 locations on 22 farms | 30 m; terrain inputs at 30/100/250 m | 180 prepared covariates; SOC and bulk-density models; farm-scale sampling supports regional modelling |
| [Janousek et al. 2025](https://doi.org/10.1029/2024GB008239) | Pacific coastal ecosystems, Alaska to Mexico; estuary/local habitat versus regional climate | Core-based analyses; no original uniform raster | Local habitat/estuary variables, tidal elevation and sediment fines; ecosystem-specific relationships |
| [Olefeldt et al. 2016](https://doi.org/10.1038/ncomms13043) | Circumpolar boreal/tundra permafrost region | Landscape polygons | Expert-weighted landscape classification; SOC inherited from circumpolar soil estimates |
| [Hugelius et al. 2013 — NCSCDv2](https://doi.org/10.5194/essd-5-393-2013) | Northern circumpolar permafrost region | Polygons; several rasterizations | Soil-map/pedon upscaling; not a satellite RF predictor-selection study |
| [Treat et al. 2024](https://doi.org/10.1029/2023JG007638) | Northern permafrost ecosystems | Review; no original map grid | Context and links to stock/flux products; not a new fitted covariate stack |

This table includes model inputs, soil-map upscaling, expert classification and synthesis references. These are different methods; the entries should not be read as a ranking of predictors.

</details>

<details>
<summary>View soil covariate families and source products</summary>

| Family and variables | Study support / role | Native grid and GEE access | Intended geographic/grid use |
|---|---|---|---|
| Prediction depth | Ranked highest in Sothe; 3D model input | Layer midpoint or requested depth; not a satellite raster | All depth-aware models; retain datum and interval |
| Long-term temperature and precipitation | Sothe ranked climate; Geng monthly normals | [Daymet V4](https://developers.google.com/earth-engine/datasets/catalog/NASA_ORNL_DAYMET_V4), 1 km; [TerraClimate](https://developers.google.com/earth-engine/datasets/catalog/IDAHO_EPSCOR_TERRACLIMATE), ~4 km | Canada 100/250 m stacks; current releases are not automatically historical study releases |
| Regional climate normals | Hengl model input | [ClimateNA/AdaptWest](https://adaptwest.databasin.org/pages/adaptwest-climatena/), study source 1 km; GEE asset unconfirmed | Alberta 30 m; preserve the coarse climate support |
| Day/night surface temperature | Sothe temperature evidence; Geng model input | [MOD11A2 v6.1](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2), 1 km; Landsat thermal workflow study-specific | National 100/250 m; regional 30 m stack after documented resampling |
| NDVI/EVI seasonal means and variability | Sothe ranked vegetation; SoilGrids/Geng/Hengl inputs | [MOD13Q1 v6.1](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1), 250 m | Long-term national/global stacks; exact periods and QA per study |
| Landsat reflectance, spectral percentiles and peak NDVI | Sothe/Hengl/Geng inputs | [Landsat Collection 2](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C02_T1_L2), 30 m reflectance; thermal native support differs | Alberta 30 m; Canada 100/250 m; C2 is not identical to GLAD ARD composites |
| MODIS SWIR reflectance | Geng band-7 input; SoilGrids spectral family | [MCD43A4 v6.1](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD43A4), 500 m | Canada 100 m after aggregation/resampling rules are documented |
| Elevation, slope, curvature, landforms, TPI, wetness and ridge/valley flatness | Sothe elevation ranked; Geng/Hengl/SoilGrids terrain inputs | [ALOS AW3D30 v4.1](https://developers.google.com/earth-engine/datasets/catalog/JAXA_ALOS_AW3D30_V4_1), ~30 m DSM, a possible substitute; study DEM releases differ | Regional 30/100/250 m terrain; national 100/250 m; document kernel and flow algorithm |
| Land cover, soil class, geology and surficial deposits | Geng/Hengl/SoilGrids inputs; Sothe soil class / mask roles | [Geng source table](https://www.nature.com/articles/s41597-025-05460-4.pdf), [surficial materials](https://doi.org/10.4095/205040); exact GEE releases pending | National/regional stratification and categorical extraction |
| Water occurrence, inundation and moisture context | SoilGrids hydrographic family; exact local predictors remain candidates | [JRC water v1.4](https://developers.google.com/earth-engine/datasets/catalog/JRC_GSW1_4_GlobalSurfaceWater), 30 m | New distance/neighbourhood features need local validation |
| Coastal ecosystem, estuary setting and vegetation/salinity groups | Janousek local/context evidence | Original field/site metadata and habitat mapping; exact GEE assets unconfirmed | Pacific coast; preserve estuary identity and ecosystem-specific models |
| Relative tidal elevation and sediment fines below 63 µm | Janousek local relationships; elevation also in the US BRT subset | Tidal-datum measurements/LiDAR and field sediment data; not universally available GEE predictors | Core/local coastal habitat; source vertical datum and 0–30 cm sediment support required |
| Ground ice, permafrost, histels and sediment thickness | Olefeldt expert inputs; Sothe ground-ice stock adjustment | Original provider datasets linked by the studies; exact GEE assets pending | Circumpolar/regional context; keep adjustment separate from regression |
| Bedrock/rooting depth and coarse fragments | Geng bedrock adjustment; Sothe stock corrections | Study/provider layers; not measured everywhere at core resolution | Constrain integration depth and soil volume; report uncertainty |

</details>

<details>
<summary>View the Sothe soil covariate table</summary>

| Family | Names in the supplied soil table | Source period and grid as reported |
|---|---|---|
| Optical reflectance | `L8_B4`, `L8_B5`, `L8_B6`, `L8_B7` | 2015–2019; 30 m |
| Landsat indices | `L8_NDWI`, `L8_NDSI`, `L8_brightness`, `L8_greenness`, `L8_wetness` | 2015–2019; 30 m |
| Vegetation | `MODIS_NDVI`, `MODIS_EVI` | 2000–2019; 250 m |
| Evapotranspiration | `MODIS_ET` | 2000–2019; table column 500 m, description says 1 km |
| Surface temperature | `MODIS_temp_day`, `MODIS_temp_night`, `MODIS_temp_std` | Daily day/night 2000–2019; long-term monthly SD 2000–2017; 1 km |
| Weather | `Daymet_tmax`, `Daymet_tmin`, `Daymet_srad`, `Daymet_ppt` | 2000–2019; 1 km |
| Landsat brightness temperature | `L8_B10`, `L8_B11` | 2015–2019; bimonthly except November–February; native 100 m |
| Terrain | `DEM`, `slope`, `TPI`, `TRI` | ALOS DEM 2006/2011; 30 m |
| L-band radar | `ALOS_L_HH`, `ALOS_L_HV` | 2007/2018 as reported; 25 m; dB |
| Soil class | `soil_type` | SLC 2011; table reports 25,000 m, source map/encoding needs confirmation |
| Prediction depth | `DEPTH` | Manually set to 0, 5, 15, 30, 60, 100 and 200 cm; no native raster spacing |

The supplied table has 29 named entries; the study reports 40 expanded candidates and 25 retained features. The table alone does not establish the exact retained list. Preserve the reported source-resolution ambiguities.

</details>

<details>
<summary>View coastal covariate evidence from Janousek</summary>

| Scale/context | Variables examined | Evidence and availability |
|---|---|---|
| Core/local habitat | Tidal-frame elevation, sediment fines below 63 µm, dominant vegetation and salinity groups | Local regressions/group comparisons; incomplete coverage; fines were averaged over the upper 30 cm |
| Estuary/watershed | Estuary identity, ecosystem type | Local/context factors in the full boosted-regression-tree model |
| Regional coast | Latitude, level-1 ecoregion, Köppen–Geiger zone, estuary geomorphic type | Full model regional factors; geography was not uniformly predictive |
| California–Oregon–Washington subset | Relative tidal elevation plus precipitation, air temperature and maximum VPD | 649-core BRT subset; PRISM 1991–2020 normals at 800 m; not a verified Canada-wide climate stack |

</details>

#### Maps

Soil concentration, density, fixed-depth stocks and peat products. Keep fixed-depth mineral-soil estimates, organic-inclusive stocks and full peat columns separate. PEATGRIDS provides both thickness and carbon; missing values must not appear as high carbon on a map.

<details>
<summary>View soil and peat map products</summary>

| Map/reference | Quantity, depth and support | Access and interpretation |
|---|---|---|
| Sothe concentration | 250 m; images labelled 0, 5, 15, 30, 60 and 100 cm | [Study](https://doi.org/10.1016/j.geoderma.2021.115402); [GEE catalogue](https://gee-community-catalog.org/projects/scs/). Confirm point-depth versus interval semantics and stored scaling before comparison. |
| Sothe soil stocks | 250 m; 0–100 cm as recorded in the updated source catalogue | [Study](https://doi.org/10.1029/2021GB007213); [GEE catalogue](https://gee-community-catalog.org/projects/scs/). Study stock unit is kg C/m²; exact hosted-file identity, encoding and uncertainty meaning retain verification caveats. |
| SoilGrids 2.0 | Concentration, bulk density and carbon density at six intervals to 2 m; hosted native stock band covers 0–30 cm | [Provider](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html); [GEE catalogue](https://gee-community-catalog.org/projects/isric/). A deeper stock derived from density is a separate calculation; preserve organic-layer treatment. |
| Geng 100 m grids | SOC concentration and bulk density at five intervals to 1 m | [CanSIS downloads](https://sis.agr.gc.ca/cansis/nsdb/psm/index.html); [archive](https://doi.org/10.5281/zenodo.15473720). Provider SOC is % and density is g/cm³; original-import encoding checks remain documented. |
| Li et al. peat maps | Regional Hudson/James Bay Lowlands, 30 m; peat thickness and full-column carbon, each with uncertainty | [Study](https://doi.org/10.1029/2024GL110679); [Borealis archive](https://doi.org/10.5683/SP3/TIRAXJ). Archive units are cm and kg C/m²; variable peat depth, not fixed 1 m stock. |
| PEATGRIDS | Global 1 km peat thickness and full-column carbon, including Canadian peatlands | [Provider release](https://zenodo.org/records/15070037); [GEE catalogue](https://gee-community-catalog.org/projects/peatgrids/). Thickness is cm; areal carbon stock is Mg C/m² (×1,000 to kg C/m²). Explicitly mask missing values before display or analysis. |
| Hengl Alberta soil maps | 30 m modelled SOC and bulk density; integrated stocks to 1 m in t/ha | [Study](https://doi.org/10.1139/facets-2023-0040); [viewer](https://g3w.soils.app/en/map/alberta-soil-carbon/). Downloadable release and GEE access require confirmation. |
| Olefeldt thermokarst landscapes | Landscape polygons and associated 0–3 m SOC | [ORNL DAAC archive](https://doi.org/10.3334/ORNLDAAC/1332). Polygon/reference product; distinguish landscape fractions from carbon mass. Deferred from the source project's active comparison workflow. |
| NCSCDv2 | Polygon estimates and rasterisations at 0–30, 0–100, 100–200 and 200–300 cm | [Rasters](https://bolin.su.se/data/ncscd/tiff.php); [pedons](https://bolin.su.se/data/ncscd/pedon.php). Source raster stocks use hg C/m² (÷10 to kg C/m²). SOCC200 is 100–200 cm, not cumulative 0–200 cm; hosted depths vary. |
| Treat synthesis | Review of northern carbon stocks and fluxes | [Publication](https://doi.org/10.1029/2023JG007638). Context and source discovery; this review does not supply an original raster. |

</details>

<details>
<summary>View additional regional soil and sediment products</summary>

| Addition | Canadian relevance and support | Access/status |
|---|---|---|
| McNicol coastal rainforest SOC | BC/southeast Alaska; about 1,300 profiles and 90.5 m map; mineral soil plus organic horizons | [Revised Dryad data](https://doi.org/10.5061/dryad.5jf6j1r); downloadable database/map |
| Arsenault regional peat bathymetry | Argenteuil, Québec; 28 peatlands; site-scale bathymetry and stock estimates, with variable peat-basin depth | [2026 paper](https://doi.org/10.1029/2025JG009407), [data citation](https://doi.org/10.5281/zenodo.17065341); archive files not yet inspected |
| Epstein seabed sediment carbon | Canadian continental margin; 200 m outputs, upper 30 cm stock | [Paper](https://doi.org/10.5194/essd-16-2165-2024), [Borealis archive](https://doi.org/10.5683/SP3/ICHVVA); distinct marine pool |

McNicol also provides profile observations. Its mineral-soil depth plus organic horizons differs from depth measured below the organic surface. Marine sediment is a separate carbon pool; site bathymetry does not imply a national map.

</details>

<details>
<summary>View related flux observations</summary>

| Resource | Measurements and support | Access | Role |
|---|---|---|---|
| ABCFlux v2: Arctic-Boreal CO2 and CH4 In-situ Flux and Environmental Data | Monthly CO2 exchange (NEE, GPP, ecosystem respiration) and CH4 fluxes; Arctic-boreal terrestrial/freshwater sites, 1984–2024; 1,024 sites | [NASA Earthdata record](https://www.earthdata.nasa.gov/data/catalog/ornl-cloud-arctic-boreal-co2-flux-v2-2448-1), [dataset DOI](https://doi.org/10.3334/ORNLDAAC/2448), [Virkkala et al. data paper](https://doi.org/10.5194/essd-18-6357-2026) | Related site-observation resource; keep flux rates separate from carbon stocks |

</details>


## 2. Comparisons

### Forests

- **Ground data:** compare geographic coverage, observation dates, sampling support, measured variables and methods used to estimate biomass or carbon.
- **Covariates:** compare the environmental inputs studies use, their spatial and temporal support, and documented evidence for variable selection or importance.
- **Maps:** compare products with compatible quantities, pools, years and coverage. Explain differences in scope where products cannot be compared directly.

### Soils

- **Ground data:** compare coverage, variable availability, sampling depth, depth datum and completeness. Identify shared observations across compilations where known.
- **Covariates:** compare environmental inputs and their support across soil and peat studies, distinguishing documented inputs from proposed variables.
- **Maps:** compare compatible quantities and depth intervals within shared geographic coverage. Keep concentration, density, stock, peat thickness and full-column peat carbon distinct.

Map-to-observation comparisons will identify differences between a plot or core and the area represented by a map cell. Shared training data will be recorded where known. Agreement between products is not, by itself, evidence of accuracy or independent validation.

Detailed methods, unit conversions, sampling rules and diagnostics will accompany the comparisons. The [existing comparison report](https://cathald.github.io/Carbon_Data_SOD/compare.html) provides the source project's results; conclusions transferred here should retain their version, eligibility rules and limitations.

## 3. How to use

**Google Earth Engine apps are planned.** The tables below are placeholders describing intended uses; they do not represent released apps.

### Forests

<details>
<summary>View planned forest tools: ground data, covariates and maps</summary>

| Data type | Planned tools |
|---|---|
| Ground data | Explore forest plot and sampled-tree observations. |
| Covariates | Explore environmental variables and their spatial and temporal support. |
| Maps | Explore forest biomass and carbon products, keeping pools and units explicit. |

</details>

### Soils

<details>
<summary>View planned soil tools: ground data, covariates and maps</summary>

| Data type | Planned tools |
|---|---|
| Ground data | Explore soil profiles, peat cores and depth observations. |
| Covariates | Explore environmental variables used by soil and peat studies. |
| Maps | Explore soil and peat products, with quantity, depth and units explicit. |

</details>

### Access available now

- **Catalogue:** [CSV tables and complete JSON](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/data/downloads/) describe studies, observations, covariates, maps, assets, methods and QC. See the source [download guide](https://github.com/CathalD/Carbon_Data_SOD/blob/cc14949aceff8dfacc533c759044a353d0fb6d46/DOWNLOADS.md).
- **Provider and GEE references:** [Assets.csv](https://github.com/CathalD/Carbon_Data_SOD/blob/cc14949aceff8dfacc533c759044a353d0fb6d46/data/downloads/Assets.csv) links exact assets and original sources. Some field datasets require a provider request. Public GEE assets still require your own Earth Engine-enabled project for computation.
- **Examples:** the [Earth Engine Code Editor and Python examples](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/examples/) demonstrate access and a small raster download. They belong to the source repository.

Catalogue downloads describe data resources; the original providers retain their source terms. A GEE asset ID is an access route, not a permanent downloadable raster URL.

<details>
<summary>View source files and reproduction resources</summary>

| Source path | Contents |
|---|---|
| [data/downloads/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/data/downloads/) | Current catalogue CSVs and their generated JSON download. |
| [data/catalogue/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/data/catalogue/) | Source evidence, soil methods, QC records, depth audit, citations and presentation crosswalk. |
| [Comparison/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/Comparison/) | Website sources, comparison analysis and reproduction instructions. |
| [scripts/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/scripts/) | Catalogue JSON builder and soil-map QC tool. |
| [docs/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/docs/) | Access notes, QC, source terms, release history and maintainer guidance. |
| [examples/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/examples/) | Short Code Editor and Python access examples. |
| [references/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/references/) | Scientific citations in BibTeX format. |
| [archive/](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/archive/) | Completed imports, the covariate pilot and superseded snapshots. |

These paths describe the existing source repository. See its [rendering and reproduction guide](https://github.com/CathalD/Carbon_Data_SOD/blob/cc14949aceff8dfacc533c759044a353d0fb6d46/Comparison/README.md). The new company repository can copy the needed files progressively; these links remain usable in the meantime.

</details>

## Scope and interpretation

Coverage is strongest for forest biomass and terrestrial soils. Regional peatland, wetland, coastal and other resources are included where documented; this is not an exhaustive inventory of all carbon data in Canada.

When selecting or combining datasets:

- Check the quantity and units: biomass, carbon concentration, carbon density, carbon stock and flux are different quantities.
- Match the carbon pool, depth definition, geographic coverage and reference period.
- Consider the underlying observation and information support. A smaller map cell does not automatically mean more accurate or more detailed information.
- Retain uncertainty definitions and check for overlapping observations or carbon pools before combining results.


<details>
<summary>View the scale and evidence checklist</summary>

| Scale | Information to record |
|---|---|
| Geographic context | Observation coverage, training/validation regions, local modelling zones and final map extent |
| Raster resolution | Native covariate pixel spacing and the grid used for extraction, modelling and map output |
| Observation support | Plot area, nested plots, measurement dates and coordinate accuracy |
| Extraction scale | Pixel, plot footprint, buffer or neighbourhood used to extract predictors |
| Temporal context | Field measurement date, covariate acquisition/composite period and prediction year |

</details>

## Maintaining the catalogue

The source project's current CSVs in `data/downloads/` are its editable catalogue snapshot. If the working Google Sheet is used for editing, export and check those tables before updating the public files. Regenerate the complete JSON and website from the same snapshot to keep them consistent. Preserve stable IDs and source versions when copying records into this repository.

## Sources and contributions

This report builds on the [Carbon State of Data catalogue and analysis](https://github.com/CathalD/Carbon_Data_SOD). Original publications and data releases are linked alongside the records; additional citations are in the source [SOURCES.md](https://github.com/CathalD/Carbon_Data_SOD/blob/cc14949aceff8dfacc533c759044a353d0fb6d46/SOURCES.md), [BibTeX references](https://github.com/CathalD/Carbon_Data_SOD/tree/cc14949aceff8dfacc533c759044a353d0fb6d46/references/) and [CITATION.cff](https://github.com/CathalD/Carbon_Data_SOD/blob/cc14949aceff8dfacc533c759044a353d0fb6d46/CITATION.cff). Each dataset retains its source terms and citation requirements.

This is intended as a community resource. To suggest a missing dataset or report a correction, contact [science@wwfcanada.org](mailto:science@wwfcanada.org) or [cdoherty@wwfcanada.org](mailto:cdoherty@wwfcanada.org). Please include the dataset name, source link or DOI, and a short description of the addition or correction.

Corrections to the underlying catalogue can also be raised through its [GitHub Issues](https://github.com/CathalD/Carbon_Data_SOD/issues) and [contribution guide](https://github.com/CathalD/Carbon_Data_SOD/blob/cc14949aceff8dfacc533c759044a353d0fb6d46/CONTRIBUTING.md). Source terms are summarised in the [licensing note](https://github.com/CathalD/Carbon_Data_SOD/blob/cc14949aceff8dfacc533c759044a353d0fb6d46/docs/release_licensing.md).
