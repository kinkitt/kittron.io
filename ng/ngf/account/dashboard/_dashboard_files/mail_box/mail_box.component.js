(function(){
    "use strict";
    var MailBox = angular.module("mailBox");
    MailBox.component('mailBox',{
            templateUrl : 'public/account/dashboard/_dashboard_files/mail_box/mail_box.template.html',
            controller:  function MailBox($mdSidenav, $scope, $timeout, $mdDialog,$sce){
                $scope.onSelect = false;

                $scope.selected = [];

                $scope.selectMail = function (dd) {
                    $scope.onSelect = true;
                    $scope.selected.name = dd.name;
                };
                $scope.showConfirm = function(ev, s) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title('Would you like to delete mail from'+s.name +'?')
                        .textContent('All of the banks have agreed to forgive you your debts.')
                        .ariaLabel('Lucky day')
                        .targetEvent(ev)
                        .ok('Please do it!')
                        .cancel('Sounds like a scam');

                    $mdDialog.show(confirm).then(function() {
                        $scope.status = 'You decided to get rid of your debt.';
                    }, function() {
                        $scope.status = 'You decided to keep your debt.';
                    });
                };

                $scope.toggleNav =function () {
                    $mdSidenav('contactNav').toggle();
                };
                function DialogController($scope, $mdDialog) {
                    $scope.hide = function() {
                        $mdDialog.hide();
                    };

                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };

                    $scope.answer = function(answer) {
                        $mdDialog.hide(answer);
                    };
                    $scope.openMenu = function ($mdMenu, ev) {
                        $mdMenu.open(ev);
                    }
                };

                $scope.sortContact = function (d) {
                    $scope.loadStuff();
                };

                $scope.addContact = function (ev) {
                    $mdDialog.show({
                        controller: DialogController,
                        templateUrl: 'public/account/dashboard/_dashboard_files/manage_contacts/add_contact.template.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose:true
                    })
                        .then(function(answer) {
                            $scope.status = 'You said the information was "' + answer + '".';
                        }, function() {
                            $scope.status = 'You cancelled the dialog.';
                        });
                };

                $scope.viewContact = function (dd, ev) {
                    $scope.onSelect = true;
                    $mdDialog.show({
                        controller: function ViewContactController($scope, $mdDialog) {
                            $scope.data = dd;
                            $scope.hide = function() {
                                $mdDialog.hide();
                            };

                            $scope.cancel = function() {
                                $mdDialog.cancel();
                            };

                            $scope.answer = function() {
                                //$mdDialog.hide(answer);
                                console.info($scope.data);
                            };
                            $scope.openMenu = function ($mdMenu, ev) {
                                $mdMenu.open(ev);
                            }
                        },
                        templateUrl: 'public/account/dashboard/_dashboard_files/manage_contacts/view_contact.template.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose:true
                    })
                        .then(function(answer) {
                            $scope.status = 'You said the information was "' + answer + '".';
                        }, function() {
                            $scope.status = 'You cancelled the dialog.';
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
                        return $scope.desserts ? $scope.desserts.count : 0;
                    }
                }];

                $scope.query = {
                    order: 'name',
                    limit: 5,
                    page: 1
                };

                $scope.desserts = {
                    "count": 9,
                    "data": [
                        {
                            "name": "Barry ",
                            "email": "barryogbonna@gmail.com",
                            "lastname": "Ogbonna",
                            "nickname": "sparrow",
                            "phone_number": "09033284362",
                            "favorite": true,
                            "type": "Vendor",
                            "dob": "",
                            "address": "jangolova avenue to kukere movement",
                            "note": ""
                        },{
                            "name": "Shade ",
                            "email": "sadekayode@gmail.com",
                            "lastname": "Kayode",
                            "nickname": "S key",
                            "phone_number": "08133466367",
                            "favorite": true,
                            "type": "Worker",
                            "dob": "",
                            "address": "jangolova avenue to kukere movement",
                            "note": ""
                        },{
                            "name": "Faruk",
                            "email": "farukolaide@gmail.com",
                            "lastname": " Olaide",
                            "nickname": "Faro",
                            "phone_number": "070443284362",
                            "favorite": true,
                            "type": "Friend",
                            "dob": "",
                            "address": "jangolova avenue to kukere movement",
                            "note": ""
                        },{
                            "name": "Zainab",
                            "email": "zainababdulsalam@gmail.com",
                            "lastname": "Abdulsalam",
                            "nickname": "Zee",
                            "phone_number": "081052843642",
                            "favorite": true,
                            "type": "Client",
                            "dob": "",
                            "address": "jangolova avenue to kukere movement",
                            "note": ""

                        },{
                            "name": "Yusuf",
                            "email": "yusufmohammed@gmail.com",
                            "lastname": "Mohammed",
                            "nickname": "Yus man",
                            "phone_number": "08054324569",
                            "favorite": true,
                            "type": "Friend",
                            "dob": "",
                            "address": "jangolova avenue to kukere movement",
                            "note": ""
                        },{
                            "name": "Emeka",
                            "email": "emekachinedu@gmail.com",
                            "lastname": "Chinedu",
                            "nickname": "Emaks",
                            "phone_number": "07032384366",
                            "favorite": true,
                            "type": "Worker",
                            "dob": "",
                            "address": "jangolova avenue to kukere movement",
                            "note": ""
                        },
                    ]
                };


                // $http.get('desserts.json').then(function (desserts) {
                //     $scope.desserts = desserts.data;
                //
                //     // $scope.selected.push($scope.desserts.data[1]);
                //
                //     // $scope.selected.push({
                //     //   name: 'Ice cream sandwich',
                //     //   type: 'Ice cream',
                //     //   calories: { value: 237.0 },
                //     //   fat: { value: 9.0 },
                //     //   carbs: { value: 37.0 },
                //     //   protein: { value: 4.3 },
                //     //   sodium: { value: 129.0 },
                //     //   calcium: { value: 8.0 },
                //     //   iron: { value: 1.0 }
                //     // });
                //
                //     // $scope.selected.push({
                //     //   name: 'Eclair',
                //     //   type: 'Pastry',
                //     //   calories: { value:  262.0 },
                //     //   fat: { value: 16.0 },
                //     //   carbs: { value: 24.0 },
                //     //   protein: { value:  6.0 },
                //     //   sodium: { value: 337.0 },
                //     //   calcium: { value:  6.0 },
                //     //   iron: { value: 7.0 }
                //     // });
                //
                //     // $scope.promise = $timeout(function () {
                //     //   $scope.desserts = desserts.data;
                //     // }, 1000);
                // });

                $scope.toggleLimitOptions = function () {
                    $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
                };

                $scope.getTypes = function () {
                    return ['Candy', 'Ice cream', 'Other', 'Pastry'];
                };

                $scope.onPaginate = function(page, limit) {
                    console.log('Scope Page: ' + $scope.query.page + ' Scope Limit: ' + $scope.query.limit);
                    console.log('Page: ' + page + ' Limit: ' + limit);

                    $scope.promise = $timeout(function () {

                    }, 2000);
                };

                $scope.deselect = function (item) {
                    console.log(item.name, 'was deselected');
                };

                $scope.log = function (item) {
                    console.log(item.name, 'was selected');
                };

                $scope.loadStuff = function () {
                    $scope.promise = $timeout(function () {

                    }, 2000);
                };

                $scope.onReorder = function(order) {

                    console.log('Scope Order: ' + $scope.query.order);
                    console.log('Order: ' + order);

                    $scope.promise = $timeout(function () {

                    }, 2000);
                };

        }
    });
    MailBox.controller('MessageViewController',['$scope', function ($scope) {
        //$scope.name = $scope.desserts.data.name;
    }]);
}());