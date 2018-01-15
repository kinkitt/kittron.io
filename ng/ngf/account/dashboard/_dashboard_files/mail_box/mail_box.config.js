(function(){
    "use strict";
    angular.module("mailBox")
        .config(["$stateProvider","$ocLazyLoadProvider", function($stateProvider, $ocLazyLoadProvider){

        $stateProvider.state('dashboard.mail_box.compose',{
            url : '/compose',
            resolve : {
                $title : function(){
                    return 'Compose | Mailbox ';
                },
                loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'public/account/dashboard/_dashboard_files/mail_box/compose/compose.module.js',
                        'public/account/dashboard/_dashboard_files/mail_box/compose/compose.config.js',
                        'public/account/dashboard/_dashboard_files/mail_box/compose/compose.component.js'
                    ]);
                }]

            },
            template : '<compose></compose>'
        });
        $stateProvider.state('dashboard.mail_box.draft',{
            url : '/draft',
            resolve : {
                $title : function(){
                    return 'Draft | Mailbox ';
                },
                loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'public/account/dashboard/_dashboard_files/mail_box/draft/draft.module.js',
                        'public/account/dashboard/_dashboard_files/mail_box/draft/draft.config.js',
                        'public/account/dashboard/_dashboard_files/mail_box/draft/draft.component.js'
                    ]);
                }]
            },
            template : '<draft></draft>'
        });
        $stateProvider.state('dashboard.mail_box.sent',{
            url : '/sent',
            resolve : {
                $title : function(){
                    return 'Sent | Mailbox ';
                },
                loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'public/account/dashboard/_dashboard_files/mail_box/sent/sent.module.js',
                        'public/account/dashboard/_dashboard_files/mail_box/sent/sent.config.js',
                        'public/account/dashboard/_dashboard_files/mail_box/sent/sent.component.js'
                    ]);
                }]
            },
            template : '<sent></sent>'
        });
        $stateProvider.state('dashboard.mail_box.trash',{
            url : '/trash',
            resolve : {
                $title : function(){
                    return 'Trash | Mailbox ';
                },
                loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'public/account/dashboard/_dashboard_files/mail_box/trash/trash.module.js',
                        'public/account/dashboard/_dashboard_files/mail_box/trash/trash.config.js',
                        'public/account/dashboard/_dashboard_files/mail_box/trash/trash.component.js'
                    ]);
                }]
            },
            template : '<trash></trash>'
        });
            $stateProvider.state('dashboard.mail_box.read',{
            url : '/read',
            resolve : {
                $title : function(){
                    return 'Read | Mailbox ';
                },
                loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'public/account/dashboard/_dashboard_files/mail_box/read/read.module.js',
                        'public/account/dashboard/_dashboard_files/mail_box/read/read.config.js',
                        'public/account/dashboard/_dashboard_files/mail_box/read/read.component.js'
                    ]);
                }]
            },
            template : '<read></read>'
        });
    }]);
}());