import { JournalWorkspace } from '../journal-workspace'
import type { JournalUserRow } from '../../types/journal'

type HomePageProps = {
  currentUser: JournalUserRow
}

export const HomePage = ({ currentUser }: HomePageProps) => {
  return (
    <JournalWorkspace
      currentUser={currentUser}
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
