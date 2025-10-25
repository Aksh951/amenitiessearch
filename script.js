// ** Leaflet Map Setup **
// Abu Dhabi coordinates: [latitude, longitude]
const ABU_DHABI_CENTER = [24.47, 54.37]; 
const INITIAL_ZOOM = 12;

// Initialize the map
const map = L.map('map').setView(ABU_DHABI_CENTER, INITIAL_ZOOM);

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Global variable to hold all loaded features
let allAmenitiesData = null;
// Global variable to hold the current visible GeoJSON layer
let currentLayer = null;

// ** Data Loading **
// Fetch the GeoJSON data
fetch('data.geojson')
    .then(response => response.json())
    .then(data => {
        allAmenitiesData = data;
        // Initially show all amenities
        filterAndDisplayFeatures(''); 
    })
    .catch(error => {
        console.error('Error loading GeoJSON data:', error);
        alert('Could not load amenity data.');
    });

// ** Core Filtering Function **
/**
 * Filters the amenity data based on a search query and updates the map.
 * @param {string} query The user's search string (e.g., "Show parks").
 */
function filterAndDisplayFeatures(query) {
    if (!allAmenitiesData) return;
    
    // Clear previous layer if it exists
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }

    const lowerQuery = query.toLowerCase();
    
    // 1. **Keyword Matching (Amenity Type)**
    let amenityFilter = null;
    if (/(parks?)/.test(lowerQuery)) {
        amenityFilter = 'park';
    } else if (/(hospitals?|clinics?)/.test(lowerQuery)) {
        amenityFilter = 'hospital';
    }
    
    // 2. **Location Filter (Optional)**
    let locationFilter = null;
    if (/(near|at|in)\s+(corniche)/.test(lowerQuery)) {
        locationFilter = 'corniche';
    }

    // Filter logic
    const filteredFeatures = allAmenitiesData.features.filter(feature => {
        const props = feature.properties;
        let match = true;

        // Check amenity type
        if (amenityFilter && props.amenity_type !== amenityFilter) {
            match = false;
        }

        // Check location (optional feature)
        if (match && locationFilter) {
            // Case-insensitive check on the 'area' property
            if (!props.area || props.area.toLowerCase().indexOf(locationFilter) === -1) {
                match = false;
            }
        }

        // If no amenity type was specified but a location was, we still show all matching the location.
        // If no filter at all (empty query), match is always true.
        return match;
    });

    // 3. **Display Filtered Results**
    const filteredGeoJSON = {
        type: 'FeatureCollection',
        features: filteredFeatures
    };
    
    currentLayer = L.geoJSON(filteredGeoJSON, {
        pointToLayer: function (feature, latlng) {
            // Custom marker style based on amenity type
            let color = feature.properties.amenity_type === 'park' ? 'green' : 'red';
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: color,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: function (feature, layer) {
            // Add a popup with the name and amenity type
            layer.bindPopup(`<b>${feature.properties.name}</b><br>${feature.properties.amenity_type}`);
        }
    }).addTo(map);

    // Zoom to the bounds of the results if any were found
    if (filteredFeatures.length > 0) {
        map.fitBounds(currentLayer.getBounds(), { padding: [50, 50] });
    } else if (query !== '') {
        alert('No results found for your query.');
        // If no results, reset to default view
        map.setView(ABU_DHABI_CENTER, INITIAL_ZOOM); 
    }
}


// ** Event Listener Setup **
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Handle button click
searchButton.addEventListener('click', () => {
    filterAndDisplayFeatures(searchInput.value);
});

// Handle 'Enter' key press in the input field
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        filterAndDisplayFeatures(searchInput.value);
    }
});