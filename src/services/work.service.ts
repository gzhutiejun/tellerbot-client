/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { myATMConnection } from "./atm-connection";
import { myBackendConnection } from "./backend-connection";
import { ConnectionOptions } from "./websocket";

export class WorkerService {
    private mediaStream?: MediaStream;
    private mediaRecorder?: MediaRecorder;
    private audioChunks: Blob[] = [];

    constructor() { }

    async init() {

        // Establish Backend connection
        const backendConnectionOption: ConnectionOptions = {
            wsUrl: "",
            webApiUrl: "http://127.0.0.1:8000"
        };
        myBackendConnection.init(backendConnectionOption);

        myBackendConnection.register("note-mix", this.noteMixHandler);
        myBackendConnection.register("cash-withdrawal", this.cashWithdrawalHandler);
        myBackendConnection.register("close-session", this.closeSessionHandler);
        const connected = await myBackendConnection.connect();
 
        if (connected) {
            myBackendConnection.send("hello");
        }
        // myATMConnection.init(atmConnectionOption);
        // myATMConnection.connect();


        myATMConnection.register(this.clientHandler);

        // report ai-teller ready to ATM
        const msg = {
            "event": "ai-teller-ready"
        }
        // setTimeout(() => {
        //     myATMConnection.send(msg);
        // }, 1000);

        this.enableAudio();
    }

    private noteMixHandler = (data: any) => {
        console.log('note-mix', data);

        const formattedData = {
            action: data.action,  
            parameters: {
                currency: data.parameters.currency,  
                amount: data.parameters.amount        
            }
        };


        myATMConnection.send(JSON.stringify(formattedData));
    }
    private cashWithdrawalHandler = (data: any) => {

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

    private closeSessionHandler = (data: any) => {
        console.log(data);
        const messageToSend = {
            action: "close-session",
            parameters: {
                reason: "completed"  
            }
        };

        myATMConnection.send(JSON.stringify(messageToSend));
    }


    startRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.start();
        } else {
            console.log("mediaRecorder is not created");
            return;
        }
        
    }

    stopRecording() {    
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        } else {
            console.log("mediaRecorder is not created");
            return;
        }
    }

    disableAudio() {
        this.mediaRecorder?.stop();
        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.mediaStream = undefined;
    }
    private async enableAudio() {

        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        if (this.mediaStream) {
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
        }
        else {
            console.log("mediaStream is not created");
            return;
        }

        if (!this.mediaRecorder) {
            console.log("mediaRecorder is not created");
            return;
        }

        this.mediaRecorder.stop();

        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
      
            // const audioBlob = new Blob(this.audioChunks);
            // const reader = new FileReader();
            // reader.readAsDataURL(audioBlob);
            // reader.onloadend = () => {
            //     const base64Audio = (reader!.result! as string).split(',')[1];
            //     console.log(base64Audio);
            // };

        }

        this.mediaRecorder.ondataavailable = (e) => {
            this.audioChunks.push(e.data);
        };
    }

    private clientHandler = (message: string) => {
        console.log("message received from ATM", message);
        const atmMessage = JSON.parse(message);
        if (atmMessage.action) {
            switch (atmMessage.action) {
                case "open-session":
                    // speak for start conversation.

                    this.startRecording();
                    break;
                case "close-session":
                    break;
                default:
                    break;
            }
        } else if (atmMessage.event) {
            switch (atmMessage.event) {
                case "notification":
                    break;
                default:
                    break;
            }
        }
    }
}

const myWorkerService: WorkerService = new WorkerService();
export { myWorkerService };