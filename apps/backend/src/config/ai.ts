import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey : process.env.GOOGLE_API_KEY 
})

const genai = ai.chats.create({
    model : "gemini-2.5-flash"
})

export default genai