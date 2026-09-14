const axios = require('axios')
const config = require('../config')
const persona = require('../lib/persona')
const { buildWeatherCard } = require('../lib/cards/weatherCard')

function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  const utcMs = unixSeconds * 1000
  const localMs = utcMs + tzOffsetSeconds * 1000
  const d = new Date(localMs)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function windDirection(deg) {
  if (deg === undefined || deg === null) return ''
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  return dirs[Math.round(deg / 45) % 8]
}

module.exports = {
  name: 'weather',
  aliases: ['meteo'],
  description: "Affiche la météo d'une ville avec une image",
  async execute({ sock, jid, args }) {
    const city = args.join(' ')
    if (!city) {
      return sock.sendMessage(jid, { text: 'Dites-moi quelle ville vous intéresse.' })
    }
    if (!config.OPENWEATHER_API_KEY) {
      return sock.sendMessage(jid, { text: "Cette vision m'est pour l'instant fermée (clé API absente)." })
    }

    try {
      const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { q: city, appid: config.OPENWEATHER_API_KEY, units: 'metric', lang: 'fr' },
      })

      // Probabilité de pluie via l'endpoint forecast (première échéance, 3h)
      let rainProbability = 0
      try {
        const forecast = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
          params: { lat: data.coord.lat, lon: data.coord.lon, appid: config.OPENWEATHER_API_KEY },
        })
        rainProbability = Math.round((forecast.data.list?.[0]?.pop || 0) * 100)
      } catch (e) {
        // pas bloquant si indisponible
      }

      const nowUtcSeconds = Math.floor(Date.now() / 1000)
      const isNight = data.weather[0].icon.endsWith('n')

      const image = buildWeatherCard({
        city: data.name,
        country: data.sys.country || '',
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s -> km/h
        windDir: windDirection(data.wind.deg),
        rainProbability,
        sunrise: formatLocalTime(data.sys.sunrise, data.timezone),
        sunset: formatLocalTime(data.sys.sunset, data.timezone),
        localTime: formatLocalTime(nowUtcSeconds, data.timezone),
        lat: data.coord.lat,
        lon: data.coord.lon,
        isNight,
      })

      await sock.sendMessage(jid, { image, caption: `Voici ce que le ciel réserve à *${data.name}*.` })
    } catch (err) {
      const msg = err.response?.status === 404 ? "Cette ville m'est inconnue." : persona.pick(persona.error)
      await sock.sendMessage(jid, { text: msg })
    }
  },
}
