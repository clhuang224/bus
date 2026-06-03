import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from './../src/app.module.js'

export async function createE2eApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()

  return app
}
