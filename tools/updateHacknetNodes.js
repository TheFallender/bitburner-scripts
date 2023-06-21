/** @typedef {import('../lib').NS} NS */

import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';

// Keyword list
const keywordsList = [
    new KeywordArgument(
        ['-s', '--servers'],
        'servers',
        'The number of servers to have.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-l', '--level'],
        'level',
        'The level the servers should have.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-r', '--ram'],
        'ram',
        'The ram the servers should have.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-c', '--cores'],
        'cores',
        'The cores the servers should have.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    )
];

// Max things
const MAX_LEVEL = 200;
const MAX_RAM = 64;


/** @param {NS} ns */
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    // Remove the servers under our max ram
    for (let i = 0; i < keywordArgs.args.servers; i++) {
        // Check if it needs to buy a server
        if (i >= ns.hacknet.numNodes()) {
            if (ns.hacknet.purchaseNode() === -1)
                return ns.tprint('Failed to purchase a server.');
        }

        // Check if it needs to upgrade the server
        const nodeInfo = ns.hacknet.getNodeStats(i);

        // Level Check
        if (nodeInfo.level < keywordArgs.args.level) {
            const levelUpgrades = keywordArgs.args.level - nodeInfo.level;
            ns.hacknet.upgradeLevel(i, levelUpgrades);
        }

        // Ram Check
        if (nodeInfo.ram < keywordArgs.args.ram) {
            const ramUpgrades = Math.ceil(Math.log2(keywordArgs.args.ram) - Math.log2(nodeInfo.ram));
            ns.hacknet.upgradeRam(i, ramUpgrades);
        }

        // Core Check
        if (nodeInfo.cores < keywordArgs.args.cores) {
            const coreUpgrades = keywordArgs.args.cores - nodeInfo.cores;
            ns.hacknet.upgradeCore(i, coreUpgrades);
        }   
    }
}