<?php

namespace kittron\Http\Middleware;

use Closure;
use Illuminate\Contracts\Session\Session;

class CheckCsrf
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $req = $request->input();
        if( csrf_token() != $req['krf']){

            abort(403, 'Unauthorized action.');

        }
        return $next($request);
    }
}
