<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('index');
});
Route::get('tester', function () {
    return view('login');
});
Route::get('token_show', function () {
    echo csrf_token();
});
Route::get('event_planners','EventPlanner\EventPlannerController@index');
Route::post('/loginUser','Backend\UserController@Apilogin');
//Route::get('login','Backend\UserController@login');
Route::get('logout','Backend\UserController@logout');
Route::get('email','Backend\UserController@email')->middleware('auth:api');

Route::post('saver','Backend\UserController@saver');
Route::get('profile','Backend\UserController@profile')->middleware('auth:api');

Route::get('/home', 'HomeController@index')->name('home');
Route::post('/login', 'Backend\LoginController@login');
Route::post('/signup', 'Backend\RegisterController@store');
Route::post('/vendorreg', 'Vendor\VendorCenterController@store');
Route::get('/hotels', 'Hotel\HotelController@index');
Route::post('/check', 'Backend\RegisterController@echeck');
Route::get('/account/verify/{code}', 'Backend\RegisterController@verify');
Route::get('/faker', 'Backend\RegisterController@create')->middleware('auth');
Route::get('/hotels/register', 'Hotel\HotelController@saveHotel');

//Route to get Account Type from DB whether Vendor, Event Planner
Route::get('/getAccountType', 'RootController@getAcctTypeRole');
//Route to get all users
Route::get('dashboard/users', 'RootController@getAllUsers');

Route::post('/hotels/register', 'Hotel\HotelController@saveHotel');

