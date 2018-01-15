// (function () {
//     "use strict";
//
//     var dashboard_home = angular.module("dashHome");
//
//     dashboard_home.component('budgetTable',{
//                 templateUrl : 'ngf/account/dashboard/_dashboard_files/components/budget_table.template.html',
//                 controller:  function ($scope, $mdToast){
//                     $scope.nutritionList = [
//                         {
//                             id: 601,
//                             name: 'Frozen joghurt',
//                             calories: 159,
//                             fat: 6.0,
//                             carbs: 24,
//                             protein: 4.0,
//                             sodium: 87,
//                             calcium: '14%',
//                             iron: '1%'
//                         },
//                         {
//                             id: 602,
//                             name: 'Ice cream sandwitch',
//                             calories: 237,
//                             fat: 9.0,
//                             carbs: 37,
//                             protein: 4.3,
//                             sodium: 129,
//                             calcium: '84%',
//                             iron: '1%'
//                         },
//                         {
//                             id: 603,
//                             name: 'Eclair',
//                             calories: 262,
//                             fat: 16.0,
//                             carbs: 24,
//                             protein: 6.0,
//                             sodium: 337,
//                             calcium: '6%',
//                             iron: '7%'
//                         },
//                         {
//                             id: 604,
//                             name: 'Cupkake',
//                             calories: 305,
//                             fat: 3.7,
//                             carbs: 67,
//                             protein: 4.3,
//                             sodium: 413,
//                             calcium: '3%',
//                             iron: '8%'
//                         },
//                         {
//                             id: 605,
//                             name: 'Gingerbread',
//                             calories: 356,
//                             fat: 16.0,
//                             carbs: 49,
//                             protein: 2.9,
//                             sodium: 327,
//                             calcium: '7%',
//                             iron: '16%'
//                         },
//                         {
//                             id: 606,
//                             name: 'Jelly bean',
//                             calories: 375,
//                             fat: 0.0,
//                             carbs: 94,
//                             protein: 0.0,
//                             sodium: 50,
//                             calcium: '0%',
//                             iron: '0%'
//                         },
//                         {
//                             id: 607,
//                             name: 'Lollipop',
//                             calories: 392,
//                             fat: 0.2,
//                             carbs: 98,
//                             protein: 0,
//                             sodium: 38,
//                             calcium: '0%',
//                             iron: '2%'
//                         },
//                         {
//                             id: 608,
//                             name: 'Honeycomb',
//                             calories: 408,
//                             fat: 3.2,
//                             carbs: 87,
//                             protein: 6.5,
//                             sodium: 562,
//                             calcium: '0%',
//                             iron: '45%'
//                         },
//                         {
//                             id: 609,
//                             name: 'Donut',
//                             calories: 452,
//                             fat: 25.0,
//                             carbs: 51,
//                             protein: 4.9,
//                             sodium: 326,
//                             calcium: '2%',
//                             iron: '22%'
//                         },
//                         {
//                             id: 610,
//                             name: 'KitKat',
//                             calories: 518,
//                             fat: 26.0,
//                             carbs: 65,
//                             protein: 7,
//                             sodium: 54,
//                             calcium: '12%',
//                             iron: '6%'
//                         }
//                     ];
//             }
//         });
//
// })();
//
// angular.module("dashHome").controller('ExampleController2', function($scope, $mdEditDialog,$timeout){
//
//     $scope.options = {
//         rowSelection: true,
//         multiSelect: true,
//         autoSelect: true,
//         decapitate: false,
//         largeEditDialog: false,
//         boundaryLinks: false,
//         limitSelect: true,
//         pageSelect: true
//     };
//
//     $scope.selected = [];
//     $scope.limitOptions = [5, 10, 15, {
//         label: 'All',
//         value: function () {
//             return $scope.desserts ? $scope.desserts.count : 0;
//         }
//     }];
//
//     $scope.query = {
//         order: 'name',
//         limit: 5,
//         page: 1
//     };
//
//     // for testing ngRepeat
//     $scope.columns = [{
//         name: 'Dessert',
//         orderBy: 'name',
//         unit: '100g serving'
//     }, {
//         descendFirst: true,
//         name: 'Type',
//         orderBy: 'type'
//     }, {
//         name: 'Calories',
//         numeric: true,
//         orderBy: 'calories.value'
//     }, {
//         name: 'Fat',
//         numeric: true,
//         orderBy: 'fat.value',
//         unit: 'g'
//     }, /* {
//      name: 'Carbs',
//      numeric: true,
//      orderBy: 'carbs.value',
//      unit: 'g'
//      }, */ {
//         name: 'Protein',
//         numeric: true,
//         orderBy: 'protein.value',
//         trim: true,
//         unit: 'g'
//     }, /* {
//      name: 'Sodium',
//      numeric: true,
//      orderBy: 'sodium.value',
//      unit: 'mg'
//      }, {
//      name: 'Calcium',
//      numeric: true,
//      orderBy: 'calcium.value',
//      unit: '%'
//      }, */ {
//         name: 'Iron',
//         numeric: true,
//         orderBy: 'iron.value',
//         unit: '%'
//     }, {
//         name: 'Comments',
//         orderBy: 'comment'
//     }];
//
//     $scope.desserts = {
//         "count": 9,
//         "data": [
//             {
//                 "name": "Frozen yogurt",
//                 "type": "Ice cream",
//                 "calories": { "value": 159.0 },
//                 "fat": { "value": 6.0 },
//                 "carbs": { "value": 24.0 },
//                 "protein": { "value": 4.0 },
//                 "sodium": { "value": 87.0 },
//                 "calcium": { "value": 14.0 },
//                 "iron": { "value": 1.0 },
//                 "comment": "Not as good as the real thing."
//             }, {
//                 "name": "Ice cream sandwich",
//                 "type": "Ice cream",
//                 "calories": { "value": 237.0 },
//                 "fat": { "value": 9.0 },
//                 "carbs": { "value": 37.0 },
//                 "protein": { "value": 4.3 },
//                 "sodium": { "value": 129.0 },
//                 "calcium": { "value": 8.0 },
//                 "iron": { "value": 1.0 }
//             }, {
//                 "name": "Eclair",
//                 "type": "Pastry",
//                 "calories": { "value":  262.0 },
//                 "fat": { "value": 16.0 },
//                 "carbs": { "value": 24.0 },
//                 "protein": { "value":  6.0 },
//                 "sodium": { "value": 337.0 },
//                 "calcium": { "value":  6.0 },
//                 "iron": { "value": 7.0 }
//             }, {
//                 "name": "Cupcake",
//                 "type": "Pastry",
//                 "calories": { "value":  305.0 },
//                 "fat": { "value": 3.7 },
//                 "carbs": { "value": 67.0 },
//                 "protein": { "value": 4.3 },
//                 "sodium": { "value": 413.0 },
//                 "calcium": { "value": 3.0 },
//                 "iron": { "value": 8.0 }
//             }, {
//                 "name": "Jelly bean",
//                 "type": "Candy",
//                 "calories": { "value":  375.0 },
//                 "fat": { "value": 0.0 },
//                 "carbs": { "value": 94.0 },
//                 "protein": { "value": 0.0 },
//                 "sodium": { "value": 50.0 },
//                 "calcium": { "value": 0.0 },
//                 "iron": { "value": 0.0 }
//             }, {
//                 "name": "Lollipop",
//                 "type": "Candy",
//                 "calories": { "value": 392.0 },
//                 "fat": { "value": 0.2 },
//                 "carbs": { "value": 98.0 },
//                 "protein": { "value": 0.0 },
//                 "sodium": { "value": 38.0 },
//                 "calcium": { "value": 0.0 },
//                 "iron": { "value": 2.0 }
//             }, {
//                 "name": "Honeycomb",
//                 "type": "Other",
//                 "calories": { "value": 408.0 },
//                 "fat": { "value": 3.2 },
//                 "carbs": { "value": 87.0 },
//                 "protein": { "value": 6.5 },
//                 "sodium": { "value": 562.0 },
//                 "calcium": { "value": 0.0 },
//                 "iron": { "value": 45.0 }
//             }, {
//                 "name": "Donut",
//                 "type": "Pastry",
//                 "calories": { "value": 452.0 },
//                 "fat": { "value": 25.0 },
//                 "carbs": { "value": 51.0 },
//                 "protein": { "value": 4.9 },
//                 "sodium": { "value": 326.0 },
//                 "calcium": { "value": 2.0 },
//                 "iron": { "value": 22.0 }
//             }, {
//                 "name": "KitKat",
//                 "type": "Candy",
//                 "calories": { "value": 518.0 },
//                 "fat": { "value": 26.0 },
//                 "carbs": { "value": 65.0 },
//                 "protein": { "value": 7.0 },
//                 "sodium": { "value": 54.0 },
//                 "calcium": { "value": 12.0 },
//                 "iron": { "value": 6.0 }
//             }
//         ]
//     };
//
//
//     // $http.get('desserts.json').then(function (desserts) {
//     //     $scope.desserts = desserts.data;
//     //
//     //     // $scope.selected.push($scope.desserts.data[1]);
//     //
//     //     // $scope.selected.push({
//     //     //   name: 'Ice cream sandwich',
//     //     //   type: 'Ice cream',
//     //     //   calories: { value: 237.0 },
//     //     //   fat: { value: 9.0 },
//     //     //   carbs: { value: 37.0 },
//     //     //   protein: { value: 4.3 },
//     //     //   sodium: { value: 129.0 },
//     //     //   calcium: { value: 8.0 },
//     //     //   iron: { value: 1.0 }
//     //     // });
//     //
//     //     // $scope.selected.push({
//     //     //   name: 'Eclair',
//     //     //   type: 'Pastry',
//     //     //   calories: { value:  262.0 },
//     //     //   fat: { value: 16.0 },
//     //     //   carbs: { value: 24.0 },
//     //     //   protein: { value:  6.0 },
//     //     //   sodium: { value: 337.0 },
//     //     //   calcium: { value:  6.0 },
//     //     //   iron: { value: 7.0 }
//     //     // });
//     //
//     //     // $scope.promise = $timeout(function () {
//     //     //   $scope.desserts = desserts.data;
//     //     // }, 1000);
//     // });
//
//     $scope.editComment = function (event, dessert) {
//         event.stopPropagation();
//
//         var dialog = {
//             // messages: {
//             //   test: 'I don\'t like tests!'
//             // },
//             modelValue: dessert.comment,
//             placeholder: 'Add a comment',
//             save: function (input) {
//                 dessert.comment = input.$modelValue;
//             },
//             targetEvent: event,
//             title: 'Add a comment',
//             validators: {
//                 'md-maxlength': 30
//             }
//         };
//
//         var promise = $scope.options.largeEditDialog ? $mdEditDialog.large(dialog) : $mdEditDialog.small(dialog);
//
//         promise.then(function (ctrl) {
//             var input = ctrl.getInput();
//
//             input.$viewChangeListeners.push(function () {
//                 input.$setValidity('test', input.$modelValue !== 'test');
//             });
//         });
//     };
//
//     $scope.toggleLimitOptions = function () {
//         $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
//     };
//
//     $scope.getTypes = function () {
//         return ['Candy', 'Ice cream', 'Other', 'Pastry'];
//     };
//
//     $scope.onPaginate = function(page, limit) {
//         console.log('Scope Page: ' + $scope.query.page + ' Scope Limit: ' + $scope.query.limit);
//         console.log('Page: ' + page + ' Limit: ' + limit);
//
//         $scope.promise = $timeout(function () {
//
//         }, 2000);
//     };
//
//     $scope.deselect = function (item) {
//         console.log(item.name, 'was deselected');
//     };
//
//     $scope.log = function (item) {
//         console.log(item.name, 'was selected');
//     };
//
//     $scope.loadStuff = function () {
//         $scope.promise = $timeout(function () {
//
//         }, 2000);
//     };
//
//     $scope.onReorder = function(order) {
//
//         console.log('Scope Order: ' + $scope.query.order);
//         console.log('Order: ' + order);
//
//         $scope.promise = $timeout(function () {
//
//         }, 2000);
//     };
// });
