// (function () {
//     "use strict";
//     angular.module('compModule')
//             .component('budgetWidget',{
//                 templateUrl :'ngf/account/dashboard/_dashboard_files/components/budget_widget.template.html',
//                 controller:  ['$scope','$http', function ($scope,$http){
//                     $http.get("/budget_engine")
//                         .then(function(data){
//                         $scope.data = {};
//                         $scope.data.WEconfiguration = data;
//                         $scope.data.WEconfiguration2 = angular.copy(data);
//                         $scope.data.WEcallback = function(e, configuration){
//                             console.log(e, configuration);
//                         };
//                     });
//             }]
//         });
// })();

angular
    .module('compModule')
    .controller('sampleCtrl',['$scope','$http', sampleCtrl]);


function sampleCtrl($scope, $http){

    // prepare the widget data
    $http.get("/budget_engine").then(function(data){
        $scope.data = {};
        console.log(data.data);
        $scope.data.WEconfiguration = data.data;
        $scope.data.WEconfiguration2 = angular.copy(data.data);
        $scope.data.WEcallback = function(e, configuration){
            console.log(e, configuration);
        };
    });


}