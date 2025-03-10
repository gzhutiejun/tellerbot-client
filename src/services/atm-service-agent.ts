/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConnectionOptions, WebSocketConnectionImpl } from "./websocket";



export class AtmServiceAgent {
    private connection!: WebSocketConnectionImpl;
    private messageReceivedHandler?: any;
    opt: ConnectionOptions | undefined;


    init(opt: ConnectionOptions) {
        this.opt = opt;
    }
    onMessage = (strMsg: string) => {
        console.log("message received", strMsg);
        this.messageReceivedHandler(strMsg);
    };
    async connect() {
        console.log("connect ATM");
        try {
            this.connection = new WebSocketConnectionImpl({ ...this.opt!, onMessage: this.onMessage });
            return true;
        } catch (e) {
            console.log("connect, url = " + this.opt?.wsUrl);
            console.log(e + " ");
        }
        return false;
    }

    register(handler: any) {
        console.log("register ATM message handler");
        this.messageReceivedHandler = handler;
    }

    send(message: any) {
        try {
            if (message) {
                console.log("send message to external application: " + JSON.stringify(message));
                this.connection.send(message);
            }
        } catch (e) {
            console.log(e + " ");
        }
    }
}

const myATMServiceAgent: AtmServiceAgent = new AtmServiceAgent();
export { myATMServiceAgent };