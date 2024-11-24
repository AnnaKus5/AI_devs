import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const client = new QdrantClient({ host: "localhost", port: 6333 });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// const query = "W raporcie, z którego dnia znajduje się wzmianka o kradzieży prototypu broni?"
const query = "Kiedy skradziono prototyp broni"
const embeddingModel = "text-embedding-ada-002"

async function createEmbedding(text) {

    try {
        const embedding = await openai.embeddings.create({
          model: embeddingModel,
          input: text,
          encoding_format: "float",
        });
        return embedding.data[0].embedding
    } 
    catch (e) {
        console.error("Error during embedding", e)
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

async function searchInQdrant(embedding) {
    try {
        const response = await client.search('weapons_tests', {
            vector: embedding,
            limit: 1,  
            with_payload: true, 
            with_vector: false 
        });
        
        console.log('Search results:', response);
        return response;
    } catch (error) {
        console.error('Error searching in Qdrant:', error);
        throw error;
    }
}

function transformDate(date) {
    const [year, month, day] = date.split("_")
    return `${year}-${month}-${day}`
}

async function main() {
    const queryEmbedding = await createEmbedding(query);
    const searchResults = await searchInQdrant(queryEmbedding);
    const date = transformDate(searchResults[0].payload.fileName.split(".")[0])
    console.log(date)
    await sendData("wektory", date)
}

main()