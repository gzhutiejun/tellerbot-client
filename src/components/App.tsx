import Avatar from "./Avatar";
import CustomerChatPanel from "./CustomerChatPanel";
import Mic from "./Mic";
import { Observer } from "mobx-react-lite";
import AgentChatDetail from "./AgentChatDetail";
import AgentChatPanel from "./AgentChatPanel";
import ChatbotStatus from "./ChatbotStatus";
import AudioPlayer from "./AudioPlayer";

function App() {
  return (
    <Observer>
      {() => (
        <div>
          <div className={"acc-screen"}>
            <div className="acc-header">
              <div className="acc-logo"></div>
            </div>

            <div className="acc-body">
              <div className="avatar">
                <Avatar></Avatar>
              </div>

              <div className="dialog">
                <AgentChatPanel></AgentChatPanel>
                <AgentChatDetail></AgentChatDetail>
                <CustomerChatPanel></CustomerChatPanel>
                <ChatbotStatus></ChatbotStatus>
                <Mic></Mic>
                <AudioPlayer></AudioPlayer>
              </div>
            </div>
          </div>
        </div>
      )}
    </Observer>
  );
}

export default App;
