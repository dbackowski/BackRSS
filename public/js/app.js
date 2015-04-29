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
      url: ''
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
    template: '#site-item-template'
  });

  BackRss.SitesCollectionView = Backbone.Marionette.CompositeView.extend({
    template: '#sites-template',
    tagName: "ul",
    className: "nav",
    childView: BackRss.SiteItemView,

    initialize : function () {
      this.listenTo(this.collection, "reset", this.render);
    },

    templateHelpers: function() {
      return {
        count: BackRss.all_count
      }
    }
  });

  BackRss.FeedItemView = Backbone.Marionette.ItemView.extend({
    tagName: "li",
    template: '#feed-item-template'
  });

  BackRss.NoFeedItemsView = Backbone.Marionette.ItemView.extend({
    template: '#no-feeds-template'
  });

  BackRss.FeedsCollectionView = Backbone.Marionette.CompositeView.extend({
    template: '#feeds-template',
    childView: BackRss.FeedItemView,
    childViewContainer: "ul",
    emptyView: BackRss.NoFeedItemsView,

    events: {
      'click a#mark-readed': "markReaded"
    },

    initialize: function() {
      this.listenTo(this.collection, "reset", this.render);
      this.collection.fetch();
    },

    markReaded: function() {
      this.collection.forEach(function(model, index) {
        model.save({seen: true}, { wait: true });
      });

      this.collection.reset();
      BackRss.sites.trigger('reset');
    },

    templateHelpers: function() {
      return {
        category_id: this.collection.category_id
      }
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

    addSite: function () {
      if (!this.ui.inputTitle.val() || !this.ui.inputUrl.val()) {
        return false;
      }

      this.collection.create({title: this.ui.inputTitle.val(), url: this.ui.inputUrl.val()}, { wait: true });
      Backbone.history.navigate("feeds", { trigger: true });
    }
  });

  BackRss.Router = Marionette.AppRouter.extend({
    appRoutes: {
      'feeds': 'feeds',
      'feeds/:category_id': 'feeds',
      'add-site': 'addSite'
    }
  });

  var API = {
    feeds: function(category_id) {
      BackRss.all_count = 0
      BackRss.sites.fetch().done(function(collection) {
        for (var site in collection.data)
        {
          BackRss.all_count += collection.data[site].count;
        }

        var sitesListView = new BackRss.SitesCollectionView({
          collection: BackRss.sites,
        });

        var feeds = new BackRss.FeedsCollection([], {category_id: category_id});

        var feedsListView = new BackRss.FeedsCollectionView({
          collection: feeds
        })

        BackRss.mainLayout.menu.show(sitesListView);
        BackRss.mainLayout.content.show(feedsListView);
      });
    },

    addSite: function() {
      var addSiteView = new BackRss.AddSiteView({
        collection: BackRss.sites
      });

      BackRss.mainLayout.content.show(addSiteView);
    }
  };

  BackRss.addInitializer(function(){
    new BackRss.Router({
      controller: API
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

      if (Backbone.history.fragment === "")
      {
        Backbone.history.navigate("feeds", { trigger: true });
      }
    }
  });

  BackRss.start();
});