/** @typedef {import('../lib').NS} NS */

import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getSuffixOfCost } from './utils/moneySuffix';

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
    ),
    new KeywordArgument(
        ['-m', '--cost', '--money'],
        'moneyCost',
        'The money cost of the upgrade to the servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    )
];

// Max things
const MAX_LEVEL = 200;
const MAX_RAM = 64;
const MAX_CORES = 16;


/** @param {NS} ns */
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    let upgradeCost = 0;

    let ceilServers = keywordArgs.args.servers - ns.hacknet.numNodes();
    if (ceilServers > ns.hacknet.maxNumNodes())
        ceilServers = ns.hacknet.maxNumNodes() - ns.hacknet.numNodes();

    for (let i = 0; i < ceilServers; i++) {
        if (keywordArgs.args.moneyCost)
            upgradeCost += ns.hacknet.getPurchaseNodeCost() * (1.85**i);
        else if (ns.hacknet.purchaseNode() === -1)
            return ns.tprint('Failed to purchase a server.');
    }

    // Uprade the servers
    for (let i = 0; i < keywordArgs.args.servers && i < ns.hacknet.numNodes() && ceilServers == 0; i++) {
        // Check if it needs to upgrade the server
        const nodeInfo = ns.hacknet.getNodeStats(i);

        // Level Check
        if (nodeInfo.level < keywordArgs.args.level) {
            const ceilUpgrade = keywordArgs.args.level > MAX_LEVEL ? MAX_LEVEL : keywordArgs.args.level;
            const upgradesNum = ceilUpgrade - nodeInfo.level;
            if (keywordArgs.args.moneyCost)
                upgradeCost += ns.hacknet.getLevelUpgradeCost(i, upgradesNum);
            else
                ns.hacknet.upgradeLevel(i, upgradesNum);
        }

        // Ram Check
        if (nodeInfo.ram < keywordArgs.args.ram) {
            const ceilUpgrade = keywordArgs.args.ram > MAX_RAM ? MAX_RAM : keywordArgs.args.ram;
            const upgradesNum = Math.ceil(Math.log2(ceilUpgrade) - Math.log2(nodeInfo.ram));
            if (keywordArgs.args.moneyCost)
                upgradeCost += ns.hacknet.getRamUpgradeCost(i, upgradesNum);
            else
                ns.hacknet.upgradeRam(i, upgradesNum);
        }

        // Core Check
        if (nodeInfo.cores < keywordArgs.args.cores) {
            const ceilUpgrade = keywordArgs.args.cores > MAX_CORES ? MAX_CORES : keywordArgs.args.cores;
            const upgradesNum = ceilUpgrade - nodeInfo.cores;
            if (keywordArgs.args.moneyCost)
                upgradeCost += ns.hacknet.getCoreUpgradeCost(i, upgradesNum);
            else
                ns.hacknet.upgradeCore(i, upgradesNum);
        }
    }

    // Print the cost
    if (keywordArgs.args.moneyCost) {
        let printCostStr = '';
        if (keywordArgs.args.servers > ns.hacknet.numNodes())
            printCostStr = 'Purchase Cost of the new servers (no upgrades included): ' + getSuffixOfCost(upgradeCost);
        else
            printCostStr = 'Upgrade Cost of the current servers ' + getSuffixOfCost(upgradeCost);
        ns.tprintf(printCostStr);
    }
}