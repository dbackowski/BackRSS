var should = require('chai').should();
var expect = require('chai').expect;
var supertest = require('supertest');
var api = supertest('http://localhost:8080');
var backRssApi = require('../api');

describe('Feed', function() {
  var siteId = null;

  before(function(done) {
    backRssApi.start();

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

  });

  after(function() {
    backRssApi.stop();
  });

  it('should return feeds for selected site', function(done) {
    api.get('/api/feeds/' + siteId)
      .set('Accept', 'application/json')
      .expect(200, done);
  });

  it('should mark feeds as readed for selected site', function(done) {
    api.put('/api/feeds/' + siteId)
      .set('Accept', 'application/json')
      .expect(200, done);
  });
});