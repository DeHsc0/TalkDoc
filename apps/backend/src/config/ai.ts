import { GoogleGenAI } from "@google/genai";
import z from "zod";
import {createAgent} from "langchain"
import { embeddings, qdrantClient } from "@repo/config"
import {  RedisSaver } from "@langchain/langgraph-checkpoint-redis"
import { ChatDeepSeek } from "@langchain/deepseek"
import { tool } from "langchain"
import type { ToolRuntime } from "langchain";

const model = new ChatDeepSeek({ model : "deepseek-flash"})

const contextSchema = z.object({
  userId: z.string(),
  docId : z.string()
});

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

const retrieveContext = tool(async ({ searchQuery } , runtime : ToolRuntime<any , typeof contextSchema> ) => {

  const results = await qdrantClient.search("docs", {
      vector: await embeddings.embedQuery( searchQuery),
      limit: 5,
      filter: {
          must: [
              {
                  key: "metadata.docId",
                  match: { value:  runtime.context.docId }
              },
              {
                  key: "metadata.userId",
                  match: { value:  runtime.context.userId }
              }
          ]
      }
  })

  const context = results.map((e) => {
      return {
          id : e.id,
          contents : e.payload?.content
      }
  })

  return context

} , { name : "retrieveContext" , description : "Search through the docs for relevant information" , schema : z.object({ searchQuery : z.string() }) })

const agent = createAgent({
  model,
  systemPrompt:`So you are an helpfull ai which answers users questions based on the inputs and user dosent know abou the relevant chunks or past messages so just answer what he asks based on the inputs

                InputSchema : {

                    context : {

                        type : string,
                        description : Contains the relavant chunks of the document about which the users is asking questions

                    },
                    pastMessages : {

                        type : string,
                        description :  contains your past conversations with the user
                    },
                    userQuery : {
                        type : string,
                        description : user query                    
                    }
                
                }

                outputSchema : {
                    id : {
                        type : uuid,
                        description : id of the most relavant chunk provided in the context 
                        example : 1a7be80a-c57f-4ef2-8bb2-a4b79e66f1a6                    
                    },
                    text : {
                        type : string,
                        description : answer to user's question
                    }
                }`,
  tools: [ retrieveContext ],
  checkpointer: await RedisSaver.fromUrl(process.env.REDIS_URL || "" , { defaultTTL : 3600 } ),
  responseFormat : aiResponseSchema,
  contextSchema
})


export { aiResponseSchema , agent , model }
