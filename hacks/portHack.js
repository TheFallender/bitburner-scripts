/** @typedef {import('../lib').NS} NS */

import { homeNode, portHackers, portHackersData } from './utils/constants';

/** 
 * Gets the port hackers available
 * @param {NS} ns
 * @returns {string[]}
*/
export function getPortHackers(ns) {
    return portHackers.filter((portHacker) => {
        return ns.fileExists(portHacker, homeNode);
    });
}

/** 
 * Hack the ports of a server
 * @param {NS} ns
 * @param {string} server
 * @returns {string[]}
*/
export function hackPorts(ns, server) {
    getPortHackers(ns).forEach((portHacker) => {
        switch (portHacker) {
            case portHackersData.SSH:
                ns.brutessh(server);
                break;
            case portHackersData.FTP:
                ns.ftpcrack(server);
                break;
            case portHackersData.SMTP:
                ns.relaysmtp(server);
                break;
            case portHackersData.HTTP:
                ns.httpworm(server);
                break;
            case portHackersData.SQL:
                ns.sqlinject(server);
                break;
        }
    });
}