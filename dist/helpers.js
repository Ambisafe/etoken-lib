'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.waitForTransaction = waitForTransaction;
exports.publicToAddress = publicToAddress;
exports.privateToAddress = privateToAddress;

var _web = require('./web3');

var _web2 = _interopRequireDefault(_web);

var _ethereumjsUtil = require('ethereumjs-util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function waitForTransaction(txHash, callback) {
    var filter = _web2.default.eth.filter('latest').watch(function (err, blockHash) {
        _web2.default.eth.getBlock(blockHash, function (err, block) {
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

function publicToAddress(address) {
    return '0x' + (0, _ethereumjsUtil.pubToAddress)(new Buffer(address, 'hex'), true).toString('hex');
}

function privateToAddress(privateKey) {
    return "0x" + (0, _ethereumjsUtil.privateToAddress)(new Buffer(privateKey, 'hex'), true).toString("hex");
}