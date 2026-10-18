// Sinflar va fanlar katalogi (O'zbekiston maktab dasturi). Kitob kaliti: "<sinf>-<fan id>", masalan "10-algebra".
export const SUBJECTS = {
 "alifbe": {
  "uz": "Alifbe",
  "ru": "Букварь",
  "tone": "yellow",
  "icon": "a"
 },
 "ona-tili": {
  "uz": "Ona tili",
  "ru": "Родной язык",
  "tone": "yellow",
  "icon": "book-open"
 },
 "matematika": {
  "uz": "Matematika",
  "ru": "Математика",
  "tone": "green",
  "icon": "sigma"
 },
 "tasviriy-sanat": {
  "uz": "Tasviriy san'at",
  "ru": "Изобразительное искусство",
  "tone": "yellow",
  "icon": "palette"
 },
 "musiqa": {
  "uz": "Musiqa",
  "ru": "Музыка",
  "tone": "yellow",
  "icon": "music"
 },
 "texnologiya": {
  "uz": "Texnologiya",
  "ru": "Технология",
  "tone": "green",
  "icon": "wrench"
 },
 "oqish": {
  "uz": "O'qish kitobi",
  "ru": "Чтение",
  "tone": "yellow",
  "icon": "book"
 },
 "tabiiy-fan": {
  "uz": "Tabiiy fan",
  "ru": "Естествознание",
  "tone": "teal",
  "icon": "sprout"
 },
 "ingliz-tili": {
  "uz": "Ingliz tili",
  "ru": "Английский язык",
  "tone": "yellow",
  "icon": "languages"
 },
 "rus-tili": {
  "uz": "Rus tili",
  "ru": "Русский язык",
  "tone": "yellow",
  "icon": "languages"
 },
 "adabiyot": {
  "uz": "Adabiyot",
  "ru": "Литература",
  "tone": "yellow",
  "icon": "feather"
 },
 "biologiya": {
  "uz": "Biologiya",
  "ru": "Биология",
  "tone": "teal",
  "icon": "leaf"
 },
 "chizma": {
  "uz": "Chizmachilik",
  "ru": "Черчение",
  "tone": "green",
  "icon": "ruler"
 },
 "geografiya": {
  "uz": "Geografiya",
  "ru": "География",
  "tone": "teal",
  "icon": "globe"
 },
 "informatika": {
  "uz": "Informatika",
  "ru": "Информатика",
  "tone": "teal",
  "icon": "code"
 },
 "tabiiy-fanlar": {
  "uz": "Tabiiy fanlar",
  "ru": "Естественные науки",
  "tone": "teal",
  "icon": "sprout"
 },
 "tarbiya": {
  "uz": "Tarbiya",
  "ru": "Воспитание",
  "tone": "terracotta",
  "icon": "heart"
 },
 "tarix": {
  "uz": "Tarix",
  "ru": "История",
  "tone": "terracotta",
  "icon": "landmark"
 },
 "fizika": {
  "uz": "Fizika",
  "ru": "Физика",
  "tone": "teal",
  "icon": "atom"
 },
 "algebra": {
  "uz": "Algebra",
  "ru": "Алгебра",
  "tone": "green",
  "icon": "sigma"
 },
 "geometriya": {
  "uz": "Geometriya",
  "ru": "Геометрия",
  "tone": "green",
  "icon": "triangle"
 },
 "jahon-tarixi": {
  "uz": "Jahon tarixi",
  "ru": "Всемирная история",
  "tone": "terracotta",
  "icon": "landmark"
 },
 "kimyo": {
  "uz": "Kimyo",
  "ru": "Химия",
  "tone": "teal",
  "icon": "flask"
 },
 "ozbekiston-tarixi": {
  "uz": "O'zbekiston tarixi",
  "ru": "История Узбекистана",
  "tone": "terracotta",
  "icon": "scroll"
 },
 "huquq": {
  "uz": "Davlat va huquq asoslari",
  "ru": "Основы государства и права",
  "tone": "terracotta",
  "icon": "scale"
 },
 "iqtisodiyot": {
  "uz": "Iqtisodiyot",
  "ru": "Экономика",
  "tone": "terracotta",
  "icon": "chart"
 },
 "chqbt": {
  "uz": "Chaqiruvga qadar boshlang'ich tayyorgarlik",
  "ru": "Допризывная подготовка",
  "tone": "terracotta",
  "icon": "shield"
 },
 "astronomiya": {
  "uz": "Astroniya",
  "ru": "Астрономия",
  "tone": "teal",
  "icon": "orbit"
 },
 "tadbirkorlik": {
  "uz": "Tadbirkorlik asoslari",
  "ru": "Предпринимательство",
  "tone": "terracotta",
  "icon": "briefcase"
 }
};

export const GRADES = {"1": ["alifbe", "ona-tili", "matematika", "tasviriy-sanat", "musiqa", "texnologiya"], "2": ["ona-tili", "oqish", "matematika", "tabiiy-fan", "tasviriy-sanat", "musiqa", "ingliz-tili"], "3": ["ona-tili", "oqish", "matematika", "tabiiy-fan", "ingliz-tili", "rus-tili", "tasviriy-sanat", "musiqa"], "4": ["ona-tili", "oqish", "matematika", "tabiiy-fan", "ingliz-tili", "rus-tili", "tasviriy-sanat", "musiqa"], "5": ["adabiyot", "biologiya", "chizma", "geografiya", "informatika", "ingliz-tili", "matematika", "musiqa", "ona-tili", "rus-tili", "tabiiy-fanlar", "tarbiya", "tarix", "tasviriy-sanat", "texnologiya"], "6": ["adabiyot", "chizma", "fizika", "geografiya", "informatika", "ingliz-tili", "matematika", "musiqa", "ona-tili", "rus-tili", "tabiiy-fanlar", "tarbiya", "tarix", "tasviriy-sanat", "texnologiya"], "7": ["adabiyot", "algebra", "biologiya", "chizma", "fizika", "geografiya", "geometriya", "informatika", "ingliz-tili", "jahon-tarixi", "kimyo", "matematika", "musiqa", "ozbekiston-tarixi", "ona-tili", "rus-tili", "tarbiya", "tasviriy-sanat", "texnologiya"], "8": ["adabiyot", "algebra", "biologiya", "chizma", "huquq", "fizika", "geografiya", "geometriya", "informatika", "ingliz-tili", "iqtisodiyot", "jahon-tarixi", "kimyo", "ozbekiston-tarixi", "ona-tili", "rus-tili", "tarbiya", "texnologiya"], "9": ["adabiyot", "algebra", "biologiya", "chizma", "huquq", "fizika", "geografiya", "geometriya", "informatika", "ingliz-tili", "iqtisodiyot", "jahon-tarixi", "kimyo", "ozbekiston-tarixi", "ona-tili", "rus-tili", "tarbiya", "texnologiya"], "10": ["adabiyot", "algebra", "biologiya", "chqbt", "huquq", "fizika", "geografiya", "geometriya", "informatika", "ingliz-tili", "jahon-tarixi", "kimyo", "ozbekiston-tarixi", "ona-tili", "rus-tili", "tarbiya"], "11": ["adabiyot", "algebra", "astronomiya", "biologiya", "chqbt", "huquq", "fizika", "geometriya", "informatika", "ingliz-tili", "jahon-tarixi", "kimyo", "ozbekiston-tarixi", "ona-tili", "rus-tili", "tadbirkorlik", "tarbiya"]};

export const subjectName = (id, lang = "uz") => SUBJECTS[id]?.[lang] || SUBJECTS[id]?.uz || id;

export const subjectsOf = (grade) => (GRADES[grade] || []).map((id) => ({ id, ...SUBJECTS[id] }));

export const bookKey = (grade, id) => `${grade}-${id}`;

// Natijalar fan nomi (o'zbekcha) bilan saqlanadi — foydalanuvchi tilida ko'rsatish uchun
export const subjectByUz = (name, lang = "uz") => {
  const hit = Object.values(SUBJECTS).find((s) => s.uz === name);
  return hit ? hit[lang] || hit.uz : name;
};
