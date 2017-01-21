var async = require('async');
var chaiAsPromised = require('chai-as-promised');
var chai = require('chai');
var mochaLogger = require('mocha-logger');
var mlog = mochaLogger.mlog;
var expect = chai.expect; // we are using the "expect" style of Chai
chai.use(chaiAsPromised);
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

var accounts = web3.eth.accounts;

var database;
var productFactory;

var productABI = require('../abi/productABI.js')
var productContract = web3.eth.contract(productABI);
var additionalInformation = "Additional Information";

async.series([
  function(callback) {
    describe('Deploy Database Contract.', function() {
      it('Contract address should not be undefined', function(done) {
        var databaseABI = require('../abi/DatabaseABI.js')
        var databaseBytecode = require('../bytecode/DatabaseBytecode.js');
        var databaseContract = web3.eth.contract(databaseABI);
        database = databaseContract.new(
         {
           from: accounts[0],
           data: databaseBytecode,
           gas: '4700000'
         },
         function (e, contract){
            if (typeof contract.address !== 'undefined') {
              done();
              callback();
            }
         });
      });
    });
  },
  function(callback) {
    describe('Deploy productFactory Contract.', function() {
      it('Contract address should not be undefined', function(done) {
        var productFactoryABI = require('../abi/productFactoryABI.js')
        var productFactoryBytecode = require('../bytecode/productFactoryBytecode.js');
        var productFactoryContract = web3.eth.contract(productFactoryABI);
        productFactory = productFactoryContract.new(
         {
           from: accounts[0],
           data: productFactoryBytecode,
           gas: '4700000'
         },
         function (e, contract){
            if (typeof contract.address !== 'undefined') {
              done();
              callback();
            }
         });
      });
    });
  },
  function(callback) {
    describe('Add Handler to Database.', function() {
      it('Transaction Hash should not be undefined', function(done) {
        database.addHandler(
          accounts[0],
          "Demo Handler",
          "This is an unreal Handler for demo purposes",
         {
           from: accounts[0],
           gas: '4700000'
         },
         function (e, txHash){
            done();
            callback();
         });
      });
      it('Handler must appear in the database.', function(done) {
        expect(database.addressToHandler(accounts[0])[0]).to.equal('Demo Handler');
        done();
      });
    });
  },
  function(callback) {
    describe('Create a product successfully.', function() {
      var product;
      var productName = "Test Product 1";
      let parentProducts = [];
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract address should not be undefined', function(done) {
        productFactory.createProduct(
          productName,
          additionalInformation,
          parentProducts,
          lon,
          lat,
          database.address,
         {
           from: accounts[0],
           gas: '4700000'
         },
         function (e, txHash){
            if (typeof txHash !== 'undefined') {
              done();
              callback();
            }
         });
      });
      it('Contract must appear in the database.', function(done) {
        product = productContract.at(database.products(0));
        expect(product.DATABASE_CONTRACT()).to.equal(database.address);
        done();
      });
      it('Product\'s first action should be "Product creation".', function(done) {
        let firstAction = product.actions(0);
        expect(web3.toAscii(firstAction[1]).replace(/[^\w\s]/gi, '')).to.equal("Product creation");
        done();
      });
      it('We should be able to get the product name.', function(done) {
        expect(web3.toAscii(product.name()).replace(/[^\w\s]/gi, '')).to.equal(productName);
        done();
      });
      it('Product\'s should not be consumed.', function(done) {
        expect(product.isConsumed()).to.equal(false);
        done();
      });
    });
    describe('Create an other product successfully.', function() {
      productName = "Test Product 2";
      let parentProducts = [];
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract address should not be undefined', function(done) {
        productFactory.createProduct(
          productName,
          additionalInformation,
          parentProducts,
          lon,
          lat,
          database.address,
         {
           from: accounts[0],
           gas: '4700000'
         },
         function (e, txHash){
            if (typeof txHash !== 'undefined') {
              done();
              callback();
            }
         });
      });
      it('Contract must appear in the database.', function(done) {
        product = productContract.at(database.products(1));
        expect(product.DATABASE_CONTRACT()).to.equal(database.address);
        done();
      });
      it('Product\'s first action should be "Product creation".', function(done) {
        let firstAction = product.actions(0);
        expect(web3.toAscii(firstAction[1]).replace(/[^\w\s]/gi, '')).to.equal("Product creation");
        done();
      });
      it('We should be able to get the product name.', function(done) {
        expect(web3.toAscii(product.name()).replace(/[^\w\s]/gi, '')).to.equal(productName);
        done();
      });
    });
    mlog.log("Product adding tested.");
    callback();
  },
  function(callback) {
    describe('Add a new action to Test Product 1.', function() {
      product = productContract.at(database.products(0));
      let description = "Second action";
      let newProductsNames = [];
      let newProductsAdditionalInformation = [];
      let consumed = false;
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract second action transaction should not be undefined', function(done) {
        product.addAction(
          description,
          lon,
          lat,
          newProductsNames,
          newProductsAdditionalInformation,
          consumed,
         {
           from: accounts[0],
           gas: '4700000'
         },
         function (e, txHash){
            if (typeof txHash !== 'undefined') {
              done();
              callback();
            }
         });
      });
      it('Product\'s second action should be "Second Action".', function(done) {
        let secondAction = product.actions(1);
        expect(web3.toAscii(secondAction[1]).replace(/[^\w\s]/gi, '')).to.equal("Second action");
        done();
      });
    });
    describe('Add consuming action to Test Product 1.', function() {
      product = productContract.at(database.products(0));
      let description = "Consuming action";
      let newProductsNames = ["SubProduct 1", "SubProduct 2"];
      let newProductsAdditionalInformation = [additionalInformation, additionalInformation];
      let consumed = true;
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract consuming action transaction should not be undefined', function(done) {
        product.addAction(
          description,
          lon,
          lat,
          newProductsNames,
          newProductsAdditionalInformation,
          consumed,
         {
           from: accounts[0],
           gas: '4700000'
         },
         function (e, txHash){
            if (typeof txHash !== 'undefined') {
              done();
              callback();
            }
         });
      });
      it('Product\'s second action should be "Consuming Action".', function(done) {
        let consumingAction = product.actions(2);
        expect(web3.toAscii(consumingAction[1]).replace(/[^\w\s]/gi, '')).to.equal("Consuming action");
        done();
      });
      it('Product\'s should be consumed.', function(done) {
        expect(product.isConsumed()).to.equal(true);
        done();
      });
      it('Products "Subproduct 1" and "Subproduct 2" should be created.', function(done) {
        let subProduct1 = productContract.at(database.products(2));
        let subProduct2 = productContract.at(database.products(3));
        expect(subProduct1).to.not.equal("undefined");
        expect(web3.toAscii(subProduct1.name()).replace(/[^\w\s]/gi, '')).to.equal("SubProduct 1");
        expect(subProduct2).to.not.equal("undefined");
        expect(web3.toAscii(subProduct2.name()).replace(/[^\w\s]/gi, '')).to.equal("SubProduct 2");
        done();
      });
    });
    mlog.log("Consumer action tested.");
    callback();
  },
  function(callback) {
    describe('Merge SubProduct 1 and SubProduct 1 into SuperProduct.', function() {
      let subProduct1 = productContract.at(database.products(2));
      let subProduct2 = productContract.at(database.products(3));
      let otherProducts = [subProduct2.address];
      let newProductName = "SuperProduct";
      let newProductAdditionalInformation = additionalInformation;
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract second action should not be undefined', function(done) {
        subProduct1.merge(
          otherProducts,
          newProductName,
          newProductAdditionalInformation,
          lon,
          lat,
         {
           from: accounts[0],
           gas: '4700000'
         },
         function (e, txHash){
            if (typeof txHash !== 'undefined') {
              done();
              callback();
            }
         });
      });
      it('SubProduct 1 should be consumed.', function(done) {
        expect(subProduct1.isConsumed()).to.equal(true);
        done();
      });
      it('SubProduct 2 should be consumed.', function(done) {
        expect(subProduct2.isConsumed()).to.equal(true);
        done();
      });
      it('SuperProduct should be created.', function(done) {
        let superProduct = productContract.at(database.products(4));
        expect(superProduct).to.not.equal("undefined");
        expect(web3.toAscii(superProduct.name()).replace(/[^\w\s]/gi, '')).to.equal("SuperProduct");
        done();
      });
      it('SuperProduct should be a son of SubProduct 1 and subProduct 2.', function(done) {
        expect(subProduct1.childProducts(0).toString()).to.equal(database.products(4));
        expect(subProduct2.childProducts(0).toString()).to.equal(database.products(4));
        done();
      });
    });
    callback();
  }
]);
