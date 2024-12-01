let map, autocomplete, geocoder, markers = [];

function initMap() {
    const location = { lat: 9.9312, lng: 76.2673 }; // Example default location
    map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 12,
    });

    geocoder = new google.maps.Geocoder();

    // Initialize Google Places Autocomplete for the "Enter Address" field
    const addressInput = document.getElementById("address");
    autocomplete = new google.maps.places.Autocomplete(addressInput, {
        types: ["geocode"], // Suggest only address-related places
    });

    console.log("Autocomplete initialized for #address field");

    // Populate fields when a suggestion is selected
    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            alert("No details available for the selected place.");
            return;
        }

        // Populate latitude and longitude
        document.getElementById("latitude").value = place.geometry.location.lat();
        document.getElementById("longitude").value = place.geometry.location.lng();

        // Populate other address fields
        populateAddressFields(place.address_components);
    });

    // Add functionality for "Add Location" button
    document.getElementById("add-location-btn").addEventListener("click", () => {
        document.getElementById("add-location-form").style.display = "block";
        document.getElementById("overlay").style.display = "block";
    });

    // Close the form
    document.querySelector("#add-location-form .close-btn").addEventListener("click", () => {
        document.getElementById("add-location-form").style.display = "none";
        document.getElementById("overlay").style.display = "none";
        clearForm();
    });

    // Close form by clicking on the overlay
    document.getElementById("overlay").addEventListener("click", () => {
        document.getElementById("add-location-form").style.display = "none";
        document.getElementById("overlay").style.display = "none";
        clearForm();
    });

    // Add map click listener
    map.addListener("click", (event) => {
        const clickedLocation = event.latLng;

        // Geocode the clicked location to get address components
        geocoder.geocode({ location: clickedLocation }, (results, status) => {
            if (status === "OK" && results[0]) {
                const address = results[0];
                document.getElementById("latitude").value = clickedLocation.lat();
                document.getElementById("longitude").value = clickedLocation.lng();

                // Populate the address fields
                populateAddressFields(address.address_components);

                // Set the full address in the "Enter Address" field
                document.getElementById("address").value = address.formatted_address;

                // Open the form
                document.getElementById("add-location-form").style.display = "block";
                document.getElementById("overlay").style.display = "block";
            } else {
                alert("Unable to get address for the clicked location.");
            }
        });
    });

    // Listen for messages from the parent iframe
    window.addEventListener("message", (event) => {
        if (event.data.type === "load-markers") {
            const locations = event.data.locations; // Array of { lat, lng, label, ... }
            preloadMarkers(locations);
        }
    });
}

// Function to preload markers on the map
function preloadMarkers(locations) {
    clearMarkers(); // Clear existing markers
    locations.forEach(location => addMarker(location));
}

// Function to add a single marker to the map
function addMarker(location) {
    const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.label || "Marker",
    });
    markers.push(marker);

    // Optional: Add an info window to display marker details
    const infoWindow = new google.maps.InfoWindow({
        content: `<p><strong>${location.label || "Marker"}</strong></p><p>Latitude: ${location.lat}</p><p>Longitude: ${location.lng}</p>`,
    });

    marker.addListener("click", () => {
        infoWindow.open(map, marker);
    });
}

// Function to clear existing markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Function to populate address fields
function populateAddressFields(addressComponents) {
    const componentForm = {
        street_number: "address-line-1",
        route: "address-line-2",
        locality: "city",
        administrative_area_level_1: "state",
        country: "country",
        postal_code: "pincode",
    };

    addressComponents.forEach(component => {
        const addressType = component.types[0];
        if (componentForm[addressType]) {
            const fieldId = componentForm[addressType];
            document.getElementById(fieldId).value = component.long_name || "";
        }
    });
}

// Submit the form
document.getElementById("submit-location-btn").addEventListener("click", () => {
    const lat = parseFloat(document.getElementById("latitude").value);
    const lng = parseFloat(document.getElementById("longitude").value);
    const address = document.getElementById("address").value;
    const addressLine1 = document.getElementById("address-line-1").value;
    const addressLine2 = document.getElementById("address-line-2").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const country = document.getElementById("country").value;
    const pincode = document.getElementById("pincode").value;

    if (!lat || !lng || !address) {
        alert("Please provide a valid address.");
        return;
    }

    // Add the new location marker on the map
    const newLocation = { lat, lng, label: address };
    addMarker(newLocation);

    // Send data to parent iframe
    const data = {
        address,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        pincode,
        lat,
        lng,
    };
    window.parent.postMessage({ type: "address-data", data }, "*");

    // Clear the form and close
    clearForm();
    document.getElementById("add-location-form").style.display = "none";
    document.getElementById("overlay").style.display = "none";
});

function clearForm() {
    document.querySelectorAll("#add-location-form input").forEach(input => input.value = "");
}
