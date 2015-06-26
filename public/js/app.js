define([
  "marionette",
  "globals",
  "mainController"
], function(Marionette, BackRss, MainController) {
  "use strict";

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
    var mainController = new MainController();

    new BackRss.Router({
      controller: mainController
    });
  });

  BackRss.vent.on("error", function(message) {
    bootbox.alert(message, function() {
      Backbone.history.navigate("/", { trigger: true });
    });
  });

  BackRss.on('before:start', function() {
    BackRss.AppLayoutView = Marionette.LayoutView.extend({
      template: "#layout-view-template",

      regions: {
        menu: "#menu",
        content: "#content"
      }
    });

    BackRss.mainLayout = new BackRss.AppLayoutView();
  });

  BackRss.on('start', function() {
    $('#main').html(BackRss.mainLayout.render().el);

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

  return BackRss;
});