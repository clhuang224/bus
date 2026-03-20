import { describe, expect, it } from 'vitest'
import { toLngLat, toLocalizedText } from './normalizeTdxFields'

describe('normalizeTdxFields', () => {
  describe('toLocalizedText', () => {
    it('returns localized text when both languages exist', () => {
      expect(toLocalizedText({
        Zh_tw: '藍1',
        En: 'Blue 1'
      })).toEqual({
        zh_TW: '藍1',
        en: 'Blue 1'
      })
    })

    it('falls back to the secondary localized text when the primary value is missing', () => {
      expect(toLocalizedText(null, {
        Zh_tw: '藍1',
        En: 'Blue 1'
      })).toEqual({
        zh_TW: '藍1',
        en: 'Blue 1'
      })
    })

    it('returns empty strings when both localized values are missing', () => {
      expect(toLocalizedText()).toEqual({
        zh_TW: '',
        en: ''
      })
    })
  })

  describe('toLngLat', () => {
    it('returns lng lat when both coordinates exist', () => {
      expect(toLngLat({
        PositionLon: 121.56,
        PositionLat: 25.04
      })).toEqual([121.56, 25.04])
    })

    it('returns null when coordinates are incomplete', () => {
      expect(toLngLat({
        PositionLon: 121.56,
        PositionLat: null
      })).toBeNull()
    })

    it('returns null when position is missing', () => {
      expect(toLngLat(null)).toBeNull()
    })
  })
})
