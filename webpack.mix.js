let mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

  mix.js('resources/assets/js/app.js', 'public/js')
    .js('resources/assets/js/vendor.js', 'public/js')
    .copyDirectory('ng/ngf', 'public/ngf')
    .copyDirectory('ng/images', 'public/images')
    .copyDirectory('ng/fonts', 'public/fonts')
    .copy('ng/js/*.js', 'public/js')
    .copy('ng/css/*.css', 'public/css')
    .copy('ng/*.js', 'public/js')
    .scripts([

        'public/js/angular-ui-router.js',
        'public/js/angular-messages.js',
        'public/js/angular-animate.js',
        'public/js/angular-sanitize.js',
        'public/js/angular-ui-router-title.js',
        'public/js/ocLazyLoad.js',
        'public/js/angular-country-state.js',
        'public/js/dirPagination.js',
        'public/js/angular-clock.js',
        'public/js/angular-material-widget-engine.js',
        'public/js/perfect-scrollbar.jquery.js',

        'public/js/angular-notification-icons.js',

        'public/js/app.module.js',
        'public/js/mainCtrl.js',
        'public/js/app.config.js',
        'public/js/app.component.js',

        'public/ngf/home/home.module.js',
        'public/ngf/home/home.component.js',

        'public/ngf/hotel/hotel.module.js',
        'public/ngf/hotel/hotel.component.js',
        'public/ngf/hotel/hotel_result_controller.js',

        'public/ngf/event_center/event_center.module.js',
        'public/ngf/event_center/event_center.config.js',
        'public/ngf/event_center/event_center.component.js',
        'public/ngf/event_center/event_center_result.controller.js',

        'public/ngf/event_planner/event_planner.module.js',
        'public/ngf/event_planner/event_planner.component.js',
        'public/ngf/event_planner/event_planner_result_controller.js',

        'public/ngf/vendor/vendor.module.js',
        'public/ngf/vendor/vendor.component.js',
        'public/ngf/vendor/vendor_result_controller.js',

        'public/ngf/account/account.module.js',
        'public/ngf/account/account.config.js',
        'public/ngf/account/account.component.js',
        'public/ngf/services/account.js',
        'public/js/settings.js',

        'public/ngf/account/dashboard/dashboard.module.js',
        'public/ngf/account/dashboard/dashboard.config.js',
        'public/ngf/account/dashboard/dashboard.component.js',

        'public/ngf/account/dashboard/_dashboard_files/dashboard/dashboard_home.module.js',
        'public/ngf/account/dashboard/_dashboard_files/dashboard/dashboard_home.config.js',
        'public/ngf/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
        'public/ngf/account/dashboard/_dashboard_files/dashboard/dashboard_home.component.js',

        'public/ngf/account/dashboard/_dashboard_files/manage_site/manage_site.module.js',
        'public/ngf/account/dashboard/_dashboard_files/manage_site/manage_site.component.js',

        'public/ngf/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.module.js',
        'public/ngf/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.component.js',

        'public/ngf/account/dashboard/_dashboard_files/manage_hotel/manage_hotel.module.js',
        'public/ngf/account/dashboard/_dashboard_files/manage_hotel/manage_hotel.component.js',
        'public/ngf/account/dashboard/_dashboard_files/manage_hotel/manage_hotel_admin.component.js',
        'public/ngf/account/dashboard/_dashboard_files/manage_hotel/manage_hotel_user.component.js',

        'public/ngf/account/dashboard/_dashboard_files/users/users.controller.js',

        'public/ngf/account/dashboard/_dashboard_files/components/component.module.js',
        'public/ngf/account/dashboard/_dashboard_files/components/budget_widget.component.js',
        'public/ngf/account/dashboard/_dashboard_files/components/weather_widget.component.js',
        'public/ngf/account/dashboard/_dashboard_files/components/weather_widget.service.js'
        ],'public/js/all.js')
        .styles([
            'node_modules/lf-ng-md-file-input/dist/lf-ng-md-file-input.css',
            'node_modules/nvd3/build/nv.d3.css',
            'node_modules/angular-material-data-table/dist/md-data-table.css',
            'node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.min.css',
            'node_modules/angular-notification-icons/dist/angular-notification-icons.css',
            'public/css/index.css',
            'public/css/angular-csp.css',
            'public/css/animate.css',
            'public/css/magic.css',
            'public/css/materialize.css',
            'public/css/angular-clock.css',
            'public/css/angular-material-widget-engine.css',
            'public/css/perfect-scrollbar.css',
            'public/js/angular-notification-icons.css',
            'public/css/normalize.css'
        ],'public/css/all.css')
   .sass('resources/assets/sass/vendor.scss', 'public/css');
