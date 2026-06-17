import { INestApplication } from '@nestjs/common'
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { AppModule } from './../src/app.module.js'

interface CreateE2eAppOptions {
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder
}

export async function createE2eApp(
  options: CreateE2eAppOptions = {},
): Promise<INestApplication> {
  let moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      $disconnect: () => Promise.resolve(),
    })

  if (options.configureModule) {
    moduleBuilder = options.configureModule(moduleBuilder)
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile()

  const app = moduleFixture.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()

  return app
}
