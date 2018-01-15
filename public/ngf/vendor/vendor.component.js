(function () {
    "use strict";
    
       var hotelModule = angular.module('vendorModule');
        hotelModule.component('vendor', {
            templateUrl: 'ngf/vendor/vendor.template.html',
            controller: ['$scope','$state', function($scope, $state) {
                $scope.find_vendor = function(){
                	$state.go('vendor_query');
                };
                $scope.vendor_type =[
                    "Audiovisual",
                    "Security Companies",
                    "Giftware",
                    "Interpretation ",
                    "Photographer",
                    "Musician",
                    "Printers",
                    "Destination Management Company",
                    "Communications Consultant",
                    "Stationery Designer",
                    "Promotional Products Distributor",
                    "Private Caterer",
                    "Wine Shop Owner/Sommelier",
                    "Florist",
                    "Party Rental Supplier"
                ];

            }]
        });

        
        hotelModule.component('vendorResult',{
        	templateUrl:'ngf/vendor/vendor_result.template.html',
        	controller: ['$scope','orderByFilter', function($scope, orderBy){

        	}]
        });
}());