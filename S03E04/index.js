import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv'
import axios from 'axios';
import { accessSync } from 'fs';

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
            if (!namesToCheck.includes(name)) {
                namesToCheck.push(name)
            }
        }
    }

    if (list.places.length > 0) {
        for (const place of list.places) {
            if (!placesToCheck.includes(place)) {
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
        barbara: []
    },
    places: {
        krakow: []
    }
}

//we have to pass data.places \ function return barbara city or undefined -> to verify
function whereIsBarbara(data) {
   const whereIsBarbara = Object.entries(data).map(([key, value]) => {
    if (value.some(name => name === 'barbara')) {
        return key
    }
   } )
   return whereIsBarbara
}

function findMissingData() {

    //make values unique
    // lower and upper case  ?
    const people = Object.entries(data.people).map(([key, value]) => {
        value.map(name => {
            if(!savedPlacesReports.includes(name)) placesToCheck.push(name)
        })
    })
    const places = Object.entries(data.places).map(([key, value]) => {
        value.map(place => {
            if(!savedNamesReports.includes(place)) namesToCheck.push(place)
        })
    })

    console.log("names to check", namesToCheck)
    console.log("places to check ", placesToCheck)
}

async function findConnections(arrayPeople, arrayPlaces) {

    //just to log, not necessary in code
    const listOfPeople = []
    const listOfPlaces = []

    for (const person of arrayPeople) {
        console.log(person)
        const response = await getData(process.env.SECRET_ENDPOINT_PEOPLE, person)
        const name = response.query.toLowerCase()
        const places = response.hasBeenSeen.toLowerCase().split(" ")
        //remove restricteddata? is it necessary?

        if (places === '[**RESTRICTED DATA**]') break


        if (data.people[name]) {
            data.people[name].push(places)
        }
        else {
            data.people[name] = places
        }

        listOfPeople.push(response)   
    }
    for (const place of arrayPlaces) {
        console.log(place)
        const response = await getData(process.env.SECRET_ENDPOINT_PLACES, place)
        const name = response.query.toLowerCase()
        const people = response.hasBeenSeen.toLowerCase().split(" ")

        if (data.places[name]) {
            data.places[name] = [...data.places[name], ...people]
        }
        else {
            data.places[name] = people
        }   

        listOfPlaces.push(response) 
    }
    const savedData = namesToCheck.map(name => name.toLowerCase())

    savedNamesReports = [...savedNamesReports, ...savedData]
    namesToCheck = []

    console.log("data", data)
    console.log("names to check ", namesToCheck)
    console.log("saved report", savedNamesReports)

    findMissingData()

    // if (whereIsBarbara(data.places) !== 'undefined') {
    //     console.log(whereIsBarbara(data.places))
    // }
    // else {
    //     findMissingData()

    //     //TO DO: find names and cities to send another request to API
    // }

    // console.log("listOfPeople", listOfPeople)
    // console.log("listOfPlaces", listOfPlaces)

    // if on listOfPlaces has appear new name then we have to make new request to people endpoint to find out where he was seen
    // if on listOfPeople has appear new place then we have to make new request to places endpoint to find out who was in this place
    // if on listOfPlaces.hasBeenSeen has appear Barbara we have the solution and we can send it to the server
}


async function main() {
    await findNamesToCheck('barbara.txt')
    await findConnections(namesToCheck, placesToCheck)
    //temporary to avoid infinity loop
    await findConnections(namesToCheck, placesToCheck)
}

main()

// function updateInfo(info, type) {
//     //type: people | cities
//     // const {name, places} = info
//     const name = info.name.toLowerCase()
//     const places = info.places.toLowerCase()
//     // {name: "", places: []}
//     for (const place of places) {
//         if (data[type][name]) {
//             data[type][name].push(place)
//         }
//         else {
//             data[type]
//         }
//     }
// }

// użyłam LLM-a, żeby znaleźć imiona i miejsca w notatce
// odpytałam API dla każdej znalezionej nazwy
// nazwy dla których wysłałam zapytanie zapisałam w zmiennych savedPlacesReports i savedPeopleReports
// jeśli w odpowiedzi od API znalazły się jakieś nazwy, które nie zostały jeszcze wysłane do API, zapisywałam je w placesToCheck i peopleToCheck
// jednocześnie przechowywałam zdobyte informacje w obiekcie
// const data = {
//     people: {
//         barbara: []
//     },
//     places: {
//         krakow: []
//     }
// }
// po serii zapytań aktualizowałam listę i jeśli w data.places pojawiła się Barbara, zwracałam miasto, do którego została przypisana
