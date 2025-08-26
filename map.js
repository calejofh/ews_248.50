// map.js
// Inicialización del mapa
var map = L.map('map');

// Capas base
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var esriSat = L.tileLayer(
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
  { maxZoom: 20, attribution: 'Tiles &copy; Esri' }
);

// Función útil para añadir etiquetas de texto centradas en cada feature
function addLabelForFeature(layer, labelText) {
  try {
    var center;
    // Para puntos, el centro es su latlng
    if (layer.getLatLng) {
      center = layer.getLatLng();
    } else {
      // Para líneas/polígonos usamos el centro del bounds
      var b = layer.getBounds();
      if (b && b.getCenter) center = b.getCenter();
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
        layer.bindPopup("<b>" + title + "</b>");
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
        layer.bindPopup("<b>" + title + "</b>");
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
        layer.bindPopup("<b>" + label + "</b>");
        // Etiqueta
        addLabelForFeature(layer, label);
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
