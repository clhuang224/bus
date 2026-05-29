import { createTheme, MantineProvider } from '@mantine/core'

const theme = createTheme({
  fontFamily: 'Open Sans, sans-serif',
  primaryColor: 'cyan'
})

interface PropType {
  children: React.ReactElement
}

export const ThemeProvider = ({ children }: PropType): React.ReactElement<PropType> => {
  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  )
}
