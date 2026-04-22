export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

export const parseDateKey = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export const parseMonthKey = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})$/)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const date = new Date(year, month - 1, 1)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1) {
    return null
  }

  return date
}

export const shiftMonth = (date: Date, offset: number): Date => {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

export const buildEntriesHref = (options: {
  monthKey?: string | null
  dateKey?: string | null
  entryId?: string | null
}): string => {
  const params = new URLSearchParams()

  if (options.monthKey) {
    params.set('month', options.monthKey)
  }

  if (options.dateKey) {
    params.set('date', options.dateKey)
  }

  if (options.entryId) {
    params.set('entry', options.entryId)
  }

  const query = params.toString()
  return query.length > 0 ? `/entries?${query}` : '/entries'
}

export const buildTodayEntriesHref = (date: Date = new Date()): string => {
  const monthKey = formatMonthKey(date)
  const dateKey = formatDateKey(date)
  return buildEntriesHref({ monthKey, dateKey })
}

export const buildNewEntryHref = (options: {
  monthKey?: string | null
  dateKey?: string | null
}): string => {
  const params = new URLSearchParams()

  if (options.monthKey) {
    params.set('month', options.monthKey)
  }

  if (options.dateKey) {
    params.set('date', options.dateKey)
  }

  const query = params.toString()
  return query.length > 0 ? `/entries/new?${query}` : '/entries/new'
}

export const buildTodayNewEntryHref = (date: Date = new Date()): string => {
  const monthKey = formatMonthKey(date)
  const dateKey = formatDateKey(date)
  return buildNewEntryHref({ monthKey, dateKey })
}

export const buildEntryEditHref = (
  entryId: string,
  options: {
    monthKey?: string | null
    dateKey?: string | null
  } = {}
): string => {
  const params = new URLSearchParams()

  if (options.monthKey) {
    params.set('month', options.monthKey)
  }

  if (options.dateKey) {
    params.set('date', options.dateKey)
  }

  const query = params.toString()
  return query.length > 0 ? `/entries/${entryId}/edit?${query}` : `/entries/${entryId}/edit`
}
