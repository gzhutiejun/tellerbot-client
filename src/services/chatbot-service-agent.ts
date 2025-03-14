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
      const res = await fetch(
        `${this.opt?.webApiUrl}`
      );

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

  async send(method: string, data: string | FormData): Promise<any> {
    const res = await this.postRequest( method, data);
    return res;
  }

  async upload(data: FormData): Promise<any> {
    const retVal: BusOpResponse = {
      method: "upload",
      errorCode: "timeout",
    };

    try {
      const req = {
        method: "POST",
        headers: {
          // "Content-Type": "multipart/form-data",
          Accept: "multipart/form-data",
        },
        body: data,
      };
      const res = await fetch(`${this.opt?.webApiUrl}/upload`, req);

      if (res.ok) {
        retVal.errorCode = "success";
        retVal.responseMessage = await res.json();
        myLoggerService.log(retVal);
      }
    } catch (e: any) {
      retVal.errorCode = "sendFailure";
      myLoggerService.log(e);
    }

    return retVal;
  }
  private async postRequest(method: string, data: string | FormData): Promise<any> {
    const retVal: BusOpResponse = {
      method: method,
      errorCode: "timeout",
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
        retVal.errorCode = "success";
        retVal.responseMessage = await res.json();
        myLoggerService.log(retVal);
      }
    } catch (e: any) {
      retVal.errorCode = "sendFailure";
      myLoggerService.log(e);
    }

    return retVal;
  }
}

const myChatbotServiceAgent: ChatbotServiceAgent = new ChatbotServiceAgent();
export { myChatbotServiceAgent };
