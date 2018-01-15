
angular.module('hotelModule')
    .controller('HotelResultCtrl',['$scope','orderByFilter','$mdSidenav','$http',HotelResultCtrl]);

function HotelResultCtrl($scope,orderBy,$mdSidenav,$http) {

    $scope.showAll = true;
    $scope.toggleFilter = function () {
        $mdSidenav('right')
            .toggle();
    };
    $scope.checkChange = function() {
        for(t in $scope.facilities){
            if($scope.facilities[t].on){
                $scope.showAll = false;
                return;
            }
        }
        $scope.showAll = true;
    };

    $scope.myFunc = function(a) {
        if($scope.showAll) { return true; }

        var sel = false;

        for(tech in $scope.facilities){
            var t = $scope.facilities[tech];
            console.log(t);
            if(t.on){
                if(a.facility.indexOf(t.name) == -1){
                    return false;
                }else{
                    sel = true;
                }
            }
        }
        return sel;
    };


    $scope.price_trending_up = true;
    $scope.rating_trending_up = true;
    $scope.hasFacicility = function(bf,f){
        if(bf.lastIndexOf(f) !== -1){
            return true;
        }

        else{
            return false;

        }
    };



    $scope.facilities = [
        {name:"Free cancellation", icon:"backspace", on: false},
        {name:"wifi", icon:"wifi", on: false},
        {name:"Shuttle", icon:"airport_shuttle", on: false},
        {name:"Pool", icon:"pool", on: false},
        {name:"Air conditioned", icon:"ac_unit", on: false},
        {name:"Room Service",  icon:"room_service", on: false},
        {name:"Breakfast", icon:"free_breakfast", on: false},
        {name:"Restaurant", icon:"restaurant", on: false},
        {name:"Local Bar", icon:"local_bar", on: false},
        {name:"Bath Tub", icon:"hot_tub",on: false},
        {name:"Kitchen", icon:"kitchen", on: false},
        {name:"Gym", icon:"fitness_center", on: false},
        {name:"Spa", icon:"spa", on: false},
        {name:"Smoking Room", icon:"smoking_rooms", on: false},
        {name:"Smoke Free", icon:"smoke_free", on: false}
    ];

    var link = 'http://projects.dev/ki/public/hotels';
    $http.get(link).then(function (res) {
        $scope.hotels = res.data;
        $scope.board = $scope.hotels;

    });

    // var board = $scope.hotels;
    // console.log(board);

    // var board = [
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Free cancellation",
    //             "Shuttle",
    //             "Air conditioned",
    //             "Breakfast",
    //             "Restaurant",
    //             "Local Bar",
    //             "Kitchen",
    //             "Smoking Room"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Spa",
    //             "pool",
    //             "Bath Tub",
    //             "Room Service",
    //             "Breakfast",
    //             "Restaurant",
    //             "Local Bar",
    //             "Smoke Free",
    //             "Smoking Room"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Gym",
    //             "pool",
    //             "Air conditioned",
    //             "Room Service",
    //             "Bath Tub",
    //             "Restaurant",
    //             "Local Bar",
    //             "Spa",
    //             "Smoking Room"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //
    //             "Shuttle"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Free cancellation",
    //             "wifi",
    //             "Shuttle",
    //             "pool",
    //             "Air conditioned",
    //             "Room Service",
    //             "Bath Tub",
    //             "Breakfast",
    //             "Restaurant",
    //             "Local Bar",
    //             "Kitchen",
    //             "Smoking Room"
    //         ]
    //     }
    // ];

    $scope.priceMin = 5;
    $scope.propertyName = 'price';
    $scope.reverse = true;
    $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);

    $scope.sortRating = function(propName){
        $scope.rating_trending_up = !$scope.rating_trending_up;
        $scope.propertyName = propName;
        if($scope.rating_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }


    };
    $scope.sortPrice = function(propName){
        $scope.price_trending_up = !$scope.price_trending_up;
        $scope.propertyName = propName;
        if($scope.price_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }

    };



    $scope.show_on_map =function (geo) {
        console.log(geo);
    }


}