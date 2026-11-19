const input = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const statusEl = document.getElementById("status");

async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=vi`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không gọi được dịch vụ tìm địa điểm");
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("Không tìm thấy thành phố này");
  }
  const { name: city, latitude, longitude, country } = data.results[0];
  return { city, latitude, longitude, country };
}

async function getWeather(latitude, longitude) {

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
    "&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không lấy được dữ liệu thời tiết");
  const data = await res.json();
  return data.current;
}
function weatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code === 45 || code === 48) return "🌫️";
    if (code >= 51 && code <= 57) return "🌦️";
    if (code >= 61 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌧️";
    if (code === 85 || code === 86) return "🌨️";
    if (code >= 95) return "⛈️";
    return "🌡️";
}
const resultEl = document.getElementById("result");

let lastData = null;

let unit = "C";

function formatTemp(celsius) {
    if (unit === "F") return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    return `${Math.round(celsius)}°C`;
}

function showWeather(place, current) {
  const placeName = [place.city, place.country].filter(Boolean).join(", ");
  document.getElementById("place").textContent = placeName;
  document.getElementById("temp").textContent = formatTemp(current.temperature_2m);
  document.getElementById("desc").textContent =`${weatherIcon(current.weather_code)} ${describeWeather(current.weather_code)}`;
  document.getElementById("details").textContent =`Cảm giác như ${formatTemp(current.apparent_temperature)} · ` + `Độ ẩm ${current.relative_humidity_2m}% · Gió ${current.wind_speed_10m} km/h`;
  resultEl.hidden = false;
}

async function loadWeather(place) {
    const current = await getWeather(place.latitude, place.longitude);
    const daily = await getForecast(place.latitude, place.longitude);
    lastData = { place, current, daily };
    render();
    statusEl.textContent = "";
}

function render() {
    if (!lastData) return;
    showWeather(lastData.place, lastData.current);
    showForecast(lastData.daily);
    showSun(lastData.daily);
}

async function search() {
    const name = input.value.trim();
    if (!name) return;
    statusEl.textContent = "Đang tải...";
    resultEl.hidden = true;
    try {
        const place = await geocodeCity(name);
        await loadWeather(place);
        saveLastCity(name);
    } catch (error) {
        statusEl.textContent = error.message;
    }
}

searchBtn.addEventListener("click", search);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") search();
});

async function getForecast(latitude, longitude) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
      "&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset" +
    "&forecast_days=4&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không lấy được dự báo");
  const data = await res.json();
  return data.daily;
}

function showSun(daily) {
    const rise = daily.sunrise[0].slice(11, 16);
    const set = daily.sunset[0].slice(11, 16);
    document.getElementById("sun").textContent = `Mặt trời mọc ${rise} · lặn ${set}`;
}

function formatDay(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });
}

function showForecast(daily) {
    const listEl = document.getElementById("forecast");
    listEl.innerHTML = "";
    for (let i = 1; i < daily.time.length; i++) {
        const li = document.createElement("li");
        const min = formatTemp(daily.temperature_2m_min[i]);
        const max = formatTemp(daily.temperature_2m_max[i]);
        li.textContent = `${formatDay(daily.time[i])}: ${min} - ${max}`;
        listEl.appendChild(li);
    }
}

const LAST_CITY_KEY = "weather-last-city";

function saveLastCity(name) {
    try {
        localStorage.setItem(LAST_CITY_KEY, name);
    } catch (error) {
        // bỏ qua nếu trình duyệt chặn localStorage
    }
}

function getLastCity() {
    try {
        return localStorage.getItem(LAST_CITY_KEY) || "";
    } catch (error) {
        return "";
    }
}

const lastCity = getLastCity();
if (lastCity) {
    input.value = lastCity;
    search();
}


const unitBtn = document.getElementById("unit-btn");
const UNIT_KEY = "weather-unit";

try {
    if (localStorage.getItem(UNIT_KEY) === "F") unit = "F";
} catch (error) {
    // bỏ qua nếu trình duyệt chặn localStorage
}
unitBtn.textContent = unit === "C" ? "°F" : "°C";

unitBtn.addEventListener("click", () => {
    unit = unit === "C" ? "F" : "C";
    unitBtn.textContent = unit === "C" ? "°F" : "°C";
    try {
        localStorage.setItem(UNIT_KEY, unit);
    } catch (error) {
        // bỏ qua nếu trình duyệt chặn localStorage
    }
    render();
});

const locateBtn = document.getElementById("locate-btn");

locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        statusEl.textContent = "Trình duyệt không hỗ trợ định vị";
        return;
    }
    statusEl.textContent = "Đang xác định vị trí...";
    resultEl.hidden = true;
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const place = {
                city: "Vị trí của bạn",
                country: "",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            try {
                await loadWeather(place);
            } catch (error) {
                statusEl.textContent = error.message;
            }
        },
        () => {
            statusEl.textContent = "Không lấy được vị trí (cần cho phép truy cập vị trí)";
        }
    );
});