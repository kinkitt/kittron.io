(function () {
    "use strict";
    
       var eventPModule = angular.module('eventPlannerModule');
    eventPModule.component('eventPlanner', {
            templateUrl: 'ngf/event_planner/event_planner.template.html',
            controller: ['$scope','$state', function($scope, $state) {
                $scope.find_event_planner = function(){
                	$state.go('event_planners_query');
                };

            }]
        });


    eventPModule.component('eventPlannerResult',{
        	templateUrl:'ngf/event_planner/event_planner_result.template.html',
        	controller: ['$scope','orderByFilter', function($scope, orderBy){

        	}]
        });
}());