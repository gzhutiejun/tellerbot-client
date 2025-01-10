/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConnectionOptions } from "./websocket";


export class BackendConnectionImpl {

    init(opt: ConnectionOptions) {

    }

    register(messageType: string, handler: any) {
        console.log("register message handler",messageType);
    }

   
    send(messageType: string, message: any) {
        console.log("send message to backend", messageType, message);

    }
}

const myBackendConnection: BackendConnectionImpl = new BackendConnectionImpl();
export { myBackendConnection  };