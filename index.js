'use strict'

const io = require('@pm2/io').init({ // eslint-disable-line
  standalone: true,
  publicKey: process.env.KM_PUBLIC_KEY,
  secretKey: process.env.KM_SECRET_KEY,
  appName: 'sncf-bot',
  sendLogs: true
})

const request = require('request')

const from = process.env.FROM || 'FRPAR'
const to = process.env.TO || 'FRXYT'
const date = process.env.DATE
const minHour = parseInt(process.env.MIN_HOUR)
const maxHour = parseInt(process.env.MAX_HOUR)
const endpoint = `https://www.oui.sncf/calendar/cdp/api/proposals/v3/outward/${from}/${to}/${date}/12-HAPPY_CARD/2/fr/fr?currency=EUR&onlyDirectTrains=false`

const smsUser = process.env.FREE_SMS_USER
const smsPassword = process.env.FREE_SMS_PASSWORD

const check = _ => {
  console.log(`Try to reach ${endpoint}`)
  request(endpoint, (err, res) => {
    if (err) return console.error(`Got an error with request: ${err.message}`)
    const results = JSON.parse(res.body)
      .filter(result => result.totalPrice === 0) // Filter by price
      .filter(result => !minHour || new Date(result.departureDate).getHours() >= minHour) // Filter by hour
      .filter(result => !maxHour || new Date(result.departureDate).getHours() <= maxHour) // Filter by hour
      .map(result => { // Format it
        return {
          duration: `${(result.duration / 60, 2).toFixed(2)}h`,
          date: result.departureDate.replace('T', ' ')
        }
      })

    console.log(`Found ${results.length} journeys`)
    if (results.length > 0) {
      const message = `${from}-${to}: ` + results.map(result => `${result.date} (${result.duration})`).join(', ')
      const smsEndpoint = `https://smsapi.free-mobile.fr/sendmsg?user=${smsUser}&pass=${smsPassword}&msg=${encodeURI(message)}`
      request.get(smsEndpoint)
    }
  })
}

check() // first call
setInterval(check, 1000 * 60 * 30) // every 10min
