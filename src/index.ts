import "../assets/scss/styles.scss";
import { mainProcessor } from "./services/main-processor";
import { fetchJson } from "./util/ajax";

async function main() {
  const commConfig = await fetchJson("/config/comm-config.json");
   mainProcessor.init(commConfig.servers.atmUrl, commConfig.servers.chatbotUrl);
}

main();
