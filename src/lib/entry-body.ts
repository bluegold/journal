export const loadEntryBody = async (bucket: R2Bucket, bodyKey: string): Promise<string | null> => {
  const object = await bucket.get(bodyKey)
  if (!object) {
    return null
  }

  return await object.text()
}
