const API_URL = import.meta.env.JOURNAL_BASE_URL
const API_TOKEN = import.meta.env.JOURNAL_API_TOKEN

export interface EntrySummary {
  id: string
  journalDate: string
  title: string
  summary: string
  tags: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export interface EntryDetail extends EntrySummary {
  body: string
}

async function fetchAPI(endpoint: string) {
  if (!API_URL || !API_TOKEN) {
    throw new Error('JOURNAL_API_URL and JOURNAL_API_TOKEN must be set')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`API Error: ${response.status} ${JSON.stringify(errorData)}`)
  }

  return response.json()
}

export async function getEntries(tags?: string[]): Promise<EntrySummary[]> {
  let endpoint = '/api/entries'
  if (tags && tags.length > 0) {
    endpoint += `?tag=${tags.join(',')}`
  }

  try {
    const data = await fetchAPI(endpoint)
    return data.items || []
  } catch (error: any) {
    if (error.message.includes('404')) {
      return []
    }
    throw error
  }
}

export async function getEntry(id: string): Promise<EntryDetail> {
  return fetchAPI(`/api/entries/${id}`)
}
