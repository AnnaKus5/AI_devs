import fs from 'fs/promises'
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from "openai";
import axios from 'axios';

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function getFilesPaths(folder) {
    try {
        const files = await fs.readdir(folder);
        return files
            .filter(file => path.extname(file) === '.txt')
            .map(file => `${folder}/${file}`);
    } catch (error) {
        console.error('Błąd podczas odczytywania folderu:', error);
    }
}

async function readFileContent(filePath) {
    return await fs.readFile(filePath, 'utf-8');
}

async function getKeywords(report, reportPath) {
    const initialPrompt = `
    Your role is to meticulously analyze the provided user report and extract the most relevant keywords to describe content.

    Analysis instructions, act step by step:
    1. Initial keyword extraction from report:
       - Identify key names of people and organizations
       - Identyfy role and position of people mentioned (eg. teacher, student, director, etc.)
       - Require: Extract locations and places mentioned
       - Note technical terms and specifications (e.g. JavaScript, Python, etc.)
       - Capture main events and actions happening in the report(e.g. meetings, negotiations, decisions, capture etc.)

    You have to find keywords to all this categories.

    Return exactly 5- 7 the most precise and relevant keywords that capture the essence of the report.
    Keywords should be specific rather than general.
    Do not include any explanations or additional text - only the keywords separated by commas. 
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: initialPrompt },
                { role: "user", content: `report: ${reportPath} ${report}` }
            ],
            temperature: 0
        });
        return completion.choices[0].message.content.split(',').map(k => k.trim());
    } catch (error) {
        console.error("Error during initial keywords generation:", error);
        return [];
    }
}
//TODO: match reports with connected facts

async function matchReportsWithFacts(reports, facts) {
    const results = [];

    for (let i = 0; i < reports.length; i++) {
        const reportFileName = path.basename(reports[i].file);
        const connectedFacts = [];
        
        // Check each fact for matching keywords with current report
        for (let j = 0; j < facts.length; j++) {
            const hasMatchingKeywords = reports[i].keywords.some(reportKeyword => 
                facts[j].keywords.includes(reportKeyword)
            );
            
            if (hasMatchingKeywords) {
                connectedFacts.push(facts[j]);
            }
        }
        
        if (connectedFacts.length > 0) {
            results.push({
                file: reportFileName,
                fileKeywords: reports[i].keywords,
                connectedFacts: connectedFacts
            });
        }
        else {
            results.push({
                file: reportFileName,
                fileKeywords: reports[i].keywords,
                connectedFacts: []
            });
        }
    }
    
    return results;
}   


// async function getFinalKeywords(data) {

//     const finalPrompt = `
//     Your role is to meticulously analyze the provided user report and extract the most relevant keywords.

//     Analysis instructions, act step by step:
//        - Identify key names of people and organizations
//        - Extract locations and places mentioned
//        - Describe main actions and events happening in the report (e.g. meetings, negotiations, decisions, capture etc.)
//        - Note technical terms and specifications
//        - List status changes and decisions

//     Return 5-6 the most precise and relevant keywords that capture the essence of the report. Keywords should be in the nominative form
//     Keywords should be specific rather than general.  
//     Do not include any explanations or additional text - only the keywords separated by commas.
//     `;

//     try {
//         const completion = await openai.chat.completions.create({
//             model: "gpt-4o",
//             messages: [
//                 { role: "system", content: finalPrompt },
//                 { role: "user", content: `Report: ${data}` }
//             ]
//         });
//         return completion.choices[0].message.content;
//     } catch (error) {
//         console.error("Error during final keywords generation:", error);
//         return '';
//     }
// }

async function saveKeywords(reportPaths, dataStatus) {
    const results = [];
    
    for (const reportPath of reportPaths) {
        const report = await readFileContent(reportPath);
        
        // Step 1: Get initial keywords
        const keywords = await getKeywords(report, reportPath);
        
        // Step 2: Find relevant context
        // const relevantContext = await findRelevantContext(initialKeywords, factPaths);
        
        // // Step 3: Generate final keywords with context
        // const finalKeywords = await getFinalKeywords(report, relevantContext);
        
        results.push({ file: reportPath, keywords: keywords });
    }
    await fs.writeFile(`./pliki_z_fabryki/keywords_${dataStatus}.json`, JSON.stringify(results, null, 2));
    return results;
}

function transformData(array) {
    const solution = {};
    for (const file of array) {
        const fileName = file.file;
        let allKeywords = [];
        const reportKeywords = file.fileKeywords;
        if (file.connectedFacts.length > 0) {
            const factsKeywords = file.connectedFacts.map(fact => fact.keywords);
            allKeywords = [...reportKeywords, ...factsKeywords];
            allKeywords = [...new Set(allKeywords.flat())];
        } else {
            allKeywords = reportKeywords;
        }

        solution[fileName] = allKeywords.join(', ') 
    }
    return solution;
}

async function sendData(data) {
    const url = process.env.SECRET_ENDPOINT_REPORT;
    const dataToSend = {
        task: "dokumenty",
        apikey: process.env.USER_API_KEY,
        answer: data
    };

    try {
        const response = await axios.post(url, dataToSend);
        console.log(response.data);
    } catch (error) {
        console.log(error);
    }
}

async function main() {
    const factPaths = await getFilesPaths('./pliki_z_fabryki/facts');
    const reportPaths = await getFilesPaths("./pliki_z_fabryki");
    
    const reportKeywords = await saveKeywords(reportPaths, 'reports');
    const factsKeywords = await saveKeywords(factPaths, 'facts');
    // const reportKeywords = JSON.parse(await readFileContent('./pliki_z_fabryki/keywords_reports.json'));
    // const factsKeywords = JSON.parse(await readFileContent('./pliki_z_fabryki/keywords_facts.json'));
    const matchedReports = await matchReportsWithFacts(reportKeywords, factsKeywords);
    console.log(matchedReports);
    const solution = transformData(matchedReports);
    console.log(solution)    
    await sendData(solution);
}

main();