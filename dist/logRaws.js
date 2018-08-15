'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LogRawsSubprovider = function () {
    function LogRawsSubprovider(sha3, logger) {
        var doNotSend = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        _classCallCheck(this, LogRawsSubprovider);

        this.logger = logger;
        this.doNotSend = doNotSend;
        this.sha3 = sha3;
    }

    _createClass(LogRawsSubprovider, [{
        key: 'setEngine',
        value: function setEngine() {
            // ignore.
        }
    }, {
        key: 'handleRequest',
        value: function handleRequest(payload, next, end) {
            if (payload.method === 'eth_sendRawTransaction') {
                var hash = '0x' + this.sha3(payload.params[0], { encoding: 'hex' });
                this.logger(payload.params[0], hash);
                if (this.doNotSend) {
                    end(null, hash);
                    return;
                }
            }
            next();
        }
    }]);

    return LogRawsSubprovider;
}();

exports.default = LogRawsSubprovider;
module.exports = exports['default'];