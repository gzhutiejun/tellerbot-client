/* eslint-disable @typescript-eslint/no-explicit-any */

import { chatStoreService } from "./chat-store.service";
import { myLoggerService } from "./logger.service";
import { ConnectionOptions, WebSocketConnectionImpl } from "./websocket";

export class AtmServiceAgent {
  private connection!: WebSocketConnectionImpl;
  private messageReceivedHandler?: any;
  opt: ConnectionOptions | undefined;
  private connected = false;

  init(opt: ConnectionOptions) {
    this.opt = opt;
  }
  onMessage = (strMsg: string) => {
    myLoggerService.log("message received");
    this.messageReceivedHandler(strMsg);
  };

  async connect() {
    myLoggerService.log("connect ATM");

    if (chatStoreService.debugMode) {
      this.connected = true;
      return;
    }
    try {
      this.connection = new WebSocketConnectionImpl({
        ...this.opt!,
        onMessage: this.onMessage,
      });
      this.connected = true;
      return;
    } catch (e) {
      myLoggerService.log("connect, url = " + this.opt?.wsUrl);
      myLoggerService.log(e + " ");
    }
    return;
  }

  private openSessionHandler = () => {
    this.messageReceivedHandler(
      JSON.stringify({
        action: "open-session",
        parameters: {
          language: "en",
          cardNumber: "1234567890123456",
        },
      })
    );
  }

  registerMessageHandler(handler: any) {
    myLoggerService.log("register ATM message handler");
    this.messageReceivedHandler = handler;

    if (chatStoreService.debugMode) {
      chatStoreService.registerStartConversationHandler(this.openSessionHandler);
    }
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



