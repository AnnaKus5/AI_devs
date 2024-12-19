import { CentralaServices } from "./centralaServices.js";
import { DatabaseServices } from "./DatabaseServices.js";
import { FindAnswerServices } from "./findAnswerServices.js";
import { FileServices } from "./FileServices.js";

const COLLECTION_NAME = "article"

const centralaServices = new CentralaServices()
const databaseServices = new DatabaseServices()
const findAnswerServices = new FindAnswerServices()
const fileService = new FileServices()

async function processQuestionsString(questionsString) {
    return questionsString.split('\n')
        .filter(q => q) // Remove empty strings
        .reduce((acc, question) => {
            const [key, value] = question.split('=')
            if (key && value) {
                acc[key] = value
            }
            return acc
        }, {})
}

async function main(params) {
    const questionsString = await centralaServices.getQuestions()
    const questions = await processQuestionsString(questionsString)

    console.log(questions)

    const answers = {
        '01': '',
        '02': '',
        '03': '',
        '04': '',
        '05': '',
    }

    for (const [key, question] of Object.entries(questions)) {
        const document = await fileService.readFile("./data/centrala.ag3nts.org-dane-arxiv-draft.html-processed.md")
        const answer = await findAnswerServices.processQuestion(question, document);
        answers[key] = answer;
    }

    console.log(answers)
    centralaServices.sendAnswer("arxiv", answers)
}

main()