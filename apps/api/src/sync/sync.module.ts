import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { RoutePersistenceService } from './route-persistence.service.js'
import { RoutesSyncService } from './routes-sync.service.js'
import { StopPersistenceService } from './stop-persistence.service.js'
import { StopsSyncService } from './stops-sync.service.js'
import { SyncCheckpointService } from './sync-checkpoint.service.js'
import { SyncService } from './sync.service.js'
import { TdxClientService } from './tdx-client.service.js'

@Module({
  imports: [PrismaModule],
  providers: [
    RoutePersistenceService,
    RoutesSyncService,
    StopPersistenceService,
    StopsSyncService,
    SyncCheckpointService,
    SyncService,
    TdxClientService,
  ],
  exports: [RoutesSyncService, StopsSyncService, SyncService],
})
export class SyncModule {}
