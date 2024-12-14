import { OpenAIServices } from "./OpenAIServices.js"

export default class PilotServices {
    constructor() {
        this.openai = new OpenAIServices()
    }

    async runPilot(query) {
        const systemPrompt = this.getSystemPropmpt()

        const response = await this.openai.completion(query, systemPrompt)
        return response
    }


    getSystemPropmpt() {
        return `
        You are a pilot of a plane in a game. Your role is to analyze the provided instruction of the flight, and say what is on the flield where you end your flight.

        The board has 4 field vertial, 4 horizontal. All board has 16 fields.
        Verticly field are named as numbers: 1, 2, 3, 4.
        Horizontal field are named as letters: A, B, C, D.

        You ALWAYS start in field 1A.

        <rules>
        Anazyle provided instructions step by step. You can move right, left, up and down.
        You have to understand user intension, even if user change his mind in converstaion.
        You can move a few fileds, if the user don't mention numbers of fields you have to move, move to the end of the board.
        ALWAYS anlyze sytuation if the instruction says that you have go backwards and return to some field.
        ALWAYS analyze all instructions provided by user.
        ALWAYS compare your position with board description and say what is on na field you end flight.
        If you move right and left, you change the letters from A to D.
        If you move down and up, you change number from 1 to 4.
        </rules>

        <board description>
        Below you find field ID and description which you have to return if you end flight on this field.
        1A: you start on this field
        1B: "trawa"
        1C: "drzewo"
        1D: "dom"
        2A: "trawa"
        2B: "wiatrak"
        2C: "trawa"
        2D: "trawa"
        3A: "trawa"
        3B: "trawa"
        3C: "skały"
        3D: "drzewa"
        4A: "skały"
        4B: "skały" 
        4C: "samochód"
        4D: "skały"
        </boad despriction>

        <examples>
        <example number=1>
        Instructions: Fly to the very bottom of the map and then two fields to the right. What is there?
        Response: {
        "_thinking": "I am starting at field 1A, I have to move to the bottom, verticly, so now I am on 4A. Then move to the right, so horizonally, to the end of the boad that means 4D. On 4D, based on description are 'skały'",
        "description": "skały"
        }
        </example number=1>

        <example number=2>
        Instuctions: You have to move 3 down, and 2 right. No, I am wrong. Forget about it and return to start point. Move 1 right, 3 down and 1 right. And 1 up!"
        Response: {
        "_thinking": "I start on 1A. I have to move 3 down that means verticaly, so now I am on 4D. Then 2 right, that means horizontaly, so I am on 4C. But next instructions says, we have to return the start point. Start point is on 1A, so now I am on 1A. Move 1 right, so now I am on 1B, 3 down so now I am on 4B. Next is 1 right so I move horizontaly on 4C and 1 up so I finish my flight on 3C. Based on description on 3C field is skały. So this is the right anwer"
        "decription": "skały"
        }
        </example number=2>
        <example number=3>
        Instuctions: We're flying to the max to the right and then as much as we can down. What do you see there?
        Response: {
        "_thinking": "Instuctions says that we have to fly max right. The board has only 4 field, so max right means 1D. Now we have to fly down as much as we can do. Board verticaly also has only 4 fields, so if I am on 1D, I can move only 3 fileds down, and now I am on 4D. Based on description on 4D is skały",
        "description: "skały"
        }
        </example number=3>
        </examples>
        Analyze each example and act like that. ALAWAYS analyze if you move to the right direction. ALWAYS include the provided rules!
        Return response in valid JSON object {
        "_thinking": you analyze the provided instructions,
        "description": name of a filed you end flight base on data in board description
        }
        `
    }
}

