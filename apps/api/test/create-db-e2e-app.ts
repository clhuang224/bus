import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { config as dotenvConfig } from 'dotenv'
import { AppModule } from './../src/app.module.js'

dotenvConfig({ path: '.env', quiet: true })
dotenvConfig({ path: '.env.local', quiet: true })

export async function createDbE2eApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()

  return app
}
