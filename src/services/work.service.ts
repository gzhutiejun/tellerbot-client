/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { myATMServiceAgent } from "./atm-service-agent";
import { myChatbotServiceAgent } from "./chatbot-service-agent";
import { ConnectionOptions } from "./websocket";

export class WorkerService {
  private mediaStream?: MediaStream;
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private debugMode = true;
  private atmConnectionOption?: ConnectionOptions;
  private atmConnected = false;
  private chatbotServerConnected = false;
  private chatbotConnectionOption?: ConnectionOptions;
  constructor() {}

  async init() {
    this.atmConnectionOption = {
      webApiUrl: "http:127.0.0.1:15206",
    };

    // Establish Backend connection
    this.chatbotConnectionOption = {
      wsUrl: "",
      webApiUrl: "http://127.0.0.1:8000",
    };

    if (this.chatbotConnectionOption.webApiUrl!.endsWith("/")) {
      this.chatbotConnectionOption.webApiUrl!.slice(0, -1);
    }
    myChatbotServiceAgent.init(this.chatbotConnectionOption);

    this.chatbotServerConnected = await myChatbotServiceAgent.connect();

    if (!this.chatbotServerConnected) {
      console.log("Chatbot service is not connected.");
    }

    if (!this.debugMode) {
      myATMServiceAgent.init(this.atmConnectionOption);
      this.atmConnected = await myATMServiceAgent.connect();
    }

    if (this.atmConnected && this.chatbotServerConnected) {
      // report ai-teller ready to ATM
      myATMServiceAgent.send({
        event: "ai-teller-ready",
      });
    }

    const audioEnabled = await this.enableAudio();
    if (audioEnabled) {
        this.startRecording();
    }
  }

  startRecording() {
    if (this.mediaRecorder) {
      console.log("start recording...", this.mediaRecorder.state);
      this.mediaRecorder.start(300);
      console.log("mediaRecorder status", this.mediaRecorder.state);
    } else {
      console.log("mediaRecorder is not created");
      return;
    }

    setTimeout(() => {
      this.mediaRecorder?.stop();
    },2000);
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
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = undefined;
  }

  private async enableAudio(): Promise<boolean> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    if (this.mediaStream) {
      console.log("mediaStream")
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
    } else {
      console.log("mediaStream is not created");
      return false;
    }

    if (!this.mediaRecorder) {
      console.log("mediaRecorder is not created");
      return false;
    }

    this.mediaRecorder.onstop = () => {
      //    const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
      //   const audioUrl = URL.createObjectURL(audioBlob);
      //   const audio = new Audio(audioUrl);
      //   audio.play();

      const audioBlob = new Blob(this.audioChunks);
      const formData = new FormData();
      formData.append("file",audioBlob);
      myChatbotServiceAgent.upload(formData)
      //   const fileReader = new FileReader();
      //   fileReader.readAsDataURL(audioBlob);
      //   fileReader.onloadend = () => {
      //       const base64Audio = (fileReader!.result! as string).split(',')[1];
      //       console.log("base64Audio", base64Audio);
      //   };
    };

    this.mediaRecorder.ondataavailable = (e) => {
      this.audioChunks.push(e.data);
    };

    return true;
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
  };
}

const myWorkerService: WorkerService = new WorkerService();
export { myWorkerService };
