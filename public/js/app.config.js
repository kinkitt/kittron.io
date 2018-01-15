(function() {
    "use strict";
    var Kittron = angular.module('kittron');
    Kittron.config(['$locationProvider', '$urlRouterProvider', '$stateProvider','$ocLazyLoadProvider','$mdIconProvider','$authProvider','$mdThemingProvider','$titleProvider', function ($locationProvider, $urlRouterProvider, $stateProvider,$ocLazyLoadProvider,$mdIconProvider,$authProvider,$mdThemingProvider,$titleProvider) {
        //$locationProvider.html5Mode(true).hashPrefix('!');
        // $locationProvider.html5Mode(true);
        $titleProvider.documentTitle(['$rootScope',function($rootScope) {
            return $rootScope.$title ? $rootScope.$title + " - Kittron" : "Kittron";
        }]);
        var skipIfLoggedIn = ['$q', '$auth', function($q, $auth) {
            var deferred = $q.defer();
            if ($auth.isAuthenticated()) {
                deferred.reject();
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }];

        var loginRequired = ['$q', '$location', '$auth', function($q, $location, $auth) {
            var deferred = $q.defer();
            if ($auth.isAuthenticated()) {
                deferred.resolve();
            } else {
                $location.path('/login');
            }
            return deferred.promise;
        }];
		$urlRouterProvider.otherwise('/');
        $stateProvider.state('home', {
            url: '/',
            resolve: {
                // Constant title
                $title: function() { return 'Kittron';

                }
            },
            template: '<home-page></home-page>'
        });
        $stateProvider.state('hotel', {
            url: '/hotels',
            resolve: {
                // Constant title
                $title: function() { return 'Hotels';

                }
            },
            template: '<hotel></hotel>'
        });
        $stateProvider.state('hotel_query', {
            url: '/hotels/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Hotels';

                }
            },
            template: '<hotel-result></hotel-result>'
        });
        $stateProvider.state('event_center', {
            url: '/event_center',
            resolve: {
                $title: function() {
                    return 'Event Centers';
                }
            },
           template: '<event_center></event_center>'

        });
        $stateProvider.state('event_center_query', {
            url: '/event_center/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Event Center';

                }
            },
            template: '<event-center-result></event-center-result>'
        });
        $stateProvider.state('event_planners', {
            url: '/event_planners',
            resolve: {
                $title: function() {
                    return 'Event Planners';
                }
            },
           template: '<event_planner></event_planner>'

        });
        $stateProvider.state('event_planners_query', {
            url: '/event_planner/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Event Planner';

                }
            },
            template: '<event-planner-result></event-planner-result>'
        });
        $stateProvider.state('vendor', {
            url: '/vendor',
            resolve: {
                $title: function() {
                    return 'Vendor';
                }
            },
           template: '<vendor></vendor>'

        });
        $stateProvider.state('vendor_query', {
            url: '/vendor/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Vendor';

                }
            },
            template: '<vendor-result></vendor-result>'
        });
        $stateProvider.state('how_kittron_works', {
            url: '/how_kittron_works',
            resolve: {
                $title: function() {
                    return 'How Kittron Works';
                }
            },
           templateUrl: 'public/how_kittron_works/how_kittron_works.template.html'

        });
        $stateProvider.state('faq_help', {
            url: '/faq_help',
            resolve: {
                $title : function(){
                    return ' Frequently Asked Questions and Help | Kittron';
                }
            },
            templateUrl: 'public/faq_help/faq_help.template.html'

        });

        $stateProvider.state('login', {
            url: '/login',
            resolve: {
                $title: function(){
                    return 'Login into Kittron Account';
                },
                //skipIfLoggedIn: skipIfLoggedIn
            },
            template: '<login></login>'
        });
        $stateProvider.state('logout', {
            url: '/logout',
            controller: 'LogoutCtrl',
            template: null
        });
        $stateProvider.state('forgetPwd',{
                url : '/recoverPassword',
                resolve : {
                    $title: function(){
                        return 'Recover Password';
                    }
                },
                template : '<forgot-pwd></forgot-pwd>'
            });

        $stateProvider.state('customerCare', {
            url: '/customer_care',
            data: {
                pageTitle: 'Customer Care | Kittron'
            },
            template: '<h1>Bayjuguj</h1>'
        });
        $stateProvider.state('frontDesk', {
            url: '/front_desk',
            data: {
                pageTitle: 'Front Desk | Kittron'
            },
            template: '<h1>Front Desk | Kittron</h1>'
        });
        $stateProvider.state('termsOfUse', {
            url: '/terms_of_use',
            data: {
                pageTitle: 'Terms Of Use | Kittron'
            },
            template: '<h1>Terms</h1>'
        });
        $stateProvider.state('privacyPolicy', {
            url: '/privacy_policy',
            data: {
                pageTitle: 'Privacy Policy | Kittron'
            },
            template: '<h1>Privacy</h1>'
        });
        $stateProvider.state('joinKittron', {
            url: '/join_kittron',
            data: {
                pageTitle: 'Join Kittron | Kittron'
            },
            template: '<h1>join_kittron</h1>'
        });
        $stateProvider.state('coverage', {
            url: '/coverage',
            data: {
                pageTitle: 'Coverage | Kittron'
            },
            template: '<h1>coverage</h1>'
        });
        $stateProvider.state('affiliates', {
            url: '/affiliates',
            data: {
                pageTitle: 'Affiliates | Kittron'
            },
            template: '<h1>Affiliates</h1>'
        });
        $mdThemingProvider
            .theme('default')
            .primaryPalette('blue')
            .accentPalette('light-blue')
            .warnPalette('red')
            .backgroundPalette('grey');

        $authProvider.tokenName = 'token';
        $authProvider.tokenPrefix = 'kittron';
        $authProvider.tokenHeader = 'Authorization';
        $authProvider.baseUrl = 'http://kittron.com/';
        $authProvider.loginUrl = 'login';
        $authProvider.signupUrl = 'signup';
        $authProvider.tokenType = 'Bearer';
        $authProvider.setStorageType = 'localStorage';
    }]);
   Kittron.run(['$rootScope','$state','$stateParams', function($rootScope, $state, $stateParams){
        $rootScope.goto = function(ev) {
            $state.go(ev);
        };
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.isLogin = true;
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.preloader = true;
            //console.log($state);
           // alert('changing');
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.preloader = false;
           // alert('changed');
        });
    }]);
})();