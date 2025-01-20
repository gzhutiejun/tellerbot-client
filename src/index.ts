import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "../assets/scss/styles.scss";
import { myWorkerService } from "./services/work.service";

async function main() {
  myWorkerService.init();
}

main();
