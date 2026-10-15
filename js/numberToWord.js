const POSITIONS_MAP = {
    '1': 'ett',
    '2': 'två',
    '3': 'tre',
    '4': 'fyra',
    '5': 'fem',
    '6': 'sex',
    '7': 'sju',
    '8': 'åtta',
    '9': 'nio',
    '10': 'tio',
    '11': 'elva',
    '12': 'tolv',
    '13': 'tretton',
    '14': 'fjorton',
    '15': 'femton',
    '16': 'sexton',
    '17': 'sjutton',
    '18': 'arton',
    '19': 'nitton',
    '20': 'tjugo',
    '30': 'trettio',
    '40': 'fyrtio',
    '50': 'femtio',
    '60': 'sextio',
    '70': 'sjuttio',
    '80': 'åttio',
    '90': 'nittio'
};

const NUMERALS_MAP = {
    3: { singular: 'tusen', plural: 'tusen' },
    6: { singular: 'miljon', plural: 'miljoner' },
    9: { singular: 'miljard', plural: 'miljarder' },
    12: { singular: 'biljon', plural: 'biljoner' },
    15: { singular: 'biljard', plural: 'biljarder' },
    18: { singular: 'triljon', plural: 'triljoner' },
    21: { singular: 'triljard', plural: 'triljarder' }
};

const getNumberPeriods = (numberAsString, periodSize = 3) => {

    const periods = [];

    // Move backwards in the number in periodSize steps
    for (let i = numberAsString.length - 1; i >= 0; i -= periodSize) {

        // Start new period
        let period = '';

        // Add digits to period
        for (let j = i; j > i - periodSize && j >= 0; j--) {
            period = numberAsString.charAt(j) + period;
        }

        // Add period first in the list
        periods.unshift(period);
    }

    return periods;
};

const getWordFromNumber = number => {

    // Check special case zero
    if (number === 0) return 'noll';

    // Build the word
    const numberAsString = number.toString();
    const wordArray = [];

    buildWordFromNumber(numberAsString, wordArray);
    const word = wordArray.join('');

    // Return word
    return word;
};

const buildWordFromNumber = (numberAsString, wordArray) => {

    // Check if any number at all
    if (numberAsString.length === 0) return;

    // Check if first digit zero
    // If it is, continue with rest of number
    if (numberAsString.charAt(0) === '0') {
        buildWordFromNumber(numberAsString.slice(1), wordArray);
        return;
    }

    // The current position
    const position = numberAsString.length - 1;

    if (position === 0) {
        // Ones position

        // Add final digit
        wordArray.push(POSITIONS_MAP[numberAsString]);

    } else if (position === 1) {
        // Tens position

        // Get the first digit character and value
        const placeOneChar = numberAsString.charAt(0);
        const placeOneValue = parseInt(placeOneChar);

        // Check value at tens position
        // If it is less than 2 (numbers below 20) the number has a specific name 
        if (placeOneValue < 2) {
            // Get word from map
            const lessThanTwentyWord = POSITIONS_MAP[numberAsString];
            wordArray.push(lessThanTwentyWord);

            // Continue with the rest of the number
            buildWordFromNumber(numberAsString.slice(2), wordArray);
        } else {
            // Get word from map
            // (adding a zero to the first digit character)
            const greaterThanNineteenWord = POSITIONS_MAP[placeOneChar + '0'];
            wordArray.push(greaterThanNineteenWord);

            // Continue with the rest of the number
            buildWordFromNumber(numberAsString.slice(1), wordArray);
        }

    } else if (position === 2) {
        // Hundreds position

        // Get the hundreds digit
        const hundredsDigit = POSITIONS_MAP[numberAsString.charAt(0)];

        // Add hundreds digit and the numeral 'hundra'
        wordArray.push(hundredsDigit, 'hundra');

        // Continue with the rest of the number
        buildWordFromNumber(numberAsString.slice(1), wordArray);

    } else {

        // Get the periods of the number
        const periods = getNumberPeriods(numberAsString);
        const numberOfPeriods = periods.length;

        // For all periods exept the last one
        // (the ones with a numeral added to them)
        for (let i = 0; i < periods.length - 1; i++) {

            const period = periods[i];
            const periodWordArray = [];

            // Get the word for the period
            buildWordFromNumber(period, periodWordArray);
            let periodWord = periodWordArray.join('');

            // If the period is not all zeros
            if (periodWord !== '') {

                // Get the numeral id (the corresponding number of zeros)
                const numeralId = (numberOfPeriods - 1 - i) * 3;
                let numeral = NUMERALS_MAP[numeralId].plural;

                // Check the period word
                // If it is 'ett', some modifications are required
                if (periodWord === 'ett') {
                    // Modify numeral to singular form
                    numeral = NUMERALS_MAP[numeralId].singular;
                    // If numeral is not 'tusen', change period word to 'en'
                    // If numeral is 'tusen', remove the superfluous 't'
                    periodWord = numeral !== 'tusen' ? 'en' : 'et';
                }

                // Add period word and numeral
                wordArray.push(periodWord, numeral);
            }
        }

        // Get the word for the last period
        const lastPeriod = periods[numberOfPeriods - 1];
        const lastPeriodWordArray = [];
        buildWordFromNumber(lastPeriod, lastPeriodWordArray);
        const lastPeriodWord = lastPeriodWordArray.join('');

        // Add last period word
        wordArray.push(lastPeriodWord);
    }
};