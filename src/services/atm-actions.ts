/* eslint-disable @typescript-eslint/no-explicit-any */
import { myATMConnection } from "./atm-service-agent";
import { myLoggerService } from "./logger.service";

export const noteMixAction = (data: any) => {
    myLoggerService.log('note-mix', data);

    const formattedData = {
        action: data.action,  
        parameters: {
            currency: data.parameters.currency,  
            amount: data.parameters.amount        
        }
    };


    myATMConnection.send(JSON.stringify(formattedData));
}
export const  cashWithdrawalAction = (data: any) => {

    const formattedData = {
        action: data.action,  
        parameters: {
            currency: data.parameters.currency,  
            amount: data.parameters.amount,      
            accountType: data.parameters.accountType,  
            receiptRequested: data.parameters.receiptRequested 
        }
    };

    myATMConnection.send(JSON.stringify(formattedData));
}

export const closeSessionAction = (data: any) => {
    myLoggerService.log(data);
    const messageToSend = {
        action: "close-session",
        parameters: {
            reason: "completed"  
        }
    };

    myATMConnection.send(JSON.stringify(messageToSend));
}

