export type LocalizedText<K extends string = 'zh_TW' | 'en'> = {
  [key in K]: string
}

export type TdxLocalizedText = LocalizedText<'Zh_tw' | 'En'>
