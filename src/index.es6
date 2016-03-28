'use strict';

import AccountStorage from 'account-storage';

const Web3 = require('web3'),
    Web3ProviderEngine = require('web3-provider-engine'),
    HookedWalletEthTxSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx'),
    NonceTrackerSubprovider = require('web3-provider-engine/subproviders/nonce-tracker'),
    Web3Subprovider = require('web3-provider-engine/subproviders/web3'),
    Ambisafe = require('ambisafe-client-javascript'),
    pubToAddress = require('ethereumjs-util').pubToAddress;


let engine = new Web3ProviderEngine();
var web3 = new Web3(engine);
var storage = new AccountStorage('0x152c21d6944f32c6b45605af12bb9b7231a456e7', web3, window.opts.pk);
var password = '';

engine.addProvider(new HookedWalletEthTxSubprovider({
    getPrivateKey: storage.getPrivateKey.bind(storage)
}));

engine.addProvider(new NonceTrackerSubprovider());
engine.addProvider(new Web3Subprovider(new web3.providers.HttpProvider(window.opts.gethUrl)));
engine.start();

function publicToAddress(address) {
    return '0x' + pubToAddress(new Buffer(address, 'hex'), true).toString('hex');
}


function waitForTransaction(txHash, callback) {
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


function createAccount(password, callback) {
    var container = Ambisafe.generateAccount('ETH', password);
    var serializedContainer = container.getContainer();
    var address = publicToAddress(container.get('public_key'), true);
    storage.addAccount(address, serializedContainer, (err, result) => {
        if (err) {
            callback(err);
        } else {
            callback(null, {address: address, transactionHash: result})
        }
    });
}


function setPassword(password) {
    storage.password = password;
}


module.exports = {
    web3: web3,
    Ambisafe: Ambisafe,
    AccountStorage: AccountStorage,
    storage: storage,
    publicToAddress: publicToAddress,
    waitForTransaction: waitForTransaction,
    createAccount: createAccount,
    setPassword: setPassword
};