import { CentralaServices } from "./centralaServices.js";

const centralaServices = new CentralaServices()


async function main(params) {
    const questions = await centralaServices.getQuestions()

    const answers = {
        '01': '',
        '02': '',
        '03': '',
        '04': '',
        '05': '',
    }

    for (const [key, question] of Object.entries(questions)) {
        const answer = await findAnswerServices.processQuestion(question);
        answers[key] = answer;
    }
}