
import { ConnectionOptions, WebSocketConnectionImpl } from "./websocket";



export class BackendConnectionImpl {
    private connection!: WebSocketConnectionImpl;
    opt: ConnectionOptions | undefined;


    init(opt: ConnectionOptions) {
        this.opt = opt;
    }
    onMessage = (strMsg: string) => {
        const message = JSON.parse(strMsg);

        if (message) {
           console.log("message received",message);
        }
    };
    async connect() {
        try {
            this.connection = new WebSocketConnectionImpl({ ...this.opt!, onMessage: this.onMessage });
            return true;
        } catch (e) {
            console.log("connect, url = " + this.opt?.wsUrl);
            console.log(e + " ");
        }
        return false;
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

const myBackendConnection: BackendConnectionImpl = new BackendConnectionImpl();
export { myBackendConnection  };