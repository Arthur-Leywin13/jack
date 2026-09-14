module.exports = {
  name: 'sessions',
  description: 'Liste les sessions WhatsApp actives',
  async execute({ sock, jid, isOwner, sessionManager }) {
    if (!isOwner) {
      return sock.sendMessage(jid, { text: 'Ce privilège est réservé à peu de monde.' })
    }

    const list = sessionManager.listSessions()
    if (list.length === 0) {
      return sock.sendMessage(jid, { text: 'Aucune session active.' })
    }

    const text = list
      .map((s) => `• ${s.id} — ${s.status === 'connected' ? '🟢 connectée' : '🔴 ' + s.status}`)
      .join('\n')

    await sock.sendMessage(jid, { text: `*Sessions*\n${text}` })
  },
}
