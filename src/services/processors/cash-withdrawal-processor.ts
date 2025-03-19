import { myLoggerService } from "../logger.service";
import { ChatbotAction, IProcessor } from "./processor.interface";

export class CashWithdrawalTxProcessor implements IProcessor {
  constructor() {
    myLoggerService.log("create Cash Withdrawal Processor");
  }
  async start(): Promise<ChatbotAction> {
    myLoggerService.log("start Cash Withdrawal Processor");
    const nextAction: ChatbotAction = {
      actionType: "Continue",
      prompt: {},
    };

    return nextAction;
  }
  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("process:" + text);
    const nextAction: ChatbotAction = {
      actionType: "Continue",
      prompt: {},
    };

    return nextAction;
  }
}
