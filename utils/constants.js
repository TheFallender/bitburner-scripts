// All the constants to hold for the scripts

// Server Related
export const homeNode = 'home';
export const homeServers = 'hserver';

// Hack Related
export const hackScript = 'hacks/hack.js';
export const propagateScript = 'hacks/propagate.js';
export const portHackersData = {
    SSH: 'BruteSSH.exe',
    FTP: 'FTPCrack.exe',
    SMTP: 'relaySMTP.exe',
    HTTP: 'HTTPWorm.exe',
    SQL: 'SQLInject.exe'
};
export const portHackers = [
    portHackersData.SSH,
    portHackersData.FTP,
    portHackersData.SMTP,
    portHackersData.HTTP,
    portHackersData.SQL
];

// Tools Related
export const ramToLeave = 128;
