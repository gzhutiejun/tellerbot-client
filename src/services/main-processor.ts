/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTransactionProcessor, playAudio, repeat } from "../util/util";
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
import RecordRTC from "recordrtc";
window.RecordRTC = RecordRTC;
export class MainProcessor {
  private audioChunks: Blob[] = [];
  private debugMode = true;
  private atmConnectionOption?: ConnectionOptions;
  private chatbotServerConnected = false;
  private chatbotConnectionOption?: ConnectionOptions;
  private silenceTimeout = 2000;
  private lastAudioPath = "";
  private maxListenTime = 20000;
  private listenTimer: number = 0;
  private stopMicrophone?: () => void;
  private canceled = false;
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

  stopRecordingCallback = (blob: Blob) => {
    if (this.canceled) return;
    if (this.listenTimer > 0) {
      clearTimeout(this.listenTimer);
      this.listenTimer = 0;
    }

    chatStoreService.setStatus("");
    chatStoreService.setMic(false);

    this.recognize(blob);
  };

  private async recognize(audioBlob: Blob) {
    myLoggerService.log("audioChunk size:" + this.audioChunks.length);

    if (!chatStoreService.sessionContext!.sessionId) return;

    if (audioBlob.size > 0) {
      // const audioUrl = URL.createObjectURL(audioBlob);
      // chatStoreService.setCustomerAudioUrl(audioUrl);
      // const audio = new Audio(audioUrl);
      // audio.play();

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
  }

  /**
   * startRecording, it enable microphone and start recording
   * when customer voice is recorded, upload the audio file to service for further processing.
   * @returns
   */
  startRecording = async () => {
    myLoggerService.log("startRecording");

    chatStoreService.setStatus("Listening...");
    chatStoreService.setMic(true);
    this.stopMicrophone = window.createAudioRecorder(
      this.silenceTimeout,
      this.stopRecordingCallback
    );

    this.listenTimer = window.setTimeout(() => {
      if (this.stopMicrophone) {
        this.stopMicrophone();
        this.stopMicrophone = undefined;
      }
    }, this.maxListenTime);
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
        case "end-transaction":
          this.process(atmMessage);
          break;
        case "close-session":
          this.canceled = true;
          this.clearSessionData();
          this.stopMicrophone?.();
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
      this.canceled = true;
      this.stopMicrophone?.();
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
