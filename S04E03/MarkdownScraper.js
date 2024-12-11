
import { config } from './config.js';
import FirecrawlApp from '@mendable/firecrawl-js';
import { FileServices } from './FileServices.js';
import { URL } from 'url';

export class MarkdownScraper {

    constructor() {    
        if (!config.firecrawlApikey) {
            throw new Error('Firecrawl API key is not configured');
        }
        this.firecrawlApikey = config.firecrawlApikey;
        this.fileService = new FileServices();
        this.app = new FirecrawlApp({ apiKey: this.firecrawlApikey });
    }

    async getMarkdownFromUrl(url) {

        try {
            console.log('Attempting to scrape URL:', url); // Debug log

            const scrapeResponse = await this.app.scrapeUrl(url, {
                formats: ['markdown', 'links'],
                onlyMainContent: false,
              });
              
              if (!scrapeResponse.success) {
                throw new Error(`Failed to scrape: ${scrapeResponse.error}`)
              }
              
            const fileMarkdownName = `${url.split('://')[1]}.md`.replace(/\//g, '-')
            const fileLinksName = `links-${url.split('://')[1]}.json`.replace(/\//g, '-')
            await this.fileService.saveFile(scrapeResponse.links, `./data/${fileLinksName}`);
            await this.fileService.saveFile(scrapeResponse.markdown, `./data/${fileMarkdownName}`);
            console.log(`Content saved to ${fileMarkdownName}`);

            return {markdown: scrapeResponse.markdown, links: scrapeResponse.links}
    
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                statusCode: error.statusCode,
                url: url
            })  ;
        }
    }

    formatUrl(url) {
        try {
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }
            
            url = url.replace(/\/$/, '');
            const domain = new URL(url).hostname.replace(/^www\./, '');
            const isDomainAllowed = this.allowedDomains.find(d => d.url === domain);

            if (isDomainAllowed) {
                return url;
            } else {
                throw new Error(`Domain ${domain} is not allowed`);
            }  

        } catch (error) {
            throw new Error(`Invalid URL format: ${url}`);
        }
    }
}
