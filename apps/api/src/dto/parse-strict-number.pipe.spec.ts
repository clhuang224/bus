import { BadRequestException } from '@nestjs/common'
import { ParseStrictNumberPipe } from './parse-strict-number.pipe.js'

describe('ParseStrictNumberPipe', () => {
  const pipe = new ParseStrictNumberPipe('latitude')

  it.each([
    ['0', 0],
    ['24.9939', 24.9939],
    ['-24.9939', -24.9939],
    ['+24.9939', 24.9939],
    [' .5 ', 0.5],
    [24.9939, 24.9939],
  ])('parses plain decimal number %p', (value, expected) => {
    expect(pipe.transform(value)).toBe(expected)
  })

  it.each(['', ' ', 'null', 'true', 'Infinity', 'NaN', '0x10', '24abc'])(
    'rejects non-decimal number string %p',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException)
    },
  )

  it.each([null, undefined, true, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects non-finite or non-string value %p',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException)
    },
  )
})
