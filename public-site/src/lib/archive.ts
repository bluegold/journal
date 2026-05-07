export interface ArchiveMonthStat {
  month: string
  count: number
}

export interface ArchiveMonth {
  month: string
  count: number
  label: string
}

export interface ArchiveYearGroup {
  year: string
  months: ArchiveMonth[]
}

export const formatArchiveMonthLabel = (month: string): string => {
  return `${month.slice(0, 4)}年${month.slice(5, 7)}月`
}

export const buildArchiveMonths = (months: ArchiveMonthStat[]): ArchiveMonth[] => {
  return months.map((month) => ({
    ...month,
    label: formatArchiveMonthLabel(month.month),
  }))
}

export const buildArchiveYearGroups = (months: ArchiveMonth[]): ArchiveYearGroup[] => {
  const groups = new Map<string, ArchiveMonth[]>()

  for (const month of months) {
    const year = month.month.slice(0, 4)
    const current = groups.get(year)
    if (current) {
      current.push(month)
    } else {
      groups.set(year, [month])
    }
  }

  return [...groups.entries()].map(([year, yearMonths]) => ({ year, months: yearMonths }))
}

export const buildArchiveMonthPath = (projectSlug: string, month: string): string => {
  return `/${projectSlug}/${month.slice(0, 4)}/${month.slice(5, 7)}/`
}
