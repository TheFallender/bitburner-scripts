/** @typedef {import('../lib').NS} NS */

/** 
 * Get the servers list
 * @param {Number} cost 
 * @returns {string[]}
 */
export function getSuffixOfCost(cost) {
    const dictionaryOfSuffixes = {
        0: '',
        1: 'k',
        2: 'm',
        3: 'b',
        4: 't',
        5: 'q',
        6: 'Q',
        7: 's',
        8: 'S',
        9: 'o',
        10: 'n',
        11: 'd'
    }

    let suffix = 0;
    while (cost > 1000) {
        cost /= 1000;
        suffix++;
    }

    cost = Math.round(cost * 1000) / 1000;

    return "$" + cost + dictionaryOfSuffixes[suffix];
}