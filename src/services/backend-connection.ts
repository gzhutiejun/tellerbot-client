
import { ConnectionOptions } from "./websocket";
import { io, Socket } from "socket.io-client";

export class BackendConnectionImpl {

    private backendSocket?: Socket;
    init(opt: ConnectionOptions) {
        this.backendSocket = io(opt.wsUrl);
        this.backendSocket.connect();
    }

    register(messageType: string, handler: any) {
        this.backendSocket?.on(messageType, handler);
    }

   
    send(messageType: string, message: any) {
        this.backendSocket?.emit(messageType, message);
    }
}

const myBackendConnection: BackendConnectionImpl = new BackendConnectionImpl();
export { myBackendConnection  };