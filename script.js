const searchForm = document.getElementById('searchForm');
const locateBtn = document.getElementById('locateBtn');
const statusEl = document.getElementById('status');
const unitCBtn = document.getElementById('unitC');
const unitFBtn = document.getElementById('unitF');

let currentUnit = 'C';

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('q').value.trim();
  if (!query) return;
  setStatus('Searching…');
  const location = await getLocationFromQuery(query);
  if (!location) {
    setStatus('City not found');
    return;
  }
  setStatus('');
  getWeather(location);
});

locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolocation not supported');
    return;
  }
  setStatus('Getting your location…');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const location = await getLocationFromCoords(pos.coords.latitude, pos.coords.longitude);
    if (!location) {
      setStatus('Location not found');
      return;
    }
    setStatus('');
    getWeather(location);
  }, () => {
    setStatus('Permission denied or unavailable');
  });
});

unitCBtn.addEventListener('click', () => toggleUnit('C'));
unitFBtn.addEventListener('click', () => toggleUnit('F'));

function toggleUnit(unit) {
  currentUnit = unit;
  unitCBtn.classList.toggle('active', unit === 'C');
  unitFBtn.classList.toggle('active', unit === 'F');
  unitCBtn.setAttribute('aria-pressed', unit === 'C');
  unitFBtn.setAttribute('aria-pressed', unit === 'F');
  const query = document.getElementById('q').value.trim();
  if (query) searchForm.dispatchEvent(new Event('submit'));
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

async function getLocationFromQuery(query) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`);
  const data = await res.json();
  if (!data.results || !data.results.length) return null;
  const loc = data.results[0];
  document.getElementById('q').value = loc.name;
  return loc;
}

async function getLocationFromCoords(lat, lon) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`);
  const data = await res.json();
  if (!data.results || !data.results.length) return null;
  document.getElementById('q').value = data.results[0].name;
  return data.results[0];
}

async function getWeather(location) {
  const { latitude, longitude, timezone } = location;
  const unit = currentUnit === 'C' ? 'celsius' : 'fahrenheit';
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=${unit}&timezone=${timezone}`);
  const data = await res.json();
  renderWeather(data, location);
}

function renderWeather(data, location) {
  document.getElementById('place').textContent = location.name;
  document.getElementById('tz').textContent = location.timezone;
  const current = data.current_weather;
  document.getElementById('temp').textContent = `${Math.round(current.temperature)}°`;
  document.getElementById('condition').textContent = `Weather Code: ${current.weathercode}`;
  document.getElementById('wind').textContent = `Wind ${current.windspeed} km/h`;
  document.getElementById('feels').textContent = `Feels like ${Math.round(current.temperature)}°`;
  document.getElementById('updated').textContent = `Updated: ${new Date(current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  const hourlyEl = document.getElementById('hourly');
  hourlyEl.innerHTML = '';
  data.hourly.time.slice(0, 12).forEach((time, i) => {
    const hour = new Date(time).getHours();
    const temp = Math.round(data.hourly.temperature_2m[i]);
    const li = document.createElement('li');
    li.innerHTML = `<div class="hour">${hour}:00</div><div class="hour-temp">${temp}°</div>`;
    hourlyEl.appendChild(li);
  });

  const dailyEl = document.getElementById('daily');
  dailyEl.innerHTML = '';
  data.daily.time.forEach((time, i) => {
    const day = new Date(time).toLocaleDateString([], { weekday: 'short' });
    const min = Math.round(data.daily.temperature_2m_min[i]);
    const max = Math.round(data.daily.temperature_2m_max[i]);
    const li = document.createElement('li');
    li.innerHTML = `<div class="day">${day}</div><div class="minmax"><span>${min}°</span><span>${max}°</span></div>`;
    dailyEl.appendChild(li);
  });
}
