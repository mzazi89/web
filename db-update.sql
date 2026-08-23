-- QUARTZ XD — live-DB command updates
-- Run ONCE in the Neon SQL console against the shared database.
-- BUTTON MENUS: menu6 rewritten as interactive buttons; 9 sub-menu commands
-- created (auto-seed on app restart); ownerhelp/botstatus now include buttons.

-- menu6
UPDATE bot_commands SET code = 'try {
  await sendInteractiveMessage(mzazi, sender, {
    title: "𝐌𝐙𝐀𝐙𝐈 𝐓𝐄𝐂𝐇 𝐈𝐍𝐂",
    text: "👋 Welcome to QUARTZ XD\n\nSelect a category from the menu below:",
    footer: "Powered by MZAZI TECH INC",
    interactiveButtons: [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "📂 SELECT CATEGORY",
          sections: [{"title": "MAIN CATEGORIES", "rows": [{"id": "subgeneral", "title": "\ud83e\udd16 General", "description": "Core and everyday commands"}, {"id": "subai", "title": "\ud83e\udde0 AI", "description": "Chat, images, translation and more"}, {"id": "subdl", "title": "\ud83d\udce5 Downloads", "description": "Music and video downloads"}, {"id": "subgroup", "title": "\ud83d\udc65 Group", "description": "Group management"}, {"id": "subprotect", "title": "\ud83d\udee1 Protection", "description": "Anti-spam group protections"}]}, {"title": "MORE", "rows": [{"id": "subowner", "title": "\ud83d\udc51 Owner", "description": "Owner-only utilities"}, {"id": "subgames", "title": "\ud83c\udfae Games", "description": "Games and quizzes"}, {"id": "subfun", "title": "\ud83d\ude02 Fun", "description": "Jokes, quotes and fun"}, {"id": "subutil", "title": "\ud83d\udee0 Utility", "description": "Calculators and tools"}, {"id": "remote", "title": "\ud83d\udccb All 1002 Commands", "description": "Full command list"}]}]
        })
      },
      { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👑 Owner", id: "ownerhelp" }) },
      { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🌐 mzazi.shop", url: "https://mzazi.shop" }) }
    ]
  });
} catch (e) {
  return mzazireply(''❌ Menu error: '' + (e.message || e));
}
return;'
, description = 'QUARTZ XD main menu — interactive buttons'
WHERE name = 'menu6';

-- botstatus
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply("❌ Owner only!");
        const used2 = process.memoryUsage();
        const allGrps = await mzazi.groupFetchAllParticipating().catch(() => ({}));
        mzazireply(`🤖 *BOT STATUS*\n\n✅ Online\n⏰ Uptime: ${runtime(process.uptime())}\n💾 RAM: ${(used2.heapUsed/1024/1024).toFixed(2)} MB\n📦 Groups: ${Object.keys(allGrps).length}\n👑 Owners: ${getOwners().length}\n💎 Paid: ${paidUsers.length}`);

try { await sendInteractiveMessage(mzazi, sender, { title: ''QUARTZ XD'', text: ''⬆️ More above — tap a button below:'', footer: ''MZAZI TECH INC'', interactiveButtons: [ { name: ''quick_reply'', buttonParamsJson: JSON.stringify({ display_text: ''📜 Main Menu'', id: ''menu6'' }) }, { name: ''cta_url'', buttonParamsJson: JSON.stringify({ display_text: ''🌐 mzazi.shop'', url: ''https://mzazi.shop'' }) } ] }); } catch (e) {}
return;'
WHERE name = 'botstatus';

-- ownerhelp
UPDATE bot_commands SET code = 'if (!isOwner) return mzazireply(''❌ Owner only.'');
mzazireply(`👑 *Owner commands*\n\n${prefix}block / unblock\n${prefix}join <link>\n${prefix}leave\n${prefix}broadcast <msg>\n${prefix}sendto <jid> <msg>\n${prefix}addowner <num>\n${prefix}delowner <num>\n${prefix}ownerlist\n${prefix}ownergroups\n${prefix}botuptime\n${prefix}setbotname <name>\n${prefix}getid\n${prefix}restart / update`);

try { await sendInteractiveMessage(mzazi, sender, { title: ''QUARTZ XD'', text: ''⬆️ More above — tap a button below:'', footer: ''MZAZI TECH INC'', interactiveButtons: [ { name: ''quick_reply'', buttonParamsJson: JSON.stringify({ display_text: ''📜 Main Menu'', id: ''menu6'' }) }, { name: ''cta_url'', buttonParamsJson: JSON.stringify({ display_text: ''🌐 mzazi.shop'', url: ''https://mzazi.shop'' }) } ] }); } catch (e) {}
return;'
WHERE name = 'ownerhelp';
