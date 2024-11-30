import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv'
import axios from 'axios';

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getData(url, query) {
    try {
        const response = await axios.post(url, {apikey: process.env.USER_API_KEY, query: query})
        console.log(response.data)
        return {query: query, hasBeenSeen: response.data.message}
    }
    catch (error) {
        console.error("Error during getData ", error)
        return null;
    }
}

async function openAIRequest(systemPrompt, userQuery, model) {
    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: userQuery,
                },
            ],
            response_format: { type: "json_object" }
        });

        console.log("OpenAI:", completion.choices[0].message.content);
        return completion.choices[0].message.content
    } catch (error) {
        console.error("Error during openAIRequest: ", error);
    }
}

async function sendData(taskName, answer) {
    const url = process.env.SECRET_ENDPOINT_REPORT;
    const dataToSend = {
        task: taskName,
        apikey: process.env.USER_API_KEY,
        answer: answer
    };

    try {
        const response = await axios.post(url, dataToSend);
        console.log(response.data);
    } catch (error) {
        console.log(error);
    }
}


//find names and cities to check first time
async function findNamesToCheck(file) {
    const report = await fs.readFile(file, 'utf-8')

    const systemPrompt = `
    Your role is to analyze raport provided by user and find names and cities mentions in raport.
    Return names (only first names!) and cities. 
    Names and cities has to be in the denominator form, capital letters, without polish marks - ł = l, ź = z, ą = a etc. mentions in raport.
    Expected output is JSON object: {names: [], places: []}
    `

    const response = await openAIRequest(systemPrompt, report, 'gpt-4o')
    const list = JSON.parse(response)

    if (list.names.length > 0) {
        for (const name of list.names) {
            if (!namesToCheck.includes(name) && !savedNamesReports.includes(name)) {
                namesToCheck.push(name)
            }
        }
    }

    if (list.places.length > 0) {
        for (const place of list.places) {
            if (!placesToCheck.includes(place) && !savedPlacesReports.includes(place)) {
                placesToCheck.push(place)
            }
        }
    }
}

let namesToCheck = []
let placesToCheck = []
let savedNamesReports = []
let savedPlacesReports = []

//find better name, infoPeople, infoPlaces
const data = {
    people: {
        BARBARA: []
    },
    places: {
        KRAKOW: []
    }
}

// Add this helper function to make arrays unique
function makeUnique(arr) {
    return [...new Set(arr)];
}

function findMissingData() {
    // Make values unique
    Object.entries(data.people).forEach(([key, value]) => {
        data.people[key] = makeUnique(value);
        value.forEach(name => {
            if(!savedPlacesReports.includes(name) && !savedNamesReports.includes(name)) {
                placesToCheck.push(name);
            }
        });
    });

    Object.entries(data.places).forEach(([key, value]) => {
        data.places[key] = makeUnique(value.filter(place => place !== '[**RESTRICTED' && place !== 'DATA**]'));
        value.forEach(place => {
            if(!savedNamesReports.includes(place) && !savedPlacesReports.includes(place)) {
                namesToCheck.push(place);
            }
        });
    });

    // Make the check arrays unique
    namesToCheck = makeUnique(namesToCheck);
    placesToCheck = makeUnique(placesToCheck);

    console.log("names to check", namesToCheck);
    console.log("places to check ", placesToCheck);
}

function replace_polish_letters(text) {
    return text
      .replace(/[aĄ]/g, 'A')
      .replace(/[cĆ]/g, 'C')
      .replace(/[eĘ]/g, 'E')
      .replace(/[lŁ]/g, 'L')
      .replace(/[nŃ]/g, 'N')
      .replace(/[oÓ]/g, 'O')
      .replace(/[sŚ]/g, 'S')
      .replace(/[zŹ]/g, 'Z')
      .replace(/[zŻ]/g, 'Z');
  }

async function findConnections(arrayPeople, arrayPlaces) {

    //just to log, not necessary in code
    const listOfPeople = []
    const listOfPlaces = []

    console.log("array people in find connestions", arrayPeople)

    for (const person of arrayPeople) {
        console.log(person)
        const personpl = replace_polish_letters(person).toUpperCase()
        const response = await getData(process.env.SECRET_ENDPOINT_PEOPLE, personpl)
        
        if (response && response.hasBeenSeen) {
            const name = personpl  // Use the original query instead of response.query
            const places = response.hasBeenSeen.split(" ")
    
            if (response.hasBeenSeen === '[**RESTRICTED DATA**]') continue
    
            if (data.people[name]) {
                data.people[name] = [...data.people[name], ...places]
            } else {
                data.people[name] = places
            }
    
            listOfPeople.push(response)   
        }
    }

    for (const place of arrayPlaces) {
        console.log(place)
        const response = await getData(process.env.SECRET_ENDPOINT_PLACES, place)
        
        if (response && response.hasBeenSeen) {
            const name = place  // Use the original query
            const people = response.hasBeenSeen.split(" ")

        if (response.hasBeenSeen === '[**RESTRICTED DATA**]') continue

            if (data.places[name]) {
                data.places[name] = makeUnique([...data.places[name], ...people]);
            } else {
                data.places[name] = people
            }   

            listOfPlaces.push(response) 
        }
    }

    // Save processed names
    const savedNames = namesToCheck.map(name => name)
    savedNamesReports = [...savedNamesReports, ...savedNames]
    namesToCheck = []

    // Add this: Save processed places
    const savedPlaces = placesToCheck.map(place => place)
    savedPlacesReports = [...savedPlacesReports, ...savedPlaces]
    placesToCheck = []

    console.log("data", data)
    console.log("names to check ", namesToCheck)
    console.log("places to check ", placesToCheck)
    console.log("saved names report", savedNamesReports)
    console.log("saved places report", savedPlacesReports)

    findMissingData()
}


async function main() {
    await findNamesToCheck('barbara.txt');
    
    // Use a while loop to call findConnections until both arrays are empty
    while (namesToCheck.length > 0 || placesToCheck.length > 0) {
        await findConnections(namesToCheck, placesToCheck);
    }
}

// main();

const infoFromCentrala = {
    people: {
      BARBARA: [],
      ALEKSANDER: [ 'KRAKOW', 'LUBLIN', 'WARSZAWA' ],
      ANDRZEJ: [ 'WARSZAWA', 'GRUDZIADZ' ],
      RAFAL: [ 'GRUDZIADZ', 'WARSZAWA', 'LUBLIN' ],
      ADAM: [ 'KRAKOW', 'CIECHOCINEK' ],
      AZAZEL: [ 'GRUDZIADZ', 'WARSZAWA', 'KRAKOW', 'LUBLIN', 'ELBLAG' ],
      GABRIEL: [ 'FROMBORK' ],
      ARTUR: [ 'KONIN' ],
      GLITCH: [ 'https://centrala.ag3nts.org/dane/na_smartfona.png' ]
    },
    places: {
      KRAKOW: [ 'ALEKSANDER', 'BARBARA', 'ADAM' ],
      WARSZAWA: [ 'RAFAŁ', 'ALEKSANDER', 'ANDRZEJ' ],
      GRUDZIADZ: [ 'RAFAL', 'AZAZEL' ],
      CIECHOCINEK: [ 'ADAM', 'GABRIEL' ],
      ELBLAG: [ 'BARBARA' ],
      FROMBORK: [ 'GABRIEL', 'ARTUR', 'AZAZEL' ],
      KONIN: [ 'GLITCH' ]
    }
  }

async function whereIsBarbara(raport, infoFromCentrala) {

    const systemPrompt = `
    Your role it to analyze provided raport and info from centrala and find the answer: where is Barbara?
    Info from centrala contai
    `
    
}

sendData('loop', 'ELBLAG')