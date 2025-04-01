
export interface IAmount {
    value?: number;
    currency?: string;
}
export interface IBalanceAmount {
    balanceType?: string;
    amount?: IAmount;
}
export interface IFee {
    type: string;
    amount: IAmount;
}
export interface Term {
    term: string;
    interest: number;
    interestPercentage: number
}
export interface ITransactionContext {
    amount?: IAmount;
    currentTransaction?: string;
    balanceAmounts?: IAmount[];
    transactionFee?: IFee;
    acceptFee?: boolean;
    selectedAccount?: string;
    selectedDestAccount?: string;
    accountNumber?: string;
    destAccountNumber?: string;
    destAccount?: string;
    receiptRequested?: boolean;
    depositTenor?: string;
    depositInterestRate?: number;
    noteMixPerformed?: boolean;
    executeCompleted?: boolean;
    timeDepositTerms?: Term[];
    selectedTimeDepositTerm?: string;
    customerConfirmed?: boolean;
  }
  
  export interface ISessionContext {
    accounts?: string[];
    sessionId?: string;
    mobileNumber?: string;
    transactionContext?: ITransactionContext;
    supportedTransactons?: string[];

  }