import "../assets/scss/styles.scss";
import { myChatbotProcessor } from "./services/chatbot-processor";
import { fetchJson } from "./util/ajax";

async function main() {
  const commConfig = await fetchJson("/config/comm-config.json");
  //  console.log("communication config",commConfig);
  myChatbotProcessor.init(
    commConfig.servers.atmUrl,
    commConfig.servers.chatbotUrl
  );
}

main();
