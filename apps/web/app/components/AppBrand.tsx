import { Flex, Image, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

interface PropType {
  inverted?: boolean
}

export const AppBrand = ({ inverted = false }: PropType) => {
  const { t } = useTranslation()

  return (
    <Flex
      component={Link}
      to="/"
      align="center"
      gap="xs"
      c={inverted ? 'white' : 'brand.8'}
      style={{ textDecoration: 'none' }}
    >
      <Image
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt=""
        w={32}
        h={32}
      />
      <Title
        order={1}
        size="h3"
        c="inherit"
        style={{ whiteSpace: 'nowrap', letterSpacing: '0.08em' }}
      >
        {t('app.name')}
      </Title>
    </Flex>
  )
}
