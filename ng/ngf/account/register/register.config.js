(function(){
    "use strict";
    angular.module('register')
        .config(["$locationProvider", "$stateProvider","$ocLazyLoadProvider",function($locationProvider, $stateProvider,$ocLazyLoadProvider){
            $stateProvider.state('register', {
                abstract: true,
                url: '/register',
                resolve: {
                    $title : function(){
                        return 'Create Your Kittron Account';
                    }
                },
                loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([

                    ]);
                }],
                templateUrl: 'ngf/account/register.template.html'
            });
            $stateProvider.state('register.basic', {
                url: '/',
                templateUrl: 'ngf/account/register/basic.template.html'
            });
            $stateProvider.state('register.business', {
                url: '/',
                templateUrl: 'ngf/account/register/business.template.html'
            });
            $stateProvider.state('register.website', {
                url: '/',
                templateUrl: 'ngf/account/register/website.template.html'
            });
            $stateProvider.state('register.confirm', {
                url: '/',
                templateUrl: 'ngf/account/register/confirm.template.html'
            });$stateProvider.state('register.success', {
                url: '/verify',
                templateUrl: 'ngf/account/register/confirm.template.html'
            });
        }]);

}());