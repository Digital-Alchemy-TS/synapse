import os from 'os';

function getLocalIPAddress(): string | undefined {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const addresses = interfaces[interfaceName];
        if (addresses) {
            for (const addressInfo of addresses) {
                if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                    return addressInfo.address;
                }
            }
        }
    }
    return undefined;
}

console.log(getLocalIPAddress());
