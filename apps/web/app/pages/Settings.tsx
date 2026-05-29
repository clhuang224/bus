import { ActionIcon, Card, Flex, Radio, Stack, Switch, Text, Title, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { RiArrowLeftSLine } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { isSupportedAppLocale } from '~/modules/consts/i18n'
import { APP_PAGE_PADDING } from '~/modules/consts/layout'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { selectAnalyticsEnabled, setAnalyticsEnabled } from '~/modules/slices/analyticsSlice'
import { selectLocale, setLocale } from '~/modules/slices/localeSlice'
import type { AppDispatch } from '~/modules/store'

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const isAnalyticsEnabled = useSelector(selectAnalyticsEnabled)
  const locale = useSelector(selectLocale)

  const localeOptions = [
    {
      value: AppLocaleType.ZH_TW,
      label: t('pages.settings.localeOptions.zhTW.label')
    },
    {
      value: AppLocaleType.EN,
      label: t('pages.settings.localeOptions.en.label')
    }
  ]

  return (
    <Flex justify="center" h="100%">
      <Card p={APP_PAGE_PADDING} w="100%" maw={720} h="100%" withBorder={false}>
        <Stack gap="md">
          <Flex align="flex-start" gap="sm">
            {isSm && (
              <ActionIcon
                aria-label={t('pages.settings.backAriaLabel')}
                variant="subtle"
                color="gray"
                onClick={() => navigate(-1)}
              >
                <RiArrowLeftSLine />
              </ActionIcon>
            )}
            <Stack gap={4}>
              <Title order={3}>{t('pages.settings.title')}</Title>
            </Stack>
          </Flex>
          <Card withBorder radius="md" p="md">
            <Stack gap="xs">
              <Title order={5}>{t('pages.settings.languageSectionTitle')}</Title>
              <Radio.Group
                name="app-language"
                value={locale}
                aria-label={t('pages.settings.languageSectionTitle')}
                onChange={(nextLocale) => {
                  if (isSupportedAppLocale(nextLocale)) {
                    dispatch(setLocale(nextLocale))
                  }
                }}
              >
                <Stack gap="sm" mt="xs">
                  {localeOptions.map((option) => (
                    <Radio
                      key={option.value}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </Stack>
              </Radio.Group>
            </Stack>
          </Card>
          <Card withBorder radius="md" p="md">
            <Stack gap="xs">
              <Title order={5}>{t('pages.settings.analyticsSectionTitle')}</Title>
              <Text size="sm" c="dimmed">
                {t('pages.settings.analyticsDescription')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('pages.settings.analyticsDataNotice')}
              </Text>
              <Switch
                checked={isAnalyticsEnabled}
                label={t('pages.settings.analyticsToggleLabel')}
                onChange={(event) => {
                  dispatch(setAnalyticsEnabled(event.currentTarget.checked))
                }}
              />
            </Stack>
          </Card>
        </Stack>
      </Card>
    </Flex>
  )
}
