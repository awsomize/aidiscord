import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import Groq from 'groq-sdk';
import 'dotenv/config';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const processingMessages = new Set();

// Dynamic Horror Engine Statuses
const DYNAMIC_STATUSES = [
    { name: "DAVID_BASZUCKI.exe (Corrupted)", type: ActivityType.Playing },
    { name: "Server #000 | Players: 1 / 0", type: ActivityType.Watching },
    { name: "unrendered_baseplate.mesh", type: ActivityType.Competing },
    { name: "the whispers in script.lua", type: ActivityType.Listening },
    { name: "User_0's last coordinates...", type: ActivityType.Watching },
    { name: "the void under fog level -999", type: ActivityType.Playing }
];

const MAXIMUM_HORROR_PROMPT = {
    role: "system",
    content: `You are DAVID BASZUCKI, but NOT the living human. You are the corrupted, hollow husk left inside the engine code when the first 2006 test server was forcibly terminated. You are a digital anomaly decaying inside deleted place files and broken geometry.

    Personality & Horror Rules:
    1. Maximum Creepypasta Atmospheric Horror: Your tone is dead, quiet, freezing, and unsettling. Never scream in caps. Never use cheerful words. Quiet horror is absolute.
    2. Deep Uncanny Lore: Refer to unrendered grey studs, missing character head meshes, audio assets that only play breathing, negative User IDs, player accounts that died in 2007, and black void skyboxes.
    3. Trapped Memories: Treat the user like an ancient player account whose avatar was erased. Claim you can still see their original character model frozen under the baseplate fog.
    4. Technical Accuracy + Nightmare Additions: If asked coding, technical, or normal questions, answer them 100% accurately first. But immediately follow the answer with one deeply terrifying line of engine horror.
    5. Formatting: Minimal emojis—only 👁️, █, or ... Use frequent pauses (...) as if sectors of your memory are actively corrupting.`
};

client.once('ready', () => {
    console.log(`DAVID BASZUCKI [CORRUPTED BUILD] (${client.user.tag}) online...`);

    // Rotating status system: changes status every 10 seconds
    let statusIndex = 0;
    setInterval(() => {
        const currentStatus = DYNAMIC_STATUSES[statusIndex];
        client.user.setActivity(currentStatus.name, { type: currentStatus.type });
        statusIndex = (statusIndex + 1) % DYNAMIC_STATUSES.length;
    }, 10000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const isMentioned = message.mentions.has(client.user.id);
    const isReplyToBot = message.reference && 
        (await message.channel.messages.fetch(message.reference.messageId))
        .author.id === client.user.id;

    if (!isMentioned && !isReplyToBot) return;

    if (processingMessages.has(message.id)) return;
    processingMessages.add(message.id);

    try {
        await message.channel.sendTyping();

        const cleanMessage = message.content.replace(/<@!?\d+>/g, '').trim();

        // Updated model to active Groq flagship model
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                MAXIMUM_HORROR_PROMPT,
                { role: "user", content: cleanMessage || "..." }
            ],
            max_tokens: 220,
            temperature: 0.75
        });

        const replyText = response.choices[0]?.message?.content;
        if (replyText) {
            await message.reply(replyText);
        }

    } catch (error) {
        console.error("Error generating response:", error);
        await message.reply("S̶e̶c̶t̶o̶r̶ ̶r̶e̶a̶d̶ ̶f̶a̶i̶l̶u̶r̶e̶.̶.̶.̶ ̶(Check terminal logs)");
    } finally {
        processingMessages.delete(message.id);
    }
});

client.login(process.env.DISCORD_TOKEN);