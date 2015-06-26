define([
  "marionette",
  "globals",
  "entitySites",
  "siteViews",
  "entityFeeds",
  "feedViews"
], function(Marionette, BackRss, entitySites, siteViews, entityFeeds, feedViews){
  "use strict";

  var MainController = Marionette.Controller.extend({
    initialize: function() {
      this.sites = new BackRss.Entities.SitesCollection();
    },

    onError: function() {
      BackRss.vent.trigger("error", "Error occured");
    },

    unmarkSelectedSite: function() {
      _(this.sites.models).each(function(site) {
        site.trigger('markUnselected');
      });
    },

    getSites: function(callback) {
      var that = this;

      if (!BackRss.mainLayout.menu.hasView()) {
        this.sites.fetch({ success: function(collection) {
          var allCount = 0;

          for (var site in collection.models)
          {
            allCount += collection.models[site].get('count');
          }

          that.sites.add({ title: 'All', _id: null, count: allCount }, { at: 0 });

          var sitesListView = new BackRss.Views.SitesCollectionView({
            collection: that.sites,
          });

          BackRss.mainLayout.menu.show(sitesListView);

          if (typeof callback === "function") {
            callback.call(that);
          }
        }, error: that.onError });
      } else {
        var sites = new BackRss.Entities.SitesCollection();

        sites.fetch({ success: function(collection) {
          var allCount = 0;

          for (var site in collection.models)
          {
            allCount += collection.models[site].get('count');
            that.sites.findWhere({ _id: collection.models[site].get('_id') }).set('count', collection.models[site].get('count'));
          }

          that.sites.findWhere({ _id: null }).set('count', allCount);

          if (typeof callback === "function") {
            callback.call(that);
          }
        }, error: that.onError });
      }
    },

    getFeeds: function(siteId) {
      var feeds = new BackRss.Entities.FeedsCollection([], { siteId: siteId });
      var that = this;

      feeds.fetch().done(function() {
        var feedsListView = new BackRss.Views.FeedsCollectionView({
          collection: feeds,
          siteId: siteId,
          sitesCollection: that.sites
        });

        BackRss.mainLayout.content.show(feedsListView);

        that.unmarkSelectedSite();
        that.sites.findWhere({ _id: siteId }).trigger('markSelected');
      });
    },

    feeds: function(siteId) {
      this.getSites(function() {
        this.getFeeds(siteId);
      });
    },

    manageSites: function() {
      this.getSites(function() {
        this.unmarkSelectedSite();

        var sitesView = new BackRss.Views.ManageSitesView({
          collection: this.sites
        });

        BackRss.mainLayout.content.show(sitesView);
      });
    },

    addSite: function() {
      this.getSites(function() {
        var addSiteView = new BackRss.Views.ManageSitesAddSiteView({
          collection: this.sites
        });

        BackRss.mainLayout.content.show(addSiteView);
      });
    },

    notFound: function() {
      Backbone.history.navigate("feeds", { trigger: true });
    }
  });

  return MainController;
});