import { extractAccount, extractCurrency, playAudio } from "../../util/util";
import { ExtractResponse } from "../bus-op.interface";
import { chatStoreService } from "../chat-store.service";
import { myChatbotServiceAgent } from "../chatbot-service-agent";
import { myLoggerService } from "../logger.service";
import { ChatbotAction, IProcessor } from "./processor.interface";

export class CashWithdrawalTxProcessor implements IProcessor {
  private lastStep = -1;
  private currentStep = -1;
  private template = {
    currency: "",
    amount: 0,
    cancel: false,
  };

  constructor() {
    myLoggerService.log("create Cash Withdrawal Processor");
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
  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("CashWithdrawalTxProcessor: process: " + text);
    console.log(chatStoreService.sessionContext!.transactionContext);
    const req = {
      text: text,
      instruction: "extract amount or number as amount, currency, and account.",
      format: this.template,
    };

    const res: ExtractResponse = await myChatbotServiceAgent.extract(
      JSON.stringify(req)
    );
    myLoggerService.log(res);

    try {
      if (res && res.data && res.data.data) {
        const txData = JSON.parse(res.data.data);
        if (txData.cancel) {
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
      }
    } catch (e) {
      console.log("extract:", e);
      return { actionType: "Repeat" };
    }

    const action: ChatbotAction = this.findNextStep();
    if (
      action.actionType === "ContinueTransaction" &&
      this.currentStep === this.lastStep
    ) {
      action.actionType = "Repeat";
    }
    this.lastStep = this.currentStep;

    return action;
  }

  private findNextStep(): ChatbotAction {
    myLoggerService.log("findNextStep");
    // step 1
    myLoggerService.log(
      "sessionContext: " + JSON.stringify(chatStoreService.sessionContext)
    );
    const nextAction: ChatbotAction = {
      actionType: "ContinueTransaction",
      prompt: [],
    };

    //step 1
    this.currentStep = 1;
    if (
      !chatStoreService.sessionContext!.transactionContext?.selectedAccount &&
      !chatStoreService.sessionContext!.transactionContext?.amount
    ) {
      nextAction.prompt = [
        "Please tell which currency, how much money you want to withdraw and from which account.",
        "We can provide Hong Kong dollars and US dollars.",
      ];
      return nextAction;
    }

    //step 2
    this.currentStep = 2;
    if (!chatStoreService.sessionContext!.transactionContext?.selectedAccount) {
      nextAction.prompt = [
        "Which account do you want to withdrawal money from?",
      ];
      return nextAction;
    }

    //step 3
    this.currentStep = 3;
    if (!chatStoreService.sessionContext!.transactionContext?.amount) {
      nextAction.prompt = [
        "Which currency and how much money you want to withdraw",
      ];
      return nextAction;
    }

    //step 4
    this.currentStep = 4;
    if (!chatStoreService.sessionContext!.transactionContext?.amount.currency) {
      nextAction.prompt = ["Which currency do you want to withdraw"];
      return nextAction;
    }

    //step 5
    this.currentStep = 5;
    if (!chatStoreService.sessionContext!.transactionContext?.amount.value) {
      nextAction.prompt = ["How much do you want to withdraw"];
      return nextAction;
    }
    return nextAction;
  }
}
