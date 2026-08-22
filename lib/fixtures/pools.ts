/**
 * Справочники для генерации данных.
 *
 * Все имена, банки и телефоны вымышленные. Телефонные префиксы взяты из
 * диапазонов, зарезервированных для кино и драмы (UK Ofcom 7700 900xxx,
 * US 555-01xx), и вдобавок маскируются при выводе — см. maskPhone().
 */

export type Country = {
  code: string;
  flag: string;
  ru: string;
  /** Международный код страны — задаётся явно, не угадывается */
  cc: string;
  /** Абонентский префикс из диапазона, зарезервированного для кино */
  dial: string;
  first: readonly string[];
  last: readonly string[];
  cities: readonly string[];
  banks: readonly string[];
};

export const COUNTRIES: readonly Country[] = [
  {
    code: "DE",
    flag: "🇩🇪",
    ru: "Германия",
    cc: "49",
    dial: "555",
    first: ["Hans", "Klaus", "Ursula", "Manfred", "Ingrid", "Dieter", "Helga", "Wolfgang", "Renate", "Gerhard", "Sabine", "Jürgen"],
    last: ["Söller", "Brandt", "Weissmann", "Kühne", "Ohlert", "Steinbach", "Vogler", "Rausch", "Menzel", "Dahlke"],
    cities: ["München", "Hamburg", "Köln", "Dresden", "Essen", "Bremen"],
    banks: ["Nordwest Sparkasse", "Rheinbank AG", "Volksbank Mitte"],
  },
  {
    code: "GB",
    flag: "🇬🇧",
    ru: "Великобритания",
    cc: "44",
    dial: "7700900",
    first: ["Margaret", "Geoffrey", "Pauline", "Nigel", "Brenda", "Alan", "Doreen", "Colin", "Sheila", "Raymond", "Janet", "Derek"],
    last: ["Whitcombe", "Hargreaves", "Pemberton", "Ashdown", "Bramley", "OKeefe", "Tulloch", "Rennick", "Marlowe", "Fairbrother"],
    cities: ["Leeds", "Bristol", "Norwich", "Plymouth", "Derby", "Swansea"],
    banks: ["Kingsmere Bank", "Northern Trust Union", "Wessex Building Soc."],
  },
  {
    code: "ES",
    flag: "🇪🇸",
    ru: "Испания",
    cc: "34",
    dial: "555",
    first: ["Esteban", "Carmen", "Rafael", "Pilar", "Joaquín", "Mercedes", "Andrés", "Rosario", "Vicente", "Dolores", "Ignacio", "Nuria"],
    last: ["Fernández", "Olmedo", "Carranza", "Bustamante", "Quintero", "Salgado", "Rivas", "Alcántara", "Peñalver", "Cabrera"],
    cities: ["Valencia", "Sevilla", "Zaragoza", "Málaga", "Bilbao", "Murcia"],
    banks: ["Caja Levante", "Banco Peninsular", "Unión Balear"],
  },
  {
    code: "IT",
    flag: "🇮🇹",
    ru: "Италия",
    cc: "39",
    dial: "555",
    first: ["Giuseppe", "Franca", "Alessandro", "Rosanna", "Maurizio", "Antonella", "Sergio", "Loredana", "Pietro", "Graziella"],
    last: ["Zanetti", "Fiorillo", "Marchetti", "Bellini", "Tavani", "Ruggeri", "Colombo", "Grasso", "Perego", "Ventura"],
    cities: ["Torino", "Bologna", "Bari", "Verona", "Padova", "Genova"],
    banks: ["Banca Adriatica", "Credito Lombardo", "Cassa di Risparmio Est"],
  },
  {
    code: "FR",
    flag: "🇫🇷",
    ru: "Франция",
    cc: "33",
    dial: "555",
    first: ["Jean-Pierre", "Monique", "Christophe", "Sylvie", "Bernard", "Danielle", "Gérard", "Martine", "Philippe", "Chantal"],
    last: ["Delacroix", "Ferrand", "Boucher", "Thibault", "Marchand", "Vasseur", "Lemoine", "Aubert", "Rossignol", "Chauvet"],
    cities: ["Lyon", "Nantes", "Toulouse", "Lille", "Rennes", "Dijon"],
    banks: ["Banque du Rhône", "Crédit Aquitain", "Caisse Normande"],
  },
  {
    code: "CA",
    flag: "🇨🇦",
    ru: "Канада",
    cc: "1",
    dial: "2045550",
    first: ["Douglas", "Sharon", "Wayne", "Loretta", "Terrence", "Bernice", "Gordon", "Marlene", "Stuart", "Yvonne"],
    last: ["Kowalchuk", "Boisvert", "Hargrove", "Trembley", "Whitlock", "Desrosiers", "Larocque", "Penner", "Dubois", "Mackey"],
    cities: ["Calgary", "Winnipeg", "Halifax", "Victoria", "Saskatoon", "London ON"],
    banks: ["Prairie Federal", "Maritime Savings", "Dominion Credit Union"],
  },
  {
    code: "NL",
    flag: "🇳🇱",
    ru: "Нидерланды",
    cc: "31",
    dial: "555",
    first: ["Willem", "Annelies", "Hendrik", "Marijke", "Cornelis", "Gerda", "Joost", "Wilhelmina", "Bram", "Truus"],
    last: ["van Dijkhuizen", "Bakhuis", "Verstraeten", "de Ruiter", "Oosterhof", "Klaassen", "Vermeulen", "ten Brink"],
    cities: ["Eindhoven", "Groningen", "Tilburg", "Breda", "Arnhem", "Haarlem"],
    banks: ["Randstad Spaarbank", "Zeeland Krediet", "Noordzee Bank"],
  },
  {
    code: "AU",
    flag: "🇦🇺",
    ru: "Австралия",
    cc: "61",
    dial: "555",
    first: ["Barry", "Cheryl", "Malcolm", "Robyn", "Trevor", "Denise", "Graeme", "Kerrie", "Neville", "Bronwyn"],
    last: ["Whitfield", "Marsden", "Coogan", "Hollingworth", "Bradbury", "Pennington", "Callaghan", "Ostrowski"],
    cities: ["Adelaide", "Newcastle", "Geelong", "Hobart", "Cairns", "Ballarat"],
    banks: ["Southern Cross Mutual", "Darling Savings", "Coastal Credit"],
  },
  {
    code: "SE",
    flag: "🇸🇪",
    ru: "Швеция",
    cc: "46",
    dial: "555",
    first: ["Lennart", "Birgitta", "Bengt", "Margareta", "Sven-Erik", "Kerstin", "Rolf", "Ann-Marie", "Torbjörn", "Ulla"],
    last: ["Lindqvist", "Hedberg", "Sundström", "Wallin", "Åkesson", "Bergqvist", "Nordin", "Falk"],
    cities: ["Uppsala", "Malmö", "Örebro", "Linköping", "Umeå", "Gävle"],
    banks: ["Sparbanken Vast", "Nordkredit AB", "Mälaren Finans"],
  },
  {
    code: "PL",
    flag: "🇵🇱",
    ru: "Польша",
    cc: "48",
    dial: "555",
    first: ["Zbigniew", "Halina", "Kazimierz", "Grażyna", "Ryszard", "Bożena", "Tadeusz", "Elżbieta", "Mirosław", "Danuta"],
    last: ["Wiśniewski", "Kaczmarek", "Zieliński", "Grabowska", "Piotrowski", "Sikora", "Dąbrowski", "Marciniak"],
    cities: ["Wrocław", "Poznań", "Gdańsk", "Katowice", "Lublin", "Szczecin"],
    banks: ["Bank Nadwiślański", "Kasa Spółdzielcza", "Polkredyt SA"],
  },
  {
    code: "NO",
    flag: "🇳🇴",
    ru: "Норвегия",
    cc: "47",
    dial: "555",
    first: ["Odd", "Solveig", "Arne", "Randi", "Bjørn", "Gerd", "Terje", "Astrid", "Knut", "Liv"],
    last: ["Haugland", "Sørensen", "Kristiansen", "Nordbø", "Fjeldstad", "Bakken", "Rønning"],
    cities: ["Bergen", "Trondheim", "Stavanger", "Tromsø", "Drammen"],
    banks: ["Fjordbanken", "Nordkyst Sparebank", "Vestland Kreditt"],
  },
  {
    code: "AT",
    flag: "🇦🇹",
    ru: "Австрия",
    cc: "43",
    dial: "555",
    first: ["Alois", "Waltraud", "Herbert", "Elfriede", "Franz", "Gertrude", "Rudolf", "Hermine"],
    last: ["Gruber", "Hofstetter", "Pichler", "Steinacher", "Wallner", "Baumgartner", "Leitner"],
    cities: ["Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt"],
    banks: ["Alpenbank", "Donau Sparkasse", "Tiroler Volksbank"],
  },
  {
    code: "BE",
    flag: "🇧🇪",
    ru: "Бельгия",
    cc: "32",
    dial: "555",
    first: ["Marc", "Godelieve", "Luc", "Christiane", "Dirk", "Nadine", "Patrick", "Rita"],
    last: ["Vandenberghe", "Peeters", "Dumoulin", "Claes", "Lemmens", "Verhoeven", "Declercq"],
    cities: ["Antwerpen", "Gent", "Brugge", "Liège", "Leuven"],
    banks: ["Banque Wallonne", "Vlaamse Spaarbank", "Meuse Crédit"],
  },
  {
    code: "CH",
    flag: "🇨🇭",
    ru: "Швейцария",
    cc: "41",
    dial: "555",
    first: ["Beat", "Verena", "Ruedi", "Heidi", "Markus", "Silvia", "Urs", "Bettina"],
    last: ["Zbinden", "Aeschlimann", "Bürgi", "Hofmann", "Stucki", "Rickenbach", "Wyss"],
    cities: ["Basel", "Bern", "Luzern", "Winterthur", "Lugano"],
    banks: ["Kantonalbank Ost", "Alpina Privat", "Helvetia Spar"],
  },
  {
    code: "PT",
    flag: "🇵🇹",
    ru: "Португалия",
    cc: "351",
    dial: "555",
    first: ["Joaquim", "Fernanda", "Manuel", "Conceição", "Armando", "Lurdes", "Rui", "Amélia"],
    last: ["Figueiredo", "Nogueira", "Mendonça", "Teixeira", "Braga", "Cardoso", "Esteves"],
    cities: ["Porto", "Braga", "Coimbra", "Faro", "Setúbal"],
    banks: ["Caixa do Norte", "Banco Atlântico Sul", "Crédito Lusitano"],
  },
  {
    code: "IE",
    flag: "🇮🇪",
    ru: "Ирландия",
    cc: "353",
    dial: "555",
    first: ["Seamus", "Bridget", "Declan", "Maureen", "Padraig", "Siobhan", "Eamon", "Nuala"],
    last: ["OSullivan", "Gallagher", "Fitzpatrick", "Donnelly", "MacNamara", "Curran", "Boyle"],
    cities: ["Cork", "Galway", "Limerick", "Waterford", "Kilkenny"],
    banks: ["Shannon Mutual", "Éire Savings", "Leinster Credit Union"],
  },
] as const;

/** Инструменты в фейковом терминале */
export const INSTRUMENTS = [
  { symbol: "BTC/USD", name: "Bitcoin", price: 71420, digits: 0 },
  { symbol: "ETH/USD", name: "Ethereum", price: 3812, digits: 0 },
  { symbol: "XAU/USD", name: "Золото", price: 2418.6, digits: 2 },
  { symbol: "EUR/USD", name: "Евро", price: 1.0842, digits: 4 },
  { symbol: "GBP/USD", name: "Фунт", price: 1.2731, digits: 4 },
  { symbol: "NVDA", name: "NVIDIA", price: 1184.2, digits: 2 },
  { symbol: "TSLA", name: "Tesla", price: 248.9, digits: 2 },
  { symbol: "WTI/USD", name: "Нефть WTI", price: 78.42, digits: 2 },
] as const;

/** Псевдонимы операторов — под страну звонка, как в реальных центрах */
export const AGENT_ALIASES = [
  "Mary Roberts", "Esteban Fernandez", "Hans Söller", "Daniel Kruger",
  "Sophie Laurent", "Marco Bianchi", "Anna Kowalska", "Peter Lindqvist",
  "James Whitfield", "Elena Novak", "Thomas Berger", "Claire Dubois",
  "Viktor Adler", "Nina Sorensen", "Robert Klein", "Julia Meier",
  "Adam Foster", "Lucas Moreau", "Irina Kovac", "Martin Voss",
] as const;

/** Настоящие имена операторов — в админке видны обе колонки */
export const AGENT_REAL = [
  "Айдар Т.", "Марат С.", "Дина К.", "Ержан Б.", "Алина Р.",
  "Тимур Ж.", "Сауле М.", "Данияр А.", "Камила Н.", "Руслан О.",
  "Асель Д.", "Нурлан И.", "Жанна П.", "Олег В.", "Динара Х.",
  "Артём Л.", "Мадина Е.", "Санжар У.", "Виктория Ц.", "Бекзат Ф.",
] as const;

/** Заметки предыдущего агента — живой язык, как в реальной CRM */
export const LEAD_NOTES = [
  "Пенсионер, продал квартиру. Деньги на депозите в банке. Готов заходить.",
  "Жена против. Работать через «инвестиционный клуб», не говорить слово брокер.",
  "Уже терял на крипте в 2021. Осторожный, но жадный. Давить на «отыграться».",
  "Владеет автосервисом. Наличка есть. Просит документы — выслал лицензию.",
  "Не берёт трубку с 14:00. Пробовать с другого номера, вечером после 19:00.",
  "Согласился на 250$. Карта отклонилась 2 раза — увести на альтернативную оплату.",
  "Спрашивал про регулятора. Ответ по скрипту №4. Успокоился.",
  "Хочет вывести 5 000$. Тянуть, ссылаться на верификацию документов.",
  "Дочь работает в банке — риск. Не звонить в выходные.",
  "Наследство 180 тыс. Пока думает. Прогревать через «аналитику» в мессенджере.",
  "Заходил трижды. Готов на маржин-колл, потом предложить «страховой депозит».",
  "Русский язык плохо. Переключить на английский деск.",
  "Просил телефон офиса. Дал номер техподдержки, звонок перехватывать.",
  "Продаёт участок, деньги будут через 2 недели. Держать в тепле, звонить раз в 3 дня.",
  "Сильный отказник. Угрожал полицией. В чёрный список на 30 дней.",
  "Клиент под контролем. RemoteView стоит, доступ к почте есть.",
  "Взял кредит под 24%. Не упоминать кредит в разговоре.",
  "Верит в «личного аналитика». Держать легенду, звонить только с одного номера.",
] as const;

/** Заголовки скриптов на левой панели CRM */
export const SCRIPTS = [
  "Первый контакт · холодный",
  "Возражение «я подумаю»",
  "Возражение «это мошенники»",
  "Дожим первого депозита $250",
  "Апгрейд до Gold",
  "Отказ в выводе · налог 10%",
  "Возврат отказника (30+ дней)",
  "Работа с родственниками клиента",
] as const;

/** Города для точек на карте мира: [долгота, широта, вес] */
export const CALL_ORIGINS: readonly (readonly [number, number, string])[] = [
  [13.4, 52.5, "DE"], [-0.12, 51.5, "GB"], [-3.7, 40.4, "ES"],
  [12.5, 41.9, "IT"], [2.35, 48.85, "FR"], [-79.4, 43.7, "CA"],
  [4.9, 52.37, "NL"], [151.2, -33.87, "AU"], [18.07, 59.33, "SE"],
  [21.0, 52.23, "PL"], [10.75, 59.91, "NO"], [16.37, 48.21, "AT"],
  [4.35, 50.85, "BE"], [8.54, 47.37, "CH"], [-9.14, 38.72, "PT"],
  [-6.26, 53.35, "IE"], [-123.1, 49.28, "CA"], [-73.57, 45.5, "CA"],
  [9.99, 53.55, "DE"], [2.17, 41.39, "ES"], [-2.24, 53.48, "GB"],
  [144.96, -37.81, "AU"], [11.58, 48.14, "DE"], [-1.55, 47.22, "FR"],
] as const;
