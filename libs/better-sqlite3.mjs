import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import require$$0 from 'fs';
import require$$1 from 'path';
import require$$2 from 'util';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var lib = {exports: {}};

var util$1 = {};

util$1.getBooleanOption = (options, key) => {
	let value = false;
	if (key in options && typeof (value = options[key]) !== 'boolean') {
		throw new TypeError(`Expected the "${key}" option to be a boolean`);
	}
	return value;
};

util$1.cppdb = Symbol();
util$1.inspect = Symbol.for('nodejs.util.inspect.custom');

const descriptor = { value: 'SqliteError', writable: true, enumerable: false, configurable: true };

function SqliteError$2(message, code) {
	if (new.target !== SqliteError$2) {
		return new SqliteError$2(message, code);
	}
	if (typeof code !== 'string') {
		throw new TypeError('Expected second argument to be a string');
	}
	Error.call(this, message);
	descriptor.value = '' + message;
	Object.defineProperty(this, 'message', descriptor);
	Error.captureStackTrace(this, SqliteError$2);
	this.code = code;
}
Object.setPrototypeOf(SqliteError$2, Error);
Object.setPrototypeOf(SqliteError$2.prototype, Error.prototype);
Object.defineProperty(SqliteError$2.prototype, 'name', descriptor);
var sqliteError = SqliteError$2;

var bindings = {exports: {}};

var fileUriToPath_1;
var hasRequiredFileUriToPath;

function requireFileUriToPath () {
	if (hasRequiredFileUriToPath) return fileUriToPath_1;
	hasRequiredFileUriToPath = 1;
	/**
	 * Module dependencies.
	 */

	var sep = require$$1.sep || '/';

	/**
	 * Module exports.
	 */

	fileUriToPath_1 = fileUriToPath;

	/**
	 * File URI to Path function.
	 *
	 * @param {String} uri
	 * @return {String} path
	 * @api public
	 */

	function fileUriToPath (uri) {
	  if ('string' != typeof uri ||
	      uri.length <= 7 ||
	      'file://' != uri.substring(0, 7)) {
	    throw new TypeError('must pass in a file:// URI to convert to a file path');
	  }

	  var rest = decodeURI(uri.substring(7));
	  var firstSlash = rest.indexOf('/');
	  var host = rest.substring(0, firstSlash);
	  var path = rest.substring(firstSlash + 1);

	  // 2.  Scheme Definition
	  // As a special case, <host> can be the string "localhost" or the empty
	  // string; this is interpreted as "the machine from which the URL is
	  // being interpreted".
	  if ('localhost' == host) host = '';

	  if (host) {
	    host = sep + sep + host;
	  }

	  // 3.2  Drives, drive letters, mount points, file system root
	  // Drive letters are mapped into the top of a file URI in various ways,
	  // depending on the implementation; some applications substitute
	  // vertical bar ("|") for the colon after the drive letter, yielding
	  // "file:///c|/tmp/test.txt".  In some cases, the colon is left
	  // unchanged, as in "file:///c:/tmp/test.txt".  In other cases, the
	  // colon is simply omitted, as in "file:///c/tmp/test.txt".
	  path = path.replace(/^(.+)\|/, '$1:');

	  // for Windows, we need to invert the path separators from what a URI uses
	  if (sep == '\\') {
	    path = path.replace(/\//g, '\\');
	  }

	  if (/^.+\:/.test(path)) ; else {
	    // unix path…
	    path = sep + path;
	  }

	  return host + path;
	}
	return fileUriToPath_1;
}

/**
 * Module dependencies.
 */

var hasRequiredBindings;

function requireBindings () {
	if (hasRequiredBindings) return bindings.exports;
	hasRequiredBindings = 1;
	(function (module, exports) {
		var fs = require$$0,
		  path = require$$1,
		  fileURLToPath = requireFileUriToPath(),
		  join = path.join,
		  dirname = path.dirname,
		  exists =
		    (fs.accessSync &&
		      function(path) {
		        try {
		          fs.accessSync(path);
		        } catch (e) {
		          return false;
		        }
		        return true;
		      }) ||
		    fs.existsSync ||
		    path.existsSync,
		  defaults = {
		    arrow: process.env.NODE_BINDINGS_ARROW || ' → ',
		    compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled',
		    platform: process.platform,
		    arch: process.arch,
		    nodePreGyp:
		      'node-v' +
		      process.versions.modules +
		      '-' +
		      process.platform +
		      '-' +
		      process.arch,
		    version: process.versions.node,
		    bindings: 'bindings.node',
		    try: [
		      // node-gyp's linked version in the "build" dir
		      ['module_root', 'build', 'bindings'],
		      // node-waf and gyp_addon (a.k.a node-gyp)
		      ['module_root', 'build', 'Debug', 'bindings'],
		      ['module_root', 'build', 'Release', 'bindings'],
		      // Debug files, for development (legacy behavior, remove for node v0.9)
		      ['module_root', 'out', 'Debug', 'bindings'],
		      ['module_root', 'Debug', 'bindings'],
		      // Release files, but manually compiled (legacy behavior, remove for node v0.9)
		      ['module_root', 'out', 'Release', 'bindings'],
		      ['module_root', 'Release', 'bindings'],
		      // Legacy from node-waf, node <= 0.4.x
		      ['module_root', 'build', 'default', 'bindings'],
		      // Production "Release" buildtype binary (meh...)
		      ['module_root', 'compiled', 'version', 'platform', 'arch', 'bindings'],
		      // node-qbs builds
		      ['module_root', 'addon-build', 'release', 'install-root', 'bindings'],
		      ['module_root', 'addon-build', 'debug', 'install-root', 'bindings'],
		      ['module_root', 'addon-build', 'default', 'install-root', 'bindings'],
		      // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
		      ['module_root', 'lib', 'binding', 'nodePreGyp', 'bindings']
		    ]
		  };

		/**
		 * The main `bindings()` function loads the compiled bindings for a given module.
		 * It uses V8's Error API to determine the parent filename that this function is
		 * being invoked from, which is then used to find the root directory.
		 */

		function bindings(opts) {
		  // Argument surgery
		  if (typeof opts == 'string') {
		    opts = { bindings: opts };
		  } else if (!opts) {
		    opts = {};
		  }

		  // maps `defaults` onto `opts` object
		  Object.keys(defaults).map(function(i) {
		    if (!(i in opts)) opts[i] = defaults[i];
		  });

		  // Get the module root
		  if (!opts.module_root) {
		    opts.module_root = exports.getRoot(exports.getFileName());
		  }

		  // Ensure the given bindings name ends with .node
		  if (path.extname(opts.bindings) != '.node') {
		    opts.bindings += '.node';
		  }

		  // https://github.com/webpack/webpack/issues/4175#issuecomment-342931035
		  var requireFunc =
		    typeof __webpack_require__ === 'function'
		      ? __non_webpack_require__
		      : require;

		  var tries = [],
		    i = 0,
		    l = opts.try.length,
		    n,
		    b,
		    err;

		  for (; i < l; i++) {
		    n = join.apply(
		      null,
		      opts.try[i].map(function(p) {
		        return opts[p] || p;
		      })
		    );
		    tries.push(n);
		    try {
		      b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
		      if (!opts.path) {
		        b.path = n;
		      }
		      return b;
		    } catch (e) {
		      if (e.code !== 'MODULE_NOT_FOUND' &&
		          e.code !== 'QUALIFIED_PATH_RESOLUTION_FAILED' &&
		          !/not find/i.test(e.message)) {
		        throw e;
		      }
		    }
		  }

		  err = new Error(
		    'Could not locate the bindings file. Tried:\n' +
		      tries
		        .map(function(a) {
		          return opts.arrow + a;
		        })
		        .join('\n')
		  );
		  err.tries = tries;
		  throw err;
		}
		module.exports = exports = bindings;

		/**
		 * Gets the filename of the JavaScript file that invokes this function.
		 * Used to help find the root directory of a module.
		 * Optionally accepts an filename argument to skip when searching for the invoking filename
		 */

		exports.getFileName = function getFileName(calling_file) {
		  var origPST = Error.prepareStackTrace,
		    origSTL = Error.stackTraceLimit,
		    dummy = {},
		    fileName;

		  Error.stackTraceLimit = 10;

		  Error.prepareStackTrace = function(e, st) {
		    for (var i = 0, l = st.length; i < l; i++) {
		      fileName = st[i].getFileName();
		      if (fileName !== __filename) {
		        if (calling_file) {
		          if (fileName !== calling_file) {
		            return;
		          }
		        } else {
		          return;
		        }
		      }
		    }
		  };

		  // run the 'prepareStackTrace' function above
		  Error.captureStackTrace(dummy);
		  dummy.stack;

		  // cleanup
		  Error.prepareStackTrace = origPST;
		  Error.stackTraceLimit = origSTL;

		  // handle filename that starts with "file://"
		  var fileSchema = 'file://';
		  if (fileName.indexOf(fileSchema) === 0) {
		    fileName = fileURLToPath(fileName);
		  }

		  return fileName;
		};

		/**
		 * Gets the root directory of a module, given an arbitrary filename
		 * somewhere in the module tree. The "root directory" is the directory
		 * containing the `package.json` file.
		 *
		 *   In:  /home/nate/node-native-module/lib/index.js
		 *   Out: /home/nate/node-native-module
		 */

		exports.getRoot = function getRoot(file) {
		  var dir = dirname(file),
		    prev;
		  while (true) {
		    if (dir === '.') {
		      // Avoids an infinite loop in rare cases, like the REPL
		      dir = process.cwd();
		    }
		    if (
		      exists(join(dir, 'package.json')) ||
		      exists(join(dir, 'node_modules'))
		    ) {
		      // Found the 'package.json' file or 'node_modules' dir; we're done
		      return dir;
		    }
		    if (prev === dir) {
		      // Got to the top
		      throw new Error(
		        'Could not find module root given file: "' +
		          file +
		          '". Do you have a `package.json` file? '
		      );
		    }
		    // Try the parent dir next
		    prev = dir;
		    dir = join(dir, '..');
		  }
		}; 
	} (bindings, bindings.exports));
	return bindings.exports;
}

var wrappers$1 = {};

var hasRequiredWrappers;

function requireWrappers () {
	if (hasRequiredWrappers) return wrappers$1;
	hasRequiredWrappers = 1;
	const { cppdb } = util$1;

	wrappers$1.prepare = function prepare(sql) {
		return this[cppdb].prepare(sql, this, false);
	};

	wrappers$1.exec = function exec(sql) {
		this[cppdb].exec(sql);
		return this;
	};

	wrappers$1.close = function close() {
		this[cppdb].close();
		return this;
	};

	wrappers$1.loadExtension = function loadExtension(...args) {
		this[cppdb].loadExtension(...args);
		return this;
	};

	wrappers$1.defaultSafeIntegers = function defaultSafeIntegers(...args) {
		this[cppdb].defaultSafeIntegers(...args);
		return this;
	};

	wrappers$1.unsafeMode = function unsafeMode(...args) {
		this[cppdb].unsafeMode(...args);
		return this;
	};

	wrappers$1.signalTokenize = function signalTokenize(...args) {
		return this[cppdb].signalTokenize(...args);
	};

	wrappers$1.getters = {
		name: {
			get: function name() { return this[cppdb].name; },
			enumerable: true,
		},
		open: {
			get: function open() { return this[cppdb].open; },
			enumerable: true,
		},
		inTransaction: {
			get: function inTransaction() { return this[cppdb].inTransaction; },
			enumerable: true,
		},
		readonly: {
			get: function readonly() { return this[cppdb].readonly; },
			enumerable: true,
		},
		memory: {
			get: function memory() { return this[cppdb].memory; },
			enumerable: true,
		},
	};
	return wrappers$1;
}

var transaction;
var hasRequiredTransaction;

function requireTransaction () {
	if (hasRequiredTransaction) return transaction;
	hasRequiredTransaction = 1;
	const { cppdb } = util$1;
	const controllers = new WeakMap();

	transaction = function transaction(fn) {
		if (typeof fn !== 'function') throw new TypeError('Expected first argument to be a function');

		const db = this[cppdb];
		const controller = getController(db, this);
		const { apply } = Function.prototype;

		// Each version of the transaction function has these same properties
		const properties = {
			default: { value: wrapTransaction(apply, fn, db, controller.default) },
			deferred: { value: wrapTransaction(apply, fn, db, controller.deferred) },
			immediate: { value: wrapTransaction(apply, fn, db, controller.immediate) },
			exclusive: { value: wrapTransaction(apply, fn, db, controller.exclusive) },
			database: { value: this, enumerable: true },
		};

		Object.defineProperties(properties.default.value, properties);
		Object.defineProperties(properties.deferred.value, properties);
		Object.defineProperties(properties.immediate.value, properties);
		Object.defineProperties(properties.exclusive.value, properties);

		// Return the default version of the transaction function
		return properties.default.value;
	};

	// Return the database's cached transaction controller, or create a new one
	const getController = (db, self) => {
		let controller = controllers.get(db);
		if (!controller) {
			const shared = {
				commit: db.prepare('COMMIT', self, false),
				rollback: db.prepare('ROLLBACK', self, false),
				savepoint: db.prepare('SAVEPOINT `\t_bs3.\t`', self, false),
				release: db.prepare('RELEASE `\t_bs3.\t`', self, false),
				rollbackTo: db.prepare('ROLLBACK TO `\t_bs3.\t`', self, false),
			};
			controllers.set(db, controller = {
				default: Object.assign({ begin: db.prepare('BEGIN', self, false) }, shared),
				deferred: Object.assign({ begin: db.prepare('BEGIN DEFERRED', self, false) }, shared),
				immediate: Object.assign({ begin: db.prepare('BEGIN IMMEDIATE', self, false) }, shared),
				exclusive: Object.assign({ begin: db.prepare('BEGIN EXCLUSIVE', self, false) }, shared),
			});
		}
		return controller;
	};

	// Return a new transaction function by wrapping the given function
	const wrapTransaction = (apply, fn, db, { begin, commit, rollback, savepoint, release, rollbackTo }) => function sqliteTransaction() {
		let before, after, undo;
		if (db.inTransaction) {
			before = savepoint;
			after = release;
			undo = rollbackTo;
		} else {
			before = begin;
			after = commit;
			undo = rollback;
		}
		before.run();
		try {
			const result = apply.call(fn, this, arguments);
			after.run();
			return result;
		} catch (ex) {
			if (db.inTransaction) {
				undo.run();
				if (undo !== rollback) after.run();
			}
			throw ex;
		}
	};
	return transaction;
}

var pragma;
var hasRequiredPragma;

function requirePragma () {
	if (hasRequiredPragma) return pragma;
	hasRequiredPragma = 1;
	const { getBooleanOption, cppdb } = util$1;

	pragma = function pragma(source, options) {
		if (options == null) options = {};
		if (typeof source !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
		const simple = getBooleanOption(options, 'simple');

		const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true);
		return simple ? stmt.pluck().get() : stmt.all();
	};
	return pragma;
}

var backup;
var hasRequiredBackup;

function requireBackup () {
	if (hasRequiredBackup) return backup;
	hasRequiredBackup = 1;
	const fs = require$$0;
	const path = require$$1;
	const { promisify } = require$$2;
	const { cppdb } = util$1;
	const fsAccess = promisify(fs.access);

	backup = async function backup(filename, options) {
		if (options == null) options = {};

		// Validate arguments
		if (typeof filename !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');

		// Interpret options
		filename = filename.trim();
		const attachedName = 'attached' in options ? options.attached : 'main';
		const handler = 'progress' in options ? options.progress : null;

		// Validate interpreted options
		if (!filename) throw new TypeError('Backup filename cannot be an empty string');
		if (filename === ':memory:') throw new TypeError('Invalid backup filename ":memory:"');
		if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
		if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
		if (handler != null && typeof handler !== 'function') throw new TypeError('Expected the "progress" option to be a function');

		// Make sure the specified directory exists
		await fsAccess(path.dirname(filename)).catch(() => {
			throw new TypeError('Cannot save backup because the directory does not exist');
		});

		const isNewFile = await fsAccess(filename).then(() => false, () => true);
		return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
	};

	const runBackup = (backup, handler) => {
		let rate = 0;
		let useDefault = true;

		return new Promise((resolve, reject) => {
			setImmediate(function step() {
				try {
					const progress = backup.transfer(rate);
					if (!progress.remainingPages) {
						backup.close();
						resolve(progress);
						return;
					}
					if (useDefault) {
						useDefault = false;
						rate = 100;
					}
					if (handler) {
						const ret = handler(progress);
						if (ret !== undefined) {
							if (typeof ret === 'number' && ret === ret) rate = Math.max(0, Math.min(0x7fffffff, Math.round(ret)));
							else throw new TypeError('Expected progress callback to return a number or undefined');
						}
					}
					setImmediate(step);
				} catch (err) {
					backup.close();
					reject(err);
				}
			});
		});
	};
	return backup;
}

var serialize;
var hasRequiredSerialize;

function requireSerialize () {
	if (hasRequiredSerialize) return serialize;
	hasRequiredSerialize = 1;
	const { cppdb } = util$1;

	serialize = function serialize(options) {
		if (options == null) options = {};

		// Validate arguments
		if (typeof options !== 'object') throw new TypeError('Expected first argument to be an options object');

		// Interpret and validate options
		const attachedName = 'attached' in options ? options.attached : 'main';
		if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
		if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');

		return this[cppdb].serialize(attachedName);
	};
	return serialize;
}

var _function;
var hasRequired_function;

function require_function () {
	if (hasRequired_function) return _function;
	hasRequired_function = 1;
	const { getBooleanOption, cppdb } = util$1;

	_function = function defineFunction(name, options, fn) {
		// Apply defaults
		if (options == null) options = {};
		if (typeof options === 'function') { fn = options; options = {}; }

		// Validate arguments
		if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof fn !== 'function') throw new TypeError('Expected last argument to be a function');
		if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
		if (!name) throw new TypeError('User-defined function name cannot be an empty string');

		// Interpret options
		const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
		const deterministic = getBooleanOption(options, 'deterministic');
		const directOnly = getBooleanOption(options, 'directOnly');
		const varargs = getBooleanOption(options, 'varargs');
		let argCount = -1;

		// Determine argument count
		if (!varargs) {
			argCount = fn.length;
			if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError('Expected function.length to be a positive integer');
			if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
		}

		this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
		return this;
	};
	return _function;
}

var aggregate;
var hasRequiredAggregate;

function requireAggregate () {
	if (hasRequiredAggregate) return aggregate;
	hasRequiredAggregate = 1;
	const { getBooleanOption, cppdb } = util$1;

	aggregate = function defineAggregate(name, options) {
		// Validate arguments
		if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof options !== 'object' || options === null) throw new TypeError('Expected second argument to be an options object');
		if (!name) throw new TypeError('User-defined function name cannot be an empty string');

		// Interpret options
		const start = 'start' in options ? options.start : null;
		const step = getFunctionOption(options, 'step', true);
		const inverse = getFunctionOption(options, 'inverse', false);
		const result = getFunctionOption(options, 'result', false);
		const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
		const deterministic = getBooleanOption(options, 'deterministic');
		const directOnly = getBooleanOption(options, 'directOnly');
		const varargs = getBooleanOption(options, 'varargs');
		let argCount = -1;

		// Determine argument count
		if (!varargs) {
			argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
			if (argCount > 0) argCount -= 1;
			if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
		}

		this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
		return this;
	};

	const getFunctionOption = (options, key, required) => {
		const value = key in options ? options[key] : null;
		if (typeof value === 'function') return value;
		if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
		if (required) throw new TypeError(`Missing required option "${key}"`);
		return null;
	};

	const getLength = ({ length }) => {
		if (Number.isInteger(length) && length >= 0) return length;
		throw new TypeError('Expected function.length to be a positive integer');
	};
	return aggregate;
}

var table;
var hasRequiredTable;

function requireTable () {
	if (hasRequiredTable) return table;
	hasRequiredTable = 1;
	const { cppdb } = util$1;

	table = function defineTable(name, factory) {
		// Validate arguments
		if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
		if (!name) throw new TypeError('Virtual table module name cannot be an empty string');

		// Determine whether the module is eponymous-only or not
		let eponymous = false;
		if (typeof factory === 'object' && factory !== null) {
			eponymous = true;
			factory = defer(parseTableDefinition(factory, 'used', name));
		} else {
			if (typeof factory !== 'function') throw new TypeError('Expected second argument to be a function or a table definition object');
			factory = wrapFactory(factory);
		}

		this[cppdb].table(factory, name, eponymous);
		return this;
	};

	function wrapFactory(factory) {
		return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
			const thisObject = {
				module: moduleName,
				database: databaseName,
				table: tableName,
			};

			// Generate a new table definition by invoking the factory
			const def = apply.call(factory, thisObject, args);
			if (typeof def !== 'object' || def === null) {
				throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
			}

			return parseTableDefinition(def, 'returned', moduleName);
		};
	}

	function parseTableDefinition(def, verb, moduleName) {
		// Validate required properties
		if (!hasOwnProperty.call(def, 'rows')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
		}
		if (!hasOwnProperty.call(def, 'columns')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
		}

		// Validate "rows" property
		const rows = def.rows;
		if (typeof rows !== 'function' || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
		}

		// Validate "columns" property
		let columns = def.columns;
		if (!Array.isArray(columns) || !(columns = [...columns]).every(x => typeof x === 'string')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
		}
		if (columns.length !== new Set(columns).size) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
		}
		if (!columns.length) {
			throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
		}

		// Validate "parameters" property
		let parameters;
		if (hasOwnProperty.call(def, 'parameters')) {
			parameters = def.parameters;
			if (!Array.isArray(parameters) || !(parameters = [...parameters]).every(x => typeof x === 'string')) {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
			}
		} else {
			parameters = inferParameters(rows);
		}
		if (parameters.length !== new Set(parameters).size) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
		}
		if (parameters.length > 32) {
			throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
		}
		for (const parameter of parameters) {
			if (columns.includes(parameter)) {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
			}
		}

		// Validate "safeIntegers" option
		let safeIntegers = 2;
		if (hasOwnProperty.call(def, 'safeIntegers')) {
			const bool = def.safeIntegers;
			if (typeof bool !== 'boolean') {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
			}
			safeIntegers = +bool;
		}

		// Validate "directOnly" option
		let directOnly = false;
		if (hasOwnProperty.call(def, 'directOnly')) {
			directOnly = def.directOnly;
			if (typeof directOnly !== 'boolean') {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
			}
		}

		// Generate SQL for the virtual table definition
		const columnDefinitions = [
			...parameters.map(identifier).map(str => `${str} HIDDEN`),
			...columns.map(identifier),
		];
		return [
			`CREATE TABLE x(${columnDefinitions.join(', ')});`,
			wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName),
			parameters,
			safeIntegers,
			directOnly,
		];
	}

	function wrapGenerator(generator, columnMap, moduleName) {
		return function* virtualTable(...args) {
			/*
				We must defensively clone any buffers in the arguments, because
				otherwise the generator could mutate one of them, which would cause
				us to return incorrect values for hidden columns, potentially
				corrupting the database.
			 */
			const output = args.map(x => Buffer.isBuffer(x) ? Buffer.from(x) : x);
			for (let i = 0; i < columnMap.size; ++i) {
				output.push(null); // Fill with nulls to prevent gaps in array (v8 optimization)
			}
			for (const row of generator(...args)) {
				if (Array.isArray(row)) {
					extractRowArray(row, output, columnMap.size, moduleName);
					yield output;
				} else if (typeof row === 'object' && row !== null) {
					extractRowObject(row, output, columnMap, moduleName);
					yield output;
				} else {
					throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
				}
			}
		};
	}

	function extractRowArray(row, output, columnCount, moduleName) {
		if (row.length !== columnCount) {
			throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
		}
		const offset = output.length - columnCount;
		for (let i = 0; i < columnCount; ++i) {
			output[i + offset] = row[i];
		}
	}

	function extractRowObject(row, output, columnMap, moduleName) {
		let count = 0;
		for (const key of Object.keys(row)) {
			const index = columnMap.get(key);
			if (index === undefined) {
				throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
			}
			output[index] = row[key];
			count += 1;
		}
		if (count !== columnMap.size) {
			throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
		}
	}

	function inferParameters({ length }) {
		if (!Number.isInteger(length) || length < 0) {
			throw new TypeError('Expected function.length to be a positive integer');
		}
		const params = [];
		for (let i = 0; i < length; ++i) {
			params.push(`$${i + 1}`);
		}
		return params;
	}

	const { hasOwnProperty } = Object.prototype;
	const { apply } = Function.prototype;
	const GeneratorFunctionPrototype = Object.getPrototypeOf(function*(){});
	const identifier = str => `"${str.replace(/"/g, '""')}"`;
	const defer = x => () => x;
	return table;
}

var createFTS5Tokenizer;
var hasRequiredCreateFTS5Tokenizer;

function requireCreateFTS5Tokenizer () {
	if (hasRequiredCreateFTS5Tokenizer) return createFTS5Tokenizer;
	hasRequiredCreateFTS5Tokenizer = 1;
	const { cppdb } = util$1;

	createFTS5Tokenizer = function createFTS5Tokenizer(name, factory) {
		// Validate arguments
		if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
		if (!name) throw new TypeError('Virtual table module name cannot be an empty string');
		if (typeof factory !== 'function') throw new TypeError('Expected second argument to be a constructor');

		this[cppdb].createFTS5Tokenizer(name, function create(params) {
			const instance = new factory(params);

			function run(str) {
				if (!instance.run) {
					// This will throw in C++
					return;
				}
				return instance.run(str);
			}

			return run;
		});
		return this;
	};
	return createFTS5Tokenizer;
}

var inspect;
var hasRequiredInspect;

function requireInspect () {
	if (hasRequiredInspect) return inspect;
	hasRequiredInspect = 1;
	const DatabaseInspection = function Database() {};

	inspect = function inspect(depth, opts) {
		return Object.assign(new DatabaseInspection(), this);
	};
	return inspect;
}

const fs = require$$0;
const path = require$$1;
const util = util$1;
const SqliteError$1 = sqliteError;

let DEFAULT_ADDON;

function Database(filenameGiven, options) {
	if (new.target == null) {
		return new Database(filenameGiven, options);
	}

	// Apply defaults
	let buffer;
	if (Buffer.isBuffer(filenameGiven)) {
		buffer = filenameGiven;
		filenameGiven = ':memory:';
	}
	if (filenameGiven == null) filenameGiven = '';
	if (options == null) options = {};

	// Validate arguments
	if (typeof filenameGiven !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	if ('readOnly' in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
	if ('memory' in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');

	// Interpret options
	const filename = filenameGiven.trim();
	const anonymous = filename === '' || filename === ':memory:';
	const readonly = util.getBooleanOption(options, 'readonly');
	const fileMustExist = util.getBooleanOption(options, 'fileMustExist');
	const timeout = 'timeout' in options ? options.timeout : 5000;
	const verbose = 'verbose' in options ? options.verbose : null;
	const nativeBindingPath = 'nativeBinding' in options ? options.nativeBinding : null;

	// Validate interpreted options
	if (readonly && anonymous && !buffer) throw new TypeError('In-memory/temporary databases cannot be readonly');
	if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
	if (timeout > 0x7fffffff) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
	if (verbose != null && typeof verbose !== 'function') throw new TypeError('Expected the "verbose" option to be a function');
	if (nativeBindingPath != null && typeof nativeBindingPath !== 'string') throw new TypeError('Expected the "nativeBinding" option to be a string');

	// Load the native addon
	let addon;
	if (nativeBindingPath == null) {
		addon = DEFAULT_ADDON || (DEFAULT_ADDON = requireBindings()('better_sqlite3.node'));
	} else {
		addon = require(nativeBindingPath.replace(/(\.node)?$/, '.node'));
	}
	if (!addon.isInitialized) {
		addon.setErrorConstructor(SqliteError$1);
		addon.setLogHandler(logHandlerWrap);
		addon.isInitialized = true;
	}

	// Make sure the specified directory exists
	if (!anonymous && !fs.existsSync(path.dirname(filename))) {
		throw new TypeError('Cannot open database because the directory does not exist');
	}

	Object.defineProperties(this, {
		[util.cppdb]: {value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null)},
		...wrappers.getters,
	});
}

let logHandler;
function logHandlerWrap(code, warning) {
	if (logHandler) {
		logHandler(code, warning);
	}
}

const wrappers = requireWrappers();
Database.prototype.prepare = wrappers.prepare;
Database.prototype.transaction = requireTransaction();
Database.prototype.pragma = requirePragma();
Database.prototype.backup = requireBackup();
Database.prototype.serialize = requireSerialize();
Database.prototype.function = require_function();
Database.prototype.aggregate = requireAggregate();
Database.prototype.table = requireTable();
Database.prototype.createFTS5Tokenizer = requireCreateFTS5Tokenizer();
Database.prototype.loadExtension = wrappers.loadExtension;
Database.prototype.exec = wrappers.exec;
Database.prototype.close = wrappers.close;
Database.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
Database.prototype.unsafeMode = wrappers.unsafeMode;
Database.prototype.signalTokenize = wrappers.signalTokenize;
Database.prototype[util.inspect] = requireInspect();

// Static
Database.setLogHandler = function setLogHandler(fn) {
	logHandler = fn;
};

var database = Database;

lib.exports = database;
var SqliteError = lib.exports.SqliteError = sqliteError;

var libExports = lib.exports;
var index = /*@__PURE__*/getDefaultExportFromCjs(libExports);

export { SqliteError, index as default };
