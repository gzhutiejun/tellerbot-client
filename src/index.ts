import { myATMConnection } from "./services/atm-connection";
import { myBackendConnection } from "./services/backend-connection";
import { ConnectionOptions } from "./services/websocket";

async function main() {

    //Establish ATM connection
    const atmConnectionOption: ConnectionOptions = {
        wsUrl: "ws://localhost:19500/atm-server",
        webApiUrl: ""
    };
    myATMConnection.init(atmConnectionOption);
    myATMConnection.connect();

    //Establish Backend connection
    const backendConnectionOption: ConnectionOptions = {
        wsUrl: "ws://backend.com",
        webApiUrl: ""
    };
    myBackendConnection.init(backendConnectionOption);
    myBackendConnection.connect();
}

main();