let mix = require('laravel-mix');
// mix.copy('node_modules','www/vendor/')
    mix.extract(['angular-material'], 'www/ma.js');
