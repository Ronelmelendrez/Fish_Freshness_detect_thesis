import { env } from '@/config/env';
import type { PartKey } from '@/shared/constants';

export type GateStatus = 'searching' | 'hint' | 'ok' | 'offline';
export type GateMessage = 'Point at the fish' | 'Move closer' | 'Hold steady' | 'More light' | 'Less glare' | 'Ready';

export interface GateResponse {
  status: GateStatus;
  message: GateMessage | string;
  parts: Partial<Record<PartKey, { confidence: number; width?: number }>>;
  quality?: { sharpness?: number; brightness?: number };
}

export interface GradeResponse {
  status: 'result' | 'rescan' | 'offline';
  verdict?: { grade: 'fresh' | 'spoiled'; confidence: number };
  parts?: Partial<Record<PartKey, { grade: 'fresh' | 'spoiled'; confidence: number }>>;
  note?: string;
}

const requestTimeoutMs = 20_000;

export async function gate(image: Blob, required: PartKey): Promise<GateResponse> {
  return request('/gate', image, required);
}

export async function grade(image: Blob, required: PartKey): Promise<GradeResponse> {
  return request('/grade', image, required);
}

async function request<T>(path: string, image: Blob, required: PartKey): Promise<T> {
  if (!env.gatewayUrl) throw new Error('Hosted scanning is not configured. Set EXPO_PUBLIC_GATEWAY_URL.');

  const form = new FormData();
  form.append('image', image, 'frame.jpg');
  form.append('required', required);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(`${env.gatewayUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: env.gatewayAppToken ? { 'X-App-Token': env.gatewayAppToken } : undefined,
      body: form,
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(readError(body) ?? `Gateway request failed (${response.status}).`);
    }
    return body as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The gateway timed out. Check your connection and try again.');
    }
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    clearTimeout(timer);
  }
}

function readError(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  return typeof record.detail === 'string'
    ? record.detail
    : typeof record.error === 'string'
      ? record.error
      : null;
}
