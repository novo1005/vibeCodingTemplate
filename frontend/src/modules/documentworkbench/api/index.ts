import { http } from '@/utils/request'
import type {
  AiPingResult,
  FinalizedDocument,
  FrameworkScore,
  ImportDraftInput,
  ImportResponse,
  PreviewInput,
  QualityCheckItem,
  StructuredPreview,
  WorkbenchConfig,
} from '../types'

export const documentWorkbenchApi = {
  config: () => http.get<WorkbenchConfig>('/documentworkbench/config'),
  pingAiGateway: () => http.post<AiPingResult>('/documentworkbench/ai-ping'),
  importDraft: (input: ImportDraftInput) =>
    http.post<ImportResponse>('/documentworkbench/import', input),
  recommend: (sessionId: string, model: string) =>
    http.post<FrameworkScore[]>(`/documentworkbench/${sessionId}/recommend`, { model }),
  preview: (sessionId: string, input: PreviewInput) =>
    http.post<StructuredPreview>(`/documentworkbench/${sessionId}/preview`, input),
  qualityCheck: (sessionId: string, model: string) =>
    http.post<QualityCheckItem[]>(`/documentworkbench/${sessionId}/quality-check`, { model }),
  saveSupplements: (
    sessionId: string,
    input: Array<{ id: string; question: string; answer: string; relatedSectionId?: string }>,
  ) => http.patch(`/documentworkbench/${sessionId}/supplements`, input),
  finalize: (
    sessionId: string,
    input: { model: string; acceptedQualityRuleIds: string[]; skipDeAi: boolean },
  ) => http.post<FinalizedDocument>(`/documentworkbench/${sessionId}/finalize`, input),
  publish: (sessionId: string, input: { title: string; confirmed: true }) =>
    http.post<{ url: string }>(`/documentworkbench/${sessionId}/publish`, input),
}
