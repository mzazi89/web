-- QUARTZ XD — live-DB command updates
-- Run ONCE in the Neon SQL console against the shared database.
-- LID resolution: mentions/blocklist now resolve @lid jids to real phone numbers
-- (requires quartz deploy with resolveJid first).

-- promote
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
    if (!isOwner && !isAdmin) return mzazireply("❌ Admins only!");
    

    let target = null;

    // 1. Check for mentioned JID
    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentionedJid && mentionedJid.length > 0) {
        target = mentionedJid[0];
    }

    // 2. If no mention, check if replying to a message
    if (!target) {
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            // Get the sender of the quoted message
            target = m.message?.extendedTextMessage?.contextInfo?.participant ||
                     m.key?.participant ||
                     quotedMsg?.key?.participant ||
                     quotedMsg?.key?.remoteJid;
        }
    }

    if (!target) {
        return mzazireply(`📌 Usage:\n${prefix}promote @user\nOR reply to the user''s message with:\n${prefix}promote`);
    }

    // Normalize JID — strip device suffix, build proper s.whatsapp.net JID
    const targetNum = target.split(''@'')[0].split('':'')[0].replace(/[^0-9]/g, '''');
    if (!targetNum) {
        return mzazireply("❌ Invalid target user.");
    }
    target = targetNum + ''@s.whatsapp.net'';

    // Prevent promoting owner/bot
    if (ownersList.includes(targetNum)) {
        return mzazireply("❌ Cannot promote the bot owner.");
    }
    if (targetNum === botJid) {
        return mzazireply("❌ Cannot promote the bot itself.");
    }

    // Check if target is already an admin (groupAdmins contains normalizeJid digits)
    if (groupAdmins.includes(targetNum)) {
        return mzazireply("⚠️ User is already an admin.");
    }

    await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''promote'');
    await mzazireply(`✅ @${targetNum} promoted to admin!`, { mentions: [target] });
return;'
WHERE name = 'promote';

-- demote
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
    if (!isOwner && !isAdmin) return mzazireply("❌ Admins only!");
    

    let target = null;

    // 1. Check for mentioned JID
    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentionedJid && mentionedJid.length > 0) {
        target = mentionedJid[0];
    }

    // 2. If no mention, check if replying to a message
    if (!target) {
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            target = m.message?.extendedTextMessage?.contextInfo?.participant ||
                     m.key?.participant ||
                     quotedMsg?.key?.participant ||
                     quotedMsg?.key?.remoteJid;
        }
    }

    if (!target) {
        return mzazireply(`📌 Usage:\n${prefix}demote @user\nOR reply to the user''s message with:\n${prefix}demote`);
    }

    // Normalize JID — strip device suffix, build proper s.whatsapp.net JID
    const targetNum = target.split(''@'')[0].split('':'')[0].replace(/[^0-9]/g, '''');
    if (!targetNum) {
        return mzazireply("❌ Invalid target user.");
    }
    target = targetNum + ''@s.whatsapp.net'';

    // Prevent demoting owner/bot
    if (ownersList.includes(targetNum)) {
        return mzazireply("❌ Cannot demote the bot owner.");
    }
    if (targetNum === botJid) {
        return mzazireply("❌ Cannot demote the bot itself.");
    }

    // Check if target is actually an admin (groupAdmins contains normalizeJid digits)
    if (!groupAdmins.includes(targetNum)) {
        return mzazireply("⚠️ User is not an admin.");
    }

    await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''demote'');
    await mzazireply(`✅ @${targetNum} demoted from admin!`, { mentions: [target] });
return;'
WHERE name = 'demote';

-- warn
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
    if (!isOwner && !isAdmin) return mzazireply("❌ Admins only!");

    let target = null;

    // 1. Check for mentioned JID
    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentionedJid && mentionedJid.length > 0) {
        target = mentionedJid[0];
    }

    // 2. If no mention, check if replying to a message
    if (!target) {
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            target = m.message?.extendedTextMessage?.contextInfo?.participant ||
                     m.key?.participant ||
                     quotedMsg?.key?.participant ||
                     quotedMsg?.key?.remoteJid;
        }
    }

    if (!target) {
        return mzazireply(`📌 Usage:\n${prefix}warn @user\nOR reply to the user''s message with:\n${prefix}warn`);
    }

    // Normalize JID — strip device suffix, build proper s.whatsapp.net JID
    const targetNum = target.split(''@'')[0].split('':'')[0].replace(/[^0-9]/g, '''');
    if (!targetNum) {
        return mzazireply("❌ Invalid target user.");
    }
    target = targetNum + ''@s.whatsapp.net'';

    // Prevent warning owner or bot
    if (ownersList.includes(targetNum)) {
        return mzazireply("❌ Cannot warn the bot owner.");
    }
    if (targetNum === botJid) {
        return mzazireply("❌ Cannot warn the bot itself.");
    }

    // Prevent warning admins (groupAdmins contains normalizeJid digits)
    if (groupAdmins.includes(targetNum)) {
        return mzazireply("❌ Cannot warn a group admin.");
    }

    // Add warning
    const warnCount = addWarn(sender, await resolveJid(target));

    if (warnCount >= 3 && isBotAdmin) {
        // Kick user after 3 warnings
        await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''remove'');
        resetWarn(sender, await resolveJid(target));
        await mzazireply(`⛔ @${targetNum} has been kicked after 3 warnings!`, { mentions: [target] });
    } else {
        const remaining = 3 - warnCount;
        await mzazireply(`⚠️ @${targetNum} warned!\nWarnings: ${warnCount}/3\n⚠️ ${remaining} more warning(s) before kick.`, { mentions: [target] });
    }
return;'
WHERE name = 'warn';

-- resetwarn
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isOwner && !isAdmin) return mzazireply("❌ Admins only!");
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentionedJid || mentionedJid.length === 0) return mzazireply(`Usage: ${prefix}resetwarn @user`);
        const target = mentionedJid[0];
        resetWarn(sender, await resolveJid(target));
        mzazireply(`✅ Warnings reset for @${target.split(''@'')[0]}!`);'
WHERE name = 'resetwarn';

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
        const ppUrl = await mzazi.profilePictureUrl(await resolveJid(targetJid), ''image'').catch(() => null);
        if (!ppUrl) {
            await mzazireply(`❌ No profile picture found for @${jidToNumber(await resolveJid(targetJid))}.`, { mentions: [targetJid] });
           return;
        }

        // Download the image buffer
        const { data: imageBuffer } = await axios.get(ppUrl, { responseType: ''arraybuffer'' });

        // Send the profile picture
        await mzazi.sendMessage(sender, {
            image: Buffer.from(imageBuffer),
            caption: `📸 Profile picture of @${jidToNumber(await resolveJid(targetJid))}`,
            mentions: [targetJid]
        }, { quoted: m });
    } catch (err) {
        logger.error(''GetPP error:'', err);
        await reply(`❌ Failed to get profile picture: ${err.message}`);
    }
return;'
WHERE name = 'getpp';

-- roast
UPDATE bot_commands SET code = 'const roasts = ["You''re the reason they put instructions on shampoo bottles.","I''d agree with you, but then we''d both be wrong.","You''re like a cloud — when you disappear, it''s a beautiful day.","Your birth certificate is an apology letter from the hospital.","I''d call you a tool, but that would mean you''re useful.","If laughter is the best medicine, your face must be curing diseases.","I''ve seen better arguments in alphabet soup.","You have your whole life to be an idiot. Why not take today off?","I''d explain it to you, but I don''t have crayons handy.","You''re proof that evolution can go in reverse."];
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const targetName = target ? `@${jidToNumber(await resolveJid(target))}` : "you";
        mzazireply(`🔥 *ROAST*\n\n${targetName}, ${roasts[Math.floor(Math.random() * roasts.length)]}`);
return;'
WHERE name = 'roast';

-- compliment
UPDATE bot_commands SET code = 'const compliments = ["You are absolutely incredible! 🌟","Your smile could light up the darkest room ✨","You have such an amazing personality! 💫","You make the world a better place just by being in it 🌍","You''re one of the most talented people I know 🏆","Your kindness is truly inspiring 💖","You have a heart of gold 🥇","You''re more fun than bubble wrap 🎉","You light up every room you walk into 🌟","Your positive energy is contagious! ⚡"];
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const targetName = target ? `@${jidToNumber(await resolveJid(target))}` : "you";
        mzazireply(`💝 *COMPLIMENT*\n\n${targetName}, ${compliments[Math.floor(Math.random() * compliments.length)]}`);
return;'
WHERE name = 'compliment';

-- ship
UPDATE bot_commands SET code = 'const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length < 2) return mzazireply(`💕 Mention 2 users!\nExample: ${prefix}ship @user1 @user2`);
        const p1 = jidToNumber(await resolveJid(mentioned[0]));
        const p2 = jidToNumber(await resolveJid(mentioned[1]));
        const score = Math.floor(Math.random() * 101);
        let heart = score >= 80 ? "❤️❤️❤️" : score >= 50 ? "💛💛" : "💔";
        mzazireply(`💕 *LOVE METER*\n\n@${p1} + @${p2}\n\n💘 Compatibility: ${score}%\n${"█".repeat(Math.floor(score/10))}${"░".repeat(10 - Math.floor(score/10))} ${score}%\n\n${heart}`);
return;'
WHERE name = 'ship';

-- howgay
UPDATE bot_commands SET code = 'const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const name = target ? `@${jidToNumber(await resolveJid(target))}` : senderNum;
        const score = Math.floor(Math.random() * 101);
        mzazireply(`🏳️‍🌈 *GAY METER*\n\n${name} is ${score}% gay\n${"█".repeat(Math.floor(score/10))}${"░".repeat(10-Math.floor(score/10))} ${score}%`);
return;'
WHERE name = 'howgay';

-- howstupid
UPDATE bot_commands SET code = 'const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const name = target ? `@${jidToNumber(await resolveJid(target))}` : senderNum;
        const score = Math.floor(Math.random() * 101);
        mzazireply(`🤪 *STUPID METER*\n\n${name} is ${score}% stupid\n${"█".repeat(Math.floor(score/10))}${"░".repeat(10-Math.floor(score/10))} ${score}%`);
return;'
WHERE name = 'howstupid';

-- howrich
UPDATE bot_commands SET code = 'const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const name = target ? `@${jidToNumber(await resolveJid(target))}` : senderNum;
        const score = Math.floor(Math.random() * 101);
        mzazireply(`💰 *RICH METER*\n\n${name} is ${score}% rich\n${"█".repeat(Math.floor(score/10))}${"░".repeat(10-Math.floor(score/10))} ${score}%`);
return;'
WHERE name = 'howrich';

-- iq
UPDATE bot_commands SET code = 'const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const name = target ? `@${jidToNumber(await resolveJid(target))}` : senderNum;
        const score = Math.floor(Math.random() * 201);
        mzazireply(`🧠 *IQ METER*\n\n${name}''s IQ: ${score}\n${score >= 140 ? "Genius! 🏆" : score >= 110 ? "Above average 🌟" : score >= 90 ? "Average 😐" : "Below average 💔"}`);
return;'
WHERE name = 'iq';

-- howugly
UPDATE bot_commands SET code = 'const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const name = target ? `@${jidToNumber(await resolveJid(target))}` : senderNum;
        const score = Math.floor(Math.random() * 101);
        mzazireply(`😬 *UGLY METER*\n\n${name} is ${score}% ugly\n${"█".repeat(Math.floor(score/10))}${"░".repeat(10-Math.floor(score/10))} ${score}%`);
return;'
WHERE name = 'howugly';

-- howcute
UPDATE bot_commands SET code = 'const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const name = target ? `@${jidToNumber(await resolveJid(target))}` : senderNum;
        const score = Math.floor(Math.random() * 101);
        mzazireply(`🥰 *CUTE METER*\n\n${name} is ${score}% cute\n${"█".repeat(Math.floor(score/10))}${"░".repeat(10-Math.floor(score/10))} ${score}%`);
return;'
WHERE name = 'howcute';

-- rate
UPDATE bot_commands SET code = 'const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const name = target ? `@${jidToNumber(await resolveJid(target))}` : senderNum;
        const score = Math.floor(Math.random() * 10) + 1;
        const stars = "⭐".repeat(score) + "☆".repeat(10-score);
        mzazireply(`⭐ *RATE*\n\n${name} rated: ${score}/10\n${stars}`);
return;'
WHERE name = 'rate';

-- pendingrequests
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isAdmin && !isOwner) return mzazireply("❌ Admins only!");
        try {
          const requests4 = await mzazi.groupRequestParticipantsList(sender);
          if (!requests4?.length) return mzazireply("📭 No pending join requests.");
          let reqText = `📋 *PENDING REQUESTS*\n\n`;
          for (let rIdx = 0; rIdx < requests4.length; rIdx++) { const req = requests4[rIdx]; reqText += `${rIdx+1}. @${jidToNumber(await resolveJid(req.jid))}\n`; }
          await mzazi.sendMessage(sender, { text: reqText, mentions: requests4.map(r=>r.jid) }, { quoted: m });
        } catch(e) { mzazireply("❌ Failed to fetch requests"); }
return;'
WHERE name = 'pendingrequests';

-- groupmembers
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        let memberList = `👥 *GROUP MEMBERS*\n\n📛 ${groupName}\n\n`;
        for (let pIdx = 0; pIdx < participants.length; pIdx++) { const p = participants[pIdx]; const isA = groupAdmins.includes(normalizeJid(p.id)); memberList += `${pIdx+1}. ${isA ? "👑" : "👤"} @${jidToNumber(await resolveJid(p.id))}\n`; }
        memberList += `\n📊 Total: ${participants.length}`;
        await mzazi.sendMessage(sender, { text: memberList, mentions: participants.map(p=>p.id) }, { quoted: m });
return;'
WHERE name = 'groupmembers';

-- block
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const mentioned3 = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentioned3?.length && !text) return mzazireply(`Usage: ${prefix}block @user`);
        const targetBlock = mentioned3?.[0] || `${text.replace(/\D/g,"")}@s.whatsapp.net`;
        try {
          await mzazi.updateBlockStatus(targetBlock, "block");
          mzazireply(`✅ @${jidToNumber(await resolveJid(targetBlock))} has been blocked!`);
        } catch(e) { mzazireply("❌ Failed to block user"); }
return;'
WHERE name = 'block';

-- unblock
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const mentioned4 = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentioned4?.length && !text) return mzazireply(`Usage: ${prefix}unblock @user`);
        const targetUnblock = mentioned4?.[0] || `${text.replace(/\D/g,"")}@s.whatsapp.net`;
        try {
          await mzazi.updateBlockStatus(targetUnblock, "unblock");
          mzazireply(`✅ @${jidToNumber(await resolveJid(targetUnblock))} has been unblocked!`);
        } catch(e) { mzazireply("❌ Failed to unblock user"); }
return;'
WHERE name = 'unblock';

-- deleteowner
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const mentioned5 = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentioned5?.length) return mzazireply(`Usage: ${prefix}delowner @user`);
        const targetDel = jidToNumber(await resolveJid(mentioned5[0]));
        if (targetDel === botPhoneNum) return mzazireply("❌ Cannot remove bot''s own owner status!");
        delOwner(targetDel);
        mzazireply(`✅ @${targetDel} removed from owners!`);
return;'
WHERE name = 'deleteowner';

-- whois
UPDATE bot_commands SET code = 'const mentioned6 = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const targetJid3 = mentioned6?.[0] || msgSender;
        const targetNum3 = jidToNumber(await resolveJid(targetJid3));
        const isTargetAdmin = isGroup && groupAdmins.includes(normalizeJid(targetJid3));
        const isTargetOwner2 = getOwners().includes(targetNum3);
        const isTargetPaid = paidUsers.includes(targetJid3) || paidUsers.includes(targetNum3);
        let ppUrl2 = null;
        try { ppUrl2 = await mzazi.profilePictureUrl(await resolveJid(targetJid3), "image"); } catch(e) {}
        const statusText2 = [
          isTargetOwner2 ? "👑 Bot Owner" : null,
          isTargetAdmin ? "🛡️ Group Admin" : null,
          isTargetPaid ? "💎 Paid User" : null
        ].filter(Boolean).join(" | ") || "👤 Regular User";
        mzazireply(`🔍 *USER INFO*\n\n📱 Number: +${targetNum3}\n🆔 JID: ${targetJid3}\n🏷️ Status: ${statusText2}\n📸 Photo: ${ppUrl2 ? "✅ Has photo" : "❌ No photo"}`);
return;'
WHERE name = 'whois';

-- birthday
UPDATE bot_commands SET code = 'if (!text) return mzazireply(`Example: ${prefix}birthday @user`);
        const bTarget = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const bName = bTarget ? `@${jidToNumber(await resolveJid(bTarget))}` : text;
        mzazireply(`🎂 *HAPPY BIRTHDAY!*\n\n🎉 ${bName}!\n\n🎁 Wishing you a wonderful day filled with joy, laughter and love!\n🥳 May all your dreams come true!\n🍰 Hope this year brings you everything you deserve!\n\n💖 From ${botName}`);
return;'
WHERE name = 'birthday';

-- tagmembers
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        if (!isAdmin && !isOwner) return mzazireply("❌ Admins only!");
        const tagMsg = text || "📢 Attention everyone!";
        const allMembers = participants.map(p => normalizeJid(p.id)).filter(Boolean);
        let tagTxt = `📢 *${groupName}*\n\n${tagMsg}\n\n`;
        for (const jid of allMembers) { tagTxt += `➤ @${jidToNumber(await resolveJid(jid))}\n`; }
        await mzazi.sendMessage(sender, { text: tagTxt, mentions: allMembers }, { quoted: m });
return;'
WHERE name = 'tagmembers';

-- tagadmin
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        const adminTag = text || "📢 Attention admins!";
        let adminTagTxt = `👑 *ADMIN MENTION*\n\n${adminTag}\n\n`;
        for (const jid of groupAdmins) { adminTagTxt += `➤ @${jidToNumber(await resolveJid(jid))}\n`; }
        await mzazi.sendMessage(sender, { text: adminTagTxt, mentions: groupAdmins }, { quoted: m });
return;'
WHERE name = 'tagadmin';

-- leaderboard
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");
        mzazireply(`🏆 *LEADERBOARD*\n\n📛 Group: ${groupName}\n\n1. 👑 @${jidToNumber(await resolveJid(groupAdmins[0] || msgSender))}\n2. 🥈 @${jidToNumber(await resolveJid(participants[1]?.id || msgSender))}\n3. 🥉 @${jidToNumber(await resolveJid(participants[2]?.id || msgSender))}\n\n_Rankings reset weekly_`);
return;'
WHERE name = 'leaderboard';

-- ttt
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const tttId = sender; // group jid

  // ── Start new game ──
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length > 0 || args[0]?.includes("@")) {
    const opponent = mentioned[0];
    if (!opponent) return mzazireply(`❌ Mention a player!\nExample: ${prefix}ttt @player`);
    if (opponent === msgSender) return mzazireply("❌ You can''t challenge yourself!");

    if (global.tttGames.has(tttId)) return mzazireply("❌ A game is already running in this group! Use *endttt* to stop it.");

    global.tttGames.set(tttId, {
      board: [" ", " ", " ", " ", " ", " ", " ", " ", " "],
      players: [msgSender, opponent],
      symbols: ["❌", "⭕"],
      turn: 0,
      startedAt: Date.now()
    });

    const p1 = `@${jidToNumber(await resolveJid(msgSender))}`;
    const p2 = `@${jidToNumber(await resolveJid(opponent))}`;

    const board = global.tttGames.get(tttId).board;
    const drawBoard = (b) =>
      `┌───┬───┬───┐\n│ ${b[0]} │ ${b[1]} │ ${b[2]} │\n├───┼───┼───┤\n│ ${b[3]} │ ${b[4]} │ ${b[5]} │\n├───┼───┼───┤\n│ ${b[6]} │ ${b[7]} │ ${b[8]} │\n└───┴───┴───┘`;

    return mzazi.sendMessage(sender, {
      text: `🎮 *TIC-TAC-TOE STARTED!*\n\n${p1} ❌  vs  ⭕ ${p2}\n\nPositions:\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\n${drawBoard(["1","2","3","4","5","6","7","8","9"])}\n\n${p1}''s turn! Type *${prefix}ttt <1-9>* to play.`,
      mentions: [msgSender, opponent]
    }, { quoted: m });
  }

  // ── Make a move ──
  const game = global.tttGames.get(tttId);
  if (!game) return mzazireply(`❌ No active Tic-Tac-Toe game. Start one with *${prefix}ttt @player*`);

  const pos = parseInt(args[0]);
  if (isNaN(pos) || pos < 1 || pos > 9) return mzazireply("❌ Choose a position from 1 to 9.");

  const currentPlayer = game.players[game.turn % 2];
  if (msgSender !== currentPlayer) return mzazireply(`⏳ It''s not your turn!`);

  const idx = pos - 1;
  if (game.board[idx] !== " ") return mzazireply("❌ That spot is taken! Choose another.");

  game.board[idx] = game.symbols[game.turn % 2];
  game.turn++;

  const drawBoard = (b) =>
    `┌───┬───┬───┐\n│ ${b[0]} │ ${b[1]} │ ${b[2]} │\n├───┼───┼───┤\n│ ${b[3]} │ ${b[4]} │ ${b[5]} │\n├───┼───┼───┤\n│ ${b[6]} │ ${b[7]} │ ${b[8]} │\n└───┴───┴───┘`;

  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const checkWin = (b, sym) => wins.some(([a,c,d]) => b[a] === sym && b[c] === sym && b[d] === sym);
  const isDraw = (b) => b.every(c => c !== " ");

  const sym = game.symbols[(game.turn - 1) % 2];
  const boardStr = drawBoard(game.board);

  if (checkWin(game.board, sym)) {
    global.tttGames.delete(tttId);
    return mzazi.sendMessage(sender, {
      text: `🎮 *TIC-TAC-TOE*\n\n${boardStr}\n\n🏆 @${jidToNumber(await resolveJid(currentPlayer))} WINS! Congratulations! 🎉`,
      mentions: [currentPlayer]
    }, { quoted: m });
  }

  if (isDraw(game.board)) {
    global.tttGames.delete(tttId);
    return mzazireply(`🎮 *TIC-TAC-TOE*\n\n${boardStr}\n\n🤝 It''s a DRAW! Well played!`);
  }

  const nextPlayer = game.players[game.turn % 2];
  const nextSym = game.symbols[game.turn % 2];
  return mzazi.sendMessage(sender, {
    text: `🎮 *TIC-TAC-TOE*\n\n${boardStr}\n\n${nextSym} @${jidToNumber(await resolveJid(nextPlayer))}''s turn! Type *${prefix}ttt <1-9>*`,
    mentions: [nextPlayer]
  }, { quoted: m });
return;'
WHERE name = 'ttt';

-- hangman
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const hmId = sender;

  const hangStages = [
    "```\n  +---+\n      |\n      |\n      |\n      |\n=========```",
    "```\n  +---+\n  O   |\n      |\n      |\n      |\n=========```",
    "```\n  +---+\n  O   |\n  |   |\n      |\n      |\n=========```",
    "```\n  +---+\n  O   |\n /|   |\n      |\n      |\n=========```",
    "```\n  +---+\n  O   |\n /|\\  |\n      |\n      |\n=========```",
    "```\n  +---+\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
    "```\n  +---+\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```"
  ];

  const wordList = [
    "javascript","python","computer","keyboard","internet","database","algorithm","developer",
    "programming","function","variable","elephant","butterfly","chocolate","adventure","friendship",
    "mountain","universe","discovery","knowledge","beautiful","wonderful","fantastic","excellent",
    "whatsapp","instagram","youtube","facebook","telegram","microphone","headphones","bluetooth",
    "technology","artificial","intelligence","education","happiness","celebrate","champion",
    "rainbow","sunshine","horizon","treasure","paradise","creative","universe","wonderful"
  ];

  // ── Start new game (no args) ──
  if (!args[0] || args[0].length > 1) {
    if (global.hangmanGames.has(hmId)) return mzazireply(`❌ A Hangman game is already running! Guess a letter with *${prefix}hangman <letter>* or stop with *${prefix}endhangman*`);

    const word = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
    global.hangmanGames.set(hmId, {
      word,
      guessed: [],
      wrong: 0,
      maxWrong: 6,
      startedBy: msgSender,
      startedAt: Date.now()
    });

    const display = word.split("").map(l => "_ ").join("").trim();
    return mzazireply(`🎮 *HANGMAN STARTED!*\n\n${hangStages[0]}\n\n📝 Word: ${display}\n📏 Length: ${word.length} letters\n\nGuess a letter: *${prefix}hangman <letter>*\nStop: *${prefix}endhangman*`);
  }

  // ── Guess a letter ──
  const game = global.hangmanGames.get(hmId);
  if (!game) return mzazireply(`❌ No active Hangman game. Start one with *${prefix}hangman*`);

  const letter = args[0].toUpperCase();
  if (!/^[A-Z]$/.test(letter)) return mzazireply("❌ Please guess a single letter (A–Z).");
  if (game.guessed.includes(letter)) return mzazireply(`❌ *${letter}* was already guessed! Try another.`);

  game.guessed.push(letter);

  if (!game.word.includes(letter)) {
    game.wrong++;
  }

  const display = game.word.split("").map(l => game.guessed.includes(l) ? l : "_").join(" ");
  const wrongLetters = game.guessed.filter(l => !game.word.includes(l)).join(", ") || "None";

  // ── Win ──
  if (!display.includes("_")) {
    global.hangmanGames.delete(hmId);
    return mzazi.sendMessage(sender, {
      text: `🎮 *HANGMAN*\n\n${hangStages[game.wrong]}\n\n✅ The word was: *${game.word}*\n\n🏆 @${jidToNumber(await resolveJid(msgSender))} guessed it! 🎉`,
      mentions: [msgSender]
    }, { quoted: m });
  }

  // ── Lose ──
  if (game.wrong >= game.maxWrong) {
    global.hangmanGames.delete(hmId);
    return mzazireply(`🎮 *HANGMAN*\n\n${hangStages[6]}\n\n💀 GAME OVER!\nThe word was: *${game.word}*\nBetter luck next time!`);
  }

  mzazireply(`🎮 *HANGMAN*\n\n${hangStages[game.wrong]}\n\n📝 Word: ${display}\n❌ Wrong: ${game.wrong}/${game.maxWrong}\n🔤 Guessed: ${game.guessed.join(", ")}\n⚠️ Wrong letters: ${wrongLetters}\n\nGuess a letter: *${prefix}hangman <letter>*`);
return;'
WHERE name = 'hangman';

-- numguess
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const ngId = sender;

  if (!args[0]) {
    // Start new game
    if (global.guessGames.has(ngId)) return mzazireply(`❌ A Number Guess game is running! Use *${prefix}numguess <number>* or *${prefix}endguess* to stop.`);
    const secret = Math.floor(Math.random() * 100) + 1;
    const maxTries = 7;
    global.guessGames.set(ngId, { secret, tries: 0, maxTries, startedBy: msgSender, guessers: {} });
    return mzazireply(`🎮 *NUMBER GUESS GAME!*\n\nI''m thinking of a number between *1 and 100*.\nYou have *${maxTries} tries* to guess it!\n\nType: *${prefix}numguess <number>*\nStop: *${prefix}endguess*`);
  }

  const game = global.guessGames.get(ngId);
  if (!game) return mzazireply(`❌ No active Number Guess game. Start one with *${prefix}numguess*`);

  const guess = parseInt(args[0]);
  if (isNaN(guess) || guess < 1 || guess > 100) return mzazireply("❌ Please guess a number between *1* and *100*.");

  game.tries++;
  const name = m.pushName || jidToNumber(await resolveJid(msgSender));

  if (guess === game.secret) {
    global.guessGames.delete(ngId);
    return mzazi.sendMessage(sender, {
      text: `🎮 *NUMBER GUESS*\n\n🏆 @${jidToNumber(await resolveJid(msgSender))} got it!\nThe number was *${game.secret}*!\nGuessed in *${game.tries}* tries! 🎉`,
      mentions: [msgSender]
    }, { quoted: m });
  }

  if (game.tries >= game.maxTries) {
    global.guessGames.delete(ngId);
    return mzazireply(`🎮 *NUMBER GUESS*\n\n💀 GAME OVER! Out of tries.\nThe number was *${game.secret}*. Better luck next time!`);
  }

  const hint = guess < game.secret ? "📈 Too LOW! Go higher." : "📉 Too HIGH! Go lower.";
  const triesLeft = game.maxTries - game.tries;
  mzazireply(`🎮 *NUMBER GUESS*\n\n${hint}\nYour guess: *${guess}*\nTries left: *${triesLeft}/${game.maxTries}*\n\nType: *${prefix}numguess <number>*`);
return;'
WHERE name = 'numguess';

-- scramble
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const scId = sender;

  const scrambleWords = [
    {word:"ELEPHANT",hint:"🐘 Big animal"},
    {word:"CHOCOLATE",hint:"🍫 Sweet treat"},
    {word:"KEYBOARD",hint:"⌨️ Computer part"},
    {word:"FOOTBALL",hint:"⚽ Popular sport"},
    {word:"RAINBOW",hint:"🌈 After rain"},
    {word:"BUTTERFLY",hint:"🦋 Flying insect"},
    {word:"MOUNTAIN",hint:"⛰️ High landform"},
    {word:"INTERNET",hint:"🌐 Global network"},
    {word:"SUNSHINE",hint:"☀️ Warm light"},
    {word:"TREASURE",hint:"💰 Hidden riches"},
    {word:"ADVENTURE",hint:"🗺️ Exciting journey"},
    {word:"CHAMPION",hint:"🏆 Number one winner"},
    {word:"HOSPITAL",hint:"🏥 Medical place"},
    {word:"AIRPLANE",hint:"✈️ Flying vehicle"},
    {word:"DINOSAUR",hint:"🦕 Extinct reptile"},
    {word:"LANGUAGE",hint:"🗣️ Communication system"},
    {word:"UNIVERSE",hint:"🌌 All of space"},
    {word:"CALENDAR",hint:"📅 Tracks dates"},
    {word:"ELEPHANT",hint:"🐘 Never forgets"},
    {word:"SANDWICH",hint:"🥪 Lunch staple"},
    {word:"UMBRELLA",hint:"☂️ Blocks rain"},
    {word:"BIRTHDAY",hint:"🎂 Annual celebration"},
    {word:"DECEMBER",hint:"🎄 Last month"},
    {word:"HOSPITAL",hint:"🏥 For sick people"},
    {word:"COMPUTER",hint:"💻 Digital machine"},
  ];

  const shuffle = (str) => str.split("").sort(() => Math.random() - 0.5).join("");

  // ── Start new game ──
  if (!args[0]) {
    if (global.scrambleGames.has(scId)) return mzazireply(`❌ A Scramble game is already running! Answer with *${prefix}scramble <word>* or stop with *${prefix}endscramble*`);

    const pick = scrambleWords[Math.floor(Math.random() * scrambleWords.length)];
    let scrambled = shuffle(pick.word);
    while (scrambled === pick.word) scrambled = shuffle(pick.word);

    global.scrambleGames.set(scId, {
      word: pick.word,
      scrambled,
      hint: pick.hint,
      startedAt: Date.now(),
      startedBy: msgSender
    });

    return mzazireply(`🎮 *WORD SCRAMBLE!*\n\nUnscramble this word:\n\n🔀 *${scrambled}*\n\n💡 Hint: ${pick.hint}\n📏 Letters: ${pick.word.length}\n\nAnswer: *${prefix}scramble <your answer>*\nStop: *${prefix}endscramble*`);
  }

  // ── Submit answer ──
  const game = global.scrambleGames.get(scId);
  if (!game) return mzazireply(`❌ No active Scramble game. Start one with *${prefix}scramble*`);

  const answer = args.join(" ").toUpperCase().trim();
  if (answer === game.word) {
    global.scrambleGames.delete(scId);
    return mzazi.sendMessage(sender, {
      text: `🎮 *WORD SCRAMBLE*\n\n✅ Correct! The word was *${game.word}*!\n\n🏆 @${jidToNumber(await resolveJid(msgSender))} wins! 🎉`,
      mentions: [msgSender]
    }, { quoted: m });
  }

  mzazi.sendMessage(sender, {
    text: `🎮 *WORD SCRAMBLE*\n\n❌ @${jidToNumber(await resolveJid(msgSender))} Wrong! Try again.\n\n🔀 Scrambled: *${game.scrambled}*\n💡 Hint: ${game.hint}\n\nAnswer: *${prefix}scramble <your answer>*`,
    mentions: [msgSender]
  }, { quoted: m });
return;'
WHERE name = 'scramble';

-- quiz
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const qzId = sender;

  const questions = [
    {q:"What is the capital of Kenya?",opts:["A. Nairobi","B. Mombasa","C. Kisumu","D. Nakuru"],ans:"A",exp:"Nairobi is the capital of Kenya 🇰🇪"},
    {q:"What is 15 × 15?",opts:["A. 175","B. 200","C. 225","D. 250"],ans:"C",exp:"15 × 15 = 225 ✅"},
    {q:"Which planet is called the Red Planet?",opts:["A. Venus","B. Jupiter","C. Mars","D. Saturn"],ans:"C",exp:"Mars is called the Red Planet 🔴"},
    {q:"What is H2O?",opts:["A. Oxygen","B. Hydrogen","C. Water","D. Salt"],ans:"C",exp:"H2O is the chemical formula for Water 💧"},
    {q:"How many sides does a hexagon have?",opts:["A. 5","B. 6","C. 7","D. 8"],ans:"B",exp:"A hexagon has 6 sides ⬡"},
    {q:"Who wrote Romeo and Juliet?",opts:["A. Charles Dickens","B. William Shakespeare","C. Mark Twain","D. J.K. Rowling"],ans:"B",exp:"Romeo and Juliet was written by William Shakespeare 🎭"},
    {q:"What is the fastest land animal?",opts:["A. Lion","B. Horse","C. Cheetah","D. Tiger"],ans:"C",exp:"The Cheetah is the fastest land animal 🐆"},
    {q:"Which ocean is the largest?",opts:["A. Atlantic","B. Indian","C. Arctic","D. Pacific"],ans:"D",exp:"The Pacific Ocean is the largest 🌊"},
    {q:"What is 100 ÷ 4?",opts:["A. 20","B. 25","C. 30","D. 40"],ans:"B",exp:"100 ÷ 4 = 25 ✅"},
    {q:"What gas do plants absorb during photosynthesis?",opts:["A. Oxygen","B. Nitrogen","C. Carbon Dioxide","D. Hydrogen"],ans:"C",exp:"Plants absorb CO₂ during photosynthesis 🌿"},
    {q:"How many continents are there on Earth?",opts:["A. 5","B. 6","C. 7","D. 8"],ans:"C",exp:"There are 7 continents on Earth 🌍"},
    {q:"What is the largest mammal in the world?",opts:["A. Elephant","B. Giraffe","C. Blue Whale","D. Hippo"],ans:"C",exp:"The Blue Whale is the largest mammal 🐋"},
    {q:"Which country has the most people?",opts:["A. USA","B. India","C. China","D. Brazil"],ans:"B",exp:"India is the most populous country 🇮🇳"},
    {q:"What color is the sun?",opts:["A. Yellow","B. Orange","C. Red","D. White"],ans:"D",exp:"The sun is actually white — it appears yellow due to Earth''s atmosphere ☀️"},
    {q:"What is the chemical symbol for Gold?",opts:["A. Go","B. Gd","C. Au","D. Ag"],ans:"C",exp:"Gold''s chemical symbol is Au (from Latin Aurum) 🥇"},
    {q:"How many bones are in the adult human body?",opts:["A. 186","B. 206","C. 226","D. 246"],ans:"B",exp:"The adult human body has 206 bones 🦴"},
    {q:"What is the capital of Japan?",opts:["A. Osaka","B. Kyoto","C. Tokyo","D. Hiroshima"],ans:"C",exp:"Tokyo is the capital of Japan 🇯🇵"},
    {q:"Which element has the symbol ''O''?",opts:["A. Gold","B. Osmium","C. Oxygen","D. Oganesson"],ans:"C",exp:"O is the symbol for Oxygen 💨"},
    {q:"What is the smallest planet in our solar system?",opts:["A. Mars","B. Mercury","C. Venus","D. Pluto"],ans:"B",exp:"Mercury is the smallest planet ☿"},
    {q:"In which year did World War 2 end?",opts:["A. 1943","B. 1944","C. 1945","D. 1946"],ans:"C",exp:"World War 2 ended in 1945 🕊️"},
  ];

  // ── Start new quiz ──
  if (!args[0] || args[0].length > 1) {
    if (global.quizGames.has(qzId)) return mzazireply(`❌ A quiz is running! Answer with *${prefix}quiz A/B/C/D* or stop with *${prefix}endquiz*`);

    const q = questions[Math.floor(Math.random() * questions.length)];
    global.quizGames.set(qzId, { ...q, startedAt: Date.now(), startedBy: msgSender, answered: false });

    // Auto-expire after 30 seconds
    setTimeout(() => {
      const gm = global.quizGames.get(qzId);
      if (gm && !gm.answered) {
        global.quizGames.delete(qzId);
        mzazi.sendMessage(qzId, { text: `⏰ *QUIZ EXPIRED!*\n\nNobody answered in time!\nThe answer was: *${gm.ans}* — ${gm.exp}` }).catch(() => {});
      }
    }, 30000);

    return mzazireply(`🎮 *GROUP QUIZ!*\n\n❓ ${q.q}\n\n${q.opts.join("\n")}\n\nAnswer: *${prefix}quiz A/B/C/D*\n⏰ 30 seconds!`);
  }

  // ── Submit answer ──
  const game = global.quizGames.get(qzId);
  if (!game) return mzazireply(`❌ No active quiz. Start one with *${prefix}quiz*`);
  if (game.answered) return;

  const answer = args[0].toUpperCase().trim();
  if (!["A","B","C","D"].includes(answer)) return mzazireply("❌ Answer with A, B, C, or D!");

  game.answered = true;

  if (answer === game.ans) {
    global.quizGames.delete(qzId);
    return mzazi.sendMessage(sender, {
      text: `🎮 *GROUP QUIZ*\n\n✅ *CORRECT!*\n@${jidToNumber(await resolveJid(msgSender))} got it right!\n\n💡 ${game.exp}\n\n🏆 Well done!`,
      mentions: [msgSender]
    }, { quoted: m });
  } else {
    game.answered = false; // Allow others to try
    mzazi.sendMessage(sender, {
      text: `🎮 *GROUP QUIZ*\n\n❌ @${jidToNumber(await resolveJid(msgSender))} — Wrong! Try again!\n\n❓ ${game.q}\n${game.opts.join("\n")}\n\n⏰ Still running! Others can answer too.`,
      mentions: [msgSender]
    }, { quoted: m });
  }
return;'
WHERE name = 'quiz';

-- fastmath
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const fmId = sender;

  const genQuestion = () => {
    const ops = ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * 4)];
    let a, b, ans;
    if (op === "+") { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; ans = a + b; }
    else if (op === "-") { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * 20) + 1; ans = a - b; }
    else if (op === "×") { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; ans = a * b; }
    else { b = Math.floor(Math.random() * 10) + 2; ans = Math.floor(Math.random() * 10) + 1; a = b * ans; }
    return { q: `${a} ${op} ${b}`, ans: String(ans) };
  };

  if (!args[0]) {
    if (global.mathGames.has(fmId)) return mzazireply(`❌ A Fast Math game is running! Answer with *${prefix}fastmath <answer>* or stop with *${prefix}endfastmath*`);

    const { q, ans } = genQuestion();
    global.mathGames.set(fmId, { q, ans, startedAt: Date.now(), answered: false });

    setTimeout(() => {
      const gm = global.mathGames.get(fmId);
      if (gm && !gm.answered) {
        global.mathGames.delete(fmId);
        mzazi.sendMessage(fmId, { text: `⏰ *TIME''S UP!*\n\nNobody answered!\nThe answer was *${gm.ans}*` }).catch(() => {});
      }
    }, 20000);

    return mzazireply(`⚡ *FAST MATH CHALLENGE!*\n\n🧮 ${q} = ?\n\nBe the first! Type: *${prefix}fastmath <answer>*\n⏰ 20 seconds!`);
  }

  const game = global.mathGames.get(fmId);
  if (!game) return mzazireply(`❌ No active Fast Math game. Start one with *${prefix}fastmath*`);
  if (game.answered) return;

  const userAns = args[0].trim();
  if (userAns === game.ans) {
    game.answered = true;
    global.mathGames.delete(fmId);
    const timeMs = Date.now() - game.startedAt;
    return mzazi.sendMessage(sender, {
      text: `⚡ *FAST MATH*\n\n🏆 @${jidToNumber(await resolveJid(msgSender))} answered first!\n\n🧮 ${game.q} = *${game.ans}* ✅\n⚡ Time: ${(timeMs/1000).toFixed(1)}s`,
      mentions: [msgSender]
    }, { quoted: m });
  }

  mzazi.sendMessage(sender, {
    text: `⚡ *FAST MATH*\n\n❌ @${jidToNumber(await resolveJid(msgSender))} — Wrong! Keep trying!\n\n🧮 ${game.q} = ?`,
    mentions: [msgSender]
  }, { quoted: m });
return;'
WHERE name = 'fastmath';

-- wordchain
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const wcId = sender;
  const word = (args[0] || "").toLowerCase().trim().replace(/[^a-z]/g, "");

  if (!word) {
    if (global.wordchainGames.has(wcId)) {
      const wg = global.wordchainGames.get(wcId);
      return mzazireply(`🔗 *WORD CHAIN is active!*\n\nLast word: *${wg.lastWord}*\nWords played: *${wg.chain.length}*\nNext must start with: *${wg.lastWord.slice(-1).toUpperCase()}*\n\nType: *${prefix}wc <word starting with ${wg.lastWord.slice(-1).toUpperCase()}>*`);
    }
    return mzazireply(`🔗 *WORD CHAIN*\n\nStart a word chain!\nType: *${prefix}wc <any word>*\nEach word must start with the last letter of the previous word.\n\nExample:\n• Apple → Elephant → Tomato → …\n\nStop: *${prefix}endwordchain*`);
  }

  if (!global.wordchainGames.has(wcId)) {
    // Start chain
    global.wordchainGames.set(wcId, {
      chain: [word],
      lastWord: word,
      lastPlayer: msgSender,
      usedWords: new Set([word]),
      startedAt: Date.now()
    });
    const nextLetter = word.slice(-1).toUpperCase();
    return mzazireply(`🔗 *WORD CHAIN STARTED!*\n\nFirst word: *${word.toUpperCase()}*\nNext word must start with: *${nextLetter}*\n\nType: *${prefix}wc <word starting with ${nextLetter}>*\nStop: *${prefix}endwordchain*`);
  }

  const game = global.wordchainGames.get(wcId);
  const lastLetter = game.lastWord.slice(-1);

  if (!word.startsWith(lastLetter)) {
    return mzazi.sendMessage(sender, {
      text: `🔗 *WORD CHAIN*\n\n❌ @${jidToNumber(await resolveJid(msgSender))} — *${word.toUpperCase()}* doesn''t start with *${lastLetter.toUpperCase()}*!\n\nLast word was: *${game.lastWord.toUpperCase()}*`,
      mentions: [msgSender]
    }, { quoted: m });
  }

  if (game.usedWords.has(word)) {
    return mzazi.sendMessage(sender, {
      text: `🔗 *WORD CHAIN*\n\n❌ @${jidToNumber(await resolveJid(msgSender))} — *${word.toUpperCase()}* was already used! Try another.`,
      mentions: [msgSender]
    }, { quoted: m });
  }

  game.chain.push(word);
  game.usedWords.add(word);
  game.lastWord = word;
  game.lastPlayer = msgSender;

  const nextLetter = word.slice(-1).toUpperCase();
  mzazi.sendMessage(sender, {
    text: `🔗 *WORD CHAIN*\n\n✅ @${jidToNumber(await resolveJid(msgSender))}: *${word.toUpperCase()}*\n\nChain length: *${game.chain.length}*\nNext must start with: *${nextLetter}*`,
    mentions: [msgSender]
  }, { quoted: m });
return;'
WHERE name = 'wordchain';

-- tod
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const todId = sender;
  const todGame = global.truthDareGames.get(todId) || null;

  const truths = [
    "What''s the most embarrassing thing that''s ever happened to you?",
    "Have you ever lied to get out of trouble? What was it?",
    "What is your biggest fear?",
    "Have you ever cheated on a test?",
    "What''s the weirdest dream you''ve ever had?",
    "Who in this group do you think is the funniest?",
    "What''s a secret you''ve never told anyone?",
    "Have you ever pretended to be sick to avoid something?",
    "What is your most embarrassing nickname?",
    "Who was your first crush?",
    "Have you ever stolen anything, even something small?",
    "What''s the worst gift you''ve ever received?",
    "Have you ever laughed so hard you cried in public?",
    "What''s the pettiest reason you''ve been upset?",
    "What''s the last lie you told?",
  ];

  const dares = [
    "Send a voice note saying ''I am the king/queen of this group'' dramatically!",
    "Type your full name using only emojis.",
    "Change your profile photo to an ugly selfie for 1 hour.",
    "Write a short poem about the group right now.",
    "Speak only in CAPS for the next 5 minutes.",
    "Add a random contact from your phone to this group.",
    "Type the ABCs backwards as fast as you can.",
    "Send a ''I miss you'' message to the 3rd person in your contacts.",
    "Do a handstand and send a photo.",
    "Describe yourself in exactly 10 words.",
    "Call someone random from your contacts and say ''the eagle has landed''.",
    "Send the last photo in your gallery (if appropriate).",
    "Type without using the letter ''e'' for your next 3 messages.",
    "Text your mum/mum figure ''I got a tattoo today'' and screenshot the reply.",
    "Reveal the last YouTube video you watched.",
  ];

  if (!participants || participants.length < 2) return mzazireply("❌ Not enough members for this game.");

  const validMembers = participants.filter(p => {
    const jid = normalizeJid(p.id);
    return jid && jid !== botJid;
  });

  if (validMembers.length < 2) return mzazireply("❌ Not enough members to pick from.");

  const randomMember = validMembers[Math.floor(Math.random() * validMembers.length)];
  const pickedJid = normalizeJid(randomMember.id);
  const isT = Math.random() < 0.5;
  const selected = isT
    ? truths[Math.floor(Math.random() * truths.length)]
    : dares[Math.floor(Math.random() * dares.length)];

  mzazi.sendMessage(sender, {
    text: `🎰 *TRUTH OR DARE!*\n\n🎯 The wheel spun and landed on:\n👉 @${jidToNumber(await resolveJid(pickedJid))}\n\n${isT ? "🤔 *TRUTH:*" : "💪 *DARE:*"}\n\n${selected}\n\n_@${jidToNumber(await resolveJid(pickedJid))} you must respond!_`,
    mentions: [pickedJid]
  }, { quoted: m });
return;'
WHERE name = 'tod';

-- c4
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const c4Id = sender;
  const ROWS = 6, COLS = 7;

  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  const renderBoard = (board) => {
    const symbols = ["⬜", "🔴", "🟡"];
    const colNums = "1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣";
    let str = colNums + "\n";
    for (let r = 0; r < ROWS; r++) {
      str += board[r].map(c => symbols[c]).join("") + "\n";
    }
    return str;
  };

  const checkWin = (board, player) => {
    // Horizontal
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c <= COLS - 4; c++)
        if ([0,1,2,3].every(i => board[r][c+i] === player)) return true;
    // Vertical
    for (let r = 0; r <= ROWS - 4; r++)
      for (let c = 0; c < COLS; c++)
        if ([0,1,2,3].every(i => board[r+i][c] === player)) return true;
    // Diagonal ↘
    for (let r = 0; r <= ROWS - 4; r++)
      for (let c = 0; c <= COLS - 4; c++)
        if ([0,1,2,3].every(i => board[r+i][c+i] === player)) return true;
    // Diagonal ↙
    for (let r = 0; r <= ROWS - 4; r++)
      for (let c = 3; c < COLS; c++)
        if ([0,1,2,3].every(i => board[r+i][c-i] === player)) return true;
    return false;
  };

  const dropPiece = (board, col, player) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) { board[r][col] = player; return true; }
    }
    return false; // column full
  };

  // ── Challenge ──
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length > 0 && !parseInt(args[0])) {
    if (global.connectGames.has(c4Id)) return mzazireply("❌ A Connect 4 game is already running! Use *endc4* to stop it.");
    const opp = mentioned[0];
    if (opp === msgSender) return mzazireply("❌ You can''t challenge yourself!");

    const board = emptyBoard();
    global.connectGames.set(c4Id, {
      board,
      players: [msgSender, opp],
      symbols: ["🔴", "🟡"],
      turn: 0,
      startedAt: Date.now()
    });

    return mzazi.sendMessage(sender, {
      text: `🎮 *CONNECT FOUR!*\n\n🔴 @${jidToNumber(await resolveJid(msgSender))} vs 🟡 @${jidToNumber(await resolveJid(opp))}\n\n${renderBoard(board)}\n\n🔴 @${jidToNumber(await resolveJid(msgSender))}''s turn!\nType *${prefix}c4 <1-7>* to drop a piece.`,
      mentions: [msgSender, opp]
    }, { quoted: m });
  }

  // ── Make a move ──
  const game = global.connectGames.get(c4Id);
  if (!game) return mzazireply(`❌ No Connect 4 game running. Start one with *${prefix}c4 @player*`);

  const col = parseInt(args[0]) - 1;
  if (isNaN(col) || col < 0 || col > 6) return mzazireply("❌ Choose a column between 1 and 7.");

  const currentPlayer = game.players[game.turn % 2];
  if (msgSender !== currentPlayer) return mzazireply("⏳ It''s not your turn!");

  const pieceNum = (game.turn % 2) + 1;
  const dropped = dropPiece(game.board, col, pieceNum);
  if (!dropped) return mzazireply("❌ That column is full! Choose another.");

  game.turn++;
  const boardStr = renderBoard(game.board);

  if (checkWin(game.board, pieceNum)) {
    global.connectGames.delete(c4Id);
    return mzazi.sendMessage(sender, {
      text: `🎮 *CONNECT FOUR*\n\n${boardStr}\n\n🏆 @${jidToNumber(await resolveJid(currentPlayer))} WINS! 🎉`,
      mentions: [currentPlayer]
    }, { quoted: m });
  }

  const isFull = game.board[0].every(c => c !== 0);
  if (isFull) {
    global.connectGames.delete(c4Id);
    return mzazireply(`🎮 *CONNECT FOUR*\n\n${boardStr}\n\n🤝 It''s a DRAW!`);
  }

  const nextPlayer = game.players[game.turn % 2];
  const nextSym = game.symbols[game.turn % 2];
  mzazi.sendMessage(sender, {
    text: `🎮 *CONNECT FOUR*\n\n${boardStr}\n\n${nextSym} @${jidToNumber(await resolveJid(nextPlayer))}''s turn! Type *${prefix}c4 <1-7>*`,
    mentions: [nextPlayer]
  }, { quoted: m });
return;'
WHERE name = 'c4';

-- rps1v1
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!");

  const rpsId = sender;
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

  const rpsEmojis = { rock: "🪨", paper: "📄", scissors: "✂️" };
  const rpsWins = { rock: "scissors", paper: "rock", scissors: "paper" };

  if (mentioned.length > 0) {
    if (global.rpsGames.has(rpsId)) return mzazireply("❌ A RPS game is already running! Use *endrps* to stop.");
    const opp = mentioned[0];
    if (opp === msgSender) return mzazireply("❌ You can''t challenge yourself!");

    global.rpsGames.set(rpsId, {
      players: [msgSender, opp],
      choices: {},
      startedAt: Date.now()
    });

    return mzazi.sendMessage(sender, {
      text: `🎮 *ROCK PAPER SCISSORS — 1v1!*\n\n@${jidToNumber(await resolveJid(msgSender))} vs @${jidToNumber(await resolveJid(opp))}\n\nBoth players type:\n*${prefix}rps rock* | *${prefix}rps paper* | *${prefix}rps scissors*\n\n(Your choice is visible only after both pick!)`,
      mentions: [msgSender, opp]
    }, { quoted: m });
  }

  const game = global.rpsGames.get(rpsId);
  if (!game) return mzazireply(`❌ No RPS game. Challenge someone: *${prefix}rps1v1 @user*`);

  const choice = args[0]?.toLowerCase();
  if (!["rock", "paper", "scissors"].includes(choice)) return mzazireply("❌ Choose *rock*, *paper*, or *scissors*.");
  if (!game.players.includes(msgSender)) return mzazireply("❌ You''re not in this game.");
  if (game.choices[msgSender]) return mzazireply("✅ You already chose! Wait for your opponent.");

  game.choices[msgSender] = choice;

  if (Object.keys(game.choices).length < 2) {
    return mzazi.sendMessage(sender, {
      text: `✅ @${jidToNumber(await resolveJid(msgSender))} has chosen! Waiting for the other player...`,
      mentions: [msgSender]
    }, { quoted: m });
  }

  // Both chose — reveal
  const [p1, p2] = game.players;
  const c1 = game.choices[p1], c2 = game.choices[p2];
  global.rpsGames.delete(rpsId);

  let result;
  if (c1 === c2) result = `🤝 *DRAW!* Both chose ${rpsEmojis[c1]} ${c1}!`;
  else if (rpsWins[c1] === c2) result = `🏆 @${jidToNumber(await resolveJid(p1))} WINS!\n${rpsEmojis[c1]} ${c1} beats ${rpsEmojis[c2]} ${c2}!`;
  else result = `🏆 @${jidToNumber(await resolveJid(p2))} WINS!\n${rpsEmojis[c2]} ${c2} beats ${rpsEmojis[c1]} ${c1}!`;

  mzazi.sendMessage(sender, {
    text: `🎮 *ROCK PAPER SCISSORS — RESULT!*\n\n@${jidToNumber(await resolveJid(p1))}: ${rpsEmojis[c1]} *${c1}*\n@${jidToNumber(await resolveJid(p2))}: ${rpsEmojis[c2]} *${c2}*\n\n${result}`,
    mentions: [p1, p2]
  }, { quoted: m });
return;'
WHERE name = 'rps1v1';

-- unmute2
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ Group only!"); 
        const unmTarget = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
        if (!unmTarget) return mzazireply(`Usage: ${prefix}unmute2 @user`); 
        setGroupSetting(`${sender}_muted_${unmTarget}`, "muted", false); 
        mzazireply(`🔊 @${jidToNumber(await resolveJid(unmTarget))} has been unmuted!`); 
return;'
WHERE name = 'unmute2';

-- remove
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''remove'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — removed from the group'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'remove';

-- unwarn
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = resetWarn(sender, await resolveJid(target));
mzazireply(''✅ Warnings cleared for @'' + jidToNumber(await resolveJid(target)) + ''.'');
return;'
WHERE name = 'unwarn';

-- delwarn
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = resetWarn(sender, await resolveJid(target));
mzazireply(''✅ Warnings cleared for @'' + jidToNumber(await resolveJid(target)) + ''.'');
return;'
WHERE name = 'delwarn';

-- groupstats
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''📊 *Group Stats*\n\n👥 Members: '' + (meta.participants || []).length + ''\n👑 Owner: '' + jidToNumber(await resolveJid(meta.owner || '''')) + ''\n🕒 Created: '' + (meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : ''—'') + ''\n🔖 Name: '' + (meta.subject || ''—''));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'groupstats';

-- gcstats
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''📊 *Group Stats*\n\n👥 Members: '' + (meta.participants || []).length + ''\n👑 Owner: '' + jidToNumber(await resolveJid(meta.owner || '''')) + ''\n🕒 Created: '' + (meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : ''—'') + ''\n🔖 Name: '' + (meta.subject || ''—''));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'gcstats';

-- statsgroup
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''📊 *Group Stats*\n\n👥 Members: '' + (meta.participants || []).length + ''\n👑 Owner: '' + jidToNumber(await resolveJid(meta.owner || '''')) + ''\n🕒 Created: '' + (meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : ''—'') + ''\n🔖 Name: '' + (meta.subject || ''—''));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'statsgroup';

-- groupowner
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''👑 Group owner: @'' + jidToNumber(await resolveJid(meta.owner || '''')), null, [meta.owner].filter(Boolean));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'groupowner';

-- gcowner
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''👑 Group owner: @'' + jidToNumber(await resolveJid(meta.owner || '''')), null, [meta.owner].filter(Boolean));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'gcowner';

-- owngroup
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''👑 Group owner: @'' + jidToNumber(await resolveJid(meta.owner || '''')), null, [meta.owner].filter(Boolean));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'owngroup';

-- promoteuser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''promote'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — promoted to admin'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'promoteuser';

-- adminuser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''promote'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — promoted to admin'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'adminuser';

-- demoteuser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''demote'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — demoted from admin'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'demoteuser';

-- unadmin
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''demote'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — demoted from admin'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'unadmin';

-- kickuser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''remove'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — removed'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'kickuser';

-- removeuser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''remove'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — removed'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'removeuser';

-- warnuser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = addWarn(sender, await resolveJid(target));
mzazireply(''⚠️ @'' + jidToNumber(await resolveJid(target)) + '' warned. Total: '' + w + '' warning(s).'');
return;'
WHERE name = 'warnuser';

-- addwarn
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = addWarn(sender, await resolveJid(target));
mzazireply(''⚠️ @'' + jidToNumber(await resolveJid(target)) + '' warned. Total: '' + w + '' warning(s).'');
return;'
WHERE name = 'addwarn';

-- removewarn
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = resetWarn(sender, await resolveJid(target));
mzazireply(''✅ Warnings cleared for @'' + jidToNumber(await resolveJid(target)) + ''.'');
return;'
WHERE name = 'removewarn';

-- resetwarns
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = resetWarn(sender, await resolveJid(target));
mzazireply(''✅ Warnings cleared for @'' + jidToNumber(await resolveJid(target)) + ''.'');
return;'
WHERE name = 'resetwarns';

-- groupmembercount
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''📊 *Group Stats*\n\n👥 Members: '' + (meta.participants || []).length + ''\n👑 Owner: '' + jidToNumber(await resolveJid(meta.owner || '''')) + ''\n🕒 Created: '' + (meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : ''—'') + ''\n🔖 Name: '' + (meta.subject || ''—''));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'groupmembercount';

-- membersinfo
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''📊 *Group Stats*\n\n👥 Members: '' + (meta.participants || []).length + ''\n👑 Owner: '' + jidToNumber(await resolveJid(meta.owner || '''')) + ''\n🕒 Created: '' + (meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : ''—'') + ''\n🔖 Name: '' + (meta.subject || ''—''));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'membersinfo';

-- gcinfo
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
try {
  const meta = await mzazi.groupMetadata(sender);
  mzazireply(''📊 *Group Stats*\n\n👥 Members: '' + (meta.participants || []).length + ''\n👑 Owner: '' + jidToNumber(await resolveJid(meta.owner || '''')) + ''\n🕒 Created: '' + (meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : ''—'') + ''\n🔖 Name: '' + (meta.subject || ''—''));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'gcinfo';

-- kickmember
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''remove'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — removed'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'kickmember';

-- promotemember
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''promote'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — promoted'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'promotemember';

-- demotemember
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
if (!isBotAdmin) return mzazireply(''❌ I need to be an admin first.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the target.'');
try {
  await mzazi.groupParticipantsUpdate(sender, [await resolveJid(target)], ''demote'');
  mzazireply(''✅ @'' + jidToNumber(await resolveJid(target)) + '' — demoted'');
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Action failed'')); }
return;'
WHERE name = 'demotemember';

-- warngroup
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = addWarn(sender, await resolveJid(target));
mzazireply(''⚠️ @'' + jidToNumber(await resolveJid(target)) + '' warned. Total: '' + w + '' warning(s).'');
return;'
WHERE name = 'warngroup';

-- warnmember
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
if (!isAdmin && !isOwner) return mzazireply(''❌ Admins only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target) return mzazireply(''❌ Reply to a message or @mention the user.'');
const w = addWarn(sender, await resolveJid(target));
mzazireply(''⚠️ @'' + jidToNumber(await resolveJid(target)) + '' warned. Total: '' + w + '' warning(s).'');
return;'
WHERE name = 'warnmember';

-- pickmember
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
const list = participants || [];
if (!list.length) return mzazireply(''❌ No members found.'');
const pick = list[Math.floor(Math.random() * list.length)];
const jid = pick.id;
await mzazi.sendMessage(sender, { text: ''🎯 Random pick: @'' + jidToNumber(await resolveJid(jid)), mentions: [jid] }, { quoted: m });
return;'
WHERE name = 'pickmember';

-- tagrandom
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
const list = participants || [];
if (!list.length) return mzazireply(''❌ No members found.'');
const pick = list[Math.floor(Math.random() * list.length)];
const jid = pick.id;
await mzazi.sendMessage(sender, { text: ''🎯 Random pick: @'' + jidToNumber(await resolveJid(jid)), mentions: [jid] }, { quoted: m });
return;'
WHERE name = 'tagrandom';

-- blocklist
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
try {
  const res = await mzazi.fetchBlocklist();
  const list = res || [];
  const lines = [];
  for (const j of list) {
    const rj = await resolveJid(j);
    lines.push(jidToNumber(await resolveJid(rj)) + (rj !== j ? '''' : '' (lid)''));
  }
  mzazireply(''🚫 Blocked ('' + list.length + ''):\n'' + (lines.join(''\n'') || ''none''));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'blocklist';

-- whoowner
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(''👑 Owner: +'' + jidToNumber(await resolveJid(ownerNumbers[0] || '''')));
return;'
WHERE name = 'whoowner';

-- ownernum
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(''👑 Owner: +'' + jidToNumber(await resolveJid(ownerNumbers[0] || '''')));
return;'
WHERE name = 'ownernum';

-- blocknum
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
let target = null;
if (quoted && quoted.key) target = quoted.key.participant || quoted.key.remoteJid;
if (!target && m && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid && m.message.extendedTextMessage.contextInfo.mentionedJid.length) target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
if (!target && text) target = (String(text).trim().includes(''@'') ? String(text).trim() : String(text).trim() + ''@s.whatsapp.net'');
if (!target) return mzazireply(''Usage: ${prefix}${command} <number or @mention>'');
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
if (!target) return mzazireply(''Usage: ${prefix}${command} <number or @mention>'');
try {
  await mzazi.updateBlockStatus(target, ''unblock'');
  mzazireply(''✅ Done: '' + jidToNumber(await resolveJid(target)));
} catch (e) { return mzazireply(''❌ '' + (e.message || ''Failed'')); }
return;'
WHERE name = 'unblocknum';

-- botjid
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(''🤖 Bot JID: '' + botPhoneNum + ''\nNumber: +'' + jidToNumber(await resolveJid(botPhoneNum || '''')));
return;'
WHERE name = 'botjid';

-- botnumber
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(''🤖 Bot JID: '' + botPhoneNum + ''\nNumber: +'' + jidToNumber(await resolveJid(botPhoneNum || '''')));
return;'
WHERE name = 'botnumber';

-- mynumber
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(''🤖 Bot JID: '' + botPhoneNum + ''\nNumber: +'' + jidToNumber(await resolveJid(botPhoneNum || '''')));
return;'
WHERE name = 'mynumber';

-- randomuser
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
const list = participants || [];
if (!list.length) return mzazireply(''❌ No members found.'');
const pick = list[Math.floor(Math.random() * list.length)];
const jid = pick.id;
await mzazi.sendMessage(sender, { text: ''🎯 Random pick: @'' + jidToNumber(await resolveJid(jid)), mentions: [jid] }, { quoted: m });
return;'
WHERE name = 'randomuser';

-- team
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
const list = (participants || []).map((p) => p.id).filter(Boolean);
if (list.length < 2) return mzazireply(''❌ Not enough members.'');
const sh = list.slice().sort(() => Math.random() - 0.5);
const a = sh.slice(0, Math.ceil(sh.length / 2)), b = sh.slice(Math.ceil(sh.length / 2));
const fmt = async (t) => (await Promise.all(t.map(async (j) => ''@'' + jidToNumber(await resolveJid(j))))).join('' '');
await mzazi.sendMessage(sender, { text: ''🅰️ *Team A* ('' + a.length + '')\n'' + await fmt(a) + ''\n\n🅱️ *Team B* ('' + b.length + '')\n'' + await fmt(b), mentions: list }, { quoted: m });
return;'
WHERE name = 'team';

-- wheel
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
const list = participants || [];
if (!list.length) return mzazireply(''❌ No members found.'');
const pick = list[Math.floor(Math.random() * list.length)];
const jid = pick.id;
await mzazi.sendMessage(sender, { text: ''🎯 Random pick: @'' + jidToNumber(await resolveJid(jid)), mentions: [jid] }, { quoted: m });
return;'
WHERE name = 'wheel';

-- luckywinner
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply(''❌ Group only.'');
const list = participants || [];
if (!list.length) return mzazireply(''❌ No members found.'');
const pick = list[Math.floor(Math.random() * list.length)];
const jid = pick.id;
await mzazi.sendMessage(sender, { text: ''🎯 Random pick: @'' + jidToNumber(await resolveJid(jid)), mentions: [jid] }, { quoted: m });
return;'
WHERE name = 'luckywinner';
