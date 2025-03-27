/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTransactionProcessor, playAudio } from "../util/util";
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

export class MainProcessor {
  private mediaStream?: MediaStream;
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private debugMode = false;
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
  private silenceTimeout = 3000;
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
    chatStoreService.setLanguage("zh-CN");
    // setLanguage(chatStoreService.language);
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

      if (!chatStoreService.sessionContext!.sessionId) return;

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
              this.startListening();
            }
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
    myLoggerService.log("startSilenceDetection");
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
        case "end-transaction":
          this.process("", atmMessage);
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
      this.process("", atmMessage);
    }
  };

  private clearSessionData() {
    chatStoreService.setSessionId("");
    this.sessionProcessor = undefined;
    this.transactionProcessor = undefined;
  }

  private anotherTransacton() {
    this.currentAction = {
      actionType: "None",
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
    if (chatStoreService.chatState === "Notification") return;
    myLoggerService.log("startListening");
    chatStoreService.setCustomerMessage("");
    this.startRecording();
  };

  private async process(user_text: string = "", atmMessage: any = undefined) {
    myLoggerService.log(`process: ${user_text}`);

    if (!chatStoreService.sessionContext.sessionId) return;

    chatStoreService.setChatState("Interaction");

    chatStoreService.setCustomerMessage(user_text);

    if (atmMessage) {
      if (this.transactionProcessor) {
        this.currentAction = await this.transactionProcessor.processAtmMessage(
          atmMessage
        );
      } else {
        this.currentAction = await this.sessionProcessor!.processAtmMessage(
          atmMessage
        );
      }
    }
    myLoggerService.log(
      "processTranscript currentAction1:" + JSON.stringify(this.currentAction)
    );

    chatStoreService.setPlayAudioOnly(
      this.currentAction.playAudioOnly || false
    );

    switch (this.currentAction.actionType!) {
      case "None":
        break;
      case "NewSession":
      case "ContinueSession":
        this.currentAction = await this.sessionProcessor!.processText(
          user_text
        )!;
        myLoggerService.log(
          "process currentAction2:" + JSON.stringify(this.currentAction)
        );

        if (this.currentAction.actionType === "Cancel") {
          this.cancelHandler();
        }
        if (this.currentAction.actionType === "ContinueSession") {
          await playAudio(this.currentAction!.prompt!);
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
          user_text
        )!;
        myLoggerService.log(
          "process currentAction3:" + JSON.stringify(this.currentAction)
        );

        // playAudio(this.currentAction.prompt!, this.currentAction.playAudioOnly);

        if (this.currentAction.actionType === "Cancel") {
          this.cancelHandler();
        } else if (this.currentAction.actionType === "AtmInteraction") {
          chatStoreService.setChatState("Notification");
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
        chatStoreService.setChatState("Notification");
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
