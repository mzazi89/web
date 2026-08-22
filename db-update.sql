-- QUARTZ XD — live-DB command updates
-- Run ONCE in the Neon SQL console against the shared database.
-- LID resolution: display + STORAGE sites (paid/prem/warn/owner lists) now
-- resolve @lid mentions to real phone numbers. Requires quartz deploy first.

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

    target = await resolveJid(target);
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

    target = await resolveJid(target);
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

    target = await resolveJid(target);
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

-- addpaid
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentionedJid || mentionedJid.length === 0) return mzazireply(`Usage: ${prefix}addpaid @user`);
        const user = await resolveJid(mentionedJid[0]);
        if (sessionPaidUsers.includes(user)) return mzazireply("⚠️ Already paid!");
        sessionPaidUsers.push(user);
        saveSessionPaid();
        mzazireply(`✅ @${user.split(''@'')[0]} added to paid users!`);'
WHERE name = 'addpaid';

-- delpaid
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentionedJid || mentionedJid.length === 0) return mzazireply(`Usage: ${prefix}delpaid @user`);
        const user = await resolveJid(mentionedJid[0]);
        const index = sessionPaidUsers.indexOf(user);
        if (index === -1) return mzazireply("❌ Not a paid user!");
        sessionPaidUsers.splice(index, 1);
        saveSessionPaid();
        mzazireply(`✅ @${user.split(''@'')[0]} removed from paid users!`);'
WHERE name = 'delpaid';

-- addprem
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentionedJid || mentionedJid.length === 0) return mzazireply(`Usage: ${prefix}addprem @user`);
        const user = await resolveJid(mentionedJid[0]);
        const premiumUsers = loadJSON(''./database/premium.json'', []);
        if (premiumUsers.includes(user)) return mzazireply("⚠️ Already premium!");
        premiumUsers.push(user);
        saveJSON(''./database/premium.json'', premiumUsers);
        mzazireply(`✅ @${user.split(''@'')[0]} added to premium!`);'
WHERE name = 'addprem';

-- delprem
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentionedJid || mentionedJid.length === 0) return mzazireply(`Usage: ${prefix}delprem @user`);
        const user = await resolveJid(mentionedJid[0]);
        const premiumUsers = loadJSON(''./database/premium.json'', []);
        const index = premiumUsers.indexOf(user);
        if (index === -1) return mzazireply("❌ Not premium!");
        premiumUsers.splice(index, 1);
        saveJSON(''./database/premium.json'', premiumUsers);
        mzazireply(`✅ @${user.split(''@'')[0]} removed from premium!`);'
WHERE name = 'delprem';

-- addowner
UPDATE bot_commands SET code = '// Only current owners can add a new owner
  

  // Check if user mentioned someone
  const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentionedJid || mentionedJid.length === 0) {
    return mzazireply(`Usage: ${prefix}addowner @user\nExample: .addowner @254712345678`);
  }

  const target = await resolveJid(mentionedJid[0]);
  const targetNum = target.split(''@'')[0].split('':'')[0];

  // Prevent adding yourself again
  if (targetNum === senderNum) return mzazireply("ℹ️ You are already an owner.");

  const owners = getOwners();
  if (owners.includes(targetNum)) {
    return mzazireply(`⚠️ @${targetNum} is already an owner.`);
  }

  addOwner(targetNum);
  mzazireply(`✅ @${targetNum} has been added as a bot owner.`);'
WHERE name = 'addowner';

-- kick
UPDATE bot_commands SET code = 'if (!isGroup) return mzazireply("❌ This command works only in groups.");
  if (!isAdmin && !isOwner) return mzazireply("❌ Only admins or the owner can kick members.");

  // 1) Extract target JID
  let targetJid = null;

  // Check if replying to a message
  const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) {
    targetJid = quoted;
  }

  // Check if mentioning someone
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length > 0) {
    targetJid = mentioned[0];
  }

  // If argument is a number, build JID
  if (!targetJid && args.length > 0) {
    const num = args[0].replace(/\D/g, "");
    if (num.length > 5) {
      targetJid = num + "@s.whatsapp.net";
    }
  }

  if (!targetJid) {
    return mzazireply("❌ Please mention, reply to, or provide the number of the member to kick.");
  }
  targetJid = await resolveJid(targetJid);

  // Ensure we don''t kick the bot itself
  if (normalizeJid(targetJid) === normalizeJid(mzazi.user?.id)) {
    return mzazireply("❌ I can''t kick myself.");
  }

  // Check if target is an admin (prevent kicking admins)
  const targetNormal = normalizeJid(targetJid);
  if (groupAdmins.includes(targetNormal)) {
    return mzazireply("❌ I cannot kick an admin.");
  }

  try {
    await mzazi.groupParticipantsUpdate(sender, [targetJid], "remove");
    await mzazireply(`✅ @${targetNormal} has been kicked from the group.`, { mentions: [targetJid] });
  } catch (e) {
    logger.error(e);
    await mzazireply(`❌ Failed to kick: ${e.message || "unknown error"}`);
  }
return;'
WHERE name = 'kick';
