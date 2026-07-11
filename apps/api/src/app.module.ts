import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AdminModule } from './admin/admin.module.js'
import { ApiExceptionFilter } from './dto/api-exception.filter.js'
import { ApiResponseInterceptor } from './dto/api-response.interceptor.js'
import { FavoriteModule } from './favorite/favorite.module.js'
import { StationsModule } from './stations/stations.module.js'
import { RealtimeModule } from './realtime/realtime.module.js'
import { RoutesModule } from './routes/routes.module.js'
import { SettingsModule } from './settings/settings.module.js'

@Module({
  imports: [
    StationsModule,
    RoutesModule,
    RealtimeModule,
    AdminModule,
    FavoriteModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
