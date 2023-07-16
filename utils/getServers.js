/** @typedef {import('../lib').NS} NS */

import { homeNode } from './utils/constants';
import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';

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
        ns.getServerMaxMoney(server) == 0;
    });
}

// Keywords list
const keywordsList = [
    new KeywordArgument(
        ['--gs', '--get-servers'],
        'getServers',
        'Get the servers list.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--gt', '--get-targets'],
        'getTargets',
        'Get the targets server list.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--gh', '--get-hacked-servers'],
        'getHackedServers',
        'Get the hacked servers list.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--guh', '--get-unhacked-servers'],
        'getUnhackedServers',
        'Get the unhacked servers list.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--go', '--get-owned-servers'],
        'getOwnedServers',
        'Get the owned servers list.',
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

    // Get the servers commands
    if (keywordArgs.args.getServers) {
        ns.tprintf(`[${getScannedServers(ns).join(', ')}]`);
    } else if (keywordArgs.args.getTargets) {
        ns.tprintf(`[${getTargetServers(ns).join(', ')}]`);
    } else if (keywordArgs.args.getHackedServers) {
        ns.tprintf(`[${getHackedServers(ns).join(', ')}]`);
    } else if (keywordArgs.args.getUnhackedServers) {
        ns.tprintf(`[${getUnhackedServers(ns).join(', ')}]`);
    } else if (keywordArgs.args.getOwnedServers) {
        ns.tprintf(`[${getOwnedServers(ns).join(', ')}]`);
    } else {
        ns.tprintf('Invalid argument. Use -? for help.');
    }
}