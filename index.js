const sessionManager = require('./lib/sessionManager')

sessionManager.bootAll().catch((err) => {
  console.error('Erreur au démarrage des sessions:', err)
  process.exit(1)
})
