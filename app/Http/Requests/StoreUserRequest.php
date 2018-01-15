<?php

namespace kittron\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'unique:users|email',
            'password' => 'required'
        ];
    }

    public function messages()
    {
        return [
            'email.unique' => 'A user with the email already exist',
        ];
    }

}
