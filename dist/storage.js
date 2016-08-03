'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _contractContainerStorageJs = require('contract-container-storage-js');

var _contractContainerStorageJs2 = _interopRequireDefault(_contractContainerStorageJs);

var _web = require('./web3');

var _web2 = _interopRequireDefault(_web);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var storage = new _contractContainerStorageJs2.default('0x152c21d6944f32c6b45605af12bb9b7231a456e7', _web2.default);

exports.default = storage;
module.exports = exports['default'];