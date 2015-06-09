BackRss.module("Views", function(Views, BackRss, Backbone, Marionette, $, _) {
  "use strict";

  Views.FeedItemView = Backbone.Marionette.ItemView.extend({
    tagName: "tr",
    template: '#feed-item-template',

    initialize: function(options) {
      this.sites = options.sites;
      this.siteId = options.siteId;
    },

    templateHelpers: function() {
      return { sites: this.sites, siteId: this.siteId };
    }
  });

  Views.NoFeedItemsView = Backbone.Marionette.ItemView.extend({
    template: '#no-feeds-template'
  });

  Views.FeedsCollectionView = Backbone.Marionette.CompositeView.extend({
    template: '#feeds-template',
    childView: Views.FeedItemView,
    childViewContainer: "table",

    childViewOptions: function() {
      return { sites: this.sitesCollection, siteId: this.siteId };
    },

    emptyView: Views.NoFeedItemsView,

    events: {
      'click button#mark-read': "markAllAsRead",
      'click button#refresh': "refresh",
      'mouseenter tr': 'showMarkAsRead',
      'mouseleave tr': 'hideMarkAsRead',
      'click a.mark-as-read': 'markAsRead'
    },

    initialize: function(options) {
      this.listenTo(this.collection, "reset", this.render);
      this.siteId = options.siteId;
      this.sitesCollection = options.sitesCollection;
    },

    showMarkAsRead: function(e) {
      $(e.currentTarget).find('.date').addClass('hide');
      $(e.currentTarget).find('.link').removeClass('hide');
    },

    hideMarkAsRead: function(e) {
      $(e.currentTarget).find('.date').removeClass('hide');
      $(e.currentTarget).find('.link').addClass('hide');
    },

    markAsRead: function(e) {
      e.preventDefault();
      var id = $(e.currentTarget).data("id");
      var feed = this.collection.findWhere({ _id: id });
      var that = this;

      feed.save({ seen: true }, { success: function() {
        that.collection.remove(feed);

        if (!that.siteId)
        {
          var allSites = that.sitesCollection.findWhere({ _id: null });
          var site = that.sitesCollection.findWhere({ _id: feed.get('site_id') });
          allSites.set('count', allSites.get('count') - 1);
          site.set('count', site.get('count') - 1);
        } else {
          var site = that.sitesCollection.findWhere({ _id: that.siteId });
          var allSites = that.sitesCollection.findWhere({ _id: null });
          allSites.set('count', allSites.get('count') - 1);
          site.set('count', site.get('count') - 1);
        }
      }, error: function() {
        BackRss.vent.trigger("error", "Error occured");
      }});
    },

    markAllAsRead: function() {
      var that = this;

      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          that.collection.forEach(function(model) {
            model.save({ seen: true });
          });

          if (!that.siteId)
          {
            _(that.sitesCollection.models).each(function(site) {
              site.set('count', 0);
            });
          } else {
            var site = that.sitesCollection.findWhere({ _id: that.siteId });
            var allSites = that.sitesCollection.findWhere({ _id: null });
            allSites.set('count', allSites.get('count') - site.get('count'));
            site.set('count', 0);
          }

          that.collection.reset();
        }
      });
    },

    refresh: function() {
      Backbone.history.loadUrl();
    },

    templateHelpers: function() {
      return {
        siteId: this.collection.siteId,
        feedsCount: this.collection.length
      };
    }
  });
});
