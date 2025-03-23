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
  private lastStep = 0;
  private currentStep = 0;

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

    if (
      res &&
      res.responseMessage &&
      res.responseMessage &&
      res.responseMessage.data[0] === "{"
    ) {
      const data = JSON.parse(res.responseMessage.data);
      myLoggerService.log("Transcribed data:" + JSON.stringify(data));
      if (data.cancel) {
        return {
          actionType: "Cancel",
        };
      }

      chatStoreService.sessionContext!.transactionContext = {
        currentTransaction: this.identifyTransactionName(
          data
        ) as TransactionName,
      };
    }

    const action: ChatbotAction = this.findNextStep();
    if (
      action.actionType === "ContinueSession" &&
      this.currentStep === this.lastStep
    ) {
      action.actionType = "Repeat";
    }
    this.lastStep = this.currentStep;

    return action;
  }

  private findNextStep(): ChatbotAction {
    const action = {
      actionType: "ContinueSession" as ChatbotActionType,
      prompt: ["which service do you need?"],
    };

    this.currentStep = 1;
    if (
      chatStoreService.sessionContext.transactionContext?.currentTransaction
    ) {
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
