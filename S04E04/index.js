import CentralaServices from './CentralaServices.js';

const ENDPOINT = "https://2b8c-194-33-76-76.ngrok-free.app"

async function main() {
    const centralaServices = new CentralaServices();
    await centralaServices.sendAnswer("webhook", ENDPOINT)
}

main();
