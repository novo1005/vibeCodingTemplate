export interface NormalizeDraftInput {
  title: string
  markdown: string
}

export function normalizeDraft(input: NormalizeDraftInput) {
  const paragraphs = input.markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('# '))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter((line) => line.length > 0)
    .map((text, index) => ({
      id: `p-${String(index + 1).padStart(3, '0')}`,
      index,
      text,
    }))

  return {
    title: input.title.trim() || '未命名文档',
    paragraphs,
  }
}
