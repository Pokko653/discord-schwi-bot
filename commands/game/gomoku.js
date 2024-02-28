const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');

/* Environment Variable */
const GAME_TIMER_OUT = 45;
const ROOM_TIMER_OUT = 60;

let gameMap = [
	['┏',3,3,3,3,3,3,3,3,3,3,3,3,3,'┓'],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	[6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
	['┗',5,5,5,5,5,5,5,5,5,5,5,5,5,'┛']
],  
    gameMapSize = 15,

	gamePower = false,
	gameFirst =	true,
	gameTurn = 1,
	
	gamePosX = 0,
	gamePosY = 0,
	
	gameStartTime = "",
	
	gamePlayerList = [],
	gamePlayerStone = [],
	
	gameTimerCount = 0,
	gameTimerPower = false,
	// gameTimerShield = 3,

	roomName = "",
	roomCreat = false,
	roomTimerCount = 0,
	roomTimerPower = false;

let Bot = null;
let messageObject = null;

const Game = {
    setMapClear: function() {
        // initialization
        gameMap = [
        ['┏',3,3,3,3,3,3,3,3,3,3,3,3,3,'┓'],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
            [6,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        ['┗',5,5,5,5,5,5,5,5,5,5,5,5,5,'┛']];
    },
    start: function() {
        Game.stopRoomTimer();
        gameStartTime = new Date();
        Game.startGameTimer();
    },
    off: function() {
        Game.stopRoomTimer();
        Game.stopGameTimer();

        Game.setMapClear();

        gameMapSize = 15,

        gamePower = false,
        gameFirst =	true,
        gameTurn = 1,
        
        gamePosX = 0,
        gamePosY = 0,
        
        gameStartTime = "",
        
        gamePlayerList = [],
        gamePlayerStone = [],
        
        gameTimerCount = 0,
        gameTimerPower = false,
        gameTimerShield = 3,

        roomName = "",
        roomCreat = false,
        roomTimerCount = 0,
        roomTimerPower = false;
    },
    restart: function() {
        Game.setMapClear();

        gamePlayerStone = [0, 0];

        gameFirst = true;

        gamePosX = 0;
        gamePosY = 0;
        gameTurn = 1;

        gameTimerCount = 0;
    },

    /* ----------------------------------- Timer ---------------------------------- */

    startGameTimer : function() {
        gameTimerPower = true;

        let id = setInterval(() => {
            try {
                if (!gameTimerPower) {
                    clearInterval(id); 
                    return;
                } 

                if (gameTimerCount >= GAME_TIMER_OUT) {
                    const msg = Game.setNextTurn().msg + "\n(시간이 초과되어 자동으로 턴이 넘어갑니다.)";
                    messageObject.edit({
                        content: msg
                    });
                } else {
                    gameTimerCount++;

                    messageObject.edit({
                        content: this.printEventMap().msg + "\n\n" +
                            "남은 시간: " + (GAME_TIMER_OUT - gameTimerCount) + "초"
                    });
                }
            } catch(e) {
                console.log(
                    "GAME TIMER ERROR\n" +
                    "Error : " + e
                );
            }
        }, 1000);
    },

    startRoomTimer : function() {
        roomTimerPower = true;

        let id = setInterval(() => {
            try {
                if (!roomTimerPower) clearInterval(id);
                
                if ((roomTimerCount >= ROOM_TIMER_OUT) && (!gamePower)) {
                    Bot.replyRoom("60초가 지나 자동으로 방을 삭제합니다.");
                    Game.off();
                } else {
                    roomTimerCount++; 
                    ((ROOM_TIMER_OUT - roomTimerCount) == 30) ? Bot.replyRoom("30초 후 방이 삭제됩니다.") : 
                    ((ROOM_TIMER_OUT - roomTimerCount) == 10) ? Bot.replyRoom("10초 후 방이 삭제됩니다.") : null;
                }
            } catch(e) {
                console.log(
                    "ROOM TIMER ERROR\n" +
                    "Error : " + e
                );
            }
        }, 1000);
    },

    stopGameTimer : function() {
        gameTimerCount = 0;
        gameTimerPower = false;
    },

    stopRoomTimer : function() {
        roomTimerCount = 0;
        roomTimerPower = false;
    },

    /* ---------------------------------------------------------------------------- */

    getMapText : function() {
        let vertical = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮"],
            horizontal = ["Ⓐ","Ⓑ","Ⓒ","Ⓓ","Ⓔ","Ⓕ","Ⓖ","Ⓗ","Ⓘ","Ⓙ","Ⓚ","Ⓛ","Ⓜ","Ⓝ","Ⓞ"],
            num = 0, i, posX, posY, mapText = "";
        
        horizontal = "⊙" + horizontal + "\n";
        mapText = "" + horizontal;

        for (posX = 0; posX < gameMapSize; posX++) { 
            for (posY = 0; posY < gameMapSize; posY ++) { 
                if (!posY) mapText += vertical[num++];
            } 
            mapText += gameMap[posX]; 
            
            if (posX != (gameMapSize - 1)) mapText += "\n";
        }

        return "\n\n" + mapText.replace(/,/g,"").replace(/0/g,"╋").replace(/1/g,"●").replace(/2/g,"○").replace(/3/g,"┳").replace(/4/g,"┫").replace(/5/g,"┴").replace(/6/g,"┣"); 
    },

    /* ---------------------------------------------------------------------------- */

    printEventMap: function() {
        var time = Math.floor((new Date() - gameStartTime) / 1000),
            minute = Math.floor(time / 60), second = time % 60,

            minuteText = ((String(minute).length > 1) ? minute : '0' + minute) + "분 ",
            secondText = ((String(second).length > 1) ? second : '0' + second) + "초",
        
            timeText = (minute == 0) ? secondText + " " : " " + minuteText + secondText,
            ballText = (gamePlayerStone[0] == 10 && gamePlayerStone[1] == 9) ? ("흑 " + gamePlayerStone[0] + " 백 " + '0' + gamePlayerStone[1]) : 
            ((gamePlayerStone[1] > 9) ? ("흑 " + gamePlayerStone[0] + " 백 " + gamePlayerStone[1]) : ("흑 " + gamePlayerStone[0] + " 백 " + gamePlayerStone[1])),
        
            messageText = "현재 순서 : " + Game.getNowPlayer() + " (" + Game.getNowStone() + ")\n\n" + "[ " + timeText + " : " + ballText + " ]";
            messageText += Game.getMapText().substring(1);
            messageText += !gameFirst? "\n\n좌표 (" + String.fromCharCode(64+gamePosX) + ", " + gamePosY + ") 에 돌을 두었습니다.": "";

        return {
            msg: messageText,
            isWin: false
        };
    },

    printWinEvent : function() {
        const msg = Game.getMapText().substring(2, Game.getMapText().length);
        const winMsg = `승자는 ${Game.getNextStone()}을 두신 \`${Game.getNextPlayer()}\`님입니다!`;

        Game.off();
        setTimeout(() => { Bot.replyRoom(winMsg); }, 1000);
        
        return {
            msg: msg,
            isWin: true
        };
    },

    /* ---------------------------------------------------------------------------- */
    
    checkStone : function (interaction, posX, posY) {
        if (gameFirst) {
            if (posX == 8 && posY == 8) {
                gameFirst = false; 
                return true; 
            } else { 
                Bot.replyEphe(interaction, "첫 수는 가운데에만 둘 수 있습니다. \n좌표 : (H, 8)"); 
                return false; 
            }
        } else if (gameMap[posY-1][posX-1] == 1 || gameMap[posY-1][posX-1] == 2) { 
            Bot.replyEphe(interaction, "이미 돌이 있습니다."); 
            return false; 
        }
        
        return true;
    },

    checkWin : function() {
        let score = 0, posX, posY;
                        
        for (posX = 2 ; posX < (gameMapSize - 2) ; posX++) {
            for (posY = 0 ; posY < gameMapSize ; posY ++) {
                if 		(gameMap[posY][posX - 2] == 1 && gameMap[posY][posX - 1] == 1 && gameMap[posY][posX] == 1 && gameMap[posY][posX + 1] == 1 && gameMap[posY][posX + 2] == 1) { score ++; }
                else if	(gameMap[posY][posX - 2] == 2 && gameMap[posY][posX - 1] == 2 && gameMap[posY][posX] == 2 && gameMap[posY][posX + 1] == 2 && gameMap[posY][posX + 2] == 2) { score ++; }   
                else if (gameMap[posX - 2][posY] == 1 && gameMap[posX - 1][posY] == 1 && gameMap[posX][posY] == 1 && gameMap[posX + 1][posY] == 1 && gameMap[posX + 2][posY] == 1) { score ++; }
                else if (gameMap[posX - 2][posY] == 2 && gameMap[posX - 1][posY] == 2 && gameMap[posX][posY] == 2 && gameMap[posX + 1][posY] == 2 && gameMap[posX + 2][posY] == 2) { score ++; }
            }
        }

        for (posX = 2 ; posX < (gameMapSize - 2) ; posX ++) {
            for (posY = 2 ; posY < (gameMapSize - 2) ; posY ++) {
                if 		(gameMap[posY - 2][posX - 2] == 1 && gameMap[posY - 1][posX - 1] == 1 && gameMap[posY][posX] == 1 && gameMap[posY + 1][posX + 1] == 1 && gameMap[posY + 2][posX + 2] == 1) { score ++; }
                else if (gameMap[posY - 2][posX - 2] == 2 && gameMap[posY - 1][posX - 1] == 2 && gameMap[posY][posX] == 2 && gameMap[posY + 1][posX + 1] == 2 && gameMap[posY + 2][posX + 2] == 2) { score ++; }  
                else if (gameMap[posY + 2][posX - 2] == 1 && gameMap[posY + 1][posX - 1] == 1 && gameMap[posY][posX] == 1 && gameMap[posY - 1][posX + 1] == 1 && gameMap[posY - 2][posX + 2] == 1) { score ++; }
                else if (gameMap[posY + 2][posX - 2] == 2 && gameMap[posY + 1][posX - 1] == 2 && gameMap[posY][posX] == 2 && gameMap[posY - 1][posX + 1] == 2 && gameMap[posY - 2][posX + 2] == 2) { score ++; }
            }
        }
        return (score > 0)? true: false; 
    },
    
    /* ---------------------------------------------------------------------------- */

    setRoomCreat: function (room) {
        roomName = room;
        roomCreat = true;

        Game.startRoomTimer();
    },
    
    setPlayerAdd: function (player) {
        gamePlayerList.push(player);
        gamePlayerStone.push(0);
    },

    setMapStone: function (posX, posY) {
        gamePosX = posX;
        gamePosY = posY;
        
        gamePlayerStone[gameTurn-1] ++;
        gameMap[posY-1][posX-1] = ((gameTurn == 1) ? 1 : 2);

        return Game.setNextTurn();
    },

    setNextTurn: function() {
        gameTimerCount = 0;
        gameTurn = (gameTurn == 1) ? 2 : 1;

        return Game.checkWin()? Game.printWinEvent(): Game.printEventMap(); 
    },

    getNowPlayer: () => { return gamePlayerList[gameTurn - 1]; },
    getNowStone: () => { return ((gameTurn == 1) ? "흑" : "백"); },
    getNextPlayer: () => { return gamePlayerList[(gameTurn == 1) ? 1 : 0]; },
    getNextStone: () => { return ((gameTurn == 1) ? "백" : "흑"); },

    /**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
    command: async function (guildId, interaction) {

        const sender = interaction.user.username,
            subcommand = interaction.options.getSubcommand(),
            channelId = interaction.channelId;

        const printMessage = function (type) {
            switch (type) {
                case 1: Bot.replyEphe(interaction, "오목 게임이 생성된 채팅방에서만 입력이 가능합니다."); break;
                case 2: Bot.replyEphe(interaction, "이미 오목 게임이 진행중입니다."); break;
                case 3: Bot.replyEphe(interaction, "진행중인 게임이 없습니다."); break;
                case 4: Bot.replyEphe(interaction, "방장만 입력이 가능합니다."); break;
                case 5: Bot.replyEphe(interaction, "중복 참여로 참가가 거부되었습니다."); break;
                case 6: Bot.replyEphe(interaction, "인원이 초과되었습니다."); break;
                case 11: Bot.replyEphe(interaction, "현재 자신의 차례가 아닙니다."); break;
                case 12: Bot.replyEphe(interaction, "플레이어가 아닌 사람은 착수할 수 없습니다."); 
            }
        };
        const roomManager = gamePlayerList[0];
        const roomCheck	= (roomName == channelId);
        const managerCheck = (roomManager == sender);
        const playerCheck = (gamePlayerList.indexOf(sender) != -1);
        
        if (subcommand == 'help') {
            Bot.replyEphe(interaction, 
                "< 오목 도움말 >\n\n" +
                "● 게임 시작 방법: `/gomoku join`으로 참가한 뒤 `/gomoku start`로 시작\n" +
                "● 게임 방법: 한 턴당 45초의 시간이 주어지며, 드롭박스를 이용하여 착수 위치를 정하고 버튼을 누르면 착수할 수 있습니다.\n" +
                "" // "● .판 / .맵 / .종료 / . 재시작"
            );
        } else if (subcommand == "join") { 
            if (!roomCreat) {
                Game.setPlayerAdd(sender);
                Game.setRoomCreat(channelId);

                Bot.reply(interaction, 
                    "[ " + sender + " ] 님이 오목 게임을 생성하였습니다.\n\n" + 
                    "게임 참가를 원하시면 `/gomoku join`을 입력 해 주세요."
                );
            } else { 
                if (roomCheck) { if (!gamePower) { if(!playerCheck) { if (gamePlayerList.length < 2) {
                    Game.setPlayerAdd(sender);
                        
                    Bot.reply(interaction,
                        "[ " + sender + " ] 님이 오목에 참가하셨습니다.\n\n" + 
                        "준비되었다면 `/gomoku start`로 시작해주세요."
                    );
                } else printMessage(6); } else printMessage(5); } else printMessage(2); } else printMessage(1); 
            } 
        } else if (subcommand == "start") {
            Game.start();
            await Bot.reply(interaction, 
                "게임을 시작합니다!\n\n" +
                "< 플레이어 목록 >\n" +
                "흑: `" + gamePlayerList[0] + "`\n" + 
                "백: `" + gamePlayerList[1] + "`"
            );

            const optNum = [], optLatin = [], ASCII_A = 64;
            for (let i=1; i<=15; i++) {
                optNum.push({ label: i.toString(), value: i.toString() });
                optLatin.push({ label: String.fromCharCode(ASCII_A+i), value: i.toString() });
            }

            let posXSel = new StringSelectMenuBuilder()
                .setCustomId('posx')
                .setOptions(optLatin)
                .setPlaceholder('x좌표를 선택...');

            let posYSel = new StringSelectMenuBuilder()
                .setCustomId('posy')
                .setOptions(optNum)
                .setPlaceholder('y좌표를 선택...');

            let confirmBtn = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('착수')
                .setDisabled(true)
                .setStyle(ButtonStyle.Primary)
                
            let row1 = new ActionRowBuilder()
                .addComponents(posXSel);

            let row2 = new ActionRowBuilder()
                .addComponents(posYSel);

            let row3 = new ActionRowBuilder()
                .addComponents(confirmBtn);

            messageObject = await Bot.replyRoom({ 
                content: this.printEventMap().msg,
                components: [row1, row2, row3]
            });

            let posX = 0, posY = 0;

            const selectCollector = messageObject.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000 });
            selectCollector.on('collect', async i => {
                interaction = i;

                if (i.user.username != gamePlayerList[gameTurn-1]) {
                    printMessage(11);
                    return null;
                } else if (gamePlayerList.indexOf(i.user.username) < 0) {
                    printMessage(12);
                    return null;
                }

                const id = i.customId;
                if (id == 'posx') {
                    posX = Number(i.values[0]);
                    posXSel = posXSel.setPlaceholder(String.fromCharCode(ASCII_A+posX));
                } else if (id == 'posy') {
                    posY = Number(i.values[0]);
                    posYSel = posYSel.setPlaceholder(posY.toString());
                }

                const isDecided = (posX*posY > 0);
                if (isDecided) confirmBtn = confirmBtn.setDisabled(false);

                i.update({
                    components: [row1, row2, row3],
                });
            });

            const confirmCollector = messageObject.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 });
            confirmCollector.on('collect', async i => {
                interaction = i;

                posXSel = posXSel.setPlaceholder('x좌표를 선택...');
                posYSel = posYSel.setPlaceholder('y좌표를 선택...');
                confirmBtn = confirmBtn.setDisabled(true);

                if (gamePlayerList.indexOf(i.user.username) >= 0) { if (i.user.username == gamePlayerList[gameTurn-1]) {
                    if (Game.checkStone(i, posX, posY)) {
                        const res = Game.setMapStone(posX, posY);
                        const contents = res.isWin? { content: res.msg, components: [] }: { content: res.msg, components: [row1, row2, row3] };
                        i.update(contents);

                        posX = 0, posY = 0;
                    }
                } else printMessage(11); } else printMessage(12);
            });
        
        } else if (subcommand == "quit") { if (roomCheck) { if (managerCheck) { if (gamePower) {
            await interaction.reply('게임을 종료합니다.');
            messageObject.delete();
            Game.off();
            } else printMessage(3); } else printMessage(4); } else printMessage(1);
        } else if (subcommand == "restart") { if (roomCheck) { if (managerCheck) { if (gamePower) {
            await interaction.reply("현재 인원으로 게임을 재시작합니다.");
            Game.restart();

        } else printMessage(3); } else printMessage(4); } else printMessage(1); }
    }
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gomoku')
		.setDescription('오목을 할 수 있다.')
        .addSubcommand(subcommand => 
			subcommand
            .setName('help')
            .setDescription('도움말 보기')
		)
        .addSubcommand(subcommand => 
			subcommand
            .setName('join')
            .setDescription('오목에 참가하기')
		)
        .addSubcommand(subcommand => 
            subcommand
            .setName('start')
            .setDescription('게임 시작하기')
        ),
        // .addSubcommand(subcommand => 
		// 	subcommand
        //     .setName('quit')
        //     .setDescription('기권하기')
		// )
        // .addSubcommand(subcommand => 
		// 	subcommand
        //     .setName('restart')
        //     .setDescription('처음부터 하기')
		// ),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
        const channel = interaction.channel, guildId = interaction.guildId;

        if (!Bot) {
            Bot = {
                replyRoom: (msg) => { return channel.send(msg); },
                reply: async (interaction, msg) => { return await interaction.reply(msg); },
                replyEphe: async (interaction, msg) => { return await interaction.reply({ content: msg, ephemeral: true}); }
            }
        }
        
        await Game.command(guildId, interaction);
	},
};