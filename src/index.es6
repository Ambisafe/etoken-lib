'use strict';

import Ambisafe from 'ambisafe-client-javascript';
import EthTx from 'ethereumjs-tx';

import Web3 from 'web3';
import Web3ProviderEngine from 'web3-provider-engine';
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker';
import FilterSubprovider from 'web3-provider-engine/subproviders/filters';
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc';
import HookedWalletEthTxSubprovider from 'web3-provider-engine/subproviders/hooked-wallet-ethtx';
import LogRawsSubprovider from './logRaws';

import {waitForTransaction, publicToAddress, privateToAddress, ecsign, toBuffer} from './helpers';
import * as ethUtil from 'ethereumjs-util';

class EToken {
    constructor(rpcUrl = null) {
        this.engine = new Web3ProviderEngine();
        this.web3 = new Web3(this.engine);
        this.engine.addProvider(new FilterSubprovider());
        this.engine.addProvider(new NonceTrackerSubprovider());
        this.Ambisafe = Ambisafe;
        this.publicToAddress = publicToAddress;
        this.privateToAddress = privateToAddress;
        this.waitForTransaction = waitForTransaction;
        this.setPrivateKey = this.setPrivateKey.bind(this);
        this.setRpcUrl = this.setRpcUrl.bind(this);
        this.buildRawTransaction = this.buildRawTransaction.bind(this);
        this.sign = this.sign.bind(this);
        if (rpcUrl) {
            this.setRpcUrl(rpcUrl);
        }
    }

    setPrivateKey(privateKey) {
        this.signerPrivateKey = toBuffer(privateKey);
        this.signerAddress = privateToAddress(this.signerPrivateKey);
    }

    setRpcUrl(rpcUrl, rawsLogger, doNotSend = false) {
        if (this.rpcSet) {
            throw new Error('Rpc url is already set.');
        }
        this.rpcSet = true;
        const that = this;
        const getPrivateKey = (address, callback) => {
            if (address.toLowerCase() == that.signerAddress.toLowerCase()) {
                callback(null, that.signerPrivateKey);
            } else {
                callback(new Error('Unknown address ' + address));
            }
        };
        const getAccounts = callback => {
            callback(null, [that.signerAddress.toLowerCase()]);
        };

        this.engine.addProvider(new HookedWalletEthTxSubprovider({
            getPrivateKey: getPrivateKey,
            getAccounts: getAccounts,
        }));

        if (rawsLogger) {
            this.engine.addProvider(new LogRawsSubprovider(this.web3.sha3, rawsLogger, doNotSend));
        }

        this.engine.addProvider(new RpcSubprovider({
            rpcUrl: rpcUrl,
        }));

        this.engine.start();
    }

    buildRawTransaction(contract, method) {
        return ((...params) => {
            if (this.signerPrivateKey === undefined) {
                throw Error('Building transaction is only possible after setPrivateKey().');
            }
            let txData = params.slice(-1)[0];
            txData.data = txData.data || contract[method].getData(...params.slice(0, -1));
            txData.to = txData.to || contract.address;
            txData.from = txData.from || this.signerAddress;
            txData.nonce = this.web3.toHex(txData.nonce);
            txData.gas = this.web3.toHex(txData.gas || txData.gasLimit);
            txData.gasLimit = txData.gas;
            txData.gasPrice = this.web3.toHex(txData.gasPrice);
            txData.value = this.web3.toHex(txData.value || 0);
            let tx = new EthTx(txData);
            tx.sign(this.signerPrivateKey);
            return '0x' + tx.serialize().toString('hex');
        }).bind(this);
    }

    sign(hash, privateKey = undefined) {
        const privKey = privateKey || this.signerPrivateKey;
        if (privKey === undefined) {
            throw Error('Signing hashes is only possible after setPrivateKey().');
        }
        const signature = ecsign(hash, privKey);
        return {
            v: signature.v,
            r: '0x' + signature.r.toString('hex'),
            s: '0x' + signature.s.toString('hex'),
        };
    }
}

const etoken = new EToken();
if (typeof window !== 'undefined' && window.opts && window.opts.gethUrl) {
    etoken.setRpcUrl(window.opts.gethUrl);
}
if (typeof window !== 'undefined' && window.opts && window.opts.pk) {
    etoken.setPrivateKey(window.opts.pk);
}

EToken.web3 = etoken.web3;
EToken.Ambisafe = Ambisafe;
EToken.publicToAddress = publicToAddress;
EToken.privateToAddress = privateToAddress;
EToken.waitForTransaction = waitForTransaction;
EToken.setPrivateKey = etoken.setPrivateKey;
EToken.buildRawTransaction = etoken.buildRawTransaction;
EToken.sign = etoken.sign;
EToken.setRpcUrl = etoken.setRpcUrl;
EToken.ethUtil = ethUtil;

export default EToken;
