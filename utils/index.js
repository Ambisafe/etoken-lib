const util = require('ethereumjs-util');
const Web3 = require('web3');
const web3 = new Web3();
const userContractABI = [{"constant":false,"inputs":[{"name":"_destination","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"},{"name":"_nonce","type":"uint256"},{"name":"_v","type":"uint8"},{"name":"_r","type":"bytes32"},{"name":"_s","type":"bytes32"}],"name":"forwardOnBehalf","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];
const tokenABI = [{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  return true;
}

function buildForwardOnBehalf(to, value, data, userContractAddress, nonce, privateKey) {
  const parsedTo = util.stripHexPrefix(to);
  assert(util.isValidAddress(parsedTo), `to '${to}' is not an address.`);
  const parsedUserContractAddress = util.stripHexPrefix(userContractAddress);
  assert(util.isValidAddress(parsedUserContractAddress), `userContractAddress '${userContractAddress}' is not an address.`);
  const parsedValue = web3.utils.toBN(value).toString(16, 64);
  const parsedData = util.stripHexPrefix(data);
  assert(web3.util.isHex(parsedData), `data ${data} should be a hex.`);
  const parsedNonce = web3.utils.toBN(nonce).toString(16, 64);
  const hash = util.keccak256(util.toBuffer(`${parsedTo}${parsedValue}${parsedData}${parsedUserContractAddress}${parsedNonce}`));
  const parsedPrivateKey = util.stripHexPrefix(privateKey);
  assert(web3.util.isHex(parsedPrivateKey), `private key should be a hex.`);
  const bufferPrivateKey = util.toBuffer(parsedPrivateKey);
  const {v, r, s} = util.ecsign(hash, bufferPrivateKey);
  const userContract = new web3.eth.Contract(userContractABI, 0);
  return userContract.forwardOnBehalf.encodeABI(
    util.addHexPrefix(parsedTo),
    util.addHexPrefix(parsedValue),
    util.addHexPrefix(parsedData),
    util.addHexPrefix(parsedNonce),
    util.bufferToHex(v),
    util.bufferToHex(r),
    util.bufferToHex(s));
}

function recoverETH(to, value, userContractAddress, privateKey) {
  return buildForwardOnBehalf(to, value, '0x', userContractAddress, Date.now(), privateKey);
}

function recoverTokens(tokenAddress, to, value, userContractAddress, privateKey) {
  const token = new web3.eth.Contract(tokenABI, 0);
  const data = token.transfer.encodeABI(to, value);
  return buildForwardOnBehalf(to, value, data, userContractAddress, Date.now(), privateKey);
}

exports = {recoverETH, recoverTokens};
