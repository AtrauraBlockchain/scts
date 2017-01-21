var async = require('async');
var chaiAsPromised = require('chai-as-promised');
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
chai.use(chaiAsPromised);
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

var accounts = web3.eth.accounts;

var database;
var productFactory;
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
    describe('Create a product successfully.', function() {
      var product;
      var productName = "Test Product 1";
      let parentProducts = [];
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract address should not be undefined', function(done) {
        productFactory.createProduct(
          productName,
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
        var productABI = require('../abi/productABI.js')
        product = web3.eth.contract(productABI).at(database.products(0));
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
    describe('Create an other product successfully.', function() {
      productName = "Test Product 2";
      let parentProducts = [];
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract address should not be undefined', function(done) {
        productFactory.createProduct(
          productName,
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
        var productABI = require('../abi/productABI.js')
        product = web3.eth.contract(productABI).at(database.products(1));
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
    describe('Add a new action to Test Product 1.', function() {
      product = web3.eth.contract(productABI).at(database.products(0));
      let description = "Second action";
      let newProductsNames = [];
      let consumed = false;
      let lon = 39.952583 * 10^10;
      let lat = -75.165222 * 10^10;
      it('Contract second action should not be undefined', function(done) {
        product.addAction(
          description,
          lon,
          lat,
          newProductsNames,
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
      it('Product\'s first action should be "Second Action".', function(done) {
        let firstAction = product.actions(1);
        expect(web3.toAscii(firstAction[1]).replace(/[^\w\s]/gi, '')).to.equal("Second action");
        done();
      });
    });
  }
]);
