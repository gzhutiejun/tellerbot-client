import { chatStoreService } from "../services/chat-store.service";
import { If } from "./if";

export default function Mic() {
  return (
    <div>
      <If condition={chatStoreService.mic}>
        <div className="mic-icon mic-on" />
      </If>
      <If condition={!chatStoreService.mic}>
        <div className="mic-icon mic-off" />
      </If>
    </div>
  );
}
