"use strict";

$(document).ready(function() {
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

  BackRss.sites = new BackRss.SitesCollection();

  BackRss.Feed = Backbone.Model.extend({});

  BackRss.FeedsCollection = Backbone.Collection.extend({
    model: BackRss.Feed,

    url: function() {
      if (this.category_id) {
        return 'http://localhost:8080/feeds/' + this.category_id;
      } else {
        return 'http://localhost:8080/feeds';
      }
    },

    initialize: function(models, options) {
      this.category_id = options.category_id;
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
      'click button#mark-read': "markAsRead"
    },

    initialize: function(options) {
      this.listenTo(this.collection, "reset", this.render);
      this.category_id = options.category_id;
    },

    markAsRead: function() {
      var that = this;

      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          that.collection.forEach(function(model, index) {
            model.save({seen: true});
          });

          if (!that.category_id)
          {
            _(BackRss.sites.models).each(function(site) {
              site.set('count', 0);
            });
          } else {
            var site = BackRss.sites.findWhere({_id: that.category_id});
            var all_site = BackRss.sites.findWhere({_id: null});
            all_site.set('count', all_site.get('count') - site.get('count'));
            site.set('count', 0);
          }

          that.collection.reset();
        }
      });
    },

    templateHelpers: function() {
      return {
        category_id: this.collection.category_id
      };
    }
  });

  BackRss.AddSiteView = Backbone.Marionette.ItemView.extend({
    template: "#add-site-template",

    events: {
      'click #btnAddSite': "addSite"
    },

    ui: {
      inputTitle: '#title',
      inputUrl: '#url'
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
        }, silent: true, wait: true
      });

      Backbone.history.navigate("feeds", { trigger: true });
    }
  });

  BackRss.MainController = Marionette.Controller.extend({
    getFeeds: function(category_id) {
      var feeds = new BackRss.FeedsCollection([], {category_id: category_id});

      feeds.fetch().done(function(collection) {
        var feedsListView = new BackRss.FeedsCollectionView({
          collection: feeds,
          category_id: category_id
        });

        BackRss.mainLayout.content.show(feedsListView);

        _(BackRss.sites.models).each(function(site) {
          site.trigger('markUnselected');
        });

        BackRss.sites.findWhere({_id: category_id}).trigger('markSelected');
      });
    },

    feeds: function(category_id) {
      var that = this;

      if (!BackRss.mainLayout.menu.hasView()) {
        BackRss.sites.fetch().done(function(collection) {
          var all_count = 0;

          for (var site in collection.data)
          {
            all_count += collection.data[site].count;
          }

          BackRss.sites.add({title: 'All', _id: null, count: all_count}, {at: 0});

          var sitesListView = new BackRss.SitesCollectionView({
            collection: BackRss.sites,
          });

          BackRss.mainLayout.menu.show(sitesListView);
          that.getFeeds(category_id);
        });
      } else {
        var sites = new BackRss.SitesCollection();

        sites.fetch().done(function(collection) {
          var all_count = 0;

          for (var site in collection.data)
          {
            all_count += collection.data[site].count;
            BackRss.sites.findWhere({_id: collection.data[site]._id}).set('count', collection.data[site].count);
          }

          BackRss.sites.findWhere({_id: null}).set('count', all_count);
          that.getFeeds(category_id);
        });
      }
    },

    addSite: function() {
      var addSiteView = new BackRss.AddSiteView({
        collection: BackRss.sites
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
      'feeds/:category_id': 'feeds',
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

  BackRss.on('start', function(){
    $('body').append(BackRss.mainLayout.render().el);

    if (Backbone.history)
    {
      Backbone.history.start();
    }
  });

  BackRss.start();
});
