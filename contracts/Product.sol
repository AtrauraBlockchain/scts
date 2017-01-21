pragma solidity ^0.4.7;

import "./Database.sol";

/*
    Copyright 2016, Andreu Rodríguez i Donaire

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* @title Product Contract
   @author Andreu Rodíguez i Donaire
   @dev This contract represents a product to be tracked in the TODO put name of platform **
   platform. This product lets the handlers to register actions on it or even combine
   it with other products. */


 /* @dev Constructor for a Product */
contract Product {
  // @dev Reference to its database contract.
  address public DATABASE_CONTRACT;
  // @dev Reference to its product factory
  address public PRODUCT_FACTORY;

  // @dev This struct represents an action realized by a handler on the product.
  struct Action {
    //@dev address of the individual or the organization who realizes the action.
    address handler;
    //@dev description of the action.
    bytes32 description;

    // @dev Longitude x10^10 where the Action is done
    uint lon;
    // @dev Latitude x10^10 where the Action is done
    uint lat;

    // @dev Instant of time when the Action is done
    uint timestamp;
    // @dev Block when the Action is done
    uint blockNumber;
  }

  // @dev if the Product is consumed the transaction can't be done
  modifier notConsumed {
    if (isConsumed)
      throw;
    _;
  }

  // @dev addresses of the products which were used to build this Product
  address[] public parentProducts;

  // @dev indicates if a product has been consumed or not
  bool public isConsumed;

  // @dev indicates the name of a product
  bytes32 public name;

  // @dev indicates the name of a product
  bytes32 public additionalInformation;

  Action[] public actions;

  function Product(bytes32 _name, bytes32 _additionalInformation, address[] _parentProducts, uint _lon, uint _lat, address db, address productFactory) {
    name = _name;
    isConsumed = false;
    parentProducts = _parentProducts;
    additionalInformation = _additionalInformation;

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

  function addAction(bytes32 description, uint lon, uint lat, bytes32[] newProductsNames, bytes32[] newProductsAdditionalInformation, bool _consumed) notConsumed {
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
      productFactory.createProduct(newProductsNames[i], newProductsAdditionalInformation[i], parentProducts, lon, lat, DATABASE_CONTRACT);
    }

    isConsumed = _consumed;
  }

  function merge(address[] otherProducts, bytes32 newProductName, bytes32 newProductAdditionalInformation, uint lon, uint lat) notConsumed {
    ProductFactory productFactory = ProductFactory(PRODUCT_FACTORY);
    productFactory.createProduct(newProductName, newProductAdditionalInformation, otherProducts, lon, lat, DATABASE_CONTRACT);

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

    function createProduct(bytes32 _name, bytes32 _additionalInformation, address[] _parentProducts, uint _lon, uint _lat, address db) returns(address) {
      new Product(_name, _additionalInformation, _parentProducts, _lon, _lat, db, this);
    }
}
