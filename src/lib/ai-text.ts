export const stripFencedCodeBlocks = (text: string): string => {
  return text.replace(/```[\s\S]*?```/g, '').trim()
}
