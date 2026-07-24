import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common'

const DECIMAL_NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/

@Injectable()
export class ParseStrictNumberPipe implements PipeTransform<unknown, number> {
  constructor(private readonly fieldName: string) {}

  transform(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${this.fieldName} must be a number.`)
    }

    const trimmedValue = value.trim()

    if (!DECIMAL_NUMBER_PATTERN.test(trimmedValue)) {
      throw new BadRequestException(`${this.fieldName} must be a number.`)
    }

    return Number(trimmedValue)
  }
}
