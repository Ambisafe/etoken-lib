"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.waitForTransaction = waitForTransaction;
exports.publicToAddress = publicToAddress;
exports.privateToAddress = privateToAddress;
exports.ecsign = ecsign;
exports.toBuffer = toBuffer;

var _web = _interopRequireDefault(require("./web3"));

var _ethereumjsUtil = require("ethereumjs-util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function waitForTransaction(txHash, callback) {
  var filter = _web.default.eth.filter('latest').watch(function (err, blockHash) {
    _web.default.eth.getBlock(blockHash, function (err, block) {
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

function publicToAddress(publicKey) {
  return '0x' + (0, _ethereumjsUtil.pubToAddress)(toBuffer(publicKey), true).toString('hex');
}

function privateToAddress(privateKey) {
  return '0x' + (0, _ethereumjsUtil.privateToAddress)(toBuffer(privateKey), true).toString('hex');
}

function ecsign(hash, privateKey) {
  return (0, _ethereumjsUtil.ecsign)(toBuffer(hash), toBuffer(privateKey));
}

function toBuffer(input) {
  return (0, _ethereumjsUtil.toBuffer)((0, _ethereumjsUtil.addHexPrefix)(input));
}