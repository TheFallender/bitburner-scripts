/** @typedef {import('../lib').NS} NS */

import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';

/** 
 * Copy the dependencies of a script
 * @param {NS} ns 
 * @param {string} scriptToCopy
 * @param {string} serverOrigin
 * @param {string} serverDestination
 * @returns {boolean}
*/
export function copyDependencies(ns, scriptToCopy, serverOrigin, serverDestination, imports = []) {
    imports = getDeepImports(ns, scriptToCopy);

    ns.tprintf(`Copying imports [${imports.join(' , ')}] of${scriptToCopy} from ${serverOrigin} to ${serverDestination}`);

    if (imports.length === 0) {
        ns.tprint(`No imports found in ${scriptToCopy}`);
        return false;
    }

    // Copy the dependencies
    return ns.scp(imports, serverDestination, serverOrigin)
}

/**
 * Get the imports of a script
 * @param {NS} ns
 * @param {string} scriptToCopy
 * @returns {string[]}
 */
export function getImports(ns, scriptToCopy) {
    // Extension
    const extension = '.js';

    // Read the script
    let scriptContent = ns.read(scriptToCopy);

    // Get the regex that matches the import statements
    let importRegex = /^\s*import\s*(\{.*\})\s*from\s*\'*(\.\/)?(.*?)\'*;/gm;
    let imports = [];

    for (let match; (match = importRegex.exec(scriptContent)) !== null;) {
        imports.push(match[3] + extension);
    }

    return imports;
}

/**
 * Get the imports of a script
 * @param {NS} ns
 * @param {string} scriptToCopy
 * @returns {string[]}
 */
export function getDeepImports(ns, scriptToCopy) {
    let imports = getImports(ns, scriptToCopy);

    // Get the imports of the imports
    imports.forEach((importedFile) => {
        imports = imports.concat(getDeepImports(ns, importedFile));
    });

    return imports;
}


/**
 * Deep copy a script
 * @param {NS} ns
 * @param {string} scriptToCopy
 * @param {string} serverOrigin
 * @param {string} serverDestination
 * @returns {boolean}
*/
function deepCopyScript (ns, scriptToCopy, serverOrigin, serverDestination) {
    // Copy the dependencies
    if (copyDependencies(ns, scriptToCopy, serverOrigin, serverDestination))
        ns.tprintf(`Successfully copied dependencies of ${scriptToCopy} from ${serverOrigin} to ${serverDestination}`);
    else
        ns.tprintf(`Failed to copy dependencies of ${scriptToCopy} from ${serverOrigin} to ${serverDestination}`);

    // Copy the script
    if (ns.scp(scriptToCopy, serverDestination, serverOrigin))
        ns.tprintf(`Successfully copied ${scriptToCopy} from ${serverOrigin} to ${serverDestination}`);
    else
        ns.tprintf(`Failed to copy ${scriptToCopy} from ${serverOrigin} to ${serverDestination}`);
}

// Keywords list
const keywordsList = [
    new KeywordArgument(
        ['-c', '--copy', '--deep-copy'],
        'copy',
        'The file to copy along with its dependencies.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['--so', '--server-origin'],
        'serverOrigin',
        'The server to copy the file from.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['--sd', '--server-destination'],
        'serverDestination',
        'The server to copy the file to.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
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

    // Run the copy
    ns.tprintf(`Running deep copy of ${keywordArgs.args.copy}\n${keywordArgs.args.serverOrigin} ==> ${keywordArgs.args.serverDestination}`);
    deepCopyScript(ns, keywordArgs.args.copy, keywordArgs.args.serverOrigin, keywordArgs.args.serverDestination);
}