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

module.exports = {
    web3: web3,
    Ambisafe: Ambisafe,
    storage: storage,
    password: storage.password,
    publicToAddress: publicToAddress,
    AccountStorage: AccountStorage
};