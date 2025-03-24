/* eslint-disable @typescript-eslint/no-explicit-any */

export interface BusOpResponse {
  success: boolean;
}

export interface UpdateFileResponse extends BusOpResponse {
  filePath?: string;
}

export interface ExtractResponse extends BusOpResponse {
  data?: any;
}

export interface TranscribeResponse extends BusOpResponse {
  transcript?: string;
}

export interface GenerateAudioResponse extends BusOpResponse {
  fileName?: string;
}

export interface SessionResponse extends BusOpResponse {
  sessionId?: string;
}
