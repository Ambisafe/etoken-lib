var $logs = $('#logs');
var web3 = EToken.web3;
var eth = web3.eth;
var address;
var sender;

var nowSeconds = function(){return (Date.now() / 1000);};

var gasPrice = web3.toBigNumber(web3.toWei(20, 'gwei'));

var cb = function(err,ok){if (err) {console.log(err);} else {console.log(ok);}};
var cbval = function(err,ok){if (err) {console.log(err);} else {console.log(ok.valueOf());}};

var setPrivateKey = function(pk) {
    EToken.setPrivateKey(pk);
    address = EToken.privateToAddress(('0x' + pk).slice(-64));
    sender = address;
    log('Your address(global variable `address` or `sender`) to send transactions: ' + address, $logs);
};

var _log = function(message, logger) {
  logger.prepend(message);
}

var log = function(message, logger) {
    console.log(message);
    if (logger) {
        _log('<p>' + message + '</p>', logger);
    }
};

var logError = function(message, logger) {
    if (logger) {
        _log('<p class="error">' + message + '</p>', logger);
    }
    throw message;
};

var logWarning = function(message, logger) {
    if (logger) {
        _log('<p class="warning">' + message + '</p>', logger);
    }
    console.log('Warning: ' + message);
};

var logSuccess = function(gas, result, params, logger) {
    if (logger) {
        var txHash = result.length === 66 ? '<a href="http://etherscan.io/tx/' + result + '" target="_blank">' + result + '</a>' : result;
        _log('<p class="success">Success! Gas used: ' + gas + ' result: ' + txHash + (params ? ' params: ' + params : '') + '</p>', logger);
    }
    console.log('Success! Gas used: ' + gas + ' result: ' + result + (params ? ' params: ' + params : ''));
};

var logWaiting = function(logger) {
  if (logger) {
    $(logger.children()[0]).append('.');
  }
};

var logFinish = function(logger) {
  if (logger) {
    _log('<hr/>', logger);
  }
  console.log('--------------------------------------------------------------------------------');
}

var flowControl = function() {
  var STATES = { ready: 'ready', waiting: 'waiting', stopping: 'stopping' };
  var state = STATES.ready;
  return {
    get ready () {
      return state === STATES.ready;
    },
    get waiting () {
      return state === STATES.waiting;
    },
    get stopping () {
      return state === STATES.stopping;
    },
    get state () {
      return state;
    },
    stop: function() {
      if (state === STATES.waiting) {
        state = STATES.stopping;
      }
      return state;
    },
    continue: function() {
      if (state === STATES.waiting || state === STATES.stopping) {
        state = STATES.ready;
      }
      return state;
    },
    __wait__: function() {
      state = STATES.waiting;
      return state;
    }
  };
}();

var safeTransaction = function(fun, params, sender, argsObject) {
  if (arguments.length === 0) {
    log('safeTransaction(contract.method, paramsArray, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  safeTransactionFunction(fun, params, sender, argsObject)().then(function() {
    logFinish($logs);
  });
};

var safeSend = function(to, value, sender, argsObject) {
  if (arguments.length === 0) {
    log('safeSend(toAddress, valueInWei, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  safeSendFunction(to, value, sender, argsObject)().then(function() {
    logFinish($logs);
  });
};

var safeSendAll = function(to, sender, argsObject) {
  if (arguments.length === 0) {
    log('safeSendAll(toAddress, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  eth.getBalance(sender, 'pending', function(err, balance) {
    if (err) {
      throw err;
    }
    var gas = argsObject && argsObject.gas || 21000;
    var gasPrice = argsObject && argsObject.gasPrice || gasPrice;
    var value = balance.sub(gasPrice.mul(gas));
    safeSend(to, value, sender, argsObject);
  });
};

var safeTopup = function(to, targetValue, sender, argsObject) {
  if (arguments.length === 0) {
    log('safeTopup(toAddress, targetValueInWei, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  safeTopupFunction(to, targetValue, sender, argsObject)().then(function() {
    log('Topup to ' + to + ' finished.', $logs);
    logFinish($logs);
  });
};

var safeTopupFunction = function(to, targetValue, sender, argsObject) {
  if (arguments.length === 0) {
    log('See safeTopup(). To be used as part of safeTransactions().', $logs);
    return;
  }
  return asyncFunction(function(resolve, reject, testRun) {
    eth.getBalance(to, 'pending', function(err, balance) {
      if (err) {
        reject(err);
        return;
      }
      var value = web3.toBigNumber(targetValue).sub(balance);
      if (value.lte(0)) {
        log("Skipping: balance of " + to + " is " + web3.fromWei(balance, 'ether') + " ETH and it is more or equal to target value of " + web3.fromWei(targetValue, 'ether') + " ETH.", $logs);
        resolve(0);
        return;
      }
      safeSendFunction(to, value, sender, argsObject)(testRun).then(resolve).catch(reject);
    });
  });
};

var fastTopup = function(to, targetValue, sender, nonce, argsObject) {
  if (arguments.length === 0) {
    log('fastTopup(toAddress, targetValueInWei, sender, nonce[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  fastTopupFunction(to, targetValue, sender, argsObject)(nonce).then(function(nonce) {
    log('Topup to ' + to + ' finished. Next nonce: ' + nonce, $logs);
  });
};

var fastTopupFunction = function(to, targetValue, sender, argsObject) {
  if (arguments.length === 0) {
    log('See fastTopup(). To be used as part of fastTopups(), nonce will be passed automatically.', $logs);
    return;
  }
  return function(nonce, _testRun) {
    return asyncFunction(function(resolve, reject, testRun) {
      eth.getBalance(to, 'pending', function(err, balance) {
        if (err) {
          reject(err);
          return;
        }
        var value = web3.toBigNumber(targetValue).sub(balance);
        if (value.lte(0)) {
          log("Skipping: balance of " + to + " is " + web3.fromWei(balance, 'ether') + " ETH and it is more or equal to target value of " + web3.fromWei(targetValue, 'ether') + " ETH.", $logs);
          resolve(nonce);
          return;
        }
        resolve(nonce+1);
        if (argsObject) {
          argsObject.nonce = nonce;
        } else {
          argsObject = {nonce: nonce};
        }
        safeSendFunction(to, value, sender, argsObject)(testRun).catch(function(error) {
          throw error;
        });
      });
    })(_testRun);
  };
};

var fastTopups = function(txFunctions, nonce, testRun) {
  if (arguments.length === 0) {
    log('fastTopups(fastTopupFunctionArray, startingNonce[, testRun]);', $logs);
    return;
  }
  if (txFunctions.length === 0) {
    setTimeout(function() {
      log('Done! Next nonce: ' + nonce + '.', $logs);
      logFinish($logs);
    }, 2000);
    return true;
  }
  txFunctions.shift()(nonce, testRun).then(function(nextNonce){
    fastTopups(txFunctions, nextNonce, testRun);
  });
};

var safeSendFunction = function(to, value, sender, argsObject) {
  if (arguments.length === 0) {
    log('See safeSend(). To be used as part of safeTransactions().', $logs);
    return;
  }
  argsObject = argsObject || {};
  argsObject.value = argsObject.value || value;
  argsObject.to = argsObject.to || to;
  return safeTransactionFunction(eth.sendTransaction, [], sender, argsObject);
};

var safeTransactionFunction = function(fun, params, sender, argsObject) {
  if (arguments.length === 0) {
    log('See safeTransaction(). To be used as part of safeTransactions().', $logs);
    return;
  }
  var merge = function(base, args) {
    var target = ['nonce', 'value', 'gasPrice', 'to', 'data'];
    if (args) {
      while(target.length > 0) {
        var arg = target.pop();
        if (args[arg]) {
          base[arg] = args[arg];
        }
      }
    }
    return base;
  };

  var processFunctionParams = function(paramsToProcess) {
    for (var i = 0; i < paramsToProcess.length; i++) {
      if (typeof paramsToProcess[i] === 'function') {
        paramsToProcess[i] = paramsToProcess[i]();
      }
    }
  };

  var waitReceiptTimeoutSeconds = 120;
  var gas = argsObject && argsObject.gas || 500000;
  return function(testRun) {
    processFunctionParams(params);
    return new Promise(function(resolve, reject) {
      var _params = params.slice(0);
      _params.push(merge({from: sender, gas: 3000000, gasPrice: gasPrice}, argsObject));
      _params.push(function(err, result) {
        if (err) {
          if (err.toString().startsWith('Error: no contract code at given address')) {
            gas = argsObject && argsObject.gas || 21000;
            resolve(gas);
            return;
          }
          reject(err);
        } else {
          resolve(result);
        }
      });
      if (typeof fun.call === "string") {
        eth.estimateGas.apply(this, _params);
      } else {
        fun.estimateGas.apply(this, _params);
      }
    }).then(function(estimateGas) {
      return new Promise(function(resolve, reject) {
        var _params = params.slice(0);
        if (estimateGas > gas) {
          reject('Estimate gas is too big: ' + estimateGas);
        } else if (typeof fun.call === "string") {
          // simple eth.sendTransaction
          resolve(estimateGas);
        } else {
          _params.push(merge({from: sender, gas: gas, gasPrice: gasPrice}, argsObject));
          _params.push('pending');
          _params.push(function(err, result) {
            var success = typeof result.toNumber === 'function' ? result.toNumber() > 0 : result;
            if (err) {
              reject(err);
            } else {
              if (success || (argsObject && argsObject.ignoreCallResponse)) {
                resolve(estimateGas);
              } else {
                reject('Call with gas: ' + gas + ' returned ' + result.toString() + '.');
              }
            }
          });
          fun.call.apply(this, _params);
        }
      });
    }).then(function(estimateGas) {
      return new Promise(function(resolve, reject) {
        var _params = params.slice(0);
        _params.push(merge({from: sender, gas: gas, gasPrice: gasPrice}, argsObject));
        _params.push(function(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve([result, estimateGas]);
          }
        });
        if (testRun || (argsObject && argsObject.testRun)) {
          resolve(['OK', estimateGas]);
          return;
        }
        fun.apply(this, _params);
      });
    }).then(function(result) {
      var value = (argsObject && argsObject.value) ? " value: " + web3.fromWei(argsObject.value.valueOf(), 'ether') + " ETH." : "";
      var to = (argsObject && argsObject.to) ? " to: " + argsObject.to : "";
      var nonce = (argsObject && argsObject.nonce !== undefined) ? " nonce: " + argsObject.nonce : "";
      logSuccess(result[1], result[0], params.join(', ') + to + value + nonce, $logs);
      if (testRun || (argsObject && argsObject.testRun)) {
        return [false, result[1]];
      } else {
        return new Promise(function(resolve, reject) {
          if (argsObject && argsObject.waitReceipt) {
            log('Waiting receipt for ' + result[0], $logs);
            flowControl.__wait__();
            var startTime = nowSeconds();
            var timeoutTime = startTime + waitReceiptTimeoutSeconds;
            var waitReceipt = function(txHash) {
              web3.eth.getTransactionReceipt(txHash, function(err, receipt) {
                var secondsPassed = Math.round(nowSeconds() - startTime);
                if ((receipt && receipt.blockNumber) || flowControl.ready) {
                  flowControl.continue();
                  resolve([secondsPassed, result[1]]);
                } else {
                  var message = 'No transaction receipt after ' + secondsPassed + ' seconds.';
                  if (flowControl.stopping) {
                    flowControl.continue();
                    reject(message);
                    return;
                  }
                  if (nowSeconds() > timeoutTime) {
                    logWarning(message + " If you are sure that transaction is already mined do: flowControl.continue(); If you want to stop execution do: flowControl.stop();", $logs);
                    timeoutTime += 60;
                  }
                  logWaiting($logs);
                  setTimeout(function() { waitReceipt(txHash); }, 1000);
                }
              });
            };
            waitReceipt(result[0]);
          } else {
            var waitPending = function(txHash) {
              web3.eth.getTransaction(txHash, function(err, pending) {
                if (pending) {
                  resolve([false, result[1]]);
                } else {
                  setTimeout(function() { waitPending(txHash); }, 500);
                }
              });
            };
            waitPending(result[0]);
          }
        });
      }
    }).then(function(results) {
      if (results[0]) {
        log('Mined in ' + results[0] + ' seconds.', $logs);
      }
      return [results[1], argsObject && argsObject.value];
    }).catch(function(err) {
      logError(err, $logs);
      log('<hr/>', $logs);
    });
  };
};

var safeTransactions = function(txFunctions, testRun, cumulativeGasUsed, totalValueSpent) {
  if (arguments.length === 0) {
    log('safeTransactions(safeFunctionsArray[, testRun]);', $logs);
    return;
  }
  cumulativeGasUsed = cumulativeGasUsed || 0;
  totalValueSpent = totalValueSpent || 0;
  if (txFunctions.length === 0) {
    log('Done! Cumulative gas used: ' + cumulativeGasUsed + ', total value sent: ' + web3.fromWei(totalValueSpent, 'ether') + ' ETH.', $logs);
    logFinish($logs);
    return true;
  }
  txFunctions.shift()(testRun).then(function(gasUsedAndvalueSpent){
    var gasUsed = gasUsedAndvalueSpent && gasUsedAndvalueSpent[0] || 0;
    var valueSent = web3.toBigNumber(gasUsedAndvalueSpent && gasUsedAndvalueSpent[1] || 0);
    // setTimeout(safeTransactions, 1000, txFunctions, testRun, cumulativeGasUsed + gasUsed, valueSent.add(totalValueSpent));
    safeTransactions(txFunctions, testRun, cumulativeGasUsed + gasUsed, valueSent.add(totalValueSpent));
  });
};

var call = function(contract, properties, target) {
  if (arguments.length === 0) {
    log('call(contract, {name: methodName, params: methodCallParamsArray, alias: toStore}Array, savingObjReference);', $logs);
    return;
  }
  callFunction(contract, properties, target)().then(function() {
    logFinish($logs);
  });
}

var callFunction = function(contract, properties, target) {
  if (arguments.length === 0) {
    log('See call(). To be used as part of safeTransactions().', $logs);
    return;
  }
  var processResult = function(property, alias, done, reject) {
    return function(error, result) {
      if (error) {
        reject("Error while calling property '" + property + "' with message: " + error);
      } else {
        target[alias] = result;
        done();
      }
    };
  };

  return function() {
    return new Promise(function(resolve, reject) {
      var propertiesCount = properties.length;
      var finished = function() {
        if (--propertiesCount === 0) {
          log("Properties collected!", $logs);
          resolve();
        }
      };
      if (propertiesCount === 0) {
        reject("Properties array cannot be empty.");
        return;
      }
      properties.forEach(function(property) {
        if (typeof property === 'object') {
          var params = property.params || [];
          var alias = property.alias || property.name;
          var name = property.name;
        } else {
          var params = [];
          var alias = property;
          var name = property;
        }
        var callParams = params.slice(0);
        params.push('pending');
        params.push(processResult(name, alias, finished, reject));
        if (contract.call === 'eth_getBalance') {
          contract.apply(this, params);
        } else {
          contract[name].call.apply(this, params);
        }
        log("Calling for property: " + name + (callParams.length ? " params: " + callParams.join(', ') : ""), $logs);
      });
    });
  };
};

var assertCallFunction = function(contract, propertyNameOrObject, expectedValue, testRun) {
  if (arguments.length === 0) {
    log('assertCallFunction(contract, propertyNameOrObject, expectedValue, testRun); To be used as part of safeTransactions().', $logs);
    return;
  }
  return asyncFunction(function(resolve, reject, _testRun) {
    var callObj = {};
    var propertyName = propertyNameOrObject.alias || propertyNameOrObject.name || propertyNameOrObject;
    callFunction(contract, [propertyNameOrObject], callObj)()
    .then(function() {
      if (callObj[propertyName].toString() !== expectedValue.toString()) {
        if (_testRun) {
          resolve();
        }
        reject(propertyName + ' is expected to be: "' + expectedValue + '" actual: "' + callObj[propertyName] + '"');
        return;
      }
      resolve();
    }, testRun)
    .catch(reject);
  });
};

var asyncFunction = function(fun, testRun) {
  if (arguments.length === 0) {
    log('asyncFunction(function(testRun) {}, testRun); To be used as part of safeTransactions().', $logs);
    return;
  }
  return function(_testRun) {
    return new Promise(function(resolve, reject) {
      fun(resolve, reject, _testRun || testRun);
    });
  };
};

var syncFunction = function(fun) {
  if (arguments.length === 0) {
    log('syncFunction(function(testRun) {}); To be used as part of safeTransactions().', $logs);
    return;
  }
  return function(testRun) {
    return new Promise(function(resolve, _) {
      fun(testRun);
      resolve();
    });
  };
};

var getBalance = function(sender) {
  sender = sender || address;
  eth.getBalance(sender, 'pending', function(err, balance) {
    if (err) {
      throw err;
    }
    log(sender + ' address balance is ' + web3.fromWei(balance, 'ether').toString() + ' ETH', $logs);
  });
};

var deployContract = function(...args) {
  if (args.length === 0) {
    log('deployContract(byteCodeString, abiArray, sender[, globalNameToAssign, callback(contract), gas, nonce]);', $logs);
    return;
  }
  deployContractComplex([], ...args);
};

var deployContractComplex = function(constructorArgs, bytecode, abi, from, name, callback, gas, nonce) {
  if (arguments.length === 0) {
    log('deployContractComplex(constructorArgs, byteCodeString, abiArray, sender[, globalNameToAssign, callback(contract), gas, nonce]);', $logs);
    return;
  }
  callback = typeof name === 'function' ? name : callback;
  name = typeof name !== 'function' ? name : false;
  var params = {
    from: from,
    data: bytecode[1] === 'x' ? bytecode : '0x' + bytecode,
    gas: gas || 3900000, // leave some space for other transactions
    gasPrice: gasPrice
  };
  if (nonce !== undefined) {
    params.nonce = nonce;
  }
  eth.contract(abi).new(
    ...constructorArgs,
    params,
    function(e, contract) {
      if (e) {
        logError(e, $logs);
      } else if (typeof contract.address != 'undefined') {
        log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash, $logs);
        if (name) {
          window[name] = eth.contract(abi).at(contract.address);
          log('Deployed contract is accessible by `' + name + '` global variable.', $logs);
        }
        if (callback) {
          callback(eth.contract(abi).at(contract.address));
        }
      } else {
        log('Contract deployment transaction: ' + contract.transactionHash + '. Waiting for receipt.', $logs);
      }
    }
  );
};