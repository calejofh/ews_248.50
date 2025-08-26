// map.js
var map = L.map('map');

// Pane especial para Barrios afectados (al frente siempre)
map.createPane('paneBarrios');
map.getPane('paneBarrios').style.zIndex = 650;

// Base layers
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var esriSat = L.tileLayer(
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 20, attribution: 'Tiles © Esri' }
);

// --- Helpers ---
function _ringCentroidProjected(ringLatLngs) {
  var pts = ringLatLngs.map(function(ll){ return map.options.crs.project(ll); });
  var area = 0, cx = 0, cy = 0;
  for (var i=0, j=pts.length-1; i<pts.length; j=i++) {
    var p0 = pts[j], p1 = pts[i];
    var f = (p0.x*p1.y - p1.x*p0.y);
    area += f;
    cx += (p0.x+p1.x)*f;
    cy += (p0.y+p1.y)*f;
  }
  if (Math.abs(area)<1e-12) return null;
  area *= 0.5;
  return { x: cx/(6*area), y: cy/(6*area), area: Math.abs(area) };
}

function _polygonCentroid(layer) {
  try {
    var latlngs = layer.getLatLngs();
    if (!latlngs || !latlngs.length) return null;
    if (!Array.isArray(latlngs[0])) latlngs = [latlngs];
    var best=null;
    latlngs.forEach(function(rings){
      if (rings && rings[0] && rings[0].length>=3){
        var c = _ringCentroidProjected(rings[0]);
        if (c && (!best || c.area>best.area)) best=c;
      }
    });
    if (best){
      return map.options.crs.unproject(L.point(best.x,best.y));
    }
  } catch(e){ console.warn('Centroid error:', e); }
  return null;
}

function getLayerCenter(layer){
  try{
    if (layer.getLatLng) return layer.getLatLng(); // Point
    if (typeof layer.getLatLngs==='function'){      // Polygon/MultiPolygon
      var c=_polygonCentroid(layer);
      if (c) return c;
    }
    var b=layer.getBounds && layer.getBounds();     // Lines, fallback
    if (b) return b.getCenter();
  } catch(e){ console.warn('No se pudo obtener centro de capa:', e); }
  return null;
}

function getLabelFontSize(z){
  if (z<=12) return 11;
  if (z>=15) return 14;
  return 10+z-1; // 13->12, 14->13
}

// --- Layers ---
var layer1=null, layer2=null, layer3=null;

// Barrios afectados (al frente, sin popups)
if (typeof barrios_afectados!=="undefined"){
  layer1=L.geoJSON(barrios_afectados,{
    pane:'paneBarrios',
    style:function(){ return {color:'#b91c1c',weight:2,fill:true,fillColor:'#fecaca',fillOpacity:0.35}; },
    onEachFeature:function(f,l){ /* sin popups */ }
  }).addTo(map);
  if (layer1.bringToFront) layer1.bringToFront();
}

// Red hídrica
if (typeof red_hidrica!=="undefined"){
  layer2=L.geoJSON(red_hidrica,{
    style:function(){ return {color:'#1d4ed8',weight:2}; },
    onEachFeature:function(f,l){
      var p=f&&f.properties?f.properties:{};
      var title=p.Layer||p.name||p.Nombre||'Red hídrica';
      l.bindPopup('<b>'+title+'</b>');
    }
  }).addTo(map);
}

// Barrios Coca (línea negra entrecortada, sin relleno) + etiquetas dinámicas
var labelsLayer3=L.layerGroup().addTo(map);
var markersLayer3=[];

if (typeof barrios_coca!=="undefined"){
  layer3=L.geoJSON(barrios_coca,{
    style:function(){ return {color:'#000',weight:2,dashArray:'6 4',fill:false}; },
    onEachFeature:function(f,l){
      var p=f&&f.properties?f.properties:{};
      var label=p.Layer||p.name||p.Nombre||'Barrios Coca';
      var c=getLayerCenter(l);
      if (c){
        var divIcon=L.divIcon({className:'text-label',html:String(label)});
        var m=L.marker(c,{icon:divIcon,interactive:false});
        markersLayer3.push({layer:l,marker:m});
        if (map.getZoom()>=13){
          m.addTo(labelsLayer3);
          setTimeout(function(){ if(m._icon) m._icon.style.fontSize=getLabelFontSize(map.getZoom())+'px'; },0);
        }
      }
    }
  }).addTo(map);
}

// Control de capas
var baseMaps={"OSM":osm,"ESRI Satélite":esriSat};
var overlayMaps={};
if(layer1)overlayMaps['Barrios afectados']=layer1;
if(layer2)overlayMaps['Red Hídrica']=layer2;
if(layer3)overlayMaps['Barrios Coca']=layer3;
L.control.layers(baseMaps,overlayMaps,{collapsed:false}).addTo(map);

// Mantener 'Barrios afectados' al frente
map.on('overlayadd', function(e){
  if (layer1 && layer1.bringToFront) layer1.bringToFront();
});

// Refresco de etiquetas dinámicas
function refreshLayer3Labels(){
  var z=map.getZoom();
  labelsLayer3.clearLayers();
  if (z<13) return;
  var fsize=getLabelFontSize(z)+'px';
  markersLayer3.forEach(function(obj){
    var c=getLayerCenter(obj.layer);
    if (c) obj.marker.setLatLng(c);
    labelsLayer3.addLayer(obj.marker);
    setTimeout(function(){ if(obj.marker._icon) obj.marker._icon.style.fontSize=fsize; },0);
  });
}
map.on('zoomend', refreshLayer3Labels);
map.on('moveend', refreshLayer3Labels);
map.on('overlayremove', function(e){
  if (e && e.name && e.name.toLowerCase()==='barrios coca') labelsLayer3.clearLayers();
});
map.on('overlayadd', function(e){
  if (e && e.name && e.name.toLowerCase()==='barrios coca') refreshLayer3Labels();
});

// Ajuste de vista
if(layer1) map.fitBounds(layer1.getBounds());
else if(layer2) map.fitBounds(layer2.getBounds());
else if(layer3) map.fitBounds(layer3.getBounds());
else map.setView([0,0],2);
