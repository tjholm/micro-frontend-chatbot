import botTopic from "../resources/bot.topic";
import chatWebsocket from "../resources/chat.websocket";
import Message from "../types/message";
import dbCollection from "../resources/db.collection";
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from "openai";

const db = dbCollection.for('reading');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new OpenAIApi(configuration);

// Default system prompt
// XXX: Customise this and add embeddings as needed
const PROMPT = "You're chatbot gpt a useful assistant to provide general help and conversation";
const MODEL = "gpt-4";
const MAX_TOKENS = 500;

botTopic.subscribe(async ctx => {
    // Load chat history...
    const { connectionId } = ctx.req.json().payload;

    const { history } = await db.doc(connectionId).get();

    const completion = await client.createChatCompletion({
        model: MODEL,
        messages: [{
            "role": ChatCompletionRequestMessageRoleEnum.System,
            "content": PROMPT,
        }, ...history.map(h => ({
            "role": h.from,
            "content": h.message,
        }))],
        max_tokens: MAX_TOKENS,
    });

    // add the message to history
    const message = completion.data.choices[0].message.content;

    // update the chat history
    await db.doc(connectionId).set({
        history: [
            ...history,
            {
                from: "assistant",
                message,
            },
        ]
    });

    // respond
    await chatWebsocket.send(connectionId, {
        from: "assistant",
        message: completion.data.choices[0].message.content,
    } as Message);
});