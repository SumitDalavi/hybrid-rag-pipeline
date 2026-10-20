export type ProviderMode = 'mock' | 'live';

export interface CredentialStatus {
  openai: ProviderMode;
  anthropic: ProviderMode;
  chroma: ProviderMode;
}

export function isRealOpenAIKey(key?: string): boolean {
  return !!key && key.startsWith('sk-') && !key.startsWith('sk-dummy') && key.length >= 20;
}

export function isRealAnthropicKey(key?: string): boolean {
  return !!key && key.startsWith('sk-ant-') && !key.startsWith('sk-dummy');
}

export function detectCredentialStatus(): CredentialStatus {
  return {
    openai: isRealOpenAIKey(process.env.OPENAI_API_KEY) ? 'live' : 'mock',
    anthropic: isRealAnthropicKey(process.env.ANTHROPIC_API_KEY) ? 'live' : 'mock',
    chroma: process.env.CHROMA_URL ? 'live' : 'mock',
  };
}

export const credentialStatus = detectCredentialStatus();
