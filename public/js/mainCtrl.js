
angular.module('kittron')
    .controller('MainCtrl',['$scope','$state',MainCtrl]);

function MainCtrl($scope,$state) {
		$scope.showMenu = false;
		var menu = angular.element('.menu');
    $scope.menuToggle = function(){
    	$scope.showMenu = !$scope.showMenu;
        // if($scope.showMenu){
        //     menu.addClass('show_menu magictime puffIn');
        //
        // }else {
        //     menu.addClass('magictime puffOut');
        //     menu.removeClass('show_menu magictime puffIn');
        //
        // }
    	
    	
    };
    $scope.goto = function(s){
        $scope.menuToggle();
    	$state.go(s);
    	
    };
}