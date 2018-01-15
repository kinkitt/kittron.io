(function () {
    "use strict";
    angular.module('krSet', [])
        .factory('krSettings', function () {
            var base = 'http://kittron.com/';
        return{
            login : base + 'login',
            signUp : base + 'signUp',
            weather : base + 'weather',
            user_profile : base + 'profile',
            site : base + 'api/site',
            offer : base + 'api/offer',
            save : base + 'api/partners',
            upload : base + 'api/upload',
            users : base + 'api/users/'
            // upload : base + 'api/upload'
        }
    });

})();