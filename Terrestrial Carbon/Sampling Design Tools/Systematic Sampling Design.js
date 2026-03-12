// =================================================================================
// === SYSTEMATIC SAMPLING STRATEGY TOOL FOR CARBON ASSESSMENT =====================
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
  
  // Plot sizes per UNFCCC AR-AM-Tool-03 methodology
  // N = Area / Plot Size (Equation 1)
  FOREST_PLOT_SIZE_HA: 0.04,  // 400 m² = 0.04 ha
  SOIL_PLOT_SIZE_HA: 0.0025,    // 100 m² = 0.01 ha
  
  // Bayesian blending parameters
  // Reference area where measured values get 50% weight
  A_REF: 200000,  // 200,000 ha
  
  // Canada-wide default statistics (prior values)
  DEFAULTS: {
    forest: {
      mean: 4.14,    // t C/ha
      stdDev: 1.8    // t C/ha
    },
    soil: {
      mean: 13.2,    // t C/ha
      stdDev: 10.0   // t C/ha
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
  gridLayer: null,
  carbonStats: null,
  currentCarbonType: null,
  calculatedSampleSize: null,
  
  reset: function() {
    this.currentAoi = null;
    this.currentPoints = null;
    this.carbonStats = null;
    this.currentCarbonType = null;
    this.calculatedSampleSize = null;
    if (this.pointsLayer) {
      map.layers().remove(this.pointsLayer);
      this.pointsLayer = null;
    }
    if (this.gridLayer) {
      map.layers().remove(this.gridLayer);
      this.gridLayer = null;
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
   * z = 2.41 + (-10.9 * α) + (37.7 * α²) - (57.9 * α³)
   */
  calculateZScore: function(confidencePercent) {
    var alpha = 1 - (confidencePercent / 100);
    return 2.41 + (-10.9 * alpha) + (37.7 * Math.pow(alpha, 2)) - (57.9 * Math.pow(alpha, 3));
  },
  
  /**
   * Apply Bayesian blending to measured statistics
   * 
   * Blends measured values with Canada-wide defaults based on AOI area.
   * Larger areas trust measured values more; smaller areas shrink toward defaults.
   * 
   * Formula:
   *   w = A / (A + A_ref)
   *   blended_value = w × measured + (1-w) × default
   * 
   * Where A_ref = 200,000 ha (area where weight = 50%)
   */
  applyBayesianBlending: function(measuredMean, measuredStdDev, areaHa, carbonType) {
    var defaults = CONFIG.DEFAULTS[carbonType];
    
    // Calculate area-based weight: w = A / (A + A_ref)
    var w = areaHa / (areaHa + CONFIG.A_REF);
    
    // Blend measured values with defaults
    var blendedMean = (w * measuredMean) + ((1 - w) * defaults.mean);
    var blendedStdDev = (w * measuredStdDev) + ((1 - w) * defaults.stdDev);
    
    return {
      mean: blendedMean,
      stdDev: blendedStdDev,
      weight: w,
      measuredMean: measuredMean,
      measuredStdDev: measuredStdDev,
      defaultMean: defaults.mean,
      defaultStdDev: defaults.stdDev
    };
  },
  
  /**
   * Calculate sample size using UNFCCC Method I: Sampling Without Replacement
   * Reference: UNFCCC CDM EB 46, Annex 19, Page 4, Equation 5
   * 
   * Now includes Bayesian blending of measured and default statistics.
   * 
   * Formula (for single stratum, no costs):
   *         (N × st)²
   * n = ─────────────────────────
   *     (N × E / z)² + N × st²
   */
  calculateSampleSize: function(measuredMean, measuredStdDev, confidence, marginOfErrorPercent, areaHa, plotSizeHa, carbonType) {
    if (!measuredMean || measuredMean === 0 || !measuredStdDev || measuredStdDev === 0 || !areaHa || areaHa === 0) {
      return null;
    }
    
    // -------------------------------------------------------------------------
    // Step 1: Apply Bayesian blending
    // -------------------------------------------------------------------------
    var blended = this.applyBayesianBlending(measuredMean, measuredStdDev, areaHa, carbonType);
    var mean = blended.mean;
    var stdDev = blended.stdDev;
    
    // -------------------------------------------------------------------------
    // Step 2: Calculate population size (UNFCCC Equation 1)
    // N = A / AP
    // -------------------------------------------------------------------------
    var N = areaHa / plotSizeHa;
    
    // -------------------------------------------------------------------------
    // Step 3: Calculate allowable error (UNFCCC Equation 2)
    // E = Q × p (blended mean × precision)
    // -------------------------------------------------------------------------
    var E = mean * (marginOfErrorPercent / 100);
    
    // -------------------------------------------------------------------------
    // Step 4: Get z-score for confidence level
    // -------------------------------------------------------------------------
    var z = this.calculateZScore(confidence);
    
    // -------------------------------------------------------------------------
    // Step 5: Calculate sample size using Equation 5
    // -------------------------------------------------------------------------
    
    // Numerator: (N × st)²
    var numerator = Math.pow(N * stdDev, 2);
    
    // Denominator Part 1: (N × E / z)²
    var denomPart1 = Math.pow((N * E) / z, 2);
    
    // Denominator Part 2: N × st²
    var denomPart2 = N * Math.pow(stdDev, 2);
    
    // Full denominator
    var denominator = denomPart1 + denomPart2;
    
    // Calculate n
    var n = numerator / denominator;
    
    // -------------------------------------------------------------------------
    // Additional statistics for reporting
    // -------------------------------------------------------------------------
    var cv = (stdDev / mean) * 100;
    var samplingFraction = (n / N) * 100;
    
    return {
      sampleSize: Math.ceil(n),
      zScore: z,
      marginOfErrorAbsolute: E,
      cv: cv,
      populationN: Math.floor(N),
      plotSizeM2: plotSizeHa * 10000,
      samplingFraction: samplingFraction,
      // Blending info
      blendWeight: blended.weight,
      blendedMean: mean,
      blendedStdDev: stdDev,
      measuredMean: blended.measuredMean,
      measuredStdDev: blended.measuredStdDev
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
  },
  
  /**
   * Calculate spacing from target points and area
   */
  calculateSpacingFromPoints: function(numPoints, areaM2) {
    if (!numPoints || !areaM2 || numPoints === 0) {
      return null;
    }
    var areaPerPoint = areaM2 / numPoints;
    return Math.round(Math.sqrt(areaPerPoint));
  }
};

// =================================================================================
// === 5. SYSTEMATIC SAMPLING GENERATOR ============================================
// =================================================================================

var SystematicSampler = {
  
  /**
   * Generates a systematic grid based on a target NUMBER of points.
   * Includes adaptive logic to ensure the output count matches the target.
   * * @param {ee.Geometry} aoi - Area of interest
   * @param {Number} numPoints - Target number of points
   * @param {String} carbonType - 'forest' or 'soil'
   * @param {Function} callback - Callback function(points, spacing, error)
   * @param {Object} _internal - Internal parameters for recursion (do not provide manually)
   */
  generateSystematicGrid: function(aoi, numPoints, carbonType, callback, _internal) {
    // Initialize internal state for recursion
    if (!_internal) _internal = { attempt: 1 };

    var carbonImage = carbonType === 'forest' ? forestCarbon : soilCarbon;
    var carbonMask = carbonImage.mask();
    var CALC_SCALE = 30; // Fine scale for accurate area/masking

    // --- Helper: Run the Generation Process ---
    var runGeneration = function(spacing, sourceAreaForDebug) {
      // 1. Create Grid in Metric Projection (Canada Lambert)
      var proj = ee.Projection('EPSG:3978').atScale(spacing);
      var gridImage = ee.Image.pixelLonLat().reproject(proj);
      
      // 2. Sample Grid Points
      var gridPoints = gridImage.sample({
        region: aoi,
        scale: spacing,
        projection: proj,
        geometries: true,
        dropNulls: true,
        factor: 1
      });

      // 3. Mask Points (Keep only those on valid carbon pixels)
      var pointsWithMask = carbonMask.sampleRegions({
        collection: gridPoints,
        scale: CALC_SCALE,
        geometries: true
      });
      
      var validPoints = pointsWithMask.filter(ee.Filter.eq('b1', 1));

      // 4. Evaluate Count and Adjust if Necessary
      validPoints.size().evaluate(function(actualCount, error) {
        if (error) { callback(null, null, error); return; }
        
        // Define tolerance (e.g., within 10% of target)
        var diff = Math.abs(actualCount - numPoints);
        var tolerance = numPoints * 0.10; 
        
        // RECURSION CHECK: If outside tolerance and we haven't tried too many times...
        if (diff > tolerance && _internal.attempt <= 3) {
           
           // Calculate Adjustment Factor
           // If actual < target, factor < 1 (spacing decreases -> more points)
           // If actual > target, factor > 1 (spacing increases -> fewer points)
           var factor = 1.0;
           if (actualCount === 0) {
             factor = 0.5; // drastic reduction if we missed everything
           } else {
             // Square root relationship because Area ~ Spacing^2
             factor = Math.sqrt(actualCount / numPoints);
           }
           
           var newSpacing = spacing * factor;
           
           print('⚠️ Adjustment (Attempt ' + _internal.attempt + '): Target ' + numPoints + 
                 ', Got ' + actualCount + '. Adjusting spacing from ' + Math.round(spacing) + 
                 'm to ' + Math.round(newSpacing) + 'm');

           // Recursive Call
           _internal.attempt++;
           _internal.forcedSpacing = newSpacing;
           SystematicSampler.generateSystematicGrid(aoi, numPoints, carbonType, callback, _internal);
           
        } else {
           // 5. Finalize Result (Success or Max Attempts Reached)
           
           // Format features for export
           var finalPoints = validPoints.map(function(pt) {
            var coords = pt.geometry().coordinates();
            return ee.Feature(pt.geometry(), {
              'carbon_type': carbonType,
              'sampling_type': 'systematic_grid',
              'lon': coords.get(0),
              'lat': coords.get(1)
            });
          });
          
          callback(finalPoints, spacing, null);
        }
      });
    };

    // --- Main Entry Point ---
    if (_internal.forcedSpacing) {
      // Use the spacing calculated in the previous recursive step
      runGeneration(_internal.forcedSpacing, null);
    } else {
      // First run: Calculate area to determine initial spacing
      var carbonAreaCalc = carbonMask.multiply(ee.Image.pixelArea()).reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: aoi,
        scale: CALC_SCALE,
        maxPixels: 1e13
      });

      carbonAreaCalc.evaluate(function(areaResult, error) {
        if (error) { callback(null, null, error); return; }
        var carbonArea_m2 = areaResult.b1;
        
        if (!carbonArea_m2 || carbonArea_m2 === 0) {
          callback(null, null, 'No ' + carbonType + ' carbon data found in this AOI.');
          return;
        }

        // Initial Spacing Calculation: Spacing = sqrt(Area / N)
        var areaPerPoint = carbonArea_m2 / numPoints;
        var initialSpacing = Math.sqrt(areaPerPoint);
        
        runGeneration(initialSpacing, carbonArea_m2);
      });
    }
  },
  
  /**
   * Creates visual grid lines for display
   */
  createGridLines: function(aoi, cellSize) {
    return aoi.coveringGrid('EPSG:3978', cellSize);
  }
};

// =================================================================================
// === 6. USER INTERFACE ===========================================================
// =================================================================================

ui.root.clear();
var map = ui.Map();
var panel = ui.Panel({style: STYLES.PANEL});
var splitPanel = ui.SplitPanel(panel, map, 'horizontal', false);
ui.root.add(splitPanel);
map.setCenter(-95, 55, 4);

// --- Header ---
panel.add(ui.Label('NxC- Sampling Toolkit', STYLES.TITLE));
panel.add(ui.Label('Systematic Sampling Strategy', STYLES.SUBTITLE));
panel.add(ui.Label(
  'Calculate sample sizes based on carbon variability and generate systematic (grid-based) sampling points.',
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
panel.add(ui.Label('► Use the drawing tools on the map to define an area.', STYLES.INSTRUCTION));

// --- Step 2: Sample Size Calculator ---
panel.add(ui.Label('Step 2: Calculate Sample Size', STYLES.HEADER));

var carbonTypeSelect = ui.Select({
  items: ['Forest Carbon', 'Soil Carbon'],
  value: 'Forest Carbon',
  style: {stretch: 'horizontal', margin: '0 8px'}
});
panel.add(ui.Label('Select Carbon Type:', STYLES.INSTRUCTION));
panel.add(carbonTypeSelect);

var confidenceBox = ui.Textbox({
  placeholder: 'e.g., 90',
  value: CONFIG.DEFAULT_CONFIDENCE.toString(),
  style: {width: '80px', margin: '0 8px'}
});

var marginOfErrorBox = ui.Textbox({
  placeholder: 'e.g., 20',
  value: CONFIG.DEFAULT_MARGIN_OF_ERROR.toString(),
  style: {width: '80px', margin: '0 8px'}
});

panel.add(ui.Panel([
  ui.Label('Confidence Level (%):'),
  confidenceBox
], ui.Panel.Layout.flow('horizontal'), {margin: '4px 8px'}));

panel.add(ui.Panel([
  ui.Label('Margin of Error (%):'),
  marginOfErrorBox
], ui.Panel.Layout.flow('horizontal'), {margin: '4px 8px'}));

// CV Override controls
var cvSlider = ui.Slider({
  min: 1, 
  max: 200, 
  value: 50, 
  step: 1, 
  style: {stretch: 'horizontal', margin: '0 8px'},
  disabled: true // Disabled by default until checkbox is checked
});

var cvOverrideCheck = ui.Checkbox({
  label: 'Override calculated CV (%)', 
  value: false,
  style: {margin: '8px 8px 0 8px', fontWeight: 'bold'},
  onChange: function(checked) {
    cvSlider.setDisabled(!checked);
  }
});

// Add CV controls to panel
panel.add(cvOverrideCheck);
panel.add(cvSlider);

var calculateButton = ui.Button({
  label: 'Calculate Sample Size',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: calculateSampleSize
});
panel.add(calculateButton);

var resultsPanel = ui.Panel({style: {margin: '0 8px'}});
panel.add(resultsPanel);

// --- Step 3: Generate Points ---
panel.add(ui.Label('Step 3: Generate Systematic Grid', STYLES.HEADER));

var numPointsBox = ui.Textbox({
  placeholder: 'Enter number of points...',
  style: {stretch: 'horizontal', margin: '0 8px'}
});
panel.add(numPointsBox);
panel.add(ui.Label('► Enter target points or use the recommendation above.', STYLES.INSTRUCTION));

var spacingInfoLabel = ui.Label('', {
  fontSize: '12px', color: '#666666', margin: '4px 8px', fontStyle: 'italic'
});
panel.add(spacingInfoLabel);

var showGridCheckbox = ui.Checkbox({
  label: 'Show grid lines on map',
  value: true,
  style: {margin: '8px'}
});
panel.add(showGridCheckbox);

var generateButton = ui.Button({
  label: 'Generate Systematic Points',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: generatePoints
});
panel.add(generateButton);

// --- Step 4: Export ---
panel.add(ui.Label('Step 4: Export Points', STYLES.HEADER));

var formatSelect = ui.Select({
  items: ['CSV', 'GeoJSON', 'KML', 'SHP'],
  value: 'CSV',
  style: {stretch: 'horizontal', margin: '0 8px'}
});
panel.add(formatSelect);

var exportButton = ui.Button({
  label: '⬇️ Generate Download Link',
  style: {stretch: 'horizontal', margin: '8px'},
  disabled: true
});
panel.add(exportButton);

var downloadLinksPanel = ui.Panel({style: {margin: '0 8px'}});
panel.add(downloadLinksPanel);

// Clear button
var clearButton = ui.Button({
  label: 'Clear All & Start Over',
  style: {stretch: 'horizontal', margin: '8px'},
  onClick: clearAll
});
panel.add(clearButton);

// =================================================================================
// === 7. CORE FUNCTIONS ===========================================================
// =================================================================================

/**
 * Get AOI from drawing tools or asset
 */
function getAoi() {
  var method = aoiSelection.getValue();
  
  if (method === 'Draw a polygon') {
    var layers = map.drawingTools().layers();
    if (layers.length() === 0 || layers.get(0).geometries().length() === 0) {
      return null;
    }
    return layers.get(0).toGeometry();
  } else {
    var assetId = assetIdBox.getValue();
    if (!assetId || assetId.trim() === '') {
      return null;
    }
    try {
      return ee.FeatureCollection(assetId.trim()).geometry();
    } catch (e) {
      return null;
    }
  }
}

/**
 * Calculate and display sample size
 */
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
  if (!confVal.valid) {
    resultsPanel.add(ui.Label(confVal.message, STYLES.ERROR));
    return;
  }
  
  var moeVal = Utils.validateNumber(marginOfErrorBox.getValue(), 1, 50, 'Margin of error');
  if (!moeVal.valid) {
    resultsPanel.add(ui.Label(moeVal.message, STYLES.ERROR));
    return;
  }
  
  resultsPanel.add(ui.Label('Calculating statistics...', {color: '#666', fontStyle: 'italic'}));
  
  // Add AOI and carbon layers to map
  map.centerObject(AppState.currentAoi);
  map.addLayer(AppState.currentAoi, {color: 'E53935'}, 'Area of Interest');
  map.addLayer(forestCarbon.clip(AppState.currentAoi), fcVis, 'Forest Carbon', false);
  map.addLayer(soilCarbon.clip(AppState.currentAoi), scVis, 'Soil Carbon', false);
  
  // Get carbon type and store in AppState
  var carbonType = carbonTypeSelect.getValue() === 'Forest Carbon' ? 'forest' : 'soil';
  AppState.currentCarbonType = carbonType;
  
  // Calculate statistics
  Utils.calculateCarbonStats(AppState.currentAoi, carbonType).evaluate(function(stats, error) {
    resultsPanel.clear();
    
    if (error) {
      resultsPanel.add(ui.Label('⚠️ Error: ' + error, STYLES.ERROR));
      return;
    }
    
    var mean = stats.b1_mean;
    var stdDev = stats.b1_stdDev;
    var minVal = stats.b1_min;
    var maxVal = stats.b1_max;
    
    if (!mean || !stdDev) {
      resultsPanel.add(ui.Label('⚠️ No ' + carbonType + ' carbon data in this AOI.', STYLES.WARNING));
      return;
    }
    
    AppState.carbonStats = stats;
    
    // Get area in hectares
    var areaHa = stats.area_m2 / 10000;
    
    // Get plot size based on carbon type
    var plotSizeHa = carbonType === 'forest' ? 
      CONFIG.FOREST_PLOT_SIZE_HA : CONFIG.SOIL_PLOT_SIZE_HA;
    
    // Display measured statistics
    resultsPanel.add(ui.Label(carbonTypeSelect.getValue() + ' Statistics', STYLES.SUBHEADER));
    resultsPanel.add(ui.Label('Area: ' + Utils.formatNumber(areaHa, 1) + ' ha', {margin: '4px 8px'}));
    resultsPanel.add(ui.Label('Mean: ' + Utils.formatNumber(mean, 2) + ' t/ha', {margin: '4px 8px'}));
    resultsPanel.add(ui.Label('Std Dev: ' + Utils.formatNumber(stdDev, 2) + ' t/ha', {margin: '4px 8px'}));
    resultsPanel.add(ui.Label('CV: ' + Utils.formatNumber((stdDev/mean)*100, 1) + '%', {margin: '4px 8px'}));
    resultsPanel.add(ui.Label('Range: ' + Utils.formatNumber(minVal, 2) + ' - ' + Utils.formatNumber(maxVal, 2) + ' t/ha', {margin: '4px 8px'}));
    
    // =========================================================
    // [PASTE NEW CODE BELOW THIS LINE]
    // =========================================================

    // [NEW] Handle CV Override
    // Calculate the actual observed CV from the map data
    var observedCv = (stdDev / mean) * 100;
    
    // Check if user wants to override
    if (cvOverrideCheck.getValue()) {
      var manualCv = cvSlider.getValue();
      
      // Recalculate the Standard Deviation based on the Manual CV
      // Formula: StdDev = Mean * (CV / 100)
      stdDev = mean * (manualCv / 100);
      
      resultsPanel.add(ui.Label('⚠️ Using Manual CV: ' + manualCv + '%', STYLES.WARNING));
    } else {
      // If not overriding, update the slider to show the actual calculated CV
      // This helps the user see what the map says before they decide to change it
      cvSlider.setValue(observedCv);
    }

    // =========================================================
    // [PASTE NEW CODE ABOVE THIS LINE]
    // =========================================================
    
    // Calculate sample size with Bayesian blending
    var result = Utils.calculateSampleSize(mean, stdDev, confVal.value, moeVal.value, areaHa, plotSizeHa, carbonType);
    
    if (!result) {
      resultsPanel.add(ui.Label('⚠️ Unable to calculate sample size.', STYLES.WARNING));
      return;
    }
    
    // Store calculated sample size
    AppState.calculatedSampleSize = result.sampleSize;
    
    // Calculate recommended spacing
    var recommendedSpacing = Utils.calculateSpacingFromPoints(result.sampleSize, stats.area_m2);
    
    resultsPanel.add(ui.Label(''));
    resultsPanel.add(ui.Label('Recommended Sample Size', STYLES.SUBHEADER));
    
    var samplePanel = ui.Panel([
      ui.Label(result.sampleSize.toString() + ' samples', {
        fontSize: '24px', fontWeight: 'bold', color: '#005931', margin: '4px 0'
      }),
      ui.Label(confVal.value + '% confidence, ±' + moeVal.value + '% error', {
        fontSize: '11px', color: '#666'
      }),
      ui.Label('Grid spacing: ~' + Utils.formatNumber(recommendedSpacing, 0) + ' m', {
        fontSize: '11px', color: '#666'
      }),
      ui.Label('Population (N): ' + Utils.formatNumber(result.populationN, 0) + ' | Sampling fraction: ' + Utils.formatNumber(result.samplingFraction, 2) + '%', {
        fontSize: '11px', color: '#666'
      })
    ], null, {
      border: '2px solid #005931',
      padding: '12px',
      margin: '8px 0'
    });
    resultsPanel.add(samplePanel);
    
    // Note about methodology
    resultsPanel.add(ui.Label(
      '► UNFCCC Method I (Eq. 5) + Bayesian blending',
      STYLES.INFO
    ));
    
    // Apply button
    var applyButton = ui.Button({
      label: 'Apply to Points Field',
      style: {margin: '4px 0'},
      onClick: function() {
        numPointsBox.setValue(result.sampleSize.toString());
        spacingInfoLabel.setValue('Target spacing: ~' + Utils.formatNumber(recommendedSpacing, 0) + ' m');
        resultsPanel.add(ui.Label('✓ Applied ' + result.sampleSize + ' to points field', STYLES.SUCCESS));
      }
    });
    resultsPanel.add(applyButton);
    
    // Print to console
    print('═══════════════════════════════════════════════════════');
    print('📊 Sample Size - UNFCCC Method I (Equation 5)');
    print('═══════════════════════════════════════════════════════');
    print('Formula: n = (N×st)² / [(N×E/z)² + N×st²]');
    print('');
    print('Carbon Type:', carbonType);
    print('Area:', areaHa.toFixed(1), 'ha');
    print('Plot Size:', (plotSizeHa * 10000).toFixed(0), 'm²');
    print('Population (N):', result.populationN);
    print('');
    print('─── Bayesian Blending ───');
    print('Area weight (w):', (result.blendWeight * 100).toFixed(1) + '%');
    print('Measured Mean:', result.measuredMean.toFixed(2), '→ Blended:', result.blendedMean.toFixed(2), 't/ha');
    print('Measured StdDev:', result.measuredStdDev.toFixed(2), '→ Blended:', result.blendedStdDev.toFixed(2), 't/ha');
    print('');
    print('─── Sample Size Calculation ───');
    print('Confidence:', confVal.value + '%');
    print('Precision:', moeVal.value + '%');
    print('Blended CV:', result.cv.toFixed(1) + '%');
    print('Allowable Error (E):', result.marginOfErrorAbsolute.toFixed(2), 't/ha');
    print('Z-score:', result.zScore.toFixed(4));
    print('');
    print('Grid Spacing:', recommendedSpacing, 'm');
    print('Sampling fraction:', result.samplingFraction.toFixed(2) + '%');
    print('Recommended n:', result.sampleSize);
  });
}

/**
 * Generate systematic sampling points
 */
function generatePoints() {
  // Remove existing points and grid
  if (AppState.pointsLayer) {
    map.layers().remove(AppState.pointsLayer);
    AppState.pointsLayer = null;
  }
  if (AppState.gridLayer) {
    map.layers().remove(AppState.gridLayer);
    AppState.gridLayer = null;
  }
  
  if (!AppState.currentAoi) {
    resultsPanel.add(ui.Label('⚠️ Please calculate sample size first!', STYLES.ERROR));
    return;
  }
  
  if (!AppState.currentCarbonType) {
    resultsPanel.add(ui.Label('⚠️ Please calculate sample size first to set carbon type!', STYLES.ERROR));
    return;
  }
  
  var numVal = Utils.validateNumber(numPointsBox.getValue(), 1, 10000, 'Number of points');
  if (!numVal.valid) {
    resultsPanel.add(ui.Label(numVal.message, STYLES.ERROR));
    return;
  }
  
  var numPoints = numVal.value;
  var carbonType = AppState.currentCarbonType;
  
  // Show loading message
  var loadingLabel = ui.Label('Generating systematic grid in ' + carbonType + ' areas...', {
    color: '#666', fontStyle: 'italic', margin: '4px 8px'
  });
  resultsPanel.add(loadingLabel);
  spacingInfoLabel.setValue('Calculating...');
  
  // Generate systematic grid points using callback-based approach
  SystematicSampler.generateSystematicGrid(
    AppState.currentAoi,
    numPoints,
    carbonType,
    function(points, spacing, error) {
      // Remove loading label
      resultsPanel.remove(loadingLabel);
      
      if (error) {
        resultsPanel.add(ui.Label('⚠️ ' + error, STYLES.ERROR));
        spacingInfoLabel.setValue('');
        return;
      }
      
      var calculatedSpacing = Math.round(spacing);
      
      // Add point IDs
      var pointsList = points.toList(points.size());
      AppState.currentPoints = ee.FeatureCollection(
        pointsList.map(function(pt) {
          var feature = ee.Feature(pt);
          var idx = pointsList.indexOf(pt);
          return feature.set('point_id', ee.String('SYS_').cat(ee.Number(idx).format('%04d')));
        })
      );
      
      // Get actual count and display
      AppState.currentPoints.size().evaluate(function(actualCount, evalError) {
        if (evalError) {
          resultsPanel.add(ui.Label('⚠️ Error: ' + evalError, STYLES.ERROR));
          return;
        }
        
        if (actualCount === 0) {
          resultsPanel.add(ui.Label('⚠️ No points generated. The area may be too small or have no ' + carbonType + ' data.', STYLES.WARNING));
          spacingInfoLabel.setValue('');
          return;
        }
        
        // Update spacing info
        spacingInfoLabel.setValue('Grid spacing: ~' + calculatedSpacing + ' m (' + actualCount + ' points in ' + carbonType + ' areas)');
        
        // Add points to map
        AppState.pointsLayer = ui.Map.Layer(
          AppState.currentPoints,
          {color: carbonType === 'forest' ? '228B22' : '8B4513'},
          carbonType.charAt(0).toUpperCase() + carbonType.slice(1) + ' Systematic Points (' + actualCount + ')'
        );
        map.layers().add(AppState.pointsLayer);
        
        // Add grid lines if checkbox is checked
        if (showGridCheckbox.getValue()) {
          var gridFeatures = SystematicSampler.createGridLines(AppState.currentAoi, calculatedSpacing);
          AppState.gridLayer = ui.Map.Layer(
            gridFeatures,
            {color: 'AAAAAA', strokeWidth: 1},
            'Grid Cells (~' + calculatedSpacing + 'm)',
            true,
            0.3
          );
          map.layers().add(AppState.gridLayer);
        }
        
        // Enable export
        exportButton.setDisabled(false);
        
        // Success message
        var msg = '✓ Generated ' + actualCount + ' systematic points in ' + carbonType + ' areas';
        var percentDiff = Math.abs((actualCount - numPoints) / numPoints * 100);
        if (percentDiff > 15) {
          msg += ' (target was ' + numPoints + ')';
        }
        resultsPanel.add(ui.Label(msg, STYLES.SUCCESS));
        
        print('═══════════════════════════════════════════════════════');
        print('✓ Systematic Grid Generated');
        print('═══════════════════════════════════════════════════════');
        print('Carbon Type:', carbonType);
        print('Target Points:', numPoints);
        print('Actual Points:', actualCount);
        print('Grid Spacing:', calculatedSpacing, 'm');
        print('Points only in ' + carbonType + ' carbon areas: YES');
      });
    }
  );
}

/**
 * Export points
 */
exportButton.onClick(function() {
  if (!AppState.currentPoints) {
    alert('Please generate sampling points first.');
    return;
  }
  
  downloadLinksPanel.clear();
  var format = formatSelect.getValue();
  
  var downloadUrl = AppState.currentPoints.getDownloadURL({
    format: format === 'SHP' ? 'SHP' : format,
    filename: 'systematic_sampling_points'
  });
  
  var downloadLink = ui.Label({
    value: '⬇️ Click to download ' + format + ' file',
    style: {color: '#1976D2', textDecoration: 'underline', margin: '8px', fontWeight: 'bold'},
    targetUrl: downloadUrl
  });
  
  downloadLinksPanel.add(downloadLink);
  print('✓ Export link generated');
});

/**
 * Clear all and reset
 */
function clearAll() {
  AppState.reset();
  map.layers().reset();
  map.drawingTools().clear();
  map.drawingTools().setShown(true);
  resultsPanel.clear();
  downloadLinksPanel.clear();
  numPointsBox.setValue('');
  spacingInfoLabel.setValue('');
  exportButton.setDisabled(true);
  print('✓ Tool reset');
}

// =================================================================================
// === 8. INITIALIZE ===============================================================
// =================================================================================

var drawingTools = map.drawingTools();
drawingTools.setShown(true);
drawingTools.setDrawModes(['polygon', 'rectangle']);
drawingTools.setLinked(false);
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

print('═══════════════════════════════════════════════════════');
print('Nature Meets Carbon - Systematic Sampling Tool');
print('═══════════════════════════════════════════════════════');
