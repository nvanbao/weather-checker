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