<?php

namespace kittron\Http\Controllers\Backend;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use kittron\Http\Controllers\Controller;
use \kittron\Http\Requests\LoginRequest;
use kittron\User;
use phpDocumentor\Reflection\Types\Null_;

class LoginController extends Controller
{
    //
    public function login(Request $request)
    {
        $req = $request->input();
        $reqEmail = $req['email'];
        $reqPwd = $req['password'];


        $user = User::where('email', $reqEmail)->first();
//
        //dd($user);
        if($user){

            if($user->verified == Null){
                abort(401);
            }
                if(Auth::attempt(['email'=> $reqEmail, 'password' => $reqPwd, 'verified' => 1])){

                    $res = $this->loginGatway('password',$reqEmail, $reqPwd);
                    return response()->json($res, 200);
                }
        }else{
           return response()->json('No result for the credentials given', 403);
        }

    }

    private function loginGatway($gType, $e, $p)
    {
        $http = new Client();
        $res = $http->post('http://kittron.com/oauth/token',[
            'form_params' => [
                'grant_type' => 'password',
                'client_id' => '1',
                'client_secret' =>  'H0Vq1EOmuHiaQqHoqONNYotqhUJ3OWFedpmP83ts',
                'username' => $e,
                'password' => $p,
//                'scope' => '',
            ]
        ]);
        return \GuzzleHttp\json_decode( $res->getBody(), true);
    }    

}
