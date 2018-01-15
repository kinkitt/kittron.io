
(function () {
    "use strict";
    var dashboard_contacts = angular.module('dashContacts');

    dashboard_contacts.component('dashboardContacts',{
        templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.template.html',
        controller:  ['$mdSidenav','$scope','$timeout','$mdDialog', function ($mdSidenav, $scope, $timeout, $mdDialog){
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
                    controller: ['$scope','$mdDialog',DialogController],
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/add_contact.template.html',
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
                $mdDialog.show({
                    controller: ['$scope','$mdDialog', function ViewContactController($scope, $mdDialog) {
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
                    }],
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/view_contact.template.html',
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
        }]
    });


    dashboard_contacts.component('contactsTable',{
        templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_contacts/contacts_table.template.html',
        controller: ['$scope','$timeout','$mdDialog', function ($scope, $timeout, $mdDialog) {

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
            }

            $scope.sortContact = function (d) {
                alert(d);
            };

            $scope.addContact = function (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/add_contact.template.html',
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
                $mdDialog.show({
                    controller:['$scope','$mdDialog', function ViewContactController($scope, $mdDialog) {
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
                    }],
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/view_contact.template.html',
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
                    }
                ]
            };


            $scope.editComment = function (event, dessert) {
                event.stopPropagation();

                var dialog = {
                    // messages: {
                    //   test: 'I don\'t like tests!'
                    // },
                    modelValue: dessert.comment,
                    placeholder: 'Add a comment',
                    save: function (input) {
                        dessert.comment = input.$modelValue;
                    },
                    targetEvent: event,
                    title: 'Add a comment',
                    validators: {
                        'md-maxlength': 30
                    }
                };

                var promise = $scope.options.largeEditDialog ? $mdEditDialog.large(dialog) : $mdEditDialog.small(dialog);

                promise.then(function (ctrl) {
                    var input = ctrl.getInput();

                    input.$viewChangeListeners.push(function () {
                        input.$setValidity('test', input.$modelValue !== 'test');
                    });
                });
            };

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
        }]

    });

})();