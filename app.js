let apiKey = 'a13db263d02aeac9c2474fe2fae8bd7c';

function WeatherApp(options) {
    this.apiKey = (options && options.apiKey) || apiKey;

    // Cache DOM references
    this.cityEl = document.getElementById('city');
    this.tempEl = document.getElementById('temperature');
    this.descEl = document.getElementById('description');
    this.iconEl = document.getElementById('icon');
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.cityInput = document.getElementById('cityInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.loadingEl = document.getElementById('loading');
    this.errorContainerEl = document.getElementById('errorContainer');
    this.errorEl = document.getElementById('error');
    this.weatherCard = document.getElementById('weather-card');

    // Recent searches references
    this.recentSearchesSection = document.getElementById('recent-searches-section');
    this.recentSearchesContainer = document.getElementById('recent-searches-container');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Create forecast container dynamically (keeps HTML unchanged)
    this.forecastContainer = document.createElement('div');
    this.forecastContainer.id = 'forecast-container';
    this.forecastContainer.className = 'forecast-container';

    // Insert after weather card
    if (this.weatherCard && this.weatherCard.parentNode) {
        this.weatherCard.parentNode.insertBefore(this.forecastContainer, this.weatherCard.nextSibling);
    }

    // Recent searches array
    this.recentSearches = [];
}

WeatherApp.prototype.init = function () {
    // Load recent searches first
    this.loadRecentSearches();

    // Bind handlers
    if (this.searchBtn) this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
    if (this.cityInput) this.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleSearch();
        }
    });

    if (this.apiKeyInput) {
        const savedKey = localStorage.getItem('owm_api_key');
        if (savedKey) this.apiKeyInput.value = savedKey;

        this.apiKeyInput.addEventListener('blur', () => {
            if (this.apiKeyInput.value.trim()) {
                localStorage.setItem('owm_api_key', this.apiKeyInput.value.trim());
            }
        });
    }

    // Clear history button
    if (this.clearHistoryBtn) {
        this.clearHistoryBtn.addEventListener('click', this.clearHistory.bind(this));
    }

    // Load last searched city
    this.loadLastCity();

    if (this.cityInput) this.cityInput.focus();
};

WeatherApp.prototype.showWelcome = function () {
    if (this.cityEl) this.cityEl.innerText = '👋 Welcome to SkyFetch!';
    if (this.tempEl) this.tempEl.innerText = 'Enter a city name and click Search';
    if (this.descEl) this.descEl.innerText = 'or press Enter to get started';
    if (this.errorEl) this.errorEl.innerText = '';
};

WeatherApp.prototype.showLoading = function () {
    if (this.loadingEl) this.loadingEl.style.display = 'flex';
    if (this.errorContainerEl) this.errorContainerEl.style.display = 'none';
    if (this.weatherCard) this.weatherCard.style.display = 'none';
    if (this.forecastContainer) this.forecastContainer.style.display = 'none';
};

WeatherApp.prototype.showError = function (message) {
    if (this.loadingEl) this.loadingEl.style.display = 'none';
    if (this.errorContainerEl) this.errorContainerEl.style.display = 'block';
    if (this.weatherCard) this.weatherCard.style.display = 'none';
    if (this.forecastContainer) this.forecastContainer.style.display = 'none';
    if (this.errorEl) this.errorEl.innerText = message;
    console.error('Weather Error:', message);
};

WeatherApp.prototype.validateInput = function (city) {
    if (!city || city.trim() === '') {
        this.showError('❌ Please enter a city name');
        return false;
    }
    if (city.trim().length < 2) {
        this.showError('❌ City name must be at least 2 characters long');
        return false;
    }
    return true;
};

WeatherApp.prototype.getEffectiveApiKey = function () {
    const keyFromInput = this.apiKeyInput && this.apiKeyInput.value ? this.apiKeyInput.value.trim() : null;
    const stored = localStorage.getItem('owm_api_key');
    const effectiveKey = keyFromInput || stored || this.apiKey;

    if (!effectiveKey || effectiveKey === 'YOUR_API_KEY_HERE') {
        return null;
    }

    if (keyFromInput) {
        localStorage.setItem('owm_api_key', keyFromInput);
    }

    return effectiveKey;
};

WeatherApp.prototype.handleSearch = function () {
    const city = this.cityInput ? this.cityInput.value.trim() : '';
    this.getWeather(city);
};

// Load recent searches from localStorage
WeatherApp.prototype.loadRecentSearches = function () {
    try {
        const stored = localStorage.getItem('recentSearches');
        this.recentSearches = stored ? JSON.parse(stored) : [];
        this.displayRecentSearches();
    } catch (e) {
        console.warn('Error loading recent searches:', e);
        this.recentSearches = [];
    }
};

// Save a new search to localStorage
WeatherApp.prototype.saveRecentSearch = function (city) {
    if (!city || city.trim() === '') return;

    // Convert to Title Case
    const titleCaseCity = city.trim().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    // Remove duplicates - if city exists, remove it from array
    this.recentSearches = this.recentSearches.filter(
        c => c.toLowerCase() !== titleCaseCity.toLowerCase()
    );

    // Add to front of array
    this.recentSearches.unshift(titleCaseCity);

    // Keep only last 5 searches
    if (this.recentSearches.length > 5) {
        this.recentSearches = this.recentSearches.slice(0, 5);
    }

    // Save to localStorage
    try {
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
        localStorage.setItem('lastCity', titleCaseCity);
        this.displayRecentSearches();
    } catch (e) {
        console.warn('Error saving recent searches:', e);
    }
};

// Display recent searches as clickable buttons
WeatherApp.prototype.displayRecentSearches = function () {
    if (!this.recentSearchesContainer) return;

    if (this.recentSearches.length === 0) {
        if (this.recentSearchesSection) this.recentSearchesSection.style.display = 'none';
        return;
    }

    if (this.recentSearchesSection) this.recentSearchesSection.style.display = 'block';

    let html = '';
    this.recentSearches.forEach(city => {
        html += `<button class="recent-search-btn" data-city="${city}">${city}</button>`;
    });

    this.recentSearchesContainer.innerHTML = html;

    // Add click handlers to recent search buttons
    const buttons = this.recentSearchesContainer.querySelectorAll('.recent-search-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const city = e.target.getAttribute('data-city');
            if (this.cityInput) this.cityInput.value = city;
            this.getWeather(city);
        });
    });
};

// Load last searched city
WeatherApp.prototype.loadLastCity = function () {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        if (this.cityInput) this.cityInput.value = lastCity;
        // Automatically fetch last city's weather
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};

// Clear search history
WeatherApp.prototype.clearHistory = function () {
    if (confirm('Are you sure you want to clear your search history?')) {
        this.recentSearches = [];
        try {
            localStorage.removeItem('recentSearches');
            localStorage.removeItem('lastCity');
            this.displayRecentSearches();
            this.showWelcome();
            if (this.cityInput) this.cityInput.value = '';
        } catch (e) {
            console.warn('Error clearing history:', e);
        }
    }
};

WeatherApp.prototype.getForecast = function (city, key) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(key)}&units=metric`;
    return axios.get(url);
};

WeatherApp.prototype.processForecastData = function (forecastData) {
    if (!forecastData || !forecastData.list) return [];

    // Filter for entries at 12:00:00 (noon) to represent each day
    const noonEntries = forecastData.list.filter(item => item.dt_txt && item.dt_txt.includes('12:00:00'));

    // If API doesn't include noon entries for some reason, fall back to picking one per day
    let selected = noonEntries.length >= 5 ? noonEntries.slice(0, 5) : [];
    if (selected.length < 5) {
        // Group by date and pick the first entry for each date
        const byDate = {};
        for (const item of forecastData.list) {
            const date = item.dt_txt.split(' ')[0];
            if (!byDate[date]) byDate[date] = item;
        }
        selected = Object.values(byDate).slice(0, 5);
    }

    // Map to simplified forecast objects
    return selected.map(item => {
        const date = new Date(item.dt_txt);
        const day = date.toLocaleDateString(undefined, { weekday: 'short' });
        return {
            date: item.dt_txt,
            day,
            temp: Math.round(item.main.temp),
            icon: item.weather && item.weather[0] && item.weather[0].icon ? item.weather[0].icon : '',
            description: item.weather && item.weather[0] && item.weather[0].description ? item.weather[0].description : ''
        };
    });
};

WeatherApp.prototype.displayWeather = function (data) {
    if (!data || !data.main) {
        this.showError('Invalid data received from API');
        return;
    }

    if (this.loadingEl) this.loadingEl.style.display = 'none';
    if (this.errorContainerEl) this.errorContainerEl.style.display = 'none';
    if (this.weatherCard) this.weatherCard.style.display = 'block';

    if (this.cityEl) this.cityEl.innerText = data.name || 'Unknown City';
    if (this.tempEl) this.tempEl.innerText = `🌡️ Temperature: ${Math.round(data.main.temp)}°C`;

    const desc = data.weather && data.weather[0] && data.weather[0].description
        ? data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)
        : 'No description';
    if (this.descEl) this.descEl.innerText = `☁️ Condition: ${desc}`;

    const iconCode = data.weather && data.weather[0] && data.weather[0].icon ? data.weather[0].icon : '';
    if (iconCode && this.iconEl) {
        this.iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        this.iconEl.alt = desc || 'weather icon';
    }
};

WeatherApp.prototype.displayForecast = function (forecasts) {
    if (!this.forecastContainer) return;

    // Ensure forecast container is visible
    this.forecastContainer.style.display = 'block';

    // Build grid
    let html = '<div class="forecast-grid">';
    forecasts.forEach(f => {
        html += `
            <div class="forecast-card">
                <div class="forecast-day">${f.day}</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${f.icon}@2x.png" alt="${f.description}" />
                <div class="forecast-temp">${f.temp}°C</div>
                <div class="forecast-desc">${f.description.charAt(0).toUpperCase() + f.description.slice(1)}</div>
            </div>
        `;
    });
    html += '</div>';

    this.forecastContainer.innerHTML = html;
};

WeatherApp.prototype.getWeather = async function (city) {
    if (!this.validateInput(city)) return;

    const effectiveKey = this.getEffectiveApiKey();
    if (!effectiveKey) {
        this.showError('❌ Please set your OpenWeatherMap API key in the Advanced section');
        console.warn('OpenWeatherMap API key is missing');
        return;
    }

    this.showLoading();
    if (this.searchBtn) this.searchBtn.disabled = true;
    if (this.cityInput) this.cityInput.disabled = true;

    try {
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(effectiveKey)}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(effectiveKey)}&units=metric`;

        const [currentResp, forecastResp] = await Promise.all([axios.get(currentUrl), axios.get(forecastUrl)]);

        console.log('✅ Weather Data Received:', currentResp.data);
        this.displayWeather(currentResp.data);

        const processed = this.processForecastData(forecastResp.data);
        this.displayForecast(processed);

        // Save to recent searches after successful fetch
        this.saveRecentSearch(city);

    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data && error.response.data.message ? error.response.data.message : 'Unknown error';
            if (status === 404) {
                this.showError(`❌ City not found: "${city}". Please check the spelling and try again.`);
            } else if (status === 401) {
                this.showError('❌ Invalid API key. Please check your OpenWeatherMap API key.');
            } else if (status === 429) {
                this.showError('❌ Too many requests. Please wait a moment and try again.');
            } else {
                this.showError(`❌ Error: ${message}`);
            }
            console.error('API Error:', status, message);
        } else if (error.request) {
            this.showError('❌ No response from server. Check your internet connection.');
            console.error('No Response Error:', error.request);
        } else {
            this.showError('❌ An error occurred. Please try again.');
            console.error('Error:', error.message);
        }
    } finally {
        if (this.searchBtn) this.searchBtn.disabled = false;
        if (this.cityInput) this.cityInput.disabled = false;
    }
};

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    const app = new WeatherApp();
    app.init();
    // expose for console debugging
    window.app = app;
});