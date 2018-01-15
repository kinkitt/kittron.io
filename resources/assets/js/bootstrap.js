
window._ = require('lodash');

/**
 * We'll load jQuery and the Bootstrap jQuery plugin which provides support
 * for JavaScript based Bootstrap features such as modals and tabs. This
 * code may be modified to fit the specific needs of your application.
 */

try {
    window.$ = window.jQuery = require('jquery');

    require('bootstrap-sass');
} catch (e) {}

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

window.jquery = require('jquery');
window.angular = require('angularjs');
window.angularMaterial = require('angular-material');
window.angularAnimatejs = require('angular-animate');
window.angularAria = require('angular-aria');
window.angularResource = require('angular-resource');
window.angularMaterialTable = require('angular-material-data-table');
window.d3 = require('d3');
window.nvd3 = require('nvd3');
window.angularNvd3 = require('angular-google-chart');
window.angularNvd3 = require('angular-nvd3');
window.angularFile = require('lf-ng-md-file-input');
window.checklistModel = require('checklist-model');
window.manh = require('malihu-custom-scrollbar-plugin');
window.pscroll = require('angular-perfect-scrollbar');
window.satellizer = require('satellizer');
window.ngletterAvater = require('ngletteravatar');
window.ngAvater = require('angular-avatar');
window.ocLazyload = require('oclazyload');
window.angularNotification = require('angular-notification-icons');
// window.bootstrapCalendar = require('angular-bootstrap-calendar');
window.bootstrapM = require('moment');
window.bootstrapI = require('interactjs');
window.angularFilter = require('angular-filter');
window.angularMoment = require('angular-moment');
window.bootstrapUi = require('angular-ui-bootstrap');
//window.axios = require('axios');

//window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Next we will register the CSRF Token as a common header with Axios so that
 * all outgoing HTTP requests automatically have it attached. This is just
 * a simple convenience so we don't have to attach every token manually.
 */
//
// let token = document.head.querySelector('meta[name="csrf-token"]');
//
// if (token) {
//    // window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
// } else {
//     console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
// }

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// import Echo from 'laravel-echo'

// window.Pusher = require('pusher-js');

// window.Echo = new Echo({
//     broadcaster: 'pusher',
//     key: 'your-pusher-key'
// });
