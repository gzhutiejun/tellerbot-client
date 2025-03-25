/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractCancel, getGreetingWords, playAudio } from "../../util/util";
import { ExtractResponse, SessionResponse } from "../bus-op.interface";
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
  private lastStep = -1;
  private currentStep = -1;
  private template = {
    transaction: "",
    cancel: false,
  };

  constructor() {
    myLoggerService.log("create SessionProcessor");
  }
  async start() {
    myLoggerService.log("SessionProcessor: start");
    this.lastStep = -1;
    this.currentStep = -1;
    const sessionRes: SessionResponse =
      await myChatbotServiceAgent?.opensession(
        JSON.stringify({
          action: "opensession",
        })
      );
    if (sessionRes && sessionRes.sessionId) {
      chatStoreService.setSessionId(sessionRes.sessionId);

      const prompts = [
        `${getGreetingWords()}, I am NCR Teller assistant, which service do you need?`,
      ];
      playAudio(prompts);
    }
  }

  async processAtmMessage(message: any): Promise<ChatbotAction> {
    myLoggerService.log(
      "SessionProcessor: processAtmMessage" + JSON.stringify(message)
    );
    return {
      actionType: "Idle",
    };
  }

  async processText(text: string): Promise<ChatbotAction> {
    myLoggerService.log("SessionProcessor: processText:" + text);

    const req = {
      text: text,
      instruction:
        "We support transactions: cash deposit, cash withdrawal, transfer, please extract the transaction is requested.",
      format: this.template,
    };
    const res: ExtractResponse = await myChatbotServiceAgent.extract(
      JSON.stringify(req)
    );

    try {
      if (res && res.data && res.data.data) {
        const txData = JSON.parse(res.data.data);
        if (extractCancel(txData.cancel)) {
          return {
            actionType: "Cancel",
          };
        }

        chatStoreService.sessionContext!.transactionContext = {
          currentTransaction: this.identifyTransactionName(
            txData.transaction
          ) as TransactionName,
        };
      }
    } catch (e) {
      console.log("extract:", e);
      return { actionType: "ContinueSession" };
    }

    const action: ChatbotAction = this.findNextStep();
    if (
      action.actionType === "ContinueSession" &&
      this.currentStep === this.lastStep
    ) {
      action.playAudioOnly = true;
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
  private identifyTransactionName(tx: string): TransactionName {
    if (!tx) return undefined;
    const val: string = tx.toLowerCase();
    if (val.includes("withdraw")) return "cash-withdrawal";
    if (val.includes("time") && val.includes("deposit")) return "time-deposit";
    return undefined;
  }
}
