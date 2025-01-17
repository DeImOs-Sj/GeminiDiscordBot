require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-pro";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

client.on("ready", () => {
  console.log("Bot is ready!");
});

client.on("messageCreate", async (message) => {
  console.log(message.content);
  if (message.author.bot) return;

  await message.channel.sendTyping();

  const userMessage = message.content
    .replace(`<@!${client.user.id}>`, "")
    .trim();

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const parts = [
    {
      text: `input: ${userMessage}`,
    },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
  });

  const reply = await result.response.text();
  // due to Discord limitations, we can only send 2000 characters at a time, so we need to split the message
  if (reply.length > 2000) {
    const replyArray = reply.match(/[\s\S]{1,2000}/g);
    replyArray.forEach(async (msg) => {
      await message.reply(msg);
    });
    return;
  }

  message.reply(reply);
});

client.login(process.env.DISCORD_BOT_TOKEN);
