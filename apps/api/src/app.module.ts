import { Module } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AdminModule } from './admin/admin.module.js'
import { FavoriteModule } from './favorite/favorite.module.js'
import { StationsModule } from './stations/stations.module.js'
import { RealtimeModule } from './realtime/realtime.module.js'
import { RoutesModule } from './routes/routes.module.js'
import { SettingsModule } from './settings/settings.module.js'

@Module({
  imports: [
    FavoriteModule,
    StationsModule,
    RoutesModule,
    RealtimeModule,
    SettingsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
