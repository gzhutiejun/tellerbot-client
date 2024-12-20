import { myATMConnection } from "./services/atm-connection";
import { ConnectionOptions } from "./services/websocket";

async function main() {


    //Establish Backend connection
    // const backendConnectionOption: ConnectionOptions = {
    //     wsUrl: "ws://backend.com",
    //     webApiUrl: ""
    // };
    // myBackendConnection.init(backendConnectionOption);
    // myBackendConnection.connect();

    //Establish ATM connection
    const atmConnectionOption: ConnectionOptions = {
        wsUrl: "ws://localhost:19500/atm-server",
        webApiUrl: ""
    };
    myATMConnection.init(atmConnectionOption);
    myATMConnection.connect();
    const msg = {
        "event": "ai-teller-ready"
    }
    setTimeout(() => {
        myATMConnection.send(msg);
    },2000);
   

}

main();