import { myLoggerService } from "../logger.service";
import { ChatbotAction, IProcessor } from "./processor.interface";

export class SessionProcessor implements IProcessor {
  constructor() {
    myLoggerService.log("create Session Processor");
  }
  async start(): Promise<ChatbotAction> {
    myLoggerService.log("start Session Processor");
    const nextAction: ChatbotAction = {
      actionType: "Continue",
      prompt: {
        messages: ["what services do you need?"],
      },
    };

    return nextAction;
  }

  async process(text: string): Promise<ChatbotAction> {
    myLoggerService.log("process:" + text);
    const nextAction: ChatbotAction = {
      actionType: "Continue",
      prompt: {
        messages: ["what services do you need?"],
      },
    };

    return nextAction;
  }
}
