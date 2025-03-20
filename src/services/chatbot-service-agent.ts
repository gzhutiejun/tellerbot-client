/* eslint-disable @typescript-eslint/no-explicit-any */

import { BusOpResponse } from "./bus-op.interface";
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

  async opensession(data: string): Promise<any> {
    const res = await this.postRequest("opensession", data);
    return res;
  }
  async closesession(data: string): Promise<any> {
    const res = await this.postRequest("closesession", data);
    return res;
  }
  async generateaudio(data: string): Promise<any> {
    const res = await this.postRequest("generateaudio", data);
    return res;
  }
  async transcribe(data: string): Promise<any> {
    const res = await this.postRequest("transcribe", data);
    return res;
  }
  async extract(data: string): Promise<any> {
    const res = await this.postRequest("extract", data);
    return res;
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
        retVal.responseMessage = await res.json();
        // myLoggerService.log(retVal);
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return;
  }
  async upload(data: FormData): Promise<any> {
    const retVal: BusOpResponse = {
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
        retVal.responseMessage = await res.json();
        // myLoggerService.log(retVal);
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }
  private async postRequest(method: string, data: string): Promise<any> {
    const retVal: BusOpResponse = {
      success: false,
    };

    try {
      const req = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: data,
      };
      const res = await fetch(`${this.opt?.webApiUrl}/${method}`, req);
      if (res.ok) {
        retVal.success = true;
        retVal.responseMessage = await res.json();
        // myLoggerService.log(retVal);
      }
    } catch (e: any) {
      myLoggerService.log(e);
    }

    return retVal;
  }
}

const myChatbotServiceAgent = new ChatbotServiceAgent();

export { myChatbotServiceAgent };
