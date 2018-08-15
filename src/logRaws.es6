'use strict';

class LogRawsSubprovider {
    constructor(sha3, logger, doNotSend = false) {
        this.logger = logger;
        this.doNotSend = doNotSend;
        this.sha3 = sha3;
    }

    setEngine() {
        // ignore.
    }

    handleRequest(payload, next, end) {
        if (payload.method === 'eth_sendRawTransaction') {
            const hash = '0x' + this.sha3(payload.params[0], {encoding: 'hex'});
            this.logger(payload.params[0], hash);
            if (this.doNotSend) {
                end(null, hash);
                return;
            }
        }
        next();
    }
}

export default LogRawsSubprovider;
