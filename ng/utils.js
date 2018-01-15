(function () {
    "use strict";
    angular.module('kittron')
        .factory('Utils',['$http', function ($http) {
            return {
                event_planners : function () {
                    $http.get('')
                }
            }
        }])


})();