import { config } from './config.js';
import { PhotoAgent } from './photoAgent.js';

async function main() {
  const apiKey = config.userApiKey;
  const agent = new PhotoAgent(apiKey);
  
  try {
    const result = await agent.start();
    console.log('Final result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();