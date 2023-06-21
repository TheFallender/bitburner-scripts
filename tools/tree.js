/** @typedef {import('../lib').NS} NS */

import { homeNode, homeServers } from './utils/constants';
import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getScannedServers, getHackedServers } from './utils/getServers';

// Arguments list
const keywordsList = [
    new KeywordArgument(
        ['-h', '--host'],
        'host',
        'Only tree the servers that contain the host in their name',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-r', '--root'],
        'root',
        'Only tree the rooted servers',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
    new KeywordArgument(
        ['-g', '--group'],
        'group',
        'Group the files by their extension',
        KEYWORD_FLAGS.NOT_REQUIRED,
        KEYWORD_FLAGS.NO_PAIR
    ),
];

// Tree main
export async function main(ns) {
    // Get the arguments
    const keywordArgs = new Arguments(ns, keywordsList);
    if (!keywordArgs.valid) return;

    // Get the list of targets
    let servers = keywordArgs.args.root ? getHackedServers(ns) : getScannedServers(ns);

    // Filter only the selected hosts
    if (keywordArgs.args.host) {
        servers = servers.filter((serverName) => {
            return serverName.includes(keywordArgs.args.host);
        });
    }

    // Tree the servers
    servers.forEach((target) => {
        tree(ns, target, '', 0, keywordArgs.args.group);
    });
}

// Path separator
const separator = '/';
const extensionSeparator = '.';

// Make a function that does the same thing as tree
// showing the files in the server
function tree(ns, serverName, path, depth, groupByExtension) {
    // Print the server name
    if (depth == 0)
        ns.tprintf(serverName);

    // Get the files
    let elements = getElements(ns, serverName, path, depth, groupByExtension);

    // Get the files and directories
    let files = filterFiles(elements, path);
    let directories = filterDirectories(elements, path);

    // Print the files
    printFiles(ns.tprintf, files, depth, directories.length > 0);

    // Print the directories
    printDirectories(ns, serverName, path, directories, depth, groupByExtension);
}

// Get elements
function getElements (ns, serverName, path, depth, groupByExtension) {
    // Get and sort the elements
    let elements = ns.ls(serverName, path);

    // Remove the extra path from the elements
    if (depth > 0) {
        const fileFakePath = path.slice(1) + separator;
        elements = elements.map((element) => {
            if (element.startsWith(fileFakePath)) {
                const cosa = element.replace(fileFakePath, '');
                return cosa;
            }
        });
    }

    // Sort the elements
    return sortFiles(elements, groupByExtension);
}

// Filter the files finding it by checking if they don't have a path separator
function filterFiles (elements, path) {
    return elements.filter((file) => {
        return file.indexOf(separator) === -1;
    });
}

// Print the files in the directory
function printFiles (tprintf, files, depth, isThereAnyDirectory = false) {
    // Print the files
    for (let currentExtension = '', i = 0; i < files.length; i++) {
        // // Get the extension
        // if (groupByExtension) {
        //     const extension = files[i].split(extensionSeparator).pop();
        //     if (currentExtension !== extension) {
        //         tprintf(getPaddingSeparator(extensionSeparator + extension, depth));
        //         currentExtension = extension;
        //     }
        // }
        // Print the file
        tprintf(getPaddingSeparator(files[i], depth, false, false, isThereAnyDirectory, false));
    }
    if (isThereAnyDirectory)
        tprintf(getPaddingSeparator('', depth, false, false, true, false));
}

// Filter the directories finding it by checking if they have a path separator
function filterDirectories (elements, path) {
    // Get the directories
    let directories = elements.filter((file) => {
        return file.indexOf(separator) !== -1;
    });

    // Remove the extra path from the directories and get the unique ones
    return [...new Set(directories.map((directory) => {
        return directory.split(separator).shift();
    }))];
}

// Print the directories recursively
function printDirectories (ns, serverName, path, directories, depth, groupByExtension) {
    // Print the directories
    for (let i = 0; i < directories.length; i++) {
        // Print the directory
        ns.tprintf(getPaddingSeparator(directories[i], depth, true, i < directories.length - 1, false, false));

        // Print the files in the directory
        tree(ns, serverName, path + separator + directories[i], depth + 1, groupByExtension);

        if (i < directories.length - 1) {
            ns.tprintf(getPaddingSeparator('', 0, false, false, false));
        }
    }
    //ns.tprintf("Called when: " + directories.join(', '));

}

// Sort
function sortFiles (files, groupByExtension) {
    // Sort the elements
    if (groupByExtension) {
        files.sort((a, b) => {
            // Make the names lowercase
            a = a.toLowerCase();
            b = b.toLowerCase();

            // Sort by directory
            const aIsDir = a.indexOf(separator) !== -1;
            const bIsDir = b.indexOf(separator) !== -1;

            // Put the directories last
            if (aIsDir || bIsDir) {
                if (aIsDir && !bIsDir) return 1;
                else if (!aIsDir && bIsDir) return -1;
            } else {
                // Sort by extension
                const aExtension = a.split(extensionSeparator).pop();
                const bExtension = b.split(extensionSeparator).pop();

                // Compare the extensions
                if (aExtension < bExtension) return -1;
                else if (aExtension > bExtension) return 1;
            }

            // Compare the names if the extensions are the same
            if (a < b) return -1;
            else if (a > b) return 1;
        });
    } else {
        files.sort((a, b) => {
            // Make the names lowercase
            a = a.toLowerCase();
            b = b.toLowerCase();

            // Sort by directory
            const aIsDir = a.indexOf(separator) !== -1;
            const bIsDir = b.indexOf(separator) !== -1;

            // Put the directories last
            if (aIsDir && !bIsDir) return 1;
            else if (!aIsDir && bIsDir) return -1;

            // Compare the names if the extensions are the same
            if (a < b) return -1;
            else if (a > b) return 1;
        });
    }

    return files;
}

// Get the padding separator
function getPaddingSeparator (file, depth, isDirectory, moreRemains, isThereAnyDirectory, isLastDirectory) {
    // Padding separator
    const spacer = ' ';
    const ending = '─'
    const starter = '│';
    const middleElement = '├';
    const lastElement = '└';

    // Padding length
    const paddingLength = 2;
    const paddingTimes = 2;

    // String to return
    let strRet = starter;

    // Get the starter type
    if (isDirectory && depth == 0) {
        strRet = moreRemains ? middleElement : lastElement;
        strRet += ending.repeat(paddingLength * paddingTimes);
    } else {
        strRet += spacer.repeat(paddingLength * paddingTimes);
    }

    // Return for depth 0
    if (depth == 0) {
        return `${strRet}${file}`;
    }

    // Get the padding
    if (isDirectory) {
        strRet += spacer.repeat((depth - 1) * paddingLength * paddingTimes);
        strRet += moreRemains ? middleElement : lastElement;
        strRet += ending.repeat(paddingLength * paddingTimes);
        strRet = strRet.slice(0, -1);
    } else {
        strRet += spacer.repeat((depth - 1) * paddingLength * paddingTimes);
        if (isThereAnyDirectory)
            strRet += starter;
        strRet += spacer.repeat(paddingLength * paddingTimes);
        if (isThereAnyDirectory)
            strRet = strRet.slice(0, -1);
    }

    return `${strRet}${file}`;
}