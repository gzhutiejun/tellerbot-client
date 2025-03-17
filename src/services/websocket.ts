/* eslint-disable @typescript-eslint/no-explicit-any */

import { myLoggerService } from "./logger.service";

export interface ConnectionOptions {
    wsUrl?: string;
    webApiUrl?: string;
    autoConnect?: boolean;
    jsonRpc?: boolean;
  }
  
  export interface ConnectionHandlerOption<T = unknown> {
    onOpened?: () => void;
    onClosed?: () => void;
    onError?: (err: any) => void;
    onMessage?: (message: T) => void;
  }
  
  export class WebSocketConnectionImpl<T = any> {
    private options!: ConnectionOptions & ConnectionHandlerOption<T>;
    private ws!: WebSocket;
    private connected = false;
    constructor(opt: ConnectionOptions & ConnectionHandlerOption<T>) {
      this.options = { autoConnect: true, jsonRpc: true, ...opt };
      if (this.options.autoConnect) this.connect();
    }
    connect() {
      if (!this.connected) {
        const { wsUrl, onClosed, onError, onMessage, onOpened } = this.options;
        if (!wsUrl) {
          console.log("wsUrl is not configured");
          return;
        }
        this.ws = new WebSocket(wsUrl);
        this.ws.addEventListener("close", () => {
          this.connected = false;
          onClosed?.();
        });
        this.ws.addEventListener("error", (e) => {
          myLoggerService.log("error" );
          onError?.(e);
        });
        this.ws.addEventListener("open", () => {
          this.connected = true;
          onOpened?.();
        });
        this.ws.addEventListener("message", (message) => {
          onMessage?.(message.data);
        });
      }
    }
    send(message: any) {
      if (this.connected) {
        this.ws.send(typeof message === "string" ? message : JSON.stringify(message));
      } else {
        myLoggerService.log(`the web socket is closed`);
      }
    }
  }
  