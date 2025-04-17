const apiKey = config.apiKey;
const defaultSettings = {
  distance: 0.5,       // Default search radius in miles
  price: "2,3",        // Google Places API uses 1-4 ($ - $$$$)
  dietary: "",         // Empty means no filter (future: vegetarian, gluten-free, etc.)
};
// Convert miles to meters (Google Maps API uses meters)
function milesToMeters(miles) {
  return miles * 1609.34;
}

// Load user settings or use defaults
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (settings) => {
      resolve(settings);
    });
  });
}

function showProgress() {
  // hide the wheel & spin button
  document.getElementById("wheel").style.display = "none";
  document.getElementById("spin").style.display  = "none";

  // show both overlays
  document.getElementById("loading-gif").style.display       = "block";
  document.getElementById("progress-container").style.display = "block";

  updateProgress(0);
}

function hideProgress() {
  // hide overlays
  document.getElementById("loading-gif").style.display       = "none";
  document.getElementById("progress-container").style.display = "none";

  // show wheel & spin again
  document.getElementById("wheel").style.display = "block";
  document.getElementById("spin").style.display  = "block";
}

function updateProgress(percent) {
  const bar = document.getElementById("progress-bar");
  bar.style.width = `${percent}%`;
  document.getElementById("progress-text").textContent =
    percent < 100
      ? `Fetching restaurants… ${percent}%`
      : "Processing results…";
}

async function fetchRestaurants() {
  try {
    showProgress(); // Show progress bar
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      const settings = await loadSettings();
      
      // Initial progress update
      updateProgress(10);
      
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${milesToMeters(settings.distance)}&type=restaurant&keyword=healthy&minprice=${settings.price[0]}&maxprice=${settings.price[2]}&key=${apiKey}`;
      
      // Simulate progress during fetch
      const progressInterval = setInterval(() => {
        const currentProgress = parseInt(document.querySelector('#progress-bar').style.width) || 10;
        if (currentProgress < 70) {
          updateProgress(currentProgress + 5);
        }
      }, 50);
      
      const response = await fetch(url);
      const data = await response.json();
      
      clearInterval(progressInterval);
      updateProgress(80);
      
      if (!data.results || data.results.length === 0) {
        console.error("❌ No restaurants found!");
        hideProgress();
        alert("No restaurants found! Try adjusting your settings.");
        return;
      }
      
      // Process restaurants with progress updates
      setTimeout(() => updateProgress(90), 100);
      
      let restaurants = data.results.map((place) => ({
        name: place.name,
        distance: (settings.distance).toFixed(1),
        price: place.price_level ? "$".repeat(place.price_level) : "Unknown",
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        placeId: place.place_id,
        googleMapsLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      }));
      
      // Final processing
      updateProgress(95);
      
      const seen = new Set();
      restaurants = restaurants.filter((restaurant) => {
        if (seen.has(restaurant.name)) return false;
        seen.add(restaurant.name);
        return true;
      });
      
      console.log("✅ Unique Restaurants fetched:", restaurants);
      
      restaurantDetails = restaurants.reduce((acc, r) => {
        acc[r.name] = r;
        return acc;
      }, {});
      
      updateProgress(100);
      
      setTimeout(() => {
        hideProgress();
        document.getElementById("wheel").style.display = "block";
        updateWheel(restaurants);
      }, 500);
      
    }, (error) => {
      console.error("❌ Geolocation error:", error);
      hideProgress();
      alert("Please enable location access to fetch restaurants.");
    });
    
  } catch (error) {
    console.error("❌ Error fetching restaurants:", error);
    hideProgress();
  }
}

  function updateWheel(restaurants) {
    options.length = 0; // Clear the current options array
  
    // Randomly shuffle the restaurants array
    const shuffledRestaurants = [...restaurants].sort(() => Math.random() - 0.5);
  
    // Choose 8 random restaurants
    const selectedRestaurants = shuffledRestaurants.slice(0, 8);
  
    // Extract restaurant names and Google Maps links, and populate options array
    options.push(...selectedRestaurants.map((restaurant) => ({
      name: restaurant.name,
      googleMapsLink: restaurant.googleMapsLink, // Add Google Maps link
    })));
  
    // Debugging: Log the selected restaurants with their links
    console.log("✅ Options for the Wheel:", options);
  
    // Store full restaurant details, including names and links
    restaurantDetails = selectedRestaurants.map((restaurant) => ({
      name: restaurant.name,
      googleMapsLink: restaurant.googleMapsLink // Add the Google Maps link
    }));
  
    console.log("✅ Selected Restaurants for the Wheel:", restaurantDetails);
  
    // Redraw the wheel with the updated options
    drawWheel();
  }  

// 🛠️ Toggle Settings View
function showSettings() {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("settings-view").style.display = "block";
}

function hideSettings() {
  document.getElementById("main-view").style.display = "block";
  document.getElementById("settings-view").style.display = "none";
}

// Ensure scripts run only after DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  await fetchRestaurants();

  // Spin button event
  document.getElementById("spin").addEventListener("click", () => spin());

  // Open settings view
  document.getElementById("open-settings").addEventListener("click", showSettings);

  // Close settings view
  document.getElementById("close-settings").addEventListener("click", hideSettings);

  // Load saved settings into inputs
  const settings = await loadSettings();
  document.getElementById("distance").value = settings.distance;
  document.getElementById("price").value = settings.price;

  // Save settings
  document.getElementById("save-settings").addEventListener("click", async () => {
    const distance = parseFloat(document.getElementById("distance").value);
    const price = document.getElementById("price").value;
  
    // Save the updated settings
    chrome.storage.sync.set({ distance, price }, async () => {
      swal({
        title: `Settings saved!`,
        icon: "success",
        button: false, // Hide the default OK button
      });
  
      // Hide the settings view and fetch new restaurants
      hideSettings();
      await fetchRestaurants(); // Fetch restaurants with the new settings
    });
  }); 
  
  // HISTORY

  document.getElementById("clear-history").addEventListener("click", async () => {
    await chrome.storage.local.set({ history: [] });
    document.getElementById("history-list").innerHTML = ""; // Clear visible list
    swal("History cleared!", { icon: "success" });
  });
  

  document.getElementById("history-btn").addEventListener("click", async () => {
    // hide wheel, show history
    document.getElementById("main-view").style.display = "none";
    document.getElementById("history-view").style.display = "block";
  
    const listEl = document.getElementById("history-list");
    listEl.innerHTML = "";          // clear old
  
    const history = await loadHistory();
    history.forEach(item => {
      const li = document.createElement("li");
      const date = new Date(item.timestamp).toLocaleString();
      li.innerHTML = `
        <strong>${item.name}</strong>
        <span>— ${date}</span>
        <a href="${item.link}" target="_blank">Map</a>
      `;
      listEl.appendChild(li);
    });
  });
  
  document.getElementById("close-history").addEventListener("click", () => {
    // back to wheel
    document.getElementById("history-view").style.display = "none";
    document.getElementById("main-view").style.display = "block";
  });
});


