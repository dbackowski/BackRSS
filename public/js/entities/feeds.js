BackRss.module("Entities", function(Entities, BackRss, Backbone, Marionette, $, _) {
  "use strict";

  Entities.Feed = Backbone.Model.extend({
    url: '/api/feeds',
    idAttribute: '_id'
  });

  Entities.FeedsCollection = Backbone.Collection.extend({
    model: Entities.Feed,

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
});