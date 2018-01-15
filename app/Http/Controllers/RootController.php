<?php

namespace kittron\Http\Controllers;

use Illuminate\Http\Request;
use kittron\Models\Role;
use kittron\Models\AccountType;
use kittron\User;
use Response;

class RootController extends Controller
{

	function getAcctTypeRole() {
		$type_role = array();

		$type_role['roles'] = Role::select('id', 'name')->orderBy('id', 'desc')->get();
		$type_role['account_type'] = AccountType::select('id', 'type')->orderBy('id', 'desc')->get();

        $response["TypeRoles"] = array();
        array_push($response["TypeRoles"], $type_role);

		return Response::json($response);
	}

	function getAllUsers() {
		$users_array = array();
		$users = User::orderBy('created_at', 'desc')->get();

		$response["Users"] = array();
		array_push($response["Users"], $users);
		return Response::json($response);
	}

}
