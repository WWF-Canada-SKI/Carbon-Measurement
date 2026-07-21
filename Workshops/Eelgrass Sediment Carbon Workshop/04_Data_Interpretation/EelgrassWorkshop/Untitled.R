source("00_config.R")
source("01_data_prep.R")
source("02_exploratory_analysis.R")
source("03_depth_harmonization.R")
source("04_simple_extrapolation.R")
source("05_kriging.R")

quarto::quarto_render("eelgrass_carbon_report.qmd")
