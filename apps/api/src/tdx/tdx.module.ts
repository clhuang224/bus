import { Module } from '@nestjs/common'
import { TdxAuthService } from './tdx-auth.service.js'

@Module({
  providers: [TdxAuthService],
  exports: [TdxAuthService],
})
export class TdxModule {}
