function roundRect(ctx, x, y, w, h, r) {
  const radius = typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : r
  ctx.beginPath()
  ctx.moveTo(x + radius.tl, y)
  ctx.lineTo(x + w - radius.tr, y)
  ctx.arcTo(x + w, y, x + w, y + radius.tr, radius.tr)
  ctx.lineTo(x + w, y + h - radius.br)
  ctx.arcTo(x + w, y + h, x + w - radius.br, y + h, radius.br)
  ctx.lineTo(x + radius.bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius.bl, radius.bl)
  ctx.lineTo(x, y + radius.tl)
  ctx.arcTo(x, y, x + radius.tl, y, radius.tl)
  ctx.closePath()
}

// Fond nocturne: dégradé + étoiles + silhouette de ville en bas
function drawNightBackground(ctx, width, height, accent = '#7fb2e5') {
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#05070d')
  sky.addColorStop(0.55, '#0b1120')
  sky.addColorStop(1, '#151b2b')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  // étoiles
  let seed = 42
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  for (let i = 0; i < 90; i++) {
    const x = rand() * width
    const y = rand() * height * 0.5
    const r = rand() * 1.4 + 0.2
    ctx.globalAlpha = rand() * 0.8 + 0.2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // silhouette de ville
  const baseY = height * 0.86
  ctx.fillStyle = '#02030a'
  let x = -20
  while (x < width + 20) {
    const w = 40 + rand() * 70
    const h = 60 + rand() * 180
    ctx.fillRect(x, baseY - h, w, h + height)
    // quelques fenêtres allumées
    ctx.fillStyle = 'rgba(255, 200, 120, 0.5)'
    for (let wy = baseY - h + 10; wy < baseY - 10; wy += 18) {
      for (let wx = x + 6; wx < x + w - 6; wx += 14) {
        if (rand() > 0.6) ctx.fillRect(wx, wy, 5, 8)
      }
    }
    ctx.fillStyle = '#02030a'
    x += w + (10 + rand() * 14)
  }
}

function drawGlassPanel(ctx, x, y, w, h, accent = 'rgba(140,180,230,0.35)') {
  ctx.save()
  roundRect(ctx, x, y, w, h, 36)
  ctx.fillStyle = 'rgba(8, 12, 22, 0.55)'
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = accent
  ctx.stroke()
  ctx.restore()
}

// --- icônes vectorielles simples (style trait fin) ---

function iconPin(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = size * 0.12
  ctx.beginPath()
  ctx.arc(cx, cy - size * 0.15, size * 0.35, Math.PI * 1.15, Math.PI * 1.85)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.3, cy)
  ctx.quadraticCurveTo(cx, cy + size * 0.65, cx + size * 0.3, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy - size * 0.15, size * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function iconDrop(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx, cy - size * 0.5)
  ctx.quadraticCurveTo(cx + size * 0.42, cy + size * 0.15, cx, cy + size * 0.5)
  ctx.quadraticCurveTo(cx - size * 0.42, cy + size * 0.15, cx, cy - size * 0.5)
  ctx.fill()
  ctx.restore()
}

function iconUmbrella(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = size * 0.09
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.45, Math.PI, 0)
  ctx.lineTo(cx + size * 0.45, cy + size * 0.05)
  ctx.quadraticCurveTo(cx, cy + size * 0.25, cx - size * 0.45, cy + size * 0.05)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy + size * 0.55)
  ctx.quadraticCurveTo(cx, cy + size * 0.7, cx + size * 0.15, cy + size * 0.65)
  ctx.stroke()
  ctx.restore()
}

function iconWind(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.1
  ctx.lineCap = 'round'
  ;[[-0.3, -0.15, 0.35], [-0.35, 0.05, 0.25], [-0.25, 0.25, 0.15]].forEach(([sx, sy, len]) => {
    ctx.beginPath()
    ctx.moveTo(cx + sx * size, cy + sy * size)
    ctx.lineTo(cx + (sx + len) * size, cy + sy * size)
    ctx.stroke()
  })
  ctx.restore()
}

function iconSun(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = size * 0.1
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * size * 0.42, cy + Math.sin(a) * size * 0.42)
    ctx.lineTo(cx + Math.cos(a) * size * 0.58, cy + Math.sin(a) * size * 0.58)
    ctx.stroke()
  }
  ctx.restore()
}

function iconClock(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.09
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - size * 0.25)
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + size * 0.18, cy + size * 0.05)
  ctx.stroke()
  ctx.restore()
}

function iconMoon(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx + size * 0.22, cy - size * 0.12, size * 0.42, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function iconHat(ctx, cx, cy, size, color) {
  ctx.save()
  ctx.fillStyle = color
  roundRect(ctx, cx - size * 0.35, cy - size * 0.05, size * 0.7, size * 0.14, size * 0.05)
  ctx.fill()
  roundRect(ctx, cx - size * 0.22, cy - size * 0.45, size * 0.44, size * 0.42, { tl: size * 0.2, tr: size * 0.2, br: 0, bl: 0 })
  ctx.fill()
  ctx.restore()
}

module.exports = {
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
  iconHat,
}
