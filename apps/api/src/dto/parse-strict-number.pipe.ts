import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common'

@Injectable()
export class ParseStrictNumberPipe implements PipeTransform<unknown, number> {
  constructor(private readonly fieldName: string) {}

  transform(value: unknown): number {
    if (typeof value === 'string' && value.trim() === '') {
      throw new BadRequestException(`${this.fieldName} must be a number.`)
    }

    const numberValue = Number(value)

    if (!Number.isFinite(numberValue)) {
      throw new BadRequestException(`${this.fieldName} must be a number.`)
    }

    return numberValue
  }
}
