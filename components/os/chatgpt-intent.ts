export type ChatIntent = "greeting" | "agent" | "matrix";

const LATIN_EXTRA: Record<string, string> = {
  ø: "o",
  æ: "ae",
  œ: "oe",
  å: "a",
  ł: "l",
  đ: "d",
  ð: "d",
  þ: "th",
  ß: "ss",
  ı: "i",
  ŋ: "n",
};

// Case, accents, and punctuation fold away so one pattern covers "Hiiii!!" and "¡Hola!".
const foldPrompt = (value: string) => {
  const folded = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/([a-z])\p{M}+/gu, "$1")
    .normalize("NFC")
    .replace(/[øæœåłđðþßıŋ]/gu, (letter) => LATIN_EXTRA[letter] ?? letter)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/['’`´]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return folded;
};

const escapeLiteral = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const literalGroup = (phrases: readonly string[]) =>
  [...phrases]
    .sort((left, right) => right.length - left.length)
    .map(escapeLiteral)
    .join("|");

const STRETCHED_GREETINGS = [
  "h+i+y+a+",
  "h+e+y+a+",
  "h+e+y+o+",
  "h+e+l+o+",
  "h+o+l+a+",
  "o+l+a+",
  "h+a+l+o+",
  "b+o+n+j+o+u+r+",
  "b+o+n+s+o+i+r+",
  "w+h+a+t+s+u+p+",
  "w+a+z+u+p+",
  "w+a+s+u+p+",
  "h+o+w+d+y+",
  "c+o+u+c+o+u+",
  "m+e+r+h+a+b+a+",
  "g+r+u+e+z+i+",
  "s+e+r+v+u+s+",
  "a+l+o+h+a+",
  "s+a+l+u+t+",
  "c+i+a+o+",
  "m+o+i+n+",
  "h+e+y+",
  "h+i+",
  "y+o+",
  "a+y+",
  "s+u+p+",
  "o+i+",
  "e+y+",
  "h+e+j+",
  "h+e+i+",
  "h+o+i+",
  "t+j+e+n+a+",
  "s+z+i+a+",
  "a+h+o+j+",
  "c+z+e+s+c+",
  "w+i+t+a+j+",
  "w+i+t+a+m+",
  "s+a+l+v+e+",
  "s+a+l+a+m+",
  "s+e+l+a+m+",
  "j+a+m+b+o+",
  "e+l+l+o+",
  "g+d+a+y+",
  "g+m+",
  "g+n+",
];

const GREETING_PHRASES = [
  "good morning",
  "good afternoon",
  "good evening",
  "good night",
  "good day",
  "top of the morning",
  "buenos dias",
  "buenas tardes",
  "buenas noches",
  "buen dia",
  "buenas",
  "bonjour",
  "bonsoir",
  "bonne nuit",
  "salutations",
  "buongiorno",
  "buonasera",
  "buonanotte",
  "guten morgen",
  "guten abend",
  "guten tag",
  "bom dia",
  "boa tarde",
  "boa noite",
  "goedemorgen",
  "goedemiddag",
  "goedenavond",
  "gunaydin",
  "iyi aksamlar",
  "iyi gunler",
  "konnichiwa",
  "ohayou gozaimasu",
  "ohayo",
  "ohayou",
  "konbanwa",
  "moshi moshi",
  "annyeonghaseyo",
  "annyeong",
  "anyoung",
  "ni hao",
  "nin hao",
  "privet",
  "zdravstvuyte",
  "zdravstvuy",
  "dobryy den",
  "dobry den",
  "assalamu alaikum",
  "assalamualaikum",
  "asalamualaikum",
  "salam alaikum",
  "marhaba",
  "ahlan",
  "namaskaram",
  "namaskar",
  "namaste",
  "vanakkam",
  "selamat pagi",
  "selamat siang",
  "selamat sore",
  "selamat malam",
  "apa kabar",
  "xin chao",
  "sawubona",
  "how are you doing today",
  "how are you doing",
  "how are you",
  "howre you doing",
  "howre you",
  "hows it going",
  "hows everything",
  "how are ya",
  "how you doing",
  "how do you do",
  "whats up",
  "what is up",
  "whats good",
  "que tal",
  "q tal",
  "como estas",
  "como vai",
  "como andas",
  "comment ca va",
  "comment allez vous",
  "ca va",
  "wie gehts",
  "wie geht es dir",
  "wie geht es",
  "come stai",
  "come va",
  "tudo bem",
  "tudo bom",
  "hoe gaat het",
  "e ai",
  "que onda",
  "quiubo",
  "are you there",
  "you there",
  "anyone there",
  "anybody there",
  "is anyone there",
  "greetings",
  "saludos",
  "dzien dobry",
  "god morgon",
  "god dag",
  "goddag",
  "morning",
  "evening",
  "afternoon",
];

const UNICODE_GREETINGS = [
  "你好",
  "您好",
  "嗨",
  "哈喽",
  "早上好",
  "晚上好",
  "こんにちは",
  "おはよう",
  "おはようございます",
  "こんばんは",
  "やあ",
  "もしもし",
  "안녕",
  "안녕하세요",
  "안녕하십니까",
  "привет",
  "здравствуйте",
  "здравствуй",
  "добрый день",
  "доброе утро",
  "добрый вечер",
  "хай",
  "مرحبا",
  "اهلا",
  "أهلا",
  "السلام عليكم",
  "سلام",
  "שלום",
  "γεια",
  "γεια σου",
  "γειά σου",
  "καλημέρα",
  "καλησπέρα",
  "नमस्ते",
  "नमस्कार",
];

const GREETING_LEAD = `(?:${STRETCHED_GREETINGS.join("|")}|${literalGroup([
  ...GREETING_PHRASES,
  ...UNICODE_GREETINGS,
])})`;

const GREETING_TAIL =
  "(?:\\s+(?:there|chatgpt|gpt|friend|mate|buddy|folks|everyone|all|you|team|pal|dude|man|bro|sis|sir|madam|madame|monsieur|amigo|amiga|senor|senora))*" +
  "(?:\\s+(?:how are you(?: doing)?(?: today)?|hows it going|how are ya|how you doing|whats up|what is up|how do you do|que tal|como estas|ca va|wie gehts|come stai|tudo bem|hoe gaat het|apa kabar))?";

const GREETING_PATTERN = new RegExp(
  `^(?:${GREETING_LEAD})(?:\\s+${GREETING_LEAD}){0,2}${GREETING_TAIL}$`,
  "u",
);

const AGENT_QUESTIONS = [
  "(?:are you|r u|r you|are ya|are u|you|ya|u) (?:actually |really )?(?:real|for real|a real one|fake|a fake|true|live)",
  "(?:are you|r u|r you|are ya|are u|you|ya|u) (?:actually |really )?(?:a |an )?(?:real |actual |genuine |true |live )?(?:human being|agent|person|human|bot|robot|ai|assistant|chatgpt)",
  "(?:youre|you are|ur|u r) (?:actually |really )?(?:a |an )?(?:real |actual |genuine |true )?(?:human being|agent|person|human|bot|robot|ai|assistant|chatgpt|one|real)",
  "(?:is this|is it) (?:actually |really )?(?:real|for real|a real (?:human being|agent|person|human|bot|ai|one)|(?:a |an )(?:real |actual )?(?:human being|agent|person|human|bot|robot|ai|chatgpt))",
  "am i (?:talking|speaking|chatting) (?:to|with) (?:a |an )?(?:real |actual |live )?(?:human being|agent|person|human|bot|ai|chatgpt|one)",
  "(?:youre|you are|ur|u r) not (?:a |an )?(?:real |actual )?(?:agent|person|human|bot|ai|one|real)",
  "(?:this|it) isnt real",
  "not a real (?:agent|person|human|one)",
  "eres (?:real|de verdad|humano|humana|un humano|una humana|un agente(?: real| de verdad)?|una persona(?: real| de verdad)?|un bot|un robot|una ia|ia)",
  "(?:es usted|usted es) (?:real|humano|un agente|un bot|una persona)",
  "(?:esto|eso) es real",
  "(?:es tu|tu es|tes|etes vous) (?:reel(?:le)?|vrai(?:e)?|humain(?:e)?|un vrai agent|une vraie personne|un agent(?: reel)?|une personne(?: reelle)?|un bot|un robot|une ia|un humain|une humaine)",
  "cest (?:reel|vrai|un bot|une ia|un humain)",
  "bist du (?:wirklich )?(?:echt|real|ein mensch|eine person|ein bot|ein roboter|ein agent|eine ki|ein echter agent|ein echter mensch|eine echte person)",
  "sind sie (?:echt|real|ein mensch|ein bot|eine ki)",
  "sei (?:reale|vero|vera|davvero reale|umano|umana|un agente(?: reale)?|una persona(?: reale)?|un bot|un robot|un umano|una umana|una ia)",
  "(?:voce|vc) (?:e|eh) (?:real|de verdade|humano|humana|um agente(?: real)?|uma pessoa(?: real)?|um bot|um robo|um humano|uma humana|uma ia)",
  "(?:isso|isto) e real",
  "ben (?:je|jij) (?:echt|real|een mens|een bot|een agent|een persoon|een echte agent|een echte persoon|echt een agent|echt een mens|echt een bot)",
  "is dit (?:echt|real)",
  "ar du (?:riktig|pa riktigt|en bot|en agent|en manniska|en riktig agent|en riktig manniska|manniska)",
  "er du (?:ekte|rigtig|virkelig|en bot|et menneske|en agent|et rigtigt menneske)",
  "jestes (?:prawdziwy|prawdziwa|czlowiekiem|botem|agentem|prawdziwym agentem|prawdziwym czlowiekiem)",
  "(?:gercek|insan|ajan) misin",
  "(?:bot|robot) musun",
  "gercek bir (?:ajan|insan) misin",
  "esti (?:real|un agent|un om|un bot|o persoana)",
  "apakah (?:kamu|anda|kau) (?:nyata|manusia|bot|asli)",
  "(?:kamu|anda) (?:nyata|asli|bot|manusia)",
  "ban (?:co that khong|la nguoi that|la bot|la that)",
  "kya (?:tum|aap|tu) (?:asli|real|bot|insaan)(?: ho)?",
  "jsi (?:skutecny|skutecna|robot|clovek|opravdovy)",
  "(?:igaz|ember|bot) vagy",
  "ты (?:настоящий|настоящая|реальный|реальная)(?: агент| человек| бот)?",
  "ты (?:бот|человек|агент|робот)",
  "вы (?:бот|человек|агент|робот|настоящий|настоящая)",
  "это (?:настоящий агент|реальный человек|настоящий человек|бот)",
  "你是真人吗",
  "你是真人嘛",
  "你是真人",
  "你是机器人吗",
  "你是机器人",
  "你是真的吗",
  "你是真的",
  "你是人吗",
  "你是ai吗",
  "你是人工智能吗",
  "你是不是真人",
  "本物ですか",
  "人間ですか",
  "ボットですか",
  "本当ですか",
  "あなたは本物ですか",
  "あなたは人間ですか",
  "君は本物",
  "君は人間",
  "本当のエージェントですか",
  "진짜야",
  "진짜예요",
  "사람이야",
  "사람이에요",
  "봇이야",
  "너 진짜야",
  "당신 진짜야",
  "에이전트야",
  "هل انت حقيقي",
  "هل انت بوت",
  "هل انت انسان",
  "هل أنت حقيقي",
  "هل أنت إنسان",
  "هل أنت بوت",
  "क्या तुम असली हो",
  "क्या आप असली हो",
  "क्या तुम बॉट हो",
];

const FILLER = "(?:(?:okay|please|well|pls|ok|um|uh|so)\\s+)*";
const GREETING_PREFIX = `(?:${GREETING_LEAD})(?:\\s+(?:there|chatgpt|gpt))?\\s+`;
const AGENT_TAIL = "(?:\\s+(?:or not|or what|though|tho|right now|right|please|pls))?";

const AGENT_PATTERN = new RegExp(
  `^${FILLER}(?:${GREETING_PREFIX})?${FILLER}(?:${AGENT_QUESTIONS.join("|")})${AGENT_TAIL}$`,
  "u",
);

const WAVE_EMOJI = /[👋🙋🤚✋🖐️🖖✌️🙏🫡]/u;
const EMOJI_ONLY = /^[\s\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u200d]+$/u;

const isWaveGreeting = (value: string) =>
  EMOJI_ONLY.test(value.trim()) && WAVE_EMOJI.test(value);

export const classifyPrompt = (value: string): ChatIntent => {
  if (isWaveGreeting(value)) {
    return "greeting";
  }
  const text = foldPrompt(value);
  if (text === "") {
    return "matrix";
  }
  if (AGENT_PATTERN.test(text)) {
    return "agent";
  }
  if (GREETING_PATTERN.test(text)) {
    return "greeting";
  }
  return "matrix";
};
