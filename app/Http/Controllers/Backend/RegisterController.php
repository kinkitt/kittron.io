<?php

namespace kittron\Http\Controllers\Backend;

use Carbon\Carbon;
use GuzzleHttp\Psr7\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use kittron\Http\Controllers\Controller;
use Faker\Generator;
use kittron\Mail\RegistrationMail;
use kittron\Partners\Business;
use kittron\Partners\Site;
use kittron\User;
use \kittron\Partners\Offers;
use \kittron\Partners\Location;
use \kittron\Partners\File;
use \kittron\Partners\Facility;
use phpseclib\Crypt\Hash;
use Illuminate\Support\Facades\Crypt;
use kittron\Http\Requests\StoreUserRequest;
use Spatie\UrlSigner\Laravel\UrlSignerFacade as UrlSigner;

class RegisterController extends Controller
{
    public function __construct(User $user)
    {
        $this->users = $user;
    }    
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, \Faker\Generator $faker)
    {
        //
        $req =$request->input();
        $user_type = $req['type'];;
        $user_id = $faker->ean8;
        $site_id = $faker->ean8;
        $business_id = $faker->ean8;
        $facility_id = $faker->ean8;
        $file_id = $faker->ean8;
        $offer_id = $faker->ean8;
        $location_id = $faker->ean8;

        $verification_code = $faker->sha256;
        $first_name = $req['first_name'];
        $email = $req['email'];

        $mailData = [
            $verification_code,
            $first_name,
            $email
        ];

        $User = new User;
        $User->id = $user_id;
        $User->first_name = $req['first_name'];
        $User->last_name = $req['last_name'];
        $User->email = $req['email'];
        $User->password = \Illuminate\Support\Facades\Hash::make($req['password']);
        $User->contact_number = $req['number'];
        $User->user_type= $req['type'];
        $User->dob = $req['dob'];
        $User->gender = $req['gender'];
        $User->country = $req['country'];
        $User->state = $req['state'];
        $User->verification_code = $verification_code;

        $User->save();
        switch ($user_type){
            case 'Event Planner':
               $Site = new Site;
               $Facility= new Facility;
               $Files = new File;
               $Offers = new Offers;
               $Location = new Location;
               $Business  = new Business;

               $Site->id = $site_id;
               $Site->save();

                $Facility->id = $facility_id;
                $Facility->save();

                $Files->id = $file_id;
                $Files->save();

                $Offers->id = $offer_id;
                $Offers->save();

                $Location->id = $location_id;
                $Location->save();

                $Business->id = $business_id;
                $Business->save();
                break;
        }
        
        $signed_url = UrlSigner::sign($verification_code, Carbon::now()->addHours(2));

        $url = 'http://kittron.com/#!/verify/'.$signed_url;

        $message = "Hi $first_name please click on this link or copy and paste to your browser to verify
         $url your account and complete registration";
        Log::info($message);

//        Mail::to('email.verify', $mailData, function($mailData){
//            $message->to($mailData['email'], $mailData['first_name'])
//                ->subject('Verify your email');
//        });

        return response()->json('success');
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function echeck(Request $request)

    {
        $input = $request->input();
        $rules = [
            'email' => 'unique:users',
        ];
        $messages = [
            'email.unique' => 'A user with the email already exist',
        ];
        $validator = Validator::make($input, $rules, $messages);
        if ($validator->fails()) {
            abort(404);
        }

    }

    public function verify(Request $request, $code)
    {

        $acc = User::where('verification_code',$code)->count();

//        dd($acc);

        if($acc == 1){
            $verified = DB::table('users')
                ->where('verification_code', $code)
                ->update(['verified' => 1]);
            if($verified){
                DB::table('users')
                    ->where('verification_code', $code)
                    ->update(['verification_code' => Null]);
            }


            return response()->json('verified',200);
        }
        else{
            return response()->json('verification error',401);
        }

    }


}
