import neo4j from 'neo4j-driver'; 
import fs from 'fs/promises';  
import axios from 'axios';   
import dotenv from 'dotenv'

dotenv.config()

const uri = 'bolt://localhost:7687'; 
const user = 'neo4j';
const password = 'jester-grand-mambo-expand-airport-5406';
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();


async function loadDataToNeo4j(usersFilePath, connectionsFilePath) {
    try {
      const usersData = JSON.parse(await fs.readFile(usersFilePath, 'utf-8'));
      const connectionsData = JSON.parse(await fs.readFile(connectionsFilePath, 'utf-8'));
  
      for (const user of usersData.reply) {
        await session.run(
          `MERGE (u:User {user_id: $user_id})
           SET u.username = $username,
               u.access_level = $access_level,
               u.is_active = $is_active,
               u.lastlog = $lastlog`,
          {
            user_id: user.id,
            username: user.username,
            access_level: user.access_level,
            is_active: user.is_active,
            lastlog: user.lastlog
          }
        );
      }
  
      console.log('Users added to Neo4j.');
  
      for (const connection of connectionsData.reply) {
        await session.run(
          `MATCH (u1:User {user_id: $user1_id})
           MATCH (u2:User {user_id: $user2_id})
           MERGE (u1)-[:KNOWS]->(u2)`,
          {
            user1_id: connection.user1_id,
            user2_id: connection.user2_id
          }
        );
      }
  
      console.log('Connections added to Neo4j.');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      await session.close();
      await driver.close();
    }
  }

const usersFilePath = './users.json';
const connectionsFilePath = './connections.json';

// loadDataToNeo4j(usersFilePath, connectionsFilePath);

async function findShortestPath(startUsername, endUsername) {
    try {
      const result = await session.run(
        `MATCH p = shortestPath(
           (start:User {username: $startUsername})-[:KNOWS*]-(end:User {username: $endUsername})
         )
         RETURN p`,
        { startUsername, endUsername }
      );
  
      const paths = result.records.map(record => record.get('p'));
    //   console.log(result)
    //   console.log('Shortest Path:', paths);
    //   return paths;
    return result
    } catch (error) {
      console.error('Error finding shortest path:', error);
    } finally {
      await session.close();
      await driver.close();
    }
  }
  
  
  async function extractUsernamesFromPath(path) {
    // Wyciąganie imion z węzłów startowego i końcowego
    const usernames = [path.start.properties.username];
  
    // Przechodzenie przez segmenty ścieżki
    for (const segment of path.segments) {
      // Dodawanie username z końcowego węzła każdego segmentu
      usernames.push(segment.end.properties.username);
    }
  
    return usernames;
  }

  async function findNames(result) {
    if (result.records.length > 0) {
        const path = result.records[0].get('p'); // Pobierz ścieżkę
        const usernames = await extractUsernamesFromPath(path); // Wyciągnij imiona
        console.log('Usernames in Shortest Path:', usernames);
        return usernames;
      } else {
        console.log('No path found.');
        return [];
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


  async function main() {
    const path = await findShortestPath('Rafał', 'Barbara');
    const names = await findNames(path)
    console.log("names: ", names)
    const answer = names.join(', '); // Convert array into string
    sendData("connections", answer)
  }

  main()