import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AdminSyncController } from './admin-sync.controller.js'
import { AdminService } from './admin.service.js'

@Module({
  imports: [PrismaModule],
  controllers: [AdminSyncController],
  providers: [AdminService],
})
export class AdminModule {}
