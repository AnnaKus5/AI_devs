import { CentralaServices } from "./centralaServices.js";
import { DatabaseServices } from "./DatabaseServices.js";
import { FindAnswerServices } from "./findAnswerServices.js";

const COLLECTION_NAME = "rafal_notes"

const centralaServices = new CentralaServices()
const databaseServices = new DatabaseServices()
const findAnswerServices = new FindAnswerServices()

async function main(params) {
    const questions = await centralaServices.getQuestions()

    console.log(questions)

    const answers = {
        '01': '',
        '02': '',
        '03': '',
        '04': '',
        '05': '',
    }

    for (const [key, question] of Object.entries(questions)) {
        const relevantDocuments = await  databaseServices.findRevelantDocuments(question, COLLECTION_NAME)
        const answer = await findAnswerServices.processQuestion(question, relevantDocuments, COLLECTION_NAME);
        answers[key] = answer;
    }

    console.log(answers)
    centralaServices.sendAnswer("notes", answers)
}

main()