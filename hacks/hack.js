/** @typedef {import('../lib').NS} NS */

import { getTargetServers } from './utils/getServers';

/** 
 * Main hacking function
 * @param {NS} ns 
 */
export async function main(ns) {
    // Get the list of targets
    let targets = getTargetServers(ns);

    // Infinitely hack at random the targets available
    for (
        let i = Math.floor(Math.random() * targets.length), iterations = -1;
        true;
        i = Math.floor(Math.random() * targets.length), iterations++
    ) {
        // See if we need to refresh the list of targets
        if (++iterations >= 10) {
            iterations = -1;
            targets = getTargetServers(ns);
        }

        // Get target
        const target = targets[i];

        // Thresholds for grow/weaken
        let moneyThresh = ns.getServerMaxMoney(target) * 0.75;
        let securityThresh = ns.getServerMinSecurityLevel(target) + 5;

        // Decide what to do with the server
        if (ns.getServerSecurityLevel(target) > securityThresh)
            await ns.weaken(target);
        else if (ns.getServerMoneyAvailable(target) < moneyThresh)
            await ns.grow(target);
        else
            await ns.hack(target);
    }
}