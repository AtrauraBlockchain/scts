var loadContracts = function() {
  let databaseContract = web3.eth.contract(DatabaseABI);
  var database = databaseContract.at('0xec9CAab87327Cf406Ba251cb4BcEbAFfcD794357');
  var productContract = web3.eth.contract(ProductABI);
}

var isHandler = function(address, callback) {
  database.addressToHandler(address, function(err, res) {
    if (res == ["", ""]) callback(false);
    else callback(true);
  });
}

var getHandler = function(address, callback) {
  isHandler(address, function(isHand) {
    if (!isHand) callback('The address provided is not from a Product');
    database.addressToHandler(address, function(err, res) {
      callback(null, res);
    });
  })
}

var isProduct = function(address, callback) {
  let product = productContract.at(address);
  product.name(function(err, res) {
      if (res == '0x') callback(false);
      else callback(true);
  });
}

var getActions = function(product, index, actions, callback) {
  product.actions(index, function(res) {
    if (res[0] == '0x') callback(actions);
    else {
      actions.push({'handler': res[0], 'description': web3.toAscii(res[1])});
      addAction(product, ++index, actions, function(res) {
        callback(res);
      });
    }
  })
};

var getActions = function(product, index, actions, callback) {
  product.actions(index, function(res) {
    if (res[0] == '0x') callback(actions);
    else {
      actions.push({'handler': res[0], 'description': web3.toAscii(res[1])});
      addAction(product, ++index, actions, function(res) {
        callback(res);
      });
    }
  })
};

var getProduct = function(address, callback) {
  let product;
  let actions = [];
  let parents = [];
  async.series([
    function(cb) {
      isProduct(address, function(isProd) {
        if (!isProd) callback('The address provided is not from a Product');
        else {
          product = productContract.at(address);
          cb();
        }
      });
    },
    function(cb) {
      getActions(product, 0, [], function(err, res) {
        actions = res;
        cb();
      });
    }
  ]);
  callback(null, actions);
}
