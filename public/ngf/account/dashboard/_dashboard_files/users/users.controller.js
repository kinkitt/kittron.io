(function(angular){
    "use strict";
    angular.module('dashboard')
        .controller('usersCtrl', ['$scope','$mdDialog','$state','Account', Controller]);
            function Controller($scope,$mdDialog,$state,Account){
                $scope.confirmDelete =  function(ev , u) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title(u.first_name + ' will be deleted')
                        .textContent('All information with ' + u.first_name+ 'will be erased')
                        .ariaLabel('Delete User')
                        .targetEvent(ev)
                        .ok('Proceed')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function() {
                        Account.user_del.act({id: u.id});
                        $scope.status = 'You decided to get rid of your debt.';
                    }, function() {
                        $scope.status = 'You decided to keep your debt.';
                    });
                };
                $scope.options = {
                    rowSelection: true,
                    multiSelect: true,
                    autoSelect: false,
                    decapitate: false,
                    largeEditDialog: false,
                    boundaryLinks: false,
                    limitSelect: false,
                    pageSelect: true
                };

                $scope.selected = [];
                $scope.limitOptions = [5, 10, 15, {
                    label: 'All',
                    value: function () {
                        return $scope.users ? $scope.users.count : 0;
                    }
                }];

                $scope.query = {
                    order: 'name',
                    limit: 5,
                    page: 1
                };
                $scope.users = Account.users.all();
                // $scope.users = {
                //     "count": 9,
                //     "data": [
                //         {
                //             "id" : 1,
                //             "name": "Barry ",
                //             "email": "barryogbonna@gmail.com",
                //             "lastname": "Ogbonna",
                //             "nickname": "sparrow",
                //             "phone_number": "09033284362",
                //             "favorite": true,
                //             "type": "Vendor",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 2,
                //             "name": "Shade ",
                //             "email": "sadekayode@gmail.com",
                //             "lastname": "Kayode",
                //             "nickname": "S key",
                //             "phone_number": "08133466367",
                //             "favorite": true,
                //             "type": "Worker",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 3,
                //             "name": "Faruk",
                //             "email": "farukolaide@gmail.com",
                //             "lastname": " Olaide",
                //             "nickname": "Faro",
                //             "phone_number": "070443284362",
                //             "favorite": true,
                //             "type": "Friend",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 4,
                //             "name": "Zainab",
                //             "email": "zainababdulsalam@gmail.com",
                //             "lastname": "Abdulsalam",
                //             "nickname": "Zee",
                //             "phone_number": "081052843642",
                //             "favorite": true,
                //             "type": "Client",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //
                //         },{
                //             "id" : 5,
                //             "name": "Yusuf",
                //             "email": "yusufmohammed@gmail.com",
                //             "lastname": "Mohammed",
                //             "nickname": "Yus man",
                //             "phone_number": "08054324569",
                //             "favorite": true,
                //             "type": "Friend",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 6,
                //             "name": "Emeka",
                //             "email": "emekachinedu@gmail.com",
                //             "lastname": "Chinedu",
                //             "nickname": "Emaks",
                //             "phone_number": "07032384366",
                //             "favorite": true,
                //             "type": "Worker",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         }
                //     ]
                // };

                $scope.toggleLimitOptions = function () {
                    $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
                };

                $scope.getTypes = function () {
                    return ['Candy', 'Ice cream', 'Other', 'Pastry'];
                };


                $scope.editUser = function (u) {
                    $state.go('dashboard.edit_user', {user : u.first_name});
                    // $state.go('dashboard.manage_hotel.edit_hotel', {hotelName : hotelData.name});

                };

                $scope.viewUser = function (u) {
                    $state.go('dashboard.view_user', {user : u.first_name});
                };

                $scope.loadStuff = function () {
                    $scope.reloading = true;
                       // $scope.users = Account.users.all();
                        $scope.users = Account.users.all(function success() {
                            $scope.reloading = false;
                        }, function error() {
                            alert('No yey');
                        });
                };

            }
    
})(angular);

(function(angular){
    "use strict";
    angular.module('dashboard')
        .controller('userEditCtrl', ['$scope','$stateParams','Account',Controller]);
    function Controller($scope,$stateParams,Account){
        $scope.userData = Account.user_get.act({id: $stateParams.user});
        $scope.showHints = true;



    }

})(angular);

(function(angular){
    "use strict";
    angular.module('dashboard')
        .controller('viewUserCtrl', ['$scope','$stateParams','Account',Controller]);
    function Controller($scope,$stateParams,Account){
        $scope.userData = Account.user_get.act({id: $stateParams.user});

    }

})(angular);