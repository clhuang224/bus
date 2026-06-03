import { Module } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AdminModule } from './admin/admin.module.js'
import { FavoriteModule } from './favorite/favorite.module.js'
import { NearbyModule } from './nearby/nearby.module.js'
import { RealtimeModule } from './realtime/realtime.module.js'
import { RoutesModule } from './routes/routes.module.js'
import { SettingsModule } from './settings/settings.module.js'
import { StopsModule } from './stops/stops.module.js'

@Module({
  imports: [
    FavoriteModule,
    NearbyModule,
    StopsModule,
    RoutesModule,
    RealtimeModule,
    SettingsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
