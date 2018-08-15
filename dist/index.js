'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ambisafeClientJavascript = require('ambisafe-client-javascript');

var _ambisafeClientJavascript2 = _interopRequireDefault(_ambisafeClientJavascript);

var _ethereumjsTx = require('ethereumjs-tx');

var _ethereumjsTx2 = _interopRequireDefault(_ethereumjsTx);

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _web3ProviderEngine = require('web3-provider-engine');

var _web3ProviderEngine2 = _interopRequireDefault(_web3ProviderEngine);

var _nonceTracker = require('web3-provider-engine/subproviders/nonce-tracker');

var _nonceTracker2 = _interopRequireDefault(_nonceTracker);

var _filters = require('web3-provider-engine/subproviders/filters');

var _filters2 = _interopRequireDefault(_filters);

var _rpc = require('web3-provider-engine/subproviders/rpc');

var _rpc2 = _interopRequireDefault(_rpc);

var _hookedWalletEthtx = require('web3-provider-engine/subproviders/hooked-wallet-ethtx');

var _hookedWalletEthtx2 = _interopRequireDefault(_hookedWalletEthtx);

var _logRaws = require('./logRaws');

var _logRaws2 = _interopRequireDefault(_logRaws);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EToken = function () {
    function EToken() {
        var rpcUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        _classCallCheck(this, EToken);

        this.engine = new _web3ProviderEngine2.default();
        this.web3 = new _web2.default(this.engine);
        this.engine.addProvider(new _filters2.default());
        this.engine.addProvider(new _nonceTracker2.default());
        this.Ambisafe = _ambisafeClientJavascript2.default;
        this.publicToAddress = _helpers.publicToAddress;
        this.privateToAddress = _helpers.privateToAddress;
        this.waitForTransaction = _helpers.waitForTransaction;
        this.setPrivateKey = this.setPrivateKey.bind(this);
        this.setRpcUrl = this.setRpcUrl.bind(this);
        this.buildRawTransaction = this.buildRawTransaction.bind(this);
        this.sign = this.sign.bind(this);
        if (rpcUrl) {
            this.setRpcUrl(rpcUrl);
        }
    }

    _createClass(EToken, [{
        key: 'setPrivateKey',
        value: function setPrivateKey(privateKey) {
            this.signerPrivateKey = (0, _helpers.toBuffer)(privateKey);
            this.signerAddress = (0, _helpers.privateToAddress)(this.signerPrivateKey);
        }
    }, {
        key: 'setRpcUrl',
        value: function setRpcUrl(rpcUrl, rawsLogger) {
            var doNotSend = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            if (this.rpcSet) {
                throw new Error('Rpc url is already set.');
            }
            this.rpcSet = true;
            var that = this;
            var getPrivateKey = function getPrivateKey(address, callback) {
                if (address.toLowerCase() == that.signerAddress.toLowerCase()) {
                    callback(null, that.signerPrivateKey);
                } else {
                    callback(new Error('Unknown address ' + address));
                }
            };
            var getAccounts = function getAccounts(callback) {
                callback(null, [that.signerAddress.toLowerCase()]);
            };

            this.engine.addProvider(new _hookedWalletEthtx2.default({
                getPrivateKey: getPrivateKey,
                getAccounts: getAccounts
            }));

            if (rawsLogger) {
                this.engine.addProvider(new _logRaws2.default(this.web3.sha3, rawsLogger, doNotSend));
            }

            this.engine.addProvider(new _rpc2.default({
                rpcUrl: rpcUrl
            }));

            this.engine.start();
        }
    }, {
        key: 'buildRawTransaction',
        value: function buildRawTransaction(contract, method) {
            var _this = this;

            return function () {
                var _contract$method;

                for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
                    params[_key] = arguments[_key];
                }

                if (_this.signerPrivateKey === undefined) {
                    throw Error('Building transaction is only possible after setPrivateKey().');
                }
                var txData = params.slice(-1)[0];
                txData.data = txData.data || (_contract$method = contract[method]).getData.apply(_contract$method, _toConsumableArray(params.slice(0, -1)));
                txData.to = txData.to || contract.address;
                txData.from = txData.from || _this.signerAddress;
                txData.nonce = _this.web3.toHex(txData.nonce);
                txData.gas = _this.web3.toHex(txData.gas || txData.gasLimit);
                txData.gasLimit = txData.gas;
                txData.gasPrice = _this.web3.toHex(txData.gasPrice);
                txData.value = _this.web3.toHex(txData.value || 0);
                var tx = new _ethereumjsTx2.default(txData);
                tx.sign(_this.signerPrivateKey);
                return '0x' + tx.serialize().toString('hex');
            }.bind(this);
        }
    }, {
        key: 'sign',
        value: function sign(hash) {
            var privateKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

            var privKey = privateKey || this.signerPrivateKey;
            if (privKey === undefined) {
                throw Error('Signing hashes is only possible after setPrivateKey().');
            }
            var signature = (0, _helpers.ecsign)(hash, privKey);
            return {
                v: signature.v,
                r: '0x' + signature.r.toString('hex'),
                s: '0x' + signature.s.toString('hex')
            };
        }
    }]);

    return EToken;
}();

var etoken = new EToken();
if (typeof window !== 'undefined' && window.opts && window.opts.gethUrl) {
    etoken.setRpcUrl(window.opts.gethUrl);
}
if (typeof window !== 'undefined' && window.opts && window.opts.pk) {
    etoken.setPrivateKey(window.opts.pk);
}

EToken.web3 = etoken.web3;
EToken.Ambisafe = _ambisafeClientJavascript2.default;
EToken.publicToAddress = _helpers.publicToAddress;
EToken.privateToAddress = _helpers.privateToAddress;
EToken.waitForTransaction = _helpers.waitForTransaction;
EToken.setPrivateKey = etoken.setPrivateKey;
EToken.buildRawTransaction = etoken.buildRawTransaction;
EToken.sign = etoken.sign;
EToken.setRpcUrl = etoken.setRpcUrl;

exports.default = EToken;
module.exports = exports['default'];