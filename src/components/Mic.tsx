import { chatStoreService } from "../services/chat-store.service";
import { If } from "./if";
import { Observer } from "mobx-react-lite";

export default function Mic() {
  return (
    <Observer>
      {() => (
        <div>
          <If condition={chatStoreService.mic}>
            <div className="mic-icon mic-on" />
          </If>
          <If condition={!chatStoreService.mic}>
            <div className="mic-icon mic-off" />
          </If>
        </div>
      )}
    </Observer>
  );
}
