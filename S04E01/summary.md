# Application Overview

## Problem Statement
The application addresses the following challenges:
1. **Damaged Images**: The central repository contains damaged photographs that may or may not include the target individual, Barbara. The images may have issues such as noise, distortion, or other artifacts that hinder recognition.
2. **Identification**: There is uncertainty about Barbara's appearance, making it difficult to identify her in the photographs.
3. **Image Processing**: The application needs to improve the quality of the images using various processing techniques (e.g., repair, darken, brighten) to enhance the chances of identifying Barbara.
4. **Automated Workflow**: The application should automate the process of analyzing images, applying necessary corrections, and generating a description without requiring manual intervention.

## Application Flow
The application follows a structured flow to achieve its objectives:

1. **Initialization**:
   - The application starts by sending a request to the central repository to retrieve the damaged photographs.
   - The response includes a list of image URLs and instructions for processing.

2. **Response Analysis**:
   - The application analyzes the initial response to extract relevant information, including the base URL for images, filenames, and available processing commands (e.g., REPAIR, DARKEN, BRIGHTEN).
   - This information is structured into a format that the application can use for further processing.

3. **Photo Initialization**:
   - Each photo is initialized in a data structure (e.g., a map) that holds its filename, URLs, processing status, and other relevant metadata.
   - The application prepares to process each photo based on its current state.

4. **Image Processing Loop**:
   - For each photo, the application enters a loop where it performs the following steps:
     - **Image Analysis**: The application fetches the current image (usually a smaller version for efficiency) and analyzes it using an AI model to determine its quality and any necessary actions (e.g., REPAIR).
     - **Action Application**: If the analysis suggests actions, the application applies the recommended processing commands to the image.
     - **Response Handling**: After processing, the application analyzes the response to determine if the processing was successful and to extract new image URLs.
     - **Update Photo Metadata**: The application updates the photo's metadata (e.g., URLs, version number) based on the results of the processing.

5. **Completion Check**:
   - The loop continues until the photo is marked as processed (i.e., no further actions are needed).
   - The application keeps track of the version of each photo to ensure that the latest processed version is used.

6. **Final Description Generation**:
   - Once all photos are processed, the application filters the results to identify which images could potentially contain Barbara based on confidence levels from the analysis.
   - A detailed description of Barbara is generated based on the identified images, including physical characteristics and distinctive features.

7. **Submission**:
   - Finally, the application submits the generated description back to the central repository or another endpoint for further use.

## Summary
The application automates the process of analyzing and improving damaged photographs to identify a specific individual. By leveraging AI for image analysis and processing, it aims to enhance the qualgitity of the images and generate a comprehensive description of Barbara, facilitating her identification. The structured flow ensures that each step is handled efficiently, allowing for a seamless user experience.

###PROPONOWANE ROZWIĄZANIE

//inicjalizacja zapytania funkcją start()
//później odpowiedź od API jest automatycznie przekazywana do agenta

// <prompt1>

// analizowanie zdjęcia: jakie poprawki należy wprowadzić 
// zwrócić akcje do wykonania dla zdjęcia 
// JSON {_thinking: "", filename: "", action: ""}

//toolkit:
// REPAIR NAZWA_PLIKU
// DARKEN NAZWA_PLIKU
// BRIGHTEN NAZWA_PLIKU

// agent powinien analizować czy na którym z podanych zdjęć jest Barbara
// jeśli nie da się tego stwierdzić: wprowadzić poprawki do zdjęć
// jeśli zdjęcie jest gotowe: flaga readyToDescribe: true
// isBarbara: true


// <prompt2>
// przekazać zdjęcia, gdzie readyToDescribe i isBarbara === true
// drugi agent przygotowuje rysopis

//jeśli rysopis jest ready: wysyłanie zapytania


//TODO:

// przeanalizować projekt TODO
// na podstawie działania tej aplikacji pomoc w zaprojektowaniu agenta do rozpozwania zdjęć
// przygotowanie założeń do promptów
// wygenerować prompty na podstawie metapromptu
// wygenerowanie kodu aplikacji


###PROMPTS STRUCTURE SUGGESTED BY PROMPT FLOW DESIGN

Prompt Flow Design for AI Agent Application

To effectively integrate both code and LLM-based prompts in your application flow, we need to ensure that LLM interactions are reserved for tasks requiring natural language understanding or decision-making. Here's a refined prompt flow aligned with your requirements, focusing on LLM use only where appropriate and offloading structural tasks to code.

Prompt Flow Design for Processing and Analyzing Damaged Photographs:

Step 1 - Initialization and Image Retrieval (Code-Driven)

Use code to send a request to the central repository (Centrala) to obtain damaged photographs.
Parse the initial natural language response to extract image URLs or names and the base URL.
Structure this data into an internal format for further processing.
Step 2 - Response Analysis for Initial Image Processing (LLM Involvement) Explanation: Use LLM to interpret Centrala responses regarding image processing results.

Prompt 1 - Natural Language Processing of Centrala Responses Essential Tasks:

LLM analyzes responses after processing requests to understand the outcome: success, URL/name retrieval, or issue/error message.
Identify recommended actions from responses if an error suggests alternative approaches.
Step 3 - Image Processing and Quality Check (Code-Driven with LLM Decision)

Image Processing Loop (Code Driven)

For each image, initiate code to fetch the image using the base URL and filename or complete URL.
Apply image-processing techniques as determined by previous analysis (e.g., REPAIR, DARKEN, BRIGHTEN).
Prompt 2 - Quality Assessment (LLM Involvement) Explanation: Use LLM to assess the quality of processed images. Essential Tasks:

LLM determines if processed images are of sufficient quality for describing content.
Identify whether further processing is needed or if images are ready for final description.
Step 4 - Detailed Analysis and Description Generation (LLM Involvement)

Prompt 3 - Detailed Image Description Generation Essential Tasks:

LLM analyzes high-quality images to generate a detailed description of content, focusing on identifying Barbara's features and characteristics.
Ensure the description is detailed, including all relevant visible traits.
Step 5 - Submission of Results (Code-Driven)

Utilize code to submit the generated description back to the central repository or another endpoint.
Implement checks to ensure submission success and handle any needed follow-up requests.
Summary: By distinctly separating coding tasks and LLM tasks, your application can efficiently leverage the LLM for natural language understanding and decision-making, while relying on code for structured data management and routine processing. This approach enhances performance, ensuring effective analysis and description generation based on processed images.

