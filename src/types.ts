export type MethodRequestCallback = (data: any | null, error: string | null) => Promise<void> | void;
export type MessageType = 'request' | 'response' | 'error';
