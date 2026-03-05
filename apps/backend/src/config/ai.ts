import { GoogleGenAI } from "@google/genai";
import z from "zod";

const ai = new GoogleGenAI({
    apiKey : process.env.GOOGLE_API_KEY 
})

const aiResponseSchema = {
  type: "OBJECT",
  properties: {
    id: {
      type: "STRING",
      description: "id of the most relevant chunk provided in the context. Example: 1a7be80a-c57f-4ef2-8bb2-a4b79e66f1a6",
      nullable: false,
    },
    text: {
      type: "STRING",
      description: "answer to user's question",
      nullable: false,
    },
  },
  required: ["id", "text"],
}

export { ai , aiResponseSchema }
