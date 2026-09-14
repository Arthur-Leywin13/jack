module.exports = {
  name: 'delsession',
  description: 'Supprime une session WhatsApp (déconnexion + oubli)',
  async execute({ sock, jid, args, isOwner, sessionManager }) {
    if (!isOwner) {
      return sock.sendMessage(jid, { text: 'Ce privilège est réservé à peu de monde.' })
    }

    const sessionId = args[0]
    if (!sessionId) {
      return sock.sendMessage(jid, { text: 'Usage: .delsession <id>' })
    }
    if (sessionId === 'main') {
      return sock.sendMessage(jid, { text: 'La session "main" ne se supprime pas depuis le chat — fais-le manuellement sur le serveur.' })
    }

    await sessionManager.deleteSession(sessionId)
    await sock.sendMessage(jid, { text: `Session *${sessionId}* supprimée.` })
  },
}
