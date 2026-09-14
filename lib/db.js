const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'data.json')

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ prefixes: {} }, null, 2))
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// Clé composée sessionId:jid pour isoler les réglages entre comptes connectés
function key(sessionId, jid) {
  return `${sessionId}:${jid}`
}

function getPrefix(sessionId, jid, defaultPrefix) {
  const data = load()
  return data.prefixes[key(sessionId, jid)] || defaultPrefix
}

function setPrefix(sessionId, jid, prefix) {
  const data = load()
  data.prefixes[key(sessionId, jid)] = prefix
  save(data)
}

module.exports = { getPrefix, setPrefix }
