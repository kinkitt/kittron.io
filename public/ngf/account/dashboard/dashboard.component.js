

    var account = angular.module("dashboard");

    account.controller('DashboardCtrl', ['$mdSidenav','$http','$state', function($mdSidenav,$http,$state){
        var dc = this;
        dc.toggleRight = function(){
            $mdSidenav('right').toggle();
            console.log($state.current.name);
        };

        dc.toggleLeft = function(){
            $mdSidenav('left').toggle();
        };

        dc.leftNavItem = [
            {
                name : 'Dashboard',
                ref : 'dashboard.home',
                icon : 'dashboard'
            },
            {
                name : 'Reports',
                ref : 'dashboard.reports',
                icon : 'report'
            },
            {
                name : 'Mail Box',
                ref : 'dashboard.mail_box',
                icon : 'inbox'
            },
            {
                name : 'Manage Events',
                ref : 'dashboard.manage_events',
                icon : 'event'
            },
            {
                name : 'Manage Contacts',
                ref : 'dashboard.contacts',
                icon : 'contacts'
            },
            {
                name : 'Manage Hotel',
                ref : 'dashboard.manage_hotel',
                icon : 'location_city'
            },
            {
                name : 'Users',
                ref : 'dashboard.users',
                icon : 'people'
            }

        ];

        // dc.selectedIndex = null;




        dc.goToState = function (s, i) {
            $state.go(s);
            $mdSidenav('left').close();

            if (dc.selectedIndex === null) {
                dc.selectedIndex = i;
            }
            else if (dc.selectedIndex === i) {
                dc.selectedIndex = null;
            }
            else {
                dc.selectedIndex = i;

            }

        };


    }]);


