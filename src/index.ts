import { WorkerService } from "./services/work.service";

async function main() {

    const myWorkerService: WorkerService = new WorkerService();
    myWorkerService.start();
}

main();