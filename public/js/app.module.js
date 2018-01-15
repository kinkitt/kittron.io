(function(){
    angular.module("kittron", [
        'ui.router',
        'homeModule',
        'hotelModule',
        'eventCenterModule',
        'eventPlannerModule',
        'vendorModule',
        'ui.router.title',
        'oc.lazyLoad',
        'ngMaterial',
        'satellizer',
        'account'
    ]);
})();
