define([
  "marionette",
  "globals"
], function(Marionette, BackRss){
  "use strict";

  BackRss.Entities.Feed = Backbone.Model.extend({
    url: '/api/feeds',
    idAttribute: '_id'
  });

  BackRss.Entities.FeedsCollection = Backbone.Collection.extend({
    model: BackRss.Entities.Feed,

    url: function() {
      if (this.siteId) {
        return '/api/feeds/' + this.siteId;
      } else {
        return '/api/feeds';
      }
    },

    initialize: function(models, options) {
      this.siteId = options.siteId;
    },

    parse: function(response) {
      return response.data;
    }
  });

  return BackRss;
});