State of Carbon Data in Canada Report


Lots of publicly available data exist for carbon and has been compiled to be available, yet accessing it all and making good use of it is still out of arms reach for alot of individuals who would like to see and possibly use this information for their work. Therefore, in this repository, we have compiled available carbon data, made it accessible is some cases where it was not, and suggest ways it can be applied, today, to various area of interest.

Before we dive in, if you see anything missing, please reach out to science@wwfcanada.org or cdoherty@wwfcanada.org and we will address. This is a community resource, and thus aimed at supporting communities where it can



For simplicity and practical reasons, we have divided these resources based on whether the data is measuring forest biomass (that is trees) or soils, as the data products and outputs tend to be analyzed separately, and reported separately. The reality is these two pools are highly linked ecologically, as the plants are the producers of the organic matter content that will ultimately become the soil, and soil is the substrate that supports and controls plant growth, both dependent on each other and in competition for resources, A siblings rivalry of the ages.

The data is presented in a way that also aims to show how each is derived, which is often contrary to how the data is often portrayed using maps. We show first open and available field data, which shows within reasonable certainty (90-99%) the carbon stock within a defined area. Then we show correlated variable within and around this area, called covariates that are used to relate the relationship of the carbon in the area to measurable aspect of the area around it. These range from ecological, such as ecosystem type, species assemblages and distributions, to geographical, such as parent materials, climate, topography, and remote sensing variables, such as optical sensors (RBG), SAR, liDAR, and derivatives (NDVI). Using field plots and the correlated measures, maps of carbon are produced for different carbon pools, for different scales and areas across the globe.



## Forest Data

1.1 Forest Field Data in Canada

| Resource | Measurements and geographic context | Access and connection to studies |
|---|---|---|
| Canada's National Forest Inventory (NFI) | National ground-plot forest measurements | [Access/contact](https://nfi.nfis.org/en/contact) and [request form](https://nfi.nfis.org/en/datarequestform); coordinate precision and redistribution require confirmation |
| Québec permanent sample plots | Tree and ecological observations in 400 m² plots, principally south of 52° N | [Public GeoPackage and documentation](https://www.donneesquebec.ca/recherche/dataset/placettes-echantillons-permanentes-1970-a-aujourd-hui); used for SCANFI external validation |
| New Brunswick Continuous Land Inventory (CLI) | Regional forest plots used by Betts et al. | [Study](https://onlinelibrary.wiley.com/doi/full/10.1111/gcb.17541) and [analysis archive](https://doi.org/10.6084/m9.figshare.27055528.v1); complete geolocated inventory availability remains to be checked |
| NRCan ENFOR sampled-tree biomass | Canadian tree-level destructive biomass measurements | [Dataset](https://open.canada.ca/data/en/dataset/fbad665e-8ac9-4635-9f84-e4fd53a6253c); supports national allometric equations |
| NASA ABoVE burned/unburned forest plots | Field measurements and derived carbon pools in Alaska, Northwest Territories and Saskatchewan, 1983–2016 | [Published CSV dataset](https://daac.ornl.gov/ABOVE/guides/ABoVE_Plot_Data_Burned_Sites.html); boreal disturbance applications |
| Ontario Vegetation Sampling Network (VSN) | Ground plots supporting Ontario's LiDAR-enhanced forest inventory | [Government description](https://publications.gc.ca/collections/collection_2025/rncan-nrcan/Fo123-2-40-2025-eng.pdf); public measurement download not yet confirmed |

<details>
<summary>NFI — national ground measurements and access</summary>

Request tree measurements, plot metadata, measurement dates, biomass estimates and their calculation methods. Specify the intended geographic area and ask which coordinates can be supplied for covariate extraction.

The [NFI access policy](https://nfi.nfis.org/resources/general/NFI-Business-Process-Version-8.0.pdf) distinguishes access to plot measurements from access to precise locations. Permission to obtain data does not establish permission to republish them in Earth Engine.

Catalogue the request route where public redistribution is unavailable. Keep ground plots separate from NFI photo-plots.

</details>

<details>
<summary>Québec permanent plots — open regional data and repeated measurements</summary>

The dataset describes more than 12,000 permanent plots established since 1970, with repeated measurements. Observations include species, diameter, selected heights and ages, and ecological characteristics.

Download the GeoPackage, code dictionary and README together. The [data guide](https://www.mrnf.gouv.qc.ca/documents/forets/inventaire/guide-donnees-dendometriques.pdf) describes relational tables and the plot–measurement key `ID_PE_MES`. Preserve measurement occasions when joining trees to plots.

The dataset page specifies CC BY 4.0. Ground-plot biomass must retain its allometric method. Québec plots provide a documented external-validation connection to the [SCANFI study](https://doi.org/10.1139/cjfr-2023-0118).

</details>

<details>
<summary>New Brunswick CLI — regional reference data for Betts et al.</summary>

The study used 6,049 plots established in 2016–2020, with 400 m² main plots and nested 50 m² small-tree plots. Tree observations were converted to plot biomass using documented equations.

The publication links an analysis archive, but we have not inspected it to confirm availability of the full geolocated tree/plot inventory. Retain that distinction between an analysis archive and a verified ground-data download.

</details>

<details>
<summary>ENFOR — measured tree biomass and allometric calibration</summary>

Nearly 9,000 trees from 33 species have dry-mass observations for stem wood, stem bark, branches, foliage and twigs. These underpin the Lambert et al. (2005) and Ung et al. (2008) national biomass equations.

- [English CSV](https://apps-scf-cfs.rncan.gc.ca/opendata/Enfor/EnforCanadaBiomassFinalData_v2007-ENG.csv)
- [English metadata](https://apps-scf-cfs.rncan.gc.ca/opendata/Enfor/EnforCanadaBiomassMetadata_v2010-ENG.doc)
- [NRCan biomass calculator and equation parameters](https://apps-scf-cfs.nrcan.gc.ca/calc/en/biomass-calculator?wbdisable=true)

These are tree-level calibration observations. Check coordinates and sampling support before treating them as geolocated plot targets. The government record specifies the Open Government Licence – Canada.

</details>

<details>
<summary>ABoVE — boreal field observations and disturbance carbon</summary>

The synthesis includes burned and unburned sites, tree biophysical measurements, stand age, disturbance history, soil organic-layer measurements and derived combustion estimates.

Retain field measurements separately from reconstructed or calculated carbon pools. Its sampling context is boreal disturbance; link it to the corresponding studies before proposing a general forest-biomass predictor stack.

Download formats and variable definitions are described in the [dataset guide](https://daac.ornl.gov/ABOVE/guides/ABoVE_Plot_Data_Burned_Sites.html). A public GEE table has not yet been confirmed.

</details>

<details>
<summary>Ontario VSN — regional ground plots for LiDAR-supported inventory</summary>

The network supports calibration and validation of Ontario's LiDAR-enhanced forest resources inventory. Catalogue it as a ground-data resource whose access route still needs confirmation.

Obtain the measurement tables, field protocol, dates, plot footprints, coordinate accuracy and redistribution terms from the provider before preparing public GEE assets.

</details>


1.2 Correlated variables of Forest in Canada


| Study | Geographic modelling context | Model/map grid | Predictor evidence |
|---|---|---|---|
| [Betts et al. 2024](https://onlinelibrary.wiley.com/doi/full/10.1111/gcb.17541) | New Brunswick; overlapping 60 × 60 km local zones plus a province-wide model | 30 m | 54 Landsat CCDC features; held-out biomass correlation r = 0.77 |
| [Sothe et al. 2022](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2021GB007213) | Canada-wide forest mapping; reference observations concentrated in BC with additional provinces | 250 m | 58 of 78 predictors retained; canopy-height metrics ranked highest, followed by PALSAR and Landsat variables; five-fold R² = 0.52 |
| [Qin et al. 2025](https://doi.org/10.1016/j.isprsjprs.2025.05.022) | Canada's treed lands | 30 m | Seasonal Sentinel-1/2 and annual L-band SAR; stratified ten-fold validation; exact feature definitions and rankings still to extract |
| [Guindon et al. 2024 — SCANFI](https://doi.org/10.1139/cjfr-2023-0118) | National output assembled from regional tile models | 30 m | Summer/winter Landsat, climate, terrain and auxiliary predictors; photo-plot training and external ground validation |

<details>
<summary>Betts — regional Landsat time-series stack</summary>

The stack contains eight harmonic coefficients plus one fitting RMSE per spectral band, across six bands: 54 variables. Model zones generally required at least 100 CLI plots. The mapping period was 1985–2020.

Initial implementation: six-band Landsat surface reflectance and derived CCDC intercept, trend, seasonal harmonic coefficients and fitting error. Preserve temporal matching to plot measurements.

The original workflow used Landsat Collection 1. A Collection 2 implementation must document its preprocessing changes and be validated.

</details>

<details>
<summary>Sothe — national forest structure, radar and reflectance stack</summary>

Initial implementation: maximum canopy height, height percentiles 85 and 95, PALSAR HH/HV backscatter, Landsat reflectance and documented spectral indices. Confirm individual retained features against Supporting Information Table S1.

Most forest covariates represented 2015–2019 and were aggregated/resampled to 250 m. The published height metrics came from spatial modelling of ICESat-2 observations.

The methods identify BC provincial observations and NFI observations from other provinces. Some rounded coordinates were unsuitable for 250 m spatial matching. The exact BC source release remains to be identified.

</details>

<details>
<summary>Qin — national seasonal optical and radar stack</summary>

Proposed extraction variables: Sentinel-1 VV/VH and seasonal Sentinel-2 reflectance, alongside annual PALSAR HH/HV. The paper supports the multi-sensor modelling approach; the exact band subset, seasonal windows, transformations and variable-level evidence must be recovered before calling this a reproduced study stack.

[Publication and access links](https://www.sciencedirect.com/science/article/pii/S0924271625002096) include the authors' GEE App and mapping scripts. Match the forest mask, observation dates and validation procedure.

</details>

<details>
<summary>SCANFI — regional models, photo-interpreted targets and ground validation</summary>

SCANFI v1 trained on NFI photo-interpreted plots; biomass targets included estimates derived from inventory volume and biomass equations. Ground plots served external validation.

Initial implementation: summer and winter Landsat reflectance composites. Climate, terrain and auxiliary layers will be specified after extracting their exact definitions from the methods.

Record regional modelling/search support alongside the 30 m output grid. Keep internal photo-plot validation and independent ground validation metrics separate. Version 2 metadata and methods must be recorded separately from the 2024 v1 study.

</details>

### Covariates proposed for the first extraction workflows

These variables are planned; extraction scripts and derived assets are not yet published. Study-specific subsets will retain their own definitions and evidence.

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

Covariate availability, temporal coverage, masking and aggregation rules must accompany every extraction workflow. For new regions, evaluate the selected stack with local observations.


1.3 Forest Carbon Maps


| Resource | Description | Access |
|---|---|---|
| McMaster/WWF forest carbon | Canadian forest carbon stock and uncertainty maps at 250 m | [Awesome GEE](https://gee-community-catalog.org/projects/scs/) |
| SCANFI v1.2 | Canadian 2020 forest attributes, including aboveground biomass, at 30 m | [Earth Engine catalogue](https://developers.google.com/earth-engine/datasets/catalog/projects_gcpm041u-lemur_assets_scanfi_v12_SCANFI_v1_2) |
| ESA CCI Biomass v6 | Aboveground woody biomass and uncertainty for selected years from 2007–2022 | [Awesome GEE](https://gee-community-catalog.org/projects/cci_agb/) |
| Canadian Satellite-Based Forest Inventory | Modelled forest polygons with biomass, structure, species and disturbance attributes | [Awesome GEE](https://gee-community-catalog.org/projects/ca_sbfi/) |

<details>
<summary>McMaster/WWF — carbon pools and exact asset references</summary>

The forest stock product includes aboveground, belowground and dead plant material, with carbon-stock units of kg C/m².

- Stock image: `projects/sat-io/open-datasets/carbon_stocks_ca/fc/fc_250m_version10`
- Uncertainty image: `projects/sat-io/open-datasets/carbon_stocks_ca/fc/fc_uncertainty_250m_version10`
- Both images use band `b1`; checked nominal pixel size is approximately 250.02 m.

Match the uncertainty image's definition to the source release before interpreting its values. Ground sources and predictor evidence are described in the Sothe entry above.

</details>

<details>
<summary>SCANFI — existing 2020 asset and historical v2 downloads</summary>

- Existing GEE image: `projects/gcpm041u-lemur/assets/scanfi_v12/SCANFI_v1_2`
- Biomass band: `biomass`, in tonnes/ha.
- Other attributes include height, crown closure, land cover and species composition.

[SCANFI v2 downloads](https://download-telecharger.services.geo.ca/pub/nrcan_rncan/Forests_Foret/SCANFI/v2/) provide 30 m maps in five-year intervals from 1985–2025. Our v2 GEE collection is being prepared; the existing public v1.2 asset is a separate release.

</details>

<details>
<summary>ESA CCI — biomass time series and standard deviation</summary>

GEE ImageCollection: `projects/sat-io/open-datasets/ESA/ESA_CCI_AGB`

Version 6 has ten images: 2007, 2010 and each year from 2015–2022. Bands are `AGB` and `SD`, representing aboveground woody biomass and its standard deviation in Mg/ha. The product uses a 100 m grid.

Retain its calibration and validation provenance from the source documentation. Satellite-derived estimates do not replace field observations in the ground-data catalogue.

</details>

<details>
<summary>SBFI — modelled stand polygons and biomass summaries</summary>

GEE FeatureCollection: `projects/sat-io/open-datasets/CA_FOREST/CA_SBFI/CA_SBFI_MERGED`

Confirmed field names:

| Field | Meaning | Units |
|---|---|---|
| `088_STRUCTURE_AGB_AVG` | Mean aboveground biomass density | tonnes/ha |
| `089_STRUCTURE_AGB_SD` | Within-polygon biomass variation | tonnes/ha |
| `091_STRUCTURE_AGB_TOTAL` | Total aboveground biomass | tonnes |
| `003_AREA_HA` | Polygon area | ha |

SBFI describes modelled stand conditions for 2020 with disturbance information for 1985–2020. Its polygons are a modelled inventory product. The biomass SD is a spatial summary statistic, not a model prediction-error estimate.

</details>




## Soil Data

2.1 Soil Core data in Canada

| Preparation | Profile/location rows | Layer rows | Current asset names | Original resource |
|---|---:|---:|---|---|
| WoSIS Canada | 8,825 | 43,055 | `wosis_canada_profiles_v2`; `wosis_canada_layers_v2` | [ISRIC WoSIS](https://docs.isric.org/globaldata/wosis/) |
| National Pedon Database | 9,017 | 48,371 | `npdb_canada_profiles_v1`; `npdb_canada_layers_v1` | [CanSIS NPDB](https://sis.agr.gc.ca/cansis/nsdb/npdb/index.html) |
| NRCan peat profiles (local CanPeat preparation) | 1,217 | 37,072 | `canpeat_profiles_v1`; `canpeat_layers_v1` | [Confirmed provider](https://app.geo.ca/en-ca/map-browser/record/e287b0dd-8b07-435b-8a76-0c7ec84ac228); [Bauer et al. 2024](https://doi.org/10.1002/ecy.4398) |
| Janousek coastal blue carbon | 1,284 | 23,018 | `janousek_profiles_v1`; `janousek_layers_v1` | [Janousek et al. 2025](https://doi.org/10.1029/2024GB008239); [Smithsonian archive](https://doi.org/10.25573/serc.28127486.v1); Pacific coast across Canada, US and Mexico |
| Riley preparation | 347 sampling-location groups | 1,584 | `riley_profiles_v1`; `riley_layers_v1` | Exact OGS report(s), table and release pending |

<details>
<summary>Observation provenance, depth and overlapping compilations</summary>

Our uploads are preparations from supplied resources, not necessarily the historical training releases used by the publications below. Preserve original identifiers, source methods, dates, location uncertainty and licences. Layers within a core are repeated depth observations, not independent sampling locations.

WoSIS v2 restores metadata lost during the original join and corrects the stock conversion. Only 102 Canadian layers in these supplied tables have sufficient inputs for organic-carbon stock estimates; most remaining rows are concentration observations. Stock sums are partial where measurements are missing and lack coarse-fragment adjustment. WoSIS v1 is superseded for new analyses.

Riley groups by NTS, peatland number and sampling point; four groups contain overlapping depth intervals. Bulk-density units and separate core identities need confirmation before stock integration. Janousek retains repeated source layer IDs with flags. Reconcile shared observations between NPDB, WoSIS and peat compilations before model validation.

The [Can-Peat metadata portal](https://uwaterloo.ca/can-peat/research/canadian-peatland-data-portal) is a discovery/access resource. It is distinct from our local CanPeat files, now reconciled to the NRCan/Bauer peat profile database. The [Loisel et al. 2014 northern peatland synthesis](https://doi.org/10.1177/0959683614538073) is another distinct source, explicitly connected to the Sothe soil work. Community cores are excluded from the present repository workflow.

</details>

### Studies, geographic context and map scales

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

<details>
<summary>Sothe — national concentration and stock studies</summary>

The [Geoderma author record](https://experts.mcmaster.ca/scholarly-works/2123723) reports six intervals to 1 m, 83% explained variation and an 80% prediction interval. The exact six boundaries need the paper/map metadata: the supplied five-boundary list is incomplete and must not be silently relabelled as GlobalSoilMap's six intervals to 2 m.

The GBC methods identify 6,490 WoSIS sites/39,323 layers plus 43 Lehigh sites/298 layers: 6,533 SOC locations and 39,621 layers. Bulk density has 11,068 layers at 2,157 sites. These are not all paired SOC–density observations. Forty candidates mostly describe 2000–2019; 25 were retained for SOC. Five-fold results are whole-model evidence. Supporting Information Table S2 has now been inspected and catalogued below; exact temporal expansion and feature retention remain to reconcile.

Land-cover masks, ground-ice, coarse-fragment and rooting-depth adjustments are stock-construction inputs. Record them separately from fitted predictors. Publication year is not a uniform field sampling or map observation year.

</details>

<details>
<summary>SoilGrids — global models and product units</summary>

[Poggio et al.](https://soil.copernicus.org/articles/7/217/2021/) describe climate, ecology, geology, land cover, terrain, vegetation, spectral and hydrographic covariates. Seasonal means and variability commonly cover 2001–2015. Keep layers of each profile together in validation. This supports the fitted global model, not independent proof for every candidate.

[ISRIC layer documentation](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html) distinguishes `soc` concentration (stored dg/kg; divide by 10 for g/kg), `ocd` density (hg/m³; divide by 10 for kg/m³), and `ocs` stocks (t/ha; divide by 10 for kg/m²). Six intervals span 0–200 cm. The documented stock release is 0–30 cm; deeper stock products are described as in development. A 0–100 cm sum derived from density must carry its own method and cannot be presented as the native released stock layer. Organic surface-layer treatment differs from peat-inclusive products.

</details>

<details>
<summary>Geng — exact families and time windows from Table 1</summary>

[Table 1 in the paper](https://www.nature.com/articles/s41597-025-05460-4.pdf) specifies TerraClimate monthly maximum/minimum temperature and precipitation normals for 1958–2020; annual precipitation; MODIS day/night LST monthly means for March–November 2000–2017; MOD13Q1 NDVI monthly means for March–September 2000–2021 plus two 2020 composites; MCD43A4 band 7 monthly means; peak Landsat-8 NDVI in 2020; 2020 land cover; terrain, depth to bedrock and surficial materials.

Terrain includes landforms, ridge/valley flatness, plan/profile curvature, slope, topographic position, valley depth, relative hillslope position and wetness index. The source DEM grid is 16 m; the table links a Canadian elevation resource, not ALOS. These are model inputs; SOC-specific variable rankings remain to extract. Native source grid, derived terrain scale and output grid stay separate. Regional comparisons do not establish field-level accuracy.

</details>

<details>
<summary>Hengl — regional agricultural modelling and multiscale terrain</summary>

[Methods section 2.2](https://www.facetsjournal.com/doi/10.1139/facets-2023-0040) identifies ClimateNA v7.3 normals (1990–2010, 1 km), ALOS terrain derivatives, MODIS EVI, PROBA-V NDVI, Landsat GLAD seasonal P25/P50/P75 composites and geological indicators. Landsat is the main optical input; Sentinel-2 is discussed as an alternative. Terrain derivatives use 30, 100 and 250 m scales.

Field intervals are 0–15, 15–30, 30–60 and 60–100 cm; model predictions are integrated to stocks in t/ha. Reported SOC/density model R² values are 0.61/0.68. Exact retained features, Figure 3 importance values, resampling support and downloadable field/map releases remain to catalogue. Contemporary GEE substitutes require a new workflow definition.

</details>

<details>
<summary>Circumpolar products — expert classification, soil-map upscaling and review</summary>

[Olefeldt's dataset](https://doi.org/10.3334/ORNLDAAC/1332) combines permafrost zonation, ground ice, sediment thickness, boreal/tundra ecoregions, ruggedness and histel coverage through expert weights. Its landscape coverage estimates and associated SOC are polygon summaries, not pixel-level learned relationships.

[NCSCDv2](https://bolin.su.se/data/ncscd/) supplies polygon data, rasterizations and point pedons. The raster download page reports stored stocks in hg C/m²; verify selected files and divide by 10 for kg C/m². Canada LAEA rasterization is available at 1 km. Record the chosen rasterization and source-map scale; changing pixel size does not improve the underlying soil-map detail. Depths include 0–30, 0–100, 100–200 and 200–300 cm.

Treat is a synthesis reference. Its northern peatland and Yedoma references are additional resources to catalogue with their exact dataset versions. Review/process evidence is not a predictor ranking.

</details>




2.2 Correlated variables for soils in Canada



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

<details>
<summary>How the existing Colab notebook fits this catalogue</summary>

[MultiScale_CovariateExtraction.ipynb](MultiScale_CovariateExtraction.ipynb) is retained as an existing extraction reference: 43 covariates plus four observation-count QA bands, a 30 m output grid, 120 m and 1,000 m context radii, and 2019–2023 composites. Its selected source CSV initially includes Riley and CanPeat.

These scales are workflow choices, not published proof that each feature predicts soil carbon at those supports. Dynamic World probabilities, Sentinel-2 NDMI, Sentinel-1 ratios, ERA5 summaries and the chosen context radii remain candidate extensions until matched to a soil study or tested with profiles. ERA5 cannot silently replace Daymet, TerraClimate or ClimateNA in a reproduced study stack. Community cores are excluded by our current scope; the notebook itself is unchanged.

</details>

<details>
<summary>Sothe Table S2 — named covariates, source grids and reported ambiguities</summary>

The supplied Supporting Information SI-S01 was inspected directly. Its soil table is [catalogued as structured data](data/catalogue/sothe_2022_soc_covariates.json), preserving names, descriptions, source periods, units and reported resolutions. The table has 29 named entries; Figure S5 reports 40 expanded candidates and 25 retained features. Table S2 alone does not identify which expanded features were retained.

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

Keep these source grids separate from the national 250 m modelling grid. Preserve table inconsistencies rather than silently correcting them. Collection 1 composites and brightness-temperature bands are not equivalent to contemporary Collection 2 surface-temperature products. The exact temporal expansion and retained-feature list remain to reconcile with the ranking figure/code. The listed point depths do not by themselves establish the concentration release's six interval boundaries.

Source: [Sothe et al. (2022), Supporting Information S1](https://doi.org/10.1029/2021GB007213), Table S2 and Figure S5; file supplied by the repository maintainer. The document contains a Table S1 caption adjacent to the soil table; the soil-specific contents and Table S2 caption identify the extracted table.

</details>

<details>
<summary>Janousek 2025 — coastal blue carbon and local versus regional factors</summary>

[Publication](https://doi.org/10.1029/2024GB008239) · [Smithsonian dataset v1](https://doi.org/10.25573/serc.28127486.v1)

The study covers 1,284 coastal sediment cores from Alaska to Mexico, including BC. It compares seagrass, emergent marsh, mangrove, tideflat and tidal-swamp ecosystems. Stocks were analysed to 30, 50 and 100 cm using progressively smaller core subsets. It does not publish a new uniform-resolution SOC raster.

| Scale/context | Variables examined | Evidence and availability |
|---|---|---|
| Core/local habitat | Tidal-frame elevation, sediment fines below 63 µm, dominant vegetation and salinity groups | Local regressions/group comparisons; incomplete coverage; fines were averaged over the upper 30 cm |
| Estuary/watershed | Estuary identity, ecosystem type | Local/context factors in the full boosted-regression-tree model |
| Regional coast | Latitude, level-1 ecoregion, Köppen–Geiger zone, estuary geomorphic type | Full model regional factors; geography was not uniformly predictive |
| California–Oregon–Washington subset | Relative tidal elevation plus precipitation, air temperature and maximum VPD | 649-core BRT subset; PRISM 1991–2020 normals at 800 m; not a verified Canada-wide climate stack |

Variance was partitioned within estuary, climate zone, ecoregion and among ecoregions. Overall local/estuary factors explained more variation than broad climate gradients. Köppen–Geiger classes used a 0.0083° grid with fallback classifications; those are covariate supports, not carbon map resolution.

Tidal elevation requires local datums and suitable vertical accuracy. A general 30 m DEM is not a demonstrated replacement. Sediment fines and field vegetation/salinity observations are not automatically available everywhere in GEE.

The supplied `Global_Core_Locations.csv` contains estuary, ecoregion, climate-zone, tidal-elevation, vegetation and depth-standard stock fields. Our current v1 summaries preserve only part of that context. Restore the remaining metadata by original core ID before reproducing the study analysis; raw depth/stock extrapolation rules and estimation flags also need to remain explicit.

</details>

<details>
<summary>Canadian peat profiles — confirmed provider, units and measurement flags</summary>

[Geo.ca record](https://app.geo.ca/en-ca/map-browser/record/e287b0dd-8b07-435b-8a76-0c7ec84ac228) · [Bauer et al. (2024) data paper](https://doi.org/10.1002/ecy.4398)

The resource is the NRCan Peat Profile Database supporting CaMP v2.0. On 14 October 2026, provider CORESITES/PROFILES downloads were compared row by row against the supplied local raw tables. All 1,217 core identifiers and 37,072 layer rows matched for checked coordinates, depths, carbon, density, stock and measurement-status attributes, after normalizing missing values, numeric formatting and text encoding.

The provider documents depths in cm, bulk density in g/cm³, carbon content in percent and carbon mass in Mg C/ha. The provider record is used for density units; the data-paper abstract contains a conflicting cubic-metre wording.

Source flags identify 34,401 measured and 2,265 estimated bulk-density rows, with 406 blank flags. Organic-carbon flags identify 736 measured and 35,929 estimated rows, with 407 blank flags. Estimated organic carbon includes values derived from other measurements; this is a source classification, not a claim that all estimated values are unsupported.

Our v1 layers retain `BD_MEAS_EST` but omit `C_ORG_MEAS_EST`, `C_ORG_EST_TYPE`, `C_TOT_MEAS_EST` and `C_TOT_EST_TYPE`. Core summaries omit measured percentages and coordinate-accuracy notes. Restore these before treating the compilation as wholly measured training/validation data. Preserve `SAMP_CARB_MGHA` as the provider's sample-carbon mass; its v1 alias `TOTC_Stock` must not determine carbon-pool interpretation.

Download together: [CORESITES](https://ftp.maps.canada.ca/pub/nrcan_rncan/Forests_Foret/peatlands/CORESITES.csv), [PROFILES](https://ftp.maps.canada.ca/pub/nrcan_rncan/Forests_Foret/peatlands/PROFILES.csv), [REFERENCES](https://ftp.maps.canada.ca/pub/nrcan_rncan/Forests_Foret/peatlands/REFERENCES.csv), [SOURCEDATA](https://ftp.maps.canada.ca/pub/nrcan_rncan/Forests_Foret/peatlands/SOURCEDATA.csv), [LOOKUP](https://ftp.maps.canada.ca/pub/nrcan_rncan/Forests_Foret/peatlands/LOOKUP.csv) and [WATER](https://ftp.maps.canada.ca/pub/nrcan_rncan/Forests_Foret/peatlands/WATER.csv). REFERENCES connects original studies to cores through SOURCEDATA. This database is distinct from the Waterloo Can-Peat metadata portal. The data paper specifies attribution/noncommercial reproduction terms; confirm applicable dataset metadata before redistribution.

</details>

<details>
<summary>Alberta viewer access — source confirmed, downloads unresolved</summary>

The Hengl paper identifies [this map viewer](https://g3w.soils.app/en/map/alberta-soil-carbon/) for visualizing predictions. A verified HTTPS request on 14 October 2026 failed because the server certificate did not match `g3w.soils.app`; the web retrieval tool also could not load it. This describes the observed access failure, not proof that all hosting services are unavailable.

The viewer link does not establish a downloadable field dataset, raster package or public GEE asset. These access routes remain unresolved. Request the 404-location field dataset, soil/density rasters, derived stock maps, covariate manifest and reuse terms from the study provider if no archive can be located. No provider contact has been sent from this repository workflow.

</details>

2.3 Soil carbon maps


| Map/reference | Depth/product | Access and current GEE status |
|---|---|---|
| Sothe concentration | Six image point-depth labels: 0, 5, 15, 30, 60, 100 cm; verify stored units and release semantics | [Study](https://doi.org/10.1016/j.geoderma.2021.115402); [Awesome GEE](https://gee-community-catalog.org/projects/scs/): `projects/sat-io/open-datasets/carbon_stocks_ca/scc` |
| Sothe stocks — initial Canada reference | Hosted estimate and uncertainty: **0–1 m (maintainer working assumption; not source-verified)** | [Study](https://doi.org/10.1029/2021GB007213); Awesome GEE collection `projects/sat-io/open-datasets/carbon_stocks_ca/sc` |
| SoilGrids 2.0 | Concentration/density at six intervals to 2 m; native released stock 0–30 cm | [Provider access](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html), [GEE catalogue](https://gee-community-catalog.org/projects/isric/); `projects/soilgrids-isric/soc_mean`, `ocd_mean`, `ocs_mean` |
| Geng 100 m grids | SOC %, bulk density and other soil properties at five intervals to 1 m; quantiles | [CanSIS downloads](https://sis.agr.gc.ca/cansis/nsdb/psm/index.html), [archive](https://doi.org/10.5281/zenodo.15473720), [code](https://github.com/CanSISPSM/PSM100mCanada); user-reported completed ImageCollection `projects/northstarlabs/assets/canada_carbon_collection` with all ten BD/SOC prediction images; loads in supplied output; numerical/provenance QC pending |
| Li et al. (2025) — Hudson/James Bay lowlands | Regional, 30 m peat depth and carbon stock, each with uncertainty; **variable modelled peat depth** | [Study](https://doi.org/10.1029/2024GL110679), [Borealis archive](https://doi.org/10.5683/SP3/TIRAXJ); four local copies confirmed, [IDs and copy status](docs/soil_map_inventory.md#li-et-al-2025--regional-hudson-bay-lowlands-peat-maps) |
| Hengl Alberta 30 m | Modelled SOC/density; integrated stocks to 1 m in t/ha | [Study](https://doi.org/10.1139/facets-2023-0040), [published viewer](https://g3w.soils.app/en/map/alberta-soil-carbon/); certificate/access issue observed; raster download and GEE asset unconfirmed |
| Olefeldt thermokarst landscapes | Polygon landscape fractions and associated 0–3 m SOC | [ORNL DAAC archive](https://doi.org/10.3334/ORNLDAAC/1332); user-supplied GEE table `projects/carbon-learning-library/assets/Circumpolar_Thermokarst_Landscapes`, runtime QC pending |
| NCSCDv2 | Polygon stocks; rasterized 0–30, 0–100, 100–200, 200–300 cm | [Maps](https://bolin.su.se/data/ncscd/tiff.php) and [pedons](https://bolin.su.se/data/ncscd/pedon.php); three user-supplied Canada WGS84 0.012° assets (SOCC30/100/200), [exact IDs](docs/soil_map_inventory.md#newly-supplied-gee-references); runtime QC pending |
| Treat synthesis | Review of existing stocks/fluxes | [Publication](https://doi.org/10.1029/2023JG007638); no original raster to upload |


For the supplied NCSCDv2 imports, source definitions distinguish 0–30 cm, 0–100 cm and the deep **100–200 cm** stock layer (SOCC200). Verify the imported file metadata before interpreting or integrating values. The selected source raster grid is 0.012°; native gridded stock units are hg C/m² unless converted during preparation.

The assistant has not independently executed GEE. The maintainer's supplied output confirms source loading: two Sothe stock/uncertainty members, six Sothe concentration images, SoilGrids SOC/BD/OCD with six bands each, SoilGrids OCS with only `ocs_0-30cm_mean`, all ten Geng IDs, 132,089 thermokarst features, and three NCSCDv2 rasters. SoilGrids property grids and NCSCDv2 depth grids have some different origins; preserve native copies and align deliberately before arithmetic. Latest expanded output confirms Sothe stock and uncertainty each have one `b1` with empty properties, both are assigned 0–1 m for this repository under the maintainer's working assumption, not verified from asset metadata. Check image IDs, bands, depths, scaling and uncertainty definitions before use; do not mosaic stock and uncertainty members together. Soil maps are predictions/reference products, not extra ground observations or automatically independent validation data. The initial reference label is a workflow choice, not a claim of universal superiority.

<details>
<summary>Li et al. regional peat depth, carbon and uncertainty</summary>

Hudson Bay Lowlands (Hudson/James Bay region), reported 30 m output. **Carbon stock covers a spatially varying modelled peat column.** Record the depth basis as variable; retain the paired peat-depth layer. It cannot be compared directly with a fixed 1 m or 2 m stock without accounting for depth support.

The [inventory](docs/soil_map_inventory.md#li-et-al-2025--regional-hudson-bay-lowlands-peat-maps) lists all four supplied assets. [05_Copy_Li_HBL_Maps.js](scripts/05_Copy_Li_HBL_Maps.js) prepares native copies under `soils/maps/li_2025_hbl`, including the two carbon assets in the other project. All four copies are confirmed by maintainer output: each loads with one `b1` and the same reported 30 m transform. The full CRS, stored units/scaling and masks remain to check; original assets are retained. The [provenance record](data/catalogue/li_2025_hbl_maps.json) distinguishes study definitions from unverified import encoding.

Uncertainty is kept separate from predictions. Public validation peat depths and restricted training peat depths are distinguished in the source record. The regional covariate manifest remains a follow-up task.

</details>

<details>
<summary>Copy external maps into our soils/maps assets</summary>

Run [04_Copy_External_Soil_Maps.js](scripts/04_Copy_External_Soil_Maps.js) in the GEE Code Editor. It creates four child folders and copies 16 external assets without overwrite, clipping, resampling or conversion: eight Sothe images, four global SoilGrids images, three NCSCDv2 images and one thermokarst table. Exact source/destination pairs and citations are in the [manifest](data/catalogue/soil_map_copy_manifest.json).

Copies run directly through the asset API; watch the Console and refresh Assets, with no export Tasks to start. Rerunning skips existing destinations without certifying their provenance. **Completed: maintainer Console output confirms 16 copied, 0 failed, 0 skipped and expected destination types for all assets.** The later 30-asset pixel pass and [41-reference sharing audit](docs/public_access.md) supersede the original pending checks. Geng remains in its existing collection. Source encoding, original licences and depth/method caveats remain recorded separately.

</details>

<details>
<summary>Source gaps to resolve before exact study reproduction</summary>

- Sothe Geoderma exact mapped depth boundaries; temporal expansion of Table S2 entries and the exact retained-feature manifest. GBC Table S2 is now catalogued.
- Hengl field-data/map archive, exact retained covariates and Figure 3 importance data.
- Riley original OGS report(s)/table, density units, coordinate derivation and reuse terms.
- Restore NRCan peat carbon estimation flags and source/location metadata; enrich Janousek tables with the original study covariates. Provider citations are now identified.
- Historical WoSIS/Lehigh training snapshots and cross-source duplicate relationships; our current uploads are not an exact recreation of those study training sets.
- Provider metadata and GEE access checks for maps/corrections without confirmed asset IDs.

Full-column study provenance, native grids, output grids, extraction supports, units, licences, dates, validation design and uncertainty definitions will accompany the catalogue spreadsheet. This section establishes the source-backed shortlist; missing supplements are explicitly pending rather than filled with inferred bands.

</details>
### Related flux observations — catalogue only

| Resource | Measurements and support | Access | Use in this repository |
|---|---|---|---|
| ABCFlux v2: Arctic-Boreal CO2 and CH4 In-situ Flux and Environmental Data | Monthly CO2 exchange (NEE, GPP, ecosystem respiration) and CH4 fluxes; Arctic-boreal terrestrial/freshwater sites, 1984–2024; 1,024 sites | [NASA Earthdata record](https://www.earthdata.nasa.gov/data/catalog/ornl-cloud-arctic-boreal-co2-flux-v2-2448-1), [dataset DOI](https://doi.org/10.3334/ORNLDAAC/2448), [Virkkala et al. data paper](https://doi.org/10.5194/essd-18-6357-2026) | Table/resource link only; excluded from map loading and visualization |

This is an independently cited flux synthesis related to the subject of Treat's review, not a new raster produced by Treat et al. (2024). Flux rates are different quantities from soil carbon stocks; retain variable-specific units, measurement methods, temporal aggregation and sign conventions. Do not assign an arbitrary raster resolution to site observations.

## Scope

- Field plot and soil core observations.
- Ecological, geographic, climatic and remote sensing covariates.
- Forest biomass, forest carbon and soil carbon maps.

Biomass and carbon are recorded separately. Consult each dataset's definitions, units, uncertainty documentation and licence before combining products. Source dependencies will be linked through ground-data, covariate-stack, study and map identifiers in the catalogue spreadsheet.

## Contributing

Suggest additions or corrections through [GitHub Issues](https://github.com/CathalD/Carbon_Data_SOD/issues). Include the dataset name, source link or DOI, licence, geographic context, pixel/plot support, and Earth Engine asset ID if available. For covariates, include the supporting study and predictive evidence.

Each dataset retains its original licence and citation requirements.

<details>
<summary>Other sources</summary>


## What to note as you use this information:

## Scales and evidence

| Scale | Information to record |
|---|---|
| Geographic context | Observation coverage, training/validation regions, local modelling zones and final map extent |
| Raster resolution | Native covariate pixel spacing and the grid used for extraction, modelling and map output |
| Observation support | Plot area, nested plots, measurement dates and coordinate accuracy |
| Extraction scale | Pixel, plot footprint, buffer or neighbourhood used to extract predictors |
| Temporal context | Field measurement date, covariate acquisition/composite period and prediction year |

<details>
<summary>How to interpret scale and predictive evidence</summary>

A Canada-wide map may combine regional models, and observations may be unevenly distributed across provinces. Record these separately. A 30 m pixel is not a 30 m field plot, and resampling a coarse layer to a finer grid does not create finer observations.

Each study–covariate entry will record whether a variable was considered, retained after selection, ranked by importance, or tested through a predictive comparison. Record the validation design, metric and study region. Whole-model performance does not establish the independent contribution of every predictor or its performance in a new region.

Ground measurements, photo-interpreted attributes, allometrically estimated biomass, satellite-derived estimates and map predictions retain their own provenance.

</details>




## Other resources not listed above:

| Addition | Canadian relevance and support | Access/status |
|---|---|---|
| Shaw upland forest soil database | 3,253 pedons; forest-floor and mineral soil to 100 cm | [Data paper and supplements](https://doi.org/10.1002/ecy.2159); assess reuse terms and shared-profile overlap |
| McNicol coastal rainforest SOC | BC/southeast Alaska; about 1,300 profiles and 90.5 m map; mineral soil plus organic horizons | [Revised Dryad data](https://doi.org/10.5061/dryad.5jf6j1r); downloadable database/map |
| Arsenault regional peat bathymetry | Argenteuil, Québec; 28 peatlands; variable peat-basin depth | [2026 paper](https://doi.org/10.1029/2025JG009407), [data citation](https://doi.org/10.5281/zenodo.17065341); archive files not yet inspected |
| Martens coastal BC peatlands | Six peatlands; new field observations alongside reused NRCan peat records | [2026 paper](https://doi.org/10.1038/s41598-026-44791-z), [data citation](https://doi.org/10.5281/zenodo.17533263); files not yet inspected |
| PEATGRIDS | Canadian subset of global 1 km peat thickness and variable-depth carbon | [Awesome GEE](https://gee-community-catalog.org/projects/peatgrids/); documented assets, runtime/encoding checks pending |
| Lamping coastal forest biomass | Coastal BC/Alaska, 30 m; live biomass and structural attributes | [GeoTIFF archive](https://doi.org/10.5281/zenodo.13932139); biomass is not automatically carbon |
| Gross Alberta agroforestry | Local grassland/cropland/hedgerow/shelterbelt biomass, deadwood and soil pools | [Dryad CSV data](https://doi.org/10.5061/dryad.0zpc86711); coordinates/schema need checking |
| Pendea freshwater wetlands | Lake Simcoe watershed; eight 50 cm cores in marshes/swamps | [Paper](https://doi.org/10.1029/2023JG007561), [Borealis archive](https://doi.org/10.5683/SP3/OJRV2I); retain depth versus dated-horizon distinctions |
| Clayoquot marsh cores | Seven BC marshes; 34 cores and multiple stock-depth supports | [PANGAEA download](https://doi.org/10.1594/PANGAEA.947825); check overlap with Janousek |
| Epstein seabed sediment carbon | Canadian continental margin; 200 m outputs, upper 30 cm stock | [Paper](https://doi.org/10.5194/essd-16-2165-2024), [Borealis archive](https://doi.org/10.5683/SP3/ICHVVA); distinct marine pool |

**Can-Peat, NRCan peat profiles and C-PEAT are different resources**

Our existing `canpeat_*` asset names refer to the NRCan/Bauer Peat Profile Database. The [Waterloo Can-Peat portal](https://uwaterloo.ca/can-peat/research/canadian-peatland-data-portal) is a metadata discovery service linking original sources; Li already appears there. It does not supply an additional independent set of cores merely by listing a study.

[C-PEAT v.2025](https://doi.org/10.1594/PANGAEA.986891) is a separate global peat-core synthesis; select and deduplicate the Canadian records. [Hugelius northern peat maps v2](https://bolin.su.se/data/hugelius-2020-peatland-2) are another coarse reference, available at 10 km or 0.1°, distinct from NCSCDv2. Can-Peat's integrated national-map activity remains a project lead until a released map is verified.


**Grasslands, prairie wetlands and other carbon pools**

The full review also lists [Alberta pasture properties/management](https://doi.org/10.5061/dryad.c2fqz6175), [BC grassland modelling](https://doi.org/10.1080/15481603.2017.1302181) and [Saskatchewan drained-wetland SOC](https://doi.org/10.3389/fenvs.2024.1353802). Access varies: Alberta pasture coordinates are withheld; the other studies do not establish verified public geolocated training tables. Carbon concentration is distinct from stock.

[Cowichan blue carbon](https://doi.org/10.3389/fmars.2022.857586), [Blue Carbon Canada](https://www.bluecarboncanada.ca/publications-data), [ECCC lake sediment chemistry](https://open.canada.ca/data/en/dataset/0af54117-bb0b-4e86-8f3f-2f277158e071) and the [Parks Canada Carbon Atlas](https://publications.gc.ca/collections/collection_2024/pc/R62-581-2023-eng.pdf) broaden the resource list. Chemistry, habitat extent, fluxes and modelled accounting remain clearly labelled.

Coverage still needs improvement for grassland/root biomass, deadwood/litter, Atlantic/Arctic coastal cores, inland-water stocks and deeper permafrost. Do not infer these pools from canopy cover or sum overlapping peat/soil products.

</details>



