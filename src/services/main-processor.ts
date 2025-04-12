/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createTransactionProcessor,
  playAudio,
  repeat,
  setLanguage,
} from "../util/util";
import { myATMServiceAgent } from "./atm-service-agent";
import { TranscribeResponse, UpdateFileResponse } from "./bus-op.interface";
import { chatStoreService } from "./chat-store.service";
import { myChatbotServiceAgent } from "./chatbot-service-agent";
import { myLoggerService } from "./logger.service";
import {
  ChatbotAction,
  IProcessor,
  TransactionName,
} from "./processors/processor.interface";
import { SessionProcessor } from "./processors/session-processor";
import { ConnectionOptions } from "./websocket";
import RecordRTC, {
  RecordRTCPromisesHandler,
  StereoAudioRecorder,
} from "recordrtc";
export class MainProcessor {
  private mediaStream?: MediaStream;
  private mediaRecorder!: any;
  private audioChunks: Blob[] = [];
  private debugMode = true;
  private atmConnectionOption?: ConnectionOptions;
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
    actionType: "None",
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
    chatStoreService.resetSessionContext();

    this.atmConnectionOption = {
      wsUrl: atmUrl,
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

    chatStoreService.registerStartListeningHandler(this.startListening);
    chatStoreService.registerCancelHandler(this.cancelHandler);

    await myATMServiceAgent.connect();

    myATMServiceAgent.registerMessageHandler(this.atmMessageHandler);

    if (myATMServiceAgent.connected && this.chatbotServerConnected) {
      // report ai-teller ready to ATM
      setTimeout(() => {
        myATMServiceAgent.send({
          event: "ai-teller-ready",
        });
      }, 1000);
    }
  }

  private captureMicrophone(callback: any) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(callback)
      .catch(function (error) {
        alert("Unable to access your microphone.");
        console.error(error);
      });
  }

  stopRecordingCallback = () => {
    if (!this.mediaRecorder) return;
    const blob = this.mediaRecorder.getBlob();
    this.recognize(blob);
    const audioUrl = URL.createObjectURL(blob);
    chatStoreService.setUserAudioUrl(audioUrl);
    this.mediaRecorder.microphone.stop();
  }

  private async recognize(audioBlob: Blob) {
    console.log("recognize");
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

    // this.listenTimer = window.setTimeout(() => {
    //   // this.stopRecording();
    // }, this.silenceTimeout);

    this.captureMicrophone((microphone: any) => {
      this.mediaRecorder = new RecordRTC(microphone, {
        type: "audio",
        recorderType: StereoAudioRecorder,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
      });

      this.mediaRecorder.startRecording();
      const speechEvents = (window as any).injectAudio(microphone, {});

      speechEvents.on("speaking", () => {
        if (this.mediaRecorder?.getBlob()) return;
        clearTimeout(this.silenceTimeout);
      });

      speechEvents.on("stopped_speaking", () => {
        if (this.mediaRecorder.getBlob()) return;
        this.listenTimer = setTimeout(() => {
          this.mediaRecorder.stopRecording(this.stopRecordingCallback);
        }, this.silenceTimeout) as any;
      });
      // release microphone on stopRecording
      this.mediaRecorder.microphone = microphone;
    });

    if (!this.mediaRecorder) {
      myLoggerService.log("mediaRecorder is not created");
      return;
    }

    /**
     * onstop handler, collect customer audio data and upload to server
     */
    this.mediaRecorder.onstop = async () => {
      myLoggerService.log("audioChunk size:" + this.audioChunks.length);

      if (!chatStoreService.sessionContext!.sessionId) return;

      if (this.audioChunks.length > 0) {
        const audioBlob = new Blob(this.audioChunks);
        // const audioUrl = URL.createObjectURL(audioBlob);
        // chatStoreService.setCustomerAudioUrl(audioUrl);
        // const audio = new Audio(audioUrl);
        // audio.play();
        this.audioChunks = [];

        const formData = new FormData();
        formData.append("file", audioBlob);
        chatStoreService.setStatus("Thinking...");
        myLoggerService.log("upload audio file");
        const uploadResult: UpdateFileResponse =
          await myChatbotServiceAgent?.upload(formData);

        if (uploadResult && uploadResult.filePath) {
          this.lastAudioPath = uploadResult.filePath;
          myLoggerService.log("uploaded file:" + this.lastAudioPath);

          const data = {
            session_id: chatStoreService.sessionContext.sessionId,
            file_path: this.lastAudioPath,
            language: chatStoreService.language,
          };

          myLoggerService.log("transcribe start");
          const transcribeResult: TranscribeResponse =
            await myChatbotServiceAgent?.transcribe(JSON.stringify(data));

          chatStoreService.setStatus("");
          myLoggerService.log("transcribe complete");
          if (transcribeResult && transcribeResult.transcript) {
            this.process(transcribeResult.transcript);
          } else {
            if (!this.currentAction.playAudioOnly) {
              console.log("invalid text, listen again");
              repeat();
            }
          }
        } else {
          myLoggerService.log("upload file failed");
        }
      }
    };

    // this.mediaRecorder?.start(100); // interval for trigger ondataavailable event
    // setTimeout(() => {
    //   this.startSilenceDetection();
    // }, 2000);
  }

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
        case "end-transaction":
          this.process(atmMessage);
          break;
        case "close-session":
          this.clearSessionData();
          this.stopRecordingCallback();
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
      this.process(atmMessage);
    }
  };

  private clearSessionData() {
    chatStoreService.setSessionId("");
    this.sessionProcessor = undefined;
    this.transactionProcessor = undefined;
  }

  private anotherTransacton() {
    this.currentAction = {
      actionType: "ContinueSession",
    };
    this.transactionProcessor = undefined;
    this.sessionProcessor?.start();
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
    if (this.currentAction.actionType === "EndTransaction") {
      this.anotherTransacton();
      return;
    }
    myLoggerService.log(
      "startListening, notification:" + chatStoreService.notification
    );
    if (chatStoreService.notification) return;
    myLoggerService.log("startListening");
    chatStoreService.setCustomerMessage("");
    this.startRecording();
  };

  private async processATMMessage(atmMessage: any) {
    myLoggerService.log("processATMMessage");
    if (this.transactionProcessor) {
      this.currentAction = await this.transactionProcessor.processAtmMessage(
        atmMessage
      );
    } else {
      this.currentAction = await this.sessionProcessor!.processAtmMessage(
        atmMessage
      );
    }

    if (this.currentAction.actionType === "Cancel") {
      this.stopRecordingCallback();
      myChatbotServiceAgent?.closesession(
        JSON.stringify({
          session_id: chatStoreService.sessionContext.sessionId,
        })
      );
      myATMServiceAgent?.send({
        event: "session-closed",
      });
    } else if (
      this.currentAction.actionType === "ContinueSession" ||
      this.currentAction.actionType === "ContinueTransaction" ||
      this.currentAction.actionType === "EndTransaction"
    ) {
      playAudio(this.currentAction!.prompt!);
    } else if (this.currentAction.actionType === "AtmInteraction") {
      if (!chatStoreService.playing) playAudio(this.currentAction!.prompt!);
      myATMServiceAgent.send(this.currentAction.interactionMessage);
    } else {
      myLoggerService.log(
        "Need handle action:" + JSON.stringify(this.currentAction)
      );
    }
    return;
  }
  private async process(message: string | object) {
    const user_text = typeof message === "string" ? message : undefined;
    const atmMessage = typeof message === "object" ? message : undefined;

    if (!chatStoreService.sessionContext.sessionId) return;

    chatStoreService.setCustomerMessage(user_text || "");

    if (atmMessage) {
      this.processATMMessage(atmMessage);
      return;
    }

    myLoggerService.log(
      "processTranscript currentAction1:" + JSON.stringify(this.currentAction)
    );

    switch (this.currentAction.actionType!) {
      case "None":
        break;
      case "NewSession":
      case "ContinueSession":
        myLoggerService.log(`process: ${user_text}`);
        this.currentAction = await this.sessionProcessor!.processText(
          user_text || ""
        )!;
        myLoggerService.log(
          "process currentAction2:" + JSON.stringify(this.currentAction)
        );

        if (this.currentAction.actionType === "Cancel") {
          this.cancelHandler();
        }
        if (this.currentAction.actionType === "ContinueSession") {
          playAudio(this.currentAction!.prompt!);
        } else if (this.currentAction.actionType === "NewTransaction") {
          this.transactionProcessor = createTransactionProcessor(
            chatStoreService.sessionContext!.transactionContext!
              .currentTransaction! as TransactionName
          );
          this.currentAction = {
            actionType: "ContinueTransaction",
          };
          this.transactionProcessor?.start();
        }
        break;
      case "Cancel":
        this.cancelHandler();
        break;
      case "ContinueTransaction":
        this.currentAction = await this.transactionProcessor!.processText(
          user_text || ""
        )!;
        myLoggerService.log(
          "process currentAction3:" + JSON.stringify(this.currentAction)
        );

        // playAudio(this.currentAction.prompt!, this.currentAction.playAudioOnly);

        if (this.currentAction.actionType === "Cancel") {
          this.cancelHandler();
        } else if (this.currentAction.actionType === "AtmInteraction") {
          if (!chatStoreService.playing) {
            playAudio(
              this.currentAction!.prompt!,
              this.currentAction.playAudioOnly
            );
          }

          myATMServiceAgent.send(this.currentAction.interactionMessage);
        } else if (this.currentAction.actionType === "ContinueTransaction") {
          playAudio(
            this.currentAction!.prompt!,
            this.currentAction.playAudioOnly
          );
        } else if (this.currentAction.actionType === "EndTransaction") {
          if (this.currentAction!.prompt) {
            playAudio(
              this.currentAction!.prompt!,
              this.currentAction.playAudioOnly
            );
          } else {
            this.startSession();
          }
        }
        break;
      case "EndTransaction":
        if (this.currentAction!.prompt) {
          playAudio(
            this.currentAction!.prompt!,
            this.currentAction.playAudioOnly
          );
        } else {
          this.startSession();
        }
        break;
      case "AtmInteraction":
        if (!chatStoreService.playing) playAudio(this.currentAction!.prompt!);
        myATMServiceAgent.send(this.currentAction.interactionMessage);
        break;
      default:
        myLoggerService.log("Invalid Action");
        break;
    }
  }
}

const mainProcessor: MainProcessor = new MainProcessor();
export { mainProcessor };
