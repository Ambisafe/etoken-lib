import Web3ProviderEngine from 'web3-provider-engine';
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker';

var engine = new Web3ProviderEngine();
engine.addProvider(new NonceTrackerSubprovider());

export default engine;