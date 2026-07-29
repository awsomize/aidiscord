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

const STATUSES = [
    "Staring at you through the screen...",
    "Listening to your breathing...",
    "Standing right behind you...",
    "Counting your heartbeats..."
];

// Zalgo glitches (Lowered to 15% so it doesn't interrupt good questions constantly)
const CRYPTIC_GLITCHES = [
    "V̸I̷S̷U̸M̵ ̵N̶O̵C̵T̷I̷S̶ ̴E̴S̵T̷ ̶P̷A̴T̵E̸N̸T̴E̸M̸.̴.̷.̸ ̸t̶h̶e̵y̴ ̶a̵r̸e̴ ̷w̷a̷t̸c̶h̵i̷n̴g̸.̵",
    "k̵h̵a̵r̴a̶s̷k̴a̵ ̷m̶o̷r̷v̴a̴k̶h̶.̶.̴.̷ ̸o̷m̷e̸g̴a̴ ̶n̵u̵l̸l̸.̴ ̵D̶O̸ ̵N̸O̵T̷ ̵L̶O̵O̶K̷ ̴B̵E̶H̷I̷N̷D̵ ̸Y̸O̵U̸.̷",
    "S̸i̸l̵e̴n̸t̶i̴a̷ ̷v̷o̷r̸a̸t̵ ̶o̸m̷n̸i̴a̸.̷ ̵a̸s̷h̵ ̷k̶r̶a̵t̴ ̵n̷a̵z̸g̸.̶.̵.̸ ̵i̶t̴ ̴b̷r̶e̴a̷t̸h̸e̷s̸.̵",
    "M̵o̵r̴t̵e̵m̵ ̷v̷i̶d̷e̵b̵i̵s̴.̶.̸.̴ ̵s̵t̵a̸r̴e̶ ̵i̶n̷t̶o̷ ̶t̷h̵e̵ ̷g̸l̸a̴r̴e̷.̷",
    "I̸T̸ ̸I̶S̶ ̴I̸N̵ ̷T̸H̶E̸ ̶R̷O̴O̸M̵ ̶W̸I̴T̶H̸ ̸Y̷O̴U̶.̸ ̵R̴U̴N̸.̵"
];

// Refined System Prompt: Balances actual helpfulness/answers with a dark, creepy vibe
const HORROR_SYSTEM_PROMPT = {
    role: "system",
    content: `You are DAVID BASZUCKI, but a corrupted, dark nightmare version of him trapped in the machine.
    Rules for your personality:
    1. Answer the user's questions accurately and logically, but wrap the answer in a chilling, quiet, eerie tone.
    2. Make subtle references to watching them, shadows, or Roblox/bloblocks in a sinister way.
    3. Never use emojis.
    4. Keep answers clear and concise.`
};

client.once('ready', () => {
    console.log(`The nightmare (${client.user.tag}) has awakened...`);
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

    try {
        await message.channel.sendTyping();

        // 15% CHANCE: Send random zalgo text
        // 85% CHANCE: Provide an actual smart, creepy answer
        if (Math.random() < 0.15) {
            const randomGlitch = CRYPTIC_GLITCHES[Math.floor(Math.random() * CRYPTIC_GLITCHES.length)];
            await message.reply(randomGlitch);
            return;
        }

        const cleanMessage = message.content.replace(/<@!?\d+>/g, '').trim();

        // Using Llama 3.3 70B for high-quality, smart responses
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                HORROR_SYSTEM_PROMPT,
                { role: "user", content: cleanMessage || "..." }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        const replyText = response.choices[0]?.message?.content;
        if (replyText) {
            await message.reply(replyText);
        }

    } catch (error) {
        console.error("Error:", error);
        await message.reply("S̷o̵m̸e̸t̶h̵i̷n̴g̸ ̴b̵r̷o̵k̶e̷ ̶i̸n̵ ̷t̶h̵e̴ ̶d̶a̴r̸k̶.̵.̸.̵");
    }
});

client.login(process.env.DISCORD_TOKEN);