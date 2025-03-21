/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  extractTranscribedData,
  getGreetingWords,
  speak,
} from "../../util/util";
import { chatStoreService } from "../chat-store.service";
import { myChatbotServiceAgent } from "../chatbot-service-agent";
import { myLoggerService } from "../logger.service";
import {
  ChatbotAction,
  IProcessor,
  TransactionName,
} from "./processor.interface";

export class SessionProcessor implements IProcessor {
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
        "Currently we provide cash withdrawal and time deposit transactions.",
      ];
      speak(prompts);
    }
  }

  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("SessionProcessor: process:" + text);
    return await this.findNextAction(text);
  }

  private async findNextAction(text: string): Promise<ChatbotAction> {
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

    const data = extractTranscribedData(res);
    myLoggerService.log("Transcribed data:" + JSON.stringify(data));
    let action: ChatbotAction;
    const tx = this.identifyTransactionName(data);
    if (tx !== "none") {
      // start a new transaction
      action = {
        actionType: "NewTransaction",
        transactionName: tx,
      };
      return action;
    }

    action = {
      actionType: "ContinueSession",
      prompt: ["which service do you need?"],
    };

    return action;
  }
  private identifyTransactionName(data: any): TransactionName {
    if (!data.transaction) return "none";
    const val: string = data.transaction.toLowerCase();
    if (!val) return "none";
    if (val.includes("withdraw")) return "cash-withdrawal";
    if (val.includes("time") && val.includes("deposit")) return "time-deposit";
    return "none";
  }
}
