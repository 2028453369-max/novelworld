'use strict';

const DB_NAME = 'WorldviewMobileV2DB';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const STATE_KEY = 'main';
const baseStatuses = ['灵感','构思中','待补充','已确认','需核对','已废弃'];
const F = (key, label, type = 'text', placeholder = '', options = [], full = false, help = '') => ({ key, label, type, placeholder, options, full, help });
const MODULES = [
  {
    id: 'character', name: '角色库', icon: '♟', group: '人物与势力',
    desc: '管理主要角色、配角、历史人物与群像角色的完整人物档案。',
    fields: [
      F('aliases','别名 / 称号'), F('species','种族 / 物种'), F('gender','性别 / 性别设定'), F('age','年龄 / 表观年龄'),
      F('birth','出生时间与地点'), F('identity','身份与职业'), F('faction','所属组织 / 阵营'), F('role','叙事定位','select','',['主角','重要配角','反派','导师','盟友','路人','历史人物']),
      F('goal','外在目标','textarea','角色主动追求什么？',[],true), F('need','内在需求','textarea','角色真正需要获得或理解什么？',[],true),
      F('fear','恐惧与软肋','textarea','最害怕失去什么？',[],true), F('secret','秘密与谎言','textarea','角色隐藏的事实与自我欺骗。',[],true),
      F('strengths','优势 / 能力'), F('weaknesses','缺陷 / 限制'), F('values','价值观与底线','textarea','不可妥协、可被动摇与会背叛的部分。',[],true),
      F('voice','语言习惯 / 口头禅'), F('arc','角色弧光','textarea','起点—转折—终点。',[],true), F('links','关联档案','textarea','相关角色、组织、地点、道具、剧情线。',[],true)
    ],
    guide: ['身份层：姓名、年龄、种族、职业、社会身份、阵营。','欲望层：目标、需求、恐惧、秘密、执念、底线。','行动层：能力、资源、习惯、决策模式、危机反应。','叙事层：功能、人物弧光、关键选择、结局可能性。']
  },
  {
    id: 'appearance', name: '形象', icon: '◉', group: '人物与势力',
    desc: '记录角色、种族、组织与物件的视觉形象，并上传参考图或绘制草图。',
    fields: [
      F('target','对应对象'), F('image','形象参考图','image','',[],true), F('body','体型 / 身高 / 姿态','textarea','轮廓、比例、动作习惯。',[],true),
      F('face','面部特征','textarea','五官、眼神、表情、肤色。',[],true), F('hair','发型 / 毛发 / 角翼'), F('clothing','服装体系','textarea','日常、礼服、战斗、职业装。',[],true),
      F('palette','代表色 / 材质'), F('marks','伤痕 / 纹身 / 标志'), F('accessories','配饰 / 随身物'), F('voice','声音 / 气味 / 触感'),
      F('mannerisms','动作与微表情','textarea','紧张、撒谎、愤怒、放松时的变化。',[],true), F('visualSymbol','视觉象征','textarea','形象如何表达性格、阶级、文化与命运。',[],true)
    ],
    guide: ['固定识别点：轮廓、颜色、标志物、动作习惯。','场景变化：日常、战斗、节庆、落难、成长后的形象。','文化来源：服装、发型、纹样、材质与社会阶层的关系。','避免只写“漂亮/帅气”，尽量使用可被画出的具体细节。']
  },
  {
    id: 'relationship', name: '关系', icon: '⇄', group: '人物与势力',
    desc: '记录角色之间公开与隐藏的关系，可在图谱中建立节点和连线。',
    fields: [
      F('partyA','关系方 A'), F('partyB','关系方 B'), F('relationType','关系类型','select','',['亲属','恋爱','朋友','师徒','上下级','合作','敌对','竞争','利用','未知']),
      F('publicState','公开关系'), F('privateState','真实关系'), F('origin','关系起源','textarea','第一次相遇、共同经历或制度原因。',[],true),
      F('balance','权力与依赖'), F('trust','信任程度'), F('conflict','核心冲突','textarea','双方无法同时满足的诉求。',[],true),
      F('hiddenInfo','信息差 / 误解','textarea','谁知道什么，谁误会了什么？',[],true), F('turningPoints','关系转折','textarea','关系升温、破裂、反转的节点。',[],true),
      F('future','可能走向','textarea','和解、背叛、牺牲、疏离、共生等。',[],true)
    ],
    guide: ['关系不是标签，而是“需求—交换—冲突—变化”。','分别记录公开关系、真实关系和角色自以为的关系。','标注权力差、情感债、信息差和不可说的利益。','图谱模式可用于绘制人物网络。']
  },
  {
    id: 'organization', name: '组织', icon: '⌂', group: '人物与势力',
    desc: '管理国家、宗派、公司、军队、学院、家族、秘密结社等势力。',
    fields: [
      F('orgType','组织类型'), F('founded','成立时间 / 创始人'), F('purpose','公开目标','textarea','对外宣称的使命。',[],true), F('truePurpose','真实目标','textarea','内部核心利益与秘密任务。',[],true),
      F('structure','组织结构','textarea','层级、部门、职位、继承或晋升机制。',[],true), F('leaders','领导层'), F('members','主要成员 / 构成'),
      F('territory','控制区域'), F('resources','资源与收入','textarea','土地、军力、技术、情报、经济来源。',[],true), F('culture','组织文化 / 口号 / 仪式','textarea','成员如何被塑造。',[],true),
      F('rules','制度与禁令','textarea','奖励、惩罚、退出代价。',[],true), F('allies','盟友'), F('rivals','敌对势力'), F('secrets','组织秘密','textarea','不可公开的历史、丑闻或弱点。',[],true)
    ],
    guide: ['组织需要“目标、结构、资源、制度、文化、敌友”六个层面。','组织内部应存在派系与利益冲突，而非铁板一块。','考虑成员为何加入、为何留下、为何背叛。','图谱模式可绘制组织架构、势力范围与联盟。']
  },
  {
    id: 'journey', name: '角色历程', icon: '↝', group: '人物与势力',
    desc: '按时间记录角色经历、选择、代价、能力变化和心理转折。',
    fields: [
      F('character','角色'), F('stage','人生阶段'), F('startDate','开始日期','date'), F('endDate','结束日期','date'), F('location','地点'),
      F('event','发生事件','textarea','客观发生了什么。',[],true), F('choice','角色选择','textarea','角色面对什么选项，为什么这样选。',[],true),
      F('cost','付出的代价'), F('gain','获得的东西'), F('beliefBefore','此前信念'), F('beliefAfter','此后信念'),
      F('relationshipChange','关系变化','textarea','与谁更近或更远。',[],true), F('foreshadow','伏笔与回收','textarea','该经历为后文埋下什么。',[],true)
    ],
    guide: ['每段历程至少包含：事件、选择、代价、变化。','重要的不是“遭遇”，而是角色如何回应遭遇。','记录能力、身份、关系、信念四条变化曲线。','图谱模式可绘制人物成长路线。']
  },
  {
    id: 'worldPlot', name: '世界剧情', icon: '⌛', group: '时空与自然',
    desc: '记录世界历史、时代更替、战争灾难、王朝兴衰与全球性事件。',
    fields: [
      F('era','时代 / 纪元'), F('date','发生日期'), F('location','发生地点'), F('actors','参与势力 / 人物'),
      F('cause','直接原因','textarea','触发事件。',[],true), F('deepCause','深层原因','textarea','制度、资源、历史矛盾。',[],true),
      F('process','事件过程','textarea','关键阶段与转折。',[],true), F('outcome','直接结果','textarea','谁获利、谁受损。',[],true),
      F('impact','长期影响','textarea','政治、经济、文化、生态、信仰的改变。',[],true), F('officialVersion','官方叙述','textarea','世人普遍相信的版本。',[],true),
      F('truth','真实内幕','textarea','被掩盖或误解的事实。',[],true), F('evidence','遗迹 / 证据 / 传说')
    ],
    guide: ['区分“发生了什么”“人们认为发生了什么”“真正发生了什么”。','重大事件应改变边界、制度、人口、资源或集体记忆。','让历史留下遗迹、节日、仇恨、法律和语言痕迹。','图谱模式可连接历史事件的因果链。']
  },
  {
    id: 'map', name: '地图中心', icon: '⌖', group: '时空与自然',
    desc: '管理世界、国家、区域、城市、建筑与路线，并使用绘图板绘制地图。',
    fields: [
      F('level','地图层级','select','',['世界','大陆','国家','区域','城市','建筑','地下/异空间']), F('parent','上级区域'), F('coordinates','坐标 / 相对方位'),
      F('terrain','地形'), F('climate','气候'), F('population','人口 / 族群'), F('government','统治者 / 管理机构'),
      F('resources','资源与特产'), F('landmarks','地标与奇观','textarea','可识别地点与视觉焦点。',[],true), F('danger','危险与禁区'),
      F('routes','道路 / 航线 / 传送','textarea','通行时间、费用、风险。',[],true), F('strategic','战略价值'), F('storyUse','剧情用途','textarea','这里适合发生什么冲突或场景。',[],true)
    ],
    guide: ['从世界→大陆→国家→区域→城市→建筑建立层级。','地图不仅画形状，还要记录距离、交通时间与资源流动。','地形应影响战争、贸易、语言、饮食和政权边界。','绘图板可导入底图，再绘制边界、道路、河流和标记。']
  },
  {
    id: 'worldOperation', name: '世界运行', icon: '⚙', group: '核心设定',
    desc: '定义这个世界每天如何运转：制度、交通、信息、治安、医疗与战争。',
    fields: [
      F('scope','适用范围'), F('governance','治理与行政','textarea','权力如何下达、执行与监督。',[],true), F('law','法律与司法','textarea','立法、执法、审判与惩罚。',[],true),
      F('security','治安与犯罪','textarea','谁维持秩序，黑市如何存在。',[],true), F('transport','交通与旅行','textarea','速度、成本、证件与风险。',[],true),
      F('communication','通讯与信息','textarea','消息传播速度、媒体、审查、谣言。',[],true), F('education','教育与晋升','textarea','识字率、学校、考试、师徒。',[],true),
      F('health','医疗与生育','textarea','疾病、寿命、治疗、公共卫生。',[],true), F('warfare','战争与军队','textarea','征兵、后勤、武器、战争规则。',[],true),
      F('dailyLife','普通人的一天','textarea','吃穿住行、劳动、娱乐、休息。',[],true), F('failure','系统失灵时','textarea','灾害、政变、断粮、断网时会怎样。',[],true)
    ],
    guide: ['用“一个普通人如何度过一天”检验世界是否能运行。','任何便利都要有成本、基础设施和维护者。','记录信息、物资、权力三种流动速度。','考虑制度失灵、边疆例外和地下规则。']
  },
  {
    id: 'worldOutline', name: '世界总纲', icon: '✦', group: '核心设定',
    desc: '集中保存作品的核心主题、世界规则、边界、矛盾与整体叙事承诺。',
    fields: [
      F('genre','类型 / 子类型'), F('tone','基调 / 氛围'), F('audience','目标读者'), F('pitch','一句话梗概','textarea','谁，在怎样的世界，为了什么，面对什么阻碍。',[],true),
      F('theme','核心主题','textarea','作品想持续追问的问题。',[],true), F('coreConflict','世界级核心矛盾','textarea','无法轻易调和的两种力量。',[],true),
      F('premise','世界前提','textarea','与现实最关键的不同是什么？',[],true), F('rules','不可违背的世界规则','textarea','自然、超凡、社会和叙事规则。',[],true),
      F('boundaries','能力与设定边界','textarea','明确哪些事情绝对做不到。',[],true), F('history','历史阶段概览','textarea','用几个时代说明世界如何变成现在。',[],true),
      F('taboos','禁忌与敏感点'), F('readerPromise','读者承诺','textarea','读者将持续获得怎样的体验。',[],true), F('endingDirection','结局方向 / 最终命题','textarea','不必写死情节，但明确终局意义。',[],true)
    ],
    guide: ['先写一句话梗概，再写核心矛盾和主题问题。','所有子设定都应服务于世界前提或故事冲突。','明确世界边界可避免后期无限补丁。','总纲是其他档案的判断标准，而不是百科全书。']
  },
  {
    id: 'power', name: '力量体系', icon: '✹', group: '核心设定',
    desc: '设计魔法、异能、武学、科技、血脉或神秘力量的来源、代价与制衡。',
    fields: [
      F('systemName','体系名称'), F('source','力量来源'), F('access','获得方式','textarea','天赋、训练、契约、器官、知识、资源。',[],true),
      F('levels','等级 / 阶段','textarea','每一级的能力、门槛和社会意义。',[],true), F('manifestation','表现形式','textarea','视觉、声音、感官与物理后果。',[],true),
      F('cost','使用代价','textarea','消耗、伤害、寿命、道德、社会风险。',[],true), F('limits','限制条件','textarea','距离、时间、材料、环境、认知。',[],true),
      F('counter','克制与反制','textarea','如何防御、打断、欺骗或封印。',[],true), F('measurement','检测与衡量'), F('training','训练与教育'),
      F('institutions','相关组织'), F('economy','资源与经济影响','textarea','力量如何改变职业、阶级、战争和贸易。',[],true), F('forbidden','禁术 / 失控 / 污染','textarea','越界会发生什么。',[],true)
    ],
    guide: ['力量体系必须同时写“能做什么、不能做什么、要付什么”。','强大能力应产生社会制度、产业和反制手段。','等级差异不只体现在数值，也体现在权限与认知。','图谱模式可绘制分支、克制与进阶路线。']
  },
  {
    id: 'bestiary', name: '自然图鉴', icon: '❧', group: '时空与自然',
    desc: '收录动物、植物、菌类、矿物、怪物和生态现象。',
    fields: [
      F('category','分类','select','',['动物','植物','菌类','矿物','怪物','微生物','自然现象','其他']), F('scientific','学名 / 地方称呼'), F('habitat','栖息环境'),
      F('appearance','形态特征','textarea','大小、颜色、器官、生命周期变化。',[],true), F('behavior','行为与习性','textarea','群居、迁徙、领地、攻击方式。',[],true),
      F('diet','食性 / 能量来源'), F('reproduction','繁殖 / 传播'), F('ecology','生态位与天敌','textarea','与其他生物和环境的关系。',[],true),
      F('danger','危险等级 / 应对'), F('uses','用途与价值','textarea','食用、药用、材料、能源、驯养。',[],true),
      F('culture','文化象征 / 传说'), F('distribution','分布区域'), F('discovery','发现与研究史')
    ],
    guide: ['生物应嵌入食物链，而非孤立存在。','考虑繁殖、迁徙、天敌、疾病和季节变化。','人类或文明会如何利用、崇拜、恐惧或消灭它。','形象模块和绘图板可补充外观草图。']
  },
  {
    id: 'economy', name: '经济与货币', icon: '¤', group: '文明体系',
    desc: '设计货币、价格、生产、贸易、税收、阶级与地下经济。',
    fields: [
      F('scope','国家 / 地区 / 时代'), F('currency','货币名称与单位'), F('issuer','发行者与信用来源'), F('material','材质 / 记账方式'),
      F('exchange','汇率与兑换','textarea','不同货币、金属、票据或信用之间如何兑换。',[],true), F('prices','基准物价','textarea','食物、住宿、交通、武器、普通工资。',[],true),
      F('production','主要产业'), F('resources','稀缺资源'), F('trade','贸易路线与商品','textarea','进口、出口、关税、运输成本。',[],true),
      F('tax','税收与财政'), F('banking','银行 / 借贷 / 保险'), F('class','财富阶层与流动','textarea','贫富差距、土地与资本归属。',[],true),
      F('blackMarket','黑市与假币'), F('crisis','通胀、饥荒、制裁或金融危机','textarea','经济失衡时的连锁反应。',[],true)
    ],
    guide: ['先确定普通人的收入和一顿饭的价格。','货币价值必须来自税收、稀缺物、权力或普遍信任。','贸易路线应受地图、交通、战争和季节影响。','经济变化会直接改变阶级、犯罪、战争与婚姻。']
  },
  {
    id: 'soul', name: '灵魂与信仰', icon: '☽', group: '核心设定',
    desc: '定义灵魂、死亡、神明、宗教、仪式、神迹与异端。',
    fields: [
      F('scope','信仰 / 体系名称'), F('soulModel','灵魂结构','textarea','灵魂是否存在，由什么组成，能否分裂、转移、消亡。',[],true),
      F('death','死亡与来世','textarea','死后去向、审判、轮回、亡灵。',[],true), F('deities','神明 / 超越存在','textarea','神的来源、权能、人格与限制。',[],true),
      F('doctrine','核心教义'), F('ritual','仪式与祭祀','textarea','日常、婚丧、成年、战争与节庆仪式。',[],true), F('clergy','神职与组织'),
      F('miracle','神迹与验证'), F('heresy','异端与分裂'), F('taboo','禁忌与罪'), F('symbols','圣物 / 图腾 / 经文'),
      F('politics','宗教与权力','textarea','如何影响法律、战争、阶级和教育。',[],true), F('truth','信仰背后的真实','textarea','教义是否正确，神是否回应。',[],true)
    ],
    guide: ['分别定义形而上真相、宗教解释和民间习俗。','信仰要进入日常生活，而不只出现在神殿。','不同阶层可能用不同方式理解同一教义。','死亡规则会深刻影响战争、犯罪、亲情与伦理。']
  },
  {
    id: 'civilization', name: '文明与社会', icon: '▦', group: '文明体系',
    desc: '记录文明、政体、阶级、家庭、法律、习俗、外交与社会冲突。',
    fields: [
      F('civilization','文明 / 社会名称'), F('politics','政体与权力来源'), F('class','阶级 / 身份制度','textarea','贵族、平民、奴隶、职业阶层、户籍。',[],true),
      F('family','家庭与婚姻','textarea','继承、亲属、婚配、生育、收养。',[],true), F('gender','性别角色与身体规范'), F('law','法律与权利'),
      F('customs','日常习俗','textarea','饮食、服装、礼仪、待客、卫生。',[],true), F('festivals','节日与纪念日'), F('art','艺术与娱乐'),
      F('diplomacy','外交与他者观'), F('minorities','少数群体 / 边缘人'), F('conflicts','社会矛盾','textarea','代际、阶级、地域、族群、信仰冲突。',[],true),
      F('change','社会变迁','textarea','技术、战争、灾害或思想如何改变社会。',[],true)
    ],
    guide: ['文明不等于国家，同一国家可包含多个文化系统。','从家庭、劳动、教育、婚姻与死亡观察社会。','任何制度都同时制造受益者、受损者和灰色空间。','避免单一文化模板，考虑地域、阶层与世代差异。']
  },
  {
    id: 'knowledge', name: '知识与技艺', icon: '⌘', group: '文明体系',
    desc: '管理科学、工艺、医术、航海、炼金、建筑、农业等知识体系。',
    fields: [
      F('field','领域 / 技艺名称'), F('level','发展阶段'), F('principle','原理与核心知识','textarea','它为什么有效，世界中的人如何理解。',[],true),
      F('tools','工具 / 材料 / 设施'), F('training','学习与传承','textarea','学校、师徒、家族、秘传、考试。',[],true), F('practitioners','从业者 / 垄断者'),
      F('distribution','普及程度'), F('cost','成本与门槛'), F('applications','应用场景','textarea','生产、生活、战争、医疗、艺术。',[],true),
      F('limits','失败条件 / 误差'), F('taboo','禁忌与管制'), F('innovation','关键发明与人物'),
      F('impact','社会影响','textarea','改变了哪些职业、阶级、城市与伦理。',[],true)
    ],
    guide: ['技术水平应成套出现，避免只出现剧情需要的单项黑科技。','知识传播速度决定地区差异与垄断能力。','记录原料、工具、人才、时间和失败率。','一项技术成熟后，会催生新职业、法律与冲突。']
  },
  {
    id: 'geography', name: '地理与环境', icon: '△', group: '时空与自然',
    desc: '定义地形、气候、水文、季节、灾害、资源和环境变化。',
    fields: [
      F('region','区域'), F('landform','地形地貌'), F('climate','气候带 / 温度 / 降水'), F('seasons','季节与昼夜'),
      F('hydrology','河流、湖海与地下水','textarea','水源、流向、洪旱与航运。',[],true), F('geology','地质与矿产'), F('ecology','生态系统','textarea','主要生物群落与食物链。',[],true),
      F('disasters','自然灾害'), F('resources','自然资源'), F('settlement','聚落与人口适应','textarea','建筑、农业、服装、迁徙。',[],true),
      F('changes','长期环境变化','textarea','冰期、沙化、海退、魔力污染。',[],true), F('storyPressure','环境带来的剧情压力','textarea','旅行、战争、生存与资源争夺。',[],true)
    ],
    guide: ['山脉、河流、风向与洋流应共同影响气候和聚落。','地理决定交通成本，也影响政治边界与方言。','资源分布是贸易和战争的重要来源。','可在地图中心绘制宏观地理，在本模块记录环境机制。']
  },
  {
    id: 'props', name: '道具信物', icon: '◆', group: '剧情创作',
    desc: '记录武器、钥匙、遗物、信件、证物、圣物与象征性物件。',
    fields: [
      F('itemType','类型'), F('owner','当前持有者'), F('creator','制造者 / 来源'), F('date','出现年代'), F('image','参考图','image','',[],true),
      F('material','材质与外观'), F('function','功能与使用方法','textarea','能做什么，如何启动。',[],true), F('rules','限制与代价'),
      F('history','流转历史','textarea','曾被谁拥有，经历过什么。',[],true), F('symbol','象征意义'), F('clue','线索功能','textarea','它揭示、隐藏或误导什么。',[],true),
      F('stakes','失去 / 获得的后果'), F('related','关联角色与剧情线')
    ],
    guide: ['重要道具同时具有实用功能、情感价值和叙事功能。','记录道具的所有权变化，它往往就是剧情路线。','强力道具必须有使用条件、代价或被夺走的风险。','信物可以承载承诺、身份、罪证和记忆。']
  },
  {
    id: 'bonds', name: '羁绊恩怨', icon: '∞', group: '人物与势力',
    desc: '专门管理跨越时间的恩情、债务、誓约、血仇、背叛与未完成之事。',
    fields: [
      F('parties','涉及对象'), F('bondType','羁绊类型','select','',['恩情','债务','誓约','血仇','背叛','救命之恩','家族宿怨','共同秘密','宿命联系']),
      F('origin','起源事件','textarea','这份羁绊从何开始。',[],true), F('debt','欠下什么 / 要偿还什么'), F('grievance','无法原谅之处'),
      F('oath','誓言 / 契约内容'), F('evidence','见证物 / 证据'), F('inheritance','是否跨代继承'),
      F('escalation','升级节点','textarea','每次刺激如何让关系更极端。',[],true), F('misunderstanding','误解与隐情'), F('resolution','可能的了结方式','textarea','偿还、复仇、原谅、牺牲、真相。',[],true),
      F('plotUse','剧情用途','textarea','何时爆发，推动哪条剧情线。',[],true)
    ],
    guide: ['羁绊强调“未结算的过去”如何支配现在。','明确债务内容、偿还标准和双方认知差异。','跨代恩怨需要记录继承机制与被篡改的历史。','图谱模式适合绘制复杂的债务与仇恨网络。']
  },
  {
    id: 'plotline', name: '剧情线', icon: '≋', group: '剧情创作',
    desc: '管理主线、支线、感情线、悬疑线和角色线的结构与交汇。',
    fields: [
      F('lineType','剧情线类型','select','',['主线','角色线','感情线','悬疑线','政治线','冒险线','反派线','支线']), F('protagonist','核心角色'), F('objective','目标'), F('stakes','失败代价'),
      F('inciting','触发事件','textarea','迫使角色进入行动。',[],true), F('milestones','关键节点','textarea','按顺序列出升级、反转和选择。',[],true),
      F('midpoint','中点变化'), F('climax','高潮与最终选择','textarea','最难选择与最大代价。',[],true), F('resolution','收束方式'),
      F('mystery','悬念 / 信息释放','textarea','读者何时知道什么。',[],true), F('foreshadow','伏笔与回收'), F('dependencies','与其他剧情线的交叉'),
      F('chapters','涉及章节'), F('statusNote','当前推进状态')
    ],
    guide: ['每条剧情线都要有目标、阻力、升级、高潮与收束。','剧情节点应由角色选择推动，而不仅是外部事件堆积。','标记信息释放时间，防止悬念过早或过晚揭晓。','图谱模式可绘制剧情线之间的交汇与依赖。']
  },
  {
    id: 'story', name: '故事集', icon: '▤', group: '剧情创作',
    desc: '保存短篇、番外、传说、民间故事、历史片段和支线故事提案。',
    fields: [
      F('storyType','故事类型'), F('period','发生时期'), F('location','地点'), F('pov','视角人物 / 叙述方式'), F('cast','主要角色'),
      F('premise','故事梗概','textarea','用一段话说明冲突与变化。',[],true), F('opening','开场画面'), F('structure','结构 / 节拍','textarea','起承转合或场景列表。',[],true),
      F('ending','结局'), F('theme','主题 / 情绪'), F('worldInfo','展示的世界信息'), F('connection','与长篇主线的关联'),
      F('content','正文 / 草稿','textarea','可直接记录故事正文。',[],true)
    ],
    guide: ['故事集可以用来测试世界设定是否自然进入人物生活。','每个故事至少改变一个人物、关系或读者认知。','传说与民间故事不必完全真实，可反映文明偏见。','短篇内容可后续转入稿件库继续扩写。']
  },
  {
    id: 'manuscript', name: '稿件库', icon: '✎', group: '剧情创作',
    desc: '保存章节、场景和片段正文，自动统计字数并关联设定。',
    fields: [
      F('volume','卷 / 部'), F('chapter','章节编号'), F('scene','场景编号'), F('draftStatus','稿件状态','select','',['灵感片段','初稿','修订中','已定稿','已弃用']),
      F('pov','视角'), F('timeline','故事时间'), F('location','场景地点'), F('cast','出场角色'), F('goal','场景目标'),
      F('conflict','场景冲突'), F('change','场景结束后的变化'), F('related','关联剧情线 / 设定'),
      F('content','正文','textarea','在此撰写正文。',[],true), F('revision','修订备注','textarea','问题、待改内容与版本差异。',[],true)
    ],
    guide: ['每个场景明确：谁想要什么、谁阻碍、结果发生什么变化。','章节档案可关联角色、地点、道具和剧情线。','稿件内容会计入总字数统计。','建议定期导出完整备份，避免浏览器数据被清理。']
  },
  {
    id: 'communication', name: '通讯', icon: '✉', group: '剧情创作',
    desc: '记录信件、日记、广播、聊天、密报、公告和跨地域通讯。',
    fields: [
      F('channel','通讯方式'), F('sender','发送者'), F('recipient','接收者'), F('date','时间'), F('location','发送 / 接收地点'),
      F('content','通讯正文','textarea','信件、消息、公告或记录全文。',[],true), F('subtext','潜台词 / 隐瞒'), F('code','密码 / 暗号 / 加密'),
      F('delivery','传递过程','textarea','耗时、信使、截获、损坏。',[],true), F('authenticity','真伪 / 伪造痕迹'), F('consequence','造成的后果'),
      F('related','关联剧情与档案')
    ],
    guide: ['通讯速度和可靠性会改变战争、爱情与阴谋的节奏。','分别记录正文、潜台词、真实意图和接收者理解。','考虑截获、延迟、伪造、误译和缺页。','通讯文本可直接作为小说中的嵌入式材料。']
  },
  {
    id: 'reminders', name: '提醒', icon: '⏰', group: '管理工具',
    desc: '记录设定缺口、修订任务、伏笔回收和写作截止事项。',
    fields: [
      F('due','截止时间','datetime-local'), F('priority','优先级','select','',['低','中','高','紧急']), F('taskType','任务类型','select','',['补设定','查冲突','写稿','修订','伏笔回收','资料核对','备份']),
      F('relatedModule','关联模块'), F('relatedItem','关联档案'), F('repeat','重复规则'), F('done','完成状态','select','',['未完成','进行中','已完成']),
      F('details','任务说明','textarea','需要完成什么，完成标准是什么。',[],true)
    ],
    guide: ['优先记录会阻碍写作或造成逻辑冲突的事项。','提醒数据只在打开本程序时检查，不会上传到网络。','可用“补档案”模块管理更系统的设定缺口。','完成后保留记录，有助于回看世界观建设过程。']
  },
  {
    id: 'stats', name: '统计', icon: '▥', group: '管理工具',
    desc: '自动汇总各模块档案数量、稿件字数、完成状态和最近活动。',
    fields: [],
    guide: ['统计页自动生成，无需手工建立档案。','重点关注“待补充”和“需核对”的设定比例。','稿件字数来自稿件库与故事集的正文。','长期写作前请定期导出备份。']
  },
  {
    id: 'graph', name: '图谱', icon: '⌬', group: '管理工具',
    desc: '建立跨模块知识图谱，自由连接角色、地点、事件、组织、道具与概念。',
    fields: [
      F('nodeType','节点类型'), F('sourceModule','来源模块'), F('sourceItem','来源档案'), F('relations','主要连接'), F('note','图谱说明','textarea','该节点的作用与需要观察的关系。',[],true)
    ],
    guide: ['适合建立跨模块总图，而模块内图谱用于局部关系。','节点名称尽量唯一，并在副标题中写明类型。','边的文字应使用动词，如“效忠”“位于”“导致”。','过大的图谱可按时代、地区或剧情阶段拆分。']
  },
  {
    id: 'language', name: '文字', icon: '文', group: '文明体系',
    desc: '设计语言、文字、命名规律、语音、语法、书写工具和文体。',
    fields: [
      F('languageName','语言 / 文字名称'), F('users','使用族群与地区'), F('family','语系 / 来源'), F('scriptType','文字类型','select','',['表音','音节','表意','混合','符号/结绳','魔法文字']),
      F('glyphImage','字形参考','image','',[],true), F('sounds','语音与音节规则','textarea','常见音、禁音、重音、音变。',[],true),
      F('grammar','语法规则','textarea','语序、时态、数、格、敬语。',[],true), F('writing','书写方向与工具'), F('numbers','数字与标点'),
      F('names','命名规则','textarea','人名、地名、称号和家族名。',[],true), F('vocabulary','核心词汇 / 不可直译概念','textarea','文化特有词与意义。',[],true),
      F('register','方言 / 阶层 / 文体'), F('examples','例句与译文','textarea','保存常用句、诗歌、誓言、铭文。',[],true)
    ],
    guide: ['不必先造完整语言，优先建立一致的命名与发音规律。','语言差异应影响身份判断、阶级、外交和误解。','绘图板可设计字母、符号、印章与碑文。','保留例句可防止后期词义和语法漂移。']
  },
  {
    id: 'calendar', name: '历法', icon: '▣', group: '时空与自然',
    desc: '设计纪元、年月日、星期、季节、节日、闰法和时间换算。',
    fields: [
      F('calendarName','历法名称'), F('era','纪元起点 / 年号'), F('yearLength','一年长度'), F('dayLength','一天长度'), F('week','星期制度'),
      F('months','月份结构','textarea','月份名称、天数和含义。',[],true), F('leap','闰法 / 校准'), F('seasons','季节划分'),
      F('festivals','节日与纪念日','textarea','日期、来源、活动和禁忌。',[],true), F('astronomy','天体依据','textarea','太阳、月亮、双星、潮汐或魔法周期。',[],true),
      F('regional','地区差异'), F('conversion','与其他历法换算'), F('dateFormat','日期书写格式'), F('storyDates','关键剧情日期')
    ],
    guide: ['先确定天文周期，再设计月份和节日。','历法会影响农业、宗教、税收、航海与年龄计算。','多个文明可使用不同纪元，但共享自然季节。','记录日期格式，避免正文中前后不一致。']
  },
  {
    id: 'archive', name: '补档案', icon: '＋', group: '管理工具',
    desc: '集中管理尚未建立、信息不足、彼此冲突或需要查证的设定缺口。',
    fields: [
      F('missingType','缺口类型','select','',['缺少档案','信息不足','设定冲突','待查资料','待画图','待建立关联','待回收伏笔']), F('targetModule','目标模块'), F('targetName','对象名称'),
      F('reason','为什么需要补','textarea','它影响了哪段剧情或哪项逻辑。',[],true), F('known','已知信息','textarea','目前能够确认的内容。',[],true),
      F('questions','待解决问题','textarea','逐条列出需要回答的问题。',[],true), F('source','资料来源 / 参考'), F('priority','优先级','select','',['低','中','高','紧急']),
      F('deadline','截止日期','date'), F('status','补档状态','select','',['未开始','收集中','已补完','暂时搁置']), F('resolution','完成结果','textarea','补到了哪里，关联了哪些档案。',[],true)
    ],
    guide: ['遇到设定空缺时先记下来，不要打断当前写作。','优先处理会影响正在写的章节、核心规则和因果链的缺口。','补完后把结果写入正式模块，并在这里记录关联。','定期筛选“设定冲突”，避免补丁越来越多。']
  }
];

const GROUP_ORDER = ['人物与势力','核心设定','时空与自然','文明体系','剧情创作','管理工具'];
const ROUTES = ['home','library','writing','visual','settings'];
const VISUAL_TYPES = [
  {id:'graph',name:'关系图谱',icon:'⌘',desc:'拖拽角色、组织与地点，梳理关系和阵营。'},
  {id:'timeline',name:'历史时间线',icon:'⌛',desc:'把角色历程和世界大事件放进同一条时间轴。'},
  {id:'map',name:'多层级地图',icon:'⌖',desc:'导入底图，在手机上绘制路线、区域和地点标记。'},
  {id:'calendar',name:'历法换算',icon:'▣',desc:'管理纪元、月份、节日与剧情日期。'},
  {id:'archive',name:'补档助手',icon:'✦',desc:'自动发现空缺设定和需要补充的档案。'}
];
const QUICK_MODULES = ['character','worldOutline','plotline','manuscript','map','relationship','props','story'];

const $ = selector => document.querySelector(selector);
const mainView = $('#mainView');
const sheet = $('#sheet');
const sheetTitle = $('#sheetTitle');
const sheetHint = $('#sheetHint');
const sheetBody = $('#sheetBody');
const sheetFooter = $('#sheetFooter');
const overlay = $('#overlay');
const fullPanel = $('#fullPanel');
const fullTitle = $('#fullTitle');
const fullSubtitle = $('#fullSubtitle');
const fullBody = $('#fullBody');
const fullAction = $('#fullAction');
const globalFileInput = $('#globalFileInput');

let state = null;
let ui = {
  route:'home', moduleId:null, group:'全部', search:'', listMode:'grid', writingTab:'board', visualType:null,
  detail:null, detailTab:'overview', editor:null, mapTool:'pen', mapColor:'#7567f8', activeMapId:null, locked:false
};
let saveTimer = null;
let toastTimer = null;
let currentImageData = '';
let graphDrag = null;
let mapRuntime = {drawing:false,currentStroke:null,canvas:null,ctx:null,dpr:1,bgImage:null};

function uid(prefix='id'){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function nowISO(){ return new Date().toISOString(); }
function formatDate(value){
  if(!value) return '未设置日期';
  const d = new Date(value); if(Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'short',day:'numeric'}).format(d);
}
function escapeHtml(value=''){ return String(value).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
function plainText(html=''){ const d=document.createElement('div'); d.innerHTML=html; return d.textContent||''; }
function sanitizeRich(html=''){
  const tpl=document.createElement('template'); tpl.innerHTML=String(html||'');
  const allowed=new Set(['P','BR','B','STRONG','I','EM','U','H1','H2','H3','UL','OL','LI','BLOCKQUOTE','HR','DIV','SPAN']);
  [...tpl.content.querySelectorAll('*')].forEach(el=>{
    if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return;}
    [...el.attributes].forEach(a=>el.removeAttribute(a.name));
  });
  return tpl.innerHTML;
}
function wordCount(text=''){ const raw=String(text||''); const clean=raw.includes('<')?plainText(raw):raw; return clean.replace(/\s+/g,'').length; }
function hashHue(text=''){ let h=0; for(const c of text) h=(h*31+c.charCodeAt(0))%360; return h; }
function moduleById(id){ return MODULES.find(m=>m.id===id); }
function activeProject(){ return state.projects.find(p=>p.id===state.activeProjectId) || state.projects[0]; }
function projectRecords(moduleId){ return (state.records[moduleId]||[]).filter(r=>r.projectId===state.activeProjectId && !r.deleted); }
function allProjectRecords(){ return MODULES.flatMap(m=>projectRecords(m.id).map(r=>({...r,moduleId:m.id}))); }
function recordTitle(record){ return record?.title?.trim() || '未命名档案'; }
function summaryFor(record,module){
  const candidates = ['pitch','goal','premise','event','description','coreConflict','content','origin','purpose','appearance','process','notes'];
  for(const key of candidates){ const v=record.fields?.[key]; if(v) return plainText(v).slice(0,72); }
  for(const f of module?.fields||[]){ const v=record.fields?.[f.key]; if(v && typeof v==='string') return plainText(v).slice(0,72); }
  return '尚未填写详细设定';
}
function completion(record,module){
  const fields = module?.fields||[]; if(!fields.length) return record.title?100:0;
  let filled = record.title?1:0, total=fields.length+1;
  fields.forEach(f=>{ const v=record.fields?.[f.key]; if(Array.isArray(v)?v.length:Boolean(String(v||'').trim())) filled++; });
  return Math.round(filled/total*100);
}
function totalWords(){ return projectRecords('manuscript').reduce((n,r)=>n+wordCount(r.fields?.content||''),0) + projectRecords('story').reduce((n,r)=>n+wordCount(r.fields?.content||''),0); }
function countRelationships(){ return projectRecords('relationship').length + projectRecords('bonds').length; }
function getRecent(limit=6){ return allProjectRecords().sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,limit); }
function getIncomplete(){ return allProjectRecords().map(r=>({r,m:moduleById(r.moduleId),p:completion(r,moduleById(r.moduleId))})).filter(x=>x.p<55).sort((a,b)=>a.p-b.p); }

function defaultState(){
  const projectId=uid('project');
  return {
    version:2,
    activeProjectId:projectId,
    projects:[{id:projectId,title:'我的第一世界',tagline:'只属于你的私人创作宇宙',cover:'',createdAt:nowISO(),updatedAt:nowISO()}],
    records:Object.fromEntries(MODULES.map(m=>[m.id,[]])),
    graphs:{[projectId]:{positions:{}}},
    maps:{[projectId]:[{id:uid('map'),name:'世界总览',parentId:null,bg:'',strokes:[],pins:[],createdAt:nowISO()}]},
    reminders:[],
    settings:{theme:'light',pinHash:'',autosave:true,showGuide:true},
    recentPrompts:0
  };
}

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME); };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function loadState(){
  try{
    const db=await openDB();
    const value=await new Promise((resolve,reject)=>{ const tx=db.transaction(STORE_NAME,'readonly'); const req=tx.objectStore(STORE_NAME).get(STATE_KEY); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); });
    state=value||defaultState();
  }catch(err){
    console.warn(err);
    try{ state=JSON.parse(localStorage.getItem('worldview-mobile-v2')||'null')||defaultState(); }
    catch(storageErr){ console.warn(storageErr); state=window.__worldviewVolatileState||defaultState(); }
  }
  normalizeState();
}
function normalizeState(){
  state.records ||= {};
  MODULES.forEach(m=>state.records[m.id] ||= []);
  state.projects ||= [];
  if(!state.projects.length){ const d=defaultState(); state.projects=d.projects; state.activeProjectId=d.activeProjectId; }
  state.graphs ||= {}; state.maps ||= {}; state.reminders ||= []; state.settings ||= {theme:'light',pinHash:'',autosave:true,showGuide:true};
  state.graphs[state.activeProjectId] ||= {positions:{}};
  state.maps[state.activeProjectId] ||= [{id:uid('map'),name:'世界总览',parentId:null,bg:'',strokes:[],pins:[],createdAt:nowISO()}];
  ui.activeMapId ||= state.maps[state.activeProjectId][0]?.id;
  ui.locked=Boolean(state.settings.pinHash);
}
async function saveState(immediate=false){
  clearTimeout(saveTimer);
  const run=async()=>{
    try{ const db=await openDB(); await new Promise((resolve,reject)=>{ const tx=db.transaction(STORE_NAME,'readwrite'); tx.objectStore(STORE_NAME).put(state,STATE_KEY); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); }); }
    catch(err){
      console.warn(err);
      try{ localStorage.setItem('worldview-mobile-v2',JSON.stringify(state)); }
      catch(storageErr){ console.warn(storageErr); window.__worldviewVolatileState=state; }
    }
  };
  if(immediate) return run();
  saveTimer=setTimeout(run,180);
}
function showToast(message){ const el=$('#toast'); el.textContent=message; el.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.add('hidden'),1800); }

async function init(){
  await loadState();
  if(navigator.storage?.persist) navigator.storage.persist().catch(()=>{});
  document.documentElement.dataset.theme=state.settings.theme||'light';
  bindGlobalEvents();
  updateProjectHeader();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
}

function bindGlobalEvents(){
  document.querySelectorAll('.nav-tab').forEach(btn=>btn.addEventListener('click',()=>{
    ui.route=btn.dataset.route; ui.moduleId=null; ui.visualType=null; render(); window.scrollTo(0,0);
  }));
  $('#floatingCreate').addEventListener('click',openCreatePicker);
  $('#sheetClose').addEventListener('click',closeSheet); overlay.addEventListener('click',()=>{ closeSheet(); closeFull(); });
  $('#fullBack').addEventListener('click',closeFull);
  $('#projectSwitcher').addEventListener('click',openProjectSwitcher);
  $('#searchOpen').addEventListener('click',openSearch);
  $('#inboxOpen').addEventListener('click',openReminderCenter);
  fullAction.onclick=handleFullAction;
  globalFileInput.addEventListener('change',handleGlobalFile);
  window.addEventListener('beforeunload',()=>saveState(true));
}

function updateProjectHeader(){
  const p=activeProject(); $('#projectTitle').textContent=p.title; $('#projectSubtitle').textContent=p.tagline||'私人创作空间';
  $('#projectOrb').textContent=(p.title||'世').slice(0,1); $('#reminderDot').classList.toggle('hidden',!state.reminders.some(r=>!r.done && (!r.due||new Date(r.due)<=new Date())));
}
function updateNav(){ document.querySelectorAll('.nav-tab').forEach(b=>b.classList.toggle('active',b.dataset.route===(ui.route==='module'?'library':ui.route))); }
function render(){
  updateNav(); updateProjectHeader();
  if(ui.locked){ renderLock(); return; }
  $('#appHeader').classList.remove('hidden'); $('.bottom-nav').classList.remove('hidden'); $('#floatingCreate').classList.remove('hidden');
  if(ui.route==='home') renderHome();
  else if(ui.route==='library') renderLibrary();
  else if(ui.route==='module') renderModule();
  else if(ui.route==='writing') renderWriting();
  else if(ui.route==='visual') renderVisual();
  else renderSettings();
}

function renderLock(){
  $('#appHeader').classList.add('hidden'); $('.bottom-nav').classList.add('hidden'); $('#floatingCreate').classList.add('hidden');
  mainView.innerHTML=`<div class="lock-screen"><div class="lock-box"><div class="lock-icon">⌾</div><h2>世界已上锁</h2><p>输入你设置的本机访问密码。内容仍保存在当前 Safari 的本地数据库中。</p><input class="pin-input" id="unlockPin" type="password" inputmode="numeric" maxlength="12" placeholder="••••"><button class="primary-btn wide" id="unlockBtn">进入创作空间</button></div></div>`;
  $('#unlockBtn').onclick=async()=>{ const hash=await digest($('#unlockPin').value); if(hash===state.settings.pinHash){ui.locked=false;render();}else showToast('密码不正确'); };
}

function renderHome(){
  const recent=getRecent(); const incomplete=getIncomplete(); const records=allProjectRecords(); const p=activeProject();
  const avg=records.length?Math.round(records.reduce((n,r)=>n+completion(r,moduleById(r.moduleId)),0)/records.length):0;
  const promptList=['你的世界里，普通人最害怕哪一种“合法”的权力？','写下主角最不愿承认，却一直影响选择的欲望。','选择一个地点：它白天和夜晚分别属于谁？','哪条世界规则一旦被打破，会让整个秩序崩塌？','给一个重要道具补上三次所有权转移。'];
  const prompt=promptList[(state.recentPrompts||0)%promptList.length];
  mainView.innerHTML=`
    <section class="section">
      <div class="hero-card"><div class="hero-eyebrow">PRIVATE STORY UNIVERSE</div><h1>${escapeHtml(p.title)}</h1><p>${escapeHtml(p.tagline||'把角色、世界与剧情织成一个不会互相矛盾的宇宙。')}</p><div class="hero-actions"><button class="glass-btn solid" data-home-action="continue">继续创作</button><button class="glass-btn" data-home-action="outline">世界总纲</button></div></div>
      <div class="daily-prompt"><div class="prompt-icon">✦</div><div><b>今日灵感问题</b><p>${escapeHtml(prompt)}</p><button data-home-action="nextPrompt">换一个问题</button></div></div>
    </section>
    <section class="section"><div class="metric-strip">
      ${metric('档案总数',records.length,'覆盖 28 个模块')}${metric('正文总字数',totalWords().toLocaleString(),'稿件与故事集')}${metric('世界完成度',avg+'%','按字段完整度估算')}${metric('关系与羁绊',countRelationships(),'人物网络')}
    </div></section>
    <section class="section"><div class="section-title"><div><h2>快速创作</h2><p>从最常用的入口开始</p></div></div><div class="quick-grid">${QUICK_MODULES.slice(0,8).map(id=>{const m=moduleById(id);return `<button class="quick-item" data-create-module="${id}"><span class="quick-icon">${m.icon}</span><b>${m.name}</b></button>`}).join('')}</div></section>
    <section class="section"><div class="section-title"><div><h2>创作工作台</h2><p>设定与正文互相联动</p></div><button class="section-link" data-go="writing">进入创作</button></div><div class="h-scroll">
      ${featureCard('剧情线','把主线、支线与角色弧光放进节拍板','plotline','≋')}
      ${featureCard('关系图谱','可拖拽查看角色、组织与恩怨','graph','⌘')}
      ${featureCard('地图中心','在多层地图上标记城市与路线','map','⌖')}
    </div></section>
    <section class="section"><div class="section-title"><div><h2>最近编辑</h2><p>${recent.length?'继续上一次的思路':'你的创作记录会出现在这里'}</p></div>${recent.length?'<button class="section-link" data-go="library">全部</button>':''}</div>
      ${recent.length?`<div class="recent-list">${recent.map(recentRow).join('')}</div>`:emptyState('还没有档案','从角色、世界总纲或剧情线开始建立第一个档案。','新建第一份档案','create')}
    </section>
    ${incomplete.length?`<section class="section"><div class="section-title"><div><h2>补档提醒</h2><p>优先补齐最薄弱的设定</p></div><button class="section-link" data-visual="archive">查看全部</button></div><div class="recent-list">${incomplete.slice(0,3).map(x=>incompleteRow(x)).join('')}</div></section>`:''}`;
  bindHome();
}
function metric(label,value,note){ return `<div class="metric-card"><small>${label}</small><strong>${value}</strong><em>${note}</em></div>`; }
function featureCard(title,desc,target,icon){ return `<button class="feature-card" data-feature="${target}"><span class="tag">创作模块</span><h3>${title}</h3><p>${desc}</p><span class="feature-art">${icon}</span></button>`; }
function recentRow(r){ const m=moduleById(r.moduleId); const img=r.image||r.fields?.image||''; return `<button class="recent-row" data-open-record="${r.moduleId}|${r.id}"><span class="recent-cover">${img?`<img src="${img}" alt="">`:escapeHtml(recordTitle(r).slice(0,1))}</span><span class="recent-copy"><b>${escapeHtml(recordTitle(r))}</b><small>${m.name} · ${formatDate(r.updatedAt)}</small></span><span class="recent-arrow">›</span></button>`; }
function incompleteRow(x){ return `<button class="recent-row" data-open-record="${x.r.moduleId}|${x.r.id}"><span class="recent-cover" style="background:linear-gradient(145deg,hsl(${hashHue(x.r.title)} 70% 62%),hsl(${(hashHue(x.r.title)+45)%360} 72% 72%))">${escapeHtml(recordTitle(x.r).slice(0,1))}</span><span class="recent-copy"><b>${escapeHtml(recordTitle(x.r))}</b><small>${x.m.name} · 完整度 ${x.p}%</small></span><span class="recent-arrow">›</span></button>`; }
function emptyState(title,desc,button,action){ return `<div class="empty-state"><div class="empty-orb">✦</div><h3>${title}</h3><p>${desc}</p><button class="primary-btn" data-empty-action="${action}">${button}</button></div>`; }
function bindHome(){
  mainView.querySelectorAll('[data-create-module]').forEach(b=>b.onclick=()=>openEditor(b.dataset.createModule));
  mainView.querySelectorAll('[data-open-record]').forEach(b=>b.onclick=()=>{const [m,id]=b.dataset.openRecord.split('|');openDetail(m,id)});
  mainView.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{ui.route=b.dataset.go;render()});
  mainView.querySelectorAll('[data-feature]').forEach(b=>{b.onclick=()=>{const t=b.dataset.feature;if(t==='plotline'){ui.route='module';ui.moduleId='plotline'}else{ui.route='visual';ui.visualType=t}render();}});
  mainView.querySelectorAll('[data-visual]').forEach(b=>b.onclick=()=>{ui.route='visual';ui.visualType=b.dataset.visual;render()});
  mainView.querySelectorAll('[data-empty-action="create"]').forEach(b=>b.onclick=openCreatePicker);
  mainView.querySelector('[data-home-action="continue"]')?.addEventListener('click',()=>{const r=getRecent(1)[0];r?openDetail(r.moduleId,r.id):openCreatePicker()});
  mainView.querySelector('[data-home-action="outline"]')?.addEventListener('click',()=>{ui.route='module';ui.moduleId='worldOutline';render()});
  mainView.querySelector('[data-home-action="nextPrompt"]')?.addEventListener('click',()=>{state.recentPrompts=(state.recentPrompts||0)+1;saveState();renderHome()});
}

function renderLibrary(){
  const groups=['全部',...GROUP_ORDER.filter(g=>MODULES.some(m=>m.group===g))];
  const list=MODULES.filter(m=>ui.group==='全部'||m.group===ui.group).filter(m=>!ui.search||`${m.name}${m.desc}`.includes(ui.search));
  mainView.innerHTML=`<div class="page-banner"><h1>设定宇宙</h1><p>不是孤立的表格。每份档案都能关联角色、地点、组织、时间与剧情。</p></div>
  <div class="search-bar"><span>⌕</span><input id="librarySearch" value="${escapeHtml(ui.search)}" placeholder="搜索模块或设定"><button id="libraryClear">${ui.search?'清除':'筛选'}</button></div>
  <div class="chip-row">${groups.map(g=>`<button class="chip ${ui.group===g?'active':''}" data-group="${g}">${g}</button>`).join('')}</div>
  <div class="module-grid">${list.map(moduleCard).join('')}</div>`;
  $('#librarySearch').oninput=e=>{ui.search=e.target.value;renderLibrary()}; $('#libraryClear').onclick=()=>{ui.search='';renderLibrary()};
  mainView.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{ui.group=b.dataset.group;renderLibrary()});
  mainView.querySelectorAll('[data-module]').forEach(b=>b.onclick=()=>{ui.route='module';ui.moduleId=b.dataset.module;ui.search='';render();window.scrollTo(0,0)});
}
function moduleCard(m){ const count=projectRecords(m.id).length; return `<button class="module-card" data-module="${m.id}"><span class="module-icon">${m.icon}</span><span class="module-count">${count}</span><h3>${m.name}</h3><p>${m.desc}</p></button>`; }

function renderModule(){
  const m=moduleById(ui.moduleId)||MODULES[0]; const records=projectRecords(m.id).filter(r=>!ui.search||JSON.stringify(r).toLowerCase().includes(ui.search.toLowerCase()));
  if(['stats','archive'].includes(m.id)){ ui.route='visual';ui.visualType=m.id;renderVisual();return; }
  if(m.id==='map'){ui.route='visual';ui.visualType='map';renderVisual();return;}
  if(m.id==='graph'){ui.route='visual';ui.visualType='graph';renderVisual();return;}
  mainView.innerHTML=`<button class="section-link" id="backLibrary">‹ 返回设定宇宙</button><div class="page-banner"><h1>${m.icon} ${m.name}</h1><p>${m.desc}</p></div>
  ${state.settings.showGuide?`<div class="daily-prompt"><div class="prompt-icon">?</div><div><b>搭建提示</b><p>${escapeHtml((m.guide||[])[0]||'从最影响剧情的部分开始填写。')}</p><button id="showGuide">查看完整清单</button></div></div>`:''}
  <div class="search-bar" style="margin-top:14px"><span>⌕</span><input id="moduleSearch" value="${escapeHtml(ui.search)}" placeholder="搜索${m.name}"><button id="moduleAdd">＋ 新建</button></div>
  <div class="library-head"><h2>${records.length} 份档案</h2><div class="view-toggle"><button data-mode="grid" class="${ui.listMode==='grid'?'active':''}">▦</button><button data-mode="list" class="${ui.listMode==='list'?'active':''}">☷</button></div></div>
  ${records.length?`<div class="${ui.listMode==='grid'?'record-grid':'record-list'}">${records.map(r=>recordCard(r,m)).join('')}</div>`:emptyState(`还没有${m.name}`,`建立第一份${m.name}档案，之后可以从角色、剧情、地图和图谱中互相引用。`,'新建档案','new-module')}`;
  $('#backLibrary').onclick=()=>{ui.route='library';ui.moduleId=null;render()}; $('#moduleAdd').onclick=()=>openEditor(m.id);
  $('#moduleSearch').oninput=e=>{ui.search=e.target.value;renderModule()};
  mainView.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ui.listMode=b.dataset.mode;renderModule()});
  mainView.querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>openDetail(m.id,b.dataset.record));
  mainView.querySelector('[data-empty-action="new-module"]')?.addEventListener('click',()=>openEditor(m.id));
  $('#showGuide')?.addEventListener('click',()=>openGuide(m));
}
function recordCard(r,m){
  const img=r.image||r.fields?.image||''; const tags=(r.tags||[]).slice(0,3); const p=completion(r,m);
  return `<button class="record-card" data-record="${r.id}"><div class="record-image">${img?`<img src="${img}" alt="">`:`<span style="color:hsl(${hashHue(r.title)} 58% 56%)">${m.icon}</span>`}</div><span class="favorite-mark">${r.favorite?'♥':'♡'}</span><div class="record-body"><h3>${escapeHtml(recordTitle(r))}</h3><p>${escapeHtml(summaryFor(r,m))}</p><div class="record-tags">${tags.map(t=>`<span class="mini-tag">${escapeHtml(t)}</span>`).join('')}${!tags.length?`<span class="mini-tag">完整度 ${p}%</span>`:''}</div></div></button>`;
}

function renderWriting(){
  const tabs=[['board','剧情板'],['manuscripts','稿件库'],['stories','故事集'],['focus','专注写作']];
  let body='';
  if(ui.writingTab==='board') body=renderPlotBoard();
  else if(ui.writingTab==='manuscripts') body=renderWritingRecords('manuscript');
  else if(ui.writingTab==='stories') body=renderWritingRecords('story');
  else body=renderFocusStart();
  mainView.innerHTML=`<div class="page-banner"><h1>创作中心</h1><p>剧情线、场景、章节和正文共同推进。改动设定时，可以立即回到关联稿件。</p></div><div class="subnav">${tabs.map(([id,n])=>`<button data-writing-tab="${id}" class="${ui.writingTab===id?'active':''}">${n}</button>`).join('')}</div>${body}`;
  mainView.querySelectorAll('[data-writing-tab]').forEach(b=>b.onclick=()=>{ui.writingTab=b.dataset.writingTab;renderWriting()});
  mainView.querySelectorAll('[data-plot]').forEach(b=>b.onclick=()=>openDetail('plotline',b.dataset.plot));
  mainView.querySelectorAll('[data-writing-record]').forEach(b=>b.onclick=()=>openDetail(b.dataset.module,b.dataset.writingRecord));
  mainView.querySelectorAll('[data-writing-new]').forEach(b=>b.onclick=()=>openEditor(b.dataset.writingNew));
  mainView.querySelectorAll('[data-focus-record]').forEach(b=>b.onclick=()=>openRichEditor(b.dataset.focusRecord));
}
function renderPlotBoard(){
  const lines=projectRecords('plotline'); const statuses=['灵感','构思中','推进中','待回收','已完成'];
  const groups=Object.fromEntries(statuses.map(s=>[s,[]]));
  lines.forEach(r=>{let s=r.status||'构思中';if(s==='待补充')s='推进中';if(s==='已确认')s='已完成';if(!groups[s])s='构思中';groups[s].push(r)});
  return `<div class="section-title"><div><h2>剧情节拍板</h2><p>横向滑动查看不同阶段</p></div><button class="section-link" data-writing-new="plotline">＋ 新建剧情线</button></div><div class="board">${statuses.map(s=>`<section class="board-column"><div class="board-head"><b>${s}</b><span>${groups[s].length}</span></div>${groups[s].length?groups[s].map(r=>`<button class="plot-card wide" data-plot="${r.id}"><h4>${escapeHtml(recordTitle(r))}</h4><p>${escapeHtml(r.fields?.objective||r.fields?.premise||'尚未填写剧情目标')}</p><div class="plot-meta"><span>${escapeHtml(r.fields?.lineType||'剧情线')}</span><span>${completion(r,moduleById('plotline'))}%</span></div></button>`).join(''):`<div class="plot-card"><p>暂无卡片</p></div>`}</section>`).join('')}</div>`;
}
function renderWritingRecords(moduleId){ const m=moduleById(moduleId); const list=projectRecords(moduleId); return `<div class="section-title"><div><h2>${m.name}</h2><p>${moduleId==='manuscript'?totalWords().toLocaleString()+' 字':'短篇、番外与世界传说'}</p></div><button class="section-link" data-writing-new="${moduleId}">＋ 新建</button></div>${list.length?`<div class="recent-list">${list.map(r=>`<button class="recent-row" data-writing-record="${r.id}" data-module="${moduleId}"><span class="recent-cover">${m.icon}</span><span class="recent-copy"><b>${escapeHtml(recordTitle(r))}</b><small>${escapeHtml(r.fields?.draftStatus||r.fields?.storyType||'草稿')} · ${wordCount(r.fields?.content||'')} 字</small></span><span class="recent-arrow">›</span></button>`).join('')}</div>`:emptyState(`还没有${m.name}`,m.desc,'新建','new-writing').replace('data-empty-action="new-writing"',`data-writing-new="${moduleId}"`)}`; }
function renderFocusStart(){ const list=projectRecords('manuscript'); const latest=list.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)); return `<div class="editor-card"><h3>沉浸式正文编辑</h3><p>隐藏复杂设定，只保留正文、字数和自动保存。写作时仍可从侧栏查看关联角色与场景。</p><div class="progress-line"><i style="width:${Math.min(100,totalWords()/500)}%"></i></div><div class="editor-actions"><button class="secondary-btn" data-writing-new="manuscript">新建章节</button>${latest[0]?`<button class="primary-btn" data-focus-record="${latest[0].id}">继续写作</button>`:`<button class="primary-btn" data-writing-new="manuscript">开始写作</button>`}</div></div>${latest.length?`<div class="section" style="margin-top:18px"><div class="section-title"><div><h2>最近稿件</h2></div></div><div class="recent-list">${latest.slice(0,5).map(r=>`<button class="recent-row" data-focus-record="${r.id}"><span class="recent-cover">✎</span><span class="recent-copy"><b>${escapeHtml(recordTitle(r))}</b><small>${wordCount(r.fields?.content||'')} 字 · ${formatDate(r.updatedAt)}</small></span><span class="recent-arrow">›</span></button>`).join('')}</div></div>`:''}`; }

function renderVisual(){
  $('#floatingCreate').classList.toggle('hidden',Boolean(ui.visualType));
  if(!ui.visualType){
    mainView.innerHTML=`<div class="page-banner"><h1>可视化中心</h1><p>把复杂设定变成可以拖动、绘制和按时间查看的结构。</p></div><div class="visual-menu">${VISUAL_TYPES.map(v=>`<button class="visual-card" data-visual-open="${v.id}"><span class="module-icon">${v.icon}</span><span><b>${v.name}</b><p>${v.desc}</p></span><span class="recent-arrow">›</span></button>`).join('')}</div>`;
    mainView.querySelectorAll('[data-visual-open]').forEach(b=>b.onclick=()=>{ui.visualType=b.dataset.visualOpen;renderVisual()}); return;
  }
  if(ui.visualType==='graph') renderGraph();
  else if(ui.visualType==='map') renderMap();
  else if(ui.visualType==='timeline') renderTimeline();
  else if(ui.visualType==='calendar') renderCalendarVisual();
  else if(ui.visualType==='stats') renderStatsVisual();
  else renderArchiveVisual();
}
function visualBackBanner(title,desc){ return `<button class="section-link" id="visualBack">‹ 返回可视化中心</button><div class="page-banner"><h1>${title}</h1><p>${desc}</p></div>`; }
function bindVisualBack(){ $('#visualBack')?.addEventListener('click',()=>{ui.visualType=null;renderVisual()}); }
function renderTimeline(){
  const journey=projectRecords('journey').map(r=>({...r,moduleId:'journey',date:r.fields?.startDate||r.fields?.date||r.createdAt}));
  const world=projectRecords('worldPlot').map(r=>({...r,moduleId:'worldPlot',date:r.fields?.date||r.createdAt})); const items=[...journey,...world].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  mainView.innerHTML=visualBackBanner('历史时间线','角色经历、世界事件和时代变迁会按日期排列。')+`<div class="chip-row"><button class="chip active">全部事件</button><button class="chip">角色历程 ${journey.length}</button><button class="chip">世界剧情 ${world.length}</button></div>${items.length?`<div class="timeline">${items.map(r=>`<button class="timeline-item wide" data-time-record="${r.moduleId}|${r.id}"><div class="timeline-card"><time>${escapeHtml(r.date||'未定时间')}</time><h4>${escapeHtml(recordTitle(r))}</h4><p>${escapeHtml(summaryFor(r,moduleById(r.moduleId)))}</p></div></button>`).join('')}</div>`:emptyState('时间线还是空的','在“角色历程”或“世界剧情”中填写日期，事件会自动汇总到这里。','新建世界事件','timeline-new')}`;
  bindVisualBack(); mainView.querySelectorAll('[data-time-record]').forEach(b=>b.onclick=()=>{const [m,id]=b.dataset.timeRecord.split('|');openDetail(m,id)}); mainView.querySelector('[data-empty-action="timeline-new"]')?.addEventListener('click',()=>openEditor('worldPlot'));
}
function renderStatsVisual(){
  const records=allProjectRecords(); const byGroup=GROUP_ORDER.map(g=>({g,n:records.filter(r=>moduleById(r.moduleId)?.group===g).length})); const most=[...MODULES].map(m=>({m,n:projectRecords(m.id).length})).sort((a,b)=>b.n-a.n).slice(0,6);
  mainView.innerHTML=visualBackBanner('创作统计','统计只在本机计算，不会上传正文。')+`<div class="metric-strip">${metric('总档案',records.length,'当前世界')}${metric('总字数',totalWords().toLocaleString(),'正文内容')}${metric('角色',projectRecords('character').length,'角色库')}${metric('提醒',state.reminders.filter(r=>!r.done).length,'未完成')}</div><section class="section"><div class="section-title"><div><h2>模块分布</h2></div></div><div class="setting-group">${byGroup.map(x=>`<div class="setting-row"><span class="setting-icon">▦</span><span style="flex:1"><b>${x.g}</b><small>${x.n} 份档案</small></span><strong>${records.length?Math.round(x.n/records.length*100):0}%</strong></div>`).join('')}</div></section><section class="section"><div class="section-title"><div><h2>最常使用</h2></div></div><div class="recent-list">${most.map(x=>`<button class="recent-row" data-stat-module="${x.m.id}"><span class="recent-cover">${x.m.icon}</span><span class="recent-copy"><b>${x.m.name}</b><small>${x.n} 份档案</small></span><span class="recent-arrow">›</span></button>`).join('')}</div></section>`;
  bindVisualBack(); mainView.querySelectorAll('[data-stat-module]').forEach(b=>b.onclick=()=>{ui.route='module';ui.moduleId=b.dataset.statModule;ui.visualType=null;render()});
}
function renderArchiveVisual(){
  const list=getIncomplete();
  mainView.innerHTML=visualBackBanner('补档助手','按完整度发现缺失设定，避免写到后期才发现逻辑空洞。')+`${list.length?`<div class="recent-list">${list.map(x=>`<button class="recent-row" data-archive="${x.r.moduleId}|${x.r.id}"><span class="recent-cover">${x.m.icon}</span><span class="recent-copy"><b>${escapeHtml(recordTitle(x.r))}</b><small>${x.m.name} · 完整度 ${x.p}% · 还缺 ${Math.max(1,x.m.fields.length-Math.round(x.m.fields.length*x.p/100))} 项</small></span><span class="recent-arrow">›</span></button>`).join('')}</div>`:emptyState('当前档案很完整','所有档案的填写完整度都已超过 55%。','继续新建设定','archive-new')}`;
  bindVisualBack(); mainView.querySelectorAll('[data-archive]').forEach(b=>b.onclick=()=>{const [m,id]=b.dataset.archive.split('|');openEditor(m,id)}); mainView.querySelector('[data-empty-action="archive-new"]')?.addEventListener('click',openCreatePicker);
}
function renderCalendarVisual(){
  const calendars=projectRecords('calendar');
  mainView.innerHTML=visualBackBanner('历法中心','建立纪元、月份、星期、节日和日期换算规则。')+`<div class="daily-prompt"><div class="prompt-icon">▣</div><div><b>日期设计原则</b><p>先确定一天、一年和季节，再设计月份与节日。剧情日期应能映射到天气、年龄和历史事件。</p><button data-calendar-new>建立历法</button></div></div><div style="margin-top:14px">${calendars.length?`<div class="record-grid">${calendars.map(r=>recordCard(r,moduleById('calendar'))).join('')}</div>`:emptyState('还没有自定义历法','建立一套历法后，角色出生、世界事件和稿件场景都可引用统一日期。','新建历法','calendar-new')}</div>`;
  bindVisualBack(); mainView.querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>openDetail('calendar',b.dataset.record)); mainView.querySelectorAll('[data-calendar-new],[data-empty-action="calendar-new"]').forEach(b=>b.onclick=()=>openEditor('calendar'));
}

function renderGraph(){
  const chars=projectRecords('character'); const orgs=projectRecords('organization'); const rels=projectRecords('relationship'); const graph=state.graphs[state.activeProjectId]||{positions:{}}; state.graphs[state.activeProjectId]=graph;
  const nodes=[...chars.map(r=>({id:`character:${r.id}`,label:recordTitle(r),kind:'character',record:r})),...orgs.map(r=>({id:`organization:${r.id}`,label:recordTitle(r),kind:'organization',record:r}))];
  const w=Math.max(window.innerWidth,390),h=Math.max(window.innerHeight-174,520);
  nodes.forEach((n,i)=>{ if(!graph.positions[n.id]){ const a=i/Math.max(1,nodes.length)*Math.PI*2; graph.positions[n.id]={x:w/2+Math.cos(a)*Math.min(130,w*.32),y:h/2+Math.sin(a)*170}; }});
  const findNodeByName=name=>nodes.find(n=>n.label===name||n.record.fields?.aliases?.includes(name));
  const edges=rels.map(r=>{const a=findNodeByName(r.fields?.partyA),b=findNodeByName(r.fields?.partyB);return a&&b?{a,b,label:r.fields?.relationType||'关系',record:r}:null}).filter(Boolean);
  mainView.innerHTML=`${visualBackBanner('关系图谱','拖动节点调整布局；关系档案会自动生成连线。')}<div class="graph-wrap" id="graphWrap"><svg class="graph-svg" id="graphSvg" viewBox="0 0 ${w} ${h}">${edges.map(e=>{const a=graph.positions[e.a.id],b=graph.positions[e.b.id],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;return `<g><line class="graph-edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line><text class="graph-label" x="${mx}" y="${my-5}" text-anchor="middle">${escapeHtml(e.label)}</text></g>`}).join('')}${nodes.map(n=>{const p=graph.positions[n.id];return `<g class="graph-node" data-node="${n.id}" transform="translate(${p.x},${p.y})"><circle r="31"></circle><text y="4">${escapeHtml(n.label.slice(0,6))}</text><text y="48" style="font-size:9px;fill:#8c879a">${n.kind==='character'?'角色':'组织'}</text></g>`}).join('')}</svg><div class="graph-tools"><button data-graph-action="relationship">＋ 添加关系</button><button data-graph-action="character">＋ 角色</button><button data-graph-action="organization">＋ 组织</button><button data-graph-action="auto">自动排布</button></div></div>`;
  bindVisualBack(); bindGraph(nodes,graph,w,h); mainView.querySelectorAll('[data-graph-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.graphAction;if(a==='auto'){Object.keys(graph.positions).forEach((id,i,arr)=>{const ang=i/arr.length*Math.PI*2;graph.positions[id]={x:w/2+Math.cos(ang)*Math.min(135,w*.32),y:h/2+Math.sin(ang)*170}});saveState();renderGraph()}else openEditor(a==='relationship'?'relationship':a)});
}
function bindGraph(nodes,graph,w,h){
  const svg=$('#graphSvg'); if(!svg)return;
  svg.querySelectorAll('.graph-node').forEach(node=>{
    node.addEventListener('pointerdown',e=>{e.preventDefault();node.setPointerCapture(e.pointerId);graphDrag={id:node.dataset.node,pointerId:e.pointerId,moved:false};});
    node.addEventListener('pointermove',e=>{if(!graphDrag||graphDrag.id!==node.dataset.node)return;graphDrag.moved=true;const rect=svg.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*w,y=(e.clientY-rect.top)/rect.height*h;graph.positions[graphDrag.id]={x:Math.max(35,Math.min(w-35,x)),y:Math.max(35,Math.min(h-55,y))};node.setAttribute('transform',`translate(${graph.positions[graphDrag.id].x},${graph.positions[graphDrag.id].y})`);});
    node.addEventListener('pointerup',e=>{if(!graphDrag)return;const moved=graphDrag.moved;const id=graphDrag.id;graphDrag=null;saveState();if(!moved){const [m,rid]=id.split(':');openDetail(m,rid)}else renderGraph();});
  });
}

function currentMap(){ const maps=state.maps[state.activeProjectId]||[]; return maps.find(m=>m.id===ui.activeMapId)||maps[0]; }
function renderMap(){
  const maps=state.maps[state.activeProjectId]||[]; if(!ui.activeMapId)ui.activeMapId=maps[0]?.id; const map=currentMap();
  mainView.innerHTML=`${visualBackBanner('地图中心','支持多层级地图、导入底图、触摸绘制路线和添加地点。')}<div class="map-wrap" id="mapWrap"><canvas id="mapCanvas" class="map-canvas"></canvas><div class="map-levels">${maps.map(m=>`<button data-map-level="${m.id}" class="${m.id===map.id?'active':''}">${escapeHtml(m.name)}</button>`).join('')}<button data-map-action="addLevel">＋ 地图</button></div><div class="map-toolbar"><button data-map-tool="pen" class="${ui.mapTool==='pen'?'active':''}">画笔</button><button data-map-tool="pin" class="${ui.mapTool==='pin'?'active':''}">地点</button><button data-map-tool="eraser" class="${ui.mapTool==='eraser'?'active':''}">橡皮</button><label>导入底图<input id="mapBgInput" type="file" accept="image/*" hidden></label><button data-map-action="undo">撤销</button><button data-map-action="export">导出图</button></div></div>`;
  bindVisualBack(); initMapCanvas(map);
  mainView.querySelectorAll('[data-map-level]').forEach(b=>b.onclick=()=>{ui.activeMapId=b.dataset.mapLevel;renderMap()});
  mainView.querySelectorAll('[data-map-tool]').forEach(b=>b.onclick=()=>{ui.mapTool=b.dataset.mapTool;renderMap()});
  mainView.querySelectorAll('[data-map-action]').forEach(b=>b.onclick=()=>handleMapAction(b.dataset.mapAction,map));
  $('#mapBgInput').onchange=e=>{const file=e.target.files[0];if(!file)return;fileToDataURL(file).then(data=>{map.bg=data;saveState();renderMap()})};
}
function initMapCanvas(map){
  const canvas=$('#mapCanvas'),wrap=$('#mapWrap'); if(!canvas||!wrap)return; const rect=wrap.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio||1,2); canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);mapRuntime={drawing:false,currentStroke:null,canvas,ctx,dpr,bgImage:null};
  const redraw=()=>drawMap(map,rect.width,rect.height); if(map.bg){const img=new Image();img.onload=()=>{mapRuntime.bgImage=img;redraw()};img.src=map.bg}else redraw();
  canvas.addEventListener('pointerdown',e=>mapPointerDown(e,map,rect));canvas.addEventListener('pointermove',e=>mapPointerMove(e,map,rect));canvas.addEventListener('pointerup',e=>mapPointerUp(e,map,rect));canvas.addEventListener('pointercancel',e=>mapPointerUp(e,map,rect));
}
function drawMap(map,w,h){const {ctx,bgImage}=mapRuntime;if(!ctx)return;ctx.clearRect(0,0,w,h);ctx.fillStyle='#e9e5da';ctx.fillRect(0,0,w,h);if(bgImage){const scale=Math.max(w/bgImage.width,h/bgImage.height),dw=bgImage.width*scale,dh=bgImage.height*scale;ctx.drawImage(bgImage,(w-dw)/2,(h-dh)/2,dw,dh)};(map.strokes||[]).forEach(s=>drawStroke(ctx,s,w,h));(map.pins||[]).forEach(p=>{const x=p.x*w,y=p.y*h;ctx.fillStyle='#e85f78';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();ctx.font='600 12px -apple-system';ctx.fillStyle='#322f40';ctx.fillText(p.name,x+10,y+4)});}
function drawStroke(ctx,s,w,h){if(!s.points?.length)return;ctx.strokeStyle=s.color||'#7567f8';ctx.lineWidth=s.width||3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();s.points.forEach((p,i)=>{const x=p.x*w,y=p.y*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();}
function pointFromEvent(e,rect){return{x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};}
function mapPointerDown(e,map,rect){e.preventDefault();mapRuntime.canvas.setPointerCapture(e.pointerId);const p=pointFromEvent(e,rect);if(ui.mapTool==='pin'){const name=prompt('地点名称');if(name){map.pins.push({id:uid('pin'),name,x:p.x,y:p.y});saveState();drawMap(map,rect.width,rect.height)}return}if(ui.mapTool==='eraser'){eraseNearest(map,p);saveState();drawMap(map,rect.width,rect.height);return}mapRuntime.drawing=true;mapRuntime.currentStroke={id:uid('stroke'),color:ui.mapColor,width:3,points:[p]};map.strokes.push(mapRuntime.currentStroke);}
function mapPointerMove(e,map,rect){if(!mapRuntime.drawing||!mapRuntime.currentStroke)return;mapRuntime.currentStroke.points.push(pointFromEvent(e,rect));drawMap(map,rect.width,rect.height);}
function mapPointerUp(e,map,rect){if(!mapRuntime.drawing)return;mapRuntime.drawing=false;mapRuntime.currentStroke=null;saveState();drawMap(map,rect.width,rect.height);}
function eraseNearest(map,p){let best=null;(map.strokes||[]).forEach((s,si)=>s.points.forEach(pt=>{const d=(pt.x-p.x)**2+(pt.y-p.y)**2;if(!best||d<best.d)best={si,d}}));if(best&&best.d<.012)map.strokes.splice(best.si,1);else{let pinBest=null;(map.pins||[]).forEach((x,i)=>{const d=(x.x-p.x)**2+(x.y-p.y)**2;if(!pinBest||d<pinBest.d)pinBest={i,d}});if(pinBest&&pinBest.d<.01)map.pins.splice(pinBest.i,1)}}
function handleMapAction(action,map){if(action==='addLevel'){const name=prompt('新地图名称，例如“北境”“王都”“学院一层”');if(name){state.maps[state.activeProjectId].push({id:uid('map'),name,parentId:map.id,bg:'',strokes:[],pins:[],createdAt:nowISO()});ui.activeMapId=state.maps[state.activeProjectId].at(-1).id;saveState();renderMap()}}else if(action==='undo'){if(map.strokes.length)map.strokes.pop();else if(map.pins.length)map.pins.pop();saveState();renderMap()}else if(action==='export'){const a=document.createElement('a');a.download=`${map.name}.png`;a.href=mapRuntime.canvas.toDataURL('image/png');a.click();}}

function renderSettings(){
  const p=activeProject();
  mainView.innerHTML=`<div class="profile-card"><div class="profile-avatar">${escapeHtml(p.title.slice(0,1))}</div><div><b>${escapeHtml(p.title)}</b><small>本机离线创作空间 · ${allProjectRecords().length} 份档案</small></div></div>
  <div class="setting-group"><button class="setting-row" data-setting="project"><span class="setting-icon">✦</span><span><b>作品与世界管理</b><small>新建、切换、重命名多个世界</small></span><span class="recent-arrow">›</span></button><button class="setting-row" data-setting="stats"><span class="setting-icon">▥</span><span><b>创作统计</b><small>字数、档案与模块完整度</small></span><span class="recent-arrow">›</span></button><button class="setting-row" data-setting="reminders"><span class="setting-icon">◌</span><span><b>提醒中心</b><small>${state.reminders.filter(r=>!r.done).length} 项未完成</small></span><span class="recent-arrow">›</span></button></div>
  <div class="setting-group"><button class="setting-row" data-setting="export"><span class="setting-icon">⇧</span><span><b>导出完整备份</b><small>JSON 文件，可迁移到另一台设备</small></span><span class="recent-arrow">›</span></button><button class="setting-row" data-setting="encrypted"><span class="setting-icon">⌾</span><span><b>导出加密备份</b><small>AES 加密，需密码才能恢复</small></span><span class="recent-arrow">›</span></button><button class="setting-row" data-setting="import"><span class="setting-icon">⇩</span><span><b>导入与恢复</b><small>支持普通或加密备份</small></span><span class="recent-arrow">›</span></button></div>
  <div class="setting-group"><button class="setting-row" data-setting="pin"><span class="setting-icon">●</span><span><b>本机访问锁</b><small>${state.settings.pinHash?'已开启':'未开启'}，防止他人直接打开</small></span><span class="recent-arrow">›</span></button><button class="setting-row" data-setting="theme"><span class="setting-icon">◐</span><span><b>外观模式</b><small>${state.settings.theme==='dark'?'深色':'浅色'}模式</small></span><span class="recent-arrow">›</span></button><button class="setting-row" data-setting="install"><span class="setting-icon">□</span><span><b>添加到 iPhone 主屏幕</b><small>像普通 App 一样全屏离线使用</small></span><span class="recent-arrow">›</span></button></div>
  <div class="setting-group"><button class="setting-row" data-setting="clear"><span class="setting-icon" style="color:var(--danger);background:#fff0f3">×</span><span><b>清空当前世界</b><small>删除当前作品中的所有档案与绘图</small></span><span class="recent-arrow">›</span></button></div>`;
  mainView.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>handleSetting(b.dataset.setting));
}
async function handleSetting(action){
  if(action==='project')openProjectSwitcher();
  else if(action==='stats'){ui.route='visual';ui.visualType='stats';render()}
  else if(action==='reminders')openReminderCenter();
  else if(action==='export')downloadJSON(state,`世界观工坊-${activeProject().title}-${new Date().toISOString().slice(0,10)}.json`);
  else if(action==='encrypted')exportEncrypted();
  else if(action==='import'){globalFileInput.accept='.json,application/json';globalFileInput.dataset.mode='import';globalFileInput.click();}
  else if(action==='pin')setPin();
  else if(action==='theme'){state.settings.theme=state.settings.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.settings.theme;saveState();renderSettings()}
  else if(action==='install')openInstallHelp();
  else if(action==='clear'){if(confirm(`确定清空“${activeProject().title}”中的全部档案、地图和图谱吗？此操作不可撤销。`)){MODULES.forEach(m=>state.records[m.id]=state.records[m.id].filter(r=>r.projectId!==state.activeProjectId));state.maps[state.activeProjectId]=[{id:uid('map'),name:'世界总览',parentId:null,bg:'',strokes:[],pins:[],createdAt:nowISO()}];state.graphs[state.activeProjectId]={positions:{}};saveState();showToast('当前世界已清空');renderSettings()}}
}

function openCreatePicker(){
  sheetTitle.textContent='新建创作内容'; sheetHint.textContent='先选择要建立的档案类型';
  const frequent=QUICK_MODULES.map(moduleById); const grouped=GROUP_ORDER.map(g=>({g,items:MODULES.filter(m=>m.group===g&&!QUICK_MODULES.includes(m.id)&&!['stats','graph','archive'].includes(m.id))})).filter(x=>x.items.length);
  sheetBody.innerHTML=`<div class="create-heading"><h3>常用</h3><small>最适合手机快速记录</small></div><div class="create-types">${frequent.map(createType).join('')}</div>${grouped.map(x=>`<div class="create-heading"><h3>${x.g}</h3><small>${x.items.length} 个模块</small></div><div class="create-types">${x.items.map(createType).join('')}</div>`).join('')}`;
  sheetFooter.classList.add('hidden');openSheet();sheetBody.querySelectorAll('[data-create-pick]').forEach(b=>b.onclick=()=>{closeSheet(); if(b.dataset.createPick==='map'){ui.route='visual';ui.visualType='map';render()}else openEditor(b.dataset.createPick)});
}
function createType(m){return `<button class="create-type" data-create-pick="${m.id}"><span class="module-icon">${m.icon}</span><b>${m.name}</b></button>`;}

function openEditor(moduleId,recordId=null){
  const m=moduleById(moduleId); const existing=recordId?projectRecords(moduleId).find(r=>r.id===recordId):null;
  ui.editor={moduleId,recordId};currentImageData=existing?.image||existing?.fields?.image||'';
  sheetTitle.textContent=existing?`编辑${m.name}`:`新建${m.name}`;sheetHint.textContent=m.desc;
  const title=existing?.title||'';const status=existing?.status||'构思中';const tags=existing?.tags||[];
  const coreFields=m.fields.slice(0,Math.min(6,m.fields.length)),moreFields=m.fields.slice(coreFields.length);
  sheetBody.innerHTML=`<form id="mobileRecordForm"><section class="form-section"><h3>基础信息 <small>必填</small></h3><div class="form-grid"><div class="form-field"><label>档案名称</label><input name="title" required maxlength="120" value="${escapeHtml(title)}" placeholder="给这份设定一个清楚的名称"></div><div class="form-field"><label>状态</label><select name="status">${baseStatuses.map(s=>`<option ${s===status?'selected':''}>${s}</option>`).join('')}</select></div><div class="form-field"><label>标签</label><div class="tag-editor" id="tagEditor">${tags.map(t=>`<span class="tag-token" data-tag="${escapeHtml(t)}">${escapeHtml(t)} <button type="button">×</button></span>`).join('')}<input id="tagInput" placeholder="输入后按回车"></div></div><div class="form-field"><label>封面 / 参考图</label><button type="button" class="image-picker" id="recordImagePicker">${currentImageData?`<img src="${currentImageData}" alt="">`:''}<span>${currentImageData?'更换图片':'选择照片或图片'}</span></button><input id="recordImageInput" type="file" accept="image/*" hidden></div></div></section>${fieldSection('核心设定',coreFields,existing)}${moreFields.length?fieldSection('扩展设定',moreFields,existing):''}<section class="form-section"><h3>创作备注</h3><div class="form-field"><textarea name="notes" placeholder="记录未决定的内容、资料来源或后续要补的地方。">${escapeHtml(existing?.notes||'')}</textarea></div></section></form>`;
  sheetFooter.innerHTML=`${existing?'<button class="danger-btn" id="deleteRecord">删除</button>':'<button class="secondary-btn" id="cancelEdit">取消</button>'}<button class="primary-btn" id="saveRecord">${existing?'保存修改':'建立档案'}</button>`;sheetFooter.classList.remove('hidden');openSheet();
  $('#cancelEdit')?.addEventListener('click',closeSheet);$('#saveRecord').onclick=()=>saveEditor(m,existing);$('#deleteRecord')?.addEventListener('click',()=>deleteRecord(m,existing));
  $('#recordImagePicker').onclick=()=>$('#recordImageInput').click();$('#recordImageInput').onchange=e=>{const f=e.target.files[0];if(f)fileToDataURL(f).then(data=>{currentImageData=data;$('#recordImagePicker').innerHTML=`<img src="${data}" alt=""><span>更换图片</span>`})};
  bindTagEditor();
}
function fieldSection(title,fields,existing){ return `<section class="form-section"><h3>${title}<small>${fields.length} 项</small></h3><div class="form-grid">${fields.map(f=>renderField(f,existing?.fields?.[f.key]||'')).join('')}</div></section>`; }
function renderField(f,value){
  const help=f.help?`<small>${escapeHtml(f.help)}</small>`:''; const name=`field_${f.key}`;
  if(f.type==='textarea')return `<div class="form-field"><label>${f.label}</label><textarea name="${name}" placeholder="${escapeHtml(f.placeholder||'')}">${escapeHtml(value)}</textarea>${help}</div>`;
  if(f.type==='select')return `<div class="form-field"><label>${f.label}</label><select name="${name}"><option value="">请选择</option>${(f.options||[]).map(o=>`<option ${o===value?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select>${help}</div>`;
  if(f.type==='image')return `<div class="form-field"><label>${f.label}</label><small>请使用上方“封面 / 参考图”上传主要图片；更多图片可写入形象或图库档案。</small></div>`;
  return `<div class="form-field"><label>${f.label}</label><input type="${['date','number'].includes(f.type)?f.type:'text'}" name="${name}" value="${escapeHtml(value)}" placeholder="${escapeHtml(f.placeholder||'')}">${help}</div>`;
}
function bindTagEditor(){ const input=$('#tagInput');input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim()){e.preventDefault();const t=input.value.trim();const token=document.createElement('span');token.className='tag-token';token.dataset.tag=t;token.innerHTML=`${escapeHtml(t)} <button type="button">×</button>`;input.before(token);input.value='';token.querySelector('button').onclick=()=>token.remove();}});$('#tagEditor').querySelectorAll('.tag-token button').forEach(b=>b.onclick=()=>b.parentElement.remove()); }
function saveEditor(m,existing){
  const form=$('#mobileRecordForm');if(!form.reportValidity())return;const fd=new FormData(form);const fields={};m.fields.forEach(f=>{if(f.type!=='image')fields[f.key]=fd.get(`field_${f.key}`)||''});if(currentImageData&&m.fields.some(f=>f.type==='image'))fields.image=currentImageData;
  const rec=existing||{id:uid(m.id),projectId:state.activeProjectId,createdAt:nowISO()};rec.title=fd.get('title').trim();rec.status=fd.get('status');rec.tags=[...form.querySelectorAll('.tag-token')].map(x=>x.dataset.tag);rec.image=currentImageData;rec.fields=fields;rec.notes=fd.get('notes')||'';rec.updatedAt=nowISO();rec.favorite=existing?.favorite||false;
  if(!existing)state.records[m.id].push(rec);saveState();closeSheet();showToast(existing?'已保存修改':'档案已建立');if(ui.route==='module'&&ui.moduleId===m.id)renderModule();else if(ui.route==='writing')renderWriting();else renderHome();
}
function deleteRecord(m,r){if(confirm(`确定删除“${recordTitle(r)}”吗？`)){r.deleted=true;r.updatedAt=nowISO();saveState();closeSheet();showToast('已删除');if(ui.route==='module')renderModule();else render()}}

function openDetail(moduleId,recordId){
  const m=moduleById(moduleId);const r=projectRecords(moduleId).find(x=>x.id===recordId);if(!r)return;ui.detail={moduleId,recordId};ui.detailTab='overview';
  fullTitle.textContent=recordTitle(r);fullSubtitle.textContent=m.name;fullAction.textContent='•••';renderDetailBody(m,r);openFull();
}
function renderDetailBody(m,r){
  const img=r.image||r.fields?.image||''; const tabs=detailTabsFor(m.id);
  fullBody.innerHTML=`<div class="detail-hero">${img?`<img src="${img}" alt="">`:''}<div class="detail-gradient"></div><button class="detail-fav" id="detailFav">${r.favorite?'♥':'♡'}</button><div class="detail-info"><div class="eyebrow">${escapeHtml(m.group)} · ${escapeHtml(r.status||'构思中')}</div><h1>${escapeHtml(recordTitle(r))}</h1><p>${escapeHtml(summaryFor(r,m))}</p></div></div><div class="detail-tabs">${tabs.map(([id,n])=>`<button data-detail-tab="${id}" class="${ui.detailTab===id?'active':''}">${n}</button>`).join('')}</div><div class="detail-content" id="detailContent">${renderDetailTab(m,r)}</div>`;
  $('#detailFav').onclick=()=>{r.favorite=!r.favorite;r.updatedAt=nowISO();saveState();renderDetailBody(m,r)};fullBody.querySelectorAll('[data-detail-tab]').forEach(b=>b.onclick=()=>{ui.detailTab=b.dataset.detailTab;renderDetailBody(m,r)});
  fullBody.querySelectorAll('[data-related-record]').forEach(b=>{b.onclick=()=>{const [mm,id]=b.dataset.relatedRecord.split('|');openDetail(mm,id)}});
  $('#detailWrite')?.addEventListener('click',()=>openRichEditor(r.id,m.id));
}
function detailTabsFor(moduleId){const tabs=[['overview','档案'],['links','关联'],['notes','备注']];if(moduleId==='character')tabs.splice(1,0,['journey','历程'],['relations','关系']);if(moduleId==='manuscript'||moduleId==='story')tabs.splice(1,0,['content','正文']);if(['worldPlot','journey'].includes(moduleId))tabs.splice(1,0,['timeline','时间']);return tabs;}
function renderDetailTab(m,r){
  if(ui.detailTab==='overview')return `<section class="info-section"><h3>完成度 ${completion(r,m)}%</h3>${m.fields.map(f=>{const v=r.fields?.[f.key];if(!v||f.type==='image')return'';return `<div class="info-row"><small>${f.label}</small><p>${escapeHtml(v)}</p></div>`}).join('')||'<p class="info-empty">还没有填写详细设定。</p>'}</section>${r.tags?.length?`<section class="info-section"><h3>标签</h3><div class="record-tags">${r.tags.map(t=>`<span class="mini-tag">${escapeHtml(t)}</span>`).join('')}</div></section>`:''}`;
  if(ui.detailTab==='notes')return `<section class="info-section"><h3>创作备注</h3><p class="${r.notes?'':'info-empty'}">${escapeHtml(r.notes||'暂时没有备注。')}</p></section>`;
  if(ui.detailTab==='content')return `<section class="info-section"><h3>正文 · ${wordCount(r.fields?.content||'')} 字</h3><div class="${r.fields?.content?'':'info-empty'}" style="font-family:Songti SC,STSong,serif;font-size:16px;line-height:1.9;white-space:pre-wrap">${r.fields?.content?sanitizeRich(r.fields.content):'尚未开始撰写。'}</div></section><button class="primary-btn wide" id="detailWrite">进入专注编辑</button>`;
  if(ui.detailTab==='journey'){const list=projectRecords('journey').filter(x=>(x.fields?.character||'').includes(r.title));return relatedList(list,'journey','还没有关联角色历程');}
  if(ui.detailTab==='relations'){const list=projectRecords('relationship').filter(x=>(x.fields?.partyA||'').includes(r.title)||(x.fields?.partyB||'').includes(r.title));return relatedList(list,'relationship','还没有关联关系');}
  if(ui.detailTab==='timeline')return `<section class="info-section"><h3>时间信息</h3><div class="info-row"><small>日期</small><p>${escapeHtml(r.fields?.date||r.fields?.startDate||'未设置')}</p></div><div class="info-row"><small>时期</small><p>${escapeHtml(r.fields?.era||r.fields?.stage||'未设置')}</p></div></section>`;
  return renderLinks(r);
}
function relatedList(list,moduleId,empty){return list.length?`<div class="recent-list">${list.map(x=>`<button class="recent-row" data-related-record="${moduleId}|${x.id}"><span class="recent-cover">${moduleById(moduleId).icon}</span><span class="recent-copy"><b>${escapeHtml(recordTitle(x))}</b><small>${escapeHtml(summaryFor(x,moduleById(moduleId)))}</small></span><span class="recent-arrow">›</span></button>`).join('')}</div>`:`<section class="info-section"><p class="info-empty">${empty}</p></section>`;}
function renderLinks(r){
  const text=JSON.stringify(r.fields||{});const matches=allProjectRecords().filter(x=>x.id!==r.id&&text.includes(x.title)).slice(0,20);
  return matches.length?`<div class="recent-list">${matches.map(x=>`<button class="recent-row" data-related-record="${x.moduleId}|${x.id}"><span class="recent-cover">${moduleById(x.moduleId).icon}</span><span class="recent-copy"><b>${escapeHtml(x.title)}</b><small>${moduleById(x.moduleId).name}</small></span><span class="recent-arrow">›</span></button>`).join('')}</div>`:`<section class="info-section"><h3>自动关联</h3><p class="info-empty">在字段中写入其他档案的完整名称后，会自动出现在这里。</p></section>`;
}
function handleFullAction(){
  if(!ui.detail)return;const {moduleId,recordId}=ui.detail;const r=projectRecords(moduleId).find(x=>x.id===recordId);if(!r)return;
  openActionMenu([{label:'编辑档案',action:()=>{closeFull();openEditor(moduleId,recordId)}},{label:r.favorite?'取消收藏':'加入收藏',action:()=>{r.favorite=!r.favorite;saveState();renderDetailBody(moduleById(moduleId),r)}},{label:'复制档案',action:()=>{const copy=structuredClone(r);copy.id=uid(moduleId);copy.title=r.title+' 副本';copy.createdAt=copy.updatedAt=nowISO();state.records[moduleId].push(copy);saveState();closeFull();showToast('已复制')}},{label:'删除',danger:true,action:()=>{if(confirm('确定删除这份档案吗？')){r.deleted=true;saveState();closeFull();render()}}}]);
}
function openActionMenu(items){sheetTitle.textContent='更多操作';sheetHint.textContent='';sheetBody.innerHTML=`<div class="setting-group">${items.map((x,i)=>`<button class="setting-row" data-menu-action="${i}"><span><b style="${x.danger?'color:var(--danger)':''}">${x.label}</b></span><span class="recent-arrow">›</span></button>`).join('')}</div>`;sheetFooter.classList.add('hidden');openSheet();sheetBody.querySelectorAll('[data-menu-action]').forEach(b=>b.onclick=()=>{const x=items[Number(b.dataset.menuAction)];closeSheet();x.action()});}

function openRichEditor(recordId,moduleId='manuscript'){
  const r=projectRecords(moduleId).find(x=>x.id===recordId);if(!r)return;ui.detail={moduleId,recordId};fullTitle.textContent=recordTitle(r);fullSubtitle.textContent='自动保存';fullAction.textContent='完成';
  fullBody.innerHTML=`<div class="rich-toolbar"><button data-cmd="bold">B</button><button data-cmd="italic">I</button><button data-cmd="formatBlock" data-value="h2">标题</button><button data-cmd="insertUnorderedList">清单</button><button id="insertDivider">分隔</button></div><div class="rich-editor" id="richEditor" contenteditable="true" spellcheck="true">${r.fields?.content||''}</div><div class="editor-status" id="editorStatus">${wordCount(plainText(r.fields?.content||''))} 字 · 已保存</div>`;openFull();
  fullAction.onclick=()=>{saveRich(r,true);fullAction.onclick=handleFullAction;closeFull()};fullBody.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{document.execCommand(b.dataset.cmd,false,b.dataset.value||null);$('#richEditor').focus()});$('#insertDivider').onclick=()=>document.execCommand('insertHTML',false,'<hr><p><br></p>');let t;$('#richEditor').oninput=()=>{clearTimeout(t);$('#editorStatus').textContent=`${wordCount(plainText($('#richEditor').innerHTML))} 字 · 保存中…`;t=setTimeout(()=>saveRich(r),500)};
}
function saveRich(r,immediate=false){r.fields ||= {};r.fields.content=$('#richEditor')?.innerHTML||r.fields.content||'';r.updatedAt=nowISO();saveState(immediate);if($('#editorStatus'))$('#editorStatus').textContent=`${wordCount(plainText(r.fields.content))} 字 · 已保存`;}

function openGuide(m){sheetTitle.textContent=`${m.name} · 搭建清单`;sheetHint.textContent='可以边看边补充档案';sheetBody.innerHTML=`<div class="setting-group">${(m.guide||[]).map((g,i)=>`<div class="setting-row"><span class="setting-icon">${i+1}</span><span><b>${escapeHtml(g)}</b></span></div>`).join('')}</div><button class="primary-btn wide" id="guideCreate">新建${m.name}</button>`;sheetFooter.classList.add('hidden');openSheet();$('#guideCreate').onclick=()=>{closeSheet();openEditor(m.id)}}
function openSheet(){sheet.classList.remove('hidden');overlay.classList.remove('hidden');document.body.style.overflow='hidden';}
function closeSheet(){sheet.classList.add('hidden');overlay.classList.add('hidden');sheetBody.innerHTML='';sheetFooter.innerHTML='';document.body.style.overflow='';}
function openFull(){fullPanel.classList.remove('hidden');document.body.style.overflow='hidden';}
function closeFull(){fullPanel.classList.add('hidden');fullBody.innerHTML='';ui.detail=null;fullAction.onclick=handleFullAction;fullAction.textContent='•••';document.body.style.overflow='';}

function openSearch(){
  sheetTitle.textContent='搜索全部世界';sheetHint.textContent='角色、地点、剧情、正文和标签';sheetBody.innerHTML=`<div class="search-bar"><span>⌕</span><input id="globalSearchInput" autofocus placeholder="输入名称或内容"></div><div id="globalSearchResults" class="search-results"><div class="empty-state"><div class="empty-orb">⌕</div><h3>搜索你的宇宙</h3><p>可以搜索所有 28 个模块中的标题、字段、标签和正文。</p></div></div>`;sheetFooter.classList.add('hidden');openSheet();setTimeout(()=>$('#globalSearchInput').focus(),200);$('#globalSearchInput').oninput=e=>renderSearchResults(e.target.value);
}
function renderSearchResults(q){const box=$('#globalSearchResults');q=q.trim().toLowerCase();if(!q){box.innerHTML='';return}const res=allProjectRecords().filter(r=>JSON.stringify(r).toLowerCase().includes(q)).slice(0,50);box.innerHTML=res.length?res.map(r=>`<button class="search-result" data-search-record="${r.moduleId}|${r.id}"><span class="module-icon">${moduleById(r.moduleId).icon}</span><span><b>${escapeHtml(r.title)}</b><small>${moduleById(r.moduleId).name} · ${escapeHtml(summaryFor(r,moduleById(r.moduleId)))}</small></span></button>`).join(''):`<div class="empty-state"><div class="empty-orb">⌕</div><h3>没有找到</h3><p>换一个名称、标签或剧情关键词。</p></div>`;box.querySelectorAll('[data-search-record]').forEach(b=>b.onclick=()=>{const [m,id]=b.dataset.searchRecord.split('|');closeSheet();openDetail(m,id)});}

function openReminderCenter(){
  sheetTitle.textContent='提醒中心';sheetHint.textContent='创作节点、补档和修订计划';const list=state.reminders.filter(r=>r.projectId===state.activeProjectId).sort((a,b)=>Number(a.done)-Number(b.done));
  sheetBody.innerHTML=`<button class="primary-btn wide" id="newReminder">＋ 新建提醒</button><div class="setting-group" style="margin-top:13px">${list.length?list.map(r=>`<button class="setting-row" data-reminder="${r.id}"><span class="setting-icon">${r.done?'✓':'◌'}</span><span style="flex:1"><b style="${r.done?'text-decoration:line-through;color:var(--muted)':''}">${escapeHtml(r.title)}</b><small>${r.due?formatDate(r.due):'无截止日期'}${r.note?' · '+escapeHtml(r.note):''}</small></span><span class="recent-arrow">›</span></button>`).join(''):`<div class="setting-row"><span><b>暂无提醒</b><small>可记录“补完角色关系”“周末修订第三章”等任务。</small></span></div>`}</div>`;sheetFooter.classList.add('hidden');openSheet();$('#newReminder').onclick=openReminderEditor;sheetBody.querySelectorAll('[data-reminder]').forEach(b=>b.onclick=()=>openReminderEditor(b.dataset.reminder));
}
function openReminderEditor(id=null){const r=id?state.reminders.find(x=>x.id===id):null;sheetTitle.textContent=r?'编辑提醒':'新建提醒';sheetBody.innerHTML=`<section class="form-section"><div class="form-grid"><div class="form-field"><label>提醒内容</label><input id="remTitle" value="${escapeHtml(r?.title||'')}" placeholder="例如：补完反派的动机"></div><div class="form-field"><label>日期</label><input id="remDue" type="datetime-local" value="${r?.due?String(r.due).slice(0,16):''}"></div><div class="form-field"><label>备注</label><textarea id="remNote">${escapeHtml(r?.note||'')}</textarea></div></div></section>`;sheetFooter.innerHTML=`${r?'<button class="danger-btn" id="remDelete">删除</button>':'<button class="secondary-btn" id="remCancel">取消</button>'}<button class="primary-btn" id="remSave">保存</button>`;sheetFooter.classList.remove('hidden');$('#remCancel')?.addEventListener('click',openReminderCenter);$('#remDelete')?.addEventListener('click',()=>{state.reminders=state.reminders.filter(x=>x.id!==id);saveState();openReminderCenter()});$('#remSave').onclick=()=>{const title=$('#remTitle').value.trim();if(!title)return showToast('请填写提醒内容');if(r){r.title=title;r.due=$('#remDue').value;r.note=$('#remNote').value}else state.reminders.push({id:uid('rem'),projectId:state.activeProjectId,title,due:$('#remDue').value,note:$('#remNote').value,done:false,createdAt:nowISO()});saveState();openReminderCenter();updateProjectHeader()};if(r){const row=document.createElement('button');row.className='secondary-btn wide';row.style.marginTop='8px';row.textContent=r.done?'标记为未完成':'标记为已完成';row.onclick=()=>{r.done=!r.done;saveState();openReminderCenter()};sheetBody.append(row)}}

function openProjectSwitcher(){
  sheetTitle.textContent='作品与世界';sheetHint.textContent='每个世界独立保存，不会互相串档';sheetBody.innerHTML=`<div class="setting-group">${state.projects.map(p=>`<button class="setting-row" data-project="${p.id}"><span class="setting-icon">${escapeHtml(p.title.slice(0,1))}</span><span style="flex:1"><b>${escapeHtml(p.title)}</b><small>${escapeHtml(p.tagline||'私人创作空间')}</small></span>${p.id===state.activeProjectId?'<span style="color:var(--purple);font-weight:700">当前</span>':'<span class="recent-arrow">›</span>'}</button>`).join('')}</div><button class="primary-btn wide" id="newProject">＋ 新建世界</button><button class="secondary-btn wide" id="editProject" style="margin-top:9px">编辑当前世界信息</button>`;sheetFooter.classList.add('hidden');openSheet();sheetBody.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>{state.activeProjectId=b.dataset.project;normalizeState();ui.activeMapId=state.maps[state.activeProjectId][0]?.id;saveState();closeSheet();render()});$('#newProject').onclick=()=>openProjectEditor();$('#editProject').onclick=()=>openProjectEditor(activeProject().id);
}
function openProjectEditor(id=null){const p=id?state.projects.find(x=>x.id===id):null;sheetTitle.textContent=p?'编辑世界':'新建世界';sheetBody.innerHTML=`<section class="form-section"><div class="form-grid"><div class="form-field"><label>作品 / 世界名称</label><input id="projectNameEdit" value="${escapeHtml(p?.title||'')}" placeholder="例如：雾海纪元"></div><div class="form-field"><label>一句话介绍</label><textarea id="projectTagEdit" placeholder="这个世界最重要的矛盾或气质">${escapeHtml(p?.tagline||'')}</textarea></div></div></section>`;sheetFooter.innerHTML=`${p&&state.projects.length>1?'<button class="danger-btn" id="deleteProject">删除世界</button>':'<button class="secondary-btn" id="cancelProject">取消</button>'}<button class="primary-btn" id="saveProject">保存</button>`;sheetFooter.classList.remove('hidden');$('#cancelProject')?.addEventListener('click',openProjectSwitcher);$('#saveProject').onclick=()=>{const title=$('#projectNameEdit').value.trim();if(!title)return showToast('请填写世界名称');if(p){p.title=title;p.tagline=$('#projectTagEdit').value;p.updatedAt=nowISO()}else{const np={id:uid('project'),title,tagline:$('#projectTagEdit').value,createdAt:nowISO(),updatedAt:nowISO()};state.projects.push(np);state.activeProjectId=np.id;state.graphs[np.id]={positions:{}};state.maps[np.id]=[{id:uid('map'),name:'世界总览',parentId:null,bg:'',strokes:[],pins:[],createdAt:nowISO()}]};saveState();closeSheet();render()};$('#deleteProject')?.addEventListener('click',()=>{if(confirm('确定删除当前世界以及其中所有档案吗？')){const pid=p.id;state.projects=state.projects.filter(x=>x.id!==pid);MODULES.forEach(m=>state.records[m.id]=state.records[m.id].filter(r=>r.projectId!==pid));delete state.maps[pid];delete state.graphs[pid];state.activeProjectId=state.projects[0].id;saveState();closeSheet();render()}})}

function openInstallHelp(){sheetTitle.textContent='安装到 iPhone 15';sheetHint.textContent='安装后可全屏运行，并在断网时继续使用';sheetBody.innerHTML=`<div class="setting-group"><div class="setting-row"><span class="setting-icon">1</span><span><b>使用 Safari 打开网址</b><small>必须通过 Safari，微信内置浏览器无法安装。</small></span></div><div class="setting-row"><span class="setting-icon">2</span><span><b>点击底部“分享”按钮</b><small>图标是一个向上箭头的方框。</small></span></div><div class="setting-row"><span class="setting-icon">3</span><span><b>选择“添加到主屏幕”</b><small>确认名称后点击右上角“添加”。</small></span></div><div class="setting-row"><span class="setting-icon">4</span><span><b>以后从桌面图标进入</b><small>首次打开后，静态程序文件会缓存离线；资料保存在本机 Safari 中。</small></span></div></div><div class="daily-prompt"><div class="prompt-icon">!</div><div><b>重要提醒</b><p>删除 Safari 网站数据、清理浏览器或卸载主屏幕 App，可能清除本地资料。请定期导出加密备份到“文件”或 iCloud Drive。</p></div></div>`;sheetFooter.classList.add('hidden');openSheet();}

async function setPin(){if(state.settings.pinHash){const old=prompt('输入当前密码以关闭访问锁');if(await digest(old||'')===state.settings.pinHash){state.settings.pinHash='';saveState();showToast('访问锁已关闭');renderSettings()}else showToast('密码不正确')}else{const pin=prompt('设置 4–12 位数字或字母密码。请务必记住：');if(pin&&pin.length>=4){state.settings.pinHash=await digest(pin);saveState();showToast('访问锁已开启');renderSettings()}else if(pin)showToast('密码至少 4 位')}}
async function digest(text){const data=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function downloadJSON(data,name){const text=JSON.stringify(data,null,2);const file=new File([text],name,{type:'application/json'});try{if(navigator.canShare?.({files:[file]})){await navigator.share({title:'世界观工坊备份',files:[file]});showToast('请选择“存储到文件”保存备份');return}}catch(err){if(err?.name==='AbortError')return;console.warn(err)}const blob=new Blob([text],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast('备份文件已生成');}
async function exportEncrypted(){const pass=prompt('设置备份密码。恢复时必须输入同一个密码：');if(!pass)return;const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveKey(pass,salt,['encrypt']);const encoded=new TextEncoder().encode(JSON.stringify(state));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoded);downloadJSON({type:'worldview-encrypted-v1',salt:toB64(salt),iv:toB64(iv),data:toB64(new Uint8Array(cipher))},`世界观工坊-加密备份-${new Date().toISOString().slice(0,10)}.json`);}
async function deriveKey(pass,salt,usages){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,usages)}
function toB64(bytes){let s='';bytes.forEach(b=>s+=String.fromCharCode(b));return btoa(s)}function fromB64(s){const x=atob(s);return Uint8Array.from(x,c=>c.charCodeAt(0))}
async function handleGlobalFile(e){const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());let imported=parsed;if(parsed.type==='worldview-encrypted-v1'){const pass=prompt('输入加密备份密码：');if(!pass)return;const key=await deriveKey(pass,fromB64(parsed.salt),['decrypt']);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(parsed.iv)},key,fromB64(parsed.data));imported=JSON.parse(new TextDecoder().decode(plain))}if(!imported.projects||!imported.records)throw new Error('格式不正确');if(confirm('恢复备份会覆盖当前应用中的全部资料，是否继续？')){state=imported;normalizeState();await saveState(true);closeSheet();showToast('备份已恢复');render()}}catch(err){console.error(err);showToast('无法读取备份，可能密码或文件不正确')}finally{e.target.value='';}}
function fileToDataURL(file,maxSide=1800){
  return new Promise((resolve,reject)=>{
    if(!file?.type?.startsWith('image/')){const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);return;}
    const reader=new FileReader();
    reader.onerror=reject;
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>resolve(reader.result);
      img.onload=()=>{
        const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',.86));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

init();
