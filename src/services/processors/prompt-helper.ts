/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatStoreService } from "../chat-store.service";
export interface IPromptSchema {
  schema: any;
  instruction: string;
}

export function getSessionPromptSchema(): IPromptSchema {
  let txNames = "";
  chatStoreService.sessionContext!.supportedTransactons!.map((item) => {
    txNames += item + ",";
  });
  const instruction = `extract transaction (e.g. ${txNames}), extract cancel (e.g. cancel, exit, no need)`;

  return {
    instruction: instruction,
    schema: { transaction: "", cancel: false },
  };
}

export function getCashWithdrawalPromptSchema(): IPromptSchema {
  let accounts = "";
  chatStoreService.sessionContext!.accounts!.map((item) => {
    accounts += item.toLowerCase() + ",";
  });

  let currencies = "";
  chatStoreService.supportedWithdrawalCurrencies!.map((item) => {
    currencies += item + ",";
  });

  const instruction = `extract currency (e.g. ${currencies}), extract amount or number as amount, extract account (e.g. ${accounts}, check, checking), extract cancel (e.g. cancel, exit, no need)`;

  return {
    instruction: instruction,
    schema: {
      currency: "",
      amount: 0,
      cancel: false,
      account: "",
    },
  };
}

export function getTimeDepositPromptSchema(): IPromptSchema {
  let accounts = "";
  chatStoreService.sessionContext!.accounts!.map((item) => {
    accounts += item + ",";
  });

  let terms = "";
  chatStoreService.supportedDepositTerms!.map((item) => {
    terms += item + ",";
  });

  let currencies = "";
  chatStoreService.supportedDepositCurrencies!.map((item) => {
    currencies += item + ",";
  });

  const instruction = `extract currency (e.g. ${currencies}), extract amount or number as amount, extract account (e.g. ${accounts}, check, checking), extract term (e.g. ${terms}), extract cancel (e.g. cancel, exit, no need)`;

  return {
    instruction: instruction,
    schema: {
      currency: "",
      amount: 0,
      cancel: false,
      account: "",
      term: "",
    },
  };
}

export function getConfirmationPromptSchema(): IPromptSchema {
  return {
    instruction:
      "extract confirm (e.g. confirm, continue, yes), extract cancel (e.g. cancel, no)",
    schema: { confirm: false, cancel: false },
  };
}
