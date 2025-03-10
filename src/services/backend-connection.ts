/* eslint-disable @typescript-eslint/no-explicit-any */

import { BusOpResponse } from "./bus-op.interface";
import { ConnectionOptions } from "./websocket";

export class BackendConnectionImpl {
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
    this.postRequest( `${this.opt?.webApiUrl}/${method}/`, data);
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

const myBackendConnection: BackendConnectionImpl = new BackendConnectionImpl();
export { myBackendConnection };
