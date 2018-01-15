
angular.module('eventCenterModule')
    .controller('EventResultCtrl',['$scope','orderByFilter','$mdSidenav',EventResultCtrl]);

function EventResultCtrl($scope,orderBy,$mdSidenav) {

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
        {name:"Aquarium/Zoo", icon:"backspace", on: false},
        {name:"Arena/Stadium", icon:"wifi", on: false},
        {name:"Banquet Facility", icon:"airport_shuttle", on: false},
        {name:"Bar/Club", icon:"pool", on: false},
        {name:"Corporate Office Space", icon:"ac_unit", on: false},
        {name:"Educational Facility",  icon:"room_service", on: false},
        {name:"Exposition Center",  icon:"room_service", on: false},
        {name:"Entertainment Venue", icon:"free_breakfast", on: false},
        {name:"Gallery/Museum", icon:"restaurant", on: false},
        {name:"Golf Course", icon:"local_bar", on: false},
        {name:"Movie Theater", icon:"hot_tub",on: false},
        {name:"Convention Center", icon:"kitchen", on: false},
        {name:"Convention & Visitors Bureau (CVB)", icon:"fitness_center", on: false},
        {name:"Restaurant", icon:"spa", on: false},
        {name:"Conference Center", icon:"smoking_rooms", on: false},
        {name:"Smoke Free", icon:"smoke_free", on: false}
    ];


    var board = [
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "Shuttle",
                "Air conditioned",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Spa",
                "pool",
                "Bath Tub",
                "Room Service",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Smoke Free",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Gym",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Restaurant",
                "Local Bar",
                "Spa",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [

                "Shuttle"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "wifi",
                "Shuttle",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        }
    ];

    $scope.priceMin = 5;
    $scope.propertyName = 'price';
    $scope.reverse = true;
    $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);

    $scope.sortRating = function(propName){
        $scope.rating_trending_up = !$scope.rating_trending_up;
        $scope.propertyName = propName;
        if($scope.rating_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }


    };
    $scope.sortPrice = function(propName){
        $scope.price_trending_up = !$scope.price_trending_up;
        $scope.propertyName = propName;
        if($scope.price_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }

    };



    $scope.show_on_map =function (geo) {
        console.log(geo);
    }


}