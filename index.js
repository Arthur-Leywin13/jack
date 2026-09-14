const express = require('express')
const sessionManager = require('./lib/sessionManager')

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Jack WhatsApp Bot is online')
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur HTTP lancé sur le port ${PORT}`)
})

sessionManager.bootAll().catch((err) => {
  console.error('Erreur au démarrage des sessions:', err)
  process.exit(1)
})