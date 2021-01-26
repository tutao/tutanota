import require$$0 from 'fs';
import require$$0$1 from 'buffer';
import crypto from 'crypto';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
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

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);

      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(receiver);
      }

      return desc.value;
    };
  }

  return _get(target, property, receiver || target);
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

function commonjsRequire (target) {
	throw new Error('Could not dynamically require "' + target + '". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.');
}

/* cfb.js (C) 2013-present SheetJS -- http://sheetjs.com */

var cfb = createCommonjsModule(function (module) {
/* vim: set ts=2: */

/*jshint eqnull:true */

/*exported CFB */

/*global module, require:false, process:false, Buffer:false, Uint8Array:false, Uint16Array:false */
var Base64 = function make_b64() {
  var map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  return {
    encode: function (input) {
      var o = "";
      var c1 = 0,
          c2 = 0,
          c3 = 0,
          e1 = 0,
          e2 = 0,
          e3 = 0,
          e4 = 0;

      for (var i = 0; i < input.length;) {
        c1 = input.charCodeAt(i++);
        e1 = c1 >> 2;
        c2 = input.charCodeAt(i++);
        e2 = (c1 & 3) << 4 | c2 >> 4;
        c3 = input.charCodeAt(i++);
        e3 = (c2 & 15) << 2 | c3 >> 6;
        e4 = c3 & 63;

        if (isNaN(c2)) {
          e3 = e4 = 64;
        } else if (isNaN(c3)) {
          e4 = 64;
        }

        o += map.charAt(e1) + map.charAt(e2) + map.charAt(e3) + map.charAt(e4);
      }

      return o;
    },
    decode: function b64_decode(input) {
      var o = "";
      var c1 = 0,
          c2 = 0,
          c3 = 0,
          e1 = 0,
          e2 = 0,
          e3 = 0,
          e4 = 0;
      input = input.replace(/[^\w\+\/\=]/g, "");

      for (var i = 0; i < input.length;) {
        e1 = map.indexOf(input.charAt(i++));
        e2 = map.indexOf(input.charAt(i++));
        c1 = e1 << 2 | e2 >> 4;
        o += String.fromCharCode(c1);
        e3 = map.indexOf(input.charAt(i++));
        c2 = (e2 & 15) << 4 | e3 >> 2;

        if (e3 !== 64) {
          o += String.fromCharCode(c2);
        }

        e4 = map.indexOf(input.charAt(i++));
        c3 = (e3 & 3) << 6 | e4;

        if (e4 !== 64) {
          o += String.fromCharCode(c3);
        }
      }

      return o;
    }
  };
}();

var has_buf = typeof Buffer !== 'undefined' && typeof process !== 'undefined' && typeof process.versions !== 'undefined' && process.versions.node;

var Buffer_from = function () {};

if (typeof Buffer !== 'undefined') {
  var nbfs = !Buffer.from;
  if (!nbfs) try {
    Buffer.from("foo", "utf8");
  } catch (e) {
    nbfs = true;
  }
  Buffer_from = nbfs ? function (buf, enc) {
    return enc ? new Buffer(buf, enc) : new Buffer(buf);
  } : Buffer.from.bind(Buffer); // $FlowIgnore

  if (!Buffer.alloc) Buffer.alloc = function (n) {
    return new Buffer(n);
  }; // $FlowIgnore

  if (!Buffer.allocUnsafe) Buffer.allocUnsafe = function (n) {
    return new Buffer(n);
  };
}

function new_raw_buf(len) {
  /* jshint -W056 */
  return has_buf ? Buffer.alloc(len) : new Array(len);
  /* jshint +W056 */
}

function new_unsafe_buf(len) {
  /* jshint -W056 */
  return has_buf ? Buffer.allocUnsafe(len) : new Array(len);
  /* jshint +W056 */
}

var s2a = function s2a(s) {
  if (has_buf) return Buffer_from(s, "binary");
  return s.split("").map(function (x) {
    return x.charCodeAt(0) & 0xff;
  });
};

var chr0 = /\u0000/g,
    chr1 = /[\u0001-\u0006]/g;

var __toBuffer = function (bufs) {
  var x = [];

  for (var i = 0; i < bufs[0].length; ++i) {
    x.push.apply(x, bufs[0][i]);
  }

  return x;
};

var ___toBuffer = __toBuffer;

var __utf16le = function (b, s, e) {
  var ss = [];

  for (var i = s; i < e; i += 2) ss.push(String.fromCharCode(__readUInt16LE(b, i)));

  return ss.join("").replace(chr0, '');
};

var ___utf16le = __utf16le;

var __hexlify = function (b, s, l) {
  var ss = [];

  for (var i = s; i < s + l; ++i) ss.push(("0" + b[i].toString(16)).slice(-2));

  return ss.join("");
};

var ___hexlify = __hexlify;

var __bconcat = function (bufs) {
  if (Array.isArray(bufs[0])) return [].concat.apply([], bufs);
  var maxlen = 0,
      i = 0;

  for (i = 0; i < bufs.length; ++i) maxlen += bufs[i].length;

  var o = new Uint8Array(maxlen);

  for (i = 0, maxlen = 0; i < bufs.length; maxlen += bufs[i].length, ++i) o.set(bufs[i], maxlen);

  return o;
};

var bconcat = __bconcat;

if (has_buf) {
  __utf16le = function (b, s, e) {
    if (!Buffer.isBuffer(b)) return ___utf16le(b, s, e);
    return b.toString('utf16le', s, e).replace(chr0, '')
    /*.replace(chr1,'!')*/
    ;
  };

  __hexlify = function (b, s, l) {
    return Buffer.isBuffer(b) ? b.toString('hex', s, s + l) : ___hexlify(b, s, l);
  };

  __toBuffer = function (bufs) {
    return bufs[0].length > 0 && Buffer.isBuffer(bufs[0][0]) ? Buffer.concat(bufs[0]) : ___toBuffer(bufs);
  };

  s2a = function (s) {
    return Buffer_from(s, "binary");
  };

  bconcat = function (bufs) {
    return Buffer.isBuffer(bufs[0]) ? Buffer.concat(bufs) : __bconcat(bufs);
  };
}

var __readUInt8 = function (b, idx) {
  return b[idx];
};

var __readUInt16LE = function (b, idx) {
  return b[idx + 1] * (1 << 8) + b[idx];
};

var __readInt16LE = function (b, idx) {
  var u = b[idx + 1] * (1 << 8) + b[idx];
  return u < 0x8000 ? u : (0xffff - u + 1) * -1;
};

var __readUInt32LE = function (b, idx) {
  return b[idx + 3] * (1 << 24) + (b[idx + 2] << 16) + (b[idx + 1] << 8) + b[idx];
};

var __readInt32LE = function (b, idx) {
  return (b[idx + 3] << 24) + (b[idx + 2] << 16) + (b[idx + 1] << 8) + b[idx];
};

function ReadShift(size, t) {
  var oI,
      oS,
      type = 0;

  switch (size) {
    case 1:
      oI = __readUInt8(this, this.l);
      break;

    case 2:
      oI = (t !== 'i' ? __readUInt16LE : __readInt16LE)(this, this.l);
      break;

    case 4:
      oI = __readInt32LE(this, this.l);
      break;

    case 16:
      type = 2;
      oS = __hexlify(this, this.l, size);
  }

  this.l += size;
  if (type === 0) return oI;
  return oS;
}

var __writeUInt32LE = function (b, val, idx) {
  b[idx] = val & 0xFF;
  b[idx + 1] = val >>> 8 & 0xFF;
  b[idx + 2] = val >>> 16 & 0xFF;
  b[idx + 3] = val >>> 24 & 0xFF;
};

var __writeInt32LE = function (b, val, idx) {
  b[idx] = val & 0xFF;
  b[idx + 1] = val >> 8 & 0xFF;
  b[idx + 2] = val >> 16 & 0xFF;
  b[idx + 3] = val >> 24 & 0xFF;
};

function WriteShift(t, val, f) {
  var size = 0,
      i = 0;

  switch (f) {
    case "hex":
      for (; i < t; ++i) {
        this[this.l++] = parseInt(val.slice(2 * i, 2 * i + 2), 16) || 0;
      }

      return this;

    case "utf16le":
      var end = this.l + t;

      for (i = 0; i < Math.min(val.length, t); ++i) {
        var cc = val.charCodeAt(i);
        this[this.l++] = cc & 0xff;
        this[this.l++] = cc >> 8;
      }

      while (this.l < end) this[this.l++] = 0;

      return this;
  }

  switch (t) {
    case 1:
      size = 1;
      this[this.l] = val & 0xFF;
      break;

    case 2:
      size = 2;
      this[this.l] = val & 0xFF;
      val >>>= 8;
      this[this.l + 1] = val & 0xFF;
      break;

    case 4:
      size = 4;

      __writeUInt32LE(this, val, this.l);

      break;

    case -4:
      size = 4;

      __writeInt32LE(this, val, this.l);

      break;
  }

  this.l += size;
  return this;
}

function CheckField(hexstr, fld) {
  var m = __hexlify(this, this.l, hexstr.length >> 1);

  if (m !== hexstr) throw new Error(fld + 'Expected ' + hexstr + ' saw ' + m);
  this.l += hexstr.length >> 1;
}

function prep_blob(blob, pos) {
  blob.l = pos;
  blob.read_shift = ReadShift;
  blob.chk = CheckField;
  blob.write_shift = WriteShift;
}

function new_buf(sz) {
  var o = new_raw_buf(sz);
  prep_blob(o, 0);
  return o;
}
/* crc32.js (C) 2014-present SheetJS -- http://sheetjs.com */

/* vim: set ts=2: */

/*exported CRC32 */


var CRC32;

(function (factory) {
  /*jshint ignore:start */

  /*eslint-disable */
  factory(CRC32 = {});
  /*eslint-enable */

  /*jshint ignore:end */
})(function (CRC32) {
  CRC32.version = '1.2.0';
  /* see perf/crc32table.js */

  /*global Int32Array */

  function signed_crc_table() {
    var c = 0,
        table = new Array(256);

    for (var n = 0; n != 256; ++n) {
      c = n;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
      table[n] = c;
    }

    return typeof Int32Array !== 'undefined' ? new Int32Array(table) : table;
  }

  var T = signed_crc_table();

  function crc32_bstr(bstr, seed) {
    var C = seed ^ -1,
        L = bstr.length - 1;

    for (var i = 0; i < L;) {
      C = C >>> 8 ^ T[(C ^ bstr.charCodeAt(i++)) & 0xFF];
      C = C >>> 8 ^ T[(C ^ bstr.charCodeAt(i++)) & 0xFF];
    }

    if (i === L) C = C >>> 8 ^ T[(C ^ bstr.charCodeAt(i)) & 0xFF];
    return C ^ -1;
  }

  function crc32_buf(buf, seed) {
    if (buf.length > 10000) return crc32_buf_8(buf, seed);
    var C = seed ^ -1,
        L = buf.length - 3;

    for (var i = 0; i < L;) {
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
    }

    while (i < L + 3) C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];

    return C ^ -1;
  }

  function crc32_buf_8(buf, seed) {
    var C = seed ^ -1,
        L = buf.length - 7;

    for (var i = 0; i < L;) {
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
      C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];
    }

    while (i < L + 7) C = C >>> 8 ^ T[(C ^ buf[i++]) & 0xFF];

    return C ^ -1;
  }

  function crc32_str(str, seed) {
    var C = seed ^ -1;

    for (var i = 0, L = str.length, c, d; i < L;) {
      c = str.charCodeAt(i++);

      if (c < 0x80) {
        C = C >>> 8 ^ T[(C ^ c) & 0xFF];
      } else if (c < 0x800) {
        C = C >>> 8 ^ T[(C ^ (192 | c >> 6 & 31)) & 0xFF];
        C = C >>> 8 ^ T[(C ^ (128 | c & 63)) & 0xFF];
      } else if (c >= 0xD800 && c < 0xE000) {
        c = (c & 1023) + 64;
        d = str.charCodeAt(i++) & 1023;
        C = C >>> 8 ^ T[(C ^ (240 | c >> 8 & 7)) & 0xFF];
        C = C >>> 8 ^ T[(C ^ (128 | c >> 2 & 63)) & 0xFF];
        C = C >>> 8 ^ T[(C ^ (128 | d >> 6 & 15 | (c & 3) << 4)) & 0xFF];
        C = C >>> 8 ^ T[(C ^ (128 | d & 63)) & 0xFF];
      } else {
        C = C >>> 8 ^ T[(C ^ (224 | c >> 12 & 15)) & 0xFF];
        C = C >>> 8 ^ T[(C ^ (128 | c >> 6 & 63)) & 0xFF];
        C = C >>> 8 ^ T[(C ^ (128 | c & 63)) & 0xFF];
      }
    }

    return C ^ -1;
  }

  CRC32.table = T;
  CRC32.bstr = crc32_bstr;
  CRC32.buf = crc32_buf;
  CRC32.str = crc32_str;
});
/* [MS-CFB] v20171201 */


var CFB = function _CFB() {
  var exports = {};
  exports.version = '1.2.0';
  /* [MS-CFB] 2.6.4 */

  function namecmp(l, r) {
    var L = l.split("/"),
        R = r.split("/");

    for (var i = 0, c = 0, Z = Math.min(L.length, R.length); i < Z; ++i) {
      if (c = L[i].length - R[i].length) return c;
      if (L[i] != R[i]) return L[i] < R[i] ? -1 : 1;
    }

    return L.length - R.length;
  }

  function dirname(p) {
    if (p.charAt(p.length - 1) == "/") return p.slice(0, -1).indexOf("/") === -1 ? p : dirname(p.slice(0, -1));
    var c = p.lastIndexOf("/");
    return c === -1 ? p : p.slice(0, c + 1);
  }

  function filename(p) {
    if (p.charAt(p.length - 1) == "/") return filename(p.slice(0, -1));
    var c = p.lastIndexOf("/");
    return c === -1 ? p : p.slice(c + 1);
  }
  /* -------------------------------------------------------------------------- */

  /* DOS Date format:
     high|YYYYYYYm.mmmddddd.HHHHHMMM.MMMSSSSS|low
     add 1980 to stored year
     stored second should be doubled
  */

  /* write JS date to buf as a DOS date */


  function write_dos_date(buf, date) {
    if (typeof date === "string") date = new Date(date);
    var hms = date.getHours();
    hms = hms << 6 | date.getMinutes();
    hms = hms << 5 | date.getSeconds() >>> 1;
    buf.write_shift(2, hms);
    var ymd = date.getFullYear() - 1980;
    ymd = ymd << 4 | date.getMonth() + 1;
    ymd = ymd << 5 | date.getDate();
    buf.write_shift(2, ymd);
  }
  /* read four bytes from buf and interpret as a DOS date */


  function parse_dos_date(buf) {
    var hms = buf.read_shift(2) & 0xFFFF;
    var ymd = buf.read_shift(2) & 0xFFFF;
    var val = new Date();
    var d = ymd & 0x1F;
    ymd >>>= 5;
    var m = ymd & 0x0F;
    ymd >>>= 4;
    val.setMilliseconds(0);
    val.setFullYear(ymd + 1980);
    val.setMonth(m - 1);
    val.setDate(d);
    var S = hms & 0x1F;
    hms >>>= 5;
    var M = hms & 0x3F;
    hms >>>= 6;
    val.setHours(hms);
    val.setMinutes(M);
    val.setSeconds(S << 1);
    return val;
  }

  function parse_extra_field(blob) {
    prep_blob(blob, 0);
    var o = {};
    var flags = 0;

    while (blob.l <= blob.length - 4) {
      var type = blob.read_shift(2);
      var sz = blob.read_shift(2),
          tgt = blob.l + sz;
      var p = {};

      switch (type) {
        /* UNIX-style Timestamps */
        case 0x5455:
          {
            flags = blob.read_shift(1);
            if (flags & 1) p.mtime = blob.read_shift(4);
            /* for some reason, CD flag corresponds to LFH */

            if (sz > 5) {
              if (flags & 2) p.atime = blob.read_shift(4);
              if (flags & 4) p.ctime = blob.read_shift(4);
            }

            if (p.mtime) p.mt = new Date(p.mtime * 1000);
          }
          break;
      }

      blob.l = tgt;
      o[type] = p;
    }

    return o;
  }

  var fs;

  function get_fs() {
    return fs || (fs = require$$0);
  }

  function parse(file, options) {
    if (file[0] == 0x50 && file[1] == 0x4b) return parse_zip(file, options);
    if ((file[0] | 0x20) == 0x6d && (file[1] | 0x20) == 0x69) return parse_mad(file, options);
    if (file.length < 512) throw new Error("CFB file size " + file.length + " < 512");
    var mver = 3;
    var ssz = 512;
    var nmfs = 0; // number of mini FAT sectors

    var difat_sec_cnt = 0;
    var dir_start = 0;
    var minifat_start = 0;
    var difat_start = 0;
    var fat_addrs = []; // locations of FAT sectors

    /* [MS-CFB] 2.2 Compound File Header */

    var blob = file.slice(0, 512);
    prep_blob(blob, 0);
    /* major version */

    var mv = check_get_mver(blob);
    mver = mv[0];

    switch (mver) {
      case 3:
        ssz = 512;
        break;

      case 4:
        ssz = 4096;
        break;

      case 0:
        if (mv[1] == 0) return parse_zip(file, options);

      /* falls through */

      default:
        throw new Error("Major Version: Expected 3 or 4 saw " + mver);
    }
    /* reprocess header */


    if (ssz !== 512) {
      blob = file.slice(0, ssz);
      prep_blob(blob, 28
      /* blob.l */
      );
    }
    /* Save header for final object */


    var header = file.slice(0, ssz);
    check_shifts(blob, mver); // Number of Directory Sectors

    var dir_cnt = blob.read_shift(4, 'i');
    if (mver === 3 && dir_cnt !== 0) throw new Error('# Directory Sectors: Expected 0 saw ' + dir_cnt); // Number of FAT Sectors

    blob.l += 4; // First Directory Sector Location

    dir_start = blob.read_shift(4, 'i'); // Transaction Signature

    blob.l += 4; // Mini Stream Cutoff Size

    blob.chk('00100000', 'Mini Stream Cutoff Size: '); // First Mini FAT Sector Location

    minifat_start = blob.read_shift(4, 'i'); // Number of Mini FAT Sectors

    nmfs = blob.read_shift(4, 'i'); // First DIFAT sector location

    difat_start = blob.read_shift(4, 'i'); // Number of DIFAT Sectors

    difat_sec_cnt = blob.read_shift(4, 'i'); // Grab FAT Sector Locations

    for (var q = -1, j = 0; j < 109; ++j) {
      /* 109 = (512 - blob.l)>>>2; */
      q = blob.read_shift(4, 'i');
      if (q < 0) break;
      fat_addrs[j] = q;
    }
    /** Break the file up into sectors */


    var sectors = sectorify(file, ssz);
    sleuth_fat(difat_start, difat_sec_cnt, sectors, ssz, fat_addrs);
    /** Chains */

    var sector_list = make_sector_list(sectors, dir_start, fat_addrs, ssz);
    sector_list[dir_start].name = "!Directory";
    if (nmfs > 0 && minifat_start !== ENDOFCHAIN) sector_list[minifat_start].name = "!MiniFAT";
    sector_list[fat_addrs[0]].name = "!FAT";
    sector_list.fat_addrs = fat_addrs;
    sector_list.ssz = ssz;
    /* [MS-CFB] 2.6.1 Compound File Directory Entry */

    var files = {},
        Paths = [],
        FileIndex = [],
        FullPaths = [];
    read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex, minifat_start);
    build_full_paths(FileIndex, FullPaths, Paths);
    Paths.shift();
    var o = {
      FileIndex: FileIndex,
      FullPaths: FullPaths
    }; // $FlowIgnore

    if (options && options.raw) o.raw = {
      header: header,
      sectors: sectors
    };
    return o;
  } // parse

  /* [MS-CFB] 2.2 Compound File Header -- read up to major version */


  function check_get_mver(blob) {
    if (blob[blob.l] == 0x50 && blob[blob.l + 1] == 0x4b) return [0, 0]; // header signature 8

    blob.chk(HEADER_SIGNATURE, 'Header Signature: '); // clsid 16
    //blob.chk(HEADER_CLSID, 'CLSID: ');

    blob.l += 16; // minor version 2

    var mver = blob.read_shift(2, 'u');
    return [blob.read_shift(2, 'u'), mver];
  }

  function check_shifts(blob, mver) {
    var shift = 0x09; // Byte Order
    //blob.chk('feff', 'Byte Order: '); // note: some writers put 0xffff

    blob.l += 2; // Sector Shift

    switch (shift = blob.read_shift(2)) {
      case 0x09:
        if (mver != 3) throw new Error('Sector Shift: Expected 9 saw ' + shift);
        break;

      case 0x0c:
        if (mver != 4) throw new Error('Sector Shift: Expected 12 saw ' + shift);
        break;

      default:
        throw new Error('Sector Shift: Expected 9 or 12 saw ' + shift);
    } // Mini Sector Shift


    blob.chk('0600', 'Mini Sector Shift: '); // Reserved

    blob.chk('000000000000', 'Reserved: ');
  }
  /** Break the file up into sectors */


  function sectorify(file, ssz) {
    var nsectors = Math.ceil(file.length / ssz) - 1;
    var sectors = [];

    for (var i = 1; i < nsectors; ++i) sectors[i - 1] = file.slice(i * ssz, (i + 1) * ssz);

    sectors[nsectors - 1] = file.slice(nsectors * ssz);
    return sectors;
  }
  /* [MS-CFB] 2.6.4 Red-Black Tree */


  function build_full_paths(FI, FP, Paths) {
    var i = 0,
        L = 0,
        R = 0,
        C = 0,
        j = 0,
        pl = Paths.length;
    var dad = [],
        q = [];

    for (; i < pl; ++i) {
      dad[i] = q[i] = i;
      FP[i] = Paths[i];
    }

    for (; j < q.length; ++j) {
      i = q[j];
      L = FI[i].L;
      R = FI[i].R;
      C = FI[i].C;

      if (dad[i] === i) {
        if (L !== -1
        /*NOSTREAM*/
        && dad[L] !== L) dad[i] = dad[L];
        if (R !== -1 && dad[R] !== R) dad[i] = dad[R];
      }

      if (C !== -1
      /*NOSTREAM*/
      ) dad[C] = i;

      if (L !== -1 && i != dad[i]) {
        dad[L] = dad[i];
        if (q.lastIndexOf(L) < j) q.push(L);
      }

      if (R !== -1 && i != dad[i]) {
        dad[R] = dad[i];
        if (q.lastIndexOf(R) < j) q.push(R);
      }
    }

    for (i = 1; i < pl; ++i) if (dad[i] === i) {
      if (R !== -1
      /*NOSTREAM*/
      && dad[R] !== R) dad[i] = dad[R];else if (L !== -1 && dad[L] !== L) dad[i] = dad[L];
    }

    for (i = 1; i < pl; ++i) {
      if (FI[i].type === 0
      /* unknown */
      ) continue;
      j = i;
      if (j != dad[j]) do {
        j = dad[j];
        FP[i] = FP[j] + "/" + FP[i];
      } while (j !== 0 && -1 !== dad[j] && j != dad[j]);
      dad[i] = -1;
    }

    FP[0] += "/";

    for (i = 1; i < pl; ++i) {
      if (FI[i].type !== 2
      /* stream */
      ) FP[i] += "/";
    }
  }

  function get_mfat_entry(entry, payload, mini) {
    var start = entry.start,
        size = entry.size; //return (payload.slice(start*MSSZ, start*MSSZ + size));

    var o = [];
    var idx = start;

    while (mini && size > 0 && idx >= 0) {
      o.push(payload.slice(idx * MSSZ, idx * MSSZ + MSSZ));
      size -= MSSZ;
      idx = __readInt32LE(mini, idx * 4);
    }

    if (o.length === 0) return new_buf(0);
    return bconcat(o).slice(0, entry.size);
  }
  /** Chase down the rest of the DIFAT chain to build a comprehensive list
      DIFAT chains by storing the next sector number as the last 32 bits */


  function sleuth_fat(idx, cnt, sectors, ssz, fat_addrs) {
    var q = ENDOFCHAIN;

    if (idx === ENDOFCHAIN) {
      if (cnt !== 0) throw new Error("DIFAT chain shorter than expected");
    } else if (idx !== -1
    /*FREESECT*/
    ) {
        var sector = sectors[idx],
            m = (ssz >>> 2) - 1;
        if (!sector) return;

        for (var i = 0; i < m; ++i) {
          if ((q = __readInt32LE(sector, i * 4)) === ENDOFCHAIN) break;
          fat_addrs.push(q);
        }

        sleuth_fat(__readInt32LE(sector, ssz - 4), cnt - 1, sectors, ssz, fat_addrs);
      }
  }
  /** Follow the linked list of sectors for a given starting point */


  function get_sector_list(sectors, start, fat_addrs, ssz, chkd) {
    var buf = [],
        buf_chain = [];
    if (!chkd) chkd = [];
    var modulus = ssz - 1,
        j = 0,
        jj = 0;

    for (j = start; j >= 0;) {
      chkd[j] = true;
      buf[buf.length] = j;
      buf_chain.push(sectors[j]);
      var addr = fat_addrs[Math.floor(j * 4 / ssz)];
      jj = j * 4 & modulus;
      if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
      if (!sectors[addr]) break;
      j = __readInt32LE(sectors[addr], jj);
    }

    return {
      nodes: buf,
      data: __toBuffer([buf_chain])
    };
  }
  /** Chase down the sector linked lists */


  function make_sector_list(sectors, dir_start, fat_addrs, ssz) {
    var sl = sectors.length,
        sector_list = [];
    var chkd = [],
        buf = [],
        buf_chain = [];
    var modulus = ssz - 1,
        i = 0,
        j = 0,
        k = 0,
        jj = 0;

    for (i = 0; i < sl; ++i) {
      buf = [];
      k = i + dir_start;
      if (k >= sl) k -= sl;
      if (chkd[k]) continue;
      buf_chain = [];
      var seen = [];

      for (j = k; j >= 0;) {
        seen[j] = true;
        chkd[j] = true;
        buf[buf.length] = j;
        buf_chain.push(sectors[j]);
        var addr = fat_addrs[Math.floor(j * 4 / ssz)];
        jj = j * 4 & modulus;
        if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
        if (!sectors[addr]) break;
        j = __readInt32LE(sectors[addr], jj);
        if (seen[j]) break;
      }

      sector_list[k] = {
        nodes: buf,
        data: __toBuffer([buf_chain])
      };
    }

    return sector_list;
  }
  /* [MS-CFB] 2.6.1 Compound File Directory Entry */


  function read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex, mini) {
    var minifat_store = 0,
        pl = Paths.length ? 2 : 0;
    var sector = sector_list[dir_start].data;
    var i = 0,
        namelen = 0,
        name;

    for (; i < sector.length; i += 128) {
      var blob = sector.slice(i, i + 128);
      prep_blob(blob, 64);
      namelen = blob.read_shift(2);
      name = __utf16le(blob, 0, namelen - pl);
      Paths.push(name);
      var o = {
        name: name,
        type: blob.read_shift(1),
        color: blob.read_shift(1),
        L: blob.read_shift(4, 'i'),
        R: blob.read_shift(4, 'i'),
        C: blob.read_shift(4, 'i'),
        clsid: blob.read_shift(16),
        state: blob.read_shift(4, 'i'),
        start: 0,
        size: 0
      };
      var ctime = blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2);
      if (ctime !== 0) o.ct = read_date(blob, blob.l - 8);
      var mtime = blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2);
      if (mtime !== 0) o.mt = read_date(blob, blob.l - 8);
      o.start = blob.read_shift(4, 'i');
      o.size = blob.read_shift(4, 'i');

      if (o.size < 0 && o.start < 0) {
        o.size = o.type = 0;
        o.start = ENDOFCHAIN;
        o.name = "";
      }

      if (o.type === 5) {
        /* root */
        minifat_store = o.start;
        if (nmfs > 0 && minifat_store !== ENDOFCHAIN) sector_list[minifat_store].name = "!StreamData";
        /*minifat_size = o.size;*/
      } else if (o.size >= 4096
      /* MSCSZ */
      ) {
          o.storage = 'fat';
          if (sector_list[o.start] === undefined) sector_list[o.start] = get_sector_list(sectors, o.start, sector_list.fat_addrs, sector_list.ssz);
          sector_list[o.start].name = o.name;
          o.content = sector_list[o.start].data.slice(0, o.size);
        } else {
        o.storage = 'minifat';
        if (o.size < 0) o.size = 0;else if (minifat_store !== ENDOFCHAIN && o.start !== ENDOFCHAIN && sector_list[minifat_store]) {
          o.content = get_mfat_entry(o, sector_list[minifat_store].data, (sector_list[mini] || {}).data);
        }
      }

      if (o.content) prep_blob(o.content, 0);
      files[name] = o;
      FileIndex.push(o);
    }
  }

  function read_date(blob, offset) {
    return new Date((__readUInt32LE(blob, offset + 4) / 1e7 * Math.pow(2, 32) + __readUInt32LE(blob, offset) / 1e7 - 11644473600) * 1000);
  }

  function read_file(filename, options) {
    get_fs();
    return parse(fs.readFileSync(filename), options);
  }

  function read(blob, options) {
    switch (options && options.type || "base64") {
      case "file":
        return read_file(blob, options);

      case "base64":
        return parse(s2a(Base64.decode(blob)), options);

      case "binary":
        return parse(s2a(blob), options);
    }

    return parse(blob, options);
  }

  function init_cfb(cfb, opts) {
    var o = opts || {},
        root = o.root || "Root Entry";
    if (!cfb.FullPaths) cfb.FullPaths = [];
    if (!cfb.FileIndex) cfb.FileIndex = [];
    if (cfb.FullPaths.length !== cfb.FileIndex.length) throw new Error("inconsistent CFB structure");

    if (cfb.FullPaths.length === 0) {
      cfb.FullPaths[0] = root + "/";
      cfb.FileIndex[0] = {
        name: root,
        type: 5
      };
    }

    if (o.CLSID) cfb.FileIndex[0].clsid = o.CLSID;
    seed_cfb(cfb);
  }

  function seed_cfb(cfb) {
    var nm = "\u0001Sh33tJ5";
    if (CFB.find(cfb, "/" + nm)) return;
    var p = new_buf(4);
    p[0] = 55;
    p[1] = p[3] = 50;
    p[2] = 54;
    cfb.FileIndex.push({
      name: nm,
      type: 2,
      content: p,
      size: 4,
      L: 69,
      R: 69,
      C: 69
    });
    cfb.FullPaths.push(cfb.FullPaths[0] + nm);
    rebuild_cfb(cfb);
  }

  function rebuild_cfb(cfb, f) {
    init_cfb(cfb);
    var gc = false,
        s = false;

    for (var i = cfb.FullPaths.length - 1; i >= 0; --i) {
      var _file = cfb.FileIndex[i];

      switch (_file.type) {
        case 0:
          if (s) gc = true;else {
            cfb.FileIndex.pop();
            cfb.FullPaths.pop();
          }
          break;

        case 1:
        case 2:
        case 5:
          s = true;
          if (isNaN(_file.R * _file.L * _file.C)) gc = true;
          if (_file.R > -1 && _file.L > -1 && _file.R == _file.L) gc = true;
          break;

        default:
          gc = true;
          break;
      }
    }

    if (!gc && !f) return;
    var now = new Date(1987, 1, 19),
        j = 0;
    var data = [];

    for (i = 0; i < cfb.FullPaths.length; ++i) {
      if (cfb.FileIndex[i].type === 0) continue;
      data.push([cfb.FullPaths[i], cfb.FileIndex[i]]);
    }

    for (i = 0; i < data.length; ++i) {
      var dad = dirname(data[i][0]);
      s = false;

      for (j = 0; j < data.length; ++j) if (data[j][0] === dad) s = true;

      if (!s) data.push([dad, {
        name: filename(dad).replace("/", ""),
        type: 1,
        clsid: HEADER_CLSID,
        ct: now,
        mt: now,
        content: null
      }]);
    }

    data.sort(function (x, y) {
      return namecmp(x[0], y[0]);
    });
    cfb.FullPaths = [];
    cfb.FileIndex = [];

    for (i = 0; i < data.length; ++i) {
      cfb.FullPaths[i] = data[i][0];
      cfb.FileIndex[i] = data[i][1];
    }

    for (i = 0; i < data.length; ++i) {
      var elt = cfb.FileIndex[i];
      var nm = cfb.FullPaths[i];
      elt.name = filename(nm).replace("/", "");
      elt.L = elt.R = elt.C = -(elt.color = 1);
      elt.size = elt.content ? elt.content.length : 0;
      elt.start = 0;
      elt.clsid = elt.clsid || HEADER_CLSID;

      if (i === 0) {
        elt.C = data.length > 1 ? 1 : -1;
        elt.size = 0;
        elt.type = 5;
      } else if (nm.slice(-1) == "/") {
        for (j = i + 1; j < data.length; ++j) if (dirname(cfb.FullPaths[j]) == nm) break;

        elt.C = j >= data.length ? -1 : j;

        for (j = i + 1; j < data.length; ++j) if (dirname(cfb.FullPaths[j]) == dirname(nm)) break;

        elt.R = j >= data.length ? -1 : j;
        elt.type = 1;
      } else {
        if (dirname(cfb.FullPaths[i + 1] || "") == dirname(nm)) elt.R = i + 1;
        elt.type = 2;
      }
    }
  }

  function _write(cfb, options) {
    var _opts = options || {};
    /* MAD is order-sensitive, skip rebuild and sort */


    if (_opts.fileType == 'mad') return write_mad(cfb, _opts);
    rebuild_cfb(cfb);

    switch (_opts.fileType) {
      case 'zip':
        return write_zip(cfb, _opts);
      //case 'mad': return write_mad(cfb, _opts);
    }

    var L = function (cfb) {
      var mini_size = 0,
          fat_size = 0;

      for (var i = 0; i < cfb.FileIndex.length; ++i) {
        var file = cfb.FileIndex[i];
        if (!file.content) continue;
        var flen = file.content.length;

        if (flen > 0) {
          if (flen < 0x1000) mini_size += flen + 0x3F >> 6;else fat_size += flen + 0x01FF >> 9;
        }
      }

      var dir_cnt = cfb.FullPaths.length + 3 >> 2;
      var mini_cnt = mini_size + 7 >> 3;
      var mfat_cnt = mini_size + 0x7F >> 7;
      var fat_base = mini_cnt + fat_size + dir_cnt + mfat_cnt;
      var fat_cnt = fat_base + 0x7F >> 7;
      var difat_cnt = fat_cnt <= 109 ? 0 : Math.ceil((fat_cnt - 109) / 0x7F);

      while (fat_base + fat_cnt + difat_cnt + 0x7F >> 7 > fat_cnt) difat_cnt = ++fat_cnt <= 109 ? 0 : Math.ceil((fat_cnt - 109) / 0x7F);

      var L = [1, difat_cnt, fat_cnt, mfat_cnt, dir_cnt, fat_size, mini_size, 0];
      cfb.FileIndex[0].size = mini_size << 6;
      L[7] = (cfb.FileIndex[0].start = L[0] + L[1] + L[2] + L[3] + L[4] + L[5]) + (L[6] + 7 >> 3);
      return L;
    }(cfb);

    var o = new_buf(L[7] << 9);
    var i = 0,
        T = 0;
    {
      for (i = 0; i < 8; ++i) o.write_shift(1, HEADER_SIG[i]);

      for (i = 0; i < 8; ++i) o.write_shift(2, 0);

      o.write_shift(2, 0x003E);
      o.write_shift(2, 0x0003);
      o.write_shift(2, 0xFFFE);
      o.write_shift(2, 0x0009);
      o.write_shift(2, 0x0006);

      for (i = 0; i < 3; ++i) o.write_shift(2, 0);

      o.write_shift(4, 0);
      o.write_shift(4, L[2]);
      o.write_shift(4, L[0] + L[1] + L[2] + L[3] - 1);
      o.write_shift(4, 0);
      o.write_shift(4, 1 << 12);
      o.write_shift(4, L[3] ? L[0] + L[1] + L[2] - 1 : ENDOFCHAIN);
      o.write_shift(4, L[3]);
      o.write_shift(-4, L[1] ? L[0] - 1 : ENDOFCHAIN);
      o.write_shift(4, L[1]);

      for (i = 0; i < 109; ++i) o.write_shift(-4, i < L[2] ? L[1] + i : -1);
    }

    if (L[1]) {
      for (T = 0; T < L[1]; ++T) {
        for (; i < 236 + T * 127; ++i) o.write_shift(-4, i < L[2] ? L[1] + i : -1);

        o.write_shift(-4, T === L[1] - 1 ? ENDOFCHAIN : T + 1);
      }
    }

    var chainit = function (w) {
      for (T += w; i < T - 1; ++i) o.write_shift(-4, i + 1);

      if (w) {
        ++i;
        o.write_shift(-4, ENDOFCHAIN);
      }
    };

    T = i = 0;

    for (T += L[1]; i < T; ++i) o.write_shift(-4, consts.DIFSECT);

    for (T += L[2]; i < T; ++i) o.write_shift(-4, consts.FATSECT);

    chainit(L[3]);
    chainit(L[4]);
    var j = 0,
        flen = 0;
    var file = cfb.FileIndex[0];

    for (; j < cfb.FileIndex.length; ++j) {
      file = cfb.FileIndex[j];
      if (!file.content) continue;
      flen = file.content.length;
      if (flen < 0x1000) continue;
      file.start = T;
      chainit(flen + 0x01FF >> 9);
    }

    chainit(L[6] + 7 >> 3);

    while (o.l & 0x1FF) o.write_shift(-4, consts.ENDOFCHAIN);

    T = i = 0;

    for (j = 0; j < cfb.FileIndex.length; ++j) {
      file = cfb.FileIndex[j];
      if (!file.content) continue;
      flen = file.content.length;
      if (!flen || flen >= 0x1000) continue;
      file.start = T;
      chainit(flen + 0x3F >> 6);
    }

    while (o.l & 0x1FF) o.write_shift(-4, consts.ENDOFCHAIN);

    for (i = 0; i < L[4] << 2; ++i) {
      var nm = cfb.FullPaths[i];

      if (!nm || nm.length === 0) {
        for (j = 0; j < 17; ++j) o.write_shift(4, 0);

        for (j = 0; j < 3; ++j) o.write_shift(4, -1);

        for (j = 0; j < 12; ++j) o.write_shift(4, 0);

        continue;
      }

      file = cfb.FileIndex[i];
      if (i === 0) file.start = file.size ? file.start - 1 : ENDOFCHAIN;

      var _nm = i === 0 && _opts.root || file.name;

      flen = 2 * (_nm.length + 1);
      o.write_shift(64, _nm, "utf16le");
      o.write_shift(2, flen);
      o.write_shift(1, file.type);
      o.write_shift(1, file.color);
      o.write_shift(-4, file.L);
      o.write_shift(-4, file.R);
      o.write_shift(-4, file.C);
      if (!file.clsid) for (j = 0; j < 4; ++j) o.write_shift(4, 0);else o.write_shift(16, file.clsid, "hex");
      o.write_shift(4, file.state || 0);
      o.write_shift(4, 0);
      o.write_shift(4, 0);
      o.write_shift(4, 0);
      o.write_shift(4, 0);
      o.write_shift(4, file.start);
      o.write_shift(4, file.size);
      o.write_shift(4, 0);
    }

    for (i = 1; i < cfb.FileIndex.length; ++i) {
      file = cfb.FileIndex[i];

      if (file.size >= 0x1000) {
        o.l = file.start + 1 << 9;

        for (j = 0; j < file.size; ++j) o.write_shift(1, file.content[j]);

        for (; j & 0x1FF; ++j) o.write_shift(1, 0);
      }
    }

    for (i = 1; i < cfb.FileIndex.length; ++i) {
      file = cfb.FileIndex[i];

      if (file.size > 0 && file.size < 0x1000) {
        for (j = 0; j < file.size; ++j) o.write_shift(1, file.content[j]);

        for (; j & 0x3F; ++j) o.write_shift(1, 0);
      }
    }

    while (o.l < o.length) o.write_shift(1, 0);

    return o;
  }
  /* [MS-CFB] 2.6.4 (Unicode 3.0.1 case conversion) */


  function find(cfb, path) {
    var UCFullPaths = cfb.FullPaths.map(function (x) {
      return x.toUpperCase();
    });
    var UCPaths = UCFullPaths.map(function (x) {
      var y = x.split("/");
      return y[y.length - (x.slice(-1) == "/" ? 2 : 1)];
    });
    var k = false;

    if (path.charCodeAt(0) === 47
    /* "/" */
    ) {
        k = true;
        path = UCFullPaths[0].slice(0, -1) + path;
      } else k = path.indexOf("/") !== -1;

    var UCPath = path.toUpperCase();
    var w = k === true ? UCFullPaths.indexOf(UCPath) : UCPaths.indexOf(UCPath);
    if (w !== -1) return cfb.FileIndex[w];
    var m = !UCPath.match(chr1);
    UCPath = UCPath.replace(chr0, '');
    if (m) UCPath = UCPath.replace(chr1, '!');

    for (w = 0; w < UCFullPaths.length; ++w) {
      if ((m ? UCFullPaths[w].replace(chr1, '!') : UCFullPaths[w]).replace(chr0, '') == UCPath) return cfb.FileIndex[w];
      if ((m ? UCPaths[w].replace(chr1, '!') : UCPaths[w]).replace(chr0, '') == UCPath) return cfb.FileIndex[w];
    }

    return null;
  }
  /** CFB Constants */


  var MSSZ = 64;
  /* Mini Sector Size = 1<<6 */
  //var MSCSZ = 4096; /* Mini Stream Cutoff Size */

  /* 2.1 Compound File Sector Numbers and Types */

  var ENDOFCHAIN = -2;
  /* 2.2 Compound File Header */

  var HEADER_SIGNATURE = 'd0cf11e0a1b11ae1';
  var HEADER_SIG = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
  var HEADER_CLSID = '00000000000000000000000000000000';
  var consts = {
    /* 2.1 Compund File Sector Numbers and Types */
    MAXREGSECT: -6,
    DIFSECT: -4,
    FATSECT: -3,
    ENDOFCHAIN: ENDOFCHAIN,
    FREESECT: -1,

    /* 2.2 Compound File Header */
    HEADER_SIGNATURE: HEADER_SIGNATURE,
    HEADER_MINOR_VERSION: '3e00',
    MAXREGSID: -6,
    NOSTREAM: -1,
    HEADER_CLSID: HEADER_CLSID,

    /* 2.6.1 Compound File Directory Entry */
    EntryTypes: ['unknown', 'storage', 'stream', 'lockbytes', 'property', 'root']
  };

  function write_file(cfb, filename, options) {
    get_fs();

    var o = _write(cfb, options);

    fs.writeFileSync(filename, o);
  }

  function a2s(o) {
    var out = new Array(o.length);

    for (var i = 0; i < o.length; ++i) out[i] = String.fromCharCode(o[i]);

    return out.join("");
  }

  function write(cfb, options) {
    var o = _write(cfb, options);

    switch (options && options.type || "buffer") {
      case "file":
        get_fs();
        fs.writeFileSync(options.filename, o);
        return o;

      case "binary":
        return typeof o == "string" ? o : a2s(o);

      case "base64":
        return Base64.encode(typeof o == "string" ? o : a2s(o));

      case "buffer":
        if (has_buf) return Buffer.isBuffer(o) ? o : Buffer_from(o);

      /* falls through */

      case "array":
        return typeof o == "string" ? s2a(o) : o;
    }

    return o;
  }
  /* node < 8.1 zlib does not expose bytesRead, so default to pure JS */


  var _zlib;

  function use_zlib(zlib) {
    try {
      var InflateRaw = zlib.InflateRaw;
      var InflRaw = new InflateRaw();

      InflRaw._processChunk(new Uint8Array([3, 0]), InflRaw._finishFlushFlag);

      if (InflRaw.bytesRead) _zlib = zlib;else throw new Error("zlib does not expose bytesRead");
    } catch (e) {
      console.error("cannot use native zlib: " + (e.message || e));
    }
  }

  function _inflateRawSync(payload, usz) {
    if (!_zlib) return _inflate(payload, usz);
    var InflateRaw = _zlib.InflateRaw;
    var InflRaw = new InflateRaw();

    var out = InflRaw._processChunk(payload.slice(payload.l), InflRaw._finishFlushFlag);

    payload.l += InflRaw.bytesRead;
    return out;
  }

  function _deflateRawSync(payload) {
    return _zlib ? _zlib.deflateRawSync(payload) : _deflate(payload);
  }

  var CLEN_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  /*  LEN_ID = [ 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285 ]; */

  var LEN_LN = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  /*  DST_ID = [  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13,  14,  15,  16,  17,  18,  19,   20,   21,   22,   23,   24,   25,   26,    27,    28,    29 ]; */

  var DST_LN = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];

  function bit_swap_8(n) {
    var t = (n << 1 | n << 11) & 0x22110 | (n << 5 | n << 15) & 0x88440;
    return (t >> 16 | t >> 8 | t) & 0xFF;
  }

  var use_typed_arrays = typeof Uint8Array !== 'undefined';
  var bitswap8 = use_typed_arrays ? new Uint8Array(1 << 8) : [];

  for (var q = 0; q < 1 << 8; ++q) bitswap8[q] = bit_swap_8(q);

  function bit_swap_n(n, b) {
    var rev = bitswap8[n & 0xFF];
    if (b <= 8) return rev >>> 8 - b;
    rev = rev << 8 | bitswap8[n >> 8 & 0xFF];
    if (b <= 16) return rev >>> 16 - b;
    rev = rev << 8 | bitswap8[n >> 16 & 0xFF];
    return rev >>> 24 - b;
  }
  /* helpers for unaligned bit reads */


  function read_bits_2(buf, bl) {
    var w = bl & 7,
        h = bl >>> 3;
    return (buf[h] | (w <= 6 ? 0 : buf[h + 1] << 8)) >>> w & 0x03;
  }

  function read_bits_3(buf, bl) {
    var w = bl & 7,
        h = bl >>> 3;
    return (buf[h] | (w <= 5 ? 0 : buf[h + 1] << 8)) >>> w & 0x07;
  }

  function read_bits_4(buf, bl) {
    var w = bl & 7,
        h = bl >>> 3;
    return (buf[h] | (w <= 4 ? 0 : buf[h + 1] << 8)) >>> w & 0x0F;
  }

  function read_bits_5(buf, bl) {
    var w = bl & 7,
        h = bl >>> 3;
    return (buf[h] | (w <= 3 ? 0 : buf[h + 1] << 8)) >>> w & 0x1F;
  }

  function read_bits_7(buf, bl) {
    var w = bl & 7,
        h = bl >>> 3;
    return (buf[h] | (w <= 1 ? 0 : buf[h + 1] << 8)) >>> w & 0x7F;
  }
  /* works up to n = 3 * 8 + 1 = 25 */


  function read_bits_n(buf, bl, n) {
    var w = bl & 7,
        h = bl >>> 3,
        f = (1 << n) - 1;
    var v = buf[h] >>> w;
    if (n < 8 - w) return v & f;
    v |= buf[h + 1] << 8 - w;
    if (n < 16 - w) return v & f;
    v |= buf[h + 2] << 16 - w;
    if (n < 24 - w) return v & f;
    v |= buf[h + 3] << 24 - w;
    return v & f;
  }
  /* until ArrayBuffer#realloc is a thing, fake a realloc */


  function realloc(b, sz) {
    var L = b.length,
        M = 2 * L > sz ? 2 * L : sz + 5,
        i = 0;
    if (L >= sz) return b;

    if (has_buf) {
      var o = new_unsafe_buf(M); // $FlowIgnore

      if (b.copy) b.copy(o);else for (; i < b.length; ++i) o[i] = b[i];
      return o;
    } else if (use_typed_arrays) {
      var a = new Uint8Array(M);
      if (a.set) a.set(b);else for (; i < b.length; ++i) a[i] = b[i];
      return a;
    }

    b.length = M;
    return b;
  }
  /* zero-filled arrays for older browsers */


  function zero_fill_array(n) {
    var o = new Array(n);

    for (var i = 0; i < n; ++i) o[i] = 0;

    return o;
  }

  var _deflate = function () {
    var _deflateRaw = function () {
      return function deflateRaw(data, out) {
        var boff = 0;

        while (boff < data.length) {
          var L = Math.min(0xFFFF, data.length - boff);
          var h = boff + L == data.length;
          /* TODO: this is only type 0 stored */

          out.write_shift(1, +h);
          out.write_shift(2, L);
          out.write_shift(2, ~L & 0xFFFF);

          while (L-- > 0) out[out.l++] = data[boff++];
        }

        return out.l;
      };
    }();

    return function (data) {
      var buf = new_buf(50 + Math.floor(data.length * 1.1));

      var off = _deflateRaw(data, buf);

      return buf.slice(0, off);
    };
  }();
  /* modified inflate function also moves original read head */

  /* build tree (used for literals and lengths) */


  function build_tree(clens, cmap, MAX) {
    var maxlen = 1,
        w = 0,
        i = 0,
        j = 0,
        ccode = 0,
        L = clens.length;
    var bl_count = use_typed_arrays ? new Uint16Array(32) : zero_fill_array(32);

    for (i = 0; i < 32; ++i) bl_count[i] = 0;

    for (i = L; i < MAX; ++i) clens[i] = 0;

    L = clens.length;
    var ctree = use_typed_arrays ? new Uint16Array(L) : zero_fill_array(L); // []

    /* build code tree */

    for (i = 0; i < L; ++i) {
      bl_count[w = clens[i]]++;
      if (maxlen < w) maxlen = w;
      ctree[i] = 0;
    }

    bl_count[0] = 0;

    for (i = 1; i <= maxlen; ++i) bl_count[i + 16] = ccode = ccode + bl_count[i - 1] << 1;

    for (i = 0; i < L; ++i) {
      ccode = clens[i];
      if (ccode != 0) ctree[i] = bl_count[ccode + 16]++;
    }
    /* cmap[maxlen + 4 bits] = (off&15) + (lit<<4) reverse mapping */


    var cleni = 0;

    for (i = 0; i < L; ++i) {
      cleni = clens[i];

      if (cleni != 0) {
        ccode = bit_swap_n(ctree[i], maxlen) >> maxlen - cleni;

        for (j = (1 << maxlen + 4 - cleni) - 1; j >= 0; --j) cmap[ccode | j << cleni] = cleni & 15 | i << 4;
      }
    }

    return maxlen;
  }

  var fix_lmap = use_typed_arrays ? new Uint16Array(512) : zero_fill_array(512);
  var fix_dmap = use_typed_arrays ? new Uint16Array(32) : zero_fill_array(32);

  if (!use_typed_arrays) {
    for (var i = 0; i < 512; ++i) fix_lmap[i] = 0;

    for (i = 0; i < 32; ++i) fix_dmap[i] = 0;
  }

  (function () {
    var dlens = [];
    var i = 0;

    for (; i < 32; i++) dlens.push(5);

    build_tree(dlens, fix_dmap, 32);
    var clens = [];
    i = 0;

    for (; i <= 143; i++) clens.push(8);

    for (; i <= 255; i++) clens.push(9);

    for (; i <= 279; i++) clens.push(7);

    for (; i <= 287; i++) clens.push(8);

    build_tree(clens, fix_lmap, 288);
  })();

  var dyn_lmap = use_typed_arrays ? new Uint16Array(32768) : zero_fill_array(32768);
  var dyn_dmap = use_typed_arrays ? new Uint16Array(32768) : zero_fill_array(32768);
  var dyn_cmap = use_typed_arrays ? new Uint16Array(128) : zero_fill_array(128);
  var dyn_len_1 = 1,
      dyn_len_2 = 1;
  /* 5.5.3 Expanding Huffman Codes */

  function dyn(data, boff) {
    /* nomenclature from RFC1951 refers to bit values; these are offset by the implicit constant */
    var _HLIT = read_bits_5(data, boff) + 257;

    boff += 5;

    var _HDIST = read_bits_5(data, boff) + 1;

    boff += 5;

    var _HCLEN = read_bits_4(data, boff) + 4;

    boff += 4;
    var w = 0;
    /* grab and store code lengths */

    var clens = use_typed_arrays ? new Uint8Array(19) : zero_fill_array(19);
    var ctree = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var maxlen = 1;
    var bl_count = use_typed_arrays ? new Uint8Array(8) : zero_fill_array(8);
    var next_code = use_typed_arrays ? new Uint8Array(8) : zero_fill_array(8);
    var L = clens.length;
    /* 19 */

    for (var i = 0; i < _HCLEN; ++i) {
      clens[CLEN_ORDER[i]] = w = read_bits_3(data, boff);
      if (maxlen < w) maxlen = w;
      bl_count[w]++;
      boff += 3;
    }
    /* build code tree */


    var ccode = 0;
    bl_count[0] = 0;

    for (i = 1; i <= maxlen; ++i) next_code[i] = ccode = ccode + bl_count[i - 1] << 1;

    for (i = 0; i < L; ++i) if ((ccode = clens[i]) != 0) ctree[i] = next_code[ccode]++;
    /* cmap[7 bits from stream] = (off&7) + (lit<<3) */


    var cleni = 0;

    for (i = 0; i < L; ++i) {
      cleni = clens[i];

      if (cleni != 0) {
        ccode = bitswap8[ctree[i]] >> 8 - cleni;

        for (var j = (1 << 7 - cleni) - 1; j >= 0; --j) dyn_cmap[ccode | j << cleni] = cleni & 7 | i << 3;
      }
    }
    /* read literal and dist codes at once */


    var hcodes = [];
    maxlen = 1;

    for (; hcodes.length < _HLIT + _HDIST;) {
      ccode = dyn_cmap[read_bits_7(data, boff)];
      boff += ccode & 7;

      switch (ccode >>>= 3) {
        case 16:
          w = 3 + read_bits_2(data, boff);
          boff += 2;
          ccode = hcodes[hcodes.length - 1];

          while (w-- > 0) hcodes.push(ccode);

          break;

        case 17:
          w = 3 + read_bits_3(data, boff);
          boff += 3;

          while (w-- > 0) hcodes.push(0);

          break;

        case 18:
          w = 11 + read_bits_7(data, boff);
          boff += 7;

          while (w-- > 0) hcodes.push(0);

          break;

        default:
          hcodes.push(ccode);
          if (maxlen < ccode) maxlen = ccode;
          break;
      }
    }
    /* build literal / length trees */


    var h1 = hcodes.slice(0, _HLIT),
        h2 = hcodes.slice(_HLIT);

    for (i = _HLIT; i < 286; ++i) h1[i] = 0;

    for (i = _HDIST; i < 30; ++i) h2[i] = 0;

    dyn_len_1 = build_tree(h1, dyn_lmap, 286);
    dyn_len_2 = build_tree(h2, dyn_dmap, 30);
    return boff;
  }
  /* return [ data, bytesRead ] */


  function inflate(data, usz) {
    /* shortcircuit for empty buffer [0x03, 0x00] */
    if (data[0] == 3 && !(data[1] & 0x3)) {
      return [new_raw_buf(usz), 2];
    }
    /* bit offset */


    var boff = 0;
    /* header includes final bit and type bits */

    var header = 0;
    var outbuf = new_unsafe_buf(usz ? usz : 1 << 18);
    var woff = 0;
    var OL = outbuf.length >>> 0;
    var max_len_1 = 0,
        max_len_2 = 0;

    while ((header & 1) == 0) {
      header = read_bits_3(data, boff);
      boff += 3;

      if (header >>> 1 == 0) {
        /* Stored block */
        if (boff & 7) boff += 8 - (boff & 7);
        /* 2 bytes sz, 2 bytes bit inverse */

        var sz = data[boff >>> 3] | data[(boff >>> 3) + 1] << 8;
        boff += 32;
        /* push sz bytes */

        if (!usz && OL < woff + sz) {
          outbuf = realloc(outbuf, woff + sz);
          OL = outbuf.length;
        }

        if (typeof data.copy === 'function') {
          // $FlowIgnore
          data.copy(outbuf, woff, boff >>> 3, (boff >>> 3) + sz);
          woff += sz;
          boff += 8 * sz;
        } else while (sz-- > 0) {
          outbuf[woff++] = data[boff >>> 3];
          boff += 8;
        }

        continue;
      } else if (header >>> 1 == 1) {
        /* Fixed Huffman */
        max_len_1 = 9;
        max_len_2 = 5;
      } else {
        /* Dynamic Huffman */
        boff = dyn(data, boff);
        max_len_1 = dyn_len_1;
        max_len_2 = dyn_len_2;
      }

      if (!usz && OL < woff + 32767) {
        outbuf = realloc(outbuf, woff + 32767);
        OL = outbuf.length;
      }

      for (;;) {
        // while(true) is apparently out of vogue in modern JS circles

        /* ingest code and move read head */
        var bits = read_bits_n(data, boff, max_len_1);
        var code = header >>> 1 == 1 ? fix_lmap[bits] : dyn_lmap[bits];
        boff += code & 15;
        code >>>= 4;
        /* 0-255 are literals, 256 is end of block token, 257+ are copy tokens */

        if ((code >>> 8 & 0xFF) === 0) outbuf[woff++] = code;else if (code == 256) break;else {
          code -= 257;
          var len_eb = code < 8 ? 0 : code - 4 >> 2;
          if (len_eb > 5) len_eb = 0;
          var tgt = woff + LEN_LN[code];
          /* length extra bits */

          if (len_eb > 0) {
            tgt += read_bits_n(data, boff, len_eb);
            boff += len_eb;
          }
          /* dist code */


          bits = read_bits_n(data, boff, max_len_2);
          code = header >>> 1 == 1 ? fix_dmap[bits] : dyn_dmap[bits];
          boff += code & 15;
          code >>>= 4;
          var dst_eb = code < 4 ? 0 : code - 2 >> 1;
          var dst = DST_LN[code];
          /* dist extra bits */

          if (dst_eb > 0) {
            dst += read_bits_n(data, boff, dst_eb);
            boff += dst_eb;
          }
          /* in the common case, manual byte copy is faster than TA set / Buffer copy */


          if (!usz && OL < tgt) {
            outbuf = realloc(outbuf, tgt);
            OL = outbuf.length;
          }

          while (woff < tgt) {
            outbuf[woff] = outbuf[woff - dst];
            ++woff;
          }
        }
      }
    }

    return [usz ? outbuf : outbuf.slice(0, woff), boff + 7 >>> 3];
  }

  function _inflate(payload, usz) {
    var data = payload.slice(payload.l || 0);
    var out = inflate(data, usz);
    payload.l += out[1];
    return out[0];
  }

  function warn_or_throw(wrn, msg) {
    if (wrn) {
      if (typeof console !== 'undefined') console.error(msg);
    } else throw new Error(msg);
  }

  function parse_zip(file, options) {
    var blob = file;
    prep_blob(blob, 0);
    var FileIndex = [],
        FullPaths = [];
    var o = {
      FileIndex: FileIndex,
      FullPaths: FullPaths
    };
    init_cfb(o, {
      root: options.root
    });
    /* find end of central directory, start just after signature */

    var i = blob.length - 4;

    while ((blob[i] != 0x50 || blob[i + 1] != 0x4b || blob[i + 2] != 0x05 || blob[i + 3] != 0x06) && i >= 0) --i;

    blob.l = i + 4;
    /* parse end of central directory */

    blob.l += 4;
    var fcnt = blob.read_shift(2);
    blob.l += 6;
    var start_cd = blob.read_shift(4);
    /* parse central directory */

    blob.l = start_cd;

    for (i = 0; i < fcnt; ++i) {
      /* trust local file header instead of CD entry */
      blob.l += 20;
      var csz = blob.read_shift(4);
      var usz = blob.read_shift(4);
      var namelen = blob.read_shift(2);
      var efsz = blob.read_shift(2);
      var fcsz = blob.read_shift(2);
      blob.l += 8;
      var offset = blob.read_shift(4);
      var EF = parse_extra_field(blob.slice(blob.l + namelen, blob.l + namelen + efsz));
      blob.l += namelen + efsz + fcsz;
      var L = blob.l;
      blob.l = offset + 4;
      parse_local_file(blob, csz, usz, o, EF);
      blob.l = L;
    }

    return o;
  }
  /* head starts just after local file header signature */


  function parse_local_file(blob, csz, usz, o, EF) {
    /* [local file header] */
    blob.l += 2;
    var flags = blob.read_shift(2);
    var meth = blob.read_shift(2);
    var date = parse_dos_date(blob);
    if (flags & 0x2041) throw new Error("Unsupported ZIP encryption");
    var crc32 = blob.read_shift(4);

    var _csz = blob.read_shift(4);

    var _usz = blob.read_shift(4);

    var namelen = blob.read_shift(2);
    var efsz = blob.read_shift(2); // TODO: flags & (1<<11) // UTF8

    var name = "";

    for (var i = 0; i < namelen; ++i) name += String.fromCharCode(blob[blob.l++]);

    if (efsz) {
      var ef = parse_extra_field(blob.slice(blob.l, blob.l + efsz));
      if ((ef[0x5455] || {}).mt) date = ef[0x5455].mt;
      if (((EF || {})[0x5455] || {}).mt) date = EF[0x5455].mt;
    }

    blob.l += efsz;
    /* [encryption header] */

    /* [file data] */

    var data = blob.slice(blob.l, blob.l + _csz);

    switch (meth) {
      case 8:
        data = _inflateRawSync(blob, _usz);
        break;

      case 0:
        break;

      default:
        throw new Error("Unsupported ZIP Compression method " + meth);
    }
    /* [data descriptor] */


    var wrn = false;

    if (flags & 8) {
      crc32 = blob.read_shift(4);

      if (crc32 == 0x08074b50) {
        crc32 = blob.read_shift(4);
        wrn = true;
      }

      _csz = blob.read_shift(4);
      _usz = blob.read_shift(4);
    }

    if (_csz != csz) warn_or_throw(wrn, "Bad compressed size: " + csz + " != " + _csz);
    if (_usz != usz) warn_or_throw(wrn, "Bad uncompressed size: " + usz + " != " + _usz);

    var _crc32 = CRC32.buf(data, 0);

    if (crc32 >> 0 != _crc32 >> 0) warn_or_throw(wrn, "Bad CRC32 checksum: " + crc32 + " != " + _crc32);
    cfb_add(o, name, data, {
      unsafe: true,
      mt: date
    });
  }

  function write_zip(cfb, options) {
    var _opts = options || {};

    var out = [],
        cdirs = [];
    var o = new_buf(1);
    var method = _opts.compression ? 8 : 0,
        flags = 0;
    var i = 0,
        j = 0;
    var start_cd = 0,
        fcnt = 0;
    var root = cfb.FullPaths[0],
        fp = root,
        fi = cfb.FileIndex[0];
    var crcs = [];
    var sz_cd = 0;

    for (i = 1; i < cfb.FullPaths.length; ++i) {
      fp = cfb.FullPaths[i].slice(root.length);
      fi = cfb.FileIndex[i];
      if (!fi.size || !fi.content || fp == "\u0001Sh33tJ5") continue;
      var start = start_cd;
      /* TODO: CP437 filename */

      var namebuf = new_buf(fp.length);

      for (j = 0; j < fp.length; ++j) namebuf.write_shift(1, fp.charCodeAt(j) & 0x7F);

      namebuf = namebuf.slice(0, namebuf.l);
      crcs[fcnt] = CRC32.buf(fi.content, 0);
      var outbuf = fi.content;
      if (method == 8) outbuf = _deflateRawSync(outbuf);
      /* local file header */

      o = new_buf(30);
      o.write_shift(4, 0x04034b50);
      o.write_shift(2, 20);
      o.write_shift(2, flags);
      o.write_shift(2, method);
      /* TODO: last mod file time/date */

      if (fi.mt) write_dos_date(o, fi.mt);else o.write_shift(4, 0);
      o.write_shift(-4,  crcs[fcnt]);
      o.write_shift(4,  outbuf.length);
      o.write_shift(4,  fi.content.length);
      o.write_shift(2, namebuf.length);
      o.write_shift(2, 0);
      start_cd += o.length;
      out.push(o);
      start_cd += namebuf.length;
      out.push(namebuf);
      /* TODO: encryption header ? */

      start_cd += outbuf.length;
      out.push(outbuf);
      /* central directory */


      o = new_buf(46);
      o.write_shift(4, 0x02014b50);
      o.write_shift(2, 0);
      o.write_shift(2, 20);
      o.write_shift(2, flags);
      o.write_shift(2, method);
      o.write_shift(4, 0);
      /* TODO: last mod file time/date */

      o.write_shift(-4, crcs[fcnt]);
      o.write_shift(4, outbuf.length);
      o.write_shift(4, fi.content.length);
      o.write_shift(2, namebuf.length);
      o.write_shift(2, 0);
      o.write_shift(2, 0);
      o.write_shift(2, 0);
      o.write_shift(2, 0);
      o.write_shift(4, 0);
      o.write_shift(4, start);
      sz_cd += o.l;
      cdirs.push(o);
      sz_cd += namebuf.length;
      cdirs.push(namebuf);
      ++fcnt;
    }
    /* end of central directory */


    o = new_buf(22);
    o.write_shift(4, 0x06054b50);
    o.write_shift(2, 0);
    o.write_shift(2, 0);
    o.write_shift(2, fcnt);
    o.write_shift(2, fcnt);
    o.write_shift(4, sz_cd);
    o.write_shift(4, start_cd);
    o.write_shift(2, 0);
    return bconcat([bconcat(out), bconcat(cdirs), o]);
  }

  var ContentTypeMap = {
    "htm": "text/html",
    "xml": "text/xml",
    "gif": "image/gif",
    "jpg": "image/jpeg",
    "png": "image/png",
    "mso": "application/x-mso",
    "thmx": "application/vnd.ms-officetheme",
    "sh33tj5": "application/octet-stream"
  };

  function get_content_type(fi, fp) {
    if (fi.ctype) return fi.ctype;
    var ext = fi.name || "",
        m = ext.match(/\.([^\.]+)$/);
    if (m && ContentTypeMap[m[1]]) return ContentTypeMap[m[1]];

    if (fp) {
      m = (ext = fp).match(/[\.\\]([^\.\\])+$/);
      if (m && ContentTypeMap[m[1]]) return ContentTypeMap[m[1]];
    }

    return "application/octet-stream";
  }
  /* 76 character chunks TODO: intertwine encoding */


  function write_base64_76(bstr) {
    var data = Base64.encode(bstr);
    var o = [];

    for (var i = 0; i < data.length; i += 76) o.push(data.slice(i, i + 76));

    return o.join("\r\n") + "\r\n";
  }
  /*
  Rules for QP:
  	- escape =## applies for all non-display characters and literal "="
  	- space or tab at end of line must be encoded
  	- \r\n newlines can be preserved, but bare \r and \n must be escaped
  	- lines must not exceed 76 characters, use soft breaks =\r\n
  
  TODO: Some files from word appear to write line extensions with bare equals:
  
  ```
  <table class=3DMsoTableGrid border=3D1 cellspacing=3D0 cellpadding=3D0 width=
  ="70%"
  ```
  */


  function write_quoted_printable(text) {
    var encoded = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF=]/g, function (c) {
      var w = c.charCodeAt(0).toString(16).toUpperCase();
      return "=" + (w.length == 1 ? "0" + w : w);
    });
    encoded = encoded.replace(/ $/mg, "=20").replace(/\t$/mg, "=09");
    if (encoded.charAt(0) == "\n") encoded = "=0D" + encoded.slice(1);
    encoded = encoded.replace(/\r(?!\n)/mg, "=0D").replace(/\n\n/mg, "\n=0A").replace(/([^\r\n])\n/mg, "$1=0A");
    var o = [],
        split = encoded.split("\r\n");

    for (var si = 0; si < split.length; ++si) {
      var str = split[si];

      if (str.length == 0) {
        o.push("");
        continue;
      }

      for (var i = 0; i < str.length;) {
        var end = 76;
        var tmp = str.slice(i, i + end);
        if (tmp.charAt(end - 1) == "=") end--;else if (tmp.charAt(end - 2) == "=") end -= 2;else if (tmp.charAt(end - 3) == "=") end -= 3;
        tmp = str.slice(i, i + end);
        i += end;
        if (i < str.length) tmp += "=";
        o.push(tmp);
      }
    }

    return o.join("\r\n");
  }

  function parse_quoted_printable(data) {
    var o = [];
    /* unify long lines */

    for (var di = 0; di < data.length; ++di) {
      var line = data[di];

      while (di <= data.length && line.charAt(line.length - 1) == "=") line = line.slice(0, line.length - 1) + data[++di];

      o.push(line);
    }
    /* decode */


    for (var oi = 0; oi < o.length; ++oi) o[oi] = o[oi].replace(/=[0-9A-Fa-f]{2}/g, function ($$) {
      return String.fromCharCode(parseInt($$.slice(1), 16));
    });

    return s2a(o.join("\r\n"));
  }

  function parse_mime(cfb, data, root) {
    var fname = "",
        cte = "",
        ctype = "",
        fdata;
    var di = 0;

    for (; di < 10; ++di) {
      var line = data[di];
      if (!line || line.match(/^\s*$/)) break;
      var m = line.match(/^(.*?):\s*([^\s].*)$/);
      if (m) switch (m[1].toLowerCase()) {
        case "content-location":
          fname = m[2].trim();
          break;

        case "content-type":
          ctype = m[2].trim();
          break;

        case "content-transfer-encoding":
          cte = m[2].trim();
          break;
      }
    }

    ++di;

    switch (cte.toLowerCase()) {
      case 'base64':
        fdata = s2a(Base64.decode(data.slice(di).join("")));
        break;

      case 'quoted-printable':
        fdata = parse_quoted_printable(data.slice(di));
        break;

      default:
        throw new Error("Unsupported Content-Transfer-Encoding " + cte);
    }

    var file = cfb_add(cfb, fname.slice(root.length), fdata, {
      unsafe: true
    });
    if (ctype) file.ctype = ctype;
  }

  function parse_mad(file, options) {
    if (a2s(file.slice(0, 13)).toLowerCase() != "mime-version:") throw new Error("Unsupported MAD header");
    var root = options && options.root || ""; // $FlowIgnore

    var data = (has_buf && Buffer.isBuffer(file) ? file.toString("binary") : a2s(file)).split("\r\n");
    var di = 0,
        row = "";
    /* if root is not specified, scan for the common prefix */

    for (di = 0; di < data.length; ++di) {
      row = data[di];
      if (!/^Content-Location:/i.test(row)) continue;
      row = row.slice(row.indexOf("file"));
      if (!root) root = row.slice(0, row.lastIndexOf("/") + 1);
      if (row.slice(0, root.length) == root) continue;

      while (root.length > 0) {
        root = root.slice(0, root.length - 1);
        root = root.slice(0, root.lastIndexOf("/") + 1);
        if (row.slice(0, root.length) == root) break;
      }
    }

    var mboundary = (data[1] || "").match(/boundary="(.*?)"/);
    if (!mboundary) throw new Error("MAD cannot find boundary");
    var boundary = "--" + (mboundary[1] || "");
    var FileIndex = [],
        FullPaths = [];
    var o = {
      FileIndex: FileIndex,
      FullPaths: FullPaths
    };
    init_cfb(o);
    var start_di,
        fcnt = 0;

    for (di = 0; di < data.length; ++di) {
      var line = data[di];
      if (line !== boundary && line !== boundary + "--") continue;
      if (fcnt++) parse_mime(o, data.slice(start_di, di), root);
      start_di = di;
    }

    return o;
  }

  function write_mad(cfb, options) {
    var opts = options || {};
    var boundary = opts.boundary || "SheetJS";
    boundary = '------=' + boundary;
    var out = ['MIME-Version: 1.0', 'Content-Type: multipart/related; boundary="' + boundary.slice(2) + '"', '', '', ''];
    var root = cfb.FullPaths[0],
        fp = root,
        fi = cfb.FileIndex[0];

    for (var i = 1; i < cfb.FullPaths.length; ++i) {
      fp = cfb.FullPaths[i].slice(root.length);
      fi = cfb.FileIndex[i];
      if (!fi.size || !fi.content || fp == "\u0001Sh33tJ5") continue;
      /* Normalize filename */

      fp = fp.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF]/g, function (c) {
        return "_x" + c.charCodeAt(0).toString(16) + "_";
      }).replace(/[\u0080-\uFFFF]/g, function (u) {
        return "_u" + u.charCodeAt(0).toString(16) + "_";
      });
      /* Extract content as binary string */

      var ca = fi.content; // $FlowIgnore

      var cstr = has_buf && Buffer.isBuffer(ca) ? ca.toString("binary") : a2s(ca);
      /* 4/5 of first 1024 chars ascii -> quoted printable, else base64 */

      var dispcnt = 0,
          L = Math.min(1024, cstr.length),
          cc = 0;

      for (var csl = 0; csl <= L; ++csl) if ((cc = cstr.charCodeAt(csl)) >= 0x20 && cc < 0x80) ++dispcnt;

      var qp = dispcnt >= L * 4 / 5;
      out.push(boundary);
      out.push('Content-Location: ' + (opts.root || 'file:///C:/SheetJS/') + fp);
      out.push('Content-Transfer-Encoding: ' + (qp ? 'quoted-printable' : 'base64'));
      out.push('Content-Type: ' + get_content_type(fi, fp));
      out.push('');
      out.push(qp ? write_quoted_printable(cstr) : write_base64_76(cstr));
    }

    out.push(boundary + '--\r\n');
    return out.join("\r\n");
  }

  function cfb_new(opts) {
    var o = {};
    init_cfb(o, opts);
    return o;
  }

  function cfb_add(cfb, name, content, opts) {
    var unsafe = opts && opts.unsafe;
    if (!unsafe) init_cfb(cfb);
    var file = !unsafe && CFB.find(cfb, name);

    if (!file) {
      var fpath = cfb.FullPaths[0];
      if (name.slice(0, fpath.length) == fpath) fpath = name;else {
        if (fpath.slice(-1) != "/") fpath += "/";
        fpath = (fpath + name).replace("//", "/");
      }
      file = {
        name: filename(name),
        type: 2
      };
      cfb.FileIndex.push(file);
      cfb.FullPaths.push(fpath);
      if (!unsafe) CFB.utils.cfb_gc(cfb);
    }

    file.content = content;
    file.size = content ? content.length : 0;

    if (opts) {
      if (opts.CLSID) file.clsid = opts.CLSID;
      if (opts.mt) file.mt = opts.mt;
      if (opts.ct) file.ct = opts.ct;
    }

    return file;
  }

  function cfb_del(cfb, name) {
    init_cfb(cfb);
    var file = CFB.find(cfb, name);
    if (file) for (var j = 0; j < cfb.FileIndex.length; ++j) if (cfb.FileIndex[j] == file) {
      cfb.FileIndex.splice(j, 1);
      cfb.FullPaths.splice(j, 1);
      return true;
    }
    return false;
  }

  function cfb_mov(cfb, old_name, new_name) {
    init_cfb(cfb);
    var file = CFB.find(cfb, old_name);
    if (file) for (var j = 0; j < cfb.FileIndex.length; ++j) if (cfb.FileIndex[j] == file) {
      cfb.FileIndex[j].name = filename(new_name);
      cfb.FullPaths[j] = new_name;
      return true;
    }
    return false;
  }

  function cfb_gc(cfb) {
    rebuild_cfb(cfb, true);
  }

  exports.find = find;
  exports.read = read;
  exports.parse = parse;
  exports.write = write;
  exports.writeFile = write_file;
  exports.utils = {
    cfb_new: cfb_new,
    cfb_add: cfb_add,
    cfb_del: cfb_del,
    cfb_mov: cfb_mov,
    cfb_gc: cfb_gc,
    ReadShift: ReadShift,
    CheckField: CheckField,
    prep_blob: prep_blob,
    bconcat: bconcat,
    use_zlib: use_zlib,
    _deflateRaw: _deflate,
    _inflateRaw: _inflate,
    consts: consts
  };
  return exports;
}();

if (typeof commonjsRequire !== 'undefined' && 'object' !== 'undefined' && typeof DO_NOT_EXPORT_CFB === 'undefined') {
  module.exports = CFB;
}
});

var cfb$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), cfb, {
  'default': cfb
}));

/**
 * wrapper around SheetJS CFB to produce FAT-like compound file
 * terminology:
 * 'storage': directory in the cfb
 * 'stream' : file in the cfb
 * */
let CFBStorage = /*#__PURE__*/function () {
  /** underlying cfb container */

  /** the current path all new storages and streams will be added to*/
  function CFBStorage(cfb$1) {
    _classCallCheck(this, CFBStorage);

    _defineProperty(this, "_cfb", void 0);

    _defineProperty(this, "_path", void 0);

    this._cfb = cfb$1 || cfb.utils.cfb_new();
    this._path = '';
  }
  /**
   * add substorage to this (doesn't modify the underlying CFBContainer)
   * @param name {string} name of the subdir
   * @returns {CFBStorage} a storage that will add storage and streams to the subdir
   * */


  _createClass(CFBStorage, [{
    key: "addStorage",
    value: function addStorage(name) {
      const child = new CFBStorage(this._cfb);
      child._path = this._path + '/' + name;
      return child;
    }
    /**
     *
     */

  }, {
    key: "getStorage",
    value: function getStorage(name) {
      return this.addStorage(name);
    }
    /**
     * add a stream (file) to the cfb at the current _path. creates all parent dirs if they don't exist yet
     * should the stream already exist, this will replace the contents.
     * @param name {string} the name of the new stream
     * @param content {Uint8Array} the contents of the stream
     * @return {void}
     * */

  }, {
    key: "addStream",
    value: function addStream(name, content) {
      const entryIndex = this._getEntryIndex(name);

      if (entryIndex < 0) {
        cfb.utils.cfb_add(this._cfb, this._path + '/' + name, content);
      } else {
        this._cfb.FileIndex[entryIndex].content = content;
      }
    }
    /**
     * get the contents of a stream or an empty array
     * @param name {string} the name of the stream
     * @return {Uint8Array} the contents of the named stream, empty if it wasn't found
     * TODO: should this be absolute?
     */

  }, {
    key: "getStream",
    value: function getStream(name) {
      const entryIndex = this._getEntryIndex(name);

      return entryIndex < 0 ? Uint8Array.of() : Uint8Array.from(this._cfb.FileIndex[entryIndex].content);
    }
    /** write the contents of the cfb container to a byte array */

  }, {
    key: "toBytes",
    value: function toBytes() {
      // TODO: CFB.write may return a string if the correct option is given
      return Uint8Array.from(cfb.write(this._cfb));
    }
  }, {
    key: "_getEntryIndex",
    value: function _getEntryIndex(name) {
      return this._cfb.FullPaths.findIndex(p => p === this._path + "/" + name);
    }
  }]);

  return CFBStorage;
}();

const MessageImportance = Object.freeze({
  IMPORTANCE_LOW: 0,
  IMPORTANCE_NORMAL: 1,
  IMPORTANCE_HIGH: 2
});
const MessageIconIndex = Object.freeze({
  NewMail: 0x00000000,
  Post: 0x00000001,
  Other: 0x00000003,
  ReadMail: 0x00000100,
  UnreadMail: 0x00000101,
  SubmittedMail: 0x00000102,
  UnsentMail: 0x00000103,
  ReceiptMail: 0x00000104,
  RepliedMail: 0x00000105,
  ForwardedMail: 0x00000106,
  RemoteMail: 0x00000107,
  DeliveryReceipt: 0x00000108,
  ReadReceipt: 0x00000109,
  NondeliveryReport: 0x0000010A,
  NonReadReceipt: 0x0000010B,
  RecallSMail: 0x0000010C,
  RecallFMail: 0x0000010D,
  TrackingMail: 0x0000010E,
  OutOfOfficeMail: 0x0000011B,
  RecallMail: 0x0000011C,
  TrackedMail: 0x00000130,
  Contact: 0x00000200,
  DistributionList: 0x00000202,
  StickyNoteBlue: 0x00000300,
  StickyNoteGreen: 0x00000301,
  StickyNotePink: 0x00000302,
  StickyNoteYellow: 0x00000303,
  StickyNoteWhite: 0x00000304,
  SingleInstanceAppointment: 0x00000400,
  RecurringAppointment: 0x00000401,
  SingleInstanceMeeting: 0x00000402,
  RecurringMeeting: 0x00000403,
  MeetingRequest: 0x00000404,
  Accept: 0x00000405,
  Decline: 0x00000406,
  Tentatively: 0x00000407,
  Cancellation: 0x00000408,
  InformationalUpdate: 0x00000409,
  TaskTask: 0x00000500,
  UnassignedRecurringTask: 0x00000501,
  AssigneesTask: 0x00000502,
  AssignersTask: 0x00000503,
  TaskRequest: 0x00000504,
  TaskAcceptance: 0x00000505,
  TaskRejection: 0x00000506,
  JournalConversation: 0x00000601,
  JournalEmailMessage: 0x00000602,
  JournalMeetingRequest: 0x00000603,
  JournalMeetingResponse: 0x00000604,
  JournalTaskRequest: 0x00000606,
  JournalTaskResponse: 0x00000607,
  JournalNote: 0x00000608,
  JournalFax: 0x00000609,
  JournalPhoneCall: 0x0000060A,
  JournalLetter: 0x0000060C,
  JournalMicrosoftOfficeWord: 0x0000060D,
  JournalMicrosoftOfficeExcel: 0x0000060E,
  JournalMicrosoftOfficePowerPoint: 0x0000060F,
  JournalMicrosoftOfficeAccess: 0x00000610,
  JournalDocument: 0x00000612,
  JournalMeeting: 0x00000613,
  JournalMeetingCancellation: 0x00000614,
  JournalRemoteSession: 0x00000615
});
const MapiObjectType = Object.freeze({
  // Address book container object
  MAPI_ABCONT: 4,
  // Address book object
  MAPI_ADDRBOOK: 2,
  // Message attachment object
  MAPI_ATTACH: 7,
  // Distribution list object
  MAPI_DISTLIST: 8,
  // Folder object
  MAPI_FOLDER: 3,
  // Form object
  MAPI_FORMINFO: 12,
  // Messaging user object
  MAPI_MAILUSER: 6,
  // Message object
  MAPI_MESSAGE: 5,
  // Profile section object
  MAPI_PROFSECT: 9,
  // Session object
  MAPI_SESSION: 11,
  // Status object
  MAPI_STATUS: 10,
  // Message store object
  MAPI_STORE: 1
});
const RecipientRowDisplayType = Object.freeze({
  // A messaging user
  MessagingUser: 0x00,
  // A distribution list
  DistributionList: 0x01,
  // A forum, such as a bulletin board service or a public or shared folder
  Forum: 0x02,
  // An automated agent
  AutomatedAgent: 0x03,
  // An Address Book object defined for a large group, such as helpdesk, accounting, coordinator, or
  // department
  AddressBook: 0x04,
  // A private, personally administered distribution list
  PrivateDistributionList: 0x05,
  // An Address Book object known to be from a foreign or remote messaging system
  RemoteAddressBook: 0x06
});
const RecipientType = Object.freeze({
  // The recipient is the message originator
  Originator: 0x0000,
  // The recipient is a primary (To) recipient. Clients are required to handle primary recipients. All other types are optional.
  To: 0x0001,
  // The recipient is a carbon copy (CC) recipient, a recipient that receives a message in addition to the primary recipients.
  Cc: 0x0002,
  // The recipient is a blind carbon copy (BCC) recipient. Primary and carbon copy recipients are unaware of the existence of BCC recipients.
  Bcc: 0x0003,
  // The recipient is a resource (e.g. a room)
  Resource: 0x0004,
  // The recipient is a room (uses PR_RECIPIENT_TYPE_EXE) needs Exchange 2007 or higher
  Room: 0x0007
});
// The type of a property in the properties stream
/// </summary>
const PropertyType = Object.freeze({
  // Any: this property type value matches any type; a server MUST return the actual type in its response. Servers
  // MUST NOT return this type in response to a client request other than NspiGetIDsFromNames or the
  // RopGetPropertyIdsFromNamesROP request ([MS-OXCROPS] section 2.2.8.1). (PT_UNSPECIFIED)
  PT_UNSPECIFIED: 0x0000,
  // None: This property is a placeholder. (PT_NULL)
  PT_NULL: 0x0001,
  // 2 bytes; a 16-bit integer (PT_I2, i2, ui2)
  PT_SHORT: 0x0002,
  // 4 bytes; a 32-bit integer (PT_LONG, PT_I4, int, ui4)
  PT_LONG: 0x0003,
  // 4 bytes; a 32-bit floating point number (PT_FLOAT, PT_R4, float, r4)
  PT_FLOAT: 0x0004,
  // 8 bytes; a 64-bit floating point number (PT_DOUBLE, PT_R8, r8)
  PT_DOUBLE: 0x0005,
  // 8 bytes; a 64-bit floating point number in which the whole number part represents the number of days since
  // December 30, 1899, and the fractional part represents the fraction of a day since midnight (PT_APPTIME)
  PT_APPTIME: 0x0007,
  // 4 bytes; a 32-bit integer encoding error information as specified in section 2.4.1. (PT_ERROR)
  PT_ERROR: 0x000A,
  // 1 byte; restricted to 1 or 0 (PT_BOOLEAN. bool)
  PT_BOOLEAN: 0x000B,
  // The property value is a Component Object Model (COM) object, as specified in section 2.11.1.5. (PT_OBJECT)
  PT_OBJECT: 0x000D,
  // 8 bytes; a 64-bit integer (PT_LONGLONG, PT_I8, i8, ui8)
  PT_I8: 0x0014,
  // 8 bytes; a 64-bit integer (PT_LONGLONG, PT_I8, i8, ui8)
  PT_LONGLONG: 0x0014,
  // Variable size; a string of Unicode characters in UTF-16LE format encoding with terminating null character
  // (0x0000). (PT_UNICODE, string)
  PT_UNICODE: 0x001F,
  // Variable size; a string of multibyte characters in externally specified encoding with terminating null
  // character (single 0 byte). (PT_STRING8) ... ANSI format
  PT_STRING8: 0x001E,
  // 8 bytes; a 64-bit integer representing the number of 100-nanosecond intervals since January 1, 1601
  // (PT_SYSTIME, time, datetime, datetime.tz, datetime.rfc1123, Date, time, time.tz)
  PT_SYSTIME: 0x0040,
  // 16 bytes; a GUID with Data1, Data2, and Data3 fields in little-endian format (PT_CLSID, UUID)
  PT_CLSID: 0x0048,
  // Variable size; a 16-bit COUNT field followed by a structure as specified in section 2.11.1.4. (PT_SVREID)
  PT_SVREID: 0x00FB,
  // Variable size; a byte array representing one or more Restriction structures as specified in section 2.12.
  // (PT_SRESTRICT)
  PT_SRESTRICT: 0x00FD,
  // Variable size; a 16-bit COUNT field followed by that many rule (4) action (3) structures, as specified in
  // [MS-OXORULE] section 2.2.5. (PT_ACTIONS)
  PT_ACTIONS: 0x00FE,
  // Variable size; a COUNT field followed by that many bytes. (PT_BINARY)
  PT_BINARY: 0x0102,
  // Variable size; a COUNT field followed by that many PT_MV_SHORT values. (PT_MV_SHORT, PT_MV_I2, mv.i2)
  PT_MV_SHORT: 0x1002,
  // Variable size; a COUNT field followed by that many PT_MV_LONG values. (PT_MV_LONG, PT_MV_I4, mv.i4)
  PT_MV_LONG: 0x1003,
  // Variable size; a COUNT field followed by that many PT_MV_FLOAT values. (PT_MV_FLOAT, PT_MV_R4, mv.float)
  PT_MV_FLOAT: 0x1004,
  // Variable size; a COUNT field followed by that many PT_MV_DOUBLE values. (PT_MV_DOUBLE, PT_MV_R8)
  PT_MV_DOUBLE: 0x1005,
  // Variable size; a COUNT field followed by that many PT_MV_CURRENCY values. (PT_MV_CURRENCY, mv.fixed.14.4)
  PT_MV_CURRENCY: 0x1006,
  // Variable size; a COUNT field followed by that many PT_MV_APPTIME values. (PT_MV_APPTIME)
  PT_MV_APPTIME: 0x1007,
  // Variable size; a COUNT field followed by that many PT_MV_LONGLONGvalues. (PT_MV_I8, PT_MV_I8)
  PT_MV_LONGLONG: 0x1014,
  // Variable size; a COUNT field followed by that many PT_MV_UNICODE values. (PT_MV_UNICODE)
  PT_MV_TSTRING: 0x101F,
  // Variable size; a COUNT field followed by that many PT_MV_UNICODE values. (PT_MV_UNICODE)
  PT_MV_UNICODE: 0x101F,
  // Variable size; a COUNT field followed by that many PT_MV_STRING8 values. (PT_MV_STRING8, mv.string)
  PT_MV_STRING8: 0x101E,
  // Variable size; a COUNT field followed by that many PT_MV_SYSTIME values. (PT_MV_SYSTIME)
  PT_MV_SYSTIME: 0x1040,
  // Variable size; a COUNT field followed by that many PT_MV_CLSID values. (PT_MV_CLSID, mv.uuid)
  PT_MV_CLSID: 0x1048,
  // Variable size; a COUNT field followed by that many PT_MV_BINARY values. (PT_MV_BINARY, mv.bin.hex)
  PT_MV_BINARY: 0x1102
});
// Flags used to set on a <see cref="Structures.Property" />
// See https://msdn.microsoft.com/en-us/library/ee158556(v=exchg.80).aspx
const PropertyFlag = Object.freeze({
  // If this flag is set for a property, that property MUST NOT be deleted from the .msg file
  // (irrespective of which storage it is contained in) and implementations MUST return an error
  // if any attempt is made to do so. This flag is set in circumstances where the implementation
  // depends on that property always being present in the .msg file once it is written there.
  PROPATTR_MANDATORY: 0x00000001,
  // If this flag is not set on a property, that property MUST NOT be read from the .msg file
  // and implementations MUST return an error if any attempt is made to read it. This flag is
  // set on all properties unless there is an implementation-specific reason to prevent a property
  // from being read from the .msg file.
  PROPATTR_READABLE: 0x00000002,
  // If this flag is not set on a property, that property MUST NOT be modified or deleted and
  // implementations MUST return an error if any attempt is made to do so. This flag is set in
  // circumstances where the implementation depends on the properties being writable.
  PROPATTR_WRITABLE: 0x00000004
}); // this doesn't include combination of the flags due to flow limitations.
// don't use.

const MessageClass = Object.freeze({
  Unknown: null,
  IPM_Note: "IPM.Note",
  IPM_Note_SMIME: "IPM.Note.SMIME",
  IPM_Note_SMIME_MultipartSigned: "IPM.Note.SMIME.MultipartSigned",
  IPM_Note_Receipt_SMIME: "IPM.Note.Receipt.SMIME",
  IPM_Post: "IPM.Post",
  IPM_Octel_Voice: "IPM.Octel.Voice",
  IPM_Voicenotes: "IPM.Voicenotes",
  IPM_Sharing: "IPM.Sharing",
  REPORT_IPM_NOTE_NDR: "REPORT.IPM.NOTE.NDR",
  REPORT_IPM_NOTE_DR: "REPORT.IPM.NOTE.DR",
  REPORT_IPM_NOTE_DELAYED: "REPORT.IPM.NOTE.DELAYED",
  REPORT_IPM_NOTE_IPNRN: "*REPORT.IPM.NOTE.IPNRN",
  REPORT_IPM_NOTE_IPNNRN: "*REPORT.IPM.NOTE.IPNNRN",
  REPORT_IPM_SCHEDULE_MEETING_REQUEST_NDR: "REPORT.IPM.SCHEDULE. MEETING.REQUEST.NDR",
  REPORT_IPM_SCHEDULE_MEETING_RESP_POS_NDR: "REPORT.IPM.SCHEDULE.MEETING.RESP.POS.NDR",
  REPORT_IPM_SCHEDULE_MEETING_RESP_TENT_NDR: "REPORT.IPM.SCHEDULE.MEETING.RESP.TENT.NDR",
  REPORT_IPM_SCHEDULE_MEETING_CANCELED_NDR: "REPORT.IPM.SCHEDULE.MEETING.CANCELED.NDR",
  REPORT_IPM_NOTE_SMIME_NDR: "REPORT.IPM.NOTE.SMIME.NDR",
  REPORT_IPM_NOTE_SMIME_DR: "*REPORT.IPM.NOTE.SMIME.DR",
  REPORT_IPM_NOTE_SMIME_MULTIPARTSIGNED_NDR: "*REPORT.IPM.NOTE.SMIME.MULTIPARTSIGNED.NDR",
  REPORT_IPM_NOTE_SMIME_MULTIPARTSIGNED_DR: "*REPORT.IPM.NOTE.SMIME.MULTIPARTSIGNED.DR",
  IPM_Appointment: "IPM.Appointment",
  IPM_Task: "IPM.Task"
});
const MessageEditorFormat = Object.freeze({
  // The format for the editor to use is unknown.
  EDITOR_FORMAT_DONTKNOW: 0x00000000,
  // The editor should display the message in plain text format.
  EDITOR_FORMAT_PLAINTEXT: 0x00000001,
  // The editor should display the message in HTML format.
  EDITOR_FORMAT_HTML: 0x00000002,
  // The editor should display the message in Rich Text Format.
  EDITOR_FORMAT_RTF: 0x00000003
});
const MessageFormat = Object.freeze({
  TextOnly: 0,
  HtmlOnly: 1,
  TextAndHtml: 2
});
const MessagFlags = Object.freeze({
  // The message is marked as having been read. This can occur as the result of a call at any time to
  // IMessage::SetReadFlag or IMAPIFolder::SetReadFlags. Clients can also set this flag by calling a message's
  // IMAPIProp::SetProps method before the message has been saved for the first time. This flag is ignored if the
  // ASSOCIATED flag is set.
  MSGFLAG_READ: 0x0001,
  // The outgoing message has not been modified since the first time that it was saved; the incoming message has not
  // been modified since it was delivered.
  MSGFLAG_UNMODIFIED: 0x0002,
  // The message is marked for sending as a result of a call to IMessage::SubmitMessage. Message store providers set
  // this flag; the client has read-only access.
  MSGFLAG_SUBMIT: 0x0004,
  // The message is still being composed. It is saved, but has not been sent. The client or provider has read/write
  // access to this flag until the first IMAPIProp::SaveChanges call and read-only thereafter. If a client doesn't set
  // this flag by the time the message is sent, the message store provider sets it when IMessage::SubmitMessage is
  // called. Typically, this flag is cleared after the message is sent.
  MSGFLAG_UNSENT: 0x0008,
  // The message has at least one attachment. This flag corresponds to the message's PR_HASATTACH (PidTagHasAttachments)
  // property. The client has read-only access to this flag.
  MSGFLAG_HASATTACH: 0x0010,
  // The messaging user sending was the messaging user receiving the message. The client or provider has read/write
  // access to this flag until the first IMAPIProp::SaveChanges call and read-only thereafter. This flag is meant to be
  // set by the transport provider.
  MSGFLAG_FROMME: 0x0020,
  // The message is an associated message of a folder. The client or provider has read-only access to this flag. The
  // READ flag is ignored for associated messages, which do not retain a read/unread state.
  MSGFLAG_ASSOCIATED: 0x040,
  // The message includes a request for a resend operation with a nondelivery report. The client or provider has
  // read/write access to this flag until the first IMAPIProp::SaveChanges call and read-only thereafter.
  MSGFLAG_RESEND: 0x0080,
  // A read report needs to be sent for the message. The client or provider has read-only access to this flag.
  MSGFLAG_NOTIFYREAD: 0x100,
  // A nonread report needs to be sent for the message. The client or provider has read-only access to this flag.
  MSGFLAG_NOTIFYUNREAD: 0x0200,
  // The message has been read at least once. This flag is set or cleared by the server whenever the MSGFLAG_READ flag
  // is set or cleared.
  MSGFLAG_EVERREAD: 0x0400,
  // The incoming message arrived over an X.400 link. It originated either outside the organization or from a source the
  // gateway cannot consider trusted. The client should display an appropriate message to the user. Transport providers
  // set this flag; the client has read-only access.
  MSGFLAG_ORIGIN_X400: 0x1000,
  // The incoming message arrived over the Internet. It originated either outside the organization or from a source the
  // gateway cannot consider trusted. The client should display an appropriate message to the user. Transport providers
  // set this flag; the client has read-only access.
  MSGFLAG_ORIGIN_INTERNET: 0x2000,
  // The incoming message arrived over an external link other than X.400 or the Internet. It originated either outside
  // the organization or from a source the gateway cannot consider trusted. The client should display an appropriate
  // message to the user. Transport providers set this flag; the client has read-only access.
  MSGFLAG_ORIGIN_MISC_EXT: 0x8000
});
const MessagePriority = Object.freeze({
  PRIO_NONURGENT: 0,
  PRIO_NORMAL: 1,
  PRIO_URGENT: 2
});
const AttachmentType = Object.freeze({
  // There is no attachment
  NO_ATTACHMENT: 0x00000000,
  // The  PropertyTags.PR_ATTACH_DATA_BIN property contains the attachment data
  ATTACH_BY_VALUE: 0x00000001,
  // The "PropertyTags.PR_ATTACH_PATHNAME_W" or "PropertyTags.PR_ATTACH_LONG_PATHNAME_W"
  // property contains a fully qualified path identifying the attachment to recipients with access to a common file server
  ATTACH_BY_REFERENCE: 0x0002,
  // The "PropertyTags.PR_ATTACH_PATHNAME_W" or "PropertyTags.PR_ATTACH_LONG_PATHNAME_W"
  // property contains a fully qualified path identifying the attachment
  ATTACH_BY_REF_RESOLVE: 0x0003,
  // The "PropertyTags.PR_ATTACH_PATHNAME_W" or "PropertyTags.PR_ATTACH_LONG_PATHNAME_W"
  // property contains a fully qualified path identifying the attachment
  ATTACH_BY_REF_ONLY: 0x0004,
  // The "PropertyTags.PR_ATTACH_DATA_OBJ" (PidTagAttachDataObject) property contains an embedded object
  // that supports the IMessage interface
  ATTACH_EMBEDDED_MSG: 0x0005,
  // The attachment is an embedded OLE object
  ATTACH_OLE: 0x0006
});
const AttachmentFlags = Object.freeze({
  // Indicates that this attachment is not available to HTML rendering applications and should be ignored in
  // Multipurpose Internet Mail Extensions (MIME) processing.
  ATT_INVISIBLE_IN_HTML: 0x00000001,
  // Indicates that this attachment is not available to applications rendering in Rich Text Format (RTF) and should be
  // ignored by MAPI.
  ATT_INVISIBLE_IN_RTF: 0x00000002,
  // The Attachment object is referenced and rendered within the HTML body of the associated Message object.
  ATT_MHTML_REF: 0x00000004
});
const StoreSupportMask = Object.freeze({
  // The message store supports properties containing ANSI (8-bit) characters.
  STORE_ANSI_OK: 0x00020000,
  // The message store supports attachments (OLE or non-OLE) to messages.
  STORE_ATTACH_OK: 0x00000020,
  // The message store supports categorized views of tables.
  STORE_CATEGORIZE_OK: 0x00000400,
  // The message store supports creation of new messages.
  STORE_CREATE_OK: 0x00000010,
  // Entry identifiers for the objects in the message store are unique, that is, never reused during the life of the
  // store.
  STORE_ENTRYID_UNIQUE: 0x00000001,
  // The message store supports HTML messages, stored in the <see cref="PropertyTags.PR_HTML" /> (PidTagBodyHtml)
  // property. Note that STORE_HTML_OK is not defined in versions of MAPIDEFS.H that are included with Microsoft Exchange
  // 2000 Server and earlier. If your development environment uses a MAPIDEFS.H file that does not include STORE_HTML_OK,
  // use the value 0x00010000 instead.
  STORE_HTML_OK: 0x00010000,
  // In a wrapped PST store, indicates that when a new message arrives at the store, the store does rules and spam
  // filter processing on the message separately. The store calls IMAPISupport::Notify, setting fnevNewMail in the
  // NOTIFICATION structure that is passed as a parameter, and then passes the details of the new message to the
  // listening client. Subsequently, when the listening client receives the notification, it does not process rules on
  // the message.
  STORE_ITEMPROC: 0x00200000,
  // This flag is reserved and should not be used.
  STORE_LOCALSTORE: 0x00080000,
  // The message store supports modification of its existing messages.
  STORE_MODIFY_OK: 0x00000008,
  // The message store supports multivalued properties, guarantees the stability of value order in a multivalued
  // property throughout a save operation, and supports instantiation of multivalued properties in tables.
  STORE_MV_PROPS_OK: 0x00000200,
  // The message store supports notifications.
  STORE_NOTIFY_OK: 0x00000100,
  // The message store supports OLE attachments. The OLE data is accessible through an IStorage interface, such as that
  // available through the PR_ATTACH_DATA_OBJ (PidTagAttachDataObject) property
  STORE_OLE_OK: 0x00000040,
  // The folders in this store are public (multi-user), not private (possibly multi-instance but not multi-user).
  STORE_PUBLIC_FOLDERS: 0x00004000,
  // The MAPI Protocol Handler will not crawl the store, and the store is responsible to push any changes through
  // notifications to the indexer to have messages indexed.
  STORE_PUSHER_OK: 0x00800000,
  // All interfaces for the message store have a read-only access level.
  STORE_READONLY: 0x00000002,
  // The message store supports restrictions.
  STORE_RESTRICTION_OK: 0x00001000,
  // The message store supports Rich Text Format (RTF) messages, usually compressed, and the store itself keeps
  // <see cref="PropertyTags.PR_BODY_W" /> and <see cref="PropertyTags.PR_RTF_COMPRESSED" /> synchronized.
  STORE_RTF_OK: 0x00000800,
  // The message store supports search-results folders.
  STORE_SEARCH_OK: 0x00000004,
  // The message store supports sorting views of tables.
  STORE_SORT_OK: 0x00002000,
  // The message store supports marking a message for submission.
  STORE_SUBMIT_OK: 0x00000080,
  // The message store supports storage of RTF messages in uncompressed form. An uncompressed RTF stream is identified
  // by the value dwMagicUncompressedRTF in the stream header. The dwMagicUncompressedRTF value is defined in the
  // RTFLIB.H file
  STORE_UNCOMPRESSED_RTF: 0x00008000,
  // The message store supports properties containing Unicode characters.
  STORE_UNICODE_OK: 0x00040000
});
const StoreSupportMaskConst = StoreSupportMask.STORE_ATTACH_OK // | StoreSupportMask.STORE_CATEGORIZE_OK
| StoreSupportMask.STORE_CREATE_OK //StoreSupportMask.STORE_ENTRYID_UNIQUE
| StoreSupportMask.STORE_MODIFY_OK // | StoreSupportMask.STORE_MV_PROPS_OK
// | StoreSupportMask.STORE_OLE_OK
// | StoreSupportMask.STORE_RTF_OK
| StoreSupportMask.STORE_HTML_OK | StoreSupportMask.STORE_UNICODE_OK; // system.net.mail.MailPriority

const MailPriority = Object.freeze({
  High: 2,
  Low: 1,
  Normal: 0
});
const ContentTransferEncoding = Object.freeze({
  SevenBit: "7bit",
  EightBit: "8bit",
  QuotedPrintable: "quoted-printable",
  Base64: "base64",
  Binary: "binary"
});

/**
 *      Contains a bitmask of flags that indicate the origin and current state of a message.
 *
 *      See https://msdn.microsoft.com/en-us/library/cc839733(v=office.15).aspx
 *      This property is a nontransmittable message property exposed at both the sending and receiving ends of a
 *      transmission, with different values depending upon the client application or store provider involved. This property
 *      is initialized by the client or message store provider when a message is created and saved for the first time and
 *      then updated periodically by the message store provider, a transport provider, and the MAPI spooler as the message
 *      is processed and its state changes.
 *      This property exists on a message both before and after submission, and on all copies of the received
 *      message. Although it is not a recipient property, it is exposed differently to each recipient according to whether
 *      it has been read or modified by that recipient.
 */
const MessageFlags = Object.freeze({
  // The message is marked as having been read. This can occur as the result of a call at any time to
  // IMessage::SetReadFlag or IMAPIFolder::SetReadFlags. Clients can also set this flag by calling a message's
  // IMAPIProp::SetProps method before the message has been saved for the first time. This flag is ignored if the
  // ASSOCIATED flag is set.
  MSGFLAG_READ: 0x0001,
  // The outgoing message has not been modified since the first time that it was saved; the incoming message has not
  // been modified since it was delivered.
  MSGFLAG_UNMODIFIED: 0x0002,
  // The message is marked for sending as a result of a call to IMessage::SubmitMessage. Message store providers set
  // this flag; the client has read-only access.
  MSGFLAG_SUBMIT: 0x0004,
  // The message is still being composed. It is saved, but has not been sent. The client or provider has read/write
  // access to this flag until the first IMAPIProp::SaveChanges call and read-only thereafter. If a client doesn't set
  // this flag by the time the message is sent, the message store provider sets it when IMessage::SubmitMessage is
  // called. Typically, this flag is cleared after the message is sent.
  MSGFLAG_UNSENT: 0x0008,
  // The message has at least one attachment. This flag corresponds to the message's PR_HASATTACH (PidTagHasAttachments)
  // property. The client has read-only access to this flag.
  MSGFLAG_HASATTACH: 0x0010,
  // The messaging user sending was the messaging user receiving the message. The client or provider has read/write
  // access to this flag until the first IMAPIProp::SaveChanges call and read-only thereafter. This flag is meant to be
  // set by the transport provider.
  MSGFLAG_FROMME: 0x0020,
  // The message is an associated message of a folder. The client or provider has read-only access to this flag. The
  // READ flag is ignored for associated messages, which do not retain a read/unread state.
  MSGFLAG_ASSOCIATED: 0x040,
  // The message includes a request for a resend operation with a nondelivery report. The client or provider has
  // read/write access to this flag until the first IMAPIProp::SaveChanges call and read-only thereafter.
  MSGFLAG_RESEND: 0x0080,
  // A read report needs to be sent for the message. The client or provider has read-only access to this flag.
  MSGFLAG_NOTIFYREAD: 0x100,
  // A nonread report needs to be sent for the message. The client or provider has read-only access to this flag.
  MSGFLAG_NOTIFYUNREAD: 0x0200,
  // The message has been read at least once. This flag is set or cleared by the server whenever the MSGFLAG_READ flag
  // is set or cleared.
  MSGFLAG_EVERREAD: 0x0400,
  // The incoming message arrived over an X.400 link. It originated either outside the organization or from a source the
  // gateway cannot consider trusted. The client should display an appropriate message to the user. Transport providers
  // set this flag; the client has read-only access.
  MSGFLAG_ORIGIN_X400: 0x1000,
  // The incoming message arrived over the Internet. It originated either outside the organization or from a source the
  // gateway cannot consider trusted. The client should display an appropriate message to the user. Transport providers
  // set this flag; the client has read-only access.
  MSGFLAG_ORIGIN_INTERNET: 0x2000,
  // The incoming message arrived over an external link other than X.400 or the Internet. It originated either outside
  // the organization or from a source the gateway cannot consider trusted. The client should display an appropriate
  // message to the user. Transport providers set this flag; the client has read-only access.
  MSGFLAG_ORIGIN_MISC_EXT: 0x8000
});
/**
 * Contains a bitmask of flags indicating the operations that are available to the client for the object.
 * See https://msdn.microsoft.com/en-us/library/office/cc979218.aspx
 * This property is read-only for the client. It must be a bitwise OR of zero or more values from the following table.
 */

const MapiAccess = Object.freeze({
  // write
  MAPI_ACCESS_MODIFY: 0x00000001,
  // read
  MAPI_ACCESS_READ: 0x00000002,
  // delete
  MAPI_ACCESS_DELETE: 0x00000004,
  // Create subfolders in the folder hierarchy
  MAPI_ACCESS_CREATE_HIERARCHY: 0x00000008,
  // Create content messages
  MAPI_ACCESS_CREATE_CONTENTS: 0x00000010,
  // Create associated content messages
  MAPI_ACCESS_CREATE_ASSOCIATED: 0x00000020
});
/**
 * Kind (1 byte): The possible values for the Kind field are in the following table.
 */

const PropertyKind = Object.freeze({
  // The property is identified by the LID field (numerical named property)
  Lid: 0x00,
  // The property is identified by the Name field (string named property)
  Name: 0x01,
  // The property does not have an associated PropertyName field.
  NotAssociated: 0xFF
});

const PropertyTagLiterals = Object.freeze({
  // The prefix for a Recipient {OpenMcdf.CFStorage
  RecipientStoragePrefix: "__recip_version1.0_#",
  // The prefix for an Attachment OpenMcdf.CFStorage
  AttachmentStoragePrefix: "__attach_version1.0_#",
  // The prefix for a PropertyTag OpenMcdf.CFStream
  SubStorageStreamPrefix: "__substg1.0_",
  // The name for the properties stream
  PropertiesStreamName: "__properties_version1.0",
  // The name id storage (named property mapping storage)
  NameIdStorage: "__nameid_version1.0",
  // The EntryStream stream
  EntryStream: "__substg1.0_00030102",
  // The GuidStream stream
  GuidStream: "__substg1.0_00020102",
  // The Streams.StringStream stream
  StringStream: "__substg1.0_00040102"
});
const PropertyTags = Object.freeze({
  //property tag literals were here
  // Contains the identifier of the mode for message acknowledgment.
  PR_ACKNOWLEDGEMENT_MODE: {
    id: 0x0001,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if the sender permits auto forwarding of this message.
  PR_ALTERNATE_RECIPIENT_ALLOWED: {
    id: 0x0002,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a list of entry identifiers for users who have authorized the sending of a message.
  PR_AUTHORIZING_USERS: {
    id: 0x0003,
    type: PropertyType.PT_BINARY
  },
  // Contains a unicode comment added by the auto-forwarding agent.
  PR_AUTO_FORWARD_COMMENT_W: {
    id: 0x0004,
    type: PropertyType.PT_UNICODE
  },
  // Contains a comment added by the auto-forwarding agent.
  PR_AUTO_FORWARD_COMMENT_A: {
    id: 0x0004,
    type: PropertyType.PT_STRING8
  },
  // Contains TRUE if the client requests an X-MS-Exchange-Organization-AutoForwarded header field.
  PR_AUTO_FORWARDED: {
    id: 0x0005,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains an identifier for the algorithm used to confirm message content confidentiality.
  PR_CONTENT_CONFIDENTIALITY_ALGORITHM_ID: {
    id: 0x0006,
    type: PropertyType.PT_BINARY
  },
  // Contains a value the message sender can use to match a report with the original message.
  PR_CONTENT_CORRELATOR: {
    id: 0x0007,
    type: PropertyType.PT_BINARY
  },
  // Contains a unicode key value that enables the message recipient to identify its content.
  PR_CONTENT_IDENTIFIER_W: {
    id: 0x0008,
    type: PropertyType.PT_UNICODE
  },
  // Contains a ANSI key value that enables the message recipient to identify its content.
  PR_CONTENT_IDENTIFIER_A: {
    id: 0x0008,
    type: PropertyType.PT_STRING8
  },
  // Contains a message length, in bytes, passed to a client application or service provider to determine if a message
  // of that length can be delivered.
  PR_CONTENT_LENGTH: {
    id: 0x0009,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if a message should be returned with a nondelivery report.
  PR_CONTENT_RETURN_REQUESTED: {
    id: 0x000A,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the conversation key used in Microsoft Outlook only when locating IPM.MessageManager messages, such as the
  // message that contains download history for a Post Office Protocol (POP3) account. This property has been deprecated
  // in Exchange Server.
  PR_CONVERSATION_KEY: {
    id: 0x000B,
    type: PropertyType.PT_BINARY
  },
  // Contains the encoded information types (EITs) that are applied to a message in transit to describe conversions.
  PR_CONVERSION_EITS: {
    id: 0x000C,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if a message transfer agent (MTA) is prohibited from making message text conversions that lose
  // information.
  PR_CONVERSION_WITH_LOSS_PROHIBITED: {
    id: 0x000D,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains an identifier for the types of text in a message after conversion.
  PR_CONVERTED_EITS: {
    id: 0x000E,
    type: PropertyType.PT_BINARY
  },
  // 	Contains the date and time when a message sender wants a message delivered.
  PR_DEFERRED_DELIVERY_TIME: {
    id: 0x000F,
    type: PropertyType.PT_SYSTIME
  },
  // Contains the date and time when the original message was delivered.
  PR_DELIVER_TIME: {
    id: 0x0010,
    type: PropertyType.PT_SYSTIME
  },
  // Contains a reason why a message transfer agent (MTA) has discarded a message.
  PR_DISCARD_REASON: {
    id: 0x0011,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if disclosure of recipients is allowed.
  PR_DISCLOSURE_OF_RECIPIENTS: {
    id: 0x0012,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a history showing how a distribution list has been expanded during message transmiss
  PR_DL_EXPANSION_HISTORY: {
    id: 0x0013,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if a message transfer agent (MTA) is prohibited from expanding distribution lists.
  PR_DL_EXPANSION_PROHIBITED: {
    id: 0x0014,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the date and time when the messaging system can invalidate the content of a message.
  PR_EXPIRY_TIME: {
    id: 0x0015,
    type: PropertyType.PT_SYSTIME
  },
  // Contains the date and time when the messaging system can invalidate the content of a message.
  PR_IMPLICIT_CONVERSION_PROHIBITED: {
    id: 0x0016,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a value that indicates the message sender's opinion of the importance of a message.
  PR_IMPORTANCE: {
    id: 0x0017,
    type: PropertyType.PT_LONG
  },
  // The IpmId field represents a PR_IPM_ID MAPI property.
  PR_IPM_ID: {
    id: 0x0018,
    type: PropertyType.PT_BINARY
  },
  // Contains the latest date and time when a message transfer agent (MTA) should deliver a message.
  PR_LATEST_DELIVERY_TIME: {
    id: 0x0019,
    type: PropertyType.PT_SYSTIME
  },
  // Contains a text string that identifies the sender-defined message class, such as IPM.Note.
  PR_MESSAGE_CLASS_W: {
    id: 0x001A,
    type: PropertyType.PT_UNICODE
  },
  // Contains a text string that identifies the sender-defined message class, such as IPM.Note.
  PR_MESSAGE_CLASS_A: {
    id: 0x001A,
    type: PropertyType.PT_STRING8
  },
  // Contains a message transfer system (MTS) identifier for a message delivered to a client application.
  PR_MESSAGE_DELIVERY_ID: {
    id: 0x001B,
    type: PropertyType.PT_BINARY
  },
  // Contains a security label for a message.
  PR_MESSAGE_SECURITY_LABEL: {
    id: 0x001E,
    type: PropertyType.PT_BINARY
  },
  // Contains the identifiers of messages that this message supersedes.
  PR_OBSOLETED_IPMS: {
    id: 0x001F,
    type: PropertyType.PT_BINARY
  },
  // Contains the encoded name of the originally intended recipient of an autoforwarded message.
  PR_ORIGINALLY_INTENDED_RECIPIENT_NAME: {
    id: 0x0020,
    type: PropertyType.PT_BINARY
  },
  // Contains a copy of the original encoded information types (EITs) for message text.
  PR_ORIGINAL_EITS: {
    id: 0x0021,
    type: PropertyType.PT_BINARY
  },
  // Contains an ASN.1 certificate for the message originator.
  PR_ORIGINATOR_CERTIFICATE: {
    id: 0x0022,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if a message sender requests a delivery report for a particular recipient from the messaging system
  // before the message is placed in the message store.
  PR_ORIGINATOR_DELIVERY_REPORT_REQUESTED: {
    id: 0x0023,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the binary-encoded return address of the message originator.
  PR_ORIGINATOR_RETURN_ADDRESS: {
    id: 0x0024,
    type: PropertyType.PT_BINARY
  },
  // Was originally meant to contain a value used in correlating conversation threads. No longer supported.
  PR_PARENT_KEY: {
    id: 0x0025,
    type: PropertyType.PT_BINARY
  },
  // Contains the relative priority of a message.
  PR_PRIORITY: {
    id: 0x0026,
    type: PropertyType.PT_LONG
  },
  // Contains a binary verification value enabling a delivery report recipient to verify the origin of the original
  // message.
  PR_ORIGIN_CHECK: {
    id: 0x0027,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if a message sender requests proof that the message transfer system has submitted a message for
  // delivery to the originally intended recipient.
  PR_PROOF_OF_SUBMISSION_REQUESTED: {
    id: 0x0028,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if a message sender wants the messaging system to generate a read report when the recipient has read
  // a message.
  PR_READ_RECEIPT_REQUESTED: {
    id: 0x0029,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the date and time a delivery report is generated.
  PR_RECEIPT_TIME: {
    id: 0x002A,
    type: PropertyType.PT_SYSTIME
  },
  // Contains TRUE if recipient reassignment is prohibited.
  PR_RECIPIENT_REASSIGNMENT_PROHIBITED: {
    id: 0x002B,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains information about the route covered by a delivered message.
  PR_REDIRECTION_HISTORY: {
    id: 0x002C,
    type: PropertyType.PT_BINARY
  },
  // Contains a list of identifiers for messages to which a message is related.
  PR_RELATED_IPMS: {
    id: 0x002D,
    type: PropertyType.PT_BINARY
  },
  // Contains the sensitivity value assigned by the sender of the first version of a message — that is, the message
  // before being forwarded or replied to.
  PR_ORIGINAL_SENSITIVITY: {
    id: 0x002E,
    type: PropertyType.PT_LONG
  },
  // Contains an ASCII list of the languages incorporated in a message. UNICODE compilation.
  PR_LANGUAGES_W: {
    id: 0x002F,
    type: PropertyType.PT_UNICODE
  },
  // Contains an ASCII list of the languages incorporated in a message. Non-UNICODE compilation.
  PR_LANGUAGES_A: {
    id: 0x002F,
    type: PropertyType.PT_STRING8
  },
  // Contains the date and time by which a reply is expected for a message.
  PR_REPLY_TIME: {
    id: 0x0030,
    type: PropertyType.PT_SYSTIME
  },
  // Contains a binary tag value that the messaging system should copy to any report generated for the message.
  PR_REPORT_TAG: {
    id: 0x0031,
    type: PropertyType.PT_BINARY
  },
  // Contains the date and time when the messaging system generated a report.
  PR_REPORT_TIME: {
    id: 0x0032,
    type: PropertyType.PT_SYSTIME
  },
  // Contains TRUE if the original message is being returned with a nonread report.
  PR_RETURNED_IPM: {
    id: 0x0033,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a flag that indicates the security level of a message.
  PR_SECURITY: {
    id: 0x0034,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if this message is an incomplete copy of another message.
  PR_INCOMPLETE_COPY: {
    id: 0x0035,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a value indicating the message sender's opinion of the sensitivity of a message.
  PR_SENSITIVITY: {
    id: 0x0036,
    type: PropertyType.PT_LONG
  },
  // Contains the full subject, encoded in Unicode standard, of a message.
  PR_SUBJECT_W: {
    id: 0x0037,
    type: PropertyType.PT_UNICODE
  },
  // Contains the full subject, encoded in ANSI standard, of a message.
  PR_SUBJECT_A: {
    id: 0x0037,
    type: PropertyType.PT_STRING8
  },
  // Contains a binary value that is copied from the message for which a report is being generated.
  PR_SUBJECT_IPM: {
    id: 0x0038,
    type: PropertyType.PT_BINARY
  },
  // Contains the date and time the message sender submitted a message.
  PR_CLIENT_SUBMIT_TIME: {
    id: 0x0039,
    type: PropertyType.PT_SYSTIME
  },
  // Contains the unicode display name for the recipient that should get reports for this message.
  PR_REPORT_NAME_W: {
    id: 0x003A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the ANSI display name for the recipient that should get reports for this message.
  PR_REPORT_NAME_A: {
    id: 0x003A,
    type: PropertyType.PT_STRING8
  },
  // Contains the search key for the messaging user represented by the sender.
  PR_SENT_REPRESENTING_SEARCH_KEY: {
    id: 0x003B,
    type: PropertyType.PT_BINARY
  },
  // This property contains the content type for a submitted message.
  PR_X400_CONTENT_TYPE: {
    id: 0x003C,
    type: PropertyType.PT_BINARY
  },
  // Contains a unicode subject prefix that typically indicates some action on a messagE, such as "FW: " for forwarding.
  PR_SUBJECT_PREFIX_W: {
    id: 0x003D,
    type: PropertyType.PT_UNICODE
  },
  // Contains a ANSI subject prefix that typically indicates some action on a messagE, such as "FW: " for forwarding.
  PR_SUBJECT_PREFIX_A: {
    id: 0x003D,
    type: PropertyType.PT_STRING8
  },
  // Contains reasons why a message was not received that forms part of a non-delivery report.
  PR_NON_RECEIPT_REASON: {
    id: 0x003E,
    type: PropertyType.PT_LONG
  },
  // Contains the entry identifier of the messaging user that actually receives the message.
  PR_RECEIVED_BY_ENTRYID: {
    id: 0x003F,
    type: PropertyType.PT_BINARY
  },
  // Contains the display name of the messaging user that actually receives the message. UNICODE compilation.
  PR_RECEIVED_BY_NAME_W: {
    id: 0x0040,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name of the messaging user that actually receives the message. Non-UNICODE compilation.
  PR_RECEIVED_BY_NAME_A: {
    id: 0x0040,
    type: PropertyType.PT_STRING8
  },
  // Contains the entry identifier for the messaging user represented by the sender.
  PR_SENT_REPRESENTING_ENTRYID: {
    id: 0x0041,
    type: PropertyType.PT_BINARY
  },
  // Contains the display name for the messaging user represented by the sender. UNICODE compilation.
  PR_SENT_REPRESENTING_NAME_W: {
    id: 0x0042,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name for the messaging user represented by the sender. Non-UNICODE compilation.
  PR_SENT_REPRESENTING_NAME_A: {
    id: 0x0042,
    type: PropertyType.PT_STRING8
  },
  // Contains the display name for the messaging user represented by the receiving user. UNICODE compilation.
  PR_RCVD_REPRESENTING_NAME_W: {
    id: 0x0044,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name for the messaging user represented by the receiving user. Non-UNICODE compilation.
  PR_RCVD_REPRESENTING_NAME_A: {
    id: 0x0044,
    type: PropertyType.PT_STRING8
  },
  // Contains the entry identifier for the recipient that should get reports for this message.
  PR_REPORT_ENTRYID: {
    id: 0x0045,
    type: PropertyType.PT_BINARY
  },
  // Contains an entry identifier for the messaging user to which the messaging system should direct a read report for
  // this message.
  PR_READ_RECEIPT_ENTRYID: {
    id: 0x0046,
    type: PropertyType.PT_BINARY
  },
  // Contains a message transfer system (MTS) identifier for the message transfer agent (MTA).
  PR_MESSAGE_SUBMISSION_ID: {
    id: 0x0047,
    type: PropertyType.PT_BINARY
  },
  // Contains the date and time a transport provider passed a message to its underlying messaging system.
  PR_PROVIDER_SUBMIT_TIME: {
    id: 0x0048,
    type: PropertyType.PT_SYSTIME
  },
  // Contains the subject of an original message for use in a report about the message. UNICODE compilation.
  PR_ORIGINAL_SUBJECT_W: {
    id: 0x0049,
    type: PropertyType.PT_UNICODE
  },
  // Contains the subject of an original message for use in a report about the message. Non-UNICODE compilation.
  PR_ORIGINAL_SUBJECT_A: {
    id: 0x0049,
    type: PropertyType.PT_STRING8
  },
  // The obsolete precursor of the PR_DISCRETE_VALUES property. No longer supported.
  PR_DISC_VAL: {
    id: 0x004A,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the class of the original message for use in a report. UNICODE compilation.
  PR_ORIG_MESSAGE_CLASS_W: {
    id: 0x004B,
    type: PropertyType.PT_UNICODE
  },
  // Contains the class of the original message for use in a report. Non-UNICODE compilation.
  PR_ORIG_MESSAGE_CLASS_A: {
    id: 0x004B,
    type: PropertyType.PT_STRING8
  },
  // Contains the entry identifier of the author of the first version of a messagE, that is, the message before being
  // forwarded or replied to.
  PR_ORIGINAL_AUTHOR_ENTRYID: {
    id: 0x004C,
    type: PropertyType.PT_BINARY
  },
  // Contains the display name of the author of the first version of a messagE, that is, the message before being
  // forwarded or replied to. UNICODE compilation.
  PR_ORIGINAL_AUTHOR_NAME_W: {
    id: 0x004D,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name of the author of the first version of a messagE, that is, the message before being
  // forwarded or replied to. Non-UNICODE compilation.
  PR_ORIGINAL_AUTHOR_NAME_A: {
    id: 0x004D,
    type: PropertyType.PT_STRING8
  },
  // Contains the original submission date and time of the message in the report.
  PR_ORIGINAL_SUBMIT_TIME: {
    id: 0x004E,
    type: PropertyType.PT_SYSTIME
  },
  // Contains a sized array of entry identifiers for recipients that are to get a reply.
  PR_REPLY_RECIPIENT_ENTRIES: {
    id: 0x004F,
    type: PropertyType.PT_BINARY
  },
  // Contains a list of display names for recipients that are to get a reply. UNICODE compilation.
  PR_REPLY_RECIPIENT_NAMES_W: {
    id: 0x0050,
    type: PropertyType.PT_UNICODE
  },
  // Contains a list of display names for recipients that are to get a reply. Non-UNICODE compilation.
  PR_REPLY_RECIPIENT_NAMES_A: {
    id: 0x0050,
    type: PropertyType.PT_STRING8
  },
  // Contains the search key of the messaging user that actually receives the message.
  PR_RECEIVED_BY_SEARCH_KEY: {
    id: 0x0051,
    type: PropertyType.PT_BINARY
  },
  // Contains the search key for the messaging user represented by the receiving user.
  PR_RCVD_REPRESENTING_SEARCH_KEY: {
    id: 0x0052,
    type: PropertyType.PT_BINARY
  },
  // Contains a search key for the messaging user to which the messaging system should direct a read report for a
  // message.
  PR_READ_RECEIPT_SEARCH_KEY: {
    id: 0x0053,
    type: PropertyType.PT_BINARY
  },
  // Contains the search key for the recipient that should get reports for this message.
  PR_REPORT_SEARCH_KEY: {
    id: 0x0054,
    type: PropertyType.PT_BINARY
  },
  // Contains a copy of the original message's delivery date and time in a thread.
  PR_ORIGINAL_DELIVERY_TIME: {
    id: 0x0055,
    type: PropertyType.PT_SYSTIME
  },
  // Contains the search key of the author of the first version of a messagE, that is, the message before being
  // forwarded or replied to.
  PR_ORIGINAL_AUTHOR_SEARCH_KEY: {
    id: 0x0056,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if this messaging user is specifically named as a primary (To) recipient of this message and is not
  // part of a distribution list.
  PR_MESSAGE_TO_ME: {
    id: 0x0057,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if this messaging user is specifically named as a carbon copy (CC) recipient of this message and is
  // not part of a distribution list.
  PR_MESSAGE_CC_ME: {
    id: 0x0058,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if this messaging user is specifically named as a primary (To), carbon copy (CC), or blind carbon
  // copy (BCC) recipient of this message and is not part of a distribution list.
  PR_MESSAGE_RECIP_ME: {
    id: 0x0059,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the display name of the sender of the first version of a messagE, that is, the message before being
  // forwarded or replied to. UNICODE compilation.
  PR_ORIGINAL_SENDER_NAME_W: {
    id: 0x005A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name of the sender of the first version of a messagE, that is, the message before being
  // forwarded or replied to. Non-UNICODE compilation.
  PR_ORIGINAL_SENDER_NAME_A: {
    id: 0x005A,
    type: PropertyType.PT_STRING8
  },
  // Contains the entry identifier of the sender of the first version of a messagE, that is, the message before being
  // forwarded or replied to.
  PR_ORIGINAL_SENDER_ENTRYID: {
    id: 0x005B,
    type: PropertyType.PT_BINARY
  },
  // Contains the search key for the sender of the first version of a messagE, that is, the message before being
  // forwarded or replied to.
  PR_ORIGINAL_SENDER_SEARCH_KEY: {
    id: 0x005C,
    type: PropertyType.PT_BINARY
  },
  // Contains the display name of the messaging user on whose behalf the original message was sent. UNICODE compilation.
  PR_ORIGINAL_SENT_REPRESENTING_NAME_W: {
    id: 0x005D,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name of the messaging user on whose behalf the original message was sent. Non-UNICODE
  // compilation.
  PR_ORIGINAL_SENT_REPRESENTING_NAME_A: {
    id: 0x005D,
    type: PropertyType.PT_STRING8
  },
  // Contains the entry identifier of the messaging user on whose behalf the original message was sent.
  PR_ORIGINAL_SENT_REPRESENTING_ENTRYID: {
    id: 0x005E,
    type: PropertyType.PT_BINARY
  },
  // Contains the search key of the messaging user on whose behalf the original message was sent.
  PR_ORIGINAL_SENT_REPRESENTING_SEARCH_KEY: {
    id: 0x005F,
    type: PropertyType.PT_BINARY
  },
  // Contains the starting date and time of an appointment as managed by a scheduling application.
  PR_START_DATE: {
    id: 0x0060,
    type: PropertyType.PT_SYSTIME
  },
  // Contains the ending date and time of an appointment as managed by a scheduling application.
  PR_END_DATE: {
    id: 0x0061,
    type: PropertyType.PT_SYSTIME
  },
  // Contains an identifier for an appointment in the owner's schedule.
  PR_OWNER_APPT_ID: {
    id: 0x0062,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if the message sender wants a response to a meeting request.
  PR_RESPONSE_REQUESTED: {
    id: 0x0063,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the address type for the messaging user represented by the sender. UNICODE compilation.
  PR_SENT_REPRESENTING_ADDRTYPE_W: {
    id: 0x0064,
    type: PropertyType.PT_UNICODE
  },
  // Contains the address type for the messaging user represented by the sender. Non-UNICODE compilation.
  PR_SENT_REPRESENTING_ADDRTYPE_A: {
    id: 0x0064,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address for the messaging user represented by the sender. UNICODE compilation.
  PR_SENT_REPRESENTING_EMAIL_ADDRESS_W: {
    id: 0x0065,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address for the messaging user represented by the sender. Non-UNICODE compilation.
  PR_SENT_REPRESENTING_EMAIL_ADDRESS_A: {
    id: 0x0065,
    type: PropertyType.PT_STRING8
  },
  // Contains the address type of the sender of the first version of a messagE, that is, the message before being
  // forwarded or replied to. UNICODE compilation.
  PR_ORIGINAL_SENDER_ADDRTYPE_W: {
    id: 0x0066,
    type: PropertyType.PT_UNICODE
  },
  // Contains the address type of the sender of the first version of a messagE, that is, the message before being
  // forwarded or replied to. Non-UNICODE compilation.
  PR_ORIGINAL_SENDER_ADDRTYPE_A: {
    id: 0x0066,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address of the sender of the first version of a message, that is, the message before being
  // forwarded or replied to. UNICODE compilation.
  PR_ORIGINAL_SENDER_EMAIL_ADDRESS_W: {
    id: 0x0067,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address of the sender of the first version of a message, that is, the message before being
  // forwarded or replied to. Non-UNICODE compilation.
  PR_ORIGINAL_SENDER_EMAIL_ADDRESS_A: {
    id: 0x0067,
    type: PropertyType.PT_STRING8
  },
  // Contains the address type of the messaging user on whose behalf the original message was sent. UNICODE compilation.
  PR_ORIGINAL_SENT_REPRESENTING_ADDRTYPE_W: {
    id: 0x0068,
    type: PropertyType.PT_UNICODE
  },
  // Contains the address type of the messaging user on whose behalf the original message was sent. Non-UNICODE
  // compilation.
  PR_ORIGINAL_SENT_REPRESENTING_ADDRTYPE_A: {
    id: 0x0068,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address of the messaging user on whose behalf the original message was sent. UNICODE
  // compilation.
  PR_ORIGINAL_SENT_REPRESENTING_EMAIL_ADDRESS_W: {
    id: 0x0069,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address of the messaging user on whose behalf the original message was sent. Non-UNICODE
  // compilation.
  PR_ORIGINAL_SENT_REPRESENTING_EMAIL_ADDRESS_A: {
    id: 0x0069,
    type: PropertyType.PT_STRING8
  },
  // Contains the topic of the first message in a conversation thread. UNICODE compilation.
  PR_CONVERSATION_TOPIC_W: {
    id: 0x0070,
    type: PropertyType.PT_UNICODE
  },
  // Contains the topic of the first message in a conversation thread. Non-UNICODE compilation.
  PR_CONVERSATION_TOPIC_A: {
    id: 0x0070,
    type: PropertyType.PT_STRING8
  },
  // Contains a binary value that indicates the relative position of this message within a conversation thread.
  // See https://msdn.microsoft.com/en-us/library/office/cc842470.aspx
  PR_CONVERSATION_INDEX: {
    id: 0x0071,
    type: PropertyType.PT_BINARY
  },
  // Contains a binary value that indicates the relative position of this message within a conversation thread.
  PR_ORIGINAL_DISPLAY_BCC_W: {
    id: 0x0072,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display names of any blind carbon copy (BCC) recipients of the original message. Non-UNICODE
  // compilation.
  PR_ORIGINAL_DISPLAY_BCC_A: {
    id: 0x0072,
    type: PropertyType.PT_STRING8
  },
  // Contains the display names of any carbon copy (CC) recipients of the original message. UNICODE compilation.
  PR_ORIGINAL_DISPLAY_CC_W: {
    id: 0x0073,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display names of any carbon copy (CC) recipients of the original message. Non-UNICODE compilation.
  PR_ORIGINAL_DISPLAY_CC_A: {
    id: 0x0073,
    type: PropertyType.PT_STRING8
  },
  // Contains the display names of the primary (To) recipients of the original message. UNICODE compilation.
  PR_ORIGINAL_DISPLAY_TO_W: {
    id: 0x0074,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display names of the primary (To) recipients of the original message. Non-UNICODE compilation.
  PR_ORIGINAL_DISPLAY_TO_A: {
    id: 0x0074,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address typE, such as SMTP, for the messaging user that actually receives the message. UNICODE
  // compilation.
  PR_RECEIVED_BY_ADDRTYPE_W: {
    id: 0x0075,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address typE, such as SMTP, for the messaging user that actually receives the message.
  // Non-UNICODE compilation.
  PR_RECEIVED_BY_ADDRTYPE_A: {
    id: 0x0075,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address for the messaging user that actually receives the message. UNICODE compilation.
  PR_RECEIVED_BY_EMAIL_ADDRESS_W: {
    id: 0x0076,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address for the messaging user that actually receives the message. Non-UNICODE compilation.
  PR_RECEIVED_BY_EMAIL_ADDRESS_A: {
    id: 0x0076,
    type: PropertyType.PT_STRING8
  },
  // Contains the address type for the messaging user represented by the user actually receiving the message. UNICODE
  // compilation.
  PR_RCVD_REPRESENTING_ADDRTYPE_W: {
    id: 0x0077,
    type: PropertyType.PT_UNICODE
  },
  // Contains the address type for the messaging user represented by the user actually receiving the message.
  // Non-UNICODE compilation.
  PR_RCVD_REPRESENTING_ADDRTYPE_A: {
    id: 0x0077,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address for the messaging user represented by the receiving user. UNICODE compilation.
  PR_RCVD_REPRESENTING_EMAIL_ADDRESS_W: {
    id: 0x0078,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address for the messaging user represented by the receiving user. Non-UNICODE compilation.
  PR_RCVD_REPRESENTING_EMAIL_ADDRESS_A: {
    id: 0x0078,
    type: PropertyType.PT_STRING8
  },
  // Contains the address type of the author of the first version of a message. That is — the message before being
  // forwarded or replied to. UNICODE compilation.
  PR_ORIGINAL_AUTHOR_ADDRTYPE_W: {
    id: 0x0079,
    type: PropertyType.PT_UNICODE
  },
  // Contains the address type of the author of the first version of a message. That is — the message before being
  // forwarded or replied to. Non-UNICODE compilation.
  PR_ORIGINAL_AUTHOR_ADDRTYPE_A: {
    id: 0x0079,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address of the author of the first version of a message. That is — the message before being
  // forwarded or replied to. UNICODE compilation.
  PR_ORIGINAL_AUTHOR_EMAIL_ADDRESS_W: {
    id: 0x007A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address of the author of the first version of a message. That is — the message before being
  // forwarded or replied to. Non-UNICODE compilation.
  PR_ORIGINAL_AUTHOR_EMAIL_ADDRESS_A: {
    id: 0x007A,
    type: PropertyType.PT_STRING8
  },
  // Contains the address type of the originally intended recipient of an autoforwarded message. UNICODE compilation.
  PR_ORIGINALLY_INTENDED_RECIP_ADDRTYPE_W: {
    id: 0x007B,
    type: PropertyType.PT_UNICODE
  },
  // Contains the address type of the originally intended recipient of an autoforwarded message. Non-UNICODE
  // compilation.
  PR_ORIGINALLY_INTENDED_RECIP_ADDRTYPE_A: {
    id: 0x007B,
    type: PropertyType.PT_STRING8
  },
  // Contains the e-mail address of the originally intended recipient of an autoforwarded message. UNICODE compilation.
  PR_ORIGINALLY_INTENDED_RECIP_EMAIL_ADDRESS_W: {
    id: 0x007C,
    type: PropertyType.PT_UNICODE
  },
  // Contains the e-mail address of the originally intended recipient of an autoforwarded message. Non-UNICODE
  // compilation.
  PR_ORIGINALLY_INTENDED_RECIP_EMAIL_ADDRESS_A: {
    id: 0x007C,
    type: PropertyType.PT_STRING8
  },
  // Contains transport-specific message envelope information. Non-UNICODE compilation.
  PR_TRANSPORT_MESSAGE_HEADERS_A: {
    id: 0x007D,
    type: PropertyType.PT_STRING8
  },
  // Contains transport-specific message envelope information. UNICODE compilation.
  PR_TRANSPORT_MESSAGE_HEADERS_W: {
    id: 0x007D,
    type: PropertyType.PT_UNICODE
  },
  // Contains the converted value of the attDelegate workgroup property.
  PR_DELEGATION: {
    id: 0x007E,
    type: PropertyType.PT_BINARY
  },
  // Contains a value used to correlate a Transport Neutral Encapsulation Format (TNEF) attachment with a message
  PR_TNEF_CORRELATION_KEY: {
    id: 0x007F,
    type: PropertyType.PT_BINARY
  },
  // Contains the message text. UNICODE compilation.
  // These properties are typically used only in an interpersonal message (IPM).
  // Message stores that support Rich Text Format (RTF) ignore any changes to white space in the message text. When
  // PR_BODY is stored for the first timE, the message store also generates and stores the PR_RTF_COMPRESSED
  // (PidTagRtfCompressed) property, the RTF version of the message text. If the IMAPIProp::SaveChanges method is
  // subsequently called and PR_BODY has been modifieD, the message store calls the RTFSync function to ensure
  // synchronization with the RTF version. If only white space has been changeD, the properties are left unchanged. This
  // preserves any nontrivial RTF formatting when the message travels through non-RTF-aware clients and messaging
  // systems.
  // The value for this property must be expressed in the code page of the operating system that MAPI is running on.
  PR_BODY_W: {
    id: 0x1000,
    type: PropertyType.PT_UNICODE
  },
  // Contains the message text. Non-UNICODE compilation.
  // These properties are typically used only in an interpersonal message (IPM).
  // Message stores that support Rich Text Format (RTF) ignore any changes to white space in the message text. When
  // PR_BODY is stored for the first timE, the message store also generates and stores the PR_RTF_COMPRESSED
  // (PidTagRtfCompressed) property, the RTF version of the message text. If the IMAPIProp::SaveChanges method is
  // subsequently called and PR_BODY has been modifieD, the message store calls the RTFSync function to ensure
  // synchronization with the RTF version. If only white space has been changeD, the properties are left unchanged. This
  // preserves any nontrivial RTF formatting when the message travels through non-RTF-aware clients and messaging
  // systems.
  // The value for this property must be expressed in the code page of the operating system that MAPI is running on.
  PR_BODY_A: {
    id: 0x1000,
    type: PropertyType.PT_STRING8
  },
  // Contains optional text for a report generated by the messaging system. UNICODE compilation.
  PR_REPORT_TEXT_W: {
    id: 0x1001,
    type: PropertyType.PT_UNICODE
  },
  // Contains optional text for a report generated by the messaging system. NON-UNICODE compilation.
  PR_REPORT_TEXT_A: {
    id: 0x1001,
    type: PropertyType.PT_STRING8
  },
  // Contains information about a message originator and a distribution list expansion history.
  PR_ORIGINATOR_AND_DL_EXPANSION_HISTORY: {
    id: 0x1002,
    type: PropertyType.PT_BINARY
  },
  // Contains the display name of a distribution list where the messaging system delivers a report.
  PR_REPORTING_DL_NAME: {
    id: 0x1003,
    type: PropertyType.PT_BINARY
  },
  // Contains an identifier for the message transfer agent that generated a report.
  PR_REPORTING_MTA_CERTIFICATE: {
    id: 0x1004,
    type: PropertyType.PT_BINARY
  },
  // Contains the cyclical redundancy check (CRC) computed for the message text.
  PR_RTF_SYNC_BODY_CRC: {
    id: 0x1006,
    type: PropertyType.PT_LONG
  },
  // Contains a count of the significant characters of the message text.
  PR_RTF_SYNC_BODY_COUNT: {
    id: 0x1007,
    type: PropertyType.PT_LONG
  },
  // Contains significant characters that appear at the beginning of the message text. UNICODE compilation.
  PR_RTF_SYNC_BODY_TAG_W: {
    id: 0x1008,
    type: PropertyType.PT_UNICODE
  },
  // Contains significant characters that appear at the beginning of the message text. Non-UNICODE compilation.
  PR_RTF_SYNC_BODY_TAG_A: {
    id: 0x1008,
    type: PropertyType.PT_STRING8
  },
  // Contains the Rich Text Format (RTF) version of the message text, usually in compressed form.
  PR_RTF_COMPRESSED: {
    id: 0x1009,
    type: PropertyType.PT_BINARY
  },
  // Contains a count of the ignorable characters that appear before the significant characters of the message.
  PR_RTF_SYNC_PREFIX_COUNT: {
    id: 0x1010,
    type: PropertyType.PT_LONG
  },
  // Contains a count of the ignorable characters that appear after the significant characters of the message.
  PR_RTF_SYNC_TRAILING_COUNT: {
    id: 0x1011,
    type: PropertyType.PT_LONG
  },
  // Contains the entry identifier of the originally intended recipient of an auto-forwarded message.
  PR_ORIGINALLY_INTENDED_RECIP_ENTRYID: {
    id: 0x1012,
    type: PropertyType.PT_BINARY
  },
  // Contains the Hypertext Markup Language (HTML) version of the message text.
  // These properties contain the same message text as the <see cref="PR_BODY_CONTENT_LOCATION_W" />
  // (PidTagBodyContentLocation), but in HTML. A message store that supports HTML indicates this by setting the
  // <see cref="StoreSupportMask.STORE_HTML_OK" /> flag in its <see cref="PR_STORE_SUPPORT_MASK" />
  // (PidTagStoreSupportMask). Note <see cref="StoreSupportMask.STORE_HTML_OK" /> is not defined in versions of
  // Mapidefs.h included with Microsoft® Exchange 2000 Server and earlier. If <see cref="StoreSupportMask.STORE_HTML_OK" />
  // is undefined, use the value 0x00010000 instead.
  PR_BODY_HTML_A: {
    id: 0x1013,
    type: PropertyType.PT_STRING8
  },
  // Contains the message body text in HTML format.
  PR_HTML: {
    id: 0x1013,
    type: PropertyType.PT_BINARY
  },
  // Contains the value of a MIME Content-Location header field.
  // To set the value of these properties, MIME clients should write the desired value to a Content-Location header
  // field on a MIME entity that maps to a message body. MIME readers should copy the value of a Content-Location
  // header field on such a MIME entity to the value of these properties
  PR_BODY_CONTENT_LOCATION_A: {
    id: 0x1014,
    type: PropertyType.PT_STRING8
  },
  // Contains the value of a MIME Content-Location header field. UNICODE compilation.
  // To set the value of these properties, MIME clients should write the desired value to a Content-Location header
  // field on a MIME entity that maps to a message body. MIME readers should copy the value of a Content-Location
  // header field on such a MIME entity to the value of these properties
  PR_BODY_CONTENT_LOCATION_W: {
    id: 0x1014,
    type: PropertyType.PT_UNICODE
  },
  // Corresponds to the message ID field as specified in [RFC2822].
  // These properties should be present on all e-mail messages.
  PR_INTERNET_MESSAGE_ID_A: {
    id: 0x1035,
    type: PropertyType.PT_STRING8
  },
  // Corresponds to the message ID field as specified in [RFC2822]. UNICODE compilation.
  // These properties should be present on all e-mail messages.
  PR_INTERNET_MESSAGE_ID_W: {
    id: 0x1035,
    type: PropertyType.PT_UNICODE
  },
  // Contains the original message's PR_INTERNET_MESSAGE_ID (PidTagInternetMessageId) property value.
  // These properties must be set on all message replies.
  PR_IN_REPLY_TO_ID_A: {
    id: 0x1042,
    type: PropertyType.PT_STRING8
  },
  // Contains the original message's PR_INTERNET_MESSAGE_ID (PidTagInternetMessageId) property value. UNICODE compilation.
  // These properties should be present on all e-mail messages.
  PR_IN_REPLY_TO_ID_W: {
    id: 0x1042,
    type: PropertyType.PT_UNICODE
  },
  // Contains the value of a Multipurpose Internet Mail Extensions (MIME) message's References header field.
  // To generate a References header field, clients must set these properties to the desired value. MIME writers must copy
  // the value of these properties to the References header field. To set the value of these properties, MIME clients must
  // write the desired value to a References header field. MIME readers must copy the value of the References header field
  // to these properties. MIME readers may truncate the value of these properties if it exceeds 64KB in length.
  PR_INTERNET_REFERENCES_A: {
    id: 0x1039,
    type: PropertyType.PT_STRING8
  },
  // Contains the value of a Multipurpose Internet Mail Extensions (MIME) message's References header field. UNICODE compilation.
  // To generate a References header field, clients must set these properties to the desired value. MIME writers must copy
  // the value of these properties to the References header field. To set the value of these properties, MIME clients must
  // write the desired value to a References header field. MIME readers must copy the value of the References header field
  // to these properties. MIME readers may truncate the value of these properties if it exceeds 64KB in length.
  PR_INTERNET_REFERENCES_W: {
    id: 0x1039,
    type: PropertyType.PT_UNICODE
  },
  // Contains an ASN.1 content integrity check value that allows a message sender to protect message content from
  // disclosure to unauthorized recipients.
  PR_CONTENT_INTEGRITY_CHECK: {
    id: 0x0C00,
    type: PropertyType.PT_BINARY
  },
  // Indicates that a message sender has requested a message content conversion for a particular recipient.
  PR_EXPLICIT_CONVERSION: {
    id: 0x0C01,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if this message should be returned with a report.
  PR_IPM_RETURN_REQUESTED: {
    id: 0x0C02,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains an ASN.1 security token for a message.
  PR_MESSAGE_TOKEN: {
    id: 0x0C03,
    type: PropertyType.PT_BINARY
  },
  // Contains a diagnostic code that forms part of a nondelivery report.
  PR_NDR_REASON_CODE: {
    id: 0x0C04,
    type: PropertyType.PT_LONG
  },
  // Contains a diagnostic code that forms part of a nondelivery report.
  PR_NDR_DIAG_CODE: {
    id: 0x0C05,
    type: PropertyType.PT_LONG
  },
  PR_NON_RECEIPT_NOTIFICATION_REQUESTED: {
    id: 0x0C06,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if a message sender wants notification of non-receipt for a specified recipient.
  PR_ORIGINATOR_NON_DELIVERY_REPORT_REQUESTED: {
    id: 0x0C08,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains an entry identifier for an alternate recipient designated by the sender.
  PR_ORIGINATOR_REQUESTED_ALTERNATE_RECIPIENT: {
    id: 0x0C09,
    type: PropertyType.PT_BINARY
  },
  PR_PHYSICAL_DELIVERY_BUREAU_FAX_DELIVERY: {
    id: 0x0C0A,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if the messaging system should use a fax bureau for physical delivery of this message.
  PR_PHYSICAL_DELIVERY_MODE: {
    id: 0x0C0B,
    type: PropertyType.PT_LONG
  },
  // Contains the mode of a report to be delivered to a particular message recipient upon completion of physical message
  // delivery or delivery by the message handling system.
  PR_PHYSICAL_DELIVERY_REPORT_REQUEST: {
    id: 0x0C0C,
    type: PropertyType.PT_LONG
  },
  PR_PHYSICAL_FORWARDING_ADDRESS: {
    id: 0x0C0D,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if a message sender requests the message transfer agent to attach a physical forwarding address for a
  // message recipient.
  PR_PHYSICAL_FORWARDING_ADDRESS_REQUESTED: {
    id: 0x0C0E,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if a message sender prohibits physical message forwarding for a specific recipient.
  PR_PHYSICAL_FORWARDING_PROHIBITED: {
    id: 0x0C0F,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains an ASN.1 object identifier that is used for rendering message attachments.
  PR_PHYSICAL_RENDITION_ATTRIBUTES: {
    id: 0x0C10,
    type: PropertyType.PT_BINARY
  },
  // This property contains an ASN.1 proof of delivery value.
  PR_PROOF_OF_DELIVERY: {
    id: 0x0C11,
    type: PropertyType.PT_BINARY
  },
  // This property contains TRUE if a message sender requests proof of delivery for a particular recipient.
  PR_PROOF_OF_DELIVERY_REQUESTED: {
    id: 0x0C12,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a message recipient's ASN.1 certificate for use in a report.
  PR_RECIPIENT_CERTIFICATE: {
    id: 0x0C13,
    type: PropertyType.PT_BINARY
  },
  // This property contains a message recipient's telephone number to call to advise of the physical delivery of a
  // message. UNICODE compilation.
  PR_RECIPIENT_NUMBER_FOR_ADVICE_W: {
    id: 0x0C14,
    type: PropertyType.PT_UNICODE
  },
  // This property contains a message recipient's telephone number to call to advise of the physical delivery of a
  // message. Non-UNICODE compilation.
  PR_RECIPIENT_NUMBER_FOR_ADVICE_A: {
    id: 0x0C14,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient type for a message recipient.
  PR_RECIPIENT_TYPE: {
    id: 0x0C15,
    type: PropertyType.PT_LONG
  },
  // This property contains the type of registration used for physical delivery of a message.
  PR_REGISTERED_MAIL_TYPE: {
    id: 0x0C16,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if a message sender requests a reply from a recipient.
  PR_REPLY_REQUESTED: {
    id: 0x0C17,
    type: PropertyType.PT_BOOLEAN
  },
  // This property contains a binary array of delivery methods (service providers), in the order of a message sender's
  // preference.
  PR_REQUESTED_DELIVERY_METHOD: {
    id: 0x0C18,
    type: PropertyType.PT_LONG
  },
  // Contains the message sender's entry identifier.
  PR_SENDER_ENTRYID: {
    id: 0x0C19,
    type: PropertyType.PT_BINARY
  },
  // Contains the message sender's display name. UNICODE compilation.
  PR_SENDER_NAME_W: {
    id: 0x0C1A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the message sender's display name. Non-UNICODE compilation.
  PR_SENDER_NAME_A: {
    id: 0x0C1A,
    type: PropertyType.PT_STRING8
  },
  // Contains additional information for use in a report. UNICODE compilation.
  PR_SUPPLEMENTARY_INFO_W: {
    id: 0x0C1B,
    type: PropertyType.PT_UNICODE
  },
  // Contains additional information for use in a report. Non-UNICODE compilation.
  PR_SUPPLEMENTARY_INFO_A: {
    id: 0x0C1B,
    type: PropertyType.PT_STRING8
  },
  // This property contains the type of a message recipient for use in a report.
  PR_TYPE_OF_MTS_USER: {
    id: 0x0C1C,
    type: PropertyType.PT_LONG
  },
  // Contains the message sender's search key.
  PR_SENDER_SEARCH_KEY: {
    id: 0x0C1D,
    type: PropertyType.PT_BINARY
  },
  // Contains the message sender's e-mail address type. UNICODE compilation.
  PR_SENDER_ADDRTYPE_W: {
    id: 0x0C1E,
    type: PropertyType.PT_UNICODE
  },
  // Contains the message sender's e-mail address type. Non-UNICODE compilation.
  PR_SENDER_ADDRTYPE_A: {
    id: 0x0C1E,
    type: PropertyType.PT_STRING8
  },
  // Contains the message sender's e-mail address, encoded in Unicode standard.
  PR_SENDER_EMAIL_ADDRESS_W: {
    id: 0x0C1F,
    type: PropertyType.PT_UNICODE
  },
  // Contains the message sender's e-mail address, encoded in Non-Unicode standard.
  PR_SENDER_EMAIL_ADDRESS_A: {
    id: 0x0C1F,
    type: PropertyType.PT_STRING8
  },
  // Was originally meant to contain the current version of a message store. No longer supported.
  PR_CURRENT_VERSION: {
    id: 0x0E00,
    type: PropertyType.PT_I8
  },
  // Contains TRUE if a client application wants MAPI to delete the associated message after submission.
  PR_DELETE_AFTER_SUBMIT: {
    id: 0x0E01,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains an ASCII list of the display names of any blind carbon copy (BCC) message recipients, separated by
  // semicolons (;). UNICODE compilation.
  PR_DISPLAY_BCC_W: {
    id: 0x0E02,
    type: PropertyType.PT_UNICODE
  },
  // Contains an ASCII list of the display names of any blind carbon copy (BCC) message recipients, separated by
  // semicolons (;). Non-UNICODE compilation.
  PR_DISPLAY_BCC_A: {
    id: 0x0E02,
    type: PropertyType.PT_STRING8
  },
  // Contains an ASCII list of the display names of any carbon copy (CC) message recipients, separated by semicolons
  // (;). UNICODE compilation.
  PR_DISPLAY_CC_W: {
    id: 0x0E03,
    type: PropertyType.PT_UNICODE
  },
  // Contains an ASCII list of the display names of any carbon copy (CC) message recipients, separated by semicolons
  // (;). Non-UNICODE compilation.
  PR_DISPLAY_CC_A: {
    id: 0x0E03,
    type: PropertyType.PT_STRING8
  },
  // Contains a list of the display names of the primary (To) message recipients, separated by semicolons (;). UNICODE
  // compilation.
  PR_DISPLAY_TO_W: {
    id: 0x0E04,
    type: PropertyType.PT_UNICODE
  },
  // Contains a list of the display names of the primary (To) message recipients, separated by semicolons (;).
  // Non-UNICODE compilation.
  PR_DISPLAY_TO_A: {
    id: 0x0E04,
    type: PropertyType.PT_STRING8
  },
  // Contains the display name of the folder in which a message was found during a search. UNICODE compilation.
  PR_PARENT_DISPLAY_W: {
    id: 0x0E05,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name of the folder in which a message was found during a search. Non-UNICODE compilation.
  PR_PARENT_DISPLAY_A: {
    id: 0x0E05,
    type: PropertyType.PT_STRING8
  },
  // Contains the date and time a message was delivered.
  PR_MESSAGE_DELIVERY_TIME: {
    id: 0x0E06,
    type: PropertyType.PT_SYSTIME
  },
  // Contains a bitmask of flags indicating the origin and current state of a message.
  PR_MESSAGE_FLAGS: {
    id: 0x0E07,
    type: PropertyType.PT_LONG
  },
  // Contains the sum, in bytes, of the sizes of all properties on a message object.
  PR_MESSAGE_SIZE: {
    id: 0x0E08,
    type: PropertyType.PT_LONG
  },
  // Contains the entry identifier of the folder containing a folder or message.
  PR_PARENT_ENTRYID: {
    id: 0x0E09,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of the folder where the message should be moved after submission.
  PR_SENTMAIL_ENTRYID: {
    id: 0x0E0A,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if the sender of a message requests the correlation feature of the messaging system.
  PR_CORRELATE: {
    id: 0x0E0C,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the message transfer system (MTS) identifier used in correlating reports with sent messages.
  PR_CORRELATE_MTSID: {
    id: 0x0E0D,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if a nondelivery report applies only to discrete members of a distribution list rather than the
  // entire list.
  PR_DISCRETE_VALUES: {
    id: 0x0E0E,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if some transport provider has already accepted responsibility for delivering the message to this
  // recipient, and FALSE if the MAPI spooler considers that this transport provider should accept responsibility.
  PR_RESPONSIBILITY: {
    id: 0x0E0F,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the status of the message based on information available to the MAPI spooler.
  PR_SPOOLER_STATUS: {
    id: 0x0E10,
    type: PropertyType.PT_LONG
  },
  // Obsolete MAPI spooler property. No longer supported.
  PR_TRANSPORT_STATUS: {
    id: 0x0E11,
    type: PropertyType.PT_LONG
  },
  // Contains a table of restrictions that can be applied to a contents table to find all messages that contain
  // recipient subobjects meeting the restrictions.
  PR_MESSAGE_RECIPIENTS: {
    id: 0x0E12,
    type: PropertyType.PT_OBJECT
  },
  // Contains a table of restrictions that can be applied to a contents table to find all messages that contain
  // attachment subobjects meeting the restrictions.
  PR_MESSAGE_ATTACHMENTS: {
    id: 0x0E13,
    type: PropertyType.PT_OBJECT
  },
  // Contains a bitmask of flags indicating details about a message submission.
  PR_SUBMIT_FLAGS: {
    id: 0x0E14,
    type: PropertyType.PT_LONG
  },
  // Contains a value used by the MAPI spooler in assigning delivery responsibility among transport providers.
  PR_RECIPIENT_STATUS: {
    id: 0x0E15,
    type: PropertyType.PT_LONG
  },
  // Contains a value used by the MAPI spooler to track the progress of an outbound message through the outgoing
  // transport providers.
  PR_TRANSPORT_KEY: {
    id: 0x0E16,
    type: PropertyType.PT_LONG
  },
  PR_MSG_STATUS: {
    id: 0x0E17,
    type: PropertyType.PT_LONG
  },
  // Contains a bitmask of property tags that define the status of a message.
  PR_MESSAGE_DOWNLOAD_TIME: {
    id: 0x0E18,
    type: PropertyType.PT_LONG
  },
  // Was originally meant to contain the message store version current at the time a message was created. No longer
  // supported.
  PR_CREATION_VERSION: {
    id: 0x0E19,
    type: PropertyType.PT_I8
  },
  // Was originally meant to contain the message store version current at the time the message was last modified. No
  // longer supported.
  PR_MODIFY_VERSION: {
    id: 0x0E1A,
    type: PropertyType.PT_I8
  },
  // When true then the message contains at least one attachment.
  PR_HASATTACH: {
    id: 0x0E1B,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a circular redundancy check (CRC) value on the message text.
  PR_BODY_CRC: {
    id: 0x0E1C,
    type: PropertyType.PT_LONG
  },
  // Contains the message subject with any prefix removed. UNICODE compilation.
  // See https://msdn.microsoft.com/en-us/library/office/cc815282.aspx
  PR_NORMALIZED_SUBJECT_W: {
    id: 0x0E1D,
    type: PropertyType.PT_UNICODE
  },
  // Contains the message subject with any prefix removed. Non-UNICODE compilation.
  PR_NORMALIZED_SUBJECT_A: {
    id: 0x0E1D,
    type: PropertyType.PT_STRING8
  },
  // Contains TRUE if PR_RTF_COMPRESSED has the same text content as PR_BODY for this message.
  PR_RTF_IN_SYNC: {
    id: 0x0E1F,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the sum, in bytes, of the sizes of all properties on an attachment.
  PR_ATTACH_SIZE: {
    id: 0x0E20,
    type: PropertyType.PT_LONG
  },
  // Contains a number that uniquely identifies the attachment within its parent message.
  PR_ATTACH_NUM: {
    id: 0x0E21,
    type: PropertyType.PT_LONG
  },
  // Contains a bitmask of flags for an attachment.
  // If the PR_ATTACH_FLAGS property is zero or absent, the attachment is to be processed by all applications.
  PR_ATTACH_FLAGS: {
    id: 0x3714,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if the message requires preprocessing.
  PR_PREPROCESS: {
    id: 0x0E22,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains an identifier for the message transfer agent (MTA) that originated the message.
  PR_ORIGINATING_MTA_CERTIFICATE: {
    id: 0x0E25,
    type: PropertyType.PT_BINARY
  },
  // Contains an ASN.1 proof of submission value.
  PR_PROOF_OF_SUBMISSION: {
    id: 0x0E26,
    type: PropertyType.PT_BINARY
  },
  // The PR_ENTRYID property contains a MAPI entry identifier used to open and edit properties of a particular MAPI
  // object.
  PR_ENTRYID: {
    id: 0x0FFF,
    type: PropertyType.PT_BINARY
  },
  // Contains the type of an object
  PR_OBJECT_TYPE: {
    id: 0x0FFE,
    type: PropertyType.PT_LONG
  },
  // Contains a bitmap of a full size icon for a form.
  PR_ICON: {
    id: 0x0FFD,
    type: PropertyType.PT_BINARY
  },
  // Contains a bitmap of a half-size icon for a form.
  PR_MINI_ICON: {
    id: 0x0FFC,
    type: PropertyType.PT_BINARY
  },
  // Specifies the hexadecimal string representation of the value of the PR_STORE_ENTRYID (PidTagStoreEntryId) property
  // on the shared folder. This is a property of a sharing message.
  PR_STORE_ENTRYID: {
    id: 0x0FFB,
    type: PropertyType.PT_BINARY
  },
  // Contains the unique binary-comparable identifier (record key) of the message store in which an object resides.
  PR_STORE_RECORD_KEY: {
    id: 0x0FFA,
    type: PropertyType.PT_BINARY
  },
  // Contains a unique binary-comparable identifier for a specific object.
  PR_RECORD_KEY: {
    id: 0x0FF9,
    type: PropertyType.PT_BINARY
  },
  // Contains the mapping signature for named properties of a particular MAPI object.
  PR_MAPPING_SIGNATURE: {
    id: 0x0FF8,
    type: PropertyType.PT_BINARY
  },
  // Indicates the client's access level to the object.
  PR_ACCESS_LEVEL: {
    id: 0x0FF7,
    type: PropertyType.PT_LONG
  },
  // Contains a value that uniquely identifies a row in a table.
  PR_INSTANCE_KEY: {
    id: 0x0FF6,
    type: PropertyType.PT_BINARY
  },
  // Contains a value that indicates the type of a row in a table.
  PR_ROW_TYPE: {
    id: 0x0FF5,
    type: PropertyType.PT_LONG
  },
  // Contains a bitmask of flags indicating the operations that are available to the client for the object.
  PR_ACCESS: {
    id: 0x0FF4,
    type: PropertyType.PT_LONG
  },
  // Contains a number that indicates which icon to use when you display a group of e-mail objects.
  // This property, if it exists, is a hint to the client. The client may ignore the value of this property.
  PR_ICON_INDEX: {
    id: 0x1080,
    type: PropertyType.PT_LONG
  },
  // Specifies the last verb executed for the message item to which it is related.
  PR_LAST_VERB_EXECUTED: {
    id: 0x1081,
    type: PropertyType.PT_LONG
  },
  // Contains the time when the last verb was executed.
  PR_LAST_VERB_EXECUTION_TIME: {
    id: 0x1082,
    type: PropertyType.PT_SYSTIME
  },
  // Contains a unique identifier for a recipient in a recipient table or status table.
  PR_ROWID: {
    id: 0x3000,
    type: PropertyType.PT_LONG
  },
  // Contains the display name for a given MAPI object. UNICODE compilation.
  PR_DISPLAY_NAME_W: {
    id: 0x3001,
    type: PropertyType.PT_UNICODE
  },
  // Contains the value of the PR_DISPLAY_NAME_W (PidTagDisplayName) property. Non-UNICODE compilation.
  PR_RECIPIENT_DISPLAY_NAME_A: {
    id: 0x5FF6,
    type: PropertyType.PT_STRING8
  },
  // Contains the value of the PR_DISPLAY_NAME_W (PidTagDisplayName) property. UNICODE compilation.
  PR_RECIPIENT_DISPLAY_NAME_W: {
    id: 0x5FF6,
    type: PropertyType.PT_UNICODE
  },
  // Specifies a bit field that describes the recipient status.
  // This property is not required. The following are the individual flags that can be set.
  PR_RECIPIENT_FLAGS: {
    id: 0x5FFD,
    type: PropertyType.PT_LONG
  },
  // Contains the display name for a given MAPI object. Non-UNICODE compilation.
  PR_DISPLAY_NAME_A: {
    id: 0x3001,
    type: PropertyType.PT_STRING8
  },
  // Contains the messaging user's e-mail address type, such as SMTP. UNICODE compilation.
  // These properties are examples of the base address properties common to all messaging users.
  // It specifies which messaging system MAPI uses to handle a given message.
  // This property also determines the format of the address string in the PR_EMAIL_ADRESS(PidTagEmailAddress).
  // The string it provides can contain only the uppercase alphabetic characters from A through Z and the numbers
  // from 0 through 9.
  PR_ADDRTYPE_W: {
    id: 0x3002,
    type: PropertyType.PT_UNICODE
  },
  // Contains the messaging user's e-mail address type such as SMTP. Non-UNICODE compilation.
  PR_ADDRTYPE_A: {
    id: 0x3002,
    type: PropertyType.PT_STRING8
  },
  // Contains the messaging user's e-mail address. UNICODE compilation.
  PR_EMAIL_ADDRESS_W: {
    id: 0x3003,
    type: PropertyType.PT_UNICODE
  },
  // Contains the messaging user's SMTP e-mail address. Non-UNICODE compilation.
  PR_SMTP_ADDRESS_A: {
    id: 0x39FE,
    type: PropertyType.PT_STRING8
  },
  // Contains the messaging user's SMTP e-mail address. UNICODE compilation.
  PR_SMTP_ADDRESS_W: {
    id: 0x39FE,
    type: PropertyType.PT_UNICODE
  },
  // Contains the messaging user's 7bit e-mail address. Non-UNICODE compilation.
  PR_7BIT_DISPLAY_NAME_A: {
    id: 0x39FF,
    type: PropertyType.PT_STRING8
  },
  // Contains the messaging user's SMTP e-mail address. UNICODE compilation.
  PR_7BIT_DISPLAY_NAME_W: {
    id: 0x39FF,
    type: PropertyType.PT_UNICODE
  },
  // Contains the messaging user's e-mail address. Non-UNICODE compilation.
  PR_EMAIL_ADDRESS_A: {
    id: 0x3003,
    type: PropertyType.PT_STRING8
  },
  // Contains a comment about the purpose or content of an object. UNICODE compilation.
  PR_COMMENT_W: {
    id: 0x3004,
    type: PropertyType.PT_UNICODE
  },
  // Contains a comment about the purpose or content of an object. Non-UNICODE compilation.
  PR_COMMENT_A: {
    id: 0x3004,
    type: PropertyType.PT_STRING8
  },
  // Contains an integer that represents the relative level of indentation, or depth, of an object in a hierarchy table.
  PR_DEPTH: {
    id: 0x3005,
    type: PropertyType.PT_LONG
  },
  // Contains the vendor-defined display name for a service provider. UNICODE compilation.
  PR_PROVIDER_DISPLAY_W: {
    id: 0x3006,
    type: PropertyType.PT_UNICODE
  },
  // Contains the vendor-defined display name for a service provider. Non-UNICODE compilation.
  PR_PROVIDER_DISPLAY_A: {
    id: 0x3006,
    type: PropertyType.PT_STRING8
  },
  // Contains the creation date and time of a message.
  PR_CREATION_TIME: {
    id: 0x3007,
    type: PropertyType.PT_SYSTIME
  },
  // Contains the date and time when the object or subobject was last modified.
  PR_LAST_MODIFICATION_TIME: {
    id: 0x3008,
    type: PropertyType.PT_SYSTIME
  },
  // Contains a bitmask of flags for message services and providers.
  PR_RESOURCE_FLAGS: {
    id: 0x3009,
    type: PropertyType.PT_LONG
  },
  // Contains the base file name of the MAPI service provider dynamic-link library (DLL). UNICODE compilation.
  PR_PROVIDER_DLL_NAME_W: {
    id: 0x300A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the base file name of the MAPI service provider dynamic-link library (DLL). Non-UNICODE compilation.
  PR_PROVIDER_DLL_NAME_A: {
    id: 0x300A,
    type: PropertyType.PT_STRING8
  },
  // Contains a binary-comparable key that identifies correlated objects for a search.
  PR_SEARCH_KEY: {
    id: 0x300B,
    type: PropertyType.PT_BINARY
  },
  // Contains a MAPIUID structure of the service provider that is handling a message.
  PR_PROVIDER_UID: {
    id: 0x300C,
    type: PropertyType.PT_BINARY
  },
  // Contains the zero-based index of a service provider's position in the provider table.
  PR_PROVIDER_ORDINAL: {
    id: 0x300D,
    type: PropertyType.PT_LONG
  },
  // Contains the version of a form. UNICODE compilation.
  PR_FORM_VERSION_W: {
    id: 0x3301,
    type: PropertyType.PT_UNICODE
  },
  // Contains the version of a form. Non-UNICODE compilation.
  PR_FORM_VERSION_A: {
    id: 0x3301,
    type: PropertyType.PT_STRING8
  },
  //    //// Contains the 128-bit Object Linking and Embedding (OLE) globally unique identifier (GUID) of a form.
  //    //PR_FORM_CLSID
  //{
  //    get { return new PropertyTag(0x3302, type: PropertyType.PT_CLSID); }
  //}
  // Contains the name of a contact for information about a form. UNICODE compilation.
  PR_FORM_CONTACT_NAME_W: {
    id: 0x3303,
    type: PropertyType.PT_UNICODE
  },
  // Contains the name of a contact for information about a form. Non-UNICODE compilation.
  PR_FORM_CONTACT_NAME_A: {
    id: 0x3303,
    type: PropertyType.PT_STRING8
  },
  // Contains the category of a form. UNICODE compilation.
  PR_FORM_CATEGORY_W: {
    id: 0x3304,
    type: PropertyType.PT_UNICODE
  },
  // Contains the category of a form. Non-UNICODE compilation.
  PR_FORM_CATEGORY_A: {
    id: 0x3304,
    type: PropertyType.PT_STRING8
  },
  // Contains the subcategory of a form, as defined by a client application. UNICODE compilation.
  PR_FORM_CATEGORY_SUB_W: {
    id: 0x3305,
    type: PropertyType.PT_UNICODE
  },
  // Contains the subcategory of a form, as defined by a client application. Non-UNICODE compilation.
  PR_FORM_CATEGORY_SUB_A: {
    id: 0x3305,
    type: PropertyType.PT_STRING8
  },
  // Contains a host map of available forms.
  PR_FORM_HOST_MAP: {
    id: 0x3306,
    type: PropertyType.PT_MV_LONG
  },
  // Contains TRUE if a form is to be suppressed from display by compose menus and dialog boxes.
  PR_FORM_HIDDEN: {
    id: 0x3307,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the display name for the object that is used to design the form. UNICODE compilation.
  PR_FORM_DESIGNER_NAME_W: {
    id: 0x3308,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name for the object that is used to design the form. Non-UNICODE compilation.
  PR_FORM_DESIGNER_NAME_A: {
    id: 0x3308,
    type: PropertyType.PT_STRING8
  },
  //    //// Contains the unique identifier for the object that is used to design a form.
  //    //PR_FORM_DESIGNER_GUID
  //{
  //    get { return new PropertyTag(0x3309, type: PropertyType.PT_CLSID); }
  //}
  // Contains TRUE if a message should be composed in the current folder.
  PR_FORM_MESSAGE_BEHAVIOR: {
    id: 0x330A,
    type: PropertyType.PT_LONG
  },
  // Contains TRUE if a message store is the default message store in the message store table.
  PR_DEFAULT_STORE: {
    id: 0x3400,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a bitmask of flags that client applications query to determine the characteristics of a message store.
  PR_STORE_SUPPORT_MASK: {
    id: 0x340D,
    type: PropertyType.PT_LONG
  },
  // Contains a flag that describes the state of the message store.
  PR_STORE_STATE: {
    id: 0x340E,
    type: PropertyType.PT_LONG
  },
  // Contains a bitmask of flags that client applications should query to determine the characteristics of a message store.
  PR_STORE_UNICODE_MASK: {
    id: 0x340F,
    type: PropertyType.PT_LONG
  },
  // Was originally meant to contain the search key of the interpersonal message (IPM) root folder. No longer supported
  PR_IPM_SUBTREE_SEARCH_KEY: {
    id: 0x3410,
    type: PropertyType.PT_BINARY
  },
  // Was originally meant to contain the search key of the standard Outbox folder. No longer supported.
  PR_IPM_OUTBOX_SEARCH_KEY: {
    id: 0x3411,
    type: PropertyType.PT_BINARY
  },
  // Was originally meant to contain the search key of the standard Deleted Items folder. No longer supported.
  PR_IPM_WASTEBASKET_SEARCH_KEY: {
    id: 0x3412,
    type: PropertyType.PT_BINARY
  },
  // Was originally meant to contain the search key of the standard Sent Items folder. No longer supported.
  PR_IPM_SENTMAIL_SEARCH_KEY: {
    id: 0x3413,
    type: PropertyType.PT_BINARY
  },
  // Contains a provider-defined MAPIUID structure that indicates the type of the message store.
  PR_MDB_PROVIDER: {
    id: 0x3414,
    type: PropertyType.PT_BINARY
  },
  // Contains a table of a message store's receive folder settings.
  PR_RECEIVE_FOLDER_SETTINGS: {
    id: 0x3415,
    type: PropertyType.PT_OBJECT
  },
  // Contains a bitmask of flags that indicate the validity of the entry identifiers of the folders in a message store.
  PR_VALID_FOLDER_MASK: {
    id: 0x35DF,
    type: PropertyType.PT_LONG
  },
  // Contains the entry identifier of the root of the IPM folder subtree in the message store's folder tree.
  PR_IPM_SUBTREE_ENTRYID: {
    id: 0x35E0,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of the standard interpersonal message (IPM) Outbox folder.
  PR_IPM_OUTBOX_ENTRYID: {
    id: 0x35E2,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of the standard IPM Deleted Items folder.
  PR_IPM_WASTEBASKET_ENTRYID: {
    id: 0x35E3,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of the standard IPM Sent Items folder.
  PR_IPM_SENTMAIL_ENTRYID: {
    id: 0x35E4,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of the user-defined Views folder.
  PR_VIEWS_ENTRYID: {
    id: 0x35E5,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of the predefined common view folder.
  PR_COMMON_VIEWS_ENTRYID: {
    id: 0x35E6,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier for the folder in which search results are typically created.
  PR_FINDER_ENTRYID: {
    id: 0x35E7,
    type: PropertyType.PT_BINARY
  },
  // When TRUE, forces the serialization of SMTP and POP3 authentication requests such that the POP3 account is
  // authenticated before the SMTP account.
  PR_CE_RECEIVE_BEFORE_SEND: {
    id: 0x812D,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a bitmask of flags describing capabilities of an address book container.
  PR_CONTAINER_FLAGS: {
    id: 0x3600,
    type: PropertyType.PT_LONG
  },
  // Contains a constant that indicates the folder type.
  PR_FOLDER_TYPE: {
    id: 0x3601,
    type: PropertyType.PT_LONG
  },
  // Contains the number of messages in a folder, as computed by the message store.
  PR_CONTENT_COUNT: {
    id: 0x3602,
    type: PropertyType.PT_LONG
  },
  // Contains the number of unread messages in a folder, as computed by the message store.
  PR_CONTENT_UNREAD: {
    id: 0x3603,
    type: PropertyType.PT_LONG
  },
  // Contains an embedded table object that contains dialog box template entry identifiers.
  PR_CREATE_TEMPLATES: {
    id: 0x3604,
    type: PropertyType.PT_OBJECT
  },
  // Contains an embedded display table object.
  PR_DETAILS_TABLE: {
    id: 0x3605,
    type: PropertyType.PT_OBJECT
  },
  // Contains a container object that is used for advanced searches.
  PR_SEARCH: {
    id: 0x3607,
    type: PropertyType.PT_OBJECT
  },
  // Contains TRUE if the entry in the one-off table can be selected.
  PR_SELECTABLE: {
    id: 0x3609,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains TRUE if a folder contains subfolders.
  PR_SUBFOLDERS: {
    id: 0x360A,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a 32-bit bitmask of flags that define folder status.
  PR_STATUS: {
    id: 0x360B,
    type: PropertyType.PT_LONG
  },
  // Contains a string value for use in a property restriction on an address book container contents table. UNICODE
  // compilation
  PR_ANR_W: {
    id: 0x360C,
    type: PropertyType.PT_UNICODE
  },
  // Contains a string value for use in a property restriction on an address book container contents table. Non-UNICODE
  // compilation
  PR_ANR_A: {
    id: 0x360C,
    type: PropertyType.PT_STRING8
  },
  // No longer supported
  PR_CONTENTS_SORT_ORDER: {
    id: 0x360D,
    type: PropertyType.PT_MV_LONG
  },
  // Contains an embedded hierarchy table object that provides information about the child containers.
  PR_CONTAINER_HIERARCHY: {
    id: 0x360E,
    type: PropertyType.PT_OBJECT
  },
  // Contains an embedded contents table object that provides information about a container.
  PR_CONTAINER_CONTENTS: {
    id: 0x360F,
    type: PropertyType.PT_OBJECT
  },
  // Contains an embedded contents table object that provides information about a container.
  PR_FOLDER_ASSOCIATED_CONTENTS: {
    id: 0x3610,
    type: PropertyType.PT_OBJECT
  },
  // Contains the template entry identifier for a default distribution list.
  PR_DEF_CREATE_DL: {
    id: 0x3611,
    type: PropertyType.PT_BINARY
  },
  // Contains the template entry identifier for a default messaging user object.
  PR_DEF_CREATE_MAILUSER: {
    id: 0x3612,
    type: PropertyType.PT_BINARY
  },
  // Contains a text string describing the type of a folder. Although this property is generally ignored, versions of
  // Microsoft® Exchange Server prior to Exchange Server 2003 Mailbox Manager expect this property to be present.
  // UNICODE compilation.
  PR_CONTAINER_CLASS_W: {
    id: 0x3613,
    type: PropertyType.PT_UNICODE
  },
  // Contains a text string describing the type of a folder. Although this property is generally ignored, versions of
  // Microsoft® Exchange Server prior to Exchange Server 2003 Mailbox Manager expect this property to be present.
  // Non-UNICODE compilation.
  PR_CONTAINER_CLASS_A: {
    id: 0x3613,
    type: PropertyType.PT_STRING8
  },
  // Unknown
  PR_CONTAINER_MODIFY_VERSION: {
    id: 0x3614,
    type: PropertyType.PT_I8
  },
  // Contains an address book provider's MAPIUID structure.
  PR_AB_PROVIDER_ID: {
    id: 0x3615,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of a folder's default view.
  PR_DEFAULT_VIEW_ENTRYID: {
    id: 0x3616,
    type: PropertyType.PT_BINARY
  },
  // Contains the count of items in the associated contents table of the folder.
  PR_ASSOC_CONTENT_COUNT: {
    id: 0x3617,
    type: PropertyType.PT_LONG
  },
  // was originally meant to contain an ASN.1 object identifier specifying how the attachment should be handled during
  // transmission. No longer supported.
  PR_ATTACHMENT_X400_PARAMETERS: {
    id: 0x3700,
    type: PropertyType.PT_BINARY
  },
  // Contains the content identification header of a MIME message attachment. This property is used for MHTML support.
  // It represents the content identification header for the appropriate MIME body part. UNICODE compilation.
  PR_ATTACH_CONTENT_ID_W: {
    id: 0x3712,
    type: PropertyType.PT_UNICODE
  },
  // Contains the content identification header of a MIME message attachment. This property is used for MHTML support.
  // It represents the content identification header for the appropriate MIME body part. Non-UNICODE compilation.
  PR_ATTACH_CONTENT_ID_A: {
    id: 0x3712,
    type: PropertyType.PT_STRING8
  },
  // Contains the content location header of a MIME message attachment. This property is used for MHTML support. It
  // represents the content location header for the appropriate MIME body part. UNICODE compilation.
  PR_ATTACH_CONTENT_LOCATION_W: {
    id: 0x3713,
    type: PropertyType.PT_UNICODE
  },
  // Contains the content location header of a MIME message attachment. This property is used for MHTML support. It
  // represents the content location header for the appropriate MIME body part. UNICODE compilation.
  PR_ATTACH_CONTENT_LOCATION_A: {
    id: 0x3713,
    type: PropertyType.PT_STRING8
  },
  // Contains an attachment object typically accessed through the OLE IStorage:IUnknown interface.
  PR_ATTACH_DATA_OBJ: {
    id: 0x3701,
    type: PropertyType.PT_OBJECT
  },
  // Contains binary attachment data typically accessed through the COM IStream:IUnknown interface.
  PR_ATTACH_DATA_BIN: {
    id: 0x3701,
    type: PropertyType.PT_BINARY
  },
  // Contains an ASN.1 object identifier specifying the encoding for an attachment.
  PR_ATTACH_ENCODING: {
    id: 0x3702,
    type: PropertyType.PT_BINARY
  },
  // Contains a filename extension that indicates the document type of an attachment. UNICODE compilation.
  PR_ATTACH_EXTENSION_W: {
    id: 0x3703,
    type: PropertyType.PT_UNICODE
  },
  // Contains a filename extension that indicates the document type of an attachment. Non-UNICODE compilation.
  PR_ATTACH_EXTENSION_A: {
    id: 0x3703,
    type: PropertyType.PT_STRING8
  },
  // Contains an attachment's base filename and extension, excluding path. UNICODE compilation.
  PR_ATTACH_FILENAME_W: {
    id: 0x3704,
    type: PropertyType.PT_UNICODE
  },
  // Contains an attachment's base filename and extension, excluding path. Non-UNICODE compilation.
  PR_ATTACH_FILENAME_A: {
    id: 0x3704,
    type: PropertyType.PT_STRING8
  },
  // Contains a MAPI-defined constant representing the way the contents of an attachment can be accessed.
  PR_ATTACH_METHOD: {
    id: 0x3705,
    type: PropertyType.PT_LONG
  },
  // Contains an attachment's long filename and extension, excluding path. UNICODE compilation.
  PR_ATTACH_LONG_FILENAME_W: {
    id: 0x3707,
    type: PropertyType.PT_UNICODE
  },
  // Contains an attachment's long filename and extension, excluding path. Non-UNICODE compilation.
  PR_ATTACH_LONG_FILENAME_A: {
    id: 0x3707,
    type: PropertyType.PT_STRING8
  },
  // Contains an attachment's fully qualified path and filename. UNICODE compilation.
  PR_ATTACH_PATHNAME_W: {
    id: 0x3708,
    type: PropertyType.PT_UNICODE
  },
  // Contains an attachment's fully qualified path and filename. Non-UNICODE compilation.
  PR_ATTACH_PATHNAME_A: {
    id: 0x3708,
    type: PropertyType.PT_STRING8
  },
  // Contains a Microsoft Windows metafile with rendering information for an attachment.
  PR_ATTACH_RENDERING: {
    id: 0x3709,
    type: PropertyType.PT_BINARY
  },
  // Contains an ASN.1 object identifier specifying the application that supplied an attachment.
  PR_ATTACH_TAG: {
    id: 0x370A,
    type: PropertyType.PT_BINARY
  },
  // Contains an offset, in characters, to use in rendering an attachment within the main message text.
  PR_RENDERING_POSITION: {
    id: 0x370B,
    type: PropertyType.PT_LONG
  },
  // Contains the name of an attachment file modified so that it can be correlated with TNEF messages. UNICODE
  // compilation.
  PR_ATTACH_TRANSPORT_NAME_W: {
    id: 0x370C,
    type: PropertyType.PT_UNICODE
  },
  // Contains the name of an attachment file modified so that it can be correlated with TNEF messages. Non-UNICODE
  // compilation.
  PR_ATTACH_TRANSPORT_NAME_A: {
    id: 0x370C,
    type: PropertyType.PT_STRING8
  },
  // Contains an attachment's fully qualified long path and filename. UNICODE compilation.
  PR_ATTACH_LONG_PATHNAME_W: {
    id: 0x370D,
    type: PropertyType.PT_UNICODE
  },
  // Contains an attachment's fully qualified long path and filename. Non-UNICODE compilation.
  PR_ATTACH_LONG_PATHNAME_A: {
    id: 0x370D,
    type: PropertyType.PT_STRING8
  },
  // Contains formatting information about a Multipurpose Internet Mail Extensions (MIME) attachment. UNICODE
  // compilation.
  PR_ATTACH_MIME_TAG_W: {
    id: 0x370E,
    type: PropertyType.PT_UNICODE
  },
  // Contains formatting information about a Multipurpose Internet Mail Extensions (MIME) attachment. Non-UNICODE
  // compilation.
  PR_ATTACH_MIME_TAG_A: {
    id: 0x370E,
    type: PropertyType.PT_STRING8
  },
  // Provides file type information for a non-Windows attachment.
  PR_ATTACH_ADDITIONAL_INFO: {
    id: 0x370F,
    type: PropertyType.PT_BINARY
  },
  // Contains a value used to associate an icon with a particular row of a table.
  PR_DISPLAY_TYPE: {
    id: 0x3900,
    type: PropertyType.PT_LONG
  },
  // Contains the PR_ENTRYID (PidTagEntryId), expressed as a permanent entry ID format.
  PR_TEMPLATEID: {
    id: 0x3902,
    type: PropertyType.PT_BINARY
  },
  // These properties appear on address book objects. Obsolete.
  PR_PRIMARY_CAPABILITY: {
    id: 0x3904,
    type: PropertyType.PT_BINARY
  },
  // Contains the type of an entry, with respect to how the entry should be displayed in a row in a table for the Global
  // Address List.
  PR_DISPLAY_TYPE_EX: {
    id: 0x3905,
    type: PropertyType.PT_LONG
  },
  // Contains the recipient's account name. UNICODE compilation.
  PR_ACCOUNT_W: {
    id: 0x3A00,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's account name. Non-UNICODE compilation.
  PR_ACCOUNT_A: {
    id: 0x3A00,
    type: PropertyType.PT_STRING8
  },
  // Contains a list of entry identifiers for alternate recipients designated by the original recipient.
  PR_ALTERNATE_RECIPIENT: {
    id: 0x3A01,
    type: PropertyType.PT_BINARY
  },
  // Contains a telephone number that the message recipient can use to reach the sender. UNICODE compilation.
  PR_CALLBACK_TELEPHONE_NUMBER_W: {
    id: 0x3A02,
    type: PropertyType.PT_UNICODE
  },
  // Contains a telephone number that the message recipient can use to reach the sender. Non-UNICODE compilation.
  PR_CALLBACK_TELEPHONE_NUMBER_A: {
    id: 0x3A02,
    type: PropertyType.PT_STRING8
  },
  // Contains TRUE if message conversions are prohibited by default for the associated messaging user.
  PR_CONVERSION_PROHIBITED: {
    id: 0x3A03,
    type: PropertyType.PT_BOOLEAN
  },
  // The DiscloseRecipients field represents a PR_DISCLOSE_RECIPIENTS MAPI property.
  PR_DISCLOSE_RECIPIENTS: {
    id: 0x3A04,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a generational abbreviation that follows the full name of the recipient. UNICODE compilation.
  PR_GENERATION_W: {
    id: 0x3A05,
    type: PropertyType.PT_UNICODE
  },
  // Contains a generational abbreviation that follows the full name of the recipient. Non-UNICODE compilation.
  PR_GENERATION_A: {
    id: 0x3A05,
    type: PropertyType.PT_STRING8
  },
  // Contains the first or given name of the recipient. UNICODE compilation.
  PR_GIVEN_NAME_W: {
    id: 0x3A06,
    type: PropertyType.PT_UNICODE
  },
  // Contains the first or given name of the recipient. Non-UNICODE compilation.
  PR_GIVEN_NAME_A: {
    id: 0x3A06,
    type: PropertyType.PT_STRING8
  },
  // Contains a government identifier for the recipient. UNICODE compilation.
  PR_GOVERNMENT_ID_NUMBER_W: {
    id: 0x3A07,
    type: PropertyType.PT_UNICODE
  },
  // Contains a government identifier for the recipient. Non-UNICODE compilation.
  PR_GOVERNMENT_ID_NUMBER_A: {
    id: 0x3A07,
    type: PropertyType.PT_STRING8
  },
  // Contains the primary telephone number of the recipient's place of business. UNICODE compilation.
  PR_BUSINESS_TELEPHONE_NUMBER_W: {
    id: 0x3A08,
    type: PropertyType.PT_UNICODE
  },
  // Contains the primary telephone number of the recipient's place of business. Non-UNICODE compilation.
  PR_BUSINESS_TELEPHONE_NUMBER_A: {
    id: 0x3A08,
    type: PropertyType.PT_STRING8
  },
  // Contains the primary telephone number of the recipient's home. UNICODE compilation.
  PR_HOME_TELEPHONE_NUMBER_W: {
    id: 0x3A09,
    type: PropertyType.PT_UNICODE
  },
  // Contains the primary telephone number of the recipient's home. Non-UNICODE compilation.
  PR_HOME_TELEPHONE_NUMBER_A: {
    id: 0x3A09,
    type: PropertyType.PT_STRING8
  },
  // Contains the initials for parts of the full name of the recipient. UNICODE compilation.
  PR_INITIALS_W: {
    id: 0x3A0A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the initials for parts of the full name of the recipient. Non-UNICODE compilation.
  PR_INITIALS_A: {
    id: 0x3A0A,
    type: PropertyType.PT_STRING8
  },
  // Contains a keyword that identifies the recipient to the recipient's system administrator. UNICODE compilation.
  PR_KEYWORD_W: {
    id: 0x3A0B,
    type: PropertyType.PT_UNICODE
  },
  // Contains a keyword that identifies the recipient to the recipient's system administrator. Non-UNICODE compilation.
  PR_KEYWORD_A: {
    id: 0x3A0B,
    type: PropertyType.PT_STRING8
  },
  // Contains a value that indicates the language in which the messaging user is writing messages. UNICODE compilation.
  PR_LANGUAGE_W: {
    id: 0x3A0C,
    type: PropertyType.PT_UNICODE
  },
  // Contains a value that indicates the language in which the messaging user is writing messages. Non-UNICODE
  // compilation.
  PR_LANGUAGE_A: {
    id: 0x3A0C,
    type: PropertyType.PT_STRING8
  },
  // Contains the location of the recipient in a format that is useful to the recipient's organization. UNICODE
  // compilation.
  PR_LOCATION_W: {
    id: 0x3A0D,
    type: PropertyType.PT_UNICODE
  },
  // Contains the location of the recipient in a format that is useful to the recipient's organization. Non-UNICODE
  // compilation.
  PR_LOCATION_A: {
    id: 0x3A0D,
    type: PropertyType.PT_STRING8
  },
  // Contains TRUE if the messaging user is allowed to send and receive messages.
  PR_MAIL_PERMISSION: {
    id: 0x3A0E,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains the common name of the message handling system. UNICODE compilation.
  PR_MHS_COMMON_NAME_W: {
    id: 0x3A0F,
    type: PropertyType.PT_UNICODE
  },
  // Contains the common name of the message handling system. Non-UNICODE compilation.
  PR_MHS_COMMON_NAME_A: {
    id: 0x3A0F,
    type: PropertyType.PT_STRING8
  },
  // Contains an organizational ID number for the contact, such as an employee ID number. UNICODE compilation.
  PR_ORGANIZATIONAL_ID_NUMBER_W: {
    id: 0x3A10,
    type: PropertyType.PT_UNICODE
  },
  // Contains an organizational ID number for the contact, such as an employee ID number. Non-UNICODE compilation.
  PR_ORGANIZATIONAL_ID_NUMBER_A: {
    id: 0x3A10,
    type: PropertyType.PT_STRING8
  },
  // Contains the last or surname of the recipient. UNICODE compilation.
  PR_SURNAME_W: {
    id: 0x3A11,
    type: PropertyType.PT_UNICODE
  },
  // Contains the last or surname of the recipient. Non-UNICODE compilation.
  PR_SURNAME_A: {
    id: 0x3A11,
    type: PropertyType.PT_STRING8
  },
  // Contains the original entry identifier for an entry copied from an address book to a personal address book or other
  // writeable address book.
  PR_ORIGINAL_ENTRYID: {
    id: 0x3A12,
    type: PropertyType.PT_BINARY
  },
  // Contains the original display name for an entry copied from an address book to a personal address book or other
  // writable address book. UNICODE compilation.
  PR_ORIGINAL_DISPLAY_NAME_W: {
    id: 0x3A13,
    type: PropertyType.PT_UNICODE
  },
  // Contains the original display name for an entry copied from an address book to a personal address book or other
  // writable address book. Non-UNICODE compilation.
  PR_ORIGINAL_DISPLAY_NAME_A: {
    id: 0x3A13,
    type: PropertyType.PT_STRING8
  },
  // Contains the original search key for an entry copied from an address book to a personal address book or other
  // writeable address book.
  PR_ORIGINAL_SEARCH_KEY: {
    id: 0x3A14,
    type: PropertyType.PT_BINARY
  },
  // Contains the recipient's postal address. UNICODE compilation.
  PR_POSTAL_ADDRESS_W: {
    id: 0x3A15,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's postal address. Non-UNICODE compilation.
  PR_POSTAL_ADDRESS_A: {
    id: 0x3A15,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's company name. UNICODE compilation.
  PR_COMPANY_NAME_W: {
    id: 0x3A16,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's company name. Non-UNICODE compilation.
  PR_COMPANY_NAME_A: {
    id: 0x3A16,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's job title. UNICODE compilation.
  PR_TITLE_W: {
    id: 0x3A17,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's job title. Non-UNICODE compilation.
  PR_TITLE_A: {
    id: 0x3A17,
    type: PropertyType.PT_STRING8
  },
  // Contains a name for the department in which the recipient works. UNICODE compilation.
  PR_DEPARTMENT_NAME_W: {
    id: 0x3A18,
    type: PropertyType.PT_UNICODE
  },
  // Contains a name for the department in which the recipient works. Non-UNICODE compilation.
  PR_DEPARTMENT_NAME_A: {
    id: 0x3A18,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's office location. UNICODE compilation.
  PR_OFFICE_LOCATION_W: {
    id: 0x3A19,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's office location. Non-UNICODE compilation.
  PR_OFFICE_LOCATION_A: {
    id: 0x3A19,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's primary telephone number. UNICODE compilation.
  PR_PRIMARY_TELEPHONE_NUMBER_W: {
    id: 0x3A1A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's primary telephone number. Non-UNICODE compilation.
  PR_PRIMARY_TELEPHONE_NUMBER_A: {
    id: 0x3A1A,
    type: PropertyType.PT_STRING8
  },
  // Contains a secondary telephone number at the recipient's place of business. UNICODE compilation.
  PR_BUSINESS2_TELEPHONE_NUMBER_W: {
    id: 0x3A1B,
    type: PropertyType.PT_UNICODE
  },
  // Contains a secondary telephone number at the recipient's place of business. Non-UNICODE compilation.
  PR_BUSINESS2_TELEPHONE_NUMBER_A: {
    id: 0x3A1B,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's cellular telephone number. UNICODE compilation.
  PR_MOBILE_TELEPHONE_NUMBER_W: {
    id: 0x3A1C,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's cellular telephone number. Non-UNICODE compilation.
  PR_MOBILE_TELEPHONE_NUMBER_A: {
    id: 0x3A1C,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's radio telephone number. UNICODE compilation.
  PR_RADIO_TELEPHONE_NUMBER_W: {
    id: 0x3A1D,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's radio telephone number. Non-UNICODE compilation.
  PR_RADIO_TELEPHONE_NUMBER_A: {
    id: 0x3A1D,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's car telephone number. UNICODE compilation.
  PR_CAR_TELEPHONE_NUMBER_W: {
    id: 0x3A1E,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's car telephone number. Non-UNICODE compilation.
  PR_CAR_TELEPHONE_NUMBER_A: {
    id: 0x3A1E,
    type: PropertyType.PT_STRING8
  },
  // Contains an alternate telephone number for the recipient. UNICODE compilation.
  PR_OTHER_TELEPHONE_NUMBER_W: {
    id: 0x3A1F,
    type: PropertyType.PT_UNICODE
  },
  // Contains an alternate telephone number for the recipient. Non-UNICODE compilation.
  PR_OTHER_TELEPHONE_NUMBER_A: {
    id: 0x3A1F,
    type: PropertyType.PT_STRING8
  },
  // Contains a recipient's display name in a secure form that cannot be changed. UNICODE compilation.
  PR_TRANSMITABLE_DISPLAY_NAME_W: {
    id: 0x3A20,
    type: PropertyType.PT_UNICODE
  },
  // Contains a recipient's display name in a secure form that cannot be changed. Non-UNICODE compilation.
  PR_TRANSMITABLE_DISPLAY_NAME_A: {
    id: 0x3A20,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's pager telephone number. UNICODE compilation.
  PR_PAGER_TELEPHONE_NUMBER_W: {
    id: 0x3A21,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's pager telephone number. Non-UNICODE compilation.
  PR_PAGER_TELEPHONE_NUMBER_A: {
    id: 0x3A21,
    type: PropertyType.PT_STRING8
  },
  // Contains an ASN.1 authentication certificate for a messaging user.
  PR_USER_CERTIFICATE: {
    id: 0x3A22,
    type: PropertyType.PT_BINARY
  },
  // Contains the telephone number of the recipient's primary fax machine. UNICODE compilation.
  PR_PRIMARY_FAX_NUMBER_W: {
    id: 0x3A23,
    type: PropertyType.PT_UNICODE
  },
  // Contains the telephone number of the recipient's primary fax machine. Non-UNICODE compilation.
  PR_PRIMARY_FAX_NUMBER_A: {
    id: 0x3A23,
    type: PropertyType.PT_STRING8
  },
  // Contains the telephone number of the recipient's business fax machine. UNICODE compilation.
  PR_BUSINESS_FAX_NUMBER_W: {
    id: 0x3A24,
    type: PropertyType.PT_UNICODE
  },
  // Contains the telephone number of the recipient's business fax machine. Non-UNICODE compilation.
  PR_BUSINESS_FAX_NUMBER_A: {
    id: 0x3A24,
    type: PropertyType.PT_STRING8
  },
  // Contains the telephone number of the recipient's home fax machine. UNICODE compilation.
  PR_HOME_FAX_NUMBER_W: {
    id: 0x3A25,
    type: PropertyType.PT_UNICODE
  },
  // Contains the telephone number of the recipient's home fax machine. Non-UNICODE compilation.
  PR_HOME_FAX_NUMBER_A: {
    id: 0x3A25,
    type: PropertyType.PT_STRING8
  },
  // Contains the name of the recipient's country/region. UNICODE compilation.
  PR_COUNTRY_W: {
    id: 0x3A26,
    type: PropertyType.PT_UNICODE
  },
  // Contains the name of the recipient's country/region. Non-UNICODE compilation.
  PR_COUNTRY_A: {
    id: 0x3A26,
    type: PropertyType.PT_STRING8
  },
  // Contains the name of the recipient's locality, such as the town or city. UNICODE compilation.
  PR_LOCALITY_W: {
    id: 0x3A27,
    type: PropertyType.PT_UNICODE
  },
  // Contains the name of the recipient's locality, such as the town or city. Non-UNICODE compilation.
  PR_LOCALITY_A: {
    id: 0x3A27,
    type: PropertyType.PT_STRING8
  },
  // Contains the name of the recipient's state or province. UNICODE compilation.
  PR_STATE_OR_PROVINCE_W: {
    id: 0x3A28,
    type: PropertyType.PT_UNICODE
  },
  // Contains the name of the recipient's state or province. Non-UNICODE compilation.
  PR_STATE_OR_PROVINCE_A: {
    id: 0x3A28,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's street address. UNICODE compilation.
  PR_STREET_ADDRESS_W: {
    id: 0x3A29,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's street address. Non-UNICODE compilation.
  PR_STREET_ADDRESS_A: {
    id: 0x3A29,
    type: PropertyType.PT_STRING8
  },
  // Contains the postal code for the recipient's postal address. UNICODE compilation.
  PR_POSTAL_CODE_W: {
    id: 0x3A2A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the postal code for the recipient's postal address. Non-UNICODE compilation.
  PR_POSTAL_CODE_A: {
    id: 0x3A2A,
    type: PropertyType.PT_STRING8
  },
  // Contains the number or identifier of the recipient's post office box. UNICODE compilation.
  PR_POST_OFFICE_BOX_W: {
    id: 0x3A2B,
    type: PropertyType.PT_UNICODE
  },
  // Contains the number or identifier of the recipient's post office box. Non-UNICODE compilation.
  PR_POST_OFFICE_BOX_A: {
    id: 0x3A2B,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's telex number. UNICODE compilation.
  PR_TELEX_NUMBER_W: {
    id: 0x3A2C,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's telex number. Non-UNICODE compilation.
  PR_TELEX_NUMBER_A: {
    id: 0x3A2C,
    type: PropertyType.PT_STRING8
  },
  // Contains the recipient's ISDN-capable telephone number. UNICODE compilation.
  PR_ISDN_NUMBER_W: {
    id: 0x3A2D,
    type: PropertyType.PT_UNICODE
  },
  // Contains the recipient's ISDN-capable telephone number. Non-UNICODE compilation.
  PR_ISDN_NUMBER_A: {
    id: 0x3A2D,
    type: PropertyType.PT_STRING8
  },
  // Contains the telephone number of the recipient's administrative assistant. UNICODE compilation.
  PR_ASSISTANT_TELEPHONE_NUMBER_W: {
    id: 0x3A2E,
    type: PropertyType.PT_UNICODE
  },
  // Contains the telephone number of the recipient's administrative assistant. Non-UNICODE compilation.
  PR_ASSISTANT_TELEPHONE_NUMBER_A: {
    id: 0x3A2E,
    type: PropertyType.PT_STRING8
  },
  // Contains a secondary telephone number at the recipient's home. UNICODE compilation.
  PR_HOME2_TELEPHONE_NUMBER_W: {
    id: 0x3A2F,
    type: PropertyType.PT_UNICODE
  },
  // Contains a secondary telephone number at the recipient's home. Non-UNICODE compilation.
  PR_HOME2_TELEPHONE_NUMBER_A: {
    id: 0x3A2F,
    type: PropertyType.PT_STRING8
  },
  // Contains the name of the recipient's administrative assistant. UNICODE compilation.
  PR_ASSISTANT_W: {
    id: 0x3A30,
    type: PropertyType.PT_UNICODE
  },
  // Contains the name of the recipient's administrative assistant. Non-UNICODE compilation.
  PR_ASSISTANT_A: {
    id: 0x3A30,
    type: PropertyType.PT_STRING8
  },
  // Contains TRUE if the recipient can receive all message content, including Rich Text Format (RTF) and Object Linking
  // and Embedding (OLE) objects.
  PR_SEND_RICH_INFO: {
    id: 0x3A40,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a list of identifiers of message store providers in the current profile.
  PR_STORE_PROVIDERS: {
    id: 0x3D00,
    type: PropertyType.PT_BINARY
  },
  // Contains a list of identifiers for address book providers in the current profile.
  PR_AB_PROVIDERS: {
    id: 0x3D01,
    type: PropertyType.PT_BINARY
  },
  // Contains a list of identifiers of transport providers in the current profile.
  PR_TRANSPORT_PROVIDERS: {
    id: 0x3D02,
    type: PropertyType.PT_BINARY
  },
  // Contains TRUE if a messaging user profile is the MAPI default profile.
  PR_DEFAULT_PROFILE: {
    id: 0x3D04,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a list of entry identifiers for address book containers that are to be searched to resolve names.
  PR_AB_SEARCH_PATH: {
    id: 0x3D05,
    type: PropertyType.PT_MV_BINARY
  },
  // Contains the entry identifier of the address book container to display first.
  PR_AB_DEFAULT_DIR: {
    id: 0x3D06,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of the address book container to use as the personal address book (PAB).
  PR_AB_DEFAULT_PAB: {
    id: 0x3D07,
    type: PropertyType.PT_BINARY
  },
  // The MAPI property PR_FILTERING_HOOKS.
  PR_FILTERING_HOOKS: {
    id: 0x3D08,
    type: PropertyType.PT_BINARY
  },
  // Contains the unicode name of a message service as set by the user in the MapiSvc.inf file.
  PR_SERVICE_NAME_W: {
    id: 0x3D09,
    type: PropertyType.PT_UNICODE
  },
  // Contains the ANSI name of a message service as set by the user in the MapiSvc.inf file.
  PR_SERVICE_NAME_A: {
    id: 0x3D09,
    type: PropertyType.PT_STRING8
  },
  // Contains the unicode filename of the DLL containing the message service provider entry point function to call for
  // configuration.
  PR_SERVICE_DLL_NAME_W: {
    id: 0x3D0A,
    type: PropertyType.PT_UNICODE
  },
  // Contains the ANSI filename of the DLL containing the message service provider entry point function to call for
  // configuration.
  PR_SERVICE_DLL_NAME_A: {
    id: 0x3D0A,
    type: PropertyType.PT_STRING8
  },
  // Contains the MAPIUID structure for a message service.
  PR_SERVICE_UID: {
    id: 0x3D0C,
    type: PropertyType.PT_BINARY
  },
  // Contains a list of MAPIUID structures that identify additional profile sections for the message service.
  PR_SERVICE_EXTRA_UIDS: {
    id: 0x3D0D,
    type: PropertyType.PT_BINARY
  },
  // Contains a list of identifiers of message services in the current profile.
  PR_SERVICES: {
    id: 0x3D0E,
    type: PropertyType.PT_BINARY
  },
  // Contains a ANSI list of the files that belong to the message service.
  PR_SERVICE_SUPPORT_FILES_W: {
    id: 0x3D0F,
    type: PropertyType.PT_MV_UNICODE
  },
  // Contains a ANSI list of the files that belong to the message service.
  PR_SERVICE_SUPPORT_FILES_A: {
    id: 0x3D0F,
    type: PropertyType.PT_MV_STRING8
  },
  // Contains a list of unicode filenames that are to be deleted when the message service is uninstalled.
  PR_SERVICE_DELETE_FILES_W: {
    id: 0x3D10,
    type: PropertyType.PT_MV_UNICODE
  },
  // Contains a list of filenames that are to be deleted when the message service is uninstalled.
  PR_SERVICE_DELETE_FILES_A: {
    id: 0x3D10,
    type: PropertyType.PT_MV_STRING8
  },
  // Contains a list of entry identifiers for address book containers explicitly configured by the user.
  PR_AB_SEARCH_PATH_UPDATE: {
    id: 0x3D11,
    type: PropertyType.PT_BINARY
  },
  // Contains the ANSI name of the profile.
  PR_PROFILE_NAME_A: {
    id: 0x3D12,
    type: PropertyType.PT_STRING8
  },
  // Contains the unicode name of the profile.
  PR_PROFILE_NAME_W: {
    id: 0x3D12,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name for a service provider's identity as defined within a messaging system. UNICODE
  // compilation.
  PR_IDENTITY_DISPLAY_W: {
    id: 0x3E00,
    type: PropertyType.PT_UNICODE
  },
  // Contains the display name for a service provider's identity as defined within a messaging system. Non-UNICODE
  // compilation.
  PR_IDENTITY_DISPLAY_A: {
    id: 0x3E00,
    type: PropertyType.PT_STRING8
  },
  // Contains the entry identifier for a service provider's identity as defined within a messaging system.
  PR_IDENTITY_ENTRYID: {
    id: 0x3E01,
    type: PropertyType.PT_BINARY
  },
  // Contains a bitmask of flags indicating the methods in the IMAPIStatus interface that are supported by the status
  // object.
  PR_RESOURCE_METHODS: {
    id: 0x3E02,
    type: PropertyType.PT_LONG
  },
  // Contains a value indicating the service provider type.
  PR_RESOURCE_TYPE: {
    id: 0x3E03,
    type: PropertyType.PT_LONG
  },
  // Contains a bitmask of flags indicating the current status of a session resource. All service providers set status
  // codes as does MAPI to report on the status of the subsystem, the MAPI spooler, and the integrated address book.
  PR_STATUS_CODE: {
    id: 0x3E04,
    type: PropertyType.PT_LONG
  },
  // Contains the search key for a service provider's identity as defined within a messaging system.
  PR_IDENTITY_SEARCH_KEY: {
    id: 0x3E05,
    type: PropertyType.PT_BINARY
  },
  // Contains the entry identifier of a transport's tightly coupled message store.
  PR_OWN_STORE_ENTRYID: {
    id: 0x3E06,
    type: PropertyType.PT_BINARY
  },
  // Contains a path to the service provider's server. UNICODE compilation.
  PR_RESOURCE_PATH_W: {
    id: 0x3E07,
    type: PropertyType.PT_UNICODE
  },
  // Contains a path to the service provider's server. Non-UNICODE compilation.
  PR_RESOURCE_PATH_A: {
    id: 0x3E07,
    type: PropertyType.PT_STRING8
  },
  // Contains an ASCII message indicating the current status of a session resource. UNICODE compilation.
  PR_STATUS_STRING_W: {
    id: 0x3E08,
    type: PropertyType.PT_UNICODE
  },
  // Contains an ASCII message indicating the current status of a session resource. Non-UNICODE compilation.
  PR_STATUS_STRING_A: {
    id: 0x3E08,
    type: PropertyType.PT_STRING8
  },
  // Was originally meant to contain TRUE if the message transfer system (MTS) allows X.400 deferred delivery
  // cancellation. No longer supported.
  PR_X400_DEFERRED_DELIVERY_CANCEL: {
    id: 0x3E09,
    type: PropertyType.PT_BOOLEAN
  },
  // Was originally meant to contain the entry identifier that a remote transport provider furnishes for its header
  // folder. No longer supported.
  PR_HEADER_FOLDER_ENTRYID: {
    id: 0x3E0A,
    type: PropertyType.PT_BINARY
  },
  // Contains a number indicating the status of a remote transfer.
  PR_REMOTE_PROGRESS: {
    id: 0x3E0B,
    type: PropertyType.PT_LONG
  },
  // Contains an ASCII string indicating the status of a remote transfer. UNICODE compilation.
  PR_REMOTE_PROGRESS_TEXT_W: {
    id: 0x3E0C,
    type: PropertyType.PT_UNICODE
  },
  // Contains an ASCII string indicating the status of a remote transfer. Non-UNICODE compilation.
  PR_REMOTE_PROGRESS_TEXT_A: {
    id: 0x3E0C,
    type: PropertyType.PT_STRING8
  },
  // Contains TRUE if the remote viewer is allowed to call the IMAPIStatus::ValidateState method.
  PR_REMOTE_VALIDATE_OK: {
    id: 0x3E0D,
    type: PropertyType.PT_BOOLEAN
  },
  // Contains a bitmask of flags governing the behavior of a control used in a dialog box built from a display table.
  PR_CONTROL_FLAGS: {
    id: 0x3F00,
    type: PropertyType.PT_LONG
  },
  // Contains a pointer to a structure for a control used in a dialog box.
  PR_CONTROL_STRUCTURE: {
    id: 0x3F01,
    type: PropertyType.PT_BINARY
  },
  // Contains a value indicating a control type for a control used in a dialog box.
  PR_CONTROL_TYPE: {
    id: 0x3F02,
    type: PropertyType.PT_LONG
  },
  // Contains the width of a dialog box control in standard Windows dialog units.
  PR_DELTAX: {
    id: 0x3F03,
    type: PropertyType.PT_LONG
  },
  // Contains the height of a dialog box control in standard Windows dialog units.
  PR_DELTAY: {
    id: 0x3F04,
    type: PropertyType.PT_LONG
  },
  // Contains the x coordinate of the starting position (the upper-left corner) of a dialog box control, in standard
  // Windows dialog units.
  PR_XPOS: {
    id: 0x3F05,
    type: PropertyType.PT_LONG
  },
  // Contains the y coordinate of the starting position (the upper-left corner) of a dialog box control, in standard
  // Windows dialog units.
  PR_YPOS: {
    id: 0x3F06,
    type: PropertyType.PT_LONG
  },
  // Contains a unique identifier for a control used in a dialog box.
  PR_CONTROL_ID: {
    id: 0x3F07,
    type: PropertyType.PT_BINARY
  },
  // Indicates the page of a display template to display first.
  PR_INITIAL_DETAILS_PANE: {
    id: 0x3F08,
    type: PropertyType.PT_LONG
  },
  // Contains the Windows LCID of the end user who created this message.
  PR_MESSAGE_LOCALE_ID: {
    id: 0x3F08,
    type: PropertyType.PT_LONG
  },
  // Indicates the code page used for <see cref="PropertyTags.PR_BODY_W" /> (PidTagBody) or
  // <see cref="PropertyTags.PR_HTML" /> (PidTagBodyHtml) properties.
  PR_INTERNET_CPID: {
    id: 0x3FDE,
    type: PropertyType.PT_LONG
  },
  // The creators address type
  PR_CreatorAddrType_W: {
    id: 0x4022,
    type: PropertyType.PT_UNICODE
  },
  // The creators e-mail address
  PR_CreatorEmailAddr_W: {
    id: 0x4023,
    type: PropertyType.PT_UNICODE
  },
  // The creators display name
  PR_CreatorSimpleDispName_W: {
    id: 0x4038,
    type: PropertyType.PT_UNICODE
  },
  // The senders display name
  PR_SenderSimpleDispName_W: {
    id: 0x4030,
    type: PropertyType.PT_UNICODE
  },
  // Indicates the type of Message object to which this attachment is linked.
  // Must be 0, unless overridden by other protocols that extend the
  // Message and Attachment Object Protocol as noted in [MS-OXCMSG].
  PR_ATTACHMENT_LINKID: {
    id: 0x7FFA,
    type: PropertyType.PT_LONG
  },
  // Indicates special handling for this Attachment object.
  // Must be 0x00000000, unless overridden by other protocols that extend the Message
  // and Attachment Object Protocol as noted in [MS-OXCMSG]
  PR_ATTACHMENT_FLAGS: {
    id: 0x7FFD,
    type: PropertyType.PT_LONG
  },
  // Indicates whether an attachment is hidden from the end user.
  PR_ATTACHMENT_HIDDEN: {
    id: 0x7FFE,
    type: PropertyType.PT_BOOLEAN
  },
  // Specifies the format for an editor to use to display a message.
  // By default, mail messages (with the message class IPM.Note or with a custom message
  // class derived from IPM.Note) sent from a POP3/SMTP mail account are sent in the Transport
  // Neutral Encapsulation Format (TNEF). The PR_MSG_EDITOR_FORMAT property can be used to enforce
  // only plain text, and not TNEF, when sending a message. If PR_MSG_EDITOR_FORMAT is set to
  // EDITOR_FORMAT_PLAINTEXT, the message is sent as plain text without TNEF. If PR_MSG_EDITOR_FORMAT
  // is set to EDITOR_FORMAT_RTF, TNEF encoding is implicitly enabled, and the message is sent by using
  // the default Internet format that is specified in the Outlook client.
  PR_MSG_EDITOR_FORMAT: {
    id: 0x5909,
    type: PropertyType.PT_LONG
  }
});

/** https://stackoverflow.com/a/15550284
 * Convert a Microsoft OADate to ECMAScript Date
 * Treat all values as local.
 * OADate = number of days since 30 dec 1899 as a double value
 * @param {string|number} oaDate - OADate value
 * @returns {Date}
 */
function oADateToDate(oaDate) {
  // Treat integer part as whole days
  const days = parseInt(oaDate); // Treat decimal part as part of 24hr day, always +ve

  const ms = Math.abs((oaDate - days) * 8.64e7); // Add days and add ms

  return new Date(1899, 11, 30 + days, 0, 0, 0, ms);
}

const FILE_TIME_UNIX_EPOCH_DIFF_MS = 11644473600n; // $FlowIgnore[bigint-unsupported]

const MS_TO_100_NS = 10000n; // Date: milliseconds since 1. January 1970 (UTC)
// FileTime: unsigned 64 Bit, 100ns units since 1. January 1601 (UTC)
// ms between 01.01.1970 and 01.01.1601: 11644473600
// $FlowIgnore[bigint-unsupported]

function fileTimeToDate(fileTime) {
  const filetimeMillis = fileTime / MS_TO_100_NS;
  const unixtime = filetimeMillis - FILE_TIME_UNIX_EPOCH_DIFF_MS;
  return new Date(Number(unixtime));
} // $FlowIgnore[bigint-unsupported]

function dateToFileTime(date) {
  const unixtime = BigInt(date.getTime());
  return (unixtime + FILE_TIME_UNIX_EPOCH_DIFF_MS) * MS_TO_100_NS;
}

/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>
 Copyright 2009 The Closure Library Authors. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS-IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var long = createCommonjsModule(function (module) {
/**
 * @license long.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/long.js for details
 */
(function (global, factory) {
  /* AMD */
  if (typeof commonjsRequire === 'function' && 'object' === "object" && module && module["exports"]) module["exports"] = factory();
    /* Global */
    else (global["dcodeIO"] = global["dcodeIO"] || {})["Long"] = factory();
})(commonjsGlobal, function () {
  /**
   * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
   *  See the from* functions below for more convenient ways of constructing Longs.
   * @exports Long
   * @class A Long class for representing a 64 bit two's-complement integer value.
   * @param {number} low The low (signed) 32 bits of the long
   * @param {number} high The high (signed) 32 bits of the long
   * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
   * @constructor
   */

  function Long(low, high, unsigned) {
    /**
     * The low 32 bits as a signed value.
     * @type {number}
     */
    this.low = low | 0;
    /**
     * The high 32 bits as a signed value.
     * @type {number}
     */

    this.high = high | 0;
    /**
     * Whether unsigned or not.
     * @type {boolean}
     */

    this.unsigned = !!unsigned;
  } // The internal representation of a long is the two given signed, 32-bit values.
  // We use 32-bit pieces because these are the size of integers on which
  // Javascript performs bit-operations.  For operations like addition and
  // multiplication, we split each number into 16 bit pieces, which can easily be
  // multiplied within Javascript's floating-point representation without overflow
  // or change in sign.
  //
  // In the algorithms below, we frequently reduce the negative case to the
  // positive case by negating the input(s) and then post-processing the result.
  // Note that we must ALWAYS check specially whether those values are MIN_VALUE
  // (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
  // a positive number, it overflows back into a negative).  Not handling this
  // case would often result in infinite recursion.
  //
  // Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
  // methods on which they depend.

  /**
   * An indicator used to reliably determine if an object is a Long or not.
   * @type {boolean}
   * @const
   * @private
   */


  Long.prototype.__isLong__;
  Object.defineProperty(Long.prototype, "__isLong__", {
    value: true,
    enumerable: false,
    configurable: false
  });
  /**
   * @function
   * @param {*} obj Object
   * @returns {boolean}
   * @inner
   */

  function isLong(obj) {
    return (obj && obj["__isLong__"]) === true;
  }
  /**
   * Tests if the specified object is a Long.
   * @function
   * @param {*} obj Object
   * @returns {boolean}
   */


  Long.isLong = isLong;
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @inner
   */

  var INT_CACHE = {};
  /**
   * A cache of the Long representations of small unsigned integer values.
   * @type {!Object}
   * @inner
   */

  var UINT_CACHE = {};
  /**
   * @param {number} value
   * @param {boolean=} unsigned
   * @returns {!Long}
   * @inner
   */

  function fromInt(value, unsigned) {
    var obj, cachedObj, cache;

    if (unsigned) {
      value >>>= 0;

      if (cache = 0 <= value && value < 256) {
        cachedObj = UINT_CACHE[value];
        if (cachedObj) return cachedObj;
      }

      obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
      if (cache) UINT_CACHE[value] = obj;
      return obj;
    } else {
      value |= 0;

      if (cache = -128 <= value && value < 128) {
        cachedObj = INT_CACHE[value];
        if (cachedObj) return cachedObj;
      }

      obj = fromBits(value, value < 0 ? -1 : 0, false);
      if (cache) INT_CACHE[value] = obj;
      return obj;
    }
  }
  /**
   * Returns a Long representing the given 32 bit integer value.
   * @function
   * @param {number} value The 32 bit integer in question
   * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
   * @returns {!Long} The corresponding Long value
   */


  Long.fromInt = fromInt;
  /**
   * @param {number} value
   * @param {boolean=} unsigned
   * @returns {!Long}
   * @inner
   */

  function fromNumber(value, unsigned) {
    if (isNaN(value) || !isFinite(value)) return unsigned ? UZERO : ZERO;

    if (unsigned) {
      if (value < 0) return UZERO;
      if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
    } else {
      if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
      if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
    }

    if (value < 0) return fromNumber(-value, unsigned).neg();
    return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
  }
  /**
   * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
   * @function
   * @param {number} value The number in question
   * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
   * @returns {!Long} The corresponding Long value
   */


  Long.fromNumber = fromNumber;
  /**
   * @param {number} lowBits
   * @param {number} highBits
   * @param {boolean=} unsigned
   * @returns {!Long}
   * @inner
   */

  function fromBits(lowBits, highBits, unsigned) {
    return new Long(lowBits, highBits, unsigned);
  }
  /**
   * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
   *  assumed to use 32 bits.
   * @function
   * @param {number} lowBits The low 32 bits
   * @param {number} highBits The high 32 bits
   * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
   * @returns {!Long} The corresponding Long value
   */


  Long.fromBits = fromBits;
  /**
   * @function
   * @param {number} base
   * @param {number} exponent
   * @returns {number}
   * @inner
   */

  var pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)

  /**
   * @param {string} str
   * @param {(boolean|number)=} unsigned
   * @param {number=} radix
   * @returns {!Long}
   * @inner
   */

  function fromString(str, unsigned, radix) {
    if (str.length === 0) throw Error('empty string');
    if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity") return ZERO;

    if (typeof unsigned === 'number') {
      // For goog.math.long compatibility
      radix = unsigned, unsigned = false;
    } else {
      unsigned = !!unsigned;
    }

    radix = radix || 10;
    if (radix < 2 || 36 < radix) throw RangeError('radix');
    var p;
    if ((p = str.indexOf('-')) > 0) throw Error('interior hyphen');else if (p === 0) {
      return fromString(str.substring(1), unsigned, radix).neg();
    } // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.

    var radixToPower = fromNumber(pow_dbl(radix, 8));
    var result = ZERO;

    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i),
          value = parseInt(str.substring(i, i + size), radix);

      if (size < 8) {
        var power = fromNumber(pow_dbl(radix, size));
        result = result.mul(power).add(fromNumber(value));
      } else {
        result = result.mul(radixToPower);
        result = result.add(fromNumber(value));
      }
    }

    result.unsigned = unsigned;
    return result;
  }
  /**
   * Returns a Long representation of the given string, written using the specified radix.
   * @function
   * @param {string} str The textual representation of the Long
   * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to `false` for signed
   * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
   * @returns {!Long} The corresponding Long value
   */


  Long.fromString = fromString;
  /**
   * @function
   * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
   * @returns {!Long}
   * @inner
   */

  function fromValue(val) {
    if (val
    /* is compatible */
    instanceof Long) return val;
    if (typeof val === 'number') return fromNumber(val);
    if (typeof val === 'string') return fromString(val); // Throws for non-objects, converts non-instanceof Long:

    return fromBits(val.low, val.high, val.unsigned);
  }
  /**
   * Converts the specified value to a Long.
   * @function
   * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
   * @returns {!Long}
   */


  Long.fromValue = fromValue; // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
  // no runtime penalty for these.

  /**
   * @type {number}
   * @const
   * @inner
   */

  var TWO_PWR_16_DBL = 1 << 16;
  /**
   * @type {number}
   * @const
   * @inner
   */

  var TWO_PWR_24_DBL = 1 << 24;
  /**
   * @type {number}
   * @const
   * @inner
   */

  var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
  /**
   * @type {number}
   * @const
   * @inner
   */

  var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
  /**
   * @type {number}
   * @const
   * @inner
   */

  var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
  /**
   * @type {!Long}
   * @const
   * @inner
   */

  var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
  /**
   * @type {!Long}
   * @inner
   */

  var ZERO = fromInt(0);
  /**
   * Signed zero.
   * @type {!Long}
   */

  Long.ZERO = ZERO;
  /**
   * @type {!Long}
   * @inner
   */

  var UZERO = fromInt(0, true);
  /**
   * Unsigned zero.
   * @type {!Long}
   */

  Long.UZERO = UZERO;
  /**
   * @type {!Long}
   * @inner
   */

  var ONE = fromInt(1);
  /**
   * Signed one.
   * @type {!Long}
   */

  Long.ONE = ONE;
  /**
   * @type {!Long}
   * @inner
   */

  var UONE = fromInt(1, true);
  /**
   * Unsigned one.
   * @type {!Long}
   */

  Long.UONE = UONE;
  /**
   * @type {!Long}
   * @inner
   */

  var NEG_ONE = fromInt(-1);
  /**
   * Signed negative one.
   * @type {!Long}
   */

  Long.NEG_ONE = NEG_ONE;
  /**
   * @type {!Long}
   * @inner
   */

  var MAX_VALUE = fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);
  /**
   * Maximum signed value.
   * @type {!Long}
   */

  Long.MAX_VALUE = MAX_VALUE;
  /**
   * @type {!Long}
   * @inner
   */

  var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF | 0, 0xFFFFFFFF | 0, true);
  /**
   * Maximum unsigned value.
   * @type {!Long}
   */

  Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
  /**
   * @type {!Long}
   * @inner
   */

  var MIN_VALUE = fromBits(0, 0x80000000 | 0, false);
  /**
   * Minimum signed value.
   * @type {!Long}
   */

  Long.MIN_VALUE = MIN_VALUE;
  /**
   * @alias Long.prototype
   * @inner
   */

  var LongPrototype = Long.prototype;
  /**
   * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
   * @returns {number}
   */

  LongPrototype.toInt = function toInt() {
    return this.unsigned ? this.low >>> 0 : this.low;
  };
  /**
   * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
   * @returns {number}
   */


  LongPrototype.toNumber = function toNumber() {
    if (this.unsigned) return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
    return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
  };
  /**
   * Converts the Long to a string written in the specified radix.
   * @param {number=} radix Radix (2-36), defaults to 10
   * @returns {string}
   * @override
   * @throws {RangeError} If `radix` is out of range
   */


  LongPrototype.toString = function toString(radix) {
    radix = radix || 10;
    if (radix < 2 || 36 < radix) throw RangeError('radix');
    if (this.isZero()) return '0';

    if (this.isNegative()) {
      // Unsigned Longs are never negative
      if (this.eq(MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = fromNumber(radix),
            div = this.div(radixLong),
            rem1 = div.mul(radixLong).sub(this);
        return div.toString(radix) + rem1.toInt().toString(radix);
      } else return '-' + this.neg().toString(radix);
    } // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.


    var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
        rem = this;
    var result = '';

    while (true) {
      var remDiv = rem.div(radixToPower),
          intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
          digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) return digits + result;else {
        while (digits.length < 6) digits = '0' + digits;

        result = '' + digits + result;
      }
    }
  };
  /**
   * Gets the high 32 bits as a signed integer.
   * @returns {number} Signed high bits
   */


  LongPrototype.getHighBits = function getHighBits() {
    return this.high;
  };
  /**
   * Gets the high 32 bits as an unsigned integer.
   * @returns {number} Unsigned high bits
   */


  LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
    return this.high >>> 0;
  };
  /**
   * Gets the low 32 bits as a signed integer.
   * @returns {number} Signed low bits
   */


  LongPrototype.getLowBits = function getLowBits() {
    return this.low;
  };
  /**
   * Gets the low 32 bits as an unsigned integer.
   * @returns {number} Unsigned low bits
   */


  LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
    return this.low >>> 0;
  };
  /**
   * Gets the number of bits needed to represent the absolute value of this Long.
   * @returns {number}
   */


  LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
    if (this.isNegative()) // Unsigned Longs are never negative
      return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
    var val = this.high != 0 ? this.high : this.low;

    for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;

    return this.high != 0 ? bit + 33 : bit + 1;
  };
  /**
   * Tests if this Long's value equals zero.
   * @returns {boolean}
   */


  LongPrototype.isZero = function isZero() {
    return this.high === 0 && this.low === 0;
  };
  /**
   * Tests if this Long's value is negative.
   * @returns {boolean}
   */


  LongPrototype.isNegative = function isNegative() {
    return !this.unsigned && this.high < 0;
  };
  /**
   * Tests if this Long's value is positive.
   * @returns {boolean}
   */


  LongPrototype.isPositive = function isPositive() {
    return this.unsigned || this.high >= 0;
  };
  /**
   * Tests if this Long's value is odd.
   * @returns {boolean}
   */


  LongPrototype.isOdd = function isOdd() {
    return (this.low & 1) === 1;
  };
  /**
   * Tests if this Long's value is even.
   * @returns {boolean}
   */


  LongPrototype.isEven = function isEven() {
    return (this.low & 1) === 0;
  };
  /**
   * Tests if this Long's value equals the specified's.
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */


  LongPrototype.equals = function equals(other) {
    if (!isLong(other)) other = fromValue(other);
    if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1) return false;
    return this.high === other.high && this.low === other.low;
  };
  /**
   * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
   * @function
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */


  LongPrototype.eq = LongPrototype.equals;
  /**
   * Tests if this Long's value differs from the specified's.
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */

  LongPrototype.notEquals = function notEquals(other) {
    return !this.eq(
    /* validates */
    other);
  };
  /**
   * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
   * @function
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */


  LongPrototype.neq = LongPrototype.notEquals;
  /**
   * Tests if this Long's value is less than the specified's.
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */

  LongPrototype.lessThan = function lessThan(other) {
    return this.comp(
    /* validates */
    other) < 0;
  };
  /**
   * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
   * @function
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */


  LongPrototype.lt = LongPrototype.lessThan;
  /**
   * Tests if this Long's value is less than or equal the specified's.
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */

  LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
    return this.comp(
    /* validates */
    other) <= 0;
  };
  /**
   * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
   * @function
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */


  LongPrototype.lte = LongPrototype.lessThanOrEqual;
  /**
   * Tests if this Long's value is greater than the specified's.
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */

  LongPrototype.greaterThan = function greaterThan(other) {
    return this.comp(
    /* validates */
    other) > 0;
  };
  /**
   * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
   * @function
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */


  LongPrototype.gt = LongPrototype.greaterThan;
  /**
   * Tests if this Long's value is greater than or equal the specified's.
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */

  LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
    return this.comp(
    /* validates */
    other) >= 0;
  };
  /**
   * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
   * @function
   * @param {!Long|number|string} other Other value
   * @returns {boolean}
   */


  LongPrototype.gte = LongPrototype.greaterThanOrEqual;
  /**
   * Compares this Long's value with the specified's.
   * @param {!Long|number|string} other Other value
   * @returns {number} 0 if they are the same, 1 if the this is greater and -1
   *  if the given one is greater
   */

  LongPrototype.compare = function compare(other) {
    if (!isLong(other)) other = fromValue(other);
    if (this.eq(other)) return 0;
    var thisNeg = this.isNegative(),
        otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) return -1;
    if (!thisNeg && otherNeg) return 1; // At this point the sign bits are the same

    if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1; // Both are positive if at least one is unsigned

    return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
  };
  /**
   * Compares this Long's value with the specified's. This is an alias of {@link Long#compare}.
   * @function
   * @param {!Long|number|string} other Other value
   * @returns {number} 0 if they are the same, 1 if the this is greater and -1
   *  if the given one is greater
   */


  LongPrototype.comp = LongPrototype.compare;
  /**
   * Negates this Long's value.
   * @returns {!Long} Negated Long
   */

  LongPrototype.negate = function negate() {
    if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
    return this.not().add(ONE);
  };
  /**
   * Negates this Long's value. This is an alias of {@link Long#negate}.
   * @function
   * @returns {!Long} Negated Long
   */


  LongPrototype.neg = LongPrototype.negate;
  /**
   * Returns the sum of this and the specified Long.
   * @param {!Long|number|string} addend Addend
   * @returns {!Long} Sum
   */

  LongPrototype.add = function add(addend) {
    if (!isLong(addend)) addend = fromValue(addend); // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high >>> 16;
    var a32 = this.high & 0xFFFF;
    var a16 = this.low >>> 16;
    var a00 = this.low & 0xFFFF;
    var b48 = addend.high >>> 16;
    var b32 = addend.high & 0xFFFF;
    var b16 = addend.low >>> 16;
    var b00 = addend.low & 0xFFFF;
    var c48 = 0,
        c32 = 0,
        c16 = 0,
        c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
  };
  /**
   * Returns the difference of this and the specified Long.
   * @param {!Long|number|string} subtrahend Subtrahend
   * @returns {!Long} Difference
   */


  LongPrototype.subtract = function subtract(subtrahend) {
    if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
    return this.add(subtrahend.neg());
  };
  /**
   * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
   * @function
   * @param {!Long|number|string} subtrahend Subtrahend
   * @returns {!Long} Difference
   */


  LongPrototype.sub = LongPrototype.subtract;
  /**
   * Returns the product of this and the specified Long.
   * @param {!Long|number|string} multiplier Multiplier
   * @returns {!Long} Product
   */

  LongPrototype.multiply = function multiply(multiplier) {
    if (this.isZero()) return ZERO;
    if (!isLong(multiplier)) multiplier = fromValue(multiplier);
    if (multiplier.isZero()) return ZERO;
    if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
    if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;

    if (this.isNegative()) {
      if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());else return this.neg().mul(multiplier).neg();
    } else if (multiplier.isNegative()) return this.mul(multiplier.neg()).neg(); // If both longs are small, use float multiplication


    if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24)) return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned); // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high >>> 16;
    var a32 = this.high & 0xFFFF;
    var a16 = this.low >>> 16;
    var a00 = this.low & 0xFFFF;
    var b48 = multiplier.high >>> 16;
    var b32 = multiplier.high & 0xFFFF;
    var b16 = multiplier.low >>> 16;
    var b00 = multiplier.low & 0xFFFF;
    var c48 = 0,
        c32 = 0,
        c16 = 0,
        c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
  };
  /**
   * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
   * @function
   * @param {!Long|number|string} multiplier Multiplier
   * @returns {!Long} Product
   */


  LongPrototype.mul = LongPrototype.multiply;
  /**
   * Returns this Long divided by the specified. The result is signed if this Long is signed or
   *  unsigned if this Long is unsigned.
   * @param {!Long|number|string} divisor Divisor
   * @returns {!Long} Quotient
   */

  LongPrototype.divide = function divide(divisor) {
    if (!isLong(divisor)) divisor = fromValue(divisor);
    if (divisor.isZero()) throw Error('division by zero');
    if (this.isZero()) return this.unsigned ? UZERO : ZERO;
    var approx, rem, res;

    if (!this.unsigned) {
      // This section is only relevant for signed longs and is derived from the
      // closure library as a whole.
      if (this.eq(MIN_VALUE)) {
        if (divisor.eq(ONE) || divisor.eq(NEG_ONE)) return MIN_VALUE; // recall that -MIN_VALUE == MIN_VALUE
        else if (divisor.eq(MIN_VALUE)) return ONE;else {
            // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
            var halfThis = this.shr(1);
            approx = halfThis.div(divisor).shl(1);

            if (approx.eq(ZERO)) {
              return divisor.isNegative() ? ONE : NEG_ONE;
            } else {
              rem = this.sub(divisor.mul(approx));
              res = approx.add(rem.div(divisor));
              return res;
            }
          }
      } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;

      if (this.isNegative()) {
        if (divisor.isNegative()) return this.neg().div(divisor.neg());
        return this.neg().div(divisor).neg();
      } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();

      res = ZERO;
    } else {
      // The algorithm below has not been made for unsigned longs. It's therefore
      // required to take special care of the MSB prior to running it.
      if (!divisor.unsigned) divisor = divisor.toUnsigned();
      if (divisor.gt(this)) return UZERO;
      if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
        return UONE;
      res = UZERO;
    } // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.


    rem = this;

    while (rem.gte(divisor)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber())); // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.

      var log2 = Math.ceil(Math.log(approx) / Math.LN2),
          delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48),
          // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      approxRes = fromNumber(approx),
          approxRem = approxRes.mul(divisor);

      while (approxRem.isNegative() || approxRem.gt(rem)) {
        approx -= delta;
        approxRes = fromNumber(approx, this.unsigned);
        approxRem = approxRes.mul(divisor);
      } // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.


      if (approxRes.isZero()) approxRes = ONE;
      res = res.add(approxRes);
      rem = rem.sub(approxRem);
    }

    return res;
  };
  /**
   * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
   * @function
   * @param {!Long|number|string} divisor Divisor
   * @returns {!Long} Quotient
   */


  LongPrototype.div = LongPrototype.divide;
  /**
   * Returns this Long modulo the specified.
   * @param {!Long|number|string} divisor Divisor
   * @returns {!Long} Remainder
   */

  LongPrototype.modulo = function modulo(divisor) {
    if (!isLong(divisor)) divisor = fromValue(divisor);
    return this.sub(this.div(divisor).mul(divisor));
  };
  /**
   * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
   * @function
   * @param {!Long|number|string} divisor Divisor
   * @returns {!Long} Remainder
   */


  LongPrototype.mod = LongPrototype.modulo;
  /**
   * Returns the bitwise NOT of this Long.
   * @returns {!Long}
   */

  LongPrototype.not = function not() {
    return fromBits(~this.low, ~this.high, this.unsigned);
  };
  /**
   * Returns the bitwise AND of this Long and the specified.
   * @param {!Long|number|string} other Other Long
   * @returns {!Long}
   */


  LongPrototype.and = function and(other) {
    if (!isLong(other)) other = fromValue(other);
    return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
  };
  /**
   * Returns the bitwise OR of this Long and the specified.
   * @param {!Long|number|string} other Other Long
   * @returns {!Long}
   */


  LongPrototype.or = function or(other) {
    if (!isLong(other)) other = fromValue(other);
    return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
  };
  /**
   * Returns the bitwise XOR of this Long and the given one.
   * @param {!Long|number|string} other Other Long
   * @returns {!Long}
   */


  LongPrototype.xor = function xor(other) {
    if (!isLong(other)) other = fromValue(other);
    return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number|!Long} numBits Number of bits
   * @returns {!Long} Shifted Long
   */


  LongPrototype.shiftLeft = function shiftLeft(numBits) {
    if (isLong(numBits)) numBits = numBits.toInt();
    if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);else return fromBits(0, this.low << numBits - 32, this.unsigned);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
   * @function
   * @param {number|!Long} numBits Number of bits
   * @returns {!Long} Shifted Long
   */


  LongPrototype.shl = LongPrototype.shiftLeft;
  /**
   * Returns this Long with bits arithmetically shifted to the right by the given amount.
   * @param {number|!Long} numBits Number of bits
   * @returns {!Long} Shifted Long
   */

  LongPrototype.shiftRight = function shiftRight(numBits) {
    if (isLong(numBits)) numBits = numBits.toInt();
    if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);else return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
  };
  /**
   * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
   * @function
   * @param {number|!Long} numBits Number of bits
   * @returns {!Long} Shifted Long
   */


  LongPrototype.shr = LongPrototype.shiftRight;
  /**
   * Returns this Long with bits logically shifted to the right by the given amount.
   * @param {number|!Long} numBits Number of bits
   * @returns {!Long} Shifted Long
   */

  LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
    if (isLong(numBits)) numBits = numBits.toInt();
    numBits &= 63;
    if (numBits === 0) return this;else {
      var high = this.high;

      if (numBits < 32) {
        var low = this.low;
        return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
      } else if (numBits === 32) return fromBits(high, 0, this.unsigned);else return fromBits(high >>> numBits - 32, 0, this.unsigned);
    }
  };
  /**
   * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
   * @function
   * @param {number|!Long} numBits Number of bits
   * @returns {!Long} Shifted Long
   */


  LongPrototype.shru = LongPrototype.shiftRightUnsigned;
  /**
   * Converts this Long to signed.
   * @returns {!Long} Signed long
   */

  LongPrototype.toSigned = function toSigned() {
    if (!this.unsigned) return this;
    return fromBits(this.low, this.high, false);
  };
  /**
   * Converts this Long to unsigned.
   * @returns {!Long} Unsigned long
   */


  LongPrototype.toUnsigned = function toUnsigned() {
    if (this.unsigned) return this;
    return fromBits(this.low, this.high, true);
  };
  /**
   * Converts this Long to its byte representation.
   * @param {boolean=} le Whether little or big endian, defaults to big endian
   * @returns {!Array.<number>} Byte representation
   */


  LongPrototype.toBytes = function (le) {
    return le ? this.toBytesLE() : this.toBytesBE();
  };
  /**
   * Converts this Long to its little endian byte representation.
   * @returns {!Array.<number>} Little endian byte representation
   */


  LongPrototype.toBytesLE = function () {
    var hi = this.high,
        lo = this.low;
    return [lo & 0xff, lo >>> 8 & 0xff, lo >>> 16 & 0xff, lo >>> 24 & 0xff, hi & 0xff, hi >>> 8 & 0xff, hi >>> 16 & 0xff, hi >>> 24 & 0xff];
  };
  /**
   * Converts this Long to its big endian byte representation.
   * @returns {!Array.<number>} Big endian byte representation
   */


  LongPrototype.toBytesBE = function () {
    var hi = this.high,
        lo = this.low;
    return [hi >>> 24 & 0xff, hi >>> 16 & 0xff, hi >>> 8 & 0xff, hi & 0xff, lo >>> 24 & 0xff, lo >>> 16 & 0xff, lo >>> 8 & 0xff, lo & 0xff];
  };

  return Long;
});
});

/*
 Copyright 2013-2014 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license bytebuffer.js (c) 2015 Daniel Wirtz <dcode@dcode.io>
 * Backing buffer / Accessor: node Buffer
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/bytebuffer.js for details
 */
var bytebufferNode = function () {

  var buffer = require$$0$1,
      Buffer = buffer["Buffer"],
      Long = long,
      memcpy = null;

  try {
    memcpy = require("memcpy");
  } catch (e) {}
  /**
   * Constructs a new ByteBuffer.
   * @class The swiss army knife for binary data in JavaScript.
   * @exports ByteBuffer
   * @constructor
   * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @expose
   */


  var ByteBuffer = function (capacity, littleEndian, noAssert) {
    if (typeof capacity === 'undefined') capacity = ByteBuffer.DEFAULT_CAPACITY;
    if (typeof littleEndian === 'undefined') littleEndian = ByteBuffer.DEFAULT_ENDIAN;
    if (typeof noAssert === 'undefined') noAssert = ByteBuffer.DEFAULT_NOASSERT;

    if (!noAssert) {
      capacity = capacity | 0;
      if (capacity < 0) throw RangeError("Illegal capacity");
      littleEndian = !!littleEndian;
      noAssert = !!noAssert;
    }
    /**
     * Backing node Buffer.
     * @type {!Buffer}
     * @expose
     */


    this.buffer = capacity === 0 ? EMPTY_BUFFER : new Buffer(capacity);
    /**
     * Absolute read/write offset.
     * @type {number}
     * @expose
     * @see ByteBuffer#flip
     * @see ByteBuffer#clear
     */

    this.offset = 0;
    /**
     * Marked offset.
     * @type {number}
     * @expose
     * @see ByteBuffer#mark
     * @see ByteBuffer#reset
     */

    this.markedOffset = -1;
    /**
     * Absolute limit of the contained data. Set to the backing buffer's capacity upon allocation.
     * @type {number}
     * @expose
     * @see ByteBuffer#flip
     * @see ByteBuffer#clear
     */

    this.limit = capacity;
    /**
     * Whether to use little endian byte order, defaults to `false` for big endian.
     * @type {boolean}
     * @expose
     */

    this.littleEndian = littleEndian;
    /**
     * Whether to skip assertions of offsets and values, defaults to `false`.
     * @type {boolean}
     * @expose
     */

    this.noAssert = noAssert;
  };
  /**
   * ByteBuffer version.
   * @type {string}
   * @const
   * @expose
   */


  ByteBuffer.VERSION = "5.0.1";
  /**
   * Little endian constant that can be used instead of its boolean value. Evaluates to `true`.
   * @type {boolean}
   * @const
   * @expose
   */

  ByteBuffer.LITTLE_ENDIAN = true;
  /**
   * Big endian constant that can be used instead of its boolean value. Evaluates to `false`.
   * @type {boolean}
   * @const
   * @expose
   */

  ByteBuffer.BIG_ENDIAN = false;
  /**
   * Default initial capacity of `16`.
   * @type {number}
   * @expose
   */

  ByteBuffer.DEFAULT_CAPACITY = 16;
  /**
   * Default endianess of `false` for big endian.
   * @type {boolean}
   * @expose
   */

  ByteBuffer.DEFAULT_ENDIAN = ByteBuffer.BIG_ENDIAN;
  /**
   * Default no assertions flag of `false`.
   * @type {boolean}
   * @expose
   */

  ByteBuffer.DEFAULT_NOASSERT = false;
  /**
   * A `Long` class for representing a 64-bit two's-complement integer value.
   * @type {!Long}
   * @const
   * @see https://npmjs.org/package/long
   * @expose
   */

  ByteBuffer.Long = Long;
  /**
   * @alias ByteBuffer.prototype
   * @inner
   */

  var ByteBufferPrototype = ByteBuffer.prototype;
  /**
   * An indicator used to reliably determine if an object is a ByteBuffer or not.
   * @type {boolean}
   * @const
   * @expose
   * @private
   */

  ByteBufferPrototype.__isByteBuffer__;
  Object.defineProperty(ByteBufferPrototype, "__isByteBuffer__", {
    value: true,
    enumerable: false,
    configurable: false
  }); // helpers

  /**
   * @type {!Buffer}
   * @inner
   */

  var EMPTY_BUFFER = new Buffer(0);
  /**
   * String.fromCharCode reference for compile-time renaming.
   * @type {function(...number):string}
   * @inner
   */

  var stringFromCharCode = String.fromCharCode;
  /**
   * Creates a source function for a string.
   * @param {string} s String to read from
   * @returns {function():number|null} Source function returning the next char code respectively `null` if there are
   *  no more characters left.
   * @throws {TypeError} If the argument is invalid
   * @inner
   */

  function stringSource(s) {
    var i = 0;
    return function () {
      return i < s.length ? s.charCodeAt(i++) : null;
    };
  }
  /**
   * Creates a destination function for a string.
   * @returns {function(number=):undefined|string} Destination function successively called with the next char code.
   *  Returns the final string when called without arguments.
   * @inner
   */


  function stringDestination() {
    var cs = [],
        ps = [];
    return function () {
      if (arguments.length === 0) return ps.join('') + stringFromCharCode.apply(String, cs);
      if (cs.length + arguments.length > 1024) ps.push(stringFromCharCode.apply(String, cs)), cs.length = 0;
      Array.prototype.push.apply(cs, arguments);
    };
  }
  /**
   * Gets the accessor type.
   * @returns {Function} `Buffer` under node.js, `Uint8Array` respectively `DataView` in the browser (classes)
   * @expose
   */


  ByteBuffer.accessor = function () {
    return Buffer;
  };
  /**
   * Allocates a new ByteBuffer backed by a buffer of the specified capacity.
   * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @returns {!ByteBuffer}
   * @expose
   */


  ByteBuffer.allocate = function (capacity, littleEndian, noAssert) {
    return new ByteBuffer(capacity, littleEndian, noAssert);
  };
  /**
   * Concatenates multiple ByteBuffers into one.
   * @param {!Array.<!ByteBuffer|!Buffer|!ArrayBuffer|!Uint8Array|string>} buffers Buffers to concatenate
   * @param {(string|boolean)=} encoding String encoding if `buffers` contains a string ("base64", "hex", "binary",
   *  defaults to "utf8")
   * @param {boolean=} littleEndian Whether to use little or big endian byte order for the resulting ByteBuffer. Defaults
   *  to {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values for the resulting ByteBuffer. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @returns {!ByteBuffer} Concatenated ByteBuffer
   * @expose
   */


  ByteBuffer.concat = function (buffers, encoding, littleEndian, noAssert) {
    if (typeof encoding === 'boolean' || typeof encoding !== 'string') {
      noAssert = littleEndian;
      littleEndian = encoding;
      encoding = undefined;
    }

    var capacity = 0;

    for (var i = 0, k = buffers.length, length; i < k; ++i) {
      if (!ByteBuffer.isByteBuffer(buffers[i])) buffers[i] = ByteBuffer.wrap(buffers[i], encoding);
      length = buffers[i].limit - buffers[i].offset;
      if (length > 0) capacity += length;
    }

    if (capacity === 0) return new ByteBuffer(0, littleEndian, noAssert);
    var bb = new ByteBuffer(capacity, littleEndian, noAssert),
        bi;
    i = 0;

    while (i < k) {
      bi = buffers[i++];
      length = bi.limit - bi.offset;
      if (length <= 0) continue;
      bi.buffer.copy(bb.buffer, bb.offset, bi.offset, bi.limit);
      bb.offset += length;
    }

    bb.limit = bb.offset;
    bb.offset = 0;
    return bb;
  };
  /**
   * Tests if the specified type is a ByteBuffer.
   * @param {*} bb ByteBuffer to test
   * @returns {boolean} `true` if it is a ByteBuffer, otherwise `false`
   * @expose
   */


  ByteBuffer.isByteBuffer = function (bb) {
    return (bb && bb["__isByteBuffer__"]) === true;
  };
  /**
   * Gets the backing buffer type.
   * @returns {Function} `Buffer` under node.js, `ArrayBuffer` in the browser (classes)
   * @expose
   */


  ByteBuffer.type = function () {
    return Buffer;
  };
  /**
   * Wraps a buffer or a string. Sets the allocated ByteBuffer's {@link ByteBuffer#offset} to `0` and its
   *  {@link ByteBuffer#limit} to the length of the wrapped data.
   * @param {!ByteBuffer|!Buffer|!ArrayBuffer|!Uint8Array|string|!Array.<number>} buffer Anything that can be wrapped
   * @param {(string|boolean)=} encoding String encoding if `buffer` is a string ("base64", "hex", "binary", defaults to
   *  "utf8")
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @returns {!ByteBuffer} A ByteBuffer wrapping `buffer`
   * @expose
   */


  ByteBuffer.wrap = function (buffer, encoding, littleEndian, noAssert) {
    if (typeof encoding !== 'string') {
      noAssert = littleEndian;
      littleEndian = encoding;
      encoding = undefined;
    }

    if (typeof buffer === 'string') {
      if (typeof encoding === 'undefined') encoding = "utf8";

      switch (encoding) {
        case "base64":
          return ByteBuffer.fromBase64(buffer, littleEndian);

        case "hex":
          return ByteBuffer.fromHex(buffer, littleEndian);

        case "binary":
          return ByteBuffer.fromBinary(buffer, littleEndian);

        case "utf8":
          return ByteBuffer.fromUTF8(buffer, littleEndian);

        case "debug":
          return ByteBuffer.fromDebug(buffer, littleEndian);

        default:
          throw Error("Unsupported encoding: " + encoding);
      }
    }

    if (buffer === null || typeof buffer !== 'object') throw TypeError("Illegal buffer");
    var bb;

    if (ByteBuffer.isByteBuffer(buffer)) {
      bb = ByteBufferPrototype.clone.call(buffer);
      bb.markedOffset = -1;
      return bb;
    }

    var i = 0,
        k = 0,
        b;

    if (buffer instanceof Uint8Array) {
      // Extract bytes from Uint8Array
      b = new Buffer(buffer.length);

      if (memcpy) {
        // Fast
        memcpy(b, 0, buffer.buffer, buffer.byteOffset, buffer.byteOffset + buffer.length);
      } else {
        // Slow
        for (i = 0, k = buffer.length; i < k; ++i) b[i] = buffer[i];
      }

      buffer = b;
    } else if (buffer instanceof ArrayBuffer) {
      // Convert ArrayBuffer to Buffer
      b = new Buffer(buffer.byteLength);

      if (memcpy) {
        // Fast
        memcpy(b, 0, buffer, 0, buffer.byteLength);
      } else {
        // Slow
        buffer = new Uint8Array(buffer);

        for (i = 0, k = buffer.length; i < k; ++i) {
          b[i] = buffer[i];
        }
      }

      buffer = b;
    } else if (!(buffer instanceof Buffer)) {
      // Create from octets if it is an error, otherwise fail
      if (Object.prototype.toString.call(buffer) !== "[object Array]") throw TypeError("Illegal buffer");
      buffer = new Buffer(buffer);
    }

    bb = new ByteBuffer(0, littleEndian, noAssert);

    if (buffer.length > 0) {
      // Avoid references to more than one EMPTY_BUFFER
      bb.buffer = buffer;
      bb.limit = buffer.length;
    }

    return bb;
  };
  /**
   * Writes the array as a bitset.
   * @param {Array<boolean>} value Array of booleans to write
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `length` if omitted.
   * @returns {!ByteBuffer}
   * @expose
   */


  ByteBufferPrototype.writeBitSet = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (!(value instanceof Array)) throw TypeError("Illegal BitSet: Not an array");
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    var start = offset,
        bits = value.length,
        bytes = bits >> 3,
        bit = 0,
        k;
    offset += this.writeVarint32(bits, offset);

    while (bytes--) {
      k = !!value[bit++] & 1 | (!!value[bit++] & 1) << 1 | (!!value[bit++] & 1) << 2 | (!!value[bit++] & 1) << 3 | (!!value[bit++] & 1) << 4 | (!!value[bit++] & 1) << 5 | (!!value[bit++] & 1) << 6 | (!!value[bit++] & 1) << 7;
      this.writeByte(k, offset++);
    }

    if (bit < bits) {
      var m = 0;
      k = 0;

      while (bit < bits) k = k | (!!value[bit++] & 1) << m++;

      this.writeByte(k, offset++);
    }

    if (relative) {
      this.offset = offset;
      return this;
    }

    return offset - start;
  };
  /**
   * Reads a BitSet as an array of booleans.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `length` if omitted.
   * @returns {Array<boolean>
   * @expose
   */


  ByteBufferPrototype.readBitSet = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    var ret = this.readVarint32(offset),
        bits = ret.value,
        bytes = bits >> 3,
        bit = 0,
        value = [],
        k;
    offset += ret.length;

    while (bytes--) {
      k = this.readByte(offset++);
      value[bit++] = !!(k & 0x01);
      value[bit++] = !!(k & 0x02);
      value[bit++] = !!(k & 0x04);
      value[bit++] = !!(k & 0x08);
      value[bit++] = !!(k & 0x10);
      value[bit++] = !!(k & 0x20);
      value[bit++] = !!(k & 0x40);
      value[bit++] = !!(k & 0x80);
    }

    if (bit < bits) {
      var m = 0;
      k = this.readByte(offset++);

      while (bit < bits) value[bit++] = !!(k >> m++ & 1);
    }

    if (relative) {
      this.offset = offset;
    }

    return value;
  };
  /**
   * Reads the specified number of bytes.
   * @param {number} length Number of bytes to read
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `length` if omitted.
   * @returns {!ByteBuffer}
   * @expose
   */


  ByteBufferPrototype.readBytes = function (length, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + length > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + length + ") <= " + this.buffer.length);
    }

    var slice = this.slice(offset, offset + length);
    if (relative) this.offset += length;
    return slice;
  };
  /**
   * Writes a payload of bytes. This is an alias of {@link ByteBuffer#append}.
   * @function
   * @param {!ByteBuffer|!Buffer|!ArrayBuffer|!Uint8Array|string} source Data to write. If `source` is a ByteBuffer, its
   * offsets will be modified according to the performed read operation.
   * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.writeBytes = ByteBufferPrototype.append; // types/ints/int8

  /**
   * Writes an 8bit signed integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */

  ByteBufferPrototype.writeInt8 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value |= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 1;
    var capacity0 = this.buffer.length;
    if (offset > capacity0) this.resize((capacity0 *= 2) > offset ? capacity0 : offset);
    offset -= 1;
    this.buffer[offset] = value;
    if (relative) this.offset += 1;
    return this;
  };
  /**
   * Writes an 8bit signed integer. This is an alias of {@link ByteBuffer#writeInt8}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.writeByte = ByteBufferPrototype.writeInt8;
  /**
   * Reads an 8bit signed integer.
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {number} Value read
   * @expose
   */

  ByteBufferPrototype.readInt8 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 1 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 1 + ") <= " + this.buffer.length);
    }

    var value = this.buffer[offset];
    if ((value & 0x80) === 0x80) value = -(0xFF - value + 1); // Cast to signed

    if (relative) this.offset += 1;
    return value;
  };
  /**
   * Reads an 8bit signed integer. This is an alias of {@link ByteBuffer#readInt8}.
   * @function
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {number} Value read
   * @expose
   */


  ByteBufferPrototype.readByte = ByteBufferPrototype.readInt8;
  /**
   * Writes an 8bit unsigned integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */

  ByteBufferPrototype.writeUint8 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value >>>= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 1;
    var capacity1 = this.buffer.length;
    if (offset > capacity1) this.resize((capacity1 *= 2) > offset ? capacity1 : offset);
    offset -= 1;
    this.buffer[offset] = value;
    if (relative) this.offset += 1;
    return this;
  };
  /**
   * Writes an 8bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint8}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.writeUInt8 = ByteBufferPrototype.writeUint8;
  /**
   * Reads an 8bit unsigned integer.
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {number} Value read
   * @expose
   */

  ByteBufferPrototype.readUint8 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 1 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 1 + ") <= " + this.buffer.length);
    }

    var value = this.buffer[offset];
    if (relative) this.offset += 1;
    return value;
  };
  /**
   * Reads an 8bit unsigned integer. This is an alias of {@link ByteBuffer#readUint8}.
   * @function
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
   * @returns {number} Value read
   * @expose
   */


  ByteBufferPrototype.readUInt8 = ByteBufferPrototype.readUint8; // types/ints/int16

  /**
   * Writes a 16bit signed integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */

  ByteBufferPrototype.writeInt16 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value |= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 2;
    var capacity2 = this.buffer.length;
    if (offset > capacity2) this.resize((capacity2 *= 2) > offset ? capacity2 : offset);
    offset -= 2;

    if (this.littleEndian) {
      this.buffer[offset + 1] = (value & 0xFF00) >>> 8;
      this.buffer[offset] = value & 0x00FF;
    } else {
      this.buffer[offset] = (value & 0xFF00) >>> 8;
      this.buffer[offset + 1] = value & 0x00FF;
    }

    if (relative) this.offset += 2;
    return this;
  };
  /**
   * Writes a 16bit signed integer. This is an alias of {@link ByteBuffer#writeInt16}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */


  ByteBufferPrototype.writeShort = ByteBufferPrototype.writeInt16;
  /**
   * Reads a 16bit signed integer.
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @returns {number} Value read
   * @throws {TypeError} If `offset` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */

  ByteBufferPrototype.readInt16 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 2 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 2 + ") <= " + this.buffer.length);
    }

    var value = 0;

    if (this.littleEndian) {
      value = this.buffer[offset];
      value |= this.buffer[offset + 1] << 8;
    } else {
      value = this.buffer[offset] << 8;
      value |= this.buffer[offset + 1];
    }

    if ((value & 0x8000) === 0x8000) value = -(0xFFFF - value + 1); // Cast to signed

    if (relative) this.offset += 2;
    return value;
  };
  /**
   * Reads a 16bit signed integer. This is an alias of {@link ByteBuffer#readInt16}.
   * @function
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @returns {number} Value read
   * @throws {TypeError} If `offset` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */


  ByteBufferPrototype.readShort = ByteBufferPrototype.readInt16;
  /**
   * Writes a 16bit unsigned integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */

  ByteBufferPrototype.writeUint16 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value >>>= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 2;
    var capacity3 = this.buffer.length;
    if (offset > capacity3) this.resize((capacity3 *= 2) > offset ? capacity3 : offset);
    offset -= 2;

    if (this.littleEndian) {
      this.buffer[offset + 1] = (value & 0xFF00) >>> 8;
      this.buffer[offset] = value & 0x00FF;
    } else {
      this.buffer[offset] = (value & 0xFF00) >>> 8;
      this.buffer[offset + 1] = value & 0x00FF;
    }

    if (relative) this.offset += 2;
    return this;
  };
  /**
   * Writes a 16bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint16}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @throws {TypeError} If `offset` or `value` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */


  ByteBufferPrototype.writeUInt16 = ByteBufferPrototype.writeUint16;
  /**
   * Reads a 16bit unsigned integer.
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @returns {number} Value read
   * @throws {TypeError} If `offset` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */

  ByteBufferPrototype.readUint16 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 2 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 2 + ") <= " + this.buffer.length);
    }

    var value = 0;

    if (this.littleEndian) {
      value = this.buffer[offset];
      value |= this.buffer[offset + 1] << 8;
    } else {
      value = this.buffer[offset] << 8;
      value |= this.buffer[offset + 1];
    }

    if (relative) this.offset += 2;
    return value;
  };
  /**
   * Reads a 16bit unsigned integer. This is an alias of {@link ByteBuffer#readUint16}.
   * @function
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
   * @returns {number} Value read
   * @throws {TypeError} If `offset` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @expose
   */


  ByteBufferPrototype.readUInt16 = ByteBufferPrototype.readUint16; // types/ints/int32

  /**
   * Writes a 32bit signed integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @expose
   */

  ByteBufferPrototype.writeInt32 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value |= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 4;
    var capacity4 = this.buffer.length;
    if (offset > capacity4) this.resize((capacity4 *= 2) > offset ? capacity4 : offset);
    offset -= 4;

    if (this.littleEndian) {
      this.buffer[offset + 3] = value >>> 24 & 0xFF;
      this.buffer[offset + 2] = value >>> 16 & 0xFF;
      this.buffer[offset + 1] = value >>> 8 & 0xFF;
      this.buffer[offset] = value & 0xFF;
    } else {
      this.buffer[offset] = value >>> 24 & 0xFF;
      this.buffer[offset + 1] = value >>> 16 & 0xFF;
      this.buffer[offset + 2] = value >>> 8 & 0xFF;
      this.buffer[offset + 3] = value & 0xFF;
    }

    if (relative) this.offset += 4;
    return this;
  };
  /**
   * Writes a 32bit signed integer. This is an alias of {@link ByteBuffer#writeInt32}.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @expose
   */


  ByteBufferPrototype.writeInt = ByteBufferPrototype.writeInt32;
  /**
   * Reads a 32bit signed integer.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {number} Value read
   * @expose
   */

  ByteBufferPrototype.readInt32 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 4 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 4 + ") <= " + this.buffer.length);
    }

    var value = 0;

    if (this.littleEndian) {
      value = this.buffer[offset + 2] << 16;
      value |= this.buffer[offset + 1] << 8;
      value |= this.buffer[offset];
      value += this.buffer[offset + 3] << 24 >>> 0;
    } else {
      value = this.buffer[offset + 1] << 16;
      value |= this.buffer[offset + 2] << 8;
      value |= this.buffer[offset + 3];
      value += this.buffer[offset] << 24 >>> 0;
    }

    value |= 0; // Cast to signed

    if (relative) this.offset += 4;
    return value;
  };
  /**
   * Reads a 32bit signed integer. This is an alias of {@link ByteBuffer#readInt32}.
   * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {number} Value read
   * @expose
   */


  ByteBufferPrototype.readInt = ByteBufferPrototype.readInt32;
  /**
   * Writes a 32bit unsigned integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @expose
   */

  ByteBufferPrototype.writeUint32 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value >>>= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 4;
    var capacity5 = this.buffer.length;
    if (offset > capacity5) this.resize((capacity5 *= 2) > offset ? capacity5 : offset);
    offset -= 4;

    if (this.littleEndian) {
      this.buffer[offset + 3] = value >>> 24 & 0xFF;
      this.buffer[offset + 2] = value >>> 16 & 0xFF;
      this.buffer[offset + 1] = value >>> 8 & 0xFF;
      this.buffer[offset] = value & 0xFF;
    } else {
      this.buffer[offset] = value >>> 24 & 0xFF;
      this.buffer[offset + 1] = value >>> 16 & 0xFF;
      this.buffer[offset + 2] = value >>> 8 & 0xFF;
      this.buffer[offset + 3] = value & 0xFF;
    }

    if (relative) this.offset += 4;
    return this;
  };
  /**
   * Writes a 32bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint32}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @expose
   */


  ByteBufferPrototype.writeUInt32 = ByteBufferPrototype.writeUint32;
  /**
   * Reads a 32bit unsigned integer.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {number} Value read
   * @expose
   */

  ByteBufferPrototype.readUint32 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 4 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 4 + ") <= " + this.buffer.length);
    }

    var value = 0;

    if (this.littleEndian) {
      value = this.buffer[offset + 2] << 16;
      value |= this.buffer[offset + 1] << 8;
      value |= this.buffer[offset];
      value += this.buffer[offset + 3] << 24 >>> 0;
    } else {
      value = this.buffer[offset + 1] << 16;
      value |= this.buffer[offset + 2] << 8;
      value |= this.buffer[offset + 3];
      value += this.buffer[offset] << 24 >>> 0;
    }

    if (relative) this.offset += 4;
    return value;
  };
  /**
   * Reads a 32bit unsigned integer. This is an alias of {@link ByteBuffer#readUint32}.
   * @function
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {number} Value read
   * @expose
   */


  ByteBufferPrototype.readUInt32 = ByteBufferPrototype.readUint32; // types/ints/int64

  if (Long) {
    /**
     * Writes a 64bit signed integer.
     * @param {number|!Long} value Value to write
     * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!ByteBuffer} this
     * @expose
     */
    ByteBufferPrototype.writeInt64 = function (value, offset) {
      var relative = typeof offset === 'undefined';
      if (relative) offset = this.offset;

      if (!this.noAssert) {
        if (typeof value === 'number') value = Long.fromNumber(value);else if (typeof value === 'string') value = Long.fromString(value);else if (!(value && value instanceof Long)) throw TypeError("Illegal value: " + value + " (not an integer or Long)");
        if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
      }

      if (typeof value === 'number') value = Long.fromNumber(value);else if (typeof value === 'string') value = Long.fromString(value);
      offset += 8;
      var capacity6 = this.buffer.length;
      if (offset > capacity6) this.resize((capacity6 *= 2) > offset ? capacity6 : offset);
      offset -= 8;
      var lo = value.low,
          hi = value.high;

      if (this.littleEndian) {
        this.buffer[offset + 3] = lo >>> 24 & 0xFF;
        this.buffer[offset + 2] = lo >>> 16 & 0xFF;
        this.buffer[offset + 1] = lo >>> 8 & 0xFF;
        this.buffer[offset] = lo & 0xFF;
        offset += 4;
        this.buffer[offset + 3] = hi >>> 24 & 0xFF;
        this.buffer[offset + 2] = hi >>> 16 & 0xFF;
        this.buffer[offset + 1] = hi >>> 8 & 0xFF;
        this.buffer[offset] = hi & 0xFF;
      } else {
        this.buffer[offset] = hi >>> 24 & 0xFF;
        this.buffer[offset + 1] = hi >>> 16 & 0xFF;
        this.buffer[offset + 2] = hi >>> 8 & 0xFF;
        this.buffer[offset + 3] = hi & 0xFF;
        offset += 4;
        this.buffer[offset] = lo >>> 24 & 0xFF;
        this.buffer[offset + 1] = lo >>> 16 & 0xFF;
        this.buffer[offset + 2] = lo >>> 8 & 0xFF;
        this.buffer[offset + 3] = lo & 0xFF;
      }

      if (relative) this.offset += 8;
      return this;
    };
    /**
     * Writes a 64bit signed integer. This is an alias of {@link ByteBuffer#writeInt64}.
     * @param {number|!Long} value Value to write
     * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!ByteBuffer} this
     * @expose
     */


    ByteBufferPrototype.writeLong = ByteBufferPrototype.writeInt64;
    /**
     * Reads a 64bit signed integer.
     * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!Long}
     * @expose
     */

    ByteBufferPrototype.readInt64 = function (offset) {
      var relative = typeof offset === 'undefined';
      if (relative) offset = this.offset;

      if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 8 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 8 + ") <= " + this.buffer.length);
      }

      var lo = 0,
          hi = 0;

      if (this.littleEndian) {
        lo = this.buffer[offset + 2] << 16;
        lo |= this.buffer[offset + 1] << 8;
        lo |= this.buffer[offset];
        lo += this.buffer[offset + 3] << 24 >>> 0;
        offset += 4;
        hi = this.buffer[offset + 2] << 16;
        hi |= this.buffer[offset + 1] << 8;
        hi |= this.buffer[offset];
        hi += this.buffer[offset + 3] << 24 >>> 0;
      } else {
        hi = this.buffer[offset + 1] << 16;
        hi |= this.buffer[offset + 2] << 8;
        hi |= this.buffer[offset + 3];
        hi += this.buffer[offset] << 24 >>> 0;
        offset += 4;
        lo = this.buffer[offset + 1] << 16;
        lo |= this.buffer[offset + 2] << 8;
        lo |= this.buffer[offset + 3];
        lo += this.buffer[offset] << 24 >>> 0;
      }

      var value = new Long(lo, hi, false);
      if (relative) this.offset += 8;
      return value;
    };
    /**
     * Reads a 64bit signed integer. This is an alias of {@link ByteBuffer#readInt64}.
     * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!Long}
     * @expose
     */


    ByteBufferPrototype.readLong = ByteBufferPrototype.readInt64;
    /**
     * Writes a 64bit unsigned integer.
     * @param {number|!Long} value Value to write
     * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!ByteBuffer} this
     * @expose
     */

    ByteBufferPrototype.writeUint64 = function (value, offset) {
      var relative = typeof offset === 'undefined';
      if (relative) offset = this.offset;

      if (!this.noAssert) {
        if (typeof value === 'number') value = Long.fromNumber(value);else if (typeof value === 'string') value = Long.fromString(value);else if (!(value && value instanceof Long)) throw TypeError("Illegal value: " + value + " (not an integer or Long)");
        if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
      }

      if (typeof value === 'number') value = Long.fromNumber(value);else if (typeof value === 'string') value = Long.fromString(value);
      offset += 8;
      var capacity7 = this.buffer.length;
      if (offset > capacity7) this.resize((capacity7 *= 2) > offset ? capacity7 : offset);
      offset -= 8;
      var lo = value.low,
          hi = value.high;

      if (this.littleEndian) {
        this.buffer[offset + 3] = lo >>> 24 & 0xFF;
        this.buffer[offset + 2] = lo >>> 16 & 0xFF;
        this.buffer[offset + 1] = lo >>> 8 & 0xFF;
        this.buffer[offset] = lo & 0xFF;
        offset += 4;
        this.buffer[offset + 3] = hi >>> 24 & 0xFF;
        this.buffer[offset + 2] = hi >>> 16 & 0xFF;
        this.buffer[offset + 1] = hi >>> 8 & 0xFF;
        this.buffer[offset] = hi & 0xFF;
      } else {
        this.buffer[offset] = hi >>> 24 & 0xFF;
        this.buffer[offset + 1] = hi >>> 16 & 0xFF;
        this.buffer[offset + 2] = hi >>> 8 & 0xFF;
        this.buffer[offset + 3] = hi & 0xFF;
        offset += 4;
        this.buffer[offset] = lo >>> 24 & 0xFF;
        this.buffer[offset + 1] = lo >>> 16 & 0xFF;
        this.buffer[offset + 2] = lo >>> 8 & 0xFF;
        this.buffer[offset + 3] = lo & 0xFF;
      }

      if (relative) this.offset += 8;
      return this;
    };
    /**
     * Writes a 64bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint64}.
     * @function
     * @param {number|!Long} value Value to write
     * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!ByteBuffer} this
     * @expose
     */


    ByteBufferPrototype.writeUInt64 = ByteBufferPrototype.writeUint64;
    /**
     * Reads a 64bit unsigned integer.
     * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!Long}
     * @expose
     */

    ByteBufferPrototype.readUint64 = function (offset) {
      var relative = typeof offset === 'undefined';
      if (relative) offset = this.offset;

      if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 8 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 8 + ") <= " + this.buffer.length);
      }

      var lo = 0,
          hi = 0;

      if (this.littleEndian) {
        lo = this.buffer[offset + 2] << 16;
        lo |= this.buffer[offset + 1] << 8;
        lo |= this.buffer[offset];
        lo += this.buffer[offset + 3] << 24 >>> 0;
        offset += 4;
        hi = this.buffer[offset + 2] << 16;
        hi |= this.buffer[offset + 1] << 8;
        hi |= this.buffer[offset];
        hi += this.buffer[offset + 3] << 24 >>> 0;
      } else {
        hi = this.buffer[offset + 1] << 16;
        hi |= this.buffer[offset + 2] << 8;
        hi |= this.buffer[offset + 3];
        hi += this.buffer[offset] << 24 >>> 0;
        offset += 4;
        lo = this.buffer[offset + 1] << 16;
        lo |= this.buffer[offset + 2] << 8;
        lo |= this.buffer[offset + 3];
        lo += this.buffer[offset] << 24 >>> 0;
      }

      var value = new Long(lo, hi, true);
      if (relative) this.offset += 8;
      return value;
    };
    /**
     * Reads a 64bit unsigned integer. This is an alias of {@link ByteBuffer#readUint64}.
     * @function
     * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
     * @returns {!Long}
     * @expose
     */


    ByteBufferPrototype.readUInt64 = ByteBufferPrototype.readUint64;
  } // Long
  // types/floats/float32

  /**
   * Writes a 32bit float.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.writeFloat32 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number') throw TypeError("Illegal value: " + value + " (not a number)");
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 4;
    var capacity8 = this.buffer.length;
    if (offset > capacity8) this.resize((capacity8 *= 2) > offset ? capacity8 : offset);
    offset -= 4;
    this.littleEndian ? this.buffer.writeFloatLE(value, offset, true) : this.buffer.writeFloatBE(value, offset, true);
    if (relative) this.offset += 4;
    return this;
  };
  /**
   * Writes a 32bit float. This is an alias of {@link ByteBuffer#writeFloat32}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.writeFloat = ByteBufferPrototype.writeFloat32;
  /**
   * Reads a 32bit float.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {number}
   * @expose
   */

  ByteBufferPrototype.readFloat32 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 4 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 4 + ") <= " + this.buffer.length);
    }

    var value = this.littleEndian ? this.buffer.readFloatLE(offset, true) : this.buffer.readFloatBE(offset, true);
    if (relative) this.offset += 4;
    return value;
  };
  /**
   * Reads a 32bit float. This is an alias of {@link ByteBuffer#readFloat32}.
   * @function
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
   * @returns {number}
   * @expose
   */


  ByteBufferPrototype.readFloat = ByteBufferPrototype.readFloat32; // types/floats/float64

  /**
   * Writes a 64bit float.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */

  ByteBufferPrototype.writeFloat64 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number') throw TypeError("Illegal value: " + value + " (not a number)");
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    offset += 8;
    var capacity9 = this.buffer.length;
    if (offset > capacity9) this.resize((capacity9 *= 2) > offset ? capacity9 : offset);
    offset -= 8;
    this.littleEndian ? this.buffer.writeDoubleLE(value, offset, true) : this.buffer.writeDoubleBE(value, offset, true);
    if (relative) this.offset += 8;
    return this;
  };
  /**
   * Writes a 64bit float. This is an alias of {@link ByteBuffer#writeFloat64}.
   * @function
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.writeDouble = ByteBufferPrototype.writeFloat64;
  /**
   * Reads a 64bit float.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {number}
   * @expose
   */

  ByteBufferPrototype.readFloat64 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 8 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 8 + ") <= " + this.buffer.length);
    }

    var value = this.littleEndian ? this.buffer.readDoubleLE(offset, true) : this.buffer.readDoubleBE(offset, true);
    if (relative) this.offset += 8;
    return value;
  };
  /**
   * Reads a 64bit float. This is an alias of {@link ByteBuffer#readFloat64}.
   * @function
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
   * @returns {number}
   * @expose
   */


  ByteBufferPrototype.readDouble = ByteBufferPrototype.readFloat64; // types/varints/varint32

  /**
   * Maximum number of bytes required to store a 32bit base 128 variable-length integer.
   * @type {number}
   * @const
   * @expose
   */

  ByteBuffer.MAX_VARINT32_BYTES = 5;
  /**
   * Calculates the actual number of bytes required to store a 32bit base 128 variable-length integer.
   * @param {number} value Value to encode
   * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT32_BYTES}
   * @expose
   */

  ByteBuffer.calculateVarint32 = function (value) {
    // ref: src/google/protobuf/io/coded_stream.cc
    value = value >>> 0;
    if (value < 1 << 7) return 1;else if (value < 1 << 14) return 2;else if (value < 1 << 21) return 3;else if (value < 1 << 28) return 4;else return 5;
  };
  /**
   * Zigzag encodes a signed 32bit integer so that it can be effectively used with varint encoding.
   * @param {number} n Signed 32bit integer
   * @returns {number} Unsigned zigzag encoded 32bit integer
   * @expose
   */


  ByteBuffer.zigZagEncode32 = function (n) {
    return ((n |= 0) << 1 ^ n >> 31) >>> 0; // ref: src/google/protobuf/wire_format_lite.h
  };
  /**
   * Decodes a zigzag encoded signed 32bit integer.
   * @param {number} n Unsigned zigzag encoded 32bit integer
   * @returns {number} Signed 32bit integer
   * @expose
   */


  ByteBuffer.zigZagDecode32 = function (n) {
    return n >>> 1 ^ -(n & 1) | 0; // // ref: src/google/protobuf/wire_format_lite.h
  };
  /**
   * Writes a 32bit base 128 variable-length integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
   * @expose
   */


  ByteBufferPrototype.writeVarint32 = function (value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value |= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    var size = ByteBuffer.calculateVarint32(value),
        b;
    offset += size;
    var capacity10 = this.buffer.length;
    if (offset > capacity10) this.resize((capacity10 *= 2) > offset ? capacity10 : offset);
    offset -= size;
    value >>>= 0;

    while (value >= 0x80) {
      b = value & 0x7f | 0x80;
      this.buffer[offset++] = b;
      value >>>= 7;
    }

    this.buffer[offset++] = value;

    if (relative) {
      this.offset = offset;
      return this;
    }

    return size;
  };
  /**
   * Writes a zig-zag encoded (signed) 32bit base 128 variable-length integer.
   * @param {number} value Value to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
   * @expose
   */


  ByteBufferPrototype.writeVarint32ZigZag = function (value, offset) {
    return this.writeVarint32(ByteBuffer.zigZagEncode32(value), offset);
  };
  /**
   * Reads a 32bit base 128 variable-length integer.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
   *  and the actual number of bytes read.
   * @throws {Error} If it's not a valid varint. Has a property `truncated = true` if there is not enough data available
   *  to fully decode the varint.
   * @expose
   */


  ByteBufferPrototype.readVarint32 = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 1 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 1 + ") <= " + this.buffer.length);
    }

    var c = 0,
        value = 0 >>> 0,
        b;

    do {
      if (!this.noAssert && offset > this.limit) {
        var err = Error("Truncated");
        err['truncated'] = true;
        throw err;
      }

      b = this.buffer[offset++];
      if (c < 5) value |= (b & 0x7f) << 7 * c;
      ++c;
    } while ((b & 0x80) !== 0);

    value |= 0;

    if (relative) {
      this.offset = offset;
      return value;
    }

    return {
      "value": value,
      "length": c
    };
  };
  /**
   * Reads a zig-zag encoded (signed) 32bit base 128 variable-length integer.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
   *  and the actual number of bytes read.
   * @throws {Error} If it's not a valid varint
   * @expose
   */


  ByteBufferPrototype.readVarint32ZigZag = function (offset) {
    var val = this.readVarint32(offset);
    if (typeof val === 'object') val["value"] = ByteBuffer.zigZagDecode32(val["value"]);else val = ByteBuffer.zigZagDecode32(val);
    return val;
  }; // types/varints/varint64


  if (Long) {
    /**
     * Maximum number of bytes required to store a 64bit base 128 variable-length integer.
     * @type {number}
     * @const
     * @expose
     */
    ByteBuffer.MAX_VARINT64_BYTES = 10;
    /**
     * Calculates the actual number of bytes required to store a 64bit base 128 variable-length integer.
     * @param {number|!Long} value Value to encode
     * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT64_BYTES}
     * @expose
     */

    ByteBuffer.calculateVarint64 = function (value) {
      if (typeof value === 'number') value = Long.fromNumber(value);else if (typeof value === 'string') value = Long.fromString(value); // ref: src/google/protobuf/io/coded_stream.cc

      var part0 = value.toInt() >>> 0,
          part1 = value.shiftRightUnsigned(28).toInt() >>> 0,
          part2 = value.shiftRightUnsigned(56).toInt() >>> 0;

      if (part2 == 0) {
        if (part1 == 0) {
          if (part0 < 1 << 14) return part0 < 1 << 7 ? 1 : 2;else return part0 < 1 << 21 ? 3 : 4;
        } else {
          if (part1 < 1 << 14) return part1 < 1 << 7 ? 5 : 6;else return part1 < 1 << 21 ? 7 : 8;
        }
      } else return part2 < 1 << 7 ? 9 : 10;
    };
    /**
     * Zigzag encodes a signed 64bit integer so that it can be effectively used with varint encoding.
     * @param {number|!Long} value Signed long
     * @returns {!Long} Unsigned zigzag encoded long
     * @expose
     */


    ByteBuffer.zigZagEncode64 = function (value) {
      if (typeof value === 'number') value = Long.fromNumber(value, false);else if (typeof value === 'string') value = Long.fromString(value, false);else if (value.unsigned !== false) value = value.toSigned(); // ref: src/google/protobuf/wire_format_lite.h

      return value.shiftLeft(1).xor(value.shiftRight(63)).toUnsigned();
    };
    /**
     * Decodes a zigzag encoded signed 64bit integer.
     * @param {!Long|number} value Unsigned zigzag encoded long or JavaScript number
     * @returns {!Long} Signed long
     * @expose
     */


    ByteBuffer.zigZagDecode64 = function (value) {
      if (typeof value === 'number') value = Long.fromNumber(value, false);else if (typeof value === 'string') value = Long.fromString(value, false);else if (value.unsigned !== false) value = value.toSigned(); // ref: src/google/protobuf/wire_format_lite.h

      return value.shiftRightUnsigned(1).xor(value.and(Long.ONE).toSigned().negate()).toSigned();
    };
    /**
     * Writes a 64bit base 128 variable-length integer.
     * @param {number|Long} value Value to write
     * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
     *  written if omitted.
     * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
     * @expose
     */


    ByteBufferPrototype.writeVarint64 = function (value, offset) {
      var relative = typeof offset === 'undefined';
      if (relative) offset = this.offset;

      if (!this.noAssert) {
        if (typeof value === 'number') value = Long.fromNumber(value);else if (typeof value === 'string') value = Long.fromString(value);else if (!(value && value instanceof Long)) throw TypeError("Illegal value: " + value + " (not an integer or Long)");
        if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
      }

      if (typeof value === 'number') value = Long.fromNumber(value, false);else if (typeof value === 'string') value = Long.fromString(value, false);else if (value.unsigned !== false) value = value.toSigned();
      var size = ByteBuffer.calculateVarint64(value),
          part0 = value.toInt() >>> 0,
          part1 = value.shiftRightUnsigned(28).toInt() >>> 0,
          part2 = value.shiftRightUnsigned(56).toInt() >>> 0;
      offset += size;
      var capacity11 = this.buffer.length;
      if (offset > capacity11) this.resize((capacity11 *= 2) > offset ? capacity11 : offset);
      offset -= size;

      switch (size) {
        case 10:
          this.buffer[offset + 9] = part2 >>> 7 & 0x01;

        case 9:
          this.buffer[offset + 8] = size !== 9 ? part2 | 0x80 : part2 & 0x7F;

        case 8:
          this.buffer[offset + 7] = size !== 8 ? part1 >>> 21 | 0x80 : part1 >>> 21 & 0x7F;

        case 7:
          this.buffer[offset + 6] = size !== 7 ? part1 >>> 14 | 0x80 : part1 >>> 14 & 0x7F;

        case 6:
          this.buffer[offset + 5] = size !== 6 ? part1 >>> 7 | 0x80 : part1 >>> 7 & 0x7F;

        case 5:
          this.buffer[offset + 4] = size !== 5 ? part1 | 0x80 : part1 & 0x7F;

        case 4:
          this.buffer[offset + 3] = size !== 4 ? part0 >>> 21 | 0x80 : part0 >>> 21 & 0x7F;

        case 3:
          this.buffer[offset + 2] = size !== 3 ? part0 >>> 14 | 0x80 : part0 >>> 14 & 0x7F;

        case 2:
          this.buffer[offset + 1] = size !== 2 ? part0 >>> 7 | 0x80 : part0 >>> 7 & 0x7F;

        case 1:
          this.buffer[offset] = size !== 1 ? part0 | 0x80 : part0 & 0x7F;
      }

      if (relative) {
        this.offset += size;
        return this;
      } else {
        return size;
      }
    };
    /**
     * Writes a zig-zag encoded 64bit base 128 variable-length integer.
     * @param {number|Long} value Value to write
     * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
     *  written if omitted.
     * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
     * @expose
     */


    ByteBufferPrototype.writeVarint64ZigZag = function (value, offset) {
      return this.writeVarint64(ByteBuffer.zigZagEncode64(value), offset);
    };
    /**
     * Reads a 64bit base 128 variable-length integer. Requires Long.js.
     * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
     *  read if omitted.
     * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
     *  the actual number of bytes read.
     * @throws {Error} If it's not a valid varint
     * @expose
     */


    ByteBufferPrototype.readVarint64 = function (offset) {
      var relative = typeof offset === 'undefined';
      if (relative) offset = this.offset;

      if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 1 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 1 + ") <= " + this.buffer.length);
      } // ref: src/google/protobuf/io/coded_stream.cc


      var start = offset,
          part0 = 0,
          part1 = 0,
          part2 = 0,
          b = 0;
      b = this.buffer[offset++];
      part0 = b & 0x7F;

      if (b & 0x80) {
        b = this.buffer[offset++];
        part0 |= (b & 0x7F) << 7;

        if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
          b = this.buffer[offset++];
          part0 |= (b & 0x7F) << 14;

          if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
            b = this.buffer[offset++];
            part0 |= (b & 0x7F) << 21;

            if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
              b = this.buffer[offset++];
              part1 = b & 0x7F;

              if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
                b = this.buffer[offset++];
                part1 |= (b & 0x7F) << 7;

                if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
                  b = this.buffer[offset++];
                  part1 |= (b & 0x7F) << 14;

                  if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
                    b = this.buffer[offset++];
                    part1 |= (b & 0x7F) << 21;

                    if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
                      b = this.buffer[offset++];
                      part2 = b & 0x7F;

                      if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
                        b = this.buffer[offset++];
                        part2 |= (b & 0x7F) << 7;

                        if (b & 0x80 || this.noAssert && typeof b === 'undefined') {
                          throw Error("Buffer overrun");
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      var value = Long.fromBits(part0 | part1 << 28, part1 >>> 4 | part2 << 24, false);

      if (relative) {
        this.offset = offset;
        return value;
      } else {
        return {
          'value': value,
          'length': offset - start
        };
      }
    };
    /**
     * Reads a zig-zag encoded 64bit base 128 variable-length integer. Requires Long.js.
     * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
     *  read if omitted.
     * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
     *  the actual number of bytes read.
     * @throws {Error} If it's not a valid varint
     * @expose
     */


    ByteBufferPrototype.readVarint64ZigZag = function (offset) {
      var val = this.readVarint64(offset);
      if (val && val['value'] instanceof Long) val["value"] = ByteBuffer.zigZagDecode64(val["value"]);else val = ByteBuffer.zigZagDecode64(val);
      return val;
    };
  } // Long
  // types/strings/cstring

  /**
   * Writes a NULL-terminated UTF8 encoded string. For this to work the specified string must not contain any NULL
   *  characters itself.
   * @param {string} str String to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  contained in `str` + 1 if omitted.
   * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written
   * @expose
   */


  ByteBufferPrototype.writeCString = function (str, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    var i,
        k = str.length;

    if (!this.noAssert) {
      if (typeof str !== 'string') throw TypeError("Illegal str: Not a string");

      for (i = 0; i < k; ++i) {
        if (str.charCodeAt(i) === 0) throw RangeError("Illegal str: Contains NULL-characters");
      }

      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    } // UTF8 strings do not contain zero bytes in between except for the zero character, so:


    k = Buffer.byteLength(str, "utf8");
    offset += k + 1;
    var capacity12 = this.buffer.length;
    if (offset > capacity12) this.resize((capacity12 *= 2) > offset ? capacity12 : offset);
    offset -= k + 1;
    offset += this.buffer.write(str, offset, k, "utf8");
    this.buffer[offset++] = 0;

    if (relative) {
      this.offset = offset;
      return this;
    }

    return k;
  };
  /**
   * Reads a NULL-terminated UTF8 encoded string. For this to work the string read must not contain any NULL characters
   *  itself.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  read if omitted.
   * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
   *  read and the actual number of bytes read.
   * @expose
   */


  ByteBufferPrototype.readCString = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 1 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 1 + ") <= " + this.buffer.length);
    }

    var start = offset,
        temp; // UTF8 strings do not contain zero bytes in between except for the zero character itself, so:

    do {
      if (offset >= this.buffer.length) throw RangeError("Index out of range: " + offset + " <= " + this.buffer.length);
      temp = this.buffer[offset++];
    } while (temp !== 0);

    var str = this.buffer.toString("utf8", start, offset - 1);

    if (relative) {
      this.offset = offset;
      return str;
    } else {
      return {
        "string": str,
        "length": offset - start
      };
    }
  }; // types/strings/istring

  /**
   * Writes a length as uint32 prefixed UTF8 encoded string.
   * @param {string} str String to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
   * @expose
   * @see ByteBuffer#writeVarint32
   */


  ByteBufferPrototype.writeIString = function (str, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof str !== 'string') throw TypeError("Illegal str: Not a string");
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    var start = offset,
        k;
    k = Buffer.byteLength(str, "utf8");
    offset += 4 + k;
    var capacity13 = this.buffer.length;
    if (offset > capacity13) this.resize((capacity13 *= 2) > offset ? capacity13 : offset);
    offset -= 4 + k;

    if (this.littleEndian) {
      this.buffer[offset + 3] = k >>> 24 & 0xFF;
      this.buffer[offset + 2] = k >>> 16 & 0xFF;
      this.buffer[offset + 1] = k >>> 8 & 0xFF;
      this.buffer[offset] = k & 0xFF;
    } else {
      this.buffer[offset] = k >>> 24 & 0xFF;
      this.buffer[offset + 1] = k >>> 16 & 0xFF;
      this.buffer[offset + 2] = k >>> 8 & 0xFF;
      this.buffer[offset + 3] = k & 0xFF;
    }

    offset += 4;
    offset += this.buffer.write(str, offset, k, "utf8");

    if (relative) {
      this.offset = offset;
      return this;
    }

    return offset - start;
  };
  /**
   * Reads a length as uint32 prefixed UTF8 encoded string.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  read if omitted.
   * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
   *  read and the actual number of bytes read.
   * @expose
   * @see ByteBuffer#readVarint32
   */


  ByteBufferPrototype.readIString = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 4 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 4 + ") <= " + this.buffer.length);
    }

    var start = offset;
    var len = this.readUint32(offset);
    var str = this.readUTF8String(len, ByteBuffer.METRICS_BYTES, offset += 4);
    offset += str['length'];

    if (relative) {
      this.offset = offset;
      return str['string'];
    } else {
      return {
        'string': str['string'],
        'length': offset - start
      };
    }
  }; // types/strings/utf8string

  /**
   * Metrics representing number of UTF8 characters. Evaluates to `c`.
   * @type {string}
   * @const
   * @expose
   */


  ByteBuffer.METRICS_CHARS = 'c';
  /**
   * Metrics representing number of bytes. Evaluates to `b`.
   * @type {string}
   * @const
   * @expose
   */

  ByteBuffer.METRICS_BYTES = 'b';
  /**
   * Writes an UTF8 encoded string.
   * @param {string} str String to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
   * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
   * @expose
   */

  ByteBufferPrototype.writeUTF8String = function (str, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    var k;
    k = Buffer.byteLength(str, "utf8");
    offset += k;
    var capacity14 = this.buffer.length;
    if (offset > capacity14) this.resize((capacity14 *= 2) > offset ? capacity14 : offset);
    offset -= k;
    offset += this.buffer.write(str, offset, k, "utf8");

    if (relative) {
      this.offset = offset;
      return this;
    }

    return k;
  };
  /**
   * Writes an UTF8 encoded string. This is an alias of {@link ByteBuffer#writeUTF8String}.
   * @function
   * @param {string} str String to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
   * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
   * @expose
   */


  ByteBufferPrototype.writeString = ByteBufferPrototype.writeUTF8String;
  /**
   * Calculates the number of UTF8 characters of a string. JavaScript itself uses UTF-16, so that a string's
   *  `length` property does not reflect its actual UTF8 size if it contains code points larger than 0xFFFF.
   * @param {string} str String to calculate
   * @returns {number} Number of UTF8 characters
   * @expose
   */

  ByteBuffer.calculateUTF8Chars = function (str) {
    return utfx.calculateUTF16asUTF8(stringSource(str))[0];
  };
  /**
   * Calculates the number of UTF8 bytes of a string.
   * @param {string} str String to calculate
   * @returns {number} Number of UTF8 bytes
   * @expose
   */


  ByteBuffer.calculateUTF8Bytes = function (str) {
    if (typeof str !== 'string') throw TypeError("Illegal argument: " + typeof str);
    return Buffer.byteLength(str, "utf8");
  };
  /**
   * Calculates the number of UTF8 bytes of a string. This is an alias of {@link ByteBuffer.calculateUTF8Bytes}.
   * @function
   * @param {string} str String to calculate
   * @returns {number} Number of UTF8 bytes
   * @expose
   */


  ByteBuffer.calculateString = ByteBuffer.calculateUTF8Bytes;
  /**
   * Reads an UTF8 encoded string.
   * @param {number} length Number of characters or bytes to read.
   * @param {string=} metrics Metrics specifying what `length` is meant to count. Defaults to
   *  {@link ByteBuffer.METRICS_CHARS}.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  read if omitted.
   * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
   *  read and the actual number of bytes read.
   * @expose
   */

  ByteBufferPrototype.readUTF8String = function (length, metrics, offset) {
    if (typeof metrics === 'number') {
      offset = metrics;
      metrics = undefined;
    }

    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (typeof metrics === 'undefined') metrics = ByteBuffer.METRICS_CHARS;

    if (!this.noAssert) {
      if (typeof length !== 'number' || length % 1 !== 0) throw TypeError("Illegal length: " + length + " (not an integer)");
      length |= 0;
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    var i = 0,
        start = offset,
        temp,
        sd;

    if (metrics === ByteBuffer.METRICS_CHARS) {
      // The same for node and the browser
      sd = stringDestination();
      utfx.decodeUTF8(function () {
        return i < length && offset < this.limit ? this.buffer[offset++] : null;
      }.bind(this), function (cp) {
        ++i;
        utfx.UTF8toUTF16(cp, sd);
      });
      if (i !== length) throw RangeError("Illegal range: Truncated data, " + i + " == " + length);

      if (relative) {
        this.offset = offset;
        return sd();
      } else {
        return {
          "string": sd(),
          "length": offset - start
        };
      }
    } else if (metrics === ByteBuffer.METRICS_BYTES) {
      if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + length > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + length + ") <= " + this.buffer.length);
      }

      temp = this.buffer.toString("utf8", offset, offset + length);

      if (relative) {
        this.offset += length;
        return temp;
      } else {
        return {
          'string': temp,
          'length': length
        };
      }
    } else throw TypeError("Unsupported metrics: " + metrics);
  };
  /**
   * Reads an UTF8 encoded string. This is an alias of {@link ByteBuffer#readUTF8String}.
   * @function
   * @param {number} length Number of characters or bytes to read
   * @param {number=} metrics Metrics specifying what `n` is meant to count. Defaults to
   *  {@link ByteBuffer.METRICS_CHARS}.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  read if omitted.
   * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
   *  read and the actual number of bytes read.
   * @expose
   */


  ByteBufferPrototype.readString = ByteBufferPrototype.readUTF8String; // types/strings/vstring

  /**
   * Writes a length as varint32 prefixed UTF8 encoded string.
   * @param {string} str String to write
   * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
   * @expose
   * @see ByteBuffer#writeVarint32
   */

  ByteBufferPrototype.writeVString = function (str, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof str !== 'string') throw TypeError("Illegal str: Not a string");
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    var start = offset,
        k,
        l;
    k = Buffer.byteLength(str, "utf8");
    l = ByteBuffer.calculateVarint32(k);
    offset += l + k;
    var capacity15 = this.buffer.length;
    if (offset > capacity15) this.resize((capacity15 *= 2) > offset ? capacity15 : offset);
    offset -= l + k;
    offset += this.writeVarint32(k, offset);
    offset += this.buffer.write(str, offset, k, "utf8");

    if (relative) {
      this.offset = offset;
      return this;
    }

    return offset - start;
  };
  /**
   * Reads a length as varint32 prefixed UTF8 encoded string.
   * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  read if omitted.
   * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
   *  read and the actual number of bytes read.
   * @expose
   * @see ByteBuffer#readVarint32
   */


  ByteBufferPrototype.readVString = function (offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 1 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 1 + ") <= " + this.buffer.length);
    }

    var start = offset;
    var len = this.readVarint32(offset);
    var str = this.readUTF8String(len['value'], ByteBuffer.METRICS_BYTES, offset += len['length']);
    offset += str['length'];

    if (relative) {
      this.offset = offset;
      return str['string'];
    } else {
      return {
        'string': str['string'],
        'length': offset - start
      };
    }
  };
  /**
   * Appends some data to this ByteBuffer. This will overwrite any contents behind the specified offset up to the appended
   *  data's length.
   * @param {!ByteBuffer|!Buffer|!ArrayBuffer|!Uint8Array|string} source Data to append. If `source` is a ByteBuffer, its
   * offsets will be modified according to the performed read operation.
   * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
   * @param {number=} offset Offset to append at. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   * @example A relative `<01 02>03.append(<04 05>)` will result in `<01 02 04 05>, 04 05|`
   * @example An absolute `<01 02>03.append(04 05>, 1)` will result in `<01 04>05, 04 05|`
   */


  ByteBufferPrototype.append = function (source, encoding, offset) {
    if (typeof encoding === 'number' || typeof encoding !== 'string') {
      offset = encoding;
      encoding = undefined;
    }

    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    if (!(source instanceof ByteBuffer)) source = ByteBuffer.wrap(source, encoding);
    var length = source.limit - source.offset;
    if (length <= 0) return this; // Nothing to append

    offset += length;
    var capacity16 = this.buffer.length;
    if (offset > capacity16) this.resize((capacity16 *= 2) > offset ? capacity16 : offset);
    offset -= length;
    source.buffer.copy(this.buffer, offset, source.offset, source.limit);
    source.offset += length;
    if (relative) this.offset += length;
    return this;
  };
  /**
   * Appends this ByteBuffer's contents to another ByteBuffer. This will overwrite any contents at and after the
      specified offset up to the length of this ByteBuffer's data.
   * @param {!ByteBuffer} target Target ByteBuffer
   * @param {number=} offset Offset to append to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  read if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   * @see ByteBuffer#append
   */


  ByteBufferPrototype.appendTo = function (target, offset) {
    target.append(this, offset);
    return this;
  };
  /**
   * Enables or disables assertions of argument types and offsets. Assertions are enabled by default but you can opt to
   *  disable them if your code already makes sure that everything is valid.
   * @param {boolean} assert `true` to enable assertions, otherwise `false`
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.assert = function (assert) {
    this.noAssert = !assert;
    return this;
  };
  /**
   * Gets the capacity of this ByteBuffer's backing buffer.
   * @returns {number} Capacity of the backing buffer
   * @expose
   */


  ByteBufferPrototype.capacity = function () {
    return this.buffer.length;
  };
  /**
   * Clears this ByteBuffer's offsets by setting {@link ByteBuffer#offset} to `0` and {@link ByteBuffer#limit} to the
   *  backing buffer's capacity. Discards {@link ByteBuffer#markedOffset}.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.clear = function () {
    this.offset = 0;
    this.limit = this.buffer.length;
    this.markedOffset = -1;
    return this;
  };
  /**
   * Creates a cloned instance of this ByteBuffer, preset with this ByteBuffer's values for {@link ByteBuffer#offset},
   *  {@link ByteBuffer#markedOffset} and {@link ByteBuffer#limit}.
   * @param {boolean=} copy Whether to copy the backing buffer or to return another view on the same, defaults to `false`
   * @returns {!ByteBuffer} Cloned instance
   * @expose
   */


  ByteBufferPrototype.clone = function (copy) {
    var bb = new ByteBuffer(0, this.littleEndian, this.noAssert);

    if (copy) {
      var buffer = new Buffer(this.buffer.length);
      this.buffer.copy(buffer);
      bb.buffer = buffer;
    } else {
      bb.buffer = this.buffer;
    }

    bb.offset = this.offset;
    bb.markedOffset = this.markedOffset;
    bb.limit = this.limit;
    return bb;
  };
  /**
   * Compacts this ByteBuffer to be backed by a {@link ByteBuffer#buffer} of its contents' length. Contents are the bytes
   *  between {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will set `offset = 0` and `limit = capacity` and
   *  adapt {@link ByteBuffer#markedOffset} to the same relative position if set.
   * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
   * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.compact = function (begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;

    if (!this.noAssert) {
      if (typeof begin !== 'number' || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
      begin >>>= 0;
      if (typeof end !== 'number' || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
      end >>>= 0;
      if (begin < 0 || begin > end || end > this.buffer.length) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.length);
    }

    if (begin === 0 && end === this.buffer.length) return this; // Already compacted

    var len = end - begin;

    if (len === 0) {
      this.buffer = EMPTY_BUFFER;
      if (this.markedOffset >= 0) this.markedOffset -= begin;
      this.offset = 0;
      this.limit = 0;
      return this;
    }

    var buffer = new Buffer(len);
    this.buffer.copy(buffer, 0, begin, end);
    this.buffer = buffer;
    if (this.markedOffset >= 0) this.markedOffset -= begin;
    this.offset = 0;
    this.limit = len;
    return this;
  };
  /**
   * Creates a copy of this ByteBuffer's contents. Contents are the bytes between {@link ByteBuffer#offset} and
   *  {@link ByteBuffer#limit}.
   * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
   * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
   * @returns {!ByteBuffer} Copy
   * @expose
   */


  ByteBufferPrototype.copy = function (begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;

    if (!this.noAssert) {
      if (typeof begin !== 'number' || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
      begin >>>= 0;
      if (typeof end !== 'number' || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
      end >>>= 0;
      if (begin < 0 || begin > end || end > this.buffer.length) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.length);
    }

    if (begin === end) return new ByteBuffer(0, this.littleEndian, this.noAssert);
    var capacity = end - begin,
        bb = new ByteBuffer(capacity, this.littleEndian, this.noAssert);
    bb.offset = 0;
    bb.limit = capacity;
    if (bb.markedOffset >= 0) bb.markedOffset -= begin;
    this.copyTo(bb, 0, begin, end);
    return bb;
  };
  /**
   * Copies this ByteBuffer's contents to another ByteBuffer. Contents are the bytes between {@link ByteBuffer#offset} and
   *  {@link ByteBuffer#limit}.
   * @param {!ByteBuffer} target Target ByteBuffer
   * @param {number=} targetOffset Offset to copy to. Will use and increase the target's {@link ByteBuffer#offset}
   *  by the number of bytes copied if omitted.
   * @param {number=} sourceOffset Offset to start copying from. Will use and increase {@link ByteBuffer#offset} by the
   *  number of bytes copied if omitted.
   * @param {number=} sourceLimit Offset to end copying from, defaults to {@link ByteBuffer#limit}
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.copyTo = function (target, targetOffset, sourceOffset, sourceLimit) {
    var relative, targetRelative;

    if (!this.noAssert) {
      if (!ByteBuffer.isByteBuffer(target)) throw TypeError("Illegal target: Not a ByteBuffer");
    }

    targetOffset = (targetRelative = typeof targetOffset === 'undefined') ? target.offset : targetOffset | 0;
    sourceOffset = (relative = typeof sourceOffset === 'undefined') ? this.offset : sourceOffset | 0;
    sourceLimit = typeof sourceLimit === 'undefined' ? this.limit : sourceLimit | 0;
    if (targetOffset < 0 || targetOffset > target.buffer.length) throw RangeError("Illegal target range: 0 <= " + targetOffset + " <= " + target.buffer.length);
    if (sourceOffset < 0 || sourceLimit > this.buffer.length) throw RangeError("Illegal source range: 0 <= " + sourceOffset + " <= " + this.buffer.length);
    var len = sourceLimit - sourceOffset;
    if (len === 0) return target; // Nothing to copy

    target.ensureCapacity(targetOffset + len);
    this.buffer.copy(target.buffer, targetOffset, sourceOffset, sourceLimit);
    if (relative) this.offset += len;
    if (targetRelative) target.offset += len;
    return this;
  };
  /**
   * Makes sure that this ByteBuffer is backed by a {@link ByteBuffer#buffer} of at least the specified capacity. If the
   *  current capacity is exceeded, it will be doubled. If double the current capacity is less than the required capacity,
   *  the required capacity will be used instead.
   * @param {number} capacity Required capacity
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.ensureCapacity = function (capacity) {
    var current = this.buffer.length;
    if (current < capacity) return this.resize((current *= 2) > capacity ? current : capacity);
    return this;
  };
  /**
   * Overwrites this ByteBuffer's contents with the specified value. Contents are the bytes between
   *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
   * @param {number|string} value Byte value to fill with. If given as a string, the first character is used.
   * @param {number=} begin Begin offset. Will use and increase {@link ByteBuffer#offset} by the number of bytes
   *  written if omitted. defaults to {@link ByteBuffer#offset}.
   * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
   * @returns {!ByteBuffer} this
   * @expose
   * @example `someByteBuffer.clear().fill(0)` fills the entire backing buffer with zeroes
   */


  ByteBufferPrototype.fill = function (value, begin, end) {
    var relative = typeof begin === 'undefined';
    if (relative) begin = this.offset;
    if (typeof value === 'string' && value.length > 0) value = value.charCodeAt(0);
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;

    if (!this.noAssert) {
      if (typeof value !== 'number' || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
      value |= 0;
      if (typeof begin !== 'number' || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
      begin >>>= 0;
      if (typeof end !== 'number' || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
      end >>>= 0;
      if (begin < 0 || begin > end || end > this.buffer.length) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.length);
    }

    if (begin >= end) return this; // Nothing to fill

    this.buffer.fill(value, begin, end);
    begin = end;
    if (relative) this.offset = begin;
    return this;
  };
  /**
   * Makes this ByteBuffer ready for a new sequence of write or relative read operations. Sets `limit = offset` and
   *  `offset = 0`. Make sure always to flip a ByteBuffer when all relative read or write operations are complete.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.flip = function () {
    this.limit = this.offset;
    this.offset = 0;
    return this;
  };
  /**
   * Marks an offset on this ByteBuffer to be used later.
   * @param {number=} offset Offset to mark. Defaults to {@link ByteBuffer#offset}.
   * @returns {!ByteBuffer} this
   * @throws {TypeError} If `offset` is not a valid number
   * @throws {RangeError} If `offset` is out of bounds
   * @see ByteBuffer#reset
   * @expose
   */


  ByteBufferPrototype.mark = function (offset) {
    offset = typeof offset === 'undefined' ? this.offset : offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    this.markedOffset = offset;
    return this;
  };
  /**
   * Sets the byte order.
   * @param {boolean} littleEndian `true` for little endian byte order, `false` for big endian
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.order = function (littleEndian) {
    if (!this.noAssert) {
      if (typeof littleEndian !== 'boolean') throw TypeError("Illegal littleEndian: Not a boolean");
    }

    this.littleEndian = !!littleEndian;
    return this;
  };
  /**
   * Switches (to) little endian byte order.
   * @param {boolean=} littleEndian Defaults to `true`, otherwise uses big endian
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.LE = function (littleEndian) {
    this.littleEndian = typeof littleEndian !== 'undefined' ? !!littleEndian : true;
    return this;
  };
  /**
   * Switches (to) big endian byte order.
   * @param {boolean=} bigEndian Defaults to `true`, otherwise uses little endian
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.BE = function (bigEndian) {
    this.littleEndian = typeof bigEndian !== 'undefined' ? !bigEndian : false;
    return this;
  };
  /**
   * Prepends some data to this ByteBuffer. This will overwrite any contents before the specified offset up to the
   *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
   *  will be resized and its contents moved accordingly.
   * @param {!ByteBuffer|string||!Buffer} source Data to prepend. If `source` is a ByteBuffer, its offset will be modified
   *  according to the performed read operation.
   * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
   * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
   *  prepended if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   * @example A relative `00<01 02 03>.prepend(<04 05>)` results in `<04 05 01 02 03>, 04 05|`
   * @example An absolute `00<01 02 03>.prepend(<04 05>, 2)` results in `04<05 02 03>, 04 05|`
   */


  ByteBufferPrototype.prepend = function (source, encoding, offset) {
    if (typeof encoding === 'number' || typeof encoding !== 'string') {
      offset = encoding;
      encoding = undefined;
    }

    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
      offset >>>= 0;
      if (offset < 0 || offset + 0 > this.buffer.length) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + 0 + ") <= " + this.buffer.length);
    }

    if (!(source instanceof ByteBuffer)) source = ByteBuffer.wrap(source, encoding);
    var len = source.limit - source.offset;
    if (len <= 0) return this; // Nothing to prepend

    var diff = len - offset;

    if (diff > 0) {
      // Not enough space before offset, so resize + move
      var buffer = new Buffer(this.buffer.length + diff);
      this.buffer.copy(buffer, len, offset, this.buffer.length);
      this.buffer = buffer;
      this.offset += diff;
      if (this.markedOffset >= 0) this.markedOffset += diff;
      this.limit += diff;
      offset += diff;
    }

    source.buffer.copy(this.buffer, offset - len, source.offset, source.limit);
    source.offset = source.limit;
    if (relative) this.offset -= len;
    return this;
  };
  /**
   * Prepends this ByteBuffer to another ByteBuffer. This will overwrite any contents before the specified offset up to the
   *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
   *  will be resized and its contents moved accordingly.
   * @param {!ByteBuffer} target Target ByteBuffer
   * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
   *  prepended if omitted.
   * @returns {!ByteBuffer} this
   * @expose
   * @see ByteBuffer#prepend
   */


  ByteBufferPrototype.prependTo = function (target, offset) {
    target.prepend(this, offset);
    return this;
  };
  /**
   * Prints debug information about this ByteBuffer's contents.
   * @param {function(string)=} out Output function to call, defaults to console.log
   * @expose
   */


  ByteBufferPrototype.printDebug = function (out) {
    if (typeof out !== 'function') out = console.log.bind(console);
    out(this.toString() + "\n" + "-------------------------------------------------------------------\n" + this.toDebug(
    /* columns */
    true));
  };
  /**
   * Gets the number of remaining readable bytes. Contents are the bytes between {@link ByteBuffer#offset} and
   *  {@link ByteBuffer#limit}, so this returns `limit - offset`.
   * @returns {number} Remaining readable bytes. May be negative if `offset > limit`.
   * @expose
   */


  ByteBufferPrototype.remaining = function () {
    return this.limit - this.offset;
  };
  /**
   * Resets this ByteBuffer's {@link ByteBuffer#offset}. If an offset has been marked through {@link ByteBuffer#mark}
   *  before, `offset` will be set to {@link ByteBuffer#markedOffset}, which will then be discarded. If no offset has been
   *  marked, sets `offset = 0`.
   * @returns {!ByteBuffer} this
   * @see ByteBuffer#mark
   * @expose
   */


  ByteBufferPrototype.reset = function () {
    if (this.markedOffset >= 0) {
      this.offset = this.markedOffset;
      this.markedOffset = -1;
    } else {
      this.offset = 0;
    }

    return this;
  };
  /**
   * Resizes this ByteBuffer to be backed by a buffer of at least the given capacity. Will do nothing if already that
   *  large or larger.
   * @param {number} capacity Capacity required
   * @returns {!ByteBuffer} this
   * @throws {TypeError} If `capacity` is not a number
   * @throws {RangeError} If `capacity < 0`
   * @expose
   */


  ByteBufferPrototype.resize = function (capacity) {
    if (!this.noAssert) {
      if (typeof capacity !== 'number' || capacity % 1 !== 0) throw TypeError("Illegal capacity: " + capacity + " (not an integer)");
      capacity |= 0;
      if (capacity < 0) throw RangeError("Illegal capacity: 0 <= " + capacity);
    }

    if (this.buffer.length < capacity) {
      var buffer = new Buffer(capacity);
      this.buffer.copy(buffer);
      this.buffer = buffer;
    }

    return this;
  };
  /**
   * Reverses this ByteBuffer's contents.
   * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
   * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.reverse = function (begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;

    if (!this.noAssert) {
      if (typeof begin !== 'number' || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
      begin >>>= 0;
      if (typeof end !== 'number' || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
      end >>>= 0;
      if (begin < 0 || begin > end || end > this.buffer.length) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.length);
    }

    if (begin === end) return this; // Nothing to reverse

    Array.prototype.reverse.call(this.buffer.slice(begin, end));
    return this;
  };
  /**
   * Skips the next `length` bytes. This will just advance
   * @param {number} length Number of bytes to skip. May also be negative to move the offset back.
   * @returns {!ByteBuffer} this
   * @expose
   */


  ByteBufferPrototype.skip = function (length) {
    if (!this.noAssert) {
      if (typeof length !== 'number' || length % 1 !== 0) throw TypeError("Illegal length: " + length + " (not an integer)");
      length |= 0;
    }

    var offset = this.offset + length;

    if (!this.noAssert) {
      if (offset < 0 || offset > this.buffer.length) throw RangeError("Illegal length: 0 <= " + this.offset + " + " + length + " <= " + this.buffer.length);
    }

    this.offset = offset;
    return this;
  };
  /**
   * Slices this ByteBuffer by creating a cloned instance with `offset = begin` and `limit = end`.
   * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
   * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
   * @returns {!ByteBuffer} Clone of this ByteBuffer with slicing applied, backed by the same {@link ByteBuffer#buffer}
   * @expose
   */


  ByteBufferPrototype.slice = function (begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;

    if (!this.noAssert) {
      if (typeof begin !== 'number' || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
      begin >>>= 0;
      if (typeof end !== 'number' || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
      end >>>= 0;
      if (begin < 0 || begin > end || end > this.buffer.length) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.length);
    }

    var bb = this.clone();
    bb.offset = begin;
    bb.limit = end;
    return bb;
  };
  /**
   * Returns a copy of the backing buffer that contains this ByteBuffer's contents. Contents are the bytes between
   *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
   * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory if
   *  possible. Defaults to `false`
   * @returns {!Buffer} Contents as a Buffer
   * @expose
   */


  ByteBufferPrototype.toBuffer = function (forceCopy) {
    var offset = this.offset,
        limit = this.limit;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: Not an integer");
      offset >>>= 0;
      if (typeof limit !== 'number' || limit % 1 !== 0) throw TypeError("Illegal limit: Not an integer");
      limit >>>= 0;
      if (offset < 0 || offset > limit || limit > this.buffer.length) throw RangeError("Illegal range: 0 <= " + offset + " <= " + limit + " <= " + this.buffer.length);
    }

    if (forceCopy) {
      var buffer = new Buffer(limit - offset);
      this.buffer.copy(buffer, 0, offset, limit);
      return buffer;
    } else {
      if (offset === 0 && limit === this.buffer.length) return this.buffer;else return this.buffer.slice(offset, limit);
    }
  };
  /**
   * Returns a copy of the backing buffer compacted to contain this ByteBuffer's contents. Contents are the bytes between
   *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
   * @returns {!ArrayBuffer} Contents as an ArrayBuffer
   */


  ByteBufferPrototype.toArrayBuffer = function () {
    var offset = this.offset,
        limit = this.limit;

    if (!this.noAssert) {
      if (typeof offset !== 'number' || offset % 1 !== 0) throw TypeError("Illegal offset: Not an integer");
      offset >>>= 0;
      if (typeof limit !== 'number' || limit % 1 !== 0) throw TypeError("Illegal limit: Not an integer");
      limit >>>= 0;
      if (offset < 0 || offset > limit || limit > this.buffer.length) throw RangeError("Illegal range: 0 <= " + offset + " <= " + limit + " <= " + this.buffer.length);
    }

    var ab = new ArrayBuffer(limit - offset);

    if (memcpy) {
      // Fast
      memcpy(ab, 0, this.buffer, offset, limit);
    } else {
      // Slow
      var dst = new Uint8Array(ab);

      for (var i = offset; i < limit; ++i) dst[i - offset] = this.buffer[i];
    }

    return ab;
  };
  /**
   * Converts the ByteBuffer's contents to a string.
   * @param {string=} encoding Output encoding. Returns an informative string representation if omitted but also allows
   *  direct conversion to "utf8", "hex", "base64" and "binary" encoding. "debug" returns a hex representation with
   *  highlighted offsets.
   * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}
   * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
   * @returns {string} String representation
   * @throws {Error} If `encoding` is invalid
   * @expose
   */


  ByteBufferPrototype.toString = function (encoding, begin, end) {
    if (typeof encoding === 'undefined') return "ByteBufferNB(offset=" + this.offset + ",markedOffset=" + this.markedOffset + ",limit=" + this.limit + ",capacity=" + this.capacity() + ")";
    if (typeof encoding === 'number') encoding = "utf8", begin = encoding, end = begin;

    switch (encoding) {
      case "utf8":
        return this.toUTF8(begin, end);

      case "base64":
        return this.toBase64(begin, end);

      case "hex":
        return this.toHex(begin, end);

      case "binary":
        return this.toBinary(begin, end);

      case "debug":
        return this.toDebug();

      case "columns":
        return this.toColumns();

      default:
        throw Error("Unsupported encoding: " + encoding);
    }
  }; // encodings/base64

  /**
   * Encodes this ByteBuffer's contents to a base64 encoded string.
   * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}.
   * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}.
   * @returns {string} Base64 encoded string
   * @throws {RangeError} If `begin` or `end` is out of bounds
   * @expose
   */


  ByteBufferPrototype.toBase64 = function (begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    begin = begin | 0;
    end = end | 0;
    if (begin < 0 || end > this.capacity || begin > end) throw RangeError("begin, end");
    return this.buffer.toString("base64", begin, end);
  };
  /**
   * Decodes a base64 encoded string to a ByteBuffer.
   * @param {string} str String to decode
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @returns {!ByteBuffer} ByteBuffer
   * @expose
   */


  ByteBuffer.fromBase64 = function (str, littleEndian) {
    return ByteBuffer.wrap(new Buffer(str, "base64"), littleEndian);
  };
  /**
   * Encodes a binary string to base64 like `window.btoa` does.
   * @param {string} str Binary string
   * @returns {string} Base64 encoded string
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.btoa
   * @expose
   */


  ByteBuffer.btoa = function (str) {
    return ByteBuffer.fromBinary(str).toBase64();
  };
  /**
   * Decodes a base64 encoded string to binary like `window.atob` does.
   * @param {string} b64 Base64 encoded string
   * @returns {string} Binary string
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.atob
   * @expose
   */


  ByteBuffer.atob = function (b64) {
    return ByteBuffer.fromBase64(b64).toBinary();
  }; // encodings/binary

  /**
   * Encodes this ByteBuffer to a binary encoded string, that is using only characters 0x00-0xFF as bytes.
   * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
   * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
   * @returns {string} Binary encoded string
   * @throws {RangeError} If `offset > limit`
   * @expose
   */


  ByteBufferPrototype.toBinary = function (begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    begin |= 0;
    end |= 0;
    if (begin < 0 || end > this.capacity() || begin > end) throw RangeError("begin, end");
    return this.buffer.toString("binary", begin, end);
  };
  /**
   * Decodes a binary encoded string, that is using only characters 0x00-0xFF as bytes, to a ByteBuffer.
   * @param {string} str String to decode
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @returns {!ByteBuffer} ByteBuffer
   * @expose
   */


  ByteBuffer.fromBinary = function (str, littleEndian) {
    return ByteBuffer.wrap(new Buffer(str, "binary"), littleEndian);
  }; // encodings/debug

  /**
   * Encodes this ByteBuffer to a hex encoded string with marked offsets. Offset symbols are:
   * * `<` : offset,
   * * `'` : markedOffset,
   * * `>` : limit,
   * * `|` : offset and limit,
   * * `[` : offset and markedOffset,
   * * `]` : markedOffset and limit,
   * * `!` : offset, markedOffset and limit
   * @param {boolean=} columns If `true` returns two columns hex + ascii, defaults to `false`
   * @returns {string|!Array.<string>} Debug string or array of lines if `asArray = true`
   * @expose
   * @example `>00'01 02<03` contains four bytes with `limit=0, markedOffset=1, offset=3`
   * @example `00[01 02 03>` contains four bytes with `offset=markedOffset=1, limit=4`
   * @example `00|01 02 03` contains four bytes with `offset=limit=1, markedOffset=-1`
   * @example `|` contains zero bytes with `offset=limit=0, markedOffset=-1`
   */


  ByteBufferPrototype.toDebug = function (columns) {
    var i = -1,
        k = this.buffer.length,
        b,
        hex = "",
        asc = "",
        out = "";

    while (i < k) {
      if (i !== -1) {
        b = this.buffer[i];
        if (b < 0x10) hex += "0" + b.toString(16).toUpperCase();else hex += b.toString(16).toUpperCase();
        if (columns) asc += b > 32 && b < 127 ? String.fromCharCode(b) : '.';
      }

      ++i;

      if (columns) {
        if (i > 0 && i % 16 === 0 && i !== k) {
          while (hex.length < 3 * 16 + 3) hex += " ";

          out += hex + asc + "\n";
          hex = asc = "";
        }
      }

      if (i === this.offset && i === this.limit) hex += i === this.markedOffset ? "!" : "|";else if (i === this.offset) hex += i === this.markedOffset ? "[" : "<";else if (i === this.limit) hex += i === this.markedOffset ? "]" : ">";else hex += i === this.markedOffset ? "'" : columns || i !== 0 && i !== k ? " " : "";
    }

    if (columns && hex !== " ") {
      while (hex.length < 3 * 16 + 3) hex += " ";

      out += hex + asc + "\n";
    }

    return columns ? out : hex;
  };
  /**
   * Decodes a hex encoded string with marked offsets to a ByteBuffer.
   * @param {string} str Debug string to decode (not be generated with `columns = true`)
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @returns {!ByteBuffer} ByteBuffer
   * @expose
   * @see ByteBuffer#toDebug
   */


  ByteBuffer.fromDebug = function (str, littleEndian, noAssert) {
    var k = str.length,
        bb = new ByteBuffer((k + 1) / 3 | 0, littleEndian, noAssert);
    var i = 0,
        j = 0,
        ch,
        b,
        rs = false,
        // Require symbol next
    ho = false,
        hm = false,
        hl = false,
        // Already has offset (ho), markedOffset (hm), limit (hl)?
    fail = false;

    while (i < k) {
      switch (ch = str.charAt(i++)) {
        case '!':
          if (!noAssert) {
            if (ho || hm || hl) {
              fail = true;
              break;
            }

            ho = hm = hl = true;
          }

          bb.offset = bb.markedOffset = bb.limit = j;
          rs = false;
          break;

        case '|':
          if (!noAssert) {
            if (ho || hl) {
              fail = true;
              break;
            }

            ho = hl = true;
          }

          bb.offset = bb.limit = j;
          rs = false;
          break;

        case '[':
          if (!noAssert) {
            if (ho || hm) {
              fail = true;
              break;
            }

            ho = hm = true;
          }

          bb.offset = bb.markedOffset = j;
          rs = false;
          break;

        case '<':
          if (!noAssert) {
            if (ho) {
              fail = true;
              break;
            }

            ho = true;
          }

          bb.offset = j;
          rs = false;
          break;

        case ']':
          if (!noAssert) {
            if (hl || hm) {
              fail = true;
              break;
            }

            hl = hm = true;
          }

          bb.limit = bb.markedOffset = j;
          rs = false;
          break;

        case '>':
          if (!noAssert) {
            if (hl) {
              fail = true;
              break;
            }

            hl = true;
          }

          bb.limit = j;
          rs = false;
          break;

        case "'":
          if (!noAssert) {
            if (hm) {
              fail = true;
              break;
            }

            hm = true;
          }

          bb.markedOffset = j;
          rs = false;
          break;

        case ' ':
          rs = false;
          break;

        default:
          if (!noAssert) {
            if (rs) {
              fail = true;
              break;
            }
          }

          b = parseInt(ch + str.charAt(i++), 16);

          if (!noAssert) {
            if (isNaN(b) || b < 0 || b > 255) throw TypeError("Illegal str: Not a debug encoded string");
          }

          bb.buffer[j++] = b;
          rs = true;
      }

      if (fail) throw TypeError("Illegal str: Invalid symbol at " + i);
    }

    if (!noAssert) {
      if (!ho || !hl) throw TypeError("Illegal str: Missing offset or limit");
      if (j < bb.buffer.length) throw TypeError("Illegal str: Not a debug encoded string (is it hex?) " + j + " < " + k);
    }

    return bb;
  }; // encodings/hex

  /**
   * Encodes this ByteBuffer's contents to a hex encoded string.
   * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
   * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
   * @returns {string} Hex encoded string
   * @expose
   */


  ByteBufferPrototype.toHex = function (begin, end) {
    begin = typeof begin === 'undefined' ? this.offset : begin;
    end = typeof end === 'undefined' ? this.limit : end;

    if (!this.noAssert) {
      if (typeof begin !== 'number' || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
      begin >>>= 0;
      if (typeof end !== 'number' || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
      end >>>= 0;
      if (begin < 0 || begin > end || end > this.buffer.length) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.length);
    }

    return this.buffer.toString("hex", begin, end);
  };
  /**
   * Decodes a hex encoded string to a ByteBuffer.
   * @param {string} str String to decode
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @returns {!ByteBuffer} ByteBuffer
   * @expose
   */


  ByteBuffer.fromHex = function (str, littleEndian, noAssert) {
    if (!noAssert) {
      if (typeof str !== 'string') throw TypeError("Illegal str: Not a string");
      if (str.length % 2 !== 0) throw TypeError("Illegal str: Length not a multiple of 2");
    }

    var bb = new ByteBuffer(0, littleEndian, true);
    bb.buffer = new Buffer(str, "hex");
    bb.limit = bb.buffer.length;
    return bb;
  }; // utfx-embeddable

  /**
   * utfx-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/utfx for details
   */


  var utfx = function () {
    /**
     * utfx namespace.
     * @inner
     * @type {!Object.<string,*>}
     */

    var utfx = {};
    /**
     * Maximum valid code point.
     * @type {number}
     * @const
     */

    utfx.MAX_CODEPOINT = 0x10FFFF;
    /**
     * Encodes UTF8 code points to UTF8 bytes.
     * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
     */

    utfx.encodeUTF8 = function (src, dst) {
      var cp = null;
      if (typeof src === 'number') cp = src, src = function () {
        return null;
      };

      while (cp !== null || (cp = src()) !== null) {
        if (cp < 0x80) dst(cp & 0x7F);else if (cp < 0x800) dst(cp >> 6 & 0x1F | 0xC0), dst(cp & 0x3F | 0x80);else if (cp < 0x10000) dst(cp >> 12 & 0x0F | 0xE0), dst(cp >> 6 & 0x3F | 0x80), dst(cp & 0x3F | 0x80);else dst(cp >> 18 & 0x07 | 0xF0), dst(cp >> 12 & 0x3F | 0x80), dst(cp >> 6 & 0x3F | 0x80), dst(cp & 0x3F | 0x80);
        cp = null;
      }
    };
    /**
     * Decodes UTF8 bytes to UTF8 code points.
     * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
     *  remaining bytes.
     */


    utfx.decodeUTF8 = function (src, dst) {
      var a,
          b,
          c,
          d,
          fail = function (b) {
        b = b.slice(0, b.indexOf(null));
        var err = Error(b.toString());
        err.name = "TruncatedError";
        err['bytes'] = b;
        throw err;
      };

      while ((a = src()) !== null) {
        if ((a & 0x80) === 0) dst(a);else if ((a & 0xE0) === 0xC0) (b = src()) === null && fail([a, b]), dst((a & 0x1F) << 6 | b & 0x3F);else if ((a & 0xF0) === 0xE0) ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 0x0F) << 12 | (b & 0x3F) << 6 | c & 0x3F);else if ((a & 0xF8) === 0xF0) ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 0x07) << 18 | (b & 0x3F) << 12 | (c & 0x3F) << 6 | d & 0x3F);else throw RangeError("Illegal starting byte: " + a);
      }
    };
    /**
     * Converts UTF16 characters to UTF8 code points.
     * @param {!function():number|null} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @param {!function(number)} dst Code points destination as a function successively called with each converted code
     *  point.
     */


    utfx.UTF16toUTF8 = function (src, dst) {
      var c1,
          c2 = null;

      while (true) {
        if ((c1 = c2 !== null ? c2 : src()) === null) break;

        if (c1 >= 0xD800 && c1 <= 0xDFFF) {
          if ((c2 = src()) !== null) {
            if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
              dst((c1 - 0xD800) * 0x400 + c2 - 0xDC00 + 0x10000);
              c2 = null;
              continue;
            }
          }
        }

        dst(c1);
      }

      if (c2 !== null) dst(c2);
    };
    /**
     * Converts UTF8 code points to UTF16 characters.
     * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {RangeError} If a code point is out of range
     */


    utfx.UTF8toUTF16 = function (src, dst) {
      var cp = null;
      if (typeof src === 'number') cp = src, src = function () {
        return null;
      };

      while (cp !== null || (cp = src()) !== null) {
        if (cp <= 0xFFFF) dst(cp);else cp -= 0x10000, dst((cp >> 10) + 0xD800), dst(cp % 0x400 + 0xDC00);
        cp = null;
      }
    };
    /**
     * Converts and encodes UTF16 characters to UTF8 bytes.
     * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
     *  if there are no more characters left.
     * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
     */


    utfx.encodeUTF16toUTF8 = function (src, dst) {
      utfx.UTF16toUTF8(src, function (cp) {
        utfx.encodeUTF8(cp, dst);
      });
    };
    /**
     * Decodes and converts UTF8 bytes to UTF16 characters.
     * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
     */


    utfx.decodeUTF8toUTF16 = function (src, dst) {
      utfx.decodeUTF8(src, function (cp) {
        utfx.UTF8toUTF16(cp, dst);
      });
    };
    /**
     * Calculates the byte length of an UTF8 code point.
     * @param {number} cp UTF8 code point
     * @returns {number} Byte length
     */


    utfx.calculateCodePoint = function (cp) {
      return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
    };
    /**
     * Calculates the number of UTF8 bytes required to store UTF8 code points.
     * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
     *  `null` if there are no more code points left.
     * @returns {number} The number of UTF8 bytes required
     */


    utfx.calculateUTF8 = function (src) {
      var cp,
          l = 0;

      while ((cp = src()) !== null) l += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;

      return l;
    };
    /**
     * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
     * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
     */


    utfx.calculateUTF16asUTF8 = function (src) {
      var n = 0,
          l = 0;
      utfx.UTF16toUTF8(src, function (cp) {
        ++n;
        l += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
      });
      return [n, l];
    };

    return utfx;
  }(); // encodings/utf8

  /**
   * Encodes this ByteBuffer's contents between {@link ByteBuffer#offset} and {@link ByteBuffer#limit} to an UTF8 encoded
   *  string.
   * @returns {string} Hex encoded string
   * @throws {RangeError} If `offset > limit`
   * @expose
   */


  ByteBufferPrototype.toUTF8 = function (begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;

    if (!this.noAssert) {
      if (typeof begin !== 'number' || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
      begin >>>= 0;
      if (typeof end !== 'number' || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
      end >>>= 0;
      if (begin < 0 || begin > end || end > this.buffer.length) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.length);
    }

    return this.buffer.toString("utf8", begin, end);
  };
  /**
   * Decodes an UTF8 encoded string to a ByteBuffer.
   * @param {string} str String to decode
   * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
   *  {@link ByteBuffer.DEFAULT_ENDIAN}.
   * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
   *  {@link ByteBuffer.DEFAULT_NOASSERT}.
   * @returns {!ByteBuffer} ByteBuffer
   * @expose
   */


  ByteBuffer.fromUTF8 = function (str, littleEndian, noAssert) {
    if (!noAssert) if (typeof str !== 'string') throw TypeError("Illegal str: Not a string");
    var bb = new ByteBuffer(0, littleEndian, noAssert);
    bb.buffer = new Buffer(str, "utf8");
    bb.limit = bb.buffer.length;
    return bb;
  };
  /**
   * node-memcpy. This is an optional binding dependency and may not be present.
   * @function
   * @param {!(Buffer|ArrayBuffer|Uint8Array)} target Destination
   * @param {number|!(Buffer|ArrayBuffer)} targetStart Destination start, defaults to 0.
   * @param {(!(Buffer|ArrayBuffer|Uint8Array)|number)=} source Source
   * @param {number=} sourceStart Source start, defaults to 0.
   * @param {number=} sourceEnd Source end, defaults to capacity.
   * @returns {number} Number of bytes copied
   * @throws {Error} If any index is out of bounds
   * @expose
   */


  ByteBuffer.memcpy = memcpy;
  return ByteBuffer;
}();

function to(locale) {
  const lcid = localeToLcid[locale];
  if (lcid) return lcid;else throw new Error(`unkown locale ${locale}`);
}
const lcidToLocale = {
  '4': 'zh_CHS',
  '1025': 'ar_SA',
  '1026': 'bg_BG',
  '1027': 'ca_ES',
  '1028': 'zh_TW',
  '1029': 'cs_CZ',
  '1030': 'da_DK',
  '1031': 'de_DE',
  '1032': 'el_GR',
  '1033': 'en_US',
  '1034': 'es_ES',
  '1035': 'fi_FI',
  '1036': 'fr_FR',
  '1037': 'he_IL',
  '1038': 'hu_HU',
  '1039': 'is_IS',
  '1040': 'it_IT',
  '1041': 'ja_JP',
  '1042': 'ko_KR',
  '1043': 'nl_NL',
  '1044': 'nb_NO',
  '1045': 'pl_PL',
  '1046': 'pt_BR',
  '1047': 'rm_CH',
  '1048': 'ro_RO',
  '1049': 'ru_RU',
  '1050': 'hr_HR',
  '1051': 'sk_SK',
  '1052': 'sq_AL',
  '1053': 'sv_SE',
  '1054': 'th_TH',
  '1055': 'tr_TR',
  '1056': 'ur_PK',
  '1057': 'id_ID',
  '1058': 'uk_UA',
  '1059': 'be_BY',
  '1060': 'sl_SI',
  '1061': 'et_EE',
  '1062': 'lv_LV',
  '1063': 'lt_LT',
  '1064': 'tg_TJ',
  '1065': 'fa_IR',
  '1066': 'vi_VN',
  '1067': 'hy_AM',
  '1069': 'eu_ES',
  '1070': 'wen_DE',
  '1071': 'mk_MK',
  '1074': 'tn_ZA',
  '1076': 'xh_ZA',
  '1077': 'zu_ZA',
  '1078': 'af_ZA',
  '1079': 'ka_GE',
  '1080': 'fo_FO',
  '1081': 'hi_IN',
  '1082': 'mt_MT',
  '1083': 'se_NO',
  '1086': 'ms_MY',
  '1087': 'kk_KZ',
  '1088': 'ky_KG',
  '1089': 'sw_KE',
  '1090': 'tk_TM',
  '1092': 'tt_RU',
  '1093': 'bn_IN',
  '1094': 'pa_IN',
  '1095': 'gu_IN',
  '1096': 'or_IN',
  '1097': 'ta_IN',
  '1098': 'te_IN',
  '1099': 'kn_IN',
  '1100': 'ml_IN',
  '1101': 'as_IN',
  '1102': 'mr_IN',
  '1103': 'sa_IN',
  '1104': 'mn_MN',
  '1105': 'bo_CN',
  '1106': 'cy_GB',
  '1107': 'kh_KH',
  '1108': 'lo_LA',
  '1109': 'my_MM',
  '1110': 'gl_ES',
  '1111': 'kok_IN',
  '1114': 'syr_SY',
  '1115': 'si_LK',
  '1118': 'am_ET',
  '1121': 'ne_NP',
  '1122': 'fy_NL',
  '1123': 'ps_AF',
  '1124': 'fil_PH',
  '1125': 'div_MV',
  '1128': 'ha_NG',
  '1130': 'yo_NG',
  '1131': 'quz_BO',
  '1132': 'ns_ZA',
  '1133': 'ba_RU',
  '1134': 'lb_LU',
  '1135': 'kl_GL',
  '1144': 'ii_CN',
  '1146': 'arn_CL',
  '1148': 'moh_CA',
  '1150': 'br_FR',
  '1152': 'ug_CN',
  '1153': 'mi_NZ',
  '1154': 'oc_FR',
  '1155': 'co_FR',
  '1156': 'gsw_FR',
  '1157': 'sah_RU',
  '1158': 'qut_GT',
  '1159': 'rw_RW',
  '1160': 'wo_SN',
  '1164': 'gbz_AF',
  '2049': 'ar_IQ',
  '2052': 'zh_CN',
  '2055': 'de_CH',
  '2057': 'en_GB',
  '2058': 'es_MX',
  '2060': 'fr_BE',
  '2064': 'it_CH',
  '2067': 'nl_BE',
  '2068': 'nn_NO',
  '2070': 'pt_PT',
  '2077': 'sv_FI',
  '2080': 'ur_IN',
  '2092': 'az_AZ',
  '2094': 'dsb_DE',
  '2107': 'se_SE',
  '2108': 'ga_IE',
  '2110': 'ms_BN',
  '2115': 'uz_UZ',
  '2128': 'mn_CN',
  '2129': 'bo_BT',
  '2141': 'iu_CA',
  '2143': 'tmz_DZ',
  '2155': 'quz_EC',
  '3073': 'ar_EG',
  '3076': 'zh_HK',
  '3079': 'de_AT',
  '3081': 'en_AU',
  '3082': 'es_ES',
  '3084': 'fr_CA',
  '3098': 'sr_SP',
  '3131': 'se_FI',
  '3179': 'quz_PE',
  '4097': 'ar_LY',
  '4100': 'zh_SG',
  '4103': 'de_LU',
  '4105': 'en_CA',
  '4106': 'es_GT',
  '4108': 'fr_CH',
  '4122': 'hr_BA',
  '4155': 'smj_NO',
  '5121': 'ar_DZ',
  '5124': 'zh_MO',
  '5127': 'de_LI',
  '5129': 'en_NZ',
  '5130': 'es_CR',
  '5132': 'fr_LU',
  '5179': 'smj_SE',
  '6145': 'ar_MA',
  '6153': 'en_IE',
  '6154': 'es_PA',
  '6156': 'fr_MC',
  '6203': 'sma_NO',
  '7169': 'ar_TN',
  '7177': 'en_ZA',
  '7178': 'es_DO',
  '7194': 'sr_BA',
  '7227': 'sma_SE',
  '8193': 'ar_OM',
  '8201': 'en_JA',
  '8202': 'es_VE',
  '8218': 'bs_BA',
  '8251': 'sms_FI',
  '9217': 'ar_YE',
  '9225': 'en_CB',
  '9226': 'es_CO',
  '9275': 'smn_FI',
  '10241': 'ar_SY',
  '10249': 'en_BZ',
  '10250': 'es_PE',
  '11265': 'ar_JO',
  '11273': 'en_TT',
  '11274': 'es_AR',
  '12289': 'ar_LB',
  '12297': 'en_ZW',
  '12298': 'es_EC',
  '13313': 'ar_KW',
  '13321': 'en_PH',
  '13322': 'es_CL',
  '14337': 'ar_AE',
  '14346': 'es_UR',
  '15361': 'ar_BH',
  '15370': 'es_PY',
  '16385': 'ar_QA',
  '16394': 'es_BO',
  '17417': 'en_MY',
  '17418': 'es_SV',
  '18441': 'en_IN',
  '18442': 'es_HN',
  '19466': 'es_NI',
  '20490': 'es_PR',
  '21514': 'es_US',
  '31748': 'zh_CHT'
};
const localeToLcid = Object.entries(lcidToLocale).reduce((acc, [k, v]) => Object.assign(acc, {
  [v]: k
}), {});

function Xp(n, p) {
  return n.toString(16).padStart(p, '0').toUpperCase();
}

function xp(n, p) {
  return n.toString(16).padStart(p, '0');
}

function x2(n) {
  return xp(n, 2);
}
/**
 * get an uppercase hex string of a number zero-padded to 4 digits
 * @param n {number} the number
 * @returns {string} 4-digit uppercase hex representation of the number
 */

function X4(n) {
  return Xp(n, 4);
}
/**
 * get an uppercase hex string of a number zero-padded to 8 digits
 * @param n {number} the number
 * @returns {string}
 */

function X8(n) {
  return Xp(n, 8);
}
function name(tag) {
  return PropertyTagLiterals.SubStorageStreamPrefix + X4(tag.id) + X4(tag.type);
}
/**
 * convert UTF-8 Uint8Array to string
 * @param array {Uint8Array}
 * @returns {string}
 */

function utf8ArrayToString(array) {
  return new TextDecoder().decode(array);
}
/**
 * convert string to UTF-8 Uint8Array
 * @param str {string}
 * @returns {Uint8Array}
 */

function stringToUtf8Array(str) {
  return new TextEncoder().encode(str);
}
/**
 * convert string to UTF-16LE Uint8Array
 * @param str {string}
 * @returns {Uint8Array|Uint8Array}
 */

function stringToUtf16LeArray(str) {
  const u16 = Uint16Array.from(str.split('').map(c => c.charCodeAt(0)));
  return new Uint8Array(u16.buffer, u16.byteOffset, u16.byteLength);
}
/**
 * convert a string to a Uint8Array with terminating 0 byte
 * @throws if the string contains characters not in the ANSI range (0-255)
 * @param str
 */

function stringToAnsiArray(str) {
  const codes = str.split('').map(c => c.charCodeAt(0));
  if (codes.findIndex(c => c > 255) > -1) throw new Error("can't encode ansi string with char codes > 255!");
  codes.push(0);
  return Uint8Array.from(codes);
}
/**
 * convert a file name to its DOS 8.3 version.
 * @param fileName {string} a file name (not a path!)
 */

function fileNameToDosFileName(fileName) {
  const parts = fileName.split(".");
  let name, extension;

  if (parts.length < 2) {
    name = parts[0];
    extension = null;
  } else {
    name = parts.slice(0, -1).join('');
    extension = parts[parts.length - 1];
  }

  if (name !== "") {
    name = (name.length > 8 ? name.substring(0, 6) + "~1" : name).toUpperCase();
  }

  if (extension != null) {
    name += "." + (extension.length > 3 ? extension.substring(0, 3) : extension).toUpperCase();
  }

  return name;
}
/**
 * turn a ByteBuffer into a Uint8Array, using the current offset as a limit.
 * buf.limit will change to buf.offset, and its buf.offset will be reset to 0.
 * @param buf {ByteBuffer} the buffer to convert
 * @returns {Uint8Array} a new Uint8Array containing the
 */

function byteBufferAsUint8Array(buf) {
  buf.limit = buf.offset;
  buf.offset = 0;
  return new Uint8Array(buf.toBuffer(true));
}
/**
 * make an new byte buffer with the correct settings
 * @param otherBuffer {ByteBuffer | ArrayBuffer | Uint8Array} other buffer to wrap into a ByteBuffer
 * @param initCap {number?} initial capacity. ignored if otherBuffer is given.
 */

function makeByteBuffer(initCap, otherBuffer) {
  if (initCap != null && initCap < 0) throw new Error("initCap must be non-negative!");
  return otherBuffer == null ? new bytebufferNode(initCap || 1, bytebufferNode.LITTLE_ENDIAN) : bytebufferNode.wrap(otherBuffer, null, bytebufferNode.LITTLE_ENDIAN);
}
function getPathExtension(p) {
  if (!p.includes(".")) return "";
  const parts = p.split(".");
  return "." + parts[parts.length - 1];
}
function isNullOrEmpty(str) {
  return !str || str === "";
}
function isNullOrWhiteSpace(str) {
  return str == null || str.trim() === "";
}
function localeId() {
  return to(getLang());
}

function getLang() {
  if (typeof navigator != 'undefined') {
    if (navigator.language != null) return navigator.language;else return (navigator.languages || ["en_US"])[0];
  } else return "en_US";
}
/**
 * get the upper and lower 32 bits from a 64bit int in a bignum
 */
// $FlowIgnore[bigint-unsupported]


function bigInt64ToParts(num) {
  const u64 = BigInt.asUintN(64, num); // $FlowIgnore[bigint-unsupported]

  const lower = Number(u64 & 2n ** 32n - 1n); // $FlowIgnore[bigint-unsupported]

  const upper = Number(u64 / 2n ** 32n & 2n ** 32n - 1n);
  return {
    lower,
    upper
  };
}
/**
 * create a 64bit int in a bignum from two 32bit ints in numbers
 * @param lower
 * @param upper
 */
// $FlowIgnore[bigint-unsupported]

function bigInt64FromParts(lower, upper) {
  // $FlowIgnore[bigint-unsupported]
  return BigInt.asUintN(64, BigInt(lower) + BigInt(upper) * 2n ** 32n);
}

const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate

let poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    crypto.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }

  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

function v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return stringify(rnds);
}

/**
 * A property inside the MSG file
 */

let Property = /*#__PURE__*/function () {
  function Property(obj) {
    _classCallCheck(this, Property);

    _defineProperty(this, "id", void 0);

    _defineProperty(this, "type", void 0);

    _defineProperty(this, "_flags", void 0);

    _defineProperty(this, "_multiValue", void 0);

    _defineProperty(this, "_data", void 0);

    this.id = obj.id;
    this.type = obj.type;
    this._data = obj.data;
    this._multiValue = obj.multiValue == null ? false : obj.multiValue;
    this._flags = obj.flags == null ? 0 : obj.flags;
  }

  _createClass(Property, [{
    key: "name",
    value: function name$1() {
      return name(this);
    }
  }, {
    key: "shortName",
    value: function shortName() {
      return X4(this.id);
    }
  }, {
    key: "flagsCollection",
    value: function flagsCollection() {
      const result = [];
      if ((this._flags & PropertyFlag.PROPATTR_MANDATORY) !== 0) result.push(PropertyFlag.PROPATTR_MANDATORY);
      if ((this._flags & PropertyFlag.PROPATTR_READABLE) !== 0) result.push(PropertyFlag.PROPATTR_READABLE);
      if ((this._flags & PropertyFlag.PROPATTR_WRITABLE) !== 0) result.push(PropertyFlag.PROPATTR_WRITABLE);
      return result;
    }
  }, {
    key: "asInt",
    value: function asInt() {
      const view = new DataView(this._data.buffer, 0);

      switch (this.type) {
        case PropertyType.PT_SHORT:
          return view.getInt16(0, false);

        case PropertyType.PT_LONG:
          return view.getInt32(0, false);

        default:
          throw new Error("type is not PT_SHORT or PT_LONG");
      }
    }
  }, {
    key: "asSingle",
    value: function asSingle() {
      const view = new DataView(this._data.buffer, 0);

      switch (this.type) {
        case PropertyType.PT_FLOAT:
          return view.getFloat32(0, false);

        default:
          throw new Error("type is not PT_FLOAT");
      }
    }
  }, {
    key: "asDouble",
    value: function asDouble() {
      const view = new DataView(this._data.buffer, 0);

      switch (this.type) {
        case PropertyType.PT_FLOAT:
          return view.getFloat64(0, false);

        default:
          throw new Error("type is not PT_DOUBLE");
      }
    }
  }, {
    key: "asDecimal",
    value: function asDecimal() {
      const view = new DataView(this._data.buffer, 0);

      switch (this.type) {
        case PropertyType.PT_FLOAT:
          // TODO: is there a .Net decimal equivalent for js?
          return view.getFloat32(0, false);

        default:
          throw new Error("type is not PT_FLOAT");
      }
    }
  }, {
    key: "asDateTime",
    value: function asDateTime() {
      const view = new DataView(this._data.buffer, 0);

      switch (this.type) {
        case PropertyType.PT_APPTIME:
          // msg stores .Net DateTime as OADate, number of days since 30 dec 1899 as a double value
          const oaDate = view.getFloat64(0, false);
          return oADateToDate(oaDate);

        case PropertyType.PT_SYSTIME:
          // https://docs.microsoft.com/de-de/office/client-developer/outlook/mapi/filetime
          const fileTimeLower = view.getUint32(0, false);
          const fileTimeUpper = view.getUint32(4, false);
          return fileTimeToDate(bigInt64FromParts(fileTimeLower, fileTimeUpper));

        default:
          throw new Error("type is not PT_APPTIME or PT_SYSTIME");
      }
    }
  }, {
    key: "asBool",
    value: function asBool() {
      const view = new DataView(this._data.buffer, 0);

      switch (this.type) {
        case PropertyType.PT_BOOLEAN:
          return Boolean(this._data[0]);

        default:
          throw new Error("type is not PT_BOOLEAN");
      }
    } // TODO: this will fail for very large numbers

  }, {
    key: "asLong",
    value: function asLong() {
      const view = new DataView(this._data.buffer, 0);

      switch (this.type) {
        case PropertyType.PT_LONG:
        case PropertyType.PT_LONGLONG:
          const val = view.getFloat64(0, false);
          if (val > Number.MAX_SAFE_INTEGER) throw new Error("implementation can't handle big longs yet");
          return parseInt(val);

        default:
          throw new Error("type is not PT_LONG");
      }
    }
  }, {
    key: "asString",
    value: function asString() {
      switch (this.type) {
        case PropertyType.PT_UNICODE:
          return utf8ArrayToString(this._data);

        case PropertyType.PT_STRING8:
          return String.fromCharCode(...this._data);

        default:
          throw new Error("Type is not PT_UNICODE or PT_STRING8");
      }
    }
  }, {
    key: "asGuid",
    value: function asGuid() {
      switch (this.type) {
        case PropertyType.PT_CLSID:
          return v4({
            random: this._data.slice(0, 16)
          });

        default:
          throw new Error("Type is not PT_CLSID");
      }
    }
  }, {
    key: "asBinary",
    value: function asBinary() {
      switch (this.type) {
        case PropertyType.PT_BINARY:
          return this._data.slice();

        default:
          throw new Error("Type is not PT_BINARY");
      }
    }
  }]);

  return Property;
}();

let Properties = /*#__PURE__*/function (_Array) {
  _inherits(Properties, _Array);

  var _super = _createSuper(Properties);

  function Properties() {
    _classCallCheck(this, Properties);

    return _super.apply(this, arguments);
  }

  _createClass(Properties, [{
    key: "addOrReplaceProperty",

    /**
     * add a prop it it doesn't exist, otherwise replace it
     */
    value: function addOrReplaceProperty(tag, obj, flags = PropertyFlag.PROPATTR_READABLE | PropertyFlag.PROPATTR_WRITABLE) {
      const index = this.findIndex(p => p.id === tag.id);
      if (index >= 0) this.splice(index, 1);
      this.addProperty(tag, obj, flags);
    }
  }, {
    key: "addProperty",
    value: function addProperty(tag, value, flags = PropertyFlag.PROPATTR_READABLE | PropertyFlag.PROPATTR_WRITABLE) {
      if (value == null) return;
      let data = new Uint8Array(0);
      let view;

      switch (tag.type) {
        case PropertyType.PT_APPTIME:
          data = new Uint8Array(8);
          view = new DataView(data.buffer);
          view.setFloat64(0, value, true);
          break;

        case PropertyType.PT_SYSTIME:
          data = new Uint8Array(8);
          view = new DataView(data.buffer);
          const {
            upper,
            lower
          } = bigInt64ToParts(value);
          view.setInt32(0, value.lower, true);
          view.setInt32(4, value.upper, true);
          break;

        case PropertyType.PT_SHORT:
          data = new Uint8Array(2);
          view = new DataView(data.buffer);
          view.setInt16(0, value, true);
          break;

        case PropertyType.PT_ERROR:
        case PropertyType.PT_LONG:
          data = new Uint8Array(4);
          view = new DataView(data.buffer);
          view.setInt32(0, value, true);
          break;

        case PropertyType.PT_FLOAT:
          data = new Uint8Array(4);
          view = new DataView(data.buffer);
          view.setFloat32(0, value, true);
          break;

        case PropertyType.PT_DOUBLE:
          data = new Uint8Array(8);
          view = new DataView(data.buffer);
          view.setFloat64(0, value, true);
          break;
        //case PropertyType.PT_CURRENCY:
        //    data = (byte[]) obj
        //    break

        case PropertyType.PT_BOOLEAN:
          data = Uint8Array.from([value ? 1 : 0]);
          break;

        case PropertyType.PT_I8:
          // TODO:
          throw new Error("PT_I8 property type is not supported (64 bit ints)!");
        // data = BitConverter.GetBytes((long)obj)

        case PropertyType.PT_UNICODE:
          data = stringToUtf16LeArray(value);
          break;

        case PropertyType.PT_STRING8:
          data = stringToAnsiArray(value);
          break;

        case PropertyType.PT_CLSID:
          // GUIDs should be Uint8Arrays already
          data = value;
          break;

        case PropertyType.PT_BINARY:
          // TODO: make user convert object to Uint8Array and just assign.
          if (value instanceof Uint8Array) {
            data = value;
            break;
          }

          const objType = typeof value;
          console.log("obj", value, "type", objType);

          switch (objType) {
            case "boolean":
              data = Uint8Array.from(value);
              break;

            case "TypeCode.SByte":
              //data = BitConverter.GetBytes((sbyte)obj)
              break;

            case "TypeCode.Byte":
              //data = BitConverter.GetBytes((byte)obj)
              break;

            case "TypeCode.Int16":
              //data = BitConverter.GetBytes((short)obj)
              break;

            case "TypeCode.UInt16":
              // data = BitConverter.GetBytes((uint)obj)
              break;

            case "TypeCode.Int32":
              //data = BitConverter.GetBytes((int)obj)
              break;

            case "TypeCode.UInt32":
              // data = BitConverter.GetBytes((uint)obj)
              break;

            case "TypeCode.Int64":
              // data = BitConverter.GetBytes((long)obj)
              break;

            case "TypeCode.UInt64":
              // data = BitConverter.GetBytes((ulong)obj)
              break;

            case "TypeCode.Single":
              // data = BitConverter.GetBytes((float)obj)
              break;

            case "TypeCode.Double":
              // data = BitConverter.GetBytes((double)obj)
              break;

            case "TypeCode.DateTime":
              // DateTime.Ticks is a long.
              //  time elapsed time since 12:00:00 midnight, January 1, 0001 in 100-ns-intervals
              // data = BitConverter.GetBytes(((DateTime)obj).Ticks)
              break;

            case "string":
              data = stringToUtf8Array(value);
              break;

            default:
              throw new Error(`PT_BINARY property of type '${objType}' not supported!`);
          }

          break;

        case PropertyType.PT_NULL:
          break;

        case PropertyType.PT_ACTIONS:
          throw new Error("PT_ACTIONS property type is not supported");

        case PropertyType.PT_UNSPECIFIED:
          throw new Error("PT_UNSPECIFIED property type is not supported");

        case PropertyType.PT_OBJECT:
          // TODO: Add support for MSG
          break;

        case PropertyType.PT_SVREID:
          throw new Error("PT_SVREID property type is not supported");

        case PropertyType.PT_SRESTRICT:
          throw new Error("PT_SRESTRICT property type is not supported");

        default:
          throw new Error("type is out of range!");
      }

      this.push(new Property({
        id: tag.id,
        type: tag.type,
        flags,
        data
      }));
    }
    /**
     * writes the properties structure to a cfb stream in storage
     * @param storage
     * @param messageSize
     * @param prefix a function that will be called with the buffer before the properties get written to it.
     * @returns {number}
     */

  }, {
    key: "writeProperties",
    value: function writeProperties(storage, prefix, messageSize) {
      const buf = makeByteBuffer();
      prefix(buf);
      let size = 0; // The data inside the property stream (1) MUST be an array of 16-byte entries. The number of properties,
      // each represented by one entry, can be determined by first measuring the size of the property stream (1),
      // then subtracting the size of the header from it, and then dividing the result by the size of one entry.
      // The structure of each entry, representing one property, depends on whether the property is a fixed length
      // property or not.

      this.forEach(property => {
        // property tag: A 32-bit value that contains a property type and a property ID. The low-order 16 bits
        // represent the property type. The high-order 16 bits represent the property ID.
        buf.writeUint16(property.type); // 2 bytes

        buf.writeUint16(property.id); // 2 bytes

        buf.writeUint32(property._flags); // 4 bytes

        switch (property.type) {
          //case PropertyType.PT_ACTIONS:
          //    break
          case PropertyType.PT_I8:
          case PropertyType.PT_APPTIME:
          case PropertyType.PT_SYSTIME:
          case PropertyType.PT_DOUBLE:
            buf.append(property._data);
            break;

          case PropertyType.PT_ERROR:
          case PropertyType.PT_LONG:
          case PropertyType.PT_FLOAT:
            buf.append(property._data);
            buf.writeUint32(0);
            break;

          case PropertyType.PT_SHORT:
            buf.append(property._data);
            buf.writeUint32(0);
            buf.writeUint16(0);
            break;

          case PropertyType.PT_BOOLEAN:
            buf.append(property._data);
            buf.append(new Uint8Array(7));
            break;
          //case PropertyType.PT_CURRENCY:
          //    binaryWriter.Write(property.Data)
          //    break

          case PropertyType.PT_UNICODE:
            // Write the length of the property to the propertiesstream
            buf.writeInt32(property._data.length + 2);
            buf.writeUint32(0);
            storage.addStream(property.name(), property._data);
            size += property._data.length;
            break;

          case PropertyType.PT_STRING8:
            // Write the length of the property to the propertiesstream
            buf.writeInt32(property._data.length + 1);
            buf.writeUint32(0);
            storage.addStream(property.name(), property._data);
            size += property._data.length;
            break;

          case PropertyType.PT_CLSID:
            buf.append(property._data);
            break;
          //case PropertyType.PT_SVREID:
          //    break
          //case PropertyType.PT_SRESTRICT:
          //    storage.AddStream(property.Name).SetData(property.Data)
          //    break

          case PropertyType.PT_BINARY:
            // Write the length of the property to the propertiesstream
            buf.writeInt32(property._data.length);
            buf.writeUint32(0);
            storage.addStream(property.name(), property._data);
            size += property._data.length;
            break;

          case PropertyType.PT_MV_SHORT:
            break;

          case PropertyType.PT_MV_LONG:
            break;

          case PropertyType.PT_MV_FLOAT:
            break;

          case PropertyType.PT_MV_DOUBLE:
            break;

          case PropertyType.PT_MV_CURRENCY:
            break;

          case PropertyType.PT_MV_APPTIME:
            break;

          case PropertyType.PT_MV_LONGLONG:
            break;

          case PropertyType.PT_MV_UNICODE:
            // PropertyType.PT_MV_TSTRING
            break;

          case PropertyType.PT_MV_STRING8:
            break;

          case PropertyType.PT_MV_SYSTIME:
            break;
          //case PropertyType.PT_MV_CLSID:
          //    break

          case PropertyType.PT_MV_BINARY:
            break;

          case PropertyType.PT_UNSPECIFIED:
            break;

          case PropertyType.PT_NULL:
            break;

          case PropertyType.PT_OBJECT:
            // TODO: Adding new MSG file
            break;
        }
      });

      if (messageSize != null) {
        buf.writeUint16(PropertyTags.PR_MESSAGE_SIZE.type); // 2 bytes

        buf.writeUint16(PropertyTags.PR_MESSAGE_SIZE.id); // 2 bytes

        buf.writeUint32(PropertyFlag.PROPATTR_READABLE | PropertyFlag.PROPATTR_WRITABLE); // 4 bytes

        buf.writeUint64(messageSize + size + 8);
        buf.writeUint32(0);
      } // Make the properties stream


      size += buf.offset;
      storage.addStream(PropertyTagLiterals.PropertiesStreamName, byteBufferAsUint8Array(buf)); // if(!storage.TryGetStream(PropertyTags.PropertiesStreamName, out var propertiesStream))
      // propertiesStream = storage.AddStream(PropertyTags.PropertiesStreamName);
      // TODO: is this the written length?

      return size;
    }
  }]);

  return Properties;
}( /*#__PURE__*/_wrapNativeSuper(Array));

/**
 * The properties stream contained inside the top level of the .msg file, which represents the Message object itself.
 */
let TopLevelProperties = /*#__PURE__*/function (_Properties) {
  _inherits(TopLevelProperties, _Properties);

  var _super = _createSuper(TopLevelProperties);

  function TopLevelProperties(...args) {
    var _this;

    _classCallCheck(this, TopLevelProperties);

    _this = _super.call(this, ...args);

    _defineProperty(_assertThisInitialized(_this), "nextRecipientId", void 0);

    _defineProperty(_assertThisInitialized(_this), "nextAttachmentId", void 0);

    _defineProperty(_assertThisInitialized(_this), "recipientCount", void 0);

    _defineProperty(_assertThisInitialized(_this), "attachmentCount", void 0);

    return _this;
  }

  _createClass(TopLevelProperties, [{
    key: "writeProperties",
    // TODO: add constructor to read in existing CFB stream

    /**
     *
     * @param storage
     * @param prefix
     * @param messageSize
     */
    value: function writeProperties(storage, prefix, messageSize) {
      // prefix required by the standard: 32 bytes
      const topLevelPropPrefix = buf => {
        prefix(buf); // Reserved(8 bytes): This field MUST be set to zero when writing a .msg file and MUST be ignored
        // when reading a.msg file.

        buf.writeUint64(0); // Next Recipient ID(4 bytes): The ID to use for naming the next Recipient object storage if one is
        // created inside the .msg file. The naming convention to be used is specified in section 2.2.1.If
        // no Recipient object storages are contained in the.msg file, this field MUST be set to 0.

        buf.writeUint32(this.nextRecipientId); // Next Attachment ID (4 bytes): The ID to use for naming the next Attachment object storage if one
        // is created inside the .msg file. The naming convention to be used is specified in section 2.2.2.
        // If no Attachment object storages are contained in the.msg file, this field MUST be set to 0.

        buf.writeUint32(this.nextAttachmentId); // Recipient Count(4 bytes): The number of Recipient objects.

        buf.writeUint32(this.recipientCount); // Attachment Count (4 bytes): The number of Attachment objects.

        buf.writeUint32(this.attachmentCount); // Reserved(8 bytes): This field MUST be set to 0 when writing a msg file and MUST be ignored when
        // reading a msg file.

        buf.writeUint64(0);
      };

      return _get(_getPrototypeOf(TopLevelProperties.prototype), "writeProperties", this).call(this, storage, topLevelPropPrefix, messageSize);
    }
  }]);

  return TopLevelProperties;
}(Properties);

/**
 * The entry stream MUST be named "__substg1.0_00030102" and consist of 8-byte entries, one for each
 * named property being stored. The properties are assigned unique numeric IDs (distinct from any property
 * ID assignment) starting from a base of 0x8000. The IDs MUST be numbered consecutively, like an array.
 * In this stream, there MUST be exactly one entry for each named property of the Message object or any of
 * its subobjects. The index of the entry for a particular ID is calculated by subtracting 0x8000 from it.
 * For example, if the ID is 0x8005, the index for the corresponding 8-byte entry would be 0x8005 – 0x8000 = 5.
 * The index can then be multiplied by 8 to get the actual byte offset into the stream from where to start
 * reading the corresponding entry.
 *
 * see: https://msdn.microsoft.com/en-us/library/ee159689(v=exchg.80).aspx
 */
let EntryStream = /*#__PURE__*/function (_Array) {
  _inherits(EntryStream, _Array);

  var _super = _createSuper(EntryStream);

  /**
   * creates this object and reads all the EntryStreamItems from
   * the given storage
   * @param storage {any}
   */
  function EntryStream(storage) {
    var _this;

    _classCallCheck(this, EntryStream);

    _this = _super.call(this);
    if (storage == null) return _possibleConstructorReturn(_this);
    const stream = storage.getStream(PropertyTagLiterals.EntryStream);

    if (stream.byteLength <= 0) {
      storage.addStream(PropertyTagLiterals.EntryStream, Uint8Array.of());
    }

    const buf = makeByteBuffer(null, stream);

    while (buf.offset < buf.limit) {
      const entryStreamItem = EntryStreamItem.fromBuffer(buf);

      _this.push(entryStreamItem);
    }

    return _this;
  }
  /**
   * writes all the EntryStreamItems as a stream to the storage
   * @param storage {any}
   * @param streamName {string?}
   */


  _createClass(EntryStream, [{
    key: "write",
    value: function write(storage, streamName = PropertyTagLiterals.EntryStream) {
      const buf = makeByteBuffer();
      this.forEach(entry => entry.write(buf));
      storage.addStream(streamName, byteBufferAsUint8Array(buf));
    }
  }]);

  return EntryStream;
}( /*#__PURE__*/_wrapNativeSuper(Array));
/**
 * Represents one item in the EntryStream
 */

let EntryStreamItem = /*#__PURE__*/function () {
  _createClass(EntryStreamItem, null, [{
    key: "fromBuffer",

    /**
     * the Property Kind subfield of the Index and Kind Information field), this value is the LID part of the
     * PropertyName structure, as specified in [MS-OXCDATA] section 2.6.1. If this property is a string named
     * property, this value is the offset in bytes into the strings stream where the value of the Name field of
     * the PropertyName structure is located.
     * was ushort
     * */

    /**
     * The following structure specifies the stream indexes and whether the property is a numerical
     * named property or a string named property
     * @type {IndexAndKindInformation}
     */

    /**
     * creates this objcet and reads all the properties from the given buffer
     * @param buf {ByteBuffer}
     */
    value: function fromBuffer(buf) {
      const nameIdentifierOrStringOffset = buf.readUint16();
      const indexAndKindInformation = IndexAndKindInformation.fromBuffer(buf);
      return new EntryStreamItem(nameIdentifierOrStringOffset, indexAndKindInformation);
    }
    /**
     * creates this object from the properties
     * @param nameIdentifierOrStringOffset {number}
     * @param indexAndKindInformation {IndexAndKindInformation}
     */

  }]);

  function EntryStreamItem(nameIdentifierOrStringOffset, indexAndKindInformation) {
    _classCallCheck(this, EntryStreamItem);

    _defineProperty(this, "nameIdentifierOrStringOffset", void 0);

    _defineProperty(this, "nameIdentifierOrStringOffsetHex", void 0);

    _defineProperty(this, "indexAndKindInformation", void 0);

    this.nameIdentifierOrStringOffset = nameIdentifierOrStringOffset;
    this.nameIdentifierOrStringOffsetHex = nameIdentifierOrStringOffset.toString(16).toUpperCase().padStart(4, '0');
    this.indexAndKindInformation = indexAndKindInformation;
  }
  /**
   * write all the internal properties to the given buffer
   * @param buf {ByteBuffer}
   */


  _createClass(EntryStreamItem, [{
    key: "write",
    value: function write(buf) {
      buf.writeUint32(this.nameIdentifierOrStringOffset);
      const packed = this.indexAndKindInformation.guidIndex << 1 | this.indexAndKindInformation.propertyKind;
      buf.writeUint16(packed);
      buf.writeUint16(this.indexAndKindInformation.propertyIndex); //Doesn't seem to be the case in the spec.
      // Fortunately section 3.2 clears this up.
    }
  }]);

  return EntryStreamItem;
}();
let IndexAndKindInformation = /*#__PURE__*/function () {
  _createClass(IndexAndKindInformation, null, [{
    key: "fromBuffer",
    // System.Uint16
    // 1 byte
    value: function fromBuffer(buf) {
      const propertyIndex = buf.readUint16();
      const packedValue = buf.readUint16();
      const guidIndex = packedValue >>> 1 & 0xFFFF;
      const propertyKind = packedValue & 0x07;
      if (![0xFF, 0x01, 0x00].includes(propertyKind)) throw new Error("invalid propertyKind:" + propertyKind);
      return new IndexAndKindInformation(propertyIndex, guidIndex, propertyKind);
    }
  }]);

  function IndexAndKindInformation(propertyIndex, guidIndex, propertyKind) {
    _classCallCheck(this, IndexAndKindInformation);

    _defineProperty(this, "propertyIndex", void 0);

    _defineProperty(this, "guidIndex", void 0);

    _defineProperty(this, "propertyKind", void 0);

    this.guidIndex = guidIndex;
    this.propertyIndex = propertyIndex;
    this.propertyKind = propertyKind;
  }

  _createClass(IndexAndKindInformation, [{
    key: "write",
    value: function write(buf) {
      buf.writeUint16(this.propertyIndex);
      buf.writeUint32(this.guidIndex + this.propertyKind);
    }
  }]);

  return IndexAndKindInformation;
}();

/**
 * The GUID stream MUST be named "__substg1.0_00020102". It MUST store the property set GUID
 * part of the property name of all named properties in the Message object or any of its subobjects,
 * except for those named properties that have PS_MAPI or PS_PUBLIC_STRINGS, as described in [MSOXPROPS]
 * section 1.3.2, as their property set GUID.
 * The GUIDs are stored in the stream consecutively like an array. If there are multiple named properties
 * that have the same property set GUID, then the GUID is stored only once and all the named
 * properties will refer to it by its index
 */

let GuidStream = /*#__PURE__*/function (_Array) {
  _inherits(GuidStream, _Array);

  var _super = _createSuper(GuidStream);

  /**
   * create this object
   * @param storage the storage that contains the PropertyTags.GuidStream
   */
  function GuidStream(storage) {
    var _this;

    _classCallCheck(this, GuidStream);

    _this = _super.call(this);
    if (storage == null) return _possibleConstructorReturn(_this);
    const stream = storage.getStream(PropertyTagLiterals.GuidStream);
    const buf = makeByteBuffer(null, stream);

    while (buf.offset < buf.limit) {
      const guid = buf.slice(buf.offset, buf.offset + 16).toArrayBuffer(true);

      _this.push(new Uint8Array(guid));
    }

    return _this;
  }
  /**
   * writes all the guids as a stream to the storage
   * @param storage
   */


  _createClass(GuidStream, [{
    key: "write",
    value: function write(storage) {
      const buf = makeByteBuffer();
      this.forEach(g => {
        buf.append(g);
        storage.addStream(PropertyTagLiterals.GuidStream, buf);
      });
    }
  }]);

  return GuidStream;
}( /*#__PURE__*/_wrapNativeSuper(Array));

/**
 * The string stream MUST be named "__substg1.0_00040102". It MUST consist of one entry for each
 * string named property, and all entries MUST be arranged consecutively, like in an array.
 * As specified in section 2.2.3.1.2, the offset, in bytes, to use for a particular property is stored in the
 * corresponding entry in the entry stream.That is a byte offset into the string stream from where the
 * entry for the property can be read.The strings MUST NOT be null-terminated. Implementers can add a
 * terminating null character to the string
 * See https://msdn.microsoft.com/en-us/library/ee124409(v=exchg.80).aspx
 */
let StringStream = /*#__PURE__*/function (_Array) {
  _inherits(StringStream, _Array);

  var _super = _createSuper(StringStream);

  /**
   * create StringStream and read all the StringStreamItems from the given storage, if any.
   */
  function StringStream(storage) {
    var _this;

    _classCallCheck(this, StringStream);

    _this = _super.call(this);
    if (storage == null) return _possibleConstructorReturn(_this);
    const stream = storage.getStream(PropertyTagLiterals.StringStream);
    const buf = makeByteBuffer(null, stream);

    while (buf.offset < buf.limit) {
      _this.push(StringStreamItem.fromBuffer(buf));
    }

    return _this;
  }
  /**
   * write all the StringStreamItems as a stream to the storage
   * @param storage
   */


  _createClass(StringStream, [{
    key: "write",
    value: function write(storage) {
      const buf = makeByteBuffer();
      this.forEach(s => s.write(buf));
      storage.addStream(PropertyTagLiterals.StringStream, buf);
    }
  }]);

  return StringStream;
}( /*#__PURE__*/_wrapNativeSuper(Array));
/**
 * Represents one Item in the StringStream
 */

let StringStreamItem = /*#__PURE__*/function () {
  _createClass(StringStreamItem, null, [{
    key: "fromBuffer",

    /**
     * the length of the following name field in bytes
     * was uint
     * @type number
     */

    /**
     * A Unicode string that is the name of the property. A new entry MUST always start
     * on a 4 byte boundary; therefore, if the size of the Name field is not an exact multiple of 4, and
     * another Name field entry occurs after it, null characters MUST be appended to the stream after it
     * until the 4-byte boundary is reached.The Name Length field for the next entry will then start at
     * the beginning of the next 4-byte boundary
     * @type {string}
     */

    /**
     * create a StringStreamItem from a byte buffer
     * @param buf {ByteBuffer}
     */
    value: function fromBuffer(buf) {
      const length = buf.readUint32(); // Encoding.Unicode.GetString(binaryReader.ReadBytes((int) Length)).Trim('\0');

      const name = buf.readUTF8String(length);
      const boundary = StringStreamItem.get4BytesBoundary(length);
      buf.offset = buf.offset + boundary;
      return new StringStreamItem(name);
    }
  }]);

  function StringStreamItem(name) {
    _classCallCheck(this, StringStreamItem);

    _defineProperty(this, "length", void 0);

    _defineProperty(this, "name", void 0);

    this.length = name.length;
    this.name = name;
  }
  /**
   * write this item to the ByteBuffer
   * @param buf {ByteBuffer}
   */


  _createClass(StringStreamItem, [{
    key: "write",
    value: function write(buf) {
      buf.writeUint32(this.length);
      buf.writeUTF8String(this.name);
      const boundary = StringStreamItem.get4BytesBoundary(this.length);

      for (let i = 0; i < boundary; i++) {
        buf.writeUint8(0);
      }
    }
    /**
     * Extract 4 from the given <paramref name="length"/> until the result is smaller
     * than 4 and then returns this result
     * @param length {number} was uint
     */

  }], [{
    key: "get4BytesBoundary",
    value: function get4BytesBoundary(length) {
      if (length === 0) return 4;

      while (length >= 4) length -= 4;

      return length;
    }
  }]);

  return StringStreamItem;
}();

let NamedProperties = /*#__PURE__*/function (_Array) {
  _inherits(NamedProperties, _Array);

  var _super = _createSuper(NamedProperties);

  // The offset index for a named property
  function NamedProperties(topLevelProperties) {
    var _this;

    _classCallCheck(this, NamedProperties);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "_topLevelProperties", void 0);

    _defineProperty(_assertThisInitialized(_this), "_namedPropertyIndex", void 0);

    _this._topLevelProperties = topLevelProperties;
    return _this;
  }
  /**
   * adds a NamedPropertyTag. Only support for properties by ID for now.
   * @param mapiTag {NamedProperty}
   * @param obj {any}
   */


  _createClass(NamedProperties, [{
    key: "addProperty",
    value: function addProperty(mapiTag, obj) {
      // Named property field 0000. 0x8000 + property offset
      this._topLevelProperties.addProperty({
        id: 0x8000 + this._namedPropertyIndex,
        type: obj
      });

      this._namedPropertyIndex += 1;
      this.push({
        nameIdentifier: mapiTag.id,
        guid: mapiTag.guid,
        kind: PropertyKind.Lid,
        nameSize: 0,
        name: ""
      });
    }
    /**
     * Writes the properties to the storage. Unfortunately this is going to have to be used after we already written the top level properties.
     * @param storage {any}
     * @param messageSize {number}
     */

  }, {
    key: "writeProperties",
    value: function writeProperties(storage, messageSize = 0) {
      // Grab the nameIdStorage, 3.1 on the SPEC
      storage = storage.getStorage(PropertyTagLiterals.NameIdStorage);
      const entryStream = new EntryStream(storage);
      const stringStream = new StringStream(storage);
      const guidStream = new GuidStream(storage);
      const entryStream2 = new EntryStream(storage); // TODO:

      const guids = this.map(np => np.guid).filter(
      /* TODO: unique*/
      () => {
        throw new Error();
      });
      guids.forEach(g => guidStream.push(g));
      this.forEach((np, propertyIndex) => {
        // (ushort) (guids.IndexOf(namedProperty.Guid) + 3);
        const guidIndex = guids.indexOf(np.guid) + 3; // Depending on the property type. This is doing name.

        entryStream.push(new EntryStreamItem(np.nameIdentifier, new IndexAndKindInformation(propertyIndex, guidIndex, PropertyKind.Lid))); //+3 as per spec.

        entryStream2.push(new EntryStreamItem(np.nameIdentifier, new IndexAndKindInformation(propertyIndex, guidIndex, PropertyKind.Lid))); //3.2.2 of the SPEC [MS-OXMSG]

        entryStream2.write(storage, NamedProperties._generateStreamString(np.nameIdentifier, guidIndex, np.kind)); // 3.2.2 of the SPEC Needs to be written, because the stream changes as per named object.

        entryStream2.splice(0, entryStream2.length);
      });
      guidStream.write(storage);
      entryStream.write(storage);
      stringStream.write(storage);
    }
    /**
     * generates the stream strings
     * @param nameIdentifier {number} was uint
     * @param guidTarget {number} was uint
     * @param propertyKind {PropertyKindEnum} 1 byte
     */

  }], [{
    key: "_generateStreamString",
    value: function _generateStreamString(nameIdentifier, guidTarget, propertyKind) {
      switch (propertyKind) {
        case PropertyKind.Lid:
          const number = 4096 + (nameIdentifier ^ guidTarget << 1) % 0x1F << 16 | 0x00000102;
          return "__substg1.0_" + number.toString(16).toUpperCase().padStart(8, '0');

        default:
          throw new Error("not implemented!");
      }
    }
  }]);

  return NamedProperties;
}( /*#__PURE__*/_wrapNativeSuper(Array));

/**
 * base class for all MSG files
 */

let Message = /*#__PURE__*/function () {
  function Message() {
    _classCallCheck(this, Message);

    _defineProperty(this, "_saved", false);

    _defineProperty(this, "iconIndex", void 0);

    _defineProperty(this, "_topLevelProperties", void 0);

    _defineProperty(this, "_namedProperties", void 0);

    _defineProperty(this, "_storage", void 0);

    _defineProperty(this, "_messageClass", MessageClass.Unknown);

    _defineProperty(this, "_messageSize", void 0);

    this._storage = new CFBStorage(); // In the preceding figure, the "__nameid_version1.0" named property mapping storage contains the
    // three streams  used to provide a mapping from property ID to property name
    // ("__substg1.0_00020102", "__substg1.0_00030102", and "__substg1.0_00040102") and various other
    // streams that provide a mapping from property names to property IDs.
    // if (!CompoundFile.RootStorage.TryGetStorage(PropertyTags.NameIdStorage, out var nameIdStorage))
    // nameIdStorage = CompoundFile.RootStorage.AddStorage(PropertyTags.NameIdStorage);

    const nameIdStorage = this._storage.addStorage(PropertyTagLiterals.NameIdStorage);

    nameIdStorage.addStream(PropertyTagLiterals.EntryStream, Uint8Array.of());
    nameIdStorage.addStream(PropertyTagLiterals.StringStream, Uint8Array.of());
    nameIdStorage.addStream(PropertyTagLiterals.GuidStream, Uint8Array.of());
    this._topLevelProperties = new TopLevelProperties();
    this._namedProperties = new NamedProperties(this._topLevelProperties);
  }

  _createClass(Message, [{
    key: "_save",
    value: function _save() {
      this._topLevelProperties.addProperty(PropertyTags.PR_MESSAGE_CLASS_W, this._messageClass);

      this._topLevelProperties.writeProperties(this._storage, () => {}, this._messageSize);

      this._namedProperties.writeProperties(this._storage, 0);

      this._saved = true;
      this._messageSize = 0;
    }
    /**
     * writes the Message to an underlying CFB
     * structure and returns a serialized
     * representation
     *
     */

  }, {
    key: "saveToBuffer",
    value: function saveToBuffer() {
      this._save();

      return this._storage.toBytes();
    }
  }, {
    key: "addProperty",
    value: function addProperty(propertyTag, value, flags = PropertyFlag.PROPATTR_WRITABLE) {
      if (this._saved) throw new Error("Message is already saved!");

      this._topLevelProperties.addOrReplaceProperty(propertyTag, value, flags);
    }
  }]);

  return Message;
}();

let Address = function Address(email, displayName, addressType = 'SMTP') {
  _classCallCheck(this, Address);

  _defineProperty(this, "addressType", void 0);

  _defineProperty(this, "email", void 0);

  _defineProperty(this, "displayName", void 0);

  this.email = email;
  this.displayName = isNullOrWhiteSpace(this.displayName) ? email : displayName;
  this.addressType = addressType;
};

function makeUUIDBuffer() {
  return v4({}, new Uint8Array(16), 0);
}

let instanceKey = null; // A search key is used to compare the data in two objects. An object's search key is stored in its
// <see cref="PropertyTags.PR_SEARCH_KEY" /> (PidTagSearchKey) property. Because a search key
// represents an object's data and not the object itself, two different objects with the same data can have the same
// search key. When an object is copied, for example, both the original object and its copy have the same data and the
// same search key. Messages and messaging users have search keys. The search key of a message is a unique identifier
// of  the message's data. Message store providers furnish a message's <see cref="PropertyTags.PR_SEARCH_KEY" />
// property at message creation time.The search key of an address book entry is computed from its address type(
// <see cref="PropertyTags.PR_ADDRTYPE_W" /> (PidTagAddressType)) and address
// (<see cref="PropertyTags.PR_EMAIL_ADDRESS_W" /> (PidTagEmailAddress)). If the address book entry is writable,
// its search key might not be available until the address type and address have been set by using the
// IMAPIProp::SetProps method and the entry has been saved by using the IMAPIProp::SaveChanges method.When these
// address properties change, it is possible for the corresponding search key not to be synchronized with the new
// values until the changes have been committed with a SaveChanges call. The value of an object's record key can be
// the same as or different than the value of its search key, depending on the service provider. Some service providers
// use the same value for an object's search key, record key, and entry identifier.Other service providers assign unique
// values for each of its objects identifiers.

function generateSearchKey(addressType, emailAddress) {
  return stringToUtf16LeArray(addressType + emailAddress);
} // A record key is used to compare two objects. Message store and address book objects must have record keys, which
// are stored in their <see cref="PropertyTags.PR_RECORD_KEY" /> (PidTagRecordKey) property. Because a record key
// identifies an object and not its data, every instance of an object has a unique record key. The scope of a record
// key for folders and messages is the message store. The scope for address book containers, messaging users, and
// distribution lists is the set of top-level containers provided by MAPI for use in the integrated address book.
// Record keys can be duplicated in another resource. For example, different messages in two different message stores
// can have the same record key. This is different from long-term entry identifiers; because long-term entry
// identifiers contain a reference to the service provider, they have a wider scope.A message store's record key is
// similar in scope to a long-term entry identifier; it should be unique across all message store providers. To ensure
// this uniqueness, message store providers typically set their record key to a value that is the combination of their
// <see cref="PropertyTags.PR_MDB_PROVIDER" /> (PidTagStoreProvider) property and an identifier that is unique to the
// message store.

function generateRecordKey() {
  return makeUUIDBuffer();
} // This property is a binary value that uniquely identifies a row in a table view. It is a required column in most
// tables. If a row is included in two views, there are two different instance keys. The instance key of a row may
// differ each time the table is opened, but remains constant while the table is open. Rows added while a table is in
// use do not reuse an instance key that was previously used.
// message store.

function generateInstanceKey() {
  if (instanceKey == null) {
    instanceKey = makeUUIDBuffer().slice(0, 4);
  }

  return instanceKey;
} // The PR_ENTRYID property contains a MAPI entry identifier used to open and edit properties of a particular MAPI
// object.
// The PR_ENTRYID property identifies an object for OpenEntry to instantiate and provides access to all of its
// properties through the appropriate derived interface of IMAPIProp. PR_ENTRYID is one of the base address properties
// for all messaging users. The PR_ENTRYID for CEMAPI always contains long-term identifiers.
// - Required on folder objects
// - Required on message store objects
// - Required on status objects
// - Changed in a copy operation
// - Unique within entire world

function generateEntryId() {
  // Encoding.Unicode.GetBytes(Guid.NewGuid().ToString());
  const val = v4(); // v4 without args gives a string

  return new stringToUtf16LeArray(val);
}

/**
 * The properties stream contained inside an Recipient storage object.
 */
let RecipientProperties = /*#__PURE__*/function (_Properties) {
  _inherits(RecipientProperties, _Properties);

  var _super = _createSuper(RecipientProperties);

  function RecipientProperties() {
    _classCallCheck(this, RecipientProperties);

    return _super.apply(this, arguments);
  }

  _createClass(RecipientProperties, [{
    key: "writeProperties",
    value: function writeProperties(storage, prefix, messageSize) {
      const recipPropPrefix = buf => {
        prefix(buf); // Reserved(8 bytes): This field MUST be set to zero when writing a .msg file and MUST be ignored
        // when reading a.msg file.

        buf.writeUint64(0);
      };

      return _get(_getPrototypeOf(RecipientProperties.prototype), "writeProperties", this).call(this, storage, recipPropPrefix, messageSize);
    }
  }]);

  return RecipientProperties;
}(Properties);

/**
 * Wrapper around a list of recipients
 */
let Recipients = /*#__PURE__*/function (_Array) {
  _inherits(Recipients, _Array);

  var _super = _createSuper(Recipients);

  function Recipients() {
    _classCallCheck(this, Recipients);

    return _super.apply(this, arguments);
  }

  _createClass(Recipients, [{
    key: "addTo",

    /**
     * add a new To-Recipient to the list
     * @param email email address of the recipient
     * @param displayName display name of the recipient (optional)
     * @param addressType address type of the recipient (default SMTP)
     * @param objectType mapiObjectType of the recipient (default MAPI_MAILUSER)
     * @param displayType recipientRowDisplayType of the recipient (default MessagingUser)
     */
    value: function addTo(email, displayName = "", addressType = 'SMTP', objectType = MapiObjectType.MAPI_MAILUSER, displayType = RecipientRowDisplayType.MessagingUser) {
      this.push(new Recipient(this.length, email, displayName, addressType, RecipientType.To, objectType, displayType));
    }
    /**
     * add a new Cc-Recipient to the list
     * @param email email address of the recipient
     * @param displayName display name of the recipient (optional)
     * @param addressType address type of the recipient (default SMTP)
     * @param objectType mapiObjectType of the recipient (default MAPI_MAILUSER)
     * @param displayType recipientRowDisplayType of the recipient (default MessagingUser)
     */

  }, {
    key: "addCc",
    value: function addCc(email, displayName = "", addressType = 'SMTP', objectType = MapiObjectType.MAPI_MAILUSER, displayType = RecipientRowDisplayType.MessagingUser) {
      this.push(new Recipient(this.length, email, displayName, addressType, RecipientType.Cc, objectType, displayType));
    }
  }, {
    key: "addBcc",
    value: function addBcc(email, displayName = "", addressType = 'SMTP', objectType = MapiObjectType.MAPI_MAILUSER, displayType = RecipientRowDisplayType.MessagingUser) {
      this.push(new Recipient(this.length, email, displayName, addressType, RecipientType.Bcc, objectType, displayType));
    }
  }, {
    key: "writeToStorage",
    value: function writeToStorage(rootStorage) {
      let size = 0;

      for (let i = 0; i < this.length; i++) {
        const recipient = this[i];
        const storage = rootStorage.addStorage(PropertyTagLiterals.RecipientStoragePrefix + X8(i));
        size += recipient.writeProperties(storage);
      }

      return size;
    }
  }]);

  return Recipients;
}( /*#__PURE__*/_wrapNativeSuper(Array));
let Recipient = /*#__PURE__*/function (_Address) {
  _inherits(Recipient, _Address);

  var _super2 = _createSuper(Recipient);

  function Recipient(rowId, email, displayName, addressType, recipientType, objectType, displayType) {
    var _this;

    _classCallCheck(this, Recipient);

    _this = _super2.call(this, email, displayName, addressType);

    _defineProperty(_assertThisInitialized(_this), "_rowId", void 0);

    _defineProperty(_assertThisInitialized(_this), "recipientType", void 0);

    _defineProperty(_assertThisInitialized(_this), "_displayType", void 0);

    _defineProperty(_assertThisInitialized(_this), "_objectType", void 0);

    _this._rowId = rowId;
    _this.recipientType = recipientType;
    _this._displayType = displayType;
    _this._objectType = objectType;
    return _this;
  }

  _createClass(Recipient, [{
    key: "writeProperties",
    value: function writeProperties(storage) {
      const propertiesStream = new RecipientProperties();
      propertiesStream.addProperty(PropertyTags.PR_ROWID, this._rowId);
      propertiesStream.addProperty(PropertyTags.PR_ENTRYID, generateEntryId());
      propertiesStream.addProperty(PropertyTags.PR_INSTANCE_KEY, generateInstanceKey());
      propertiesStream.addProperty(PropertyTags.PR_RECIPIENT_TYPE, this.recipientType);
      propertiesStream.addProperty(PropertyTags.PR_ADDRTYPE_W, this.addressType);
      propertiesStream.addProperty(PropertyTags.PR_EMAIL_ADDRESS_W, this.email);
      propertiesStream.addProperty(PropertyTags.PR_OBJECT_TYPE, this._objectType);
      propertiesStream.addProperty(PropertyTags.PR_DISPLAY_TYPE, this._displayType);
      propertiesStream.addProperty(PropertyTags.PR_DISPLAY_NAME_W, this.displayName);
      propertiesStream.addProperty(PropertyTags.PR_SEARCH_KEY, generateSearchKey(this.addressType, this.email));
      return propertiesStream.writeProperties(storage, () => {});
    }
  }]);

  return Recipient;
}(Address);

let OneOffEntryId = /*#__PURE__*/function (_Address) {
  _inherits(OneOffEntryId, _Address);

  var _super = _createSuper(OneOffEntryId);

  function OneOffEntryId(email, displayName, addressType = "SMTP", messageFormat = MessageFormat.TextAndHtml, canLookupEmailAddress = false) {
    var _this;

    _classCallCheck(this, OneOffEntryId);

    _this = _super.call(this, email, displayName, addressType);

    _defineProperty(_assertThisInitialized(_this), "_messageFormat", void 0);

    _defineProperty(_assertThisInitialized(_this), "_canLookupEmailAddress", void 0);

    _this._messageFormat = messageFormat;
    _this._canLookupEmailAddress = canLookupEmailAddress;
    return _this;
  }

  _createClass(OneOffEntryId, [{
    key: "toByteArray",
    value: function toByteArray() {
      const buf = makeByteBuffer(); // Flags (4 bytes): This value is set to 0x00000000. Bits in this field indicate under what circumstances
      // a short-term EntryID is valid. However, in any EntryID stored in a property value, these 4 bytes are
      // zero, indicating a long-term EntryID.

      buf.writeUint32(0); // ProviderUID (16 bytes): The identifier of the provider that created the EntryID. This value is used to
      // route EntryIDs to the correct provider and MUST be set to %x81.2B.1F.A4.BE.A3.10.19.9D.6E.00.DD.01.0F.54.02.

      buf.append(Uint8Array.from([0x81, 0x2B, 0x1F, 0xA4, 0xBE, 0xA3, 0x10, 0x19, 0x9D, 0x6E, 0x00, 0xDD, 0x01, 0x0F, 0x54, 0x02])); // Version (2 bytes): This value is set to 0x0000.

      buf.writeUint16(0);
      let bits = 0x0000; // Pad(1 bit): (mask 0x8000) Reserved.This value is set to '0'.
      // bits |= 0x00 << 0
      // MAE (2 bits): (mask 0x0C00) The encoding used for Macintosh-specific data attachments, as specified in
      // [MS-OXCMAIL] section 2.1.3.4.3. The values for this field are specified in the following table.
      // Name        | Word value | Field value | Description
      // BinHex        0x0000       b'00'         BinHex encoded.
      // UUENCODE      0x0020       b'01'         UUENCODED.Not valid if the message is in Multipurpose Internet Mail
      //                                          Extensions(MIME) format, in which case the flag will be ignored and
      //                                          BinHex used instead.
      // AppleSingle   0x0040      b'10'          Apple Single encoded.Allowed only when the message format is MIME.
      // AppleDouble   0x0060      b'11'          Apple Double encoded.Allowed only when the message format is MIME.
      // bits |= 0x00 << 1
      // bits |= 0x00 << 2
      // Format (4 bits): (enumeration, mask 0x1E00) The message format desired for this recipient (1), as specified
      // in the following table.
      // Name        | Word value | Field value | Description
      // TextOnly      0x0006       b'0011'       Send a plain text message body.
      // HtmlOnly      0x000E       b'0111'       Send an HTML message body.
      // TextAndHtml   0x0016       b'1011'       Send a multipart / alternative body with both plain text and HTML.

      switch (this._messageFormat) {
        case MessageFormat.TextOnly:
          //bits |= 0x00 << 3
          //bits |= 0x00 << 4
          bits |= 0x01 << 5;
          bits |= 0x01 << 6;
          break;

        case MessageFormat.HtmlOnly:
          //bits |= 0x00 << 3
          bits |= 0x01 << 4;
          bits |= 0x01 << 5;
          bits |= 0x01 << 6;
          break;

        case MessageFormat.TextAndHtml:
          bits |= 0x01 << 3; //bits |= 0x00 << 4

          bits |= 0x01 << 5;
          bits |= 0x01 << 6;
          break;
      } // M (1 bit): (mask 0x0100) A flag that indicates how messages are to be sent. If b'0', indicates messages are
      // to be sent to the recipient (1) in Transport Neutral Encapsulation Format (TNEF) format; if b'1', messages
      // are sent to the recipient (1) in pure MIME format.


      bits |= 0x01 << 7; // U (1 bit): (mask 0x0080) A flag that indicates the format of the string fields that follow. If b'1', the
      // string fields following are in Unicode (UTF-16 form) with 2-byte terminating null characters; if b'0', the
      // string fields following are multibyte character set (MBCS) characters terminated by a single 0 byte.

      bits |= 0x01 << 8; // R (2 bits): (mask 0x0060) Reserved. This value is set to b'00'.
      //bits |= 0x00 << 9
      //bits |= 0x00 << 10
      // L (1 bit): (mask 0x0010) A flag that indicates whether the server can look up an address in the address
      // book. If b'1', server cannot look up this user's email address in the address book. If b'0', server can
      // look up this user's email address in the address book.

      if (this._canLookupEmailAddress) {
        bits |= 0x01 << 11;
      } // Pad (4 bits): (mask 0x000F) Reserved. This value is set to b'0000'.
      // bits |= 0x01 << 12
      // bits |= 0x01 << 13
      // bits |= 0x01 << 14
      // bits |= 0x01 << 15
      // if (BitConverter.IsLittleEndian) {
      //     bits = bits.Reverse().ToArray();
      //     binaryWriter.Write(bits);
      // } else {
      //     binaryWriter.Write(bits);
      // }


      buf.writeUint8(bits >>> 8 & 0xFF);
      buf.writeUint8(bits & 0xFF); //Strings.WriteNullTerminatedUnicodeString(binaryWriter, DisplayName);

      buf.append(stringToUtf16LeArray(this.displayName));
      buf.writeUint16(0);
      buf.append(stringToUtf16LeArray(this.addressType));
      buf.writeUint16(0);
      buf.append(stringToUtf16LeArray(this.email));
      buf.writeUint16(0);
      return byteBufferAsUint8Array(buf);
    }
  }]);

  return OneOffEntryId;
}(Address);

let Sender = /*#__PURE__*/function (_Address) {
  _inherits(Sender, _Address);

  var _super = _createSuper(Sender);

  function Sender(email, displayName, addressType = "SMTP", messageFormat = MessageFormat.TextAndHtml, canLookupEmailAddress = false, senderIsCreator = true) {
    var _this;

    _classCallCheck(this, Sender);

    _this = _super.call(this, email, displayName, addressType);

    _defineProperty(_assertThisInitialized(_this), "_messageFormat", void 0);

    _defineProperty(_assertThisInitialized(_this), "_canLookupEmailAddress", void 0);

    _defineProperty(_assertThisInitialized(_this), "_senderIsCreator", void 0);

    _this._messageFormat = messageFormat;
    _this._canLookupEmailAddress = canLookupEmailAddress;
    _this._senderIsCreator = senderIsCreator;
    return _this;
  }

  _createClass(Sender, [{
    key: "writeProperties",
    value: function writeProperties(stream) {
      if (this._senderIsCreator) {
        stream.addProperty(PropertyTags.PR_CreatorEmailAddr_W, this.email);
        stream.addProperty(PropertyTags.PR_CreatorSimpleDispName_W, this.displayName);
        stream.addProperty(PropertyTags.PR_CreatorAddrType_W, this.addressType);
      }

      const senderEntryId = new OneOffEntryId(this.email, this.displayName, this.addressType, this._messageFormat, this._canLookupEmailAddress);
      stream.addProperty(PropertyTags.PR_SENDER_ENTRYID, senderEntryId.toByteArray());
      stream.addProperty(PropertyTags.PR_SENDER_EMAIL_ADDRESS_W, this.email);
      stream.addProperty(PropertyTags.PR_SENDER_NAME_W, this.displayName);
      stream.addProperty(PropertyTags.PR_SENDER_ADDRTYPE_W, this.addressType);
    }
  }]);

  return Sender;
}(Address);

let AttachmentProperties = /*#__PURE__*/function (_Properties) {
  _inherits(AttachmentProperties, _Properties);

  var _super = _createSuper(AttachmentProperties);

  function AttachmentProperties() {
    _classCallCheck(this, AttachmentProperties);

    return _super.apply(this, arguments);
  }

  _createClass(AttachmentProperties, [{
    key: "writeProperties",

    /**
     * Writes all properties either as a CFStream or as a collection in
     * a PropertyTags.PropertiesStreamName stream to the given storage, this depends
     * on the PropertyType
     * See theProperties class it's Properties.WriteProperties method for the logic
     * that is used to determine this
     * @param storage cfb storage to write into
     * @param prefix
     * @param messageSize
     * @returns {number} total size of written Properties
     */
    value: function writeProperties(storage, prefix, messageSize) {
      const attachmentPropertyPrefix = buf => {
        prefix(buf); // Reserved (8 bytes): This field MUST be set to
        // zero when writing a .msg file and MUST be ignored when reading a .msg file.

        buf.writeUint64(0);
      };

      return _get(_getPrototypeOf(AttachmentProperties.prototype), "writeProperties", this).call(this, storage, attachmentPropertyPrefix, messageSize);
    }
  }]);

  return AttachmentProperties;
}(Properties);

const MimeTypes = Object.freeze({
  "323": "text/h323",
  "3dmf": "x-world/x-3dmf",
  "3dm": "x-world/x-3dmf",
  "3g2": "video/3gpp2",
  "3gp": "video/3gpp",
  "7z": "application/x-7z-compressed",
  "aab": "application/x-authorware-bin",
  "aac": "audio/aac",
  "aam": "application/x-authorware-map",
  "aas": "application/x-authorware-seg",
  "abc": "text/vnd.abc",
  "acgi": "text/html",
  "acx": "application/internet-property-stream",
  "afl": "video/animaflex",
  "ai": "application/postscript",
  "aif": "audio/aiff",
  "aifc": "audio/aiff",
  "aiff": "audio/aiff",
  "aim": "application/x-aim",
  "aip": "text/x-audiosoft-intra",
  "ani": "application/x-navi-animation",
  "aos": "application/x-nokia-9000-communicator-add-on-software",
  "appcache": "text/cache-manifest",
  "application": "application/x-ms-application",
  "aps": "application/mime",
  "art": "image/x-jg",
  "asf": "video/x-ms-asf",
  "asm": "text/x-asm",
  "asp": "text/asp",
  "asr": "video/x-ms-asf",
  "asx": "application/x-mplayer2",
  "atom": "application/atom+xml",
  "au": "audio/x-au",
  "avi": "video/avi",
  "avs": "video/avs-video",
  "axs": "application/olescript",
  "bas": "text/plain",
  "bcpio": "application/x-bcpio",
  "bin": "application/octet-stream",
  "bm": "image/bmp",
  "bmp": "image/bmp",
  "boo": "application/book",
  "book": "application/book",
  "boz": "application/x-bzip2",
  "bsh": "application/x-bsh",
  "bz2": "application/x-bzip2",
  "bz": "application/x-bzip",
  "cat": "application/vnd.ms-pki.seccat",
  "ccad": "application/clariscad",
  "cco": "application/x-cocoa",
  "cc": "text/plain",
  "cdf": "application/cdf",
  "cer": "application/pkix-cert",
  "cha": "application/x-chat",
  "chat": "application/x-chat",
  "class": "application/x-java-applet",
  "clp": "application/x-msclip",
  "cmx": "image/x-cmx",
  "cod": "image/cis-cod",
  "coffee": "text/x-coffeescript",
  "conf": "text/plain",
  "cpio": "application/x-cpio",
  "cpp": "text/plain",
  "cpt": "application/x-cpt",
  "crd": "application/x-mscardfile",
  "crl": "application/pkix-crl",
  "crt": "application/pkix-cert",
  "csh": "application/x-csh",
  "css": "text/css",
  "c": "text/plain",
  "c++": "text/plain",
  "cxx": "text/plain",
  "dart": "application/dart",
  "dcr": "application/x-director",
  "deb": "application/x-deb",
  "deepv": "application/x-deepv",
  "def": "text/plain",
  "deploy": "application/octet-stream",
  "der": "application/x-x509-ca-cert",
  "dib": "image/bmp",
  "dif": "video/x-dv",
  "dir": "application/x-director",
  "disco": "text/xml",
  "dll": "application/x-msdownload",
  "dl": "video/dl",
  "doc": "application/msword",
  "docm": "application/vnd.ms-word.document.macroEnabled.12",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "dot": "application/msword",
  "dotm": "application/vnd.ms-word.template.macroEnabled.12",
  "dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  "dp": "application/commonground",
  "drw": "application/drafting",
  "dtd": "application/xml-dtd",
  "dvi": "application/x-dvi",
  "dv": "video/x-dv",
  "dwf": "drawing/x-dwf (old)",
  "dwg": "application/acad",
  "dxf": "application/dxf",
  "dxr": "application/x-director",
  "elc": "application/x-elc",
  "el": "text/x-script.elisp",
  "eml": "message/rfc822",
  "eot": "application/vnd.bw-fontobject",
  "eps": "application/postscript",
  "es": "application/x-esrehber",
  "etx": "text/x-setext",
  "evy": "application/envoy",
  "exe": "application/octet-stream",
  "f77": "text/plain",
  "f90": "text/plain",
  "fdf": "application/vnd.fdf",
  "fif": "image/fif",
  "flac": "audio/x-flac",
  "fli": "video/fli",
  "flo": "image/florian",
  "flr": "x-world/x-vrml",
  "flx": "text/vnd.fmi.flexstor",
  "fmf": "video/x-atomic3d-feature",
  "for": "text/plain",
  "fpx": "image/vnd.fpx",
  "frl": "application/freeloader",
  "f": "text/plain",
  "funk": "audio/make",
  "g3": "image/g3fax",
  "gif": "image/gif",
  "gl": "video/gl",
  "gsd": "audio/x-gsm",
  "gsm": "audio/x-gsm",
  "gsp": "application/x-gsp",
  "gss": "application/x-gss",
  "gtar": "application/x-gtar",
  "g": "text/plain",
  "gz": "application/x-gzip",
  "gzip": "application/x-gzip",
  "hdf": "application/x-hdf",
  "help": "application/x-helpfile",
  "hgl": "application/vnd.hp-HPGL",
  "hh": "text/plain",
  "hlb": "text/x-script",
  "hlp": "application/x-helpfile",
  "hpg": "application/vnd.hp-HPGL",
  "hpgl": "application/vnd.hp-HPGL",
  "hqx": "application/binhex",
  "hta": "application/hta",
  "htc": "text/x-component",
  "h": "text/plain",
  "htmls": "text/html",
  "html": "text/html",
  "htm": "text/html",
  "htt": "text/webviewhtml",
  "htx": "text/html",
  "ice": "x-conference/x-cooltalk",
  "ico": "image/x-icon",
  "ics": "text/calendar",
  "idc": "text/plain",
  "ief": "image/ief",
  "iefs": "image/ief",
  "iges": "application/iges",
  "igs": "application/iges",
  "iii": "application/x-iphone",
  "ima": "application/x-ima",
  "imap": "application/x-httpd-imap",
  "inf": "application/inf",
  "ins": "application/x-internett-signup",
  "ip": "application/x-ip2",
  "isp": "application/x-internet-signup",
  "isu": "video/x-isvideo",
  "it": "audio/it",
  "iv": "application/x-inventor",
  "ivf": "video/x-ivf",
  "ivr": "i-world/i-vrml",
  "ivy": "application/x-livescreen",
  "jam": "audio/x-jam",
  "jar": "application/java-archive",
  "java": "text/plain",
  "jav": "text/plain",
  "jcm": "application/x-java-commerce",
  "jfif": "image/jpeg",
  "jfif-tbnl": "image/jpeg",
  "jpeg": "image/jpeg",
  "jpe": "image/jpeg",
  "jpg": "image/jpeg",
  "jps": "image/x-jps",
  "js": "application/javascript",
  "json": "application/json",
  "jut": "image/jutvision",
  "kar": "audio/midi",
  "ksh": "text/x-script.ksh",
  "la": "audio/nspaudio",
  "lam": "audio/x-liveaudio",
  "latex": "application/x-latex",
  "list": "text/plain",
  "lma": "audio/nspaudio",
  "log": "text/plain",
  "lsp": "application/x-lisp",
  "lst": "text/plain",
  "lsx": "text/x-la-asf",
  "ltx": "application/x-latex",
  "m13": "application/x-msmediaview",
  "m14": "application/x-msmediaview",
  "m1v": "video/mpeg",
  "m2a": "audio/mpeg",
  "m2v": "video/mpeg",
  "m3u": "audio/x-mpequrl",
  "m4a": "audio/mp4",
  "m4v": "video/mp4",
  "man": "application/x-troff-man",
  "manifest": "application/x-ms-manifest",
  "map": "application/x-navimap",
  "mar": "text/plain",
  "mbd": "application/mbedlet",
  "mc$": "application/x-magic-cap-package-1.0",
  "mcd": "application/mcad",
  "mcf": "image/vasa",
  "mcp": "application/netmc",
  "mdb": "application/x-msaccess",
  "mesh": "model/mesh",
  "me": "application/x-troff-me",
  "mid": "audio/midi",
  "midi": "audio/midi",
  "mif": "application/x-mif",
  "mjf": "audio/x-vnd.AudioExplosion.MjuiceMediaFile",
  "mjpg": "video/x-motion-jpeg",
  "mm": "application/base64",
  "mme": "application/base64",
  "mny": "application/x-msmoney",
  "mod": "audio/mod",
  "mov": "video/quicktime",
  "movie": "video/x-sgi-movie",
  "mp2": "video/mpeg",
  "mp3": "audio/mpeg",
  "mp4": "video/mp4",
  "mp4a": "audio/mp4",
  "mp4v": "video/mp4",
  "mpa": "audio/mpeg",
  "mpc": "application/x-project",
  "mpeg": "video/mpeg",
  "mpe": "video/mpeg",
  "mpga": "audio/mpeg",
  "mpg": "video/mpeg",
  "mpp": "application/vnd.ms-project",
  "mpt": "application/x-project",
  "mpv2": "video/mpeg",
  "mpv": "application/x-project",
  "mpx": "application/x-project",
  "mrc": "application/marc",
  "ms": "application/x-troff-ms",
  "msh": "model/mesh",
  "m": "text/plain",
  "mvb": "application/x-msmediaview",
  "mv": "video/x-sgi-movie",
  "my": "audio/make",
  "mzz": "application/x-vnd.AudioExplosion.mzz",
  "nap": "image/naplps",
  "naplps": "image/naplps",
  "nc": "application/x-netcdf",
  "ncm": "application/vnd.nokia.configuration-message",
  "niff": "image/x-niff",
  "nif": "image/x-niff",
  "nix": "application/x-mix-transfer",
  "nsc": "application/x-conference",
  "nvd": "application/x-navidoc",
  "nws": "message/rfc822",
  "oda": "application/oda",
  "ods": "application/oleobject",
  "oga": "audio/ogg",
  "ogg": "audio/ogg",
  "ogv": "video/ogg",
  "ogx": "application/ogg",
  "omc": "application/x-omc",
  "omcd": "application/x-omcdatamaker",
  "omcr": "application/x-omcregerator",
  "opus": "audio/ogg",
  "oxps": "application/oxps",
  "p10": "application/pkcs10",
  "p12": "application/pkcs-12",
  "p7a": "application/x-pkcs7-signature",
  "p7b": "application/x-pkcs7-certificates",
  "p7c": "application/pkcs7-mime",
  "p7m": "application/pkcs7-mime",
  "p7r": "application/x-pkcs7-certreqresp",
  "p7s": "application/pkcs7-signature",
  "part": "application/pro_eng",
  "pas": "text/pascal",
  "pbm": "image/x-portable-bitmap",
  "pcl": "application/x-pcl",
  "pct": "image/x-pict",
  "pcx": "image/x-pcx",
  "pdb": "chemical/x-pdb",
  "pdf": "application/pdf",
  "pfunk": "audio/make",
  "pfx": "application/x-pkcs12",
  "pgm": "image/x-portable-graymap",
  "pic": "image/pict",
  "pict": "image/pict",
  "pkg": "application/x-newton-compatible-pkg",
  "pko": "application/vnd.ms-pki.pko",
  "pl": "text/plain",
  "plx": "application/x-PiXCLscript",
  "pm4": "application/x-pagemaker",
  "pm5": "application/x-pagemaker",
  "pma": "application/x-perfmon",
  "pmc": "application/x-perfmon",
  "pm": "image/x-xpixmap",
  "pml": "application/x-perfmon",
  "pmr": "application/x-perfmon",
  "pmw": "application/x-perfmon",
  "png": "image/png",
  "pnm": "application/x-portable-anymap",
  "pot": "application/vnd.ms-powerpoint",
  "potm": "application/vnd.ms-powerpoint.template.macroEnabled.12",
  "potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
  "pov": "model/x-pov",
  "ppa": "application/vnd.ms-powerpoint",
  "ppam": "application/vnd.ms-powerpoint.addin.macroEnabled.12",
  "ppm": "image/x-portable-pixmap",
  "pps": "application/vnd.ms-powerpoint",
  "ppsm": "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",
  "ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "ppt": "application/vnd.ms-powerpoint",
  "pptm": "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
  "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "ppz": "application/mspowerpoint",
  "pre": "application/x-freelance",
  "prf": "application/pics-rules",
  "prt": "application/pro_eng",
  "ps": "application/postscript",
  "p": "text/x-pascal",
  "pub": "application/x-mspublisher",
  "pvu": "paleovu/x-pv",
  "pwz": "application/vnd.ms-powerpoint",
  "pyc": "applicaiton/x-bytecode.python",
  "py": "text/x-script.phyton",
  "qcp": "audio/vnd.qcelp",
  "qd3d": "x-world/x-3dmf",
  "qd3": "x-world/x-3dmf",
  "qif": "image/x-quicktime",
  "qtc": "video/x-qtc",
  "qtif": "image/x-quicktime",
  "qti": "image/x-quicktime",
  "qt": "video/quicktime",
  "ra": "audio/x-pn-realaudio",
  "ram": "audio/x-pn-realaudio",
  "ras": "application/x-cmu-raster",
  "rast": "image/cmu-raster",
  "rexx": "text/x-script.rexx",
  "rf": "image/vnd.rn-realflash",
  "rgb": "image/x-rgb",
  "rm": "application/vnd.rn-realmedia",
  "rmi": "audio/mid",
  "rmm": "audio/x-pn-realaudio",
  "rmp": "audio/x-pn-realaudio",
  "rng": "application/ringing-tones",
  "rnx": "application/vnd.rn-realplayer",
  "roff": "application/x-troff",
  "rp": "image/vnd.rn-realpix",
  "rpm": "audio/x-pn-realaudio-plugin",
  "rss": "application/rss+xml",
  "rtf": "text/richtext",
  "rt": "text/richtext",
  "rtx": "text/richtext",
  "rv": "video/vnd.rn-realvideo",
  "s3m": "audio/s3m",
  "sbk": "application/x-tbook",
  "scd": "application/x-msschedule",
  "scm": "application/x-lotusscreencam",
  "sct": "text/scriptlet",
  "sdml": "text/plain",
  "sdp": "application/sdp",
  "sdr": "application/sounder",
  "sea": "application/sea",
  "set": "application/set",
  "setpay": "application/set-payment-initiation",
  "setreg": "application/set-registration-initiation",
  "sgml": "text/sgml",
  "sgm": "text/sgml",
  "shar": "application/x-bsh",
  "sh": "text/x-script.sh",
  "shtml": "text/html",
  "sid": "audio/x-psid",
  "silo": "model/mesh",
  "sit": "application/x-sit",
  "skd": "application/x-koan",
  "skm": "application/x-koan",
  "skp": "application/x-koan",
  "skt": "application/x-koan",
  "sl": "application/x-seelogo",
  "smi": "application/smil",
  "smil": "application/smil",
  "snd": "audio/basic",
  "sol": "application/solids",
  "spc": "application/x-pkcs7-certificates",
  "spl": "application/futuresplash",
  "spr": "application/x-sprite",
  "sprite": "application/x-sprite",
  "spx": "audio/ogg",
  "src": "application/x-wais-source",
  "ssi": "text/x-server-parsed-html",
  "ssm": "application/streamingmedia",
  "sst": "application/vnd.ms-pki.certstore",
  "step": "application/step",
  "s": "text/x-asm",
  "stl": "application/sla",
  "stm": "text/html",
  "stp": "application/step",
  "sv4cpio": "application/x-sv4cpio",
  "sv4crc": "application/x-sv4crc",
  "svf": "image/x-dwg",
  "svg": "image/svg+xml",
  "svr": "application/x-world",
  "swf": "application/x-shockwave-flash",
  "talk": "text/x-speech",
  "t": "application/x-troff",
  "tar": "application/x-tar",
  "tbk": "application/toolbook",
  "tcl": "text/x-script.tcl",
  "tcsh": "text/x-script.tcsh",
  "tex": "application/x-tex",
  "texi": "application/x-texinfo",
  "texinfo": "application/x-texinfo",
  "text": "text/plain",
  "tgz": "application/x-compressed",
  "tiff": "image/tiff",
  "tif": "image/tiff",
  "tr": "application/x-troff",
  "trm": "application/x-msterminal",
  "ts": "text/x-typescript",
  "tsi": "audio/tsp-audio",
  "tsp": "audio/tsplayer",
  "tsv": "text/tab-separated-values",
  "ttf": "application/x-font-ttf",
  "turbot": "image/florian",
  "txt": "text/plain",
  "uil": "text/x-uil",
  "uls": "text/iuls",
  "unis": "text/uri-list",
  "uni": "text/uri-list",
  "unv": "application/i-deas",
  "uris": "text/uri-list",
  "uri": "text/uri-list",
  "ustar": "multipart/x-ustar",
  "uue": "text/x-uuencode",
  "uu": "text/x-uuencode",
  "vcd": "application/x-cdlink",
  "vcf": "text/vcard",
  "vcard": "text/vcard",
  "vcs": "text/x-vCalendar",
  "vda": "application/vda",
  "vdo": "video/vdo",
  "vew": "application/groupwise",
  "vivo": "video/vivo",
  "viv": "video/vivo",
  "vmd": "application/vocaltec-media-desc",
  "vmf": "application/vocaltec-media-file",
  "voc": "audio/voc",
  "vos": "video/vosaic",
  "vox": "audio/voxware",
  "vqe": "audio/x-twinvq-plugin",
  "vqf": "audio/x-twinvq",
  "vql": "audio/x-twinvq-plugin",
  "vrml": "application/x-vrml",
  "vrt": "x-world/x-vrt",
  "vsd": "application/x-visio",
  "vst": "application/x-visio",
  "vsw": "application/x-visio",
  "w60": "application/wordperfect6.0",
  "w61": "application/wordperfect6.1",
  "w6w": "application/msword",
  "wav": "audio/wav",
  "wb1": "application/x-qpro",
  "wbmp": "image/vnd.wap.wbmp",
  "wcm": "application/vnd.ms-works",
  "wdb": "application/vnd.ms-works",
  "web": "application/vnd.xara",
  "webm": "video/webm",
  "wiz": "application/msword",
  "wk1": "application/x-123",
  "wks": "application/vnd.ms-works",
  "wmf": "windows/metafile",
  "wmlc": "application/vnd.wap.wmlc",
  "wmlsc": "application/vnd.wap.wmlscriptc",
  "wmls": "text/vnd.wap.wmlscript",
  "wml": "text/vnd.wap.wml",
  "wmp": "video/x-ms-wmp",
  "wmv": "video/x-ms-wmv",
  "wmx": "video/x-ms-wmx",
  "woff": "application/x-woff",
  "word": "application/msword",
  "wp5": "application/wordperfect",
  "wp6": "application/wordperfect",
  "wp": "application/wordperfect",
  "wpd": "application/wordperfect",
  "wps": "application/vnd.ms-works",
  "wq1": "application/x-lotus",
  "wri": "application/mswrite",
  "wrl": "application/x-world",
  "wrz": "model/vrml",
  "wsc": "text/scriplet",
  "wsdl": "text/xml",
  "wsrc": "application/x-wais-source",
  "wtk": "application/x-wintalk",
  "wvx": "video/x-ms-wvx",
  "x3d": "model/x3d+xml",
  "x3db": "model/x3d+fastinfoset",
  "x3dv": "model/x3d-vrml",
  "xaf": "x-world/x-vrml",
  "xaml": "application/xaml+xml",
  "xap": "application/x-silverlight-app",
  "xbap": "application/x-ms-xbap",
  "xbm": "image/x-xbitmap",
  "xdr": "video/x-amt-demorun",
  "xgz": "xgl/drawing",
  "xht": "application/xhtml+xml",
  "xhtml": "application/xhtml+xml",
  "xif": "image/vnd.xiff",
  "xla": "application/vnd.ms-excel",
  "xlam": "application/vnd.ms-excel.addin.macroEnabled.12",
  "xl": "application/excel",
  "xlb": "application/excel",
  "xlc": "application/excel",
  "xld": "application/excel",
  "xlk": "application/excel",
  "xll": "application/excel",
  "xlm": "application/excel",
  "xls": "application/vnd.ms-excel",
  "xlsb": "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
  "xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "xlt": "application/vnd.ms-excel",
  "xltm": "application/vnd.ms-excel.template.macroEnabled.12",
  "xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "xlv": "application/excel",
  "xlw": "application/excel",
  "xm": "audio/xm",
  "xml": "text/xml",
  "xmz": "xgl/movie",
  "xof": "x-world/x-vrml",
  "xpi": "application/x-xpinstall",
  "xpix": "application/x-vnd.ls-xpix",
  "xpm": "image/xpm",
  "xps": "application/vnd.ms-xpsdocument",
  "x-png": "image/png",
  "xsd": "text/xml",
  "xsl": "text/xml",
  "xslt": "text/xml",
  "xsr": "video/x-amt-showrun",
  "xwd": "image/x-xwd",
  "xyz": "chemical/x-pdb",
  "z": "application/x-compressed",
  "zip": "application/zip",
  "zsh": "text/x-script.zsh"
});
function getMimeType(fileName) {
  if (fileName == null) throw new Error("fileName is null!");
  const aos = MimeTypes["exe"];
  const dot = fileName.lastIndexOf(".");

  if (dot !== -1 && fileName.length > dot + 1) {
    const ext = fileName.substring(dot + 1);
    return MimeTypes[ext] || aos;
  }

  return aos;
}

let Attachment = /*#__PURE__*/function () {
  // was: DateTime
  // TODO
  function Attachment(data, // was: Stream
  fileName, creationTime, lastModificationTime, type = AttachmentType.ATTACH_BY_VALUE, renderingPosition = -1, contentId = "", isContactPhoto = false) {
    _classCallCheck(this, Attachment);

    _defineProperty(this, "_file", void 0);

    _defineProperty(this, "data", void 0);

    _defineProperty(this, "fileName", void 0);

    _defineProperty(this, "type", void 0);

    _defineProperty(this, "renderingPosition", void 0);

    _defineProperty(this, "isInline", void 0);

    _defineProperty(this, "contentId", void 0);

    _defineProperty(this, "isContactPhoto", void 0);

    _defineProperty(this, "creationTime", void 0);

    _defineProperty(this, "lastModificationTime", void 0);

    this.data = data;
    this.fileName = fileName;
    this.creationTime = creationTime;
    this.lastModificationTime = lastModificationTime;
    this.type = type;
    this.renderingPosition = renderingPosition;
    this.contentId = contentId;
    this.isContactPhoto = isContactPhoto;
  }

  _createClass(Attachment, [{
    key: "writeProperties",
    value: function writeProperties(storage, index) {
      const attachmentProperties = new AttachmentProperties();
      attachmentProperties.addProperty(PropertyTags.PR_ATTACH_NUM, index, PropertyFlag.PROPATTR_READABLE);
      attachmentProperties.addProperty(PropertyTags.PR_INSTANCE_KEY, generateInstanceKey(), PropertyFlag.PROPATTR_READABLE);
      attachmentProperties.addProperty(PropertyTags.PR_RECORD_KEY, generateRecordKey(), PropertyFlag.PROPATTR_READABLE);
      attachmentProperties.addProperty(PropertyTags.PR_RENDERING_POSITION, this.renderingPosition, PropertyFlag.PROPATTR_READABLE);
      attachmentProperties.addProperty(PropertyTags.PR_OBJECT_TYPE, MapiObjectType.MAPI_ATTACH);

      if (!isNullOrEmpty(this.fileName)) {
        attachmentProperties.addProperty(PropertyTags.PR_DISPLAY_NAME_W, this.fileName);
        attachmentProperties.addProperty(PropertyTags.PR_ATTACH_FILENAME_W, fileNameToDosFileName(this.fileName));
        attachmentProperties.addProperty(PropertyTags.PR_ATTACH_LONG_FILENAME_W, this.fileName);
        attachmentProperties.addProperty(PropertyTags.PR_ATTACH_EXTENSION_W, getPathExtension(this.fileName));

        if (!isNullOrEmpty(this.contentId)) {
          attachmentProperties.addProperty(PropertyTags.PR_ATTACH_CONTENT_ID_W, this.contentId);
        } // TODO: get mimetype from user.


        attachmentProperties.addProperty(PropertyTags.PR_ATTACH_MIME_TAG_W, getMimeType(this.fileName));
      }

      attachmentProperties.addProperty(PropertyTags.PR_ATTACH_METHOD, this.type);

      switch (this.type) {
        case AttachmentType.ATTACH_BY_VALUE:
        case AttachmentType.ATTACH_EMBEDDED_MSG:
          attachmentProperties.addProperty(PropertyTags.PR_ATTACH_DATA_BIN, this.data);
          attachmentProperties.addProperty(PropertyTags.PR_ATTACH_SIZE, this.data.length);
          break;

        case AttachmentType.ATTACH_BY_REF_ONLY:
          // TODO:
          throw new Error("attach_by_ref_only not implemented!"); // $FlowFixMe[unreachable-code]
        //case AttachmentType.ATTACH_EMBEDDED_MSG:
        //    var msgStorage = storage.AddStorage(PropertyTags.PR_ATTACH_DATA_BIN.Name)
        //    var cf = new CompoundFile(Stream)
        //    Storage.Copy(cf.RootStorage, msgStorage)
        //    propertiesStream.AddProperty(PropertyTags.PR_ATTACH_SIZE, Stream.Length)
        //    propertiesStream.AddProperty(PropertyTags.PR_ATTACH_ENCODING, 0)
        //    break

        case AttachmentType.ATTACH_BY_REFERENCE:
        case AttachmentType.ATTACH_BY_REF_RESOLVE:
        case AttachmentType.NO_ATTACHMENT:
        case AttachmentType.ATTACH_OLE:
          throw new Error("AttachByReference, AttachByRefResolve, NoAttachment and AttachOle are not supported");
      }

      if (this.contentId) {
        attachmentProperties.addProperty(PropertyTags.PR_ATTACHMENT_HIDDEN, true);
        attachmentProperties.addProperty(PropertyTags.PR_ATTACH_FLAGS, AttachmentFlags.ATT_MHTML_REF);
      } // TODO: DateTime


      const now = Date.now();
      attachmentProperties.addProperty(PropertyTags.PR_CREATION_TIME, now);
      attachmentProperties.addProperty(PropertyTags.PR_LAST_MODIFICATION_TIME, now);
      attachmentProperties.addProperty(PropertyTags.PR_STORE_SUPPORT_MASK, StoreSupportMaskConst, PropertyFlag.PROPATTR_READABLE);
      return attachmentProperties.writeProperties(storage, () => {});
    }
  }]);

  return Attachment;
}();

let Attachments = /*#__PURE__*/function (_Array) {
  _inherits(Attachments, _Array);

  var _super = _createSuper(Attachments);

  function Attachments() {
    _classCallCheck(this, Attachments);

    return _super.apply(this, arguments);
  }

  _createClass(Attachments, [{
    key: "_checkAttachmentFileName",

    /**
     * checks if fileName already exists in this object
     * @param fileName {string} the name to check.
     * @param contentId {string} the contentId of the file
     * @private
     */
    value: function _checkAttachmentFileName(fileName, contentId) {
      //const file = Path.GetFileName(fileName).toLowerCase()
      const cid = contentId.toLowerCase();

      if (this.some(attachment => attachment.fileName.toLowerCase() === fileName && attachment.contentId.toLowerCase() === cid)) {
        throw new Error("The attachment with the name '" + fileName + "' already exists");
      }
    }
    /**
     * Writes the Attachment objects to the given storage and sets all the needed properties
     * @param rootStorage
     * @returns {number} the total size of the written attachment objects and their properties
     */

  }, {
    key: "writeToStorage",
    value: function writeToStorage(rootStorage) {
      let size = 0;

      for (let i = 0; i < this.length; i++) {
        const attachment = this[i];
        const storage = rootStorage.addStorage(PropertyTagLiterals.AttachmentStoragePrefix + X8(i));
        size += attachment.writeProperties(storage, i);
      }

      return size;
    }
    /**
     * adds an Attachment by AttachmentType.ATTACH_BY_VALUE (default)
     * @param data {Uint8Array} data to add as attachment
     * @param fileName {string} file to add with full path
     * @param creationTime {number} file creation time
     * @param lastModificationTime {number} file modification time
     * @param type {AttachmentTypeEnum} how to attach the attachment
     * @param renderingPosition {number} how to display in a rich text message
     * @param isInline {boolean} set to true to add the attachment inline
     * @param contentId {string} the id for the inline attachment if isInline is true
     * @param isContactPhoto {boolean} if the attachment is a contact photo
     */

  }, {
    key: "add",
    value: function add(data, fileName, creationTime, lastModificationTime, contentId = "", type = AttachmentType.ATTACH_BY_VALUE, renderingPosition = -1, isInline = false, isContactPhoto = false) {
      if (this.length >= 2048) throw new Error("length > 2048 => too many attachments!");

      this._checkAttachmentFileName(fileName, contentId);

      const a = new Attachment(...arguments);
      this.push(a);
    }
  }]);

  return Attachments;
}( /*#__PURE__*/_wrapNativeSuper(Array));

let Strings = /*#__PURE__*/function () {
  function Strings() {
    _classCallCheck(this, Strings);
  }

  _createClass(Strings, null, [{
    key: "escapeRtf",

    /**
     * returns the str as an escaped RTF string
     * @param str {string} string to escape
     */
    value: function escapeRtf(str) {
      const rtfEscaped = [];
      const escapedChars = ['{', '}', '\\'];

      for (const glyph of str) {
        const charCode = glyph.charCodeAt(0);
        if (charCode <= 31) continue; // non-printables

        if (charCode <= 127) {
          // 7-bit ascii
          if (escapedChars.includes(glyph)) rtfEscaped.push('\\');
          rtfEscaped.push(glyph);
        } else if (charCode <= 255) {
          // 8-bit ascii
          rtfEscaped.push("\\'" + x2(charCode));
        } else {
          // unicode. may consist of multiple code points
          for (const codepoint of glyph.split('')) {
            // TODO:
            // RTF control words generally accept signed 16-bit numbers as arguments.
            // For this reason, Unicode values greater than 32767 must be expressed as negative numbers.
            rtfEscaped.push("\\u");
            rtfEscaped.push(codepoint.charCodeAt(0));
            rtfEscaped.push('?');
          }
        }
      }

      return "{\\rtf1\\ansi\\ansicpg1252\\fromhtml1 {\\*\\htmltag1 " + rtfEscaped.join("") + " }}";
    }
  }]);

  return Strings;
}();

/**
 * The PidTagReportTag property ([MS-OXPROPS] section 2.917) contains the data that is used to correlate the report
 * and the original message. The property can be absent if the sender does not request a reply or response to the
 * original e-mail message. If the original E-mail object has either the PidTagResponseRequested property (section
 * 2.2.1.46) set to 0x01 or the PidTagReplyRequested property (section 2.2.1.45) set to 0x01, then the property is set
 * on the original E-mail object by using the following format.
 * See https://msdn.microsoft.com/en-us/library/ee160822(v=exchg.80).aspx
 */

let ReportTag = /*#__PURE__*/function () {
  // (9 bytes): A null-terminated string of nine characters used for validation; set to "PCDFEB09".
  // (4 bytes): This field specifies the version. If the SearchFolderEntryId field is present, this field MUST be set to
  // 0x00020001; otherwise, this field MUST be set to 0x00010001.
  // (4 bytes): Size of the StoreEntryId field.
  // (Variable length of bytes): This field specifies the entry ID of the mailbox that contains the original message. If
  // the value of the
  // StoreEntryIdSize field is 0x00000000, this field is omitted. If the value is not zero, this field is filled with
  // the number of bytes specified by the StoreEntryIdSize field.
  // (4 bytes): Size of the FolderEntryId field.
  // (Variable): This field specifies the entry ID of the folder that contains the original message. If the value of the
  // FolderEntryIdSize field is 0x00000000, this field is omitted. If the value is not zero, the field is filled with
  // the number of bytes specified by the FolderEntryIdSize field.
  // (4 bytes): Size of the MessageEntryId field.
  // (Variable): This field specifies the entry ID of the original message. If the value of the MessageEntryIdSize field
  // is 0x00000000, this field is omitted. If the value is not zero, the field is filled with the number of bytes
  // specified by the MessageEntryIdSize field.
  // (4 bytes): Size of the SearchFolderEntryId field.
  // (Variable): This field specifies the entry ID of an alternate folder that contains the original message. If the
  // value of the SearchFolderEntryIdSize field is 0x00000000, this field is omitted. If the value is not zero, the
  // field is filled with the number of bytes specified by the SearchFolderEntryIdSize field.
  // (4 bytes): Size of the MessageSearchKey field.
  // (variable): This field specifies the search key of the original message. If the value of the MessageSearchKeySize
  // field is 0x00000000, this field is omitted. If the value is not zero, the MessageSearchKey field is filled with the
  // number of bytes specified by the MessageSearchKeySize field.
  // (Variable): The subject of the original message. If the value of the ANSITextSize field is 0x00000000, this field
  // is omitted. If the value is not zero, the field is filled with the number of bytes specified by the ANSITextSize
  // field.
  function ReportTag(ansiText) {
    _classCallCheck(this, ReportTag);

    _defineProperty(this, "cookie", "PCDFEB09\0");

    _defineProperty(this, "version", 0x00010001);

    _defineProperty(this, "storeEntryIdSize", 0x00000000);

    _defineProperty(this, "storeEntryId", void 0);

    _defineProperty(this, "folderEntryIdSize", 0x00000000);

    _defineProperty(this, "folderEntryId", 0);

    _defineProperty(this, "messageEntryIdSize", 0x00000000);

    _defineProperty(this, "messageEntryId", 0);

    _defineProperty(this, "searchFolderEntryIdSize", 0x00000000);

    _defineProperty(this, "searchFolderEntryId", void 0);

    _defineProperty(this, "messageSearchKeySize", 0x00000000);

    _defineProperty(this, "messageSearchKey", void 0);

    _defineProperty(this, "ansiText", void 0);

    this.ansiText = ansiText;
  }
  /**
   * Returns this object as a byte array
   */


  _createClass(ReportTag, [{
    key: "toByteArray",
    value: function toByteArray() {
      const buf = makeByteBuffer(); // Cookie (9 bytes): A null-terminated string of nine characters used for validation; set to "PCDFEB09".
      // TODO:

      buf.writeUTF8String(this.cookie); // Version (4 bytes): This field specifies the version. If the SearchFolderEntryId field is present,
      // this field MUST be set to 0x00020001; otherwise, this field MUST be set to 0x00010001.

      buf.writeUint32(this.version); // (4 bytes): Size of the StoreEntryId field.

      buf.writeUint32(this.storeEntryIdSize); // (Variable length of bytes): This field specifies the entry ID of the mailbox that contains the original message. If
      // the value of the StoreEntryIdSize field is 0x00000000, this field is omitted. If the value is not zero, this field
      // is filled with the number of bytes specified by the StoreEntryIdSize field.
      //buf.append(this.storeEntryId);
      // (4 bytes): Size of the FolderEntryId field.

      buf.writeUint32(this.folderEntryIdSize); // (Variable): This field specifies the entry ID of the folder that contains the original message. If the value of the
      // FolderEntryIdSize field is 0x00000000, this field is omitted. If the value is not zero, the field is filled with
      // the number of bytes specified by the FolderEntryIdSize field.
      //buf.append(this.folderEntryId)
      // (4 bytes): Size of the MessageEntryId field.

      buf.writeUint32(this.messageEntryIdSize); // (Variable): This field specifies the entry ID of the original message. If the value of the MessageEntryIdSize field
      // is 0x00000000, this field is omitted. If the value is not zero, the field is filled with the number of bytes
      // specified by the MessageEntryIdSize field.
      //buf.append(this.messageEntryId)
      // (4 bytes): Size of the SearchFolderEntryId field.

      buf.writeUint32(this.searchFolderEntryIdSize); // (Variable): This field specifies the entry ID of an alternate folder that contains the original message. If the
      // value of the SearchFolderEntryIdSize field is 0x00000000, this field is omitted. If the value is not zero, the
      // field is filled with the number of bytes specified by the SearchFolderEntryIdSize field.
      //buf.append(this.searchFolderEntryId)
      // (4 bytes): Size of the MessageSearchKey field.

      buf.writeUint32(this.messageSearchKeySize); // (variable): This field specifies the search key of the original message. If the value of the MessageSearchKeySize
      // field is 0x00000000, this field is omitted. If the value is not zero, the MessageSearchKey field is filled with the
      // number of bytes specified by the MessageSearchKeySize field.
      //buf.append(this.messageSearchKey)
      // (4 bytes): Number of characters in the ANSI Text field.

      buf.writeUint32(this.ansiText.length); // (Variable): The subject of the original message. If the value of the ANSITextSize field is 0x00000000, this field
      // is omitted. If the value is not zero, the field is filled with the number of bytes specified by the ANSITextSize
      // field.

      buf.writeUTF8String(this.ansiText);
      return byteBufferAsUint8Array(buf);
    }
  }]);

  return ReportTag;
}();

const CRC32_TABLE = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];
let Crc32 = /*#__PURE__*/function () {
  function Crc32() {
    _classCallCheck(this, Crc32);
  }

  _createClass(Crc32, null, [{
    key: "calculate",

    /**
     * calculates a checksum of a ByteBuffers contents
     * @param buffer {ByteBuffer}
     * @returns {number} the crc32 of this buffer's contents between offset and limit
     */
    value: function calculate(buffer) {
      if (buffer.offset >= buffer.limit) return 0;
      const origOffset = buffer.offset;
      let result = 0;

      while (buffer.offset < buffer.limit) {
        const cur = buffer.readUint8();
        result = CRC32_TABLE[(result ^ cur) & 0xFF] ^ result >>> 8;
      }

      buffer.offset = origOffset; // unsigned representation. (-1 >>> 0) === 4294967295

      return result >>> 0;
    }
  }]);

  return Crc32;
}();

const INIT_DICT_SIZE = 207;
const MAX_DICT_SIZE = 4096;
const COMP_TYPE = "LZFu";
const HEADER_SIZE = 16;

function getInitialDict() {
  const builder = [];
  builder.push('{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}');
  builder.push('{\\f0\\fnil \\froman \\fswiss \\fmodern \\fscript ');
  builder.push('\\fdecor MS Sans SerifSymbolArialTimes New RomanCourier{\\colortbl\\red0\\green0\\blue0');
  builder.push('\r\n');
  builder.push('\\par \\pard\\plain\\f0\\fs20\\b\\i\\u\\tab\\tx');
  const res = builder.join('');
  let initialDictionary = makeByteBuffer(null, stringToUtf8Array(res));
  initialDictionary.ensureCapacity(MAX_DICT_SIZE);
  initialDictionary.limit = MAX_DICT_SIZE;
  initialDictionary.offset = INIT_DICT_SIZE;
  return initialDictionary;
}
/**
 * find the longest match of the start of the current input in the dictionary.
 * finds the length of the longest match of the start of the current input in the dictionary and
 * the position of it in the dictionary.
 * @param dictionary {ByteBuffer} part of the MS-OXRTFCP spec.
 * @param inputBuffer {ByteBuffer} pointing at the input data
 * @returns {MatchInfo} object containing dictionaryOffset, length
 */


function findLongestMatch(dictionary, inputBuffer) {
  const positionData = {
    length: 0,
    dictionaryOffset: 0
  };
  if (inputBuffer.offset >= inputBuffer.limit) return positionData;
  inputBuffer.mark();
  dictionary.mark(); // previousWriteOffset

  let matchLength = 0;
  let dictionaryIndex = 0;

  while (true) {
    const inputCharacter = inputBuffer.readUint8();
    const dictCharacter = dictionary.readUint8(dictionaryIndex % MAX_DICT_SIZE);

    if (dictCharacter === inputCharacter) {
      matchLength += 1;

      if (matchLength <= 17 && matchLength > positionData.length) {
        positionData.dictionaryOffset = dictionaryIndex - matchLength + 1;
        dictionary.writeUint8(inputCharacter);
        dictionary.offset = dictionary.offset % MAX_DICT_SIZE;
        positionData.length = matchLength;
      }

      if (inputBuffer.offset >= inputBuffer.limit) break;
    } else {
      inputBuffer.reset();
      inputBuffer.mark();
      matchLength = 0;
      if (inputBuffer.offset >= inputBuffer.limit) break;
    }

    dictionaryIndex += 1;
    if (dictionaryIndex >= dictionary.markedOffset + positionData.length) break;
  }

  inputBuffer.reset();
  return positionData;
}
/**
 * Takes in input, compresses it using LZFu by Microsoft. Can be viewed in the [MS-OXRTFCP].pdf document.
 * https://msdn.microsoft.com/en-us/library/cc463890(v=exchg.80).aspx. Returns the input as a byte array.
 * @param input {Uint8Array} the input to compress
 * @returns {Uint8Array} compressed input
 */


function compress(input) {
  let matchData = {
    length: 0,
    dictionaryOffset: 0
  };
  const inputBuffer = makeByteBuffer(null, input);
  const dictionary = getInitialDict();
  const tokenBuffer = makeByteBuffer(16);
  const resultBuffer = makeByteBuffer(17); // The writer MUST set the input cursor to the first byte in the input buffer.
  // The writer MUST set the output cursor to the 17th byte (to make space for the compressed header).

  resultBuffer.offset = HEADER_SIZE; // (1) The writer MUST (re)initialize the run by setting its
  // Control Byte to 0 (zero), its control bit to 0x01, and its token offset to 0 (zero).

  let controlByte = 0;
  let controlBit = 0x01;

  while (true) {
    // (3) Locate the longest match in the dictionary for the current input cursor,
    // as specified in section 3.3.4.2.1. Note that the dictionary is updated during this procedure.
    matchData = findLongestMatch(dictionary, inputBuffer);

    if (inputBuffer.offset >= inputBuffer.limit) {
      // (2) If there is no more input, the writer MUST exit the compression loop (by advancing to step 8).
      // (8) A dictionary reference (see section 2.2.1.5) MUST be created from an offset equal
      // to the current write offset of the dictionary and a length of 0 (zero), and inserted
      // in the token buffer as a big-endian word at the current token offset. The writer MUST
      // then advance the token offset by 2. The control bit MUST be ORed into the Control Byte,
      // thus setting the bit that corresponds to the current token to 1.
      let dictReference = (dictionary.offset & 0xFFF) << 4;
      tokenBuffer.writeUint8(dictReference >>> 8 & 0xFF);
      tokenBuffer.writeUint8(dictReference >>> 0 & 0xFF);
      controlByte |= controlBit; // (9) The writer MUST write the current run to the output by writing the BYTE Control Byte,
      // and then copying token offset number of BYTEs from the token buffer to the output.
      // The output cursor is advanced by token offset + 1 BYTE.

      resultBuffer.writeUint8(controlByte);
      tokenBuffer.limit = tokenBuffer.offset;
      tokenBuffer.offset = 0;
      resultBuffer.append(tokenBuffer);
      break;
    }

    if (matchData.length <= 1) {
      // (4) If the match is 0 (zero) or 1 byte in length, the writer
      // MUST copy the literal at the input cursor to the Run's token
      // buffer at token offset. The writer MUST increment the token offset and the input cursor.
      const inputCharacter = inputBuffer.readUint8();

      if (matchData.length === 0) {
        dictionary.writeUint8(inputCharacter);
        dictionary.offset = dictionary.offset % dictionary.limit;
      }

      tokenBuffer.writeUint8(inputCharacter);
    } else {
      // (5) If the match is 2 bytes or longer, the writer MUST create a dictionary
      // reference (see section 2.2.1.5) from the offset of the match and the length.
      // (Note: The value stored in the Length field in REFERENCE is length minus 2.)
      // The writer MUST insert this dictionary reference in the token buffer as a
      // big-endian word at the current token offset. The control bit MUST be bitwise
      // ORed into the Control Byte, thus setting the bit that corresponds to the
      // current token to 1. The writer MUST advance the token offset by 2 and
      // MUST advance the input cursor by the length of the match.
      let dictReference = (matchData.dictionaryOffset & 0xFFF) << 4 | matchData.length - 2 & 0xF;
      controlByte |= controlBit;
      tokenBuffer.writeUint8(dictReference >>> 8 & 0xFF);
      tokenBuffer.writeUint8(dictReference >>> 0 & 0xFF);
      inputBuffer.offset = inputBuffer.offset + matchData.length;
    }

    matchData.length = 0;

    if (controlBit === 0x80) {
      // (7) If the control bit is equal to 0x80, the writer MUST write the run
      // to the output by writing the BYTE Control Byte, and then copying the
      // token offset number of BYTEs from the token buffer to the output. The
      // writer MUST advance the output cursor by token offset + 1 BYTEs.
      // Continue with compression by returning to step (1).
      resultBuffer.writeUint8(controlByte);
      tokenBuffer.limit = tokenBuffer.offset;
      tokenBuffer.offset = 0;
      resultBuffer.append(tokenBuffer);
      controlByte = 0;
      controlBit = 0x01;
      tokenBuffer.clear();
      continue;
    } // (6) If the control bit is not 0x80, the control bit MUST be left-shifted by one bit and compression MUST
    // continue building the run by returning to step (2).


    controlBit <<= 1;
  } // After the output has been completed by execution of step (9), the writer
  // MUST complete the output by filling the header, as specified in section 3.3.4.2.2.
  // The writer MUST fill in the header by using the following process:
  // 1.Set the COMPSIZE (see section 2.2.1.1) field of the header to the number of CONTENTS bytes in the output buffer plus 12.


  resultBuffer.limit = resultBuffer.offset;
  resultBuffer.writeUint32(resultBuffer.limit - HEADER_SIZE + 12, 0); // 2.Set the RAWSIZE (see section 2.2.1.1) field of the header to the number of bytes read from the input.

  resultBuffer.writeUint32(input.length, 4); // 3.Set the COMPTYPE (see section 2.2.1.1) field of the header to COMPRESSED.

  resultBuffer.writeUTF8String(COMP_TYPE, 8); // 4.Set the CRC (see section 3.1.3.2) field of the header to the CRC (see section 3.1.1.1.2) generated from the CONTENTS bytes.

  resultBuffer.offset = HEADER_SIZE;
  resultBuffer.writeUint32(Crc32.calculate(resultBuffer), 12);
  resultBuffer.offset = resultBuffer.limit;
  return byteBufferAsUint8Array(resultBuffer);
}

const subjectPrefixRegex = /^(\D{1,3}:\s)(.*)$/;
let Email = /*#__PURE__*/function (_Message) {
  _inherits(Email, _Message);

  var _super = _createSuper(Email);

  // was: DateTime
  // Corresponds to the message ID field as specified in [RFC2822].
  // If set then this value will be used, when not set the value will be read from the
  // TransportMessageHeaders when this property is set
  function Email(draft = false, readReceipt = false) {
    var _this;

    _classCallCheck(this, Email);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "recipients", void 0);

    _defineProperty(_assertThisInitialized(_this), "replyToRecipients", void 0);

    _defineProperty(_assertThisInitialized(_this), "attachments", void 0);

    _defineProperty(_assertThisInitialized(_this), "_subject", "");

    _defineProperty(_assertThisInitialized(_this), "_sender", void 0);

    _defineProperty(_assertThisInitialized(_this), "_representing", void 0);

    _defineProperty(_assertThisInitialized(_this), "_receiving", void 0);

    _defineProperty(_assertThisInitialized(_this), "_receivingRepresenting", void 0);

    _defineProperty(_assertThisInitialized(_this), "subjectPrefix", void 0);

    _defineProperty(_assertThisInitialized(_this), "_subjectNormalized", void 0);

    _defineProperty(_assertThisInitialized(_this), "priority", void 0);

    _defineProperty(_assertThisInitialized(_this), "importance", void 0);

    _defineProperty(_assertThisInitialized(_this), "_bodyText", void 0);

    _defineProperty(_assertThisInitialized(_this), "_bodyHtml", void 0);

    _defineProperty(_assertThisInitialized(_this), "_bodyRtf", void 0);

    _defineProperty(_assertThisInitialized(_this), "bodyRtfCompressed", void 0);

    _defineProperty(_assertThisInitialized(_this), "_sentOn", void 0);

    _defineProperty(_assertThisInitialized(_this), "_receivedOn", void 0);

    _defineProperty(_assertThisInitialized(_this), "internetMessageId", void 0);

    _defineProperty(_assertThisInitialized(_this), "internetReferences", void 0);

    _defineProperty(_assertThisInitialized(_this), "inReplyToId", void 0);

    _defineProperty(_assertThisInitialized(_this), "transportMessageHeadersText", void 0);

    _defineProperty(_assertThisInitialized(_this), "transportMessageHeaders", void 0);

    _defineProperty(_assertThisInitialized(_this), "draft", void 0);

    _defineProperty(_assertThisInitialized(_this), "readReceipt", void 0);

    _defineProperty(_assertThisInitialized(_this), "messageEditorFormat", void 0);

    _this.recipients = new Recipients();
    _this.replyToRecipients = new Recipients();
    _this.attachments = new Attachments();
    _this.priority = MessagePriority.PRIO_NONURGENT;
    _this.importance = MessageImportance.IMPORTANCE_NORMAL;
    _this.iconIndex = MessageIconIndex.NewMail;
    _this.draft = draft;
    _this.readReceipt = readReceipt;
    _this._bodyHtml = "";
    _this._bodyText = "";
    _this._sentOn = null;
    _this._receivedOn = null;
    return _this;
  }

  _createClass(Email, [{
    key: "sender",
    value: function sender(address, displayName) {
      this._sender = new Sender(address, displayName || "");
      return this;
    }
  }, {
    key: "bodyHtml",
    value: function bodyHtml(html) {
      this._bodyHtml = html;
      return this;
    }
  }, {
    key: "bodyText",
    value: function bodyText(txt) {
      this._bodyText = txt;
      return this;
    }
  }, {
    key: "bodyFormat",
    value: function bodyFormat(fmt) {
      this.messageEditorFormat = fmt;
      return this;
    }
  }, {
    key: "subject",
    value: function subject(_subject) {
      this._subject = _subject;

      this._setSubject();

      return this;
    }
  }, {
    key: "to",
    value: function to(address, displayName) {
      this.recipients.addTo(address, displayName);
      return this;
    }
  }, {
    key: "cc",
    value: function cc(address, displayName) {
      this.recipients.addCc(address, displayName);
      return this;
    }
  }, {
    key: "bcc",
    value: function bcc(address, displayName) {
      this.recipients.addBcc(address, displayName);
      return this;
    }
  }, {
    key: "replyTo",
    value: function replyTo(address, displayName) {
      this.replyToRecipients.addTo(address, displayName);
      return this;
    }
  }, {
    key: "tos",
    value: function tos(recipients) {
      recipients.forEach(r => this.to(r.address, r.name));
      return this;
    }
  }, {
    key: "ccs",
    value: function ccs(recipients) {
      recipients.forEach(r => this.cc(r.address, r.name));
      return this;
    }
  }, {
    key: "bccs",
    value: function bccs(recipients) {
      recipients.forEach(r => this.bcc(r.address, r.name));
      return this;
    }
  }, {
    key: "replyTos",
    value: function replyTos(recipients) {
      recipients.forEach(r => this.replyTo(r.address, r.name));
      return this;
    }
  }, {
    key: "sentOn",
    value: function sentOn(when) {
      this._sentOn = when;
      return this;
    }
  }, {
    key: "receivedOn",
    value: function receivedOn(when) {
      this._receivedOn = when;
      return this;
    }
  }, {
    key: "attach",
    value: function attach(data, fileName, contentId = "", type = AttachmentType.ATTACH_BY_VALUE, creationTime = Date.now(), lastModificationTime = Date.now(), renderingPosition = -1, isContactPhoto = false) {
      this.attachments.add(...arguments);
      return this;
    }
    /**
     * the raw transport headers
     * @param headers
     */

  }, {
    key: "headers",
    value: function headers(_headers) {
      this.transportMessageHeadersText = _headers; // TODO: parse the headers into a MessageHeader, if we think we need to
      // this.transportMessageHeaders = new MessageHeader(parseMessageHeaders(headers))

      return this;
    }
  }, {
    key: "msg",
    value: function msg() {
      this._writeToStorage();

      return _get(_getPrototypeOf(Email.prototype), "saveToBuffer", this).call(this);
    }
  }, {
    key: "_setSubject",
    value: function _setSubject() {
      if (!isNullOrEmpty(this.subjectPrefix)) {
        if (this._subject.startsWith(this.subjectPrefix)) {
          this._subjectNormalized = this._subject.slice(this.subjectPrefix.length);
        } else {
          const match = this._subject.match(subjectPrefixRegex);

          if (match != null) {
            this.subjectPrefix = match[1];
            this._subjectNormalized = match[2];
          }
        }
      } else if (!isNullOrEmpty(this._subject)) {
        this._subjectNormalized = this._subject;

        const match = this._subject.match(subjectPrefixRegex);

        if (match != null) {
          this.subjectPrefix = match[1];
          this._subjectNormalized = match[2];
        }
      } else {
        this._subjectNormalized = this._subject;
      }

      if (!this.subjectPrefix) this.subjectPrefix = "";
    }
    /**
     * write to the cfb of the underlying message
     */

  }, {
    key: "_writeToStorage",
    value: function _writeToStorage() {
      const rootStorage = this._storage;
      if (this._messageClass === MessageClass.Unknown) this._messageClass = MessageClass.IPM_Note;
      this._messageSize += this.recipients.writeToStorage(rootStorage);
      this._messageSize += this.attachments.writeToStorage(rootStorage);
      const recipientCount = this.recipients.length;
      const attachmentCount = this.attachments.length;
      this._topLevelProperties.recipientCount = recipientCount;
      this._topLevelProperties.attachmentCount = attachmentCount;
      this._topLevelProperties.nextRecipientId = recipientCount;
      this._topLevelProperties.nextAttachmentId = attachmentCount;

      this._topLevelProperties.addProperty(PropertyTags.PR_ENTRYID, generateEntryId());

      this._topLevelProperties.addProperty(PropertyTags.PR_INSTANCE_KEY, generateInstanceKey());

      this._topLevelProperties.addProperty(PropertyTags.PR_STORE_SUPPORT_MASK, StoreSupportMaskConst, PropertyFlag.PROPATTR_READABLE);

      this._topLevelProperties.addProperty(PropertyTags.PR_STORE_UNICODE_MASK, StoreSupportMaskConst, PropertyFlag.PROPATTR_READABLE);

      this._topLevelProperties.addProperty(PropertyTags.PR_ALTERNATE_RECIPIENT_ALLOWED, true, PropertyFlag.PROPATTR_READABLE);

      this._topLevelProperties.addProperty(PropertyTags.PR_HASATTACH, attachmentCount > 0);

      if (this.transportMessageHeadersText) {
        this._topLevelProperties.addProperty(PropertyTags.PR_TRANSPORT_MESSAGE_HEADERS_W, this.transportMessageHeadersText);
      }

      const transportHeaders = this.transportMessageHeaders;

      if (transportHeaders) {
        if (!isNullOrWhiteSpace(transportHeaders.messageId)) {
          this._topLevelProperties.addProperty(PropertyTags.PR_INTERNET_MESSAGE_ID_W, transportHeaders.messageId);
        }

        const refCount = transportHeaders.references.length;

        if (refCount > 0) {
          this._topLevelProperties.addProperty(PropertyTags.PR_INTERNET_REFERENCES_W, transportHeaders.references[refCount - 1]);
        }

        const replCount = transportHeaders.inReplyTo.length;

        if (replCount > 0) {
          this._topLevelProperties.addProperty(PropertyTags.PR_IN_REPLY_TO_ID_W, transportHeaders.inReplyTo[replCount - 1]);
        }
      }

      if (!isNullOrWhiteSpace(this.internetMessageId)) {
        this._topLevelProperties.addOrReplaceProperty(PropertyTags.PR_INTERNET_MESSAGE_ID_W, this.internetMessageId);
      }

      if (!isNullOrWhiteSpace(this.internetReferences)) {
        this._topLevelProperties.addOrReplaceProperty(PropertyTags.PR_INTERNET_REFERENCES_W, this.internetReferences);
      }

      if (!isNullOrWhiteSpace(this.inReplyToId)) {
        this._topLevelProperties.addOrReplaceProperty(PropertyTags.PR_IN_REPLY_TO_ID_W, this.inReplyToId);
      }

      let messageFlags = MessageFlags.MSGFLAG_UNMODIFIED;
      if (attachmentCount > 0) messageFlags |= MessageFlags.MSGFLAG_HASATTACH; // int Encoding.UTF8.CodePage == 65001

      this._topLevelProperties.addProperty(PropertyTags.PR_INTERNET_CPID, 65001);

      this._topLevelProperties.addProperty(PropertyTags.PR_BODY_W, this._bodyText);

      if (!isNullOrEmpty(this._bodyHtml) && !this.draft) {
        this._topLevelProperties.addProperty(PropertyTags.PR_HTML, this._bodyHtml);

        this._topLevelProperties.addProperty(PropertyTags.PR_RTF_IN_SYNC, false);
      } else if (isNullOrWhiteSpace(this._bodyRtf) && !isNullOrWhiteSpace(this._bodyHtml)) {
        this._bodyRtf = Strings.escapeRtf(this._bodyHtml);
        this.bodyRtfCompressed = true;
      }

      if (!isNullOrWhiteSpace(this._bodyRtf)) {
        this._topLevelProperties.addProperty(PropertyTags.PR_RTF_COMPRESSED, compress(stringToUtf8Array(this._bodyRtf)));

        this._topLevelProperties.addProperty(PropertyTags.PR_RTF_IN_SYNC, this.bodyRtfCompressed);
      }

      if (this.messageEditorFormat !== MessageEditorFormat.EDITOR_FORMAT_DONTKNOW) {
        this._topLevelProperties.addProperty(PropertyTags.PR_MSG_EDITOR_FORMAT, this.messageEditorFormat);
      }

      if (this._sentOn == null) this._sentOn = new Date();

      if (this._receivedOn != null) {
        this._topLevelProperties.addProperty(PropertyTags.PR_MESSAGE_DELIVERY_TIME, dateToFileTime(this._receivedOn));
      } // was SentOn.Value.ToUniversalTime()


      this._topLevelProperties.addProperty(PropertyTags.PR_CLIENT_SUBMIT_TIME, dateToFileTime(this._sentOn));

      this._topLevelProperties.addProperty(PropertyTags.PR_ACCESS, MapiAccess.MAPI_ACCESS_DELETE | MapiAccess.MAPI_ACCESS_MODIFY | MapiAccess.MAPI_ACCESS_READ);

      this._topLevelProperties.addProperty(PropertyTags.PR_ACCESS_LEVEL, MapiAccess.MAPI_ACCESS_MODIFY);

      this._topLevelProperties.addProperty(PropertyTags.PR_OBJECT_TYPE, MapiObjectType.MAPI_MESSAGE);

      this._setSubject();

      this._topLevelProperties.addProperty(PropertyTags.PR_SUBJECT_W, this._subject);

      this._topLevelProperties.addProperty(PropertyTags.PR_NORMALIZED_SUBJECT_W, this._subjectNormalized);

      this._topLevelProperties.addProperty(PropertyTags.PR_SUBJECT_PREFIX_W, this.subjectPrefix);

      this._topLevelProperties.addProperty(PropertyTags.PR_CONVERSATION_TOPIC_W, this._subjectNormalized); // http://www.meridiandiscovery.com/how-to/e-mail-conversation-index-metadata-computer-forensics/
      // http://stackoverflow.com/questions/11860540/does-outlook-embed-a-messageid-or-equivalent-in-its-email-elements
      // propertiesStream.AddProperty(PropertyTags.PR_CONVERSATION_INDEX, Subject)
      // TODO: Change modification time when this message is opened and only modified


      const utcNow = Date.now();

      this._topLevelProperties.addProperty(PropertyTags.PR_CREATION_TIME, utcNow);

      this._topLevelProperties.addProperty(PropertyTags.PR_LAST_MODIFICATION_TIME, utcNow);

      this._topLevelProperties.addProperty(PropertyTags.PR_PRIORITY, this.priority);

      this._topLevelProperties.addProperty(PropertyTags.PR_IMPORTANCE, this.importance); // was CultureInfo.CurrentCulture.LCID


      this._topLevelProperties.addProperty(PropertyTags.PR_MESSAGE_LOCALE_ID, localeId());

      if (this.draft) {
        messageFlags |= MessageFlags.MSGFLAG_UNSENT;
        this.iconIndex = MessageIconIndex.UnsentMail;
      }

      if (this.readReceipt) {
        this._topLevelProperties.addProperty(PropertyTags.PR_READ_RECEIPT_REQUESTED, true);

        const reportTag = new ReportTag(this._subject);

        this._topLevelProperties.addProperty(PropertyTags.PR_REPORT_TAG, reportTag.toByteArray());
      }

      this._topLevelProperties.addProperty(PropertyTags.PR_MESSAGE_FLAGS, messageFlags);

      this._topLevelProperties.addProperty(PropertyTags.PR_ICON_INDEX, this.iconIndex);

      if (!!this._sender) this._sender.writeProperties(this._topLevelProperties);
      if (!!this._receiving) this._receiving.writeProperties(this._topLevelProperties);
      if (!!this._receivingRepresenting) this._receivingRepresenting.writeProperties(this._topLevelProperties);
      if (!!this._representing) this._representing.writeProperties(this._topLevelProperties);

      if (recipientCount > 0) {
        const displayTo = [];
        const displayCc = [];
        const displayBcc = [];

        for (const recipient of this.recipients) {
          switch (recipient.recipientType) {
            case RecipientType.To:
              if (!isNullOrWhiteSpace(recipient.displayName)) {
                displayTo.push(recipient.displayName);
              } else if (!isNullOrWhiteSpace(recipient.email)) {
                displayTo.push(recipient.email);
              }

              break;

            case RecipientType.Cc:
              if (!isNullOrWhiteSpace(recipient.displayName)) {
                displayCc.push(recipient.displayName);
              } else if (!isNullOrWhiteSpace(recipient.email)) {
                displayCc.push(recipient.email);
              }

              break;

            case RecipientType.Bcc:
              if (!isNullOrWhiteSpace(recipient.displayName)) {
                displayBcc.push(recipient.displayName);
              } else if (!isNullOrWhiteSpace(recipient.email)) {
                displayBcc.push(recipient.email);
              }

              break;

            default:
              throw new Error('RecipientType out of Range: ' + recipient.recipientType);
          }
        }

        const replyToRecipients = [];

        for (const recipient of this.replyToRecipients) {
          replyToRecipients.push(recipient.email);
        }

        this._topLevelProperties.addProperty(PropertyTags.PR_DISPLAY_TO_W, displayTo.join(';'), PropertyFlag.PROPATTR_READABLE);

        this._topLevelProperties.addProperty(PropertyTags.PR_DISPLAY_CC_W, displayCc.join(';'), PropertyFlag.PROPATTR_READABLE);

        this._topLevelProperties.addProperty(PropertyTags.PR_DISPLAY_BCC_W, displayBcc.join(';'), PropertyFlag.PROPATTR_READABLE);

        this._topLevelProperties.addProperty(PropertyTags.PR_REPLY_RECIPIENT_NAMES_W, replyToRecipients.join(';'), PropertyFlag.PROPATTR_READABLE);
      }
    }
  }]);

  return Email;
}(Message);

export { AttachmentType, cfb$1 as CFB, Email, MessageEditorFormat };
//# sourceMappingURL=oxmsg.js.map
