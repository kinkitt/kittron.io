
    angular.module("dashSite")
        .controller('ManageSiteCtrl',['$scope','$http','Account', function ($scope, $http,Account) {

            $scope.vendorServices = [
                "Audiovisual",
                "Security Companies",
                "Giftware",
                "Interpretation ",
                "Photographer",
                "Musician",
                "Printers",
                "Destination Management Company",
                "Communications Consultant",
                "Stationery Designer",
                "Promotional Products Distributor",
                "Private Caterer",
                "Wine Shop Owner/Sommelier",
                "Florist",
                "Party Rental Supplier"
            ];

            $scope.items = [1,2,3,4,5];
            $scope.selected = [];
            $scope.toggle = function (item, list) {
                var idx = list.indexOf(item);
                if (idx > -1) {
                    list.splice(idx, 1);
                }
                else {
                    list.push(item);
                }
            };

            $scope.exists = function (item, list) {
                return list.indexOf(item) > -1;
            };

            $scope.isIndeterminate = function() {
                return ($scope.selected.length !== 0 &&
                $scope.selected.length !== $scope.items.length);
            };

            $scope.isChecked = function() {
                return $scope.selected.length === $scope.items.length;
            };

            $scope.toggleAll = function() {
                if ($scope.selected.length === $scope.items.length) {
                    $scope.selected = [];
                } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
                    $scope.selected = $scope.items.slice(0);
                }
            };
            $scope.rpi = function () {
                var formData = new FormData();
                angular.forEach($scope.resultImage,function(obj){
                    if(!obj.isRemote){
                        formData.append('photo', obj.lfFile);
                    }
                });

                Account.upload.resulpi(formData);
            };
            $scope.userType = function (x, y) {
               if(x == y){
                   return true;

               }
               else {
                   return false;
               }
            };

            $scope.full = false;
            $scope.bInfoUpdated = true;
            $scope.bInfo = {};
            $scope.checkType = function () {
                    $scope.full = !$scope.full;
                    if($scope.full){
                        $scope.bInfo.type2 =false;
                        $scope.bInfo.type3 =false;
                    }


            }

            $scope.sInfo = {};

            $scope.customEmail = function (x, y) {
                console.log(x);
                console.log(y);
                // return x + '.'+ x +'@kr.com';
                if(x == undefined || x == undefined){
                    // console.warn(data);
                    return '';
                }
                else{
                    var sname = $scope.sInfo.address;
                    var b_name =y;
                    b_name = b_name.replace(' ', '_');
                    b_name = angular.lowercase(b_name);
                    return sname + '.'+ b_name+'@kr.com';

                }
                // $http.get('http://kittron.com/email')
                //     .then(function (res) {
                //         console.log(res)
                //         var jjs =  res.data;
                //         return jjs;
                //
                //         // $scope.sInfo.custom_email = res.data;
                //     },function (err) {
                //         console.log(err)
                //     });





            };
            $scope.saveBinfo = function (valid, type) {
                if(valid){
                    $scope.bInfo.user_type = type.user_type;
                    $scope.bInfo.user_email = type.email;
                    Account.save.Binfo($scope.bInfo);
                    console.log($scope.bInfo);
                    // console.log(type);
                }
                else{
                    alert('Invalid form');
                }
            };
            $scope.saveSinfo = function (valid) {
                if(valid){
                    Account.site.store($scope.sInfo);
                    console.log($scope.sInfo);
                }
                else{
                    alert('Invalid form');
                }
            };
            $scope.saveOffer = function (valid) {
                if(valid){
                    Account.offer.store($scope.offer);
                    console.log($scope.offer);
                }
                else{
                    alert('Invalid form');
                }
            }



        }]);
