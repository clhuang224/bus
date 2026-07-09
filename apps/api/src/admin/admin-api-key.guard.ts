import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'

export const ADMIN_API_KEY_HEADER = 'x-admin-api-key'

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredApiKey = process.env.ADMIN_API_KEY
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>
    }>()
    const providedApiKey = request.headers[ADMIN_API_KEY_HEADER]

    if (
      !configuredApiKey ||
      typeof providedApiKey !== 'string' ||
      !this.keysMatch(providedApiKey, configuredApiKey)
    ) {
      throw new UnauthorizedException('A valid admin API key is required.')
    }

    return true
  }

  private keysMatch(providedApiKey: string, configuredApiKey: string): boolean {
    const provided = Buffer.from(providedApiKey)
    const configured = Buffer.from(configuredApiKey)

    return (
      provided.length === configured.length &&
      timingSafeEqual(provided, configured)
    )
  }
}
