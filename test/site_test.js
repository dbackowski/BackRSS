var should = require('chai').should();
var expect = require('chai').expect;
var supertest = require('supertest');
var api = supertest('http://localhost:8080');
var backRssApi = require('../api');

describe('Site', function() {
  var siteId = null;

  before(function() {
    backRssApi.start();
  });

  after(function() {
    backRssApi.stop();
  });

  createSite = function(done) {
    api.post('/api/sites')
      .set('Accept', 'application/x-www-form-urlencoded')
      .send({
        title: 'test',
        url: 'localhost',
        count: 0
      })
      .expect(200)
      .end(function(err, res) {
        expect(res.body.data.title).to.equal('test');
        expect(res.body.data.url).to.equal('localhost');
        expect(res.body.data.count).to.equal(0);
        siteId = res.body.data._id;
        done();
      });
  }

  it('should return list of sites', function(done) {
    api.get('/api/sites')
      .set('Accept', 'application/json')
      .expect(200, done);
  });

  it('should create new site', function(done) {
    createSite(done);
  });

  it('should delete site', function(done) {
    createSite(done);

    api.delete('/api/sites/' + siteId)
      .expect(200, done);
  });
});