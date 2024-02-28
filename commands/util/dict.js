const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const axios = require('axios');
const https = require('https');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dict')
		.setDescription('사전을 검색합니다.')
        .addStringOption(option => 
            option.setName('word')
            .setDescription('검색할 단어')
            .setRequired(true)
		),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const target = interaction.options.getString('word')
        const data = await fetchDictData(target);
        if(data === false) {
            await interaction.reply({ content: '「에러」: 사전에 접근하는 데 실패했다.', ephemeral: true });
            return;
        } else if(data.length < 1) {
            await interaction.reply({ content: '「에러」: 검색 결과가 없음.', ephemeral: true });
            return;
        }

        let tempTop, temp, res = [];
        for (let i=0; i<data.length; i++){
            query = data[i].word;
            tempTop = data[i].sense;
            for(let j=0;j<tempTop.length;j++){
                temp = tempTop[j];
                res.push({
                    "word": query,
                    "num": temp.sense_no,
                    "pumsa": temp.pos,
                    "desc": temp.definition,
                    "syntax": temp.syntacticAnnotation,
                    "realm": temp.cat,
                    "origin": temp.origin
                });
            }
        }
        
        const fs = res.map(makeDictData2Field);
        const fields = fs.slice(0, 25);

        const embed = new EmbedBuilder()
            .setTitle(`${target}의 검색 결과`)
            .addFields(fields)
            .setFooter({ text: 'powered by 우리말샘' });

        await interaction.reply({ content: '「정보」: 검색 결과', embeds: [embed] });
            
        function makeDictData2Field(x){
            const toUpperNum = n => ["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"][Number(n)];

            let r = {};
            r.name = x.word + x.num.replace(/\d/g, toUpperNum);
            if(x.origin) r.name += `(${x.origin})`;
            r.value = (x.pumsa? " 「"+x.pumsa+"」":"") + (x.realm? " 『"+x.realm+"』":"") + (x.syntax? x.syntax:"") + " " + x.desc;
            return r;
        }

        async function fetchDictData(word) {
            const agent = new https.Agent({ rejectUnauthorized: false });
            const apiUrl = `https://opendict.korean.go.kr/api/search?key=${process.env.DICT_TOKEN}&q=${word}&req_type=json&num=100&advanced=y&method=exact`;

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

// function searchKkutu(word, origin){
//     const theme = {"0":"","10":"<가톨릭>","20":"<건설>","30":"<경제>","40":"<고적>","50":"<고유>","60":"<공업>","70":"<광업>","80":"<교육>","90":"<교통>","100":"<군사>","110":"<기계>","120":"<기독교>","130":"<논리>","140":"<농업>","150":"<문학>","160":"<물리>","170":"<미술>","180":"<민속>","190":"<동물>","200":"<법률>","210":"<불교>","220":"<사회>","230":"<생물>","240":"<수학>","250":"<수산>","260":"<수공>","270":"<식물>","280":"<심리>","290":"<약학>","300":"<언론>","310":"<언어>","320":"<역사>","330":"<연극·영화>","340":"<예술>","350":"<체육>","360":"<음악>","370":"<의학>","380":"<인명>","390":"<전기>","400":"<정치>","410":"<종교>","420":"<지리>","430":"<지명>","440":"<책명>","450":"<천문>","460":"<철학>","470":"<출판>","480":"<통신>","490":"<컴퓨터>","500":"<한의학>","510":"<항공>","520":"<해양>","530":"<화학>","1001":"<나라 이름과 수도>","APP":"<모바일 애플리케이션>","BDG":"<보드 게임>","BDM":"<BanG Dream!>","BRS":"<브롤스타즈>","CKR":"<쿠키런>","CRY":"<클래시 로얄/클래시 오브 클랜>","CYP":"<사이퍼즈>","DGM":"<디지몬>","DOT":"<도타 2>","DRM":"<도라에몽>","DRR":"<듀라라라!!>","ELW":"<엘소드>","FOD":"<식품>","GSS":"<고사성어/숙어>","HDC":"<함대 컬렉션>","HOS":"<히어로즈 오브 더 스톰>","HSS":"<하스스톤>","IMS":"<THE iDOLM@STER>","JAN":"<만화/애니메이션>","JLN":"<라이트 노벨>","JTP":"<동방 프로젝트>","KAR":"<카트라이더>","KGR":"<아지랑이 프로젝트>","KGU":"<기업>","KHA":"<한국사 사건사고>","KIO":"<끄투리오>","KKT":"<끄투코리아>","KMS":"<관광지>","KOT":"<대한민국 철도역>","KPN":"<한국 지명>","KPO":"<유명인>","KPS":"<한국 대중음악>","KRR":"<개구리 중사 케로로>","KTV":"<국내 방송 프로그램>","KWT":"<웹툰>","LOL":"<리그 오브 레전드>","LVL":"<러브 라이브!>","MAP":"<메이플스토리>","MCT":"<마인크래프트>","MDM":"<모두의마블>","MDS":"<모여봐요 동물의 숲>","MMM":"<마법소녀 마도카☆마기카>","MOB":"<모바일 게임>","MOV":"<영화>","MRN":"<마법소녀 리리컬 나노하>","NEX":"<온라인 게임>","NFX":"<넷플릭스 오리지널>","NVL":"<소설>","ONE":"<원피스>","OVW":"<오버워치>","POK":"<포켓몬스터>","RAG":"<라면/과자/음식>","RDO":"<한국 라디오 프로그램>","SMC":"<시드 마이어의 문명>","STA":"<스타크래프트>","SVN":"<세븐나이츠>","TFK":"<한국 교통시설>","THP":"<동방 프로젝트>","VDG":"<비디오 게임>","VOC":"<VOCALOID>","YMI":"<유명인>","ZEL":"<젤다의 전설>"};

//     var data = [];  
//     data[0] = JSON.parse(org.jsoup.Jsoup.connect("https://kkutu.co.kr/o/dict/"+word+"?lang=ko").header("cookie","_ga=GA1.3.635876481.1622873860; oppo=15; kkuko=s%3AgRA7WObGkAvLE1NNpeXVirYLMiIeaBhT.QE4gHhOMUxqbd62Jh8D06z7fomL04N7RKHdmySfmyug; _gid=GA1.3.109159339.1623247305; test=; lc=ko_KR; _gat_gtag_UA_97414524_1=1").header("referer","https://kkutu.co.kr/o/game?server=0").ignoreContentType(true).get().text());
//     data[1] = JSON.parse(org.jsoup.Jsoup.connect("https://kkutu.io/dict/"+word+"?lang=ko").ignoreContentType(true).get().text());
        
//     var count, error = 0;
//     for(var i=0;i<2;i++){
//         if(!!data[i].error){
//             data[i] = "검색 결과 없음.";
//             data[i] += i? "\n(끄투리오)":"\n(끄투코리아)";
//             error++;
//             continue;
//         }
            
//         data[i].theme = data[i].theme.split(",");
//         data[i].type = data[i].type.split(",");
//         data[i].mean = data[i].mean.split(/＂[0-9]+＂/g).map((x, y) => "＂"+y+"＂"+x); data[i].mean.shift();
//         count = -1;
//         data[i].mean = data[i].mean.map(x => x.replace(/）|＂(?![0-9［])/g, repl));
            
//         data[i] = data[i].word+"\n"+data[i].mean.join("\n");
//         data[i] += i? "\n(끄투리오)":"\n(끄투코리아)";
//     }

//     if(error > 1) return false;
//     else return data.join("\n\n");

//     function repl(txt){
//         count++;
//         return txt+theme[data[i].theme[count]]+" ";
//     }
// }

// function isJongsung(str){ //마지막 글자 종성 여부
//     var cCode = str.charCodeAt(str.length-1) - 0xAC00;
//     return !!(cCode % 28);
// }