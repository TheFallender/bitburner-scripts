/** @typedef {import('../lib').NS} NS */
/** @typedef {import('../lib').Singularity} Singularity */

import { homeNode } from './utils/constants';
import { Arguments, KeywordArgument, KEYWORD_FLAGS } from './utils/args';
import { getScannedServers } from './utils/getServers';

// Tree node
class TreeNode {
    // Variables
    server;
    parent;
    children;

    /**
     * Tree node
     * @param {string} server
     * @param {TreeNode} parent
     */
    constructor(server, parent = null) {
        this.server = server;
        this.parent = parent;
        this.children = [];
    }

    /** 
     * Scan the neighbors of the server and add them to the tree
     * @param {NS} ns 
     * @param {string} originServer
     */
    scanAndAdd(ns, server, scannedServers) {
        let neighbors = ns.scan(server);
        neighbors.forEach((serverScanned) => {
            if (!scannedServers.includes(serverScanned))
                this.children.push(new TreeNode(serverScanned, this));
        });
        scannedServers.push(server);
    }

    /**
     * Get the nodes at a certain depth
     * @param {number} depth
     * @returns {TreeNode[]}
     */
    getNodesAtDepth(depth) {
        if (depth === 0) return [this];
        let nodes = [];
        this.children.forEach((child) => {
            nodes = nodes.concat(child.getNodesAtDepth(depth - 1));
        });
        return nodes;
    }

    /**
     * Print the tree
     * @param {number} depth
     * @returns {string}
     */
    print(depth = 0) {
        let str = `${'\t'.repeat(depth)}${this.server}\n`;
        this.children.forEach((child) => {
            str += child.print(depth + 1);
        });
        return str;
    }
}

/** 
 * Get the connection string to a server
 * @param {NS} ns 
 * @param {string} originServer
 * @param {string} destinationServer
 * @returns {string[]}
 */
export function getShortestPath(ns, originServer, destinationServer) {
    // Servers scanned and not scanned
    let tree = new TreeNode(originServer, null);
    let scannedServers = [originServer];

    // Get the first servers
    tree.scanAndAdd(ns, originServer, scannedServers);

    // Create the tree
    let depth = -1;
    var nodesAtDepth 
    do {
        var nodesAtDepth = tree.getNodesAtDepth(++depth);
        for (let i = 0; i < nodesAtDepth.length; i++) {
            nodesAtDepth[i].children.forEach((child) => {
                child.scanAndAdd(ns, child.server, scannedServers);
            });
        }
    } while (nodesAtDepth.length > 0);

    // Get the shortest path
    let shortestPath = [];
    for (let i = 0; i < depth; i++) {
        nodesAtDepth = tree.getNodesAtDepth(i);
        let serversAtDepth = nodesAtDepth.map((node) => node.server);
        const serverIndex = serverListIndex(serversAtDepth, destinationServer);
        if (serverIndex !== -1) {
            let path = [];
            let currentNode = nodesAtDepth[serverIndex];
            while (currentNode.server !== originServer) {
                path.push(currentNode.server);
                currentNode = currentNode.parent;
            }
            shortestPath = path.reverse();
        }
    }

    // Create the connection string
    let connectString = '';
    shortestPath.forEach((server) => {
        connectString += `connect ${server};`;
    });

    return connectString;
}

// Arguments list
const keywordsList = [
    new KeywordArgument(
        ['-s', '--server'],
        'server',
        'The server to connect to.',
        KEYWORD_FLAGS.REQUIRED,
        KEYWORD_FLAGS.PAIR
    ),
    new KeywordArgument(
        ['-o', '--or', '--origin'],
        'origin',
        'The server to connect from. Defaults to home server.',
        KEYWORD_FLAGS.NOT_REQUIRED,
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

    // Set origin to default
    if (keywordArgs.args.origin === undefined) {
        keywordArgs.args.origin = homeNode;
    }
   
    // Check if the server is the same as the origin
    if (keywordArgs.args.server === keywordArgs.args.origin) {
        ns.tprintf(`Server ${keywordArgs.args.server} is the same as ${keywordArgs.args.origin}.`);
        return;
    }

    const serverList = getScannedServers(ns);

    // Check if the server exists
    if (serverListIndex(serverList, keywordArgs.args.server) === -1) {
        ns.tprintf(`Server ${keywordArgs.args.server} does not exist.`);
        return;
    } else if (serverListIndex(serverList, keywordArgs.args.origin) === -1) {
        ns.tprintf(`Server ${keywordArgs.args.origin} does not exist.`);
        return;
    }

    // Get the connect string
    ns.tprintf(getShortestPath(ns, keywordArgs.args.origin, keywordArgs.args.server));
}

/**
 * Check if a server is in a list, return -1 if not
 * @param {string[]} list
 * @param {string} server
 * @returns {int}
 */
function serverListIndex (list, server) {
    // lowercase
    server = server.toLowerCase();
    list = list.map((server) => server.toLowerCase());
    
    for (let i = 0; i < list.length; i++) {
        if (list[i] === server) 
            return i;
    }
    return -1;
}