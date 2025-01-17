import "../assets/scss/styles.scss";
import { myWorkerService } from "./services/work.service";

async function main() {

  myWorkerService.init();
}

main();
