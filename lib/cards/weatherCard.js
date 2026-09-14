const { createCanvas } = require('@napi-rs/canvas')
const {
  roundRect,
  drawNightBackground,
  drawGlassPanel,
  iconPin,
  iconDrop,
  iconUmbrella,
  iconWind,
  iconSun,
  iconClock,
  iconMoon,
} = require('./canvasUtils')

const ACCENT = '#8fc1f2'
const TEXT = '#f2f5fa'
const MUTED = '#9fb3cc'

function buildWeatherCard({
  city,
  country,
  temp,
  feelsLike,
  description,
  humidity,
  windSpeed,
  windDir,
  rainProbability,
  sunrise,
  sunset,
  localTime,
  lat,
  lon,
  isNight,
}) {
  const width = 1000
  const height = 1300
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  drawNightBackground(ctx, width, height)

  const pad = 40
  drawGlassPanel(ctx, pad, pad, width - pad * 2, height - pad * 2)

  const innerX = pad + 50
  const innerW = width - pad * 2 - 100
  let y = pad + 70

  // Header
  ctx.fillStyle = ACCENT
  ctx.font = '600 30px sans-serif'
  ctx.fillText('W E A T H E R', innerX, y)

  ctx.textAlign = 'right'
  iconPin(ctx, innerX + innerW - 150, y - 10, 28, ACCENT)
  ctx.fillStyle = TEXT
  ctx.font = '28px sans-serif'
  ctx.fillText(city, innerX + innerW, y)
  ctx.textAlign = 'left'

  y += 40
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(innerX, y)
  ctx.lineTo(innerX + innerW, y)
  ctx.stroke()

  // Nom de la ville en grand
  y += 90
  ctx.textAlign = 'center'
  ctx.fillStyle = TEXT
  ctx.font = '700 62px sans-serif'
  ctx.fillText(city.toUpperCase(), width / 2, y)

  y += 20
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath()
  ctx.moveTo(width / 2 - 130, y)
  ctx.lineTo(width / 2 - 40, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(width / 2 + 40, y)
  ctx.lineTo(width / 2 + 130, y)
  ctx.stroke()
  ctx.fillStyle = MUTED
  ctx.font = '600 28px sans-serif'
  ctx.fillText(country.toUpperCase(), width / 2, y + 10)
  ctx.textAlign = 'left'

  // Icône jour/nuit + température
  y += 100
  const iconCx = innerX + 110
  const iconCy = y + 70
  if (isNight) {
    iconMoon(ctx, iconCx, iconCy, 130, '#dfe6ef')
  } else {
    iconSun(ctx, iconCx, iconCy, 130, '#ffd876')
  }

  ctx.textAlign = 'left'
  ctx.fillStyle = TEXT
  ctx.font = '800 90px sans-serif'
  ctx.fillText(`${Math.round(temp)}°C`, innerX + 250, y + 60)

  ctx.font = '30px sans-serif'
  ctx.fillStyle = TEXT
  ctx.fillText(description, innerX + 250, y + 110)

  ctx.font = '26px sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(`Ressenti : ${Math.round(feelsLike)}°C`, innerX + 250, y + 155)

  // Bloc stats
  y += 230
  const statsH = 260
  drawGlassPanel(ctx, innerX - 10, y, innerW + 20, statsH, 'rgba(255,255,255,0.12)')

  const colX1 = innerX + 40
  const colX2 = innerX + innerW / 2 + 40
  const rowH = 82
  let ry = y + 60

  function statRow(x, iconFn, label, value, ty) {
    iconFn(ctx, x + 20, ty - 10, 40, ACCENT)
    ctx.fillStyle = MUTED
    ctx.font = '22px sans-serif'
    ctx.fillText(label, x + 60, ty - 15)
    ctx.fillStyle = TEXT
    ctx.font = '700 30px sans-serif'
    ctx.fillText(value, x + 60, ty + 20)
  }

  statRow(colX1, iconDrop, 'Humidité', `${humidity}%`, ry)
  statRow(colX2, iconUmbrella, 'Probabilité de pluie', `${rainProbability}%`, ry)

  ry += rowH
  statRow(colX1, iconWind, 'Vent', `${windSpeed} km/h${windDir ? ' (' + windDir + ')' : ''}`, ry)
  statRow(colX2, iconSun, 'Lever du soleil', sunrise, ry)

  ry += rowH
  statRow(colX2, iconSun, 'Coucher du soleil', sunset, ry)

  // séparateur vertical
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.moveTo(innerX + innerW / 2, y + 25)
  ctx.lineTo(innerX + innerW / 2, y + statsH - 25)
  ctx.stroke()

  // Barre bas: heure locale + coordonnées
  y += statsH + 30
  const bottomH = 110
  drawGlassPanel(ctx, innerX - 10, y, innerW + 20, bottomH, 'rgba(255,255,255,0.12)')

  iconClock(ctx, innerX + 45, y + bottomH / 2, 42, ACCENT)
  ctx.fillStyle = MUTED
  ctx.font = '22px sans-serif'
  ctx.fillText('Heure locale', innerX + 90, y + bottomH / 2 - 15)
  ctx.fillStyle = TEXT
  ctx.font = '700 30px sans-serif'
  ctx.fillText(localTime, innerX + 90, y + bottomH / 2 + 20)

  const rightColX = innerX + innerW / 2 + 40
  iconPin(ctx, rightColX + 15, y + bottomH / 2, 40, ACCENT)
  ctx.fillStyle = MUTED
  ctx.font = '22px sans-serif'
  ctx.fillText(city, rightColX + 55, y + bottomH / 2 - 15)
  ctx.fillStyle = TEXT
  ctx.font = '700 24px sans-serif'
  ctx.fillText(`${lat.toFixed(4)}° N  ${lon.toFixed(4)}° W`, rightColX + 55, y + bottomH / 2 + 18)

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.moveTo(innerX + innerW / 2, y + 20)
  ctx.lineTo(innerX + innerW / 2, y + bottomH - 20)
  ctx.stroke()

  // Footer
  y = height - pad - 40
  ctx.textAlign = 'center'
  ctx.fillStyle = MUTED
  ctx.font = '600 22px sans-serif'
  ctx.fillText('JACK THE RIPPER  •  WEATHER', width / 2, y)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.moveTo(width / 2 - 260, y - 8)
  ctx.lineTo(width / 2 - 180, y - 8)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(width / 2 + 180, y - 8)
  ctx.lineTo(width / 2 + 260, y - 8)
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

module.exports = { buildWeatherCard }
