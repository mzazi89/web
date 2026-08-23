-- QUARTZ XD — live-DB command updates
-- Run ONCE in the Neon SQL console against the shared database.
-- FIX: usage strings now interpolate ${prefix}/${command} (were single-quoted,
-- printing the literal text). 332 commands updated.

-- antilink
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isAdmin && !isOwner) return mzazireply("❌ Admins only!");
        const sub = args[0]?.toLowerCase();
        const validModes = [''delete'', ''warn'', ''kick'', ''off''];
        if (!sub || !validModes.includes(sub)) {
          const cur = getGroupSettings(sender).antilink || ''off'';
          return mzazireply(
            `🔗 *ANTILINK*\n\nCurrent mode: *${cur.toUpperCase()}*\n\n` +
            `Usage: ${prefix}antilink <mode>\n\n` +
            `Modes:\n• *delete* - Delete links silently\n• *warn* - Warn sender (3 warns = kick)\n• *kick* - Kick sender immediately\n• *off* - Disable antilink`
          );
        }
        setGroupSetting(sender, ''antilink'', sub);
        const modeEmoji = { delete: ''🗑️'', warn: ''⚠️'', kick: ''👢'', off: ''❌'' };
        mzazireply(`🔗 *ANTILINK* ${sub === ''off'' ? ''❌ DISABLED'' : ''✅ ENABLED`}\n\nMode: ${modeEmoji[sub]} *${sub.toUpperCase()}*\n${sub === `warn'' ? ''\n⚠️ 3 warnings = auto-kick'' : ''''}`);
return;'
WHERE name = 'antilink';

-- delcase
UPDATE bot_commands SET code = 'try {

if (!isOwner) {
return mzazireply("❌ Owner only");
}

if (!text) {
return mzazireply(`Example: ${prefix}delcase play`);
}

const fs = require("fs");

const filePath = "./case.js";

let data = fs.readFileSync(filePath, "utf8");

const regex = new RegExp(
`case [``]${text}[``]:\\s*\\{[\\s\\S]*?break;`,
"g"
);

if (!regex.test(data)) {
return mzazireply(`❌ Case *${text}* not found`);
}

const updated = data.replace(regex, "");

fs.writeFileSync(filePath, updated);

mzazireply(`✅ Case *${text}* deleted successfully`);

} catch (e) {

logger.info(e);

mzazireply("❌ Failed to delete case");

}'
WHERE name = 'delcase';

-- date
UPDATE bot_commands SET code = 'const d = new Date();
        const options = { weekday:"long", year:"numeric", month:"long", day:"numeric" };
        mzazireply(`📅 *TODAY''S DATE*\n\n${d.toLocaleDateString("en-US`, options)}\n📆 Week ${Math.ceil(d.getDate()/7)} of ${d.toLocaleString(`default",{month:"long"})}`);
return;'
WHERE name = 'date';

-- story
UPDATE bot_commands SET code = 'const stories = [`Once upon a time, a brave warrior named ${botName} fought a dragon made of broken code. With one command, the dragon was defeated and peace returned to the WhatsApp realm. 🐉⚔️`,"In a land of 0s and 1s, a tiny bot dreamed of being human. It learned, it grew, and one day it sent a message that made an entire group laugh for hours. 🤖❤️","A wise old bot sat at the edge of the internet. When users came with questions, it answered. When they came with sadness, it shared jokes. That bot was loved by all. 🌟","Long ago, before WhatsApp groups existed, people had to shout their messages across villages. Then came the bot — and changed everything forever. 📣💫"];
        mzazireply(`📖 *RANDOM STORY*\n\n${stories[Math.floor(Math.random() * stories.length)].replace(`${botName}`, botName)}`);
return;'
WHERE name = 'story';

-- antisticker
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isAdmin && !isOwner) return mzazireply("❌ Admins only!");
        const sub = args[0]?.toLowerCase();
        const validStickerModes = [''delete'', ''warn'', ''kick'', ''off''];
        if (!sub || !validStickerModes.includes(sub)) {
          const cur2 = getGroupSettings(sender).antisticker || ''off'';
          return mzazireply(
            `🩹 *ANTISTICKER*\n\nCurrent mode: *${cur2.toUpperCase()}*\n\n` +
            `Usage: ${prefix}antisticker <mode>\n\n` +
            `Modes:\n• *delete* - Delete stickers silently\n• *warn* - Warn sender (3 warns = kick)\n• *kick* - Kick sender immediately\n• *off* - Disable antisticker`
          );
        }
        setGroupSetting(sender, "antisticker", sub);
        const stickerEmoji = { delete: ''🗑️'', warn: ''⚠️'', kick: ''👢'', off: ''❌'' };
        mzazireply(`🩹 *ANTISTICKER* ${sub === ''off'' ? ''❌ DISABLED'' : ''✅ ENABLED`}\n\nMode: ${stickerEmoji[sub]} *${sub.toUpperCase()}*\n${sub === `warn'' ? ''\n⚠️ 3 warnings = auto-kick'' : ''''}`);
return;'
WHERE name = 'antisticker';

-- antiimage
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isAdmin && !isOwner) return mzazireply("❌ Admins only!");
        const sub = args[0]?.toLowerCase();
        const validImgModes = [''delete'', ''warn'', ''kick'', ''off''];
        if (!sub || !validImgModes.includes(sub)) {
          const cur3 = getGroupSettings(sender).antiimage || ''off'';
          return mzazireply(
            `🖼️ *ANTIIMAGE*\n\nCurrent mode: *${cur3.toUpperCase()}*\n\n` +
            `Usage: ${prefix}antiimage <mode>\n\n` +
            `Modes:\n• *delete* - Delete images silently\n• *warn* - Warn sender (3 warns = kick)\n• *kick* - Kick sender immediately\n• *off* - Disable antiimage`
          );
        }
        setGroupSetting(sender, "antiimage", sub);
        const imgModeEmoji = { delete: ''🗑️'', warn: ''⚠️'', kick: ''👢'', off: ''❌'' };
        mzazireply(`🖼️ *ANTIIMAGE* ${sub === ''off'' ? ''❌ DISABLED'' : ''✅ ENABLED`}\n\nMode: ${imgModeEmoji[sub]} *${sub.toUpperCase()}*\n${sub === `warn'' ? ''\n⚠️ 3 warnings = auto-kick'' : ''''}`);
return;'
WHERE name = 'antiimage';

-- ai
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the following question clearly and helpfully.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'ai';

-- ask
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the following question clearly and helpfully.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'ask';

-- gpt
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the following question clearly and helpfully.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'gpt';

-- chat
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Chat with the user. Be friendly and helpful.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'chat';

-- brain
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the question with reasoning step by step.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'brain';

-- qna
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the question directly.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'qna';

-- askai
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the following question clearly and helpfully.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'askai';

-- explain
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following concept in simple, easy-to-understand terms.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'explain';

-- define
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Define the following word or concept precisely.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'define';

-- antonym
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give antonyms for the following word.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'antonym';

-- translate
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into English.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translate';

-- translatefr
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into French.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translatefr';

-- translatesp
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into Spanish.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translatesp';

-- translatekis
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into Kiswahili.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translatekis';

-- translatetr
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into Turkish.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translatetr';

-- translatear
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into Arabic.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translatear';

-- translatept
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into Portuguese.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translatept';

-- translatehi
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into Hindi.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'translatehi';

-- tr
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Translate the following text into English.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'tr';

-- spell
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Correct the spelling and grammar of the following text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'spell';

-- correct
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Fix the grammar and spelling of the following text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'correct';

-- summarize
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Summarize the following text in 3-5 short bullet points.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'summarize';

-- tldr
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give a very short TL;DR of the following text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'tldr';

-- rewrite
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Rewrite the following text in a better, clearer style.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'rewrite';

-- rephrase
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Rephrase the following text with different wording.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'rephrase';

-- paraphrase
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Paraphrase the following text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'paraphrase';

-- formal
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Rewrite the following text in a formal tone.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'formal';

-- casual
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Rewrite the following text in a casual, friendly tone.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'casual';

-- emojify
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Rewrite the following text adding appropriate emojis.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'emojify';

-- deemojify
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Remove all emojis from the following text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'deemojify';

-- hashtags
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Generate 10 relevant hashtags for the following topic/text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'hashtags';

-- keywords
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Extract the most important keywords from the following text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'keywords';

-- caption
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a great social media caption for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'caption';

-- bio
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short, catchy social media bio based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'bio';

-- slogan
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create a catchy slogan for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'slogan';

-- tagline
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create a memorable tagline for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'tagline';

-- headline
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write 5 attention-grabbing headlines for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'headline';

-- titles
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Suggest 5 good titles for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'titles';

-- song
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write short song lyrics about the following topic.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'song';

-- essay
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short essay on the following topic.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'essay';

-- letter
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a polite letter about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'letter';

-- email
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a professional email about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'email';

-- replydm
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short reply message for the following context.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'replydm';

-- tweet
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a tweet (max 280 chars) about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'tweet';

-- blog
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short blog introduction about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'blog';

-- ideas
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Brainstorm creative ideas for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'ideas';

-- brainstorm
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give 5 creative ideas related to the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'brainstorm';

-- outline
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create an outline for the following topic.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'outline';

-- notes
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Convert the following into clean, organized notes.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'notes';

-- lists
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Turn the following into a clear bullet list.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'lists';

-- code
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write code to solve the following. Show the code and a short explanation.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'code';

-- codepilot
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write clean, working code for the following task.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'codepilot';

-- javascript
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write JavaScript code for the following task.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'javascript';

-- python
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write Python code for the following task.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'python';

-- html
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write HTML/CSS code for the following task.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'html';

-- sql
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write an SQL query for the following task.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'sql';

-- regex
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a regex for the following pattern description.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'regex';

-- bugfix
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Find and fix the bug in the following code.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'bugfix';

-- debug
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain what is wrong with the following code and how to fix it.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'debug';

-- review
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Review the following code and suggest improvements.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'review';

-- explaincode
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain what the following code does, line by line.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'explaincode';

-- math
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following math problem step by step.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'math';

-- calculator
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Calculate the following and show the result.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'calculator';

-- solve
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following problem with explanation.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'solve';

-- equation
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following equation.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'equation';

-- convert
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Convert the following units and show the result.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'convert';

-- units
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Convert the following units.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'units';

-- factcheck
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Fact-check the following claim.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'factcheck';

-- compare
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Compare the following two things fairly.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'compare';

-- prosandcons
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''List the pros and cons of the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'prosandcons';

-- howto
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give clear step-by-step instructions for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'howto';

-- recipe
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give a simple recipe for the following dish.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'recipe';

-- workout
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Suggest a short workout plan for the following goal.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'workout';

-- diet
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Suggest a simple healthy diet tip for the following goal.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'diet';

-- motivate
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short, powerful motivational message about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'motivate';

-- inspire
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write an inspiring message about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'inspire';

-- wish
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a warm wish for the following occasion.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'wish';

-- congrats
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a congratulation message for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'congrats';

-- apology
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a sincere apology message for the following situation.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'apology';

-- thanks
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a heartfelt thank-you message for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'thanks';

-- invite
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a friendly invitation message for the following event.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'invite';

-- pickupline
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a cheesy pickup line about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'pickupline';

-- icebreaker
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Suggest a good icebreaker question about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'icebreaker';

-- learn
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following topic as if teaching a beginner.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'learn';

-- history
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give a short history summary of the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'history';

-- science
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following science topic simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'science';

-- tech
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following tech concept simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'tech';

-- business
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give simple business advice about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'business';

-- finance
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give simple personal finance advice about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'finance';

-- health
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give general health tips about the following (not medical advice).\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'health';

-- imagine
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'imagine';

-- img
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'img';

-- draw
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'draw';

-- genimg
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'genimg';

-- aiimg
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'aiimg';

-- art
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'art';

-- poster
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'poster';

-- wallpaper
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'wallpaper';

-- logo
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'logo';

-- avatar
UPDATE bot_commands SET code = 'const p = (text || '''').trim();
if (!p) return mzazireply(`Usage: ${prefix}${command} <prompt>`);
await mzazireply(''🎨 Generating image...'');
try {
  const url = ''https://image.pollinations.ai/prompt/'' + encodeURIComponent(p) + ''?nologo=true&width=1024&height=1024'';
  const { data: buf } = await axios.get(url, { responseType: ''arraybuffer'', timeout: 60000 });
  await mzazi.sendMessage(sender, { image: Buffer.from(buf), caption: ''🎨 *AI Image*\nPrompt: '' + p }, { quoted: m });
} catch (e) { return mzazireply(''❌ Image generation failed: '' + (e.message || e)); }
return;'
WHERE name = 'avatar';

-- gpt4
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the question accurately and concisely.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'gpt4';

-- askgpt
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the question accurately.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'askgpt';

-- chatgpt
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Chat with the user helpfully.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'chatgpt';

-- writer
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write high-quality text based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'writer';

-- editor
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Edit and improve the following text.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'editor';

-- proofread
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Proofread the following text and list the fixes.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'proofread';

-- improve
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Improve the following text\''s clarity and style.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'improve';

-- draft
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Draft a message based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'draft';

-- compose
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Compose text based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'compose';

-- script
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short script based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'script';

-- dialogue
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short dialogue based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'dialogue';

-- speech
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short speech based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'speech';

-- resume
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Improve a resume bullet based on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'resume';

-- coverletter
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short cover letter for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'coverletter';

-- interview
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Generate 5 interview questions about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'interview';

-- study
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create a study summary for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'study';

-- flashcards
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Make flashcards (Q/A list) for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'flashcards';

-- teacher
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Teach the following topic simply, step by step.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'teacher';

-- tutor
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Tutor me: explain the following and give one practice question.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'tutor';

-- homework
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Help with the following homework question (explain, do not just answer).\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'homework';

-- research
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Outline a research approach for the following topic.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'research';

-- debate
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give arguments for and against the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'debate';

-- persuade
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a persuasive message about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'persuade';

-- negotiate
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Suggest a negotiation strategy for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'negotiate';

-- sales
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a sales pitch for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'sales';

-- adcopy
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write short ad copy for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'adcopy';

-- product
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a product description for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'product';

-- pitch
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write an elevator pitch for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'pitch';

-- proposal
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Draft a short proposal for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'proposal';

-- report
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short report on the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'report';

-- memo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a short memo about the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'memo';

-- minutes
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Convert the following notes into meeting minutes.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'minutes';

-- agenda
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create a meeting agenda for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'agenda';

-- followup
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a polite follow-up message for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'followup';

-- reminder
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Write a friendly reminder message for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'reminder';

-- schedule
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Help schedule a plan for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'schedule';

-- travel
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Suggest a short travel plan for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'travel';

-- itinerary
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create a travel itinerary for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'itinerary';

-- packing
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''List packing essentials for the following trip.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'packing';

-- budget
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create a simple budget for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'budget';

-- savings
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give savings tips for the following goal.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'savings';

-- invest
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain investing basics for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'invest';

-- insurance
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain insurance basics simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'insurance';

-- contract
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain what to check in the following contract (no legal advice).\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'contract';

-- security
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Give online security tips for the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'security';

-- cyber
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following cybersecurity term simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'cyber';

-- ethics
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Discuss the ethics of the following.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'ethics';

-- musica
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'musica';

-- audio
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'audio';

-- mp3
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'mp3';

-- yta
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'yta';

-- ytmp3
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytmp3';

-- ytdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytdl';

-- ytmusic
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytmusic';

-- mp4
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'mp4';

-- ytv
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytv';

-- ytmp4
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytmp4';

-- yt
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'yt';

-- youtube
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'youtube';

-- vd
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'vd';

-- vid
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'vid';

-- tiktokdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'tiktokdl';

-- tik
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'tik';

-- insta
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'insta';

-- ig
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ig';

-- igdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'igdl';

-- twitter
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'twitter';

-- twt
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'twt';

-- xdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'xdl';

-- fb
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'fb';

-- fbdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'fbdl';

-- fbvideo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'fbvideo';

-- soundcloud
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'soundcloud';

-- scdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'scdl';

-- pinterest
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'pinterest';

-- pindl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'pindl';

-- reddit
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'reddit';

-- rdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'rdl';

-- telegramvid
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'telegramvid';

-- dailymotion
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'dailymotion';

-- vimeo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'vimeo';

-- movie
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'movie';

-- trailer
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'trailer';

-- gifdl
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'gifdl';

-- ringtone
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ringtone';

-- beats
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'beats';

-- podcast
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'podcast';

-- vocal
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'vocal';

-- karaoke
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'karaoke';

-- lyricsmp3
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'lyricsmp3';

-- relax
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'relax';

-- lofi
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'lofi';

-- chill
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'chill';

-- gospel
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'gospel';

-- afrobeat
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'afrobeat';

-- drill
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'drill';

-- rnb
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'rnb';

-- hiphop
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'hiphop';

-- gengetone
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'gengetone';

-- ytaudio
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytaudio';

-- ytvideo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytvideo';

-- ytshorts
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'ytshorts';

-- shorts
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'shorts';

-- igreel
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'igreel';

-- reels
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'reels';

-- twitvideo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'twitvideo';

-- fbreel
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'fbreel';

-- tkvideo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'tkvideo';

-- tkaudio
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'tkaudio';

-- tiktokmp3
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'tiktokmp3';

-- tiktokmp4
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'tiktokmp4';

-- mp3yt
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'mp3yt';

-- mp4yt
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'mp4yt';

-- dlvideo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'dlvideo';

-- dlaudio
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'dlaudio';

-- getvideo
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <video name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading video...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.video || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { video: { url }, caption: ''🎬 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'getvideo';

-- getaudio
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <song name / link>`);
if (!mzaziApiKey) return mzazireply(''❌ Download API key not set.\n\nCreate a developer API key at mzazi.shop (API dashboard), set MZAZI_API_KEY in the bot .env, restart, then .synccmd.'');
await mzazireply(''⏳ Downloading audio...'');
try {
  const { data: res } = await axios.get(''https://mzazi.shop/api/download/play'', { params: { query: q, apikey: mzaziApiKey }, timeout: 45000 });
  const items = Array.isArray(res && res.result) ? res.result : (res && res.result ? [res.result] : [res || {}]);
  const it = items[0] || {};
  const url = it.url || it.audio || it.downloadUrl || it.fileUrl || it.link || null;
  const title = it.title || it.name || it.filename || q;
  if (!url) return mzazireply(''❌ No download link found.\n'' + JSON.stringify(res).slice(0, 400));
  await mzazi.sendMessage(sender, { audio: { url }, mimetype: ''audio/mp4'', ptt: false, caption: ''🎵 '' + title }, { quoted: m });
} catch (e) { return mzazireply(''❌ Download failed: '' + (e.message || e)); }
return;'
WHERE name = 'getaudio';

-- setname
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'setname';

-- setgroupname
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'setgroupname';

-- settopic
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'settopic';

-- adduser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''add'');
  mzazireply(''✅ Invited +'' + num + '' to the group.'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed to add'')); }
return;'
WHERE name = 'adduser';

-- addmember
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''add'');
  mzazireply(''✅ Invited +'' + num + '' to the group.'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed to add'')); }
return;'
WHERE name = 'addmember';

-- renames
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'renames';

-- setgctopic
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'setgctopic';

-- edittopic
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'edittopic';

-- changegroupname
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'changegroupname';

-- rename
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'rename';

-- editdesc
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'editdesc';

-- setgroupdesc
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'setgroupdesc';

-- changegroupdesc
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'changegroupdesc';

-- setgcdesc
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'setgcdesc';

-- nameset
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'nameset';

-- subjectset
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateSubject(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'subjectset';

-- topicset
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'topicset';

-- descset
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'descset';

-- descriptionset
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
const v = (text || '''').trim();
if (!v) return mzazireply(`Usage: ${prefix}${command} <new __LABEL__>`);
try {
  await mzazi.groupUpdateDescription(sender, v);
  mzazireply(''✅ Group __LABEL__ updated: '' + v);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'descriptionset';

-- addbynum
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''add'');
  mzazireply(''✅ Invited +'' + num + '' to the group.'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed to add'')); }
return;'
WHERE name = 'addbynum';

-- invitenum
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''add'');
  mzazireply(''✅ Invited +'' + num + '' to the group.'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed to add'')); }
return;'
WHERE name = 'invitenum';

-- kicknum
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''remove'');
  mzazireply(''✅ +'' + num + '' — removed'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'kicknum';

-- promotenum
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''promote'');
  mzazireply(''✅ +'' + num + '' — promoted to admin'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'promotenum';

-- demotenum
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''demote'');
  mzazireply(''✅ +'' + num + '' — demoted from admin'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'demotenum';

-- addnum
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  await mzazi.groupParticipantsUpdate(sender, [num + ''@s.whatsapp.net''], ''add'');
  mzazireply(''✅ +'' + num + '' — invited'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'addnum';

-- sendto
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
const parts = (text || '''').split(/\s+/);
const jid = (parts[0] || '''').trim();
const msg = parts.slice(1).join('' '').trim();
if (!jid || !msg) return mzazireply(`Usage: ${prefix}${command} <jid|number> <message>`);
try {
  await mzazi.sendMessage(jid.includes(''@'') ? jid : jid + ''@s.whatsapp.net'', { text: msg });
  mzazireply(''✅ Sent to '' + jid);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'sendto';

-- delowner
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
const num = (text || '''').replace(/\D/g, '''');
if (!num || num.length < 10) return mzazireply(`Usage: ${prefix}${command} <phone number>`);
try {
  const p = ''./database/owners.json'';
  const list = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, ''utf8'')) : [];
  const jid = num + ''@s.whatsapp.net'';
  const next = list.filter((x) => x !== jid);
  fs.writeFileSync(p, JSON.stringify(next, null, 2));
  mzazireply(''✅ Removed +'' + num + '' from owners.json (takes effect after restart).'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'delowner';

-- ownerhelp
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(`👑 *Owner commands*\n\n${prefix}block / unblock\n${prefix}join <link>\n${prefix}leave\n${prefix}broadcast <msg>\n${prefix}sendto <jid> <msg>\n${prefix}addowner <num>\n${prefix}delowner <num>\n${prefix}ownerlist\n${prefix}ownergroups\n${prefix}botuptime\n${prefix}setbotname <name>\n${prefix}getid\n${prefix}restart / update`);
return;'
WHERE name = 'ownerhelp';

-- ownersay
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(`👋 Message sent from the bot. Use ${prefix}sendto <jid> <msg> to send to a specific chat.`);
return;'
WHERE name = 'ownersay';

-- botmsg
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(`👋 Message sent from the bot. Use ${prefix}sendto <jid> <msg> to send to a specific chat.`);
return;'
WHERE name = 'botmsg';

-- allgroups
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(`👋 Message sent from the bot. Use ${prefix}sendto <jid> <msg> to send to a specific chat.`);
return;'
WHERE name = 'allgroups';

-- dm
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
const parts = (text || '''').split(/\s+/);
const num = (parts[0] || '''').replace(/\D/g, '''');
const msg = parts.slice(1).join('' '').trim();
if (!num || num.length < 10 || !msg) return mzazireply(`Usage: ${prefix}${command} <number> <message>`);
try {
  await mzazi.sendMessage(num + ''@s.whatsapp.net'', { text: msg });
  mzazireply(''✅ DM sent to +'' + num);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'dm';

-- dmsend
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
const parts = (text || '''').split(/\s+/);
const num = (parts[0] || '''').replace(/\D/g, '''');
const msg = parts.slice(1).join('' '').trim();
if (!num || num.length < 10 || !msg) return mzazireply(`Usage: ${prefix}${command} <number> <message>`);
try {
  await mzazi.sendMessage(num + ''@s.whatsapp.net'', { text: msg });
  mzazireply(''✅ DM sent to +'' + num);
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'dmsend';

-- acceptall
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(`✅ Use ${prefix}approve <jid> or ${prefix}reject <jid> for join requests. Auto-accept-all is not enabled for safety.`);
return;'
WHERE name = 'acceptall';

-- rejectreq
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(`Use ${prefix}reject <jid> to reject a join request (see ${prefix}pendingrequests).`);
return;'
WHERE name = 'rejectreq';

-- blocknum
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target && text) target = (String(text).trim().includes(''@'') ? String(text).trim() : String(text).trim() + ''@s.whatsapp.net'');
if (!target) return mzazireply(`Usage: ${prefix}${command} <number or @mention>`);
try {
  await mzazi.updateBlockStatus(target, ''block'');
  mzazireply(''✅ Done: '' + jidToNumber(await resolveJid(target)));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'blocknum';

-- unblocknum
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target && text) target = (String(text).trim().includes(''@'') ? String(text).trim() : String(text).trim() + ''@s.whatsapp.net'');
if (!target) return mzazireply(`Usage: ${prefix}${command} <number or @mention>`);
try {
  await mzazi.updateBlockStatus(target, ''unblock'');
  mzazireply(''✅ Done: '' + jidToNumber(await resolveJid(target)));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'unblocknum';

-- janken
UPDATE bot_commands SET code = 'const choices = [''rock'',''paper'',''scissors''];
const you = (text || '''').trim().toLowerCase();
if (!choices.includes(you)) return mzazireply(`Usage: ${prefix}${command} <rock|paper|scissors>`);
const bot = choices[Math.floor(Math.random() * 3)];
const win = (you === bot) ? ''🤝 Draw!'' : ((you === ''rock'' && bot === ''scissors'') || (you === ''paper'' && bot === ''rock'') || (you === ''scissors'' && bot === ''paper'')) ? ''🎉 You win!'' : ''😅 Bot wins!'';
mzazireply(''✊✋✌️\nYou: '' + you + ''\nBot: '' + bot + ''\n\n'' + win);
return;'
WHERE name = 'janken';

-- rockpaperscissors
UPDATE bot_commands SET code = 'const choices = [''rock'',''paper'',''scissors''];
const you = (text || '''').trim().toLowerCase();
if (!choices.includes(you)) return mzazireply(`Usage: ${prefix}${command} <rock|paper|scissors>`);
const bot = choices[Math.floor(Math.random() * 3)];
const win = (you === bot) ? ''🤝 Draw!'' : ((you === ''rock'' && bot === ''scissors'') || (you === ''paper'' && bot === ''rock'') || (you === ''scissors'' && bot === ''paper'')) ? ''🎉 You win!'' : ''😅 Bot wins!'';
mzazireply(''✊✋✌️\nYou: '' + you + ''\nBot: '' + bot + ''\n\n'' + win);
return;'
WHERE name = 'rockpaperscissors';

-- highlow
UPDATE bot_commands SET code = 'const GKEY = ''highlow_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  st = { num: Math.floor(Math.random() * 10) + 1, prev: Math.floor(Math.random() * 10) + 1, score: 0 };
  db[GKEY] = st;
  return mzazireply(''📈📉 *High/Low*\n\nMy number is '' + st.prev + ''. Is the next number HIGHER or LOWER? (reply "high" or "low", or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
if (g !== ''high'' && g !== ''low'') return mzazireply(''Reply "high", "low" or "stop".'');
const next = Math.floor(Math.random() * 10) + 1;
if ((g === ''high'' && next > st.prev) || (g === ''low'' && next < st.prev)) {
  st.score++; st.prev = next;
  return mzazireply(''✅ Correct! Now '' + next + ''. Higher or lower? (score: '' + st.score + '')'');
}
db[GKEY] = undefined;
mzazireply(''❌ Wrong — next was '' + next + ''. Final score: '' + st.score + `. Play again with ${prefix}${command}`);
return;'
WHERE name = 'highlow';

-- quickquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"What is the capital of Kenya?","a":"Nairobi"}, {"q":"What planet do we live on?","a":"Earth"}, {"q":"How many legs does a spider have?","a":"8"}, {"q":"What is the biggest ocean?","a":"Pacific"}, {"q":"What gas do plants absorb?","a":"Carbon dioxide"}, {"q":"How many days in a leap year?","a":"366"}, {"q":"Who wrote Romeo and Juliet?","a":"Shakespeare"}, {"q":"What is the fastest land animal?","a":"Cheetah"}, {"q":"Which country is home to the kangaroo?","a":"Australia"}, {"q":"What is 7 x 8?","a":"56"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'quickquiz';

-- capitalquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"Capital of France?","a":"Paris"}, {"q":"Capital of Japan?","a":"Tokyo"}, {"q":"Capital of Egypt?","a":"Cairo"}, {"q":"Capital of Kenya?","a":"Nairobi"}, {"q":"Capital of Brazil?","a":"Brasilia"}, {"q":"Capital of Canada?","a":"Ottawa"}, {"q":"Capital of Nigeria?","a":"Abuja"}, {"q":"Capital of India?","a":"New Delhi"}, {"q":"Capital of Australia?","a":"Canberra"}, {"q":"Capital of Germany?","a":"Berlin"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'capitalquiz';

-- truefalse
UPDATE bot_commands SET code = 'const QA = [{"q":"The sky is blue during the day.","a":"True"}, {"q":"Dogs can see all colors.","a":"False"}, {"q":"The sun rises in the east.","a":"True"}, {"q":"Fish can blink.","a":"False"}, {"q":"There are 7 days in a week.","a":"True"}, {"q":"Bananas grow on trees.","a":"False"}, {"q":"A triangle has 4 sides.","a":"False"}, {"q":"Humans need oxygen to live.","a":"True"}, {"q":"The Earth is flat.","a":"False"}, {"q":"Water boils at 100°C at sea level.","a":"True"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'truefalse';

-- oddoreven
UPDATE bot_commands SET code = 'const GKEY = ''oddeven_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) { st = { n: Math.floor(Math.random() * 99) + 1 }; db[GKEY] = st; return mzazireply(''🎲 I rolled a number. Odd or even? (reply "odd"/"even", or "stop")''); }
const g = (text || '''').trim().toLowerCase();
if (g !== ''odd'' && g !== ''even'') return mzazireply(''Reply "odd", "even" or "stop".'');
const isOdd = st.n % 2 === 1;
const win = (g === ''odd'' && isOdd) || (g === ''even'' && !isOdd);
db[GKEY] = undefined;
mzazireply((win ? ''🎉 Correct! '' : ''❌ Wrong! '') + ''It was '' + st.n + '' ('' + (isOdd ? ''odd'' : ''even'') + `). Play again with ${prefix}${command}`);
return;'
WHERE name = 'oddoreven';

-- roulette
UPDATE bot_commands SET code = 'const bet = (text || '''').trim().toLowerCase();
if (![''red'', ''black''].includes(bet)) return mzazireply(`Usage: ${prefix}${command} <red|black>`);
const colors = [''red'', ''black''];
const spin = colors[Math.floor(Math.random() * 2)];
mzazireply(''🎡 Spinning... '' + (spin === ''red'' ? ''🔴 Red!'' : ''⚫ Black!'') + ''\n\n'' + (spin === bet ? ''🎉 You win!'' : ''😅 You lose!''));
return;'
WHERE name = 'roulette';

-- mines
UPDATE bot_commands SET code = 'const pick = (text || '''').trim();
if (!/^[1-9]$/.test(pick)) return mzazireply(`Usage: ${prefix}${command} <1-9> — pick a cell (one hides a mine)`);
const mine = Math.floor(Math.random() * 9) + 1;
if (Number(pick) === mine) return mzazireply(''💥 BOOM! That was the mine. You lose!'');
mzazireply(''✅ Safe! The mine was at '' + mine + ''. You survived!'');
return;'
WHERE name = 'mines';

-- pet
UPDATE bot_commands SET code = 'db.pet = db.pet || {};
const key = ''pet_'' + sender;
let p = db[key];
if (!p) { p = { fed: 5, energy: 5 }; db[key] = p; }
const act = (text || '''').trim().toLowerCase();
if (act === ''feed'') p.fed = Math.min(10, p.fed + 2);
if (act === ''sleep'') p.energy = Math.min(10, p.energy + 3);
const mood = (p.fed + p.energy) > 14 ? ''😻 Happy'' : (p.fed + p.energy) > 8 ? ''😺 Content'' : ''😿 Hungry/Tired'';
mzazireply(''🐾 *Virtual Pet*\n\nFood: '' + ''🍖''.repeat(Math.max(1, Math.round(p.fed / 2))) + '' ('' + p.fed + ''/10)\nEnergy: '' + ''⚡''.repeat(Math.max(1, Math.round(p.energy / 2))) + '' ('' + p.energy + ''/10)\nMood: '' + mood + `\n\nFeed it: ${prefix}pet feed\nRest it: ${prefix}pet sleep`);
return;'
WHERE name = 'pet';

-- cityquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"Capital of France?","a":"Paris"}, {"q":"Capital of Kenya?","a":"Nairobi"}, {"q":"Capital of Japan?","a":"Tokyo"}, {"q":"Capital of Egypt?","a":"Cairo"}, {"q":"Capital of Brazil?","a":"Brasilia"}, {"q":"Capital of Canada?","a":"Ottawa"}, {"q":"Capital of Nigeria?","a":"Abuja"}, {"q":"Capital of India?","a":"New Delhi"}, {"q":"Capital of Australia?","a":"Canberra"}, {"q":"Capital of Germany?","a":"Berlin"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'cityquiz';

-- sportsquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"How many players in a football (soccer) team?","a":"11"}, {"q":"Which country won the 2022 World Cup?","a":"Argentina"}, {"q":"How many points is a touchdown?","a":"6"}, {"q":"In which sport do you use a shuttlecock?","a":"Badminton"}, {"q":"How many quarters in an NBA game?","a":"4"}, {"q":"What color are the Olympic rings? (one)","a":"Blue"}, {"q":"Who is known as the GOAT of basketball?","a":"Jordan"}, {"q":"How many holes in a standard golf course?","a":"18"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'sportsquiz';

-- musicquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"How many strings on a standard guitar?","a":"6"}, {"q":"Who sang ''Thriller''?","a":"Michael Jackson"}, {"q":"What instrument has 88 keys?","a":"Piano"}, {"q":"Which genre did Bob Marley popularize?","a":"Reggae"}, {"q":"Who is the ''Queen of Pop''?","a":"Madonna"}, {"q":"How many beats in a 4/4 bar?","a":"4"}, {"q":"Which band sang ''Bohemian Rhapsody''?","a":"Queen"}, {"q":"What does DJ stand for?","a":"Disc jockey"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'musicquiz';

-- animalquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"What is the fastest land animal?","a":"Cheetah"}, {"q":"How many hearts does an octopus have?","a":"3"}, {"q":"Which is the largest mammal?","a":"Whale"}, {"q":"What do you call a baby kangaroo?","a":"Joey"}, {"q":"How many legs does a spider have?","a":"8"}, {"q":"Which bird cannot fly?","a":"Penguin"}, {"q":"What is the largest reptile?","a":"Crocodile"}, {"q":"How many stomachs does a cow have?","a":"4"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'animalquiz';

-- moviequiz
UPDATE bot_commands SET code = 'const QA = [{"q":"Who played Jack in Titanic?","a":"DiCaprio"}, {"q":"What is the highest-grossing film of all time?","a":"Avatar"}, {"q":"Which franchise has ''I''ll be back''?","a":"Terminator"}, {"q":"What color is the Infinity Gauntlet stone? (one)","a":"Purple"}, {"q":"Who directed Inception?","a":"Nolan"}, {"q":"What year was the first Harry Potter film?","a":"2001"}, {"q":"Who voiced Woody in Toy Story?","a":"Hanks"}, {"q":"Which superhero is from Wakanda?","a":"Black Panther"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'moviequiz';

-- sciencequiz
UPDATE bot_commands SET code = 'const QA = [{"q":"What is the chemical symbol for gold?","a":"Au"}, {"q":"How many planets in our solar system?","a":"8"}, {"q":"What is H2O?","a":"Water"}, {"q":"What force keeps us on the ground?","a":"Gravity"}, {"q":"Which gas do plants absorb?","a":"Carbon dioxide"}, {"q":"What is the hardest natural substance?","a":"Diamond"}, {"q":"How many bones in the adult human body?","a":"206"}, {"q":"What is the speed of light approx (km/s)?","a":"300000"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'sciencequiz';

-- foodquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"Which country invented sushi?","a":"Japan"}, {"q":"What is the main ingredient in guacamole?","a":"Avocado"}, {"q":"Which fruit is famous in Kenya''s coast?","a":"Coconut"}, {"q":"What is a croissant?","a":"Pastry"}, {"q":"Which nut is used to make marzipan?","a":"Almond"}, {"q":"What is the most consumed beverage after water?","a":"Tea"}, {"q":"Which cheese has holes?","a":"Swiss"}, {"q":"What is the main spice in curry?","a":"Turmeric"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'foodquiz';

-- geoquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"Which is the largest continent?","a":"Asia"}, {"q":"What is the longest river?","a":"Nile"}, {"q":"Which country has the most people?","a":"India"}, {"q":"What is the smallest country?","a":"Vatican"}, {"q":"Which desert is the largest hot desert?","a":"Sahara"}, {"q":"How many continents are there?","a":"7"}, {"q":"What is the highest mountain?","a":"Everest"}, {"q":"Which ocean is the largest?","a":"Pacific"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'geoquiz';

-- historyquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"Who was the first US president?","a":"Washington"}, {"q":"In which year did WW2 end?","a":"1945"}, {"q":"Who built the pyramids?","a":"Egyptians"}, {"q":"What wall divided Berlin?","a":"Berlin Wall"}, {"q":"Who discovered penicillin?","a":"Fleming"}, {"q":"Which empire built the Colosseum?","a":"Roman"}, {"q":"Who was the first man on the moon?","a":"Armstrong"}, {"q":"What ship sank in 1912?","a":"Titanic"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'historyquiz';

-- techquiz
UPDATE bot_commands SET code = 'const QA = [{"q":"What does CPU stand for?","a":"Central processing unit"}, {"q":"Who founded Microsoft?","a":"Gates"}, {"q":"What does HTML stand for?","a":"Hypertext markup language"}, {"q":"Which company makes the iPhone?","a":"Apple"}, {"q":"What is 1 GB in MB?","a":"1024"}, {"q":"Who invented the World Wide Web?","a":"Berners-Lee"}, {"q":"What does AI stand for?","a":"Artificial intelligence"}, {"q":"Which social app has ''tweets''?","a":"Twitter"}];
const GKEY = ''quiz_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  const i = Math.floor(Math.random() * QA.length);
  st = { i, q: QA[i].q, a: QA[i].a };
  db[GKEY] = st;
  return mzazireply(''🧠 *Quiz*\n\n'' + st.q + ''\n(reply your answer, or "stop")'');
}
const g = (text || '''').trim().toLowerCase();
const ok = g.includes(st.a.toLowerCase()) || st.a.toLowerCase().includes(g);
if (ok) { db[GKEY] = undefined; return mzazireply(''🎉 Correct! Answer: '' + st.a); }
mzazireply(''❌ Wrong. Answer: '' + st.a + `\nPlay again with ${prefix}${command}`);
db[GKEY] = undefined;
return;'
WHERE name = 'techquiz';

-- agecalc
UPDATE bot_commands SET code = 'const y = Number((text || '''').replace(/\D/g, ''''));
if (!y || y < 1900 || y > new Date().getFullYear()) return mzazireply(`Usage: ${prefix}${command} <birth year>`);
mzazireply(''🎂 Age: '' + (new Date().getFullYear() - y) + '' years old.'');
return;'
WHERE name = 'agecalc';

-- bmi
UPDATE bot_commands SET code = 'const n = (text || '''').match(/\d+/g) || [];
if (n.length < 2) return mzazireply(`Usage: ${prefix}${command} <weight kg> <height cm>`);
const w = Number(n[0]), h = Number(n[1]) / 100;
if (!w || !h) return mzazireply(''❌ Invalid numbers.'');
const b = w / (h * h);
const cat = b < 18.5 ? ''Underweight'' : b < 25 ? ''Normal'' : b < 30 ? ''Overweight'' : ''Obese'';
mzazireply(''⚖️ BMI: '' + b.toFixed(1) + '' ('' + cat + '')'');
return;'
WHERE name = 'bmi';

-- percent
UPDATE bot_commands SET code = 'const n = (text || '''').match(/-?\d+(\.\d+)?/g) || [];
if (n.length < 2) return mzazireply(`Usage: ${prefix}${command} <percent> <of value>`);
const p = Number(n[0]), v = Number(n[1]);
mzazireply(''🧮 '' + p + ''% of '' + v + '' = '' + ((p / 100) * v));
return;'
WHERE name = 'percent';

-- tip
UPDATE bot_commands SET code = 'const n = (text || '''').match(/\d+(\.\d+)?/g) || [];
if (!n.length) return mzazireply(`Usage: ${prefix}${command} <bill amount> [tip %]`);
const bill = Number(n[0]), pct = n.length > 1 ? Number(n[1]) : 10;
mzazireply(''💵 Bill: '' + bill + ''\nTip ('' + pct + ''%): '' + ((bill * pct) / 100).toFixed(2) + ''\nTotal: '' + (bill + (bill * pct) / 100).toFixed(2));
return;'
WHERE name = 'tip';

-- discount
UPDATE bot_commands SET code = 'const n = (text || '''').match(/\d+(\.\d+)?/g) || [];
if (n.length < 2) return mzazireply(`Usage: ${prefix}${command} <price> <discount %>`);
const p = Number(n[0]), d = Number(n[1]);
mzazireply(''🏷️ Price: '' + p + ''\nDiscount ('' + d + ''%): -'' + ((p * d) / 100).toFixed(2) + ''\nYou pay: '' + (p - (p * d) / 100).toFixed(2));
return;'
WHERE name = 'discount';

-- streak
UPDATE bot_commands SET code = 'const GKEY = ''streak_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) { st = { n: 1 }; db[GKEY] = st; return mzazireply(''🔢 *Count to 10*\n\nSay: 1  (type "stop" to quit)''); }
const g = Number((text || '''').trim());
if (g === st.n) {
  if (g === 10) { db[GKEY] = undefined; return mzazireply(''🎉 Perfect streak to 10! You win!''); }
  st.n = g + 1;
  return mzazireply(''✅ Next: '' + (g + 1));
}
db[GKEY] = undefined;
return mzazireply(''❌ You broke the streak (expected '' + st.n + `). Play again with ${prefix}${command}`);
return;'
WHERE name = 'streak';

-- memory
UPDATE bot_commands SET code = 'const GKEY = ''mem_'' + sender;
if ((text || '''').trim().toLowerCase() === ''stop'') { db[GKEY] = undefined; return mzazireply(''👋 Game ended.''); }
let st = db[GKEY];
if (!st) {
  st = { seq: [Math.floor(Math.random() * 9) + 1], i: 0 };
  db[GKEY] = st;
  return mzazireply(''🧠 *Memory*\n\nRepeat this sequence:\n*'' + st.seq.join('' '') + ''*\n\n(reply the numbers, or "stop")'');
}
const g = (text || '''').trim();
if (g === st.seq.join('' '')) {
  st.seq.push(Math.floor(Math.random() * 9) + 1);
  return mzazireply(''✅ Correct! Next sequence:\n*'' + st.seq.join('' '') + ''*\n\n(reply it, or "stop")'');
}
db[GKEY] = undefined;
return mzazireply(''❌ Wrong. You reached length '' + st.seq.length + `. Play again with ${prefix}${command}`);
return;'
WHERE name = 'memory';

-- say
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t));
return;'
WHERE name = 'say';

-- echo
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t));
return;'
WHERE name = 'echo';

-- shout
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.toUpperCase()));
return;'
WHERE name = 'shout';

-- caps
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('' '').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('' '')));
return;'
WHERE name = 'caps';

-- whisper
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(''🤫 '' + t.toLowerCase()));
return;'
WHERE name = 'whisper';

-- monospace
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('''').map((c) => c.charCodeAt(0) >= 65 && c.charCodeAt(0) <= 90 ? String.fromCharCode(c.charCodeAt(0) + 55349 - 65) : c).join('''')));
return;'
WHERE name = 'monospace';

-- stutter
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('' '').map((w) => w.slice(0, 2) + ''-'' + w).join('' '')));
return;'
WHERE name = 'stutter';

-- slow
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('''').join(''...'')));
return;'
WHERE name = 'slow';

-- emojifytext
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('''').join(''✨'').trim() + ''✨''));
return;'
WHERE name = 'emojifytext';

-- uwu
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.replace(/[lr]/g, ''w'').replace(/[LR]/g, ''W'').replace(/n([aeiou])/g, ''ny$1'') + '' uwu''));
return;'
WHERE name = 'uwu';

-- owo
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.replace(/[lr]/g, ''w'').replace(/[LR]/g, ''W'') + '' (◕ᴥ◕)''));
return;'
WHERE name = 'owo';

-- pirate
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.replace(/you/g, ''ye'').replace(/my/g, ''me'').replace(/is/g, ''be'').replace(/are/g, ''be'') + '' arrr!''));
return;'
WHERE name = 'pirate';

-- baby
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.replace(/you/g, ''u'').replace(/are/g, ''r'').replace(/to/g, ''2'').replace(/for/g, ''4'').replace(/great/g, ''gweat'') + '' hehe''));
return;'
WHERE name = 'baby';

-- altcaps
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('''').map((c, i) => i % 2 ? c.toLowerCase() : c.toUpperCase()).join('''')));
return;'
WHERE name = 'altcaps';

-- spongebob
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('''').map((c, i) => i % 2 ? c.toLowerCase() : c.toUpperCase()).join('''')));
return;'
WHERE name = 'spongebob';

-- sarcasm
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t + '' (sarcasm)''));
return;'
WHERE name = 'sarcasm';

-- laugh
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(''haha '' + t + '' 😂''));
return;'
WHERE name = 'laugh';

-- cry
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t + '' 😭💔''));
return;'
WHERE name = 'cry';

-- excited
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.toUpperCase() + ''!!!''));
return;'
WHERE name = 'excited';

-- wink
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t + '' 😉''));
return;'
WHERE name = 'wink';

-- kiss
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(''😘 '' + t + '' 😘''));
return;'
WHERE name = 'kiss';

-- sad
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(''😔 '' + t + '' ...''));
return;'
WHERE name = 'sad';

-- confused
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(''🤔 '' + t + '' ???''));
return;'
WHERE name = 'confused';

-- angry
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.toUpperCase() + '' 😤''));
return;'
WHERE name = 'angry';

-- cheer
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(''🎉 '' + t + '' 🎉''));
return;'
WHERE name = 'cheer';

-- ghost
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('''').join(''👻'') + '' 👻''));
return;'
WHERE name = 'ghost';

-- star
UPDATE bot_commands SET code = 'const t = (text || '''').trim();
if (!t) return mzazireply(`Usage: ${prefix}${command} <text>`);
mzazireply(String(t.split('''').join(''⭐'') + '' ⭐''));
return;'
WHERE name = 'star';

-- philosophy
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following philosophical idea simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'philosophy';

-- psychology
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following psychology concept simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'psychology';

-- economics
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following economics concept simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'economics';

-- geography
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Tell me about the following place or geographic term.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'geography';

-- astronomy
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following astronomy topic simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'astronomy';

-- physics
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following physics concept simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'physics';

-- biology
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following biology concept simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'biology';

-- chemistry
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following chemistry concept simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'chemistry';

-- algebra
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following algebra problem step by step.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'algebra';

-- geometry
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following geometry problem step by step.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'geometry';

-- calculus
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following calculus concept.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'calculus';

-- statistics
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Explain the following statistics concept simply.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'statistics';

-- probability
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following probability question.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'probability';

-- logic
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following logic puzzle with reasoning.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'logic';

-- puzzle
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Solve the following puzzle and explain.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'puzzle';

-- brainteaser
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the following brain teaser.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'brainteaser';

-- triviaai
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Answer the following trivia question.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'triviaai';

-- quizai
UPDATE bot_commands SET code = 'const q = (text || '''').trim();
if (!q) return mzazireply(`Usage: ${prefix}${command} <text>`);
await mzazireply(''⏳ Thinking...'');
try {
  const { data: res } = await axios.post(''https://mzazi.shop/api/ai/chat'', { question: ''Create a quiz question about the following and give the answer.\n\n'' + q }, { timeout: 50000 });
  if (res && res.response) return mzazireply(String(res.response).slice(0, 4000));
  return mzazireply(''❌ '' + ((res && res.error) || ''No response from the AI.''));
} catch (e) { return mzazireply(''❌ AI request failed: '' + (e.message || e)); }
return;'
WHERE name = 'quizai';
