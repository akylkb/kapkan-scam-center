/**
 * Имитирует человеческий ввод текста в HTML-элемент.
 * 
 * @param {HTMLElement} element - Элемент формы (input, textarea).
 * @param {string} text - Текст для ввода.
 * @param {Object} options - Настройки задержек и ошибок.
 */
async function typeLikeAHuman(text, options = {}) {
  const element = document.querySelector('._typeMessage');
  const {
    minDelay = 50,      // Минимальная задержка между нажатиями (мс)
    maxDelay = 200,     // Максимальная задержка (мс)
    errorChance = 0.05, // Вероятность сделать опечатку (5%)
    alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
  } = options;

  // Вспомогательная функция задержки
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Вспомогательная функция случайного числа
  const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Функция добавления/удаления символов с генерацией реальных событий ввода
  function insertChar(char) {
    element.focus();
    
    // Если это Backspace
    if (char === 'Backspace') {
      element.value = element.value.slice(0, -1);
    } else {
      element.value += char;
    }

    // Инициируем событие input, чтобы фреймворки (React, Vue и т.д.) увидели изменения
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Имитация опечатки
    if (Math.random() < errorChance && /[a-zA-яа-я]/i.test(char)) {
      const wrongChar = alphabet[getRandom(0, alphabet.length - 1)];
      insertChar(wrongChar);
      await sleep(getRandom(minDelay, maxDelay));

      // Нажимаем «Backspace» для исправления
      insertChar('Backspace');
      await sleep(getRandom(100, 250));
    }

    // Ввод правильного символа
    insertChar(char);

    // Пауза после знаков препинания чуть длиннее
    if (['.', ',', '!', '?', '\n'].includes(char)) {
      await sleep(getRandom(300, 700));
    } else {
      await sleep(getRandom(minDelay, maxDelay));
    }
  }
}

typeLikeAHuman('Акча түштүбү?')