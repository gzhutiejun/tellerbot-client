import { myLoggerService } from "../logger.service";
import { Action, IProcessor } from "./processor.interface";

export class WithdrawalTxProcessor implements IProcessor {
  constructor() {
    myLoggerService.log("create Session Processor");
  }

  process(text: string): Action {
    myLoggerService.log("process:" + text);
    let nextAction: Action = {
      actionType: "Continue",
      prompt: {},
    };

    return nextAction;
  }
}
