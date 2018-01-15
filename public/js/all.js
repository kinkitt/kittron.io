/**
 * State-based routing for AngularJS
 * @version v0.3.2
 * @link http://angular-ui.github.com/
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
  module.exports = 'ui.router';
}

(function (window, angular, undefined) {
/*jshint globalstrict:true*/
/*global angular:false*/
'use strict';

var isDefined = angular.isDefined,
    isFunction = angular.isFunction,
    isString = angular.isString,
    isObject = angular.isObject,
    isArray = angular.isArray,
    forEach = angular.forEach,
    extend = angular.extend,
    copy = angular.copy,
    toJson = angular.toJson;

function inherit(parent, extra) {
  return extend(new (extend(function() {}, { prototype: parent }))(), extra);
}

function merge(dst) {
  forEach(arguments, function(obj) {
    if (obj !== dst) {
      forEach(obj, function(value, key) {
        if (!dst.hasOwnProperty(key)) dst[key] = value;
      });
    }
  });
  return dst;
}

/**
 * Finds the common ancestor path between two states.
 *
 * @param {Object} first The first state.
 * @param {Object} second The second state.
 * @return {Array} Returns an array of state names in descending order, not including the root.
 */
function ancestors(first, second) {
  var path = [];

  for (var n in first.path) {
    if (first.path[n] !== second.path[n]) break;
    path.push(first.path[n]);
  }
  return path;
}

/**
 * IE8-safe wrapper for `Object.keys()`.
 *
 * @param {Object} object A JavaScript object.
 * @return {Array} Returns the keys of the object as an array.
 */
function objectKeys(object) {
  if (Object.keys) {
    return Object.keys(object);
  }
  var result = [];

  forEach(object, function(val, key) {
    result.push(key);
  });
  return result;
}

/**
 * IE8-safe wrapper for `Array.prototype.indexOf()`.
 *
 * @param {Array} array A JavaScript array.
 * @param {*} value A value to search the array for.
 * @return {Number} Returns the array index value of `value`, or `-1` if not present.
 */
function indexOf(array, value) {
  if (Array.prototype.indexOf) {
    return array.indexOf(value, Number(arguments[2]) || 0);
  }
  var len = array.length >>> 0, from = Number(arguments[2]) || 0;
  from = (from < 0) ? Math.ceil(from) : Math.floor(from);

  if (from < 0) from += len;

  for (; from < len; from++) {
    if (from in array && array[from] === value) return from;
  }
  return -1;
}

/**
 * Merges a set of parameters with all parameters inherited between the common parents of the
 * current state and a given destination state.
 *
 * @param {Object} currentParams The value of the current state parameters ($stateParams).
 * @param {Object} newParams The set of parameters which will be composited with inherited params.
 * @param {Object} $current Internal definition of object representing the current state.
 * @param {Object} $to Internal definition of object representing state to transition to.
 */
function inheritParams(currentParams, newParams, $current, $to) {
  var parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

  for (var i in parents) {
    if (!parents[i] || !parents[i].params) continue;
    parentParams = objectKeys(parents[i].params);
    if (!parentParams.length) continue;

    for (var j in parentParams) {
      if (indexOf(inheritList, parentParams[j]) >= 0) continue;
      inheritList.push(parentParams[j]);
      inherited[parentParams[j]] = currentParams[parentParams[j]];
    }
  }
  return extend({}, inherited, newParams);
}

/**
 * Performs a non-strict comparison of the subset of two objects, defined by a list of keys.
 *
 * @param {Object} a The first object.
 * @param {Object} b The second object.
 * @param {Array} keys The list of keys within each object to compare. If the list is empty or not specified,
 *                     it defaults to the list of keys in `a`.
 * @return {Boolean} Returns `true` if the keys match, otherwise `false`.
 */
function equalForKeys(a, b, keys) {
  if (!keys) {
    keys = [];
    for (var n in a) keys.push(n); // Used instead of Object.keys() for IE8 compatibility
  }

  for (var i=0; i<keys.length; i++) {
    var k = keys[i];
    if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
  }
  return true;
}

/**
 * Returns the subset of an object, based on a list of keys.
 *
 * @param {Array} keys
 * @param {Object} values
 * @return {Boolean} Returns a subset of `values`.
 */
function filterByKeys(keys, values) {
  var filtered = {};

  forEach(keys, function (name) {
    filtered[name] = values[name];
  });
  return filtered;
}

// like _.indexBy
// when you know that your index values will be unique, or you want last-one-in to win
function indexBy(array, propName) {
  var result = {};
  forEach(array, function(item) {
    result[item[propName]] = item;
  });
  return result;
}

// extracted from underscore.js
// Return a copy of the object only containing the whitelisted properties.
function pick(obj) {
  var copy = {};
  var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
  forEach(keys, function(key) {
    if (key in obj) copy[key] = obj[key];
  });
  return copy;
}

// extracted from underscore.js
// Return a copy of the object omitting the blacklisted properties.
function omit(obj) {
  var copy = {};
  var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
  for (var key in obj) {
    if (indexOf(keys, key) == -1) copy[key] = obj[key];
  }
  return copy;
}

function pluck(collection, key) {
  var result = isArray(collection) ? [] : {};

  forEach(collection, function(val, i) {
    result[i] = isFunction(key) ? key(val) : val[key];
  });
  return result;
}

function filter(collection, callback) {
  var array = isArray(collection);
  var result = array ? [] : {};
  forEach(collection, function(val, i) {
    if (callback(val, i)) {
      result[array ? result.length : i] = val;
    }
  });
  return result;
}

function map(collection, callback) {
  var result = isArray(collection) ? [] : {};

  forEach(collection, function(val, i) {
    result[i] = callback(val, i);
  });
  return result;
}

// issue #2676 #2889
function silenceUncaughtInPromise (promise) {
  return promise.then(undefined, function() {}) && promise;
}

/**
 * @ngdoc overview
 * @name ui.router.util
 *
 * @description
 * # ui.router.util sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.util', ['ng']);

/**
 * @ngdoc overview
 * @name ui.router.router
 * 
 * @requires ui.router.util
 *
 * @description
 * # ui.router.router sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 */
angular.module('ui.router.router', ['ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router.state
 * 
 * @requires ui.router.router
 * @requires ui.router.util
 *
 * @description
 * # ui.router.state sub-module
 *
 * This module is a dependency of the main ui.router module. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 * 
 */
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router
 *
 * @requires ui.router.state
 *
 * @description
 * # ui.router
 * 
 * ## The main module for ui.router 
 * There are several sub-modules included with the ui.router module, however only this module is needed
 * as a dependency within your angular app. The other modules are for organization purposes. 
 *
 * The modules are:
 * * ui.router - the main "umbrella" module
 * * ui.router.router - 
 * 
 * *You'll need to include **only** this module as the dependency within your angular app.*
 * 
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the ui-router script -->
 *   <script src="js/angular-ui-router.min.js"></script>
 *   <script>
 *     // ...and add 'ui.router' as a dependency
 *     var myApp = angular.module('myApp', ['ui.router']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('ui.router', ['ui.router.state']);

angular.module('ui.router.compat', ['ui.router']);

/**
 * @ngdoc object
 * @name ui.router.util.$resolve
 *
 * @requires $q
 * @requires $injector
 *
 * @description
 * Manages resolution of (acyclic) graphs of promises.
 */
$Resolve.$inject = ['$q', '$injector'];
function $Resolve(  $q,    $injector) {
  
  var VISIT_IN_PROGRESS = 1,
      VISIT_DONE = 2,
      NOTHING = {},
      NO_DEPENDENCIES = [],
      NO_LOCALS = NOTHING,
      NO_PARENT = extend($q.when(NOTHING), { $$promises: NOTHING, $$values: NOTHING });
  

  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#study
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Studies a set of invocables that are likely to be used multiple times.
   * <pre>
   * $resolve.study(invocables)(locals, parent, self)
   * </pre>
   * is equivalent to
   * <pre>
   * $resolve.resolve(invocables, locals, parent, self)
   * </pre>
   * but the former is more efficient (in fact `resolve` just calls `study` 
   * internally).
   *
   * @param {object} invocables Invocable objects
   * @return {function} a function to pass in locals, parent and self
   */
  this.study = function (invocables) {
    if (!isObject(invocables)) throw new Error("'invocables' must be an object");
    var invocableKeys = objectKeys(invocables || {});
    
    // Perform a topological sort of invocables to build an ordered plan
    var plan = [], cycle = [], visited = {};
    function visit(value, key) {
      if (visited[key] === VISIT_DONE) return;
      
      cycle.push(key);
      if (visited[key] === VISIT_IN_PROGRESS) {
        cycle.splice(0, indexOf(cycle, key));
        throw new Error("Cyclic dependency: " + cycle.join(" -> "));
      }
      visited[key] = VISIT_IN_PROGRESS;
      
      if (isString(value)) {
        plan.push(key, [ function() { return $injector.get(value); }], NO_DEPENDENCIES);
      } else {
        var params = $injector.annotate(value);
        forEach(params, function (param) {
          if (param !== key && invocables.hasOwnProperty(param)) visit(invocables[param], param);
        });
        plan.push(key, value, params);
      }
      
      cycle.pop();
      visited[key] = VISIT_DONE;
    }
    forEach(invocables, visit);
    invocables = cycle = visited = null; // plan is all that's required
    
    function isResolve(value) {
      return isObject(value) && value.then && value.$$promises;
    }
    
    return function (locals, parent, self) {
      if (isResolve(locals) && self === undefined) {
        self = parent; parent = locals; locals = null;
      }
      if (!locals) locals = NO_LOCALS;
      else if (!isObject(locals)) {
        throw new Error("'locals' must be an object");
      }       
      if (!parent) parent = NO_PARENT;
      else if (!isResolve(parent)) {
        throw new Error("'parent' must be a promise returned by $resolve.resolve()");
      }
      
      // To complete the overall resolution, we have to wait for the parent
      // promise and for the promise for each invokable in our plan.
      var resolution = $q.defer(),
          result = resolution.promise,
          promises = result.$$promises = {},
          values = extend({}, locals),
          wait = 1 + plan.length/3,
          merged = false;
          
      function done() {
        // Merge parent values we haven't got yet and publish our own $$values
        if (!--wait) {
          if (!merged) merge(values, parent.$$values); 
          result.$$values = values;
          result.$$promises = result.$$promises || true; // keep for isResolve()
          delete result.$$inheritedValues;
          resolution.resolve(values);
        }
      }
      
      function fail(reason) {
        result.$$failure = reason;
        resolution.reject(reason);
      }

      // Short-circuit if parent has already failed
      if (isDefined(parent.$$failure)) {
        fail(parent.$$failure);
        return result;
      }
      
      if (parent.$$inheritedValues) {
        merge(values, omit(parent.$$inheritedValues, invocableKeys));
      }

      // Merge parent values if the parent has already resolved, or merge
      // parent promises and wait if the parent resolve is still in progress.
      extend(promises, parent.$$promises);
      if (parent.$$values) {
        merged = merge(values, omit(parent.$$values, invocableKeys));
        result.$$inheritedValues = omit(parent.$$values, invocableKeys);
        done();
      } else {
        if (parent.$$inheritedValues) {
          result.$$inheritedValues = omit(parent.$$inheritedValues, invocableKeys);
        }        
        parent.then(done, fail);
      }
      
      // Process each invocable in the plan, but ignore any where a local of the same name exists.
      for (var i=0, ii=plan.length; i<ii; i+=3) {
        if (locals.hasOwnProperty(plan[i])) done();
        else invoke(plan[i], plan[i+1], plan[i+2]);
      }
      
      function invoke(key, invocable, params) {
        // Create a deferred for this invocation. Failures will propagate to the resolution as well.
        var invocation = $q.defer(), waitParams = 0;
        function onfailure(reason) {
          invocation.reject(reason);
          fail(reason);
        }
        // Wait for any parameter that we have a promise for (either from parent or from this
        // resolve; in that case study() will have made sure it's ordered before us in the plan).
        forEach(params, function (dep) {
          if (promises.hasOwnProperty(dep) && !locals.hasOwnProperty(dep)) {
            waitParams++;
            promises[dep].then(function (result) {
              values[dep] = result;
              if (!(--waitParams)) proceed();
            }, onfailure);
          }
        });
        if (!waitParams) proceed();
        function proceed() {
          if (isDefined(result.$$failure)) return;
          try {
            invocation.resolve($injector.invoke(invocable, self, values));
            invocation.promise.then(function (result) {
              values[key] = result;
              done();
            }, onfailure);
          } catch (e) {
            onfailure(e);
          }
        }
        // Publish promise synchronously; invocations further down in the plan may depend on it.
        promises[key] = invocation.promise;
      }
      
      return result;
    };
  };
  
  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#resolve
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Resolves a set of invocables. An invocable is a function to be invoked via 
   * `$injector.invoke()`, and can have an arbitrary number of dependencies. 
   * An invocable can either return a value directly,
   * or a `$q` promise. If a promise is returned it will be resolved and the 
   * resulting value will be used instead. Dependencies of invocables are resolved 
   * (in this order of precedence)
   *
   * - from the specified `locals`
   * - from another invocable that is part of this `$resolve` call
   * - from an invocable that is inherited from a `parent` call to `$resolve` 
   *   (or recursively
   * - from any ancestor `$resolve` of that parent).
   *
   * The return value of `$resolve` is a promise for an object that contains 
   * (in this order of precedence)
   *
   * - any `locals` (if specified)
   * - the resolved return values of all injectables
   * - any values inherited from a `parent` call to `$resolve` (if specified)
   *
   * The promise will resolve after the `parent` promise (if any) and all promises 
   * returned by injectables have been resolved. If any invocable 
   * (or `$injector.invoke`) throws an exception, or if a promise returned by an 
   * invocable is rejected, the `$resolve` promise is immediately rejected with the 
   * same error. A rejection of a `parent` promise (if specified) will likewise be 
   * propagated immediately. Once the `$resolve` promise has been rejected, no 
   * further invocables will be called.
   * 
   * Cyclic dependencies between invocables are not permitted and will cause `$resolve`
   * to throw an error. As a special case, an injectable can depend on a parameter 
   * with the same name as the injectable, which will be fulfilled from the `parent` 
   * injectable of the same name. This allows inherited values to be decorated. 
   * Note that in this case any other injectable in the same `$resolve` with the same
   * dependency would see the decorated value, not the inherited value.
   *
   * Note that missing dependencies -- unlike cyclic dependencies -- will cause an 
   * (asynchronous) rejection of the `$resolve` promise rather than a (synchronous) 
   * exception.
   *
   * Invocables are invoked eagerly as soon as all dependencies are available. 
   * This is true even for dependencies inherited from a `parent` call to `$resolve`.
   *
   * As a special case, an invocable can be a string, in which case it is taken to 
   * be a service name to be passed to `$injector.get()`. This is supported primarily 
   * for backwards-compatibility with the `resolve` property of `$routeProvider` 
   * routes.
   *
   * @param {object} invocables functions to invoke or 
   * `$injector` services to fetch.
   * @param {object} locals  values to make available to the injectables
   * @param {object} parent  a promise returned by another call to `$resolve`.
   * @param {object} self  the `this` for the invoked methods
   * @return {object} Promise for an object that contains the resolved return value
   * of all invocables, as well as any inherited and local values.
   */
  this.resolve = function (invocables, locals, parent, self) {
    return this.study(invocables)(locals, parent, self);
  };
}

angular.module('ui.router.util').service('$resolve', $Resolve);


/**
 * @ngdoc object
 * @name ui.router.util.$templateFactory
 *
 * @requires $http
 * @requires $templateCache
 * @requires $injector
 *
 * @description
 * Service. Manages loading of templates.
 */
$TemplateFactory.$inject = ['$http', '$templateCache', '$injector'];
function $TemplateFactory(  $http,   $templateCache,   $injector) {

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromConfig
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template from a configuration object. 
   *
   * @param {object} config Configuration object for which to load a template. 
   * The following properties are search in the specified order, and the first one 
   * that is defined is used to create the template:
   *
   * @param {string|object} config.template html string template or function to 
   * load via {@link ui.router.util.$templateFactory#fromString fromString}.
   * @param {string|object} config.templateUrl url to load or a function returning 
   * the url to load via {@link ui.router.util.$templateFactory#fromUrl fromUrl}.
   * @param {Function} config.templateProvider function to invoke via 
   * {@link ui.router.util.$templateFactory#fromProvider fromProvider}.
   * @param {object} params  Parameters to pass to the template function.
   * @param {object} locals Locals to pass to `invoke` if the template is loaded 
   * via a `templateProvider`. Defaults to `{ params: params }`.
   *
   * @return {string|object}  The template html as a string, or a promise for 
   * that string,or `null` if no template is configured.
   */
  this.fromConfig = function (config, params, locals) {
    return (
      isDefined(config.template) ? this.fromString(config.template, params) :
      isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
      isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, locals) :
      null
    );
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromString
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template from a string or a function returning a string.
   *
   * @param {string|object} template html template as a string or function that 
   * returns an html template as a string.
   * @param {object} params Parameters to pass to the template function.
   *
   * @return {string|object} The template html as a string, or a promise for that 
   * string.
   */
  this.fromString = function (template, params) {
    return isFunction(template) ? template(params) : template;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromUrl
   * @methodOf ui.router.util.$templateFactory
   * 
   * @description
   * Loads a template from the a URL via `$http` and `$templateCache`.
   *
   * @param {string|Function} url url of the template to load, or a function 
   * that returns a url.
   * @param {Object} params Parameters to pass to the url function.
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  this.fromUrl = function (url, params) {
    if (isFunction(url)) url = url(params);
    if (url == null) return null;
    else return $http
        .get(url, { cache: $templateCache, headers: { Accept: 'text/html' }})
        .then(function(response) { return response.data; });
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromProvider
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template by invoking an injectable provider function.
   *
   * @param {Function} provider Function to invoke via `$injector.invoke`
   * @param {Object} params Parameters for the template.
   * @param {Object} locals Locals to pass to `invoke`. Defaults to 
   * `{ params: params }`.
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  this.fromProvider = function (provider, params, locals) {
    return $injector.invoke(provider, null, locals || { params: params });
  };
}

angular.module('ui.router.util').service('$templateFactory', $TemplateFactory);

var $$UMFP; // reference to $UrlMatcherFactoryProvider

/**
 * @ngdoc object
 * @name ui.router.util.type:UrlMatcher
 *
 * @description
 * Matches URLs against patterns and extracts named parameters from the path or the search
 * part of the URL. A URL pattern consists of a path pattern, optionally followed by '?' and a list
 * of search parameters. Multiple search parameter names are separated by '&'. Search parameters
 * do not influence whether or not a URL is matched, but their values are passed through into
 * the matched parameters returned by {@link ui.router.util.type:UrlMatcher#methods_exec exec}.
 *
 * Path parameter placeholders can be specified using simple colon/catch-all syntax or curly brace
 * syntax, which optionally allows a regular expression for the parameter to be specified:
 *
 * * `':'` name - colon placeholder
 * * `'*'` name - catch-all placeholder
 * * `'{' name '}'` - curly placeholder
 * * `'{' name ':' regexp|type '}'` - curly placeholder with regexp or type name. Should the
 *   regexp itself contain curly braces, they must be in matched pairs or escaped with a backslash.
 *
 * Parameter names may contain only word characters (latin letters, digits, and underscore) and
 * must be unique within the pattern (across both path and search parameters). For colon
 * placeholders or curly placeholders without an explicit regexp, a path parameter matches any
 * number of characters other than '/'. For catch-all placeholders the path parameter matches
 * any number of characters.
 *
 * Examples:
 *
 * * `'/hello/'` - Matches only if the path is exactly '/hello/'. There is no special treatment for
 *   trailing slashes, and patterns have to match the entire path, not just a prefix.
 * * `'/user/:id'` - Matches '/user/bob' or '/user/1234!!!' or even '/user/' but not '/user' or
 *   '/user/bob/details'. The second path segment will be captured as the parameter 'id'.
 * * `'/user/{id}'` - Same as the previous example, but using curly brace syntax.
 * * `'/user/{id:[^/]*}'` - Same as the previous example.
 * * `'/user/{id:[0-9a-fA-F]{1,8}}'` - Similar to the previous example, but only matches if the id
 *   parameter consists of 1 to 8 hex digits.
 * * `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
 *   path into the parameter 'path'.
 * * `'/files/*path'` - ditto.
 * * `'/calendar/{start:date}'` - Matches "/calendar/2014-11-12" (because the pattern defined
 *   in the built-in  `date` Type matches `2014-11-12`) and provides a Date object in $stateParams.start
 *
 * @param {string} pattern  The pattern to compile into a matcher.
 * @param {Object} config  A configuration object hash:
 * @param {Object=} parentMatcher Used to concatenate the pattern/config onto
 *   an existing UrlMatcher
 *
 * * `caseInsensitive` - `true` if URL matching should be case insensitive, otherwise `false`, the default value (for backward compatibility) is `false`.
 * * `strict` - `false` if matching against a URL with a trailing slash should be treated as equivalent to a URL without a trailing slash, the default value is `true`.
 *
 * @property {string} prefix  A static prefix of this pattern. The matcher guarantees that any
 *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
 *   non-null) will start with this prefix.
 *
 * @property {string} source  The pattern that was passed into the constructor
 *
 * @property {string} sourcePath  The path portion of the source property
 *
 * @property {string} sourceSearch  The search portion of the source property
 *
 * @property {string} regex  The constructed regex that will be used to match against the url when
 *   it is time to determine which url will match.
 *
 * @returns {Object}  New `UrlMatcher` object
 */
function UrlMatcher(pattern, config, parentMatcher) {
  config = extend({ params: {} }, isObject(config) ? config : {});

  // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
  //   '*' name
  //   ':' name
  //   '{' name '}'
  //   '{' name ':' regexp '}'
  // The regular expression is somewhat complicated due to the need to allow curly braces
  // inside the regular expression. The placeholder regexp breaks down as follows:
  //    ([:*])([\w\[\]]+)              - classic placeholder ($1 / $2) (search version has - for snake-case)
  //    \{([\w\[\]]+)(?:\:\s*( ... ))?\}  - curly brace placeholder ($3) with optional regexp/type ... ($4) (search version has - for snake-case
  //    (?: ... | ... | ... )+         - the regexp consists of any number of atoms, an atom being either
  //    [^{}\\]+                       - anything other than curly braces or backslash
  //    \\.                            - a backslash escape
  //    \{(?:[^{}\\]+|\\.)*\}          - a matched set of curly braces containing other atoms
  var placeholder       = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
      searchPlaceholder = /([:]?)([\w\[\].-]+)|\{([\w\[\].-]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
      compiled = '^', last = 0, m,
      segments = this.segments = [],
      parentParams = parentMatcher ? parentMatcher.params : {},
      params = this.params = parentMatcher ? parentMatcher.params.$$new() : new $$UMFP.ParamSet(),
      paramNames = [];

  function addParameter(id, type, config, location) {
    paramNames.push(id);
    if (parentParams[id]) return parentParams[id];
    if (!/^\w+([-.]+\w+)*(?:\[\])?$/.test(id)) throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
    if (params[id]) throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
    params[id] = new $$UMFP.Param(id, type, config, location);
    return params[id];
  }

  function quoteRegExp(string, pattern, squash, optional) {
    var surroundPattern = ['',''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
    if (!pattern) return result;
    switch(squash) {
      case false: surroundPattern = ['(', ')' + (optional ? "?" : "")]; break;
      case true:
        result = result.replace(/\/$/, '');
        surroundPattern = ['(?:\/(', ')|\/)?'];
      break;
      default:    surroundPattern = ['(' + squash + "|", ')?']; break;
    }
    return result + surroundPattern[0] + pattern + surroundPattern[1];
  }

  this.source = pattern;

  // Split into static segments separated by path parameter placeholders.
  // The number of segments is always 1 more than the number of parameters.
  function matchDetails(m, isSearch) {
    var id, regexp, segment, type, cfg, arrayMode;
    id          = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
    cfg         = config.params[id];
    segment     = pattern.substring(last, m.index);
    regexp      = isSearch ? m[4] : m[4] || (m[1] == '*' ? '.*' : null);

    if (regexp) {
      type      = $$UMFP.type(regexp) || inherit($$UMFP.type("string"), { pattern: new RegExp(regexp, config.caseInsensitive ? 'i' : undefined) });
    }

    return {
      id: id, regexp: regexp, segment: segment, type: type, cfg: cfg
    };
  }

  var p, param, segment;
  while ((m = placeholder.exec(pattern))) {
    p = matchDetails(m, false);
    if (p.segment.indexOf('?') >= 0) break; // we're into the search part

    param = addParameter(p.id, p.type, p.cfg, "path");
    compiled += quoteRegExp(p.segment, param.type.pattern.source, param.squash, param.isOptional);
    segments.push(p.segment);
    last = placeholder.lastIndex;
  }
  segment = pattern.substring(last);

  // Find any search parameter names and remove them from the last segment
  var i = segment.indexOf('?');

  if (i >= 0) {
    var search = this.sourceSearch = segment.substring(i);
    segment = segment.substring(0, i);
    this.sourcePath = pattern.substring(0, last + i);

    if (search.length > 0) {
      last = 0;
      while ((m = searchPlaceholder.exec(search))) {
        p = matchDetails(m, true);
        param = addParameter(p.id, p.type, p.cfg, "search");
        last = placeholder.lastIndex;
        // check if ?&
      }
    }
  } else {
    this.sourcePath = pattern;
    this.sourceSearch = '';
  }

  compiled += quoteRegExp(segment) + (config.strict === false ? '\/?' : '') + '$';
  segments.push(segment);

  this.regexp = new RegExp(compiled, config.caseInsensitive ? 'i' : undefined);
  this.prefix = segments[0];
  this.$$paramNames = paramNames;
}

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#concat
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Returns a new matcher for a pattern constructed by appending the path part and adding the
 * search parameters of the specified pattern to this pattern. The current pattern is not
 * modified. This can be understood as creating a pattern for URLs that are relative to (or
 * suffixes of) the current pattern.
 *
 * @example
 * The following two matchers are equivalent:
 * <pre>
 * new UrlMatcher('/user/{id}?q').concat('/details?date');
 * new UrlMatcher('/user/{id}/details?q&date');
 * </pre>
 *
 * @param {string} pattern  The pattern to append.
 * @param {Object} config  An object hash of the configuration for the matcher.
 * @returns {UrlMatcher}  A matcher for the concatenated pattern.
 */
UrlMatcher.prototype.concat = function (pattern, config) {
  // Because order of search parameters is irrelevant, we can add our own search
  // parameters to the end of the new pattern. Parse the new pattern by itself
  // and then join the bits together, but it's much easier to do this on a string level.
  var defaultConfig = {
    caseInsensitive: $$UMFP.caseInsensitive(),
    strict: $$UMFP.strictMode(),
    squash: $$UMFP.defaultSquashPolicy()
  };
  return new UrlMatcher(this.sourcePath + pattern + this.sourceSearch, extend(defaultConfig, config), this);
};

UrlMatcher.prototype.toString = function () {
  return this.source;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#exec
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Tests the specified path against this matcher, and returns an object containing the captured
 * parameter values, or null if the path does not match. The returned object contains the values
 * of any search parameters that are mentioned in the pattern, but their value may be null if
 * they are not present in `searchParams`. This means that search parameters are always treated
 * as optional.
 *
 * @example
 * <pre>
 * new UrlMatcher('/user/{id}?q&r').exec('/user/bob', {
 *   x: '1', q: 'hello'
 * });
 * // returns { id: 'bob', q: 'hello', r: null }
 * </pre>
 *
 * @param {string} path  The URL path to match, e.g. `$location.path()`.
 * @param {Object} searchParams  URL search parameters, e.g. `$location.search()`.
 * @returns {Object}  The captured parameter values.
 */
UrlMatcher.prototype.exec = function (path, searchParams) {
  var m = this.regexp.exec(path);
  if (!m) return null;
  searchParams = searchParams || {};

  var paramNames = this.parameters(), nTotal = paramNames.length,
    nPath = this.segments.length - 1,
    values = {}, i, j, cfg, paramName;

  if (nPath !== m.length - 1) throw new Error("Unbalanced capture group in route '" + this.source + "'");

  function decodePathArray(string) {
    function reverseString(str) { return str.split("").reverse().join(""); }
    function unquoteDashes(str) { return str.replace(/\\-/g, "-"); }

    var split = reverseString(string).split(/-(?!\\)/);
    var allReversed = map(split, reverseString);
    return map(allReversed, unquoteDashes).reverse();
  }

  var param, paramVal;
  for (i = 0; i < nPath; i++) {
    paramName = paramNames[i];
    param = this.params[paramName];
    paramVal = m[i+1];
    // if the param value matches a pre-replace pair, replace the value before decoding.
    for (j = 0; j < param.replace.length; j++) {
      if (param.replace[j].from === paramVal) paramVal = param.replace[j].to;
    }
    if (paramVal && param.array === true) paramVal = decodePathArray(paramVal);
    if (isDefined(paramVal)) paramVal = param.type.decode(paramVal);
    values[paramName] = param.value(paramVal);
  }
  for (/**/; i < nTotal; i++) {
    paramName = paramNames[i];
    values[paramName] = this.params[paramName].value(searchParams[paramName]);
    param = this.params[paramName];
    paramVal = searchParams[paramName];
    for (j = 0; j < param.replace.length; j++) {
      if (param.replace[j].from === paramVal) paramVal = param.replace[j].to;
    }
    if (isDefined(paramVal)) paramVal = param.type.decode(paramVal);
    values[paramName] = param.value(paramVal);
  }

  return values;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#parameters
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Returns the names of all path and search parameters of this pattern in an unspecified order.
 *
 * @returns {Array.<string>}  An array of parameter names. Must be treated as read-only. If the
 *    pattern has no parameters, an empty array is returned.
 */
UrlMatcher.prototype.parameters = function (param) {
  if (!isDefined(param)) return this.$$paramNames;
  return this.params[param] || null;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#validates
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Checks an object hash of parameters to validate their correctness according to the parameter
 * types of this `UrlMatcher`.
 *
 * @param {Object} params The object hash of parameters to validate.
 * @returns {boolean} Returns `true` if `params` validates, otherwise `false`.
 */
UrlMatcher.prototype.validates = function (params) {
  return this.params.$$validates(params);
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#format
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Creates a URL that matches this pattern by substituting the specified values
 * for the path and search parameters. Null values for path parameters are
 * treated as empty strings.
 *
 * @example
 * <pre>
 * new UrlMatcher('/user/{id}?q').format({ id:'bob', q:'yes' });
 * // returns '/user/bob?q=yes'
 * </pre>
 *
 * @param {Object} values  the values to substitute for the parameters in this pattern.
 * @returns {string}  the formatted URL (path and optionally search part).
 */
UrlMatcher.prototype.format = function (values) {
  values = values || {};
  var segments = this.segments, params = this.parameters(), paramset = this.params;
  if (!this.validates(values)) return null;

  var i, search = false, nPath = segments.length - 1, nTotal = params.length, result = segments[0];

  function encodeDashes(str) { // Replace dashes with encoded "\-"
    return encodeURIComponent(str).replace(/-/g, function(c) { return '%5C%' + c.charCodeAt(0).toString(16).toUpperCase(); });
  }

  for (i = 0; i < nTotal; i++) {
    var isPathParam = i < nPath;
    var name = params[i], param = paramset[name], value = param.value(values[name]);
    var isDefaultValue = param.isOptional && param.type.equals(param.value(), value);
    var squash = isDefaultValue ? param.squash : false;
    var encoded = param.type.encode(value);

    if (isPathParam) {
      var nextSegment = segments[i + 1];
      var isFinalPathParam = i + 1 === nPath;

      if (squash === false) {
        if (encoded != null) {
          if (isArray(encoded)) {
            result += map(encoded, encodeDashes).join("-");
          } else {
            result += encodeURIComponent(encoded);
          }
        }
        result += nextSegment;
      } else if (squash === true) {
        var capture = result.match(/\/$/) ? /\/?(.*)/ : /(.*)/;
        result += nextSegment.match(capture)[1];
      } else if (isString(squash)) {
        result += squash + nextSegment;
      }

      if (isFinalPathParam && param.squash === true && result.slice(-1) === '/') result = result.slice(0, -1);
    } else {
      if (encoded == null || (isDefaultValue && squash !== false)) continue;
      if (!isArray(encoded)) encoded = [ encoded ];
      if (encoded.length === 0) continue;
      encoded = map(encoded, encodeURIComponent).join('&' + name + '=');
      result += (search ? '&' : '?') + (name + '=' + encoded);
      search = true;
    }
  }

  return result;
};

/**
 * @ngdoc object
 * @name ui.router.util.type:Type
 *
 * @description
 * Implements an interface to define custom parameter types that can be decoded from and encoded to
 * string parameters matched in a URL. Used by {@link ui.router.util.type:UrlMatcher `UrlMatcher`}
 * objects when matching or formatting URLs, or comparing or validating parameter values.
 *
 * See {@link ui.router.util.$urlMatcherFactory#methods_type `$urlMatcherFactory#type()`} for more
 * information on registering custom types.
 *
 * @param {Object} config  A configuration object which contains the custom type definition.  The object's
 *        properties will override the default methods and/or pattern in `Type`'s public interface.
 * @example
 * <pre>
 * {
 *   decode: function(val) { return parseInt(val, 10); },
 *   encode: function(val) { return val && val.toString(); },
 *   equals: function(a, b) { return this.is(a) && a === b; },
 *   is: function(val) { return angular.isNumber(val) isFinite(val) && val % 1 === 0; },
 *   pattern: /\d+/
 * }
 * </pre>
 *
 * @property {RegExp} pattern The regular expression pattern used to match values of this type when
 *           coming from a substring of a URL.
 *
 * @returns {Object}  Returns a new `Type` object.
 */
function Type(config) {
  extend(this, config);
}

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#is
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Detects whether a value is of a particular type. Accepts a native (decoded) value
 * and determines whether it matches the current `Type` object.
 *
 * @param {*} val  The value to check.
 * @param {string} key  Optional. If the type check is happening in the context of a specific
 *        {@link ui.router.util.type:UrlMatcher `UrlMatcher`} object, this is the name of the
 *        parameter in which `val` is stored. Can be used for meta-programming of `Type` objects.
 * @returns {Boolean}  Returns `true` if the value matches the type, otherwise `false`.
 */
Type.prototype.is = function(val, key) {
  return true;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#encode
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Encodes a custom/native type value to a string that can be embedded in a URL. Note that the
 * return value does *not* need to be URL-safe (i.e. passed through `encodeURIComponent()`), it
 * only needs to be a representation of `val` that has been coerced to a string.
 *
 * @param {*} val  The value to encode.
 * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
 *        meta-programming of `Type` objects.
 * @returns {string}  Returns a string representation of `val` that can be encoded in a URL.
 */
Type.prototype.encode = function(val, key) {
  return val;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#decode
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Converts a parameter value (from URL string or transition param) to a custom/native value.
 *
 * @param {string} val  The URL parameter value to decode.
 * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
 *        meta-programming of `Type` objects.
 * @returns {*}  Returns a custom representation of the URL parameter value.
 */
Type.prototype.decode = function(val, key) {
  return val;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:Type#equals
 * @methodOf ui.router.util.type:Type
 *
 * @description
 * Determines whether two decoded values are equivalent.
 *
 * @param {*} a  A value to compare against.
 * @param {*} b  A value to compare against.
 * @returns {Boolean}  Returns `true` if the values are equivalent/equal, otherwise `false`.
 */
Type.prototype.equals = function(a, b) {
  return a == b;
};

Type.prototype.$subPattern = function() {
  var sub = this.pattern.toString();
  return sub.substr(1, sub.length - 2);
};

Type.prototype.pattern = /.*/;

Type.prototype.toString = function() { return "{Type:" + this.name + "}"; };

/** Given an encoded string, or a decoded object, returns a decoded object */
Type.prototype.$normalize = function(val) {
  return this.is(val) ? val : this.decode(val);
};

/*
 * Wraps an existing custom Type as an array of Type, depending on 'mode'.
 * e.g.:
 * - urlmatcher pattern "/path?{queryParam[]:int}"
 * - url: "/path?queryParam=1&queryParam=2
 * - $stateParams.queryParam will be [1, 2]
 * if `mode` is "auto", then
 * - url: "/path?queryParam=1 will create $stateParams.queryParam: 1
 * - url: "/path?queryParam=1&queryParam=2 will create $stateParams.queryParam: [1, 2]
 */
Type.prototype.$asArray = function(mode, isSearch) {
  if (!mode) return this;
  if (mode === "auto" && !isSearch) throw new Error("'auto' array mode is for query parameters only");

  function ArrayType(type, mode) {
    function bindTo(type, callbackName) {
      return function() {
        return type[callbackName].apply(type, arguments);
      };
    }

    // Wrap non-array value as array
    function arrayWrap(val) { return isArray(val) ? val : (isDefined(val) ? [ val ] : []); }
    // Unwrap array value for "auto" mode. Return undefined for empty array.
    function arrayUnwrap(val) {
      switch(val.length) {
        case 0: return undefined;
        case 1: return mode === "auto" ? val[0] : val;
        default: return val;
      }
    }
    function falsey(val) { return !val; }

    // Wraps type (.is/.encode/.decode) functions to operate on each value of an array
    function arrayHandler(callback, allTruthyMode) {
      return function handleArray(val) {
        if (isArray(val) && val.length === 0) return val;
        val = arrayWrap(val);
        var result = map(val, callback);
        if (allTruthyMode === true)
          return filter(result, falsey).length === 0;
        return arrayUnwrap(result);
      };
    }

    // Wraps type (.equals) functions to operate on each value of an array
    function arrayEqualsHandler(callback) {
      return function handleArray(val1, val2) {
        var left = arrayWrap(val1), right = arrayWrap(val2);
        if (left.length !== right.length) return false;
        for (var i = 0; i < left.length; i++) {
          if (!callback(left[i], right[i])) return false;
        }
        return true;
      };
    }

    this.encode = arrayHandler(bindTo(type, 'encode'));
    this.decode = arrayHandler(bindTo(type, 'decode'));
    this.is     = arrayHandler(bindTo(type, 'is'), true);
    this.equals = arrayEqualsHandler(bindTo(type, 'equals'));
    this.pattern = type.pattern;
    this.$normalize = arrayHandler(bindTo(type, '$normalize'));
    this.name = type.name;
    this.$arrayMode = mode;
  }

  return new ArrayType(this, mode);
};



/**
 * @ngdoc object
 * @name ui.router.util.$urlMatcherFactory
 *
 * @description
 * Factory for {@link ui.router.util.type:UrlMatcher `UrlMatcher`} instances. The factory
 * is also available to providers under the name `$urlMatcherFactoryProvider`.
 */
function $UrlMatcherFactory() {
  $$UMFP = this;

  var isCaseInsensitive = false, isStrictMode = true, defaultSquashPolicy = false;

  // Use tildes to pre-encode slashes.
  // If the slashes are simply URLEncoded, the browser can choose to pre-decode them,
  // and bidirectional encoding/decoding fails.
  // Tilde was chosen because it's not a RFC 3986 section 2.2 Reserved Character
  function valToString(val) { return val != null ? val.toString().replace(/(~|\/)/g, function (m) { return {'~':'~~', '/':'~2F'}[m]; }) : val; }
  function valFromString(val) { return val != null ? val.toString().replace(/(~~|~2F)/g, function (m) { return {'~~':'~', '~2F':'/'}[m]; }) : val; }

  var $types = {}, enqueue = true, typeQueue = [], injector, defaultTypes = {
    "string": {
      encode: valToString,
      decode: valFromString,
      // TODO: in 1.0, make string .is() return false if value is undefined/null by default.
      // In 0.2.x, string params are optional by default for backwards compat
      is: function(val) { return val == null || !isDefined(val) || typeof val === "string"; },
      pattern: /[^/]*/
    },
    "int": {
      encode: valToString,
      decode: function(val) { return parseInt(val, 10); },
      is: function(val) { return isDefined(val) && this.decode(val.toString()) === val; },
      pattern: /\d+/
    },
    "bool": {
      encode: function(val) { return val ? 1 : 0; },
      decode: function(val) { return parseInt(val, 10) !== 0; },
      is: function(val) { return val === true || val === false; },
      pattern: /0|1/
    },
    "date": {
      encode: function (val) {
        if (!this.is(val))
          return undefined;
        return [ val.getFullYear(),
          ('0' + (val.getMonth() + 1)).slice(-2),
          ('0' + val.getDate()).slice(-2)
        ].join("-");
      },
      decode: function (val) {
        if (this.is(val)) return val;
        var match = this.capture.exec(val);
        return match ? new Date(match[1], match[2] - 1, match[3]) : undefined;
      },
      is: function(val) { return val instanceof Date && !isNaN(val.valueOf()); },
      equals: function (a, b) { return this.is(a) && this.is(b) && a.toISOString() === b.toISOString(); },
      pattern: /[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,
      capture: /([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
    },
    "json": {
      encode: angular.toJson,
      decode: angular.fromJson,
      is: angular.isObject,
      equals: angular.equals,
      pattern: /[^/]*/
    },
    "any": { // does not encode/decode
      encode: angular.identity,
      decode: angular.identity,
      equals: angular.equals,
      pattern: /.*/
    }
  };

  function getDefaultConfig() {
    return {
      strict: isStrictMode,
      caseInsensitive: isCaseInsensitive
    };
  }

  function isInjectable(value) {
    return (isFunction(value) || (isArray(value) && isFunction(value[value.length - 1])));
  }

  /**
   * [Internal] Get the default value of a parameter, which may be an injectable function.
   */
  $UrlMatcherFactory.$$getDefaultValue = function(config) {
    if (!isInjectable(config.value)) return config.value;
    if (!injector) throw new Error("Injectable functions cannot be called at configuration time");
    return injector.invoke(config.value);
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#caseInsensitive
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Defines whether URL matching should be case sensitive (the default behavior), or not.
   *
   * @param {boolean} value `false` to match URL in a case sensitive manner; otherwise `true`;
   * @returns {boolean} the current value of caseInsensitive
   */
  this.caseInsensitive = function(value) {
    if (isDefined(value))
      isCaseInsensitive = value;
    return isCaseInsensitive;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#strictMode
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Defines whether URLs should match trailing slashes, or not (the default behavior).
   *
   * @param {boolean=} value `false` to match trailing slashes in URLs, otherwise `true`.
   * @returns {boolean} the current value of strictMode
   */
  this.strictMode = function(value) {
    if (isDefined(value))
      isStrictMode = value;
    return isStrictMode;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#defaultSquashPolicy
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Sets the default behavior when generating or matching URLs with default parameter values.
   *
   * @param {string} value A string that defines the default parameter URL squashing behavior.
   *    `nosquash`: When generating an href with a default parameter value, do not squash the parameter value from the URL
   *    `slash`: When generating an href with a default parameter value, squash (remove) the parameter value, and, if the
   *             parameter is surrounded by slashes, squash (remove) one slash from the URL
   *    any other string, e.g. "~": When generating an href with a default parameter value, squash (remove)
   *             the parameter value from the URL and replace it with this string.
   */
  this.defaultSquashPolicy = function(value) {
    if (!isDefined(value)) return defaultSquashPolicy;
    if (value !== true && value !== false && !isString(value))
      throw new Error("Invalid squash policy: " + value + ". Valid policies: false, true, arbitrary-string");
    defaultSquashPolicy = value;
    return value;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#compile
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Creates a {@link ui.router.util.type:UrlMatcher `UrlMatcher`} for the specified pattern.
   *
   * @param {string} pattern  The URL pattern.
   * @param {Object} config  The config object hash.
   * @returns {UrlMatcher}  The UrlMatcher.
   */
  this.compile = function (pattern, config) {
    return new UrlMatcher(pattern, extend(getDefaultConfig(), config));
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#isMatcher
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Returns true if the specified object is a `UrlMatcher`, or false otherwise.
   *
   * @param {Object} object  The object to perform the type check against.
   * @returns {Boolean}  Returns `true` if the object matches the `UrlMatcher` interface, by
   *          implementing all the same methods.
   */
  this.isMatcher = function (o) {
    if (!isObject(o)) return false;
    var result = true;

    forEach(UrlMatcher.prototype, function(val, name) {
      if (isFunction(val)) {
        result = result && (isDefined(o[name]) && isFunction(o[name]));
      }
    });
    return result;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#type
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Registers a custom {@link ui.router.util.type:Type `Type`} object that can be used to
   * generate URLs with typed parameters.
   *
   * @param {string} name  The type name.
   * @param {Object|Function} definition   The type definition. See
   *        {@link ui.router.util.type:Type `Type`} for information on the values accepted.
   * @param {Object|Function} definitionFn (optional) A function that is injected before the app
   *        runtime starts.  The result of this function is merged into the existing `definition`.
   *        See {@link ui.router.util.type:Type `Type`} for information on the values accepted.
   *
   * @returns {Object}  Returns `$urlMatcherFactoryProvider`.
   *
   * @example
   * This is a simple example of a custom type that encodes and decodes items from an
   * array, using the array index as the URL-encoded value:
   *
   * <pre>
   * var list = ['John', 'Paul', 'George', 'Ringo'];
   *
   * $urlMatcherFactoryProvider.type('listItem', {
   *   encode: function(item) {
   *     // Represent the list item in the URL using its corresponding index
   *     return list.indexOf(item);
   *   },
   *   decode: function(item) {
   *     // Look up the list item by index
   *     return list[parseInt(item, 10)];
   *   },
   *   is: function(item) {
   *     // Ensure the item is valid by checking to see that it appears
   *     // in the list
   *     return list.indexOf(item) > -1;
   *   }
   * });
   *
   * $stateProvider.state('list', {
   *   url: "/list/{item:listItem}",
   *   controller: function($scope, $stateParams) {
   *     console.log($stateParams.item);
   *   }
   * });
   *
   * // ...
   *
   * // Changes URL to '/list/3', logs "Ringo" to the console
   * $state.go('list', { item: "Ringo" });
   * </pre>
   *
   * This is a more complex example of a type that relies on dependency injection to
   * interact with services, and uses the parameter name from the URL to infer how to
   * handle encoding and decoding parameter values:
   *
   * <pre>
   * // Defines a custom type that gets a value from a service,
   * // where each service gets different types of values from
   * // a backend API:
   * $urlMatcherFactoryProvider.type('dbObject', {}, function(Users, Posts) {
   *
   *   // Matches up services to URL parameter names
   *   var services = {
   *     user: Users,
   *     post: Posts
   *   };
   *
   *   return {
   *     encode: function(object) {
   *       // Represent the object in the URL using its unique ID
   *       return object.id;
   *     },
   *     decode: function(value, key) {
   *       // Look up the object by ID, using the parameter
   *       // name (key) to call the correct service
   *       return services[key].findById(value);
   *     },
   *     is: function(object, key) {
   *       // Check that object is a valid dbObject
   *       return angular.isObject(object) && object.id && services[key];
   *     }
   *     equals: function(a, b) {
   *       // Check the equality of decoded objects by comparing
   *       // their unique IDs
   *       return a.id === b.id;
   *     }
   *   };
   * });
   *
   * // In a config() block, you can then attach URLs with
   * // type-annotated parameters:
   * $stateProvider.state('users', {
   *   url: "/users",
   *   // ...
   * }).state('users.item', {
   *   url: "/{user:dbObject}",
   *   controller: function($scope, $stateParams) {
   *     // $stateParams.user will now be an object returned from
   *     // the Users service
   *   },
   *   // ...
   * });
   * </pre>
   */
  this.type = function (name, definition, definitionFn) {
    if (!isDefined(definition)) return $types[name];
    if ($types.hasOwnProperty(name)) throw new Error("A type named '" + name + "' has already been defined.");

    $types[name] = new Type(extend({ name: name }, definition));
    if (definitionFn) {
      typeQueue.push({ name: name, def: definitionFn });
      if (!enqueue) flushTypeQueue();
    }
    return this;
  };

  // `flushTypeQueue()` waits until `$urlMatcherFactory` is injected before invoking the queued `definitionFn`s
  function flushTypeQueue() {
    while(typeQueue.length) {
      var type = typeQueue.shift();
      if (type.pattern) throw new Error("You cannot override a type's .pattern at runtime.");
      angular.extend($types[type.name], injector.invoke(type.def));
    }
  }

  // Register default types. Store them in the prototype of $types.
  forEach(defaultTypes, function(type, name) { $types[name] = new Type(extend({name: name}, type)); });
  $types = inherit($types, {});

  /* No need to document $get, since it returns this */
  this.$get = ['$injector', function ($injector) {
    injector = $injector;
    enqueue = false;
    flushTypeQueue();

    forEach(defaultTypes, function(type, name) {
      if (!$types[name]) $types[name] = new Type(type);
    });
    return this;
  }];

  this.Param = function Param(id, type, config, location) {
    var self = this;
    config = unwrapShorthand(config);
    type = getType(config, type, location);
    var arrayMode = getArrayMode();
    type = arrayMode ? type.$asArray(arrayMode, location === "search") : type;
    if (type.name === "string" && !arrayMode && location === "path" && config.value === undefined)
      config.value = ""; // for 0.2.x; in 0.3.0+ do not automatically default to ""
    var isOptional = config.value !== undefined;
    var squash = getSquashPolicy(config, isOptional);
    var replace = getReplace(config, arrayMode, isOptional, squash);

    function unwrapShorthand(config) {
      var keys = isObject(config) ? objectKeys(config) : [];
      var isShorthand = indexOf(keys, "value") === -1 && indexOf(keys, "type") === -1 &&
                        indexOf(keys, "squash") === -1 && indexOf(keys, "array") === -1;
      if (isShorthand) config = { value: config };
      config.$$fn = isInjectable(config.value) ? config.value : function () { return config.value; };
      return config;
    }

    function getType(config, urlType, location) {
      if (config.type && urlType) throw new Error("Param '"+id+"' has two type configurations.");
      if (urlType) return urlType;
      if (!config.type) return (location === "config" ? $types.any : $types.string);

      if (angular.isString(config.type))
        return $types[config.type];
      if (config.type instanceof Type)
        return config.type;
      return new Type(config.type);
    }

    // array config: param name (param[]) overrides default settings.  explicit config overrides param name.
    function getArrayMode() {
      var arrayDefaults = { array: (location === "search" ? "auto" : false) };
      var arrayParamNomenclature = id.match(/\[\]$/) ? { array: true } : {};
      return extend(arrayDefaults, arrayParamNomenclature, config).array;
    }

    /**
     * returns false, true, or the squash value to indicate the "default parameter url squash policy".
     */
    function getSquashPolicy(config, isOptional) {
      var squash = config.squash;
      if (!isOptional || squash === false) return false;
      if (!isDefined(squash) || squash == null) return defaultSquashPolicy;
      if (squash === true || isString(squash)) return squash;
      throw new Error("Invalid squash policy: '" + squash + "'. Valid policies: false, true, or arbitrary string");
    }

    function getReplace(config, arrayMode, isOptional, squash) {
      var replace, configuredKeys, defaultPolicy = [
        { from: "",   to: (isOptional || arrayMode ? undefined : "") },
        { from: null, to: (isOptional || arrayMode ? undefined : "") }
      ];
      replace = isArray(config.replace) ? config.replace : [];
      if (isString(squash))
        replace.push({ from: squash, to: undefined });
      configuredKeys = map(replace, function(item) { return item.from; } );
      return filter(defaultPolicy, function(item) { return indexOf(configuredKeys, item.from) === -1; }).concat(replace);
    }

    /**
     * [Internal] Get the default value of a parameter, which may be an injectable function.
     */
    function $$getDefaultValue() {
      if (!injector) throw new Error("Injectable functions cannot be called at configuration time");
      var defaultValue = injector.invoke(config.$$fn);
      if (defaultValue !== null && defaultValue !== undefined && !self.type.is(defaultValue))
        throw new Error("Default value (" + defaultValue + ") for parameter '" + self.id + "' is not an instance of Type (" + self.type.name + ")");
      return defaultValue;
    }

    /**
     * [Internal] Gets the decoded representation of a value if the value is defined, otherwise, returns the
     * default value, which may be the result of an injectable function.
     */
    function $value(value) {
      function hasReplaceVal(val) { return function(obj) { return obj.from === val; }; }
      function $replace(value) {
        var replacement = map(filter(self.replace, hasReplaceVal(value)), function(obj) { return obj.to; });
        return replacement.length ? replacement[0] : value;
      }
      value = $replace(value);
      return !isDefined(value) ? $$getDefaultValue() : self.type.$normalize(value);
    }

    function toString() { return "{Param:" + id + " " + type + " squash: '" + squash + "' optional: " + isOptional + "}"; }

    extend(this, {
      id: id,
      type: type,
      location: location,
      array: arrayMode,
      squash: squash,
      replace: replace,
      isOptional: isOptional,
      value: $value,
      dynamic: undefined,
      config: config,
      toString: toString
    });
  };

  function ParamSet(params) {
    extend(this, params || {});
  }

  ParamSet.prototype = {
    $$new: function() {
      return inherit(this, extend(new ParamSet(), { $$parent: this}));
    },
    $$keys: function () {
      var keys = [], chain = [], parent = this,
        ignore = objectKeys(ParamSet.prototype);
      while (parent) { chain.push(parent); parent = parent.$$parent; }
      chain.reverse();
      forEach(chain, function(paramset) {
        forEach(objectKeys(paramset), function(key) {
            if (indexOf(keys, key) === -1 && indexOf(ignore, key) === -1) keys.push(key);
        });
      });
      return keys;
    },
    $$values: function(paramValues) {
      var values = {}, self = this;
      forEach(self.$$keys(), function(key) {
        values[key] = self[key].value(paramValues && paramValues[key]);
      });
      return values;
    },
    $$equals: function(paramValues1, paramValues2) {
      var equal = true, self = this;
      forEach(self.$$keys(), function(key) {
        var left = paramValues1 && paramValues1[key], right = paramValues2 && paramValues2[key];
        if (!self[key].type.equals(left, right)) equal = false;
      });
      return equal;
    },
    $$validates: function $$validate(paramValues) {
      var keys = this.$$keys(), i, param, rawVal, normalized, encoded;
      for (i = 0; i < keys.length; i++) {
        param = this[keys[i]];
        rawVal = paramValues[keys[i]];
        if ((rawVal === undefined || rawVal === null) && param.isOptional)
          break; // There was no parameter value, but the param is optional
        normalized = param.type.$normalize(rawVal);
        if (!param.type.is(normalized))
          return false; // The value was not of the correct Type, and could not be decoded to the correct Type
        encoded = param.type.encode(normalized);
        if (angular.isString(encoded) && !param.type.pattern.exec(encoded))
          return false; // The value was of the correct type, but when encoded, did not match the Type's regexp
      }
      return true;
    },
    $$parent: undefined
  };

  this.ParamSet = ParamSet;
}

// Register as a provider so it's available to other providers
angular.module('ui.router.util').provider('$urlMatcherFactory', $UrlMatcherFactory);
angular.module('ui.router.util').run(['$urlMatcherFactory', function($urlMatcherFactory) { }]);

/**
 * @ngdoc object
 * @name ui.router.router.$urlRouterProvider
 *
 * @requires ui.router.util.$urlMatcherFactoryProvider
 * @requires $locationProvider
 *
 * @description
 * `$urlRouterProvider` has the responsibility of watching `$location`. 
 * When `$location` changes it runs through a list of rules one by one until a 
 * match is found. `$urlRouterProvider` is used behind the scenes anytime you specify 
 * a url in a state configuration. All urls are compiled into a UrlMatcher object.
 *
 * There are several methods on `$urlRouterProvider` that make it useful to use directly
 * in your module config.
 */
$UrlRouterProvider.$inject = ['$locationProvider', '$urlMatcherFactoryProvider'];
function $UrlRouterProvider(   $locationProvider,   $urlMatcherFactory) {
  var rules = [], otherwise = null, interceptDeferred = false, listener;

  // Returns a string that is a prefix of all strings matching the RegExp
  function regExpPrefix(re) {
    var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
    return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
  }

  // Interpolates matched values into a String.replace()-style pattern
  function interpolate(pattern, match) {
    return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
      return match[what === '$' ? 0 : Number(what)];
    });
  }

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#rule
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Defines rules that are used by `$urlRouterProvider` to find matches for
   * specific URLs.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   // Here's an example of how you might allow case insensitive urls
   *   $urlRouterProvider.rule(function ($injector, $location) {
   *     var path = $location.path(),
   *         normalized = path.toLowerCase();
   *
   *     if (path !== normalized) {
   *       return normalized;
   *     }
   *   });
   * });
   * </pre>
   *
   * @param {function} rule Handler function that takes `$injector` and `$location`
   * services as arguments. You can use them to return a valid path as a string.
   *
   * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
   */
  this.rule = function (rule) {
    if (!isFunction(rule)) throw new Error("'rule' must be a function");
    rules.push(rule);
    return this;
  };

  /**
   * @ngdoc object
   * @name ui.router.router.$urlRouterProvider#otherwise
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Defines a path that is used when an invalid route is requested.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   // if the path doesn't match any of the urls you configured
   *   // otherwise will take care of routing the user to the
   *   // specified url
   *   $urlRouterProvider.otherwise('/index');
   *
   *   // Example of using function rule as param
   *   $urlRouterProvider.otherwise(function ($injector, $location) {
   *     return '/a/valid/url';
   *   });
   * });
   * </pre>
   *
   * @param {string|function} rule The url path you want to redirect to or a function 
   * rule that returns the url path. The function version is passed two params: 
   * `$injector` and `$location` services, and must return a url string.
   *
   * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
   */
  this.otherwise = function (rule) {
    if (isString(rule)) {
      var redirect = rule;
      rule = function () { return redirect; };
    }
    else if (!isFunction(rule)) throw new Error("'rule' must be a function");
    otherwise = rule;
    return this;
  };


  function handleIfMatch($injector, handler, match) {
    if (!match) return false;
    var result = $injector.invoke(handler, handler, { $match: match });
    return isDefined(result) ? result : true;
  }

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#when
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Registers a handler for a given url matching. 
   * 
   * If the handler is a string, it is
   * treated as a redirect, and is interpolated according to the syntax of match
   * (i.e. like `String.replace()` for `RegExp`, or like a `UrlMatcher` pattern otherwise).
   *
   * If the handler is a function, it is injectable. It gets invoked if `$location`
   * matches. You have the option of inject the match object as `$match`.
   *
   * The handler can return
   *
   * - **falsy** to indicate that the rule didn't match after all, then `$urlRouter`
   *   will continue trying to find another one that matches.
   * - **string** which is treated as a redirect and passed to `$location.url()`
   * - **void** or any **truthy** value tells `$urlRouter` that the url was handled.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   $urlRouterProvider.when($state.url, function ($match, $stateParams) {
   *     if ($state.$current.navigable !== state ||
   *         !equalForKeys($match, $stateParams) {
   *      $state.transitionTo(state, $match, false);
   *     }
   *   });
   * });
   * </pre>
   *
   * @param {string|object} what The incoming path that you want to redirect.
   * @param {string|function} handler The path you want to redirect your user to.
   */
  this.when = function (what, handler) {
    var redirect, handlerIsString = isString(handler);
    if (isString(what)) what = $urlMatcherFactory.compile(what);

    if (!handlerIsString && !isFunction(handler) && !isArray(handler))
      throw new Error("invalid 'handler' in when()");

    var strategies = {
      matcher: function (what, handler) {
        if (handlerIsString) {
          redirect = $urlMatcherFactory.compile(handler);
          handler = ['$match', function ($match) { return redirect.format($match); }];
        }
        return extend(function ($injector, $location) {
          return handleIfMatch($injector, handler, what.exec($location.path(), $location.search()));
        }, {
          prefix: isString(what.prefix) ? what.prefix : ''
        });
      },
      regex: function (what, handler) {
        if (what.global || what.sticky) throw new Error("when() RegExp must not be global or sticky");

        if (handlerIsString) {
          redirect = handler;
          handler = ['$match', function ($match) { return interpolate(redirect, $match); }];
        }
        return extend(function ($injector, $location) {
          return handleIfMatch($injector, handler, what.exec($location.path()));
        }, {
          prefix: regExpPrefix(what)
        });
      }
    };

    var check = { matcher: $urlMatcherFactory.isMatcher(what), regex: what instanceof RegExp };

    for (var n in check) {
      if (check[n]) return this.rule(strategies[n](what, handler));
    }

    throw new Error("invalid 'what' in when()");
  };

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#deferIntercept
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Disables (or enables) deferring location change interception.
   *
   * If you wish to customize the behavior of syncing the URL (for example, if you wish to
   * defer a transition but maintain the current URL), call this method at configuration time.
   * Then, at run time, call `$urlRouter.listen()` after you have configured your own
   * `$locationChangeSuccess` event handler.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *
   *   // Prevent $urlRouter from automatically intercepting URL changes;
   *   // this allows you to configure custom behavior in between
   *   // location changes and route synchronization:
   *   $urlRouterProvider.deferIntercept();
   *
   * }).run(function ($rootScope, $urlRouter, UserService) {
   *
   *   $rootScope.$on('$locationChangeSuccess', function(e) {
   *     // UserService is an example service for managing user state
   *     if (UserService.isLoggedIn()) return;
   *
   *     // Prevent $urlRouter's default handler from firing
   *     e.preventDefault();
   *
   *     UserService.handleLogin().then(function() {
   *       // Once the user has logged in, sync the current URL
   *       // to the router:
   *       $urlRouter.sync();
   *     });
   *   });
   *
   *   // Configures $urlRouter's listener *after* your custom listener
   *   $urlRouter.listen();
   * });
   * </pre>
   *
   * @param {boolean} defer Indicates whether to defer location change interception. Passing
            no parameter is equivalent to `true`.
   */
  this.deferIntercept = function (defer) {
    if (defer === undefined) defer = true;
    interceptDeferred = defer;
  };

  /**
   * @ngdoc object
   * @name ui.router.router.$urlRouter
   *
   * @requires $location
   * @requires $rootScope
   * @requires $injector
   * @requires $browser
   *
   * @description
   *
   */
  this.$get = $get;
  $get.$inject = ['$location', '$rootScope', '$injector', '$browser', '$sniffer'];
  function $get(   $location,   $rootScope,   $injector,   $browser,   $sniffer) {

    var baseHref = $browser.baseHref(), location = $location.url(), lastPushedUrl;

    function appendBasePath(url, isHtml5, absolute) {
      if (baseHref === '/') return url;
      if (isHtml5) return baseHref.slice(0, -1) + url;
      if (absolute) return baseHref.slice(1) + url;
      return url;
    }

    // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
    function update(evt) {
      if (evt && evt.defaultPrevented) return;
      var ignoreUpdate = lastPushedUrl && $location.url() === lastPushedUrl;
      lastPushedUrl = undefined;
      // TODO: Re-implement this in 1.0 for https://github.com/angular-ui/ui-router/issues/1573
      //if (ignoreUpdate) return true;

      function check(rule) {
        var handled = rule($injector, $location);

        if (!handled) return false;
        if (isString(handled)) $location.replace().url(handled);
        return true;
      }
      var n = rules.length, i;

      for (i = 0; i < n; i++) {
        if (check(rules[i])) return;
      }
      // always check otherwise last to allow dynamic updates to the set of rules
      if (otherwise) check(otherwise);
    }

    function listen() {
      listener = listener || $rootScope.$on('$locationChangeSuccess', update);
      return listener;
    }

    if (!interceptDeferred) listen();

    return {
      /**
       * @ngdoc function
       * @name ui.router.router.$urlRouter#sync
       * @methodOf ui.router.router.$urlRouter
       *
       * @description
       * Triggers an update; the same update that happens when the address bar url changes, aka `$locationChangeSuccess`.
       * This method is useful when you need to use `preventDefault()` on the `$locationChangeSuccess` event,
       * perform some custom logic (route protection, auth, config, redirection, etc) and then finally proceed
       * with the transition by calling `$urlRouter.sync()`.
       *
       * @example
       * <pre>
       * angular.module('app', ['ui.router'])
       *   .run(function($rootScope, $urlRouter) {
       *     $rootScope.$on('$locationChangeSuccess', function(evt) {
       *       // Halt state change from even starting
       *       evt.preventDefault();
       *       // Perform custom logic
       *       var meetsRequirement = ...
       *       // Continue with the update and state transition if logic allows
       *       if (meetsRequirement) $urlRouter.sync();
       *     });
       * });
       * </pre>
       */
      sync: function() {
        update();
      },

      listen: function() {
        return listen();
      },

      update: function(read) {
        if (read) {
          location = $location.url();
          return;
        }
        if ($location.url() === location) return;

        $location.url(location);
        $location.replace();
      },

      push: function(urlMatcher, params, options) {
         var url = urlMatcher.format(params || {});

        // Handle the special hash param, if needed
        if (url !== null && params && params['#']) {
            url += '#' + params['#'];
        }

        $location.url(url);
        lastPushedUrl = options && options.$$avoidResync ? $location.url() : undefined;
        if (options && options.replace) $location.replace();
      },

      /**
       * @ngdoc function
       * @name ui.router.router.$urlRouter#href
       * @methodOf ui.router.router.$urlRouter
       *
       * @description
       * A URL generation method that returns the compiled URL for a given
       * {@link ui.router.util.type:UrlMatcher `UrlMatcher`}, populated with the provided parameters.
       *
       * @example
       * <pre>
       * $bob = $urlRouter.href(new UrlMatcher("/about/:person"), {
       *   person: "bob"
       * });
       * // $bob == "/about/bob";
       * </pre>
       *
       * @param {UrlMatcher} urlMatcher The `UrlMatcher` object which is used as the template of the URL to generate.
       * @param {object=} params An object of parameter values to fill the matcher's required parameters.
       * @param {object=} options Options object. The options are:
       *
       * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
       *
       * @returns {string} Returns the fully compiled URL, or `null` if `params` fail validation against `urlMatcher`
       */
      href: function(urlMatcher, params, options) {
        if (!urlMatcher.validates(params)) return null;

        var isHtml5 = $locationProvider.html5Mode();
        if (angular.isObject(isHtml5)) {
          isHtml5 = isHtml5.enabled;
        }

        isHtml5 = isHtml5 && $sniffer.history;
        
        var url = urlMatcher.format(params);
        options = options || {};

        if (!isHtml5 && url !== null) {
          url = "#" + $locationProvider.hashPrefix() + url;
        }

        // Handle special hash param, if needed
        if (url !== null && params && params['#']) {
          url += '#' + params['#'];
        }

        url = appendBasePath(url, isHtml5, options.absolute);

        if (!options.absolute || !url) {
          return url;
        }

        var slash = (!isHtml5 && url ? '/' : ''), port = $location.port();
        port = (port === 80 || port === 443 ? '' : ':' + port);

        return [$location.protocol(), '://', $location.host(), port, slash, url].join('');
      }
    };
  }
}

angular.module('ui.router.router').provider('$urlRouter', $UrlRouterProvider);

/**
 * @ngdoc object
 * @name ui.router.state.$stateProvider
 *
 * @requires ui.router.router.$urlRouterProvider
 * @requires ui.router.util.$urlMatcherFactoryProvider
 *
 * @description
 * The new `$stateProvider` works similar to Angular's v1 router, but it focuses purely
 * on state.
 *
 * A state corresponds to a "place" in the application in terms of the overall UI and
 * navigation. A state describes (via the controller / template / view properties) what
 * the UI looks like and does at that place.
 *
 * States often have things in common, and the primary way of factoring out these
 * commonalities in this model is via the state hierarchy, i.e. parent/child states aka
 * nested states.
 *
 * The `$stateProvider` provides interfaces to declare these states for your app.
 */
$StateProvider.$inject = ['$urlRouterProvider', '$urlMatcherFactoryProvider'];
function $StateProvider(   $urlRouterProvider,   $urlMatcherFactory) {

  var root, states = {}, $state, queue = {}, abstractKey = 'abstract';

  // Builds state properties from definition passed to registerState()
  var stateBuilder = {

    // Derive parent state from a hierarchical name only if 'parent' is not explicitly defined.
    // state.children = [];
    // if (parent) parent.children.push(state);
    parent: function(state) {
      if (isDefined(state.parent) && state.parent) return findState(state.parent);
      // regex matches any valid composite state name
      // would match "contact.list" but not "contacts"
      var compositeName = /^(.+)\.[^.]+$/.exec(state.name);
      return compositeName ? findState(compositeName[1]) : root;
    },

    // inherit 'data' from parent and override by own values (if any)
    data: function(state) {
      if (state.parent && state.parent.data) {
        state.data = state.self.data = inherit(state.parent.data, state.data);
      }
      return state.data;
    },

    // Build a URLMatcher if necessary, either via a relative or absolute URL
    url: function(state) {
      var url = state.url, config = { params: state.params || {} };

      if (isString(url)) {
        if (url.charAt(0) == '^') return $urlMatcherFactory.compile(url.substring(1), config);
        return (state.parent.navigable || root).url.concat(url, config);
      }

      if (!url || $urlMatcherFactory.isMatcher(url)) return url;
      throw new Error("Invalid url '" + url + "' in state '" + state + "'");
    },

    // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
    navigable: function(state) {
      return state.url ? state : (state.parent ? state.parent.navigable : null);
    },

    // Own parameters for this state. state.url.params is already built at this point. Create and add non-url params
    ownParams: function(state) {
      var params = state.url && state.url.params || new $$UMFP.ParamSet();
      forEach(state.params || {}, function(config, id) {
        if (!params[id]) params[id] = new $$UMFP.Param(id, null, config, "config");
      });
      return params;
    },

    // Derive parameters for this state and ensure they're a super-set of parent's parameters
    params: function(state) {
      var ownParams = pick(state.ownParams, state.ownParams.$$keys());
      return state.parent && state.parent.params ? extend(state.parent.params.$$new(), ownParams) : new $$UMFP.ParamSet();
    },

    // If there is no explicit multi-view configuration, make one up so we don't have
    // to handle both cases in the view directive later. Note that having an explicit
    // 'views' property will mean the default unnamed view properties are ignored. This
    // is also a good time to resolve view names to absolute names, so everything is a
    // straight lookup at link time.
    views: function(state) {
      var views = {};

      forEach(isDefined(state.views) ? state.views : { '': state }, function (view, name) {
        if (name.indexOf('@') < 0) name += '@' + state.parent.name;
        view.resolveAs = view.resolveAs || state.resolveAs || '$resolve';
        views[name] = view;
      });
      return views;
    },

    // Keep a full path from the root down to this state as this is needed for state activation.
    path: function(state) {
      return state.parent ? state.parent.path.concat(state) : []; // exclude root from path
    },

    // Speed up $state.contains() as it's used a lot
    includes: function(state) {
      var includes = state.parent ? extend({}, state.parent.includes) : {};
      includes[state.name] = true;
      return includes;
    },

    $delegates: {}
  };

  function isRelative(stateName) {
    return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
  }

  function findState(stateOrName, base) {
    if (!stateOrName) return undefined;

    var isStr = isString(stateOrName),
        name  = isStr ? stateOrName : stateOrName.name,
        path  = isRelative(name);

    if (path) {
      if (!base) throw new Error("No reference point given for path '"  + name + "'");
      base = findState(base);
      
      var rel = name.split("."), i = 0, pathLength = rel.length, current = base;

      for (; i < pathLength; i++) {
        if (rel[i] === "" && i === 0) {
          current = base;
          continue;
        }
        if (rel[i] === "^") {
          if (!current.parent) throw new Error("Path '" + name + "' not valid for state '" + base.name + "'");
          current = current.parent;
          continue;
        }
        break;
      }
      rel = rel.slice(i).join(".");
      name = current.name + (current.name && rel ? "." : "") + rel;
    }
    var state = states[name];

    if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
      return state;
    }
    return undefined;
  }

  function queueState(parentName, state) {
    if (!queue[parentName]) {
      queue[parentName] = [];
    }
    queue[parentName].push(state);
  }

  function flushQueuedChildren(parentName) {
    var queued = queue[parentName] || [];
    while(queued.length) {
      registerState(queued.shift());
    }
  }

  function registerState(state) {
    // Wrap a new object around the state so we can store our private details easily.
    state = inherit(state, {
      self: state,
      resolve: state.resolve || {},
      toString: function() { return this.name; }
    });

    var name = state.name;
    if (!isString(name) || name.indexOf('@') >= 0) throw new Error("State must have a valid name");
    if (states.hasOwnProperty(name)) throw new Error("State '" + name + "' is already defined");

    // Get parent name
    var parentName = (name.indexOf('.') !== -1) ? name.substring(0, name.lastIndexOf('.'))
        : (isString(state.parent)) ? state.parent
        : (isObject(state.parent) && isString(state.parent.name)) ? state.parent.name
        : '';

    // If parent is not registered yet, add state to queue and register later
    if (parentName && !states[parentName]) {
      return queueState(parentName, state.self);
    }

    for (var key in stateBuilder) {
      if (isFunction(stateBuilder[key])) state[key] = stateBuilder[key](state, stateBuilder.$delegates[key]);
    }
    states[name] = state;

    // Register the state in the global state list and with $urlRouter if necessary.
    if (!state[abstractKey] && state.url) {
      $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
        if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
          $state.transitionTo(state, $match, { inherit: true, location: false });
        }
      }]);
    }

    // Register any queued children
    flushQueuedChildren(name);

    return state;
  }

  // Checks text to see if it looks like a glob.
  function isGlob (text) {
    return text.indexOf('*') > -1;
  }

  // Returns true if glob matches current $state name.
  function doesStateMatchGlob (glob) {
    var globSegments = glob.split('.'),
        segments = $state.$current.name.split('.');

    //match single stars
    for (var i = 0, l = globSegments.length; i < l; i++) {
      if (globSegments[i] === '*') {
        segments[i] = '*';
      }
    }

    //match greedy starts
    if (globSegments[0] === '**') {
       segments = segments.slice(indexOf(segments, globSegments[1]));
       segments.unshift('**');
    }
    //match greedy ends
    if (globSegments[globSegments.length - 1] === '**') {
       segments.splice(indexOf(segments, globSegments[globSegments.length - 2]) + 1, Number.MAX_VALUE);
       segments.push('**');
    }

    if (globSegments.length != segments.length) {
      return false;
    }

    return segments.join('') === globSegments.join('');
  }


  // Implicit root state that is always active
  root = registerState({
    name: '',
    url: '^',
    views: null,
    'abstract': true
  });
  root.navigable = null;


  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#decorator
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Allows you to extend (carefully) or override (at your own peril) the 
   * `stateBuilder` object used internally by `$stateProvider`. This can be used 
   * to add custom functionality to ui-router, for example inferring templateUrl 
   * based on the state name.
   *
   * When passing only a name, it returns the current (original or decorated) builder
   * function that matches `name`.
   *
   * The builder functions that can be decorated are listed below. Though not all
   * necessarily have a good use case for decoration, that is up to you to decide.
   *
   * In addition, users can attach custom decorators, which will generate new 
   * properties within the state's internal definition. There is currently no clear 
   * use-case for this beyond accessing internal states (i.e. $state.$current), 
   * however, expect this to become increasingly relevant as we introduce additional 
   * meta-programming features.
   *
   * **Warning**: Decorators should not be interdependent because the order of 
   * execution of the builder functions in non-deterministic. Builder functions 
   * should only be dependent on the state definition object and super function.
   *
   *
   * Existing builder functions and current return values:
   *
   * - **parent** `{object}` - returns the parent state object.
   * - **data** `{object}` - returns state data, including any inherited data that is not
   *   overridden by own values (if any).
   * - **url** `{object}` - returns a {@link ui.router.util.type:UrlMatcher UrlMatcher}
   *   or `null`.
   * - **navigable** `{object}` - returns closest ancestor state that has a URL (aka is 
   *   navigable).
   * - **params** `{object}` - returns an array of state params that are ensured to 
   *   be a super-set of parent's params.
   * - **views** `{object}` - returns a views object where each key is an absolute view 
   *   name (i.e. "viewName@stateName") and each value is the config object 
   *   (template, controller) for the view. Even when you don't use the views object 
   *   explicitly on a state config, one is still created for you internally.
   *   So by decorating this builder function you have access to decorating template 
   *   and controller properties.
   * - **ownParams** `{object}` - returns an array of params that belong to the state, 
   *   not including any params defined by ancestor states.
   * - **path** `{string}` - returns the full path from the root down to this state. 
   *   Needed for state activation.
   * - **includes** `{object}` - returns an object that includes every state that 
   *   would pass a `$state.includes()` test.
   *
   * @example
   * <pre>
   * // Override the internal 'views' builder with a function that takes the state
   * // definition, and a reference to the internal function being overridden:
   * $stateProvider.decorator('views', function (state, parent) {
   *   var result = {},
   *       views = parent(state);
   *
   *   angular.forEach(views, function (config, name) {
   *     var autoName = (state.name + '.' + name).replace('.', '/');
   *     config.templateUrl = config.templateUrl || '/partials/' + autoName + '.html';
   *     result[name] = config;
   *   });
   *   return result;
   * });
   *
   * $stateProvider.state('home', {
   *   views: {
   *     'contact.list': { controller: 'ListController' },
   *     'contact.item': { controller: 'ItemController' }
   *   }
   * });
   *
   * // ...
   *
   * $state.go('home');
   * // Auto-populates list and item views with /partials/home/contact/list.html,
   * // and /partials/home/contact/item.html, respectively.
   * </pre>
   *
   * @param {string} name The name of the builder function to decorate. 
   * @param {object} func A function that is responsible for decorating the original 
   * builder function. The function receives two parameters:
   *
   *   - `{object}` - state - The state config object.
   *   - `{object}` - super - The original builder function.
   *
   * @return {object} $stateProvider - $stateProvider instance
   */
  this.decorator = decorator;
  function decorator(name, func) {
    /*jshint validthis: true */
    if (isString(name) && !isDefined(func)) {
      return stateBuilder[name];
    }
    if (!isFunction(func) || !isString(name)) {
      return this;
    }
    if (stateBuilder[name] && !stateBuilder.$delegates[name]) {
      stateBuilder.$delegates[name] = stateBuilder[name];
    }
    stateBuilder[name] = func;
    return this;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#state
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Registers a state configuration under a given state name. The stateConfig object
   * has the following acceptable properties.
   *
   * @param {string} name A unique state name, e.g. "home", "about", "contacts".
   * To create a parent/child state use a dot, e.g. "about.sales", "home.newest".
   * @param {object} stateConfig State configuration object.
   * @param {string|function=} stateConfig.template
   * <a id='template'></a>
   *   html template as a string or a function that returns
   *   an html template as a string which should be used by the uiView directives. This property 
   *   takes precedence over templateUrl.
   *   
   *   If `template` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
   *     applying the current state
   *
   * <pre>template:
   *   "<h1>inline template definition</h1>" +
   *   "<div ui-view></div>"</pre>
   * <pre>template: function(params) {
   *       return "<h1>generated template</h1>"; }</pre>
   * </div>
   *
   * @param {string|function=} stateConfig.templateUrl
   * <a id='templateUrl'></a>
   *
   *   path or function that returns a path to an html
   *   template that should be used by uiView.
   *   
   *   If `templateUrl` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by 
   *     applying the current state
   *
   * <pre>templateUrl: "home.html"</pre>
   * <pre>templateUrl: function(params) {
   *     return myTemplates[params.pageId]; }</pre>
   *
   * @param {function=} stateConfig.templateProvider
   * <a id='templateProvider'></a>
   *    Provider function that returns HTML content string.
   * <pre> templateProvider:
   *       function(MyTemplateService, params) {
   *         return MyTemplateService.getTemplate(params.pageId);
   *       }</pre>
   *
   * @param {string|function=} stateConfig.controller
   * <a id='controller'></a>
   *
   *  Controller fn that should be associated with newly
   *   related scope or the name of a registered controller if passed as a string.
   *   Optionally, the ControllerAs may be declared here.
   * <pre>controller: "MyRegisteredController"</pre>
   * <pre>controller:
   *     "MyRegisteredController as fooCtrl"}</pre>
   * <pre>controller: function($scope, MyService) {
   *     $scope.data = MyService.getData(); }</pre>
   *
   * @param {function=} stateConfig.controllerProvider
   * <a id='controllerProvider'></a>
   *
   * Injectable provider function that returns the actual controller or string.
   * <pre>controllerProvider:
   *   function(MyResolveData) {
   *     if (MyResolveData.foo)
   *       return "FooCtrl"
   *     else if (MyResolveData.bar)
   *       return "BarCtrl";
   *     else return function($scope) {
   *       $scope.baz = "Qux";
   *     }
   *   }</pre>
   *
   * @param {string=} stateConfig.controllerAs
   * <a id='controllerAs'></a>
   * 
   * A controller alias name. If present the controller will be
   *   published to scope under the controllerAs name.
   * <pre>controllerAs: "myCtrl"</pre>
   *
   * @param {string|object=} stateConfig.parent
   * <a id='parent'></a>
   * Optionally specifies the parent state of this state.
   *
   * <pre>parent: 'parentState'</pre>
   * <pre>parent: parentState // JS variable</pre>
   *
   * @param {object=} stateConfig.resolve
   * <a id='resolve'></a>
   *
   * An optional map&lt;string, function&gt; of dependencies which
   *   should be injected into the controller. If any of these dependencies are promises, 
   *   the router will wait for them all to be resolved before the controller is instantiated.
   *   If all the promises are resolved successfully, the $stateChangeSuccess event is fired
   *   and the values of the resolved promises are injected into any controllers that reference them.
   *   If any  of the promises are rejected the $stateChangeError event is fired.
   *
   *   The map object is:
   *   
   *   - key - {string}: name of dependency to be injected into controller
   *   - factory - {string|function}: If string then it is alias for service. Otherwise if function, 
   *     it is injected and return value it treated as dependency. If result is a promise, it is 
   *     resolved before its value is injected into controller.
   *
   * <pre>resolve: {
   *     myResolve1:
   *       function($http, $stateParams) {
   *         return $http.get("/api/foos/"+stateParams.fooID);
   *       }
   *     }</pre>
   *
   * @param {string=} stateConfig.url
   * <a id='url'></a>
   *
   *   A url fragment with optional parameters. When a state is navigated or
   *   transitioned to, the `$stateParams` service will be populated with any 
   *   parameters that were passed.
   *
   *   (See {@link ui.router.util.type:UrlMatcher UrlMatcher} `UrlMatcher`} for
   *   more details on acceptable patterns )
   *
   * examples:
   * <pre>url: "/home"
   * url: "/users/:userid"
   * url: "/books/{bookid:[a-zA-Z_-]}"
   * url: "/books/{categoryid:int}"
   * url: "/books/{publishername:string}/{categoryid:int}"
   * url: "/messages?before&after"
   * url: "/messages?{before:date}&{after:date}"
   * url: "/messages/:mailboxid?{before:date}&{after:date}"
   * </pre>
   *
   * @param {object=} stateConfig.views
   * <a id='views'></a>
   * an optional map&lt;string, object&gt; which defined multiple views, or targets views
   * manually/explicitly.
   *
   * Examples:
   *
   * Targets three named `ui-view`s in the parent state's template
   * <pre>views: {
   *     header: {
   *       controller: "headerCtrl",
   *       templateUrl: "header.html"
   *     }, body: {
   *       controller: "bodyCtrl",
   *       templateUrl: "body.html"
   *     }, footer: {
   *       controller: "footCtrl",
   *       templateUrl: "footer.html"
   *     }
   *   }</pre>
   *
   * Targets named `ui-view="header"` from grandparent state 'top''s template, and named `ui-view="body" from parent state's template.
   * <pre>views: {
   *     'header@top': {
   *       controller: "msgHeaderCtrl",
   *       templateUrl: "msgHeader.html"
   *     }, 'body': {
   *       controller: "messagesCtrl",
   *       templateUrl: "messages.html"
   *     }
   *   }</pre>
   *
   * @param {boolean=} [stateConfig.abstract=false]
   * <a id='abstract'></a>
   * An abstract state will never be directly activated,
   *   but can provide inherited properties to its common children states.
   * <pre>abstract: true</pre>
   *
   * @param {function=} stateConfig.onEnter
   * <a id='onEnter'></a>
   *
   * Callback function for when a state is entered. Good way
   *   to trigger an action or dispatch an event, such as opening a dialog.
   * If minifying your scripts, make sure to explicitly annotate this function,
   * because it won't be automatically annotated by your build tools.
   *
   * <pre>onEnter: function(MyService, $stateParams) {
   *     MyService.foo($stateParams.myParam);
   * }</pre>
   *
   * @param {function=} stateConfig.onExit
   * <a id='onExit'></a>
   *
   * Callback function for when a state is exited. Good way to
   *   trigger an action or dispatch an event, such as opening a dialog.
   * If minifying your scripts, make sure to explicitly annotate this function,
   * because it won't be automatically annotated by your build tools.
   *
   * <pre>onExit: function(MyService, $stateParams) {
   *     MyService.cleanup($stateParams.myParam);
   * }</pre>
   *
   * @param {boolean=} [stateConfig.reloadOnSearch=true]
   * <a id='reloadOnSearch'></a>
   *
   * If `false`, will not retrigger the same state
   *   just because a search/query parameter has changed (via $location.search() or $location.hash()). 
   *   Useful for when you'd like to modify $location.search() without triggering a reload.
   * <pre>reloadOnSearch: false</pre>
   *
   * @param {object=} stateConfig.data
   * <a id='data'></a>
   *
   * Arbitrary data object, useful for custom configuration.  The parent state's `data` is
   *   prototypally inherited.  In other words, adding a data property to a state adds it to
   *   the entire subtree via prototypal inheritance.
   *
   * <pre>data: {
   *     requiredRole: 'foo'
   * } </pre>
   *
   * @param {object=} stateConfig.params
   * <a id='params'></a>
   *
   * A map which optionally configures parameters declared in the `url`, or
   *   defines additional non-url parameters.  For each parameter being
   *   configured, add a configuration object keyed to the name of the parameter.
   *
   *   Each parameter configuration object may contain the following properties:
   *
   *   - ** value ** - {object|function=}: specifies the default value for this
   *     parameter.  This implicitly sets this parameter as optional.
   *
   *     When UI-Router routes to a state and no value is
   *     specified for this parameter in the URL or transition, the
   *     default value will be used instead.  If `value` is a function,
   *     it will be injected and invoked, and the return value used.
   *
   *     *Note*: `undefined` is treated as "no default value" while `null`
   *     is treated as "the default value is `null`".
   *
   *     *Shorthand*: If you only need to configure the default value of the
   *     parameter, you may use a shorthand syntax.   In the **`params`**
   *     map, instead mapping the param name to a full parameter configuration
   *     object, simply set map it to the default parameter value, e.g.:
   *
   * <pre>// define a parameter's default value
   * params: {
   *     param1: { value: "defaultValue" }
   * }
   * // shorthand default values
   * params: {
   *     param1: "defaultValue",
   *     param2: "param2Default"
   * }</pre>
   *
   *   - ** array ** - {boolean=}: *(default: false)* If true, the param value will be
   *     treated as an array of values.  If you specified a Type, the value will be
   *     treated as an array of the specified Type.  Note: query parameter values
   *     default to a special `"auto"` mode.
   *
   *     For query parameters in `"auto"` mode, if multiple  values for a single parameter
   *     are present in the URL (e.g.: `/foo?bar=1&bar=2&bar=3`) then the values
   *     are mapped to an array (e.g.: `{ foo: [ '1', '2', '3' ] }`).  However, if
   *     only one value is present (e.g.: `/foo?bar=1`) then the value is treated as single
   *     value (e.g.: `{ foo: '1' }`).
   *
   * <pre>params: {
   *     param1: { array: true }
   * }</pre>
   *
   *   - ** squash ** - {bool|string=}: `squash` configures how a default parameter value is represented in the URL when
   *     the current parameter value is the same as the default value. If `squash` is not set, it uses the
   *     configured default squash policy.
   *     (See {@link ui.router.util.$urlMatcherFactory#methods_defaultSquashPolicy `defaultSquashPolicy()`})
   *
   *   There are three squash settings:
   *
   *     - false: The parameter's default value is not squashed.  It is encoded and included in the URL
   *     - true: The parameter's default value is omitted from the URL.  If the parameter is preceeded and followed
   *       by slashes in the state's `url` declaration, then one of those slashes are omitted.
   *       This can allow for cleaner looking URLs.
   *     - `"<arbitrary string>"`: The parameter's default value is replaced with an arbitrary placeholder of  your choice.
   *
   * <pre>params: {
   *     param1: {
   *       value: "defaultId",
   *       squash: true
   * } }
   * // squash "defaultValue" to "~"
   * params: {
   *     param1: {
   *       value: "defaultValue",
   *       squash: "~"
   * } }
   * </pre>
   *
   *
   * @example
   * <pre>
   * // Some state name examples
   *
   * // stateName can be a single top-level name (must be unique).
   * $stateProvider.state("home", {});
   *
   * // Or it can be a nested state name. This state is a child of the
   * // above "home" state.
   * $stateProvider.state("home.newest", {});
   *
   * // Nest states as deeply as needed.
   * $stateProvider.state("home.newest.abc.xyz.inception", {});
   *
   * // state() returns $stateProvider, so you can chain state declarations.
   * $stateProvider
   *   .state("home", {})
   *   .state("about", {})
   *   .state("contacts", {});
   * </pre>
   *
   */
  this.state = state;
  function state(name, definition) {
    /*jshint validthis: true */
    if (isObject(name)) definition = name;
    else definition.name = name;
    registerState(definition);
    return this;
  }

  /**
   * @ngdoc object
   * @name ui.router.state.$state
   *
   * @requires $rootScope
   * @requires $q
   * @requires ui.router.state.$view
   * @requires $injector
   * @requires ui.router.util.$resolve
   * @requires ui.router.state.$stateParams
   * @requires ui.router.router.$urlRouter
   *
   * @property {object} params A param object, e.g. {sectionId: section.id)}, that 
   * you'd like to test against the current active state.
   * @property {object} current A reference to the state's config object. However 
   * you passed it in. Useful for accessing custom data.
   * @property {object} transition Currently pending transition. A promise that'll 
   * resolve or reject.
   *
   * @description
   * `$state` service is responsible for representing states as well as transitioning
   * between them. It also provides interfaces to ask for current state or even states
   * you're coming from.
   */
  this.$get = $get;
  $get.$inject = ['$rootScope', '$q', '$view', '$injector', '$resolve', '$stateParams', '$urlRouter', '$location', '$urlMatcherFactory'];
  function $get(   $rootScope,   $q,   $view,   $injector,   $resolve,   $stateParams,   $urlRouter,   $location,   $urlMatcherFactory) {

    var TransitionSupersededError = new Error('transition superseded');

    var TransitionSuperseded = silenceUncaughtInPromise($q.reject(TransitionSupersededError));
    var TransitionPrevented = silenceUncaughtInPromise($q.reject(new Error('transition prevented')));
    var TransitionAborted = silenceUncaughtInPromise($q.reject(new Error('transition aborted')));
    var TransitionFailed = silenceUncaughtInPromise($q.reject(new Error('transition failed')));

    // Handles the case where a state which is the target of a transition is not found, and the user
    // can optionally retry or defer the transition
    function handleRedirect(redirect, state, params, options) {
      /**
       * @ngdoc event
       * @name ui.router.state.$state#$stateNotFound
       * @eventOf ui.router.state.$state
       * @eventType broadcast on root scope
       * @description
       * Fired when a requested state **cannot be found** using the provided state name during transition.
       * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
       * lazy-loading the unfound state). A special `unfoundState` object is passed to the listener handler,
       * you can see its three properties in the example. You can use `event.preventDefault()` to abort the
       * transition and the promise returned from `go` will be rejected with a `'transition aborted'` value.
       *
       * @param {Object} event Event object.
       * @param {Object} unfoundState Unfound State information. Contains: `to, toParams, options` properties.
       * @param {State} fromState Current state object.
       * @param {Object} fromParams Current state params.
       *
       * @example
       *
       * <pre>
       * // somewhere, assume lazy.state has not been defined
       * $state.go("lazy.state", {a:1, b:2}, {inherit:false});
       *
       * // somewhere else
       * $scope.$on('$stateNotFound',
       * function(event, unfoundState, fromState, fromParams){
       *     console.log(unfoundState.to); // "lazy.state"
       *     console.log(unfoundState.toParams); // {a:1, b:2}
       *     console.log(unfoundState.options); // {inherit:false} + default options
       * })
       * </pre>
       */
      var evt = $rootScope.$broadcast('$stateNotFound', redirect, state, params);

      if (evt.defaultPrevented) {
        $urlRouter.update();
        return TransitionAborted;
      }

      if (!evt.retry) {
        return null;
      }

      // Allow the handler to return a promise to defer state lookup retry
      if (options.$retry) {
        $urlRouter.update();
        return TransitionFailed;
      }
      var retryTransition = $state.transition = $q.when(evt.retry);

      retryTransition.then(function() {
        if (retryTransition !== $state.transition) {
          $rootScope.$broadcast('$stateChangeCancel', redirect.to, redirect.toParams, state, params);
          return TransitionSuperseded;
        }
        redirect.options.$retry = true;
        return $state.transitionTo(redirect.to, redirect.toParams, redirect.options);
      }, function() {
        return TransitionAborted;
      });
      $urlRouter.update();

      return retryTransition;
    }

    root.locals = { resolve: null, globals: { $stateParams: {} } };

    $state = {
      params: {},
      current: root.self,
      $current: root,
      transition: null
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#reload
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method that force reloads the current state. All resolves are re-resolved,
     * controllers reinstantiated, and events re-fired.
     *
     * @example
     * <pre>
     * var app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     $state.reload();
     *   }
     * });
     * </pre>
     *
     * `reload()` is just an alias for:
     * <pre>
     * $state.transitionTo($state.current, $stateParams, { 
     *   reload: true, inherit: false, notify: true
     * });
     * </pre>
     *
     * @param {string=|object=} state - A state name or a state object, which is the root of the resolves to be re-resolved.
     * @example
     * <pre>
     * //assuming app application consists of 3 states: 'contacts', 'contacts.detail', 'contacts.detail.item' 
     * //and current state is 'contacts.detail.item'
     * var app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     //will reload 'contact.detail' and 'contact.detail.item' states
     *     $state.reload('contact.detail');
     *   }
     * });
     * </pre>
     *
     * `reload()` is just an alias for:
     * <pre>
     * $state.transitionTo($state.current, $stateParams, { 
     *   reload: true, inherit: false, notify: true
     * });
     * </pre>

     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.reload = function reload(state) {
      return $state.transitionTo($state.current, $stateParams, { reload: state || true, inherit: false, notify: true});
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#go
     * @methodOf ui.router.state.$state
     *
     * @description
     * Convenience method for transitioning to a new state. `$state.go` calls 
     * `$state.transitionTo` internally but automatically sets options to 
     * `{ location: true, inherit: true, relative: $state.$current, notify: true }`. 
     * This allows you to easily use an absolute or relative to path and specify 
     * only the parameters you'd like to update (while letting unspecified parameters 
     * inherit from the currently active ancestor states).
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.go('contact.detail');
     *   };
     * });
     * </pre>
     * <img src='../ngdoc_assets/StateGoExamples.png'/>
     *
     * @param {string} to Absolute state name or relative state path. Some examples:
     *
     * - `$state.go('contact.detail')` - will go to the `contact.detail` state
     * - `$state.go('^')` - will go to a parent state
     * - `$state.go('^.sibling')` - will go to a sibling state
     * - `$state.go('.child.grandchild')` - will go to grandchild state
     *
     * @param {object=} params A map of the parameters that will be sent to the state, 
     * will populate $stateParams. Any parameters that are not specified will be inherited from currently 
     * defined parameters. Only parameters specified in the state definition can be overridden, new 
     * parameters will be ignored. This allows, for example, going to a sibling state that shares parameters
     * specified in a parent state. Parameter inheritance only works between common ancestor states, I.e.
     * transitioning to a sibling will get you the parameters for all parents, transitioning to a child
     * will get you all current parameters, etc.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false|string|object}, If `true` will force transition even if no state or params
     *    have changed.  It will reload the resolves and views of the current state and parent states.
     *    If `reload` is a string (or state object), the state object is fetched (by name, or object reference); and \
     *    the transition reloads the resolves and views for that matched state, and all its children states.
     *
     * @returns {promise} A promise representing the state of the new transition.
     *
     * Possible success values:
     *
     * - $state.current
     *
     * <br/>Possible rejection values:
     *
     * - 'transition superseded' - when a newer transition has been started after this one
     * - 'transition prevented' - when `event.preventDefault()` has been called in a `$stateChangeStart` listener
     * - 'transition aborted' - when `event.preventDefault()` has been called in a `$stateNotFound` listener or
     *   when a `$stateNotFound` `event.retry` promise errors.
     * - 'transition failed' - when a state has been unsuccessfully found after 2 tries.
     * - *resolve error* - when an error has occurred with a `resolve`
     *
     */
    $state.go = function go(to, params, options) {
      return $state.transitionTo(to, params, extend({ inherit: true, relative: $state.$current }, options));
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#transitionTo
     * @methodOf ui.router.state.$state
     *
     * @description
     * Low-level method for transitioning to a new state. {@link ui.router.state.$state#methods_go $state.go}
     * uses `transitionTo` internally. `$state.go` is recommended in most situations.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.transitionTo('contact.detail');
     *   };
     * });
     * </pre>
     *
     * @param {string} to State name.
     * @param {object=} toParams A map of the parameters that will be sent to the state,
     * will populate $stateParams.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=false}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false|string=|object=}, If `true` will force transition even if the state or params 
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *    if String, then will reload the state with the name given in reload, and any children.
     *    if Object, then a stateObj is expected, will reload the state found in stateObj, and any children.
     *
     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.transitionTo = function transitionTo(to, toParams, options) {
      toParams = toParams || {};
      options = extend({
        location: true, inherit: false, relative: null, notify: true, reload: false, $retry: false
      }, options || {});

      var from = $state.$current, fromParams = $state.params, fromPath = from.path;
      var evt, toState = findState(to, options.relative);

      // Store the hash param for later (since it will be stripped out by various methods)
      var hash = toParams['#'];

      if (!isDefined(toState)) {
        var redirect = { to: to, toParams: toParams, options: options };
        var redirectResult = handleRedirect(redirect, from.self, fromParams, options);

        if (redirectResult) {
          return redirectResult;
        }

        // Always retry once if the $stateNotFound was not prevented
        // (handles either redirect changed or state lazy-definition)
        to = redirect.to;
        toParams = redirect.toParams;
        options = redirect.options;
        toState = findState(to, options.relative);

        if (!isDefined(toState)) {
          if (!options.relative) throw new Error("No such state '" + to + "'");
          throw new Error("Could not resolve '" + to + "' from state '" + options.relative + "'");
        }
      }
      if (toState[abstractKey]) throw new Error("Cannot transition to abstract state '" + to + "'");
      if (options.inherit) toParams = inheritParams($stateParams, toParams || {}, $state.$current, toState);
      if (!toState.params.$$validates(toParams)) return TransitionFailed;

      toParams = toState.params.$$values(toParams);
      to = toState;

      var toPath = to.path;

      // Starting from the root of the path, keep all levels that haven't changed
      var keep = 0, state = toPath[keep], locals = root.locals, toLocals = [];

      if (!options.reload) {
        while (state && state === fromPath[keep] && state.ownParams.$$equals(toParams, fromParams)) {
          locals = toLocals[keep] = state.locals;
          keep++;
          state = toPath[keep];
        }
      } else if (isString(options.reload) || isObject(options.reload)) {
        if (isObject(options.reload) && !options.reload.name) {
          throw new Error('Invalid reload state object');
        }
        
        var reloadState = options.reload === true ? fromPath[0] : findState(options.reload);
        if (options.reload && !reloadState) {
          throw new Error("No such reload state '" + (isString(options.reload) ? options.reload : options.reload.name) + "'");
        }

        while (state && state === fromPath[keep] && state !== reloadState) {
          locals = toLocals[keep] = state.locals;
          keep++;
          state = toPath[keep];
        }
      }

      // If we're going to the same state and all locals are kept, we've got nothing to do.
      // But clear 'transition', as we still want to cancel any other pending transitions.
      // TODO: We may not want to bump 'transition' if we're called from a location change
      // that we've initiated ourselves, because we might accidentally abort a legitimate
      // transition initiated from code?
      if (shouldSkipReload(to, toParams, from, fromParams, locals, options)) {
        if (hash) toParams['#'] = hash;
        $state.params = toParams;
        copy($state.params, $stateParams);
        copy(filterByKeys(to.params.$$keys(), $stateParams), to.locals.globals.$stateParams);
        if (options.location && to.navigable && to.navigable.url) {
          $urlRouter.push(to.navigable.url, toParams, {
            $$avoidResync: true, replace: options.location === 'replace'
          });
          $urlRouter.update(true);
        }
        $state.transition = null;
        return $q.when($state.current);
      }

      // Filter parameters before we pass them to event handlers etc.
      toParams = filterByKeys(to.params.$$keys(), toParams || {});
      
      // Re-add the saved hash before we start returning things or broadcasting $stateChangeStart
      if (hash) toParams['#'] = hash;
      
      // Broadcast start event and cancel the transition if requested
      if (options.notify) {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeStart
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when the state transition **begins**. You can use `event.preventDefault()`
         * to prevent the transition from happening and then the transition promise will be
         * rejected with a `'transition prevented'` value.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         *
         * @example
         *
         * <pre>
         * $rootScope.$on('$stateChangeStart',
         * function(event, toState, toParams, fromState, fromParams){
         *     event.preventDefault();
         *     // transitionTo() promise will be rejected with
         *     // a 'transition prevented' error
         * })
         * </pre>
         */
        if ($rootScope.$broadcast('$stateChangeStart', to.self, toParams, from.self, fromParams, options).defaultPrevented) {
          $rootScope.$broadcast('$stateChangeCancel', to.self, toParams, from.self, fromParams);
          //Don't update and resync url if there's been a new transition started. see issue #2238, #600
          if ($state.transition == null) $urlRouter.update();
          return TransitionPrevented;
        }
      }

      // Resolve locals for the remaining states, but don't update any global state just
      // yet -- if anything fails to resolve the current state needs to remain untouched.
      // We also set up an inheritance chain for the locals here. This allows the view directive
      // to quickly look up the correct definition for each view in the current state. Even
      // though we create the locals object itself outside resolveState(), it is initially
      // empty and gets filled asynchronously. We need to keep track of the promise for the
      // (fully resolved) current locals, and pass this down the chain.
      var resolved = $q.when(locals);

      for (var l = keep; l < toPath.length; l++, state = toPath[l]) {
        locals = toLocals[l] = inherit(locals);
        resolved = resolveState(state, toParams, state === to, resolved, locals, options);
      }

      // Once everything is resolved, we are ready to perform the actual transition
      // and return a promise for the new state. We also keep track of what the
      // current promise is, so that we can detect overlapping transitions and
      // keep only the outcome of the last transition.
      var transition = $state.transition = resolved.then(function () {
        var l, entering, exiting;

        if ($state.transition !== transition) {
          $rootScope.$broadcast('$stateChangeCancel', to.self, toParams, from.self, fromParams);
          return TransitionSuperseded;
        }

        // Exit 'from' states not kept
        for (l = fromPath.length - 1; l >= keep; l--) {
          exiting = fromPath[l];
          if (exiting.self.onExit) {
            $injector.invoke(exiting.self.onExit, exiting.self, exiting.locals.globals);
          }
          exiting.locals = null;
        }

        // Enter 'to' states not kept
        for (l = keep; l < toPath.length; l++) {
          entering = toPath[l];
          entering.locals = toLocals[l];
          if (entering.self.onEnter) {
            $injector.invoke(entering.self.onEnter, entering.self, entering.locals.globals);
          }
        }

        // Run it again, to catch any transitions in callbacks
        if ($state.transition !== transition) {
          $rootScope.$broadcast('$stateChangeCancel', to.self, toParams, from.self, fromParams);
          return TransitionSuperseded;
        }

        // Update globals in $state
        $state.$current = to;
        $state.current = to.self;
        $state.params = toParams;
        copy($state.params, $stateParams);
        $state.transition = null;

        if (options.location && to.navigable) {
          $urlRouter.push(to.navigable.url, to.navigable.locals.globals.$stateParams, {
            $$avoidResync: true, replace: options.location === 'replace'
          });
        }

        if (options.notify) {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeSuccess
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired once the state transition is **complete**.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         */
          $rootScope.$broadcast('$stateChangeSuccess', to.self, toParams, from.self, fromParams);
        }
        $urlRouter.update(true);

        return $state.current;
      }).then(null, function (error) {
        // propagate TransitionSuperseded error without emitting $stateChangeCancel
        // as it was already emitted in the success handler above
        if (error === TransitionSupersededError) return TransitionSuperseded;

        if ($state.transition !== transition) {
          $rootScope.$broadcast('$stateChangeCancel', to.self, toParams, from.self, fromParams);
          return TransitionSuperseded;
        }

        $state.transition = null;
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeError
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when an **error occurs** during transition. It's important to note that if you
         * have any errors in your resolve functions (javascript errors, non-existent services, etc)
         * they will not throw traditionally. You must listen for this $stateChangeError event to
         * catch **ALL** errors.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         * @param {Error} error The resolve error object.
         */
        evt = $rootScope.$broadcast('$stateChangeError', to.self, toParams, from.self, fromParams, error);

        if (!evt.defaultPrevented) {
          $urlRouter.update();
        }

        return $q.reject(error);
      });

      return transition;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#is
     * @methodOf ui.router.state.$state
     *
     * @description
     * Similar to {@link ui.router.state.$state#methods_includes $state.includes},
     * but only checks for the full state name. If params is supplied then it will be
     * tested for strict equality against the current active params object, so all params
     * must match with none missing and no extras.
     *
     * @example
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // absolute name
     * $state.is('contact.details.item'); // returns true
     * $state.is(contactDetailItemStateObject); // returns true
     *
     * // relative name (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.is('.item')}">Item</div>
     * </pre>
     *
     * @param {string|object} stateOrName The state name (absolute or relative) or state object you'd like to check.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`, that you'd like
     * to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object} -  If `stateOrName` is a relative state name and `options.relative` is set, .is will
     * test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it is the state.
     */
    $state.is = function is(stateOrName, params, options) {
      options = extend({ relative: $state.$current }, options || {});
      var state = findState(stateOrName, options.relative);

      if (!isDefined(state)) { return undefined; }
      if ($state.$current !== state) { return false; }
      return params ? equalForKeys(state.params.$$values(params), $stateParams) : true;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#includes
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method to determine if the current active state is equal to or is the child of the
     * state stateName. If any params are passed then they will be tested for a match as well.
     * Not all the parameters need to be passed, just the ones you'd like to test for equality.
     *
     * @example
     * Partial and relative names
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // Using partial names
     * $state.includes("contacts"); // returns true
     * $state.includes("contacts.details"); // returns true
     * $state.includes("contacts.details.item"); // returns true
     * $state.includes("contacts.list"); // returns false
     * $state.includes("about"); // returns false
     *
     * // Using relative names (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.includes('.item')}">Item</div>
     * </pre>
     *
     * Basic globbing patterns
     * <pre>
     * $state.$current.name = 'contacts.details.item.url';
     *
     * $state.includes("*.details.*.*"); // returns true
     * $state.includes("*.details.**"); // returns true
     * $state.includes("**.item.**"); // returns true
     * $state.includes("*.details.item.url"); // returns true
     * $state.includes("*.details.*.url"); // returns true
     * $state.includes("*.details.*"); // returns false
     * $state.includes("item.**"); // returns false
     * </pre>
     *
     * @param {string} stateOrName A partial name, relative name, or glob pattern
     * to be searched for within the current state name.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`,
     * that you'd like to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object=} -  If `stateOrName` is a relative state reference and `options.relative` is set,
     * .includes will test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it does include the state
     */
    $state.includes = function includes(stateOrName, params, options) {
      options = extend({ relative: $state.$current }, options || {});
      if (isString(stateOrName) && isGlob(stateOrName)) {
        if (!doesStateMatchGlob(stateOrName)) {
          return false;
        }
        stateOrName = $state.$current.name;
      }

      var state = findState(stateOrName, options.relative);
      if (!isDefined(state)) { return undefined; }
      if (!isDefined($state.$current.includes[state.name])) { return false; }
      if (!params) { return true; }

      var keys = objectKeys(params);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i], paramDef = state.params[key];
        if (paramDef && !paramDef.type.equals($stateParams[key], params[key])) {
          return false;
        }
      }

      return true;
    };


    /**
     * @ngdoc function
     * @name ui.router.state.$state#href
     * @methodOf ui.router.state.$state
     *
     * @description
     * A url generation method that returns the compiled url for the given state populated with the given params.
     *
     * @example
     * <pre>
     * expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
     * </pre>
     *
     * @param {string|object} stateOrName The state name or state object you'd like to generate a url from.
     * @param {object=} params An object of parameter values to fill the state's required parameters.
     * @param {object=} options Options object. The options are:
     *
     * - **`lossy`** - {boolean=true} -  If true, and if there is no url associated with the state provided in the
     *    first parameter, then the constructed href url will be built from the first navigable ancestor (aka
     *    ancestor with a valid url).
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
     * 
     * @returns {string} compiled state url
     */
    $state.href = function href(stateOrName, params, options) {
      options = extend({
        lossy:    true,
        inherit:  true,
        absolute: false,
        relative: $state.$current
      }, options || {});

      var state = findState(stateOrName, options.relative);

      if (!isDefined(state)) return null;
      if (options.inherit) params = inheritParams($stateParams, params || {}, $state.$current, state);
      
      var nav = (state && options.lossy) ? state.navigable : state;

      if (!nav || nav.url === undefined || nav.url === null) {
        return null;
      }
      return $urlRouter.href(nav.url, filterByKeys(state.params.$$keys().concat('#'), params || {}), {
        absolute: options.absolute
      });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#get
     * @methodOf ui.router.state.$state
     *
     * @description
     * Returns the state configuration object for any specific state or all states.
     *
     * @param {string|object=} stateOrName (absolute or relative) If provided, will only get the config for
     * the requested state. If not provided, returns an array of ALL state configs.
     * @param {string|object=} context When stateOrName is a relative state reference, the state will be retrieved relative to context.
     * @returns {Object|Array} State configuration object or array of all objects.
     */
    $state.get = function (stateOrName, context) {
      if (arguments.length === 0) return map(objectKeys(states), function(name) { return states[name].self; });
      var state = findState(stateOrName, context || $state.$current);
      return (state && state.self) ? state.self : null;
    };

    function resolveState(state, params, paramsAreFiltered, inherited, dst, options) {
      // Make a restricted $stateParams with only the parameters that apply to this state if
      // necessary. In addition to being available to the controller and onEnter/onExit callbacks,
      // we also need $stateParams to be available for any $injector calls we make during the
      // dependency resolution process.
      var $stateParams = (paramsAreFiltered) ? params : filterByKeys(state.params.$$keys(), params);
      var locals = { $stateParams: $stateParams };

      // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
      // We're also including $stateParams in this; that way the parameters are restricted
      // to the set that should be visible to the state, and are independent of when we update
      // the global $state and $stateParams values.
      dst.resolve = $resolve.resolve(state.resolve, locals, dst.resolve, state);
      var promises = [dst.resolve.then(function (globals) {
        dst.globals = globals;
      })];
      if (inherited) promises.push(inherited);

      function resolveViews() {
        var viewsPromises = [];

        // Resolve template and dependencies for all views.
        forEach(state.views, function (view, name) {
          var injectables = (view.resolve && view.resolve !== state.resolve ? view.resolve : {});
          injectables.$template = [ function () {
            return $view.load(name, { view: view, locals: dst.globals, params: $stateParams, notify: options.notify }) || '';
          }];

          viewsPromises.push($resolve.resolve(injectables, dst.globals, dst.resolve, state).then(function (result) {
            // References to the controller (only instantiated at link time)
            if (isFunction(view.controllerProvider) || isArray(view.controllerProvider)) {
              var injectLocals = angular.extend({}, injectables, dst.globals);
              result.$$controller = $injector.invoke(view.controllerProvider, null, injectLocals);
            } else {
              result.$$controller = view.controller;
            }
            // Provide access to the state itself for internal use
            result.$$state = state;
            result.$$controllerAs = view.controllerAs;
            result.$$resolveAs = view.resolveAs;
            dst[name] = result;
          }));
        });

        return $q.all(viewsPromises).then(function(){
          return dst.globals;
        });
      }

      // Wait for all the promises and then return the activation object
      return $q.all(promises).then(resolveViews).then(function (values) {
        return dst;
      });
    }

    return $state;
  }

  function shouldSkipReload(to, toParams, from, fromParams, locals, options) {
    // Return true if there are no differences in non-search (path/object) params, false if there are differences
    function nonSearchParamsEqual(fromAndToState, fromParams, toParams) {
      // Identify whether all the parameters that differ between `fromParams` and `toParams` were search params.
      function notSearchParam(key) {
        return fromAndToState.params[key].location != "search";
      }
      var nonQueryParamKeys = fromAndToState.params.$$keys().filter(notSearchParam);
      var nonQueryParams = pick.apply({}, [fromAndToState.params].concat(nonQueryParamKeys));
      var nonQueryParamSet = new $$UMFP.ParamSet(nonQueryParams);
      return nonQueryParamSet.$$equals(fromParams, toParams);
    }

    // If reload was not explicitly requested
    // and we're transitioning to the same state we're already in
    // and    the locals didn't change
    //     or they changed in a way that doesn't merit reloading
    //        (reloadOnParams:false, or reloadOnSearch.false and only search params changed)
    // Then return true.
    if (!options.reload && to === from &&
      (locals === from.locals || (to.self.reloadOnSearch === false && nonSearchParamsEqual(from, fromParams, toParams)))) {
      return true;
    }
  }
}

angular.module('ui.router.state')
  .factory('$stateParams', function () { return {}; })
  .constant("$state.runtime", { autoinject: true })
  .provider('$state', $StateProvider)
  // Inject $state to initialize when entering runtime. #2574
  .run(['$injector', function ($injector) {
    // Allow tests (stateSpec.js) to turn this off by defining this constant
    if ($injector.get("$state.runtime").autoinject) {
      $injector.get('$state');
    }
  }]);


$ViewProvider.$inject = [];
function $ViewProvider() {

  this.$get = $get;
  /**
   * @ngdoc object
   * @name ui.router.state.$view
   *
   * @requires ui.router.util.$templateFactory
   * @requires $rootScope
   *
   * @description
   *
   */
  $get.$inject = ['$rootScope', '$templateFactory'];
  function $get(   $rootScope,   $templateFactory) {
    return {
      // $view.load('full.viewName', { template: ..., controller: ..., resolve: ..., async: false, params: ... })
      /**
       * @ngdoc function
       * @name ui.router.state.$view#load
       * @methodOf ui.router.state.$view
       *
       * @description
       *
       * @param {string} name name
       * @param {object} options option object.
       */
      load: function load(name, options) {
        var result, defaults = {
          template: null, controller: null, view: null, locals: null, notify: true, async: true, params: {}
        };
        options = extend(defaults, options);

        if (options.view) {
          result = $templateFactory.fromConfig(options.view, options.params, options.locals);
        }
        return result;
      }
    };
  }
}

angular.module('ui.router.state').provider('$view', $ViewProvider);

/**
 * @ngdoc object
 * @name ui.router.state.$uiViewScrollProvider
 *
 * @description
 * Provider that returns the {@link ui.router.state.$uiViewScroll} service function.
 */
function $ViewScrollProvider() {

  var useAnchorScroll = false;

  /**
   * @ngdoc function
   * @name ui.router.state.$uiViewScrollProvider#useAnchorScroll
   * @methodOf ui.router.state.$uiViewScrollProvider
   *
   * @description
   * Reverts back to using the core [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll) service for
   * scrolling based on the url anchor.
   */
  this.useAnchorScroll = function () {
    useAnchorScroll = true;
  };

  /**
   * @ngdoc object
   * @name ui.router.state.$uiViewScroll
   *
   * @requires $anchorScroll
   * @requires $timeout
   *
   * @description
   * When called with a jqLite element, it scrolls the element into view (after a
   * `$timeout` so the DOM has time to refresh).
   *
   * If you prefer to rely on `$anchorScroll` to scroll the view to the anchor,
   * this can be enabled by calling {@link ui.router.state.$uiViewScrollProvider#methods_useAnchorScroll `$uiViewScrollProvider.useAnchorScroll()`}.
   */
  this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll, $timeout) {
    if (useAnchorScroll) {
      return $anchorScroll;
    }

    return function ($element) {
      return $timeout(function () {
        $element[0].scrollIntoView();
      }, 0, false);
    };
  }];
}

angular.module('ui.router.state').provider('$uiViewScroll', $ViewScrollProvider);

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-view
 *
 * @requires ui.router.state.$state
 * @requires $compile
 * @requires $controller
 * @requires $injector
 * @requires ui.router.state.$uiViewScroll
 * @requires $document
 *
 * @restrict ECA
 *
 * @description
 * The ui-view directive tells $state where to place your templates.
 *
 * @param {string=} name A view name. The name should be unique amongst the other views in the
 * same state. You can have views of the same name that live in different states.
 *
 * @param {string=} autoscroll It allows you to set the scroll behavior of the browser window
 * when a view is populated. By default, $anchorScroll is overridden by ui-router's custom scroll
 * service, {@link ui.router.state.$uiViewScroll}. This custom service let's you
 * scroll ui-view elements into view when they are populated during a state activation.
 *
 * *Note: To revert back to old [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
 * functionality, call `$uiViewScrollProvider.useAnchorScroll()`.*
 *
 * @param {string=} onload Expression to evaluate whenever the view updates.
 *
 * @example
 * A view can be unnamed or named.
 * <pre>
 * <!-- Unnamed -->
 * <div ui-view></div>
 *
 * <!-- Named -->
 * <div ui-view="viewName"></div>
 * </pre>
 *
 * You can only have one unnamed view within any template (or root html). If you are only using a
 * single view and it is unnamed then you can populate it like so:
 * <pre>
 * <div ui-view></div>
 * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
 * </pre>
 *
 * The above is a convenient shortcut equivalent to specifying your view explicitly with the {@link ui.router.state.$stateProvider#methods_state `views`}
 * config property, by name, in this case an empty name:
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
 * </pre>
 *
 * But typically you'll only use the views property if you name your view or have more than one view
 * in the same template. There's not really a compelling reason to name a view if its the only one,
 * but you could if you wanted, like so:
 * <pre>
 * <div ui-view="main"></div>
 * </pre>
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "main": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
 * </pre>
 *
 * Really though, you'll use views to set up multiple views:
 * <pre>
 * <div ui-view></div>
 * <div ui-view="chart"></div>
 * <div ui-view="data"></div>
 * </pre>
 *
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     },
 *     "chart": {
 *       template: "<chart_thing/>"
 *     },
 *     "data": {
 *       template: "<data_thing/>"
 *     }
 *   }    
 * })
 * </pre>
 *
 * Examples for `autoscroll`:
 *
 * <pre>
 * <!-- If autoscroll present with no expression,
 *      then scroll ui-view into view -->
 * <ui-view autoscroll/>
 *
 * <!-- If autoscroll present with valid expression,
 *      then scroll ui-view into view if expression evaluates to true -->
 * <ui-view autoscroll='true'/>
 * <ui-view autoscroll='false'/>
 * <ui-view autoscroll='scopeVariable'/>
 * </pre>
 *
 * Resolve data:
 *
 * The resolved data from the state's `resolve` block is placed on the scope as `$resolve` (this
 * can be customized using [[ViewDeclaration.resolveAs]]).  This can be then accessed from the template.
 *
 * Note that when `controllerAs` is being used, `$resolve` is set on the controller instance *after* the
 * controller is instantiated.  The `$onInit()` hook can be used to perform initialization code which
 * depends on `$resolve` data.
 *
 * Example usage of $resolve in a view template
 * <pre>
 * $stateProvider.state('home', {
 *   template: '<my-component user="$resolve.user"></my-component>',
 *   resolve: {
 *     user: function(UserService) { return UserService.fetchUser(); }
 *   }
 * });
 * </pre>
 */
$ViewDirective.$inject = ['$state', '$injector', '$uiViewScroll', '$interpolate', '$q'];
function $ViewDirective(   $state,   $injector,   $uiViewScroll,   $interpolate,   $q) {

  function getService() {
    return ($injector.has) ? function(service) {
      return $injector.has(service) ? $injector.get(service) : null;
    } : function(service) {
      try {
        return $injector.get(service);
      } catch (e) {
        return null;
      }
    };
  }

  var service = getService(),
      $animator = service('$animator'),
      $animate = service('$animate');

  // Returns a set of DOM manipulation functions based on which Angular version
  // it should use
  function getRenderer(attrs, scope) {
    var statics = function() {
      return {
        enter: function (element, target, cb) { target.after(element); cb(); },
        leave: function (element, cb) { element.remove(); cb(); }
      };
    };

    if ($animate) {
      return {
        enter: function(element, target, cb) {
          if (angular.version.minor > 2) {
            $animate.enter(element, null, target).then(cb);
          } else {
            $animate.enter(element, null, target, cb);
          }
        },
        leave: function(element, cb) {
          if (angular.version.minor > 2) {
            $animate.leave(element).then(cb);
          } else {
            $animate.leave(element, cb);
          }
        }
      };
    }

    if ($animator) {
      var animate = $animator && $animator(scope, attrs);

      return {
        enter: function(element, target, cb) {animate.enter(element, null, target); cb(); },
        leave: function(element, cb) { animate.leave(element); cb(); }
      };
    }

    return statics();
  }

  var directive = {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    compile: function (tElement, tAttrs, $transclude) {
      return function (scope, $element, attrs) {
        var previousEl, currentEl, currentScope, latestLocals,
            onloadExp     = attrs.onload || '',
            autoScrollExp = attrs.autoscroll,
            renderer      = getRenderer(attrs, scope),
            inherited     = $element.inheritedData('$uiView');

        scope.$on('$stateChangeSuccess', function() {
          updateView(false);
        });

        updateView(true);

        function cleanupLastView() {
          if (previousEl) {
            previousEl.remove();
            previousEl = null;
          }

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }

          if (currentEl) {
            var $uiViewData = currentEl.data('$uiViewAnim');
            renderer.leave(currentEl, function() {
              $uiViewData.$$animLeave.resolve();
              previousEl = null;
            });

            previousEl = currentEl;
            currentEl = null;
          }
        }

        function updateView(firstTime) {
          var newScope,
              name            = getUiViewName(scope, attrs, $element, $interpolate),
              previousLocals  = name && $state.$current && $state.$current.locals[name];

          if (!firstTime && previousLocals === latestLocals) return; // nothing to do
          newScope = scope.$new();
          latestLocals = $state.$current.locals[name];

          /**
           * @ngdoc event
           * @name ui.router.state.directive:ui-view#$viewContentLoading
           * @eventOf ui.router.state.directive:ui-view
           * @eventType emits on ui-view directive scope
           * @description
           *
           * Fired once the view **begins loading**, *before* the DOM is rendered.
           *
           * @param {Object} event Event object.
           * @param {string} viewName Name of the view.
           */
          newScope.$emit('$viewContentLoading', name);

          var clone = $transclude(newScope, function(clone) {
            var animEnter = $q.defer(), animLeave = $q.defer();
            var viewAnimData = {
              $animEnter: animEnter.promise,
              $animLeave: animLeave.promise,
              $$animLeave: animLeave
            };

            clone.data('$uiViewAnim', viewAnimData);
            renderer.enter(clone, $element, function onUiViewEnter() {
              animEnter.resolve();
              if(currentScope) {
                currentScope.$emit('$viewContentAnimationEnded');
              }

              if (angular.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                $uiViewScroll(clone);
              }
            });
            cleanupLastView();
          });

          currentEl = clone;
          currentScope = newScope;
          /**
           * @ngdoc event
           * @name ui.router.state.directive:ui-view#$viewContentLoaded
           * @eventOf ui.router.state.directive:ui-view
           * @eventType emits on ui-view directive scope
           * @description
           * Fired once the view is **loaded**, *after* the DOM is rendered.
           *
           * @param {Object} event Event object.
           * @param {string} viewName Name of the view.
           */
          currentScope.$emit('$viewContentLoaded', name);
          currentScope.$eval(onloadExp);
        }
      };
    }
  };

  return directive;
}

$ViewDirectiveFill.$inject = ['$compile', '$controller', '$state', '$interpolate'];
function $ViewDirectiveFill (  $compile,   $controller,   $state,   $interpolate) {
  return {
    restrict: 'ECA',
    priority: -400,
    compile: function (tElement) {
      var initial = tElement.html();
      return function (scope, $element, attrs) {
        var current = $state.$current,
            name = getUiViewName(scope, attrs, $element, $interpolate),
            locals  = current && current.locals[name];

        if (! locals) {
          return;
        }

        $element.data('$uiView', { name: name, state: locals.$$state });
        $element.html(locals.$template ? locals.$template : initial);

        var resolveData = angular.extend({}, locals);
        scope[locals.$$resolveAs] = resolveData;

        var link = $compile($element.contents());

        if (locals.$$controller) {
          locals.$scope = scope;
          locals.$element = $element;
          var controller = $controller(locals.$$controller, locals);
          if (locals.$$controllerAs) {
            scope[locals.$$controllerAs] = controller;
            scope[locals.$$controllerAs][locals.$$resolveAs] = resolveData;
          }
          if (isFunction(controller.$onInit)) controller.$onInit();
          $element.data('$ngControllerController', controller);
          $element.children().data('$ngControllerController', controller);
        }

        link(scope);
      };
    }
  };
}

/**
 * Shared ui-view code for both directives:
 * Given scope, element, and its attributes, return the view's name
 */
function getUiViewName(scope, attrs, element, $interpolate) {
  var name = $interpolate(attrs.uiView || attrs.name || '')(scope);
  var uiViewCreatedBy = element.inheritedData('$uiView');
  return name.indexOf('@') >= 0 ?  name :  (name + '@' + (uiViewCreatedBy ? uiViewCreatedBy.state.name : ''));
}

angular.module('ui.router.state').directive('uiView', $ViewDirective);
angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);

function parseStateRef(ref, current) {
  var preparsed = ref.match(/^\s*({[^}]*})\s*$/), parsed;
  if (preparsed) ref = current + '(' + preparsed[1] + ')';
  parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

function stateContext(el) {
  var stateData = el.parent().inheritedData('$uiView');

  if (stateData && stateData.state && stateData.state.name) {
    return stateData.state;
  }
}

function getTypeInfo(el) {
  // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
  var isSvg = Object.prototype.toString.call(el.prop('href')) === '[object SVGAnimatedString]';
  var isForm = el[0].nodeName === "FORM";

  return {
    attr: isForm ? "action" : (isSvg ? 'xlink:href' : 'href'),
    isAnchor: el.prop("tagName").toUpperCase() === "A",
    clickable: !isForm
  };
}

function clickHook(el, $state, $timeout, type, current) {
  return function(e) {
    var button = e.which || e.button, target = current();

    if (!(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || el.attr('target'))) {
      // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
      var transition = $timeout(function() {
        $state.go(target.state, target.params, target.options);
      });
      e.preventDefault();

      // if the state has no URL, ignore one preventDefault from the <a> directive.
      var ignorePreventDefaultCount = type.isAnchor && !target.href ? 1: 0;

      e.preventDefault = function() {
        if (ignorePreventDefaultCount-- <= 0) $timeout.cancel(transition);
      };
    }
  };
}

function defaultOpts(el, $state) {
  return { relative: stateContext(el) || $state.$current, inherit: true };
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref
 *
 * @requires ui.router.state.$state
 * @requires $timeout
 *
 * @restrict A
 *
 * @description
 * A directive that binds a link (`<a>` tag) to a state. If the state has an associated
 * URL, the directive will automatically generate & update the `href` attribute via
 * the {@link ui.router.state.$state#methods_href $state.href()} method. Clicking
 * the link will trigger a state transition with optional parameters.
 *
 * Also middle-clicking, right-clicking, and ctrl-clicking on the link will be
 * handled natively by the browser.
 *
 * You can also use relative state paths within ui-sref, just like the relative
 * paths passed to `$state.go()`. You just need to be aware that the path is relative
 * to the state that the link lives in, in other words the state that loaded the
 * template containing the link.
 *
 * You can specify options to pass to {@link ui.router.state.$state#methods_go $state.go()}
 * using the `ui-sref-opts` attribute. Options are restricted to `location`, `inherit`,
 * and `reload`.
 *
 * @example
 * Here's an example of how you'd use ui-sref and how it would compile. If you have the
 * following template:
 * <pre>
 * <a ui-sref="home">Home</a> | <a ui-sref="about">About</a> | <a ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
 *     </li>
 * </ul>
 * </pre>
 *
 * Then the compiled html would be (assuming Html5Mode is off and current state is contacts):
 * <pre>
 * <a href="#/home" ui-sref="home">Home</a> | <a href="#/about" ui-sref="about">About</a> | <a href="#/contacts?page=2" ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/1" ui-sref="contacts.detail({ id: contact.id })">Joe</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/2" ui-sref="contacts.detail({ id: contact.id })">Alice</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/3" ui-sref="contacts.detail({ id: contact.id })">Bob</a>
 *     </li>
 * </ul>
 *
 * <a ui-sref="home" ui-sref-opts="{reload: true}">Home</a>
 * </pre>
 *
 * @param {string} ui-sref 'stateName' can be any valid absolute or relative state
 * @param {Object} ui-sref-opts options to pass to {@link ui.router.state.$state#methods_go $state.go()}
 */
$StateRefDirective.$inject = ['$state', '$timeout'];
function $StateRefDirective($state, $timeout) {
  return {
    restrict: 'A',
    require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
    link: function(scope, element, attrs, uiSrefActive) {
      var ref    = parseStateRef(attrs.uiSref, $state.current.name);
      var def    = { state: ref.state, href: null, params: null };
      var type   = getTypeInfo(element);
      var active = uiSrefActive[1] || uiSrefActive[0];
      var unlinkInfoFn = null;
      var hookFn;

      def.options = extend(defaultOpts(element, $state), attrs.uiSrefOpts ? scope.$eval(attrs.uiSrefOpts) : {});

      var update = function(val) {
        if (val) def.params = angular.copy(val);
        def.href = $state.href(ref.state, def.params, def.options);

        if (unlinkInfoFn) unlinkInfoFn();
        if (active) unlinkInfoFn = active.$$addStateInfo(ref.state, def.params);
        if (def.href !== null) attrs.$set(type.attr, def.href);
      };

      if (ref.paramExpr) {
        scope.$watch(ref.paramExpr, function(val) { if (val !== def.params) update(val); }, true);
        def.params = angular.copy(scope.$eval(ref.paramExpr));
      }
      update();

      if (!type.clickable) return;
      hookFn = clickHook(element, $state, $timeout, type, function() { return def; });
      element[element.on ? 'on' : 'bind']("click", hookFn);
      scope.$on('$destroy', function() {
        element[element.off ? 'off' : 'unbind']("click", hookFn);
      });
    }
  };
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-state
 *
 * @requires ui.router.state.uiSref
 *
 * @restrict A
 *
 * @description
 * Much like ui-sref, but will accept named $scope properties to evaluate for a state definition,
 * params and override options.
 *
 * @param {string} ui-state 'stateName' can be any valid absolute or relative state
 * @param {Object} ui-state-params params to pass to {@link ui.router.state.$state#methods_href $state.href()}
 * @param {Object} ui-state-opts options to pass to {@link ui.router.state.$state#methods_go $state.go()}
 */
$StateRefDynamicDirective.$inject = ['$state', '$timeout'];
function $StateRefDynamicDirective($state, $timeout) {
  return {
    restrict: 'A',
    require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
    link: function(scope, element, attrs, uiSrefActive) {
      var type   = getTypeInfo(element);
      var active = uiSrefActive[1] || uiSrefActive[0];
      var group  = [attrs.uiState, attrs.uiStateParams || null, attrs.uiStateOpts || null];
      var watch  = '[' + group.map(function(val) { return val || 'null'; }).join(', ') + ']';
      var def    = { state: null, params: null, options: null, href: null };
      var unlinkInfoFn = null;
      var hookFn;

      function runStateRefLink (group) {
        def.state = group[0]; def.params = group[1]; def.options = group[2];
        def.href = $state.href(def.state, def.params, def.options);

        if (unlinkInfoFn) unlinkInfoFn();
        if (active) unlinkInfoFn = active.$$addStateInfo(def.state, def.params);
        if (def.href) attrs.$set(type.attr, def.href);
      }

      scope.$watch(watch, runStateRefLink, true);
      runStateRefLink(scope.$eval(watch));

      if (!type.clickable) return;
      hookFn = clickHook(element, $state, $timeout, type, function() { return def; });
      element[element.on ? 'on' : 'bind']("click", hookFn);
      scope.$on('$destroy', function() {
        element[element.off ? 'off' : 'unbind']("click", hookFn);
      });
    }
  };
}


/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref-active
 *
 * @requires ui.router.state.$state
 * @requires ui.router.state.$stateParams
 * @requires $interpolate
 *
 * @restrict A
 *
 * @description
 * A directive working alongside ui-sref to add classes to an element when the
 * related ui-sref directive's state is active, and removing them when it is inactive.
 * The primary use-case is to simplify the special appearance of navigation menus
 * relying on `ui-sref`, by having the "active" state's menu button appear different,
 * distinguishing it from the inactive menu items.
 *
 * ui-sref-active can live on the same element as ui-sref or on a parent element. The first
 * ui-sref-active found at the same level or above the ui-sref will be used.
 *
 * Will activate when the ui-sref's target state or any child state is active. If you
 * need to activate only when the ui-sref target state is active and *not* any of
 * it's children, then you will use
 * {@link ui.router.state.directive:ui-sref-active-eq ui-sref-active-eq}
 *
 * @example
 * Given the following template:
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item">
 *     <a href ui-sref="app.user({user: 'bilbobaggins'})">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 *
 *
 * When the app state is "app.user" (or any children states), and contains the state parameter "user" with value "bilbobaggins",
 * the resulting HTML will appear as (note the 'active' class):
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item active">
 *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 *
 * The class name is interpolated **once** during the directives link time (any further changes to the
 * interpolated value are ignored).
 *
 * Multiple classes may be specified in a space-separated format:
 * <pre>
 * <ul>
 *   <li ui-sref-active='class1 class2 class3'>
 *     <a ui-sref="app.user">link</a>
 *   </li>
 * </ul>
 * </pre>
 *
 * It is also possible to pass ui-sref-active an expression that evaluates
 * to an object hash, whose keys represent active class names and whose
 * values represent the respective state names/globs.
 * ui-sref-active will match if the current active state **includes** any of
 * the specified state names/globs, even the abstract ones.
 *
 * @Example
 * Given the following template, with "admin" being an abstract state:
 * <pre>
 * <div ui-sref-active="{'active': 'admin.*'}">
 *   <a ui-sref-active="active" ui-sref="admin.roles">Roles</a>
 * </div>
 * </pre>
 *
 * When the current state is "admin.roles" the "active" class will be applied
 * to both the <div> and <a> elements. It is important to note that the state
 * names/globs passed to ui-sref-active shadow the state provided by ui-sref.
 */

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref-active-eq
 *
 * @requires ui.router.state.$state
 * @requires ui.router.state.$stateParams
 * @requires $interpolate
 *
 * @restrict A
 *
 * @description
 * The same as {@link ui.router.state.directive:ui-sref-active ui-sref-active} but will only activate
 * when the exact target state used in the `ui-sref` is active; no child states.
 *
 */
$StateRefActiveDirective.$inject = ['$state', '$stateParams', '$interpolate'];
function $StateRefActiveDirective($state, $stateParams, $interpolate) {
  return  {
    restrict: "A",
    controller: ['$scope', '$element', '$attrs', '$timeout', function ($scope, $element, $attrs, $timeout) {
      var states = [], activeClasses = {}, activeEqClass, uiSrefActive;

      // There probably isn't much point in $observing this
      // uiSrefActive and uiSrefActiveEq share the same directive object with some
      // slight difference in logic routing
      activeEqClass = $interpolate($attrs.uiSrefActiveEq || '', false)($scope);

      try {
        uiSrefActive = $scope.$eval($attrs.uiSrefActive);
      } catch (e) {
        // Do nothing. uiSrefActive is not a valid expression.
        // Fall back to using $interpolate below
      }
      uiSrefActive = uiSrefActive || $interpolate($attrs.uiSrefActive || '', false)($scope);
      if (isObject(uiSrefActive)) {
        forEach(uiSrefActive, function(stateOrName, activeClass) {
          if (isString(stateOrName)) {
            var ref = parseStateRef(stateOrName, $state.current.name);
            addState(ref.state, $scope.$eval(ref.paramExpr), activeClass);
          }
        });
      }

      // Allow uiSref to communicate with uiSrefActive[Equals]
      this.$$addStateInfo = function (newState, newParams) {
        // we already got an explicit state provided by ui-sref-active, so we
        // shadow the one that comes from ui-sref
        if (isObject(uiSrefActive) && states.length > 0) {
          return;
        }
        var deregister = addState(newState, newParams, uiSrefActive);
        update();
        return deregister;
      };

      $scope.$on('$stateChangeSuccess', update);

      function addState(stateName, stateParams, activeClass) {
        var state = $state.get(stateName, stateContext($element));
        var stateHash = createStateHash(stateName, stateParams);

        var stateInfo = {
          state: state || { name: stateName },
          params: stateParams,
          hash: stateHash
        };

        states.push(stateInfo);
        activeClasses[stateHash] = activeClass;

        return function removeState() {
          var idx = states.indexOf(stateInfo);
          if (idx !== -1) states.splice(idx, 1);
        };
      }

      /**
       * @param {string} state
       * @param {Object|string} [params]
       * @return {string}
       */
      function createStateHash(state, params) {
        if (!isString(state)) {
          throw new Error('state should be a string');
        }
        if (isObject(params)) {
          return state + toJson(params);
        }
        params = $scope.$eval(params);
        if (isObject(params)) {
          return state + toJson(params);
        }
        return state;
      }

      // Update route state
      function update() {
        for (var i = 0; i < states.length; i++) {
          if (anyMatch(states[i].state, states[i].params)) {
            addClass($element, activeClasses[states[i].hash]);
          } else {
            removeClass($element, activeClasses[states[i].hash]);
          }

          if (exactMatch(states[i].state, states[i].params)) {
            addClass($element, activeEqClass);
          } else {
            removeClass($element, activeEqClass);
          }
        }
      }

      function addClass(el, className) { $timeout(function () { el.addClass(className); }); }
      function removeClass(el, className) { el.removeClass(className); }
      function anyMatch(state, params) { return $state.includes(state.name, params); }
      function exactMatch(state, params) { return $state.is(state.name, params); }

      update();
    }]
  };
}

angular.module('ui.router.state')
  .directive('uiSref', $StateRefDirective)
  .directive('uiSrefActive', $StateRefActiveDirective)
  .directive('uiSrefActiveEq', $StateRefActiveDirective)
  .directive('uiState', $StateRefDynamicDirective);

/**
 * @ngdoc filter
 * @name ui.router.state.filter:isState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_is $state.is("stateName")}.
 */
$IsStateFilter.$inject = ['$state'];
function $IsStateFilter($state) {
  var isFilter = function (state, params) {
    return $state.is(state, params);
  };
  isFilter.$stateful = true;
  return isFilter;
}

/**
 * @ngdoc filter
 * @name ui.router.state.filter:includedByState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_includes $state.includes('fullOrPartialStateName')}.
 */
$IncludedByStateFilter.$inject = ['$state'];
function $IncludedByStateFilter($state) {
  var includesFilter = function (state, params, options) {
    return $state.includes(state, params, options);
  };
  includesFilter.$stateful = true;
  return  includesFilter;
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter);
})(window, window.angular);
/**
 * @license AngularJS v1.6.4
 * (c) 2010-2017 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

var forEach;
var isArray;
var isString;
var jqLite;

/**
 * @ngdoc module
 * @name ngMessages
 * @description
 *
 * The `ngMessages` module provides enhanced support for displaying messages within templates
 * (typically within forms or when rendering message objects that return key/value data).
 * Instead of relying on JavaScript code and/or complex ng-if statements within your form template to
 * show and hide error messages specific to the state of an input field, the `ngMessages` and
 * `ngMessage` directives are designed to handle the complexity, inheritance and priority
 * sequencing based on the order of how the messages are defined in the template.
 *
 * Currently, the ngMessages module only contains the code for the `ngMessages`, `ngMessagesInclude`
 * `ngMessage` and `ngMessageExp` directives.
 *
 * # Usage
 * The `ngMessages` directive allows keys in a key/value collection to be associated with a child element
 * (or 'message') that will show or hide based on the truthiness of that key's value in the collection. A common use
 * case for `ngMessages` is to display error messages for inputs using the `$error` object exposed by the
 * {@link ngModel ngModel} directive.
 *
 * The child elements of the `ngMessages` directive are matched to the collection keys by a `ngMessage` or
 * `ngMessageExp` directive. The value of these attributes must match a key in the collection that is provided by
 * the `ngMessages` directive.
 *
 * Consider the following example, which illustrates a typical use case of `ngMessages`. Within the form `myForm` we
 * have a text input named `myField` which is bound to the scope variable `field` using the {@link ngModel ngModel}
 * directive.
 *
 * The `myField` field is a required input of type `email` with a maximum length of 15 characters.
 *
 * ```html
 * <form name="myForm">
 *   <label>
 *     Enter text:
 *     <input type="email" ng-model="field" name="myField" required maxlength="15" />
 *   </label>
 *   <div ng-messages="myForm.myField.$error" role="alert">
 *     <div ng-message="required">Please enter a value for this field.</div>
 *     <div ng-message="email">This field must be a valid email address.</div>
 *     <div ng-message="maxlength">This field can be at most 15 characters long.</div>
 *   </div>
 * </form>
 * ```
 *
 * In order to show error messages corresponding to `myField` we first create an element with an `ngMessages` attribute
 * set to the `$error` object owned by the `myField` input in our `myForm` form.
 *
 * Within this element we then create separate elements for each of the possible errors that `myField` could have.
 * The `ngMessage` attribute is used to declare which element(s) will appear for which error - for example,
 * setting `ng-message="required"` specifies that this particular element should be displayed when there
 * is no value present for the required field `myField` (because the key `required` will be `true` in the object
 * `myForm.myField.$error`).
 *
 * ### Message order
 *
 * By default, `ngMessages` will only display one message for a particular key/value collection at any time. If more
 * than one message (or error) key is currently true, then which message is shown is determined by the order of messages
 * in the HTML template code (messages declared first are prioritised). This mechanism means the developer does not have
 * to prioritize messages using custom JavaScript code.
 *
 * Given the following error object for our example (which informs us that the field `myField` currently has both the
 * `required` and `email` errors):
 *
 * ```javascript
 * <!-- keep in mind that ngModel automatically sets these error flags -->
 * myField.$error = { required : true, email: true, maxlength: false };
 * ```
 * The `required` message will be displayed to the user since it appears before the `email` message in the DOM.
 * Once the user types a single character, the `required` message will disappear (since the field now has a value)
 * but the `email` message will be visible because it is still applicable.
 *
 * ### Displaying multiple messages at the same time
 *
 * While `ngMessages` will by default only display one error element at a time, the `ng-messages-multiple` attribute can
 * be applied to the `ngMessages` container element to cause it to display all applicable error messages at once:
 *
 * ```html
 * <!-- attribute-style usage -->
 * <div ng-messages="myForm.myField.$error" ng-messages-multiple>...</div>
 *
 * <!-- element-style usage -->
 * <ng-messages for="myForm.myField.$error" multiple>...</ng-messages>
 * ```
 *
 * ## Reusing and Overriding Messages
 * In addition to prioritization, ngMessages also allows for including messages from a remote or an inline
 * template. This allows for generic collection of messages to be reused across multiple parts of an
 * application.
 *
 * ```html
 * <script type="text/ng-template" id="error-messages">
 *   <div ng-message="required">This field is required</div>
 *   <div ng-message="minlength">This field is too short</div>
 * </script>
 *
 * <div ng-messages="myForm.myField.$error" role="alert">
 *   <div ng-messages-include="error-messages"></div>
 * </div>
 * ```
 *
 * However, including generic messages may not be useful enough to match all input fields, therefore,
 * `ngMessages` provides the ability to override messages defined in the remote template by redefining
 * them within the directive container.
 *
 * ```html
 * <!-- a generic template of error messages known as "my-custom-messages" -->
 * <script type="text/ng-template" id="my-custom-messages">
 *   <div ng-message="required">This field is required</div>
 *   <div ng-message="minlength">This field is too short</div>
 * </script>
 *
 * <form name="myForm">
 *   <label>
 *     Email address
 *     <input type="email"
 *            id="email"
 *            name="myEmail"
 *            ng-model="email"
 *            minlength="5"
 *            required />
 *   </label>
 *   <!-- any ng-message elements that appear BEFORE the ng-messages-include will
 *        override the messages present in the ng-messages-include template -->
 *   <div ng-messages="myForm.myEmail.$error" role="alert">
 *     <!-- this required message has overridden the template message -->
 *     <div ng-message="required">You did not enter your email address</div>
 *
 *     <!-- this is a brand new message and will appear last in the prioritization -->
 *     <div ng-message="email">Your email address is invalid</div>
 *
 *     <!-- and here are the generic error messages -->
 *     <div ng-messages-include="my-custom-messages"></div>
 *   </div>
 * </form>
 * ```
 *
 * In the example HTML code above the message that is set on required will override the corresponding
 * required message defined within the remote template. Therefore, with particular input fields (such
 * email addresses, date fields, autocomplete inputs, etc...), specialized error messages can be applied
 * while more generic messages can be used to handle other, more general input errors.
 *
 * ## Dynamic Messaging
 * ngMessages also supports using expressions to dynamically change key values. Using arrays and
 * repeaters to list messages is also supported. This means that the code below will be able to
 * fully adapt itself and display the appropriate message when any of the expression data changes:
 *
 * ```html
 * <form name="myForm">
 *   <label>
 *     Email address
 *     <input type="email"
 *            name="myEmail"
 *            ng-model="email"
 *            minlength="5"
 *            required />
 *   </label>
 *   <div ng-messages="myForm.myEmail.$error" role="alert">
 *     <div ng-message="required">You did not enter your email address</div>
 *     <div ng-repeat="errorMessage in errorMessages">
 *       <!-- use ng-message-exp for a message whose key is given by an expression -->
 *       <div ng-message-exp="errorMessage.type">{{ errorMessage.text }}</div>
 *     </div>
 *   </div>
 * </form>
 * ```
 *
 * The `errorMessage.type` expression can be a string value or it can be an array so
 * that multiple errors can be associated with a single error message:
 *
 * ```html
 *   <label>
 *     Email address
 *     <input type="email"
 *            ng-model="data.email"
 *            name="myEmail"
 *            ng-minlength="5"
 *            ng-maxlength="100"
 *            required />
 *   </label>
 *   <div ng-messages="myForm.myEmail.$error" role="alert">
 *     <div ng-message-exp="'required'">You did not enter your email address</div>
 *     <div ng-message-exp="['minlength', 'maxlength']">
 *       Your email must be between 5 and 100 characters long
 *     </div>
 *   </div>
 * ```
 *
 * Feel free to use other structural directives such as ng-if and ng-switch to further control
 * what messages are active and when. Be careful, if you place ng-message on the same element
 * as these structural directives, Angular may not be able to determine if a message is active
 * or not. Therefore it is best to place the ng-message on a child element of the structural
 * directive.
 *
 * ```html
 * <div ng-messages="myForm.myEmail.$error" role="alert">
 *   <div ng-if="showRequiredError">
 *     <div ng-message="required">Please enter something</div>
 *   </div>
 * </div>
 * ```
 *
 * ## Animations
 * If the `ngAnimate` module is active within the application then the `ngMessages`, `ngMessage` and
 * `ngMessageExp` directives will trigger animations whenever any messages are added and removed from
 * the DOM by the `ngMessages` directive.
 *
 * Whenever the `ngMessages` directive contains one or more visible messages then the `.ng-active` CSS
 * class will be added to the element. The `.ng-inactive` CSS class will be applied when there are no
 * messages present. Therefore, CSS transitions and keyframes as well as JavaScript animations can
 * hook into the animations whenever these classes are added/removed.
 *
 * Let's say that our HTML code for our messages container looks like so:
 *
 * ```html
 * <div ng-messages="myMessages" class="my-messages" role="alert">
 *   <div ng-message="alert" class="some-message">...</div>
 *   <div ng-message="fail" class="some-message">...</div>
 * </div>
 * ```
 *
 * Then the CSS animation code for the message container looks like so:
 *
 * ```css
 * .my-messages {
 *   transition:1s linear all;
 * }
 * .my-messages.ng-active {
 *   // messages are visible
 * }
 * .my-messages.ng-inactive {
 *   // messages are hidden
 * }
 * ```
 *
 * Whenever an inner message is attached (becomes visible) or removed (becomes hidden) then the enter
 * and leave animation is triggered for each particular element bound to the `ngMessage` directive.
 *
 * Therefore, the CSS code for the inner messages looks like so:
 *
 * ```css
 * .some-message {
 *   transition:1s linear all;
 * }
 *
 * .some-message.ng-enter {}
 * .some-message.ng-enter.ng-enter-active {}
 *
 * .some-message.ng-leave {}
 * .some-message.ng-leave.ng-leave-active {}
 * ```
 *
 * {@link ngAnimate Click here} to learn how to use JavaScript animations or to learn more about ngAnimate.
 */
angular.module('ngMessages', [], function initAngularHelpers() {
  // Access helpers from angular core.
  // Do it inside a `config` block to ensure `window.angular` is available.
  forEach = angular.forEach;
  isArray = angular.isArray;
  isString = angular.isString;
  jqLite = angular.element;
})
  .info({ angularVersion: '1.6.4' })

  /**
   * @ngdoc directive
   * @module ngMessages
   * @name ngMessages
   * @restrict AE
   *
   * @description
   * `ngMessages` is a directive that is designed to show and hide messages based on the state
   * of a key/value object that it listens on. The directive itself complements error message
   * reporting with the `ngModel` $error object (which stores a key/value state of validation errors).
   *
   * `ngMessages` manages the state of internal messages within its container element. The internal
   * messages use the `ngMessage` directive and will be inserted/removed from the page depending
   * on if they're present within the key/value object. By default, only one message will be displayed
   * at a time and this depends on the prioritization of the messages within the template. (This can
   * be changed by using the `ng-messages-multiple` or `multiple` attribute on the directive container.)
   *
   * A remote template can also be used to promote message reusability and messages can also be
   * overridden.
   *
   * {@link module:ngMessages Click here} to learn more about `ngMessages` and `ngMessage`.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression" role="alert">
   *   <ANY ng-message="stringValue">...</ANY>
   *   <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
   *   <ANY ng-message-exp="expressionValue">...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression" role="alert">
   *   <ng-message when="stringValue">...</ng-message>
   *   <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
   *   <ng-message when-exp="expressionValue">...</ng-message>
   * </ng-messages>
   * ```
   *
   * @param {string} ngMessages an angular expression evaluating to a key/value object
   *                 (this is typically the $error object on an ngModel instance).
   * @param {string=} ngMessagesMultiple|multiple when set, all messages will be displayed with true
   *
   * @example
   * <example name="ngMessages-directive" module="ngMessagesExample"
   *          deps="angular-messages.js"
   *          animations="true" fixBase="true">
   *   <file name="index.html">
   *     <form name="myForm">
   *       <label>
   *         Enter your name:
   *         <input type="text"
   *                name="myName"
   *                ng-model="name"
   *                ng-minlength="5"
   *                ng-maxlength="20"
   *                required />
   *       </label>
   *       <pre>myForm.myName.$error = {{ myForm.myName.$error | json }}</pre>
   *
   *       <div ng-messages="myForm.myName.$error" style="color:maroon" role="alert">
   *         <div ng-message="required">You did not enter a field</div>
   *         <div ng-message="minlength">Your field is too short</div>
   *         <div ng-message="maxlength">Your field is too long</div>
   *       </div>
   *     </form>
   *   </file>
   *   <file name="script.js">
   *     angular.module('ngMessagesExample', ['ngMessages']);
   *   </file>
   * </example>
   */
  .directive('ngMessages', ['$animate', function($animate) {
    var ACTIVE_CLASS = 'ng-active';
    var INACTIVE_CLASS = 'ng-inactive';

    return {
      require: 'ngMessages',
      restrict: 'AE',
      controller: ['$element', '$scope', '$attrs', function NgMessagesCtrl($element, $scope, $attrs) {
        var ctrl = this;
        var latestKey = 0;
        var nextAttachId = 0;

        this.getAttachId = function getAttachId() { return nextAttachId++; };

        var messages = this.messages = {};
        var renderLater, cachedCollection;

        this.render = function(collection) {
          collection = collection || {};

          renderLater = false;
          cachedCollection = collection;

          // this is true if the attribute is empty or if the attribute value is truthy
          var multiple = isAttrTruthy($scope, $attrs.ngMessagesMultiple) ||
                         isAttrTruthy($scope, $attrs.multiple);

          var unmatchedMessages = [];
          var matchedKeys = {};
          var messageItem = ctrl.head;
          var messageFound = false;
          var totalMessages = 0;

          // we use != instead of !== to allow for both undefined and null values
          while (messageItem != null) {
            totalMessages++;
            var messageCtrl = messageItem.message;

            var messageUsed = false;
            if (!messageFound) {
              forEach(collection, function(value, key) {
                if (!messageUsed && truthy(value) && messageCtrl.test(key)) {
                  // this is to prevent the same error name from showing up twice
                  if (matchedKeys[key]) return;
                  matchedKeys[key] = true;

                  messageUsed = true;
                  messageCtrl.attach();
                }
              });
            }

            if (messageUsed) {
              // unless we want to display multiple messages then we should
              // set a flag here to avoid displaying the next message in the list
              messageFound = !multiple;
            } else {
              unmatchedMessages.push(messageCtrl);
            }

            messageItem = messageItem.next;
          }

          forEach(unmatchedMessages, function(messageCtrl) {
            messageCtrl.detach();
          });

          if (unmatchedMessages.length !== totalMessages) {
            $animate.setClass($element, ACTIVE_CLASS, INACTIVE_CLASS);
          } else {
            $animate.setClass($element, INACTIVE_CLASS, ACTIVE_CLASS);
          }
        };

        $scope.$watchCollection($attrs.ngMessages || $attrs['for'], ctrl.render);

        // If the element is destroyed, proactively destroy all the currently visible messages
        $element.on('$destroy', function() {
          forEach(messages, function(item) {
            item.message.detach();
          });
        });

        this.reRender = function() {
          if (!renderLater) {
            renderLater = true;
            $scope.$evalAsync(function() {
              if (renderLater && cachedCollection) {
                ctrl.render(cachedCollection);
              }
            });
          }
        };

        this.register = function(comment, messageCtrl) {
          var nextKey = latestKey.toString();
          messages[nextKey] = {
            message: messageCtrl
          };
          insertMessageNode($element[0], comment, nextKey);
          comment.$$ngMessageNode = nextKey;
          latestKey++;

          ctrl.reRender();
        };

        this.deregister = function(comment) {
          var key = comment.$$ngMessageNode;
          delete comment.$$ngMessageNode;
          removeMessageNode($element[0], comment, key);
          delete messages[key];
          ctrl.reRender();
        };

        function findPreviousMessage(parent, comment) {
          var prevNode = comment;
          var parentLookup = [];

          while (prevNode && prevNode !== parent) {
            var prevKey = prevNode.$$ngMessageNode;
            if (prevKey && prevKey.length) {
              return messages[prevKey];
            }

            // dive deeper into the DOM and examine its children for any ngMessage
            // comments that may be in an element that appears deeper in the list
            if (prevNode.childNodes.length && parentLookup.indexOf(prevNode) === -1) {
              parentLookup.push(prevNode);
              prevNode = prevNode.childNodes[prevNode.childNodes.length - 1];
            } else if (prevNode.previousSibling) {
              prevNode = prevNode.previousSibling;
            } else {
              prevNode = prevNode.parentNode;
              parentLookup.push(prevNode);
            }
          }
        }

        function insertMessageNode(parent, comment, key) {
          var messageNode = messages[key];
          if (!ctrl.head) {
            ctrl.head = messageNode;
          } else {
            var match = findPreviousMessage(parent, comment);
            if (match) {
              messageNode.next = match.next;
              match.next = messageNode;
            } else {
              messageNode.next = ctrl.head;
              ctrl.head = messageNode;
            }
          }
        }

        function removeMessageNode(parent, comment, key) {
          var messageNode = messages[key];

          var match = findPreviousMessage(parent, comment);
          if (match) {
            match.next = messageNode.next;
          } else {
            ctrl.head = messageNode.next;
          }
        }
      }]
    };

    function isAttrTruthy(scope, attr) {
     return (isString(attr) && attr.length === 0) || //empty attribute
            truthy(scope.$eval(attr));
    }

    function truthy(val) {
      return isString(val) ? val.length : !!val;
    }
  }])

  /**
   * @ngdoc directive
   * @name ngMessagesInclude
   * @restrict AE
   * @scope
   *
   * @description
   * `ngMessagesInclude` is a directive with the purpose to import existing ngMessage template
   * code from a remote template and place the downloaded template code into the exact spot
   * that the ngMessagesInclude directive is placed within the ngMessages container. This allows
   * for a series of pre-defined messages to be reused and also allows for the developer to
   * determine what messages are overridden due to the placement of the ngMessagesInclude directive.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression" role="alert">
   *   <ANY ng-messages-include="remoteTplString">...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression" role="alert">
   *   <ng-messages-include src="expressionValue1">...</ng-messages-include>
   * </ng-messages>
   * ```
   *
   * {@link module:ngMessages Click here} to learn more about `ngMessages` and `ngMessage`.
   *
   * @param {string} ngMessagesInclude|src a string value corresponding to the remote template.
   */
  .directive('ngMessagesInclude',
    ['$templateRequest', '$document', '$compile', function($templateRequest, $document, $compile) {

    return {
      restrict: 'AE',
      require: '^^ngMessages', // we only require this for validation sake
      link: function($scope, element, attrs) {
        var src = attrs.ngMessagesInclude || attrs.src;
        $templateRequest(src).then(function(html) {
          if ($scope.$$destroyed) return;

          if (isString(html) && !html.trim()) {
            // Empty template - nothing to compile
            replaceElementWithMarker(element, src);
          } else {
            // Non-empty template - compile and link
            $compile(html)($scope, function(contents) {
              element.after(contents);
              replaceElementWithMarker(element, src);
            });
          }
        });
      }
    };

    // Helpers
    function replaceElementWithMarker(element, src) {
      // A comment marker is placed for debugging purposes
      var comment = $compile.$$createComment ?
          $compile.$$createComment('ngMessagesInclude', src) :
          $document[0].createComment(' ngMessagesInclude: ' + src + ' ');
      var marker = jqLite(comment);
      element.after(marker);

      // Don't pollute the DOM anymore by keeping an empty directive element
      element.remove();
    }
  }])

  /**
   * @ngdoc directive
   * @name ngMessage
   * @restrict AE
   * @scope
   *
   * @description
   * `ngMessage` is a directive with the purpose to show and hide a particular message.
   * For `ngMessage` to operate, a parent `ngMessages` directive on a parent DOM element
   * must be situated since it determines which messages are visible based on the state
   * of the provided key/value map that `ngMessages` listens on.
   *
   * More information about using `ngMessage` can be found in the
   * {@link module:ngMessages `ngMessages` module documentation}.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression" role="alert">
   *   <ANY ng-message="stringValue">...</ANY>
   *   <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression" role="alert">
   *   <ng-message when="stringValue">...</ng-message>
   *   <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
   * </ng-messages>
   * ```
   *
   * @param {expression} ngMessage|when a string value corresponding to the message key.
   */
  .directive('ngMessage', ngMessageDirectiveFactory())


  /**
   * @ngdoc directive
   * @name ngMessageExp
   * @restrict AE
   * @priority 1
   * @scope
   *
   * @description
   * `ngMessageExp` is the same as {@link directive:ngMessage `ngMessage`}, but instead of a static
   * value, it accepts an expression to be evaluated for the message key.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression">
   *   <ANY ng-message-exp="expressionValue">...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression">
   *   <ng-message when-exp="expressionValue">...</ng-message>
   * </ng-messages>
   * ```
   *
   * {@link module:ngMessages Click here} to learn more about `ngMessages` and `ngMessage`.
   *
   * @param {expression} ngMessageExp|whenExp an expression value corresponding to the message key.
   */
  .directive('ngMessageExp', ngMessageDirectiveFactory());

function ngMessageDirectiveFactory() {
  return ['$animate', function($animate) {
    return {
      restrict: 'AE',
      transclude: 'element',
      priority: 1, // must run before ngBind, otherwise the text is set on the comment
      terminal: true,
      require: '^^ngMessages',
      link: function(scope, element, attrs, ngMessagesCtrl, $transclude) {
        var commentNode = element[0];

        var records;
        var staticExp = attrs.ngMessage || attrs.when;
        var dynamicExp = attrs.ngMessageExp || attrs.whenExp;
        var assignRecords = function(items) {
          records = items
              ? (isArray(items)
                  ? items
                  : items.split(/[\s,]+/))
              : null;
          ngMessagesCtrl.reRender();
        };

        if (dynamicExp) {
          assignRecords(scope.$eval(dynamicExp));
          scope.$watchCollection(dynamicExp, assignRecords);
        } else {
          assignRecords(staticExp);
        }

        var currentElement, messageCtrl;
        ngMessagesCtrl.register(commentNode, messageCtrl = {
          test: function(name) {
            return contains(records, name);
          },
          attach: function() {
            if (!currentElement) {
              $transclude(function(elm, newScope) {
                $animate.enter(elm, null, element);
                currentElement = elm;

                // Each time we attach this node to a message we get a new id that we can match
                // when we are destroying the node later.
                var $$attachId = currentElement.$$attachId = ngMessagesCtrl.getAttachId();

                // in the event that the element or a parent element is destroyed
                // by another structural directive then it's time
                // to deregister the message from the controller
                currentElement.on('$destroy', function() {
                  if (currentElement && currentElement.$$attachId === $$attachId) {
                    ngMessagesCtrl.deregister(commentNode);
                    messageCtrl.detach();
                  }
                  newScope.$destroy();
                });
              });
            }
          },
          detach: function() {
            if (currentElement) {
              var elm = currentElement;
              currentElement = null;
              $animate.leave(elm);
            }
          }
        });
      }
    };
  }];

  function contains(collection, key) {
    if (collection) {
      return isArray(collection)
          ? collection.indexOf(key) >= 0
          : collection.hasOwnProperty(key);
    }
  }
}


})(window, window.angular);

/**
 * @license AngularJS v1.6.4
 * (c) 2010-2017 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

var ELEMENT_NODE = 1;
var COMMENT_NODE = 8;

var ADD_CLASS_SUFFIX = '-add';
var REMOVE_CLASS_SUFFIX = '-remove';
var EVENT_CLASS_PREFIX = 'ng-';
var ACTIVE_CLASS_SUFFIX = '-active';
var PREPARE_CLASS_SUFFIX = '-prepare';

var NG_ANIMATE_CLASSNAME = 'ng-animate';
var NG_ANIMATE_CHILDREN_DATA = '$$ngAnimateChildren';

// Detect proper transitionend/animationend event names.
var CSS_PREFIX = '', TRANSITION_PROP, TRANSITIONEND_EVENT, ANIMATION_PROP, ANIMATIONEND_EVENT;

// If unprefixed events are not supported but webkit-prefixed are, use the latter.
// Otherwise, just use W3C names, browsers not supporting them at all will just ignore them.
// Note: Chrome implements `window.onwebkitanimationend` and doesn't implement `window.onanimationend`
// but at the same time dispatches the `animationend` event and not `webkitAnimationEnd`.
// Register both events in case `window.onanimationend` is not supported because of that,
// do the same for `transitionend` as Safari is likely to exhibit similar behavior.
// Also, the only modern browser that uses vendor prefixes for transitions/keyframes is webkit
// therefore there is no reason to test anymore for other vendor prefixes:
// http://caniuse.com/#search=transition
if ((window.ontransitionend === undefined) && (window.onwebkittransitionend !== undefined)) {
  CSS_PREFIX = '-webkit-';
  TRANSITION_PROP = 'WebkitTransition';
  TRANSITIONEND_EVENT = 'webkitTransitionEnd transitionend';
} else {
  TRANSITION_PROP = 'transition';
  TRANSITIONEND_EVENT = 'transitionend';
}

if ((window.onanimationend === undefined) && (window.onwebkitanimationend !== undefined)) {
  CSS_PREFIX = '-webkit-';
  ANIMATION_PROP = 'WebkitAnimation';
  ANIMATIONEND_EVENT = 'webkitAnimationEnd animationend';
} else {
  ANIMATION_PROP = 'animation';
  ANIMATIONEND_EVENT = 'animationend';
}

var DURATION_KEY = 'Duration';
var PROPERTY_KEY = 'Property';
var DELAY_KEY = 'Delay';
var TIMING_KEY = 'TimingFunction';
var ANIMATION_ITERATION_COUNT_KEY = 'IterationCount';
var ANIMATION_PLAYSTATE_KEY = 'PlayState';
var SAFE_FAST_FORWARD_DURATION_VALUE = 9999;

var ANIMATION_DELAY_PROP = ANIMATION_PROP + DELAY_KEY;
var ANIMATION_DURATION_PROP = ANIMATION_PROP + DURATION_KEY;
var TRANSITION_DELAY_PROP = TRANSITION_PROP + DELAY_KEY;
var TRANSITION_DURATION_PROP = TRANSITION_PROP + DURATION_KEY;

var ngMinErr = angular.$$minErr('ng');
function assertArg(arg, name, reason) {
  if (!arg) {
    throw ngMinErr('areq', 'Argument \'{0}\' is {1}', (name || '?'), (reason || 'required'));
  }
  return arg;
}

function mergeClasses(a,b) {
  if (!a && !b) return '';
  if (!a) return b;
  if (!b) return a;
  if (isArray(a)) a = a.join(' ');
  if (isArray(b)) b = b.join(' ');
  return a + ' ' + b;
}

function packageStyles(options) {
  var styles = {};
  if (options && (options.to || options.from)) {
    styles.to = options.to;
    styles.from = options.from;
  }
  return styles;
}

function pendClasses(classes, fix, isPrefix) {
  var className = '';
  classes = isArray(classes)
      ? classes
      : classes && isString(classes) && classes.length
          ? classes.split(/\s+/)
          : [];
  forEach(classes, function(klass, i) {
    if (klass && klass.length > 0) {
      className += (i > 0) ? ' ' : '';
      className += isPrefix ? fix + klass
                            : klass + fix;
    }
  });
  return className;
}

function removeFromArray(arr, val) {
  var index = arr.indexOf(val);
  if (val >= 0) {
    arr.splice(index, 1);
  }
}

function stripCommentsFromElement(element) {
  if (element instanceof jqLite) {
    switch (element.length) {
      case 0:
        return element;

      case 1:
        // there is no point of stripping anything if the element
        // is the only element within the jqLite wrapper.
        // (it's important that we retain the element instance.)
        if (element[0].nodeType === ELEMENT_NODE) {
          return element;
        }
        break;

      default:
        return jqLite(extractElementNode(element));
    }
  }

  if (element.nodeType === ELEMENT_NODE) {
    return jqLite(element);
  }
}

function extractElementNode(element) {
  if (!element[0]) return element;
  for (var i = 0; i < element.length; i++) {
    var elm = element[i];
    if (elm.nodeType === ELEMENT_NODE) {
      return elm;
    }
  }
}

function $$addClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.addClass(elm, className);
  });
}

function $$removeClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.removeClass(elm, className);
  });
}

function applyAnimationClassesFactory($$jqLite) {
  return function(element, options) {
    if (options.addClass) {
      $$addClass($$jqLite, element, options.addClass);
      options.addClass = null;
    }
    if (options.removeClass) {
      $$removeClass($$jqLite, element, options.removeClass);
      options.removeClass = null;
    }
  };
}

function prepareAnimationOptions(options) {
  options = options || {};
  if (!options.$$prepared) {
    var domOperation = options.domOperation || noop;
    options.domOperation = function() {
      options.$$domOperationFired = true;
      domOperation();
      domOperation = noop;
    };
    options.$$prepared = true;
  }
  return options;
}

function applyAnimationStyles(element, options) {
  applyAnimationFromStyles(element, options);
  applyAnimationToStyles(element, options);
}

function applyAnimationFromStyles(element, options) {
  if (options.from) {
    element.css(options.from);
    options.from = null;
  }
}

function applyAnimationToStyles(element, options) {
  if (options.to) {
    element.css(options.to);
    options.to = null;
  }
}

function mergeAnimationDetails(element, oldAnimation, newAnimation) {
  var target = oldAnimation.options || {};
  var newOptions = newAnimation.options || {};

  var toAdd = (target.addClass || '') + ' ' + (newOptions.addClass || '');
  var toRemove = (target.removeClass || '') + ' ' + (newOptions.removeClass || '');
  var classes = resolveElementClasses(element.attr('class'), toAdd, toRemove);

  if (newOptions.preparationClasses) {
    target.preparationClasses = concatWithSpace(newOptions.preparationClasses, target.preparationClasses);
    delete newOptions.preparationClasses;
  }

  // noop is basically when there is no callback; otherwise something has been set
  var realDomOperation = target.domOperation !== noop ? target.domOperation : null;

  extend(target, newOptions);

  // TODO(matsko or sreeramu): proper fix is to maintain all animation callback in array and call at last,but now only leave has the callback so no issue with this.
  if (realDomOperation) {
    target.domOperation = realDomOperation;
  }

  if (classes.addClass) {
    target.addClass = classes.addClass;
  } else {
    target.addClass = null;
  }

  if (classes.removeClass) {
    target.removeClass = classes.removeClass;
  } else {
    target.removeClass = null;
  }

  oldAnimation.addClass = target.addClass;
  oldAnimation.removeClass = target.removeClass;

  return target;
}

function resolveElementClasses(existing, toAdd, toRemove) {
  var ADD_CLASS = 1;
  var REMOVE_CLASS = -1;

  var flags = {};
  existing = splitClassesToLookup(existing);

  toAdd = splitClassesToLookup(toAdd);
  forEach(toAdd, function(value, key) {
    flags[key] = ADD_CLASS;
  });

  toRemove = splitClassesToLookup(toRemove);
  forEach(toRemove, function(value, key) {
    flags[key] = flags[key] === ADD_CLASS ? null : REMOVE_CLASS;
  });

  var classes = {
    addClass: '',
    removeClass: ''
  };

  forEach(flags, function(val, klass) {
    var prop, allow;
    if (val === ADD_CLASS) {
      prop = 'addClass';
      allow = !existing[klass] || existing[klass + REMOVE_CLASS_SUFFIX];
    } else if (val === REMOVE_CLASS) {
      prop = 'removeClass';
      allow = existing[klass] || existing[klass + ADD_CLASS_SUFFIX];
    }
    if (allow) {
      if (classes[prop].length) {
        classes[prop] += ' ';
      }
      classes[prop] += klass;
    }
  });

  function splitClassesToLookup(classes) {
    if (isString(classes)) {
      classes = classes.split(' ');
    }

    var obj = {};
    forEach(classes, function(klass) {
      // sometimes the split leaves empty string values
      // incase extra spaces were applied to the options
      if (klass.length) {
        obj[klass] = true;
      }
    });
    return obj;
  }

  return classes;
}

function getDomNode(element) {
  return (element instanceof jqLite) ? element[0] : element;
}

function applyGeneratedPreparationClasses(element, event, options) {
  var classes = '';
  if (event) {
    classes = pendClasses(event, EVENT_CLASS_PREFIX, true);
  }
  if (options.addClass) {
    classes = concatWithSpace(classes, pendClasses(options.addClass, ADD_CLASS_SUFFIX));
  }
  if (options.removeClass) {
    classes = concatWithSpace(classes, pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX));
  }
  if (classes.length) {
    options.preparationClasses = classes;
    element.addClass(classes);
  }
}

function clearGeneratedClasses(element, options) {
  if (options.preparationClasses) {
    element.removeClass(options.preparationClasses);
    options.preparationClasses = null;
  }
  if (options.activeClasses) {
    element.removeClass(options.activeClasses);
    options.activeClasses = null;
  }
}

function blockTransitions(node, duration) {
  // we use a negative delay value since it performs blocking
  // yet it doesn't kill any existing transitions running on the
  // same element which makes this safe for class-based animations
  var value = duration ? '-' + duration + 's' : '';
  applyInlineStyle(node, [TRANSITION_DELAY_PROP, value]);
  return [TRANSITION_DELAY_PROP, value];
}

function blockKeyframeAnimations(node, applyBlock) {
  var value = applyBlock ? 'paused' : '';
  var key = ANIMATION_PROP + ANIMATION_PLAYSTATE_KEY;
  applyInlineStyle(node, [key, value]);
  return [key, value];
}

function applyInlineStyle(node, styleTuple) {
  var prop = styleTuple[0];
  var value = styleTuple[1];
  node.style[prop] = value;
}

function concatWithSpace(a,b) {
  if (!a) return b;
  if (!b) return a;
  return a + ' ' + b;
}

var $$rAFSchedulerFactory = ['$$rAF', function($$rAF) {
  var queue, cancelFn;

  function scheduler(tasks) {
    // we make a copy since RAFScheduler mutates the state
    // of the passed in array variable and this would be difficult
    // to track down on the outside code
    queue = queue.concat(tasks);
    nextTick();
  }

  queue = scheduler.queue = [];

  /* waitUntilQuiet does two things:
   * 1. It will run the FINAL `fn` value only when an uncanceled RAF has passed through
   * 2. It will delay the next wave of tasks from running until the quiet `fn` has run.
   *
   * The motivation here is that animation code can request more time from the scheduler
   * before the next wave runs. This allows for certain DOM properties such as classes to
   * be resolved in time for the next animation to run.
   */
  scheduler.waitUntilQuiet = function(fn) {
    if (cancelFn) cancelFn();

    cancelFn = $$rAF(function() {
      cancelFn = null;
      fn();
      nextTick();
    });
  };

  return scheduler;

  function nextTick() {
    if (!queue.length) return;

    var items = queue.shift();
    for (var i = 0; i < items.length; i++) {
      items[i]();
    }

    if (!cancelFn) {
      $$rAF(function() {
        if (!cancelFn) nextTick();
      });
    }
  }
}];

/**
 * @ngdoc directive
 * @name ngAnimateChildren
 * @restrict AE
 * @element ANY
 *
 * @description
 *
 * ngAnimateChildren allows you to specify that children of this element should animate even if any
 * of the children's parents are currently animating. By default, when an element has an active `enter`, `leave`, or `move`
 * (structural) animation, child elements that also have an active structural animation are not animated.
 *
 * Note that even if `ngAnimateChildren` is set, no child animations will run when the parent element is removed from the DOM (`leave` animation).
 *
 *
 * @param {string} ngAnimateChildren If the value is empty, `true` or `on`,
 *     then child animations are allowed. If the value is `false`, child animations are not allowed.
 *
 * @example
 * <example module="ngAnimateChildren" name="ngAnimateChildren" deps="angular-animate.js" animations="true">
     <file name="index.html">
       <div ng-controller="MainController as main">
         <label>Show container? <input type="checkbox" ng-model="main.enterElement" /></label>
         <label>Animate children? <input type="checkbox" ng-model="main.animateChildren" /></label>
         <hr>
         <div ng-animate-children="{{main.animateChildren}}">
           <div ng-if="main.enterElement" class="container">
             List of items:
             <div ng-repeat="item in [0, 1, 2, 3]" class="item">Item {{item}}</div>
           </div>
         </div>
       </div>
     </file>
     <file name="animations.css">

      .container.ng-enter,
      .container.ng-leave {
        transition: all ease 1.5s;
      }

      .container.ng-enter,
      .container.ng-leave-active {
        opacity: 0;
      }

      .container.ng-leave,
      .container.ng-enter-active {
        opacity: 1;
      }

      .item {
        background: firebrick;
        color: #FFF;
        margin-bottom: 10px;
      }

      .item.ng-enter,
      .item.ng-leave {
        transition: transform 1.5s ease;
      }

      .item.ng-enter {
        transform: translateX(50px);
      }

      .item.ng-enter-active {
        transform: translateX(0);
      }
    </file>
    <file name="script.js">
      angular.module('ngAnimateChildren', ['ngAnimate'])
        .controller('MainController', function MainController() {
          this.animateChildren = false;
          this.enterElement = false;
        });
    </file>
  </example>
 */
var $$AnimateChildrenDirective = ['$interpolate', function($interpolate) {
  return {
    link: function(scope, element, attrs) {
      var val = attrs.ngAnimateChildren;
      if (isString(val) && val.length === 0) { //empty attribute
        element.data(NG_ANIMATE_CHILDREN_DATA, true);
      } else {
        // Interpolate and set the value, so that it is available to
        // animations that run right after compilation
        setData($interpolate(val)(scope));
        attrs.$observe('ngAnimateChildren', setData);
      }

      function setData(value) {
        value = value === 'on' || value === 'true';
        element.data(NG_ANIMATE_CHILDREN_DATA, value);
      }
    }
  };
}];

/* exported $AnimateCssProvider */

var ANIMATE_TIMER_KEY = '$$animateCss';

/**
 * @ngdoc service
 * @name $animateCss
 * @kind object
 *
 * @description
 * The `$animateCss` service is a useful utility to trigger customized CSS-based transitions/keyframes
 * from a JavaScript-based animation or directly from a directive. The purpose of `$animateCss` is NOT
 * to side-step how `$animate` and ngAnimate work, but the goal is to allow pre-existing animations or
 * directives to create more complex animations that can be purely driven using CSS code.
 *
 * Note that only browsers that support CSS transitions and/or keyframe animations are capable of
 * rendering animations triggered via `$animateCss` (bad news for IE9 and lower).
 *
 * ## Usage
 * Once again, `$animateCss` is designed to be used inside of a registered JavaScript animation that
 * is powered by ngAnimate. It is possible to use `$animateCss` directly inside of a directive, however,
 * any automatic control over cancelling animations and/or preventing animations from being run on
 * child elements will not be handled by Angular. For this to work as expected, please use `$animate` to
 * trigger the animation and then setup a JavaScript animation that injects `$animateCss` to trigger
 * the CSS animation.
 *
 * The example below shows how we can create a folding animation on an element using `ng-if`:
 *
 * ```html
 * <!-- notice the `fold-animation` CSS class -->
 * <div ng-if="onOff" class="fold-animation">
 *   This element will go BOOM
 * </div>
 * <button ng-click="onOff=true">Fold In</button>
 * ```
 *
 * Now we create the **JavaScript animation** that will trigger the CSS transition:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * ## More Advanced Uses
 *
 * `$animateCss` is the underlying code that ngAnimate uses to power **CSS-based animations** behind the scenes. Therefore CSS hooks
 * like `.ng-EVENT`, `.ng-EVENT-active`, `.ng-EVENT-stagger` are all features that can be triggered using `$animateCss` via JavaScript code.
 *
 * This also means that just about any combination of adding classes, removing classes, setting styles, dynamically setting a keyframe animation,
 * applying a hardcoded duration or delay value, changing the animation easing or applying a stagger animation are all options that work with
 * `$animateCss`. The service itself is smart enough to figure out the combination of options and examine the element styling properties in order
 * to provide a working animation that will run in CSS.
 *
 * The example below showcases a more advanced version of the `.fold-animation` from the example above:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         addClass: 'red large-text pulse-twice',
 *         easing: 'ease-out',
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * Since we're adding/removing CSS classes then the CSS transition will also pick those up:
 *
 * ```css
 * /&#42; since a hardcoded duration value of 1 was provided in the JavaScript animation code,
 * the CSS classes below will be transitioned despite them being defined as regular CSS classes &#42;/
 * .red { background:red; }
 * .large-text { font-size:20px; }
 *
 * /&#42; we can also use a keyframe animation and $animateCss will make it work alongside the transition &#42;/
 * .pulse-twice {
 *   animation: 0.5s pulse linear 2;
 *   -webkit-animation: 0.5s pulse linear 2;
 * }
 *
 * @keyframes pulse {
 *   from { transform: scale(0.5); }
 *   to { transform: scale(1.5); }
 * }
 *
 * @-webkit-keyframes pulse {
 *   from { -webkit-transform: scale(0.5); }
 *   to { -webkit-transform: scale(1.5); }
 * }
 * ```
 *
 * Given this complex combination of CSS classes, styles and options, `$animateCss` will figure everything out and make the animation happen.
 *
 * ## How the Options are handled
 *
 * `$animateCss` is very versatile and intelligent when it comes to figuring out what configurations to apply to the element to ensure the animation
 * works with the options provided. Say for example we were adding a class that contained a keyframe value and we wanted to also animate some inline
 * styles using the `from` and `to` properties.
 *
 * ```js
 * var animator = $animateCss(element, {
 *   from: { background:'red' },
 *   to: { background:'blue' }
 * });
 * animator.start();
 * ```
 *
 * ```css
 * .rotating-animation {
 *   animation:0.5s rotate linear;
 *   -webkit-animation:0.5s rotate linear;
 * }
 *
 * @keyframes rotate {
 *   from { transform: rotate(0deg); }
 *   to { transform: rotate(360deg); }
 * }
 *
 * @-webkit-keyframes rotate {
 *   from { -webkit-transform: rotate(0deg); }
 *   to { -webkit-transform: rotate(360deg); }
 * }
 * ```
 *
 * The missing pieces here are that we do not have a transition set (within the CSS code nor within the `$animateCss` options) and the duration of the animation is
 * going to be detected from what the keyframe styles on the CSS class are. In this event, `$animateCss` will automatically create an inline transition
 * style matching the duration detected from the keyframe style (which is present in the CSS class that is being added) and then prepare both the transition
 * and keyframe animations to run in parallel on the element. Then when the animation is underway the provided `from` and `to` CSS styles will be applied
 * and spread across the transition and keyframe animation.
 *
 * ## What is returned
 *
 * `$animateCss` works in two stages: a preparation phase and an animation phase. Therefore when `$animateCss` is first called it will NOT actually
 * start the animation. All that is going on here is that the element is being prepared for the animation (which means that the generated CSS classes are
 * added and removed on the element). Once `$animateCss` is called it will return an object with the following properties:
 *
 * ```js
 * var animator = $animateCss(element, { ... });
 * ```
 *
 * Now what do the contents of our `animator` variable look like:
 *
 * ```js
 * {
 *   // starts the animation
 *   start: Function,
 *
 *   // ends (aborts) the animation
 *   end: Function
 * }
 * ```
 *
 * To actually start the animation we need to run `animation.start()` which will then return a promise that we can hook into to detect when the animation ends.
 * If we choose not to run the animation then we MUST run `animation.end()` to perform a cleanup on the element (since some CSS classes and styles may have been
 * applied to the element during the preparation phase). Note that all other properties such as duration, delay, transitions and keyframes are just properties
 * and that changing them will not reconfigure the parameters of the animation.
 *
 * ### runner.done() vs runner.then()
 * It is documented that `animation.start()` will return a promise object and this is true, however, there is also an additional method available on the
 * runner called `.done(callbackFn)`. The done method works the same as `.finally(callbackFn)`, however, it does **not trigger a digest to occur**.
 * Therefore, for performance reasons, it's always best to use `runner.done(callback)` instead of `runner.then()`, `runner.catch()` or `runner.finally()`
 * unless you really need a digest to kick off afterwards.
 *
 * Keep in mind that, to make this easier, ngAnimate has tweaked the JS animations API to recognize when a runner instance is returned from $animateCss
 * (so there is no need to call `runner.done(doneFn)` inside of your JavaScript animation code).
 * Check the {@link ngAnimate.$animateCss#usage animation code above} to see how this works.
 *
 * @param {DOMElement} element the element that will be animated
 * @param {object} options the animation-related options that will be applied during the animation
 *
 * * `event` - The DOM event (e.g. enter, leave, move). When used, a generated CSS class of `ng-EVENT` and `ng-EVENT-active` will be applied
 * to the element during the animation. Multiple events can be provided when spaces are used as a separator. (Note that this will not perform any DOM operation.)
 * * `structural` - Indicates that the `ng-` prefix will be added to the event class. Setting to `false` or omitting will turn `ng-EVENT` and
 * `ng-EVENT-active` in `EVENT` and `EVENT-active`. Unused if `event` is omitted.
 * * `easing` - The CSS easing value that will be applied to the transition or keyframe animation (or both).
 * * `transitionStyle` - The raw CSS transition style that will be used (e.g. `1s linear all`).
 * * `keyframeStyle` - The raw CSS keyframe animation style that will be used (e.g. `1s my_animation linear`).
 * * `from` - The starting CSS styles (a key/value object) that will be applied at the start of the animation.
 * * `to` - The ending CSS styles (a key/value object) that will be applied across the animation via a CSS transition.
 * * `addClass` - A space separated list of CSS classes that will be added to the element and spread across the animation.
 * * `removeClass` - A space separated list of CSS classes that will be removed from the element and spread across the animation.
 * * `duration` - A number value representing the total duration of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `0`
 * is provided then the animation will be skipped entirely.
 * * `delay` - A number value representing the total delay of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `true` is
 * used then whatever delay value is detected from the CSS classes will be mirrored on the elements styles (e.g. by setting delay true then the style value
 * of the element will be `transition-delay: DETECTED_VALUE`). Using `true` is useful when you want the CSS classes and inline styles to all share the same
 * CSS delay value.
 * * `stagger` - A numeric time value representing the delay between successively animated elements
 * ({@link ngAnimate#css-staggering-animations Click here to learn how CSS-based staggering works in ngAnimate.})
 * * `staggerIndex` - The numeric index representing the stagger item (e.g. a value of 5 is equal to the sixth item in the stagger; therefore when a
 *   `stagger` option value of `0.1` is used then there will be a stagger delay of `600ms`)
 * * `applyClassesEarly` - Whether or not the classes being added or removed will be used when detecting the animation. This is set by `$animate` when enter/leave/move animations are fired to ensure that the CSS classes are resolved in time. (Note that this will prevent any transitions from occurring on the classes being added and removed.)
 * * `cleanupStyles` - Whether or not the provided `from` and `to` styles will be removed once
 *    the animation is closed. This is useful for when the styles are used purely for the sake of
 *    the animation and do not have a lasting visual effect on the element (e.g. a collapse and open animation).
 *    By default this value is set to `false`.
 *
 * @return {object} an object with start and end methods and details about the animation.
 *
 * * `start` - The method to start the animation. This will return a `Promise` when called.
 * * `end` - This method will cancel the animation and remove all applied CSS classes and styles.
 */
var ONE_SECOND = 1000;

var ELAPSED_TIME_MAX_DECIMAL_PLACES = 3;
var CLOSING_TIME_BUFFER = 1.5;

var DETECT_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  transitionProperty:      TRANSITION_PROP + PROPERTY_KEY,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP,
  animationIterationCount: ANIMATION_PROP + ANIMATION_ITERATION_COUNT_KEY
};

var DETECT_STAGGER_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP
};

function getCssKeyframeDurationStyle(duration) {
  return [ANIMATION_DURATION_PROP, duration + 's'];
}

function getCssDelayStyle(delay, isKeyframeAnimation) {
  var prop = isKeyframeAnimation ? ANIMATION_DELAY_PROP : TRANSITION_DELAY_PROP;
  return [prop, delay + 's'];
}

function computeCssStyles($window, element, properties) {
  var styles = Object.create(null);
  var detectedStyles = $window.getComputedStyle(element) || {};
  forEach(properties, function(formalStyleName, actualStyleName) {
    var val = detectedStyles[formalStyleName];
    if (val) {
      var c = val.charAt(0);

      // only numerical-based values have a negative sign or digit as the first value
      if (c === '-' || c === '+' || c >= 0) {
        val = parseMaxTime(val);
      }

      // by setting this to null in the event that the delay is not set or is set directly as 0
      // then we can still allow for negative values to be used later on and not mistake this
      // value for being greater than any other negative value.
      if (val === 0) {
        val = null;
      }
      styles[actualStyleName] = val;
    }
  });

  return styles;
}

function parseMaxTime(str) {
  var maxValue = 0;
  var values = str.split(/\s*,\s*/);
  forEach(values, function(value) {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (value.charAt(value.length - 1) === 's') {
      value = value.substring(0, value.length - 1);
    }
    value = parseFloat(value) || 0;
    maxValue = maxValue ? Math.max(value, maxValue) : value;
  });
  return maxValue;
}

function truthyTimingValue(val) {
  return val === 0 || val != null;
}

function getCssTransitionDurationStyle(duration, applyOnlyDuration) {
  var style = TRANSITION_PROP;
  var value = duration + 's';
  if (applyOnlyDuration) {
    style += DURATION_KEY;
  } else {
    value += ' linear all';
  }
  return [style, value];
}

function createLocalCacheLookup() {
  var cache = Object.create(null);
  return {
    flush: function() {
      cache = Object.create(null);
    },

    count: function(key) {
      var entry = cache[key];
      return entry ? entry.total : 0;
    },

    get: function(key) {
      var entry = cache[key];
      return entry && entry.value;
    },

    put: function(key, value) {
      if (!cache[key]) {
        cache[key] = { total: 1, value: value };
      } else {
        cache[key].total++;
      }
    }
  };
}

// we do not reassign an already present style value since
// if we detect the style property value again we may be
// detecting styles that were added via the `from` styles.
// We make use of `isDefined` here since an empty string
// or null value (which is what getPropertyValue will return
// for a non-existing style) will still be marked as a valid
// value for the style (a falsy value implies that the style
// is to be removed at the end of the animation). If we had a simple
// "OR" statement then it would not be enough to catch that.
function registerRestorableStyles(backup, node, properties) {
  forEach(properties, function(prop) {
    backup[prop] = isDefined(backup[prop])
        ? backup[prop]
        : node.style.getPropertyValue(prop);
  });
}

var $AnimateCssProvider = ['$animateProvider', /** @this */ function($animateProvider) {
  var gcsLookup = createLocalCacheLookup();
  var gcsStaggerLookup = createLocalCacheLookup();

  this.$get = ['$window', '$$jqLite', '$$AnimateRunner', '$timeout',
               '$$forceReflow', '$sniffer', '$$rAFScheduler', '$$animateQueue',
       function($window,   $$jqLite,   $$AnimateRunner,   $timeout,
                $$forceReflow,   $sniffer,   $$rAFScheduler, $$animateQueue) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    var parentCounter = 0;
    function gcsHashFn(node, extraClasses) {
      var KEY = '$$ngAnimateParentKey';
      var parentNode = node.parentNode;
      var parentID = parentNode[KEY] || (parentNode[KEY] = ++parentCounter);
      return parentID + '-' + node.getAttribute('class') + '-' + extraClasses;
    }

    function computeCachedCssStyles(node, className, cacheKey, properties) {
      var timings = gcsLookup.get(cacheKey);

      if (!timings) {
        timings = computeCssStyles($window, node, properties);
        if (timings.animationIterationCount === 'infinite') {
          timings.animationIterationCount = 1;
        }
      }

      // we keep putting this in multiple times even though the value and the cacheKey are the same
      // because we're keeping an internal tally of how many duplicate animations are detected.
      gcsLookup.put(cacheKey, timings);
      return timings;
    }

    function computeCachedCssStaggerStyles(node, className, cacheKey, properties) {
      var stagger;

      // if we have one or more existing matches of matching elements
      // containing the same parent + CSS styles (which is how cacheKey works)
      // then staggering is possible
      if (gcsLookup.count(cacheKey) > 0) {
        stagger = gcsStaggerLookup.get(cacheKey);

        if (!stagger) {
          var staggerClassName = pendClasses(className, '-stagger');

          $$jqLite.addClass(node, staggerClassName);

          stagger = computeCssStyles($window, node, properties);

          // force the conversion of a null value to zero incase not set
          stagger.animationDuration = Math.max(stagger.animationDuration, 0);
          stagger.transitionDuration = Math.max(stagger.transitionDuration, 0);

          $$jqLite.removeClass(node, staggerClassName);

          gcsStaggerLookup.put(cacheKey, stagger);
        }
      }

      return stagger || {};
    }

    var rafWaitQueue = [];
    function waitUntilQuiet(callback) {
      rafWaitQueue.push(callback);
      $$rAFScheduler.waitUntilQuiet(function() {
        gcsLookup.flush();
        gcsStaggerLookup.flush();

        // DO NOT REMOVE THIS LINE OR REFACTOR OUT THE `pageWidth` variable.
        // PLEASE EXAMINE THE `$$forceReflow` service to understand why.
        var pageWidth = $$forceReflow();

        // we use a for loop to ensure that if the queue is changed
        // during this looping then it will consider new requests
        for (var i = 0; i < rafWaitQueue.length; i++) {
          rafWaitQueue[i](pageWidth);
        }
        rafWaitQueue.length = 0;
      });
    }

    function computeTimings(node, className, cacheKey) {
      var timings = computeCachedCssStyles(node, className, cacheKey, DETECT_CSS_PROPERTIES);
      var aD = timings.animationDelay;
      var tD = timings.transitionDelay;
      timings.maxDelay = aD && tD
          ? Math.max(aD, tD)
          : (aD || tD);
      timings.maxDuration = Math.max(
          timings.animationDuration * timings.animationIterationCount,
          timings.transitionDuration);

      return timings;
    }

    return function init(element, initialOptions) {
      // all of the animation functions should create
      // a copy of the options data, however, if a
      // parent service has already created a copy then
      // we should stick to using that
      var options = initialOptions || {};
      if (!options.$$prepared) {
        options = prepareAnimationOptions(copy(options));
      }

      var restoreStyles = {};
      var node = getDomNode(element);
      if (!node
          || !node.parentNode
          || !$$animateQueue.enabled()) {
        return closeAndReturnNoopAnimator();
      }

      var temporaryStyles = [];
      var classes = element.attr('class');
      var styles = packageStyles(options);
      var animationClosed;
      var animationPaused;
      var animationCompleted;
      var runner;
      var runnerHost;
      var maxDelay;
      var maxDelayTime;
      var maxDuration;
      var maxDurationTime;
      var startTime;
      var events = [];

      if (options.duration === 0 || (!$sniffer.animations && !$sniffer.transitions)) {
        return closeAndReturnNoopAnimator();
      }

      var method = options.event && isArray(options.event)
            ? options.event.join(' ')
            : options.event;

      var isStructural = method && options.structural;
      var structuralClassName = '';
      var addRemoveClassName = '';

      if (isStructural) {
        structuralClassName = pendClasses(method, EVENT_CLASS_PREFIX, true);
      } else if (method) {
        structuralClassName = method;
      }

      if (options.addClass) {
        addRemoveClassName += pendClasses(options.addClass, ADD_CLASS_SUFFIX);
      }

      if (options.removeClass) {
        if (addRemoveClassName.length) {
          addRemoveClassName += ' ';
        }
        addRemoveClassName += pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX);
      }

      // there may be a situation where a structural animation is combined together
      // with CSS classes that need to resolve before the animation is computed.
      // However this means that there is no explicit CSS code to block the animation
      // from happening (by setting 0s none in the class name). If this is the case
      // we need to apply the classes before the first rAF so we know to continue if
      // there actually is a detected transition or keyframe animation
      if (options.applyClassesEarly && addRemoveClassName.length) {
        applyAnimationClasses(element, options);
      }

      var preparationClasses = [structuralClassName, addRemoveClassName].join(' ').trim();
      var fullClassName = classes + ' ' + preparationClasses;
      var activeClasses = pendClasses(preparationClasses, ACTIVE_CLASS_SUFFIX);
      var hasToStyles = styles.to && Object.keys(styles.to).length > 0;
      var containsKeyframeAnimation = (options.keyframeStyle || '').length > 0;

      // there is no way we can trigger an animation if no styles and
      // no classes are being applied which would then trigger a transition,
      // unless there a is raw keyframe value that is applied to the element.
      if (!containsKeyframeAnimation
           && !hasToStyles
           && !preparationClasses) {
        return closeAndReturnNoopAnimator();
      }

      var cacheKey, stagger;
      if (options.stagger > 0) {
        var staggerVal = parseFloat(options.stagger);
        stagger = {
          transitionDelay: staggerVal,
          animationDelay: staggerVal,
          transitionDuration: 0,
          animationDuration: 0
        };
      } else {
        cacheKey = gcsHashFn(node, fullClassName);
        stagger = computeCachedCssStaggerStyles(node, preparationClasses, cacheKey, DETECT_STAGGER_CSS_PROPERTIES);
      }

      if (!options.$$skipPreparationClasses) {
        $$jqLite.addClass(element, preparationClasses);
      }

      var applyOnlyDuration;

      if (options.transitionStyle) {
        var transitionStyle = [TRANSITION_PROP, options.transitionStyle];
        applyInlineStyle(node, transitionStyle);
        temporaryStyles.push(transitionStyle);
      }

      if (options.duration >= 0) {
        applyOnlyDuration = node.style[TRANSITION_PROP].length > 0;
        var durationStyle = getCssTransitionDurationStyle(options.duration, applyOnlyDuration);

        // we set the duration so that it will be picked up by getComputedStyle later
        applyInlineStyle(node, durationStyle);
        temporaryStyles.push(durationStyle);
      }

      if (options.keyframeStyle) {
        var keyframeStyle = [ANIMATION_PROP, options.keyframeStyle];
        applyInlineStyle(node, keyframeStyle);
        temporaryStyles.push(keyframeStyle);
      }

      var itemIndex = stagger
          ? options.staggerIndex >= 0
              ? options.staggerIndex
              : gcsLookup.count(cacheKey)
          : 0;

      var isFirst = itemIndex === 0;

      // this is a pre-emptive way of forcing the setup classes to be added and applied INSTANTLY
      // without causing any combination of transitions to kick in. By adding a negative delay value
      // it forces the setup class' transition to end immediately. We later then remove the negative
      // transition delay to allow for the transition to naturally do it's thing. The beauty here is
      // that if there is no transition defined then nothing will happen and this will also allow
      // other transitions to be stacked on top of each other without any chopping them out.
      if (isFirst && !options.skipBlocking) {
        blockTransitions(node, SAFE_FAST_FORWARD_DURATION_VALUE);
      }

      var timings = computeTimings(node, fullClassName, cacheKey);
      var relativeDelay = timings.maxDelay;
      maxDelay = Math.max(relativeDelay, 0);
      maxDuration = timings.maxDuration;

      var flags = {};
      flags.hasTransitions          = timings.transitionDuration > 0;
      flags.hasAnimations           = timings.animationDuration > 0;
      flags.hasTransitionAll        = flags.hasTransitions && timings.transitionProperty === 'all';
      flags.applyTransitionDuration = hasToStyles && (
                                        (flags.hasTransitions && !flags.hasTransitionAll)
                                         || (flags.hasAnimations && !flags.hasTransitions));
      flags.applyAnimationDuration  = options.duration && flags.hasAnimations;
      flags.applyTransitionDelay    = truthyTimingValue(options.delay) && (flags.applyTransitionDuration || flags.hasTransitions);
      flags.applyAnimationDelay     = truthyTimingValue(options.delay) && flags.hasAnimations;
      flags.recalculateTimingStyles = addRemoveClassName.length > 0;

      if (flags.applyTransitionDuration || flags.applyAnimationDuration) {
        maxDuration = options.duration ? parseFloat(options.duration) : maxDuration;

        if (flags.applyTransitionDuration) {
          flags.hasTransitions = true;
          timings.transitionDuration = maxDuration;
          applyOnlyDuration = node.style[TRANSITION_PROP + PROPERTY_KEY].length > 0;
          temporaryStyles.push(getCssTransitionDurationStyle(maxDuration, applyOnlyDuration));
        }

        if (flags.applyAnimationDuration) {
          flags.hasAnimations = true;
          timings.animationDuration = maxDuration;
          temporaryStyles.push(getCssKeyframeDurationStyle(maxDuration));
        }
      }

      if (maxDuration === 0 && !flags.recalculateTimingStyles) {
        return closeAndReturnNoopAnimator();
      }

      if (options.delay != null) {
        var delayStyle;
        if (typeof options.delay !== 'boolean') {
          delayStyle = parseFloat(options.delay);
          // number in options.delay means we have to recalculate the delay for the closing timeout
          maxDelay = Math.max(delayStyle, 0);
        }

        if (flags.applyTransitionDelay) {
          temporaryStyles.push(getCssDelayStyle(delayStyle));
        }

        if (flags.applyAnimationDelay) {
          temporaryStyles.push(getCssDelayStyle(delayStyle, true));
        }
      }

      // we need to recalculate the delay value since we used a pre-emptive negative
      // delay value and the delay value is required for the final event checking. This
      // property will ensure that this will happen after the RAF phase has passed.
      if (options.duration == null && timings.transitionDuration > 0) {
        flags.recalculateTimingStyles = flags.recalculateTimingStyles || isFirst;
      }

      maxDelayTime = maxDelay * ONE_SECOND;
      maxDurationTime = maxDuration * ONE_SECOND;
      if (!options.skipBlocking) {
        flags.blockTransition = timings.transitionDuration > 0;
        flags.blockKeyframeAnimation = timings.animationDuration > 0 &&
                                       stagger.animationDelay > 0 &&
                                       stagger.animationDuration === 0;
      }

      if (options.from) {
        if (options.cleanupStyles) {
          registerRestorableStyles(restoreStyles, node, Object.keys(options.from));
        }
        applyAnimationFromStyles(element, options);
      }

      if (flags.blockTransition || flags.blockKeyframeAnimation) {
        applyBlocking(maxDuration);
      } else if (!options.skipBlocking) {
        blockTransitions(node, false);
      }

      // TODO(matsko): for 1.5 change this code to have an animator object for better debugging
      return {
        $$willAnimate: true,
        end: endFn,
        start: function() {
          if (animationClosed) return;

          runnerHost = {
            end: endFn,
            cancel: cancelFn,
            resume: null, //this will be set during the start() phase
            pause: null
          };

          runner = new $$AnimateRunner(runnerHost);

          waitUntilQuiet(start);

          // we don't have access to pause/resume the animation
          // since it hasn't run yet. AnimateRunner will therefore
          // set noop functions for resume and pause and they will
          // later be overridden once the animation is triggered
          return runner;
        }
      };

      function endFn() {
        close();
      }

      function cancelFn() {
        close(true);
      }

      function close(rejected) {
        // if the promise has been called already then we shouldn't close
        // the animation again
        if (animationClosed || (animationCompleted && animationPaused)) return;
        animationClosed = true;
        animationPaused = false;

        if (!options.$$skipPreparationClasses) {
          $$jqLite.removeClass(element, preparationClasses);
        }
        $$jqLite.removeClass(element, activeClasses);

        blockKeyframeAnimations(node, false);
        blockTransitions(node, false);

        forEach(temporaryStyles, function(entry) {
          // There is only one way to remove inline style properties entirely from elements.
          // By using `removeProperty` this works, but we need to convert camel-cased CSS
          // styles down to hyphenated values.
          node.style[entry[0]] = '';
        });

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);

        if (Object.keys(restoreStyles).length) {
          forEach(restoreStyles, function(value, prop) {
            if (value) {
              node.style.setProperty(prop, value);
            } else {
              node.style.removeProperty(prop);
            }
          });
        }

        // the reason why we have this option is to allow a synchronous closing callback
        // that is fired as SOON as the animation ends (when the CSS is removed) or if
        // the animation never takes off at all. A good example is a leave animation since
        // the element must be removed just after the animation is over or else the element
        // will appear on screen for one animation frame causing an overbearing flicker.
        if (options.onDone) {
          options.onDone();
        }

        if (events && events.length) {
          // Remove the transitionend / animationend listener(s)
          element.off(events.join(' '), onAnimationProgress);
        }

        //Cancel the fallback closing timeout and remove the timer data
        var animationTimerData = element.data(ANIMATE_TIMER_KEY);
        if (animationTimerData) {
          $timeout.cancel(animationTimerData[0].timer);
          element.removeData(ANIMATE_TIMER_KEY);
        }

        // if the preparation function fails then the promise is not setup
        if (runner) {
          runner.complete(!rejected);
        }
      }

      function applyBlocking(duration) {
        if (flags.blockTransition) {
          blockTransitions(node, duration);
        }

        if (flags.blockKeyframeAnimation) {
          blockKeyframeAnimations(node, !!duration);
        }
      }

      function closeAndReturnNoopAnimator() {
        runner = new $$AnimateRunner({
          end: endFn,
          cancel: cancelFn
        });

        // should flush the cache animation
        waitUntilQuiet(noop);
        close();

        return {
          $$willAnimate: false,
          start: function() {
            return runner;
          },
          end: endFn
        };
      }

      function onAnimationProgress(event) {
        event.stopPropagation();
        var ev = event.originalEvent || event;

        // we now always use `Date.now()` due to the recent changes with
        // event.timeStamp in Firefox, Webkit and Chrome (see #13494 for more info)
        var timeStamp = ev.$manualTimeStamp || Date.now();

        /* Firefox (or possibly just Gecko) likes to not round values up
         * when a ms measurement is used for the animation */
        var elapsedTime = parseFloat(ev.elapsedTime.toFixed(ELAPSED_TIME_MAX_DECIMAL_PLACES));

        /* $manualTimeStamp is a mocked timeStamp value which is set
         * within browserTrigger(). This is only here so that tests can
         * mock animations properly. Real events fallback to event.timeStamp,
         * or, if they don't, then a timeStamp is automatically created for them.
         * We're checking to see if the timeStamp surpasses the expected delay,
         * but we're using elapsedTime instead of the timeStamp on the 2nd
         * pre-condition since animationPauseds sometimes close off early */
        if (Math.max(timeStamp - startTime, 0) >= maxDelayTime && elapsedTime >= maxDuration) {
          // we set this flag to ensure that if the transition is paused then, when resumed,
          // the animation will automatically close itself since transitions cannot be paused.
          animationCompleted = true;
          close();
        }
      }

      function start() {
        if (animationClosed) return;
        if (!node.parentNode) {
          close();
          return;
        }

        // even though we only pause keyframe animations here the pause flag
        // will still happen when transitions are used. Only the transition will
        // not be paused since that is not possible. If the animation ends when
        // paused then it will not complete until unpaused or cancelled.
        var playPause = function(playAnimation) {
          if (!animationCompleted) {
            animationPaused = !playAnimation;
            if (timings.animationDuration) {
              var value = blockKeyframeAnimations(node, animationPaused);
              if (animationPaused) {
                temporaryStyles.push(value);
              } else {
                removeFromArray(temporaryStyles, value);
              }
            }
          } else if (animationPaused && playAnimation) {
            animationPaused = false;
            close();
          }
        };

        // checking the stagger duration prevents an accidentally cascade of the CSS delay style
        // being inherited from the parent. If the transition duration is zero then we can safely
        // rely that the delay value is an intentional stagger delay style.
        var maxStagger = itemIndex > 0
                         && ((timings.transitionDuration && stagger.transitionDuration === 0) ||
                            (timings.animationDuration && stagger.animationDuration === 0))
                         && Math.max(stagger.animationDelay, stagger.transitionDelay);
        if (maxStagger) {
          $timeout(triggerAnimationStart,
                   Math.floor(maxStagger * itemIndex * ONE_SECOND),
                   false);
        } else {
          triggerAnimationStart();
        }

        // this will decorate the existing promise runner with pause/resume methods
        runnerHost.resume = function() {
          playPause(true);
        };

        runnerHost.pause = function() {
          playPause(false);
        };

        function triggerAnimationStart() {
          // just incase a stagger animation kicks in when the animation
          // itself was cancelled entirely
          if (animationClosed) return;

          applyBlocking(false);

          forEach(temporaryStyles, function(entry) {
            var key = entry[0];
            var value = entry[1];
            node.style[key] = value;
          });

          applyAnimationClasses(element, options);
          $$jqLite.addClass(element, activeClasses);

          if (flags.recalculateTimingStyles) {
            fullClassName = node.getAttribute('class') + ' ' + preparationClasses;
            cacheKey = gcsHashFn(node, fullClassName);

            timings = computeTimings(node, fullClassName, cacheKey);
            relativeDelay = timings.maxDelay;
            maxDelay = Math.max(relativeDelay, 0);
            maxDuration = timings.maxDuration;

            if (maxDuration === 0) {
              close();
              return;
            }

            flags.hasTransitions = timings.transitionDuration > 0;
            flags.hasAnimations = timings.animationDuration > 0;
          }

          if (flags.applyAnimationDelay) {
            relativeDelay = typeof options.delay !== 'boolean' && truthyTimingValue(options.delay)
                  ? parseFloat(options.delay)
                  : relativeDelay;

            maxDelay = Math.max(relativeDelay, 0);
            timings.animationDelay = relativeDelay;
            delayStyle = getCssDelayStyle(relativeDelay, true);
            temporaryStyles.push(delayStyle);
            node.style[delayStyle[0]] = delayStyle[1];
          }

          maxDelayTime = maxDelay * ONE_SECOND;
          maxDurationTime = maxDuration * ONE_SECOND;

          if (options.easing) {
            var easeProp, easeVal = options.easing;
            if (flags.hasTransitions) {
              easeProp = TRANSITION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
            if (flags.hasAnimations) {
              easeProp = ANIMATION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
          }

          if (timings.transitionDuration) {
            events.push(TRANSITIONEND_EVENT);
          }

          if (timings.animationDuration) {
            events.push(ANIMATIONEND_EVENT);
          }

          startTime = Date.now();
          var timerTime = maxDelayTime + CLOSING_TIME_BUFFER * maxDurationTime;
          var endTime = startTime + timerTime;

          var animationsData = element.data(ANIMATE_TIMER_KEY) || [];
          var setupFallbackTimer = true;
          if (animationsData.length) {
            var currentTimerData = animationsData[0];
            setupFallbackTimer = endTime > currentTimerData.expectedEndTime;
            if (setupFallbackTimer) {
              $timeout.cancel(currentTimerData.timer);
            } else {
              animationsData.push(close);
            }
          }

          if (setupFallbackTimer) {
            var timer = $timeout(onAnimationExpired, timerTime, false);
            animationsData[0] = {
              timer: timer,
              expectedEndTime: endTime
            };
            animationsData.push(close);
            element.data(ANIMATE_TIMER_KEY, animationsData);
          }

          if (events.length) {
            element.on(events.join(' '), onAnimationProgress);
          }

          if (options.to) {
            if (options.cleanupStyles) {
              registerRestorableStyles(restoreStyles, node, Object.keys(options.to));
            }
            applyAnimationToStyles(element, options);
          }
        }

        function onAnimationExpired() {
          var animationsData = element.data(ANIMATE_TIMER_KEY);

          // this will be false in the event that the element was
          // removed from the DOM (via a leave animation or something
          // similar)
          if (animationsData) {
            for (var i = 1; i < animationsData.length; i++) {
              animationsData[i]();
            }
            element.removeData(ANIMATE_TIMER_KEY);
          }
        }
      }
    };
  }];
}];

var $$AnimateCssDriverProvider = ['$$animationProvider', /** @this */ function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateCssDriver');

  var NG_ANIMATE_SHIM_CLASS_NAME = 'ng-animate-shim';
  var NG_ANIMATE_ANCHOR_CLASS_NAME = 'ng-anchor';

  var NG_OUT_ANCHOR_CLASS_NAME = 'ng-anchor-out';
  var NG_IN_ANCHOR_CLASS_NAME = 'ng-anchor-in';

  function isDocumentFragment(node) {
    return node.parentNode && node.parentNode.nodeType === 11;
  }

  this.$get = ['$animateCss', '$rootScope', '$$AnimateRunner', '$rootElement', '$sniffer', '$$jqLite', '$document',
       function($animateCss,   $rootScope,   $$AnimateRunner,   $rootElement,   $sniffer,   $$jqLite,   $document) {

    // only browsers that support these properties can render animations
    if (!$sniffer.animations && !$sniffer.transitions) return noop;

    var bodyNode = $document[0].body;
    var rootNode = getDomNode($rootElement);

    var rootBodyElement = jqLite(
      // this is to avoid using something that exists outside of the body
      // we also special case the doc fragment case because our unit test code
      // appends the $rootElement to the body after the app has been bootstrapped
      isDocumentFragment(rootNode) || bodyNode.contains(rootNode) ? rootNode : bodyNode
    );

    return function initDriverFn(animationDetails) {
      return animationDetails.from && animationDetails.to
          ? prepareFromToAnchorAnimation(animationDetails.from,
                                         animationDetails.to,
                                         animationDetails.classes,
                                         animationDetails.anchors)
          : prepareRegularAnimation(animationDetails);
    };

    function filterCssClasses(classes) {
      //remove all the `ng-` stuff
      return classes.replace(/\bng-\S+\b/g, '');
    }

    function getUniqueValues(a, b) {
      if (isString(a)) a = a.split(' ');
      if (isString(b)) b = b.split(' ');
      return a.filter(function(val) {
        return b.indexOf(val) === -1;
      }).join(' ');
    }

    function prepareAnchoredAnimation(classes, outAnchor, inAnchor) {
      var clone = jqLite(getDomNode(outAnchor).cloneNode(true));
      var startingClasses = filterCssClasses(getClassVal(clone));

      outAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);
      inAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);

      clone.addClass(NG_ANIMATE_ANCHOR_CLASS_NAME);

      rootBodyElement.append(clone);

      var animatorIn, animatorOut = prepareOutAnimation();

      // the user may not end up using the `out` animation and
      // only making use of the `in` animation or vice-versa.
      // In either case we should allow this and not assume the
      // animation is over unless both animations are not used.
      if (!animatorOut) {
        animatorIn = prepareInAnimation();
        if (!animatorIn) {
          return end();
        }
      }

      var startingAnimator = animatorOut || animatorIn;

      return {
        start: function() {
          var runner;

          var currentAnimation = startingAnimator.start();
          currentAnimation.done(function() {
            currentAnimation = null;
            if (!animatorIn) {
              animatorIn = prepareInAnimation();
              if (animatorIn) {
                currentAnimation = animatorIn.start();
                currentAnimation.done(function() {
                  currentAnimation = null;
                  end();
                  runner.complete();
                });
                return currentAnimation;
              }
            }
            // in the event that there is no `in` animation
            end();
            runner.complete();
          });

          runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn
          });

          return runner;

          function endFn() {
            if (currentAnimation) {
              currentAnimation.end();
            }
          }
        }
      };

      function calculateAnchorStyles(anchor) {
        var styles = {};

        var coords = getDomNode(anchor).getBoundingClientRect();

        // we iterate directly since safari messes up and doesn't return
        // all the keys for the coords object when iterated
        forEach(['width','height','top','left'], function(key) {
          var value = coords[key];
          switch (key) {
            case 'top':
              value += bodyNode.scrollTop;
              break;
            case 'left':
              value += bodyNode.scrollLeft;
              break;
          }
          styles[key] = Math.floor(value) + 'px';
        });
        return styles;
      }

      function prepareOutAnimation() {
        var animator = $animateCss(clone, {
          addClass: NG_OUT_ANCHOR_CLASS_NAME,
          delay: true,
          from: calculateAnchorStyles(outAnchor)
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function getClassVal(element) {
        return element.attr('class') || '';
      }

      function prepareInAnimation() {
        var endingClasses = filterCssClasses(getClassVal(inAnchor));
        var toAdd = getUniqueValues(endingClasses, startingClasses);
        var toRemove = getUniqueValues(startingClasses, endingClasses);

        var animator = $animateCss(clone, {
          to: calculateAnchorStyles(inAnchor),
          addClass: NG_IN_ANCHOR_CLASS_NAME + ' ' + toAdd,
          removeClass: NG_OUT_ANCHOR_CLASS_NAME + ' ' + toRemove,
          delay: true
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function end() {
        clone.remove();
        outAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
        inAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
      }
    }

    function prepareFromToAnchorAnimation(from, to, classes, anchors) {
      var fromAnimation = prepareRegularAnimation(from, noop);
      var toAnimation = prepareRegularAnimation(to, noop);

      var anchorAnimations = [];
      forEach(anchors, function(anchor) {
        var outElement = anchor['out'];
        var inElement = anchor['in'];
        var animator = prepareAnchoredAnimation(classes, outElement, inElement);
        if (animator) {
          anchorAnimations.push(animator);
        }
      });

      // no point in doing anything when there are no elements to animate
      if (!fromAnimation && !toAnimation && anchorAnimations.length === 0) return;

      return {
        start: function() {
          var animationRunners = [];

          if (fromAnimation) {
            animationRunners.push(fromAnimation.start());
          }

          if (toAnimation) {
            animationRunners.push(toAnimation.start());
          }

          forEach(anchorAnimations, function(animation) {
            animationRunners.push(animation.start());
          });

          var runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn // CSS-driven animations cannot be cancelled, only ended
          });

          $$AnimateRunner.all(animationRunners, function(status) {
            runner.complete(status);
          });

          return runner;

          function endFn() {
            forEach(animationRunners, function(runner) {
              runner.end();
            });
          }
        }
      };
    }

    function prepareRegularAnimation(animationDetails) {
      var element = animationDetails.element;
      var options = animationDetails.options || {};

      if (animationDetails.structural) {
        options.event = animationDetails.event;
        options.structural = true;
        options.applyClassesEarly = true;

        // we special case the leave animation since we want to ensure that
        // the element is removed as soon as the animation is over. Otherwise
        // a flicker might appear or the element may not be removed at all
        if (animationDetails.event === 'leave') {
          options.onDone = options.domOperation;
        }
      }

      // We assign the preparationClasses as the actual animation event since
      // the internals of $animateCss will just suffix the event token values
      // with `-active` to trigger the animation.
      if (options.preparationClasses) {
        options.event = concatWithSpace(options.event, options.preparationClasses);
      }

      var animator = $animateCss(element, options);

      // the driver lookup code inside of $$animation attempts to spawn a
      // driver one by one until a driver returns a.$$willAnimate animator object.
      // $animateCss will always return an object, however, it will pass in
      // a flag as a hint as to whether an animation was detected or not
      return animator.$$willAnimate ? animator : null;
    }
  }];
}];

// TODO(matsko): use caching here to speed things up for detection
// TODO(matsko): add documentation
//  by the time...

var $$AnimateJsProvider = ['$animateProvider', /** @this */ function($animateProvider) {
  this.$get = ['$injector', '$$AnimateRunner', '$$jqLite',
       function($injector,   $$AnimateRunner,   $$jqLite) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
         // $animateJs(element, 'enter');
    return function(element, event, classes, options) {
      var animationClosed = false;

      // the `classes` argument is optional and if it is not used
      // then the classes will be resolved from the element's className
      // property as well as options.addClass/options.removeClass.
      if (arguments.length === 3 && isObject(classes)) {
        options = classes;
        classes = null;
      }

      options = prepareAnimationOptions(options);
      if (!classes) {
        classes = element.attr('class') || '';
        if (options.addClass) {
          classes += ' ' + options.addClass;
        }
        if (options.removeClass) {
          classes += ' ' + options.removeClass;
        }
      }

      var classesToAdd = options.addClass;
      var classesToRemove = options.removeClass;

      // the lookupAnimations function returns a series of animation objects that are
      // matched up with one or more of the CSS classes. These animation objects are
      // defined via the module.animation factory function. If nothing is detected then
      // we don't return anything which then makes $animation query the next driver.
      var animations = lookupAnimations(classes);
      var before, after;
      if (animations.length) {
        var afterFn, beforeFn;
        if (event === 'leave') {
          beforeFn = 'leave';
          afterFn = 'afterLeave'; // TODO(matsko): get rid of this
        } else {
          beforeFn = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
          afterFn = event;
        }

        if (event !== 'enter' && event !== 'move') {
          before = packageAnimations(element, event, options, animations, beforeFn);
        }
        after  = packageAnimations(element, event, options, animations, afterFn);
      }

      // no matching animations
      if (!before && !after) return;

      function applyOptions() {
        options.domOperation();
        applyAnimationClasses(element, options);
      }

      function close() {
        animationClosed = true;
        applyOptions();
        applyAnimationStyles(element, options);
      }

      var runner;

      return {
        $$willAnimate: true,
        end: function() {
          if (runner) {
            runner.end();
          } else {
            close();
            runner = new $$AnimateRunner();
            runner.complete(true);
          }
          return runner;
        },
        start: function() {
          if (runner) {
            return runner;
          }

          runner = new $$AnimateRunner();
          var closeActiveAnimations;
          var chain = [];

          if (before) {
            chain.push(function(fn) {
              closeActiveAnimations = before(fn);
            });
          }

          if (chain.length) {
            chain.push(function(fn) {
              applyOptions();
              fn(true);
            });
          } else {
            applyOptions();
          }

          if (after) {
            chain.push(function(fn) {
              closeActiveAnimations = after(fn);
            });
          }

          runner.setHost({
            end: function() {
              endAnimations();
            },
            cancel: function() {
              endAnimations(true);
            }
          });

          $$AnimateRunner.chain(chain, onComplete);
          return runner;

          function onComplete(success) {
            close(success);
            runner.complete(success);
          }

          function endAnimations(cancelled) {
            if (!animationClosed) {
              (closeActiveAnimations || noop)(cancelled);
              onComplete(cancelled);
            }
          }
        }
      };

      function executeAnimationFn(fn, element, event, options, onDone) {
        var args;
        switch (event) {
          case 'animate':
            args = [element, options.from, options.to, onDone];
            break;

          case 'setClass':
            args = [element, classesToAdd, classesToRemove, onDone];
            break;

          case 'addClass':
            args = [element, classesToAdd, onDone];
            break;

          case 'removeClass':
            args = [element, classesToRemove, onDone];
            break;

          default:
            args = [element, onDone];
            break;
        }

        args.push(options);

        var value = fn.apply(fn, args);
        if (value) {
          if (isFunction(value.start)) {
            value = value.start();
          }

          if (value instanceof $$AnimateRunner) {
            value.done(onDone);
          } else if (isFunction(value)) {
            // optional onEnd / onCancel callback
            return value;
          }
        }

        return noop;
      }

      function groupEventedAnimations(element, event, options, animations, fnName) {
        var operations = [];
        forEach(animations, function(ani) {
          var animation = ani[fnName];
          if (!animation) return;

          // note that all of these animations will run in parallel
          operations.push(function() {
            var runner;
            var endProgressCb;

            var resolved = false;
            var onAnimationComplete = function(rejected) {
              if (!resolved) {
                resolved = true;
                (endProgressCb || noop)(rejected);
                runner.complete(!rejected);
              }
            };

            runner = new $$AnimateRunner({
              end: function() {
                onAnimationComplete();
              },
              cancel: function() {
                onAnimationComplete(true);
              }
            });

            endProgressCb = executeAnimationFn(animation, element, event, options, function(result) {
              var cancelled = result === false;
              onAnimationComplete(cancelled);
            });

            return runner;
          });
        });

        return operations;
      }

      function packageAnimations(element, event, options, animations, fnName) {
        var operations = groupEventedAnimations(element, event, options, animations, fnName);
        if (operations.length === 0) {
          var a, b;
          if (fnName === 'beforeSetClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'beforeRemoveClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'beforeAddClass');
          } else if (fnName === 'setClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'removeClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'addClass');
          }

          if (a) {
            operations = operations.concat(a);
          }
          if (b) {
            operations = operations.concat(b);
          }
        }

        if (operations.length === 0) return;

        // TODO(matsko): add documentation
        return function startAnimation(callback) {
          var runners = [];
          if (operations.length) {
            forEach(operations, function(animateFn) {
              runners.push(animateFn());
            });
          }

          if (runners.length) {
            $$AnimateRunner.all(runners, callback);
          }  else {
            callback();
          }

          return function endFn(reject) {
            forEach(runners, function(runner) {
              if (reject) {
                runner.cancel();
              } else {
                runner.end();
              }
            });
          };
        };
      }
    };

    function lookupAnimations(classes) {
      classes = isArray(classes) ? classes : classes.split(' ');
      var matches = [], flagMap = {};
      for (var i = 0; i < classes.length; i++) {
        var klass = classes[i],
            animationFactory = $animateProvider.$$registeredAnimations[klass];
        if (animationFactory && !flagMap[klass]) {
          matches.push($injector.get(animationFactory));
          flagMap[klass] = true;
        }
      }
      return matches;
    }
  }];
}];

var $$AnimateJsDriverProvider = ['$$animationProvider', /** @this */ function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateJsDriver');
  this.$get = ['$$animateJs', '$$AnimateRunner', function($$animateJs, $$AnimateRunner) {
    return function initDriverFn(animationDetails) {
      if (animationDetails.from && animationDetails.to) {
        var fromAnimation = prepareAnimation(animationDetails.from);
        var toAnimation = prepareAnimation(animationDetails.to);
        if (!fromAnimation && !toAnimation) return;

        return {
          start: function() {
            var animationRunners = [];

            if (fromAnimation) {
              animationRunners.push(fromAnimation.start());
            }

            if (toAnimation) {
              animationRunners.push(toAnimation.start());
            }

            $$AnimateRunner.all(animationRunners, done);

            var runner = new $$AnimateRunner({
              end: endFnFactory(),
              cancel: endFnFactory()
            });

            return runner;

            function endFnFactory() {
              return function() {
                forEach(animationRunners, function(runner) {
                  // at this point we cannot cancel animations for groups just yet. 1.5+
                  runner.end();
                });
              };
            }

            function done(status) {
              runner.complete(status);
            }
          }
        };
      } else {
        return prepareAnimation(animationDetails);
      }
    };

    function prepareAnimation(animationDetails) {
      // TODO(matsko): make sure to check for grouped animations and delegate down to normal animations
      var element = animationDetails.element;
      var event = animationDetails.event;
      var options = animationDetails.options;
      var classes = animationDetails.classes;
      return $$animateJs(element, event, classes, options);
    }
  }];
}];

var NG_ANIMATE_ATTR_NAME = 'data-ng-animate';
var NG_ANIMATE_PIN_DATA = '$ngAnimatePin';
var $$AnimateQueueProvider = ['$animateProvider', /** @this */ function($animateProvider) {
  var PRE_DIGEST_STATE = 1;
  var RUNNING_STATE = 2;
  var ONE_SPACE = ' ';

  var rules = this.rules = {
    skip: [],
    cancel: [],
    join: []
  };

  function makeTruthyCssClassMap(classString) {
    if (!classString) {
      return null;
    }

    var keys = classString.split(ONE_SPACE);
    var map = Object.create(null);

    forEach(keys, function(key) {
      map[key] = true;
    });
    return map;
  }

  function hasMatchingClasses(newClassString, currentClassString) {
    if (newClassString && currentClassString) {
      var currentClassMap = makeTruthyCssClassMap(currentClassString);
      return newClassString.split(ONE_SPACE).some(function(className) {
        return currentClassMap[className];
      });
    }
  }

  function isAllowed(ruleType, currentAnimation, previousAnimation) {
    return rules[ruleType].some(function(fn) {
      return fn(currentAnimation, previousAnimation);
    });
  }

  function hasAnimationClasses(animation, and) {
    var a = (animation.addClass || '').length > 0;
    var b = (animation.removeClass || '').length > 0;
    return and ? a && b : a || b;
  }

  rules.join.push(function(newAnimation, currentAnimation) {
    // if the new animation is class-based then we can just tack that on
    return !newAnimation.structural && hasAnimationClasses(newAnimation);
  });

  rules.skip.push(function(newAnimation, currentAnimation) {
    // there is no need to animate anything if no classes are being added and
    // there is no structural animation that will be triggered
    return !newAnimation.structural && !hasAnimationClasses(newAnimation);
  });

  rules.skip.push(function(newAnimation, currentAnimation) {
    // why should we trigger a new structural animation if the element will
    // be removed from the DOM anyway?
    return currentAnimation.event === 'leave' && newAnimation.structural;
  });

  rules.skip.push(function(newAnimation, currentAnimation) {
    // if there is an ongoing current animation then don't even bother running the class-based animation
    return currentAnimation.structural && currentAnimation.state === RUNNING_STATE && !newAnimation.structural;
  });

  rules.cancel.push(function(newAnimation, currentAnimation) {
    // there can never be two structural animations running at the same time
    return currentAnimation.structural && newAnimation.structural;
  });

  rules.cancel.push(function(newAnimation, currentAnimation) {
    // if the previous animation is already running, but the new animation will
    // be triggered, but the new animation is structural
    return currentAnimation.state === RUNNING_STATE && newAnimation.structural;
  });

  rules.cancel.push(function(newAnimation, currentAnimation) {
    // cancel the animation if classes added / removed in both animation cancel each other out,
    // but only if the current animation isn't structural

    if (currentAnimation.structural) return false;

    var nA = newAnimation.addClass;
    var nR = newAnimation.removeClass;
    var cA = currentAnimation.addClass;
    var cR = currentAnimation.removeClass;

    // early detection to save the global CPU shortage :)
    if ((isUndefined(nA) && isUndefined(nR)) || (isUndefined(cA) && isUndefined(cR))) {
      return false;
    }

    return hasMatchingClasses(nA, cR) || hasMatchingClasses(nR, cA);
  });

  this.$get = ['$$rAF', '$rootScope', '$rootElement', '$document', '$$Map',
               '$$animation', '$$AnimateRunner', '$templateRequest', '$$jqLite', '$$forceReflow',
               '$$isDocumentHidden',
       function($$rAF,   $rootScope,   $rootElement,   $document,   $$Map,
                $$animation,   $$AnimateRunner,   $templateRequest,   $$jqLite,   $$forceReflow,
                $$isDocumentHidden) {

    var activeAnimationsLookup = new $$Map();
    var disabledElementsLookup = new $$Map();
    var animationsEnabled = null;

    function postDigestTaskFactory() {
      var postDigestCalled = false;
      return function(fn) {
        // we only issue a call to postDigest before
        // it has first passed. This prevents any callbacks
        // from not firing once the animation has completed
        // since it will be out of the digest cycle.
        if (postDigestCalled) {
          fn();
        } else {
          $rootScope.$$postDigest(function() {
            postDigestCalled = true;
            fn();
          });
        }
      };
    }

    // Wait until all directive and route-related templates are downloaded and
    // compiled. The $templateRequest.totalPendingRequests variable keeps track of
    // all of the remote templates being currently downloaded. If there are no
    // templates currently downloading then the watcher will still fire anyway.
    var deregisterWatch = $rootScope.$watch(
      function() { return $templateRequest.totalPendingRequests === 0; },
      function(isEmpty) {
        if (!isEmpty) return;
        deregisterWatch();

        // Now that all templates have been downloaded, $animate will wait until
        // the post digest queue is empty before enabling animations. By having two
        // calls to $postDigest calls we can ensure that the flag is enabled at the
        // very end of the post digest queue. Since all of the animations in $animate
        // use $postDigest, it's important that the code below executes at the end.
        // This basically means that the page is fully downloaded and compiled before
        // any animations are triggered.
        $rootScope.$$postDigest(function() {
          $rootScope.$$postDigest(function() {
            // we check for null directly in the event that the application already called
            // .enabled() with whatever arguments that it provided it with
            if (animationsEnabled === null) {
              animationsEnabled = true;
            }
          });
        });
      }
    );

    var callbackRegistry = Object.create(null);

    // remember that the classNameFilter is set during the provider/config
    // stage therefore we can optimize here and setup a helper function
    var classNameFilter = $animateProvider.classNameFilter();
    var isAnimatableClassName = !classNameFilter
              ? function() { return true; }
              : function(className) {
                return classNameFilter.test(className);
              };

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function normalizeAnimationDetails(element, animation) {
      return mergeAnimationDetails(element, animation, {});
    }

    // IE9-11 has no method "contains" in SVG element and in Node.prototype. Bug #10259.
    var contains = window.Node.prototype.contains || /** @this */ function(arg) {
      // eslint-disable-next-line no-bitwise
      return this === arg || !!(this.compareDocumentPosition(arg) & 16);
    };

    function findCallbacks(targetParentNode, targetNode, event) {
      var matches = [];
      var entries = callbackRegistry[event];
      if (entries) {
        forEach(entries, function(entry) {
          if (contains.call(entry.node, targetNode)) {
            matches.push(entry.callback);
          } else if (event === 'leave' && contains.call(entry.node, targetParentNode)) {
            matches.push(entry.callback);
          }
        });
      }

      return matches;
    }

    function filterFromRegistry(list, matchContainer, matchCallback) {
      var containerNode = extractElementNode(matchContainer);
      return list.filter(function(entry) {
        var isMatch = entry.node === containerNode &&
                        (!matchCallback || entry.callback === matchCallback);
        return !isMatch;
      });
    }

    function cleanupEventListeners(phase, node) {
      if (phase === 'close' && !node.parentNode) {
        // If the element is not attached to a parentNode, it has been removed by
        // the domOperation, and we can safely remove the event callbacks
        $animate.off(node);
      }
    }

    var $animate = {
      on: function(event, container, callback) {
        var node = extractElementNode(container);
        callbackRegistry[event] = callbackRegistry[event] || [];
        callbackRegistry[event].push({
          node: node,
          callback: callback
        });

        // Remove the callback when the element is removed from the DOM
        jqLite(container).on('$destroy', function() {
          var animationDetails = activeAnimationsLookup.get(node);

          if (!animationDetails) {
            // If there's an animation ongoing, the callback calling code will remove
            // the event listeners. If we'd remove here, the callbacks would be removed
            // before the animation ends
            $animate.off(event, container, callback);
          }
        });
      },

      off: function(event, container, callback) {
        if (arguments.length === 1 && !isString(arguments[0])) {
          container = arguments[0];
          for (var eventType in callbackRegistry) {
            callbackRegistry[eventType] = filterFromRegistry(callbackRegistry[eventType], container);
          }

          return;
        }

        var entries = callbackRegistry[event];
        if (!entries) return;

        callbackRegistry[event] = arguments.length === 1
            ? null
            : filterFromRegistry(entries, container, callback);
      },

      pin: function(element, parentElement) {
        assertArg(isElement(element), 'element', 'not an element');
        assertArg(isElement(parentElement), 'parentElement', 'not an element');
        element.data(NG_ANIMATE_PIN_DATA, parentElement);
      },

      push: function(element, event, options, domOperation) {
        options = options || {};
        options.domOperation = domOperation;
        return queueAnimation(element, event, options);
      },

      // this method has four signatures:
      //  () - global getter
      //  (bool) - global setter
      //  (element) - element getter
      //  (element, bool) - element setter<F37>
      enabled: function(element, bool) {
        var argCount = arguments.length;

        if (argCount === 0) {
          // () - Global getter
          bool = !!animationsEnabled;
        } else {
          var hasElement = isElement(element);

          if (!hasElement) {
            // (bool) - Global setter
            bool = animationsEnabled = !!element;
          } else {
            var node = getDomNode(element);

            if (argCount === 1) {
              // (element) - Element getter
              bool = !disabledElementsLookup.get(node);
            } else {
              // (element, bool) - Element setter
              disabledElementsLookup.set(node, !bool);
            }
          }
        }

        return bool;
      }
    };

    return $animate;

    function queueAnimation(originalElement, event, initialOptions) {
      // we always make a copy of the options since
      // there should never be any side effects on
      // the input data when running `$animateCss`.
      var options = copy(initialOptions);

      var element = stripCommentsFromElement(originalElement);
      var node = getDomNode(element);
      var parentNode = node && node.parentNode;

      options = prepareAnimationOptions(options);

      // we create a fake runner with a working promise.
      // These methods will become available after the digest has passed
      var runner = new $$AnimateRunner();

      // this is used to trigger callbacks in postDigest mode
      var runInNextPostDigestOrNow = postDigestTaskFactory();

      if (isArray(options.addClass)) {
        options.addClass = options.addClass.join(' ');
      }

      if (options.addClass && !isString(options.addClass)) {
        options.addClass = null;
      }

      if (isArray(options.removeClass)) {
        options.removeClass = options.removeClass.join(' ');
      }

      if (options.removeClass && !isString(options.removeClass)) {
        options.removeClass = null;
      }

      if (options.from && !isObject(options.from)) {
        options.from = null;
      }

      if (options.to && !isObject(options.to)) {
        options.to = null;
      }

      // there are situations where a directive issues an animation for
      // a jqLite wrapper that contains only comment nodes... If this
      // happens then there is no way we can perform an animation
      if (!node) {
        close();
        return runner;
      }

      var className = [node.getAttribute('class'), options.addClass, options.removeClass].join(' ');
      if (!isAnimatableClassName(className)) {
        close();
        return runner;
      }

      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      var documentHidden = $$isDocumentHidden();

      // this is a hard disable of all animations for the application or on
      // the element itself, therefore  there is no need to continue further
      // past this point if not enabled
      // Animations are also disabled if the document is currently hidden (page is not visible
      // to the user), because browsers slow down or do not flush calls to requestAnimationFrame
      var skipAnimations = !animationsEnabled || documentHidden || disabledElementsLookup.get(node);
      var existingAnimation = (!skipAnimations && activeAnimationsLookup.get(node)) || {};
      var hasExistingAnimation = !!existingAnimation.state;

      // there is no point in traversing the same collection of parent ancestors if a followup
      // animation will be run on the same element that already did all that checking work
      if (!skipAnimations && (!hasExistingAnimation || existingAnimation.state !== PRE_DIGEST_STATE)) {
        skipAnimations = !areAnimationsAllowed(node, parentNode, event);
      }

      if (skipAnimations) {
        // Callbacks should fire even if the document is hidden (regression fix for issue #14120)
        if (documentHidden) notifyProgress(runner, event, 'start');
        close();
        if (documentHidden) notifyProgress(runner, event, 'close');
        return runner;
      }

      if (isStructural) {
        closeChildAnimations(node);
      }

      var newAnimation = {
        structural: isStructural,
        element: element,
        event: event,
        addClass: options.addClass,
        removeClass: options.removeClass,
        close: close,
        options: options,
        runner: runner
      };

      if (hasExistingAnimation) {
        var skipAnimationFlag = isAllowed('skip', newAnimation, existingAnimation);
        if (skipAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            close();
            return runner;
          } else {
            mergeAnimationDetails(element, existingAnimation, newAnimation);
            return existingAnimation.runner;
          }
        }
        var cancelAnimationFlag = isAllowed('cancel', newAnimation, existingAnimation);
        if (cancelAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            // this will end the animation right away and it is safe
            // to do so since the animation is already running and the
            // runner callback code will run in async
            existingAnimation.runner.end();
          } else if (existingAnimation.structural) {
            // this means that the animation is queued into a digest, but
            // hasn't started yet. Therefore it is safe to run the close
            // method which will call the runner methods in async.
            existingAnimation.close();
          } else {
            // this will merge the new animation options into existing animation options
            mergeAnimationDetails(element, existingAnimation, newAnimation);

            return existingAnimation.runner;
          }
        } else {
          // a joined animation means that this animation will take over the existing one
          // so an example would involve a leave animation taking over an enter. Then when
          // the postDigest kicks in the enter will be ignored.
          var joinAnimationFlag = isAllowed('join', newAnimation, existingAnimation);
          if (joinAnimationFlag) {
            if (existingAnimation.state === RUNNING_STATE) {
              normalizeAnimationDetails(element, newAnimation);
            } else {
              applyGeneratedPreparationClasses(element, isStructural ? event : null, options);

              event = newAnimation.event = existingAnimation.event;
              options = mergeAnimationDetails(element, existingAnimation, newAnimation);

              //we return the same runner since only the option values of this animation will
              //be fed into the `existingAnimation`.
              return existingAnimation.runner;
            }
          }
        }
      } else {
        // normalization in this case means that it removes redundant CSS classes that
        // already exist (addClass) or do not exist (removeClass) on the element
        normalizeAnimationDetails(element, newAnimation);
      }

      // when the options are merged and cleaned up we may end up not having to do
      // an animation at all, therefore we should check this before issuing a post
      // digest callback. Structural animations will always run no matter what.
      var isValidAnimation = newAnimation.structural;
      if (!isValidAnimation) {
        // animate (from/to) can be quickly checked first, otherwise we check if any classes are present
        isValidAnimation = (newAnimation.event === 'animate' && Object.keys(newAnimation.options.to || {}).length > 0)
                            || hasAnimationClasses(newAnimation);
      }

      if (!isValidAnimation) {
        close();
        clearElementAnimationState(node);
        return runner;
      }

      // the counter keeps track of cancelled animations
      var counter = (existingAnimation.counter || 0) + 1;
      newAnimation.counter = counter;

      markElementAnimationState(node, PRE_DIGEST_STATE, newAnimation);

      $rootScope.$$postDigest(function() {
        // It is possible that the DOM nodes inside `originalElement` have been replaced. This can
        // happen if the animated element is a transcluded clone and also has a `templateUrl`
        // directive on it. Therefore, we must recreate `element` in order to interact with the
        // actual DOM nodes.
        // Note: We still need to use the old `node` for certain things, such as looking up in
        //       HashMaps where it was used as the key.

        element = stripCommentsFromElement(originalElement);

        var animationDetails = activeAnimationsLookup.get(node);
        var animationCancelled = !animationDetails;
        animationDetails = animationDetails || {};

        // if addClass/removeClass is called before something like enter then the
        // registered parent element may not be present. The code below will ensure
        // that a final value for parent element is obtained
        var parentElement = element.parent() || [];

        // animate/structural/class-based animations all have requirements. Otherwise there
        // is no point in performing an animation. The parent node must also be set.
        var isValidAnimation = parentElement.length > 0
                                && (animationDetails.event === 'animate'
                                    || animationDetails.structural
                                    || hasAnimationClasses(animationDetails));

        // this means that the previous animation was cancelled
        // even if the follow-up animation is the same event
        if (animationCancelled || animationDetails.counter !== counter || !isValidAnimation) {
          // if another animation did not take over then we need
          // to make sure that the domOperation and options are
          // handled accordingly
          if (animationCancelled) {
            applyAnimationClasses(element, options);
            applyAnimationStyles(element, options);
          }

          // if the event changed from something like enter to leave then we do
          // it, otherwise if it's the same then the end result will be the same too
          if (animationCancelled || (isStructural && animationDetails.event !== event)) {
            options.domOperation();
            runner.end();
          }

          // in the event that the element animation was not cancelled or a follow-up animation
          // isn't allowed to animate from here then we need to clear the state of the element
          // so that any future animations won't read the expired animation data.
          if (!isValidAnimation) {
            clearElementAnimationState(node);
          }

          return;
        }

        // this combined multiple class to addClass / removeClass into a setClass event
        // so long as a structural event did not take over the animation
        event = !animationDetails.structural && hasAnimationClasses(animationDetails, true)
            ? 'setClass'
            : animationDetails.event;

        markElementAnimationState(node, RUNNING_STATE);
        var realRunner = $$animation(element, event, animationDetails.options);

        // this will update the runner's flow-control events based on
        // the `realRunner` object.
        runner.setHost(realRunner);
        notifyProgress(runner, event, 'start', {});

        realRunner.done(function(status) {
          close(!status);
          var animationDetails = activeAnimationsLookup.get(node);
          if (animationDetails && animationDetails.counter === counter) {
            clearElementAnimationState(node);
          }
          notifyProgress(runner, event, 'close', {});
        });
      });

      return runner;

      function notifyProgress(runner, event, phase, data) {
        runInNextPostDigestOrNow(function() {
          var callbacks = findCallbacks(parentNode, node, event);
          if (callbacks.length) {
            // do not optimize this call here to RAF because
            // we don't know how heavy the callback code here will
            // be and if this code is buffered then this can
            // lead to a performance regression.
            $$rAF(function() {
              forEach(callbacks, function(callback) {
                callback(element, phase, data);
              });
              cleanupEventListeners(phase, node);
            });
          } else {
            cleanupEventListeners(phase, node);
          }
        });
        runner.progress(event, phase, data);
      }

      function close(reject) {
        clearGeneratedClasses(element, options);
        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();
        runner.complete(!reject);
      }
    }

    function closeChildAnimations(node) {
      var children = node.querySelectorAll('[' + NG_ANIMATE_ATTR_NAME + ']');
      forEach(children, function(child) {
        var state = parseInt(child.getAttribute(NG_ANIMATE_ATTR_NAME), 10);
        var animationDetails = activeAnimationsLookup.get(child);
        if (animationDetails) {
          switch (state) {
            case RUNNING_STATE:
              animationDetails.runner.end();
              /* falls through */
            case PRE_DIGEST_STATE:
              activeAnimationsLookup.delete(child);
              break;
          }
        }
      });
    }

    function clearElementAnimationState(node) {
      node.removeAttribute(NG_ANIMATE_ATTR_NAME);
      activeAnimationsLookup.delete(node);
    }

    /**
     * This fn returns false if any of the following is true:
     * a) animations on any parent element are disabled, and animations on the element aren't explicitly allowed
     * b) a parent element has an ongoing structural animation, and animateChildren is false
     * c) the element is not a child of the body
     * d) the element is not a child of the $rootElement
     */
    function areAnimationsAllowed(node, parentNode, event) {
      var bodyNode = $document[0].body;
      var rootNode = getDomNode($rootElement);

      var bodyNodeDetected = (node === bodyNode) || node.nodeName === 'HTML';
      var rootNodeDetected = (node === rootNode);
      var parentAnimationDetected = false;
      var elementDisabled = disabledElementsLookup.get(node);
      var animateChildren;

      var parentHost = jqLite.data(node, NG_ANIMATE_PIN_DATA);
      if (parentHost) {
        parentNode = getDomNode(parentHost);
      }

      while (parentNode) {
        if (!rootNodeDetected) {
          // angular doesn't want to attempt to animate elements outside of the application
          // therefore we need to ensure that the rootElement is an ancestor of the current element
          rootNodeDetected = (parentNode === rootNode);
        }

        if (parentNode.nodeType !== ELEMENT_NODE) {
          // no point in inspecting the #document element
          break;
        }

        var details = activeAnimationsLookup.get(parentNode) || {};
        // either an enter, leave or move animation will commence
        // therefore we can't allow any animations to take place
        // but if a parent animation is class-based then that's ok
        if (!parentAnimationDetected) {
          var parentNodeDisabled = disabledElementsLookup.get(parentNode);

          if (parentNodeDisabled === true && elementDisabled !== false) {
            // disable animations if the user hasn't explicitly enabled animations on the
            // current element
            elementDisabled = true;
            // element is disabled via parent element, no need to check anything else
            break;
          } else if (parentNodeDisabled === false) {
            elementDisabled = false;
          }
          parentAnimationDetected = details.structural;
        }

        if (isUndefined(animateChildren) || animateChildren === true) {
          var value = jqLite.data(parentNode, NG_ANIMATE_CHILDREN_DATA);
          if (isDefined(value)) {
            animateChildren = value;
          }
        }

        // there is no need to continue traversing at this point
        if (parentAnimationDetected && animateChildren === false) break;

        if (!bodyNodeDetected) {
          // we also need to ensure that the element is or will be a part of the body element
          // otherwise it is pointless to even issue an animation to be rendered
          bodyNodeDetected = (parentNode === bodyNode);
        }

        if (bodyNodeDetected && rootNodeDetected) {
          // If both body and root have been found, any other checks are pointless,
          // as no animation data should live outside the application
          break;
        }

        if (!rootNodeDetected) {
          // If `rootNode` is not detected, check if `parentNode` is pinned to another element
          parentHost = jqLite.data(parentNode, NG_ANIMATE_PIN_DATA);
          if (parentHost) {
            // The pin target element becomes the next parent element
            parentNode = getDomNode(parentHost);
            continue;
          }
        }

        parentNode = parentNode.parentNode;
      }

      var allowAnimation = (!parentAnimationDetected || animateChildren) && elementDisabled !== true;
      return allowAnimation && rootNodeDetected && bodyNodeDetected;
    }

    function markElementAnimationState(node, state, details) {
      details = details || {};
      details.state = state;

      node.setAttribute(NG_ANIMATE_ATTR_NAME, state);

      var oldValue = activeAnimationsLookup.get(node);
      var newValue = oldValue
          ? extend(oldValue, details)
          : details;
      activeAnimationsLookup.set(node, newValue);
    }
  }];
}];

/* exported $$AnimationProvider */

var $$AnimationProvider = ['$animateProvider', /** @this */ function($animateProvider) {
  var NG_ANIMATE_REF_ATTR = 'ng-animate-ref';

  var drivers = this.drivers = [];

  var RUNNER_STORAGE_KEY = '$$animationRunner';

  function setRunner(element, runner) {
    element.data(RUNNER_STORAGE_KEY, runner);
  }

  function removeRunner(element) {
    element.removeData(RUNNER_STORAGE_KEY);
  }

  function getRunner(element) {
    return element.data(RUNNER_STORAGE_KEY);
  }

  this.$get = ['$$jqLite', '$rootScope', '$injector', '$$AnimateRunner', '$$Map', '$$rAFScheduler',
       function($$jqLite,   $rootScope,   $injector,   $$AnimateRunner,   $$Map,   $$rAFScheduler) {

    var animationQueue = [];
    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function sortAnimations(animations) {
      var tree = { children: [] };
      var i, lookup = new $$Map();

      // this is done first beforehand so that the map
      // is filled with a list of the elements that will be animated
      for (i = 0; i < animations.length; i++) {
        var animation = animations[i];
        lookup.set(animation.domNode, animations[i] = {
          domNode: animation.domNode,
          fn: animation.fn,
          children: []
        });
      }

      for (i = 0; i < animations.length; i++) {
        processNode(animations[i]);
      }

      return flatten(tree);

      function processNode(entry) {
        if (entry.processed) return entry;
        entry.processed = true;

        var elementNode = entry.domNode;
        var parentNode = elementNode.parentNode;
        lookup.set(elementNode, entry);

        var parentEntry;
        while (parentNode) {
          parentEntry = lookup.get(parentNode);
          if (parentEntry) {
            if (!parentEntry.processed) {
              parentEntry = processNode(parentEntry);
            }
            break;
          }
          parentNode = parentNode.parentNode;
        }

        (parentEntry || tree).children.push(entry);
        return entry;
      }

      function flatten(tree) {
        var result = [];
        var queue = [];
        var i;

        for (i = 0; i < tree.children.length; i++) {
          queue.push(tree.children[i]);
        }

        var remainingLevelEntries = queue.length;
        var nextLevelEntries = 0;
        var row = [];

        for (i = 0; i < queue.length; i++) {
          var entry = queue[i];
          if (remainingLevelEntries <= 0) {
            remainingLevelEntries = nextLevelEntries;
            nextLevelEntries = 0;
            result.push(row);
            row = [];
          }
          row.push(entry.fn);
          entry.children.forEach(function(childEntry) {
            nextLevelEntries++;
            queue.push(childEntry);
          });
          remainingLevelEntries--;
        }

        if (row.length) {
          result.push(row);
        }

        return result;
      }
    }

    // TODO(matsko): document the signature in a better way
    return function(element, event, options) {
      options = prepareAnimationOptions(options);
      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      // there is no animation at the current moment, however
      // these runner methods will get later updated with the
      // methods leading into the driver's end/cancel methods
      // for now they just stop the animation from starting
      var runner = new $$AnimateRunner({
        end: function() { close(); },
        cancel: function() { close(true); }
      });

      if (!drivers.length) {
        close();
        return runner;
      }

      setRunner(element, runner);

      var classes = mergeClasses(element.attr('class'), mergeClasses(options.addClass, options.removeClass));
      var tempClasses = options.tempClasses;
      if (tempClasses) {
        classes += ' ' + tempClasses;
        options.tempClasses = null;
      }

      var prepareClassName;
      if (isStructural) {
        prepareClassName = 'ng-' + event + PREPARE_CLASS_SUFFIX;
        $$jqLite.addClass(element, prepareClassName);
      }

      animationQueue.push({
        // this data is used by the postDigest code and passed into
        // the driver step function
        element: element,
        classes: classes,
        event: event,
        structural: isStructural,
        options: options,
        beforeStart: beforeStart,
        close: close
      });

      element.on('$destroy', handleDestroyedElement);

      // we only want there to be one function called within the post digest
      // block. This way we can group animations for all the animations that
      // were apart of the same postDigest flush call.
      if (animationQueue.length > 1) return runner;

      $rootScope.$$postDigest(function() {
        var animations = [];
        forEach(animationQueue, function(entry) {
          // the element was destroyed early on which removed the runner
          // form its storage. This means we can't animate this element
          // at all and it already has been closed due to destruction.
          if (getRunner(entry.element)) {
            animations.push(entry);
          } else {
            entry.close();
          }
        });

        // now any future animations will be in another postDigest
        animationQueue.length = 0;

        var groupedAnimations = groupAnimations(animations);
        var toBeSortedAnimations = [];

        forEach(groupedAnimations, function(animationEntry) {
          toBeSortedAnimations.push({
            domNode: getDomNode(animationEntry.from ? animationEntry.from.element : animationEntry.element),
            fn: function triggerAnimationStart() {
              // it's important that we apply the `ng-animate` CSS class and the
              // temporary classes before we do any driver invoking since these
              // CSS classes may be required for proper CSS detection.
              animationEntry.beforeStart();

              var startAnimationFn, closeFn = animationEntry.close;

              // in the event that the element was removed before the digest runs or
              // during the RAF sequencing then we should not trigger the animation.
              var targetElement = animationEntry.anchors
                  ? (animationEntry.from.element || animationEntry.to.element)
                  : animationEntry.element;

              if (getRunner(targetElement)) {
                var operation = invokeFirstDriver(animationEntry);
                if (operation) {
                  startAnimationFn = operation.start;
                }
              }

              if (!startAnimationFn) {
                closeFn();
              } else {
                var animationRunner = startAnimationFn();
                animationRunner.done(function(status) {
                  closeFn(!status);
                });
                updateAnimationRunners(animationEntry, animationRunner);
              }
            }
          });
        });

        // we need to sort each of the animations in order of parent to child
        // relationships. This ensures that the child classes are applied at the
        // right time.
        $$rAFScheduler(sortAnimations(toBeSortedAnimations));
      });

      return runner;

      // TODO(matsko): change to reference nodes
      function getAnchorNodes(node) {
        var SELECTOR = '[' + NG_ANIMATE_REF_ATTR + ']';
        var items = node.hasAttribute(NG_ANIMATE_REF_ATTR)
              ? [node]
              : node.querySelectorAll(SELECTOR);
        var anchors = [];
        forEach(items, function(node) {
          var attr = node.getAttribute(NG_ANIMATE_REF_ATTR);
          if (attr && attr.length) {
            anchors.push(node);
          }
        });
        return anchors;
      }

      function groupAnimations(animations) {
        var preparedAnimations = [];
        var refLookup = {};
        forEach(animations, function(animation, index) {
          var element = animation.element;
          var node = getDomNode(element);
          var event = animation.event;
          var enterOrMove = ['enter', 'move'].indexOf(event) >= 0;
          var anchorNodes = animation.structural ? getAnchorNodes(node) : [];

          if (anchorNodes.length) {
            var direction = enterOrMove ? 'to' : 'from';

            forEach(anchorNodes, function(anchor) {
              var key = anchor.getAttribute(NG_ANIMATE_REF_ATTR);
              refLookup[key] = refLookup[key] || {};
              refLookup[key][direction] = {
                animationID: index,
                element: jqLite(anchor)
              };
            });
          } else {
            preparedAnimations.push(animation);
          }
        });

        var usedIndicesLookup = {};
        var anchorGroups = {};
        forEach(refLookup, function(operations, key) {
          var from = operations.from;
          var to = operations.to;

          if (!from || !to) {
            // only one of these is set therefore we can't have an
            // anchor animation since all three pieces are required
            var index = from ? from.animationID : to.animationID;
            var indexKey = index.toString();
            if (!usedIndicesLookup[indexKey]) {
              usedIndicesLookup[indexKey] = true;
              preparedAnimations.push(animations[index]);
            }
            return;
          }

          var fromAnimation = animations[from.animationID];
          var toAnimation = animations[to.animationID];
          var lookupKey = from.animationID.toString();
          if (!anchorGroups[lookupKey]) {
            var group = anchorGroups[lookupKey] = {
              structural: true,
              beforeStart: function() {
                fromAnimation.beforeStart();
                toAnimation.beforeStart();
              },
              close: function() {
                fromAnimation.close();
                toAnimation.close();
              },
              classes: cssClassesIntersection(fromAnimation.classes, toAnimation.classes),
              from: fromAnimation,
              to: toAnimation,
              anchors: [] // TODO(matsko): change to reference nodes
            };

            // the anchor animations require that the from and to elements both have at least
            // one shared CSS class which effectively marries the two elements together to use
            // the same animation driver and to properly sequence the anchor animation.
            if (group.classes.length) {
              preparedAnimations.push(group);
            } else {
              preparedAnimations.push(fromAnimation);
              preparedAnimations.push(toAnimation);
            }
          }

          anchorGroups[lookupKey].anchors.push({
            'out': from.element, 'in': to.element
          });
        });

        return preparedAnimations;
      }

      function cssClassesIntersection(a,b) {
        a = a.split(' ');
        b = b.split(' ');
        var matches = [];

        for (var i = 0; i < a.length; i++) {
          var aa = a[i];
          if (aa.substring(0,3) === 'ng-') continue;

          for (var j = 0; j < b.length; j++) {
            if (aa === b[j]) {
              matches.push(aa);
              break;
            }
          }
        }

        return matches.join(' ');
      }

      function invokeFirstDriver(animationDetails) {
        // we loop in reverse order since the more general drivers (like CSS and JS)
        // may attempt more elements, but custom drivers are more particular
        for (var i = drivers.length - 1; i >= 0; i--) {
          var driverName = drivers[i];
          var factory = $injector.get(driverName);
          var driver = factory(animationDetails);
          if (driver) {
            return driver;
          }
        }
      }

      function beforeStart() {
        element.addClass(NG_ANIMATE_CLASSNAME);
        if (tempClasses) {
          $$jqLite.addClass(element, tempClasses);
        }
        if (prepareClassName) {
          $$jqLite.removeClass(element, prepareClassName);
          prepareClassName = null;
        }
      }

      function updateAnimationRunners(animation, newRunner) {
        if (animation.from && animation.to) {
          update(animation.from.element);
          update(animation.to.element);
        } else {
          update(animation.element);
        }

        function update(element) {
          var runner = getRunner(element);
          if (runner) runner.setHost(newRunner);
        }
      }

      function handleDestroyedElement() {
        var runner = getRunner(element);
        if (runner && (event !== 'leave' || !options.$$domOperationFired)) {
          runner.end();
        }
      }

      function close(rejected) {
        element.off('$destroy', handleDestroyedElement);
        removeRunner(element);

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();

        if (tempClasses) {
          $$jqLite.removeClass(element, tempClasses);
        }

        element.removeClass(NG_ANIMATE_CLASSNAME);
        runner.complete(!rejected);
      }
    };
  }];
}];

/**
 * @ngdoc directive
 * @name ngAnimateSwap
 * @restrict A
 * @scope
 *
 * @description
 *
 * ngAnimateSwap is a animation-oriented directive that allows for the container to
 * be removed and entered in whenever the associated expression changes. A
 * common usecase for this directive is a rotating banner or slider component which
 * contains one image being present at a time. When the active image changes
 * then the old image will perform a `leave` animation and the new element
 * will be inserted via an `enter` animation.
 *
 * @animations
 * | Animation                        | Occurs                               |
 * |----------------------------------|--------------------------------------|
 * | {@link ng.$animate#enter enter}  | when the new element is inserted to the DOM  |
 * | {@link ng.$animate#leave leave}  | when the old element is removed from the DOM |
 *
 * @example
 * <example name="ngAnimateSwap-directive" module="ngAnimateSwapExample"
 *          deps="angular-animate.js"
 *          animations="true" fixBase="true">
 *   <file name="index.html">
 *     <div class="container" ng-controller="AppCtrl">
 *       <div ng-animate-swap="number" class="cell swap-animation" ng-class="colorClass(number)">
 *         {{ number }}
 *       </div>
 *     </div>
 *   </file>
 *   <file name="script.js">
 *     angular.module('ngAnimateSwapExample', ['ngAnimate'])
 *       .controller('AppCtrl', ['$scope', '$interval', function($scope, $interval) {
 *         $scope.number = 0;
 *         $interval(function() {
 *           $scope.number++;
 *         }, 1000);
 *
 *         var colors = ['red','blue','green','yellow','orange'];
 *         $scope.colorClass = function(number) {
 *           return colors[number % colors.length];
 *         };
 *       }]);
 *   </file>
 *  <file name="animations.css">
 *  .container {
 *    height:250px;
 *    width:250px;
 *    position:relative;
 *    overflow:hidden;
 *    border:2px solid black;
 *  }
 *  .container .cell {
 *    font-size:150px;
 *    text-align:center;
 *    line-height:250px;
 *    position:absolute;
 *    top:0;
 *    left:0;
 *    right:0;
 *    border-bottom:2px solid black;
 *  }
 *  .swap-animation.ng-enter, .swap-animation.ng-leave {
 *    transition:0.5s linear all;
 *  }
 *  .swap-animation.ng-enter {
 *    top:-250px;
 *  }
 *  .swap-animation.ng-enter-active {
 *    top:0px;
 *  }
 *  .swap-animation.ng-leave {
 *    top:0px;
 *  }
 *  .swap-animation.ng-leave-active {
 *    top:250px;
 *  }
 *  .red { background:red; }
 *  .green { background:green; }
 *  .blue { background:blue; }
 *  .yellow { background:yellow; }
 *  .orange { background:orange; }
 *  </file>
 * </example>
 */
var ngAnimateSwapDirective = ['$animate', '$rootScope', function($animate, $rootScope) {
  return {
    restrict: 'A',
    transclude: 'element',
    terminal: true,
    priority: 600, // we use 600 here to ensure that the directive is caught before others
    link: function(scope, $element, attrs, ctrl, $transclude) {
      var previousElement, previousScope;
      scope.$watchCollection(attrs.ngAnimateSwap || attrs['for'], function(value) {
        if (previousElement) {
          $animate.leave(previousElement);
        }
        if (previousScope) {
          previousScope.$destroy();
          previousScope = null;
        }
        if (value || value === 0) {
          previousScope = scope.$new();
          $transclude(previousScope, function(element) {
            previousElement = element;
            $animate.enter(element, null, $element);
          });
        }
      });
    }
  };
}];

/**
 * @ngdoc module
 * @name ngAnimate
 * @description
 *
 * The `ngAnimate` module provides support for CSS-based animations (keyframes and transitions) as well as JavaScript-based animations via
 * callback hooks. Animations are not enabled by default, however, by including `ngAnimate` the animation hooks are enabled for an Angular app.
 *
 * <div doc-module-components="ngAnimate"></div>
 *
 * # Usage
 * Simply put, there are two ways to make use of animations when ngAnimate is used: by using **CSS** and **JavaScript**. The former works purely based
 * using CSS (by using matching CSS selectors/styles) and the latter triggers animations that are registered via `module.animation()`. For
 * both CSS and JS animations the sole requirement is to have a matching `CSS class` that exists both in the registered animation and within
 * the HTML element that the animation will be triggered on.
 *
 * ## Directive Support
 * The following directives are "animation aware":
 *
 * | Directive                                                                                                | Supported Animations                                                     |
 * |----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
 * | {@link ng.directive:ngRepeat#animations ngRepeat}                                                        | enter, leave and move                                                    |
 * | {@link ngRoute.directive:ngView#animations ngView}                                                       | enter and leave                                                          |
 * | {@link ng.directive:ngInclude#animations ngInclude}                                                      | enter and leave                                                          |
 * | {@link ng.directive:ngSwitch#animations ngSwitch}                                                        | enter and leave                                                          |
 * | {@link ng.directive:ngIf#animations ngIf}                                                                | enter and leave                                                          |
 * | {@link ng.directive:ngClass#animations ngClass}                                                          | add and remove (the CSS class(es) present)                               |
 * | {@link ng.directive:ngShow#animations ngShow} & {@link ng.directive:ngHide#animations ngHide}            | add and remove (the ng-hide class value)                                 |
 * | {@link ng.directive:form#animation-hooks form} & {@link ng.directive:ngModel#animation-hooks ngModel}    | add and remove (dirty, pristine, valid, invalid & all other validations) |
 * | {@link module:ngMessages#animations ngMessages}                                                          | add and remove (ng-active & ng-inactive)                                 |
 * | {@link module:ngMessages#animations ngMessage}                                                           | enter and leave                                                          |
 *
 * (More information can be found by visiting each the documentation associated with each directive.)
 *
 * ## CSS-based Animations
 *
 * CSS-based animations with ngAnimate are unique since they require no JavaScript code at all. By using a CSS class that we reference between our HTML
 * and CSS code we can create an animation that will be picked up by Angular when an underlying directive performs an operation.
 *
 * The example below shows how an `enter` animation can be made possible on an element using `ng-if`:
 *
 * ```html
 * <div ng-if="bool" class="fade">
 *    Fade me in out
 * </div>
 * <button ng-click="bool=true">Fade In!</button>
 * <button ng-click="bool=false">Fade Out!</button>
 * ```
 *
 * Notice the CSS class **fade**? We can now create the CSS transition code that references this class:
 *
 * ```css
 * /&#42; The starting CSS styles for the enter animation &#42;/
 * .fade.ng-enter {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 *
 * /&#42; The finishing CSS styles for the enter animation &#42;/
 * .fade.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * ```
 *
 * The key thing to remember here is that, depending on the animation event (which each of the directives above trigger depending on what's going on) two
 * generated CSS classes will be applied to the element; in the example above we have `.ng-enter` and `.ng-enter-active`. For CSS transitions, the transition
 * code **must** be defined within the starting CSS class (in this case `.ng-enter`). The destination class is what the transition will animate towards.
 *
 * If for example we wanted to create animations for `leave` and `move` (ngRepeat triggers move) then we can do so using the same CSS naming conventions:
 *
 * ```css
 * /&#42; now the element will fade out before it is removed from the DOM &#42;/
 * .fade.ng-leave {
 *   transition:0.5s linear all;
 *   opacity:1;
 * }
 * .fade.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * We can also make use of **CSS Keyframes** by referencing the keyframe animation within the starting CSS class:
 *
 * ```css
 * /&#42; there is no need to define anything inside of the destination
 * CSS class since the keyframe will take charge of the animation &#42;/
 * .fade.ng-leave {
 *   animation: my_fade_animation 0.5s linear;
 *   -webkit-animation: my_fade_animation 0.5s linear;
 * }
 *
 * @keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 *
 * @-webkit-keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 * ```
 *
 * Feel free also mix transitions and keyframes together as well as any other CSS classes on the same element.
 *
 * ### CSS Class-based Animations
 *
 * Class-based animations (animations that are triggered via `ngClass`, `ngShow`, `ngHide` and some other directives) have a slightly different
 * naming convention. Class-based animations are basic enough that a standard transition or keyframe can be referenced on the class being added
 * and removed.
 *
 * For example if we wanted to do a CSS animation for `ngHide` then we place an animation on the `.ng-hide` CSS class:
 *
 * ```html
 * <div ng-show="bool" class="fade">
 *   Show and hide me
 * </div>
 * <button ng-click="bool=!bool">Toggle</button>
 *
 * <style>
 * .fade.ng-hide {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 * </style>
 * ```
 *
 * All that is going on here with ngShow/ngHide behind the scenes is the `.ng-hide` class is added/removed (when the hidden state is valid). Since
 * ngShow and ngHide are animation aware then we can match up a transition and ngAnimate handles the rest.
 *
 * In addition the addition and removal of the CSS class, ngAnimate also provides two helper methods that we can use to further decorate the animation
 * with CSS styles.
 *
 * ```html
 * <div ng-class="{on:onOff}" class="highlight">
 *   Highlight this box
 * </div>
 * <button ng-click="onOff=!onOff">Toggle</button>
 *
 * <style>
 * .highlight {
 *   transition:0.5s linear all;
 * }
 * .highlight.on-add {
 *   background:white;
 * }
 * .highlight.on {
 *   background:yellow;
 * }
 * .highlight.on-remove {
 *   background:black;
 * }
 * </style>
 * ```
 *
 * We can also make use of CSS keyframes by placing them within the CSS classes.
 *
 *
 * ### CSS Staggering Animations
 * A Staggering animation is a collection of animations that are issued with a slight delay in between each successive operation resulting in a
 * curtain-like effect. The ngAnimate module (versions >=1.2) supports staggering animations and the stagger effect can be
 * performed by creating a **ng-EVENT-stagger** CSS class and attaching that class to the base CSS class used for
 * the animation. The style property expected within the stagger class can either be a **transition-delay** or an
 * **animation-delay** property (or both if your animation contains both transitions and keyframe animations).
 *
 * ```css
 * .my-animation.ng-enter {
 *   /&#42; standard transition code &#42;/
 *   transition: 1s linear all;
 *   opacity:0;
 * }
 * .my-animation.ng-enter-stagger {
 *   /&#42; this will have a 100ms delay between each successive leave animation &#42;/
 *   transition-delay: 0.1s;
 *
 *   /&#42; As of 1.4.4, this must always be set: it signals ngAnimate
 *     to not accidentally inherit a delay property from another CSS class &#42;/
 *   transition-duration: 0s;
 *
 *   /&#42; if you are using animations instead of transitions you should configure as follows:
 *     animation-delay: 0.1s;
 *     animation-duration: 0s; &#42;/
 * }
 * .my-animation.ng-enter.ng-enter-active {
 *   /&#42; standard transition styles &#42;/
 *   opacity:1;
 * }
 * ```
 *
 * Staggering animations work by default in ngRepeat (so long as the CSS class is defined). Outside of ngRepeat, to use staggering animations
 * on your own, they can be triggered by firing multiple calls to the same event on $animate. However, the restrictions surrounding this
 * are that each of the elements must have the same CSS className value as well as the same parent element. A stagger operation
 * will also be reset if one or more animation frames have passed since the multiple calls to `$animate` were fired.
 *
 * The following code will issue the **ng-leave-stagger** event on the element provided:
 *
 * ```js
 * var kids = parent.children();
 *
 * $animate.leave(kids[0]); //stagger index=0
 * $animate.leave(kids[1]); //stagger index=1
 * $animate.leave(kids[2]); //stagger index=2
 * $animate.leave(kids[3]); //stagger index=3
 * $animate.leave(kids[4]); //stagger index=4
 *
 * window.requestAnimationFrame(function() {
 *   //stagger has reset itself
 *   $animate.leave(kids[5]); //stagger index=0
 *   $animate.leave(kids[6]); //stagger index=1
 *
 *   $scope.$digest();
 * });
 * ```
 *
 * Stagger animations are currently only supported within CSS-defined animations.
 *
 * ### The `ng-animate` CSS class
 *
 * When ngAnimate is animating an element it will apply the `ng-animate` CSS class to the element for the duration of the animation.
 * This is a temporary CSS class and it will be removed once the animation is over (for both JavaScript and CSS-based animations).
 *
 * Therefore, animations can be applied to an element using this temporary class directly via CSS.
 *
 * ```css
 * .zipper.ng-animate {
 *   transition:0.5s linear all;
 * }
 * .zipper.ng-enter {
 *   opacity:0;
 * }
 * .zipper.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * .zipper.ng-leave {
 *   opacity:1;
 * }
 * .zipper.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * (Note that the `ng-animate` CSS class is reserved and it cannot be applied on an element directly since ngAnimate will always remove
 * the CSS class once an animation has completed.)
 *
 *
 * ### The `ng-[event]-prepare` class
 *
 * This is a special class that can be used to prevent unwanted flickering / flash of content before
 * the actual animation starts. The class is added as soon as an animation is initialized, but removed
 * before the actual animation starts (after waiting for a $digest).
 * It is also only added for *structural* animations (`enter`, `move`, and `leave`).
 *
 * In practice, flickering can appear when nesting elements with structural animations such as `ngIf`
 * into elements that have class-based animations such as `ngClass`.
 *
 * ```html
 * <div ng-class="{red: myProp}">
 *   <div ng-class="{blue: myProp}">
 *     <div class="message" ng-if="myProp"></div>
 *   </div>
 * </div>
 * ```
 *
 * It is possible that during the `enter` animation, the `.message` div will be briefly visible before it starts animating.
 * In that case, you can add styles to the CSS that make sure the element stays hidden before the animation starts:
 *
 * ```css
 * .message.ng-enter-prepare {
 *   opacity: 0;
 * }
 *
 * ```
 *
 * ## JavaScript-based Animations
 *
 * ngAnimate also allows for animations to be consumed by JavaScript code. The approach is similar to CSS-based animations (where there is a shared
 * CSS class that is referenced in our HTML code) but in addition we need to register the JavaScript animation on the module. By making use of the
 * `module.animation()` module function we can register the animation.
 *
 * Let's see an example of a enter/leave animation using `ngRepeat`:
 *
 * ```html
 * <div ng-repeat="item in items" class="slide">
 *   {{ item }}
 * </div>
 * ```
 *
 * See the **slide** CSS class? Let's use that class to define an animation that we'll structure in our module code by using `module.animation`:
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     // make note that other events (like addClass/removeClass)
 *     // have different function input parameters
 *     enter: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *
 *       // remember to call doneFn so that angular
 *       // knows that the animation has concluded
 *     },
 *
 *     move: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *     },
 *
 *     leave: function(element, doneFn) {
 *       jQuery(element).fadeOut(1000, doneFn);
 *     }
 *   }
 * }]);
 * ```
 *
 * The nice thing about JS-based animations is that we can inject other services and make use of advanced animation libraries such as
 * greensock.js and velocity.js.
 *
 * If our animation code class-based (meaning that something like `ngClass`, `ngHide` and `ngShow` triggers it) then we can still define
 * our animations inside of the same registered animation, however, the function input arguments are a bit different:
 *
 * ```html
 * <div ng-class="color" class="colorful">
 *   this box is moody
 * </div>
 * <button ng-click="color='red'">Change to red</button>
 * <button ng-click="color='blue'">Change to blue</button>
 * <button ng-click="color='green'">Change to green</button>
 * ```
 *
 * ```js
 * myModule.animation('.colorful', [function() {
 *   return {
 *     addClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     removeClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     setClass: function(element, addedClass, removedClass, doneFn) {
 *       // do some cool animation and call the doneFn
 *     }
 *   }
 * }]);
 * ```
 *
 * ## CSS + JS Animations Together
 *
 * AngularJS 1.4 and higher has taken steps to make the amalgamation of CSS and JS animations more flexible. However, unlike earlier versions of Angular,
 * defining CSS and JS animations to work off of the same CSS class will not work anymore. Therefore the example below will only result in **JS animations taking
 * charge of the animation**:
 *
 * ```html
 * <div ng-if="bool" class="slide">
 *   Slide in and out
 * </div>
 * ```
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     enter: function(element, doneFn) {
 *       jQuery(element).slideIn(1000, doneFn);
 *     }
 *   }
 * }]);
 * ```
 *
 * ```css
 * .slide.ng-enter {
 *   transition:0.5s linear all;
 *   transform:translateY(-100px);
 * }
 * .slide.ng-enter.ng-enter-active {
 *   transform:translateY(0);
 * }
 * ```
 *
 * Does this mean that CSS and JS animations cannot be used together? Do JS-based animations always have higher priority? We can make up for the
 * lack of CSS animations by using the `$animateCss` service to trigger our own tweaked-out, CSS-based animations directly from
 * our own JS-based animation code:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element) {
*        // this will trigger `.slide.ng-enter` and `.slide.ng-enter-active`.
 *       return $animateCss(element, {
 *         event: 'enter',
 *         structural: true
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * The nice thing here is that we can save bandwidth by sticking to our CSS-based animation code and we don't need to rely on a 3rd-party animation framework.
 *
 * The `$animateCss` service is very powerful since we can feed in all kinds of extra properties that will be evaluated and fed into a CSS transition or
 * keyframe animation. For example if we wanted to animate the height of an element while adding and removing classes then we can do so by providing that
 * data into `$animateCss` directly:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element) {
 *       return $animateCss(element, {
 *         event: 'enter',
 *         structural: true,
 *         addClass: 'maroon-setting',
 *         from: { height:0 },
 *         to: { height: 200 }
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * Now we can fill in the rest via our transition CSS code:
 *
 * ```css
 * /&#42; the transition tells ngAnimate to make the animation happen &#42;/
 * .slide.ng-enter { transition:0.5s linear all; }
 *
 * /&#42; this extra CSS class will be absorbed into the transition
 * since the $animateCss code is adding the class &#42;/
 * .maroon-setting { background:red; }
 * ```
 *
 * And `$animateCss` will figure out the rest. Just make sure to have the `done()` callback fire the `doneFn` function to signal when the animation is over.
 *
 * To learn more about what's possible be sure to visit the {@link ngAnimate.$animateCss $animateCss service}.
 *
 * ## Animation Anchoring (via `ng-animate-ref`)
 *
 * ngAnimate in AngularJS 1.4 comes packed with the ability to cross-animate elements between
 * structural areas of an application (like views) by pairing up elements using an attribute
 * called `ng-animate-ref`.
 *
 * Let's say for example we have two views that are managed by `ng-view` and we want to show
 * that there is a relationship between two components situated in within these views. By using the
 * `ng-animate-ref` attribute we can identify that the two components are paired together and we
 * can then attach an animation, which is triggered when the view changes.
 *
 * Say for example we have the following template code:
 *
 * ```html
 * <!-- index.html -->
 * <div ng-view class="view-animation">
 * </div>
 *
 * <!-- home.html -->
 * <a href="#/banner-page">
 *   <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * </a>
 *
 * <!-- banner-page.html -->
 * <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * ```
 *
 * Now, when the view changes (once the link is clicked), ngAnimate will examine the
 * HTML contents to see if there is a match reference between any components in the view
 * that is leaving and the view that is entering. It will scan both the view which is being
 * removed (leave) and inserted (enter) to see if there are any paired DOM elements that
 * contain a matching ref value.
 *
 * The two images match since they share the same ref value. ngAnimate will now create a
 * transport element (which is a clone of the first image element) and it will then attempt
 * to animate to the position of the second image element in the next view. For the animation to
 * work a special CSS class called `ng-anchor` will be added to the transported element.
 *
 * We can now attach a transition onto the `.banner.ng-anchor` CSS class and then
 * ngAnimate will handle the entire transition for us as well as the addition and removal of
 * any changes of CSS classes between the elements:
 *
 * ```css
 * .banner.ng-anchor {
 *   /&#42; this animation will last for 1 second since there are
 *          two phases to the animation (an `in` and an `out` phase) &#42;/
 *   transition:0.5s linear all;
 * }
 * ```
 *
 * We also **must** include animations for the views that are being entered and removed
 * (otherwise anchoring wouldn't be possible since the new view would be inserted right away).
 *
 * ```css
 * .view-animation.ng-enter, .view-animation.ng-leave {
 *   transition:0.5s linear all;
 *   position:fixed;
 *   left:0;
 *   top:0;
 *   width:100%;
 * }
 * .view-animation.ng-enter {
 *   transform:translateX(100%);
 * }
 * .view-animation.ng-leave,
 * .view-animation.ng-enter.ng-enter-active {
 *   transform:translateX(0%);
 * }
 * .view-animation.ng-leave.ng-leave-active {
 *   transform:translateX(-100%);
 * }
 * ```
 *
 * Now we can jump back to the anchor animation. When the animation happens, there are two stages that occur:
 * an `out` and an `in` stage. The `out` stage happens first and that is when the element is animated away
 * from its origin. Once that animation is over then the `in` stage occurs which animates the
 * element to its destination. The reason why there are two animations is to give enough time
 * for the enter animation on the new element to be ready.
 *
 * The example above sets up a transition for both the in and out phases, but we can also target the out or
 * in phases directly via `ng-anchor-out` and `ng-anchor-in`.
 *
 * ```css
 * .banner.ng-anchor-out {
 *   transition: 0.5s linear all;
 *
 *   /&#42; the scale will be applied during the out animation,
 *          but will be animated away when the in animation runs &#42;/
 *   transform: scale(1.2);
 * }
 *
 * .banner.ng-anchor-in {
 *   transition: 1s linear all;
 * }
 * ```
 *
 *
 *
 *
 * ### Anchoring Demo
 *
  <example module="anchoringExample"
           name="anchoringExample"
           id="anchoringExample"
           deps="angular-animate.js;angular-route.js"
           animations="true">
    <file name="index.html">
      <a href="#!/">Home</a>
      <hr />
      <div class="view-container">
        <div ng-view class="view"></div>
      </div>
    </file>
    <file name="script.js">
      angular.module('anchoringExample', ['ngAnimate', 'ngRoute'])
        .config(['$routeProvider', function($routeProvider) {
          $routeProvider.when('/', {
            templateUrl: 'home.html',
            controller: 'HomeController as home'
          });
          $routeProvider.when('/profile/:id', {
            templateUrl: 'profile.html',
            controller: 'ProfileController as profile'
          });
        }])
        .run(['$rootScope', function($rootScope) {
          $rootScope.records = [
            { id: 1, title: 'Miss Beulah Roob' },
            { id: 2, title: 'Trent Morissette' },
            { id: 3, title: 'Miss Ava Pouros' },
            { id: 4, title: 'Rod Pouros' },
            { id: 5, title: 'Abdul Rice' },
            { id: 6, title: 'Laurie Rutherford Sr.' },
            { id: 7, title: 'Nakia McLaughlin' },
            { id: 8, title: 'Jordon Blanda DVM' },
            { id: 9, title: 'Rhoda Hand' },
            { id: 10, title: 'Alexandrea Sauer' }
          ];
        }])
        .controller('HomeController', [function() {
          //empty
        }])
        .controller('ProfileController', ['$rootScope', '$routeParams',
            function ProfileController($rootScope, $routeParams) {
          var index = parseInt($routeParams.id, 10);
          var record = $rootScope.records[index - 1];

          this.title = record.title;
          this.id = record.id;
        }]);
    </file>
    <file name="home.html">
      <h2>Welcome to the home page</h1>
      <p>Please click on an element</p>
      <a class="record"
         ng-href="#!/profile/{{ record.id }}"
         ng-animate-ref="{{ record.id }}"
         ng-repeat="record in records">
        {{ record.title }}
      </a>
    </file>
    <file name="profile.html">
      <div class="profile record" ng-animate-ref="{{ profile.id }}">
        {{ profile.title }}
      </div>
    </file>
    <file name="animations.css">
      .record {
        display:block;
        font-size:20px;
      }
      .profile {
        background:black;
        color:white;
        font-size:100px;
      }
      .view-container {
        position:relative;
      }
      .view-container > .view.ng-animate {
        position:absolute;
        top:0;
        left:0;
        width:100%;
        min-height:500px;
      }
      .view.ng-enter, .view.ng-leave,
      .record.ng-anchor {
        transition:0.5s linear all;
      }
      .view.ng-enter {
        transform:translateX(100%);
      }
      .view.ng-enter.ng-enter-active, .view.ng-leave {
        transform:translateX(0%);
      }
      .view.ng-leave.ng-leave-active {
        transform:translateX(-100%);
      }
      .record.ng-anchor-out {
        background:red;
      }
    </file>
  </example>
 *
 * ### How is the element transported?
 *
 * When an anchor animation occurs, ngAnimate will clone the starting element and position it exactly where the starting
 * element is located on screen via absolute positioning. The cloned element will be placed inside of the root element
 * of the application (where ng-app was defined) and all of the CSS classes of the starting element will be applied. The
 * element will then animate into the `out` and `in` animations and will eventually reach the coordinates and match
 * the dimensions of the destination element. During the entire animation a CSS class of `.ng-animate-shim` will be applied
 * to both the starting and destination elements in order to hide them from being visible (the CSS styling for the class
 * is: `visibility:hidden`). Once the anchor reaches its destination then it will be removed and the destination element
 * will become visible since the shim class will be removed.
 *
 * ### How is the morphing handled?
 *
 * CSS Anchoring relies on transitions and keyframes and the internal code is intelligent enough to figure out
 * what CSS classes differ between the starting element and the destination element. These different CSS classes
 * will be added/removed on the anchor element and a transition will be applied (the transition that is provided
 * in the anchor class). Long story short, ngAnimate will figure out what classes to add and remove which will
 * make the transition of the element as smooth and automatic as possible. Be sure to use simple CSS classes that
 * do not rely on DOM nesting structure so that the anchor element appears the same as the starting element (since
 * the cloned element is placed inside of root element which is likely close to the body element).
 *
 * Note that if the root element is on the `<html>` element then the cloned node will be placed inside of body.
 *
 *
 * ## Using $animate in your directive code
 *
 * So far we've explored how to feed in animations into an Angular application, but how do we trigger animations within our own directives in our application?
 * By injecting the `$animate` service into our directive code, we can trigger structural and class-based hooks which can then be consumed by animations. Let's
 * imagine we have a greeting box that shows and hides itself when the data changes
 *
 * ```html
 * <greeting-box active="onOrOff">Hi there</greeting-box>
 * ```
 *
 * ```js
 * ngModule.directive('greetingBox', ['$animate', function($animate) {
 *   return function(scope, element, attrs) {
 *     attrs.$observe('active', function(value) {
 *       value ? $animate.addClass(element, 'on') : $animate.removeClass(element, 'on');
 *     });
 *   });
 * }]);
 * ```
 *
 * Now the `on` CSS class is added and removed on the greeting box component. Now if we add a CSS class on top of the greeting box element
 * in our HTML code then we can trigger a CSS or JS animation to happen.
 *
 * ```css
 * /&#42; normally we would create a CSS class to reference on the element &#42;/
 * greeting-box.on { transition:0.5s linear all; background:green; color:white; }
 * ```
 *
 * The `$animate` service contains a variety of other methods like `enter`, `leave`, `animate` and `setClass`. To learn more about what's
 * possible be sure to visit the {@link ng.$animate $animate service API page}.
 *
 *
 * ## Callbacks and Promises
 *
 * When `$animate` is called it returns a promise that can be used to capture when the animation has ended. Therefore if we were to trigger
 * an animation (within our directive code) then we can continue performing directive and scope related activities after the animation has
 * ended by chaining onto the returned promise that animation method returns.
 *
 * ```js
 * // somewhere within the depths of the directive
 * $animate.enter(element, parent).then(function() {
 *   //the animation has completed
 * });
 * ```
 *
 * (Note that earlier versions of Angular prior to v1.4 required the promise code to be wrapped using `$scope.$apply(...)`. This is not the case
 * anymore.)
 *
 * In addition to the animation promise, we can also make use of animation-related callbacks within our directives and controller code by registering
 * an event listener using the `$animate` service. Let's say for example that an animation was triggered on our view
 * routing controller to hook into that:
 *
 * ```js
 * ngModule.controller('HomePageController', ['$animate', function($animate) {
 *   $animate.on('enter', ngViewElement, function(element) {
 *     // the animation for this route has completed
 *   }]);
 * }])
 * ```
 *
 * (Note that you will need to trigger a digest within the callback to get angular to notice any scope-related changes.)
 */

var copy;
var extend;
var forEach;
var isArray;
var isDefined;
var isElement;
var isFunction;
var isObject;
var isString;
var isUndefined;
var jqLite;
var noop;

/**
 * @ngdoc service
 * @name $animate
 * @kind object
 *
 * @description
 * The ngAnimate `$animate` service documentation is the same for the core `$animate` service.
 *
 * Click here {@link ng.$animate to learn more about animations with `$animate`}.
 */
angular.module('ngAnimate', [], function initAngularHelpers() {
  // Access helpers from angular core.
  // Do it inside a `config` block to ensure `window.angular` is available.
  noop        = angular.noop;
  copy        = angular.copy;
  extend      = angular.extend;
  jqLite      = angular.element;
  forEach     = angular.forEach;
  isArray     = angular.isArray;
  isString    = angular.isString;
  isObject    = angular.isObject;
  isUndefined = angular.isUndefined;
  isDefined   = angular.isDefined;
  isFunction  = angular.isFunction;
  isElement   = angular.isElement;
})
  .info({ angularVersion: '1.6.4' })
  .directive('ngAnimateSwap', ngAnimateSwapDirective)

  .directive('ngAnimateChildren', $$AnimateChildrenDirective)
  .factory('$$rAFScheduler', $$rAFSchedulerFactory)

  .provider('$$animateQueue', $$AnimateQueueProvider)
  .provider('$$animation', $$AnimationProvider)

  .provider('$animateCss', $AnimateCssProvider)
  .provider('$$animateCssDriver', $$AnimateCssDriverProvider)

  .provider('$$animateJs', $$AnimateJsProvider)
  .provider('$$animateJsDriver', $$AnimateJsDriverProvider);


})(window, window.angular);

/**
 * @license AngularJS v1.6.4
 * (c) 2010-2017 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *     Any commits to this file should be reviewed with security in mind.  *
 *   Changes to this file can potentially create security vulnerabilities. *
 *          An approval from 2 Core members with history of modifying      *
 *                         this file is required.                          *
 *                                                                         *
 *  Does the change somehow allow for arbitrary javascript to be executed? *
 *    Or allows for someone to change the prototype of built-in objects?   *
 *     Or gives undesired access to variables likes document or window?    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $sanitizeMinErr = angular.$$minErr('$sanitize');
var bind;
var extend;
var forEach;
var isDefined;
var lowercase;
var noop;
var nodeContains;
var htmlParser;
var htmlSanitizeWriter;

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * # ngSanitize
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 *
 * <div doc-module-components="ngSanitize"></div>
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   Sanitizes an html string by stripping all potentially dangerous tokens.
 *
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to properly escaped html string. This means that no unsafe input can make
 *   it into the returned string.
 *
 *   The whitelist for URL sanitization of attribute values is configured using the functions
 *   `aHrefSanitizationWhitelist` and `imgSrcSanitizationWhitelist` of {@link ng.$compileProvider
 *   `$compileProvider`}.
 *
 *   The input may also contain SVG markup if this is enabled via {@link $sanitizeProvider}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 * @example
   <example module="sanitizeExample" deps="angular-sanitize.js" name="sanitize-service">
   <file name="index.html">
     <script>
         angular.module('sanitizeExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */


/**
 * @ngdoc provider
 * @name $sanitizeProvider
 * @this
 *
 * @description
 * Creates and configures {@link $sanitize} instance.
 */
function $SanitizeProvider() {
  var svgEnabled = false;

  this.$get = ['$$sanitizeUri', function($$sanitizeUri) {
    if (svgEnabled) {
      extend(validElements, svgElements);
    }
    return function(html) {
      var buf = [];
      htmlParser(html, htmlSanitizeWriter(buf, function(uri, isImage) {
        return !/^unsafe:/.test($$sanitizeUri(uri, isImage));
      }));
      return buf.join('');
    };
  }];


  /**
   * @ngdoc method
   * @name $sanitizeProvider#enableSvg
   * @kind function
   *
   * @description
   * Enables a subset of svg to be supported by the sanitizer.
   *
   * <div class="alert alert-warning">
   *   <p>By enabling this setting without taking other precautions, you might expose your
   *   application to click-hijacking attacks. In these attacks, sanitized svg elements could be positioned
   *   outside of the containing element and be rendered over other elements on the page (e.g. a login
   *   link). Such behavior can then result in phishing incidents.</p>
   *
   *   <p>To protect against these, explicitly setup `overflow: hidden` css rule for all potential svg
   *   tags within the sanitized content:</p>
   *
   *   <br>
   *
   *   <pre><code>
   *   .rootOfTheIncludedContent svg {
   *     overflow: hidden !important;
   *   }
   *   </code></pre>
   * </div>
   *
   * @param {boolean=} flag Enable or disable SVG support in the sanitizer.
   * @returns {boolean|ng.$sanitizeProvider} Returns the currently configured value if called
   *    without an argument or self for chaining otherwise.
   */
  this.enableSvg = function(enableSvg) {
    if (isDefined(enableSvg)) {
      svgEnabled = enableSvg;
      return this;
    } else {
      return svgEnabled;
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Private stuff
  //////////////////////////////////////////////////////////////////////////////////////////////////

  bind = angular.bind;
  extend = angular.extend;
  forEach = angular.forEach;
  isDefined = angular.isDefined;
  lowercase = angular.lowercase;
  noop = angular.noop;

  htmlParser = htmlParserImpl;
  htmlSanitizeWriter = htmlSanitizeWriterImpl;

  nodeContains = window.Node.prototype.contains || /** @this */ function(arg) {
    // eslint-disable-next-line no-bitwise
    return !!(this.compareDocumentPosition(arg) & 16);
  };

  // Regular Expressions for parsing tags and attributes
  var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
    // Match everything outside of normal chars and " (quote character)
    NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g;


  // Good source of info about elements and attributes
  // http://dev.w3.org/html5/spec/Overview.html#semantics
  // http://simon.html5.org/html-elements

  // Safe Void Elements - HTML5
  // http://dev.w3.org/html5/spec/Overview.html#void-elements
  var voidElements = toMap('area,br,col,hr,img,wbr');

  // Elements that you can, intentionally, leave open (and which close themselves)
  // http://dev.w3.org/html5/spec/Overview.html#optional-tags
  var optionalEndTagBlockElements = toMap('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr'),
      optionalEndTagInlineElements = toMap('rp,rt'),
      optionalEndTagElements = extend({},
                                              optionalEndTagInlineElements,
                                              optionalEndTagBlockElements);

  // Safe Block Elements - HTML5
  var blockElements = extend({}, optionalEndTagBlockElements, toMap('address,article,' +
          'aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
          'h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,section,table,ul'));

  // Inline Elements - HTML5
  var inlineElements = extend({}, optionalEndTagInlineElements, toMap('a,abbr,acronym,b,' +
          'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,' +
          'samp,small,span,strike,strong,sub,sup,time,tt,u,var'));

  // SVG Elements
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
  // Note: the elements animate,animateColor,animateMotion,animateTransform,set are intentionally omitted.
  // They can potentially allow for arbitrary javascript to be executed. See #11290
  var svgElements = toMap('circle,defs,desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,' +
          'hkern,image,linearGradient,line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,' +
          'radialGradient,rect,stop,svg,switch,text,title,tspan');

  // Blocked Elements (will be stripped)
  var blockedElements = toMap('script,style');

  var validElements = extend({},
                                     voidElements,
                                     blockElements,
                                     inlineElements,
                                     optionalEndTagElements);

  //Attributes that have href and hence need to be sanitized
  var uriAttrs = toMap('background,cite,href,longdesc,src,xlink:href');

  var htmlAttrs = toMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
      'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
      'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
      'scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type,' +
      'valign,value,vspace,width');

  // SVG attributes (without "id" and "name" attributes)
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
  var svgAttrs = toMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
      'baseProfile,bbox,begin,by,calcMode,cap-height,class,color,color-rendering,content,' +
      'cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,font-size,font-stretch,' +
      'font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,gradientUnits,hanging,' +
      'height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,keySplines,keyTimes,lang,' +
      'marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mathematical,' +
      'max,min,offset,opacity,orient,origin,overline-position,overline-thickness,panose-1,' +
      'path,pathLength,points,preserveAspectRatio,r,refX,refY,repeatCount,repeatDur,' +
      'requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,stemv,stop-color,' +
      'stop-opacity,strikethrough-position,strikethrough-thickness,stroke,stroke-dasharray,' +
      'stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,' +
      'stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,underline-position,' +
      'underline-thickness,unicode,unicode-range,units-per-em,values,version,viewBox,visibility,' +
      'width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,xlink:show,xlink:title,' +
      'xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,zoomAndPan', true);

  var validAttrs = extend({},
                                  uriAttrs,
                                  svgAttrs,
                                  htmlAttrs);

  function toMap(str, lowercaseKeys) {
    var obj = {}, items = str.split(','), i;
    for (i = 0; i < items.length; i++) {
      obj[lowercaseKeys ? lowercase(items[i]) : items[i]] = true;
    }
    return obj;
  }

  var inertBodyElement;
  (function(window) {
    var doc;
    if (window.document && window.document.implementation) {
      doc = window.document.implementation.createHTMLDocument('inert');
    } else {
      throw $sanitizeMinErr('noinert', 'Can\'t create an inert html document');
    }
    var docElement = doc.documentElement || doc.getDocumentElement();
    var bodyElements = docElement.getElementsByTagName('body');

    // usually there should be only one body element in the document, but IE doesn't have any, so we need to create one
    if (bodyElements.length === 1) {
      inertBodyElement = bodyElements[0];
    } else {
      var html = doc.createElement('html');
      inertBodyElement = doc.createElement('body');
      html.appendChild(inertBodyElement);
      doc.appendChild(html);
    }
  })(window);

  /**
   * @example
   * htmlParser(htmlString, {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * });
   *
   * @param {string} html string
   * @param {object} handler
   */
  function htmlParserImpl(html, handler) {
    if (html === null || html === undefined) {
      html = '';
    } else if (typeof html !== 'string') {
      html = '' + html;
    }
    inertBodyElement.innerHTML = html;

    //mXSS protection
    var mXSSAttempts = 5;
    do {
      if (mXSSAttempts === 0) {
        throw $sanitizeMinErr('uinput', 'Failed to sanitize html because the input is unstable');
      }
      mXSSAttempts--;

      // strip custom-namespaced attributes on IE<=11
      if (window.document.documentMode) {
        stripCustomNsAttrs(inertBodyElement);
      }
      html = inertBodyElement.innerHTML; //trigger mXSS
      inertBodyElement.innerHTML = html;
    } while (html !== inertBodyElement.innerHTML);

    var node = inertBodyElement.firstChild;
    while (node) {
      switch (node.nodeType) {
        case 1: // ELEMENT_NODE
          handler.start(node.nodeName.toLowerCase(), attrToMap(node.attributes));
          break;
        case 3: // TEXT NODE
          handler.chars(node.textContent);
          break;
      }

      var nextNode;
      if (!(nextNode = node.firstChild)) {
        if (node.nodeType === 1) {
          handler.end(node.nodeName.toLowerCase());
        }
        nextNode = getNonDescendant('nextSibling', node);
        if (!nextNode) {
          while (nextNode == null) {
            node = getNonDescendant('parentNode', node);
            if (node === inertBodyElement) break;
            nextNode = getNonDescendant('nextSibling', node);
            if (node.nodeType === 1) {
              handler.end(node.nodeName.toLowerCase());
            }
          }
        }
      }
      node = nextNode;
    }

    while ((node = inertBodyElement.firstChild)) {
      inertBodyElement.removeChild(node);
    }
  }

  function attrToMap(attrs) {
    var map = {};
    for (var i = 0, ii = attrs.length; i < ii; i++) {
      var attr = attrs[i];
      map[attr.name] = attr.value;
    }
    return map;
  }


  /**
   * Escapes all potentially dangerous characters, so that the
   * resulting string can be safely inserted into attribute or
   * element text.
   * @param value
   * @returns {string} escaped text
   */
  function encodeEntities(value) {
    return value.
      replace(/&/g, '&amp;').
      replace(SURROGATE_PAIR_REGEXP, function(value) {
        var hi = value.charCodeAt(0);
        var low = value.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
      }).
      replace(NON_ALPHANUMERIC_REGEXP, function(value) {
        return '&#' + value.charCodeAt(0) + ';';
      }).
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;');
  }

  /**
   * create an HTML/XML writer which writes to buffer
   * @param {Array} buf use buf.join('') to get out sanitized html string
   * @returns {object} in the form of {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * }
   */
  function htmlSanitizeWriterImpl(buf, uriValidator) {
    var ignoreCurrentElement = false;
    var out = bind(buf, buf.push);
    return {
      start: function(tag, attrs) {
        tag = lowercase(tag);
        if (!ignoreCurrentElement && blockedElements[tag]) {
          ignoreCurrentElement = tag;
        }
        if (!ignoreCurrentElement && validElements[tag] === true) {
          out('<');
          out(tag);
          forEach(attrs, function(value, key) {
            var lkey = lowercase(key);
            var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
            if (validAttrs[lkey] === true &&
              (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
              out(' ');
              out(key);
              out('="');
              out(encodeEntities(value));
              out('"');
            }
          });
          out('>');
        }
      },
      end: function(tag) {
        tag = lowercase(tag);
        if (!ignoreCurrentElement && validElements[tag] === true && voidElements[tag] !== true) {
          out('</');
          out(tag);
          out('>');
        }
        // eslint-disable-next-line eqeqeq
        if (tag == ignoreCurrentElement) {
          ignoreCurrentElement = false;
        }
      },
      chars: function(chars) {
        if (!ignoreCurrentElement) {
          out(encodeEntities(chars));
        }
      }
    };
  }


  /**
   * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1' attribute to declare
   * ns1 namespace and prefixes the attribute with 'ns1' (e.g. 'ns1:xlink:foo'). This is undesirable since we don't want
   * to allow any of these custom attributes. This method strips them all.
   *
   * @param node Root element to process
   */
  function stripCustomNsAttrs(node) {
    while (node) {
      if (node.nodeType === window.Node.ELEMENT_NODE) {
        var attrs = node.attributes;
        for (var i = 0, l = attrs.length; i < l; i++) {
          var attrNode = attrs[i];
          var attrName = attrNode.name.toLowerCase();
          if (attrName === 'xmlns:ns1' || attrName.lastIndexOf('ns1:', 0) === 0) {
            node.removeAttributeNode(attrNode);
            i--;
            l--;
          }
        }
      }

      var nextNode = node.firstChild;
      if (nextNode) {
        stripCustomNsAttrs(nextNode);
      }

      node = getNonDescendant('nextSibling', node);
    }
  }

  function getNonDescendant(propName, node) {
    // An element is clobbered if its `propName` property points to one of its descendants
    var nextNode = node[propName];
    if (nextNode && nodeContains.call(node, nextNode)) {
      throw $sanitizeMinErr('elclob', 'Failed to sanitize html because the element is clobbered: {0}', node.outerHTML || node.outerText);
    }
    return nextNode;
  }
}

function sanitizeText(chars) {
  var buf = [];
  var writer = htmlSanitizeWriter(buf, noop);
  writer.chars(chars);
  return buf.join('');
}


// define ngSanitize module and register $sanitize service
angular.module('ngSanitize', [])
  .provider('$sanitize', $SanitizeProvider)
  .info({ angularVersion: '1.6.4' });

/**
 * @ngdoc filter
 * @name linky
 * @kind function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports `http/https/ftp/mailto` and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} target Window (`_blank|_self|_parent|_top`) or named frame to open links in.
 * @param {object|function(url)} [attributes] Add custom attributes to the link element.
 *
 *    Can be one of:
 *
 *    - `object`: A map of attributes
 *    - `function`: Takes the url as a parameter and returns a map of attributes
 *
 *    If the map of attributes contains a value for `target`, it overrides the value of
 *    the target parameter.
 *
 *
 * @returns {string} Html-linkified and {@link $sanitize sanitized} text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="linkyExample" deps="angular-sanitize.js" name="linky-filter">
     <file name="index.html">
       <div ng-controller="ExampleController">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <th>Filter</th>
           <th>Source</th>
           <th>Rendered</th>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="linky-custom-attributes">
          <td>linky custom attributes</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="script.js">
       angular.module('linkyExample', ['ngSanitize'])
         .controller('ExampleController', ['$scope', function($scope) {
           $scope.snippet =
             'Pretty text with some links:\n' +
             'http://angularjs.org/,\n' +
             'mailto:us@somewhere.org,\n' +
             'another@somewhere.org,\n' +
             'and one more: ftp://127.0.0.1/.';
           $scope.snippetWithSingleURL = 'http://angularjs.org/';
         }]);
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithSingleURL | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });

       it('should optionally add custom attributes', function() {
        expect(element(by.id('linky-custom-attributes')).
            element(by.binding("snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-custom-attributes a')).getAttribute('rel')).toEqual('nofollow');
       });
     </file>
   </example>
 */
angular.module('ngSanitize').filter('linky', ['$sanitize', function($sanitize) {
  var LINKY_URL_REGEXP =
        /((ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"\u201d\u2019]/i,
      MAILTO_REGEXP = /^mailto:/i;

  var linkyMinErr = angular.$$minErr('linky');
  var isDefined = angular.isDefined;
  var isFunction = angular.isFunction;
  var isObject = angular.isObject;
  var isString = angular.isString;

  return function(text, target, attributes) {
    if (text == null || text === '') return text;
    if (!isString(text)) throw linkyMinErr('notstring', 'Expected string but received: {0}', text);

    var attributesFn =
      isFunction(attributes) ? attributes :
      isObject(attributes) ? function getAttributesObject() {return attributes;} :
      function getEmptyAttributesObject() {return {};};

    var match;
    var raw = text;
    var html = [];
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/www/mailto then assume mailto
      if (!match[2] && !match[4]) {
        url = (match[3] ? 'http://' : 'mailto:') + url;
      }
      i = match.index;
      addText(raw.substr(0, i));
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));
      raw = raw.substring(i + match[0].length);
    }
    addText(raw);
    return $sanitize(html.join(''));

    function addText(text) {
      if (!text) {
        return;
      }
      html.push(sanitizeText(text));
    }

    function addLink(url, text) {
      var key, linkAttributes = attributesFn(url);
      html.push('<a ');

      for (key in linkAttributes) {
        html.push(key + '="' + linkAttributes[key] + '" ');
      }

      if (isDefined(target) && !('target' in linkAttributes)) {
        html.push('target="',
                  target,
                  '" ');
      }
      html.push('href="',
                url.replace(/"/g, '&quot;'),
                '">');
      addText(text);
      html.push('</a>');
    }
  };
}]);


})(window, window.angular);

/**
 * AngularJS module for updating browser title/history based on the current ui-router state.
 *
 * @link https://github.com/nonplus/angular-ui-router-title
 *
 * @license angular-ui-router-title v0.1.1
 * (c) Copyright Stepan Riha <github@nonplus.net>
 * License MIT
 */

(function(angular) {

"use strict";
var documentTitleCallback = undefined;
var defaultDocumentTitle = document.title;
angular.module("ui.router.title", ["ui.router"])
    .provider("$title", function $titleProvider() {
    return {
        documentTitle: function (cb) {
            documentTitleCallback = cb;
        },
        $get: ["$state", function ($state) {
                return {
                    title: function () { return getTitleValue($state.$current.locals.globals["$title"]); },
                    breadCrumbs: function () {
                        var $breadcrumbs = [];
                        var state = $state.$current;
                        while (state) {
                            if (state["resolve"] && state["resolve"].$title) {
                                $breadcrumbs.unshift({
                                    title: getTitleValue(state.locals.globals["$title"]),
                                    state: state["self"].name,
                                    stateParams: state.locals.globals["$stateParams"]
                                });
                            }
                            state = state["parent"];
                        }
                        return $breadcrumbs;
                    }
                };
            }]
    };
})
    .run(["$rootScope", "$timeout", "$title", "$injector", function ($rootScope, $timeout, $title, $injector) {
        $rootScope.$on("$stateChangeSuccess", function () {
            var title = $title.title();
            $timeout(function () {
                $rootScope.$title = title;
                var documentTitle = documentTitleCallback ? $injector.invoke(documentTitleCallback) : title || defaultDocumentTitle;
                document.title = documentTitle;
            });
            $rootScope.$breadcrumbs = $title.breadCrumbs();
        });
    }]);
function getTitleValue(title) {
    return angular.isFunction(title) ? title() : title;
}


})(window.angular);
/**
 * oclazyload - Load modules on demand (lazy load) with angularJS
 * @version v1.0.10
 * @link https://github.com/ocombe/ocLazyLoad
 * @license MIT
 * @author Olivier Combe <olivier.combe@gmail.com>
 */
(function (angular, window) {
    'use strict';

    var regModules = ['ng', 'oc.lazyLoad'],
        regInvokes = {},
        regConfigs = [],
        modulesToLoad = [],
        // modules to load from angular.module or other sources
    realModules = [],
        // real modules called from angular.module
    recordDeclarations = [],
        broadcast = angular.noop,
        runBlocks = {},
        justLoaded = [];

    var ocLazyLoad = angular.module('oc.lazyLoad', ['ng']);

    ocLazyLoad.provider('$ocLazyLoad', ["$controllerProvider", "$provide", "$compileProvider", "$filterProvider", "$injector", "$animateProvider", function ($controllerProvider, $provide, $compileProvider, $filterProvider, $injector, $animateProvider) {
        var modules = {},
            providers = {
            $controllerProvider: $controllerProvider,
            $compileProvider: $compileProvider,
            $filterProvider: $filterProvider,
            $provide: $provide, // other things (constant, decorator, provider, factory, service)
            $injector: $injector,
            $animateProvider: $animateProvider
        },
            debug = false,
            events = false,
            moduleCache = [],
            modulePromises = {};

        moduleCache.push = function (value) {
            if (this.indexOf(value) === -1) {
                Array.prototype.push.apply(this, arguments);
            }
        };

        this.config = function (config) {
            // If we want to define modules configs
            if (angular.isDefined(config.modules)) {
                if (angular.isArray(config.modules)) {
                    angular.forEach(config.modules, function (moduleConfig) {
                        modules[moduleConfig.name] = moduleConfig;
                    });
                } else {
                    modules[config.modules.name] = config.modules;
                }
            }

            if (angular.isDefined(config.debug)) {
                debug = config.debug;
            }

            if (angular.isDefined(config.events)) {
                events = config.events;
            }
        };

        /**
         * Get the list of existing registered modules
         * @param element
         */
        this._init = function _init(element) {
            // this is probably useless now because we override angular.bootstrap
            if (modulesToLoad.length === 0) {
                var elements = [element],
                    names = ['ng:app', 'ng-app', 'x-ng-app', 'data-ng-app'],
                    NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/,
                    append = function append(elm) {
                    return elm && elements.push(elm);
                };

                angular.forEach(names, function (name) {
                    names[name] = true;
                    append(document.getElementById(name));
                    name = name.replace(':', '\\:');
                    if (typeof element[0] !== 'undefined' && element[0].querySelectorAll) {
                        angular.forEach(element[0].querySelectorAll('.' + name), append);
                        angular.forEach(element[0].querySelectorAll('.' + name + '\\:'), append);
                        angular.forEach(element[0].querySelectorAll('[' + name + ']'), append);
                    }
                });

                angular.forEach(elements, function (elm) {
                    if (modulesToLoad.length === 0) {
                        var className = ' ' + element.className + ' ';
                        var match = NG_APP_CLASS_REGEXP.exec(className);
                        if (match) {
                            modulesToLoad.push((match[2] || '').replace(/\s+/g, ','));
                        } else {
                            angular.forEach(elm.attributes, function (attr) {
                                if (modulesToLoad.length === 0 && names[attr.name]) {
                                    modulesToLoad.push(attr.value);
                                }
                            });
                        }
                    }
                });
            }

            if (modulesToLoad.length === 0 && !((window.jasmine || window.mocha) && angular.isDefined(angular.mock))) {
                console.error('No module found during bootstrap, unable to init ocLazyLoad. You should always use the ng-app directive or angular.boostrap when you use ocLazyLoad.');
            }

            var addReg = function addReg(moduleName) {
                if (regModules.indexOf(moduleName) === -1) {
                    // register existing modules
                    regModules.push(moduleName);
                    var mainModule = angular.module(moduleName);

                    // register existing components (directives, services, ...)
                    _invokeQueue(null, mainModule._invokeQueue, moduleName);
                    _invokeQueue(null, mainModule._configBlocks, moduleName); // angular 1.3+

                    angular.forEach(mainModule.requires, addReg);
                }
            };

            angular.forEach(modulesToLoad, function (moduleName) {
                addReg(moduleName);
            });

            modulesToLoad = []; // reset for next bootstrap
            recordDeclarations.pop(); // wait for the next lazy load
        };

        /**
         * Like JSON.stringify but that doesn't throw on circular references
         * @param obj
         */
        var stringify = function stringify(obj) {
            try {
                return JSON.stringify(obj);
            } catch (e) {
                var cache = [];
                return JSON.stringify(obj, function (key, value) {
                    if (angular.isObject(value) && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        // Store value in our collection
                        cache.push(value);
                    }
                    return value;
                });
            }
        };

        var hashCode = function hashCode(str) {
            var hash = 0,
                i,
                chr,
                len;
            if (str.length == 0) {
                return hash;
            }
            for (i = 0, len = str.length; i < len; i++) {
                chr = str.charCodeAt(i);
                hash = (hash << 5) - hash + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        };

        function _register(providers, registerModules, params) {
            if (registerModules) {
                var k,
                    moduleName,
                    moduleFn,
                    tempRunBlocks = [];
                for (k = registerModules.length - 1; k >= 0; k--) {
                    moduleName = registerModules[k];
                    if (!angular.isString(moduleName)) {
                        moduleName = getModuleName(moduleName);
                    }
                    if (!moduleName || justLoaded.indexOf(moduleName) !== -1 || modules[moduleName] && realModules.indexOf(moduleName) === -1) {
                        continue;
                    }
                    // new if not registered
                    var newModule = regModules.indexOf(moduleName) === -1;
                    moduleFn = ngModuleFct(moduleName);
                    if (newModule) {
                        regModules.push(moduleName);
                        _register(providers, moduleFn.requires, params);
                    }
                    if (moduleFn._runBlocks.length > 0) {
                        // new run blocks detected! Replace the old ones (if existing)
                        runBlocks[moduleName] = [];
                        while (moduleFn._runBlocks.length > 0) {
                            runBlocks[moduleName].push(moduleFn._runBlocks.shift());
                        }
                    }
                    if (angular.isDefined(runBlocks[moduleName]) && (newModule || params.rerun)) {
                        tempRunBlocks = tempRunBlocks.concat(runBlocks[moduleName]);
                    }
                    _invokeQueue(providers, moduleFn._invokeQueue, moduleName, params.reconfig);
                    _invokeQueue(providers, moduleFn._configBlocks, moduleName, params.reconfig); // angular 1.3+
                    broadcast(newModule ? 'ocLazyLoad.moduleLoaded' : 'ocLazyLoad.moduleReloaded', moduleName);
                    registerModules.pop();
                    justLoaded.push(moduleName);
                }
                // execute the run blocks at the end
                var instanceInjector = providers.getInstanceInjector();
                angular.forEach(tempRunBlocks, function (fn) {
                    instanceInjector.invoke(fn);
                });
            }
        }

        function _registerInvokeList(args, moduleName) {
            var invokeList = args[2][0],
                type = args[1],
                newInvoke = false;
            if (angular.isUndefined(regInvokes[moduleName])) {
                regInvokes[moduleName] = {};
            }
            if (angular.isUndefined(regInvokes[moduleName][type])) {
                regInvokes[moduleName][type] = {};
            }
            var onInvoke = function onInvoke(invokeName, invoke) {
                if (!regInvokes[moduleName][type].hasOwnProperty(invokeName)) {
                    regInvokes[moduleName][type][invokeName] = [];
                }
                if (checkHashes(invoke, regInvokes[moduleName][type][invokeName])) {
                    newInvoke = true;
                    regInvokes[moduleName][type][invokeName].push(invoke);
                    broadcast('ocLazyLoad.componentLoaded', [moduleName, type, invokeName]);
                }
            };

            function checkHashes(potentialNew, invokes) {
                var isNew = true,
                    newHash;
                if (invokes.length) {
                    newHash = signature(potentialNew);
                    angular.forEach(invokes, function (invoke) {
                        isNew = isNew && signature(invoke) !== newHash;
                    });
                }
                return isNew;
            }

            function signature(data) {
                if (angular.isArray(data)) {
                    // arrays are objects, we need to test for it first
                    return hashCode(data.toString());
                } else if (angular.isObject(data)) {
                    // constants & values for example
                    return hashCode(stringify(data));
                } else {
                    if (angular.isDefined(data) && data !== null) {
                        return hashCode(data.toString());
                    } else {
                        // null & undefined constants
                        return data;
                    }
                }
            }

            if (angular.isString(invokeList)) {
                onInvoke(invokeList, args[2][1]);
            } else if (angular.isObject(invokeList)) {
                angular.forEach(invokeList, function (invoke, key) {
                    if (angular.isString(invoke)) {
                        // decorators for example
                        onInvoke(invoke, invokeList[1]);
                    } else {
                        // components registered as object lists {"componentName": function() {}}
                        onInvoke(key, invoke);
                    }
                });
            } else {
                return false;
            }
            return newInvoke;
        }

        function _invokeQueue(providers, queue, moduleName, reconfig) {
            if (!queue) {
                return;
            }

            var i, len, args, provider;
            for (i = 0, len = queue.length; i < len; i++) {
                args = queue[i];
                if (angular.isArray(args)) {
                    if (providers !== null) {
                        if (providers.hasOwnProperty(args[0])) {
                            provider = providers[args[0]];
                        } else {
                            throw new Error('unsupported provider ' + args[0]);
                        }
                    }
                    var isNew = _registerInvokeList(args, moduleName);
                    if (args[1] !== 'invoke') {
                        if (isNew && angular.isDefined(provider)) {
                            provider[args[1]].apply(provider, args[2]);
                        }
                    } else {
                        // config block
                        var callInvoke = function callInvoke(fct) {
                            var invoked = regConfigs.indexOf(moduleName + '-' + fct);
                            if (invoked === -1 || reconfig) {
                                if (invoked === -1) {
                                    regConfigs.push(moduleName + '-' + fct);
                                }
                                if (angular.isDefined(provider)) {
                                    provider[args[1]].apply(provider, args[2]);
                                }
                            }
                        };
                        if (angular.isFunction(args[2][0])) {
                            callInvoke(args[2][0]);
                        } else if (angular.isArray(args[2][0])) {
                            for (var j = 0, jlen = args[2][0].length; j < jlen; j++) {
                                if (angular.isFunction(args[2][0][j])) {
                                    callInvoke(args[2][0][j]);
                                }
                            }
                        }
                    }
                }
            }
        }

        function getModuleName(module) {
            var moduleName = null;
            if (angular.isString(module)) {
                moduleName = module;
            } else if (angular.isObject(module) && module.hasOwnProperty('name') && angular.isString(module.name)) {
                moduleName = module.name;
            }
            return moduleName;
        }

        function moduleExists(moduleName) {
            if (!angular.isString(moduleName)) {
                return false;
            }
            try {
                return ngModuleFct(moduleName);
            } catch (e) {
                if (/No module/.test(e) || e.message.indexOf('$injector:nomod') > -1) {
                    return false;
                }
            }
        }

        this.$get = ["$log", "$rootElement", "$rootScope", "$cacheFactory", "$q", function ($log, $rootElement, $rootScope, $cacheFactory, $q) {
            var instanceInjector,
                filesCache = $cacheFactory('ocLazyLoad');

            if (!debug) {
                $log = {};
                $log['error'] = angular.noop;
                $log['warn'] = angular.noop;
                $log['info'] = angular.noop;
            }

            // Make this lazy because when $get() is called the instance injector hasn't been assigned to the rootElement yet
            providers.getInstanceInjector = function () {
                return instanceInjector ? instanceInjector : instanceInjector = $rootElement.data('$injector') || angular.injector();
            };

            broadcast = function broadcast(eventName, params) {
                if (events) {
                    $rootScope.$broadcast(eventName, params);
                }
                if (debug) {
                    $log.info(eventName, params);
                }
            };

            function reject(e) {
                var deferred = $q.defer();
                $log.error(e.message);
                deferred.reject(e);
                return deferred.promise;
            }

            return {
                _broadcast: broadcast,

                _$log: $log,

                /**
                 * Returns the files cache used by the loaders to store the files currently loading
                 * @returns {*}
                 */
                _getFilesCache: function getFilesCache() {
                    return filesCache;
                },

                /**
                 * Let the service know that it should monitor angular.module because files are loading
                 * @param watch boolean
                 */
                toggleWatch: function toggleWatch(watch) {
                    if (watch) {
                        recordDeclarations.push(true);
                    } else {
                        recordDeclarations.pop();
                    }
                },

                /**
                 * Let you get a module config object
                 * @param moduleName String the name of the module
                 * @returns {*}
                 */
                getModuleConfig: function getModuleConfig(moduleName) {
                    if (!angular.isString(moduleName)) {
                        throw new Error('You need to give the name of the module to get');
                    }
                    if (!modules[moduleName]) {
                        return null;
                    }
                    return angular.copy(modules[moduleName]);
                },

                /**
                 * Let you define a module config object
                 * @param moduleConfig Object the module config object
                 * @returns {*}
                 */
                setModuleConfig: function setModuleConfig(moduleConfig) {
                    if (!angular.isObject(moduleConfig)) {
                        throw new Error('You need to give the module config object to set');
                    }
                    modules[moduleConfig.name] = moduleConfig;
                    return moduleConfig;
                },

                /**
                 * Returns the list of loaded modules
                 * @returns {string[]}
                 */
                getModules: function getModules() {
                    return regModules;
                },

                /**
                 * Let you check if a module has been loaded into Angular or not
                 * @param modulesNames String/Object a module name, or a list of module names
                 * @returns {boolean}
                 */
                isLoaded: function isLoaded(modulesNames) {
                    var moduleLoaded = function moduleLoaded(module) {
                        var isLoaded = regModules.indexOf(module) > -1;
                        if (!isLoaded) {
                            isLoaded = !!moduleExists(module);
                        }
                        return isLoaded;
                    };
                    if (angular.isString(modulesNames)) {
                        modulesNames = [modulesNames];
                    }
                    if (angular.isArray(modulesNames)) {
                        var i, len;
                        for (i = 0, len = modulesNames.length; i < len; i++) {
                            if (!moduleLoaded(modulesNames[i])) {
                                return false;
                            }
                        }
                        return true;
                    } else {
                        throw new Error('You need to define the module(s) name(s)');
                    }
                },

                /**
                 * Given a module, return its name
                 * @param module
                 * @returns {String}
                 */
                _getModuleName: getModuleName,

                /**
                 * Returns a module if it exists
                 * @param moduleName
                 * @returns {module}
                 */
                _getModule: function getModule(moduleName) {
                    try {
                        return ngModuleFct(moduleName);
                    } catch (e) {
                        // this error message really suxx
                        if (/No module/.test(e) || e.message.indexOf('$injector:nomod') > -1) {
                            e.message = 'The module "' + stringify(moduleName) + '" that you are trying to load does not exist. ' + e.message;
                        }
                        throw e;
                    }
                },

                /**
                 * Check if a module exists and returns it if it does
                 * @param moduleName
                 * @returns {boolean}
                 */
                moduleExists: moduleExists,

                /**
                 * Load the dependencies, and might try to load new files depending on the config
                 * @param moduleName (String or Array of Strings)
                 * @param localParams
                 * @returns {*}
                 * @private
                 */
                _loadDependencies: function _loadDependencies(moduleName, localParams) {
                    var loadedModule,
                        requires,
                        diff,
                        promisesList = [],
                        self = this;

                    moduleName = self._getModuleName(moduleName);

                    if (moduleName === null) {
                        return $q.when();
                    } else {
                        try {
                            loadedModule = self._getModule(moduleName);
                        } catch (e) {
                            return reject(e);
                        }
                        // get unloaded requires
                        requires = self.getRequires(loadedModule);
                    }

                    angular.forEach(requires, function (requireEntry) {
                        // If no configuration is provided, try and find one from a previous load.
                        // If there isn't one, bail and let the normal flow run
                        if (angular.isString(requireEntry)) {
                            var config = self.getModuleConfig(requireEntry);
                            if (config === null) {
                                moduleCache.push(requireEntry); // We don't know about this module, but something else might, so push it anyway.
                                return;
                            }
                            requireEntry = config;
                            // ignore the name because it's probably not a real module name
                            config.name = undefined;
                        }

                        // Check if this dependency has been loaded previously
                        if (self.moduleExists(requireEntry.name)) {
                            // compare against the already loaded module to see if the new definition adds any new files
                            diff = requireEntry.files.filter(function (n) {
                                return self.getModuleConfig(requireEntry.name).files.indexOf(n) < 0;
                            });

                            // If the module was redefined, advise via the console
                            if (diff.length !== 0) {
                                self._$log.warn('Module "', moduleName, '" attempted to redefine configuration for dependency. "', requireEntry.name, '"\n Additional Files Loaded:', diff);
                            }

                            // Push everything to the file loader, it will weed out the duplicates.
                            if (angular.isDefined(self.filesLoader)) {
                                // if a files loader is defined
                                promisesList.push(self.filesLoader(requireEntry, localParams).then(function () {
                                    return self._loadDependencies(requireEntry);
                                }));
                            } else {
                                return reject(new Error('Error: New dependencies need to be loaded from external files (' + requireEntry.files + '), but no loader has been defined.'));
                            }
                            return;
                        } else if (angular.isArray(requireEntry)) {
                            var files = [];
                            angular.forEach(requireEntry, function (entry) {
                                // let's check if the entry is a file name or a config name
                                var config = self.getModuleConfig(entry);
                                if (config === null) {
                                    files.push(entry);
                                } else if (config.files) {
                                    files = files.concat(config.files);
                                }
                            });
                            if (files.length > 0) {
                                requireEntry = {
                                    files: files
                                };
                            }
                        } else if (angular.isObject(requireEntry)) {
                            if (requireEntry.hasOwnProperty('name') && requireEntry['name']) {
                                // The dependency doesn't exist in the module cache and is a new configuration, so store and push it.
                                self.setModuleConfig(requireEntry);
                                moduleCache.push(requireEntry['name']);
                            }
                        }

                        // Check if the dependency has any files that need to be loaded. If there are, push a new promise to the promise list.
                        if (angular.isDefined(requireEntry.files) && requireEntry.files.length !== 0) {
                            if (angular.isDefined(self.filesLoader)) {
                                // if a files loader is defined
                                promisesList.push(self.filesLoader(requireEntry, localParams).then(function () {
                                    return self._loadDependencies(requireEntry);
                                }));
                            } else {
                                return reject(new Error('Error: the module "' + requireEntry.name + '" is defined in external files (' + requireEntry.files + '), but no loader has been defined.'));
                            }
                        }
                    });

                    // Create a wrapper promise to watch the promise list and resolve it once everything is done.
                    return $q.all(promisesList);
                },

                /**
                 * Inject new modules into Angular
                 * @param moduleName
                 * @param localParams
                 * @param real
                 */
                inject: function inject(moduleName) {
                    var localParams = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
                    var real = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

                    var self = this,
                        deferred = $q.defer();
                    if (angular.isDefined(moduleName) && moduleName !== null) {
                        if (angular.isArray(moduleName)) {
                            var promisesList = [];
                            angular.forEach(moduleName, function (module) {
                                promisesList.push(self.inject(module, localParams, real));
                            });
                            return $q.all(promisesList);
                        } else {
                            self._addToLoadList(self._getModuleName(moduleName), true, real);
                        }
                    }
                    if (modulesToLoad.length > 0) {
                        var res = modulesToLoad.slice(); // clean copy
                        var loadNext = function loadNext(moduleName) {
                            moduleCache.push(moduleName);
                            modulePromises[moduleName] = deferred.promise;
                            self._loadDependencies(moduleName, localParams).then(function success() {
                                try {
                                    justLoaded = [];
                                    _register(providers, moduleCache, localParams);
                                } catch (e) {
                                    self._$log.error(e.message);
                                    deferred.reject(e);
                                    return;
                                }

                                if (modulesToLoad.length > 0) {
                                    loadNext(modulesToLoad.shift()); // load the next in list
                                } else {
                                        deferred.resolve(res); // everything has been loaded, resolve
                                    }
                            }, function error(err) {
                                deferred.reject(err);
                            });
                        };

                        // load the first in list
                        loadNext(modulesToLoad.shift());
                    } else if (localParams && localParams.name && modulePromises[localParams.name]) {
                        return modulePromises[localParams.name];
                    } else {
                        deferred.resolve();
                    }
                    return deferred.promise;
                },

                /**
                 * Get the list of required modules/services/... for this module
                 * @param module
                 * @returns {Array}
                 */
                getRequires: function getRequires(module) {
                    var requires = [];
                    angular.forEach(module.requires, function (requireModule) {
                        if (regModules.indexOf(requireModule) === -1) {
                            requires.push(requireModule);
                        }
                    });
                    return requires;
                },

                /**
                 * Invoke the new modules & component by their providers
                 * @param providers
                 * @param queue
                 * @param moduleName
                 * @param reconfig
                 * @private
                 */
                _invokeQueue: _invokeQueue,

                /**
                 * Check if a module has been invoked and registers it if not
                 * @param args
                 * @param moduleName
                 * @returns {boolean} is new
                 */
                _registerInvokeList: _registerInvokeList,

                /**
                 * Register a new module and loads it, executing the run/config blocks if needed
                 * @param providers
                 * @param registerModules
                 * @param params
                 * @private
                 */
                _register: _register,

                /**
                 * Add a module name to the list of modules that will be loaded in the next inject
                 * @param name
                 * @param force
                 * @private
                 */
                _addToLoadList: _addToLoadList,

                /**
                 * Unregister modules (you shouldn't have to use this)
                 * @param modules
                 */
                _unregister: function _unregister(modules) {
                    if (angular.isDefined(modules)) {
                        if (angular.isArray(modules)) {
                            angular.forEach(modules, function (module) {
                                regInvokes[module] = undefined;
                            });
                        }
                    }
                }
            };
        }];

        // Let's get the list of loaded modules & components
        this._init(angular.element(window.document));
    }]);

    var bootstrapFct = angular.bootstrap;
    angular.bootstrap = function (element, modules, config) {
        // Clean state from previous bootstrap
        regModules = ['ng', 'oc.lazyLoad'];
        regInvokes = {};
        regConfigs = [];
        modulesToLoad = [];
        realModules = [];
        recordDeclarations = [];
        broadcast = angular.noop;
        runBlocks = {};
        justLoaded = [];
        // we use slice to make a clean copy
        angular.forEach(modules.slice(), function (module) {
            _addToLoadList(module, true, true);
        });
        return bootstrapFct(element, modules, config);
    };

    var _addToLoadList = function _addToLoadList(name, force, real) {
        if ((recordDeclarations.length > 0 || force) && angular.isString(name) && modulesToLoad.indexOf(name) === -1) {
            modulesToLoad.push(name);
            if (real) {
                realModules.push(name);
            }
        }
    };

    var ngModuleFct = angular.module;
    angular.module = function (name, requires, configFn) {
        _addToLoadList(name, false, true);
        return ngModuleFct(name, requires, configFn);
    };

    // CommonJS package manager support:
    if (typeof module !== 'undefined' && typeof exports !== 'undefined' && module.exports === exports) {
        module.exports = 'oc.lazyLoad';
    }
})(angular, window);
(function (angular) {
    'use strict';

    angular.module('oc.lazyLoad').directive('ocLazyLoad', ["$ocLazyLoad", "$compile", "$animate", "$parse", "$timeout", function ($ocLazyLoad, $compile, $animate, $parse, $timeout) {
        return {
            restrict: 'A',
            terminal: true,
            priority: 1000,
            compile: function compile(element, attrs) {
                // we store the content and remove it before compilation
                var content = element[0].innerHTML;
                element.html('');

                return function ($scope, $element, $attr) {
                    var model = $parse($attr.ocLazyLoad);
                    $scope.$watch(function () {
                        return model($scope) || $attr.ocLazyLoad; // it can be a module name (string), an object, an array, or a scope reference to any of this
                    }, function (moduleName) {
                        if (angular.isDefined(moduleName)) {
                            $ocLazyLoad.load(moduleName).then(function () {
                                // Attach element contents to DOM and then compile them.
                                // This prevents an issue where IE invalidates saved element objects (HTMLCollections)
                                // of the compiled contents when attaching to the parent DOM.
                                $animate.enter(content, $element);
                                // get the new content & compile it
                                $compile($element.contents())($scope);
                            });
                        }
                    }, true);
                };
            }
        };
    }]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('oc.lazyLoad').config(["$provide", function ($provide) {
        $provide.decorator('$ocLazyLoad', ["$delegate", "$q", "$window", "$interval", function ($delegate, $q, $window, $interval) {
            var uaCssChecked = false,
                useCssLoadPatch = false,
                anchor = $window.document.getElementsByTagName('head')[0] || $window.document.getElementsByTagName('body')[0];

            /**
             * Load a js/css file
             * @param type
             * @param path
             * @param params
             * @returns promise
             */
            $delegate.buildElement = function buildElement(type, path, params) {
                var deferred = $q.defer(),
                    el,
                    loaded,
                    filesCache = $delegate._getFilesCache(),
                    cacheBuster = function cacheBuster(url) {
                    var dc = new Date().getTime();
                    if (url.indexOf('?') >= 0) {
                        if (url.substring(0, url.length - 1) === '&') {
                            return url + '_dc=' + dc;
                        }
                        return url + '&_dc=' + dc;
                    } else {
                        return url + '?_dc=' + dc;
                    }
                };

                // Store the promise early so the file load can be detected by other parallel lazy loads
                // (ie: multiple routes on one page) a 'true' value isn't sufficient
                // as it causes false positive load results.
                if (angular.isUndefined(filesCache.get(path))) {
                    filesCache.put(path, deferred.promise);
                }

                // Switch in case more content types are added later
                switch (type) {
                    case 'css':
                        el = $window.document.createElement('link');
                        el.type = 'text/css';
                        el.rel = 'stylesheet';
                        el.href = params.cache === false ? cacheBuster(path) : path;
                        break;
                    case 'js':
                        el = $window.document.createElement('script');
                        el.src = params.cache === false ? cacheBuster(path) : path;
                        break;
                    default:
                        filesCache.remove(path);
                        deferred.reject(new Error('Requested type "' + type + '" is not known. Could not inject "' + path + '"'));
                        break;
                }
                el.onload = el['onreadystatechange'] = function (e) {
                    if (el['readyState'] && !/^c|loade/.test(el['readyState']) || loaded) return;
                    el.onload = el['onreadystatechange'] = null;
                    loaded = 1;
                    $delegate._broadcast('ocLazyLoad.fileLoaded', path);
                    deferred.resolve(el);
                };
                el.onerror = function () {
                    filesCache.remove(path);
                    deferred.reject(new Error('Unable to load ' + path));
                };
                el.async = params.serie ? 0 : 1;

                var insertBeforeElem = anchor.lastChild;
                if (params.insertBefore) {
                    var element = angular.element(angular.isDefined(window.jQuery) ? params.insertBefore : document.querySelector(params.insertBefore));
                    if (element && element.length > 0) {
                        insertBeforeElem = element[0];
                    }
                }
                insertBeforeElem.parentNode.insertBefore(el, insertBeforeElem);

                /*
                 The event load or readystatechange doesn't fire in:
                 - PhantomJS 1.9 (headless webkit browser)
                 - iOS < 6       (default mobile browser)
                 - Android < 4.4 (default mobile browser)
                 - Safari < 6    (desktop browser)
                 */
                if (type == 'css') {
                    if (!uaCssChecked) {
                        var ua = $window.navigator.userAgent.toLowerCase();

                        if (ua.indexOf('phantomjs/1.9') > -1) {
                            // PhantomJS ~1.9
                            useCssLoadPatch = true;
                        } else if (/iP(hone|od|ad)/.test($window.navigator.platform)) {
                            // iOS < 6
                            var v = $window.navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
                            var iOSVersion = parseFloat([parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)].join('.'));
                            useCssLoadPatch = iOSVersion < 6;
                        } else if (ua.indexOf('android') > -1) {
                            // Android < 4.4
                            var androidVersion = parseFloat(ua.slice(ua.indexOf('android') + 8));
                            useCssLoadPatch = androidVersion < 4.4;
                        } else if (ua.indexOf('safari') > -1) {
                            // Safari < 6
                            var versionMatch = ua.match(/version\/([\.\d]+)/i);
                            useCssLoadPatch = versionMatch && versionMatch[1] && parseFloat(versionMatch[1]) < 6;
                        }
                    }

                    if (useCssLoadPatch) {
                        var tries = 1000; // * 20 = 20000 miliseconds
                        var interval = $interval(function () {
                            try {
                                el.sheet.cssRules;
                                $interval.cancel(interval);
                                el.onload();
                            } catch (e) {
                                if (--tries <= 0) {
                                    el.onerror();
                                }
                            }
                        }, 20);
                    }
                }

                return deferred.promise;
            };

            return $delegate;
        }]);
    }]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('oc.lazyLoad').config(["$provide", function ($provide) {
        $provide.decorator('$ocLazyLoad', ["$delegate", "$q", function ($delegate, $q) {
            /**
             * The function that loads new files
             * @param config
             * @param params
             * @returns {*}
             */
            $delegate.filesLoader = function filesLoader(config) {
                var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

                var cssFiles = [],
                    templatesFiles = [],
                    jsFiles = [],
                    promises = [],
                    cachePromise = null,
                    filesCache = $delegate._getFilesCache();

                $delegate.toggleWatch(true); // start watching angular.module calls

                angular.extend(params, config);

                var pushFile = function pushFile(path) {
                    var file_type = null,
                        m;
                    if (angular.isObject(path)) {
                        file_type = path.type;
                        path = path.path;
                    }
                    cachePromise = filesCache.get(path);
                    if (angular.isUndefined(cachePromise) || params.cache === false) {

                        // always check for requirejs syntax just in case
                        if ((m = /^(css|less|html|htm|js)?(?=!)/.exec(path)) !== null) {
                            // Detect file type using preceding type declaration (ala requireJS)
                            file_type = m[1];
                            path = path.substr(m[1].length + 1, path.length); // Strip the type from the path
                        }

                        if (!file_type) {
                            if ((m = /[.](css|less|html|htm|js)?((\?|#).*)?$/.exec(path)) !== null) {
                                // Detect file type via file extension
                                file_type = m[1];
                            } else if (!$delegate.jsLoader.hasOwnProperty('ocLazyLoadLoader') && $delegate.jsLoader.hasOwnProperty('requirejs')) {
                                // requirejs
                                file_type = 'js';
                            } else {
                                $delegate._$log.error('File type could not be determined. ' + path);
                                return;
                            }
                        }

                        if ((file_type === 'css' || file_type === 'less') && cssFiles.indexOf(path) === -1) {
                            cssFiles.push(path);
                        } else if ((file_type === 'html' || file_type === 'htm') && templatesFiles.indexOf(path) === -1) {
                            templatesFiles.push(path);
                        } else if (file_type === 'js' || jsFiles.indexOf(path) === -1) {
                            jsFiles.push(path);
                        } else {
                            $delegate._$log.error('File type is not valid. ' + path);
                        }
                    } else if (cachePromise) {
                        promises.push(cachePromise);
                    }
                };

                if (params.serie) {
                    pushFile(params.files.shift());
                } else {
                    angular.forEach(params.files, function (path) {
                        pushFile(path);
                    });
                }

                if (cssFiles.length > 0) {
                    var cssDeferred = $q.defer();
                    $delegate.cssLoader(cssFiles, function (err) {
                        if (angular.isDefined(err) && $delegate.cssLoader.hasOwnProperty('ocLazyLoadLoader')) {
                            $delegate._$log.error(err);
                            cssDeferred.reject(err);
                        } else {
                            cssDeferred.resolve();
                        }
                    }, params);
                    promises.push(cssDeferred.promise);
                }

                if (templatesFiles.length > 0) {
                    var templatesDeferred = $q.defer();
                    $delegate.templatesLoader(templatesFiles, function (err) {
                        if (angular.isDefined(err) && $delegate.templatesLoader.hasOwnProperty('ocLazyLoadLoader')) {
                            $delegate._$log.error(err);
                            templatesDeferred.reject(err);
                        } else {
                            templatesDeferred.resolve();
                        }
                    }, params);
                    promises.push(templatesDeferred.promise);
                }

                if (jsFiles.length > 0) {
                    var jsDeferred = $q.defer();
                    $delegate.jsLoader(jsFiles, function (err) {
                        if (angular.isDefined(err) && ($delegate.jsLoader.hasOwnProperty("ocLazyLoadLoader") || $delegate.jsLoader.hasOwnProperty("requirejs"))) {
                            $delegate._$log.error(err);
                            jsDeferred.reject(err);
                        } else {
                            jsDeferred.resolve();
                        }
                    }, params);
                    promises.push(jsDeferred.promise);
                }

                if (promises.length === 0) {
                    var deferred = $q.defer(),
                        err = "Error: no file to load has been found, if you're trying to load an existing module you should use the 'inject' method instead of 'load'.";
                    $delegate._$log.error(err);
                    deferred.reject(err);
                    return deferred.promise;
                } else if (params.serie && params.files.length > 0) {
                    return $q.all(promises).then(function () {
                        return $delegate.filesLoader(config, params);
                    });
                } else {
                    return $q.all(promises)['finally'](function (res) {
                        $delegate.toggleWatch(false); // stop watching angular.module calls
                        return res;
                    });
                }
            };

            /**
             * Load a module or a list of modules into Angular
             * @param module Mixed the name of a predefined module config object, or a module config object, or an array of either
             * @param params Object optional parameters
             * @returns promise
             */
            $delegate.load = function (originalModule) {
                var originalParams = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

                var self = this,
                    config = null,
                    deferredList = [],
                    deferred = $q.defer(),
                    errText;

                // clean copy
                var module = angular.copy(originalModule);
                var params = angular.copy(originalParams);

                // If module is an array, break it down
                if (angular.isArray(module)) {
                    // Resubmit each entry as a single module
                    angular.forEach(module, function (m) {
                        deferredList.push(self.load(m, params));
                    });

                    // Resolve the promise once everything has loaded
                    $q.all(deferredList).then(function (res) {
                        deferred.resolve(res);
                    }, function (err) {
                        deferred.reject(err);
                    });

                    return deferred.promise;
                }

                // Get or Set a configuration depending on what was passed in
                if (angular.isString(module)) {
                    config = self.getModuleConfig(module);
                    if (!config) {
                        config = {
                            files: [module]
                        };
                    }
                } else if (angular.isObject(module)) {
                    // case {type: 'js', path: lazyLoadUrl + 'testModule.fakejs'}
                    if (angular.isDefined(module.path) && angular.isDefined(module.type)) {
                        config = {
                            files: [module]
                        };
                    } else {
                        config = self.setModuleConfig(module);
                    }
                }

                if (config === null) {
                    var moduleName = self._getModuleName(module);
                    errText = 'Module "' + (moduleName || 'unknown') + '" is not configured, cannot load.';
                    $delegate._$log.error(errText);
                    deferred.reject(new Error(errText));
                    return deferred.promise;
                } else {
                    // deprecated
                    if (angular.isDefined(config.template)) {
                        if (angular.isUndefined(config.files)) {
                            config.files = [];
                        }
                        if (angular.isString(config.template)) {
                            config.files.push(config.template);
                        } else if (angular.isArray(config.template)) {
                            config.files.concat(config.template);
                        }
                    }
                }

                var localParams = angular.extend({}, params, config);

                // if someone used an external loader and called the load function with just the module name
                if (angular.isUndefined(config.files) && angular.isDefined(config.name) && $delegate.moduleExists(config.name)) {
                    return $delegate.inject(config.name, localParams, true);
                }

                $delegate.filesLoader(config, localParams).then(function () {
                    $delegate.inject(null, localParams).then(function (res) {
                        deferred.resolve(res);
                    }, function (err) {
                        deferred.reject(err);
                    });
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            // return the patched service
            return $delegate;
        }]);
    }]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('oc.lazyLoad').config(["$provide", function ($provide) {
        $provide.decorator('$ocLazyLoad', ["$delegate", "$q", function ($delegate, $q) {
            /**
             * cssLoader function
             * @type Function
             * @param paths array list of css files to load
             * @param callback to call when everything is loaded. We use a callback and not a promise
             * @param params object config parameters
             * because the user can overwrite cssLoader and it will probably not use promises :(
             */
            $delegate.cssLoader = function (paths, callback, params) {
                var promises = [];
                angular.forEach(paths, function (path) {
                    promises.push($delegate.buildElement('css', path, params));
                });
                $q.all(promises).then(function () {
                    callback();
                }, function (err) {
                    callback(err);
                });
            };
            $delegate.cssLoader.ocLazyLoadLoader = true;

            return $delegate;
        }]);
    }]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('oc.lazyLoad').config(["$provide", function ($provide) {
        $provide.decorator('$ocLazyLoad', ["$delegate", "$q", function ($delegate, $q) {
            /**
             * jsLoader function
             * @type Function
             * @param paths array list of js files to load
             * @param callback to call when everything is loaded. We use a callback and not a promise
             * @param params object config parameters
             * because the user can overwrite jsLoader and it will probably not use promises :(
             */
            $delegate.jsLoader = function (paths, callback, params) {
                var promises = [];
                angular.forEach(paths, function (path) {
                    promises.push($delegate.buildElement('js', path, params));
                });
                $q.all(promises).then(function () {
                    callback();
                }, function (err) {
                    callback(err);
                });
            };
            $delegate.jsLoader.ocLazyLoadLoader = true;

            return $delegate;
        }]);
    }]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('oc.lazyLoad').config(["$provide", function ($provide) {
        $provide.decorator('$ocLazyLoad', ["$delegate", "$templateCache", "$q", "$http", function ($delegate, $templateCache, $q, $http) {
            /**
             * templatesLoader function
             * @type Function
             * @param paths array list of css files to load
             * @param callback to call when everything is loaded. We use a callback and not a promise
             * @param params object config parameters for $http
             * because the user can overwrite templatesLoader and it will probably not use promises :(
             */
            $delegate.templatesLoader = function (paths, callback, params) {
                var promises = [],
                    filesCache = $delegate._getFilesCache();

                angular.forEach(paths, function (url) {
                    var deferred = $q.defer();
                    promises.push(deferred.promise);
                    $http.get(url, params).then(function (response) {
                        var data = response.data;
                        if (angular.isString(data) && data.length > 0) {
                            angular.forEach(angular.element(data), function (node) {
                                if (node.nodeName === 'SCRIPT' && node.type === 'text/ng-template') {
                                    $templateCache.put(node.id, node.innerHTML);
                                }
                            });
                        }
                        if (angular.isUndefined(filesCache.get(url))) {
                            filesCache.put(url, true);
                        }
                        deferred.resolve();
                    })['catch'](function (response) {
                        deferred.reject(new Error('Unable to load template file "' + url + '": ' + response.data));
                    });
                });
                return $q.all(promises).then(function () {
                    callback();
                }, function (err) {
                    callback(err);
                });
            };
            $delegate.templatesLoader.ocLazyLoadLoader = true;

            return $delegate;
        }]);
    }]);
})(angular);
// Array.indexOf polyfill for IE8
if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {
                var k;

                // 1. Let O be the result of calling ToObject passing
                //    the this value as the argument.
                if (this == null) {
                        throw new TypeError('"this" is null or not defined');
                }

                var O = Object(this);

                // 2. Let lenValue be the result of calling the Get
                //    internal method of O with the argument "length".
                // 3. Let len be ToUint32(lenValue).
                var len = O.length >>> 0;

                // 4. If len is 0, return -1.
                if (len === 0) {
                        return -1;
                }

                // 5. If argument fromIndex was passed let n be
                //    ToInteger(fromIndex); else let n be 0.
                var n = +fromIndex || 0;

                if (Math.abs(n) === Infinity) {
                        n = 0;
                }

                // 6. If n >= len, return -1.
                if (n >= len) {
                        return -1;
                }

                // 7. If n >= 0, then Let k be n.
                // 8. Else, n<0, Let k be len - abs(n).
                //    If k is less than 0, then let k be 0.
                k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

                // 9. Repeat, while k < len
                while (k < len) {
                        // a. Let Pk be ToString(k).
                        //   This is implicit for LHS operands of the in operator
                        // b. Let kPresent be the result of calling the
                        //    HasProperty internal method of O with argument Pk.
                        //   This step can be combined with c
                        // c. If kPresent is true, then
                        //    i.  Let elementK be the result of calling the Get
                        //        internal method of O with the argument ToString(k).
                        //   ii.  Let same be the result of applying the
                        //        Strict Equality Comparison Algorithm to
                        //        searchElement and elementK.
                        //  iii.  If same is true, return k.
                        if (k in O && O[k] === searchElement) {
                                return k;
                        }
                        k++;
                }
                return -1;
        };
}
(function() {
    "use strict";

    var app = angular.module('angularCountryState', ['ngMaterial','ngMessages']);

}());
(function() {
    "use strict";

    var template = '<div layout="column">'
    template += '<md-input-container flex="50">'
    template += '<label>{{countryLabel}}</label>';
    template += '<md-select name="country" ng-change="selectCountry()" ng-model="country" ng-required="true" >';
    template +='<md-option ng-repeat="theCountry in countries track by $index" value="{{theCountry}}" >{{theCountry}}</md-option>';
    template +='<div class="errors" ng-messages="registerForm.country.$error">';
    template +='<div ng-message="required">Required</div>';
    template +='</div>';
    template +='</md-select>';
    template +='</md-input-container>';
    template +='<md-input-container flex="50">';
    template +='<label ng-show="states">{{stateLabel}}</label>';
    template +='<md-select name="state" ng-model="countryState" ng-disabled="!states" ng-required="true" >';
    template +='<md-option ng-repeat="optStates in states track by $index" value="{{optStates}}" >{{optStates}}</md-option>';
    template +='<div class="errors" ng-messages="registerForm.state.$error">';
    template +='<div ng-message="required">Required</div>';
    template +='</div>';
    template +='</md-select>';
    template +='</md-input-container>';
    template +='</div>';

    angular
        .module("angularCountryState")
        .directive("countryStateSelect", [ function () {
            return {
                restrict: "E",
                template: template,
                scope: { country: "=?", countryState: "=?state" , defaultCountry:"=?"},
                link: function (scope, element, attrs) {
                    scope.countryLabel = "Country : ";
                    scope.stateLabel = "State : ";
                    scope.countrySelectLabel = "Select : ";

                    if(typeof attrs.countryLabel != 'undefined'){
                        scope.countryLabel = attrs.countryLabel;
                    }

                    if(typeof attrs.stateLabel != 'undefined'){
                        scope.stateLabel = attrs.stateLabel;
                    }

                    if(typeof attrs.countrySelectLabel != 'undefined'){
                        scope.countrySelectLabel = attrs.countrySelectLabel;
                    }


                    scope.countries = new Array(scope.countrySelectLabel,"Afghanistan", "Albania", "Algeria", "American Samoa", "Angola", "Anguilla", "Antartica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Ashmore and Cartier Island", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burma", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Clipperton Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Cook Islands", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czeck Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Europa Island", "Falkland Islands (Islas Malvinas)", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern and Antarctic Lands", "Gabon", "Gambia, The", "Gaza Strip", "Georgia", "Germany", "Ghana", "Gibraltar", "Glorioso Islands", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and McDonald Islands", "Holy See (Vatican City)", "Honduras", "Hong Kong", "Howland Island", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Ireland, Northern", "Israel", "Italy", "Jamaica", "Jan Mayen", "Japan", "Jarvis Island", "Jersey", "Johnston Atoll", "Jordan", "Juan de Nova Island", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Macedonia, Former Yugoslav Republic of", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Man, Isle of", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia, Federated States of", "Midway Islands", "Moldova", "Monaco", "Mongolia", "Montserrat", "Morocco", "Mozambique", "Namibia", "Nauru", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcaim Islands", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romainia", "Russia", "Rwanda", "Saint Helena", "Saint Kitts and Nevis", "Saint Lucia", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Scotland", "Senegal", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia and South Sandwich Islands", "Spain", "Spratly Islands", "Sri Lanka", "Sudan", "Suriname", "Svalbard", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Tobago", "Toga", "Tokelau", "Tonga", "Trinidad", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay", "USA", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Virgin Islands", "Wales", "Wallis and Futuna", "West Bank", "Western Sahara", "Yemen", "Yugoslavia", "Zambia", "Zimbabwe");

                    scope.state = new Array();
                    scope.state[0]="";
                    scope.state[1]="Badakhshan|Badghis|Baghlan|Balkh|Bamian|Farah|Faryab|Ghazni|Ghowr|Helmand|Herat|Jowzjan|Kabol|Kandahar|Kapisa|Konar|Kondoz|Laghman|Lowgar|Nangarhar|Nimruz|Oruzgan|Paktia|Paktika|Parvan|Samangan|Sar-e Pol|Takhar|Vardak|Zabol";
                    scope.state[2]="Berat|Bulqize|Delvine|Devoll (Bilisht)|Diber (Peshkopi)|Durres|Elbasan|Fier|Gjirokaster|Gramsh|Has (Krume)|Kavaje|Kolonje (Erseke)|Korce|Kruje|Kucove|Kukes|Kurbin|Lezhe|Librazhd|Lushnje|Malesi e Madhe (Koplik)|Mallakaster (Ballsh)|Mat (Burrel)|Mirdite (Rreshen)|Peqin|Permet|Pogradec|Puke|Sarande|Shkoder|Skrapar (Corovode)|Tepelene|Tirane (Tirana)|Tirane (Tirana)|Tropoje (Bajram Curri)|Vlore";
                    scope.state[3]="Adrar|Ain Defla|Ain Temouchent|Alger|Annaba|Batna|Bechar|Bejaia|Biskra|Blida|Bordj Bou Arreridj|Bouira|Boumerdes|Chlef|Constantine|Djelfa|El Bayadh|El Oued|El Tarf|Ghardaia|Guelma|Illizi|Jijel|Khenchela|Laghouat|M'Sila|Mascara|Medea|Mila|Mostaganem|Naama|Oran|Ouargla|Oum el Bouaghi|Relizane|Saida|Setif|Sidi Bel Abbes|Skikda|Souk Ahras|Tamanghasset|Tebessa|Tiaret|Tindouf|Tipaza|Tissemsilt|Tizi Ouzou|Tlemcen";
                    scope.state[4]="Eastern|Manu'a|Rose Island|Swains Island|Western";
                    scope.state[5]="Andorra la Vella|Bengo|Benguela|Bie|Cabinda|Canillo|Cuando Cubango|Cuanza Norte|Cuanza Sul|Cunene|Encamp|Escaldes-Engordany|Huambo|Huila|La Massana|Luanda|Lunda Norte|Lunda Sul|Malanje|Moxico|Namibe|Ordino|Sant Julia de Loria|Uige|Zaire";
                    scope.state[6]="Anguilla";
                    scope.state[7]="Antartica";
                    scope.state[8]="Barbuda|Redonda|Saint George|Saint John|Saint Mary|Saint Paul|Saint Peter|Saint Philip";
                    scope.state[9]="Antartica e Islas del Atlantico Sur|Buenos Aires|Buenos Aires Capital Federal|Catamarca|Chaco|Chubut|Cordoba|Corrientes|Entre Rios|Formosa|Jujuy|La Pampa|La Rioja|Mendoza|Misiones|Neuquen|Rio Negro|Salta|San Juan|San Luis|Santa Cruz|Santa Fe|Santiago del Estero|Tierra del Fuego|Tucuman";
                    scope.state[10]="Aragatsotn|Ararat|Armavir|Geghark'unik'|Kotayk'|Lorri|Shirak|Syunik'|Tavush|Vayots' Dzor|Yerevan";
                    scope.state[11]="Aruba";
                    scope.state[12]="Ashmore and Cartier Island";
                    scope.state[13]="Australian Capital Territory|New South Wales|Northern Territory|Queensland|South Australia|Tasmania|Victoria|Western Australia";
                    scope.state[14]="Burgenland|Kaernten|Niederoesterreich|Oberoesterreich|Salzburg|Steiermark|Tirol|Vorarlberg|Wien";
                    scope.state[15]="Abseron Rayonu|Agcabadi Rayonu|Agdam Rayonu|Agdas Rayonu|Agstafa Rayonu|Agsu Rayonu|Ali Bayramli Sahari|Astara Rayonu|Baki Sahari|Balakan Rayonu|Barda Rayonu|Beylaqan Rayonu|Bilasuvar Rayonu|Cabrayil Rayonu|Calilabad Rayonu|Daskasan Rayonu|Davaci Rayonu|Fuzuli Rayonu|Gadabay Rayonu|Ganca Sahari|Goranboy Rayonu|Goycay Rayonu|Haciqabul Rayonu|Imisli Rayonu|Ismayilli Rayonu|Kalbacar Rayonu|Kurdamir Rayonu|Lacin Rayonu|Lankaran Rayonu|Lankaran Sahari|Lerik Rayonu|Masalli Rayonu|Mingacevir Sahari|Naftalan Sahari|Naxcivan Muxtar Respublikasi|Neftcala Rayonu|Oguz Rayonu|Qabala Rayonu|Qax Rayonu|Qazax Rayonu|Qobustan Rayonu|Quba Rayonu|Qubadli Rayonu|Qusar Rayonu|Saatli Rayonu|Sabirabad Rayonu|Saki Rayonu|Saki Sahari|Salyan Rayonu|Samaxi Rayonu|Samkir Rayonu|Samux Rayonu|Siyazan Rayonu|Sumqayit Sahari|Susa Rayonu|Susa Sahari|Tartar Rayonu|Tovuz Rayonu|Ucar Rayonu|Xacmaz Rayonu|Xankandi Sahari|Xanlar Rayonu|Xizi Rayonu|Xocali Rayonu|Xocavand Rayonu|Yardimli Rayonu|Yevlax Rayonu|Yevlax Sahari|Zangilan Rayonu|Zaqatala Rayonu|Zardab Rayonu";
                    scope.state[16]="Acklins and Crooked Islands|Bimini|Cat Island|Exuma|Freeport|Fresh Creek|Governor's Harbour|Green Turtle Cay|Harbour Island|High Rock|Inagua|Kemps Bay|Long Island|Marsh Harbour|Mayaguana|New Providence|Nicholls Town and Berry Islands|Ragged Island|Rock Sound|San Salvador and Rum Cay|Sandy Point";
                    scope.state[17]="Al Hadd|Al Manamah|Al Mintaqah al Gharbiyah|Al Mintaqah al Wusta|Al Mintaqah ash Shamaliyah|Al Muharraq|Ar Rifa' wa al Mintaqah al Janubiyah|Jidd Hafs|Juzur Hawar|Madinat 'Isa|Madinat Hamad|Sitrah";
                    scope.state[18]="Barguna|Barisal|Bhola|Jhalokati|Patuakhali|Pirojpur|Bandarban|Brahmanbaria|Chandpur|Chittagong|Comilla|Cox's Bazar|Feni|Khagrachari|Lakshmipur|Noakhali|Rangamati|Dhaka|Faridpur|Gazipur|Gopalganj|Jamalpur|Kishoreganj|Madaripur|Manikganj|Munshiganj|Mymensingh|Narayanganj|Narsingdi|Netrokona|Rajbari|Shariatpur|Sherpur|Tangail|Bagerhat|Chuadanga|Jessore|Jhenaidah|Khulna|Kushtia|Magura|Meherpur|Narail|Satkhira|Bogra|Dinajpur|Gaibandha|Jaipurhat|Kurigram|Lalmonirhat|Naogaon|Natore|Nawabganj|Nilphamari|Pabna|Panchagarh|Rajshahi|Rangpur|Sirajganj|Thakurgaon|Habiganj|Maulvi bazar|Sunamganj|Sylhet";
                    scope.state[19]="Bridgetown|Christ Church|Saint Andrew|Saint George|Saint James|Saint John|Saint Joseph|Saint Lucy|Saint Michael|Saint Peter|Saint Philip|Saint Thomas";
                    scope.state[20]="Brestskaya (Brest)|Homyel'skaya (Homyel')|Horad Minsk|Hrodzyenskaya (Hrodna)|Mahilyowskaya (Mahilyow)|Minskaya|Vitsyebskaya (Vitsyebsk)";
                    scope.state[21]="Antwerpen|Brabant Wallon|Brussels Capitol Region|Hainaut|Liege|Limburg|Luxembourg|Namur|Oost-Vlaanderen|Vlaams Brabant|West-Vlaanderen";
                    scope.state[22]="Belize|Cayo|Corozal|Orange Walk|Stann Creek|Toledo";
                    scope.state[23]="Alibori|Atakora|Atlantique|Borgou|Collines|Couffo|Donga|Littoral|Mono|Oueme|Plateau|Zou";
                    scope.state[24]="Devonshire|Hamilton|Hamilton|Paget|Pembroke|Saint George|Saint Georges|Sandys|Smiths|Southampton|Warwick";
                    scope.state[25]="Bumthang|Chhukha|Chirang|Daga|Geylegphug|Ha|Lhuntshi|Mongar|Paro|Pemagatsel|Punakha|Samchi|Samdrup Jongkhar|Shemgang|Tashigang|Thimphu|Tongsa|Wangdi Phodrang";
                    scope.state[26]="Beni|Chuquisaca|Cochabamba|La Paz|Oruro|Pando|Potosi|Santa Cruz|Tarija";
                    scope.state[27]="Federation of Bosnia and Herzegovina|Republika Srpska";
                    scope.state[28]="Central|Chobe|Francistown|Gaborone|Ghanzi|Kgalagadi|Kgatleng|Kweneng|Lobatse|Ngamiland|North-East|Selebi-Pikwe|South-East|Southern";
                    scope.state[29]="Acre|Alagoas|Amapa|Amazonas|Bahia|Ceara|Distrito Federal|Espirito Santo|Goias|Maranhao|Mato Grosso|Mato Grosso do Sul|Minas Gerais|Para|Paraiba|Parana|Pernambuco|Piaui|Rio de Janeiro|Rio Grande do Norte|Rio Grande do Sul|Rondonia|Roraima|Santa Catarina|Sao Paulo|Sergipe|Tocantins";
                    scope.state[30]="Anegada|Jost Van Dyke|Tortola|Virgin Gorda";
                    scope.state[31]="Belait|Brunei and Muara|Temburong|Tutong";
                    scope.state[32]="Blagoevgrad|Burgas|Dobrich|Gabrovo|Khaskovo|Kurdzhali|Kyustendil|Lovech|Montana|Pazardzhik|Pernik|Pleven|Plovdiv|Razgrad|Ruse|Shumen|Silistra|Sliven|Smolyan|Sofiya|Sofiya-Grad|Stara Zagora|Turgovishte|Varna|Veliko Turnovo|Vidin|Vratsa|Yambol";
                    scope.state[33]="Bale|Bam|Banwa|Bazega|Bougouriba|Boulgou|Boulkiemde|Comoe|Ganzourgou|Gnagna|Gourma|Houet|Ioba|Kadiogo|Kenedougou|Komandjari|Kompienga|Kossi|Koupelogo|Kouritenga|Kourweogo|Leraba|Loroum|Mouhoun|Nahouri|Namentenga|Naumbiel|Nayala|Oubritenga|Oudalan|Passore|Poni|Samentenga|Sanguie|Seno|Sissili|Soum|Sourou|Tapoa|Tuy|Yagha|Yatenga|Ziro|Zondomo|Zoundweogo";
                    scope.state[34]="Ayeyarwady|Bago|Chin State|Kachin State|Kayah State|Kayin State|Magway|Mandalay|Mon State|Rakhine State|Sagaing|Shan State|Tanintharyi|Yangon";
                    scope.state[35]="Bubanza|Bujumbura|Bururi|Cankuzo|Cibitoke|Gitega|Karuzi|Kayanza|Kirundo|Makamba|Muramvya|Muyinga|Mwaro|Ngozi|Rutana|Ruyigi";
                    scope.state[36]="Banteay Mean Cheay|Batdambang|Kampong Cham|Kampong Chhnang|Kampong Spoe|Kampong Thum|Kampot|Kandal|Kaoh Kong|Keb|Kracheh|Mondol Kiri|Otdar Mean Cheay|Pailin|Phnum Penh|Pouthisat|Preah Seihanu (Sihanoukville)|Preah Vihear|Prey Veng|Rotanah Kiri|Siem Reab|Stoeng Treng|Svay Rieng|Takev";
                    scope.state[37]="Adamaoua|Centre|Est|Extreme-Nord|Littoral|Nord|Nord-Ouest|Ouest|Sud|Sud-Ouest";
                    scope.state[38]="Alberta|British Columbia|Manitoba|New Brunswick|Newfoundland|Northwest Territories|Nova Scotia|Nunavut|Ontario|Prince Edward Island|Quebec|Saskatchewan|Yukon Territory";
                    scope.state[39]="Boa Vista|Brava|Maio|Mosteiros|Paul|Porto Novo|Praia|Ribeira Grande|Sal|Santa Catarina|Santa Cruz|Sao Domingos|Sao Filipe|Sao Nicolau|Sao Vicente|Tarrafal";
                    scope.state[40]="Creek|Eastern|Midland|South Town|Spot Bay|Stake Bay|West End|Western";
                    scope.state[41]="Bamingui-Bangoran|Bangui|Basse-Kotto|Gribingui|Haut-Mbomou|Haute-Kotto|Haute-Sangha|Kemo-Gribingui|Lobaye|Mbomou|Nana-Mambere|Ombella-Mpoko|Ouaka|Ouham|Ouham-Pende|Sangha|Vakaga";
                    scope.state[42]="Batha|Biltine|Borkou-Ennedi-Tibesti|Chari-Baguirmi|Guera|Kanem|Lac|Logone Occidental|Logone Oriental|Mayo-Kebbi|Moyen-Chari|Ouaddai|Salamat|Tandjile";
                    scope.state[43]="Aisen del General Carlos Ibanez del Campo|Antofagasta|Araucania|Atacama|Bio-Bio|Coquimbo|Libertador General Bernardo O'Higgins|Los Lagos|Magallanes y de la Antartica Chilena|Maule|Region Metropolitana (Santiago)|Tarapaca|Valparaiso";
                    scope.state[44]="Anhui|Beijing|Chongqing|Fujian|Gansu|Guangdong|Guangxi|Guizhou|Hainan|Hebei|Heilongjiang|Henan|Hubei|Hunan|Jiangsu|Jiangxi|Jilin|Liaoning|Nei Mongol|Ningxia|Qinghai|Shaanxi|Shandong|Shanghai|Shanxi|Sichuan|Tianjin|Xinjiang|Xizang (Tibet)|Yunnan|Zhejiang";
                    scope.state[45]="Christmas Island";
                    scope.state[46]="Clipperton Island";
                    scope.state[47]="Direction Island|Home Island|Horsburgh Island|North Keeling Island|South Island|West Island";
                    scope.state[48]="Amazonas|Antioquia|Arauca|Atlantico|Bolivar|Boyaca|Caldas|Caqueta|Casanare|Cauca|Cesar|Choco|Cordoba|Cundinamarca|Distrito Capital de Santa Fe de Bogota|Guainia|Guaviare|Huila|La Guajira|Magdalena|Meta|Narino|Norte de Santander|Putumayo|Quindio|Risaralda|San Andres y Providencia|Santander|Sucre|Tolima|Valle del Cauca|Vaupes|Vichada";
                    // <!-- -->
                    scope.state[49]="Anjouan (Nzwani)|Domoni|Fomboni|Grande Comore (Njazidja)|Moheli (Mwali)|Moroni|Moutsamoudou";
                    scope.state[50]="Bandundu|Bas-Congo|Equateur|Kasai-Occidental|Kasai-Oriental|Katanga|Kinshasa|Maniema|Nord-Kivu|Orientale|Sud-Kivu";
                    scope.state[51]="Bouenza|Brazzaville|Cuvette|Kouilou|Lekoumou|Likouala|Niari|Plateaux|Pool|Sangha";
                    scope.state[52]="Aitutaki|Atiu|Avarua|Mangaia|Manihiki|Manuae|Mauke|Mitiaro|Nassau Island|Palmerston|Penrhyn|Pukapuka|Rakahanga|Rarotonga|Suwarrow|Takutea";
                    scope.state[53]="Alajuela|Cartago|Guanacaste|Heredia|Limon|Puntarenas|San Jose";
                    scope.state[54]="Abengourou|Abidjan|Aboisso|Adiake'|Adzope|Agboville|Agnibilekrou|Ale'pe'|Bangolo|Beoumi|Biankouma|Bocanda|Bondoukou|Bongouanou|Bouafle|Bouake|Bouna|Boundiali|Dabakala|Dabon|Daloa|Danane|Daoukro|Dimbokro|Divo|Duekoue|Ferkessedougou|Gagnoa|Grand Bassam|Grand-Lahou|Guiglo|Issia|Jacqueville|Katiola|Korhogo|Lakota|Man|Mankono|Mbahiakro|Odienne|Oume|Sakassou|San-Pedro|Sassandra|Seguela|Sinfra|Soubre|Tabou|Tanda|Tiassale|Tiebissou|Tingrela|Touba|Toulepleu|Toumodi|Vavoua|Yamoussoukro|Zuenoula";
                    scope.state[55]="Bjelovarsko-Bilogorska Zupanija|Brodsko-Posavska Zupanija|Dubrovacko-Neretvanska Zupanija|Istarska Zupanija|Karlovacka Zupanija|Koprivnicko-Krizevacka Zupanija|Krapinsko-Zagorska Zupanija|Licko-Senjska Zupanija|Medimurska Zupanija|Osjecko-Baranjska Zupanija|Pozesko-Slavonska Zupanija|Primorsko-Goranska Zupanija|Sibensko-Kninska Zupanija|Sisacko-Moslavacka Zupanija|Splitsko-Dalmatinska Zupanija|Varazdinska Zupanija|Viroviticko-Podravska Zupanija|Vukovarsko-Srijemska Zupanija|Zadarska Zupanija|Zagreb|Zagrebacka Zupanija";
                    scope.state[56]="Camaguey|Ciego de Avila|Cienfuegos|Ciudad de La Habana|Granma|Guantanamo|Holguin|Isla de la Juventud|La Habana|Las Tunas|Matanzas|Pinar del Rio|Sancti Spiritus|Santiago de Cuba|Villa Clara";
                    scope.state[57]="Famagusta|Kyrenia|Larnaca|Limassol|Nicosia|Paphos";
                    scope.state[58]="Brnensky|Budejovicky|Jihlavsky|Karlovarsky|Kralovehradecky|Liberecky|Olomoucky|Ostravsky|Pardubicky|Plzensky|Praha|Stredocesky|Ustecky|Zlinsky";
                    scope.state[59]="Arhus|Bornholm|Fredericksberg|Frederiksborg|Fyn|Kobenhavn|Kobenhavns|Nordjylland|Ribe|Ringkobing|Roskilde|Sonderjylland|Storstrom|Vejle|Vestsjalland|Viborg";
                    scope.state[60]="'Ali Sabih|Dikhil|Djibouti|Obock|Tadjoura";
                    scope.state[61]="Saint Andrew|Saint David|Saint George|Saint John|Saint Joseph|Saint Luke|Saint Mark|Saint Patrick|Saint Paul|Saint Peter";
                    scope.state[62]="Azua|Baoruco|Barahona|Dajabon|Distrito Nacional|Duarte|El Seibo|Elias Pina|Espaillat|Hato Mayor|Independencia|La Altagracia|La Romana|La Vega|Maria Trinidad Sanchez|Monsenor Nouel|Monte Cristi|Monte Plata|Pedernales|Peravia|Puerto Plata|Salcedo|Samana|San Cristobal|San Juan|San Pedro de Macoris|Sanchez Ramirez|Santiago|Santiago Rodriguez|Valverde";
                    // <!-- -->
                    scope.state[63]="Azuay|Bolivar|Canar|Carchi|Chimborazo|Cotopaxi|El Oro|Esmeraldas|Galapagos|Guayas|Imbabura|Loja|Los Rios|Manabi|Morona-Santiago|Napo|Orellana|Pastaza|Pichincha|Sucumbios|Tungurahua|Zamora-Chinchipe";
                    scope.state[64]="Ad Daqahliyah|Al Bahr al Ahmar|Al Buhayrah|Al Fayyum|Al Gharbiyah|Al Iskandariyah|Al Isma'iliyah|Al Jizah|Al Minufiyah|Al Minya|Al Qahirah|Al Qalyubiyah|Al Wadi al Jadid|As Suways|Ash Sharqiyah|Aswan|Asyut|Bani Suwayf|Bur Sa'id|Dumyat|Janub Sina'|Kafr ash Shaykh|Matruh|Qina|Shamal Sina'|Suhaj";
                    scope.state[65]="Ahuachapan|Cabanas|Chalatenango|Cuscatlan|La Libertad|La Paz|La Union|Morazan|San Miguel|San Salvador|San Vicente|Santa Ana|Sonsonate|Usulutan";
                    scope.state[66]="Annobon|Bioko Norte|Bioko Sur|Centro Sur|Kie-Ntem|Litoral|Wele-Nzas";
                    scope.state[67]="Akale Guzay|Barka|Denkel|Hamasen|Sahil|Semhar|Senhit|Seraye";
                    scope.state[68]="Harjumaa (Tallinn)|Hiiumaa (Kardla)|Ida-Virumaa (Johvi)|Jarvamaa (Paide)|Jogevamaa (Jogeva)|Laane-Virumaa (Rakvere)|Laanemaa (Haapsalu)|Parnumaa (Parnu)|Polvamaa (Polva)|Raplamaa (Rapla)|Saaremaa (Kuessaare)|Tartumaa (Tartu)|Valgamaa (Valga)|Viljandimaa (Viljandi)|Vorumaa (Voru)"
                    scope.state[69]="Adis Abeba (Addis Ababa)|Afar|Amara|Dire Dawa|Gambela Hizboch|Hareri Hizb|Oromiya|Sumale|Tigray|YeDebub Biheroch Bihereseboch na Hizboch";
                    scope.state[70]="Europa Island";
                    scope.state[71]="Falkland Islands (Islas Malvinas)"
                    scope.state[72]="Bordoy|Eysturoy|Mykines|Sandoy|Skuvoy|Streymoy|Suduroy|Tvoroyri|Vagar";
                    scope.state[73]="Central|Eastern|Northern|Rotuma|Western";
                    scope.state[74]="Aland|Etela-Suomen Laani|Ita-Suomen Laani|Lansi-Suomen Laani|Lappi|Oulun Laani";
                    scope.state[75]="Alsace|Aquitaine|Auvergne|Basse-Normandie|Bourgogne|Bretagne|Centre|Champagne-Ardenne|Corse|Franche-Comte|Haute-Normandie|Ile-de-France|Languedoc-Roussillon|Limousin|Lorraine|Midi-Pyrenees|Nord-Pas-de-Calais|Pays de la Loire|Picardie|Poitou-Charentes|Provence-Alpes-Cote d'Azur|Rhone-Alpes";
                    scope.state[76]="French Guiana";
                    scope.state[77]="Archipel des Marquises|Archipel des Tuamotu|Archipel des Tubuai|Iles du Vent|Iles Sous-le-Vent";
                    scope.state[78]="Adelie Land|Ile Crozet|Iles Kerguelen|Iles Saint-Paul et Amsterdam";
                    scope.state[79]="Estuaire|Haut-Ogooue|Moyen-Ogooue|Ngounie|Nyanga|Ogooue-Ivindo|Ogooue-Lolo|Ogooue-Maritime|Woleu-Ntem";
                    scope.state[80]="Banjul|Central River|Lower River|North Bank|Upper River|Western";
                    scope.state[81]="Gaza Strip";
                    scope.state[82]="Abashis|Abkhazia or Ap'khazet'is Avtonomiuri Respublika (Sokhumi)|Adigenis|Ajaria or Acharis Avtonomiuri Respublika (Bat'umi)|Akhalgoris|Akhalk'alak'is|Akhalts'ikhis|Akhmetis|Ambrolauris|Aspindzis|Baghdat'is|Bolnisis|Borjomis|Ch'khorotsqus|Ch'okhatauris|Chiat'ura|Dedop'listsqaros|Dmanisis|Dushet'is|Gardabanis|Gori|Goris|Gurjaanis|Javis|K'arelis|K'ut'aisi|Kaspis|Kharagaulis|Khashuris|Khobis|Khonis|Lagodekhis|Lanch'khut'is|Lentekhis|Marneulis|Martvilis|Mestiis|Mts'khet'is|Ninotsmindis|Onis|Ozurget'is|P'ot'i|Qazbegis|Qvarlis|Rust'avi|Sach'kheris|Sagarejos|Samtrediis|Senakis|Sighnaghis|T'bilisi|T'elavis|T'erjolis|T'et'ritsqaros|T'ianet'is|Tqibuli|Ts'ageris|Tsalenjikhis|Tsalkis|Tsqaltubo|Vanis|Zestap'onis|Zugdidi|Zugdidis";
                    scope.state[83]="Baden-Wuerttemberg|Bayern|Berlin|Brandenburg|Bremen|Hamburg|Hessen|Mecklenburg-Vorpommern|Niedersachsen|Nordrhein-Westfalen|Rheinland-Pfalz|Saarland|Sachsen|Sachsen-Anhalt|Schleswig-Holstein|Thueringen";
                    scope.state[84]="Ashanti|Brong-Ahafo|Central|Eastern|Greater Accra|Northern|Upper East|Upper West|Volta|Western";
                    scope.state[85]="Gibraltar";
                    scope.state[86]="Ile du Lys|Ile Glorieuse";
                    scope.state[87]="Aitolia kai Akarnania|Akhaia|Argolis|Arkadhia|Arta|Attiki|Ayion Oros (Mt. Athos)|Dhodhekanisos|Drama|Evritania|Evros|Evvoia|Florina|Fokis|Fthiotis|Grevena|Ilia|Imathia|Ioannina|Irakleion|Kardhitsa|Kastoria|Kavala|Kefallinia|Kerkyra|Khalkidhiki|Khania|Khios|Kikladhes|Kilkis|Korinthia|Kozani|Lakonia|Larisa|Lasithi|Lesvos|Levkas|Magnisia|Messinia|Pella|Pieria|Preveza|Rethimni|Rodhopi|Samos|Serrai|Thesprotia|Thessaloniki|Trikala|Voiotia|Xanthi|Zakinthos";
                    scope.state[88]="Avannaa (Nordgronland)|Kitaa (Vestgronland)|Tunu (Ostgronland)"
                    scope.state[89]="Carriacou and Petit Martinique|Saint Andrew|Saint David|Saint George|Saint John|Saint Mark|Saint Patrick";
                    scope.state[90]="Basse-Terre|Grande-Terre|Iles de la Petite Terre|Iles des Saintes|Marie-Galante";
                    scope.state[91]="Guam";
                    scope.state[92]="Alta Verapaz|Baja Verapaz|Chimaltenango|Chiquimula|El Progreso|Escuintla|Guatemala|Huehuetenango|Izabal|Jalapa|Jutiapa|Peten|Quetzaltenango|Quiche|Retalhuleu|Sacatepequez|San Marcos|Santa Rosa|Solola|Suchitepequez|Totonicapan|Zacapa";
                    scope.state[93]="Castel|Forest|St. Andrew|St. Martin|St. Peter Port|St. Pierre du Bois|St. Sampson|St. Saviour|Torteval|Vale";
                    scope.state[94]="Beyla|Boffa|Boke|Conakry|Coyah|Dabola|Dalaba|Dinguiraye|Dubreka|Faranah|Forecariah|Fria|Gaoual|Gueckedou|Kankan|Kerouane|Kindia|Kissidougou|Koubia|Koundara|Kouroussa|Labe|Lelouma|Lola|Macenta|Mali|Mamou|Mandiana|Nzerekore|Pita|Siguiri|Telimele|Tougue|Yomou";
                    scope.state[95]="Bafata|Biombo|Bissau|Bolama-Bijagos|Cacheu|Gabu|Oio|Quinara|Tombali";
                    scope.state[96]="Barima-Waini|Cuyuni-Mazaruni|Demerara-Mahaica|East Berbice-Corentyne|Essequibo Islands-West Demerara|Mahaica-Berbice|Pomeroon-Supenaam|Potaro-Siparuni|Upper Demerara-Berbice|Upper Takutu-Upper Essequibo";
                    scope.state[97]="Artibonite|Centre|Grand'Anse|Nord|Nord-Est|Nord-Ouest|Ouest|Sud|Sud-Est";
                    scope.state[98]="Heard Island and McDonald Islands";
                    scope.state[99]="Holy See (Vatican City)"
                    scope.state[100]="Atlantida|Choluteca|Colon|Comayagua|Copan|Cortes|El Paraiso|Francisco Morazan|Gracias a Dios|Intibuca|Islas de la Bahia|La Paz|Lempira|Ocotepeque|Olancho|Santa Barbara|Valle|Yoro";
                    scope.state[101]="Hong Kong";
                    scope.state[102]="Howland Island";
                    scope.state[103]="Bacs-Kiskun|Baranya|Bekes|Bekescsaba|Borsod-Abauj-Zemplen|Budapest|Csongrad|Debrecen|Dunaujvaros|Eger|Fejer|Gyor|Gyor-Moson-Sopron|Hajdu-Bihar|Heves|Hodmezovasarhely|Jasz-Nagykun-Szolnok|Kaposvar|Kecskemet|Komarom-Esztergom|Miskolc|Nagykanizsa|Nograd|Nyiregyhaza|Pecs|Pest|Somogy|Sopron|Szabolcs-Szatmar-Bereg|Szeged|Szekesfehervar|Szolnok|Szombathely|Tatabanya|Tolna|Vas|Veszprem|Veszprem|Zala|Zalaegerszeg";
                    scope.state[104]="Akranes|Akureyri|Arnessysla|Austur-Bardhastrandarsysla|Austur-Hunavatnssysla|Austur-Skaftafellssysla|Borgarfjardharsysla|Dalasysla|Eyjafjardharsysla|Gullbringusysla|Hafnarfjordhur|Husavik|Isafjordhur|Keflavik|Kjosarsysla|Kopavogur|Myrasysla|Neskaupstadhur|Nordhur-Isafjardharsysla|Nordhur-Mulasys-la|Nordhur-Thingeyjarsysla|Olafsfjordhur|Rangarvallasysla|Reykjavik|Saudharkrokur|Seydhisfjordhur|Siglufjordhur|Skagafjardharsysla|Snaefellsnes-og Hnappadalssysla|Strandasysla|Sudhur-Mulasysla|Sudhur-Thingeyjarsysla|Vesttmannaeyjar|Vestur-Bardhastrandarsysla|Vestur-Hunavatnssysla|Vestur-Isafjardharsysla|Vestur-Skaftafellssysla";
                    scope.state[105]="Andaman and Nicobar Islands|Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chandigarh|Chhattisgarh|Dadra and Nagar Haveli|Daman and Diu|Delhi|Goa|Gujarat|Haryana|Himachal Pradesh|Jammu and Kashmir|Jharkhand|Karnataka|Kerala|Lakshadweep|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Orissa|Pondicherry|Punjab|Rajasthan|Sikkim|Tamil Nadu|Tripura|Uttar Pradesh|Uttaranchal|West Bengal";
                    scope.state[106]="Aceh|Bali|Banten|Bengkulu|East Timor|Gorontalo|Irian Jaya|Jakarta Raya|Jambi|Jawa Barat|Jawa Tengah|Jawa Timur|Kalimantan Barat|Kalimantan Selatan|Kalimantan Tengah|Kalimantan Timur|Kepulauan Bangka Belitung|Lampung|Maluku|Maluku Utara|Nusa Tenggara Barat|Nusa Tenggara Timur|Riau|Sulawesi Selatan|Sulawesi Tengah|Sulawesi Tenggara|Sulawesi Utara|Sumatera Barat|Sumatera Selatan|Sumatera Utara|Yogyakarta";
                    scope.state[107]="Ardabil|Azarbayjan-e Gharbi|Azarbayjan-e Sharqi|Bushehr|Chahar Mahall va Bakhtiari|Esfahan|Fars|Gilan|Golestan|Hamadan|Hormozgan|Ilam|Kerman|Kermanshah|Khorasan|Khuzestan|Kohgiluyeh va Buyer Ahmad|Kordestan|Lorestan|Markazi|Mazandaran|Qazvin|Qom|Semnan|Sistan va Baluchestan|Tehran|Yazd|Zanjan";
                    scope.state[108]="Al Anbar|Al Basrah|Al Muthanna|Al Qadisiyah|An Najaf|Arbil|As Sulaymaniyah|At Ta'mim|Babil|Baghdad|Dahuk|Dhi Qar|Diyala|Karbala'|Maysan|Ninawa|Salah ad Din|Wasit";
                    scope.state[109]="Carlow|Cavan|Clare|Cork|Donegal|Dublin|Galway|Kerry|Kildare|Kilkenny|Laois|Leitrim|Limerick|Longford|Louth|Mayo|Meath|Monaghan|Offaly|Roscommon|Sligo|Tipperary|Waterford|Westmeath|Wexford|Wicklow";
                    scope.state[110]="Antrim|Ards|Armagh|Ballymena|Ballymoney|Banbridge|Belfast|Carrickfergus|Castlereagh|Coleraine|Cookstown|Craigavon|Derry|Down|Dungannon|Fermanagh|Larne|Limavady|Lisburn|Magherafelt|Moyle|Newry and Mourne|Newtownabbey|North Down|Omagh|Strabane";
                    scope.state[111]="Central|Haifa|Jerusalem|Northern|Southern|Tel Aviv";
                    scope.state[112]="Abruzzo|Basilicata|Calabria|Campania|Emilia-Romagna|Friuli-Venezia Giulia|Lazio|Liguria|Lombardia|Marche|Molise|Piemonte|Puglia|Sardegna|Sicilia|Toscana|Trentino-Alto Adige|Umbria|Valle d'Aosta|Veneto";
                    scope.state[113]="Clarendon|Hanover|Kingston|Manchester|Portland|Saint Andrew|Saint Ann|Saint Catherine|Saint Elizabeth|Saint James|Saint Mary|Saint Thomas|Trelawny|Westmoreland";
                    scope.state[114]="Jan Mayen";
                    scope.state[115]="Aichi|Akita|Aomori|Chiba|Ehime|Fukui|Fukuoka|Fukushima|Gifu|Gumma|Hiroshima|Hokkaido|Hyogo|Ibaraki|Ishikawa|Iwate|Kagawa|Kagoshima|Kanagawa|Kochi|Kumamoto|Kyoto|Mie|Miyagi|Miyazaki|Nagano|Nagasaki|Nara|Niigata|Oita|Okayama|Okinawa|Osaka|Saga|Saitama|Shiga|Shimane|Shizuoka|Tochigi|Tokushima|Tokyo|Tottori|Toyama|Wakayama|Yamagata|Yamaguchi|Yamanashi";
                    scope.state[116]="Jarvis Island";
                    scope.state[117]="Jersey";
                    scope.state[118]="Johnston Atoll";
                    scope.state[119]="'Amman|Ajlun|Al 'Aqabah|Al Balqa'|Al Karak|Al Mafraq|At Tafilah|Az Zarqa'|Irbid|Jarash|Ma'an|Madaba";
                    scope.state[120]="Juan de Nova Island";
                    scope.state[121]="Almaty|Aqmola|Aqtobe|Astana|Atyrau|Batys Qazaqstan|Bayqongyr|Mangghystau|Ongtustik Qazaqstan|Pavlodar|Qaraghandy|Qostanay|Qyzylorda|Shyghys Qazaqstan|Soltustik Qazaqstan|Zhambyl";
                    scope.state[122]="Central|Coast|Eastern|Nairobi Area|North Eastern|Nyanza|Rift Valley|Western";
                    scope.state[123]="Abaiang|Abemama|Aranuka|Arorae|Banaba|Banaba|Beru|Butaritari|Central Gilberts|Gilbert Islands|Kanton|Kiritimati|Kuria|Line Islands|Line Islands|Maiana|Makin|Marakei|Nikunau|Nonouti|Northern Gilberts|Onotoa|Phoenix Islands|Southern Gilberts|Tabiteuea|Tabuaeran|Tamana|Tarawa|Tarawa|Teraina";
                    scope.state[124]="Chagang-do (Chagang Province)|Hamgyong-bukto (North Hamgyong Province)|Hamgyong-namdo (South Hamgyong Province)|Hwanghae-bukto (North Hwanghae Province)|Hwanghae-namdo (South Hwanghae Province)|Kaesong-si (Kaesong City)|Kangwon-do (Kangwon Province)|Namp'o-si (Namp'o City)|P'yongan-bukto (North P'yongan Province)|P'yongan-namdo (South P'yongan Province)|P'yongyang-si (P'yongyang City)|Yanggang-do (Yanggang Province)"
                    scope.state[125]="Ch'ungch'ong-bukto|Ch'ungch'ong-namdo|Cheju-do|Cholla-bukto|Cholla-namdo|Inch'on-gwangyoksi|Kangwon-do|Kwangju-gwangyoksi|Kyonggi-do|Kyongsang-bukto|Kyongsang-namdo|Pusan-gwangyoksi|Soul-t'ukpyolsi|Taegu-gwangyoksi|Taejon-gwangyoksi|Ulsan-gwangyoksi";
                    scope.state[126]="Al 'Asimah|Al Ahmadi|Al Farwaniyah|Al Jahra'|Hawalli";
                    scope.state[127]="Batken Oblasty|Bishkek Shaary|Chuy Oblasty (Bishkek)|Jalal-Abad Oblasty|Naryn Oblasty|Osh Oblasty|Talas Oblasty|Ysyk-Kol Oblasty (Karakol)"
                    scope.state[128]="Attapu|Bokeo|Bolikhamxai|Champasak|Houaphan|Khammouan|Louangnamtha|Louangphabang|Oudomxai|Phongsali|Salavan|Savannakhet|Viangchan|Viangchan|Xaignabouli|Xaisomboun|Xekong|Xiangkhoang";
                    scope.state[129]="Aizkraukles Rajons|Aluksnes Rajons|Balvu Rajons|Bauskas Rajons|Cesu Rajons|Daugavpils|Daugavpils Rajons|Dobeles Rajons|Gulbenes Rajons|Jekabpils Rajons|Jelgava|Jelgavas Rajons|Jurmala|Kraslavas Rajons|Kuldigas Rajons|Leipaja|Liepajas Rajons|Limbazu Rajons|Ludzas Rajons|Madonas Rajons|Ogres Rajons|Preilu Rajons|Rezekne|Rezeknes Rajons|Riga|Rigas Rajons|Saldus Rajons|Talsu Rajons|Tukuma Rajons|Valkas Rajons|Valmieras Rajons|Ventspils|Ventspils Rajons";
                    scope.state[130]="Beyrouth|Ech Chimal|Ej Jnoub|El Bekaa|Jabal Loubnane";
                    scope.state[131]="Berea|Butha-Buthe|Leribe|Mafeteng|Maseru|Mohales Hoek|Mokhotlong|Qacha's Nek|Quthing|Thaba-Tseka";
                    scope.state[132]="Bomi|Bong|Grand Bassa|Grand Cape Mount|Grand Gedeh|Grand Kru|Lofa|Margibi|Maryland|Montserrado|Nimba|River Cess|Sinoe";
                    scope.state[133]="Ajdabiya|Al 'Aziziyah|Al Fatih|Al Jabal al Akhdar|Al Jufrah|Al Khums|Al Kufrah|An Nuqat al Khams|Ash Shati'|Awbari|Az Zawiyah|Banghazi|Darnah|Ghadamis|Gharyan|Misratah|Murzuq|Sabha|Sawfajjin|Surt|Tarabulus|Tarhunah|Tubruq|Yafran|Zlitan";
                    scope.state[134]="Balzers|Eschen|Gamprin|Mauren|Planken|Ruggell|Schaan|Schellenberg|Triesen|Triesenberg|Vaduz";
                    scope.state[135]="Akmenes Rajonas|Alytaus Rajonas|Alytus|Anyksciu Rajonas|Birstonas|Birzu Rajonas|Druskininkai|Ignalinos Rajonas|Jonavos Rajonas|Joniskio Rajonas|Jurbarko Rajonas|Kaisiadoriu Rajonas|Kaunas|Kauno Rajonas|Kedainiu Rajonas|Kelmes Rajonas|Klaipeda|Klaipedos Rajonas|Kretingos Rajonas|Kupiskio Rajonas|Lazdiju Rajonas|Marijampole|Marijampoles Rajonas|Mazeikiu Rajonas|Moletu Rajonas|Neringa Pakruojo Rajonas|Palanga|Panevezio Rajonas|Panevezys|Pasvalio Rajonas|Plunges Rajonas|Prienu Rajonas|Radviliskio Rajonas|Raseiniu Rajonas|Rokiskio Rajonas|Sakiu Rajonas|Salcininku Rajonas|Siauliai|Siauliu Rajonas|Silales Rajonas|Silutes Rajonas|Sirvintu Rajonas|Skuodo Rajonas|Svencioniu Rajonas|Taurages Rajonas|Telsiu Rajonas|Traku Rajonas|Ukmerges Rajonas|Utenos Rajonas|Varenos Rajonas|Vilkaviskio Rajonas|Vilniaus Rajonas|Vilnius|Zarasu Rajonas";
                    scope.state[136]="Diekirch|Grevenmacher|Luxembourg";
                    scope.state[137]="Macau";
                    scope.state[138]="Aracinovo|Bac|Belcista|Berovo|Bistrica|Bitola|Blatec|Bogdanci|Bogomila|Bogovinje|Bosilovo|Brvenica|Cair (Skopje)|Capari|Caska|Cegrane|Centar (Skopje)|Centar Zupa|Cesinovo|Cucer-Sandevo|Debar|Delcevo|Delogozdi|Demir Hisar|Demir Kapija|Dobrusevo|Dolna Banjica|Dolneni|Dorce Petrov (Skopje)|Drugovo|Dzepciste|Gazi Baba (Skopje)|Gevgelija|Gostivar|Gradsko|Ilinden|Izvor|Jegunovce|Kamenjane|Karbinci|Karpos (Skopje)|Kavadarci|Kicevo|Kisela Voda (Skopje)|Klecevce|Kocani|Konce|Kondovo|Konopiste|Kosel|Kratovo|Kriva Palanka|Krivogastani|Krusevo|Kuklis|Kukurecani|Kumanovo|Labunista|Lipkovo|Lozovo|Lukovo|Makedonska Kamenica|Makedonski Brod|Mavrovi Anovi|Meseista|Miravci|Mogila|Murtino|Negotino|Negotino-Poloska|Novaci|Novo Selo|Oblesevo|Ohrid|Orasac|Orizari|Oslomej|Pehcevo|Petrovec|Plasnia|Podares|Prilep|Probistip|Radovis|Rankovce|Resen|Rosoman|Rostusa|Samokov|Saraj|Sipkovica|Sopiste|Sopotnika|Srbinovo|Star Dojran|Staravina|Staro Nagoricane|Stip|Struga|Strumica|Studenicani|Suto Orizari (Skopje)|Sveti Nikole|Tearce|Tetovo|Topolcani|Valandovo|Vasilevo|Veles|Velesta|Vevcani|Vinica|Vitoliste|Vranestica|Vrapciste|Vratnica|Vrutok|Zajas|Zelenikovo|Zileno|Zitose|Zletovo|Zrnovci";
                    scope.state[139]="Antananarivo|Antsiranana|Fianarantsoa|Mahajanga|Toamasina|Toliara";
                    scope.state[140]="Balaka|Blantyre|Chikwawa|Chiradzulu|Chitipa|Dedza|Dowa|Karonga|Kasungu|Likoma|Lilongwe|Machinga (Kasupe)|Mangochi|Mchinji|Mulanje|Mwanza|Mzimba|Nkhata Bay|Nkhotakota|Nsanje|Ntcheu|Ntchisi|Phalombe|Rumphi|Salima|Thyolo|Zomba";
                    scope.state[141]="Johor|Kedah|Kelantan|Labuan|Melaka|Negeri Sembilan|Pahang|Perak|Perlis|Pulau Pinang|Sabah|Sarawak|Selangor|Terengganu|Wilayah Persekutuan";
                    scope.state[142]="Alifu|Baa|Dhaalu|Faafu|Gaafu Alifu|Gaafu Dhaalu|Gnaviyani|Haa Alifu|Haa Dhaalu|Kaafu|Laamu|Lhaviyani|Maale|Meemu|Noonu|Raa|Seenu|Shaviyani|Thaa|Vaavu";
                    scope.state[143]="Gao|Kayes|Kidal|Koulikoro|Mopti|Segou|Sikasso|Tombouctou";
                    scope.state[144]="Valletta";
                    scope.state[145]="Man, Isle of";
                    scope.state[146]="Ailinginae|Ailinglaplap|Ailuk|Arno|Aur|Bikar|Bikini|Bokak|Ebon|Enewetak|Erikub|Jabat|Jaluit|Jemo|Kili|Kwajalein|Lae|Lib|Likiep|Majuro|Maloelap|Mejit|Mili|Namorik|Namu|Rongelap|Rongrik|Toke|Ujae|Ujelang|Utirik|Wotho|Wotje";
                    scope.state[147]="Martinique";
                    scope.state[148]="Adrar|Assaba|Brakna|Dakhlet Nouadhibou|Gorgol|Guidimaka|Hodh Ech Chargui|Hodh El Gharbi|Inchiri|Nouakchott|Tagant|Tiris Zemmour|Trarza";
                    scope.state[149]="Agalega Islands|Black River|Cargados Carajos Shoals|Flacq|Grand Port|Moka|Pamplemousses|Plaines Wilhems|Port Louis|Riviere du Rempart|Rodrigues|Savanne";
                    scope.state[150]="Mayotte";
                    scope.state[151]="Aguascalientes|Baja California|Baja California Sur|Campeche|Chiapas|Chihuahua|Coahuila de Zaragoza|Colima|Distrito Federal|Durango|Guanajuato|Guerrero|Hidalgo|Jalisco|Mexico|Michoacan de Ocampo|Morelos|Nayarit|Nuevo Leon|Oaxaca|Puebla|Queretaro de Arteaga|Quintana Roo|San Luis Potosi|Sinaloa|Sonora|Tabasco|Tamaulipas|Tlaxcala|Veracruz-Llave|Yucatan|Zacatecas";
                    scope.state[152]="Chuuk (Truk)|Kosrae|Pohnpei|Yap";
                    scope.state[153]="Midway Islands";
                    scope.state[154]="Balti|Cahul|Chisinau|Chisinau|Dubasari|Edinet|Gagauzia|Lapusna|Orhei|Soroca|Tighina|Ungheni";
                    scope.state[155]="Fontvieille|La Condamine|Monaco-Ville|Monte-Carlo";
                    scope.state[156]="Arhangay|Bayan-Olgiy|Bayanhongor|Bulgan|Darhan|Dornod|Dornogovi|Dundgovi|Dzavhan|Erdenet|Govi-Altay|Hentiy|Hovd|Hovsgol|Omnogovi|Ovorhangay|Selenge|Suhbaatar|Tov|Ulaanbaatar|Uvs";
                    scope.state[157]="Saint Anthony|Saint Georges|Saint Peter's";
                    scope.state[158]="Agadir|Al Hoceima|Azilal|Ben Slimane|Beni Mellal|Boulemane|Casablanca|Chaouen|El Jadida|El Kelaa des Srarhna|Er Rachidia|Essaouira|Fes|Figuig|Guelmim|Ifrane|Kenitra|Khemisset|Khenifra|Khouribga|Laayoune|Larache|Marrakech|Meknes|Nador|Ouarzazate|Oujda|Rabat-Sale|Safi|Settat|Sidi Kacem|Tan-Tan|Tanger|Taounate|Taroudannt|Tata|Taza|Tetouan|Tiznit";
                    scope.state[159]="Cabo Delgado|Gaza|Inhambane|Manica|Maputo|Nampula|Niassa|Sofala|Tete|Zambezia";
                    scope.state[160]="Caprivi|Erongo|Hardap|Karas|Khomas|Kunene|Ohangwena|Okavango|Omaheke|Omusati|Oshana|Oshikoto|Otjozondjupa";
                    scope.state[161]="Aiwo|Anabar|Anetan|Anibare|Baiti|Boe|Buada|Denigomodu|Ewa|Ijuw|Meneng|Nibok|Uaboe|Yaren";
                    scope.state[162]="Bagmati|Bheri|Dhawalagiri|Gandaki|Janakpur|Karnali|Kosi|Lumbini|Mahakali|Mechi|Narayani|Rapti|Sagarmatha|Seti";
                    scope.state[163]="Drenthe|Flevoland|Friesland|Gelderland|Groningen|Limburg|Noord-Brabant|Noord-Holland|Overijssel|Utrecht|Zeeland|Zuid-Holland";
                    scope.state[164]="Netherlands Antilles";
                    scope.state[165]="Iles Loyaute|Nord|Sud";
                    scope.state[166]="Akaroa|Amuri|Ashburton|Bay of Islands|Bruce|Buller|Chatham Islands|Cheviot|Clifton|Clutha|Cook|Dannevirke|Egmont|Eketahuna|Ellesmere|Eltham|Eyre|Featherston|Franklin|Golden Bay|Great Barrier Island|Grey|Hauraki Plains|Hawera|Hawke's Bay|Heathcote|Hikurangi|Hobson|Hokianga|Horowhenua|Hurunui|Hutt|Inangahua|Inglewood|Kaikoura|Kairanga|Kiwitea|Lake|Mackenzie|Malvern|Manaia|Manawatu|Mangonui|Maniototo|Marlborough|Masterton|Matamata|Mount Herbert|Ohinemuri|Opotiki|Oroua|Otamatea|Otorohanga|Oxford|Pahiatua|Paparua|Patea|Piako|Pohangina|Raglan|Rangiora|Rangitikei|Rodney|Rotorua|Runanga|Saint Kilda|Silverpeaks|Southland|Stewart Island|Stratford|Strathallan|Taranaki|Taumarunui|Taupo|Tauranga|Thames-Coromandel|Tuapeka|Vincent|Waiapu|Waiheke|Waihemo|Waikato|Waikohu|Waimairi|Waimarino|Waimate|Waimate West|Waimea|Waipa|Waipawa|Waipukurau|Wairarapa South|Wairewa|Wairoa|Waitaki|Waitomo|Waitotara|Wallace|Wanganui|Waverley|Westland|Whakatane|Whangarei|Whangaroa|Woodville";
                    scope.state[167]="Atlantico Norte|Atlantico Sur|Boaco|Carazo|Chinandega|Chontales|Esteli|Granada|Jinotega|Leon|Madriz|Managua|Masaya|Matagalpa|Nueva Segovia|Rio San Juan|Rivas";
                    scope.state[168]="Agadez|Diffa|Dosso|Maradi|Niamey|Tahoua|Tillaberi|Zinder";
                    scope.state[169]="Abia|Abuja Federal Capital Territory|Adamawa|Akwa Ibom|Anambra|Bauchi|Bayelsa|Benue|Borno|Cross River|Delta|Ebonyi|Edo|Ekiti|Enugu|Gombe|Imo|Jigawa|Kaduna|Kano|Katsina|Kebbi|Kogi|Kwara|Lagos|Nassarawa|Niger|Ogun|Ondo|Osun|Oyo|Plateau|Rivers|Sokoto|Taraba|Yobe|Zamfara";
                    scope.state[170]="Niue";
                    scope.state[171]="Norfolk Island";
                    scope.state[172]="Northern Islands|Rota|Saipan|Tinian";
                    scope.state[173]="Akershus|Aust-Agder|Buskerud|Finnmark|Hedmark|Hordaland|More og Romsdal|Nord-Trondelag|Nordland|Oppland|Oslo|Ostfold|Rogaland|Sogn og Fjordane|Sor-Trondelag|Telemark|Troms|Vest-Agder|Vestfold";
                    scope.state[174]="Ad Dakhiliyah|Al Batinah|Al Wusta|Ash Sharqiyah|Az Zahirah|Masqat|Musandam|Zufar";
                    scope.state[175]="Balochistan|Federally Administered Tribal Areas|Islamabad Capital Territory|North-West Frontier Province|Punjab|Sindh";
                    scope.state[176]="Aimeliik|Airai|Angaur|Hatobohei|Kayangel|Koror|Melekeok|Ngaraard|Ngarchelong|Ngardmau|Ngatpang|Ngchesar|Ngeremlengui|Ngiwal|Palau Island|Peleliu|Sonsoral|Tobi";
                    scope.state[177]="Bocas del Toro|Chiriqui|Cocle|Colon|Darien|Herrera|Los Santos|Panama|San Blas|Veraguas";
                    scope.state[178]="Bougainville|Central|Chimbu|East New Britain|East Sepik|Eastern Highlands|Enga|Gulf|Madang|Manus|Milne Bay|Morobe|National Capital|New Ireland|Northern|Sandaun|Southern Highlands|West New Britain|Western|Western Highlands";
                    scope.state[179]="Alto Paraguay|Alto Parana|Amambay|Asuncion (city)|Boqueron|Caaguazu|Caazapa|Canindeyu|Central|Concepcion|Cordillera|Guaira|Itapua|Misiones|Neembucu|Paraguari|Presidente Hayes|San Pedro";
                    scope.state[180]="Amazonas|Ancash|Apurimac|Arequipa|Ayacucho|Cajamarca|Callao|Cusco|Huancavelica|Huanuco|Ica|Junin|La Libertad|Lambayeque|Lima|Loreto|Madre de Dios|Moquegua|Pasco|Piura|Puno|San Martin|Tacna|Tumbes|Ucayali";
                    scope.state[181]="Abra|Agusan del Norte|Agusan del Sur|Aklan|Albay|Angeles|Antique|Aurora|Bacolod|Bago|Baguio|Bais|Basilan|Basilan City|Bataan|Batanes|Batangas|Batangas City|Benguet|Bohol|Bukidnon|Bulacan|Butuan|Cabanatuan|Cadiz|Cagayan|Cagayan de Oro|Calbayog|Caloocan|Camarines Norte|Camarines Sur|Camiguin|Canlaon|Capiz|Catanduanes|Cavite|Cavite City|Cebu|Cebu City|Cotabato|Dagupan|Danao|Dapitan|Davao City Davao|Davao del Sur|Davao Oriental|Dipolog|Dumaguete|Eastern Samar|General Santos|Gingoog|Ifugao|Iligan|Ilocos Norte|Ilocos Sur|Iloilo|Iloilo City|Iriga|Isabela|Kalinga-Apayao|La Carlota|La Union|Laguna|Lanao del Norte|Lanao del Sur|Laoag|Lapu-Lapu|Legaspi|Leyte|Lipa|Lucena|Maguindanao|Mandaue|Manila|Marawi|Marinduque|Masbate|Mindoro Occidental|Mindoro Oriental|Misamis Occidental|Misamis Oriental|Mountain|Naga|Negros Occidental|Negros Oriental|North Cotabato|Northern Samar|Nueva Ecija|Nueva Vizcaya|Olongapo|Ormoc|Oroquieta|Ozamis|Pagadian|Palawan|Palayan|Pampanga|Pangasinan|Pasay|Puerto Princesa|Quezon|Quezon City|Quirino|Rizal|Romblon|Roxas|Samar|San Carlos (in Negros Occidental)|San Carlos (in Pangasinan)|San Jose|San Pablo|Silay|Siquijor|Sorsogon|South Cotabato|Southern Leyte|Sultan Kudarat|Sulu|Surigao|Surigao del Norte|Surigao del Sur|Tacloban|Tagaytay|Tagbilaran|Tangub|Tarlac|Tawitawi|Toledo|Trece Martires|Zambales|Zamboanga|Zamboanga del Norte|Zamboanga del Sur";
                    scope.state[182]="Pitcaim Islands";
                    scope.state[183]="Dolnoslaskie|Kujawsko-Pomorskie|Lodzkie|Lubelskie|Lubuskie|Malopolskie|Mazowieckie|Opolskie|Podkarpackie|Podlaskie|Pomorskie|Slaskie|Swietokrzyskie|Warminsko-Mazurskie|Wielkopolskie|Zachodniopomorskie";
                    scope.state[184]="Acores (Azores)|Aveiro|Beja|Braga|Braganca|Castelo Branco|Coimbra|Evora|Faro|Guarda|Leiria|Lisboa|Madeira|Portalegre|Porto|Santarem|Setubal|Viana do Castelo|Vila Real|Viseu";
                    scope.state[185]="Adjuntas|Aguada|Aguadilla|Aguas Buenas|Aibonito|Anasco|Arecibo|Arroyo|Barceloneta|Barranquitas|Bayamon|Cabo Rojo|Caguas|Camuy|Canovanas|Carolina|Catano|Cayey|Ceiba|Ciales|Cidra|Coamo|Comerio|Corozal|Culebra|Dorado|Fajardo|Florida|Guanica|Guayama|Guayanilla|Guaynabo|Gurabo|Hatillo|Hormigueros|Humacao|Isabela|Jayuya|Juana Diaz|Juncos|Lajas|Lares|Las Marias|Las Piedras|Loiza|Luquillo|Manati|Maricao|Maunabo|Mayaguez|Moca|Morovis|Naguabo|Naranjito|Orocovis|Patillas|Penuelas|Ponce|Quebradillas|Rincon|Rio Grande|Sabana Grande|Salinas|San German|San Juan|San Lorenzo|San Sebastian|Santa Isabel|Toa Alta|Toa Baja|Trujillo Alto|Utuado|Vega Alta|Vega Baja|Vieques|Villalba|Yabucoa|Yauco";
                    scope.state[186]="Ad Dawhah|Al Ghuwayriyah|Al Jumayliyah|Al Khawr|Al Wakrah|Ar Rayyan|Jarayan al Batinah|Madinat ash Shamal|Umm Salal";
                    scope.state[187]="Reunion";
                    scope.state[188]="Alba|Arad|Arges|Bacau|Bihor|Bistrita-Nasaud|Botosani|Braila|Brasov|Bucuresti|Buzau|Calarasi|Caras-Severin|Cluj|Constanta|Covasna|Dimbovita|Dolj|Galati|Giurgiu|Gorj|Harghita|Hunedoara|Ialomita|Iasi|Maramures|Mehedinti|Mures|Neamt|Olt|Prahova|Salaj|Satu Mare|Sibiu|Suceava|Teleorman|Timis|Tulcea|Vaslui|Vilcea|Vrancea";
                    scope.state[189]="Adygeya (Maykop)|Aginskiy Buryatskiy (Aginskoye)|Altay (Gorno-Altaysk)|Altayskiy (Barnaul)|Amurskaya (Blagoveshchensk)|Arkhangel'skaya|Astrakhanskaya|Bashkortostan (Ufa)|Belgorodskaya|Bryanskaya|Buryatiya (Ulan-Ude)|Chechnya (Groznyy)|Chelyabinskaya|Chitinskaya|Chukotskiy (Anadyr')|Chuvashiya (Cheboksary)|Dagestan (Makhachkala)|Evenkiyskiy (Tura)|Ingushetiya (Nazran')|Irkutskaya|Ivanovskaya|Kabardino-Balkariya (Nal'chik)|Kaliningradskaya|Kalmykiya (Elista)|Kaluzhskaya|Kamchatskaya (Petropavlovsk-Kamchatskiy)|Karachayevo-Cherkesiya (Cherkessk)|Kareliya (Petrozavodsk)|Kemerovskaya|Khabarovskiy|Khakasiya (Abakan)|Khanty-Mansiyskiy (Khanty-Mansiysk)|Kirovskaya|Komi (Syktyvkar)|Komi-Permyatskiy (Kudymkar)|Koryakskiy (Palana)|Kostromskaya|Krasnodarskiy|Krasnoyarskiy|Kurganskaya|Kurskaya|Leningradskaya|Lipetskaya|Magadanskaya|Mariy-El (Yoshkar-Ola)|Mordoviya (Saransk)|Moskovskaya|Moskva (Moscow)|Murmanskaya|Nenetskiy (Nar'yan-Mar)|Nizhegorodskaya|Novgorodskaya|Novosibirskaya|Omskaya|Orenburgskaya|Orlovskaya (Orel)|Penzenskaya|Permskaya|Primorskiy (Vladivostok)|Pskovskaya|Rostovskaya|Ryazanskaya|Sakha (Yakutsk)|Sakhalinskaya (Yuzhno-Sakhalinsk)|Samarskaya|Sankt-Peterburg (Saint Petersburg)|Saratovskaya|Severnaya Osetiya-Alaniya [North Ossetia] (Vladikavkaz)|Smolenskaya|Stavropol'skiy|Sverdlovskaya (Yekaterinburg)|Tambovskaya|Tatarstan (Kazan')|Taymyrskiy (Dudinka)|Tomskaya|Tul'skaya|Tverskaya|Tyumenskaya|Tyva (Kyzyl)|Udmurtiya (Izhevsk)|Ul'yanovskaya|Ust'-Ordynskiy Buryatskiy (Ust'-Ordynskiy)|Vladimirskaya|Volgogradskaya|Vologodskaya|Voronezhskaya|Yamalo-Nenetskiy (Salekhard)|Yaroslavskaya|Yevreyskaya";
                    scope.state[190]="Butare|Byumba|Cyangugu|Gikongoro|Gisenyi|Gitarama|Kibungo|Kibuye|Kigali Rurale|Kigali-ville|Ruhengeri|Umutara";
                    scope.state[191]="Ascension|Saint Helena|Tristan da Cunha";
                    scope.state[192]="Christ Church Nichola Town|Saint Anne Sandy Point|Saint George Basseterre|Saint George Gingerland|Saint James Windward|Saint John Capisterre|Saint John Figtree|Saint Mary Cayon|Saint Paul Capisterre|Saint Paul Charlestown|Saint Peter Basseterre|Saint Thomas Lowland|Saint Thomas Middle Island|Trinity Palmetto Point";
                    scope.state[193]="Anse-la-Raye|Castries|Choiseul|Dauphin|Dennery|Gros Islet|Laborie|Micoud|Praslin|Soufriere|Vieux Fort";
                    scope.state[194]="Miquelon|Saint Pierre";
                    scope.state[195]="Charlotte|Grenadines|Saint Andrew|Saint David|Saint George|Saint Patrick";
                    scope.state[196]="A'ana|Aiga-i-le-Tai|Atua|Fa'asaleleaga|Gaga'emauga|Gagaifomauga|Palauli|Satupa'itea|Tuamasaga|Va'a-o-Fonoti|Vaisigano";
                    scope.state[197]="Acquaviva|Borgo Maggiore|Chiesanuova|Domagnano|Faetano|Fiorentino|Monte Giardino|San Marino|Serravalle";
                    scope.state[198]="Principe|Sao Tome";
                    scope.state[199]="'Asir|Al Bahah|Al Hudud ash Shamaliyah|Al Jawf|Al Madinah|Al Qasim|Ar Riyad|Ash Sharqiyah (Eastern Province)|Ha'il|Jizan|Makkah|Najran|Tabuk";
                    scope.state[200]="Aberdeen City|Aberdeenshire|Angus|Argyll and Bute|City of Edinburgh|Clackmannanshire|Dumfries and Galloway|Dundee City|East Ayrshire|East Dunbartonshire|East Lothian|East Renfrewshire|Eilean Siar (Western Isles)|Falkirk|Fife|Glasgow City|Highland|Inverclyde|Midlothian|Moray|North Ayrshire|North Lanarkshire|Orkney Islands|Perth and Kinross|Renfrewshire|Shetland Islands|South Ayrshire|South Lanarkshire|Stirling|The Scottish Borders|West Dunbartonshire|West Lothian";
                    scope.state[201]="Dakar|Diourbel|Fatick|Kaolack|Kolda|Louga|Saint-Louis|Tambacounda|Thies|Ziguinchor";
                    scope.state[202]="Anse aux Pins|Anse Boileau|Anse Etoile|Anse Louis|Anse Royale|Baie Lazare|Baie Sainte Anne|Beau Vallon|Bel Air|Bel Ombre|Cascade|Glacis|Grand' Anse (on Mahe)|Grand' Anse (on Praslin)|La Digue|La Riviere Anglaise|Mont Buxton|Mont Fleuri|Plaisance|Pointe La Rue|Port Glaud|Saint Louis|Takamaka";
                    scope.state[203]="Eastern|Northern|Southern|Western";
                    scope.state[204]="Singapore";
                    scope.state[205]="Banskobystricky|Bratislavsky|Kosicky|Nitriansky|Presovsky|Trenciansky|Trnavsky|Zilinsky";
                    scope.state[206]="Ajdovscina|Beltinci|Bled|Bohinj|Borovnica|Bovec|Brda|Brezice|Brezovica|Cankova-Tisina|Celje|Cerklje na Gorenjskem|Cerknica|Cerkno|Crensovci|Crna na Koroskem|Crnomelj|Destrnik-Trnovska Vas|Divaca|Dobrepolje|Dobrova-Horjul-Polhov Gradec|Dol pri Ljubljani|Domzale|Dornava|Dravograd|Duplek|Gorenja Vas-Poljane|Gorisnica|Gornja Radgona|Gornji Grad|Gornji Petrovci|Grosuplje|Hodos Salovci|Hrastnik|Hrpelje-Kozina|Idrija|Ig|Ilirska Bistrica|Ivancna Gorica|Izola|Jesenice|Jursinci|Kamnik|Kanal|Kidricevo|Kobarid|Kobilje|Kocevje|Komen|Koper|Kozje|Kranj|Kranjska Gora|Krsko|Kungota|Kuzma|Lasko|Lenart|Lendava|Litija|Ljubljana|Ljubno|Ljutomer|Logatec|Loska Dolina|Loski Potok|Luce|Lukovica|Majsperk|Maribor|Medvode|Menges|Metlika|Mezica|Miren-Kostanjevica|Mislinja|Moravce|Moravske Toplice|Mozirje|Murska Sobota|Muta|Naklo|Nazarje|Nova Gorica|Novo Mesto|Odranci|Ormoz|Osilnica|Pesnica|Piran|Pivka|Podcetrtek|Podvelka-Ribnica|Postojna|Preddvor|Ptuj|Puconci|Race-Fram|Radece|Radenci|Radlje ob Dravi|Radovljica|Ravne-Prevalje|Ribnica|Rogasevci|Rogaska Slatina|Rogatec|Ruse|Semic|Sencur|Sentilj|Sentjernej|Sentjur pri Celju|Sevnica|Sezana|Skocjan|Skofja Loka|Skofljica|Slovenj Gradec|Slovenska Bistrica|Slovenske Konjice|Smarje pri Jelsah|Smartno ob Paki|Sostanj|Starse|Store|Sveti Jurij|Tolmin|Trbovlje|Trebnje|Trzic|Turnisce|Velenje|Velike Lasce|Videm|Vipava|Vitanje|Vodice|Vojnik|Vrhnika|Vuzenica|Zagorje ob Savi|Zalec|Zavrc|Zelezniki|Ziri|Zrece";
                    scope.state[207]="Bellona|Central|Choiseul (Lauru)|Guadalcanal|Honiara|Isabel|Makira|Malaita|Rennell|Temotu|Western";
                    scope.state[208]="Awdal|Bakool|Banaadir|Bari|Bay|Galguduud|Gedo|Hiiraan|Jubbada Dhexe|Jubbada Hoose|Mudug|Nugaal|Sanaag|Shabeellaha Dhexe|Shabeellaha Hoose|Sool|Togdheer|Woqooyi Galbeed";
                    scope.state[209]="Eastern Cape|Free State|Gauteng|KwaZulu-Natal|Mpumalanga|North-West|Northern Cape|Northern Province|Western Cape";
                    scope.state[210]="Bird Island|Bristol Island|Clerke Rocks|Montagu Island|Saunders Island|South Georgia|Southern Thule|Traversay Islands";
                    scope.state[211]="Andalucia|Aragon|Asturias|Baleares (Balearic Islands)|Canarias (Canary Islands)|Cantabria|Castilla y Leon|Castilla-La Mancha|Cataluna|Ceuta|Communidad Valencian|Extremadura|Galicia|Islas Chafarinas|La Rioja|Madrid|Melilla|Murcia|Navarra|Pais Vasco (Basque Country)|Penon de Alhucemas|Penon de Velez de la Gomera";
                    scope.state[212]="Spratly Islands";
                    scope.state[213]="Central|Eastern|North Central|North Eastern|North Western|Northern|Sabaragamuwa|Southern|Uva|Western";
                    scope.state[214]="A'ali an Nil|Al Bahr al Ahmar|Al Buhayrat|Al Jazirah|Al Khartum|Al Qadarif|Al Wahdah|An Nil al Abyad|An Nil al Azraq|Ash Shamaliyah|Bahr al Jabal|Gharb al Istiwa'iyah|Gharb Bahr al Ghazal|Gharb Darfur|Gharb Kurdufan|Janub Darfur|Janub Kurdufan|Junqali|Kassala|Nahr an Nil|Shamal Bahr al Ghazal|Shamal Darfur|Shamal Kurdufan|Sharq al Istiwa'iyah|Sinnar|Warab";
                    scope.state[215]="Brokopondo|Commewijne|Coronie|Marowijne|Nickerie|Para|Paramaribo|Saramacca|Sipaliwini|Wanica";
                    scope.state[216]="Barentsoya|Bjornoya|Edgeoya|Hopen|Kvitoya|Nordaustandet|Prins Karls Forland|Spitsbergen";
                    scope.state[217]="Hhohho|Lubombo|Manzini|Shiselweni";
                    scope.state[218]="Blekinge|Dalarnas|Gavleborgs|Gotlands|Hallands|Jamtlands|Jonkopings|Kalmar|Kronobergs|Norrbottens|Orebro|Ostergotlands|Skane|Sodermanlands|Stockholms|Uppsala|Varmlands|Vasterbottens|Vasternorrlands|Vastmanlands|Vastra Gotalands";
                    scope.state[219]="Aargau|Ausser-Rhoden|Basel-Landschaft|Basel-Stadt|Bern|Fribourg|Geneve|Glarus|Graubunden|Inner-Rhoden|Jura|Luzern|Neuchatel|Nidwalden|Obwalden|Sankt Gallen|Schaffhausen|Schwyz|Solothurn|Thurgau|Ticino|Uri|Valais|Vaud|Zug|Zurich";
                    scope.state[220]="Al Hasakah|Al Ladhiqiyah|Al Qunaytirah|Ar Raqqah|As Suwayda'|Dar'a|Dayr az Zawr|Dimashq|Halab|Hamah|Hims|Idlib|Rif Dimashq|Tartus";
                    scope.state[221]="Chang-hua|Chi-lung|Chia-i|Chia-i|Chung-hsing-hsin-ts'un|Hsin-chu|Hsin-chu|Hua-lien|I-lan|Kao-hsiung|Kao-hsiung|Miao-li|Nan-t'ou|P'eng-hu|P'ing-tung|T'ai-chung|T'ai-chung|T'ai-nan|T'ai-nan|T'ai-pei|T'ai-pei|T'ai-tung|T'ao-yuan|Yun-lin";
                    scope.state[222]="Viloyati Khatlon|Viloyati Leninobod|Viloyati Mukhtori Kuhistoni Badakhshon";
                    scope.state[223]="Arusha|Dar es Salaam|Dodoma|Iringa|Kagera|Kigoma|Kilimanjaro|Lindi|Mara|Mbeya|Morogoro|Mtwara|Mwanza|Pemba North|Pemba South|Pwani|Rukwa|Ruvuma|Shinyanga|Singida|Tabora|Tanga|Zanzibar Central/South|Zanzibar North|Zanzibar Urban/West";
                    scope.state[224]="Amnat Charoen|Ang Thong|Buriram|Chachoengsao|Chai Nat|Chaiyaphum|Chanthaburi|Chiang Mai|Chiang Rai|Chon Buri|Chumphon|Kalasin|Kamphaeng Phet|Kanchanaburi|Khon Kaen|Krabi|Krung Thep Mahanakhon (Bangkok)|Lampang|Lamphun|Loei|Lop Buri|Mae Hong Son|Maha Sarakham|Mukdahan|Nakhon Nayok|Nakhon Pathom|Nakhon Phanom|Nakhon Ratchasima|Nakhon Sawan|Nakhon Si Thammarat|Nan|Narathiwat|Nong Bua Lamphu|Nong Khai|Nonthaburi|Pathum Thani|Pattani|Phangnga|Phatthalung|Phayao|Phetchabun|Phetchaburi|Phichit|Phitsanulok|Phra Nakhon Si Ayutthaya|Phrae|Phuket|Prachin Buri|Prachuap Khiri Khan|Ranong|Ratchaburi|Rayong|Roi Et|Sa Kaeo|Sakon Nakhon|Samut Prakan|Samut Sakhon|Samut Songkhram|Sara Buri|Satun|Sing Buri|Sisaket|Songkhla|Sukhothai|Suphan Buri|Surat Thani|Surin|Tak|Trang|Trat|Ubon Ratchathani|Udon Thani|Uthai Thani|Uttaradit|Yala|Yasothon";
                    scope.state[225]="Tobago";
                    scope.state[226]="De La Kara|Des Plateaux|Des Savanes|Du Centre|Maritime";
                    scope.state[227]="Atafu|Fakaofo|Nukunonu";
                    scope.state[228]="Ha'apai|Tongatapu|Vava'u";
                    scope.state[229]="Arima|Caroni|Mayaro|Nariva|Port-of-Spain|Saint Andrew|Saint David|Saint George|Saint Patrick|San Fernando|Victoria";
                    scope.state[230]="Ariana|Beja|Ben Arous|Bizerte|El Kef|Gabes|Gafsa|Jendouba|Kairouan|Kasserine|Kebili|Mahdia|Medenine|Monastir|Nabeul|Sfax|Sidi Bou Zid|Siliana|Sousse|Tataouine|Tozeur|Tunis|Zaghouan";
                    scope.state[231]="Adana|Adiyaman|Afyon|Agri|Aksaray|Amasya|Ankara|Antalya|Ardahan|Artvin|Aydin|Balikesir|Bartin|Batman|Bayburt|Bilecik|Bingol|Bitlis|Bolu|Burdur|Bursa|Canakkale|Cankiri|Corum|Denizli|Diyarbakir|Duzce|Edirne|Elazig|Erzincan|Erzurum|Eskisehir|Gaziantep|Giresun|Gumushane|Hakkari|Hatay|Icel|Igdir|Isparta|Istanbul|Izmir|Kahramanmaras|Karabuk|Karaman|Kars|Kastamonu|Kayseri|Kilis|Kirikkale|Kirklareli|Kirsehir|Kocaeli|Konya|Kutahya|Malatya|Manisa|Mardin|Mugla|Mus|Nevsehir|Nigde|Ordu|Osmaniye|Rize|Sakarya|Samsun|Sanliurfa|Siirt|Sinop|Sirnak|Sivas|Tekirdag|Tokat|Trabzon|Tunceli|Usak|Van|Yalova|Yozgat|Zonguldak";
                    scope.state[232]="Ahal Welayaty|Balkan Welayaty|Dashhowuz Welayaty|Lebap Welayaty|Mary Welayaty";
                    scope.state[233]="Tuvalu";
                    scope.state[234]="Adjumani|Apac|Arua|Bugiri|Bundibugyo|Bushenyi|Busia|Gulu|Hoima|Iganga|Jinja|Kabale|Kabarole|Kalangala|Kampala|Kamuli|Kapchorwa|Kasese|Katakwi|Kibale|Kiboga|Kisoro|Kitgum|Kotido|Kumi|Lira|Luwero|Masaka|Masindi|Mbale|Mbarara|Moroto|Moyo|Mpigi|Mubende|Mukono|Nakasongola|Nebbi|Ntungamo|Pallisa|Rakai|Rukungiri|Sembabule|Soroti|Tororo";
                    scope.state[235]="Avtonomna Respublika Krym (Simferopol')|Cherkas'ka (Cherkasy)|Chernihivs'ka (Chernihiv)|Chernivets'ka (Chernivtsi)|Dnipropetrovs'ka (Dnipropetrovs'k)|Donets'ka (Donets'k)|Ivano-Frankivs'ka (Ivano-Frankivs'k)|Kharkivs'ka (Kharkiv)|Khersons'ka (Kherson)|Khmel'nyts'ka (Khmel'nyts'kyy)|Kirovohrads'ka (Kirovohrad)|Kyyiv|Kyyivs'ka (Kiev)|L'vivs'ka (L'viv)|Luhans'ka (Luhans'k)|Mykolayivs'ka (Mykolayiv)|Odes'ka (Odesa)|Poltavs'ka (Poltava)|Rivnens'ka (Rivne)|Sevastopol'|Sums'ka (Sumy)|Ternopil's'ka (Ternopil')|Vinnyts'ka (Vinnytsya)|Volyns'ka (Luts'k)|Zakarpats'ka (Uzhhorod)|Zaporiz'ka (Zaporizhzhya)|Zhytomyrs'ka (Zhytomyr)"
                    scope.state[236]="'Ajman|Abu Zaby (Abu Dhabi)|Al Fujayrah|Ash Shariqah (Sharjah)|Dubayy (Dubai)|Ra's al Khaymah|Umm al Qaywayn";
                    scope.state[237]="Barking and Dagenham|Barnet|Barnsley|Bath and North East Somerset|Bedfordshire|Bexley|Birmingham|Blackburn with Darwen|Blackpool|Bolton|Bournemouth|Bracknell Forest|Bradford|Brent|Brighton and Hove|Bromley|Buckinghamshire|Bury|Calderdale|Cambridgeshire|Camden|Cheshire|City of Bristol|City of Kingston upon Hull|City of London|Cornwall|Coventry|Croydon|Cumbria|Darlington|Derby|Derbyshire|Devon|Doncaster|Dorset|Dudley|Durham|Ealing|East Riding of Yorkshire|East Sussex|Enfield|Essex|Gateshead|Gloucestershire|Greenwich|Hackney|Halton|Hammersmith and Fulham|Hampshire|Haringey|Harrow|Hartlepool|Havering|Herefordshire|Hertfordshire|Hillingdon|Hounslow|Isle of Wight|Islington|Kensington and Chelsea|Kent|Kingston upon Thames|Kirklees|Knowsley|Lambeth|Lancashire|Leeds|Leicester|Leicestershire|Lewisham|Lincolnshire|Liverpool|Luton|Manchester|Medway|Merton|Middlesbrough|Milton Keynes|Newcastle upon Tyne|Newham|Norfolk|North East Lincolnshire|North Lincolnshire|North Somerset|North Tyneside|North Yorkshire|Northamptonshire|Northumberland|Nottingham|Nottinghamshire|Oldham|Oxfordshire|Peterborough|Plymouth|Poole|Portsmouth|Reading|Redbridge|Redcar and Cleveland|Richmond upon Thames|Rochdale|Rotherham|Rutland|Salford|Sandwell|Sefton|Sheffield|Shropshire|Slough|Solihull|Somerset|South Gloucestershire|South Tyneside|Southampton|Southend-on-Sea|Southwark|St. Helens|Staffordshire|Stockport|Stockton-on-Tees|Stoke-on-Trent|Suffolk|Sunderland|Surrey|Sutton|Swindon|Tameside|Telford and Wrekin|Thurrock|Torbay|Tower Hamlets|Trafford|Wakefield|Walsall|Waltham Forest|Wandsworth|Warrington|Warwickshire|West Berkshire|West Sussex|Westminster|Wigan|Wiltshire|Windsor and Maidenhead|Wirral|Wokingham|Wolverhampton|Worcestershire|York";
                    scope.state[238]="Artigas|Canelones|Cerro Largo|Colonia|Durazno|Flores|Florida|Lavalleja|Maldonado|Montevideo|Paysandu|Rio Negro|Rivera|Rocha|Salto|San Jose|Soriano|Tacuarembo|Treinta y Tres";
                    scope.state[239]="Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming";
                    scope.state[240]="Andijon Wiloyati|Bukhoro Wiloyati|Farghona Wiloyati|Jizzakh Wiloyati|Khorazm Wiloyati (Urganch)|Namangan Wiloyati|Nawoiy Wiloyati|Qashqadaryo Wiloyati (Qarshi)|Qoraqalpoghiston (Nukus)|Samarqand Wiloyati|Sirdaryo Wiloyati (Guliston)|Surkhondaryo Wiloyati (Termiz)|Toshkent Shahri|Toshkent Wiloyati";
                    scope.state[241]="Malampa|Penama|Sanma|Shefa|Tafea|Torba";
                    scope.state[242]="Amazonas|Anzoategui|Apure|Aragua|Barinas|Bolivar|Carabobo|Cojedes|Delta Amacuro|Dependencias Federales|Distrito Federal|Falcon|Guarico|Lara|Merida|Miranda|Monagas|Nueva Esparta|Portuguesa|Sucre|Tachira|Trujillo|Vargas|Yaracuy|Zulia";
                    scope.state[243]="An Giang|Ba Ria-Vung Tau|Bac Giang|Bac Kan|Bac Lieu|Bac Ninh|Ben Tre|Binh Dinh|Binh Duong|Binh Phuoc|Binh Thuan|Ca Mau|Can Tho|Cao Bang|Da Nang|Dac Lak|Dong Nai|Dong Thap|Gia Lai|Ha Giang|Ha Nam|Ha Noi|Ha Tay|Ha Tinh|Hai Duong|Hai Phong|Ho Chi Minh|Hoa Binh|Hung Yen|Khanh Hoa|Kien Giang|Kon Tum|Lai Chau|Lam Dong|Lang Son|Lao Cai|Long An|Nam Dinh|Nghe An|Ninh Binh|Ninh Thuan|Phu Tho|Phu Yen|Quang Binh|Quang Nam|Quang Ngai|Quang Ninh|Quang Tri|Soc Trang|Son La|Tay Ninh|Thai Binh|Thai Nguyen|Thanh Hoa|Thua Thien-Hue|Tien Giang|Tra Vinh|Tuyen Quang|Vinh Long|Vinh Phuc|Yen Bai";
                    scope.state[244]="Saint Croix|Saint John|Saint Thomas";
                    scope.state[245]="Blaenau Gwent|Bridgend|Caerphilly|Cardiff|Carmarthenshire|Ceredigion|Conwy|Denbighshire|Flintshire|Gwynedd|Isle of Anglesey|Merthyr Tydfil|Monmouthshire|Neath Port Talbot|Newport|Pembrokeshire|Powys|Rhondda Cynon Taff|Swansea|The Vale of Glamorgan|Torfaen|Wrexham";
                    scope.state[246]="Alo|Sigave|Wallis";
                    scope.state[247]="West Bank";
                    scope.state[248]="Western Sahara";
                    scope.state[249]="'Adan|'Ataq|Abyan|Al Bayda'|Al Hudaydah|Al Jawf|Al Mahrah|Al Mahwit|Dhamar|Hadhramawt|Hajjah|Ibb|Lahij|Ma'rib|Sa'dah|San'a'|Ta'izz";
                    scope.state[250]="Kosovo|Montenegro|Serbia|Vojvodina";
                    scope.state[251]="Central|Copperbelt|Eastern|Luapula|Lusaka|North-Western|Northern|Southern|Western";
                    scope.state[252]="Bulawayo|Harare|ManicalandMashonaland Central|Mashonaland East|Mashonaland West|Masvingo|Matabeleland North|Matabeleland South|Midlands";


                    scope.selectCountry = function(){
                        var indexCountry = scope.countries.indexOf(scope.country);
                        scope.states = scope.state[indexCountry].split("|");

                        if(scope.states.length == 1){
                            scope.states = new Array(scope.country);
                        }
                        //indexCountry correspond to the "Select" label
                        if(indexCountry == 0){
                            scope.states = new Array("");
                        }

                    }

                    //Back compatibility for the option defaultCountry for choosing a default country.
                    //Instead, you can use the scope.country as default value when is possible
                    if(typeof scope.country  == 'undefined' && typeof  attrs.defaultCountry != 'undefined'){
                      scope.country = attrs.defaultCountry;
                      scope.selectCountry();
                    } else if (typeof scope.country  != 'undefined') {
                      scope.selectCountry();
                    }



                }
            };
        }]);

}());

/**
 * dirPagination - AngularJS module for paginating (almost) anything.
 *
 *
 * Credits
 * =======
 *
 * Daniel Tabuenca: https://groups.google.com/d/msg/angular/an9QpzqIYiM/r8v-3W1X5vcJ
 * for the idea on how to dynamically invoke the ng-repeat directive.
 *
 * I borrowed a couple of lines and a few attribute names from the AngularUI Bootstrap project:
 * https://github.com/angular-ui/bootstrap/blob/master/src/pagination/pagination.js
 *
 * Copyright 2014 Michael Bromley <michael@michaelbromley.co.uk>
 */

(function() {

    /**
     * Config
     */
    var moduleName = 'angularUtils.directives.dirPagination';
    var DEFAULT_ID = '__default';

    /**
     * Module
     */
    angular.module(moduleName, [])
        .directive('dirPaginate', ['$compile', '$parse', 'paginationService', dirPaginateDirective])
        .directive('dirPaginateNoCompile', noCompileDirective)
        .directive('dirPaginationControls', ['paginationService', 'paginationTemplate', dirPaginationControlsDirective])
        .filter('itemsPerPage', ['paginationService', itemsPerPageFilter])
        .service('paginationService', paginationService)
        .provider('paginationTemplate', paginationTemplateProvider)
        .run(['$templateCache',dirPaginationControlsTemplateInstaller]);

    function dirPaginateDirective($compile, $parse, paginationService) {

        return  {
            terminal: true,
            multiElement: true,
            priority: 100,
            compile: dirPaginationCompileFn
        };

        function dirPaginationCompileFn(tElement, tAttrs){

            var expression = tAttrs.dirPaginate;
            // regex taken directly from https://github.com/angular/angular.js/blob/v1.4.x/src/ng/directive/ngRepeat.js#L339
            var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);

            var filterPattern = /\|\s*itemsPerPage\s*:\s*(.*\(\s*\w*\)|([^\)]*?(?=\s+as\s+))|[^\)]*)/;
            if (match[2].match(filterPattern) === null) {
                throw 'pagination directive: the \'itemsPerPage\' filter must be set.';
            }
            var itemsPerPageFilterRemoved = match[2].replace(filterPattern, '');
            var collectionGetter = $parse(itemsPerPageFilterRemoved);

            addNoCompileAttributes(tElement);

            // If any value is specified for paginationId, we register the un-evaluated expression at this stage for the benefit of any
            // dir-pagination-controls directives that may be looking for this ID.
            var rawId = tAttrs.paginationId || DEFAULT_ID;
            paginationService.registerInstance(rawId);

            return function dirPaginationLinkFn(scope, element, attrs){

                // Now that we have access to the `scope` we can interpolate any expression given in the paginationId attribute and
                // potentially register a new ID if it evaluates to a different value than the rawId.
                var paginationId = $parse(attrs.paginationId)(scope) || attrs.paginationId || DEFAULT_ID;
                
                // (TODO: this seems sound, but I'm reverting as many bug reports followed it's introduction in 0.11.0.
                // Needs more investigation.)
                // In case rawId != paginationId we deregister using rawId for the sake of general cleanliness
                // before registering using paginationId
                // paginationService.deregisterInstance(rawId);
                paginationService.registerInstance(paginationId);

                var repeatExpression = getRepeatExpression(expression, paginationId);
                addNgRepeatToElement(element, attrs, repeatExpression);

                removeTemporaryAttributes(element);
                var compiled =  $compile(element);

                var currentPageGetter = makeCurrentPageGetterFn(scope, attrs, paginationId);
                paginationService.setCurrentPageParser(paginationId, currentPageGetter, scope);

                if (typeof attrs.totalItems !== 'undefined') {
                    paginationService.setAsyncModeTrue(paginationId);
                    scope.$watch(function() {
                        return $parse(attrs.totalItems)(scope);
                    }, function (result) {
                        if (0 <= result) {
                            paginationService.setCollectionLength(paginationId, result);
                        }
                    });
                } else {
                    paginationService.setAsyncModeFalse(paginationId);
                    scope.$watchCollection(function() {
                        return collectionGetter(scope);
                    }, function(collection) {
                        if (collection) {
                            var collectionLength = (collection instanceof Array) ? collection.length : Object.keys(collection).length;
                            paginationService.setCollectionLength(paginationId, collectionLength);
                        }
                    });
                }

                // Delegate to the link function returned by the new compilation of the ng-repeat
                compiled(scope);
                 
                // (TODO: Reverting this due to many bug reports in v 0.11.0. Needs investigation as the
                // principle is sound)
                // When the scope is destroyed, we make sure to remove the reference to it in paginationService
                // so that it can be properly garbage collected
                // scope.$on('$destroy', function destroyDirPagination() {
                //     paginationService.deregisterInstance(paginationId);
                // });
            };
        }

        /**
         * If a pagination id has been specified, we need to check that it is present as the second argument passed to
         * the itemsPerPage filter. If it is not there, we add it and return the modified expression.
         *
         * @param expression
         * @param paginationId
         * @returns {*}
         */
        function getRepeatExpression(expression, paginationId) {
            var repeatExpression,
                idDefinedInFilter = !!expression.match(/(\|\s*itemsPerPage\s*:[^|]*:[^|]*)/);

            if (paginationId !== DEFAULT_ID && !idDefinedInFilter) {
                repeatExpression = expression.replace(/(\|\s*itemsPerPage\s*:\s*[^|\s]*)/, "$1 : '" + paginationId + "'");
            } else {
                repeatExpression = expression;
            }

            return repeatExpression;
        }

        /**
         * Adds the ng-repeat directive to the element. In the case of multi-element (-start, -end) it adds the
         * appropriate multi-element ng-repeat to the first and last element in the range.
         * @param element
         * @param attrs
         * @param repeatExpression
         */
        function addNgRepeatToElement(element, attrs, repeatExpression) {
            if (element[0].hasAttribute('dir-paginate-start') || element[0].hasAttribute('data-dir-paginate-start')) {
                // using multiElement mode (dir-paginate-start, dir-paginate-end)
                attrs.$set('ngRepeatStart', repeatExpression);
                element.eq(element.length - 1).attr('ng-repeat-end', true);
            } else {
                attrs.$set('ngRepeat', repeatExpression);
            }
        }

        /**
         * Adds the dir-paginate-no-compile directive to each element in the tElement range.
         * @param tElement
         */
        function addNoCompileAttributes(tElement) {
            angular.forEach(tElement, function(el) {
                if (el.nodeType === 1) {
                    angular.element(el).attr('dir-paginate-no-compile', true);
                }
            });
        }

        /**
         * Removes the variations on dir-paginate (data-, -start, -end) and the dir-paginate-no-compile directives.
         * @param element
         */
        function removeTemporaryAttributes(element) {
            angular.forEach(element, function(el) {
                if (el.nodeType === 1) {
                    angular.element(el).removeAttr('dir-paginate-no-compile');
                }
            });
            element.eq(0).removeAttr('dir-paginate-start').removeAttr('dir-paginate').removeAttr('data-dir-paginate-start').removeAttr('data-dir-paginate');
            element.eq(element.length - 1).removeAttr('dir-paginate-end').removeAttr('data-dir-paginate-end');
        }

        /**
         * Creates a getter function for the current-page attribute, using the expression provided or a default value if
         * no current-page expression was specified.
         *
         * @param scope
         * @param attrs
         * @param paginationId
         * @returns {*}
         */
        function makeCurrentPageGetterFn(scope, attrs, paginationId) {
            var currentPageGetter;
            if (attrs.currentPage) {
                currentPageGetter = $parse(attrs.currentPage);
            } else {
                // If the current-page attribute was not set, we'll make our own.
                // Replace any non-alphanumeric characters which might confuse
                // the $parse service and give unexpected results.
                // See https://github.com/michaelbromley/angularUtils/issues/233
                var defaultCurrentPage = (paginationId + '__currentPage').replace(/\W/g, '_');
                scope[defaultCurrentPage] = 1;
                currentPageGetter = $parse(defaultCurrentPage);
            }
            return currentPageGetter;
        }
    }

    /**
     * This is a helper directive that allows correct compilation when in multi-element mode (ie dir-paginate-start, dir-paginate-end).
     * It is dynamically added to all elements in the dir-paginate compile function, and it prevents further compilation of
     * any inner directives. It is then removed in the link function, and all inner directives are then manually compiled.
     */
    function noCompileDirective() {
        return {
            priority: 5000,
            terminal: true
        };
    }

    function dirPaginationControlsTemplateInstaller($templateCache) {
        $templateCache.put('angularUtils.directives.dirPagination.template',
            '<md-content class="md-padding" layout="row" layout-align="center center">' +
            '<div>'+
            '<div layout="row" layout-align="center space-between" class="pagination" ng-if="1 < pages.length || !autoHide">' +
            '<div ng-if="boundaryLinks">' +
            '<md-button class="md-icon-button md-raised " ng-click="setCurrent(1)" ng-class="{ disabled : pagination.current == 1 }">' +
            '&laquo;' +
            '</md-button>' +
            '</div>' +
            '<div ng-if="directionLinks">' +
            '<md-button class="md-icon-button md-raised " ng-click="setCurrent(pagination.current - 1)" ng-class="{ disabled : pagination.current == 1 }">' +
            '&lsaquo;' +
            '</md-button>' +
            '</div>' +
            '<div ng-repeat="pageNumber in pages track by tracker(pageNumber, $index)">' +
            '<md-button class="md-icon-button md-raised " ng-click="setCurrent(pageNumber)" aria-label="page {{ pageNumber }}" ng-class="{ mdprimary : pagination.current == pageNumber, pageDisabled : pageNumber == \'...\' || ( ! autoHide && pages.length === 1 ) }">'+
            '{{ pageNumber }}' +
            '</md-button>'+
            '</div>' +
            '<div ng-if="directionLinks">' +
            '<md-button class="md-icon-button md-raised " ng-click="setCurrent(pagination.current + 1)" ng-class="{ disabled : pagination.current == pagination.last }">' +
            '&rsaquo;' +
            '</md-button>' +
            '</div>' +
            '<div ng-if="boundaryLinks">' +
            '<md-button class="md-icon-button md-raised " ng-click="setCurrent(pagination.last)" ng-class="{ disabled : pagination.current == pagination.last }">' +
            '&raquo;' +
            '</md-button>' +
            '</div>' +
            '</div>'+
            '</div>'+
            '</md-content>'
        );


    }

    function dirPaginationControlsDirective(paginationService, paginationTemplate) {

        var numberRegex = /^\d+$/;

        var DDO = {
            restrict: 'AE',
            scope: {
                maxSize: '=?',
                onPageChange: '&?',
                paginationId: '=?',
                autoHide: '=?'
            },
            link: dirPaginationControlsLinkFn
        };

        // We need to check the paginationTemplate service to see whether a template path or
        // string has been specified, and add the `template` or `templateUrl` property to
        // the DDO as appropriate. The order of priority to decide which template to use is
        // (highest priority first):
        // 1. paginationTemplate.getString()
        // 2. attrs.templateUrl
        // 3. paginationTemplate.getPath()
        var templateString = paginationTemplate.getString();
        if (templateString !== undefined) {
            DDO.template = templateString;
        } else {
            DDO.templateUrl = function(elem, attrs) {
                return attrs.templateUrl || paginationTemplate.getPath();
            };
        }
        return DDO;

        function dirPaginationControlsLinkFn(scope, element, attrs) {

            // rawId is the un-interpolated value of the pagination-id attribute. This is only important when the corresponding dir-paginate directive has
            // not yet been linked (e.g. if it is inside an ng-if block), and in that case it prevents this controls directive from assuming that there is
            // no corresponding dir-paginate directive and wrongly throwing an exception.
            var rawId = attrs.paginationId ||  DEFAULT_ID;
            var paginationId = scope.paginationId || attrs.paginationId ||  DEFAULT_ID;

            if (!paginationService.isRegistered(paginationId) && !paginationService.isRegistered(rawId)) {
                var idMessage = (paginationId !== DEFAULT_ID) ? ' (id: ' + paginationId + ') ' : ' ';
                if (window.console) {
                    console.warn('Pagination directive: the pagination controls' + idMessage + 'cannot be used without the corresponding pagination directive, which was not found at link time.');
                }
            }

            if (!scope.maxSize) { scope.maxSize = 9; }
            scope.autoHide = scope.autoHide === undefined ? true : scope.autoHide;
            scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : true;
            scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : false;

            var paginationRange = Math.max(scope.maxSize, 5);
            scope.pages = [];
            scope.pagination = {
                last: 1,
                current: 1
            };
            scope.range = {
                lower: 1,
                upper: 1,
                total: 1
            };

            scope.$watch('maxSize', function(val) {
                if (val) {
                    paginationRange = Math.max(scope.maxSize, 5);
                    generatePagination();
                }
            });

            scope.$watch(function() {
                if (paginationService.isRegistered(paginationId)) {
                    return (paginationService.getCollectionLength(paginationId) + 1) * paginationService.getItemsPerPage(paginationId);
                }
            }, function(length) {
                if (0 < length) {
                    generatePagination();
                }
            });

            scope.$watch(function() {
                if (paginationService.isRegistered(paginationId)) {
                    return (paginationService.getItemsPerPage(paginationId));
                }
            }, function(current, previous) {
                if (current != previous && typeof previous !== 'undefined') {
                    goToPage(scope.pagination.current);
                }
            });

            scope.$watch(function() {
                if (paginationService.isRegistered(paginationId)) {
                    return paginationService.getCurrentPage(paginationId);
                }
            }, function(currentPage, previousPage) {
                if (currentPage != previousPage) {
                    goToPage(currentPage);
                }
            });

            scope.setCurrent = function(num) {
                if (paginationService.isRegistered(paginationId) && isValidPageNumber(num)) {
                    num = parseInt(num, 10);
                    paginationService.setCurrentPage(paginationId, num);
                }
            };

            /**
             * Custom "track by" function which allows for duplicate "..." entries on long lists,
             * yet fixes the problem of wrongly-highlighted links which happens when using
             * "track by $index" - see https://github.com/michaelbromley/angularUtils/issues/153
             * @param id
             * @param index
             * @returns {string}
             */
            scope.tracker = function(id, index) {
                return id + '_' + index;
            };

            function goToPage(num) {
                if (paginationService.isRegistered(paginationId) && isValidPageNumber(num)) {
                    var oldPageNumber = scope.pagination.current;

                    scope.pages = generatePagesArray(num, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
                    scope.pagination.current = num;
                    updateRangeValues();

                    // if a callback has been set, then call it with the page number as the first argument
                    // and the previous page number as a second argument
                    if (scope.onPageChange) {
                        scope.onPageChange({
                            newPageNumber : num,
                            oldPageNumber : oldPageNumber
                        });
                    }
                }
            }

            function generatePagination() {
                if (paginationService.isRegistered(paginationId)) {
                    var page = parseInt(paginationService.getCurrentPage(paginationId)) || 1;
                    scope.pages = generatePagesArray(page, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
                    scope.pagination.current = page;
                    scope.pagination.last = scope.pages[scope.pages.length - 1];
                    if (scope.pagination.last < scope.pagination.current) {
                        scope.setCurrent(scope.pagination.last);
                    } else {
                        updateRangeValues();
                    }
                }
            }

            /**
             * This function updates the values (lower, upper, total) of the `scope.range` object, which can be used in the pagination
             * template to display the current page range, e.g. "showing 21 - 40 of 144 results";
             */
            function updateRangeValues() {
                if (paginationService.isRegistered(paginationId)) {
                    var currentPage = paginationService.getCurrentPage(paginationId),
                        itemsPerPage = paginationService.getItemsPerPage(paginationId),
                        totalItems = paginationService.getCollectionLength(paginationId);

                    scope.range.lower = (currentPage - 1) * itemsPerPage + 1;
                    scope.range.upper = Math.min(currentPage * itemsPerPage, totalItems);
                    scope.range.total = totalItems;
                }
            }
            function isValidPageNumber(num) {
                return (numberRegex.test(num) && (0 < num && num <= scope.pagination.last));
            }
        }

        /**
         * Generate an array of page numbers (or the '...' string) which is used in an ng-repeat to generate the
         * links used in pagination
         *
         * @param currentPage
         * @param rowsPerPage
         * @param paginationRange
         * @param collectionLength
         * @returns {Array}
         */
        function generatePagesArray(currentPage, collectionLength, rowsPerPage, paginationRange) {
            var pages = [];
            var totalPages = Math.ceil(collectionLength / rowsPerPage);
            var halfWay = Math.ceil(paginationRange / 2);
            var position;

            if (currentPage <= halfWay) {
                position = 'start';
            } else if (totalPages - halfWay < currentPage) {
                position = 'end';
            } else {
                position = 'middle';
            }

            var ellipsesNeeded = paginationRange < totalPages;
            var i = 1;
            while (i <= totalPages && i <= paginationRange) {
                var pageNumber = calculatePageNumber(i, currentPage, paginationRange, totalPages);

                var openingEllipsesNeeded = (i === 2 && (position === 'middle' || position === 'end'));
                var closingEllipsesNeeded = (i === paginationRange - 1 && (position === 'middle' || position === 'start'));
                if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
                    pages.push('...');
                } else {
                    pages.push(pageNumber);
                }
                i ++;
            }
            return pages;
        }

        /**
         * Given the position in the sequence of pagination links [i], figure out what page number corresponds to that position.
         *
         * @param i
         * @param currentPage
         * @param paginationRange
         * @param totalPages
         * @returns {*}
         */
        function calculatePageNumber(i, currentPage, paginationRange, totalPages) {
            var halfWay = Math.ceil(paginationRange/2);
            if (i === paginationRange) {
                return totalPages;
            } else if (i === 1) {
                return i;
            } else if (paginationRange < totalPages) {
                if (totalPages - halfWay < currentPage) {
                    return totalPages - paginationRange + i;
                } else if (halfWay < currentPage) {
                    return currentPage - halfWay + i;
                } else {
                    return i;
                }
            } else {
                return i;
            }
        }
    }

    /**
     * This filter slices the collection into pages based on the current page number and number of items per page.
     * @param paginationService
     * @returns {Function}
     */
    function itemsPerPageFilter(paginationService) {

        return function(collection, itemsPerPage, paginationId) {
            if (typeof (paginationId) === 'undefined') {
                paginationId = DEFAULT_ID;
            }
            if (!paginationService.isRegistered(paginationId)) {
                throw 'pagination directive: the itemsPerPage id argument (id: ' + paginationId + ') does not match a registered pagination-id.';
            }
            var end;
            var start;
            if (angular.isObject(collection)) {
                itemsPerPage = parseInt(itemsPerPage) || 9999999999;
                if (paginationService.isAsyncMode(paginationId)) {
                    start = 0;
                } else {
                    start = (paginationService.getCurrentPage(paginationId) - 1) * itemsPerPage;
                }
                end = start + itemsPerPage;
                paginationService.setItemsPerPage(paginationId, itemsPerPage);

                if (collection instanceof Array) {
                    // the array just needs to be sliced
                    return collection.slice(start, end);
                } else {
                    // in the case of an object, we need to get an array of keys, slice that, then map back to
                    // the original object.
                    var slicedObject = {};
                    angular.forEach(keys(collection).slice(start, end), function(key) {
                        slicedObject[key] = collection[key];
                    });
                    return slicedObject;
                }
            } else {
                return collection;
            }
        };
    }

    /**
     * Shim for the Object.keys() method which does not exist in IE < 9
     * @param obj
     * @returns {Array}
     */
    function keys(obj) {
        if (!Object.keys) {
            var objKeys = [];
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    objKeys.push(i);
                }
            }
            return objKeys;
        } else {
            return Object.keys(obj);
        }
    }

    /**
     * This service allows the various parts of the module to communicate and stay in sync.
     */
    function paginationService() {

        var instances = {};
        var lastRegisteredInstance;

        this.registerInstance = function(instanceId) {
            if (typeof instances[instanceId] === 'undefined') {
                instances[instanceId] = {
                    asyncMode: false
                };
                lastRegisteredInstance = instanceId;
            }
        };

        this.deregisterInstance = function(instanceId) {
            delete instances[instanceId];
        };
        
        this.isRegistered = function(instanceId) {
            return (typeof instances[instanceId] !== 'undefined');
        };

        this.getLastInstanceId = function() {
            return lastRegisteredInstance;
        };

        this.setCurrentPageParser = function(instanceId, val, scope) {
            instances[instanceId].currentPageParser = val;
            instances[instanceId].context = scope;
        };
        this.setCurrentPage = function(instanceId, val) {
            instances[instanceId].currentPageParser.assign(instances[instanceId].context, val);
        };
        this.getCurrentPage = function(instanceId) {
            var parser = instances[instanceId].currentPageParser;
            return parser ? parser(instances[instanceId].context) : 1;
        };

        this.setItemsPerPage = function(instanceId, val) {
            instances[instanceId].itemsPerPage = val;
        };
        this.getItemsPerPage = function(instanceId) {
            return instances[instanceId].itemsPerPage;
        };

        this.setCollectionLength = function(instanceId, val) {
            instances[instanceId].collectionLength = val;
        };
        this.getCollectionLength = function(instanceId) {
            return instances[instanceId].collectionLength;
        };

        this.setAsyncModeTrue = function(instanceId) {
            instances[instanceId].asyncMode = true;
        };

        this.setAsyncModeFalse = function(instanceId) {
            instances[instanceId].asyncMode = false;
        };

        this.isAsyncMode = function(instanceId) {
            return instances[instanceId].asyncMode;
        };
    }

    /**
     * This provider allows global configuration of the template path used by the dir-pagination-controls directive.
     */
    function paginationTemplateProvider() {

        var templatePath = 'angularUtils.directives.dirPagination.template';
        var templateString;

        /**
         * Set a templateUrl to be used by all instances of <dir-pagination-controls>
         * @param {String} path
         */
        this.setPath = function(path) {
            templatePath = path;
        };

        /**
         * Set a string of HTML to be used as a template by all instances
         * of <dir-pagination-controls>. If both a path *and* a string have been set,
         * the string takes precedence.
         * @param {String} str
         */
        this.setString = function(str) {
            templateString = str;
        };

        this.$get = function() {
            return {
                getPath: function() {
                    return templatePath;
                },
                getString: function() {
                    return templateString;
                }
            };
        };
    }
})();

(function() {
  'use strict';

  /**
   * Usage pattern
   * <ds-widget-clock data-gmt-offset="0"></ds-widget-clock> 
   */
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  angular.module('ds.clock', [])
    .directive('dsWidgetClock', ['$interval', '$filter',
      function($interval, $filter) {
        return clock($interval, $filter);
      }
    ]);

  function clock($interval, $filter) {
    return {
      restrict: 'EA',
      scope: {
        gmtOffset: '=gmtOffset',
        digitalFormat: '=digitalFormat',
        showDigital: '=showDigital',
        showAnalog: '=showAnalog',
        startTime: '=startTime',
        theme: '=theme'
      },
      template: '<div class="widget-clock" ng-class="themeClass" ng-if="date"><div class="digital" ng-if="digital"><span class="time"><span class="hours">{{digital}}</span></span></div><div class="analog" ng-if="analog"><div class="square"><svg viewBox="0 0 100 100"><g transform="translate(50,50)"><circle class="clock-face" r="48" /><line ng-repeat="minor in minors track by $index" class="minor" y1="42" y2="45" ng-attr-transform="rotate({{360 * $index / minors.length}})" /><line ng-repeat="major in majors track by $index" class="major" y1="35" y2="46" ng-attr-transform="rotate({{360 * $index / majors.length}})" /><line class="hour" y1="2" y2="-20" ng-attr-transform="rotate({{30 * date.hrs + date.mins / 2}})" /><line class="minute" y1="4" y2="-30" ng-attr-transform="rotate({{6 * date.mins + date.secs / 10}})" /><g ng-attr-transform="rotate({{6 * date.secs}})"><line class="second" y1="10" y2="-38" /><line class="second-counterweight" y1="10" y2="2" /></g></g></svg></div></div><div ng-if="gmtInfo" class="gmt-info">{{gmtInfo}}</div></div>',
      link: function(scope, element, attrs) {
        var format, // date format
          stopTime; // so that we can cancel the time updates
        var o = {};
        var gmtOffset = scope.gmtOffset;
        var digitalFormat = scope.digitalFormat ? scope.digitalFormat : 'HH:mm:ss';
        o.showDigital = scope.showDigital != null ? scope.showDigital : attrs.showDigital !== undefined ? true : false;
        o.showAnalog = scope.showAnalog != null ? scope.showAnalog : attrs.showAnalog !== undefined ? true : false;
        o.showGmtInfo = attrs.showGmtInfo !== undefined ? true : false;
        o.startTime = parseInt(scope.startTime, 10); // ms
        scope.themeClass = scope.theme ? scope.theme : attrs.theme ? attrs.theme : 'light';
        if (!o.showDigital && !o.showAnalog) {
          o.showAnalog = true;
          o.showDigital = true;
        }
        scope.gmtInfo = false;

        scope.date = getDate(o);

        scope.digital = o.showDigital ? 'Loading..' : false;
        scope.analog = o.showAnalog;
        scope.majors = new Array(12);
        scope.minors = new Array(60);
        var date = null;
        var tick = function() {
          if (!isNaN(o.startTime)) {
            o.startTime = o.startTime + 1000;
          }
          date = getDate(o);
          scope.date = date;
          if (o.showDigital) {
            scope.digital = timeText(date, digitalFormat, gmtOffset, $filter);
          }
        };

        stopTime = $interval(tick, 1000);
        // watch the expression, and update the UI on change.
        scope.$watch('gmtOffset', function(value, old) {
          
          gmtOffset = value;
          o.gmtOffset = (gmtOffset != null) ? getGMTbase100(gmtOffset) : false;
          if (o.showGmtInfo && o.gmtOffset !== false) {
            scope.gmtInfo = getGMTText(o.gmtOffset);
          }
          
          tick();
        });
        scope.$watch('digitalFormat', function(value, old) {
          if(value != old){
            digitalFormat = value;
          }
        });
        scope.$watch('showDigital', function(value, old) {
          if(value != old){
            o.showDigital = value;
            scope.digital = o.showDigital ? 'Loading..' : false;;
          }
        });
        scope.$watch('showAnalog', function(value, old) {
          if(value != old){
            o.showAnalog = value;
            scope.analog = value;
          }
        });
        scope.$watch('theme', function(value, old) {
          if(value != old){
            scope.themeClass = value ? value : attrs.theme ? attrs.theme : 'light';
          }
        });
        // listen on DOM destroy (removal) event, and cancel the next UI update
        // to prevent updating time after the DOM element was removed.
        element.on('$destroy', function() {
          $interval.cancel(stopTime);
          stopTime = null;
        });

      }
    };
  }

  function getGMTbase100(offset) {
    offset = parseFloat(offset);
    var f = offset > 0 ? Math.floor(offset) : Math.ceil(offset),
      s = (offset % 1) / 0.6;

    return f + s;

  }

  function getGMTbase60(offset) {
    var f = offset > 0 ? Math.floor(offset) : Math.ceil(offset),
      s = ((offset > 0 ? offset : offset * -1) % 1) * 60;
    return f + s;

  }

  function getGMTText(offset) {

    var f = offset > 0 ? Math.floor(offset) : Math.ceil(offset),
      s = Math.round(((offset > 0 ? offset : offset * -1) % 1) * 60);

    return 'GMT' + (offset === 0 ? '' : ((offset > 0 ? ' +' : ' ') + lpad(f) + '.' + rpad(s).substring(0, 2)));

  }

  function lpad(num) {
    if (num < 0) {
      return (num > -10 ? '-0' : '-') + (num * -1);
    } else {
      return (num < 10 ? '0' : '') + num;
    }

  }

  function rpad(num) {
    return num + (num < 10 ? '0' : '');
  }
  // Checkfor offset and get correct time
  function getDate(o) {
    var now = (!isNaN(o.startTime)) ? new Date(o.startTime) : new Date();
    if (o.gmtOffset !== null && o.gmtOffset !== false) {
      /*Use GMT + gmtOffset
      convert to msec
      add local time zone offset
      get UTC time in msec*/
      var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      // create new Date object for different city
      // using supplied offset
      var offsetNow = new Date(utc + (3600000 * o.gmtOffset));
      return {
        hrs: offsetNow.getHours(),
        mins: offsetNow.getMinutes(),
        secs: offsetNow.getSeconds(),
        date: offsetNow
      };
    } else {
      // Use local time
      return {
        hrs: now.getHours(),
        mins: now.getMinutes(),
        secs: now.getSeconds(),
        date: now
      };
    }
  }

  function timeText(d, format, timezone, $filter) {
    return $filter('date')(d.date, format, timezone);
  }

})();

angular
    .module('ngMdWidgetEngine', ['ngMaterial']);

// app
angular
    .module('ngMdWidgetEngine')
    .directive('mdWidgetEngineWidgetDragger', mdWidgetEngineWidgetTileDragger)
    .directive('mdWidgetEngineWidgetTileContentHtml', mdWidgetEngineWidgetTileContentHtml)
    .directive('mdWidgetEngineWidgetTile', mdWidgetEngineWidgetTileDirective)
    .directive('mdWidgetEngineColumn', mdWidgetEngineColumnDirective)
    .directive('mdWidgetEngine', mdWidgetEngineDirective);


// Every widget engine has X columns
function mdWidgetEngineColumnDirective(){
    return {
        scope: false,
        templateUrl: "/src/components/widgetEngine/templates/widgetEngineColumn.html",
        controller: ['$scope','$element','$attrs', '$transclude','$document','$timeout', function($scope, $element, $attrs, $transclude, $document, $timeout){
            $scope.widgetEngineClientRect = {};

            var mouseMove = function(e){
                // console.log("mouse moving", e);
                var newX = e.clientX - $scope.widgetEngineClientRect.left + 16;
                var differenceXPercentage =  ((newX - $element[0].children[0].offsetLeft) / $scope.widgetEngineClientRect.width) * 100;
                // don't allow doing anything the affected column is 15% already now
                
                if($scope.configuration.columns[$scope.columnIndex + 1].size - (differenceXPercentage - $scope.column.size) <=15)
                    return;
                if($scope.configuration.columns[$scope.columnIndex].size <= 15 && differenceXPercentage <= 15)
                    return;
                if($scope.configuration.columns[$scope.columnIndex + 1])
                    $scope.configuration.columns[$scope.columnIndex + 1].size -= differenceXPercentage - $scope.column.size;

                $scope.column.size = differenceXPercentage;
                $timeout(function(){
                    
                });
                
            };

            var mouseUp = function(){
                // console.log("mouse up");
                $document.unbind('mouseup', mouseUp);
                $document.unbind('mousemove', mouseMove);
                $scope.callback("resize", $scope.configuration);
            };

            $scope.setupColumnResizing = function(e){
                event.preventDefault();
                // console.log("mouse down", e);
                $document.on('mouseup', mouseUp);
                $document.on('mousemove', mouseMove);
                $scope.widgetEngineClientRect = $element.parent().parent()[0].getBoundingClientRect();
                
            };

            $scope.addNewColumn = function(){
                var newColumn = angular.copy($scope.configuration.columns[$scope.columnIndex]);
                newColumn.widgets = []; // reset the columns
                newColumn.size = '';
                $timeout(function(){
                    $scope.configuration.columns.splice($scope.columnIndex + 1, 0, newColumn);
                });
            };

            $scope.removeEmptyColumn = function(){
                if($scope.configuration.columns[$scope.columnIndex + 1] && $scope.configuration.columns[$scope.columnIndex -1]){
                    $scope.configuration.columns[$scope.columnIndex + 1].size += $scope.column.size / 2;
                    $scope.configuration.columns[$scope.columnIndex - 1].size += $scope.column.size / 2;
                }else if($scope.configuration.columns[$scope.columnIndex + 1]){
                    $scope.configuration.columns[$scope.columnIndex + 1].size += $scope.column.size;
                }else if($scope.configuration.columns[$scope.columnIndex - 1].size){
                    $scope.configuration.columns[$scope.columnIndex - 1].size += $scope.column.size;
                }

                var removedColumn = $scope.configuration.columns.splice($scope.columnIndex, 1);
                // check if the total width is less than 100% due to resizing of last column and deleting an empty column
                var totalWidth = 0;
                $scope.configuration.columns.forEach(function(c){
                    totalWidth+= c.size;
                });

                /*
                if(totalWidth < 100){
                    // increase the width of columns after the deleted one, equally
                    var currentDeletedColumn = $scope.columnIndex;
                    var totalColumns = $scope.configuration.columns.length;
                    var affectedColumns = totalColumns - currentDeletedColumn;
                    var distributeWidth = (100 - totalWidth) / affectedColumns;
                    for(var i=currentDeletedColumn-1; i<totalColumns; i++){
                        $scope.configuration.columns[i].size += distributeWidth;
                    }
                }
                */
            };

            // this is only needed when ther are 2 widget engines on the same page; the scope of parent is shared
            $scope.isAnyWidgetMoving = function(){
                var isMoving = false;
                $scope.configuration.columns.forEach(function(c){
                    c.widgets.forEach(function(w){
                        if(w._internalSettings.isMoving) isMoving = true;
                    });
                });
                return isMoving;
            };

            $element.on('dragenter', function(event){
                if(!$scope.isAnyWidgetMoving()) return false;
                $element.addClass("md-widget-engine-column-dashed");
                event.stopPropagation();
            });

            $element.on('dragover', function(event){
                if(!$scope.isAnyWidgetMoving()) return false;
                $element.addClass("md-widget-engine-column-dashed");
                event.stopPropagation();
                if(event.preventDefault) event.preventDefault();
            });

            $element.on('dragleave', function(event){
                if(!$scope.isAnyWidgetMoving()) return false;
                $element.removeClass("md-widget-engine-column-dashed");
                event.stopPropagation();
            });

            $element.on('drop', function(event){
                if(!$scope.isAnyWidgetMoving()) return false;
                // get the positions of swappers
                var draggerPosition = (event.dataTransfer.getData("Text") || event.dataTransfer.getData("text/plain")).split("::");
                if($scope.columnIndex == draggerPosition[0]){
                    $element.removeClass("md-widget-engine-column-dashed");
                    return;  // if dropping in the same column  
                }
                // get the elements
                var draggerElement = $scope.configuration.columns[draggerPosition[0]].widgets[draggerPosition[1]];
                // swap the elements
                var removedWidget = $scope.configuration.columns[draggerPosition[0]].widgets.splice(draggerPosition[1], 1)[0];
                $scope.configuration.columns[$scope.columnIndex].widgets.push(removedWidget);
                // assign configurations
                $element.removeClass("md-widget-engine-column-dashed");
                $document.find(".md-widget-engine-column-dashed").removeClass('md-widget-engine-column-dashed');
                $timeout(function(){
                    $scope.$apply();
                    $scope.callback("update", $scope.configuration);
                }, 150);
                // if source and destination are same, well then move on :P
            });

        }],
        link: function($scope, iElm, iAttrs, controller) {}
    };
}

// Every widget column has X widget tiles dccc efewdwfe edewe
function mdWidgetEngineWidgetTileDirective(){
    return {
        scope: false,
        replace: true,
        templateUrl: "ngf/account/dashboard/_dashboard_files/components/src/components/widgetEngine/templates/widgetEngineWidgetTile.html",
        controller: ['$scope', '$element', '$attrs', '$transclude', '$mdDialog', '$timeout', '$sce', '$document', mdWidgetEngineWidgetTileDirectiveController()],
        link: function($scope, iElm, iAttrs, controller) {}
    };
}

// Every widget can be dragged by a handler who is plays the role of a dragger
function mdWidgetEngineWidgetTileDragger(){
    return function($scope, $element, $attrs, $transclude){
        $element.attr('draggable', 'true');
        $element.on('dragstart dragend', function(event){
            if($scope.widget.sticky) return;
            event = event.originalEvent || event;
            event._initiatedByDragger = true; // this is to inform the parent widget that dragging is started by dragging the child element i.e. the dragger
        });
    };
}

// To pass custom directives dyamically it needs to be compiled first
function mdWidgetEngineWidgetTileContentHtml(){
    return {
        transclude: true,
        controller: ['$scope','$element','$attrs','$transclude','$timeout','$compile', function($scope, $element, $attrs, $transclude, $timeout, $compile){
            var el = $compile($scope.widget.content)($scope);
            $element.parent().append(el);
        }],
        link: function($scope, iElm, iAttrs, controller) {}
    };
}


// The main widget engine directive
function mdWidgetEngineDirective(){
    // Runs during compile
    return {
        scope: {
            configuration: "=configuration",
            callback: "=callback"
        },
        templateUrl: "/src/components/widgetEngine/templates/widgetEngine.html",
        controller: ['$scope','$element','$attrs','$transclude','$timeout', function($scope, $element, $attrs, $transclude, $timeout){
            $timeout(function(){
                $scope.configuration =  $scope.configuration || {};
            });
        }],
        link: function($scope, iElm, iAttrs, controller) {}
    };
}



function mdWidgetEngineWidgetTileDirectiveController(){
    var _obj = {};
    _obj._draggedTile = null;

    _obj.controller = function($scope, $element, $attrs, $transclude, $mdDialog, $timeout, $sce, $document){
        $scope.fullscreen = false;
        $scope.widget._internalSettings = {};
        $scope.widget._internalSettings.trustedURL = $sce.trustAsResourceUrl($scope.widget.content);
        $scope.widget._internalSettings.trustedHTML = $sce.trustAsHtml($scope.widget.content);
        $scope.widget._internalSettings.isFabControlOpen = false;
        $scope.widget._internalSettings.isMoving = false;
        $scope.toggleFullscreen = function(){
            $scope.fullscreen = !$scope.fullscreen;
            $scope.callback("toggleFullscreen", $scope.widget);
        };

        $scope.toggleSticky = function(){
            $scope.widget.sticky = !$scope.widget.sticky;
        };

        $scope.removeWidget = function(e){
            var confirm = $mdDialog.confirm()
                          .title('Are you sure?')
                          .textContent('Remove the "' + $scope.widget.title + '" widget?')
                          .ariaLabel('Are you sure you want to remove the widget')
                          .targetEvent(e)
                          .ok('Yes')
                          .cancel('Cancel');

            $mdDialog.show(confirm).then(function(){
                $element.addClass('md-widget-engine-widget-remove');
                $timeout(function(){
                    var removedWidget = $scope.configuration.columns[$scope.columnIndex].widgets.splice($scope.widgetIndex, 1);
                    $scope.callback("removeWidget", removedWidget[0]);
                    $scope.callback("update", $scope.configuration);
                }, 200);
            }, function(){});
        };

        $scope.customActionCallback = function(cAction){
            $scope.callback(cAction.event, $scope.widget);
        };

        $scope.openMenu = function($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

        // $element.attr("draggable", "true");

        $element.on('dragstart', function(event){
            // only drag when initiated by child
            event.stopPropagation();
            if(!event._initiatedByDragger || $scope.fullscreen){
                if(!(event.dataTransfer.types && event.dataTransfer.types.length)){
                    event.preventDefault();
                }
                event.stopPropagation();
                return;
            }
            // $scope.fullscreen = false; //incase, you know
            $element.addClass("md-widget-engine-widget-moving");
            var draggerPosition = $scope.columnIndex + "::" + $scope.widgetIndex;
            event.dataTransfer.setData("Text", draggerPosition);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.dropEffect = "move";
            event.dataTransfer.setDragImage($element[0], 20, 20);
            _obj._draggedTile = $element;
            $scope.widget._internalSettings.isMoving = true;
            // console.log($scope.columnIndex, $scope.widgetIndex);
        });

        $element.on('dragenter', function(event){
            event.stopPropagation();
            if($scope.widget.sticky) return false;
            if(!$scope.isAnyWidgetMoving()) return false;
            if($element.hasClass('md-widget-engine-widget-moving')) return;
            $element.addClass("md-widget-engine-widget-dashed");
        });

        $element.on('dragover', function(event){
            event.stopPropagation();
            if($scope.widget.sticky) return false;
            if(!$scope.isAnyWidgetMoving()) return false;
            if($element.hasClass('md-widget-engine-widget-moving')) return;
            $element.addClass("md-widget-engine-widget-dashed");
            if(event.preventDefault) event.preventDefault();
        });

        $element.on('dragleave', function(event){
            event.stopPropagation();
            if($scope.widget.sticky) return false;
            if(!$scope.isAnyWidgetMoving()) return false;
            $element.removeClass("md-widget-engine-widget-dashed");
        });

        $element.on('dragend', function(event){
            event.stopPropagation();
            if($scope.widget.sticky) return false;
            if(!$scope.isAnyWidgetMoving()) return false;
            event = event.originalEvent || event;
            $element.removeClass("md-widget-engine-widget-moving");
            $scope.widget._internalSettings.isMoving = false;
        });

        $element.on('drop', function(event){
            event.stopPropagation();
            if($scope.widget.sticky) return false;
            if(!$scope.isAnyWidgetMoving()) return false;

            // get the positions of swappers
            var draggerPosition = (event.dataTransfer.getData("Text") || event.dataTransfer.getData("text/plain")).split("::");
            if($scope.columnIndex == draggerPosition[0] && $scope.widgetIndex == draggerPosition[1]) return; // no need to drop at the same place
            var dropeePosition = [$scope.columnIndex, $scope.widgetIndex];
            // get the elements
            var draggerElement = $scope.configuration.columns[draggerPosition[0]].widgets[draggerPosition[1]];
            var dropeeElement =  $scope.configuration.columns[dropeePosition[0]].widgets[dropeePosition[1]];
            // swap the elements
            $scope.configuration.columns[draggerPosition[0]].widgets[draggerPosition[1]] = dropeeElement;
            $scope.configuration.columns[dropeePosition[0]].widgets[dropeePosition[1]] = draggerElement;
            
            _obj._draggedTile.removeClass("md-widget-engine-widget-dashed");
            $element.removeClass("md-widget-engine-widget-dashed");

            setTimeout(function(){
                $scope.$apply();
                $scope.callback("update", $scope.configuration);
            }, 150);
            // if source and destination are same, well then move on :P
        });

    };

    return _obj.controller;
}



angular.module('ngMdWidgetEngine').run(['$templateCache', function($templateCache) {$templateCache.put('/src/components/widgetEngine/templates/widgetEngine.html','<div class="md-widget-engine-container" ng-if="configuration.columns">\n    <div class="md-widget-engine">\n        <div layout="row" flex style="height: 100%">\n            <md-widget-engine-column \n                ng-repeat="(columnIndex, column) in configuration.columns" \n                column="column" \n                style="background-color: {{column.background}}; width: {{column.size}}%; min-width: 15%;"\n            ></md-widget-engine-column>\n        </div>\n    </div>\n</div><!-- md-widget-engine-container -->');
$templateCache.put('/src/components/widgetEngine/templates/widgetEngineColumn.html','<div class="md-widget-engine-column" style="height:100%; position:relative">\n    \n    <span class="md-widget-engine-column-resizer" ng-mousedown="setupColumnResizing($event)" ng-show="configuration.columns.length-1 > columnIndex && configuration.resizeableColumns !== false">\n    </span>\n    <div class="md-widget-engine-new-column-handler {{configuration.columns.length==1 ? \'single-column-only\' : \'\'}}" ng-show="configuration.columns.length-1 > columnIndex || configuration.columns.length==1 || column.widgets.length==0">\n        <div ng-click="addNewColumn()" ng-show="column.widgets.length > 0 && configuration.columns.length < 6 && configuration.dynamicColumns !== false" style="outline: none; border: 0px;">\n            <md-icon class="material-icons md-dark md-24" style="outline: none">add_circle</md-icon>\n            <md-tooltip md-direction="{{columnIndex == configuration.columns.length-1 ? \'left\': \'right\'}}">Add new column here</md-tooltip>\n        </div>\n        <div ng-click="removeEmptyColumn()" ng-show="column.widgets.length == 0 && configuration.dynamicColumns !== false" style="outline: none; border: 0px;">\n            <md-icon class="material-icons md-dark md-24">remove_circle</md-icon>\n            <md-tooltip md-direction="left">Remove this column</md-tooltip>\n        </div>\n    </div>\n\n    <div class="md-widget-engine-widget-tiles-container">\n        <md-widget-engine-widget-tile ng-repeat="(widgetIndex, widget) in column.widgets" widget="widget" widgetIndex="widgetIndex"></md-widget-engine-widget-tile>\n    </div>\n</div><!-- md-widget-engine-column -->');
$templateCache.put('/src/components/widgetEngine/templates/widgetEngineWidgetTile.html','<div class="md-widget-engine-widget-tile-container {{fullscreen ? \'md-widget-engine-widget-fullscreen\' : \'\'}} md-widget-engine-widget-{{widget.name}}">\n    <div class="md-widget-engine-widget-tile md-whiteframe-2dp">\n\n        <div class="md-widget-engine-widget-tile-title-container md-widget-engine-widget-{{widget.name}}">\n            <md-toolbar class="md-whiteframe-2dp md-widget-engine-title-control-type-{{widget.controlsLayout || \'default\'}}" style="z-index: {{(configuration.columns[columnIndex].widgets.length - widgetIndex) * 10}}">\n                <div class="md-toolbar-tools" style="cursor: pointer" md-widget-engine-widget-dragger>\n                    <div class="md-widget-engine-widget-tile-title" flex>\n                        <div style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 80%">{{widget.title || \'Widget\'}}</div>\n                    </div>\n                    <span ></span>\n                    <div class="md-widget-engine-widget-tile-controls-container" style="position:relative">\n                        <div ng-switch on="widget.controlsLayout">\n\n                            <div ng-switch-default class="md-widget-engine-widget-title-default-controls">\n                                <div class="md-widget-engine-widget-tile-control" ng-mouseup="removeWidget($event)" ng-show="widget.closeControl !== false">\n                                    <span class="md-widget-engine-widget-close-control">\n                                        <md-icon class="material-icons md-light md-24">\n                                            close\n                                            <md-tooltip md-direction="bottom">Remove this widget</md-tooltip>\n                                        </md-icon>\n                                    </span>\n                                </div>\n                                <div class="md-widget-engine-widget-tile-control" ng-click="toggleSticky()" ng-show="widget.stickyControl">\n                                    <span class="md-widget-engine-widget-sticky-control">\n                                        <md-icon class="material-icons md-light md-24" ng-if="!widget.sticky">\n                                            lock_open\n                                            <md-tooltip md-direction="bottom">Make this widget sticky</md-tooltip>\n                                        </md-icon>\n                                        <md-icon class="material-icons md-light md-24" ng-if="widget.sticky">\n                                            lock\n                                            <md-tooltip md-direction="bottom">Make this widget non-sticky</md-tooltip>\n                                        </md-icon>\n                                    </span>\n                                </div>\n                                <div class="md-widget-engine-widget-tile-control" ng-click="toggleFullscreen()" ng-show="widget.fullscreenControl !== false">\n                                    <span class="md-widget-engine-widget-fullscreen-control">\n                                        <md-icon class="material-icons md-light md-24">\n                                            fullscreen\n                                            <md-tooltip md-direction="bottom">Toggle fullscreen mode</md-tooltip>\n                                        </md-icon>\n                                    </span>\n                                </div>\n\n                                <div class="md-widget-engine-widget-tile-control" ng-repeat="cAction in widget.customActions" class="md-fab md-mini md-raised" ng-click="customActionCallback(cAction)">\n                                    <span class="md-widget-engine-widget-custom-control">\n                                        <md-icon class="material-icons md-light md-24">\n                                            {{cAction.icon}}\n                                            <md-tooltip md-direction="bottom">{{cAction.tooltip}}</md-tooltip>\n                                        </md-icon>\n                                    </span>\n                                </div>\n                            </div><!-- default layout -->\n\n\n                            <div ng-switch-when="fab" class="md-widget-engine-widget-title-fab-controls">\n                                <md-fab-speed-dial md-direction="down" class="md-scale" ng-show="widget.closeControl !== false || widget.fullscreenControl !== false || widget.stickyControl !== false || widget.customActions.length ">\n                                    <md-fab-trigger>\n                                        <md-button aria-label="menu" class="md-fab md-mini md-raised md-button">\n                                            <md-icon class="material-icons md-light md-24">more_vert</md-icon>\n                                        </md-button>\n                                    </md-fab-trigger>\n\n                                    <md-fab-actions>\n                                        <md-button class="md-fab md-mini md-raised" ng-mouseup="removeWidget($event)" ng-show="widget.closeControl !== false">\n                                            <md-icon class="material-icons md-light md-24">\n                                                close\n                                                <md-tooltip md-direction="bottom">Remove this widget</md-tooltip>\n                                            </md-icon>\n                                        </md-button>\n\n                                        <md-button class="md-fab md-mini md-raised" ng-click="toggleSticky()" ng-show="widget.stickyControl">\n                                            <md-icon class="material-icons md-light md-24" ng-if="!widget.sticky">\n                                                lock_open\n                                                <md-tooltip md-direction="bottom">Make this widget sticky</md-tooltip>\n                                            </md-icon>\n                                            <md-icon class="material-icons md-light md-24" ng-if="widget.sticky">\n                                              lock\n                                              <md-tooltip md-direction="bottom">Make this widget non-sticky</md-tooltip>\n                                            </md-icon>\n                                        </md-button>\n\n                                        <md-button class="md-fab md-mini md-raised" ng-click="toggleFullscreen()" ng-show="widget.fullscreenControl !== false">\n                                            <md-icon class="material-icons md-light md-24">\n                                                fullscreen\n                                                <md-tooltip md-direction="bottom">Toggle fullscreen mode</md-tooltip>\n                                            </md-icon>\n                                        </md-button>\n\n                                        <md-button ng-repeat="cAction in widget.customActions" class="md-fab md-mini md-raised " ng-click="customActionCallback(cAction)">\n                                            <md-icon class="material-icons md-light md-24">\n                                                {{cAction.icon}}\n                                                <md-tooltip md-direction="bottom">{{cAction.tooltip}}</md-tooltip>\n                                            </md-icon>\n                                        </md-button>\n\n                                    </md-fab-actions>\n                                </md-fab-speed-dial>\n                            </div><!-- fab-controls layout -->\n\n\n                            <div ng-switch-when="menu" class="md-widget-engine-widget-title-menu-controls">\n                                    <md-menu ng-show="widget.closeControl !== false || widget.fullscreenControl !== false || widget.stickyControl !== false || widget.customActions.length ">\n                                      <md-button aria-label="Open menu" class="md-icon-button" ng-click="openMenu($mdOpenMenu, $event)">\n                                        <md-icon md-menu-origin>more_vert</md-icon>\n                                      </md-button>\n                                      <md-menu-content width="2">\n                                        <md-menu-item>\n                                          <md-button ng-mouseup="removeWidget($event)" ng-show="widget.closeControl !== false">\n                                            <md-icon class="material-icons md-light md-24" md-menu-align-target>close</md-icon>\n                                            Remove this widget\n                                          </md-button>\n                                        </md-menu-item>\n\n                                        <md-menu-item ng-show="widget.stickyControl">\n                                          <md-button ng-click="toggleSticky()" ng-if="!widget.sticky">\n                                            <md-icon class="material-icons md-light md-24" md-menu-align-target>lock_open</md-icon>\n                                            Make this widget sticky\n                                          </md-button>\n                                          <md-button ng-click="toggleSticky()" ng-if="widget.sticky">\n                                            <md-icon class="material-icons md-light md-24" md-menu-align-target>lock</md-icon>\n                                            Make this widget non-sticky\n                                          </md-button>\n                                        </md-menu-item>\n\n                                        <md-menu-item>\n                                          <md-button ng-click="toggleFullscreen()" ng-show="widget.fullscreenControl !== false">\n                                            <md-icon class="material-icons md-light md-24" md-menu-align-target>fullscreen</md-icon>\n                                            Toggle fullscreen\n                                          </md-button>\n                                        </md-menu-item>\n\n                                        <md-menu-divider ng-if="widget.customActions.length"></md-menu-divider>\n\n                                        <md-menu-item ng-repeat="cAction in widget.customActions">\n                                          <md-button ng-click="customActionCallback(cAction)">\n                                            <md-icon class="material-icons md-light md-24" md-menu-align-target>{{cAction.icon}}</md-icon>\n                                            {{cAction.tooltip}}\n                                          </md-button>\n                                        </md-menu-item>\n                                        \n                                      </md-menu-content>\n                                    </md-menu>\n                            </div><!-- menu layout -->\n\n\n\n                        </div><!-- ng-switch-->\n                    </div><!-- md-widget-engine-widget-tile-controls-container -->\n                </div><!-- md-toolbar-tools -->\n            </md-toolbar>\n        </div>\n\n        <div class="md-widget-engine-widget-tile-content-container md-widget-engine-widget-{{widget.name}}">\n            <md-content>\n                <div class="md-widget-engine-widget-tile-content {{widget.resize ? \'resize-vertical\' : \'\'}}" style="min-height:{{fullscreen ? \'100%\' : widget.minHeight + \'px\'}}; height:{{fullscreen ? \'100%\' : widget.minHeight + \'px\'}}; max-height:{{fullscreen ? \'100%\' : widget.maxHeight + \'px\'}}; position:relative;">\n                    <div ng-switch on="widget.type" style="height: inherit">\n                        <div ng-switch-when="include" style="height: inherit">\n                            <ng-include src="widget.content"></ng-include>\n                        </div><!-- ng-switch-when -->\n\n                        <div ng-switch-when="iframe" style="height: inherit">\n                            <iframe ng-src="{{widget._internalSettings.trustedURL}}" frameborder=0 style="border:0px; width:100%; height:100%"></iframe>\n                        </div><!-- ng-switch-when -->\n\n                        <div ng-switch-when="html" style="height: inherit">\n                            <md-widget-engine-widget-tile-content-html>\n                                {{widget._internalSettings.trustedHTML}}\n                            </md-widget-engine-widget-tile-content-html>\n                        </div><!-- ng-switch-when -->\n\n                    </div> <!-- ng-switch -->\n                </div>\n            </md-content>    \n        </div>\n\n    </div><!-- md-widget-engine-widget-tile -->\n</div><!-- md-widget-engine-widget-tile-container -->\n');}]);
/* perfect-scrollbar v0.8.1 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ps = require('../main');
var psInstances = require('../plugin/instances');

function mountJQuery(jQuery) {
  jQuery.fn.perfectScrollbar = function (settingOrCommand) {
    return this.each(function () {
      if (typeof settingOrCommand === 'object' ||
          typeof settingOrCommand === 'undefined') {
        // If it's an object or none, initialize.
        var settings = settingOrCommand;

        if (!psInstances.get(this)) {
          ps.initialize(this, settings);
        }
      } else {
        // Unless, it may be a command.
        var command = settingOrCommand;

        if (command === 'update') {
          ps.update(this);
        } else if (command === 'destroy') {
          ps.destroy(this);
        }
      }
    });
  };
}

if (typeof define === 'function' && define.amd) {
  // AMD. Register as an anonymous module.
  define(['jquery'], mountJQuery);
} else {
  var jq = window.jQuery ? window.jQuery : window.$;
  if (typeof jq !== 'undefined') {
    mountJQuery(jq);
  }
}

module.exports = mountJQuery;

},{"../main":6,"../plugin/instances":17}],2:[function(require,module,exports){
'use strict';

var DOM = {};

DOM.create = function (tagName, className) {
  var element = document.createElement(tagName);
  element.className = className;
  return element;
};

DOM.appendTo = function (child, parent) {
  parent.appendChild(child);
  return child;
};

function cssGet(element, styleName) {
  return window.getComputedStyle(element)[styleName];
}

function cssSet(element, styleName, styleValue) {
  if (typeof styleValue === 'number') {
    styleValue = styleValue.toString() + 'px';
  }
  element.style[styleName] = styleValue;
  return element;
}

function cssMultiSet(element, obj) {
  for (var key in obj) {
    var val = obj[key];
    if (typeof val === 'number') {
      val = val.toString() + 'px';
    }
    element.style[key] = val;
  }
  return element;
}

DOM.css = function (element, styleNameOrObject, styleValue) {
  if (typeof styleNameOrObject === 'object') {
    // multiple set with object
    return cssMultiSet(element, styleNameOrObject);
  } else {
    if (typeof styleValue === 'undefined') {
      return cssGet(element, styleNameOrObject);
    } else {
      return cssSet(element, styleNameOrObject, styleValue);
    }
  }
};

DOM.matches = function (element, query) {
  if (typeof element.matches !== 'undefined') {
    return element.matches(query);
  } else {
    // must be IE11 and Edge
    return element.msMatchesSelector(query);
  }
};

DOM.remove = function (element) {
  if (typeof element.remove !== 'undefined') {
    element.remove();
  } else {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
};

DOM.queryChildren = function (element, selector) {
  return Array.prototype.filter.call(element.childNodes, function (child) {
    return DOM.matches(child, selector);
  });
};

module.exports = DOM;

},{}],3:[function(require,module,exports){
'use strict';

var EventElement = function (element) {
  this.element = element;
  this.events = {};
};

EventElement.prototype.bind = function (eventName, handler) {
  if (typeof this.events[eventName] === 'undefined') {
    this.events[eventName] = [];
  }
  this.events[eventName].push(handler);
  this.element.addEventListener(eventName, handler, false);
};

EventElement.prototype.unbind = function (eventName, handler) {
  var isHandlerProvided = (typeof handler !== 'undefined');
  this.events[eventName] = this.events[eventName].filter(function (hdlr) {
    if (isHandlerProvided && hdlr !== handler) {
      return true;
    }
    this.element.removeEventListener(eventName, hdlr, false);
    return false;
  }, this);
};

EventElement.prototype.unbindAll = function () {
  for (var name in this.events) {
    this.unbind(name);
  }
};

var EventManager = function () {
  this.eventElements = [];
};

EventManager.prototype.eventElement = function (element) {
  var ee = this.eventElements.filter(function (eventElement) {
    return eventElement.element === element;
  })[0];
  if (typeof ee === 'undefined') {
    ee = new EventElement(element);
    this.eventElements.push(ee);
  }
  return ee;
};

EventManager.prototype.bind = function (element, eventName, handler) {
  this.eventElement(element).bind(eventName, handler);
};

EventManager.prototype.unbind = function (element, eventName, handler) {
  this.eventElement(element).unbind(eventName, handler);
};

EventManager.prototype.unbindAll = function () {
  for (var i = 0; i < this.eventElements.length; i++) {
    this.eventElements[i].unbindAll();
  }
};

EventManager.prototype.once = function (element, eventName, handler) {
  var ee = this.eventElement(element);
  var onceHandler = function (e) {
    ee.unbind(eventName, onceHandler);
    handler(e);
  };
  ee.bind(eventName, onceHandler);
};

module.exports = EventManager;

},{}],4:[function(require,module,exports){
'use strict';

module.exports = (function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function () {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

},{}],5:[function(require,module,exports){
'use strict';

var dom = require('./dom');

var toInt = exports.toInt = function (x) {
  return parseInt(x, 10) || 0;
};

exports.isEditable = function (el) {
  return dom.matches(el, "input,[contenteditable]") ||
         dom.matches(el, "select,[contenteditable]") ||
         dom.matches(el, "textarea,[contenteditable]") ||
         dom.matches(el, "button,[contenteditable]");
};

exports.removePsClasses = function (element) {
  for (var i = 0; i < element.classList.length; i++) {
    var className = element.classList[i];
    if (className.indexOf('ps-') === 0) {
      element.classList.remove(className);
    }
  }
};

exports.outerWidth = function (element) {
  return toInt(dom.css(element, 'width')) +
         toInt(dom.css(element, 'paddingLeft')) +
         toInt(dom.css(element, 'paddingRight')) +
         toInt(dom.css(element, 'borderLeftWidth')) +
         toInt(dom.css(element, 'borderRightWidth'));
};

function psClasses(axis) {
  var classes = ['ps--in-scrolling'];
  var axisClasses;
  if (typeof axis === 'undefined') {
    axisClasses = ['ps--x', 'ps--y'];
  } else {
    axisClasses = ['ps--' + axis];
  }
  return classes.concat(axisClasses);
}

exports.startScrolling = function (element, axis) {
  var classes = psClasses(axis);
  for (var i = 0; i < classes.length; i++) {
    element.classList.add(classes[i]);
  }
};

exports.stopScrolling = function (element, axis) {
  var classes = psClasses(axis);
  for (var i = 0; i < classes.length; i++) {
    element.classList.remove(classes[i]);
  }
};

exports.env = {
  isWebKit: typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style,
  supportsTouch: typeof window !== 'undefined' && (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch),
  supportsIePointer: typeof window !== 'undefined' && window.navigator.msMaxTouchPoints !== null
};

},{"./dom":2}],6:[function(require,module,exports){
'use strict';

var destroy = require('./plugin/destroy');
var initialize = require('./plugin/initialize');
var update = require('./plugin/update');

module.exports = {
  initialize: initialize,
  update: update,
  destroy: destroy
};

},{"./plugin/destroy":8,"./plugin/initialize":16,"./plugin/update":20}],7:[function(require,module,exports){
'use strict';

module.exports = function () {
  return {
    handlers: ['click-rail', 'drag-scrollbar', 'keyboard', 'wheel', 'touch'],
    maxScrollbarLength: null,
    minScrollbarLength: null,
    scrollXMarginOffset: 0,
    scrollYMarginOffset: 0,
    suppressScrollX: false,
    suppressScrollY: false,
    swipePropagation: true,
    swipeEasing: true,
    useBothWheelAxes: false,
    wheelPropagation: false,
    wheelSpeed: 1,
    theme: 'default'
  };
};

},{}],8:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var dom = require('../lib/dom');
var instances = require('./instances');

module.exports = function (element) {
  var i = instances.get(element);

  if (!i) {
    return;
  }

  i.event.unbindAll();
  dom.remove(i.scrollbarX);
  dom.remove(i.scrollbarY);
  dom.remove(i.scrollbarXRail);
  dom.remove(i.scrollbarYRail);
  _.removePsClasses(element);

  instances.remove(element);
};

},{"../lib/dom":2,"../lib/helper":5,"./instances":17}],9:[function(require,module,exports){
'use strict';

var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindClickRailHandler(element, i) {
  function pageOffset(el) {
    return el.getBoundingClientRect();
  }
  var stopPropagation = function (e) { e.stopPropagation(); };

  i.event.bind(i.scrollbarY, 'click', stopPropagation);
  i.event.bind(i.scrollbarYRail, 'click', function (e) {
    var positionTop = e.pageY - window.pageYOffset - pageOffset(i.scrollbarYRail).top;
    var direction = positionTop > i.scrollbarYTop ? 1 : -1;

    updateScroll(element, 'top', element.scrollTop + direction * i.containerHeight);
    updateGeometry(element);

    e.stopPropagation();
  });

  i.event.bind(i.scrollbarX, 'click', stopPropagation);
  i.event.bind(i.scrollbarXRail, 'click', function (e) {
    var positionLeft = e.pageX - window.pageXOffset - pageOffset(i.scrollbarXRail).left;
    var direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

    updateScroll(element, 'left', element.scrollLeft + direction * i.containerWidth);
    updateGeometry(element);

    e.stopPropagation();
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindClickRailHandler(element, i);
};

},{"../instances":17,"../update-geometry":18,"../update-scroll":19}],10:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var dom = require('../../lib/dom');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindMouseScrollXHandler(element, i) {
  var currentLeft = null;
  var currentPageX = null;

  function updateScrollLeft(deltaX) {
    var newLeft = currentLeft + (deltaX * i.railXRatio);
    var maxLeft = Math.max(0, i.scrollbarXRail.getBoundingClientRect().left) + (i.railXRatio * (i.railXWidth - i.scrollbarXWidth));

    if (newLeft < 0) {
      i.scrollbarXLeft = 0;
    } else if (newLeft > maxLeft) {
      i.scrollbarXLeft = maxLeft;
    } else {
      i.scrollbarXLeft = newLeft;
    }

    var scrollLeft = _.toInt(i.scrollbarXLeft * (i.contentWidth - i.containerWidth) / (i.containerWidth - (i.railXRatio * i.scrollbarXWidth))) - i.negativeScrollAdjustment;
    updateScroll(element, 'left', scrollLeft);
  }

  var mouseMoveHandler = function (e) {
    updateScrollLeft(e.pageX - currentPageX);
    updateGeometry(element);
    e.stopPropagation();
    e.preventDefault();
  };

  var mouseUpHandler = function () {
    _.stopScrolling(element, 'x');
    i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
  };

  i.event.bind(i.scrollbarX, 'mousedown', function (e) {
    currentPageX = e.pageX;
    currentLeft = _.toInt(dom.css(i.scrollbarX, 'left')) * i.railXRatio;
    _.startScrolling(element, 'x');

    i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
    i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

    e.stopPropagation();
    e.preventDefault();
  });
}

function bindMouseScrollYHandler(element, i) {
  var currentTop = null;
  var currentPageY = null;

  function updateScrollTop(deltaY) {
    var newTop = currentTop + (deltaY * i.railYRatio);
    var maxTop = Math.max(0, i.scrollbarYRail.getBoundingClientRect().top) + (i.railYRatio * (i.railYHeight - i.scrollbarYHeight));

    if (newTop < 0) {
      i.scrollbarYTop = 0;
    } else if (newTop > maxTop) {
      i.scrollbarYTop = maxTop;
    } else {
      i.scrollbarYTop = newTop;
    }

    var scrollTop = _.toInt(i.scrollbarYTop * (i.contentHeight - i.containerHeight) / (i.containerHeight - (i.railYRatio * i.scrollbarYHeight)));
    updateScroll(element, 'top', scrollTop);
  }

  var mouseMoveHandler = function (e) {
    updateScrollTop(e.pageY - currentPageY);
    updateGeometry(element);
    e.stopPropagation();
    e.preventDefault();
  };

  var mouseUpHandler = function () {
    _.stopScrolling(element, 'y');
    i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
  };

  i.event.bind(i.scrollbarY, 'mousedown', function (e) {
    currentPageY = e.pageY;
    currentTop = _.toInt(dom.css(i.scrollbarY, 'top')) * i.railYRatio;
    _.startScrolling(element, 'y');

    i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
    i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

    e.stopPropagation();
    e.preventDefault();
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindMouseScrollXHandler(element, i);
  bindMouseScrollYHandler(element, i);
};

},{"../../lib/dom":2,"../../lib/helper":5,"../instances":17,"../update-geometry":18,"../update-scroll":19}],11:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var dom = require('../../lib/dom');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindKeyboardHandler(element, i) {
  var hovered = false;
  i.event.bind(element, 'mouseenter', function () {
    hovered = true;
  });
  i.event.bind(element, 'mouseleave', function () {
    hovered = false;
  });

  var shouldPrevent = false;
  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    if (deltaX === 0) {
      if (!i.scrollbarYActive) {
        return false;
      }
      if ((scrollTop === 0 && deltaY > 0) || (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)) {
        return !i.settings.wheelPropagation;
      }
    }

    var scrollLeft = element.scrollLeft;
    if (deltaY === 0) {
      if (!i.scrollbarXActive) {
        return false;
      }
      if ((scrollLeft === 0 && deltaX < 0) || (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)) {
        return !i.settings.wheelPropagation;
      }
    }
    return true;
  }

  i.event.bind(i.ownerDocument, 'keydown', function (e) {
    if ((e.isDefaultPrevented && e.isDefaultPrevented()) || e.defaultPrevented) {
      return;
    }

    var focused = dom.matches(i.scrollbarX, ':focus') ||
                  dom.matches(i.scrollbarY, ':focus');

    if (!hovered && !focused) {
      return;
    }

    var activeElement = document.activeElement ? document.activeElement : i.ownerDocument.activeElement;
    if (activeElement) {
      if (activeElement.tagName === 'IFRAME') {
        activeElement = activeElement.contentDocument.activeElement;
      } else {
        // go deeper if element is a webcomponent
        while (activeElement.shadowRoot) {
          activeElement = activeElement.shadowRoot.activeElement;
        }
      }
      if (_.isEditable(activeElement)) {
        return;
      }
    }

    var deltaX = 0;
    var deltaY = 0;

    switch (e.which) {
    case 37: // left
      if (e.metaKey) {
        deltaX = -i.contentWidth;
      } else if (e.altKey) {
        deltaX = -i.containerWidth;
      } else {
        deltaX = -30;
      }
      break;
    case 38: // up
      if (e.metaKey) {
        deltaY = i.contentHeight;
      } else if (e.altKey) {
        deltaY = i.containerHeight;
      } else {
        deltaY = 30;
      }
      break;
    case 39: // right
      if (e.metaKey) {
        deltaX = i.contentWidth;
      } else if (e.altKey) {
        deltaX = i.containerWidth;
      } else {
        deltaX = 30;
      }
      break;
    case 40: // down
      if (e.metaKey) {
        deltaY = -i.contentHeight;
      } else if (e.altKey) {
        deltaY = -i.containerHeight;
      } else {
        deltaY = -30;
      }
      break;
    case 33: // page up
      deltaY = 90;
      break;
    case 32: // space bar
      if (e.shiftKey) {
        deltaY = 90;
      } else {
        deltaY = -90;
      }
      break;
    case 34: // page down
      deltaY = -90;
      break;
    case 35: // end
      if (e.ctrlKey) {
        deltaY = -i.contentHeight;
      } else {
        deltaY = -i.containerHeight;
      }
      break;
    case 36: // home
      if (e.ctrlKey) {
        deltaY = element.scrollTop;
      } else {
        deltaY = i.containerHeight;
      }
      break;
    default:
      return;
    }

    updateScroll(element, 'top', element.scrollTop - deltaY);
    updateScroll(element, 'left', element.scrollLeft + deltaX);
    updateGeometry(element);

    shouldPrevent = shouldPreventDefault(deltaX, deltaY);
    if (shouldPrevent) {
      e.preventDefault();
    }
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindKeyboardHandler(element, i);
};

},{"../../lib/dom":2,"../../lib/helper":5,"../instances":17,"../update-geometry":18,"../update-scroll":19}],12:[function(require,module,exports){
'use strict';

var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindMouseWheelHandler(element, i) {
  var shouldPrevent = false;

  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    if (deltaX === 0) {
      if (!i.scrollbarYActive) {
        return false;
      }
      if ((scrollTop === 0 && deltaY > 0) || (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)) {
        return !i.settings.wheelPropagation;
      }
    }

    var scrollLeft = element.scrollLeft;
    if (deltaY === 0) {
      if (!i.scrollbarXActive) {
        return false;
      }
      if ((scrollLeft === 0 && deltaX < 0) || (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)) {
        return !i.settings.wheelPropagation;
      }
    }
    return true;
  }

  function getDeltaFromEvent(e) {
    var deltaX = e.deltaX;
    var deltaY = -1 * e.deltaY;

    if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
      // OS X Safari
      deltaX = -1 * e.wheelDeltaX / 6;
      deltaY = e.wheelDeltaY / 6;
    }

    if (e.deltaMode && e.deltaMode === 1) {
      // Firefox in deltaMode 1: Line scrolling
      deltaX *= 10;
      deltaY *= 10;
    }

    if (deltaX !== deltaX && deltaY !== deltaY/* NaN checks */) {
      // IE in some mouse drivers
      deltaX = 0;
      deltaY = e.wheelDelta;
    }

    if (e.shiftKey) {
      // reverse axis with shift key
      return [-deltaY, -deltaX];
    }
    return [deltaX, deltaY];
  }

  function shouldBeConsumedByChild(deltaX, deltaY) {
    var child = element.querySelector('textarea:hover, select[multiple]:hover, .ps-child:hover');
    if (child) {
      var style = window.getComputedStyle(child);
      var overflow = [
        style.overflow,
        style.overflowX,
        style.overflowY
      ].join('');

      if (!overflow.match(/(scroll|auto)/)) {
        // if not scrollable
        return false;
      }

      var maxScrollTop = child.scrollHeight - child.clientHeight;
      if (maxScrollTop > 0) {
        if (!(child.scrollTop === 0 && deltaY > 0) && !(child.scrollTop === maxScrollTop && deltaY < 0)) {
          return true;
        }
      }
      var maxScrollLeft = child.scrollLeft - child.clientWidth;
      if (maxScrollLeft > 0) {
        if (!(child.scrollLeft === 0 && deltaX < 0) && !(child.scrollLeft === maxScrollLeft && deltaX > 0)) {
          return true;
        }
      }
    }
    return false;
  }

  function mousewheelHandler(e) {
    var delta = getDeltaFromEvent(e);

    var deltaX = delta[0];
    var deltaY = delta[1];

    if (shouldBeConsumedByChild(deltaX, deltaY)) {
      return;
    }

    shouldPrevent = false;
    if (!i.settings.useBothWheelAxes) {
      // deltaX will only be used for horizontal scrolling and deltaY will
      // only be used for vertical scrolling - this is the default
      updateScroll(element, 'top', element.scrollTop - (deltaY * i.settings.wheelSpeed));
      updateScroll(element, 'left', element.scrollLeft + (deltaX * i.settings.wheelSpeed));
    } else if (i.scrollbarYActive && !i.scrollbarXActive) {
      // only vertical scrollbar is active and useBothWheelAxes option is
      // active, so let's scroll vertical bar using both mouse wheel axes
      if (deltaY) {
        updateScroll(element, 'top', element.scrollTop - (deltaY * i.settings.wheelSpeed));
      } else {
        updateScroll(element, 'top', element.scrollTop + (deltaX * i.settings.wheelSpeed));
      }
      shouldPrevent = true;
    } else if (i.scrollbarXActive && !i.scrollbarYActive) {
      // useBothWheelAxes and only horizontal bar is active, so use both
      // wheel axes for horizontal bar
      if (deltaX) {
        updateScroll(element, 'left', element.scrollLeft + (deltaX * i.settings.wheelSpeed));
      } else {
        updateScroll(element, 'left', element.scrollLeft - (deltaY * i.settings.wheelSpeed));
      }
      shouldPrevent = true;
    }

    updateGeometry(element);

    shouldPrevent = (shouldPrevent || shouldPreventDefault(deltaX, deltaY));
    if (shouldPrevent) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  if (typeof window.onwheel !== "undefined") {
    i.event.bind(element, 'wheel', mousewheelHandler);
  } else if (typeof window.onmousewheel !== "undefined") {
    i.event.bind(element, 'mousewheel', mousewheelHandler);
  }
}

module.exports = function (element) {
  var i = instances.get(element);
  bindMouseWheelHandler(element, i);
};

},{"../instances":17,"../update-geometry":18,"../update-scroll":19}],13:[function(require,module,exports){
'use strict';

var instances = require('../instances');
var updateGeometry = require('../update-geometry');

function bindNativeScrollHandler(element, i) {
  i.event.bind(element, 'scroll', function () {
    updateGeometry(element);
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindNativeScrollHandler(element, i);
};

},{"../instances":17,"../update-geometry":18}],14:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindSelectionHandler(element, i) {
  function getRangeNode() {
    var selection = window.getSelection ? window.getSelection() :
                    document.getSelection ? document.getSelection() : '';
    if (selection.toString().length === 0) {
      return null;
    } else {
      return selection.getRangeAt(0).commonAncestorContainer;
    }
  }

  var scrollingLoop = null;
  var scrollDiff = {top: 0, left: 0};
  function startScrolling() {
    if (!scrollingLoop) {
      scrollingLoop = setInterval(function () {
        if (!instances.get(element)) {
          clearInterval(scrollingLoop);
          return;
        }

        updateScroll(element, 'top', element.scrollTop + scrollDiff.top);
        updateScroll(element, 'left', element.scrollLeft + scrollDiff.left);
        updateGeometry(element);
      }, 50); // every .1 sec
    }
  }
  function stopScrolling() {
    if (scrollingLoop) {
      clearInterval(scrollingLoop);
      scrollingLoop = null;
    }
    _.stopScrolling(element);
  }

  var isSelected = false;
  i.event.bind(i.ownerDocument, 'selectionchange', function () {
    if (element.contains(getRangeNode())) {
      isSelected = true;
    } else {
      isSelected = false;
      stopScrolling();
    }
  });
  i.event.bind(window, 'mouseup', function () {
    if (isSelected) {
      isSelected = false;
      stopScrolling();
    }
  });
  i.event.bind(window, 'keyup', function () {
    if (isSelected) {
      isSelected = false;
      stopScrolling();
    }
  });

  i.event.bind(window, 'mousemove', function (e) {
    if (isSelected) {
      var mousePosition = {x: e.pageX, y: e.pageY};
      var containerGeometry = {
        left: element.offsetLeft,
        right: element.offsetLeft + element.offsetWidth,
        top: element.offsetTop,
        bottom: element.offsetTop + element.offsetHeight
      };

      if (mousePosition.x < containerGeometry.left + 3) {
        scrollDiff.left = -5;
        _.startScrolling(element, 'x');
      } else if (mousePosition.x > containerGeometry.right - 3) {
        scrollDiff.left = 5;
        _.startScrolling(element, 'x');
      } else {
        scrollDiff.left = 0;
      }

      if (mousePosition.y < containerGeometry.top + 3) {
        if (containerGeometry.top + 3 - mousePosition.y < 5) {
          scrollDiff.top = -5;
        } else {
          scrollDiff.top = -20;
        }
        _.startScrolling(element, 'y');
      } else if (mousePosition.y > containerGeometry.bottom - 3) {
        if (mousePosition.y - containerGeometry.bottom + 3 < 5) {
          scrollDiff.top = 5;
        } else {
          scrollDiff.top = 20;
        }
        _.startScrolling(element, 'y');
      } else {
        scrollDiff.top = 0;
      }

      if (scrollDiff.top === 0 && scrollDiff.left === 0) {
        stopScrolling();
      } else {
        startScrolling();
      }
    }
  });
}

module.exports = function (element) {
  var i = instances.get(element);
  bindSelectionHandler(element, i);
};

},{"../../lib/helper":5,"../instances":17,"../update-geometry":18,"../update-scroll":19}],15:[function(require,module,exports){
'use strict';

var _ = require('../../lib/helper');
var instances = require('../instances');
var updateGeometry = require('../update-geometry');
var updateScroll = require('../update-scroll');

function bindTouchHandler(element, i, supportsTouch, supportsIePointer) {
  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    var scrollLeft = element.scrollLeft;
    var magnitudeX = Math.abs(deltaX);
    var magnitudeY = Math.abs(deltaY);

    if (magnitudeY > magnitudeX) {
      // user is perhaps trying to swipe up/down the page

      if (((deltaY < 0) && (scrollTop === i.contentHeight - i.containerHeight)) ||
          ((deltaY > 0) && (scrollTop === 0))) {
        return !i.settings.swipePropagation;
      }
    } else if (magnitudeX > magnitudeY) {
      // user is perhaps trying to swipe left/right across the page

      if (((deltaX < 0) && (scrollLeft === i.contentWidth - i.containerWidth)) ||
          ((deltaX > 0) && (scrollLeft === 0))) {
        return !i.settings.swipePropagation;
      }
    }

    return true;
  }

  function applyTouchMove(differenceX, differenceY) {
    updateScroll(element, 'top', element.scrollTop - differenceY);
    updateScroll(element, 'left', element.scrollLeft - differenceX);

    updateGeometry(element);
  }

  var startOffset = {};
  var startTime = 0;
  var speed = {};
  var easingLoop = null;
  var inGlobalTouch = false;
  var inLocalTouch = false;

  function globalTouchStart() {
    inGlobalTouch = true;
  }
  function globalTouchEnd() {
    inGlobalTouch = false;
  }

  function getTouch(e) {
    if (e.targetTouches) {
      return e.targetTouches[0];
    } else {
      // Maybe IE pointer
      return e;
    }
  }
  function shouldHandle(e) {
    if (e.pointerType && e.pointerType === 'pen' && e.buttons === 0) {
      return false;
    }
    if (e.targetTouches && e.targetTouches.length === 1) {
      return true;
    }
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
      return true;
    }
    return false;
  }
  function touchStart(e) {
    if (shouldHandle(e)) {
      inLocalTouch = true;

      var touch = getTouch(e);

      startOffset.pageX = touch.pageX;
      startOffset.pageY = touch.pageY;

      startTime = (new Date()).getTime();

      if (easingLoop !== null) {
        clearInterval(easingLoop);
      }

      e.stopPropagation();
    }
  }
  function touchMove(e) {
    if (!inLocalTouch && i.settings.swipePropagation) {
      touchStart(e);
    }
    if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
      var touch = getTouch(e);

      var currentOffset = {pageX: touch.pageX, pageY: touch.pageY};

      var differenceX = currentOffset.pageX - startOffset.pageX;
      var differenceY = currentOffset.pageY - startOffset.pageY;

      applyTouchMove(differenceX, differenceY);
      startOffset = currentOffset;

      var currentTime = (new Date()).getTime();

      var timeGap = currentTime - startTime;
      if (timeGap > 0) {
        speed.x = differenceX / timeGap;
        speed.y = differenceY / timeGap;
        startTime = currentTime;
      }

      if (shouldPreventDefault(differenceX, differenceY)) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }
  function touchEnd() {
    if (!inGlobalTouch && inLocalTouch) {
      inLocalTouch = false;

      if (i.settings.swipeEasing) {
        clearInterval(easingLoop);
        easingLoop = setInterval(function () {
          if (!instances.get(element)) {
            clearInterval(easingLoop);
            return;
          }

          if (!speed.x && !speed.y) {
            clearInterval(easingLoop);
            return;
          }

          if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
            clearInterval(easingLoop);
            return;
          }

          applyTouchMove(speed.x * 30, speed.y * 30);

          speed.x *= 0.8;
          speed.y *= 0.8;
        }, 10);
      }
    }
  }

  if (supportsTouch) {
    i.event.bind(window, 'touchstart', globalTouchStart);
    i.event.bind(window, 'touchend', globalTouchEnd);
    i.event.bind(element, 'touchstart', touchStart);
    i.event.bind(element, 'touchmove', touchMove);
    i.event.bind(element, 'touchend', touchEnd);
  } else if (supportsIePointer) {
    if (window.PointerEvent) {
      i.event.bind(window, 'pointerdown', globalTouchStart);
      i.event.bind(window, 'pointerup', globalTouchEnd);
      i.event.bind(element, 'pointerdown', touchStart);
      i.event.bind(element, 'pointermove', touchMove);
      i.event.bind(element, 'pointerup', touchEnd);
    } else if (window.MSPointerEvent) {
      i.event.bind(window, 'MSPointerDown', globalTouchStart);
      i.event.bind(window, 'MSPointerUp', globalTouchEnd);
      i.event.bind(element, 'MSPointerDown', touchStart);
      i.event.bind(element, 'MSPointerMove', touchMove);
      i.event.bind(element, 'MSPointerUp', touchEnd);
    }
  }
}

module.exports = function (element) {
  if (!_.env.supportsTouch && !_.env.supportsIePointer) {
    return;
  }

  var i = instances.get(element);
  bindTouchHandler(element, i, _.env.supportsTouch, _.env.supportsIePointer);
};

},{"../../lib/helper":5,"../instances":17,"../update-geometry":18,"../update-scroll":19}],16:[function(require,module,exports){
'use strict';

var instances = require('./instances');
var updateGeometry = require('./update-geometry');

// Handlers
var handlers = {
  'click-rail': require('./handler/click-rail'),
  'drag-scrollbar': require('./handler/drag-scrollbar'),
  'keyboard': require('./handler/keyboard'),
  'wheel': require('./handler/mouse-wheel'),
  'touch': require('./handler/touch'),
  'selection': require('./handler/selection')
};
var nativeScrollHandler = require('./handler/native-scroll');

module.exports = function (element, userSettings) {
  element.classList.add('ps');

  // Create a plugin instance.
  var i = instances.add(
    element,
    typeof userSettings === 'object' ? userSettings : {}
  );

  element.classList.add('ps--theme_' + i.settings.theme);

  i.settings.handlers.forEach(function (handlerName) {
    handlers[handlerName](element);
  });

  nativeScrollHandler(element);

  updateGeometry(element);
};

},{"./handler/click-rail":9,"./handler/drag-scrollbar":10,"./handler/keyboard":11,"./handler/mouse-wheel":12,"./handler/native-scroll":13,"./handler/selection":14,"./handler/touch":15,"./instances":17,"./update-geometry":18}],17:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var defaultSettings = require('./default-setting');
var dom = require('../lib/dom');
var EventManager = require('../lib/event-manager');
var guid = require('../lib/guid');

var instances = {};

function Instance(element, userSettings) {
  var i = this;

  i.settings = defaultSettings();
  for (var key in userSettings) {
    i.settings[key] = userSettings[key];
  }

  i.containerWidth = null;
  i.containerHeight = null;
  i.contentWidth = null;
  i.contentHeight = null;

  i.isRtl = dom.css(element, 'direction') === "rtl";
  i.isNegativeScroll = (function () {
    var originalScrollLeft = element.scrollLeft;
    var result = null;
    element.scrollLeft = -1;
    result = element.scrollLeft < 0;
    element.scrollLeft = originalScrollLeft;
    return result;
  })();
  i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;
  i.event = new EventManager();
  i.ownerDocument = element.ownerDocument || document;

  function focus() {
    element.classList.add('ps--focus');
  }

  function blur() {
    element.classList.remove('ps--focus');
  }

  i.scrollbarXRail = dom.appendTo(dom.create('div', 'ps__scrollbar-x-rail'), element);
  i.scrollbarX = dom.appendTo(dom.create('div', 'ps__scrollbar-x'), i.scrollbarXRail);
  i.scrollbarX.setAttribute('tabindex', 0);
  i.event.bind(i.scrollbarX, 'focus', focus);
  i.event.bind(i.scrollbarX, 'blur', blur);
  i.scrollbarXActive = null;
  i.scrollbarXWidth = null;
  i.scrollbarXLeft = null;
  i.scrollbarXBottom = _.toInt(dom.css(i.scrollbarXRail, 'bottom'));
  i.isScrollbarXUsingBottom = i.scrollbarXBottom === i.scrollbarXBottom; // !isNaN
  i.scrollbarXTop = i.isScrollbarXUsingBottom ? null : _.toInt(dom.css(i.scrollbarXRail, 'top'));
  i.railBorderXWidth = _.toInt(dom.css(i.scrollbarXRail, 'borderLeftWidth')) + _.toInt(dom.css(i.scrollbarXRail, 'borderRightWidth'));
  // Set rail to display:block to calculate margins
  dom.css(i.scrollbarXRail, 'display', 'block');
  i.railXMarginWidth = _.toInt(dom.css(i.scrollbarXRail, 'marginLeft')) + _.toInt(dom.css(i.scrollbarXRail, 'marginRight'));
  dom.css(i.scrollbarXRail, 'display', '');
  i.railXWidth = null;
  i.railXRatio = null;

  i.scrollbarYRail = dom.appendTo(dom.create('div', 'ps__scrollbar-y-rail'), element);
  i.scrollbarY = dom.appendTo(dom.create('div', 'ps__scrollbar-y'), i.scrollbarYRail);
  i.scrollbarY.setAttribute('tabindex', 0);
  i.event.bind(i.scrollbarY, 'focus', focus);
  i.event.bind(i.scrollbarY, 'blur', blur);
  i.scrollbarYActive = null;
  i.scrollbarYHeight = null;
  i.scrollbarYTop = null;
  i.scrollbarYRight = _.toInt(dom.css(i.scrollbarYRail, 'right'));
  i.isScrollbarYUsingRight = i.scrollbarYRight === i.scrollbarYRight; // !isNaN
  i.scrollbarYLeft = i.isScrollbarYUsingRight ? null : _.toInt(dom.css(i.scrollbarYRail, 'left'));
  i.scrollbarYOuterWidth = i.isRtl ? _.outerWidth(i.scrollbarY) : null;
  i.railBorderYWidth = _.toInt(dom.css(i.scrollbarYRail, 'borderTopWidth')) + _.toInt(dom.css(i.scrollbarYRail, 'borderBottomWidth'));
  dom.css(i.scrollbarYRail, 'display', 'block');
  i.railYMarginHeight = _.toInt(dom.css(i.scrollbarYRail, 'marginTop')) + _.toInt(dom.css(i.scrollbarYRail, 'marginBottom'));
  dom.css(i.scrollbarYRail, 'display', '');
  i.railYHeight = null;
  i.railYRatio = null;
}

function getId(element) {
  return element.getAttribute('data-ps-id');
}

function setId(element, id) {
  element.setAttribute('data-ps-id', id);
}

function removeId(element) {
  element.removeAttribute('data-ps-id');
}

exports.add = function (element, userSettings) {
  var newId = guid();
  setId(element, newId);
  instances[newId] = new Instance(element, userSettings);
  return instances[newId];
};

exports.remove = function (element) {
  delete instances[getId(element)];
  removeId(element);
};

exports.get = function (element) {
  return instances[getId(element)];
};

},{"../lib/dom":2,"../lib/event-manager":3,"../lib/guid":4,"../lib/helper":5,"./default-setting":7}],18:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var dom = require('../lib/dom');
var instances = require('./instances');
var updateScroll = require('./update-scroll');

function getThumbSize(i, thumbSize) {
  if (i.settings.minScrollbarLength) {
    thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
  }
  if (i.settings.maxScrollbarLength) {
    thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
  }
  return thumbSize;
}

function updateCss(element, i) {
  var xRailOffset = {width: i.railXWidth};
  if (i.isRtl) {
    xRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth - i.contentWidth;
  } else {
    xRailOffset.left = element.scrollLeft;
  }
  if (i.isScrollbarXUsingBottom) {
    xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
  } else {
    xRailOffset.top = i.scrollbarXTop + element.scrollTop;
  }
  dom.css(i.scrollbarXRail, xRailOffset);

  var yRailOffset = {top: element.scrollTop, height: i.railYHeight};
  if (i.isScrollbarYUsingRight) {
    if (i.isRtl) {
      yRailOffset.right = i.contentWidth - (i.negativeScrollAdjustment + element.scrollLeft) - i.scrollbarYRight - i.scrollbarYOuterWidth;
    } else {
      yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
    }
  } else {
    if (i.isRtl) {
      yRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth * 2 - i.contentWidth - i.scrollbarYLeft - i.scrollbarYOuterWidth;
    } else {
      yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
    }
  }
  dom.css(i.scrollbarYRail, yRailOffset);

  dom.css(i.scrollbarX, {left: i.scrollbarXLeft, width: i.scrollbarXWidth - i.railBorderXWidth});
  dom.css(i.scrollbarY, {top: i.scrollbarYTop, height: i.scrollbarYHeight - i.railBorderYWidth});
}

module.exports = function (element) {
  var i = instances.get(element);

  i.containerWidth = element.clientWidth;
  i.containerHeight = element.clientHeight;
  i.contentWidth = element.scrollWidth;
  i.contentHeight = element.scrollHeight;

  var existingRails;
  if (!element.contains(i.scrollbarXRail)) {
    existingRails = dom.queryChildren(element, '.ps__scrollbar-x-rail');
    if (existingRails.length > 0) {
      existingRails.forEach(function (rail) {
        dom.remove(rail);
      });
    }
    dom.appendTo(i.scrollbarXRail, element);
  }
  if (!element.contains(i.scrollbarYRail)) {
    existingRails = dom.queryChildren(element, '.ps__scrollbar-y-rail');
    if (existingRails.length > 0) {
      existingRails.forEach(function (rail) {
        dom.remove(rail);
      });
    }
    dom.appendTo(i.scrollbarYRail, element);
  }

  if (!i.settings.suppressScrollX && i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth) {
    i.scrollbarXActive = true;
    i.railXWidth = i.containerWidth - i.railXMarginWidth;
    i.railXRatio = i.containerWidth / i.railXWidth;
    i.scrollbarXWidth = getThumbSize(i, _.toInt(i.railXWidth * i.containerWidth / i.contentWidth));
    i.scrollbarXLeft = _.toInt((i.negativeScrollAdjustment + element.scrollLeft) * (i.railXWidth - i.scrollbarXWidth) / (i.contentWidth - i.containerWidth));
  } else {
    i.scrollbarXActive = false;
  }

  if (!i.settings.suppressScrollY && i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight) {
    i.scrollbarYActive = true;
    i.railYHeight = i.containerHeight - i.railYMarginHeight;
    i.railYRatio = i.containerHeight / i.railYHeight;
    i.scrollbarYHeight = getThumbSize(i, _.toInt(i.railYHeight * i.containerHeight / i.contentHeight));
    i.scrollbarYTop = _.toInt(element.scrollTop * (i.railYHeight - i.scrollbarYHeight) / (i.contentHeight - i.containerHeight));
  } else {
    i.scrollbarYActive = false;
  }

  if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
    i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
  }
  if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
    i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
  }

  updateCss(element, i);

  if (i.scrollbarXActive) {
    element.classList.add('ps--active-x');
  } else {
    element.classList.remove('ps--active-x');
    i.scrollbarXWidth = 0;
    i.scrollbarXLeft = 0;
    updateScroll(element, 'left', 0);
  }
  if (i.scrollbarYActive) {
    element.classList.add('ps--active-y');
  } else {
    element.classList.remove('ps--active-y');
    i.scrollbarYHeight = 0;
    i.scrollbarYTop = 0;
    updateScroll(element, 'top', 0);
  }
};

},{"../lib/dom":2,"../lib/helper":5,"./instances":17,"./update-scroll":19}],19:[function(require,module,exports){
'use strict';

var instances = require('./instances');

var createDOMEvent = function (name) {
  var event = document.createEvent("Event");
  event.initEvent(name, true, true);
  return event;
};

module.exports = function (element, axis, value) {
  if (typeof element === 'undefined') {
    throw 'You must provide an element to the update-scroll function';
  }

  if (typeof axis === 'undefined') {
    throw 'You must provide an axis to the update-scroll function';
  }

  if (typeof value === 'undefined') {
    throw 'You must provide a value to the update-scroll function';
  }

  if (axis === 'top' && value <= 0) {
    element.scrollTop = value = 0; // don't allow negative scroll
    element.dispatchEvent(createDOMEvent('ps-y-reach-start'));
  }

  if (axis === 'left' && value <= 0) {
    element.scrollLeft = value = 0; // don't allow negative scroll
    element.dispatchEvent(createDOMEvent('ps-x-reach-start'));
  }

  var i = instances.get(element);

  if (axis === 'top' && value >= i.contentHeight - i.containerHeight) {
    // don't allow scroll past container
    value = i.contentHeight - i.containerHeight;
    if (value - element.scrollTop <= 2) {
      // mitigates rounding errors on non-subpixel scroll values
      value = element.scrollTop;
    } else {
      element.scrollTop = value;
    }
    element.dispatchEvent(createDOMEvent('ps-y-reach-end'));
  }

  if (axis === 'left' && value >= i.contentWidth - i.containerWidth) {
    // don't allow scroll past container
    value = i.contentWidth - i.containerWidth;
    if (value - element.scrollLeft <= 2) {
      // mitigates rounding errors on non-subpixel scroll values
      value = element.scrollLeft;
    } else {
      element.scrollLeft = value;
    }
    element.dispatchEvent(createDOMEvent('ps-x-reach-end'));
  }

  if (i.lastTop === undefined) {
    i.lastTop = element.scrollTop;
  }

  if (i.lastLeft === undefined) {
    i.lastLeft = element.scrollLeft;
  }

  if (axis === 'top' && value < i.lastTop) {
    element.dispatchEvent(createDOMEvent('ps-scroll-up'));
  }

  if (axis === 'top' && value > i.lastTop) {
    element.dispatchEvent(createDOMEvent('ps-scroll-down'));
  }

  if (axis === 'left' && value < i.lastLeft) {
    element.dispatchEvent(createDOMEvent('ps-scroll-left'));
  }

  if (axis === 'left' && value > i.lastLeft) {
    element.dispatchEvent(createDOMEvent('ps-scroll-right'));
  }

  if (axis === 'top' && value !== i.lastTop) {
    element.scrollTop = i.lastTop = value;
    element.dispatchEvent(createDOMEvent('ps-scroll-y'));
  }

  if (axis === 'left' && value !== i.lastLeft) {
    element.scrollLeft = i.lastLeft = value;
    element.dispatchEvent(createDOMEvent('ps-scroll-x'));
  }

};

},{"./instances":17}],20:[function(require,module,exports){
'use strict';

var _ = require('../lib/helper');
var dom = require('../lib/dom');
var instances = require('./instances');
var updateGeometry = require('./update-geometry');
var updateScroll = require('./update-scroll');

module.exports = function (element) {
  var i = instances.get(element);

  if (!i) {
    return;
  }

  // Recalcuate negative scrollLeft adjustment
  i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;

  // Recalculate rail margins
  dom.css(i.scrollbarXRail, 'display', 'block');
  dom.css(i.scrollbarYRail, 'display', 'block');
  i.railXMarginWidth = _.toInt(dom.css(i.scrollbarXRail, 'marginLeft')) + _.toInt(dom.css(i.scrollbarXRail, 'marginRight'));
  i.railYMarginHeight = _.toInt(dom.css(i.scrollbarYRail, 'marginTop')) + _.toInt(dom.css(i.scrollbarYRail, 'marginBottom'));

  // Hide scrollbars not to affect scrollWidth and scrollHeight
  dom.css(i.scrollbarXRail, 'display', 'none');
  dom.css(i.scrollbarYRail, 'display', 'none');

  updateGeometry(element);

  // Update top/left scroll to trigger events
  updateScroll(element, 'top', element.scrollTop);
  updateScroll(element, 'left', element.scrollLeft);

  dom.css(i.scrollbarXRail, 'display', '');
  dom.css(i.scrollbarYRail, 'display', '');
};

},{"../lib/dom":2,"../lib/helper":5,"./instances":17,"./update-geometry":18,"./update-scroll":19}]},{},[1]);

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['angular'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('angular'));
  } else {
    root.returnExports = factory(root.angular);
  }
}(this, function(angular) {
'use strict';

angular.module('angular-notification-icons', ['angular-notification-icons.tpls']);
angular.module('angular-notification-icons.tpls', []);

angular.module("angular-notification-icons.tpls").run(["$templateCache", function($templateCache) {$templateCache.put("template/notification-icon.html","<div class=\"angular-notifications-container\">\n    <div class=\"angular-notifications-icon overlay\" ng-show=\"notification.visible\"><div ng-hide=\"notification.hideCount\">{{notification.count}}</div></div>\n    <div class=\"notification-inner\">\n        <ng-transclude></ng-transclude>\n    </div>\n</div>");}]);
/* global angular */

'use strict';

var NotificationDirectiveController = function($scope, $animate, $q) {
  var self = this;
  self.visible = false;
  self.wideThreshold = self.wideThreshold || 100;
  self.alwaysShow = self.alwaysShow || false;

  var animationPromise;
  var animationSet = {
    appear: self.appearAnimation || self.animation || 'grow',
    update: self.updateAnimation || self.animation || 'grow',
    disappear: self.disappearAnimation
  };

  self.getElement = function(element) {
    return angular.element(element[0].querySelector('.angular-notifications-icon'));
  };

  self.init = function(element) {
    self.$element = self.getElement(element);
    if (self.clearTrigger) {
      element.on(self.clearTrigger, function() {
        self.count = 0;
        $scope.$apply();
      });
    }
  };

  var handleAnimation = function(animationClass) {
    if (animationClass) {
      if (animationPromise) {
        $animate.cancel(animationPromise);
      }

      // Can't chain because the chained promise doesn't have a cancel function.
      animationPromise = $animate.addClass(self.$element, animationClass);
      animationPromise.then(function() {
        self.$element.removeClass(animationClass);
        return $q.when(true);
      });

      return animationPromise;
    }

    return $q.when(false);
  };

  var appear = function() {
    self.visible = true;
    handleAnimation(animationSet.appear);
  };

  var clear = function() {
    handleAnimation(animationSet.disappear).then(function(needsDigest) {
      self.visible = false;
      if (needsDigest) {
        $scope.$apply();
      }
    });
  };

  var update = function() {
    handleAnimation(animationSet.update);
  };

  $scope.$watch(function() { return self.count; }, function() {
    if (self.visible === false && (self.alwaysShow || self.count > 0)) {
      appear();
    } else if (!self.alwaysShow && self.visible === true && self.count <= 0) {
      // Only clear if we're not always showing
      clear();
    } else {
      update();
    }

    // Use more of a pill shape if the count is high enough.
    if (Math.abs(self.count) >= self.wideThreshold) {
      self.$element.addClass('wide-icon');
    } else {
      self.$element.removeClass('wide-icon');
    }
  });
};

var notificationDirective = function() {
  return {
    restrict: 'EA',
    scope: {
      count: '=',
      hideCount: '@',
      alwaysShow: '@',
      animation: '@',
      appearAnimation: '@',
      disappearAnimation: '@',
      updateAnimation: '@',
      clearTrigger: '@',
      wideThreshold: '@'
    },
    controller: 'NotificationDirectiveController',
    controllerAs: 'notification',
    bindToController: true,
    transclude: true,
    templateUrl: 'template/notification-icon.html',
    link: function(scope, element, attrs, ctrl) {
      ctrl.init(element);
    }
  };
};

angular.module('angular-notification-icons')
  .controller('NotificationDirectiveController', ['$scope', '$animate', '$q', NotificationDirectiveController])
  .directive('notificationIcon', notificationDirective);

return { NotificationDirectiveController: NotificationDirectiveController, notificationDirective: notificationDirective };
}));

(function(){
    angular.module("kittron", [
        'ui.router',
        'homeModule',
        'hotelModule',
        'eventCenterModule',
        'eventPlannerModule',
        'vendorModule',
        'ui.router.title',
        'oc.lazyLoad',
        'ngMaterial',
        'satellizer',
        'account'
    ]);
})();


angular.module('kittron')
    .controller('MainCtrl',['$scope','$state',MainCtrl]);

function MainCtrl($scope,$state) {
		$scope.showMenu = false;
		var menu = angular.element('.menu');
    $scope.menuToggle = function(){
    	$scope.showMenu = !$scope.showMenu;
        // if($scope.showMenu){
        //     menu.addClass('show_menu magictime puffIn');
        //
        // }else {
        //     menu.addClass('magictime puffOut');
        //     menu.removeClass('show_menu magictime puffIn');
        //
        // }
    	
    	
    };
    $scope.goto = function(s){
        $scope.menuToggle();
    	$state.go(s);
    	
    };
}
(function() {
    "use strict";
    var Kittron = angular.module('kittron');
    Kittron.config(['$locationProvider', '$urlRouterProvider', '$stateProvider','$ocLazyLoadProvider','$mdIconProvider','$authProvider','$mdThemingProvider','$titleProvider', function ($locationProvider, $urlRouterProvider, $stateProvider,$ocLazyLoadProvider,$mdIconProvider,$authProvider,$mdThemingProvider,$titleProvider) {
        //$locationProvider.html5Mode(true).hashPrefix('!');
        // $locationProvider.html5Mode(true);
        $titleProvider.documentTitle(['$rootScope',function($rootScope) {
            return $rootScope.$title ? $rootScope.$title + " - Kittron" : "Kittron";
        }]);
        var skipIfLoggedIn = ['$q', '$auth', function($q, $auth) {
            var deferred = $q.defer();
            if ($auth.isAuthenticated()) {
                deferred.reject();
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }];

        var loginRequired = ['$q', '$location', '$auth', function($q, $location, $auth) {
            var deferred = $q.defer();
            if ($auth.isAuthenticated()) {
                deferred.resolve();
            } else {
                $location.path('/login');
            }
            return deferred.promise;
        }];
		$urlRouterProvider.otherwise('/');
        $stateProvider.state('home', {
            url: '/',
            resolve: {
                // Constant title
                $title: function() { return 'Kittron';

                }
            },
            template: '<home-page></home-page>'
        });
        $stateProvider.state('hotel', {
            url: '/hotels',
            resolve: {
                // Constant title
                $title: function() { return 'Hotels';

                }
            },
            template: '<hotel></hotel>'
        });
        $stateProvider.state('hotel_query', {
            url: '/hotels/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Hotels';

                }
            },
            template: '<hotel-result></hotel-result>'
        });
        $stateProvider.state('event_center', {
            url: '/event_center',
            resolve: {
                $title: function() {
                    return 'Event Centers';
                }
            },
           template: '<event_center></event_center>'

        });
        $stateProvider.state('event_center_query', {
            url: '/event_center/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Event Center';

                }
            },
            template: '<event-center-result></event-center-result>'
        });
        $stateProvider.state('event_planners', {
            url: '/event_planners',
            resolve: {
                $title: function() {
                    return 'Event Planners';
                }
            },
           template: '<event_planner></event_planner>'

        });
        $stateProvider.state('event_planners_query', {
            url: '/event_planner/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Event Planner';

                }
            },
            template: '<event-planner-result></event-planner-result>'
        });
        $stateProvider.state('vendor', {
            url: '/vendor',
            resolve: {
                $title: function() {
                    return 'Vendor';
                }
            },
           template: '<vendor></vendor>'

        });
        $stateProvider.state('vendor_query', {
            url: '/vendor/search_result',
            resolve: {
                // Constant title
                $title: function() { return 'Vendor';

                }
            },
            template: '<vendor-result></vendor-result>'
        });
        $stateProvider.state('how_kittron_works', {
            url: '/how_kittron_works',
            resolve: {
                $title: function() {
                    return 'How Kittron Works';
                }
            },
           templateUrl: 'public/how_kittron_works/how_kittron_works.template.html'

        });
        $stateProvider.state('faq_help', {
            url: '/faq_help',
            resolve: {
                $title : function(){
                    return ' Frequently Asked Questions and Help | Kittron';
                }
            },
            templateUrl: 'public/faq_help/faq_help.template.html'

        });

        $stateProvider.state('login', {
            url: '/login',
            resolve: {
                $title: function(){
                    return 'Login into Kittron Account';
                },
                //skipIfLoggedIn: skipIfLoggedIn
            },
            template: '<login></login>'
        });
        $stateProvider.state('logout', {
            url: '/logout',
            controller: 'LogoutCtrl',
            template: null
        });
        $stateProvider.state('forgetPwd',{
                url : '/recoverPassword',
                resolve : {
                    $title: function(){
                        return 'Recover Password';
                    }
                },
                template : '<forgot-pwd></forgot-pwd>'
            });

        $stateProvider.state('customerCare', {
            url: '/customer_care',
            data: {
                pageTitle: 'Customer Care | Kittron'
            },
            template: '<h1>Bayjuguj</h1>'
        });
        $stateProvider.state('frontDesk', {
            url: '/front_desk',
            data: {
                pageTitle: 'Front Desk | Kittron'
            },
            template: '<h1>Front Desk | Kittron</h1>'
        });
        $stateProvider.state('termsOfUse', {
            url: '/terms_of_use',
            data: {
                pageTitle: 'Terms Of Use | Kittron'
            },
            template: '<h1>Terms</h1>'
        });
        $stateProvider.state('privacyPolicy', {
            url: '/privacy_policy',
            data: {
                pageTitle: 'Privacy Policy | Kittron'
            },
            template: '<h1>Privacy</h1>'
        });
        $stateProvider.state('joinKittron', {
            url: '/join_kittron',
            data: {
                pageTitle: 'Join Kittron | Kittron'
            },
            template: '<h1>join_kittron</h1>'
        });
        $stateProvider.state('coverage', {
            url: '/coverage',
            data: {
                pageTitle: 'Coverage | Kittron'
            },
            template: '<h1>coverage</h1>'
        });
        $stateProvider.state('affiliates', {
            url: '/affiliates',
            data: {
                pageTitle: 'Affiliates | Kittron'
            },
            template: '<h1>Affiliates</h1>'
        });
        $mdThemingProvider
            .theme('default')
            .primaryPalette('blue')
            .accentPalette('light-blue')
            .warnPalette('red')
            .backgroundPalette('grey');

        $authProvider.tokenName = 'token';
        $authProvider.tokenPrefix = 'kittron';
        $authProvider.tokenHeader = 'Authorization';
        $authProvider.baseUrl = 'http://kittron.com/';
        $authProvider.loginUrl = 'login';
        $authProvider.signupUrl = 'signup';
        $authProvider.tokenType = 'Bearer';
        $authProvider.setStorageType = 'localStorage';
    }]);
   Kittron.run(['$rootScope','$state','$stateParams', function($rootScope, $state, $stateParams){
        $rootScope.goto = function(ev) {
            $state.go(ev);
        };
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.isLogin = true;
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.preloader = true;
            //console.log($state);
           // alert('changing');
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.preloader = false;
           // alert('changed');
        });
    }]);
})();
(function () {
    "use strict";
    angular.module("kittron");
})();
(function(){
    "use strict";
    angular.module("homeModule", []);
}());
(function () {
	"use strict";
	angular
		.module('homeModule')
        .component('homePage', {
            templateUrl: 'ngf/home/home.template.html',
            controller: ['$scope',function($scope) {
                $scope.board = [{
		"name": "KLM Hotel and Suits",
		"type": "Hotel (7 stars)",
		"rating": 1,
		"visits": 22,
		"price": 20000,
		"location": [{
				"add": "Location before my house at the end of my nei",
				"geo": {
					"long": "1.4453",
					"lat": "1.43534355"
				}

			}

		],
		"offer": "best Valentine discount",
		"discription": "KLM your satisfaction is our delight",
		"img": "sample1.jpg",
		"siteUrl": "klm.kr.com",
		"facility": [
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
			"Breakfast",
			"Restaurant",
			"Local Bar",
			"Kitchen",
			"Smoking Room"
		]
	},
	{
		"name": "KLM Hotel and Suits",
		"type": "Hotel (7 stars)",
		"rating": 1,
		"visits": 22,
		"price": 20000,
		"location": [{
				"add": "Location before my house at the end of my nei",
				"geo": {
					"long": "1.4453",
					"lat": "1.43534355"
				}

			}

		],
		"offer": "best Valentine discount",
		"discription": "KLM your satisfaction is our delight",
		"img": "sample1.jpg",
		"siteUrl": "klm.kr.com",
		"facility": [
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
			"Breakfast",
			"Restaurant",
			"Local Bar",
			"Kitchen",
			"Smoking Room"
		]
	},
	{
		"name": "KLM Hotel and Suits",
		"type": "Hotel (7 stars)",
		"rating": 1,
		"visits": 22,
		"price": 20000,
		"location": [{
				"add": "Location before my house at the end of my nei",
				"geo": {
					"long": "1.4453",
					"lat": "1.43534355"
				}

			}

		],
		"offer": "best Valentine discount",
		"discription": "KLM your satisfaction is our delight",
		"img": "sample1.jpg",
		"siteUrl": "klm.kr.com",
		"facility": [
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
			"Breakfast",
			"Restaurant",
			"Local Bar",
			"Kitchen",
			"Smoking Room"
		]
	},
	{
		"name": "KLM Hotel and Suits",
		"type": "Hotel (7 stars)",
		"rating": 1,
		"visits": 22,
		"price": 20000,
		"location": [{
				"add": "Location before my house at the end of my nei",
				"geo": {
					"long": "1.4453",
					"lat": "1.43534355"
				}

			}

		],
		"offer": "best Valentine discount",
		"discription": "KLM your satisfaction is our delight",
		"img": "sample1.jpg",
		"siteUrl": "klm.kr.com",
		"facility": [
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
			"Breakfast",
			"Restaurant",
			"Local Bar",
			"Kitchen",
			"Smoking Room"
		]
	},
	{
		"name": "KLM Hotel and Suits",
		"type": "Hotel (7 stars)",
		"rating": 1,
		"visits": 22,
		"price": 20000,
		"location": [{
				"add": "Location before my house at the end of my nei",
				"geo": {
					"long": "1.4453",
					"lat": "1.43534355"
				}

			}

		],
		"offer": "best Valentine discount",
		"discription": "KLM your satisfaction is our delight",
		"img": "sample1.jpg",
		"siteUrl": "klm.kr.com",
		"facility": [
			"wifi",
			"Shuttle",
			"pool",
			"Air conditioned",
			"Room Service",
			"Breakfast",
			"Restaurant",
			"Local Bar",
			"Kitchen",
			"Smoking Room"
		]
	}
	];

                $scope.show_on_map =function (geo) {
                    console.log(geo);
                }
            }]
        });
}());
(function(){
    "use strict";
    angular.module("hotelModule", ['angularUtils.directives.dirPagination']);
}());
(function () {
    "use strict";
    
       var hotelModule = angular.module('hotelModule');
        hotelModule.component('hotel', {
            controller: ['$scope','$state','$timeout','$q','$log','$http', function($scope, $state,$timeout,$q,$log,$http) {
                var link = 'http://projects.dev/ki/public/hotels';
                $scope.hotel = {};

                $scope.find_hotel = function(){
                    // $state.go('hotel_query');
                    $http.post(link,{'q': $scope.hotel}).then(function (res) {
                        $scope.hotels = res.data;
                        $log.info($scope.hotels);


                    });
                };
                $scope.find_hotelWithin = function(){
                    $http.get('https://ipinfo.io').then(function (res) {
                        $scope.hotel.location = res.data.city +' '+ res.data.region;
                    });
                    $log.info($scope.hotel);
                };




                $scope.simulateQuery = false;

                // list of `state` value/display objects
                $scope.states        = loadAll();
                $scope.querySearch   = querySearch;
                $scope.selectedItemChange = selectedItemChange;

                // ******************************
                // Internal methods
                // ******************************

                /**
                 * Search for states... use $timeout to simulate
                 * remote dataservice call.
                 */
                function querySearch (query) {
                    var results = query ? $scope.states.filter( createFilterFor(query) ) : $scope.states,
                        deferred;
                    if ($scope.simulateQuery) {
                        deferred = $q.defer();
                        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
                        return deferred.promise;
                    } else {
                        return results;
                    }
                }


                function selectedItemChange(item) {
                    if(item){
                        $scope.hotel.location = item.value;
                    }
                }


                /**
                 * Build `states` list of key/value pairs
                 */
                function loadAll() {
                    var allStates = 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
              Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
              Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
              Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
              North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
              South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
              Wisconsin, Wyoming';

                    return allStates.split(/, +/g).map( function (state) {
                        return {
                            value: state.toLowerCase(),
                            display: state
                        };
                    });
                }

                /**
                 * Create filter function for a query string
                 */
                function createFilterFor(query) {
                    var lowercaseQuery = angular.lowercase(query);

                    return function filterFn(state) {
                        return (state.value.indexOf(lowercaseQuery) === 0);
                    };

                }

            }],
            templateUrl: 'ngf/hotel/hotel.template.html'
        });

        
        hotelModule.component('hotelResult',{
        	templateUrl:'ngf/hotel/hotel_result.template.html',
        	controller: ['$scope','orderByFilter', function($scope, orderBy){

        	}]
        });
}());

angular.module('hotelModule')
    .controller('HotelResultCtrl',['$scope','orderByFilter','$mdSidenav','$http',HotelResultCtrl]);

function HotelResultCtrl($scope,orderBy,$mdSidenav,$http) {

    $scope.showAll = true;
    $scope.toggleFilter = function () {
        $mdSidenav('right')
            .toggle();
    };
    $scope.checkChange = function() {
        for(t in $scope.facilities){
            if($scope.facilities[t].on){
                $scope.showAll = false;
                return;
            }
        }
        $scope.showAll = true;
    };

    $scope.myFunc = function(a) {
        if($scope.showAll) { return true; }

        var sel = false;

        for(tech in $scope.facilities){
            var t = $scope.facilities[tech];
            console.log(t);
            if(t.on){
                if(a.facility.indexOf(t.name) == -1){
                    return false;
                }else{
                    sel = true;
                }
            }
        }
        return sel;
    };


    $scope.price_trending_up = true;
    $scope.rating_trending_up = true;
    $scope.hasFacicility = function(bf,f){
        if(bf.lastIndexOf(f) !== -1){
            return true;
        }

        else{
            return false;

        }
    };



    $scope.facilities = [
        {name:"Free cancellation", icon:"backspace", on: false},
        {name:"wifi", icon:"wifi", on: false},
        {name:"Shuttle", icon:"airport_shuttle", on: false},
        {name:"Pool", icon:"pool", on: false},
        {name:"Air conditioned", icon:"ac_unit", on: false},
        {name:"Room Service",  icon:"room_service", on: false},
        {name:"Breakfast", icon:"free_breakfast", on: false},
        {name:"Restaurant", icon:"restaurant", on: false},
        {name:"Local Bar", icon:"local_bar", on: false},
        {name:"Bath Tub", icon:"hot_tub",on: false},
        {name:"Kitchen", icon:"kitchen", on: false},
        {name:"Gym", icon:"fitness_center", on: false},
        {name:"Spa", icon:"spa", on: false},
        {name:"Smoking Room", icon:"smoking_rooms", on: false},
        {name:"Smoke Free", icon:"smoke_free", on: false}
    ];

    var link = 'http://projects.dev/ki/public/hotels';
    $http.get(link).then(function (res) {
        $scope.hotels = res.data;
        $scope.board = $scope.hotels;

    });

    // var board = $scope.hotels;
    // console.log(board);

    // var board = [
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Free cancellation",
    //             "Shuttle",
    //             "Air conditioned",
    //             "Breakfast",
    //             "Restaurant",
    //             "Local Bar",
    //             "Kitchen",
    //             "Smoking Room"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Spa",
    //             "pool",
    //             "Bath Tub",
    //             "Room Service",
    //             "Breakfast",
    //             "Restaurant",
    //             "Local Bar",
    //             "Smoke Free",
    //             "Smoking Room"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Gym",
    //             "pool",
    //             "Air conditioned",
    //             "Room Service",
    //             "Bath Tub",
    //             "Restaurant",
    //             "Local Bar",
    //             "Spa",
    //             "Smoking Room"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //
    //             "Shuttle"
    //         ]
    //     },
    //     {
    //         "name": "KLM Hotel and Suits",
    //         "type": "Hotel (7 stars)",
    //         "rating": 1,
    //         "visits": 22,
    //         "price": 20000,
    //         "location": [{
    //             "add": "Location before my house at the end of my nei",
    //             "geo": {
    //                 "long": "1.4453",
    //                 "lat": "1.43534355"
    //             }
    //
    //         }
    //
    //         ],
    //         "offer": "best Valentine discount",
    //         "discription": "KLM your satisfaction is our delight",
    //         "img": "sample1.jpg",
    //         "siteUrl": "klm.kr.com",
    //         "facility": [
    //             "Free cancellation",
    //             "wifi",
    //             "Shuttle",
    //             "pool",
    //             "Air conditioned",
    //             "Room Service",
    //             "Bath Tub",
    //             "Breakfast",
    //             "Restaurant",
    //             "Local Bar",
    //             "Kitchen",
    //             "Smoking Room"
    //         ]
    //     }
    // ];

    $scope.priceMin = 5;
    $scope.propertyName = 'price';
    $scope.reverse = true;
    $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);

    $scope.sortRating = function(propName){
        $scope.rating_trending_up = !$scope.rating_trending_up;
        $scope.propertyName = propName;
        if($scope.rating_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }


    };
    $scope.sortPrice = function(propName){
        $scope.price_trending_up = !$scope.price_trending_up;
        $scope.propertyName = propName;
        if($scope.price_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy($scope.hotels, $scope.propertyName, $scope.reverse);
        }

    };



    $scope.show_on_map =function (geo) {
        console.log(geo);
    }


}
(function(){
    "use strict";
    angular.module("eventCenterModule", ['ngMaterial']);
}());
/**
 * Created by user on 8/15/2017.
 */
(function () {
    "use strict";
    angular.module('eventCenterModule')
        .config(['$mdThemingProvider',function ($mdThemingProvider) {
            $mdThemingProvider.theme('bar')
                .primaryPalette('cyan')
                .backgroundPalette('cyan')
                .warnPalette('blue-grey')
                .accentPalette('blue-grey');
        }]);
})();

(function () {
    "use strict";
    
       var hotelModule = angular.module('eventCenterModule');
        hotelModule.component('eventCenter', {
            templateUrl: 'ngf/event_center/event_center.template.html',
            controller: ['$scope','$state','$log','$q','$timeout', function($scope, $state,$log,$q,$timeout) {
                $scope.find_event_venue = function(){
                	$state.go('event_center_query');
                };

                $scope.simulateQuery = false;
                $scope.isDisabled    = false;

                // list of `state` value/display objects
                $scope.states        = loadAll();
                $scope.querySearch   = querySearch;
                $scope.selectedItemChange = selectedItemChange;
                $scope.searchTextChange   = searchTextChange;

                $scope.newState = newState;

                function newState(state) {
                    alert("Sorry! You'll need to create a Constitution for " + state + " first!");
                }

                // ******************************
                // Internal methods
                // ******************************

                /**
                 * Search for states... use $timeout to simulate
                 * remote dataservice call.
                 */
                function querySearch (query) {
                    var results = query ? $scope.states.filter( createFilterFor(query) ) : $scope.states,
                        deferred;
                    if ($scope.simulateQuery) {
                        deferred = $q.defer();
                        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
                        return deferred.promise;
                    } else {
                        return results;
                    }
                }

                function searchTextChange(text) {
                    $log.info('Text changed to ' + text);
                }

                function selectedItemChange(item) {
                    $log.info('Item changed to ' + JSON.stringify(item));
                }

                /**
                 * Build `states` list of key/value pairs
                 */
                function loadAll() {
                    var allStates = 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
              Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
              Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
              Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
              North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
              South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
              Wisconsin, Wyoming';

                    return allStates.split(/, +/g).map( function (state) {
                        return {
                            value: state.toLowerCase(),
                            display: state
                        };
                    });
                }

                /**
                 * Create filter function for a query string
                 */
                function createFilterFor(query) {
                    var lowercaseQuery = angular.lowercase(query);

                    return function filterFn(state) {
                        return (state.value.indexOf(lowercaseQuery) === 0);
                    };

                }

            }]
        });
        
        hotelModule.component('eventCenterResult',{
        	templateUrl:'ngf/event_center/event_center_result.template.html',
        	controller: ['$scope','orderByFilter', function($scope, orderBy){
        		             
        		                $scope.price_trending_up = true; 
        		                $scope.rating_trending_up = true; 
        		                
        		                 
        		                var board = [
                    {
                        name : 'KLM Hotel and Suits',
                        type : 'Hotel (7 stars)',
                        rating : 1,
                        visits : 22,
                        price : 20000,
                        location : {
                            add : 'Location before my house at the end of my nei',
                            geo : {
                                long : '1.4453',
                                lat : '1.43534355'
                            }
                        },
                        offer : 'best Valentine discount',
                        discription : 'KLM your satisfaction is our delight',
                        img : 'sample1.jpg',
                        siteUrl : 'klm.kr.com',
                        facility : {
                            wifi : true,
                            airport_shuttle : true,
                            pool : false,
                            air_conditioned : true,
                            room_service : true,
                            breakfast : true,
                            restaurant : true,
                            local_bar : true,
                            security : false,
                            Speakers : false,
                        }
                    },
                    {
                        name : 'Majestic Event Center',
                        type : 'Event Center',
                        rating : 2,
                        visits : 34,
                        price : 30400,
                        location : {
                            add : 'Location is majestic event center',
                            geo : {
                                long : '1.4453',
                                lat : '1.43534355'
                            }
                        },
                        offer : '',
                        discription : 'Majectic simply for you',
                        img : 'sample1.jpg',
                        siteUrl : 'majestic.kr.com',
                        facility : {
                            wifi : false,
                            airport_shuttle : false,
                            pool : false,
                            air_conditioned : true,
                            room_service : false,
                            breakfast : false,
                            restaurant : false,
                            local_bar : true,
                            security : true,
                            Speakers : true,
                        }
                    },
                    {
                        name : 'Happy Hotel and Suits',
                        type : 'Hotel (General)',
                        rating : 3,
                        visits : 22,
                        price : 25000,
                        location : {
                            add : 'Location before my house at the end of my nei',
                            geo : {
                                long : '1.4453',
                                lat : '1.43534355'
                            }
                        },
                        offer : 'best Valentine discount',
                        discription : 'KLM your satisfaction is our delight',
                        img : 'sample1.jpg',
                        siteUrl : 'klm.kr.com',
                        facility : {
                            wifi : true,
                            airport_shuttle : false,
                            pool : false,
                            air_conditioned : true,
                            room_service : true,
                            breakfast : true,
                            restaurant : false,
                            local_bar : true,
                            security : false,
                            Speakers : false,
                        }
                    },
                    {
                        name : 'J and jays Event Planner',
                        type : 'Event Planner',
                        rating : 4,
                        visits : 18,
                        price : 19000,
                        location : {
                            add : 'Location before my house at the end of my nei',
                            geo : {
                                long : '1.4453',
                                lat : '1.43534355'
                            }
                        },
                        offer : 'best Valentine discount',
                        discription : 'KLM your satisfaction is our delight',
                        img : 'sample1.jpg',
                        siteUrl : 'klm.kr.com',
                        facility : {
                            wifi : true,
                            airport_shuttle : true,
                            pool : false,
                            air_conditioned : true,
                            room_service : true,
                            breakfast : true,
                            restaurant : true,
                            local_bar : true,
                            security : false,
                            Speakers : false,
                        }
                    },
                    {
                        name : 'Roses Decorator',
                        type : 'Vendor',
                        rating : 5,
                        visits : 10,
                        price : 1000,
                        location : {
                            add : 'Location before my house at the end of my nei',
                            geo : {
                                long : '1.4453',
                                lat : '1.43534355'
                            }
                        },
                        offer : '',
                        discription : 'KLM your satisfaction is our delight',
                        img : 'sample1.jpg',
                        siteUrl : 'klm.kr.com',
                        facility : {
                            wifi : true,
                            airport_shuttle : true,
                            pool : false,
                            air_conditioned : true,
                            room_service : true,
                            breakfast : true,
                            restaurant : true,
                            local_bar : true,
                            security : false,
                            Speakers : false,
                        }
                    }
                ];
                
                 $scope.priceMin = 5;
                 $scope.propertyName = 'price';
 								 $scope.reverse = true;
  							 $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
  							 
  							 $scope.sortRating = function(propName){
        		                	$scope.rating_trending_up = !$scope.rating_trending_up;
        		                	$scope.propertyName = propName;
        		                	if($scope.rating_trending_up){
        		                			 $scope.reverse = true;
  							 					$scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        		                	}
        		                	else{
        		                		 $scope.reverse = false;
  								 		$scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        		                	}
        		     
        		                	
        		        }; 
        		     $scope.sortPrice = function(propName){
        		                	$scope.price_trending_up = !$scope.price_trending_up;
        		                	$scope.propertyName = propName;
        		                	if($scope.price_trending_up){
        		                			 $scope.reverse = true;
  							 					$scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        		                	}
        		                	else{
        		                		 $scope.reverse = false;
  								 		$scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        		                	}
        		                	
        		                	 }; 

                

                $scope.show_on_map =function (geo) {
                    console.log(geo);
                }
        	}]
        });
}());

angular.module('eventCenterModule')
    .controller('EventResultCtrl',['$scope','orderByFilter','$mdSidenav',EventResultCtrl]);

function EventResultCtrl($scope,orderBy,$mdSidenav) {

    $scope.showAll = true;
    $scope.toggleFilter = function () {
        $mdSidenav('right')
            .toggle();
    };
    $scope.checkChange = function() {
        for(t in $scope.facilities){
            if($scope.facilities[t].on){
                $scope.showAll = false;
                return;
            }
        }
        $scope.showAll = true;
    };

    $scope.myFunc = function(a) {
        if($scope.showAll) { return true; }

        var sel = false;

        for(tech in $scope.facilities){
            var t = $scope.facilities[tech];
            console.log(t);
            if(t.on){
                if(a.facility.indexOf(t.name) == -1){
                    return false;
                }else{
                    sel = true;
                }
            }
        }
        return sel;
    };


    $scope.price_trending_up = true;
    $scope.rating_trending_up = true;
    $scope.hasFacicility = function(bf,f){
        if(bf.lastIndexOf(f) !== -1){
            return true;
        }

        else{
            return false;

        }
    };



    $scope.facilities = [
        {name:"Aquarium/Zoo", icon:"backspace", on: false},
        {name:"Arena/Stadium", icon:"wifi", on: false},
        {name:"Banquet Facility", icon:"airport_shuttle", on: false},
        {name:"Bar/Club", icon:"pool", on: false},
        {name:"Corporate Office Space", icon:"ac_unit", on: false},
        {name:"Educational Facility",  icon:"room_service", on: false},
        {name:"Exposition Center",  icon:"room_service", on: false},
        {name:"Entertainment Venue", icon:"free_breakfast", on: false},
        {name:"Gallery/Museum", icon:"restaurant", on: false},
        {name:"Golf Course", icon:"local_bar", on: false},
        {name:"Movie Theater", icon:"hot_tub",on: false},
        {name:"Convention Center", icon:"kitchen", on: false},
        {name:"Convention & Visitors Bureau (CVB)", icon:"fitness_center", on: false},
        {name:"Restaurant", icon:"spa", on: false},
        {name:"Conference Center", icon:"smoking_rooms", on: false},
        {name:"Smoke Free", icon:"smoke_free", on: false}
    ];


    var board = [
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "Shuttle",
                "Air conditioned",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Spa",
                "pool",
                "Bath Tub",
                "Room Service",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Smoke Free",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Gym",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Restaurant",
                "Local Bar",
                "Spa",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [

                "Shuttle"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "wifi",
                "Shuttle",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        }
    ];

    $scope.priceMin = 5;
    $scope.propertyName = 'price';
    $scope.reverse = true;
    $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);

    $scope.sortRating = function(propName){
        $scope.rating_trending_up = !$scope.rating_trending_up;
        $scope.propertyName = propName;
        if($scope.rating_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }


    };
    $scope.sortPrice = function(propName){
        $scope.price_trending_up = !$scope.price_trending_up;
        $scope.propertyName = propName;
        if($scope.price_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }

    };



    $scope.show_on_map =function (geo) {
        console.log(geo);
    }


}
(function(){
    "use strict";
    angular.module("eventPlannerModule", ['angularUtils.directives.dirPagination']);
}());
(function () {
    "use strict";
    
       var eventPModule = angular.module('eventPlannerModule');
    eventPModule.component('eventPlanner', {
            templateUrl: 'ngf/event_planner/event_planner.template.html',
            controller: ['$scope','$state', function($scope, $state) {
                $scope.find_event_planner = function(){
                	$state.go('event_planners_query');
                };

            }]
        });


    eventPModule.component('eventPlannerResult',{
        	templateUrl:'ngf/event_planner/event_planner_result.template.html',
        	controller: ['$scope','orderByFilter', function($scope, orderBy){

        	}]
        });
}());

angular.module('eventPlannerModule')
    .controller('EventPlannerResultCtrl',['$scope','orderByFilter',EventPlannerResultCtrl]);

function EventPlannerResultCtrl($scope,orderBy) {

    $scope.showAll = true;
    $scope.checkChange = function() {
        for(t in $scope.facilities){
            if($scope.facilities[t].on){
                $scope.showAll = false;
                return;
            }
        }
        $scope.showAll = true;
    };

    $scope.myFunc = function(a) {
        if($scope.showAll) { return true; }

        var sel = false;

        for(tech in $scope.facilities){
            var t = $scope.facilities[tech];
            console.log(t);
            if(t.on){
                if(a.facility.indexOf(t.name) == -1){
                    return false;
                }else{
                    sel = true;
                }
            }
        }
        return sel;
    };


    $scope.price_trending_up = true;
    $scope.rating_trending_up = true;
    $scope.hasFacicility = function(bf,f){
        if(bf.lastIndexOf(f) !== -1){
            return true;
        }

        else{
            return false;

        }
    };



    $scope.facilities = [
        {name:"Free cancellation", icon:"backspace", on: false},
        {name:"wifi", icon:"wifi", on: false},
        {name:"Shuttle", icon:"airport_shuttle", on: false},
        {name:"Pool", icon:"pool", on: false},
        {name:"Air conditioned", icon:"ac_unit", on: false},
        {name:"Room Service",  icon:"room_service", on: false},
        {name:"Breakfast", icon:"free_breakfast", on: false},
        {name:"Restaurant", icon:"restaurant", on: false},
        {name:"Local Bar", icon:"local_bar", on: false},
        {name:"Bath Tub", icon:"hot_tub",on: false},
        {name:"Kitchen", icon:"kitchen", on: false},
        {name:"Gym", icon:"fitness_center", on: false},
        {name:"Spa", icon:"spa", on: false},
        {name:"Smoking Room", icon:"smoking_rooms", on: false},
        {name:"Smoke Free", icon:"smoke_free", on: false}
    ];


    var board = [
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "Shuttle",
                "Air conditioned",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Spa",
                "pool",
                "Bath Tub",
                "Room Service",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Smoke Free",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Gym",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Restaurant",
                "Local Bar",
                "Spa",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [

                "Shuttle"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "wifi",
                "Shuttle",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        }
    ];

    $scope.priceMin = 5;
    $scope.propertyName = 'price';
    $scope.reverse = true;
    $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);

    $scope.sortRating = function(propName){
        $scope.rating_trending_up = !$scope.rating_trending_up;
        $scope.propertyName = propName;
        if($scope.rating_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }


    };
    $scope.sortPrice = function(propName){
        $scope.price_trending_up = !$scope.price_trending_up;
        $scope.propertyName = propName;
        if($scope.price_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }

    };



    $scope.show_on_map =function (geo) {
        console.log(geo);
    }


}
(function(){
    "use strict";
    angular.module("vendorModule", ['angularUtils.directives.dirPagination']);
}());
(function () {
    "use strict";
    
       var hotelModule = angular.module('vendorModule');
        hotelModule.component('vendor', {
            templateUrl: 'ngf/vendor/vendor.template.html',
            controller: ['$scope','$state', function($scope, $state) {
                $scope.find_vendor = function(){
                	$state.go('vendor_query');
                };
                $scope.vendor_type =[
                    "Audiovisual",
                    "Security Companies",
                    "Giftware",
                    "Interpretation ",
                    "Photographer",
                    "Musician",
                    "Printers",
                    "Destination Management Company",
                    "Communications Consultant",
                    "Stationery Designer",
                    "Promotional Products Distributor",
                    "Private Caterer",
                    "Wine Shop Owner/Sommelier",
                    "Florist",
                    "Party Rental Supplier"
                ];

            }]
        });

        
        hotelModule.component('vendorResult',{
        	templateUrl:'ngf/vendor/vendor_result.template.html',
        	controller: ['$scope','orderByFilter', function($scope, orderBy){

        	}]
        });
}());

angular.module('vendorModule')
    .controller('VendorResultCtrl',['$scope','orderByFilter',VendorResultCtrl]);

function VendorResultCtrl($scope,orderBy) {

    $scope.showAll = true;
    $scope.checkChange = function() {
        for(t in $scope.facilities){
            if($scope.facilities[t].on){
                $scope.showAll = false;
                return;
            }
        }
        $scope.showAll = true;
    };

    $scope.myFunc = function(a) {
        if($scope.showAll) { return true; }

        var sel = false;

        for(tech in $scope.facilities){
            var t = $scope.facilities[tech];
            console.log(t);
            if(t.on){
                if(a.facility.indexOf(t.name) == -1){
                    return false;
                }else{
                    sel = true;
                }
            }
        }
        return sel;
    };


    $scope.price_trending_up = true;
    $scope.rating_trending_up = true;
    $scope.hasFacicility = function(bf,f){
        if(bf.lastIndexOf(f) !== -1){
            return true;
        }

        else{
            return false;

        }
    };



    $scope.facilities = [
        {name:"Free cancellation", icon:"backspace", on: false},
        {name:"wifi", icon:"wifi", on: false},
        {name:"Shuttle", icon:"airport_shuttle", on: false},
        {name:"Pool", icon:"pool", on: false},
        {name:"Air conditioned", icon:"ac_unit", on: false},
        {name:"Room Service",  icon:"room_service", on: false},
        {name:"Breakfast", icon:"free_breakfast", on: false},
        {name:"Restaurant", icon:"restaurant", on: false},
        {name:"Local Bar", icon:"local_bar", on: false},
        {name:"Bath Tub", icon:"hot_tub",on: false},
        {name:"Kitchen", icon:"kitchen", on: false},
        {name:"Gym", icon:"fitness_center", on: false},
        {name:"Spa", icon:"spa", on: false},
        {name:"Smoking Room", icon:"smoking_rooms", on: false},
        {name:"Smoke Free", icon:"smoke_free", on: false}
    ];


    var board = [
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "Shuttle",
                "Air conditioned",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Spa",
                "pool",
                "Bath Tub",
                "Room Service",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Smoke Free",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Gym",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Restaurant",
                "Local Bar",
                "Spa",
                "Smoking Room"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [

                "Shuttle"
            ]
        },
        {
            "name": "KLM Hotel and Suits",
            "type": "Hotel (7 stars)",
            "rating": 1,
            "visits": 22,
            "price": 20000,
            "location": [{
                "add": "Location before my house at the end of my nei",
                "geo": {
                    "long": "1.4453",
                    "lat": "1.43534355"
                }

            }

            ],
            "offer": "best Valentine discount",
            "discription": "KLM your satisfaction is our delight",
            "img": "sample1.jpg",
            "siteUrl": "klm.kr.com",
            "facility": [
                "Free cancellation",
                "wifi",
                "Shuttle",
                "pool",
                "Air conditioned",
                "Room Service",
                "Bath Tub",
                "Breakfast",
                "Restaurant",
                "Local Bar",
                "Kitchen",
                "Smoking Room"
            ]
        }
    ];

    $scope.priceMin = 5;
    $scope.propertyName = 'price';
    $scope.reverse = true;
    $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);

    $scope.sortRating = function(propName){
        $scope.rating_trending_up = !$scope.rating_trending_up;
        $scope.propertyName = propName;
        if($scope.rating_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }


    };
    $scope.sortPrice = function(propName){
        $scope.price_trending_up = !$scope.price_trending_up;
        $scope.propertyName = propName;
        if($scope.price_trending_up){
            $scope.reverse = true;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }
        else{
            $scope.reverse = false;
            $scope.board = orderBy(board, $scope.propertyName, $scope.reverse);
        }

    };



    $scope.show_on_map =function (geo) {
        console.log(geo);
    }


}
(function(){
    "use strict";
    angular.module("account", ['ui.router','angularCountryState','ngMessages','ngAnimate','satellizer','dashboard','krSer']);
})();
/**
 * Created by user on 1/4/2017.
 */
(function(){
    'use strict';
    angular.module('account')
        .config(["$locationProvider", "$stateProvider","$ocLazyLoadProvider","$authProvider",function($locationProvider, $stateProvider,$ocLazyLoadProvider,$authProvider){
            var skipIfLoggedIn = ['$q', '$auth', function($q, $auth) {
                var deferred = $q.defer();
                if ($auth.isAuthenticated()) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }];

            $stateProvider.state('register', {
                abstract: true,
                url: '/register',
                resolve: {
                    $title : function(){
                        return 'Create Your Kittron Account';
                    },
                    skipIfLoggedIn: skipIfLoggedIn
                },
                templateUrl: 'ngf/account/register.template.html'
            });
            $stateProvider.state('register.basic', {
                url: '/',
                loadFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'ngf/account/dashboard/_dashboard_files/mail_box/compose/compose.module.js',
                        'public/account/dashboard/_dashboard_files/mail_box/compose/compose.config.js',
                        'public/account/dashboard/_dashboard_files/mail_box/compose/compose.component.js'
                    ]);
                }],
                templateUrl: 'ngf/account/register/basic.template.html'
            });
            $stateProvider.state('register.business', {
                url: '/',
                templateUrl: 'ngf/account/register/business.template.html'
            });
            $stateProvider.state('register.website', {
                url: '/',
                templateUrl: 'ngf/account/register/website.template.html'
            });
            $stateProvider.state('register.confirm', {
                url: '/',
                templateUrl: 'ngf/account/register/confirm.template.html'
            });
            $stateProvider.state('success', {
                url: '/success',
                templateUrl: 'ngf/account/register/reg_success.template.html'
            });
            $stateProvider.state('verify', {
                url: '/verify/:code',
                controller: 'VerifyCtrl',
                templateUrl: 'ngf/account/register/verification.template.html'
            });

        }]);
}());
(function(){
    "use strict";

    var account = angular.module("account");
        account.component("login",{
            controller : [function(){}],
            templateUrl  : 'ngf/account/login.template.html'
        });
    account.controller('RegisterCtrl', ['$rootScope','$state','$scope','$http','$timeout','$auth','$filter','$q', function($rootScope,$state,$scope,$http,$timeout,$auth,$filter,$q){
        $scope.switcher = true;
        $scope.isVendor = true;
        $scope.vendorServices = [
            "Audiovisual",
            "Security Companies",
            "Giftware",
            "Interpretation ",
            "Photographer",
            "Musician",
            "Printers",
            "Destination Management Company",
            "Communications Consultant",
            "Stationery Designer",
            "Promotional Products Distributor",
            "Private Caterer",
            "Wine Shop Owner/Sommelier",
            "Florist",
            "Party Rental Supplier"
        ];
        $scope.registerAs=function(r){
       		$scope.switcher = false;
       		if(r == 'event_planner'){
       			$scope.isVendor = false;
                $scope.userData.type = 'Event Planner';
            }
       		else{
       			$scope.isVendor = true;
                $scope.userData.type = 'Vendor';

            }
       		
        };		
        $scope.userData ={};
        $scope.userData.krf = $scope.krf;

        $scope.customEmail = function(data){
			if(data.first_name == undefined || data.business_name == undefined){
				return '';
			}
			else{
				var b_name = data.business_name;
				b_name = b_name.replace(' ', '_');
				b_name = angular.lowercase(b_name);
			return data.first_name + '.'+ b_name+'@kr.com';

			}
			
		};

        $scope.signUp = function(){
            $scope.userData.dob = $filter('date')($scope.userData.dob,'yyyy-MM-dd h:mm:ss');
            console.log($scope.userData);
            $auth.signup($scope.userData)
                .then(function(res) {
                    // if(res.status == 200){
                    //     // $state.go('success');
                    //     // console.log('please verify email');
                    // }
                    console.log(res);
                })
                .catch(function(response) {
                    // Handle errors here.
                    // console.log('error');
                    // console.log(response);
                });
        };

    }])
        .directive('emailValidator', [function(){
            return {
                require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.email = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        var regex = /^([^<>()\[\],;:@"\x00-\x20\x7F]|\\.)+@(([a-z]|#\d+?)([a-z0-9]|#\d+?)*([a-z0-9]|#\d+?)\.)+([a-z]{2,4})$/i;
                        return regex.test(value);
                    }
                }
            };
        }])

        .directive('emailAvailability', ['$http','$q',function($http,$q){
            return {
                require : 'ngModel',
                link : function (scope, element, attrs, ngModel) {
                    // ngModel.$asyncValidators.emailavail = function(modelValue, viewValue){
                    //     var value = modelValue || viewValue;
                    //
                    //     return $http.get('http://kittron.com/check', {email: viewValue})
                    //         .then(function resolved() {
                    //             console.log('doesnt');
                    //             console.log(response);
                    //             // return emailavail.$invalid;
                    //             return $q.reject('exists');
                    //         }, function errorCallback(response) {
                    //             console.log('does');
                    //             console.log(response);
                    //             return true;
                    //         });
                    //
                    // };

                    ngModel.$asyncValidators.emailavail = function(modelValue, viewValue) {
                        var value = modelValue || viewValue;

                        // Lookup user by username
                        return $http.post('http://kittron.com/check',{email: viewValue}).
                        then(function resolved() {
                            //username exists, this means validation fails
                            return true;

                        }, function rejected() {
                            //username does not exist, therefore this validation passes
                            return $q.reject('exists');
                        });
                    };
                }
            };
        }])
        .directive('passwordValidate', [function(){
            return {
                require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.password = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        if(value !== undefined){
                            var regex = /[A-Z]\d/;
                            return regex.test(value);
                        }

                    }
                }

            };
        }])
        .directive('passwordMatch', ['$scope', function ($scope) {
            return {
                scope:{
                   matchPass: '=pass'
                },
                require: 'ngModel',
                link: function ($scope, elem , attrs,ngModel) {
                        ngModel.$validators.password = function (modelValue, viewValue, scope) {
                            //var value = modelValue;
                           // var value2 =  scope.matchPass.userData;
                            //return angular.equals(value, value2);
                        }

                }
            };
        }])
        .directive('numberValidate', [function(){
            return {
                require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.telephone = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        var regex = /^(\+\d{1,3} ?)?(\(\d{1,5}\)|\d{1,5}) ?\d{0,7}?$/i;
                        return regex.test(value);
                    }
                }

            };
        }])
        .directive('businessAvailability', [function(){
            return {
				
            };
        }])
        .directive('sAvail', [function(){
            return {

            };
        }])
		.directive('sVal', [function(){
            return {
				require: 'ngModel',
                link: function(scope , element, attrs, ngModel){
                    ngModel.$validators.string = function (modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        //var regex = /^[a-zA-Z]/i;
                        var regex = /^[-\w]+$/i;
                        //var regex = /[^-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g;
                        return regex.test(value);
                    }
                }
            };
        }]);
    account.controller('VerifyCtrl',['$scope','$http','$state','$stateParams',function ($scope,$http,$state,$stateParams) {
        $scope.verification_code = $state.params.code;
        if($scope.verification_code){
            var vcode = $scope.verification_code;
            $scope.verifying = true;
            $scope.vSuccess = false;
            $scope.onerr = false;
            $http.get('http://kittron.com/account/verify/'+ vcode)
                .then(function onFulfilled(res) {
                    $scope.verifying = false;
                    $scope.vSuccess = true;
                },function onRejected(res) {
                    $scope.vSuccess = false;
                    $scope.verifying = false;
                    $scope.onerr = true;
                });
        }
    }]);
    account.controller('LoginCtrl', ['$rootScope','$state','$scope','$auth','$location','$http','Account', function($rootScope,$state,$scope,$auth,$location,$http,Account){
        $scope.loginData ={};
        // $scope.loginData ={};
        $scope.loginUser = function(){
            $scope.processing =true;
            Account.auth.login($scope.loginData, function (res) {
                $scope.processing = false;
                $auth.setToken(res.access_token);
                $state.go('dashboard.home');
                // var ss = Account.user.profile();
                // console.log(ss);
            },function (res) {
                $scope.processing = false;
                console.log('err');
                console.log(res);
            });

            // $auth.login($scope.loginData, {
            //     method: 'POST',
            //     headers: {'content-Type': 'application/x-www-form-urlencoded'},
            //     transformRequest: function (data, headersGetter) {
            //         var str = [];
            //         for(var d in data){
            //           str.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
            //         }
            //         return str.join("&");
            //     }
            //
            // })
            //     .then(function (res) {
            //         $scope.processing = false;
            //         $auth.setToken(res.data.access_token);
            //         $state.go('dashboard.home');
            //         // location.reload(true);
            //         console.log(res);
            //         var tk = res.data.access_token;
            //            $scope.getProfile(tk);
            //         var payload = $auth.getPayload();
            //         console.info(payload);
            //     }, function (error) {
            //         $scope.processing = false;
            //         $scope.errors = true;
            //     });
        };

        $scope.getProfile = function (tk) {
            $http.get('http://kittron.com/profile', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + tk
                }
            })
                .then(function (res) {
//                        $scope.secured= res.data;
                    console.log(res);

                }),function (res) {
//                    $scope.secured= res.data;
                console.log(res);

            }
        }

    }]);
    account.controller('LogoutCtrl', ['$state','$auth', function($state, $auth) {
        if (!$auth.isAuthenticated()) { return; }
        $auth.logout()
            .then(function() {
                $state.transitionTo('home');
                location.reload(true);

            });
    }]);

})();

(function () {
    "use strict";
    angular.module('krSer', ['ngResource','krSet','satellizer'])
        .factory('Account', ['$resource','krSettings','$http', function ($resource,krSettings,$http) {
            return{
            custom :  {
                email: $http.get('http://kittron.com/email')
                    .then(function (res) {
                       // console.log(res);
                        return res;
                    },function (err) {
                        console.log(err);
                    })
            },
            auth :
                $resource(krSettings.login,null,{
                    'login' : {method : 'POST'}}
                    ),
            user :
                $resource(krSettings.user_profile,null,{
                    'profile' : {
                        method : 'GET'
                        // isArray : true
                    }
                }
                    ),
            signUp : $resource('http://kittron.com/email',null,{
                'email' : {
                    method : 'GET'
                }
            }),
            site : $resource(krSettings.site,null,{
                'detail' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'create' : {

                }
            }),

            user_del : $resource(krSettings.users+':id',null,{
                'act' : {
                    method :  'DELETE'
                }
            }),
            user_get : $resource(krSettings.users+':id',null,{
                'act' : {
                    method :  'GET'
                }
            }),
            users : $resource(krSettings.users,null,{
                'all' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'destory' : {
                    method :  'DELETE'
                }
            }),
            offer  : $resource(krSettings.offer ,null,{
                'detail' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'delete' : {

                }
            }),
            hotel  : $resource(krSettings.offer ,null,{
                'detail' : {
                    method : 'GET'
                },
                'store' : {
                    method : 'POST'
                },
                'update' : {
                    method : 'PUT'
                },
                'delete' : {
                    method : 'DELETE'
                }
            }),
            save :
                $resource(krSettings.save,null,{
                    'Binfo' : {
                        method : 'POST',
                        params : {
                            p : 'business'
                        }
                    },
                    'Sinfo' : {
                        method : 'POST',
                        params : {
                            p : 'site'
                        }
                    }
                }
                ),
            upload : $resource(krSettings.upload,null,{
                'resulpi' : {
                    method : 'POST',
                    headers: {'content-Type': undefined},
                    transformRequest: angular.identity
                },
                'gallery' : {
                    method : 'POST'
                }

            }),

            logout : function () {

            },
            profile : function () {

            }
        }
    }]);

})();
(function () {
    "use strict";
    angular.module('krSet', [])
        .factory('krSettings', function () {
            var base = 'http://kittron.com/';
        return{
            login : base + 'login',
            signUp : base + 'signUp',
            weather : base + 'weather',
            user_profile : base + 'profile',
            site : base + 'api/site',
            offer : base + 'api/offer',
            save : base + 'api/partners',
            upload : base + 'api/upload',
            users : base + 'api/users/'
            // upload : base + 'api/upload'
        }
    });

})();
(function(){
    "use strict";
    angular.module("dashboard", [
        'ui.router',
        'oc.lazyLoad',
        'dashHome',
        'dashSite',
        'dashContacts',
        'dashHotel',
        'ds.clock',
        'compModule',
        'perfect_scrollbar',
        'ngMdWidgetEngine',
        'account',
        'angular.filter',
        'angularMoment',
        'ngAvatar'
    ]);
})();
/**
 * Created by user on 1/5/2017.
 */
(function(){
    'use strict';
    angular.module('dashboard')
        .config(["$locationProvider", "$stateProvider","$ocLazyLoadProvider","$authProvider","$sceDelegateProvider",function($locationProvider, $stateProvider,$ocLazyLoadProvider,$authProvider,$sceDelegateProvider){
            var skipIfLoggedIn = ['$q', '$auth', function($q, $auth) {
                var deferred = $q.defer();
                if ($auth.isAuthenticated()) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }];

            $stateProvider.state('dashboard', {
                abstract: true,
                url: '/dashboard',
                resolveAs : 'rdata',
                resolve: {
                    userProfile: function(Account) {
                        var acc =  Account.user.profile();
                        return acc;
                    }
                },
                templateUrl: 'ngf/account/dashboard/dashboard.template.html'
            });
            $stateProvider.state('dashboard.home',{
                 url : '',
                controller : 'dashbordHomeCtrl',
                resolve : {
                     $title: function(){
                         return 'Dashboard Home';

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/dashboard/dashboard_home.template.html'
                 // template : '<dashboard-home></dashboard-home>'
             });

            $stateProvider.state('dashboard.users',{
                 url : '/users',
                resolve : {
                     $title: function(){
                         return 'Users';

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/users.template.html'
             });
            $stateProvider.state('dashboard.add_user',{
                 url : '/add_user',
                resolve : {
                     $title: function(){
                         return 'Add user';

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/add_user.template.html'
             });
            $stateProvider.state('dashboard.edit_user',{
                 url : '/users/{user}/edit',
                resolve : {
                     $title: function($stateParams){
                         return 'Edit '+ $stateParams.user;

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/edit_user.template.html'
             });
            $stateProvider.state('dashboard.view_user',{
                 url : '/users/{user}',
                resolve : {
                     $title: function($stateParams){
                         return 'View '+ $stateParams.user;

                     }
                 },

                 templateUrl : 'ngf/account/dashboard/_dashboard_files/users/view_user.template.html'
             });

            $stateProvider.state('dashboard.manage_site',{
                url : '/manage_site',
                controller : 'ManageSiteCtrl',
                resolve : {
                    $title: function(){
                        return 'Manage site';
                    },
                    site : function (Account) {
                        var site = Account.site.detail();
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_site/manage_site.template.html',
            });
            $stateProvider.state('dashboard.contacts',{
                url : '/contacts',
                resolve : {
                    $title: function(){
                        return 'Manage contacts';
                    }
                },

                template : '<dashboard-contacts></dashboard-contacts>'
            });
            $stateProvider.state('dashboard.manage_events',{
                url : '/manage_events',
                resolve : {
                    $title: function(){
                        return 'Manage events';
                    }
                },
                template : '<h1>Yeh</h1>'
            });

            $stateProvider.state('dashboard.manage_hotel',{
                url : '/manage_hotel',
                resolve : {
                    $title: function(){
                        return 'Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });
            $stateProvider.state('dashboard.manage_hotel.all_hotels',{
                url : '/hotels',
                resolve : {
                    $title: function(){
                        return 'Hotels';
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/all_hotels.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.edit_hotel',{
                url : '/{hotelName}/edit',
                resolve : {
                    $title: function($stateParams){
                        return   'Edit ' + $stateParams.hotelName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/edit_hotel.template.html'
            });

            $stateProvider.state('dashboard.manage_hotel.user_hotel',{
                url : '/myHotelName',
                abstract : true,
                resolve : {
                    $title: function($stateParams){
                        return   'Edit ' + $stateParams.hotelName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/edit_hotel.template.html'
            });

            $stateProvider.state('dashboard.manage_hotel.view_hotel',{
                url : '/view/{htName}',
                abstract : true,
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.basic',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/basic_view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.public',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/public_view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.policy',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/policy_view_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.view_hotel.paybill',{
                url : '',
                resolve : {
                    $title: function($stateParams){
                        return   'Hotel details of ' + $stateParams.htName;
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/paybill_view_hotel.template.html'
            });

            $stateProvider.state('dashboard.manage_hotel.my_hotel',{
                url : '/my_hotel',
                resolve : {
                    $title: function(){
                        return 'Manage My Hotel';
                    }
                },
                template : '<h1>Manage My Hotel</h1>'
            });
            $stateProvider.state('dashboard.manage_hotel.add_hotel',{
                url : '/add_hotel',
                resolve : {
                    $title: function(){
                        return 'Add Hotel - Manage Hotel';
                    }
                },
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/add_hotel.template.html'
            });
            $stateProvider.state('dashboard.manage_hotel.add_hotel_room',{
                url : '/add_hotel_room',
                resolve : {
                    $title: function(){
                        return 'Add Hotel Room- Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });
            $stateProvider.state('dashboard.manage_hotel.add_room_type',{
                url : '/add_room_type',
                resolve : {
                    $title: function(){
                        return 'Add Room Type - Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });
            $stateProvider.state('dashboard.manage_hotel.room_type',{
                url : '/room_types',
                resolve : {
                    $title: function(){
                        return 'Room Types - Manage Hotel';
                    }
                },
                template : '<manage-hotel></manage-hotel>'
            });




        }]);
}());

// (function(){
//     "use strict";
//     angular.module('dashboard')
//         .config(["$locationProvider", "$stateProvider","$ocLazyLoadProvider",function($locationProvider, $stateProvider,$ocLazyLoadProvider){
//             $ocLazyLoadProvider.config({
//                 modules: [{
//                     name: 'dashboardFiles',
//                     files: [
//                         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.module.js',
//                         'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.module.js',
//                         'node_modules/angular-material-data-table/dist/md-data-table.min.css',
//                         'node_modules/angular-material-data-table/dist/md-data-table.min.js',
//                         'node_modules/angular-avatar-master/dist/angular-avatar.js',
//                         'js/ngletteravatar.js',
//                         // 'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                         // 'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.component.js',
//                         'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                     ]
//                 }]
//             });
//
//             $stateProvider.state('dashboard', {
//                 url: '/dashboard',
//                 abstract: true,
//                 resolve: {
//                     $title: function () {
//                         return 'Dashboard';
//                     },
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             'public/account/dashboard/js/excanvas.min.js',
//                             'public/account/dashboard/js/full-calendar/fullcalendar.min.js'
//                         ]);
//                     }]
//                 },
//                 templateUrl: 'public/account/dashboard/dashboard.template.html'
//
//             });
//             $stateProvider.state('dashboard.home',{
//                 url : '',
//                 resolve : {
//                     $title: function(){
//                         return 'Dashboard Home';
//                     },
//                     // loadMyHomeFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                     //     return $ocLazyLoad.load([
//                     //         'node_modules/angular-material-data-table/dist/md-data-table.min.css',
//                     //         'node_modules/angular-material-data-table/dist/md-data-table.min.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.module.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.config.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/calendar.css',
//                     //         'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.component.js',
//                     //         'node_modules/d3/d3.js',
//                     //         'node_modules/nvd3/build/nv.d3.js',
//                     //         'node_modules/nvd3/build/nv.d3.css',
//                     //         'node_modules/angular-nvd3/dist/angular-nvd3.js',
//                     //         'public/account/dashboard/_dashboard_files/components/budget_table.component.js',
//                     //         'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                     //     ]);
//                     // }],
//                     loadMyHomeFiles: [
//                         '$ocLazyLoad', function($ocLazyLoad) {
//                             return $ocLazyLoad.load({
//                                 name: 'dashboard',
//                                 files: [
//                                     'node_modules/angular-material-data-table/dist/md-data-table.min.css',
//                                     'node_modules/angular-material-data-table/dist/md-data-table.min.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.module.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.config.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                                     'public/account/dashboard/_dashboard_files/dashboard/calendar.css',
//                                     'public/account/dashboard/_dashboard_files/dashboard/dashboard_home.component.js',
//                                     'node_modules/d3/d3.js',
//                                     'node_modules/nvd3/build/nv.d3.js',
//                                     'node_modules/nvd3/build/nv.d3.css',
//                                     'node_modules/angular-nvd3/dist/angular-nvd3.js',
//                                     'public/account/dashboard/_dashboard_files/components/budget_table.component.js',
//                                     'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                                 ]
//                             });
//                         }
//                     ]
//                 },
//
//                 template : '<dashboard-home></dashboard-home>'
//             });
//             $stateProvider.state('dashboard.reports',{
//                 url : '/reports',
//                 resolve : {
//                     $title: function(){
//                         return 'Reports';
//                     }
//
//                 },
//                 template : '<h1>Yeh</h1>'
//             });
//             $stateProvider.state('dashboard.app_tour',{
//                 url : '/app_tour',
//                 resolve : {
//                     $title: function(){
//                         return 'App tour';
//                     }
//                 },
//                 template : '<app-tour></app-tour>'
//             });
//             $stateProvider.state('dashboard.mail_box',{
//                 url : '/mail',
//                 resolve : {
//                     $title: function(){
//                         return 'Mailbox ';
//                     },
//                     loadModule: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load('dashboardFiles');
//                     }],
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             'public/account/dashboard/_dashboard_files/mail_box/mail_box.module.js',
//                             'public/account/dashboard/_dashboard_files/mail_box/mail_box.config.js',
//                             'public/account/dashboard/_dashboard_files/mail_box/mail_box.component.js'
//                         ]);
//                     }]
//                 },
//                 template : '<mail-box></mail-box>'
//             });
//             $stateProvider.state('dashboard.mail_box.inbox',{
//                 url : '/inbox',
//                 resolve : {
//                     $title : function(){
//                         return ' Inbox ';
//                     }
//                 },
//                 template : '<inbox></inbox>'
//             });
//             $stateProvider.state('dashboard.manage_events',{
//                 url : '/manage_events',
//                 resolve : {
//                     $title: function(){
//                         return 'Manage events';
//                     }
//                 },
//                 template : '<h1>Yeh</h1>'
//             });
//             $stateProvider.state('dashboard.contacts',{
//                 url : '/contacts',
//                 resolve : {
//                     $title: function(){
//                         return 'Manage contacts';
//                     },
//                     loadModule: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load('dashboardFiles');
//                     }],
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             // 'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.module.js',
//                             'public/account/dashboard/_dashboard_files/dashboard/calendar.controller.js',
//                             'public/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.component.js',
//                             'node_modules/angular-material-event-calendar/dist/angular-material-event-calendar.css'
//                         ]);
//                     }],
//                 },
//
//                 template : '<dashboard-contacts></dashboard-contacts>'
//             });
//             $stateProvider.state('dashboard.manage_site',{
//                 url : '/manage_site',
//                 resolve : {
//                     $title: function(){
//                         return 'Manage site';
//                     },
//                     loadMyFiles: ['$ocLazyLoad', function ($ocLazyLoad) {
//                         return $ocLazyLoad.load([
//                             'public/account/dashboard/_dashboard_files/manage_site/manage_site.module.js',
//                             'public/account/dashboard/_dashboard_files/manage_site/manage_site.component.js'                        ]);
//                     }]
//                 },
//                 template : '<manage-site></manage-site>'
//             });
//         }]);
// }());


    var account = angular.module("dashboard");

    account.controller('DashboardCtrl', ['$mdSidenav','$http','$state', function($mdSidenav,$http,$state){
        var dc = this;
        dc.toggleRight = function(){
            $mdSidenav('right').toggle();
            console.log($state.current.name);
        };

        dc.toggleLeft = function(){
            $mdSidenav('left').toggle();
        };

        dc.leftNavItem = [
            {
                name : 'Dashboard',
                ref : 'dashboard.home',
                icon : 'dashboard'
            },
            {
                name : 'Reports',
                ref : 'dashboard.reports',
                icon : 'report'
            },
            {
                name : 'Mail Box',
                ref : 'dashboard.mail_box',
                icon : 'inbox'
            },
            {
                name : 'Manage Events',
                ref : 'dashboard.manage_events',
                icon : 'event'
            },
            {
                name : 'Manage Contacts',
                ref : 'dashboard.contacts',
                icon : 'contacts'
            },
            {
                name : 'Manage Hotel',
                ref : 'dashboard.manage_hotel',
                icon : 'location_city'
            },
            {
                name : 'Users',
                ref : 'dashboard.users',
                icon : 'people'
            }

        ];

        // dc.selectedIndex = null;




        dc.goToState = function (s, i) {
            $state.go(s);
            $mdSidenav('left').close();

            if (dc.selectedIndex === null) {
                dc.selectedIndex = i;
            }
            else if (dc.selectedIndex === i) {
                dc.selectedIndex = null;
            }
            else {
                dc.selectedIndex = i;

            }

        };


    }]);



(function(){
    "use strict";
    angular.module("dashHome",['ngMaterial', 'ngAnimate','md.data.table','nvd3','compModule']);


    // angular.module('dashHome').controller('calCtrl',['calendarConfig',function (calendarConfig) {
    //
    //     var vm = this;
    //
    //     //These variables MUST be set as a minimum for the calendar to work
    //     vm.calendarView = 'month';
    //     vm.viewDate = new Date();
    //     var actions = [{
    //         label: '<i class=\'glyphicon glyphicon-pencil\'></i>',
    //         onClick: function(args) {
    //             alert('Edited', args.calendarEvent);
    //         }
    //     }, {
    //         label: '<i class=\'glyphicon glyphicon-remove\'></i>',
    //         onClick: function(args) {
    //             alert('Deleted', args.calendarEvent);
    //         }
    //     }];
    //     vm.events = [
    //         {
    //             title: 'An event',
    //             color: calendarConfig.colorTypes.warning,
    //             startsAt: moment().startOf('week').subtract(2, 'days').add(8, 'hours').toDate(),
    //             endsAt: moment().startOf('week').add(1, 'week').add(9, 'hours').toDate(),
    //             draggable: true,
    //             resizable: true,
    //             actions: actions
    //         }, {
    //             title: '<i class="glyphicon glyphicon-asterisk"></i> <span class="text-primary">Another event</span>, with a <i>html</i> title',
    //             color: calendarConfig.colorTypes.info,
    //             startsAt: moment().subtract(1, 'day').toDate(),
    //             endsAt: moment().add(5, 'days').toDate(),
    //             draggable: true,
    //             resizable: true,
    //             actions: actions
    //         }, {
    //             title: 'This is a really long event title that occurs on every year',
    //             color: calendarConfig.colorTypes.important,
    //             startsAt: moment().startOf('day').add(7, 'hours').toDate(),
    //             endsAt: moment().startOf('day').add(19, 'hours').toDate(),
    //             recursOn: 'year',
    //             draggable: true,
    //             resizable: true,
    //             actions: actions
    //         }
    //     ];
    //
    //     vm.cellIsOpen = true;
    //
    //     vm.addEvent = function() {
    //         vm.events.push({
    //             title: 'New event',
    //             startsAt: moment().startOf('day').toDate(),
    //             endsAt: moment().endOf('day').toDate(),
    //             color: calendarConfig.colorTypes.important,
    //             draggable: true,
    //             resizable: true
    //         });
    //     };
    //
    //     vm.eventClicked = function(event) {
    //         alert('Clicked', event);
    //     };
    //
    //     vm.eventEdited = function(event) {
    //         alert('Edited', event);
    //     };
    //
    //     vm.eventDeleted = function(event) {
    //         alert('Deleted', event);
    //     };
    //
    //     vm.eventTimesChanged = function(event) {
    //         alert('Dropped or resized', event);
    //     };
    //
    //     vm.toggle = function($event, field, event) {
    //         $event.preventDefault();
    //         $event.stopPropagation();
    //         event[field] = !event[field];
    //     };
    //
    //     vm.timespanClicked = function(date, cell) {
    //
    //         if (vm.calendarView === 'month') {
    //             if ((vm.cellIsOpen && moment(date).startOf('day').isSame(moment(vm.viewDate).startOf('day'))) || cell.events.length === 0 || !cell.inMonth) {
    //                 vm.cellIsOpen = false;
    //             } else {
    //                 vm.cellIsOpen = true;
    //                 vm.viewDate = date;
    //             }
    //         } else if (vm.calendarView === 'year') {
    //             if ((vm.cellIsOpen && moment(date).startOf('month').isSame(moment(vm.viewDate).startOf('month'))) || cell.events.length === 0) {
    //                 vm.cellIsOpen = false;
    //             } else {
    //                 vm.cellIsOpen = true;
    //                 vm.viewDate = date;
    //             }
    //         }
    //
    //     };
    // }])

}());

// (function () {
//     "use strict";
//     angular.module('dashHome').config(['$scope','$location',function($scope,$location ) {
//
//         }]);
// })();
// /**
//  * Created by user on 6/13/2017.
//  */
//
// var dashboard_home = angular.module("dashHome");
//
// dashboard_home.controller('CalendarCtrl',
//     function($scope, $compile, $timeout, uiCalendarConfig) {
//         // var date = new Date();
//         // var d = date.getDate();
//         // var m = date.getMonth();
//         // var y = date.getFullYear();
//         //
//         // $scope.changeTo = 'Hungarian';
//         // /* event source that pulls from google.com */
//         // $scope.eventSource = {
//         //     url: "http://www.google.com/calendar/feeds/usa__en%40holiday.calendar.google.com/public/basic",
//         //     className: 'gcal-event',           // an option!
//         //     currentTimezone: 'America/Chicago' // an option!
//         // };
//         // /* event source that contains custom events on the scope */
//         // $scope.events = [
//         //     {title: 'All Day Event',start: new Date(y, m, 1)},
//         //     {title: 'Long Event',start: new Date(y, m, d - 5),end: new Date(y, m, d - 2)},
//         //     {id: 999,title: 'Repeating Event',start: new Date(y, m, d - 3, 16, 0),allDay: false},
//         //     {id: 999,title: 'Repeating Event',start: new Date(y, m, d + 4, 16, 0),allDay: false},
//         //     {title: 'Birthday Party',start: new Date(y, m, d + 1, 19, 0),end: new Date(y, m, d + 1, 22, 30),allDay: false},
//         //     {title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
//         // ];
//         // /* event source that calls a function on every view switch */
//         // $scope.eventsF = function (start, end, timezone, callback) {
//         //     var s = new Date(start).getTime() / 1000;
//         //     var e = new Date(end).getTime() / 1000;
//         //     var m = new Date(start).getMonth();
//         //     var events = [{title: 'Feed Me ' + m,start: s + (50000),end: s + (100000),allDay: false, className: ['customFeed']}];
//         //     callback(events);
//         // };
//         //
//         // $scope.calEventsExt = {
//         //     color: '#f00',
//         //     textColor: 'yellow',
//         //     events: [
//         //         {type:'party',title: 'Lunch',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
//         //         {type:'party',title: 'Lunch 2',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
//         //         {type:'party',title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
//         //     ]
//         // };
//         // /* alert on eventClick */
//         // $scope.alertOnEventClick = function( date, jsEvent, view){
//         //     $scope.alertMessage = (date.title + ' was clicked ');
//         // };
//         // /* alert on Drop */
//         // $scope.alertOnDrop = function(event, delta, revertFunc, jsEvent, ui, view){
//         //     $scope.alertMessage = ('Event Dropped to make dayDelta ' + delta);
//         // };
//         // /* alert on Resize */
//         // $scope.alertOnResize = function(event, delta, revertFunc, jsEvent, ui, view ){
//         //     $scope.alertMessage = ('Event Resized to make dayDelta ' + delta);
//         // };
//         // /* add and removes an event source of choice */
//         // $scope.addRemoveEventSource = function(sources,source) {
//         //     var canAdd = 0;
//         //     angular.forEach(sources,function(value, key){
//         //         if(sources[key] === source){
//         //             sources.splice(key,1);
//         //             canAdd = 1;
//         //         }
//         //     });
//         //     if(canAdd === 0){
//         //         sources.push(source);
//         //     }
//         // };
//         // /* add custom event*/
//         // $scope.addEvent = function() {
//         //     $scope.events.push({
//         //         title: 'Open Sesame',
//         //         start: new Date(y, m, 28),
//         //         end: new Date(y, m, 29),
//         //         className: ['openSesame']
//         //     });
//         // };
//         // /* remove event */
//         // $scope.remove = function(index) {
//         //     $scope.events.splice(index,1);
//         // };
//         // /* Change View */
//         // $scope.changeView = function(view,calendar) {
//         //     uiCalendarConfig.calendars[calendar].fullCalendar('changeView',view);
//         // };
//         // /* Change View */
//         // $scope.renderCalendar = function(calendar) {
//         //     $timeout(function() {
//         //         if(uiCalendarConfig.calendars[calendar]){
//         //             uiCalendarConfig.calendars[calendar].fullCalendar('render');
//         //         }
//         //     });
//         // };
//         // /* Render Tooltip */
//         // $scope.eventRender = function( event, element, view ) {
//         //     element.attr({'tooltip': event.title,
//         //         'tooltip-append-to-body': true});
//         //     $compile(element)($scope);
//         // };
//         // /* config object */
//         // $scope.uiConfig = {
//         //     calendar:{
//         //         height: 450,
//         //         editable: true,
//         //         header:{
//         //             left: 'title',
//         //             center: '',
//         //             right: 'today prev,next'
//         //         },
//         //         eventClick: $scope.alertOnEventClick,
//         //         eventDrop: $scope.alertOnDrop,
//         //         eventResize: $scope.alertOnResize,
//         //         eventRender: $scope.eventRender
//         //     }
//         // };
//         //
//         // $scope.changeLang = function() {
//         //     if($scope.changeTo === 'Hungarian'){
//         //         $scope.uiConfig.calendar.dayNames = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
//         //         $scope.uiConfig.calendar.dayNamesShort = ["Vas", "Hét", "Kedd", "Sze", "Csüt", "Pén", "Szo"];
//         //         $scope.changeTo= 'English';
//         //     } else {
//         //         $scope.uiConfig.calendar.dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
//         //         $scope.uiConfig.calendar.dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//         //         $scope.changeTo = 'Hungarian';
//         //     }
//         // };
//         // /* event sources array*/
//         // $scope.eventSources = [$scope.events, $scope.eventSource, $scope.eventsF];
//         // $scope.eventSources2 = [$scope.calEventsExt, $scope.eventsF, $scope.events];
//     });
(function () {
    "use strict";
    var dashboard_home = angular.module('dashHome');

    dashboard_home.controller("dashbordHomeCtrl",['$http','$scope', function ($http,$scope) {
                        // $scope.profile = $resolve.userProfile;
                        // $scope.myNameIs = 'barryogbonna';
        $http.get("/home_widget").then(function(data){
            $scope.data = {};
            console.log(data.data);
            $scope.data.configuration = data.data;
            $scope.data.WEconfiguration2 = angular.copy(data.data);
            $scope.data.callback = function(e){
                console.log(e);
            };
        });
    }]);
    // dashboard_home.component("dashboardHome",{
    //             templateUrl: 'ngf/account/dashboard/_dashboard_files/dashboard/dashboard_home.template.html',
    //             bindings: { Account: '<' },
    //             controller:  ['$scope','Account','$state', function dashbordHomeCtrl($scope, Account, $state){
    //                 $scope.myNameIs = 'barryogbonna';
    //                 var acc =  Account;
    //                     // console.log($state.$current.resolve.userProfile);
    //
    //         }]
    //     });

})();
(function(){
    "use strict";
    angular.module("dashSite", ['ngMessages','account','lfNgMdFileInput']);
})();

    angular.module("dashSite")
        .controller('ManageSiteCtrl',['$scope','$http','Account', function ($scope, $http,Account) {

            $scope.vendorServices = [
                "Audiovisual",
                "Security Companies",
                "Giftware",
                "Interpretation ",
                "Photographer",
                "Musician",
                "Printers",
                "Destination Management Company",
                "Communications Consultant",
                "Stationery Designer",
                "Promotional Products Distributor",
                "Private Caterer",
                "Wine Shop Owner/Sommelier",
                "Florist",
                "Party Rental Supplier"
            ];

            $scope.items = [1,2,3,4,5];
            $scope.selected = [];
            $scope.toggle = function (item, list) {
                var idx = list.indexOf(item);
                if (idx > -1) {
                    list.splice(idx, 1);
                }
                else {
                    list.push(item);
                }
            };

            $scope.exists = function (item, list) {
                return list.indexOf(item) > -1;
            };

            $scope.isIndeterminate = function() {
                return ($scope.selected.length !== 0 &&
                $scope.selected.length !== $scope.items.length);
            };

            $scope.isChecked = function() {
                return $scope.selected.length === $scope.items.length;
            };

            $scope.toggleAll = function() {
                if ($scope.selected.length === $scope.items.length) {
                    $scope.selected = [];
                } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
                    $scope.selected = $scope.items.slice(0);
                }
            };
            $scope.rpi = function () {
                var formData = new FormData();
                angular.forEach($scope.resultImage,function(obj){
                    if(!obj.isRemote){
                        formData.append('photo', obj.lfFile);
                    }
                });

                Account.upload.resulpi(formData);
            };
            $scope.userType = function (x, y) {
               if(x == y){
                   return true;

               }
               else {
                   return false;
               }
            };

            $scope.full = false;
            $scope.bInfoUpdated = true;
            $scope.bInfo = {};
            $scope.checkType = function () {
                    $scope.full = !$scope.full;
                    if($scope.full){
                        $scope.bInfo.type2 =false;
                        $scope.bInfo.type3 =false;
                    }


            }

            $scope.sInfo = {};

            $scope.customEmail = function (x, y) {
                console.log(x);
                console.log(y);
                // return x + '.'+ x +'@kr.com';
                if(x == undefined || x == undefined){
                    // console.warn(data);
                    return '';
                }
                else{
                    var sname = $scope.sInfo.address;
                    var b_name =y;
                    b_name = b_name.replace(' ', '_');
                    b_name = angular.lowercase(b_name);
                    return sname + '.'+ b_name+'@kr.com';

                }
                // $http.get('http://kittron.com/email')
                //     .then(function (res) {
                //         console.log(res)
                //         var jjs =  res.data;
                //         return jjs;
                //
                //         // $scope.sInfo.custom_email = res.data;
                //     },function (err) {
                //         console.log(err)
                //     });





            };
            $scope.saveBinfo = function (valid, type) {
                if(valid){
                    $scope.bInfo.user_type = type.user_type;
                    $scope.bInfo.user_email = type.email;
                    Account.save.Binfo($scope.bInfo);
                    console.log($scope.bInfo);
                    // console.log(type);
                }
                else{
                    alert('Invalid form');
                }
            };
            $scope.saveSinfo = function (valid) {
                if(valid){
                    Account.site.store($scope.sInfo);
                    console.log($scope.sInfo);
                }
                else{
                    alert('Invalid form');
                }
            };
            $scope.saveOffer = function (valid) {
                if(valid){
                    Account.offer.store($scope.offer);
                    console.log($scope.offer);
                }
                else{
                    alert('Invalid form');
                }
            }



        }]);

(function () {
    "use strict";

    var dashboard_contacts = angular.module("dashContacts", ['md.data.table','ngLetterAvatar']);

})();


(function () {
    "use strict";
    var dashboard_contacts = angular.module('dashContacts');

    dashboard_contacts.component('dashboardContacts',{
        templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_contacts/manage_contacts.template.html',
        controller:  ['$mdSidenav','$scope','$timeout','$mdDialog', function ($mdSidenav, $scope, $timeout, $mdDialog){
            $scope.toggleNav =function () {
                $mdSidenav('contactNav').toggle();
            };
            function DialogController($scope, $mdDialog) {
                $scope.hide = function() {
                    $mdDialog.hide();
                };

                $scope.cancel = function() {
                    $mdDialog.cancel();
                };

                $scope.answer = function(answer) {
                    $mdDialog.hide(answer);
                };
                $scope.openMenu = function ($mdMenu, ev) {
                    $mdMenu.open(ev);
                }
            };

            $scope.sortContact = function (d) {
                $scope.loadStuff();
            };

            $scope.addContact = function (ev) {
                $mdDialog.show({
                    controller: ['$scope','$mdDialog',DialogController],
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/add_contact.template.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
                    .then(function(answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function() {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };

            $scope.viewContact = function (dd, ev) {
                $mdDialog.show({
                    controller: ['$scope','$mdDialog', function ViewContactController($scope, $mdDialog) {
                        $scope.data = dd;
                        $scope.hide = function() {
                            $mdDialog.hide();
                        };

                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        };

                        $scope.answer = function() {
                            //$mdDialog.hide(answer);
                            console.info($scope.data);
                        };
                        $scope.openMenu = function ($mdMenu, ev) {
                            $mdMenu.open(ev);
                        }
                    }],
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/view_contact.template.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
                    .then(function(answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function() {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };
            $scope.options = {
                rowSelection: true,
                multiSelect: true,
                autoSelect: false,
                decapitate: false,
                largeEditDialog: false,
                boundaryLinks: false,
                limitSelect: false,
                pageSelect: true
            };

            $scope.selected = [];
            $scope.limitOptions = [5, 10, 15, {
                label: 'All',
                value: function () {
                    return $scope.desserts ? $scope.desserts.count : 0;
                }
            }];

            $scope.query = {
                order: 'name',
                limit: 5,
                page: 1
            };

            $scope.desserts = {
                "count": 9,
                "data": [
                    {
                        "name": "Barry ",
                        "email": "barryogbonna@gmail.com",
                        "lastname": "Ogbonna",
                        "nickname": "sparrow",
                        "phone_number": "09033284362",
                        "favorite": true,
                        "type": "Vendor",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Shade ",
                        "email": "sadekayode@gmail.com",
                        "lastname": "Kayode",
                        "nickname": "S key",
                        "phone_number": "08133466367",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Faruk",
                        "email": "farukolaide@gmail.com",
                        "lastname": " Olaide",
                        "nickname": "Faro",
                        "phone_number": "070443284362",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Zainab",
                        "email": "zainababdulsalam@gmail.com",
                        "lastname": "Abdulsalam",
                        "nickname": "Zee",
                        "phone_number": "081052843642",
                        "favorite": true,
                        "type": "Client",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""

                    },{
                        "name": "Yusuf",
                        "email": "yusufmohammed@gmail.com",
                        "lastname": "Mohammed",
                        "nickname": "Yus man",
                        "phone_number": "08054324569",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Emeka",
                        "email": "emekachinedu@gmail.com",
                        "lastname": "Chinedu",
                        "nickname": "Emaks",
                        "phone_number": "07032384366",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },
                ]
            };

            $scope.toggleLimitOptions = function () {
                $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
            };

            $scope.getTypes = function () {
                return ['Candy', 'Ice cream', 'Other', 'Pastry'];
            };

            $scope.onPaginate = function(page, limit) {
                console.log('Scope Page: ' + $scope.query.page + ' Scope Limit: ' + $scope.query.limit);
                console.log('Page: ' + page + ' Limit: ' + limit);

                $scope.promise = $timeout(function () {

                }, 2000);
            };

            $scope.deselect = function (item) {
                console.log(item.name, 'was deselected');
            };

            $scope.log = function (item) {
                console.log(item.name, 'was selected');
            };

            $scope.loadStuff = function () {
                $scope.promise = $timeout(function () {

                }, 2000);
            };

            $scope.onReorder = function(order) {

                console.log('Scope Order: ' + $scope.query.order);
                console.log('Order: ' + order);

                $scope.promise = $timeout(function () {

                }, 2000);
            };
        }]
    });


    dashboard_contacts.component('contactsTable',{
        templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_contacts/contacts_table.template.html',
        controller: ['$scope','$timeout','$mdDialog', function ($scope, $timeout, $mdDialog) {

            function DialogController($scope, $mdDialog) {
                $scope.hide = function() {
                    $mdDialog.hide();
                };

                $scope.cancel = function() {
                    $mdDialog.cancel();
                };

                $scope.answer = function(answer) {
                    $mdDialog.hide(answer);
                };
                $scope.openMenu = function ($mdMenu, ev) {
                    $mdMenu.open(ev);
                }
            }

            $scope.sortContact = function (d) {
                alert(d);
            };

            $scope.addContact = function (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/add_contact.template.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
                    .then(function(answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function() {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };

            $scope.viewContact = function (dd, ev) {
                $mdDialog.show({
                    controller:['$scope','$mdDialog', function ViewContactController($scope, $mdDialog) {
                        $scope.data = dd;
                        $scope.hide = function() {
                            $mdDialog.hide();
                        };

                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        };

                        $scope.answer = function() {
                            //$mdDialog.hide(answer);
                            console.info($scope.data);
                        };
                        $scope.openMenu = function ($mdMenu, ev) {
                            $mdMenu.open(ev);
                        }
                    }],
                    templateUrl: 'ngf/account/dashboard/_dashboard_files/manage_contacts/view_contact.template.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
                    .then(function(answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function() {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };
            $scope.options = {
                rowSelection: true,
                multiSelect: true,
                autoSelect: false,
                decapitate: false,
                largeEditDialog: false,
                boundaryLinks: false,
                limitSelect: false,
                pageSelect: true
            };

            $scope.selected = [];
            $scope.limitOptions = [5, 10, 15, {
                label: 'All',
                value: function () {
                    return $scope.desserts ? $scope.desserts.count : 0;
                }
            }];

            $scope.query = {
                order: 'name',
                limit: 5,
                page: 1
            };

            $scope.desserts = {
                "count": 9,
                "data": [
                    {
                        "name": "Barry ",
                        "email": "barryogbonna@gmail.com",
                        "lastname": "Ogbonna",
                        "nickname": "sparrow",
                        "phone_number": "09033284362",
                        "favorite": true,
                        "type": "Vendor",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Shade ",
                        "email": "sadekayode@gmail.com",
                        "lastname": "Kayode",
                        "nickname": "S key",
                        "phone_number": "08133466367",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Faruk",
                        "email": "farukolaide@gmail.com",
                        "lastname": " Olaide",
                        "nickname": "Faro",
                        "phone_number": "070443284362",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Zainab",
                        "email": "zainababdulsalam@gmail.com",
                        "lastname": "Abdulsalam",
                        "nickname": "Zee",
                        "phone_number": "081052843642",
                        "favorite": true,
                        "type": "Client",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""

                    },{
                        "name": "Yusuf",
                        "email": "yusufmohammed@gmail.com",
                        "lastname": "Mohammed",
                        "nickname": "Yus man",
                        "phone_number": "08054324569",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "name": "Emeka",
                        "email": "emekachinedu@gmail.com",
                        "lastname": "Chinedu",
                        "nickname": "Emaks",
                        "phone_number": "07032384366",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    }
                ]
            };


            $scope.editComment = function (event, dessert) {
                event.stopPropagation();

                var dialog = {
                    // messages: {
                    //   test: 'I don\'t like tests!'
                    // },
                    modelValue: dessert.comment,
                    placeholder: 'Add a comment',
                    save: function (input) {
                        dessert.comment = input.$modelValue;
                    },
                    targetEvent: event,
                    title: 'Add a comment',
                    validators: {
                        'md-maxlength': 30
                    }
                };

                var promise = $scope.options.largeEditDialog ? $mdEditDialog.large(dialog) : $mdEditDialog.small(dialog);

                promise.then(function (ctrl) {
                    var input = ctrl.getInput();

                    input.$viewChangeListeners.push(function () {
                        input.$setValidity('test', input.$modelValue !== 'test');
                    });
                });
            };

            $scope.toggleLimitOptions = function () {
                $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
            };

            $scope.getTypes = function () {
                return ['Candy', 'Ice cream', 'Other', 'Pastry'];
            };

            $scope.onPaginate = function(page, limit) {
                console.log('Scope Page: ' + $scope.query.page + ' Scope Limit: ' + $scope.query.limit);
                console.log('Page: ' + page + ' Limit: ' + limit);

                $scope.promise = $timeout(function () {

                }, 2000);
            };

            $scope.deselect = function (item) {
                console.log(item.name, 'was deselected');
            };

            $scope.log = function (item) {
                console.log(item.name, 'was selected');
            };

            $scope.loadStuff = function () {
                $scope.promise = $timeout(function () {

                }, 2000);
            };

            $scope.onReorder = function(order) {

                console.log('Scope Order: ' + $scope.query.order);
                console.log('Order: ' + order);

                $scope.promise = $timeout(function () {

                }, 2000);
            };
        }]

    });

})();
(function () {
    "use strict";
    angular.module('dashHotel', ['angularCountryState','checklist-model','md.data.table','lfNgMdFileInput','account','krSer','googlechart','ngMdWidgetEngine','angular-notification-icons']);
    
})();
(function () {
    "use strict";
    angular.module('dashHotel')
            .component('manageHotel',{
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/manage_hotel.template.html',
                controller:  ['$scope', function ($scope){
                    $scope.getter = 'Hotel';
            }]
        });
})();

/*

    Manage Hotel -> Add Hotel Controller

 */
(function () {
    "use strict";
    angular.module('dashHotel')
        .controller('addHotelCtrl',['$scope', function ($scope) {
            $scope.new_hotel = [];
            $scope.new_hotel.fac = [
                {
                name : '24hr front desk',
                free : false,
                charge : false
                },{
                name : 'Wifi',
                free : false,
                charge : false
                },{
                name : 'Garden',
                free : false,
                charge : false
                },{
                name : 'Terrace',
                free : false,
                charge : false
                },{
                name : 'Fireplace',
                free : false,
                charge : false
                },{
                name : 'Lounge',
                free : false,
                charge : false
                },{
                name : 'Valet Parking',
                free : false,
                charge : false
                },{
                name : 'Parking security/surveillance',
                free : false,
                charge : false
                },{
                name : 'Parking on site',
                free : false,
                charge : false
                },{
                name : 'Parking nearby',
                free : false,
                charge : false
                },{
                name : 'Spa',
                free : false,
                charge : false
                },{
                name : 'Air conditioning',
                free : false,
                charge : false
                },{
                name : 'Airport Shuttle',
                free : false,
                charge : false
                },{
                name : 'Restaurant',
                free : false,
                charge : false
                },{
                name : 'Bar',
                free : false,
                charge : false
                },{
                name : 'Indoor pool',
                free : false,
                charge : false
                },{
                name : 'Outdoor pool',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                },{
                name : 'Steam room',
                free : false,
                charge : false
                },{
                name : 'Elevator/lift',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                },{
                name : 'Elevator/lift',
                free : false,
                charge : false
                },{
                name : 'CCTV camera security',
                free : false,
                charge : false
                },{
                name : 'Security guard',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                },{
                name : 'Shared kitchen',
                free : false,
                charge : false
                },{
                name : 'Outdoor dining',
                free : false,
                charge : false
                },{
                name : 'Casino',
                free : false,
                charge : false
                },{
                name : 'Money exchange',
                free : false,
                charge : false
                },{
                name : 'ATM machine',
                free : false,
                charge : false
                },{
                name : 'Soundproofed rooms',
                free : false,
                charge : false
                },{
                name : 'Family rooms',
                free : false,
                charge : false
                },{
                name : 'Pets allowed',
                free : false,
                charge : false
                },{
                name : 'Rooms/facilities for disabled guests',
                free : false,
                charge : false
                },{
                name : 'City shuttle',
                free : false,
                charge : false
                },{
                name : 'Electronic room key',
                free : false,
                charge : false
                },{
                name : 'Meeting/banquet facilities',
                free : false,
                charge : false
                },{
                name : 'Buffet breakfast',
                free : false,
                charge : false
                },{
                name : 'Breakfast',
                free : false,
                charge : false
                },{
                name : 'Babysitting',
                free : false,
                charge : false
                },{
                name : 'Laundry',
                free : false,
                charge : false
                },{
                name : 'Car hire',
                free : false,
                charge : false
                },{
                name : 'Room service 24hr',
                free : false,
                charge : false
                },{
                name : 'Room service limited hours',
                free : false,
                charge : false
                },{
                name : 'Dry cleaning',
                free : false,
                charge : false
                },{
                name : 'Business center',
                free : false,
                charge : false
                },{
                name : 'Fax',
                free : false,
                charge : false
                },{
                name : 'Concierge service',
                free : false,
                charge : false
                },{
                name : 'Photocopy',
                free : false,
                charge : false
                },{
                name : 'Hot tub/Jacuzzi',
                free : false,
                charge : false
                }
            ];
            $scope.new_hotel.roomAni = [
                {
                name : 'Air conditioning',
                free : false,
                charge : false
                },{
                name : 'Toilet',
                free : false,
                charge : false
                },{
                name : 'Shower',
                free : false,
                charge : false
                },{
                name : 'Bath',
                free : false,
                charge : false
                },{
                name : 'Wardrobe/Closet',
                free : false,
                charge : false
                },{
                name : 'Flatscreen TV',
                free : false,
                charge : false
                },{
                name : 'Non-flatscreen TV',
                free : false,
                charge : false
                },{
                name : 'Satellite/cable TV service',
                free : false,
                charge : false
                },{
                name : 'Tea/Coffee making facilities',
                free : false,
                charge : false
                },{
                name : 'Hairdryer',
                free : false,
                charge : false
                },{
                name : 'Telephone',
                free : false,
                charge : false
                },{
                name : 'Fridge',
                free : false,
                charge : false
                },{
                name : 'Mini-bar',
                free : false,
                charge : false
                },{
                name : 'Radio',
                free : false,
                charge : false
                },{
                name : 'Wake up call/alarm clock',
                free : false,
                charge : false
                },{
                name : 'Mosquito net',
                free : false,
                charge : false
                },{
                name : 'Toiletries',
                free : false,
                charge : false
                },{
                name : 'Terrace/garden',
                free : false,
                charge : false
                },{
                name : 'Balcony',
                free : false,
                charge : false
                },{
                name : 'Additional bed',
                free : false,
                charge : false
                },{
                name : 'Crib/cot',
                free : false,
                charge : false
                }
            ];
            var date = new Date();
            $scope.yearCons = {};
            $scope.yearCons.minDate = new Date(
                date.getFullYear() -99,
                date.getMonth(),
                date.getDate()
            );
            $scope.yearCons.maxDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            $scope.saveNewHotel = function () {
                console.log($scope.new_hotel);
            };
            $scope.sizeChecked = function () {
              console.log('check clicked');
            };


        }]);
})();

/*

    All Hotels Controller

 */
(function () {
    "use strict";
    angular.module('dashHotel')
        .controller('allHotelCtrl',['$scope','$state', function ($scope,$state) {

            $scope.options = {
                rowSelection: true,
                multiSelect: true,
                autoSelect: false,
                decapitate: false,
                largeEditDialog: false,
                boundaryLinks: false,
                limitSelect: false,
                pageSelect: true
            };

            $scope.selected = [];
            $scope.limitOptions = [5, 10, 15, {
                label: 'All',
                value: function () {
                    return $scope.desserts ? $scope.desserts.count : 0;
                }
            }];

            $scope.query = {
                order: 'name',
                limit: 5,
                page: 1
            };

            $scope.sel_hotel = [];
            // $scope.editHotel = function (hotelData) {
            //     $state.go('dashboard.manage_hotel.edit_hotel', {hotelName : hotelData.name});
            //
            // };
            $scope.hotels = {
                "count": 9,
                "data": [
                    {
                        "id" : 1,
                        "name": "Barry ",
                        "email": "barryogbonna@gmail.com",
                        "lastname": "Ogbonna",
                        "nickname": "sparrow",
                        "phone_number": "09033284362",
                        "favorite": true,
                        "type": "Vendor",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 2,
                        "name": "Shade ",
                        "email": "sadekayode@gmail.com",
                        "lastname": "Kayode",
                        "nickname": "S key",
                        "phone_number": "08133466367",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 3,
                        "name": "Faruk",
                        "email": "farukolaide@gmail.com",
                        "lastname": " Olaide",
                        "nickname": "Faro",
                        "phone_number": "070443284362",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 4,
                        "name": "Zainab",
                        "email": "zainababdulsalam@gmail.com",
                        "lastname": "Abdulsalam",
                        "nickname": "Zee",
                        "phone_number": "081052843642",
                        "favorite": true,
                        "type": "Client",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""

                    },{
                        "id" : 5,
                        "name": "Yusuf",
                        "email": "yusufmohammed@gmail.com",
                        "lastname": "Mohammed",
                        "nickname": "Yus man",
                        "phone_number": "08054324569",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 6,
                        "name": "Emeka",
                        "email": "emekachinedu@gmail.com",
                        "lastname": "Chinedu",
                        "nickname": "Emaks",
                        "phone_number": "07032384366",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    }
                ]
            };

        }]);
})();


/*

    Edit Hotel Controller

 */
(function () {
    "use strict";
    angular.module('dashHotel')
        .controller('editHotelCtrl',['$scope', function ($scope) {
            $scope.new_hotel = [];
            $scope.new_hotel.fac = [
                {
                    name : '24hr front desk',
                    free : false,
                    charge : false
                },{
                    name : 'Wifi',
                    free : false,
                    charge : false
                },{
                    name : 'Garden',
                    free : false,
                    charge : false
                },{
                    name : 'Terrace',
                    free : false,
                    charge : false
                },{
                    name : 'Fireplace',
                    free : false,
                    charge : false
                },{
                    name : 'Lounge',
                    free : false,
                    charge : false
                },{
                    name : 'Valet Parking',
                    free : false,
                    charge : false
                },{
                    name : 'Parking security/surveillance',
                    free : false,
                    charge : false
                },{
                    name : 'Parking on site',
                    free : false,
                    charge : false
                },{
                    name : 'Parking nearby',
                    free : false,
                    charge : false
                },{
                    name : 'Spa',
                    free : false,
                    charge : false
                },{
                    name : 'Air conditioning',
                    free : false,
                    charge : false
                },{
                    name : 'Airport Shuttle',
                    free : false,
                    charge : false
                },{
                    name : 'Restaurant',
                    free : false,
                    charge : false
                },{
                    name : 'Bar',
                    free : false,
                    charge : false
                },{
                    name : 'Indoor pool',
                    free : false,
                    charge : false
                },{
                    name : 'Outdoor pool',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                },{
                    name : 'Steam room',
                    free : false,
                    charge : false
                },{
                    name : 'Elevator/lift',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                },{
                    name : 'Elevator/lift',
                    free : false,
                    charge : false
                },{
                    name : 'CCTV camera security',
                    free : false,
                    charge : false
                },{
                    name : 'Security guard',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                },{
                    name : 'Shared kitchen',
                    free : false,
                    charge : false
                },{
                    name : 'Outdoor dining',
                    free : false,
                    charge : false
                },{
                    name : 'Casino',
                    free : false,
                    charge : false
                },{
                    name : 'Money exchange',
                    free : false,
                    charge : false
                },{
                    name : 'ATM machine',
                    free : false,
                    charge : false
                },{
                    name : 'Soundproofed rooms',
                    free : false,
                    charge : false
                },{
                    name : 'Family rooms',
                    free : false,
                    charge : false
                },{
                    name : 'Pets allowed',
                    free : false,
                    charge : false
                },{
                    name : 'Rooms/facilities for disabled guests',
                    free : false,
                    charge : false
                },{
                    name : 'City shuttle',
                    free : false,
                    charge : false
                },{
                    name : 'Electronic room key',
                    free : false,
                    charge : false
                },{
                    name : 'Meeting/banquet facilities',
                    free : false,
                    charge : false
                },{
                    name : 'Buffet breakfast',
                    free : false,
                    charge : false
                },{
                    name : 'Breakfast',
                    free : false,
                    charge : false
                },{
                    name : 'Babysitting',
                    free : false,
                    charge : false
                },{
                    name : 'Laundry',
                    free : false,
                    charge : false
                },{
                    name : 'Car hire',
                    free : false,
                    charge : false
                },{
                    name : 'Room service 24hr',
                    free : false,
                    charge : false
                },{
                    name : 'Room service limited hours',
                    free : false,
                    charge : false
                },{
                    name : 'Dry cleaning',
                    free : false,
                    charge : false
                },{
                    name : 'Business center',
                    free : false,
                    charge : false
                },{
                    name : 'Fax',
                    free : false,
                    charge : false
                },{
                    name : 'Concierge service',
                    free : false,
                    charge : false
                },{
                    name : 'Photocopy',
                    free : false,
                    charge : false
                },{
                    name : 'Hot tub/Jacuzzi',
                    free : false,
                    charge : false
                }
            ];
            $scope.new_hotel.roomAni = [
                {
                    name : 'Air conditioning',
                    free : false,
                    charge : false
                },{
                    name : 'Toilet',
                    free : false,
                    charge : false
                },{
                    name : 'Shower',
                    free : false,
                    charge : false
                },{
                    name : 'Bath',
                    free : false,
                    charge : false
                },{
                    name : 'Wardrobe/Closet',
                    free : false,
                    charge : false
                },{
                    name : 'Flatscreen TV',
                    free : false,
                    charge : false
                },{
                    name : 'Non-flatscreen TV',
                    free : false,
                    charge : false
                },{
                    name : 'Satellite/cable TV service',
                    free : false,
                    charge : false
                },{
                    name : 'Tea/Coffee making facilities',
                    free : false,
                    charge : false
                },{
                    name : 'Hairdryer',
                    free : false,
                    charge : false
                },{
                    name : 'Telephone',
                    free : false,
                    charge : false
                },{
                    name : 'Fridge',
                    free : false,
                    charge : false
                },{
                    name : 'Mini-bar',
                    free : false,
                    charge : false
                },{
                    name : 'Radio',
                    free : false,
                    charge : false
                },{
                    name : 'Wake up call/alarm clock',
                    free : false,
                    charge : false
                },{
                    name : 'Mosquito net',
                    free : false,
                    charge : false
                },{
                    name : 'Toiletries',
                    free : false,
                    charge : false
                },{
                    name : 'Terrace/garden',
                    free : false,
                    charge : false
                },{
                    name : 'Balcony',
                    free : false,
                    charge : false
                },{
                    name : 'Additional bed',
                    free : false,
                    charge : false
                },{
                    name : 'Crib/cot',
                    free : false,
                    charge : false
                }
            ];
            var date = new Date();
            $scope.yearCons = {};
            $scope.yearCons.minDate = new Date(
                date.getFullYear() -99,
                date.getMonth(),
                date.getDate()
            );
            $scope.yearCons.maxDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            $scope.saveNewHotel = function () {
                console.log($scope.new_hotel);
            };
            $scope.sizeChecked = function () {
                console.log('check clicked');
            };


        }]);
})();
(function () {
    "use strict";
    angular.module('dashHotel')
        .component('hotelAdmin',{
            templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/manage_hotel_admin.template.html',
            controller:  ['$scope','$state','$mdDialog','Account', function ($scope,$state,$mdDialog,Account){
                $scope.stateIs = function () {
                    console.log($state.current.name);
                };
                $scope.addEdit = function () {
                    if($state.current.name == 'dashboard.manage_hotel'){
                        return true;
                    }
                    else {
                        return false;
                    }
                };

                $scope.viewHotel = function(ht){
                    console.log(ht);
                    $state.go('dashboard.manage_hotel.view_hotel.basic', {htName : ht.name});

                };

                $scope.editHotel = function (hotelData) {
                    $state.go('dashboard.manage_hotel.edit_hotel', {hotelName : hotelData.name});

                };


                $scope.confirmDelete =  function(ev , h) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title(h.name + ' will be deleted')
                        .textContent('All information with ' + h.name + 'will be erased')
                        .ariaLabel('Delete Hotel')
                        .targetEvent(ev)
                        .ok('Proceed')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function() {
                        Account.hotel.delete({id: h.id});
                        $scope.status = 'You decided to get rid of your debt.';
                    }, function() {
                        $scope.status = 'You decided to keep your debt.';
                    });
                };

            }]
        })
        .controller('viewHotelCtrl',['$scope','$rootScope','$state', function ($scope, $rootScope,$state) {
            $scope.currentNavItem = 'dashboard.manage_hotel.view_hotel.basic';

            $scope.reload = function(){
                $state.reload();
            };

            $scope.revOptions = [
                {
                    key: "One",
                    y: 5
                },
                {
                    key: "Two",
                    y: 2
                },
                {
                    key: "Three",
                    y: 9
                },
                {
                    key: "Four",
                    y: 7
                },
                {
                    key: "Five",
                    y: 4
                },
                {
                    key: "Six",
                    y: 3
                },
                {
                    key: "Seven",
                    y: .5
                }
            ];

            $scope.revData = {
                chart: {
                type: 'pieChart',
                height: 500,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                showLabels: true,
                duration: 500,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                legend: {
                    margin: {
                        top: 5,
                        right: 35,
                        bottom: 5,
                        left: 0
                    }
                }
            }}
        }])
        .controller('ChartCtrl', ['$scope','$http', function($scope,$http) {

            $http.get("/paybill_widget").then(function(data){
                $scope.data = {};
                console.log(data.data);
                $scope.data.configuration = data.data;
                $scope.data.WEconfiguration2 = angular.copy(data.data);
                $scope.data.callback = function(e){
                    console.log(e);
                };
            });


            $scope.options = {
                rowSelection: false,
                multiSelect: false,
                autoSelect: false,
                decapitate: false,
                largeEditDialog: false,
                boundaryLinks: false,
                limitSelect: false,
                pageSelect: true
            };

            $scope.selected = [];
            $scope.limitOptions = [5, 10, 15, {
                label: 'All',
                value: function () {
                    return $scope.desserts ? $scope.desserts.count : 0;
                }
            }];

            $scope.query = {
                order: 'name',
                limit: 5,
                page: 1
            };

            $scope.bookings = {
                "count": 9,
                "data": [
                    {
                        "id" : 1,
                        "name": "Barry ",
                        "email": "barryogbonna@gmail.com",
                        "lastname": "Ogbonna",
                        "nickname": "sparrow",
                        "phone_number": "09033284362",
                        "favorite": true,
                        "type": "Vendor",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 2,
                        "name": "Shade ",
                        "email": "sadekayode@gmail.com",
                        "lastname": "Kayode",
                        "nickname": "S key",
                        "phone_number": "08133466367",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 3,
                        "name": "Faruk",
                        "email": "farukolaide@gmail.com",
                        "lastname": " Olaide",
                        "nickname": "Faro",
                        "phone_number": "070443284362",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 4,
                        "name": "Zainab",
                        "email": "zainababdulsalam@gmail.com",
                        "lastname": "Abdulsalam",
                        "nickname": "Zee",
                        "phone_number": "081052843642",
                        "favorite": true,
                        "type": "Client",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""

                    },{
                        "id" : 5,
                        "name": "Yusuf",
                        "email": "yusufmohammed@gmail.com",
                        "lastname": "Mohammed",
                        "nickname": "Yus man",
                        "phone_number": "08054324569",
                        "favorite": true,
                        "type": "Friend",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    },{
                        "id" : 6,
                        "name": "Emeka",
                        "email": "emekachinedu@gmail.com",
                        "lastname": "Chinedu",
                        "nickname": "Emaks",
                        "phone_number": "07032384366",
                        "favorite": true,
                        "type": "Worker",
                        "dob": "",
                        "address": "jangolova avenue to kukere movement",
                        "note": ""
                    }
                ]
            };

            $scope.myChartObject = {};

            $scope.myChartObject.type = "PieChart";

            $scope.onions = [
                {v: "Onions"},
                {v: 3},
            ];

            $scope.myChartObject.data = {"cols": [
                {id: "t", label: "Topping", type: "string"},
                {id: "s", label: "Slices", type: "number"}
            ], "rows": [
                {c: [
                    {v: "Mushrooms"},
                    {v: 3},
                ]},
                {c: $scope.onions},
                {c: [
                    {v: "Olives"},
                    {v: 31}
                ]},
                {c: [
                    {v: "Zucchini"},
                    {v: 1},
                ]},
                {c: [
                    {v: "Pepperoni"},
                    {v: 2},
                ]}
            ]};

            $scope.myChartObject.options = {
                'title': 'Booking by room types'
            };
    }]);


})();
(function () {
    "use strict";
    angular.module('dashHotel')
            .component('hotelUser',{
                templateUrl : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/manage_hotel_user.template.html',
                controller:  ['$scope', function ($scope){
                    $scope.templates = [
                        {name : 'basic', url : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/basic_view_hotel.template.html'},
                        {name : 'public', url : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/public_view_hotel.template.html'},
                        {name : 'billing', url : 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/paybill_view_hotel.template.html'}
                    ];
                    $scope.page = 'ngf/account/dashboard/_dashboard_files/manage_hotel/templates/basic_view_hotel.template.html';
                    $scope.goto = function (x) {
                        $scope.page  = x;
                    };
            }]
        });
})();
(function(angular){
    "use strict";
    angular.module('dashboard')
        .controller('usersCtrl', ['$scope','$mdDialog','$state','Account', Controller]);
            function Controller($scope,$mdDialog,$state,Account){
                $scope.confirmDelete =  function(ev , u) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title(u.first_name + ' will be deleted')
                        .textContent('All information with ' + u.first_name+ 'will be erased')
                        .ariaLabel('Delete User')
                        .targetEvent(ev)
                        .ok('Proceed')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function() {
                        Account.user_del.act({id: u.id});
                        $scope.status = 'You decided to get rid of your debt.';
                    }, function() {
                        $scope.status = 'You decided to keep your debt.';
                    });
                };
                $scope.options = {
                    rowSelection: true,
                    multiSelect: true,
                    autoSelect: false,
                    decapitate: false,
                    largeEditDialog: false,
                    boundaryLinks: false,
                    limitSelect: false,
                    pageSelect: true
                };

                $scope.selected = [];
                $scope.limitOptions = [5, 10, 15, {
                    label: 'All',
                    value: function () {
                        return $scope.users ? $scope.users.count : 0;
                    }
                }];

                $scope.query = {
                    order: 'name',
                    limit: 5,
                    page: 1
                };
                $scope.users = Account.users.all();
                // $scope.users = {
                //     "count": 9,
                //     "data": [
                //         {
                //             "id" : 1,
                //             "name": "Barry ",
                //             "email": "barryogbonna@gmail.com",
                //             "lastname": "Ogbonna",
                //             "nickname": "sparrow",
                //             "phone_number": "09033284362",
                //             "favorite": true,
                //             "type": "Vendor",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 2,
                //             "name": "Shade ",
                //             "email": "sadekayode@gmail.com",
                //             "lastname": "Kayode",
                //             "nickname": "S key",
                //             "phone_number": "08133466367",
                //             "favorite": true,
                //             "type": "Worker",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 3,
                //             "name": "Faruk",
                //             "email": "farukolaide@gmail.com",
                //             "lastname": " Olaide",
                //             "nickname": "Faro",
                //             "phone_number": "070443284362",
                //             "favorite": true,
                //             "type": "Friend",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 4,
                //             "name": "Zainab",
                //             "email": "zainababdulsalam@gmail.com",
                //             "lastname": "Abdulsalam",
                //             "nickname": "Zee",
                //             "phone_number": "081052843642",
                //             "favorite": true,
                //             "type": "Client",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //
                //         },{
                //             "id" : 5,
                //             "name": "Yusuf",
                //             "email": "yusufmohammed@gmail.com",
                //             "lastname": "Mohammed",
                //             "nickname": "Yus man",
                //             "phone_number": "08054324569",
                //             "favorite": true,
                //             "type": "Friend",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         },{
                //             "id" : 6,
                //             "name": "Emeka",
                //             "email": "emekachinedu@gmail.com",
                //             "lastname": "Chinedu",
                //             "nickname": "Emaks",
                //             "phone_number": "07032384366",
                //             "favorite": true,
                //             "type": "Worker",
                //             "dob": "",
                //             "address": "jangolova avenue to kukere movement",
                //             "note": ""
                //         }
                //     ]
                // };

                $scope.toggleLimitOptions = function () {
                    $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
                };

                $scope.getTypes = function () {
                    return ['Candy', 'Ice cream', 'Other', 'Pastry'];
                };


                $scope.editUser = function (u) {
                    $state.go('dashboard.edit_user', {user : u.first_name});
                    // $state.go('dashboard.manage_hotel.edit_hotel', {hotelName : hotelData.name});

                };

                $scope.viewUser = function (u) {
                    $state.go('dashboard.view_user', {user : u.first_name});
                };

                $scope.loadStuff = function () {
                    $scope.reloading = true;
                       // $scope.users = Account.users.all();
                        $scope.users = Account.users.all(function success() {
                            $scope.reloading = false;
                        }, function error() {
                            alert('No yey');
                        });
                };

            }
    
})(angular);

(function(angular){
    "use strict";
    angular.module('dashboard')
        .controller('userEditCtrl', ['$scope','$stateParams','Account',Controller]);
    function Controller($scope,$stateParams,Account){
        $scope.userData = Account.user_get.act({id: $stateParams.user});
        $scope.showHints = true;



    }

})(angular);

(function(angular){
    "use strict";
    angular.module('dashboard')
        .controller('viewUserCtrl', ['$scope','$stateParams','Account',Controller]);
    function Controller($scope,$stateParams,Account){
        $scope.userData = Account.user_get.act({id: $stateParams.user});

    }

})(angular);

(function () {
    "use strict";
    angular.module('compModule', [
        'ngResource',
        'ngMdWidgetEngine',
        'krSet'
    ]);
})();
// (function () {
//     "use strict";
//     angular.module('compModule')
//             .component('budgetWidget',{
//                 templateUrl :'ngf/account/dashboard/_dashboard_files/components/budget_widget.template.html',
//                 controller:  ['$scope','$http', function ($scope,$http){
//                     $http.get("/budget_engine")
//                         .then(function(data){
//                         $scope.data = {};
//                         $scope.data.WEconfiguration = data;
//                         $scope.data.WEconfiguration2 = angular.copy(data);
//                         $scope.data.WEcallback = function(e, configuration){
//                             console.log(e, configuration);
//                         };
//                     });
//             }]
//         });
// })();

angular
    .module('compModule')
    .controller('sampleCtrl',['$scope','$http', sampleCtrl]);


function sampleCtrl($scope, $http){

    // prepare the widget data
    $http.get("/budget_engine").then(function(data){
        $scope.data = {};
        console.log(data.data);
        $scope.data.WEconfiguration = data.data;
        $scope.data.WEconfiguration2 = angular.copy(data.data);
        $scope.data.WEcallback = function(e, configuration){
            console.log(e, configuration);
        };
    });


}
(function () {
    "use strict";
    angular.module('compModule')
            .component('weatherWidget',{
                templateUrl : 'ngf/account/dashboard/_dashboard_files/components/weather_widget.template.html',
                controller:  ['compService','$http','$scope', function (compService,$http,$scope){
                    $scope.weatherData = compService.weather.forecast();
                    console.log($scope.weatherData);
    
            }]
        });
    
})();
(function () {
    "use strict";
    angular.module('compModule')
        .factory('compService', ['$resource','krSettings',function ($resource,krSettings) {
            return {
                weather :
                    $resource(krSettings.weather,null,{
                        'forecast' : {
                            method : 'GET'
                        }
                    }
                )
            }
    }]);
})();