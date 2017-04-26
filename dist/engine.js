'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _web3ProviderEngine = require('web3-provider-engine');

var _web3ProviderEngine2 = _interopRequireDefault(_web3ProviderEngine);

var _nonceTracker = require('web3-provider-engine/subproviders/nonce-tracker');

var _nonceTracker2 = _interopRequireDefault(_nonceTracker);

var _filters = require('web3-provider-engine/subproviders/filters');

var _filters2 = _interopRequireDefault(_filters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var engine = new _web3ProviderEngine2.default();
engine.addProvider(new _filters2.default());
engine.addProvider(new _nonceTracker2.default());

exports.default = engine;
module.exports = exports['default'];