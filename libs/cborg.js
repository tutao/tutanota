// This is an unfortunate replacement for @sindresorhus/is that we need to
// re-implement for performance purposes. In particular the is.observable()
// check is expensive, and unnecessary for our purposes. The values returned
// are compatible with @sindresorhus/is, however.

const typeofs = [
  'string',
  'number',
  'bigint',
  'symbol'
];

const objectTypeNames = [
  'Function',
  'Generator',
  'AsyncGenerator',
  'GeneratorFunction',
  'AsyncGeneratorFunction',
  'AsyncFunction',
  'Observable',
  'Array',
  'Buffer',
  'Object',
  'RegExp',
  'Date',
  'Error',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView',
  'Promise',
  'URL',
  'HTMLElement',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array'
];

/**
 * @param {any} value
 * @returns {string}
 */
function is (value) {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'undefined'
  }
  if (value === true || value === false) {
    return 'boolean'
  }
  const typeOf = typeof value;
  if (typeofs.includes(typeOf)) {
    return typeOf
  }
  /* c8 ignore next 4 */
  // not going to bother testing this, it's not going to be valid anyway
  if (typeOf === 'function') {
    return 'Function'
  }
  if (Array.isArray(value)) {
    return 'Array'
  }
  if (isBuffer$1(value)) {
    return 'Buffer'
  }
  const objectType = getObjectType(value);
  if (objectType) {
    return objectType
  }
  /* c8 ignore next */
  return 'Object'
}

/**
 * @param {any} value
 * @returns {boolean}
 */
function isBuffer$1 (value) {
  return value && value.constructor && value.constructor.isBuffer && value.constructor.isBuffer.call(null, value)
}

/**
 * @param {any} value
 * @returns {string|undefined}
 */
function getObjectType (value) {
  const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
  if (objectTypeNames.includes(objectTypeName)) {
    return objectTypeName
  }
  /* c8 ignore next */
  return undefined
}

class Type {
  /**
   * @param {number} major
   * @param {string} name
   * @param {boolean} terminal
   */
  constructor (major, name, terminal) {
    this.major = major;
    this.majorEncoded = major << 5;
    this.name = name;
    this.terminal = terminal;
  }

  /* c8 ignore next 3 */
  toString () {
    return `Type[${this.major}].${this.name}`
  }

  /**
   * @param {Type} typ
   * @returns {number}
   */
  compare (typ) {
    /* c8 ignore next 1 */
    return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0
  }
}

// convert to static fields when better supported
Type.uint = new Type(0, 'uint', true);
Type.negint = new Type(1, 'negint', true);
Type.bytes = new Type(2, 'bytes', true);
Type.string = new Type(3, 'string', true);
Type.array = new Type(4, 'array', false);
Type.map = new Type(5, 'map', false);
Type.tag = new Type(6, 'tag', false); // terminal?
Type.float = new Type(7, 'float', true);
Type.false = new Type(7, 'false', true);
Type.true = new Type(7, 'true', true);
Type.null = new Type(7, 'null', true);
Type.undefined = new Type(7, 'undefined', true);
Type.break = new Type(7, 'break', true);
// Type.indefiniteLength = new Type(0, 'indefiniteLength', true)

class Token {
  /**
   * @param {Type} type
   * @param {any} [value]
   * @param {number} [encodedLength]
   */
  constructor (type, value, encodedLength) {
    this.type = type;
    this.value = value;
    this.encodedLength = encodedLength;
    /** @type {Uint8Array|undefined} */
    this.encodedBytes = undefined;
    /** @type {Uint8Array|undefined} */
    this.byteValue = undefined;
  }

  /* c8 ignore next 3 */
  toString () {
    return `Token[${this.type}].${this.value}`
  }
}

// Use Uint8Array directly in the browser, use Buffer in Node.js but don't
// speak its name directly to avoid bundlers pulling in the `Buffer` polyfill

// @ts-ignore
const useBuffer = globalThis.process &&
  // @ts-ignore
  !globalThis.process.browser &&
  // @ts-ignore
  globalThis.Buffer &&
  // @ts-ignore
  typeof globalThis.Buffer.isBuffer === 'function';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

/**
 * @param {Uint8Array} buf
 * @returns {boolean}
 */
function isBuffer (buf) {
  // @ts-ignore
  return useBuffer && globalThis.Buffer.isBuffer(buf)
}

/**
 * @param {Uint8Array|number[]} buf
 * @returns {Uint8Array}
 */
function asU8A (buf) {
  /* c8 ignore next */
  if (!(buf instanceof Uint8Array)) {
    return Uint8Array.from(buf)
  }
  return isBuffer(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf
}

const toString = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return end - start > 64
        ? // eslint-disable-line operator-linebreak
      // @ts-ignore
        globalThis.Buffer.from(bytes.subarray(start, end)).toString('utf8')
        : utf8Slice(bytes, start, end)
    }
  /* c8 ignore next 11 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return end - start > 64
        ? textDecoder.decode(bytes.subarray(start, end))
        : utf8Slice(bytes, start, end)
    };

const fromString = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string) => {
      return string.length > 64
        ? // eslint-disable-line operator-linebreak
      // @ts-ignore
        globalThis.Buffer.from(string)
        : utf8ToBytes(string)
    }
  /* c8 ignore next 7 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string) => {
      return string.length > 64 ? textEncoder.encode(string) : utf8ToBytes(string)
    };

/**
 * Buffer variant not fast enough for what we need
 * @param {number[]} arr
 * @returns {Uint8Array}
 */
const fromArray = (arr) => {
  return Uint8Array.from(arr)
};

const slice = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      if (isBuffer(bytes)) {
        return new Uint8Array(bytes.subarray(start, end))
      }
      return bytes.slice(start, end)
    }
  /* c8 ignore next 9 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return bytes.slice(start, end)
    };

const concat = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length) => {
      // might get a stray plain Array here
      /* c8 ignore next 1 */
      chunks = chunks.map((c) => c instanceof Uint8Array
        ? c
        // this case is occasionally missed during test runs so becomes coverage-flaky
        /* c8 ignore next 4 */
        : // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(c));
      // @ts-ignore
      return asU8A(globalThis.Buffer.concat(chunks, length))
    }
  /* c8 ignore next 19 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length) => {
      const out = new Uint8Array(length);
      let off = 0;
      for (let b of chunks) {
        if (off + b.length > out.length) {
          // final chunk that's bigger than we need
          b = b.subarray(0, out.length - off);
        }
        out.set(b, off);
        off += b.length;
      }
      return out
    };

const alloc = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      // we always write over the contents we expose so this should be safe
      // @ts-ignore
      return globalThis.Buffer.allocUnsafe(size)
    }
  /* c8 ignore next 8 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      return new Uint8Array(size)
    };

/**
 * @param {Uint8Array} b1
 * @param {Uint8Array} b2
 * @returns {number}
 */
function compare (b1, b2) {
  /* c8 ignore next 5 */
  if (isBuffer(b1) && isBuffer(b2)) {
    // probably not possible to get here in the current API
    // @ts-ignore Buffer
    return b1.compare(b2)
  }
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] === b2[i]) {
      continue
    }
    return b1[i] < b2[i] ? -1 : 1
  } /* c8 ignore next 3 */
  return 0
}

// The below code is taken from https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
// Licensed Apache-2.0.

/**
 * @param {string} str
 * @returns {number[]}
 */
function utf8ToBytes (str) {
  const out = [];
  let p = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
      ((c & 0xFC00) === 0xD800) && (i + 1) < str.length &&
      ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
  }
  return out
}

// The below code is mostly taken from https://github.com/feross/buffer
// Licensed MIT. Copyright (c) Feross Aboukhadijeh

/**
 * @param {Uint8Array} buf
 * @param {number} offset
 * @param {number} end
 * @returns {string}
 */
function utf8Slice (buf, offset, end) {
  const res = [];

  while (offset < end) {
    const firstByte = buf[offset];
    let codePoint = null;
    let bytesPerSequence = (firstByte > 0xef) ? 4 : (firstByte > 0xdf) ? 3 : (firstByte > 0xbf) ? 2 : 1;

    if (offset + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[offset + 1];
          if ((secondByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0x1f) << 0x6 | (secondByte & 0x3f);
            if (tempCodePoint > 0x7f) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[offset + 1];
          thirdByte = buf[offset + 2];
          if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0xf) << 0xc | (secondByte & 0x3f) << 0x6 | (thirdByte & 0x3f);
            /* c8 ignore next 3 */
            if (tempCodePoint > 0x7ff && (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[offset + 1];
          thirdByte = buf[offset + 2];
          fourthByte = buf[offset + 3];
          if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80 && (fourthByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0xf) << 0x12 | (secondByte & 0x3f) << 0xc | (thirdByte & 0x3f) << 0x6 | (fourthByte & 0x3f);
            if (tempCodePoint > 0xffff && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    /* c8 ignore next 5 */
    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xfffd;
      bytesPerSequence = 1;
    } else if (codePoint > 0xffff) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3ff | 0xd800);
      codePoint = 0xdc00 | codePoint & 0x3ff;
    }

    res.push(codePoint);
    offset += bytesPerSequence;
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000;

/**
 * @param {number[]} codePoints
 * @returns {string}
 */
function decodeCodePointsArray (codePoints) {
  const len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }
  /* c8 ignore next 10 */
  // Decode in chunks to avoid "call stack size exceeded".
  let res = '';
  let i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res
}

/**
 * Bl is a list of byte chunks, similar to https://github.com/rvagg/bl but for
 * writing rather than reading.
 * A Bl object accepts set() operations for individual bytes and copyTo() for
 * inserting byte arrays. These write operations don't automatically increment
 * the internal cursor so its "length" won't be changed. Instead, increment()
 * must be called to extend its length to cover the inserted data.
 * The toBytes() call will convert all internal memory to a single Uint8Array of
 * the correct length, truncating any data that is stored but hasn't been
 * included by an increment().
 * get() can retrieve a single byte.
 * All operations (except toBytes()) take an "offset" argument that will perform
 * the write at the offset _from the current cursor_. For most operations this
 * will be `0` to write at the current cursor position but it can be ahead of
 * the current cursor. Negative offsets probably work but are untested.
 */


// the ts-ignores in this file are almost all for the `Uint8Array|number[]` duality that exists
// for perf reasons. Consider better approaches to this or removing it entirely, it is quite
// risky because of some assumptions about small chunks === number[] and everything else === Uint8Array.

const defaultChunkSize = 256;

class Bl {
  /**
   * @param {number} [chunkSize]
   */
  constructor (chunkSize = defaultChunkSize) {
    this.chunkSize = chunkSize;
    /** @type {number} */
    this.cursor = 0;
    /** @type {number} */
    this.maxCursor = -1;
    /** @type {(Uint8Array|number[])[]} */
    this.chunks = [];
    // keep the first chunk around if we can to save allocations for future encodes
    /** @type {Uint8Array|number[]|null} */
    this._initReuseChunk = null;
  }

  reset () {
    this.cursor = 0;
    this.maxCursor = -1;
    if (this.chunks.length) {
      this.chunks = [];
    }
    if (this._initReuseChunk !== null) {
      this.chunks.push(this._initReuseChunk);
      this.maxCursor = this._initReuseChunk.length - 1;
    }
  }

  /**
   * @param {Uint8Array|number[]} bytes
   */
  push (bytes) {
    let topChunk = this.chunks[this.chunks.length - 1];
    const newMax = this.cursor + bytes.length;
    if (newMax <= this.maxCursor + 1) {
      // we have at least one chunk and we can fit these bytes into that chunk
      const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
      // @ts-ignore
      topChunk.set(bytes, chunkPos);
    } else {
      // can't fit it in
      if (topChunk) {
        // trip the last chunk to `cursor` if we need to
        const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
        if (chunkPos < topChunk.length) {
          // @ts-ignore
          this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos);
          this.maxCursor = this.cursor - 1;
        }
      }
      if (bytes.length < 64 && bytes.length < this.chunkSize) {
        // make a new chunk and copy the new one into it
        topChunk = alloc(this.chunkSize);
        this.chunks.push(topChunk);
        this.maxCursor += topChunk.length;
        if (this._initReuseChunk === null) {
          this._initReuseChunk = topChunk;
        }
        // @ts-ignore
        topChunk.set(bytes, 0);
      } else {
        // push the new bytes in as its own chunk
        this.chunks.push(bytes);
        this.maxCursor += bytes.length;
      }
    }
    this.cursor += bytes.length;
  }

  /**
   * @param {boolean} [reset]
   * @returns {Uint8Array}
   */
  toBytes (reset = false) {
    let byts;
    if (this.chunks.length === 1) {
      const chunk = this.chunks[0];
      if (reset && this.cursor > chunk.length / 2) {
        /* c8 ignore next 2 */
        // @ts-ignore
        byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor);
        this._initReuseChunk = null;
        this.chunks = [];
      } else {
        // @ts-ignore
        byts = slice(chunk, 0, this.cursor);
      }
    } else {
      // @ts-ignore
      byts = concat(this.chunks, this.cursor);
    }
    if (reset) {
      this.reset();
    }
    return byts
  }
}

const decodeErrPrefix = 'CBOR decode error:';
const encodeErrPrefix = 'CBOR encode error:';

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} need
 */
function assertEnoughData (data, pos, need) {
  if (data.length - pos < need) {
    throw new Error(`${decodeErrPrefix} not enough data for type`)
  }
}

/* globals BigInt */


const uintBoundaries = [24, 256, 65536, 4294967296, BigInt('18446744073709551616')];

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
function readUint8 (data, offset, options) {
  assertEnoughData(data, offset, 1);
  const value = data[offset];
  if (options.strict === true && value < uintBoundaries[0]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  return value
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
function readUint16 (data, offset, options) {
  assertEnoughData(data, offset, 2);
  const value = (data[offset] << 8) | data[offset + 1];
  if (options.strict === true && value < uintBoundaries[1]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  return value
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
function readUint32 (data, offset, options) {
  assertEnoughData(data, offset, 4);
  const value = (data[offset] * 16777216 /* 2 ** 24 */) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
  if (options.strict === true && value < uintBoundaries[2]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  return value
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number|bigint}
 */
function readUint64 (data, offset, options) {
  // assume BigInt, convert back to Number if within safe range
  assertEnoughData(data, offset, 8);
  const hi = (data[offset] * 16777216 /* 2 ** 24 */) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
  const lo = (data[offset + 4] * 16777216 /* 2 ** 24 */) + (data[offset + 5] << 16) + (data[offset + 6] << 8) + data[offset + 7];
  const value = (BigInt(hi) << BigInt(32)) + BigInt(lo);
  if (options.strict === true && value < uintBoundaries[3]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  if (value <= Number.MAX_SAFE_INTEGER) {
    return Number(value)
  }
  if (options.allowBigInt === true) {
    return value
  }
  throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`)
}

/* not required thanks to quick[] list
const oneByteTokens = new Array(24).fill(0).map((v, i) => new Token(Type.uint, i, 1))
export function decodeUintCompact (data, pos, minor, options) {
  return oneByteTokens[minor]
}
*/

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint8 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint16 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint32 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint32(data, pos + 1, options), 5)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint64 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint64(data, pos + 1, options), 9)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
function encodeUint (buf, token) {
  return encodeUintValue(buf, 0, token.value)
}

/**
 * @param {Bl} buf
 * @param {number} major
 * @param {number|bigint} uint
 */
function encodeUintValue (buf, major, uint) {
  if (uint < uintBoundaries[0]) {
    const nuint = Number(uint);
    // pack into one byte, minor=0, additional=value
    buf.push([major | nuint]);
  } else if (uint < uintBoundaries[1]) {
    const nuint = Number(uint);
    // pack into two byte, minor=0, additional=24
    buf.push([major | 24, nuint]);
  } else if (uint < uintBoundaries[2]) {
    const nuint = Number(uint);
    // pack into three byte, minor=0, additional=25
    buf.push([major | 25, nuint >>> 8, nuint & 0xff]);
  } else if (uint < uintBoundaries[3]) {
    const nuint = Number(uint);
    // pack into five byte, minor=0, additional=26
    buf.push([major | 26, (nuint >>> 24) & 0xff, (nuint >>> 16) & 0xff, (nuint >>> 8) & 0xff, nuint & 0xff]);
  } else {
    const buint = BigInt(uint);
    if (buint < uintBoundaries[4]) {
      // pack into nine byte, minor=0, additional=27
      const set = [major | 27, 0, 0, 0, 0, 0, 0, 0];
      // simulate bitwise above 32 bits
      let lo = Number(buint & BigInt(0xffffffff));
      let hi = Number(buint >> BigInt(32) & BigInt(0xffffffff));
      set[8] = lo & 0xff;
      lo = lo >> 8;
      set[7] = lo & 0xff;
      lo = lo >> 8;
      set[6] = lo & 0xff;
      lo = lo >> 8;
      set[5] = lo & 0xff;
      set[4] = hi & 0xff;
      hi = hi >> 8;
      set[3] = hi & 0xff;
      hi = hi >> 8;
      set[2] = hi & 0xff;
      hi = hi >> 8;
      set[1] = hi & 0xff;
      buf.push(set);
    } else {
      throw new Error(`${decodeErrPrefix} encountered BigInt larger than allowable range`)
    }
  }
}

/**
 * @param {Token} token
 * @returns {number}
 */
encodeUint.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

/**
 * @param {number} uint
 * @returns {number}
 */
encodeUintValue.encodedSize = function encodedSize (uint) {
  if (uint < uintBoundaries[0]) {
    return 1
  }
  if (uint < uintBoundaries[1]) {
    return 2
  }
  if (uint < uintBoundaries[2]) {
    return 3
  }
  if (uint < uintBoundaries[3]) {
    return 5
  }
  return 9
};

/**
 * @param {Token} tok1
 * @param {Token} tok2
 * @returns {number}
 */
encodeUint.compareTokens = function compareTokens (tok1, tok2) {
  return tok1.value < tok2.value ? -1 : tok1.value > tok2.value ? 1 : /* c8 ignore next */ 0
};

/* eslint-env es2020 */


/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint8 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint16 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint32 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint32(data, pos + 1, options), 5)
}

const neg1b = BigInt(-1);
const pos1b = BigInt(1);

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint64 (data, pos, _minor, options) {
  const int = readUint64(data, pos + 1, options);
  if (typeof int !== 'bigint') {
    const value = -1 - int;
    if (value >= Number.MIN_SAFE_INTEGER) {
      return new Token(Type.negint, value, 9)
    }
  }
  if (options.allowBigInt !== true) {
    throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`)
  }
  return new Token(Type.negint, neg1b - BigInt(int), 9)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
function encodeNegint (buf, token) {
  const negint = token.value;
  const unsigned = (typeof negint === 'bigint' ? (negint * neg1b - pos1b) : (negint * -1 - 1));
  encodeUintValue(buf, token.type.majorEncoded, unsigned);
}

/**
 * @param {Token} token
 * @returns {number}
 */
encodeNegint.encodedSize = function encodedSize (token) {
  const negint = token.value;
  const unsigned = (typeof negint === 'bigint' ? (negint * neg1b - pos1b) : (negint * -1 - 1));
  /* c8 ignore next 4 */
  // handled by quickEncode, we shouldn't get here but it's included for completeness
  if (unsigned < uintBoundaries[0]) {
    return 1
  }
  if (unsigned < uintBoundaries[1]) {
    return 2
  }
  if (unsigned < uintBoundaries[2]) {
    return 3
  }
  if (unsigned < uintBoundaries[3]) {
    return 5
  }
  return 9
};

/**
 * @param {Token} tok1
 * @param {Token} tok2
 * @returns {number}
 */
encodeNegint.compareTokens = function compareTokens (tok1, tok2) {
  // opposite of the uint comparison since we store the uint version in bytes
  return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : /* c8 ignore next */ 0
};

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} prefix
 * @param {number} length
 * @returns {Token}
 */
function toToken$3 (data, pos, prefix, length) {
  assertEnoughData(data, pos, prefix + length);
  const buf = slice(data, pos + prefix, pos + prefix + length);
  return new Token(Type.bytes, buf, prefix + length)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeBytesCompact (data, pos, minor, _options) {
  return toToken$3(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes8 (data, pos, _minor, options) {
  return toToken$3(data, pos, 2, readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes16 (data, pos, _minor, options) {
  return toToken$3(data, pos, 3, readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes32 (data, pos, _minor, options) {
  return toToken$3(data, pos, 5, readUint32(data, pos + 1, options))
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer bytes lengths not supported`)
  }
  return toToken$3(data, pos, 9, l)
}

/**
 * `encodedBytes` allows for caching when we do a byte version of a string
 * for key sorting purposes
 * @param {Token} token
 * @returns {Uint8Array}
 */
function tokenBytes (token) {
  if (token.encodedBytes === undefined) {
    token.encodedBytes = token.type === Type.string ? fromString(token.value) : token.value;
  }
  // @ts-ignore c'mon
  return token.encodedBytes
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
function encodeBytes (buf, token) {
  const bytes = tokenBytes(token);
  encodeUintValue(buf, token.type.majorEncoded, bytes.length);
  buf.push(bytes);
}

/**
 * @param {Token} token
 * @returns {number}
 */
encodeBytes.encodedSize = function encodedSize (token) {
  const bytes = tokenBytes(token);
  return encodeUintValue.encodedSize(bytes.length) + bytes.length
};

/**
 * @param {Token} tok1
 * @param {Token} tok2
 * @returns {number}
 */
encodeBytes.compareTokens = function compareTokens (tok1, tok2) {
  return compareBytes(tokenBytes(tok1), tokenBytes(tok2))
};

/**
 * @param {Uint8Array} b1
 * @param {Uint8Array} b2
 * @returns {number}
 */
function compareBytes (b1, b2) {
  return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare(b1, b2)
}

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} prefix
 * @param {number} length
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function toToken$2 (data, pos, prefix, length, options) {
  const totLength = prefix + length;
  assertEnoughData(data, pos, totLength);
  const tok = new Token(Type.string, toString(data, pos + prefix, pos + totLength), totLength);
  if (options.retainStringBytes === true) {
    tok.byteValue = slice(data, pos + prefix, pos + totLength);
  }
  return tok
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeStringCompact (data, pos, minor, options) {
  return toToken$2(data, pos, 1, minor, options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString8 (data, pos, _minor, options) {
  return toToken$2(data, pos, 2, readUint8(data, pos + 1, options), options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString16 (data, pos, _minor, options) {
  return toToken$2(data, pos, 3, readUint16(data, pos + 1, options), options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString32 (data, pos, _minor, options) {
  return toToken$2(data, pos, 5, readUint32(data, pos + 1, options), options)
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer string lengths not supported`)
  }
  return toToken$2(data, pos, 9, l, options)
}

const encodeString = encodeBytes;

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} prefix
 * @param {number} length
 * @returns {Token}
 */
function toToken$1 (_data, _pos, prefix, length) {
  return new Token(Type.array, length, prefix)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeArrayCompact (data, pos, minor, _options) {
  return toToken$1(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray8 (data, pos, _minor, options) {
  return toToken$1(data, pos, 2, readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray16 (data, pos, _minor, options) {
  return toToken$1(data, pos, 3, readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray32 (data, pos, _minor, options) {
  return toToken$1(data, pos, 5, readUint32(data, pos + 1, options))
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer array lengths not supported`)
  }
  return toToken$1(data, pos, 9, l)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArrayIndefinite (data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${decodeErrPrefix} indefinite length items not allowed`)
  }
  return toToken$1(data, pos, 1, Infinity)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
function encodeArray (buf, token) {
  encodeUintValue(buf, Type.array.majorEncoded, token.value);
}

// using an array as a map key, are you sure about this? we can only sort
// by map length here, it's up to the encoder to decide to look deeper
encodeArray.compareTokens = encodeUint.compareTokens;

/**
 * @param {Token} token
 * @returns {number}
 */
encodeArray.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} prefix
 * @param {number} length
 * @returns {Token}
 */
function toToken (_data, _pos, prefix, length) {
  return new Token(Type.map, length, prefix)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeMapCompact (data, pos, minor, _options) {
  return toToken(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap8 (data, pos, _minor, options) {
  return toToken(data, pos, 2, readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap16 (data, pos, _minor, options) {
  return toToken(data, pos, 3, readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap32 (data, pos, _minor, options) {
  return toToken(data, pos, 5, readUint32(data, pos + 1, options))
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer map lengths not supported`)
  }
  return toToken(data, pos, 9, l)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMapIndefinite (data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${decodeErrPrefix} indefinite length items not allowed`)
  }
  return toToken(data, pos, 1, Infinity)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
function encodeMap (buf, token) {
  encodeUintValue(buf, Type.map.majorEncoded, token.value);
}

// using a map as a map key, are you sure about this? we can only sort
// by map length here, it's up to the encoder to decide to look deeper
encodeMap.compareTokens = encodeUint.compareTokens;

/**
 * @param {Token} token
 * @returns {number}
 */
encodeMap.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeTagCompact (_data, _pos, minor, _options) {
  return new Token(Type.tag, minor, 1)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag8 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag16 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag32 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint32(data, pos + 1, options), 5)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag64 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint64(data, pos + 1, options), 9)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 */
function encodeTag (buf, token) {
  encodeUintValue(buf, Type.tag.majorEncoded, token.value);
}

encodeTag.compareTokens = encodeUint.compareTokens;

/**
 * @param {Token} token
 * @returns {number}
 */
encodeTag.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

// TODO: shift some of the bytes logic to bytes-utils so we can use Buffer
// where possible


/**
 * @typedef {import('./bl.js').Bl} Bl
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 * @typedef {import('../interface').EncodeOptions} EncodeOptions
 */

const MINOR_FALSE = 20;
const MINOR_TRUE = 21;
const MINOR_NULL = 22;
const MINOR_UNDEFINED = 23;

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUndefined (_data, _pos, _minor, options) {
  if (options.allowUndefined === false) {
    throw new Error(`${decodeErrPrefix} undefined values are not supported`)
  } else if (options.coerceUndefinedToNull === true) {
    return new Token(Type.null, null, 1)
  }
  return new Token(Type.undefined, undefined, 1)
}

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBreak (_data, _pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${decodeErrPrefix} indefinite length items not allowed`)
  }
  return new Token(Type.break, undefined, 1)
}

/**
 * @param {number} value
 * @param {number} bytes
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function createToken (value, bytes, options) {
  if (options) {
    if (options.allowNaN === false && Number.isNaN(value)) {
      throw new Error(`${decodeErrPrefix} NaN values are not supported`)
    }
    if (options.allowInfinity === false && (value === Infinity || value === -Infinity)) {
      throw new Error(`${decodeErrPrefix} Infinity values are not supported`)
    }
  }
  return new Token(Type.float, value, bytes)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeFloat16 (data, pos, _minor, options) {
  return createToken(readFloat16(data, pos + 1), 3, options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeFloat32 (data, pos, _minor, options) {
  return createToken(readFloat32(data, pos + 1), 5, options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeFloat64 (data, pos, _minor, options) {
  return createToken(readFloat64(data, pos + 1), 9, options)
}

/**
 * @param {Bl} buf
 * @param {Token} token
 * @param {EncodeOptions} options
 */
function encodeFloat (buf, token, options) {
  const float = token.value;

  if (float === false) {
    buf.push([Type.float.majorEncoded | MINOR_FALSE]);
  } else if (float === true) {
    buf.push([Type.float.majorEncoded | MINOR_TRUE]);
  } else if (float === null) {
    buf.push([Type.float.majorEncoded | MINOR_NULL]);
  } else if (float === undefined) {
    buf.push([Type.float.majorEncoded | MINOR_UNDEFINED]);
  } else {
    let decoded;
    let success = false;
    if (!options || options.float64 !== true) {
      encodeFloat16(float);
      decoded = readFloat16(ui8a, 1);
      if (float === decoded || Number.isNaN(float)) {
        ui8a[0] = 0xf9;
        buf.push(ui8a.slice(0, 3));
        success = true;
      } else {
        encodeFloat32(float);
        decoded = readFloat32(ui8a, 1);
        if (float === decoded) {
          ui8a[0] = 0xfa;
          buf.push(ui8a.slice(0, 5));
          success = true;
        }
      }
    }
    if (!success) {
      encodeFloat64(float);
      decoded = readFloat64(ui8a, 1);
      ui8a[0] = 0xfb;
      buf.push(ui8a.slice(0, 9));
    }
  }
}

/**
 * @param {Token} token
 * @param {EncodeOptions} options
 * @returns {number}
 */
encodeFloat.encodedSize = function encodedSize (token, options) {
  const float = token.value;

  if (float === false || float === true || float === null || float === undefined) {
    return 1
  }

  if (!options || options.float64 !== true) {
    encodeFloat16(float);
    let decoded = readFloat16(ui8a, 1);
    if (float === decoded || Number.isNaN(float)) {
      return 3
    }
    encodeFloat32(float);
    decoded = readFloat32(ui8a, 1);
    if (float === decoded) {
      return 5
    }
  }
  return 9
};

const buffer = new ArrayBuffer(9);
const dataView = new DataView(buffer, 1);
const ui8a = new Uint8Array(buffer, 0);

/**
 * @param {number} inp
 */
function encodeFloat16 (inp) {
  if (inp === Infinity) {
    dataView.setUint16(0, 0x7c00, false);
  } else if (inp === -Infinity) {
    dataView.setUint16(0, 0xfc00, false);
  } else if (Number.isNaN(inp)) {
    dataView.setUint16(0, 0x7e00, false);
  } else {
    dataView.setFloat32(0, inp);
    const valu32 = dataView.getUint32(0);
    const exponent = (valu32 & 0x7f800000) >> 23;
    const mantissa = valu32 & 0x7fffff;

    /* c8 ignore next 6 */
    if (exponent === 0xff) {
      // too big, Infinity, but this should be hard (impossible?) to trigger
      dataView.setUint16(0, 0x7c00, false);
    } else if (exponent === 0x00) {
      // 0.0, -0.0 and subnormals, shouldn't be possible to get here because 0.0 should be counted as an int
      dataView.setUint16(0, ((inp & 0x80000000) >> 16) | (mantissa >> 13), false);
    } else { // standard numbers
      // chunks of logic here borrowed from https://github.com/PJK/libcbor/blob/c78f437182533e3efa8d963ff4b945bb635c2284/src/cbor/encoding.c#L127
      const logicalExponent = exponent - 127;
      // Now we know that 2^exponent <= 0 logically
      /* c8 ignore next 6 */
      if (logicalExponent < -24) {
        /* No unambiguous representation exists, this float is not a half float
          and is too small to be represented using a half, round off to zero.
          Consistent with the reference implementation. */
        // should be difficult (impossible?) to get here in JS
        dataView.setUint16(0, 0);
      } else if (logicalExponent < -14) {
        /* Offset the remaining decimal places by shifting the significand, the
          value is lost. This is an implementation decision that works around the
          absence of standard half-float in the language. */
        dataView.setUint16(0, ((valu32 & 0x80000000) >> 16) | /* sign bit */ (1 << (24 + logicalExponent)), false);
      } else {
        dataView.setUint16(0, ((valu32 & 0x80000000) >> 16) | ((logicalExponent + 15) << 10) | (mantissa >> 13), false);
      }
    }
  }
}

/**
 * @param {Uint8Array} ui8a
 * @param {number} pos
 * @returns {number}
 */
function readFloat16 (ui8a, pos) {
  if (ui8a.length - pos < 2) {
    throw new Error(`${decodeErrPrefix} not enough data for float16`)
  }

  const half = (ui8a[pos] << 8) + ui8a[pos + 1];
  if (half === 0x7c00) {
    return Infinity
  }
  if (half === 0xfc00) {
    return -Infinity
  }
  if (half === 0x7e00) {
    return NaN
  }
  const exp = (half >> 10) & 0x1f;
  const mant = half & 0x3ff;
  let val;
  if (exp === 0) {
    val = mant * (2 ** -24);
  } else if (exp !== 31) {
    val = (mant + 1024) * (2 ** (exp - 25));
  /* c8 ignore next 4 */
  } else {
    // may not be possible to get here
    val = mant === 0 ? Infinity : NaN;
  }
  return (half & 0x8000) ? -val : val
}

/**
 * @param {number} inp
 */
function encodeFloat32 (inp) {
  dataView.setFloat32(0, inp, false);
}

/**
 * @param {Uint8Array} ui8a
 * @param {number} pos
 * @returns {number}
 */
function readFloat32 (ui8a, pos) {
  if (ui8a.length - pos < 4) {
    throw new Error(`${decodeErrPrefix} not enough data for float32`)
  }
  const offset = (ui8a.byteOffset || 0) + pos;
  return new DataView(ui8a.buffer, offset, 4).getFloat32(0, false)
}

/**
 * @param {number} inp
 */
function encodeFloat64 (inp) {
  dataView.setFloat64(0, inp, false);
}

/**
 * @param {Uint8Array} ui8a
 * @param {number} pos
 * @returns {number}
 */
function readFloat64 (ui8a, pos) {
  if (ui8a.length - pos < 8) {
    throw new Error(`${decodeErrPrefix} not enough data for float64`)
  }
  const offset = (ui8a.byteOffset || 0) + pos;
  return new DataView(ui8a.buffer, offset, 8).getFloat64(0, false)
}

/**
 * @param {Token} _tok1
 * @param {Token} _tok2
 * @returns {number}
 */
encodeFloat.compareTokens = encodeUint.compareTokens;
/*
encodeFloat.compareTokens = function compareTokens (_tok1, _tok2) {
  return _tok1
  throw new Error(`${encodeErrPrefix} cannot use floats as map keys`)
}
*/

/**
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 */
function invalidMinor (data, pos, minor) {
  throw new Error(`${decodeErrPrefix} encountered invalid minor (${minor}) for major ${data[pos] >>> 5}`)
}

/**
 * @param {string} msg
 * @returns {()=>any}
 */
function errorer (msg) {
  return () => { throw new Error(`${decodeErrPrefix} ${msg}`) }
}

/** @type {((data:Uint8Array, pos:number, minor:number, options?:DecodeOptions) => any)[]} */
const jump = [];

// unsigned integer, 0x00..0x17 (0..23)
for (let i = 0; i <= 0x17; i++) {
  jump[i] = invalidMinor; // uint.decodeUintCompact, handled by quick[]
}
jump[0x18] = decodeUint8; // unsigned integer, one-byte uint8_t follows
jump[0x19] = decodeUint16; // unsigned integer, two-byte uint16_t follows
jump[0x1a] = decodeUint32; // unsigned integer, four-byte uint32_t follows
jump[0x1b] = decodeUint64; // unsigned integer, eight-byte uint64_t follows
jump[0x1c] = invalidMinor;
jump[0x1d] = invalidMinor;
jump[0x1e] = invalidMinor;
jump[0x1f] = invalidMinor;
// negative integer, -1-0x00..-1-0x17 (-1..-24)
for (let i = 0x20; i <= 0x37; i++) {
  jump[i] = invalidMinor; // negintDecode, handled by quick[]
}
jump[0x38] = decodeNegint8; // negative integer, -1-n one-byte uint8_t for n follows
jump[0x39] = decodeNegint16; // negative integer, -1-n two-byte uint16_t for n follows
jump[0x3a] = decodeNegint32; // negative integer, -1-n four-byte uint32_t for follows
jump[0x3b] = decodeNegint64; // negative integer, -1-n eight-byte uint64_t for follows
jump[0x3c] = invalidMinor;
jump[0x3d] = invalidMinor;
jump[0x3e] = invalidMinor;
jump[0x3f] = invalidMinor;
// byte string, 0x00..0x17 bytes follow
for (let i = 0x40; i <= 0x57; i++) {
  jump[i] = decodeBytesCompact;
}
jump[0x58] = decodeBytes8; // byte string, one-byte uint8_t for n, and then n bytes follow
jump[0x59] = decodeBytes16; // byte string, two-byte uint16_t for n, and then n bytes follow
jump[0x5a] = decodeBytes32; // byte string, four-byte uint32_t for n, and then n bytes follow
jump[0x5b] = decodeBytes64; // byte string, eight-byte uint64_t for n, and then n bytes follow
jump[0x5c] = invalidMinor;
jump[0x5d] = invalidMinor;
jump[0x5e] = invalidMinor;
jump[0x5f] = errorer('indefinite length bytes/strings are not supported'); // byte string, byte strings follow, terminated by "break"
// UTF-8 string 0x00..0x17 bytes follow
for (let i = 0x60; i <= 0x77; i++) {
  jump[i] = decodeStringCompact;
}
jump[0x78] = decodeString8; // UTF-8 string, one-byte uint8_t for n, and then n bytes follow
jump[0x79] = decodeString16; // UTF-8 string, two-byte uint16_t for n, and then n bytes follow
jump[0x7a] = decodeString32; // UTF-8 string, four-byte uint32_t for n, and then n bytes follow
jump[0x7b] = decodeString64; // UTF-8 string, eight-byte uint64_t for n, and then n bytes follow
jump[0x7c] = invalidMinor;
jump[0x7d] = invalidMinor;
jump[0x7e] = invalidMinor;
jump[0x7f] = errorer('indefinite length bytes/strings are not supported'); // UTF-8 strings follow, terminated by "break"
// array, 0x00..0x17 data items follow
for (let i = 0x80; i <= 0x97; i++) {
  jump[i] = decodeArrayCompact;
}
jump[0x98] = decodeArray8; // array, one-byte uint8_t for n, and then n data items follow
jump[0x99] = decodeArray16; // array, two-byte uint16_t for n, and then n data items follow
jump[0x9a] = decodeArray32; // array, four-byte uint32_t for n, and then n data items follow
jump[0x9b] = decodeArray64; // array, eight-byte uint64_t for n, and then n data items follow
jump[0x9c] = invalidMinor;
jump[0x9d] = invalidMinor;
jump[0x9e] = invalidMinor;
jump[0x9f] = decodeArrayIndefinite; // array, data items follow, terminated by "break"
// map, 0x00..0x17 pairs of data items follow
for (let i = 0xa0; i <= 0xb7; i++) {
  jump[i] = decodeMapCompact;
}
jump[0xb8] = decodeMap8; // map, one-byte uint8_t for n, and then n pairs of data items follow
jump[0xb9] = decodeMap16; // map, two-byte uint16_t for n, and then n pairs of data items follow
jump[0xba] = decodeMap32; // map, four-byte uint32_t for n, and then n pairs of data items follow
jump[0xbb] = decodeMap64; // map, eight-byte uint64_t for n, and then n pairs of data items follow
jump[0xbc] = invalidMinor;
jump[0xbd] = invalidMinor;
jump[0xbe] = invalidMinor;
jump[0xbf] = decodeMapIndefinite; // map, pairs of data items follow, terminated by "break"
// tags
for (let i = 0xc0; i <= 0xd7; i++) {
  jump[i] = decodeTagCompact;
}
jump[0xd8] = decodeTag8;
jump[0xd9] = decodeTag16;
jump[0xda] = decodeTag32;
jump[0xdb] = decodeTag64;
jump[0xdc] = invalidMinor;
jump[0xdd] = invalidMinor;
jump[0xde] = invalidMinor;
jump[0xdf] = invalidMinor;
// 0xe0..0xf3 simple values, unsupported
for (let i = 0xe0; i <= 0xf3; i++) {
  jump[i] = errorer('simple values are not supported');
}
jump[0xf4] = invalidMinor; // false, handled by quick[]
jump[0xf5] = invalidMinor; // true, handled by quick[]
jump[0xf6] = invalidMinor; // null, handled by quick[]
jump[0xf7] = decodeUndefined; // undefined
jump[0xf8] = errorer('simple values are not supported'); // simple value, one byte follows, unsupported
jump[0xf9] = decodeFloat16; // half-precision float (two-byte IEEE 754)
jump[0xfa] = decodeFloat32; // single-precision float (four-byte IEEE 754)
jump[0xfb] = decodeFloat64; // double-precision float (eight-byte IEEE 754)
jump[0xfc] = invalidMinor;
jump[0xfd] = invalidMinor;
jump[0xfe] = invalidMinor;
jump[0xff] = decodeBreak; // "break" stop code

/** @type {Token[]} */
const quick = [];
// ints <24
for (let i = 0; i < 24; i++) {
  quick[i] = new Token(Type.uint, i, 1);
}
// negints >= -24
for (let i = -1; i >= -24; i--) {
  quick[31 - i] = new Token(Type.negint, i, 1);
}
// empty bytes
quick[0x40] = new Token(Type.bytes, new Uint8Array(0), 1);
// empty string
quick[0x60] = new Token(Type.string, '', 1);
// empty list
quick[0x80] = new Token(Type.array, 0, 1);
// empty map
quick[0xa0] = new Token(Type.map, 0, 1);
// false
quick[0xf4] = new Token(Type.false, false, 1);
// true
quick[0xf5] = new Token(Type.true, true, 1);
// null
quick[0xf6] = new Token(Type.null, null, 1);

/**
 * @param {Token} token
 * @returns {Uint8Array|undefined}
 */
function quickEncodeToken (token) {
  switch (token.type) {
    case Type.false:
      return fromArray([0xf4])
    case Type.true:
      return fromArray([0xf5])
    case Type.null:
      return fromArray([0xf6])
    case Type.bytes:
      if (!token.value.length) {
        return fromArray([0x40])
      }
      return
    case Type.string:
      if (token.value === '') {
        return fromArray([0x60])
      }
      return
    case Type.array:
      if (token.value === 0) {
        return fromArray([0x80])
      }
      /* c8 ignore next 2 */
      // shouldn't be possible if this were called when there was only one token
      return
    case Type.map:
      if (token.value === 0) {
        return fromArray([0xa0])
      }
      /* c8 ignore next 2 */
      // shouldn't be possible if this were called when there was only one token
      return
    case Type.uint:
      if (token.value < 24) {
        return fromArray([Number(token.value)])
      }
      return
    case Type.negint:
      if (token.value >= -24) {
        return fromArray([31 - Number(token.value)])
      }
  }
}

/**
 * @typedef {import('../interface').EncodeOptions} EncodeOptions
 * @typedef {import('../interface').OptionalTypeEncoder} OptionalTypeEncoder
 * @typedef {import('../interface').Reference} Reference
 * @typedef {import('../interface').StrictTypeEncoder} StrictTypeEncoder
 * @typedef {import('../interface').TokenTypeEncoder} TokenTypeEncoder
 * @typedef {import('../interface').TokenOrNestedTokens} TokenOrNestedTokens
 */

/** @type {EncodeOptions} */
const defaultEncodeOptions = {
  float64: false,
  mapSorter,
  quickEncodeToken
};

/** @returns {TokenTypeEncoder[]} */
function makeCborEncoders () {
  const encoders = [];
  encoders[Type.uint.major] = encodeUint;
  encoders[Type.negint.major] = encodeNegint;
  encoders[Type.bytes.major] = encodeBytes;
  encoders[Type.string.major] = encodeString;
  encoders[Type.array.major] = encodeArray;
  encoders[Type.map.major] = encodeMap;
  encoders[Type.tag.major] = encodeTag;
  encoders[Type.float.major] = encodeFloat;
  return encoders
}

const cborEncoders = makeCborEncoders();

const buf = new Bl();

/** @implements {Reference} */
class Ref {
  /**
   * @param {object|any[]} obj
   * @param {Reference|undefined} parent
   */
  constructor (obj, parent) {
    this.obj = obj;
    this.parent = parent;
  }

  /**
   * @param {object|any[]} obj
   * @returns {boolean}
   */
  includes (obj) {
    /** @type {Reference|undefined} */
    let p = this;
    do {
      if (p.obj === obj) {
        return true
      }
    } while (p = p.parent) // eslint-disable-line
    return false
  }

  /**
   * @param {Reference|undefined} stack
   * @param {object|any[]} obj
   * @returns {Reference}
   */
  static createCheck (stack, obj) {
    if (stack && stack.includes(obj)) {
      throw new Error(`${encodeErrPrefix} object contains circular references`)
    }
    return new Ref(obj, stack)
  }
}

const simpleTokens = {
  null: new Token(Type.null, null),
  undefined: new Token(Type.undefined, undefined),
  true: new Token(Type.true, true),
  false: new Token(Type.false, false),
  emptyArray: new Token(Type.array, 0),
  emptyMap: new Token(Type.map, 0)
};

/** @type {{[typeName: string]: StrictTypeEncoder}} */
const typeEncoders = {
  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  number (obj, _typ, _options, _refStack) {
    if (!Number.isInteger(obj) || !Number.isSafeInteger(obj)) {
      return new Token(Type.float, obj)
    } else if (obj >= 0) {
      return new Token(Type.uint, obj)
    } else {
      return new Token(Type.negint, obj)
    }
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  bigint (obj, _typ, _options, _refStack) {
    if (obj >= BigInt(0)) {
      return new Token(Type.uint, obj)
    } else {
      return new Token(Type.negint, obj)
    }
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  Uint8Array (obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, obj)
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  string (obj, _typ, _options, _refStack) {
    return new Token(Type.string, obj)
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  boolean (obj, _typ, _options, _refStack) {
    return obj ? simpleTokens.true : simpleTokens.false
  },

  /**
   * @param {any} _obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  null (_obj, _typ, _options, _refStack) {
    return simpleTokens.null
  },

  /**
   * @param {any} _obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  undefined (_obj, _typ, _options, _refStack) {
    return simpleTokens.undefined
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  ArrayBuffer (obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, new Uint8Array(obj))
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  DataView (obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength))
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} options
   * @param {Reference} [refStack]
   * @returns {TokenOrNestedTokens}
   */
  Array (obj, _typ, options, refStack) {
    if (!obj.length) {
      if (options.addBreakTokens === true) {
        return [simpleTokens.emptyArray, new Token(Type.break)]
      }
      return simpleTokens.emptyArray
    }
    refStack = Ref.createCheck(refStack, obj);
    const entries = [];
    let i = 0;
    for (const e of obj) {
      entries[i++] = objectToTokens(e, options, refStack);
    }
    if (options.addBreakTokens) {
      return [new Token(Type.array, obj.length), entries, new Token(Type.break)]
    }
    return [new Token(Type.array, obj.length), entries]
  },

  /**
   * @param {any} obj
   * @param {string} typ
   * @param {EncodeOptions} options
   * @param {Reference} [refStack]
   * @returns {TokenOrNestedTokens}
   */
  Object (obj, typ, options, refStack) {
    // could be an Object or a Map
    const isMap = typ !== 'Object';
    // it's slightly quicker to use Object.keys() than Object.entries()
    const keys = isMap ? obj.keys() : Object.keys(obj);
    const length = isMap ? obj.size : keys.length;
    if (!length) {
      if (options.addBreakTokens === true) {
        return [simpleTokens.emptyMap, new Token(Type.break)]
      }
      return simpleTokens.emptyMap
    }
    refStack = Ref.createCheck(refStack, obj);
    /** @type {TokenOrNestedTokens[]} */
    const entries = [];
    let i = 0;
    for (const key of keys) {
      entries[i++] = [
        objectToTokens(key, options, refStack),
        objectToTokens(isMap ? obj.get(key) : obj[key], options, refStack)
      ];
    }
    sortMapEntries(entries, options);
    if (options.addBreakTokens) {
      return [new Token(Type.map, length), entries, new Token(Type.break)]
    }
    return [new Token(Type.map, length), entries]
  }
};

typeEncoders.Map = typeEncoders.Object;
typeEncoders.Buffer = typeEncoders.Uint8Array;
for (const typ of 'Uint8Clamped Uint16 Uint32 Int8 Int16 Int32 BigUint64 BigInt64 Float32 Float64'.split(' ')) {
  typeEncoders[`${typ}Array`] = typeEncoders.DataView;
}

/**
 * @param {any} obj
 * @param {EncodeOptions} [options]
 * @param {Reference} [refStack]
 * @returns {TokenOrNestedTokens}
 */
function objectToTokens (obj, options = {}, refStack) {
  const typ = is(obj);
  const customTypeEncoder = (options && options.typeEncoders && /** @type {OptionalTypeEncoder} */ options.typeEncoders[typ]) || typeEncoders[typ];
  if (typeof customTypeEncoder === 'function') {
    const tokens = customTypeEncoder(obj, typ, options, refStack);
    if (tokens != null) {
      return tokens
    }
  }
  const typeEncoder = typeEncoders[typ];
  if (!typeEncoder) {
    throw new Error(`${encodeErrPrefix} unsupported type: ${typ}`)
  }
  return typeEncoder(obj, typ, options, refStack)
}

/*
CBOR key sorting is a mess.

The canonicalisation recommendation from https://tools.ietf.org/html/rfc7049#section-3.9
includes the wording:

> The keys in every map must be sorted lowest value to highest.
> Sorting is performed on the bytes of the representation of the key
> data items without paying attention to the 3/5 bit splitting for
> major types.
> ...
>  *  If two keys have different lengths, the shorter one sorts
      earlier;
>  *  If two keys have the same length, the one with the lower value
      in (byte-wise) lexical order sorts earlier.

1. It is not clear what "bytes of the representation of the key" means: is it
   the CBOR representation, or the binary representation of the object itself?
   Consider the int and uint difference here.
2. It is not clear what "without paying attention to" means: do we include it
   and compare on that? Or do we omit the special prefix byte, (mostly) treating
   the key in its plain binary representation form.

The FIDO 2.0: Client To Authenticator Protocol spec takes the original CBOR
wording and clarifies it according to their understanding.
https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#message-encoding

> The keys in every map must be sorted lowest value to highest. Sorting is
> performed on the bytes of the representation of the key data items without
> paying attention to the 3/5 bit splitting for major types. The sorting rules
> are:
>  * If the major types are different, the one with the lower value in numerical
>    order sorts earlier.
>  * If two keys have different lengths, the shorter one sorts earlier;
>  * If two keys have the same length, the one with the lower value in
>    (byte-wise) lexical order sorts earlier.

Some other implementations, such as borc, do a full encode then do a
length-first, byte-wise-second comparison:
https://github.com/dignifiedquire/borc/blob/b6bae8b0bcde7c3976b0f0f0957208095c392a36/src/encoder.js#L358
https://github.com/dignifiedquire/borc/blob/b6bae8b0bcde7c3976b0f0f0957208095c392a36/src/utils.js#L143-L151

This has the benefit of being able to easily handle arbitrary keys, including
complex types (maps and arrays).

We'll opt for the FIDO approach, since it affords some efficies since we don't
need a full encode of each key to determine order and can defer to the types
to determine how to most efficiently order their values (i.e. int and uint
ordering can be done on the numbers, no need for byte-wise, for example).

Recommendation: stick to single key types or you'll get into trouble, and prefer
string keys because it's much simpler that way.
*/

/*
(UPDATE, Dec 2020)
https://tools.ietf.org/html/rfc8949 is the updated CBOR spec and clarifies some
of the questions above with a new recommendation for sorting order being much
closer to what would be expected in other environments (i.e. no length-first
weirdness).
This new sorting order is not yet implemented here but could be added as an
option. "Determinism" (canonicity) is system dependent and it's difficult to
change existing systems that are built with existing expectations. So if a new
ordering is introduced here, the old needs to be kept as well with the user
having the option.
*/

/**
 * @param {TokenOrNestedTokens[]} entries
 * @param {EncodeOptions} options
 */
function sortMapEntries (entries, options) {
  if (options.mapSorter) {
    entries.sort(options.mapSorter);
  }
}

/**
 * @param {(Token|Token[])[]} e1
 * @param {(Token|Token[])[]} e2
 * @returns {number}
 */
function mapSorter (e1, e2) {
  // the key position ([0]) could have a single token or an array
  // almost always it'll be a single token but complex key might get involved
  /* c8 ignore next 2 */
  const keyToken1 = Array.isArray(e1[0]) ? e1[0][0] : e1[0];
  const keyToken2 = Array.isArray(e2[0]) ? e2[0][0] : e2[0];

  // different key types
  if (keyToken1.type !== keyToken2.type) {
    return keyToken1.type.compare(keyToken2.type)
  }

  const major = keyToken1.type.major;
  // TODO: handle case where cmp === 0 but there are more keyToken e. complex type)
  const tcmp = cborEncoders[major].compareTokens(keyToken1, keyToken2);
  /* c8 ignore next 5 */
  if (tcmp === 0) {
    // duplicate key or complex type where the first token matched,
    // i.e. a map or array and we're only comparing the opening token
    console.warn('WARNING: complex key types used, CBOR key sorting guarantees are gone');
  }
  return tcmp
}

/**
 * @param {Bl} buf
 * @param {TokenOrNestedTokens} tokens
 * @param {TokenTypeEncoder[]} encoders
 * @param {EncodeOptions} options
 */
function tokensToEncoded (buf, tokens, encoders, options) {
  if (Array.isArray(tokens)) {
    for (const token of tokens) {
      tokensToEncoded(buf, token, encoders, options);
    }
  } else {
    encoders[tokens.type.major](buf, tokens, options);
  }
}

/**
 * @param {any} data
 * @param {TokenTypeEncoder[]} encoders
 * @param {EncodeOptions} options
 * @returns {Uint8Array}
 */
function encodeCustom (data, encoders, options) {
  const tokens = objectToTokens(data, options);
  if (!Array.isArray(tokens) && options.quickEncodeToken) {
    const quickBytes = options.quickEncodeToken(tokens);
    if (quickBytes) {
      return quickBytes
    }
    const encoder = encoders[tokens.type.major];
    if (encoder.encodedSize) {
      const size = encoder.encodedSize(tokens, options);
      const buf = new Bl(size);
      encoder(buf, tokens, options);
      /* c8 ignore next 4 */
      // this would be a problem with encodedSize() functions
      if (buf.chunks.length !== 1) {
        throw new Error(`Unexpected error: pre-calculated length for ${tokens} was wrong`)
      }
      return asU8A(buf.chunks[0])
    }
  }
  buf.reset();
  tokensToEncoded(buf, tokens, encoders, options);
  return buf.toBytes(true)
}

/**
 * @param {any} data
 * @param {EncodeOptions} [options]
 * @returns {Uint8Array}
 */
function encode (data, options) {
  options = Object.assign({}, defaultEncodeOptions, options);
  return encodeCustom(data, cborEncoders, options)
}

/**
 * @typedef {import('./token.js').Token} Token
 * @typedef {import('../interface').DecodeOptions} DecodeOptions
 * @typedef {import('../interface').DecodeTokenizer} DecodeTokenizer
 */

const defaultDecodeOptions = {
  strict: false,
  allowIndefinite: true,
  allowUndefined: true,
  allowBigInt: true
};

/**
 * @implements {DecodeTokenizer}
 */
class Tokeniser {
  /**
   * @param {Uint8Array} data
   * @param {DecodeOptions} options
   */
  constructor (data, options = {}) {
    this._pos = 0;
    this.data = data;
    this.options = options;
  }

  pos () {
    return this._pos
  }

  done () {
    return this._pos >= this.data.length
  }

  next () {
    const byt = this.data[this._pos];
    let token = quick[byt];
    if (token === undefined) {
      const decoder = jump[byt];
      /* c8 ignore next 4 */
      // if we're here then there's something wrong with our jump or quick lists!
      if (!decoder) {
        throw new Error(`${decodeErrPrefix} no decoder for major type ${byt >>> 5} (byte 0x${byt.toString(16).padStart(2, '0')})`)
      }
      const minor = byt & 31;
      token = decoder(this.data, this._pos, minor, this.options);
    }
    // @ts-ignore we get to assume encodedLength is set (crossing fingers slightly)
    this._pos += token.encodedLength;
    return token
  }
}

const DONE = Symbol.for('DONE');
const BREAK = Symbol.for('BREAK');

/**
 * @param {Token} token
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {any|BREAK|DONE}
 */
function tokenToArray (token, tokeniser, options) {
  const arr = [];
  for (let i = 0; i < token.value; i++) {
    const value = tokensToObject(tokeniser, options);
    if (value === BREAK) {
      if (token.value === Infinity) {
        // normal end to indefinite length array
        break
      }
      throw new Error(`${decodeErrPrefix} got unexpected break to lengthed array`)
    }
    if (value === DONE) {
      throw new Error(`${decodeErrPrefix} found array but not enough entries (got ${i}, expected ${token.value})`)
    }
    arr[i] = value;
  }
  return arr
}

/**
 * @param {Token} token
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {any|BREAK|DONE}
 */
function tokenToMap (token, tokeniser, options) {
  const useMaps = options.useMaps === true;
  const obj = useMaps ? undefined : {};
  const m = useMaps ? new Map() : undefined;
  for (let i = 0; i < token.value; i++) {
    const key = tokensToObject(tokeniser, options);
    if (key === BREAK) {
      if (token.value === Infinity) {
        // normal end to indefinite length map
        break
      }
      throw new Error(`${decodeErrPrefix} got unexpected break to lengthed map`)
    }
    if (key === DONE) {
      throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no key], expected ${token.value})`)
    }
    if (useMaps !== true && typeof key !== 'string') {
      throw new Error(`${decodeErrPrefix} non-string keys not supported (got ${typeof key})`)
    }
    if (options.rejectDuplicateMapKeys === true) {
      // @ts-ignore
      if ((useMaps && m.has(key)) || (!useMaps && (key in obj))) {
        throw new Error(`${decodeErrPrefix} found repeat map key "${key}"`)
      }
    }
    const value = tokensToObject(tokeniser, options);
    if (value === DONE) {
      throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no value], expected ${token.value})`)
    }
    if (useMaps) {
      // @ts-ignore TODO reconsider this .. maybe needs to be strict about key types
      m.set(key, value);
    } else {
      // @ts-ignore TODO reconsider this .. maybe needs to be strict about key types
      obj[key] = value;
    }
  }
  // @ts-ignore c'mon man
  return useMaps ? m : obj
}

/**
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {any|BREAK|DONE}
 */
function tokensToObject (tokeniser, options) {
  // should we support array as an argument?
  // check for tokenIter[Symbol.iterator] and replace tokenIter with what that returns?
  if (tokeniser.done()) {
    return DONE
  }

  const token = tokeniser.next();

  if (token.type === Type.break) {
    return BREAK
  }

  if (token.type.terminal) {
    return token.value
  }

  if (token.type === Type.array) {
    return tokenToArray(token, tokeniser, options)
  }

  if (token.type === Type.map) {
    return tokenToMap(token, tokeniser, options)
  }

  if (token.type === Type.tag) {
    if (options.tags && typeof options.tags[token.value] === 'function') {
      const tagged = tokensToObject(tokeniser, options);
      return options.tags[token.value](tagged)
    }
    throw new Error(`${decodeErrPrefix} tag not supported (${token.value})`)
  }
  /* c8 ignore next */
  throw new Error('unsupported')
}

/**
 * @param {Uint8Array} data
 * @param {DecodeOptions} [options]
 * @returns {[any, Uint8Array]}
 */
function decodeFirst (data, options) {
  if (!(data instanceof Uint8Array)) {
    throw new Error(`${decodeErrPrefix} data to decode must be a Uint8Array`)
  }
  options = Object.assign({}, defaultDecodeOptions, options);
  const tokeniser = options.tokenizer || new Tokeniser(data, options);
  const decoded = tokensToObject(tokeniser, options);
  if (decoded === DONE) {
    throw new Error(`${decodeErrPrefix} did not find any content to decode`)
  }
  if (decoded === BREAK) {
    throw new Error(`${decodeErrPrefix} got unexpected break`)
  }
  return [decoded, data.subarray(tokeniser.pos())]
}

/**
 * @param {Uint8Array} data
 * @param {DecodeOptions} [options]
 * @returns {any}
 */
function decode (data, options) {
  const [decoded, remainder] = decodeFirst(data, options);
  if (remainder.length > 0) {
    throw new Error(`${decodeErrPrefix} too many terminals, data makes no sense`)
  }
  return decoded
}

export { Token, Tokeniser as Tokenizer, Type, decode, decodeFirst, encode, tokensToObject };
