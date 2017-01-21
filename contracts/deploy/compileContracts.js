var solc = require('solc');
var fs = require('fs');
var async = require('async');

var compileContract = function(code, callback) {
  let input = code;
  let output = solc.compile(input, 1); // 1 activates the optimiser
  for (let contractName in output.contracts) {
      // code and ABI that are needed by web3
      fs.writeFile("abi/" + contractName + "ABI.js", "module.exports = " + output.contracts[contractName].interface, function(err) {
          if(err) {
              return console.log(err);
          }
          console.log(contractName + ' ABI created!');
      });
      fs.writeFile("bytecode/" + contractName + "Bytecode.js", "module.exports = '" + output.contracts[contractName].bytecode + "'", function(err) {
          if(err) {
              return console.log(err);
          }
          console.log(contractName + ' Bytecode created!');
      });
  }
  callback();
};

var ownedCode;
var databaseCode;
async.series([
  function(callback) {
    fs.readFile('owned.sol', 'utf8', function(err, data) {
      if(err) {
          return console.log(err);
      }
      ownedCode = data;
      callback();
    });
  },
  function(callback) {
    fs.readFile('Database.sol', 'utf8', function(err, data) {
      if(err) {
          return console.log(err);
      }
      databaseCode = data;
      callback();
    });
  },
  function(callback) {
    fs.readFile('Product.sol', 'utf8', function(err, data) {
      if(err) {
          return console.log(err);
      }
      compileContract({ sources: { 'owned.sol': ownedCode,
                        'Database.sol': databaseCode,
                        contractName: data }}, callback);
    });
  }],
  function(err) {
      if (err) return next(err);
  }
);
