import { Flex, Image, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

/** The site heading: the product mark and name, linking to the home page. */
export const AppBrand = () => {
  const { t } = useTranslation()

  return (
    <Flex
      component={Link}
      to="/"
      align="center"
      gap="xs"
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      <Image
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt=""
        w={32}
        h={32}
      />
      <Title order={1} size="h3" style={{ whiteSpace: 'nowrap' }}>
        {t('app.name')}
      </Title>
    </Flex>
  )
}
