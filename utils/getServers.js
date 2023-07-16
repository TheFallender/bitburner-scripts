/** @typedef {import('../lib').NS} NS */

import { homeNode } from './utils/constants';
import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getSuffixOfCost } from './utils/moneySuffix';

/** 
 * Get the servers list
 * @param {NS} ns 
 * @returns {string[]}
 */
export function getScannedServers(ns) {
    // Servers scanned and not scanned
    let listOfScannedServers = [homeNode];
    let listOfNonScannedServers = ns.scan(homeNode);

    // Get full list of scanned servers
    while(listOfNonScannedServers.length > 0) {
        // Get the server to scan
        const serverToScan = listOfNonScannedServers.shift();

        // Add the servers detected
        const serversDetected = ns.scan(serverToScan)
        serversDetected.forEach((server) => {
            if (!listOfScannedServers.includes(server)
                && !listOfNonScannedServers.includes(server)) {
                    listOfNonScannedServers.push(server);
            }
        })

        // Mark it as scanned
        listOfScannedServers.push(serverToScan);
    }

    return listOfScannedServers;
}

/** 
 * Get the servers that can be targeted
 * @param {NS} ns
 * @returns {string[]}
 */
export function getTargetServers(ns) {
    return getScannedServers(ns).filter((server) => {
        return ns.hasRootAccess(server) &&
            ns.getServerMaxMoney(server) > 0;
    });
}

/** 
 * Get the servers that we have already hacked
 * @param {NS} ns 
 * @returns {string[]}
 */
export function getHackedServers(ns) {
    return getScannedServers(ns).filter((server) => {
        return ns.hasRootAccess(server);
    });
}

/** 
 * Get the servers that have yet to be hacked
 * @param {NS} ns 
 * @returns {string[]}
 */
export function getUnhackedServers(ns) {
    return getScannedServers(ns).filter((server) => {
        return !ns.hasRootAccess(server);
    });
}

/** 
 * Get the servers that we own
 * @param {NS} ns 
 * @returns {string[]}
 */
export function getOwnedServers(ns) {
    return getScannedServers(ns).filter((server) => {
        return ns.hasRootAccess(server) &&
        ns.getServerMaxMoney(server) == 0 &&
        ns.getServerMinSecurityLevel(server) == 1;
    });
}

/**
 * Get the servers that we have purchased
 * @param {NS} ns
 * @returns {string[]}
 */
export function getPurchasedServers(ns) {
    return ns.getPurchasedServers();
}

/**
 * Get the servers that are from factions
 * @param {NS} ns
 * @returns {string[]}
 */
export function getFactionServers(ns) {
    let serversWithNoSec = getScannedServers(ns).filter((server) => {
        return ns.getServerMaxMoney(server) == 0 &&
        ns.getServerMinSecurityLevel(server) == 1;
    });
    let purchasedServers = ns.getPurchasedServers();
    return serversWithNoSec.filter((server) => {
        return server !== homeNode && 
        !purchasedServers.includes(server);
    });
}

/**
 * Get the servers that are from hacking organizations
 * @param {NS} ns
 * @returns {string[]}
 */
export function getBackdooredServers(ns) {
    return getScannedServers(ns).filter((server) => {
        return ns.getServer(server).backdoorInstalled;
    });
}

// Keywords list
const keywordsList = [
    new KeywordArgument(
        ['-s', '--server'],
        'server',
        'Get one server.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['--gs', '--get-servers'],
        'getServers',
        'Get the servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--gt', '--get-targets'],
        'getTargets',
        'Get the targets servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--gh', '--get-hacked'],
        'getHacked',
        'Get the hacked servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--guh', '--get-unhacked'],
        'getUnhacked',
        'Get the unhacked servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--go', '--get-owned'],
        'getOwned',
        'Get the owned servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--gp', '--get-purchased'],
        'getPurchased',
        'Get the owned servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--gf', '--get-faction'],
        'getFaction',
        'Get the faction servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--gb', '--get-backdoored'],
        'getBackdoored',
        'Get the backdoored servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['-d', '--data'],
        'data',
        'Get the data of the servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--sd', '--small-data'],
        'smallData',
        'Get the data of the server with less lines.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['-o', '--order'],
        'order',
        'Order the servers alphabetically.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    )
];

/** 
 * Get the server list
 * @param {NS} ns
 */
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    var servers = [];

    // Get the servers commands
    if (keywordArgs.args.server) {
        servers = [keywordArgs.args.server];
        keywordArgs.args.data = true;
    } else if (keywordArgs.args.getTargets) {
        servers = getTargetServers(ns);
    } else if (keywordArgs.args.getHacked) {
        servers = getHackedServers(ns);
    } else if (keywordArgs.args.getUnhacked) {
        servers = getUnhackedServers(ns);
    } else if (keywordArgs.args.getOwned) {
        servers = getOwnedServers(ns);
    } else if (keywordArgs.args.getPurchased) {
        servers = getPurchasedServers(ns);
    } else if (keywordArgs.args.getFaction) {
        servers = getFactionServers(ns);
    } else if (keywordArgs.args.getBackdoored) {
        servers = getBackdooredServers(ns);
    } else {
        servers = getScannedServers(ns);
    }

    // Order the servers
    if (keywordArgs.args.order) {
        servers.sort();
    }

    // Get the data of the servers
    if (keywordArgs.args.data || keywordArgs.args.smallData) {
        servers = servers.map((server) => {
            return ns.getServer(server);
        });
        servers.forEach((server) => {
            ns.tprintf(server.hostname);
            if (keywordArgs.args.data) {
                ns.tprintf(`\t- Cores: ${server.cpuCores}`);
                ns.tprintf(`\t- RAM: ${server.maxRam}GB`);
                ns.tprintf(`\t- Max Money: ${getSuffixOfCost(server.moneyMax)}`);
                ns.tprintf(`\t- Current Money: ${getSuffixOfCost(Math.ceil(server.moneyAvailable))}`);
                ns.tprintf(`\t- Growth Rate: ${server.serverGrowth}`);
                ns.tprintf(`\t- Hack Difficulty: ${Math.ceil(server.hackDifficulty * 100) / 100}`);
                ns.tprintf(`\t- Required Hacking: ${server.requiredHackingSkill}`);
                ns.tprintf(`\t- Backdoor installed: ${server.backdoorInstalled ? 'Yes' : 'No'}`);
                if (server !== servers[servers.length - 1])
                    ns.tprintf('-'.repeat(50));
            } else {
                ns.tprintf(`\t- Cores: ${server.cpuCores} - RAM: ${server.maxRam}GB`);
                ns.tprintf(`\t- Max Money: ${getSuffixOfCost(server.moneyMax)} - Current Money: ${getSuffixOfCost(Math.ceil(server.moneyAvailable))} - Growth Rate: ${server.serverGrowth}`);
                ns.tprintf(`\t- Hack Difficulty: ${Math.ceil(server.hackDifficulty * 100) / 100} - Required Hacking: ${server.requiredHackingSkill} - Backdoor installed: ${server.backdoorInstalled ? 'Yes' : 'No'}`);
            }
        });
    } else {
        ns.tprintf(servers.join('\n'));
    }
}