/* eslint-disable @typescript-eslint/no-explicit-any */

import { myLoggerService } from "./logger.service";
import { ConnectionOptions, WebSocketConnectionImpl } from "./websocket";

export class AtmServiceAgent {
  private connection!: WebSocketConnectionImpl;
  private messageReceivedHandler?: any;
  opt: ConnectionOptions | undefined;

  init(opt: ConnectionOptions) {
    this.opt = opt;
  }
  onMessage = (strMsg: string) => {
    myLoggerService.log("message received", strMsg);
    this.messageReceivedHandler(strMsg);
  };

  async connect() {
    myLoggerService.log("connect ATM");
    try {
      this.connection = new WebSocketConnectionImpl({
        ...this.opt!,
        onMessage: this.onMessage,
      });
      return true;
    } catch (e) {
      myLoggerService.log("connect, url = " + this.opt?.wsUrl);
      myLoggerService.log(e + " ");
    }
    return false;
  }

  registerMessageHandler(handler: any) {
    myLoggerService.log("register ATM message handler");
    this.messageReceivedHandler = handler;

    window.setTimeout(() => {
      const msg = {
        action: "open-session",
        parameters: {
          language: "en",
          cardNumber: "1234567890123456",
        },
      };

      this.messageReceivedHandler(JSON.stringify(msg));
    }, 1000);
  }

  send(message: any) {
    try {
      if (message) {
        myLoggerService.log(
          "send message to external application: " + JSON.stringify(message)
        );
        this.connection.send(message);
      }
    } catch (e) {
      myLoggerService.log(e + " ");
    }
  }
}

const myATMServiceAgent: AtmServiceAgent = new AtmServiceAgent();
export { myATMServiceAgent };
