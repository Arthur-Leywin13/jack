const config = require('../config')
const db = require('./db')

function loadCommands(fs, path) {
  const commands = new Map()
  for (const file of fs.readdirSync(path.join(__dirname, '..', 'commands'))) {
    if (!file.endsWith('.js')) continue
    const cmd = require(path.join(__dirname, '..', 'commands', file))
    commands.set(cmd.name, cmd)
    for (const alias of cmd.aliases || []) commands.set(alias, cmd)
  }
  return commands
}

const commands = loadCommands(require('fs'), require('path'))

async function handleMessage({ sock, sessionId, sessionManager, msg }) {
  if (!msg.message) return
  // Note: on NE filtre PAS fromMe — le propriétaire du compte connecté
  // (WhatsApp lié) doit pouvoir commander son propre bot depuis son téléphone.

  const jid = msg.key.remoteJid
  if (!jid || jid === 'status@broadcast') return

  const isGroup = jid.endsWith('@g.us')
  const currentPrefix = db.getPrefix(sessionId, jid, config.DEFAULT_PREFIX)

  const body =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    msg.message.videoMessage?.caption ||
    ''

  if (!body.startsWith(currentPrefix)) return

  const [rawCmd, ...args] = body.slice(currentPrefix.length).trim().split(/\s+/)
  const cmd = commands.get((rawCmd || '').toLowerCase())
  if (!cmd) return

  let groupMetadata = null
  let isSenderAdmin = false
  let isBotAdmin = false
  if (isGroup) {
    try {
      groupMetadata = await sock.groupMetadata(jid)
      const senderId = msg.key.fromMe ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : (msg.key.participant || msg.participant)
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
      isSenderAdmin = groupMetadata.participants.some(
        (p) => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
      )
      isBotAdmin = groupMetadata.participants.some(
        (p) => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin')
      )
    } catch (e) {
      // métadonnées indisponibles, on continue sans droits admin
    }
  }

  // fromMe = c'est littéralement le propriétaire de cette session -> owner de fait
  const isOwner =
    msg.key.fromMe ||
    (msg.key.participant || msg.key.remoteJid || '').includes(config.OWNER_NUMBER)

  const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
  const quotedMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage || null
  const pushName = msg.pushName || 'Quelqu\'un'

  try {
    await cmd.execute({
      sock,
      sessionId,
      sessionManager,
      msg,
      jid,
      args,
      prefix: currentPrefix,
      currentPrefix,
      isGroup,
      groupMetadata,
      isSenderAdmin,
      isBotAdmin,
      isOwner,
      mentionedJids,
      quotedMessage,
      pushName,
    })
  } catch (err) {
    console.error(`[${sessionId}] Erreur commande ${cmd.name}:`, err)
    await sock.sendMessage(jid, { text: `Un imprévu... même moi, je n'échappe pas au chaos parfois.` })
  }
}

module.exports = { handleMessage }
