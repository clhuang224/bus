import { randomBytes } from 'node:crypto'

const apiKey = randomBytes(32).toString('hex')

console.log(`ADMIN_API_KEY="${apiKey}"`)
