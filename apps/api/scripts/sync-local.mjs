import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env', quiet: true })
dotenvConfig({ path: '.env.local', override: true, quiet: true })

const resource = process.argv[2]

if (!['routes', 'stops'].includes(resource)) {
  throw new Error('Expected sync resource to be either "routes" or "stops".')
}

const adminApiKey = process.env.ADMIN_API_KEY

if (!adminApiKey) {
  throw new Error('ADMIN_API_KEY is required in .env.local.')
}

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3000'
const response = await fetch(`${apiOrigin}/api/admin/sync/${resource}`, {
  method: 'POST',
  headers: {
    'x-admin-api-key': adminApiKey,
  },
})
const responseBody = await response.text()

if (!response.ok) {
  throw new Error(
    `Failed to queue ${resource} sync (${response.status}): ${responseBody}`,
  )
}

console.log(responseBody)
