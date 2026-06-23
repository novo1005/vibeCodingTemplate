export interface LarkImportResult {
  title: string
  markdown: string
}

export interface LarkPublishInput {
  title: string
  markdown: string
}

export interface LarkPublishResult {
  url: string
}

export interface LarkGateway {
  importDocument(url: string): Promise<LarkImportResult>
  publishDocument(input: LarkPublishInput): Promise<LarkPublishResult>
}

export function parseLarkDocumentUrl(url: string) {
  const parsed = new URL(url)
  const isSupported = parsed.pathname.includes('/wiki/') || parsed.pathname.includes('/docx/')
  if (!isSupported) {
    throw new Error('Unsupported Feishu document URL')
  }
  return { host: parsed.host, pathname: parsed.pathname }
}

export function createDisabledLarkGateway(): LarkGateway {
  return {
    async importDocument() {
      throw new Error('Feishu integration is not configured; paste Markdown instead.')
    },
    async publishDocument() {
      throw new Error('Feishu integration is not configured; copy or download Markdown instead.')
    },
  }
}
