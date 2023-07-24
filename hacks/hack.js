/** @typedef {import('../lib').NS} NS */

import { getTargetServers } from './utils/getServers';

/** 
 * Main hacking function
 * @param {NS} ns 
 */
export async function main(ns) {
    // Get the list of targets
    let targets = refreshTargets(ns);

    // Infinitely hack at random the targets available
    for (
        let i = Math.floor(Math.random() * targets.length), iterations = -1;
        true;
        i = Math.floor(Math.random() * targets.length), iterations++
    ) {
        // See if we need to refresh the list of targets
        if (++iterations >= 10) {
            iterations = -1;
            targets = refreshTargets(ns);
        }

        // Get target
        const target = targets[i];

        // Thresholds for grow/weaken
        let moneyThresh = ns.getServerMaxMoney(target) * 0.6;
        let securityThresh = ns.getServerMinSecurityLevel(target) + 5;

        // ns.tprintf(`Hacking ${target} with:`)
        // ns.tprintf(`\t- security: ${formatNum(ns.getServerSecurityLevel(target))}/${formatNum(ns.getServerMinSecurityLevel(target) + 5)} => ${ns.getServerSecurityLevel(target) < securityThresh}`)
        // ns.tprintf(`\t- money: ${formatNum(ns.getServerMoneyAvailable(target))}/${formatNum(ns.getServerMaxMoney(target) * 0.6)} => ${ns.getServerMoneyAvailable(target) >= moneyThresh}`)

        // Decide what to do with the server
        if (ns.getServerSecurityLevel(target) > securityThresh)
            await ns.weaken(target);
        else if (ns.getServerMoneyAvailable(target) < moneyThresh &&
                ns.getPlayer().money > ns.getServerMoneyAvailable(target))
            await ns.grow(target);
        else
            await ns.hack(target);
    }
}

/** 
 * Refresh the list of targets
 * @param {NS} ns 
 */
function refreshTargets(ns) {
    let targets = getTargetServers(ns);

    // Find the average max money
    let avgMaxMoney = 0;
    targets.forEach((target) => {
        avgMaxMoney += ns.getServerMaxMoney(target);
    });
    avgMaxMoney /= targets.length;
    avgMaxMoney /= 5;
    

    // Find the targets that are interesting
    targets = targets.filter((target) => {
       if (ns.getServerMaxMoney(target) > avgMaxMoney)
           return true;
    });

    return targets;
}


function formatNum (num, decimals = 2) {
    if (!Number.isInteger(num))
        num = num.toFixed(decimals);
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}