// map.js
// Inicialización del mapa
var map = L.map('map');

// Pane de alta prioridad para Barrios afectados
map.createPane('paneBarrios');
map.getPane('paneBarrios').style.zIndex = 650; // por encima de overlays y marcadores

/* Grupo de etiquetas para layer3 (Barrios Coca) y su lista de marcadores */
var labelsLayer3 = L.layerGroup().addTo(map);
var markersLayer3 = [];


// Capas base
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map).bringToFront();

var esriSat = L.tileLayer(
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
  { maxZoom: 20, attribution: 'Tiles &copy; Esri' }
);

// Función útil para añadir etiquetas de texto centradas en cada feature

function addLabelForFeature(layer, labelText) {
  try {
    var center;
    if (layer.getLatLng) {
      center = layer.getLatLng();
    } else {
      var b = layer.getBounds();
      if (b && b.getCenter) center = b.getCenter();
    }
    if (!center) return;

    var divIcon = L.divIcon({
      className: '',
      html: "<div style='font-family: Times New Roman, serif; font-weight: bold; color: black; font-size: 12px; text-align:center;'>" + (labelText ? String(labelText) : '') + "</div>",
      iconAnchor: [0, 0]
    });

    var marker = L.marker(center, { icon: divIcon, interactive: false });
    marker.addTo(map);
  } catch (e) {
    console.warn('No se pudo colocar la etiqueta para una feature:', e);
  }
}
    if (!center) return;

    var divIcon = L.divIcon({
      className: 'text-label',
      html: labelText ? String(labelText) : '',
      iconAnchor: [0, 0]
    });

    var marker = L.marker(center, { icon: divIcon, interactive: false });
    marker.addTo(map);
  } catch (e) {
    console.warn('No se pudo colocar la etiqueta para una feature:', e);
  }
}

// Layer 1: Barrios afectados (barrios_afectados.js)
// Se asume una variable global "barriosAfectados" o similar en el archivo JS. Intentaremos detectar.
var layer1 = null;
(function() {
  var data = (typeof barriosAfectados !== "undefined" && barriosAfectados) ? barriosAfectados :
             (typeof barrios_afectados !== "undefined" && barrios_afectados) ? barrios_afectados :
             (typeof barrios !== "undefined" && barrios) ? barrios : null;

  if (data) {
    layer1 = L.geoJSON(data, {
      style: function (feature) {
        return {
          color: "#b91c1c",
          weight: 2,
          fill: true,
          fillColor: "#fecaca",
          fillOpacity: 0.35
        };
      },
      onEachFeature: function (feature, layer) {
        var p = feature && feature.properties ? feature.properties : {};
        var title = p.Layer || p.name || p.Nombre || "Barrio";
        // Popup deshabilitado
      }
    }).addTo(map);
  }
})();

// Layer 2: Red Hídrica (red_hidrica.js)
var layer2 = null;
(function() {
  var data = (typeof redHidrica !== "undefined" && redHidrica) ? redHidrica :
             (typeof red_hidrica !== "undefined" && red_hidrica) ? red_hidrica : null;
  if (data) {
    layer2 = L.geoJSON(data, {
      style: function () {
        return {
          color: "#1d4ed8",
          weight: 2
        };
      },
      onEachFeature: function (feature, layer) {
        var p = feature && feature.properties ? feature.properties : {};
        var title = p.Layer || p.name || p.Nombre || "Red hídrica";
        // Popup deshabilitado
      }
    }).addTo(map);
  }
})();

// Layer 3: Nuevo shape (nuevo_shape.js) — sin relleno, línea negra entrecortada, etiquetas con campo "Layer"
var layer3 = null;
(function() {
  var data = (typeof barrios_coca !== "undefined" && barrios_coca) ? barrios_coca : ((typeof nuevoShape !== "undefined" && nuevoShape) ? nuevoShape : null);
  if (data) {
    layer3 = L.geoJSON(data, {
      style: function () {
        return {
          color: "#000000",
          weight: 2,
          dashArray: "6 4",
          fill: false
        };
      },
      onEachFeature: function (feature, layer) {
        var p = feature && feature.properties ? feature.properties : {};
        var label = p.Layer || p.name || p.Nombre || "Nuevo shape";
        // Popup
        // Popup deshabilitado
        // Etiqueta
        
// Crear etiqueta como marcador (sin fondo, clase .text-label ya definida en CSS)
try {
  var center;
  if (layer.getLatLng) {
    center = layer.getLatLng();
  } else {
    var b = layer.getBounds && layer.getBounds();
    if (b && b.getCenter) center = b.getCenter();
  }
  if (center) {
    var divIcon = L.divIcon({ className: 'text-label', html: String(label || '') });
    var m = L.marker(center, { icon: divIcon, interactive: false });
    markersLayer3.push(m);
    if (map.getZoom() >= 13) {
      m.addTo(labelsLayer3);
    }
  }
} catch (e) { console.warn('No se pudo colocar una etiqueta de layer3:', e); }

      }
    }).addTo(map);
  }
})();

// Control de capas
var baseMaps = { "OSM": osm, "ESRI Satélite": esriSat };
var overlayMaps = {};
if (layer1) overlayMaps["Barrios afectados"] = layer1;
if (layer2) overlayMaps["Red Hídrica"] = layer2;
if (layer3) overlayMaps["Barrios Coca"] = layer3;

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

// Mantener 'Barrios afectados' al frente cuando se activen capas
map.on('overlayadd', function(e) {
  if (e && e.name && e.name.toLowerCase() === 'barrios afectados' && layer1 && layer1.bringToFront) {
    layer1.bringToFront();
  } else if (layer1 && layer1.bringToFront) {
    // Siempre empujar Barrios afectados al frente después de cualquier cambio
    layer1.bringToFront();
  }
});

// Ajustar zoom al layer "Barrios afectados" únicamente, si existe
(function fitBarrios() {
  if (layer1 && layer1.getLayers().length) {
    map.fitBounds(layer1.getBounds(), { padding: [12, 12] });
  } else if (layer2 && layer2.getLayers().length) {
    // fallback por si no hay layer1
    map.fitBounds(layer2.getBounds(), { padding: [12, 12] });
  } else if (layer3 && layer3.getLayers().length) {
    map.fitBounds(layer3.getBounds(), { padding: [12, 12] });
  } else {
    map.setView([0,0], 2);
  }
})();


// Mostrar/ocultar y reubicar etiquetas de layer3 según el zoom
map.on('zoomend', function() {
  refreshLayer3Labels();
});
  }
});


// Si se desactiva 'Barrios Coca', limpiar sus etiquetas
map.on('overlayremove', function(e) {
  if (e && e.name && e.name.toLowerCase() === 'barrios coca') {
    labelsLayer3.clearLayers();
  }
});

// Reubicar etiquetas de layer3 al mover el mapa
map.on('moveend', function() { refreshLayer3Labels(); });


// Utilidad para obtener centro aproximado de una capa vectorial (mejorado con centroides)

function getLayerCenter(layer) {
  try {
    // Point-like layers
    if (layer.getLatLng) return layer.getLatLng();

    // Polygon / MultiPolygon
    if (typeof layer.getLatLngs === 'function') {
      var cPoly = _polygonCentroid(layer);
      if (cPoly) return cPoly;
    }

    // Fallback: bounds center (lines, or degenerate polygons)
    var b = layer.getBounds && layer.getBounds();
    if (b && b.getCenter) return b.getCenter();
  } catch (e) { console.warn('No se pudo obtener centro de capa:', e); }
  return null;
}

    if (layer.feature && layer.feature.geometry) {
      var geom = layer.feature.geometry;
      if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
        var coords = [];
        if (geom.type === "Polygon") {
          coords = geom.coordinates[0];
        } else if (geom.type === "MultiPolygon") {
          coords = geom.coordinates[0][0];
        }
        if (coords && coords.length) {
          var x = 0, y = 0;
          coords.forEach(function(c) { x += c[0]; y += c[1]; });
          var lon = x / coords.length;
          var lat = y / coords.length;
          return L.latLng(lat, lon);
        }
      }
    }
    var b = layer.getBounds && layer.getBounds();
    if (b && b.getCenter) return b.getCenter(); // fallback
  } catch (e) { console.warn('No se pudo obtener centro de capa:', e); }
  return null;
}
\n
// ---- Centroid helpers (planar over WebMercator) ----
function _ringCentroidProjected(ringLatLngs) {
  // ringLatLngs: array of L.LatLng forming a closed ring
  var pts = ringLatLngs.map(function(ll){ return map.options.crs.project(ll); });
  var area = 0, cx = 0, cy = 0;
  for (var i = 0, j = pts.length - 1; i < pts.length; j = i, i++) {
    var p0 = pts[j], p1 = pts[i];
    var f = (p0.x * p1.y - p1.x * p0.y);
    area += f;
    cx += (p0.x + p1.x) * f;
    cy += (p0.y + p1.y) * f;
  }
  if (Math.abs(area) < 1e-12) return null; // degenerate
  area *= 0.5;
  return { x: cx / (6 * area), y: cy / (6 * area), area: Math.abs(area) };
}

function _polygonCentroid(layer) {
  // Supports L.Polygon / MultiPolygon (layer.getLatLngs())
  try {
    var latlngs = layer.getLatLngs();
    if (!latlngs || !latlngs.length) return null;

    // Normalize nesting: MultiPolygon => [ [ [ring] ] ], Polygon => [ [ring] ]
    var polys = latlngs;
    // If first element is not an array of rings, wrap
    if (!Array.isArray(polys[0])) polys = [polys];

    var best = null;
    for (var i = 0; i < polys.length; i++) {
      var rings = polys[i];
      if (!rings || !rings.length) continue;
      // exterior ring is rings[0]
      var ring = rings[0];
      if (ring && ring.length >= 3) {
        var c = _ringCentroidProjected(ring);
        if (c) {
          if (!best || c.area > best.area) best = c;
        }
      }
    }
    if (best) {
      var latlng = map.options.crs.unproject(L.point(best.x, best.y));
      return latlng;
    }
  } catch (e) { console.warn('Centroid error:', e); }
  return null;
}
// ---- End centroid helpers ----
\n
function getLabelFontSize(z) {
  // Simple mapping: <=12 -> 11px, 13 -> 12px, 14 -> 13px, >=15 -> 14px
  if (z <= 12) return 11;
  if (z >= 15) return 14;
  return 10 + z - 1; // z=13->12, z=14->13
}
