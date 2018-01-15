/**
 * Created by user on 1/5/2017.
 */
(function(){
    'use strict';
    angular.module('dashboard')
        .config(["$locationProvider", "$stateProvider","$ocLazyLoadProvider","$authProvider","$sceDelegateProvider",function($locationProvider, $stateProvider,$ocLazyLoadProvider,$authProvider,$sceDelegateProvider){
            var skipIfLoggedIn = ['$q', '$auth', function($q, $auth) {
                var deferred = $q.defer();
                if ($auth.isAuthenticated()) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }];

            $stateProvider.state('dashboard', {
                abstract: true,
                url: '/dashboard',
                resolveAs : 'rdata',
                resolve: {
                    userProfile: function(Account) {
                        var acc =  Account.user.profile();
                        return acc;
                    }
                },
                templateUrl: 'ngf/account/dashboard/dashboard.template.html'
            });
            $stateProvider.state('dashboard.home',{
                 url : '',
                controller : 'dashbordHomeCtrl',
                resolve : {
                     $title: function(){
                         return 'Dashboard Home';

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/dashboard/dashboard_home.template.html'
                 // template : '<dashboard-home></dashboard-home>'
             });

            $stateProvider.state('dashboard.users',{
                 url : '/users',
                resolve : {
                     $title: function(){
                         return 'Users';

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/users.template.html'
             });
            $stateProvider.state('dashboard.add_user',{
                 url : '/add_user',
                resolve : {
                     $title: function(){
                         return 'Add user';

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/add_user.template.html'
             });
            $stateProvider.state('dashboard.edit_user',{
                 url : '/users/{user}/edit',
                resolve : {
                     $title: function($stateParams){
                         return 'Edit '+ $stateParams.user;

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/edit_user.template.html'
             });
            $stateProvider.state('dashboard.view_user',{
                 url : '/users/{user}',
                resolve : {
                     $title: function($stateParams){
                         return 'View '+ $stateParams.user;

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/view_user.template.html'
             });

            $stateProvider.state('dashboard.manage_site',{
                url : '/manage_site',
                controller : 'ManageSiteCtrl',
                resolve : {
                    $title: function(){
                        return 'Manage site';
                    },
                    site : function (Account) {
                        var site = Account.site.detail();
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_site/manage_site.template.html',
            });
            $stateProvider.state('dashboard.contacts',{
                url : '/contacts',
                resolve : {
                    $title: function(){
                        return 'Manage contacts';
                    }
                },

                template : '<dashboard-contacts></dashboard-contacts>'
            });
            $stateProvider.state('dashboard.manage_events',{
                url : '/manage_events',
                resolve : {
                    $title: function(){
                        return 'Manage events';
                    }
                },
                template : '<h1>Yeh</h1>'
            });

            $stateProvider.state('dashboard.manage_hotel',{
                url : '/manage_hotel',
                resolve : {
                    $title: function(){
                        return 'Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });
            $stateProvider.state('dashboard.manage_hotel.all_hotels',{
                url : '/hotels',
                resolve : {
                    $title: function(){
                        return 'Hotels';
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/all_hotels.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.edit_hotel',{
                url : '/{hotelName}/edit',
                resolve : {
                    $title: function($stateParams){
                        return   'Edit ' + $stateParams.hotelName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/edit_hotel.template.html'
            });

            $stateProvider.state('dashboard.manage_hotel.user_hotel',{
                url : '/myHotelName',
                abstract : true,
                resolve : {
                    $title: function($stateParams){
                        return   'Edit ' + $stateParams.hotelName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/edit_hotel.template.html'
            });

            $stateProvider.state('dashboard.manage_hotel.view_hotel',{
                url : '/view/{htName}',
                abstract : true,
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.basic',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/basic_view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.public',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/public_view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.policy',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/policy_view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.paybill',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/paybill_view_hotel.template.html'
            });

            $stateProvider.state('dashboard.manage_hotel.my_hotel',{
                url : '/my_hotel',
                resolve : {
                    $title: function(){
                        return 'Manage My Hotel';
                    }
                },
                template : '<h1>Manage My Hotel</h1>'
            });
            $stateProvider.state('dashboard.manage_hotel.add_hotel',{
                url : '/add_hotel',
                resolve : {
                    $title: function(){
                        return 'Add Hotel - Manage Hotel';
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/add_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.add_hotel_room',{
                url : '/add_hotel_room',
                resolve : {
                    $title: function(){
                        return 'Add Hotel Room- Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });
            $stateProvider.state('dashboard.manage_hotel.add_room_type',{
                url : '/add_room_type',
                resolve : {
                    $title: function(){
                        return 'Add Room Type - Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });
            $stateProvider.state('dashboard.manage_hotel.room_type',{
                url : '/room_types',
                resolve : {
                    $title: function(){
                        return 'Room Types - Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });




        }]);
}());

// (function(){
//     "use strict";
//     angular.module('dashboard')
//         .config(["$locationProvider", "$stateProvider","$ocLazyLoadProvider",function($locationProvider, $stateProvider,$ocLazyLoadProvider){
//             $ocLazyLoadProvider.config({
//                 modules: [{
//                     name: 'dashboardFiles',
//                     files: [
//                         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.module.js',
//                         'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.module.js',
//                         'node_modules/angular-material-data-table/dist/md-data-table.min.css',
//                         'node_modules/angular-material-data-table/dist/md-data-table.min.js',
//                         'node_modules/angular-avatar-master/dist/angular-avatar.js',
//                         'js/ngletteravatar.js',
//                         // 'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                         // 'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.component.js',
//                         'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                     ]
//                 }]
//             });
//
//             $stateProvider.state('dashboard', {
//                 url: '/dashboard',
//                 abstract: true,
//                 resolve: {
//                     $title: function () {
//                         return 'Dashboard';
//                     },
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             'public/account/dashboard/js/excanvas.min.js',
//                             'public/account/dashboard/js/full-calendar/fullcalendar.min.js'
//                         ]);
//                     }]
//                 },
//                 templateUrl: 'public/account/dashboard/dashboard.template.html'
//
//             });
//             $stateProvider.state('dashboard.home',{
//                 url : '',
//                 resolve : {
//                     $title: function(){
//                         return 'Dashboard Home';
//                     },
//                     // loadMyHomeFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                     //     return $ocLazyLoad.load([
//                     //         'node_modules/angular-material-data-table/dist/md-data-table.min.css',
//                     //         'node_modules/angular-material-data-table/dist/md-data-table.min.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.module.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.config.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/calendar.css',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.component.js',
//                     //         'node_modules/d3/d3.js',
//                     //         'node_modules/nvd3/build/nv.d3.js',
//                     //         'node_modules/nvd3/build/nv.d3.css',
//                     //         'node_modules/angular-nvd3/dist/angular-nvd3.js',
//                     //         'public/account/dashboard/_dashboard_files/components/budget_table.component.js',
//                     //         'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                     //     ]);
//                     // }],
//                     loadMyHomeFiles: [
//                         '$ocLazyLoad', function($ocLazyLoad) {
//                             return $ocLazyLoad.load({
//                                 name: 'dashboard',
//                                 files: [
//                                     'node_modules/angular-material-data-table/dist/md-data-table.min.css',
//                                     'node_modules/angular-material-data-table/dist/md-data-table.min.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.module.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.config.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/calendar.css',
//                                     'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.component.js',
//                                     'node_modules/d3/d3.js',
//                                     'node_modules/nvd3/build/nv.d3.js',
//                                     'node_modules/nvd3/build/nv.d3.css',
//                                     'node_modules/angular-nvd3/dist/angular-nvd3.js',
//                                     'public/account/dashboard/_dashboard_files/components/budget_table.component.js',
//                                     'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                                 ]
//                             });
//                         }
//                     ]
//                 },
//
//                 template : '<dashboard-home></dashboard-home>'
//             });
//             $stateProvider.state('dashboard.reports',{
//                 url : '/reports',
//                 resolve : {
//                     $title: function(){
//                         return 'Reports';
//                     }
//
//                 },
//                 template : '<h1>Yeh</h1>'
//             });
//             $stateProvider.state('dashboard.app_tour',{
//                 url : '/app_tour',
//                 resolve : {
//                     $title: function(){
//                         return 'App tour';
//                     }
//                 },
//                 template : '<app-tour></app-tour>'
//             });
//             $stateProvider.state('dashboard.mail_box',{
//                 url : '/mail',
//                 resolve : {
//                     $title: function(){
//                         return 'Mailbox ';
//                     },
//                     loadModule: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load('dashboardFiles');
//                     }],
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             'public/account/dashboard/_dashboard_files/mail_box/mail_box.module.js',
//                             'public/account/dashboard/_dashboard_files/mail_box/mail_box.config.js',
//                             'public/account/dashboard/_dashboard_files/mail_box/mail_box.component.js'
//                         ]);
//                     }]
//                 },
//                 template : '<mail-box></mail-box>'
//             });
//             $stateProvider.state('dashboard.mail_box.inbox',{
//                 url : '/inbox',
//                 resolve : {
//                     $title : function(){
//                         return ' Inbox ';
//                     }
//                 },
//                 template : '<inbox></inbox>'
//             });
//             $stateProvider.state('dashboard.manage_events',{
//                 url : '/manage_events',
//                 resolve : {
//                     $title: function(){
//                         return 'Manage events';
//                     }
//                 },
//                 template : '<h1>Yeh</h1>'
//             });
//             $stateProvider.state('dashboard.contacts',{
//                 url : '/contacts',
//                 resolve : {
//                     $title: function(){
//                         return 'Manage contacts';
//                     },
//                     loadModule: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load('dashboardFiles');
//                     }],
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             // 'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.module.js',
//                             'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                             'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.component.js',
//                             'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                         ]);
//                     }],
//                 },
//
//                 template : '<dashboard-contacts></dashboard-contacts>'
//             });
//             $stateProvider.state('dashboard.manage_site',{
//                 url : '/manage_site',
//                 resolve : {
//                     $title: function(){
//                         return 'Manage site';
//                     },
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             'public/account/dashboard/_dashboard_files/manage_site/manage_site.module.js',
//                             'public/account/dashboard/_dashboard_files/manage_site/manage_site.component.js'                        ]);
//                     }]
//                 },
//                 template : '<manage-site></manage-site>'
//             });
//         }]);
// }());