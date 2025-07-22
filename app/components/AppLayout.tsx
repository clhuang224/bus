import { AppShell, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

interface PropType {
  navbar: React.ReactElement,
  main: React.ReactElement
}

export const AppLayout = ({ navbar, main }: PropType) => {
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="sm"
          size="sm"
        />
      </AppShell.Header>

      <AppShell.Navbar p="md">{navbar}</AppShell.Navbar>

      <AppShell.Main>{main}</AppShell.Main>
    </AppShell>
  )
}
