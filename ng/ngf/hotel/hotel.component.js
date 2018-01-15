(function () {
    "use strict";
    
       var hotelModule = angular.module('hotelModule');
        hotelModule.component('hotel', {
            controller: ['$scope','$state','$timeout','$q','$log','$http', function($scope, $state,$timeout,$q,$log,$http) {
                var link = 'http://projects.dev/ki/public/hotels';
                $scope.hotel = {};

                $scope.find_hotel = function(){
                    // $state.go('hotel_query');
                    $http.post(link,{'q': $scope.hotel}).then(function (res) {
                        $scope.hotels = res.data;
                        $log.info($scope.hotels);


                    });
                };
                $scope.find_hotelWithin = function(){
                    $http.get('https://ipinfo.io').then(function (res) {
                        $scope.hotel.location = res.data.city +' '+ res.data.region;
                    });
                    $log.info($scope.hotel);
                };




                $scope.simulateQuery = false;

                // list of `state` value/display objects
                $scope.states        = loadAll();
                $scope.querySearch   = querySearch;
                $scope.selectedItemChange = selectedItemChange;

                // ******************************
                // Internal methods
                // ******************************

                /**
                 * Search for states... use $timeout to simulate
                 * remote dataservice call.
                 */
                function querySearch (query) {
                    var results = query ? $scope.states.filter( createFilterFor(query) ) : $scope.states,
                        deferred;
                    if ($scope.simulateQuery) {
                        deferred = $q.defer();
                        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
                        return deferred.promise;
                    } else {
                        return results;
                    }
                }


                function selectedItemChange(item) {
                    if(item){
                        $scope.hotel.location = item.value;
                    }
                }


                /**
                 * Build `states` list of key/value pairs
                 */
                function loadAll() {
                    var allStates = 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
              Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
              Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
              Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
              North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
              South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
              Wisconsin, Wyoming';

                    return allStates.split(/, +/g).map( function (state) {
                        return {
                            value: state.toLowerCase(),
                            display: state
                        };
                    });
                }

                /**
                 * Create filter function for a query string
                 */
                function createFilterFor(query) {
                    var lowercaseQuery = angular.lowercase(query);

                    return function filterFn(state) {
                        return (state.value.indexOf(lowercaseQuery) === 0);
                    };

                }

            }],
            templateUrl: 'ngf/hotel/hotel.template.html'
        });

        
        hotelModule.component('hotelResult',{
        	templateUrl:'ngf/hotel/hotel_result.template.html',
        	controller: ['$scope','orderByFilter', function($scope, orderBy){

        	}]
        });
}());