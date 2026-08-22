-- QUARTZ XD — live-DB command updates
-- Run ONCE in the Neon SQL console against the shared database.
-- The 591 new commands seed automatically on next app restart; these UPDATEs fix EXISTING rows.

-- menu6
UPDATE bot_commands SET code = 'try {
    // ── Play welcome audio first ──
    const audioPath = "./media/menu.mp3";
    if (fs.existsSync(audioPath)) {
        try {
            const audioBuf = fs.readFileSync(audioPath);
            await mzazi.sendMessage(sender, { audio: audioBuf, mimetype: "audio/mpeg", ptt: false }, { quoted: m });
        } catch (audioErr) {
            logger.warn(''Audio playback failed:'', audioErr);
        }
    }

    // ── Load menu image ──
    const customMenuPic = `./database/sessions/${botPhoneNum}/menu.jpg`;
    const defaultMenuPic = "./media/menu.jpg";
    const menuPicPath = fs.existsSync(customMenuPic) ? customMenuPic : defaultMenuPic;

    // ── Get bot statistics ──
    const botName2 = getBotName ? getBotName(botPhoneNum) : botName;
    const uptimeSeconds = (Date.now() - startTime) / 1000;
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const now = new Date();
    const dateStr = now.toLocaleDateString(''en-US'', { weekday: ''long'', year: ''numeric'', month: ''long'', day: ''numeric'' });
    const timeStr = now.toLocaleTimeString(''en-US'', { hour: ''2-digit'', minute: ''2-digit'', second: ''2-digit'', hour12: true });

    // ── Get user info ──
    const pushname = (m && m.pushName) || ''User'';
    const userNumber = sender.split(''@'')[0];

    // ── Get bot mode ──
    const currentSettings = loadJSON(settingsPath, { publicMode: true, selfMode: false });
    const mode = currentSettings.selfMode ? ''🔒 SELF'' : ''🌐 PUBLIC'';

    // ── Short banner (image caption) ──
    const banner = `╔═════════════╗
║➥ ✦ 𝐐𝐔𝐀𝐑𝐓𝐙 𝐗𝐃 ✦
╠═════════════╣
║➥┌──────────┐
║➥│ 👤 USER    : \${pushname.padEnd(20)}
║➥│ 📱 NUMBER  : \${botPhoneNum.padEnd(20)}
║➥│ ⏱ UPTIME  : \${uptimeStr.padEnd(20)}
║➥│ 🕐 TIME    : \${timeStr.padEnd(20)}
║➥│ 📅 DATE    : \${dateStr.padEnd(20)}
║➥│ 📌 VERSION : V3.0.0\${'' ''.padEnd(13)}
║➥│ ⚙️ MODE    : \${mode.padEnd(20)}
║➥│ 🔱 PREFIX  : \${prefix.padEnd(20)}
║➥│ OWNER : ᴍᴢᴀᴢɪ ᴛᴇᴄʜ
║➥└──────────┘
╚═════════════╝`;

    // ── Full command list (text message — all commands) ──
    const cmdList = `╔═════════════╗
║➥ ✦ 𝐐𝐔𝐀𝐑𝐓𝐙 𝐗𝐃 ✦
╠═════════════╣
║➥┌──────────┐
║➥│ 👤 USER    : \${pushname.padEnd(20)}
║➥│ 📱 NUMBER  : \${botPhoneNum.padEnd(20)}
║➥│ ⏱ UPTIME  : \${uptimeStr.padEnd(20)}
║➥│ 🕐 TIME    : \${timeStr.padEnd(20)}
║➥│ 📅 DATE    : \${dateStr.padEnd(20)}
║➥│ 📌 VERSION : V3.0.0\${'' ''.padEnd(13)}
║➥│ ⚙️ MODE    : \${mode.padEnd(20)}
║➥│ 🔱 PREFIX  : \${prefix.padEnd(20)}
║➥│ OWNER : ᴍᴢᴀᴢɪ ᴛᴇᴄʜ
║➥└──────────┘
╚═════════════╝

╔═════════════╗
║➥🏠 GENERAL COMMANDS
╠═════════════╣
║➥• 8ball
║➥• add
║➥• addcase
║➥• addowner
║➥• addpaid
║➥• addprem
║➥• addsticker
║➥• admins
║➥• advice
║➥• ai2
║➥• allmenu
║➥• alwaysonline
║➥• antiaudio
║➥• antibadword
║➥• anticall
║➥• antidelete
║➥• antiflood
║➥• antigif
║➥• antiimage
║➥• antilink
║➥• antimentiongroup
║➥• antimsg
║➥• antinsfw
║➥• antisticker
║➥• antitag
║➥• antivideo
║➥• antiviewonce
║➥• antiviewonce2
║➥• approve
║➥• asc
║➥• ascii
║➥• ascii3
║➥• attp
║➥• autoforwardstatus
║➥• autolike
║➥• automenu
║➥• autoreact
║➥• autoread
║➥• autorecordaudio
║➥• autorecording
║➥• autorecordvideo
║➥• autostatus
║➥• autostatustext
║➥• autotyping
║➥• autotyping2
║➥• ban
║➥• bangc
║➥• base64decode
║➥• base64encode
║➥• bible
║➥• binary
║➥• birthday
║➥• block
║➥• bold
║➥• botinfo
║➥• botmode
║➥• botstatus
║➥• broadcast
║➥• broadcastdm
║➥• bug
║➥• buttons
║➥• buy
║➥• bye2
║➥• c4
║➥• calc
║➥• cancel
║➥• catfact
║➥• challenge
║➥• changebotname
║➥• changebotpic
║➥• changelog
║➥• char
║➥• chatbot
║➥• chatid
║➥• chemistryai
║➥• choose
║➥• christmas
║➥• chucknorris
║➥• clap
║➥• clearchat
║➥• clearstate
║➥• clearwarn
║➥• close
║➥• closetime
║➥• coinflip
║➥• color
║➥• compliment
║➥• connect
║➥• contact
║➥• copy
║➥• countdown
║➥• country
║➥• creator
║➥• credits
║➥• crypto
║➥• currency
║➥• d
║➥• dare
║➥• date
║➥• dayfact
║➥• deepseek
║➥• definition
║➥• delay
║➥• delcase
║➥• delete
║➥• deleteowner
║➥• delpaid
║➥• delprem
║➥• demote
║➥• dice
║➥• disappear
║➥• dogfact
║➥• donate
║➥• downloadfile
║➥• downloadmenu
║➥• dua
║➥• eid
║➥• emoji
║➥• emojimix
║➥• endc4
║➥• endfastmath
║➥• endguess
║➥• endhangman
║➥• endquiz
║➥• endrps
║➥• endscramble
║➥• endttt
║➥• endwordchain
║➥• enhance
║➥• events
║➥• exit
║➥• facebook
║➥• fact2
║➥• faithmenu
║➥• faq
║➥• fastmath
║➥• fillblank
║➥• flirt
║➥• font
║➥• fortune
║➥• forward
║➥• friends
║➥• frombin
║➥• fruit
║➥• fuckmzazi
║➥• fuckruto
║➥• funmenu
║➥• games
║➥• gemini
║➥• gemini2
║➥• generalmenu
║➥• getcase
║➥• getgpp
║➥• getpp
║➥• gif
║➥• goodafternoon
║➥• goodbye
║➥• goodbye1
║➥• goodevening
║➥• goodmorning
║➥• goodnight
║➥• greetings
║➥• groupid
║➥• groupinfo
║➥• groupmembers
║➥• groupmenu
║➥• hadith
║➥• hangman
║➥• help
║➥• hex
║➥• hidetag
║➥• horoscope
║➥• howcute
║➥• howgay
║➥• howrich
║➥• howstupid
║➥• howugly
║➥• hug
║➥• idch
║➥• image
║➥• imba
║➥• instagram
║➥• instagramboost2
║➥• instagramboost3
║➥• insult
║➥• invitegroup
║➥• ip
║➥• ipinfo
║➥• iq
║➥• italic
║➥• joinrequest
║➥• joke
║➥• kick
║➥• kickall
║➥• languagemenu
║➥• leaderboard
║➥• leaveall
║➥• lifestylemenu
║➥• link
║➥• listcase
║➥• listcmds
║➥• listgroup
║➥• listgroups
║➥• listowners
║➥• listpaid
║➥• location
║➥• lockgroup
║➥• lowercase
║➥• lyrics
║➥• lyrics2
║➥• maggie2
║➥• maria
║➥• matheval
║➥• mathgpt
║➥• md5
║➥• medicine
║➥• memberscount
║➥• menu0
║➥• menu6
║➥• menu7
║➥• menun
║➥• menup
║➥• menuv
║➥• mercy
║➥• minigame
║➥• mmmm
║➥• mombasa
║➥• mono
║➥• morse
║➥• motivation
║➥• mute
║➥• myid
║➥• mywarn
║➥• mzazi2
║➥• mzazi7
║➥• mzaziwipeall
║➥• nairobi
║➥• news
║➥• newyear
║➥• ngl
║➥• nhie
║➥• nhie2
║➥• node
║➥• numberfact
║➥• numguess
║➥• open
║➥• opentime
║➥• owner
║➥• ownermenu
║➥• p10dl
║➥• p3dl
║➥• paid
║➥• pair
║➥• password
║➥• pdf2
║➥• pendingrequests
║➥• pin
║➥• ping
║➥• ping0
║➥• ping100
║➥• ping11
║➥• ping2
║➥• plan
║➥• play
║➥• play10
║➥• play11
║➥• play2
║➥• play3
║➥• playclear
║➥• playdl
║➥• playdoc
║➥• poem
║➥• poll
║➥• pray
║➥• prices
║➥• proceed
║➥• promosi
║➥• promote
║➥• protectionmenu
║➥• public
║➥• quiz
║➥• quote
║➥• quran
║➥• ramadan
║➥• randomfact
║➥• rank
║➥• rate
║➥• react2
║➥• reject
║➥• rejectall
║➥• remote
║➥• removebg
║➥• repeat
║➥• repo
║➥• repo2
║➥• resetbot
║➥• resetwarn
║➥• restart
║➥• reverse
║➥• revoke
║➥• riddle
║➥• rng
║➥• roast
║➥• rps
║➥• rps1v1
║➥• rules
║➥• rules2
║➥• runtime
║➥• scramble
║➥• screenshot2
║➥• searchmenu
║➥• self
║➥• sendmsg
║➥• server
║➥• setbotbio
║➥• setbotname
║➥• setbotpic
║➥• setdesc
║➥• setdescription
║➥• setgcname
║➥• setgpp
║➥• setmode
║➥• setprefix
║➥• setprefix2
║➥• setpresence
║➥• setrules
║➥• setrules2
║➥• settingsmenu
║➥• sha1
║➥• sha256
║➥• ship
║➥• shorten
║➥• shutdown
║➥• social
║➥• speed
║➥• spotify
║➥• stats
║➥• statuslikeemoji
║➥• statusviewerstatus
║➥• sticker
║➥• sticker2
║➥• stickertoimg
║➥• story
║➥• strike
║➥• subject
║➥• support
║➥• sxget
║➥• sxinfo
║➥• sxvideos
║➥• synccmd
║➥• synonym
║➥• systeminfo
║➥• tagadmin
║➥• tagall
║➥• tagbots
║➥• tagmembers
║➥• take
║➥• test
║➥• tiktok
║➥• tiktokboost
║➥• tiktokboost2
║➥• tiktokboost3
║➥• time
║➥• timetable
║➥• timezone
║➥• tod
║➥• togstatus
║➥• toimg
║➥• topic
║➥• tqto
║➥• trivia
║➥• trt
║➥• truth
║➥• ttp
║➥• ttt
║➥• unblock
║➥• unhex
║➥• unlockgroup
║➥• unmorse
║➥• unmute
║➥• unmute2
║➥• update
║➥• uppercase
║➥• uptime
║➥• url
║➥• utilitymenu
║➥• uuid
║➥• vaporwave
║➥• vcard
║➥• version
║➥• video
║➥• vv
║➥• vv2
║➥• wantam
║➥• warn
║➥• warnlist
║➥• weather
║➥• welcome
║➥• welcome1
║➥• whatsapp
║➥• whois
║➥• wiki
║➥• word
║➥• wordchain
║➥• wouldyourather
║➥• youtubeboost
║➥• youtubeboost2
║➥• youtubeboost3
║➥• ytinfo
║➥• ytsearch
║➥• zalgo
╚═════════════╝

╔═════════════╗
║➥🧠 AI COMMANDS
╠═════════════╣
║➥• adcopy
║➥• agenda
║➥• ai
║➥• aiimg
║➥• algebra
║➥• antonym
║➥• apology
║➥• art
║➥• ask
║➥• askai
║➥• askgpt
║➥• astronomy
║➥• avatar
║➥• bio
║➥• biology
║➥• blog
║➥• brain
║➥• brainstorm
║➥• brainteaser
║➥• budget
║➥• bugfix
║➥• business
║➥• calculator
║➥• calculus
║➥• caption
║➥• casual
║➥• chat
║➥• chatgpt
║➥• chemistry
║➥• code
║➥• codepilot
║➥• compare
║➥• compose
║➥• congrats
║➥• contract
║➥• convert
║➥• correct
║➥• coverletter
║➥• cyber
║➥• debate
║➥• debug
║➥• deemojify
║➥• define
║➥• dialogue
║➥• diet
║➥• draft
║➥• draw
║➥• economics
║➥• editor
║➥• email
║➥• emojify
║➥• equation
║➥• essay
║➥• ethics
║➥• explain
║➥• explaincode
║➥• factcheck
║➥• finance
║➥• flashcards
║➥• followup
║➥• formal
║➥• genimg
║➥• geography
║➥• geometry
║➥• gpt
║➥• gpt4
║➥• hashtags
║➥• headline
║➥• health
║➥• history
║➥• homework
║➥• howto
║➥• html
║➥• icebreaker
║➥• ideas
║➥• imagine
║➥• img
║➥• improve
║➥• inspire
║➥• insurance
║➥• interview
║➥• invest
║➥• invite
║➥• itinerary
║➥• javascript
║➥• keywords
║➥• learn
║➥• letter
║➥• lists
║➥• logic
║➥• logo
║➥• math
║➥• memo
║➥• minutes
║➥• motivate
║➥• negotiate
║➥• notes
║➥• outline
║➥• packing
║➥• paraphrase
║➥• persuade
║➥• philosophy
║➥• physics
║➥• pickupline
║➥• pitch
║➥• poster
║➥• probability
║➥• product
║➥• proofread
║➥• proposal
║➥• prosandcons
║➥• psychology
║➥• puzzle
║➥• python
║➥• qna
║➥• quizai
║➥• recipe
║➥• regex
║➥• reminder
║➥• rephrase
║➥• replydm
║➥• report
║➥• research
║➥• resume
║➥• review
║➥• rewrite
║➥• sales
║➥• savings
║➥• schedule
║➥• science
║➥• script
║➥• security
║➥• slogan
║➥• solve
║➥• song
║➥• speech
║➥• spell
║➥• sql
║➥• statistics
║➥• study
║➥• summarize
║➥• tagline
║➥• teacher
║➥• tech
║➥• thanks
║➥• titles
║➥• tldr
║➥• tr
║➥• translate
║➥• translatear
║➥• translatefr
║➥• translatehi
║➥• translatekis
║➥• translatept
║➥• translatesp
║➥• translatetr
║➥• travel
║➥• triviaai
║➥• tutor
║➥• tweet
║➥• units
║➥• wallpaper
║➥• wish
║➥• workout
║➥• writer
╚═════════════╝

╔═════════════╗
║➥📥 MEDIA & DOWNLOAD
╠═════════════╣
║➥• afrobeat
║➥• audio
║➥• beats
║➥• chill
║➥• dailymotion
║➥• dlaudio
║➥• dlvideo
║➥• drill
║➥• fb
║➥• fbdl
║➥• fbreel
║➥• fbvideo
║➥• gengetone
║➥• getaudio
║➥• getvideo
║➥• gifdl
║➥• gospel
║➥• hiphop
║➥• ig
║➥• igdl
║➥• igreel
║➥• insta
║➥• karaoke
║➥• lofi
║➥• lyricsmp3
║➥• movie
║➥• mp3
║➥• mp3yt
║➥• mp4
║➥• mp4yt
║➥• musica
║➥• pindl
║➥• pinterest
║➥• podcast
║➥• rdl
║➥• reddit
║➥• reels
║➥• relax
║➥• ringtone
║➥• rnb
║➥• scdl
║➥• shorts
║➥• soundcloud
║➥• telegramvid
║➥• tik
║➥• tiktokdl
║➥• tiktokmp3
║➥• tiktokmp4
║➥• tkaudio
║➥• tkvideo
║➥• trailer
║➥• twitter
║➥• twitvideo
║➥• twt
║➥• vd
║➥• vid
║➥• vimeo
║➥• vocal
║➥• xdl
║➥• youtube
║➥• yt
║➥• yta
║➥• ytaudio
║➥• ytdl
║➥• ytmp3
║➥• ytmp4
║➥• ytmusic
║➥• ytshorts
║➥• ytv
║➥• ytvideo
╚═════════════╝

╔═════════════╗
║➥👥 GROUP MANAGEMENT
╠═════════════╣
║➥• addbynum
║➥• addmember
║➥• addnum
║➥• adduser
║➥• addwarn
║➥• adminlist
║➥• adminonly
║➥• admintag
║➥• adminuser
║➥• all
║➥• announce
║➥• announcements
║➥• botadmin
║➥• calladmin
║➥• callall
║➥• changegroupdesc
║➥• changegroupname
║➥• closegroup
║➥• closenow
║➥• countmembers
║➥• del
║➥• delmsg
║➥• delmsg2
║➥• delreply
║➥• delwarn
║➥• demotemember
║➥• demotenum
║➥• demoteuser
║➥• descriptionset
║➥• descset
║➥• editdesc
║➥• edittopic
║➥• everyone
║➥• freegroup
║➥• gcdesc
║➥• gcinfo
║➥• gclink
║➥• gclink2
║➥• gcmembers
║➥• gcname
║➥• gcowner
║➥• gcstats
║➥• gctopic
║➥• getadmin
║➥• getdesc
║➥• getgclink
║➥• getlink
║➥• getname
║➥• groupclose
║➥• groupdesc
║➥• groupinvite
║➥• grouplink
║➥• groupmembercount
║➥• groupname
║➥• groupopen
║➥• groupowner
║➥• groupstats
║➥• groupstatus
║➥• grouptopic
║➥• hapus
║➥• hidetagall
║➥• iamadmin
║➥• invitenum
║➥• joinlink
║➥• kickme
║➥• kickmember
║➥• kicknum
║➥• kickuser
║➥• linkgroup
║➥• listadmin
║➥• listmembers
║➥• memberlist
║➥• members
║➥• membersinfo
║➥• memberslist
║➥• mention
║➥• mentionall
║➥• nameset
║➥• newlink
║➥• notifyadmins
║➥• notifyall
║➥• notifyall2
║➥• opengroup
║➥• opennow
║➥• owngroup
║➥• participants
║➥• pickmember
║➥• pingall
║➥• promotemember
║➥• promotenum
║➥• promoteuser
║➥• regeneratelink
║➥• remove
║➥• removemsg
║➥• removeuser
║➥• removewarn
║➥• rename
║➥• renames
║➥• resetinvite
║➥• resetlink
║➥• resetwarns
║➥• restrictgroup
║➥• revokelink
║➥• revokenew
║➥• setgcdesc
║➥• setgctopic
║➥• setgroupdesc
║➥• setgroupname
║➥• setname
║➥• settopic
║➥• statsgroup
║➥• subjectset
║➥• tag
║➥• tagall2
║➥• tagmember
║➥• tagrandom
║➥• topicset
║➥• unadmin
║➥• unrestrict
║➥• unwarn
║➥• viewmembers
║➥• warngroup
║➥• warnmember
║➥• warnuser
║➥• who
╚═════════════╝

╔═════════════╗
║➥🛡 GROUP PROTECTION
╠═════════════╣
╚═════════════╝

╔═════════════╗
║➥👑 OWNER COMMANDS
╠═════════════╣
║➥• acceptall
║➥• allgroups
║➥• backup
║➥• backupdb
║➥• blocklist
║➥• blocknum
║➥• botdate
║➥• botjid
║➥• botmsg
║➥• botnumber
║➥• botpp
║➥• bottime
║➥• dbinfo
║➥• dbsize
║➥• delowner
║➥• dm
║➥• dmsend
║➥• gcids
║➥• getid
║➥• groupcount
║➥• groupjids
║➥• grouplist
║➥• jid
║➥• killbot
║➥• mynumber
║➥• ownergroups
║➥• ownerhelp
║➥• ownerinfo
║➥• ownerlist
║➥• ownernum
║➥• ownersay
║➥• presence
║➥• reboot
║➥• recording
║➥• rejectreq
║➥• restartbot
║➥• runtime2
║➥• sendto
║➥• sessioninfo
║➥• setpp
║➥• stopbot
║➥• sysinfo
║➥• toggleaudio
║➥• toggleautotyping
║➥• togglebadword
║➥• toggleflood
║➥• togglegif
║➥• toggleimage
║➥• togglensfw
║➥• toggleonline
║➥• togglesticker
║➥• togglevideo
║➥• typing
║➥• unblocknum
║➥• uptime2
║➥• whoowner
╚═════════════╝

╔═════════════╗
║➥🎮 GAMES
╠═════════════╣
║➥• addition
║➥• agecalc
║➥• anagram
║➥• animalquiz
║➥• basket
║➥• blackjack
║➥• bmi
║➥• bowling
║➥• capitalquiz
║➥• cards
║➥• carnival
║➥• casino
║➥• cityquiz
║➥• coin
║➥• dadu
║➥• dart
║➥• discount
║➥• double
║➥• flip
║➥• foodquiz
║➥• freekick
║➥• geoquiz
║➥• guess
║➥• guessnumber
║➥• highcard
║➥• highlow
║➥• historyquiz
║➥• jackpot
║➥• janken
║➥• jumble
║➥• lottery
║➥• lovecalc
║➥• lowcard
║➥• luck
║➥• lucky7
║➥• luckycolor
║➥• luckywinner
║➥• magic8
║➥• magicnumber
║➥• mathadd
║➥• mathdiv
║➥• mathgame
║➥• mathmul
║➥• mathquiz
║➥• mathsub
║➥• memory
║➥• mines
║➥• moviequiz
║➥• musicquiz
║➥• numbergame
║➥• oddoreven
║➥• parachute
║➥• penalty
║➥• percent
║➥• pet
║➥• quickquiz
║➥• quiztrivia
║➥• randomuser
║➥• rocket
║➥• rockpaperscissors
║➥• roll
║➥• roulette
║➥• russianroulette
║➥• sciencequiz
║➥• seven
║➥• slot
║➥• slots
║➥• spaceflight
║➥• spin
║➥• sportsquiz
║➥• streak
║➥• team
║➥• techquiz
║➥• tictac
║➥• tictactoe
║➥• tip
║➥• triple
║➥• truefalse
║➥• war
║➥• wheel
║➥• wyr
║➥• zodiac
╚═════════════╝

╔═════════════╗
║➥😂 FUN
╠═════════════╣
║➥• affirmation
║➥• africanproverb
║➥• altcaps
║➥• angry
║➥• animalfact
║➥• baby
║➥• blessing
║➥• bro
║➥• caps
║➥• cheer
║➥• cheers
║➥• comebacks
║➥• confused
║➥• cry
║➥• dadjoke
║➥• devquotes
║➥• easter
║➥• echo
║➥• emojifytext
║➥• energy
║➥• excited
║➥• fact
║➥• fam
║➥• fathersday
║➥• fitnessquote
║➥• foodfact
║➥• friday
║➥• friday2
║➥• friendshipquote
║➥• ghost
║➥• gratitude
║➥• greet
║➥• halloween
║➥• happy
║➥• happynewyear
║➥• idiom
║➥• kiss
║➥• koan
║➥• laugh
║➥• lifequote
║➥• lovequote
║➥• meme
║➥• merry
║➥• monday
║➥• monday2
║➥• monospace
║➥• mood
║➥• mood2
║➥• moon
║➥• mothersday
║➥• motto
║➥• newmonth
║➥• owo
║➥• pirate
║➥• proverb
║➥• puns
║➥• random
║➥• riddles
║➥• sad
║➥• salute
║➥• sarcasm
║➥• saturday
║➥• say
║➥• sheng
║➥• shout
║➥• showerthoughts
║➥• slow
║➥• spacefact
║➥• spongebob
║➥• star
║➥• stoic
║➥• stutter
║➥• successquote
║➥• sun
║➥• sunday
║➥• swahili
║➥• teachersday
║➥• techfact
║➥• thanksgiving
║➥• thisorthat
║➥• thursday
║➥• tonguetwister
║➥• tuesday
║➥• uwu
║➥• valentine
║➥• vibes2
║➥• wave
║➥• wednesday
║➥• weekend
║➥• whisper
║➥• wink
║➥• wisdom
║➥• zen
╚═════════════╝

╔═════════════╗
║➥⚡ Powered by Mzazi Systems
║➥🔧 Switch Case Based
║➥🌐 https://mzazi.shop
║➥📌 Total: 1002 commands
║➥📌 You can copy me but
║➥   you can never be me
╚═════════════╝`;

    const forwardCtx = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: ''120363430368431358@newsletter'',
            newsletterName: "✦ QUARTZ XD ✦",
            serverMessageId: 143,
        },
    };

    // ── Send: image with banner caption, then the full command list ──
    if (fs.existsSync(menuPicPath)) {
        const imageBuffer = fs.readFileSync(menuPicPath);
        await mzazi.sendMessage(sender, { image: imageBuffer, caption: banner, contextInfo: forwardCtx }, { quoted: m });
    }
    await mzazi.sendMessage(sender, { text: cmdList, contextInfo: forwardCtx }, { quoted: m });
} catch (err) {
    logger.error(''Menu error:'', err);
    try {
        await mzazi.sendMessage(sender, { text: ''❌ Failed to load menu. Please try again.\n\n📌 Use .help for assistance.'' });
    } catch (finalErr) {
        logger.error(''Final fallback error:'', finalErr);
    }
}
return;'
, description = 'QUARTZ XD main menu — all commands'
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
