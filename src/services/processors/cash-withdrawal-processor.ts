import { speak } from "../../util/util";
import { chatStoreService } from "../chat-store.service";
import { myChatbotServiceAgent } from "../chatbot-service-agent";
import { myLoggerService } from "../logger.service";
import { ChatbotAction, IProcessor } from "./processor.interface";

export class CashWithdrawalTxProcessor implements IProcessor {
  chatbotWebUrl: string = "";
  private dataTemplate = {
    amoount: 0,
    currency: "",
    account: "",
  };
  constructor() {
    myLoggerService.log("create Cash Withdrawal Processor");
  }
  async start() {
    myLoggerService.log("CashWithdrawalTxProcessor: start");
    const nextAction: ChatbotAction = this.findNextStep();
    if (nextAction.actionType === "ContinueTransaction") {
      speak(nextAction.prompt!);
    } else {
      myLoggerService.log("Invalid action");
    }
  }
  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("CashWithdrawalTxProcessor: process: " + text);

    const req = {
      text: text,
      instruction: "extract amount or number as amount, currency, and account.",
      format: this.dataTemplate,
    };

    const res = await myChatbotServiceAgent.extract(JSON.stringify(req));
    myLoggerService.log(res);

    if (!res || !res.success) {
      this.findNextStep();
      return {
        actionType: "ContinueTransaction",
        prompt: [],
      };
    }

    const nextAction: ChatbotAction = {
      actionType: "ContinueTransaction",
      prompt: [],
    };

    return nextAction;
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
    if (!chatStoreService.sessionContext!.transactionContext?.selectedAccount) {
      nextAction.prompt = [
        "Which account do you want to withdrawal money from?",
      ];
      return nextAction;
    }

    //step 3
    if (!chatStoreService.sessionContext!.transactionContext?.amount) {
      nextAction.prompt = [
        "Which currency and how much money you want to withdraw",
      ];
      return nextAction;
    }

    //step 4
    if (!chatStoreService.sessionContext!.transactionContext?.amount.currency) {
      nextAction.prompt = ["Which currency do you want to withdraw"];
      return nextAction;
    }
    //step 5
    if (!chatStoreService.sessionContext!.transactionContext?.amount.value) {
      nextAction.prompt = ["How much do you want to withdraw"];
      return nextAction;
    }
    return nextAction;
  }
}
