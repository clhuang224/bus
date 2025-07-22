import { createTheme, MantineProvider } from '@mantine/core'

const theme = createTheme({
  fontFamily: 'Open Sans, sans-serif',
  primaryColor: 'cyan',
})

interface PropType {
  children: React.ReactElement
}

export default ({ children }: PropType): React.ReactElement<PropType> => {
  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  )
}
