(function(){
    "use strict";
    var accountPwdF = angular.module("account");


    accountPwdF.component("forgotPwd",{
        controller : ['$scope', function($scope){
            $scope.recoveryEmail= 'Barryogbonna@gmail.com';
        }],
        templateUrl  : 'ngf/account/forgotPwd.template.html'
    });
}());