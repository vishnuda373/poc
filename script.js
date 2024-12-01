let map, autocomplete, geocoder, markers = [];

function initMap() {
    const location = { lat: 37.7749, lng: -122.4194 }; // Example location: San Francisco
    map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 12,
    });

    geocoder = new google.maps.Geocoder();

    // Autocomplete for address input
    const input = document.getElementById("input-address");
    autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            map.setCenter(place.geometry.location);
        }
    });

    // Submit button listener
    document.getElementById("submit-btn").addEventListener("click", function () {
        const address = input.value;
        if (!address) {
            alert("Please enter a valid address.");
            return;
        }

        geocoder.geocode({ address }, function (results, status) {
            if (status === "OK") {
                const data = {
                    address: address,
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                };

                // Add marker for the new location
                addMarker(results[0].geometry.location, data.address);

                // Send data to parent iframe
                window.parent.postMessage({ type: "address-data", data }, "*");
            } else {
                alert("Geocode was not successful: " + status);
            }
        });
    });

    // Listen for messages from the parent iframe to load markers
    window.addEventListener("message", function (event) {
        if (event.data.type === "load-markers") {
            const locations = event.data.locations; // Array of locations from Zoho Creator
            locations.forEach(location => {
                const latLng = { lat: location.lat, lng: location.lng };
                addMarker(latLng, location.address);
            });
        }
    });
}

// Function to add a marker
function addMarker(latLng, title) {
    const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: title,
    });
    markers.push(marker);
}
