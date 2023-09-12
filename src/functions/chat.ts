import chatSocket from '../resources/chat.websocket';
import dbAccess from '../resources/db.collection';
import botTopic from '../resources/bot.topic';
import Message from '../types/message';
import chatApi from '../resources/chat.api';
import { promises as fs } from "fs";

const bot = botTopic.for('publishing');
const db = dbAccess.for('reading', 'writing', 'deleting');

chatApi.get("/", async (ctx) => {
    // Read the component and serve with the websocket address
    const wsAddress = await chatSocket.url();

    const chatComponent = (await fs.readFile('dist/chat.mjs')).toString();
    let renderedComponent = chatComponent.replace(
        '$$ADDRESS_PLACEHOLDER$$',
        wsAddress
    );

    ctx.res.headers['Access-Control-Allow-Origin'] = ['*'];
    ctx.res.headers['Content-Type'] = ["application/javascript"];
    ctx.res.body = renderedComponent;
});

chatSocket.on('connect', async (ctx) => {
  // create the connection
  await db.doc(ctx.req.connectionId).set({
    history: [],
  });
});

chatSocket.on('disconnect', async (ctx) => {
  const connectionDoc = db.doc(ctx.req.connectionId);

  // delete the connection
  await connectionDoc.delete();
});

chatSocket.on('message', async (ctx) => {
  const chatDoc = db.doc(ctx.req.connectionId);
  const { history } = await chatDoc.get();

  const message: Message = {
    from: "user",
    message: ctx.req.text(),
  }

  await db.doc(ctx.req.connectionId).set({
    history: [
        ...history,
        message
    ]
  });

  // Get the bot to start a response
  await bot.publish({ connectionId: ctx.req.connectionId });

  // Acknowledge receipt of the message by sending it back
  await chatSocket.send(ctx.req.connectionId, message);
});
