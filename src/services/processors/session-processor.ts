/* eslint-disable @typescript-eslint/no-explicit-any */
import { getGreetingWords, playAudio } from "../../util/util";
import { ChatbotActionType, chatStoreService } from "../chat-store.service";
import { myChatbotServiceAgent } from "../chatbot-service-agent";
import { myLoggerService } from "../logger.service";
import {
  ChatbotAction,
  IProcessor,
  TransactionName,
} from "./processor.interface";

export class SessionProcessor implements IProcessor {
  private started = false;
  constructor() {
    myLoggerService.log("create Session Processor");
  }
  async start() {
    myLoggerService.log("SessionProcessor: start");

    const sessionRes = await myChatbotServiceAgent?.opensession(
      JSON.stringify({
        action: "opensession",
      })
    );
    if (
      sessionRes &&
      sessionRes.responseMessage &&
      sessionRes.responseMessage.session_id
    ) {
      chatStoreService.setSessionId(sessionRes.responseMessage.session_id);

      const prompts = [
        `${getGreetingWords()}, I am NCR Teller assistant, which service do you need?`,
      ];
      playAudio(prompts);
    }
  }

  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("SessionProcessor: process:" + text);

    const req = {
      text: text,
      instruction:
        "We support transactions: cash deposit, cash withdrawal, transfer, please extract the transaction is requested.",
      format: {
        transaction: "",
        cancel: false,
      },
    };
    const res = await myChatbotServiceAgent.extract(JSON.stringify(req));
    myLoggerService.log(res);

    this.extractData(res);
    return await this.findNextAction();
  }

  private extractData(messageData: any) {
    if (
      !messageData ||
      typeof messageData !== "object" ||
      !messageData.responseMessage ||
      !messageData.responseMessage.success
    ) {
      return;
    }
    if (
      !messageData.responseMessage.data ||
      messageData.responseMessage.data.length < 5 ||
      messageData.responseMessage.data[0] !== "{"
    ) {
      return;
    }
    try {
      const data = JSON.parse(messageData.responseMessage.data);
      myLoggerService.log("Transcribed data:" + JSON.stringify(data));

      chatStoreService.sessionContext!.transactionContext = {
        currentTransaction: this.identifyTransactionName(
          data
        ) as TransactionName,
      };
    } catch (error) {
      console.log(error);
    }
  }

  private findNextAction(): ChatbotAction {
    const action = {
      actionType: "ContinueSession" as ChatbotActionType,
      prompt: ["which service do you need?"],
    };

    if (chatStoreService.sessionContext.transactionContext?.currentTransaction) {
      if (!this.started) {
        action.actionType = "NewTransaction" as ChatbotActionType;
        this.started = true;
      }
    }
    return action;
  }
  private identifyTransactionName(data: any): TransactionName {
    if (!data.transaction) return undefined;
    const val: string = data.transaction.toLowerCase();
    if (!val) return undefined;
    if (val.includes("withdraw")) return "cash-withdrawal";
    if (val.includes("time") && val.includes("deposit")) return "time-deposit";
    return undefined;
  }
}
