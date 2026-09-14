const { createCanvas } = require('@napi-rs/canvas')
const { roundRect, drawNightBackground, drawGlassPanel, iconHat, iconClock } = require('./canvasUtils')

const ACCENT = '#8fc1f2'
const TEXT = '#f2f5fa'
const MUTED = '#9fb3cc'
const GREEN = '#3ddc84'
const RED = '#f0554f'

function formatMoney(n, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatCompact(n) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${formatMoney(n, 0)}`
}

function buildCryptoCard({
  name,
  symbol,
  color,
  rank,
  marketCap,
  price,
  change24h,
  change7d,
  volume24h,
  circulatingSupply,
  maxSupplyPct,
  sparkline, // array de prix (~7 jours)
  timestamp, // string déjà formatée
  about,
  link,
}) {
  const width = 1100
  const height = 1400
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  drawNightBackground(ctx, width, height)

  const pad = 40
  drawGlassPanel(ctx, pad, pad, width - pad * 2, height - pad * 2)

  const innerX = pad + 50
  const innerW = width - pad * 2 - 100
  let y = pad + 65

  // Header: logo + nom bot / date
  iconHat(ctx, innerX + 20, y - 10, 50, ACCENT)
  ctx.fillStyle = TEXT
  ctx.font = '800 30px sans-serif'
  ctx.fillText('JACK THE RIPPER', innerX + 55, y)
  ctx.fillStyle = MUTED
  ctx.font = '600 20px sans-serif'
  ctx.fillText('◇ CRYPTO', innerX + 55, y + 28)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.moveTo(innerX + 190, y + 22)
  ctx.lineTo(innerX + 320, y + 22)
  ctx.stroke()

  ctx.textAlign = 'right'
  iconClock(ctx, innerX + innerW - 210, y - 22, 26, MUTED)
  ctx.fillStyle = MUTED
  ctx.font = '22px sans-serif'
  ctx.fillText(timestamp, innerX + innerW, y - 12)
  ctx.fillStyle = GREEN
  ctx.beginPath()
  ctx.arc(innerX + innerW - 155, y + 12, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = MUTED
  ctx.font = '20px sans-serif'
  ctx.fillText('Données en temps réel', innerX + innerW, y + 20)
  ctx.textAlign = 'left'

  y += 60
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.moveTo(innerX, y)
  ctx.lineTo(innerX + innerW, y)
  ctx.stroke()

  // Bloc principal: coin + prix
  y += 30
  const mainH = 260
  drawGlassPanel(ctx, innerX - 10, y, innerW + 20, mainH, 'rgba(255,255,255,0.12)')

  const coinCx = innerX + 90
  const coinCy = y + 90
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(coinCx, coinCy, 58, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1200'
  ctx.textAlign = 'center'
  ctx.font = '800 46px sans-serif'
  ctx.fillText(symbol[0], coinCx, coinCy + 16)
  ctx.textAlign = 'left'

  ctx.fillStyle = TEXT
  ctx.font = '800 42px sans-serif'
  ctx.fillText(name, innerX + 170, y + 70)
  ctx.fillStyle = MUTED
  ctx.font = '28px sans-serif'
  ctx.fillText(symbol, innerX + 170, y + 105)

  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = '22px sans-serif'
  ctx.fillText('Rang', innerX + innerW - 170, y + 45)
  ctx.fillText('Capitalisation', innerX + innerW, y + 45)
  ctx.fillStyle = TEXT
  ctx.font = '700 28px sans-serif'
  ctx.fillText(`#${rank}`, innerX + innerW - 170, y + 80)
  ctx.fillText(formatCompact(marketCap), innerX + innerW, y + 80)
  ctx.textAlign = 'left'

  ctx.fillStyle = TEXT
  ctx.font = '800 68px sans-serif'
  ctx.fillText(`$ ${formatMoney(price)}`, innerX + 40, y + 195)

  const up = change24h >= 0
  ctx.fillStyle = up ? GREEN : RED
  ctx.font = '700 32px sans-serif'
  ctx.fillText(`${up ? '▲' : '▼'} ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`, innerX + 40, y + 240)
  ctx.fillStyle = MUTED
  ctx.font = '24px sans-serif'
  ctx.fillText('(24h)', innerX + 260, y + 240)

  // Grille de stats
  y += mainH + 25
  const statsH = 150
  drawGlassPanel(ctx, innerX - 10, y, innerW + 20, statsH, 'rgba(255,255,255,0.12)')
  const cols = [
    { label: 'Variation 24h', value: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`, color: change24h >= 0 ? GREEN : RED },
    { label: 'Variation 7j', value: `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`, color: change7d >= 0 ? GREEN : RED },
    { label: 'Volume (24h)', value: formatCompact(volume24h), color: TEXT },
    { label: 'Offre en circulation', value: `${circulatingSupply}${maxSupplyPct ? `\n(${maxSupplyPct})` : ''}`, color: TEXT },
  ]
  const colW = innerW / cols.length
  cols.forEach((c, i) => {
    const cx = innerX + colW * i + 30
    ctx.fillStyle = MUTED
    ctx.font = '20px sans-serif'
    ctx.fillText(c.label, cx, y + 50)
    ctx.fillStyle = c.color
    ctx.font = '700 28px sans-serif'
    const lines = String(c.value).split('\n')
    lines.forEach((line, li) => ctx.fillText(line, cx, y + 90 + li * 30))
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.beginPath()
      ctx.moveTo(innerX + colW * i, y + 25)
      ctx.lineTo(innerX + colW * i, y + statsH - 25)
      ctx.stroke()
    }
  })

  // Graphique 7 jours
  y += statsH + 30
  const chartH = 320
  drawGlassPanel(ctx, innerX - 10, y, innerW + 20, chartH, 'rgba(255,255,255,0.12)')
  ctx.fillStyle = TEXT
  ctx.font = '700 24px sans-serif'
  ctx.fillText('📈 Évolution du prix (7 derniers jours)', innerX + 30, y + 45)

  if (sparkline && sparkline.length > 1) {
    const chartX = innerX + 30
    const chartY = y + 75
    const chartW = innerW - 60
    const chartInnerH = chartH - 120
    const min = Math.min(...sparkline)
    const max = Math.max(...sparkline)
    const range = max - min || 1

    const trendUp = sparkline[sparkline.length - 1] >= sparkline[0]
    const lineColor = trendUp ? GREEN : RED

    ctx.beginPath()
    sparkline.forEach((v, i) => {
      const px = chartX + (i / (sparkline.length - 1)) * chartW
      const py = chartY + chartInnerH - ((v - min) / range) * chartInnerH
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartInnerH)
    grad.addColorStop(0, trendUp ? 'rgba(61,220,132,0.35)' : 'rgba(240,85,79,0.35)')
    grad.addColorStop(1, 'rgba(61,220,132,0)')
    ctx.lineTo(chartX + chartW, chartY + chartInnerH)
    ctx.lineTo(chartX, chartY + chartInnerH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    ctx.beginPath()
    sparkline.forEach((v, i) => {
      const px = chartX + (i / (sparkline.length - 1)) * chartW
      const py = chartY + chartInnerH - ((v - min) / range) * chartInnerH
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 4
    ctx.stroke()

    // labels min/max
    ctx.fillStyle = MUTED
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(formatCompact(max), chartX + chartW, chartY + 15)
    ctx.fillText(formatCompact(min), chartX + chartW, chartY + chartInnerH)
    ctx.textAlign = 'left'
  }

  // Bloc "à propos"
  y += chartH + 25
  const aboutH = 150
  drawGlassPanel(ctx, innerX - 10, y, innerW + 20, aboutH, 'rgba(255,255,255,0.12)')
  ctx.fillStyle = TEXT
  ctx.font = '700 24px sans-serif'
  ctx.fillText(`💡 À propos de ${name}`, innerX + 30, y + 45)
  ctx.fillStyle = MUTED
  ctx.font = '20px sans-serif'
  const words = about.split(' ')
  let line = ''
  let ly = y + 78
  const maxWidth = innerW - 320
  for (const w of words) {
    const test = line + w + ' '
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, innerX + 30, ly)
      line = w + ' '
      ly += 26
    } else {
      line = test
    }
  }
  ctx.fillText(line, innerX + 30, ly)

  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = '20px sans-serif'
  ctx.fillText("Plus d'infos", innerX + innerW, y + 60)
  ctx.fillStyle = ACCENT
  ctx.font = '700 22px sans-serif'
  ctx.fillText(`${link} →`, innerX + innerW, y + 90)
  ctx.textAlign = 'left'

  // Footer
  const fy = height - pad - 40
  ctx.textAlign = 'center'
  ctx.fillStyle = MUTED
  ctx.font = '600 22px sans-serif'
  ctx.fillText('JACK THE RIPPER  •  CRYPTO', width / 2, fy)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.moveTo(width / 2 - 260, fy - 8)
  ctx.lineTo(width / 2 - 180, fy - 8)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(width / 2 + 180, fy - 8)
  ctx.lineTo(width / 2 + 260, fy - 8)
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

module.exports = { buildCryptoCard }
