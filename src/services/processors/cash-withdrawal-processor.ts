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
  }
  constructor() {
    myLoggerService.log("create Cash Withdrawal Processor");
  }
  async start() {
    myLoggerService.log("CashWithdrawalTxProcessor: start");
    this.findNextStep();
  }
  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("CashWithdrawalTxProcessor: process: " + text);
    
    const req = {
      text: text,
      instruction:
        "extract amount or number as amount, currency, and account.",
      format: this.dataTemplate,
    };

    const res = await myChatbotServiceAgent.extract(JSON.stringify(req));
    myLoggerService.log(res);

    const nextAction: ChatbotAction = {
      actionType: "ContinueTransaction",
      prompt: [],
    };

    return nextAction;
  }

  private async findNextStep() {
    // step 1
    myLoggerService.log("sessionContext: " + JSON.stringify( chatStoreService.sessionContext));
    if (
      !chatStoreService.sessionContext!.transactionContext?.selectedAccount &&
      !chatStoreService.sessionContext!.transactionContext?.amount
    ) {
      const prompts: string[] = [
        "Please tell what currency, how much money you want to withdraw and from which account.",
        "We can provide Hong Kong dollars and US dollars.",
      ];
      speak(prompts);
      return;
    }
  }
}
