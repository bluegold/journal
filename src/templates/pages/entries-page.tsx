import { JournalWorkspace } from '../journal-workspace'
import type { JournalEntryRow } from '../../types/journal'

type EntriesPageProps = {
  entries: JournalEntryRow[]
}

const parseJournalDate = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map((segment) => Number(segment))
  return new Date(year, month - 1, day)
}

export const EntriesPage = ({ entries }: EntriesPageProps) => {
  const visibleEntries = entries.filter((entry) => entry.deleted_at == null)
  const selectedEntry = visibleEntries[0] ?? null
  const monthDate = selectedEntry ? parseJournalDate(selectedEntry.journal_date) : new Date()

  return (
    <JournalWorkspace
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
