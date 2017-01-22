var database;
var productContract;

var loadContracts = function() {
  let databaseContract = web3.eth.contract(DatabaseABI);
  database = databaseContract.at('0xec9CAab87327Cf406Ba251cb4BcEbAFfcD794357');
  productContract = web3.eth.contract(ProductABI);
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
      callback('', res);
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
      getActions(product, ++index, actions, function(res) {
        callback(res);
      });
    }
  })
};

var getParentProducts = function(product, index, parents, callback) {
  product.parentProducts(index, function(res) {
    if (res == '0x') callback(parents);
    else {
      actions.push(res[0]);
      getParentProducts(product, ++index, parents, function(res) {
        callback(res);
      });
    }
  })
};

var getProduct = function(address, callback) {
  let product;
  let name;
  let actions = [];
  let parentProducts = [];
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
    },
    function(cb) {
      getParentProducts(product, 0, [], function(err, res) {
        parentProducts = res;
        cb();
      });
    },
    function(cb) {
      product.name(function(err, res) {
        name = res;
        cb();
      });
    }
  ]);
  callback('', {'name': name, 'actions': actions, 'parentProducts': parentProducts});
}
