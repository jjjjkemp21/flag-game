// Regression guard for the fuzzy answer matcher: typing a DIFFERENT real
// country must never be accepted, while genuine typos still pass.
import { checkAnswer, setKnownAnswers } from '../answer_check';

beforeAll(() => {
    setKnownAnswers([
        'Gambia', 'Zambia', 'Iceland', 'Ireland', 'North Korea', 'South Korea',
        'Niger', 'Nigeria', 'Chad', 'France', 'Slovakia', 'Slovenia',
    ]);
});

const flag = (name, aliases = []) => ({ name, aliases });

describe('checkAnswer rejects adjacent wrong countries', () => {
    test('Zambia is not accepted for Gambia', () => {
        expect(checkAnswer('Zambia', flag('Gambia'))).toBe(false);
    });
    test('Ireland is not accepted for Iceland', () => {
        expect(checkAnswer('Ireland', flag('Iceland'))).toBe(false);
    });
    test('North Korea is not accepted for South Korea', () => {
        expect(checkAnswer('North Korea', flag('South Korea'))).toBe(false);
    });
    test('Nigeria is not accepted for Niger', () => {
        expect(checkAnswer('Nigeria', flag('Niger'))).toBe(false);
    });
});

describe('checkAnswer still accepts the right answer + genuine typos', () => {
    test('exact match', () => {
        expect(checkAnswer('Gambia', flag('Gambia'))).toBe(true);
    });
    test('case-insensitive exact match', () => {
        expect(checkAnswer('south korea', flag('South Korea'))).toBe(true);
    });
    test('one-char typo on a longer name passes', () => {
        expect(checkAnswer('Slovaki', flag('Slovakia'))).toBe(true);
    });
    test('alias match', () => {
        expect(checkAnswer('USA', flag('United States', ['USA', 'US']))).toBe(true);
    });
});

describe('strict spelling requires an exact match', () => {
    test('a typo is rejected in strict mode', () => {
        expect(checkAnswer('Slovaki', flag('Slovakia'), true)).toBe(false);
    });
    test('exact still passes in strict mode', () => {
        expect(checkAnswer('Slovakia', flag('Slovakia'), true)).toBe(true);
    });
});
