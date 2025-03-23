/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTransactionProcessor, playAudio, replayAudio } from "../util/util";
import { myATMServiceAgent } from "./atm-service-agent";
import { chatStoreService } from "./chat-store.service";
import { myChatbotServiceAgent } from "./chatbot-service-agent";
import { myLoggerService } from "./logger.service";
import {
  ChatbotAction, IProcessor,
  TransactionName
} from "./processors/processor.interface";
import { SessionProcessor } from "./processors/session-processor";
import { ConnectionOptions } from "./websocket";

export enum Stage {
  idle = 1,
  session = 2,
  transaction = 3,
}
export class MainProcessor {
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
  private maxListenTime = 20000;
  private listenTimer: number = 0;

  currentAction: ChatbotAction = {
    actionType: "Idle",
  };
  sessionProcessor?: IProcessor;
  transactionProcessor?: IProcessor;
  constructor() {}

  /**
   * Init worker service, create connections with ATM and Chatbot Service
   * Report ai-teller-ready event to inform ATM that session is ready
   */
  async init(atmUrl: string, chatbotUrl: string) {
    myLoggerService.log(`atmUrl ${atmUrl} chatbotUrl ${chatbotUrl}`);

    this.atmConnectionOption = {
      webApiUrl: atmUrl,
    };

    // Establish Backend connection
    this.chatbotConnectionOption = {
      webApiUrl: chatbotUrl,
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
    chatStoreService.setDebugMode(this.debugMode);

    chatStoreService.registerAudioPlayCompleteHandler(this.startListening);
    chatStoreService.registerCancelHandler(this.cancelHandler);

    await myATMServiceAgent.connect();

    myATMServiceAgent.registerMessageHandler(this.atmMessageHandler);

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
        const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
        // const audioUrl = URL.createObjectURL(audioBlob);
        // const audio = new Audio(audioUrl);
        // audio.play();
        this.audioChunks = [];

        const formData = new FormData();
        formData.append("file", audioBlob);
        chatStoreService.setStatus("Thinking...");
        myLoggerService.log("upload audio file");
        const uploadResult = await myChatbotServiceAgent?.upload(formData);

        if (
          uploadResult &&
          uploadResult.responseMessage &&
          uploadResult.responseMessage.file_path
        ) {
          this.lastAudioPath = uploadResult.responseMessage.file_path;
          myLoggerService.log("uploaded file:" + this.lastAudioPath);

          const data = {
            session_id: chatStoreService.sessionContext.sessionId,
            file_path: this.lastAudioPath,
          };

          myLoggerService.log("transcribe");
          const transcribeResult = await myChatbotServiceAgent?.transcribe(
            JSON.stringify(data)
          );
          chatStoreService.setStatus("");
          myLoggerService.log("transcribe complete");
          if (
            transcribeResult &&
            transcribeResult.responseMessage &&
            transcribeResult.responseMessage.transcript
          ) {
            this.processTranscript(transcribeResult.responseMessage.transcript);
          }
        } else {
          myLoggerService.log("upload file failed");
        }
      }
    };

    this.mediaRecorder?.start(100); // interval for trigger ondataavailable event
    setTimeout(() => {
      this.startSilenceDetection();
    }, 2000);
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
    // console.log("volume, silenceThreshold, silenceStart", volume, this.silenceThreshold, this.silenceStart);
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

  private cancelHandler = () => {
    try {
      myATMServiceAgent?.send({
        action: "close-session",
      });
      myChatbotServiceAgent?.closesession(
        JSON.stringify({
          session_id: chatStoreService.sessionContext.sessionId,
        })
      );
    } catch (error) {
      myLoggerService.log("error when close session");
    }

    chatStoreService.resetSessionContext();
  };
  private atmMessageHandler = (message: string) => {
    myLoggerService.log("message received from ATM: " + message);
    const atmMessage = JSON.parse(message);
    if (atmMessage.action) {
      switch (atmMessage.action) {
        case "open-session":
          this.startSession();
          break;
        case "close-session":
          this.clearSessionData();
          this.stopRecording();
          myChatbotServiceAgent?.closesession(
            JSON.stringify({
              session_id: chatStoreService.sessionContext.sessionId,
            })
          );
          myATMServiceAgent?.send({
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
    this.sessionProcessor = undefined;
    this.transactionProcessor = undefined;
  }

  private async startSession() {
    myLoggerService.log("startSession");
    this.clearSessionData();
    this.currentAction.actionType = "NewSession";

    this.sessionProcessor = new SessionProcessor();

    chatStoreService.chatbotUrl = this.chatbotConnectionOption!.webApiUrl!;
    this.sessionProcessor.start();
  }
  private startListening = () => {
    myLoggerService.log("startListening");
    this.startRecording();
  };

  private async processTranscript(user_text: string) {
    myLoggerService.log(`processTranscript: ${user_text}`);

    if (!chatStoreService.sessionContext.sessionId) return;

    chatStoreService.setCustomerMessage(user_text);
    myLoggerService.log(
      "processTranscript currentAction1:" + JSON.stringify(this.currentAction)
    );

    switch (this.currentAction.actionType!) {
      case "Repeat":
      case "NewSession":
      case "ContinueSession":
        this.currentAction = await this.sessionProcessor!.process(user_text)!;
        myLoggerService.log(
          "processTranscript currentAction2:" +
            JSON.stringify(this.currentAction)
        );

        if (this.currentAction.actionType === "Cancel") {
          this.cancelHandler();
        } if (this.currentAction.actionType === "Repeat") {
          replayAudio();
        } else if (this.currentAction.actionType === "ContinueSession") {
          await playAudio(this.currentAction!.prompt!);
        } else if (this.currentAction.actionType === "NewTransaction") {
          this.transactionProcessor = createTransactionProcessor(
            chatStoreService.sessionContext!.transactionContext!.currentTransaction! as TransactionName
          );
          this.currentAction = {
            actionType: "ContinueTransaction",
          }
          this.transactionProcessor?.start();
        }
        break;
      case "Cancel":
        this.cancelHandler();
        break;
      case "ContinueTransaction":
        this.currentAction = await this.transactionProcessor!.process(user_text)!;
        myLoggerService.log(
          "processTranscript currentAction3:" +
            JSON.stringify(this.currentAction)
        );

        if (this.currentAction.actionType === "Cancel") {
          this.cancelHandler();
        } else if (this.currentAction.actionType === "ContinueTransaction") {
          await playAudio(this.currentAction!.prompt!);
        } else if (this.currentAction.actionType === "EndTransaction") {
          chatStoreService.resetTransactionContext();
          this.transactionProcessor = undefined;
          this.sessionProcessor?.start();
        }
        break;
      case "EndTransaction":
        chatStoreService.resetTransactionContext();
        this.transactionProcessor = undefined;
        this.sessionProcessor?.start();
        break;
      default:
        myLoggerService.log("Invalid Action");
        break;
    }
  }
}

const mainProcessor: MainProcessor = new MainProcessor();
export { mainProcessor };
