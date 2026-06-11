/**
 * @license
 * yunli-vjs-player.js 0.0.45 <https://yunlizhihui.com>
 * Copyright Yunlizhihui, Inc. <https://yunlizhihui.com>
 * Available under Apache License Version 2.0
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
	typeof define === 'function' && define.amd ? define(['video.js'], factory) :
	(global = global || self, global.YunliVjsPlayer = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

	videojs = videojs && Object.prototype.hasOwnProperty.call(videojs, 'default') ? videojs['default'] : videojs;

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var check = function (it) {
	  return it && it.Math == Math && it;
	};

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global_1 =
	  // eslint-disable-next-line es/no-global-this -- safe
	  check(typeof globalThis == 'object' && globalThis) ||
	  check(typeof window == 'object' && window) ||
	  // eslint-disable-next-line no-restricted-globals -- safe
	  check(typeof self == 'object' && self) ||
	  check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
	  // eslint-disable-next-line no-new-func -- fallback
	  (function () { return this; })() || Function('return this')();

	var fails = function (exec) {
	  try {
	    return !!exec();
	  } catch (error) {
	    return true;
	  }
	};

	// Detect IE8's incomplete defineProperty implementation
	var descriptors = !fails(function () {
	  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
	  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
	});

	var $propertyIsEnumerable = {}.propertyIsEnumerable;
	// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	// Nashorn ~ JDK8 bug
	var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

	// `Object.prototype.propertyIsEnumerable` method implementation
	// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
	var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
	  var descriptor = getOwnPropertyDescriptor(this, V);
	  return !!descriptor && descriptor.enumerable;
	} : $propertyIsEnumerable;

	var objectPropertyIsEnumerable = {
		f: f
	};

	var createPropertyDescriptor = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

	var toString = {}.toString;

	var classofRaw = function (it) {
	  return toString.call(it).slice(8, -1);
	};

	var split = ''.split;

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var indexedObject = fails(function () {
	  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
	  // eslint-disable-next-line no-prototype-builtins -- safe
	  return !Object('z').propertyIsEnumerable(0);
	}) ? function (it) {
	  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
	} : Object;

	// `RequireObjectCoercible` abstract operation
	// https://tc39.es/ecma262/#sec-requireobjectcoercible
	var requireObjectCoercible = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on " + it);
	  return it;
	};

	// toObject with fallback for non-array-like ES3 strings



	var toIndexedObject = function (it) {
	  return indexedObject(requireObjectCoercible(it));
	};

	var isObject = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

	var path = {};

	var aFunction = function (variable) {
	  return typeof variable == 'function' ? variable : undefined;
	};

	var getBuiltIn = function (namespace, method) {
	  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
	    : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
	};

	var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

	var process = global_1.process;
	var Deno = global_1.Deno;
	var versions = process && process.versions || Deno && Deno.version;
	var v8 = versions && versions.v8;
	var match, version;

	if (v8) {
	  match = v8.split('.');
	  version = match[0] < 4 ? 1 : match[0] + match[1];
	} else if (engineUserAgent) {
	  match = engineUserAgent.match(/Edge\/(\d+)/);
	  if (!match || match[1] >= 74) {
	    match = engineUserAgent.match(/Chrome\/(\d+)/);
	    if (match) version = match[1];
	  }
	}

	var engineV8Version = version && +version;

	/* eslint-disable es/no-symbol -- required for testing */



	// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
	var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
	  var symbol = Symbol();
	  // Chrome 38 Symbol has incorrect toString conversion
	  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
	  return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
	    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
	    !Symbol.sham && engineV8Version && engineV8Version < 41;
	});

	/* eslint-disable es/no-symbol -- required for testing */


	var useSymbolAsUid = nativeSymbol
	  && !Symbol.sham
	  && typeof Symbol.iterator == 'symbol';

	var isSymbol = useSymbolAsUid ? function (it) {
	  return typeof it == 'symbol';
	} : function (it) {
	  var $Symbol = getBuiltIn('Symbol');
	  return typeof $Symbol == 'function' && Object(it) instanceof $Symbol;
	};

	// `OrdinaryToPrimitive` abstract operation
	// https://tc39.es/ecma262/#sec-ordinarytoprimitive
	var ordinaryToPrimitive = function (input, pref) {
	  var fn, val;
	  if (pref === 'string' && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
	  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
	  if (pref !== 'string' && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};

	var isPure = true;

	var setGlobal = function (key, value) {
	  try {
	    // eslint-disable-next-line es/no-object-defineproperty -- safe
	    Object.defineProperty(global_1, key, { value: value, configurable: true, writable: true });
	  } catch (error) {
	    global_1[key] = value;
	  } return value;
	};

	var SHARED = '__core-js_shared__';
	var store = global_1[SHARED] || setGlobal(SHARED, {});

	var sharedStore = store;

	var shared = createCommonjsModule(function (module) {
	(module.exports = function (key, value) {
	  return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
	})('versions', []).push({
	  version: '3.16.3',
	  mode:  'pure' ,
	  copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
	});
	});

	// `ToObject` abstract operation
	// https://tc39.es/ecma262/#sec-toobject
	var toObject = function (argument) {
	  return Object(requireObjectCoercible(argument));
	};

	var hasOwnProperty = {}.hasOwnProperty;

	var has = Object.hasOwn || function hasOwn(it, key) {
	  return hasOwnProperty.call(toObject(it), key);
	};

	var id = 0;
	var postfix = Math.random();

	var uid = function (key) {
	  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
	};

	var WellKnownSymbolsStore = shared('wks');
	var Symbol$1 = global_1.Symbol;
	var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid;

	var wellKnownSymbol = function (name) {
	  if (!has(WellKnownSymbolsStore, name) || !(nativeSymbol || typeof WellKnownSymbolsStore[name] == 'string')) {
	    if (nativeSymbol && has(Symbol$1, name)) {
	      WellKnownSymbolsStore[name] = Symbol$1[name];
	    } else {
	      WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
	    }
	  } return WellKnownSymbolsStore[name];
	};

	var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

	// `ToPrimitive` abstract operation
	// https://tc39.es/ecma262/#sec-toprimitive
	var toPrimitive = function (input, pref) {
	  if (!isObject(input) || isSymbol(input)) return input;
	  var exoticToPrim = input[TO_PRIMITIVE];
	  var result;
	  if (exoticToPrim !== undefined) {
	    if (pref === undefined) pref = 'default';
	    result = exoticToPrim.call(input, pref);
	    if (!isObject(result) || isSymbol(result)) return result;
	    throw TypeError("Can't convert object to primitive value");
	  }
	  if (pref === undefined) pref = 'number';
	  return ordinaryToPrimitive(input, pref);
	};

	// `ToPropertyKey` abstract operation
	// https://tc39.es/ecma262/#sec-topropertykey
	var toPropertyKey = function (argument) {
	  var key = toPrimitive(argument, 'string');
	  return isSymbol(key) ? key : String(key);
	};

	var document$1 = global_1.document;
	// typeof document.createElement is 'object' in old IE
	var EXISTS = isObject(document$1) && isObject(document$1.createElement);

	var documentCreateElement = function (it) {
	  return EXISTS ? document$1.createElement(it) : {};
	};

	// Thank's IE8 for his funny defineProperty
	var ie8DomDefine = !descriptors && !fails(function () {
	  // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
	  return Object.defineProperty(documentCreateElement('div'), 'a', {
	    get: function () { return 7; }
	  }).a != 7;
	});

	// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	// `Object.getOwnPropertyDescriptor` method
	// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
	var f$1 = descriptors ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
	  O = toIndexedObject(O);
	  P = toPropertyKey(P);
	  if (ie8DomDefine) try {
	    return $getOwnPropertyDescriptor(O, P);
	  } catch (error) { /* empty */ }
	  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
	};

	var objectGetOwnPropertyDescriptor = {
		f: f$1
	};

	var replacement = /#|\.prototype\./;

	var isForced = function (feature, detection) {
	  var value = data[normalize(feature)];
	  return value == POLYFILL ? true
	    : value == NATIVE ? false
	    : typeof detection == 'function' ? fails(detection)
	    : !!detection;
	};

	var normalize = isForced.normalize = function (string) {
	  return String(string).replace(replacement, '.').toLowerCase();
	};

	var data = isForced.data = {};
	var NATIVE = isForced.NATIVE = 'N';
	var POLYFILL = isForced.POLYFILL = 'P';

	var isForced_1 = isForced;

	var aFunction$1 = function (it) {
	  if (typeof it != 'function') {
	    throw TypeError(String(it) + ' is not a function');
	  } return it;
	};

	// optional / simple context binding
	var functionBindContext = function (fn, that, length) {
	  aFunction$1(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 0: return function () {
	      return fn.call(that);
	    };
	    case 1: return function (a) {
	      return fn.call(that, a);
	    };
	    case 2: return function (a, b) {
	      return fn.call(that, a, b);
	    };
	    case 3: return function (a, b, c) {
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};

	var anObject = function (it) {
	  if (!isObject(it)) {
	    throw TypeError(String(it) + ' is not an object');
	  } return it;
	};

	// eslint-disable-next-line es/no-object-defineproperty -- safe
	var $defineProperty = Object.defineProperty;

	// `Object.defineProperty` method
	// https://tc39.es/ecma262/#sec-object.defineproperty
	var f$2 = descriptors ? $defineProperty : function defineProperty(O, P, Attributes) {
	  anObject(O);
	  P = toPropertyKey(P);
	  anObject(Attributes);
	  if (ie8DomDefine) try {
	    return $defineProperty(O, P, Attributes);
	  } catch (error) { /* empty */ }
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};

	var objectDefineProperty = {
		f: f$2
	};

	var createNonEnumerableProperty = descriptors ? function (object, key, value) {
	  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

	var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






	var wrapConstructor = function (NativeConstructor) {
	  var Wrapper = function (a, b, c) {
	    if (this instanceof NativeConstructor) {
	      switch (arguments.length) {
	        case 0: return new NativeConstructor();
	        case 1: return new NativeConstructor(a);
	        case 2: return new NativeConstructor(a, b);
	      } return new NativeConstructor(a, b, c);
	    } return NativeConstructor.apply(this, arguments);
	  };
	  Wrapper.prototype = NativeConstructor.prototype;
	  return Wrapper;
	};

	/*
	  options.target      - name of the target object
	  options.global      - target is the global object
	  options.stat        - export as static methods of target
	  options.proto       - export as prototype methods of target
	  options.real        - real prototype method for the `pure` version
	  options.forced      - export even if the native feature is available
	  options.bind        - bind methods to the target, required for the `pure` version
	  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
	  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
	  options.sham        - add a flag to not completely full polyfills
	  options.enumerable  - export as enumerable property
	  options.noTargetGet - prevent calling a getter on target
	*/
	var _export = function (options, source) {
	  var TARGET = options.target;
	  var GLOBAL = options.global;
	  var STATIC = options.stat;
	  var PROTO = options.proto;

	  var nativeSource = GLOBAL ? global_1 : STATIC ? global_1[TARGET] : (global_1[TARGET] || {}).prototype;

	  var target = GLOBAL ? path : path[TARGET] || createNonEnumerableProperty(path, TARGET, {})[TARGET];
	  var targetPrototype = target.prototype;

	  var FORCED, USE_NATIVE, VIRTUAL_PROTOTYPE;
	  var key, sourceProperty, targetProperty, nativeProperty, resultProperty, descriptor;

	  for (key in source) {
	    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
	    // contains in native
	    USE_NATIVE = !FORCED && nativeSource && has(nativeSource, key);

	    targetProperty = target[key];

	    if (USE_NATIVE) if (options.noTargetGet) {
	      descriptor = getOwnPropertyDescriptor$1(nativeSource, key);
	      nativeProperty = descriptor && descriptor.value;
	    } else nativeProperty = nativeSource[key];

	    // export native or implementation
	    sourceProperty = (USE_NATIVE && nativeProperty) ? nativeProperty : source[key];

	    if (USE_NATIVE && typeof targetProperty === typeof sourceProperty) continue;

	    // bind timers to global for call from export context
	    if (options.bind && USE_NATIVE) resultProperty = functionBindContext(sourceProperty, global_1);
	    // wrap global constructors for prevent changs in this version
	    else if (options.wrap && USE_NATIVE) resultProperty = wrapConstructor(sourceProperty);
	    // make static versions for prototype methods
	    else if (PROTO && typeof sourceProperty == 'function') resultProperty = functionBindContext(Function.call, sourceProperty);
	    // default case
	    else resultProperty = sourceProperty;

	    // add a flag to not completely full polyfills
	    if (options.sham || (sourceProperty && sourceProperty.sham) || (targetProperty && targetProperty.sham)) {
	      createNonEnumerableProperty(resultProperty, 'sham', true);
	    }

	    createNonEnumerableProperty(target, key, resultProperty);

	    if (PROTO) {
	      VIRTUAL_PROTOTYPE = TARGET + 'Prototype';
	      if (!has(path, VIRTUAL_PROTOTYPE)) {
	        createNonEnumerableProperty(path, VIRTUAL_PROTOTYPE, {});
	      }
	      // export virtual prototype methods
	      createNonEnumerableProperty(path[VIRTUAL_PROTOTYPE], key, sourceProperty);
	      // export real prototype methods
	      if (options.real && targetPrototype && !targetPrototype[key]) {
	        createNonEnumerableProperty(targetPrototype, key, sourceProperty);
	      }
	    }
	  }
	};

	var ceil = Math.ceil;
	var floor = Math.floor;

	// `ToInteger` abstract operation
	// https://tc39.es/ecma262/#sec-tointeger
	var toInteger = function (argument) {
	  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
	};

	var max = Math.max;
	var min = Math.min;

	// Helper for a popular repeating case of the spec:
	// Let integer be ? ToInteger(index).
	// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
	var toAbsoluteIndex = function (index, length) {
	  var integer = toInteger(index);
	  return integer < 0 ? max(integer + length, 0) : min(integer, length);
	};

	var min$1 = Math.min;

	// `ToLength` abstract operation
	// https://tc39.es/ecma262/#sec-tolength
	var toLength = function (argument) {
	  return argument > 0 ? min$1(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
	};

	// `IsArray` abstract operation
	// https://tc39.es/ecma262/#sec-isarray
	// eslint-disable-next-line es/no-array-isarray -- safe
	var isArray = Array.isArray || function isArray(arg) {
	  return classofRaw(arg) == 'Array';
	};

	var SPECIES = wellKnownSymbol('species');

	// a part of `ArraySpeciesCreate` abstract operation
	// https://tc39.es/ecma262/#sec-arrayspeciescreate
	var arraySpeciesConstructor = function (originalArray) {
	  var C;
	  if (isArray(originalArray)) {
	    C = originalArray.constructor;
	    // cross-realm fallback
	    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
	    else if (isObject(C)) {
	      C = C[SPECIES];
	      if (C === null) C = undefined;
	    }
	  } return C === undefined ? Array : C;
	};

	// `ArraySpeciesCreate` abstract operation
	// https://tc39.es/ecma262/#sec-arrayspeciescreate
	var arraySpeciesCreate = function (originalArray, length) {
	  return new (arraySpeciesConstructor(originalArray))(length === 0 ? 0 : length);
	};

	var createProperty = function (object, key, value) {
	  var propertyKey = toPropertyKey(key);
	  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
	  else object[propertyKey] = value;
	};

	var SPECIES$1 = wellKnownSymbol('species');

	var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
	  // We can't use this feature detection in V8 since it causes
	  // deoptimization and serious performance degradation
	  // https://github.com/zloirock/core-js/issues/677
	  return engineV8Version >= 51 || !fails(function () {
	    var array = [];
	    var constructor = array.constructor = {};
	    constructor[SPECIES$1] = function () {
	      return { foo: 1 };
	    };
	    return array[METHOD_NAME](Boolean).foo !== 1;
	  });
	};

	var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('splice');

	var max$1 = Math.max;
	var min$2 = Math.min;
	var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
	var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

	// `Array.prototype.splice` method
	// https://tc39.es/ecma262/#sec-array.prototype.splice
	// with adding support of @@species
	_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
	  splice: function splice(start, deleteCount /* , ...items */) {
	    var O = toObject(this);
	    var len = toLength(O.length);
	    var actualStart = toAbsoluteIndex(start, len);
	    var argumentsLength = arguments.length;
	    var insertCount, actualDeleteCount, A, k, from, to;
	    if (argumentsLength === 0) {
	      insertCount = actualDeleteCount = 0;
	    } else if (argumentsLength === 1) {
	      insertCount = 0;
	      actualDeleteCount = len - actualStart;
	    } else {
	      insertCount = argumentsLength - 2;
	      actualDeleteCount = min$2(max$1(toInteger(deleteCount), 0), len - actualStart);
	    }
	    if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER) {
	      throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
	    }
	    A = arraySpeciesCreate(O, actualDeleteCount);
	    for (k = 0; k < actualDeleteCount; k++) {
	      from = actualStart + k;
	      if (from in O) createProperty(A, k, O[from]);
	    }
	    A.length = actualDeleteCount;
	    if (insertCount < actualDeleteCount) {
	      for (k = actualStart; k < len - actualDeleteCount; k++) {
	        from = k + actualDeleteCount;
	        to = k + insertCount;
	        if (from in O) O[to] = O[from];
	        else delete O[to];
	      }
	      for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
	    } else if (insertCount > actualDeleteCount) {
	      for (k = len - actualDeleteCount; k > actualStart; k--) {
	        from = k + actualDeleteCount - 1;
	        to = k + insertCount - 1;
	        if (from in O) O[to] = O[from];
	        else delete O[to];
	      }
	    }
	    for (k = 0; k < insertCount; k++) {
	      O[k + actualStart] = arguments[k + 2];
	    }
	    O.length = len - actualDeleteCount + insertCount;
	    return A;
	  }
	});

	var entryVirtual = function (CONSTRUCTOR) {
	  return path[CONSTRUCTOR + 'Prototype'];
	};

	var splice = entryVirtual('Array').splice;

	var ArrayPrototype = Array.prototype;

	var splice_1 = function (it) {
	  var own = it.splice;
	  return it === ArrayPrototype || (it instanceof Array && own === ArrayPrototype.splice) ? splice : own;
	};

	var splice$1 = splice_1;

	var splice$2 = splice$1;

	var slice = [].slice;
	var MSIE = /MSIE .\./.test(engineUserAgent); // <- dirty ie9- check

	var wrap = function (scheduler) {
	  return function (handler, timeout /* , ...arguments */) {
	    var boundArgs = arguments.length > 2;
	    var args = boundArgs ? slice.call(arguments, 2) : undefined;
	    return scheduler(boundArgs ? function () {
	      // eslint-disable-next-line no-new-func -- spec requirement
	      (typeof handler == 'function' ? handler : Function(handler)).apply(this, args);
	    } : handler, timeout);
	  };
	};

	// ie9- setTimeout & setInterval additional parameters fix
	// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
	_export({ global: true, bind: true, forced: MSIE }, {
	  // `setTimeout` method
	  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
	  setTimeout: wrap(global_1.setTimeout),
	  // `setInterval` method
	  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
	  setInterval: wrap(global_1.setInterval)
	});

	var setTimeout = path.setTimeout;

	var setTimeout$1 = setTimeout;

	// `Array.prototype.{ indexOf, includes }` methods implementation
	var createMethod = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = toIndexedObject($this);
	    var length = toLength(O.length);
	    var index = toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare -- NaN check
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare -- NaN check
	      if (value != value) return true;
	    // Array#indexOf ignores holes, Array#includes - not
	    } else for (;length > index; index++) {
	      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

	var arrayIncludes = {
	  // `Array.prototype.includes` method
	  // https://tc39.es/ecma262/#sec-array.prototype.includes
	  includes: createMethod(true),
	  // `Array.prototype.indexOf` method
	  // https://tc39.es/ecma262/#sec-array.prototype.indexof
	  indexOf: createMethod(false)
	};

	var arrayMethodIsStrict = function (METHOD_NAME, argument) {
	  var method = [][METHOD_NAME];
	  return !!method && fails(function () {
	    // eslint-disable-next-line no-useless-call,no-throw-literal -- required for testing
	    method.call(null, argument || function () { throw 1; }, 1);
	  });
	};

	/* eslint-disable es/no-array-prototype-indexof -- required for testing */

	var $indexOf = arrayIncludes.indexOf;


	var nativeIndexOf = [].indexOf;

	var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
	var STRICT_METHOD = arrayMethodIsStrict('indexOf');

	// `Array.prototype.indexOf` method
	// https://tc39.es/ecma262/#sec-array.prototype.indexof
	_export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || !STRICT_METHOD }, {
	  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
	    return NEGATIVE_ZERO
	      // convert -0 to +0
	      ? nativeIndexOf.apply(this, arguments) || 0
	      : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});

	var indexOf = entryVirtual('Array').indexOf;

	var ArrayPrototype$1 = Array.prototype;

	var indexOf_1 = function (it) {
	  var own = it.indexOf;
	  return it === ArrayPrototype$1 || (it instanceof Array && own === ArrayPrototype$1.indexOf) ? indexOf : own;
	};

	var indexOf$1 = indexOf_1;

	var indexOf$2 = indexOf$1;

	var Play = "播放";
	var Pause = "暂停";
	var Duration = "时长";
	var LIVE = "直播";
	var Loaded = "加载完成";
	var Progress = "进度";
	var Fullscreen = "全屏";
	var Mute = "静音";
	var Unmute = "取消静音";
	var Subtitles = "字幕";
	var Captions = "内嵌字幕";
	var Chapters = "节目段落";
	var Descriptions = "描述";
	var Close = "关闭";
	var Replay = "重新播放";
	var Text = "文字";
	var White = "白";
	var Black = "黑";
	var Red = "红";
	var Green = "绿";
	var Blue = "蓝";
	var Yellow = "黄";
	var Magenta = "紫红";
	var Cyan = "青";
	var Background = "背景";
	var Window = "窗口";
	var Transparent = "透明";
	var Opaque = "不透明";
	var None = "无";
	var Raised = "浮雕";
	var Depressed = "压低";
	var Uniform = "均匀";
	var Dropshadow = "下阴影";
	var Casual = "舒适";
	var Script = "手写体";
	var Reset = "重置";
	var Done = "完成";
	var Snap = "截屏";
	var Record = "录制";
	var lang = {
		Play: Play,
		Pause: Pause,
		"Current Time": "当前时间",
		Duration: Duration,
		"Remaining Time": "剩余时间",
		"Stream Type": "媒体流类型",
		LIVE: LIVE,
		Loaded: Loaded,
		Progress: Progress,
		Fullscreen: Fullscreen,
		"Picture-in-Picture": "画中画",
		"Exit Picture-in-Picture": "退出画中画",
		"Non-Fullscreen": "退出全屏",
		Mute: Mute,
		Unmute: Unmute,
		"Playback Rate": "播放速度",
		Subtitles: Subtitles,
		"subtitles off": "关闭字幕",
		Captions: Captions,
		"captions off": "关闭内嵌字幕",
		Chapters: Chapters,
		"Close Modal Dialog": "关闭弹窗",
		Descriptions: Descriptions,
		"descriptions off": "关闭描述",
		"Audio Track": "音轨",
		"You aborted the media playback": "视频播放被终止",
		"A network error caused the media download to fail part-way.": "网络错误导致视频下载中途失败。",
		"The media could not be loaded, either because the server or network failed or because the format is not supported.": "视频因格式不支持或者服务器或网络的问题无法加载。",
		"The media playback was aborted due to a corruption problem or because the media used features your browser did not support.": "由于视频文件损坏或是该视频使用了你的浏览器不支持的功能，播放终止。",
		"No compatible source was found for this media.": "无法找到此视频兼容的源。",
		"The media is encrypted and we do not have the keys to decrypt it.": "视频已加密，无法解密。",
		"Play Video": "播放视频",
		Close: Close,
		"Modal Window": "弹窗",
		"This is a modal window": "这是一个弹窗",
		"This modal can be closed by pressing the Escape key or activating the close button.": "可以按ESC按键或启用关闭按钮来关闭此弹窗。",
		", opens captions settings dialog": ", 开启标题设置弹窗",
		", opens subtitles settings dialog": ", 开启字幕设置弹窗",
		", opens descriptions settings dialog": ", 开启描述设置弹窗",
		", selected": ", 选择",
		"captions settings": "字幕设定",
		"Audio Player": "音频播放器",
		"Video Player": "视频播放器",
		Replay: Replay,
		"Progress Bar": "进度条",
		"Volume Level": "音量",
		"subtitles settings": "字幕设定",
		"descriptions settings": "描述设定",
		Text: Text,
		White: White,
		Black: Black,
		Red: Red,
		Green: Green,
		Blue: Blue,
		Yellow: Yellow,
		Magenta: Magenta,
		Cyan: Cyan,
		Background: Background,
		Window: Window,
		Transparent: Transparent,
		"Semi-Transparent": "半透明",
		Opaque: Opaque,
		"Font Size": "字体尺寸",
		"Text Edge Style": "字体边缘样式",
		None: None,
		Raised: Raised,
		Depressed: Depressed,
		Uniform: Uniform,
		Dropshadow: Dropshadow,
		"Font Family": "字体库",
		"Proportional Sans-Serif": "比例无细体",
		"Monospace Sans-Serif": "单间隔无细体",
		"Proportional Serif": "比例细体",
		"Monospace Serif": "单间隔细体",
		Casual: Casual,
		Script: Script,
		"Small Caps": "小型大写字体",
		Reset: Reset,
		"restore all settings to the default values": "恢复全部设定至预设值",
		Done: Done,
		"Caption Settings Dialog": "字幕设定窗口",
		"Beginning of dialog window. Escape will cancel and close the window.": "打开对话窗口。Escape键将取消并关闭对话窗口",
		"End of dialog window.": "结束对话窗口",
		"Seek to live, currently behind live": "尝试直播，当前为延时播放",
		"Seek to live, currently playing live": "尝试直播，当前为实时播放",
		"progress bar timing: currentTime={1} duration={2}": "{1}/{2}",
		"{1} is loading.": "正在加载 {1}。",
		Snap: Snap,
		Record: Record,
		"Non-Record": "停止录制"
	};

	function initMixin(YunliVjsPlayer) {
	  YunliVjsPlayer.prototype._init = function (el, options, readyCallback) {
	    //videojs对象
	    if (!videojs) {
	      throw new Error('本组件依赖videojs库，请先引入。');
	    }

	    if (options.yunliMode === 'history' && !options.duration && options.beginTime && options.endTime) {
	      var beginTime = new Date(options.beginTime).getTime();
	      var endTime = new Date(options.endTime).getTime();
	      console.log('beginTime', beginTime, endTime);

	      if (isNaN(beginTime) || isNaN(endTime)) {
	        throw new Error('beginTime或者endTime格式错误');
	      } else {
	        options.duration = Math.floor((endTime - beginTime) / 1000);

	        if (isNaN(options.duration) || options.duration < 0) {
	          throw new Error('beginTime或者endTime格式错误');
	        }
	      }
	    }

	    this.options_ = options || {};
	    this.el_ = el;
	    this.readyCallback_ = readyCallback; //重试次数

	    this.retryTime = 0; //最多重试次数

	    this.maxRetryTime = options.maxRetryTime || 3; //是否自动重试

	    this.autoRetry = options.autoRety !== undefined ? options.autoRetry : true; //加载中重试前等待时间

	    this.waitingInterval = options.waitingInterval || 5000;
	    this.waitingTimer = null;
	    this._keepAliveTimer = null;
	    this._keepAliveInterval = options.keepAliveInterval || 15000; //心跳保活默认开启

	    this.keepAlive = options.keepAlive || true; //是否播放状态

	    this.isPlaying = false; //处理源的格式

	    if (this.options_.sources) {
	      this.options_.sources = this._parseSource(this.options_.sources);
	    }

	    this.setEnv();
	    this.setOptions(options); //实例化videojs播放器

	    this.initPlayer(readyCallback);
	    return this.player_;
	  };

	  YunliVjsPlayer.prototype.setEnv = function () {
	    var _this = this;

	    // 添加语言
	    this.addLang();

	    this._addSnapButton(); //添加录制功能


	    if (this.options_.record) {
	      this._addRecordButton();
	    }

	    var onLineHandler = function onLineHandler(e) {
	      console.log(e, "you're online");

	      if (_this.player_) {
	        _this.player_.error(null);

	        _this.src(_this.options_.sources);

	        _this.player_.play();
	      }
	    };

	    var offLineHandler = function offLineHandler(e) {
	      console.log(e, "you're offline");

	      if (_this.player_) {
	        _this.errorHandler('offline');
	      }
	    };

	    window.addEventListener('online', onLineHandler);
	    window.addEventListener('offline', offLineHandler);

	    if (!navigator.onLine) {
	      offLineHandler(null);
	    }
	  };

	  YunliVjsPlayer.prototype.addLang = function () {
	    // 添加语言
	    videojs.addLanguage('zh-CN', lang);
	  };

	  YunliVjsPlayer.prototype.setOptions = function () {
	    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var controlBarList = ['playToggle', 'currentTimeDisplay', 'timeDivider', 'durationDisplay', 'progressControl', 'liveDisplay', 'seekToLive', 'customControlSpacer', 'recordButton', 'snapButton', 'playbackRateMenuButton', 'chaptersButton', 'descriptionsButton', 'volumePanel', 'subsCapsButton', 'audioTrackButton', 'fullscreenToggle']; // 是否支持画中画模式

	    if ('exitPictureInPicture' in document) {
	      splice$2(controlBarList).call(controlBarList, controlBarList.length - 1, 0, 'pictureInPictureToggle');
	    }

	    var options = {
	      language: 'zh-CN',
	      controls: true,
	      autoplay: false,
	      techOrder: ['html5', 'flvjs', 'flash'],
	      record: false,
	      snap: {
	        autoSave: true
	      },
	      controlBar: {
	        children: controlBarList,
	        volumePanel: {
	          inline: false,
	          vertical: true
	        }
	      },
	      flash: {
	        swf: './lib/video-js.swf'
	      }
	    }; //直播

	    if (opt.yunliMode === 'live') {
	      splice$2(controlBarList).call(controlBarList, 4, 1);

	      options.controlBar.timeDivider = false;
	      options.controlBar.durationDisplay = false;
	    } else {
	      options.playbackRates = ['0.25', '0.5', '1', '2', '4', '8', '16'];
	    }

	    options = videojs.mergeOptions(options, opt);
	    this.options_ = options;
	    return options;
	  };

	  YunliVjsPlayer.prototype.initPlayer = function () {
	    var this_ = this;
	    this.player_ = videojs(this.el_, this.options_, function (p) {
	      this_.replaceEvents();
	      this_.replaceSpinner();
	      console.log('ccccccfill', this_.options_, this_.player_);
	      var options_ = this_.options_;
	      var player_ = this_.player_;

	      if (options_.fillScreen && player_ && player_.el_) {
	        console.log('ccccccfill');
	        player_.el_.querySelector('video').style.objectFit = 'fill';
	      } // 添加宽高


	      if (options_.height) {
	        player_.el_.style.height = options_.height;
	      }

	      if (options_.width) {
	        player_.el_.style.width = options_.width;
	      }

	      if (this_.options_.yunliMode === 'history' && this_.options_.duration) {
	        this_.replaceControlBarEvent();
	      } // player reader callback


	      if (this_.readyCallback_ && typeof this_.readyCallback_ === 'function') {
	        this_.readyCallback_(p);
	      }

	      if ((this_.options_.yunliMode === 'live' || this_.options_.yunliMode === 'history') && this_.keepAlive) {
	        this_._keepAlive();
	      }
	    });
	    this.player_.on('error', function (err) {
	      var _context;

	      var error = this_.player_.error();
	      console.log('on error', error);

	      setTimeout$1(function () {
	        var _this_$player_, _this_$player_$el_, _this_$player_$el_$cl;

	        (_this_$player_ = this_.player_) === null || _this_$player_ === void 0 ? void 0 : (_this_$player_$el_ = _this_$player_.el_) === null || _this_$player_$el_ === void 0 ? void 0 : (_this_$player_$el_$cl = _this_$player_$el_.classList) === null || _this_$player_$el_$cl === void 0 ? void 0 : _this_$player_$el_$cl.remove('vjs-loading-data');
	      }, 100);

	      if (error && indexOf$2(_context = ['timeout', 'offline', 'notfound', 'shutdown', 'neterror']).call(_context, error.message) > -1) {
	        //if(this_.onError && typeof this_.onError === 'function'){
	        this_.onError.call(this_, error); //}

	        return;
	      }

	      if (!navigator.onLine) {
	        this_.errorHandler('offline');
	        return;
	      }

	      if (error && error.code === 4) {
	        this_.errorHandler('notfound');
	      } else if (error && error.code) {
	        this_.errorHandler('shutdown');
	      }
	    });
	    return this.player_;
	  };
	}

	var hiddenKeys = {};

	var indexOf$3 = arrayIncludes.indexOf;


	var objectKeysInternal = function (object, names) {
	  var O = toIndexedObject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while (names.length > i) if (has(O, key = names[i++])) {
	    ~indexOf$3(result, key) || result.push(key);
	  }
	  return result;
	};

	// IE8- don't enum bug keys
	var enumBugKeys = [
	  'constructor',
	  'hasOwnProperty',
	  'isPrototypeOf',
	  'propertyIsEnumerable',
	  'toLocaleString',
	  'toString',
	  'valueOf'
	];

	// `Object.keys` method
	// https://tc39.es/ecma262/#sec-object.keys
	// eslint-disable-next-line es/no-object-keys -- safe
	var objectKeys = Object.keys || function keys(O) {
	  return objectKeysInternal(O, enumBugKeys);
	};

	// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
	var f$3 = Object.getOwnPropertySymbols;

	var objectGetOwnPropertySymbols = {
		f: f$3
	};

	// eslint-disable-next-line es/no-object-assign -- safe
	var $assign = Object.assign;
	// eslint-disable-next-line es/no-object-defineproperty -- required for testing
	var defineProperty = Object.defineProperty;

	// `Object.assign` method
	// https://tc39.es/ecma262/#sec-object.assign
	var objectAssign = !$assign || fails(function () {
	  // should have correct order of operations (Edge bug)
	  if (descriptors && $assign({ b: 1 }, $assign(defineProperty({}, 'a', {
	    enumerable: true,
	    get: function () {
	      defineProperty(this, 'b', {
	        value: 3,
	        enumerable: false
	      });
	    }
	  }), { b: 2 })).b !== 1) return true;
	  // should work with symbols and should have deterministic property order (V8 bug)
	  var A = {};
	  var B = {};
	  // eslint-disable-next-line es/no-symbol -- safe
	  var symbol = Symbol();
	  var alphabet = 'abcdefghijklmnopqrst';
	  A[symbol] = 7;
	  alphabet.split('').forEach(function (chr) { B[chr] = chr; });
	  return $assign({}, A)[symbol] != 7 || objectKeys($assign({}, B)).join('') != alphabet;
	}) ? function assign(target, source) { // eslint-disable-line no-unused-vars -- required for `.length`
	  var T = toObject(target);
	  var argumentsLength = arguments.length;
	  var index = 1;
	  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
	  var propertyIsEnumerable = objectPropertyIsEnumerable.f;
	  while (argumentsLength > index) {
	    var S = indexedObject(arguments[index++]);
	    var keys = getOwnPropertySymbols ? objectKeys(S).concat(getOwnPropertySymbols(S)) : objectKeys(S);
	    var length = keys.length;
	    var j = 0;
	    var key;
	    while (length > j) {
	      key = keys[j++];
	      if (!descriptors || propertyIsEnumerable.call(S, key)) T[key] = S[key];
	    }
	  } return T;
	} : $assign;

	// `Object.assign` method
	// https://tc39.es/ecma262/#sec-object.assign
	// eslint-disable-next-line es/no-object-assign -- required for testing
	_export({ target: 'Object', stat: true, forced: Object.assign !== objectAssign }, {
	  assign: objectAssign
	});

	var assign = path.Object.assign;

	var assign$1 = assign;

	var assign$2 = assign$1;

	var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
	var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
	var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

	// We can't use this feature detection in V8 since it causes
	// deoptimization and serious performance degradation
	// https://github.com/zloirock/core-js/issues/679
	var IS_CONCAT_SPREADABLE_SUPPORT = engineV8Version >= 51 || !fails(function () {
	  var array = [];
	  array[IS_CONCAT_SPREADABLE] = false;
	  return array.concat()[0] !== array;
	});

	var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

	var isConcatSpreadable = function (O) {
	  if (!isObject(O)) return false;
	  var spreadable = O[IS_CONCAT_SPREADABLE];
	  return spreadable !== undefined ? !!spreadable : isArray(O);
	};

	var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

	// `Array.prototype.concat` method
	// https://tc39.es/ecma262/#sec-array.prototype.concat
	// with adding support of @@isConcatSpreadable and @@species
	_export({ target: 'Array', proto: true, forced: FORCED }, {
	  // eslint-disable-next-line no-unused-vars -- required for `.length`
	  concat: function concat(arg) {
	    var O = toObject(this);
	    var A = arraySpeciesCreate(O, 0);
	    var n = 0;
	    var i, k, length, len, E;
	    for (i = -1, length = arguments.length; i < length; i++) {
	      E = i === -1 ? O : arguments[i];
	      if (isConcatSpreadable(E)) {
	        len = toLength(E.length);
	        if (n + len > MAX_SAFE_INTEGER$1) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
	        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
	      } else {
	        if (n >= MAX_SAFE_INTEGER$1) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
	        createProperty(A, n++, E);
	      }
	    }
	    A.length = n;
	    return A;
	  }
	});

	var concat = entryVirtual('Array').concat;

	var ArrayPrototype$2 = Array.prototype;

	var concat_1 = function (it) {
	  var own = it.concat;
	  return it === ArrayPrototype$2 || (it instanceof Array && own === ArrayPrototype$2.concat) ? concat : own;
	};

	var concat$1 = concat_1;

	var concat$2 = concat$1;

	/**
	 * Returns whether an object is `Promise`-like (i.e. has a `then` method).
	 *
	 * @param  {Object}  value
	 *         An object that may or may not be `Promise`-like.
	 *
	 * @return {boolean}
	 *         Whether or not the object is `Promise`-like.
	 */
	function isPromise(value) {
	  return value !== undefined && value !== null && typeof value.then === 'function';
	}
	/**
	 * Silence a Promise-like object.
	 *
	 * This is useful for avoiding non-harmful, but potentially confusing "uncaught
	 * play promise" rejection error messages.
	 *
	 * @param  {Object} value
	 *         An object that may or may not be `Promise`-like.
	 */

	function silencePromise(value) {
	  if (isPromise(value)) {
	    value.then(null, function (e) {});
	  }
	}

	/**
	 * @file format-time.js
	 * @module format-time
	 */

	/**
	 * Format seconds as a time string, H:MM:SS or M:SS. Supplying a guide (in
	 * seconds) will force a number of leading zeros to cover the length of the
	 * guide.
	 *
	 * @private
	 * @param  {number} seconds
	 *         Number of seconds to be turned into a string
	 *
	 * @param  {number} guide
	 *         Number (in seconds) to model the string after
	 *
	 * @return {string}
	 *         Time formatted as H:MM:SS or M:SS
	 */
	var defaultImplementation = function defaultImplementation(seconds, guide) {
	  seconds = seconds < 0 ? 0 : seconds;
	  var s = Math.floor(seconds % 60);
	  var m = Math.floor(seconds / 60 % 60);
	  var h = Math.floor(seconds / 3600);
	  var gm = Math.floor(guide / 60 % 60);
	  var gh = Math.floor(guide / 3600); // handle invalid times

	  if (isNaN(seconds) || seconds === Infinity) {
	    // '-' is false for all relational operators (e.g. <, >=) so this setting
	    // will add the minimum number of fields specified by the guide
	    h = m = s = '-';
	  } // Check if we need to show hours


	  h = h > 0 || gh > 0 ? h + ':' : ''; // If hours are showing, we may need to add a leading zero.
	  // Always show at least one digit of minutes.

	  m = ((h || gm >= 10) && m < 10 ? '0' + m : m) + ':'; // Check if leading zero is need for seconds

	  s = s < 10 ? '0' + s : s;
	  return h + m + s;
	}; // Internal pointer to the current implementation.


	var implementation = defaultImplementation;
	/**
	 * Delegates to either the default time formatting function or a custom
	 * function supplied via `setFormatTime`.
	 *
	 * Formats seconds as a time string (H:MM:SS or M:SS). Supplying a
	 * guide (in seconds) will force a number of leading zeros to cover the
	 * length of the guide.
	 *
	 * @static
	 * @example  formatTime(125, 600) === "02:05"
	 * @param    {number} seconds
	 *           Number of seconds to be turned into a string
	 *
	 * @param    {number} guide
	 *           Number (in seconds) to model the string after
	 *
	 * @return   {string}
	 *           Time formatted as H:MM:SS or M:SS
	 */

	function formatTime(seconds) {
	  var guide = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : seconds;
	  return implementation(seconds, guide);
	}

	function eventsMixin(YunliVjsPlayer) {
	  YunliVjsPlayer.prototype.errorHandler = function (type) {
	    var player = this.player_;
	    window.clearTimeout(this.waitingTimer);

	    if (type !== 'timeout' && this.autoRetry) {
	      this._handleWaiting.call(this);
	    }

	    silencePromise(player.pause());
	    var typeTips = {
	      timeout: '连接超时',
	      offline: '无网络',
	      shutdown: '视频中断',
	      notfound: '视频未找到',
	      neterror: '网络错误'
	    };

	    if (this.options_.errorTexts) {
	      typeTips = assign$2({}, typeTips, this.options_.errorTexts);
	    }

	    var vjsModalContent = this.player_.el_.querySelector('.vjs-modal-dialog-content');
	    player.error(type);

	    if (vjsModalContent) {
	      if (this.retryTime < this.maxRetryTime) {
	        vjsModalContent.innerHTML = "\n          <div class=\"vjs-loading-spinner\" dir=\"ltr\">\n            <i class=\"yl-spin-dot-item\"></i>\n            <i class=\"yl-spin-dot-item\"></i>\n            <i class=\"yl-spin-dot-item\"></i>\n            <i class=\"yl-spin-dot-item\"></i>\n          </div>";
	      } else {
	        var _context;

	        vjsModalContent.innerHTML = concat$2(_context = "\n        <div class=\"vjs-yunli-error\">\n          <div class=\"vjs-yunli-".concat(type, "\"></div>\n          <div class=\"vjs-yunli-tip\">")).call(_context, typeTips[type], "</div>\n        </div>\n      ");
	      }
	    }
	  }; // 替换loading图标


	  YunliVjsPlayer.prototype.replaceSpinner = function () {
	    var el = (this.player_.el_ || document).querySelector('.vjs-loading-spinner');
	    el.innerHTML = '';

	    for (var i = 0; i < 4; i++) {
	      var it = document.createElement('i');
	      it.classList.add('yl-spin-dot-item');
	      el.appendChild(it);
	    }
	  };

	  YunliVjsPlayer.prototype._handleWaiting = function () {
	    var _this = this;

	    if (this.options_.eventMode === 'monitor') {
	      return;
	    }

	    console.log('retry', this.retryTime, this.player_.id_, this.waitingTimer, this);

	    if (this.waitingTimer) {
	      window.clearTimeout(this.waitingTimer);
	    }

	    if (this.retryTime < this.maxRetryTime) {
	      //silencePromise(this.player_.play())
	      this.waitingTimer = setTimeout$1(function () {
	        if (!_this.player_.paused() && _this.isPlaying) {
	          return;
	        }

	        console.log('retry in timeout', _this.player_.id_, _this.waitingTimer); //let sources = this.player_.currentSources() 
	        //sources = sources.length === 0 ? this.player_.options_.sources : sources

	        if (_this.player_.techName_ === 'Flash') {
	          _this.player_.reset();
	        }

	        if (_this.player_.techName_ !== 'Flash') {
	          _this.src(_this.options_.sources);
	        }

	        if (_this.player_.techName_ === 'Flash') {
	          _this.player_.play();
	        }
	        /*
	        try{
	          if (this.options_.sources[0].src !== this.player_.currentSources()[0].src) {
	             console.log('retry in timeout',this.options_.sources, this.player_.currentSources())
	             this.src(this.options_.sources)
	          } else {
	           this.player_.play()
	          }
	        } catch(err){
	         console.log('err', err)
	        }
	        */
	        //this.player_.play()


	        _this._handleWaiting.call(_this);

	        _this.retryTime += 1;
	      }, this.waitingInterval);
	    } else {
	      //超时
	      this.errorHandler('timeout');
	    }
	  };

	  YunliVjsPlayer.prototype.replaceEvents = function () {
	    var _this3 = this;

	    console.log('bindEvent');
	    var _this$options_ = this.options_,
	        duration = _this$options_.duration,
	        eventMode = _this$options_.eventMode,
	        yunliMode = _this$options_.yunliMode;
	    var player_ = this.player_;
	    var this_ = this;

	    if (eventMode === 'monitor') {
	      return;
	    } //回放模式


	    if (yunliMode === 'history' && duration) {
	      //当前播放时间
	      var _currentTime = function _currentTime(seconds) {
	        //console.log('currentTIme', seconds, this)
	        if (typeof seconds !== 'undefined') {
	          console.log('currentTIme ii', seconds, this);

	          if (seconds < 0) {
	            seconds = 0;
	          }

	          if (!this.isReady_ || this.changingSrc_ || !this.tech_ || !this.tech_.isReady_) {
	            this.cache_.initTime = seconds;
	            this.off('canplay', this.applyInitTime_);
	            this.one('canplay', this.applyInitTime_);
	            return;
	          }

	          this.techCall_('setCurrentTime', seconds);
	          this.cache_.initTime = seconds;
	          this.cache_.currentTime = seconds;
	          this_.ylJumpTime = seconds;
	          return;
	        } // cache last currentTime and return. default to 0 seconds
	        //
	        // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
	        // currentTime when scrubbing, but may not provide much performance benefit afterall.
	        // Should be tested. Also something has to read the actual current time or the cache will
	        // never get updated.


	        this.cache_.currentTime = this.techGet_('currentTime') || 0;
	        return this.cache_.currentTime;
	      };

	      //设置进度条
	      player_.duration = function () {
	        return duration;
	      };

	      player_.currentTime = _currentTime;

	      player_.tech_.setCurrentTime = function (time) {
	        console.log('tech set currentTime', time, this); //this.lastSeekTarget_ = time

	        if (this.el_.vjs_setProperty) {
	          this.el_.vjs_setProperty('currentTime', time);
	        }
	      };

	      player_.controlBar.currentTimeDisplay.updateTextNode_ = function () {
	        var _this2 = this;

	        var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

	        if (this_.isJumping) {
	          time = this_.ylJumpTime || 0;
	        } else {
	          time = time + (this_.ylJumpTime || 0);
	        }

	        time = formatTime(time);

	        if (this.formattedTime_ === time) {
	          return;
	        }

	        this.formattedTime_ = time;
	        this.requestAnimationFrame(function () {
	          if (!_this2.contentEl_) {
	            return;
	          }

	          var oldNode = _this2.textNode_;
	          _this2.textNode_ = document.createTextNode(_this2.formattedTime_);

	          if (!_this2.textNode_) {
	            return;
	          }

	          if (oldNode) {
	            _this2.contentEl_.replaceChild(_this2.textNode_, oldNode);
	          } else {
	            _this2.contentEl_.appendChild(_this2.textNode_);
	          }
	        });
	      };

	      player_.on('play', function () {
	        this_.isJumping = false; //clearTimeout(this_.waitingTimer)

	        console.log('play', player_.id_, this_.options_.sources);

	        if (this_.waitingTimer) {
	          window.clearTimeout(this_.waitingTimer);
	        }

	        setTimeout$1(function () {
	          player_.el_.classList.remove('vjs-loading-data');
	        }, 200);
	      }); //播放倍率

	      player_.on('ratechange', function (e) {
	        if (e) {
	          e.preventDefault();
	          e.stopPropagation();
	        }

	        console.log('ratechange', e, _this3.player_.playbackRate()); //

	        _this3._changePlayRate();
	      });
	      player_.on('timeupdate', function (e) {
	        var currentTime = player_.currentTime();
	        var duration = player_.duration() || 0;

	        if (player_.options_.yunliMode === 'history') {
	          if (this_.isJumping) {
	            currentTime = this_.ylJumpTime || 0;
	          } else {
	            currentTime += this_.ylJumpTime || 0;
	          }
	        }

	        if (currentTime > duration) {
	          //时间超过时长，强制关闭
	          player_.reset();
	          this_.ylJumpTime = 0;
	          this_.ylReset = true;

	          if (this_.onEnd && typeof this_.onEnd === 'function') {
	            this_.onEnd.call(this_);
	          }

	          if (player_.options_.loop) {
	            /*
	            let sources = player_.currentSources()
	            if(sources.length === 0){
	              sources = this_.options_.sources
	            }
	            this_.src(sources)
	            */
	            this_._refetchPlay();
	          } else {
	            setTimeout$1(function () {
	              player_.el_.classList.add('vjs-paused');
	              player_.pause();
	            }, 500);
	          }
	        } //console.log('timeupdate', player_.currentTime())

	      });

	      player_.bigPlayButton.el_.onclick = function () {
	        //console.log('play onclick', this_.ylReset)
	        if (this_.ylReset) {
	          this_.ylReset = false;
	          var func = this_.options_.beforeRetry || this_.beforeRetry;

	          if (func) {
	            func.call(this_, this_);
	          } else {
	            this_.src(this_.options_.sources);
	          }
	        }
	      };
	    } //player_.scrubbing(true)
	    // 点击错误界面，重新尝试播放


	    player_.errorDisplay.el_.onclick = function (e) {
	      if (e) {
	        e.preventDefault();
	      }

	      this_.src(this_.options_.sources || player_.currentSources());
	    };

	    player_.on('waiting', function (e) {
	      console.log('waiting', player_.el_.classList.contains('vjs-loading-data'));
	      _this3.isPlaying = false; // 离线

	      if (!navigator.onLine) {
	        this_.errorHandler('offline');
	        return;
	      }

	      window.clearTimeout(this_.waitingTimer);

	      this_._handleWaiting.call(this_);

	      if (!player_.el_.classList.contains('vjs-loading-data')) {
	        player_.el_.classList.add('vjs-loading-data');
	      }
	    });
	    player_.on('loadstart', function (e) {
	      console.log('load start', player_.id_, this_.waitingTimer);
	      window.clearTimeout(this_.waitingTimer);

	      if (this_.player_.techName_ === 'Flash') {
	        this_._handleWaiting.call(this_);
	      }

	      if (!player_.el_.classList.contains('vjs-loading-data')) {
	        player_.el_.classList.add('vjs-loading-data');
	      }
	    });
	    player_.on('loadeddata', function (e) {
	      console.log('loaded data', player_.id_, this_.waitingTimer);
	      window.clearTimeout(this_.waitingTimer);

	      setTimeout$1(function () {
	        player_.el_.classList.remove('vjs-loading-data');
	      }, 20);
	    }); //数据加载成功，清除定时器

	    player_.on('playing', function (e) {
	      console.log('playing', player_.id_, this_.options_.sources);
	      _this3.isPlaying = true;
	      this_.retryTime = 0;
	      window.clearTimeout(this_.waitingTimer);

	      setTimeout$1(function () {
	        player_.el_.classList.remove('vjs-loading-data');
	      }, 20);
	    });
	    player_.on('ended', function () {
	      if (this_.onEnd && typeof this_.onEnd === 'function') {
	        this_.onEnd.call(this_);
	      }
	    });
	  };
	}

	var FAILS_ON_PRIMITIVES = fails(function () { objectKeys(1); });

	// `Object.keys` method
	// https://tc39.es/ecma262/#sec-object.keys
	_export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES }, {
	  keys: function keys(it) {
	    return objectKeys(toObject(it));
	  }
	});

	var keys = path.Object.keys;

	var keys$1 = keys;

	var keys$2 = keys$1;

	var toString_1 = function (argument) {
	  if (isSymbol(argument)) throw TypeError('Cannot convert a Symbol value to a string');
	  return String(argument);
	};

	// `Object.defineProperties` method
	// https://tc39.es/ecma262/#sec-object.defineproperties
	// eslint-disable-next-line es/no-object-defineproperties -- safe
	var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
	  anObject(O);
	  var keys = objectKeys(Properties);
	  var length = keys.length;
	  var index = 0;
	  var key;
	  while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
	  return O;
	};

	var html = getBuiltIn('document', 'documentElement');

	var keys$3 = shared('keys');

	var sharedKey = function (key) {
	  return keys$3[key] || (keys$3[key] = uid(key));
	};

	/* global ActiveXObject -- old IE, WSH */








	var GT = '>';
	var LT = '<';
	var PROTOTYPE = 'prototype';
	var SCRIPT = 'script';
	var IE_PROTO = sharedKey('IE_PROTO');

	var EmptyConstructor = function () { /* empty */ };

	var scriptTag = function (content) {
	  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
	};

	// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
	var NullProtoObjectViaActiveX = function (activeXDocument) {
	  activeXDocument.write(scriptTag(''));
	  activeXDocument.close();
	  var temp = activeXDocument.parentWindow.Object;
	  activeXDocument = null; // avoid memory leak
	  return temp;
	};

	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var NullProtoObjectViaIFrame = function () {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = documentCreateElement('iframe');
	  var JS = 'java' + SCRIPT + ':';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  html.appendChild(iframe);
	  // https://github.com/zloirock/core-js/issues/475
	  iframe.src = String(JS);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(scriptTag('document.F=Object'));
	  iframeDocument.close();
	  return iframeDocument.F;
	};

	// Check for document.domain and active x support
	// No need to use active x approach when document.domain is not set
	// see https://github.com/es-shims/es5-shim/issues/150
	// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
	// avoid IE GC bug
	var activeXDocument;
	var NullProtoObject = function () {
	  try {
	    activeXDocument = new ActiveXObject('htmlfile');
	  } catch (error) { /* ignore */ }
	  NullProtoObject = typeof document != 'undefined'
	    ? document.domain && activeXDocument
	      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
	      : NullProtoObjectViaIFrame()
	    : NullProtoObjectViaActiveX(activeXDocument); // WSH
	  var length = enumBugKeys.length;
	  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
	  return NullProtoObject();
	};

	hiddenKeys[IE_PROTO] = true;

	// `Object.create` method
	// https://tc39.es/ecma262/#sec-object.create
	var objectCreate = Object.create || function create(O, Properties) {
	  var result;
	  if (O !== null) {
	    EmptyConstructor[PROTOTYPE] = anObject(O);
	    result = new EmptyConstructor();
	    EmptyConstructor[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = NullProtoObject();
	  return Properties === undefined ? result : objectDefineProperties(result, Properties);
	};

	var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

	// `Object.getOwnPropertyNames` method
	// https://tc39.es/ecma262/#sec-object.getownpropertynames
	// eslint-disable-next-line es/no-object-getownpropertynames -- safe
	var f$4 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return objectKeysInternal(O, hiddenKeys$1);
	};

	var objectGetOwnPropertyNames = {
		f: f$4
	};

	/* eslint-disable es/no-object-getownpropertynames -- safe */

	var $getOwnPropertyNames = objectGetOwnPropertyNames.f;

	var toString$1 = {}.toString;

	var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];

	var getWindowNames = function (it) {
	  try {
	    return $getOwnPropertyNames(it);
	  } catch (error) {
	    return windowNames.slice();
	  }
	};

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
	var f$5 = function getOwnPropertyNames(it) {
	  return windowNames && toString$1.call(it) == '[object Window]'
	    ? getWindowNames(it)
	    : $getOwnPropertyNames(toIndexedObject(it));
	};

	var objectGetOwnPropertyNamesExternal = {
		f: f$5
	};

	var redefine = function (target, key, value, options) {
	  if (options && options.enumerable) target[key] = value;
	  else createNonEnumerableProperty(target, key, value);
	};

	var f$6 = wellKnownSymbol;

	var wellKnownSymbolWrapped = {
		f: f$6
	};

	var defineProperty$1 = objectDefineProperty.f;

	var defineWellKnownSymbol = function (NAME) {
	  var Symbol = path.Symbol || (path.Symbol = {});
	  if (!has(Symbol, NAME)) defineProperty$1(Symbol, NAME, {
	    value: wellKnownSymbolWrapped.f(NAME)
	  });
	};

	var TO_STRING_TAG = wellKnownSymbol('toStringTag');
	var test = {};

	test[TO_STRING_TAG] = 'z';

	var toStringTagSupport = String(test) === '[object z]';

	var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
	// ES3 wrong here
	var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

	// fallback for IE11 Script Access Denied error
	var tryGet = function (it, key) {
	  try {
	    return it[key];
	  } catch (error) { /* empty */ }
	};

	// getting tag from ES6+ `Object.prototype.toString`
	var classof = toStringTagSupport ? classofRaw : function (it) {
	  var O, tag, result;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$1)) == 'string' ? tag
	    // builtinTag case
	    : CORRECT_ARGUMENTS ? classofRaw(O)
	    // ES3 arguments fallback
	    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
	};

	// `Object.prototype.toString` method implementation
	// https://tc39.es/ecma262/#sec-object.prototype.tostring
	var objectToString = toStringTagSupport ? {}.toString : function toString() {
	  return '[object ' + classof(this) + ']';
	};

	var defineProperty$2 = objectDefineProperty.f;





	var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');

	var setToStringTag = function (it, TAG, STATIC, SET_METHOD) {
	  if (it) {
	    var target = STATIC ? it : it.prototype;
	    if (!has(target, TO_STRING_TAG$2)) {
	      defineProperty$2(target, TO_STRING_TAG$2, { configurable: true, value: TAG });
	    }
	    if (SET_METHOD && !toStringTagSupport) {
	      createNonEnumerableProperty(target, 'toString', objectToString);
	    }
	  }
	};

	var functionToString = Function.toString;

	// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
	if (typeof sharedStore.inspectSource != 'function') {
	  sharedStore.inspectSource = function (it) {
	    return functionToString.call(it);
	  };
	}

	var inspectSource = sharedStore.inspectSource;

	var WeakMap = global_1.WeakMap;

	var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

	var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
	var WeakMap$1 = global_1.WeakMap;
	var set, get, has$1;

	var enforce = function (it) {
	  return has$1(it) ? get(it) : set(it, {});
	};

	var getterFor = function (TYPE) {
	  return function (it) {
	    var state;
	    if (!isObject(it) || (state = get(it)).type !== TYPE) {
	      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
	    } return state;
	  };
	};

	if (nativeWeakMap || sharedStore.state) {
	  var store$1 = sharedStore.state || (sharedStore.state = new WeakMap$1());
	  var wmget = store$1.get;
	  var wmhas = store$1.has;
	  var wmset = store$1.set;
	  set = function (it, metadata) {
	    if (wmhas.call(store$1, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
	    metadata.facade = it;
	    wmset.call(store$1, it, metadata);
	    return metadata;
	  };
	  get = function (it) {
	    return wmget.call(store$1, it) || {};
	  };
	  has$1 = function (it) {
	    return wmhas.call(store$1, it);
	  };
	} else {
	  var STATE = sharedKey('state');
	  hiddenKeys[STATE] = true;
	  set = function (it, metadata) {
	    if (has(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
	    metadata.facade = it;
	    createNonEnumerableProperty(it, STATE, metadata);
	    return metadata;
	  };
	  get = function (it) {
	    return has(it, STATE) ? it[STATE] : {};
	  };
	  has$1 = function (it) {
	    return has(it, STATE);
	  };
	}

	var internalState = {
	  set: set,
	  get: get,
	  has: has$1,
	  enforce: enforce,
	  getterFor: getterFor
	};

	var push = [].push;

	// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex, filterReject }` methods implementation
	var createMethod$1 = function (TYPE) {
	  var IS_MAP = TYPE == 1;
	  var IS_FILTER = TYPE == 2;
	  var IS_SOME = TYPE == 3;
	  var IS_EVERY = TYPE == 4;
	  var IS_FIND_INDEX = TYPE == 6;
	  var IS_FILTER_REJECT = TYPE == 7;
	  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
	  return function ($this, callbackfn, that, specificCreate) {
	    var O = toObject($this);
	    var self = indexedObject(O);
	    var boundFunction = functionBindContext(callbackfn, that, 3);
	    var length = toLength(self.length);
	    var index = 0;
	    var create = specificCreate || arraySpeciesCreate;
	    var target = IS_MAP ? create($this, length) : IS_FILTER || IS_FILTER_REJECT ? create($this, 0) : undefined;
	    var value, result;
	    for (;length > index; index++) if (NO_HOLES || index in self) {
	      value = self[index];
	      result = boundFunction(value, index, O);
	      if (TYPE) {
	        if (IS_MAP) target[index] = result; // map
	        else if (result) switch (TYPE) {
	          case 3: return true;              // some
	          case 5: return value;             // find
	          case 6: return index;             // findIndex
	          case 2: push.call(target, value); // filter
	        } else switch (TYPE) {
	          case 4: return false;             // every
	          case 7: push.call(target, value); // filterReject
	        }
	      }
	    }
	    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
	  };
	};

	var arrayIteration = {
	  // `Array.prototype.forEach` method
	  // https://tc39.es/ecma262/#sec-array.prototype.foreach
	  forEach: createMethod$1(0),
	  // `Array.prototype.map` method
	  // https://tc39.es/ecma262/#sec-array.prototype.map
	  map: createMethod$1(1),
	  // `Array.prototype.filter` method
	  // https://tc39.es/ecma262/#sec-array.prototype.filter
	  filter: createMethod$1(2),
	  // `Array.prototype.some` method
	  // https://tc39.es/ecma262/#sec-array.prototype.some
	  some: createMethod$1(3),
	  // `Array.prototype.every` method
	  // https://tc39.es/ecma262/#sec-array.prototype.every
	  every: createMethod$1(4),
	  // `Array.prototype.find` method
	  // https://tc39.es/ecma262/#sec-array.prototype.find
	  find: createMethod$1(5),
	  // `Array.prototype.findIndex` method
	  // https://tc39.es/ecma262/#sec-array.prototype.findIndex
	  findIndex: createMethod$1(6),
	  // `Array.prototype.filterReject` method
	  // https://github.com/tc39/proposal-array-filtering
	  filterReject: createMethod$1(7)
	};

	var $forEach = arrayIteration.forEach;

	var HIDDEN = sharedKey('hidden');
	var SYMBOL = 'Symbol';
	var PROTOTYPE$1 = 'prototype';
	var TO_PRIMITIVE$1 = wellKnownSymbol('toPrimitive');
	var setInternalState = internalState.set;
	var getInternalState = internalState.getterFor(SYMBOL);
	var ObjectPrototype = Object[PROTOTYPE$1];
	var $Symbol = global_1.Symbol;
	var $stringify = getBuiltIn('JSON', 'stringify');
	var nativeGetOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
	var nativeDefineProperty = objectDefineProperty.f;
	var nativeGetOwnPropertyNames = objectGetOwnPropertyNamesExternal.f;
	var nativePropertyIsEnumerable = objectPropertyIsEnumerable.f;
	var AllSymbols = shared('symbols');
	var ObjectPrototypeSymbols = shared('op-symbols');
	var StringToSymbolRegistry = shared('string-to-symbol-registry');
	var SymbolToStringRegistry = shared('symbol-to-string-registry');
	var WellKnownSymbolsStore$1 = shared('wks');
	var QObject = global_1.QObject;
	// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
	var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild;

	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDescriptor = descriptors && fails(function () {
	  return objectCreate(nativeDefineProperty({}, 'a', {
	    get: function () { return nativeDefineProperty(this, 'a', { value: 7 }).a; }
	  })).a != 7;
	}) ? function (O, P, Attributes) {
	  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor(ObjectPrototype, P);
	  if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
	  nativeDefineProperty(O, P, Attributes);
	  if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
	    nativeDefineProperty(ObjectPrototype, P, ObjectPrototypeDescriptor);
	  }
	} : nativeDefineProperty;

	var wrap$1 = function (tag, description) {
	  var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
	  setInternalState(symbol, {
	    type: SYMBOL,
	    tag: tag,
	    description: description
	  });
	  if (!descriptors) symbol.description = description;
	  return symbol;
	};

	var $defineProperty$1 = function defineProperty(O, P, Attributes) {
	  if (O === ObjectPrototype) $defineProperty$1(ObjectPrototypeSymbols, P, Attributes);
	  anObject(O);
	  var key = toPropertyKey(P);
	  anObject(Attributes);
	  if (has(AllSymbols, key)) {
	    if (!Attributes.enumerable) {
	      if (!has(O, HIDDEN)) nativeDefineProperty(O, HIDDEN, createPropertyDescriptor(1, {}));
	      O[HIDDEN][key] = true;
	    } else {
	      if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
	      Attributes = objectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
	    } return setSymbolDescriptor(O, key, Attributes);
	  } return nativeDefineProperty(O, key, Attributes);
	};

	var $defineProperties = function defineProperties(O, Properties) {
	  anObject(O);
	  var properties = toIndexedObject(Properties);
	  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
	  $forEach(keys, function (key) {
	    if (!descriptors || $propertyIsEnumerable$1.call(properties, key)) $defineProperty$1(O, key, properties[key]);
	  });
	  return O;
	};

	var $create = function create(O, Properties) {
	  return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
	};

	var $propertyIsEnumerable$1 = function propertyIsEnumerable(V) {
	  var P = toPropertyKey(V);
	  var enumerable = nativePropertyIsEnumerable.call(this, P);
	  if (this === ObjectPrototype && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
	  return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
	};

	var $getOwnPropertyDescriptor$1 = function getOwnPropertyDescriptor(O, P) {
	  var it = toIndexedObject(O);
	  var key = toPropertyKey(P);
	  if (it === ObjectPrototype && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
	  var descriptor = nativeGetOwnPropertyDescriptor(it, key);
	  if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
	    descriptor.enumerable = true;
	  }
	  return descriptor;
	};

	var $getOwnPropertyNames$1 = function getOwnPropertyNames(O) {
	  var names = nativeGetOwnPropertyNames(toIndexedObject(O));
	  var result = [];
	  $forEach(names, function (key) {
	    if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
	  });
	  return result;
	};

	var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
	  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
	  var names = nativeGetOwnPropertyNames(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
	  var result = [];
	  $forEach(names, function (key) {
	    if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))) {
	      result.push(AllSymbols[key]);
	    }
	  });
	  return result;
	};

	// `Symbol` constructor
	// https://tc39.es/ecma262/#sec-symbol-constructor
	if (!nativeSymbol) {
	  $Symbol = function Symbol() {
	    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
	    var description = !arguments.length || arguments[0] === undefined ? undefined : toString_1(arguments[0]);
	    var tag = uid(description);
	    var setter = function (value) {
	      if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
	      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
	      setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
	    };
	    if (descriptors && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
	    return wrap$1(tag, description);
	  };

	  redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
	    return getInternalState(this).tag;
	  });

	  redefine($Symbol, 'withoutSetter', function (description) {
	    return wrap$1(uid(description), description);
	  });

	  objectPropertyIsEnumerable.f = $propertyIsEnumerable$1;
	  objectDefineProperty.f = $defineProperty$1;
	  objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor$1;
	  objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames$1;
	  objectGetOwnPropertySymbols.f = $getOwnPropertySymbols;

	  wellKnownSymbolWrapped.f = function (name) {
	    return wrap$1(wellKnownSymbol(name), name);
	  };

	  if (descriptors) {
	    // https://github.com/tc39/proposal-Symbol-description
	    nativeDefineProperty($Symbol[PROTOTYPE$1], 'description', {
	      configurable: true,
	      get: function description() {
	        return getInternalState(this).description;
	      }
	    });
	  }
	}

	_export({ global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol }, {
	  Symbol: $Symbol
	});

	$forEach(objectKeys(WellKnownSymbolsStore$1), function (name) {
	  defineWellKnownSymbol(name);
	});

	_export({ target: SYMBOL, stat: true, forced: !nativeSymbol }, {
	  // `Symbol.for` method
	  // https://tc39.es/ecma262/#sec-symbol.for
	  'for': function (key) {
	    var string = toString_1(key);
	    if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
	    var symbol = $Symbol(string);
	    StringToSymbolRegistry[string] = symbol;
	    SymbolToStringRegistry[symbol] = string;
	    return symbol;
	  },
	  // `Symbol.keyFor` method
	  // https://tc39.es/ecma262/#sec-symbol.keyfor
	  keyFor: function keyFor(sym) {
	    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
	    if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
	  },
	  useSetter: function () { USE_SETTER = true; },
	  useSimple: function () { USE_SETTER = false; }
	});

	_export({ target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors }, {
	  // `Object.create` method
	  // https://tc39.es/ecma262/#sec-object.create
	  create: $create,
	  // `Object.defineProperty` method
	  // https://tc39.es/ecma262/#sec-object.defineproperty
	  defineProperty: $defineProperty$1,
	  // `Object.defineProperties` method
	  // https://tc39.es/ecma262/#sec-object.defineproperties
	  defineProperties: $defineProperties,
	  // `Object.getOwnPropertyDescriptor` method
	  // https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor$1
	});

	_export({ target: 'Object', stat: true, forced: !nativeSymbol }, {
	  // `Object.getOwnPropertyNames` method
	  // https://tc39.es/ecma262/#sec-object.getownpropertynames
	  getOwnPropertyNames: $getOwnPropertyNames$1,
	  // `Object.getOwnPropertySymbols` method
	  // https://tc39.es/ecma262/#sec-object.getownpropertysymbols
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});

	// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
	// https://bugs.chromium.org/p/v8/issues/detail?id=3443
	_export({ target: 'Object', stat: true, forced: fails(function () { objectGetOwnPropertySymbols.f(1); }) }, {
	  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
	    return objectGetOwnPropertySymbols.f(toObject(it));
	  }
	});

	// `JSON.stringify` method behavior with symbols
	// https://tc39.es/ecma262/#sec-json.stringify
	if ($stringify) {
	  var FORCED_JSON_STRINGIFY = !nativeSymbol || fails(function () {
	    var symbol = $Symbol();
	    // MS Edge converts symbol values to JSON as {}
	    return $stringify([symbol]) != '[null]'
	      // WebKit converts symbol values to JSON as null
	      || $stringify({ a: symbol }) != '{}'
	      // V8 throws on boxed symbols
	      || $stringify(Object(symbol)) != '{}';
	  });

	  _export({ target: 'JSON', stat: true, forced: FORCED_JSON_STRINGIFY }, {
	    // eslint-disable-next-line no-unused-vars -- required for `.length`
	    stringify: function stringify(it, replacer, space) {
	      var args = [it];
	      var index = 1;
	      var $replacer;
	      while (arguments.length > index) args.push(arguments[index++]);
	      $replacer = replacer;
	      if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
	      if (!isArray(replacer)) replacer = function (key, value) {
	        if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
	        if (!isSymbol(value)) return value;
	      };
	      args[1] = replacer;
	      return $stringify.apply(null, args);
	    }
	  });
	}

	// `Symbol.prototype[@@toPrimitive]` method
	// https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
	if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE$1]) {
	  createNonEnumerableProperty($Symbol[PROTOTYPE$1], TO_PRIMITIVE$1, $Symbol[PROTOTYPE$1].valueOf);
	}
	// `Symbol.prototype[@@toStringTag]` property
	// https://tc39.es/ecma262/#sec-symbol.prototype-@@tostringtag
	setToStringTag($Symbol, SYMBOL);

	hiddenKeys[HIDDEN] = true;

	var getOwnPropertySymbols = path.Object.getOwnPropertySymbols;

	var getOwnPropertySymbols$1 = getOwnPropertySymbols;

	var getOwnPropertySymbols$2 = getOwnPropertySymbols$1;

	var $filter = arrayIteration.filter;


	var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('filter');

	// `Array.prototype.filter` method
	// https://tc39.es/ecma262/#sec-array.prototype.filter
	// with adding support of @@species
	_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 }, {
	  filter: function filter(callbackfn /* , thisArg */) {
	    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});

	var filter = entryVirtual('Array').filter;

	var ArrayPrototype$3 = Array.prototype;

	var filter_1 = function (it) {
	  var own = it.filter;
	  return it === ArrayPrototype$3 || (it instanceof Array && own === ArrayPrototype$3.filter) ? filter : own;
	};

	var filter$1 = filter_1;

	var filter$2 = filter$1;

	var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;


	var FAILS_ON_PRIMITIVES$1 = fails(function () { nativeGetOwnPropertyDescriptor$1(1); });
	var FORCED$1 = !descriptors || FAILS_ON_PRIMITIVES$1;

	// `Object.getOwnPropertyDescriptor` method
	// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
	_export({ target: 'Object', stat: true, forced: FORCED$1, sham: !descriptors }, {
	  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
	    return nativeGetOwnPropertyDescriptor$1(toIndexedObject(it), key);
	  }
	});

	var getOwnPropertyDescriptor_1 = createCommonjsModule(function (module) {
	var Object = path.Object;

	var getOwnPropertyDescriptor = module.exports = function getOwnPropertyDescriptor(it, key) {
	  return Object.getOwnPropertyDescriptor(it, key);
	};

	if (Object.getOwnPropertyDescriptor.sham) getOwnPropertyDescriptor.sham = true;
	});

	var getOwnPropertyDescriptor$2 = getOwnPropertyDescriptor_1;

	var getOwnPropertyDescriptor$3 = getOwnPropertyDescriptor$2;

	var iterators = {};

	var correctPrototypeGetter = !fails(function () {
	  function F() { /* empty */ }
	  F.prototype.constructor = null;
	  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
	  return Object.getPrototypeOf(new F()) !== F.prototype;
	});

	var IE_PROTO$1 = sharedKey('IE_PROTO');
	var ObjectPrototype$1 = Object.prototype;

	// `Object.getPrototypeOf` method
	// https://tc39.es/ecma262/#sec-object.getprototypeof
	// eslint-disable-next-line es/no-object-getprototypeof -- safe
	var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
	  O = toObject(O);
	  if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];
	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectPrototype$1 : null;
	};

	var ITERATOR = wellKnownSymbol('iterator');
	var BUGGY_SAFARI_ITERATORS = false;

	var returnThis = function () { return this; };

	// `%IteratorPrototype%` object
	// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
	var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

	/* eslint-disable es/no-array-prototype-keys -- safe */
	if ([].keys) {
	  arrayIterator = [].keys();
	  // Safari 8 has buggy iterators w/o `next`
	  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
	  else {
	    PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
	    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
	  }
	}

	var NEW_ITERATOR_PROTOTYPE = IteratorPrototype == undefined || fails(function () {
	  var test = {};
	  // FF44- legacy iterators case
	  return IteratorPrototype[ITERATOR].call(test) !== test;
	});

	if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};

	// `%IteratorPrototype%[@@iterator]()` method
	// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
	if (( NEW_ITERATOR_PROTOTYPE) && !has(IteratorPrototype, ITERATOR)) {
	  createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis);
	}

	var iteratorsCore = {
	  IteratorPrototype: IteratorPrototype,
	  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
	};

	var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;





	var returnThis$1 = function () { return this; };

	var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
	  var TO_STRING_TAG = NAME + ' Iterator';
	  IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
	  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
	  iterators[TO_STRING_TAG] = returnThis$1;
	  return IteratorConstructor;
	};

	var aPossiblePrototype = function (it) {
	  if (!isObject(it) && it !== null) {
	    throw TypeError("Can't set " + String(it) + ' as a prototype');
	  } return it;
	};

	/* eslint-disable no-proto -- safe */



	// `Object.setPrototypeOf` method
	// https://tc39.es/ecma262/#sec-object.setprototypeof
	// Works with __proto__ only. Old v8 can't work with null proto objects.
	// eslint-disable-next-line es/no-object-setprototypeof -- safe
	var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
	  var CORRECT_SETTER = false;
	  var test = {};
	  var setter;
	  try {
	    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
	    setter.call(test, []);
	    CORRECT_SETTER = test instanceof Array;
	  } catch (error) { /* empty */ }
	  return function setPrototypeOf(O, proto) {
	    anObject(O);
	    aPossiblePrototype(proto);
	    if (CORRECT_SETTER) setter.call(O, proto);
	    else O.__proto__ = proto;
	    return O;
	  };
	}() : undefined);

	var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
	var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
	var ITERATOR$1 = wellKnownSymbol('iterator');
	var KEYS = 'keys';
	var VALUES = 'values';
	var ENTRIES = 'entries';

	var returnThis$2 = function () { return this; };

	var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
	  createIteratorConstructor(IteratorConstructor, NAME, next);

	  var getIterationMethod = function (KIND) {
	    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
	    if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
	    switch (KIND) {
	      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
	      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
	      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
	    } return function () { return new IteratorConstructor(this); };
	  };

	  var TO_STRING_TAG = NAME + ' Iterator';
	  var INCORRECT_VALUES_NAME = false;
	  var IterablePrototype = Iterable.prototype;
	  var nativeIterator = IterablePrototype[ITERATOR$1]
	    || IterablePrototype['@@iterator']
	    || DEFAULT && IterablePrototype[DEFAULT];
	  var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
	  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
	  var CurrentIteratorPrototype, methods, KEY;

	  // fix native
	  if (anyNativeIterator) {
	    CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
	    if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
	      // Set @@toStringTag to native iterators
	      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
	      iterators[TO_STRING_TAG] = returnThis$2;
	    }
	  }

	  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
	  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
	    INCORRECT_VALUES_NAME = true;
	    defaultIterator = function values() { return nativeIterator.call(this); };
	  }

	  // define iterator
	  if (( FORCED) && IterablePrototype[ITERATOR$1] !== defaultIterator) {
	    createNonEnumerableProperty(IterablePrototype, ITERATOR$1, defaultIterator);
	  }
	  iterators[NAME] = defaultIterator;

	  // export additional methods
	  if (DEFAULT) {
	    methods = {
	      values: getIterationMethod(VALUES),
	      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
	      entries: getIterationMethod(ENTRIES)
	    };
	    if (FORCED) for (KEY in methods) {
	      if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
	        redefine(IterablePrototype, KEY, methods[KEY]);
	      }
	    } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
	  }

	  return methods;
	};

	var ARRAY_ITERATOR = 'Array Iterator';
	var setInternalState$1 = internalState.set;
	var getInternalState$1 = internalState.getterFor(ARRAY_ITERATOR);

	// `Array.prototype.entries` method
	// https://tc39.es/ecma262/#sec-array.prototype.entries
	// `Array.prototype.keys` method
	// https://tc39.es/ecma262/#sec-array.prototype.keys
	// `Array.prototype.values` method
	// https://tc39.es/ecma262/#sec-array.prototype.values
	// `Array.prototype[@@iterator]` method
	// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
	// `CreateArrayIterator` internal method
	// https://tc39.es/ecma262/#sec-createarrayiterator
	var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
	  setInternalState$1(this, {
	    type: ARRAY_ITERATOR,
	    target: toIndexedObject(iterated), // target
	    index: 0,                          // next index
	    kind: kind                         // kind
	  });
	// `%ArrayIteratorPrototype%.next` method
	// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
	}, function () {
	  var state = getInternalState$1(this);
	  var target = state.target;
	  var kind = state.kind;
	  var index = state.index++;
	  if (!target || index >= target.length) {
	    state.target = undefined;
	    return { value: undefined, done: true };
	  }
	  if (kind == 'keys') return { value: index, done: false };
	  if (kind == 'values') return { value: target[index], done: false };
	  return { value: [index, target[index]], done: false };
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values%
	// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
	// https://tc39.es/ecma262/#sec-createmappedargumentsobject
	iterators.Arguments = iterators.Array;

	// iterable DOM collections
	// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
	var domIterables = {
	  CSSRuleList: 0,
	  CSSStyleDeclaration: 0,
	  CSSValueList: 0,
	  ClientRectList: 0,
	  DOMRectList: 0,
	  DOMStringList: 0,
	  DOMTokenList: 1,
	  DataTransferItemList: 0,
	  FileList: 0,
	  HTMLAllCollection: 0,
	  HTMLCollection: 0,
	  HTMLFormElement: 0,
	  HTMLSelectElement: 0,
	  MediaList: 0,
	  MimeTypeArray: 0,
	  NamedNodeMap: 0,
	  NodeList: 1,
	  PaintRequestList: 0,
	  Plugin: 0,
	  PluginArray: 0,
	  SVGLengthList: 0,
	  SVGNumberList: 0,
	  SVGPathSegList: 0,
	  SVGPointList: 0,
	  SVGStringList: 0,
	  SVGTransformList: 0,
	  SourceBufferList: 0,
	  StyleSheetList: 0,
	  TextTrackCueList: 0,
	  TextTrackList: 0,
	  TouchList: 0
	};

	var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');

	for (var COLLECTION_NAME in domIterables) {
	  var Collection = global_1[COLLECTION_NAME];
	  var CollectionPrototype = Collection && Collection.prototype;
	  if (CollectionPrototype && classof(CollectionPrototype) !== TO_STRING_TAG$3) {
	    createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG$3, COLLECTION_NAME);
	  }
	  iterators[COLLECTION_NAME] = iterators.Array;
	}

	var $forEach$1 = arrayIteration.forEach;


	var STRICT_METHOD$1 = arrayMethodIsStrict('forEach');

	// `Array.prototype.forEach` method implementation
	// https://tc39.es/ecma262/#sec-array.prototype.foreach
	var arrayForEach = !STRICT_METHOD$1 ? function forEach(callbackfn /* , thisArg */) {
	  return $forEach$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	// eslint-disable-next-line es/no-array-prototype-foreach -- safe
	} : [].forEach;

	// `Array.prototype.forEach` method
	// https://tc39.es/ecma262/#sec-array.prototype.foreach
	// eslint-disable-next-line es/no-array-prototype-foreach -- safe
	_export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
	  forEach: arrayForEach
	});

	var forEach = entryVirtual('Array').forEach;

	var forEach$1 = forEach;

	var ArrayPrototype$4 = Array.prototype;

	var DOMIterables = {
	  DOMTokenList: true,
	  NodeList: true
	};

	var forEach_1 = function (it) {
	  var own = it.forEach;
	  return it === ArrayPrototype$4 || (it instanceof Array && own === ArrayPrototype$4.forEach)
	    // eslint-disable-next-line no-prototype-builtins -- safe
	    || DOMIterables.hasOwnProperty(classof(it)) ? forEach$1 : own;
	};

	var forEach$2 = forEach_1;

	// all object keys, includes non-enumerable and symbols
	var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
	  var keys = objectGetOwnPropertyNames.f(anObject(it));
	  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
	  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
	};

	// `Object.getOwnPropertyDescriptors` method
	// https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
	_export({ target: 'Object', stat: true, sham: !descriptors }, {
	  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
	    var O = toIndexedObject(object);
	    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
	    var keys = ownKeys(O);
	    var result = {};
	    var index = 0;
	    var key, descriptor;
	    while (keys.length > index) {
	      descriptor = getOwnPropertyDescriptor(O, key = keys[index++]);
	      if (descriptor !== undefined) createProperty(result, key, descriptor);
	    }
	    return result;
	  }
	});

	var getOwnPropertyDescriptors = path.Object.getOwnPropertyDescriptors;

	var getOwnPropertyDescriptors$1 = getOwnPropertyDescriptors;

	var getOwnPropertyDescriptors$2 = getOwnPropertyDescriptors$1;

	// `Object.defineProperties` method
	// https://tc39.es/ecma262/#sec-object.defineproperties
	_export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
	  defineProperties: objectDefineProperties
	});

	var defineProperties_1 = createCommonjsModule(function (module) {
	var Object = path.Object;

	var defineProperties = module.exports = function defineProperties(T, D) {
	  return Object.defineProperties(T, D);
	};

	if (Object.defineProperties.sham) defineProperties.sham = true;
	});

	var defineProperties = defineProperties_1;

	var defineProperties$1 = defineProperties;

	// `Object.defineProperty` method
	// https://tc39.es/ecma262/#sec-object.defineproperty
	_export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
	  defineProperty: objectDefineProperty.f
	});

	var defineProperty_1 = createCommonjsModule(function (module) {
	var Object = path.Object;

	var defineProperty = module.exports = function defineProperty(it, key, desc) {
	  return Object.defineProperty(it, key, desc);
	};

	if (Object.defineProperty.sham) defineProperty.sham = true;
	});

	var defineProperty$3 = defineProperty_1;

	var defineProperty$4 = defineProperty$3;

	var defineProperty$5 = defineProperty$3;

	var defineProperty$6 = defineProperty$5;

	var defineProperty$7 = createCommonjsModule(function (module) {
	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    defineProperty$6(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	module.exports = _defineProperty;
	module.exports["default"] = module.exports, module.exports.__esModule = true;
	});

	var _defineProperty = unwrapExports(defineProperty$7);

	var $stringify$1 = getBuiltIn('JSON', 'stringify');
	var re = /[\uD800-\uDFFF]/g;
	var low = /^[\uD800-\uDBFF]$/;
	var hi = /^[\uDC00-\uDFFF]$/;

	var fix = function (match, offset, string) {
	  var prev = string.charAt(offset - 1);
	  var next = string.charAt(offset + 1);
	  if ((low.test(match) && !hi.test(next)) || (hi.test(match) && !low.test(prev))) {
	    return '\\u' + match.charCodeAt(0).toString(16);
	  } return match;
	};

	var FORCED$2 = fails(function () {
	  return $stringify$1('\uDF06\uD834') !== '"\\udf06\\ud834"'
	    || $stringify$1('\uDEAD') !== '"\\udead"';
	});

	if ($stringify$1) {
	  // `JSON.stringify` method
	  // https://tc39.es/ecma262/#sec-json.stringify
	  // https://github.com/tc39/proposal-well-formed-stringify
	  _export({ target: 'JSON', stat: true, forced: FORCED$2 }, {
	    // eslint-disable-next-line no-unused-vars -- required for `.length`
	    stringify: function stringify(it, replacer, space) {
	      var result = $stringify$1.apply(null, arguments);
	      return typeof result == 'string' ? result.replace(re, fix) : result;
	    }
	  });
	}

	// eslint-disable-next-line es/no-json -- safe
	if (!path.JSON) path.JSON = { stringify: JSON.stringify };

	// eslint-disable-next-line no-unused-vars -- required for `.length`
	var stringify = function stringify(it, replacer, space) {
	  return path.JSON.stringify.apply(null, arguments);
	};

	var stringify$1 = stringify;

	var stringify$2 = stringify$1;

	// a string of all valid unicode whitespaces
	var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002' +
	  '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

	var whitespace = '[' + whitespaces + ']';
	var ltrim = RegExp('^' + whitespace + whitespace + '*');
	var rtrim = RegExp(whitespace + whitespace + '*$');

	// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
	var createMethod$2 = function (TYPE) {
	  return function ($this) {
	    var string = toString_1(requireObjectCoercible($this));
	    if (TYPE & 1) string = string.replace(ltrim, '');
	    if (TYPE & 2) string = string.replace(rtrim, '');
	    return string;
	  };
	};

	var stringTrim = {
	  // `String.prototype.{ trimLeft, trimStart }` methods
	  // https://tc39.es/ecma262/#sec-string.prototype.trimstart
	  start: createMethod$2(1),
	  // `String.prototype.{ trimRight, trimEnd }` methods
	  // https://tc39.es/ecma262/#sec-string.prototype.trimend
	  end: createMethod$2(2),
	  // `String.prototype.trim` method
	  // https://tc39.es/ecma262/#sec-string.prototype.trim
	  trim: createMethod$2(3)
	};

	var non = '\u200B\u0085\u180E';

	// check that a method works with the correct list
	// of whitespaces and has a correct name
	var stringTrimForced = function (METHOD_NAME) {
	  return fails(function () {
	    return !!whitespaces[METHOD_NAME]() || non[METHOD_NAME]() != non || whitespaces[METHOD_NAME].name !== METHOD_NAME;
	  });
	};

	var $trim = stringTrim.trim;


	// `String.prototype.trim` method
	// https://tc39.es/ecma262/#sec-string.prototype.trim
	_export({ target: 'String', proto: true, forced: stringTrimForced('trim') }, {
	  trim: function trim() {
	    return $trim(this);
	  }
	});

	var trim = entryVirtual('String').trim;

	var getOwnPropertyNames = objectGetOwnPropertyNamesExternal.f;

	// eslint-disable-next-line es/no-object-getownpropertynames -- required for testing
	var FAILS_ON_PRIMITIVES$2 = fails(function () { return !Object.getOwnPropertyNames(1); });

	// `Object.getOwnPropertyNames` method
	// https://tc39.es/ecma262/#sec-object.getownpropertynames
	_export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$2 }, {
	  getOwnPropertyNames: getOwnPropertyNames
	});

	var trim$1 = stringTrim.trim;


	var $parseFloat = global_1.parseFloat;
	var FORCED$3 = 1 / $parseFloat(whitespaces + '-0') !== -Infinity;

	// `parseFloat` method
	// https://tc39.es/ecma262/#sec-parsefloat-string
	var numberParseFloat = FORCED$3 ? function parseFloat(string) {
	  var trimmedString = trim$1(toString_1(string));
	  var result = $parseFloat(trimmedString);
	  return result === 0 && trimmedString.charAt(0) == '-' ? -0 : result;
	} : $parseFloat;

	// `parseFloat` method
	// https://tc39.es/ecma262/#sec-parsefloat-string
	_export({ global: true, forced: parseFloat != numberParseFloat }, {
	  parseFloat: numberParseFloat
	});

	var _parseFloat = path.parseFloat;

	var _parseFloat$1 = _parseFloat;

	var _parseFloat$2 = _parseFloat$1;

	var $map = arrayIteration.map;


	var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('map');

	// `Array.prototype.map` method
	// https://tc39.es/ecma262/#sec-array.prototype.map
	// with adding support of @@species
	_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$2 }, {
	  map: function map(callbackfn /* , thisArg */) {
	    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});

	var map = entryVirtual('Array').map;

	// `Array.isArray` method
	// https://tc39.es/ecma262/#sec-array.isarray
	_export({ target: 'Array', stat: true }, {
	  isArray: isArray
	});

	var isArray$1 = path.Array.isArray;

	var isArray$2 = isArray$1;

	var isArray$3 = isArray$2;

	var slice$1 = Array.prototype.slice;

	var domWalk = iterativelyWalk;

	function iterativelyWalk(nodes, cb) {
	    if (!('length' in nodes)) {
	        nodes = [nodes];
	    }
	    
	    nodes = slice$1.call(nodes);

	    while(nodes.length) {
	        var node = nodes.shift(),
	            ret = cb(node);

	        if (ret) {
	            return ret
	        }

	        if (node.childNodes && node.childNodes.length) {
	            nodes = slice$1.call(node.childNodes).concat(nodes);
	        }
	    }
	}

	var domComment = Comment;

	function Comment(data, owner) {
	    if (!(this instanceof Comment)) {
	        return new Comment(data, owner)
	    }

	    this.data = data;
	    this.nodeValue = data;
	    this.length = data.length;
	    this.ownerDocument = owner || null;
	}

	Comment.prototype.nodeType = 8;
	Comment.prototype.nodeName = "#comment";

	Comment.prototype.toString = function _Comment_toString() {
	    return "[object Comment]"
	};

	var domText = DOMText;

	function DOMText(value, owner) {
	    if (!(this instanceof DOMText)) {
	        return new DOMText(value)
	    }

	    this.data = value || "";
	    this.length = this.data.length;
	    this.ownerDocument = owner || null;
	}

	DOMText.prototype.type = "DOMTextNode";
	DOMText.prototype.nodeType = 3;
	DOMText.prototype.nodeName = "#text";

	DOMText.prototype.toString = function _Text_toString() {
	    return this.data
	};

	DOMText.prototype.replaceData = function replaceData(index, length, value) {
	    var current = this.data;
	    var left = current.substring(0, index);
	    var right = current.substring(index + length, current.length);
	    this.data = left + value + right;
	    this.length = this.data.length;
	};

	var dispatchEvent_1 = dispatchEvent;

	function dispatchEvent(ev) {
	    var elem = this;
	    var type = ev.type;

	    if (!ev.target) {
	        ev.target = elem;
	    }

	    if (!elem.listeners) {
	        elem.listeners = {};
	    }

	    var listeners = elem.listeners[type];

	    if (listeners) {
	        return listeners.forEach(function (listener) {
	            ev.currentTarget = elem;
	            if (typeof listener === 'function') {
	                listener(ev);
	            } else {
	                listener.handleEvent(ev);
	            }
	        })
	    }

	    if (elem.parentNode) {
	        elem.parentNode.dispatchEvent(ev);
	    }
	}

	var addEventListener_1 = addEventListener;

	function addEventListener(type, listener) {
	    var elem = this;

	    if (!elem.listeners) {
	        elem.listeners = {};
	    }

	    if (!elem.listeners[type]) {
	        elem.listeners[type] = [];
	    }

	    if (elem.listeners[type].indexOf(listener) === -1) {
	        elem.listeners[type].push(listener);
	    }
	}

	var removeEventListener_1 = removeEventListener;

	function removeEventListener(type, listener) {
	    var elem = this;

	    if (!elem.listeners) {
	        return
	    }

	    if (!elem.listeners[type]) {
	        return
	    }

	    var list = elem.listeners[type];
	    var index = list.indexOf(listener);
	    if (index !== -1) {
	        list.splice(index, 1);
	    }
	}

	var serialize = serializeNode;

	var voidElements = ["area","base","br","col","embed","hr","img","input","keygen","link","menuitem","meta","param","source","track","wbr"];

	function serializeNode(node) {
	    switch (node.nodeType) {
	        case 3:
	            return escapeText(node.data)
	        case 8:
	            return "<!--" + node.data + "-->"
	        default:
	            return serializeElement(node)
	    }
	}

	function serializeElement(elem) {
	    var strings = [];

	    var tagname = elem.tagName;

	    if (elem.namespaceURI === "http://www.w3.org/1999/xhtml") {
	        tagname = tagname.toLowerCase();
	    }

	    strings.push("<" + tagname + properties(elem) + datasetify(elem));

	    if (voidElements.indexOf(tagname) > -1) {
	        strings.push(" />");
	    } else {
	        strings.push(">");

	        if (elem.childNodes.length) {
	            strings.push.apply(strings, elem.childNodes.map(serializeNode));
	        } else if (elem.textContent || elem.innerText) {
	            strings.push(escapeText(elem.textContent || elem.innerText));
	        } else if (elem.innerHTML) {
	            strings.push(elem.innerHTML);
	        }

	        strings.push("</" + tagname + ">");
	    }

	    return strings.join("")
	}

	function isProperty(elem, key) {
	    var type = typeof elem[key];

	    if (key === "style" && Object.keys(elem.style).length > 0) {
	      return true
	    }

	    return elem.hasOwnProperty(key) &&
	        (type === "string" || type === "boolean" || type === "number") &&
	        key !== "nodeName" && key !== "className" && key !== "tagName" &&
	        key !== "textContent" && key !== "innerText" && key !== "namespaceURI" &&  key !== "innerHTML"
	}

	function stylify(styles) {
	    if (typeof styles === 'string') return styles
	    var attr = "";
	    Object.keys(styles).forEach(function (key) {
	        var value = styles[key];
	        key = key.replace(/[A-Z]/g, function(c) {
	            return "-" + c.toLowerCase();
	        });
	        attr += key + ":" + value + ";";
	    });
	    return attr
	}

	function datasetify(elem) {
	    var ds = elem.dataset;
	    var props = [];

	    for (var key in ds) {
	        props.push({ name: "data-" + key, value: ds[key] });
	    }

	    return props.length ? stringify$3(props) : ""
	}

	function stringify$3(list) {
	    var attributes = [];
	    list.forEach(function (tuple) {
	        var name = tuple.name;
	        var value = tuple.value;

	        if (name === "style") {
	            value = stylify(value);
	        }

	        attributes.push(name + "=" + "\"" + escapeAttributeValue(value) + "\"");
	    });

	    return attributes.length ? " " + attributes.join(" ") : ""
	}

	function properties(elem) {
	    var props = [];
	    for (var key in elem) {
	        if (isProperty(elem, key)) {
	            props.push({ name: key, value: elem[key] });
	        }
	    }

	    for (var ns in elem._attributes) {
	      for (var attribute in elem._attributes[ns]) {
	        var prop = elem._attributes[ns][attribute];
	        var name = (prop.prefix ? prop.prefix + ":" : "") + attribute;
	        props.push({ name: name, value: prop.value });
	      }
	    }

	    if (elem.className) {
	        props.push({ name: "class", value: elem.className });
	    }

	    return props.length ? stringify$3(props) : ""
	}

	function escapeText(s) {
	    var str = '';

	    if (typeof(s) === 'string') { 
	        str = s; 
	    } else if (s) {
	        str = s.toString();
	    }

	    return str
	        .replace(/&/g, "&amp;")
	        .replace(/</g, "&lt;")
	        .replace(/>/g, "&gt;")
	}

	function escapeAttributeValue(str) {
	    return escapeText(str).replace(/"/g, "&quot;")
	}

	var htmlns = "http://www.w3.org/1999/xhtml";

	var domElement = DOMElement;

	function DOMElement(tagName, owner, namespace) {
	    if (!(this instanceof DOMElement)) {
	        return new DOMElement(tagName)
	    }

	    var ns = namespace === undefined ? htmlns : (namespace || null);

	    this.tagName = ns === htmlns ? String(tagName).toUpperCase() : tagName;
	    this.nodeName = this.tagName;
	    this.className = "";
	    this.dataset = {};
	    this.childNodes = [];
	    this.parentNode = null;
	    this.style = {};
	    this.ownerDocument = owner || null;
	    this.namespaceURI = ns;
	    this._attributes = {};

	    if (this.tagName === 'INPUT') {
	      this.type = 'text';
	    }
	}

	DOMElement.prototype.type = "DOMElement";
	DOMElement.prototype.nodeType = 1;

	DOMElement.prototype.appendChild = function _Element_appendChild(child) {
	    if (child.parentNode) {
	        child.parentNode.removeChild(child);
	    }

	    this.childNodes.push(child);
	    child.parentNode = this;

	    return child
	};

	DOMElement.prototype.replaceChild =
	    function _Element_replaceChild(elem, needle) {
	        // TODO: Throw NotFoundError if needle.parentNode !== this

	        if (elem.parentNode) {
	            elem.parentNode.removeChild(elem);
	        }

	        var index = this.childNodes.indexOf(needle);

	        needle.parentNode = null;
	        this.childNodes[index] = elem;
	        elem.parentNode = this;

	        return needle
	    };

	DOMElement.prototype.removeChild = function _Element_removeChild(elem) {
	    // TODO: Throw NotFoundError if elem.parentNode !== this

	    var index = this.childNodes.indexOf(elem);
	    this.childNodes.splice(index, 1);

	    elem.parentNode = null;
	    return elem
	};

	DOMElement.prototype.insertBefore =
	    function _Element_insertBefore(elem, needle) {
	        // TODO: Throw NotFoundError if referenceElement is a dom node
	        // and parentNode !== this

	        if (elem.parentNode) {
	            elem.parentNode.removeChild(elem);
	        }

	        var index = needle === null || needle === undefined ?
	            -1 :
	            this.childNodes.indexOf(needle);

	        if (index > -1) {
	            this.childNodes.splice(index, 0, elem);
	        } else {
	            this.childNodes.push(elem);
	        }

	        elem.parentNode = this;
	        return elem
	    };

	DOMElement.prototype.setAttributeNS =
	    function _Element_setAttributeNS(namespace, name, value) {
	        var prefix = null;
	        var localName = name;
	        var colonPosition = name.indexOf(":");
	        if (colonPosition > -1) {
	            prefix = name.substr(0, colonPosition);
	            localName = name.substr(colonPosition + 1);
	        }
	        if (this.tagName === 'INPUT' && name === 'type') {
	          this.type = value;
	        }
	        else {
	          var attributes = this._attributes[namespace] || (this._attributes[namespace] = {});
	          attributes[localName] = {value: value, prefix: prefix};
	        }
	    };

	DOMElement.prototype.getAttributeNS =
	    function _Element_getAttributeNS(namespace, name) {
	        var attributes = this._attributes[namespace];
	        var value = attributes && attributes[name] && attributes[name].value;
	        if (this.tagName === 'INPUT' && name === 'type') {
	          return this.type;
	        }
	        if (typeof value !== "string") {
	            return null
	        }
	        return value
	    };

	DOMElement.prototype.removeAttributeNS =
	    function _Element_removeAttributeNS(namespace, name) {
	        var attributes = this._attributes[namespace];
	        if (attributes) {
	            delete attributes[name];
	        }
	    };

	DOMElement.prototype.hasAttributeNS =
	    function _Element_hasAttributeNS(namespace, name) {
	        var attributes = this._attributes[namespace];
	        return !!attributes && name in attributes;
	    };

	DOMElement.prototype.setAttribute = function _Element_setAttribute(name, value) {
	    return this.setAttributeNS(null, name, value)
	};

	DOMElement.prototype.getAttribute = function _Element_getAttribute(name) {
	    return this.getAttributeNS(null, name)
	};

	DOMElement.prototype.removeAttribute = function _Element_removeAttribute(name) {
	    return this.removeAttributeNS(null, name)
	};

	DOMElement.prototype.hasAttribute = function _Element_hasAttribute(name) {
	    return this.hasAttributeNS(null, name)
	};

	DOMElement.prototype.removeEventListener = removeEventListener_1;
	DOMElement.prototype.addEventListener = addEventListener_1;
	DOMElement.prototype.dispatchEvent = dispatchEvent_1;

	// Un-implemented
	DOMElement.prototype.focus = function _Element_focus() {
	    return void 0
	};

	DOMElement.prototype.toString = function _Element_toString() {
	    return serialize(this)
	};

	DOMElement.prototype.getElementsByClassName = function _Element_getElementsByClassName(classNames) {
	    var classes = classNames.split(" ");
	    var elems = [];

	    domWalk(this, function (node) {
	        if (node.nodeType === 1) {
	            var nodeClassName = node.className || "";
	            var nodeClasses = nodeClassName.split(" ");

	            if (classes.every(function (item) {
	                return nodeClasses.indexOf(item) !== -1
	            })) {
	                elems.push(node);
	            }
	        }
	    });

	    return elems
	};

	DOMElement.prototype.getElementsByTagName = function _Element_getElementsByTagName(tagName) {
	    tagName = tagName.toLowerCase();
	    var elems = [];

	    domWalk(this.childNodes, function (node) {
	        if (node.nodeType === 1 && (tagName === '*' || node.tagName.toLowerCase() === tagName)) {
	            elems.push(node);
	        }
	    });

	    return elems
	};

	DOMElement.prototype.contains = function _Element_contains(element) {
	    return domWalk(this, function (node) {
	        return element === node
	    }) || false
	};

	var domFragment = DocumentFragment;

	function DocumentFragment(owner) {
	    if (!(this instanceof DocumentFragment)) {
	        return new DocumentFragment()
	    }

	    this.childNodes = [];
	    this.parentNode = null;
	    this.ownerDocument = owner || null;
	}

	DocumentFragment.prototype.type = "DocumentFragment";
	DocumentFragment.prototype.nodeType = 11;
	DocumentFragment.prototype.nodeName = "#document-fragment";

	DocumentFragment.prototype.appendChild  = domElement.prototype.appendChild;
	DocumentFragment.prototype.replaceChild = domElement.prototype.replaceChild;
	DocumentFragment.prototype.removeChild  = domElement.prototype.removeChild;

	DocumentFragment.prototype.toString =
	    function _DocumentFragment_toString() {
	        return this.childNodes.map(function (node) {
	            return String(node)
	        }).join("")
	    };

	var event = Event;

	function Event(family) {}

	Event.prototype.initEvent = function _Event_initEvent(type, bubbles, cancelable) {
	    this.type = type;
	    this.bubbles = bubbles;
	    this.cancelable = cancelable;
	};

	Event.prototype.preventDefault = function _Event_preventDefault() {
	    
	};

	var document$2 = Document;

	function Document() {
	    if (!(this instanceof Document)) {
	        return new Document();
	    }

	    this.head = this.createElement("head");
	    this.body = this.createElement("body");
	    this.documentElement = this.createElement("html");
	    this.documentElement.appendChild(this.head);
	    this.documentElement.appendChild(this.body);
	    this.childNodes = [this.documentElement];
	    this.nodeType = 9;
	}

	var proto = Document.prototype;
	proto.createTextNode = function createTextNode(value) {
	    return new domText(value, this)
	};

	proto.createElementNS = function createElementNS(namespace, tagName) {
	    var ns = namespace === null ? null : String(namespace);
	    return new domElement(tagName, this, ns)
	};

	proto.createElement = function createElement(tagName) {
	    return new domElement(tagName, this)
	};

	proto.createDocumentFragment = function createDocumentFragment() {
	    return new domFragment(this)
	};

	proto.createEvent = function createEvent(family) {
	    return new event(family)
	};

	proto.createComment = function createComment(data) {
	    return new domComment(data, this)
	};

	proto.getElementById = function getElementById(id) {
	    id = String(id);

	    var result = domWalk(this.childNodes, function (node) {
	        if (String(node.id) === id) {
	            return node
	        }
	    });

	    return result || null
	};

	proto.getElementsByClassName = domElement.prototype.getElementsByClassName;
	proto.getElementsByTagName = domElement.prototype.getElementsByTagName;
	proto.contains = domElement.prototype.contains;

	proto.removeEventListener = removeEventListener_1;
	proto.addEventListener = addEventListener_1;
	proto.dispatchEvent = dispatchEvent_1;

	var minDocument = new document$2();

	var topLevel = typeof commonjsGlobal !== 'undefined' ? commonjsGlobal :
	    typeof window !== 'undefined' ? window : {};


	var doccy;

	if (typeof document !== 'undefined') {
	    doccy = document;
	} else {
	    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

	    if (!doccy) {
	        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDocument;
	    }
	}

	var win;

	if (typeof window !== "undefined") {
	    win = window;
	} else if (typeof commonjsGlobal !== "undefined") {
	    win = commonjsGlobal;
	} else if (typeof self !== "undefined"){
	    win = self;
	} else {
	    win = {};
	}

	var window_1 = win;

	// This is the private tracking variable for the logging history.
	var history = [];
	/**
	 * Log messages to the console and history based on the type of message
	 *
	 * @private
	 * @param  {string} type
	 *         The name of the console method to use.
	 *
	 * @param  {Array} args
	 *         The arguments to be passed to the matching console method.
	 */

	var LogByTypeFactory = function LogByTypeFactory(name, log) {
	  return function (type, level, args) {
	    var lvl = log.levels[level];
	    var lvlRegExp = new RegExp("^(".concat(lvl, ")$"));

	    if (type !== 'log') {
	      // Add the type to the front of the message when it's not "log".
	      args.unshift(type.toUpperCase() + ':');
	    } // Add console prefix after adding to history.


	    args.unshift(name + ':'); // Add a clone of the args at this point to history.

	    if (history) {
	      var _context;

	      history.push(concat$2(_context = []).call(_context, args)); // only store 1000 history entries

	      var splice = history.length - 1000;

	      splice$2(history).call(history, 0, splice > 0 ? splice : 0);
	    } // If there's no console then don't try to output messages, but they will
	    // still be stored in history.


	    if (!window_1.console) {
	      return;
	    } // Was setting these once outside of this function, but containing them
	    // in the function makes it easier to test cases where console doesn't exist
	    // when the module is executed.


	    var fn = window_1.console[type];

	    if (!fn && type === 'debug') {
	      // Certain browsers don't have support for console.debug. For those, we
	      // should default to the closest comparable log.
	      fn = window_1.console.info || window_1.console.log;
	    } // Bail out if there's no console or if this type is not allowed by the
	    // current logging level.


	    if (!fn || !lvl || !lvlRegExp.test(type)) {
	      return;
	    }

	    fn[isArray$3(args) ? 'apply' : 'call'](window_1.console, args);
	  };
	};

	function createLogger(name) {
	  // This is the private tracking variable for logging level.
	  var level = 'info'; // the curried logByType bound to the specific log and history

	  var logByType;
	  /**
	   * Logs plain debug messages. Similar to `console.log`.
	   *
	   * Due to [limitations](https://github.com/jsdoc3/jsdoc/issues/955#issuecomment-313829149)
	   * of our JSDoc template, we cannot properly document this as both a function
	   * and a namespace, so its function signature is documented here.
	   *
	   * #### Arguments
	   * ##### *args
	   * Mixed[]
	   *
	   * Any combination of values that could be passed to `console.log()`.
	   *
	   * #### Return Value
	   *
	   * `undefined`
	   *
	   * @namespace
	   * @param    {Mixed[]} args
	   *           One or more messages or objects that should be logged.
	   */

	  var log = function log() {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    logByType('log', level, args);
	  }; // This is the logByType helper that the logging methods below use


	  logByType = LogByTypeFactory(name, log);
	  /**
	   * Create a new sublogger which chains the old name to the new name.
	   *
	   * For example, doing `videojs.log.createLogger('player')` and then using that logger will log the following:
	   * ```js
	   *  mylogger('foo');
	   *  // > VIDEOJS: player: foo
	   * ```
	   *
	   * @param {string} name
	   *        The name to add call the new logger
	   * @return {Object}
	   */

	  log.createLogger = function (subname) {
	    return createLogger(name + ': ' + subname);
	  };
	  /**
	   * Enumeration of available logging levels, where the keys are the level names
	   * and the values are `|`-separated strings containing logging methods allowed
	   * in that logging level. These strings are used to create a regular expression
	   * matching the function name being called.
	   *
	   * Levels provided by Video.js are:
	   *
	   * - `off`: Matches no calls. Any value that can be cast to `false` will have
	   *   this effect. The most restrictive.
	   * - `all`: Matches only Video.js-provided functions (`debug`, `log`,
	   *   `log.warn`, and `log.error`).
	   * - `debug`: Matches `log.debug`, `log`, `log.warn`, and `log.error` calls.
	   * - `info` (default): Matches `log`, `log.warn`, and `log.error` calls.
	   * - `warn`: Matches `log.warn` and `log.error` calls.
	   * - `error`: Matches only `log.error` calls.
	   *
	   * @type {Object}
	   */


	  log.levels = {
	    all: 'debug|log|warn|error',
	    off: '',
	    debug: 'debug|log|warn|error',
	    info: 'log|warn|error',
	    warn: 'warn|error',
	    error: 'error',
	    DEFAULT: level
	  };
	  /**
	   * Get or set the current logging level.
	   *
	   * If a string matching a key from {@link module:log.levels} is provided, acts
	   * as a setter.
	   *
	   * @param  {string} [lvl]
	   *         Pass a valid level to set a new logging level.
	   *
	   * @return {string}
	   *         The current logging level.
	   */

	  log.level = function (lvl) {
	    if (typeof lvl === 'string') {
	      if (!log.levels.hasOwnProperty(lvl)) {
	        throw new Error("\"".concat(lvl, "\" in not a valid log level"));
	      }

	      level = lvl;
	    }

	    return level;
	  };
	  /**
	   * Returns an array containing everything that has been logged to the history.
	   *
	   * This array is a shallow clone of the internal history record. However, its
	   * contents are _not_ cloned; so, mutating objects inside this array will
	   * mutate them in history.
	   *
	   * @return {Array}
	   */


	  log.history = function () {
	    var _context2;

	    return history ? concat$2(_context2 = []).call(_context2, history) : [];
	  };
	  /**
	   * Allows you to filter the history by the given logger name
	   *
	   * @param {string} fname
	   *        The name to filter by
	   *
	   * @return {Array}
	   *         The filtered list to return
	   */


	  log.history.filter = function (fname) {
	    var _context3;

	    return filter$2(_context3 = history || []).call(_context3, function (historyItem) {
	      // if the first item in each historyItem includes `fname`, then it's a match
	      return new RegExp(".*".concat(fname, ".*")).test(historyItem[0]);
	    });
	  };
	  /**
	   * Clears the internal history tracking, but does not prevent further history
	   * tracking.
	   */


	  log.history.clear = function () {
	    if (history) {
	      history.length = 0;
	    }
	  };
	  /**
	   * Disable history tracking if it is currently enabled.
	   */


	  log.history.disable = function () {
	    if (history !== null) {
	      history.length = 0;
	      history = null;
	    }
	  };
	  /**
	   * Enable history tracking if it is currently disabled.
	   */


	  log.history.enable = function () {
	    if (history === null) {
	      history = [];
	    }
	  };
	  /**
	   * Logs error messages. Similar to `console.error`.
	   *
	   * @param {Mixed[]} args
	   *        One or more messages or objects that should be logged as an error
	   */


	  log.error = function () {
	    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    return logByType('error', level, args);
	  };
	  /**
	   * Logs warning messages. Similar to `console.warn`.
	   *
	   * @param {Mixed[]} args
	   *        One or more messages or objects that should be logged as a warning.
	   */


	  log.warn = function () {
	    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	      args[_key3] = arguments[_key3];
	    }

	    return logByType('warn', level, args);
	  };
	  /**
	   * Logs debug messages. Similar to `console.debug`, but may also act as a comparable
	   * log if `console.debug` is not available
	   *
	   * @param {Mixed[]} args
	   *        One or more messages or objects that should be logged as debug.
	   */


	  log.debug = function () {
	    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	      args[_key4] = arguments[_key4];
	    }

	    return logByType('debug', level, args);
	  };

	  return log;
	}

	/**
	 * @file log.js
	 * @module log
	 */
	var log = createLogger('VIDEOJS');

	// `Symbol.asyncIterator` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.asynciterator
	defineWellKnownSymbol('asyncIterator');

	// `Symbol.hasInstance` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.hasinstance
	defineWellKnownSymbol('hasInstance');

	// `Symbol.isConcatSpreadable` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.isconcatspreadable
	defineWellKnownSymbol('isConcatSpreadable');

	// `Symbol.iterator` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.iterator
	defineWellKnownSymbol('iterator');

	// `Symbol.match` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.match
	defineWellKnownSymbol('match');

	// `Symbol.matchAll` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.matchall
	defineWellKnownSymbol('matchAll');

	// `Symbol.replace` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.replace
	defineWellKnownSymbol('replace');

	// `Symbol.search` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.search
	defineWellKnownSymbol('search');

	// `Symbol.species` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.species
	defineWellKnownSymbol('species');

	// `Symbol.split` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.split
	defineWellKnownSymbol('split');

	// `Symbol.toPrimitive` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.toprimitive
	defineWellKnownSymbol('toPrimitive');

	// `Symbol.toStringTag` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.tostringtag
	defineWellKnownSymbol('toStringTag');

	// `Symbol.unscopables` well-known symbol
	// https://tc39.es/ecma262/#sec-symbol.unscopables
	defineWellKnownSymbol('unscopables');

	// JSON[@@toStringTag] property
	// https://tc39.es/ecma262/#sec-json-@@tostringtag
	setToStringTag(global_1.JSON, 'JSON', true);

	var symbol = path.Symbol;

	var symbol$1 = symbol;

	// `Symbol.asyncDispose` well-known symbol
	// https://github.com/tc39/proposal-using-statement
	defineWellKnownSymbol('asyncDispose');

	// `Symbol.dispose` well-known symbol
	// https://github.com/tc39/proposal-using-statement
	defineWellKnownSymbol('dispose');

	// `Symbol.matcher` well-known symbol
	// https://github.com/tc39/proposal-pattern-matching
	defineWellKnownSymbol('matcher');

	// `Symbol.metadata` well-known symbol
	// https://github.com/tc39/proposal-decorators
	defineWellKnownSymbol('metadata');

	// `Symbol.observable` well-known symbol
	// https://github.com/tc39/proposal-observable
	defineWellKnownSymbol('observable');

	// TODO: remove from `core-js@4`


	// `Symbol.patternMatch` well-known symbol
	// https://github.com/tc39/proposal-pattern-matching
	defineWellKnownSymbol('patternMatch');

	// TODO: remove from `core-js@4`


	defineWellKnownSymbol('replaceAll');

	// TODO: Remove from `core-js@4`

	// TODO: Remove from `core-js@4`


	var symbol$2 = symbol$1;

	var symbol$3 = symbol$2;

	// `String.prototype.codePointAt` methods implementation
	var createMethod$3 = function (CONVERT_TO_STRING) {
	  return function ($this, pos) {
	    var S = toString_1(requireObjectCoercible($this));
	    var position = toInteger(pos);
	    var size = S.length;
	    var first, second;
	    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
	    first = S.charCodeAt(position);
	    return first < 0xD800 || first > 0xDBFF || position + 1 === size
	      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
	        ? CONVERT_TO_STRING ? S.charAt(position) : first
	        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
	  };
	};

	var stringMultibyte = {
	  // `String.prototype.codePointAt` method
	  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
	  codeAt: createMethod$3(false),
	  // `String.prototype.at` method
	  // https://github.com/mathiasbynens/String.prototype.at
	  charAt: createMethod$3(true)
	};

	var charAt = stringMultibyte.charAt;




	var STRING_ITERATOR = 'String Iterator';
	var setInternalState$2 = internalState.set;
	var getInternalState$2 = internalState.getterFor(STRING_ITERATOR);

	// `String.prototype[@@iterator]` method
	// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
	defineIterator(String, 'String', function (iterated) {
	  setInternalState$2(this, {
	    type: STRING_ITERATOR,
	    string: toString_1(iterated),
	    index: 0
	  });
	// `%StringIteratorPrototype%.next` method
	// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
	}, function next() {
	  var state = getInternalState$2(this);
	  var string = state.string;
	  var index = state.index;
	  var point;
	  if (index >= string.length) return { value: undefined, done: true };
	  point = charAt(string, index);
	  state.index += point.length;
	  return { value: point, done: false };
	});

	var iterator = wellKnownSymbolWrapped.f('iterator');

	var iterator$1 = iterator;

	var iterator$2 = iterator$1;

	var iterator$3 = iterator$2;

	var _typeof_1 = createCommonjsModule(function (module) {
	function _typeof(obj) {
	  "@babel/helpers - typeof";

	  if (typeof symbol$3 === "function" && typeof iterator$3 === "symbol") {
	    module.exports = _typeof = function _typeof(obj) {
	      return typeof obj;
	    };

	    module.exports["default"] = module.exports, module.exports.__esModule = true;
	  } else {
	    module.exports = _typeof = function _typeof(obj) {
	      return obj && typeof symbol$3 === "function" && obj.constructor === symbol$3 && obj !== symbol$3.prototype ? "symbol" : typeof obj;
	    };

	    module.exports["default"] = module.exports, module.exports.__esModule = true;
	  }

	  return _typeof(obj);
	}

	module.exports = _typeof;
	module.exports["default"] = module.exports, module.exports.__esModule = true;
	});

	unwrapExports(_typeof_1);

	// `Array.prototype.{ reduce, reduceRight }` methods implementation
	var createMethod$4 = function (IS_RIGHT) {
	  return function (that, callbackfn, argumentsLength, memo) {
	    aFunction$1(callbackfn);
	    var O = toObject(that);
	    var self = indexedObject(O);
	    var length = toLength(O.length);
	    var index = IS_RIGHT ? length - 1 : 0;
	    var i = IS_RIGHT ? -1 : 1;
	    if (argumentsLength < 2) while (true) {
	      if (index in self) {
	        memo = self[index];
	        index += i;
	        break;
	      }
	      index += i;
	      if (IS_RIGHT ? index < 0 : length <= index) {
	        throw TypeError('Reduce of empty array with no initial value');
	      }
	    }
	    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
	      memo = callbackfn(memo, self[index], index, O);
	    }
	    return memo;
	  };
	};

	var arrayReduce = {
	  // `Array.prototype.reduce` method
	  // https://tc39.es/ecma262/#sec-array.prototype.reduce
	  left: createMethod$4(false),
	  // `Array.prototype.reduceRight` method
	  // https://tc39.es/ecma262/#sec-array.prototype.reduceright
	  right: createMethod$4(true)
	};

	var engineIsNode = classofRaw(global_1.process) == 'process';

	var $reduce = arrayReduce.left;




	var STRICT_METHOD$2 = arrayMethodIsStrict('reduce');
	// Chrome 80-82 has a critical bug
	// https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
	var CHROME_BUG = !engineIsNode && engineV8Version > 79 && engineV8Version < 83;

	// `Array.prototype.reduce` method
	// https://tc39.es/ecma262/#sec-array.prototype.reduce
	_export({ target: 'Array', proto: true, forced: !STRICT_METHOD$2 || CHROME_BUG }, {
	  reduce: function reduce(callbackfn /* , initialValue */) {
	    return $reduce(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});

	var reduce = entryVirtual('Array').reduce;

	/**
	 * Check if an event was a single left click.
	 *
	 * @param  {EventTarget~Event} event
	 *         Event object.
	 *
	 * @return {boolean}
	 *         Will be `true` if a single left click, `false` otherwise.
	 */

	function isSingleLeftClick(event) {
	  // Note: if you create something draggable, be sure to
	  // call it on both `mousedown` and `mousemove` event,
	  // otherwise `mousedown` should be enough for a button
	  if (event.button === undefined && event.buttons === undefined) {
	    // Why do we need `buttons` ?
	    // Because, middle mouse sometimes have this:
	    // e.button === 0 and e.buttons === 4
	    // Furthermore, we want to prevent combination click, something like
	    // HOLD middlemouse then left click, that would be
	    // e.button === 0, e.buttons === 5
	    // just `button` is not gonna work
	    // Alright, then what this block does ?
	    // this is for chrome `simulate mobile devices`
	    // I want to support this as well
	    return true;
	  }

	  if (event.button === 0 && event.buttons === undefined) {
	    // Touch screen, sometimes on some specific device, `buttons`
	    // doesn't have anything (safari on ios, blackberry...)
	    return true;
	  } // `mouseup` event on a single left click has
	  // `button` and `buttons` equal to 0


	  if (event.type === 'mouseup' && event.button === 0 && event.buttons === 0) {
	    return true;
	  }

	  if (event.button !== 0 || event.buttons !== 1) {
	    // This is the reason we have those if else block above
	    // if any special case we can catch and let it slide
	    // we do it above, when get to here, this definitely
	    // is-not-left-click
	    return false;
	  }

	  return true;
	}

	function startWith(str, startStr) {
	  var reg = new RegExp("^".concat(startStr));
	  return reg.test(str);
	}
	function contains(str, containStr) {
	  var reg = new RegExp("".concat(containStr));
	  return reg.test(str);
	}
	function getSourceType(url) {
	  var isLive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	  var types = {
	    m3u8: 'application/x-mpegURL',
	    mp4: 'video/mp4',
	    flv: 'video/x-flv',
	    rtmp: 'rtmp/flv'
	  };
	  var type = '';

	  if (contains(url, '.m3u8')) {
	    type = types['m3u8'];
	  }

	  if (contains(url, '.mp4')) {
	    type = types['mp4'];
	  }

	  if (contains(url, '.flv')) {
	    type = types['flv'];
	  }

	  if (contains(url, 'rtmp')) {
	    type = types['rtmp'];
	  }

	  if (type === '') {
	    type = isLive ? types['m3u8'] : types['mp4'];
	  }

	  return type;
	}

	function ownKeys$1(object, enumerableOnly) { var keys = keys$2(object); if (getOwnPropertySymbols$2) { var symbols = getOwnPropertySymbols$2(object); if (enumerableOnly) { symbols = filter$2(symbols).call(symbols, function (sym) { return getOwnPropertyDescriptor$3(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context; forEach$2(_context = ownKeys$1(Object(source), true)).call(_context, function (key) { _defineProperty(target, key, source[key]); }); } else if (getOwnPropertyDescriptors$2) { defineProperties$1(target, getOwnPropertyDescriptors$2(source)); } else { var _context2; forEach$2(_context2 = ownKeys$1(Object(source))).call(_context2, function (key) { defineProperty$4(target, key, getOwnPropertyDescriptor$3(source, key)); }); } } return target; }
	var dfApiSettings = {
	  getRealplayUrl: {
	    url: '/ylv/v1/realplay/${channelID}',
	    method: 'POST'
	  },
	  getHistoryUrl: {
	    url: '/ylv/v1/history/${channelID}',
	    method: 'POST'
	  },
	  realplayKeepAlive: {
	    url: '/ylv/v1/realplay/${sessionID}',
	    method: 'PUT'
	  },
	  changePlayRate: {
	    url: '/ylv/v1/history/${sessionID}',
	    method: 'PUT'
	  },
	  jumpPlayTime: {
	    url: '/ylv/v1/history/${sessionID}',
	    method: 'PUT'
	  },
	  stopRealPlay: {
	    url: '/ylv/v1/realplay/${sessionID}',
	    method: 'DELETE'
	  },
	  stopHistory: {
	    url: '/ylv/v1/history/${sessionID}',
	    method: 'DELETE'
	  }
	};
	/**
	 *  跟云粒视频后台绑定的一些设置，回放使用hls视频流，
	 *  拖动、倍速播放由后台接口控制
	 *
	 * @param YunliVjsPlayer 云粒播放器实例
	 *
	 */

	function yunliMixin(YunliVjsPlayer) {
	  /**
	   * @description: 支持接口地址可配置，根据类型获取接口地址
	   * url中的参数仅支持${sessionID}和${channelID}两个，
	   * 分别对应options中的channelID和source中的sessionID（接口中获取）
	   * 
	   * 
	   * @param {string} type
	   * realplayKeepAlive:
	   * changePlayRate:
	   * jumpPlayTime:
	   * stopVideoPlay:
	   * 
	   * @return {string} apiUrl
	   */
	  YunliVjsPlayer.prototype.getApiUrl = function (type) {
	    var apiSettings = this.options_.apiSettings || {};
	    apiSettings = _objectSpread(_objectSpread({}, dfApiSettings), apiSettings);
	    var channelID = this.options_.channelID;
	    var sources = this.options_.sources || this.player_.sources;

	    if (sources && sources.length > 0 && sources[0].sessionID) {
	      var sessionID = sources[0].sessionID;
	      var apiUrl = apiSettings[type];
	      apiUrl.url = apiUrl.url.replace(/\$\{sessionID\}/g, sessionID);

	      if (channelID) {
	        apiUrl.url = apiUrl.url.replace(/\$\{channelID\}/g, channelID);
	      }

	      if (startWith(apiUrl.url, '/')) {
	        apiUrl.url = this.options_.yunliApiRoot + apiUrl.url;
	      }

	      return apiUrl;
	    }
	  };
	  /**
	   * 实时视频保活
	   */


	  YunliVjsPlayer.prototype._keepAlive = function () {
	    var _this = this;

	    if (this._keepAliveTimer) {
	      window.clearTimeout(this._keepAliveTimer);
	    }

	    var playUrlType = 'realplayKeepAlive';
	    this._keepAliveTimer = setTimeout$1(function () {
	      var sources = _this.options_.sources || _this.player_.sources;

	      try {
	        if (sources && sources.length > 0 && sources[0].sessionID) {
	          var _this$options_, _this$options_$xhr;

	          var sessionID = sources[0].sessionID;

	          var api = _this.getApiUrl(playUrlType);

	          var opt = _objectSpread({
	            // method: 'PUT',
	            // url: `${this.options_.yunliApiRoot}/ylv/v1/realplay/${sessionID}`,
	            withCredentials: true,
	            json: true,
	            headers: {
	              Accept: 'application/json'
	            },
	            body: {
	              sessionID: sessionID
	            }
	          }, api);

	          var this_ = _this; // 调用xhr中的beforeFetch钩子

	          if ((_this$options_ = _this.options_) !== null && _this$options_ !== void 0 && (_this$options_$xhr = _this$options_.xhr) !== null && _this$options_$xhr !== void 0 && _this$options_$xhr.beforeFetch) {
	            opt = _this.options_.xhr.beforeFetch.call(_this, opt, playUrlType);
	          }

	          videojs.xhr(opt, function (error, resp) {
	            var _this_$options_, _this_$options_$xhr;

	            console.log('keepalive', error, resp); // 调用xhr中的afterFetch钩子

	            if ((_this_$options_ = this_.options_) !== null && _this_$options_ !== void 0 && (_this_$options_$xhr = _this_$options_.xhr) !== null && _this_$options_$xhr !== void 0 && _this_$options_$xhr.afterFetch) {
	              resp = this_.options_.xhr.afterFetch.call(this_, resp, playUrlType);
	            }
	            /*
	            if((error || resp.body.code !== 0) && sources[0].channelID){
	              this_._retryPlay.call(this_, sources[0].channelID)
	            }
	            */


	            if (error || resp.statusCode !== 200) {
	              console.log('keepalive error trigger');
	              this_.player_.trigger('keepAliveError');
	            } else {}

	            this_._keepAlive();
	          });
	        }
	      } catch (err) {
	        console.error(err);
	      }
	    }, this._keepAliveInterval);
	  };
	  /**
	   * 从新获取播放地址后播放
	   * 主要场景是历史视频完成后，再次播放需要重新请求播放地址和sessionId
	   */


	  YunliVjsPlayer.prototype._refetchPlay = function (channelID) {
	    var _this$options_2, _this$options_2$xhr;

	    channelID = channelID || this.options_.channelID;

	    if (this.isRetryingRequest) {
	      return;
	    }

	    this.isRetryingRequest = true;
	    var param = {
	      channelID: channelID,
	      outputType: this.options_.outputType
	    };
	    var playRate = this.options_.playRate || 1;

	    if (playRate) {
	      param.speed = playRate;
	    }

	    var playType = 'realplay';

	    if (this.options_.yunliMode === 'history') {
	      playType = 'history';
	      param.beginTime = this.options_.beginTime;
	      param.endTime = this.options_.endTime;
	    }

	    var playUrlType = playType === 'realplay' ? 'getRealplayUrl' : 'getHistoryUrl';
	    var api = this.getApiUrl(playUrlType);

	    var opt = _objectSpread({
	      // method: 'POST',
	      // url: `${this.options_.yunliApiRoot}/ylv/v1/${playType}/${channelID}`,
	      withCredentials: true,
	      json: true,
	      headers: {
	        Accept: 'application/json'
	      },
	      body: param
	    }, api);

	    var this_ = this; // 调用xhr中的beforeFetch钩子

	    if ((_this$options_2 = this.options_) !== null && _this$options_2 !== void 0 && (_this$options_2$xhr = _this$options_2.xhr) !== null && _this$options_2$xhr !== void 0 && _this$options_2$xhr.beforeFetch) {
	      opt = this.options_.xhr.beforeFetch.call(this, opt, playUrlType);
	    }

	    videojs.xhr(opt, function (error, resp) {
	      var _this_$options_2, _this_$options_2$xhr;

	      // 调用xhr中的afterFetch钩子
	      if ((_this_$options_2 = this_.options_) !== null && _this_$options_2 !== void 0 && (_this_$options_2$xhr = _this_$options_2.xhr) !== null && _this_$options_2$xhr !== void 0 && _this_$options_2$xhr.afterFetch) {
	        resp = this_.options_.xhr.afterFetch.call(this_, resp, playUrlType);
	      }

	      console.log('keepalive retry', error, resp);
	      this_.isRetryingRequest = false;
	      var types = {
	        hls: 'application/x-mpegURL',
	        mp4: 'video/mp4',
	        flv: 'video/x-flv',
	        rtmp: 'rtmp/flv'
	      };
	      var source = {
	        src: resp.body.result.outputUrl,
	        type: types[this_.options_.outputType] || '',
	        sessionID: resp.body.result.sessionID,
	        channelID: channelID
	      };
	      this_.src(source);
	    });
	  };
	  /**
	   * 切换播放倍率,走后台播放接口控制视频播放
	   * 只有yunliMode='history’且duration>0的时候有效
	   */


	  YunliVjsPlayer.prototype._changePlayRate = function () {
	    var rate = this.player_.playbackRate() || 1; // 如果options传入了changePlayRate函数，替换现有函数

	    if (this.options_.changePlayRate) {
	      this.options_.changePlayRate.call(this, rate, this.player_);
	      return;
	    }

	    try {
	      var _this$options_3, _this$options_3$xhr;

	      var params = {
	        ctrlType: 'play',
	        param: "".concat(rate)
	      };
	      var playUrlType = 'changePlayRate';
	      var api = this.getAPiUrl(playUrlType);

	      var opt = _objectSpread({
	        // method: 'PUT',
	        // url: `${this.options_.yunliApiRoot}/ylv/v1/history/${this.options_
	        //   .sources[0].sessionID || ''}`,
	        withCredentials: true,
	        json: true,
	        headers: {
	          Accept: 'application/json'
	        },
	        body: params
	      }, api); // 调用xhr中的beforeFetch钩子


	      if ((_this$options_3 = this.options_) !== null && _this$options_3 !== void 0 && (_this$options_3$xhr = _this$options_3.xhr) !== null && _this$options_3$xhr !== void 0 && _this$options_3$xhr.beforeFetch) {
	        opt = this.options_.xhr.beforeFetch.call(this, opt, playUrlType);
	      }

	      var this_ = this;
	      videojs.xhr(opt, function (resp) {
	        var _this_$options_3, _this_$options_3$xhr;

	        console.log('resp', resp); // 调用xhr中的afterFetch钩子

	        if ((_this_$options_3 = this_.options_) !== null && _this_$options_3 !== void 0 && (_this_$options_3$xhr = _this_$options_3.xhr) !== null && _this_$options_3$xhr !== void 0 && _this_$options_3$xhr.afterFetch) {
	          resp = this_.options_.xhr.afterFetch.call(this_, resp, playUrlType);
	        }
	      });
	    } catch (err) {
	      console.error(err);
	    }
	  };
	  /**
	   * 视频跳转到指定时间
	   * 只有yunliMode='history’且duration>0的时候有效
	   */


	  YunliVjsPlayer.prototype._jumpVideoTime = function (time) {
	    //this.player_.pause()
	    // 如果options传入了jumpVideoTime函数，替换现有函数
	    if (this.options_.jumpVideoTime) {
	      this.options_.jumpVideoTime.call(this, time, this.player_);
	      return;
	    }

	    try {
	      var _this$options_4, _this$options_4$xhr;

	      var params = {
	        ctrlType: 'jump',
	        param: "".concat(time || 1)
	      };
	      var playUrlType = 'jumpPlayTime';
	      var api = this.getApiUrl(playUrlType);

	      var opt = _objectSpread({
	        // method: 'PUT',
	        // url: `${this.options_.yunliApiRoot}/ylv/v1/history/${this.options_
	        //   .sources[0].sessionID || ''}`,
	        withCredentials: true,
	        headers: {
	          Accept: 'application/json'
	        },
	        body: stringify$2(params)
	      }, api);

	      console.log('jum in sdk', params);
	      var this_ = this; //this_.player_.currentTime(time)
	      // 调用xhr中的beforeFetch钩子

	      if ((_this$options_4 = this.options_) !== null && _this$options_4 !== void 0 && (_this$options_4$xhr = _this$options_4.xhr) !== null && _this$options_4$xhr !== void 0 && _this$options_4$xhr.beforeFetch) {
	        opt = this.options_.xhr.beforeFetch.call(this, opt, playUrlType);
	      }

	      videojs.xhr(opt, function (err, resp) {
	        var _this_$options_4, _this_$options_4$xhr;

	        console.log('resp', err, resp, this_); // 调用xhr中的afterFetch钩子

	        if ((_this_$options_4 = this_.options_) !== null && _this_$options_4 !== void 0 && (_this_$options_4$xhr = _this_$options_4.xhr) !== null && _this_$options_4$xhr !== void 0 && _this_$options_4$xhr.afterFetch) {
	          resp = this_.options_.xhr.afterFetch.call(this_, resp, playUrlType);
	        }

	        var data = JSON.parse(resp.body);

	        if (data.code === 0 || data.code === 200) {
	          this_.src(this_.options_.sources);
	          this_.ylJumpTime = time;
	          this_.player_.one('play', function () {//this_.player_.currentTime(time)
	            //this_.updateBarAfterJump() 
	          });
	        }
	      });
	    } catch (err) {
	      console.error(err);
	    }
	  };
	  /**
	   * 调用停止视频播放接口
	   */


	  YunliVjsPlayer.prototype._destroyVideo = function () {
	    var sources = this.options_.sources || this.player_.sources;

	    try {
	      if (sources && sources.length > 0 && sources[0].sessionID) {
	        var _this$options_5, _this$options_5$xhr;

	        var sessionID = sources[0].sessionID;
	        var mode = this.options_.mode === 'history' ? 'history' : 'realplay';
	        var playUrlType = mode === 'history' ? 'stopHistory' : 'stopRealPlay';
	        var api = this.getApiUrl(playUrlType);

	        var opt = _objectSpread({
	          // method: 'DELETE',
	          // url: `${this.options_.yunliApiRoot}/ylv/v1/${mode}/${sessionID}`,
	          withCredentials: true,
	          json: true,
	          headers: {
	            Accept: 'application/json'
	          }
	        }, api); // 调用xhr中的beforeFetch钩子


	        if ((_this$options_5 = this.options_) !== null && _this$options_5 !== void 0 && (_this$options_5$xhr = _this$options_5.xhr) !== null && _this$options_5$xhr !== void 0 && _this$options_5$xhr.beforeFetch) {
	          opt = this.options_.xhr.beforeFetch.call(this, opt, playUrlType);
	        }

	        var this_ = this;
	        videojs.xhr(opt, function (resp) {
	          var _this_$options_5, _this_$options_5$xhr;

	          // 调用xhr中的afterFetch钩子
	          if ((_this_$options_5 = this_.options_) !== null && _this_$options_5 !== void 0 && (_this_$options_5$xhr = _this_$options_5.xhr) !== null && _this_$options_5$xhr !== void 0 && _this_$options_5$xhr.afterFetch) {
	            resp = this_.options_.xhr.afterFetch.call(this_, resp, playUrlType);
	          }

	          console.log('resp', resp);
	        });
	      }
	    } catch (err) {
	      console.error(err);
	    }
	  };
	  /**
	   * 更改进度条的默认事件，包括拖动和点击
	   * 只有yunliMode='history’且duration>0的时候有效
	   */


	  YunliVjsPlayer.prototype.replaceControlBarEvent = function () {
	    //视频进度条
	    var progressControl = this.player_.controlBar.getChild('progressControl'); //视频进度条的拖动条

	    var seekBar = progressControl.getChild('seekBar'); //已播放进度条

	    var playProgressBar_ = progressControl.seekBar.getChild('playProgressBar');
	    console.log('progressControl ', progressControl, this);
	    var this_ = this; //历史视频处理跳播后时间展示问题

	    playProgressBar_.update = function (seekBarRect, seekBarPoint) {
	      var timeTooltip = this.getChild('timeTooltip');

	      if (!timeTooltip) {
	        return;
	      }

	      var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();

	      if (this_.isJumping) {
	        time = this_.ylJumpTime || 0;
	      } else {
	        time = time + (this_.ylJumpTime || 0);
	      }

	      timeTooltip.updateTime(seekBarRect, seekBarPoint, time);
	    };

	    seekBar.getCurrentTime_ = function () {
	      var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();

	      if (this_.isJumping) {
	        time = this_.ylJumpTime || 0;
	      } else {
	        time = time + (this_.ylJumpTime || 0);
	      }

	      return time;
	    };

	    seekBar.handleMouseMove = function (event) {
	      if (!isSingleLeftClick(event)) {
	        return;
	      }

	      this_.isJumping = true;
	      console.log('handleMouseMove', event);
	      var newTime;
	      var distance = this.calculateDistance(event);
	      var liveTracker = this.player_.liveTracker;

	      if (!liveTracker || !liveTracker.isLive()) {
	        newTime = distance * this.player_.duration(); // Don't let video end while scrubbing.

	        if (newTime === this.player_.duration()) {
	          newTime = newTime - 0.1;
	        }

	        this_.ylJumpTime = Math.floor(newTime);
	        var duration = this.player_.duration();
	        var percent = (newTime / duration * 100).toFixed(2);
	        playProgressBar_.el_.style.width = "".concat(percent, "%");
	      } else {
	        if (distance >= 0.99) {
	          liveTracker.seekToLiveEdge();
	          return;
	        }

	        var seekableStart = liveTracker.seekableStart();
	        var seekableEnd = liveTracker.liveCurrentTime();
	        newTime = seekableStart + distance * liveTracker.liveWindow(); // Don't let video end while scrubbing.

	        if (newTime >= seekableEnd) {
	          newTime = seekableEnd;
	        } // Compensate for precision differences so that currentTime is not less
	        // than seekable start


	        if (newTime <= seekableStart) {
	          newTime = seekableStart + 0.1;
	        } // On android seekableEnd can be Infinity sometimes,
	        // this will cause newTime to be Infinity, which is
	        // not a valid currentTime.


	        console.log('newtime', newTime);

	        if (newTime === Infinity) {
	          return;
	        }

	        this_.ylJumpTime = Math.floor(newTime);

	        var _duration = this.player_.duration();

	        var _percent = (newTime / _duration * 100).toFixed(2);

	        playProgressBar_.el_.style.width = "".concat(_percent, "%");
	      }
	    }; //鼠标点击事件


	    seekBar.on('click', function (event) {
	      console.log('click', this_.ylJumpTime);

	      if (event) {
	        event.stopPropagation();
	      }

	      this_.jumpVideoTime(this_.ylJumpTime);
	    });
	  };
	}

	/**
	 * 截屏功能
	 *
	 * @param YunliVjsPlayer
	 *
	 * @param width number 截屏宽度 默认视频的宽度
	 *
	 * @param height number 截屏高度 默认视频的高度
	 *
	 */
	function snapMixin(YunliVjsPlayer) {
	  YunliVjsPlayer.prototype._addSnapButton = function () {
	    var this_ = this;
	    var snapOptions = this.options_.snap || {
	      autoSave: true
	    };
	    var Button = videojs.getComponent('Button');
	    var snapButton = videojs.extend(Button, {
	      constructor: function constructor() {
	        Button.apply(this, arguments);
	        this.controlText('Snap');
	      },
	      handleClick: function handleClick() {
	        var base64 = this_.getSnapShot();

	        if (snapOptions.autoSave) {
	          this_.saveImage(base64);
	        } //截屏成功


	        this_.snapSuccess(base64);
	      },
	      buildCSSClass: function buildCSSClass() {
	        return 'vjs-yunli-snap vjs-control vjs-button';
	      }
	    });
	    videojs.registerComponent('snapButton', snapButton);
	  };

	  YunliVjsPlayer.prototype.getSnapShot = function () {
	    var snapOptions = this.options_.snap || {};
	    console.log('snap button click 111', this);
	    var this_ = this;

	    try {
	      var video = this.player_.el_.getElementsByTagName('video');

	      if (video) {
	        console.log('video', video);
	        video = video[0];
	      }

	      var w = snapOptions.width || video.videoWidth || video.offsetWidth;
	      var h = snapOptions.height || video.videoHeight || video.offsetHeight;
	      var canvas = document.createElement('canvas');
	      canvas.width = w;
	      canvas.height = h;
	      var ctx = canvas.getContext('2d');
	      ctx.drawImage(video, 0, 0, w, h);
	      var base64 = canvas.toDataURL('images/png');
	      console.log('img', this_);
	      return base64;
	    } catch (e) {
	      this_.snapError(e);
	      return e;
	    }
	  };

	  YunliVjsPlayer.prototype.saveImage = function (base64) {
	    var link = document.createElement('a');
	    link.href = base64;
	    link.download = "".concat(new Date().getTime(), ".jpg");
	    link.click();
	  }; //截屏成功


	  YunliVjsPlayer.prototype.snapSuccess = function (base64) {
	    console.log('11111', this.options_);
	    var snapOptions = this.options_.snap || {};

	    if (snapOptions.onSuccess) {
	      snapOptions.onSuccess(base64);
	    }
	  }; //截屏失败


	  YunliVjsPlayer.prototype.snapError = function (err) {
	    console.log('1111', err);
	    var snapOptions = this.options_.snap || {};

	    if (snapOptions.onError) {
	      snapOptions.onError(err);
	    }
	  };
	}

	var ITERATOR$2 = wellKnownSymbol('iterator');

	var nativeUrl = !fails(function () {
	  var url = new URL('b?a=1&b=2&c=3', 'http://a');
	  var searchParams = url.searchParams;
	  var result = '';
	  url.pathname = 'c%20d';
	  searchParams.forEach(function (value, key) {
	    searchParams['delete']('b');
	    result += key + value;
	  });
	  return (isPure && !url.toJSON)
	    || !searchParams.sort
	    || url.href !== 'http://a/c%20d?a=1&c=3'
	    || searchParams.get('c') !== '3'
	    || String(new URLSearchParams('?a=1')) !== 'a=1'
	    || !searchParams[ITERATOR$2]
	    // throws in Edge
	    || new URL('https://a@b').username !== 'a'
	    || new URLSearchParams(new URLSearchParams('a=b')).get('a') !== 'b'
	    // not punycoded in Edge
	    || new URL('http://тест').host !== 'xn--e1aybc'
	    // not escaped in Chrome 62-
	    || new URL('http://a#б').hash !== '#%D0%B1'
	    // fails in Chrome 66-
	    || result !== 'a1c3'
	    // throws in Safari
	    || new URL('http://x', undefined).host !== 'x';
	});

	var anInstance = function (it, Constructor, name) {
	  if (!(it instanceof Constructor)) {
	    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
	  } return it;
	};

	var iteratorClose = function (iterator) {
	  var returnMethod = iterator['return'];
	  if (returnMethod !== undefined) {
	    return anObject(returnMethod.call(iterator)).value;
	  }
	};

	// call something on iterator step with safe closing on error
	var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
	  try {
	    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
	  } catch (error) {
	    iteratorClose(iterator);
	    throw error;
	  }
	};

	var ITERATOR$3 = wellKnownSymbol('iterator');
	var ArrayPrototype$5 = Array.prototype;

	// check on default Array iterator
	var isArrayIteratorMethod = function (it) {
	  return it !== undefined && (iterators.Array === it || ArrayPrototype$5[ITERATOR$3] === it);
	};

	var ITERATOR$4 = wellKnownSymbol('iterator');

	var getIteratorMethod = function (it) {
	  if (it != undefined) return it[ITERATOR$4]
	    || it['@@iterator']
	    || iterators[classof(it)];
	};

	// `Array.from` method implementation
	// https://tc39.es/ecma262/#sec-array.from
	var arrayFrom = function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
	  var O = toObject(arrayLike);
	  var C = typeof this == 'function' ? this : Array;
	  var argumentsLength = arguments.length;
	  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
	  var mapping = mapfn !== undefined;
	  var iteratorMethod = getIteratorMethod(O);
	  var index = 0;
	  var length, result, step, iterator, next, value;
	  if (mapping) mapfn = functionBindContext(mapfn, argumentsLength > 2 ? arguments[2] : undefined, 2);
	  // if the target is not iterable or it's an array with the default iterator - use a simple case
	  if (iteratorMethod != undefined && !(C == Array && isArrayIteratorMethod(iteratorMethod))) {
	    iterator = iteratorMethod.call(O);
	    next = iterator.next;
	    result = new C();
	    for (;!(step = next.call(iterator)).done; index++) {
	      value = mapping ? callWithSafeIterationClosing(iterator, mapfn, [step.value, index], true) : step.value;
	      createProperty(result, index, value);
	    }
	  } else {
	    length = toLength(O.length);
	    result = new C(length);
	    for (;length > index; index++) {
	      value = mapping ? mapfn(O[index], index) : O[index];
	      createProperty(result, index, value);
	    }
	  }
	  result.length = index;
	  return result;
	};

	// based on https://github.com/bestiejs/punycode.js/blob/master/punycode.js
	var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1
	var base = 36;
	var tMin = 1;
	var tMax = 26;
	var skew = 38;
	var damp = 700;
	var initialBias = 72;
	var initialN = 128; // 0x80
	var delimiter = '-'; // '\x2D'
	var regexNonASCII = /[^\0-\u007E]/; // non-ASCII chars
	var regexSeparators = /[.\u3002\uFF0E\uFF61]/g; // RFC 3490 separators
	var OVERFLOW_ERROR = 'Overflow: input needs wider integers to process';
	var baseMinusTMin = base - tMin;
	var floor$1 = Math.floor;
	var stringFromCharCode = String.fromCharCode;

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 */
	var ucs2decode = function (string) {
	  var output = [];
	  var counter = 0;
	  var length = string.length;
	  while (counter < length) {
	    var value = string.charCodeAt(counter++);
	    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
	      // It's a high surrogate, and there is a next character.
	      var extra = string.charCodeAt(counter++);
	      if ((extra & 0xFC00) == 0xDC00) { // Low surrogate.
	        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
	      } else {
	        // It's an unmatched surrogate; only append this code unit, in case the
	        // next code unit is the high surrogate of a surrogate pair.
	        output.push(value);
	        counter--;
	      }
	    } else {
	      output.push(value);
	    }
	  }
	  return output;
	};

	/**
	 * Converts a digit/integer into a basic code point.
	 */
	var digitToBasic = function (digit) {
	  //  0..25 map to ASCII a..z or A..Z
	  // 26..35 map to ASCII 0..9
	  return digit + 22 + 75 * (digit < 26);
	};

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 */
	var adapt = function (delta, numPoints, firstTime) {
	  var k = 0;
	  delta = firstTime ? floor$1(delta / damp) : delta >> 1;
	  delta += floor$1(delta / numPoints);
	  for (; delta > baseMinusTMin * tMax >> 1; k += base) {
	    delta = floor$1(delta / baseMinusTMin);
	  }
	  return floor$1(k + (baseMinusTMin + 1) * delta / (delta + skew));
	};

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 */
	// eslint-disable-next-line max-statements -- TODO
	var encode = function (input) {
	  var output = [];

	  // Convert the input in UCS-2 to an array of Unicode code points.
	  input = ucs2decode(input);

	  // Cache the length.
	  var inputLength = input.length;

	  // Initialize the state.
	  var n = initialN;
	  var delta = 0;
	  var bias = initialBias;
	  var i, currentValue;

	  // Handle the basic code points.
	  for (i = 0; i < input.length; i++) {
	    currentValue = input[i];
	    if (currentValue < 0x80) {
	      output.push(stringFromCharCode(currentValue));
	    }
	  }

	  var basicLength = output.length; // number of basic code points.
	  var handledCPCount = basicLength; // number of code points that have been handled;

	  // Finish the basic string with a delimiter unless it's empty.
	  if (basicLength) {
	    output.push(delimiter);
	  }

	  // Main encoding loop:
	  while (handledCPCount < inputLength) {
	    // All non-basic code points < n have been handled already. Find the next larger one:
	    var m = maxInt;
	    for (i = 0; i < input.length; i++) {
	      currentValue = input[i];
	      if (currentValue >= n && currentValue < m) {
	        m = currentValue;
	      }
	    }

	    // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>, but guard against overflow.
	    var handledCPCountPlusOne = handledCPCount + 1;
	    if (m - n > floor$1((maxInt - delta) / handledCPCountPlusOne)) {
	      throw RangeError(OVERFLOW_ERROR);
	    }

	    delta += (m - n) * handledCPCountPlusOne;
	    n = m;

	    for (i = 0; i < input.length; i++) {
	      currentValue = input[i];
	      if (currentValue < n && ++delta > maxInt) {
	        throw RangeError(OVERFLOW_ERROR);
	      }
	      if (currentValue == n) {
	        // Represent delta as a generalized variable-length integer.
	        var q = delta;
	        for (var k = base; /* no condition */; k += base) {
	          var t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
	          if (q < t) break;
	          var qMinusT = q - t;
	          var baseMinusT = base - t;
	          output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT)));
	          q = floor$1(qMinusT / baseMinusT);
	        }

	        output.push(stringFromCharCode(digitToBasic(q)));
	        bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
	        delta = 0;
	        ++handledCPCount;
	      }
	    }

	    ++delta;
	    ++n;
	  }
	  return output.join('');
	};

	var stringPunycodeToAscii = function (input) {
	  var encoded = [];
	  var labels = input.toLowerCase().replace(regexSeparators, '\u002E').split('.');
	  var i, label;
	  for (i = 0; i < labels.length; i++) {
	    label = labels[i];
	    encoded.push(regexNonASCII.test(label) ? 'xn--' + encode(label) : label);
	  }
	  return encoded.join('.');
	};

	var redefineAll = function (target, src, options) {
	  for (var key in src) {
	    if (options && options.unsafe && target[key]) target[key] = src[key];
	    else redefine(target, key, src[key], options);
	  } return target;
	};

	var getIterator = function (it) {
	  var iteratorMethod = getIteratorMethod(it);
	  if (typeof iteratorMethod != 'function') {
	    throw TypeError(String(it) + ' is not iterable');
	  } return anObject(iteratorMethod.call(it));
	};

	// TODO: in core-js@4, move /modules/ dependencies to public entries for better optimization by tools like `preset-env`






















	var nativeFetch = getBuiltIn('fetch');
	var NativeRequest = getBuiltIn('Request');
	var RequestPrototype = NativeRequest && NativeRequest.prototype;
	var Headers = getBuiltIn('Headers');
	var ITERATOR$5 = wellKnownSymbol('iterator');
	var URL_SEARCH_PARAMS = 'URLSearchParams';
	var URL_SEARCH_PARAMS_ITERATOR = URL_SEARCH_PARAMS + 'Iterator';
	var setInternalState$3 = internalState.set;
	var getInternalParamsState = internalState.getterFor(URL_SEARCH_PARAMS);
	var getInternalIteratorState = internalState.getterFor(URL_SEARCH_PARAMS_ITERATOR);

	var plus = /\+/g;
	var sequences = Array(4);

	var percentSequence = function (bytes) {
	  return sequences[bytes - 1] || (sequences[bytes - 1] = RegExp('((?:%[\\da-f]{2}){' + bytes + '})', 'gi'));
	};

	var percentDecode = function (sequence) {
	  try {
	    return decodeURIComponent(sequence);
	  } catch (error) {
	    return sequence;
	  }
	};

	var deserialize = function (it) {
	  var result = it.replace(plus, ' ');
	  var bytes = 4;
	  try {
	    return decodeURIComponent(result);
	  } catch (error) {
	    while (bytes) {
	      result = result.replace(percentSequence(bytes--), percentDecode);
	    }
	    return result;
	  }
	};

	var find = /[!'()~]|%20/g;

	var replace = {
	  '!': '%21',
	  "'": '%27',
	  '(': '%28',
	  ')': '%29',
	  '~': '%7E',
	  '%20': '+'
	};

	var replacer = function (match) {
	  return replace[match];
	};

	var serialize$1 = function (it) {
	  return encodeURIComponent(it).replace(find, replacer);
	};

	var parseSearchParams = function (result, query) {
	  if (query) {
	    var attributes = query.split('&');
	    var index = 0;
	    var attribute, entry;
	    while (index < attributes.length) {
	      attribute = attributes[index++];
	      if (attribute.length) {
	        entry = attribute.split('=');
	        result.push({
	          key: deserialize(entry.shift()),
	          value: deserialize(entry.join('='))
	        });
	      }
	    }
	  }
	};

	var updateSearchParams = function (query) {
	  this.entries.length = 0;
	  parseSearchParams(this.entries, query);
	};

	var validateArgumentsLength = function (passed, required) {
	  if (passed < required) throw TypeError('Not enough arguments');
	};

	var URLSearchParamsIterator = createIteratorConstructor(function Iterator(params, kind) {
	  setInternalState$3(this, {
	    type: URL_SEARCH_PARAMS_ITERATOR,
	    iterator: getIterator(getInternalParamsState(params).entries),
	    kind: kind
	  });
	}, 'Iterator', function next() {
	  var state = getInternalIteratorState(this);
	  var kind = state.kind;
	  var step = state.iterator.next();
	  var entry = step.value;
	  if (!step.done) {
	    step.value = kind === 'keys' ? entry.key : kind === 'values' ? entry.value : [entry.key, entry.value];
	  } return step;
	});

	// `URLSearchParams` constructor
	// https://url.spec.whatwg.org/#interface-urlsearchparams
	var URLSearchParamsConstructor = function URLSearchParams(/* init */) {
	  anInstance(this, URLSearchParamsConstructor, URL_SEARCH_PARAMS);
	  var init = arguments.length > 0 ? arguments[0] : undefined;
	  var that = this;
	  var entries = [];
	  var iteratorMethod, iterator, next, step, entryIterator, entryNext, first, second, key;

	  setInternalState$3(that, {
	    type: URL_SEARCH_PARAMS,
	    entries: entries,
	    updateURL: function () { /* empty */ },
	    updateSearchParams: updateSearchParams
	  });

	  if (init !== undefined) {
	    if (isObject(init)) {
	      iteratorMethod = getIteratorMethod(init);
	      if (typeof iteratorMethod === 'function') {
	        iterator = iteratorMethod.call(init);
	        next = iterator.next;
	        while (!(step = next.call(iterator)).done) {
	          entryIterator = getIterator(anObject(step.value));
	          entryNext = entryIterator.next;
	          if (
	            (first = entryNext.call(entryIterator)).done ||
	            (second = entryNext.call(entryIterator)).done ||
	            !entryNext.call(entryIterator).done
	          ) throw TypeError('Expected sequence with length 2');
	          entries.push({ key: toString_1(first.value), value: toString_1(second.value) });
	        }
	      } else for (key in init) if (has(init, key)) entries.push({ key: key, value: toString_1(init[key]) });
	    } else {
	      parseSearchParams(
	        entries,
	        typeof init === 'string' ? init.charAt(0) === '?' ? init.slice(1) : init : toString_1(init)
	      );
	    }
	  }
	};

	var URLSearchParamsPrototype = URLSearchParamsConstructor.prototype;

	redefineAll(URLSearchParamsPrototype, {
	  // `URLSearchParams.prototype.append` method
	  // https://url.spec.whatwg.org/#dom-urlsearchparams-append
	  append: function append(name, value) {
	    validateArgumentsLength(arguments.length, 2);
	    var state = getInternalParamsState(this);
	    state.entries.push({ key: toString_1(name), value: toString_1(value) });
	    state.updateURL();
	  },
	  // `URLSearchParams.prototype.delete` method
	  // https://url.spec.whatwg.org/#dom-urlsearchparams-delete
	  'delete': function (name) {
	    validateArgumentsLength(arguments.length, 1);
	    var state = getInternalParamsState(this);
	    var entries = state.entries;
	    var key = toString_1(name);
	    var index = 0;
	    while (index < entries.length) {
	      if (entries[index].key === key) entries.splice(index, 1);
	      else index++;
	    }
	    state.updateURL();
	  },
	  // `URLSearchParams.prototype.get` method
	  // https://url.spec.whatwg.org/#dom-urlsearchparams-get
	  get: function get(name) {
	    validateArgumentsLength(arguments.length, 1);
	    var entries = getInternalParamsState(this).entries;
	    var key = toString_1(name);
	    var index = 0;
	    for (; index < entries.length; index++) {
	      if (entries[index].key === key) return entries[index].value;
	    }
	    return null;
	  },
	  // `URLSearchParams.prototype.getAll` method
	  // https://url.spec.whatwg.org/#dom-urlsearchparams-getall
	  getAll: function getAll(name) {
	    validateArgumentsLength(arguments.length, 1);
	    var entries = getInternalParamsState(this).entries;
	    var key = toString_1(name);
	    var result = [];
	    var index = 0;
	    for (; index < entries.length; index++) {
	      if (entries[index].key === key) result.push(entries[index].value);
	    }
	    return result;
	  },
	  // `URLSearchParams.prototype.has` method
	  // https://url.spec.whatwg.org/#dom-urlsearchparams-has
	  has: function has(name) {
	    validateArgumentsLength(arguments.length, 1);
	    var entries = getInternalParamsState(this).entries;
	    var key = toString_1(name);
	    var index = 0;
	    while (index < entries.length) {
	      if (entries[index++].key === key) return true;
	    }
	    return false;
	  },
	  // `URLSearchParams.prototype.set` method
	  // https://url.spec.whatwg.org/#dom-urlsearchparams-set
	  set: function set(name, value) {
	    validateArgumentsLength(arguments.length, 1);
	    var state = getInternalParamsState(this);
	    var entries = state.entries;
	    var found = false;
	    var key = toString_1(name);
	    var val = toString_1(value);
	    var index = 0;
	    var entry;
	    for (; index < entries.length; index++) {
	      entry = entries[index];
	      if (entry.key === key) {
	        if (found) entries.splice(index--, 1);
	        else {
	          found = true;
	          entry.value = val;
	        }
	      }
	    }
	    if (!found) entries.push({ key: key, value: val });
	    state.updateURL();
	  },
	  // `URLSearchParams.prototype.sort` method
	  // https://url.spec.whatwg.org/#dom-urlsearchparams-sort
	  sort: function sort() {
	    var state = getInternalParamsState(this);
	    var entries = state.entries;
	    // Array#sort is not stable in some engines
	    var slice = entries.slice();
	    var entry, entriesIndex, sliceIndex;
	    entries.length = 0;
	    for (sliceIndex = 0; sliceIndex < slice.length; sliceIndex++) {
	      entry = slice[sliceIndex];
	      for (entriesIndex = 0; entriesIndex < sliceIndex; entriesIndex++) {
	        if (entries[entriesIndex].key > entry.key) {
	          entries.splice(entriesIndex, 0, entry);
	          break;
	        }
	      }
	      if (entriesIndex === sliceIndex) entries.push(entry);
	    }
	    state.updateURL();
	  },
	  // `URLSearchParams.prototype.forEach` method
	  forEach: function forEach(callback /* , thisArg */) {
	    var entries = getInternalParamsState(this).entries;
	    var boundFunction = functionBindContext(callback, arguments.length > 1 ? arguments[1] : undefined, 3);
	    var index = 0;
	    var entry;
	    while (index < entries.length) {
	      entry = entries[index++];
	      boundFunction(entry.value, entry.key, this);
	    }
	  },
	  // `URLSearchParams.prototype.keys` method
	  keys: function keys() {
	    return new URLSearchParamsIterator(this, 'keys');
	  },
	  // `URLSearchParams.prototype.values` method
	  values: function values() {
	    return new URLSearchParamsIterator(this, 'values');
	  },
	  // `URLSearchParams.prototype.entries` method
	  entries: function entries() {
	    return new URLSearchParamsIterator(this, 'entries');
	  }
	}, { enumerable: true });

	// `URLSearchParams.prototype[@@iterator]` method
	redefine(URLSearchParamsPrototype, ITERATOR$5, URLSearchParamsPrototype.entries);

	// `URLSearchParams.prototype.toString` method
	// https://url.spec.whatwg.org/#urlsearchparams-stringification-behavior
	redefine(URLSearchParamsPrototype, 'toString', function toString() {
	  var entries = getInternalParamsState(this).entries;
	  var result = [];
	  var index = 0;
	  var entry;
	  while (index < entries.length) {
	    entry = entries[index++];
	    result.push(serialize$1(entry.key) + '=' + serialize$1(entry.value));
	  } return result.join('&');
	}, { enumerable: true });

	setToStringTag(URLSearchParamsConstructor, URL_SEARCH_PARAMS);

	_export({ global: true, forced: !nativeUrl }, {
	  URLSearchParams: URLSearchParamsConstructor
	});

	// Wrap `fetch` and `Request` for correct work with polyfilled `URLSearchParams`
	if (!nativeUrl && typeof Headers == 'function') {
	  var wrapRequestOptions = function (init) {
	    if (isObject(init)) {
	      var body = init.body;
	      var headers;
	      if (classof(body) === URL_SEARCH_PARAMS) {
	        headers = init.headers ? new Headers(init.headers) : new Headers();
	        if (!headers.has('content-type')) {
	          headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
	        }
	        return objectCreate(init, {
	          body: createPropertyDescriptor(0, String(body)),
	          headers: createPropertyDescriptor(0, headers)
	        });
	      }
	    } return init;
	  };

	  if (typeof nativeFetch == 'function') {
	    _export({ global: true, enumerable: true, forced: true }, {
	      fetch: function fetch(input /* , init */) {
	        return nativeFetch(input, arguments.length > 1 ? wrapRequestOptions(arguments[1]) : {});
	      }
	    });
	  }

	  if (typeof NativeRequest == 'function') {
	    var RequestConstructor = function Request(input /* , init */) {
	      anInstance(this, RequestConstructor, 'Request');
	      return new NativeRequest(input, arguments.length > 1 ? wrapRequestOptions(arguments[1]) : {});
	    };

	    RequestPrototype.constructor = RequestConstructor;
	    RequestConstructor.prototype = RequestPrototype;

	    _export({ global: true, forced: true }, {
	      Request: RequestConstructor
	    });
	  }
	}

	var web_urlSearchParams = {
	  URLSearchParams: URLSearchParamsConstructor,
	  getState: getInternalParamsState
	};

	// TODO: in core-js@4, move /modules/ dependencies to public entries for better optimization by tools like `preset-env`











	var codeAt = stringMultibyte.codeAt;






	var NativeURL = global_1.URL;
	var URLSearchParams$1 = web_urlSearchParams.URLSearchParams;
	var getInternalSearchParamsState = web_urlSearchParams.getState;
	var setInternalState$4 = internalState.set;
	var getInternalURLState = internalState.getterFor('URL');
	var floor$2 = Math.floor;
	var pow = Math.pow;

	var INVALID_AUTHORITY = 'Invalid authority';
	var INVALID_SCHEME = 'Invalid scheme';
	var INVALID_HOST = 'Invalid host';
	var INVALID_PORT = 'Invalid port';

	var ALPHA = /[A-Za-z]/;
	// eslint-disable-next-line regexp/no-obscure-range -- safe
	var ALPHANUMERIC = /[\d+-.A-Za-z]/;
	var DIGIT = /\d/;
	var HEX_START = /^0x/i;
	var OCT = /^[0-7]+$/;
	var DEC = /^\d+$/;
	var HEX = /^[\dA-Fa-f]+$/;
	/* eslint-disable no-control-regex -- safe */
	var FORBIDDEN_HOST_CODE_POINT = /[\0\t\n\r #%/:<>?@[\\\]^|]/;
	var FORBIDDEN_HOST_CODE_POINT_EXCLUDING_PERCENT = /[\0\t\n\r #/:<>?@[\\\]^|]/;
	var LEADING_AND_TRAILING_C0_CONTROL_OR_SPACE = /^[\u0000-\u0020]+|[\u0000-\u0020]+$/g;
	var TAB_AND_NEW_LINE = /[\t\n\r]/g;
	/* eslint-enable no-control-regex -- safe */
	var EOF;

	var parseHost = function (url, input) {
	  var result, codePoints, index;
	  if (input.charAt(0) == '[') {
	    if (input.charAt(input.length - 1) != ']') return INVALID_HOST;
	    result = parseIPv6(input.slice(1, -1));
	    if (!result) return INVALID_HOST;
	    url.host = result;
	  // opaque host
	  } else if (!isSpecial(url)) {
	    if (FORBIDDEN_HOST_CODE_POINT_EXCLUDING_PERCENT.test(input)) return INVALID_HOST;
	    result = '';
	    codePoints = arrayFrom(input);
	    for (index = 0; index < codePoints.length; index++) {
	      result += percentEncode(codePoints[index], C0ControlPercentEncodeSet);
	    }
	    url.host = result;
	  } else {
	    input = stringPunycodeToAscii(input);
	    if (FORBIDDEN_HOST_CODE_POINT.test(input)) return INVALID_HOST;
	    result = parseIPv4(input);
	    if (result === null) return INVALID_HOST;
	    url.host = result;
	  }
	};

	var parseIPv4 = function (input) {
	  var parts = input.split('.');
	  var partsLength, numbers, index, part, radix, number, ipv4;
	  if (parts.length && parts[parts.length - 1] == '') {
	    parts.pop();
	  }
	  partsLength = parts.length;
	  if (partsLength > 4) return input;
	  numbers = [];
	  for (index = 0; index < partsLength; index++) {
	    part = parts[index];
	    if (part == '') return input;
	    radix = 10;
	    if (part.length > 1 && part.charAt(0) == '0') {
	      radix = HEX_START.test(part) ? 16 : 8;
	      part = part.slice(radix == 8 ? 1 : 2);
	    }
	    if (part === '') {
	      number = 0;
	    } else {
	      if (!(radix == 10 ? DEC : radix == 8 ? OCT : HEX).test(part)) return input;
	      number = parseInt(part, radix);
	    }
	    numbers.push(number);
	  }
	  for (index = 0; index < partsLength; index++) {
	    number = numbers[index];
	    if (index == partsLength - 1) {
	      if (number >= pow(256, 5 - partsLength)) return null;
	    } else if (number > 255) return null;
	  }
	  ipv4 = numbers.pop();
	  for (index = 0; index < numbers.length; index++) {
	    ipv4 += numbers[index] * pow(256, 3 - index);
	  }
	  return ipv4;
	};

	// eslint-disable-next-line max-statements -- TODO
	var parseIPv6 = function (input) {
	  var address = [0, 0, 0, 0, 0, 0, 0, 0];
	  var pieceIndex = 0;
	  var compress = null;
	  var pointer = 0;
	  var value, length, numbersSeen, ipv4Piece, number, swaps, swap;

	  var char = function () {
	    return input.charAt(pointer);
	  };

	  if (char() == ':') {
	    if (input.charAt(1) != ':') return;
	    pointer += 2;
	    pieceIndex++;
	    compress = pieceIndex;
	  }
	  while (char()) {
	    if (pieceIndex == 8) return;
	    if (char() == ':') {
	      if (compress !== null) return;
	      pointer++;
	      pieceIndex++;
	      compress = pieceIndex;
	      continue;
	    }
	    value = length = 0;
	    while (length < 4 && HEX.test(char())) {
	      value = value * 16 + parseInt(char(), 16);
	      pointer++;
	      length++;
	    }
	    if (char() == '.') {
	      if (length == 0) return;
	      pointer -= length;
	      if (pieceIndex > 6) return;
	      numbersSeen = 0;
	      while (char()) {
	        ipv4Piece = null;
	        if (numbersSeen > 0) {
	          if (char() == '.' && numbersSeen < 4) pointer++;
	          else return;
	        }
	        if (!DIGIT.test(char())) return;
	        while (DIGIT.test(char())) {
	          number = parseInt(char(), 10);
	          if (ipv4Piece === null) ipv4Piece = number;
	          else if (ipv4Piece == 0) return;
	          else ipv4Piece = ipv4Piece * 10 + number;
	          if (ipv4Piece > 255) return;
	          pointer++;
	        }
	        address[pieceIndex] = address[pieceIndex] * 256 + ipv4Piece;
	        numbersSeen++;
	        if (numbersSeen == 2 || numbersSeen == 4) pieceIndex++;
	      }
	      if (numbersSeen != 4) return;
	      break;
	    } else if (char() == ':') {
	      pointer++;
	      if (!char()) return;
	    } else if (char()) return;
	    address[pieceIndex++] = value;
	  }
	  if (compress !== null) {
	    swaps = pieceIndex - compress;
	    pieceIndex = 7;
	    while (pieceIndex != 0 && swaps > 0) {
	      swap = address[pieceIndex];
	      address[pieceIndex--] = address[compress + swaps - 1];
	      address[compress + --swaps] = swap;
	    }
	  } else if (pieceIndex != 8) return;
	  return address;
	};

	var findLongestZeroSequence = function (ipv6) {
	  var maxIndex = null;
	  var maxLength = 1;
	  var currStart = null;
	  var currLength = 0;
	  var index = 0;
	  for (; index < 8; index++) {
	    if (ipv6[index] !== 0) {
	      if (currLength > maxLength) {
	        maxIndex = currStart;
	        maxLength = currLength;
	      }
	      currStart = null;
	      currLength = 0;
	    } else {
	      if (currStart === null) currStart = index;
	      ++currLength;
	    }
	  }
	  if (currLength > maxLength) {
	    maxIndex = currStart;
	    maxLength = currLength;
	  }
	  return maxIndex;
	};

	var serializeHost = function (host) {
	  var result, index, compress, ignore0;
	  // ipv4
	  if (typeof host == 'number') {
	    result = [];
	    for (index = 0; index < 4; index++) {
	      result.unshift(host % 256);
	      host = floor$2(host / 256);
	    } return result.join('.');
	  // ipv6
	  } else if (typeof host == 'object') {
	    result = '';
	    compress = findLongestZeroSequence(host);
	    for (index = 0; index < 8; index++) {
	      if (ignore0 && host[index] === 0) continue;
	      if (ignore0) ignore0 = false;
	      if (compress === index) {
	        result += index ? ':' : '::';
	        ignore0 = true;
	      } else {
	        result += host[index].toString(16);
	        if (index < 7) result += ':';
	      }
	    }
	    return '[' + result + ']';
	  } return host;
	};

	var C0ControlPercentEncodeSet = {};
	var fragmentPercentEncodeSet = objectAssign({}, C0ControlPercentEncodeSet, {
	  ' ': 1, '"': 1, '<': 1, '>': 1, '`': 1
	});
	var pathPercentEncodeSet = objectAssign({}, fragmentPercentEncodeSet, {
	  '#': 1, '?': 1, '{': 1, '}': 1
	});
	var userinfoPercentEncodeSet = objectAssign({}, pathPercentEncodeSet, {
	  '/': 1, ':': 1, ';': 1, '=': 1, '@': 1, '[': 1, '\\': 1, ']': 1, '^': 1, '|': 1
	});

	var percentEncode = function (char, set) {
	  var code = codeAt(char, 0);
	  return code > 0x20 && code < 0x7F && !has(set, char) ? char : encodeURIComponent(char);
	};

	var specialSchemes = {
	  ftp: 21,
	  file: null,
	  http: 80,
	  https: 443,
	  ws: 80,
	  wss: 443
	};

	var isSpecial = function (url) {
	  return has(specialSchemes, url.scheme);
	};

	var includesCredentials = function (url) {
	  return url.username != '' || url.password != '';
	};

	var cannotHaveUsernamePasswordPort = function (url) {
	  return !url.host || url.cannotBeABaseURL || url.scheme == 'file';
	};

	var isWindowsDriveLetter = function (string, normalized) {
	  var second;
	  return string.length == 2 && ALPHA.test(string.charAt(0))
	    && ((second = string.charAt(1)) == ':' || (!normalized && second == '|'));
	};

	var startsWithWindowsDriveLetter = function (string) {
	  var third;
	  return string.length > 1 && isWindowsDriveLetter(string.slice(0, 2)) && (
	    string.length == 2 ||
	    ((third = string.charAt(2)) === '/' || third === '\\' || third === '?' || third === '#')
	  );
	};

	var shortenURLsPath = function (url) {
	  var path = url.path;
	  var pathSize = path.length;
	  if (pathSize && (url.scheme != 'file' || pathSize != 1 || !isWindowsDriveLetter(path[0], true))) {
	    path.pop();
	  }
	};

	var isSingleDot = function (segment) {
	  return segment === '.' || segment.toLowerCase() === '%2e';
	};

	var isDoubleDot = function (segment) {
	  segment = segment.toLowerCase();
	  return segment === '..' || segment === '%2e.' || segment === '.%2e' || segment === '%2e%2e';
	};

	// States:
	var SCHEME_START = {};
	var SCHEME = {};
	var NO_SCHEME = {};
	var SPECIAL_RELATIVE_OR_AUTHORITY = {};
	var PATH_OR_AUTHORITY = {};
	var RELATIVE = {};
	var RELATIVE_SLASH = {};
	var SPECIAL_AUTHORITY_SLASHES = {};
	var SPECIAL_AUTHORITY_IGNORE_SLASHES = {};
	var AUTHORITY = {};
	var HOST = {};
	var HOSTNAME = {};
	var PORT = {};
	var FILE = {};
	var FILE_SLASH = {};
	var FILE_HOST = {};
	var PATH_START = {};
	var PATH = {};
	var CANNOT_BE_A_BASE_URL_PATH = {};
	var QUERY = {};
	var FRAGMENT = {};

	// eslint-disable-next-line max-statements -- TODO
	var parseURL = function (url, input, stateOverride, base) {
	  var state = stateOverride || SCHEME_START;
	  var pointer = 0;
	  var buffer = '';
	  var seenAt = false;
	  var seenBracket = false;
	  var seenPasswordToken = false;
	  var codePoints, char, bufferCodePoints, failure;

	  if (!stateOverride) {
	    url.scheme = '';
	    url.username = '';
	    url.password = '';
	    url.host = null;
	    url.port = null;
	    url.path = [];
	    url.query = null;
	    url.fragment = null;
	    url.cannotBeABaseURL = false;
	    input = input.replace(LEADING_AND_TRAILING_C0_CONTROL_OR_SPACE, '');
	  }

	  input = input.replace(TAB_AND_NEW_LINE, '');

	  codePoints = arrayFrom(input);

	  while (pointer <= codePoints.length) {
	    char = codePoints[pointer];
	    switch (state) {
	      case SCHEME_START:
	        if (char && ALPHA.test(char)) {
	          buffer += char.toLowerCase();
	          state = SCHEME;
	        } else if (!stateOverride) {
	          state = NO_SCHEME;
	          continue;
	        } else return INVALID_SCHEME;
	        break;

	      case SCHEME:
	        if (char && (ALPHANUMERIC.test(char) || char == '+' || char == '-' || char == '.')) {
	          buffer += char.toLowerCase();
	        } else if (char == ':') {
	          if (stateOverride && (
	            (isSpecial(url) != has(specialSchemes, buffer)) ||
	            (buffer == 'file' && (includesCredentials(url) || url.port !== null)) ||
	            (url.scheme == 'file' && !url.host)
	          )) return;
	          url.scheme = buffer;
	          if (stateOverride) {
	            if (isSpecial(url) && specialSchemes[url.scheme] == url.port) url.port = null;
	            return;
	          }
	          buffer = '';
	          if (url.scheme == 'file') {
	            state = FILE;
	          } else if (isSpecial(url) && base && base.scheme == url.scheme) {
	            state = SPECIAL_RELATIVE_OR_AUTHORITY;
	          } else if (isSpecial(url)) {
	            state = SPECIAL_AUTHORITY_SLASHES;
	          } else if (codePoints[pointer + 1] == '/') {
	            state = PATH_OR_AUTHORITY;
	            pointer++;
	          } else {
	            url.cannotBeABaseURL = true;
	            url.path.push('');
	            state = CANNOT_BE_A_BASE_URL_PATH;
	          }
	        } else if (!stateOverride) {
	          buffer = '';
	          state = NO_SCHEME;
	          pointer = 0;
	          continue;
	        } else return INVALID_SCHEME;
	        break;

	      case NO_SCHEME:
	        if (!base || (base.cannotBeABaseURL && char != '#')) return INVALID_SCHEME;
	        if (base.cannotBeABaseURL && char == '#') {
	          url.scheme = base.scheme;
	          url.path = base.path.slice();
	          url.query = base.query;
	          url.fragment = '';
	          url.cannotBeABaseURL = true;
	          state = FRAGMENT;
	          break;
	        }
	        state = base.scheme == 'file' ? FILE : RELATIVE;
	        continue;

	      case SPECIAL_RELATIVE_OR_AUTHORITY:
	        if (char == '/' && codePoints[pointer + 1] == '/') {
	          state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
	          pointer++;
	        } else {
	          state = RELATIVE;
	          continue;
	        } break;

	      case PATH_OR_AUTHORITY:
	        if (char == '/') {
	          state = AUTHORITY;
	          break;
	        } else {
	          state = PATH;
	          continue;
	        }

	      case RELATIVE:
	        url.scheme = base.scheme;
	        if (char == EOF) {
	          url.username = base.username;
	          url.password = base.password;
	          url.host = base.host;
	          url.port = base.port;
	          url.path = base.path.slice();
	          url.query = base.query;
	        } else if (char == '/' || (char == '\\' && isSpecial(url))) {
	          state = RELATIVE_SLASH;
	        } else if (char == '?') {
	          url.username = base.username;
	          url.password = base.password;
	          url.host = base.host;
	          url.port = base.port;
	          url.path = base.path.slice();
	          url.query = '';
	          state = QUERY;
	        } else if (char == '#') {
	          url.username = base.username;
	          url.password = base.password;
	          url.host = base.host;
	          url.port = base.port;
	          url.path = base.path.slice();
	          url.query = base.query;
	          url.fragment = '';
	          state = FRAGMENT;
	        } else {
	          url.username = base.username;
	          url.password = base.password;
	          url.host = base.host;
	          url.port = base.port;
	          url.path = base.path.slice();
	          url.path.pop();
	          state = PATH;
	          continue;
	        } break;

	      case RELATIVE_SLASH:
	        if (isSpecial(url) && (char == '/' || char == '\\')) {
	          state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
	        } else if (char == '/') {
	          state = AUTHORITY;
	        } else {
	          url.username = base.username;
	          url.password = base.password;
	          url.host = base.host;
	          url.port = base.port;
	          state = PATH;
	          continue;
	        } break;

	      case SPECIAL_AUTHORITY_SLASHES:
	        state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
	        if (char != '/' || buffer.charAt(pointer + 1) != '/') continue;
	        pointer++;
	        break;

	      case SPECIAL_AUTHORITY_IGNORE_SLASHES:
	        if (char != '/' && char != '\\') {
	          state = AUTHORITY;
	          continue;
	        } break;

	      case AUTHORITY:
	        if (char == '@') {
	          if (seenAt) buffer = '%40' + buffer;
	          seenAt = true;
	          bufferCodePoints = arrayFrom(buffer);
	          for (var i = 0; i < bufferCodePoints.length; i++) {
	            var codePoint = bufferCodePoints[i];
	            if (codePoint == ':' && !seenPasswordToken) {
	              seenPasswordToken = true;
	              continue;
	            }
	            var encodedCodePoints = percentEncode(codePoint, userinfoPercentEncodeSet);
	            if (seenPasswordToken) url.password += encodedCodePoints;
	            else url.username += encodedCodePoints;
	          }
	          buffer = '';
	        } else if (
	          char == EOF || char == '/' || char == '?' || char == '#' ||
	          (char == '\\' && isSpecial(url))
	        ) {
	          if (seenAt && buffer == '') return INVALID_AUTHORITY;
	          pointer -= arrayFrom(buffer).length + 1;
	          buffer = '';
	          state = HOST;
	        } else buffer += char;
	        break;

	      case HOST:
	      case HOSTNAME:
	        if (stateOverride && url.scheme == 'file') {
	          state = FILE_HOST;
	          continue;
	        } else if (char == ':' && !seenBracket) {
	          if (buffer == '') return INVALID_HOST;
	          failure = parseHost(url, buffer);
	          if (failure) return failure;
	          buffer = '';
	          state = PORT;
	          if (stateOverride == HOSTNAME) return;
	        } else if (
	          char == EOF || char == '/' || char == '?' || char == '#' ||
	          (char == '\\' && isSpecial(url))
	        ) {
	          if (isSpecial(url) && buffer == '') return INVALID_HOST;
	          if (stateOverride && buffer == '' && (includesCredentials(url) || url.port !== null)) return;
	          failure = parseHost(url, buffer);
	          if (failure) return failure;
	          buffer = '';
	          state = PATH_START;
	          if (stateOverride) return;
	          continue;
	        } else {
	          if (char == '[') seenBracket = true;
	          else if (char == ']') seenBracket = false;
	          buffer += char;
	        } break;

	      case PORT:
	        if (DIGIT.test(char)) {
	          buffer += char;
	        } else if (
	          char == EOF || char == '/' || char == '?' || char == '#' ||
	          (char == '\\' && isSpecial(url)) ||
	          stateOverride
	        ) {
	          if (buffer != '') {
	            var port = parseInt(buffer, 10);
	            if (port > 0xFFFF) return INVALID_PORT;
	            url.port = (isSpecial(url) && port === specialSchemes[url.scheme]) ? null : port;
	            buffer = '';
	          }
	          if (stateOverride) return;
	          state = PATH_START;
	          continue;
	        } else return INVALID_PORT;
	        break;

	      case FILE:
	        url.scheme = 'file';
	        if (char == '/' || char == '\\') state = FILE_SLASH;
	        else if (base && base.scheme == 'file') {
	          if (char == EOF) {
	            url.host = base.host;
	            url.path = base.path.slice();
	            url.query = base.query;
	          } else if (char == '?') {
	            url.host = base.host;
	            url.path = base.path.slice();
	            url.query = '';
	            state = QUERY;
	          } else if (char == '#') {
	            url.host = base.host;
	            url.path = base.path.slice();
	            url.query = base.query;
	            url.fragment = '';
	            state = FRAGMENT;
	          } else {
	            if (!startsWithWindowsDriveLetter(codePoints.slice(pointer).join(''))) {
	              url.host = base.host;
	              url.path = base.path.slice();
	              shortenURLsPath(url);
	            }
	            state = PATH;
	            continue;
	          }
	        } else {
	          state = PATH;
	          continue;
	        } break;

	      case FILE_SLASH:
	        if (char == '/' || char == '\\') {
	          state = FILE_HOST;
	          break;
	        }
	        if (base && base.scheme == 'file' && !startsWithWindowsDriveLetter(codePoints.slice(pointer).join(''))) {
	          if (isWindowsDriveLetter(base.path[0], true)) url.path.push(base.path[0]);
	          else url.host = base.host;
	        }
	        state = PATH;
	        continue;

	      case FILE_HOST:
	        if (char == EOF || char == '/' || char == '\\' || char == '?' || char == '#') {
	          if (!stateOverride && isWindowsDriveLetter(buffer)) {
	            state = PATH;
	          } else if (buffer == '') {
	            url.host = '';
	            if (stateOverride) return;
	            state = PATH_START;
	          } else {
	            failure = parseHost(url, buffer);
	            if (failure) return failure;
	            if (url.host == 'localhost') url.host = '';
	            if (stateOverride) return;
	            buffer = '';
	            state = PATH_START;
	          } continue;
	        } else buffer += char;
	        break;

	      case PATH_START:
	        if (isSpecial(url)) {
	          state = PATH;
	          if (char != '/' && char != '\\') continue;
	        } else if (!stateOverride && char == '?') {
	          url.query = '';
	          state = QUERY;
	        } else if (!stateOverride && char == '#') {
	          url.fragment = '';
	          state = FRAGMENT;
	        } else if (char != EOF) {
	          state = PATH;
	          if (char != '/') continue;
	        } break;

	      case PATH:
	        if (
	          char == EOF || char == '/' ||
	          (char == '\\' && isSpecial(url)) ||
	          (!stateOverride && (char == '?' || char == '#'))
	        ) {
	          if (isDoubleDot(buffer)) {
	            shortenURLsPath(url);
	            if (char != '/' && !(char == '\\' && isSpecial(url))) {
	              url.path.push('');
	            }
	          } else if (isSingleDot(buffer)) {
	            if (char != '/' && !(char == '\\' && isSpecial(url))) {
	              url.path.push('');
	            }
	          } else {
	            if (url.scheme == 'file' && !url.path.length && isWindowsDriveLetter(buffer)) {
	              if (url.host) url.host = '';
	              buffer = buffer.charAt(0) + ':'; // normalize windows drive letter
	            }
	            url.path.push(buffer);
	          }
	          buffer = '';
	          if (url.scheme == 'file' && (char == EOF || char == '?' || char == '#')) {
	            while (url.path.length > 1 && url.path[0] === '') {
	              url.path.shift();
	            }
	          }
	          if (char == '?') {
	            url.query = '';
	            state = QUERY;
	          } else if (char == '#') {
	            url.fragment = '';
	            state = FRAGMENT;
	          }
	        } else {
	          buffer += percentEncode(char, pathPercentEncodeSet);
	        } break;

	      case CANNOT_BE_A_BASE_URL_PATH:
	        if (char == '?') {
	          url.query = '';
	          state = QUERY;
	        } else if (char == '#') {
	          url.fragment = '';
	          state = FRAGMENT;
	        } else if (char != EOF) {
	          url.path[0] += percentEncode(char, C0ControlPercentEncodeSet);
	        } break;

	      case QUERY:
	        if (!stateOverride && char == '#') {
	          url.fragment = '';
	          state = FRAGMENT;
	        } else if (char != EOF) {
	          if (char == "'" && isSpecial(url)) url.query += '%27';
	          else if (char == '#') url.query += '%23';
	          else url.query += percentEncode(char, C0ControlPercentEncodeSet);
	        } break;

	      case FRAGMENT:
	        if (char != EOF) url.fragment += percentEncode(char, fragmentPercentEncodeSet);
	        break;
	    }

	    pointer++;
	  }
	};

	// `URL` constructor
	// https://url.spec.whatwg.org/#url-class
	var URLConstructor = function URL(url /* , base */) {
	  var that = anInstance(this, URLConstructor, 'URL');
	  var base = arguments.length > 1 ? arguments[1] : undefined;
	  var urlString = toString_1(url);
	  var state = setInternalState$4(that, { type: 'URL' });
	  var baseState, failure;
	  if (base !== undefined) {
	    if (base instanceof URLConstructor) baseState = getInternalURLState(base);
	    else {
	      failure = parseURL(baseState = {}, toString_1(base));
	      if (failure) throw TypeError(failure);
	    }
	  }
	  failure = parseURL(state, urlString, null, baseState);
	  if (failure) throw TypeError(failure);
	  var searchParams = state.searchParams = new URLSearchParams$1();
	  var searchParamsState = getInternalSearchParamsState(searchParams);
	  searchParamsState.updateSearchParams(state.query);
	  searchParamsState.updateURL = function () {
	    state.query = String(searchParams) || null;
	  };
	  if (!descriptors) {
	    that.href = serializeURL.call(that);
	    that.origin = getOrigin.call(that);
	    that.protocol = getProtocol.call(that);
	    that.username = getUsername.call(that);
	    that.password = getPassword.call(that);
	    that.host = getHost.call(that);
	    that.hostname = getHostname.call(that);
	    that.port = getPort.call(that);
	    that.pathname = getPathname.call(that);
	    that.search = getSearch.call(that);
	    that.searchParams = getSearchParams.call(that);
	    that.hash = getHash.call(that);
	  }
	};

	var URLPrototype = URLConstructor.prototype;

	var serializeURL = function () {
	  var url = getInternalURLState(this);
	  var scheme = url.scheme;
	  var username = url.username;
	  var password = url.password;
	  var host = url.host;
	  var port = url.port;
	  var path = url.path;
	  var query = url.query;
	  var fragment = url.fragment;
	  var output = scheme + ':';
	  if (host !== null) {
	    output += '//';
	    if (includesCredentials(url)) {
	      output += username + (password ? ':' + password : '') + '@';
	    }
	    output += serializeHost(host);
	    if (port !== null) output += ':' + port;
	  } else if (scheme == 'file') output += '//';
	  output += url.cannotBeABaseURL ? path[0] : path.length ? '/' + path.join('/') : '';
	  if (query !== null) output += '?' + query;
	  if (fragment !== null) output += '#' + fragment;
	  return output;
	};

	var getOrigin = function () {
	  var url = getInternalURLState(this);
	  var scheme = url.scheme;
	  var port = url.port;
	  if (scheme == 'blob') try {
	    return new URLConstructor(scheme.path[0]).origin;
	  } catch (error) {
	    return 'null';
	  }
	  if (scheme == 'file' || !isSpecial(url)) return 'null';
	  return scheme + '://' + serializeHost(url.host) + (port !== null ? ':' + port : '');
	};

	var getProtocol = function () {
	  return getInternalURLState(this).scheme + ':';
	};

	var getUsername = function () {
	  return getInternalURLState(this).username;
	};

	var getPassword = function () {
	  return getInternalURLState(this).password;
	};

	var getHost = function () {
	  var url = getInternalURLState(this);
	  var host = url.host;
	  var port = url.port;
	  return host === null ? ''
	    : port === null ? serializeHost(host)
	    : serializeHost(host) + ':' + port;
	};

	var getHostname = function () {
	  var host = getInternalURLState(this).host;
	  return host === null ? '' : serializeHost(host);
	};

	var getPort = function () {
	  var port = getInternalURLState(this).port;
	  return port === null ? '' : String(port);
	};

	var getPathname = function () {
	  var url = getInternalURLState(this);
	  var path = url.path;
	  return url.cannotBeABaseURL ? path[0] : path.length ? '/' + path.join('/') : '';
	};

	var getSearch = function () {
	  var query = getInternalURLState(this).query;
	  return query ? '?' + query : '';
	};

	var getSearchParams = function () {
	  return getInternalURLState(this).searchParams;
	};

	var getHash = function () {
	  var fragment = getInternalURLState(this).fragment;
	  return fragment ? '#' + fragment : '';
	};

	var accessorDescriptor = function (getter, setter) {
	  return { get: getter, set: setter, configurable: true, enumerable: true };
	};

	if (descriptors) {
	  objectDefineProperties(URLPrototype, {
	    // `URL.prototype.href` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-href
	    href: accessorDescriptor(serializeURL, function (href) {
	      var url = getInternalURLState(this);
	      var urlString = toString_1(href);
	      var failure = parseURL(url, urlString);
	      if (failure) throw TypeError(failure);
	      getInternalSearchParamsState(url.searchParams).updateSearchParams(url.query);
	    }),
	    // `URL.prototype.origin` getter
	    // https://url.spec.whatwg.org/#dom-url-origin
	    origin: accessorDescriptor(getOrigin),
	    // `URL.prototype.protocol` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-protocol
	    protocol: accessorDescriptor(getProtocol, function (protocol) {
	      var url = getInternalURLState(this);
	      parseURL(url, toString_1(protocol) + ':', SCHEME_START);
	    }),
	    // `URL.prototype.username` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-username
	    username: accessorDescriptor(getUsername, function (username) {
	      var url = getInternalURLState(this);
	      var codePoints = arrayFrom(toString_1(username));
	      if (cannotHaveUsernamePasswordPort(url)) return;
	      url.username = '';
	      for (var i = 0; i < codePoints.length; i++) {
	        url.username += percentEncode(codePoints[i], userinfoPercentEncodeSet);
	      }
	    }),
	    // `URL.prototype.password` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-password
	    password: accessorDescriptor(getPassword, function (password) {
	      var url = getInternalURLState(this);
	      var codePoints = arrayFrom(toString_1(password));
	      if (cannotHaveUsernamePasswordPort(url)) return;
	      url.password = '';
	      for (var i = 0; i < codePoints.length; i++) {
	        url.password += percentEncode(codePoints[i], userinfoPercentEncodeSet);
	      }
	    }),
	    // `URL.prototype.host` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-host
	    host: accessorDescriptor(getHost, function (host) {
	      var url = getInternalURLState(this);
	      if (url.cannotBeABaseURL) return;
	      parseURL(url, toString_1(host), HOST);
	    }),
	    // `URL.prototype.hostname` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-hostname
	    hostname: accessorDescriptor(getHostname, function (hostname) {
	      var url = getInternalURLState(this);
	      if (url.cannotBeABaseURL) return;
	      parseURL(url, toString_1(hostname), HOSTNAME);
	    }),
	    // `URL.prototype.port` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-port
	    port: accessorDescriptor(getPort, function (port) {
	      var url = getInternalURLState(this);
	      if (cannotHaveUsernamePasswordPort(url)) return;
	      port = toString_1(port);
	      if (port == '') url.port = null;
	      else parseURL(url, port, PORT);
	    }),
	    // `URL.prototype.pathname` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-pathname
	    pathname: accessorDescriptor(getPathname, function (pathname) {
	      var url = getInternalURLState(this);
	      if (url.cannotBeABaseURL) return;
	      url.path = [];
	      parseURL(url, toString_1(pathname), PATH_START);
	    }),
	    // `URL.prototype.search` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-search
	    search: accessorDescriptor(getSearch, function (search) {
	      var url = getInternalURLState(this);
	      search = toString_1(search);
	      if (search == '') {
	        url.query = null;
	      } else {
	        if ('?' == search.charAt(0)) search = search.slice(1);
	        url.query = '';
	        parseURL(url, search, QUERY);
	      }
	      getInternalSearchParamsState(url.searchParams).updateSearchParams(url.query);
	    }),
	    // `URL.prototype.searchParams` getter
	    // https://url.spec.whatwg.org/#dom-url-searchparams
	    searchParams: accessorDescriptor(getSearchParams),
	    // `URL.prototype.hash` accessors pair
	    // https://url.spec.whatwg.org/#dom-url-hash
	    hash: accessorDescriptor(getHash, function (hash) {
	      var url = getInternalURLState(this);
	      hash = toString_1(hash);
	      if (hash == '') {
	        url.fragment = null;
	        return;
	      }
	      if ('#' == hash.charAt(0)) hash = hash.slice(1);
	      url.fragment = '';
	      parseURL(url, hash, FRAGMENT);
	    })
	  });
	}

	// `URL.prototype.toJSON` method
	// https://url.spec.whatwg.org/#dom-url-tojson
	redefine(URLPrototype, 'toJSON', function toJSON() {
	  return serializeURL.call(this);
	}, { enumerable: true });

	// `URL.prototype.toString` method
	// https://url.spec.whatwg.org/#URL-stringification-behavior
	redefine(URLPrototype, 'toString', function toString() {
	  return serializeURL.call(this);
	}, { enumerable: true });

	if (NativeURL) {
	  var nativeCreateObjectURL = NativeURL.createObjectURL;
	  var nativeRevokeObjectURL = NativeURL.revokeObjectURL;
	  // `URL.createObjectURL` method
	  // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
	  // eslint-disable-next-line no-unused-vars -- required for `.length`
	  if (nativeCreateObjectURL) redefine(URLConstructor, 'createObjectURL', function createObjectURL(blob) {
	    return nativeCreateObjectURL.apply(NativeURL, arguments);
	  });
	  // `URL.revokeObjectURL` method
	  // https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
	  // eslint-disable-next-line no-unused-vars -- required for `.length`
	  if (nativeRevokeObjectURL) redefine(URLConstructor, 'revokeObjectURL', function revokeObjectURL(url) {
	    return nativeRevokeObjectURL.apply(NativeURL, arguments);
	  });
	}

	setToStringTag(URLConstructor, 'URL');

	_export({ global: true, forced: !nativeUrl, sham: !descriptors }, {
	  URL: URLConstructor
	});

	var url = path.URL;

	var url$1 = url;

	var url$2 = url$1;

	var _ref = window,
	    MediaRecorder = _ref.MediaRecorder;
	var mediaRecorder;
	var recordedBlobs; //const mimeType = 'video/mp4 codecs="avc1.424028, mp4a.40.2"'

	var mimeType = 'video/webm';
	var fileName = 'test.webm';

	function handleDataAvailable(event) {
	  if (event.data && event.data.size > 0) {
	    recordedBlobs.push(event.data);
	  }
	}

	function handlerError(e) {
	  console.log('error', e);
	}

	function download() {
	  var blob = new Blob(recordedBlobs, {
	    type: mimeType
	  });

	  var url = url$2.createObjectURL(blob);

	  var a = document.createElement('a');
	  a.style.display = 'none';
	  a.href = url;
	  a.download = fileName;
	  document.body.appendChild(a);
	  a.click();

	  setTimeout$1(function () {
	    document.body.removeChild(a);

	    url$2.revokeObjectURL(url);
	  }, 100);
	} // The nested try blocks will be simplified when Chrome 47 moves to Stable

	function startRecording(stream) {
	  var options = {
	    mimeType: mimeType
	  };
	  recordedBlobs = [];

	  try {
	    mediaRecorder = new MediaRecorder(stream, options);
	  } catch (e0) {
	    console.log('Unable to create MediaRecorder with options Object: ', e0);

	    try {
	      options = {
	        mimeType: 'video/webm,codecs=vp9'
	      };
	      mediaRecorder = new MediaRecorder(stream, options);
	    } catch (e1) {
	      console.log('Unable to create MediaRecorder with options Object: ', e1);

	      try {
	        options = 'video/vp8'; // Chrome 47

	        mediaRecorder = new MediaRecorder(stream, options);
	      } catch (e2) {
	        console.error('浏览器不支持MediaRecorder \n\n' + '请使用火狐浏览器29以上版本, 或者谷歌浏览器47以上版本。 ');
	        console.error('Exception while creating MediaRecorder:', e2);
	        return;
	      }
	    }
	  }

	  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
	  mediaRecorder.onerror = handlerError;
	  mediaRecorder.onstop = download;
	  mediaRecorder.ondataavailable = handleDataAvailable;

	  try {
	    mediaRecorder.start(100); // collect 100ms of data
	  } catch (e) {
	    console.error('录制失败:', e.message);
	  }

	  console.log('MediaRecorder started', mediaRecorder);
	}
	function stopRecording() {
	  mediaRecorder.stop();
	  console.log('Recorded Blobs: ', recordedBlobs);
	}

	function recordMixin(YunliVjsPlayer) {
	  var recordTime = 0;
	  var recordTimer = null; //录像状态提示

	  var recordFlag = document.createElement('div');
	  recordFlag.innerHTML = "<div class=\"vjs-recording-text\">REC:</div>\n    <div class=\"vjs-recording-count\">00:00</div>\n    <div class=\"vjs-recording-dot\"></div>";
	  recordFlag.classList.add('vjs-recording-flag'); //控制按钮对象

	  var recordBtn;
	  /**
	   * 控制条中添加录制按钮
	   */

	  YunliVjsPlayer.prototype._addRecordButton = function () {
	    var this_ = this;
	    this_.recording = false;
	    var Button = videojs.getComponent('Button');
	    recordBtn = videojs.extend(Button, {
	      constructor: function constructor() {
	        Button.apply(this, arguments);
	        this.controlText('Record');
	      },
	      handleClick: function handleClick() {
	        console.log('el', this.el_.querySelector('.vjs-control-text'));

	        if (this_.recording) {
	          this_.stopRecording();
	        } else {
	          this_.startRecording();
	        }
	      },
	      buildCSSClass: function buildCSSClass() {
	        return 'vjs-yunli-record vjs-control vjs-button';
	      }
	    });
	    videojs.registerComponent('recordButton', recordBtn);
	  };

	  YunliVjsPlayer.prototype._updateRecordTime = function () {
	    var _this = this;

	    if (!this.recording) {
	      clearTimeout(recordTimer);
	      return;
	    }

	    recordTime += 200;
	    recordFlag.querySelector('.vjs-recording-count').innerHTML = formatTime(recordTime / 1000);
	    recordTimer = setTimeout$1(function () {
	      _this._updateRecordTime();
	    }, 200);
	  };
	  /**
	   * 开始录像，仅支持保存为webm格式
	   */


	  YunliVjsPlayer.prototype.startRecording = function () {
	    this.recording = true;

	    this._updateRecordTime(); //获取video标签的视频流


	    var stream = this.el_.captureStream();
	    recordBtn.el_ && recordBtn.el_.classList.add('recording');
	    recordBtn.el_ && (recordBtn.el_.querySelector('.vjs-control-text').title = '录制');
	    this.player_.el_.appendChild(recordFlag);
	    startRecording(stream);
	  };
	  /**
	   * 停止录像，同时弹出保存框
	   */


	  YunliVjsPlayer.prototype.stopRecording = function () {
	    this.recording = false;
	    recordTime = 0;
	    recordBtn.el_ && recordBtn.el_.classList.remove('recording');
	    recordBtn.el_ && (recordBtn.el_.querySelector('.vjs-control-text').title = '停止录制');
	    this.player_.el_.removeChild(recordFlag);
	    stopRecording();
	  };
	}

	var name = "yl-vjs-player-sdk";
	var version$1 = "0.0.45";
	var keywords = [
		"videojs",
		"云粒",
		"视频播放器"
	];
	var description = "云粒 videojs 视频播放器 SDK";
	var uimodule = "YunliVjsPlayer";
	var main = "esm/index.js";
	var copyright = "Copyright Yunlizhihui, Inc. <https://yunlizhihui.com>";
	var scripts = {
		start: "rollup -c rollup/dev.js -w",
		build: "rimraf dist && rimraf esm &&  rollup -c rollup/prod.js",
		postbuild: "rimraf ../vjs-player-resources/libs/*player-v*.min.js && cp -f dist/* ../vjs-player-resources/libs/",
		publishnpm: "npm publish"
	};
	var author = "yangyongjian";
	var license = "ISC";
	var publishConfig = {
		access: "public"
	};
	var files = [
		"package.json",
		"dist",
		"esm",
		"LICENSE",
		"README.md"
	];
	var peerDependencies = {
		"flv.js": "^1.5.0",
		"video.js": "^7.8.2",
		"videojs-flash": "^2.2.1",
		"videojs-flvjs": "^0.2.0",
		"videojs-swf": "^5.4.2"
	};
	var dependencies = {
		"flv.js": "^1.5.0",
		"video.js": "^7.8.2",
		"videojs-flash": "^2.2.1",
		"videojs-flvjs": "^0.2.0",
		"videojs-swf": "^5.4.2"
	};
	var devDependencies = {
		"node-sass": "^4.13.1",
		"postcss-url": "^8.0.0"
	};
	var pkg = {
		name: name,
		version: version$1,
		keywords: keywords,
		description: description,
		uimodule: uimodule,
		main: main,
		copyright: copyright,
		scripts: scripts,
		author: author,
		license: license,
		publishConfig: publishConfig,
		files: files,
		peerDependencies: peerDependencies,
		dependencies: dependencies,
		devDependencies: devDependencies
	};

	function lifecircleMixin(YunliVjsPlayer) {
	  /**
	   * 销毁videojs实例
	   */
	  YunliVjsPlayer.prototype.dispose = function () {
	    console.log('dispose', this.waitingTimer, this._keepAliveTimer);

	    if (this.waitingTimer) {
	      window.clearTimeout(this.waitingTimer);
	    }

	    if (this._keepAliveTimer) {
	      window.clearTimeout(this._keepAliveTimer);
	    }

	    console.log('dispose after', this.options_);

	    if (this.options_.closeVideo) {
	      this._destroyVideo && this._destroyVideo();
	    }

	    if (this.player_) {
	      this.player_.dispose();
	    }
	  };
	  /**
	   * 重置videojs实例
	   */


	  YunliVjsPlayer.prototype.reset = function () {
	    if (this.player_) {
	      this.player_.reset();
	    }
	  };
	  /**
	   * 开始播放
	   */


	  YunliVjsPlayer.prototype.play = function () {
	    if (this.player_) {
	      this.player_.play();
	    }
	  };
	  /**
	   * 播放器暂停
	   */


	  YunliVjsPlayer.prototype.pause = function () {
	    if (this.player_) {
	      this.player_.pause();
	    }
	  };
	  /**
	   * 重新播放sources  
	   */


	  YunliVjsPlayer.prototype.src = function (sources) {
	    var _this = this;

	    sources = this._parseSource(sources);
	    console.log('handleupdate src', stringify$2(sources));
	    this.options_.sources = sources;

	    if (this.player_) {
	      this.player_.src(sources);

	      setTimeout$1(function () {
	        if (_this.options_.playRate && _parseFloat$2(_this.options_.playRate) !== 1) {
	          _this.changePlayRate(_this.options_.playRate);
	        }
	      }, 200);
	    }
	  };
	  /**
	   * 处理源的类型，
	   * 统一转为[{ src: '', type: '' }]格式
	   * 默认没有type时，直播流用m3u8,录播视频用mp4
	   */


	  YunliVjsPlayer.prototype._parseSource = function (sources) {
	    var isLive = this.options_.yunliMode === 'live'; //字符时默认为src，转成对象数组

	    if (typeof sources === 'string') {
	      sources = {
	        src: sources,
	        type: getSourceType(sources, isLive)
	      };
	    } //不是数组转为数组


	    if (!isArray$3(sources)) {
	      sources = [sources];
	    } //数组中的项为字符串时，转为对象
	    //缺少type，补充type


	    forEach$2(sources).call(sources, function (source, i) {
	      if (typeof source === 'string') {
	        sources[i] = {
	          src: source,
	          type: getSourceType(source, isLive)
	        };
	      } else if (source && source.src && !source.type) {
	        source.type = getSourceType(source.src, isLive);
	      }
	    });

	    return sources;
	  };
	  /**
	   * 改变播放倍率
	   */


	  YunliVjsPlayer.prototype.changePlayRate = function (rate) {
	    console.log('rate in', rate);

	    if (this.player_) {
	      this.playbackRate = rate;
	      this.player_.playbackRate(rate); //this.player_.trigger('ratechange',rate)
	    }
	  };

	  YunliVjsPlayer.prototype.jumpVideoTime = function (time) {
	    console.log('tt', this);

	    if (this.player_) {
	      this._jumpVideoTime(time);
	    }
	  };

	  YunliVjsPlayer.prototype.currentTime = function () {
	    var currentTime = 0;

	    if (this.player_) {
	      currentTime += this.player_.currentTime();
	    }

	    if (this.ylJumpTime) {
	      currentTime += this.ylJumpTime;
	    }

	    return currentTime;
	  };

	  YunliVjsPlayer.prototype.onError = function (error) {
	    if (this.options_ && this.options_.onError) {
	      this.options_.onError.call(this, error, this.player_);
	    }
	  };

	  YunliVjsPlayer.prototype.onEnd = function () {
	    if (this.options_ && this.options_.onEnd) {
	      this.options_.onEnd.call(this, this.player_);
	    }
	  };
	  /**
	   * 获取videojs的实例对象
	   */


	  YunliVjsPlayer.prototype.getPlayer = function () {
	    return this.player_;
	  };

	  var ver = function ver() {
	    return pkg.version ;
	  };

	  YunliVjsPlayer.prototype.VERSION = ver;
	  YunliVjsPlayer.prototype.V = ver;
	}

	function YunliVjsPlayer(el, options, readyCallback) {
	  if (typeof el === 'string') {
	    el = document.getElementById(el);
	  }

	  this._init(el, options, readyCallback);
	}

	YunliVjsPlayer.prototype.version = pkg.version;
	initMixin(YunliVjsPlayer);
	snapMixin(YunliVjsPlayer);
	recordMixin(YunliVjsPlayer);
	eventsMixin(YunliVjsPlayer);
	yunliMixin(YunliVjsPlayer);
	lifecircleMixin(YunliVjsPlayer);

	return YunliVjsPlayer;

})));
