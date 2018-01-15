/**
 * Created by user on 8/15/2017.
 */
(function () {
    "use strict";
    angular.module('eventCenterModule')
        .config(['$mdThemingProvider',function ($mdThemingProvider) {
            $mdThemingProvider.theme('bar')
                .primaryPalette('cyan')
                .backgroundPalette('cyan')
                .warnPalette('blue-grey')
                .accentPalette('blue-grey');
        }]);
})();
