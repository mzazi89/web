-- QUARTZ XD — live-DB command updates
-- Run ONCE in the Neon SQL console (or psql) against the shared database.
-- The 591 NEW commands seed automatically on next app restart (DB count < file count);
-- these UPDATEs fix EXISTING rows that the seed never overwrites.

-- menu6
UPDATE bot_commands SET code = 'try {
  const customMenuPic = `./database/sessions/${botPhoneNum}/menu.jpg`;
  const defaultMenuPic = "./media/menu.jpg";
  const pic = fs.existsSync(customMenuPic) ? customMenuPic : (fs.existsSync(defaultMenuPic) ? defaultMenuPic : null);
  const sec = Math.floor((Date.now() - startTime) / 1000);
  const dd = Math.floor(sec / 86400), hh = Math.floor((sec % 86400) / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
  const menuTxt = `╔═══════════════════════╗
║   QUARTZ XD · MZAZI TECH   ║
╚═══════════════════════╝

🤖 *${botName}*
📱 +${jidToNumber(botPhoneNum || '''')}
⏱️ ${dd}d ${hh}h ${mm}m ${ss}s · 1000 commands loaded

╔═⟪ 🛡️ GENERAL ⟫═╗
╠❏ ${prefix}pair — pair a WhatsApp number
╠❏ ${prefix}ping / uptime / owner
╠❏ ${prefix}ai <question> — MZAZI AI
╠❏ ${prefix}menu6 — this menu
╚════════════════════

╔═⟪ 👥 GROUP ⟫═╗
╠❏ kick · promote · demote · add <num>
╠❏ tagall · hidetag · groupopen · groupclose
╠❏ setname <name> · setdesc <text>
╠❏ grouplink · revoke · delete
╠❏ warn · unwarn · groupstats · listadmin
╠❏ antilink · antiviewonce · antimentiongroup
╠❏ pickmember · kickme
╚════════════════════

╔═⟪ 👑 OWNER ⟫═╗
╠❏ broadcast <msg> · sendto <jid> <msg>
╠❏ join <link> · leave · block · unblock
╠❏ addowner <num> · delowner · ownerlist
╠❏ ownergroups · setbotname · botuptime
╠❏ toggleflood · toggleonline · setpp
╠❏ backup · restart
╚════════════════════

╔═⟪ 🧠 AI ⟫═╗
╠❏ ai · ask · gpt · brain · explain
╠❏ translate · summarize · rewrite · code
╠❏ math · solve · poem · story · define
╠❏ imagine · img · draw · genimg <prompt>
╚════════════════════

╔═⟪ 📥 DOWNLOADS ⟫═╗
╠❏ play <song> · song · mp3 · yta · ytv
╠❏ video <link> · tiktok · insta · ig
╠❏ facebook · fb · spotify · soundcloud
╚════════════════════

╔═⟪ 🎮 GAMES ⟫═╗
╠❏ slots · dice · coin · rps <choice>
╠❏ guess · ttt · highlow · anagram · hangman
╠❏ quickquiz · capitalquiz · blackjack
╠❏ truth · dare · wyr · 8ball · lovecalc
╚════════════════════

╔═⟪ 😂 FUN ⟫═╗
╠❏ joke · fact · quote · roast · compliment
╠❏ pickup · meme · say <text> · shout
╠❏ clap · uwu · horoscope · zodiac · ship
╠❏ goodmorning · goodnight · monday
╚════════════════════

_Made with ⚡ by MZAZI TECH INC_
_Type ${prefix}remote to list all commands_`;
  if (pic) {
    const buf = fs.readFileSync(pic);
    await mzazi.sendMessage(sender, { image: buf, caption: menuTxt }, { quoted: m });
  } else {
    mzazireply(menuTxt);
  }
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Menu error'')); }
return;'
, description = 'QUARTZ XD main menu (1000 commands)'
WHERE name = 'menu6';

-- setgpp
UPDATE bot_commands SET code = '// Group only
    if (!isGroup) {
        await reply(''❌ This command can only be used in groups.'');
        return;
    }

    // Admin or owner only
    if (!isOwner && !isAdmin) {
        await reply(''❌ Only group admins or bot owner can change the group picture.'');
       return;
    }

    // Check if replying to an image or sticker
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quotedMsg?.imageMessage || quotedMsg?.stickerMessage;
    if (!imageMsg) {
        await reply(''❌ *Please reply to an image or sticker*\n\nUsage: Reply to an image with `.setgpp`'');
      return;
    }

    try {
        // Create tmp directory if it doesn''t exist
        const tmpDir = path.join(process.cwd(), ''tmp'');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Download the image using Baileys'' downloadContentFromMessage
        const { downloadContentFromMessage } = require(''@whiskeysockets/baileys'');
        const stream = await downloadContentFromMessage(imageMsg, ''image'');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Save to temporary file
        const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, buffer);

        // Update group profile picture
        await mzazi.updateProfilePicture(sender, { url: imgPath });

        // Clean up temp file
        try { fs.unlinkSync(imgPath); } catch (e) {}

        await reply(''✅ *Group profile picture updated successfully!*'');
    } catch (err) {
        logger.error(''SetGPP error:'', err);
        await reply(''❌ *Failed to update group profile picture*\n\nMake sure the bot is an admin and the image is valid.'');
    }
return;'
WHERE name = 'setgpp';

-- getpp
UPDATE bot_commands SET code = 'let targetJid = null;

    // Check if a user is mentioned
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentioned && mentioned[0]) {
        targetJid = mentioned[0];
    }
    // Check if a message is quoted
    else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant;
    }
    // If in group and no target, use sender
    else if (isGroup) {
        targetJid = msgSender;
    }
    // If in DM, use the other participant (the bot''s own pp could be fetched, but sender is the user)
    else {
        targetJid = sender;
    }

    if (!targetJid) {
        await mzazireply(''❌ Could not identify the target user.'');
        return;
    }

    try {
        // Get profile picture URL
        const ppUrl = await mzazi.profilePictureUrl(targetJid, ''image'').catch(() => null);
        if (!ppUrl) {
            await mzazireply(`❌ No profile picture found for @${jidToNumber(targetJid)}.`, { mentions: [targetJid] });
           return;
        }

        // Download the image buffer
        const { data: imageBuffer } = await axios.get(ppUrl, { responseType: ''arraybuffer'' });

        // Send the profile picture
        await mzazi.sendMessage(sender, {
            image: Buffer.from(imageBuffer),
            caption: `📸 Profile picture of @${jidToNumber(targetJid)}`,
            mentions: [targetJid]
        }, { quoted: m });
    } catch (err) {
        logger.error(''GetPP error:'', err);
        await reply(`❌ Failed to get profile picture: ${err.message}`);
    }
return;'
WHERE name = 'getpp';

-- vv2
UPDATE bot_commands SET code = '// ── Only the bot owner can use this ──────────────────────────
  if (!isOwner) return; // silently ignore – no reply, no reaction

  // Owner''s private DM – we send the stolen media here
  const ownerDM = `${ownerNumbers[0]}@s.whatsapp.net`; // primary owner

  try {
    // ── 1. Get quoted message ─────────────────────────────────────
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
      await mzazi.sendMessage(ownerDM, { text: ''❌ *VV2:* Reply to a view‑once media.'' });
     return;
    }

    // ── 2. Unwrap all view‑once wrappers ─────────────────────────
    let inner = quotedMsg;
    if (inner?.viewOnceMessage) inner = inner.viewOnceMessage.message;
    if (inner?.viewOnceMessageV2) inner = inner.viewOnceMessageV2.message;
    if (inner?.viewOnceMessageV2Extension) inner = inner.viewOnceMessageV2Extension.message;
    if (inner?.ephemeralMessage) inner = inner.ephemeralMessage.message;

    const mediaType = [''imageMessage'', ''videoMessage'', ''audioMessage''].find(k => inner?.[k]);
    if (!mediaType) {
      await mzazi.sendMessage(ownerDM, { text: ''❌ *VV2:* No view‑once media found.'' });
    return;
    }

    const media = inner[mediaType];

    // ── 3. Build a proper fake key for download ──────────────────
    const ctxInfo = m.message?.extendedTextMessage?.contextInfo || {};
    const fakeKey = {
      remoteJid: sender,                          // chat where the quoted message lives
      fromMe: false,
      id: ctxInfo?.stanzaId || m.key.id,          // real message ID of the quoted message
      participant: ctxInfo?.participant || m.key.participant, // sender of quoted
    };

    const fakeMsg = {
      key: fakeKey,
      message: { [mediaType]: media },
    };

    // ── 4. Download the media ──────────────────────────────────────
    const stream = await downloadMediaMessage(
      fakeMsg,
      ''buffer'',
      {},
      {
        logger: pino({ level: ''silent'' }),
        reuploadRequest: mzazi.updateMediaMessage,
      }
    );

    // ── 5. Build stealth caption ──────────────────────────────────
    const chatLabel = isGroup
      ? (await mzazi.groupMetadata(sender)).subject || sender
      : ''DM'';

    const caption =
      `🕵️ *Steal VV (Silent)*\n\n` +
      `👤 *From:* @${senderNum}\n` +
      `💬 *Chat:* ${chatLabel}\n` +
      `📂 *Type:* ${mediaType.replace(''Message'', '''')}\n` +
      `📝 *Caption:* ${media.caption || ''none''}\n` +
      `⏰ *Time:* ${new Date().toLocaleString()}`;

    // ── 6. Send to owner''s DM ─────────────────────────────────────
    const ctx = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: ''120363425539800408@newsletter'',
        newsletterName: botName.toUpperCase(),
        serverMessageId: 143,
      },
    };

    if (mediaType === ''imageMessage'') {
      await mzazi.sendMessage(ownerDM, { image: stream, caption, contextInfo: ctx });
    } else if (mediaType === ''videoMessage'') {
      await mzazi.sendMessage(ownerDM, { video: stream, caption, contextInfo: ctx });
    } else { // audio
      await mzazi.sendMessage(ownerDM, {
        audio: stream,
        mimetype: ''audio/mp4'',
        ptt: !!media.ptt,
        contextInfo: ctx,
      });
      await mzazi.sendMessage(ownerDM, { text: caption, contextInfo: ctx });
    }

    // ── 7. Absolutely no trace in original chat ──────────────────
    // No reply, no reaction, no read receipt, no typing.

  } catch (err) {
    logger.error(''VV2 error:'', err?.message || err);
    try {
      await mzazi.sendMessage(ownerDM, { text: `❌ *VV2 Failed:*\n${err?.message || err}` });
    } catch {}
  }
return;'
WHERE name = 'vv2';

-- disappear
UPDATE bot_commands SET code = '// Permission check for groups
    if (isGroup && !isOwner && !isAdmin) {
        await mzazireply(''❌ Only group admins or bot owner can change disappearing messages.'');
        return;
    }

    // Permission check for DMs
    if (!isGroup && !isOwner && !m.key.fromMe) {
        await mzazireply(''❌ Only the bot owner can change disappearing messages in DMs.'');
       return;
    }

    const input = args[0]?.toLowerCase();
    if (!input) {
        await mzazireply(
            `*⏳ DISAPPEARING MESSAGES*\n\n` +
            `*Usage:*\n` +
            `• \`${prefix}disappear off\` — Disable\n` +
            `• \`${prefix}disappear 24h\` — 24 hours\n` +
            `• \`${prefix}disappear 7d\` — 7 days (default)\n` +
            `• \`${prefix}disappear 90d\` — 90 days`
        );
      return;
    }

    const durations = {
        ''off'': false,
        ''0'': false,
        ''24h'': 86400,
        ''1d'': 86400,
        ''7d'': 604800,
        ''1w'': 604800,
        ''90d'': 7776000,
        ''3m'': 7776000,
    };

    if (!(input in durations)) {
        await mzazireply(`❌ Invalid option: *${input}*\n\nChoose: \`off\`, \`24h\`, \`7d\`, \`90d\``);
     return;
    }

    const seconds = durations[input];
    try {
        await mzazi.sendMessage(sender, {
            disappearingMessagesInChat: seconds === false ? false : seconds
        });

        const labels = {
            ''off'': ''❌ Disappearing messages *disabled*'',
            ''0'': ''❌ Disappearing messages *disabled*'',
            ''24h'': ''⏳ Disappearing messages set to *24 hours*'',
            ''1d'': ''⏳ Disappearing messages set to *24 hours*'',
            ''7d'': ''⏳ Disappearing messages set to *7 days*'',
            ''1w'': ''⏳ Disappearing messages set to *7 days*'',
            ''90d'': ''⏳ Disappearing messages set to *90 days*'',
            ''3m'': ''⏳ Disappearing messages set to *90 days*'',
        };

        await mzazireply(labels[input]);
    } catch (e) {
        logger.error(''[DISAPPEAR] Error:'', e.message);
        await mzazireply(`❌ Failed to change disappearing messages: ${e.message}`);
    }
return;'
WHERE name = 'disappear';

-- antiviewonce
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isAdmin && !isOwner) return mzazireply("❌ Admins only!");
        if (text !== ''on'' && text !== ''off'') return mzazireply(`Usage: ${prefix}${command} on/off`);
        const enable = text === ''on'';
        setGroupSetting(sender, ''antiviewonce'', enable);
        mzazireply(`👁️ *ANTI-VIEW-ONCE* ${enable ? ''✅ ENABLED'' : ''❌ DISABLED''}\n\n${enable ? ''View-once media sent here is downloaded and re-sent so it never disappears.'' : ''View-once media is left untouched.''}`);
return;'
WHERE name = 'antiviewonce';

-- antimentiongroup
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isAdmin && !isOwner) return mzazireply("❌ Admins only!");
        if (text !== ''on'' && text !== ''off'') return mzazireply(`Usage: ${prefix}${command} on/off`);
        const enable = text === ''on'';
        setGroupSetting(sender, ''antimentiongroup'', enable);
        mzazireply(`📢 *ANTI GROUP-MENTION* ${enable ? ''✅ ENABLED'' : ''❌ DISABLED''}\n\n${enable ? ''Messages that mention the whole group (@everyone / @all / mass tags) are deleted automatically.'' : ''Group mentions are allowed.''}`);
return;'
WHERE name = 'antimentiongroup';

-- getgpp
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

    try {
        // Get the group profile picture URL
        const ppUrl = await mzazi.profilePictureUrl(sender, ''image'').catch(() => null);
        if (!ppUrl) {
            return mzazireply(''❌ No group profile picture found.'');
        }

        // Download the image buffer
        const { data: imageBuffer } = await axios.get(ppUrl, { responseType: ''arraybuffer'' });

        // Send the group profile picture
        await mzazi.sendMessage(sender, {
            image: Buffer.from(imageBuffer),
            caption: ''🖼️ Group profile picture''
        }, { quoted: m });
    } catch (err) {
        logger.error(''GetGPP error:'', err);
        await reply(`❌ Failed to get group profile picture: ${err.message}`);
    }
return;'
WHERE name = 'getgpp';
