import web3 from './web3';
import {pubToAddress, privateToAddress as privToAddress, ecsign as sign, addHexPrefix, toBuffer as toBuff} from 'ethereumjs-util';

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

export function publicToAddress(publicKey) {
    return '0x' + pubToAddress(toBuffer(publicKey), true).toString('hex');
}

export function privateToAddress(privateKey) {
    return '0x' + privToAddress(toBuffer(privateKey), true).toString('hex');
}

export function ecsign(hash, privateKey) {
    return sign(toBuffer(hash), toBuffer(privateKey));
}

export function toBuffer(input) {
    return toBuff(addHexPrefix(input));
}
