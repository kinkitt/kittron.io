(function () {
	"use strict";
	angular
		.module('homeModule')
        .component('homePage', {
            templateUrl: 'ngf/home/home.template.html',
            controller: ['$scope',function($scope) {
                $scope.board = [{
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
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
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
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
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
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
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
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
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
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
			"Breakfast",
			"Restaurant",
			"Local Bar",
			"Kitchen",
			"Smoking Room"
		]
	}
	];

                $scope.show_on_map =function (geo) {
                    console.log(geo);
                }
            }]
        });
}());