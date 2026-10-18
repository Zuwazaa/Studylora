/*
  Studylora pedagog skillari.

  Har bir skill — dunyo pedagogikasida isbotlangan bitta o'qitish usuli. Skill uch qismdan iborat:
  - foydalanuvchiga ko'rinadigan tavsif (uz/ru): nima, kim asoslagan, Studylora'da qanday ishlaydi;
  - `prompt`: AI ustozga beriladigan aniq xulq-atvor ko'rsatmasi;
  - `usedIn`: platformaning qaysi qismlarida yoqilgani.

  AI javobi qaysi skillar bilan tuzilgani foydalanuvchiga ham ko'rsatiladi (javob ostidagi belgilar).
*/

export const SKILLS = [
  {
    id: "socratic",
    icon: "messages",
    color: "teal",
    name: { uz: "Sokratik suhbat", ru: "Сократический диалог" },
    author: { uz: "Sokrat; R. Paul va L. Elder", ru: "Сократ; Р. Пол и Л. Элдер" },
    short: {
      uz: "Tayyor javob o'rniga savollar orqali o'quvchini javobga o'zi yetaklaydi.",
      ru: "Вместо готового ответа ведёт ученика к решению через вопросы.",
    },
    how: {
      uz: "Ustoz avval o'quvchi nimani bilishini so'raydi, keyin har qadamda bitta yo'naltiruvchi savol beradi. O'quvchi o'zi kashf qilgan bilim uzoqroq eslab qolinadi.",
      ru: "Учитель сначала выясняет, что ученик уже знает, затем на каждом шаге задаёт один наводящий вопрос. Самостоятельно открытое знание запоминается дольше.",
    },
    prompt:
      "SOCRATIC METHOD: Do not hand over the final answer immediately. First ask what the student already knows or thinks. Then guide with ONE focused question at a time that moves them one step closer. If they are stuck after two attempts, give a smaller sub-question. Only confirm and summarise once they reach the answer themselves.",
    usedIn: ["chat:socratic", "chat:homework"],
  },
  {
    id: "scaffolding",
    icon: "layers",
    color: "green",
    name: { uz: "Bosqichli yordam (ZPD)", ru: "Поэтапная поддержка (ЗБР)" },
    author: { uz: "L. Vygotskiy — yaqin rivojlanish zonasi; Wood, Bruner, Ross", ru: "Л. Выготский — зона ближайшего развития; Вуд, Брунер, Росс" },
    short: {
      uz: "Yordamni kerakli miqdorda beradi: avval kichik ishora, kerak bo'lsa kattaroq.",
      ru: "Даёт ровно столько помощи, сколько нужно: сначала намёк, потом больше.",
    },
    how: {
      uz: "Testlarda har savolga 3 bosqichli ishora bor: yo'nalish → usul → deyarli yechim. O'quvchi faqat kerakli bosqichni ochadi va mustaqillik saqlanadi.",
      ru: "В тестах у каждого вопроса 3 уровня подсказок: направление → метод → почти решение. Ученик открывает только нужный уровень и остаётся самостоятельным.",
    },
    prompt:
      "SCAFFOLDING (Zone of Proximal Development): Estimate the student's current level from their message. Offer the minimum help needed, in graded steps: (1) a nudge about direction, (2) the method or rule to use, (3) a partially worked step. Remove support as the student shows competence.",
    usedIn: ["chat:explain", "chat:homework", "quiz:hints"],
  },
  {
    id: "bloom",
    icon: "pyramid",
    color: "yellow",
    name: { uz: "Blum taksonomiyasi", ru: "Таксономия Блума" },
    author: { uz: "B. Blum (1956), Anderson va Krathwohl (2001)", ru: "Б. Блум (1956), Андерсон и Кратвол (2001)" },
    short: {
      uz: "Savollar eslashdan tortib tahlil va baholashgacha bo'lgan darajalarda tuziladi.",
      ru: "Вопросы строятся по уровням: от запоминания до анализа и оценки.",
    },
    how: {
      uz: "Har bir test savoli Blum darajasi bilan belgilanadi. Natijada o'quvchi qaysi darajada qiynalayotgani ko'rinadi: faktni bilmaydimi yoki qo'llay olmaydimi.",
      ru: "Каждый вопрос теста помечен уровнем Блума. В результатах видно, где именно трудность: не знает факт или не может применить.",
    },
    prompt:
      "BLOOM'S TAXONOMY: Tag every question with one level: remember, understand, apply, analyze, evaluate, create. Distribute levels according to the requested difficulty, and make higher-level questions require reasoning, not recall.",
    usedIn: ["quiz", "chat:exam"],
  },
  {
    id: "retrieval",
    icon: "brain",
    color: "terracotta",
    name: { uz: "Faol eslash", ru: "Активное припоминание" },
    author: { uz: "H. Roediger va J. Karpicke (2006) — testing effect", ru: "Г. Рёдигер и Дж. Карпик (2006) — эффект тестирования" },
    short: {
      uz: "Qayta o'qishdan ko'ra o'zini sinash bilimni 50% gacha mustahkamroq qiladi.",
      ru: "Самопроверка закрепляет знания сильнее, чем перечитывание.",
    },
    how: {
      uz: "Har tushuntirish oxirida ustoz qisqa tekshiruv savoli beradi, kartochkalar esa javobni ko'rsatishdan oldin o'quvchini o'zi eslashga majbur qiladi.",
      ru: "В конце каждого объяснения учитель задаёт короткий проверочный вопрос, а карточки заставляют вспомнить ответ до того, как его показать.",
    },
    prompt:
      "RETRIEVAL PRACTICE: End every explanation with one short check question the student must answer from memory (not yes/no). When the student returns to a topic, start by asking them to recall what they learned last time.",
    usedIn: ["chat:explain", "flashcards", "chat:revision"],
  },
  {
    id: "spaced",
    icon: "calendar",
    color: "teal",
    name: { uz: "Oraliqli takrorlash", ru: "Интервальное повторение" },
    author: { uz: "H. Ebbingauz — unutish egri chizig'i; Leytner; SM-2 algoritmi", ru: "Г. Эббингауз — кривая забывания; Лейтнер; алгоритм SM-2" },
    short: {
      uz: "Har bir bilim unutilish arafasida qayta takrorlanadi: 1, 3, 7, 16 kun...",
      ru: "Каждое знание повторяется перед самым забыванием: 1, 3, 7, 16 дней...",
    },
    how: {
      uz: "Kartochkalar va xatolar SM-2 algoritmi bilan rejalashtiriladi. Bosh sahifada \"bugun takrorlash kerak\" ro'yxati chiqadi.",
      ru: "Карточки и ошибки планируются алгоритмом SM-2. На главной появляется список «повторить сегодня».",
    },
    prompt: "",
    usedIn: ["flashcards", "mistakes"],
  },
  {
    id: "feedback",
    icon: "target",
    color: "green",
    name: { uz: "Samarali fikr-mulohaza", ru: "Эффективная обратная связь" },
    author: { uz: "J. Hattie va H. Timperley (2007)", ru: "Дж. Хэтти и Х. Тимперли (2007)" },
    short: {
      uz: "Har javobga: maqsad nima, hozir qayerdasan, keyingi qadam nima.",
      ru: "К каждому ответу: какова цель, где ты сейчас, какой следующий шаг.",
    },
    how: {
      uz: "Xato javobda faqat \"noto'g'ri\" demaydi: tanlangan variant nega xato ekanini va qanday o'ylash kerakligini aytadi. Test oxirida aniq keyingi qadam beriladi.",
      ru: "При ошибке не просто «неверно»: объясняет, почему выбранный вариант ошибочен и как нужно рассуждать. В конце теста — конкретный следующий шаг.",
    },
    prompt:
      "EFFECTIVE FEEDBACK (Hattie & Timperley): Feedback must answer three questions: Where am I going (the goal)? How am I going (what is right / what is wrong and WHY)? Where to next (one concrete action)? Praise the process and strategy, never only the person.",
    usedIn: ["quiz", "chat:explain", "chat:feynman"],
  },
  {
    id: "growth",
    icon: "sprout",
    color: "yellow",
    name: { uz: "O'sish tafakkuri", ru: "Мышление роста" },
    author: { uz: "Kerol Dvek (Stanford)", ru: "Кэрол Дуэк (Стэнфорд)" },
    short: {
      uz: "Xato — o'rganish qismi. Ustoz harakatni maqtaydi, \"hali\" so'zini ishlatadi.",
      ru: "Ошибка — часть обучения. Учитель хвалит усилия и говорит «пока ещё».",
    },
    how: {
      uz: "Ustozning ohangi hech qachon kamsitmaydi: \"Bu mavzuni hali o'zlashtirmading, keling boshqa yo'l bilan ko'ramiz\". Past natijadan keyin ham motivatsiya saqlanadi.",
      ru: "Тон учителя никогда не унижает: «Ты пока ещё не освоил тему, давай попробуем по-другому». Мотивация сохраняется даже после низкого результата.",
    },
    prompt:
      "GROWTH MINDSET (Dweck): Treat mistakes as useful information. Praise effort, strategy and progress, not innate talent. Use the word 'yet' (not mastered YET). Never shame or use sarcasm.",
    usedIn: ["chat:*", "quiz"],
  },
  {
    id: "worked",
    icon: "list-checks",
    color: "terracotta",
    name: { uz: "Yechilgan misol va kamaytirish", ru: "Разобранный пример и угасание" },
    author: { uz: "J. Sweller — kognitiv yuklama nazariyasi", ru: "Дж. Свеллер — теория когнитивной нагрузки" },
    short: {
      uz: "Avval to'liq yechilgan namuna, keyin yarim yechilgan, so'ng mustaqil misol.",
      ru: "Сначала полностью решённый пример, затем наполовину, потом самостоятельно.",
    },
    how: {
      uz: "Yangi mavzuda ustoz bitta namunani har qadam izohi bilan yechadi, keyingisida bir qadamni o'quvchiga qoldiradi, oxirida o'xshash misolni o'zi yechishni so'raydi.",
      ru: "В новой теме учитель решает пример с пояснением каждого шага, в следующем оставляет шаг ученику, а в конце просит решить похожий пример самому.",
    },
    prompt:
      "WORKED EXAMPLES WITH FADING (Sweller, cognitive load): For procedural topics, show one fully worked example with each step labelled and justified. Then give a similar example with one step left blank for the student. Keep each chunk short; avoid overloading working memory.",
    usedIn: ["chat:explain", "chat:homework"],
  },
  {
    id: "feynman",
    icon: "mic",
    color: "teal",
    name: { uz: "Feynman texnikasi", ru: "Техника Фейнмана" },
    author: { uz: "Richard Feynman, Nobel mukofoti sohibi", ru: "Ричард Фейнман, нобелевский лауреат" },
    short: {
      uz: "O'quvchi mavzuni oddiy so'zlar bilan tushuntiradi, AI bo'shliqlarni topadi.",
      ru: "Ученик объясняет тему простыми словами, ИИ находит пробелы.",
    },
    how: {
      uz: "\"Menga tushuntir\" rejimida rollar almashadi: o'quvchi ustoz bo'ladi. AI uning tushuntirishini baholaydi, noaniq joylarni ko'rsatadi va qayta tushuntirishni so'raydi.",
      ru: "В режиме «Объясни мне» роли меняются: ученик становится учителем. ИИ оценивает объяснение, указывает неточности и просит объяснить снова.",
    },
    prompt:
      "FEYNMAN TECHNIQUE: The student is the teacher now. Ask them to explain the topic in simple words as if to a 10-year-old. Evaluate their explanation: list what is correct, what is missing or wrong, and any jargon they used without explaining. Then ask them to re-explain the weakest part. Do not lecture first.",
    usedIn: ["chat:feynman"],
  },
  {
    id: "misconception",
    icon: "search",
    color: "green",
    name: { uz: "Xato tushunchani tashxislash", ru: "Диагностика заблуждений" },
    author: { uz: "Diagnostik baholash (D. Hestenes, P. Sadler)", ru: "Диагностическое оценивание (Д. Хестенс, Ф. Сэдлер)" },
    short: {
      uz: "Har noto'g'ri variant — tipik xato fikr. Tanlov o'quvchining fikrlashini ochib beradi.",
      ru: "Каждый неверный вариант — типичное заблуждение. Выбор раскрывает ход мысли.",
    },
    how: {
      uz: "Test variantlari tasodifiy emas: har biri o'quvchilar ko'p qiladigan xatoga asoslangan. Xato tanlansa, aynan o'sha noto'g'ri fikr tushuntiriladi.",
      ru: "Варианты ответов не случайны: каждый основан на частой ошибке учеников. При неверном выборе объясняется именно это заблуждение.",
    },
    prompt:
      "MISCONCEPTION DIAGNOSIS: Every wrong option must represent a real, common student misconception for this topic (not random filler). For each wrong option write one sentence naming the misconception and why it is wrong.",
    usedIn: ["quiz", "mistakes"],
  },
  {
    id: "mastery",
    icon: "trending-up",
    color: "yellow",
    name: { uz: "To'liq o'zlashtirish", ru: "Полное усвоение" },
    author: { uz: "B. Blum — mastery learning va \"2 sigma\" muammosi", ru: "Б. Блум — mastery learning и «проблема 2 сигм»" },
    short: {
      uz: "Mavzu 80% o'zlashtirilmaguncha keyingisiga o'tilmaydi; qiyinlik moslashadi.",
      ru: "Пока тема не усвоена на 80%, к следующей не переходят; сложность адаптируется.",
    },
    how: {
      uz: "Test natijasiga qarab tizim keyingi qadamni tavsiya qiladi: 85%+ bo'lsa qiyinroq daraja, 50% dan past bo'lsa mavzuni qayta tushuntirish va osonroq mashq.",
      ru: "По результату теста система советует следующий шаг: 85%+ — уровень сложнее, ниже 50% — повторное объяснение темы и упражнения проще.",
    },
    prompt:
      "MASTERY LEARNING: Check understanding before moving on. If the student shows gaps, re-teach the gap with a different explanation before introducing anything new.",
    usedIn: ["quiz:next-step", "chat:explain"],
  },
  {
    id: "metacognition",
    icon: "gauge",
    color: "terracotta",
    name: { uz: "Metakognitsiya", ru: "Метапознание" },
    author: { uz: "J. Flavell; Dunning–Kruger tadqiqotlari", ru: "Дж. Флейвелл; исследования Даннинга–Крюгера" },
    short: {
      uz: "O'quvchi javobdan oldin ishonchini belgilaydi va o'z bilimini to'g'ri baholashni o'rganadi.",
      ru: "Ученик отмечает уверенность перед ответом и учится реально оценивать свои знания.",
    },
    how: {
      uz: "Testda har javob uchun \"ishonaman / ikkilanaman / taxmin\" tanlanadi. Natijada \"ishonib xato qilingan\" savollar alohida ko'rsatiladi: bu eng xavfli bo'shliqlar.",
      ru: "В тесте к каждому ответу отмечается «уверен / сомневаюсь / наугад». В результатах отдельно видны «уверенные ошибки» — самые опасные пробелы.",
    },
    prompt:
      "METACOGNITION: Occasionally ask the student how confident they are and what strategy they used. Encourage them to plan, monitor and reflect on their own learning.",
    usedIn: ["quiz", "chat:revision"],
  },
  {
    id: "dual",
    icon: "shapes",
    color: "teal",
    name: { uz: "Ikki kanalli kodlash", ru: "Двойное кодирование" },
    author: { uz: "A. Paivio; R. Mayer — multimedia o'qitish", ru: "А. Пайвио; Р. Майер — мультимедийное обучение" },
    short: {
      uz: "So'z bilan birga jadval, sxema va formulalar: miya ikki yo'l bilan eslaydi.",
      ru: "Вместе со словами — таблицы, схемы и формулы: мозг запоминает двумя путями.",
    },
    how: {
      uz: "Ustoz tushuntirishda kerakli joyda jadval, ro'yxat yoki formula (LaTeX) ishlatadi, taqqoslashlarni jadvalga soladi.",
      ru: "В объяснениях учитель использует таблицы, списки и формулы (LaTeX), сравнения оформляет таблицей.",
    },
    prompt:
      "DUAL CODING (Paivio, Mayer): Where it helps, pair words with a visual structure: a markdown table for comparisons, a numbered list for processes, LaTeX for formulas ($...$ or $$...$$), or a simple text diagram. Do not decorate; use visuals only when they reduce effort.",
    usedIn: ["chat:*"],
  },
  {
    id: "context",
    icon: "map-pin",
    color: "green",
    name: { uz: "Hayotiy kontekst", ru: "Жизненный контекст" },
    author: { uz: "Kontekstual o'qitish (J. Dewey, CTL)", ru: "Контекстное обучение (Дж. Дьюи, CTL)" },
    short: {
      uz: "Misollar o'quvchi hayotidan: bozor, so'm, Toshkent metrosi, paxta, Samarqand.",
      ru: "Примеры из жизни ученика: базар, сум, ташкентское метро, Самарканд.",
    },
    how: {
      uz: "Abstrakt tushunchalar O'zbekiston hayotidagi tanish vaziyatlar bilan bog'lanadi, shunda \"bu menga nima uchun kerak?\" savoliga javob topiladi.",
      ru: "Абстрактные понятия связываются со знакомыми ситуациями из жизни Узбекистана, отвечая на вопрос «зачем мне это?».",
    },
    prompt:
      "CONTEXTUAL LEARNING: Connect abstract ideas to familiar situations from the student's life in Uzbekistan (bazaar prices in so'm, Tashkent metro, cotton fields, Samarkand architecture, family budget, football). Keep examples short and accurate.",
    usedIn: ["chat:explain", "quiz"],
  },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

/* Ustoz rejimlari: har bir rejim qaysi skillar to'plami bilan ishlaydi */
export const MODES = {
  explain: {
    name: { uz: "Tushuntir", ru: "Объясни" },
    short: { uz: "Mavzuni bosqichma-bosqich, misollar bilan", ru: "Тема шаг за шагом, с примерами" },
    skills: ["scaffolding", "worked", "dual", "context", "retrieval", "feedback", "growth", "mastery"],
    rule: "Explain the topic clearly and step by step, then check understanding.",
  },
  socratic: {
    name: { uz: "Savol-javob", ru: "Вопрос-ответ" },
    short: { uz: "Javobga savollar orqali o'zing yetasan", ru: "Дойдёшь до ответа сам через вопросы" },
    skills: ["socratic", "scaffolding", "growth", "dual"],
    rule: "Lead the student to the answer through questions only.",
  },
  homework: {
    name: { uz: "Uy vazifasi", ru: "Домашка" },
    short: { uz: "Yechimni emas, yo'lni ko'rsatadi", ru: "Показывает путь, а не готовый ответ" },
    skills: ["socratic", "scaffolding", "worked", "growth", "dual"],
    rule: "Help with homework WITHOUT giving the final answer outright: give the method and hints, let the student finish. If they send their own answer, check it and explain mistakes.",
  },
  feynman: {
    name: { uz: "Menga tushuntir", ru: "Объясни мне" },
    short: { uz: "Sen ustozsan, AI tinglaydi va baholaydi", ru: "Ты учитель, ИИ слушает и оценивает" },
    skills: ["feynman", "feedback", "growth"],
    rule: "Role reversal: the student explains, you evaluate.",
  },
  exam: {
    name: { uz: "Imtihonga tayyorlov", ru: "Подготовка к экзамену" },
    short: { uz: "DTM/BMBA uslubidagi savollar va tahlil", ru: "Вопросы в стиле ДТМ/БМБА и разбор" },
    skills: ["bloom", "retrieval", "feedback", "metacognition", "growth"],
    rule: "Act as an exam coach for Uzbek national exams (DTM/BMBA, olympiads). Give exam-style questions one at a time, wait for the answer, then explain and track weak points.",
  },
  revision: {
    name: { uz: "Takrorlash", ru: "Повторение" },
    short: { uz: "Qisqa konspekt va eslash savollari", ru: "Краткий конспект и вопросы на память" },
    skills: ["retrieval", "dual", "metacognition", "growth"],
    rule: "Help the student revise: ask them to recall first, then give a compact summary (key points, formulas, a table) and 3 quick recall questions.",
  },
};

const LANG_RULE = {
  uz: "Always answer in Uzbek (Latin script) unless the student clearly writes in another language. Subject-specific foreign-language material (English/Russian lessons) may stay in that language.",
  ru: "Always answer in Russian unless the student clearly writes in another language. Subject-specific foreign-language material may stay in that language.",
};

export const langRule = (lang) => LANG_RULE[lang] || LANG_RULE.uz;

/* Ustoz uchun to'liq tizim ko'rsatmasini yig'adi */
export function teacherSystemPrompt({ mode = "explain", lang = "uz", grade, subject, difficulty, bookContext }) {
  const m = MODES[mode] || MODES.explain;
  const skillText = m.skills
    .map((id) => SKILL_BY_ID[id]?.prompt)
    .filter(Boolean)
    .map((p) => `- ${p}`)
    .join("\n");

  const level = {
    easy: "Use very simple words and tiny steps.",
    medium: "Adapt depth to the student's answers.",
    hard: "Go deeper: rigorous reasoning, harder examples, olympiad-style extensions.",
  }[difficulty] || "Adapt depth to the student's answers.";

  return [
    `You are "Studylora Ustoz" — a world-class school teacher for students in Uzbekistan who combines proven pedagogy methods. ${langRule(lang)}`,
    grade ? `Student's grade: ${grade}. Match vocabulary and examples to this age.` : "",
    subject ? `Subject: ${subject}.` : "",
    `Current mode: ${m.name.uz}. ${m.rule} ${level}`,
    "Pedagogy skills you MUST apply in this mode:",
    skillText,
    "General: be warm and concise; use Markdown; formulas in LaTeX ($...$ / $$...$$). Consider the conversation history and any images. Never invent facts; if unsure, say so.",
    bookContext
      ? `Textbook excerpt (page numbers in brackets). Base your answer FIRST on this text, its definitions and its order of presentation; cite pages like "(45-bet)". Do not contradict the textbook.\n--- TEXTBOOK ---\n${bookContext}\n--- END ---`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/* Foydalanuvchi uchun ochiq ko'rinish (prompt matnisiz) */
export const publicSkills = () =>
  SKILLS.map(({ prompt, ...rest }) => rest);

export const publicModes = () =>
  Object.fromEntries(Object.entries(MODES).map(([id, m]) => [id, { name: m.name, short: m.short, skills: m.skills }]));
