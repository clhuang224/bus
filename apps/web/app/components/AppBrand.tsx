import { Flex, Image, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { APP_BRAND_MARK_SIZE } from '~/modules/consts/layout'

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
      c={inverted ? 'white' : 'blue.7'}
      td="none"
    >
      <Image
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt=""
        w={APP_BRAND_MARK_SIZE}
        h={APP_BRAND_MARK_SIZE}
        bd={inverted ? '2px solid white' : undefined}
        bdrs="50%"
      />
      <Title order={1} size="h3" c="inherit" textWrap="nowrap" lts="0.08em">
        {t('app.name')}
      </Title>
    </Flex>
  )
}
