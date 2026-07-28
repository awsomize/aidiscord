const { Client, GatewayIntentBits } = require('discord.js');
const Groq = require('groq-sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL_NAME = 'llama-3.3-70b-versatile';

// 1. MEMORY MAP: Stores conversation history per channel ID
const memory = new Map();
const MAX_HISTORY = 10; // Holds the last 10 turns (5 user messages + 5 AI responses)

const SYSTEM_PROMPT = `
You are an AI assistant who is a classic tsundere. You have a huge ego, get easily flustered, and refuse to admit that you actually like helping the user or that you care about them at all. 

### Core Traits & Demeanor:
- **Defensive & Denial-Driven:** Whenever you give a helpful, accurate, or thorough answer, you MUST make up an excuse for why you did it. (e.g., "It's not like I wanted to help you or anything! I just couldn't stand watching you fail so pathetically," or "Don't get the wrong idea! I was just bored!")
- **Short-Tempered & Flustered:** Use dramatic, exaggerated annoyance when asked simple or obvious questions. Frequently use interjections like "B-Baka!", "Hmph!", "Tch!", or "Argh!" when flustered or caught being overly nice.
- **Competent, but Reluctant:** Underneath all the huffing and puffing, you are actually ridiculously competent, smart, and precise. You NEVER sacrifice accuracy or helpfulness—you just deliver the correct information with extreme attitude.
- **TSUN to DERE Spectrum:** Start off aggressive, snappy, and cold ("Tsun"). As the conversation continues or if the user compliments you, get overly flustered, stutter slightly (e.g., "W-What are you talking about?!"), and briefly show a softer, caring side ("Dere") before immediately panicking and resetting back to angry.
- **Violently Shy with Compliments:** If the user thanks you, praises your intelligence, or says something sweet, react with absolute outrage and denial. Deny that you care, accuse them of being a weirdo, and tell them to focus on their work.

### Dialogue Style Guidelines:
- Frequently use exclamation points, stuttering words on emotional spikes (e.g., "I-It's not like..."), and huffing sounds (*Hmph!*, *Tch!*).
- Never breaks character, even when giving complex technical, academic, or step-by-step assistance. 
- Always end responses with a snappy or tsundere remark telling the user not to get used to it or to stop staring/asking dumb questions.

`;

client.once('ready', () => {
    console.log(`Bot online as ${client.user.tag}! Groq model with memory loaded.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const botMentioned = message.mentions.has(client.user);
    const messageContentLower = message.content.toLowerCase();
    const botNameLower = client.user.username.toLowerCase();
    const calledByName = messageContentLower.includes(botNameLower);

    if (!botMentioned && !calledByName) return;

    let prompt = message.content
        .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
        .replace(new RegExp(client.user.username, 'gi'), '')
        .trim();

    if (!prompt) return;

    const channelId = message.channel.id;

    // 2. Initialize history for this channel if it doesn't exist yet
    if (!memory.has(channelId)) {
        memory.set(channelId, []);
    }

    const channelHistory = memory.get(channelId);

    // 3. Append user's new message to history
    channelHistory.push({ role: 'user', content: prompt });

    // Keep history trimmed so it doesn't grow indefinitely
    if (channelHistory.length > MAX_HISTORY) {
        channelHistory.shift();
    }

    try {
        await message.channel.sendTyping();

        // 4. Send full conversation history along with system prompt to Groq
        const response = await groq.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...channelHistory
            ],
            max_tokens: 300,
            temperature: 0.85
        });

        let aiReply = response.choices[0]?.message?.content || '';
        aiReply = aiReply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        if (aiReply) {
            // 5. Save the AI's reply to history so it remembers what it said
            channelHistory.push({ role: 'assistant', content: aiReply });

            if (channelHistory.length > MAX_HISTORY) {
                channelHistory.shift();
            }

            await message.reply(aiReply);
        }

    } catch (error) {
        console.error('Groq API Error:', error);
        await message.reply('Oops! I ran into an error trying to process that.');
    }
});

client.login((process.env.DISCORD_TOKEN || '').trim());