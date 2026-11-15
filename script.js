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
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
    "&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không lấy được dữ liệu thời tiết");
  const data = await res.json();
  return data.current;
}

function describeWeather(code) {
  if (code === 0) return "Trời quang";
  if (code <= 3) return "Có mây";
  if (code === 45 || code === 48) return "Sương mù";
  if (code >= 51 && code <= 57) return "Mưa phùn";
  if (code >= 61 && code <= 67) return "Mưa";
  if (code >= 71 && code <= 77) return "Tuyết";
  if (code >= 80 && code <= 82) return "Mưa rào";
  if (code === 85 || code === 86) return "Mưa tuyết";
  if (code >= 95) return "Dông";
  return "Không rõ";
}

const resultEl = document.getElementById("result");

function showWeather(place, current) {
  document.getElementById("place").textContent = `${place.city}, ${place.country}`;
  document.getElementById("temp").textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("desc").textContent = describeWeather(current.weather_code);
  document.getElementById("details").textContent =
    `Độ ẩm ${current.relative_humidity_2m}% · Gió ${current.wind_speed_10m} km/h`;
  resultEl.hidden = false;
}