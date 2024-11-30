import { PhotoAgent } from './photoAgent.js';

async function main() {
  const apiKey = 'YOUR-API-KEY';
  const agent = new PhotoAgent(apiKey);
  
  try {
    const result = await agent.start();
    console.log('Final result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();