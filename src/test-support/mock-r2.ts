export type MockR2ObjectRecord = {
  key: string
  body: ArrayBuffer
  etag: string
  uploaded: Date
  httpMetadata: HeadersInit | undefined
  customMetadata: Record<string, string> | undefined
}

export type MockR2Options = {
  initialObjects?: Array<{
    key: string
    body: BodyInit
    httpMetadata?: HeadersInit
    customMetadata?: Record<string, string>
  }>
}

export type MockR2State = {
  objects: Map<string, MockR2ObjectRecord>
  writes: Array<{ key: string; size: number }>
  deletes: string[]
}

export type MockR2Bucket = R2Bucket & {
  state: MockR2State
}

type MockR2ObjectResponse = Response & {
  key: string
  size: number
  etag: string
  httpEtag: string
  uploaded: Date
  customMetadata: Record<string, string> | undefined
}

const toArrayBuffer = async (body: BodyInit): Promise<ArrayBuffer> => {
  return await new Response(body).arrayBuffer()
}

const createRecord = async (
  key: string,
  body: BodyInit,
  options: Pick<NonNullable<MockR2Options['initialObjects']>[number], 'httpMetadata' | 'customMetadata'> = {}
): Promise<MockR2ObjectRecord> => {
  const bodyBuffer = await toArrayBuffer(body)
  const etag = `mock-etag-${key}-${bodyBuffer.byteLength}`

  return {
    key,
    body: bodyBuffer,
    etag,
    uploaded: new Date('2026-04-22T00:00:00.000Z'),
    httpMetadata: options.httpMetadata,
    customMetadata: options.customMetadata,
  }
}

const createResponseFromRecord = (record: MockR2ObjectRecord): MockR2ObjectResponse => {
  const headers = new Headers(record.httpMetadata)
  if (!headers.has('etag')) {
    headers.set('etag', record.etag)
  }

  return Object.assign(new Response(record.body.slice(0), { headers }), {
    key: record.key,
    size: record.body.byteLength,
    etag: record.etag,
    httpEtag: record.etag,
    uploaded: record.uploaded,
    customMetadata: record.customMetadata,
  })
}

const createInitialState = (_options: MockR2Options): MockR2State => {
  return {
    objects: new Map<string, MockR2ObjectRecord>(),
    writes: [],
    deletes: [],
  }
}

export const createMockR2Bucket = async (options: MockR2Options = {}): Promise<MockR2Bucket> => {
  const state = createInitialState(options)

  for (const object of options.initialObjects ?? []) {
    state.objects.set(object.key, await createRecord(object.key, object.body, object))
  }

  const bucket: MockR2Bucket = {
    state,
    async put(
      key: string,
      value: BodyInit,
      options?: {
        httpMetadata?: HeadersInit
        customMetadata?: Record<string, string>
      }
    ) {
      const bodyBuffer = await toArrayBuffer(value as BodyInit)
      const etag = `mock-etag-${key}-${bodyBuffer.byteLength}`
      const record: MockR2ObjectRecord = {
        key,
        body: bodyBuffer,
        etag,
        uploaded: new Date('2026-04-22T00:00:00.000Z'),
        httpMetadata: options?.httpMetadata,
        customMetadata: options?.customMetadata,
      }

      state.objects.set(key, record)
      state.writes.push({ key, size: bodyBuffer.byteLength })

      return {
        key,
        etag,
        version: undefined,
        size: bodyBuffer.byteLength,
        httpEtag: etag,
        checksums: undefined,
      } as never
    },
    async get(key: string) {
      const record = state.objects.get(key)
      if (!record) {
        return null
      }

      return createResponseFromRecord(record) as never
    },
    async delete(key: string) {
      state.objects.delete(key)
      state.deletes.push(key)
    },
    async list() {
      return {
        objects: [...state.objects.values()].map((record) => ({
          key: record.key,
          size: record.body.byteLength,
          etag: record.etag,
          uploaded: record.uploaded,
          httpEtag: record.etag,
        })),
        truncated: false,
        delimitedPrefixes: [],
        cursor: undefined,
      } as never
    },
  } as never

  return bucket
}
