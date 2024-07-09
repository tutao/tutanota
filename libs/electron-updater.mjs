import require$$0 from 'events';
import require$$0$2 from 'crypto';
import require$$1 from 'tty';
import require$$1$1 from 'util';
import require$$2 from 'os';
import require$$1$2 from 'fs';
import require$$0$1 from 'stream';
import require$$4 from 'url';
import require$$1$3 from 'string_decoder';
import require$$0$3 from 'constants';
import require$$5 from 'assert';
import require$$1$4 from 'path';
import require$$1$6 from 'child_process';
import require$$1$5 from 'electron';
import require$$15 from 'zlib';
import require$$4$1 from 'http';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var main$2 = {};

var out = {};

var CancellationToken$1 = {};

Object.defineProperty(CancellationToken$1, "__esModule", { value: true });
CancellationToken$1.CancellationError = CancellationToken$1.CancellationToken = void 0;
const events_1 = require$$0;
class CancellationToken extends events_1.EventEmitter {
    get cancelled() {
        return this._cancelled || (this._parent != null && this._parent.cancelled);
    }
    set parent(value) {
        this.removeParentCancelHandler();
        this._parent = value;
        this.parentCancelHandler = () => this.cancel();
        this._parent.onCancel(this.parentCancelHandler);
    }
    // babel cannot compile ... correctly for super calls
    constructor(parent) {
        super();
        this.parentCancelHandler = null;
        this._parent = null;
        this._cancelled = false;
        if (parent != null) {
            this.parent = parent;
        }
    }
    cancel() {
        this._cancelled = true;
        this.emit("cancel");
    }
    onCancel(handler) {
        if (this.cancelled) {
            handler();
        }
        else {
            this.once("cancel", handler);
        }
    }
    createPromise(callback) {
        if (this.cancelled) {
            return Promise.reject(new CancellationError());
        }
        const finallyHandler = () => {
            if (cancelHandler != null) {
                try {
                    this.removeListener("cancel", cancelHandler);
                    cancelHandler = null;
                }
                catch (ignore) {
                    // ignore
                }
            }
        };
        let cancelHandler = null;
        return new Promise((resolve, reject) => {
            let addedCancelHandler = null;
            cancelHandler = () => {
                try {
                    if (addedCancelHandler != null) {
                        addedCancelHandler();
                        addedCancelHandler = null;
                    }
                }
                finally {
                    reject(new CancellationError());
                }
            };
            if (this.cancelled) {
                cancelHandler();
                return;
            }
            this.onCancel(cancelHandler);
            callback(resolve, reject, (callback) => {
                addedCancelHandler = callback;
            });
        })
            .then(it => {
            finallyHandler();
            return it;
        })
            .catch((e) => {
            finallyHandler();
            throw e;
        });
    }
    removeParentCancelHandler() {
        const parent = this._parent;
        if (parent != null && this.parentCancelHandler != null) {
            parent.removeListener("cancel", this.parentCancelHandler);
            this.parentCancelHandler = null;
        }
    }
    dispose() {
        try {
            this.removeParentCancelHandler();
        }
        finally {
            this.removeAllListeners();
            this._parent = null;
        }
    }
}
CancellationToken$1.CancellationToken = CancellationToken;
class CancellationError extends Error {
    constructor() {
        super("cancelled");
    }
}
CancellationToken$1.CancellationError = CancellationError;

var httpExecutor = {};

var src = {exports: {}};

var browser = {exports: {}};

/**
 * Helpers.
 */

var ms;
var hasRequiredMs;

function requireMs () {
	if (hasRequiredMs) return ms;
	hasRequiredMs = 1;
	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} [options]
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	ms = function(val, options) {
	  options = options || {};
	  var type = typeof val;
	  if (type === 'string' && val.length > 0) {
	    return parse(val);
	  } else if (type === 'number' && isFinite(val)) {
	    return options.long ? fmtLong(val) : fmtShort(val);
	  }
	  throw new Error(
	    'val is not a non-empty string or a valid number. val=' +
	      JSON.stringify(val)
	  );
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str);
	  if (str.length > 100) {
	    return;
	  }
	  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
	    str
	  );
	  if (!match) {
	    return;
	  }
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'weeks':
	    case 'week':
	    case 'w':
	      return n * w;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	    default:
	      return undefined;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return Math.round(ms / d) + 'd';
	  }
	  if (msAbs >= h) {
	    return Math.round(ms / h) + 'h';
	  }
	  if (msAbs >= m) {
	    return Math.round(ms / m) + 'm';
	  }
	  if (msAbs >= s) {
	    return Math.round(ms / s) + 's';
	  }
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return plural(ms, msAbs, d, 'day');
	  }
	  if (msAbs >= h) {
	    return plural(ms, msAbs, h, 'hour');
	  }
	  if (msAbs >= m) {
	    return plural(ms, msAbs, m, 'minute');
	  }
	  if (msAbs >= s) {
	    return plural(ms, msAbs, s, 'second');
	  }
	  return ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, msAbs, n, name) {
	  var isPlural = msAbs >= n * 1.5;
	  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
	}
	return ms;
}

var common$6;
var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common$6;
	hasRequiredCommon = 1;
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 */

	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = requireMs();
		createDebug.destroy = destroy;

		Object.keys(env).forEach(key => {
			createDebug[key] = env[key];
		});

		/**
		* The currently active debug mode names, and names to skip.
		*/

		createDebug.names = [];
		createDebug.skips = [];

		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};

		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;

			for (let i = 0; i < namespace.length; i++) {
				hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
				hash |= 0; // Convert to 32bit integer
			}

			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;

		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;

			function debug(...args) {
				// Disabled?
				if (!debug.enabled) {
					return;
				}

				const self = debug;

				// Set `diff` timestamp
				const curr = Number(new Date());
				const ms = curr - (prevTime || curr);
				self.diff = ms;
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;

				args[0] = createDebug.coerce(args[0]);

				if (typeof args[0] !== 'string') {
					// Anything else let's inspect with %O
					args.unshift('%O');
				}

				// Apply any `formatters` transformations
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					// If we encounter an escaped % then don't increase the array index
					if (match === '%%') {
						return '%';
					}
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === 'function') {
						const val = args[index];
						match = formatter.call(self, val);

						// Now we need to remove `args[index]` since it's inlined in the `format`
						args.splice(index, 1);
						index--;
					}
					return match;
				});

				// Apply env-specific formatting (colors, etc.)
				createDebug.formatArgs.call(self, args);

				const logFn = self.log || createDebug.log;
				logFn.apply(self, args);
			}

			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

			Object.defineProperty(debug, 'enabled', {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) {
						return enableOverride;
					}
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}

					return enabledCache;
				},
				set: v => {
					enableOverride = v;
				}
			});

			// Env-specific initialization logic for debug instances
			if (typeof createDebug.init === 'function') {
				createDebug.init(debug);
			}

			return debug;
		}

		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}

		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;

			createDebug.names = [];
			createDebug.skips = [];

			let i;
			const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
			const len = split.length;

			for (i = 0; i < len; i++) {
				if (!split[i]) {
					// ignore empty strings
					continue;
				}

				namespaces = split[i].replace(/\*/g, '.*?');

				if (namespaces[0] === '-') {
					createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
				} else {
					createDebug.names.push(new RegExp('^' + namespaces + '$'));
				}
			}
		}

		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [
				...createDebug.names.map(toNamespace),
				...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
			].join(',');
			createDebug.enable('');
			return namespaces;
		}

		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			if (name[name.length - 1] === '*') {
				return true;
			}

			let i;
			let len;

			for (i = 0, len = createDebug.skips.length; i < len; i++) {
				if (createDebug.skips[i].test(name)) {
					return false;
				}
			}

			for (i = 0, len = createDebug.names.length; i < len; i++) {
				if (createDebug.names[i].test(name)) {
					return true;
				}
			}

			return false;
		}

		/**
		* Convert regexp to namespace
		*
		* @param {RegExp} regxep
		* @return {String} namespace
		* @api private
		*/
		function toNamespace(regexp) {
			return regexp.toString()
				.substring(2, regexp.toString().length - 2)
				.replace(/\.\*\?$/, '*');
		}

		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) {
				return val.stack || val.message;
			}
			return val;
		}

		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}

		createDebug.enable(createDebug.load());

		return createDebug;
	}

	common$6 = setup;
	return common$6;
}

/* eslint-env browser */

var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser.exports;
	hasRequiredBrowser = 1;
	(function (module, exports) {
		/**
		 * This is the web browser implementation of `debug()`.
		 */

		exports.formatArgs = formatArgs;
		exports.save = save;
		exports.load = load;
		exports.useColors = useColors;
		exports.storage = localstorage();
		exports.destroy = (() => {
			let warned = false;

			return () => {
				if (!warned) {
					warned = true;
					console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
				}
			};
		})();

		/**
		 * Colors.
		 */

		exports.colors = [
			'#0000CC',
			'#0000FF',
			'#0033CC',
			'#0033FF',
			'#0066CC',
			'#0066FF',
			'#0099CC',
			'#0099FF',
			'#00CC00',
			'#00CC33',
			'#00CC66',
			'#00CC99',
			'#00CCCC',
			'#00CCFF',
			'#3300CC',
			'#3300FF',
			'#3333CC',
			'#3333FF',
			'#3366CC',
			'#3366FF',
			'#3399CC',
			'#3399FF',
			'#33CC00',
			'#33CC33',
			'#33CC66',
			'#33CC99',
			'#33CCCC',
			'#33CCFF',
			'#6600CC',
			'#6600FF',
			'#6633CC',
			'#6633FF',
			'#66CC00',
			'#66CC33',
			'#9900CC',
			'#9900FF',
			'#9933CC',
			'#9933FF',
			'#99CC00',
			'#99CC33',
			'#CC0000',
			'#CC0033',
			'#CC0066',
			'#CC0099',
			'#CC00CC',
			'#CC00FF',
			'#CC3300',
			'#CC3333',
			'#CC3366',
			'#CC3399',
			'#CC33CC',
			'#CC33FF',
			'#CC6600',
			'#CC6633',
			'#CC9900',
			'#CC9933',
			'#CCCC00',
			'#CCCC33',
			'#FF0000',
			'#FF0033',
			'#FF0066',
			'#FF0099',
			'#FF00CC',
			'#FF00FF',
			'#FF3300',
			'#FF3333',
			'#FF3366',
			'#FF3399',
			'#FF33CC',
			'#FF33FF',
			'#FF6600',
			'#FF6633',
			'#FF9900',
			'#FF9933',
			'#FFCC00',
			'#FFCC33'
		];

		/**
		 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
		 * and the Firebug extension (any Firefox version) are known
		 * to support "%c" CSS customizations.
		 *
		 * TODO: add a `localStorage` variable to explicitly enable/disable colors
		 */

		// eslint-disable-next-line complexity
		function useColors() {
			// NB: In an Electron preload script, document will be defined but not fully
			// initialized. Since we know we're in Chrome, we'll just detect this case
			// explicitly
			if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
				return true;
			}

			// Internet Explorer and Edge do not support colors.
			if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
				return false;
			}

			let m;

			// Is webkit? http://stackoverflow.com/a/16459606/376773
			// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
			return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
				// Is firebug? http://stackoverflow.com/a/398120/376773
				(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
				// Is firefox >= v31?
				// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
				(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
				// Double check webkit in userAgent just in case we are in a worker
				(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
		}

		/**
		 * Colorize log arguments if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			args[0] = (this.useColors ? '%c' : '') +
				this.namespace +
				(this.useColors ? ' %c' : ' ') +
				args[0] +
				(this.useColors ? '%c ' : ' ') +
				'+' + module.exports.humanize(this.diff);

			if (!this.useColors) {
				return;
			}

			const c = 'color: ' + this.color;
			args.splice(1, 0, c, 'color: inherit');

			// The final "%c" is somewhat tricky, because there could be other
			// arguments passed either before or after the %c, so we need to
			// figure out the correct index to insert the CSS into
			let index = 0;
			let lastC = 0;
			args[0].replace(/%[a-zA-Z%]/g, match => {
				if (match === '%%') {
					return;
				}
				index++;
				if (match === '%c') {
					// We only are interested in the *last* %c
					// (the user may have provided their own)
					lastC = index;
				}
			});

			args.splice(lastC, 0, c);
		}

		/**
		 * Invokes `console.debug()` when available.
		 * No-op when `console.debug` is not a "function".
		 * If `console.debug` is not available, falls back
		 * to `console.log`.
		 *
		 * @api public
		 */
		exports.log = console.debug || console.log || (() => {});

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			try {
				if (namespaces) {
					exports.storage.setItem('debug', namespaces);
				} else {
					exports.storage.removeItem('debug');
				}
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */
		function load() {
			let r;
			try {
				r = exports.storage.getItem('debug');
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}

			// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
			if (!r && typeof process !== 'undefined' && 'env' in process) {
				r = process.env.DEBUG;
			}

			return r;
		}

		/**
		 * Localstorage attempts to return the localstorage.
		 *
		 * This is necessary because safari throws
		 * when a user disables cookies/localstorage
		 * and you attempt to access it.
		 *
		 * @return {LocalStorage}
		 * @api private
		 */

		function localstorage() {
			try {
				// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
				// The Browser also has localStorage in the global context.
				return localStorage;
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		module.exports = requireCommon()(exports);

		const {formatters} = module.exports;

		/**
		 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
		 */

		formatters.j = function (v) {
			try {
				return JSON.stringify(v);
			} catch (error) {
				return '[UnexpectedJSONParseError]: ' + error.message;
			}
		}; 
	} (browser, browser.exports));
	return browser.exports;
}

var node = {exports: {}};

var hasFlag;
var hasRequiredHasFlag;

function requireHasFlag () {
	if (hasRequiredHasFlag) return hasFlag;
	hasRequiredHasFlag = 1;

	hasFlag = (flag, argv = process.argv) => {
		const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf('--');
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
	return hasFlag;
}

var supportsColor_1;
var hasRequiredSupportsColor;

function requireSupportsColor () {
	if (hasRequiredSupportsColor) return supportsColor_1;
	hasRequiredSupportsColor = 1;
	const os = require$$2;
	const tty = require$$1;
	const hasFlag = requireHasFlag();

	const {env} = process;

	let forceColor;
	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false') ||
		hasFlag('color=never')) {
		forceColor = 0;
	} else if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		forceColor = 1;
	}

	if ('FORCE_COLOR' in env) {
		if (env.FORCE_COLOR === 'true') {
			forceColor = 1;
		} else if (env.FORCE_COLOR === 'false') {
			forceColor = 0;
		} else {
			forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
		}
	}

	function translateLevel(level) {
		if (level === 0) {
			return false;
		}

		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}

	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) {
			return 0;
		}

		if (hasFlag('color=16m') ||
			hasFlag('color=full') ||
			hasFlag('color=truecolor')) {
			return 3;
		}

		if (hasFlag('color=256')) {
			return 2;
		}

		if (haveStream && !streamIsTTY && forceColor === undefined) {
			return 0;
		}

		const min = forceColor || 0;

		if (env.TERM === 'dumb') {
			return min;
		}

		if (process.platform === 'win32') {
			// Windows 10 build 10586 is the first Windows release that supports 256 colors.
			// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
			const osRelease = os.release().split('.');
			if (
				Number(osRelease[0]) >= 10 &&
				Number(osRelease[2]) >= 10586
			) {
				return Number(osRelease[2]) >= 14931 ? 3 : 2;
			}

			return 1;
		}

		if ('CI' in env) {
			if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
				return 1;
			}

			return min;
		}

		if ('TEAMCITY_VERSION' in env) {
			return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		}

		if (env.COLORTERM === 'truecolor') {
			return 3;
		}

		if ('TERM_PROGRAM' in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

			switch (env.TERM_PROGRAM) {
				case 'iTerm.app':
					return version >= 3 ? 3 : 2;
				case 'Apple_Terminal':
					return 2;
				// No default
			}
		}

		if (/-256(color)?$/i.test(env.TERM)) {
			return 2;
		}

		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
			return 1;
		}

		if ('COLORTERM' in env) {
			return 1;
		}

		return min;
	}

	function getSupportLevel(stream) {
		const level = supportsColor(stream, stream && stream.isTTY);
		return translateLevel(level);
	}

	supportsColor_1 = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty.isatty(2)))
	};
	return supportsColor_1;
}

/**
 * Module dependencies.
 */

var hasRequiredNode;

function requireNode () {
	if (hasRequiredNode) return node.exports;
	hasRequiredNode = 1;
	(function (module, exports) {
		const tty = require$$1;
		const util = require$$1$1;

		/**
		 * This is the Node.js implementation of `debug()`.
		 */

		exports.init = init;
		exports.log = log;
		exports.formatArgs = formatArgs;
		exports.save = save;
		exports.load = load;
		exports.useColors = useColors;
		exports.destroy = util.deprecate(
			() => {},
			'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
		);

		/**
		 * Colors.
		 */

		exports.colors = [6, 2, 3, 4, 5, 1];

		try {
			// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
			// eslint-disable-next-line import/no-extraneous-dependencies
			const supportsColor = requireSupportsColor();

			if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
				exports.colors = [
					20,
					21,
					26,
					27,
					32,
					33,
					38,
					39,
					40,
					41,
					42,
					43,
					44,
					45,
					56,
					57,
					62,
					63,
					68,
					69,
					74,
					75,
					76,
					77,
					78,
					79,
					80,
					81,
					92,
					93,
					98,
					99,
					112,
					113,
					128,
					129,
					134,
					135,
					148,
					149,
					160,
					161,
					162,
					163,
					164,
					165,
					166,
					167,
					168,
					169,
					170,
					171,
					172,
					173,
					178,
					179,
					184,
					185,
					196,
					197,
					198,
					199,
					200,
					201,
					202,
					203,
					204,
					205,
					206,
					207,
					208,
					209,
					214,
					215,
					220,
					221
				];
			}
		} catch (error) {
			// Swallow - we only care if `supports-color` is available; it doesn't have to be.
		}

		/**
		 * Build up the default `inspectOpts` object from the environment variables.
		 *
		 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
		 */

		exports.inspectOpts = Object.keys(process.env).filter(key => {
			return /^debug_/i.test(key);
		}).reduce((obj, key) => {
			// Camel-case
			const prop = key
				.substring(6)
				.toLowerCase()
				.replace(/_([a-z])/g, (_, k) => {
					return k.toUpperCase();
				});

			// Coerce string value into JS value
			let val = process.env[key];
			if (/^(yes|on|true|enabled)$/i.test(val)) {
				val = true;
			} else if (/^(no|off|false|disabled)$/i.test(val)) {
				val = false;
			} else if (val === 'null') {
				val = null;
			} else {
				val = Number(val);
			}

			obj[prop] = val;
			return obj;
		}, {});

		/**
		 * Is stdout a TTY? Colored output is enabled when `true`.
		 */

		function useColors() {
			return 'colors' in exports.inspectOpts ?
				Boolean(exports.inspectOpts.colors) :
				tty.isatty(process.stderr.fd);
		}

		/**
		 * Adds ANSI color escape codes if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			const {namespace: name, useColors} = this;

			if (useColors) {
				const c = this.color;
				const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
				const prefix = `  ${colorCode};1m${name} \u001B[0m`;

				args[0] = prefix + args[0].split('\n').join('\n' + prefix);
				args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
			} else {
				args[0] = getDate() + name + ' ' + args[0];
			}
		}

		function getDate() {
			if (exports.inspectOpts.hideDate) {
				return '';
			}
			return new Date().toISOString() + ' ';
		}

		/**
		 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
		 */

		function log(...args) {
			return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + '\n');
		}

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			if (namespaces) {
				process.env.DEBUG = namespaces;
			} else {
				// If you set a process.env field to null or undefined, it gets cast to the
				// string 'null' or 'undefined'. Just delete instead.
				delete process.env.DEBUG;
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */

		function load() {
			return process.env.DEBUG;
		}

		/**
		 * Init logic for `debug` instances.
		 *
		 * Create a new `inspectOpts` object in case `useColors` is set
		 * differently for a particular `debug` instance.
		 */

		function init(debug) {
			debug.inspectOpts = {};

			const keys = Object.keys(exports.inspectOpts);
			for (let i = 0; i < keys.length; i++) {
				debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
			}
		}

		module.exports = requireCommon()(exports);

		const {formatters} = module.exports;

		/**
		 * Map %o to `util.inspect()`, all on a single line.
		 */

		formatters.o = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts)
				.split('\n')
				.map(str => str.trim())
				.join(' ');
		};

		/**
		 * Map %O to `util.inspect()`, allowing multiple lines if needed.
		 */

		formatters.O = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts);
		}; 
	} (node, node.exports));
	return node.exports;
}

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	src.exports = requireBrowser();
} else {
	src.exports = requireNode();
}

var srcExports = src.exports;

var error = {};

Object.defineProperty(error, "__esModule", { value: true });
error.newError = newError;
function newError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

var ProgressCallbackTransform$1 = {};

Object.defineProperty(ProgressCallbackTransform$1, "__esModule", { value: true });
ProgressCallbackTransform$1.ProgressCallbackTransform = void 0;
const stream_1$3 = require$$0$1;
class ProgressCallbackTransform extends stream_1$3.Transform {
    constructor(total, cancellationToken, onProgress) {
        super();
        this.total = total;
        this.cancellationToken = cancellationToken;
        this.onProgress = onProgress;
        this.start = Date.now();
        this.transferred = 0;
        this.delta = 0;
        this.nextUpdate = this.start + 1000;
    }
    _transform(chunk, encoding, callback) {
        if (this.cancellationToken.cancelled) {
            callback(new Error("cancelled"), null);
            return;
        }
        this.transferred += chunk.length;
        this.delta += chunk.length;
        const now = Date.now();
        if (now >= this.nextUpdate && this.transferred !== this.total /* will be emitted on _flush */) {
            this.nextUpdate = now + 1000;
            this.onProgress({
                total: this.total,
                delta: this.delta,
                transferred: this.transferred,
                percent: (this.transferred / this.total) * 100,
                bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1000)),
            });
            this.delta = 0;
        }
        callback(null, chunk);
    }
    _flush(callback) {
        if (this.cancellationToken.cancelled) {
            callback(new Error("cancelled"));
            return;
        }
        this.onProgress({
            total: this.total,
            delta: this.delta,
            transferred: this.total,
            percent: 100,
            bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1000)),
        });
        this.delta = 0;
        callback(null);
    }
}
ProgressCallbackTransform$1.ProgressCallbackTransform = ProgressCallbackTransform;

Object.defineProperty(httpExecutor, "__esModule", { value: true });
httpExecutor.DigestTransform = httpExecutor.HttpExecutor = httpExecutor.HttpError = void 0;
httpExecutor.createHttpError = createHttpError;
httpExecutor.parseJson = parseJson;
httpExecutor.configureRequestOptionsFromUrl = configureRequestOptionsFromUrl;
httpExecutor.configureRequestUrl = configureRequestUrl;
httpExecutor.safeGetHeader = safeGetHeader;
httpExecutor.configureRequestOptions = configureRequestOptions;
httpExecutor.safeStringifyJson = safeStringifyJson;
const crypto_1$2 = require$$0$2;
const debug_1$1 = srcExports;
const fs_1$3 = require$$1$2;
const stream_1$2 = require$$0$1;
const url_1$4 = require$$4;
const CancellationToken_1 = CancellationToken$1;
const error_1$2 = error;
const ProgressCallbackTransform_1 = ProgressCallbackTransform$1;
const debug$3 = (0, debug_1$1.default)("electron-builder");
function createHttpError(response, description = null) {
    return new HttpError(response.statusCode || -1, `${response.statusCode} ${response.statusMessage}` +
        (description == null ? "" : "\n" + JSON.stringify(description, null, "  ")) +
        "\nHeaders: " +
        safeStringifyJson(response.headers), description);
}
const HTTP_STATUS_CODES = new Map([
    [429, "Too many requests"],
    [400, "Bad request"],
    [403, "Forbidden"],
    [404, "Not found"],
    [405, "Method not allowed"],
    [406, "Not acceptable"],
    [408, "Request timeout"],
    [413, "Request entity too large"],
    [500, "Internal server error"],
    [502, "Bad gateway"],
    [503, "Service unavailable"],
    [504, "Gateway timeout"],
    [505, "HTTP version not supported"],
]);
class HttpError extends Error {
    constructor(statusCode, message = `HTTP error: ${HTTP_STATUS_CODES.get(statusCode) || statusCode}`, description = null) {
        super(message);
        this.statusCode = statusCode;
        this.description = description;
        this.name = "HttpError";
        this.code = `HTTP_ERROR_${statusCode}`;
    }
    isServerError() {
        return this.statusCode >= 500 && this.statusCode <= 599;
    }
}
httpExecutor.HttpError = HttpError;
function parseJson(result) {
    return result.then(it => (it == null || it.length === 0 ? null : JSON.parse(it)));
}
class HttpExecutor {
    constructor() {
        this.maxRedirects = 10;
    }
    request(options, cancellationToken = new CancellationToken_1.CancellationToken(), data) {
        configureRequestOptions(options);
        const json = data == null ? undefined : JSON.stringify(data);
        const encodedData = json ? Buffer.from(json) : undefined;
        if (encodedData != null) {
            debug$3(json);
            const { headers, ...opts } = options;
            options = {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": encodedData.length,
                    ...headers,
                },
                ...opts,
            };
        }
        return this.doApiRequest(options, cancellationToken, it => it.end(encodedData));
    }
    doApiRequest(options, cancellationToken, requestProcessor, redirectCount = 0) {
        if (debug$3.enabled) {
            debug$3(`Request: ${safeStringifyJson(options)}`);
        }
        return cancellationToken.createPromise((resolve, reject, onCancel) => {
            const request = this.createRequest(options, (response) => {
                try {
                    this.handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor);
                }
                catch (e) {
                    reject(e);
                }
            });
            this.addErrorAndTimeoutHandlers(request, reject, options.timeout);
            this.addRedirectHandlers(request, options, reject, redirectCount, options => {
                this.doApiRequest(options, cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
            });
            requestProcessor(request, reject);
            onCancel(() => request.abort());
        });
    }
    // noinspection JSUnusedLocalSymbols
    // eslint-disable-next-line
    addRedirectHandlers(request, options, reject, redirectCount, handler) {
        // not required for NodeJS
    }
    addErrorAndTimeoutHandlers(request, reject, timeout = 60 * 1000) {
        this.addTimeOutHandler(request, reject, timeout);
        request.on("error", reject);
        request.on("aborted", () => {
            reject(new Error("Request has been aborted by the server"));
        });
    }
    handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor) {
        var _a;
        if (debug$3.enabled) {
            debug$3(`Response: ${response.statusCode} ${response.statusMessage}, request options: ${safeStringifyJson(options)}`);
        }
        // we handle any other >= 400 error on request end (read detailed message in the response body)
        if (response.statusCode === 404) {
            // error is clear, we don't need to read detailed error description
            reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
            return;
        }
        else if (response.statusCode === 204) {
            // on DELETE request
            resolve();
            return;
        }
        const code = (_a = response.statusCode) !== null && _a !== void 0 ? _a : 0;
        const shouldRedirect = code >= 300 && code < 400;
        const redirectUrl = safeGetHeader(response, "location");
        if (shouldRedirect && redirectUrl != null) {
            if (redirectCount > this.maxRedirects) {
                reject(this.createMaxRedirectError());
                return;
            }
            this.doApiRequest(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options), cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
            return;
        }
        response.setEncoding("utf8");
        let data = "";
        response.on("error", reject);
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => {
            try {
                if (response.statusCode != null && response.statusCode >= 400) {
                    const contentType = safeGetHeader(response, "content-type");
                    const isJson = contentType != null && (Array.isArray(contentType) ? contentType.find(it => it.includes("json")) != null : contentType.includes("json"));
                    reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

          Data:
          ${isJson ? JSON.stringify(JSON.parse(data)) : data}
          `));
                }
                else {
                    resolve(data.length === 0 ? null : data);
                }
            }
            catch (e) {
                reject(e);
            }
        });
    }
    async downloadToBuffer(url, options) {
        return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
            const responseChunks = [];
            const requestOptions = {
                headers: options.headers || undefined,
                // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
                redirect: "manual",
            };
            configureRequestUrl(url, requestOptions);
            configureRequestOptions(requestOptions);
            this.doDownload(requestOptions, {
                destination: null,
                options,
                onCancel,
                callback: error => {
                    if (error == null) {
                        resolve(Buffer.concat(responseChunks));
                    }
                    else {
                        reject(error);
                    }
                },
                responseHandler: (response, callback) => {
                    let receivedLength = 0;
                    response.on("data", (chunk) => {
                        receivedLength += chunk.length;
                        if (receivedLength > 524288000) {
                            callback(new Error("Maximum allowed size is 500 MB"));
                            return;
                        }
                        responseChunks.push(chunk);
                    });
                    response.on("end", () => {
                        callback(null);
                    });
                },
            }, 0);
        });
    }
    doDownload(requestOptions, options, redirectCount) {
        const request = this.createRequest(requestOptions, (response) => {
            if (response.statusCode >= 400) {
                options.callback(new Error(`Cannot download "${requestOptions.protocol || "https:"}//${requestOptions.hostname}${requestOptions.path}", status ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            // It is possible for the response stream to fail, e.g. when a network is lost while
            // response stream is in progress. Stop waiting and reject so consumer can catch the error.
            response.on("error", options.callback);
            // this code not relevant for Electron (redirect event instead handled)
            const redirectUrl = safeGetHeader(response, "location");
            if (redirectUrl != null) {
                if (redirectCount < this.maxRedirects) {
                    this.doDownload(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, requestOptions), options, redirectCount++);
                }
                else {
                    options.callback(this.createMaxRedirectError());
                }
                return;
            }
            if (options.responseHandler == null) {
                configurePipes(options, response);
            }
            else {
                options.responseHandler(response, options.callback);
            }
        });
        this.addErrorAndTimeoutHandlers(request, options.callback, requestOptions.timeout);
        this.addRedirectHandlers(request, requestOptions, options.callback, redirectCount, requestOptions => {
            this.doDownload(requestOptions, options, redirectCount++);
        });
        request.end();
    }
    createMaxRedirectError() {
        return new Error(`Too many redirects (> ${this.maxRedirects})`);
    }
    addTimeOutHandler(request, callback, timeout) {
        request.on("socket", (socket) => {
            socket.setTimeout(timeout, () => {
                request.abort();
                callback(new Error("Request timed out"));
            });
        });
    }
    static prepareRedirectUrlOptions(redirectUrl, options) {
        const newOptions = configureRequestOptionsFromUrl(redirectUrl, { ...options });
        const headers = newOptions.headers;
        if (headers === null || headers === void 0 ? void 0 : headers.authorization) {
            const parsedNewUrl = new url_1$4.URL(redirectUrl);
            if (parsedNewUrl.hostname.endsWith(".amazonaws.com") || parsedNewUrl.searchParams.has("X-Amz-Credential")) {
                delete headers.authorization;
            }
        }
        return newOptions;
    }
    static retryOnServerError(task, maxRetries = 3) {
        for (let attemptNumber = 0;; attemptNumber++) {
            try {
                return task();
            }
            catch (e) {
                if (attemptNumber < maxRetries && ((e instanceof HttpError && e.isServerError()) || e.code === "EPIPE")) {
                    continue;
                }
                throw e;
            }
        }
    }
}
httpExecutor.HttpExecutor = HttpExecutor;
function configureRequestOptionsFromUrl(url, options) {
    const result = configureRequestOptions(options);
    configureRequestUrl(new url_1$4.URL(url), result);
    return result;
}
function configureRequestUrl(url, options) {
    options.protocol = url.protocol;
    options.hostname = url.hostname;
    if (url.port) {
        options.port = url.port;
    }
    else if (options.port) {
        delete options.port;
    }
    options.path = url.pathname + url.search;
}
class DigestTransform extends stream_1$2.Transform {
    // noinspection JSUnusedGlobalSymbols
    get actual() {
        return this._actual;
    }
    constructor(expected, algorithm = "sha512", encoding = "base64") {
        super();
        this.expected = expected;
        this.algorithm = algorithm;
        this.encoding = encoding;
        this._actual = null;
        this.isValidateOnEnd = true;
        this.digester = (0, crypto_1$2.createHash)(algorithm);
    }
    // noinspection JSUnusedGlobalSymbols
    _transform(chunk, encoding, callback) {
        this.digester.update(chunk);
        callback(null, chunk);
    }
    // noinspection JSUnusedGlobalSymbols
    _flush(callback) {
        this._actual = this.digester.digest(this.encoding);
        if (this.isValidateOnEnd) {
            try {
                this.validate();
            }
            catch (e) {
                callback(e);
                return;
            }
        }
        callback(null);
    }
    validate() {
        if (this._actual == null) {
            throw (0, error_1$2.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
        }
        if (this._actual !== this.expected) {
            throw (0, error_1$2.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
        }
        return null;
    }
}
httpExecutor.DigestTransform = DigestTransform;
function checkSha2(sha2Header, sha2, callback) {
    if (sha2Header != null && sha2 != null && sha2Header !== sha2) {
        callback(new Error(`checksum mismatch: expected ${sha2} but got ${sha2Header} (X-Checksum-Sha2 header)`));
        return false;
    }
    return true;
}
function safeGetHeader(response, headerKey) {
    const value = response.headers[headerKey];
    if (value == null) {
        return null;
    }
    else if (Array.isArray(value)) {
        // electron API
        return value.length === 0 ? null : value[value.length - 1];
    }
    else {
        return value;
    }
}
function configurePipes(options, response) {
    if (!checkSha2(safeGetHeader(response, "X-Checksum-Sha2"), options.options.sha2, options.callback)) {
        return;
    }
    const streams = [];
    if (options.options.onProgress != null) {
        const contentLength = safeGetHeader(response, "content-length");
        if (contentLength != null) {
            streams.push(new ProgressCallbackTransform_1.ProgressCallbackTransform(parseInt(contentLength, 10), options.options.cancellationToken, options.options.onProgress));
        }
    }
    const sha512 = options.options.sha512;
    if (sha512 != null) {
        streams.push(new DigestTransform(sha512, "sha512", sha512.length === 128 && !sha512.includes("+") && !sha512.includes("Z") && !sha512.includes("=") ? "hex" : "base64"));
    }
    else if (options.options.sha2 != null) {
        streams.push(new DigestTransform(options.options.sha2, "sha256", "hex"));
    }
    const fileOut = (0, fs_1$3.createWriteStream)(options.destination);
    streams.push(fileOut);
    let lastStream = response;
    for (const stream of streams) {
        stream.on("error", (error) => {
            fileOut.close();
            if (!options.options.cancellationToken.cancelled) {
                options.callback(error);
            }
        });
        lastStream = lastStream.pipe(stream);
    }
    fileOut.on("finish", () => {
        fileOut.close(options.callback);
    });
}
function configureRequestOptions(options, token, method) {
    if (method != null) {
        options.method = method;
    }
    options.headers = { ...options.headers };
    const headers = options.headers;
    if (token != null) {
        headers.authorization = token.startsWith("Basic") || token.startsWith("Bearer") ? token : `token ${token}`;
    }
    if (headers["User-Agent"] == null) {
        headers["User-Agent"] = "electron-builder";
    }
    if (method == null || method === "GET" || headers["Cache-Control"] == null) {
        headers["Cache-Control"] = "no-cache";
    }
    // do not specify for node (in any case we use https module)
    if (options.protocol == null && process.versions.electron != null) {
        options.protocol = "https:";
    }
    return options;
}
function safeStringifyJson(data, skippedNames) {
    return JSON.stringify(data, (name, value) => {
        if (name.endsWith("Authorization") ||
            name.endsWith("authorization") ||
            name.endsWith("Password") ||
            name.endsWith("PASSWORD") ||
            name.endsWith("Token") ||
            name.includes("password") ||
            name.includes("token") ||
            (skippedNames != null && skippedNames.has(name))) {
            return "<stripped sensitive data>";
        }
        return value;
    }, 2);
}

var publishOptions = {};

Object.defineProperty(publishOptions, "__esModule", { value: true });
publishOptions.githubUrl = githubUrl;
publishOptions.getS3LikeProviderBaseUrl = getS3LikeProviderBaseUrl;
/** @private */
function githubUrl(options, defaultHost = "github.com") {
    return `${options.protocol || "https"}://${options.host || defaultHost}`;
}
function getS3LikeProviderBaseUrl(configuration) {
    const provider = configuration.provider;
    if (provider === "s3") {
        return s3Url(configuration);
    }
    if (provider === "spaces") {
        return spacesUrl(configuration);
    }
    throw new Error(`Not supported provider: ${provider}`);
}
function s3Url(options) {
    let url;
    if (options.accelerate == true) {
        url = `https://${options.bucket}.s3-accelerate.amazonaws.com`;
    }
    else if (options.endpoint != null) {
        url = `${options.endpoint}/${options.bucket}`;
    }
    else if (options.bucket.includes(".")) {
        if (options.region == null) {
            throw new Error(`Bucket name "${options.bucket}" includes a dot, but S3 region is missing`);
        }
        // special case, see http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html#access-bucket-intro
        if (options.region === "us-east-1") {
            url = `https://s3.amazonaws.com/${options.bucket}`;
        }
        else {
            url = `https://s3-${options.region}.amazonaws.com/${options.bucket}`;
        }
    }
    else if (options.region === "cn-north-1") {
        url = `https://${options.bucket}.s3.${options.region}.amazonaws.com.cn`;
    }
    else {
        url = `https://${options.bucket}.s3.amazonaws.com`;
    }
    return appendPath(url, options.path);
}
function appendPath(url, p) {
    if (p != null && p.length > 0) {
        if (!p.startsWith("/")) {
            url += "/";
        }
        url += p;
    }
    return url;
}
function spacesUrl(options) {
    if (options.name == null) {
        throw new Error(`name is missing`);
    }
    if (options.region == null) {
        throw new Error(`region is missing`);
    }
    return appendPath(`https://${options.name}.${options.region}.digitaloceanspaces.com`, options.path);
}

var rfc2253Parser = {};

Object.defineProperty(rfc2253Parser, "__esModule", { value: true });
rfc2253Parser.parseDn = parseDn;
function parseDn(seq) {
    let quoted = false;
    let key = null;
    let token = "";
    let nextNonSpace = 0;
    seq = seq.trim();
    const result = new Map();
    for (let i = 0; i <= seq.length; i++) {
        if (i === seq.length) {
            if (key !== null) {
                result.set(key, token);
            }
            break;
        }
        const ch = seq[i];
        if (quoted) {
            if (ch === '"') {
                quoted = false;
                continue;
            }
        }
        else {
            if (ch === '"') {
                quoted = true;
                continue;
            }
            if (ch === "\\") {
                i++;
                const ord = parseInt(seq.slice(i, i + 2), 16);
                if (Number.isNaN(ord)) {
                    token += seq[i];
                }
                else {
                    i++;
                    token += String.fromCharCode(ord);
                }
                continue;
            }
            if (key === null && ch === "=") {
                key = token;
                token = "";
                continue;
            }
            if (ch === "," || ch === ";" || ch === "+") {
                if (key !== null) {
                    result.set(key, token);
                }
                key = null;
                token = "";
                continue;
            }
        }
        if (ch === " " && !quoted) {
            if (token.length === 0) {
                continue;
            }
            if (i > nextNonSpace) {
                let j = i;
                while (seq[j] === " ") {
                    j++;
                }
                nextNonSpace = j;
            }
            if (nextNonSpace >= seq.length ||
                seq[nextNonSpace] === "," ||
                seq[nextNonSpace] === ";" ||
                (key === null && seq[nextNonSpace] === "=") ||
                (key !== null && seq[nextNonSpace] === "+")) {
                i = nextNonSpace - 1;
                continue;
            }
        }
        token += ch;
    }
    return result;
}

var uuid = {};

Object.defineProperty(uuid, "__esModule", { value: true });
uuid.nil = uuid.UUID = void 0;
const crypto_1$1 = require$$0$2;
const error_1$1 = error;
const invalidName = "options.name must be either a string or a Buffer";
// Node ID according to rfc4122#section-4.5
const randomHost = (0, crypto_1$1.randomBytes)(16);
randomHost[0] = randomHost[0] | 0x01;
// lookup table hex to byte
const hex2byte = {};
// lookup table byte to hex
const byte2hex = [];
// populate lookup tables
for (let i = 0; i < 256; i++) {
    const hex = (i + 0x100).toString(16).substr(1);
    hex2byte[hex] = i;
    byte2hex[i] = hex;
}
// UUID class
class UUID {
    constructor(uuid) {
        this.ascii = null;
        this.binary = null;
        const check = UUID.check(uuid);
        if (!check) {
            throw new Error("not a UUID");
        }
        this.version = check.version;
        if (check.format === "ascii") {
            this.ascii = uuid;
        }
        else {
            this.binary = uuid;
        }
    }
    static v5(name, namespace) {
        return uuidNamed(name, "sha1", 0x50, namespace);
    }
    toString() {
        if (this.ascii == null) {
            this.ascii = stringify$4(this.binary);
        }
        return this.ascii;
    }
    inspect() {
        return `UUID v${this.version} ${this.toString()}`;
    }
    static check(uuid, offset = 0) {
        if (typeof uuid === "string") {
            uuid = uuid.toLowerCase();
            if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(uuid)) {
                return false;
            }
            if (uuid === "00000000-0000-0000-0000-000000000000") {
                return { version: undefined, variant: "nil", format: "ascii" };
            }
            return {
                version: (hex2byte[uuid[14] + uuid[15]] & 0xf0) >> 4,
                variant: getVariant((hex2byte[uuid[19] + uuid[20]] & 0xe0) >> 5),
                format: "ascii",
            };
        }
        if (Buffer.isBuffer(uuid)) {
            if (uuid.length < offset + 16) {
                return false;
            }
            let i = 0;
            for (; i < 16; i++) {
                if (uuid[offset + i] !== 0) {
                    break;
                }
            }
            if (i === 16) {
                return { version: undefined, variant: "nil", format: "binary" };
            }
            return {
                version: (uuid[offset + 6] & 0xf0) >> 4,
                variant: getVariant((uuid[offset + 8] & 0xe0) >> 5),
                format: "binary",
            };
        }
        throw (0, error_1$1.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
    }
    // read stringified uuid into a Buffer
    static parse(input) {
        const buffer = Buffer.allocUnsafe(16);
        let j = 0;
        for (let i = 0; i < 16; i++) {
            buffer[i] = hex2byte[input[j++] + input[j++]];
            if (i === 3 || i === 5 || i === 7 || i === 9) {
                j += 1;
            }
        }
        return buffer;
    }
}
uuid.UUID = UUID;
// from rfc4122#appendix-C
UUID.OID = UUID.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
// according to rfc4122#section-4.1.1
function getVariant(bits) {
    switch (bits) {
        case 0:
        case 1:
        case 3:
            return "ncs";
        case 4:
        case 5:
            return "rfc4122";
        case 6:
            return "microsoft";
        default:
            return "future";
    }
}
var UuidEncoding;
(function (UuidEncoding) {
    UuidEncoding[UuidEncoding["ASCII"] = 0] = "ASCII";
    UuidEncoding[UuidEncoding["BINARY"] = 1] = "BINARY";
    UuidEncoding[UuidEncoding["OBJECT"] = 2] = "OBJECT";
})(UuidEncoding || (UuidEncoding = {}));
// v3 + v5
function uuidNamed(name, hashMethod, version, namespace, encoding = UuidEncoding.ASCII) {
    const hash = (0, crypto_1$1.createHash)(hashMethod);
    const nameIsNotAString = typeof name !== "string";
    if (nameIsNotAString && !Buffer.isBuffer(name)) {
        throw (0, error_1$1.newError)(invalidName, "ERR_INVALID_UUID_NAME");
    }
    hash.update(namespace);
    hash.update(name);
    const buffer = hash.digest();
    let result;
    switch (encoding) {
        case UuidEncoding.BINARY:
            buffer[6] = (buffer[6] & 0x0f) | version;
            buffer[8] = (buffer[8] & 0x3f) | 0x80;
            result = buffer;
            break;
        case UuidEncoding.OBJECT:
            buffer[6] = (buffer[6] & 0x0f) | version;
            buffer[8] = (buffer[8] & 0x3f) | 0x80;
            result = new UUID(buffer);
            break;
        default:
            result =
                byte2hex[buffer[0]] +
                    byte2hex[buffer[1]] +
                    byte2hex[buffer[2]] +
                    byte2hex[buffer[3]] +
                    "-" +
                    byte2hex[buffer[4]] +
                    byte2hex[buffer[5]] +
                    "-" +
                    byte2hex[(buffer[6] & 0x0f) | version] +
                    byte2hex[buffer[7]] +
                    "-" +
                    byte2hex[(buffer[8] & 0x3f) | 0x80] +
                    byte2hex[buffer[9]] +
                    "-" +
                    byte2hex[buffer[10]] +
                    byte2hex[buffer[11]] +
                    byte2hex[buffer[12]] +
                    byte2hex[buffer[13]] +
                    byte2hex[buffer[14]] +
                    byte2hex[buffer[15]];
            break;
    }
    return result;
}
function stringify$4(buffer) {
    return (byte2hex[buffer[0]] +
        byte2hex[buffer[1]] +
        byte2hex[buffer[2]] +
        byte2hex[buffer[3]] +
        "-" +
        byte2hex[buffer[4]] +
        byte2hex[buffer[5]] +
        "-" +
        byte2hex[buffer[6]] +
        byte2hex[buffer[7]] +
        "-" +
        byte2hex[buffer[8]] +
        byte2hex[buffer[9]] +
        "-" +
        byte2hex[buffer[10]] +
        byte2hex[buffer[11]] +
        byte2hex[buffer[12]] +
        byte2hex[buffer[13]] +
        byte2hex[buffer[14]] +
        byte2hex[buffer[15]]);
}
// according to rfc4122#section-4.1.7
uuid.nil = new UUID("00000000-0000-0000-0000-000000000000");

var xml = {};

var sax$1 = {};

(function (exports) {
(function (sax) { // wrapper for non-node envs
	  sax.parser = function (strict, opt) { return new SAXParser(strict, opt) };
	  sax.SAXParser = SAXParser;
	  sax.SAXStream = SAXStream;
	  sax.createStream = createStream;

	  // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
	  // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
	  // since that's the earliest that a buffer overrun could occur.  This way, checks are
	  // as rare as required, but as often as necessary to ensure never crossing this bound.
	  // Furthermore, buffers are only tested at most once per write(), so passing a very
	  // large string into write() might have undesirable effects, but this is manageable by
	  // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
	  // edge case, result in creating at most one complete copy of the string passed in.
	  // Set to Infinity to have unlimited buffers.
	  sax.MAX_BUFFER_LENGTH = 64 * 1024;

	  var buffers = [
	    'comment', 'sgmlDecl', 'textNode', 'tagName', 'doctype',
	    'procInstName', 'procInstBody', 'entity', 'attribName',
	    'attribValue', 'cdata', 'script'
	  ];

	  sax.EVENTS = [
	    'text',
	    'processinginstruction',
	    'sgmldeclaration',
	    'doctype',
	    'comment',
	    'opentagstart',
	    'attribute',
	    'opentag',
	    'closetag',
	    'opencdata',
	    'cdata',
	    'closecdata',
	    'error',
	    'end',
	    'ready',
	    'script',
	    'opennamespace',
	    'closenamespace'
	  ];

	  function SAXParser (strict, opt) {
	    if (!(this instanceof SAXParser)) {
	      return new SAXParser(strict, opt)
	    }

	    var parser = this;
	    clearBuffers(parser);
	    parser.q = parser.c = '';
	    parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
	    parser.opt = opt || {};
	    parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
	    parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase';
	    parser.tags = [];
	    parser.closed = parser.closedRoot = parser.sawRoot = false;
	    parser.tag = parser.error = null;
	    parser.strict = !!strict;
	    parser.noscript = !!(strict || parser.opt.noscript);
	    parser.state = S.BEGIN;
	    parser.strictEntities = parser.opt.strictEntities;
	    parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
	    parser.attribList = [];

	    // namespaces form a prototype chain.
	    // it always points at the current tag,
	    // which protos to its parent tag.
	    if (parser.opt.xmlns) {
	      parser.ns = Object.create(rootNS);
	    }

	    // disallow unquoted attribute values if not otherwise configured
	    // and strict mode is true
	    if (parser.opt.unquotedAttributeValues === undefined) {
	      parser.opt.unquotedAttributeValues = !strict;
	    }

	    // mostly just for error reporting
	    parser.trackPosition = parser.opt.position !== false;
	    if (parser.trackPosition) {
	      parser.position = parser.line = parser.column = 0;
	    }
	    emit(parser, 'onready');
	  }

	  if (!Object.create) {
	    Object.create = function (o) {
	      function F () {}
	      F.prototype = o;
	      var newf = new F();
	      return newf
	    };
	  }

	  if (!Object.keys) {
	    Object.keys = function (o) {
	      var a = [];
	      for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
	      return a
	    };
	  }

	  function checkBufferLength (parser) {
	    var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
	    var maxActual = 0;
	    for (var i = 0, l = buffers.length; i < l; i++) {
	      var len = parser[buffers[i]].length;
	      if (len > maxAllowed) {
	        // Text/cdata nodes can get big, and since they're buffered,
	        // we can get here under normal conditions.
	        // Avoid issues by emitting the text node now,
	        // so at least it won't get any bigger.
	        switch (buffers[i]) {
	          case 'textNode':
	            closeText(parser);
	            break

	          case 'cdata':
	            emitNode(parser, 'oncdata', parser.cdata);
	            parser.cdata = '';
	            break

	          case 'script':
	            emitNode(parser, 'onscript', parser.script);
	            parser.script = '';
	            break

	          default:
	            error(parser, 'Max buffer length exceeded: ' + buffers[i]);
	        }
	      }
	      maxActual = Math.max(maxActual, len);
	    }
	    // schedule the next check for the earliest possible buffer overrun.
	    var m = sax.MAX_BUFFER_LENGTH - maxActual;
	    parser.bufferCheckPosition = m + parser.position;
	  }

	  function clearBuffers (parser) {
	    for (var i = 0, l = buffers.length; i < l; i++) {
	      parser[buffers[i]] = '';
	    }
	  }

	  function flushBuffers (parser) {
	    closeText(parser);
	    if (parser.cdata !== '') {
	      emitNode(parser, 'oncdata', parser.cdata);
	      parser.cdata = '';
	    }
	    if (parser.script !== '') {
	      emitNode(parser, 'onscript', parser.script);
	      parser.script = '';
	    }
	  }

	  SAXParser.prototype = {
	    end: function () { end(this); },
	    write: write,
	    resume: function () { this.error = null; return this },
	    close: function () { return this.write(null) },
	    flush: function () { flushBuffers(this); }
	  };

	  var Stream;
	  try {
	    Stream = require('stream').Stream;
	  } catch (ex) {
	    Stream = function () {};
	  }
	  if (!Stream) Stream = function () {};

	  var streamWraps = sax.EVENTS.filter(function (ev) {
	    return ev !== 'error' && ev !== 'end'
	  });

	  function createStream (strict, opt) {
	    return new SAXStream(strict, opt)
	  }

	  function SAXStream (strict, opt) {
	    if (!(this instanceof SAXStream)) {
	      return new SAXStream(strict, opt)
	    }

	    Stream.apply(this);

	    this._parser = new SAXParser(strict, opt);
	    this.writable = true;
	    this.readable = true;

	    var me = this;

	    this._parser.onend = function () {
	      me.emit('end');
	    };

	    this._parser.onerror = function (er) {
	      me.emit('error', er);

	      // if didn't throw, then means error was handled.
	      // go ahead and clear error, so we can write again.
	      me._parser.error = null;
	    };

	    this._decoder = null;

	    streamWraps.forEach(function (ev) {
	      Object.defineProperty(me, 'on' + ev, {
	        get: function () {
	          return me._parser['on' + ev]
	        },
	        set: function (h) {
	          if (!h) {
	            me.removeAllListeners(ev);
	            me._parser['on' + ev] = h;
	            return h
	          }
	          me.on(ev, h);
	        },
	        enumerable: true,
	        configurable: false
	      });
	    });
	  }

	  SAXStream.prototype = Object.create(Stream.prototype, {
	    constructor: {
	      value: SAXStream
	    }
	  });

	  SAXStream.prototype.write = function (data) {
	    if (typeof Buffer === 'function' &&
	      typeof Buffer.isBuffer === 'function' &&
	      Buffer.isBuffer(data)) {
	      if (!this._decoder) {
	        var SD = require$$1$3.StringDecoder;
	        this._decoder = new SD('utf8');
	      }
	      data = this._decoder.write(data);
	    }

	    this._parser.write(data.toString());
	    this.emit('data', data);
	    return true
	  };

	  SAXStream.prototype.end = function (chunk) {
	    if (chunk && chunk.length) {
	      this.write(chunk);
	    }
	    this._parser.end();
	    return true
	  };

	  SAXStream.prototype.on = function (ev, handler) {
	    var me = this;
	    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
	      me._parser['on' + ev] = function () {
	        var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
	        args.splice(0, 0, ev);
	        me.emit.apply(me, args);
	      };
	    }

	    return Stream.prototype.on.call(me, ev, handler)
	  };

	  // this really needs to be replaced with character classes.
	  // XML allows all manner of ridiculous numbers and digits.
	  var CDATA = '[CDATA[';
	  var DOCTYPE = 'DOCTYPE';
	  var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
	  var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';
	  var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };

	  // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
	  // This implementation works on strings, a single character at a time
	  // as such, it cannot ever support astral-plane characters (10000-EFFFF)
	  // without a significant breaking change to either this  parser, or the
	  // JavaScript language.  Implementation of an emoji-capable xml parser
	  // is left as an exercise for the reader.
	  var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;

	  var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

	  var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
	  var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

	  function isWhitespace (c) {
	    return c === ' ' || c === '\n' || c === '\r' || c === '\t'
	  }

	  function isQuote (c) {
	    return c === '"' || c === '\''
	  }

	  function isAttribEnd (c) {
	    return c === '>' || isWhitespace(c)
	  }

	  function isMatch (regex, c) {
	    return regex.test(c)
	  }

	  function notMatch (regex, c) {
	    return !isMatch(regex, c)
	  }

	  var S = 0;
	  sax.STATE = {
	    BEGIN: S++, // leading byte order mark or whitespace
	    BEGIN_WHITESPACE: S++, // leading whitespace
	    TEXT: S++, // general stuff
	    TEXT_ENTITY: S++, // &amp and such.
	    OPEN_WAKA: S++, // <
	    SGML_DECL: S++, // <!BLARG
	    SGML_DECL_QUOTED: S++, // <!BLARG foo "bar
	    DOCTYPE: S++, // <!DOCTYPE
	    DOCTYPE_QUOTED: S++, // <!DOCTYPE "//blah
	    DOCTYPE_DTD: S++, // <!DOCTYPE "//blah" [ ...
	    DOCTYPE_DTD_QUOTED: S++, // <!DOCTYPE "//blah" [ "foo
	    COMMENT_STARTING: S++, // <!-
	    COMMENT: S++, // <!--
	    COMMENT_ENDING: S++, // <!-- blah -
	    COMMENT_ENDED: S++, // <!-- blah --
	    CDATA: S++, // <![CDATA[ something
	    CDATA_ENDING: S++, // ]
	    CDATA_ENDING_2: S++, // ]]
	    PROC_INST: S++, // <?hi
	    PROC_INST_BODY: S++, // <?hi there
	    PROC_INST_ENDING: S++, // <?hi "there" ?
	    OPEN_TAG: S++, // <strong
	    OPEN_TAG_SLASH: S++, // <strong /
	    ATTRIB: S++, // <a
	    ATTRIB_NAME: S++, // <a foo
	    ATTRIB_NAME_SAW_WHITE: S++, // <a foo _
	    ATTRIB_VALUE: S++, // <a foo=
	    ATTRIB_VALUE_QUOTED: S++, // <a foo="bar
	    ATTRIB_VALUE_CLOSED: S++, // <a foo="bar"
	    ATTRIB_VALUE_UNQUOTED: S++, // <a foo=bar
	    ATTRIB_VALUE_ENTITY_Q: S++, // <foo bar="&quot;"
	    ATTRIB_VALUE_ENTITY_U: S++, // <foo bar=&quot
	    CLOSE_TAG: S++, // </a
	    CLOSE_TAG_SAW_WHITE: S++, // </a   >
	    SCRIPT: S++, // <script> ...
	    SCRIPT_ENDING: S++ // <script> ... <
	  };

	  sax.XML_ENTITIES = {
	    'amp': '&',
	    'gt': '>',
	    'lt': '<',
	    'quot': '"',
	    'apos': "'"
	  };

	  sax.ENTITIES = {
	    'amp': '&',
	    'gt': '>',
	    'lt': '<',
	    'quot': '"',
	    'apos': "'",
	    'AElig': 198,
	    'Aacute': 193,
	    'Acirc': 194,
	    'Agrave': 192,
	    'Aring': 197,
	    'Atilde': 195,
	    'Auml': 196,
	    'Ccedil': 199,
	    'ETH': 208,
	    'Eacute': 201,
	    'Ecirc': 202,
	    'Egrave': 200,
	    'Euml': 203,
	    'Iacute': 205,
	    'Icirc': 206,
	    'Igrave': 204,
	    'Iuml': 207,
	    'Ntilde': 209,
	    'Oacute': 211,
	    'Ocirc': 212,
	    'Ograve': 210,
	    'Oslash': 216,
	    'Otilde': 213,
	    'Ouml': 214,
	    'THORN': 222,
	    'Uacute': 218,
	    'Ucirc': 219,
	    'Ugrave': 217,
	    'Uuml': 220,
	    'Yacute': 221,
	    'aacute': 225,
	    'acirc': 226,
	    'aelig': 230,
	    'agrave': 224,
	    'aring': 229,
	    'atilde': 227,
	    'auml': 228,
	    'ccedil': 231,
	    'eacute': 233,
	    'ecirc': 234,
	    'egrave': 232,
	    'eth': 240,
	    'euml': 235,
	    'iacute': 237,
	    'icirc': 238,
	    'igrave': 236,
	    'iuml': 239,
	    'ntilde': 241,
	    'oacute': 243,
	    'ocirc': 244,
	    'ograve': 242,
	    'oslash': 248,
	    'otilde': 245,
	    'ouml': 246,
	    'szlig': 223,
	    'thorn': 254,
	    'uacute': 250,
	    'ucirc': 251,
	    'ugrave': 249,
	    'uuml': 252,
	    'yacute': 253,
	    'yuml': 255,
	    'copy': 169,
	    'reg': 174,
	    'nbsp': 160,
	    'iexcl': 161,
	    'cent': 162,
	    'pound': 163,
	    'curren': 164,
	    'yen': 165,
	    'brvbar': 166,
	    'sect': 167,
	    'uml': 168,
	    'ordf': 170,
	    'laquo': 171,
	    'not': 172,
	    'shy': 173,
	    'macr': 175,
	    'deg': 176,
	    'plusmn': 177,
	    'sup1': 185,
	    'sup2': 178,
	    'sup3': 179,
	    'acute': 180,
	    'micro': 181,
	    'para': 182,
	    'middot': 183,
	    'cedil': 184,
	    'ordm': 186,
	    'raquo': 187,
	    'frac14': 188,
	    'frac12': 189,
	    'frac34': 190,
	    'iquest': 191,
	    'times': 215,
	    'divide': 247,
	    'OElig': 338,
	    'oelig': 339,
	    'Scaron': 352,
	    'scaron': 353,
	    'Yuml': 376,
	    'fnof': 402,
	    'circ': 710,
	    'tilde': 732,
	    'Alpha': 913,
	    'Beta': 914,
	    'Gamma': 915,
	    'Delta': 916,
	    'Epsilon': 917,
	    'Zeta': 918,
	    'Eta': 919,
	    'Theta': 920,
	    'Iota': 921,
	    'Kappa': 922,
	    'Lambda': 923,
	    'Mu': 924,
	    'Nu': 925,
	    'Xi': 926,
	    'Omicron': 927,
	    'Pi': 928,
	    'Rho': 929,
	    'Sigma': 931,
	    'Tau': 932,
	    'Upsilon': 933,
	    'Phi': 934,
	    'Chi': 935,
	    'Psi': 936,
	    'Omega': 937,
	    'alpha': 945,
	    'beta': 946,
	    'gamma': 947,
	    'delta': 948,
	    'epsilon': 949,
	    'zeta': 950,
	    'eta': 951,
	    'theta': 952,
	    'iota': 953,
	    'kappa': 954,
	    'lambda': 955,
	    'mu': 956,
	    'nu': 957,
	    'xi': 958,
	    'omicron': 959,
	    'pi': 960,
	    'rho': 961,
	    'sigmaf': 962,
	    'sigma': 963,
	    'tau': 964,
	    'upsilon': 965,
	    'phi': 966,
	    'chi': 967,
	    'psi': 968,
	    'omega': 969,
	    'thetasym': 977,
	    'upsih': 978,
	    'piv': 982,
	    'ensp': 8194,
	    'emsp': 8195,
	    'thinsp': 8201,
	    'zwnj': 8204,
	    'zwj': 8205,
	    'lrm': 8206,
	    'rlm': 8207,
	    'ndash': 8211,
	    'mdash': 8212,
	    'lsquo': 8216,
	    'rsquo': 8217,
	    'sbquo': 8218,
	    'ldquo': 8220,
	    'rdquo': 8221,
	    'bdquo': 8222,
	    'dagger': 8224,
	    'Dagger': 8225,
	    'bull': 8226,
	    'hellip': 8230,
	    'permil': 8240,
	    'prime': 8242,
	    'Prime': 8243,
	    'lsaquo': 8249,
	    'rsaquo': 8250,
	    'oline': 8254,
	    'frasl': 8260,
	    'euro': 8364,
	    'image': 8465,
	    'weierp': 8472,
	    'real': 8476,
	    'trade': 8482,
	    'alefsym': 8501,
	    'larr': 8592,
	    'uarr': 8593,
	    'rarr': 8594,
	    'darr': 8595,
	    'harr': 8596,
	    'crarr': 8629,
	    'lArr': 8656,
	    'uArr': 8657,
	    'rArr': 8658,
	    'dArr': 8659,
	    'hArr': 8660,
	    'forall': 8704,
	    'part': 8706,
	    'exist': 8707,
	    'empty': 8709,
	    'nabla': 8711,
	    'isin': 8712,
	    'notin': 8713,
	    'ni': 8715,
	    'prod': 8719,
	    'sum': 8721,
	    'minus': 8722,
	    'lowast': 8727,
	    'radic': 8730,
	    'prop': 8733,
	    'infin': 8734,
	    'ang': 8736,
	    'and': 8743,
	    'or': 8744,
	    'cap': 8745,
	    'cup': 8746,
	    'int': 8747,
	    'there4': 8756,
	    'sim': 8764,
	    'cong': 8773,
	    'asymp': 8776,
	    'ne': 8800,
	    'equiv': 8801,
	    'le': 8804,
	    'ge': 8805,
	    'sub': 8834,
	    'sup': 8835,
	    'nsub': 8836,
	    'sube': 8838,
	    'supe': 8839,
	    'oplus': 8853,
	    'otimes': 8855,
	    'perp': 8869,
	    'sdot': 8901,
	    'lceil': 8968,
	    'rceil': 8969,
	    'lfloor': 8970,
	    'rfloor': 8971,
	    'lang': 9001,
	    'rang': 9002,
	    'loz': 9674,
	    'spades': 9824,
	    'clubs': 9827,
	    'hearts': 9829,
	    'diams': 9830
	  };

	  Object.keys(sax.ENTITIES).forEach(function (key) {
	    var e = sax.ENTITIES[key];
	    var s = typeof e === 'number' ? String.fromCharCode(e) : e;
	    sax.ENTITIES[key] = s;
	  });

	  for (var s in sax.STATE) {
	    sax.STATE[sax.STATE[s]] = s;
	  }

	  // shorthand
	  S = sax.STATE;

	  function emit (parser, event, data) {
	    parser[event] && parser[event](data);
	  }

	  function emitNode (parser, nodeType, data) {
	    if (parser.textNode) closeText(parser);
	    emit(parser, nodeType, data);
	  }

	  function closeText (parser) {
	    parser.textNode = textopts(parser.opt, parser.textNode);
	    if (parser.textNode) emit(parser, 'ontext', parser.textNode);
	    parser.textNode = '';
	  }

	  function textopts (opt, text) {
	    if (opt.trim) text = text.trim();
	    if (opt.normalize) text = text.replace(/\s+/g, ' ');
	    return text
	  }

	  function error (parser, er) {
	    closeText(parser);
	    if (parser.trackPosition) {
	      er += '\nLine: ' + parser.line +
	        '\nColumn: ' + parser.column +
	        '\nChar: ' + parser.c;
	    }
	    er = new Error(er);
	    parser.error = er;
	    emit(parser, 'onerror', er);
	    return parser
	  }

	  function end (parser) {
	    if (parser.sawRoot && !parser.closedRoot) strictFail(parser, 'Unclosed root tag');
	    if ((parser.state !== S.BEGIN) &&
	      (parser.state !== S.BEGIN_WHITESPACE) &&
	      (parser.state !== S.TEXT)) {
	      error(parser, 'Unexpected end');
	    }
	    closeText(parser);
	    parser.c = '';
	    parser.closed = true;
	    emit(parser, 'onend');
	    SAXParser.call(parser, parser.strict, parser.opt);
	    return parser
	  }

	  function strictFail (parser, message) {
	    if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
	      throw new Error('bad call to strictFail')
	    }
	    if (parser.strict) {
	      error(parser, message);
	    }
	  }

	  function newTag (parser) {
	    if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
	    var parent = parser.tags[parser.tags.length - 1] || parser;
	    var tag = parser.tag = { name: parser.tagName, attributes: {} };

	    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
	    if (parser.opt.xmlns) {
	      tag.ns = parent.ns;
	    }
	    parser.attribList.length = 0;
	    emitNode(parser, 'onopentagstart', tag);
	  }

	  function qname (name, attribute) {
	    var i = name.indexOf(':');
	    var qualName = i < 0 ? [ '', name ] : name.split(':');
	    var prefix = qualName[0];
	    var local = qualName[1];

	    // <x "xmlns"="http://foo">
	    if (attribute && name === 'xmlns') {
	      prefix = 'xmlns';
	      local = '';
	    }

	    return { prefix: prefix, local: local }
	  }

	  function attrib (parser) {
	    if (!parser.strict) {
	      parser.attribName = parser.attribName[parser.looseCase]();
	    }

	    if (parser.attribList.indexOf(parser.attribName) !== -1 ||
	      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
	      parser.attribName = parser.attribValue = '';
	      return
	    }

	    if (parser.opt.xmlns) {
	      var qn = qname(parser.attribName, true);
	      var prefix = qn.prefix;
	      var local = qn.local;

	      if (prefix === 'xmlns') {
	        // namespace binding attribute. push the binding into scope
	        if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
	          strictFail(parser,
	            'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' +
	            'Actual: ' + parser.attribValue);
	        } else if (local === 'xmlns' && parser.attribValue !== XMLNS_NAMESPACE) {
	          strictFail(parser,
	            'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' +
	            'Actual: ' + parser.attribValue);
	        } else {
	          var tag = parser.tag;
	          var parent = parser.tags[parser.tags.length - 1] || parser;
	          if (tag.ns === parent.ns) {
	            tag.ns = Object.create(parent.ns);
	          }
	          tag.ns[local] = parser.attribValue;
	        }
	      }

	      // defer onattribute events until all attributes have been seen
	      // so any new bindings can take effect. preserve attribute order
	      // so deferred events can be emitted in document order
	      parser.attribList.push([parser.attribName, parser.attribValue]);
	    } else {
	      // in non-xmlns mode, we can emit the event right away
	      parser.tag.attributes[parser.attribName] = parser.attribValue;
	      emitNode(parser, 'onattribute', {
	        name: parser.attribName,
	        value: parser.attribValue
	      });
	    }

	    parser.attribName = parser.attribValue = '';
	  }

	  function openTag (parser, selfClosing) {
	    if (parser.opt.xmlns) {
	      // emit namespace binding events
	      var tag = parser.tag;

	      // add namespace info to tag
	      var qn = qname(parser.tagName);
	      tag.prefix = qn.prefix;
	      tag.local = qn.local;
	      tag.uri = tag.ns[qn.prefix] || '';

	      if (tag.prefix && !tag.uri) {
	        strictFail(parser, 'Unbound namespace prefix: ' +
	          JSON.stringify(parser.tagName));
	        tag.uri = qn.prefix;
	      }

	      var parent = parser.tags[parser.tags.length - 1] || parser;
	      if (tag.ns && parent.ns !== tag.ns) {
	        Object.keys(tag.ns).forEach(function (p) {
	          emitNode(parser, 'onopennamespace', {
	            prefix: p,
	            uri: tag.ns[p]
	          });
	        });
	      }

	      // handle deferred onattribute events
	      // Note: do not apply default ns to attributes:
	      //   http://www.w3.org/TR/REC-xml-names/#defaulting
	      for (var i = 0, l = parser.attribList.length; i < l; i++) {
	        var nv = parser.attribList[i];
	        var name = nv[0];
	        var value = nv[1];
	        var qualName = qname(name, true);
	        var prefix = qualName.prefix;
	        var local = qualName.local;
	        var uri = prefix === '' ? '' : (tag.ns[prefix] || '');
	        var a = {
	          name: name,
	          value: value,
	          prefix: prefix,
	          local: local,
	          uri: uri
	        };

	        // if there's any attributes with an undefined namespace,
	        // then fail on them now.
	        if (prefix && prefix !== 'xmlns' && !uri) {
	          strictFail(parser, 'Unbound namespace prefix: ' +
	            JSON.stringify(prefix));
	          a.uri = prefix;
	        }
	        parser.tag.attributes[name] = a;
	        emitNode(parser, 'onattribute', a);
	      }
	      parser.attribList.length = 0;
	    }

	    parser.tag.isSelfClosing = !!selfClosing;

	    // process the tag
	    parser.sawRoot = true;
	    parser.tags.push(parser.tag);
	    emitNode(parser, 'onopentag', parser.tag);
	    if (!selfClosing) {
	      // special case for <script> in non-strict mode.
	      if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
	        parser.state = S.SCRIPT;
	      } else {
	        parser.state = S.TEXT;
	      }
	      parser.tag = null;
	      parser.tagName = '';
	    }
	    parser.attribName = parser.attribValue = '';
	    parser.attribList.length = 0;
	  }

	  function closeTag (parser) {
	    if (!parser.tagName) {
	      strictFail(parser, 'Weird empty close tag.');
	      parser.textNode += '</>';
	      parser.state = S.TEXT;
	      return
	    }

	    if (parser.script) {
	      if (parser.tagName !== 'script') {
	        parser.script += '</' + parser.tagName + '>';
	        parser.tagName = '';
	        parser.state = S.SCRIPT;
	        return
	      }
	      emitNode(parser, 'onscript', parser.script);
	      parser.script = '';
	    }

	    // first make sure that the closing tag actually exists.
	    // <a><b></c></b></a> will close everything, otherwise.
	    var t = parser.tags.length;
	    var tagName = parser.tagName;
	    if (!parser.strict) {
	      tagName = tagName[parser.looseCase]();
	    }
	    var closeTo = tagName;
	    while (t--) {
	      var close = parser.tags[t];
	      if (close.name !== closeTo) {
	        // fail the first time in strict mode
	        strictFail(parser, 'Unexpected close tag');
	      } else {
	        break
	      }
	    }

	    // didn't find it.  we already failed for strict, so just abort.
	    if (t < 0) {
	      strictFail(parser, 'Unmatched closing tag: ' + parser.tagName);
	      parser.textNode += '</' + parser.tagName + '>';
	      parser.state = S.TEXT;
	      return
	    }
	    parser.tagName = tagName;
	    var s = parser.tags.length;
	    while (s-- > t) {
	      var tag = parser.tag = parser.tags.pop();
	      parser.tagName = parser.tag.name;
	      emitNode(parser, 'onclosetag', parser.tagName);

	      var x = {};
	      for (var i in tag.ns) {
	        x[i] = tag.ns[i];
	      }

	      var parent = parser.tags[parser.tags.length - 1] || parser;
	      if (parser.opt.xmlns && tag.ns !== parent.ns) {
	        // remove namespace bindings introduced by tag
	        Object.keys(tag.ns).forEach(function (p) {
	          var n = tag.ns[p];
	          emitNode(parser, 'onclosenamespace', { prefix: p, uri: n });
	        });
	      }
	    }
	    if (t === 0) parser.closedRoot = true;
	    parser.tagName = parser.attribValue = parser.attribName = '';
	    parser.attribList.length = 0;
	    parser.state = S.TEXT;
	  }

	  function parseEntity (parser) {
	    var entity = parser.entity;
	    var entityLC = entity.toLowerCase();
	    var num;
	    var numStr = '';

	    if (parser.ENTITIES[entity]) {
	      return parser.ENTITIES[entity]
	    }
	    if (parser.ENTITIES[entityLC]) {
	      return parser.ENTITIES[entityLC]
	    }
	    entity = entityLC;
	    if (entity.charAt(0) === '#') {
	      if (entity.charAt(1) === 'x') {
	        entity = entity.slice(2);
	        num = parseInt(entity, 16);
	        numStr = num.toString(16);
	      } else {
	        entity = entity.slice(1);
	        num = parseInt(entity, 10);
	        numStr = num.toString(10);
	      }
	    }
	    entity = entity.replace(/^0+/, '');
	    if (isNaN(num) || numStr.toLowerCase() !== entity) {
	      strictFail(parser, 'Invalid character entity');
	      return '&' + parser.entity + ';'
	    }

	    return String.fromCodePoint(num)
	  }

	  function beginWhiteSpace (parser, c) {
	    if (c === '<') {
	      parser.state = S.OPEN_WAKA;
	      parser.startTagPosition = parser.position;
	    } else if (!isWhitespace(c)) {
	      // have to process this as a text node.
	      // weird, but happens.
	      strictFail(parser, 'Non-whitespace before first tag.');
	      parser.textNode = c;
	      parser.state = S.TEXT;
	    }
	  }

	  function charAt (chunk, i) {
	    var result = '';
	    if (i < chunk.length) {
	      result = chunk.charAt(i);
	    }
	    return result
	  }

	  function write (chunk) {
	    var parser = this;
	    if (this.error) {
	      throw this.error
	    }
	    if (parser.closed) {
	      return error(parser,
	        'Cannot write after close. Assign an onready handler.')
	    }
	    if (chunk === null) {
	      return end(parser)
	    }
	    if (typeof chunk === 'object') {
	      chunk = chunk.toString();
	    }
	    var i = 0;
	    var c = '';
	    while (true) {
	      c = charAt(chunk, i++);
	      parser.c = c;

	      if (!c) {
	        break
	      }

	      if (parser.trackPosition) {
	        parser.position++;
	        if (c === '\n') {
	          parser.line++;
	          parser.column = 0;
	        } else {
	          parser.column++;
	        }
	      }

	      switch (parser.state) {
	        case S.BEGIN:
	          parser.state = S.BEGIN_WHITESPACE;
	          if (c === '\uFEFF') {
	            continue
	          }
	          beginWhiteSpace(parser, c);
	          continue

	        case S.BEGIN_WHITESPACE:
	          beginWhiteSpace(parser, c);
	          continue

	        case S.TEXT:
	          if (parser.sawRoot && !parser.closedRoot) {
	            var starti = i - 1;
	            while (c && c !== '<' && c !== '&') {
	              c = charAt(chunk, i++);
	              if (c && parser.trackPosition) {
	                parser.position++;
	                if (c === '\n') {
	                  parser.line++;
	                  parser.column = 0;
	                } else {
	                  parser.column++;
	                }
	              }
	            }
	            parser.textNode += chunk.substring(starti, i - 1);
	          }
	          if (c === '<' && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
	            parser.state = S.OPEN_WAKA;
	            parser.startTagPosition = parser.position;
	          } else {
	            if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
	              strictFail(parser, 'Text data outside of root node.');
	            }
	            if (c === '&') {
	              parser.state = S.TEXT_ENTITY;
	            } else {
	              parser.textNode += c;
	            }
	          }
	          continue

	        case S.SCRIPT:
	          // only non-strict
	          if (c === '<') {
	            parser.state = S.SCRIPT_ENDING;
	          } else {
	            parser.script += c;
	          }
	          continue

	        case S.SCRIPT_ENDING:
	          if (c === '/') {
	            parser.state = S.CLOSE_TAG;
	          } else {
	            parser.script += '<' + c;
	            parser.state = S.SCRIPT;
	          }
	          continue

	        case S.OPEN_WAKA:
	          // either a /, ?, !, or text is coming next.
	          if (c === '!') {
	            parser.state = S.SGML_DECL;
	            parser.sgmlDecl = '';
	          } else if (isWhitespace(c)) ; else if (isMatch(nameStart, c)) {
	            parser.state = S.OPEN_TAG;
	            parser.tagName = c;
	          } else if (c === '/') {
	            parser.state = S.CLOSE_TAG;
	            parser.tagName = '';
	          } else if (c === '?') {
	            parser.state = S.PROC_INST;
	            parser.procInstName = parser.procInstBody = '';
	          } else {
	            strictFail(parser, 'Unencoded <');
	            // if there was some whitespace, then add that in.
	            if (parser.startTagPosition + 1 < parser.position) {
	              var pad = parser.position - parser.startTagPosition;
	              c = new Array(pad).join(' ') + c;
	            }
	            parser.textNode += '<' + c;
	            parser.state = S.TEXT;
	          }
	          continue

	        case S.SGML_DECL:
	          if (parser.sgmlDecl + c === '--') {
	            parser.state = S.COMMENT;
	            parser.comment = '';
	            parser.sgmlDecl = '';
	            continue;
	          }

	          if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
	            parser.state = S.DOCTYPE_DTD;
	            parser.doctype += '<!' + parser.sgmlDecl + c;
	            parser.sgmlDecl = '';
	          } else if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
	            emitNode(parser, 'onopencdata');
	            parser.state = S.CDATA;
	            parser.sgmlDecl = '';
	            parser.cdata = '';
	          } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
	            parser.state = S.DOCTYPE;
	            if (parser.doctype || parser.sawRoot) {
	              strictFail(parser,
	                'Inappropriately located doctype declaration');
	            }
	            parser.doctype = '';
	            parser.sgmlDecl = '';
	          } else if (c === '>') {
	            emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl);
	            parser.sgmlDecl = '';
	            parser.state = S.TEXT;
	          } else if (isQuote(c)) {
	            parser.state = S.SGML_DECL_QUOTED;
	            parser.sgmlDecl += c;
	          } else {
	            parser.sgmlDecl += c;
	          }
	          continue

	        case S.SGML_DECL_QUOTED:
	          if (c === parser.q) {
	            parser.state = S.SGML_DECL;
	            parser.q = '';
	          }
	          parser.sgmlDecl += c;
	          continue

	        case S.DOCTYPE:
	          if (c === '>') {
	            parser.state = S.TEXT;
	            emitNode(parser, 'ondoctype', parser.doctype);
	            parser.doctype = true; // just remember that we saw it.
	          } else {
	            parser.doctype += c;
	            if (c === '[') {
	              parser.state = S.DOCTYPE_DTD;
	            } else if (isQuote(c)) {
	              parser.state = S.DOCTYPE_QUOTED;
	              parser.q = c;
	            }
	          }
	          continue

	        case S.DOCTYPE_QUOTED:
	          parser.doctype += c;
	          if (c === parser.q) {
	            parser.q = '';
	            parser.state = S.DOCTYPE;
	          }
	          continue

	        case S.DOCTYPE_DTD:
	          if (c === ']') {
	            parser.doctype += c;
	            parser.state = S.DOCTYPE;
	          } else if (c === '<') {
	            parser.state = S.OPEN_WAKA;
	            parser.startTagPosition = parser.position;
	          } else if (isQuote(c)) {
	            parser.doctype += c;
	            parser.state = S.DOCTYPE_DTD_QUOTED;
	            parser.q = c;
	          } else {
	            parser.doctype += c;
	          }
	          continue

	        case S.DOCTYPE_DTD_QUOTED:
	          parser.doctype += c;
	          if (c === parser.q) {
	            parser.state = S.DOCTYPE_DTD;
	            parser.q = '';
	          }
	          continue

	        case S.COMMENT:
	          if (c === '-') {
	            parser.state = S.COMMENT_ENDING;
	          } else {
	            parser.comment += c;
	          }
	          continue

	        case S.COMMENT_ENDING:
	          if (c === '-') {
	            parser.state = S.COMMENT_ENDED;
	            parser.comment = textopts(parser.opt, parser.comment);
	            if (parser.comment) {
	              emitNode(parser, 'oncomment', parser.comment);
	            }
	            parser.comment = '';
	          } else {
	            parser.comment += '-' + c;
	            parser.state = S.COMMENT;
	          }
	          continue

	        case S.COMMENT_ENDED:
	          if (c !== '>') {
	            strictFail(parser, 'Malformed comment');
	            // allow <!-- blah -- bloo --> in non-strict mode,
	            // which is a comment of " blah -- bloo "
	            parser.comment += '--' + c;
	            parser.state = S.COMMENT;
	          } else if (parser.doctype && parser.doctype !== true) {
	            parser.state = S.DOCTYPE_DTD;
	          } else {
	            parser.state = S.TEXT;
	          }
	          continue

	        case S.CDATA:
	          if (c === ']') {
	            parser.state = S.CDATA_ENDING;
	          } else {
	            parser.cdata += c;
	          }
	          continue

	        case S.CDATA_ENDING:
	          if (c === ']') {
	            parser.state = S.CDATA_ENDING_2;
	          } else {
	            parser.cdata += ']' + c;
	            parser.state = S.CDATA;
	          }
	          continue

	        case S.CDATA_ENDING_2:
	          if (c === '>') {
	            if (parser.cdata) {
	              emitNode(parser, 'oncdata', parser.cdata);
	            }
	            emitNode(parser, 'onclosecdata');
	            parser.cdata = '';
	            parser.state = S.TEXT;
	          } else if (c === ']') {
	            parser.cdata += ']';
	          } else {
	            parser.cdata += ']]' + c;
	            parser.state = S.CDATA;
	          }
	          continue

	        case S.PROC_INST:
	          if (c === '?') {
	            parser.state = S.PROC_INST_ENDING;
	          } else if (isWhitespace(c)) {
	            parser.state = S.PROC_INST_BODY;
	          } else {
	            parser.procInstName += c;
	          }
	          continue

	        case S.PROC_INST_BODY:
	          if (!parser.procInstBody && isWhitespace(c)) {
	            continue
	          } else if (c === '?') {
	            parser.state = S.PROC_INST_ENDING;
	          } else {
	            parser.procInstBody += c;
	          }
	          continue

	        case S.PROC_INST_ENDING:
	          if (c === '>') {
	            emitNode(parser, 'onprocessinginstruction', {
	              name: parser.procInstName,
	              body: parser.procInstBody
	            });
	            parser.procInstName = parser.procInstBody = '';
	            parser.state = S.TEXT;
	          } else {
	            parser.procInstBody += '?' + c;
	            parser.state = S.PROC_INST_BODY;
	          }
	          continue

	        case S.OPEN_TAG:
	          if (isMatch(nameBody, c)) {
	            parser.tagName += c;
	          } else {
	            newTag(parser);
	            if (c === '>') {
	              openTag(parser);
	            } else if (c === '/') {
	              parser.state = S.OPEN_TAG_SLASH;
	            } else {
	              if (!isWhitespace(c)) {
	                strictFail(parser, 'Invalid character in tag name');
	              }
	              parser.state = S.ATTRIB;
	            }
	          }
	          continue

	        case S.OPEN_TAG_SLASH:
	          if (c === '>') {
	            openTag(parser, true);
	            closeTag(parser);
	          } else {
	            strictFail(parser, 'Forward-slash in opening tag not followed by >');
	            parser.state = S.ATTRIB;
	          }
	          continue

	        case S.ATTRIB:
	          // haven't read the attribute name yet.
	          if (isWhitespace(c)) {
	            continue
	          } else if (c === '>') {
	            openTag(parser);
	          } else if (c === '/') {
	            parser.state = S.OPEN_TAG_SLASH;
	          } else if (isMatch(nameStart, c)) {
	            parser.attribName = c;
	            parser.attribValue = '';
	            parser.state = S.ATTRIB_NAME;
	          } else {
	            strictFail(parser, 'Invalid attribute name');
	          }
	          continue

	        case S.ATTRIB_NAME:
	          if (c === '=') {
	            parser.state = S.ATTRIB_VALUE;
	          } else if (c === '>') {
	            strictFail(parser, 'Attribute without value');
	            parser.attribValue = parser.attribName;
	            attrib(parser);
	            openTag(parser);
	          } else if (isWhitespace(c)) {
	            parser.state = S.ATTRIB_NAME_SAW_WHITE;
	          } else if (isMatch(nameBody, c)) {
	            parser.attribName += c;
	          } else {
	            strictFail(parser, 'Invalid attribute name');
	          }
	          continue

	        case S.ATTRIB_NAME_SAW_WHITE:
	          if (c === '=') {
	            parser.state = S.ATTRIB_VALUE;
	          } else if (isWhitespace(c)) {
	            continue
	          } else {
	            strictFail(parser, 'Attribute without value');
	            parser.tag.attributes[parser.attribName] = '';
	            parser.attribValue = '';
	            emitNode(parser, 'onattribute', {
	              name: parser.attribName,
	              value: ''
	            });
	            parser.attribName = '';
	            if (c === '>') {
	              openTag(parser);
	            } else if (isMatch(nameStart, c)) {
	              parser.attribName = c;
	              parser.state = S.ATTRIB_NAME;
	            } else {
	              strictFail(parser, 'Invalid attribute name');
	              parser.state = S.ATTRIB;
	            }
	          }
	          continue

	        case S.ATTRIB_VALUE:
	          if (isWhitespace(c)) {
	            continue
	          } else if (isQuote(c)) {
	            parser.q = c;
	            parser.state = S.ATTRIB_VALUE_QUOTED;
	          } else {
	            if (!parser.opt.unquotedAttributeValues) {
	              error(parser, 'Unquoted attribute value');
	            }
	            parser.state = S.ATTRIB_VALUE_UNQUOTED;
	            parser.attribValue = c;
	          }
	          continue

	        case S.ATTRIB_VALUE_QUOTED:
	          if (c !== parser.q) {
	            if (c === '&') {
	              parser.state = S.ATTRIB_VALUE_ENTITY_Q;
	            } else {
	              parser.attribValue += c;
	            }
	            continue
	          }
	          attrib(parser);
	          parser.q = '';
	          parser.state = S.ATTRIB_VALUE_CLOSED;
	          continue

	        case S.ATTRIB_VALUE_CLOSED:
	          if (isWhitespace(c)) {
	            parser.state = S.ATTRIB;
	          } else if (c === '>') {
	            openTag(parser);
	          } else if (c === '/') {
	            parser.state = S.OPEN_TAG_SLASH;
	          } else if (isMatch(nameStart, c)) {
	            strictFail(parser, 'No whitespace between attributes');
	            parser.attribName = c;
	            parser.attribValue = '';
	            parser.state = S.ATTRIB_NAME;
	          } else {
	            strictFail(parser, 'Invalid attribute name');
	          }
	          continue

	        case S.ATTRIB_VALUE_UNQUOTED:
	          if (!isAttribEnd(c)) {
	            if (c === '&') {
	              parser.state = S.ATTRIB_VALUE_ENTITY_U;
	            } else {
	              parser.attribValue += c;
	            }
	            continue
	          }
	          attrib(parser);
	          if (c === '>') {
	            openTag(parser);
	          } else {
	            parser.state = S.ATTRIB;
	          }
	          continue

	        case S.CLOSE_TAG:
	          if (!parser.tagName) {
	            if (isWhitespace(c)) {
	              continue
	            } else if (notMatch(nameStart, c)) {
	              if (parser.script) {
	                parser.script += '</' + c;
	                parser.state = S.SCRIPT;
	              } else {
	                strictFail(parser, 'Invalid tagname in closing tag.');
	              }
	            } else {
	              parser.tagName = c;
	            }
	          } else if (c === '>') {
	            closeTag(parser);
	          } else if (isMatch(nameBody, c)) {
	            parser.tagName += c;
	          } else if (parser.script) {
	            parser.script += '</' + parser.tagName;
	            parser.tagName = '';
	            parser.state = S.SCRIPT;
	          } else {
	            if (!isWhitespace(c)) {
	              strictFail(parser, 'Invalid tagname in closing tag');
	            }
	            parser.state = S.CLOSE_TAG_SAW_WHITE;
	          }
	          continue

	        case S.CLOSE_TAG_SAW_WHITE:
	          if (isWhitespace(c)) {
	            continue
	          }
	          if (c === '>') {
	            closeTag(parser);
	          } else {
	            strictFail(parser, 'Invalid characters in closing tag');
	          }
	          continue

	        case S.TEXT_ENTITY:
	        case S.ATTRIB_VALUE_ENTITY_Q:
	        case S.ATTRIB_VALUE_ENTITY_U:
	          var returnState;
	          var buffer;
	          switch (parser.state) {
	            case S.TEXT_ENTITY:
	              returnState = S.TEXT;
	              buffer = 'textNode';
	              break

	            case S.ATTRIB_VALUE_ENTITY_Q:
	              returnState = S.ATTRIB_VALUE_QUOTED;
	              buffer = 'attribValue';
	              break

	            case S.ATTRIB_VALUE_ENTITY_U:
	              returnState = S.ATTRIB_VALUE_UNQUOTED;
	              buffer = 'attribValue';
	              break
	          }

	          if (c === ';') {
	            var parsedEntity = parseEntity(parser);
	            if (parser.opt.unparsedEntities && !Object.values(sax.XML_ENTITIES).includes(parsedEntity)) {
	              parser.entity = '';
	              parser.state = returnState;
	              parser.write(parsedEntity);
	            } else {
	              parser[buffer] += parsedEntity;
	              parser.entity = '';
	              parser.state = returnState;
	            }
	          } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
	            parser.entity += c;
	          } else {
	            strictFail(parser, 'Invalid character in entity name');
	            parser[buffer] += '&' + parser.entity + c;
	            parser.entity = '';
	            parser.state = returnState;
	          }

	          continue

	        default: /* istanbul ignore next */ {
	          throw new Error(parser, 'Unknown state: ' + parser.state)
	        }
	      }
	    } // while

	    if (parser.position >= parser.bufferCheckPosition) {
	      checkBufferLength(parser);
	    }
	    return parser
	  }

	  /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
	  /* istanbul ignore next */
	  if (!String.fromCodePoint) {
	    (function () {
	      var stringFromCharCode = String.fromCharCode;
	      var floor = Math.floor;
	      var fromCodePoint = function () {
	        var MAX_SIZE = 0x4000;
	        var codeUnits = [];
	        var highSurrogate;
	        var lowSurrogate;
	        var index = -1;
	        var length = arguments.length;
	        if (!length) {
	          return ''
	        }
	        var result = '';
	        while (++index < length) {
	          var codePoint = Number(arguments[index]);
	          if (
	            !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
	            codePoint < 0 || // not a valid Unicode code point
	            codePoint > 0x10FFFF || // not a valid Unicode code point
	            floor(codePoint) !== codePoint // not an integer
	          ) {
	            throw RangeError('Invalid code point: ' + codePoint)
	          }
	          if (codePoint <= 0xFFFF) { // BMP code point
	            codeUnits.push(codePoint);
	          } else { // Astral code point; split in surrogate halves
	            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
	            codePoint -= 0x10000;
	            highSurrogate = (codePoint >> 10) + 0xD800;
	            lowSurrogate = (codePoint % 0x400) + 0xDC00;
	            codeUnits.push(highSurrogate, lowSurrogate);
	          }
	          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
	            result += stringFromCharCode.apply(null, codeUnits);
	            codeUnits.length = 0;
	          }
	        }
	        return result
	      };
	      /* istanbul ignore next */
	      if (Object.defineProperty) {
	        Object.defineProperty(String, 'fromCodePoint', {
	          value: fromCodePoint,
	          configurable: true,
	          writable: true
	        });
	      } else {
	        String.fromCodePoint = fromCodePoint;
	      }
	    }());
	  }
	})(exports); 
} (sax$1));

Object.defineProperty(xml, "__esModule", { value: true });
xml.XElement = void 0;
xml.parseXml = parseXml;
const sax = sax$1;
const error_1 = error;
class XElement {
    constructor(name) {
        this.name = name;
        this.value = "";
        this.attributes = null;
        this.isCData = false;
        this.elements = null;
        if (!name) {
            throw (0, error_1.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
        }
        if (!isValidName(name)) {
            throw (0, error_1.newError)(`Invalid element name: ${name}`, "ERR_XML_ELEMENT_INVALID_NAME");
        }
    }
    attribute(name) {
        const result = this.attributes === null ? null : this.attributes[name];
        if (result == null) {
            throw (0, error_1.newError)(`No attribute "${name}"`, "ERR_XML_MISSED_ATTRIBUTE");
        }
        return result;
    }
    removeAttribute(name) {
        if (this.attributes !== null) {
            delete this.attributes[name];
        }
    }
    element(name, ignoreCase = false, errorIfMissed = null) {
        const result = this.elementOrNull(name, ignoreCase);
        if (result === null) {
            throw (0, error_1.newError)(errorIfMissed || `No element "${name}"`, "ERR_XML_MISSED_ELEMENT");
        }
        return result;
    }
    elementOrNull(name, ignoreCase = false) {
        if (this.elements === null) {
            return null;
        }
        for (const element of this.elements) {
            if (isNameEquals(element, name, ignoreCase)) {
                return element;
            }
        }
        return null;
    }
    getElements(name, ignoreCase = false) {
        if (this.elements === null) {
            return [];
        }
        return this.elements.filter(it => isNameEquals(it, name, ignoreCase));
    }
    elementValueOrEmpty(name, ignoreCase = false) {
        const element = this.elementOrNull(name, ignoreCase);
        return element === null ? "" : element.value;
    }
}
xml.XElement = XElement;
const NAME_REG_EXP = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function isValidName(name) {
    return NAME_REG_EXP.test(name);
}
function isNameEquals(element, name, ignoreCase) {
    const elementName = element.name;
    return elementName === name || (ignoreCase === true && elementName.length === name.length && elementName.toLowerCase() === name.toLowerCase());
}
function parseXml(data) {
    let rootElement = null;
    const parser = sax.parser(true, {});
    const elements = [];
    parser.onopentag = saxElement => {
        const element = new XElement(saxElement.name);
        element.attributes = saxElement.attributes;
        if (rootElement === null) {
            rootElement = element;
        }
        else {
            const parent = elements[elements.length - 1];
            if (parent.elements == null) {
                parent.elements = [];
            }
            parent.elements.push(element);
        }
        elements.push(element);
    };
    parser.onclosetag = () => {
        elements.pop();
    };
    parser.ontext = text => {
        if (elements.length > 0) {
            elements[elements.length - 1].value = text;
        }
    };
    parser.oncdata = cdata => {
        const element = elements[elements.length - 1];
        element.value = cdata;
        element.isCData = true;
    };
    parser.onerror = err => {
        throw err;
    };
    parser.write(data);
    return rootElement;
}

var MemoLazy$1 = {};

Object.defineProperty(MemoLazy$1, "__esModule", { value: true });
MemoLazy$1.MemoLazy = void 0;
class MemoLazy {
    constructor(selector, creator) {
        this.selector = selector;
        this.creator = creator;
        this.selected = undefined;
        this._value = undefined;
    }
    get hasValue() {
        return this._value !== undefined;
    }
    get value() {
        const selected = this.selector();
        if (this._value !== undefined && equals(this.selected, selected)) {
            // value exists and selected hasn't changed, so return the cached value
            return this._value;
        }
        this.selected = selected;
        const result = this.creator(selected);
        this.value = result;
        return result;
    }
    set value(value) {
        this._value = value;
    }
}
MemoLazy$1.MemoLazy = MemoLazy;
function equals(firstValue, secondValue) {
    const isFirstObject = typeof firstValue === "object" && firstValue !== null;
    const isSecondObject = typeof secondValue === "object" && secondValue !== null;
    // do a shallow comparison of objects, arrays etc.
    if (isFirstObject && isSecondObject) {
        const keys1 = Object.keys(firstValue);
        const keys2 = Object.keys(secondValue);
        return keys1.length === keys2.length && keys1.every((key) => equals(firstValue[key], secondValue[key]));
    }
    // otherwise just compare the values directly
    return firstValue === secondValue;
}

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CURRENT_APP_PACKAGE_FILE_NAME = exports.CURRENT_APP_INSTALLER_FILE_NAME = exports.MemoLazy = exports.newError = exports.XElement = exports.parseXml = exports.ProgressCallbackTransform = exports.UUID = exports.parseDn = exports.githubUrl = exports.getS3LikeProviderBaseUrl = exports.configureRequestUrl = exports.parseJson = exports.safeStringifyJson = exports.configureRequestOptionsFromUrl = exports.configureRequestOptions = exports.safeGetHeader = exports.DigestTransform = exports.HttpExecutor = exports.createHttpError = exports.HttpError = exports.CancellationError = exports.CancellationToken = void 0;
	exports.asArray = asArray;
	var CancellationToken_1 = CancellationToken$1;
	Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function () { return CancellationToken_1.CancellationToken; } });
	Object.defineProperty(exports, "CancellationError", { enumerable: true, get: function () { return CancellationToken_1.CancellationError; } });
	var httpExecutor_1 = httpExecutor;
	Object.defineProperty(exports, "HttpError", { enumerable: true, get: function () { return httpExecutor_1.HttpError; } });
	Object.defineProperty(exports, "createHttpError", { enumerable: true, get: function () { return httpExecutor_1.createHttpError; } });
	Object.defineProperty(exports, "HttpExecutor", { enumerable: true, get: function () { return httpExecutor_1.HttpExecutor; } });
	Object.defineProperty(exports, "DigestTransform", { enumerable: true, get: function () { return httpExecutor_1.DigestTransform; } });
	Object.defineProperty(exports, "safeGetHeader", { enumerable: true, get: function () { return httpExecutor_1.safeGetHeader; } });
	Object.defineProperty(exports, "configureRequestOptions", { enumerable: true, get: function () { return httpExecutor_1.configureRequestOptions; } });
	Object.defineProperty(exports, "configureRequestOptionsFromUrl", { enumerable: true, get: function () { return httpExecutor_1.configureRequestOptionsFromUrl; } });
	Object.defineProperty(exports, "safeStringifyJson", { enumerable: true, get: function () { return httpExecutor_1.safeStringifyJson; } });
	Object.defineProperty(exports, "parseJson", { enumerable: true, get: function () { return httpExecutor_1.parseJson; } });
	Object.defineProperty(exports, "configureRequestUrl", { enumerable: true, get: function () { return httpExecutor_1.configureRequestUrl; } });
	var publishOptions_1 = publishOptions;
	Object.defineProperty(exports, "getS3LikeProviderBaseUrl", { enumerable: true, get: function () { return publishOptions_1.getS3LikeProviderBaseUrl; } });
	Object.defineProperty(exports, "githubUrl", { enumerable: true, get: function () { return publishOptions_1.githubUrl; } });
	var rfc2253Parser_1 = rfc2253Parser;
	Object.defineProperty(exports, "parseDn", { enumerable: true, get: function () { return rfc2253Parser_1.parseDn; } });
	var uuid_1 = uuid;
	Object.defineProperty(exports, "UUID", { enumerable: true, get: function () { return uuid_1.UUID; } });
	var ProgressCallbackTransform_1 = ProgressCallbackTransform$1;
	Object.defineProperty(exports, "ProgressCallbackTransform", { enumerable: true, get: function () { return ProgressCallbackTransform_1.ProgressCallbackTransform; } });
	var xml_1 = xml;
	Object.defineProperty(exports, "parseXml", { enumerable: true, get: function () { return xml_1.parseXml; } });
	Object.defineProperty(exports, "XElement", { enumerable: true, get: function () { return xml_1.XElement; } });
	var error_1 = error;
	Object.defineProperty(exports, "newError", { enumerable: true, get: function () { return error_1.newError; } });
	var MemoLazy_1 = MemoLazy$1;
	Object.defineProperty(exports, "MemoLazy", { enumerable: true, get: function () { return MemoLazy_1.MemoLazy; } });
	// nsis
	exports.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe";
	// nsis-web
	exports.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
	function asArray(v) {
	    if (v == null) {
	        return [];
	    }
	    else if (Array.isArray(v)) {
	        return v;
	    }
	    else {
	        return [v];
	    }
	}
	
} (out));

var fs$i = {};

var universalify$1 = {};

universalify$1.fromCallback = function (fn) {
  return Object.defineProperty(function (...args) {
    if (typeof args[args.length - 1] === 'function') fn.apply(this, args);
    else {
      return new Promise((resolve, reject) => {
        args.push((err, res) => (err != null) ? reject(err) : resolve(res));
        fn.apply(this, args);
      })
    }
  }, 'name', { value: fn.name })
};

universalify$1.fromPromise = function (fn) {
  return Object.defineProperty(function (...args) {
    const cb = args[args.length - 1];
    if (typeof cb !== 'function') return fn.apply(this, args)
    else {
      args.pop();
      fn.apply(this, args).then(r => cb(null, r), cb);
    }
  }, 'name', { value: fn.name })
};

var constants$2 = require$$0$3;

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd
};
try {
  process.cwd();
} catch (er) {}

// This check is needed until node.js 12 is required
if (typeof process.chdir === 'function') {
  var chdir = process.chdir;
  process.chdir = function (d) {
    cwd = null;
    chdir.call(process, d);
  };
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}

var polyfills$1 = patch$3;

function patch$3 (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants$2.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (fs.chmod && !fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (fs.chown && !fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = typeof fs.rename !== 'function' ? fs.rename
    : (function (fs$rename) {
      function rename (from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB (er) {
          if (er
              && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY")
              && Date.now() - start < 60000) {
            setTimeout(function() {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er);
              });
            }, backoff);
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
      return rename
    })(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = typeof fs.read !== 'function' ? fs.read
  : (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++;
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
    return read
  })(fs.read);

  fs.readSync = typeof fs.readSync !== 'function' ? fs.readSync
  : (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0;
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          continue
        }
        throw er
      }
    }
  }})(fs.readSync);

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants$2.O_WRONLY | constants$2.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants$2.O_WRONLY | constants$2.O_SYMLINK, mode);

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true;
      var ret;
      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret
    };
  }

  function patchLutimes (fs) {
    if (constants$2.hasOwnProperty("O_SYMLINK") && fs.futimes) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants$2.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants$2.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }
        return ret
      };

    } else if (fs.futimes) {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb); };
      fs.lutimesSync = function () {};
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000;
          if (stats.gid < 0) stats.gid += 0x100000000;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target);
      if (stats) {
        if (stats.uid < 0) stats.uid += 0x100000000;
        if (stats.gid < 0) stats.gid += 0x100000000;
      }
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}

var Stream = require$$0$1.Stream;

var legacyStreams = legacy$1;

function legacy$1 (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

var clone_1 = clone$1;

var getPrototypeOf = Object.getPrototypeOf || function (obj) {
  return obj.__proto__
};

function clone$1 (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: getPrototypeOf(obj) };
  else
    var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy
}

var fs$h = require$$1$2;
var polyfills = polyfills$1;
var legacy = legacyStreams;
var clone = clone_1;

var util$2 = require$$1$1;

/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue;
var previousSymbol;

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue');
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous');
} else {
  gracefulQueue = '___graceful-fs.queue';
  previousSymbol = '___graceful-fs.previous';
}

function noop () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  });
}

var debug$2 = noop;
if (util$2.debuglog)
  debug$2 = util$2.debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug$2 = function() {
    var m = util$2.format.apply(util$2, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };

// Once time initialization
if (!fs$h[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$h, queue);

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs$h.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs$h, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          resetQueue();
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments);
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close
  })(fs$h.close);

  fs$h.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs$h, arguments);
      resetQueue();
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync
  })(fs$h.closeSync);

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug$2(fs$h[gracefulQueue]);
      require$$5.equal(fs$h[gracefulQueue].length, 0);
    });
  }
}

if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$h[gracefulQueue]);
}

var gracefulFs = patch$2(clone(fs$h));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$h.__patched) {
    gracefulFs = patch$2(fs$h);
    fs$h.__patched = true;
}

function patch$2 (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch$2;

  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb, startTime) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb, startTime) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile)
    fs.appendFile = appendFile;
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb, startTime) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$copyFile = fs.copyFile;
  if (fs$copyFile)
    fs.copyFile = copyFile;
  function copyFile (src, dest, flags, cb) {
    if (typeof flags === 'function') {
      cb = flags;
      flags = 0;
    }
    return go$copyFile(src, dest, flags, cb)

    function go$copyFile (src, dest, flags, cb, startTime) {
      return fs$copyFile(src, dest, flags, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$copyFile, [src, dest, flags, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  var noReaddirOptionVersions = /^v[0-5]\./;
  function readdir (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    var go$readdir = noReaddirOptionVersions.test(process.version)
      ? function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, fs$readdirCallback(
          path, options, cb, startTime
        ))
      }
      : function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, options, fs$readdirCallback(
          path, options, cb, startTime
        ))
      };

    return go$readdir(path, options, cb)

    function fs$readdirCallback (path, options, cb, startTime) {
      return function (err, files) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([
            go$readdir,
            [path, options, cb],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        else {
          if (files && files.sort)
            files.sort();

          if (typeof cb === 'function')
            cb.call(this, err, files);
        }
      }
    }
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }

  var fs$WriteStream = fs.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  // legacy names
  var FileReadStream = ReadStream;
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open;
  fs.open = open;
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null;

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb, startTime) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug$2('ENQUEUE', elem[0].name, elem[1]);
  fs$h[gracefulQueue].push(elem);
  retry();
}

// keep track of the timeout between retry() calls
var retryTimer;

// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
function resetQueue () {
  var now = Date.now();
  for (var i = 0; i < fs$h[gracefulQueue].length; ++i) {
    // entries that are only a length of 2 are from an older version, don't
    // bother modifying those since they'll be retried anyway.
    if (fs$h[gracefulQueue][i].length > 2) {
      fs$h[gracefulQueue][i][3] = now; // startTime
      fs$h[gracefulQueue][i][4] = now; // lastTime
    }
  }
  // call retry to make sure we're actively processing the queue
  retry();
}

function retry () {
  // clear the timer and remove it to help prevent unintended concurrency
  clearTimeout(retryTimer);
  retryTimer = undefined;

  if (fs$h[gracefulQueue].length === 0)
    return

  var elem = fs$h[gracefulQueue].shift();
  var fn = elem[0];
  var args = elem[1];
  // these items may be unset if they were added by an older graceful-fs
  var err = elem[2];
  var startTime = elem[3];
  var lastTime = elem[4];

  // if we don't have a startTime we have no way of knowing if we've waited
  // long enough, so go ahead and retry this item now
  if (startTime === undefined) {
    debug$2('RETRY', fn.name, args);
    fn.apply(null, args);
  } else if (Date.now() - startTime >= 60000) {
    // it's been more than 60 seconds total, bail now
    debug$2('TIMEOUT', fn.name, args);
    var cb = args.pop();
    if (typeof cb === 'function')
      cb.call(null, err);
  } else {
    // the amount of time between the last attempt and right now
    var sinceAttempt = Date.now() - lastTime;
    // the amount of time between when we first tried, and when we last tried
    // rounded up to at least 1
    var sinceStart = Math.max(lastTime - startTime, 1);
    // backoff. wait longer than the total time we've been retrying, but only
    // up to a maximum of 100ms
    var desiredDelay = Math.min(sinceStart * 1.2, 100);
    // it's been long enough since the last retry, do it again
    if (sinceAttempt >= desiredDelay) {
      debug$2('RETRY', fn.name, args);
      fn.apply(null, args.concat([startTime]));
    } else {
      // if we can't do this job yet, push it to the end of the queue
      // and let the next iteration check again
      fs$h[gracefulQueue].push(elem);
    }
  }

  // schedule our next run if one isn't already scheduled
  if (retryTimer === undefined) {
    retryTimer = setTimeout(retry, 0);
  }
}

(function (exports) {
	// This is adapted from https://github.com/normalize/mz
	// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
	const u = universalify$1.fromCallback;
	const fs = gracefulFs;

	const api = [
	  'access',
	  'appendFile',
	  'chmod',
	  'chown',
	  'close',
	  'copyFile',
	  'fchmod',
	  'fchown',
	  'fdatasync',
	  'fstat',
	  'fsync',
	  'ftruncate',
	  'futimes',
	  'lchmod',
	  'lchown',
	  'link',
	  'lstat',
	  'mkdir',
	  'mkdtemp',
	  'open',
	  'opendir',
	  'readdir',
	  'readFile',
	  'readlink',
	  'realpath',
	  'rename',
	  'rm',
	  'rmdir',
	  'stat',
	  'symlink',
	  'truncate',
	  'unlink',
	  'utimes',
	  'writeFile'
	].filter(key => {
	  // Some commands are not available on some systems. Ex:
	  // fs.opendir was added in Node.js v12.12.0
	  // fs.rm was added in Node.js v14.14.0
	  // fs.lchown is not available on at least some Linux
	  return typeof fs[key] === 'function'
	});

	// Export cloned fs:
	Object.assign(exports, fs);

	// Universalify async methods:
	api.forEach(method => {
	  exports[method] = u(fs[method]);
	});

	// We differ from mz/fs in that we still ship the old, broken, fs.exists()
	// since we are a drop-in replacement for the native module
	exports.exists = function (filename, callback) {
	  if (typeof callback === 'function') {
	    return fs.exists(filename, callback)
	  }
	  return new Promise(resolve => {
	    return fs.exists(filename, resolve)
	  })
	};

	// fs.read(), fs.write(), & fs.writev() need special treatment due to multiple callback args

	exports.read = function (fd, buffer, offset, length, position, callback) {
	  if (typeof callback === 'function') {
	    return fs.read(fd, buffer, offset, length, position, callback)
	  }
	  return new Promise((resolve, reject) => {
	    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
	      if (err) return reject(err)
	      resolve({ bytesRead, buffer });
	    });
	  })
	};

	// Function signature can be
	// fs.write(fd, buffer[, offset[, length[, position]]], callback)
	// OR
	// fs.write(fd, string[, position[, encoding]], callback)
	// We need to handle both cases, so we use ...args
	exports.write = function (fd, buffer, ...args) {
	  if (typeof args[args.length - 1] === 'function') {
	    return fs.write(fd, buffer, ...args)
	  }

	  return new Promise((resolve, reject) => {
	    fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
	      if (err) return reject(err)
	      resolve({ bytesWritten, buffer });
	    });
	  })
	};

	// fs.writev only available in Node v12.9.0+
	if (typeof fs.writev === 'function') {
	  // Function signature is
	  // s.writev(fd, buffers[, position], callback)
	  // We need to handle the optional arg, so we use ...args
	  exports.writev = function (fd, buffers, ...args) {
	    if (typeof args[args.length - 1] === 'function') {
	      return fs.writev(fd, buffers, ...args)
	    }

	    return new Promise((resolve, reject) => {
	      fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
	        if (err) return reject(err)
	        resolve({ bytesWritten, buffers });
	      });
	    })
	  };
	}

	// fs.realpath.native sometimes not available if fs is monkey-patched
	if (typeof fs.realpath.native === 'function') {
	  exports.realpath.native = u(fs.realpath.native);
	} else {
	  process.emitWarning(
	    'fs.realpath.native is not a function. Is fs being monkey-patched?',
	    'Warning', 'fs-extra-WARN0003'
	  );
	} 
} (fs$i));

var makeDir$1 = {};

var utils$1 = {};

const path$h = require$$1$4;

// https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088
utils$1.checkPath = function checkPath (pth) {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path$h.parse(pth).root, ''));

    if (pathHasInvalidWinCharacters) {
      const error = new Error(`Path contains invalid characters: ${pth}`);
      error.code = 'EINVAL';
      throw error
    }
  }
};

const fs$g = fs$i;
const { checkPath } = utils$1;

const getMode = options => {
  const defaults = { mode: 0o777 };
  if (typeof options === 'number') return options
  return ({ ...defaults, ...options }).mode
};

makeDir$1.makeDir = async (dir, options) => {
  checkPath(dir);

  return fs$g.mkdir(dir, {
    mode: getMode(options),
    recursive: true
  })
};

makeDir$1.makeDirSync = (dir, options) => {
  checkPath(dir);

  return fs$g.mkdirSync(dir, {
    mode: getMode(options),
    recursive: true
  })
};

const u$a = universalify$1.fromPromise;
const { makeDir: _makeDir, makeDirSync } = makeDir$1;
const makeDir = u$a(_makeDir);

var mkdirs$2 = {
  mkdirs: makeDir,
  mkdirsSync: makeDirSync,
  // alias
  mkdirp: makeDir,
  mkdirpSync: makeDirSync,
  ensureDir: makeDir,
  ensureDirSync: makeDirSync
};

const u$9 = universalify$1.fromPromise;
const fs$f = fs$i;

function pathExists$6 (path) {
  return fs$f.access(path).then(() => true).catch(() => false)
}

var pathExists_1 = {
  pathExists: u$9(pathExists$6),
  pathExistsSync: fs$f.existsSync
};

const fs$e = gracefulFs;

function utimesMillis$1 (path, atime, mtime, callback) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  fs$e.open(path, 'r+', (err, fd) => {
    if (err) return callback(err)
    fs$e.futimes(fd, atime, mtime, futimesErr => {
      fs$e.close(fd, closeErr => {
        if (callback) callback(futimesErr || closeErr);
      });
    });
  });
}

function utimesMillisSync$1 (path, atime, mtime) {
  const fd = fs$e.openSync(path, 'r+');
  fs$e.futimesSync(fd, atime, mtime);
  return fs$e.closeSync(fd)
}

var utimes = {
  utimesMillis: utimesMillis$1,
  utimesMillisSync: utimesMillisSync$1
};

const fs$d = fs$i;
const path$g = require$$1$4;
const util$1 = require$$1$1;

function getStats$2 (src, dest, opts) {
  const statFunc = opts.dereference
    ? (file) => fs$d.stat(file, { bigint: true })
    : (file) => fs$d.lstat(file, { bigint: true });
  return Promise.all([
    statFunc(src),
    statFunc(dest).catch(err => {
      if (err.code === 'ENOENT') return null
      throw err
    })
  ]).then(([srcStat, destStat]) => ({ srcStat, destStat }))
}

function getStatsSync (src, dest, opts) {
  let destStat;
  const statFunc = opts.dereference
    ? (file) => fs$d.statSync(file, { bigint: true })
    : (file) => fs$d.lstatSync(file, { bigint: true });
  const srcStat = statFunc(src);
  try {
    destStat = statFunc(dest);
  } catch (err) {
    if (err.code === 'ENOENT') return { srcStat, destStat: null }
    throw err
  }
  return { srcStat, destStat }
}

function checkPaths (src, dest, funcName, opts, cb) {
  util$1.callbackify(getStats$2)(src, dest, opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, destStat } = stats;

    if (destStat) {
      if (areIdentical$2(srcStat, destStat)) {
        const srcBaseName = path$g.basename(src);
        const destBaseName = path$g.basename(dest);
        if (funcName === 'move' &&
          srcBaseName !== destBaseName &&
          srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return cb(null, { srcStat, destStat, isChangingCase: true })
        }
        return cb(new Error('Source and destination must not be the same.'))
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`))
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`))
      }
    }

    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      return cb(new Error(errMsg(src, dest, funcName)))
    }
    return cb(null, { srcStat, destStat })
  });
}

function checkPathsSync (src, dest, funcName, opts) {
  const { srcStat, destStat } = getStatsSync(src, dest, opts);

  if (destStat) {
    if (areIdentical$2(srcStat, destStat)) {
      const srcBaseName = path$g.basename(src);
      const destBaseName = path$g.basename(dest);
      if (funcName === 'move' &&
        srcBaseName !== destBaseName &&
        srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true }
      }
      throw new Error('Source and destination must not be the same.')
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`)
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return { srcStat, destStat }
}

// recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
function checkParentPaths (src, srcStat, dest, funcName, cb) {
  const srcParent = path$g.resolve(path$g.dirname(src));
  const destParent = path$g.resolve(path$g.dirname(dest));
  if (destParent === srcParent || destParent === path$g.parse(destParent).root) return cb()
  fs$d.stat(destParent, { bigint: true }, (err, destStat) => {
    if (err) {
      if (err.code === 'ENOENT') return cb()
      return cb(err)
    }
    if (areIdentical$2(srcStat, destStat)) {
      return cb(new Error(errMsg(src, dest, funcName)))
    }
    return checkParentPaths(src, srcStat, destParent, funcName, cb)
  });
}

function checkParentPathsSync (src, srcStat, dest, funcName) {
  const srcParent = path$g.resolve(path$g.dirname(src));
  const destParent = path$g.resolve(path$g.dirname(dest));
  if (destParent === srcParent || destParent === path$g.parse(destParent).root) return
  let destStat;
  try {
    destStat = fs$d.statSync(destParent, { bigint: true });
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  if (areIdentical$2(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return checkParentPathsSync(src, srcStat, destParent, funcName)
}

function areIdentical$2 (srcStat, destStat) {
  return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev
}

// return true if dest is a subdir of src, otherwise false.
// It only checks the path strings.
function isSrcSubdir (src, dest) {
  const srcArr = path$g.resolve(src).split(path$g.sep).filter(i => i);
  const destArr = path$g.resolve(dest).split(path$g.sep).filter(i => i);
  return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true)
}

function errMsg (src, dest, funcName) {
  return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`
}

var stat$4 = {
  checkPaths,
  checkPathsSync,
  checkParentPaths,
  checkParentPathsSync,
  isSrcSubdir,
  areIdentical: areIdentical$2
};

const fs$c = gracefulFs;
const path$f = require$$1$4;
const mkdirs$1 = mkdirs$2.mkdirs;
const pathExists$5 = pathExists_1.pathExists;
const utimesMillis = utimes.utimesMillis;
const stat$3 = stat$4;

function copy$2 (src, dest, opts, cb) {
  if (typeof opts === 'function' && !cb) {
    cb = opts;
    opts = {};
  } else if (typeof opts === 'function') {
    opts = { filter: opts };
  }

  cb = cb || function () {};
  opts = opts || {};

  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0001'
    );
  }

  stat$3.checkPaths(src, dest, 'copy', opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, destStat } = stats;
    stat$3.checkParentPaths(src, srcStat, dest, 'copy', err => {
      if (err) return cb(err)
      if (opts.filter) return handleFilter(checkParentDir, destStat, src, dest, opts, cb)
      return checkParentDir(destStat, src, dest, opts, cb)
    });
  });
}

function checkParentDir (destStat, src, dest, opts, cb) {
  const destParent = path$f.dirname(dest);
  pathExists$5(destParent, (err, dirExists) => {
    if (err) return cb(err)
    if (dirExists) return getStats$1(destStat, src, dest, opts, cb)
    mkdirs$1(destParent, err => {
      if (err) return cb(err)
      return getStats$1(destStat, src, dest, opts, cb)
    });
  });
}

function handleFilter (onInclude, destStat, src, dest, opts, cb) {
  Promise.resolve(opts.filter(src, dest)).then(include => {
    if (include) return onInclude(destStat, src, dest, opts, cb)
    return cb()
  }, error => cb(error));
}

function startCopy$1 (destStat, src, dest, opts, cb) {
  if (opts.filter) return handleFilter(getStats$1, destStat, src, dest, opts, cb)
  return getStats$1(destStat, src, dest, opts, cb)
}

function getStats$1 (destStat, src, dest, opts, cb) {
  const stat = opts.dereference ? fs$c.stat : fs$c.lstat;
  stat(src, (err, srcStat) => {
    if (err) return cb(err)

    if (srcStat.isDirectory()) return onDir$1(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isFile() ||
             srcStat.isCharacterDevice() ||
             srcStat.isBlockDevice()) return onFile$1(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isSymbolicLink()) return onLink$1(destStat, src, dest, opts, cb)
    else if (srcStat.isSocket()) return cb(new Error(`Cannot copy a socket file: ${src}`))
    else if (srcStat.isFIFO()) return cb(new Error(`Cannot copy a FIFO pipe: ${src}`))
    return cb(new Error(`Unknown file: ${src}`))
  });
}

function onFile$1 (srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return copyFile$1(srcStat, src, dest, opts, cb)
  return mayCopyFile$1(srcStat, src, dest, opts, cb)
}

function mayCopyFile$1 (srcStat, src, dest, opts, cb) {
  if (opts.overwrite) {
    fs$c.unlink(dest, err => {
      if (err) return cb(err)
      return copyFile$1(srcStat, src, dest, opts, cb)
    });
  } else if (opts.errorOnExist) {
    return cb(new Error(`'${dest}' already exists`))
  } else return cb()
}

function copyFile$1 (srcStat, src, dest, opts, cb) {
  fs$c.copyFile(src, dest, err => {
    if (err) return cb(err)
    if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src, dest, cb)
    return setDestMode$1(dest, srcStat.mode, cb)
  });
}

function handleTimestampsAndMode (srcMode, src, dest, cb) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable$1(srcMode)) {
    return makeFileWritable$1(dest, srcMode, err => {
      if (err) return cb(err)
      return setDestTimestampsAndMode(srcMode, src, dest, cb)
    })
  }
  return setDestTimestampsAndMode(srcMode, src, dest, cb)
}

function fileIsNotWritable$1 (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable$1 (dest, srcMode, cb) {
  return setDestMode$1(dest, srcMode | 0o200, cb)
}

function setDestTimestampsAndMode (srcMode, src, dest, cb) {
  setDestTimestamps$1(src, dest, err => {
    if (err) return cb(err)
    return setDestMode$1(dest, srcMode, cb)
  });
}

function setDestMode$1 (dest, srcMode, cb) {
  return fs$c.chmod(dest, srcMode, cb)
}

function setDestTimestamps$1 (src, dest, cb) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  fs$c.stat(src, (err, updatedSrcStat) => {
    if (err) return cb(err)
    return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb)
  });
}

function onDir$1 (srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return mkDirAndCopy$1(srcStat.mode, src, dest, opts, cb)
  return copyDir$1(src, dest, opts, cb)
}

function mkDirAndCopy$1 (srcMode, src, dest, opts, cb) {
  fs$c.mkdir(dest, err => {
    if (err) return cb(err)
    copyDir$1(src, dest, opts, err => {
      if (err) return cb(err)
      return setDestMode$1(dest, srcMode, cb)
    });
  });
}

function copyDir$1 (src, dest, opts, cb) {
  fs$c.readdir(src, (err, items) => {
    if (err) return cb(err)
    return copyDirItems(items, src, dest, opts, cb)
  });
}

function copyDirItems (items, src, dest, opts, cb) {
  const item = items.pop();
  if (!item) return cb()
  return copyDirItem$1(items, item, src, dest, opts, cb)
}

function copyDirItem$1 (items, item, src, dest, opts, cb) {
  const srcItem = path$f.join(src, item);
  const destItem = path$f.join(dest, item);
  stat$3.checkPaths(srcItem, destItem, 'copy', opts, (err, stats) => {
    if (err) return cb(err)
    const { destStat } = stats;
    startCopy$1(destStat, srcItem, destItem, opts, err => {
      if (err) return cb(err)
      return copyDirItems(items, src, dest, opts, cb)
    });
  });
}

function onLink$1 (destStat, src, dest, opts, cb) {
  fs$c.readlink(src, (err, resolvedSrc) => {
    if (err) return cb(err)
    if (opts.dereference) {
      resolvedSrc = path$f.resolve(process.cwd(), resolvedSrc);
    }

    if (!destStat) {
      return fs$c.symlink(resolvedSrc, dest, cb)
    } else {
      fs$c.readlink(dest, (err, resolvedDest) => {
        if (err) {
          // dest exists and is a regular file or directory,
          // Windows may throw UNKNOWN error. If dest already exists,
          // fs throws error anyway, so no need to guard against it here.
          if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs$c.symlink(resolvedSrc, dest, cb)
          return cb(err)
        }
        if (opts.dereference) {
          resolvedDest = path$f.resolve(process.cwd(), resolvedDest);
        }
        if (stat$3.isSrcSubdir(resolvedSrc, resolvedDest)) {
          return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`))
        }

        // do not copy if src is a subdir of dest since unlinking
        // dest in this case would result in removing src contents
        // and therefore a broken symlink would be created.
        if (destStat.isDirectory() && stat$3.isSrcSubdir(resolvedDest, resolvedSrc)) {
          return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`))
        }
        return copyLink$1(resolvedSrc, dest, cb)
      });
    }
  });
}

function copyLink$1 (resolvedSrc, dest, cb) {
  fs$c.unlink(dest, err => {
    if (err) return cb(err)
    return fs$c.symlink(resolvedSrc, dest, cb)
  });
}

var copy_1 = copy$2;

const fs$b = gracefulFs;
const path$e = require$$1$4;
const mkdirsSync$1 = mkdirs$2.mkdirsSync;
const utimesMillisSync = utimes.utimesMillisSync;
const stat$2 = stat$4;

function copySync$1 (src, dest, opts) {
  if (typeof opts === 'function') {
    opts = { filter: opts };
  }

  opts = opts || {};
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0002'
    );
  }

  const { srcStat, destStat } = stat$2.checkPathsSync(src, dest, 'copy', opts);
  stat$2.checkParentPathsSync(src, srcStat, dest, 'copy');
  return handleFilterAndCopy(destStat, src, dest, opts)
}

function handleFilterAndCopy (destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return
  const destParent = path$e.dirname(dest);
  if (!fs$b.existsSync(destParent)) mkdirsSync$1(destParent);
  return getStats(destStat, src, dest, opts)
}

function startCopy (destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return
  return getStats(destStat, src, dest, opts)
}

function getStats (destStat, src, dest, opts) {
  const statSync = opts.dereference ? fs$b.statSync : fs$b.lstatSync;
  const srcStat = statSync(src);

  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts)
  else if (srcStat.isFile() ||
           srcStat.isCharacterDevice() ||
           srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts)
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts)
  else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`)
  else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`)
  throw new Error(`Unknown file: ${src}`)
}

function onFile (srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile(srcStat, src, dest, opts)
  return mayCopyFile(srcStat, src, dest, opts)
}

function mayCopyFile (srcStat, src, dest, opts) {
  if (opts.overwrite) {
    fs$b.unlinkSync(dest);
    return copyFile(srcStat, src, dest, opts)
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

function copyFile (srcStat, src, dest, opts) {
  fs$b.copyFileSync(src, dest);
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
  return setDestMode(dest, srcStat.mode)
}

function handleTimestamps (srcMode, src, dest) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
  return setDestTimestamps(src, dest)
}

function fileIsNotWritable (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable (dest, srcMode) {
  return setDestMode(dest, srcMode | 0o200)
}

function setDestMode (dest, srcMode) {
  return fs$b.chmodSync(dest, srcMode)
}

function setDestTimestamps (src, dest) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  const updatedSrcStat = fs$b.statSync(src);
  return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime)
}

function onDir (srcStat, destStat, src, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts)
  return copyDir(src, dest, opts)
}

function mkDirAndCopy (srcMode, src, dest, opts) {
  fs$b.mkdirSync(dest);
  copyDir(src, dest, opts);
  return setDestMode(dest, srcMode)
}

function copyDir (src, dest, opts) {
  fs$b.readdirSync(src).forEach(item => copyDirItem(item, src, dest, opts));
}

function copyDirItem (item, src, dest, opts) {
  const srcItem = path$e.join(src, item);
  const destItem = path$e.join(dest, item);
  const { destStat } = stat$2.checkPathsSync(srcItem, destItem, 'copy', opts);
  return startCopy(destStat, srcItem, destItem, opts)
}

function onLink (destStat, src, dest, opts) {
  let resolvedSrc = fs$b.readlinkSync(src);
  if (opts.dereference) {
    resolvedSrc = path$e.resolve(process.cwd(), resolvedSrc);
  }

  if (!destStat) {
    return fs$b.symlinkSync(resolvedSrc, dest)
  } else {
    let resolvedDest;
    try {
      resolvedDest = fs$b.readlinkSync(dest);
    } catch (err) {
      // dest exists and is a regular file or directory,
      // Windows may throw UNKNOWN error. If dest already exists,
      // fs throws error anyway, so no need to guard against it here.
      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs$b.symlinkSync(resolvedSrc, dest)
      throw err
    }
    if (opts.dereference) {
      resolvedDest = path$e.resolve(process.cwd(), resolvedDest);
    }
    if (stat$2.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
    }

    // prevent copy if src is a subdir of dest since unlinking
    // dest in this case would result in removing src contents
    // and therefore a broken symlink would be created.
    if (fs$b.statSync(dest).isDirectory() && stat$2.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
    }
    return copyLink(resolvedSrc, dest)
  }
}

function copyLink (resolvedSrc, dest) {
  fs$b.unlinkSync(dest);
  return fs$b.symlinkSync(resolvedSrc, dest)
}

var copySync_1 = copySync$1;

const u$8 = universalify$1.fromCallback;
var copy$1 = {
  copy: u$8(copy_1),
  copySync: copySync_1
};

const fs$a = gracefulFs;
const path$d = require$$1$4;
const assert = require$$5;

const isWindows = (process.platform === 'win32');

function defaults (options) {
  const methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ];
  methods.forEach(m => {
    options[m] = options[m] || fs$a[m];
    m = m + 'Sync';
    options[m] = options[m] || fs$a[m];
  });

  options.maxBusyTries = options.maxBusyTries || 3;
}

function rimraf$1 (p, options, cb) {
  let busyTries = 0;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  assert(p, 'rimraf: missing path');
  assert.strictEqual(typeof p, 'string', 'rimraf: path should be a string');
  assert.strictEqual(typeof cb, 'function', 'rimraf: callback function required');
  assert(options, 'rimraf: invalid options argument provided');
  assert.strictEqual(typeof options, 'object', 'rimraf: options should be object');

  defaults(options);

  rimraf_(p, options, function CB (er) {
    if (er) {
      if ((er.code === 'EBUSY' || er.code === 'ENOTEMPTY' || er.code === 'EPERM') &&
          busyTries < options.maxBusyTries) {
        busyTries++;
        const time = busyTries * 100;
        // try again, with the same exact callback as this one.
        return setTimeout(() => rimraf_(p, options, CB), time)
      }

      // already gone
      if (er.code === 'ENOENT') er = null;
    }

    cb(er);
  });
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_ (p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, (er, st) => {
    if (er && er.code === 'ENOENT') {
      return cb(null)
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === 'EPERM' && isWindows) {
      return fixWinEPERM(p, options, er, cb)
    }

    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb)
    }

    options.unlink(p, er => {
      if (er) {
        if (er.code === 'ENOENT') {
          return cb(null)
        }
        if (er.code === 'EPERM') {
          return (isWindows)
            ? fixWinEPERM(p, options, er, cb)
            : rmdir(p, options, er, cb)
        }
        if (er.code === 'EISDIR') {
          return rmdir(p, options, er, cb)
        }
      }
      return cb(er)
    });
  });
}

function fixWinEPERM (p, options, er, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  options.chmod(p, 0o666, er2 => {
    if (er2) {
      cb(er2.code === 'ENOENT' ? null : er);
    } else {
      options.stat(p, (er3, stats) => {
        if (er3) {
          cb(er3.code === 'ENOENT' ? null : er);
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb);
        } else {
          options.unlink(p, cb);
        }
      });
    }
  });
}

function fixWinEPERMSync (p, options, er) {
  let stats;

  assert(p);
  assert(options);

  try {
    options.chmodSync(p, 0o666);
  } catch (er2) {
    if (er2.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  if (stats.isDirectory()) {
    rmdirSync(p, options, er);
  } else {
    options.unlinkSync(p);
  }
}

function rmdir (p, options, originalEr, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, er => {
    if (er && (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM')) {
      rmkids(p, options, cb);
    } else if (er && er.code === 'ENOTDIR') {
      cb(originalEr);
    } else {
      cb(er);
    }
  });
}

function rmkids (p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  options.readdir(p, (er, files) => {
    if (er) return cb(er)

    let n = files.length;
    let errState;

    if (n === 0) return options.rmdir(p, cb)

    files.forEach(f => {
      rimraf$1(path$d.join(p, f), options, er => {
        if (errState) {
          return
        }
        if (er) return cb(errState = er)
        if (--n === 0) {
          options.rmdir(p, cb);
        }
      });
    });
  });
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync (p, options) {
  let st;

  options = options || {};
  defaults(options);

  assert(p, 'rimraf: missing path');
  assert.strictEqual(typeof p, 'string', 'rimraf: path should be a string');
  assert(options, 'rimraf: missing options');
  assert.strictEqual(typeof options, 'object', 'rimraf: options should be object');

  try {
    st = options.lstatSync(p);
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er.code === 'EPERM' && isWindows) {
      fixWinEPERMSync(p, options, er);
    }
  }

  try {
    // sunos lets the root user unlink directories, which is... weird.
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null);
    } else {
      options.unlinkSync(p);
    }
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    } else if (er.code === 'EPERM') {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
    } else if (er.code !== 'EISDIR') {
      throw er
    }
    rmdirSync(p, options, er);
  }
}

function rmdirSync (p, options, originalEr) {
  assert(p);
  assert(options);

  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === 'ENOTDIR') {
      throw originalEr
    } else if (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM') {
      rmkidsSync(p, options);
    } else if (er.code !== 'ENOENT') {
      throw er
    }
  }
}

function rmkidsSync (p, options) {
  assert(p);
  assert(options);
  options.readdirSync(p).forEach(f => rimrafSync(path$d.join(p, f), options));

  if (isWindows) {
    // We only end up here once we got ENOTEMPTY at least once, and
    // at this point, we are guaranteed to have removed all the kids.
    // So, we know that it won't be ENOENT or ENOTDIR or anything else.
    // try really hard to delete stuff on windows, because it has a
    // PROFOUNDLY annoying habit of not closing handles promptly when
    // files are deleted, resulting in spurious ENOTEMPTY errors.
    const startTime = Date.now();
    do {
      try {
        const ret = options.rmdirSync(p, options);
        return ret
      } catch {}
    } while (Date.now() - startTime < 500) // give up after 500ms
  } else {
    const ret = options.rmdirSync(p, options);
    return ret
  }
}

var rimraf_1 = rimraf$1;
rimraf$1.sync = rimrafSync;

const fs$9 = gracefulFs;
const u$7 = universalify$1.fromCallback;
const rimraf = rimraf_1;

function remove$2 (path, callback) {
  // Node 14.14.0+
  if (fs$9.rm) return fs$9.rm(path, { recursive: true, force: true }, callback)
  rimraf(path, callback);
}

function removeSync$1 (path) {
  // Node 14.14.0+
  if (fs$9.rmSync) return fs$9.rmSync(path, { recursive: true, force: true })
  rimraf.sync(path);
}

var remove_1 = {
  remove: u$7(remove$2),
  removeSync: removeSync$1
};

const u$6 = universalify$1.fromPromise;
const fs$8 = fs$i;
const path$c = require$$1$4;
const mkdir$3 = mkdirs$2;
const remove$1 = remove_1;

const emptyDir = u$6(async function emptyDir (dir) {
  let items;
  try {
    items = await fs$8.readdir(dir);
  } catch {
    return mkdir$3.mkdirs(dir)
  }

  return Promise.all(items.map(item => remove$1.remove(path$c.join(dir, item))))
});

function emptyDirSync (dir) {
  let items;
  try {
    items = fs$8.readdirSync(dir);
  } catch {
    return mkdir$3.mkdirsSync(dir)
  }

  items.forEach(item => {
    item = path$c.join(dir, item);
    remove$1.removeSync(item);
  });
}

var empty = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
};

const u$5 = universalify$1.fromCallback;
const path$b = require$$1$4;
const fs$7 = gracefulFs;
const mkdir$2 = mkdirs$2;

function createFile$1 (file, callback) {
  function makeFile () {
    fs$7.writeFile(file, '', err => {
      if (err) return callback(err)
      callback();
    });
  }

  fs$7.stat(file, (err, stats) => { // eslint-disable-line handle-callback-err
    if (!err && stats.isFile()) return callback()
    const dir = path$b.dirname(file);
    fs$7.stat(dir, (err, stats) => {
      if (err) {
        // if the directory doesn't exist, make it
        if (err.code === 'ENOENT') {
          return mkdir$2.mkdirs(dir, err => {
            if (err) return callback(err)
            makeFile();
          })
        }
        return callback(err)
      }

      if (stats.isDirectory()) makeFile();
      else {
        // parent is not a directory
        // This is just to cause an internal ENOTDIR error to be thrown
        fs$7.readdir(dir, err => {
          if (err) return callback(err)
        });
      }
    });
  });
}

function createFileSync$1 (file) {
  let stats;
  try {
    stats = fs$7.statSync(file);
  } catch {}
  if (stats && stats.isFile()) return

  const dir = path$b.dirname(file);
  try {
    if (!fs$7.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOTDIR error to be thrown
      fs$7.readdirSync(dir);
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') mkdir$2.mkdirsSync(dir);
    else throw err
  }

  fs$7.writeFileSync(file, '');
}

var file = {
  createFile: u$5(createFile$1),
  createFileSync: createFileSync$1
};

const u$4 = universalify$1.fromCallback;
const path$a = require$$1$4;
const fs$6 = gracefulFs;
const mkdir$1 = mkdirs$2;
const pathExists$4 = pathExists_1.pathExists;
const { areIdentical: areIdentical$1 } = stat$4;

function createLink$1 (srcpath, dstpath, callback) {
  function makeLink (srcpath, dstpath) {
    fs$6.link(srcpath, dstpath, err => {
      if (err) return callback(err)
      callback(null);
    });
  }

  fs$6.lstat(dstpath, (_, dstStat) => {
    fs$6.lstat(srcpath, (err, srcStat) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureLink');
        return callback(err)
      }
      if (dstStat && areIdentical$1(srcStat, dstStat)) return callback(null)

      const dir = path$a.dirname(dstpath);
      pathExists$4(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return makeLink(srcpath, dstpath)
        mkdir$1.mkdirs(dir, err => {
          if (err) return callback(err)
          makeLink(srcpath, dstpath);
        });
      });
    });
  });
}

function createLinkSync$1 (srcpath, dstpath) {
  let dstStat;
  try {
    dstStat = fs$6.lstatSync(dstpath);
  } catch {}

  try {
    const srcStat = fs$6.lstatSync(srcpath);
    if (dstStat && areIdentical$1(srcStat, dstStat)) return
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err
  }

  const dir = path$a.dirname(dstpath);
  const dirExists = fs$6.existsSync(dir);
  if (dirExists) return fs$6.linkSync(srcpath, dstpath)
  mkdir$1.mkdirsSync(dir);

  return fs$6.linkSync(srcpath, dstpath)
}

var link = {
  createLink: u$4(createLink$1),
  createLinkSync: createLinkSync$1
};

const path$9 = require$$1$4;
const fs$5 = gracefulFs;
const pathExists$3 = pathExists_1.pathExists;

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

function symlinkPaths$1 (srcpath, dstpath, callback) {
  if (path$9.isAbsolute(srcpath)) {
    return fs$5.lstat(srcpath, (err) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureSymlink');
        return callback(err)
      }
      return callback(null, {
        toCwd: srcpath,
        toDst: srcpath
      })
    })
  } else {
    const dstdir = path$9.dirname(dstpath);
    const relativeToDst = path$9.join(dstdir, srcpath);
    return pathExists$3(relativeToDst, (err, exists) => {
      if (err) return callback(err)
      if (exists) {
        return callback(null, {
          toCwd: relativeToDst,
          toDst: srcpath
        })
      } else {
        return fs$5.lstat(srcpath, (err) => {
          if (err) {
            err.message = err.message.replace('lstat', 'ensureSymlink');
            return callback(err)
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: path$9.relative(dstdir, srcpath)
          })
        })
      }
    })
  }
}

function symlinkPathsSync$1 (srcpath, dstpath) {
  let exists;
  if (path$9.isAbsolute(srcpath)) {
    exists = fs$5.existsSync(srcpath);
    if (!exists) throw new Error('absolute srcpath does not exist')
    return {
      toCwd: srcpath,
      toDst: srcpath
    }
  } else {
    const dstdir = path$9.dirname(dstpath);
    const relativeToDst = path$9.join(dstdir, srcpath);
    exists = fs$5.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      }
    } else {
      exists = fs$5.existsSync(srcpath);
      if (!exists) throw new Error('relative srcpath does not exist')
      return {
        toCwd: srcpath,
        toDst: path$9.relative(dstdir, srcpath)
      }
    }
  }
}

var symlinkPaths_1 = {
  symlinkPaths: symlinkPaths$1,
  symlinkPathsSync: symlinkPathsSync$1
};

const fs$4 = gracefulFs;

function symlinkType$1 (srcpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback;
  type = (typeof type === 'function') ? false : type;
  if (type) return callback(null, type)
  fs$4.lstat(srcpath, (err, stats) => {
    if (err) return callback(null, 'file')
    type = (stats && stats.isDirectory()) ? 'dir' : 'file';
    callback(null, type);
  });
}

function symlinkTypeSync$1 (srcpath, type) {
  let stats;

  if (type) return type
  try {
    stats = fs$4.lstatSync(srcpath);
  } catch {
    return 'file'
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

var symlinkType_1 = {
  symlinkType: symlinkType$1,
  symlinkTypeSync: symlinkTypeSync$1
};

const u$3 = universalify$1.fromCallback;
const path$8 = require$$1$4;
const fs$3 = fs$i;
const _mkdirs = mkdirs$2;
const mkdirs = _mkdirs.mkdirs;
const mkdirsSync = _mkdirs.mkdirsSync;

const _symlinkPaths = symlinkPaths_1;
const symlinkPaths = _symlinkPaths.symlinkPaths;
const symlinkPathsSync = _symlinkPaths.symlinkPathsSync;

const _symlinkType = symlinkType_1;
const symlinkType = _symlinkType.symlinkType;
const symlinkTypeSync = _symlinkType.symlinkTypeSync;

const pathExists$2 = pathExists_1.pathExists;

const { areIdentical } = stat$4;

function createSymlink$1 (srcpath, dstpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback;
  type = (typeof type === 'function') ? false : type;

  fs$3.lstat(dstpath, (err, stats) => {
    if (!err && stats.isSymbolicLink()) {
      Promise.all([
        fs$3.stat(srcpath),
        fs$3.stat(dstpath)
      ]).then(([srcStat, dstStat]) => {
        if (areIdentical(srcStat, dstStat)) return callback(null)
        _createSymlink(srcpath, dstpath, type, callback);
      });
    } else _createSymlink(srcpath, dstpath, type, callback);
  });
}

function _createSymlink (srcpath, dstpath, type, callback) {
  symlinkPaths(srcpath, dstpath, (err, relative) => {
    if (err) return callback(err)
    srcpath = relative.toDst;
    symlinkType(relative.toCwd, type, (err, type) => {
      if (err) return callback(err)
      const dir = path$8.dirname(dstpath);
      pathExists$2(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return fs$3.symlink(srcpath, dstpath, type, callback)
        mkdirs(dir, err => {
          if (err) return callback(err)
          fs$3.symlink(srcpath, dstpath, type, callback);
        });
      });
    });
  });
}

function createSymlinkSync$1 (srcpath, dstpath, type) {
  let stats;
  try {
    stats = fs$3.lstatSync(dstpath);
  } catch {}
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs$3.statSync(srcpath);
    const dstStat = fs$3.statSync(dstpath);
    if (areIdentical(srcStat, dstStat)) return
  }

  const relative = symlinkPathsSync(srcpath, dstpath);
  srcpath = relative.toDst;
  type = symlinkTypeSync(relative.toCwd, type);
  const dir = path$8.dirname(dstpath);
  const exists = fs$3.existsSync(dir);
  if (exists) return fs$3.symlinkSync(srcpath, dstpath, type)
  mkdirsSync(dir);
  return fs$3.symlinkSync(srcpath, dstpath, type)
}

var symlink = {
  createSymlink: u$3(createSymlink$1),
  createSymlinkSync: createSymlinkSync$1
};

const { createFile, createFileSync } = file;
const { createLink, createLinkSync } = link;
const { createSymlink, createSymlinkSync } = symlink;

var ensure = {
  // file
  createFile,
  createFileSync,
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  // link
  createLink,
  createLinkSync,
  ensureLink: createLink,
  ensureLinkSync: createLinkSync,
  // symlink
  createSymlink,
  createSymlinkSync,
  ensureSymlink: createSymlink,
  ensureSymlinkSync: createSymlinkSync
};

function stringify$3 (obj, { EOL = '\n', finalEOL = true, replacer = null, spaces } = {}) {
  const EOF = finalEOL ? EOL : '';
  const str = JSON.stringify(obj, replacer, spaces);

  return str.replace(/\n/g, EOL) + EOF
}

function stripBom$1 (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8');
  return content.replace(/^\uFEFF/, '')
}

var utils = { stringify: stringify$3, stripBom: stripBom$1 };

let _fs;
try {
  _fs = gracefulFs;
} catch (_) {
  _fs = require$$1$2;
}
const universalify = universalify$1;
const { stringify: stringify$2, stripBom } = utils;

async function _readFile (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options };
  }

  const fs = options.fs || _fs;

  const shouldThrow = 'throws' in options ? options.throws : true;

  let data = await universalify.fromCallback(fs.readFile)(file, options);

  data = stripBom(data);

  let obj;
  try {
    obj = JSON.parse(data, options ? options.reviver : null);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`;
      throw err
    } else {
      return null
    }
  }

  return obj
}

const readFile = universalify.fromPromise(_readFile);

function readFileSync (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options };
  }

  const fs = options.fs || _fs;

  const shouldThrow = 'throws' in options ? options.throws : true;

  try {
    let content = fs.readFileSync(file, options);
    content = stripBom(content);
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`;
      throw err
    } else {
      return null
    }
  }
}

async function _writeFile (file, obj, options = {}) {
  const fs = options.fs || _fs;

  const str = stringify$2(obj, options);

  await universalify.fromCallback(fs.writeFile)(file, str, options);
}

const writeFile = universalify.fromPromise(_writeFile);

function writeFileSync (file, obj, options = {}) {
  const fs = options.fs || _fs;

  const str = stringify$2(obj, options);
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

const jsonfile$1 = {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync
};

var jsonfile_1 = jsonfile$1;

const jsonFile$1 = jsonfile_1;

var jsonfile = {
  // jsonfile exports
  readJson: jsonFile$1.readFile,
  readJsonSync: jsonFile$1.readFileSync,
  writeJson: jsonFile$1.writeFile,
  writeJsonSync: jsonFile$1.writeFileSync
};

const u$2 = universalify$1.fromCallback;
const fs$2 = gracefulFs;
const path$7 = require$$1$4;
const mkdir = mkdirs$2;
const pathExists$1 = pathExists_1.pathExists;

function outputFile$1 (file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = 'utf8';
  }

  const dir = path$7.dirname(file);
  pathExists$1(dir, (err, itDoes) => {
    if (err) return callback(err)
    if (itDoes) return fs$2.writeFile(file, data, encoding, callback)

    mkdir.mkdirs(dir, err => {
      if (err) return callback(err)

      fs$2.writeFile(file, data, encoding, callback);
    });
  });
}

function outputFileSync$1 (file, ...args) {
  const dir = path$7.dirname(file);
  if (fs$2.existsSync(dir)) {
    return fs$2.writeFileSync(file, ...args)
  }
  mkdir.mkdirsSync(dir);
  fs$2.writeFileSync(file, ...args);
}

var outputFile_1 = {
  outputFile: u$2(outputFile$1),
  outputFileSync: outputFileSync$1
};

const { stringify: stringify$1 } = utils;
const { outputFile } = outputFile_1;

async function outputJson (file, data, options = {}) {
  const str = stringify$1(data, options);

  await outputFile(file, str, options);
}

var outputJson_1 = outputJson;

const { stringify } = utils;
const { outputFileSync } = outputFile_1;

function outputJsonSync (file, data, options) {
  const str = stringify(data, options);

  outputFileSync(file, str, options);
}

var outputJsonSync_1 = outputJsonSync;

const u$1 = universalify$1.fromPromise;
const jsonFile = jsonfile;

jsonFile.outputJson = u$1(outputJson_1);
jsonFile.outputJsonSync = outputJsonSync_1;
// aliases
jsonFile.outputJSON = jsonFile.outputJson;
jsonFile.outputJSONSync = jsonFile.outputJsonSync;
jsonFile.writeJSON = jsonFile.writeJson;
jsonFile.writeJSONSync = jsonFile.writeJsonSync;
jsonFile.readJSON = jsonFile.readJson;
jsonFile.readJSONSync = jsonFile.readJsonSync;

var json$1 = jsonFile;

const fs$1 = gracefulFs;
const path$6 = require$$1$4;
const copy = copy$1.copy;
const remove = remove_1.remove;
const mkdirp = mkdirs$2.mkdirp;
const pathExists = pathExists_1.pathExists;
const stat$1 = stat$4;

function move$1 (src, dest, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  opts = opts || {};

  const overwrite = opts.overwrite || opts.clobber || false;

  stat$1.checkPaths(src, dest, 'move', opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, isChangingCase = false } = stats;
    stat$1.checkParentPaths(src, srcStat, dest, 'move', err => {
      if (err) return cb(err)
      if (isParentRoot$1(dest)) return doRename$1(src, dest, overwrite, isChangingCase, cb)
      mkdirp(path$6.dirname(dest), err => {
        if (err) return cb(err)
        return doRename$1(src, dest, overwrite, isChangingCase, cb)
      });
    });
  });
}

function isParentRoot$1 (dest) {
  const parent = path$6.dirname(dest);
  const parsedPath = path$6.parse(parent);
  return parsedPath.root === parent
}

function doRename$1 (src, dest, overwrite, isChangingCase, cb) {
  if (isChangingCase) return rename$1(src, dest, overwrite, cb)
  if (overwrite) {
    return remove(dest, err => {
      if (err) return cb(err)
      return rename$1(src, dest, overwrite, cb)
    })
  }
  pathExists(dest, (err, destExists) => {
    if (err) return cb(err)
    if (destExists) return cb(new Error('dest already exists.'))
    return rename$1(src, dest, overwrite, cb)
  });
}

function rename$1 (src, dest, overwrite, cb) {
  fs$1.rename(src, dest, err => {
    if (!err) return cb()
    if (err.code !== 'EXDEV') return cb(err)
    return moveAcrossDevice$1(src, dest, overwrite, cb)
  });
}

function moveAcrossDevice$1 (src, dest, overwrite, cb) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copy(src, dest, opts, err => {
    if (err) return cb(err)
    return remove(src, cb)
  });
}

var move_1 = move$1;

const fs = gracefulFs;
const path$5 = require$$1$4;
const copySync = copy$1.copySync;
const removeSync = remove_1.removeSync;
const mkdirpSync = mkdirs$2.mkdirpSync;
const stat = stat$4;

function moveSync (src, dest, opts) {
  opts = opts || {};
  const overwrite = opts.overwrite || opts.clobber || false;

  const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, 'move', opts);
  stat.checkParentPathsSync(src, srcStat, dest, 'move');
  if (!isParentRoot(dest)) mkdirpSync(path$5.dirname(dest));
  return doRename(src, dest, overwrite, isChangingCase)
}

function isParentRoot (dest) {
  const parent = path$5.dirname(dest);
  const parsedPath = path$5.parse(parent);
  return parsedPath.root === parent
}

function doRename (src, dest, overwrite, isChangingCase) {
  if (isChangingCase) return rename(src, dest, overwrite)
  if (overwrite) {
    removeSync(dest);
    return rename(src, dest, overwrite)
  }
  if (fs.existsSync(dest)) throw new Error('dest already exists.')
  return rename(src, dest, overwrite)
}

function rename (src, dest, overwrite) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err
    return moveAcrossDevice(src, dest, overwrite)
  }
}

function moveAcrossDevice (src, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copySync(src, dest, opts);
  return removeSync(src)
}

var moveSync_1 = moveSync;

const u = universalify$1.fromCallback;
var move = {
  move: u(move_1),
  moveSync: moveSync_1
};

var lib = {
  // Export promiseified graceful-fs:
  ...fs$i,
  // Export extra methods:
  ...copy$1,
  ...empty,
  ...ensure,
  ...json$1,
  ...mkdirs$2,
  ...move,
  ...outputFile_1,
  ...pathExists_1,
  ...remove_1
};

var BaseUpdater = {};

var AppUpdater = {};

var jsYaml = {};

var loader$1 = {};

var common$5 = {};

function isNothing(subject) {
  return (typeof subject === 'undefined') || (subject === null);
}


function isObject(subject) {
  return (typeof subject === 'object') && (subject !== null);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];

  return [ sequence ];
}


function extend(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


function isNegativeZero(number) {
  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
}


common$5.isNothing      = isNothing;
common$5.isObject       = isObject;
common$5.toArray        = toArray;
common$5.repeat         = repeat;
common$5.isNegativeZero = isNegativeZero;
common$5.extend         = extend;

function formatError(exception, compact) {
  var where = '', message = exception.reason || '(unknown reason)';

  if (!exception.mark) return message;

  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }

  where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

  if (!compact && exception.mark.snippet) {
    where += '\n\n' + exception.mark.snippet;
  }

  return message + ' ' + where;
}


function YAMLException$4(reason, mark) {
  // Super constructor
  Error.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);

  // Include stack trace in error object
  if (Error.captureStackTrace) {
    // Chrome and NodeJS
    Error.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = (new Error()).stack || '';
  }
}


// Inherit from Error
YAMLException$4.prototype = Object.create(Error.prototype);
YAMLException$4.prototype.constructor = YAMLException$4;


YAMLException$4.prototype.toString = function toString(compact) {
  return this.name + ': ' + formatError(this, compact);
};


var exception = YAMLException$4;

var common$4 = common$5;


// get snippet for a single line, respecting maxLength
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = '';
  var tail = '';
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

  if (position - lineStart > maxHalfLength) {
    head = ' ... ';
    lineStart = position - maxHalfLength + head.length;
  }

  if (lineEnd - position > maxHalfLength) {
    tail = ' ...';
    lineEnd = position + maxHalfLength - tail.length;
  }

  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, '→') + tail,
    pos: position - lineStart + head.length // relative position
  };
}


function padStart(string, max) {
  return common$4.repeat(' ', max - string.length) + string;
}


function makeSnippet$1(mark, options) {
  options = Object.create(options || null);

  if (!mark.buffer) return null;

  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent      !== 'number') options.indent      = 1;
  if (typeof options.linesBefore !== 'number') options.linesBefore = 3;
  if (typeof options.linesAfter  !== 'number') options.linesAfter  = 2;

  var re = /\r?\n|\r|\0/g;
  var lineStarts = [ 0 ];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;

  while ((match = re.exec(mark.buffer))) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);

    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }

  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;

  var result = '', i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);

  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common$4.repeat(' ', options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n' + result;
  }

  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common$4.repeat(' ', options.indent) + padStart((mark.line + 1).toString(), lineNoLength) +
    ' | ' + line.str + '\n';
  result += common$4.repeat('-', options.indent + lineNoLength + 3 + line.pos) + '^' + '\n';

  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common$4.repeat(' ', options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n';
  }

  return result.replace(/\n$/, '');
}


var snippet = makeSnippet$1;

var YAMLException$3 = exception;

var TYPE_CONSTRUCTOR_OPTIONS = [
  'kind',
  'multi',
  'resolve',
  'construct',
  'instanceOf',
  'predicate',
  'represent',
  'representName',
  'defaultStyle',
  'styleAliases'
];

var YAML_NODE_KINDS = [
  'scalar',
  'sequence',
  'mapping'
];

function compileStyleAliases(map) {
  var result = {};

  if (map !== null) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}

function Type$e(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function (name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new YAMLException$3('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });

  // TODO: Add tag format check.
  this.options       = options; // keep original options in case user wants to extend this type later
  this.tag           = tag;
  this.kind          = options['kind']          || null;
  this.resolve       = options['resolve']       || function () { return true; };
  this.construct     = options['construct']     || function (data) { return data; };
  this.instanceOf    = options['instanceOf']    || null;
  this.predicate     = options['predicate']     || null;
  this.represent     = options['represent']     || null;
  this.representName = options['representName'] || null;
  this.defaultStyle  = options['defaultStyle']  || null;
  this.multi         = options['multi']         || false;
  this.styleAliases  = compileStyleAliases(options['styleAliases'] || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new YAMLException$3('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}

var type = Type$e;

/*eslint-disable max-len*/

var YAMLException$2 = exception;
var Type$d          = type;


function compileList(schema, name) {
  var result = [];

  schema[name].forEach(function (currentType) {
    var newIndex = result.length;

    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag &&
          previousType.kind === currentType.kind &&
          previousType.multi === currentType.multi) {

        newIndex = previousIndex;
      }
    });

    result[newIndex] = currentType;
  });

  return result;
}


function compileMap(/* lists... */) {
  var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {},
        multi: {
          scalar: [],
          sequence: [],
          mapping: [],
          fallback: []
        }
      }, index, length;

  function collectType(type) {
    if (type.multi) {
      result.multi[type.kind].push(type);
      result.multi['fallback'].push(type);
    } else {
      result[type.kind][type.tag] = result['fallback'][type.tag] = type;
    }
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}


function Schema$1(definition) {
  return this.extend(definition);
}


Schema$1.prototype.extend = function extend(definition) {
  var implicit = [];
  var explicit = [];

  if (definition instanceof Type$d) {
    // Schema.extend(type)
    explicit.push(definition);

  } else if (Array.isArray(definition)) {
    // Schema.extend([ type1, type2, ... ])
    explicit = explicit.concat(definition);

  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);

  } else {
    throw new YAMLException$2('Schema.extend argument should be a Type, [ Type ], ' +
      'or a schema definition ({ implicit: [...], explicit: [...] })');
  }

  implicit.forEach(function (type) {
    if (!(type instanceof Type$d)) {
      throw new YAMLException$2('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }

    if (type.loadKind && type.loadKind !== 'scalar') {
      throw new YAMLException$2('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }

    if (type.multi) {
      throw new YAMLException$2('There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.');
    }
  });

  explicit.forEach(function (type) {
    if (!(type instanceof Type$d)) {
      throw new YAMLException$2('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }
  });

  var result = Object.create(Schema$1.prototype);

  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);

  result.compiledImplicit = compileList(result, 'implicit');
  result.compiledExplicit = compileList(result, 'explicit');
  result.compiledTypeMap  = compileMap(result.compiledImplicit, result.compiledExplicit);

  return result;
};


var schema = Schema$1;

var Type$c = type;

var str = new Type$c('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) { return data !== null ? data : ''; }
});

var Type$b = type;

var seq = new Type$b('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: function (data) { return data !== null ? data : []; }
});

var Type$a = type;

var map = new Type$a('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) { return data !== null ? data : {}; }
});

var Schema = schema;


var failsafe = new Schema({
  explicit: [
    str,
    seq,
    map
  ]
});

var Type$9 = type;

function resolveYamlNull(data) {
  if (data === null) return true;

  var max = data.length;

  return (max === 1 && data === '~') ||
         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return object === null;
}

var _null = new Type$9('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; },
    empty:     function () { return '';     }
  },
  defaultStyle: 'lowercase'
});

var Type$8 = type;

function resolveYamlBoolean(data) {
  if (data === null) return false;

  var max = data.length;

  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
}

function constructYamlBoolean(data) {
  return data === 'true' ||
         data === 'True' ||
         data === 'TRUE';
}

function isBoolean(object) {
  return Object.prototype.toString.call(object) === '[object Boolean]';
}

var bool = new Type$8('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function (object) { return object ? 'true' : 'false'; },
    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
    camelcase: function (object) { return object ? 'True' : 'False'; }
  },
  defaultStyle: 'lowercase'
});

var common$3 = common$5;
var Type$7   = type;

function isHexCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}

function isOctCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}

function isDecCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}

function resolveYamlInteger(data) {
  if (data === null) return false;

  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;

  if (!max) return false;

  ch = data[index];

  // sign
  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch !== '0' && ch !== '1') return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'o') {
      // base 8
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }
  }

  // base 10 (except 0)

  // value should not start with `_`;
  if (ch === '_') return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  // Should have digits and should not end with `_`
  if (!hasDigits || ch === '_') return false;

  return true;
}

function constructYamlInteger(data) {
  var value = data, sign = 1, ch;

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === '0') return 0;

  if (ch === '0') {
    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
    if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
    if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
  }

  return sign * parseInt(value, 10);
}

function isInteger(object) {
  return (Object.prototype.toString.call(object)) === '[object Number]' &&
         (object % 1 === 0 && !common$3.isNegativeZero(object));
}

var int = new Type$7('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
    octal:       function (obj) { return obj >= 0 ? '0o'  + obj.toString(8) : '-0o'  + obj.toString(8).slice(1); },
    decimal:     function (obj) { return obj.toString(10); },
    /* eslint-disable max-len */
    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});

var common$2 = common$5;
var Type$6   = type;

var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
  // .2e4, .2
  // special case, seems not from spec
  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$');

function resolveYamlFloat(data) {
  if (data === null) return false;

  if (!YAML_FLOAT_PATTERN.test(data) ||
      // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
    return false;
  }

  return true;
}

function constructYamlFloat(data) {
  var value, sign;

  value  = data.replace(/_/g, '').toLowerCase();
  sign   = value[0] === '-' ? -1 : 1;

  if ('+-'.indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  } else if (value === '.nan') {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}


var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;

  if (isNaN(object)) {
    switch (style) {
      case 'lowercase': return '.nan';
      case 'uppercase': return '.NAN';
      case 'camelcase': return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '.inf';
      case 'uppercase': return '.INF';
      case 'camelcase': return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '-.inf';
      case 'uppercase': return '-.INF';
      case 'camelcase': return '-.Inf';
    }
  } else if (common$2.isNegativeZero(object)) {
    return '-0.0';
  }

  res = object.toString(10);

  // JS stringifier can build scientific format without dots: 5e-100,
  // while YAML requres dot: 5.e-100. Fix it with simple hack

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

function isFloat(object) {
  return (Object.prototype.toString.call(object) === '[object Number]') &&
         (object % 1 !== 0 || common$2.isNegativeZero(object));
}

var float = new Type$6('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});

var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});

var core = json;

var Type$5 = type;

var YAML_DATE_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9])'                    + // [2] month
  '-([0-9][0-9])$');                   // [3] day

var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:[Tt]|[ \\t]+)'                 + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}

function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, date;

  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

  if (match === null) throw new Error('Date resolve error');

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if (match[9] === '-') delta = -delta;
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) date.setTime(date.getTime() - delta);

  return date;
}

function representYamlTimestamp(object /*, style*/) {
  return object.toISOString();
}

var timestamp = new Type$5('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});

var Type$4 = type;

function resolveYamlMerge(data) {
  return data === '<<' || data === null;
}

var merge = new Type$4('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: resolveYamlMerge
});

/*eslint-disable no-bitwise*/


var Type$3 = type;


// [ 64, 65, 66 ] -> [ padding, CR, LF ]
var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


function resolveYamlBinary(data) {
  if (data === null) return false;

  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

  // Convert one by one.
  for (idx = 0; idx < max; idx++) {
    code = map.indexOf(data.charAt(idx));

    // Skip CR/LF
    if (code > 64) continue;

    // Fail on illegal characters
    if (code < 0) return false;

    bitlen += 6;
  }

  // If there are any bits left, source was corrupted
  return (bitlen % 8) === 0;
}

function constructYamlBinary(data) {
  var idx, tailbits,
      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = [];

  // Collect by 6*4 bits (3 bytes)

  for (idx = 0; idx < max; idx++) {
    if ((idx % 4 === 0) && idx) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    }

    bits = (bits << 6) | map.indexOf(input.charAt(idx));
  }

  // Dump tail

  tailbits = (max % 4) * 6;

  if (tailbits === 0) {
    result.push((bits >> 16) & 0xFF);
    result.push((bits >> 8) & 0xFF);
    result.push(bits & 0xFF);
  } else if (tailbits === 18) {
    result.push((bits >> 10) & 0xFF);
    result.push((bits >> 2) & 0xFF);
  } else if (tailbits === 12) {
    result.push((bits >> 4) & 0xFF);
  }

  return new Uint8Array(result);
}

function representYamlBinary(object /*, style*/) {
  var result = '', bits = 0, idx, tail,
      max = object.length,
      map = BASE64_MAP;

  // Convert every three bytes to 4 ASCII characters.

  for (idx = 0; idx < max; idx++) {
    if ((idx % 3 === 0) && idx) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[bits & 0x3F];
    }

    bits = (bits << 8) + object[idx];
  }

  // Dump tail

  tail = max % 3;

  if (tail === 0) {
    result += map[(bits >> 18) & 0x3F];
    result += map[(bits >> 12) & 0x3F];
    result += map[(bits >> 6) & 0x3F];
    result += map[bits & 0x3F];
  } else if (tail === 2) {
    result += map[(bits >> 10) & 0x3F];
    result += map[(bits >> 4) & 0x3F];
    result += map[(bits << 2) & 0x3F];
    result += map[64];
  } else if (tail === 1) {
    result += map[(bits >> 2) & 0x3F];
    result += map[(bits << 4) & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

function isBinary(obj) {
  return Object.prototype.toString.call(obj) ===  '[object Uint8Array]';
}

var binary = new Type$3('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});

var Type$2 = type;

var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2       = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (data === null) return true;

  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
      object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if (_toString$2.call(pair) !== '[object Object]') return false;

    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }

    if (!pairHasKey) return false;

    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }

  return true;
}

function constructYamlOmap(data) {
  return data !== null ? data : [];
}

var omap = new Type$2('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});

var Type$1 = type;

var _toString$1 = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (data === null) return true;

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if (_toString$1.call(pair) !== '[object Object]') return false;

    keys = Object.keys(pair);

    if (keys.length !== 1) return false;

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return true;
}

function constructYamlPairs(data) {
  if (data === null) return [];

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    keys = Object.keys(pair);

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return result;
}

var pairs = new Type$1('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});

var Type = type;

var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (data === null) return true;

  var key, object = data;

  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data) {
  return data !== null ? data : {};
}

var set = new Type('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: constructYamlSet
});

var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});

/*eslint-disable max-len,no-use-before-define*/

var common$1              = common$5;
var YAMLException$1       = exception;
var makeSnippet         = snippet;
var DEFAULT_SCHEMA$1      = _default;


var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function _class(obj) { return Object.prototype.toString.call(obj); }

function is_EOL(c) {
  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
}

function is_WHITE_SPACE(c) {
  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
}

function is_WS_OR_EOL(c) {
  return (c === 0x09/* Tab */) ||
         (c === 0x20/* Space */) ||
         (c === 0x0A/* LF */) ||
         (c === 0x0D/* CR */);
}

function is_FLOW_INDICATOR(c) {
  return c === 0x2C/* , */ ||
         c === 0x5B/* [ */ ||
         c === 0x5D/* ] */ ||
         c === 0x7B/* { */ ||
         c === 0x7D/* } */;
}

function fromHexCode(c) {
  var lc;

  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  /*eslint-disable no-bitwise*/
  lc = c | 0x20;

  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c) {
  if (c === 0x78/* x */) { return 2; }
  if (c === 0x75/* u */) { return 4; }
  if (c === 0x55/* U */) { return 8; }
  return 0;
}

function fromDecimalCode(c) {
  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c) {
  /* eslint-disable indent */
  return (c === 0x30/* 0 */) ? '\x00' :
        (c === 0x61/* a */) ? '\x07' :
        (c === 0x62/* b */) ? '\x08' :
        (c === 0x74/* t */) ? '\x09' :
        (c === 0x09/* Tab */) ? '\x09' :
        (c === 0x6E/* n */) ? '\x0A' :
        (c === 0x76/* v */) ? '\x0B' :
        (c === 0x66/* f */) ? '\x0C' :
        (c === 0x72/* r */) ? '\x0D' :
        (c === 0x65/* e */) ? '\x1B' :
        (c === 0x20/* Space */) ? ' ' :
        (c === 0x22/* " */) ? '\x22' :
        (c === 0x2F/* / */) ? '/' :
        (c === 0x5C/* \ */) ? '\x5C' :
        (c === 0x4E/* N */) ? '\x85' :
        (c === 0x5F/* _ */) ? '\xA0' :
        (c === 0x4C/* L */) ? '\u2028' :
        (c === 0x50/* P */) ? '\u2029' : '';
}

function charFromCodepoint(c) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xD800,
    ((c - 0x010000) & 0x03FF) + 0xDC00
  );
}

var simpleEscapeCheck = new Array(256); // integer, for fast access
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}


function State$1(input, options) {
  this.input = input;

  this.filename  = options['filename']  || null;
  this.schema    = options['schema']    || DEFAULT_SCHEMA$1;
  this.onWarning = options['onWarning'] || null;
  // (Hidden) Remove? makes the loader to expect YAML 1.1 documents
  // if such documents have no explicit %YAML directive
  this.legacy    = options['legacy']    || false;

  this.json      = options['json']      || false;
  this.listener  = options['listener']  || null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap       = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;

  // position of first leading tab in the current line,
  // used to make sure there are no tabs in the indentation
  this.firstTabInLine = -1;

  this.documents = [];

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  var mark = {
    name:     state.filename,
    buffer:   state.input.slice(0, -1), // omit trailing \0
    position: state.position,
    line:     state.line,
    column:   state.position - state.lineStart
  };

  mark.snippet = makeSnippet(mark);

  return new YAMLException$1(message, mark);
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}


var directiveHandlers = {

  YAML: function handleYamlDirective(state, name, args) {

    var match, major, minor;

    if (state.version !== null) {
      throwError(state, 'duplication of %YAML directive');
    }

    if (args.length !== 1) {
      throwError(state, 'YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, 'ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, 'unacceptable YAML version of the document');
    }

    state.version = args[0];
    state.checkLineBreaks = (minor < 2);

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, 'unsupported YAML version of the document');
    }
  },

  TAG: function handleTagDirective(state, name, args) {

    var handle, prefix;

    if (args.length !== 2) {
      throwError(state, 'TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
    }

    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, 'tag prefix is malformed: ' + prefix);
    }

    state.tagMap[handle] = prefix;
  }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 0x09 ||
              (0x20 <= _character && _character <= 0x10FFFF))) {
          throwError(state, 'expected valid JSON character');
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, 'the stream contains non-printable characters');
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  if (!common$1.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty$1.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode,
  startLine, startLineStart, startPos) {

  var index, quantity;

  // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, 'nested arrays are not supported inside keys');
      }

      if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
        keyNode[index] = '[object Object]';
      }
    }
  }

  // Avoid code execution in load() via toString property
  // (still use its own toString for arrays, timestamps,
  // and whatever user schema extensions happen to have @@toStringTag)
  if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
    keyNode = '[object Object]';
  }


  keyNode = String(keyNode);

  if (_result === null) {
    _result = {};
  }

  if (keyTag === 'tag:yaml.org,2002:merge') {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json &&
        !_hasOwnProperty$1.call(overridableKeys, keyNode) &&
        _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    }

    // used for this specific key only because Object.defineProperty is slow
    if (keyNode === '__proto__') {
      Object.defineProperty(_result, keyNode, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: valueNode
      });
    } else {
      _result[keyNode] = valueNode;
    }
    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0A/* LF */) {
    state.position++;
  } else if (ch === 0x0D/* CR */) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
      state.position++;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23/* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);

      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20/* Space */) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, 'deficient indentation');
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position = state.position,
      ch;

  ch = state.input.charCodeAt(_position);

  // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.
  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(_position + 1) &&
      ch === state.input.charCodeAt(_position + 2)) {

    _position += 3;

    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common$1.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (is_WS_OR_EOL(ch)      ||
      is_FLOW_INDICATOR(ch) ||
      ch === 0x23/* # */    ||
      ch === 0x26/* & */    ||
      ch === 0x2A/* * */    ||
      ch === 0x21/* ! */    ||
      ch === 0x7C/* | */    ||
      ch === 0x3E/* > */    ||
      ch === 0x27/* ' */    ||
      ch === 0x22/* " */    ||
      ch === 0x25/* % */    ||
      ch === 0x40/* @ */    ||
      ch === 0x60/* ` */) {
    return false;
  }

  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
    following = state.input.charCodeAt(state.position + 1);

    if (is_WS_OR_EOL(following) ||
        withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (ch !== 0) {
    if (ch === 0x3A/* : */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) ||
          withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }

    } else if (ch === 0x23/* # */) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;

    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  }

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch,
      captureStart, captureEnd;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27/* ' */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27/* ' */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27/* ' */) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexResult,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22/* " */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22/* " */) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;

    } else if (ch === 0x5C/* \ */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);

        // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;

      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += charFromCodepoint(hexResult);

        state.position++;

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _lineStart,
      _pos,
      _tag     = state.tag,
      _result,
      _anchor  = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = Object.create(null),
      keyNode,
      keyTag,
      valueNode,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x5B/* [ */) {
    terminator = 0x5D;/* ] */
    isMapping = false;
    _result = [];
  } else if (ch === 0x7B/* { */) {
    terminator = 0x7D;/* } */
    isMapping = true;
    _result = {};
  } else {
    return false;
  }

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(++state.position);

  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    } else if (ch === 0x2C/* , */) {
      // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
      throwError(state, "expected the node content, but found ','");
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3F/* ? */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line; // Save the current line.
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2C/* , */) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping       = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent     = nodeIndent,
      emptyLines     = 0,
      atMoreIndented = false,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x7C/* | */) {
    folding = false;
  } else if (ch === 0x3E/* > */) {
    folding = true;
  } else {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
      if (CHOMPING_CLIP === chomping) {
        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (is_WHITE_SPACE(ch));

    if (ch === 0x23/* # */) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (!is_EOL(ch) && (ch !== 0));
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (ch === 0x20/* Space */)) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common$1.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        // except for the first content line (cf. Example 8.1)
        state.result += common$1.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common$1.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common$1.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {
      // Keep all line breaks except the header line break.
      state.result += common$1.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && (ch !== 0)) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _anchor   = state.anchor,
      _result   = [],
      following,
      detected  = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    if (ch !== 0x2D/* - */) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following,
      allowCompact,
      _line,
      _keyLine,
      _keyLineStart,
      _keyPos,
      _tag          = state.tag,
      _anchor       = state.anchor,
      _result       = {},
      overridableKeys = Object.create(null),
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

      if (ch === 0x3F/* ? */) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. 0x3A/* : */ === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
      }

      state.position += 1;
      ch = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;

      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        // Neither implicit nor explicit notation.
        // Reading is done. Go to the epilogue.
        break;
      }

      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3A/* : */) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true; // Keep the result of `composeNode`.
      }
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }

      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed    = false,
      tagHandle,
      tagName,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x21/* ! */) return false;

  if (state.tag !== null) {
    throwError(state, 'duplication of a tag property');
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3C/* < */) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);

  } else if (ch === 0x21/* ! */) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (ch !== 0 && ch !== 0x3E/* > */);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

      if (ch === 0x21/* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, 'tag name is malformed: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if (tagHandle === '!') {
    state.tag = '!' + tagName;

  } else if (tagHandle === '!!') {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x26/* & */) return false;

  if (state.anchor !== null) {
    throwError(state, 'duplication of an anchor property');
  }

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x2A/* * */) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine  = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      typeList,
      type,
      flowIndent,
      blockIndent;

  if (state.listener !== null) {
    state.listener('open', state);
  }

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext ||
    CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent, flowIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = '?';
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }

  } else if (state.tag === '?') {
    // Implicit resolving is not allowed for non-scalar types, and '?'
    // non-specific tag is only automatically assigned to plain scalars.
    //
    // We only need to check kind conformity in case user explicitly assigns '?'
    // tag, for example like this: "!<?> [0]"
    //
    if (state.result !== null && state.kind !== 'scalar') {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }

    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type = state.implicitTypes[typeIndex];

      if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
        state.result = type.construct(state.result);
        state.tag = type.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== '!') {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];
    } else {
      // looking for multi type
      type = null;
      typeList = state.typeMap.multi[state.kind || 'fallback'];

      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type = typeList[typeIndex];
          break;
        }
      }
    }

    if (!type) {
      throwError(state, 'unknown tag !<' + state.tag + '>');
    }

    if (state.result !== null && type.kind !== state.kind) {
      throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
    }

    if (!type.resolve(state.result, state.tag)) { // `state.result` updated in resolver if matched
      throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
    } else {
      state.result = type.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }

  if (state.listener !== null) {
    state.listener('close', state);
  }
  return state.tag !== null ||  state.anchor !== null || hasContent;
}

function readDocument(state) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      ch;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = Object.create(null);
  state.anchorMap = Object.create(null);

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (ch !== 0 && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (state.lineIndent === 0 &&
      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {

    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < (state.length - 1)) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}


function loadDocuments(input, options) {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {

    // Add tailing `\n` if not exists
    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
      input += '\n';
    }

    // Strip BOM
    if (input.charCodeAt(0) === 0xFEFF) {
      input = input.slice(1);
    }
  }

  var state = new State$1(input, options);

  var nullpos = input.indexOf('\0');

  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  }

  // Use 0 as string terminator. That significantly simplifies bounds check.
  state.input += '\0';

  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < (state.length - 1)) {
    readDocument(state);
  }

  return state.documents;
}


function loadAll(input, iterator, options) {
  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);

  if (typeof iterator !== 'function') {
    return documents;
  }

  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}


function load(input, options) {
  var documents = loadDocuments(input, options);

  if (documents.length === 0) {
    /*eslint-disable no-undefined*/
    return undefined;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new YAMLException$1('expected a single document in the stream, but found more');
}


loader$1.loadAll = loadAll;
loader$1.load    = load;

var dumper$1 = {};

/*eslint-disable no-use-before-define*/

var common              = common$5;
var YAMLException       = exception;
var DEFAULT_SCHEMA      = _default;

var _toString       = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;

var CHAR_BOM                  = 0xFEFF;
var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON                = 0x3A; /* : */
var CHAR_EQUALS               = 0x3D; /* = */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];

var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;

function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (map === null) return {};

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if (tag.slice(0, 2) === '!!') {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }
    type = schema.compiledTypeMap['fallback'][tag];

    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}

function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new YAMLException('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}


var QUOTING_TYPE_SINGLE = 1,
    QUOTING_TYPE_DOUBLE = 2;

function State(options) {
  this.schema        = options['schema'] || DEFAULT_SCHEMA;
  this.indent        = Math.max(1, (options['indent'] || 2));
  this.noArrayIndent = options['noArrayIndent'] || false;
  this.skipInvalid   = options['skipInvalid'] || false;
  this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
  this.sortKeys      = options['sortKeys'] || false;
  this.lineWidth     = options['lineWidth'] || 80;
  this.noRefs        = options['noRefs'] || false;
  this.noCompatMode  = options['noCompatMode'] || false;
  this.condenseFlow  = options['condenseFlow'] || false;
  this.quotingType   = options['quotingType'] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes   = options['forceQuotes'] || false;
  this.replacer      = typeof options['replacer'] === 'function' ? options['replacer'] : null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';

  this.duplicates = [];
  this.usedDuplicates = null;
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString(string, spaces) {
  var ind = common.repeat(' ', spaces),
      position = 0,
      next = -1,
      result = '',
      line,
      length = string.length;

  while (position < length) {
    next = string.indexOf('\n', position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }

    if (line.length && line !== '\n') result += ind;

    result += line;
  }

  return result;
}

function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
}

// [33] s-white ::= s-space | s-tab
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}

// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable(c) {
  return  (0x00020 <= c && c <= 0x00007E)
      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== CHAR_BOM)
      ||  (0x10000 <= c && c <= 0x10FFFF);
}

// [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// Including s-white (for some reason, examples doesn't match specs in this aspect)
// ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark
function isNsCharOrWhitespace(c) {
  return isPrintable(c)
    && c !== CHAR_BOM
    // - b-char
    && c !== CHAR_CARRIAGE_RETURN
    && c !== CHAR_LINE_FEED;
}

// [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
//                             c = flow-in   ⇒ ns-plain-safe-in
//                             c = block-key ⇒ ns-plain-safe-out
//                             c = flow-key  ⇒ ns-plain-safe-in
// [128] ns-plain-safe-out ::= ns-char
// [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
// [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
//                            | ( /* An ns-char preceding */ “#” )
//                            | ( “:” /* Followed by an ns-plain-safe(c) */ )
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    inblock ? // c = flow-in
      cIsNsCharOrWhitespace
      : cIsNsCharOrWhitespace
        // - c-flow-indicator
        && c !== CHAR_COMMA
        && c !== CHAR_LEFT_SQUARE_BRACKET
        && c !== CHAR_RIGHT_SQUARE_BRACKET
        && c !== CHAR_LEFT_CURLY_BRACKET
        && c !== CHAR_RIGHT_CURLY_BRACKET
  )
    // ns-plain-char
    && c !== CHAR_SHARP // false on '#'
    && !(prev === CHAR_COLON && !cIsNsChar) // false on ': '
    || (isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP) // change to true on '[^ ]#'
    || (prev === CHAR_COLON && cIsNsChar); // change to true on ':[^ ]'
}

// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst(c) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
  return isPrintable(c) && c !== CHAR_BOM
    && !isWhitespace(c) // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    && c !== CHAR_MINUS
    && c !== CHAR_QUESTION
    && c !== CHAR_COLON
    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    && c !== CHAR_SHARP
    && c !== CHAR_AMPERSAND
    && c !== CHAR_ASTERISK
    && c !== CHAR_EXCLAMATION
    && c !== CHAR_VERTICAL_LINE
    && c !== CHAR_EQUALS
    && c !== CHAR_GREATER_THAN
    && c !== CHAR_SINGLE_QUOTE
    && c !== CHAR_DOUBLE_QUOTE
    // | “%” | “@” | “`”)
    && c !== CHAR_PERCENT
    && c !== CHAR_COMMERCIAL_AT
    && c !== CHAR_GRAVE_ACCENT;
}

// Simplified test for values allowed as the last character in plain style.
function isPlainSafeLast(c) {
  // just not whitespace or colon, it will be checked to be plain character later
  return !isWhitespace(c) && c !== CHAR_COLON;
}

// Same as 'string'.codePointAt(pos), but works in older browsers.
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
    }
  }
  return first;
}

// Determines whether block indentation indicator is required.
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}

var STYLE_PLAIN   = 1,
    STYLE_SINGLE  = 2,
    STYLE_LITERAL = 3,
    STYLE_FOLDED  = 4,
    STYLE_DOUBLE  = 5;

// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth,
  testAmbiguousType, quotingType, forceQuotes, inblock) {

  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false; // only checked if shouldTrackWidth
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1; // count the first line correctly
  var plain = isPlainSafeFirst(codePointAt(string, 0))
          && isPlainSafeLast(codePointAt(string, string.length - 1));

  if (singleLineOnly || forceQuotes) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        // Check if any line can be folded.
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine ||
            // Foldable line = too long, and not more-indented.
            (i - previousLineBreak - 1 > lineWidth &&
             string[previousLineBreak + 1] !== ' ');
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    // in case the end is missing a \n
    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
      (i - previousLineBreak - 1 > lineWidth &&
       string[previousLineBreak + 1] !== ' '));
  }
  // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.
  if (!hasLineBreak && !hasFoldableLine) {
    // Strings interpretable as another type have to be quoted;
    // e.g. the string 'true' vs. the boolean true.
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  // Edge case: block indentation indicator can only have one digit.
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}

// Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = (function () {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? ('"' + string + '"') : ("'" + string + "'");
      }
    }

    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
    // As indentation gets deeper, let the width decrease monotonically
    // to the lower bound min(state.lineWidth, 40).
    // Note that this implies
    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
    // This behaves better than a constant minimum width which disallows narrower options,
    // or an indent threshold which causes the width to suddenly increase.
    var lineWidth = state.lineWidth === -1
      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

    // Without knowing if keys are implicit/explicit, assume implicit for safety.
    var singleLineOnly = iskey
      // No block styles in flow mode.
      || (state.flowLevel > -1 && level >= state.flowLevel);
    function testAmbiguity(string) {
      return testImplicitResolving(state, string);
    }

    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth,
      testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {

      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return '|' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return '>' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new YAMLException('impossible error: invalid scalar style');
    }
  }());
}

// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

  // note the special case: the string '\n' counts as a "trailing" empty line.
  var clip =          string[string.length - 1] === '\n';
  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
  var chomp = keep ? '+' : (clip ? '' : '-');

  return indentIndicator + chomp + '\n';
}

// (See the note for writeScalar.)
function dropEndingNewline(string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
}

// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldString(string, width) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  var lineRe = /(\n+)([^\n]*)/g;

  // first line (possibly an empty line)
  var result = (function () {
    var nextLF = string.indexOf('\n');
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }());
  // If we haven't reached the first content line yet, don't add an extra \n.
  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
  var moreIndented;

  // rest of the lines
  var match;
  while ((match = lineRe.exec(string))) {
    var prefix = match[1], line = match[2];
    moreIndented = (line[0] === ' ');
    result += prefix
      + (!prevMoreIndented && !moreIndented && line !== ''
        ? '\n' : '')
      + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }

  return result;
}

// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine(line, width) {
  if (line === '' || line[0] === ' ') return line;

  // Since a more-indented line adds a \n, breaks can't be followed by a space.
  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
  var match;
  // start is an inclusive index. end, curr, and next are exclusive.
  var start = 0, end, curr = 0, next = 0;
  var result = '';

  // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.
  while ((match = breakRe.exec(line))) {
    next = match.index;
    // maintain invariant: curr - start <= width
    if (next - start > width) {
      end = (curr > start) ? curr : next; // derive end <= length-2
      result += '\n' + line.slice(start, end);
      // skip the space that was output as \n
      start = end + 1;                    // derive start <= length-1
    }
    curr = next;
  }

  // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.
  result += '\n';
  // Insert a break if the remainder is too long and there is a break available.
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }

  return result.slice(1); // drop extra \n joiner
}

// Escapes a double-quoted string.
function escapeString(string) {
  var result = '';
  var char = 0;
  var escapeSeq;

  for (var i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];

    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 0x10000) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }

  return result;
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level, value, false, false) ||
        (typeof value === 'undefined' &&
         writeNode(state, level, null, false, false))) {

      if (_result !== '') _result += ',' + (!state.condenseFlow ? ' ' : '');
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level + 1, value, true, true, false, true) ||
        (typeof value === 'undefined' &&
         writeNode(state, level + 1, null, true, true, false, true))) {

      if (!compact || _result !== '') {
        _result += generateNextLine(state, level);
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += '-';
      } else {
        _result += '- ';
      }

      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {

    pairBuffer = '';
    if (_result !== '') pairBuffer += ', ';

    if (state.condenseFlow) pairBuffer += '"';

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) pairBuffer += '? ';

    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  // Allow sorting keys so that the output file is deterministic
  if (state.sortKeys === true) {
    // Default sorting
    objectKeyList.sort();
  } else if (typeof state.sortKeys === 'function') {
    // Custom sort function
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    // Something is wrong
    throw new YAMLException('sortKeys must be a boolean or a function');
  }

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || _result !== '') {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = (state.tag !== null && state.tag !== '?') ||
                   (state.dump && state.dump.length > 1024);

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf  || type.predicate) &&
        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
        (!type.predicate  || type.predicate(object))) {

      if (explicit) {
        if (type.multi && type.representName) {
          state.tag = type.representName(object);
        } else {
          state.tag = type.tag;
        }
      } else {
        state.tag = '?';
      }

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if (_toString.call(type.represent) === '[object Function]') {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);
  var inblock = block;
  var tagStr;

  if (block) {
    block = (state.flowLevel < 0 || state.flowLevel > level);
  }

  var objectOrArray = type === '[object Object]' || type === '[object Array]',
      duplicateIndex,
      duplicate;

  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }

  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
    compact = false;
  }

  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = '*ref_' + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type === '[object Object]') {
      if (block && (Object.keys(state.dump).length !== 0)) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object Array]') {
      if (block && (state.dump.length !== 0)) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object String]') {
      if (state.tag !== '?') {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type === '[object Undefined]') {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new YAMLException('unacceptable kind of an object to dump ' + type);
    }

    if (state.tag !== null && state.tag !== '?') {
      // Need to encode all characters except those allowed by the spec:
      //
      // [35] ns-dec-digit    ::=  [#x30-#x39] /* 0-9 */
      // [36] ns-hex-digit    ::=  ns-dec-digit
      //                         | [#x41-#x46] /* A-F */ | [#x61-#x66] /* a-f */
      // [37] ns-ascii-letter ::=  [#x41-#x5A] /* A-Z */ | [#x61-#x7A] /* a-z */
      // [38] ns-word-char    ::=  ns-dec-digit | ns-ascii-letter | “-”
      // [39] ns-uri-char     ::=  “%” ns-hex-digit ns-hex-digit | ns-word-char | “#”
      //                         | “;” | “/” | “?” | “:” | “@” | “&” | “=” | “+” | “$” | “,”
      //                         | “_” | “.” | “!” | “~” | “*” | “'” | “(” | “)” | “[” | “]”
      //
      // Also need to encode '!' because it has special meaning (end of tag prefix).
      //
      tagStr = encodeURI(
        state.tag[0] === '!' ? state.tag.slice(1) : state.tag
      ).replace(/!/g, '%21');

      if (state.tag[0] === '!') {
        tagStr = '!' + tagStr;
      } else if (tagStr.slice(0, 18) === 'tag:yaml.org,2002:') {
        tagStr = '!!' + tagStr.slice(18);
      } else {
        tagStr = '!<' + tagStr + '>';
      }

      state.dump = tagStr + ' ' + state.dump;
    }
  }

  return true;
}

function getDuplicateReferences(object, state) {
  var objects = [],
      duplicatesIndexes = [],
      index,
      length;

  inspectNode(object, objects, duplicatesIndexes);

  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}

function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList,
      index,
      length;

  if (object !== null && typeof object === 'object') {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);

      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);

        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}

function dump(input, options) {
  options = options || {};

  var state = new State(options);

  if (!state.noRefs) getDuplicateReferences(input, state);

  var value = input;

  if (state.replacer) {
    value = state.replacer.call({ '': value }, '', value);
  }

  if (writeNode(state, 0, value, true, true)) return state.dump + '\n';

  return '';
}

dumper$1.dump = dump;

var loader = loader$1;
var dumper = dumper$1;


function renamed(from, to) {
  return function () {
    throw new Error('Function yaml.' + from + ' is removed in js-yaml 4. ' +
      'Use yaml.' + to + ' instead, which is now safe by default.');
  };
}


jsYaml.Type                = type;
jsYaml.Schema              = schema;
jsYaml.FAILSAFE_SCHEMA     = failsafe;
jsYaml.JSON_SCHEMA         = json;
jsYaml.CORE_SCHEMA         = core;
jsYaml.DEFAULT_SCHEMA      = _default;
jsYaml.load                = loader.load;
jsYaml.loadAll             = loader.loadAll;
jsYaml.dump                = dumper.dump;
jsYaml.YAMLException       = exception;

// Re-export all types in case user wants to create custom schema
jsYaml.types = {
  binary:    binary,
  float:     float,
  map:       map,
  null:      _null,
  pairs:     pairs,
  set:       set,
  timestamp: timestamp,
  bool:      bool,
  int:       int,
  merge:     merge,
  omap:      omap,
  seq:       seq,
  str:       str
};

// Removed functions from JS-YAML 3.0.x
jsYaml.safeLoad            = renamed('safeLoad', 'load');
jsYaml.safeLoadAll         = renamed('safeLoadAll', 'loadAll');
jsYaml.safeDump            = renamed('safeDump', 'dump');

var main$1 = {};

Object.defineProperty(main$1, "__esModule", { value: true });
main$1.Lazy = void 0;
class Lazy {
    constructor(creator) {
        this._value = null;
        this.creator = creator;
    }
    get hasValue() {
        return this.creator == null;
    }
    get value() {
        if (this.creator == null) {
            return this._value;
        }
        const result = this.creator();
        this.value = result;
        return result;
    }
    set value(value) {
        this._value = value;
        this.creator = null;
    }
}
main$1.Lazy = Lazy;

var re$2 = {exports: {}};

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0';

const MAX_LENGTH$1 = 256;
const MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER ||
/* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;

// Max safe length for a build identifier. The max length minus 6 characters for
// the shortest version with a build 0.0.0+BUILD.
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH$1 - 6;

const RELEASE_TYPES = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease',
];

var constants$1 = {
  MAX_LENGTH: MAX_LENGTH$1,
  MAX_SAFE_COMPONENT_LENGTH,
  MAX_SAFE_BUILD_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1,
  RELEASE_TYPES,
  SEMVER_SPEC_VERSION,
  FLAG_INCLUDE_PRERELEASE: 0b001,
  FLAG_LOOSE: 0b010,
};

const debug$1 = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {};

var debug_1 = debug$1;

(function (module, exports) {
	const {
	  MAX_SAFE_COMPONENT_LENGTH,
	  MAX_SAFE_BUILD_LENGTH,
	  MAX_LENGTH,
	} = constants$1;
	const debug = debug_1;
	exports = module.exports = {};

	// The actual regexps go on exports.re
	const re = exports.re = [];
	const safeRe = exports.safeRe = [];
	const src = exports.src = [];
	const t = exports.t = {};
	let R = 0;

	const LETTERDASHNUMBER = '[a-zA-Z0-9-]';

	// Replace some greedy regex tokens to prevent regex dos issues. These regex are
	// used internally via the safeRe object since all inputs in this library get
	// normalized first to trim and collapse all extra whitespace. The original
	// regexes are exported for userland consumption and lower level usage. A
	// future breaking change could export the safer regex only with a note that
	// all input should have extra whitespace removed.
	const safeRegexReplacements = [
	  ['\\s', 1],
	  ['\\d', MAX_LENGTH],
	  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
	];

	const makeSafeRegex = (value) => {
	  for (const [token, max] of safeRegexReplacements) {
	    value = value
	      .split(`${token}*`).join(`${token}{0,${max}}`)
	      .split(`${token}+`).join(`${token}{1,${max}}`);
	  }
	  return value
	};

	const createToken = (name, value, isGlobal) => {
	  const safe = makeSafeRegex(value);
	  const index = R++;
	  debug(name, index, value);
	  t[name] = index;
	  src[index] = value;
	  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
	  safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
	};

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
	createToken('NUMERICIDENTIFIERLOOSE', '\\d+');

	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);

	// ## Main Version
	// Three dot-separated numeric identifiers.

	createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})`);

	createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.

	createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]
	}|${src[t.NONNUMERICIDENTIFIER]})`);

	createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]
	}|${src[t.NONNUMERICIDENTIFIER]})`);

	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
	}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

	createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
	}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
	}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
	}${src[t.PRERELEASE]}?${
	  src[t.BUILD]}?`);

	createToken('FULL', `^${src[t.FULLPLAIN]}$`);

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
	}${src[t.PRERELEASELOOSE]}?${
	  src[t.BUILD]}?`);

	createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

	createToken('GTLT', '((?:<|>)?=?)');

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

	createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:${src[t.PRERELEASE]})?${
	                     src[t.BUILD]}?` +
	                   `)?)?`);

	createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:${src[t.PRERELEASELOOSE]})?${
	                          src[t.BUILD]}?` +
	                        `)?)?`);

	createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
	createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

	// Coercion.
	// Extract anything that could conceivably be a part of a valid semver
	createToken('COERCEPLAIN', `${'(^|[^\\d])' +
	              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken('COERCEFULL', src[t.COERCEPLAIN] +
	              `(?:${src[t.PRERELEASE]})?` +
	              `(?:${src[t.BUILD]})?` +
	              `(?:$|[^\\d])`);
	createToken('COERCERTL', src[t.COERCE], true);
	createToken('COERCERTLFULL', src[t.COERCEFULL], true);

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	createToken('LONETILDE', '(?:~>?)');

	createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
	exports.tildeTrimReplace = '$1~';

	createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
	createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	createToken('LONECARET', '(?:\\^)');

	createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
	exports.caretTrimReplace = '$1^';

	createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
	createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
	createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
	}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
	exports.comparatorTrimReplace = '$1$2$3';

	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
	                   `\\s+-\\s+` +
	                   `(${src[t.XRANGEPLAIN]})` +
	                   `\\s*$`);

	createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s+-\\s+` +
	                        `(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s*$`);

	// Star ranges basically just allow anything at all.
	createToken('STAR', '(<|>)?=?\\s*\\*');
	// >=0.0.0 is like a star
	createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
	createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$'); 
} (re$2, re$2.exports));

var reExports = re$2.exports;

// parse out just the options we care about
const looseOption = Object.freeze({ loose: true });
const emptyOpts = Object.freeze({ });
const parseOptions$1 = options => {
  if (!options) {
    return emptyOpts
  }

  if (typeof options !== 'object') {
    return looseOption
  }

  return options
};
var parseOptions_1 = parseOptions$1;

const numeric = /^[0-9]+$/;
const compareIdentifiers$1 = (a, b) => {
  const anum = numeric.test(a);
  const bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
};

const rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);

var identifiers$1 = {
  compareIdentifiers: compareIdentifiers$1,
  rcompareIdentifiers,
};

const debug = debug_1;
const { MAX_LENGTH, MAX_SAFE_INTEGER } = constants$1;
const { safeRe: re$1, t: t$1 } = reExports;

const parseOptions = parseOptions_1;
const { compareIdentifiers } = identifiers$1;
let SemVer$d = class SemVer {
  constructor (version, options) {
    options = parseOptions(options);

    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
          version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version;
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`)
    }

    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      )
    }

    debug('SemVer', version, options);
    this.options = options;
    this.loose = !!options.loose;
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease;

    const m = version.trim().match(options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL]);

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version;

    // these are actually numbers
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];

    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num
          }
        }
        return id
      });
    }

    this.build = m[5] ? m[5].split('.') : [];
    this.format();
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`;
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug('SemVer.compare', this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options);
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    return (
      compareIdentifiers(this.major, other.major) ||
      compareIdentifiers(this.minor, other.minor) ||
      compareIdentifiers(this.patch, other.patch)
    )
  }

  comparePre (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0
    }

    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug('build compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier, identifierBase) {
    switch (release) {
      case 'premajor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'preminor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0;
        this.inc('patch', identifier, identifierBase);
        this.inc('pre', identifier, identifierBase);
        break
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier, identifierBase);
        }
        this.inc('pre', identifier, identifierBase);
        break

      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre': {
        const base = Number(identifierBase) ? 1 : 0;

        if (!identifier && identifierBase === false) {
          throw new Error('invalid increment argument: identifier is empty')
        }

        if (this.prerelease.length === 0) {
          this.prerelease = [base];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            // didn't increment anything
            if (identifier === this.prerelease.join('.') && identifierBase === false) {
              throw new Error('invalid increment argument: identifier already exists')
            }
            this.prerelease.push(base);
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          let prerelease = [identifier, base];
          if (identifierBase === false) {
            prerelease = [identifier];
          }
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = prerelease;
            }
          } else {
            this.prerelease = prerelease;
          }
        }
        break
      }
      default:
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.raw = this.format();
    if (this.build.length) {
      this.raw += `+${this.build.join('.')}`;
    }
    return this
  }
};

var semver$2 = SemVer$d;

const SemVer$c = semver$2;
const parse$6 = (version, options, throwErrors = false) => {
  if (version instanceof SemVer$c) {
    return version
  }
  try {
    return new SemVer$c(version, options)
  } catch (er) {
    if (!throwErrors) {
      return null
    }
    throw er
  }
};

var parse_1 = parse$6;

const parse$5 = parse_1;
const valid$2 = (version, options) => {
  const v = parse$5(version, options);
  return v ? v.version : null
};
var valid_1 = valid$2;

const parse$4 = parse_1;
const clean$1 = (version, options) => {
  const s = parse$4(version.trim().replace(/^[=v]+/, ''), options);
  return s ? s.version : null
};
var clean_1 = clean$1;

const SemVer$b = semver$2;

const inc$1 = (version, release, options, identifier, identifierBase) => {
  if (typeof (options) === 'string') {
    identifierBase = identifier;
    identifier = options;
    options = undefined;
  }

  try {
    return new SemVer$b(
      version instanceof SemVer$b ? version.version : version,
      options
    ).inc(release, identifier, identifierBase).version
  } catch (er) {
    return null
  }
};
var inc_1 = inc$1;

const parse$3 = parse_1;

const diff$1 = (version1, version2) => {
  const v1 = parse$3(version1, null, true);
  const v2 = parse$3(version2, null, true);
  const comparison = v1.compare(v2);

  if (comparison === 0) {
    return null
  }

  const v1Higher = comparison > 0;
  const highVersion = v1Higher ? v1 : v2;
  const lowVersion = v1Higher ? v2 : v1;
  const highHasPre = !!highVersion.prerelease.length;
  const lowHasPre = !!lowVersion.prerelease.length;

  if (lowHasPre && !highHasPre) {
    // Going from prerelease -> no prerelease requires some special casing

    // If the low version has only a major, then it will always be a major
    // Some examples:
    // 1.0.0-1 -> 1.0.0
    // 1.0.0-1 -> 1.1.1
    // 1.0.0-1 -> 2.0.0
    if (!lowVersion.patch && !lowVersion.minor) {
      return 'major'
    }

    // Otherwise it can be determined by checking the high version

    if (highVersion.patch) {
      // anything higher than a patch bump would result in the wrong version
      return 'patch'
    }

    if (highVersion.minor) {
      // anything higher than a minor bump would result in the wrong version
      return 'minor'
    }

    // bumping major/minor/patch all have same result
    return 'major'
  }

  // add the `pre` prefix if we are going to a prerelease version
  const prefix = highHasPre ? 'pre' : '';

  if (v1.major !== v2.major) {
    return prefix + 'major'
  }

  if (v1.minor !== v2.minor) {
    return prefix + 'minor'
  }

  if (v1.patch !== v2.patch) {
    return prefix + 'patch'
  }

  // high and low are preleases
  return 'prerelease'
};

var diff_1 = diff$1;

const SemVer$a = semver$2;
const major$1 = (a, loose) => new SemVer$a(a, loose).major;
var major_1 = major$1;

const SemVer$9 = semver$2;
const minor$1 = (a, loose) => new SemVer$9(a, loose).minor;
var minor_1 = minor$1;

const SemVer$8 = semver$2;
const patch$1 = (a, loose) => new SemVer$8(a, loose).patch;
var patch_1 = patch$1;

const parse$2 = parse_1;
const prerelease$1 = (version, options) => {
  const parsed = parse$2(version, options);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
};
var prerelease_1 = prerelease$1;

const SemVer$7 = semver$2;
const compare$b = (a, b, loose) =>
  new SemVer$7(a, loose).compare(new SemVer$7(b, loose));

var compare_1 = compare$b;

const compare$a = compare_1;
const rcompare$1 = (a, b, loose) => compare$a(b, a, loose);
var rcompare_1 = rcompare$1;

const compare$9 = compare_1;
const compareLoose$1 = (a, b) => compare$9(a, b, true);
var compareLoose_1 = compareLoose$1;

const SemVer$6 = semver$2;
const compareBuild$3 = (a, b, loose) => {
  const versionA = new SemVer$6(a, loose);
  const versionB = new SemVer$6(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB)
};
var compareBuild_1 = compareBuild$3;

const compareBuild$2 = compareBuild_1;
const sort$1 = (list, loose) => list.sort((a, b) => compareBuild$2(a, b, loose));
var sort_1 = sort$1;

const compareBuild$1 = compareBuild_1;
const rsort$1 = (list, loose) => list.sort((a, b) => compareBuild$1(b, a, loose));
var rsort_1 = rsort$1;

const compare$8 = compare_1;
const gt$4 = (a, b, loose) => compare$8(a, b, loose) > 0;
var gt_1 = gt$4;

const compare$7 = compare_1;
const lt$3 = (a, b, loose) => compare$7(a, b, loose) < 0;
var lt_1 = lt$3;

const compare$6 = compare_1;
const eq$2 = (a, b, loose) => compare$6(a, b, loose) === 0;
var eq_1 = eq$2;

const compare$5 = compare_1;
const neq$2 = (a, b, loose) => compare$5(a, b, loose) !== 0;
var neq_1 = neq$2;

const compare$4 = compare_1;
const gte$3 = (a, b, loose) => compare$4(a, b, loose) >= 0;
var gte_1 = gte$3;

const compare$3 = compare_1;
const lte$3 = (a, b, loose) => compare$3(a, b, loose) <= 0;
var lte_1 = lte$3;

const eq$1 = eq_1;
const neq$1 = neq_1;
const gt$3 = gt_1;
const gte$2 = gte_1;
const lt$2 = lt_1;
const lte$2 = lte_1;

const cmp$1 = (a, op, b, loose) => {
  switch (op) {
    case '===':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a === b

    case '!==':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a !== b

    case '':
    case '=':
    case '==':
      return eq$1(a, b, loose)

    case '!=':
      return neq$1(a, b, loose)

    case '>':
      return gt$3(a, b, loose)

    case '>=':
      return gte$2(a, b, loose)

    case '<':
      return lt$2(a, b, loose)

    case '<=':
      return lte$2(a, b, loose)

    default:
      throw new TypeError(`Invalid operator: ${op}`)
  }
};
var cmp_1 = cmp$1;

const SemVer$5 = semver$2;
const parse$1 = parse_1;
const { safeRe: re, t } = reExports;

const coerce$1 = (version, options) => {
  if (version instanceof SemVer$5) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version);
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {};

  let match = null;
  if (!options.rtl) {
    match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    // With includePrerelease option set, '1.2.3.4-rc' wants to coerce '2.3.4-rc', not '2.3.4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
    let next;
    while ((next = coerceRtlRegex.exec(version)) &&
        (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
            next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
    }
    // leave it in a clean state
    coerceRtlRegex.lastIndex = -1;
  }

  if (match === null) {
    return null
  }

  const major = match[2];
  const minor = match[3] || '0';
  const patch = match[4] || '0';
  const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : '';
  const build = options.includePrerelease && match[6] ? `+${match[6]}` : '';

  return parse$1(`${major}.${minor}.${patch}${prerelease}${build}`, options)
};
var coerce_1 = coerce$1;

class LRUCache {
  constructor () {
    this.max = 1000;
    this.map = new Map();
  }

  get (key) {
    const value = this.map.get(key);
    if (value === undefined) {
      return undefined
    } else {
      // Remove the key from the map and add it to the end
      this.map.delete(key);
      this.map.set(key, value);
      return value
    }
  }

  delete (key) {
    return this.map.delete(key)
  }

  set (key, value) {
    const deleted = this.delete(key);

    if (!deleted && value !== undefined) {
      // If cache is full, delete the least recently used item
      if (this.map.size >= this.max) {
        const firstKey = this.map.keys().next().value;
        this.delete(firstKey);
      }

      this.map.set(key, value);
    }

    return this
  }
}

var lrucache = LRUCache;

var range;
var hasRequiredRange;

function requireRange () {
	if (hasRequiredRange) return range;
	hasRequiredRange = 1;
	const SPACE_CHARACTERS = /\s+/g;

	// hoisted class for cyclic dependency
	class Range {
	  constructor (range, options) {
	    options = parseOptions(options);

	    if (range instanceof Range) {
	      if (
	        range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease
	      ) {
	        return range
	      } else {
	        return new Range(range.raw, options)
	      }
	    }

	    if (range instanceof Comparator) {
	      // just put it in the set and return
	      this.raw = range.value;
	      this.set = [[range]];
	      this.formatted = undefined;
	      return this
	    }

	    this.options = options;
	    this.loose = !!options.loose;
	    this.includePrerelease = !!options.includePrerelease;

	    // First reduce all whitespace as much as possible so we do not have to rely
	    // on potentially slow regexes like \s*. This is then stored and used for
	    // future error messages as well.
	    this.raw = range.trim().replace(SPACE_CHARACTERS, ' ');

	    // First, split on ||
	    this.set = this.raw
	      .split('||')
	      // map the range to a 2d array of comparators
	      .map(r => this.parseRange(r.trim()))
	      // throw out any comparator lists that are empty
	      // this generally means that it was not a valid range, which is allowed
	      // in loose mode, but will still throw if the WHOLE range is invalid.
	      .filter(c => c.length);

	    if (!this.set.length) {
	      throw new TypeError(`Invalid SemVer Range: ${this.raw}`)
	    }

	    // if we have any that are not the null set, throw out null sets.
	    if (this.set.length > 1) {
	      // keep the first one, in case they're all null sets
	      const first = this.set[0];
	      this.set = this.set.filter(c => !isNullSet(c[0]));
	      if (this.set.length === 0) {
	        this.set = [first];
	      } else if (this.set.length > 1) {
	        // if we have any that are *, then the range is just *
	        for (const c of this.set) {
	          if (c.length === 1 && isAny(c[0])) {
	            this.set = [c];
	            break
	          }
	        }
	      }
	    }

	    this.formatted = undefined;
	  }

	  get range () {
	    if (this.formatted === undefined) {
	      this.formatted = '';
	      for (let i = 0; i < this.set.length; i++) {
	        if (i > 0) {
	          this.formatted += '||';
	        }
	        const comps = this.set[i];
	        for (let k = 0; k < comps.length; k++) {
	          if (k > 0) {
	            this.formatted += ' ';
	          }
	          this.formatted += comps[k].toString().trim();
	        }
	      }
	    }
	    return this.formatted
	  }

	  format () {
	    return this.range
	  }

	  toString () {
	    return this.range
	  }

	  parseRange (range) {
	    // memoize range parsing for performance.
	    // this is a very hot path, and fully deterministic.
	    const memoOpts =
	      (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) |
	      (this.options.loose && FLAG_LOOSE);
	    const memoKey = memoOpts + ':' + range;
	    const cached = cache.get(memoKey);
	    if (cached) {
	      return cached
	    }

	    const loose = this.options.loose;
	    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	    const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
	    range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
	    debug('hyphen replace', range);

	    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	    range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
	    debug('comparator trim', range);

	    // `~ 1.2.3` => `~1.2.3`
	    range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
	    debug('tilde trim', range);

	    // `^ 1.2.3` => `^1.2.3`
	    range = range.replace(re[t.CARETTRIM], caretTrimReplace);
	    debug('caret trim', range);

	    // At this point, the range is completely trimmed and
	    // ready to be split into comparators.

	    let rangeList = range
	      .split(' ')
	      .map(comp => parseComparator(comp, this.options))
	      .join(' ')
	      .split(/\s+/)
	      // >=0.0.0 is equivalent to *
	      .map(comp => replaceGTE0(comp, this.options));

	    if (loose) {
	      // in loose mode, throw out any that are not valid comparators
	      rangeList = rangeList.filter(comp => {
	        debug('loose invalid filter', comp, this.options);
	        return !!comp.match(re[t.COMPARATORLOOSE])
	      });
	    }
	    debug('range list', rangeList);

	    // if any comparators are the null set, then replace with JUST null set
	    // if more than one comparator, remove any * comparators
	    // also, don't include the same comparator more than once
	    const rangeMap = new Map();
	    const comparators = rangeList.map(comp => new Comparator(comp, this.options));
	    for (const comp of comparators) {
	      if (isNullSet(comp)) {
	        return [comp]
	      }
	      rangeMap.set(comp.value, comp);
	    }
	    if (rangeMap.size > 1 && rangeMap.has('')) {
	      rangeMap.delete('');
	    }

	    const result = [...rangeMap.values()];
	    cache.set(memoKey, result);
	    return result
	  }

	  intersects (range, options) {
	    if (!(range instanceof Range)) {
	      throw new TypeError('a Range is required')
	    }

	    return this.set.some((thisComparators) => {
	      return (
	        isSatisfiable(thisComparators, options) &&
	        range.set.some((rangeComparators) => {
	          return (
	            isSatisfiable(rangeComparators, options) &&
	            thisComparators.every((thisComparator) => {
	              return rangeComparators.every((rangeComparator) => {
	                return thisComparator.intersects(rangeComparator, options)
	              })
	            })
	          )
	        })
	      )
	    })
	  }

	  // if ANY of the sets match ALL of its comparators, then pass
	  test (version) {
	    if (!version) {
	      return false
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    for (let i = 0; i < this.set.length; i++) {
	      if (testSet(this.set[i], version, this.options)) {
	        return true
	      }
	    }
	    return false
	  }
	}

	range = Range;

	const LRU = lrucache;
	const cache = new LRU();

	const parseOptions = parseOptions_1;
	const Comparator = requireComparator();
	const debug = debug_1;
	const SemVer = semver$2;
	const {
	  safeRe: re,
	  t,
	  comparatorTrimReplace,
	  tildeTrimReplace,
	  caretTrimReplace,
	} = reExports;
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = constants$1;

	const isNullSet = c => c.value === '<0.0.0-0';
	const isAny = c => c.value === '';

	// take a set of comparators and determine whether there
	// exists a version which can satisfy it
	const isSatisfiable = (comparators, options) => {
	  let result = true;
	  const remainingComparators = comparators.slice();
	  let testComparator = remainingComparators.pop();

	  while (result && remainingComparators.length) {
	    result = remainingComparators.every((otherComparator) => {
	      return testComparator.intersects(otherComparator, options)
	    });

	    testComparator = remainingComparators.pop();
	  }

	  return result
	};

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	const parseComparator = (comp, options) => {
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	};

	const isX = id => !id || id.toLowerCase() === 'x' || id === '*';

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
	// ~0.0.1 --> >=0.0.1 <0.1.0-0
	const replaceTildes = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceTilde(c, options))
	    .join(' ')
	};

	const replaceTilde = (comp, options) => {
	  const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('tilde', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0-0
	      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = `>=${M}.${m}.${p}-${pr
	      } <${M}.${+m + 1}.0-0`;
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0-0
	      ret = `>=${M}.${m}.${p
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	};

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
	// ^1.2.3 --> >=1.2.3 <2.0.0-0
	// ^1.2.0 --> >=1.2.0 <2.0.0-0
	// ^0.0.1 --> >=0.0.1 <0.0.2-0
	// ^0.1.0 --> >=0.1.0 <0.2.0-0
	const replaceCarets = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceCaret(c, options))
	    .join(' ')
	};

	const replaceCaret = (comp, options) => {
	  debug('caret', comp, options);
	  const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
	  const z = options.includePrerelease ? '-0' : '';
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('caret', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
	      } else {
	        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p}-${pr
	        } <${+M + 1}.0.0-0`;
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p
	        } <${+M + 1}.0.0-0`;
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	};

	const replaceXRanges = (comp, options) => {
	  debug('replaceXRanges', comp, options);
	  return comp
	    .split(/\s+/)
	    .map((c) => replaceXRange(c, options))
	    .join(' ')
	};

	const replaceXRange = (comp, options) => {
	  comp = comp.trim();
	  const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
	  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    const xM = isX(M);
	    const xm = xM || isX(m);
	    const xp = xm || isX(p);
	    const anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    // if we're including prereleases in the match, then we need
	    // to fix this to -0, the lowest possible prerelease value
	    pr = options.includePrerelease ? '-0' : '';

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0-0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      if (gtlt === '<') {
	        pr = '-0';
	      }

	      ret = `${gtlt + M}.${m}.${p}${pr}`;
	    } else if (xm) {
	      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
	    } else if (xp) {
	      ret = `>=${M}.${m}.0${pr
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	};

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	const replaceStars = (comp, options) => {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp
	    .trim()
	    .replace(re[t.STAR], '')
	};

	const replaceGTE0 = (comp, options) => {
	  debug('replaceGTE0', comp, options);
	  return comp
	    .trim()
	    .replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '')
	};

	// This function is passed to string.replace(re[t.HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
	// TODO build?
	const hyphenReplace = incPr => ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr) => {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
	  } else if (isX(fp)) {
	    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
	  } else if (fpr) {
	    from = `>=${from}`;
	  } else {
	    from = `>=${from}${incPr ? '-0' : ''}`;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = `<${+tM + 1}.0.0-0`;
	  } else if (isX(tp)) {
	    to = `<${tM}.${+tm + 1}.0-0`;
	  } else if (tpr) {
	    to = `<=${tM}.${tm}.${tp}-${tpr}`;
	  } else if (incPr) {
	    to = `<${tM}.${tm}.${+tp + 1}-0`;
	  } else {
	    to = `<=${to}`;
	  }

	  return `${from} ${to}`.trim()
	};

	const testSet = (set, version, options) => {
	  for (let i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (let i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === Comparator.ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        const allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	};
	return range;
}

var comparator;
var hasRequiredComparator;

function requireComparator () {
	if (hasRequiredComparator) return comparator;
	hasRequiredComparator = 1;
	const ANY = Symbol('SemVer ANY');
	// hoisted class for cyclic dependency
	class Comparator {
	  static get ANY () {
	    return ANY
	  }

	  constructor (comp, options) {
	    options = parseOptions(options);

	    if (comp instanceof Comparator) {
	      if (comp.loose === !!options.loose) {
	        return comp
	      } else {
	        comp = comp.value;
	      }
	    }

	    comp = comp.trim().split(/\s+/).join(' ');
	    debug('comparator', comp, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    this.parse(comp);

	    if (this.semver === ANY) {
	      this.value = '';
	    } else {
	      this.value = this.operator + this.semver.version;
	    }

	    debug('comp', this);
	  }

	  parse (comp) {
	    const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
	    const m = comp.match(r);

	    if (!m) {
	      throw new TypeError(`Invalid comparator: ${comp}`)
	    }

	    this.operator = m[1] !== undefined ? m[1] : '';
	    if (this.operator === '=') {
	      this.operator = '';
	    }

	    // if it literally is just '>' or '' then allow anything.
	    if (!m[2]) {
	      this.semver = ANY;
	    } else {
	      this.semver = new SemVer(m[2], this.options.loose);
	    }
	  }

	  toString () {
	    return this.value
	  }

	  test (version) {
	    debug('Comparator.test', version, this.options.loose);

	    if (this.semver === ANY || version === ANY) {
	      return true
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    return cmp(version, this.operator, this.semver, this.options)
	  }

	  intersects (comp, options) {
	    if (!(comp instanceof Comparator)) {
	      throw new TypeError('a Comparator is required')
	    }

	    if (this.operator === '') {
	      if (this.value === '') {
	        return true
	      }
	      return new Range(comp.value, options).test(this.value)
	    } else if (comp.operator === '') {
	      if (comp.value === '') {
	        return true
	      }
	      return new Range(this.value, options).test(comp.semver)
	    }

	    options = parseOptions(options);

	    // Special cases where nothing can possibly be lower
	    if (options.includePrerelease &&
	      (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
	      return false
	    }
	    if (!options.includePrerelease &&
	      (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
	      return false
	    }

	    // Same direction increasing (> or >=)
	    if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
	      return true
	    }
	    // Same direction decreasing (< or <=)
	    if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // same SemVer and both sides are inclusive (<= or >=)
	    if (
	      (this.semver.version === comp.semver.version) &&
	      this.operator.includes('=') && comp.operator.includes('=')) {
	      return true
	    }
	    // opposite directions less than
	    if (cmp(this.semver, '<', comp.semver, options) &&
	      this.operator.startsWith('>') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // opposite directions greater than
	    if (cmp(this.semver, '>', comp.semver, options) &&
	      this.operator.startsWith('<') && comp.operator.startsWith('>')) {
	      return true
	    }
	    return false
	  }
	}

	comparator = Comparator;

	const parseOptions = parseOptions_1;
	const { safeRe: re, t } = reExports;
	const cmp = cmp_1;
	const debug = debug_1;
	const SemVer = semver$2;
	const Range = requireRange();
	return comparator;
}

const Range$9 = requireRange();
const satisfies$4 = (version, range, options) => {
  try {
    range = new Range$9(range, options);
  } catch (er) {
    return false
  }
  return range.test(version)
};
var satisfies_1 = satisfies$4;

const Range$8 = requireRange();

// Mostly just for testing and legacy API reasons
const toComparators$1 = (range, options) =>
  new Range$8(range, options).set
    .map(comp => comp.map(c => c.value).join(' ').trim().split(' '));

var toComparators_1 = toComparators$1;

const SemVer$4 = semver$2;
const Range$7 = requireRange();

const maxSatisfying$1 = (versions, range, options) => {
  let max = null;
  let maxSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$7(range, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v;
        maxSV = new SemVer$4(max, options);
      }
    }
  });
  return max
};
var maxSatisfying_1 = maxSatisfying$1;

const SemVer$3 = semver$2;
const Range$6 = requireRange();
const minSatisfying$1 = (versions, range, options) => {
  let min = null;
  let minSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$6(range, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v;
        minSV = new SemVer$3(min, options);
      }
    }
  });
  return min
};
var minSatisfying_1 = minSatisfying$1;

const SemVer$2 = semver$2;
const Range$5 = requireRange();
const gt$2 = gt_1;

const minVersion$1 = (range, loose) => {
  range = new Range$5(range, loose);

  let minver = new SemVer$2('0.0.0');
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer$2('0.0.0-0');
  if (range.test(minver)) {
    return minver
  }

  minver = null;
  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i];

    let setMin = null;
    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new SemVer$2(comparator.semver.version);
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
          /* fallthrough */
        case '':
        case '>=':
          if (!setMin || gt$2(compver, setMin)) {
            setMin = compver;
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    });
    if (setMin && (!minver || gt$2(minver, setMin))) {
      minver = setMin;
    }
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
};
var minVersion_1 = minVersion$1;

const Range$4 = requireRange();
const validRange$1 = (range, options) => {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range$4(range, options).range || '*'
  } catch (er) {
    return null
  }
};
var valid$1 = validRange$1;

const SemVer$1 = semver$2;
const Comparator$2 = requireComparator();
const { ANY: ANY$1 } = Comparator$2;
const Range$3 = requireRange();
const satisfies$3 = satisfies_1;
const gt$1 = gt_1;
const lt$1 = lt_1;
const lte$1 = lte_1;
const gte$1 = gte_1;

const outside$3 = (version, range, hilo, options) => {
  version = new SemVer$1(version, options);
  range = new Range$3(range, options);

  let gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt$1;
      ltefn = lte$1;
      ltfn = lt$1;
      comp = '>';
      ecomp = '>=';
      break
    case '<':
      gtfn = lt$1;
      ltefn = gte$1;
      ltfn = gt$1;
      comp = '<';
      ecomp = '<=';
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisfies the range it is not outside
  if (satisfies$3(version, range, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i];

    let high = null;
    let low = null;

    comparators.forEach((comparator) => {
      if (comparator.semver === ANY$1) {
        comparator = new Comparator$2('>=0.0.0');
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, options)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, options)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
};

var outside_1 = outside$3;

// Determine if version is greater than all the versions possible in the range.
const outside$2 = outside_1;
const gtr$1 = (version, range, options) => outside$2(version, range, '>', options);
var gtr_1 = gtr$1;

const outside$1 = outside_1;
// Determine if version is less than all the versions possible in the range
const ltr$1 = (version, range, options) => outside$1(version, range, '<', options);
var ltr_1 = ltr$1;

const Range$2 = requireRange();
const intersects$1 = (r1, r2, options) => {
  r1 = new Range$2(r1, options);
  r2 = new Range$2(r2, options);
  return r1.intersects(r2, options)
};
var intersects_1 = intersects$1;

// given a set of versions and a range, create a "simplified" range
// that includes the same versions that the original range does
// If the original range is shorter than the simplified one, return that.
const satisfies$2 = satisfies_1;
const compare$2 = compare_1;
var simplify = (versions, range, options) => {
  const set = [];
  let first = null;
  let prev = null;
  const v = versions.sort((a, b) => compare$2(a, b, options));
  for (const version of v) {
    const included = satisfies$2(version, range, options);
    if (included) {
      prev = version;
      if (!first) {
        first = version;
      }
    } else {
      if (prev) {
        set.push([first, prev]);
      }
      prev = null;
      first = null;
    }
  }
  if (first) {
    set.push([first, null]);
  }

  const ranges = [];
  for (const [min, max] of set) {
    if (min === max) {
      ranges.push(min);
    } else if (!max && min === v[0]) {
      ranges.push('*');
    } else if (!max) {
      ranges.push(`>=${min}`);
    } else if (min === v[0]) {
      ranges.push(`<=${max}`);
    } else {
      ranges.push(`${min} - ${max}`);
    }
  }
  const simplified = ranges.join(' || ');
  const original = typeof range.raw === 'string' ? range.raw : String(range);
  return simplified.length < original.length ? simplified : range
};

const Range$1 = requireRange();
const Comparator$1 = requireComparator();
const { ANY } = Comparator$1;
const satisfies$1 = satisfies_1;
const compare$1 = compare_1;

// Complex range `r1 || r2 || ...` is a subset of `R1 || R2 || ...` iff:
// - Every simple range `r1, r2, ...` is a null set, OR
// - Every simple range `r1, r2, ...` which is not a null set is a subset of
//   some `R1, R2, ...`
//
// Simple range `c1 c2 ...` is a subset of simple range `C1 C2 ...` iff:
// - If c is only the ANY comparator
//   - If C is only the ANY comparator, return true
//   - Else if in prerelease mode, return false
//   - else replace c with `[>=0.0.0]`
// - If C is only the ANY comparator
//   - if in prerelease mode, return true
//   - else replace C with `[>=0.0.0]`
// - Let EQ be the set of = comparators in c
// - If EQ is more than one, return true (null set)
// - Let GT be the highest > or >= comparator in c
// - Let LT be the lowest < or <= comparator in c
// - If GT and LT, and GT.semver > LT.semver, return true (null set)
// - If any C is a = range, and GT or LT are set, return false
// - If EQ
//   - If GT, and EQ does not satisfy GT, return true (null set)
//   - If LT, and EQ does not satisfy LT, return true (null set)
//   - If EQ satisfies every C, return true
//   - Else return false
// - If GT
//   - If GT.semver is lower than any > or >= comp in C, return false
//   - If GT is >=, and GT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the GT.semver tuple, return false
// - If LT
//   - If LT.semver is greater than any < or <= comp in C, return false
//   - If LT is <=, and LT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the LT.semver tuple, return false
// - Else return true

const subset$1 = (sub, dom, options = {}) => {
  if (sub === dom) {
    return true
  }

  sub = new Range$1(sub, options);
  dom = new Range$1(dom, options);
  let sawNonNull = false;

  OUTER: for (const simpleSub of sub.set) {
    for (const simpleDom of dom.set) {
      const isSub = simpleSubset(simpleSub, simpleDom, options);
      sawNonNull = sawNonNull || isSub !== null;
      if (isSub) {
        continue OUTER
      }
    }
    // the null set is a subset of everything, but null simple ranges in
    // a complex range should be ignored.  so if we saw a non-null range,
    // then we know this isn't a subset, but if EVERY simple range was null,
    // then it is a subset.
    if (sawNonNull) {
      return false
    }
  }
  return true
};

const minimumVersionWithPreRelease = [new Comparator$1('>=0.0.0-0')];
const minimumVersion = [new Comparator$1('>=0.0.0')];

const simpleSubset = (sub, dom, options) => {
  if (sub === dom) {
    return true
  }

  if (sub.length === 1 && sub[0].semver === ANY) {
    if (dom.length === 1 && dom[0].semver === ANY) {
      return true
    } else if (options.includePrerelease) {
      sub = minimumVersionWithPreRelease;
    } else {
      sub = minimumVersion;
    }
  }

  if (dom.length === 1 && dom[0].semver === ANY) {
    if (options.includePrerelease) {
      return true
    } else {
      dom = minimumVersion;
    }
  }

  const eqSet = new Set();
  let gt, lt;
  for (const c of sub) {
    if (c.operator === '>' || c.operator === '>=') {
      gt = higherGT(gt, c, options);
    } else if (c.operator === '<' || c.operator === '<=') {
      lt = lowerLT(lt, c, options);
    } else {
      eqSet.add(c.semver);
    }
  }

  if (eqSet.size > 1) {
    return null
  }

  let gtltComp;
  if (gt && lt) {
    gtltComp = compare$1(gt.semver, lt.semver, options);
    if (gtltComp > 0) {
      return null
    } else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<=')) {
      return null
    }
  }

  // will iterate one or zero times
  for (const eq of eqSet) {
    if (gt && !satisfies$1(eq, String(gt), options)) {
      return null
    }

    if (lt && !satisfies$1(eq, String(lt), options)) {
      return null
    }

    for (const c of dom) {
      if (!satisfies$1(eq, String(c), options)) {
        return false
      }
    }

    return true
  }

  let higher, lower;
  let hasDomLT, hasDomGT;
  // if the subset has a prerelease, we need a comparator in the superset
  // with the same tuple and a prerelease, or it's not a subset
  let needDomLTPre = lt &&
    !options.includePrerelease &&
    lt.semver.prerelease.length ? lt.semver : false;
  let needDomGTPre = gt &&
    !options.includePrerelease &&
    gt.semver.prerelease.length ? gt.semver : false;
  // exception: <1.2.3-0 is the same as <1.2.3
  if (needDomLTPre && needDomLTPre.prerelease.length === 1 &&
      lt.operator === '<' && needDomLTPre.prerelease[0] === 0) {
    needDomLTPre = false;
  }

  for (const c of dom) {
    hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>=';
    hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<=';
    if (gt) {
      if (needDomGTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomGTPre.major &&
            c.semver.minor === needDomGTPre.minor &&
            c.semver.patch === needDomGTPre.patch) {
          needDomGTPre = false;
        }
      }
      if (c.operator === '>' || c.operator === '>=') {
        higher = higherGT(gt, c, options);
        if (higher === c && higher !== gt) {
          return false
        }
      } else if (gt.operator === '>=' && !satisfies$1(gt.semver, String(c), options)) {
        return false
      }
    }
    if (lt) {
      if (needDomLTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomLTPre.major &&
            c.semver.minor === needDomLTPre.minor &&
            c.semver.patch === needDomLTPre.patch) {
          needDomLTPre = false;
        }
      }
      if (c.operator === '<' || c.operator === '<=') {
        lower = lowerLT(lt, c, options);
        if (lower === c && lower !== lt) {
          return false
        }
      } else if (lt.operator === '<=' && !satisfies$1(lt.semver, String(c), options)) {
        return false
      }
    }
    if (!c.operator && (lt || gt) && gtltComp !== 0) {
      return false
    }
  }

  // if there was a < or >, and nothing in the dom, then must be false
  // UNLESS it was limited by another range in the other direction.
  // Eg, >1.0.0 <1.0.1 is still a subset of <2.0.0
  if (gt && hasDomLT && !lt && gtltComp !== 0) {
    return false
  }

  if (lt && hasDomGT && !gt && gtltComp !== 0) {
    return false
  }

  // we needed a prerelease range in a specific tuple, but didn't get one
  // then this isn't a subset.  eg >=1.2.3-pre is not a subset of >=1.0.0,
  // because it includes prereleases in the 1.2.3 tuple
  if (needDomGTPre || needDomLTPre) {
    return false
  }

  return true
};

// >=1.2.3 is lower than >1.2.3
const higherGT = (a, b, options) => {
  if (!a) {
    return b
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp > 0 ? a
    : comp < 0 ? b
    : b.operator === '>' && a.operator === '>=' ? b
    : a
};

// <=1.2.3 is higher than <1.2.3
const lowerLT = (a, b, options) => {
  if (!a) {
    return b
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp < 0 ? a
    : comp > 0 ? b
    : b.operator === '<' && a.operator === '<=' ? b
    : a
};

var subset_1 = subset$1;

// just pre-load all the stuff that index.js lazily exports
const internalRe = reExports;
const constants = constants$1;
const SemVer = semver$2;
const identifiers = identifiers$1;
const parse = parse_1;
const valid = valid_1;
const clean = clean_1;
const inc = inc_1;
const diff = diff_1;
const major = major_1;
const minor = minor_1;
const patch = patch_1;
const prerelease = prerelease_1;
const compare = compare_1;
const rcompare = rcompare_1;
const compareLoose = compareLoose_1;
const compareBuild = compareBuild_1;
const sort = sort_1;
const rsort = rsort_1;
const gt = gt_1;
const lt = lt_1;
const eq = eq_1;
const neq = neq_1;
const gte = gte_1;
const lte = lte_1;
const cmp = cmp_1;
const coerce = coerce_1;
const Comparator = requireComparator();
const Range = requireRange();
const satisfies = satisfies_1;
const toComparators = toComparators_1;
const maxSatisfying = maxSatisfying_1;
const minSatisfying = minSatisfying_1;
const minVersion = minVersion_1;
const validRange = valid$1;
const outside = outside_1;
const gtr = gtr_1;
const ltr = ltr_1;
const intersects = intersects_1;
const simplifyRange = simplify;
const subset = subset_1;
var semver$1 = {
  parse,
  valid,
  clean,
  inc,
  diff,
  major,
  minor,
  patch,
  prerelease,
  compare,
  rcompare,
  compareLoose,
  compareBuild,
  sort,
  rsort,
  gt,
  lt,
  eq,
  neq,
  gte,
  lte,
  cmp,
  coerce,
  Comparator,
  Range,
  satisfies,
  toComparators,
  maxSatisfying,
  minSatisfying,
  minVersion,
  validRange,
  outside,
  gtr,
  ltr,
  intersects,
  simplifyRange,
  subset,
  SemVer,
  re: internalRe.re,
  src: internalRe.src,
  tokens: internalRe.t,
  SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: constants.RELEASE_TYPES,
  compareIdentifiers: identifiers.compareIdentifiers,
  rcompareIdentifiers: identifiers.rcompareIdentifiers,
};

var DownloadedUpdateHelper$1 = {};

var lodash_isequal = {exports: {}};

/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
lodash_isequal.exports;

(function (module, exports) {
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    asyncTag = '[object AsyncFunction]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    nullTag = '[object Null]',
	    objectTag = '[object Object]',
	    promiseTag = '[object Promise]',
	    proxyTag = '[object Proxy]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]',
	    undefinedTag = '[object Undefined]',
	    weakMapTag = '[object WeakMap]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	/** Detect free variable `exports`. */
	var freeExports = exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;

	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports && freeGlobal.process;

	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    return freeProcess && freeProcess.binding && freeProcess.binding('util');
	  } catch (e) {}
	}());

	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

	/**
	 * A specialized version of `_.filter` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function arrayFilter(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      resIndex = 0,
	      result = [];

	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value, index, array)) {
	      result[resIndex++] = value;
	    }
	  }
	  return result;
	}

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	/**
	 * A specialized version of `_.some` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 */
	function arraySome(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (predicate(array[index], index, array)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);

	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}

	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}

	/**
	 * Checks if a `cache` value for `key` exists.
	 *
	 * @private
	 * @param {Object} cache The cache to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function cacheHas(cache, key) {
	  return cache.has(key);
	}

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}

	/**
	 * Converts `map` to its key-value pairs.
	 *
	 * @private
	 * @param {Object} map The map to convert.
	 * @returns {Array} Returns the key-value pairs.
	 */
	function mapToArray(map) {
	  var index = -1,
	      result = Array(map.size);

	  map.forEach(function(value, key) {
	    result[++index] = [key, value];
	  });
	  return result;
	}

	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}

	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);

	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}

	/** Used for built-in method references. */
	var arrayProto = Array.prototype,
	    funcProto = Function.prototype,
	    objectProto = Object.prototype;

	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/** Built-in value references. */
	var Buffer = moduleExports ? root.Buffer : undefined,
	    Symbol = root.Symbol,
	    Uint8Array = root.Uint8Array,
	    propertyIsEnumerable = objectProto.propertyIsEnumerable,
	    splice = arrayProto.splice,
	    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols,
	    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
	    nativeKeys = overArg(Object.keys, Object);

	/* Built-in method references that are verified to be native. */
	var DataView = getNative(root, 'DataView'),
	    Map = getNative(root, 'Map'),
	    Promise = getNative(root, 'Promise'),
	    Set = getNative(root, 'Set'),
	    WeakMap = getNative(root, 'WeakMap'),
	    nativeCreate = getNative(Object, 'create');

	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView),
	    mapCtorString = toSource(Map),
	    promiseCtorString = toSource(Promise),
	    setCtorString = toSource(Set),
	    weakMapCtorString = toSource(WeakMap);

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
	}

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	  return this;
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map || ListCache),
	    'string': new Hash
	  };
	}

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = getMapData(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values == null ? 0 : values.length;

	  this.__data__ = new MapCache;
	  while (++index < length) {
	    this.add(values[index]);
	  }
	}

	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
	  this.__data__.set(value, HASH_UNDEFINED);
	  return this;
	}

	/**
	 * Checks if `value` is in the array cache.
	 *
	 * @private
	 * @name has
	 * @memberOf SetCache
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `true` if `value` is found, else `false`.
	 */
	function setCacheHas(value) {
	  return this.__data__.has(value);
	}

	// Add methods to `SetCache`.
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;

	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  var data = this.__data__ = new ListCache(entries);
	  this.size = data.size;
	}

	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new ListCache;
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete(key) {
	  var data = this.__data__,
	      result = data['delete'](key);

	  this.size = data.size;
	  return result;
	}

	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet(key) {
	  return this.__data__.get(key);
	}

	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas(key) {
	  return this.__data__.has(key);
	}

	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var data = this.__data__;
	  if (data instanceof ListCache) {
	    var pairs = data.__data__;
	    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
	      pairs.push([key, value]);
	      this.size = ++data.size;
	      return this;
	    }
	    data = this.__data__ = new MapCache(pairs);
	  }
	  data.set(key, value);
	  this.size = data.size;
	  return this;
	}

	// Add methods to `Stack`.
	Stack.prototype.clear = stackClear;
	Stack.prototype['delete'] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;

	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  var isArr = isArray(value),
	      isArg = !isArr && isArguments(value),
	      isBuff = !isArr && !isArg && isBuffer(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? baseTimes(value.length, String) : [],
	      length = result.length;

	  for (var key in value) {
	    if ((hasOwnProperty.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           isIndex(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag && symToStringTag in Object(value))
	    ? getRawTag(value)
	    : objectToString(value);
	}

	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments(value) {
	  return isObjectLike(value) && baseGetTag(value) == argsTag;
	}

	/**
	 * The base implementation of `_.isEqual` which supports partial comparisons
	 * and tracks traversed objects.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Unordered comparison
	 *  2 - Partial comparison
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, bitmask, customizer, stack) {
	  if (value === other) {
	    return true;
	  }
	  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
	}

	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
	  var objIsArr = isArray(object),
	      othIsArr = isArray(other),
	      objTag = objIsArr ? arrayTag : getTag(object),
	      othTag = othIsArr ? arrayTag : getTag(other);

	  objTag = objTag == argsTag ? objectTag : objTag;
	  othTag = othTag == argsTag ? objectTag : othTag;

	  var objIsObj = objTag == objectTag,
	      othIsObj = othTag == objectTag,
	      isSameTag = objTag == othTag;

	  if (isSameTag && isBuffer(object)) {
	    if (!isBuffer(other)) {
	      return false;
	    }
	    objIsArr = true;
	    objIsObj = false;
	  }
	  if (isSameTag && !objIsObj) {
	    stack || (stack = new Stack);
	    return (objIsArr || isTypedArray(object))
	      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
	      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
	  }
	  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
	    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

	    if (objIsWrapped || othIsWrapped) {
	      var objUnwrapped = objIsWrapped ? object.value() : object,
	          othUnwrapped = othIsWrapped ? other.value() : other;

	      stack || (stack = new Stack);
	      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
	    }
	  }
	  if (!isSameTag) {
	    return false;
	  }
	  stack || (stack = new Stack);
	  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
	}

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}

	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}

	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `array` and `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      arrLength = array.length,
	      othLength = other.length;

	  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
	    return false;
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(array);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var index = -1,
	      result = true,
	      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

	  stack.set(array, other);
	  stack.set(other, array);

	  // Ignore non-index properties.
	  while (++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, arrValue, index, other, array, stack)
	        : customizer(arrValue, othValue, index, array, other, stack);
	    }
	    if (compared !== undefined) {
	      if (compared) {
	        continue;
	      }
	      result = false;
	      break;
	    }
	    // Recursively compare arrays (susceptible to call stack limits).
	    if (seen) {
	      if (!arraySome(other, function(othValue, othIndex) {
	            if (!cacheHas(seen, othIndex) &&
	                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
	              return seen.push(othIndex);
	            }
	          })) {
	        result = false;
	        break;
	      }
	    } else if (!(
	          arrValue === othValue ||
	            equalFunc(arrValue, othValue, bitmask, customizer, stack)
	        )) {
	      result = false;
	      break;
	    }
	  }
	  stack['delete'](array);
	  stack['delete'](other);
	  return result;
	}

	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
	  switch (tag) {
	    case dataViewTag:
	      if ((object.byteLength != other.byteLength) ||
	          (object.byteOffset != other.byteOffset)) {
	        return false;
	      }
	      object = object.buffer;
	      other = other.buffer;

	    case arrayBufferTag:
	      if ((object.byteLength != other.byteLength) ||
	          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
	        return false;
	      }
	      return true;

	    case boolTag:
	    case dateTag:
	    case numberTag:
	      // Coerce booleans to `1` or `0` and dates to milliseconds.
	      // Invalid dates are coerced to `NaN`.
	      return eq(+object, +other);

	    case errorTag:
	      return object.name == other.name && object.message == other.message;

	    case regexpTag:
	    case stringTag:
	      // Coerce regexes to strings and treat strings, primitives and objects,
	      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
	      // for more details.
	      return object == (other + '');

	    case mapTag:
	      var convert = mapToArray;

	    case setTag:
	      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
	      convert || (convert = setToArray);

	      if (object.size != other.size && !isPartial) {
	        return false;
	      }
	      // Assume cyclic values are equal.
	      var stacked = stack.get(object);
	      if (stacked) {
	        return stacked == other;
	      }
	      bitmask |= COMPARE_UNORDERED_FLAG;

	      // Recursively compare objects (susceptible to call stack limits).
	      stack.set(object, other);
	      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
	      stack['delete'](object);
	      return result;

	    case symbolTag:
	      if (symbolValueOf) {
	        return symbolValueOf.call(object) == symbolValueOf.call(other);
	      }
	  }
	  return false;
	}

	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      objProps = getAllKeys(object),
	      objLength = objProps.length,
	      othProps = getAllKeys(other),
	      othLength = othProps.length;

	  if (objLength != othLength && !isPartial) {
	    return false;
	  }
	  var index = objLength;
	  while (index--) {
	    var key = objProps[index];
	    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
	      return false;
	    }
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(object);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var result = true;
	  stack.set(object, other);
	  stack.set(other, object);

	  var skipCtor = isPartial;
	  while (++index < objLength) {
	    key = objProps[index];
	    var objValue = object[key],
	        othValue = other[key];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, objValue, key, other, object, stack)
	        : customizer(objValue, othValue, key, object, other, stack);
	    }
	    // Recursively compare objects (susceptible to call stack limits).
	    if (!(compared === undefined
	          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
	          : compared
	        )) {
	      result = false;
	      break;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (result && !skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;

	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      result = false;
	    }
	  }
	  stack['delete'](object);
	  stack['delete'](other);
	  return result;
	}

	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys(object) {
	  return baseGetAllKeys(object, keys, getSymbols);
	}

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag),
	      tag = value[symToStringTag];

	  try {
	    value[symToStringTag] = undefined;
	    var unmasked = true;
	  } catch (e) {}

	  var result = nativeObjectToString.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag] = tag;
	    } else {
	      delete value[symToStringTag];
	    }
	  }
	  return result;
	}

	/**
	 * Creates an array of the own enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
	  if (object == null) {
	    return [];
	  }
	  object = Object(object);
	  return arrayFilter(nativeGetSymbols(object), function(symbol) {
	    return propertyIsEnumerable.call(object, symbol);
	  });
	};

	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = baseGetTag;

	// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
	if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
	    (Map && getTag(new Map) != mapTag) ||
	    (Promise && getTag(Promise.resolve()) != promiseTag) ||
	    (Set && getTag(new Set) != setTag) ||
	    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
	  getTag = function(value) {
	    var result = baseGetTag(value),
	        Ctor = result == objectTag ? value.constructor : undefined,
	        ctorString = Ctor ? toSource(Ctor) : '';

	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag;
	        case mapCtorString: return mapTag;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag;
	        case weakMapCtorString: return weakMapTag;
	      }
	    }
	    return result;
	  };
	}

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return !!length &&
	    (typeof value == 'number' || reIsUint.test(value)) &&
	    (value > -1 && value % 1 == 0 && value < length);
	}

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}

	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

	  return value === proto;
	}

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString.call(value);
	}

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
	  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
	    !propertyIsEnumerable.call(value, 'callee');
	};

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}

	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer = nativeIsBuffer || stubFalse;

	/**
	 * Performs a deep comparison between two values to determine if they are
	 * equivalent.
	 *
	 * **Note:** This method supports comparing arrays, array buffers, booleans,
	 * date objects, error objects, maps, numbers, `Object` objects, regexes,
	 * sets, strings, symbols, and typed arrays. `Object` objects are compared
	 * by their own, not inherited, enumerable properties. Functions and DOM
	 * nodes are compared by strict equality, i.e. `===`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.isEqual(object, other);
	 * // => true
	 *
	 * object === other;
	 * // => false
	 */
	function isEqual(value, other) {
	  return baseIsEqual(value, other);
	}

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}

	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}

	/**
	 * This method returns a new empty array.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {Array} Returns the new empty array.
	 * @example
	 *
	 * var arrays = _.times(2, _.stubArray);
	 *
	 * console.log(arrays);
	 * // => [[], []]
	 *
	 * console.log(arrays[0] === arrays[1]);
	 * // => false
	 */
	function stubArray() {
	  return [];
	}

	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse() {
	  return false;
	}

	module.exports = isEqual; 
} (lodash_isequal, lodash_isequal.exports));

var lodash_isequalExports = lodash_isequal.exports;

Object.defineProperty(DownloadedUpdateHelper$1, "__esModule", { value: true });
DownloadedUpdateHelper$1.DownloadedUpdateHelper = void 0;
DownloadedUpdateHelper$1.createTempUpdateFile = createTempUpdateFile;
const crypto_1 = require$$0$2;
const fs_1$2 = require$$1$2;
// @ts-ignore
const isEqual = lodash_isequalExports;
const fs_extra_1$2 = lib;
const path$4 = require$$1$4;
/** @private **/
class DownloadedUpdateHelper {
    constructor(cacheDir) {
        this.cacheDir = cacheDir;
        this._file = null;
        this._packageFile = null;
        this.versionInfo = null;
        this.fileInfo = null;
        this._downloadedFileInfo = null;
    }
    get downloadedFileInfo() {
        return this._downloadedFileInfo;
    }
    get file() {
        return this._file;
    }
    get packageFile() {
        return this._packageFile;
    }
    get cacheDirForPendingUpdate() {
        return path$4.join(this.cacheDir, "pending");
    }
    async validateDownloadedPath(updateFile, updateInfo, fileInfo, logger) {
        if (this.versionInfo != null && this.file === updateFile && this.fileInfo != null) {
            // update has already been downloaded from this running instance
            // check here only existence, not checksum
            if (isEqual(this.versionInfo, updateInfo) && isEqual(this.fileInfo.info, fileInfo.info) && (await (0, fs_extra_1$2.pathExists)(updateFile))) {
                return updateFile;
            }
            else {
                return null;
            }
        }
        // update has already been downloaded from some previous app launch
        const cachedUpdateFile = await this.getValidCachedUpdateFile(fileInfo, logger);
        if (cachedUpdateFile === null) {
            return null;
        }
        logger.info(`Update has already been downloaded to ${updateFile}).`);
        this._file = cachedUpdateFile;
        return cachedUpdateFile;
    }
    async setDownloadedFile(downloadedFile, packageFile, versionInfo, fileInfo, updateFileName, isSaveCache) {
        this._file = downloadedFile;
        this._packageFile = packageFile;
        this.versionInfo = versionInfo;
        this.fileInfo = fileInfo;
        this._downloadedFileInfo = {
            fileName: updateFileName,
            sha512: fileInfo.info.sha512,
            isAdminRightsRequired: fileInfo.info.isAdminRightsRequired === true,
        };
        if (isSaveCache) {
            await (0, fs_extra_1$2.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
        }
    }
    async clear() {
        this._file = null;
        this._packageFile = null;
        this.versionInfo = null;
        this.fileInfo = null;
        await this.cleanCacheDirForPendingUpdate();
    }
    async cleanCacheDirForPendingUpdate() {
        try {
            // remove stale data
            await (0, fs_extra_1$2.emptyDir)(this.cacheDirForPendingUpdate);
        }
        catch (ignore) {
            // ignore
        }
    }
    /**
     * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
     * @param fileInfo
     * @param logger
     */
    async getValidCachedUpdateFile(fileInfo, logger) {
        var _a;
        const updateInfoFilePath = this.getUpdateInfoFile();
        const doesUpdateInfoFileExist = await (0, fs_extra_1$2.pathExists)(updateInfoFilePath);
        if (!doesUpdateInfoFileExist) {
            return null;
        }
        let cachedInfo;
        try {
            cachedInfo = await (0, fs_extra_1$2.readJson)(updateInfoFilePath);
        }
        catch (error) {
            let message = `No cached update info available`;
            if (error.code !== "ENOENT") {
                await this.cleanCacheDirForPendingUpdate();
                message += ` (error on read: ${error.message})`;
            }
            logger.info(message);
            return null;
        }
        const isCachedInfoFileNameValid = (_a = (cachedInfo === null || cachedInfo === void 0 ? void 0 : cachedInfo.fileName) !== null) !== null && _a !== void 0 ? _a : false;
        if (!isCachedInfoFileNameValid) {
            logger.warn(`Cached update info is corrupted: no fileName, directory for cached update will be cleaned`);
            await this.cleanCacheDirForPendingUpdate();
            return null;
        }
        if (fileInfo.info.sha512 !== cachedInfo.sha512) {
            logger.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${cachedInfo.sha512}, expected: ${fileInfo.info.sha512}. Directory for cached update will be cleaned`);
            await this.cleanCacheDirForPendingUpdate();
            return null;
        }
        const updateFile = path$4.join(this.cacheDirForPendingUpdate, cachedInfo.fileName);
        if (!(await (0, fs_extra_1$2.pathExists)(updateFile))) {
            logger.info("Cached update file doesn't exist");
            return null;
        }
        const sha512 = await hashFile(updateFile);
        if (fileInfo.info.sha512 !== sha512) {
            logger.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${sha512}, expected: ${fileInfo.info.sha512}`);
            await this.cleanCacheDirForPendingUpdate();
            return null;
        }
        this._downloadedFileInfo = cachedInfo;
        return updateFile;
    }
    getUpdateInfoFile() {
        return path$4.join(this.cacheDirForPendingUpdate, "update-info.json");
    }
}
DownloadedUpdateHelper$1.DownloadedUpdateHelper = DownloadedUpdateHelper;
function hashFile(file, algorithm = "sha512", encoding = "base64", options) {
    return new Promise((resolve, reject) => {
        const hash = (0, crypto_1.createHash)(algorithm);
        hash.on("error", reject).setEncoding(encoding);
        (0, fs_1$2.createReadStream)(file, { ...options, highWaterMark: 1024 * 1024 /* better to use more memory but hash faster */ })
            .on("error", reject)
            .on("end", () => {
            hash.end();
            resolve(hash.read());
        })
            .pipe(hash, { end: false });
    });
}
async function createTempUpdateFile(name, cacheDir, log) {
    // https://github.com/electron-userland/electron-builder/pull/2474#issuecomment-366481912
    let nameCounter = 0;
    let result = path$4.join(cacheDir, name);
    for (let i = 0; i < 3; i++) {
        try {
            await (0, fs_extra_1$2.unlink)(result);
            return result;
        }
        catch (e) {
            if (e.code === "ENOENT") {
                return result;
            }
            log.warn(`Error on remove temp update file: ${e}`);
            result = path$4.join(cacheDir, `${nameCounter++}-${name}`);
        }
    }
    return result;
}

var ElectronAppAdapter$1 = {};

var AppAdapter = {};

Object.defineProperty(AppAdapter, "__esModule", { value: true });
AppAdapter.getAppCacheDir = getAppCacheDir;
const path$3 = require$$1$4;
const os_1 = require$$2;
function getAppCacheDir() {
    const homedir = (0, os_1.homedir)();
    // https://github.com/electron/electron/issues/1404#issuecomment-194391247
    let result;
    if (process.platform === "win32") {
        result = process.env["LOCALAPPDATA"] || path$3.join(homedir, "AppData", "Local");
    }
    else if (process.platform === "darwin") {
        result = path$3.join(homedir, "Library", "Caches");
    }
    else {
        result = process.env["XDG_CACHE_HOME"] || path$3.join(homedir, ".cache");
    }
    return result;
}

Object.defineProperty(ElectronAppAdapter$1, "__esModule", { value: true });
ElectronAppAdapter$1.ElectronAppAdapter = void 0;
const path$2 = require$$1$4;
const AppAdapter_1 = AppAdapter;
class ElectronAppAdapter {
    constructor(app = require$$1$5.app) {
        this.app = app;
    }
    whenReady() {
        return this.app.whenReady();
    }
    get version() {
        return this.app.getVersion();
    }
    get name() {
        return this.app.getName();
    }
    get isPackaged() {
        return this.app.isPackaged === true;
    }
    get appUpdateConfigPath() {
        return this.isPackaged ? path$2.join(process.resourcesPath, "app-update.yml") : path$2.join(this.app.getAppPath(), "dev-app-update.yml");
    }
    get userDataPath() {
        return this.app.getPath("userData");
    }
    get baseCachePath() {
        return (0, AppAdapter_1.getAppCacheDir)();
    }
    quit() {
        this.app.quit();
    }
    relaunch() {
        this.app.relaunch();
    }
    onQuit(handler) {
        this.app.once("quit", (_, exitCode) => handler(exitCode));
    }
}
ElectronAppAdapter$1.ElectronAppAdapter = ElectronAppAdapter;

var electronHttpExecutor = {};

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ElectronHttpExecutor = exports.NET_SESSION_NAME = void 0;
	exports.getNetSession = getNetSession;
	const builder_util_runtime_1 = out;
	exports.NET_SESSION_NAME = "electron-updater";
	function getNetSession() {
	    return require$$1$5.session.fromPartition(exports.NET_SESSION_NAME, {
	        cache: false,
	    });
	}
	class ElectronHttpExecutor extends builder_util_runtime_1.HttpExecutor {
	    constructor(proxyLoginCallback) {
	        super();
	        this.proxyLoginCallback = proxyLoginCallback;
	        this.cachedSession = null;
	    }
	    async download(url, destination, options) {
	        return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
	            const requestOptions = {
	                headers: options.headers || undefined,
	                redirect: "manual",
	            };
	            (0, builder_util_runtime_1.configureRequestUrl)(url, requestOptions);
	            (0, builder_util_runtime_1.configureRequestOptions)(requestOptions);
	            this.doDownload(requestOptions, {
	                destination,
	                options,
	                onCancel,
	                callback: error => {
	                    if (error == null) {
	                        resolve(destination);
	                    }
	                    else {
	                        reject(error);
	                    }
	                },
	                responseHandler: null,
	            }, 0);
	        });
	    }
	    createRequest(options, callback) {
	        // fix (node 7+) for making electron updater work when using AWS private buckets, check if headers contain Host property
	        if (options.headers && options.headers.Host) {
	            // set host value from headers.Host
	            options.host = options.headers.Host;
	            // remove header property 'Host', if not removed causes net::ERR_INVALID_ARGUMENT exception
	            delete options.headers.Host;
	        }
	        // differential downloader can call this method very often, so, better to cache session
	        if (this.cachedSession == null) {
	            this.cachedSession = getNetSession();
	        }
	        const request = require$$1$5.net.request({
	            ...options,
	            session: this.cachedSession,
	        });
	        request.on("response", callback);
	        if (this.proxyLoginCallback != null) {
	            request.on("login", this.proxyLoginCallback);
	        }
	        return request;
	    }
	    addRedirectHandlers(request, options, reject, redirectCount, handler) {
	        request.on("redirect", (statusCode, method, redirectUrl) => {
	            // no way to modify request options, abort old and make a new one
	            // https://github.com/electron/electron/issues/11505
	            request.abort();
	            if (redirectCount > this.maxRedirects) {
	                reject(this.createMaxRedirectError());
	            }
	            else {
	                handler(builder_util_runtime_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options));
	            }
	        });
	    }
	}
	exports.ElectronHttpExecutor = ElectronHttpExecutor;
	
} (electronHttpExecutor));

var GenericProvider$1 = {};

var util = {};

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar.source);

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol$1 = root.Symbol;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escapeRegExp('[lodash](https://lodash.com/)');
 * // => '\[lodash\]\(https://lodash\.com/\)'
 */
function escapeRegExp$1(string) {
  string = toString(string);
  return (string && reHasRegExpChar.test(string))
    ? string.replace(reRegExpChar, '\\$&')
    : string;
}

var lodash_escaperegexp = escapeRegExp$1;

Object.defineProperty(util, "__esModule", { value: true });
util.newBaseUrl = newBaseUrl;
util.newUrlFromBase = newUrlFromBase;
util.getChannelFilename = getChannelFilename;
util.blockmapFiles = blockmapFiles;
// if baseUrl path doesn't ends with /, this path will be not prepended to passed pathname for new URL(input, base)
const url_1$3 = require$$4;
// @ts-ignore
const escapeRegExp = lodash_escaperegexp;
/** @internal */
function newBaseUrl(url) {
    const result = new url_1$3.URL(url);
    if (!result.pathname.endsWith("/")) {
        result.pathname += "/";
    }
    return result;
}
// addRandomQueryToAvoidCaching is false by default because in most cases URL already contains version number,
// so, it makes sense only for Generic Provider for channel files
function newUrlFromBase(pathname, baseUrl, addRandomQueryToAvoidCaching = false) {
    const result = new url_1$3.URL(pathname, baseUrl);
    // search is not propagated (search is an empty string if not specified)
    const search = baseUrl.search;
    if (search != null && search.length !== 0) {
        result.search = search;
    }
    else if (addRandomQueryToAvoidCaching) {
        result.search = `noCache=${Date.now().toString(32)}`;
    }
    return result;
}
function getChannelFilename(channel) {
    return `${channel}.yml`;
}
function blockmapFiles(baseUrl, oldVersion, newVersion) {
    const newBlockMapUrl = newUrlFromBase(`${baseUrl.pathname}.blockmap`, baseUrl);
    const oldBlockMapUrl = newUrlFromBase(`${baseUrl.pathname.replace(new RegExp(escapeRegExp(newVersion), "g"), oldVersion)}.blockmap`, baseUrl);
    return [oldBlockMapUrl, newBlockMapUrl];
}

var Provider$1 = {};

Object.defineProperty(Provider$1, "__esModule", { value: true });
Provider$1.Provider = void 0;
Provider$1.findFile = findFile;
Provider$1.parseUpdateInfo = parseUpdateInfo;
Provider$1.getFileList = getFileList;
Provider$1.resolveFiles = resolveFiles;
const builder_util_runtime_1$a = out;
const js_yaml_1$1 = jsYaml;
const util_1$5 = util;
class Provider {
    constructor(runtimeOptions) {
        this.runtimeOptions = runtimeOptions;
        this.requestHeaders = null;
        this.executor = runtimeOptions.executor;
    }
    get isUseMultipleRangeRequest() {
        return this.runtimeOptions.isUseMultipleRangeRequest !== false;
    }
    getChannelFilePrefix() {
        if (this.runtimeOptions.platform === "linux") {
            const arch = process.env["TEST_UPDATER_ARCH"] || process.arch;
            const archSuffix = arch === "x64" ? "" : `-${arch}`;
            return "-linux" + archSuffix;
        }
        else {
            return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
        }
    }
    // due to historical reasons for windows we use channel name without platform specifier
    getDefaultChannelName() {
        return this.getCustomChannelName("latest");
    }
    getCustomChannelName(channel) {
        return `${channel}${this.getChannelFilePrefix()}`;
    }
    get fileExtraDownloadHeaders() {
        return null;
    }
    setRequestHeaders(value) {
        this.requestHeaders = value;
    }
    /**
     * Method to perform API request only to resolve update info, but not to download update.
     */
    httpRequest(url, headers, cancellationToken) {
        return this.executor.request(this.createRequestOptions(url, headers), cancellationToken);
    }
    createRequestOptions(url, headers) {
        const result = {};
        if (this.requestHeaders == null) {
            if (headers != null) {
                result.headers = headers;
            }
        }
        else {
            result.headers = headers == null ? this.requestHeaders : { ...this.requestHeaders, ...headers };
        }
        (0, builder_util_runtime_1$a.configureRequestUrl)(url, result);
        return result;
    }
}
Provider$1.Provider = Provider;
function findFile(files, extension, not) {
    if (files.length === 0) {
        throw (0, builder_util_runtime_1$a.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
    }
    const result = files.find(it => it.url.pathname.toLowerCase().endsWith(`.${extension}`));
    if (result != null) {
        return result;
    }
    else if (not == null) {
        return files[0];
    }
    else {
        return files.find(fileInfo => !not.some(ext => fileInfo.url.pathname.toLowerCase().endsWith(`.${ext}`)));
    }
}
function parseUpdateInfo(rawData, channelFile, channelFileUrl) {
    if (rawData == null) {
        throw (0, builder_util_runtime_1$a.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    let result;
    try {
        result = (0, js_yaml_1$1.load)(rawData);
    }
    catch (e) {
        throw (0, builder_util_runtime_1$a.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}, rawData: ${rawData}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    return result;
}
function getFileList(updateInfo) {
    const files = updateInfo.files;
    if (files != null && files.length > 0) {
        return files;
    }
    // noinspection JSDeprecatedSymbols
    if (updateInfo.path != null) {
        // noinspection JSDeprecatedSymbols
        return [
            {
                url: updateInfo.path,
                sha2: updateInfo.sha2,
                sha512: updateInfo.sha512,
            },
        ];
    }
    else {
        throw (0, builder_util_runtime_1$a.newError)(`No files provided: ${(0, builder_util_runtime_1$a.safeStringifyJson)(updateInfo)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
    }
}
function resolveFiles(updateInfo, baseUrl, pathTransformer = (p) => p) {
    const files = getFileList(updateInfo);
    const result = files.map(fileInfo => {
        if (fileInfo.sha2 == null && fileInfo.sha512 == null) {
            throw (0, builder_util_runtime_1$a.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, builder_util_runtime_1$a.safeStringifyJson)(fileInfo)}`, "ERR_UPDATER_NO_CHECKSUM");
        }
        return {
            url: (0, util_1$5.newUrlFromBase)(pathTransformer(fileInfo.url), baseUrl),
            info: fileInfo,
        };
    });
    const packages = updateInfo.packages;
    const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
    if (packageInfo != null) {
        result[0].packageInfo = {
            ...packageInfo,
            path: (0, util_1$5.newUrlFromBase)(pathTransformer(packageInfo.path), baseUrl).href,
        };
    }
    return result;
}

Object.defineProperty(GenericProvider$1, "__esModule", { value: true });
GenericProvider$1.GenericProvider = void 0;
const builder_util_runtime_1$9 = out;
const util_1$4 = util;
const Provider_1$4 = Provider$1;
class GenericProvider extends Provider_1$4.Provider {
    constructor(configuration, updater, runtimeOptions) {
        super(runtimeOptions);
        this.configuration = configuration;
        this.updater = updater;
        this.baseUrl = (0, util_1$4.newBaseUrl)(this.configuration.url);
    }
    get channel() {
        const result = this.updater.channel || this.configuration.channel;
        return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
    }
    async getLatestVersion() {
        const channelFile = (0, util_1$4.getChannelFilename)(this.channel);
        const channelUrl = (0, util_1$4.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
        for (let attemptNumber = 0;; attemptNumber++) {
            try {
                return (0, Provider_1$4.parseUpdateInfo)(await this.httpRequest(channelUrl), channelFile, channelUrl);
            }
            catch (e) {
                if (e instanceof builder_util_runtime_1$9.HttpError && e.statusCode === 404) {
                    throw (0, builder_util_runtime_1$9.newError)(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
                }
                else if (e.code === "ECONNREFUSED") {
                    if (attemptNumber < 3) {
                        await new Promise((resolve, reject) => {
                            try {
                                setTimeout(resolve, 1000 * attemptNumber);
                            }
                            catch (e) {
                                reject(e);
                            }
                        });
                        continue;
                    }
                }
                throw e;
            }
        }
    }
    resolveFiles(updateInfo) {
        return (0, Provider_1$4.resolveFiles)(updateInfo, this.baseUrl);
    }
}
GenericProvider$1.GenericProvider = GenericProvider;

var providerFactory = {};

var BitbucketProvider$1 = {};

Object.defineProperty(BitbucketProvider$1, "__esModule", { value: true });
BitbucketProvider$1.BitbucketProvider = void 0;
const builder_util_runtime_1$8 = out;
const util_1$3 = util;
const Provider_1$3 = Provider$1;
class BitbucketProvider extends Provider_1$3.Provider {
    constructor(configuration, updater, runtimeOptions) {
        super({
            ...runtimeOptions,
            isUseMultipleRangeRequest: false,
        });
        this.configuration = configuration;
        this.updater = updater;
        const { owner, slug } = configuration;
        this.baseUrl = (0, util_1$3.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${owner}/${slug}/downloads`);
    }
    get channel() {
        return this.updater.channel || this.configuration.channel || "latest";
    }
    async getLatestVersion() {
        const cancellationToken = new builder_util_runtime_1$8.CancellationToken();
        const channelFile = (0, util_1$3.getChannelFilename)(this.getCustomChannelName(this.channel));
        const channelUrl = (0, util_1$3.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
        try {
            const updateInfo = await this.httpRequest(channelUrl, undefined, cancellationToken);
            return (0, Provider_1$3.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
        }
        catch (e) {
            throw (0, builder_util_runtime_1$8.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
    }
    resolveFiles(updateInfo) {
        return (0, Provider_1$3.resolveFiles)(updateInfo, this.baseUrl);
    }
    toString() {
        const { owner, slug } = this.configuration;
        return `Bitbucket (owner: ${owner}, slug: ${slug}, channel: ${this.channel})`;
    }
}
BitbucketProvider$1.BitbucketProvider = BitbucketProvider;

var GitHubProvider$1 = {};

Object.defineProperty(GitHubProvider$1, "__esModule", { value: true });
GitHubProvider$1.GitHubProvider = GitHubProvider$1.BaseGitHubProvider = void 0;
GitHubProvider$1.computeReleaseNotes = computeReleaseNotes;
const builder_util_runtime_1$7 = out;
const semver = semver$1;
const url_1$2 = require$$4;
const util_1$2 = util;
const Provider_1$2 = Provider$1;
const hrefRegExp = /\/tag\/([^/]+)$/;
class BaseGitHubProvider extends Provider_1$2.Provider {
    constructor(options, defaultHost, runtimeOptions) {
        super({
            ...runtimeOptions,
            /* because GitHib uses S3 */
            isUseMultipleRangeRequest: false,
        });
        this.options = options;
        this.baseUrl = (0, util_1$2.newBaseUrl)((0, builder_util_runtime_1$7.githubUrl)(options, defaultHost));
        const apiHost = defaultHost === "github.com" ? "api.github.com" : defaultHost;
        this.baseApiUrl = (0, util_1$2.newBaseUrl)((0, builder_util_runtime_1$7.githubUrl)(options, apiHost));
    }
    computeGithubBasePath(result) {
        // https://github.com/electron-userland/electron-builder/issues/1903#issuecomment-320881211
        const host = this.options.host;
        return host && !["github.com", "api.github.com"].includes(host) ? `/api/v3${result}` : result;
    }
}
GitHubProvider$1.BaseGitHubProvider = BaseGitHubProvider;
class GitHubProvider extends BaseGitHubProvider {
    constructor(options, updater, runtimeOptions) {
        super(options, "github.com", runtimeOptions);
        this.options = options;
        this.updater = updater;
    }
    get channel() {
        const result = this.updater.channel || this.options.channel;
        return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
    }
    async getLatestVersion() {
        var _a, _b, _c, _d, _e;
        const cancellationToken = new builder_util_runtime_1$7.CancellationToken();
        const feedXml = (await this.httpRequest((0, util_1$2.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
            accept: "application/xml, application/atom+xml, text/xml, */*",
        }, cancellationToken));
        const feed = (0, builder_util_runtime_1$7.parseXml)(feedXml);
        // noinspection TypeScriptValidateJSTypes
        let latestRelease = feed.element("entry", false, `No published versions on GitHub`);
        let tag = null;
        try {
            if (this.updater.allowPrerelease) {
                const currentChannel = ((_a = this.updater) === null || _a === void 0 ? void 0 : _a.channel) || ((_b = semver.prerelease(this.updater.currentVersion)) === null || _b === void 0 ? void 0 : _b[0]) || null;
                if (currentChannel === null) {
                    // noinspection TypeScriptValidateJSTypes
                    tag = hrefRegExp.exec(latestRelease.element("link").attribute("href"))[1];
                }
                else {
                    for (const element of feed.getElements("entry")) {
                        // noinspection TypeScriptValidateJSTypes
                        const hrefElement = hrefRegExp.exec(element.element("link").attribute("href"));
                        // If this is null then something is wrong and skip this release
                        if (hrefElement === null)
                            continue;
                        // This Release's Tag
                        const hrefTag = hrefElement[1];
                        //Get Channel from this release's tag
                        const hrefChannel = ((_c = semver.prerelease(hrefTag)) === null || _c === void 0 ? void 0 : _c[0]) || null;
                        const shouldFetchVersion = !currentChannel || ["alpha", "beta"].includes(currentChannel);
                        const isCustomChannel = hrefChannel !== null && !["alpha", "beta"].includes(String(hrefChannel));
                        // Allow moving from alpha to beta but not down
                        const channelMismatch = currentChannel === "beta" && hrefChannel === "alpha";
                        if (shouldFetchVersion && !isCustomChannel && !channelMismatch) {
                            tag = hrefTag;
                            break;
                        }
                        const isNextPreRelease = hrefChannel && hrefChannel === currentChannel;
                        if (isNextPreRelease) {
                            tag = hrefTag;
                            break;
                        }
                    }
                }
            }
            else {
                tag = await this.getLatestTagName(cancellationToken);
                for (const element of feed.getElements("entry")) {
                    // noinspection TypeScriptValidateJSTypes
                    if (hrefRegExp.exec(element.element("link").attribute("href"))[1] === tag) {
                        latestRelease = element;
                        break;
                    }
                }
            }
        }
        catch (e) {
            throw (0, builder_util_runtime_1$7.newError)(`Cannot parse releases feed: ${e.stack || e.message},\nXML:\n${feedXml}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
        }
        if (tag == null) {
            throw (0, builder_util_runtime_1$7.newError)(`No published versions on GitHub`, "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
        }
        let rawData;
        let channelFile = "";
        let channelFileUrl = "";
        const fetchData = async (channelName) => {
            channelFile = (0, util_1$2.getChannelFilename)(channelName);
            channelFileUrl = (0, util_1$2.newUrlFromBase)(this.getBaseDownloadPath(String(tag), channelFile), this.baseUrl);
            const requestOptions = this.createRequestOptions(channelFileUrl);
            try {
                return (await this.executor.request(requestOptions, cancellationToken));
            }
            catch (e) {
                if (e instanceof builder_util_runtime_1$7.HttpError && e.statusCode === 404) {
                    throw (0, builder_util_runtime_1$7.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
                }
                throw e;
            }
        };
        try {
            let channel = this.channel;
            if (this.updater.allowPrerelease && ((_d = semver.prerelease(tag)) === null || _d === void 0 ? void 0 : _d[0])) {
                channel = this.getCustomChannelName(String((_e = semver.prerelease(tag)) === null || _e === void 0 ? void 0 : _e[0]));
            }
            rawData = await fetchData(channel);
        }
        catch (e) {
            if (this.updater.allowPrerelease) {
                // Allow fallback to `latest.yml`
                rawData = await fetchData(this.getDefaultChannelName());
            }
            else {
                throw e;
            }
        }
        const result = (0, Provider_1$2.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
        if (result.releaseName == null) {
            result.releaseName = latestRelease.elementValueOrEmpty("title");
        }
        if (result.releaseNotes == null) {
            result.releaseNotes = computeReleaseNotes(this.updater.currentVersion, this.updater.fullChangelog, feed, latestRelease);
        }
        return {
            tag: tag,
            ...result,
        };
    }
    async getLatestTagName(cancellationToken) {
        const options = this.options;
        // do not use API for GitHub to avoid limit, only for custom host or GitHub Enterprise
        const url = options.host == null || options.host === "github.com"
            ? (0, util_1$2.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl)
            : new url_1$2.URL(`${this.computeGithubBasePath(`/repos/${options.owner}/${options.repo}/releases`)}/latest`, this.baseApiUrl);
        try {
            const rawData = await this.httpRequest(url, { Accept: "application/json" }, cancellationToken);
            if (rawData == null) {
                return null;
            }
            const releaseInfo = JSON.parse(rawData);
            return releaseInfo.tag_name;
        }
        catch (e) {
            throw (0, builder_util_runtime_1$7.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
    }
    get basePath() {
        return `/${this.options.owner}/${this.options.repo}/releases`;
    }
    resolveFiles(updateInfo) {
        // still replace space to - due to backward compatibility
        return (0, Provider_1$2.resolveFiles)(updateInfo, this.baseUrl, p => this.getBaseDownloadPath(updateInfo.tag, p.replace(/ /g, "-")));
    }
    getBaseDownloadPath(tag, fileName) {
        return `${this.basePath}/download/${tag}/${fileName}`;
    }
}
GitHubProvider$1.GitHubProvider = GitHubProvider;
function getNoteValue(parent) {
    const result = parent.elementValueOrEmpty("content");
    // GitHub reports empty notes as <content>No content.</content>
    return result === "No content." ? "" : result;
}
function computeReleaseNotes(currentVersion, isFullChangelog, feed, latestRelease) {
    if (!isFullChangelog) {
        return getNoteValue(latestRelease);
    }
    const releaseNotes = [];
    for (const release of feed.getElements("entry")) {
        // noinspection TypeScriptValidateJSTypes
        const versionRelease = /\/tag\/v?([^/]+)$/.exec(release.element("link").attribute("href"))[1];
        if (semver.lt(currentVersion, versionRelease)) {
            releaseNotes.push({
                version: versionRelease,
                note: getNoteValue(release),
            });
        }
    }
    return releaseNotes.sort((a, b) => semver.rcompare(a.version, b.version));
}

var KeygenProvider$1 = {};

Object.defineProperty(KeygenProvider$1, "__esModule", { value: true });
KeygenProvider$1.KeygenProvider = void 0;
const builder_util_runtime_1$6 = out;
const util_1$1 = util;
const Provider_1$1 = Provider$1;
class KeygenProvider extends Provider_1$1.Provider {
    constructor(configuration, updater, runtimeOptions) {
        super({
            ...runtimeOptions,
            isUseMultipleRangeRequest: false,
        });
        this.configuration = configuration;
        this.updater = updater;
        this.baseUrl = (0, util_1$1.newBaseUrl)(`https://api.keygen.sh/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
    }
    get channel() {
        return this.updater.channel || this.configuration.channel || "stable";
    }
    async getLatestVersion() {
        const cancellationToken = new builder_util_runtime_1$6.CancellationToken();
        const channelFile = (0, util_1$1.getChannelFilename)(this.getCustomChannelName(this.channel));
        const channelUrl = (0, util_1$1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
        try {
            const updateInfo = await this.httpRequest(channelUrl, {
                Accept: "application/vnd.api+json",
                "Keygen-Version": "1.1",
            }, cancellationToken);
            return (0, Provider_1$1.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
        }
        catch (e) {
            throw (0, builder_util_runtime_1$6.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
    }
    resolveFiles(updateInfo) {
        return (0, Provider_1$1.resolveFiles)(updateInfo, this.baseUrl);
    }
    toString() {
        const { account, product, platform } = this.configuration;
        return `Keygen (account: ${account}, product: ${product}, platform: ${platform}, channel: ${this.channel})`;
    }
}
KeygenProvider$1.KeygenProvider = KeygenProvider;

var PrivateGitHubProvider$1 = {};

Object.defineProperty(PrivateGitHubProvider$1, "__esModule", { value: true });
PrivateGitHubProvider$1.PrivateGitHubProvider = void 0;
const builder_util_runtime_1$5 = out;
const js_yaml_1 = jsYaml;
const path$1 = require$$1$4;
const url_1$1 = require$$4;
const util_1 = util;
const GitHubProvider_1$1 = GitHubProvider$1;
const Provider_1 = Provider$1;
class PrivateGitHubProvider extends GitHubProvider_1$1.BaseGitHubProvider {
    constructor(options, updater, token, runtimeOptions) {
        super(options, "api.github.com", runtimeOptions);
        this.updater = updater;
        this.token = token;
    }
    createRequestOptions(url, headers) {
        const result = super.createRequestOptions(url, headers);
        result.redirect = "manual";
        return result;
    }
    async getLatestVersion() {
        const cancellationToken = new builder_util_runtime_1$5.CancellationToken();
        const channelFile = (0, util_1.getChannelFilename)(this.getDefaultChannelName());
        const releaseInfo = await this.getLatestVersionInfo(cancellationToken);
        const asset = releaseInfo.assets.find(it => it.name === channelFile);
        if (asset == null) {
            // html_url must be always, but just to be sure
            throw (0, builder_util_runtime_1$5.newError)(`Cannot find ${channelFile} in the release ${releaseInfo.html_url || releaseInfo.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        }
        const url = new url_1$1.URL(asset.url);
        let result;
        try {
            result = (0, js_yaml_1.load)((await this.httpRequest(url, this.configureHeaders("application/octet-stream"), cancellationToken)));
        }
        catch (e) {
            if (e instanceof builder_util_runtime_1$5.HttpError && e.statusCode === 404) {
                throw (0, builder_util_runtime_1$5.newError)(`Cannot find ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
            }
            throw e;
        }
        result.assets = releaseInfo.assets;
        return result;
    }
    get fileExtraDownloadHeaders() {
        return this.configureHeaders("application/octet-stream");
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    configureHeaders(accept) {
        return {
            accept,
            authorization: `token ${this.token}`,
        };
    }
    async getLatestVersionInfo(cancellationToken) {
        const allowPrerelease = this.updater.allowPrerelease;
        let basePath = this.basePath;
        if (!allowPrerelease) {
            basePath = `${basePath}/latest`;
        }
        const url = (0, util_1.newUrlFromBase)(basePath, this.baseUrl);
        try {
            const version = JSON.parse((await this.httpRequest(url, this.configureHeaders("application/vnd.github.v3+json"), cancellationToken)));
            if (allowPrerelease) {
                return version.find(it => it.prerelease) || version[0];
            }
            else {
                return version;
            }
        }
        catch (e) {
            throw (0, builder_util_runtime_1$5.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
        }
    }
    get basePath() {
        return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    resolveFiles(updateInfo) {
        return (0, Provider_1.getFileList)(updateInfo).map(it => {
            const name = path$1.posix.basename(it.url).replace(/ /g, "-");
            const asset = updateInfo.assets.find(it => it != null && it.name === name);
            if (asset == null) {
                throw (0, builder_util_runtime_1$5.newError)(`Cannot find asset "${name}" in: ${JSON.stringify(updateInfo.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
            }
            return {
                url: new url_1$1.URL(asset.url),
                info: it,
            };
        });
    }
}
PrivateGitHubProvider$1.PrivateGitHubProvider = PrivateGitHubProvider;

Object.defineProperty(providerFactory, "__esModule", { value: true });
providerFactory.isUrlProbablySupportMultiRangeRequests = isUrlProbablySupportMultiRangeRequests;
providerFactory.createClient = createClient;
const builder_util_runtime_1$4 = out;
const BitbucketProvider_1 = BitbucketProvider$1;
const GenericProvider_1 = GenericProvider$1;
const GitHubProvider_1 = GitHubProvider$1;
const KeygenProvider_1 = KeygenProvider$1;
const PrivateGitHubProvider_1 = PrivateGitHubProvider$1;
function isUrlProbablySupportMultiRangeRequests(url) {
    return !url.includes("s3.amazonaws.com");
}
function createClient(data, updater, runtimeOptions) {
    // noinspection SuspiciousTypeOfGuard
    if (typeof data === "string") {
        throw (0, builder_util_runtime_1$4.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
    }
    const provider = data.provider;
    switch (provider) {
        case "github": {
            const githubOptions = data;
            const token = (githubOptions.private ? process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"] : null) || githubOptions.token;
            if (token == null) {
                return new GitHubProvider_1.GitHubProvider(githubOptions, updater, runtimeOptions);
            }
            else {
                return new PrivateGitHubProvider_1.PrivateGitHubProvider(githubOptions, updater, token, runtimeOptions);
            }
        }
        case "bitbucket":
            return new BitbucketProvider_1.BitbucketProvider(data, updater, runtimeOptions);
        case "keygen":
            return new KeygenProvider_1.KeygenProvider(data, updater, runtimeOptions);
        case "s3":
        case "spaces":
            return new GenericProvider_1.GenericProvider({
                provider: "generic",
                url: (0, builder_util_runtime_1$4.getS3LikeProviderBaseUrl)(data),
                channel: data.channel || null,
            }, updater, {
                ...runtimeOptions,
                // https://github.com/minio/minio/issues/5285#issuecomment-350428955
                isUseMultipleRangeRequest: false,
            });
        case "generic": {
            const options = data;
            return new GenericProvider_1.GenericProvider(options, updater, {
                ...runtimeOptions,
                isUseMultipleRangeRequest: options.useMultipleRangeRequest !== false && isUrlProbablySupportMultiRangeRequests(options.url),
            });
        }
        case "custom": {
            const options = data;
            const constructor = options.updateProvider;
            if (!constructor) {
                throw (0, builder_util_runtime_1$4.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
            }
            return new constructor(options, updater, runtimeOptions);
        }
        default:
            throw (0, builder_util_runtime_1$4.newError)(`Unsupported provider: ${provider}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
    }
}

var GenericDifferentialDownloader$1 = {};

var DifferentialDownloader$1 = {};

var DataSplitter$1 = {};

var downloadPlanBuilder = {};

Object.defineProperty(downloadPlanBuilder, "__esModule", { value: true });
downloadPlanBuilder.OperationKind = void 0;
downloadPlanBuilder.computeOperations = computeOperations;
var OperationKind$1;
(function (OperationKind) {
    OperationKind[OperationKind["COPY"] = 0] = "COPY";
    OperationKind[OperationKind["DOWNLOAD"] = 1] = "DOWNLOAD";
})(OperationKind$1 || (downloadPlanBuilder.OperationKind = OperationKind$1 = {}));
function computeOperations(oldBlockMap, newBlockMap, logger) {
    const nameToOldBlocks = buildBlockFileMap(oldBlockMap.files);
    const nameToNewBlocks = buildBlockFileMap(newBlockMap.files);
    let lastOperation = null;
    // for now only one file is supported in block map
    const blockMapFile = newBlockMap.files[0];
    const operations = [];
    const name = blockMapFile.name;
    const oldEntry = nameToOldBlocks.get(name);
    if (oldEntry == null) {
        // new file (unrealistic case for now, because in any case both blockmap contain the only file named as "file")
        throw new Error(`no file ${name} in old blockmap`);
    }
    const newFile = nameToNewBlocks.get(name);
    let changedBlockCount = 0;
    const { checksumToOffset: checksumToOldOffset, checksumToOldSize } = buildChecksumMap(nameToOldBlocks.get(name), oldEntry.offset, logger);
    let newOffset = blockMapFile.offset;
    for (let i = 0; i < newFile.checksums.length; newOffset += newFile.sizes[i], i++) {
        const blockSize = newFile.sizes[i];
        const checksum = newFile.checksums[i];
        let oldOffset = checksumToOldOffset.get(checksum);
        if (oldOffset != null && checksumToOldSize.get(checksum) !== blockSize) {
            logger.warn(`Checksum ("${checksum}") matches, but size differs (old: ${checksumToOldSize.get(checksum)}, new: ${blockSize})`);
            oldOffset = undefined;
        }
        if (oldOffset === undefined) {
            // download data from new file
            changedBlockCount++;
            if (lastOperation != null && lastOperation.kind === OperationKind$1.DOWNLOAD && lastOperation.end === newOffset) {
                lastOperation.end += blockSize;
            }
            else {
                lastOperation = {
                    kind: OperationKind$1.DOWNLOAD,
                    start: newOffset,
                    end: newOffset + blockSize,
                    // oldBlocks: null,
                };
                validateAndAdd(lastOperation, operations, checksum, i);
            }
        }
        else {
            // reuse data from old file
            if (lastOperation != null && lastOperation.kind === OperationKind$1.COPY && lastOperation.end === oldOffset) {
                lastOperation.end += blockSize;
                // lastOperation.oldBlocks!!.push(checksum)
            }
            else {
                lastOperation = {
                    kind: OperationKind$1.COPY,
                    start: oldOffset,
                    end: oldOffset + blockSize,
                    // oldBlocks: [checksum]
                };
                validateAndAdd(lastOperation, operations, checksum, i);
            }
        }
    }
    if (changedBlockCount > 0) {
        logger.info(`File${blockMapFile.name === "file" ? "" : " " + blockMapFile.name} has ${changedBlockCount} changed blocks`);
    }
    return operations;
}
const isValidateOperationRange = process.env["DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES"] === "true";
function validateAndAdd(operation, operations, checksum, index) {
    if (isValidateOperationRange && operations.length !== 0) {
        const lastOperation = operations[operations.length - 1];
        if (lastOperation.kind === operation.kind && operation.start < lastOperation.end && operation.start > lastOperation.start) {
            const min = [lastOperation.start, lastOperation.end, operation.start, operation.end].reduce((p, v) => (p < v ? p : v));
            throw new Error(`operation (block index: ${index}, checksum: ${checksum}, kind: ${OperationKind$1[operation.kind]}) overlaps previous operation (checksum: ${checksum}):\n` +
                `abs: ${lastOperation.start} until ${lastOperation.end} and ${operation.start} until ${operation.end}\n` +
                `rel: ${lastOperation.start - min} until ${lastOperation.end - min} and ${operation.start - min} until ${operation.end - min}`);
        }
    }
    operations.push(operation);
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildChecksumMap(file, fileOffset, logger) {
    const checksumToOffset = new Map();
    const checksumToSize = new Map();
    let offset = fileOffset;
    for (let i = 0; i < file.checksums.length; i++) {
        const checksum = file.checksums[i];
        const size = file.sizes[i];
        const existing = checksumToSize.get(checksum);
        if (existing === undefined) {
            checksumToOffset.set(checksum, offset);
            checksumToSize.set(checksum, size);
        }
        else if (logger.debug != null) {
            const sizeExplanation = existing === size ? "(same size)" : `(size: ${existing}, this size: ${size})`;
            logger.debug(`${checksum} duplicated in blockmap ${sizeExplanation}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
        }
        offset += size;
    }
    return { checksumToOffset, checksumToOldSize: checksumToSize };
}
function buildBlockFileMap(list) {
    const result = new Map();
    for (const item of list) {
        result.set(item.name, item);
    }
    return result;
}

Object.defineProperty(DataSplitter$1, "__esModule", { value: true });
DataSplitter$1.DataSplitter = void 0;
DataSplitter$1.copyData = copyData;
const builder_util_runtime_1$3 = out;
const fs_1$1 = require$$1$2;
const stream_1$1 = require$$0$1;
const downloadPlanBuilder_1$2 = downloadPlanBuilder;
const DOUBLE_CRLF = Buffer.from("\r\n\r\n");
var ReadState;
(function (ReadState) {
    ReadState[ReadState["INIT"] = 0] = "INIT";
    ReadState[ReadState["HEADER"] = 1] = "HEADER";
    ReadState[ReadState["BODY"] = 2] = "BODY";
})(ReadState || (ReadState = {}));
function copyData(task, out, oldFileFd, reject, resolve) {
    const readStream = (0, fs_1$1.createReadStream)("", {
        fd: oldFileFd,
        autoClose: false,
        start: task.start,
        // end is inclusive
        end: task.end - 1,
    });
    readStream.on("error", reject);
    readStream.once("end", resolve);
    readStream.pipe(out, {
        end: false,
    });
}
class DataSplitter extends stream_1$1.Writable {
    constructor(out, options, partIndexToTaskIndex, boundary, partIndexToLength, finishHandler) {
        super();
        this.out = out;
        this.options = options;
        this.partIndexToTaskIndex = partIndexToTaskIndex;
        this.partIndexToLength = partIndexToLength;
        this.finishHandler = finishHandler;
        this.partIndex = -1;
        this.headerListBuffer = null;
        this.readState = ReadState.INIT;
        this.ignoreByteCount = 0;
        this.remainingPartDataCount = 0;
        this.actualPartLength = 0;
        this.boundaryLength = boundary.length + 4; /* size of \r\n-- */
        // first chunk doesn't start with \r\n
        this.ignoreByteCount = this.boundaryLength - 2;
    }
    get isFinished() {
        return this.partIndex === this.partIndexToLength.length;
    }
    // noinspection JSUnusedGlobalSymbols
    _write(data, encoding, callback) {
        if (this.isFinished) {
            console.error(`Trailing ignored data: ${data.length} bytes`);
            return;
        }
        this.handleData(data).then(callback).catch(callback);
    }
    async handleData(chunk) {
        let start = 0;
        if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0) {
            throw (0, builder_util_runtime_1$3.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
        }
        if (this.ignoreByteCount > 0) {
            const toIgnore = Math.min(this.ignoreByteCount, chunk.length);
            this.ignoreByteCount -= toIgnore;
            start = toIgnore;
        }
        else if (this.remainingPartDataCount > 0) {
            const toRead = Math.min(this.remainingPartDataCount, chunk.length);
            this.remainingPartDataCount -= toRead;
            await this.processPartData(chunk, 0, toRead);
            start = toRead;
        }
        if (start === chunk.length) {
            return;
        }
        if (this.readState === ReadState.HEADER) {
            const headerListEnd = this.searchHeaderListEnd(chunk, start);
            if (headerListEnd === -1) {
                return;
            }
            start = headerListEnd;
            this.readState = ReadState.BODY;
            // header list is ignored, we don't need it
            this.headerListBuffer = null;
        }
        while (true) {
            if (this.readState === ReadState.BODY) {
                this.readState = ReadState.INIT;
            }
            else {
                this.partIndex++;
                let taskIndex = this.partIndexToTaskIndex.get(this.partIndex);
                if (taskIndex == null) {
                    if (this.isFinished) {
                        taskIndex = this.options.end;
                    }
                    else {
                        throw (0, builder_util_runtime_1$3.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
                    }
                }
                const prevTaskIndex = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1; /* prev part is download, next maybe copy */
                if (prevTaskIndex < taskIndex) {
                    await this.copyExistingData(prevTaskIndex, taskIndex);
                }
                else if (prevTaskIndex > taskIndex) {
                    throw (0, builder_util_runtime_1$3.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
                }
                if (this.isFinished) {
                    this.onPartEnd();
                    this.finishHandler();
                    return;
                }
                start = this.searchHeaderListEnd(chunk, start);
                if (start === -1) {
                    this.readState = ReadState.HEADER;
                    return;
                }
            }
            const partLength = this.partIndexToLength[this.partIndex];
            const end = start + partLength;
            const effectiveEnd = Math.min(end, chunk.length);
            await this.processPartStarted(chunk, start, effectiveEnd);
            this.remainingPartDataCount = partLength - (effectiveEnd - start);
            if (this.remainingPartDataCount > 0) {
                return;
            }
            start = end + this.boundaryLength;
            if (start >= chunk.length) {
                this.ignoreByteCount = this.boundaryLength - (chunk.length - end);
                return;
            }
        }
    }
    copyExistingData(index, end) {
        return new Promise((resolve, reject) => {
            const w = () => {
                if (index === end) {
                    resolve();
                    return;
                }
                const task = this.options.tasks[index];
                if (task.kind !== downloadPlanBuilder_1$2.OperationKind.COPY) {
                    reject(new Error("Task kind must be COPY"));
                    return;
                }
                copyData(task, this.out, this.options.oldFileFd, reject, () => {
                    index++;
                    w();
                });
            };
            w();
        });
    }
    searchHeaderListEnd(chunk, readOffset) {
        const headerListEnd = chunk.indexOf(DOUBLE_CRLF, readOffset);
        if (headerListEnd !== -1) {
            return headerListEnd + DOUBLE_CRLF.length;
        }
        // not all headers data were received, save to buffer
        const partialChunk = readOffset === 0 ? chunk : chunk.slice(readOffset);
        if (this.headerListBuffer == null) {
            this.headerListBuffer = partialChunk;
        }
        else {
            this.headerListBuffer = Buffer.concat([this.headerListBuffer, partialChunk]);
        }
        return -1;
    }
    onPartEnd() {
        const expectedLength = this.partIndexToLength[this.partIndex - 1];
        if (this.actualPartLength !== expectedLength) {
            throw (0, builder_util_runtime_1$3.newError)(`Expected length: ${expectedLength} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
        }
        this.actualPartLength = 0;
    }
    processPartStarted(data, start, end) {
        if (this.partIndex !== 0) {
            this.onPartEnd();
        }
        return this.processPartData(data, start, end);
    }
    processPartData(data, start, end) {
        this.actualPartLength += end - start;
        const out = this.out;
        if (out.write(start === 0 && data.length === end ? data : data.slice(start, end))) {
            return Promise.resolve();
        }
        else {
            return new Promise((resolve, reject) => {
                out.on("error", reject);
                out.once("drain", () => {
                    out.removeListener("error", reject);
                    resolve();
                });
            });
        }
    }
}
DataSplitter$1.DataSplitter = DataSplitter;

var multipleRangeDownloader = {};

Object.defineProperty(multipleRangeDownloader, "__esModule", { value: true });
multipleRangeDownloader.executeTasksUsingMultipleRangeRequests = executeTasksUsingMultipleRangeRequests;
multipleRangeDownloader.checkIsRangesSupported = checkIsRangesSupported;
const builder_util_runtime_1$2 = out;
const DataSplitter_1$1 = DataSplitter$1;
const downloadPlanBuilder_1$1 = downloadPlanBuilder;
function executeTasksUsingMultipleRangeRequests(differentialDownloader, tasks, out, oldFileFd, reject) {
    const w = (taskOffset) => {
        if (taskOffset >= tasks.length) {
            if (differentialDownloader.fileMetadataBuffer != null) {
                out.write(differentialDownloader.fileMetadataBuffer);
            }
            out.end();
            return;
        }
        const nextOffset = taskOffset + 1000;
        doExecuteTasks(differentialDownloader, {
            tasks,
            start: taskOffset,
            end: Math.min(tasks.length, nextOffset),
            oldFileFd,
        }, out, () => w(nextOffset), reject);
    };
    return w;
}
function doExecuteTasks(differentialDownloader, options, out, resolve, reject) {
    let ranges = "bytes=";
    let partCount = 0;
    const partIndexToTaskIndex = new Map();
    const partIndexToLength = [];
    for (let i = options.start; i < options.end; i++) {
        const task = options.tasks[i];
        if (task.kind === downloadPlanBuilder_1$1.OperationKind.DOWNLOAD) {
            ranges += `${task.start}-${task.end - 1}, `;
            partIndexToTaskIndex.set(partCount, i);
            partCount++;
            partIndexToLength.push(task.end - task.start);
        }
    }
    if (partCount <= 1) {
        // the only remote range - copy
        const w = (index) => {
            if (index >= options.end) {
                resolve();
                return;
            }
            const task = options.tasks[index++];
            if (task.kind === downloadPlanBuilder_1$1.OperationKind.COPY) {
                (0, DataSplitter_1$1.copyData)(task, out, options.oldFileFd, reject, () => w(index));
            }
            else {
                const requestOptions = differentialDownloader.createRequestOptions();
                requestOptions.headers.Range = `bytes=${task.start}-${task.end - 1}`;
                const request = differentialDownloader.httpExecutor.createRequest(requestOptions, response => {
                    if (!checkIsRangesSupported(response, reject)) {
                        return;
                    }
                    response.pipe(out, {
                        end: false,
                    });
                    response.once("end", () => w(index));
                });
                differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
                request.end();
            }
        };
        w(options.start);
        return;
    }
    const requestOptions = differentialDownloader.createRequestOptions();
    requestOptions.headers.Range = ranges.substring(0, ranges.length - 2);
    const request = differentialDownloader.httpExecutor.createRequest(requestOptions, response => {
        if (!checkIsRangesSupported(response, reject)) {
            return;
        }
        const contentType = (0, builder_util_runtime_1$2.safeGetHeader)(response, "content-type");
        const m = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(contentType);
        if (m == null) {
            reject(new Error(`Content-Type "multipart/byteranges" is expected, but got "${contentType}"`));
            return;
        }
        const dicer = new DataSplitter_1$1.DataSplitter(out, options, partIndexToTaskIndex, m[1] || m[2], partIndexToLength, resolve);
        dicer.on("error", reject);
        response.pipe(dicer);
        response.on("end", () => {
            setTimeout(() => {
                request.abort();
                reject(new Error("Response ends without calling any handlers"));
            }, 10000);
        });
    });
    differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
    request.end();
}
function checkIsRangesSupported(response, reject) {
    // Electron net handles redirects automatically, our NodeJS test server doesn't use redirects - so, we don't check 3xx codes.
    if (response.statusCode >= 400) {
        reject((0, builder_util_runtime_1$2.createHttpError)(response));
        return false;
    }
    if (response.statusCode !== 206) {
        const acceptRanges = (0, builder_util_runtime_1$2.safeGetHeader)(response, "accept-ranges");
        if (acceptRanges == null || acceptRanges === "none") {
            reject(new Error(`Server doesn't support Accept-Ranges (response code ${response.statusCode})`));
            return false;
        }
    }
    return true;
}

var ProgressDifferentialDownloadCallbackTransform$1 = {};

Object.defineProperty(ProgressDifferentialDownloadCallbackTransform$1, "__esModule", { value: true });
ProgressDifferentialDownloadCallbackTransform$1.ProgressDifferentialDownloadCallbackTransform = void 0;
const stream_1 = require$$0$1;
var OperationKind;
(function (OperationKind) {
    OperationKind[OperationKind["COPY"] = 0] = "COPY";
    OperationKind[OperationKind["DOWNLOAD"] = 1] = "DOWNLOAD";
})(OperationKind || (OperationKind = {}));
class ProgressDifferentialDownloadCallbackTransform extends stream_1.Transform {
    constructor(progressDifferentialDownloadInfo, cancellationToken, onProgress) {
        super();
        this.progressDifferentialDownloadInfo = progressDifferentialDownloadInfo;
        this.cancellationToken = cancellationToken;
        this.onProgress = onProgress;
        this.start = Date.now();
        this.transferred = 0;
        this.delta = 0;
        this.expectedBytes = 0;
        this.index = 0;
        this.operationType = OperationKind.COPY;
        this.nextUpdate = this.start + 1000;
    }
    _transform(chunk, encoding, callback) {
        if (this.cancellationToken.cancelled) {
            callback(new Error("cancelled"), null);
            return;
        }
        // Don't send progress update when copying from disk
        if (this.operationType == OperationKind.COPY) {
            callback(null, chunk);
            return;
        }
        this.transferred += chunk.length;
        this.delta += chunk.length;
        const now = Date.now();
        if (now >= this.nextUpdate &&
            this.transferred !== this.expectedBytes /* will be emitted by endRangeDownload() */ &&
            this.transferred !== this.progressDifferentialDownloadInfo.grandTotal /* will be emitted on _flush */) {
            this.nextUpdate = now + 1000;
            this.onProgress({
                total: this.progressDifferentialDownloadInfo.grandTotal,
                delta: this.delta,
                transferred: this.transferred,
                percent: (this.transferred / this.progressDifferentialDownloadInfo.grandTotal) * 100,
                bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1000)),
            });
            this.delta = 0;
        }
        callback(null, chunk);
    }
    beginFileCopy() {
        this.operationType = OperationKind.COPY;
    }
    beginRangeDownload() {
        this.operationType = OperationKind.DOWNLOAD;
        this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
    }
    endRangeDownload() {
        // _flush() will doour final 100%
        if (this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
            this.onProgress({
                total: this.progressDifferentialDownloadInfo.grandTotal,
                delta: this.delta,
                transferred: this.transferred,
                percent: (this.transferred / this.progressDifferentialDownloadInfo.grandTotal) * 100,
                bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1000)),
            });
        }
    }
    // Called when we are 100% done with the connection/download
    _flush(callback) {
        if (this.cancellationToken.cancelled) {
            callback(new Error("cancelled"));
            return;
        }
        this.onProgress({
            total: this.progressDifferentialDownloadInfo.grandTotal,
            delta: this.delta,
            transferred: this.transferred,
            percent: 100,
            bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1000)),
        });
        this.delta = 0;
        this.transferred = 0;
        callback(null);
    }
}
ProgressDifferentialDownloadCallbackTransform$1.ProgressDifferentialDownloadCallbackTransform = ProgressDifferentialDownloadCallbackTransform;

Object.defineProperty(DifferentialDownloader$1, "__esModule", { value: true });
DifferentialDownloader$1.DifferentialDownloader = void 0;
const builder_util_runtime_1$1 = out;
const fs_extra_1$1 = lib;
const fs_1 = require$$1$2;
const DataSplitter_1 = DataSplitter$1;
const url_1 = require$$4;
const downloadPlanBuilder_1 = downloadPlanBuilder;
const multipleRangeDownloader_1 = multipleRangeDownloader;
const ProgressDifferentialDownloadCallbackTransform_1 = ProgressDifferentialDownloadCallbackTransform$1;
class DifferentialDownloader {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(blockAwareFileInfo, httpExecutor, options) {
        this.blockAwareFileInfo = blockAwareFileInfo;
        this.httpExecutor = httpExecutor;
        this.options = options;
        this.fileMetadataBuffer = null;
        this.logger = options.logger;
    }
    createRequestOptions() {
        const result = {
            headers: {
                ...this.options.requestHeaders,
                accept: "*/*",
            },
        };
        (0, builder_util_runtime_1$1.configureRequestUrl)(this.options.newUrl, result);
        // user-agent, cache-control and other common options
        (0, builder_util_runtime_1$1.configureRequestOptions)(result);
        return result;
    }
    doDownload(oldBlockMap, newBlockMap) {
        // we don't check other metadata like compressionMethod - generic check that it is make sense to differentially update is suitable for it
        if (oldBlockMap.version !== newBlockMap.version) {
            throw new Error(`version is different (${oldBlockMap.version} - ${newBlockMap.version}), full download is required`);
        }
        const logger = this.logger;
        const operations = (0, downloadPlanBuilder_1.computeOperations)(oldBlockMap, newBlockMap, logger);
        if (logger.debug != null) {
            logger.debug(JSON.stringify(operations, null, 2));
        }
        let downloadSize = 0;
        let copySize = 0;
        for (const operation of operations) {
            const length = operation.end - operation.start;
            if (operation.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
                downloadSize += length;
            }
            else {
                copySize += length;
            }
        }
        const newSize = this.blockAwareFileInfo.size;
        if (downloadSize + copySize + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== newSize) {
            throw new Error(`Internal error, size mismatch: downloadSize: ${downloadSize}, copySize: ${copySize}, newSize: ${newSize}`);
        }
        logger.info(`Full: ${formatBytes(newSize)}, To download: ${formatBytes(downloadSize)} (${Math.round(downloadSize / (newSize / 100))}%)`);
        return this.downloadFile(operations);
    }
    downloadFile(tasks) {
        const fdList = [];
        const closeFiles = () => {
            return Promise.all(fdList.map(openedFile => {
                return (0, fs_extra_1$1.close)(openedFile.descriptor).catch((e) => {
                    this.logger.error(`cannot close file "${openedFile.path}": ${e}`);
                });
            }));
        };
        return this.doDownloadFile(tasks, fdList)
            .then(closeFiles)
            .catch((e) => {
            // then must be after catch here (since then always throws error)
            return closeFiles()
                .catch(closeFilesError => {
                // closeFiles never throw error, but just to be sure
                try {
                    this.logger.error(`cannot close files: ${closeFilesError}`);
                }
                catch (errorOnLog) {
                    try {
                        console.error(errorOnLog);
                    }
                    catch (ignored) {
                        // ok, give up and ignore error
                    }
                }
                throw e;
            })
                .then(() => {
                throw e;
            });
        });
    }
    async doDownloadFile(tasks, fdList) {
        const oldFileFd = await (0, fs_extra_1$1.open)(this.options.oldFile, "r");
        fdList.push({ descriptor: oldFileFd, path: this.options.oldFile });
        const newFileFd = await (0, fs_extra_1$1.open)(this.options.newFile, "w");
        fdList.push({ descriptor: newFileFd, path: this.options.newFile });
        const fileOut = (0, fs_1.createWriteStream)(this.options.newFile, { fd: newFileFd });
        await new Promise((resolve, reject) => {
            const streams = [];
            // Create our download info transformer if we have one
            let downloadInfoTransform = undefined;
            if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
                // TODO: Does not support multiple ranges (someone feel free to PR this!)
                const expectedByteCounts = [];
                let grandTotalBytes = 0;
                for (const task of tasks) {
                    if (task.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
                        expectedByteCounts.push(task.end - task.start);
                        grandTotalBytes += task.end - task.start;
                    }
                }
                const progressDifferentialDownloadInfo = {
                    expectedByteCounts: expectedByteCounts,
                    grandTotal: grandTotalBytes,
                };
                downloadInfoTransform = new ProgressDifferentialDownloadCallbackTransform_1.ProgressDifferentialDownloadCallbackTransform(progressDifferentialDownloadInfo, this.options.cancellationToken, this.options.onProgress);
                streams.push(downloadInfoTransform);
            }
            const digestTransform = new builder_util_runtime_1$1.DigestTransform(this.blockAwareFileInfo.sha512);
            // to simply debug, do manual validation to allow file to be fully written
            digestTransform.isValidateOnEnd = false;
            streams.push(digestTransform);
            // noinspection JSArrowFunctionCanBeReplacedWithShorthand
            fileOut.on("finish", () => {
                fileOut.close(() => {
                    // remove from fd list because closed successfully
                    fdList.splice(1, 1);
                    try {
                        digestTransform.validate();
                    }
                    catch (e) {
                        reject(e);
                        return;
                    }
                    resolve(undefined);
                });
            });
            streams.push(fileOut);
            let lastStream = null;
            for (const stream of streams) {
                stream.on("error", reject);
                if (lastStream == null) {
                    lastStream = stream;
                }
                else {
                    lastStream = lastStream.pipe(stream);
                }
            }
            const firstStream = streams[0];
            let w;
            if (this.options.isUseMultipleRangeRequest) {
                w = (0, multipleRangeDownloader_1.executeTasksUsingMultipleRangeRequests)(this, tasks, firstStream, oldFileFd, reject);
                w(0);
                return;
            }
            let downloadOperationCount = 0;
            let actualUrl = null;
            this.logger.info(`Differential download: ${this.options.newUrl}`);
            const requestOptions = this.createRequestOptions();
            requestOptions.redirect = "manual";
            w = (index) => {
                var _a, _b;
                if (index >= tasks.length) {
                    if (this.fileMetadataBuffer != null) {
                        firstStream.write(this.fileMetadataBuffer);
                    }
                    firstStream.end();
                    return;
                }
                const operation = tasks[index++];
                if (operation.kind === downloadPlanBuilder_1.OperationKind.COPY) {
                    // We are copying, let's not send status updates to the UI
                    if (downloadInfoTransform) {
                        downloadInfoTransform.beginFileCopy();
                    }
                    (0, DataSplitter_1.copyData)(operation, firstStream, oldFileFd, reject, () => w(index));
                    return;
                }
                const range = `bytes=${operation.start}-${operation.end - 1}`;
                requestOptions.headers.range = range;
                (_b = (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.call(_a, `download range: ${range}`);
                // We are starting to download
                if (downloadInfoTransform) {
                    downloadInfoTransform.beginRangeDownload();
                }
                const request = this.httpExecutor.createRequest(requestOptions, response => {
                    response.on("error", reject);
                    response.on("aborted", () => {
                        reject(new Error("response has been aborted by the server"));
                    });
                    // Electron net handles redirects automatically, our NodeJS test server doesn't use redirects - so, we don't check 3xx codes.
                    if (response.statusCode >= 400) {
                        reject((0, builder_util_runtime_1$1.createHttpError)(response));
                    }
                    response.pipe(firstStream, {
                        end: false,
                    });
                    response.once("end", () => {
                        // Pass on that we are downloading a segment
                        if (downloadInfoTransform) {
                            downloadInfoTransform.endRangeDownload();
                        }
                        if (++downloadOperationCount === 100) {
                            downloadOperationCount = 0;
                            setTimeout(() => w(index), 1000);
                        }
                        else {
                            w(index);
                        }
                    });
                });
                request.on("redirect", (statusCode, method, redirectUrl) => {
                    this.logger.info(`Redirect to ${removeQuery(redirectUrl)}`);
                    actualUrl = redirectUrl;
                    (0, builder_util_runtime_1$1.configureRequestUrl)(new url_1.URL(actualUrl), requestOptions);
                    request.followRedirect();
                });
                this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
                request.end();
            };
            w(0);
        });
    }
    async readRemoteBytes(start, endInclusive) {
        const buffer = Buffer.allocUnsafe(endInclusive + 1 - start);
        const requestOptions = this.createRequestOptions();
        requestOptions.headers.range = `bytes=${start}-${endInclusive}`;
        let position = 0;
        await this.request(requestOptions, chunk => {
            chunk.copy(buffer, position);
            position += chunk.length;
        });
        if (position !== buffer.length) {
            throw new Error(`Received data length ${position} is not equal to expected ${buffer.length}`);
        }
        return buffer;
    }
    request(requestOptions, dataHandler) {
        return new Promise((resolve, reject) => {
            const request = this.httpExecutor.createRequest(requestOptions, response => {
                if (!(0, multipleRangeDownloader_1.checkIsRangesSupported)(response, reject)) {
                    return;
                }
                response.on("error", reject);
                response.on("aborted", () => {
                    reject(new Error("response has been aborted by the server"));
                });
                response.on("data", dataHandler);
                response.on("end", () => resolve());
            });
            this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
            request.end();
        });
    }
}
DifferentialDownloader$1.DifferentialDownloader = DifferentialDownloader;
function formatBytes(value, symbol = " KB") {
    return new Intl.NumberFormat("en").format((value / 1024).toFixed(2)) + symbol;
}
// safety
function removeQuery(url) {
    const index = url.indexOf("?");
    return index < 0 ? url : url.substring(0, index);
}

Object.defineProperty(GenericDifferentialDownloader$1, "__esModule", { value: true });
GenericDifferentialDownloader$1.GenericDifferentialDownloader = void 0;
const DifferentialDownloader_1$1 = DifferentialDownloader$1;
class GenericDifferentialDownloader extends DifferentialDownloader_1$1.DifferentialDownloader {
    download(oldBlockMap, newBlockMap) {
        return this.doDownload(oldBlockMap, newBlockMap);
    }
}
GenericDifferentialDownloader$1.GenericDifferentialDownloader = GenericDifferentialDownloader;

var hasRequiredAppUpdater;

function requireAppUpdater () {
	if (hasRequiredAppUpdater) return AppUpdater;
	hasRequiredAppUpdater = 1;
	Object.defineProperty(AppUpdater, "__esModule", { value: true });
	AppUpdater.NoOpLogger = AppUpdater.AppUpdater = void 0;
	const builder_util_runtime_1 = out;
	const crypto_1 = require$$0$2;
	const os_1 = require$$2;
	const events_1 = require$$0;
	const fs_extra_1 = lib;
	const js_yaml_1 = jsYaml;
	const lazy_val_1 = main$1;
	const path = require$$1$4;
	const semver_1 = semver$1;
	const DownloadedUpdateHelper_1 = DownloadedUpdateHelper$1;
	const ElectronAppAdapter_1 = ElectronAppAdapter$1;
	const electronHttpExecutor_1 = electronHttpExecutor;
	const GenericProvider_1 = GenericProvider$1;
	const main_1 = requireMain();
	const providerFactory_1 = providerFactory;
	const zlib_1 = require$$15;
	const util_1 = util;
	const GenericDifferentialDownloader_1 = GenericDifferentialDownloader$1;
	let AppUpdater$1 = class AppUpdater extends events_1.EventEmitter {
	    /**
	     * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
	     */
	    get channel() {
	        return this._channel;
	    }
	    /**
	     * Set the update channel. Overrides `channel` in the update configuration.
	     *
	     * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
	     */
	    set channel(value) {
	        if (this._channel != null) {
	            // noinspection SuspiciousTypeOfGuard
	            if (typeof value !== "string") {
	                throw (0, builder_util_runtime_1.newError)(`Channel must be a string, but got: ${value}`, "ERR_UPDATER_INVALID_CHANNEL");
	            }
	            else if (value.length === 0) {
	                throw (0, builder_util_runtime_1.newError)(`Channel must be not an empty string`, "ERR_UPDATER_INVALID_CHANNEL");
	            }
	        }
	        this._channel = value;
	        this.allowDowngrade = true;
	    }
	    /**
	     *  Shortcut for explicitly adding auth tokens to request headers
	     */
	    addAuthHeader(token) {
	        this.requestHeaders = Object.assign({}, this.requestHeaders, {
	            authorization: token,
	        });
	    }
	    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
	    get netSession() {
	        return (0, electronHttpExecutor_1.getNetSession)();
	    }
	    /**
	     * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
	     * Set it to `null` if you would like to disable a logging feature.
	     */
	    get logger() {
	        return this._logger;
	    }
	    set logger(value) {
	        this._logger = value == null ? new NoOpLogger() : value;
	    }
	    // noinspection JSUnusedGlobalSymbols
	    /**
	     * test only
	     * @private
	     */
	    set updateConfigPath(value) {
	        this.clientPromise = null;
	        this._appUpdateConfigPath = value;
	        this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
	    }
	    constructor(options, app) {
	        super();
	        /**
	         * Whether to automatically download an update when it is found.
	         */
	        this.autoDownload = true;
	        /**
	         * Whether to automatically install a downloaded update on app quit (if `quitAndInstall` was not called before).
	         */
	        this.autoInstallOnAppQuit = true;
	        /**
	         * *windows-only* Whether to run the app after finish install when run the installer NOT in silent mode.
	         * @default true
	         */
	        this.autoRunAppAfterInstall = true;
	        /**
	         * *GitHub provider only.* Whether to allow update to pre-release versions. Defaults to `true` if application version contains prerelease components (e.g. `0.12.1-alpha.1`, here `alpha` is a prerelease component), otherwise `false`.
	         *
	         * If `true`, downgrade will be allowed (`allowDowngrade` will be set to `true`).
	         */
	        this.allowPrerelease = false;
	        /**
	         * *GitHub provider only.* Get all release notes (from current version to latest), not just the latest.
	         * @default false
	         */
	        this.fullChangelog = false;
	        /**
	         * Whether to allow version downgrade (when a user from the beta channel wants to go back to the stable channel).
	         *
	         * Taken in account only if channel differs (pre-release version component in terms of semantic versioning).
	         *
	         * @default false
	         */
	        this.allowDowngrade = false;
	        /**
	         * Web installer files might not have signature verification, this switch prevents to load them unless it is needed.
	         *
	         * Currently false to prevent breaking the current API, but it should be changed to default true at some point that
	         * breaking changes are allowed.
	         *
	         * @default false
	         */
	        this.disableWebInstaller = false;
	        /**
	         * *NSIS only* Disable differential downloads and always perform full download of installer.
	         *
	         * @default false
	         */
	        this.disableDifferentialDownload = false;
	        /**
	         * Allows developer to force the updater to work in "dev" mode, looking for "dev-app-update.yml" instead of "app-update.yml"
	         * Dev: `path.join(this.app.getAppPath(), "dev-app-update.yml")`
	         * Prod: `path.join(process.resourcesPath!, "app-update.yml")`
	         *
	         * @default false
	         */
	        this.forceDevUpdateConfig = false;
	        this._channel = null;
	        this.downloadedUpdateHelper = null;
	        /**
	         *  The request headers.
	         */
	        this.requestHeaders = null;
	        this._logger = console;
	        // noinspection JSUnusedGlobalSymbols
	        /**
	         * For type safety you can use signals, e.g. `autoUpdater.signals.updateDownloaded(() => {})` instead of `autoUpdater.on('update-available', () => {})`
	         */
	        this.signals = new main_1.UpdaterSignal(this);
	        this._appUpdateConfigPath = null;
	        this.clientPromise = null;
	        this.stagingUserIdPromise = new lazy_val_1.Lazy(() => this.getOrCreateStagingUserId());
	        // public, allow to read old config for anyone
	        /** @internal */
	        this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
	        this.checkForUpdatesPromise = null;
	        this.downloadPromise = null;
	        this.updateInfoAndProvider = null;
	        /**
	         * @private
	         * @internal
	         */
	        this._testOnlyOptions = null;
	        this.on("error", (error) => {
	            this._logger.error(`Error: ${error.stack || error.message}`);
	        });
	        if (app == null) {
	            this.app = new ElectronAppAdapter_1.ElectronAppAdapter();
	            this.httpExecutor = new electronHttpExecutor_1.ElectronHttpExecutor((authInfo, callback) => this.emit("login", authInfo, callback));
	        }
	        else {
	            this.app = app;
	            this.httpExecutor = null;
	        }
	        const currentVersionString = this.app.version;
	        const currentVersion = (0, semver_1.parse)(currentVersionString);
	        if (currentVersion == null) {
	            throw (0, builder_util_runtime_1.newError)(`App version is not a valid semver version: "${currentVersionString}"`, "ERR_UPDATER_INVALID_VERSION");
	        }
	        this.currentVersion = currentVersion;
	        this.allowPrerelease = hasPrereleaseComponents(currentVersion);
	        if (options != null) {
	            this.setFeedURL(options);
	            if (typeof options !== "string" && options.requestHeaders) {
	                this.requestHeaders = options.requestHeaders;
	            }
	        }
	    }
	    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
	    getFeedURL() {
	        return "Deprecated. Do not use it.";
	    }
	    /**
	     * Configure update provider. If value is `string`, [GenericServerOptions](/configuration/publish#genericserveroptions) will be set with value as `url`.
	     * @param options If you want to override configuration in the `app-update.yml`.
	     */
	    setFeedURL(options) {
	        const runtimeOptions = this.createProviderRuntimeOptions();
	        // https://github.com/electron-userland/electron-builder/issues/1105
	        let provider;
	        if (typeof options === "string") {
	            provider = new GenericProvider_1.GenericProvider({ provider: "generic", url: options }, this, {
	                ...runtimeOptions,
	                isUseMultipleRangeRequest: (0, providerFactory_1.isUrlProbablySupportMultiRangeRequests)(options),
	            });
	        }
	        else {
	            provider = (0, providerFactory_1.createClient)(options, this, runtimeOptions);
	        }
	        this.clientPromise = Promise.resolve(provider);
	    }
	    /**
	     * Asks the server whether there is an update.
	     */
	    checkForUpdates() {
	        if (!this.isUpdaterActive()) {
	            return Promise.resolve(null);
	        }
	        let checkForUpdatesPromise = this.checkForUpdatesPromise;
	        if (checkForUpdatesPromise != null) {
	            this._logger.info("Checking for update (already in progress)");
	            return checkForUpdatesPromise;
	        }
	        const nullizePromise = () => (this.checkForUpdatesPromise = null);
	        this._logger.info("Checking for update");
	        checkForUpdatesPromise = this.doCheckForUpdates()
	            .then(it => {
	            nullizePromise();
	            return it;
	        })
	            .catch((e) => {
	            nullizePromise();
	            this.emit("error", e, `Cannot check for updates: ${(e.stack || e).toString()}`);
	            throw e;
	        });
	        this.checkForUpdatesPromise = checkForUpdatesPromise;
	        return checkForUpdatesPromise;
	    }
	    isUpdaterActive() {
	        const isEnabled = this.app.isPackaged || this.forceDevUpdateConfig;
	        if (!isEnabled) {
	            this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced");
	            return false;
	        }
	        return true;
	    }
	    // noinspection JSUnusedGlobalSymbols
	    checkForUpdatesAndNotify(downloadNotification) {
	        return this.checkForUpdates().then(it => {
	            if (!(it === null || it === void 0 ? void 0 : it.downloadPromise)) {
	                if (this._logger.debug != null) {
	                    this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null");
	                }
	                return it;
	            }
	            void it.downloadPromise.then(() => {
	                const notificationContent = AppUpdater.formatDownloadNotification(it.updateInfo.version, this.app.name, downloadNotification);
	                new (require$$1$5.Notification)(notificationContent).show();
	            });
	            return it;
	        });
	    }
	    static formatDownloadNotification(version, appName, downloadNotification) {
	        if (downloadNotification == null) {
	            downloadNotification = {
	                title: "A new update is ready to install",
	                body: `{appName} version {version} has been downloaded and will be automatically installed on exit`,
	            };
	        }
	        downloadNotification = {
	            title: downloadNotification.title.replace("{appName}", appName).replace("{version}", version),
	            body: downloadNotification.body.replace("{appName}", appName).replace("{version}", version),
	        };
	        return downloadNotification;
	    }
	    async isStagingMatch(updateInfo) {
	        const rawStagingPercentage = updateInfo.stagingPercentage;
	        let stagingPercentage = rawStagingPercentage;
	        if (stagingPercentage == null) {
	            return true;
	        }
	        stagingPercentage = parseInt(stagingPercentage, 10);
	        if (isNaN(stagingPercentage)) {
	            this._logger.warn(`Staging percentage is NaN: ${rawStagingPercentage}`);
	            return true;
	        }
	        // convert from user 0-100 to internal 0-1
	        stagingPercentage = stagingPercentage / 100;
	        const stagingUserId = await this.stagingUserIdPromise.value;
	        const val = builder_util_runtime_1.UUID.parse(stagingUserId).readUInt32BE(12);
	        const percentage = val / 0xffffffff;
	        this._logger.info(`Staging percentage: ${stagingPercentage}, percentage: ${percentage}, user id: ${stagingUserId}`);
	        return percentage < stagingPercentage;
	    }
	    computeFinalHeaders(headers) {
	        if (this.requestHeaders != null) {
	            Object.assign(headers, this.requestHeaders);
	        }
	        return headers;
	    }
	    async isUpdateAvailable(updateInfo) {
	        const latestVersion = (0, semver_1.parse)(updateInfo.version);
	        if (latestVersion == null) {
	            throw (0, builder_util_runtime_1.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${updateInfo.version}"`, "ERR_UPDATER_INVALID_VERSION");
	        }
	        const currentVersion = this.currentVersion;
	        if ((0, semver_1.eq)(latestVersion, currentVersion)) {
	            return false;
	        }
	        const minimumSystemVersion = updateInfo === null || updateInfo === void 0 ? void 0 : updateInfo.minimumSystemVersion;
	        const currentOSVersion = (0, os_1.release)();
	        if (minimumSystemVersion) {
	            try {
	                if ((0, semver_1.lt)(currentOSVersion, minimumSystemVersion)) {
	                    this._logger.info(`Current OS version ${currentOSVersion} is less than the minimum OS version required ${minimumSystemVersion} for version ${currentOSVersion}`);
	                    return false;
	                }
	            }
	            catch (e) {
	                this._logger.warn(`Failed to compare current OS version(${currentOSVersion}) with minimum OS version(${minimumSystemVersion}): ${(e.message || e).toString()}`);
	            }
	        }
	        const isStagingMatch = await this.isStagingMatch(updateInfo);
	        if (!isStagingMatch) {
	            return false;
	        }
	        // https://github.com/electron-userland/electron-builder/pull/3111#issuecomment-405033227
	        // https://github.com/electron-userland/electron-builder/pull/3111#issuecomment-405030797
	        const isLatestVersionNewer = (0, semver_1.gt)(latestVersion, currentVersion);
	        const isLatestVersionOlder = (0, semver_1.lt)(latestVersion, currentVersion);
	        if (isLatestVersionNewer) {
	            return true;
	        }
	        return this.allowDowngrade && isLatestVersionOlder;
	    }
	    async getUpdateInfoAndProvider() {
	        await this.app.whenReady();
	        if (this.clientPromise == null) {
	            this.clientPromise = this.configOnDisk.value.then(it => (0, providerFactory_1.createClient)(it, this, this.createProviderRuntimeOptions()));
	        }
	        const client = await this.clientPromise;
	        const stagingUserId = await this.stagingUserIdPromise.value;
	        client.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": stagingUserId }));
	        return {
	            info: await client.getLatestVersion(),
	            provider: client,
	        };
	    }
	    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	    createProviderRuntimeOptions() {
	        return {
	            isUseMultipleRangeRequest: true,
	            platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
	            executor: this.httpExecutor,
	        };
	    }
	    async doCheckForUpdates() {
	        this.emit("checking-for-update");
	        const result = await this.getUpdateInfoAndProvider();
	        const updateInfo = result.info;
	        if (!(await this.isUpdateAvailable(updateInfo))) {
	            this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${updateInfo.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`);
	            this.emit("update-not-available", updateInfo);
	            return {
	                versionInfo: updateInfo,
	                updateInfo,
	            };
	        }
	        this.updateInfoAndProvider = result;
	        this.onUpdateAvailable(updateInfo);
	        const cancellationToken = new builder_util_runtime_1.CancellationToken();
	        //noinspection ES6MissingAwait
	        return {
	            versionInfo: updateInfo,
	            updateInfo,
	            cancellationToken,
	            downloadPromise: this.autoDownload ? this.downloadUpdate(cancellationToken) : null,
	        };
	    }
	    onUpdateAvailable(updateInfo) {
	        this._logger.info(`Found version ${updateInfo.version} (url: ${(0, builder_util_runtime_1.asArray)(updateInfo.files)
	            .map(it => it.url)
	            .join(", ")})`);
	        this.emit("update-available", updateInfo);
	    }
	    /**
	     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
	     * @returns {Promise<Array<string>>} Paths to downloaded files.
	     */
	    downloadUpdate(cancellationToken = new builder_util_runtime_1.CancellationToken()) {
	        const updateInfoAndProvider = this.updateInfoAndProvider;
	        if (updateInfoAndProvider == null) {
	            const error = new Error("Please check update first");
	            this.dispatchError(error);
	            return Promise.reject(error);
	        }
	        if (this.downloadPromise != null) {
	            this._logger.info("Downloading update (already in progress)");
	            return this.downloadPromise;
	        }
	        this._logger.info(`Downloading update from ${(0, builder_util_runtime_1.asArray)(updateInfoAndProvider.info.files)
	            .map(it => it.url)
	            .join(", ")}`);
	        const errorHandler = (e) => {
	            // https://github.com/electron-userland/electron-builder/issues/1150#issuecomment-436891159
	            if (!(e instanceof builder_util_runtime_1.CancellationError)) {
	                try {
	                    this.dispatchError(e);
	                }
	                catch (nestedError) {
	                    this._logger.warn(`Cannot dispatch error event: ${nestedError.stack || nestedError}`);
	                }
	            }
	            return e;
	        };
	        this.downloadPromise = this.doDownloadUpdate({
	            updateInfoAndProvider,
	            requestHeaders: this.computeRequestHeaders(updateInfoAndProvider.provider),
	            cancellationToken,
	            disableWebInstaller: this.disableWebInstaller,
	            disableDifferentialDownload: this.disableDifferentialDownload,
	        })
	            .catch((e) => {
	            throw errorHandler(e);
	        })
	            .finally(() => {
	            this.downloadPromise = null;
	        });
	        return this.downloadPromise;
	    }
	    dispatchError(e) {
	        this.emit("error", e, (e.stack || e).toString());
	    }
	    dispatchUpdateDownloaded(event) {
	        this.emit(main_1.UPDATE_DOWNLOADED, event);
	    }
	    async loadUpdateConfig() {
	        if (this._appUpdateConfigPath == null) {
	            this._appUpdateConfigPath = this.app.appUpdateConfigPath;
	        }
	        return (0, js_yaml_1.load)(await (0, fs_extra_1.readFile)(this._appUpdateConfigPath, "utf-8"));
	    }
	    computeRequestHeaders(provider) {
	        const fileExtraDownloadHeaders = provider.fileExtraDownloadHeaders;
	        if (fileExtraDownloadHeaders != null) {
	            const requestHeaders = this.requestHeaders;
	            return requestHeaders == null
	                ? fileExtraDownloadHeaders
	                : {
	                    ...fileExtraDownloadHeaders,
	                    ...requestHeaders,
	                };
	        }
	        return this.computeFinalHeaders({ accept: "*/*" });
	    }
	    async getOrCreateStagingUserId() {
	        const file = path.join(this.app.userDataPath, ".updaterId");
	        try {
	            const id = await (0, fs_extra_1.readFile)(file, "utf-8");
	            if (builder_util_runtime_1.UUID.check(id)) {
	                return id;
	            }
	            else {
	                this._logger.warn(`Staging user id file exists, but content was invalid: ${id}`);
	            }
	        }
	        catch (e) {
	            if (e.code !== "ENOENT") {
	                this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${e}`);
	            }
	        }
	        const id = builder_util_runtime_1.UUID.v5((0, crypto_1.randomBytes)(4096), builder_util_runtime_1.UUID.OID);
	        this._logger.info(`Generated new staging user ID: ${id}`);
	        try {
	            await (0, fs_extra_1.outputFile)(file, id);
	        }
	        catch (e) {
	            this._logger.warn(`Couldn't write out staging user ID: ${e}`);
	        }
	        return id;
	    }
	    /** @internal */
	    get isAddNoCacheQuery() {
	        const headers = this.requestHeaders;
	        // https://github.com/electron-userland/electron-builder/issues/3021
	        if (headers == null) {
	            return true;
	        }
	        for (const headerName of Object.keys(headers)) {
	            const s = headerName.toLowerCase();
	            if (s === "authorization" || s === "private-token") {
	                return false;
	            }
	        }
	        return true;
	    }
	    async getOrCreateDownloadHelper() {
	        let result = this.downloadedUpdateHelper;
	        if (result == null) {
	            const dirName = (await this.configOnDisk.value).updaterCacheDirName;
	            const logger = this._logger;
	            if (dirName == null) {
	                logger.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
	            }
	            const cacheDir = path.join(this.app.baseCachePath, dirName || this.app.name);
	            if (logger.debug != null) {
	                logger.debug(`updater cache dir: ${cacheDir}`);
	            }
	            result = new DownloadedUpdateHelper_1.DownloadedUpdateHelper(cacheDir);
	            this.downloadedUpdateHelper = result;
	        }
	        return result;
	    }
	    async executeDownload(taskOptions) {
	        const fileInfo = taskOptions.fileInfo;
	        const downloadOptions = {
	            headers: taskOptions.downloadUpdateOptions.requestHeaders,
	            cancellationToken: taskOptions.downloadUpdateOptions.cancellationToken,
	            sha2: fileInfo.info.sha2,
	            sha512: fileInfo.info.sha512,
	        };
	        if (this.listenerCount(main_1.DOWNLOAD_PROGRESS) > 0) {
	            downloadOptions.onProgress = it => this.emit(main_1.DOWNLOAD_PROGRESS, it);
	        }
	        const updateInfo = taskOptions.downloadUpdateOptions.updateInfoAndProvider.info;
	        const version = updateInfo.version;
	        const packageInfo = fileInfo.packageInfo;
	        function getCacheUpdateFileName() {
	            // NodeJS URL doesn't decode automatically
	            const urlPath = decodeURIComponent(taskOptions.fileInfo.url.pathname);
	            if (urlPath.endsWith(`.${taskOptions.fileExtension}`)) {
	                return path.basename(urlPath);
	            }
	            else {
	                // url like /latest, generate name
	                return taskOptions.fileInfo.info.url;
	            }
	        }
	        const downloadedUpdateHelper = await this.getOrCreateDownloadHelper();
	        const cacheDir = downloadedUpdateHelper.cacheDirForPendingUpdate;
	        await (0, fs_extra_1.mkdir)(cacheDir, { recursive: true });
	        const updateFileName = getCacheUpdateFileName();
	        let updateFile = path.join(cacheDir, updateFileName);
	        const packageFile = packageInfo == null ? null : path.join(cacheDir, `package-${version}${path.extname(packageInfo.path) || ".7z"}`);
	        const done = async (isSaveCache) => {
	            await downloadedUpdateHelper.setDownloadedFile(updateFile, packageFile, updateInfo, fileInfo, updateFileName, isSaveCache);
	            await taskOptions.done({
	                ...updateInfo,
	                downloadedFile: updateFile,
	            });
	            return packageFile == null ? [updateFile] : [updateFile, packageFile];
	        };
	        const log = this._logger;
	        const cachedUpdateFile = await downloadedUpdateHelper.validateDownloadedPath(updateFile, updateInfo, fileInfo, log);
	        if (cachedUpdateFile != null) {
	            updateFile = cachedUpdateFile;
	            return await done(false);
	        }
	        const removeFileIfAny = async () => {
	            await downloadedUpdateHelper.clear().catch(() => {
	                // ignore
	            });
	            return await (0, fs_extra_1.unlink)(updateFile).catch(() => {
	                // ignore
	            });
	        };
	        const tempUpdateFile = await (0, DownloadedUpdateHelper_1.createTempUpdateFile)(`temp-${updateFileName}`, cacheDir, log);
	        try {
	            await taskOptions.task(tempUpdateFile, downloadOptions, packageFile, removeFileIfAny);
	            await (0, fs_extra_1.rename)(tempUpdateFile, updateFile);
	        }
	        catch (e) {
	            await removeFileIfAny();
	            if (e instanceof builder_util_runtime_1.CancellationError) {
	                log.info("cancelled");
	                this.emit("update-cancelled", updateInfo);
	            }
	            throw e;
	        }
	        log.info(`New version ${version} has been downloaded to ${updateFile}`);
	        return await done(true);
	    }
	    async differentialDownloadInstaller(fileInfo, downloadUpdateOptions, installerPath, provider, oldInstallerFileName) {
	        try {
	            if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload) {
	                return true;
	            }
	            const blockmapFileUrls = (0, util_1.blockmapFiles)(fileInfo.url, this.app.version, downloadUpdateOptions.updateInfoAndProvider.info.version);
	            this._logger.info(`Download block maps (old: "${blockmapFileUrls[0]}", new: ${blockmapFileUrls[1]})`);
	            const downloadBlockMap = async (url) => {
	                const data = await this.httpExecutor.downloadToBuffer(url, {
	                    headers: downloadUpdateOptions.requestHeaders,
	                    cancellationToken: downloadUpdateOptions.cancellationToken,
	                });
	                if (data == null || data.length === 0) {
	                    throw new Error(`Blockmap "${url.href}" is empty`);
	                }
	                try {
	                    return JSON.parse((0, zlib_1.gunzipSync)(data).toString());
	                }
	                catch (e) {
	                    throw new Error(`Cannot parse blockmap "${url.href}", error: ${e}`);
	                }
	            };
	            const downloadOptions = {
	                newUrl: fileInfo.url,
	                oldFile: path.join(this.downloadedUpdateHelper.cacheDir, oldInstallerFileName),
	                logger: this._logger,
	                newFile: installerPath,
	                isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
	                requestHeaders: downloadUpdateOptions.requestHeaders,
	                cancellationToken: downloadUpdateOptions.cancellationToken,
	            };
	            if (this.listenerCount(main_1.DOWNLOAD_PROGRESS) > 0) {
	                downloadOptions.onProgress = it => this.emit(main_1.DOWNLOAD_PROGRESS, it);
	            }
	            const blockMapDataList = await Promise.all(blockmapFileUrls.map(u => downloadBlockMap(u)));
	            await new GenericDifferentialDownloader_1.GenericDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download(blockMapDataList[0], blockMapDataList[1]);
	            return false;
	        }
	        catch (e) {
	            this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
	            if (this._testOnlyOptions != null) {
	                // test mode
	                throw e;
	            }
	            return true;
	        }
	    }
	};
	AppUpdater.AppUpdater = AppUpdater$1;
	function hasPrereleaseComponents(version) {
	    const versionPrereleaseComponent = (0, semver_1.prerelease)(version);
	    return versionPrereleaseComponent != null && versionPrereleaseComponent.length > 0;
	}
	/** @private */
	class NoOpLogger {
	    // eslint-disable-next-line @typescript-eslint/no-unused-vars
	    info(message) {
	        // ignore
	    }
	    // eslint-disable-next-line @typescript-eslint/no-unused-vars
	    warn(message) {
	        // ignore
	    }
	    // eslint-disable-next-line @typescript-eslint/no-unused-vars
	    error(message) {
	        // ignore
	    }
	}
	AppUpdater.NoOpLogger = NoOpLogger;
	
	return AppUpdater;
}

var hasRequiredBaseUpdater;

function requireBaseUpdater () {
	if (hasRequiredBaseUpdater) return BaseUpdater;
	hasRequiredBaseUpdater = 1;
	Object.defineProperty(BaseUpdater, "__esModule", { value: true });
	BaseUpdater.BaseUpdater = void 0;
	const child_process_1 = require$$1$6;
	const AppUpdater_1 = requireAppUpdater();
	let BaseUpdater$1 = class BaseUpdater extends AppUpdater_1.AppUpdater {
	    constructor(options, app) {
	        super(options, app);
	        this.quitAndInstallCalled = false;
	        this.quitHandlerAdded = false;
	    }
	    quitAndInstall(isSilent = false, isForceRunAfter = false) {
	        this._logger.info(`Install on explicit quitAndInstall`);
	        // If NOT in silent mode use `autoRunAppAfterInstall` to determine whether to force run the app
	        const isInstalled = this.install(isSilent, isSilent ? isForceRunAfter : this.autoRunAppAfterInstall);
	        if (isInstalled) {
	            setImmediate(() => {
	                // this event is normally emitted when calling quitAndInstall, this emulates that
	                require$$1$5.autoUpdater.emit("before-quit-for-update");
	                this.app.quit();
	            });
	        }
	        else {
	            this.quitAndInstallCalled = false;
	        }
	    }
	    executeDownload(taskOptions) {
	        return super.executeDownload({
	            ...taskOptions,
	            done: event => {
	                this.dispatchUpdateDownloaded(event);
	                this.addQuitHandler();
	                return Promise.resolve();
	            },
	        });
	    }
	    // must be sync (because quit even handler is not async)
	    install(isSilent = false, isForceRunAfter = false) {
	        if (this.quitAndInstallCalled) {
	            this._logger.warn("install call ignored: quitAndInstallCalled is set to true");
	            return false;
	        }
	        const downloadedUpdateHelper = this.downloadedUpdateHelper;
	        // Get the installer path, ensuring spaces are escaped on Linux
	        // 1. Check if downloadedUpdateHelper is not null
	        // 2. Check if downloadedUpdateHelper.file is not null
	        // 3. If both checks pass:
	        //    a. If the platform is Linux, replace spaces with '\ ' for shell compatibility
	        //    b. If the platform is not Linux, use the original path
	        // 4. If any check fails, set installerPath to null
	        const installerPath = downloadedUpdateHelper && downloadedUpdateHelper.file ? (process.platform === "linux" ? downloadedUpdateHelper.file.replace(/ /g, "\\ ") : downloadedUpdateHelper.file) : null;
	        const downloadedFileInfo = downloadedUpdateHelper == null ? null : downloadedUpdateHelper.downloadedFileInfo;
	        if (installerPath == null || downloadedFileInfo == null) {
	            this.dispatchError(new Error("No valid update available, can't quit and install"));
	            return false;
	        }
	        // prevent calling several times
	        this.quitAndInstallCalled = true;
	        try {
	            this._logger.info(`Install: isSilent: ${isSilent}, isForceRunAfter: ${isForceRunAfter}`);
	            return this.doInstall({
	                installerPath,
	                isSilent,
	                isForceRunAfter,
	                isAdminRightsRequired: downloadedFileInfo.isAdminRightsRequired,
	            });
	        }
	        catch (e) {
	            this.dispatchError(e);
	            return false;
	        }
	    }
	    addQuitHandler() {
	        if (this.quitHandlerAdded || !this.autoInstallOnAppQuit) {
	            return;
	        }
	        this.quitHandlerAdded = true;
	        this.app.onQuit(exitCode => {
	            if (this.quitAndInstallCalled) {
	                this._logger.info("Update installer has already been triggered. Quitting application.");
	                return;
	            }
	            if (!this.autoInstallOnAppQuit) {
	                this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
	                return;
	            }
	            if (exitCode !== 0) {
	                this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${exitCode}`);
	                return;
	            }
	            this._logger.info("Auto install update on quit");
	            this.install(true, false);
	        });
	    }
	    wrapSudo() {
	        const { name } = this.app;
	        const installComment = `"${name} would like to update"`;
	        const sudo = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu");
	        const command = [sudo];
	        if (/kdesudo/i.test(sudo)) {
	            command.push("--comment", installComment);
	            command.push("-c");
	        }
	        else if (/gksudo/i.test(sudo)) {
	            command.push("--message", installComment);
	        }
	        else if (/pkexec/i.test(sudo)) {
	            command.push("--disable-internal-agent");
	        }
	        return command.join(" ");
	    }
	    spawnSyncLog(cmd, args = [], env = {}) {
	        this._logger.info(`Executing: ${cmd} with args: ${args}`);
	        const response = (0, child_process_1.spawnSync)(cmd, args, {
	            env: { ...process.env, ...env },
	            encoding: "utf-8",
	            shell: true,
	        });
	        return response.stdout.trim();
	    }
	    /**
	     * This handles both node 8 and node 10 way of emitting error when spawning a process
	     *   - node 8: Throws the error
	     *   - node 10: Emit the error(Need to listen with on)
	     */
	    // https://github.com/electron-userland/electron-builder/issues/1129
	    // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
	    async spawnLog(cmd, args = [], env = undefined, stdio = "ignore") {
	        this._logger.info(`Executing: ${cmd} with args: ${args}`);
	        return new Promise((resolve, reject) => {
	            try {
	                const params = { stdio, env, detached: true };
	                const p = (0, child_process_1.spawn)(cmd, args, params);
	                p.on("error", error => {
	                    reject(error);
	                });
	                p.unref();
	                if (p.pid !== undefined) {
	                    resolve(true);
	                }
	            }
	            catch (error) {
	                reject(error);
	            }
	        });
	    }
	};
	BaseUpdater.BaseUpdater = BaseUpdater$1;
	
	return BaseUpdater;
}

var AppImageUpdater = {};

var FileWithEmbeddedBlockMapDifferentialDownloader$1 = {};

Object.defineProperty(FileWithEmbeddedBlockMapDifferentialDownloader$1, "__esModule", { value: true });
FileWithEmbeddedBlockMapDifferentialDownloader$1.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const fs_extra_1 = lib;
const DifferentialDownloader_1 = DifferentialDownloader$1;
const zlib_1 = require$$15;
class FileWithEmbeddedBlockMapDifferentialDownloader extends DifferentialDownloader_1.DifferentialDownloader {
    async download() {
        const packageInfo = this.blockAwareFileInfo;
        const fileSize = packageInfo.size;
        const offset = fileSize - (packageInfo.blockMapSize + 4);
        this.fileMetadataBuffer = await this.readRemoteBytes(offset, fileSize - 1);
        const newBlockMap = readBlockMap(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
        await this.doDownload(await readEmbeddedBlockMapData(this.options.oldFile), newBlockMap);
    }
}
FileWithEmbeddedBlockMapDifferentialDownloader$1.FileWithEmbeddedBlockMapDifferentialDownloader = FileWithEmbeddedBlockMapDifferentialDownloader;
function readBlockMap(data) {
    return JSON.parse((0, zlib_1.inflateRawSync)(data).toString());
}
async function readEmbeddedBlockMapData(file) {
    const fd = await (0, fs_extra_1.open)(file, "r");
    try {
        const fileSize = (await (0, fs_extra_1.fstat)(fd)).size;
        const sizeBuffer = Buffer.allocUnsafe(4);
        await (0, fs_extra_1.read)(fd, sizeBuffer, 0, sizeBuffer.length, fileSize - sizeBuffer.length);
        const dataBuffer = Buffer.allocUnsafe(sizeBuffer.readUInt32BE(0));
        await (0, fs_extra_1.read)(fd, dataBuffer, 0, dataBuffer.length, fileSize - sizeBuffer.length - dataBuffer.length);
        await (0, fs_extra_1.close)(fd);
        return readBlockMap(dataBuffer);
    }
    catch (e) {
        await (0, fs_extra_1.close)(fd);
        throw e;
    }
}

var hasRequiredAppImageUpdater;

function requireAppImageUpdater () {
	if (hasRequiredAppImageUpdater) return AppImageUpdater;
	hasRequiredAppImageUpdater = 1;
	Object.defineProperty(AppImageUpdater, "__esModule", { value: true });
	AppImageUpdater.AppImageUpdater = void 0;
	const builder_util_runtime_1 = out;
	const child_process_1 = require$$1$6;
	const fs_extra_1 = lib;
	const fs_1 = require$$1$2;
	const path = require$$1$4;
	const BaseUpdater_1 = requireBaseUpdater();
	const FileWithEmbeddedBlockMapDifferentialDownloader_1 = FileWithEmbeddedBlockMapDifferentialDownloader$1;
	const main_1 = requireMain();
	const Provider_1 = Provider$1;
	let AppImageUpdater$1 = class AppImageUpdater extends BaseUpdater_1.BaseUpdater {
	    constructor(options, app) {
	        super(options, app);
	    }
	    isUpdaterActive() {
	        if (process.env["APPIMAGE"] == null) {
	            if (process.env["SNAP"] == null) {
	                this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage");
	            }
	            else {
	                this._logger.info("SNAP env is defined, updater is disabled");
	            }
	            return false;
	        }
	        return super.isUpdaterActive();
	    }
	    /*** @private */
	    doDownloadUpdate(downloadUpdateOptions) {
	        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
	        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "AppImage", ["rpm", "deb"]);
	        return this.executeDownload({
	            fileExtension: "AppImage",
	            fileInfo,
	            downloadUpdateOptions,
	            task: async (updateFile, downloadOptions) => {
	                const oldFile = process.env["APPIMAGE"];
	                if (oldFile == null) {
	                    throw (0, builder_util_runtime_1.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
	                }
	                let isDownloadFull = false;
	                try {
	                    const downloadOptions = {
	                        newUrl: fileInfo.url,
	                        oldFile,
	                        logger: this._logger,
	                        newFile: updateFile,
	                        isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
	                        requestHeaders: downloadUpdateOptions.requestHeaders,
	                        cancellationToken: downloadUpdateOptions.cancellationToken,
	                    };
	                    if (this.listenerCount(main_1.DOWNLOAD_PROGRESS) > 0) {
	                        downloadOptions.onProgress = it => this.emit(main_1.DOWNLOAD_PROGRESS, it);
	                    }
	                    await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download();
	                }
	                catch (e) {
	                    this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
	                    // during test (developer machine mac) we must throw error
	                    isDownloadFull = process.platform === "linux";
	                }
	                if (isDownloadFull) {
	                    await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
	                }
	                await (0, fs_extra_1.chmod)(updateFile, 0o755);
	            },
	        });
	    }
	    doInstall(options) {
	        const appImageFile = process.env["APPIMAGE"];
	        if (appImageFile == null) {
	            throw (0, builder_util_runtime_1.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
	        }
	        // https://stackoverflow.com/a/1712051/1910191
	        (0, fs_1.unlinkSync)(appImageFile);
	        let destination;
	        const existingBaseName = path.basename(appImageFile);
	        // https://github.com/electron-userland/electron-builder/issues/2964
	        // if no version in existing file name, it means that user wants to preserve current custom name
	        if (path.basename(options.installerPath) === existingBaseName || !/\d+\.\d+\.\d+/.test(existingBaseName)) {
	            // no version in the file name, overwrite existing
	            destination = appImageFile;
	        }
	        else {
	            destination = path.join(path.dirname(appImageFile), path.basename(options.installerPath));
	        }
	        (0, child_process_1.execFileSync)("mv", ["-f", options.installerPath, destination]);
	        if (destination !== appImageFile) {
	            this.emit("appimage-filename-updated", destination);
	        }
	        const env = {
	            ...process.env,
	            APPIMAGE_SILENT_INSTALL: "true",
	        };
	        if (options.isForceRunAfter) {
	            // eslint-disable-next-line @typescript-eslint/no-floating-promises
	            this.spawnLog(destination, [], env);
	        }
	        else {
	            env.APPIMAGE_EXIT_AFTER_INSTALL = "true";
	            (0, child_process_1.execFileSync)(destination, [], { env });
	        }
	        return true;
	    }
	};
	AppImageUpdater.AppImageUpdater = AppImageUpdater$1;
	
	return AppImageUpdater;
}

var DebUpdater = {};

var hasRequiredDebUpdater;

function requireDebUpdater () {
	if (hasRequiredDebUpdater) return DebUpdater;
	hasRequiredDebUpdater = 1;
	Object.defineProperty(DebUpdater, "__esModule", { value: true });
	DebUpdater.DebUpdater = void 0;
	const BaseUpdater_1 = requireBaseUpdater();
	const main_1 = requireMain();
	const Provider_1 = Provider$1;
	let DebUpdater$1 = class DebUpdater extends BaseUpdater_1.BaseUpdater {
	    constructor(options, app) {
	        super(options, app);
	    }
	    /*** @private */
	    doDownloadUpdate(downloadUpdateOptions) {
	        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
	        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "deb", ["AppImage", "rpm"]);
	        return this.executeDownload({
	            fileExtension: "deb",
	            fileInfo,
	            downloadUpdateOptions,
	            task: async (updateFile, downloadOptions) => {
	                if (this.listenerCount(main_1.DOWNLOAD_PROGRESS) > 0) {
	                    downloadOptions.onProgress = it => this.emit(main_1.DOWNLOAD_PROGRESS, it);
	                }
	                await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
	            },
	        });
	    }
	    doInstall(options) {
	        const sudo = this.wrapSudo();
	        // pkexec doesn't want the command to be wrapped in " quotes
	        const wrapper = /pkexec/i.test(sudo) ? "" : `"`;
	        const cmd = ["dpkg", "-i", options.installerPath, "||", "apt-get", "install", "-f", "-y"];
	        this.spawnSyncLog(sudo, [`${wrapper}/bin/bash`, "-c", `'${cmd.join(" ")}'${wrapper}`]);
	        if (options.isForceRunAfter) {
	            this.app.relaunch();
	        }
	        return true;
	    }
	};
	DebUpdater.DebUpdater = DebUpdater$1;
	
	return DebUpdater;
}

var RpmUpdater = {};

var hasRequiredRpmUpdater;

function requireRpmUpdater () {
	if (hasRequiredRpmUpdater) return RpmUpdater;
	hasRequiredRpmUpdater = 1;
	Object.defineProperty(RpmUpdater, "__esModule", { value: true });
	RpmUpdater.RpmUpdater = void 0;
	const BaseUpdater_1 = requireBaseUpdater();
	const main_1 = requireMain();
	const Provider_1 = Provider$1;
	let RpmUpdater$1 = class RpmUpdater extends BaseUpdater_1.BaseUpdater {
	    constructor(options, app) {
	        super(options, app);
	    }
	    /*** @private */
	    doDownloadUpdate(downloadUpdateOptions) {
	        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
	        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "rpm", ["AppImage", "deb"]);
	        return this.executeDownload({
	            fileExtension: "rpm",
	            fileInfo,
	            downloadUpdateOptions,
	            task: async (updateFile, downloadOptions) => {
	                if (this.listenerCount(main_1.DOWNLOAD_PROGRESS) > 0) {
	                    downloadOptions.onProgress = it => this.emit(main_1.DOWNLOAD_PROGRESS, it);
	                }
	                await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
	            },
	        });
	    }
	    doInstall(options) {
	        const upgradePath = options.installerPath;
	        const sudo = this.wrapSudo();
	        // pkexec doesn't want the command to be wrapped in " quotes
	        const wrapper = /pkexec/i.test(sudo) ? "" : `"`;
	        const packageManager = this.spawnSyncLog("which zypper");
	        let cmd;
	        if (!packageManager) {
	            const packageManager = this.spawnSyncLog("which dnf || which yum");
	            cmd = [packageManager, "-y", "install", upgradePath];
	        }
	        else {
	            cmd = [packageManager, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", upgradePath];
	        }
	        this.spawnSyncLog(sudo, [`${wrapper}/bin/bash`, "-c", `'${cmd.join(" ")}'${wrapper}`]);
	        if (options.isForceRunAfter) {
	            this.app.relaunch();
	        }
	        return true;
	    }
	};
	RpmUpdater.RpmUpdater = RpmUpdater$1;
	
	return RpmUpdater;
}

var MacUpdater = {};

var hasRequiredMacUpdater;

function requireMacUpdater () {
	if (hasRequiredMacUpdater) return MacUpdater;
	hasRequiredMacUpdater = 1;
	Object.defineProperty(MacUpdater, "__esModule", { value: true });
	MacUpdater.MacUpdater = void 0;
	const builder_util_runtime_1 = out;
	const fs_extra_1 = lib;
	const fs_1 = require$$1$2;
	const path = require$$1$4;
	const http_1 = require$$4$1;
	const AppUpdater_1 = requireAppUpdater();
	const Provider_1 = Provider$1;
	const child_process_1 = require$$1$6;
	const crypto_1 = require$$0$2;
	let MacUpdater$1 = class MacUpdater extends AppUpdater_1.AppUpdater {
	    constructor(options, app) {
	        super(options, app);
	        this.nativeUpdater = require$$1$5.autoUpdater;
	        this.squirrelDownloadedUpdate = false;
	        this.nativeUpdater.on("error", it => {
	            this._logger.warn(it);
	            this.emit("error", it);
	        });
	        this.nativeUpdater.on("update-downloaded", () => {
	            this.squirrelDownloadedUpdate = true;
	            this.debug("nativeUpdater.update-downloaded");
	        });
	    }
	    debug(message) {
	        if (this._logger.debug != null) {
	            this._logger.debug(message);
	        }
	    }
	    closeServerIfExists() {
	        if (this.server) {
	            this.debug("Closing proxy server");
	            this.server.close(err => {
	                if (err) {
	                    this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
	                }
	            });
	        }
	    }
	    async doDownloadUpdate(downloadUpdateOptions) {
	        let files = downloadUpdateOptions.updateInfoAndProvider.provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info);
	        const log = this._logger;
	        // detect if we are running inside Rosetta emulation
	        const sysctlRosettaInfoKey = "sysctl.proc_translated";
	        let isRosetta = false;
	        try {
	            this.debug("Checking for macOS Rosetta environment");
	            const result = (0, child_process_1.execFileSync)("sysctl", [sysctlRosettaInfoKey], { encoding: "utf8" });
	            isRosetta = result.includes(`${sysctlRosettaInfoKey}: 1`);
	            log.info(`Checked for macOS Rosetta environment (isRosetta=${isRosetta})`);
	        }
	        catch (e) {
	            log.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${e}`);
	        }
	        let isArm64Mac = false;
	        try {
	            this.debug("Checking for arm64 in uname");
	            const result = (0, child_process_1.execFileSync)("uname", ["-a"], { encoding: "utf8" });
	            const isArm = result.includes("ARM");
	            log.info(`Checked 'uname -a': arm64=${isArm}`);
	            isArm64Mac = isArm64Mac || isArm;
	        }
	        catch (e) {
	            log.warn(`uname shell command to check for arm64 failed: ${e}`);
	        }
	        isArm64Mac = isArm64Mac || process.arch === "arm64" || isRosetta;
	        // allow arm64 macs to install universal or rosetta2(x64) - https://github.com/electron-userland/electron-builder/pull/5524
	        const isArm64 = (file) => { var _a; return file.url.pathname.includes("arm64") || ((_a = file.info.url) === null || _a === void 0 ? void 0 : _a.includes("arm64")); };
	        if (isArm64Mac && files.some(isArm64)) {
	            files = files.filter(file => isArm64Mac === isArm64(file));
	        }
	        else {
	            files = files.filter(file => !isArm64(file));
	        }
	        const zipFileInfo = (0, Provider_1.findFile)(files, "zip", ["pkg", "dmg"]);
	        if (zipFileInfo == null) {
	            throw (0, builder_util_runtime_1.newError)(`ZIP file not provided: ${(0, builder_util_runtime_1.safeStringifyJson)(files)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
	        }
	        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
	        const CURRENT_MAC_APP_ZIP_FILE_NAME = "update.zip";
	        let cachedUpdateFile = "";
	        return this.executeDownload({
	            fileExtension: "zip",
	            fileInfo: zipFileInfo,
	            downloadUpdateOptions,
	            task: async (destinationFile, downloadOptions) => {
	                cachedUpdateFile = path.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
	                const canDifferentialDownload = () => {
	                    if (!(0, fs_extra_1.pathExistsSync)(cachedUpdateFile)) {
	                        log.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download");
	                        return false;
	                    }
	                    return !downloadUpdateOptions.disableDifferentialDownload;
	                };
	                let differentialDownloadFailed = true;
	                if (canDifferentialDownload()) {
	                    differentialDownloadFailed = await this.differentialDownloadInstaller(zipFileInfo, downloadUpdateOptions, destinationFile, provider, CURRENT_MAC_APP_ZIP_FILE_NAME);
	                }
	                if (differentialDownloadFailed) {
	                    await this.httpExecutor.download(zipFileInfo.url, destinationFile, downloadOptions);
	                }
	            },
	            done: event => {
	                try {
	                    (0, fs_1.copyFileSync)(event.downloadedFile, cachedUpdateFile);
	                }
	                catch (error) {
	                    this._logger.error(`Unable to copy file for caching: ${error.message}`);
	                }
	                return this.updateDownloaded(zipFileInfo, event);
	            },
	        });
	    }
	    async updateDownloaded(zipFileInfo, event) {
	        var _a;
	        const downloadedFile = event.downloadedFile;
	        const updateFileSize = (_a = zipFileInfo.info.size) !== null && _a !== void 0 ? _a : (await (0, fs_extra_1.stat)(downloadedFile)).size;
	        const log = this._logger;
	        const logContext = `fileToProxy=${zipFileInfo.url.href}`;
	        this.closeServerIfExists();
	        this.debug(`Creating proxy server for native Squirrel.Mac (${logContext})`);
	        this.server = (0, http_1.createServer)();
	        this.debug(`Proxy server for native Squirrel.Mac is created (${logContext})`);
	        this.server.on("close", () => {
	            log.info(`Proxy server for native Squirrel.Mac is closed (${logContext})`);
	        });
	        // must be called after server is listening, otherwise address is null
	        const getServerUrl = (s) => {
	            const address = s.address();
	            if (typeof address === "string") {
	                return address;
	            }
	            return `http://127.0.0.1:${address === null || address === void 0 ? void 0 : address.port}`;
	        };
	        return await new Promise((resolve, reject) => {
	            const pass = (0, crypto_1.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
	            const authInfo = Buffer.from(`autoupdater:${pass}`, "ascii");
	            // insecure random is ok
	            const fileUrl = `/${(0, crypto_1.randomBytes)(64).toString("hex")}.zip`;
	            this.server.on("request", (request, response) => {
	                const requestUrl = request.url;
	                log.info(`${requestUrl} requested`);
	                if (requestUrl === "/") {
	                    // check for basic auth header
	                    if (!request.headers.authorization || request.headers.authorization.indexOf("Basic ") === -1) {
	                        response.statusCode = 401;
	                        response.statusMessage = "Invalid Authentication Credentials";
	                        response.end();
	                        log.warn("No authenthication info");
	                        return;
	                    }
	                    // verify auth credentials
	                    const base64Credentials = request.headers.authorization.split(" ")[1];
	                    const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
	                    const [username, password] = credentials.split(":");
	                    if (username !== "autoupdater" || password !== pass) {
	                        response.statusCode = 401;
	                        response.statusMessage = "Invalid Authentication Credentials";
	                        response.end();
	                        log.warn("Invalid authenthication credentials");
	                        return;
	                    }
	                    const data = Buffer.from(`{ "url": "${getServerUrl(this.server)}${fileUrl}" }`);
	                    response.writeHead(200, { "Content-Type": "application/json", "Content-Length": data.length });
	                    response.end(data);
	                    return;
	                }
	                if (!requestUrl.startsWith(fileUrl)) {
	                    log.warn(`${requestUrl} requested, but not supported`);
	                    response.writeHead(404);
	                    response.end();
	                    return;
	                }
	                log.info(`${fileUrl} requested by Squirrel.Mac, pipe ${downloadedFile}`);
	                let errorOccurred = false;
	                response.on("finish", () => {
	                    if (!errorOccurred) {
	                        this.nativeUpdater.removeListener("error", reject);
	                        resolve([]);
	                    }
	                });
	                const readStream = (0, fs_1.createReadStream)(downloadedFile);
	                readStream.on("error", error => {
	                    try {
	                        response.end();
	                    }
	                    catch (e) {
	                        log.warn(`cannot end response: ${e}`);
	                    }
	                    errorOccurred = true;
	                    this.nativeUpdater.removeListener("error", reject);
	                    reject(new Error(`Cannot pipe "${downloadedFile}": ${error}`));
	                });
	                response.writeHead(200, {
	                    "Content-Type": "application/zip",
	                    "Content-Length": updateFileSize,
	                });
	                readStream.pipe(response);
	            });
	            this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${logContext})`);
	            this.server.listen(0, "127.0.0.1", () => {
	                this.debug(`Proxy server for native Squirrel.Mac is listening (address=${getServerUrl(this.server)}, ${logContext})`);
	                this.nativeUpdater.setFeedURL({
	                    url: getServerUrl(this.server),
	                    headers: {
	                        "Cache-Control": "no-cache",
	                        Authorization: `Basic ${authInfo.toString("base64")}`,
	                    },
	                });
	                // The update has been downloaded and is ready to be served to Squirrel
	                this.dispatchUpdateDownloaded(event);
	                if (this.autoInstallOnAppQuit) {
	                    this.nativeUpdater.once("error", reject);
	                    // This will trigger fetching and installing the file on Squirrel side
	                    this.nativeUpdater.checkForUpdates();
	                }
	                else {
	                    resolve([]);
	                }
	            });
	        });
	    }
	    quitAndInstall() {
	        if (this.squirrelDownloadedUpdate) {
	            // update already fetched by Squirrel, it's ready to install
	            this.nativeUpdater.quitAndInstall();
	            this.closeServerIfExists();
	        }
	        else {
	            // Quit and install as soon as Squirrel get the update
	            this.nativeUpdater.on("update-downloaded", () => {
	                this.nativeUpdater.quitAndInstall();
	                this.closeServerIfExists();
	            });
	            if (!this.autoInstallOnAppQuit) {
	                /**
	                 * If this was not `true` previously then MacUpdater.doDownloadUpdate()
	                 * would not actually initiate the downloading by electron's autoUpdater
	                 */
	                this.nativeUpdater.checkForUpdates();
	            }
	        }
	    }
	};
	MacUpdater.MacUpdater = MacUpdater$1;
	
	return MacUpdater;
}

var NsisUpdater = {};

var windowsExecutableCodeSignatureVerifier = {};

Object.defineProperty(windowsExecutableCodeSignatureVerifier, "__esModule", { value: true });
windowsExecutableCodeSignatureVerifier.verifySignature = verifySignature;
const builder_util_runtime_1 = out;
const child_process_1 = require$$1$6;
const os = require$$2;
const path = require$$1$4;
// $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
// | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
// | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
function verifySignature(publisherNames, unescapedTempUpdateFile, logger) {
    return new Promise((resolve, reject) => {
        // Escape quotes and backticks in filenames to prevent user from breaking the
        // arguments and perform a remote command injection.
        //
        // Consider example powershell command:
        // ```powershell
        // Get-AuthenticodeSignature 'C:\\path\\my-bad-';calc;'filename.exe'
        // ```
        // The above would work expected and find the file name, however, it will also execute `;calc;`
        // command and start the calculator app.
        //
        // From Powershell quoting rules:
        // https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules?view=powershell-7
        // * Double quotes `"` are treated literally within single-quoted strings;
        // * Single quotes can be escaped by doubling them: 'don''t' -> don't;
        //
        // Also note that at this point the file has already been written to the disk, thus we are
        // guaranteed that the path will not contain any illegal characters like <>:"/\|?*
        // https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file
        const tempUpdateFile = unescapedTempUpdateFile.replace(/'/g, "''");
        logger.info(`Verifying signature ${tempUpdateFile}`);
        // https://github.com/electron-userland/electron-builder/issues/2421
        // https://github.com/electron-userland/electron-builder/issues/2535
        // Resetting PSModulePath is necessary https://github.com/electron-userland/electron-builder/issues/7127
        // semicolon wont terminate the set command and run chcp thus leading to verification errors on certificats with special chars like german umlauts, so rather
        //   join commands using & https://github.com/electron-userland/electron-builder/issues/8162
        (0, child_process_1.execFile)(`set "PSModulePath=" & chcp 65001 >NUL & powershell.exe`, ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${tempUpdateFile}' | ConvertTo-Json -Compress"`], {
            shell: true,
            timeout: 20 * 1000,
        }, (error, stdout, stderr) => {
            var _a;
            try {
                if (error != null || stderr) {
                    handleError(logger, error, stderr, reject);
                    resolve(null);
                    return;
                }
                const data = parseOut(stdout);
                if (data.Status === 0) {
                    try {
                        const normlaizedUpdateFilePath = path.normalize(data.Path);
                        const normalizedTempUpdateFile = path.normalize(unescapedTempUpdateFile);
                        logger.info(`LiteralPath: ${normlaizedUpdateFilePath}. Update Path: ${normalizedTempUpdateFile}`);
                        if (normlaizedUpdateFilePath !== normalizedTempUpdateFile) {
                            handleError(logger, new Error(`LiteralPath of ${normlaizedUpdateFilePath} is different than ${normalizedTempUpdateFile}`), stderr, reject);
                            resolve(null);
                            return;
                        }
                    }
                    catch (error) {
                        logger.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(_a = error.message) !== null && _a !== void 0 ? _a : error.stack}`);
                    }
                    const subject = (0, builder_util_runtime_1.parseDn)(data.SignerCertificate.Subject);
                    let match = false;
                    for (const name of publisherNames) {
                        const dn = (0, builder_util_runtime_1.parseDn)(name);
                        if (dn.size) {
                            // if we have a full DN, compare all values
                            const allKeys = Array.from(dn.keys());
                            match = allKeys.every(key => {
                                return dn.get(key) === subject.get(key);
                            });
                        }
                        else if (name === subject.get("CN")) {
                            logger.warn(`Signature validated using only CN ${name}. Please add your full Distinguished Name (DN) to publisherNames configuration`);
                            match = true;
                        }
                        if (match) {
                            resolve(null);
                            return;
                        }
                    }
                }
                const result = `publisherNames: ${publisherNames.join(" | ")}, raw info: ` + JSON.stringify(data, (name, value) => (name === "RawData" ? undefined : value), 2);
                logger.warn(`Sign verification failed, installer signed with incorrect certificate: ${result}`);
                resolve(result);
            }
            catch (e) {
                handleError(logger, e, null, reject);
                resolve(null);
                return;
            }
        });
    });
}
function parseOut(out) {
    const data = JSON.parse(out);
    delete data.PrivateKey;
    delete data.IsOSBinary;
    delete data.SignatureType;
    const signerCertificate = data.SignerCertificate;
    if (signerCertificate != null) {
        delete signerCertificate.Archived;
        delete signerCertificate.Extensions;
        delete signerCertificate.Handle;
        delete signerCertificate.HasPrivateKey;
        // duplicates data.SignerCertificate (contains RawData)
        delete signerCertificate.SubjectName;
    }
    return data;
}
function handleError(logger, error, stderr, reject) {
    if (isOldWin6()) {
        logger.warn(`Cannot execute Get-AuthenticodeSignature: ${error || stderr}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
        return;
    }
    try {
        (0, child_process_1.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1000 });
    }
    catch (testError) {
        logger.warn(`Cannot execute ConvertTo-Json: ${testError.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
        return;
    }
    if (error != null) {
        reject(error);
    }
    if (stderr) {
        reject(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${stderr}. Failing signature validation due to unknown stderr.`));
    }
}
function isOldWin6() {
    const winVersion = os.release();
    return winVersion.startsWith("6.") && !winVersion.startsWith("6.3");
}

var hasRequiredNsisUpdater;

function requireNsisUpdater () {
	if (hasRequiredNsisUpdater) return NsisUpdater;
	hasRequiredNsisUpdater = 1;
	Object.defineProperty(NsisUpdater, "__esModule", { value: true });
	NsisUpdater.NsisUpdater = void 0;
	const builder_util_runtime_1 = out;
	const path = require$$1$4;
	const BaseUpdater_1 = requireBaseUpdater();
	const FileWithEmbeddedBlockMapDifferentialDownloader_1 = FileWithEmbeddedBlockMapDifferentialDownloader$1;
	const main_1 = requireMain();
	const Provider_1 = Provider$1;
	const fs_extra_1 = lib;
	const windowsExecutableCodeSignatureVerifier_1 = windowsExecutableCodeSignatureVerifier;
	const url_1 = require$$4;
	let NsisUpdater$1 = class NsisUpdater extends BaseUpdater_1.BaseUpdater {
	    constructor(options, app) {
	        super(options, app);
	        this._verifyUpdateCodeSignature = (publisherNames, unescapedTempUpdateFile) => (0, windowsExecutableCodeSignatureVerifier_1.verifySignature)(publisherNames, unescapedTempUpdateFile, this._logger);
	    }
	    /**
	     * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
	     * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
	     */
	    get verifyUpdateCodeSignature() {
	        return this._verifyUpdateCodeSignature;
	    }
	    set verifyUpdateCodeSignature(value) {
	        if (value) {
	            this._verifyUpdateCodeSignature = value;
	        }
	    }
	    /*** @private */
	    doDownloadUpdate(downloadUpdateOptions) {
	        const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
	        const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "exe");
	        return this.executeDownload({
	            fileExtension: "exe",
	            downloadUpdateOptions,
	            fileInfo,
	            task: async (destinationFile, downloadOptions, packageFile, removeTempDirIfAny) => {
	                const packageInfo = fileInfo.packageInfo;
	                const isWebInstaller = packageInfo != null && packageFile != null;
	                if (isWebInstaller && downloadUpdateOptions.disableWebInstaller) {
	                    throw (0, builder_util_runtime_1.newError)(`Unable to download new version ${downloadUpdateOptions.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
	                }
	                if (!isWebInstaller && !downloadUpdateOptions.disableWebInstaller) {
	                    this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version.");
	                }
	                if (isWebInstaller ||
	                    downloadUpdateOptions.disableDifferentialDownload ||
	                    (await this.differentialDownloadInstaller(fileInfo, downloadUpdateOptions, destinationFile, provider, builder_util_runtime_1.CURRENT_APP_INSTALLER_FILE_NAME))) {
	                    await this.httpExecutor.download(fileInfo.url, destinationFile, downloadOptions);
	                }
	                const signatureVerificationStatus = await this.verifySignature(destinationFile);
	                if (signatureVerificationStatus != null) {
	                    await removeTempDirIfAny();
	                    // noinspection ThrowInsideFinallyBlockJS
	                    throw (0, builder_util_runtime_1.newError)(`New version ${downloadUpdateOptions.updateInfoAndProvider.info.version} is not signed by the application owner: ${signatureVerificationStatus}`, "ERR_UPDATER_INVALID_SIGNATURE");
	                }
	                if (isWebInstaller) {
	                    if (await this.differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packageFile, provider)) {
	                        try {
	                            await this.httpExecutor.download(new url_1.URL(packageInfo.path), packageFile, {
	                                headers: downloadUpdateOptions.requestHeaders,
	                                cancellationToken: downloadUpdateOptions.cancellationToken,
	                                sha512: packageInfo.sha512,
	                            });
	                        }
	                        catch (e) {
	                            try {
	                                await (0, fs_extra_1.unlink)(packageFile);
	                            }
	                            catch (ignored) {
	                                // ignore
	                            }
	                            throw e;
	                        }
	                    }
	                }
	            },
	        });
	    }
	    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
	    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
	    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
	    async verifySignature(tempUpdateFile) {
	        let publisherName;
	        try {
	            publisherName = (await this.configOnDisk.value).publisherName;
	            if (publisherName == null) {
	                return null;
	            }
	        }
	        catch (e) {
	            if (e.code === "ENOENT") {
	                // no app-update.yml
	                return null;
	            }
	            throw e;
	        }
	        return await this._verifyUpdateCodeSignature(Array.isArray(publisherName) ? publisherName : [publisherName], tempUpdateFile);
	    }
	    doInstall(options) {
	        const args = ["--updated"];
	        if (options.isSilent) {
	            args.push("/S");
	        }
	        if (options.isForceRunAfter) {
	            args.push("--force-run");
	        }
	        if (this.installDirectory) {
	            // maybe check if folder exists
	            args.push(`/D=${this.installDirectory}`);
	        }
	        const packagePath = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
	        if (packagePath != null) {
	            // only = form is supported
	            args.push(`--package-file=${packagePath}`);
	        }
	        const callUsingElevation = () => {
	            this.spawnLog(path.join(process.resourcesPath, "elevate.exe"), [options.installerPath].concat(args)).catch(e => this.dispatchError(e));
	        };
	        if (options.isAdminRightsRequired) {
	            this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe");
	            callUsingElevation();
	            return true;
	        }
	        this.spawnLog(options.installerPath, args).catch((e) => {
	            // https://github.com/electron-userland/electron-builder/issues/1129
	            // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
	            const errorCode = e.code;
	            this._logger.info(`Cannot run installer: error code: ${errorCode}, error message: "${e.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`);
	            if (errorCode === "UNKNOWN" || errorCode === "EACCES") {
	                callUsingElevation();
	            }
	            else if (errorCode === "ENOENT") {
	                require$$1$5
	                    .shell.openPath(options.installerPath)
	                    .catch((err) => this.dispatchError(err));
	            }
	            else {
	                this.dispatchError(e);
	            }
	        });
	        return true;
	    }
	    async differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packagePath, provider) {
	        if (packageInfo.blockMapSize == null) {
	            return true;
	        }
	        try {
	            const downloadOptions = {
	                newUrl: new url_1.URL(packageInfo.path),
	                oldFile: path.join(this.downloadedUpdateHelper.cacheDir, builder_util_runtime_1.CURRENT_APP_PACKAGE_FILE_NAME),
	                logger: this._logger,
	                newFile: packagePath,
	                requestHeaders: this.requestHeaders,
	                isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
	                cancellationToken: downloadUpdateOptions.cancellationToken,
	            };
	            if (this.listenerCount(main_1.DOWNLOAD_PROGRESS) > 0) {
	                downloadOptions.onProgress = it => this.emit(main_1.DOWNLOAD_PROGRESS, it);
	            }
	            await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(packageInfo, this.httpExecutor, downloadOptions).download();
	        }
	        catch (e) {
	            this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
	            // during test (developer machine mac or linux) we must throw error
	            return process.platform === "win32";
	        }
	        return false;
	    }
	};
	NsisUpdater.NsisUpdater = NsisUpdater$1;
	
	return NsisUpdater;
}

var hasRequiredMain;

function requireMain () {
	if (hasRequiredMain) return main$2;
	hasRequiredMain = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.UpdaterSignal = exports.UPDATE_DOWNLOADED = exports.DOWNLOAD_PROGRESS = exports.NsisUpdater = exports.MacUpdater = exports.RpmUpdater = exports.DebUpdater = exports.AppImageUpdater = exports.Provider = exports.CancellationToken = exports.NoOpLogger = exports.AppUpdater = exports.BaseUpdater = void 0;
		const builder_util_runtime_1 = out;
		Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function () { return builder_util_runtime_1.CancellationToken; } });
		const fs_extra_1 = lib;
		const path = require$$1$4;
		var BaseUpdater_1 = requireBaseUpdater();
		Object.defineProperty(exports, "BaseUpdater", { enumerable: true, get: function () { return BaseUpdater_1.BaseUpdater; } });
		var AppUpdater_1 = requireAppUpdater();
		Object.defineProperty(exports, "AppUpdater", { enumerable: true, get: function () { return AppUpdater_1.AppUpdater; } });
		Object.defineProperty(exports, "NoOpLogger", { enumerable: true, get: function () { return AppUpdater_1.NoOpLogger; } });
		var Provider_1 = Provider$1;
		Object.defineProperty(exports, "Provider", { enumerable: true, get: function () { return Provider_1.Provider; } });
		var AppImageUpdater_1 = requireAppImageUpdater();
		Object.defineProperty(exports, "AppImageUpdater", { enumerable: true, get: function () { return AppImageUpdater_1.AppImageUpdater; } });
		var DebUpdater_1 = requireDebUpdater();
		Object.defineProperty(exports, "DebUpdater", { enumerable: true, get: function () { return DebUpdater_1.DebUpdater; } });
		var RpmUpdater_1 = requireRpmUpdater();
		Object.defineProperty(exports, "RpmUpdater", { enumerable: true, get: function () { return RpmUpdater_1.RpmUpdater; } });
		var MacUpdater_1 = requireMacUpdater();
		Object.defineProperty(exports, "MacUpdater", { enumerable: true, get: function () { return MacUpdater_1.MacUpdater; } });
		var NsisUpdater_1 = requireNsisUpdater();
		Object.defineProperty(exports, "NsisUpdater", { enumerable: true, get: function () { return NsisUpdater_1.NsisUpdater; } });
		// autoUpdater to mimic electron bundled autoUpdater
		let _autoUpdater;
		function doLoadAutoUpdater() {
		    // tslint:disable:prefer-conditional-expression
		    if (process.platform === "win32") {
		        _autoUpdater = new (requireNsisUpdater().NsisUpdater)();
		    }
		    else if (process.platform === "darwin") {
		        _autoUpdater = new (requireMacUpdater().MacUpdater)();
		    }
		    else {
		        _autoUpdater = new (requireAppImageUpdater().AppImageUpdater)();
		        try {
		            const identity = path.join(process.resourcesPath, "package-type");
		            if (!(0, fs_extra_1.existsSync)(identity)) {
		                return _autoUpdater;
		            }
		            console.info("Checking for beta autoupdate feature for deb/rpm distributions");
		            const fileType = (0, fs_extra_1.readFileSync)(identity).toString().trim();
		            console.info("Found package-type:", fileType);
		            switch (fileType) {
		                case "deb":
		                    _autoUpdater = new (requireDebUpdater().DebUpdater)();
		                    break;
		                case "rpm":
		                    _autoUpdater = new (requireRpmUpdater().RpmUpdater)();
		                    break;
		                default:
		                    break;
		            }
		        }
		        catch (error) {
		            console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", error.message);
		        }
		    }
		    return _autoUpdater;
		}
		Object.defineProperty(exports, "autoUpdater", {
		    enumerable: true,
		    get: () => {
		        return _autoUpdater || doLoadAutoUpdater();
		    },
		});
		exports.DOWNLOAD_PROGRESS = "download-progress";
		exports.UPDATE_DOWNLOADED = "update-downloaded";
		class UpdaterSignal {
		    constructor(emitter) {
		        this.emitter = emitter;
		    }
		    /**
		     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
		     */
		    login(handler) {
		        addHandler(this.emitter, "login", handler);
		    }
		    progress(handler) {
		        addHandler(this.emitter, exports.DOWNLOAD_PROGRESS, handler);
		    }
		    updateDownloaded(handler) {
		        addHandler(this.emitter, exports.UPDATE_DOWNLOADED, handler);
		    }
		    updateCancelled(handler) {
		        addHandler(this.emitter, "update-cancelled", handler);
		    }
		}
		exports.UpdaterSignal = UpdaterSignal;
		function addHandler(emitter, event, handler) {
		    {
		        emitter.on(event, handler);
		    }
		}
		
	} (main$2));
	return main$2;
}

var mainExports = requireMain();
var main = /*@__PURE__*/getDefaultExportFromCjs(mainExports);

export { main as default };
