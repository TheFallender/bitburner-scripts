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

/** 
 * Propagate and run the hack script to all the servers
 * @param {NS} ns 
 * @param {string} server
 * @param {string} fileToSpread
 * @param {number} hackScriptRamUse
 * @param {string[]} imports
 */
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
    let scriptInstancesAvailable = Math.floor(serverRam / hackScriptRamUse);
    if (server === homeNode) {
        let ramLeft = ramToLeave;
        if (ramLeft > serverRam) {
            ramLeft = serverRam / 4;
        }
        ramLeft += ns.getScriptRam(propagateScript);
        scriptInstancesAvailable = Math.floor((serverRam - ramLeft) / hackScriptRamUse);
    }

    // Check if we have enough ram
    if (scriptInstancesAvailable < 1) {
        ns.tprintf(`${server} - Not enough ram to run ${fileToSpread}`);
        return;
    }

    // Thread split
    const threadSplit = 100;

    // Print thread usage
    ns.tprintf(`${server} - Running ${fileToSpread} with ${scriptInstancesAvailable} instances.`);
    if (scriptInstancesAvailable >= threadSplit) {
        if (scriptInstancesAvailable >= (threadSplit * 2))
            ns.tprintf(`\t- ${Math.floor(scriptInstancesAvailable / threadSplit) - 1} batches of ${threadSplit} threads.`);
        if (scriptInstancesAvailable % threadSplit !== 0)
            ns.tprintf(`\t- ${(scriptInstancesAvailable % threadSplit) + threadSplit} extra threads.`);
    }

    // Run batches of threadSplit instances
    for (;scriptInstancesAvailable > 0; scriptInstancesAvailable -= threadSplit) {
        let threads = threadSplit;
        if (scriptInstancesAvailable < (threadSplit * 2)) {
            threads = scriptInstancesAvailable;
            scriptInstancesAvailable = 0;
        }
        ns.exec(fileToSpread, server, threads);
    }
}