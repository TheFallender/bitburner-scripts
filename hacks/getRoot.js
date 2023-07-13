/** @typedef {import('../lib').NS} NS */
/** @typedef {import('../lib').Singularity} Singularity */

import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getPortHackers, hackPorts } from './hacks/portHack.js';
import { getScannedServers } from './utils/getServers';

/**
 * Get root access to a server
 * @param {NS} ns
 * @param {string} server
 * @returns {boolean}
*/
export function getRoot(ns, server) {
    // Check if it needs to be hacked
    if (!ns.hasRootAccess(server)) {
        // Check if we can hack it
        if (getPortHackers(ns).length >= ns.getServerNumPortsRequired(server)
        && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server)) {
            // Hack the ports
            hackPorts(ns, server);

            // Nuke
            ns.nuke(server);

            ns.tprintf(`Hacked ${server}`);
        } else
            return false;
    }
    return true;
}

export async function installBackdoor (ns, server) {
    if (!ns.getServer(server).backdoorInstalled) {
        ns.tprintf(`Installing backdoor on ${server}`)
        ns.installBackdoor(server);
    }
}

// Arguments list
const keywordsList = [
    new KeywordArgument(
        ['-s', '--server'],
        'server',
        'The server that should be hacked.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-b', '--backdoor'],
        'backdoor',
        'Install a backdoor on the server.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['--all', '--all-servers'],
        'allServers',
        'Hack all the servers.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
];


/**
 * Do the port operations
 * @param {NS} ns
*/
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    // Server to hack
    let servers = keywordArgs.args.allServers ? getScannedServers(ns) : [keywordArgs.args.server];

    // Get the servers commands
    servers.forEach((server) => {
        if (getRoot(ns, server)) {
            ns.tprintf(`Gained access to ${server}`);
            if (keywordArgs.args.backdoor)
                installBackdoor(ns, server);
        } else
            ns.tprintf(`Could not gain access to ${server}`)
    });
}