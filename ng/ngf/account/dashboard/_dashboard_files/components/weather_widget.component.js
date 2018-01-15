(function () {
    "use strict";
    angular.module('compModule')
            .component('weatherWidget',{
                templateUrl : 'ngf/account/dashboard/_dashboard_files/components/weather_widget.template.html',
                controller:  ['compService','$http','$scope', function (compService,$http,$scope){
                    $scope.weatherData = compService.weather.forecast();
                    console.log($scope.weatherData);
    
            }]
        });
    
})();