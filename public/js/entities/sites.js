BackRss.module("Entities", function(Entities, BackRss, Backbone, Marionette, $, _) {
  "use strict";

  Entities.Site = Backbone.Model.extend({
    urlRoot: '/api/sites',
    idAttribute: '_id',

    defaults: {
      title: '',
      url: '',
      count: 0
    }
  });

  Entities.SitesCollection = Backbone.Collection.extend({
    model: Entities.Site,
    url: '/api/sites',

    comparator: function(model1, model2) {
      if (model1.get('title') > model2.get('title') && model1.get('_id') !== null) {
        return 1;
      } else {
        return -1;
      }
    },

    parse: function(response) {
      return response.data;
    }
  });
});
