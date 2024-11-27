async function saveFileFromUrl(url) {
    const response = await axios.get(url);

    await fs.writeFile('barbara.txt', response.data)
    console.log(response.data);
    return response.data;
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
        });

        console.log("OpenAI:", completion.choices[0].message.content);
        return completion.choices[0].message.content
    } catch (error) {
        console.error("Error during openAIRequest: ", error);
    }
}