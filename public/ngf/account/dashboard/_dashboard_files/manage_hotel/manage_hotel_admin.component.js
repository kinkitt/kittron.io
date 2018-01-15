(function () {
    "use strict";
    angular.module('dashHotel')
        .component('hotelAdmin',{
            templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/manage_hotel_admin.template.html',
            controller:  ['$scope','$state','$mdDialog','Account', function ($scope,$state,$mdDialog,Account){
                $scope.stateIs = function () {
                    console.log($state.current.name);
                };
                $scope.addEdit = function () {
                    if($state.current.name == 'dashboard.manage_hotel'){
                        return true;
                    }
                    else {
                        return false;
                    }
                };

                $scope.viewHotel = function(ht){
                    console.log(ht);
                    $state.go('dashboard.manage_hotel.view_hotel.basic', {htName : ht.name});

                };

                $scope.editHotel = function (hotelData) {
                    $state.go('dashboard.manage_hotel.edit_hotel', {hotelName : hotelData.name});

                };


                $scope.confirmDelete =  function(ev , h) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title(h.name + ' will be deleted')
                        .textContent('All information with ' + h.name + 'will be erased')
                        .ariaLabel('Delete Hotel')
                        .targetEvent(ev)
                        .ok('Proceed')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function() {
                        Account.hotel.delete({id: h.id});
                        $scope.status = 'You decided to get rid of your debt.';
                    }, function() {
                        $scope.status = 'You decided to keep your debt.';
                    });
                };

            }]
        })
        .controller('viewHotelCtrl',['$scope','$rootScope','$state', function ($scope, $rootScope,$state) {
            $scope.currentNavItem = 'dashboard.manage_hotel.view_hotel.basic';

            $scope.reload = function(){
                $state.reload();
            };

            $scope.revOptions = [
                {
                    key: "One",
                    y: 5
                },
                {
                    key: "Two",
                    y: 2
                },
                {
                    key: "Three",
                    y: 9
                },
                {
                    key: "Four",
                    y: 7
                },
                {
                    key: "Five",
                    y: 4
                },
                {
                    key: "Six",
                    y: 3
                },
                {
                    key: "Seven",
                    y: .5
                }
            ];

            $scope.revData = {
                chart: {
                type: 'pieChart',
                height: 500,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                showLabels: true,
                duration: 500,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                legend: {
                    margin: {
                        top: 5,
                        right: 35,
                        bottom: 5,
                        left: 0
                    }
                }
            }}
        }])
        .controller('ChartCtrl', ['$scope','$http', function($scope,$http) {

            $http.get("/paybill_widget").then(function(data){
                $scope.data = {};
                console.log(data.data);
                $scope.data.configuration = data.data;
                $scope.data.WEconfiguration2 = angular.copy(data.data);
                $scope.data.callback = function(e){
                    console.log(e);
                };
            });


            $scope.options = {
                rowSelection: false,
                multiSelect: false,
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

            $scope.bookings = {
                "count": 9,
                "data": [
                    {
                        "id" : 1,
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
                        "id" : 2,
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
                        "id" : 3,
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
                        "id" : 4,
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
                        "id" : 5,
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
                        "id" : 6,
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

            $scope.myChartObject = {};

            $scope.myChartObject.type = "PieChart";

            $scope.onions = [
                {v: "Onions"},
                {v: 3},
            ];

            $scope.myChartObject.data = {"cols": [
                {id: "t", label: "Topping", type: "string"},
                {id: "s", label: "Slices", type: "number"}
            ], "rows": [
                {c: [
                    {v: "Mushrooms"},
                    {v: 3},
                ]},
                {c: $scope.onions},
                {c: [
                    {v: "Olives"},
                    {v: 31}
                ]},
                {c: [
                    {v: "Zucchini"},
                    {v: 1},
                ]},
                {c: [
                    {v: "Pepperoni"},
                    {v: 2},
                ]}
            ]};

            $scope.myChartObject.options = {
                'title': 'Booking by room types'
            };
    }]);


})();