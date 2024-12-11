import { AudioServices } from './AudioServices.js';

const FILE_PATH = '../Transcribe/audio.wav';
const LANGUAGE = "pl";

async function main() {
    const audioServices = new AudioServices();
    await audioServices.transcribeAudio(FILE_PATH, LANGUAGE);
}

main();



 

