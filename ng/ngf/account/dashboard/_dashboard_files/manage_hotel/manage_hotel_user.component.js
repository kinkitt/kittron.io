(function () {
    "use strict";
    angular.module('dashHotel')
            .component('hotelUser',{
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/manage_hotel_user.template.html',
                controller:  ['$scope', function ($scope){
                    $scope.templates = [
                        {name : 'basic', url : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/basic_view_hotel.template.html'},
                        {name : 'public', url : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/public_view_hotel.template.html'},
                        {name : 'billing', url : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/paybill_view_hotel.template.html'}
                    ];
                    $scope.page = 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/basic_view_hotel.template.html';
                    $scope.goto = function (x) {
                        $scope.page  = x;
                    };
            }]
        });
})();