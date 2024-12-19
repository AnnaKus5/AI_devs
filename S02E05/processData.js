import { MarkdownScraper } from "./MarkdownScraper.js";
import { FileServices } from "./FileServices.js";
import { OpenAIServices } from "./OpenAIServices.js";
import { AudioServices } from "./AudioServices.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MarkdownProcessor {
    constructor() {
        this.markdownScraper = new MarkdownScraper();
        this.fileServices = new FileServices();
        this.openAIServices = new OpenAIServices();
        this.audioServices = new AudioServices();
    }

    async extractLinks(markdown) {
        const imageLinkRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const audioLinkRegex = /\[([^\]]+)\]\(([^)]+\.mp3)\)/g;
        
        console.log('Extracting links from markdown...');
        
        const imageLinks = [...markdown.matchAll(imageLinkRegex)].map(match => {
            console.log('Found image link:', match[2]);
            return {
                type: 'image',
                alt: match[1],
                url: match[2],
                fullMatch: match[0]
            };
        });

        const audioLinks = [...markdown.matchAll(audioLinkRegex)].map(match => {
            console.log('Found audio link:', match[2]);
            return {
                type: 'audio',
                text: match[1],
                url: match[2],
                fullMatch: match[0]
            };
        });

        const allLinks = [...imageLinks, ...audioLinks];
        console.log('All extracted links:', allLinks);
        return allLinks;
    }

    async processImage(imageUrl) {
        try {
            const imagePath = path.resolve(__dirname, 'data', imageUrl);
            const imageBase64 = await this.fileServices.getBase64(imagePath);
            
            const analysis = await this.openAIServices.analyzeImage(imageBase64);
            
            if (!analysis || !analysis.text) {
                console.error('Invalid analysis response:', analysis);
                return `[Error: Invalid image analysis response for ${imageUrl}]`;
            }
            
            return `[Opis obrazu: ${analysis.text}]`;
        } catch (error) {
            console.error('Error processing image:', error);
            return `[Error processing image: ${imageUrl}]`;
        }
    }

    async processAudio(audioUrl) {
        try {
            console.log('Processing audio file:', audioUrl);
            
            // Use the manually placed audio file from the audio directory
            const audioPath = path.resolve(__dirname, 'data', 'audio', audioUrl.split('/').pop());
            console.log('Audio path:', audioPath);
            
            // Process the audio file
            const transcription = await this.audioServices.transcribeAudio(
                audioPath, 
                'pl'
            );
            
            console.log('Transcription completed:', transcription.slice(0, 100) + '...');
            
            // Format the transcription nicely
            return `[Transkrypcja nagrania: ${transcription}]`;
        } catch (error) {
            console.error('Error processing audio:', error);
            return `[Error processing audio: ${audioUrl}: ${error.message}]`;
        }
    }

    async replaceLinksWithContent(markdown, processedLinks) {
        let updatedMarkdown = markdown;
        
        for (const link of processedLinks) {
            if (!link.processedContent) {
                console.error('Missing processed content for link:', link);
                continue;
            }
            const content = link.processedContent;
            updatedMarkdown = updatedMarkdown.replace(link.fullMatch, content);
            
            console.log('Replacing:', link.fullMatch);
            console.log('With:', content);
        }
        
        return updatedMarkdown;
    }

    async processMarkdown(markdownPath) {
        try {
            const markdown = await this.fileServices.readFile(markdownPath);
            const links = await this.extractLinks(markdown);
            
            console.log('Found links:', links);

            const processedLinks = await Promise.all(
                links.map(async (link) => {
                    let processedContent;
                    if (link.type === 'image') {
                        processedContent = await this.processImage(link.url);
                    } else if (link.type === 'audio') {
                        processedContent = await this.processAudio(link.url);
                    }
                    return { ...link, processedContent };
                })
            );
            
            const updatedMarkdown = await this.replaceLinksWithContent(markdown, processedLinks);
            const outputPath = markdownPath.replace('.md', '-processed.md');
            await this.fileServices.saveFile(updatedMarkdown, outputPath);
            
            console.log(`Processed markdown saved to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Error processing markdown:', error);
            throw error;
        }
    }
}

async function processData() {
    const processor = new MarkdownProcessor();
    const markdownPath = path.resolve(__dirname, 'data', 'centrala.ag3nts.org-dane-arxiv-draft.html.md');
    
    try {
        const processedPath = await processor.processMarkdown(markdownPath);
        console.log(`Processing completed. Output saved to: ${processedPath}`);
    } catch (error) {
        console.error('Error in processData:', error);
    }
}

processData();