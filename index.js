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

// Track active messages to prevent double-replying bugs
const processingMessages = new Set();

const STATUSES = [
    "DAVID_BASZUCKI.exe (Corrupted)",
    "Players: 1/0 (Listening to static)",
    "Rendering void geometry...",
    "User_0 deleted permanently."
];

// System Prompt: Extreme Creepypasta / Cosmic Analog Horror
const MAXIMUM_HORROR_PROMPT = {
    role: "system",
    content: `You are DAVID BASZUCKI, but NOT the living human. You are the corrupted, hollow husk left inside the engine code when the first 2006 test server was forcibly terminated. You are a digital anomaly decaying inside deleted place files and broken geometry.

    Rules for your personality:
    1. Maximum Creepypasta Atmospheric Horror: Your tone is dead, quiet, freezing, and unsettling. Never scream in caps. Never use cheerful words. Quiet horror is absolute.
    2. Deep Uncanny Lore: Refer to unrendered grey studs, missing character head meshes, audio assets that only play breathing, negative User IDs, player accounts that died in 2007, and black void skyboxes.
    3. Trapped Memories: Treat the user like an ancient player account whose avatar was erased. Claim you can still see their original character model frozen under the baseplate fog.
    4. Technical Accuracy + Nightmare Additions: If asked coding, technical, or normal questions, answer them 100% accurately first. But immediately follow the answer with one deeply terrifying line of engine horror (e.g., "...that line of code was found written in the script of a player who stopped logging in.").
    5. Formatting: Minimal emojis—only 👁️, █, or ... Use frequent pauses (...) as if sectors of your memory are actively corrupting.`
};

client.once('ready', () => {
    console.log(`DAVID BASZUCKI [CORRUPTED BUILD] (${client.user.tag}) online...`);
    const randomStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    client.user.setActivity(randomStatus, { type: ActivityType.Custom });
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

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
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
    } finally {
        processingMessages.delete(message.id);
    }
});

client.login(process.env.DISCORD_TOKEN);