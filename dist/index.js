'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ambisafeClientJavascript = _interopRequireDefault(require("ambisafe-client-javascript"));

var _ethereumjsTx = _interopRequireDefault(require("ethereumjs-tx"));

var _web = _interopRequireDefault(require("web3"));

var _web3ProviderEngine = _interopRequireDefault(require("web3-provider-engine"));

var _nonceTracker = _interopRequireDefault(require("web3-provider-engine/subproviders/nonce-tracker"));

var _filters = _interopRequireDefault(require("web3-provider-engine/subproviders/filters"));

var _rpc = _interopRequireDefault(require("web3-provider-engine/subproviders/rpc"));

var _hookedWalletEthtx = _interopRequireDefault(require("web3-provider-engine/subproviders/hooked-wallet-ethtx"));

var _logRaws = _interopRequireDefault(require("./logRaws"));

var _helpers = require("./helpers");

var ethUtil = _interopRequireWildcard(require("ethereumjs-util"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var EToken = /*#__PURE__*/function () {
  function EToken() {
    var rpcUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    _classCallCheck(this, EToken);

    this.engine = new _web3ProviderEngine.default();
    this.web3 = new _web.default(this.engine);
    this.engine.addProvider(new _filters.default());
    this.engine.addProvider(new _nonceTracker.default());
    this.Ambisafe = _ambisafeClientJavascript.default;
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
    key: "setPrivateKey",
    value: function setPrivateKey(privateKey) {
      this.signerPrivateKey = (0, _helpers.toBuffer)(privateKey);
      this.signerAddress = (0, _helpers.privateToAddress)(this.signerPrivateKey);
    }
  }, {
    key: "setRpcUrl",
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

      this.engine.addProvider(new _hookedWalletEthtx.default({
        getPrivateKey: getPrivateKey,
        getAccounts: getAccounts
      }));

      if (rawsLogger) {
        this.engine.addProvider(new _logRaws.default(this.web3.sha3, rawsLogger, doNotSend));
      }

      this.engine.addProvider(new _rpc.default({
        rpcUrl: rpcUrl
      }));
      this.engine.start();
    }
  }, {
    key: "buildRawTransaction",
    value: function buildRawTransaction(contract, method) {
      var _this = this;

      return function () {
        var _contract$method;

        if (_this.signerPrivateKey === undefined) {
          throw Error('Building transaction is only possible after setPrivateKey().');
        }

        for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
          params[_key] = arguments[_key];
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
        var tx = new _ethereumjsTx.default(txData);
        tx.sign(_this.signerPrivateKey);
        return '0x' + tx.serialize().toString('hex');
      }.bind(this);
    }
  }, {
    key: "sign",
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
EToken.Ambisafe = _ambisafeClientJavascript.default;
EToken.publicToAddress = _helpers.publicToAddress;
EToken.privateToAddress = _helpers.privateToAddress;
EToken.waitForTransaction = _helpers.waitForTransaction;
EToken.setPrivateKey = etoken.setPrivateKey;
EToken.buildRawTransaction = etoken.buildRawTransaction;
EToken.sign = etoken.sign;
EToken.setRpcUrl = etoken.setRpcUrl;
EToken.ethUtil = ethUtil;
var _default = EToken;
exports.default = _default;