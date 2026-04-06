import { VertexAI } from '@google-cloud/vertexai'
import type { ModelParams, GenerateContentResponse } from '@google-cloud/vertexai'

let _vertexAI: VertexAI | null = null

/**
 * Returns a singleton VertexAI client configured for europe-west3.
 * Requires GCP_PROJECT_ID env var. GCP_LOCATION defaults to europe-west3.
 */
export function getVertexAI(): VertexAI {
    if (!_vertexAI) {
        const project = process.env.GCP_PROJECT_ID
        if (!project) throw new Error('GCP_PROJECT_ID is not set')
        const location = process.env.GCP_LOCATION ?? 'europe-west1'
        _vertexAI = new VertexAI({ project, location })
    }
    return _vertexAI
}

/**
 * Returns a GenerativeModel from the Vertex AI client.
 * Accepts the same params as VertexAI.getGenerativeModel().
 */
export function getModel(params: ModelParams) {
    return getVertexAI().getGenerativeModel(params)
}

/**
 * Extract text from a Vertex AI GenerateContentResponse.
 * Mirrors the .text() convenience method from the AI Studio SDK.
 */
export function responseText(response: GenerateContentResponse): string {
    return response.candidates?.[0]?.content?.parts
        ?.map(p => p.text ?? '')
        .join('') ?? ''
}
