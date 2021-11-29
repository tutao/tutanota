const decodeErrPrefix = 'CBOR decode error:';

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
  }

  /* c8 ignore next 3 */
  toString () {
    return `Token[${this.type}].${this.value}`
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
BigInt(1);

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
new TextEncoder();

/**
 * @param {Uint8Array} buf
 * @returns {boolean}
 */
function isBuffer (buf) {
  // @ts-ignore
  return useBuffer && globalThis.Buffer.isBuffer(buf)
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
function toToken$2 (data, pos, prefix, length) {
  const totLength = prefix + length;
  assertEnoughData(data, pos, totLength);
  return new Token(Type.string, toString(data, pos + prefix, pos + totLength), totLength)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeStringCompact (data, pos, minor, _options) {
  return toToken$2(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString8 (data, pos, _minor, options) {
  return toToken$2(data, pos, 2, readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString16 (data, pos, _minor, options) {
  return toToken$2(data, pos, 3, readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString32 (data, pos, _minor, options) {
  return toToken$2(data, pos, 5, readUint32(data, pos + 1, options))
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
  return toToken$2(data, pos, 9, l)
}

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

// TODO: shift some of the bytes logic to bytes-utils so we can use Buffer

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
    this.pos = 0;
    this.data = data;
    this.options = options;
  }

  done () {
    return this.pos >= this.data.length
  }

  next () {
    const byt = this.data[this.pos];
    let token = quick[byt];
    if (token === undefined) {
      const decoder = jump[byt];
      /* c8 ignore next 4 */
      // if we're here then there's something wrong with our jump or quick lists!
      if (!decoder) {
        throw new Error(`${decodeErrPrefix} no decoder for major type ${byt >>> 5} (byte 0x${byt.toString(16).padStart(2, '0')})`)
      }
      const minor = byt & 31;
      token = decoder(this.data, this.pos, minor, this.options);
    }
    // @ts-ignore we get to assume encodedLength is set (crossing fingers slightly)
    this.pos += token.encodedLength;
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
 * @returns {any}
 */
function decode (data, options) {
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
  if (!tokeniser.done()) {
    throw new Error(`${decodeErrPrefix} too many terminals, data makes no sense`)
  }
  return decoded
}

export { Tokeniser, decode, tokensToObject };
