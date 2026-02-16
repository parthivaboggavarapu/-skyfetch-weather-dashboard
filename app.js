// SkyFetch Weather Dashboard - Part 1 API Integration

const apiKey = "a13db263d02aeac9c2474fe2fae8bd7c"; // Replace with your OpenWeatherMap API key

const cityEl = document.getElementById("city");
const tempEl = document.getElementById("temperature");
const descEl = document.getElementById("description");
const iconEl = document.getElementById("icon");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const loadingEl = document.querySelector(".loading");

// Function to fetch weather
async function getWeather(city) {
    if (!city) return;

    // Show loading, hide previous results
    loadingEl.style.display = "block";
    cityEl.textContent = "";
    tempEl.textContent = "";
    descEl.textContent = "";
    iconEl.style.display = "none";

    const apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

    try {
        const response = await axios.get(apiURL);
        const data = response.data;

        cityEl.textContent = data.name;
        tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        descEl.textContent = data.weather[0].description;

        const iconCode = data.weather[0].icon;
        iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        iconEl.style.display = "block";
    } catch (error) {
        console.error(error);
        cityEl.textContent = "City not found 😢";
    } finally {
        loadingEl.style.display = "none";
    }
}

// Event Listeners
searchBtn.addEventListener("click", () => {
    getWeather(cityInput.value);
});

cityInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        getWeather(cityInput.value);
    }
});
