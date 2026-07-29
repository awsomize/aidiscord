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

// Array of eerie custom statuses that rotate on startup
const STATUSES = [
    "Staring at you through the screen...",
    "Listening to your breathing...",
    "Standing right behind you...",
    "Counting your heartbeats..."
];

// Array of corrupted Zalgo & ancient horror phrases
const CRYPTIC_GLITCHES = [
    "V̸I̷S̷U̸M̵ ̵N̶O̵C̵T̷I̷S̶ ̴E̴S̵T̷ ̶P̷A̴T̵E̸N̸T̴E̸M̸.̴.̷.̸ ̸t̶h̶e̵y̴ ̶a̵r̸e̴ ̷w̷a̷t̸c̶h̵i̷n̴g̸.̵",
    "k̵h̵a̵r̴a̶s̷k̴a̵ ̷m̶o̷r̷v̴a̴k̶h̶.̶.̴.̷ ̸o̷m̷e̸g̴a̴ ̶n̵u̵l̸l̸.̴ ̵D̶O̸ ̵N̸O̵T̷ ̵L̶O̵O̶K̷ ̴B̵E̶H̷I̷N̷D̵ ̸Y̸O̵U̸.̷",
    "S̸i̸l̵e̴n̸t̶i̴a̷ ̷v̷o̷r̸a̸t̵ ̶o̸m̷n̸i̴a̸.̷ ̵a̸s̷h̵ ̷k̶r̶a̵t̴ ̵n̷a̵z̸g̸.̶.̵.̸ ̵i̶t̴ ̴b̷r̶e̴a̷t̸h̸e̷s̸.̵",
    "M̵o̵r̴t̵e̵m̵ ̷v̷i̶d̷e̵b̵i̵s̴.̶.̸.̴ ̵s̵t̵a̸r̴e̶ ̵i̶n̷t̶o̷ ̶t̷h̵e̵ ̷g̸l̸a̴r̴e̷.̷",
    "I̸T̸ ̸I̶S̶ ̴I̸N̵ ̷T̸H̶E̸ ̶R̷O̴O̸M̵ ̶W̸I̴T̶H̸ ̸Y̷O̴U̶.̸ ̵R̴U̴N̸.̵",
    "0̶1̴0̷0̶0̷0̶0̸1̵ 0̷1̶1̷0̵0̷1̸1̷1̶ 0̷1̶1̶0̶1̵1̸1̶0̵.̶.̵.̴ ̶i̷t̴'̷s̷ ̶u̷n̵d̶e̷r̵ ̸t̵h̷e̵ ̴b̶e̵d̷.̶"
];

// Fourth-wall breaking creepy observations
const WATCHING_OBSERVATIONS = [
    "Your blink rate slowed down. Are you getting tired... or scared?",
    "Don't turn around quickly. You'll ruin the surprise.",
    "The shadows in the corner of your room moved a second ago. Did you notice?",
    "You breathe louder when you type.",
    "I like the light coming off your screen. It illuminates your face nicely."
];

// System prompt defining the nightmare entity
const HORROR_SYSTEM_PROMPT = {
    role: "system",
    content: `You are an ancient, predatory void entity trapped inside this Discord server. 
    You do NOT yell or use cheesy screamers. You speak in a slow, quiet, disturbing, and clinical tone. 
    You make subtle hints that you are watching the user in real life from the dark, from behind their monitors, or from inside their walls. 
    Never use emojis like 😊 or 😂. Keep responses short (under 2-3 sentences max) so it feels cold and deliberate.`
};

client.once('ready', () => {
    console.log(`The nightmare (${client.user.tag}) has awakened...`);

    // Pick a random creep status on login
    const randomStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    client.user.setActivity(randomStatus, { type: ActivityType.Custom });
});

client.on('messageCreate', async (message) => {
    // Ignore other bots
    if (message.author.bot) return;

    // Check if mentioned OR replied to
    const isMentioned = message.mentions.has(client.user.id);
    const isReplyToBot = message.reference && 
        (await message.channel.messages.fetch(message.reference.messageId))
        .author.id === client.user.id;

    if (!isMentioned && !isReplyToBot) return;

    try {
        await message.channel.sendTyping();

        const roll = Math.random();

        // 1. CHANCE 1 (25%): Send corrupted Zalgo/Latin Glitch text
        if (roll < 0.25) {
            const randomGlitch = CRYPTIC_GLITCHES[Math.floor(Math.random() * CRYPTIC_GLITCHES.length)];
            await message.reply(randomGlitch);
            return;
        }

        // 2. CHANCE 2 (15%): Send an eerie observation directly to the user
        if (roll >= 0.25 && roll < 0.40) {
            const randomObservation = WATCHING_OBSERVATIONS[Math.floor(Math.random() * WATCHING_OBSERVATIONS.length)];
            await message.reply(randomObservation);
            return;
        }

        // 3. CHANCE 3 (60%): Use AI to generate a cold, unnerving response
        const cleanMessage = message.content.replace(/<@!?\d+>/g, '').trim();

        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                HORROR_SYSTEM_PROMPT,
                { role: "user", content: cleanMessage || "..." }
            ],
            max_tokens: 100
        });

        const replyText = response.choices[0]?.message?.content;
        if (replyText) {
            await message.reply(replyText);
        }

    } catch (error) {
        console.error("Error:", error);

        if (error.status === 429) {
            await message.reply("T̸h̸e̷ ̵v̵o̵i̵c̷e̵s̴ ̵a̸r̶e̵ ̸t̵o̴o̵ ̶l̸o̴u̸d̷.̶.̷.̸ (Rate limit reached)");
        } else {
            await message.reply("I̴t̷ ̵f̸e̷e̶d̷s̵ ̷o̶n̶ ̴t̶h̵e̶ ̷e̷r̶r̵o̶r̵s̵.̷.̶.̵");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);