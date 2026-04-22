import { JournalWorkspace } from '../journal-workspace'

export const HomePage = () => {
  return (
    <JournalWorkspace
      monthDate={new Date()}
      journalEntries={[]}
      selectedEntry={null}
      menuItems={[
        { label: 'Entries', href: '/entries' },
        { label: 'Search', href: '/entries' },
      ]}
    />
  )
}
