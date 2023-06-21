/** @typedef {import('../lib').NS} NS */

import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getPortHackers, hackPorts } from './hacks/portHack.js';

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

// Arguments list
const keywordsList = [
    new KeywordArgument(
        ['-s', '--server'],
        'server',
        'The server that should be hacked.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    )
];


/**
 * Do the port operations
 * @param {NS} ns
*/
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    // Get the servers commands
    if (keywordArgs.args.server) {
        if (getRoot(ns, keywordArgs.args.server))
            ns.tprintf(`Gained access to ${keywordArgs.args.server}`);
        else
            ns.tprintf(`Could not gain access to ${keywordArgs.args.server}`)
    }
}