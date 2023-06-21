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
        ns.tprintf(target);
        examineDirectory(ns, target, '', 0);
    });
}

// Path separator
const separator = '/';
const extensionSeparator = '.';

class Directory {
    constructor(name) {
        this.name = name;
        this.children = [];
        this.containsDirectory = false;
    }

    addChild(child) {
        if (child instanceof Directory)
            this.containsDirectory = true;
        this.children.push(child);
    }

    sort() {

    }
}

// Make tree
function examineDirectory(ns, serverName, path, depth) {
    // Get and sort the elements
    let elements = sort(ns.ls(serverName, path));
    ns.tprintf(elements.join(', '));

    ns.tprint(path.startsWith(separator));
    if (path.startsWith(separator)) {
        const fileFakePath = path.replace(separator) + separator;
        elements = elements.map((element) => {
            if (element.startsWith(fileFakePath))
                return element.replace(fileFakePath, '');
        });
    }
    
    ns.tprintf(elements.join(', '));
return;

    // Remove the extra path from the elements
    //elements = cleanPath(elements, path);


    // Get the directories
    let directories = getDirectories(elements);

    // Examine the directories
    directories.forEach((directory) => {
        ns.tprintf(directory);
        //examineDirectory(ns, serverName, path + separator + directory, depth + 1);
    });

    // Get the files
    let files = getFiles(elements);

    return new Directory
    // Remove the extra path from the elements


}

function sort(elements) {
    return elements.sort((a, b) => {
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


// Filter the files finding it by checking if they don't have a path separator
function getFiles (elements) {
    return elements.filter((file) => {
        return file.indexOf(separator) === -1;
    });
}

// Filter the directories finding it by checking if they have a path separator
function getDirectories (elements) {
    // Get the directories
    let directories = elements.filter((file) => {
        return file.indexOf(separator) !== -1;
    });

    // Remove the extra path from the directories
    directories = directories.map((directory) => {
        return directory.split(separator).shift();
    });

    // Get the unique directories
    return [...new Set(directories)];
}

// Clean the path from the start
function cleanPath(elements, currentPath) {
    if (currentPath.startsWith(separator)) {
        const fileFakePath = currentPath.replace(separator) + separator;
        elements = elements.map((element) => {
            if (element.startsWith(fileFakePath))
                return element.replace(fileFakePath, '');
        });
    }
}