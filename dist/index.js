'use strict';

var _contractContainerStorageJs = require('contract-container-storage-js');

var _contractContainerStorageJs2 = _interopRequireDefault(_contractContainerStorageJs);

var _ambisafeClientJavascript = require('ambisafe-client-javascript');

var _ambisafeClientJavascript2 = _interopRequireDefault(_ambisafeClientJavascript);

var _web = require('web3-provider-engine/subproviders/web3');

var _web2 = _interopRequireDefault(_web);

var _hookedWalletEthtx = require('web3-provider-engine/subproviders/hooked-wallet-ethtx');

var _hookedWalletEthtx2 = _interopRequireDefault(_hookedWalletEthtx);

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _web3 = require('./web3');

var _web4 = _interopRequireDefault(_web3);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var signerPrivateKey, signerAddress;

_engine2.default.addProvider(new _hookedWalletEthtx2.default({
    getPrivateKey: function getPrivateKey(address, callback) {
        if (address.toLowerCase() == signerAddress.toLowerCase()) {
            callback(null, signerPrivateKey);
        } else {
            _storage2.default.getPrivateKey(address, callback);
        }
    },
    getAccounts: function getAccounts(callback) {
        callback(null, [signerAddress.toLowerCase()]);
    }
}));

_engine2.default.addProvider(new _web2.default(new _web4.default.providers.HttpProvider(window.opts.gethUrl)));

_engine2.default.start();

_storage2.default.web3 = _web4.default;

function createAccount(password, callback) {
    var container = _ambisafeClientJavascript2.default.generateAccount('ETH', password);
    var serializedContainer = container.getContainer();
    var address = (0, _helpers.publicToAddress)(container.get('public_key'), true);
    if (!signerAddress) {
        throw Error('You must specify private key first');
    }
    _storage2.default.accountSaverAddress = signerAddress;
    _storage2.default.addAccount(address, serializedContainer, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, { address: address, transactionHash: result });
        }
    });
}

function setPassword(password) {
    _storage2.default.password = password;
}

function setPrivateKey(privateKey) {
    signerPrivateKey = new Buffer(privateKey, "hex");
    signerAddress = (0, _helpers.privateToAddress)(signerPrivateKey);
}

module.exports = {
    web3: _web4.default,
    Ambisafe: _ambisafeClientJavascript2.default,
    AccountStorage: _contractContainerStorageJs2.default,
    storage: _storage2.default,
    publicToAddress: _helpers.publicToAddress,
    privateToAddress: _helpers.privateToAddress,
    waitForTransaction: _helpers.waitForTransaction,
    createAccount: createAccount,
    setPassword: setPassword,
    setPrivateKey: setPrivateKey
};