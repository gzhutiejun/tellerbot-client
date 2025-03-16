/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { myATMServiceAgent } from "./atm-service-agent";
import { chatStoreService } from "./chat-store.service";
import { myChatbotServiceAgent } from "./chatbot-service-agent";
import { myLoggerService } from "./logger.service";
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

  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;

  private bufferLength: number = 0;
  private dataArray?: Float32Array;
  private silenceTimer: number = 0;
  private silenceStart?: number = undefined;
  private silenceThreshold = -35;
  private silenceTimeout = 2000;
  private lastAudioPath = "";
  private maxListenTime = 30000;
  private listenTimer: number = 0;

  constructor() {}

  /**
   * Init worker service, create connections with ATM and Chatbot Service
   * Report ai-teller-ready event to inform ATM that session is ready
   */
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
      myLoggerService.log("Chatbot service is not connected.");
    }

    myATMServiceAgent.init(this.atmConnectionOption);
    myATMServiceAgent.registerMessageHandler(this.atmMessageHandler);
    chatStoreService.setDebugMode(this.debugMode);
    if (!this.debugMode) {
      this.atmConnected = await myATMServiceAgent.connect();
    }

    if (this.atmConnected && this.chatbotServerConnected) {
      // report ai-teller ready to ATM
      myATMServiceAgent.send({
        event: "ai-teller-ready",
      });
    }
  }

  /**
   * startRecording, it enable microphone and start recording
   * when customer voice is recorded, upload the audio file to service for further processing.
   * @returns
   */
  async startRecording() {
    myLoggerService.log("startRecording");
    this.audioChunks = [];

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    chatStoreService.setStatus("Listening...");
    chatStoreService.setMic(true);

    this.listenTimer = window.setTimeout(() => {
      this.stopRecording();
    }, this.maxListenTime);

    if (this.mediaStream) {
      myLoggerService.log("mediaStream created");
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
    } else {
      myLoggerService.log("mediaStream is not created");
      return;
    }

    if (!this.mediaRecorder) {
      myLoggerService.log("mediaRecorder is not created");
      return;
    }

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    source.connect(this.analyser);

    /**
     * ondataavailable event handler, save customer audio data to a buffer.
     */
    this.mediaRecorder.ondataavailable = (event) => {  
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    /**
     * onstop handler, collect customer audio data and upload to server
     */
    this.mediaRecorder.onstop = async () => {
      myLoggerService.log("audioChunk size:" + this.audioChunks.length);
      if (this.audioChunks.length > 0) {
        //    const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
        //   const audioUrl = URL.createObjectURL(audioBlob);
        //   const audio = new Audio(audioUrl);
        //   audio.play();

        const audioBlob = new Blob(this.audioChunks);
        const formData = new FormData();
        formData.append("file", audioBlob);
        const uploadResult = await myChatbotServiceAgent.upload(formData);
        if (uploadResult) {
          myLoggerService.log(
            "upload Response:" + JSON.stringify(uploadResult)
          );
        }

        if (
          uploadResult &&
          uploadResult.responseMessage &&
          uploadResult.responseMessage.file_path
        ) {
          myLoggerService.log("upload audio success");
          chatStoreService.setStatus("Thinking...");
          this.lastAudioPath = uploadResult.responseMessage.file_path;
          myLoggerService.log("uploaded file:" + this.lastAudioPath);

          const downloadResult = await myChatbotServiceAgent.download(
            this.lastAudioPath
          );

          const data = {
            action: "transcribe",
            session_id: chatStoreService.sessionId,
            file_path: this.lastAudioPath,
          };
          const transcribeResult = await myChatbotServiceAgent.send(
            "transcribe",
            JSON.stringify(data)
          );
          chatStoreService.setStatus("");

          if (transcribeResult) {
            myLoggerService.log(
              "transcribe Response:" + JSON.stringify(transcribeResult)
            );
          }
          if (
            transcribeResult &&
            transcribeResult.responseMessage &&
            transcribeResult.responseMessage.transcript
          ) {
            chatStoreService.setCustomerMessage(
              transcribeResult.responseMessage.transcript
            );
          }
        } else {
          myLoggerService.log("upload file failed");
        }
      }
    };

    this.mediaRecorder?.start(200); // interval for trigger ondataavailable event
    this.startSilenceDetection();
  }

  /**
   * stopRecording, when customer complete a sentence, stop recording.
   */
  stopRecording() {
    myLoggerService.log("stopRecording: " + this.mediaRecorder?.state);
    chatStoreService.setStatus("");
    chatStoreService.setMic(false);
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = 0;
    }
  }

  private startSilenceDetection() {
    this.bufferLength = this.analyser!.frequencyBinCount;
    this.dataArray = new Float32Array(this.bufferLength);
    this.silenceStart = undefined;

    this.checkSilence();
  }

  private checkSilence = () => {
    if (!this.mediaRecorder || this.mediaRecorder.state !== "recording") return;

    this.analyser!.getFloatTimeDomainData(this.dataArray!);
    let maxVolume = -Infinity;
    for (let i = 0; i < this.bufferLength; i++) {
      maxVolume = Math.max(maxVolume, Math.abs(this.dataArray![i]));
    }

    const volume = 20 * Math.log10(maxVolume);
    if (volume < this.silenceThreshold) {
      if (!this.silenceStart) {
        this.silenceStart = Date.now();
      } else if (Date.now() - this.silenceStart >= this.silenceTimeout) {
        window.clearTimeout(this.listenTimer);
        this.stopRecording();

        return;
      }
    } else {
      this.silenceStart = undefined;
    }

    setTimeout(() => {
      this.checkSilence();
    }, 100);
  };

  private atmMessageHandler = (message: string) => {
    console.log("message received from ATM", message);
    myLoggerService.log("message received from ATM");
    const atmMessage = JSON.parse(message);
    if (atmMessage.action) {
      switch (atmMessage.action) {
        case "open-session":
          // speak for start conversation.
          this.clearSessionData();
          this.moveNext();
          break;
        case "close-session":
          this.clearSessionData();
          this.stopRecording();
          myChatbotServiceAgent.send("closesession", JSON.stringify({
            session_id: chatStoreService.sessionId,
          }));
          myATMServiceAgent.send({
            event: "session-closed",
          });
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

  private clearSessionData() {
    chatStoreService.setSessionId("");
  }
  private moveNext() {
    myLoggerService.log("start listening...");
    // this.startRecording();

    //  chatStoreService.setAudioUrl("http://127.0.0.1:8000/download/20250316_143408.mp3")

  }
}

const myWorkerService: WorkerService = new WorkerService();
export { myWorkerService };
