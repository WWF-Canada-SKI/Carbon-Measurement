// =================================================================================
// === COMPOSITE SAMPLING WITH HR CORE PAIRING TOOL - TERRESTRIAL =======
// =================================================================================
//
// =================================================================================
// === 1. CONFIGURATION ============================================================
// =================================================================================

var CONFIG = {
  // Sampling Design Parameters
  DEFAULT_HR_CORES: 10,
  DEFAULT_COMPOSITES_PER_STRATUM: 20,
  DEFAULT_COMPOSITE_AREA: 25, // m²
  DEFAULT_SUBSAMPLES: 5,
  DEFAULT_PAIRING_FRACTION: 0.4,
  DEFAULT_MAX_PAIRING_DISTANCE: 5000, // meters (kept for reference, not used in new logic)
  
  // Sample Size Calculator Defaults
  DEFAULT_CONFIDENCE: 90, // percent
  DEFAULT_MARGIN_OF_ERROR: 20, // percent
  
  // Analysis Parameters
  CARBON_SCALE: 250, // meters
  MAX_PIXELS: 1e10,
  MAX_ERROR: 1, // meters for geometry operations
  
  // Seed for reproducibility
  RANDOM_SEED: 42
};

var STYLES = {
  TITLE: {fontSize: '28px', fontWeight: 'bold', color: '#005931'},
  SUBTITLE: {fontSize: '18px', fontWeight: '500', color: '#333333'},
  PARAGRAPH: {fontSize: '14px', color: '#555555'},
  HEADER: {fontSize: '16px', fontWeight: 'bold', margin: '16px 0 4px 8px'},
  SUBHEADER: {fontSize: '14px', fontWeight: 'bold', margin: '10px 0 0 0'},
  PANEL: {width: '420px', border: '1px solid #cccccc'},
  HR: ui.Panel(null, ui.Panel.Layout.flow('horizontal'), {
    border: '1px solid #E0E0E0',
    margin: '20px 0px'
  }),
  INSTRUCTION: {fontSize: '12px', color: '#999999', margin: '4px 8px'},
  SUCCESS: {fontSize: '13px', color: '#388E3C', fontWeight: 'bold', margin: '8px'},
  ERROR: {fontSize: '13px', color: '#D32F2F', fontWeight: 'bold', margin: '8px'},
  WARNING: {fontSize: '13px', color: '#F57C00', fontWeight: 'bold', margin: '8px'},
  INFO: {fontSize: '12px', color: '#1976D2', margin: '4px 8px'}
};

// =================================================================================
// === 2. DATA SOURCES =============================================================
// =================================================================================

// Kept for visualization context and sample size calculation
var forestCarbon = ee.ImageCollection("projects/sat-io/open-datasets/carbon_stocks_ca/fc").first();
var soilCarbon = ee.ImageCollection("projects/sat-io/open-datasets/carbon_stocks_ca/sc").first();

var palettes = require('users/gena/packages:palettes');
var fcVis = {palette: palettes.colorbrewer.Greens[7], min: 0, max: 20};
var scVis = {palette: palettes.colorbrewer.Purples[7], min: 5, max: 30};

// =================================================================================
// === 3. STATE MANAGEMENT =========================================================
// =================================================================================

var AppState = {
  currentAoi: null,
  hrCores: null,
  composites: null,
  subsamples: null,
  pairedComposites: null,
  unpairedComposites: null,
  carbonStats: null,
  calculatedSampleSize: null,
  gridVisualization: null,
  
  reset: function() {
    this.currentAoi = null;
    this.hrCores = null;
    this.composites = null;
    this.subsamples = null;
    this.pairedComposites = null;
    this.unpairedComposites = null;
    this.carbonStats = null;
    this.calculatedSampleSize = null;
    this.gridVisualization = null;
  }
};

// =================================================================================
// === 4. UTILITY FUNCTIONS ========================================================
// =================================================================================

var Utils = {
  /**
   * Validates numeric input within range
   */
  validateNumber: function(value, min, max, name) {
    var num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      return {
        valid: false,
        message: name + ' must be between ' + min + ' and ' + max
      };
    }
    return {valid: true, value: num};
  },
  
  /**
   * Format numbers with thousand separators
   */
  formatNumber: function(num, decimals) {
    decimals = decimals !== undefined ? decimals : 0;
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },
  
  /**
   * Creates systematic grid using connected components approach
   * Produces evenly-spaced points with one point per grid cell
   * @param {ee.Geometry} polygon - Area of interest
   * @param {Number} nPoints - Target number of points
   * @param {Number} seed - Random seed for reproducibility
   * @returns {ee.FeatureCollection} - Systematically distributed points
   */
  createSystematicGrid: function(polygon, nPoints, seed) {
    // Calculate cell size based on AOI area and desired point count
    var polygonArea = polygon.area({'maxError': 1});
    var cellSizeSquared = ee.Number(polygonArea).divide(nPoints);
    var cellSize = cellSizeSquared.sqrt();
    
    // Use Albers Equal Area projection (appropriate for Canada/North America)
    // Scale the projection to our calculated cell size
    var proj = ee.Projection('EPSG:5070').atScale(cellSize);
    
    // Apply random offset to avoid edge artifacts and vary sampling patterns
    var offsetProj = this.applyRandomOffset(proj, seed);
    
    // Get pixel coordinates in the offset projection
    var latlon = ee.Image.pixelLonLat().reproject(offsetProj);
    
    // Extract coordinates as lists
    var coords = latlon.select(['longitude', 'latitude'])
      .reduceRegion({
        reducer: ee.Reducer.toList(),
        geometry: polygon,
        scale: offsetProj.nominalScale(),
        maxPixels: CONFIG.MAX_PIXELS
      });
    
    // Zip coordinates together: [[lon1, lat1], [lon2, lat2], ...]
    var pointList = ee.List(coords.get('longitude')).zip(ee.List(coords.get('latitude')));
    
    // Create features from point list with IDs
    var feats = pointList.map(function(point) {
      var idx = pointList.indexOf(point);
      return ee.Feature(ee.Geometry.Point(point), {'grid_id': idx});
    });
    
    return ee.FeatureCollection(feats);
  },
  
  /**
   * Applies random offset to projection for varied sampling patterns
   * Prevents systematic bias from grid alignment
   */
  applyRandomOffset: function(projection, seed) {
    var offsetFeature = ee.FeatureCollection([ee.Feature(null, null)])
      .randomColumn('x', seed)
      .randomColumn('y', seed + 1)
      .first();
    return projection.translate(offsetFeature.get('x'), offsetFeature.get('y'));
  },
  
  /**
   * Creates visual grid lines for map display
   * Useful for QA/QC of systematic sampling design
   */
  createGridVisualization: function(polygon, nPoints, seed) {
    var polygonArea = polygon.area({'maxError': 1});
    var cellSize = ee.Number(polygonArea).divide(nPoints).sqrt();
    
    var proj = ee.Projection('EPSG:5070').atScale(cellSize);
    var offsetProj = this.applyRandomOffset(proj, seed);
    
    // Scale by 2 for zero crossings using round
    var cells = ee.Image.pixelCoordinates(offsetProj.scale(2, 2));
    var grid = cells.subtract(cells.round()).zeroCrossing().reduce('sum').selfMask();
    
    return grid.clip(polygon);
  },
  
  /**
   * Creates square composite area centered on a point
   * Uses WGS84-compatible rectangle approach
   */
  createSquareSimple: function(point, area_m2) {
    var side = Math.sqrt(area_m2);
    var halfSide = side / 2;
    
    var coords = point.geometry().coordinates();
    
    // Latitude-dependent degree conversion
    var lat = coords.get(1);
    var cosLat = ee.Number(lat).multiply(Math.PI / 180).cos();
    var metersPerDegreeLon = ee.Number(111320).multiply(cosLat);
    var metersPerDegreeLat = ee.Number(111320);
    
    var degreeOffsetLon = ee.Number(halfSide).divide(metersPerDegreeLon);
    var degreeOffsetLat = ee.Number(halfSide).divide(metersPerDegreeLat);
    
    var west = ee.Number(coords.get(0)).subtract(degreeOffsetLon);
    var east = ee.Number(coords.get(0)).add(degreeOffsetLon);
    var south = ee.Number(coords.get(1)).subtract(degreeOffsetLat);
    var north = ee.Number(coords.get(1)).add(degreeOffsetLat);
    
    var rect = ee.Geometry.Rectangle([west, south, east, north]);
    
    return ee.Feature(rect).set({
      'shape': 'square',
      'area_m2': area_m2,
      'method': 'rectangle'
    });
  },
  
  /**
   * Creates circular composite area centered on a point
   */
  createCircle: function(point, area_m2) {
    var radius = Math.sqrt(area_m2 / Math.PI);
    var buffer = point.geometry().buffer(radius, CONFIG.MAX_ERROR);
    return ee.Feature(buffer).set({
      'shape': 'circle',
      'area_m2': area_m2
    });
  },
  
  /**
   * Generates random points within a polygon
   */
  randomPointsInPolygon: function(polygon, count, seed) {
    return ee.FeatureCollection.randomPoints({
      region: polygon.geometry(),
      points: count,
      seed: seed
    });
  },
  
  /**
   * Calculate carbon statistics for a region
   * Returns both forest and soil carbon stats for sample size calculation
   */
  calculateCarbonStats: function(region) {
    var fcStats = forestCarbon.reduceRegion({
      reducer: ee.Reducer.mean()
        .combine(ee.Reducer.stdDev(), '', true)
        .combine(ee.Reducer.count(), '', true),
      geometry: region,
      scale: CONFIG.CARBON_SCALE,
      maxPixels: CONFIG.MAX_PIXELS,
      tileScale: 4
    });
    
    var scStats = soilCarbon.reduceRegion({
      reducer: ee.Reducer.mean()
        .combine(ee.Reducer.stdDev(), '', true)
        .combine(ee.Reducer.minMax(), '', true)
        .combine(ee.Reducer.count(), '', true),
      geometry: region,
      scale: CONFIG.CARBON_SCALE,
      maxPixels: CONFIG.MAX_PIXELS,
      tileScale: 4
    });
    
    return ee.Dictionary({
      forest_carbon_mean: fcStats.get('b1_mean'),
      forest_carbon_stdDev: fcStats.get('b1_stdDev'),
      forest_carbon_count: fcStats.get('b1_count'),
      soil_carbon_mean: scStats.get('b1_mean'),
      soil_carbon_stdDev: scStats.get('b1_stdDev'),
      soil_carbon_min: scStats.get('b1_min'),
      soil_carbon_max: scStats.get('b1_max'),
      soil_carbon_count: scStats.get('b1_count')
    });
  },
  
  /**
   * Calculate Z-score from confidence level using polynomial approximation
   * Based on the user-provided formula
   */
  calculateZScore: function(confidencePercent) {
    var confidence = ee.Number(confidencePercent);
    var alpha = ee.Number(1).subtract(confidence.divide(100));
    
    // Polynomial approximation for z-score
    // z = 2.41 + (-10.9 * alpha) + (37.7 * alpha^2) - (57.9 * alpha^3)
    var zScore = ee.Number(2.41)
      .add(ee.Number(-10.9).multiply(alpha))
      .add(ee.Number(37.7).multiply(alpha.pow(2)))
      .subtract(ee.Number(57.9).multiply(alpha.pow(3)));
    
    return zScore;
  },
  
  /**
   * Calculate required sample size using finite population correction
   * 
   * Formula: n = n0 / (1 + (n0 - 1) / N)
   * Where: n0 = (z^2 * σ^2) / E^2
   *        E = mean * marginOfErrorPercent / 100
   *        N = population size (pixel count * pixel area)
   */
  calculateSampleSize: function(stats, confidencePercent, marginOfErrorPercent, carbonType) {
    var prefix = carbonType === 'forest' ? 'forest_carbon_' : 'soil_carbon_';
    
    var stdDev = ee.Number(stats.get(prefix + 'stdDev'));
    var mean = ee.Number(stats.get(prefix + 'mean'));
    var pixelCount = ee.Number(stats.get(prefix + 'count'));
    
    // Population = pixel count * pixel area (250m resolution = 62500 m² per pixel)
    var pixelArea = ee.Number(CONFIG.CARBON_SCALE).pow(2);
    var populationArea = pixelCount.multiply(pixelArea);
    
    var z = Utils.calculateZScore(confidencePercent);
    
    // Margin of error in absolute terms
    var E = mean.multiply(ee.Number(marginOfErrorPercent)).divide(100);
    
    // Initial sample size (infinite population)
    var n0 = z.pow(2).multiply(stdDev.pow(2)).divide(E.pow(2));
    
    // Finite population correction
    var n = n0.divide(ee.Number(1).add(n0.subtract(1).divide(populationArea)));
    
    return ee.Dictionary({
      sample_size: n,
      z_score: z,
      std_dev: stdDev,
      mean: mean,
      margin_of_error_absolute: E,
      population_area_m2: populationArea,
      n0_infinite: n0
    });
  }
};

// =================================================================================
// === 5. USER INTERFACE SETUP =====================================================
// =================================================================================

ui.root.clear();
var map = ui.Map();
var panel = ui.Panel({style: STYLES.PANEL});
var splitPanel = ui.SplitPanel(panel, map, 'horizontal', false);
ui.root.add(splitPanel);
map.setCenter(-95, 55, 4);

// --- Header ---
panel.add(ui.Label('NxC - Sampling Toolkit', STYLES.TITLE));
panel.add(ui.Label('Composite Soil Sampling in Terrestrial Ecosystems', STYLES.SUBTITLE));
panel.add(ui.Label(
  'Generate sampling design with HR cores centered within paired and unpaired composites.',
  STYLES.PARAGRAPH
));
panel.add(STYLES.HR);

// --- Step 1: Define AOI ---
panel.add(ui.Label('Step 1: Define Sampling Area', STYLES.HEADER));

var assetIdBox = ui.Textbox({
  placeholder: 'e.g., users/your_name/your_asset',
  style: {stretch: 'horizontal', margin: '0 8px'}
});

var assetPanel = ui.Panel(
  [ui.Label('Enter GEE Asset Path:', STYLES.INSTRUCTION), assetIdBox],
  null,
  {shown: false}
);

var aoiSelection = ui.Select({
  items: ['Draw a polygon', 'Use a GEE Asset'],
  value: 'Draw a polygon',
  style: {stretch: 'horizontal', margin: '0 8px'},
  onChange: function(value) {
    assetPanel.style().set('shown', value === 'Use a GEE Asset');
    map.drawingTools().setShown(value === 'Draw a polygon');
  }
});

panel.add(aoiSelection);
panel.add(assetPanel);
panel.add(ui.Label('► Draw your area of interest or provide asset path', STYLES.INSTRUCTION));

// =================================================================================
// === STEP 1.5: SAMPLE SIZE CALCULATOR (NEW) ======================================
// =================================================================================

panel.add(ui.Label('Step 1.5: Calculate Sample Size (Optional)', STYLES.HEADER));
panel.add(ui.Label(
  'Calculate statistically-defensible sample size based on carbon variability in your AOI.',
  STYLES.INSTRUCTION
));

// Carbon type selection for sample size calculation
var carbonTypeSelect = ui.Select({
  items: ['Soil Carbon', 'Forest Carbon'],
  value: 'Soil Carbon',
  style: {stretch: 'horizontal', margin: '0 8px'}
});

panel.add(ui.Label('Calculate based on:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(carbonTypeSelect);

// Confidence level input
var confidenceBox = ui.Textbox({
  placeholder: '80-99',
  value: CONFIG.DEFAULT_CONFIDENCE.toString(),
  style: {width: '80px', margin: '0 8px'}
});

// Margin of error input
var marginOfErrorBox = ui.Textbox({
  placeholder: '1-50',
  value: CONFIG.DEFAULT_MARGIN_OF_ERROR.toString(),
  style: {width: '80px', margin: '0 8px'}
});

panel.add(ui.Panel([
  ui.Label('Confidence Level (%):', {width: '150px'}), 
  confidenceBox
], ui.Panel.Layout.flow('horizontal')));

panel.add(ui.Panel([
  ui.Label('Margin of Error (%):', {width: '150px'}), 
  marginOfErrorBox
], ui.Panel.Layout.flow('horizontal')));

panel.add(ui.Label(
  '► Higher confidence and lower margin of error require more samples',
  STYLES.INSTRUCTION
));

var calculateSampleSizeButton = ui.Button({
  label: '📊 Calculate Required Sample Size',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: calculateAndShowSampleSize
});
panel.add(calculateSampleSizeButton);

var sampleSizeResultsPanel = ui.Panel({style: {margin: '0 8px'}});
panel.add(sampleSizeResultsPanel);


// --- Step 2: Configure Sampling Design ---
panel.add(ui.Label('Step 2: Configure Sampling Design', STYLES.HEADER));

// Sampling strategy selection
var strategySelect = ui.Select({
  items: ['Systematic Grid', 'Random'],
  value: 'Systematic Grid',
  style: {stretch: 'horizontal', margin: '0 8px'}
});

panel.add(ui.Label('Sampling Strategy:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(strategySelect);
panel.add(ui.Label(
  '► Systematic Grid: Even spacing using equal-area projection (EPSG:5070)',
  STYLES.INFO
));
panel.add(ui.Label(
  '► Strategy applies to unpaired composites only. Paired are centered on HR cores.',
  STYLES.INFO
));

// Composite shape selection
var shapeSelect = ui.Select({
  items: ['Square', 'Circle'],
  value: 'Square',
  style: {stretch: 'horizontal', margin: '0 8px'}
});

panel.add(ui.Label('Composite Shape:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(shapeSelect);

// Numeric parameters
var hrCoresBox = ui.Textbox({
  placeholder: 'Number of HR cores',
  value: CONFIG.DEFAULT_HR_CORES.toString(),
  style: {width: '80px', margin: '0 8px'}
});

var compositesBox = ui.Textbox({
  placeholder: 'Total composites',
  value: CONFIG.DEFAULT_COMPOSITES_PER_STRATUM.toString(),
  style: {width: '80px', margin: '0 8px'}
});

var compositeAreaBox = ui.Textbox({
  placeholder: 'Area in m²',
  value: CONFIG.DEFAULT_COMPOSITE_AREA.toString(),
  style: {width: '80px', margin: '0 8px'}
});

var subsamplesBox = ui.Textbox({
  placeholder: 'Count',
  value: CONFIG.DEFAULT_SUBSAMPLES.toString(),
  style: {width: '80px', margin: '0 8px'}
});

var pairingFractionBox = ui.Textbox({
  placeholder: '0-1',
  value: CONFIG.DEFAULT_PAIRING_FRACTION.toString(),
  style: {width: '80px', margin: '0 8px'}
});

panel.add(ui.Label('HR Soil Cores (high detail):', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(ui.Panel([ui.Label('Number of cores:', {width: '150px'}), hrCoresBox], 
  ui.Panel.Layout.flow('horizontal')));
panel.add(ui.Label(
  '► Each HR core will be at the center of a paired composite',
  STYLES.INFO
));

panel.add(ui.Label('Composite Samples:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(ui.Panel([ui.Label('Total composites:', {width: '150px'}), compositesBox], 
  ui.Panel.Layout.flow('horizontal')));
panel.add(ui.Panel([ui.Label('Area (m²):', {width: '150px'}), compositeAreaBox], 
  ui.Panel.Layout.flow('horizontal')));
panel.add(ui.Panel([ui.Label('Subsamples per composite:', {width: '150px'}), subsamplesBox], 
  ui.Panel.Layout.flow('horizontal')));

panel.add(ui.Label('Pairing Strategy:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(ui.Panel([ui.Label('Fraction to pair (0-1):', {width: '150px'}), pairingFractionBox], 
  ui.Panel.Layout.flow('horizontal')));
panel.add(ui.Label(
  '► e.g., 0.4 = 40% of composites paired (centered on HR cores), 60% unpaired.',
  STYLES.INFO
));

// --- Step 3: Generate Sampling Design ---
panel.add(ui.Label('Step 3: Generate Sampling Design', STYLES.HEADER));

var generateButton = ui.Button({
  label: 'Generate Sampling Locations',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: generateSamplingDesign
});
panel.add(generateButton);

var resultsPanel = ui.Panel({style: {margin: '0 8px'}});
panel.add(resultsPanel);

// --- Step 4: Export Results ---
panel.add(ui.Label('Step 4: Export Sampling Plan', STYLES.HEADER));

var exportFormatSelect = ui.Select({
  items: ['CSV', 'GeoJSON', 'KML', 'SHP'],
  value: 'CSV',
  style: {stretch: 'horizontal', margin: '0 8px'}
});
panel.add(ui.Label('Export Format:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(exportFormatSelect);

var exportCompositesButton = ui.Button({
  label: '⬇️ Export Composite Polygons',
  style: {stretch: 'horizontal', margin: '4px 8px'},
  disabled: true
});

var exportSubsamplesButton = ui.Button({
  label: '⬇️ Export Subsample Points',
  style: {stretch: 'horizontal', margin: '4px 8px'},
  disabled: true
});

var exportHRCoresButton = ui.Button({
  label: '⬇️ Export HR Core Locations',
  style: {stretch: 'horizontal', margin: '4px 8px'},
  disabled: true
});

panel.add(exportCompositesButton);
panel.add(exportSubsamplesButton);
panel.add(exportHRCoresButton);

var downloadLinksPanel = ui.Panel({style: {margin: '0 8px'}});
panel.add(downloadLinksPanel);

var clearButton = ui.Button({
  label: 'Clear All & Start Over',
  style: {stretch: 'horizontal', margin: '8px'}
});
panel.add(clearButton);

// =================================================================================
// === 6. SAMPLE SIZE CALCULATOR FUNCTION (NEW) ====================================
// =================================================================================

/**
 * Calculate and display recommended sample size based on carbon variability
 * Uses finite population correction formula
 */
function calculateAndShowSampleSize() {
  sampleSizeResultsPanel.clear();
  
  // Get AOI first
  var aoi = getAoi();
  if (!aoi) {
    sampleSizeResultsPanel.add(ui.Label(
      '⚠️ Please define an area of interest first!', 
      STYLES.ERROR
    ));
    return;
  }
  
  // Validate inputs
  var confVal = Utils.validateNumber(confidenceBox.getValue(), 80, 99.9, 'Confidence level');
  if (!confVal.valid) {
    sampleSizeResultsPanel.add(ui.Label(confVal.message, STYLES.ERROR));
    return;
  }
  
  var moeVal = Utils.validateNumber(marginOfErrorBox.getValue(), 1, 50, 'Margin of error');
  if (!moeVal.valid) {
    sampleSizeResultsPanel.add(ui.Label(moeVal.message, STYLES.ERROR));
    return;
  }
  
  sampleSizeResultsPanel.add(ui.Label('Calculating sample size...', {
    color: '#666',
    fontStyle: 'italic',
    margin: '8px'
  }));
  
  // Calculate carbon statistics for AOI
  var carbonType = carbonTypeSelect.getValue() === 'Forest Carbon' ? 'forest' : 'soil';
  
  Utils.calculateCarbonStats(aoi).evaluate(function(stats, error) {
    sampleSizeResultsPanel.clear();
    
    if (error) {
      sampleSizeResultsPanel.add(ui.Label(
        '⚠️ Error calculating statistics: ' + error, 
        STYLES.ERROR
      ));
      return;
    }
    
    // Check if we have valid data
    var prefix = carbonType === 'forest' ? 'forest_carbon_' : 'soil_carbon_';
    if (!stats[prefix + 'mean'] || !stats[prefix + 'stdDev']) {
      sampleSizeResultsPanel.add(ui.Label(
        '⚠️ No ' + carbonType + ' carbon data available in this AOI.',
        STYLES.WARNING
      ));
      return;
    }
    
    // Store stats for reference
    AppState.carbonStats = stats;
    
    // Calculate sample size
    Utils.calculateSampleSize(
      ee.Dictionary(stats), 
      confVal.value, 
      moeVal.value, 
      carbonType
    ).evaluate(function(result, calcError) {
      if (calcError) {
        sampleSizeResultsPanel.add(ui.Label(
          '⚠️ Error in calculation: ' + calcError, 
          STYLES.ERROR
        ));
        return;
      }
      
      var sampleSize = Math.ceil(result.sample_size);
      AppState.calculatedSampleSize = sampleSize;
      
      // Display results
      sampleSizeResultsPanel.add(ui.Label('Sample Size Calculation Results:', STYLES.SUBHEADER));
      
      sampleSizeResultsPanel.add(ui.Label(
        '✓ Recommended Sample Size: ' + sampleSize,
        {fontSize: '14px', fontWeight: 'bold', color: '#388E3C', margin: '8px'}
      ));
      
      sampleSizeResultsPanel.add(ui.Label(
        'Based on ' + carbonType + ' carbon variability:',
        {fontSize: '12px', margin: '4px 8px', fontWeight: 'bold'}
      ));
      
      sampleSizeResultsPanel.add(ui.Label(
        '  • Mean: ' + Utils.formatNumber(result.mean, 2) + ' t/ha',
        {fontSize: '12px', margin: '2px 8px'}
      ));
      
      sampleSizeResultsPanel.add(ui.Label(
        '  • Std Dev: ' + Utils.formatNumber(result.std_dev, 2) + ' t/ha',
        {fontSize: '12px', margin: '2px 8px'}
      ));
      
      sampleSizeResultsPanel.add(ui.Label(
        '  • CV: ' + Utils.formatNumber((result.std_dev / result.mean) * 100, 1) + '%',
        {fontSize: '12px', margin: '2px 8px'}
      ));
      
      sampleSizeResultsPanel.add(ui.Label(
        '  • Z-score: ' + Utils.formatNumber(result.z_score, 3),
        {fontSize: '12px', margin: '2px 8px'}
      ));
      
      sampleSizeResultsPanel.add(ui.Label(
        '  • Margin of error: ±' + Utils.formatNumber(result.margin_of_error_absolute, 2) + ' t/ha',
        {fontSize: '12px', margin: '2px 8px'}
      ));
      
      // Add button to apply recommendation
      var applyButton = ui.Button({
        label: 'Apply to Composites (' + sampleSize + ')',
        style: {margin: '8px'},
        onClick: function() {
          compositesBox.setValue(sampleSize.toString());
          sampleSizeResultsPanel.add(ui.Label(
            '✓ Applied ' + sampleSize + ' to composites field',
            STYLES.SUCCESS
          ));
        }
      });
      sampleSizeResultsPanel.add(applyButton);
      
      print('═══════════════════════════════════════════════════════');
      print('📊 Sample Size Calculation');
      print('═══════════════════════════════════════════════════════');
      print('Confidence Level:', confVal.value + '%');
      print('Margin of Error:', moeVal.value + '%');
      print('Carbon Type:', carbonType);
      print('Mean:', result.mean.toFixed(2), 't/ha');
      print('Std Dev:', result.std_dev.toFixed(2), 't/ha');
      print('Z-score:', result.z_score.toFixed(4));
      print('Recommended n:', sampleSize);
    });
  });
}

// =================================================================================
// === 7. CORE SAMPLING FUNCTIONS (FIXED PAIRING LOGIC) ============================
// =================================================================================

/**
 * Main function to generate complete sampling design
 * FIXED: Paired composites are now centered on HR cores
 */
function generateSamplingDesign() {
  resultsPanel.clear();
  downloadLinksPanel.clear();
  map.layers().reset();
  
  var loading = ui.Label('Generating sampling design...', {
    color: '#666',
    fontStyle: 'italic',
    margin: '8px'
  });
  resultsPanel.add(loading);
  
  // Get AOI
  AppState.currentAoi = getAoi();
  if (!AppState.currentAoi) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label('Please define an area of interest first!', STYLES.ERROR));
    return;
  }
  
  // Validate inputs
  var validations = validateInputs();
  if (!validations.valid) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label(validations.message, STYLES.ERROR));
    return;
  }
  
  var params = validations.params;
  params.strategy = strategySelect.getValue();
  params.shape = shapeSelect.getValue();
  
  // Calculate paired vs unpaired counts based on pairing fraction
  // numPaired = totalComposites × pairingFraction (capped by available HR cores)
  // numUnpaired = totalComposites - numPaired
  var requestedPaired = Math.floor(params.totalComposites * params.pairingFraction);
  params.numPaired = Math.min(requestedPaired, params.hrCores);
  params.numUnpaired = params.totalComposites - params.numPaired;
  
  // Warn if pairing fraction requested more paired than HR cores available
  if (requestedPaired > params.hrCores) {
    resultsPanel.add(ui.Label(
      '⚠️ Pairing fraction requested ' + requestedPaired + ' paired composites, ' +
      'but only ' + params.hrCores + ' HR cores available. Using ' + params.numPaired + ' paired.',
      STYLES.WARNING
    ));
  }
  
  // Validate: need at least some HR cores if pairing fraction > 0
  if (params.pairingFraction > 0 && params.hrCores === 0) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label(
      '⚠️ Pairing fraction > 0 but no HR cores specified. Set HR cores > 0 or pairing fraction = 0.',
      STYLES.ERROR
    ));
    return;
  }
  
  // Add AOI to map
  map.centerObject(AppState.currentAoi, 10);
  map.addLayer(AppState.currentAoi, {color: 'E53935'}, 'Area of Interest');
  
  // Optional: Visual context layers
  map.addLayer(forestCarbon.clip(AppState.currentAoi), fcVis, 'Forest Carbon Context', false);
  map.addLayer(soilCarbon.clip(AppState.currentAoi), scVis, 'Soil Carbon Context', false);
  
  // Sampling region is the user's AOI (unmasked)
  var samplingRegion = AppState.currentAoi;
  
  // FIXED WORKFLOW:
  // 1. Generate HR core locations
  // 2. Create paired composites CENTERED on HR cores
  // 3. Create unpaired composites using selected strategy
  generateHRCoresAndPairedComposites(samplingRegion, params);
}

/**
 * Generate HR core locations and paired composites centered on them
 * FIXED: Paired composites are now properly centered on HR cores
 * Only numPaired HR cores will have composites centered on them
 */
function generateHRCoresAndPairedComposites(samplingRegion, params) {
  try {
    // Generate HR core point locations
    var hrCorePoints = ee.FeatureCollection.randomPoints({
      region: samplingRegion,
      points: params.hrCores,
      seed: CONFIG.RANDOM_SEED
    });
    
    var hrCoresList = hrCorePoints.toList(params.hrCores);
    
    // Create HR cores with IDs - mark which ones have paired composites
    AppState.hrCores = ee.FeatureCollection(
      ee.List.sequence(0, ee.Number(params.hrCores).subtract(1)).map(function(i) {
        var pt = ee.Feature(hrCoresList.get(i));
        var coreId = ee.String('HR_').cat(ee.Number(i).format('%03d'));
        var hasPaired = ee.Number(i).lt(params.numPaired);
        return pt.set({
          'core_id': coreId,
          'type': 'hr_core',
          'has_paired_composite': hasPaired,
          'lon': pt.geometry().coordinates().get(0),
          'lat': pt.geometry().coordinates().get(1)
        });
      })
    );
    
    // Create paired composites CENTERED on the first numPaired HR cores
    if (params.numPaired > 0) {
      var pairedComposites = ee.FeatureCollection(
        ee.List.sequence(0, ee.Number(params.numPaired).subtract(1)).map(function(i) {
          var hrCore = ee.Feature(hrCoresList.get(i));
          var coreId = ee.String('HR_').cat(ee.Number(i).format('%03d'));
          var compositeId = ee.String('COMP_P_').cat(ee.Number(i).format('%03d'));
          
          // Create composite polygon centered on HR core location
          var polygon;
          if (params.shape === 'Circle') {
            polygon = Utils.createCircle(hrCore, params.compositeArea);
          } else {
            polygon = Utils.createSquareSimple(hrCore, params.compositeArea);
          }
          
          return polygon.set({
            'composite_id': compositeId,
            'type': 'composite',
            'paired': 1,
            'paired_core_id': coreId,
            'paired_dist_m': 0, // Distance is 0 because HR core is at center
            'centroid_lon': hrCore.geometry().coordinates().get(0),
            'centroid_lat': hrCore.geometry().coordinates().get(1)
          });
        })
      );
      
      AppState.pairedComposites = pairedComposites;
    } else {
      AppState.pairedComposites = ee.FeatureCollection([]);
    }
    
    // Generate unpaired composites
    generateUnpairedComposites(samplingRegion, params);
    
  } catch (error) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label('Error generating HR cores: ' + error.message, STYLES.ERROR));
  }
}

/**
 * Generate unpaired composites using selected sampling strategy
 */
function generateUnpairedComposites(samplingRegion, params) {
  try {
    if (params.numUnpaired <= 0) {
      // No unpaired composites needed
      AppState.unpairedComposites = ee.FeatureCollection([]);
      AppState.gridVisualization = null;
      combineCompositesAndGenerateSubsamples(params);
      return;
    }
    
    var unpairedPoints;
    var seedOffset = 100; // Different seed for unpaired to avoid overlap
    
    if (params.strategy === 'Systematic Grid') {
      // Use true systematic grid with even spacing
      unpairedPoints = Utils.createSystematicGrid(
        samplingRegion,
        params.numUnpaired,
        CONFIG.RANDOM_SEED + seedOffset
      );
      
      // Store grid visualization for map display
      AppState.gridVisualization = Utils.createGridVisualization(
        samplingRegion,
        params.numUnpaired,
        CONFIG.RANDOM_SEED + seedOffset
      );
      
    } else if (params.strategy === 'Random') {
      unpairedPoints = ee.FeatureCollection.randomPoints({
        region: samplingRegion,
        points: params.numUnpaired,
        seed: CONFIG.RANDOM_SEED + seedOffset
      });
      AppState.gridVisualization = null;
      
    } else {
      // Stratified Random - uses carbon variability for stratification
      // For now, falls back to random (could be enhanced with carbon strata)
      unpairedPoints = ee.FeatureCollection.randomPoints({
        region: samplingRegion,
        points: params.numUnpaired,
        seed: CONFIG.RANDOM_SEED + seedOffset
      });
      AppState.gridVisualization = null;
    }
    
    // Limit to requested number and convert to list
    var pointsList = unpairedPoints.limit(params.numUnpaired).toList(params.numUnpaired);
    
    // Get actual count (systematic grid may produce slightly different count)
    var actualCount = unpairedPoints.size();
    
    // Create unpaired composite polygons
    var unpairedComposites = ee.FeatureCollection(
      ee.List.sequence(0, actualCount.subtract(1)).map(function(i) {
        var pt = ee.Feature(pointsList.get(i));
        var compositeId = ee.String('COMP_U_').cat(ee.Number(i).format('%03d'));
        
        var polygon;
        if (params.shape === 'Circle') {
          polygon = Utils.createCircle(pt, params.compositeArea);
        } else {
          polygon = Utils.createSquareSimple(pt, params.compositeArea);
        }
        
        return polygon.set({
          'composite_id': compositeId,
          'type': 'composite',
          'paired': 0,
          'paired_core_id': null,
          'paired_dist_m': null,
          'centroid_lon': pt.geometry().coordinates().get(0),
          'centroid_lat': pt.geometry().coordinates().get(1)
        });
      })
    );
    
    AppState.unpairedComposites = unpairedComposites;
    
    // Combine and continue
    combineCompositesAndGenerateSubsamples(params);
    
  } catch (error) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label('Error generating unpaired composites: ' + error.message, STYLES.ERROR));
  }
}

/**
 * Combine paired and unpaired composites, then generate subsamples
 */
function combineCompositesAndGenerateSubsamples(params) {
  try {
    // Merge paired and unpaired composites
    AppState.composites = AppState.pairedComposites.merge(AppState.unpairedComposites);
    
    // Generate subsamples
    generateSubsamples(params);
    
  } catch (error) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label('Error combining composites: ' + error.message, STYLES.ERROR));
  }
}

/**
 * Generate subsample points within each composite
 */
function generateSubsamples(params) {
  try {
    var subsampleSeed = CONFIG.RANDOM_SEED + 200;
    
    var subsampleCollections = AppState.composites.map(function(comp) {
      var compId = comp.get('composite_id');
      var subPts = Utils.randomPointsInPolygon(comp, params.subsamples, subsampleSeed);
      
      var subPtsList = subPts.toList(params.subsamples);
      
      return ee.FeatureCollection(
        ee.List.sequence(0, ee.Number(params.subsamples).subtract(1)).map(function(i) {
          var pt = ee.Feature(subPtsList.get(i));
          return pt.set({
            'composite_id': compId,
            'subsample_id': ee.String(compId).cat('_S').cat(ee.Number(i).format('%02d')),
            'type': 'subsample',
            'lon': pt.geometry().coordinates().get(0),
            'lat': pt.geometry().coordinates().get(1)
          });
        })
      );
    }).flatten();
    
    AppState.subsamples = ee.FeatureCollection(subsampleCollections);
    
    // Display results
    displayResults(params);
    
  } catch (error) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label('Error generating subsamples: ' + error.message, STYLES.ERROR));
  }
}

/**
 * Display results and statistics
 */
function displayResults(params) {
  resultsPanel.clear();
  
  // Calculate statistics
  ee.Dictionary({
    totalComposites: AppState.composites.size(),
    pairedComposites: AppState.pairedComposites.size(),
    unpairedComposites: AppState.unpairedComposites.size(),
    totalSubsamples: AppState.subsamples.size(),
    totalHRCores: AppState.hrCores.size()
  }).evaluate(function(counts, error) {
    if (error) {
      resultsPanel.add(ui.Label('Error calculating statistics: ' + error, STYLES.ERROR));
      return;
    }
    
    // Display summary
    resultsPanel.add(ui.Label('Sampling Design Summary', STYLES.HEADER));
    
    resultsPanel.add(ui.Label(
      '✓ HR Cores: ' + counts.totalHRCores + 
      ' (' + counts.pairedComposites + ' with paired composites)',
      {fontSize: '13px', margin: '4px 8px', color: '#388E3C'}
    ));
    
    resultsPanel.add(ui.Label(
      '✓ Total Composites: ' + counts.totalComposites + 
      ' (pairing fraction: ' + (params.pairingFraction * 100).toFixed(0) + '%)',
      {fontSize: '13px', margin: '4px 8px', color: '#388E3C'}
    ));
    
    resultsPanel.add(ui.Label(
      '    • Paired (centered on HR cores): ' + counts.pairedComposites,
      {fontSize: '12px', margin: '2px 16px', color: '#1976D2'}
    ));
    
    resultsPanel.add(ui.Label(
      '    • Unpaired (' + params.strategy + '): ' + counts.unpairedComposites,
      {fontSize: '12px', margin: '2px 16px', color: '#7B1FA2'}
    ));
    
    resultsPanel.add(ui.Label(
      '✓ Subsamples: ' + counts.totalSubsamples + 
      ' (' + params.subsamples + ' per composite)',
      {fontSize: '13px', margin: '4px 8px', color: '#388E3C'}
    ));
    
    // Note about pairing
    resultsPanel.add(ui.Label(''));
    resultsPanel.add(ui.Label('Pairing Design:', STYLES.SUBHEADER));
    resultsPanel.add(ui.Label(
      counts.pairedComposites + ' of ' + counts.totalHRCores + 
      ' HR cores have paired composites centered on them.',
      {fontSize: '12px', margin: '4px 8px', fontStyle: 'italic'}
    ));
    if (counts.unpairedComposites > 0) {
      resultsPanel.add(ui.Label(
        counts.unpairedComposites + ' unpaired composites distributed via ' + 
        params.strategy + ' strategy.',
        {fontSize: '12px', margin: '4px 8px', fontStyle: 'italic'}
      ));
    }
    resultsPanel.add(ui.Label(
      'Paired sites enable direct comparison between HR and composite methods.',
      {fontSize: '12px', margin: '4px 8px', fontStyle: 'italic'}
    ));
    
    // Calculate carbon statistics
    resultsPanel.add(ui.Label(''));
    resultsPanel.add(ui.Label('Calculating carbon context stats...', {
      fontSize: '12px',
      fontStyle: 'italic',
      margin: '4px 8px'
    }));
    
    Utils.calculateCarbonStats(AppState.currentAoi).evaluate(function(carbonStats) {
      // Update the calculating message
      var carbonPanel = resultsPanel.widgets().get(resultsPanel.widgets().length() - 1);
      resultsPanel.remove(carbonPanel);
      
      resultsPanel.add(ui.Label('Carbon Statistics (Context):', STYLES.SUBHEADER));
      if (carbonStats && carbonStats.soil_carbon_mean) {
        resultsPanel.add(ui.Label(
          'Mean soil carbon: ' + carbonStats.soil_carbon_mean.toFixed(2) + ' t/ha',
          {fontSize: '12px', margin: '4px 8px'}
        ));
        resultsPanel.add(ui.Label(
          'Std deviation: ' + carbonStats.soil_carbon_stdDev.toFixed(2) + ' t/ha',
          {fontSize: '12px', margin: '4px 8px'}
        ));
        resultsPanel.add(ui.Label(
          'Range: ' + carbonStats.soil_carbon_min.toFixed(2) + ' - ' + 
          carbonStats.soil_carbon_max.toFixed(2) + ' t/ha',
          {fontSize: '12px', margin: '4px 8px'}
        ));
      } else {
        resultsPanel.add(ui.Label(
          'No soil carbon data available in this AOI.',
          {fontSize: '12px', margin: '4px 8px', color: '#888'}
        ));
      }
    });
    
    // Add layers to map with proper styling
    var pairedStyle = {color: '1976D2', fillColor: '1976D240'}; // Blue for paired
    var unpairedStyle = {color: '7B1FA2', fillColor: '7B1FA240'}; // Purple for unpaired
    var hrStyle = {color: 'D32F2F', pointSize: 6}; // Red for HR cores
    var subsampleStyle = {color: 'FFC107', pointSize: 2}; // Yellow for subsamples
    var gridStyle = {color: '666666', width: 1}; // Gray for grid lines
    
    // Add systematic grid visualization if available (for QA/QC)
    if (AppState.gridVisualization && params.strategy === 'Systematic Grid') {
      map.addLayer(AppState.gridVisualization, gridStyle, 'Systematic Grid (QA)', false);
    }
    
    map.addLayer(AppState.unpairedComposites, unpairedStyle, 'Unpaired Composites');
    map.addLayer(AppState.pairedComposites, pairedStyle, 'Paired Composites (centered on HR)');
    map.addLayer(AppState.hrCores, hrStyle, 'HR Core Locations');
    map.addLayer(AppState.subsamples, subsampleStyle, 'Subsample Points', false);
    
    // Add legend note
    resultsPanel.add(ui.Label(''));
    resultsPanel.add(ui.Label('Map Legend:', STYLES.SUBHEADER));
    resultsPanel.add(ui.Label('🔴 HR Cores (red points)', {fontSize: '11px', margin: '2px 8px'}));
    resultsPanel.add(ui.Label('🔵 Paired Composites (blue polygons)', {fontSize: '11px', margin: '2px 8px'}));
    resultsPanel.add(ui.Label('🟣 Unpaired Composites (purple polygons)', {fontSize: '11px', margin: '2px 8px'}));
    resultsPanel.add(ui.Label('🟡 Subsamples (yellow points, toggle on)', {fontSize: '11px', margin: '2px 8px'}));
    if (params.strategy === 'Systematic Grid') {
      resultsPanel.add(ui.Label('⬜ Systematic Grid (gray lines, toggle on for QA)', {fontSize: '11px', margin: '2px 8px'}));
    }
    
    // Enable export buttons
    exportCompositesButton.setDisabled(false);
    exportSubsamplesButton.setDisabled(false);
    exportHRCoresButton.setDisabled(false);
    
    resultsPanel.add(ui.Label('✓ Sampling design generated successfully', STYLES.SUCCESS));
    
    // Print to console
    print('═══════════════════════════════════════════════════════');
    print('🌲 Sampling Design Completed');
    print('═══════════════════════════════════════════════════════');
    print('Strategy:', params.strategy);
    if (params.strategy === 'Systematic Grid') {
      print('  → Uses EPSG:5070 (Albers Equal Area) for even spacing');
      print('  → Grid visualization available in layers panel');
    }
    print('Shape:', params.shape);
    print('Pairing Fraction:', params.pairingFraction, '(' + (params.pairingFraction * 100) + '%)');
    print('');
    print('Total Composites:', counts.totalComposites);
    print('  - Paired (centered on HR cores):', counts.pairedComposites);
    print('  - Unpaired (' + params.strategy + '):', counts.unpairedComposites);
    print('Subsamples:', counts.totalSubsamples);
    print('HR Cores:', counts.totalHRCores);
    print('');
    print('PAIRING NOTE: ' + counts.pairedComposites + ' composites are centered on HR cores.');
    print('Remaining ' + counts.unpairedComposites + ' composites distributed via ' + params.strategy + '.');
  });
}

// =================================================================================
// === 8. HELPER FUNCTIONS =========================================================
// =================================================================================

/**
 * Gets AOI from drawing tools or asset
 */
function getAoi() {
  var method = aoiSelection.getValue();
  
  if (method === 'Draw a polygon') {
    var layers = map.drawingTools().layers();
    if (layers.length() === 0) {
      return null;
    }
    var geometries = layers.get(0).geometries();
    if (geometries.length() === 0) {
      return null;
    }
    return layers.get(0).toGeometry();
  } else {
    var assetId = assetIdBox.getValue();
    if (!assetId || assetId.trim() === '') {
      return null;
    }
    try {
      var fc = ee.FeatureCollection(assetId);
      return fc.geometry();
    } catch (e) {
      alert('Failed to load asset: ' + e.message);
      return null;
    }
  }
}

/**
 * Validates all input parameters
 */
function validateInputs() {
  var hrCoresVal = Utils.validateNumber(hrCoresBox.getValue(), 1, 100, 'HR Cores');
  if (!hrCoresVal.valid) return hrCoresVal;
  
  var compositesVal = Utils.validateNumber(compositesBox.getValue(), 1, 500, 'Total composites');
  if (!compositesVal.valid) return compositesVal;
  
  var areaVal = Utils.validateNumber(compositeAreaBox.getValue(), 1, 10000, 'Composite area');
  if (!areaVal.valid) return areaVal;
  
  var subsamplesVal = Utils.validateNumber(subsamplesBox.getValue(), 1, 50, 'Subsamples');
  if (!subsamplesVal.valid) return subsamplesVal;
  
  var pairingVal = Utils.validateNumber(pairingFractionBox.getValue(), 0, 1, 'Pairing fraction');
  if (!pairingVal.valid) return pairingVal;
  
  return {
    valid: true,
    params: {
      hrCores: hrCoresVal.value,
      totalComposites: compositesVal.value,
      compositeArea: areaVal.value,
      subsamples: subsamplesVal.value,
      pairingFraction: pairingVal.value
    }
  };
}

// =================================================================================
// === 9. EXPORT FUNCTIONS =========================================================
// =================================================================================

exportCompositesButton.onClick(function() {
  if (!AppState.composites) {
    alert('Please generate sampling design first.');
    return;
  }
  
  downloadLinksPanel.clear();
  
  var format = exportFormatSelect.getValue();
  
  var exportData = AppState.composites.map(function(f) {
    return f.set({
      'export_format': format,
      'export_date': ee.Date(Date.now()).format('YYYY-MM-dd')
    });
  });
  
  var downloadUrl = exportData.getDownloadURL({
    format: format === 'SHP' ? 'SHP' : format,
    filename: 'composite_polygons_' + new Date().getTime()
  });
  
  var link = ui.Label({
    value: '⬇️ Download Composite Polygons (' + format + ')',
    style: {
      color: '#1976D2',
      textDecoration: 'underline',
      margin: '8px',
      fontSize: '13px',
      fontWeight: 'bold'
    },
    targetUrl: downloadUrl
  });
  
  downloadLinksPanel.add(link);
  print('✓ Composite polygons export link generated');
});

exportSubsamplesButton.onClick(function() {
  if (!AppState.subsamples) {
    alert('Please generate sampling design first.');
    return;
  }
  
  downloadLinksPanel.clear();
  
  var format = exportFormatSelect.getValue();
  
  var exportData = AppState.subsamples.map(function(f) {
    return f.set({
      'export_format': format,
      'export_date': ee.Date(Date.now()).format('YYYY-MM-dd')
    });
  });
  
  var downloadUrl = exportData.getDownloadURL({
    format: format === 'SHP' ? 'SHP' : format,
    filename: 'subsample_points_' + new Date().getTime()
  });
  
  var link = ui.Label({
    value: '⬇️ Download Subsample Points (' + format + ')',
    style: {
      color: '#1976D2',
      textDecoration: 'underline',
      margin: '8px',
      fontSize: '13px',
      fontWeight: 'bold'
    },
    targetUrl: downloadUrl
  });
  
  downloadLinksPanel.add(link);
  print('✓ Subsample points export link generated');
});

exportHRCoresButton.onClick(function() {
  if (!AppState.hrCores) {
    alert('Please generate sampling design first.');
    return;
  }
  
  downloadLinksPanel.clear();
  
  var format = exportFormatSelect.getValue();
  
  var exportData = AppState.hrCores.map(function(f) {
    return f.set({
      'export_format': format,
      'export_date': ee.Date(Date.now()).format('YYYY-MM-dd')
    });
  });
  
  var downloadUrl = exportData.getDownloadURL({
    format: format === 'SHP' ? 'SHP' : format,
    filename: 'hr_core_locations_' + new Date().getTime()
  });
  
  var link = ui.Label({
    value: '⬇️ Download HR Core Locations (' + format + ')',
    style: {
      color: '#1976D2',
      textDecoration: 'underline',
      margin: '8px',
      fontSize: '13px',
      fontWeight: 'bold'
    },
    targetUrl: downloadUrl
  });
  
  downloadLinksPanel.add(link);
  print('✓ HR core locations export link generated');
});

clearButton.onClick(function() {
  var confirmed = confirm('This will clear all generated sampling locations. Continue?');
  if (!confirmed) return;
  
  AppState.reset();
  map.layers().reset();
  map.drawingTools().clear();
  map.drawingTools().setShown(true);
  resultsPanel.clear();
  downloadLinksPanel.clear();
  sampleSizeResultsPanel.clear();
  
  exportCompositesButton.setDisabled(true);
  exportSubsamplesButton.setDisabled(true);
  exportHRCoresButton.setDisabled(true);
  
  // Reset form values to defaults
  hrCoresBox.setValue(CONFIG.DEFAULT_HR_CORES.toString());
  compositesBox.setValue(CONFIG.DEFAULT_COMPOSITES_PER_STRATUM.toString());
  compositeAreaBox.setValue(CONFIG.DEFAULT_COMPOSITE_AREA.toString());
  subsamplesBox.setValue(CONFIG.DEFAULT_SUBSAMPLES.toString());
  pairingFractionBox.setValue(CONFIG.DEFAULT_PAIRING_FRACTION.toString());
  confidenceBox.setValue(CONFIG.DEFAULT_CONFIDENCE.toString());
  marginOfErrorBox.setValue(CONFIG.DEFAULT_MARGIN_OF_ERROR.toString());
  strategySelect.setValue('Systematic Grid');
  shapeSelect.setValue('Square');
  carbonTypeSelect.setValue('Soil Carbon');
  
  print('✓ Tool reset successfully');
});

// =================================================================================
// === 10. INITIALIZE THE APP ======================================================
// =================================================================================

var drawingTools = map.drawingTools();
drawingTools.setShown(true);
drawingTools.setLinked(false);
drawingTools.setDrawModes(['polygon', 'rectangle']);
drawingTools.setShape('polygon');

map.setControlVisibility({
  all: false,
  layerList: true,
  zoomControl: true,
  scaleControl: true,
  mapTypeControl: true,
  fullscreenControl: false,
  drawingToolsControl: true
});

// Print welcome message
print('═══════════════════════════════════════════════════════');
print('🌲 Nature Meets Carbon - Sampling Tool (FIXED)');
print('═══════════════════════════════════════════════════════');
print('');
print('VERSION: Fixed pairing + Sample size calculator + Systematic grid');
print('');
print('KEY IMPROVEMENTS:');
print('  1. Sample size calculator with finite population correction');
print('  2. Paired composites are CENTERED on HR cores');
print('  3. Pairing fraction controls paired vs unpaired distribution');
print('  4. TRUE systematic grid using equal-area projection (EPSG:5070)');
print('');
print('SYSTEMATIC GRID METHOD:');
print('  • Uses Albers Equal Area projection for consistent spacing');
print('  • Cell size calculated from AOI area / target points');
print('  • Random offset prevents edge alignment artifacts');
print('  • Grid visualization available for QA/QC (toggle layer on)');
print('');
print('PAIRING LOGIC:');
print('  • Paired composites: Centered exactly on HR core locations');
print('  • Unpaired composites: Distributed per selected strategy');
print('  • Pairing fraction determines the split (e.g., 0.4 = 40% paired)');
print('');
print('Instructions:');
print('  1. Draw or select your area of interest');
print('  2. (Optional) Calculate sample size based on variability');
print('  3. Configure sampling parameters');
print('  4. Click "Generate Sampling Locations"');
print('  5. Export results in your preferred format');
print('');
print('Ready to use!');
