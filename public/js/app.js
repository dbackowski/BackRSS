$(document).ready(function() {
  "use strict";

  var BackRss = new Marionette.Application();

  BackRss.AppLayoutView = Marionette.LayoutView.extend({
    template: "#layout-view-template",

    regions: {
      menu: "#menu",
      content: "#content"
    }
  });

  BackRss.mainLayout = new BackRss.AppLayoutView();

  BackRss.Site = Backbone.Model.extend({
    urlRoot: 'http://localhost:8080/sites',
    idAttribute: '_id',

    defaults: {
      title: '',
      url: '',
      count: 0
    }
  });

  BackRss.SitesCollection = Backbone.Collection.extend({
    model: BackRss.Site,
    url: 'http://localhost:8080/sites',

    parse: function(response) {
      return response.data;
    }
  });

  BackRss.Feed = Backbone.Model.extend({});

  BackRss.FeedsCollection = Backbone.Collection.extend({
    model: BackRss.Feed,

    url: function() {
      if (this.siteID) {
        return 'http://localhost:8080/feeds/' + this.siteID;
      } else {
        return 'http://localhost:8080/feeds';
      }
    },

    initialize: function(models, options) {
      this.siteID = options.siteID;
    },

    parse: function(response) {
      return response.data;
    }
  });

  BackRss.SiteItemView = Backbone.Marionette.ItemView.extend({
    tagName: "li",
    template: '#site-item-template',

    modelEvents: {
      'markSelected': 'addActiveClass',
      'markUnselected': 'removeActiveClass',
      'change': 'fieldsChanged'
    },

    fieldsChanged: function() {
      this.render();
    },

    addActiveClass: function() {
      this.$el.addClass('active');
    },

    removeActiveClass: function() {
      this.$el.removeClass('active');
    }
  });

  BackRss.SitesCollectionView = Backbone.Marionette.CollectionView.extend({
    tagName: "ul",
    className: "nav nav-sidebar",
    childView: BackRss.SiteItemView,

    initialize : function() {
      this.listenTo(this.collection, "reset", this.render);
    }
  });

  BackRss.FeedItemView = Backbone.Marionette.ItemView.extend({
    tagName: "tr",
    template: '#feed-item-template'
  });

  BackRss.NoFeedItemsView = Backbone.Marionette.ItemView.extend({
    template: '#no-feeds-template'
  });

  BackRss.FeedsCollectionView = Backbone.Marionette.CompositeView.extend({
    template: '#feeds-template',
    childView: BackRss.FeedItemView,
    childViewContainer: "table",
    emptyView: BackRss.NoFeedItemsView,

    events: {
      'click button#mark-read': "markAsRead",
      'click button#refresh': "refresh"
    },

    initialize: function(options) {
      this.listenTo(this.collection, "reset", this.render);
      this.siteID = options.siteID;
      this.sitesCollection = options.sitesCollection;
    },

    markAsRead: function() {
      var that = this;

      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          that.collection.forEach(function(model) {
            model.save({seen: true});
          });

          if (!that.siteID)
          {
            _(that.sitesCollection.models).each(function(site) {
              site.set('count', 0);
            });
          } else {
            var site = that.sitesCollection.findWhere({_id: that.siteID});
            var allSites = that.sitesCollection.findWhere({_id: null});
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
        siteID: this.collection.siteID,
        feedsCount: this.collection.length
      };
    }
  });

  BackRss.ManageSiteItemView = Backbone.Marionette.ItemView.extend({
    tagName: "tr",
    template: '#manage-sites-item-template'
  });

  BackRss.ManageSitesView = Backbone.Marionette.CompositeView.extend({
    template: '#manage-sites-template',

    childView: BackRss.ManageSiteItemView,
    childViewContainer: "table",

    events: {
      'click .btnDeleteSite': "deleteSite"
    },

    filter: function (child, index, collection) {
      return child.get('_id') != undefined;
    },

    deleteSite: function(e) {
      e.preventDefault();

      var siteID = $(e.currentTarget).data("id");
      var that = this;

      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          var site = that.collection.findWhere({ _id: siteID });

          site.destroy({ wait: true });
        }
      });
    }
  });

  BackRss.ManageSitesAddSiteView = Backbone.Marionette.ItemView.extend({
    template: "#add-site-template",

    events: {
      'click #btnAddSite': "addSite"
    },

    ui: {
      inputTitle: '#title',
      inputUrl: '#url'
    },

    onShow: function() {
      this.ui.inputTitle.focus();
    },

    addSite: function(e) {
      e.preventDefault();

      if (!this.ui.inputTitle.val() || !this.ui.inputUrl.val()) {
        return false;
      }

      var model = new BackRss.Site();
      var that = this;

      model.save({title: this.ui.inputTitle.val(), url: this.ui.inputUrl.val()}, {
        success: function(model, resp) {
          that.collection.add(resp.data);
          that.collection.trigger('reset');
          Backbone.history.navigate("manage-sites", { trigger: true });
        }, error: function() {
          BackRss.vent.trigger("error", "Error occured");
        }, silent: true, wait: true
      });
    }
  });

  BackRss.MainController = Marionette.Controller.extend({
    initialize: function() {
      this.sites = new BackRss.SitesCollection();
    },

    onError: function() {
      BackRss.vent.trigger("error", "Error occured");
    },

    unmarkSelectedSite: function() {
      _(this.sites.models).each(function(site) {
        site.trigger('markUnselected');
      });
    },

    getFeeds: function(siteID) {
      var feeds = new BackRss.FeedsCollection([], {siteID: siteID});
      var that = this;

      feeds.fetch().done(function() {
        var feedsListView = new BackRss.FeedsCollectionView({
          collection: feeds,
          siteID: siteID,
          sitesCollection: that.sites
        });

        BackRss.mainLayout.content.show(feedsListView);

        that.unmarkSelectedSite();
        that.sites.findWhere({_id: siteID}).trigger('markSelected');
      });
    },

    feeds: function(siteID) {
      var that = this;

      if (!BackRss.mainLayout.menu.hasView()) {
        this.sites.fetch({ success: function(collection) {
          var allCount = 0;

          for (var site in collection.models)
          {
            allCount += collection.models[site].get('count');
          }

          that.sites.add({ title: 'All', _id: null, count: allCount }, { at: 0 });

          var sitesListView = new BackRss.SitesCollectionView({
            collection: that.sites,
          });

          BackRss.mainLayout.menu.show(sitesListView);
          that.getFeeds(siteID);
        }, error: that.onError });
      } else {
        var sites = new BackRss.SitesCollection();

        sites.fetch({ success: function(collection) {
          var allCount = 0;

          for (var site in collection.models)
          {
            allCount += collection.models[site].get('count');
            that.sites.findWhere({_id: collection.models[site].get('_id')}).set('count', collection.models[site].get('count'));
          }

          that.sites.findWhere({_id: null}).set('count', allCount);
          that.getFeeds(siteID);
        }, error: that.onError });
      }
    },

    manageSites: function() {
      this.unmarkSelectedSite();

      var sitesView = new BackRss.ManageSitesView({
        collection: this.sites
      });

      BackRss.mainLayout.content.show(sitesView);
    },

    addSite: function() {
      var addSiteView = new BackRss.ManageSitesAddSiteView({
        collection: this.sites
      });

      BackRss.mainLayout.content.show(addSiteView);
    },

    notFound: function() {
      Backbone.history.navigate("feeds", { trigger: true });
    }
  });

  BackRss.Router = Marionette.AppRouter.extend({
    appRoutes: {
      'feeds': 'feeds',
      'feeds/:siteID': 'feeds',
      'manage-sites': 'manageSites',
      'add-site': 'addSite',
      '*notFound': 'notFound'
    }
  });

  BackRss.addInitializer(function(){
    var mainController = new BackRss.MainController();
    new BackRss.Router({
      controller: mainController
    });
  });

  BackRss.addRegions({
    menuRegion: "#menu",
    mainRegion: "#main"
  });

  BackRss.vent.on("error", function(message) {
    bootbox.alert(message, function() {
      Backbone.history.navigate("/", { trigger: true });
    });
  });

  BackRss.on('start', function(){
    $('body').append(BackRss.mainLayout.render().el);

    if (Backbone.history)
    {
      Backbone.history.start();
    }
  });

  BackRss.start();
});
