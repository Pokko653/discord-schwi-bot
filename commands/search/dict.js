require("dotenv").config();
const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const axios = require('axios');
const https = require('https');

const theme = {"0": "", "10": "<가톨릭>", "20": "<건설>", "30": "<경제>", "40": "<고적>", "50": "<고유>", "60": "<공업>", "70": "<광업>", "80": "<교육>", "90": "<교통>", "100": "<군사>", "110": "<기계>", "120": "<기독교>", "130": "<논리>", "140": "<농업>","150": "<문학>","160": "<물리>","170": "<미술>","180": "<민속>","190": "<동물>","200": "<법률>","210": "<불교>","220": "<사회>","230": "<생물>","240": "<수학>","250": "<수산>","260": "<수공>","270": "<식물>","280": "<심리>","290": "<약학>","300": "<언론>","310": "<언어>","320": "<역사>","330": "<연극·영화>","340": "<예술>","350": "<체육>","360": "<음악>","370": "<의학>","380": "<인명>","390": "<전기>","400": "<정치>","410": "<종교>","420": "<지리>","430": "<지명>","440": "<책명>","450": "<천문>","460": "<철학>","470": "<출판>","480": "<통신>","490": "<컴퓨터>","500": "<한의학>","510": "<항공>","520": "<해양>","530": "<화학>","1001": "<나라 이름과 수도>","APP": "<모바일 애플리케이션>","BDG": "<보드 게임>","BDM": "<BanG Dream!>","BRS": "<브롤스타즈>","CKR": "<쿠키런>","CRY": "<클래시 로얄/클래시 오브 클랜>","CYP": "<사이퍼즈>","DGM": "<디지몬>","DOT": "<도타 2>","DRM": "<도라에몽>","DRR": "<듀라라라!!>","ELW": "<엘소드>","FOD": "<식품>","GSS": "<고사성어/숙어>","HDC": "<함대 컬렉션>","HOS": "<히어로즈 오브 더 스톰>","HSS": "<하스스톤>","IMS": "<THE iDOLM@STER>","JAN": "<만화/애니메이션>","JLN": "<라이트 노벨>","JTP": "<동방 프로젝트>","KAR": "<카트라이더>","KGR": "<아지랑이 프로젝트>","KGU": "<기업>","KHA": "<한국사 사건사고>","KIO": "<끄투리오>","KKT": "<끄투코리아>","KMS": "<관광지>","KOT": "<대한민국 철도역>","KPN": "<한국 지명>","KPO": "<유명인>","KPS": "<한국 대중음악>","KRR": "<개구리 중사 케로로>","KTV": "<국내 방송 프로그램>","KWT": "<웹툰>","LOL": "<리그 오브 레전드>","LVL": "<러브 라이브!>","MAP": "<메이플스토리>","MCT": "<마인크래프트>","MDM": "<모두의마블>","MDS": "<모여봐요 동물의 숲>","MMM": "<마법소녀 마도카☆마기카>","MOB": "<모바일 게임>","MOV": "<영화>","MRN": "<마법소녀 리리컬 나노하>","NEX": "<온라인 게임>","NFX": "<넷플릭스 오리지널>","NVL": "<소설>","ONE": "<원피스>","OVW": "<오버워치>","POK": "<포켓몬스터>","RAG": "<라면/과자/음식>","RDO": "<한국 라디오 프로그램>","SMC": "<시드 마이어의 문명>","STA": "<스타크래프트>","SVN": "<세븐나이츠>","TFK": "<한국 교통시설>","THP": "<동방 프로젝트>","VDG": "<비디오 게임>","VOC": "<VOCALOID>","YMI": "<유명인>","ZEL": "<젤다의 전설>"};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dict')
        .setNameLocalization('ko', '사전')
		.setDescription('Search a word in Korean dictionary, 우리말샘')
        .setDescriptionLocalization('ko', '한국어 사전인 우리말샘에 단어를 검색한다.')
        .addStringOption(option => 
            option
            .setName('word')
            .setNameLocalization('ko', '단어')
            .setDescription('Korean word to search')
            .setDescriptionLocalization('ko', '검색할 단어')
            .setRequired(true)
		),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
        interaction.deferReply();

        // Component function
        const toUpperNum = (n) => ["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"][Number(n)];
        const makeDictData2Field = (x) => {
            let r = {};

            r.name = x.word + x.num.replace(/\d/g, toUpperNum);
            if (x.origin) r.name += `(${x.origin})`;

            r.value = (x.pumsa? " 「"+x.pumsa+"」":"") + (x.realm? " 『"+x.realm+"』":"") + (x.syntax? x.syntax:"") + " " + x.desc;
            return r;
        }

		const target = interaction.options.getString('word');
        const data = await searchDictData(target);
        if (data === false) {
            await interaction.editReply({ content: '「에러」: 사전에 접근하는 데 실패했다.', ephemeral: true });
            return;
        } else if (!!data == false) {
            await interaction.editReply({ content: '「에러」: 검색 결과가 없다.', ephemeral: true });
            return;
        }

        let tempTop, temp, res = [];
        for (let i=0; i<data.length; i++) {
            tempTop = data[i].sense;
            for (let j=0; j<tempTop.length; j++) {
                temp = tempTop[j];
                
                if (data[i].word.replace(/[-\^]/g, '') === target.replace(/ /g, '')) res.push({
                    "word": data[i].word,
                    "num": temp.sense_no,
                    "pumsa": temp.pos,
                    "desc": temp.definition,
                    "syntax": temp.syntacticAnnotation,
                    "realm": temp.cat,
                    "origin": temp.origin
                });
            }
        }
        
        res.sort((a, b) => a.num - b.num);

        // API 오류로 중복된 단어가 나오면 단어 정보 조회로 수정
        for (let i=0; i<res.length; i++) {
            if (Number(res[i].num) != i+1) {
                fixedData = await fetchDictData(target, i+1);

                res[i] = {
                    "word": res[i].word,
                    "num": String(i+1).padStart(3, '0'),
                    "pumsa": fixedData.senseInfo.pos,
                    "desc": fixedData.senseInfo.definition,
                    "syntax": fixedData.senseInfo?.grammar_info? fixedData.senseInfo?.grammar_info[0]: '',
                    "realm": fixedData.senseInfo?.cat_info? fixedData.senseInfo?.cat_info[0]: '',
                    "origin": res[i].origin
                };
            }
        }

        const fs = res.map(makeDictData2Field);
        const fields = fs.slice(0, 25);

        const embed = new EmbedBuilder()
            .setTitle(`'${target}'의 사전 검색 결과`)
            .addFields(fields)
            .setFooter({ text: 'powered by 우리말샘(opendict.korean.go.kr)' });

        await interaction.editReply({ content: `「정보」: \`${target}\`의 검색 결과이다.`, embeds: [embed] });

        async function searchDictData(word) {
            const agent = new https.Agent({ rejectUnauthorized: false });
            const apiUrl = `https://opendict.korean.go.kr/api/search?key=${process.env.DICT_TOKEN}&q=${word}&target_type=search&req_type=json&part=word&sort=dict&start=1&num=25&method=exact`;

            try {
                const jsonData = await axios.get(apiUrl, { httpsAgent: agent });
                return jsonData.data.channel.item;
            } catch (e) {
                console.error('Error fetching data:', e);
                return false;
            }
        }

        async function fetchDictData(word, num) {
            const agent = new https.Agent({ rejectUnauthorized: false });
            const apiUrl = `https://opendict.korean.go.kr/api/view?key=${process.env.DICT_TOKEN}&target_type=view&req_type=json&method=word_info&q=${word}${num.toString().padStart(3, '0')}`;

            try {
                const jsonData = await axios.get(apiUrl, { httpsAgent: agent });
                return jsonData.data.channel.item;
            } catch (e) {
                console.error('Error fetching data:', e);
                return false;
            }
        }
	},
};
