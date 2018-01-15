(function () {
    "use strict";
    var dashboard_home = angular.module('dashHome');

    dashboard_home.controller("dashbordHomeCtrl",['$http','$scope', function ($http,$scope) {
                        // $scope.profile = $resolve.userProfile;
                        // $scope.myNameIs = 'barryogbonna';
        $http.get("/home_widget").then(function(data){
            $scope.data = {};
            console.log(data.data);
            $scope.data.configuration = data.data;
            $scope.data.WEconfiguration2 = angular.copy(data.data);
            $scope.data.callback = function(e){
                console.log(e);
            };
        });
    }]);
    // dashboard_home.component("dashboardHome",{
    //             templateUrl: 'ngf/account/dashboard/_dashboard_files/dashboard/dashboard_home.template.html',
    //             bindings: { Account: '<' },
    //             controller:  ['$scope','Account','$state', function dashbordHomeCtrl($scope, Account, $state){
    //                 $scope.myNameIs = 'barryogbonna';
    //                 var acc =  Account;
    //                     // console.log($state.$current.resolve.userProfile);
    //
    //         }]
    //     });

})();