(function () {
    "use strict";
    angular.module('compModule')
        .factory('compService', ['$resource','krSettings',function ($resource,krSettings) {
            return {
                weather :
                    $resource(krSettings.weather,null,{
                        'forecast' : {
                            method : 'GET'
                        }
                    }
                )
            }
    }]);
})();