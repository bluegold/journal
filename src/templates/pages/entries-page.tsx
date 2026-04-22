import { JournalWorkspace } from '../journal-workspace'
import type { JournalEntryRow, JournalUserRow } from '../../types/journal'

type EntriesPageProps = {
  currentUser: JournalUserRow
  entries: JournalEntryRow[]
}

const parseJournalDate = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map((segment) => Number(segment))
  return new Date(year, month - 1, day)
}

export const EntriesPage = ({ currentUser, entries }: EntriesPageProps) => {
  const visibleEntries = entries.filter((entry) => entry.deleted_at == null)
  const selectedEntry = visibleEntries[0] ?? null
  const monthDate = selectedEntry ? parseJournalDate(selectedEntry.journal_date) : new Date()

  return (
    <JournalWorkspace
      currentUser={currentUser}
      monthDate={monthDate}
      journalEntries={visibleEntries}
      selectedEntry={selectedEntry}
      menuItems={[
        { label: 'Compose', href: '/entries/new' },
        { label: 'Search', href: '#search-results' },
      ]}
    />
  )
}
