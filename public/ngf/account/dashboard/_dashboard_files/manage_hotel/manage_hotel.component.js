(function () {
    "use strict";
    angular.module('dashHotel')
            .component('manageHotel',{
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/manage_hotel.template.html',
                controller:  ['$scope', function ($scope){
                    $scope.getter = 'Hotel';
            }]
        });
})();

/*

    Manage Hotel -> Add Hotel Controller

 */
(function () {
    "use strict";
    angular.module('dashHotel')
        .controller('addHotelCtrl',['$scope', function ($scope) {
            $scope.new_hotel = [];
            $scope.new_hotel.fac = [
                {
                name : '24hr front desk',
                free : false,
                charge : false
                },{
                name : 'Wifi',
                free : false,
                charge : false
                },{
                name : 'Garden',
                free : false,
                charge : false
                },{
                name : 'Terrace',
                free : false,
                charge : false
                },{
                name : 'Fireplace',
                free : false,
                charge : false
                },{
                name : 'Lounge',
                free : false,
                charge : false
                },{
                name : 'Valet Parking',
                free : false,
                charge : false
                },{
                name : 'Parking security/surveillance',
                free : false,
                charge : false
                },{
                name : 'Parking on site',
                free : false,
                charge : false
                },{
                name : 'Parking nearby',
                free : false,
                charge : false
                },{
                name : 'Spa',
                free : false,
                charge : false
                },{
                name : 'Air conditioning',
                free : false,
                charge : false
                },{
                name : 'Airport Shuttle',
                free : false,
                charge : false
                },{
                name : 'Restaurant',
                free : false,
                charge : false
                },{
                name : 'Bar',
                free : false,
                charge : false
                },{
                name : 'Indoor pool',
                free : false,
                charge : false
                },{
                name : 'Outdoor pool',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                },{
                name : 'Steam room',
                free : false,
                charge : false
                },{
                name : 'Elevator/lift',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                },{
                name : 'Elevator/lift',
                free : false,
                charge : false
                },{
                name : 'CCTV camera security',
                free : false,
                charge : false
                },{
                name : 'Security guard',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                },{
                name : 'Shared kitchen',
                free : false,
                charge : false
                },{
                name : 'Outdoor dining',
                free : false,
                charge : false
                },{
                name : 'Casino',
                free : false,
                charge : false
                },{
                name : 'Money exchange',
                free : false,
                charge : false
                },{
                name : 'ATM machine',
                free : false,
                charge : false
                },{
                name : 'Soundproofed rooms',
                free : false,
                charge : false
                },{
                name : 'Family rooms',
                free : false,
                charge : false
                },{
                name : 'Pets allowed',
                free : false,
                charge : false
                },{
                name : 'Rooms/facilities for disabled guests',
                free : false,
                charge : false
                },{
                name : 'City shuttle',
                free : false,
                charge : false
                },{
                name : 'Electronic room key',
                free : false,
                charge : false
                },{
                name : 'Meeting/banquet facilities',
                free : false,
                charge : false
                },{
                name : 'Buffet breakfast',
                free : false,
                charge : false
                },{
                name : 'Breakfast',
                free : false,
                charge : false
                },{
                name : 'Babysitting',
                free : false,
                charge : false
                },{
                name : 'Laundry',
                free : false,
                charge : false
                },{
                name : 'Car hire',
                free : false,
                charge : false
                },{
                name : 'Room service 24hr',
                free : false,
                charge : false
                },{
                name : 'Room service limited hours',
                free : false,
                charge : false
                },{
                name : 'Dry cleaning',
                free : false,
                charge : false
                },{
                name : 'Business center',
                free : false,
                charge : false
                },{
                name : 'Fax',
                free : false,
                charge : false
                },{
                name : 'Concierge service',
                free : false,
                charge : false
                },{
                name : 'Photocopy',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                }
            ];
            $scope.new_hotel.roomAni = [
                {
                name : 'Air conditioning',
                free : false,
                charge : false
                },{
                name : 'Toilet',
                free : false,
                charge : false
                },{
                name : 'Shower',
                free : false,
                charge : false
                },{
                name : 'Bath',
                free : false,
                charge : false
                },{
                name : 'Wardrobe/Closet',
                free : false,
                charge : false
                },{
                name : 'Flatscreen TV',
                free : false,
                charge : false
                },{
                name : 'Non-flatscreen TV',
                free : false,
                charge : false
                },{
                name : 'Satellite/cable TV service',
                free : false,
                charge : false
                },{
                name : 'Tea/Coffee making facilities',
                free : false,
                charge : false
                },{
                name : 'Hairdryer',
                free : false,
                charge : false
                },{
                name : 'Telephone',
                free : false,
                charge : false
                },{
                name : 'Fridge',
                free : false,
                charge : false
                },{
                name : 'Mini-bar',
                free : false,
                charge : false
                },{
                name : 'Radio',
                free : false,
                charge : false
                },{
                name : 'Wake up call/alarm clock',
                free : false,
                charge : false
                },{
                name : 'Mosquito net',
                free : false,
                charge : false
                },{
                name : 'Toiletries',
                free : false,
                charge : false
                },{
                name : 'Terrace/garden',
                free : false,
                charge : false
                },{
                name : 'Balcony',
                free : false,
                charge : false
                },{
                name : 'Additional bed',
                free : false,
                charge : false
                },{
                name : 'Crib/cot',
                free : false,
                charge : false
                }
            ];
            var date = new Date();
            $scope.yearCons = {};
            $scope.yearCons.minDate = new Date(
                date.getFullYear() -99,
                date.getMonth(),
                date.getDate()
            );
            $scope.yearCons.maxDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            $scope.saveNewHotel = function () {
                console.log($scope.new_hotel);
            };
            $scope.sizeChecked = function () {
              console.log('check clicked');
            };


        }]);
})();

/*

    All Hotels Controller

 */
(function () {
    "use strict";
    angular.module('dashHotel')
        .controller('allHotelCtrl',['$scope','$state', function ($scope,$state) {

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

            $scope.sel_hotel = [];
            // $scope.editHotel = function (hotelData) {
            //     $state.go('dashboard.manage_hotel.edit_hotel', {hotelName : hotelData.name});
            //
            // };
            $scope.hotels = {
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

        }]);
})();


/*

    Edit Hotel Controller

 */
(function () {
    "use strict";
    angular.module('dashHotel')
        .controller('editHotelCtrl',['$scope', function ($scope) {
            $scope.new_hotel = [];
            $scope.new_hotel.fac = [
                {
                    name : '24hr front desk',
                    free : false,
                    charge : false
                },{
                    name : 'Wifi',
                    free : false,
                    charge : false
                },{
                    name : 'Garden',
                    free : false,
                    charge : false
                },{
                    name : 'Terrace',
                    free : false,
                    charge : false
                },{
                    name : 'Fireplace',
                    free : false,
                    charge : false
                },{
                    name : 'Lounge',
                    free : false,
                    charge : false
                },{
                    name : 'Valet Parking',
                    free : false,
                    charge : false
                },{
                    name : 'Parking security/surveillance',
                    free : false,
                    charge : false
                },{
                    name : 'Parking on site',
                    free : false,
                    charge : false
                },{
                    name : 'Parking nearby',
                    free : false,
                    charge : false
                },{
                    name : 'Spa',
                    free : false,
                    charge : false
                },{
                    name : 'Air conditioning',
                    free : false,
                    charge : false
                },{
                    name : 'Airport Shuttle',
                    free : false,
                    charge : false
                },{
                    name : 'Restaurant',
                    free : false,
                    charge : false
                },{
                    name : 'Bar',
                    free : false,
                    charge : false
                },{
                    name : 'Indoor pool',
                    free : false,
                    charge : false
                },{
                    name : 'Outdoor pool',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                },{
                    name : 'Steam room',
                    free : false,
                    charge : false
                },{
                    name : 'Elevator/lift',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                },{
                    name : 'Elevator/lift',
                    free : false,
                    charge : false
                },{
                    name : 'CCTV camera security',
                    free : false,
                    charge : false
                },{
                    name : 'Security guard',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                },{
                    name : 'Shared kitchen',
                    free : false,
                    charge : false
                },{
                    name : 'Outdoor dining',
                    free : false,
                    charge : false
                },{
                    name : 'Casino',
                    free : false,
                    charge : false
                },{
                    name : 'Money exchange',
                    free : false,
                    charge : false
                },{
                    name : 'ATM machine',
                    free : false,
                    charge : false
                },{
                    name : 'Soundproofed rooms',
                    free : false,
                    charge : false
                },{
                    name : 'Family rooms',
                    free : false,
                    charge : false
                },{
                    name : 'Pets allowed',
                    free : false,
                    charge : false
                },{
                    name : 'Rooms/facilities for disabled guests',
                    free : false,
                    charge : false
                },{
                    name : 'City shuttle',
                    free : false,
                    charge : false
                },{
                    name : 'Electronic room key',
                    free : false,
                    charge : false
                },{
                    name : 'Meeting/banquet facilities',
                    free : false,
                    charge : false
                },{
                    name : 'Buffet breakfast',
                    free : false,
                    charge : false
                },{
                    name : 'Breakfast',
                    free : false,
                    charge : false
                },{
                    name : 'Babysitting',
                    free : false,
                    charge : false
                },{
                    name : 'Laundry',
                    free : false,
                    charge : false
                },{
                    name : 'Car hire',
                    free : false,
                    charge : false
                },{
                    name : 'Room service 24hr',
                    free : false,
                    charge : false
                },{
                    name : 'Room service limited hours',
                    free : false,
                    charge : false
                },{
                    name : 'Dry cleaning',
                    free : false,
                    charge : false
                },{
                    name : 'Business center',
                    free : false,
                    charge : false
                },{
                    name : 'Fax',
                    free : false,
                    charge : false
                },{
                    name : 'Concierge service',
                    free : false,
                    charge : false
                },{
                    name : 'Photocopy',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                }
            ];
            $scope.new_hotel.roomAni = [
                {
                    name : 'Air conditioning',
                    free : false,
                    charge : false
                },{
                    name : 'Toilet',
                    free : false,
                    charge : false
                },{
                    name : 'Shower',
                    free : false,
                    charge : false
                },{
                    name : 'Bath',
                    free : false,
                    charge : false
                },{
                    name : 'Wardrobe/Closet',
                    free : false,
                    charge : false
                },{
                    name : 'Flatscreen TV',
                    free : false,
                    charge : false
                },{
                    name : 'Non-flatscreen TV',
                    free : false,
                    charge : false
                },{
                    name : 'Satellite/cable TV service',
                    free : false,
                    charge : false
                },{
                    name : 'Tea/Coffee making facilities',
                    free : false,
                    charge : false
                },{
                    name : 'Hairdryer',
                    free : false,
                    charge : false
                },{
                    name : 'Telephone',
                    free : false,
                    charge : false
                },{
                    name : 'Fridge',
                    free : false,
                    charge : false
                },{
                    name : 'Mini-bar',
                    free : false,
                    charge : false
                },{
                    name : 'Radio',
                    free : false,
                    charge : false
                },{
                    name : 'Wake up call/alarm clock',
                    free : false,
                    charge : false
                },{
                    name : 'Mosquito net',
                    free : false,
                    charge : false
                },{
                    name : 'Toiletries',
                    free : false,
                    charge : false
                },{
                    name : 'Terrace/garden',
                    free : false,
                    charge : false
                },{
                    name : 'Balcony',
                    free : false,
                    charge : false
                },{
                    name : 'Additional bed',
                    free : false,
                    charge : false
                },{
                    name : 'Crib/cot',
                    free : false,
                    charge : false
                }
            ];
            var date = new Date();
            $scope.yearCons = {};
            $scope.yearCons.minDate = new Date(
                date.getFullYear() -99,
                date.getMonth(),
                date.getDate()
            );
            $scope.yearCons.maxDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            $scope.saveNewHotel = function () {
                console.log($scope.new_hotel);
            };
            $scope.sizeChecked = function () {
                console.log('check clicked');
            };


        }]);
})();