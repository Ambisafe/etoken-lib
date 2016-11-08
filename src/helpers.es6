import web3 from './web3';
import {pubToAddress, privateToAddress as privToAddress} from 'ethereumjs-util';

export function waitForTransaction(txHash, callback) {
    let filter = web3.eth.filter('latest').watch(function (err, blockHash) {
        web3.eth.getBlock(blockHash, function (err, block) {
            if (!err) {
                if (block.transactions.indexOf(txHash) > -1) {
                    filter.stopWatching();
                    callback(null, true);
                }
            } else {
                callback(err);
            }
        });
    });
}

export function publicToAddress(address) {
    return '0x' + pubToAddress(new Buffer(address, 'hex'), true).toString('hex');
}

export function privateToAddress(privateKey) {
    return '0x' + privToAddress(new Buffer(privateKey, 'hex'), true).toString('hex');
}
