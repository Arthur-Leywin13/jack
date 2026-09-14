const express = require('express')
const path = require('path')
const QRCode = require('qrcode')

const app = express()

// Store QR codes pour toutes les sessions
const qrStore = new Map()
let wsConnections = []

// Middleware
app.use(express.static('public'))
app.use(express.json())

// API pour récupérer tous les QR codes
app.get('/api/qrcodes', async (req, res) => {
  const qrs = {}
  for (const [sessionId, qrData] of qrStore.entries()) {
    qrs[sessionId] = {
      sessionId,
      qrCode: qrData.qrString,
      timestamp: qrData.timestamp,
    }
  }
  res.json(qrs)
})

// API pour récupérer le statut des sessions
app.get('/api/sessions', (req, res) => {
  const sessionManager = require('./sessionManager')
  const sessions = sessionManager.listSessions()
  res.json(sessions)
})

// Page HTML principale
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jack Bot - QR Code Scanner</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          padding: 40px;
          max-width: 600px;
          width: 100%;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .header h1 {
          color: #333;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .sessions-list {
          display: grid;
          gap: 20px;
        }
        .session-card {
          border: 2px solid #f0f0f0;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }
        .session-card:hover {
          border-color: #667eea;
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
        }
        .session-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-connected {
          background: #d4edda;
          color: #155724;
        }
        .status-connecting {
          background: #fff3cd;
          color: #856404;
        }
        .status-disconnected {
          background: #f8d7da;
          color: #721c24;
        }
        .qr-container {
          text-align: center;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
          margin-top: 15px;
        }
        .qr-container img {
          max-width: 250px;
          border: 2px solid #667eea;
          border-radius: 8px;
          padding: 10px;
          background: white;
        }
        .qr-label {
          color: #666;
          font-size: 13px;
          margin-top: 10px;
        }
        .no-qr {
          color: #999;
          font-size: 14px;
          padding: 20px;
          text-align: center;
        }
        .refresh-info {
          text-align: center;
          color: #999;
          font-size: 12px;
          margin-top: 30px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .connecting .status-badge {
          animation: pulse 1.5s ease-in-out infinite;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 Jack Bot</h1>
          <p>Interface de connexion WhatsApp</p>
        </div>
        
        <div class="sessions-list" id="sessionsList">
          <div style="text-align: center; color: #999;">Chargement...</div>
        </div>
        
        <div class="refresh-info">
          Les QR codes se mettent à jour automatiquement toutes les 30 secondes
        </div>
      </div>

      <script>
        async function loadSessions() {
          try {
            const [qrResponse, sessionsResponse] = await Promise.all([
              fetch('/api/qrcodes'),
              fetch('/api/sessions')
            ])
            
            const qrcodes = await qrResponse.json()
            const sessions = await sessionsResponse.json()
            
            const container = document.getElementById('sessionsList')
            
            if (sessions.length === 0) {
              container.innerHTML = '<div class="no-qr">Aucune session trouvée</div>'
              return
            }
            
            container.innerHTML = sessions.map(session => {
              const qr = qrcodes[session.id]
              let statusClass = \`status-\${session.status}\`
              let statusText = session.status === 'connected' ? '✅ Connecté' : 
                             session.status === 'connecting' ? '⏳ Connexion en cours' : 
                             '❌ Déconnecté'
              
              return \`
                <div class="session-card \${session.status === 'connecting' ? 'connecting' : ''}" id="session-\${session.id}">
                  <div class="session-title">
                    <span>\${session.id}</span>
                    <span class="status-badge \${statusClass}">\${statusText}</span>
                  </div>
                  \${qr ? \`
                    <div class="qr-container">
                      <img src="\${qr.qrCode}" alt="QR Code pour \${session.id}">
                      <div class="qr-label">Scanne ce QR avec WhatsApp</div>
                    </div>
                  \` : \`
                    <div class="no-qr">
                      \${session.status === 'connected' ? '✅ Session connectée' : 'En attente du QR code...'}
                    </div>
                  \`}
                </div>
              \`
            }).join('')
          } catch (error) {
            console.error('Erreur:', error)
            document.getElementById('sessionsList').innerHTML = 
              '<div class="no-qr">Erreur lors du chargement des sessions</div>'
          }
        }
        
        // Charger au démarrage
        loadSessions()
        
        // Recharger toutes les 30 secondes
        setInterval(loadSessions, 30000)
      </script>
    </body>
    </html>
  `)
})

function updateQRCode(sessionId, qrString) {
  qrStore.set(sessionId, {
    qrString,
    timestamp: new Date().toISOString(),
  })
}

function startServer(port = 3000) {
  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(\`🌐 Web server démarré sur http://localhost:\${port}\`)
      resolve()
    })
  })
}

module.exports = { startServer, updateQRCode }

