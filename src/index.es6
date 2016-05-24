'use strict';

import AccountStorage from 'contract-container-storage-js';
import Ambisafe from 'ambisafe-client-javascript';
import Web3Subprovider from 'web3-provider-engine/subproviders/web3'
import HookedWalletEthTxSubprovider from 'web3-provider-engine/subproviders/hooked-wallet-ethtx'

import engine from './engine';
import web3 from './web3';
import storage from './storage';

import {waitForTransaction, publicToAddress, privateToAddress} from './helpers';

var signerPrivateKey,
    signerAddress;

engine.addProvider(new HookedWalletEthTxSubprovider({
    getPrivateKey: function (address, callback) {
        if (address == signerAddress) {
            callback(null, signerPrivateKey);
        } else {
            storage.getPrivateKey(address, callback);
        }
    }
}));

engine.addProvider(new Web3Subprovider(new web3.providers.HttpProvider(window.opts.gethUrl)));


engine.start();

storage.web3 = web3;

function createAccount(password, callback) {
    var container = Ambisafe.generateAccount('ETH', password);
    var serializedContainer = container.getContainer();
    var address = publicToAddress(container.get('public_key'), true);
    if (!signerAddress) {
        throw Error('You must specify private key first');
    }
    storage.accountSaverAddress = signerAddress;
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


function setPrivateKey(privateKey) {
    signerPrivateKey = new Buffer(privateKey, "hex");
    signerAddress = privateToAddress(signerPrivateKey);
}


module.exports = {
    web3: web3,
    Ambisafe: Ambisafe,
    AccountStorage: AccountStorage,
    storage: storage,
    publicToAddress: publicToAddress,
    privateToAddress: privateToAddress,
    waitForTransaction: waitForTransaction,
    createAccount: createAccount,
    setPassword: setPassword,
    setPrivateKey: setPrivateKey
};
