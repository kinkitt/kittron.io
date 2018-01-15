(function () {
    "use strict";
    angular.module('krSer', ['ngResource','krSet','satellizer'])
        .factory('Account', ['$resource','krSettings','$http', function ($resource,krSettings,$http) {
            return{
            custom :  {
                email: $http.get('http://kittron.com/email')
                    .then(function (res) {
                       // console.log(res);
                        return res;
                    },function (err) {
                        console.log(err);
                    })
            },
            auth :
                $resource(krSettings.login,null,{
                    'login' : {method : 'POST'}}
                    ),
            user :
                $resource(krSettings.user_profile,null,{
                    'profile' : {
                        method : 'GET'
                        // isArray : true
                    }
                }
                    ),
            signUp : $resource('http://kittron.com/email',null,{
                'email' : {
                    method : 'GET'
                }
            }),
            site : $resource(krSettings.site,null,{
                'detail' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'create' : {

                }
            }),

            user_del : $resource(krSettings.users+':id',null,{
                'act' : {
                    method :  'DELETE'
                }
            }),
            user_get : $resource(krSettings.users+':id',null,{
                'act' : {
                    method :  'GET'
                }
            }),
            users : $resource(krSettings.users,null,{
                'all' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'destory' : {
                    method :  'DELETE'
                }
            }),
            offer  : $resource(krSettings.offer ,null,{
                'detail' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'delete' : {

                }
            }),
            hotel  : $resource(krSettings.offer ,null,{
                'detail' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'delete' : {
                    method : 'DELETE'
                }
            }),
            save :
                $resource(krSettings.save,null,{
                    'Binfo' : {
                        method : 'POST',
                        params : {
                            p : 'business'
                        }
                    },
                    'Sinfo' : {
                        method : 'POST',
                        params : {
                            p : 'site'
                        }
                    }
                }
                ),
            upload : $resource(krSettings.upload,null,{
                'resulpi' : {
                    method : 'POST',
                    headers: {'content-Type': undefined},
                    transformRequest: angular.identity
                },
                'gallery' : {
                    method : 'POST'
                }

            }),

            logout : function () {

            },
            profile : function () {

            }
        }
    }]);

})();