pragma solidity ^0.4.7;

import "./Database.sol";

/*
    Copyright 2017, David Riudor

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
   @author David Riudor
   @dev This contract represents a product to be tracked in the TODO put name of platform **
   platform. This product lets the handlers to register actions on it or even combine
   it with other products. */

 /* @dev Constructor for a Product */
contract Product {
  // @dev Reference to its database contract.
  address public DATABASE_CONTRACT;
  // @dev Reference to its product factory.
  address public PRODUCT_FACTORY;

  // @dev This struct represents an action realized by a handler on the product.
  struct Action {
    //@dev address of the individual or the organization who realizes the action.
    address handler;
    //@dev description of the action.
    bytes32 description;

    // @dev Longitude x10^10 where the Action is done.
    int lon;
    // @dev Latitude x10^10 where the Action is done.
    int lat;

    // @dev Instant of time when the Action is done.
    uint timestamp;
    // @dev Block when the Action is done.
    uint blockNumber;
  }

  // @dev if the Product is consumed the transaction can't be done.
  modifier notConsumed {
    if (isConsumed)
      throw;
    _;
  }

  // @dev addresses of the products which were used to build this Product.
  address[] public parentProducts;
  // @dev addresses of the products which are built by this Product.
  address[] public childProducts;

  // @dev indicates if a product has been consumed or not.
  bool public isConsumed;

  // @dev indicates the name of a product.
  bytes32 public name;

  // @dev Additional information about the Product, generally as a JSON object
  bytes32 public additionalInformation;

  // @dev all the actions which have been applied to the Product.
  Action[] public actions;

    /////////////////
   // Constructor //
  /////////////////

  /* @notice Constructor to create a Product
     @param _name The name of the Product
     @param _additionalInformation Additional information about the Product,
            generally as a JSON object.
     @param _parentProducts Addresses of the parent products of the Product.
     @param _lon Longitude x10^10 where the Product is created.
     @param _lat Latitude x10^10 where the Product is created.
     @param _DATABASE_CONTRACT Reference to its database contract
     @param _PRODUCT_FACTORY Reference to its product factory */
  function Product(bytes32 _name, bytes32 _additionalInformation, address[] _parentProducts, int _lon, int _lat, address _DATABASE_CONTRACT, address _PRODUCT_FACTORY) {
    name = _name;
    isConsumed = false;
    parentProducts = _parentProducts;
    additionalInformation = _additionalInformation;

    DATABASE_CONTRACT = _DATABASE_CONTRACT;
    PRODUCT_FACTORY = _PRODUCT_FACTORY;

    Action memory creation;
    creation.handler = msg.sender;
    creation.description = "Product creation";
    creation.lon = _lon;
    creation.lat = _lat;
    creation.timestamp = now;
    creation.blockNumber = block.number;

    actions.push(creation);

    Database database = Database(DATABASE_CONTRACT);
    database.storeProductReference(this);
  }

  function () {
    // If anyone wants to send Ether to this contract, the transaction gets rejected
    throw;
  }

  /* @notice Function to add an Action to the product.
     @param _description The description of the Action.
     @param _lon Longitude x10^10 where the Action is done.
     @param _lat Latitude x10^10 where the Action is done.
     @param _newProductNames In case that this Action creates more products from
            this Product, the names of the new products should be provided here.
     @param _newProductsAdditionalInformation In case that this Action creates more products from
            this Product, the additional information of the new products should be provided here.
     @param _consumed True if the product becomes consumed after the action. */
  function addAction(bytes32 description, int lon, int lat, bytes32[] newProductsNames, bytes32[] newProductsAdditionalInformation, bool _consumed) notConsumed {
    if (newProductsNames.length != newProductsAdditionalInformation.length) throw;

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

  /* @notice Function to merge some products to build a new one.
     @param otherProducts addresses of the other products to be merged.
     @param newProductsName Name of the new product resulting of the merge.
     @param newProductAdditionalInformation Additional information of the new product resulting of the merge.
     @param _lon Longitude x10^10 where the merge is done.
     @param _lat Latitude x10^10 where the merge is done. */
  function merge(address[] otherProducts, bytes32 newProductName, bytes32 newProductAdditionalInformation, int lon, int lat) notConsumed {
    ProductFactory productFactory = ProductFactory(PRODUCT_FACTORY);
    address newProduct = productFactory.createProduct(newProductName, newProductAdditionalInformation, otherProducts, lon, lat, DATABASE_CONTRACT);

    this.collaborateInMerge(newProduct, lon, lat);
    for (uint i = 0; i < otherProducts.length; ++i) {
      Product prod = Product(otherProducts[i]);
      prod.collaborateInMerge(newProduct, lon, lat);
    }
  }

  /* @notice Function to collaborate in a merge with some products to build a new one.
     @param newProductsAddress Address of the new product resulting of the merge. */
  function collaborateInMerge(address newProductAddress, int lon, int lat) notConsumed {
    childProducts.push(newProductAddress);

    Action memory action;
    action.handler = this;
    action.description = "Collaborate in merge";
    action.lon = lon;
    action.lat = lat;
    action.timestamp = now;
    action.blockNumber = block.number;

    actions.push(action);

    this.consume();
  }

  /* @notice Function to consume the Product */
  function consume() notConsumed {
    isConsumed = true;
  }
}

/* @title Product Factory Contract
   @author Andreu Rodíguez i Donaire
   @dev This contract represents a product factory which represents products to be tracked in
   the TODO put name of platform ** platform. This product lets the handlers to register actions
   on it or even combine it with other products. */
contract ProductFactory {

      /////////////////
     // Constructor //
    /////////////////

    /* @notice Constructor to create a Product Factory */
    function ProductFactory() {}

    function () {
      // If anyone wants to send Ether to this contract, the transaction gets rejected
      throw;
    }

    /* @notice Function to create a Product
       @param _name The name of the Product
       @param _additionalInformation Additional information about the Product,
              generally as a JSON object.
       @param _parentProducts Addresses of the parent products of the Product.
       @param _lon Longitude x10^10 where the Product is created.
       @param _lat Latitude x10^10 where the Product is created.
       @param _DATABASE_CONTRACT Reference to its database contract */
    function createProduct(bytes32 _name, bytes32 _additionalInformation, address[] _parentProducts, int _lon, int _lat, address DATABASE_CONTRACT) returns(address) {
      return new Product(_name, _additionalInformation, _parentProducts, _lon, _lat, DATABASE_CONTRACT, this);
    }
}
