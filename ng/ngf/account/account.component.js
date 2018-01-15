(function(){
    "use strict";

    var account = angular.module("account");
        account.component("login",{
            controller : [function(){}],
            templateUrl  : 'ngf/account/login.template.html'
        });
    account.controller('RegisterCtrl', ['$rootScope','$state','$scope','$http','$timeout','$auth','$filter','$q', function($rootScope,$state,$scope,$http,$timeout,$auth,$filter,$q){
        $scope.switcher = true;
        $scope.isVendor = true;
        $scope.vendorServices = [
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
        $scope.registerAs=function(r){
       		$scope.switcher = false;
       		if(r == 'event_planner'){
       			$scope.isVendor = false;
                $scope.userData.type = 'Event Planner';
            }
       		else{
       			$scope.isVendor = true;
                $scope.userData.type = 'Vendor';

            }
       		
        };		
        $scope.userData ={};
        $scope.userData.krf = $scope.krf;

        $scope.customEmail = function(data){
			if(data.first_name == undefined || data.business_name == undefined){
				return '';
			}
			else{
				var b_name = data.business_name;
				b_name = b_name.replace(' ', '_');
				b_name = angular.lowercase(b_name);
			return data.first_name + '.'+ b_name+'@kr.com';

			}
			
		};

        $scope.signUp = function(){
            $scope.userData.dob = $filter('date')($scope.userData.dob,'yyyy-MM-dd h:mm:ss');
            console.log($scope.userData);
            $auth.signup($scope.userData)
                .then(function(res) {
                    // if(res.status == 200){
                    //     // $state.go('success');
                    //     // console.log('please verify email');
                    // }
                    console.log(res);
                })
                .catch(function(response) {
                    // Handle errors here.
                    // console.log('error');
                    // console.log(response);
                });
        };

    }])
        .directive('emailValidator', [function(){
            return {
                require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.email = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        var regex = /^([^<>()\[\],;:@"\x00-\x20\x7F]|\\.)+@(([a-z]|#\d+?)([a-z0-9]|#\d+?)*([a-z0-9]|#\d+?)\.)+([a-z]{2,4})$/i;
                        return regex.test(value);
                    }
                }
            };
        }])

        .directive('emailAvailability', ['$http','$q',function($http,$q){
            return {
                require : 'ngModel',
                link : function (scope, element, attrs, ngModel) {
                    // ngModel.$asyncValidators.emailavail = function(modelValue, viewValue){
                    //     var value = modelValue || viewValue;
                    //
                    //     return $http.get('http://kittron.com/check', {email: viewValue})
                    //         .then(function resolved() {
                    //             console.log('doesnt');
                    //             console.log(response);
                    //             // return emailavail.$invalid;
                    //             return $q.reject('exists');
                    //         }, function errorCallback(response) {
                    //             console.log('does');
                    //             console.log(response);
                    //             return true;
                    //         });
                    //
                    // };

                    ngModel.$asyncValidators.emailavail = function(modelValue, viewValue) {
                        var value = modelValue || viewValue;

                        // Lookup user by username
                        return $http.post('http://kittron.com/check',{email: viewValue}).
                        then(function resolved() {
                            //username exists, this means validation fails
                            return true;

                        }, function rejected() {
                            //username does not exist, therefore this validation passes
                            return $q.reject('exists');
                        });
                    };
                }
            };
        }])
        .directive('passwordValidate', [function(){
            return {
                require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.password = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        if(value !== undefined){
                            var regex = /[A-Z]\d/;
                            return regex.test(value);
                        }

                    }
                }

            };
        }])
        .directive('passwordMatch', ['$scope', function ($scope) {
            return {
                scope:{
                   matchPass: '=pass'
                },
                require: 'ngModel',
                link: function ($scope, elem , attrs,ngModel) {
                        ngModel.$validators.password = function (modelValue, viewValue, scope) {
                            //var value = modelValue;
                           // var value2 =  scope.matchPass.userData;
                            //return angular.equals(value, value2);
                        }

                }
            };
        }])
        .directive('numberValidate', [function(){
            return {
                require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.telephone = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        var regex = /^(\+\d{1,3} ?)?(\(\d{1,5}\)|\d{1,5}) ?\d{0,7}?$/i;
                        return regex.test(value);
                    }
                }

            };
        }])
        .directive('businessAvailability', [function(){
            return {
				
            };
        }])
        .directive('sAvail', [function(){
            return {

            };
        }])
		.directive('sVal', [function(){
            return {
				require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.string = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        //var regex = /^[a-zA-Z]/i;
                        var regex = /^[-\w]+$/i;
                        //var regex = /[^-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g;
                        return regex.test(value);
                    }
                }
            };
        }]);
    account.controller('VerifyCtrl',['$scope','$http','$state','$stateParams',function ($scope,$http,$state,$stateParams) {
        $scope.verification_code = $state.params.code;
        if($scope.verification_code){
            var vcode = $scope.verification_code;
            $scope.verifying = true;
            $scope.vSuccess = false;
            $scope.onerr = false;
            $http.get('http://kittron.com/account/verify/'+ vcode)
                .then(function onFulfilled(res) {
                    $scope.verifying = false;
                    $scope.vSuccess = true;
                },function onRejected(res) {
                    $scope.vSuccess = false;
                    $scope.verifying = false;
                    $scope.onerr = true;
                });
        }
    }]);
    account.controller('LoginCtrl', ['$rootScope','$state','$scope','$auth','$location','$http','Account', function($rootScope,$state,$scope,$auth,$location,$http,Account){
        $scope.loginData ={};
        // $scope.loginData ={};
        $scope.loginUser = function(){
            $scope.processing =true;
            Account.auth.login($scope.loginData, function (res) {
                $scope.processing = false;
                $auth.setToken(res.access_token);
                $state.go('dashboard.home');
                // var ss = Account.user.profile();
                // console.log(ss);
            },function (res) {
                $scope.processing = false;
                console.log('err');
                console.log(res);
            });

            // $auth.login($scope.loginData, {
            //     method: 'POST',
            //     headers: {'content-Type': 'application/x-www-form-urlencoded'},
            //     transformRequest: function (data, headersGetter) {
            //         var str = [];
            //         for(var d in data){
            //           str.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
            //         }
            //         return str.join("&");
            //     }
            //
            // })
            //     .then(function (res) {
            //         $scope.processing = false;
            //         $auth.setToken(res.data.access_token);
            //         $state.go('dashboard.home');
            //         // location.reload(true);
            //         console.log(res);
            //         var tk = res.data.access_token;
            //            $scope.getProfile(tk);
            //         var payload = $auth.getPayload();
            //         console.info(payload);
            //     }, function (error) {
            //         $scope.processing = false;
            //         $scope.errors = true;
            //     });
        };

        $scope.getProfile = function (tk) {
            $http.get('http://kittron.com/profile', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + tk
                }
            })
                .then(function (res) {
//                        $scope.secured= res.data;
                    console.log(res);

                }),function (res) {
//                    $scope.secured= res.data;
                console.log(res);

            }
        }

    }]);
    account.controller('LogoutCtrl', ['$state','$auth', function($state, $auth) {
        if (!$auth.isAuthenticated()) { return; }
        $auth.logout()
            .then(function() {
                $state.transitionTo('home');
                location.reload(true);

            });
    }]);

})();
