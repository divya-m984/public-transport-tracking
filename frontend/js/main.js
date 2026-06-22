const BACKEND_URL = 'http://localhost:3000';

const BUS_STOP = {
  lat: 28.6139,  // Delhi
  lon: 77.2090
};

// Initialize the map
const map = L.map('map').setView([22.5, 79.0], 5);

// OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Store markers by bus ID
const busMarkers = {};

// Bus info container in the sidebar
const busInfo = document.getElementById('bus-info');

// Update or create a bus marker on the map
function updateMap(busData) {
  const { busId, lat, lon } = busData;
  const latLng = [lat, lon];

  if (busMarkers[busId]) {
    busMarkers[busId].setLatLng(latLng);
  } else {
    busMarkers[busId] = L.marker(latLng).addTo(map);
    busMarkers[busId].bindPopup(`<b>${busId}</b>`);
  }

  updateBusList(busData);
}

//bus calculting distance dwag
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Update or create a bus card in the sidebar
function updateBusList(busData) {
  const { busId, lat, lon } = busData;

  let card = document.getElementById(`bus-${busId}`);

  if (!card) {
    card = document.createElement('div');
    card.className = 'bus-card';
    card.id = `bus-${busId}`;
    busInfo.appendChild(card);
  }

const distance = calculateDistance(lat, lon, BUS_STOP.lat, BUS_STOP.lon);

const speed = 40; // km/h
const totalMinutes = Math.round((distance / speed) * 60);

let displayTime;

if (totalMinutes >= 60) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  displayTime = `${hours} hrs ${minutes} mins`;
} else {
  displayTime = `${totalMinutes} mins`;
}

card.innerHTML = `
  <strong>${busId}</strong>
  <span>ETA to Stop A (Delhi)</span>
  <span style="font-weight: bold; color: #2563eb;">
    ${displayTime}
  </span>
`;
}

// Connect to backend with Socket.IO
const socket = io(BACKEND_URL);

socket.on('connect', () => {
  console.log('Connected to server');
});

// Handle initial bus locations from server
socket.on('initialLocations', (locations) => {
  console.log('Received initial locations:', locations);
  locations.forEach((busData) => {
    updateMap(busData);
  });
});

// Handle real-time bus location updates
socket.on('locationUpdate', (busData) => {
  console.log('Received location update:', busData);
  updateMap(busData);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
