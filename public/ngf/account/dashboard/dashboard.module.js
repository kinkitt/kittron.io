(function(){
    "use strict";
    angular.module("dashboard", [
        'ui.router',
        'oc.lazyLoad',
        'dashHome',
        'dashSite',
        'dashContacts',
        'dashHotel',
        'ds.clock',
        'compModule',
        'perfect_scrollbar',
        'ngMdWidgetEngine',
        'account',
        'angular.filter',
        'angularMoment',
        'ngAvatar'
    ]);
})();