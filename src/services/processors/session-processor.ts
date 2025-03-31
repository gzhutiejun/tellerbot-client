/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson } from "../../util/ajax";
import { extractCancel, getGreetingWords, playAudio } from "../../util/util";
import { ExtractResponse, SessionResponse } from "../bus-op.interface";
import { ChatbotActionType, chatStoreService } from "../chat-store.service";
import { myChatbotServiceAgent } from "../chatbot-service-agent";
import { translate } from "../i18n/i18n.service";
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
  private supportedTransactons?: string[] = [];
  constructor() {
    myLoggerService.log("create SessionProcessor");
  }
  async start() {
    myLoggerService.log("SessionProcessor: start");
    const transactionConfig = await fetchJson("/config/transactions.json");
    this.supportedTransactons = transactionConfig.transactions;
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
        `${translate(getGreetingWords())}, ${translate("firstAskServices")}`,
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

    let instruction = "supported transactons: ";
    this.supportedTransactons!.map((item) => {
      instruction += item + ",";
    });

    console.log("instruction", instruction);
    const req = {
      text: text,
      instruction: instruction,
      format: this.template,
      language: chatStoreService.language,
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
      prompt: [translate("askServices")],
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
    if (
      val.includes("time deposit") ||
      val.includes("fix deposit") ||
      val.includes("fixed deposit")
    )
      return "time-deposit";
    if (val.includes("time") && val.includes("deposit")) return "time-deposit";
    return undefined;
  }
}
