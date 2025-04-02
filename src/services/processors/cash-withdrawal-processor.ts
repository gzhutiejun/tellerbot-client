/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  extractAccount,
  extractCancel,
  extractCurrency,
  playAudio,
} from "../../util/util";
import { ExtractResponse } from "../bus-op.interface";
import { chatStoreService } from "../chat-store.service";
import { myChatbotServiceAgent } from "../chatbot-service-agent";
import { translate } from "../i18n/i18n.service";
import { myLoggerService } from "../logger.service";
import { ChatbotAction, IProcessor } from "./processor.interface";
import { getCashWithdrawalPromptSchema } from "./prompt-helper";

export class CashWithdrawalTxProcessor implements IProcessor {
  private lastStep = -1;
  private currentStep = -1;

  constructor() {
    myLoggerService.log("create CashWithdrawalTxProcessor");
  }
  async start() {
    myLoggerService.log("CashWithdrawalTxProcessor: start");
    this.lastStep = -1;
    this.currentStep = -1;

    const nextAction: ChatbotAction = this.findNextStep();
    if (nextAction.actionType === "ContinueTransaction") {
      playAudio(nextAction.prompt!);
    } else {
      myLoggerService.log("Invalid action");
    }
  }

  async processAtmMessage(message: any): Promise<ChatbotAction> {
    myLoggerService.log(
      "CashWithdrawalTxProcessor: processAtmMessage" + JSON.stringify(message)
    );

    let nextAction: ChatbotAction = {
      actionType: "None",
    };
    switch (message.event) {
      case "note-mix":
        if (message.parameters.success) {
          chatStoreService.sessionContext!.transactionContext!.noteMixPerformed =
            message.parameters.success;
        } else {
          chatStoreService.sessionContext!.transactionContext!.amount =
            undefined;
        }
        nextAction = this.findNextStep();
        break;
      case "notification":
        nextAction = {
          actionType: "ContinueSession",
          prompt: [message.parameters.vg[chatStoreService.language]],
          playAudioOnly: true,
        };
        break;
    }

    switch (message.action) {
      case "end-transaction":
        nextAction = {
          actionType: "EndTransaction",
          prompt: [message.parameters.vg[chatStoreService.language]],
        };
        break;
    }

    return nextAction;
  }

  async processText(text: string): Promise<ChatbotAction> {
    myLoggerService.log("CashWithdrawalTxProcessor: processText: " + text);
    const promptSchema = getCashWithdrawalPromptSchema();
    const req = {
      text: text,
      instruction: promptSchema.instruction,
      schema: promptSchema.schema,
      language: chatStoreService.language,
    };

    const res: ExtractResponse = await myChatbotServiceAgent.extract(
      JSON.stringify(req)
    );
    myLoggerService.log(res);

    try {
      if (res && res.data && res.data.data) {
        const txData = JSON.parse(res.data.data);
        console.log("txData", txData);
        if (extractCancel(txData.cancel)) {
          return {
            actionType: "Cancel",
          };
        }

        if (!chatStoreService.sessionContext!.transactionContext!.amount)
          chatStoreService.sessionContext!.transactionContext!.amount = {};

        if (txData.amount > 0)
          chatStoreService.sessionContext!.transactionContext!.amount!.value =
            txData.amount;
        if (txData.currency)
          chatStoreService.sessionContext!.transactionContext!.amount!.currency =
            extractCurrency(txData.currency);
        if (txData.account)
          chatStoreService.sessionContext!.transactionContext!.selectedAccount =
            extractAccount(txData.account);

        myLoggerService.log(
          "transactionContext: " +
            JSON.stringify(chatStoreService.sessionContext!.transactionContext!)
        );
      }
    } catch (e) {
      console.log("extract error:", e);
    }

    const nextAction: ChatbotAction = this.findNextStep();
    myLoggerService.log(
      "nextAction: " +
        JSON.stringify(nextAction) +
        " currentStep:" +
        this.currentStep
    );

    if (nextAction.actionType === "AtmInteraction") {
      chatStoreService.setPlayAudioOnly(true);
    } else {
      chatStoreService.setPlayAudioOnly(false);
    }

    return nextAction;
  }

  private findNextStep(): ChatbotAction {
    myLoggerService.log("findNextStep: currentStep: " + this.currentStep);

    const nextAction: ChatbotAction = {
      actionType: "ContinueTransaction",
      prompt: [],
    };

    //step 1
    this.currentStep = 1;
    if (!chatStoreService.sessionContext!.transactionContext?.selectedAccount) {
      nextAction.prompt = [translate("cash withdrawal account")];
      nextAction.prompt.push(translate("supported accounts") + ":");
      console.log(chatStoreService.sessionContext.accounts);
      chatStoreService.sessionContext.accounts?.map((item) => {
        console.log(item);
        nextAction.prompt?.push(translate(item.toLowerCase()));
      });
      return nextAction;
    }

    //step 3
    this.currentStep = 3;
    if (
      !chatStoreService.sessionContext!.transactionContext?.amount ||
      !chatStoreService.sessionContext!.transactionContext?.amount.currency ||
      !chatStoreService.sessionContext!.transactionContext?.amount.value
    ) {
      nextAction.prompt = [translate("cash withdrawal currency amount")];
      nextAction.prompt.push(translate("supported currencies") + ":");
      chatStoreService.supportedWithdrawalCurrencies?.map((item) => {
        nextAction.prompt?.push(translate(item.toLowerCase()));
      });
      return nextAction;
    }

    //step 4
    this.currentStep = 4;
    if (!chatStoreService.sessionContext!.transactionContext?.amount.currency) {
      nextAction.prompt = [translate("cash withdrawal currency")];
      return nextAction;
    }

    //step 5
    this.currentStep = 5;
    if (!chatStoreService.sessionContext!.transactionContext?.amount.value) {
      nextAction.prompt = [translate("cash withdrawal amount")];
      return nextAction;
    }

    //step 6
    this.currentStep = 6;
    if (!chatStoreService.sessionContext!.transactionContext.noteMixPerformed) {
      nextAction.actionType = "AtmInteraction";
      nextAction.prompt = [translate("please wait")];
      nextAction.interactionMessage = {
        action: "note-mix",
        parameters: {
          currency:
            chatStoreService.sessionContext.transactionContext!.amount!
              .currency,
          amount:
            chatStoreService.sessionContext.transactionContext!.amount!.value,
        },
      };
      return nextAction;
    }

    //step 7
    this.currentStep = 7;
    if (!chatStoreService.sessionContext!.transactionContext.executeCompleted) {
      nextAction.actionType = "AtmInteraction";
      nextAction.prompt = [translate("transaction progressing")];
      nextAction.interactionMessage = {
        action: "cash-withdrawal",
        parameters: {
          currency:
            chatStoreService.sessionContext.transactionContext!.amount!
              .currency,
          amount:
            chatStoreService.sessionContext.transactionContext!.amount!.value,
          accountType:
            chatStoreService.sessionContext!.transactionContext.selectedAccount,
          receiptRequested: true,
        },
      };
      return nextAction;
    }

    return nextAction;
  }
}
