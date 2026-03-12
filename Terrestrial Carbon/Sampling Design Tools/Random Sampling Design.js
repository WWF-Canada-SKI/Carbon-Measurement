// =================================================================================
// === RANDOM SAMPLING TOOL ============================================
// =================================================================================

// =================================================================================
// === 1. CONFIGURATION ============================================================
// =================================================================================

var CONFIG = {
  ANALYSIS_SCALE: 250,
  MAX_PIXELS: 1e10,
  MAX_ERROR: 1,
  DEFAULT_CONFIDENCE: 90,
  DEFAULT_MARGIN_OF_ERROR: 20,
  RANDOM_SEED: 42,
  MIN_POINT_DISTANCE: 50, // meters - minimum distance between sampling points
  
  // Plot sizes per UNFCCC AR-AM-Tool-03 methodology
  FOREST_PLOT_SIZE_HA: 0.04,   // 400 m² = 0.04 ha
  SOIL_PLOT_SIZE_HA: 0.01,     // 100 m² = 0.01 ha (change to 0.025 for composites)
  // Bayesian blending parameters
  A_REF: 200000,  // 200,000 ha
  
  // Canada-wide default statistics (Prior Values)
  // CONVERTED: Original t/ha values divided by 10 to get kg/m²
  DEFAULTS: {
    forest: {
      mean: 4.14,    
      stdDev: 1.8   
    },
    soil: {
      mean: 13.2, 
      stdDev: 10.0    
    }
  }
};

var STYLES = {
  TITLE: {fontSize: '28px', fontWeight: 'bold', color: '#005931'},
  SUBTITLE: {fontSize: '18px', fontWeight: '500', color: '#333333'},
  PARAGRAPH: {fontSize: '14px', color: '#555555'},
  HEADER: {fontSize: '16px', fontWeight: 'bold', margin: '16px 0 4px 8px'},
  SUBHEADER: {fontSize: '14px', fontWeight: 'bold', margin: '10px 0 0 0'},
  PANEL: {width: '400px', border: '1px solid #cccccc'},
  HR: ui.Panel(null, ui.Panel.Layout.flow('horizontal'), 
    {border: '1px solid #E0E0E0', margin: '20px 0px'}),
  INSTRUCTION: {fontSize: '12px', color: '#999999', margin: '4px 8px'},
  INFO: {fontSize: '12px', color: '#1976D2', margin: '4px 8px'},
  ERROR: {fontSize: '13px', color: '#D32F2F', fontWeight: 'bold', margin: '8px'},
  SUCCESS: {fontSize: '13px', color: '#388E3C', fontWeight: 'bold', margin: '8px'},
  WARNING: {fontSize: '13px', color: '#F57C00', fontStyle: 'italic', margin: '8px'}
};

// =================================================================================
// === 2. DATA SOURCES =============================================================
// =================================================================================

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
  currentPoints: null,
  pointsLayer: null,
  carbonStats: null,
  currentCarbonType: null,
  
  reset: function() {
    this.currentAoi = null;
    this.currentPoints = null;
    this.carbonStats = null;
    this.currentCarbonType = null;
    if (this.pointsLayer) {
      map.layers().remove(this.pointsLayer);
      this.pointsLayer = null;
    }
  }
};

// =================================================================================
// === 4. UTILITY FUNCTIONS ========================================================
// =================================================================================

var Utils = {
  
  validateNumber: function(value, min, max, name) {
    var num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      return {valid: false, message: name + ' must be between ' + min + ' and ' + max};
    }
    return {valid: true, value: num};
  },
  
  formatNumber: function(num, decimals) {
    decimals = decimals !== undefined ? decimals : 2;
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },
  
  /**
   * Calculate Z-score using polynomial approximation
   */
  calculateZScore: function(confidencePercent) {
    var alpha = 1 - (confidencePercent / 100);
    return 2.41 + (-10.9 * alpha) + (37.7 * Math.pow(alpha, 2)) - (57.9 * Math.pow(alpha, 3));
  },
  
  /**
   * Apply Bayesian blending using proper mixture variance formula
   * CORRECTED: Implements variance of mixture distribution
   */
  applyBayesianBlending: function(measuredMean, measuredStdDev, areaHa, carbonType) {
    var defaults = CONFIG.DEFAULTS[carbonType];
    
    // Calculate area-based weight: w = A / (A + A_ref)
    var w = areaHa / (areaHa + CONFIG.A_REF);
    
    // Blend means
    var blendedMean = (w * measuredMean) + ((1 - w) * defaults.mean);
    
    // CORRECTED: Proper mixture variance formula
    // Var(blend) = w²×σ₁² + (1-w)²×σ₂² + w(1-w)(μ₁-μ₂)²
    var measuredVar = Math.pow(measuredStdDev, 2);
    var defaultVar = Math.pow(defaults.stdDev, 2);
    var meanDiff = measuredMean - defaults.mean;
    
    var blendedVariance = (Math.pow(w, 2) * measuredVar) + 
                          (Math.pow(1 - w, 2) * defaultVar) + 
                          (w * (1 - w) * Math.pow(meanDiff, 2));
    
    var blendedStdDev = Math.sqrt(blendedVariance);
    
    return {
      mean: blendedMean,
      stdDev: blendedStdDev,
      weight: w,
      measuredMean: measuredMean,
      measuredStdDev: measuredStdDev
    };
  },

  /**
   * Calculate carbon statistics for a region
   */
  calculateCarbonStats: function(region, carbonType) {
    var carbonImage = carbonType === 'forest' ? forestCarbon : soilCarbon;
    
    var stats = carbonImage.reduceRegion({
      reducer: ee.Reducer.mean()
        .combine(ee.Reducer.stdDev(), '', true)
        .combine(ee.Reducer.count(), '', true)
        .combine(ee.Reducer.minMax(), '', true),
      geometry: region,
      scale: CONFIG.ANALYSIS_SCALE,
      maxPixels: CONFIG.MAX_PIXELS
    });
    
    var areaM2 = region.area({maxError: CONFIG.MAX_ERROR});
    return ee.Dictionary(stats).set('area_m2', areaM2);
  }
};

// =================================================================================
// === 5. USER INTERFACE ===========================================================
// =================================================================================

ui.root.clear();
var map = ui.Map();
var panel = ui.Panel({style: STYLES.PANEL});
var splitPanel = ui.SplitPanel(panel, map, 'horizontal', false);
ui.root.add(splitPanel);
map.setCenter(-95, 55, 4);

// --- Header ---
panel.add(ui.Label('NxC - Sampling Toolkit', STYLES.TITLE));
panel.add(ui.Label('Random Sampling Strategy', STYLES.SUBTITLE));
panel.add(ui.Label(
  'Calculate sample sizes using finite population correction (kg/m²).',
  STYLES.PARAGRAPH
));
panel.add(STYLES.HR);

// --- Step 1: Define AOI ---
panel.add(ui.Label('Step 1: Define Area of Interest', STYLES.HEADER));

var aoiSelection = ui.Select({
  items: ['Draw a polygon', 'Use a GEE Asset'],
  value: 'Draw a polygon',
  style: {stretch: 'horizontal', margin: '0 8px'},
  onChange: function(value) {
    assetPanel.style().set('shown', value === 'Use a GEE Asset');
    map.drawingTools().setShown(value === 'Draw a polygon');
  }
});

var assetIdBox = ui.Textbox({
  placeholder: 'e.g., users/your_name/your_asset',
  style: {stretch: 'horizontal', margin: '0 8px'}
});

var assetPanel = ui.Panel([
  ui.Label('Enter GEE Asset Path:', STYLES.INSTRUCTION),
  assetIdBox
], null, {shown: false});

panel.add(aoiSelection);
panel.add(assetPanel);
panel.add(ui.Label('► Draw your area of interest on the map', STYLES.INSTRUCTION));

// --- Step 2: Calculate Sample Size ---
panel.add(ui.Label('Step 2: Calculate Sample Size', STYLES.HEADER));

// Carbon type selection
var carbonTypeSelect = ui.Select({
  items: ['Forest Carbon', 'Soil Carbon'],
  value: 'Forest Carbon',
  style: {stretch: 'horizontal', margin: '0 8px'}
});

panel.add(ui.Label('Calculate based on:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(carbonTypeSelect);

// Statistical parameters
var confidenceBox = ui.Textbox({
  placeholder: '70-99',
  value: CONFIG.DEFAULT_CONFIDENCE.toString(),
  style: {width: '80px', margin: '0 8px'}
});

var marginOfErrorBox = ui.Textbox({
  placeholder: '1-50',
  value: CONFIG.DEFAULT_MARGIN_OF_ERROR.toString(),
  style: {width: '80px', margin: '0 8px'}
});

// CV Override controls - CORRECTED: Now applies to BLENDED values
var cvSlider = ui.Slider({
  min: 1, 
  max: 200, 
  value: 50, 
  step: 1, 
  style: {stretch: 'horizontal', margin: '0 8px'},
  disabled: true 
});

var cvOverrideCheck = ui.Checkbox({
  label: 'Override blended CV (%) - disables Bayesian adjustment', 
  value: false,
  style: {margin: '8px 8px 0 8px', fontWeight: 'bold'},
  onChange: function(checked) {
    cvSlider.setDisabled(!checked);
  }
});

panel.add(ui.Panel([
  ui.Label('Confidence Level (%):', {width: '140px'}),
  confidenceBox
], ui.Panel.Layout.flow('horizontal'), {margin: '4px 8px'}));

panel.add(ui.Panel([
  ui.Label('Margin of Error (%):', {width: '140px'}),
  marginOfErrorBox
], ui.Panel.Layout.flow('horizontal'), {margin: '4px 8px'}));

panel.add(cvOverrideCheck);
panel.add(cvSlider);

var calculateButton = ui.Button({
  label: '📊 Calculate Sample Size',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: calculateSampleSize
});
panel.add(calculateButton);

var resultsPanel = ui.Panel({style: {margin: '0 8px'}});
panel.add(resultsPanel);

// --- Step 3: Generate Points ---
panel.add(ui.Label('Step 3: Generate & Export Points', STYLES.HEADER));

var numPointsBox = ui.Textbox({
  placeholder: 'Number of points...',
  style: {stretch: 'horizontal', margin: '0 8px'}
});

panel.add(ui.Label('Number of sampling points:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
panel.add(numPointsBox);

var generateButton = ui.Button({
  label: 'Generate Random Points',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: generatePoints
});
panel.add(generateButton);

// Export section
panel.add(ui.Label('Export Format:', {margin: '8px 8px 4px 8px', fontWeight: 'bold'}));
var formatSelect = ui.Select({
  items: ['CSV', 'GeoJSON', 'KML', 'SHP'],
  value: 'CSV',
  style: {stretch: 'horizontal', margin: '0 8px'}
});
panel.add(formatSelect);

var exportButton = ui.Button({
  label: '⬇️ Export Points',
  style: {stretch: 'horizontal', margin: '8px'},
  disabled: true
});
panel.add(exportButton);

var downloadLinksPanel = ui.Panel({style: {margin: '0 8px'}});
panel.add(downloadLinksPanel);

var clearButton = ui.Button({
  label: 'Clear All & Start Over',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: clearAll
});
panel.add(clearButton);

// =================================================================================
// === 6. CORE FUNCTIONS ===========================================================
// =================================================================================

function getAoi() {
  var method = aoiSelection.getValue();
  if (method === 'Draw a polygon') {
    var layers = map.drawingTools().layers();
    if (layers.length() === 0 || layers.get(0).geometries().length() === 0) return null;
    return layers.get(0).toGeometry();
  } else {
    var assetId = assetIdBox.getValue();
    if (!assetId || assetId.trim() === '') return null;
    try {
      return ee.FeatureCollection(assetId.trim()).union().geometry().buffer(10).simplify(10);
    } catch (e) { return null; }
  }
}

function calculateSampleSize() {
  resultsPanel.clear();
  map.layers().reset();
  
  // Get AOI
  AppState.currentAoi = getAoi();
  if (!AppState.currentAoi) {
    resultsPanel.add(ui.Label('⚠️ Please define an area of interest first!', STYLES.ERROR));
    return;
  }
  
  // Validate inputs
  var confVal = Utils.validateNumber(confidenceBox.getValue(), 70, 99.9, 'Confidence level');
  var moeVal = Utils.validateNumber(marginOfErrorBox.getValue(), 1, 50, 'Margin of error');
  
  if (!confVal.valid || !moeVal.valid) {
    resultsPanel.add(ui.Label('Invalid parameters', STYLES.ERROR));
    return;
  }
  
  resultsPanel.add(ui.Label('Calculating statistics (kg/m²)...', {color: '#666', fontStyle: 'italic', margin: '8px'}));
  
  map.centerObject(AppState.currentAoi, 10);
  map.addLayer(AppState.currentAoi, {color: 'E53935'}, 'Area of Interest');
  map.addLayer(forestCarbon.clip(AppState.currentAoi), fcVis, 'Forest Carbon', false);
  map.addLayer(soilCarbon.clip(AppState.currentAoi), scVis, 'Soil Carbon', false);
  
  var carbonType = carbonTypeSelect.getValue() === 'Forest Carbon' ? 'forest' : 'soil';
  AppState.currentCarbonType = carbonType;
  
  // Calculate statistics
  Utils.calculateCarbonStats(AppState.currentAoi, carbonType).evaluate(function(stats, error) {
    resultsPanel.clear();
    
    if (error) {
      resultsPanel.add(ui.Label('⚠️ Error: ' + error, STYLES.ERROR));
      return;
    }
    
    // -------------------------------------------------------------------------
    // UNIT CONVERSION: t/ha -> kg/m²
    // Factor: 0.1 (1 t/ha = 0.1 kg/m²)
    // -------------------------------------------------------------------------
    var UNIT_CONV = 0.1;
    
    var measuredMean = stats.b1_mean * UNIT_CONV;
    var measuredStdDev = stats.b1_stdDev * UNIT_CONV;
    var minVal = stats.b1_min * UNIT_CONV;
    var maxVal = stats.b1_max * UNIT_CONV;
    
    if (!measuredMean || !measuredStdDev) {
      resultsPanel.add(ui.Label('⚠️ No ' + carbonType + ' carbon data in this AOI.', STYLES.WARNING));
      return;
    }
    
    // Store original stats
    AppState.carbonStats = stats;
    var areaHa = stats.area_m2 / 10000;
    
    // Get plot size (CORRECTED: Soil is now 0.01 ha = 100 m²)
    var plotSizeHa = carbonType === 'forest' ? CONFIG.FOREST_PLOT_SIZE_HA : CONFIG.SOIL_PLOT_SIZE_HA;
    
    // Display Measured Statistics (in kg/m²)
    resultsPanel.add(ui.Label(carbonTypeSelect.getValue() + ' - Measured Stats', STYLES.SUBHEADER));
    resultsPanel.add(ui.Label('Area: ' + Utils.formatNumber(areaHa, 1) + ' ha', {margin: '4px 8px'}));
    resultsPanel.add(ui.Label('Mean: ' + Utils.formatNumber(measuredMean, 3) + ' kg/m²', {margin: '4px 8px'}));
    resultsPanel.add(ui.Label('Std Dev: ' + Utils.formatNumber(measuredStdDev, 3) + ' kg/m²', {margin: '4px 8px'}));
    var measuredCv = (measuredStdDev / measuredMean) * 100;
    resultsPanel.add(ui.Label('CV: ' + Utils.formatNumber(measuredCv, 1) + '%', {margin: '4px 8px'}));
    
    // -------------------------------------------------------------------------
    // CORRECTED CALCULATION LOGIC
    // -------------------------------------------------------------------------
    
    var finalMean, finalStdDev, blendedData;
    
    // 1. Bayesian Blending (CORRECTED variance formula)
    blendedData = Utils.applyBayesianBlending(measuredMean, measuredStdDev, areaHa, carbonType);
    
    // 2. Handle CV Override - CORRECTED: Applies to blended values
    if (cvOverrideCheck.getValue()) {
      var manualCv = cvSlider.getValue();
      finalMean = blendedData.mean;
      finalStdDev = finalMean * (manualCv / 100);
      resultsPanel.add(ui.Label(''));
      resultsPanel.add(ui.Label('⚠️ Manual CV Override Active', STYLES.WARNING));
      resultsPanel.add(ui.Label('Using CV: ' + manualCv + '%', {margin: '4px 8px'}));
    } else {
      finalMean = blendedData.mean;
      finalStdDev = blendedData.stdDev;
      var blendedCv = (finalStdDev / finalMean) * 100;
      
      // Display Bayesian blending info
      resultsPanel.add(ui.Label(''));
      resultsPanel.add(ui.Label('Bayesian Blended Stats', STYLES.SUBHEADER));
      resultsPanel.add(ui.Label('Weight to measured data: ' + Utils.formatNumber(blendedData.weight * 100, 1) + '%', {margin: '4px 8px'}));
      resultsPanel.add(ui.Label('Blended Mean: ' + Utils.formatNumber(finalMean, 3) + ' kg/m²', {margin: '4px 8px'}));
      resultsPanel.add(ui.Label('Blended Std Dev: ' + Utils.formatNumber(finalStdDev, 3) + ' kg/m²', {margin: '4px 8px'}));
      resultsPanel.add(ui.Label('Blended CV: ' + Utils.formatNumber(blendedCv, 1) + '%', {margin: '4px 8px'}));
      
      // Warning for low weight scenarios
      if (blendedData.weight < 0.1) {
        resultsPanel.add(ui.Label('⚠️ Small area: >90% weight to Canada-wide defaults', STYLES.WARNING));
      }
      
      // Auto-populate CV slider with blended value for reference
      cvSlider.setValue(blendedCv);
    }
    
    // 3. Setup Variables for CORRECTED Eq 5
    var N = areaHa / plotSizeHa;           // Population Size
    var z = Utils.calculateZScore(confVal.value); // Z-Score
    var E = finalMean * (moeVal.value / 100);     // Allowable Error (Absolute kg/m²)
    var sigma = finalStdDev;
    
    // 4. CORRECTED Equation 5 Implementation
    // Standard formula: n = (N × σ² × Z²) / ((N-1) × E² + σ² × Z²)
    // Simplified: n = (Z² × σ²) / (E² + (Z² × σ²)/N)
    
    var numerator = N * Math.pow(sigma, 2) * Math.pow(z, 2);
    var denominator = (N - 1) * Math.pow(E, 2) + Math.pow(sigma, 2) * Math.pow(z, 2);
    var n_final = numerator / denominator;
    
    // Alternative simplified form (for verification):
    var alt_numerator = Math.pow(z, 2) * Math.pow(sigma, 2);
    var alt_denominator = Math.pow(E, 2) + (Math.pow(z, 2) * Math.pow(sigma, 2)) / N;
    var n_alt = alt_numerator / alt_denominator;
    
    // -------------------------------------------------------------------------
    // OUTPUT RESULTS
    // -------------------------------------------------------------------------
    resultsPanel.add(ui.Label(''));
    resultsPanel.add(ui.Label('Recommended Sample Size', STYLES.SUBHEADER));
    
    var samplePanel = ui.Panel([
      ui.Label(Math.ceil(n_final).toString() + ' samples', {
        fontSize: '24px', fontWeight: 'bold', color: '#005931', margin: '4px 0'
      }),
      ui.Label(confVal.value + '% confidence, ±' + moeVal.value + '% error', {fontSize: '11px', color: '#666'}),
      ui.Label('Margin of Error: ±' + E.toFixed(3) + ' kg/m²', {fontSize: '11px', color: '#666'}),
      ui.Label('Pop (N): ' + Utils.formatNumber(N, 0) + ' | Plot: ' + (plotSizeHa * 10000) + ' m²', {fontSize: '11px', color: '#666'}),
      ui.Label('Z-score: ' + z.toFixed(3), {fontSize: '11px', color: '#666'})
    ], null, {border: '2px solid #005931', padding: '12px', margin: '8px 0'});
    
    resultsPanel.add(samplePanel);
    
    var applyButton = ui.Button({
      label: 'Apply to Points Field',
      style: {margin: '4px 0', stretch: 'horizontal'},
      onClick: function() {
        numPointsBox.setValue(Math.ceil(n_final).toString());
        resultsPanel.add(ui.Label('✓ Applied ' + Math.ceil(n_final) + ' to points field', STYLES.SUCCESS));
      }
    });
    resultsPanel.add(applyButton);
    
    // Console Logs for verification
    print('=== CALCULATION SUMMARY (kg/m²) ===');
    print('Measured Mean:', measuredMean.toFixed(3), 'StdDev:', measuredStdDev.toFixed(3), 'CV:', measuredCv.toFixed(1) + '%');
    print('Final Mean:', finalMean.toFixed(3), 'StdDev:', finalStdDev.toFixed(3));
    print('Area:', areaHa.toFixed(1), 'ha | Plot Size:', plotSizeHa, 'ha');
    print('Population (N):', N.toFixed(0));
    print('Z-score:', z.toFixed(3), '| Error (E):', E.toFixed(3));
    print('Sample Size (n):', Math.ceil(n_final));
    print('Verification (alt formula):', Math.ceil(n_alt));
    print('CV Override Active:', cvOverrideCheck.getValue());
    if (blendedData) {
      print('Bayesian Weight:', (blendedData.weight * 100).toFixed(1) + '%');
    }
  });
}

function generatePoints() {
  if (AppState.pointsLayer) {
    map.layers().remove(AppState.pointsLayer);
    AppState.pointsLayer = null;
  }
  
  if (!AppState.currentAoi) {
    resultsPanel.add(ui.Label('⚠️ Please calculate sample size first!', STYLES.ERROR));
    return;
  }
  
  var numVal = Utils.validateNumber(numPointsBox.getValue(), 1, 10000, 'Number of points');
  if (!numVal.valid) {
    resultsPanel.add(ui.Label(numVal.message, STYLES.ERROR));
    return;
  }
  
  var numPoints = numVal.value;
  var carbonType = AppState.currentCarbonType;
  var carbonImage = carbonType === 'forest' ? forestCarbon : soilCarbon;
  var validMask = carbonImage.mask();
  
  resultsPanel.add(ui.Label('Generating spatially distributed points...', {color: '#666', fontStyle: 'italic', margin: '4px 8px'}));
  
  // Generate more candidates to allow for spatial filtering
  var candidatePoints = ee.FeatureCollection.randomPoints({
    region: AppState.currentAoi,
    points: numPoints * 5, // Increased multiplier for spatial filtering
    seed: CONFIG.RANDOM_SEED
  });
  
  // Filter by valid carbon data
  var filteredPoints = candidatePoints.map(function(pt) {
    var isValid = validMask.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: pt.geometry(),
      scale: CONFIG.ANALYSIS_SCALE
    }).values().get(0);
    return pt.set('valid', isValid);
  }).filter(ee.Filter.eq('valid', 1));
  
  // ADDED: Spatial filtering to maintain minimum distance
  // This is a simplified approach - for production use, consider more sophisticated algorithms
  var spatiallyFilteredPoints = ee.FeatureCollection(
    ee.List(filteredPoints.toList(numPoints * 3).iterate(
      function(point, list) {
        list = ee.List(list);
        point = ee.Feature(point);
        
        // Check if point is far enough from all existing points
        var existingPoints = ee.FeatureCollection(list);
        var tooClose = existingPoints.filterBounds(
          point.geometry().buffer(CONFIG.MIN_POINT_DISTANCE)
        ).size();
        
        return ee.Algorithms.If(
          tooClose.eq(0),
          list.add(point),
          list
        );
      },
      ee.List([])
    ))
  ).limit(numPoints);
  
  AppState.currentPoints = spatiallyFilteredPoints;
  
  AppState.currentPoints.size().evaluate(function(actualCount) {
    AppState.pointsLayer = ui.Map.Layer(
      AppState.currentPoints,
      {color: carbonType === 'forest' ? '228B22' : '8B4513'},
      'Sampling Points (' + actualCount + ')'
    );
    map.layers().add(AppState.pointsLayer);
    exportButton.setDisabled(false);
    
    if (actualCount < numPoints) {
      resultsPanel.add(ui.Label('⚠️ Generated ' + actualCount + ' points (requested ' + numPoints + ')', STYLES.WARNING));
      resultsPanel.add(ui.Label('Limited by AOI size or min. distance constraint', {fontSize: '11px', color: '#666', margin: '0 8px'}));
    } else {
      resultsPanel.add(ui.Label('✓ Generated ' + actualCount + ' points (min. ' + CONFIG.MIN_POINT_DISTANCE + 'm apart)', STYLES.SUCCESS));
    }
  });
}

exportButton.onClick(function() {
  if (!AppState.currentPoints) return;
  downloadLinksPanel.clear();
  var format = formatSelect.getValue();
  var exportData = AppState.currentPoints.map(function(f, idx) {
    var coords = f.geometry().coordinates();
    return f.set({
      'point_id': ee.Number(idx).add(1),
      'longitude': coords.get(0),
      'latitude': coords.get(1),
      'export_format': format,
      'date': ee.Date(Date.now()).format('YYYY-MM-dd'),
      'carbon_type': AppState.currentCarbonType
    });
  });
  var downloadUrl = exportData.getDownloadURL({
    format: format === 'SHP' ? 'SHP' : format,
    filename: 'sampling_points_' + AppState.currentCarbonType + '_' + new Date().getTime()
  });
  downloadLinksPanel.add(ui.Label({
    value: '⬇️ Download (' + format + ')',
    style: {color: '#1976D2', textDecoration: 'underline', margin: '8px', fontWeight: 'bold'},
    targetUrl: downloadUrl
  }));
});

function clearAll() {
  AppState.reset();
  map.layers().reset();
  map.drawingTools().clear();
  map.drawingTools().setShown(true);
  resultsPanel.clear();
  downloadLinksPanel.clear();
  numPointsBox.setValue('');
  exportButton.setDisabled(true);
  cvOverrideCheck.setValue(false);
  cvSlider.setDisabled(true);
}

// =================================================================================
// === 7. INITIALIZE ===============================================================
// =================================================================================

var drawingTools = map.drawingTools();
drawingTools.setShown(true);
drawingTools.setDrawModes(['polygon', 'rectangle']);
drawingTools.setShape('polygon');

map.setControlVisibility({all: false, layerList: true, zoomControl: true, scaleControl: true, mapTypeControl: true, drawingToolsControl: true});
