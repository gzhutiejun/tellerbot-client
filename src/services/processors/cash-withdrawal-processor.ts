import { myLoggerService } from "../logger.service";
import { ChatbotAction, IProcessor } from "./processor.interface";

export class CashWithdrawalTxProcessor implements IProcessor {
  chatbotWebUrl: string = "";
  constructor() {
    myLoggerService.log("create Cash Withdrawal Processor");
  }
  async start() {
    myLoggerService.log("CashWithdrawalTxProcessor: start");
  }
  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("CashWithdrawalTxProcessor: process: " + text);
    const nextAction: ChatbotAction = {
      actionType: "Continue",
      prompt: {},
    };

    return nextAction;
  }
}
