// Virtual laboratoriya tajribalari. Har biri Bashorat → Kuzatish → Tushuntirish (POE) bosqichlaridan o'tadi.
import { Pendulum, Projectile, Ohm, Refraction } from "./sims/physics";
import { Titration, Rates, GasLaw, FlameTest } from "./sims/chemistry";
import { Photosynthesis, Osmosis, Enzyme, Mendel } from "./sims/biology";

export const LAB_SUBJECTS = {
  physics: { uz: "Fizika", ru: "Физика", tone: "green", icon: "orbit" },
  chemistry: { uz: "Kimyo", ru: "Химия", tone: "yellow", icon: "flask" },
  biology: { uz: "Biologiya", ru: "Биология", tone: "teal", icon: "leaf" },
};

/* predict.answer — to'g'ri variant indeksi; plot — o'lchovlar grafigi (x va y o'lchov id'lari) */
export const EXPERIMENTS = [
  {
    id: "pendulum", subject: "physics", grade: "8–9", Sim: Pendulum, plot: { x: "L", y: "T" },
    title: { uz: "Matematik mayatnik", ru: "Математический маятник" },
    goal: {
      uz: "Mayatnik tebranish davri nimaga bog'liq: ip uzunligi, yuk massasi, og'ish burchagi yoki sayyoraning tortishishi?",
      ru: "От чего зависит период маятника: от длины нити, массы груза, угла отклонения или притяжения планеты?",
    },
    predict: {
      q: { uz: "Ip uzunligini 4 marta oshirsak, tebranish davri qanday o'zgaradi?", ru: "Если увеличить длину нити в 4 раза, как изменится период?" },
      options: [
        { uz: "4 marta ortadi", ru: "Увеличится в 4 раза" },
        { uz: "2 marta ortadi", ru: "Увеличится в 2 раза" },
        { uz: "O'zgarmaydi", ru: "Не изменится" },
        { uz: "2 marta kamayadi", ru: "Уменьшится в 2 раза" },
      ],
      answer: 1,
    },
    tasks: {
      uz: ["Uzunlikni 0,5 m, 1 m, 2 m qilib davrni yozib oling", "Massani o'zgartiring: davr o'zgaradimi?", "Mayatnikni Oyga olib boring"],
      ru: ["Запишите период при длине 0,5 м, 1 м и 2 м", "Измените массу: меняется ли период?", "Перенесите маятник на Луну"],
    },
  },
  {
    id: "projectile", subject: "physics", grade: "9", Sim: Projectile, plot: { x: "angle", y: "R" },
    title: { uz: "Burchak ostida otilgan jism", ru: "Тело, брошенное под углом" },
    goal: {
      uz: "Otish burchagi va tezlik jismning uchish uzoqligi va balandligiga qanday ta'sir qiladi?",
      ru: "Как угол и скорость броска влияют на дальность и высоту полёта?",
    },
    predict: {
      q: { uz: "Tezlik bir xil bo'lsa, qaysi burchakda jism eng uzoqqa uchadi?", ru: "При одинаковой скорости под каким углом тело улетит дальше всего?" },
      options: [{ uz: "30°", ru: "30°" }, { uz: "45°", ru: "45°" }, { uz: "60°", ru: "60°" }, { uz: "75°", ru: "75°" }],
      answer: 1,
    },
    tasks: {
      uz: ["15°, 30°, 45°, 60°, 75° burchaklarda otib, uzoqlikni yozing", "30° va 60° natijalarini solishtiring", "Tezlikni 2 marta oshirsangiz uzoqlik necha marta ortadi?"],
      ru: ["Бросьте под 15°, 30°, 45°, 60°, 75° и запишите дальность", "Сравните результаты 30° и 60°", "Во сколько раз растёт дальность, если скорость удвоить?"],
    },
  },
  {
    id: "ohm", subject: "physics", grade: "8", Sim: Ohm, plot: { x: "U", y: "I" },
    title: { uz: "Om qonuni", ru: "Закон Ома" },
    goal: {
      uz: "Zanjirdagi tok kuchi kuchlanish va qarshilikka qanday bog'liq? Lampochka nega yorqinroq yonadi?",
      ru: "Как сила тока зависит от напряжения и сопротивления? Почему лампа горит ярче?",
    },
    predict: {
      q: { uz: "Kuchlanish o'zgarmasa, qarshilikni 2 marta oshirsak tok kuchi nima bo'ladi?", ru: "Если при том же напряжении увеличить сопротивление в 2 раза, что будет с током?" },
      options: [
        { uz: "2 marta ortadi", ru: "Увеличится в 2 раза" },
        { uz: "O'zgarmaydi", ru: "Не изменится" },
        { uz: "2 marta kamayadi", ru: "Уменьшится в 2 раза" },
        { uz: "4 marta kamayadi", ru: "Уменьшится в 4 раза" },
      ],
      answer: 2,
    },
    tasks: {
      uz: ["R = 10 Ω da kuchlanishni 2, 4, 6, 8 V qilib tokni yozing", "Grafikka qarang: qanday chiziq hosil bo'ldi?", "Lampochka eng yorqin bo'lgan holatni toping"],
      ru: ["При R = 10 Ом запишите ток для 2, 4, 6, 8 В", "Посмотрите на график: какая получилась линия?", "Найдите режим, где лампа ярче всего"],
    },
  },
  {
    id: "refraction", subject: "physics", grade: "9", Sim: Refraction, plot: { x: "a1", y: "a2" },
    title: { uz: "Yorug'likning sinishi", ru: "Преломление света" },
    goal: {
      uz: "Yorug'lik bir muhitdan boshqasiga o'tganda nega yo'nalishini o'zgartiradi? To'liq ichki qaytish qachon yuz beradi?",
      ru: "Почему свет меняет направление на границе сред? Когда наступает полное внутреннее отражение?",
    },
    predict: {
      q: { uz: "Nur havodan suvga o'tganda qanday sinadi?", ru: "Как преломится луч при переходе из воздуха в воду?" },
      options: [
        { uz: "Perpendikulyarga yaqinlashadi", ru: "Приблизится к перпендикуляру" },
        { uz: "Perpendikulyardan uzoqlashadi", ru: "Отклонится от перпендикуляра" },
        { uz: "Umuman sinmaydi", ru: "Совсем не преломится" },
        { uz: "Hammasi orqaga qaytadi", ru: "Полностью отразится" },
      ],
      answer: 0,
    },
    tasks: {
      uz: ["Havo → suv: 4 xil burchakda sinish burchagini yozing", "Muhitlarni almashtiring: suv → havo", "Olmos → havo uchun chegaraviy burchakni toping"],
      ru: ["Воздух → вода: запишите угол преломления для 4 углов", "Поменяйте среды: вода → воздух", "Найдите предельный угол для алмаз → воздух"],
    },
  },
  {
    id: "titration", subject: "chemistry", grade: "8–9", Sim: Titration, plot: { x: "V", y: "pH" },
    title: { uz: "Neytrallanish va indikatorlar", ru: "Нейтрализация и индикаторы" },
    goal: {
      uz: "Xlorid kislotaga ishqor qo'shib boramiz. pH qanday o'zgaradi va indikatorlar rangi qachon almashadi?",
      ru: "Добавляем щёлочь к соляной кислоте. Как меняется pH и когда индикаторы меняют цвет?",
    },
    predict: {
      q: { uz: "25 ml 0,1 M HCl ga qancha 0,1 M NaOH qo'shilganda muhit neytral bo'ladi?", ru: "Сколько 0,1 M NaOH нужно добавить к 25 мл 0,1 M HCl, чтобы среда стала нейтральной?" },
      options: [{ uz: "12,5 ml", ru: "12,5 мл" }, { uz: "25 ml", ru: "25 мл" }, { uz: "50 ml", ru: "50 мл" }, { uz: "Hech qachon neytral bo'lmaydi", ru: "Никогда не станет нейтральной" }],
      answer: 1,
    },
    tasks: {
      uz: ["0, 10, 20, 24, 25, 26, 30, 40 ml da pH ni yozing", "Grafikda keskin sakrash qayerda?", "Fenolftalein bilan rang qaysi nuqtada paydo bo'ladi?"],
      ru: ["Запишите pH при 0, 10, 20, 24, 25, 26, 30, 40 мл", "Где на графике резкий скачок?", "В какой точке появляется окраска фенолфталеина?"],
    },
  },
  {
    id: "rates", subject: "chemistry", grade: "9–10", Sim: Rates, plot: { x: "T", y: "half" },
    title: { uz: "Reaksiya tezligi", ru: "Скорость реакции" },
    goal: {
      uz: "Harorat, konsentratsiya va katalizator reaksiya tezligiga qanday ta'sir qiladi? Zarrachalar to'qnashuvini kuzating.",
      ru: "Как температура, концентрация и катализатор влияют на скорость реакции? Наблюдайте столкновения частиц.",
    },
    predict: {
      q: { uz: "Harorat 300 K dan 500 K ga oshirilsa, yarim reaksiya vaqti qanday o'zgaradi?", ru: "Если поднять температуру с 300 K до 500 K, как изменится время полупревращения?" },
      options: [
        { uz: "Ancha qisqaradi", ru: "Сильно сократится" },
        { uz: "Uzayadi", ru: "Увеличится" },
        { uz: "O'zgarmaydi", ru: "Не изменится" },
      ],
      answer: 0,
    },
    tasks: {
      uz: ["300 K, 400 K, 500 K da yarim reaksiya vaqtini yozing", "Katalizator qo'shib 300 K da qaytaring", "Zarrachalar sonini oshiring: nima o'zgardi?"],
      ru: ["Запишите время полупревращения при 300, 400, 500 K", "Повторите при 300 K с катализатором", "Увеличьте число частиц: что изменилось?"],
    },
  },
  {
    id: "gas", subject: "chemistry", grade: "10", Sim: GasLaw, plot: { x: "V", y: "P" },
    title: { uz: "Gaz qonunlari", ru: "Газовые законы" },
    goal: {
      uz: "Yopiq idishdagi gazning bosimi hajm va haroratga qanday bog'liq (Boyl-Mariott, Gey-Lyussak)?",
      ru: "Как давление газа в закрытом сосуде зависит от объёма и температуры (Бойль-Мариотт, Гей-Люссак)?",
    },
    predict: {
      q: { uz: "Harorat o'zgarmasa, hajmni 2 marta kamaytirsak bosim nima bo'ladi?", ru: "Если при постоянной температуре уменьшить объём в 2 раза, что будет с давлением?" },
      options: [
        { uz: "2 marta ortadi", ru: "Увеличится в 2 раза" },
        { uz: "2 marta kamayadi", ru: "Уменьшится в 2 раза" },
        { uz: "O'zgarmaydi", ru: "Не изменится" },
        { uz: "4 marta ortadi", ru: "Увеличится в 4 раза" },
      ],
      answer: 0,
    },
    tasks: {
      uz: ["T = 300 K da hajmni 4, 2, 1 L qilib bosimni yozing", "P·V ko'paytmasiga qarang: nima sezdingiz?", "Hajmni o'zgartirmay haroratni 2 marta oshiring"],
      ru: ["При T = 300 K запишите давление для 4, 2, 1 л", "Посмотрите на P·V: что заметили?", "Не меняя объём, удвойте температуру"],
    },
  },
  {
    id: "flame", subject: "chemistry", grade: "8–9", Sim: FlameTest, plot: null,
    title: { uz: "Alanga rangi bo'yicha metallarni aniqlash", ru: "Определение металлов по цвету пламени" },
    goal: {
      uz: "Har bir metall tuzi alangani o'ziga xos rangga bo'yaydi. Fiyerverklar rangi ham shundan.",
      ru: "Соли каждого металла окрашивают пламя в свой цвет. Отсюда и цвета фейерверков.",
    },
    predict: {
      q: { uz: "Mis (Cu) tuzi alangani qaysi rangga bo'yaydi?", ru: "В какой цвет окрашивает пламя соль меди (Cu)?" },
      options: [
        { uz: "Qizil", ru: "Красный" },
        { uz: "Sariq", ru: "Жёлтый" },
        { uz: "Yashil-ko'k", ru: "Сине-зелёный" },
        { uz: "Binafsha", ru: "Фиолетовый" },
      ],
      answer: 2,
    },
    tasks: {
      uz: ["Barcha 7 ta tuzni sinab, rangini yozing", "Qaysi ikkita metallni rangidan ajratish qiyin?", "Fiyerverkda yashil rang uchun qaysi tuz kerak?"],
      ru: ["Испытайте все 7 солей и запишите цвета", "Какие два металла трудно различить по цвету?", "Какая соль нужна для зелёного фейерверка?"],
    },
  },
  {
    id: "photosynthesis", subject: "biology", grade: "6–7", Sim: Photosynthesis, plot: { x: "light", y: "rate" },
    title: { uz: "Fotosintez: elodeya tajribasi", ru: "Фотосинтез: опыт с элодеей" },
    goal: {
      uz: "Suv o'simligi kislorod pufakchalarini chiqaradi. Yorug'lik, CO₂ va harorat fotosintez tezligiga qanday ta'sir qiladi?",
      ru: "Водное растение выделяет пузырьки кислорода. Как свет, CO₂ и температура влияют на скорость фотосинтеза?",
    },
    predict: {
      q: { uz: "Yorug'likni kuchaytiraversak, pufakchalar soni nima bo'ladi?", ru: "Если усиливать свет всё больше, что будет с числом пузырьков?" },
      options: [
        { uz: "Cheksiz ortaveradi", ru: "Будет расти бесконечно" },
        { uz: "Ortadi, keyin boshqa omil to'xtatib qo'yadi", ru: "Растёт, потом его ограничит другой фактор" },
        { uz: "Kamayadi", ru: "Уменьшится" },
        { uz: "O'zgarmaydi", ru: "Не изменится" },
      ],
      answer: 1,
    },
    tasks: {
      uz: ["Yorug'likni 0 dan 100% gacha o'zgartirib tezlikni yozing", "CO₂ ni 'ko'p' qilib qaytaring", "Suvni 42 °C gacha qizdiring: nima bo'ldi?"],
      ru: ["Меняйте свет от 0 до 100% и записывайте скорость", "Повторите при CO₂ «много»", "Нагрейте воду до 42 °C: что случилось?"],
    },
  },
  {
    id: "osmosis", subject: "biology", grade: "7–9", Sim: Osmosis, plot: { x: "c", y: "vol" },
    title: { uz: "Osmos: hujayra va tuzli eritma", ru: "Осмос: клетка и солевой раствор" },
    goal: {
      uz: "Hujayra turli konsentratsiyali eritmada nega shishadi yoki burishadi? Fiziologik eritma nega 0,9%?",
      ru: "Почему клетка набухает или сморщивается в растворах разной концентрации? Почему физраствор 0,9%?",
    },
    predict: {
      q: { uz: "Eritrotsitni distillangan suvga (0% NaCl) solsak nima bo'ladi?", ru: "Что будет с эритроцитом в дистиллированной воде (0% NaCl)?" },
      options: [
        { uz: "Burishib qoladi", ru: "Сморщится" },
        { uz: "O'zgarmaydi", ru: "Не изменится" },
        { uz: "Shishib, yorilib ketadi", ru: "Набухнет и лопнет" },
        { uz: "Ikkiga bo'linadi", ru: "Разделится надвое" },
      ],
      answer: 2,
    },
    tasks: {
      uz: ["0,5%, 0,9%, 2% eritmada hujayra hajmini yozing", "Piyoz po'stida plazmoliz qachon boshlanadi?", "Nega dengiz suvini ichib bo'lmaydi?"],
      ru: ["Запишите объём клетки в 0,5%, 0,9%, 2% растворе", "Когда в кожице лука начинается плазмолиз?", "Почему нельзя пить морскую воду?"],
    },
  },
  {
    id: "enzyme", subject: "biology", grade: "8–10", Sim: Enzyme, plot: { x: "temp", y: "act" },
    title: { uz: "Fermentlar faolligi", ru: "Активность ферментов" },
    goal: {
      uz: "So'lak amilazasi va oshqozon pepsini qaysi harorat va pH da eng yaxshi ishlaydi? Nega yuqori isitmada ferment ishlamay qoladi?",
      ru: "При какой температуре и pH лучше всего работают амилаза слюны и пепсин? Почему при сильном жаре фермент перестаёт работать?",
    },
    predict: {
      q: { uz: "Amilazani 37 °C dan 70 °C gacha qizdirsak, faolligi nima bo'ladi?", ru: "Если нагреть амилазу с 37 °C до 70 °C, что будет с активностью?" },
      options: [
        { uz: "2 marta ortadi", ru: "Вырастет в 2 раза" },
        { uz: "Deyarli to'xtaydi", ru: "Почти прекратится" },
        { uz: "O'zgarmaydi", ru: "Не изменится" },
      ],
      answer: 1,
    },
    tasks: {
      uz: ["10, 25, 37, 50, 65 °C da faollikni yozing", "Pepsinni pH 7 va pH 2 da solishtiring", "Optimal sharoitni toping"],
      ru: ["Запишите активность при 10, 25, 37, 50, 65 °C", "Сравните пепсин при pH 7 и pH 2", "Найдите оптимальные условия"],
    },
  },
  {
    id: "mendel", subject: "biology", grade: "9–10", Sim: Mendel, plot: null,
    title: { uz: "Mendel qonunlari: no'xat chatishtirish", ru: "Законы Менделя: скрещивание гороха" },
    goal: {
      uz: "Ota-onadan belgilar avlodga qanday o'tadi? Punnet panjarasi bilan bashorat qilib, urug' ekib tekshiramiz.",
      ru: "Как признаки передаются потомству? Предскажем по решётке Пеннета и проверим посевом.",
    },
    predict: {
      q: { uz: "Yy × Yy chatishtirilsa, avlodning qancha qismi yashil (yy) bo'ladi?", ru: "При скрещивании Yy × Yy какая доля потомства будет зелёной (yy)?" },
      options: [{ uz: "Hech biri", ru: "Ни одного" }, { uz: "1/4 qismi", ru: "1/4" }, { uz: "1/2 qismi", ru: "1/2" }, { uz: "3/4 qismi", ru: "3/4" }],
      answer: 1,
    },
    tasks: {
      uz: ["Yy × Yy: 10 ta, keyin 1000 ta urug' eking", "Natija kutilgan 25% ga qachon yaqinroq?", "YY × yy chatishtiring: avlodda yashil bormi?"],
      ru: ["Yy × Yy: посейте 10, затем 1000 семян", "Когда результат ближе к ожидаемым 25%?", "Скрестите YY × yy: есть ли зелёные?"],
    },
  },
];

export const EXP_BY_ID = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e]));
