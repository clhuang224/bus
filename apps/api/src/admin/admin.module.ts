import { Module } from '@nestjs/common'
import { AdminSyncController } from './admin-sync.controller.js'
import { AdminService } from './admin.service.js'

@Module({
  controllers: [AdminSyncController],
  providers: [AdminService],
})
export class AdminModule {}
