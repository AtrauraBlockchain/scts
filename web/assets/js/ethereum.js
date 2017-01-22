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

var isProduct = function(address, callback) {
  let product = productContract.at(address);
  product.name(function(err, res) {
      if (res == '0x') callback(false);
      else callback(true);
  });
}

var getProduct = function(address, callback) {
  async.series([
    function(callback) {
      isProduct(address, function(isProd) {
        if (!isProd) callback('The address provided is not from a Product');
      });
    }
  ]);
}
