
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
export interface ITransactionContext {
    amount?: IAmount;
    currentTransaction?: string;
    balanceAmounts?: IBalanceAmount[];
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
    
  }
  
  export interface ISessionContext {
    accounts?: string[];
    sessionId?: string;
    mobileNumber?: string;
    transactionContext?: ITransactionContext
  }