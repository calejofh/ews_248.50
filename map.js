// map.js (robusto)
(function(){
  // Crear mapa
  var map = L.map('map');

  // Pane especial para Barrios afectados (al frente siempre)
  map.createPane('paneBarrios');
  map.getPane('paneBarrios').style.zIndex = 650;

  // Bases
  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var esriSat = L.tileLayer(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 20, attribution: 'Tiles © Esri' }
  );

  // Helper para resolver variables globales con múltiples nombres posibles
      return null;
  }

  // Datos
  var dataBarrios = typeof barrios_afectados !== 'undefined' ? barrios_afectados : null;
var dataHidrica = typeof red_hidrica !== 'undefined' ? red_hidrica : null;
var dataCoca = typeof barrios_coca !== 'undefined' ? barrios_coca : null;
// Helpers popups y estilo
  function titleFromProps(fallback){
    return function(feature){
      var p = feature && feature.properties ? feature.properties : {};
      return p.Layer || p.name || p.Nombre || fallback;
    };
  }

  // Capas
  var layer1=null, layer2=null, layer3=null;

  if (dataBarrios){
    layer1 = L.geoJSON(dataBarrios, {
      pane: 'paneBarrios',
      style: function(){ return { color:'#b91c1c', weight:2, fill:true, fillColor:'#fecaca', fillOpacity:0.35 }; },
      onEachFeature: function(f, l){ /* sin popups */ }
    }).addTo(map);
    if (layer1.bringToFront) layer1.bringToFront();
  }

  if (dataHidrica){
    layer2 = L.geoJSON(dataHidrica, {
      style: function(){ return { color:'#1d4ed8', weight:2 }; },
      onEachFeature: function(f,l){
        l.bindPopup('<b>'+ titleFromProps('Red hídrica')(f) +'</b>');
      }
    }).addTo(map);
  }

  if (dataCoca){
    layer3 = L.geoJSON(dataCoca, {
      style: function(){ return { color:'#000', weight:2, dashArray:'6 4', fill:false }; },
      onEachFeature: function(f,l){
        l.bindPopup('<b>'+ titleFromProps('Barrios Coca')(f) +'</b>');
      }
    }).addTo(map);
  }

  // Control de capas
  var baseMaps = { "OSM": osm, "ESRI Satélite": esriSat };
  var overlays = {};
  if (layer1) overlays["Barrios afectados"] = layer1;
  if (layer2) overlays["Red Hídrica"] = layer2;
  if (layer3) overlays["Barrios Coca"] = layer3;
  L.control.layers(baseMaps, overlays, { collapsed:false }).addTo(map);

  // Mantener 'Barrios afectados' al frente en cualquier cambio
  map.on('overlayadd', function(){ if (layer1 && layer1.bringToFront) layer1.bringToFront(); });

  // Ajuste de vista
  if (layer1 && layer1.getLayers().length) {
    map.fitBounds(layer1.getBounds(), { padding:[12,12] });
  } else if (layer2 && layer2.getLayers().length) {
    map.fitBounds(layer2.getBounds(), { padding:[12,12] });
  } else if (layer3 && layer3.getLayers().length) {
    map.fitBounds(layer3.getBounds(), { padding:[12,12] });
  } else {
    map.setView([0,0], 2);
  }
})();