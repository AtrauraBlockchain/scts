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
