window.onload = function() {
  if (window.opts && window.opts.gethUrl) {
    return;
  }
  const match = window.location.href.match(/\?(https?.+)$/);
  if (match) {
    setRpcUrl(match[1]);
  }
};

var $logs = $('#logs');
$logs.css('word-wrap', 'break-word');
var web3 = EToken.web3;
var eth;
var ethAsync;
var address;
var sender;
var SIMULATION_BLOCK = window.opts && window.opts.simulationBlock || 'pending';

var nowSeconds = function(){return (Date.now() / 1000);};

var gasPrice = web3.toBigNumber(web3.toWei(20, 'gwei'));

var cb = function(err,ok){if (err) {console.log(err);} else {console.log(ok);}};
var cbval = function(err,ok){if (err) {console.log(err);} else {console.log(ok.valueOf());}};

var setPrivateKey = function(pk) {
  if (pk === undefined) {
    EToken.setPrivateKey(prompt('Enter your private key in here:'));
  } else {
    EToken.setPrivateKey(pk);
  }
  address = EToken.privateToAddress(('0x' + pk).slice(-64));
  sender = address;
  log('Your address(global variable `address` or `sender`) to send transactions: ' + address, $logs);
};

const setRpcUrl = function(url, logger, doNotSend = false) {
  if (url === undefined) {
    EToken.setRpcUrl(prompt('Enter your Ethereum node RPC URL in here:'));
  } else {
    EToken.setRpcUrl(url, logger, doNotSend);
  }
  // Stop blocks polling.
  EToken.web3.currentProvider.stop();
  EToken.web3.currentProvider._ready.go();
  eth = web3.eth;
  ethAsync = Promise.promisifyAll(eth);
}

var setGasPriceInGWei = function(gasPriceInGWei) {
  gasPrice = web3.toBigNumber(gasPriceInGWei).mul(1000000000);
  getGasPrice();
}

var getGasPrice = function() {
  log('GasPrice is ' + gasPrice.div(1000000000).toFixed() + ' gwei.', $logs);
  return gasPrice;
}

var help = function() {
  log('Here is the list of functions you can use:', $logs);
  log('setRpcUrl(rpcUrl);', $logs);
  log('setPrivateKey(privateKey);', $logs);
  log('getBalance([address]);', $logs);
  log('getGasPrice();', $logs);
  log('setGasPriceInGWei(gasPriceInGWei);', $logs);
  log('safeTransaction(contract.method, paramsArray, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
  log('safeSend(toAddress, valueInWei, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
  log('safeSendAll(toAddress, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
  log('safeTopup(toAddress, targetValueInWei, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
  log('fastTopup(toAddress, targetValueInWei, sender, nonce[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
  log('fastTopups(fastTopupFunctionArray, startingNonce[, testRun]);', $logs);
  log('safeTransactions(safeFunctionsArray[, testRun[, fastRun]]);', $logs);
  log('call(contract, {name: methodName, params: methodCallParamsArray, alias: toStore}Array, savingObjReference);', $logs);
  log('assertCallFunction(contract, propertyNameOrObject, expectedValue, testRun); To be used as part of safeTransactions().', $logs);
  log('asyncFunction(function(testRun) {}, testRun); To be used as part of safeTransactions().', $logs);
  log('syncFunction(function(testRun) {}); To be used as part of safeTransactions().', $logs);
  log('deployContractComplex(constructorArgs, byteCodeString, abiArray, sender[, globalNameToAssign, callback(contract), gas, nonce]);', $logs);
  log('smartDeployContract({constructorArgs, bytecode, abi, sender, name, gas, nonce, waitReceipt, fastRun, deployedAddress});', $logs);
  log('callNode(method, params = []);', $logs);
  log('getPendingTransactions(address, tries = 40);', $logs);
  log('speedUp(transactionHashes, gasPriceInGWei);', $logs);
  log('getFutureTransactions(address, tries = 40);', $logs);
  log('getAllFutureTransactionsByAddress(address, lastMinedNonce, lastSentNonce);', $logs);
  log('getAllFutureTransactionsByAddressProbabalistic(address, tries = 4);', $logs);
  log('rewrite(rawTransactions, gasPriceInGWei);', $logs);
  log('readAndRewrite(transactionHashes, gasPriceInGWei);', $logs);
  log('propagate(transactionHashes[, skipNotFound = true, concurrency = 50]);', $logs);
  log('getTransactions(transactionHashes[, skipNotFound = false, concurrency = 50]);', $logs);
  log('propagateRaws(rawTransactions[, concurrency = 50]);', $logs);
  log('sumTxCost(transactionHashes);', $logs);
  log('makeRequest(method, url);', $logs);
  log('getEthplorerInfo(address, apiKey = freekey);', $logs);
  log('getEthplorerInfos(addresses, concurrency = 1, apiKey = freekey);', $logs);
  log('', $logs);
  log('Some additional help available if you call the function without parameters.', $logs);
}

var _log = function(message, logger) {
  logger.prepend(message);
}

var log = function(message, logger) {
  console.log(message);
  if (logger) {
    _log('<p>' + message + '</p>', logger);
  }
};

var logError = function(error, logger, dontThrow) {
  if (logger) {
    _log(`<p class="error">${error.message || error} ${error.data || ''}</p>`, logger);
  }
  if (dontThrow) {
    console.error(error.message || error, error.data);
    return;
  }
  throw error;
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
  return safeTransactionFunction(fun, params, sender, argsObject)().catch(function(err) {
    logError(err, $logs, true);
  }).tap(function() {
    logFinish($logs);
  });
};

var safeSend = function(to, value, sender, argsObject) {
  if (arguments.length === 0) {
    log('safeSend(toAddress, valueInWei, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  return safeSendFunction(to, value, sender, argsObject)().tap(function() {
    logFinish($logs);
  });
};

var safeSendAll = function(to, sender, argsObject) {
  if (arguments.length === 0) {
    log('safeSendAll(toAddress, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  return ethAsync.getBalanceAsync(sender, SIMULATION_BLOCK)
  .then(balance => {
    argsObject = argsObject || {};
    argsObject.gas = web3.toBigNumber(argsObject && argsObject.gas || 21000);
    argsObject.gasPrice = web3.toBigNumber(argsObject && argsObject.gasPrice || gasPrice);
    var value = balance.sub(argsObject.gasPrice.mul(argsObject.gas));
    return safeSend(to, value, sender, argsObject);
  });
};

var safeTopup = function(to, targetValue, sender, argsObject) {
  if (arguments.length === 0) {
    log('safeTopup(toAddress, targetValueInWei, sender[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  return safeTopupFunction(to, targetValue, sender, argsObject)().tap(function() {
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
    ethAsync.getBalanceAsync(to, SIMULATION_BLOCK)
    .then(balance => {
      var value = web3.toBigNumber(targetValue).sub(balance);
      if (value.lte(0)) {
        log("Skipping: balance of " + to + " is " + web3.fromWei(balance, 'ether') + " ETH and it is more or equal to target value of " + web3.fromWei(targetValue, 'ether') + " ETH.", $logs);
        return 0;
      }
      return safeSendFunction(to, value, sender, argsObject)(testRun);
    })
    .then(resolve)
    .catch(reject);
  });
};

var fastTopup = function(to, targetValue, sender, nonce, argsObject) {
  if (arguments.length === 0) {
    log('fastTopup(toAddress, targetValueInWei, sender, nonce[, {testRun: true, ignoreCallResponse: true, waitReceipt: true, transactionObjParams}]);', $logs);
    return;
  }
  return fastTopupFunction(to, targetValue, sender, argsObject)(nonce).tap(function(nonce) {
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
      ethAsync.getBalanceAsync(to, SIMULATION_BLOCK)
      .then(balance => {
        var value = web3.toBigNumber(targetValue).sub(balance);
        if (value.lte(0)) {
          log("Skipping: balance of " + to + " is " + web3.fromWei(balance, 'ether') + " ETH and it is more or equal to target value of " + web3.fromWei(targetValue, 'ether') + " ETH.", $logs);
          return nonce;
        }
        if (argsObject) {
          argsObject.nonce = nonce;
        } else {
          argsObject = {nonce: nonce};
        }
        safeSendFunction(to, value, sender, argsObject)(testRun).catch(error => {
          console.error(to, value, error);
        });
        return nonce+1;
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
  return txFunctions.shift()(nonce, testRun).then(nextNonce => fastTopups(txFunctions, nextNonce, testRun));
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
  return function(testRun, fastRun) {
    processFunctionParams(params);
    return new Promise(function(resolve, reject) {
      var _params = params.slice(0);
      _params.push(merge({from: sender, gas: Math.max(3000000, gas), gasPrice: gasPrice}, argsObject));
      _params.push(SIMULATION_BLOCK);
      _params.push(function(err, result) {
        if (err) {
          if (err.toString().toLowerCase().includes('execution error')) {
            if (fastRun) {
              resolve(gas);
              return;
            }
          }
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
          reject(new Error('Estimate gas is too big: ' + estimateGas));
        } else if (typeof fun.call === "string" || fastRun || (argsObject && argsObject.ignoreCallResponse)) {
          // simple eth.sendTransaction
          resolve(estimateGas);
        } else {
          var repeater = function(tries, funcToCall, funcToCallArgs) {
            var _repeat = function() {
              if (tries-- === 0) {
                return false;
              }
              logWaiting($logs);
              setTimeout(() => funcToCall.apply(null, funcToCallArgs), 500);
              return true;
            };
            return _repeat;
          };
          var retries = (testRun || (argsObject && argsObject.testRun)) ? 1 : 40;
          var repeat = repeater(retries, fun.call, _params);
          _params.push(merge({from: sender, gas: gas, gasPrice: gasPrice}, argsObject));
          _params.push(SIMULATION_BLOCK);
          _params.push(function(err, result) {
            var success = typeof result.toNumber === 'function' ? result.toNumber() > 0 : result;
            if (err) {
              reject(err);
            } else {
              if (success) {
                resolve(estimateGas);
              } else {
                if (!repeat()) {
                  reject(new Error('Call with gas: ' + gas + ' returned ' + result.toString() + ' ' + retries + ' times in a row.'));
                }
              }
            }
          });
          repeat();
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
      }
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
          return waitReceipt(result[0]);
        }
        if (fastRun) {
          return resolve([false, result[1]]);
        }
        return waitTransactionEvaluation(result[0]).then(() => resolve([false, result[1]])).catch(reject);
      });
    }).then(function(results) {
      if (results[0]) {
        log('Mined in ' + results[0] + ' seconds.', $logs);
      }
      return [results[1], argsObject && argsObject.value];
    });
  };
};

var safeTransactions = function(...args) {
  var _safeTransactions = function(txFunctions, testRun, fastRun, cumulativeGasUsed, totalValueSpent) {
    if (arguments.length === 0) {
      log('safeTransactions(safeFunctionsArray[, testRun[, fastRun]]);', $logs);
      return Promise.resolve();
    }
    cumulativeGasUsed = cumulativeGasUsed || 0;
    totalValueSpent = totalValueSpent || 0;
    if (txFunctions.length === 0) {
      log('Done! Cumulative gas used: ' + cumulativeGasUsed + ', total value sent: ' + web3.fromWei(totalValueSpent, 'ether') + ' ETH.', $logs);
      logFinish($logs);
      return Promise.resolve();
    }
    return txFunctions.shift()(testRun, fastRun).then(function(gasUsedAndvalueSpent){
      var gasUsed = gasUsedAndvalueSpent && gasUsedAndvalueSpent[0] || 0;
      var valueSent = web3.toBigNumber(gasUsedAndvalueSpent && gasUsedAndvalueSpent[1] || 0);
      return _safeTransactions(txFunctions, testRun, fastRun, cumulativeGasUsed + gasUsed, valueSent.add(totalValueSpent));
    });
  };
  return _safeTransactions(...args)
  .catch(function(err) {
    logError(err, $logs, true);
    logFinish($logs);
    throw err;
  });
};

var call = function(contract, properties, target) {
  if (arguments.length === 0) {
    log('call(contract, {name: methodName, params: methodCallParamsArray, alias: toStore}Array, savingObjReference);', $logs);
    return;
  }
  return callFunction(contract, properties, target)().tap(function() {
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
        reject(new Error("Error while calling property '" + property + "' with message: " + error));
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
        reject(new Error('Properties array cannot be empty.'));
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
        params.push(SIMULATION_BLOCK);
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
        reject(new Error(propertyName + ' is expected to be: "' + expectedValue + '" actual: "' + callObj[propertyName] + '"'));
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
  return ethAsync.getBalanceAsync(sender, SIMULATION_BLOCK)
  .tap(balance => {
    log(sender + ' address balance is ' + web3.fromWei(balance, 'ether').toString() + ' ETH', $logs);
  });
};

var getTransaction = function(txHash, tries = 40) {
  if (tries === 0) {
    return Promise.reject(new Error(`Transaction ${txHash} not found.`));
  }
  return ethAsync.getTransactionAsync(txHash)
  .then(tx => {
    if (tx) {
      return tx;
    }
    return delay(500)
    .then(() => getTransaction(txHash, tries - 1));
  })
};

var delay = function(msec) {
  return Promise.delay(msec);
};

var getBlock = function(block) {
  return ethAsync.getBlockAsync(block || 'latest');
};

var waitTransactionEvaluation = function(txHash) {
  return getTransaction(txHash)
  .then(tx => {
    if (tx.blockNumber) {
      return true;
    }
    return getBlock(SIMULATION_BLOCK)
    .then(block => {
      if (block.transactions.indexOf(txHash) >= 0) {
        return true;
      }
      return delay(500).then(() => waitTransactionEvaluation(txHash));
    });
  })
};

var deployContractAsync = function(...args) {
  return deployContractComplexAsync([], ...args);
};

var deployContractComplexAsync = function(constructorArgs, bytecode, abi, sender, name, gas, nonce) {
  return deployContractComplex(constructorArgs, bytecode, abi, sender, name, resolve, gas, nonce);
};

var deployContract = function(...args) {
  if (args.length === 0) {
    log('deployContract(byteCodeString, abiArray, sender[, globalNameToAssign, callback(contract), gas, nonce]);', $logs);
    return;
  }
  return deployContractComplex([], ...args);
};

var deployContractComplex = function(constructorArgs, bytecode, abi, sender, name, callback, gas, nonce) {
  if (arguments.length === 0) {
    log('deployContractComplex(constructorArgs, byteCodeString, abiArray, sender[, globalNameToAssign, callback(contract), gas, nonce]);', $logs);
    return;
  }
  callback = typeof name === 'function' ? name : callback;
  name = typeof name !== 'function' ? name : false;
  return smartDeployContract({
    constructorArgs,
    bytecode,
    abi,
    sender,
    name,
    gas,
    nonce,
    waitReceipt: true,
  }).then(contract => {
    if (callback) {
      callback(contract);
    }
  });
};

function waitForReceipt(txHash) {
  return retry(
    async () => {
      const result = await eth.getTransactionReceiptAsync(txHash);
      if (not(result) || not(result.blockNumber)) {
        throw new Error('Not mined yet');
      }
      return result;
    },
    4000
  );
}

var smartDeployContract = function(args) {
  if (arguments.length === 0) {
    log('smartDeployContract({constructorArgs, bytecode, abi, sender, name, gas, nonce, waitReceipt, fastRun, deployedAddress});', $logs);
    return;
  }
  const constructorArgs = args.constructorArgs || [];
  const bytecode = args.bytecode;
  const abi = args.abi || [];
  const sender = args.sender;
  const name = args.name;
  const gas = args.gas;
  const nonce = args.nonce;
  const waitReceipt = args.waitReceipt;
  const fastRun = args.fastRun;
  const deployedAddress = args.deployedAddress;
  const params = {
    from: sender,
    data: bytecode[1] === 'x' ? bytecode : '0x' + bytecode,
    gas: gas || 3900000, // leave some space for other transactions
    gasPrice: gasPrice,
  };
  if (nonce !== undefined) {
    params.nonce = nonce;
  }
  let processed = false;
  if (deployedAddress) {
    const contract = eth.contract(abi).at(deployedAddress);
    if (name) {
      window[name] = contract;
      log(`Deployed contract is accessible by '${name}' global variable.`, $logs);
    }
    return Promise.resolve(contract);
  }
  return new Promise((resolve, reject) => {
    eth.contract(abi).new(
      ...constructorArgs,
      params,
      (e, contract) => {
        if (e) {
          return reject(e);
        }
        if (waitReceipt) {
          if (typeof contract.address != 'undefined') {
            log(`Contract mined! address: ${contract.address} transactionHash: ${contract.transactionHash}`, $logs);
            return resolve(eth.contract(abi).at(contract.address));
          } else {
            log(`Contract deployment transaction: ${contract.transactionHash}. Waiting for receipt.`, $logs);
          }
        } else {
          if (processed) {
            return;
          }
          log(`Contract deployment transaction: ${contract.transactionHash}.`, $logs);
          processed = true;
          getTransaction(contract.transactionHash)
          .then(tx => {
            const result = eth.contract(abi).at(tx.creates);
            if (fastRun) {
              return result;
            }
            return waitTransactionEvaluation(contract.transactionHash)
            .then(() => result);
          }).then(resolve).catch(reject);
        }
      }
    );
  }).then(contract => {
    if (name) {
      window[name] = contract;
      log(`Deployed contract is accessible by '${name}' global variable. Contract address: ${contract.address}`, $logs);
    }
    return contract;
  }).catch(function(err) {
    logError(err, $logs, false);
  });
};

function callNode(method, params = []) {
  if (arguments.length === 0) {
    log('callNode(method, params = []);', $logs);
    return;
  }
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: method,
      id: new Date().getTime(),
      params: params,
    }, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result.result);
    });
  });
}

function getPendingTransactions(addr, tries = 40) {
  if (arguments.length === 0) {
    log('getPendingTransactions(address, tries = 40);', $logs);
    return;
  }
  return callNode('parity_pendingTransactions')
  .then(pendings => pendings.filter(txDetails => txDetails.from == addr.toLowerCase()))
  .then(filtered => filtered.length > 0 ? filtered : Promise.delay(500).then(() => getPendingTransactions(addr, tries - 1)));
}

function speedUp(transactions, gasPriceInGWei) {
  if (arguments.length === 0) {
    log('speedUp(transactionHashes, gasPriceInGWei);', $logs);
    log('Resend all the specified transactions with specified (usually increased) gas price.', $logs);
    log('Attention: reorders address\'s transactions by pushing specified ones to the beginning of the queue.', $logs);
    log('Consider using readAndRewrite() instead.', $logs);
    return;
  }
  const gasPriceLocal = web3.toWei(gasPriceInGWei, 'gwei');
  const ethAsync = Promise.promisifyAll(eth);
  let queue;
  let nonce;
  setPrivateKey(prompt('Please enter your private key'));
  return Promise
  .map(transactions, txHash => getTransaction(txHash))
  .then(transactionsDetails => queue = transactionsDetails)
  .then(() => console.log('Processing', JSON.stringify(queue)))
  .then(() => ethAsync.getTransactionCountAsync(address, 'latest'))
  .then(startingNonce => nonce = startingNonce)
  .then(() => Promise.reduce(queue, (nextNonce, txDetails) => {
    return ethAsync.sendTransactionAsync({
      to: txDetails.to,
      from: txDetails.from,
      gas: txDetails.gas,
      gasPrice: gasPriceLocal,
      data: txDetails.input,
      nonce: nextNonce,
      value: 0,
    })
    .then(txHash => {
      console.log(txDetails.hash, 'resent with', txHash, 'and nonce', nextNonce);
      return nextNonce + 1;
    })
    .catch(err => {
      console.log(txDetails.hash, 'failed to be sent');
      throw err;
    });
  }, nonce))
  .then(() => console.log('Done!') || true);
}

function getFutureTransactions(addr, tries = 40) {
  if (arguments.length === 0) {
    log('getFutureTransactions(address, tries = 40);', $logs);
    log('Retries till find atleast 1 tx.', $logs);
    return;
  }
  return callNode('parity_futureTransactions')
  .then(pendings => pendings.filter(txDetails => txDetails.from == addr.toLowerCase()))
  .then(filtered => filtered.length > 0 ? filtered : Promise.delay(500).then(() => getFutureTransactions(addr, tries - 1)));
}

function getAllFutureTransactionsByAddress(addr, lastMinedNonce, lastSentNonce) {
  if (arguments.length === 0) {
    log('getAllFutureTransactionsByAddress(address, lastMinedNonce, lastSentNonce);', $logs);
    log('Retries till find atleast lastSentNonce-lastMinedNonce transactions.', $logs);
    return;
  }
  var uniques = function(list, idFunc) {
    var uni = {};
    return list.filter(el => uni[idFunc(el)] ? false : uni[idFunc(el)] = true);
  };
  var getFuture = function(accum = []) {
    return getFutureTransactions(addr, 4)
    .then(txs => uniques(accum.concat(txs), el => el.nonce))
    .then(total => (total.length <= lastSentNonce - lastMinedNonce) ? console.log('Try more', total.length) || getFuture(total) : total);
  };
  return getFuture()
  .then(total => total.sort((a, b) => web3.toDecimal(a.nonce) - web3.toDecimal(b.nonce)));
}

function getAllFutureTransactionsByAddressProbabalistic(addr, tries = 4) {
  if (arguments.length === 0) {
    log('getAllFutureTransactionsByAddressProbabalistic(address, tries = 4);', $logs);
    log('Calls getFutureTransactions(address, 4) for tries number of times and returns all the unique results.', $logs);
    return;
  }
  var trial = 0;
  var uniques = function(list, idFunc) {
    var uni = {};
    return list.filter(el => uni[idFunc(el)] ? false : uni[idFunc(el)] = true);
  };
  var getFuture = function(accum = []) {
    return getFutureTransactions(addr, 4)
    .then(txs => uniques(accum.concat(txs), el => el.nonce))
    .then(total => (trial++ <= tries) ? getFuture(total) : total);
  };
  return getFuture()
  .then(total => total.sort((a, b) => web3.toDecimal(a.nonce) - web3.toDecimal(b.nonce)))
  .tap(console.log);
}

function rewrite(transactions, gasPriceInGWei) {
  if (arguments.length === 0) {
    log('rewrite(rawTransactions, gasPriceInGWei);', $logs);
    log('Resend all the raw transactions changing only the gas price.', $logs);
    log('No side effects.', $logs);
    return;
  }
  const gasPriceLocal = web3.toWei(gasPriceInGWei, 'gwei');
  const result = [];
  setPrivateKey(prompt('Please enter your private key'));
  return Promise.each(transactions, txDetails => {
    return ethAsync.sendTransactionAsync({
      to: txDetails.to,
      from: txDetails.from,
      gas: txDetails.gas,
      gasPrice: gasPriceLocal,
      data: txDetails.input,
      nonce: txDetails.nonce,
      value: txDetails.value,
    })
    .then(txHash => {
      console.log(txDetails.hash, 'resent with', txHash);
      result.push([txDetails.hash, txHash])
      return true;
    })
    .catch(err => {
      if (err.message.includes('nonce') || err.message.includes('imported')) {
        return true;
      }
      console.log(txDetails.hash, 'failed to be sent');
      // throw err;
    });
  })
  .then(() => console.log(result) || result);
}

function readAndRewrite(transactionHashes, gasPriceInGWei) {
  if (arguments.length === 0) {
    log('readAndRewrite(transactionHashes, gasPriceInGWei);', $logs);
    log('Gets transactions by hashes and resend them changing only the gas price.', $logs);
    log('No side effects.', $logs);
    return;
  }
  const gasPriceLocal = web3.toWei(gasPriceInGWei, 'gwei');
  const result = [];
  setPrivateKey(prompt('Please enter your private key'));
  return Promise.map(transactionHashes, txHash => getTransaction(txHash, 10), {concurrency: 20})
  .each(txDetails => {
    return ethAsync.sendTransactionAsync({
      to: txDetails.to,
      from: txDetails.from,
      gas: txDetails.gas,
      gasPrice: gasPriceLocal,
      data: txDetails.input,
      nonce: txDetails.nonce,
      value: txDetails.value,
    })
    .then(txHash => {
      console.log(txDetails.hash, 'resent with', txHash);
      result.push([txDetails.hash, txHash])
      return true;
    })
    .catch(err => {
      if (err.message.includes('nonce') || err.message.includes('imported')) {
        return true;
      }
      console.log(txDetails.hash, 'failed to be sent', err.message || err);
      // throw err;
    });
  })
  .then(() => console.log(result) || result);
}

function propagate(transactionHashes, skipNotFound = true, concurrency = 50) {
  if (arguments.length === 0) {
    log('propagate(transactionHashes[, skipNotFound = true, concurrency = 50]);', $logs);
    log('Gets transactions by hashes and resends them for better propagation.', $logs);
    log('Returns promise that resolves to a list of raw transactions.', $logs);
    log('No side effects.', $logs);
    return;
  }
  return getTransactions(transactionHashes, skipNotFound, concurrency)
  .map(tx => tx.raw)
  .then(raws => propagateRaws(raws, concurrency));
}

function getTransactions(transactionHashes, skipNotFound = false, concurrency = 50) {
  if (arguments.length === 0) {
    log('getTransactions(transactionHashes[, skipNotFound = false, concurrency = 50]);', $logs);
    log('Gets transactions by hashes.', $logs);
    log('Returns promise that resolves to a list of transaction objects.', $logs);
    log('No side effects.', $logs);
    return;
  }
  return Promise.map(transactionHashes, tx =>
    getTransaction(tx, 5)
    .catch(err => skipNotFound ? 'Skip' : Promise.reject(err))
  )
  .then(txs => txs.filter(el => el != 'Skip'))
  .tap(console.log);
}

function propagateRaws(rawTransactions, concurrency = 50) {
  if (arguments.length === 0) {
    log('propagateRaws(rawTransactions[, concurrency = 50]);', $logs);
    log('Resends raw transactions for better propagation.', $logs);
    log('Returns promise that resolves to input rawTransactions.', $logs);
    log('No side effects.', $logs);
    return;
  }
  return Promise.map(rawTransactions, raw =>
    ethAsync.sendRawTransactionAsync(raw)
    .catch(err => err.message.includes('imported') ? true : console.log(err)),
    {concurrency}
  )
  .then(() => rawTransactions)
  .tap(() => console.log(rawTransactions.length, 'transactions propagated.'));
}

function sumTxCost(transactions) {
  if (arguments.length === 0) {
    log('sumTxCost(transactionHashes);', $logs);
    log('Get total ETH spent for specified transactions. Returns BigNumber.', $logs);
    return;
  }
  const retry = (fun, ...params) => {
    return fun(...params).catch(err => {
      console.log('Retrying');
      return Promise.delay(100).then(() => retry(fun, ...params));
    });
  };
  const ethAsync = Promise.promisifyAll(eth);
  let sum = web3.toBigNumber(0);
  return Promise.map(
    transactions,
    txHash => retry(ethAsync.getTransactionAsync, txHash)
      .then(tx => retry(ethAsync.getTransactionReceiptAsync, txHash)
        .then(receipt => sum = sum.add(web3.toBigNumber(tx.gasPrice).mul(receipt.gasUsed)))
      ),
    {concurrency: 100}
  )
  .then(() => console.log(web3.fromWei(sum).toFixed() + ' ETH') || sum);
}

function makeRequest(method, url) {
  if (arguments.length === 0) {
    log('makeRequest(method, url);', $logs);
    log('Promisified and simplified AJAX request.', $logs);
    return;
  }
  return new Promise(function (resolve, reject) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.send();
    } catch(e) {
      reject({
        status: 0,
        statusText: e && e.message ? e.message : e
      });
    }
  });
}

function retry(fun, delay, ...params) {
  if (arguments.length === 0) {
    log('retry(fun, delay, ...params);', $logs);
    log('Retry promise returning function (fun) till it is resolved.', $logs);
    return;
  }
  return fun(...params).catch(err => {
    console.log('Retrying');
    return Promise.delay(delay).then(() => retry(fun, delay, ...params));
  });
};

function jQueryRequest(...params) {
  if (arguments.length === 0) {
    log('jQueryRequest(...params);', $logs);
    log('Promisified version of $.ajax().', $logs);
    return;
  }
  return new Promise((resolve, reject) => {
    const query = $.ajax(...params);
    query.then((...results) => resolve(results));
    query.fail(fail => reject(fail));
  });
}

function stringifyNumbers(json) {
  if (arguments.length === 0) {
    log('stringifyNumbers(json);', $logs);
    log('Wrap all numbers in double quotes inside of the JSON to not lose precision.', $logs);
    return;
  }
  return json.replace(/":([\d.e+-]+)/g, '":"$1"');
}

async function getEthplorerInfo(address, apiKey = 'freekey') {
  if (arguments.length === 0) {
    log('getEthplorerInfo(address, apiKey = freekey);', $logs);
    log('Get info about all the address token balances and their value in USD.', $logs);
    return;
  }
  const response = await retry(jQueryRequest, 5000, {url: `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=${apiKey}`}).then(([_1, _2, res]) => res.responseText);
  const info = JSON.parse(stringifyNumbers(response));
  info.tokens = info.tokens || [];
  for (let token of info.tokens) {
    token.balanceHuman = web3.toBigNumber(token.balance).div(web3.toBigNumber(10).pow(token.tokenInfo.decimals));
    token.value = web3.toBigNumber(0);
    if (token.tokenInfo.price) {
      token.value = token.balanceHuman.mul(token.tokenInfo.price.rate);
    }
  }
  info.totalValue = info.tokens.reduce((prev, next) => prev.add(next.value.gt(0) && next.tokenInfo.price.currency == 'USD' ? next.value : 0), web3.toBigNumber(0));
  return info;
}

async function getEthplorerInfos(addresses, concurrency = 1, apiKey = 'freekey') {
  if (arguments.length === 0) {
    log('getEthplorerInfos(addresses, concurrency = 1, apiKey = freekey);', $logs);
    log('Get infos about all the addresses token balances and their values in USD. Only increase concurrency if using personal apiKey.', $logs);
    return;
  }
  const results = await Promise.map(addresses, address => getEthplorerInfo(address, apiKey), {concurrency});
  const totals = {};
  for (let result of results) {
    for (let token of result.tokens) {
      const tokenAddress = token.tokenInfo.address;
      log(`Address ${result.address} has ${token.balanceHuman.toFixed()} ${token.tokenInfo.name} which is ${token.value.toFormat(2)} USD`, $logs);
      totals[tokenAddress] = totals[tokenAddress] || { sumTokens: web3.toBigNumber(0), sumValue: web3.toBigNumber(0), name: token.tokenInfo.name || '_unknown' };
      totals[tokenAddress].sumTokens = totals[tokenAddress].sumTokens.add(token.balanceHuman);
      totals[tokenAddress].sumValue = totals[tokenAddress].sumValue.add(token.value);
    }
  }
  let totalValue = web3.toBigNumber(0);
  for (let token in totals) {
    log(`Total of ${totals[token].sumTokens.toFixed()} ${totals[token].name} which is ${totals[token].sumValue.toFormat(2)} USD`, $logs);
    totalValue = totalValue.add(totals[token].sumValue);
  }
  log(`Total value is ${totalValue.toFormat(2)} USD`, $logs);
  return totals;
}

function buildMultiTransferData(receiverAndAmount) {
  logFinish($logs);
  const unsafeMultiplexor = eth.contract([{"constant":false,"inputs":[{"name":"_address","type":"address[]"},{"name":"_amount","type":"uint256[]"}],"name":"multiTransfer","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"}])
  .at('0x4eC4142B862C798b3056F5cc32ab25803828C823');
  if (!(receiverAndAmount instanceof Array)) {
    logError(`Input is not an array.`, $logs, true);
    return false;
  }
  const receivers = [];
  const amounts = [];
  let totalAmount = web3.toBigNumber(0);
  receiverAndAmount.forEach(([receiver, amount]) => {
    if (!web3.isAddress(receiver)) {
      logError(`${receiver} is not a correct address.`, $logs, false);
    }
    const amountWei = web3.toBigNumber(web3.toWei(amount));
    receivers.push(receiver);
    amounts.push(amountWei);
    totalAmount = totalAmount.add(amountWei);
    log(`${receiver} ${web3.fromWei(amountWei).toFixed()} ETH`, $logs);
  });
  const data = unsafeMultiplexor.multiTransfer.getData(receivers, amounts);
  log(`Additional data: ${data}`, $logs);
  log(`Amount: ${web3.fromWei(totalAmount).toFixed()}`, $logs);
  log(`To: ${unsafeMultiplexor.address}`, $logs);
  logFinish($logs);
  return true;
}

function pairsIntoBatches(pairsList, devidedListSize = 199, ignoreCheckSum = false) {
  pairsList.forEach(([address, amount]) => {
    if (!web3.isAddress(ignoreCheckSum ? address.toLowerCase() : address)) {
      throw new Error(`Address ${address} is invalid or checksum is invalid.`);
    }
    web3.toBigNumber(amount); // Will fail if something is wrong with the amount.
  });
  let j = -1;
  const allData = {};
  allData.addresses = [];
  allData.amounts = [];
  const addressList = [];
  const amountList = [];
  for (let i = 0; i < pairsList.length; i++) {
    addressList[i] = pairsList[i][0];
    amountList[i] = pairsList[i][1];
  }
  for (let i = 0; i < pairsList.length; i++) {
    if (i % devidedListSize == 0) {
      allData.addresses.push([]);
      allData.amounts.push([]);
      j++;
    }
    allData.addresses[j].push(addressList[i]);
    allData.amounts[j].push(amountList[i]);
  }
  return allData;
}

function preparePayoutListingRaws(nonce, payoutContract, listingPairs, baseUnit = 0, batchSize = 199, gas = 5500000) {
  const multiplier = web3.toBigNumber(10).pow(baseUnit);
  const preparedPairs = listingPairs.map(pair => [pair[0], multiplier.mul(pair[1]).floor().toFixed()]);
  const listingData = pairsIntoBatches(preparedPairs, batchSize);
  const raws = [];
  const builder = EToken.buildRawTransaction(payoutContract, 'setUsersList');

  for (let i = 0; i < listingData.addresses.length; i++) {
    raws.push(builder(listingData.addresses[i], listingData.amounts[i], {from: address, gas: 5500000, nonce: nonce + i, gasPrice, value: 0}));
  }
  return raws;
}

function preparePayoutDistributionRaws(nonce, payoutContract, listingPairs) {
  const listingData = pairsIntoBatches(listingPairs, 30);
  const raws = [];
  const builder = EToken.buildRawTransaction(payoutContract, 'distribute');

  for (let i = 0; i < listingData.addresses.length; i++) {
    raws.push(builder(listingData.addresses[i], {from: address, gas: 5000000, nonce: nonce + i, gasPrice, value: 0}));
  }
  return raws;
}

function stripHexPrefix(hex) {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

function getCloneDeploymentData(prototypeAddress) {
  return `0x602d600081600a8239f358368180378080368173${stripHexPrefix(prototypeAddress)}5af43d91908282803e602b57fd5bf3`;
}
