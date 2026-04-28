// Create map
const map = L.map("map").setView([27.5, 90.4], 8);

// Basemap 1: OpenStreetMap
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Basemap 2: OpenTopoMap
const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenTopoMap contributors"
});

// Layer groups
const dzongkhagLayer = L.layerGroup().addTo(map);
const educationLayer = L.layerGroup().addTo(map);
const healthLayer = L.layerGroup().addTo(map);

// Zoom function
function zoomToBhutan() {
  map.setView([27.5, 90.4], 8);
}

// GeoJSON layers
fetch("../Data/bhutan_dzong_web.geojson")
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: "black",
        weight: 1,
        fillColor: "orange",
        fillOpacity: 0.3
      },
      onEachFeature: function(feature, layer) {
        layer.bindPopup("Dzongkhag Boundary");
      }
    }).addTo(dzongkhagLayer);
  });

fetch("../Data/bhutan_education_center.geojson")
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5,
          color: "blue",
          fillColor: "blue",
          fillOpacity: 0.8
        });
      },
      onEachFeature: function(feature, layer) {
        layer.bindPopup("Education Center");
      }
    }).addTo(educationLayer);
  });

fetch("../Data/bhutan_health_center.geojson")
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5,
          color: "red",
          fillColor: "red",
          fillOpacity: 0.8
        });
      },
      onEachFeature: function(feature, layer) {
        layer.bindPopup("Health Center");
      }
    }).addTo(healthLayer);
  });

// Basemap control
const baseMaps = {
  "OpenStreetMap": osm,
  "OpenTopoMap": topo
};

// Overlay control
const overlayMaps = {
  "Dzongkhag Boundary": dzongkhagLayer,
  "Education Centers": educationLayer,
  "Health Centers": healthLayer
};

// Add layer control
L.control.layers(baseMaps, overlayMaps).addTo(map);

// Add a feature group for drawn measurements
const drawnItems = L.featureGroup().addTo(map);

const drawControl = new L.Control.Draw({
  edit: {
    featureGroup: drawnItems,
    edit: false,
    remove: true
  },
  draw: {
    polygon: {
      allowIntersection: false,
      showArea: true,
      metric: true,
      shapeOptions: {
        color: '#f357a1'
      }
    },
    polyline: {
      metric: true,
      shapeOptions: {
        color: '#3388ff'
      }
    },
    rectangle: false,
    circle: false,
    marker: false,
    circlemarker: false
  }
});

map.addControl(drawControl);

function disableDrawInteractions() {
  if (map.dragging && map.dragging.enabled()) map.dragging.disable();
  if (map.doubleClickZoom && map.doubleClickZoom.enabled()) map.doubleClickZoom.disable();
  if (map.scrollWheelZoom && map.scrollWheelZoom.enabled()) map.scrollWheelZoom.disable();
}

function enableDrawInteractions() {
  if (map.dragging && !map.dragging.enabled()) map.dragging.enable();
  if (map.doubleClickZoom && !map.doubleClickZoom.enabled()) map.doubleClickZoom.enable();
  if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled()) map.scrollWheelZoom.enable();
}

map.on('draw:drawstart', disableDrawInteractions);
map.on('draw:drawstop', enableDrawInteractions);

const measureDistanceButton = document.getElementById('measureDistanceBtn');
const measureAreaButton = document.getElementById('measureAreaBtn');

if (measureDistanceButton) {
  measureDistanceButton.addEventListener('click', function() {
    const drawLine = new L.Draw.Polyline(map, drawControl.options.draw.polyline);
    drawLine.enable();
    disableDrawInteractions();
  });
}

if (measureAreaButton) {
  measureAreaButton.addEventListener('click', function() {
    const drawPolygon = new L.Draw.Polygon(map, drawControl.options.draw.polygon);
    drawPolygon.enable();
    disableDrawInteractions();
  });
}

map.on(L.Draw.Event.CREATED, function(event) {
  enableDrawInteractions();
  const layer = event.layer;
  const type = event.layerType;
  let resultText = '';

  if (type === 'polyline') {
    const coords = layer.getLatLngs().map(p => [p.lng, p.lat]);
    const lengthKm = turf.length(turf.lineString(coords), { units: 'kilometers' });
    resultText = `Distance: ${lengthKm.toFixed(3)} km`;
  } else if (type === 'polygon') {
    const latlngs = layer.getLatLngs()[0].map(p => [p.lng, p.lat]);
    if (latlngs.length > 2) {
      latlngs.push(latlngs[0]);
      const areaSqMeters = turf.area(turf.polygon([latlngs]));
      resultText = `Area: ${areaSqMeters.toFixed(2)} m²`;
    }
  }

  if (resultText) {
    layer.bindPopup(resultText).openPopup();
  }

  drawnItems.addLayer(layer);
});

function toggleLegend() {
  const legend = document.getElementById("legendCard");

  if (legend.style.display === "none") {
    legend.style.display = "block";
  } else {
    legend.style.display = "none";
  }
}