import { Observer } from "mobx-react-lite";
import { chatStoreService } from "../services/chat-store.service";
import { If } from "./if";

export default function AudioPlayer() {
  const handleCanPlay = () => {
    console.log("handleCanPlay");
  };
  const handleEnded = () => {
    console.log("handleComplete");
  };
  return (
    <Observer>
      {() => (
        <If condition={!!chatStoreService.audioUrl}>
          <audio
            id="audio"
            onCanPlay={() => handleCanPlay}
            onEnded={() => handleEnded}
            src={chatStoreService.audioUrl}
            controls
            autoPlay
            style={{ display: "none" }}
          ></audio>
        </If>
      )}
    </Observer>
  );
}
