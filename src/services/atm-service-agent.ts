/* eslint-disable @typescript-eslint/no-explicit-any */

import { chatStoreService } from "./chat-store.service";
import { myLoggerService } from "./logger.service";
import { ConnectionOptions, WebSocketConnectionImpl } from "./websocket";

export class AtmServiceAgent {
  private connection!: WebSocketConnectionImpl;
  private messageReceivedHandler?: any;
  opt: ConnectionOptions | undefined;
  connected = false;

  constructor() {
    this.connected = false;
  }
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
          language: chatStoreService.language,
          cardNumber: "1234567890123456",
        },
      })
    );
  };

  registerMessageHandler(handler: any) {
    myLoggerService.log("register ATM message handler");
    this.messageReceivedHandler = handler;

    if (chatStoreService.debugMode) {
      chatStoreService.setLanguage("zh");
      chatStoreService.registerStartConversationHandler(
        this.openSessionHandler
      );
    }
  }

  send(message: any) {
    try {
      if (message) {
        myLoggerService.log(
          "send message to external application: " + JSON.stringify(message)
        );
        if (chatStoreService.debugMode) {
          this.simulateSendAtmMessage(message);
        } else {
          this.connection.send(message);
        }
      }
    } catch (e) {
      myLoggerService.log(e + " ");
    }
  }

  private simulateSendAtmMessage(message: any) {
    if (!message || !message.action) return;
    switch (message.action) {
      case "close-session":
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              event: "session-closed",
            })
          );
        }, 1000);
        break;
      case "note-mix":
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              event: "note-mix",
              parameters: {
                success: true,
                language: "en",
              },
            })
          );
        }, 1000);
        break;
      case "cash-withdrawal":
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              event: "transaction-started",
            })
          );
        }, 1000);
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              action: "event",
              parameters: {
                actionCode: "00",
                vg: "please take money",
              },
            })
          );
        }, 3000);
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              action: "end-transaction",
              parameters: {
                actionCode: "00",
                vg: "Your transaction has been processed successfully.",
              },
            })
          );
        }, 6000);
        break;
      case "retrieve-time-deposit-term":
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              event: " time-deposit-terms",
              parameters: {
                success: true,
                terms: [
                  {
                    term: "3 months",
                    interest: 0.035,
                  },
                  {
                    term: "6 months",
                    interest: 0.038,
                  },
                  {
                    term: "1 year",
                    interest: 0.04,
                  },
                  {
                    term: "3 years",
                    interest: 0.045,
                  },
                ],
              },
            })
          );
        }, 1000);
        break;
      case "retrieve-balance-amounts":
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              event: "balances",
              parameters: {
                success: true,
                balances: [
                  {
                    currency: "HKD",
                    amount: 10000,
                  },
                  {
                    currency: "USD",
                    amount: 20000,
                  },
                  {
                    currency: "CNY",
                    amount: 5000,
                  },
                ],
              },
            })
          );
        }, 1000);
        break;
      case "time-deposit":
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              event: "transaction-started",
            })
          );
        }, 1000);
        setTimeout(() => {
          this.messageReceivedHandler(
            JSON.stringify({
              action: "end-transaction",
            })
          );
        }, 3000);

        break;
    }
  }
}

const myATMServiceAgent = new AtmServiceAgent()
export { myATMServiceAgent}