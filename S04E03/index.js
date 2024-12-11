import { CentralaServices } from './centralaServices.js';
import { FindAnswerServices } from './findAnswerServices.js';

const MAIN_URL = 'https://softo.ag3nts.org';

async function main() {
    const findAnswerServices = new FindAnswerServices();
    const centralaServices = new CentralaServices();

    const questions = await centralaServices.getQuestions();
    const answers = {
        '01': '',
        '02': '',
        '03': '',
    }

    for (const [key, question] of Object.entries(questions)) {
        const answer = await findAnswerServices.processQuestion(question, MAIN_URL);
        answers[key] = answer;
    }

    await centralaServices.sendAnswer("softo", answers)
}

main();
