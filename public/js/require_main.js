requirejs.config({
  'baseUrl': '/js',
  paths : {
    backbone: 'vendor/backbone-min',
    underscore: 'vendor/underscore-min',
    jquery: 'vendor/jquery-2.1.4.min',
    marionette: 'vendor/backbone.marionette.min',
    moment: 'vendor/moment.min',
    bootstrap: 'vendor/bootstrap.min',
    bootbox: 'bootbox.min',
    app: 'app',
    mainController: 'controllers/main',
    entityFeeds: 'entities/feeds',
    entitySites: 'entities/sites',
    feedViews: 'views/feeds',
    siteViews: 'views/sites'
  },

  shim: {
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ["jquery", "underscore"],
      exports: "Backbone"
    },
    marionette: {
      deps: ["backbone"],
      exports: "Marionette"
    }
  }
});

require(["app"], function(App){
  App.start();
});
