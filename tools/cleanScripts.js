/** @typedef {import('../lib').NS} NS */

import { homeNode } from './utils/constants';
import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getHackedServers } from './utils/getServers';

// Arguments list
const keywordsList = [
    new KeywordArgument(
        ['-s', '--server'],
        'server',
        'The server to clean.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-m', '--mask', '-f', '--file'],
        'file',
        'The file mask to search for.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-d', '--dry-run'],
        'dryRun',
        'Show which files would be deleted.',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    )
];

/** 
 * Clean the scripts from the servers
 * @param {NS} ns
*/
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    // Get the servers
    let servers = getHackedServers(ns);
    
    // Check if the server is specified
    if (keywordArgs.args.server) {
        servers = servers.filter((server) => {
            return server === keywordArgs.args.server;
        });
    } else {
        servers = servers.filter((server) => {
            return server !== homeNode;
        });
    }

    // Notify the about the dry run
    if (keywordArgs.args.dryRun)
        ns.tprintf('Dry run. No files will be deleted.');

    // Run for each server
    servers.forEach((server) => {
        // Filter the files
        const files = ns.ls(server, '.').filter((file) => {
            // Check if it matches the mask
            if (keywordArgs.args.file)
                return file.includes(keywordArgs.args.file);
            else
                return file.indexOf('.js') === file.length - 3;
        });

        // Skip if there are no files
        if (files.length === 0)
            return;

        // Print the target
        ns.tprintf(server)

        // Delete the files
        files.forEach((file) => {
            if (!keywordArgs.args.dryRun) {
                if (ns.scriptRunning(file, server))
                    ns.kill(file, server);
                if (ns.rm(file, server))
                    ns.tprintf(`  -> Deleted ${file}`);
                else
                    ns.tprintf(`  -> Failed to delete ${file}`);
            } else {
                ns.tprintf(`  -> ${file}`);
            }
        })
    })
}