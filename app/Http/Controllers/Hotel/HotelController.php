<?php

namespace kittron\Http\Controllers\Hotel;

use kittron\Http\Controllers\RootController;
use GuzzleHttp\Psr7\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use kittron\Http\Controllers\Controller;
use kittron\Partners\Hotel\Hotel;
use kittron\Partners\Facility;
use kittron\Partners\Room;
use kittron\Partners\HotelImage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

use kittron\Http\Traits\ResponseTrait;

class HotelController extends RootController
{
    use ResponseTrait;

    function createHotelRecord(Request $request) {

         $validator = Validator::make($request->all(), [
               'hotel_name' =>'required',
               'hotel_description' => 'required',
               'hotel_address' => 'required',
               'contact_person' => 'required',
               'contact_person_email'=>'required|email',
               'contact_person_number' =>'required'              
            ],
            [
                'hotel_name.required'   => 'Hotel Name is required',
                'hotel_description.required'  => 'Hotel Description is required',
                'contact_person.required'        => 'Contact Person is required',
                'contact_person_email.required'      => 'You have not entered contact email'
            ]

            );

        if ($validator->fails()) {
            return $this->respondValidationError('Fields Validation Failed.', $validator->errors());
        }

    	$hotel = new Hotel();
        $room = new Room();
        $hotel_images_url = $images_url = array();

    	$hotel->name = $request->hotel_name;
    	$hotel->description = $request->hotel_description;
    	$hotel->address = $request->hotel_address;
    	$hotel->facilities = self::ArrayToString($request->facilities);
    	$hotel->price = $request->price;
    	$hotel->contact_person = $request->contact_person;
    	$hotel->contact_person_email = $request->contact_person_email;
    	$hotel->contact_person_number = $request->contact_person_number;
    	$hotel->country = $request->hotel_country;
    	$hotel->state = $request->hotel_state;
    	$hotel->year_constructed = $request->hotel_year_constructed;
    	$hotel->year_renovated = $request->hotel_year_renovated;
    	$hotel->selling_points = self::ArrayToString($request->selling_points);
    	$hotel->payment_method = $request->payment_method;
    	$hotel->preferred_currency = $request->preferred_currency;
        if($request->banner != null) {
            $banner_path = self::uploadSingleImage($hotel->name, $request->banner, 'storage/uploads/hotel_banners', 800, 500);
            $hotel->banner = $banner_path;
        }
    	$hotel->reftag = self::hashFunction(15);

        $room->hotel_reftag = $hotel->reftag;
        $room->type_of_room = $request->room_name;
        $room->facilities = $request->room_facilities;
        $room->complementary = self::ArrayToString($request->complementary);
        $room->availability = $request->availability;
        $room->rate = $request->room_rate;
        $room->maximum_occupant = $request->maximum_occupant;
        $room->bed_id = $request->bed_size;
        $room->number_of_rooms = $request->no_of_rooms;
        $room->no_of_bed = $request->no_of_bed;
        $room->additional_bed_rate = $request->additional_bed_rate;
        $room->other_room_rate = $request->other_room_rate;
        if($request->room_image != null) {
            $room_image = self::uploadSingleImage($hotel->name, $request->room_image, 'storage/uploads/hotel_images', 500, 500);
            $room->room_image = $room_image;
        }
        $room->reftag = self::hashFunction(15);

        if($request->hotel_images != null) {
            $images_path = self::uploadMultipleImages($hotel->name, $request->hotel_images, 'storage/uploads/hotel_images', 600, 400);
            foreach ($images_path as $image_path) {
                $images_url["hotel_reftag"] = $hotel->reftag;
                $images_url["image_url"] = $image_path;
                $images_url["created_at"] = date('Y-m-d H:i:s');
                $images_url["updated_at"] = date('Y-m-d H:i:s');
                $images_url["reftag"] = self::hashFunction(15);

                $hotel_images_url[] = $images_url;
            }
        }

        $save_hotel = $hotel->save();
        $save_room = $room->save();
        if($save_hotel) {
            $save_image = HotelImage::insert($hotel_images_url);
            if($save_image) {
                return $this->respond([
                    'status' => 'success',
                    'status_code' => $this->getStatusCode(),
                    'message' => 'Hotel Information Saved Successfully!'
                ]);
            }
        }

    }
    
}
