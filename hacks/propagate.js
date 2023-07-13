/** @typedef {import('../lib').NS} NS */

import { homeNode, hackScript, propagateScript, ramToLeave } from './utils/constants';
import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getHackedServers, getUnhackedServers } from './utils/getServers';
import { getDeepImports } from './utils/copyDependencies';
import { getRoot } from './hacks/getRoot';

// Arguments list
const keywordsList = [
    new KeywordArgument(
        ['-f', '--file'],
        'file',
        'The file to spread and run.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-r', '--ram'],
        'ram',
        'The ram to leave on the server.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
];

/** 
 * Propagate and run the hack script to all the servers
 * @param {NS} ns 
 */
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    // Kill all the scripts
    ns.killall(homeNode, true);

    // Script to spread
    const fileToSpread = keywordArgs.args.file ? keywordArgs.args.file : hackScript;

    // Get the file to spread
    const hackScriptRamUse = ns.getScriptRam(fileToSpread);

    // Imports of the file to spread
    const imports = getDeepImports(ns, fileToSpread);

    // Try to hack the unrooted servers
    getUnhackedServers(ns).forEach((server) => {getRoot(ns, server);});

    // Get the hacked servers
    const servers = getHackedServers(ns);

    // Try to see if it is worth hacking them
    servers.forEach((server) => {
        runOnMachine(ns, server, fileToSpread, hackScriptRamUse, imports);
    })

    // Periodically check for new servers to hack
    while (true) {
        await ns.sleep(20000);

        // Add the new servers to the list
        getUnhackedServers(ns).forEach((server) => {
            if (getRoot(ns, server)) {
                runOnMachine(ns, server, fileToSpread, hackScriptRamUse, imports)
            }
        });
    }
}

function runOnMachine(ns, server, fileToSpread, hackScriptRamUse, imports) {
    // Kill all scripts
    ns.killall(server, true);

    // Overwrite all the scripts in each server
    if (server !== homeNode) {
        ns.scp(fileToSpread, server, homeNode);
        imports.forEach((importedFile) => {
            ns.scp(importedFile, server, homeNode);
        });
    }

    // Run Max instances
    const serverRam = ns.getServerMaxRam(server);

    // Get the instances available
    let scriptInstancesAvailable = 
        Math.floor(
            (serverRam - (server === homeNode ? ramToLeave : 0))
        / hackScriptRamUse);

    if (scriptInstancesAvailable < 1) {
        ns.tprintf(`Not enough ram on ${server} to run ${fileToSpread}`);
        return;
    }

    // Run the script
    ns.tprintf(`Running ${fileToSpread} on ${server} with ${scriptInstancesAvailable} instances.`);
    ns.exec(fileToSpread, server, scriptInstancesAvailable);
}