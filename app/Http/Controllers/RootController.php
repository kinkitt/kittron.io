<?php

namespace kittron\Http\Controllers;

use Illuminate\Http\Request;
use Intervention\Image\ImageManagerStatic as Image;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\UploadedFile;
use kittron\Models\Role;
use kittron\Models\AccountType;
use kittron\User;
use Response;
use File;

class RootController extends Controller
{
    public function __construct() {
    	date_default_timezone_set('Africa/Lagos');
    	//$this->middleware('auth:api');
  	}   

    public static function hashFunction($strlnt = null){
        $length = is_null($strlnt)? 20 : $strlnt;
        $hash = substr(md5(uniqid(mt_rand(),true)),0,$length);
        return $hash;
    }

    public static function StringtoArray($string) {
        if($string != null){
            return explode(",", $string);
        }    
    }

    public static function ArrayToString($array) {
        if($array != null) {
            return implode(",", $array);
        }
        else
        {
            return null;
        }
    }    	

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

    function uploadSingleImage($name, $image, $destinationPath, $width, $height)
    {
        //File Does not Exist
        if(!File::exists($destinationPath)) {
            File::makeDirectory($destinationPath, 0775, true);
        }

        $img = Image::make($image);

        $watermark = Image::make(public_path('/images/watermark1.png'));
        $watermark->text($name, 150, 50, function($font) {
            $font->file(public_path('/fonts/Comfortaa-Regular.ttf'));
            $font->size(35);
            $font->color(array(180, 180, 180, 0.8));
            $font->align('center');
            $font->valign('middle');
        });

        $file = $image->getClientOriginalName();
        $fileName = base64_encode($name) . base64_encode($file).'.jpg';

        $img->insert($watermark, 'center', 0, 0);
        $img->fit($width, $height, function ($constraint) {
            $constraint->upsize();
        });
        $path = $destinationPath.'/'.$fileName;
        $img_save = $img->save($destinationPath.'/'.$fileName);

        return $path;

    }

    function uploadMultipleImages($name, $images, $destinationPath, $width, $height)
    {

        //File Does not Exist
        if(!File::exists($destinationPath)) {
            File::makeDirectory($destinationPath, 0775, true);
        }

    	$images_path = array();
        foreach($images as $image)
        {
	        $img = Image::make($image);

	        $watermark = Image::make(public_path('/images/watermark1.png'));
	        $watermark->text($name, 150, 50, function($font) {
	            $font->file(public_path('/fonts/Comfortaa-Regular.ttf'));
	            $font->size(35);
	            $font->color(array(180, 180, 180, 0.8));
	            $font->align('center');
	            $font->valign('middle');
	        });

	        $file = $image->getClientOriginalName();
	        $fileName = base64_encode($name) . base64_encode($file).'.jpg';

	        $img->insert($watermark, 'center', 0, 0);
	        $img->fit($width, $height, function ($constraint) {
	            $constraint->upsize();
	        });
	        $images_path[] = $destinationPath.'/'.$fileName;
	        $img->save($destinationPath.'/'.$fileName);
        }
        	return $images_path;
    }    	

}
