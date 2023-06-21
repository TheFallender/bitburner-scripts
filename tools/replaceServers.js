/** @typedef {import('../lib').NS} NS */

import { homeNode, homeServers } from './utils/constants';
import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getOwnedServers } from './utils/getServers';

// Arguments list
const keywordsList = [
    new KeywordArgument(
        ['-s', '--servers'],
        'servers',
        'The number of servers to buy.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR,
    ),
    new KeywordArgument(
        ['-r', '--ram'],
        'ram',
        'The ram of the servers to purchase.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR,
    ),
    new KeywordArgument(
        ['-n', '--name'],
        'name',
        'The name of the servers to buy.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR,
    ),
    new KeywordArgument(
        ['--rename'],
        'rename',
        'The name to rename the servers to.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR,
    ),
];

/** @param {NS} ns */
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    // Servers limit
    const maxServers = 25;

    // Get the list of targets
    let servers = getOwnedServers(ns).filter((server) => {
        return server !== homeNode;
    });

    // Rename the servers
    if (keywordArgs.args.rename) {
        for (let i = 0; i < servers.length; i++) {
            const index = i < 10 ? '0' + i : i;
            const serverName = keywordArgs.args.rename + index;
            ns.killall(servers[i], false);
            ns.renamePurchasedServer(servers[i], serverName);
            ns.tprintf(`Renamed ${servers[i]} to ${serverName}`);
        }
    } else if (keywordArgs.args.servers && keywordArgs.args.ram) {        
        // Delete the servers we don't need
        servers.forEach((server) => {
            const serverRam = ns.getServerMaxRam(server);
            if (serverRam < keywordArgs.args.ram) {
                ns.killall(server, false);
                ns.deleteServer(server);
                ns.tprintf(`Deleted ${server} with ${serverRam}GB of RAM. It was ${keywordArgs.args.ram - serverRam}GB too small.`);
            }
        });

        // Add the servers we need
        const nameBase = keywordArgs.args.name ? keywordArgs.args.name : homeServers;
        for (let i = 0; i < keywordArgs.args.servers && i < maxServers; i++) {
            const index = i < 10 ? '0' + i : i;
            const serverName = nameBase + index;
            if (servers.includes(serverName)) {
                keywordArgs.args.servers++;
                continue;
            }
            ns.purchaseServer(serverName, keywordArgs.args.ram);
            ns.tprintf(`Purchased ${serverName} with ${keywordArgs.args.ram}GB of RAM.`);
        }
    }
}