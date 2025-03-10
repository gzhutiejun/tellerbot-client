/* eslint-disable @typescript-eslint/no-explicit-any */

import { BusOpResponse } from "./bus-op.interface";
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
        console.log("fail to connect chatbot server", res);
        return connected;
      } else {
        console.log("connected");
        connected = true;
        return connected;
      }
    } catch (e: any) {
      console.log("fail to connect chatbot server", e);
      return connected;
    }
  }

  send(method: string, data: string | FormData) {
    this.postRequest( method, data);
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
          "Content-Type": "multipart/form-data",
          Accept: "multipart/form-data",
        },
        body: data,
      };
      const res = await fetch(`${this.opt?.webApiUrl}/upload`, req);

      if (res.ok) {
        retVal.errorCode = "success";
        retVal.responseMessage = await res.json();
        console.log(retVal);
      }
    } catch (e: any) {
      retVal.errorCode = "sendFailure";
      console.log(e);
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
        console.log(retVal);
      }
    } catch (e: any) {
      retVal.errorCode = "sendFailure";
      console.log(e);
    }

    return retVal;
  }
}

const myChatbotServiceAgent: ChatbotServiceAgent = new ChatbotServiceAgent();
export { myChatbotServiceAgent };
