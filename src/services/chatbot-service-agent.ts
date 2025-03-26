/* eslint-disable @typescript-eslint/no-explicit-any */

import { BusOpResponse, ExtractResponse, GenerateAudioResponse, SessionResponse, TranscribeResponse, UpdateFileResponse } from "./bus-op.interface";
import { myLoggerService } from "./logger.service";
import { ConnectionOptions } from "./websocket";

export class ChatbotServiceAgent {
  opt: ConnectionOptions | undefined;
  init(opt: ConnectionOptions) {
    this.opt = opt;
  }

  async connect(): Promise<boolean> {
    let connected = false;
    try {
      const res = await fetch(`${this.opt?.webApiUrl}`);

      if (!res.ok) {
        myLoggerService.log("fail to connect chatbot server:" + res.status);
        return connected;
      } else {
        myLoggerService.log("connected");
        connected = true;
        return connected;
      }
    } catch (e: any) {
      myLoggerService.log("fail to connect chatbot server" + e.message);
      return connected;
    }
  }

  async opensession(data: string): Promise<SessionResponse> {
    const retVal: SessionResponse = {
      success: false,
    };

    try {
      const res = await fetch(`${this.opt?.webApiUrl}/opensession`, this.createPostReequest(data));
      if (res.ok) {
        const sessionData = await res.json();
        console.log("opensession", sessionData);
        retVal.sessionId = sessionData.session_id;
        retVal.success = true;
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }
  async closesession(data: string): Promise<SessionResponse> {
    const retVal: SessionResponse = {
      success: false,
    };

    try {
      const res = await fetch(`${this.opt?.webApiUrl}/closesession`, this.createPostReequest(data));
      if (res.ok) {
        const sessionData = await res.json();
        console.log("closesession", sessionData);
        retVal.sessionId = sessionData.session_id;
        retVal.success = true;
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }
  async generateaudio(data: string): Promise<GenerateAudioResponse> {
    const retVal: GenerateAudioResponse = {
      success: false,
    };

    try {
      const res = await fetch(`${this.opt?.webApiUrl}/generateaudio`, this.createPostReequest(data));
      if (res.ok) {
        const data = await res.json();
        retVal.fileName = data.file_name;
        retVal.success = true;
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }
  async transcribe(data: string): Promise<TranscribeResponse> {
    const retVal: TranscribeResponse = {
      success: false,
    };

    try {
      const res = await fetch(`${this.opt?.webApiUrl}/transcribe`, this.createPostReequest(data));
      if (res.ok) {
        const data = await res.json();
        retVal.transcript = data.transcript;
        retVal.success = true;
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }
  async extract(data: string): Promise<ExtractResponse> {
    const retVal: ExtractResponse = {
      success: false,
    };

    try {
      const res = await fetch(`${this.opt?.webApiUrl}/extract`, this.createPostReequest(data));
      if (res.ok) {
        const result = await res.json();
        retVal.data  = result;
        retVal.success = true;
        myLoggerService.log("extract result: " + JSON.stringify(retVal));
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }

  async download(file_path: string): Promise<any> {
    const retVal: BusOpResponse = {
      success: false,
    };

    try {
      myLoggerService.log(`download: ${file_path}`);
      const res = await fetch(`${this.opt?.webApiUrl}/download/${file_path}`);
      myLoggerService.log(`download complete`);
      if (res.ok) {
        retVal.success = true;
        const filePath = await res.json();
        console.log(filePath);
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return;
  }
  async upload(data: FormData): Promise<any> {
    const retVal: UpdateFileResponse = {
      success: false,
    };
    try {
      const req = {
        method: "POST",
        body: data,
      };
      const res = await fetch(`${this.opt?.webApiUrl}/upload`, req);
      if (res.ok) {
        retVal.success = true;
        const fileInfo = await res.json();
        retVal.filePath = fileInfo.file_path;
        console.log(retVal);
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }

  private createPostReequest(data: string): any {
    const req = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: data,
    };
    return req;
  }
}

const myChatbotServiceAgent = new ChatbotServiceAgent();

export { myChatbotServiceAgent };
