pragma solidity ^0.4.7;

import "./owned.sol";

contract Database is owned {
  address[] public products;
  struct Handler {
    string _name;
    // JSON Object with additional information
    string _additionalInfo;
  }

  mapping(address => Handler) public addressToHandler;

  function Database() {}

  function () {
    // If anyone wants to send Ether to this contract, the transaction gets rejected
    throw;
  }

  function addHandler(address _address, string _name, string _additionalInfo) onlyOwner {
    Handler memory handler;
    handler._name = _name;
    handler._additionalInfo = _additionalInfo;

    addressToHandler[_address] = handler;
  }

  function storeProductReference(address productAddress) {
    products.push(productAddress);
  }

}
