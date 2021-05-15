//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
let { StockSubscriptionModel } = require('../server/dist/api/domain/StockSubscription');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server/dist/api/StartServer').default;
let should = chai.should();


chai.use(chaiHttp);
//Our parent block
describe('StockSubscriptions', () => {
  beforeEach((done) => { //Before each test we empty the database
    StockSubscriptionModel.deleteMany({}, (err) => {
      done();
    });
  });
  /*
    * Test the /GET route
    */
  describe('/GET subscription', () => {
    it('it should GET all the subscription', (done) => {
      chai.request(server)
        .get('/api/v0/subscription')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.data.should.be.a('array');
          res.body.data.length.should.be.eql(0);
          done();
        });
    });
  });
  /*
  * Test the /POST route
  */
  describe('/POST subscription', () => {
    it('it should not POST a subscription without ticker field', (done) => {
      let subscription = {
      }
      chai.request(server)
        .post('/api/v0/subscription')
        .send(subscription)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('errors');
          res.body.errors[0].should.have.property('description').include('required');
          done();
        });
    });
    it('it should POST a subscription ', (done) => {
      let subscription = {
        ticker: "MSFT"
      }
      chai.request(server)
        .post('/api/v0/subscription')
        .send(subscription)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          res.body.data.should.have.property('ticker').eql("MSFT");
          res.body.data.should.have.property('type').eql("StockSubscription");
          done();
        });
    });
  });
  /*
   * Test the /GET/:id route
   */
  describe('/GET/:id subscription', () => {
    it('it should GET a subscription by the given id', (done) => {
      let subscription = new StockSubscriptionModel({ ticker: "YAHOO", expires: Date.now() + (1000 * 60 * 20) });
      subscription.save((err, subscription) => {
        chai.request(server)
          .get('/api/v0/subscription/' + subscription._id)
          .send(subscription)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.data.should.have.property('ticker');
            res.body.data.should.have.property('id').eql(subscription._id.toHexString());
            done();
          });
      });
    });
  });
  /*
   * Test the /PUT/:id route
   */
  describe('/PUT/:id subscription', () => {
    it('it should UPDATE a subscription given the id', (done) => {
      let subscription = new StockSubscriptionModel({ ticker: "IBM", expires: Date.now() + (1000 * 60 * 20) });
      subscription.save((err, subscription) => {
        chai.request(server)
          .put('/api/v0/subscription/' + subscription._id)
          .send({ ticker: "GOOG" })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.data.should.have.property('ticker').eql('GOOG');
            done();
          });
      });
    });
  });
  /*
   * Test the /DELETE/:id route
   */
  describe('/DELETE/:id subscription', () => {
    it('it should DELETE a subscription given the id', (done) => {
      let subscription = new StockSubscriptionModel({ ticker: "FB", expires: Date.now() + (1000 * 60 * 20) });
      subscription.save((err, subscription) => {
        chai.request(server)
          .delete('/api/v0/subscription/' + subscription._id)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.data.should.have.property('ok').eql(1);
            res.body.data.should.have.property('n').eql(1);
            done();
          });
      });
    });
  });
});

