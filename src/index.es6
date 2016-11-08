'use strict';

import AccountStorage from 'contract-container-storage-js';
import Ambisafe from 'ambisafe-client-javascript';
import Web3Subprovider from 'web3-provider-engine/subproviders/web3';
import HookedWalletEthTxSubprovider from 'web3-provider-engine/subproviders/hooked-wallet-ethtx';
import EthTx from 'ethereumjs-tx';

import engine from './engine';
import web3 from './web3';
import storage from './storage';

import {waitForTransaction, publicToAddress, privateToAddress} from './helpers';

var signerPrivateKey,
    signerAddress;

engine.addProvider(new HookedWalletEthTxSubprovider({
    getPrivateKey: function (address, callback) {
        if (address.toLowerCase() == signerAddress.toLowerCase()) {
            callback(null, signerPrivateKey);
        } else {
            storage.getPrivateKey(address, callback);
        }
    },
    getAccounts: function (callback) {
        callback(null, [signerAddress.toLowerCase()]);
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

function buildRawTransaction(contract, method) {
    return (...params) => {
        if (signerPrivateKey === undefined) {
            throw Error('Building transaction is only possible after setPrivateKey().');
        }
        let txData = params.slice(-1)[0];
        txData.data = txData.data || contract[method].getData(...params.slice(0, -1));
        txData.to = txData.to || contract.address;
        txData.from = txData.from || signerAddress;
        txData.nonce = web3.toHex(txData.nonce);
        txData.gas = web3.toHex(txData.gas || txData.gasLimit);
        txData.gasLimit = txData.gas;
        txData.gasPrice = web3.toHex(txData.gasPrice);
        txData.value = web3.toHex(txData.value || 0);
        let tx = new EthTx(txData);
        tx.sign(signerPrivateKey);
        return '0x' + tx.serialize().toString('hex');
    };
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
    setPrivateKey: setPrivateKey,
    buildRawTransaction: buildRawTransaction
};
