import Web3ProviderEngine from 'web3-provider-engine';
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker';
import FilterSubprovider from 'web3-provider-engine/subproviders/filters';

var engine = new Web3ProviderEngine();
engine.addProvider(new FilterSubprovider());
engine.addProvider(new NonceTrackerSubprovider());

export default engine;