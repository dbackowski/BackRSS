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
    urlRoot: '/api/sites',
    idAttribute: '_id',

    defaults: {
      title: '',
      url: '',
      count: 0
    }
  });

  BackRss.SitesCollection = Backbone.Collection.extend({
    model: BackRss.Site,
    url: '/api/sites',

    comparator: function(model1, model2) {
      if (model1.get('title') > model2.get('title') && model1.get('_id') != null) {
        return 1;
      } else {
        return -1;
      }
    },

    parse: function(response) {
      return response.data;
    }
  });

  BackRss.Feed = Backbone.Model.extend({
    url: '/api/feeds',
    idAttribute: '_id'
  });

  BackRss.FeedsCollection = Backbone.Collection.extend({
    model: BackRss.Feed,

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
      return child.get('_id') !== null;
    },

    deleteSite: function(e) {
      e.preventDefault();

      var siteId = $(e.currentTarget).data("id");
      var that = this;

      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          var site = that.collection.findWhere({ _id: siteId });
          var allSites = that.collection.findWhere({ _id: null });
          allSites.set('count', allSites.get('count') - site.get('count'));

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
          Backbone.history.navigate("sites", { trigger: true });
        }, error: function() {
          BackRss.vent.trigger("error", "Error occured");
        }, wait: true
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

          var sitesListView = new BackRss.SitesCollectionView({
            collection: that.sites,
          });

          BackRss.mainLayout.menu.show(sitesListView);

          if (typeof callback === "function") {
            callback.call(that);
          }
        }, error: that.onError });
      } else {
        var sites = new BackRss.SitesCollection();

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
      var feeds = new BackRss.FeedsCollection([], { siteId: siteId });
      var that = this;

      feeds.fetch().done(function() {
        var feedsListView = new BackRss.FeedsCollectionView({
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

        var sitesView = new BackRss.ManageSitesView({
          collection: this.sites
        });

        BackRss.mainLayout.content.show(sitesView);
      });
    },

    addSite: function() {
      this.getSites(function() {
        var addSiteView = new BackRss.ManageSitesAddSiteView({
          collection: this.sites
        });

        BackRss.mainLayout.content.show(addSiteView);
      });
    },

    notFound: function() {
      Backbone.history.navigate("feeds", { trigger: true });
    }
  });

  BackRss.Router = Marionette.AppRouter.extend({
    appRoutes: {
      'feeds': 'feeds',
      'feeds/:siteId': 'feeds',
      'sites': 'manageSites',
      'sites/add': 'addSite',
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
      Backbone.history.start({ pushState: true });
    }
  });

  $(document).on('click', "a[href^='/']", function(e) {
    e.preventDefault();
    var href = $(e.currentTarget).attr('href');
    Backbone.history.navigate(href, { trigger: true });
  });

  BackRss.start();
});
