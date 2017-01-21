pragma solidity ^0.4.7;

import "./Database.sol";

contract Product {
  address public DATABASE_CONTRACT;
  address public PRODUCT_FACTORY;

  struct Action {
    address handler;
    bytes32 description;

    // Longitude x10^10 & Latitude x10^10 where the Action is done
    uint lon;
    uint lat;

    uint timestamp;
    uint blockNumber;
  }

  modifier notConsumed {
    if (isConsumed)
      throw;
    _;
  }

  address[] public parentProducts;
  address[] public childProducts;

  bool public isConsumed;

  bytes32 public name;

  Action[] public actions;

  function Product(bytes32 _name, address[] _parentProducts, uint _lon, uint _lat, address db, address productFactory) {
    name = _name;
    isConsumed = false;
    parentProducts = _parentProducts;

    DATABASE_CONTRACT = db;
    PRODUCT_FACTORY = productFactory;

    Action memory creation;
    creation.handler = msg.sender;
    creation.description = "Product creation";
    creation.lon = _lon;
    creation.lat = _lat;
    creation.timestamp = now;
    creation.blockNumber = block.number;

    actions.push(creation);

    Database database = Database(db);
    database.storeProductReference(this);
  }

  function () {
    // If anyone wants to send Ether to this contract, the transaction gets rejected
    throw;
  }

  function addAction(bytes32 description, uint lon, uint lat, bytes32[] newProductsNames, bool _consumed) notConsumed {
    Action memory action;
    action.handler = msg.sender;
    action.description = description;
    action.lon = lon;
    action.lat = lat;
    action.timestamp = now;
    action.blockNumber = block.number;

    actions.push(action);

    ProductFactory productFactory = ProductFactory(PRODUCT_FACTORY);

    for (uint i = 0; i < newProductsNames.length; ++i) {
      address[] memory parentProducts = new address[](1);
      parentProducts[0] = this;
      productFactory.createProduct(newProductsNames[i], parentProducts, lon, lat, DATABASE_CONTRACT);
    }

    isConsumed = _consumed;
  }

  function merge(address[] otherProducts, bytes32 newProductName, uint lon, uint lat) notConsumed {
    ProductFactory productFactory = ProductFactory(PRODUCT_FACTORY);
    productFactory.createProduct(newProductName, otherProducts, lon, lat, DATABASE_CONTRACT);

    for (uint i = 0; i < otherProducts.length; ++i) {
      Product prod = Product(otherProducts[i]);
      prod.consume();
    }

    isConsumed = true;
  }

  function consume() notConsumed {
    isConsumed = true;
  }
}

contract ProductFactory {

    function ProductFactory() {}

    function () {
      // If anyone wants to send Ether to this contract, the transaction gets rejected
      throw;
    }

    function createProduct(bytes32 _name, address[] _parentProducts, uint _lon, uint _lat, address db) returns(address) {
      new Product(_name, _parentProducts, _lon, _lat, db, this);
    }
}
