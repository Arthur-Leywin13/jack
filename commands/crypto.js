const axios = require('axios')
const persona = require('../lib/persona')
const COIN_META = require('../lib/coinMeta')
const { buildCryptoCard } = require('../lib/cards/cryptoCard')

module.exports = {
  name: 'crypto',
  aliases: ['price'],
  description: "Affiche le prix d'une crypto avec une image",
  async execute({ sock, jid, args }) {
    const symbol = (args[0] || '').toLowerCase()
    const meta = COIN_META[symbol]
    if (!meta) {
      return sock.sendMessage(jid, {
        text: `Je ne connais que ceux-ci: ${Object.keys(COIN_META).join(', ')}`,
      })
    }

    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: meta.id,
          sparkline: true,
          price_change_percentage: '7d',
        },
      })

      const coin = data[0]
      if (!coin) throw new Error('Données indisponibles')

      const now = new Date()
      const timestamp = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' • ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

      const supplyPct = coin.max_supply
        ? `${((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}%`
        : ''

      const image = buildCryptoCard({
        name: meta.name,
        symbol: symbol.toUpperCase(),
        color: meta.color,
        rank: coin.market_cap_rank,
        marketCap: coin.market_cap,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        change7d: coin.price_change_percentage_7d_in_currency || 0,
        volume24h: coin.total_volume,
        circulatingSupply: `${(coin.circulating_supply / 1e6).toFixed(1)}M ${symbol.toUpperCase()}`,
        maxSupplyPct: supplyPct,
        sparkline: coin.sparkline_in_7d?.price || [],
        timestamp,
        about: meta.about,
        link: meta.link,
      })

      await sock.sendMessage(jid, { image, caption: `Le cours de *${meta.name}*, tel qu'il est.` })
    } catch (err) {
      await sock.sendMessage(jid, { text: persona.pick(persona.error) })
    }
  },
}
