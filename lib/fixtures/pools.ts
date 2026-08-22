/**
 * Справочники для генерации данных.
 *
 * Все имена, банки и телефоны вымышленные. Телефонные префиксы взяты из
 * диапазонов, зарезервированных для кино и драмы (UK Ofcom 7700 900xxx,
 * US 555-01xx), и вдобавок маскируются при выводе — см. maskPhone().
 */

import type { Rng } from "@/lib/prng";

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
  /**
   * Женские имена и фамилии. Обязательны для кириллицы: «Сауле Досжанов» —
   * первое, что выдаёт сгенерированную базу на крупном плане.
   * lastF можно не задавать, если фамилии не склоняются (укр. Ковальчук).
   */
  firstF?: readonly string[];
  lastF?: readonly string[];
  cities: readonly string[];
  banks: readonly string[];
  /**
   * Вес при выборе страны лида. По умолчанию 1.
   * У стран СНГ он выше: сериал русскоязычный, и в крупном плане должны
   * читаться свои имена, города и банки, а не только европейские.
   */
  weight?: number;
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
  {
    code: "RU",
    flag: "🇷🇺",
    ru: "Россия",
    cc: "7",
    dial: "555",
    weight: 4,
    first: ["Николай", "Геннадий", "Владимир", "Анатолий", "Сергей", "Виктор", "Аркадий", "Валерий"],
    last: ["Ковалёв", "Сухарев", "Жигулин", "Кузьмин", "Селиванов", "Тарасов", "Панкратов", "Ерофеев", "Овчинников", "Дьяконов"],
    firstF: ["Валентина", "Людмила", "Тамара", "Галина", "Нина", "Раиса", "Зоя", "Антонина"],
    lastF: ["Ковалёва", "Сухарева", "Жигулина", "Кузьмина", "Селиванова", "Тарасова", "Панкратова", "Ерофеева", "Овчинникова", "Дьяконова"],
    cities: ["Новосибирск", "Екатеринбург", "Самара", "Воронеж", "Пермь", "Тюмень", "Саратов"],
    banks: ["Северный Тракт Банк", "Приволжский Кредит-Союз", "Регион-Сберкасса"],
  },
  {
    code: "KZ",
    flag: "🇰🇿",
    ru: "Казахстан",
    cc: "7",
    dial: "555",
    weight: 3,
    first: ["Ержан", "Нурлан", "Данияр", "Марат", "Кайрат", "Талгат", "Серик", "Бауыржан"],
    last: ["Сериков", "Нурпеисов", "Досжанов", "Мукашев", "Сагындыков", "Байтурсынов", "Жумабаев", "Ермеков", "Алтынбеков", "Кабылбеков"],
    firstF: ["Сауле", "Гульмира", "Айнур", "Жанна", "Динара", "Бахыт", "Алия", "Гульнар"],
    lastF: ["Серикова", "Нурпеисова", "Досжанова", "Мукашева", "Сагындыкова", "Байтурсынова", "Жумабаева", "Ермекова", "Алтынбекова", "Кабылбекова"],
    cities: ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Павлодар", "Костанай"],
    banks: ["Сарыарка Банк", "Степной Кредит", "Ирбис Финанс Групп"],
  },
  {
    code: "UA",
    flag: "🇺🇦",
    ru: "Украина",
    cc: "380",
    dial: "555",
    weight: 3,
    first: ["Богдан", "Тарас", "Володимир", "Петро", "Микола", "Остап", "Андрій", "Василь"],
    last: ["Ковальчук", "Бондаренко", "Мельничук", "Гриценко", "Ткаченко", "Панасюк", "Литвиненко", "Савчук", "Дорошенко", "Кравець"],
    // Фамилии на -ко, -ук и -ець в женском роде не меняются — lastF не нужен
    firstF: ["Оксана", "Наталя", "Ірина", "Леся", "Галина", "Марія", "Олена", "Зоряна"],
    cities: ["Львів", "Одеса", "Харків", "Дніпро", "Полтава", "Вінниця", "Чернівці"],
    banks: ["Дніпро-Кредит", "Карпатський Банк", "Слобожанська Каса"],
  },
  {
    code: "UZ",
    flag: "🇺🇿",
    ru: "Узбекистан",
    cc: "998",
    dial: "555",
    weight: 2,
    first: ["Алишер", "Бахтиёр", "Шухрат", "Фаррух", "Улугбек", "Санжар", "Отабек", "Жасур"],
    last: ["Юлдашев", "Абдуллаев", "Нурматов", "Исмоилов", "Эргашев", "Мирзаев", "Рахимов", "Тошматов", "Хамидов", "Саидов"],
    firstF: ["Дилноза", "Нилуфар", "Гулнора", "Зульфия", "Мохира", "Феруза", "Малика", "Севара"],
    lastF: ["Юлдашева", "Абдуллаева", "Нурматова", "Исмоилова", "Эргашева", "Мирзаева", "Рахимова", "Тошматова", "Хамидова", "Саидова"],
    cities: ["Ташкент", "Самарканд", "Бухара", "Наманган", "Андижан", "Фергана", "Нукус"],
    banks: ["Зарафшон Банк", "Согдиана Кредит", "Чирчик Финанс"],
  },
  {
    code: "BY",
    flag: "🇧🇾",
    ru: "Беларусь",
    cc: "375",
    dial: "555",
    weight: 2,
    first: ["Аркадий", "Станислав", "Иван", "Леонид", "Михаил", "Валерий", "Генрих", "Алесь"],
    last: ["Дубровский", "Пашкевич", "Ермолович", "Савицкий", "Мицкевич", "Хмелевский", "Барановский", "Радкевич", "Шпак", "Гурский"],
    firstF: ["Валентина", "Тамара", "Зинаида", "Ядвига", "Алеся", "Галина", "Ирина", "Мария"],
    lastF: ["Дубровская", "Пашкевич", "Ермолович", "Савицкая", "Мицкевич", "Хмелевская", "Барановская", "Радкевич", "Шпак", "Гурская"],
    cities: ["Минск", "Гомель", "Витебск", "Гродно", "Брест", "Могилёв", "Бобруйск"],
    banks: ["Нёманский Кредит", "Полесье Банк", "Двина Сберкасса"],
  },
  {
    code: "KG",
    flag: "🇰🇬",
    ru: "Кыргызстан",
    cc: "996",
    dial: "555",
    weight: 2,
    first: ["Азамат", "Бакыт", "Нурбек", "Талант", "Эрмек", "Кубаныч", "Улан", "Мирлан"],
    last: ["Асанбеков", "Мамытов", "Сыдыков", "Осмонов", "Байсалов", "Турдубеков", "Жээнбеков", "Абдырахманов", "Керимбеков", "Токтогулов"],
    firstF: ["Гульнара", "Айгуль", "Жылдыз", "Бурул", "Асель", "Салтанат", "Айнура", "Чолпон"],
    lastF: ["Асанбекова", "Мамытова", "Сыдыкова", "Осмонова", "Байсалова", "Турдубекова", "Жээнбекова", "Абдырахманова", "Керимбекова", "Токтогулова"],
    cities: ["Бишкек", "Ош", "Джалал-Абад", "Каракол", "Токмок", "Нарын"],
    banks: ["Ала-Арча Банк", "Тенир-Тоо Кредит", "Сары-Челек Финанс"],
  },
  {
    code: "TJ",
    flag: "🇹🇯",
    ru: "Таджикистан",
    cc: "992",
    dial: "555",
    weight: 2,
    first: ["Фаррух", "Джамшед", "Рустам", "Умед", "Сухроб", "Далер", "Фируз", "Хайрулло"],
    last: ["Сафаров", "Юсупов", "Холов", "Ниёзов", "Гулов", "Одинаев", "Шарипов", "Давлатов", "Раджабов", "Мирзоев"],
    firstF: ["Мехрангез", "Зарина", "Нигина", "Мавлуда", "Шахло", "Ситора", "Парвина", "Дилафруз"],
    lastF: ["Сафарова", "Юсупова", "Холова", "Ниёзова", "Гулова", "Одинаева", "Шарипова", "Давлатова", "Раджабова", "Мирзоева"],
    cities: ["Душанбе", "Худжанд", "Куляб", "Бохтар", "Истаравшан", "Турсунзаде"],
    banks: ["Памир Кредит", "Вахш Банк", "Зеравшан Савдо"],
  },
] as const;

/**
 * Выбор страны лида с учётом веса.
 *
 * Все экраны берут страну только отсюда: лента событий на стене, карточки
 * лидов и заявки на вывод в админке должны показывать один и тот же
 * географический состав базы, иначе в монтаже это бросается в глаза.
 */
export function pickCountry(rng: Rng): Country {
  return rng.weighted(COUNTRIES.map((c) => [c, c.weight ?? 1] as const));
}

/**
 * Имя лида. Пол выбирается один раз, имя и фамилия берутся из одного набора:
 * иначе в кириллице получается «Сауле Досжанов», и база сразу выглядит
 * сгенерированной. У латиницы согласование не требуется — там один список.
 */
export function pickName(rng: Rng, country: Country): string {
  if (country.firstF && rng.chance(0.5)) {
    return `${rng.pick(country.firstF)} ${rng.pick(country.lastF ?? country.last)}`;
  }
  return `${rng.pick(country.first)} ${rng.pick(country.last)}`;
}

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
  // Русскоязычный деск — под него отдельный набор легенд
  "Алексей Громов", "Марина Соболева", "Игорь Ветров", "Ольга Дементьева",
  "Сергей Панов", "Екатерина Ланская", "Дмитрий Астахов", "Наталья Верещагина",
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
  "Пенсия 14-го числа. Звонить в день зачисления, до обеда, пока деньги на карте.",
  "Продал «Камри», деньги дома наличкой. Уговорить на перевод через обменник.",
  "Сын в Москве на вахте, присылает переводы. Работать, пока сын не в курсе.",
  "Держит сбережения в долларах под матрасом. Тема — «защита от девальвации».",
  "Ходит в мечеть, про проценты не говорить. Легенда — «доля в партнёрстве».",
  "Заняла у соседей на второй заход. Долг не обсуждать, давить на «вот-вот выйдем в плюс».",
  "Дочь в Бишкеке, звонит каждый вечер. Успеть закрыть до 19:00.",
  "Просит договор на русском. Выслать шаблон PDF, подпись не требовать.",
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
  // СНГ — сюда уходит больше половины звонков, поэтому точек тоже больше
  [37.62, 55.76, "RU"], [30.52, 50.45, "UA"], [27.56, 53.9, "BY"],
  [69.24, 41.31, "UZ"], [74.6, 42.87, "KG"], [68.79, 38.56, "TJ"],
  [71.43, 51.13, "KZ"], [82.93, 55.03, "RU"], [60.6, 56.84, "RU"],
  [30.73, 46.48, "UA"], [23.94, 49.84, "UA"], [31.0, 52.42, "BY"],
  [66.96, 39.65, "UZ"], [72.79, 40.53, "KG"], [69.6, 42.36, "KZ"],
] as const;
