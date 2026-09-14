const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcodeTerminal = require('qrcode-terminal')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

const config = require('../config')
const { handleMessage } = require('./messageHandler')

const SESSIONS_DIR = path.join(__dirname, '..', 'sessions')
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true })

// sessionId -> { sock, status }
const sessions = new Map()

function authPath(sessionId) {
  return path.join(SESSIONS_DIR, sessionId, 'auth_info')
}

function listExistingSessionIds() {
  if (!fs.existsSync(SESSIONS_DIR)) return []
  return fs.readdirSync(SESSIONS_DIR).filter((name) =>
    fs.existsSync(path.join(SESSIONS_DIR, name, 'auth_info'))
  )
}

/**
 * Démarre une session.
 * @param {string} sessionId
 * @param {object} opts
 * @param {string} [opts.pairNumber] - numéro pour obtenir un code de pairing au lieu du QR
 * @param {{sock, jid}} [opts.notifyTarget] - où envoyer le QR/code (une session déjà connectée)
 */
async function startSession(sessionId, opts = {}) {
  const { pairNumber, notifyTarget } = opts
  const { state, saveCreds } = await useMultiFileAuthState(authPath(sessionId))

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  })

  sessions.set(sessionId, { sock, status: 'connecting' })

  // Demande d'un code de pairing (alternative au QR) si le compte n'est pas encore enregistré
  if (pairNumber && !sock.authState.creds.registered) {
    try {
      const code = await sock.requestPairingCode(pairNumber.replace(/[^0-9]/g, ''))
      const text = `Code de pairing pour *${sessionId}*: \`${code}\`\n\nWhatsApp -> Appareils connectés -> Lier un appareil -> Lier avec le numéro de téléphone -> entre ce code.`
      if (notifyTarget) {
        await notifyTarget.sock.sendMessage(notifyTarget.jid, { text })
      } else {
        console.log(text)
      }
    } catch (err) {
      const errText = `Impossible de générer le code de pairing pour ${sessionId}: ${err.message}`
      if (notifyTarget) await notifyTarget.sock.sendMessage(notifyTarget.jid, { text: errText })
      else console.error(errText)
    }
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !pairNumber) {
      if (notifyTarget) {
        // Une session existe déjà -> on envoie le QR comme image directement dans WhatsApp
        try {
          const png = await QRCode.toBuffer(qr, { type: 'png', width: 512 })
          await notifyTarget.sock.sendMessage(notifyTarget.jid, {
            image: png,
            caption: `QR pour la session *${sessionId}*. Scanne-le dans les ~45 secondes.`,
          })
        } catch (e) {
          console.error('Erreur envoi QR image:', e)
        }
      } else {
        // Pas de session dispo pour l'envoyer -> on l'affiche dans les logs (Railway Logs)
        console.log(`\n--- QR pour la session "${sessionId}" (scanne dans les logs ou via un lecteur QR ASCII) ---`)
        qrcodeTerminal.generate(qr, { small: true })
      }
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      const s = sessions.get(sessionId)
      if (s) s.status = 'disconnected'
      console.log(`[${sessionId}] Connexion fermée.`, shouldReconnect ? 'Reconnexion...' : 'Déconnecté (session retirée).')
      if (shouldReconnect) {
        startSession(sessionId, opts)
      } else {
        sessions.delete(sessionId)
      }
    } else if (connection === 'open') {
      const s = sessions.get(sessionId)
      if (s) s.status = 'connected'
      console.log(`✅ [${sessionId}] ${config.BOT_NAME} connecté.`)
      if (notifyTarget) {
        await notifyTarget.sock.sendMessage(notifyTarget.jid, { text: `Session *${sessionId}* connectée.` })
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    try {
      await handleMessage({ sock, sessionId, sessionManager: module.exports, msg })
    } catch (err) {
      console.error(`[${sessionId}] Erreur handleMessage:`, err)
    }
  })

  return sock
}

async function bootAll() {
  // 1. Sessions déjà authentifiées trouvées sur disque (persistées via le volume Railway)
  const existing = listExistingSessionIds()

  // 2. Sessions déclarées via l'env mais pas encore authentifiées (premier démarrage)
  const declared = (process.env.SESSION_IDS || 'main')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const toStart = new Set([...existing, ...declared])
  for (const id of toStart) {
    await startSession(id)
  }
}

function getSession(sessionId) {
  return sessions.get(sessionId)
}

function listSessions() {
  return Array.from(sessions.entries()).map(([id, s]) => ({ id, status: s.status }))
}

async function deleteSession(sessionId) {
  const s = sessions.get(sessionId)
  if (s) {
    try {
      await s.sock.logout()
    } catch (e) {}
    sessions.delete(sessionId)
  }
  const dir = path.join(SESSIONS_DIR, sessionId)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

module.exports = { startSession, bootAll, getSession, listSessions, deleteSession }
