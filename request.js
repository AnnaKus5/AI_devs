const https = require('node:https');

// Funkcja pobierająca dane za pomocą metody GET
async function getData() {
    return new Promise((resolve, reject) => {
        https.get('https://poligon.aidevs.pl/dane.txt', (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });

            res.on('end', () => {
                resolve(rawData); // Zwrócenie pobranych danych
            });

        }).on('error', (e) => {
            reject(e);
        });
    });
}

// Funkcja wysyłająca dane za pomocą metody POST
async function postData(dataToSend) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(dataToSend); // Formatowanie danych do JSON

        console.log('postdata', postData)

        const options = {
            host: 'poligon.aidevs.pl',
            path: '/verify',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            console.log(`statusCode: ${res.statusCode}`);

            let response = '';
            res.on('data', (chunk) => {
                response += chunk;
            });

            res.on('end', () => {
                console.log('Response from POST:', response);
                resolve(response);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData); // Wysłanie danych POST
        req.end();
    });
}

// Funkcja główna pobierająca dane i wysyłająca je do innego endpointu
async function sendData() {
    try {
        const data = await getData(); // Pobranie danych za pomocą GET
        console.log('Data to send:', data);

        const dataArray = data.split('\n')
        const lastElement = dataArray.pop()

        console.log(dataArray)

        const dataToSend = {
            task: "POLIGON",
            apikey: "86cf405b-cfa7-4ef0-a55c-c23aceacbe68",
            answer: dataArray
        }

        const postResponse = await postData(dataToSend); // Wysłanie danych za pomocą POST
        console.log('POST response:', postResponse);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

sendData();
