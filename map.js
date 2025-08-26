// map.js (robusto)
(function(){
  // Crear mapa
  var map = L.map('map', { zoomControl: false });
// Pane especial para Barrios afectados (al frente siempre)
  map.createPane('paneBarrios');
  map.getPane('paneBarrios').style.zIndex = 650;
  map.createPane('paneCoca');
  map.getPane('paneCoca').style.zIndex = 660;

  // Bases
  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var esriSat = L.tileLayer(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 20, attribution: 'Tiles © Esri' }
  );
  // Mobile-only "Centrar mapa" control
  var FitControl = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function(map){
      var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control fit-control');
      var link = L.DomUtil.create('a', '', container);
      link.href = '#';
      link.title = 'Centrar mapa';
      link.innerHTML = '⤢';
      L.DomEvent.disableClickPropagation(link);
      L.DomEvent.on(link, 'click', function(e){
        L.DomEvent.preventDefault(e);
        try {
          if (typeof layer1 !== 'undefined' && layer1 && layer1.getLayers && layer1.getLayers().length){
            map.fitBounds(layer1.getBounds(), { padding:[12,12] });
          } else if (typeof layer2 !== 'undefined' && layer2 && layer2.getLayers && layer2.getLayers().length){
            map.fitBounds(layer2.getBounds(), { padding:[12,12] });
          } else if (typeof layer3 !== 'undefined' && layer3 && layer3.getLayers && layer3.getLayers().length){
            map.fitBounds(layer3.getBounds(), { padding:[12,12] });
          } else {
            map.setView([0,0], 2);
          }
        } catch (err) { console.warn('No se pudo centrar el mapa:', err); }
      });
      return container;
    }
  });
  map.addControl(new FitControl());



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
    layer1 = L.geoJSON(dataBarrios, { interactive: false,
      pane: 'paneBarrios',
      style: function(){ return { color:'#b91c1c', weight:2, fill:true, fillColor:'#fecaca', fillOpacity:0.7 }; },
      onEachFeature: function(f, l){ /* sin popups */ }
    }).addTo(map);
    if (layer1.bringToFront) layer1.bringToFront();
  }

  if (dataHidrica){
  layer2 = L.geoJSON(dataHidrica, {
    style: function(){ return { color:'#1d4ed8', weight:2, opacity:1 }; }
  }).addTo(map);
}


if (dataCoca){
  layer3 = L.geoJSON(dataCoca, {
    pane: 'paneCoca',
    style: function(){ return { color:'#000', weight:2, dashArray:'6 4', fill:true, fillOpacity:0 }; },
    onEachFeature: function(f,l){
      var p = f && f.properties ? f.properties : {};
      var title = p.Layer || p.name || p.Nombre || 'Barrios Coca';
      l.bindPopup("<b>" + title + "</b>");
    }
  }).addTo(map);
}

  // Control de capas
  var baseMaps = { "OSM": osm, "ESRI Satélite": esriSat };
  var overlays = {};
  if (layer1) overlays["Barrios afectados"] = layer1;
  if (layer2) overlays["Red Hídrica"] = layer2;
  if (layer3) overlays["Barrios Coca"] = layer3;
  L.control.layers(baseMaps, overlays, { collapsed: true }, { collapsed: true }).addTo(map);

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
// Leyenda
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML += '<div style="display:flex;align-items:center;margin-bottom:6px;">'
                   + '<span style="background:#fecaca;border:2px solid #b91c1c;width:16px;height:16px;display:inline-block;margin-right:6px;"></span>'
                   + '<span>Barrios afectados</span></div>';
    div.innerHTML += '<div style="display:flex;align-items:center;">'
                   + '<span style="background:#1d4ed8;width:16px;height:2px;display:inline-block;margin-right:6px;"></span>'
                   + '<span>Red Hídrica</span></div>';
    return div;
  };
  legend.addTo(map);

})()
