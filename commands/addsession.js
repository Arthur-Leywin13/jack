module.exports = {
  name: 'addsession',
  aliases: ['pair', 'newsession'],
  description: 'Ajoute une nouvelle session WhatsApp (QR ou code de pairing)',
  // Usage:
  //   .addsession client1              -> envoie un QR (image) à scanner
  //   .addsession client1 50912345678  -> envoie un code de pairing pour ce numéro
  async execute({ sock, jid, args, isOwner, sessionManager }) {
    if (!isOwner) {
      return sock.sendMessage(jid, { text: 'Ce privilège est réservé à peu de monde.' })
    }

    const [sessionId, phoneNumber] = args
    if (!sessionId) {
      return sock.sendMessage(jid, {
        text: 'Usage:\n.addsession <id>           → QR à scanner\n.addsession <id> <numéro>   → code de pairing',
      })
    }

    if (sessionManager.getSession(sessionId)) {
      return sock.sendMessage(jid, { text: `La session "${sessionId}" existe déjà.` })
    }

    await sock.sendMessage(jid, { text: `Ouverture de la session *${sessionId}*...` })

    await sessionManager.startSession(sessionId, {
      pairNumber: phoneNumber,
      notifyTarget: { sock, jid },
    })
  },
}
