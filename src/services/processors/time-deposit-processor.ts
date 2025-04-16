/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  extractAccount,
  extractCancel,
  extractCurrency,
  extractDepositTerm,
  playAudio,
} from "../../util/util";
import { ExtractResponse } from "../bus-op.interface";
import { chatStoreService } from "../chat-store.service";
import { myChatbotServiceAgent } from "../chatbot-service-agent";
import { myFormatorService } from "../formator.service";
import { translate } from "../i18n/i18n.service";
import { myLoggerService } from "../logger.service";
import { ChatbotAction, IProcessor, PromptType } from "./processor.interface";
import {
  getConfirmationPromptSchema,
  getTimeDepositPromptSchema,
} from "./prompt-helper";

export class TimeDepositTxProcessor implements IProcessor {
  private lastStep = -1;
  private currentStep = -1;
  private promptStage: PromptType = "transaction";

  private terms: string[] = [];
  constructor() {
    myLoggerService.log("create TimeDepositTxProcessor");
  }
  async start() {
    myLoggerService.log("TimeDepositTxProcessor: start");
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
      "TimeDepositTxProcessor: processAtmMessage" + JSON.stringify(message)
    );
    let nextAction: ChatbotAction = {
      actionType: "None",
    };
    switch (message.event) {
      case "time-deposit-terms":
        if (message.parameters.success) {
          chatStoreService.sessionContext!.transactionContext!.timeDepositTerms =
            message.parameters.terms;
          this.terms = [];
          message.parameters.terms.map((item: { term: string }) => {
            this.terms.push(item.term.toLowerCase());
          });
        } else {
          chatStoreService.sessionContext!.transactionContext!.timeDepositTerms =
            undefined;
        }
        nextAction = this.findNextStep();
        break;
      case "balances":
        if (message.parameters.success) {
          chatStoreService.sessionContext!.transactionContext!.balanceAmounts =
            message.parameters.balances;
        } else {
          chatStoreService.sessionContext!.transactionContext!.balanceAmounts =
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
          playAudioOnly: true,
        };
        break;
    }

    if (nextAction.actionType === "AtmInteraction") {
      chatStoreService.setPlayAudioOnly(true);
    } else {
      chatStoreService.setPlayAudioOnly(false);
    }
    return nextAction;
  }

  async processText(text: string): Promise<ChatbotAction> {
    myLoggerService.log("TimeDepositTxProcessor: processText: " + text);

    const txSchema = getTimeDepositPromptSchema();
    const confirmSchema = getConfirmationPromptSchema();

    const req = {
      text: text,
      instruction:
        this.promptStage === "confirmation"
          ? confirmSchema.instruction
          : txSchema.instruction,
      schema:
        this.promptStage === "confirmation"
          ? confirmSchema.schema
          : txSchema.schema,
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
        if (txData.term)
          chatStoreService.sessionContext!.transactionContext!.selectedTimeDepositTerm =
            extractDepositTerm(txData.term, this.terms);
        if (txData.confirm)
          chatStoreService.sessionContext!.transactionContext!.customerConfirmed =
            true;
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
    this.promptStage = "transaction";
    const nextAction: ChatbotAction = {
      actionType: "ContinueTransaction",
      prompt: [],
    };

    this.currentStep = 1;
    if (!chatStoreService.sessionContext!.transactionContext?.selectedAccount) {
      nextAction.prompt = [translate("deposit from account")];
      nextAction.prompt.push(translate("supported accounts") + ":");
      chatStoreService.sessionContext.accounts?.map((item) => {
        nextAction.prompt?.push(translate(item.toLowerCase()));
      });
      return nextAction;
    }

    this.currentStep = 2;
    if (!chatStoreService.sessionContext!.transactionContext.balanceAmounts) {
      nextAction.actionType = "AtmInteraction";
      nextAction.prompt = [translate("please wait")];
      nextAction.interactionMessage = {
        action: "retrieve-balance-amounts",
        parameters: {
          accountType:
            chatStoreService.sessionContext!.transactionContext.selectedAccount,
        },
      };
      return nextAction;
    }

    this.currentStep = 4;
    if (
      !chatStoreService.sessionContext!.transactionContext?.amount ||
      !chatStoreService.sessionContext!.transactionContext?.amount.currency ||
      !chatStoreService.sessionContext!.transactionContext?.amount.value
    ) {
      nextAction.prompt = [translate("deposit currency amount")];
      nextAction.prompt.push(translate("balance amounts"));
      console.log(
        chatStoreService.sessionContext!.transactionContext!.balanceAmounts
      );
      chatStoreService.sessionContext!.transactionContext!.balanceAmounts.map(
        (item) => {
          if (item.value! > 0) {
            nextAction.prompt?.push(
              myFormatorService.numberWithCommas(item.value!.toString()) +
                " " +
                item.currency
            );
          }
        }
      );
      return nextAction;
    }

    this.currentStep = 5;
    if (!chatStoreService.sessionContext!.transactionContext?.amount.currency) {
      nextAction.prompt = [translate("deposit currency")];
      nextAction.prompt.push(translate("supported currencies") + ":");
      chatStoreService.supportedDepositTerms?.map((item) => {
        nextAction.prompt?.push(translate(item.toLowerCase()));
      });
      return nextAction;
    }

    this.currentStep = 6;
    if (!chatStoreService.sessionContext!.transactionContext?.amount.value) {
      nextAction.prompt = [translate("deposit amount")];
      return nextAction;
    }

    this.currentStep = 7;
    if (!chatStoreService.sessionContext!.transactionContext.timeDepositTerms) {
      nextAction.actionType = "AtmInteraction";
      nextAction.interactionMessage = {
        action: "retrieve-time-deposit-term",
      };
      return nextAction;
    }

    this.currentStep = 8;
    if (!chatStoreService.sessionContext!.transactionContext?.amount.currency) {
      nextAction.prompt = [translate("deposit currency")];
      return nextAction;
    }

    this.currentStep = 9;
    if (
      !chatStoreService.sessionContext!.transactionContext
        ?.selectedTimeDepositTerm
    ) {
      nextAction.prompt = [translate("deposit term interest")];
      nextAction.prompt.push(
        translate("deposit term") + " " + translate("interest")
      );
      chatStoreService.sessionContext!.transactionContext.timeDepositTerms.forEach(
        (item) => {
          nextAction.prompt?.push(
            translate(item.term) + " :         " + item.interestPercentage + "%"
          );
        }
      );
      return nextAction;
    }
    this.currentStep = 10;
    if (
      !chatStoreService.sessionContext!.transactionContext?.customerConfirmed
    ) {
      nextAction.prompt = [translate("confirm transaction")];
      nextAction.prompt.push(
        myFormatorService.numberWithCommas(
          chatStoreService.sessionContext!.transactionContext.amount.value.toString()
        ) +
          " " +
          chatStoreService.sessionContext!.transactionContext.amount.currency
      );
      nextAction.prompt.push(
        translate(
          chatStoreService.sessionContext.transactionContext!
            .selectedTimeDepositTerm
        )
      );
      this.promptStage = "confirmation";
      return nextAction;
    }

    this.currentStep = 11;
    if (!chatStoreService.sessionContext!.transactionContext.executeCompleted) {
      nextAction.actionType = "AtmInteraction";
      nextAction.prompt = [translate("transaction progressing")];
      nextAction.interactionMessage = {
        action: "time-deposit",
        parameters: {
          currency:
            chatStoreService.sessionContext.transactionContext!.amount!
              .currency,
          amount:
            chatStoreService.sessionContext.transactionContext!.amount!.value,
          accountType:
            chatStoreService.sessionContext!.transactionContext.selectedAccount,
          receiptRequested: true,
          term: 3,
        },
      };
      return nextAction;
    }

    return nextAction;
  }
}
