import require$$0 from 'node:assert';
import require$$4 from 'node:net';
import require$$2 from 'node:http';
import require$$0$1 from 'node:stream';
import require$$6 from 'node:buffer';
import require$$0$2 from 'node:util';
import require$$8 from 'node:querystring';
import require$$0$3 from 'node:diagnostics_channel';
import require$$0$4 from 'node:events';
import require$$4$1 from 'node:tls';
import require$$1 from 'node:zlib';
import require$$5 from 'node:perf_hooks';
import require$$8$1 from 'node:util/types';
import require$$0$5 from 'node:os';
import require$$1$1 from 'node:url';
import require$$4$2 from 'node:async_hooks';
import require$$1$2 from 'node:console';
import require$$5$1 from 'string_decoder';
import require$$2$1 from 'node:worker_threads';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var undici = {};

var symbols$4 = {
  kClose: Symbol('close'),
  kDestroy: Symbol('destroy'),
  kDispatch: Symbol('dispatch'),
  kUrl: Symbol('url'),
  kWriting: Symbol('writing'),
  kResuming: Symbol('resuming'),
  kQueue: Symbol('queue'),
  kConnect: Symbol('connect'),
  kConnecting: Symbol('connecting'),
  kHeadersList: Symbol('headers list'),
  kKeepAliveDefaultTimeout: Symbol('default keep alive timeout'),
  kKeepAliveMaxTimeout: Symbol('max keep alive timeout'),
  kKeepAliveTimeoutThreshold: Symbol('keep alive timeout threshold'),
  kKeepAliveTimeoutValue: Symbol('keep alive timeout'),
  kKeepAlive: Symbol('keep alive'),
  kHeadersTimeout: Symbol('headers timeout'),
  kBodyTimeout: Symbol('body timeout'),
  kServerName: Symbol('server name'),
  kLocalAddress: Symbol('local address'),
  kHost: Symbol('host'),
  kNoRef: Symbol('no ref'),
  kBodyUsed: Symbol('used'),
  kRunning: Symbol('running'),
  kBlocking: Symbol('blocking'),
  kPending: Symbol('pending'),
  kSize: Symbol('size'),
  kBusy: Symbol('busy'),
  kQueued: Symbol('queued'),
  kFree: Symbol('free'),
  kConnected: Symbol('connected'),
  kClosed: Symbol('closed'),
  kNeedDrain: Symbol('need drain'),
  kReset: Symbol('reset'),
  kDestroyed: Symbol.for('nodejs.stream.destroyed'),
  kResume: Symbol('resume'),
  kOnError: Symbol('on error'),
  kMaxHeadersSize: Symbol('max headers size'),
  kRunningIdx: Symbol('running index'),
  kPendingIdx: Symbol('pending index'),
  kError: Symbol('error'),
  kClients: Symbol('clients'),
  kClient: Symbol('client'),
  kParser: Symbol('parser'),
  kOnDestroyed: Symbol('destroy callbacks'),
  kPipelining: Symbol('pipelining'),
  kSocket: Symbol('socket'),
  kHostHeader: Symbol('host header'),
  kConnector: Symbol('connector'),
  kStrictContentLength: Symbol('strict content length'),
  kMaxRedirections: Symbol('maxRedirections'),
  kMaxRequests: Symbol('maxRequestsPerClient'),
  kProxy: Symbol('proxy agent options'),
  kCounter: Symbol('socket request counter'),
  kInterceptors: Symbol('dispatch interceptors'),
  kMaxResponseSize: Symbol('max response size'),
  kHTTP2Session: Symbol('http2Session'),
  kHTTP2SessionState: Symbol('http2Session state'),
  kRetryHandlerDefaultRetry: Symbol('retry agent default retry'),
  kConstruct: Symbol('constructable'),
  kListeners: Symbol('listeners'),
  kHTTPContext: Symbol('http context'),
  kMaxConcurrentStreams: Symbol('max concurrent streams')
};

let UndiciError$2 = class UndiciError extends Error {
  constructor (message) {
    super(message);
    this.name = 'UndiciError';
    this.code = 'UND_ERR';
  }
};

let ConnectTimeoutError$1 = class ConnectTimeoutError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'ConnectTimeoutError';
    this.message = message || 'Connect Timeout Error';
    this.code = 'UND_ERR_CONNECT_TIMEOUT';
  }
};

let HeadersTimeoutError$1 = class HeadersTimeoutError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'HeadersTimeoutError';
    this.message = message || 'Headers Timeout Error';
    this.code = 'UND_ERR_HEADERS_TIMEOUT';
  }
};

let HeadersOverflowError$1 = class HeadersOverflowError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'HeadersOverflowError';
    this.message = message || 'Headers Overflow Error';
    this.code = 'UND_ERR_HEADERS_OVERFLOW';
  }
};

let BodyTimeoutError$1 = class BodyTimeoutError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'BodyTimeoutError';
    this.message = message || 'Body Timeout Error';
    this.code = 'UND_ERR_BODY_TIMEOUT';
  }
};

let ResponseStatusCodeError$1 = class ResponseStatusCodeError extends UndiciError$2 {
  constructor (message, statusCode, headers, body) {
    super(message);
    this.name = 'ResponseStatusCodeError';
    this.message = message || 'Response Status Code Error';
    this.code = 'UND_ERR_RESPONSE_STATUS_CODE';
    this.body = body;
    this.status = statusCode;
    this.statusCode = statusCode;
    this.headers = headers;
  }
};

let InvalidArgumentError$m = class InvalidArgumentError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'InvalidArgumentError';
    this.message = message || 'Invalid Argument Error';
    this.code = 'UND_ERR_INVALID_ARG';
  }
};

let InvalidReturnValueError$2 = class InvalidReturnValueError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'InvalidReturnValueError';
    this.message = message || 'Invalid Return Value Error';
    this.code = 'UND_ERR_INVALID_RETURN_VALUE';
  }
};

let AbortError$1 = class AbortError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'AbortError';
    this.message = message || 'The operation was aborted';
  }
};

let RequestAbortedError$a = class RequestAbortedError extends AbortError$1 {
  constructor (message) {
    super(message);
    this.name = 'AbortError';
    this.message = message || 'Request aborted';
    this.code = 'UND_ERR_ABORTED';
  }
};

let InformationalError$3 = class InformationalError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'InformationalError';
    this.message = message || 'Request information';
    this.code = 'UND_ERR_INFO';
  }
};

let RequestContentLengthMismatchError$2 = class RequestContentLengthMismatchError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'RequestContentLengthMismatchError';
    this.message = message || 'Request body length does not match content-length header';
    this.code = 'UND_ERR_REQ_CONTENT_LENGTH_MISMATCH';
  }
};

let ResponseContentLengthMismatchError$1 = class ResponseContentLengthMismatchError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'ResponseContentLengthMismatchError';
    this.message = message || 'Response body length does not match content-length header';
    this.code = 'UND_ERR_RES_CONTENT_LENGTH_MISMATCH';
  }
};

let ClientDestroyedError$2 = class ClientDestroyedError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'ClientDestroyedError';
    this.message = message || 'The client is destroyed';
    this.code = 'UND_ERR_DESTROYED';
  }
};

let ClientClosedError$1 = class ClientClosedError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'ClientClosedError';
    this.message = message || 'The client is closed';
    this.code = 'UND_ERR_CLOSED';
  }
};

let SocketError$4 = class SocketError extends UndiciError$2 {
  constructor (message, socket) {
    super(message);
    this.name = 'SocketError';
    this.message = message || 'Socket error';
    this.code = 'UND_ERR_SOCKET';
    this.socket = socket;
  }
};

let NotSupportedError$2 = class NotSupportedError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'NotSupportedError';
    this.message = message || 'Not supported error';
    this.code = 'UND_ERR_NOT_SUPPORTED';
  }
};

let BalancedPoolMissingUpstreamError$1 = class BalancedPoolMissingUpstreamError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'MissingUpstreamError';
    this.message = message || 'No upstream has been added to the BalancedPool';
    this.code = 'UND_ERR_BPL_MISSING_UPSTREAM';
  }
};

let HTTPParserError$1 = class HTTPParserError extends Error {
  constructor (message, code, data) {
    super(message);
    this.name = 'HTTPParserError';
    this.code = code ? `HPE_${code}` : undefined;
    this.data = data ? data.toString() : undefined;
  }
};

let ResponseExceededMaxSizeError$1 = class ResponseExceededMaxSizeError extends UndiciError$2 {
  constructor (message) {
    super(message);
    this.name = 'ResponseExceededMaxSizeError';
    this.message = message || 'Response content exceeded max size';
    this.code = 'UND_ERR_RES_EXCEEDED_MAX_SIZE';
  }
};

let RequestRetryError$1 = class RequestRetryError extends UndiciError$2 {
  constructor (message, code, { headers, data }) {
    super(message);
    this.name = 'RequestRetryError';
    this.message = message || 'Request retry error';
    this.code = 'UND_ERR_REQ_RETRY';
    this.statusCode = code;
    this.data = data;
    this.headers = headers;
  }
};

let SecureProxyConnectionError$1 = class SecureProxyConnectionError extends UndiciError$2 {
  constructor (cause, message, options) {
    super(message, { cause, ...(options ?? {}) });
    this.name = 'SecureProxyConnectionError';
    this.message = message || 'Secure Proxy Connection failed';
    this.code = 'UND_ERR_PRX_TLS';
    this.cause = cause;
  }
};

var errors$1 = {
  AbortError: AbortError$1,
  HTTPParserError: HTTPParserError$1,
  UndiciError: UndiciError$2,
  HeadersTimeoutError: HeadersTimeoutError$1,
  HeadersOverflowError: HeadersOverflowError$1,
  BodyTimeoutError: BodyTimeoutError$1,
  RequestContentLengthMismatchError: RequestContentLengthMismatchError$2,
  ConnectTimeoutError: ConnectTimeoutError$1,
  ResponseStatusCodeError: ResponseStatusCodeError$1,
  InvalidArgumentError: InvalidArgumentError$m,
  InvalidReturnValueError: InvalidReturnValueError$2,
  RequestAbortedError: RequestAbortedError$a,
  ClientDestroyedError: ClientDestroyedError$2,
  ClientClosedError: ClientClosedError$1,
  InformationalError: InformationalError$3,
  SocketError: SocketError$4,
  NotSupportedError: NotSupportedError$2,
  ResponseContentLengthMismatchError: ResponseContentLengthMismatchError$1,
  BalancedPoolMissingUpstreamError: BalancedPoolMissingUpstreamError$1,
  ResponseExceededMaxSizeError: ResponseExceededMaxSizeError$1,
  RequestRetryError: RequestRetryError$1,
  SecureProxyConnectionError: SecureProxyConnectionError$1
};

/** @type {Record<string, string | undefined>} */
const headerNameLowerCasedRecord$3 = {};

// https://developer.mozilla.org/docs/Web/HTTP/Headers
const wellknownHeaderNames$1 = [
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Accept-Ranges',
  'Access-Control-Allow-Credentials',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Origin',
  'Access-Control-Expose-Headers',
  'Access-Control-Max-Age',
  'Access-Control-Request-Headers',
  'Access-Control-Request-Method',
  'Age',
  'Allow',
  'Alt-Svc',
  'Alt-Used',
  'Authorization',
  'Cache-Control',
  'Clear-Site-Data',
  'Connection',
  'Content-Disposition',
  'Content-Encoding',
  'Content-Language',
  'Content-Length',
  'Content-Location',
  'Content-Range',
  'Content-Security-Policy',
  'Content-Security-Policy-Report-Only',
  'Content-Type',
  'Cookie',
  'Cross-Origin-Embedder-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
  'Date',
  'Device-Memory',
  'Downlink',
  'ECT',
  'ETag',
  'Expect',
  'Expect-CT',
  'Expires',
  'Forwarded',
  'From',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Keep-Alive',
  'Last-Modified',
  'Link',
  'Location',
  'Max-Forwards',
  'Origin',
  'Permissions-Policy',
  'Pragma',
  'Proxy-Authenticate',
  'Proxy-Authorization',
  'RTT',
  'Range',
  'Referer',
  'Referrer-Policy',
  'Refresh',
  'Retry-After',
  'Sec-WebSocket-Accept',
  'Sec-WebSocket-Extensions',
  'Sec-WebSocket-Key',
  'Sec-WebSocket-Protocol',
  'Sec-WebSocket-Version',
  'Server',
  'Server-Timing',
  'Service-Worker-Allowed',
  'Service-Worker-Navigation-Preload',
  'Set-Cookie',
  'SourceMap',
  'Strict-Transport-Security',
  'Supports-Loading-Mode',
  'TE',
  'Timing-Allow-Origin',
  'Trailer',
  'Transfer-Encoding',
  'Upgrade',
  'Upgrade-Insecure-Requests',
  'User-Agent',
  'Vary',
  'Via',
  'WWW-Authenticate',
  'X-Content-Type-Options',
  'X-DNS-Prefetch-Control',
  'X-Frame-Options',
  'X-Permitted-Cross-Domain-Policies',
  'X-Powered-By',
  'X-Requested-With',
  'X-XSS-Protection'
];

for (let i = 0; i < wellknownHeaderNames$1.length; ++i) {
  const key = wellknownHeaderNames$1[i];
  const lowerCasedKey = key.toLowerCase();
  headerNameLowerCasedRecord$3[key] = headerNameLowerCasedRecord$3[lowerCasedKey] =
    lowerCasedKey;
}

// Note: object prototypes should not be able to be referenced. e.g. `Object#hasOwnProperty`.
Object.setPrototypeOf(headerNameLowerCasedRecord$3, null);

var constants$5 = {
  wellknownHeaderNames: wellknownHeaderNames$1,
  headerNameLowerCasedRecord: headerNameLowerCasedRecord$3
};

const {
  wellknownHeaderNames,
  headerNameLowerCasedRecord: headerNameLowerCasedRecord$2
} = constants$5;

class TstNode {
  /** @type {any} */
  value = null
  /** @type {null | TstNode} */
  left = null
  /** @type {null | TstNode} */
  middle = null
  /** @type {null | TstNode} */
  right = null
  /** @type {number} */
  code
  /**
   * @param {string} key
   * @param {any} value
   * @param {number} index
   */
  constructor (key, value, index) {
    if (index === undefined || index >= key.length) {
      throw new TypeError('Unreachable')
    }
    const code = this.code = key.charCodeAt(index);
    // check code is ascii string
    if (code > 0x7F) {
      throw new TypeError('key must be ascii string')
    }
    if (key.length !== ++index) {
      this.middle = new TstNode(key, value, index);
    } else {
      this.value = value;
    }
  }

  /**
   * @param {string} key
   * @param {any} value
   */
  add (key, value) {
    const length = key.length;
    if (length === 0) {
      throw new TypeError('Unreachable')
    }
    let index = 0;
    let node = this;
    while (true) {
      const code = key.charCodeAt(index);
      // check code is ascii string
      if (code > 0x7F) {
        throw new TypeError('key must be ascii string')
      }
      if (node.code === code) {
        if (length === ++index) {
          node.value = value;
          break
        } else if (node.middle !== null) {
          node = node.middle;
        } else {
          node.middle = new TstNode(key, value, index);
          break
        }
      } else if (node.code < code) {
        if (node.left !== null) {
          node = node.left;
        } else {
          node.left = new TstNode(key, value, index);
          break
        }
      } else if (node.right !== null) {
        node = node.right;
      } else {
        node.right = new TstNode(key, value, index);
        break
      }
    }
  }

  /**
   * @param {Uint8Array} key
   * @return {TstNode | null}
   */
  search (key) {
    const keylength = key.length;
    let index = 0;
    let node = this;
    while (node !== null && index < keylength) {
      let code = key[index];
      // A-Z
      // First check if it is bigger than 0x5a.
      // Lowercase letters have higher char codes than uppercase ones.
      // Also we assume that headers will mostly contain lowercase characters.
      if (code <= 0x5a && code >= 0x41) {
        // Lowercase for uppercase.
        code |= 32;
      }
      while (node !== null) {
        if (code === node.code) {
          if (keylength === ++index) {
            // Returns Node since it is the last key.
            return node
          }
          node = node.middle;
          break
        }
        node = node.code < code ? node.left : node.right;
      }
    }
    return null
  }
}

class TernarySearchTree {
  /** @type {TstNode | null} */
  node = null

  /**
   * @param {string} key
   * @param {any} value
   * */
  insert (key, value) {
    if (this.node === null) {
      this.node = new TstNode(key, value, 0);
    } else {
      this.node.add(key, value);
    }
  }

  /**
   * @param {Uint8Array} key
   * @return {any}
   */
  lookup (key) {
    return this.node?.search(key)?.value ?? null
  }
}

const tree$1 = new TernarySearchTree();

for (let i = 0; i < wellknownHeaderNames.length; ++i) {
  const key = headerNameLowerCasedRecord$2[wellknownHeaderNames[i]];
  tree$1.insert(key, key);
}

var tree_1 = {
  TernarySearchTree,
  tree: tree$1
};

const assert$b = require$$0;
const { kDestroyed: kDestroyed$1, kBodyUsed: kBodyUsed$1 } = symbols$4;
const { IncomingMessage } = require$$2;
const stream$2 = require$$0$1;
const net$2 = require$$4;
const { InvalidArgumentError: InvalidArgumentError$l } = errors$1;
const { Blob: Blob$1 } = require$$6;
const nodeUtil = require$$0$2;
const { stringify } = require$$8;
const { headerNameLowerCasedRecord: headerNameLowerCasedRecord$1 } = constants$5;
const { tree } = tree_1;

const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(v => Number(v));

function nop$1 () {}

function isStream$1 (obj) {
  return obj && typeof obj === 'object' && typeof obj.pipe === 'function' && typeof obj.on === 'function'
}

// based on https://github.com/node-fetch/fetch-blob/blob/8ab587d34080de94140b54f07168451e7d0b655e/index.js#L229-L241 (MIT License)
function isBlobLike$1 (object) {
  return (Blob$1 && object instanceof Blob$1) || (
    object &&
    typeof object === 'object' &&
    (typeof object.stream === 'function' ||
      typeof object.arrayBuffer === 'function') &&
    /^(Blob|File)$/.test(object[Symbol.toStringTag])
  )
}

function buildURL$3 (url, queryParams) {
  if (url.includes('?') || url.includes('#')) {
    throw new Error('Query params cannot be passed when url already contains "?" or "#".')
  }

  const stringified = stringify(queryParams);

  if (stringified) {
    url += '?' + stringified;
  }

  return url
}

function parseURL (url) {
  if (typeof url === 'string') {
    url = new URL(url);

    if (!/^https?:/.test(url.origin || url.protocol)) {
      throw new InvalidArgumentError$l('Invalid URL protocol: the URL must start with `http:` or `https:`.')
    }

    return url
  }

  if (!url || typeof url !== 'object') {
    throw new InvalidArgumentError$l('Invalid URL: The URL argument must be a non-null object.')
  }

  if (!/^https?:/.test(url.origin || url.protocol)) {
    throw new InvalidArgumentError$l('Invalid URL protocol: the URL must start with `http:` or `https:`.')
  }

  if (!(url instanceof URL)) {
    if (url.port != null && url.port !== '' && !Number.isFinite(parseInt(url.port))) {
      throw new InvalidArgumentError$l('Invalid URL: port must be a valid integer or a string representation of an integer.')
    }

    if (url.path != null && typeof url.path !== 'string') {
      throw new InvalidArgumentError$l('Invalid URL path: the path must be a string or null/undefined.')
    }

    if (url.pathname != null && typeof url.pathname !== 'string') {
      throw new InvalidArgumentError$l('Invalid URL pathname: the pathname must be a string or null/undefined.')
    }

    if (url.hostname != null && typeof url.hostname !== 'string') {
      throw new InvalidArgumentError$l('Invalid URL hostname: the hostname must be a string or null/undefined.')
    }

    if (url.origin != null && typeof url.origin !== 'string') {
      throw new InvalidArgumentError$l('Invalid URL origin: the origin must be a string or null/undefined.')
    }

    const port = url.port != null
      ? url.port
      : (url.protocol === 'https:' ? 443 : 80);
    let origin = url.origin != null
      ? url.origin
      : `${url.protocol}//${url.hostname}:${port}`;
    let path = url.path != null
      ? url.path
      : `${url.pathname || ''}${url.search || ''}`;

    if (origin.endsWith('/')) {
      origin = origin.substring(0, origin.length - 1);
    }

    if (path && !path.startsWith('/')) {
      path = `/${path}`;
    }
    // new URL(path, origin) is unsafe when `path` contains an absolute URL
    // From https://developer.mozilla.org/en-US/docs/Web/API/URL/URL:
    // If first parameter is a relative URL, second param is required, and will be used as the base URL.
    // If first parameter is an absolute URL, a given second param will be ignored.
    url = new URL(origin + path);
  }

  return url
}

function parseOrigin$1 (url) {
  url = parseURL(url);

  if (url.pathname !== '/' || url.search || url.hash) {
    throw new InvalidArgumentError$l('invalid url')
  }

  return url
}

function getHostname (host) {
  if (host[0] === '[') {
    const idx = host.indexOf(']');

    assert$b(idx !== -1);
    return host.substring(1, idx)
  }

  const idx = host.indexOf(':');
  if (idx === -1) return host

  return host.substring(0, idx)
}

// IP addresses are not valid server names per RFC6066
// > Currently, the only server names supported are DNS hostnames
function getServerName$1 (host) {
  if (!host) {
    return null
  }

  assert$b.strictEqual(typeof host, 'string');

  const servername = getHostname(host);
  if (net$2.isIP(servername)) {
    return ''
  }

  return servername
}

function deepClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function isAsyncIterable (obj) {
  return !!(obj != null && typeof obj[Symbol.asyncIterator] === 'function')
}

function isIterable$1 (obj) {
  return !!(obj != null && (typeof obj[Symbol.iterator] === 'function' || typeof obj[Symbol.asyncIterator] === 'function'))
}

function bodyLength (body) {
  if (body == null) {
    return 0
  } else if (isStream$1(body)) {
    const state = body._readableState;
    return state && state.objectMode === false && state.ended === true && Number.isFinite(state.length)
      ? state.length
      : null
  } else if (isBlobLike$1(body)) {
    return body.size != null ? body.size : null
  } else if (isBuffer$1(body)) {
    return body.byteLength
  }

  return null
}

function isDestroyed (body) {
  return body && !!(body.destroyed || body[kDestroyed$1] || (stream$2.isDestroyed?.(body)))
}

function isReadableAborted (stream) {
  const state = stream?._readableState;
  return isDestroyed(stream) && state && !state.endEmitted
}

function destroy$1 (stream, err) {
  if (stream == null || !isStream$1(stream) || isDestroyed(stream)) {
    return
  }

  if (typeof stream.destroy === 'function') {
    if (Object.getPrototypeOf(stream).constructor === IncomingMessage) {
      // See: https://github.com/nodejs/node/pull/38505/files
      stream.socket = null;
    }

    stream.destroy(err);
  } else if (err) {
    queueMicrotask(() => {
      stream.emit('error', err);
    });
  }

  if (stream.destroyed !== true) {
    stream[kDestroyed$1] = true;
  }
}

const KEEPALIVE_TIMEOUT_EXPR = /timeout=(\d+)/;
function parseKeepAliveTimeout (val) {
  const m = val.toString().match(KEEPALIVE_TIMEOUT_EXPR);
  return m ? parseInt(m[1], 10) * 1000 : null
}

/**
 * Retrieves a header name and returns its lowercase value.
 * @param {string | Buffer} value Header name
 * @returns {string}
 */
function headerNameToString (value) {
  return typeof value === 'string'
    ? headerNameLowerCasedRecord$1[value] ?? value.toLowerCase()
    : tree.lookup(value) ?? value.toString('latin1').toLowerCase()
}

/**
 * Receive the buffer as a string and return its lowercase value.
 * @param {Buffer} value Header name
 * @returns {string}
 */
function bufferToLowerCasedHeaderName (value) {
  return tree.lookup(value) ?? value.toString('latin1').toLowerCase()
}

/**
 * @param {Record<string, string | string[]> | (Buffer | string | (Buffer | string)[])[]} headers
 * @param {Record<string, string | string[]>} [obj]
 * @returns {Record<string, string | string[]>}
 */
function parseHeaders$1 (headers, obj) {
  if (obj === undefined) obj = {};
  for (let i = 0; i < headers.length; i += 2) {
    const key = headerNameToString(headers[i]);
    let val = obj[key];

    if (val) {
      if (typeof val === 'string') {
        val = [val];
        obj[key] = val;
      }
      val.push(headers[i + 1].toString('utf8'));
    } else {
      const headersValue = headers[i + 1];
      if (typeof headersValue === 'string') {
        obj[key] = headersValue;
      } else {
        obj[key] = Array.isArray(headersValue) ? headersValue.map(x => x.toString('utf8')) : headersValue.toString('utf8');
      }
    }
  }

  // See https://github.com/nodejs/node/pull/46528
  if ('content-length' in obj && 'content-disposition' in obj) {
    obj['content-disposition'] = Buffer.from(obj['content-disposition']).toString('latin1');
  }

  return obj
}

function parseRawHeaders (headers) {
  const len = headers.length;
  const ret = new Array(len);

  let hasContentLength = false;
  let contentDispositionIdx = -1;
  let key;
  let val;
  let kLen = 0;

  for (let n = 0; n < headers.length; n += 2) {
    key = headers[n];
    val = headers[n + 1];

    typeof key !== 'string' && (key = key.toString());
    typeof val !== 'string' && (val = val.toString('utf8'));

    kLen = key.length;
    if (kLen === 14 && key[7] === '-' && (key === 'content-length' || key.toLowerCase() === 'content-length')) {
      hasContentLength = true;
    } else if (kLen === 19 && key[7] === '-' && (key === 'content-disposition' || key.toLowerCase() === 'content-disposition')) {
      contentDispositionIdx = n + 1;
    }
    ret[n] = key;
    ret[n + 1] = val;
  }

  // See https://github.com/nodejs/node/pull/46528
  if (hasContentLength && contentDispositionIdx !== -1) {
    ret[contentDispositionIdx] = Buffer.from(ret[contentDispositionIdx]).toString('latin1');
  }

  return ret
}

function isBuffer$1 (buffer) {
  // See, https://github.com/mcollina/undici/pull/319
  return buffer instanceof Uint8Array || Buffer.isBuffer(buffer)
}

function validateHandler$1 (handler, method, upgrade) {
  if (!handler || typeof handler !== 'object') {
    throw new InvalidArgumentError$l('handler must be an object')
  }

  if (typeof handler.onConnect !== 'function') {
    throw new InvalidArgumentError$l('invalid onConnect method')
  }

  if (typeof handler.onError !== 'function') {
    throw new InvalidArgumentError$l('invalid onError method')
  }

  if (typeof handler.onBodySent !== 'function' && handler.onBodySent !== undefined) {
    throw new InvalidArgumentError$l('invalid onBodySent method')
  }

  if (upgrade || method === 'CONNECT') {
    if (typeof handler.onUpgrade !== 'function') {
      throw new InvalidArgumentError$l('invalid onUpgrade method')
    }
  } else {
    if (typeof handler.onHeaders !== 'function') {
      throw new InvalidArgumentError$l('invalid onHeaders method')
    }

    if (typeof handler.onData !== 'function') {
      throw new InvalidArgumentError$l('invalid onData method')
    }

    if (typeof handler.onComplete !== 'function') {
      throw new InvalidArgumentError$l('invalid onComplete method')
    }
  }
}

// A body is disturbed if it has been read from and it cannot
// be re-used without losing state or data.
function isDisturbed$1 (body) {
  // TODO (fix): Why is body[kBodyUsed] needed?
  return !!(body && (stream$2.isDisturbed(body) || body[kBodyUsed$1]))
}

function isErrored (body) {
  return !!(body && stream$2.isErrored(body))
}

function isReadable (body) {
  return !!(body && stream$2.isReadable(body))
}

function getSocketInfo (socket) {
  return {
    localAddress: socket.localAddress,
    localPort: socket.localPort,
    remoteAddress: socket.remoteAddress,
    remotePort: socket.remotePort,
    remoteFamily: socket.remoteFamily,
    timeout: socket.timeout,
    bytesWritten: socket.bytesWritten,
    bytesRead: socket.bytesRead
  }
}

/** @type {globalThis['ReadableStream']} */
function ReadableStreamFrom$1 (iterable) {
  // We cannot use ReadableStream.from here because it does not return a byte stream.

  let iterator;
  return new ReadableStream(
    {
      async start () {
        iterator = iterable[Symbol.asyncIterator]();
      },
      async pull (controller) {
        const { done, value } = await iterator.next();
        if (done) {
          queueMicrotask(() => {
            controller.close();
            controller.byobRequest?.respond(0);
          });
        } else {
          const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
          if (buf.byteLength) {
            controller.enqueue(new Uint8Array(buf));
          }
        }
        return controller.desiredSize > 0
      },
      async cancel (reason) {
        await iterator.return();
      },
      type: 'bytes'
    }
  )
}

// The chunk should be a FormData instance and contains
// all the required methods.
function isFormDataLike$1 (object) {
  return (
    object &&
    typeof object === 'object' &&
    typeof object.append === 'function' &&
    typeof object.delete === 'function' &&
    typeof object.get === 'function' &&
    typeof object.getAll === 'function' &&
    typeof object.has === 'function' &&
    typeof object.set === 'function' &&
    object[Symbol.toStringTag] === 'FormData'
  )
}

function addAbortListener$1 (signal, listener) {
  if ('addEventListener' in signal) {
    signal.addEventListener('abort', listener, { once: true });
    return () => signal.removeEventListener('abort', listener)
  }
  signal.addListener('abort', listener);
  return () => signal.removeListener('abort', listener)
}

const hasToWellFormed = typeof String.prototype.toWellFormed === 'function';
const hasIsWellFormed = typeof String.prototype.isWellFormed === 'function';

/**
 * @param {string} val
 */
function toUSVString (val) {
  return hasToWellFormed ? `${val}`.toWellFormed() : nodeUtil.toUSVString(val)
}

/**
 * @param {string} val
 */
// TODO: move this to webidl
function isUSVString (val) {
  return hasIsWellFormed ? `${val}`.isWellFormed() : toUSVString(val) === `${val}`
}

/**
 * @see https://tools.ietf.org/html/rfc7230#section-3.2.6
 * @param {number} c
 */
function isTokenCharCode (c) {
  switch (c) {
    case 0x22:
    case 0x28:
    case 0x29:
    case 0x2c:
    case 0x2f:
    case 0x3a:
    case 0x3b:
    case 0x3c:
    case 0x3d:
    case 0x3e:
    case 0x3f:
    case 0x40:
    case 0x5b:
    case 0x5c:
    case 0x5d:
    case 0x7b:
    case 0x7d:
      // DQUOTE and "(),/:;<=>?@[\]{}"
      return false
    default:
      // VCHAR %x21-7E
      return c >= 0x21 && c <= 0x7e
  }
}

/**
 * @param {string} characters
 */
function isValidHTTPToken$1 (characters) {
  if (characters.length === 0) {
    return false
  }
  for (let i = 0; i < characters.length; ++i) {
    if (!isTokenCharCode(characters.charCodeAt(i))) {
      return false
    }
  }
  return true
}

// headerCharRegex have been lifted from
// https://github.com/nodejs/node/blob/main/lib/_http_common.js

/**
 * Matches if val contains an invalid field-vchar
 *  field-value    = *( field-content / obs-fold )
 *  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 *  field-vchar    = VCHAR / obs-text
 */
const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

/**
 * @param {string} characters
 */
function isValidHeaderChar$1 (characters) {
  return !headerCharRegex.test(characters)
}

// Parsed accordingly to RFC 9110
// https://www.rfc-editor.org/rfc/rfc9110#field.content-range
function parseRangeHeader$1 (range) {
  if (range == null || range === '') return { start: 0, end: null, size: null }

  const m = range ? range.match(/^bytes (\d+)-(\d+)\/(\d+)?$/) : null;
  return m
    ? {
        start: parseInt(m[1]),
        end: m[2] ? parseInt(m[2]) : null,
        size: m[3] ? parseInt(m[3]) : null
      }
    : null
}

const kEnumerableProperty = Object.create(null);
kEnumerableProperty.enumerable = true;

var util$m = {
  kEnumerableProperty,
  nop: nop$1,
  isDisturbed: isDisturbed$1,
  isErrored,
  isReadable,
  toUSVString,
  isUSVString,
  isReadableAborted,
  isBlobLike: isBlobLike$1,
  parseOrigin: parseOrigin$1,
  parseURL,
  getServerName: getServerName$1,
  isStream: isStream$1,
  isIterable: isIterable$1,
  isAsyncIterable,
  isDestroyed,
  headerNameToString,
  bufferToLowerCasedHeaderName,
  parseRawHeaders,
  parseHeaders: parseHeaders$1,
  parseKeepAliveTimeout,
  destroy: destroy$1,
  bodyLength,
  deepClone,
  ReadableStreamFrom: ReadableStreamFrom$1,
  isBuffer: isBuffer$1,
  validateHandler: validateHandler$1,
  getSocketInfo,
  isFormDataLike: isFormDataLike$1,
  buildURL: buildURL$3,
  addAbortListener: addAbortListener$1,
  isValidHTTPToken: isValidHTTPToken$1,
  isValidHeaderChar: isValidHeaderChar$1,
  isTokenCharCode,
  parseRangeHeader: parseRangeHeader$1,
  nodeMajor,
  nodeMinor,
  nodeHasAutoSelectFamily: nodeMajor > 18 || (nodeMajor === 18 && nodeMinor >= 13),
  safeHTTPMethods: ['GET', 'HEAD', 'OPTIONS', 'TRACE']
};

const diagnosticsChannel = require$$0$3;
const util$l = require$$0$2;

const undiciDebugLog = util$l.debuglog('undici');
const fetchDebuglog = util$l.debuglog('fetch');
const websocketDebuglog = util$l.debuglog('websocket');
let isClientSet = false;
const channels$3 = {
  // Client
  beforeConnect: diagnosticsChannel.channel('undici:client:beforeConnect'),
  connected: diagnosticsChannel.channel('undici:client:connected'),
  connectError: diagnosticsChannel.channel('undici:client:connectError'),
  sendHeaders: diagnosticsChannel.channel('undici:client:sendHeaders'),
  // Request
  create: diagnosticsChannel.channel('undici:request:create'),
  bodySent: diagnosticsChannel.channel('undici:request:bodySent'),
  headers: diagnosticsChannel.channel('undici:request:headers'),
  trailers: diagnosticsChannel.channel('undici:request:trailers'),
  error: diagnosticsChannel.channel('undici:request:error'),
  // WebSocket
  open: diagnosticsChannel.channel('undici:websocket:open'),
  close: diagnosticsChannel.channel('undici:websocket:close'),
  socketError: diagnosticsChannel.channel('undici:websocket:socket_error'),
  ping: diagnosticsChannel.channel('undici:websocket:ping'),
  pong: diagnosticsChannel.channel('undici:websocket:pong')
};

if (undiciDebugLog.enabled || fetchDebuglog.enabled) {
  const debuglog = fetchDebuglog.enabled ? fetchDebuglog : undiciDebugLog;

  // Track all Client events
  diagnosticsChannel.channel('undici:client:beforeConnect').subscribe(evt => {
    const {
      connectParams: { version, protocol, port, host }
    } = evt;
    debuglog(
      'connecting to %s using %s%s',
      `${host}${port ? `:${port}` : ''}`,
      protocol,
      version
    );
  });

  diagnosticsChannel.channel('undici:client:connected').subscribe(evt => {
    const {
      connectParams: { version, protocol, port, host }
    } = evt;
    debuglog(
      'connected to %s using %s%s',
      `${host}${port ? `:${port}` : ''}`,
      protocol,
      version
    );
  });

  diagnosticsChannel.channel('undici:client:connectError').subscribe(evt => {
    const {
      connectParams: { version, protocol, port, host },
      error
    } = evt;
    debuglog(
      'connection to %s using %s%s errored - %s',
      `${host}${port ? `:${port}` : ''}`,
      protocol,
      version,
      error.message
    );
  });

  diagnosticsChannel.channel('undici:client:sendHeaders').subscribe(evt => {
    const {
      request: { method, path, origin }
    } = evt;
    debuglog('sending request to %s %s/%s', method, origin, path);
  });

  // Track Request events
  diagnosticsChannel.channel('undici:request:headers').subscribe(evt => {
    const {
      request: { method, path, origin },
      response: { statusCode }
    } = evt;
    debuglog(
      'received response to %s %s/%s - HTTP %d',
      method,
      origin,
      path,
      statusCode
    );
  });

  diagnosticsChannel.channel('undici:request:trailers').subscribe(evt => {
    const {
      request: { method, path, origin }
    } = evt;
    debuglog('trailers received from %s %s/%s', method, origin, path);
  });

  diagnosticsChannel.channel('undici:request:error').subscribe(evt => {
    const {
      request: { method, path, origin },
      error
    } = evt;
    debuglog(
      'request to %s %s/%s errored - %s',
      method,
      origin,
      path,
      error.message
    );
  });

  isClientSet = true;
}

if (websocketDebuglog.enabled) {
  if (!isClientSet) {
    const debuglog = undiciDebugLog.enabled ? undiciDebugLog : websocketDebuglog;
    diagnosticsChannel.channel('undici:client:beforeConnect').subscribe(evt => {
      const {
        connectParams: { version, protocol, port, host }
      } = evt;
      debuglog(
        'connecting to %s%s using %s%s',
        host,
        port ? `:${port}` : '',
        protocol,
        version
      );
    });

    diagnosticsChannel.channel('undici:client:connected').subscribe(evt => {
      const {
        connectParams: { version, protocol, port, host }
      } = evt;
      debuglog(
        'connected to %s%s using %s%s',
        host,
        port ? `:${port}` : '',
        protocol,
        version
      );
    });

    diagnosticsChannel.channel('undici:client:connectError').subscribe(evt => {
      const {
        connectParams: { version, protocol, port, host },
        error
      } = evt;
      debuglog(
        'connection to %s%s using %s%s errored - %s',
        host,
        port ? `:${port}` : '',
        protocol,
        version,
        error.message
      );
    });

    diagnosticsChannel.channel('undici:client:sendHeaders').subscribe(evt => {
      const {
        request: { method, path, origin }
      } = evt;
      debuglog('sending request to %s %s/%s', method, origin, path);
    });
  }

  // Track all WebSocket events
  diagnosticsChannel.channel('undici:websocket:open').subscribe(evt => {
    const {
      address: { address, port }
    } = evt;
    websocketDebuglog('connection opened %s%s', address, port ? `:${port}` : '');
  });

  diagnosticsChannel.channel('undici:websocket:close').subscribe(evt => {
    const { websocket, code, reason } = evt;
    websocketDebuglog(
      'closed connection to %s - %s %s',
      websocket.url,
      code,
      reason
    );
  });

  diagnosticsChannel.channel('undici:websocket:socket_error').subscribe(err => {
    websocketDebuglog('connection errored - %s', err.message);
  });

  diagnosticsChannel.channel('undici:websocket:ping').subscribe(evt => {
    websocketDebuglog('ping received');
  });

  diagnosticsChannel.channel('undici:websocket:pong').subscribe(evt => {
    websocketDebuglog('pong received');
  });
}

var diagnostics = {
  channels: channels$3
};

const {
  InvalidArgumentError: InvalidArgumentError$k,
  NotSupportedError: NotSupportedError$1
} = errors$1;
const assert$a = require$$0;
const {
  isValidHTTPToken,
  isValidHeaderChar,
  isStream,
  destroy,
  isBuffer,
  isFormDataLike,
  isIterable,
  isBlobLike,
  buildURL: buildURL$2,
  validateHandler,
  getServerName
} = util$m;
const { channels: channels$2 } = diagnostics;
const { headerNameLowerCasedRecord } = constants$5;

// Verifies that a given path is valid does not contain control chars \x00 to \x20
const invalidPathRegex = /[^\u0021-\u00ff]/;

const kHandler = Symbol('handler');

let Request$2 = class Request {
  constructor (origin, {
    path,
    method,
    body,
    headers,
    query,
    idempotent,
    blocking,
    upgrade,
    headersTimeout,
    bodyTimeout,
    reset,
    throwOnError,
    expectContinue,
    servername
  }, handler) {
    if (typeof path !== 'string') {
      throw new InvalidArgumentError$k('path must be a string')
    } else if (
      path[0] !== '/' &&
      !(path.startsWith('http://') || path.startsWith('https://')) &&
      method !== 'CONNECT'
    ) {
      throw new InvalidArgumentError$k('path must be an absolute URL or start with a slash')
    } else if (invalidPathRegex.exec(path) !== null) {
      throw new InvalidArgumentError$k('invalid request path')
    }

    if (typeof method !== 'string') {
      throw new InvalidArgumentError$k('method must be a string')
    } else if (!isValidHTTPToken(method)) {
      throw new InvalidArgumentError$k('invalid request method')
    }

    if (upgrade && typeof upgrade !== 'string') {
      throw new InvalidArgumentError$k('upgrade must be a string')
    }

    if (headersTimeout != null && (!Number.isFinite(headersTimeout) || headersTimeout < 0)) {
      throw new InvalidArgumentError$k('invalid headersTimeout')
    }

    if (bodyTimeout != null && (!Number.isFinite(bodyTimeout) || bodyTimeout < 0)) {
      throw new InvalidArgumentError$k('invalid bodyTimeout')
    }

    if (reset != null && typeof reset !== 'boolean') {
      throw new InvalidArgumentError$k('invalid reset')
    }

    if (expectContinue != null && typeof expectContinue !== 'boolean') {
      throw new InvalidArgumentError$k('invalid expectContinue')
    }

    this.headersTimeout = headersTimeout;

    this.bodyTimeout = bodyTimeout;

    this.throwOnError = throwOnError === true;

    this.method = method;

    this.abort = null;

    if (body == null) {
      this.body = null;
    } else if (isStream(body)) {
      this.body = body;

      const rState = this.body._readableState;
      if (!rState || !rState.autoDestroy) {
        this.endHandler = function autoDestroy () {
          destroy(this);
        };
        this.body.on('end', this.endHandler);
      }

      this.errorHandler = err => {
        if (this.abort) {
          this.abort(err);
        } else {
          this.error = err;
        }
      };
      this.body.on('error', this.errorHandler);
    } else if (isBuffer(body)) {
      this.body = body.byteLength ? body : null;
    } else if (ArrayBuffer.isView(body)) {
      this.body = body.buffer.byteLength ? Buffer.from(body.buffer, body.byteOffset, body.byteLength) : null;
    } else if (body instanceof ArrayBuffer) {
      this.body = body.byteLength ? Buffer.from(body) : null;
    } else if (typeof body === 'string') {
      this.body = body.length ? Buffer.from(body) : null;
    } else if (isFormDataLike(body) || isIterable(body) || isBlobLike(body)) {
      this.body = body;
    } else {
      throw new InvalidArgumentError$k('body must be a string, a Buffer, a Readable stream, an iterable, or an async iterable')
    }

    this.completed = false;

    this.aborted = false;

    this.upgrade = upgrade || null;

    this.path = query ? buildURL$2(path, query) : path;

    this.origin = origin;

    this.idempotent = idempotent == null
      ? method === 'HEAD' || method === 'GET'
      : idempotent;

    this.blocking = blocking == null ? false : blocking;

    this.reset = reset == null ? null : reset;

    this.host = null;

    this.contentLength = null;

    this.contentType = null;

    this.headers = [];

    // Only for H2
    this.expectContinue = expectContinue != null ? expectContinue : false;

    if (Array.isArray(headers)) {
      if (headers.length % 2 !== 0) {
        throw new InvalidArgumentError$k('headers array must be even')
      }
      for (let i = 0; i < headers.length; i += 2) {
        processHeader(this, headers[i], headers[i + 1]);
      }
    } else if (headers && typeof headers === 'object') {
      if (headers[Symbol.iterator]) {
        for (const header of headers) {
          if (!Array.isArray(header) || header.length !== 2) {
            throw new InvalidArgumentError$k('headers must be in key-value pair format')
          }
          processHeader(this, header[0], header[1]);
        }
      } else {
        const keys = Object.keys(headers);
        for (let i = 0; i < keys.length; ++i) {
          processHeader(this, keys[i], headers[keys[i]]);
        }
      }
    } else if (headers != null) {
      throw new InvalidArgumentError$k('headers must be an object or an array')
    }

    validateHandler(handler, method, upgrade);

    this.servername = servername || getServerName(this.host);

    this[kHandler] = handler;

    if (channels$2.create.hasSubscribers) {
      channels$2.create.publish({ request: this });
    }
  }

  onBodySent (chunk) {
    if (this[kHandler].onBodySent) {
      try {
        return this[kHandler].onBodySent(chunk)
      } catch (err) {
        this.abort(err);
      }
    }
  }

  onRequestSent () {
    if (channels$2.bodySent.hasSubscribers) {
      channels$2.bodySent.publish({ request: this });
    }

    if (this[kHandler].onRequestSent) {
      try {
        return this[kHandler].onRequestSent()
      } catch (err) {
        this.abort(err);
      }
    }
  }

  onConnect (abort) {
    assert$a(!this.aborted);
    assert$a(!this.completed);

    if (this.error) {
      abort(this.error);
    } else {
      this.abort = abort;
      return this[kHandler].onConnect(abort)
    }
  }

  onResponseStarted () {
    return this[kHandler].onResponseStarted?.()
  }

  onHeaders (statusCode, headers, resume, statusText) {
    assert$a(!this.aborted);
    assert$a(!this.completed);

    if (channels$2.headers.hasSubscribers) {
      channels$2.headers.publish({ request: this, response: { statusCode, headers, statusText } });
    }

    try {
      return this[kHandler].onHeaders(statusCode, headers, resume, statusText)
    } catch (err) {
      this.abort(err);
    }
  }

  onData (chunk) {
    assert$a(!this.aborted);
    assert$a(!this.completed);

    try {
      return this[kHandler].onData(chunk)
    } catch (err) {
      this.abort(err);
      return false
    }
  }

  onUpgrade (statusCode, headers, socket) {
    assert$a(!this.aborted);
    assert$a(!this.completed);

    return this[kHandler].onUpgrade(statusCode, headers, socket)
  }

  onComplete (trailers) {
    this.onFinally();

    assert$a(!this.aborted);

    this.completed = true;
    if (channels$2.trailers.hasSubscribers) {
      channels$2.trailers.publish({ request: this, trailers });
    }

    try {
      return this[kHandler].onComplete(trailers)
    } catch (err) {
      // TODO (fix): This might be a bad idea?
      this.onError(err);
    }
  }

  onError (error) {
    this.onFinally();

    if (channels$2.error.hasSubscribers) {
      channels$2.error.publish({ request: this, error });
    }

    if (this.aborted) {
      return
    }
    this.aborted = true;

    return this[kHandler].onError(error)
  }

  onFinally () {
    if (this.errorHandler) {
      this.body.off('error', this.errorHandler);
      this.errorHandler = null;
    }

    if (this.endHandler) {
      this.body.off('end', this.endHandler);
      this.endHandler = null;
    }
  }

  addHeader (key, value) {
    processHeader(this, key, value);
    return this
  }
};

function processHeader (request, key, val) {
  if (val && (typeof val === 'object' && !Array.isArray(val))) {
    throw new InvalidArgumentError$k(`invalid ${key} header`)
  } else if (val === undefined) {
    return
  }

  let headerName = headerNameLowerCasedRecord[key];

  if (headerName === undefined) {
    headerName = key.toLowerCase();
    if (headerNameLowerCasedRecord[headerName] === undefined && !isValidHTTPToken(headerName)) {
      throw new InvalidArgumentError$k('invalid header key')
    }
  }

  if (Array.isArray(val)) {
    const arr = [];
    for (let i = 0; i < val.length; i++) {
      if (typeof val[i] === 'string') {
        if (!isValidHeaderChar(val[i])) {
          throw new InvalidArgumentError$k(`invalid ${key} header`)
        }
        arr.push(val[i]);
      } else if (val[i] === null) {
        arr.push('');
      } else if (typeof val[i] === 'object') {
        throw new InvalidArgumentError$k(`invalid ${key} header`)
      } else {
        arr.push(`${val[i]}`);
      }
    }
    val = arr;
  } else if (typeof val === 'string') {
    if (!isValidHeaderChar(val)) {
      throw new InvalidArgumentError$k(`invalid ${key} header`)
    }
  } else if (val === null) {
    val = '';
  } else if (typeof val === 'object') {
    throw new InvalidArgumentError$k(`invalid ${key} header`)
  } else {
    val = `${val}`;
  }

  if (request.host === null && headerName === 'host') {
    if (typeof val !== 'string') {
      throw new InvalidArgumentError$k('invalid host header')
    }
    // Consumed by Client
    request.host = val;
  } else if (request.contentLength === null && headerName === 'content-length') {
    request.contentLength = parseInt(val, 10);
    if (!Number.isFinite(request.contentLength)) {
      throw new InvalidArgumentError$k('invalid content-length header')
    }
  } else if (request.contentType === null && headerName === 'content-type') {
    request.contentType = val;
    request.headers.push(key, val);
  } else if (headerName === 'transfer-encoding' || headerName === 'keep-alive' || headerName === 'upgrade') {
    throw new InvalidArgumentError$k(`invalid ${headerName} header`)
  } else if (headerName === 'connection') {
    const value = typeof val === 'string' ? val.toLowerCase() : null;
    if (value !== 'close' && value !== 'keep-alive') {
      throw new InvalidArgumentError$k('invalid connection header')
    }

    if (value === 'close') {
      request.reset = true;
    }
  } else if (headerName === 'expect') {
    throw new NotSupportedError$1('expect header not supported')
  } else {
    request.headers.push(key, val);
  }
}

var request$3 = Request$2;

const EventEmitter = require$$0$4;

let Dispatcher$4 = class Dispatcher extends EventEmitter {
  dispatch () {
    throw new Error('not implemented')
  }

  close () {
    throw new Error('not implemented')
  }

  destroy () {
    throw new Error('not implemented')
  }

  compose (...args) {
    // So we handle [interceptor1, interceptor2] or interceptor1, interceptor2, ...
    const interceptors = Array.isArray(args[0]) ? args[0] : args;
    let dispatch = this.dispatch.bind(this);

    for (const interceptor of interceptors) {
      if (interceptor == null) {
        continue
      }

      if (typeof interceptor !== 'function') {
        throw new TypeError(`invalid interceptor, expected function received ${typeof interceptor}`)
      }

      dispatch = interceptor(dispatch);

      if (dispatch == null || typeof dispatch !== 'function' || dispatch.length !== 2) {
        throw new TypeError('invalid interceptor')
      }
    }

    return new ComposedDispatcher(this, dispatch)
  }
};

class ComposedDispatcher extends Dispatcher$4 {
  #dispatcher = null
  #dispatch = null

  constructor (dispatcher, dispatch) {
    super();
    this.#dispatcher = dispatcher;
    this.#dispatch = dispatch;
  }

  dispatch (...args) {
    this.#dispatch(...args);
  }

  close (...args) {
    return this.#dispatcher.close(...args)
  }

  destroy (...args) {
    return this.#dispatcher.destroy(...args)
  }
}

var dispatcher = Dispatcher$4;

const Dispatcher$3 = dispatcher;
const {
  ClientDestroyedError: ClientDestroyedError$1,
  ClientClosedError,
  InvalidArgumentError: InvalidArgumentError$j
} = errors$1;
const { kDestroy: kDestroy$4, kClose: kClose$6, kDispatch: kDispatch$3, kInterceptors: kInterceptors$5 } = symbols$4;

const kDestroyed = Symbol('destroyed');
const kClosed = Symbol('closed');
const kOnDestroyed = Symbol('onDestroyed');
const kOnClosed = Symbol('onClosed');
const kInterceptedDispatch = Symbol('Intercepted Dispatch');

let DispatcherBase$4 = class DispatcherBase extends Dispatcher$3 {
  constructor () {
    super();

    this[kDestroyed] = false;
    this[kOnDestroyed] = null;
    this[kClosed] = false;
    this[kOnClosed] = [];
  }

  get destroyed () {
    return this[kDestroyed]
  }

  get closed () {
    return this[kClosed]
  }

  get interceptors () {
    return this[kInterceptors$5]
  }

  set interceptors (newInterceptors) {
    if (newInterceptors) {
      for (let i = newInterceptors.length - 1; i >= 0; i--) {
        const interceptor = this[kInterceptors$5][i];
        if (typeof interceptor !== 'function') {
          throw new InvalidArgumentError$j('interceptor must be an function')
        }
      }
    }

    this[kInterceptors$5] = newInterceptors;
  }

  close (callback) {
    if (callback === undefined) {
      return new Promise((resolve, reject) => {
        this.close((err, data) => {
          return err ? reject(err) : resolve(data)
        });
      })
    }

    if (typeof callback !== 'function') {
      throw new InvalidArgumentError$j('invalid callback')
    }

    if (this[kDestroyed]) {
      queueMicrotask(() => callback(new ClientDestroyedError$1(), null));
      return
    }

    if (this[kClosed]) {
      if (this[kOnClosed]) {
        this[kOnClosed].push(callback);
      } else {
        queueMicrotask(() => callback(null, null));
      }
      return
    }

    this[kClosed] = true;
    this[kOnClosed].push(callback);

    const onClosed = () => {
      const callbacks = this[kOnClosed];
      this[kOnClosed] = null;
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i](null, null);
      }
    };

    // Should not error.
    this[kClose$6]()
      .then(() => this.destroy())
      .then(() => {
        queueMicrotask(onClosed);
      });
  }

  destroy (err, callback) {
    if (typeof err === 'function') {
      callback = err;
      err = null;
    }

    if (callback === undefined) {
      return new Promise((resolve, reject) => {
        this.destroy(err, (err, data) => {
          return err ? /* istanbul ignore next: should never error */ reject(err) : resolve(data)
        });
      })
    }

    if (typeof callback !== 'function') {
      throw new InvalidArgumentError$j('invalid callback')
    }

    if (this[kDestroyed]) {
      if (this[kOnDestroyed]) {
        this[kOnDestroyed].push(callback);
      } else {
        queueMicrotask(() => callback(null, null));
      }
      return
    }

    if (!err) {
      err = new ClientDestroyedError$1();
    }

    this[kDestroyed] = true;
    this[kOnDestroyed] = this[kOnDestroyed] || [];
    this[kOnDestroyed].push(callback);

    const onDestroyed = () => {
      const callbacks = this[kOnDestroyed];
      this[kOnDestroyed] = null;
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i](null, null);
      }
    };

    // Should not error.
    this[kDestroy$4](err).then(() => {
      queueMicrotask(onDestroyed);
    });
  }

  [kInterceptedDispatch] (opts, handler) {
    if (!this[kInterceptors$5] || this[kInterceptors$5].length === 0) {
      this[kInterceptedDispatch] = this[kDispatch$3];
      return this[kDispatch$3](opts, handler)
    }

    let dispatch = this[kDispatch$3].bind(this);
    for (let i = this[kInterceptors$5].length - 1; i >= 0; i--) {
      dispatch = this[kInterceptors$5][i](dispatch);
    }
    this[kInterceptedDispatch] = dispatch;
    return dispatch(opts, handler)
  }

  dispatch (opts, handler) {
    if (!handler || typeof handler !== 'object') {
      throw new InvalidArgumentError$j('handler must be an object')
    }

    try {
      if (!opts || typeof opts !== 'object') {
        throw new InvalidArgumentError$j('opts must be an object.')
      }

      if (this[kDestroyed] || this[kOnDestroyed]) {
        throw new ClientDestroyedError$1()
      }

      if (this[kClosed]) {
        throw new ClientClosedError()
      }

      return this[kInterceptedDispatch](opts, handler)
    } catch (err) {
      if (typeof handler.onError !== 'function') {
        throw new InvalidArgumentError$j('invalid onError method')
      }

      handler.onError(err);

      return false
    }
  }
};

var dispatcherBase = DispatcherBase$4;

const net$1 = require$$4;
const assert$9 = require$$0;
const util$k = util$m;
const { InvalidArgumentError: InvalidArgumentError$i, ConnectTimeoutError } = errors$1;

let tls; // include tls conditionally since it is not always available

// TODO: session re-use does not wait for the first
// connection to resolve the session and might therefore
// resolve the same servername multiple times even when
// re-use is enabled.

let SessionCache;
// FIXME: remove workaround when the Node bug is fixed
// https://github.com/nodejs/node/issues/49344#issuecomment-1741776308
if (commonjsGlobal.FinalizationRegistry && !(process.env.NODE_V8_COVERAGE || process.env.UNDICI_NO_FG)) {
  SessionCache = class WeakSessionCache {
    constructor (maxCachedSessions) {
      this._maxCachedSessions = maxCachedSessions;
      this._sessionCache = new Map();
      this._sessionRegistry = new commonjsGlobal.FinalizationRegistry((key) => {
        if (this._sessionCache.size < this._maxCachedSessions) {
          return
        }

        const ref = this._sessionCache.get(key);
        if (ref !== undefined && ref.deref() === undefined) {
          this._sessionCache.delete(key);
        }
      });
    }

    get (sessionKey) {
      const ref = this._sessionCache.get(sessionKey);
      return ref ? ref.deref() : null
    }

    set (sessionKey, session) {
      if (this._maxCachedSessions === 0) {
        return
      }

      this._sessionCache.set(sessionKey, new WeakRef(session));
      this._sessionRegistry.register(session, sessionKey);
    }
  };
} else {
  SessionCache = class SimpleSessionCache {
    constructor (maxCachedSessions) {
      this._maxCachedSessions = maxCachedSessions;
      this._sessionCache = new Map();
    }

    get (sessionKey) {
      return this._sessionCache.get(sessionKey)
    }

    set (sessionKey, session) {
      if (this._maxCachedSessions === 0) {
        return
      }

      if (this._sessionCache.size >= this._maxCachedSessions) {
        // remove the oldest session
        const { value: oldestKey } = this._sessionCache.keys().next();
        this._sessionCache.delete(oldestKey);
      }

      this._sessionCache.set(sessionKey, session);
    }
  };
}

function buildConnector$4 ({ allowH2, maxCachedSessions, socketPath, timeout, ...opts }) {
  if (maxCachedSessions != null && (!Number.isInteger(maxCachedSessions) || maxCachedSessions < 0)) {
    throw new InvalidArgumentError$i('maxCachedSessions must be a positive integer or zero')
  }

  const options = { path: socketPath, ...opts };
  const sessionCache = new SessionCache(maxCachedSessions == null ? 100 : maxCachedSessions);
  timeout = timeout == null ? 10e3 : timeout;
  allowH2 = allowH2 != null ? allowH2 : false;
  return function connect ({ hostname, host, protocol, port, servername, localAddress, httpSocket }, callback) {
    let socket;
    if (protocol === 'https:') {
      if (!tls) {
        tls = require$$4$1;
      }
      servername = servername || options.servername || util$k.getServerName(host) || null;

      const sessionKey = servername || hostname;
      const session = sessionCache.get(sessionKey) || null;

      assert$9(sessionKey);

      socket = tls.connect({
        highWaterMark: 16384, // TLS in node can't have bigger HWM anyway...
        ...options,
        servername,
        session,
        localAddress,
        // TODO(HTTP/2): Add support for h2c
        ALPNProtocols: allowH2 ? ['http/1.1', 'h2'] : ['http/1.1'],
        socket: httpSocket, // upgrade socket connection
        port: port || 443,
        host: hostname
      });

      socket
        .on('session', function (session) {
          // TODO (fix): Can a session become invalid once established? Don't think so?
          sessionCache.set(sessionKey, session);
        });
    } else {
      assert$9(!httpSocket, 'httpSocket can only be sent on TLS update');
      socket = net$1.connect({
        highWaterMark: 64 * 1024, // Same as nodejs fs streams.
        ...options,
        localAddress,
        port: port || 80,
        host: hostname
      });
    }

    // Set TCP keep alive options on the socket here instead of in connect() for the case of assigning the socket
    if (options.keepAlive == null || options.keepAlive) {
      const keepAliveInitialDelay = options.keepAliveInitialDelay === undefined ? 60e3 : options.keepAliveInitialDelay;
      socket.setKeepAlive(true, keepAliveInitialDelay);
    }

    const cancelTimeout = setupTimeout(() => onConnectTimeout(socket), timeout);

    socket
      .setNoDelay(true)
      .once(protocol === 'https:' ? 'secureConnect' : 'connect', function () {
        cancelTimeout();

        if (callback) {
          const cb = callback;
          callback = null;
          cb(null, this);
        }
      })
      .on('error', function (err) {
        cancelTimeout();

        if (callback) {
          const cb = callback;
          callback = null;
          cb(err);
        }
      });

    return socket
  }
}

function setupTimeout (onConnectTimeout, timeout) {
  if (!timeout) {
    return () => {}
  }

  let s1 = null;
  let s2 = null;
  const timeoutId = setTimeout(() => {
    // setImmediate is added to make sure that we priotorise socket error events over timeouts
    s1 = setImmediate(() => {
      if (process.platform === 'win32') {
        // Windows needs an extra setImmediate probably due to implementation differences in the socket logic
        s2 = setImmediate(() => onConnectTimeout());
      } else {
        onConnectTimeout();
      }
    });
  }, timeout);
  return () => {
    clearTimeout(timeoutId);
    clearImmediate(s1);
    clearImmediate(s2);
  }
}

function onConnectTimeout (socket) {
  let message = 'Connect Timeout Error';
  if (Array.isArray(socket.autoSelectFamilyAttemptedAddresses)) {
    message += ` (attempted addresses: ${socket.autoSelectFamilyAttemptedAddresses.join(', ')})`;
  }
  util$k.destroy(socket, new ConnectTimeoutError(message));
}

var connect$3 = buildConnector$4;

let fastNow = Date.now();
let fastNowTimeout;

const fastTimers = [];

function onTimeout () {
  fastNow = Date.now();

  let len = fastTimers.length;
  let idx = 0;
  while (idx < len) {
    const timer = fastTimers[idx];

    if (timer.state === 0) {
      timer.state = fastNow + timer.delay;
    } else if (timer.state > 0 && fastNow >= timer.state) {
      timer.state = -1;
      timer.callback(timer.opaque);
    }

    if (timer.state === -1) {
      timer.state = -2;
      if (idx !== len - 1) {
        fastTimers[idx] = fastTimers.pop();
      } else {
        fastTimers.pop();
      }
      len -= 1;
    } else {
      idx += 1;
    }
  }

  if (fastTimers.length > 0) {
    refreshTimeout();
  }
}

function refreshTimeout () {
  if (fastNowTimeout?.refresh) {
    fastNowTimeout.refresh();
  } else {
    clearTimeout(fastNowTimeout);
    fastNowTimeout = setTimeout(onTimeout, 1e3);
    if (fastNowTimeout.unref) {
      fastNowTimeout.unref();
    }
  }
}

class Timeout {
  constructor (callback, delay, opaque) {
    this.callback = callback;
    this.delay = delay;
    this.opaque = opaque;

    //  -2 not in timer list
    //  -1 in timer list but inactive
    //   0 in timer list waiting for time
    // > 0 in timer list waiting for time to expire
    this.state = -2;

    this.refresh();
  }

  refresh () {
    if (this.state === -2) {
      fastTimers.push(this);
      if (!fastNowTimeout || fastTimers.length === 1) {
        refreshTimeout();
      }
    }

    this.state = 0;
  }

  clear () {
    this.state = -1;
  }
}

var timers$1 = {
  setTimeout (callback, delay, opaque) {
    return delay < 1e3
      ? setTimeout(callback, delay, opaque)
      : new Timeout(callback, delay, opaque)
  },
  clearTimeout (timeout) {
    if (timeout instanceof Timeout) {
      timeout.clear();
    } else {
      clearTimeout(timeout);
    }
  }
};

var constants$4 = {};

var utils = {};

Object.defineProperty(utils, "__esModule", { value: true });
utils.enumToMap = void 0;
function enumToMap(obj) {
    const res = {};
    Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (typeof value === 'number') {
            res[key] = value;
        }
    });
    return res;
}
utils.enumToMap = enumToMap;

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SPECIAL_HEADERS = exports.HEADER_STATE = exports.MINOR = exports.MAJOR = exports.CONNECTION_TOKEN_CHARS = exports.HEADER_CHARS = exports.TOKEN = exports.STRICT_TOKEN = exports.HEX = exports.URL_CHAR = exports.STRICT_URL_CHAR = exports.USERINFO_CHARS = exports.MARK = exports.ALPHANUM = exports.NUM = exports.HEX_MAP = exports.NUM_MAP = exports.ALPHA = exports.FINISH = exports.H_METHOD_MAP = exports.METHOD_MAP = exports.METHODS_RTSP = exports.METHODS_ICE = exports.METHODS_HTTP = exports.METHODS = exports.LENIENT_FLAGS = exports.FLAGS = exports.TYPE = exports.ERROR = void 0;
	const utils_1 = utils;
	(function (ERROR) {
	    ERROR[ERROR["OK"] = 0] = "OK";
	    ERROR[ERROR["INTERNAL"] = 1] = "INTERNAL";
	    ERROR[ERROR["STRICT"] = 2] = "STRICT";
	    ERROR[ERROR["LF_EXPECTED"] = 3] = "LF_EXPECTED";
	    ERROR[ERROR["UNEXPECTED_CONTENT_LENGTH"] = 4] = "UNEXPECTED_CONTENT_LENGTH";
	    ERROR[ERROR["CLOSED_CONNECTION"] = 5] = "CLOSED_CONNECTION";
	    ERROR[ERROR["INVALID_METHOD"] = 6] = "INVALID_METHOD";
	    ERROR[ERROR["INVALID_URL"] = 7] = "INVALID_URL";
	    ERROR[ERROR["INVALID_CONSTANT"] = 8] = "INVALID_CONSTANT";
	    ERROR[ERROR["INVALID_VERSION"] = 9] = "INVALID_VERSION";
	    ERROR[ERROR["INVALID_HEADER_TOKEN"] = 10] = "INVALID_HEADER_TOKEN";
	    ERROR[ERROR["INVALID_CONTENT_LENGTH"] = 11] = "INVALID_CONTENT_LENGTH";
	    ERROR[ERROR["INVALID_CHUNK_SIZE"] = 12] = "INVALID_CHUNK_SIZE";
	    ERROR[ERROR["INVALID_STATUS"] = 13] = "INVALID_STATUS";
	    ERROR[ERROR["INVALID_EOF_STATE"] = 14] = "INVALID_EOF_STATE";
	    ERROR[ERROR["INVALID_TRANSFER_ENCODING"] = 15] = "INVALID_TRANSFER_ENCODING";
	    ERROR[ERROR["CB_MESSAGE_BEGIN"] = 16] = "CB_MESSAGE_BEGIN";
	    ERROR[ERROR["CB_HEADERS_COMPLETE"] = 17] = "CB_HEADERS_COMPLETE";
	    ERROR[ERROR["CB_MESSAGE_COMPLETE"] = 18] = "CB_MESSAGE_COMPLETE";
	    ERROR[ERROR["CB_CHUNK_HEADER"] = 19] = "CB_CHUNK_HEADER";
	    ERROR[ERROR["CB_CHUNK_COMPLETE"] = 20] = "CB_CHUNK_COMPLETE";
	    ERROR[ERROR["PAUSED"] = 21] = "PAUSED";
	    ERROR[ERROR["PAUSED_UPGRADE"] = 22] = "PAUSED_UPGRADE";
	    ERROR[ERROR["PAUSED_H2_UPGRADE"] = 23] = "PAUSED_H2_UPGRADE";
	    ERROR[ERROR["USER"] = 24] = "USER";
	})(exports.ERROR || (exports.ERROR = {}));
	(function (TYPE) {
	    TYPE[TYPE["BOTH"] = 0] = "BOTH";
	    TYPE[TYPE["REQUEST"] = 1] = "REQUEST";
	    TYPE[TYPE["RESPONSE"] = 2] = "RESPONSE";
	})(exports.TYPE || (exports.TYPE = {}));
	(function (FLAGS) {
	    FLAGS[FLAGS["CONNECTION_KEEP_ALIVE"] = 1] = "CONNECTION_KEEP_ALIVE";
	    FLAGS[FLAGS["CONNECTION_CLOSE"] = 2] = "CONNECTION_CLOSE";
	    FLAGS[FLAGS["CONNECTION_UPGRADE"] = 4] = "CONNECTION_UPGRADE";
	    FLAGS[FLAGS["CHUNKED"] = 8] = "CHUNKED";
	    FLAGS[FLAGS["UPGRADE"] = 16] = "UPGRADE";
	    FLAGS[FLAGS["CONTENT_LENGTH"] = 32] = "CONTENT_LENGTH";
	    FLAGS[FLAGS["SKIPBODY"] = 64] = "SKIPBODY";
	    FLAGS[FLAGS["TRAILING"] = 128] = "TRAILING";
	    // 1 << 8 is unused
	    FLAGS[FLAGS["TRANSFER_ENCODING"] = 512] = "TRANSFER_ENCODING";
	})(exports.FLAGS || (exports.FLAGS = {}));
	(function (LENIENT_FLAGS) {
	    LENIENT_FLAGS[LENIENT_FLAGS["HEADERS"] = 1] = "HEADERS";
	    LENIENT_FLAGS[LENIENT_FLAGS["CHUNKED_LENGTH"] = 2] = "CHUNKED_LENGTH";
	    LENIENT_FLAGS[LENIENT_FLAGS["KEEP_ALIVE"] = 4] = "KEEP_ALIVE";
	})(exports.LENIENT_FLAGS || (exports.LENIENT_FLAGS = {}));
	var METHODS;
	(function (METHODS) {
	    METHODS[METHODS["DELETE"] = 0] = "DELETE";
	    METHODS[METHODS["GET"] = 1] = "GET";
	    METHODS[METHODS["HEAD"] = 2] = "HEAD";
	    METHODS[METHODS["POST"] = 3] = "POST";
	    METHODS[METHODS["PUT"] = 4] = "PUT";
	    /* pathological */
	    METHODS[METHODS["CONNECT"] = 5] = "CONNECT";
	    METHODS[METHODS["OPTIONS"] = 6] = "OPTIONS";
	    METHODS[METHODS["TRACE"] = 7] = "TRACE";
	    /* WebDAV */
	    METHODS[METHODS["COPY"] = 8] = "COPY";
	    METHODS[METHODS["LOCK"] = 9] = "LOCK";
	    METHODS[METHODS["MKCOL"] = 10] = "MKCOL";
	    METHODS[METHODS["MOVE"] = 11] = "MOVE";
	    METHODS[METHODS["PROPFIND"] = 12] = "PROPFIND";
	    METHODS[METHODS["PROPPATCH"] = 13] = "PROPPATCH";
	    METHODS[METHODS["SEARCH"] = 14] = "SEARCH";
	    METHODS[METHODS["UNLOCK"] = 15] = "UNLOCK";
	    METHODS[METHODS["BIND"] = 16] = "BIND";
	    METHODS[METHODS["REBIND"] = 17] = "REBIND";
	    METHODS[METHODS["UNBIND"] = 18] = "UNBIND";
	    METHODS[METHODS["ACL"] = 19] = "ACL";
	    /* subversion */
	    METHODS[METHODS["REPORT"] = 20] = "REPORT";
	    METHODS[METHODS["MKACTIVITY"] = 21] = "MKACTIVITY";
	    METHODS[METHODS["CHECKOUT"] = 22] = "CHECKOUT";
	    METHODS[METHODS["MERGE"] = 23] = "MERGE";
	    /* upnp */
	    METHODS[METHODS["M-SEARCH"] = 24] = "M-SEARCH";
	    METHODS[METHODS["NOTIFY"] = 25] = "NOTIFY";
	    METHODS[METHODS["SUBSCRIBE"] = 26] = "SUBSCRIBE";
	    METHODS[METHODS["UNSUBSCRIBE"] = 27] = "UNSUBSCRIBE";
	    /* RFC-5789 */
	    METHODS[METHODS["PATCH"] = 28] = "PATCH";
	    METHODS[METHODS["PURGE"] = 29] = "PURGE";
	    /* CalDAV */
	    METHODS[METHODS["MKCALENDAR"] = 30] = "MKCALENDAR";
	    /* RFC-2068, section 19.6.1.2 */
	    METHODS[METHODS["LINK"] = 31] = "LINK";
	    METHODS[METHODS["UNLINK"] = 32] = "UNLINK";
	    /* icecast */
	    METHODS[METHODS["SOURCE"] = 33] = "SOURCE";
	    /* RFC-7540, section 11.6 */
	    METHODS[METHODS["PRI"] = 34] = "PRI";
	    /* RFC-2326 RTSP */
	    METHODS[METHODS["DESCRIBE"] = 35] = "DESCRIBE";
	    METHODS[METHODS["ANNOUNCE"] = 36] = "ANNOUNCE";
	    METHODS[METHODS["SETUP"] = 37] = "SETUP";
	    METHODS[METHODS["PLAY"] = 38] = "PLAY";
	    METHODS[METHODS["PAUSE"] = 39] = "PAUSE";
	    METHODS[METHODS["TEARDOWN"] = 40] = "TEARDOWN";
	    METHODS[METHODS["GET_PARAMETER"] = 41] = "GET_PARAMETER";
	    METHODS[METHODS["SET_PARAMETER"] = 42] = "SET_PARAMETER";
	    METHODS[METHODS["REDIRECT"] = 43] = "REDIRECT";
	    METHODS[METHODS["RECORD"] = 44] = "RECORD";
	    /* RAOP */
	    METHODS[METHODS["FLUSH"] = 45] = "FLUSH";
	})(METHODS = exports.METHODS || (exports.METHODS = {}));
	exports.METHODS_HTTP = [
	    METHODS.DELETE,
	    METHODS.GET,
	    METHODS.HEAD,
	    METHODS.POST,
	    METHODS.PUT,
	    METHODS.CONNECT,
	    METHODS.OPTIONS,
	    METHODS.TRACE,
	    METHODS.COPY,
	    METHODS.LOCK,
	    METHODS.MKCOL,
	    METHODS.MOVE,
	    METHODS.PROPFIND,
	    METHODS.PROPPATCH,
	    METHODS.SEARCH,
	    METHODS.UNLOCK,
	    METHODS.BIND,
	    METHODS.REBIND,
	    METHODS.UNBIND,
	    METHODS.ACL,
	    METHODS.REPORT,
	    METHODS.MKACTIVITY,
	    METHODS.CHECKOUT,
	    METHODS.MERGE,
	    METHODS['M-SEARCH'],
	    METHODS.NOTIFY,
	    METHODS.SUBSCRIBE,
	    METHODS.UNSUBSCRIBE,
	    METHODS.PATCH,
	    METHODS.PURGE,
	    METHODS.MKCALENDAR,
	    METHODS.LINK,
	    METHODS.UNLINK,
	    METHODS.PRI,
	    // TODO(indutny): should we allow it with HTTP?
	    METHODS.SOURCE,
	];
	exports.METHODS_ICE = [
	    METHODS.SOURCE,
	];
	exports.METHODS_RTSP = [
	    METHODS.OPTIONS,
	    METHODS.DESCRIBE,
	    METHODS.ANNOUNCE,
	    METHODS.SETUP,
	    METHODS.PLAY,
	    METHODS.PAUSE,
	    METHODS.TEARDOWN,
	    METHODS.GET_PARAMETER,
	    METHODS.SET_PARAMETER,
	    METHODS.REDIRECT,
	    METHODS.RECORD,
	    METHODS.FLUSH,
	    // For AirPlay
	    METHODS.GET,
	    METHODS.POST,
	];
	exports.METHOD_MAP = utils_1.enumToMap(METHODS);
	exports.H_METHOD_MAP = {};
	Object.keys(exports.METHOD_MAP).forEach((key) => {
	    if (/^H/.test(key)) {
	        exports.H_METHOD_MAP[key] = exports.METHOD_MAP[key];
	    }
	});
	(function (FINISH) {
	    FINISH[FINISH["SAFE"] = 0] = "SAFE";
	    FINISH[FINISH["SAFE_WITH_CB"] = 1] = "SAFE_WITH_CB";
	    FINISH[FINISH["UNSAFE"] = 2] = "UNSAFE";
	})(exports.FINISH || (exports.FINISH = {}));
	exports.ALPHA = [];
	for (let i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++) {
	    // Upper case
	    exports.ALPHA.push(String.fromCharCode(i));
	    // Lower case
	    exports.ALPHA.push(String.fromCharCode(i + 0x20));
	}
	exports.NUM_MAP = {
	    0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
	    5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
	};
	exports.HEX_MAP = {
	    0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
	    5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
	    A: 0XA, B: 0XB, C: 0XC, D: 0XD, E: 0XE, F: 0XF,
	    a: 0xa, b: 0xb, c: 0xc, d: 0xd, e: 0xe, f: 0xf,
	};
	exports.NUM = [
	    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	];
	exports.ALPHANUM = exports.ALPHA.concat(exports.NUM);
	exports.MARK = ['-', '_', '.', '!', '~', '*', '\'', '(', ')'];
	exports.USERINFO_CHARS = exports.ALPHANUM
	    .concat(exports.MARK)
	    .concat(['%', ';', ':', '&', '=', '+', '$', ',']);
	// TODO(indutny): use RFC
	exports.STRICT_URL_CHAR = [
	    '!', '"', '$', '%', '&', '\'',
	    '(', ')', '*', '+', ',', '-', '.', '/',
	    ':', ';', '<', '=', '>',
	    '@', '[', '\\', ']', '^', '_',
	    '`',
	    '{', '|', '}', '~',
	].concat(exports.ALPHANUM);
	exports.URL_CHAR = exports.STRICT_URL_CHAR
	    .concat(['\t', '\f']);
	// All characters with 0x80 bit set to 1
	for (let i = 0x80; i <= 0xff; i++) {
	    exports.URL_CHAR.push(i);
	}
	exports.HEX = exports.NUM.concat(['a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F']);
	/* Tokens as defined by rfc 2616. Also lowercases them.
	 *        token       = 1*<any CHAR except CTLs or separators>
	 *     separators     = "(" | ")" | "<" | ">" | "@"
	 *                    | "," | ";" | ":" | "\" | <">
	 *                    | "/" | "[" | "]" | "?" | "="
	 *                    | "{" | "}" | SP | HT
	 */
	exports.STRICT_TOKEN = [
	    '!', '#', '$', '%', '&', '\'',
	    '*', '+', '-', '.',
	    '^', '_', '`',
	    '|', '~',
	].concat(exports.ALPHANUM);
	exports.TOKEN = exports.STRICT_TOKEN.concat([' ']);
	/*
	 * Verify that a char is a valid visible (printable) US-ASCII
	 * character or %x80-FF
	 */
	exports.HEADER_CHARS = ['\t'];
	for (let i = 32; i <= 255; i++) {
	    if (i !== 127) {
	        exports.HEADER_CHARS.push(i);
	    }
	}
	// ',' = \x44
	exports.CONNECTION_TOKEN_CHARS = exports.HEADER_CHARS.filter((c) => c !== 44);
	exports.MAJOR = exports.NUM_MAP;
	exports.MINOR = exports.MAJOR;
	var HEADER_STATE;
	(function (HEADER_STATE) {
	    HEADER_STATE[HEADER_STATE["GENERAL"] = 0] = "GENERAL";
	    HEADER_STATE[HEADER_STATE["CONNECTION"] = 1] = "CONNECTION";
	    HEADER_STATE[HEADER_STATE["CONTENT_LENGTH"] = 2] = "CONTENT_LENGTH";
	    HEADER_STATE[HEADER_STATE["TRANSFER_ENCODING"] = 3] = "TRANSFER_ENCODING";
	    HEADER_STATE[HEADER_STATE["UPGRADE"] = 4] = "UPGRADE";
	    HEADER_STATE[HEADER_STATE["CONNECTION_KEEP_ALIVE"] = 5] = "CONNECTION_KEEP_ALIVE";
	    HEADER_STATE[HEADER_STATE["CONNECTION_CLOSE"] = 6] = "CONNECTION_CLOSE";
	    HEADER_STATE[HEADER_STATE["CONNECTION_UPGRADE"] = 7] = "CONNECTION_UPGRADE";
	    HEADER_STATE[HEADER_STATE["TRANSFER_ENCODING_CHUNKED"] = 8] = "TRANSFER_ENCODING_CHUNKED";
	})(HEADER_STATE = exports.HEADER_STATE || (exports.HEADER_STATE = {}));
	exports.SPECIAL_HEADERS = {
	    'connection': HEADER_STATE.CONNECTION,
	    'content-length': HEADER_STATE.CONTENT_LENGTH,
	    'proxy-connection': HEADER_STATE.CONNECTION,
	    'transfer-encoding': HEADER_STATE.TRANSFER_ENCODING,
	    'upgrade': HEADER_STATE.UPGRADE,
	};
	
} (constants$4));

var llhttpWasm;
var hasRequiredLlhttpWasm;

function requireLlhttpWasm () {
	if (hasRequiredLlhttpWasm) return llhttpWasm;
	hasRequiredLlhttpWasm = 1;
	const { Buffer } = require$$6;

	llhttpWasm = Buffer.from('AGFzbQEAAAABMAhgAX8Bf2ADf39/AX9gBH9/f38Bf2AAAGADf39/AGABfwBgAn9/AGAGf39/f39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQACA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAA0ZFAwMEAAAFAAAAAAAABQEFAAUFBQAABgAAAAAGBgYGAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAAABAQcAAAUFAwABBAUBcAESEgUDAQACBggBfwFBgNQECwfRBSIGbWVtb3J5AgALX2luaXRpYWxpemUACRlfX2luZGlyZWN0X2Z1bmN0aW9uX3RhYmxlAQALbGxodHRwX2luaXQAChhsbGh0dHBfc2hvdWxkX2tlZXBfYWxpdmUAQQxsbGh0dHBfYWxsb2MADAZtYWxsb2MARgtsbGh0dHBfZnJlZQANBGZyZWUASA9sbGh0dHBfZ2V0X3R5cGUADhVsbGh0dHBfZ2V0X2h0dHBfbWFqb3IADxVsbGh0dHBfZ2V0X2h0dHBfbWlub3IAEBFsbGh0dHBfZ2V0X21ldGhvZAARFmxsaHR0cF9nZXRfc3RhdHVzX2NvZGUAEhJsbGh0dHBfZ2V0X3VwZ3JhZGUAEwxsbGh0dHBfcmVzZXQAFA5sbGh0dHBfZXhlY3V0ZQAVFGxsaHR0cF9zZXR0aW5nc19pbml0ABYNbGxodHRwX2ZpbmlzaAAXDGxsaHR0cF9wYXVzZQAYDWxsaHR0cF9yZXN1bWUAGRtsbGh0dHBfcmVzdW1lX2FmdGVyX3VwZ3JhZGUAGhBsbGh0dHBfZ2V0X2Vycm5vABsXbGxodHRwX2dldF9lcnJvcl9yZWFzb24AHBdsbGh0dHBfc2V0X2Vycm9yX3JlYXNvbgAdFGxsaHR0cF9nZXRfZXJyb3JfcG9zAB4RbGxodHRwX2Vycm5vX25hbWUAHxJsbGh0dHBfbWV0aG9kX25hbWUAIBJs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ADcDACAAQShqQgA3AwAgAEEgakIANwMAIABBEGpCADcDACAAQQhqQgA3AwAgAEHdATYCHEEAC3sBAX8CQCAAKAIMIgMNAAJAIAAoAgRFDQAgACABNgIECwJAIAAgASACEMSAgIAAIgMNACAAKAIMDwsgACADNgIcQQAhAyAAKAIEIgFFDQAgACABIAIgACgCCBGBgICAAAAiAUUNACAAIAI2AhQgACABNgIMIAEhAwsgAwvk8wEDDn8DfgR/I4CAgIAAQRBrIgMkgICAgAAgASEEIAEhBSABIQYgASEHIAEhCCABIQkgASEKIAEhCyABIQwgASENIAEhDiABIQ8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgACgCHCIQQX9qDt0B2gEB2QECAwQFBgcICQoLDA0O2AEPENcBERLWARMUFRYXGBkaG+AB3wEcHR7VAR8gISIjJCXUASYnKCkqKyzTAdIBLS7RAdABLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVG2wFHSElKzwHOAUvNAUzMAU1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4ABgQGCAYMBhAGFAYYBhwGIAYkB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QAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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FCAAIBA2AgxBACEQDLIBCyAAKAIEIRAgAEEANgIEAkAgACAQIAEQp4CAgAAiEA0AIAEhAQxNCyAAQdMANgIcIAAgATYCFCAAIBA2AgxBACEQDLEBCyAAKAIEIRAgAEEANgIEAkAgACAQIAEQp4CAgAAiEA0AIAEhAQxRCyAAQeUANgIcIAAgATYCFCAAIBA2AgxBACEQDLABCyAAQQA2AhwgACABNgIUIABBxoqAgAA2AhAgAEEHNgIMQQAhEAyvAQsgACgCBCEQIABBADYCBAJAIAAgECABEKeAgIAAIhANACABIQEMSQsgAEHSADYCHCAAIAE2AhQgACAQNgIMQQAhEAyuAQsgACgCBCEQIABBADYCBAJAIAAgECABEKeAgIAAIhANACABIQEMSQsgAEHTADYCHCAAIAE2AhQgACAQNgIMQQAhEAytAQsgACgCBCEQIABBADYCBAJAIAAgECABEKeAgIAAIhANACABIQEMTQsgAEHlADYCHCAAIAE2AhQgACAQNgIMQQAhEAysAQsgAEEANgIcIAAgATYCFCAAQdyIgIAANgIQIABBBzYCDEEAIRAMqwELIBBBP0cNASABQQFqIQELQQUhEAyQAQtBACEQIABBADYCHCAAIAE2AhQgAEH9koCAADYCECAAQQc2AgwMqAELIAAoAgQhECAAQQA2AgQCQCAAIBAgARCngICAACIQDQAgASEBDEILIABB0gA2AhwgACABNgIUIAAgEDYCDEEAIRAMpwELIAAoAgQhECAAQQA2AgQCQCAAIBAgARCngICAACIQDQAgASEBDEILIABB0wA2AhwgACABNgIUIAAgEDYCDEEAIRAMpgELIAAoAgQhECAAQQA2AgQCQCAAIBAgARCngICAACIQDQAgASEBDEYLIABB5QA2AhwgACABNgIUIAAgEDYCDEEAIRAMpQELIAAoAgQhASAAQQA2AgQCQCAAIAEgFBCngICAACIBDQAgFCEBDD8LIABB0gA2AhwgACAUNgIUIAAgATYCDEEAIRAMpAELIAAoAgQhASAAQQA2AgQCQCAAIAEgFBCngICAACIBDQAgFCEBDD8LIABB0wA2AhwgACAUNgIUIAAgATYCDEEAIRAMowELIAAoAgQhASAAQQA2AgQCQCAAIAEgFBCngICAACIBDQAgFCEBDEMLIABB5QA2AhwgACAU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YWdlX2JlZ2luYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX3ZhbHVlYCBjYWxsYmFjayBlcnJvcgBgb25fc3RhdHVzX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fdmVyc2lvbl9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3VybF9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX2NodW5rX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25faGVhZGVyX3ZhbHVlX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fbWVzc2FnZV9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX21ldGhvZF9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX2hlYWRlcl9maWVsZF9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX2NodW5rX2V4dGVuc2lvbl9uYW1lYCBjYWxsYmFjayBlcnJvcgBVbmV4cGVjdGVkIGNoYXIgaW4gdXJsIHNlcnZlcgBJbnZhbGlkIGhlYWRlciB2YWx1ZSBjaGFyAEludmFsaWQgaGVhZGVyIGZpZWxkIGNoYXIAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl92ZXJzaW9uAEludmFsaWQgbWlub3IgdmVyc2lvbgBJbnZhbGlkIG1ham9yIHZlcnNpb24ARXhwZWN0ZWQgc3BhY2UgYWZ0ZXIgdmVyc2lvbgBFeHBlY3RlZCBDUkxGIGFmdGVyIHZlcnNpb24ASW52YWxpZCBIVFRQIHZlcnNpb24ASW52YWxpZCBoZWFkZXIgdG9rZW4AU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl91cmwASW52YWxpZCBjaGFyYWN0ZXJzIGluIHVybABVbmV4cGVjdGVkIHN0YXJ0IGNoYXIgaW4gdXJsAERvdWJsZSBAIGluIHVybABFbXB0eSBDb250ZW50LUxlbmd0aABJbnZhbGlkIGNoYXJhY3RlciBpbiBDb250ZW50LUxlbmd0aABEdXBsaWNhdGUgQ29udGVudC1MZW5ndGgASW52YWxpZCBjaGFyIGluIHVybCBwYXRoAENvbnRlbnQtTGVuZ3RoIGNhbid0IGJlIHByZXNlbnQgd2l0aCBUcmFuc2Zlci1FbmNvZGluZwBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBzaXplAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25faGVhZGVyX3ZhbHVlAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fY2h1bmtfZXh0ZW5zaW9uX3ZhbHVlAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgdmFsdWUATWlzc2luZyBleHBlY3RlZCBMRiBhZnRlciBoZWFkZXIgdmFsdWUASW52YWxpZCBgVHJhbnNmZXItRW5jb2RpbmdgIGhlYWRlciB2YWx1ZQBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zIHF1b3RlIHZhbHVlAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGVkIHZhbHVlAFBhdXNlZCBieSBvbl9oZWFkZXJzX2NvbXBsZXRlAEludmFsaWQgRU9GIHN0YXRlAG9uX3Jlc2V0IHBhdXNlAG9uX2NodW5rX2hlYWRlciBwYXVzZQBvbl9tZXNzYWdlX2JlZ2luIHBhdXNlAG9uX2NodW5rX2V4dGVuc2lvbl92YWx1ZSBwYXVzZQBvbl9zdGF0dXNfY29tcGxldGUgcGF1c2UAb25fdmVyc2lvbl9jb21wbGV0ZSBwYXVzZQBvbl91cmxfY29tcGxldGUgcGF1c2UAb25fY2h1bmtfY29tcGxldGUgcGF1c2UAb25faGVhZGVyX3ZhbHVlX2NvbXBsZXRlIHBhdXNlAG9uX21lc3NhZ2VfY29tcGxldGUgcGF1c2UAb25fbWV0aG9kX2NvbXBsZXRlIHBhdXNlAG9uX2hlYWRlcl9maWVsZF9jb21wbGV0ZSBwYXVzZQBvbl9jaHVua19leHRlbnNpb25fbmFtZSBwYXVzZQBVbmV4cGVjdGVkIHNwYWNlIGFmdGVyIHN0YXJ0IGxpbmUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9jaHVua19leHRlbnNpb25fbmFtZQBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zIG5hbWUAUGF1c2Ugb24gQ09OTkVDVC9VcGdyYWRlAFBhdXNlIG9uIFBSSS9VcGdyYWRlAEV4cGVjdGVkIEhUVFAvMiBDb25uZWN0aW9uIFByZWZhY2UAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9tZXRob2QARXhwZWN0ZWQgc3BhY2UgYWZ0ZXIgbWV0aG9kAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25faGVhZGVyX2ZpZWxkAFBhdXNlZABJbnZhbGlkIHdvcmQgZW5jb3VudGVyZWQASW52YWxpZCBtZXRob2QgZW5jb3VudGVyZWQAVW5leHBlY3RlZCBjaGFyIGluIHVybCBzY2hlbWEAUmVxdWVzdCBoYXMgaW52YWxpZCBgVHJhbnNmZXItRW5jb2RpbmdgAFNXSVRDSF9QUk9YWQBVU0VfUFJPWFkATUtBQ1RJVklUWQBVTlBST0NFU1NBQkxFX0VOVElUWQBDT1BZAE1PVkVEX1BFUk1BTkVOVExZAFRPT19FQVJMWQBOT1RJRlkARkFJTEVEX0RFUEVOREVOQ1kAQkFEX0dBVEVXQVkAUExBWQBQVVQAQ0hFQ0tPVVQAR0FURVdBWV9USU1FT1VUAFJFUVVFU1RfVElNRU9VVABORVRXT1JLX0NPTk5FQ1RfVElNRU9VVABDT05ORUNUSU9OX1RJTUVPVVQATE9HSU5fVElNRU9VVABORVRXT1JLX1JFQURfVElNRU9VVABQT1NUAE1JU0RJUkVDVEVEX1JFUVVFU1QAQ0xJRU5UX0NMT1NFRF9SRVFVRVNUAENMSUVOVF9DTE9TRURfTE9BRF9CQUxBTkNFRF9SRVFVRVNUAEJBRF9SRVFVRVNUAEhUVFBfUkVRVUVTVF9TRU5UX1RPX0hUVFBTX1BPUlQAUkVQT1JUAElNX0FfVEVBUE9UAFJFU0VUX0NPTlRFTlQATk9fQ09OVEVOVABQQVJUSUFMX0NPTlRFTlQASFBFX0lOVkFMSURfQ09OU1RBTlQASFBFX0NCX1JFU0VUAEdFVABIUEVfU1RSSUNUAENPTkZMSUNUAFRFTVBPUkFSWV9SRURJUkVDVABQRVJNQU5FTlRfUkVESVJFQ1QAQ09OTkVDVABNVUxUSV9TVEFUVVMASFBFX0lOVkFMSURfU1RBVFVTAFRPT19NQU5ZX1JFUVVFU1RTAEVBUkxZX0hJTlRTAFVOQVZBSUxBQkxFX0ZPUl9MRUdBTF9SRUFTT05TAE9QVElPTlMAU1dJVENISU5HX1BST1RPQ09MUwBWQVJJQU5UX0FMU09fTkVHT1RJQVRFUwBNVUxUSVBMRV9DSE9JQ0VTAElOVEVSTkFMX1NFUlZFUl9FUlJPUgBXRUJfU0VSVkVSX1VOS05PV05fRVJST1IAUkFJTEdVTl9FUlJPUgBJREVOVElUWV9QUk9WSURFUl9BVVRIRU5USUNBVElPTl9FUlJPUgBTU0xfQ0VSVElGSUNBVEVfRVJST1IASU5WQUxJRF9YX0ZPUldBUkRFRF9GT1IAU0VUX1BBUkFNRVRFUgBHRVRfUEFSQU1FVEVSAEhQRV9VU0VSAFNFRV9PVEhFUgBIUEVfQ0JfQ0hVTktfSEVBREVSAE1LQ0FMRU5EQVIAU0VUVVAAV0VCX1NFUlZFUl9JU19ET1dOAFRFQVJET1dOAEhQRV9DTE9TRURfQ09OTkVDVElPTgBIRVVSSVNUSUNfRVhQSVJBVElPTgBESVNDT05ORUNURURfT1BFUkFUSU9OAE5PTl9BVVRIT1JJVEFUSVZFX0lORk9STUFUSU9OAEhQRV9JTlZBTElEX1ZFUlNJT04ASFBFX0NCX01FU1NBR0VfQkVHSU4AU0lURV9JU19GUk9aRU4ASFBFX0lOVkFMSURfSEVBREVSX1RPS0VOAElOVkFMSURfVE9LRU4ARk9SQklEREVOAEVOSEFOQ0VfWU9VUl9DQUxNAEhQRV9JTlZBTElEX1VSTABCTE9DS0VEX0JZX1BBUkVOVEFMX0NPTlRST0wATUtDT0wAQUNMAEhQRV9JTlRFUk5BTABSRVFVRVNUX0hFQURFUl9GSUVMRFNfVE9PX0xBUkdFX1VOT0ZGSUNJQUwASFBFX09LAFVOTElOSwBVTkxPQ0sAUFJJAFJFVFJZX1dJVEgASFBFX0lOVkFMSURfQ09OVEVOVF9MRU5HVEgASFBFX1VORVhQRUNURURfQ09OVEVOVF9MRU5HVEgARkxVU0gAUFJPUFBBVENIAE0tU0VBUkNIAFVSSV9UT09fTE9ORwBQUk9DRVNTSU5HAE1JU0NFTExBTkVPVVNfUEVSU0lTVEVOVF9XQVJOSU5HAE1JU0NFTExBTkVPVVNfV0FSTklORwBIUEVfSU5WQUxJRF9UUkFOU0ZFUl9FTkNPRElORwBFeHBlY3RlZCBDUkxGAEhQRV9JTlZBTElEX0NIVU5LX1NJWkUATU9WRQBDT05USU5VRQBIUEVfQ0JfU1RBVFVTX0NPTVBMRVRFAEhQRV9DQl9IRUFERVJTX0NPTVBMRVRFAEhQRV9DQl9WRVJTSU9OX0NPTVBMRVRFAEhQRV9DQl9VUkxfQ09NUExFVEUASFBFX0NCX0NIVU5LX0NPTVBMRVRFAEhQRV9DQl9IRUFERVJfVkFMVUVfQ09NUExFVEUASFBFX0NCX0NIVU5LX0VYVEVOU0lPTl9WQUxVRV9DT01QTEVURQBIUEVfQ0JfQ0hVTktfRVhURU5TSU9OX05BTUVfQ09NUExFVEUASFBFX0NCX01FU1NBR0VfQ09NUExFVEUASFBFX0NCX01FVEhPRF9DT01QTEVURQBIUEVfQ0JfSEVBREVSX0ZJRUxEX0NPTVBMRVRFAERFTEVURQBIUEVfSU5WQUxJRF9FT0ZfU1RBVEUASU5WQUxJRF9TU0xfQ0VSVElGSUNBVEUAUEFVU0UATk9fUkVTUE9OU0UAVU5TVVBQT1JURURfTUVESUFfVFlQRQBHT05FAE5PVF9BQ0NFUFRBQkxFAFNFUlZJQ0VfVU5BVkFJTEFCTEUAUkFOR0VfTk9UX1NBVElTRklBQkxFAE9SSUdJTl9JU19VTlJFQUNIQUJMRQBSRVNQT05TRV9JU19TVEFMRQBQVVJHRQBNRVJHRQBSRVFVRVNUX0hFQURFUl9GSUVMRFNfVE9PX0xBUkdFAFJFUVVFU1RfSEVBREVSX1RPT19MQVJHRQBQQVlMT0FEX1RPT19MQVJHRQBJTlNVRkZJQ0lFTlRfU1RPUkFHRQBIUEVfUEFVU0VEX1VQR1JBREUASFBFX1BBVVNFRF9IMl9VUEdSQURFAFNPVVJDRQBBTk5PVU5DRQBUUkFDRQBIUEVfVU5FWFBFQ1RFRF9TUEFDRQBERVNDUklCRQBVTlNVQlNDUklCRQBSRUNPUkQASFBFX0lOVkFMSURfTUVUSE9EAE5PVF9GT1VORABQUk9QRklORABVTkJJTkQAUkVCSU5EAFVOQVVUSE9SSVpFRABNRVRIT0RfTk9UX0FMTE9XRUQASFRUUF9WRVJTSU9OX05PVF9TVVBQT1JURUQAQUxSRUFEWV9SRVBPUlRFRABBQ0NFUFRFRABOT1RfSU1QTEVNRU5URUQATE9PUF9ERVRFQ1RFRABIUEVfQ1JfRVhQRUNURUQASFBFX0xGX0VYUEVDVEVEAENSRUFURUQASU1fVVNFRABIUEVfUEFVU0VEAFRJTUVPVVRfT0NDVVJFRABQQVlNRU5UX1JFUVVJUkVEAFBSRUNPTkRJVElPTl9SRVFVSVJFRABQUk9YWV9BVVRIRU5USUNBVElPTl9SRVFVSVJFRABORVRXT1JLX0FVVEhFTlRJQ0FUSU9OX1JFUVVJUkVEAExFTkdUSF9SRVFVSVJFRABTU0xfQ0VSVElGSUNBVEVfUkVRVUlSRUQAVVBHUkFERV9SRVFVSVJFRABQQUdFX0VYUElSRUQAUFJFQ09ORElUSU9OX0ZBSUxFRABFWFBFQ1RBVElPTl9GQUlMRUQAUkVWQUxJREFUSU9OX0ZBSUxFRABTU0xfSEFORFNIQUtFX0ZBSUxFRABMT0NLRUQAVFJBTlNGT1JNQVRJT05fQVBQTElFRABOT1RfTU9ESUZJRUQATk9UX0VYVEVOREVEAEJBTkRXSURUSF9MSU1JVF9FWENFRURFRABTSVRFX0lTX09WRVJMT0FERUQASEVBRABFeHBlY3RlZCBIVFRQLwAAXhMAACYTAAAwEAAA8BcAAJ0TAAAVEgAAORcAAPASAAAKEAAAdRIAAK0SAACCEwAATxQAAH8QAACgFQAAIxQAAIkSAACLFAAATRUAANQRAADPFAAAEBgAAMkWAADcFgAAwREAAOAXAAC7FAAAdBQAAHwVAADlFAAACBcAAB8QAABlFQAAoxQAACgVAAACFQAAmRUAACwQAACLGQAATw8AANQOAABqEAAAzhAAAAIXAACJDgAAbhMAABwTAABmFAAAVhcAAMETAADNEwAAbBMAAGgXAABmFwAAXxcAACITAADODwAAaQ4AANgOAABjFgAAyxMAAKoOAAAoFwAAJhcAAMUTAABdFgAA6BEAAGcTAABlEwAA8hYAAHMTAAAdFwAA+RYAAPMRAADPDgAAzhUAAAwSAACzEQAApREAAGEQAAAyFwAAuxMAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIDAgICAgIAAAICAAICAAICAgICAgICAgIABAAAAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgIAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgACAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAICAgICAAACAgACAgACAgICAgICAgICAAMABAAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAAgACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbG9zZWVlcC1hbGl2ZQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBY2h1bmtlZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEAAQEBAQEAAAEBAAEBAAEBAQEBAQEBAQEAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABlY3Rpb25lbnQtbGVuZ3Rob25yb3h5LWNvbm5lY3Rpb24AAAAAAAAAAAAAAAAAAAByYW5zZmVyLWVuY29kaW5ncGdyYWRlDQoNCg0KU00NCg0KVFRQL0NFL1RTUC8AAAAAAAAAAAAAAAABAgABAwAAAAAAAAAAAAAAAAAAAAAAAAQBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAQIAAQMAAAAAAAAAAAAAAAAAAAAAAAAEAQEFAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAQAAAgAAAAAAAAAAAAAAAAAAAAAAAAMEAAAEBAQEBAQEBAQEBAUEBAQEBAQEBAQEBAQABAAGBwQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAIAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABOT1VOQ0VFQ0tPVVRORUNURVRFQ1JJQkVMVVNIRVRFQURTRUFSQ0hSR0VDVElWSVRZTEVOREFSVkVPVElGWVBUSU9OU0NIU0VBWVNUQVRDSEdFT1JESVJFQ1RPUlRSQ0hQQVJBTUVURVJVUkNFQlNDUklCRUFSRE9XTkFDRUlORE5LQ0tVQlNDUklCRUhUVFAvQURUUC8=', 'base64');
	return llhttpWasm;
}

var llhttp_simdWasm;
var hasRequiredLlhttp_simdWasm;

function requireLlhttp_simdWasm () {
	if (hasRequiredLlhttp_simdWasm) return llhttp_simdWasm;
	hasRequiredLlhttp_simdWasm = 1;
	const { Buffer } = require$$6;

	llhttp_simdWasm = Buffer.from('AGFzbQEAAAABMAhgAX8Bf2ADf39/AX9gBH9/f38Bf2AAAGADf39/AGABfwBgAn9/AGAGf39/f39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQACA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAA0ZFAwMEAAAFAAAAAAAABQEFAAUFBQAABgAAAAAGBgYGAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAAABAQcAAAUFAwABBAUBcAESEgUDAQACBggBfwFBgNQECwfRBSIGbWVtb3J5AgALX2luaXRpYWxpemUACRlfX2luZGlyZWN0X2Z1bmN0aW9uX3RhYmxlAQALbGxodHRwX2luaXQAChhsbGh0dHBfc2hvdWxkX2tlZXBfYWxpdmUAQQxsbGh0dHBfYWxsb2MADAZtYWxsb2MARgtsbGh0dHBfZnJlZQANBGZyZWUASA9sbGh0dHBfZ2V0X3R5cGUADhVsbGh0dHBfZ2V0X2h0dHBfbWFqb3IADxVsbGh0dHBfZ2V0X2h0dHBfbWlub3IAEBFsbGh0dHBfZ2V0X21ldGhvZAARFmxsaHR0cF9nZXRfc3RhdHVzX2NvZGUAEhJsbGh0dHBfZ2V0X3VwZ3JhZGUAEwxsbGh0dHBfcmVzZXQAFA5sbGh0dHBfZXhlY3V0ZQAVFGxsaHR0cF9zZXR0aW5nc19pbml0ABYNbGxodHRwX2ZpbmlzaAAXDGxsaHR0cF9wYXVzZQAYDWxsaHR0cF9yZXN1bWUAGRtsbGh0dHBfcmVzdW1lX2FmdGVyX3VwZ3JhZGUAGhBsbGh0dHBfZ2V0X2Vycm5vABsXbGxodHRwX2dldF9lcnJvcl9yZWFzb24AHBdsbGh0dHBfc2V0X2Vycm9yX3JlYXNvbgAdFGxsaHR0cF9nZXRfZXJyb3JfcG9zAB4RbGxodHRwX2Vycm5vX25hbWUAHxJsbGh0dHBfbWV0aG9kX25hbWUAIBJs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IAH9CwMAIABBMGogAf0LAwAgAEEgaiAB/QsDACAAQd0BNgIcQQALewEBfwJAIAAoAgwiAw0AAkAgACgCBEUNACAAIAE2AgQLAkAgACABIAIQxICAgAAiAw0AIAAoAgwPCyAAIAM2AhxBACEDIAAoAgQiAUUNACAAIAEgAiAAKAIIEYGAgIAAACIBRQ0AIAAgAjYCFCAAIAE2AgwgASEDCyADC+TzAQMOfwN+BH8jgICAgABBEGsiAySAgICAACABIQQgASEFIAEhBiABIQcgASEIIAEhCSABIQogASELIAEhDCABIQ0gASEOIAEhDwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAAKAIcIhBBf2oO3QHaAQHZAQIDBAUGBwgJCgsMDQ7YAQ8Q1wEREtYBExQVFhcYGRob4AHfARwdHtUBHyAhIiMkJdQBJicoKSorLNMB0gEtLtEB0AEvMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUbbAUdISUrPAc4BS80BTMwBTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gAGBAYIBgwGEAYUBhgGHAYgBiQGKAYsBjAGNAY4BjwGQAZEB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QAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIBAOxwEAAQID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YWNrIGVycm9yAGBvbl9jaHVua19leHRlbnNpb25fdmFsdWVgIGNhbGxiYWNrIGVycm9yAGBvbl9zdGF0dXNfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl92ZXJzaW9uX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fdXJsX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXNzYWdlX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fbWV0aG9kX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX25hbWVgIGNhbGxiYWNrIGVycm9yAFVuZXhwZWN0ZWQgY2hhciBpbiB1cmwgc2VydmVyAEludmFsaWQgaGVhZGVyIHZhbHVlIGNoYXIASW52YWxpZCBoZWFkZXIgZmllbGQgY2hhcgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3ZlcnNpb24ASW52YWxpZCBtaW5vciB2ZXJzaW9uAEludmFsaWQgbWFqb3IgdmVyc2lvbgBFeHBlY3RlZCBzcGFjZSBhZnRlciB2ZXJzaW9uAEV4cGVjdGVkIENSTEYgYWZ0ZXIgdmVyc2lvbgBJbnZhbGlkIEhUVFAgdmVyc2lvbgBJbnZhbGlkIGhlYWRlciB0b2tlbgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3VybABJbnZhbGlkIGNoYXJhY3RlcnMgaW4gdXJsAFVuZXhwZWN0ZWQgc3RhcnQgY2hhciBpbiB1cmwARG91YmxlIEAgaW4gdXJsAEVtcHR5IENvbnRlbnQtTGVuZ3RoAEludmFsaWQgY2hhcmFjdGVyIGluIENvbnRlbnQtTGVuZ3RoAER1cGxpY2F0ZSBDb250ZW50LUxlbmd0aABJbnZhbGlkIGNoYXIgaW4gdXJsIHBhdGgAQ29udGVudC1MZW5ndGggY2FuJ3QgYmUgcHJlc2VudCB3aXRoIFRyYW5zZmVyLUVuY29kaW5nAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIHNpemUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfdmFsdWUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9jaHVua19leHRlbnNpb25fdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyB2YWx1ZQBNaXNzaW5nIGV4cGVjdGVkIExGIGFmdGVyIGhlYWRlciB2YWx1ZQBJbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AgaGVhZGVyIHZhbHVlAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGUgdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBxdW90ZWQgdmFsdWUAUGF1c2VkIGJ5IG9uX2hlYWRlcnNfY29tcGxldGUASW52YWxpZCBFT0Ygc3RhdGUAb25fcmVzZXQgcGF1c2UAb25fY2h1bmtfaGVhZGVyIHBhdXNlAG9uX21lc3NhZ2VfYmVnaW4gcGF1c2UAb25fY2h1bmtfZXh0ZW5zaW9uX3ZhbHVlIHBhdXNlAG9uX3N0YXR1c19jb21wbGV0ZSBwYXVzZQBvbl92ZXJzaW9uX2NvbXBsZXRlIHBhdXNlAG9uX3VybF9jb21wbGV0ZSBwYXVzZQBvbl9jaHVua19jb21wbGV0ZSBwYXVzZQBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGUgcGF1c2UAb25fbWVzc2FnZV9jb21wbGV0ZSBwYXVzZQBvbl9tZXRob2RfY29tcGxldGUgcGF1c2UAb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlIHBhdXNlAG9uX2NodW5rX2V4dGVuc2lvbl9uYW1lIHBhdXNlAFVuZXhwZWN0ZWQgc3BhY2UgYWZ0ZXIgc3RhcnQgbGluZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2NodW5rX2V4dGVuc2lvbl9uYW1lAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgbmFtZQBQYXVzZSBvbiBDT05ORUNUL1VwZ3JhZGUAUGF1c2Ugb24gUFJJL1VwZ3JhZGUARXhwZWN0ZWQgSFRUUC8yIENvbm5lY3Rpb24gUHJlZmFjZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX21ldGhvZABFeHBlY3RlZCBzcGFjZSBhZnRlciBtZXRob2QAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfZmllbGQAUGF1c2VkAEludmFsaWQgd29yZCBlbmNvdW50ZXJlZABJbnZhbGlkIG1ldGhvZCBlbmNvdW50ZXJlZABVbmV4cGVjdGVkIGNoYXIgaW4gdXJsIHNjaGVtYQBSZXF1ZXN0IGhhcyBpbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AAU1dJVENIX1BST1hZAFVTRV9QUk9YWQBNS0FDVElWSVRZAFVOUFJPQ0VTU0FCTEVfRU5USVRZAENPUFkATU9WRURfUEVSTUFORU5UTFkAVE9PX0VBUkxZAE5PVElGWQBGQUlMRURfREVQRU5ERU5DWQBCQURfR0FURVdBWQBQTEFZAFBVVABDSEVDS09VVABHQVRFV0FZX1RJTUVPVVQAUkVRVUVTVF9USU1FT1VUAE5FVFdPUktfQ09OTkVDVF9USU1FT1VUAENPTk5FQ1RJT05fVElNRU9VVABMT0dJTl9USU1FT1VUAE5FVFdPUktfUkVBRF9USU1FT1VUAFBPU1QATUlTRElSRUNURURfUkVRVUVTVABDTElFTlRfQ0xPU0VEX1JFUVVFU1QAQ0xJRU5UX0NMT1NFRF9MT0FEX0JBTEFOQ0VEX1JFUVVFU1QAQkFEX1JFUVVFU1QASFRUUF9SRVFVRVNUX1NFTlRfVE9fSFRUUFNfUE9SVABSRVBPUlQASU1fQV9URUFQT1QAUkVTRVRfQ09OVEVOVABOT19DT05URU5UAFBBUlRJQUxfQ09OVEVOVABIUEVfSU5WQUxJRF9DT05TVEFOVABIUEVfQ0JfUkVTRVQAR0VUAEhQRV9TVFJJQ1QAQ09ORkxJQ1QAVEVNUE9SQVJZX1JFRElSRUNUAFBFUk1BTkVOVF9SRURJUkVDVABDT05ORUNUAE1VTFRJX1NUQVRVUwBIUEVfSU5WQUxJRF9TVEFUVVMAVE9PX01BTllfUkVRVUVTVFMARUFSTFlfSElOVFMAVU5BVkFJTEFCTEVfRk9SX0xFR0FMX1JFQVNPTlMAT1BUSU9OUwBTV0lUQ0hJTkdfUFJPVE9DT0xTAFZBUklBTlRfQUxTT19ORUdPVElBVEVTAE1VTFRJUExFX0NIT0lDRVMASU5URVJOQUxfU0VSVkVSX0VSUk9SAFdFQl9TRVJWRVJfVU5LTk9XTl9FUlJPUgBSQUlMR1VOX0VSUk9SAElERU5USVRZX1BST1ZJREVSX0FVVEhFTlRJQ0FUSU9OX0VSUk9SAFNTTF9DRVJUSUZJQ0FURV9FUlJPUgBJTlZBTElEX1hfRk9SV0FSREVEX0ZPUgBTRVRfUEFSQU1FVEVSAEdFVF9QQVJBTUVURVIASFBFX1VTRVIAU0VFX09USEVSAEhQRV9DQl9DSFVOS19IRUFERVIATUtDQUxFTkRBUgBTRVRVUABXRUJfU0VSVkVSX0lTX0RPV04AVEVBUkRPV04ASFBFX0NMT1NFRF9DT05ORUNUSU9OAEhFVVJJU1RJQ19FWFBJUkFUSU9OAERJU0NPTk5FQ1RFRF9PUEVSQVRJT04ATk9OX0FVVEhPUklUQVRJVkVfSU5GT1JNQVRJT04ASFBFX0lOVkFMSURfVkVSU0lPTgBIUEVfQ0JfTUVTU0FHRV9CRUdJTgBTSVRFX0lTX0ZST1pFTgBIUEVfSU5WQUxJRF9IRUFERVJfVE9LRU4ASU5WQUxJRF9UT0tFTgBGT1JCSURERU4ARU5IQU5DRV9ZT1VSX0NBTE0ASFBFX0lOVkFMSURfVVJMAEJMT0NLRURfQllfUEFSRU5UQUxfQ09OVFJPTABNS0NPTABBQ0wASFBFX0lOVEVSTkFMAFJFUVVFU1RfSEVBREVSX0ZJRUxEU19UT09fTEFSR0VfVU5PRkZJQ0lBTABIUEVfT0sAVU5MSU5LAFVOTE9DSwBQUkkAUkVUUllfV0lUSABIUEVfSU5WQUxJRF9DT05URU5UX0xFTkdUSABIUEVfVU5FWFBFQ1RFRF9DT05URU5UX0xFTkdUSABGTFVTSABQUk9QUEFUQ0gATS1TRUFSQ0gAVVJJX1RPT19MT05HAFBST0NFU1NJTkcATUlTQ0VMTEFORU9VU19QRVJTSVNURU5UX1dBUk5JTkcATUlTQ0VMTEFORU9VU19XQVJOSU5HAEhQRV9JTlZBTElEX1RSQU5TRkVSX0VOQ09ESU5HAEV4cGVjdGVkIENSTEYASFBFX0lOVkFMSURfQ0hVTktfU0laRQBNT1ZFAENPTlRJTlVFAEhQRV9DQl9TVEFUVVNfQ09NUExFVEUASFBFX0NCX0hFQURFUlNfQ09NUExFVEUASFBFX0NCX1ZFUlNJT05fQ09NUExFVEUASFBFX0NCX1VSTF9DT01QTEVURQBIUEVfQ0JfQ0hVTktfQ09NUExFVEUASFBFX0NCX0hFQURFUl9WQUxVRV9DT01QTEVURQBIUEVfQ0JfQ0hVTktfRVhURU5TSU9OX1ZBTFVFX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19FWFRFTlNJT05fTkFNRV9DT01QTEVURQBIUEVfQ0JfTUVTU0FHRV9DT01QTEVURQBIUEVfQ0JfTUVUSE9EX0NPTVBMRVRFAEhQRV9DQl9IRUFERVJfRklFTERfQ09NUExFVEUAREVMRVRFAEhQRV9JTlZBTElEX0VPRl9TVEFURQBJTlZBTElEX1NTTF9DRVJUSUZJQ0FURQBQQVVTRQBOT19SRVNQT05TRQBVTlNVUFBPUlRFRF9NRURJQV9UWVBFAEdPTkUATk9UX0FDQ0VQVEFCTEUAU0VSVklDRV9VTkFWQUlMQUJMRQBSQU5HRV9OT1RfU0FUSVNGSUFCTEUAT1JJR0lOX0lTX1VOUkVBQ0hBQkxFAFJFU1BPTlNFX0lTX1NUQUxFAFBVUkdFAE1FUkdFAFJFUVVFU1RfSEVBREVSX0ZJRUxEU19UT09fTEFSR0UAUkVRVUVTVF9IRUFERVJfVE9PX0xBUkdFAFBBWUxPQURfVE9PX0xBUkdFAElOU1VGRklDSUVOVF9TVE9SQUdFAEhQRV9QQVVTRURfVVBHUkFERQBIUEVfUEFVU0VEX0gyX1VQR1JBREUAU09VUkNFAEFOTk9VTkNFAFRSQUNFAEhQRV9VTkVYUEVDVEVEX1NQQUNFAERFU0NSSUJFAFVOU1VCU0NSSUJFAFJFQ09SRABIUEVfSU5WQUxJRF9NRVRIT0QATk9UX0ZPVU5EAFBST1BGSU5EAFVOQklORABSRUJJTkQAVU5BVVRIT1JJWkVEAE1FVEhPRF9OT1RfQUxMT1dFRABIVFRQX1ZFUlNJT05fTk9UX1NVUFBPUlRFRABBTFJFQURZX1JFUE9SVEVEAEFDQ0VQVEVEAE5PVF9JTVBMRU1FTlRFRABMT09QX0RFVEVDVEVEAEhQRV9DUl9FWFBFQ1RFRABIUEVfTEZfRVhQRUNURUQAQ1JFQVRFRABJTV9VU0VEAEhQRV9QQVVTRUQAVElNRU9VVF9PQ0NVUkVEAFBBWU1FTlRfUkVRVUlSRUQAUFJFQ09ORElUSU9OX1JFUVVJUkVEAFBST1hZX0FVVEhFTlRJQ0FUSU9OX1JFUVVJUkVEAE5FVFdPUktfQVVUSEVOVElDQVRJT05fUkVRVUlSRUQATEVOR1RIX1JFUVVJUkVEAFNTTF9DRVJUSUZJQ0FURV9SRVFVSVJFRABVUEdSQURFX1JFUVVJUkVEAFBBR0VfRVhQSVJFRABQUkVDT05ESVRJT05fRkFJTEVEAEVYUEVDVEFUSU9OX0ZBSUxFRABSRVZBTElEQVRJT05fRkFJTEVEAFNTTF9IQU5EU0hBS0VfRkFJTEVEAExPQ0tFRABUUkFOU0ZPUk1BVElPTl9BUFBMSUVEAE5PVF9NT0RJRklFRABOT1RfRVhURU5ERUQAQkFORFdJRFRIX0xJTUlUX0VYQ0VFREVEAFNJVEVfSVNfT1ZFUkxPQURFRABIRUFEAEV4cGVjdGVkIEhUVFAvAABeEwAAJhMAADAQAADwFwAAnRMAABUSAAA5FwAA8BIAAAoQAAB1EgAArRIAAIITAABPFAAAfxAAAKAVAAAjFAAAiRIAAIsUAABNFQAA1BEAAM8UAAAQGAAAyRYAANwWAADBEQAA4BcAALsUAAB0FAAAfBUAAOUUAAAIFwAAHxAAAGUVAACjFAAAKBUAAAIVAACZFQAALBAAAIsZAABPDwAA1A4AAGoQAADOEAAAAhcAAIkOAABuEwAAHBMAAGYUAABWFwAAwRMAAM0TAABsEwAAaBcAAGYXAABfFwAAIhMAAM4PAABpDgAA2A4AAGMWAADLEwAAqg4AACgXAAAmFwAAxRMAAF0WAADoEQAAZxMAAGUTAADyFgAAcxMAAB0XAAD5FgAA8xEAAM8OAADOFQAADBIAALMRAAClEQAAYRAAADIXAAC7EwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAgMCAgICAgAAAgIAAgIAAgICAgICAgICAgAEAAAAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAgICAAIAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAgICAgIAAAICAAICAAICAgICAgICAgIAAwAEAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgIAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgACAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsb3NlZWVwLWFsaXZlAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQFjaHVua2VkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQABAQEBAQAAAQEAAQEAAQEBAQEBAQEBAQAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGVjdGlvbmVudC1sZW5ndGhvbnJveHktY29ubmVjdGlvbgAAAAAAAAAAAAAAAAAAAHJhbnNmZXItZW5jb2RpbmdwZ3JhZGUNCg0KDQpTTQ0KDQpUVFAvQ0UvVFNQLwAAAAAAAAAAAAAAAAECAAEDAAAAAAAAAAAAAAAAAAAAAAAABAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAABAgABAwAAAAAAAAAAAAAAAAAAAAAAAAQBAQUBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAABAAACAAAAAAAAAAAAAAAAAAAAAAAAAwQAAAQEBAQEBAQEBAQEBQQEBAQEBAQEBAQEBAAEAAYHBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQABAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAgAAAAACAAAAAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE5PVU5DRUVDS09VVE5FQ1RFVEVDUklCRUxVU0hFVEVBRFNFQVJDSFJHRUNUSVZJVFlMRU5EQVJWRU9USUZZUFRJT05TQ0hTRUFZU1RBVENIR0VPUkRJUkVDVE9SVFJDSFBBUkFNRVRFUlVSQ0VCU0NSSUJFQVJET1dOQUNFSU5ETktDS1VCU0NSSUJFSFRUUC9BRFRQLw==', 'base64');
	return llhttp_simdWasm;
}

var constants$3;
var hasRequiredConstants$2;

function requireConstants$2 () {
	if (hasRequiredConstants$2) return constants$3;
	hasRequiredConstants$2 = 1;

	const corsSafeListedMethods = ['GET', 'HEAD', 'POST'];
	const corsSafeListedMethodsSet = new Set(corsSafeListedMethods);

	const nullBodyStatus = [101, 204, 205, 304];

	const redirectStatus = [301, 302, 303, 307, 308];
	const redirectStatusSet = new Set(redirectStatus);

	// https://fetch.spec.whatwg.org/#block-bad-port
	const badPorts = [
	  '1', '7', '9', '11', '13', '15', '17', '19', '20', '21', '22', '23', '25', '37', '42', '43', '53', '69', '77', '79',
	  '87', '95', '101', '102', '103', '104', '109', '110', '111', '113', '115', '117', '119', '123', '135', '137',
	  '139', '143', '161', '179', '389', '427', '465', '512', '513', '514', '515', '526', '530', '531', '532',
	  '540', '548', '554', '556', '563', '587', '601', '636', '989', '990', '993', '995', '1719', '1720', '1723',
	  '2049', '3659', '4045', '5060', '5061', '6000', '6566', '6665', '6666', '6667', '6668', '6669', '6697',
	  '10080'
	];

	const badPortsSet = new Set(badPorts);

	// https://w3c.github.io/webappsec-referrer-policy/#referrer-policies
	const referrerPolicy = [
	  '',
	  'no-referrer',
	  'no-referrer-when-downgrade',
	  'same-origin',
	  'origin',
	  'strict-origin',
	  'origin-when-cross-origin',
	  'strict-origin-when-cross-origin',
	  'unsafe-url'
	];
	const referrerPolicySet = new Set(referrerPolicy);

	const requestRedirect = ['follow', 'manual', 'error'];

	const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
	const safeMethodsSet = new Set(safeMethods);

	const requestMode = ['navigate', 'same-origin', 'no-cors', 'cors'];

	const requestCredentials = ['omit', 'same-origin', 'include'];

	const requestCache = [
	  'default',
	  'no-store',
	  'reload',
	  'no-cache',
	  'force-cache',
	  'only-if-cached'
	];

	// https://fetch.spec.whatwg.org/#request-body-header-name
	const requestBodyHeader = [
	  'content-encoding',
	  'content-language',
	  'content-location',
	  'content-type',
	  // See https://github.com/nodejs/undici/issues/2021
	  // 'Content-Length' is a forbidden header name, which is typically
	  // removed in the Headers implementation. However, undici doesn't
	  // filter out headers, so we add it here.
	  'content-length'
	];

	// https://fetch.spec.whatwg.org/#enumdef-requestduplex
	const requestDuplex = [
	  'half'
	];

	// http://fetch.spec.whatwg.org/#forbidden-method
	const forbiddenMethods = ['CONNECT', 'TRACE', 'TRACK'];
	const forbiddenMethodsSet = new Set(forbiddenMethods);

	const subresource = [
	  'audio',
	  'audioworklet',
	  'font',
	  'image',
	  'manifest',
	  'paintworklet',
	  'script',
	  'style',
	  'track',
	  'video',
	  'xslt',
	  ''
	];
	const subresourceSet = new Set(subresource);

	constants$3 = {
	  subresource,
	  forbiddenMethods,
	  requestBodyHeader,
	  referrerPolicy,
	  requestRedirect,
	  requestMode,
	  requestCredentials,
	  requestCache,
	  redirectStatus,
	  corsSafeListedMethods,
	  nullBodyStatus,
	  safeMethods,
	  badPorts,
	  requestDuplex,
	  subresourceSet,
	  badPortsSet,
	  redirectStatusSet,
	  corsSafeListedMethodsSet,
	  safeMethodsSet,
	  forbiddenMethodsSet,
	  referrerPolicySet
	};
	return constants$3;
}

var global$2;
var hasRequiredGlobal;

function requireGlobal () {
	if (hasRequiredGlobal) return global$2;
	hasRequiredGlobal = 1;

	// In case of breaking changes, increase the version
	// number to avoid conflicts.
	const globalOrigin = Symbol.for('undici.globalOrigin.1');

	function getGlobalOrigin () {
	  return globalThis[globalOrigin]
	}

	function setGlobalOrigin (newOrigin) {
	  if (newOrigin === undefined) {
	    Object.defineProperty(globalThis, globalOrigin, {
	      value: undefined,
	      writable: true,
	      enumerable: false,
	      configurable: false
	    });

	    return
	  }

	  const parsedURL = new URL(newOrigin);

	  if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') {
	    throw new TypeError(`Only http & https urls are allowed, received ${parsedURL.protocol}`)
	  }

	  Object.defineProperty(globalThis, globalOrigin, {
	    value: parsedURL,
	    writable: true,
	    enumerable: false,
	    configurable: false
	  });
	}

	global$2 = {
	  getGlobalOrigin,
	  setGlobalOrigin
	};
	return global$2;
}

var dataUrl;
var hasRequiredDataUrl;

function requireDataUrl () {
	if (hasRequiredDataUrl) return dataUrl;
	hasRequiredDataUrl = 1;

	const assert = require$$0;

	const encoder = new TextEncoder();

	/**
	 * @see https://mimesniff.spec.whatwg.org/#http-token-code-point
	 */
	const HTTP_TOKEN_CODEPOINTS = /^[!#$%&'*+-.^_|~A-Za-z0-9]+$/;
	const HTTP_WHITESPACE_REGEX = /[\u000A\u000D\u0009\u0020]/; // eslint-disable-line
	const ASCII_WHITESPACE_REPLACE_REGEX = /[\u0009\u000A\u000C\u000D\u0020]/g; // eslint-disable-line
	/**
	 * @see https://mimesniff.spec.whatwg.org/#http-quoted-string-token-code-point
	 */
	const HTTP_QUOTED_STRING_TOKENS = /[\u0009\u0020-\u007E\u0080-\u00FF]/; // eslint-disable-line

	// https://fetch.spec.whatwg.org/#data-url-processor
	/** @param {URL} dataURL */
	function dataURLProcessor (dataURL) {
	  // 1. Assert: dataURL’s scheme is "data".
	  assert(dataURL.protocol === 'data:');

	  // 2. Let input be the result of running the URL
	  // serializer on dataURL with exclude fragment
	  // set to true.
	  let input = URLSerializer(dataURL, true);

	  // 3. Remove the leading "data:" string from input.
	  input = input.slice(5);

	  // 4. Let position point at the start of input.
	  const position = { position: 0 };

	  // 5. Let mimeType be the result of collecting a
	  // sequence of code points that are not equal
	  // to U+002C (,), given position.
	  let mimeType = collectASequenceOfCodePointsFast(
	    ',',
	    input,
	    position
	  );

	  // 6. Strip leading and trailing ASCII whitespace
	  // from mimeType.
	  // Undici implementation note: we need to store the
	  // length because if the mimetype has spaces removed,
	  // the wrong amount will be sliced from the input in
	  // step #9
	  const mimeTypeLength = mimeType.length;
	  mimeType = removeASCIIWhitespace(mimeType, true, true);

	  // 7. If position is past the end of input, then
	  // return failure
	  if (position.position >= input.length) {
	    return 'failure'
	  }

	  // 8. Advance position by 1.
	  position.position++;

	  // 9. Let encodedBody be the remainder of input.
	  const encodedBody = input.slice(mimeTypeLength + 1);

	  // 10. Let body be the percent-decoding of encodedBody.
	  let body = stringPercentDecode(encodedBody);

	  // 11. If mimeType ends with U+003B (;), followed by
	  // zero or more U+0020 SPACE, followed by an ASCII
	  // case-insensitive match for "base64", then:
	  if (/;(\u0020){0,}base64$/i.test(mimeType)) {
	    // 1. Let stringBody be the isomorphic decode of body.
	    const stringBody = isomorphicDecode(body);

	    // 2. Set body to the forgiving-base64 decode of
	    // stringBody.
	    body = forgivingBase64(stringBody);

	    // 3. If body is failure, then return failure.
	    if (body === 'failure') {
	      return 'failure'
	    }

	    // 4. Remove the last 6 code points from mimeType.
	    mimeType = mimeType.slice(0, -6);

	    // 5. Remove trailing U+0020 SPACE code points from mimeType,
	    // if any.
	    mimeType = mimeType.replace(/(\u0020)+$/, '');

	    // 6. Remove the last U+003B (;) code point from mimeType.
	    mimeType = mimeType.slice(0, -1);
	  }

	  // 12. If mimeType starts with U+003B (;), then prepend
	  // "text/plain" to mimeType.
	  if (mimeType.startsWith(';')) {
	    mimeType = 'text/plain' + mimeType;
	  }

	  // 13. Let mimeTypeRecord be the result of parsing
	  // mimeType.
	  let mimeTypeRecord = parseMIMEType(mimeType);

	  // 14. If mimeTypeRecord is failure, then set
	  // mimeTypeRecord to text/plain;charset=US-ASCII.
	  if (mimeTypeRecord === 'failure') {
	    mimeTypeRecord = parseMIMEType('text/plain;charset=US-ASCII');
	  }

	  // 15. Return a new data: URL struct whose MIME
	  // type is mimeTypeRecord and body is body.
	  // https://fetch.spec.whatwg.org/#data-url-struct
	  return { mimeType: mimeTypeRecord, body }
	}

	// https://url.spec.whatwg.org/#concept-url-serializer
	/**
	 * @param {URL} url
	 * @param {boolean} excludeFragment
	 */
	function URLSerializer (url, excludeFragment = false) {
	  if (!excludeFragment) {
	    return url.href
	  }

	  const href = url.href;
	  const hashLength = url.hash.length;

	  const serialized = hashLength === 0 ? href : href.substring(0, href.length - hashLength);

	  if (!hashLength && href.endsWith('#')) {
	    return serialized.slice(0, -1)
	  }

	  return serialized
	}

	// https://infra.spec.whatwg.org/#collect-a-sequence-of-code-points
	/**
	 * @param {(char: string) => boolean} condition
	 * @param {string} input
	 * @param {{ position: number }} position
	 */
	function collectASequenceOfCodePoints (condition, input, position) {
	  // 1. Let result be the empty string.
	  let result = '';

	  // 2. While position doesn’t point past the end of input and the
	  // code point at position within input meets the condition condition:
	  while (position.position < input.length && condition(input[position.position])) {
	    // 1. Append that code point to the end of result.
	    result += input[position.position];

	    // 2. Advance position by 1.
	    position.position++;
	  }

	  // 3. Return result.
	  return result
	}

	/**
	 * A faster collectASequenceOfCodePoints that only works when comparing a single character.
	 * @param {string} char
	 * @param {string} input
	 * @param {{ position: number }} position
	 */
	function collectASequenceOfCodePointsFast (char, input, position) {
	  const idx = input.indexOf(char, position.position);
	  const start = position.position;

	  if (idx === -1) {
	    position.position = input.length;
	    return input.slice(start)
	  }

	  position.position = idx;
	  return input.slice(start, position.position)
	}

	// https://url.spec.whatwg.org/#string-percent-decode
	/** @param {string} input */
	function stringPercentDecode (input) {
	  // 1. Let bytes be the UTF-8 encoding of input.
	  const bytes = encoder.encode(input);

	  // 2. Return the percent-decoding of bytes.
	  return percentDecode(bytes)
	}

	/**
	 * @param {number} byte
	 */
	function isHexCharByte (byte) {
	  // 0-9 A-F a-f
	  return (byte >= 0x30 && byte <= 0x39) || (byte >= 0x41 && byte <= 0x46) || (byte >= 0x61 && byte <= 0x66)
	}

	/**
	 * @param {number} byte
	 */
	function hexByteToNumber (byte) {
	  return (
	    // 0-9
	    byte >= 0x30 && byte <= 0x39
	      ? (byte - 48)
	    // Convert to uppercase
	    // ((byte & 0xDF) - 65) + 10
	      : ((byte & 0xDF) - 55)
	  )
	}

	// https://url.spec.whatwg.org/#percent-decode
	/** @param {Uint8Array} input */
	function percentDecode (input) {
	  const length = input.length;
	  // 1. Let output be an empty byte sequence.
	  /** @type {Uint8Array} */
	  const output = new Uint8Array(length);
	  let j = 0;
	  // 2. For each byte byte in input:
	  for (let i = 0; i < length; ++i) {
	    const byte = input[i];

	    // 1. If byte is not 0x25 (%), then append byte to output.
	    if (byte !== 0x25) {
	      output[j++] = byte;

	    // 2. Otherwise, if byte is 0x25 (%) and the next two bytes
	    // after byte in input are not in the ranges
	    // 0x30 (0) to 0x39 (9), 0x41 (A) to 0x46 (F),
	    // and 0x61 (a) to 0x66 (f), all inclusive, append byte
	    // to output.
	    } else if (
	      byte === 0x25 &&
	      !(isHexCharByte(input[i + 1]) && isHexCharByte(input[i + 2]))
	    ) {
	      output[j++] = 0x25;

	    // 3. Otherwise:
	    } else {
	      // 1. Let bytePoint be the two bytes after byte in input,
	      // decoded, and then interpreted as hexadecimal number.
	      // 2. Append a byte whose value is bytePoint to output.
	      output[j++] = (hexByteToNumber(input[i + 1]) << 4) | hexByteToNumber(input[i + 2]);

	      // 3. Skip the next two bytes in input.
	      i += 2;
	    }
	  }

	  // 3. Return output.
	  return length === j ? output : output.subarray(0, j)
	}

	// https://mimesniff.spec.whatwg.org/#parse-a-mime-type
	/** @param {string} input */
	function parseMIMEType (input) {
	  // 1. Remove any leading and trailing HTTP whitespace
	  // from input.
	  input = removeHTTPWhitespace(input, true, true);

	  // 2. Let position be a position variable for input,
	  // initially pointing at the start of input.
	  const position = { position: 0 };

	  // 3. Let type be the result of collecting a sequence
	  // of code points that are not U+002F (/) from
	  // input, given position.
	  const type = collectASequenceOfCodePointsFast(
	    '/',
	    input,
	    position
	  );

	  // 4. If type is the empty string or does not solely
	  // contain HTTP token code points, then return failure.
	  // https://mimesniff.spec.whatwg.org/#http-token-code-point
	  if (type.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(type)) {
	    return 'failure'
	  }

	  // 5. If position is past the end of input, then return
	  // failure
	  if (position.position > input.length) {
	    return 'failure'
	  }

	  // 6. Advance position by 1. (This skips past U+002F (/).)
	  position.position++;

	  // 7. Let subtype be the result of collecting a sequence of
	  // code points that are not U+003B (;) from input, given
	  // position.
	  let subtype = collectASequenceOfCodePointsFast(
	    ';',
	    input,
	    position
	  );

	  // 8. Remove any trailing HTTP whitespace from subtype.
	  subtype = removeHTTPWhitespace(subtype, false, true);

	  // 9. If subtype is the empty string or does not solely
	  // contain HTTP token code points, then return failure.
	  if (subtype.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(subtype)) {
	    return 'failure'
	  }

	  const typeLowercase = type.toLowerCase();
	  const subtypeLowercase = subtype.toLowerCase();

	  // 10. Let mimeType be a new MIME type record whose type
	  // is type, in ASCII lowercase, and subtype is subtype,
	  // in ASCII lowercase.
	  // https://mimesniff.spec.whatwg.org/#mime-type
	  const mimeType = {
	    type: typeLowercase,
	    subtype: subtypeLowercase,
	    /** @type {Map<string, string>} */
	    parameters: new Map(),
	    // https://mimesniff.spec.whatwg.org/#mime-type-essence
	    essence: `${typeLowercase}/${subtypeLowercase}`
	  };

	  // 11. While position is not past the end of input:
	  while (position.position < input.length) {
	    // 1. Advance position by 1. (This skips past U+003B (;).)
	    position.position++;

	    // 2. Collect a sequence of code points that are HTTP
	    // whitespace from input given position.
	    collectASequenceOfCodePoints(
	      // https://fetch.spec.whatwg.org/#http-whitespace
	      char => HTTP_WHITESPACE_REGEX.test(char),
	      input,
	      position
	    );

	    // 3. Let parameterName be the result of collecting a
	    // sequence of code points that are not U+003B (;)
	    // or U+003D (=) from input, given position.
	    let parameterName = collectASequenceOfCodePoints(
	      (char) => char !== ';' && char !== '=',
	      input,
	      position
	    );

	    // 4. Set parameterName to parameterName, in ASCII
	    // lowercase.
	    parameterName = parameterName.toLowerCase();

	    // 5. If position is not past the end of input, then:
	    if (position.position < input.length) {
	      // 1. If the code point at position within input is
	      // U+003B (;), then continue.
	      if (input[position.position] === ';') {
	        continue
	      }

	      // 2. Advance position by 1. (This skips past U+003D (=).)
	      position.position++;
	    }

	    // 6. If position is past the end of input, then break.
	    if (position.position > input.length) {
	      break
	    }

	    // 7. Let parameterValue be null.
	    let parameterValue = null;

	    // 8. If the code point at position within input is
	    // U+0022 ("), then:
	    if (input[position.position] === '"') {
	      // 1. Set parameterValue to the result of collecting
	      // an HTTP quoted string from input, given position
	      // and the extract-value flag.
	      parameterValue = collectAnHTTPQuotedString(input, position, true);

	      // 2. Collect a sequence of code points that are not
	      // U+003B (;) from input, given position.
	      collectASequenceOfCodePointsFast(
	        ';',
	        input,
	        position
	      );

	    // 9. Otherwise:
	    } else {
	      // 1. Set parameterValue to the result of collecting
	      // a sequence of code points that are not U+003B (;)
	      // from input, given position.
	      parameterValue = collectASequenceOfCodePointsFast(
	        ';',
	        input,
	        position
	      );

	      // 2. Remove any trailing HTTP whitespace from parameterValue.
	      parameterValue = removeHTTPWhitespace(parameterValue, false, true);

	      // 3. If parameterValue is the empty string, then continue.
	      if (parameterValue.length === 0) {
	        continue
	      }
	    }

	    // 10. If all of the following are true
	    // - parameterName is not the empty string
	    // - parameterName solely contains HTTP token code points
	    // - parameterValue solely contains HTTP quoted-string token code points
	    // - mimeType’s parameters[parameterName] does not exist
	    // then set mimeType’s parameters[parameterName] to parameterValue.
	    if (
	      parameterName.length !== 0 &&
	      HTTP_TOKEN_CODEPOINTS.test(parameterName) &&
	      (parameterValue.length === 0 || HTTP_QUOTED_STRING_TOKENS.test(parameterValue)) &&
	      !mimeType.parameters.has(parameterName)
	    ) {
	      mimeType.parameters.set(parameterName, parameterValue);
	    }
	  }

	  // 12. Return mimeType.
	  return mimeType
	}

	// https://infra.spec.whatwg.org/#forgiving-base64-decode
	/** @param {string} data */
	function forgivingBase64 (data) {
	  // 1. Remove all ASCII whitespace from data.
	  data = data.replace(ASCII_WHITESPACE_REPLACE_REGEX, '');  // eslint-disable-line

	  let dataLength = data.length;
	  // 2. If data’s code point length divides by 4 leaving
	  // no remainder, then:
	  if (dataLength % 4 === 0) {
	    // 1. If data ends with one or two U+003D (=) code points,
	    // then remove them from data.
	    if (data.charCodeAt(dataLength - 1) === 0x003D) {
	      --dataLength;
	      if (data.charCodeAt(dataLength - 1) === 0x003D) {
	        --dataLength;
	      }
	    }
	  }

	  // 3. If data’s code point length divides by 4 leaving
	  // a remainder of 1, then return failure.
	  if (dataLength % 4 === 1) {
	    return 'failure'
	  }

	  // 4. If data contains a code point that is not one of
	  //  U+002B (+)
	  //  U+002F (/)
	  //  ASCII alphanumeric
	  // then return failure.
	  if (/[^+/0-9A-Za-z]/.test(data.length === dataLength ? data : data.substring(0, dataLength))) {
	    return 'failure'
	  }

	  const buffer = Buffer.from(data, 'base64');
	  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
	}

	// https://fetch.spec.whatwg.org/#collect-an-http-quoted-string
	// tests: https://fetch.spec.whatwg.org/#example-http-quoted-string
	/**
	 * @param {string} input
	 * @param {{ position: number }} position
	 * @param {boolean?} extractValue
	 */
	function collectAnHTTPQuotedString (input, position, extractValue) {
	  // 1. Let positionStart be position.
	  const positionStart = position.position;

	  // 2. Let value be the empty string.
	  let value = '';

	  // 3. Assert: the code point at position within input
	  // is U+0022 (").
	  assert(input[position.position] === '"');

	  // 4. Advance position by 1.
	  position.position++;

	  // 5. While true:
	  while (true) {
	    // 1. Append the result of collecting a sequence of code points
	    // that are not U+0022 (") or U+005C (\) from input, given
	    // position, to value.
	    value += collectASequenceOfCodePoints(
	      (char) => char !== '"' && char !== '\\',
	      input,
	      position
	    );

	    // 2. If position is past the end of input, then break.
	    if (position.position >= input.length) {
	      break
	    }

	    // 3. Let quoteOrBackslash be the code point at position within
	    // input.
	    const quoteOrBackslash = input[position.position];

	    // 4. Advance position by 1.
	    position.position++;

	    // 5. If quoteOrBackslash is U+005C (\), then:
	    if (quoteOrBackslash === '\\') {
	      // 1. If position is past the end of input, then append
	      // U+005C (\) to value and break.
	      if (position.position >= input.length) {
	        value += '\\';
	        break
	      }

	      // 2. Append the code point at position within input to value.
	      value += input[position.position];

	      // 3. Advance position by 1.
	      position.position++;

	    // 6. Otherwise:
	    } else {
	      // 1. Assert: quoteOrBackslash is U+0022 (").
	      assert(quoteOrBackslash === '"');

	      // 2. Break.
	      break
	    }
	  }

	  // 6. If the extract-value flag is set, then return value.
	  if (extractValue) {
	    return value
	  }

	  // 7. Return the code points from positionStart to position,
	  // inclusive, within input.
	  return input.slice(positionStart, position.position)
	}

	/**
	 * @see https://mimesniff.spec.whatwg.org/#serialize-a-mime-type
	 */
	function serializeAMimeType (mimeType) {
	  assert(mimeType !== 'failure');
	  const { parameters, essence } = mimeType;

	  // 1. Let serialization be the concatenation of mimeType’s
	  //    type, U+002F (/), and mimeType’s subtype.
	  let serialization = essence;

	  // 2. For each name → value of mimeType’s parameters:
	  for (let [name, value] of parameters.entries()) {
	    // 1. Append U+003B (;) to serialization.
	    serialization += ';';

	    // 2. Append name to serialization.
	    serialization += name;

	    // 3. Append U+003D (=) to serialization.
	    serialization += '=';

	    // 4. If value does not solely contain HTTP token code
	    //    points or value is the empty string, then:
	    if (!HTTP_TOKEN_CODEPOINTS.test(value)) {
	      // 1. Precede each occurrence of U+0022 (") or
	      //    U+005C (\) in value with U+005C (\).
	      value = value.replace(/(\\|")/g, '\\$1');

	      // 2. Prepend U+0022 (") to value.
	      value = '"' + value;

	      // 3. Append U+0022 (") to value.
	      value += '"';
	    }

	    // 5. Append value to serialization.
	    serialization += value;
	  }

	  // 3. Return serialization.
	  return serialization
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#http-whitespace
	 * @param {number} char
	 */
	function isHTTPWhiteSpace (char) {
	  // "\r\n\t "
	  return char === 0x00d || char === 0x00a || char === 0x009 || char === 0x020
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#http-whitespace
	 * @param {string} str
	 * @param {boolean} [leading=true]
	 * @param {boolean} [trailing=true]
	 */
	function removeHTTPWhitespace (str, leading = true, trailing = true) {
	  return removeChars(str, leading, trailing, isHTTPWhiteSpace)
	}

	/**
	 * @see https://infra.spec.whatwg.org/#ascii-whitespace
	 * @param {number} char
	 */
	function isASCIIWhitespace (char) {
	  // "\r\n\t\f "
	  return char === 0x00d || char === 0x00a || char === 0x009 || char === 0x00c || char === 0x020
	}

	/**
	 * @see https://infra.spec.whatwg.org/#strip-leading-and-trailing-ascii-whitespace
	 * @param {string} str
	 * @param {boolean} [leading=true]
	 * @param {boolean} [trailing=true]
	 */
	function removeASCIIWhitespace (str, leading = true, trailing = true) {
	  return removeChars(str, leading, trailing, isASCIIWhitespace)
	}

	/**
	 * @param {string} str
	 * @param {boolean} leading
	 * @param {boolean} trailing
	 * @param {(charCode: number) => boolean} predicate
	 * @returns
	 */
	function removeChars (str, leading, trailing, predicate) {
	  let lead = 0;
	  let trail = str.length - 1;

	  if (leading) {
	    while (lead < str.length && predicate(str.charCodeAt(lead))) lead++;
	  }

	  if (trailing) {
	    while (trail > 0 && predicate(str.charCodeAt(trail))) trail--;
	  }

	  return lead === 0 && trail === str.length - 1 ? str : str.slice(lead, trail + 1)
	}

	/**
	 * @see https://infra.spec.whatwg.org/#isomorphic-decode
	 * @param {Uint8Array} input
	 * @returns {string}
	 */
	function isomorphicDecode (input) {
	  // 1. To isomorphic decode a byte sequence input, return a string whose code point
	  //    length is equal to input’s length and whose code points have the same values
	  //    as the values of input’s bytes, in the same order.
	  const length = input.length;
	  if ((2 << 15) - 1 > length) {
	    return String.fromCharCode.apply(null, input)
	  }
	  let result = ''; let i = 0;
	  let addition = (2 << 15) - 1;
	  while (i < length) {
	    if (i + addition > length) {
	      addition = length - i;
	    }
	    result += String.fromCharCode.apply(null, input.subarray(i, i += addition));
	  }
	  return result
	}

	/**
	 * @see https://mimesniff.spec.whatwg.org/#minimize-a-supported-mime-type
	 * @param {Exclude<ReturnType<typeof parseMIMEType>, 'failure'>} mimeType
	 */
	function minimizeSupportedMimeType (mimeType) {
	  switch (mimeType.essence) {
	    case 'application/ecmascript':
	    case 'application/javascript':
	    case 'application/x-ecmascript':
	    case 'application/x-javascript':
	    case 'text/ecmascript':
	    case 'text/javascript':
	    case 'text/javascript1.0':
	    case 'text/javascript1.1':
	    case 'text/javascript1.2':
	    case 'text/javascript1.3':
	    case 'text/javascript1.4':
	    case 'text/javascript1.5':
	    case 'text/jscript':
	    case 'text/livescript':
	    case 'text/x-ecmascript':
	    case 'text/x-javascript':
	      // 1. If mimeType is a JavaScript MIME type, then return "text/javascript".
	      return 'text/javascript'
	    case 'application/json':
	    case 'text/json':
	      // 2. If mimeType is a JSON MIME type, then return "application/json".
	      return 'application/json'
	    case 'image/svg+xml':
	      // 3. If mimeType’s essence is "image/svg+xml", then return "image/svg+xml".
	      return 'image/svg+xml'
	    case 'text/xml':
	    case 'application/xml':
	      // 4. If mimeType is an XML MIME type, then return "application/xml".
	      return 'application/xml'
	  }

	  // 2. If mimeType is a JSON MIME type, then return "application/json".
	  if (mimeType.subtype.endsWith('+json')) {
	    return 'application/json'
	  }

	  // 4. If mimeType is an XML MIME type, then return "application/xml".
	  if (mimeType.subtype.endsWith('+xml')) {
	    return 'application/xml'
	  }

	  // 5. If mimeType is supported by the user agent, then return mimeType’s essence.
	  // Technically, node doesn't support any mimetypes.

	  // 6. Return the empty string.
	  return ''
	}

	dataUrl = {
	  dataURLProcessor,
	  URLSerializer,
	  collectASequenceOfCodePoints,
	  collectASequenceOfCodePointsFast,
	  stringPercentDecode,
	  parseMIMEType,
	  collectAnHTTPQuotedString,
	  serializeAMimeType,
	  removeChars,
	  minimizeSupportedMimeType,
	  HTTP_TOKEN_CODEPOINTS,
	  isomorphicDecode
	};
	return dataUrl;
}

var webidl_1;
var hasRequiredWebidl;

function requireWebidl () {
	if (hasRequiredWebidl) return webidl_1;
	hasRequiredWebidl = 1;

	const { types, inspect } = require$$0$2;
	const { toUSVString } = util$m;

	/** @type {import('../../../types/webidl').Webidl} */
	const webidl = {};
	webidl.converters = {};
	webidl.util = {};
	webidl.errors = {};

	webidl.errors.exception = function (message) {
	  return new TypeError(`${message.header}: ${message.message}`)
	};

	webidl.errors.conversionFailed = function (context) {
	  const plural = context.types.length === 1 ? '' : ' one of';
	  const message =
	    `${context.argument} could not be converted to` +
	    `${plural}: ${context.types.join(', ')}.`;

	  return webidl.errors.exception({
	    header: context.prefix,
	    message
	  })
	};

	webidl.errors.invalidArgument = function (context) {
	  return webidl.errors.exception({
	    header: context.prefix,
	    message: `"${context.value}" is an invalid ${context.type}.`
	  })
	};

	// https://webidl.spec.whatwg.org/#implements
	webidl.brandCheck = function (V, I, opts = undefined) {
	  if (opts?.strict !== false) {
	    if (!(V instanceof I)) {
	      throw new TypeError('Illegal invocation')
	    }
	  } else {
	    if (V?.[Symbol.toStringTag] !== I.prototype[Symbol.toStringTag]) {
	      throw new TypeError('Illegal invocation')
	    }
	  }
	};

	webidl.argumentLengthCheck = function ({ length }, min, ctx) {
	  if (length < min) {
	    throw webidl.errors.exception({
	      message: `${min} argument${min !== 1 ? 's' : ''} required, ` +
	               `but${length ? ' only' : ''} ${length} found.`,
	      ...ctx
	    })
	  }
	};

	webidl.illegalConstructor = function () {
	  throw webidl.errors.exception({
	    header: 'TypeError',
	    message: 'Illegal constructor'
	  })
	};

	// https://tc39.es/ecma262/#sec-ecmascript-data-types-and-values
	webidl.util.Type = function (V) {
	  switch (typeof V) {
	    case 'undefined': return 'Undefined'
	    case 'boolean': return 'Boolean'
	    case 'string': return 'String'
	    case 'symbol': return 'Symbol'
	    case 'number': return 'Number'
	    case 'bigint': return 'BigInt'
	    case 'function':
	    case 'object': {
	      if (V === null) {
	        return 'Null'
	      }

	      return 'Object'
	    }
	  }
	};

	// https://webidl.spec.whatwg.org/#abstract-opdef-converttoint
	webidl.util.ConvertToInt = function (V, bitLength, signedness, opts = {}) {
	  let upperBound;
	  let lowerBound;

	  // 1. If bitLength is 64, then:
	  if (bitLength === 64) {
	    // 1. Let upperBound be 2^53 − 1.
	    upperBound = Math.pow(2, 53) - 1;

	    // 2. If signedness is "unsigned", then let lowerBound be 0.
	    if (signedness === 'unsigned') {
	      lowerBound = 0;
	    } else {
	      // 3. Otherwise let lowerBound be −2^53 + 1.
	      lowerBound = Math.pow(-2, 53) + 1;
	    }
	  } else if (signedness === 'unsigned') {
	    // 2. Otherwise, if signedness is "unsigned", then:

	    // 1. Let lowerBound be 0.
	    lowerBound = 0;

	    // 2. Let upperBound be 2^bitLength − 1.
	    upperBound = Math.pow(2, bitLength) - 1;
	  } else {
	    // 3. Otherwise:

	    // 1. Let lowerBound be -2^bitLength − 1.
	    lowerBound = Math.pow(-2, bitLength) - 1;

	    // 2. Let upperBound be 2^bitLength − 1 − 1.
	    upperBound = Math.pow(2, bitLength - 1) - 1;
	  }

	  // 4. Let x be ? ToNumber(V).
	  let x = Number(V);

	  // 5. If x is −0, then set x to +0.
	  if (x === 0) {
	    x = 0;
	  }

	  // 6. If the conversion is to an IDL type associated
	  //    with the [EnforceRange] extended attribute, then:
	  if (opts.enforceRange === true) {
	    // 1. If x is NaN, +∞, or −∞, then throw a TypeError.
	    if (
	      Number.isNaN(x) ||
	      x === Number.POSITIVE_INFINITY ||
	      x === Number.NEGATIVE_INFINITY
	    ) {
	      throw webidl.errors.exception({
	        header: 'Integer conversion',
	        message: `Could not convert ${webidl.util.Stringify(V)} to an integer.`
	      })
	    }

	    // 2. Set x to IntegerPart(x).
	    x = webidl.util.IntegerPart(x);

	    // 3. If x < lowerBound or x > upperBound, then
	    //    throw a TypeError.
	    if (x < lowerBound || x > upperBound) {
	      throw webidl.errors.exception({
	        header: 'Integer conversion',
	        message: `Value must be between ${lowerBound}-${upperBound}, got ${x}.`
	      })
	    }

	    // 4. Return x.
	    return x
	  }

	  // 7. If x is not NaN and the conversion is to an IDL
	  //    type associated with the [Clamp] extended
	  //    attribute, then:
	  if (!Number.isNaN(x) && opts.clamp === true) {
	    // 1. Set x to min(max(x, lowerBound), upperBound).
	    x = Math.min(Math.max(x, lowerBound), upperBound);

	    // 2. Round x to the nearest integer, choosing the
	    //    even integer if it lies halfway between two,
	    //    and choosing +0 rather than −0.
	    if (Math.floor(x) % 2 === 0) {
	      x = Math.floor(x);
	    } else {
	      x = Math.ceil(x);
	    }

	    // 3. Return x.
	    return x
	  }

	  // 8. If x is NaN, +0, +∞, or −∞, then return +0.
	  if (
	    Number.isNaN(x) ||
	    (x === 0 && Object.is(0, x)) ||
	    x === Number.POSITIVE_INFINITY ||
	    x === Number.NEGATIVE_INFINITY
	  ) {
	    return 0
	  }

	  // 9. Set x to IntegerPart(x).
	  x = webidl.util.IntegerPart(x);

	  // 10. Set x to x modulo 2^bitLength.
	  x = x % Math.pow(2, bitLength);

	  // 11. If signedness is "signed" and x ≥ 2^bitLength − 1,
	  //    then return x − 2^bitLength.
	  if (signedness === 'signed' && x >= Math.pow(2, bitLength) - 1) {
	    return x - Math.pow(2, bitLength)
	  }

	  // 12. Otherwise, return x.
	  return x
	};

	// https://webidl.spec.whatwg.org/#abstract-opdef-integerpart
	webidl.util.IntegerPart = function (n) {
	  // 1. Let r be floor(abs(n)).
	  const r = Math.floor(Math.abs(n));

	  // 2. If n < 0, then return -1 × r.
	  if (n < 0) {
	    return -1 * r
	  }

	  // 3. Otherwise, return r.
	  return r
	};

	webidl.util.Stringify = function (V) {
	  const type = webidl.util.Type(V);

	  switch (type) {
	    case 'Symbol':
	      return `Symbol(${V.description})`
	    case 'Object':
	      return inspect(V)
	    case 'String':
	      return `"${V}"`
	    default:
	      return `${V}`
	  }
	};

	// https://webidl.spec.whatwg.org/#es-sequence
	webidl.sequenceConverter = function (converter) {
	  return (V, Iterable) => {
	    // 1. If Type(V) is not Object, throw a TypeError.
	    if (webidl.util.Type(V) !== 'Object') {
	      throw webidl.errors.exception({
	        header: 'Sequence',
	        message: `Value of type ${webidl.util.Type(V)} is not an Object.`
	      })
	    }

	    // 2. Let method be ? GetMethod(V, @@iterator).
	    /** @type {Generator} */
	    const method = typeof Iterable === 'function' ? Iterable() : V?.[Symbol.iterator]?.();
	    const seq = [];

	    // 3. If method is undefined, throw a TypeError.
	    if (
	      method === undefined ||
	      typeof method.next !== 'function'
	    ) {
	      throw webidl.errors.exception({
	        header: 'Sequence',
	        message: 'Object is not an iterator.'
	      })
	    }

	    // https://webidl.spec.whatwg.org/#create-sequence-from-iterable
	    while (true) {
	      const { done, value } = method.next();

	      if (done) {
	        break
	      }

	      seq.push(converter(value));
	    }

	    return seq
	  }
	};

	// https://webidl.spec.whatwg.org/#es-to-record
	webidl.recordConverter = function (keyConverter, valueConverter) {
	  return (O) => {
	    // 1. If Type(O) is not Object, throw a TypeError.
	    if (webidl.util.Type(O) !== 'Object') {
	      throw webidl.errors.exception({
	        header: 'Record',
	        message: `Value of type ${webidl.util.Type(O)} is not an Object.`
	      })
	    }

	    // 2. Let result be a new empty instance of record<K, V>.
	    const result = {};

	    if (!types.isProxy(O)) {
	      // 1. Let desc be ? O.[[GetOwnProperty]](key).
	      const keys = [...Object.getOwnPropertyNames(O), ...Object.getOwnPropertySymbols(O)];

	      for (const key of keys) {
	        // 1. Let typedKey be key converted to an IDL value of type K.
	        const typedKey = keyConverter(key);

	        // 2. Let value be ? Get(O, key).
	        // 3. Let typedValue be value converted to an IDL value of type V.
	        const typedValue = valueConverter(O[key]);

	        // 4. Set result[typedKey] to typedValue.
	        result[typedKey] = typedValue;
	      }

	      // 5. Return result.
	      return result
	    }

	    // 3. Let keys be ? O.[[OwnPropertyKeys]]().
	    const keys = Reflect.ownKeys(O);

	    // 4. For each key of keys.
	    for (const key of keys) {
	      // 1. Let desc be ? O.[[GetOwnProperty]](key).
	      const desc = Reflect.getOwnPropertyDescriptor(O, key);

	      // 2. If desc is not undefined and desc.[[Enumerable]] is true:
	      if (desc?.enumerable) {
	        // 1. Let typedKey be key converted to an IDL value of type K.
	        const typedKey = keyConverter(key);

	        // 2. Let value be ? Get(O, key).
	        // 3. Let typedValue be value converted to an IDL value of type V.
	        const typedValue = valueConverter(O[key]);

	        // 4. Set result[typedKey] to typedValue.
	        result[typedKey] = typedValue;
	      }
	    }

	    // 5. Return result.
	    return result
	  }
	};

	webidl.interfaceConverter = function (i) {
	  return (V, opts = {}) => {
	    if (opts.strict !== false && !(V instanceof i)) {
	      throw webidl.errors.exception({
	        header: i.name,
	        message: `Expected ${webidl.util.Stringify(V)} to be an instance of ${i.name}.`
	      })
	    }

	    return V
	  }
	};

	webidl.dictionaryConverter = function (converters) {
	  return (dictionary) => {
	    const type = webidl.util.Type(dictionary);
	    const dict = {};

	    if (type === 'Null' || type === 'Undefined') {
	      return dict
	    } else if (type !== 'Object') {
	      throw webidl.errors.exception({
	        header: 'Dictionary',
	        message: `Expected ${dictionary} to be one of: Null, Undefined, Object.`
	      })
	    }

	    for (const options of converters) {
	      const { key, defaultValue, required, converter } = options;

	      if (required === true) {
	        if (!Object.hasOwn(dictionary, key)) {
	          throw webidl.errors.exception({
	            header: 'Dictionary',
	            message: `Missing required key "${key}".`
	          })
	        }
	      }

	      let value = dictionary[key];
	      const hasDefault = Object.hasOwn(options, 'defaultValue');

	      // Only use defaultValue if value is undefined and
	      // a defaultValue options was provided.
	      if (hasDefault && value !== null) {
	        value = value ?? defaultValue;
	      }

	      // A key can be optional and have no default value.
	      // When this happens, do not perform a conversion,
	      // and do not assign the key a value.
	      if (required || hasDefault || value !== undefined) {
	        value = converter(value);

	        if (
	          options.allowedValues &&
	          !options.allowedValues.includes(value)
	        ) {
	          throw webidl.errors.exception({
	            header: 'Dictionary',
	            message: `${value} is not an accepted type. Expected one of ${options.allowedValues.join(', ')}.`
	          })
	        }

	        dict[key] = value;
	      }
	    }

	    return dict
	  }
	};

	webidl.nullableConverter = function (converter) {
	  return (V) => {
	    if (V === null) {
	      return V
	    }

	    return converter(V)
	  }
	};

	// https://webidl.spec.whatwg.org/#es-DOMString
	webidl.converters.DOMString = function (V, opts = {}) {
	  // 1. If V is null and the conversion is to an IDL type
	  //    associated with the [LegacyNullToEmptyString]
	  //    extended attribute, then return the DOMString value
	  //    that represents the empty string.
	  if (V === null && opts.legacyNullToEmptyString) {
	    return ''
	  }

	  // 2. Let x be ? ToString(V).
	  if (typeof V === 'symbol') {
	    throw new TypeError('Could not convert argument of type symbol to string.')
	  }

	  // 3. Return the IDL DOMString value that represents the
	  //    same sequence of code units as the one the
	  //    ECMAScript String value x represents.
	  return String(V)
	};

	// https://webidl.spec.whatwg.org/#es-ByteString
	webidl.converters.ByteString = function (V) {
	  // 1. Let x be ? ToString(V).
	  // Note: DOMString converter perform ? ToString(V)
	  const x = webidl.converters.DOMString(V);

	  // 2. If the value of any element of x is greater than
	  //    255, then throw a TypeError.
	  for (let index = 0; index < x.length; index++) {
	    if (x.charCodeAt(index) > 255) {
	      throw new TypeError(
	        'Cannot convert argument to a ByteString because the character at ' +
	        `index ${index} has a value of ${x.charCodeAt(index)} which is greater than 255.`
	      )
	    }
	  }

	  // 3. Return an IDL ByteString value whose length is the
	  //    length of x, and where the value of each element is
	  //    the value of the corresponding element of x.
	  return x
	};

	// https://webidl.spec.whatwg.org/#es-USVString
	webidl.converters.USVString = toUSVString;

	// https://webidl.spec.whatwg.org/#es-boolean
	webidl.converters.boolean = function (V) {
	  // 1. Let x be the result of computing ToBoolean(V).
	  const x = Boolean(V);

	  // 2. Return the IDL boolean value that is the one that represents
	  //    the same truth value as the ECMAScript Boolean value x.
	  return x
	};

	// https://webidl.spec.whatwg.org/#es-any
	webidl.converters.any = function (V) {
	  return V
	};

	// https://webidl.spec.whatwg.org/#es-long-long
	webidl.converters['long long'] = function (V) {
	  // 1. Let x be ? ConvertToInt(V, 64, "signed").
	  const x = webidl.util.ConvertToInt(V, 64, 'signed');

	  // 2. Return the IDL long long value that represents
	  //    the same numeric value as x.
	  return x
	};

	// https://webidl.spec.whatwg.org/#es-unsigned-long-long
	webidl.converters['unsigned long long'] = function (V) {
	  // 1. Let x be ? ConvertToInt(V, 64, "unsigned").
	  const x = webidl.util.ConvertToInt(V, 64, 'unsigned');

	  // 2. Return the IDL unsigned long long value that
	  //    represents the same numeric value as x.
	  return x
	};

	// https://webidl.spec.whatwg.org/#es-unsigned-long
	webidl.converters['unsigned long'] = function (V) {
	  // 1. Let x be ? ConvertToInt(V, 32, "unsigned").
	  const x = webidl.util.ConvertToInt(V, 32, 'unsigned');

	  // 2. Return the IDL unsigned long value that
	  //    represents the same numeric value as x.
	  return x
	};

	// https://webidl.spec.whatwg.org/#es-unsigned-short
	webidl.converters['unsigned short'] = function (V, opts) {
	  // 1. Let x be ? ConvertToInt(V, 16, "unsigned").
	  const x = webidl.util.ConvertToInt(V, 16, 'unsigned', opts);

	  // 2. Return the IDL unsigned short value that represents
	  //    the same numeric value as x.
	  return x
	};

	// https://webidl.spec.whatwg.org/#idl-ArrayBuffer
	webidl.converters.ArrayBuffer = function (V, opts = {}) {
	  // 1. If Type(V) is not Object, or V does not have an
	  //    [[ArrayBufferData]] internal slot, then throw a
	  //    TypeError.
	  // see: https://tc39.es/ecma262/#sec-properties-of-the-arraybuffer-instances
	  // see: https://tc39.es/ecma262/#sec-properties-of-the-sharedarraybuffer-instances
	  if (
	    webidl.util.Type(V) !== 'Object' ||
	    !types.isAnyArrayBuffer(V)
	  ) {
	    throw webidl.errors.conversionFailed({
	      prefix: webidl.util.Stringify(V),
	      argument: webidl.util.Stringify(V),
	      types: ['ArrayBuffer']
	    })
	  }

	  // 2. If the conversion is not to an IDL type associated
	  //    with the [AllowShared] extended attribute, and
	  //    IsSharedArrayBuffer(V) is true, then throw a
	  //    TypeError.
	  if (opts.allowShared === false && types.isSharedArrayBuffer(V)) {
	    throw webidl.errors.exception({
	      header: 'ArrayBuffer',
	      message: 'SharedArrayBuffer is not allowed.'
	    })
	  }

	  // 3. If the conversion is not to an IDL type associated
	  //    with the [AllowResizable] extended attribute, and
	  //    IsResizableArrayBuffer(V) is true, then throw a
	  //    TypeError.
	  if (V.resizable || V.growable) {
	    throw webidl.errors.exception({
	      header: 'ArrayBuffer',
	      message: 'Received a resizable ArrayBuffer.'
	    })
	  }

	  // 4. Return the IDL ArrayBuffer value that is a
	  //    reference to the same object as V.
	  return V
	};

	webidl.converters.TypedArray = function (V, T, opts = {}) {
	  // 1. Let T be the IDL type V is being converted to.

	  // 2. If Type(V) is not Object, or V does not have a
	  //    [[TypedArrayName]] internal slot with a value
	  //    equal to T’s name, then throw a TypeError.
	  if (
	    webidl.util.Type(V) !== 'Object' ||
	    !types.isTypedArray(V) ||
	    V.constructor.name !== T.name
	  ) {
	    throw webidl.errors.conversionFailed({
	      prefix: `${T.name}`,
	      argument: webidl.util.Stringify(V),
	      types: [T.name]
	    })
	  }

	  // 3. If the conversion is not to an IDL type associated
	  //    with the [AllowShared] extended attribute, and
	  //    IsSharedArrayBuffer(V.[[ViewedArrayBuffer]]) is
	  //    true, then throw a TypeError.
	  if (opts.allowShared === false && types.isSharedArrayBuffer(V.buffer)) {
	    throw webidl.errors.exception({
	      header: 'ArrayBuffer',
	      message: 'SharedArrayBuffer is not allowed.'
	    })
	  }

	  // 4. If the conversion is not to an IDL type associated
	  //    with the [AllowResizable] extended attribute, and
	  //    IsResizableArrayBuffer(V.[[ViewedArrayBuffer]]) is
	  //    true, then throw a TypeError.
	  if (V.buffer.resizable || V.buffer.growable) {
	    throw webidl.errors.exception({
	      header: 'ArrayBuffer',
	      message: 'Received a resizable ArrayBuffer.'
	    })
	  }

	  // 5. Return the IDL value of type T that is a reference
	  //    to the same object as V.
	  return V
	};

	webidl.converters.DataView = function (V, opts = {}) {
	  // 1. If Type(V) is not Object, or V does not have a
	  //    [[DataView]] internal slot, then throw a TypeError.
	  if (webidl.util.Type(V) !== 'Object' || !types.isDataView(V)) {
	    throw webidl.errors.exception({
	      header: 'DataView',
	      message: 'Object is not a DataView.'
	    })
	  }

	  // 2. If the conversion is not to an IDL type associated
	  //    with the [AllowShared] extended attribute, and
	  //    IsSharedArrayBuffer(V.[[ViewedArrayBuffer]]) is true,
	  //    then throw a TypeError.
	  if (opts.allowShared === false && types.isSharedArrayBuffer(V.buffer)) {
	    throw webidl.errors.exception({
	      header: 'ArrayBuffer',
	      message: 'SharedArrayBuffer is not allowed.'
	    })
	  }

	  // 3. If the conversion is not to an IDL type associated
	  //    with the [AllowResizable] extended attribute, and
	  //    IsResizableArrayBuffer(V.[[ViewedArrayBuffer]]) is
	  //    true, then throw a TypeError.
	  if (V.buffer.resizable || V.buffer.growable) {
	    throw webidl.errors.exception({
	      header: 'ArrayBuffer',
	      message: 'Received a resizable ArrayBuffer.'
	    })
	  }

	  // 4. Return the IDL DataView value that is a reference
	  //    to the same object as V.
	  return V
	};

	// https://webidl.spec.whatwg.org/#BufferSource
	webidl.converters.BufferSource = function (V, opts = {}) {
	  if (types.isAnyArrayBuffer(V)) {
	    return webidl.converters.ArrayBuffer(V, { ...opts, allowShared: false })
	  }

	  if (types.isTypedArray(V)) {
	    return webidl.converters.TypedArray(V, V.constructor, { ...opts, allowShared: false })
	  }

	  if (types.isDataView(V)) {
	    return webidl.converters.DataView(V, opts, { ...opts, allowShared: false })
	  }

	  throw new TypeError(`Could not convert ${webidl.util.Stringify(V)} to a BufferSource.`)
	};

	webidl.converters['sequence<ByteString>'] = webidl.sequenceConverter(
	  webidl.converters.ByteString
	);

	webidl.converters['sequence<sequence<ByteString>>'] = webidl.sequenceConverter(
	  webidl.converters['sequence<ByteString>']
	);

	webidl.converters['record<ByteString, ByteString>'] = webidl.recordConverter(
	  webidl.converters.ByteString,
	  webidl.converters.ByteString
	);

	webidl_1 = {
	  webidl
	};
	return webidl_1;
}

var util$j;
var hasRequiredUtil$5;

function requireUtil$5 () {
	if (hasRequiredUtil$5) return util$j;
	hasRequiredUtil$5 = 1;

	const { Transform } = require$$0$1;
	const zlib = require$$1;
	const { redirectStatusSet, referrerPolicySet: referrerPolicyTokens, badPortsSet } = requireConstants$2();
	const { getGlobalOrigin } = requireGlobal();
	const { collectASequenceOfCodePoints, collectAnHTTPQuotedString, removeChars, parseMIMEType } = requireDataUrl();
	const { performance } = require$$5;
	const { isBlobLike, ReadableStreamFrom, isValidHTTPToken } = util$m;
	const assert = require$$0;
	const { isUint8Array } = require$$8$1;
	const { webidl } = requireWebidl();

	let supportedHashes = [];

	// https://nodejs.org/api/crypto.html#determining-if-crypto-support-is-unavailable
	/** @type {import('crypto')} */
	let crypto;
	try {
	  crypto = require('node:crypto');
	  const possibleRelevantHashes = ['sha256', 'sha384', 'sha512'];
	  supportedHashes = crypto.getHashes().filter((hash) => possibleRelevantHashes.includes(hash));
	/* c8 ignore next 3 */
	} catch {

	}

	function responseURL (response) {
	  // https://fetch.spec.whatwg.org/#responses
	  // A response has an associated URL. It is a pointer to the last URL
	  // in response’s URL list and null if response’s URL list is empty.
	  const urlList = response.urlList;
	  const length = urlList.length;
	  return length === 0 ? null : urlList[length - 1].toString()
	}

	// https://fetch.spec.whatwg.org/#concept-response-location-url
	function responseLocationURL (response, requestFragment) {
	  // 1. If response’s status is not a redirect status, then return null.
	  if (!redirectStatusSet.has(response.status)) {
	    return null
	  }

	  // 2. Let location be the result of extracting header list values given
	  // `Location` and response’s header list.
	  let location = response.headersList.get('location', true);

	  // 3. If location is a header value, then set location to the result of
	  //    parsing location with response’s URL.
	  if (location !== null && isValidHeaderValue(location)) {
	    if (!isValidEncodedURL(location)) {
	      // Some websites respond location header in UTF-8 form without encoding them as ASCII
	      // and major browsers redirect them to correctly UTF-8 encoded addresses.
	      // Here, we handle that behavior in the same way.
	      location = normalizeBinaryStringToUtf8(location);
	    }
	    location = new URL(location, responseURL(response));
	  }

	  // 4. If location is a URL whose fragment is null, then set location’s
	  // fragment to requestFragment.
	  if (location && !location.hash) {
	    location.hash = requestFragment;
	  }

	  // 5. Return location.
	  return location
	}

	/**
	 * @see https://www.rfc-editor.org/rfc/rfc1738#section-2.2
	 * @param {string} url
	 * @returns {boolean}
	 */
	function isValidEncodedURL (url) {
	  for (const c of url) {
	    const code = c.charCodeAt(0);
	    // Not used in US-ASCII
	    if (code >= 0x80) {
	      return false
	    }
	    // Control characters
	    if ((code >= 0x00 && code <= 0x1F) || code === 0x7F) {
	      return false
	    }
	  }
	  return true
	}

	/**
	 * If string contains non-ASCII characters, assumes it's UTF-8 encoded and decodes it.
	 * Since UTF-8 is a superset of ASCII, this will work for ASCII strings as well.
	 * @param {string} value
	 * @returns {string}
	 */
	function normalizeBinaryStringToUtf8 (value) {
	  return Buffer.from(value, 'binary').toString('utf8')
	}

	/** @returns {URL} */
	function requestCurrentURL (request) {
	  return request.urlList[request.urlList.length - 1]
	}

	function requestBadPort (request) {
	  // 1. Let url be request’s current URL.
	  const url = requestCurrentURL(request);

	  // 2. If url’s scheme is an HTTP(S) scheme and url’s port is a bad port,
	  // then return blocked.
	  if (urlIsHttpHttpsScheme(url) && badPortsSet.has(url.port)) {
	    return 'blocked'
	  }

	  // 3. Return allowed.
	  return 'allowed'
	}

	function isErrorLike (object) {
	  return object instanceof Error || (
	    object?.constructor?.name === 'Error' ||
	    object?.constructor?.name === 'DOMException'
	  )
	}

	// Check whether |statusText| is a ByteString and
	// matches the Reason-Phrase token production.
	// RFC 2616: https://tools.ietf.org/html/rfc2616
	// RFC 7230: https://tools.ietf.org/html/rfc7230
	// "reason-phrase = *( HTAB / SP / VCHAR / obs-text )"
	// https://github.com/chromium/chromium/blob/94.0.4604.1/third_party/blink/renderer/core/fetch/response.cc#L116
	function isValidReasonPhrase (statusText) {
	  for (let i = 0; i < statusText.length; ++i) {
	    const c = statusText.charCodeAt(i);
	    if (
	      !(
	        (
	          c === 0x09 || // HTAB
	          (c >= 0x20 && c <= 0x7e) || // SP / VCHAR
	          (c >= 0x80 && c <= 0xff)
	        ) // obs-text
	      )
	    ) {
	      return false
	    }
	  }
	  return true
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#header-name
	 * @param {string} potentialValue
	 */
	const isValidHeaderName = isValidHTTPToken;

	/**
	 * @see https://fetch.spec.whatwg.org/#header-value
	 * @param {string} potentialValue
	 */
	function isValidHeaderValue (potentialValue) {
	  // - Has no leading or trailing HTTP tab or space bytes.
	  // - Contains no 0x00 (NUL) or HTTP newline bytes.
	  if (
	    potentialValue.startsWith('\t') ||
	    potentialValue.startsWith(' ') ||
	    potentialValue.endsWith('\t') ||
	    potentialValue.endsWith(' ')
	  ) {
	    return false
	  }

	  if (
	    potentialValue.includes('\0') ||
	    potentialValue.includes('\r') ||
	    potentialValue.includes('\n')
	  ) {
	    return false
	  }

	  return true
	}

	// https://w3c.github.io/webappsec-referrer-policy/#set-requests-referrer-policy-on-redirect
	function setRequestReferrerPolicyOnRedirect (request, actualResponse) {
	  //  Given a request request and a response actualResponse, this algorithm
	  //  updates request’s referrer policy according to the Referrer-Policy
	  //  header (if any) in actualResponse.

	  // 1. Let policy be the result of executing § 8.1 Parse a referrer policy
	  // from a Referrer-Policy header on actualResponse.

	  // 8.1 Parse a referrer policy from a Referrer-Policy header
	  // 1. Let policy-tokens be the result of extracting header list values given `Referrer-Policy` and response’s header list.
	  const { headersList } = actualResponse;
	  // 2. Let policy be the empty string.
	  // 3. For each token in policy-tokens, if token is a referrer policy and token is not the empty string, then set policy to token.
	  // 4. Return policy.
	  const policyHeader = (headersList.get('referrer-policy', true) ?? '').split(',');

	  // Note: As the referrer-policy can contain multiple policies
	  // separated by comma, we need to loop through all of them
	  // and pick the first valid one.
	  // Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy#specify_a_fallback_policy
	  let policy = '';
	  if (policyHeader.length > 0) {
	    // The right-most policy takes precedence.
	    // The left-most policy is the fallback.
	    for (let i = policyHeader.length; i !== 0; i--) {
	      const token = policyHeader[i - 1].trim();
	      if (referrerPolicyTokens.has(token)) {
	        policy = token;
	        break
	      }
	    }
	  }

	  // 2. If policy is not the empty string, then set request’s referrer policy to policy.
	  if (policy !== '') {
	    request.referrerPolicy = policy;
	  }
	}

	// https://fetch.spec.whatwg.org/#cross-origin-resource-policy-check
	function crossOriginResourcePolicyCheck () {
	  // TODO
	  return 'allowed'
	}

	// https://fetch.spec.whatwg.org/#concept-cors-check
	function corsCheck () {
	  // TODO
	  return 'success'
	}

	// https://fetch.spec.whatwg.org/#concept-tao-check
	function TAOCheck () {
	  // TODO
	  return 'success'
	}

	function appendFetchMetadata (httpRequest) {
	  //  https://w3c.github.io/webappsec-fetch-metadata/#sec-fetch-dest-header
	  //  TODO

	  //  https://w3c.github.io/webappsec-fetch-metadata/#sec-fetch-mode-header

	  //  1. Assert: r’s url is a potentially trustworthy URL.
	  //  TODO

	  //  2. Let header be a Structured Header whose value is a token.
	  let header = null;

	  //  3. Set header’s value to r’s mode.
	  header = httpRequest.mode;

	  //  4. Set a structured field value `Sec-Fetch-Mode`/header in r’s header list.
	  httpRequest.headersList.set('sec-fetch-mode', header, true);

	  //  https://w3c.github.io/webappsec-fetch-metadata/#sec-fetch-site-header
	  //  TODO

	  //  https://w3c.github.io/webappsec-fetch-metadata/#sec-fetch-user-header
	  //  TODO
	}

	// https://fetch.spec.whatwg.org/#append-a-request-origin-header
	function appendRequestOriginHeader (request) {
	  // 1. Let serializedOrigin be the result of byte-serializing a request origin with request.
	  let serializedOrigin = request.origin;

	  // 2. If request’s response tainting is "cors" or request’s mode is "websocket", then append (`Origin`, serializedOrigin) to request’s header list.
	  if (request.responseTainting === 'cors' || request.mode === 'websocket') {
	    if (serializedOrigin) {
	      request.headersList.append('origin', serializedOrigin, true);
	    }

	  // 3. Otherwise, if request’s method is neither `GET` nor `HEAD`, then:
	  } else if (request.method !== 'GET' && request.method !== 'HEAD') {
	    // 1. Switch on request’s referrer policy:
	    switch (request.referrerPolicy) {
	      case 'no-referrer':
	        // Set serializedOrigin to `null`.
	        serializedOrigin = null;
	        break
	      case 'no-referrer-when-downgrade':
	      case 'strict-origin':
	      case 'strict-origin-when-cross-origin':
	        // If request’s origin is a tuple origin, its scheme is "https", and request’s current URL’s scheme is not "https", then set serializedOrigin to `null`.
	        if (request.origin && urlHasHttpsScheme(request.origin) && !urlHasHttpsScheme(requestCurrentURL(request))) {
	          serializedOrigin = null;
	        }
	        break
	      case 'same-origin':
	        // If request’s origin is not same origin with request’s current URL’s origin, then set serializedOrigin to `null`.
	        if (!sameOrigin(request, requestCurrentURL(request))) {
	          serializedOrigin = null;
	        }
	        break
	        // Do nothing.
	    }

	    if (serializedOrigin) {
	      // 2. Append (`Origin`, serializedOrigin) to request’s header list.
	      request.headersList.append('origin', serializedOrigin, true);
	    }
	  }
	}

	// https://w3c.github.io/hr-time/#dfn-coarsen-time
	function coarsenTime (timestamp, crossOriginIsolatedCapability) {
	  // TODO
	  return timestamp
	}

	// https://fetch.spec.whatwg.org/#clamp-and-coarsen-connection-timing-info
	function clampAndCoarsenConnectionTimingInfo (connectionTimingInfo, defaultStartTime, crossOriginIsolatedCapability) {
	  if (!connectionTimingInfo?.startTime || connectionTimingInfo.startTime < defaultStartTime) {
	    return {
	      domainLookupStartTime: defaultStartTime,
	      domainLookupEndTime: defaultStartTime,
	      connectionStartTime: defaultStartTime,
	      connectionEndTime: defaultStartTime,
	      secureConnectionStartTime: defaultStartTime,
	      ALPNNegotiatedProtocol: connectionTimingInfo?.ALPNNegotiatedProtocol
	    }
	  }

	  return {
	    domainLookupStartTime: coarsenTime(connectionTimingInfo.domainLookupStartTime),
	    domainLookupEndTime: coarsenTime(connectionTimingInfo.domainLookupEndTime),
	    connectionStartTime: coarsenTime(connectionTimingInfo.connectionStartTime),
	    connectionEndTime: coarsenTime(connectionTimingInfo.connectionEndTime),
	    secureConnectionStartTime: coarsenTime(connectionTimingInfo.secureConnectionStartTime),
	    ALPNNegotiatedProtocol: connectionTimingInfo.ALPNNegotiatedProtocol
	  }
	}

	// https://w3c.github.io/hr-time/#dfn-coarsened-shared-current-time
	function coarsenedSharedCurrentTime (crossOriginIsolatedCapability) {
	  return coarsenTime(performance.now())
	}

	// https://fetch.spec.whatwg.org/#create-an-opaque-timing-info
	function createOpaqueTimingInfo (timingInfo) {
	  return {
	    startTime: timingInfo.startTime ?? 0,
	    redirectStartTime: 0,
	    redirectEndTime: 0,
	    postRedirectStartTime: timingInfo.startTime ?? 0,
	    finalServiceWorkerStartTime: 0,
	    finalNetworkResponseStartTime: 0,
	    finalNetworkRequestStartTime: 0,
	    endTime: 0,
	    encodedBodySize: 0,
	    decodedBodySize: 0,
	    finalConnectionTimingInfo: null
	  }
	}

	// https://html.spec.whatwg.org/multipage/origin.html#policy-container
	function makePolicyContainer () {
	  // Note: the fetch spec doesn't make use of embedder policy or CSP list
	  return {
	    referrerPolicy: 'strict-origin-when-cross-origin'
	  }
	}

	// https://html.spec.whatwg.org/multipage/origin.html#clone-a-policy-container
	function clonePolicyContainer (policyContainer) {
	  return {
	    referrerPolicy: policyContainer.referrerPolicy
	  }
	}

	// https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer
	function determineRequestsReferrer (request) {
	  // 1. Let policy be request's referrer policy.
	  const policy = request.referrerPolicy;

	  // Note: policy cannot (shouldn't) be null or an empty string.
	  assert(policy);

	  // 2. Let environment be request’s client.

	  let referrerSource = null;

	  // 3. Switch on request’s referrer:
	  if (request.referrer === 'client') {
	    // Note: node isn't a browser and doesn't implement document/iframes,
	    // so we bypass this step and replace it with our own.

	    const globalOrigin = getGlobalOrigin();

	    if (!globalOrigin || globalOrigin.origin === 'null') {
	      return 'no-referrer'
	    }

	    // note: we need to clone it as it's mutated
	    referrerSource = new URL(globalOrigin);
	  } else if (request.referrer instanceof URL) {
	    // Let referrerSource be request’s referrer.
	    referrerSource = request.referrer;
	  }

	  // 4. Let request’s referrerURL be the result of stripping referrerSource for
	  //    use as a referrer.
	  let referrerURL = stripURLForReferrer(referrerSource);

	  // 5. Let referrerOrigin be the result of stripping referrerSource for use as
	  //    a referrer, with the origin-only flag set to true.
	  const referrerOrigin = stripURLForReferrer(referrerSource, true);

	  // 6. If the result of serializing referrerURL is a string whose length is
	  //    greater than 4096, set referrerURL to referrerOrigin.
	  if (referrerURL.toString().length > 4096) {
	    referrerURL = referrerOrigin;
	  }

	  const areSameOrigin = sameOrigin(request, referrerURL);
	  const isNonPotentiallyTrustWorthy = isURLPotentiallyTrustworthy(referrerURL) &&
	    !isURLPotentiallyTrustworthy(request.url);

	  // 8. Execute the switch statements corresponding to the value of policy:
	  switch (policy) {
	    case 'origin': return referrerOrigin != null ? referrerOrigin : stripURLForReferrer(referrerSource, true)
	    case 'unsafe-url': return referrerURL
	    case 'same-origin':
	      return areSameOrigin ? referrerOrigin : 'no-referrer'
	    case 'origin-when-cross-origin':
	      return areSameOrigin ? referrerURL : referrerOrigin
	    case 'strict-origin-when-cross-origin': {
	      const currentURL = requestCurrentURL(request);

	      // 1. If the origin of referrerURL and the origin of request’s current
	      //    URL are the same, then return referrerURL.
	      if (sameOrigin(referrerURL, currentURL)) {
	        return referrerURL
	      }

	      // 2. If referrerURL is a potentially trustworthy URL and request’s
	      //    current URL is not a potentially trustworthy URL, then return no
	      //    referrer.
	      if (isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(currentURL)) {
	        return 'no-referrer'
	      }

	      // 3. Return referrerOrigin.
	      return referrerOrigin
	    }
	    case 'strict-origin': // eslint-disable-line
	      /**
	         * 1. If referrerURL is a potentially trustworthy URL and
	         * request’s current URL is not a potentially trustworthy URL,
	         * then return no referrer.
	         * 2. Return referrerOrigin
	        */
	    case 'no-referrer-when-downgrade': // eslint-disable-line
	      /**
	       * 1. If referrerURL is a potentially trustworthy URL and
	       * request’s current URL is not a potentially trustworthy URL,
	       * then return no referrer.
	       * 2. Return referrerOrigin
	      */

	    default: // eslint-disable-line
	      return isNonPotentiallyTrustWorthy ? 'no-referrer' : referrerOrigin
	  }
	}

	/**
	 * @see https://w3c.github.io/webappsec-referrer-policy/#strip-url
	 * @param {URL} url
	 * @param {boolean|undefined} originOnly
	 */
	function stripURLForReferrer (url, originOnly) {
	  // 1. Assert: url is a URL.
	  assert(url instanceof URL);

	  url = new URL(url);

	  // 2. If url’s scheme is a local scheme, then return no referrer.
	  if (url.protocol === 'file:' || url.protocol === 'about:' || url.protocol === 'blank:') {
	    return 'no-referrer'
	  }

	  // 3. Set url’s username to the empty string.
	  url.username = '';

	  // 4. Set url’s password to the empty string.
	  url.password = '';

	  // 5. Set url’s fragment to null.
	  url.hash = '';

	  // 6. If the origin-only flag is true, then:
	  if (originOnly) {
	    // 1. Set url’s path to « the empty string ».
	    url.pathname = '';

	    // 2. Set url’s query to null.
	    url.search = '';
	  }

	  // 7. Return url.
	  return url
	}

	function isURLPotentiallyTrustworthy (url) {
	  if (!(url instanceof URL)) {
	    return false
	  }

	  // If child of about, return true
	  if (url.href === 'about:blank' || url.href === 'about:srcdoc') {
	    return true
	  }

	  // If scheme is data, return true
	  if (url.protocol === 'data:') return true

	  // If file, return true
	  if (url.protocol === 'file:') return true

	  return isOriginPotentiallyTrustworthy(url.origin)

	  function isOriginPotentiallyTrustworthy (origin) {
	    // If origin is explicitly null, return false
	    if (origin == null || origin === 'null') return false

	    const originAsURL = new URL(origin);

	    // If secure, return true
	    if (originAsURL.protocol === 'https:' || originAsURL.protocol === 'wss:') {
	      return true
	    }

	    // If localhost or variants, return true
	    if (/^127(?:\.[0-9]+){0,2}\.[0-9]+$|^\[(?:0*:)*?:?0*1\]$/.test(originAsURL.hostname) ||
	     (originAsURL.hostname === 'localhost' || originAsURL.hostname.includes('localhost.')) ||
	     (originAsURL.hostname.endsWith('.localhost'))) {
	      return true
	    }

	    // If any other, return false
	    return false
	  }
	}

	/**
	 * @see https://w3c.github.io/webappsec-subresource-integrity/#does-response-match-metadatalist
	 * @param {Uint8Array} bytes
	 * @param {string} metadataList
	 */
	function bytesMatch (bytes, metadataList) {
	  // If node is not built with OpenSSL support, we cannot check
	  // a request's integrity, so allow it by default (the spec will
	  // allow requests if an invalid hash is given, as precedence).
	  /* istanbul ignore if: only if node is built with --without-ssl */
	  if (crypto === undefined) {
	    return true
	  }

	  // 1. Let parsedMetadata be the result of parsing metadataList.
	  const parsedMetadata = parseMetadata(metadataList);

	  // 2. If parsedMetadata is no metadata, return true.
	  if (parsedMetadata === 'no metadata') {
	    return true
	  }

	  // 3. If response is not eligible for integrity validation, return false.
	  // TODO

	  // 4. If parsedMetadata is the empty set, return true.
	  if (parsedMetadata.length === 0) {
	    return true
	  }

	  // 5. Let metadata be the result of getting the strongest
	  //    metadata from parsedMetadata.
	  const strongest = getStrongestMetadata(parsedMetadata);
	  const metadata = filterMetadataListByAlgorithm(parsedMetadata, strongest);

	  // 6. For each item in metadata:
	  for (const item of metadata) {
	    // 1. Let algorithm be the alg component of item.
	    const algorithm = item.algo;

	    // 2. Let expectedValue be the val component of item.
	    const expectedValue = item.hash;

	    // See https://github.com/web-platform-tests/wpt/commit/e4c5cc7a5e48093220528dfdd1c4012dc3837a0e
	    // "be liberal with padding". This is annoying, and it's not even in the spec.

	    // 3. Let actualValue be the result of applying algorithm to bytes.
	    let actualValue = crypto.createHash(algorithm).update(bytes).digest('base64');

	    if (actualValue[actualValue.length - 1] === '=') {
	      if (actualValue[actualValue.length - 2] === '=') {
	        actualValue = actualValue.slice(0, -2);
	      } else {
	        actualValue = actualValue.slice(0, -1);
	      }
	    }

	    // 4. If actualValue is a case-sensitive match for expectedValue,
	    //    return true.
	    if (compareBase64Mixed(actualValue, expectedValue)) {
	      return true
	    }
	  }

	  // 7. Return false.
	  return false
	}

	// https://w3c.github.io/webappsec-subresource-integrity/#grammardef-hash-with-options
	// https://www.w3.org/TR/CSP2/#source-list-syntax
	// https://www.rfc-editor.org/rfc/rfc5234#appendix-B.1
	const parseHashWithOptions = /(?<algo>sha256|sha384|sha512)-((?<hash>[A-Za-z0-9+/]+|[A-Za-z0-9_-]+)={0,2}(?:\s|$)( +[!-~]*)?)?/i;

	/**
	 * @see https://w3c.github.io/webappsec-subresource-integrity/#parse-metadata
	 * @param {string} metadata
	 */
	function parseMetadata (metadata) {
	  // 1. Let result be the empty set.
	  /** @type {{ algo: string, hash: string }[]} */
	  const result = [];

	  // 2. Let empty be equal to true.
	  let empty = true;

	  // 3. For each token returned by splitting metadata on spaces:
	  for (const token of metadata.split(' ')) {
	    // 1. Set empty to false.
	    empty = false;

	    // 2. Parse token as a hash-with-options.
	    const parsedToken = parseHashWithOptions.exec(token);

	    // 3. If token does not parse, continue to the next token.
	    if (
	      parsedToken === null ||
	      parsedToken.groups === undefined ||
	      parsedToken.groups.algo === undefined
	    ) {
	      // Note: Chromium blocks the request at this point, but Firefox
	      // gives a warning that an invalid integrity was given. The
	      // correct behavior is to ignore these, and subsequently not
	      // check the integrity of the resource.
	      continue
	    }

	    // 4. Let algorithm be the hash-algo component of token.
	    const algorithm = parsedToken.groups.algo.toLowerCase();

	    // 5. If algorithm is a hash function recognized by the user
	    //    agent, add the parsed token to result.
	    if (supportedHashes.includes(algorithm)) {
	      result.push(parsedToken.groups);
	    }
	  }

	  // 4. Return no metadata if empty is true, otherwise return result.
	  if (empty === true) {
	    return 'no metadata'
	  }

	  return result
	}

	/**
	 * @param {{ algo: 'sha256' | 'sha384' | 'sha512' }[]} metadataList
	 */
	function getStrongestMetadata (metadataList) {
	  // Let algorithm be the algo component of the first item in metadataList.
	  // Can be sha256
	  let algorithm = metadataList[0].algo;
	  // If the algorithm is sha512, then it is the strongest
	  // and we can return immediately
	  if (algorithm[3] === '5') {
	    return algorithm
	  }

	  for (let i = 1; i < metadataList.length; ++i) {
	    const metadata = metadataList[i];
	    // If the algorithm is sha512, then it is the strongest
	    // and we can break the loop immediately
	    if (metadata.algo[3] === '5') {
	      algorithm = 'sha512';
	      break
	    // If the algorithm is sha384, then a potential sha256 or sha384 is ignored
	    } else if (algorithm[3] === '3') {
	      continue
	    // algorithm is sha256, check if algorithm is sha384 and if so, set it as
	    // the strongest
	    } else if (metadata.algo[3] === '3') {
	      algorithm = 'sha384';
	    }
	  }
	  return algorithm
	}

	function filterMetadataListByAlgorithm (metadataList, algorithm) {
	  if (metadataList.length === 1) {
	    return metadataList
	  }

	  let pos = 0;
	  for (let i = 0; i < metadataList.length; ++i) {
	    if (metadataList[i].algo === algorithm) {
	      metadataList[pos++] = metadataList[i];
	    }
	  }

	  metadataList.length = pos;

	  return metadataList
	}

	/**
	 * Compares two base64 strings, allowing for base64url
	 * in the second string.
	 *
	* @param {string} actualValue always base64
	 * @param {string} expectedValue base64 or base64url
	 * @returns {boolean}
	 */
	function compareBase64Mixed (actualValue, expectedValue) {
	  if (actualValue.length !== expectedValue.length) {
	    return false
	  }
	  for (let i = 0; i < actualValue.length; ++i) {
	    if (actualValue[i] !== expectedValue[i]) {
	      if (
	        (actualValue[i] === '+' && expectedValue[i] === '-') ||
	        (actualValue[i] === '/' && expectedValue[i] === '_')
	      ) {
	        continue
	      }
	      return false
	    }
	  }

	  return true
	}

	// https://w3c.github.io/webappsec-upgrade-insecure-requests/#upgrade-request
	function tryUpgradeRequestToAPotentiallyTrustworthyURL (request) {
	  // TODO
	}

	/**
	 * @link {https://html.spec.whatwg.org/multipage/origin.html#same-origin}
	 * @param {URL} A
	 * @param {URL} B
	 */
	function sameOrigin (A, B) {
	  // 1. If A and B are the same opaque origin, then return true.
	  if (A.origin === B.origin && A.origin === 'null') {
	    return true
	  }

	  // 2. If A and B are both tuple origins and their schemes,
	  //    hosts, and port are identical, then return true.
	  if (A.protocol === B.protocol && A.hostname === B.hostname && A.port === B.port) {
	    return true
	  }

	  // 3. Return false.
	  return false
	}

	function createDeferredPromise () {
	  let res;
	  let rej;
	  const promise = new Promise((resolve, reject) => {
	    res = resolve;
	    rej = reject;
	  });

	  return { promise, resolve: res, reject: rej }
	}

	function isAborted (fetchParams) {
	  return fetchParams.controller.state === 'aborted'
	}

	function isCancelled (fetchParams) {
	  return fetchParams.controller.state === 'aborted' ||
	    fetchParams.controller.state === 'terminated'
	}

	const normalizeMethodRecordBase = {
	  delete: 'DELETE',
	  DELETE: 'DELETE',
	  get: 'GET',
	  GET: 'GET',
	  head: 'HEAD',
	  HEAD: 'HEAD',
	  options: 'OPTIONS',
	  OPTIONS: 'OPTIONS',
	  post: 'POST',
	  POST: 'POST',
	  put: 'PUT',
	  PUT: 'PUT'
	};

	const normalizeMethodRecord = {
	  ...normalizeMethodRecordBase,
	  patch: 'patch',
	  PATCH: 'PATCH'
	};

	// Note: object prototypes should not be able to be referenced. e.g. `Object#hasOwnProperty`.
	Object.setPrototypeOf(normalizeMethodRecordBase, null);
	Object.setPrototypeOf(normalizeMethodRecord, null);

	/**
	 * @see https://fetch.spec.whatwg.org/#concept-method-normalize
	 * @param {string} method
	 */
	function normalizeMethod (method) {
	  return normalizeMethodRecordBase[method.toLowerCase()] ?? method
	}

	// https://infra.spec.whatwg.org/#serialize-a-javascript-value-to-a-json-string
	function serializeJavascriptValueToJSONString (value) {
	  // 1. Let result be ? Call(%JSON.stringify%, undefined, « value »).
	  const result = JSON.stringify(value);

	  // 2. If result is undefined, then throw a TypeError.
	  if (result === undefined) {
	    throw new TypeError('Value is not JSON serializable')
	  }

	  // 3. Assert: result is a string.
	  assert(typeof result === 'string');

	  // 4. Return result.
	  return result
	}

	// https://tc39.es/ecma262/#sec-%25iteratorprototype%25-object
	const esIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));

	/**
	 * @see https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
	 * @param {string} name name of the instance
	 * @param {symbol} kInternalIterator
	 * @param {string | number} [keyIndex]
	 * @param {string | number} [valueIndex]
	 */
	function createIterator (name, kInternalIterator, keyIndex = 0, valueIndex = 1) {
	  class FastIterableIterator {
	    /** @type {any} */
	    #target
	    /** @type {'key' | 'value' | 'key+value'} */
	    #kind
	    /** @type {number} */
	    #index

	    /**
	     * @see https://webidl.spec.whatwg.org/#dfn-default-iterator-object
	     * @param {unknown} target
	     * @param {'key' | 'value' | 'key+value'} kind
	     */
	    constructor (target, kind) {
	      this.#target = target;
	      this.#kind = kind;
	      this.#index = 0;
	    }

	    next () {
	      // 1. Let interface be the interface for which the iterator prototype object exists.
	      // 2. Let thisValue be the this value.
	      // 3. Let object be ? ToObject(thisValue).
	      // 4. If object is a platform object, then perform a security
	      //    check, passing:
	      // 5. If object is not a default iterator object for interface,
	      //    then throw a TypeError.
	      if (typeof this !== 'object' || this === null || !(#target in this)) {
	        throw new TypeError(
	          `'next' called on an object that does not implement interface ${name} Iterator.`
	        )
	      }

	      // 6. Let index be object’s index.
	      // 7. Let kind be object’s kind.
	      // 8. Let values be object’s target's value pairs to iterate over.
	      const index = this.#index;
	      const values = this.#target[kInternalIterator];

	      // 9. Let len be the length of values.
	      const len = values.length;

	      // 10. If index is greater than or equal to len, then return
	      //     CreateIterResultObject(undefined, true).
	      if (index >= len) {
	        return {
	          value: undefined,
	          done: true
	        }
	      }

	      // 11. Let pair be the entry in values at index index.
	      const { [keyIndex]: key, [valueIndex]: value } = values[index];

	      // 12. Set object’s index to index + 1.
	      this.#index = index + 1;

	      // 13. Return the iterator result for pair and kind.

	      // https://webidl.spec.whatwg.org/#iterator-result

	      // 1. Let result be a value determined by the value of kind:
	      let result;
	      switch (this.#kind) {
	        case 'key':
	          // 1. Let idlKey be pair’s key.
	          // 2. Let key be the result of converting idlKey to an
	          //    ECMAScript value.
	          // 3. result is key.
	          result = key;
	          break
	        case 'value':
	          // 1. Let idlValue be pair’s value.
	          // 2. Let value be the result of converting idlValue to
	          //    an ECMAScript value.
	          // 3. result is value.
	          result = value;
	          break
	        case 'key+value':
	          // 1. Let idlKey be pair’s key.
	          // 2. Let idlValue be pair’s value.
	          // 3. Let key be the result of converting idlKey to an
	          //    ECMAScript value.
	          // 4. Let value be the result of converting idlValue to
	          //    an ECMAScript value.
	          // 5. Let array be ! ArrayCreate(2).
	          // 6. Call ! CreateDataProperty(array, "0", key).
	          // 7. Call ! CreateDataProperty(array, "1", value).
	          // 8. result is array.
	          result = [key, value];
	          break
	      }

	      // 2. Return CreateIterResultObject(result, false).
	      return {
	        value: result,
	        done: false
	      }
	    }
	  }

	  // https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
	  // @ts-ignore
	  delete FastIterableIterator.prototype.constructor;

	  Object.setPrototypeOf(FastIterableIterator.prototype, esIteratorPrototype);

	  Object.defineProperties(FastIterableIterator.prototype, {
	    [Symbol.toStringTag]: {
	      writable: false,
	      enumerable: false,
	      configurable: true,
	      value: `${name} Iterator`
	    },
	    next: { writable: true, enumerable: true, configurable: true }
	  });

	  /**
	   * @param {unknown} target
	   * @param {'key' | 'value' | 'key+value'} kind
	   * @returns {IterableIterator<any>}
	   */
	  return function (target, kind) {
	    return new FastIterableIterator(target, kind)
	  }
	}

	/**
	 * @see https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
	 * @param {string} name name of the instance
	 * @param {any} object class
	 * @param {symbol} kInternalIterator
	 * @param {string | number} [keyIndex]
	 * @param {string | number} [valueIndex]
	 */
	function iteratorMixin (name, object, kInternalIterator, keyIndex = 0, valueIndex = 1) {
	  const makeIterator = createIterator(name, kInternalIterator, keyIndex, valueIndex);

	  const properties = {
	    keys: {
	      writable: true,
	      enumerable: true,
	      configurable: true,
	      value: function keys () {
	        webidl.brandCheck(this, object);
	        return makeIterator(this, 'key')
	      }
	    },
	    values: {
	      writable: true,
	      enumerable: true,
	      configurable: true,
	      value: function values () {
	        webidl.brandCheck(this, object);
	        return makeIterator(this, 'value')
	      }
	    },
	    entries: {
	      writable: true,
	      enumerable: true,
	      configurable: true,
	      value: function entries () {
	        webidl.brandCheck(this, object);
	        return makeIterator(this, 'key+value')
	      }
	    },
	    forEach: {
	      writable: true,
	      enumerable: true,
	      configurable: true,
	      value: function forEach (callbackfn, thisArg = globalThis) {
	        webidl.brandCheck(this, object);
	        webidl.argumentLengthCheck(arguments, 1, { header: `${name}.forEach` });
	        if (typeof callbackfn !== 'function') {
	          throw new TypeError(
	            `Failed to execute 'forEach' on '${name}': parameter 1 is not of type 'Function'.`
	          )
	        }
	        for (const { 0: key, 1: value } of makeIterator(this, 'key+value')) {
	          callbackfn.call(thisArg, value, key, this);
	        }
	      }
	    }
	  };

	  return Object.defineProperties(object.prototype, {
	    ...properties,
	    [Symbol.iterator]: {
	      writable: true,
	      enumerable: false,
	      configurable: true,
	      value: properties.entries.value
	    }
	  })
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#body-fully-read
	 */
	async function fullyReadBody (body, processBody, processBodyError) {
	  // 1. If taskDestination is null, then set taskDestination to
	  //    the result of starting a new parallel queue.

	  // 2. Let successSteps given a byte sequence bytes be to queue a
	  //    fetch task to run processBody given bytes, with taskDestination.
	  const successSteps = processBody;

	  // 3. Let errorSteps be to queue a fetch task to run processBodyError,
	  //    with taskDestination.
	  const errorSteps = processBodyError;

	  // 4. Let reader be the result of getting a reader for body’s stream.
	  //    If that threw an exception, then run errorSteps with that
	  //    exception and return.
	  let reader;

	  try {
	    reader = body.stream.getReader();
	  } catch (e) {
	    errorSteps(e);
	    return
	  }

	  // 5. Read all bytes from reader, given successSteps and errorSteps.
	  try {
	    const result = await readAllBytes(reader);
	    successSteps(result);
	  } catch (e) {
	    errorSteps(e);
	  }
	}

	function isReadableStreamLike (stream) {
	  return stream instanceof ReadableStream || (
	    stream[Symbol.toStringTag] === 'ReadableStream' &&
	    typeof stream.tee === 'function'
	  )
	}

	/**
	 * @param {ReadableStreamController<Uint8Array>} controller
	 */
	function readableStreamClose (controller) {
	  try {
	    controller.close();
	    controller.byobRequest?.respond(0);
	  } catch (err) {
	    // TODO: add comment explaining why this error occurs.
	    if (!err.message.includes('Controller is already closed') && !err.message.includes('ReadableStream is already closed')) {
	      throw err
	    }
	  }
	}

	/**
	 * @see https://infra.spec.whatwg.org/#isomorphic-encode
	 * @param {string} input
	 */
	function isomorphicEncode (input) {
	  // 1. Assert: input contains no code points greater than U+00FF.
	  for (let i = 0; i < input.length; i++) {
	    assert(input.charCodeAt(i) <= 0xFF);
	  }

	  // 2. Return a byte sequence whose length is equal to input’s code
	  //    point length and whose bytes have the same values as the
	  //    values of input’s code points, in the same order
	  return input
	}

	/**
	 * @see https://streams.spec.whatwg.org/#readablestreamdefaultreader-read-all-bytes
	 * @see https://streams.spec.whatwg.org/#read-loop
	 * @param {ReadableStreamDefaultReader} reader
	 */
	async function readAllBytes (reader) {
	  const bytes = [];
	  let byteLength = 0;

	  while (true) {
	    const { done, value: chunk } = await reader.read();

	    if (done) {
	      // 1. Call successSteps with bytes.
	      return Buffer.concat(bytes, byteLength)
	    }

	    // 1. If chunk is not a Uint8Array object, call failureSteps
	    //    with a TypeError and abort these steps.
	    if (!isUint8Array(chunk)) {
	      throw new TypeError('Received non-Uint8Array chunk')
	    }

	    // 2. Append the bytes represented by chunk to bytes.
	    bytes.push(chunk);
	    byteLength += chunk.length;

	    // 3. Read-loop given reader, bytes, successSteps, and failureSteps.
	  }
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#is-local
	 * @param {URL} url
	 */
	function urlIsLocal (url) {
	  assert('protocol' in url); // ensure it's a url object

	  const protocol = url.protocol;

	  return protocol === 'about:' || protocol === 'blob:' || protocol === 'data:'
	}

	/**
	 * @param {string|URL} url
	 */
	function urlHasHttpsScheme (url) {
	  if (typeof url === 'string') {
	    return url.startsWith('https:')
	  }

	  return url.protocol === 'https:'
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#http-scheme
	 * @param {URL} url
	 */
	function urlIsHttpHttpsScheme (url) {
	  assert('protocol' in url); // ensure it's a url object

	  const protocol = url.protocol;

	  return protocol === 'http:' || protocol === 'https:'
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#simple-range-header-value
	 * @param {string} value
	 * @param {boolean} allowWhitespace
	 */
	function simpleRangeHeaderValue (value, allowWhitespace) {
	  // 1. Let data be the isomorphic decoding of value.
	  // Note: isomorphic decoding takes a sequence of bytes (ie. a Uint8Array) and turns it into a string,
	  // nothing more. We obviously don't need to do that if value is a string already.
	  const data = value;

	  // 2. If data does not start with "bytes", then return failure.
	  if (!data.startsWith('bytes')) {
	    return 'failure'
	  }

	  // 3. Let position be a position variable for data, initially pointing at the 5th code point of data.
	  const position = { position: 5 };

	  // 4. If allowWhitespace is true, collect a sequence of code points that are HTTP tab or space,
	  //    from data given position.
	  if (allowWhitespace) {
	    collectASequenceOfCodePoints(
	      (char) => char === '\t' || char === ' ',
	      data,
	      position
	    );
	  }

	  // 5. If the code point at position within data is not U+003D (=), then return failure.
	  if (data.charCodeAt(position.position) !== 0x3D) {
	    return 'failure'
	  }

	  // 6. Advance position by 1.
	  position.position++;

	  // 7. If allowWhitespace is true, collect a sequence of code points that are HTTP tab or space, from
	  //    data given position.
	  if (allowWhitespace) {
	    collectASequenceOfCodePoints(
	      (char) => char === '\t' || char === ' ',
	      data,
	      position
	    );
	  }

	  // 8. Let rangeStart be the result of collecting a sequence of code points that are ASCII digits,
	  //    from data given position.
	  const rangeStart = collectASequenceOfCodePoints(
	    (char) => {
	      const code = char.charCodeAt(0);

	      return code >= 0x30 && code <= 0x39
	    },
	    data,
	    position
	  );

	  // 9. Let rangeStartValue be rangeStart, interpreted as decimal number, if rangeStart is not the
	  //    empty string; otherwise null.
	  const rangeStartValue = rangeStart.length ? Number(rangeStart) : null;

	  // 10. If allowWhitespace is true, collect a sequence of code points that are HTTP tab or space,
	  //     from data given position.
	  if (allowWhitespace) {
	    collectASequenceOfCodePoints(
	      (char) => char === '\t' || char === ' ',
	      data,
	      position
	    );
	  }

	  // 11. If the code point at position within data is not U+002D (-), then return failure.
	  if (data.charCodeAt(position.position) !== 0x2D) {
	    return 'failure'
	  }

	  // 12. Advance position by 1.
	  position.position++;

	  // 13. If allowWhitespace is true, collect a sequence of code points that are HTTP tab
	  //     or space, from data given position.
	  // Note from Khafra: its the same step as in #8 again lol
	  if (allowWhitespace) {
	    collectASequenceOfCodePoints(
	      (char) => char === '\t' || char === ' ',
	      data,
	      position
	    );
	  }

	  // 14. Let rangeEnd be the result of collecting a sequence of code points that are
	  //     ASCII digits, from data given position.
	  // Note from Khafra: you wouldn't guess it, but this is also the same step as #8
	  const rangeEnd = collectASequenceOfCodePoints(
	    (char) => {
	      const code = char.charCodeAt(0);

	      return code >= 0x30 && code <= 0x39
	    },
	    data,
	    position
	  );

	  // 15. Let rangeEndValue be rangeEnd, interpreted as decimal number, if rangeEnd
	  //     is not the empty string; otherwise null.
	  // Note from Khafra: THE SAME STEP, AGAIN!!!
	  // Note: why interpret as a decimal if we only collect ascii digits?
	  const rangeEndValue = rangeEnd.length ? Number(rangeEnd) : null;

	  // 16. If position is not past the end of data, then return failure.
	  if (position.position < data.length) {
	    return 'failure'
	  }

	  // 17. If rangeEndValue and rangeStartValue are null, then return failure.
	  if (rangeEndValue === null && rangeStartValue === null) {
	    return 'failure'
	  }

	  // 18. If rangeStartValue and rangeEndValue are numbers, and rangeStartValue is
	  //     greater than rangeEndValue, then return failure.
	  // Note: ... when can they not be numbers?
	  if (rangeStartValue > rangeEndValue) {
	    return 'failure'
	  }

	  // 19. Return (rangeStartValue, rangeEndValue).
	  return { rangeStartValue, rangeEndValue }
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#build-a-content-range
	 * @param {number} rangeStart
	 * @param {number} rangeEnd
	 * @param {number} fullLength
	 */
	function buildContentRange (rangeStart, rangeEnd, fullLength) {
	  // 1. Let contentRange be `bytes `.
	  let contentRange = 'bytes ';

	  // 2. Append rangeStart, serialized and isomorphic encoded, to contentRange.
	  contentRange += isomorphicEncode(`${rangeStart}`);

	  // 3. Append 0x2D (-) to contentRange.
	  contentRange += '-';

	  // 4. Append rangeEnd, serialized and isomorphic encoded to contentRange.
	  contentRange += isomorphicEncode(`${rangeEnd}`);

	  // 5. Append 0x2F (/) to contentRange.
	  contentRange += '/';

	  // 6. Append fullLength, serialized and isomorphic encoded to contentRange.
	  contentRange += isomorphicEncode(`${fullLength}`);

	  // 7. Return contentRange.
	  return contentRange
	}

	// A Stream, which pipes the response to zlib.createInflate() or
	// zlib.createInflateRaw() depending on the first byte of the Buffer.
	// If the lower byte of the first byte is 0x08, then the stream is
	// interpreted as a zlib stream, otherwise it's interpreted as a
	// raw deflate stream.
	class InflateStream extends Transform {
	  _transform (chunk, encoding, callback) {
	    if (!this._inflateStream) {
	      if (chunk.length === 0) {
	        callback();
	        return
	      }
	      this._inflateStream = (chunk[0] & 0x0F) === 0x08
	        ? zlib.createInflate()
	        : zlib.createInflateRaw();

	      this._inflateStream.on('data', this.push.bind(this));
	      this._inflateStream.on('end', () => this.push(null));
	      this._inflateStream.on('error', (err) => this.destroy(err));
	    }

	    this._inflateStream.write(chunk, encoding, callback);
	  }

	  _final (callback) {
	    if (this._inflateStream) {
	      this._inflateStream.end();
	      this._inflateStream = null;
	    }
	    callback();
	  }
	}

	function createInflate () {
	  return new InflateStream()
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#concept-header-extract-mime-type
	 * @param {import('./headers').HeadersList} headers
	 */
	function extractMimeType (headers) {
	  // 1. Let charset be null.
	  let charset = null;

	  // 2. Let essence be null.
	  let essence = null;

	  // 3. Let mimeType be null.
	  let mimeType = null;

	  // 4. Let values be the result of getting, decoding, and splitting `Content-Type` from headers.
	  const values = getDecodeSplit('content-type', headers);

	  // 5. If values is null, then return failure.
	  if (values === null) {
	    return 'failure'
	  }

	  // 6. For each value of values:
	  for (const value of values) {
	    // 6.1. Let temporaryMimeType be the result of parsing value.
	    const temporaryMimeType = parseMIMEType(value);

	    // 6.2. If temporaryMimeType is failure or its essence is "*/*", then continue.
	    if (temporaryMimeType === 'failure' || temporaryMimeType.essence === '*/*') {
	      continue
	    }

	    // 6.3. Set mimeType to temporaryMimeType.
	    mimeType = temporaryMimeType;

	    // 6.4. If mimeType’s essence is not essence, then:
	    if (mimeType.essence !== essence) {
	      // 6.4.1. Set charset to null.
	      charset = null;

	      // 6.4.2. If mimeType’s parameters["charset"] exists, then set charset to
	      //        mimeType’s parameters["charset"].
	      if (mimeType.parameters.has('charset')) {
	        charset = mimeType.parameters.get('charset');
	      }

	      // 6.4.3. Set essence to mimeType’s essence.
	      essence = mimeType.essence;
	    } else if (!mimeType.parameters.has('charset') && charset !== null) {
	      // 6.5. Otherwise, if mimeType’s parameters["charset"] does not exist, and
	      //      charset is non-null, set mimeType’s parameters["charset"] to charset.
	      mimeType.parameters.set('charset', charset);
	    }
	  }

	  // 7. If mimeType is null, then return failure.
	  if (mimeType == null) {
	    return 'failure'
	  }

	  // 8. Return mimeType.
	  return mimeType
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#header-value-get-decode-and-split
	 * @param {string|null} value
	 */
	function gettingDecodingSplitting (value) {
	  // 1. Let input be the result of isomorphic decoding value.
	  const input = value;

	  // 2. Let position be a position variable for input, initially pointing at the start of input.
	  const position = { position: 0 };

	  // 3. Let values be a list of strings, initially empty.
	  const values = [];

	  // 4. Let temporaryValue be the empty string.
	  let temporaryValue = '';

	  // 5. While position is not past the end of input:
	  while (position.position < input.length) {
	    // 5.1. Append the result of collecting a sequence of code points that are not U+0022 (")
	    //      or U+002C (,) from input, given position, to temporaryValue.
	    temporaryValue += collectASequenceOfCodePoints(
	      (char) => char !== '"' && char !== ',',
	      input,
	      position
	    );

	    // 5.2. If position is not past the end of input, then:
	    if (position.position < input.length) {
	      // 5.2.1. If the code point at position within input is U+0022 ("), then:
	      if (input.charCodeAt(position.position) === 0x22) {
	        // 5.2.1.1. Append the result of collecting an HTTP quoted string from input, given position, to temporaryValue.
	        temporaryValue += collectAnHTTPQuotedString(
	          input,
	          position
	        );

	        // 5.2.1.2. If position is not past the end of input, then continue.
	        if (position.position < input.length) {
	          continue
	        }
	      } else {
	        // 5.2.2. Otherwise:

	        // 5.2.2.1. Assert: the code point at position within input is U+002C (,).
	        assert(input.charCodeAt(position.position) === 0x2C);

	        // 5.2.2.2. Advance position by 1.
	        position.position++;
	      }
	    }

	    // 5.3. Remove all HTTP tab or space from the start and end of temporaryValue.
	    temporaryValue = removeChars(temporaryValue, true, true, (char) => char === 0x9 || char === 0x20);

	    // 5.4. Append temporaryValue to values.
	    values.push(temporaryValue);

	    // 5.6. Set temporaryValue to the empty string.
	    temporaryValue = '';
	  }

	  // 6. Return values.
	  return values
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#concept-header-list-get-decode-split
	 * @param {string} name lowercase header name
	 * @param {import('./headers').HeadersList} list
	 */
	function getDecodeSplit (name, list) {
	  // 1. Let value be the result of getting name from list.
	  const value = list.get(name, true);

	  // 2. If value is null, then return null.
	  if (value === null) {
	    return null
	  }

	  // 3. Return the result of getting, decoding, and splitting value.
	  return gettingDecodingSplitting(value)
	}

	const textDecoder = new TextDecoder();

	/**
	 * @see https://encoding.spec.whatwg.org/#utf-8-decode
	 * @param {Buffer} buffer
	 */
	function utf8DecodeBytes (buffer) {
	  if (buffer.length === 0) {
	    return ''
	  }

	  // 1. Let buffer be the result of peeking three bytes from
	  //    ioQueue, converted to a byte sequence.

	  // 2. If buffer is 0xEF 0xBB 0xBF, then read three
	  //    bytes from ioQueue. (Do nothing with those bytes.)
	  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
	    buffer = buffer.subarray(3);
	  }

	  // 3. Process a queue with an instance of UTF-8’s
	  //    decoder, ioQueue, output, and "replacement".
	  const output = textDecoder.decode(buffer);

	  // 4. Return output.
	  return output
	}

	util$j = {
	  isAborted,
	  isCancelled,
	  createDeferredPromise,
	  ReadableStreamFrom,
	  tryUpgradeRequestToAPotentiallyTrustworthyURL,
	  clampAndCoarsenConnectionTimingInfo,
	  coarsenedSharedCurrentTime,
	  determineRequestsReferrer,
	  makePolicyContainer,
	  clonePolicyContainer,
	  appendFetchMetadata,
	  appendRequestOriginHeader,
	  TAOCheck,
	  corsCheck,
	  crossOriginResourcePolicyCheck,
	  createOpaqueTimingInfo,
	  setRequestReferrerPolicyOnRedirect,
	  isValidHTTPToken,
	  requestBadPort,
	  requestCurrentURL,
	  responseURL,
	  responseLocationURL,
	  isBlobLike,
	  isURLPotentiallyTrustworthy,
	  isValidReasonPhrase,
	  sameOrigin,
	  normalizeMethod,
	  serializeJavascriptValueToJSONString,
	  iteratorMixin,
	  createIterator,
	  isValidHeaderName,
	  isValidHeaderValue,
	  isErrorLike,
	  fullyReadBody,
	  bytesMatch,
	  isReadableStreamLike,
	  readableStreamClose,
	  isomorphicEncode,
	  urlIsLocal,
	  urlHasHttpsScheme,
	  urlIsHttpHttpsScheme,
	  readAllBytes,
	  normalizeMethodRecord,
	  simpleRangeHeaderValue,
	  buildContentRange,
	  parseMetadata,
	  createInflate,
	  extractMimeType,
	  getDecodeSplit,
	  utf8DecodeBytes
	};
	return util$j;
}

var symbols$3;
var hasRequiredSymbols$3;

function requireSymbols$3 () {
	if (hasRequiredSymbols$3) return symbols$3;
	hasRequiredSymbols$3 = 1;

	symbols$3 = {
	  kUrl: Symbol('url'),
	  kHeaders: Symbol('headers'),
	  kSignal: Symbol('signal'),
	  kState: Symbol('state'),
	  kGuard: Symbol('guard'),
	  kRealm: Symbol('realm'),
	  kDispatcher: Symbol('dispatcher')
	};
	return symbols$3;
}

var file;
var hasRequiredFile;

function requireFile () {
	if (hasRequiredFile) return file;
	hasRequiredFile = 1;

	const { EOL } = require$$0$5;
	const { Blob, File: NativeFile } = require$$6;
	const { types } = require$$0$2;
	const { kState } = requireSymbols$3();
	const { isBlobLike } = requireUtil$5();
	const { webidl } = requireWebidl();
	const { parseMIMEType, serializeAMimeType } = requireDataUrl();
	const { kEnumerableProperty } = util$m;

	const encoder = new TextEncoder();

	class File extends Blob {
	  constructor (fileBits, fileName, options = {}) {
	    // The File constructor is invoked with two or three parameters, depending
	    // on whether the optional dictionary parameter is used. When the File()
	    // constructor is invoked, user agents must run the following steps:
	    webidl.argumentLengthCheck(arguments, 2, { header: 'File constructor' });

	    fileBits = webidl.converters['sequence<BlobPart>'](fileBits);
	    fileName = webidl.converters.USVString(fileName);
	    options = webidl.converters.FilePropertyBag(options);

	    // 1. Let bytes be the result of processing blob parts given fileBits and
	    // options.
	    // Note: Blob handles this for us

	    // 2. Let n be the fileName argument to the constructor.
	    const n = fileName;

	    // 3. Process FilePropertyBag dictionary argument by running the following
	    // substeps:

	    //    1. If the type member is provided and is not the empty string, let t
	    //    be set to the type dictionary member. If t contains any characters
	    //    outside the range U+0020 to U+007E, then set t to the empty string
	    //    and return from these substeps.
	    //    2. Convert every character in t to ASCII lowercase.
	    let t = options.type;
	    let d;

	    // eslint-disable-next-line no-labels
	    substep: {
	      if (t) {
	        t = parseMIMEType(t);

	        if (t === 'failure') {
	          t = '';
	          // eslint-disable-next-line no-labels
	          break substep
	        }

	        t = serializeAMimeType(t).toLowerCase();
	      }

	      //    3. If the lastModified member is provided, let d be set to the
	      //    lastModified dictionary member. If it is not provided, set d to the
	      //    current date and time represented as the number of milliseconds since
	      //    the Unix Epoch (which is the equivalent of Date.now() [ECMA-262]).
	      d = options.lastModified;
	    }

	    // 4. Return a new File object F such that:
	    // F refers to the bytes byte sequence.
	    // F.size is set to the number of total bytes in bytes.
	    // F.name is set to n.
	    // F.type is set to t.
	    // F.lastModified is set to d.

	    super(processBlobParts(fileBits, options), { type: t });
	    this[kState] = {
	      name: n,
	      lastModified: d,
	      type: t
	    };
	  }

	  get name () {
	    webidl.brandCheck(this, File);

	    return this[kState].name
	  }

	  get lastModified () {
	    webidl.brandCheck(this, File);

	    return this[kState].lastModified
	  }

	  get type () {
	    webidl.brandCheck(this, File);

	    return this[kState].type
	  }
	}

	class FileLike {
	  constructor (blobLike, fileName, options = {}) {
	    // TODO: argument idl type check

	    // The File constructor is invoked with two or three parameters, depending
	    // on whether the optional dictionary parameter is used. When the File()
	    // constructor is invoked, user agents must run the following steps:

	    // 1. Let bytes be the result of processing blob parts given fileBits and
	    // options.

	    // 2. Let n be the fileName argument to the constructor.
	    const n = fileName;

	    // 3. Process FilePropertyBag dictionary argument by running the following
	    // substeps:

	    //    1. If the type member is provided and is not the empty string, let t
	    //    be set to the type dictionary member. If t contains any characters
	    //    outside the range U+0020 to U+007E, then set t to the empty string
	    //    and return from these substeps.
	    //    TODO
	    const t = options.type;

	    //    2. Convert every character in t to ASCII lowercase.
	    //    TODO

	    //    3. If the lastModified member is provided, let d be set to the
	    //    lastModified dictionary member. If it is not provided, set d to the
	    //    current date and time represented as the number of milliseconds since
	    //    the Unix Epoch (which is the equivalent of Date.now() [ECMA-262]).
	    const d = options.lastModified ?? Date.now();

	    // 4. Return a new File object F such that:
	    // F refers to the bytes byte sequence.
	    // F.size is set to the number of total bytes in bytes.
	    // F.name is set to n.
	    // F.type is set to t.
	    // F.lastModified is set to d.

	    this[kState] = {
	      blobLike,
	      name: n,
	      type: t,
	      lastModified: d
	    };
	  }

	  stream (...args) {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].blobLike.stream(...args)
	  }

	  arrayBuffer (...args) {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].blobLike.arrayBuffer(...args)
	  }

	  slice (...args) {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].blobLike.slice(...args)
	  }

	  text (...args) {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].blobLike.text(...args)
	  }

	  get size () {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].blobLike.size
	  }

	  get type () {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].blobLike.type
	  }

	  get name () {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].name
	  }

	  get lastModified () {
	    webidl.brandCheck(this, FileLike);

	    return this[kState].lastModified
	  }

	  get [Symbol.toStringTag] () {
	    return 'File'
	  }
	}

	Object.defineProperties(File.prototype, {
	  [Symbol.toStringTag]: {
	    value: 'File',
	    configurable: true
	  },
	  name: kEnumerableProperty,
	  lastModified: kEnumerableProperty
	});

	webidl.converters.Blob = webidl.interfaceConverter(Blob);

	webidl.converters.BlobPart = function (V, opts) {
	  if (webidl.util.Type(V) === 'Object') {
	    if (isBlobLike(V)) {
	      return webidl.converters.Blob(V, { strict: false })
	    }

	    if (ArrayBuffer.isView(V) || types.isAnyArrayBuffer(V)) {
	      return webidl.converters.BufferSource(V, opts)
	    }
	  }

	  return webidl.converters.USVString(V, opts)
	};

	webidl.converters['sequence<BlobPart>'] = webidl.sequenceConverter(
	  webidl.converters.BlobPart
	);

	// https://www.w3.org/TR/FileAPI/#dfn-FilePropertyBag
	webidl.converters.FilePropertyBag = webidl.dictionaryConverter([
	  {
	    key: 'lastModified',
	    converter: webidl.converters['long long'],
	    get defaultValue () {
	      return Date.now()
	    }
	  },
	  {
	    key: 'type',
	    converter: webidl.converters.DOMString,
	    defaultValue: ''
	  },
	  {
	    key: 'endings',
	    converter: (value) => {
	      value = webidl.converters.DOMString(value);
	      value = value.toLowerCase();

	      if (value !== 'native') {
	        value = 'transparent';
	      }

	      return value
	    },
	    defaultValue: 'transparent'
	  }
	]);

	/**
	 * @see https://www.w3.org/TR/FileAPI/#process-blob-parts
	 * @param {(NodeJS.TypedArray|Blob|string)[]} parts
	 * @param {{ type: string, endings: string }} options
	 */
	function processBlobParts (parts, options) {
	  // 1. Let bytes be an empty sequence of bytes.
	  /** @type {NodeJS.TypedArray[]} */
	  const bytes = [];

	  // 2. For each element in parts:
	  for (const element of parts) {
	    // 1. If element is a USVString, run the following substeps:
	    if (typeof element === 'string') {
	      // 1. Let s be element.
	      let s = element;

	      // 2. If the endings member of options is "native", set s
	      //    to the result of converting line endings to native
	      //    of element.
	      if (options.endings === 'native') {
	        s = convertLineEndingsNative(s);
	      }

	      // 3. Append the result of UTF-8 encoding s to bytes.
	      bytes.push(encoder.encode(s));
	    } else if (ArrayBuffer.isView(element) || types.isArrayBuffer(element)) {
	      // 2. If element is a BufferSource, get a copy of the
	      //    bytes held by the buffer source, and append those
	      //    bytes to bytes.
	      if (element.buffer) {
	        bytes.push(
	          new Uint8Array(element.buffer, element.byteOffset, element.byteLength)
	        );
	      } else { // ArrayBuffer
	        bytes.push(new Uint8Array(element));
	      }
	    } else if (isBlobLike(element)) {
	      // 3. If element is a Blob, append the bytes it represents
	      //    to bytes.
	      bytes.push(element);
	    }
	  }

	  // 3. Return bytes.
	  return bytes
	}

	/**
	 * @see https://www.w3.org/TR/FileAPI/#convert-line-endings-to-native
	 * @param {string} s
	 */
	function convertLineEndingsNative (s) {
	  // 1. Let native line ending be be the code point U+000A LF.
	  // 2. If the underlying platform’s conventions are to
	  //    represent newlines as a carriage return and line feed
	  //    sequence, set native line ending to the code point
	  //    U+000D CR followed by the code point U+000A LF.
	  // NOTE: We are using the native line ending for the current
	  // platform, provided by node's os module.

	  return s.replace(/\r?\n/g, EOL)
	}

	// If this function is moved to ./util.js, some tools (such as
	// rollup) will warn about circular dependencies. See:
	// https://github.com/nodejs/undici/issues/1629
	function isFileLike (object) {
	  return (
	    (NativeFile && object instanceof NativeFile) ||
	    object instanceof File || (
	      object &&
	      (typeof object.stream === 'function' ||
	      typeof object.arrayBuffer === 'function') &&
	      object[Symbol.toStringTag] === 'File'
	    )
	  )
	}

	file = { File, FileLike, isFileLike };
	return file;
}

var formdata;
var hasRequiredFormdata;

function requireFormdata () {
	if (hasRequiredFormdata) return formdata;
	hasRequiredFormdata = 1;

	const { isBlobLike, iteratorMixin } = requireUtil$5();
	const { kState } = requireSymbols$3();
	const { kEnumerableProperty } = util$m;
	const { File: UndiciFile, FileLike, isFileLike } = requireFile();
	const { webidl } = requireWebidl();
	const { File: NativeFile } = require$$6;
	const nodeUtil = require$$0$2;

	/** @type {globalThis['File']} */
	const File = NativeFile ?? UndiciFile;

	// https://xhr.spec.whatwg.org/#formdata
	class FormData {
	  constructor (form) {
	    if (form !== undefined) {
	      throw webidl.errors.conversionFailed({
	        prefix: 'FormData constructor',
	        argument: 'Argument 1',
	        types: ['undefined']
	      })
	    }

	    this[kState] = [];
	  }

	  append (name, value, filename = undefined) {
	    webidl.brandCheck(this, FormData);

	    webidl.argumentLengthCheck(arguments, 2, { header: 'FormData.append' });

	    if (arguments.length === 3 && !isBlobLike(value)) {
	      throw new TypeError(
	        "Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'"
	      )
	    }

	    // 1. Let value be value if given; otherwise blobValue.

	    name = webidl.converters.USVString(name);
	    value = isBlobLike(value)
	      ? webidl.converters.Blob(value, { strict: false })
	      : webidl.converters.USVString(value);
	    filename = arguments.length === 3
	      ? webidl.converters.USVString(filename)
	      : undefined;

	    // 2. Let entry be the result of creating an entry with
	    // name, value, and filename if given.
	    const entry = makeEntry(name, value, filename);

	    // 3. Append entry to this’s entry list.
	    this[kState].push(entry);
	  }

	  delete (name) {
	    webidl.brandCheck(this, FormData);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FormData.delete' });

	    name = webidl.converters.USVString(name);

	    // The delete(name) method steps are to remove all entries whose name
	    // is name from this’s entry list.
	    this[kState] = this[kState].filter(entry => entry.name !== name);
	  }

	  get (name) {
	    webidl.brandCheck(this, FormData);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FormData.get' });

	    name = webidl.converters.USVString(name);

	    // 1. If there is no entry whose name is name in this’s entry list,
	    // then return null.
	    const idx = this[kState].findIndex((entry) => entry.name === name);
	    if (idx === -1) {
	      return null
	    }

	    // 2. Return the value of the first entry whose name is name from
	    // this’s entry list.
	    return this[kState][idx].value
	  }

	  getAll (name) {
	    webidl.brandCheck(this, FormData);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FormData.getAll' });

	    name = webidl.converters.USVString(name);

	    // 1. If there is no entry whose name is name in this’s entry list,
	    // then return the empty list.
	    // 2. Return the values of all entries whose name is name, in order,
	    // from this’s entry list.
	    return this[kState]
	      .filter((entry) => entry.name === name)
	      .map((entry) => entry.value)
	  }

	  has (name) {
	    webidl.brandCheck(this, FormData);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FormData.has' });

	    name = webidl.converters.USVString(name);

	    // The has(name) method steps are to return true if there is an entry
	    // whose name is name in this’s entry list; otherwise false.
	    return this[kState].findIndex((entry) => entry.name === name) !== -1
	  }

	  set (name, value, filename = undefined) {
	    webidl.brandCheck(this, FormData);

	    webidl.argumentLengthCheck(arguments, 2, { header: 'FormData.set' });

	    if (arguments.length === 3 && !isBlobLike(value)) {
	      throw new TypeError(
	        "Failed to execute 'set' on 'FormData': parameter 2 is not of type 'Blob'"
	      )
	    }

	    // The set(name, value) and set(name, blobValue, filename) method steps
	    // are:

	    // 1. Let value be value if given; otherwise blobValue.

	    name = webidl.converters.USVString(name);
	    value = isBlobLike(value)
	      ? webidl.converters.Blob(value, { strict: false })
	      : webidl.converters.USVString(value);
	    filename = arguments.length === 3
	      ? webidl.converters.USVString(filename)
	      : undefined;

	    // 2. Let entry be the result of creating an entry with name, value, and
	    // filename if given.
	    const entry = makeEntry(name, value, filename);

	    // 3. If there are entries in this’s entry list whose name is name, then
	    // replace the first such entry with entry and remove the others.
	    const idx = this[kState].findIndex((entry) => entry.name === name);
	    if (idx !== -1) {
	      this[kState] = [
	        ...this[kState].slice(0, idx),
	        entry,
	        ...this[kState].slice(idx + 1).filter((entry) => entry.name !== name)
	      ];
	    } else {
	      // 4. Otherwise, append entry to this’s entry list.
	      this[kState].push(entry);
	    }
	  }

	  [nodeUtil.inspect.custom] (depth, options) {
	    const state = this[kState].reduce((a, b) => {
	      if (a[b.name]) {
	        if (Array.isArray(a[b.name])) {
	          a[b.name].push(b.value);
	        } else {
	          a[b.name] = [a[b.name], b.value];
	        }
	      } else {
	        a[b.name] = b.value;
	      }

	      return a
	    }, { __proto__: null });

	    options.depth ??= depth;
	    options.colors ??= true;

	    const output = nodeUtil.formatWithOptions(options, state);

	    // remove [Object null prototype]
	    return `FormData ${output.slice(output.indexOf(']') + 2)}`
	  }
	}

	iteratorMixin('FormData', FormData, kState, 'name', 'value');

	Object.defineProperties(FormData.prototype, {
	  append: kEnumerableProperty,
	  delete: kEnumerableProperty,
	  get: kEnumerableProperty,
	  getAll: kEnumerableProperty,
	  has: kEnumerableProperty,
	  set: kEnumerableProperty,
	  [Symbol.toStringTag]: {
	    value: 'FormData',
	    configurable: true
	  }
	});

	/**
	 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#create-an-entry
	 * @param {string} name
	 * @param {string|Blob} value
	 * @param {?string} filename
	 * @returns
	 */
	function makeEntry (name, value, filename) {
	  // 1. Set name to the result of converting name into a scalar value string.
	  // Note: This operation was done by the webidl converter USVString.

	  // 2. If value is a string, then set value to the result of converting
	  //    value into a scalar value string.
	  if (typeof value === 'string') ; else {
	    // 3. Otherwise:

	    // 1. If value is not a File object, then set value to a new File object,
	    //    representing the same bytes, whose name attribute value is "blob"
	    if (!isFileLike(value)) {
	      value = value instanceof Blob
	        ? new File([value], 'blob', { type: value.type })
	        : new FileLike(value, 'blob', { type: value.type });
	    }

	    // 2. If filename is given, then set value to a new File object,
	    //    representing the same bytes, whose name attribute is filename.
	    if (filename !== undefined) {
	      /** @type {FilePropertyBag} */
	      const options = {
	        type: value.type,
	        lastModified: value.lastModified
	      };

	      value = (NativeFile && value instanceof NativeFile) || value instanceof UndiciFile
	        ? new File([value], filename, options)
	        : new FileLike(value, filename, options);
	    }
	  }

	  // 4. Return an entry whose name is name and whose value is value.
	  return { name, value }
	}

	formdata = { FormData, makeEntry };
	return formdata;
}

var formdataParser;
var hasRequiredFormdataParser;

function requireFormdataParser () {
	if (hasRequiredFormdataParser) return formdataParser;
	hasRequiredFormdataParser = 1;

	const { toUSVString, isUSVString, bufferToLowerCasedHeaderName } = util$m;
	const { utf8DecodeBytes } = requireUtil$5();
	const { HTTP_TOKEN_CODEPOINTS, isomorphicDecode } = requireDataUrl();
	const { isFileLike, File: UndiciFile } = requireFile();
	const { makeEntry } = requireFormdata();
	const assert = require$$0;
	const { File: NodeFile } = require$$6;

	const File = globalThis.File ?? NodeFile ?? UndiciFile;

	const formDataNameBuffer = Buffer.from('form-data; name="');
	const filenameBuffer = Buffer.from('; filename');
	const dd = Buffer.from('--');
	const ddcrlf = Buffer.from('--\r\n');

	/**
	 * @param {string} chars
	 */
	function isAsciiString (chars) {
	  for (let i = 0; i < chars.length; ++i) {
	    if ((chars.charCodeAt(i) & ~0x7F) !== 0) {
	      return false
	    }
	  }
	  return true
	}

	/**
	 * @see https://andreubotella.github.io/multipart-form-data/#multipart-form-data-boundary
	 * @param {string} boundary
	 */
	function validateBoundary (boundary) {
	  const length = boundary.length;

	  // - its length is greater or equal to 27 and lesser or equal to 70, and
	  if (length < 27 || length > 70) {
	    return false
	  }

	  // - it is composed by bytes in the ranges 0x30 to 0x39, 0x41 to 0x5A, or
	  //   0x61 to 0x7A, inclusive (ASCII alphanumeric), or which are 0x27 ('),
	  //   0x2D (-) or 0x5F (_).
	  for (let i = 0; i < length; ++i) {
	    const cp = boundary.charCodeAt(i);

	    if (!(
	      (cp >= 0x30 && cp <= 0x39) ||
	      (cp >= 0x41 && cp <= 0x5a) ||
	      (cp >= 0x61 && cp <= 0x7a) ||
	      cp === 0x27 ||
	      cp === 0x2d ||
	      cp === 0x5f
	    )) {
	      return false
	    }
	  }

	  return true
	}

	/**
	 * @see https://andreubotella.github.io/multipart-form-data/#escape-a-multipart-form-data-name
	 * @param {string} name
	 * @param {string} [encoding='utf-8']
	 * @param {boolean} [isFilename=false]
	 */
	function escapeFormDataName (name, encoding = 'utf-8', isFilename = false) {
	  // 1. If isFilename is true:
	  if (isFilename) {
	    // 1.1. Set name to the result of converting name into a scalar value string.
	    name = toUSVString(name);
	  } else {
	    // 2. Otherwise:

	    // 2.1. Assert: name is a scalar value string.
	    assert(isUSVString(name));

	    // 2.2. Replace every occurrence of U+000D (CR) not followed by U+000A (LF),
	    //      and every occurrence of U+000A (LF) not preceded by U+000D (CR), in
	    //      name, by a string consisting of U+000D (CR) and U+000A (LF).
	    name = name.replace(/\r\n?|\r?\n/g, '\r\n');
	  }

	  // 3. Let encoded be the result of encoding name with encoding.
	  assert(Buffer.isEncoding(encoding));

	  // 4. Replace every 0x0A (LF) bytes in encoded with the byte sequence `%0A`,
	  //    0x0D (CR) with `%0D` and 0x22 (") with `%22`.
	  name = name
	    .replace(/\n/g, '%0A')
	    .replace(/\r/g, '%0D')
	    .replace(/"/g, '%22');

	  // 5. Return encoded.
	  return Buffer.from(name, encoding) // encoded
	}

	/**
	 * @see https://andreubotella.github.io/multipart-form-data/#multipart-form-data-parser
	 * @param {Buffer} input
	 * @param {ReturnType<import('./data-url')['parseMIMEType']>} mimeType
	 */
	function multipartFormDataParser (input, mimeType) {
	  // 1. Assert: mimeType’s essence is "multipart/form-data".
	  assert(mimeType !== 'failure' && mimeType.essence === 'multipart/form-data');

	  const boundaryString = mimeType.parameters.get('boundary');

	  // 2. If mimeType’s parameters["boundary"] does not exist, return failure.
	  //    Otherwise, let boundary be the result of UTF-8 decoding mimeType’s
	  //    parameters["boundary"].
	  if (boundaryString === undefined) {
	    return 'failure'
	  }

	  const boundary = Buffer.from(`--${boundaryString}`, 'utf8');

	  // 3. Let entry list be an empty entry list.
	  const entryList = [];

	  // 4. Let position be a pointer to a byte in input, initially pointing at
	  //    the first byte.
	  const position = { position: 0 };

	  // Note: undici addition, allow \r\n before the body.
	  if (input[0] === 0x0d && input[1] === 0x0a) {
	    position.position += 2;
	  }

	  // 5. While true:
	  while (true) {
	    // 5.1. If position points to a sequence of bytes starting with 0x2D 0x2D
	    //      (`--`) followed by boundary, advance position by 2 + the length of
	    //      boundary. Otherwise, return failure.
	    // Note: boundary is padded with 2 dashes already, no need to add 2.
	    if (input.subarray(position.position, position.position + boundary.length).equals(boundary)) {
	      position.position += boundary.length;
	    } else {
	      return 'failure'
	    }

	    // 5.2. If position points to the sequence of bytes 0x2D 0x2D 0x0D 0x0A
	    //      (`--` followed by CR LF) followed by the end of input, return entry list.
	    // Note: a body does NOT need to end with CRLF. It can end with --.
	    if (
	      (position.position === input.length - 2 && bufferStartsWith(input, dd, position)) ||
	      (position.position === input.length - 4 && bufferStartsWith(input, ddcrlf, position))
	    ) {
	      return entryList
	    }

	    // 5.3. If position does not point to a sequence of bytes starting with 0x0D
	    //      0x0A (CR LF), return failure.
	    if (input[position.position] !== 0x0d || input[position.position + 1] !== 0x0a) {
	      return 'failure'
	    }

	    // 5.4. Advance position by 2. (This skips past the newline.)
	    position.position += 2;

	    // 5.5. Let name, filename and contentType be the result of parsing
	    //      multipart/form-data headers on input and position, if the result
	    //      is not failure. Otherwise, return failure.
	    const result = parseMultipartFormDataHeaders(input, position);

	    if (result === 'failure') {
	      return 'failure'
	    }

	    let { name, filename, contentType, encoding } = result;

	    // 5.6. Advance position by 2. (This skips past the empty line that marks
	    //      the end of the headers.)
	    position.position += 2;

	    // 5.7. Let body be the empty byte sequence.
	    let body;

	    // 5.8. Body loop: While position is not past the end of input:
	    // TODO: the steps here are completely wrong
	    {
	      const boundaryIndex = input.indexOf(boundary.subarray(2), position.position);

	      if (boundaryIndex === -1) {
	        return 'failure'
	      }

	      body = input.subarray(position.position, boundaryIndex - 4);

	      position.position += body.length;

	      // Note: position must be advanced by the body's length before being
	      // decoded, otherwise the parsing will fail.
	      if (encoding === 'base64') {
	        body = Buffer.from(body.toString(), 'base64');
	      }
	    }

	    // 5.9. If position does not point to a sequence of bytes starting with
	    //      0x0D 0x0A (CR LF), return failure. Otherwise, advance position by 2.
	    if (input[position.position] !== 0x0d || input[position.position + 1] !== 0x0a) {
	      return 'failure'
	    } else {
	      position.position += 2;
	    }

	    // 5.10. If filename is not null:
	    let value;

	    if (filename !== null) {
	      // 5.10.1. If contentType is null, set contentType to "text/plain".
	      contentType ??= 'text/plain';

	      // 5.10.2. If contentType is not an ASCII string, set contentType to the empty string.

	      // Note: `buffer.isAscii` can be used at zero-cost, but converting a string to a buffer is a high overhead.
	      // Content-Type is a relatively small string, so it is faster to use `String#charCodeAt`.
	      if (!isAsciiString(contentType)) {
	        contentType = '';
	      }

	      // 5.10.3. Let value be a new File object with name filename, type contentType, and body body.
	      value = new File([body], filename, { type: contentType });
	    } else {
	      // 5.11. Otherwise:

	      // 5.11.1. Let value be the UTF-8 decoding without BOM of body.
	      value = utf8DecodeBytes(Buffer.from(body));
	    }

	    // 5.12. Assert: name is a scalar value string and value is either a scalar value string or a File object.
	    assert(isUSVString(name));
	    assert((typeof value === 'string' && isUSVString(value)) || isFileLike(value));

	    // 5.13. Create an entry with name and value, and append it to entry list.
	    entryList.push(makeEntry(name, value, filename));
	  }
	}

	/**
	 * @see https://andreubotella.github.io/multipart-form-data/#parse-multipart-form-data-headers
	 * @param {Buffer} input
	 * @param {{ position: number }} position
	 */
	function parseMultipartFormDataHeaders (input, position) {
	  // 1. Let name, filename and contentType be null.
	  let name = null;
	  let filename = null;
	  let contentType = null;
	  let encoding = null;

	  // 2. While true:
	  while (true) {
	    // 2.1. If position points to a sequence of bytes starting with 0x0D 0x0A (CR LF):
	    if (input[position.position] === 0x0d && input[position.position + 1] === 0x0a) {
	      // 2.1.1. If name is null, return failure.
	      if (name === null) {
	        return 'failure'
	      }

	      // 2.1.2. Return name, filename and contentType.
	      return { name, filename, contentType, encoding }
	    }

	    // 2.2. Let header name be the result of collecting a sequence of bytes that are
	    //      not 0x0A (LF), 0x0D (CR) or 0x3A (:), given position.
	    let headerName = collectASequenceOfBytes(
	      (char) => char !== 0x0a && char !== 0x0d && char !== 0x3a,
	      input,
	      position
	    );

	    // 2.3. Remove any HTTP tab or space bytes from the start or end of header name.
	    headerName = removeChars(headerName, true, true, (char) => char === 0x9 || char === 0x20);

	    // 2.4. If header name does not match the field-name token production, return failure.
	    if (!HTTP_TOKEN_CODEPOINTS.test(headerName.toString())) {
	      return 'failure'
	    }

	    // 2.5. If the byte at position is not 0x3A (:), return failure.
	    if (input[position.position] !== 0x3a) {
	      return 'failure'
	    }

	    // 2.6. Advance position by 1.
	    position.position++;

	    // 2.7. Collect a sequence of bytes that are HTTP tab or space bytes given position.
	    //      (Do nothing with those bytes.)
	    collectASequenceOfBytes(
	      (char) => char === 0x20 || char === 0x09,
	      input,
	      position
	    );

	    // 2.8. Byte-lowercase header name and switch on the result:
	    switch (bufferToLowerCasedHeaderName(headerName)) {
	      case 'content-disposition': {
	        // 1. Set name and filename to null.
	        name = filename = null;

	        // 2. If position does not point to a sequence of bytes starting with
	        //    `form-data; name="`, return failure.
	        if (!bufferStartsWith(input, formDataNameBuffer, position)) {
	          return 'failure'
	        }

	        // 3. Advance position so it points at the byte after the next 0x22 (")
	        //    byte (the one in the sequence of bytes matched above).
	        position.position += 17;

	        // 4. Set name to the result of parsing a multipart/form-data name given
	        //    input and position, if the result is not failure. Otherwise, return
	        //    failure.
	        name = parseMultipartFormDataName(input, position);

	        if (name === null) {
	          return 'failure'
	        }

	        // 5. If position points to a sequence of bytes starting with `; filename="`:
	        if (bufferStartsWith(input, filenameBuffer, position)) {
	          // Note: undici also handles filename*
	          let check = position.position + filenameBuffer.length;

	          if (input[check] === 0x2a) {
	            position.position += 1;
	            check += 1;
	          }

	          if (input[check] !== 0x3d || input[check + 1] !== 0x22) { // ="
	            return 'failure'
	          }

	          // 1. Advance position so it points at the byte after the next 0x22 (") byte
	          //    (the one in the sequence of bytes matched above).
	          position.position += 12;

	          // 2. Set filename to the result of parsing a multipart/form-data name given
	          //    input and position, if the result is not failure. Otherwise, return failure.
	          filename = parseMultipartFormDataName(input, position);

	          if (filename === null) {
	            return 'failure'
	          }
	        }

	        break
	      }
	      case 'content-type': {
	        // 1. Let header value be the result of collecting a sequence of bytes that are
	        //    not 0x0A (LF) or 0x0D (CR), given position.
	        let headerValue = collectASequenceOfBytes(
	          (char) => char !== 0x0a && char !== 0x0d,
	          input,
	          position
	        );

	        // 2. Remove any HTTP tab or space bytes from the end of header value.
	        headerValue = removeChars(headerValue, false, true, (char) => char === 0x9 || char === 0x20);

	        // 3. Set contentType to the isomorphic decoding of header value.
	        contentType = isomorphicDecode(headerValue);

	        break
	      }
	      case 'content-transfer-encoding': {
	        let headerValue = collectASequenceOfBytes(
	          (char) => char !== 0x0a && char !== 0x0d,
	          input,
	          position
	        );

	        headerValue = removeChars(headerValue, false, true, (char) => char === 0x9 || char === 0x20);

	        encoding = isomorphicDecode(headerValue);

	        break
	      }
	      default: {
	        // Collect a sequence of bytes that are not 0x0A (LF) or 0x0D (CR), given position.
	        // (Do nothing with those bytes.)
	        collectASequenceOfBytes(
	          (char) => char !== 0x0a && char !== 0x0d,
	          input,
	          position
	        );
	      }
	    }

	    // 2.9. If position does not point to a sequence of bytes starting with 0x0D 0x0A
	    //      (CR LF), return failure. Otherwise, advance position by 2 (past the newline).
	    if (input[position.position] !== 0x0d && input[position.position + 1] !== 0x0a) {
	      return 'failure'
	    } else {
	      position.position += 2;
	    }
	  }
	}

	/**
	 * @see https://andreubotella.github.io/multipart-form-data/#parse-a-multipart-form-data-name
	 * @param {Buffer} input
	 * @param {{ position: number }} position
	 */
	function parseMultipartFormDataName (input, position) {
	  // 1. Assert: The byte at (position - 1) is 0x22 (").
	  assert(input[position.position - 1] === 0x22);

	  // 2. Let name be the result of collecting a sequence of bytes that are not 0x0A (LF), 0x0D (CR) or 0x22 ("), given position.
	  /** @type {string | Buffer} */
	  let name = collectASequenceOfBytes(
	    (char) => char !== 0x0a && char !== 0x0d && char !== 0x22,
	    input,
	    position
	  );

	  // 3. If the byte at position is not 0x22 ("), return failure. Otherwise, advance position by 1.
	  if (input[position.position] !== 0x22) {
	    return null // name could be 'failure'
	  } else {
	    position.position++;
	  }

	  // 4. Replace any occurrence of the following subsequences in name with the given byte:
	  // - `%0A`: 0x0A (LF)
	  // - `%0D`: 0x0D (CR)
	  // - `%22`: 0x22 (")
	  name = new TextDecoder().decode(name)
	    .replace(/%0A/ig, '\n')
	    .replace(/%0D/ig, '\r')
	    .replace(/%22/g, '"');

	  // 5. Return the UTF-8 decoding without BOM of name.
	  return name
	}

	/**
	 * @param {(char: number) => boolean} condition
	 * @param {Buffer} input
	 * @param {{ position: number }} position
	 */
	function collectASequenceOfBytes (condition, input, position) {
	  let start = position.position;

	  while (start < input.length && condition(input[start])) {
	    ++start;
	  }

	  return input.subarray(position.position, (position.position = start))
	}

	/**
	 * @param {Buffer} buf
	 * @param {boolean} leading
	 * @param {boolean} trailing
	 * @param {(charCode: number) => boolean} predicate
	 * @returns {Buffer}
	 */
	function removeChars (buf, leading, trailing, predicate) {
	  let lead = 0;
	  let trail = buf.length - 1;

	  if (leading) {
	    while (lead < buf.length && predicate(buf[lead])) lead++;
	  }

	  if (trailing) {
	    while (trail > 0 && predicate(buf[trail])) trail--;
	  }

	  return lead === 0 && trail === buf.length - 1 ? buf : buf.subarray(lead, trail + 1)
	}

	/**
	 * Checks if {@param buffer} starts with {@param start}
	 * @param {Buffer} buffer
	 * @param {Buffer} start
	 * @param {{ position: number }} position
	 */
	function bufferStartsWith (buffer, start, position) {
	  if (buffer.length < start.length) {
	    return false
	  }

	  for (let i = 0; i < start.length; i++) {
	    if (start[i] !== buffer[position.position + i]) {
	      return false
	    }
	  }

	  return true
	}

	formdataParser = {
	  multipartFormDataParser,
	  validateBoundary,
	  escapeFormDataName
	};
	return formdataParser;
}

var body;
var hasRequiredBody;

function requireBody () {
	if (hasRequiredBody) return body;
	hasRequiredBody = 1;

	const util = util$m;
	const {
	  ReadableStreamFrom,
	  isBlobLike,
	  isReadableStreamLike,
	  readableStreamClose,
	  createDeferredPromise,
	  fullyReadBody,
	  extractMimeType,
	  utf8DecodeBytes
	} = requireUtil$5();
	const { FormData } = requireFormdata();
	const { kState } = requireSymbols$3();
	const { webidl } = requireWebidl();
	const { Blob } = require$$6;
	const assert = require$$0;
	const { isErrored } = util$m;
	const { isArrayBuffer } = require$$8$1;
	const { serializeAMimeType } = requireDataUrl();
	const { multipartFormDataParser } = requireFormdataParser();

	const textEncoder = new TextEncoder();

	// https://fetch.spec.whatwg.org/#concept-bodyinit-extract
	function extractBody (object, keepalive = false) {
	  // 1. Let stream be null.
	  let stream = null;

	  // 2. If object is a ReadableStream object, then set stream to object.
	  if (object instanceof ReadableStream) {
	    stream = object;
	  } else if (isBlobLike(object)) {
	    // 3. Otherwise, if object is a Blob object, set stream to the
	    //    result of running object’s get stream.
	    stream = object.stream();
	  } else {
	    // 4. Otherwise, set stream to a new ReadableStream object, and set
	    //    up stream with byte reading support.
	    stream = new ReadableStream({
	      async pull (controller) {
	        const buffer = typeof source === 'string' ? textEncoder.encode(source) : source;

	        if (buffer.byteLength) {
	          controller.enqueue(buffer);
	        }

	        queueMicrotask(() => readableStreamClose(controller));
	      },
	      start () {},
	      type: 'bytes'
	    });
	  }

	  // 5. Assert: stream is a ReadableStream object.
	  assert(isReadableStreamLike(stream));

	  // 6. Let action be null.
	  let action = null;

	  // 7. Let source be null.
	  let source = null;

	  // 8. Let length be null.
	  let length = null;

	  // 9. Let type be null.
	  let type = null;

	  // 10. Switch on object:
	  if (typeof object === 'string') {
	    // Set source to the UTF-8 encoding of object.
	    // Note: setting source to a Uint8Array here breaks some mocking assumptions.
	    source = object;

	    // Set type to `text/plain;charset=UTF-8`.
	    type = 'text/plain;charset=UTF-8';
	  } else if (object instanceof URLSearchParams) {
	    // URLSearchParams

	    // spec says to run application/x-www-form-urlencoded on body.list
	    // this is implemented in Node.js as apart of an URLSearchParams instance toString method
	    // See: https://github.com/nodejs/node/blob/e46c680bf2b211bbd52cf959ca17ee98c7f657f5/lib/internal/url.js#L490
	    // and https://github.com/nodejs/node/blob/e46c680bf2b211bbd52cf959ca17ee98c7f657f5/lib/internal/url.js#L1100

	    // Set source to the result of running the application/x-www-form-urlencoded serializer with object’s list.
	    source = object.toString();

	    // Set type to `application/x-www-form-urlencoded;charset=UTF-8`.
	    type = 'application/x-www-form-urlencoded;charset=UTF-8';
	  } else if (isArrayBuffer(object)) {
	    // BufferSource/ArrayBuffer

	    // Set source to a copy of the bytes held by object.
	    source = new Uint8Array(object.slice());
	  } else if (ArrayBuffer.isView(object)) {
	    // BufferSource/ArrayBufferView

	    // Set source to a copy of the bytes held by object.
	    source = new Uint8Array(object.buffer.slice(object.byteOffset, object.byteOffset + object.byteLength));
	  } else if (util.isFormDataLike(object)) {
	    const boundary = `----formdata-undici-0${`${Math.floor(Math.random() * 1e11)}`.padStart(11, '0')}`;
	    const prefix = `--${boundary}\r\nContent-Disposition: form-data`;

	    /*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
	    const escape = (str) =>
	      str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22');
	    const normalizeLinefeeds = (value) => value.replace(/\r?\n|\r/g, '\r\n');

	    // Set action to this step: run the multipart/form-data
	    // encoding algorithm, with object’s entry list and UTF-8.
	    // - This ensures that the body is immutable and can't be changed afterwords
	    // - That the content-length is calculated in advance.
	    // - And that all parts are pre-encoded and ready to be sent.

	    const blobParts = [];
	    const rn = new Uint8Array([13, 10]); // '\r\n'
	    length = 0;
	    let hasUnknownSizeValue = false;

	    for (const [name, value] of object) {
	      if (typeof value === 'string') {
	        const chunk = textEncoder.encode(prefix +
	          `; name="${escape(normalizeLinefeeds(name))}"` +
	          `\r\n\r\n${normalizeLinefeeds(value)}\r\n`);
	        blobParts.push(chunk);
	        length += chunk.byteLength;
	      } else {
	        const chunk = textEncoder.encode(`${prefix}; name="${escape(normalizeLinefeeds(name))}"` +
	          (value.name ? `; filename="${escape(value.name)}"` : '') + '\r\n' +
	          `Content-Type: ${
	            value.type || 'application/octet-stream'
	          }\r\n\r\n`);
	        blobParts.push(chunk, value, rn);
	        if (typeof value.size === 'number') {
	          length += chunk.byteLength + value.size + rn.byteLength;
	        } else {
	          hasUnknownSizeValue = true;
	        }
	      }
	    }

	    const chunk = textEncoder.encode(`--${boundary}--`);
	    blobParts.push(chunk);
	    length += chunk.byteLength;
	    if (hasUnknownSizeValue) {
	      length = null;
	    }

	    // Set source to object.
	    source = object;

	    action = async function * () {
	      for (const part of blobParts) {
	        if (part.stream) {
	          yield * part.stream();
	        } else {
	          yield part;
	        }
	      }
	    };

	    // Set type to `multipart/form-data; boundary=`,
	    // followed by the multipart/form-data boundary string generated
	    // by the multipart/form-data encoding algorithm.
	    type = `multipart/form-data; boundary=${boundary}`;
	  } else if (isBlobLike(object)) {
	    // Blob

	    // Set source to object.
	    source = object;

	    // Set length to object’s size.
	    length = object.size;

	    // If object’s type attribute is not the empty byte sequence, set
	    // type to its value.
	    if (object.type) {
	      type = object.type;
	    }
	  } else if (typeof object[Symbol.asyncIterator] === 'function') {
	    // If keepalive is true, then throw a TypeError.
	    if (keepalive) {
	      throw new TypeError('keepalive')
	    }

	    // If object is disturbed or locked, then throw a TypeError.
	    if (util.isDisturbed(object) || object.locked) {
	      throw new TypeError(
	        'Response body object should not be disturbed or locked'
	      )
	    }

	    stream =
	      object instanceof ReadableStream ? object : ReadableStreamFrom(object);
	  }

	  // 11. If source is a byte sequence, then set action to a
	  // step that returns source and length to source’s length.
	  if (typeof source === 'string' || util.isBuffer(source)) {
	    length = Buffer.byteLength(source);
	  }

	  // 12. If action is non-null, then run these steps in in parallel:
	  if (action != null) {
	    // Run action.
	    let iterator;
	    stream = new ReadableStream({
	      async start () {
	        iterator = action(object)[Symbol.asyncIterator]();
	      },
	      async pull (controller) {
	        const { value, done } = await iterator.next();
	        if (done) {
	          // When running action is done, close stream.
	          queueMicrotask(() => {
	            controller.close();
	            controller.byobRequest?.respond(0);
	          });
	        } else {
	          // Whenever one or more bytes are available and stream is not errored,
	          // enqueue a Uint8Array wrapping an ArrayBuffer containing the available
	          // bytes into stream.
	          if (!isErrored(stream)) {
	            const buffer = new Uint8Array(value);
	            if (buffer.byteLength) {
	              controller.enqueue(buffer);
	            }
	          }
	        }
	        return controller.desiredSize > 0
	      },
	      async cancel (reason) {
	        await iterator.return();
	      },
	      type: 'bytes'
	    });
	  }

	  // 13. Let body be a body whose stream is stream, source is source,
	  // and length is length.
	  const body = { stream, source, length };

	  // 14. Return (body, type).
	  return [body, type]
	}

	// https://fetch.spec.whatwg.org/#bodyinit-safely-extract
	function safelyExtractBody (object, keepalive = false) {
	  // To safely extract a body and a `Content-Type` value from
	  // a byte sequence or BodyInit object object, run these steps:

	  // 1. If object is a ReadableStream object, then:
	  if (object instanceof ReadableStream) {
	    // Assert: object is neither disturbed nor locked.
	    // istanbul ignore next
	    assert(!util.isDisturbed(object), 'The body has already been consumed.');
	    // istanbul ignore next
	    assert(!object.locked, 'The stream is locked.');
	  }

	  // 2. Return the results of extracting object.
	  return extractBody(object, keepalive)
	}

	function cloneBody (body) {
	  // To clone a body body, run these steps:

	  // https://fetch.spec.whatwg.org/#concept-body-clone

	  // 1. Let « out1, out2 » be the result of teeing body’s stream.
	  const [out1, out2] = body.stream.tee();

	  // 2. Set body’s stream to out1.
	  body.stream = out1;

	  // 3. Return a body whose stream is out2 and other members are copied from body.
	  return {
	    stream: out2,
	    length: body.length,
	    source: body.source
	  }
	}

	function throwIfAborted (state) {
	  if (state.aborted) {
	    throw new DOMException('The operation was aborted.', 'AbortError')
	  }
	}

	function bodyMixinMethods (instance) {
	  const methods = {
	    blob () {
	      // The blob() method steps are to return the result of
	      // running consume body with this and the following step
	      // given a byte sequence bytes: return a Blob whose
	      // contents are bytes and whose type attribute is this’s
	      // MIME type.
	      return consumeBody(this, (bytes) => {
	        let mimeType = bodyMimeType(this);

	        if (mimeType === null) {
	          mimeType = '';
	        } else if (mimeType) {
	          mimeType = serializeAMimeType(mimeType);
	        }

	        // Return a Blob whose contents are bytes and type attribute
	        // is mimeType.
	        return new Blob([bytes], { type: mimeType })
	      }, instance)
	    },

	    arrayBuffer () {
	      // The arrayBuffer() method steps are to return the result
	      // of running consume body with this and the following step
	      // given a byte sequence bytes: return a new ArrayBuffer
	      // whose contents are bytes.
	      return consumeBody(this, (bytes) => {
	        return new Uint8Array(bytes).buffer
	      }, instance)
	    },

	    text () {
	      // The text() method steps are to return the result of running
	      // consume body with this and UTF-8 decode.
	      return consumeBody(this, utf8DecodeBytes, instance)
	    },

	    json () {
	      // The json() method steps are to return the result of running
	      // consume body with this and parse JSON from bytes.
	      return consumeBody(this, parseJSONFromBytes, instance)
	    },

	    formData () {
	      // The formData() method steps are to return the result of running
	      // consume body with this and the following step given a byte sequence bytes:
	      return consumeBody(this, (value) => {
	        // 1. Let mimeType be the result of get the MIME type with this.
	        const mimeType = bodyMimeType(this);

	        // 2. If mimeType is non-null, then switch on mimeType’s essence and run
	        //    the corresponding steps:
	        if (mimeType !== null) {
	          switch (mimeType.essence) {
	            case 'multipart/form-data': {
	              // 1. ... [long step]
	              const parsed = multipartFormDataParser(value, mimeType);

	              // 2. If that fails for some reason, then throw a TypeError.
	              if (parsed === 'failure') {
	                throw new TypeError('Failed to parse body as FormData.')
	              }

	              // 3. Return a new FormData object, appending each entry,
	              //    resulting from the parsing operation, to its entry list.
	              const fd = new FormData();
	              fd[kState] = parsed;

	              return fd
	            }
	            case 'application/x-www-form-urlencoded': {
	              // 1. Let entries be the result of parsing bytes.
	              const entries = new URLSearchParams(value.toString());

	              // 2. If entries is failure, then throw a TypeError.

	              // 3. Return a new FormData object whose entry list is entries.
	              const fd = new FormData();

	              for (const [name, value] of entries) {
	                fd.append(name, value);
	              }

	              return fd
	            }
	          }
	        }

	        // 3. Throw a TypeError.
	        throw new TypeError(
	          'Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".'
	        )
	      }, instance)
	    }
	  };

	  return methods
	}

	function mixinBody (prototype) {
	  Object.assign(prototype.prototype, bodyMixinMethods(prototype));
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#concept-body-consume-body
	 * @param {Response|Request} object
	 * @param {(value: unknown) => unknown} convertBytesToJSValue
	 * @param {Response|Request} instance
	 */
	async function consumeBody (object, convertBytesToJSValue, instance) {
	  webidl.brandCheck(object, instance);

	  throwIfAborted(object[kState]);

	  // 1. If object is unusable, then return a promise rejected
	  //    with a TypeError.
	  if (bodyUnusable(object[kState].body)) {
	    throw new TypeError('Body is unusable')
	  }

	  // 2. Let promise be a new promise.
	  const promise = createDeferredPromise();

	  // 3. Let errorSteps given error be to reject promise with error.
	  const errorSteps = (error) => promise.reject(error);

	  // 4. Let successSteps given a byte sequence data be to resolve
	  //    promise with the result of running convertBytesToJSValue
	  //    with data. If that threw an exception, then run errorSteps
	  //    with that exception.
	  const successSteps = (data) => {
	    try {
	      promise.resolve(convertBytesToJSValue(data));
	    } catch (e) {
	      errorSteps(e);
	    }
	  };

	  // 5. If object’s body is null, then run successSteps with an
	  //    empty byte sequence.
	  if (object[kState].body == null) {
	    successSteps(new Uint8Array());
	    return promise.promise
	  }

	  // 6. Otherwise, fully read object’s body given successSteps,
	  //    errorSteps, and object’s relevant global object.
	  await fullyReadBody(object[kState].body, successSteps, errorSteps);

	  // 7. Return promise.
	  return promise.promise
	}

	// https://fetch.spec.whatwg.org/#body-unusable
	function bodyUnusable (body) {
	  // An object including the Body interface mixin is
	  // said to be unusable if its body is non-null and
	  // its body’s stream is disturbed or locked.
	  return body != null && (body.stream.locked || util.isDisturbed(body.stream))
	}

	/**
	 * @see https://infra.spec.whatwg.org/#parse-json-bytes-to-a-javascript-value
	 * @param {Uint8Array} bytes
	 */
	function parseJSONFromBytes (bytes) {
	  return JSON.parse(utf8DecodeBytes(bytes))
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#concept-body-mime-type
	 * @param {import('./response').Response|import('./request').Request} requestOrResponse
	 */
	function bodyMimeType (requestOrResponse) {
	  // 1. Let headers be null.
	  // 2. If requestOrResponse is a Request object, then set headers to requestOrResponse’s request’s header list.
	  // 3. Otherwise, set headers to requestOrResponse’s response’s header list.
	  /** @type {import('./headers').HeadersList} */
	  const headers = requestOrResponse[kState].headersList;

	  // 4. Let mimeType be the result of extracting a MIME type from headers.
	  const mimeType = extractMimeType(headers);

	  // 5. If mimeType is failure, then return null.
	  if (mimeType === 'failure') {
	    return null
	  }

	  // 6. Return mimeType.
	  return mimeType
	}

	body = {
	  extractBody,
	  safelyExtractBody,
	  cloneBody,
	  mixinBody
	};
	return body;
}

/* global WebAssembly */

const assert$8 = require$$0;
const util$i = util$m;
const { channels: channels$1 } = diagnostics;
const timers = timers$1;
const {
  RequestContentLengthMismatchError: RequestContentLengthMismatchError$1,
  ResponseContentLengthMismatchError,
  RequestAbortedError: RequestAbortedError$9,
  HeadersTimeoutError,
  HeadersOverflowError,
  SocketError: SocketError$3,
  InformationalError: InformationalError$2,
  BodyTimeoutError,
  HTTPParserError,
  ResponseExceededMaxSizeError
} = errors$1;
const {
  kUrl: kUrl$5,
  kReset: kReset$1,
  kClient: kClient$3,
  kParser,
  kBlocking,
  kRunning: kRunning$5,
  kPending: kPending$4,
  kSize: kSize$4,
  kWriting,
  kQueue: kQueue$3,
  kNoRef,
  kKeepAliveDefaultTimeout: kKeepAliveDefaultTimeout$1,
  kHostHeader: kHostHeader$1,
  kPendingIdx: kPendingIdx$2,
  kRunningIdx: kRunningIdx$2,
  kError: kError$2,
  kPipelining: kPipelining$1,
  kSocket: kSocket$1,
  kKeepAliveTimeoutValue: kKeepAliveTimeoutValue$1,
  kMaxHeadersSize: kMaxHeadersSize$1,
  kKeepAliveMaxTimeout: kKeepAliveMaxTimeout$1,
  kKeepAliveTimeoutThreshold: kKeepAliveTimeoutThreshold$1,
  kHeadersTimeout: kHeadersTimeout$1,
  kBodyTimeout: kBodyTimeout$1,
  kStrictContentLength: kStrictContentLength$2,
  kMaxRequests: kMaxRequests$1,
  kCounter: kCounter$1,
  kMaxResponseSize: kMaxResponseSize$1,
  kListeners,
  kOnError: kOnError$2,
  kResume: kResume$3,
  kHTTPContext: kHTTPContext$1
} = symbols$4;

const constants$2 = constants$4;
const EMPTY_BUF = Buffer.alloc(0);
const FastBuffer = Buffer[Symbol.species];

let extractBody;

function addListener (obj, name, listener) {
  const listeners = (obj[kListeners] ??= []);
  listeners.push([name, listener]);
  obj.on(name, listener);
  return obj
}

function removeAllListeners (obj) {
  for (const [name, listener] of obj[kListeners] ?? []) {
    obj.removeListener(name, listener);
  }
  obj[kListeners] = null;
}

async function lazyllhttp () {
  const llhttpWasmData = process.env.JEST_WORKER_ID ? requireLlhttpWasm() : undefined;

  let mod;
  try {
    mod = await WebAssembly.compile(requireLlhttp_simdWasm());
  } catch (e) {
    /* istanbul ignore next */

    // We could check if the error was caused by the simd option not
    // being enabled, but the occurring of this other error
    // * https://github.com/emscripten-core/emscripten/issues/11495
    // got me to remove that check to avoid breaking Node 12.
    mod = await WebAssembly.compile(llhttpWasmData || requireLlhttpWasm());
  }

  return await WebAssembly.instantiate(mod, {
    env: {
      /* eslint-disable camelcase */

      wasm_on_url: (p, at, len) => {
        /* istanbul ignore next */
        return 0
      },
      wasm_on_status: (p, at, len) => {
        assert$8.strictEqual(currentParser.ptr, p);
        const start = at - currentBufferPtr + currentBufferRef.byteOffset;
        return currentParser.onStatus(new FastBuffer(currentBufferRef.buffer, start, len)) || 0
      },
      wasm_on_message_begin: (p) => {
        assert$8.strictEqual(currentParser.ptr, p);
        return currentParser.onMessageBegin() || 0
      },
      wasm_on_header_field: (p, at, len) => {
        assert$8.strictEqual(currentParser.ptr, p);
        const start = at - currentBufferPtr + currentBufferRef.byteOffset;
        return currentParser.onHeaderField(new FastBuffer(currentBufferRef.buffer, start, len)) || 0
      },
      wasm_on_header_value: (p, at, len) => {
        assert$8.strictEqual(currentParser.ptr, p);
        const start = at - currentBufferPtr + currentBufferRef.byteOffset;
        return currentParser.onHeaderValue(new FastBuffer(currentBufferRef.buffer, start, len)) || 0
      },
      wasm_on_headers_complete: (p, statusCode, upgrade, shouldKeepAlive) => {
        assert$8.strictEqual(currentParser.ptr, p);
        return currentParser.onHeadersComplete(statusCode, Boolean(upgrade), Boolean(shouldKeepAlive)) || 0
      },
      wasm_on_body: (p, at, len) => {
        assert$8.strictEqual(currentParser.ptr, p);
        const start = at - currentBufferPtr + currentBufferRef.byteOffset;
        return currentParser.onBody(new FastBuffer(currentBufferRef.buffer, start, len)) || 0
      },
      wasm_on_message_complete: (p) => {
        assert$8.strictEqual(currentParser.ptr, p);
        return currentParser.onMessageComplete() || 0
      }

      /* eslint-enable camelcase */
    }
  })
}

let llhttpInstance = null;
let llhttpPromise = lazyllhttp();
llhttpPromise.catch();

let currentParser = null;
let currentBufferRef = null;
let currentBufferSize = 0;
let currentBufferPtr = null;

const TIMEOUT_HEADERS = 1;
const TIMEOUT_BODY = 2;
const TIMEOUT_IDLE = 3;

class Parser {
  constructor (client, socket, { exports }) {
    assert$8(Number.isFinite(client[kMaxHeadersSize$1]) && client[kMaxHeadersSize$1] > 0);

    this.llhttp = exports;
    this.ptr = this.llhttp.llhttp_alloc(constants$2.TYPE.RESPONSE);
    this.client = client;
    this.socket = socket;
    this.timeout = null;
    this.timeoutValue = null;
    this.timeoutType = null;
    this.statusCode = null;
    this.statusText = '';
    this.upgrade = false;
    this.headers = [];
    this.headersSize = 0;
    this.headersMaxSize = client[kMaxHeadersSize$1];
    this.shouldKeepAlive = false;
    this.paused = false;
    this.resume = this.resume.bind(this);

    this.bytesRead = 0;

    this.keepAlive = '';
    this.contentLength = '';
    this.connection = '';
    this.maxResponseSize = client[kMaxResponseSize$1];
  }

  setTimeout (value, type) {
    this.timeoutType = type;
    if (value !== this.timeoutValue) {
      timers.clearTimeout(this.timeout);
      if (value) {
        this.timeout = timers.setTimeout(onParserTimeout, value, this);
        // istanbul ignore else: only for jest
        if (this.timeout.unref) {
          this.timeout.unref();
        }
      } else {
        this.timeout = null;
      }
      this.timeoutValue = value;
    } else if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh();
      }
    }
  }

  resume () {
    if (this.socket.destroyed || !this.paused) {
      return
    }

    assert$8(this.ptr != null);
    assert$8(currentParser == null);

    this.llhttp.llhttp_resume(this.ptr);

    assert$8(this.timeoutType === TIMEOUT_BODY);
    if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh();
      }
    }

    this.paused = false;
    this.execute(this.socket.read() || EMPTY_BUF); // Flush parser.
    this.readMore();
  }

  readMore () {
    while (!this.paused && this.ptr) {
      const chunk = this.socket.read();
      if (chunk === null) {
        break
      }
      this.execute(chunk);
    }
  }

  execute (data) {
    assert$8(this.ptr != null);
    assert$8(currentParser == null);
    assert$8(!this.paused);

    const { socket, llhttp } = this;

    if (data.length > currentBufferSize) {
      if (currentBufferPtr) {
        llhttp.free(currentBufferPtr);
      }
      currentBufferSize = Math.ceil(data.length / 4096) * 4096;
      currentBufferPtr = llhttp.malloc(currentBufferSize);
    }

    new Uint8Array(llhttp.memory.buffer, currentBufferPtr, currentBufferSize).set(data);

    // Call `execute` on the wasm parser.
    // We pass the `llhttp_parser` pointer address, the pointer address of buffer view data,
    // and finally the length of bytes to parse.
    // The return value is an error code or `constants.ERROR.OK`.
    try {
      let ret;

      try {
        currentBufferRef = data;
        currentParser = this;
        ret = llhttp.llhttp_execute(this.ptr, currentBufferPtr, data.length);
        /* eslint-disable-next-line no-useless-catch */
      } catch (err) {
        /* istanbul ignore next: difficult to make a test case for */
        throw err
      } finally {
        currentParser = null;
        currentBufferRef = null;
      }

      const offset = llhttp.llhttp_get_error_pos(this.ptr) - currentBufferPtr;

      if (ret === constants$2.ERROR.PAUSED_UPGRADE) {
        this.onUpgrade(data.slice(offset));
      } else if (ret === constants$2.ERROR.PAUSED) {
        this.paused = true;
        socket.unshift(data.slice(offset));
      } else if (ret !== constants$2.ERROR.OK) {
        const ptr = llhttp.llhttp_get_error_reason(this.ptr);
        let message = '';
        /* istanbul ignore else: difficult to make a test case for */
        if (ptr) {
          const len = new Uint8Array(llhttp.memory.buffer, ptr).indexOf(0);
          message =
            'Response does not match the HTTP/1.1 protocol (' +
            Buffer.from(llhttp.memory.buffer, ptr, len).toString() +
            ')';
        }
        throw new HTTPParserError(message, constants$2.ERROR[ret], data.slice(offset))
      }
    } catch (err) {
      util$i.destroy(socket, err);
    }
  }

  destroy () {
    assert$8(this.ptr != null);
    assert$8(currentParser == null);

    this.llhttp.llhttp_free(this.ptr);
    this.ptr = null;

    timers.clearTimeout(this.timeout);
    this.timeout = null;
    this.timeoutValue = null;
    this.timeoutType = null;

    this.paused = false;
  }

  onStatus (buf) {
    this.statusText = buf.toString();
  }

  onMessageBegin () {
    const { socket, client } = this;

    /* istanbul ignore next: difficult to make a test case for */
    if (socket.destroyed) {
      return -1
    }

    const request = client[kQueue$3][client[kRunningIdx$2]];
    if (!request) {
      return -1
    }
    request.onResponseStarted();
  }

  onHeaderField (buf) {
    const len = this.headers.length;

    if ((len & 1) === 0) {
      this.headers.push(buf);
    } else {
      this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
    }

    this.trackHeader(buf.length);
  }

  onHeaderValue (buf) {
    let len = this.headers.length;

    if ((len & 1) === 1) {
      this.headers.push(buf);
      len += 1;
    } else {
      this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
    }

    const key = this.headers[len - 2];
    if (key.length === 10) {
      const headerName = util$i.bufferToLowerCasedHeaderName(key);
      if (headerName === 'keep-alive') {
        this.keepAlive += buf.toString();
      } else if (headerName === 'connection') {
        this.connection += buf.toString();
      }
    } else if (key.length === 14 && util$i.bufferToLowerCasedHeaderName(key) === 'content-length') {
      this.contentLength += buf.toString();
    }

    this.trackHeader(buf.length);
  }

  trackHeader (len) {
    this.headersSize += len;
    if (this.headersSize >= this.headersMaxSize) {
      util$i.destroy(this.socket, new HeadersOverflowError());
    }
  }

  onUpgrade (head) {
    const { upgrade, client, socket, headers, statusCode } = this;

    assert$8(upgrade);

    const request = client[kQueue$3][client[kRunningIdx$2]];
    assert$8(request);

    assert$8(!socket.destroyed);
    assert$8(socket === client[kSocket$1]);
    assert$8(!this.paused);
    assert$8(request.upgrade || request.method === 'CONNECT');

    this.statusCode = null;
    this.statusText = '';
    this.shouldKeepAlive = null;

    assert$8(this.headers.length % 2 === 0);
    this.headers = [];
    this.headersSize = 0;

    socket.unshift(head);

    socket[kParser].destroy();
    socket[kParser] = null;

    socket[kClient$3] = null;
    socket[kError$2] = null;

    removeAllListeners(socket);

    client[kSocket$1] = null;
    client[kHTTPContext$1] = null; // TODO (fix): This is hacky...
    client[kQueue$3][client[kRunningIdx$2]++] = null;
    client.emit('disconnect', client[kUrl$5], [client], new InformationalError$2('upgrade'));

    try {
      request.onUpgrade(statusCode, headers, socket);
    } catch (err) {
      util$i.destroy(socket, err);
    }

    client[kResume$3]();
  }

  onHeadersComplete (statusCode, upgrade, shouldKeepAlive) {
    const { client, socket, headers, statusText } = this;

    /* istanbul ignore next: difficult to make a test case for */
    if (socket.destroyed) {
      return -1
    }

    const request = client[kQueue$3][client[kRunningIdx$2]];

    /* istanbul ignore next: difficult to make a test case for */
    if (!request) {
      return -1
    }

    assert$8(!this.upgrade);
    assert$8(this.statusCode < 200);

    if (statusCode === 100) {
      util$i.destroy(socket, new SocketError$3('bad response', util$i.getSocketInfo(socket)));
      return -1
    }

    /* this can only happen if server is misbehaving */
    if (upgrade && !request.upgrade) {
      util$i.destroy(socket, new SocketError$3('bad upgrade', util$i.getSocketInfo(socket)));
      return -1
    }

    assert$8.strictEqual(this.timeoutType, TIMEOUT_HEADERS);

    this.statusCode = statusCode;
    this.shouldKeepAlive = (
      shouldKeepAlive ||
      // Override llhttp value which does not allow keepAlive for HEAD.
      (request.method === 'HEAD' && !socket[kReset$1] && this.connection.toLowerCase() === 'keep-alive')
    );

    if (this.statusCode >= 200) {
      const bodyTimeout = request.bodyTimeout != null
        ? request.bodyTimeout
        : client[kBodyTimeout$1];
      this.setTimeout(bodyTimeout, TIMEOUT_BODY);
    } else if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh();
      }
    }

    if (request.method === 'CONNECT') {
      assert$8(client[kRunning$5] === 1);
      this.upgrade = true;
      return 2
    }

    if (upgrade) {
      assert$8(client[kRunning$5] === 1);
      this.upgrade = true;
      return 2
    }

    assert$8(this.headers.length % 2 === 0);
    this.headers = [];
    this.headersSize = 0;

    if (this.shouldKeepAlive && client[kPipelining$1]) {
      const keepAliveTimeout = this.keepAlive ? util$i.parseKeepAliveTimeout(this.keepAlive) : null;

      if (keepAliveTimeout != null) {
        const timeout = Math.min(
          keepAliveTimeout - client[kKeepAliveTimeoutThreshold$1],
          client[kKeepAliveMaxTimeout$1]
        );
        if (timeout <= 0) {
          socket[kReset$1] = true;
        } else {
          client[kKeepAliveTimeoutValue$1] = timeout;
        }
      } else {
        client[kKeepAliveTimeoutValue$1] = client[kKeepAliveDefaultTimeout$1];
      }
    } else {
      // Stop more requests from being dispatched.
      socket[kReset$1] = true;
    }

    const pause = request.onHeaders(statusCode, headers, this.resume, statusText) === false;

    if (request.aborted) {
      return -1
    }

    if (request.method === 'HEAD') {
      return 1
    }

    if (statusCode < 200) {
      return 1
    }

    if (socket[kBlocking]) {
      socket[kBlocking] = false;
      client[kResume$3]();
    }

    return pause ? constants$2.ERROR.PAUSED : 0
  }

  onBody (buf) {
    const { client, socket, statusCode, maxResponseSize } = this;

    if (socket.destroyed) {
      return -1
    }

    const request = client[kQueue$3][client[kRunningIdx$2]];
    assert$8(request);

    assert$8.strictEqual(this.timeoutType, TIMEOUT_BODY);
    if (this.timeout) {
      // istanbul ignore else: only for jest
      if (this.timeout.refresh) {
        this.timeout.refresh();
      }
    }

    assert$8(statusCode >= 200);

    if (maxResponseSize > -1 && this.bytesRead + buf.length > maxResponseSize) {
      util$i.destroy(socket, new ResponseExceededMaxSizeError());
      return -1
    }

    this.bytesRead += buf.length;

    if (request.onData(buf) === false) {
      return constants$2.ERROR.PAUSED
    }
  }

  onMessageComplete () {
    const { client, socket, statusCode, upgrade, headers, contentLength, bytesRead, shouldKeepAlive } = this;

    if (socket.destroyed && (!statusCode || shouldKeepAlive)) {
      return -1
    }

    if (upgrade) {
      return
    }

    const request = client[kQueue$3][client[kRunningIdx$2]];
    assert$8(request);

    assert$8(statusCode >= 100);

    this.statusCode = null;
    this.statusText = '';
    this.bytesRead = 0;
    this.contentLength = '';
    this.keepAlive = '';
    this.connection = '';

    assert$8(this.headers.length % 2 === 0);
    this.headers = [];
    this.headersSize = 0;

    if (statusCode < 200) {
      return
    }

    /* istanbul ignore next: should be handled by llhttp? */
    if (request.method !== 'HEAD' && contentLength && bytesRead !== parseInt(contentLength, 10)) {
      util$i.destroy(socket, new ResponseContentLengthMismatchError());
      return -1
    }

    request.onComplete(headers);

    client[kQueue$3][client[kRunningIdx$2]++] = null;

    if (socket[kWriting]) {
      assert$8.strictEqual(client[kRunning$5], 0);
      // Response completed before request.
      util$i.destroy(socket, new InformationalError$2('reset'));
      return constants$2.ERROR.PAUSED
    } else if (!shouldKeepAlive) {
      util$i.destroy(socket, new InformationalError$2('reset'));
      return constants$2.ERROR.PAUSED
    } else if (socket[kReset$1] && client[kRunning$5] === 0) {
      // Destroy socket once all requests have completed.
      // The request at the tail of the pipeline is the one
      // that requested reset and no further requests should
      // have been queued since then.
      util$i.destroy(socket, new InformationalError$2('reset'));
      return constants$2.ERROR.PAUSED
    } else if (client[kPipelining$1] == null || client[kPipelining$1] === 1) {
      // We must wait a full event loop cycle to reuse this socket to make sure
      // that non-spec compliant servers are not closing the connection even if they
      // said they won't.
      setImmediate(() => client[kResume$3]());
    } else {
      client[kResume$3]();
    }
  }
}

function onParserTimeout (parser) {
  const { socket, timeoutType, client } = parser;

  /* istanbul ignore else */
  if (timeoutType === TIMEOUT_HEADERS) {
    if (!socket[kWriting] || socket.writableNeedDrain || client[kRunning$5] > 1) {
      assert$8(!parser.paused, 'cannot be paused while waiting for headers');
      util$i.destroy(socket, new HeadersTimeoutError());
    }
  } else if (timeoutType === TIMEOUT_BODY) {
    if (!parser.paused) {
      util$i.destroy(socket, new BodyTimeoutError());
    }
  } else if (timeoutType === TIMEOUT_IDLE) {
    assert$8(client[kRunning$5] === 0 && client[kKeepAliveTimeoutValue$1]);
    util$i.destroy(socket, new InformationalError$2('socket idle timeout'));
  }
}

async function connectH1$1 (client, socket) {
  client[kSocket$1] = socket;

  if (!llhttpInstance) {
    llhttpInstance = await llhttpPromise;
    llhttpPromise = null;
  }

  socket[kNoRef] = false;
  socket[kWriting] = false;
  socket[kReset$1] = false;
  socket[kBlocking] = false;
  socket[kParser] = new Parser(client, socket, llhttpInstance);

  addListener(socket, 'error', function (err) {
    const parser = this[kParser];

    assert$8(err.code !== 'ERR_TLS_CERT_ALTNAME_INVALID');

    // On Mac OS, we get an ECONNRESET even if there is a full body to be forwarded
    // to the user.
    if (err.code === 'ECONNRESET' && parser.statusCode && !parser.shouldKeepAlive) {
      // We treat all incoming data so for as a valid response.
      parser.onMessageComplete();
      return
    }

    this[kError$2] = err;

    this[kClient$3][kOnError$2](err);
  });
  addListener(socket, 'readable', function () {
    const parser = this[kParser];

    if (parser) {
      parser.readMore();
    }
  });
  addListener(socket, 'end', function () {
    const parser = this[kParser];

    if (parser.statusCode && !parser.shouldKeepAlive) {
      // We treat all incoming data so far as a valid response.
      parser.onMessageComplete();
      return
    }

    util$i.destroy(this, new SocketError$3('other side closed', util$i.getSocketInfo(this)));
  });
  addListener(socket, 'close', function () {
    const client = this[kClient$3];
    const parser = this[kParser];

    if (parser) {
      if (!this[kError$2] && parser.statusCode && !parser.shouldKeepAlive) {
        // We treat all incoming data so far as a valid response.
        parser.onMessageComplete();
      }

      this[kParser].destroy();
      this[kParser] = null;
    }

    const err = this[kError$2] || new SocketError$3('closed', util$i.getSocketInfo(this));

    client[kSocket$1] = null;
    client[kHTTPContext$1] = null; // TODO (fix): This is hacky...

    if (client.destroyed) {
      assert$8(client[kPending$4] === 0);

      // Fail entire queue.
      const requests = client[kQueue$3].splice(client[kRunningIdx$2]);
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        errorRequest$2(client, request, err);
      }
    } else if (client[kRunning$5] > 0 && err.code !== 'UND_ERR_INFO') {
      // Fail head of pipeline.
      const request = client[kQueue$3][client[kRunningIdx$2]];
      client[kQueue$3][client[kRunningIdx$2]++] = null;

      errorRequest$2(client, request, err);
    }

    client[kPendingIdx$2] = client[kRunningIdx$2];

    assert$8(client[kRunning$5] === 0);

    client.emit('disconnect', client[kUrl$5], [client], err);

    client[kResume$3]();
  });

  let closed = false;
  socket.on('close', () => {
    closed = true;
  });

  return {
    version: 'h1',
    defaultPipelining: 1,
    write (...args) {
      return writeH1(client, ...args)
    },
    resume () {
      resumeH1(client);
    },
    destroy (err, callback) {
      if (closed) {
        queueMicrotask(callback);
      } else {
        socket.destroy(err).on('close', callback);
      }
    },
    get destroyed () {
      return socket.destroyed
    },
    busy (request) {
      if (socket[kWriting] || socket[kReset$1] || socket[kBlocking]) {
        return true
      }

      if (request) {
        if (client[kRunning$5] > 0 && !request.idempotent) {
          // Non-idempotent request cannot be retried.
          // Ensure that no other requests are inflight and
          // could cause failure.
          return true
        }

        if (client[kRunning$5] > 0 && (request.upgrade || request.method === 'CONNECT')) {
          // Don't dispatch an upgrade until all preceding requests have completed.
          // A misbehaving server might upgrade the connection before all pipelined
          // request has completed.
          return true
        }

        if (client[kRunning$5] > 0 && util$i.bodyLength(request.body) !== 0 &&
          (util$i.isStream(request.body) || util$i.isAsyncIterable(request.body) || util$i.isFormDataLike(request.body))) {
          // Request with stream or iterator body can error while other requests
          // are inflight and indirectly error those as well.
          // Ensure this doesn't happen by waiting for inflight
          // to complete before dispatching.

          // Request with stream or iterator body cannot be retried.
          // Ensure that no other requests are inflight and
          // could cause failure.
          return true
        }
      }

      return false
    }
  }
}

function resumeH1 (client) {
  const socket = client[kSocket$1];

  if (socket && !socket.destroyed) {
    if (client[kSize$4] === 0) {
      if (!socket[kNoRef] && socket.unref) {
        socket.unref();
        socket[kNoRef] = true;
      }
    } else if (socket[kNoRef] && socket.ref) {
      socket.ref();
      socket[kNoRef] = false;
    }

    if (client[kSize$4] === 0) {
      if (socket[kParser].timeoutType !== TIMEOUT_IDLE) {
        socket[kParser].setTimeout(client[kKeepAliveTimeoutValue$1], TIMEOUT_IDLE);
      }
    } else if (client[kRunning$5] > 0 && socket[kParser].statusCode < 200) {
      if (socket[kParser].timeoutType !== TIMEOUT_HEADERS) {
        const request = client[kQueue$3][client[kRunningIdx$2]];
        const headersTimeout = request.headersTimeout != null
          ? request.headersTimeout
          : client[kHeadersTimeout$1];
        socket[kParser].setTimeout(headersTimeout, TIMEOUT_HEADERS);
      }
    }
  }
}

function errorRequest$2 (client, request, err) {
  try {
    request.onError(err);
    assert$8(request.aborted);
  } catch (err) {
    client.emit('error', err);
  }
}

// https://www.rfc-editor.org/rfc/rfc7230#section-3.3.2
function shouldSendContentLength$1 (method) {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && method !== 'TRACE' && method !== 'CONNECT'
}

function writeH1 (client, request) {
  const { method, path, host, upgrade, blocking, reset } = request;

  let { body, headers, contentLength } = request;

  // https://tools.ietf.org/html/rfc7231#section-4.3.1
  // https://tools.ietf.org/html/rfc7231#section-4.3.2
  // https://tools.ietf.org/html/rfc7231#section-4.3.5

  // Sending a payload body on a request that does not
  // expect it can cause undefined behavior on some
  // servers and corrupt connection state. Do not
  // re-use the connection for further requests.

  const expectsPayload = (
    method === 'PUT' ||
    method === 'POST' ||
    method === 'PATCH'
  );

  if (util$i.isFormDataLike(body)) {
    if (!extractBody) {
      extractBody = requireBody().extractBody;
    }

    const [bodyStream, contentType] = extractBody(body);
    if (request.contentType == null) {
      headers.push('content-type', contentType);
    }
    body = bodyStream.stream;
    contentLength = bodyStream.length;
  } else if (util$i.isBlobLike(body) && request.contentType == null && body.type) {
    headers.push('content-type', body.type);
  }

  if (body && typeof body.read === 'function') {
    // Try to read EOF in order to get length.
    body.read(0);
  }

  const bodyLength = util$i.bodyLength(body);

  contentLength = bodyLength ?? contentLength;

  if (contentLength === null) {
    contentLength = request.contentLength;
  }

  if (contentLength === 0 && !expectsPayload) {
    // https://tools.ietf.org/html/rfc7230#section-3.3.2
    // A user agent SHOULD NOT send a Content-Length header field when
    // the request message does not contain a payload body and the method
    // semantics do not anticipate such a body.

    contentLength = null;
  }

  // https://github.com/nodejs/undici/issues/2046
  // A user agent may send a Content-Length header with 0 value, this should be allowed.
  if (shouldSendContentLength$1(method) && contentLength > 0 && request.contentLength !== null && request.contentLength !== contentLength) {
    if (client[kStrictContentLength$2]) {
      errorRequest$2(client, request, new RequestContentLengthMismatchError$1());
      return false
    }

    process.emitWarning(new RequestContentLengthMismatchError$1());
  }

  const socket = client[kSocket$1];

  try {
    request.onConnect((err) => {
      if (request.aborted || request.completed) {
        return
      }

      errorRequest$2(client, request, err || new RequestAbortedError$9());

      util$i.destroy(socket, new InformationalError$2('aborted'));
    });
  } catch (err) {
    errorRequest$2(client, request, err);
  }

  if (request.aborted) {
    util$i.destroy(body);
    return false
  }

  if (method === 'HEAD') {
    // https://github.com/mcollina/undici/issues/258
    // Close after a HEAD request to interop with misbehaving servers
    // that may send a body in the response.

    socket[kReset$1] = true;
  }

  if (upgrade || method === 'CONNECT') {
    // On CONNECT or upgrade, block pipeline from dispatching further
    // requests on this connection.

    socket[kReset$1] = true;
  }

  if (reset != null) {
    socket[kReset$1] = reset;
  }

  if (client[kMaxRequests$1] && socket[kCounter$1]++ >= client[kMaxRequests$1]) {
    socket[kReset$1] = true;
  }

  if (blocking) {
    socket[kBlocking] = true;
  }

  let header = `${method} ${path} HTTP/1.1\r\n`;

  if (typeof host === 'string') {
    header += `host: ${host}\r\n`;
  } else {
    header += client[kHostHeader$1];
  }

  if (upgrade) {
    header += `connection: upgrade\r\nupgrade: ${upgrade}\r\n`;
  } else if (client[kPipelining$1] && !socket[kReset$1]) {
    header += 'connection: keep-alive\r\n';
  } else {
    header += 'connection: close\r\n';
  }

  if (Array.isArray(headers)) {
    for (let n = 0; n < headers.length; n += 2) {
      const key = headers[n + 0];
      const val = headers[n + 1];

      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          header += `${key}: ${val[i]}\r\n`;
        }
      } else {
        header += `${key}: ${val}\r\n`;
      }
    }
  }

  if (channels$1.sendHeaders.hasSubscribers) {
    channels$1.sendHeaders.publish({ request, headers: header, socket });
  }

  /* istanbul ignore else: assertion */
  if (!body || bodyLength === 0) {
    if (contentLength === 0) {
      socket.write(`${header}content-length: 0\r\n\r\n`, 'latin1');
    } else {
      assert$8(contentLength === null, 'no body must not have content length');
      socket.write(`${header}\r\n`, 'latin1');
    }
    request.onRequestSent();
  } else if (util$i.isBuffer(body)) {
    assert$8(contentLength === body.byteLength, 'buffer body must have content length');

    socket.cork();
    socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, 'latin1');
    socket.write(body);
    socket.uncork();
    request.onBodySent(body);
    request.onRequestSent();
    if (!expectsPayload) {
      socket[kReset$1] = true;
    }
  } else if (util$i.isBlobLike(body)) {
    if (typeof body.stream === 'function') {
      writeIterable$1({ body: body.stream(), client, request, socket, contentLength, header, expectsPayload });
    } else {
      writeBlob$1({ body, client, request, socket, contentLength, header, expectsPayload });
    }
  } else if (util$i.isStream(body)) {
    writeStream$1({ body, client, request, socket, contentLength, header, expectsPayload });
  } else if (util$i.isIterable(body)) {
    writeIterable$1({ body, client, request, socket, contentLength, header, expectsPayload });
  } else {
    assert$8(false);
  }

  return true
}

function writeStream$1 ({ h2stream, body, client, request, socket, contentLength, header, expectsPayload }) {
  assert$8(contentLength !== 0 || client[kRunning$5] === 0, 'stream body cannot be pipelined');

  let finished = false;

  const writer = new AsyncWriter({ socket, request, contentLength, client, expectsPayload, header });

  const onData = function (chunk) {
    if (finished) {
      return
    }

    try {
      if (!writer.write(chunk) && this.pause) {
        this.pause();
      }
    } catch (err) {
      util$i.destroy(this, err);
    }
  };
  const onDrain = function () {
    if (finished) {
      return
    }

    if (body.resume) {
      body.resume();
    }
  };
  const onClose = function () {
    // 'close' might be emitted *before* 'error' for
    // broken streams. Wait a tick to avoid this case.
    queueMicrotask(() => {
      // It's only safe to remove 'error' listener after
      // 'close'.
      body.removeListener('error', onFinished);
    });

    if (!finished) {
      const err = new RequestAbortedError$9();
      queueMicrotask(() => onFinished(err));
    }
  };
  const onFinished = function (err) {
    if (finished) {
      return
    }

    finished = true;

    assert$8(socket.destroyed || (socket[kWriting] && client[kRunning$5] <= 1));

    socket
      .off('drain', onDrain)
      .off('error', onFinished);

    body
      .removeListener('data', onData)
      .removeListener('end', onFinished)
      .removeListener('close', onClose);

    if (!err) {
      try {
        writer.end();
      } catch (er) {
        err = er;
      }
    }

    writer.destroy(err);

    if (err && (err.code !== 'UND_ERR_INFO' || err.message !== 'reset')) {
      util$i.destroy(body, err);
    } else {
      util$i.destroy(body);
    }
  };

  body
    .on('data', onData)
    .on('end', onFinished)
    .on('error', onFinished)
    .on('close', onClose);

  if (body.resume) {
    body.resume();
  }

  socket
    .on('drain', onDrain)
    .on('error', onFinished);

  if (body.errorEmitted ?? body.errored) {
    setImmediate(() => onFinished(body.errored));
  } else if (body.endEmitted ?? body.readableEnded) {
    setImmediate(() => onFinished(null));
  }

  if (body.closeEmitted ?? body.closed) {
    setImmediate(onClose);
  }
}

async function writeBlob$1 ({ h2stream, body, client, request, socket, contentLength, header, expectsPayload }) {
  assert$8(contentLength === body.size, 'blob body must have content length');

  try {
    if (contentLength != null && contentLength !== body.size) {
      throw new RequestContentLengthMismatchError$1()
    }

    const buffer = Buffer.from(await body.arrayBuffer());

    socket.cork();
    socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, 'latin1');
    socket.write(buffer);
    socket.uncork();

    request.onBodySent(buffer);
    request.onRequestSent();

    if (!expectsPayload) {
      socket[kReset$1] = true;
    }

    client[kResume$3]();
  } catch (err) {
    util$i.destroy(socket, err);
  }
}

async function writeIterable$1 ({ h2stream, body, client, request, socket, contentLength, header, expectsPayload }) {
  assert$8(contentLength !== 0 || client[kRunning$5] === 0, 'iterator body cannot be pipelined');

  let callback = null;
  function onDrain () {
    if (callback) {
      const cb = callback;
      callback = null;
      cb();
    }
  }

  const waitForDrain = () => new Promise((resolve, reject) => {
    assert$8(callback === null);

    if (socket[kError$2]) {
      reject(socket[kError$2]);
    } else {
      callback = resolve;
    }
  });

  socket
    .on('close', onDrain)
    .on('drain', onDrain);

  const writer = new AsyncWriter({ socket, request, contentLength, client, expectsPayload, header });
  try {
    // It's up to the user to somehow abort the async iterable.
    for await (const chunk of body) {
      if (socket[kError$2]) {
        throw socket[kError$2]
      }

      if (!writer.write(chunk)) {
        await waitForDrain();
      }
    }

    writer.end();
  } catch (err) {
    writer.destroy(err);
  } finally {
    socket
      .off('close', onDrain)
      .off('drain', onDrain);
  }
}

class AsyncWriter {
  constructor ({ socket, request, contentLength, client, expectsPayload, header }) {
    this.socket = socket;
    this.request = request;
    this.contentLength = contentLength;
    this.client = client;
    this.bytesWritten = 0;
    this.expectsPayload = expectsPayload;
    this.header = header;

    socket[kWriting] = true;
  }

  write (chunk) {
    const { socket, request, contentLength, client, bytesWritten, expectsPayload, header } = this;

    if (socket[kError$2]) {
      throw socket[kError$2]
    }

    if (socket.destroyed) {
      return false
    }

    const len = Buffer.byteLength(chunk);
    if (!len) {
      return true
    }

    // We should defer writing chunks.
    if (contentLength !== null && bytesWritten + len > contentLength) {
      if (client[kStrictContentLength$2]) {
        throw new RequestContentLengthMismatchError$1()
      }

      process.emitWarning(new RequestContentLengthMismatchError$1());
    }

    socket.cork();

    if (bytesWritten === 0) {
      if (!expectsPayload) {
        socket[kReset$1] = true;
      }

      if (contentLength === null) {
        socket.write(`${header}transfer-encoding: chunked\r\n`, 'latin1');
      } else {
        socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, 'latin1');
      }
    }

    if (contentLength === null) {
      socket.write(`\r\n${len.toString(16)}\r\n`, 'latin1');
    }

    this.bytesWritten += len;

    const ret = socket.write(chunk);

    socket.uncork();

    request.onBodySent(chunk);

    if (!ret) {
      if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
        // istanbul ignore else: only for jest
        if (socket[kParser].timeout.refresh) {
          socket[kParser].timeout.refresh();
        }
      }
    }

    return ret
  }

  end () {
    const { socket, contentLength, client, bytesWritten, expectsPayload, header, request } = this;
    request.onRequestSent();

    socket[kWriting] = false;

    if (socket[kError$2]) {
      throw socket[kError$2]
    }

    if (socket.destroyed) {
      return
    }

    if (bytesWritten === 0) {
      if (expectsPayload) {
        // https://tools.ietf.org/html/rfc7230#section-3.3.2
        // A user agent SHOULD send a Content-Length in a request message when
        // no Transfer-Encoding is sent and the request method defines a meaning
        // for an enclosed payload body.

        socket.write(`${header}content-length: 0\r\n\r\n`, 'latin1');
      } else {
        socket.write(`${header}\r\n`, 'latin1');
      }
    } else if (contentLength === null) {
      socket.write('\r\n0\r\n\r\n', 'latin1');
    }

    if (contentLength !== null && bytesWritten !== contentLength) {
      if (client[kStrictContentLength$2]) {
        throw new RequestContentLengthMismatchError$1()
      } else {
        process.emitWarning(new RequestContentLengthMismatchError$1());
      }
    }

    if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
      // istanbul ignore else: only for jest
      if (socket[kParser].timeout.refresh) {
        socket[kParser].timeout.refresh();
      }
    }

    client[kResume$3]();
  }

  destroy (err) {
    const { socket, client } = this;

    socket[kWriting] = false;

    if (err) {
      assert$8(client[kRunning$5] <= 1, 'pipeline should only contain this request');
      util$i.destroy(socket, err);
    }
  }
}

var clientH1 = connectH1$1;

const assert$7 = require$$0;
const { pipeline: pipeline$2 } = require$$0$1;
const util$h = util$m;
const {
  RequestContentLengthMismatchError,
  RequestAbortedError: RequestAbortedError$8,
  SocketError: SocketError$2,
  InformationalError: InformationalError$1
} = errors$1;
const {
  kUrl: kUrl$4,
  kReset,
  kClient: kClient$2,
  kRunning: kRunning$4,
  kPending: kPending$3,
  kQueue: kQueue$2,
  kPendingIdx: kPendingIdx$1,
  kRunningIdx: kRunningIdx$1,
  kError: kError$1,
  kSocket,
  kStrictContentLength: kStrictContentLength$1,
  kOnError: kOnError$1,
  // HTTP2
  kMaxConcurrentStreams: kMaxConcurrentStreams$1,
  kHTTP2Session,
  kResume: kResume$2
} = symbols$4;

const kOpenStreams = Symbol('open streams');

// Experimental
let h2ExperimentalWarned = false;

/** @type {import('http2')} */
let http2;
try {
  http2 = require('node:http2');
} catch {
  // @ts-ignore
  http2 = { constants: {} };
}

const {
  constants: {
    HTTP2_HEADER_AUTHORITY,
    HTTP2_HEADER_METHOD,
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_SCHEME,
    HTTP2_HEADER_CONTENT_LENGTH,
    HTTP2_HEADER_EXPECT,
    HTTP2_HEADER_STATUS
  }
} = http2;

function parseH2Headers (headers) {
  // set-cookie is always an array. Duplicates are added to the array.
  // For duplicate cookie headers, the values are joined together with '; '.
  headers = Object.entries(headers).flat(2);

  const result = [];

  for (const header of headers) {
    result.push(Buffer.from(header));
  }

  return result
}

async function connectH2$1 (client, socket) {
  client[kSocket] = socket;

  if (!h2ExperimentalWarned) {
    h2ExperimentalWarned = true;
    process.emitWarning('H2 support is experimental, expect them to change at any time.', {
      code: 'UNDICI-H2'
    });
  }

  const session = http2.connect(client[kUrl$4], {
    createConnection: () => socket,
    peerMaxConcurrentStreams: client[kMaxConcurrentStreams$1]
  });

  session[kOpenStreams] = 0;
  session[kClient$2] = client;
  session[kSocket] = socket;
  session.on('error', onHttp2SessionError);
  session.on('frameError', onHttp2FrameError);
  session.on('end', onHttp2SessionEnd);
  session.on('goaway', onHTTP2GoAway);
  session.on('close', function () {
    const { [kClient$2]: client } = this;

    const err = this[kError$1] || new SocketError$2('closed', util$h.getSocketInfo(this));

    client[kSocket] = null;

    assert$7(client[kPending$3] === 0);

    // Fail entire queue.
    const requests = client[kQueue$2].splice(client[kRunningIdx$1]);
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      errorRequest$1(client, request, err);
    }

    client[kPendingIdx$1] = client[kRunningIdx$1];

    assert$7(client[kRunning$4] === 0);

    client.emit('disconnect', client[kUrl$4], [client], err);

    client[kResume$2]();
  });
  session.unref();

  client[kHTTP2Session] = session;
  socket[kHTTP2Session] = session;

  socket.on('error', function (err) {
    assert$7(err.code !== 'ERR_TLS_CERT_ALTNAME_INVALID');

    this[kError$1] = err;

    this[kClient$2][kOnError$1](err);
  });
  socket.on('end', function () {
    util$h.destroy(this, new SocketError$2('other side closed', util$h.getSocketInfo(this)));
  });

  let closed = false;
  socket.on('close', () => {
    closed = true;
  });

  return {
    version: 'h2',
    defaultPipelining: Infinity,
    write (...args) {
      // TODO (fix): return
      writeH2(client, ...args);
    },
    resume () {

    },
    destroy (err, callback) {
      session.destroy(err);
      if (closed) {
        queueMicrotask(callback);
      } else {
        socket.destroy(err).on('close', callback);
      }
    },
    get destroyed () {
      return socket.destroyed
    },
    busy () {
      return false
    }
  }
}

function onHttp2SessionError (err) {
  assert$7(err.code !== 'ERR_TLS_CERT_ALTNAME_INVALID');

  this[kSocket][kError$1] = err;

  this[kClient$2][kOnError$1](err);
}

function onHttp2FrameError (type, code, id) {
  const err = new InformationalError$1(`HTTP/2: "frameError" received - type ${type}, code ${code}`);

  if (id === 0) {
    this[kSocket][kError$1] = err;
    this[kClient$2][kOnError$1](err);
  }
}

function onHttp2SessionEnd () {
  this.destroy(new SocketError$2('other side closed'));
  util$h.destroy(this[kSocket], new SocketError$2('other side closed'));
}

function onHTTP2GoAway (code) {
  const client = this[kClient$2];
  const err = new InformationalError$1(`HTTP/2: "GOAWAY" frame received with code ${code}`);
  client[kSocket] = null;
  client[kHTTP2Session] = null;

  if (client.destroyed) {
    assert$7(this[kPending$3] === 0);

    // Fail entire queue.
    const requests = client[kQueue$2].splice(client[kRunningIdx$1]);
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      errorRequest$1(this, request, err);
    }
  } else if (client[kRunning$4] > 0) {
    // Fail head of pipeline.
    const request = client[kQueue$2][client[kRunningIdx$1]];
    client[kQueue$2][client[kRunningIdx$1]++] = null;

    errorRequest$1(client, request, err);
  }

  client[kPendingIdx$1] = client[kRunningIdx$1];

  assert$7(client[kRunning$4] === 0);

  client.emit('disconnect',
    client[kUrl$4],
    [client],
    err
  );

  client[kResume$2]();
}

function errorRequest$1 (client, request, err) {
  try {
    request.onError(err);
    assert$7(request.aborted);
  } catch (err) {
    client.emit('error', err);
  }
}

// https://www.rfc-editor.org/rfc/rfc7230#section-3.3.2
function shouldSendContentLength (method) {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && method !== 'TRACE' && method !== 'CONNECT'
}

function writeH2 (client, request) {
  const session = client[kHTTP2Session];
  const { body, method, path, host, upgrade, expectContinue, signal, headers: reqHeaders } = request;

  if (upgrade) {
    errorRequest$1(client, request, new Error('Upgrade not supported for H2'));
    return false
  }

  if (request.aborted) {
    return false
  }

  const headers = {};
  for (let n = 0; n < reqHeaders.length; n += 2) {
    const key = reqHeaders[n + 0];
    const val = reqHeaders[n + 1];

    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (headers[key]) {
          headers[key] += `,${val[i]}`;
        } else {
          headers[key] = val[i];
        }
      }
    } else {
      headers[key] = val;
    }
  }

  /** @type {import('node:http2').ClientHttp2Stream} */
  let stream;

  const { hostname, port } = client[kUrl$4];

  headers[HTTP2_HEADER_AUTHORITY] = host || `${hostname}${port ? `:${port}` : ''}`;
  headers[HTTP2_HEADER_METHOD] = method;

  try {
    // We are already connected, streams are pending.
    // We can call on connect, and wait for abort
    request.onConnect((err) => {
      if (request.aborted || request.completed) {
        return
      }

      err = err || new RequestAbortedError$8();

      if (stream != null) {
        util$h.destroy(stream, err);

        session[kOpenStreams] -= 1;
        if (session[kOpenStreams] === 0) {
          session.unref();
        }
      }

      errorRequest$1(client, request, err);
    });
  } catch (err) {
    errorRequest$1(client, request, err);
  }

  if (method === 'CONNECT') {
    session.ref();
    // We are already connected, streams are pending, first request
    // will create a new stream. We trigger a request to create the stream and wait until
    // `ready` event is triggered
    // We disabled endStream to allow the user to write to the stream
    stream = session.request(headers, { endStream: false, signal });

    if (stream.id && !stream.pending) {
      request.onUpgrade(null, null, stream);
      ++session[kOpenStreams];
    } else {
      stream.once('ready', () => {
        request.onUpgrade(null, null, stream);
        ++session[kOpenStreams];
      });
    }

    stream.once('close', () => {
      session[kOpenStreams] -= 1;
      // TODO(HTTP/2): unref only if current streams count is 0
      if (session[kOpenStreams] === 0) session.unref();
    });

    return true
  }

  // https://tools.ietf.org/html/rfc7540#section-8.3
  // :path and :scheme headers must be omitted when sending CONNECT

  headers[HTTP2_HEADER_PATH] = path;
  headers[HTTP2_HEADER_SCHEME] = 'https';

  // https://tools.ietf.org/html/rfc7231#section-4.3.1
  // https://tools.ietf.org/html/rfc7231#section-4.3.2
  // https://tools.ietf.org/html/rfc7231#section-4.3.5

  // Sending a payload body on a request that does not
  // expect it can cause undefined behavior on some
  // servers and corrupt connection state. Do not
  // re-use the connection for further requests.

  const expectsPayload = (
    method === 'PUT' ||
    method === 'POST' ||
    method === 'PATCH'
  );

  if (body && typeof body.read === 'function') {
    // Try to read EOF in order to get length.
    body.read(0);
  }

  let contentLength = util$h.bodyLength(body);

  if (contentLength == null) {
    contentLength = request.contentLength;
  }

  if (contentLength === 0 || !expectsPayload) {
    // https://tools.ietf.org/html/rfc7230#section-3.3.2
    // A user agent SHOULD NOT send a Content-Length header field when
    // the request message does not contain a payload body and the method
    // semantics do not anticipate such a body.

    contentLength = null;
  }

  // https://github.com/nodejs/undici/issues/2046
  // A user agent may send a Content-Length header with 0 value, this should be allowed.
  if (shouldSendContentLength(method) && contentLength > 0 && request.contentLength != null && request.contentLength !== contentLength) {
    if (client[kStrictContentLength$1]) {
      errorRequest$1(client, request, new RequestContentLengthMismatchError());
      return false
    }

    process.emitWarning(new RequestContentLengthMismatchError());
  }

  if (contentLength != null) {
    assert$7(body, 'no body must not have content length');
    headers[HTTP2_HEADER_CONTENT_LENGTH] = `${contentLength}`;
  }

  session.ref();

  const shouldEndStream = method === 'GET' || method === 'HEAD' || body === null;
  if (expectContinue) {
    headers[HTTP2_HEADER_EXPECT] = '100-continue';
    stream = session.request(headers, { endStream: shouldEndStream, signal });

    stream.once('continue', writeBodyH2);
  } else {
    stream = session.request(headers, {
      endStream: shouldEndStream,
      signal
    });
    writeBodyH2();
  }

  // Increment counter as we have new several streams open
  ++session[kOpenStreams];

  stream.once('response', headers => {
    const { [HTTP2_HEADER_STATUS]: statusCode, ...realHeaders } = headers;
    request.onResponseStarted();

    // Due to the stream nature, it is possible we face a race condition
    // where the stream has been assigned, but the request has been aborted
    // the request remains in-flight and headers hasn't been received yet
    // for those scenarios, best effort is to destroy the stream immediately
    // as there's no value to keep it open.
    if (request.aborted || request.completed) {
      const err = new RequestAbortedError$8();
      errorRequest$1(client, request, err);
      util$h.destroy(stream, err);
      return
    }

    if (request.onHeaders(Number(statusCode), parseH2Headers(realHeaders), stream.resume.bind(stream), '') === false) {
      stream.pause();
    }

    stream.on('data', (chunk) => {
      if (request.onData(chunk) === false) {
        stream.pause();
      }
    });
  });

  stream.once('end', () => {
    // When state is null, it means we haven't consumed body and the stream still do not have
    // a state.
    // Present specially when using pipeline or stream
    if (stream.state?.state == null || stream.state.state < 6) {
      request.onComplete([]);
      return
    }

    // Stream is closed or half-closed-remote (6), decrement counter and cleanup
    // It does not have sense to continue working with the stream as we do not
    // have yet RST_STREAM support on client-side
    session[kOpenStreams] -= 1;
    if (session[kOpenStreams] === 0) {
      session.unref();
    }

    const err = new InformationalError$1('HTTP/2: stream half-closed (remote)');
    errorRequest$1(client, request, err);
    util$h.destroy(stream, err);
  });

  stream.once('close', () => {
    session[kOpenStreams] -= 1;
    // TODO(HTTP/2): unref only if current streams count is 0
    if (session[kOpenStreams] === 0) {
      session.unref();
    }
  });

  stream.once('error', function (err) {
    if (client[kHTTP2Session] && !client[kHTTP2Session].destroyed && !this.closed && !this.destroyed) {
      session[kOpenStreams] -= 1;
      util$h.destroy(stream, err);
    }
  });

  stream.once('frameError', (type, code) => {
    const err = new InformationalError$1(`HTTP/2: "frameError" received - type ${type}, code ${code}`);
    errorRequest$1(client, request, err);

    if (client[kHTTP2Session] && !client[kHTTP2Session].destroyed && !this.closed && !this.destroyed) {
      session[kOpenStreams] -= 1;
      util$h.destroy(stream, err);
    }
  });

  // stream.on('aborted', () => {
  //   // TODO(HTTP/2): Support aborted
  // })

  // stream.on('timeout', () => {
  //   // TODO(HTTP/2): Support timeout
  // })

  // stream.on('push', headers => {
  //   // TODO(HTTP/2): Support push
  // })

  // stream.on('trailers', headers => {
  //   // TODO(HTTP/2): Support trailers
  // })

  return true

  function writeBodyH2 () {
    /* istanbul ignore else: assertion */
    if (!body) {
      request.onRequestSent();
    } else if (util$h.isBuffer(body)) {
      assert$7(contentLength === body.byteLength, 'buffer body must have content length');
      stream.cork();
      stream.write(body);
      stream.uncork();
      stream.end();
      request.onBodySent(body);
      request.onRequestSent();
    } else if (util$h.isBlobLike(body)) {
      if (typeof body.stream === 'function') {
        writeIterable({
          client,
          request,
          contentLength,
          h2stream: stream,
          expectsPayload,
          body: body.stream(),
          socket: client[kSocket],
          header: ''
        });
      } else {
        writeBlob({
          body,
          client,
          request,
          contentLength,
          expectsPayload,
          h2stream: stream,
          header: '',
          socket: client[kSocket]
        });
      }
    } else if (util$h.isStream(body)) {
      writeStream({
        body,
        client,
        request,
        contentLength,
        expectsPayload,
        socket: client[kSocket],
        h2stream: stream,
        header: ''
      });
    } else if (util$h.isIterable(body)) {
      writeIterable({
        body,
        client,
        request,
        contentLength,
        expectsPayload,
        header: '',
        h2stream: stream,
        socket: client[kSocket]
      });
    } else {
      assert$7(false);
    }
  }
}

function writeStream ({ h2stream, body, client, request, socket, contentLength, header, expectsPayload }) {
  assert$7(contentLength !== 0 || client[kRunning$4] === 0, 'stream body cannot be pipelined');

  // For HTTP/2, is enough to pipe the stream
  const pipe = pipeline$2(
    body,
    h2stream,
    (err) => {
      if (err) {
        util$h.destroy(body, err);
        util$h.destroy(h2stream, err);
      } else {
        request.onRequestSent();
      }
    }
  );

  pipe.on('data', onPipeData);
  pipe.once('end', () => {
    pipe.removeListener('data', onPipeData);
    util$h.destroy(pipe);
  });

  function onPipeData (chunk) {
    request.onBodySent(chunk);
  }
}

async function writeBlob ({ h2stream, body, client, request, socket, contentLength, header, expectsPayload }) {
  assert$7(contentLength === body.size, 'blob body must have content length');

  try {
    if (contentLength != null && contentLength !== body.size) {
      throw new RequestContentLengthMismatchError()
    }

    const buffer = Buffer.from(await body.arrayBuffer());

    h2stream.cork();
    h2stream.write(buffer);
    h2stream.uncork();

    request.onBodySent(buffer);
    request.onRequestSent();

    if (!expectsPayload) {
      socket[kReset] = true;
    }

    client[kResume$2]();
  } catch (err) {
    util$h.destroy(h2stream);
  }
}

async function writeIterable ({ h2stream, body, client, request, socket, contentLength, header, expectsPayload }) {
  assert$7(contentLength !== 0 || client[kRunning$4] === 0, 'iterator body cannot be pipelined');

  let callback = null;
  function onDrain () {
    if (callback) {
      const cb = callback;
      callback = null;
      cb();
    }
  }

  const waitForDrain = () => new Promise((resolve, reject) => {
    assert$7(callback === null);

    if (socket[kError$1]) {
      reject(socket[kError$1]);
    } else {
      callback = resolve;
    }
  });

  h2stream
    .on('close', onDrain)
    .on('drain', onDrain);

  try {
    // It's up to the user to somehow abort the async iterable.
    for await (const chunk of body) {
      if (socket[kError$1]) {
        throw socket[kError$1]
      }

      const res = h2stream.write(chunk);
      request.onBodySent(chunk);
      if (!res) {
        await waitForDrain();
      }
    }
  } catch (err) {
    h2stream.destroy(err);
  } finally {
    request.onRequestSent();
    h2stream.end();
    h2stream
      .off('close', onDrain)
      .off('drain', onDrain);
  }
}

var clientH2 = connectH2$1;

const util$g = util$m;
const { kBodyUsed } = symbols$4;
const assert$6 = require$$0;
const { InvalidArgumentError: InvalidArgumentError$h } = errors$1;
const EE = require$$0$4;

const redirectableStatusCodes = [300, 301, 302, 303, 307, 308];

const kBody$1 = Symbol('body');

class BodyAsyncIterable {
  constructor (body) {
    this[kBody$1] = body;
    this[kBodyUsed] = false;
  }

  async * [Symbol.asyncIterator] () {
    assert$6(!this[kBodyUsed], 'disturbed');
    this[kBodyUsed] = true;
    yield * this[kBody$1];
  }
}

let RedirectHandler$3 = class RedirectHandler {
  constructor (dispatch, maxRedirections, opts, handler) {
    if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) {
      throw new InvalidArgumentError$h('maxRedirections must be a positive number')
    }

    util$g.validateHandler(handler, opts.method, opts.upgrade);

    this.dispatch = dispatch;
    this.location = null;
    this.abort = null;
    this.opts = { ...opts, maxRedirections: 0 }; // opts must be a copy
    this.maxRedirections = maxRedirections;
    this.handler = handler;
    this.history = [];
    this.redirectionLimitReached = false;

    if (util$g.isStream(this.opts.body)) {
      // TODO (fix): Provide some way for the user to cache the file to e.g. /tmp
      // so that it can be dispatched again?
      // TODO (fix): Do we need 100-expect support to provide a way to do this properly?
      if (util$g.bodyLength(this.opts.body) === 0) {
        this.opts.body
          .on('data', function () {
            assert$6(false);
          });
      }

      if (typeof this.opts.body.readableDidRead !== 'boolean') {
        this.opts.body[kBodyUsed] = false;
        EE.prototype.on.call(this.opts.body, 'data', function () {
          this[kBodyUsed] = true;
        });
      }
    } else if (this.opts.body && typeof this.opts.body.pipeTo === 'function') {
      // TODO (fix): We can't access ReadableStream internal state
      // to determine whether or not it has been disturbed. This is just
      // a workaround.
      this.opts.body = new BodyAsyncIterable(this.opts.body);
    } else if (
      this.opts.body &&
      typeof this.opts.body !== 'string' &&
      !ArrayBuffer.isView(this.opts.body) &&
      util$g.isIterable(this.opts.body)
    ) {
      // TODO: Should we allow re-using iterable if !this.opts.idempotent
      // or through some other flag?
      this.opts.body = new BodyAsyncIterable(this.opts.body);
    }
  }

  onConnect (abort) {
    this.abort = abort;
    this.handler.onConnect(abort, { history: this.history });
  }

  onUpgrade (statusCode, headers, socket) {
    this.handler.onUpgrade(statusCode, headers, socket);
  }

  onError (error) {
    this.handler.onError(error);
  }

  onHeaders (statusCode, headers, resume, statusText) {
    this.location = this.history.length >= this.maxRedirections || util$g.isDisturbed(this.opts.body)
      ? null
      : parseLocation(statusCode, headers);

    if (this.opts.throwOnMaxRedirect && this.history.length >= this.maxRedirections) {
      if (this.request) {
        this.request.abort(new Error('max redirects'));
      }

      this.redirectionLimitReached = true;
      this.abort(new Error('max redirects'));
      return
    }

    if (this.opts.origin) {
      this.history.push(new URL(this.opts.path, this.opts.origin));
    }

    if (!this.location) {
      return this.handler.onHeaders(statusCode, headers, resume, statusText)
    }

    const { origin, pathname, search } = util$g.parseURL(new URL(this.location, this.opts.origin && new URL(this.opts.path, this.opts.origin)));
    const path = search ? `${pathname}${search}` : pathname;

    // Remove headers referring to the original URL.
    // By default it is Host only, unless it's a 303 (see below), which removes also all Content-* headers.
    // https://tools.ietf.org/html/rfc7231#section-6.4
    this.opts.headers = cleanRequestHeaders(this.opts.headers, statusCode === 303, this.opts.origin !== origin);
    this.opts.path = path;
    this.opts.origin = origin;
    this.opts.maxRedirections = 0;
    this.opts.query = null;

    // https://tools.ietf.org/html/rfc7231#section-6.4.4
    // In case of HTTP 303, always replace method to be either HEAD or GET
    if (statusCode === 303 && this.opts.method !== 'HEAD') {
      this.opts.method = 'GET';
      this.opts.body = null;
    }
  }

  onData (chunk) {
    if (this.location) ; else {
      return this.handler.onData(chunk)
    }
  }

  onComplete (trailers) {
    if (this.location) {
      /*
        https://tools.ietf.org/html/rfc7231#section-6.4

        TLDR: undici always ignores 3xx response trailers as they are not expected in case of redirections
        and neither are useful if present.

        See comment on onData method above for more detailed information.
      */

      this.location = null;
      this.abort = null;

      this.dispatch(this.opts, this);
    } else {
      this.handler.onComplete(trailers);
    }
  }

  onBodySent (chunk) {
    if (this.handler.onBodySent) {
      this.handler.onBodySent(chunk);
    }
  }
};

function parseLocation (statusCode, headers) {
  if (redirectableStatusCodes.indexOf(statusCode) === -1) {
    return null
  }

  for (let i = 0; i < headers.length; i += 2) {
    if (headers[i].length === 8 && util$g.headerNameToString(headers[i]) === 'location') {
      return headers[i + 1]
    }
  }
}

// https://tools.ietf.org/html/rfc7231#section-6.4.4
function shouldRemoveHeader (header, removeContent, unknownOrigin) {
  if (header.length === 4) {
    return util$g.headerNameToString(header) === 'host'
  }
  if (removeContent && util$g.headerNameToString(header).startsWith('content-')) {
    return true
  }
  if (unknownOrigin && (header.length === 13 || header.length === 6 || header.length === 19)) {
    const name = util$g.headerNameToString(header);
    return name === 'authorization' || name === 'cookie' || name === 'proxy-authorization'
  }
  return false
}

// https://tools.ietf.org/html/rfc7231#section-6.4
function cleanRequestHeaders (headers, removeContent, unknownOrigin) {
  const ret = [];
  if (Array.isArray(headers)) {
    for (let i = 0; i < headers.length; i += 2) {
      if (!shouldRemoveHeader(headers[i], removeContent, unknownOrigin)) {
        ret.push(headers[i], headers[i + 1]);
      }
    }
  } else if (headers && typeof headers === 'object') {
    for (const key of Object.keys(headers)) {
      if (!shouldRemoveHeader(key, removeContent, unknownOrigin)) {
        ret.push(key, headers[key]);
      }
    }
  } else {
    assert$6(headers == null, 'headers must be an object or an array');
  }
  return ret
}

var redirectHandler = RedirectHandler$3;

const RedirectHandler$2 = redirectHandler;

function createRedirectInterceptor$3 ({ maxRedirections: defaultMaxRedirections }) {
  return (dispatch) => {
    return function Intercept (opts, handler) {
      const { maxRedirections = defaultMaxRedirections } = opts;

      if (!maxRedirections) {
        return dispatch(opts, handler)
      }

      const redirectHandler = new RedirectHandler$2(dispatch, maxRedirections, opts, handler);
      opts = { ...opts, maxRedirections: 0 }; // Stop sub dispatcher from also redirecting.
      return dispatch(opts, redirectHandler)
    }
  }
}

var redirectInterceptor = createRedirectInterceptor$3;

const assert$5 = require$$0;
const net = require$$4;
const http = require$$2;
const util$f = util$m;
const { channels } = diagnostics;
const Request$1 = request$3;
const DispatcherBase$3 = dispatcherBase;
const {
  InvalidArgumentError: InvalidArgumentError$g,
  InformationalError,
  ClientDestroyedError
} = errors$1;
const buildConnector$3 = connect$3;
const {
  kUrl: kUrl$3,
  kServerName,
  kClient: kClient$1,
  kBusy: kBusy$1,
  kConnect,
  kResuming,
  kRunning: kRunning$3,
  kPending: kPending$2,
  kSize: kSize$3,
  kQueue: kQueue$1,
  kConnected: kConnected$4,
  kConnecting,
  kNeedDrain: kNeedDrain$3,
  kKeepAliveDefaultTimeout,
  kHostHeader,
  kPendingIdx,
  kRunningIdx,
  kError,
  kPipelining,
  kKeepAliveTimeoutValue,
  kMaxHeadersSize,
  kKeepAliveMaxTimeout,
  kKeepAliveTimeoutThreshold,
  kHeadersTimeout,
  kBodyTimeout,
  kStrictContentLength,
  kConnector,
  kMaxRedirections: kMaxRedirections$1,
  kMaxRequests,
  kCounter,
  kClose: kClose$5,
  kDestroy: kDestroy$3,
  kDispatch: kDispatch$2,
  kInterceptors: kInterceptors$4,
  kLocalAddress,
  kMaxResponseSize,
  kOnError,
  kHTTPContext,
  kMaxConcurrentStreams,
  kResume: kResume$1
} = symbols$4;
const connectH1 = clientH1;
const connectH2 = clientH2;
let deprecatedInterceptorWarned = false;

const kClosedResolve$1 = Symbol('kClosedResolve');

function getPipelining (client) {
  return client[kPipelining] ?? client[kHTTPContext]?.defaultPipelining ?? 1
}

/**
 * @type {import('../../types/client.js').default}
 */
let Client$4 = class Client extends DispatcherBase$3 {
  /**
   *
   * @param {string|URL} url
   * @param {import('../../types/client.js').Client.Options} options
   */
  constructor (url, {
    interceptors,
    maxHeaderSize,
    headersTimeout,
    socketTimeout,
    requestTimeout,
    connectTimeout,
    bodyTimeout,
    idleTimeout,
    keepAlive,
    keepAliveTimeout,
    maxKeepAliveTimeout,
    keepAliveMaxTimeout,
    keepAliveTimeoutThreshold,
    socketPath,
    pipelining,
    tls,
    strictContentLength,
    maxCachedSessions,
    maxRedirections,
    connect,
    maxRequestsPerClient,
    localAddress,
    maxResponseSize,
    autoSelectFamily,
    autoSelectFamilyAttemptTimeout,
    // h2
    maxConcurrentStreams,
    allowH2
  } = {}) {
    super();

    if (keepAlive !== undefined) {
      throw new InvalidArgumentError$g('unsupported keepAlive, use pipelining=0 instead')
    }

    if (socketTimeout !== undefined) {
      throw new InvalidArgumentError$g('unsupported socketTimeout, use headersTimeout & bodyTimeout instead')
    }

    if (requestTimeout !== undefined) {
      throw new InvalidArgumentError$g('unsupported requestTimeout, use headersTimeout & bodyTimeout instead')
    }

    if (idleTimeout !== undefined) {
      throw new InvalidArgumentError$g('unsupported idleTimeout, use keepAliveTimeout instead')
    }

    if (maxKeepAliveTimeout !== undefined) {
      throw new InvalidArgumentError$g('unsupported maxKeepAliveTimeout, use keepAliveMaxTimeout instead')
    }

    if (maxHeaderSize != null && !Number.isFinite(maxHeaderSize)) {
      throw new InvalidArgumentError$g('invalid maxHeaderSize')
    }

    if (socketPath != null && typeof socketPath !== 'string') {
      throw new InvalidArgumentError$g('invalid socketPath')
    }

    if (connectTimeout != null && (!Number.isFinite(connectTimeout) || connectTimeout < 0)) {
      throw new InvalidArgumentError$g('invalid connectTimeout')
    }

    if (keepAliveTimeout != null && (!Number.isFinite(keepAliveTimeout) || keepAliveTimeout <= 0)) {
      throw new InvalidArgumentError$g('invalid keepAliveTimeout')
    }

    if (keepAliveMaxTimeout != null && (!Number.isFinite(keepAliveMaxTimeout) || keepAliveMaxTimeout <= 0)) {
      throw new InvalidArgumentError$g('invalid keepAliveMaxTimeout')
    }

    if (keepAliveTimeoutThreshold != null && !Number.isFinite(keepAliveTimeoutThreshold)) {
      throw new InvalidArgumentError$g('invalid keepAliveTimeoutThreshold')
    }

    if (headersTimeout != null && (!Number.isInteger(headersTimeout) || headersTimeout < 0)) {
      throw new InvalidArgumentError$g('headersTimeout must be a positive integer or zero')
    }

    if (bodyTimeout != null && (!Number.isInteger(bodyTimeout) || bodyTimeout < 0)) {
      throw new InvalidArgumentError$g('bodyTimeout must be a positive integer or zero')
    }

    if (connect != null && typeof connect !== 'function' && typeof connect !== 'object') {
      throw new InvalidArgumentError$g('connect must be a function or an object')
    }

    if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) {
      throw new InvalidArgumentError$g('maxRedirections must be a positive number')
    }

    if (maxRequestsPerClient != null && (!Number.isInteger(maxRequestsPerClient) || maxRequestsPerClient < 0)) {
      throw new InvalidArgumentError$g('maxRequestsPerClient must be a positive number')
    }

    if (localAddress != null && (typeof localAddress !== 'string' || net.isIP(localAddress) === 0)) {
      throw new InvalidArgumentError$g('localAddress must be valid string IP address')
    }

    if (maxResponseSize != null && (!Number.isInteger(maxResponseSize) || maxResponseSize < -1)) {
      throw new InvalidArgumentError$g('maxResponseSize must be a positive number')
    }

    if (
      autoSelectFamilyAttemptTimeout != null &&
      (!Number.isInteger(autoSelectFamilyAttemptTimeout) || autoSelectFamilyAttemptTimeout < -1)
    ) {
      throw new InvalidArgumentError$g('autoSelectFamilyAttemptTimeout must be a positive number')
    }

    // h2
    if (allowH2 != null && typeof allowH2 !== 'boolean') {
      throw new InvalidArgumentError$g('allowH2 must be a valid boolean value')
    }

    if (maxConcurrentStreams != null && (typeof maxConcurrentStreams !== 'number' || maxConcurrentStreams < 1)) {
      throw new InvalidArgumentError$g('maxConcurrentStreams must be a positive integer, greater than 0')
    }

    if (typeof connect !== 'function') {
      connect = buildConnector$3({
        ...tls,
        maxCachedSessions,
        allowH2,
        socketPath,
        timeout: connectTimeout,
        ...(util$f.nodeHasAutoSelectFamily && autoSelectFamily ? { autoSelectFamily, autoSelectFamilyAttemptTimeout } : undefined),
        ...connect
      });
    }

    if (interceptors?.Client && Array.isArray(interceptors.Client)) {
      this[kInterceptors$4] = interceptors.Client;
      if (!deprecatedInterceptorWarned) {
        deprecatedInterceptorWarned = true;
        process.emitWarning('Client.Options#interceptor is deprecated. Use Dispatcher#compose instead.', {
          code: 'UNDICI-CLIENT-INTERCEPTOR-DEPRECATED'
        });
      }
    } else {
      this[kInterceptors$4] = [createRedirectInterceptor$2({ maxRedirections })];
    }

    this[kUrl$3] = util$f.parseOrigin(url);
    this[kConnector] = connect;
    this[kPipelining] = pipelining != null ? pipelining : 1;
    this[kMaxHeadersSize] = maxHeaderSize || http.maxHeaderSize;
    this[kKeepAliveDefaultTimeout] = keepAliveTimeout == null ? 4e3 : keepAliveTimeout;
    this[kKeepAliveMaxTimeout] = keepAliveMaxTimeout == null ? 600e3 : keepAliveMaxTimeout;
    this[kKeepAliveTimeoutThreshold] = keepAliveTimeoutThreshold == null ? 1e3 : keepAliveTimeoutThreshold;
    this[kKeepAliveTimeoutValue] = this[kKeepAliveDefaultTimeout];
    this[kServerName] = null;
    this[kLocalAddress] = localAddress != null ? localAddress : null;
    this[kResuming] = 0; // 0, idle, 1, scheduled, 2 resuming
    this[kNeedDrain$3] = 0; // 0, idle, 1, scheduled, 2 resuming
    this[kHostHeader] = `host: ${this[kUrl$3].hostname}${this[kUrl$3].port ? `:${this[kUrl$3].port}` : ''}\r\n`;
    this[kBodyTimeout] = bodyTimeout != null ? bodyTimeout : 300e3;
    this[kHeadersTimeout] = headersTimeout != null ? headersTimeout : 300e3;
    this[kStrictContentLength] = strictContentLength == null ? true : strictContentLength;
    this[kMaxRedirections$1] = maxRedirections;
    this[kMaxRequests] = maxRequestsPerClient;
    this[kClosedResolve$1] = null;
    this[kMaxResponseSize] = maxResponseSize > -1 ? maxResponseSize : -1;
    this[kMaxConcurrentStreams] = maxConcurrentStreams != null ? maxConcurrentStreams : 100; // Max peerConcurrentStreams for a Node h2 server
    this[kHTTPContext] = null;

    // kQueue is built up of 3 sections separated by
    // the kRunningIdx and kPendingIdx indices.
    // |   complete   |   running   |   pending   |
    //                ^ kRunningIdx ^ kPendingIdx ^ kQueue.length
    // kRunningIdx points to the first running element.
    // kPendingIdx points to the first pending element.
    // This implements a fast queue with an amortized
    // time of O(1).

    this[kQueue$1] = [];
    this[kRunningIdx] = 0;
    this[kPendingIdx] = 0;

    this[kResume$1] = (sync) => resume(this, sync);
    this[kOnError] = (err) => onError(this, err);
  }

  get pipelining () {
    return this[kPipelining]
  }

  set pipelining (value) {
    this[kPipelining] = value;
    this[kResume$1](true);
  }

  get [kPending$2] () {
    return this[kQueue$1].length - this[kPendingIdx]
  }

  get [kRunning$3] () {
    return this[kPendingIdx] - this[kRunningIdx]
  }

  get [kSize$3] () {
    return this[kQueue$1].length - this[kRunningIdx]
  }

  get [kConnected$4] () {
    return !!this[kHTTPContext] && !this[kConnecting] && !this[kHTTPContext].destroyed
  }

  get [kBusy$1] () {
    return Boolean(
      this[kHTTPContext]?.busy(null) ||
      (this[kSize$3] >= (getPipelining(this) || 1)) ||
      this[kPending$2] > 0
    )
  }

  /* istanbul ignore: only used for test */
  [kConnect] (cb) {
    connect$2(this);
    this.once('connect', cb);
  }

  [kDispatch$2] (opts, handler) {
    const origin = opts.origin || this[kUrl$3].origin;
    const request = new Request$1(origin, opts, handler);

    this[kQueue$1].push(request);
    if (this[kResuming]) ; else if (util$f.bodyLength(request.body) == null && util$f.isIterable(request.body)) {
      // Wait a tick in case stream/iterator is ended in the same tick.
      this[kResuming] = 1;
      queueMicrotask(() => resume(this));
    } else {
      this[kResume$1](true);
    }

    if (this[kResuming] && this[kNeedDrain$3] !== 2 && this[kBusy$1]) {
      this[kNeedDrain$3] = 2;
    }

    return this[kNeedDrain$3] < 2
  }

  async [kClose$5] () {
    // TODO: for H2 we need to gracefully flush the remaining enqueued
    // request and close each stream.
    return new Promise((resolve) => {
      if (this[kSize$3]) {
        this[kClosedResolve$1] = resolve;
      } else {
        resolve(null);
      }
    })
  }

  async [kDestroy$3] (err) {
    return new Promise((resolve) => {
      const requests = this[kQueue$1].splice(this[kPendingIdx]);
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        errorRequest(this, request, err);
      }

      const callback = () => {
        if (this[kClosedResolve$1]) {
          // TODO (fix): Should we error here with ClientDestroyedError?
          this[kClosedResolve$1]();
          this[kClosedResolve$1] = null;
        }
        resolve(null);
      };

      if (this[kHTTPContext]) {
        this[kHTTPContext].destroy(err, callback);
        this[kHTTPContext] = null;
      } else {
        queueMicrotask(callback);
      }

      this[kResume$1]();
    })
  }
};

const createRedirectInterceptor$2 = redirectInterceptor;

function onError (client, err) {
  if (
    client[kRunning$3] === 0 &&
    err.code !== 'UND_ERR_INFO' &&
    err.code !== 'UND_ERR_SOCKET'
  ) {
    // Error is not caused by running request and not a recoverable
    // socket error.

    assert$5(client[kPendingIdx] === client[kRunningIdx]);

    const requests = client[kQueue$1].splice(client[kRunningIdx]);
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      errorRequest(client, request, err);
    }
    assert$5(client[kSize$3] === 0);
  }
}

async function connect$2 (client) {
  assert$5(!client[kConnecting]);
  assert$5(!client[kHTTPContext]);

  let { host, hostname, protocol, port } = client[kUrl$3];

  // Resolve ipv6
  if (hostname[0] === '[') {
    const idx = hostname.indexOf(']');

    assert$5(idx !== -1);
    const ip = hostname.substring(1, idx);

    assert$5(net.isIP(ip));
    hostname = ip;
  }

  client[kConnecting] = true;

  if (channels.beforeConnect.hasSubscribers) {
    channels.beforeConnect.publish({
      connectParams: {
        host,
        hostname,
        protocol,
        port,
        version: client[kHTTPContext]?.version,
        servername: client[kServerName],
        localAddress: client[kLocalAddress]
      },
      connector: client[kConnector]
    });
  }

  try {
    const socket = await new Promise((resolve, reject) => {
      client[kConnector]({
        host,
        hostname,
        protocol,
        port,
        servername: client[kServerName],
        localAddress: client[kLocalAddress]
      }, (err, socket) => {
        if (err) {
          reject(err);
        } else {
          resolve(socket);
        }
      });
    });

    if (client.destroyed) {
      util$f.destroy(socket.on('error', () => {}), new ClientDestroyedError());
      return
    }

    assert$5(socket);

    try {
      client[kHTTPContext] = socket.alpnProtocol === 'h2'
        ? await connectH2(client, socket)
        : await connectH1(client, socket);
    } catch (err) {
      socket.destroy().on('error', () => {});
      throw err
    }

    client[kConnecting] = false;

    socket[kCounter] = 0;
    socket[kMaxRequests] = client[kMaxRequests];
    socket[kClient$1] = client;
    socket[kError] = null;

    if (channels.connected.hasSubscribers) {
      channels.connected.publish({
        connectParams: {
          host,
          hostname,
          protocol,
          port,
          version: client[kHTTPContext]?.version,
          servername: client[kServerName],
          localAddress: client[kLocalAddress]
        },
        connector: client[kConnector],
        socket
      });
    }
    client.emit('connect', client[kUrl$3], [client]);
  } catch (err) {
    if (client.destroyed) {
      return
    }

    client[kConnecting] = false;

    if (channels.connectError.hasSubscribers) {
      channels.connectError.publish({
        connectParams: {
          host,
          hostname,
          protocol,
          port,
          version: client[kHTTPContext]?.version,
          servername: client[kServerName],
          localAddress: client[kLocalAddress]
        },
        connector: client[kConnector],
        error: err
      });
    }

    if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
      assert$5(client[kRunning$3] === 0);
      while (client[kPending$2] > 0 && client[kQueue$1][client[kPendingIdx]].servername === client[kServerName]) {
        const request = client[kQueue$1][client[kPendingIdx]++];
        errorRequest(client, request, err);
      }
    } else {
      onError(client, err);
    }

    client.emit('connectionError', client[kUrl$3], [client], err);
  }

  client[kResume$1]();
}

function emitDrain (client) {
  client[kNeedDrain$3] = 0;
  client.emit('drain', client[kUrl$3], [client]);
}

function resume (client, sync) {
  if (client[kResuming] === 2) {
    return
  }

  client[kResuming] = 2;

  _resume(client, sync);
  client[kResuming] = 0;

  if (client[kRunningIdx] > 256) {
    client[kQueue$1].splice(0, client[kRunningIdx]);
    client[kPendingIdx] -= client[kRunningIdx];
    client[kRunningIdx] = 0;
  }
}

function _resume (client, sync) {
  while (true) {
    if (client.destroyed) {
      assert$5(client[kPending$2] === 0);
      return
    }

    if (client[kClosedResolve$1] && !client[kSize$3]) {
      client[kClosedResolve$1]();
      client[kClosedResolve$1] = null;
      return
    }

    if (client[kHTTPContext]) {
      client[kHTTPContext].resume();
    }

    if (client[kBusy$1]) {
      client[kNeedDrain$3] = 2;
    } else if (client[kNeedDrain$3] === 2) {
      if (sync) {
        client[kNeedDrain$3] = 1;
        queueMicrotask(() => emitDrain(client));
      } else {
        emitDrain(client);
      }
      continue
    }

    if (client[kPending$2] === 0) {
      return
    }

    if (client[kRunning$3] >= (getPipelining(client) || 1)) {
      return
    }

    const request = client[kQueue$1][client[kPendingIdx]];

    if (client[kUrl$3].protocol === 'https:' && client[kServerName] !== request.servername) {
      if (client[kRunning$3] > 0) {
        return
      }

      client[kServerName] = request.servername;
      client[kHTTPContext]?.destroy(new InformationalError('servername changed'));
    }

    if (client[kConnecting]) {
      return
    }

    if (!client[kHTTPContext]) {
      connect$2(client);
      return
    }

    if (client[kHTTPContext].destroyed) {
      return
    }

    if (client[kHTTPContext].busy(request)) {
      return
    }

    if (!request.aborted && client[kHTTPContext].write(request)) {
      client[kPendingIdx]++;
    } else {
      client[kQueue$1].splice(client[kPendingIdx], 1);
    }
  }
}

function errorRequest (client, request, err) {
  try {
    request.onError(err);
    assert$5(request.aborted);
  } catch (err) {
    client.emit('error', err);
  }
}

var client = Client$4;

/* eslint-disable */

// Extracted from node/lib/internal/fixed_queue.js

// Currently optimal queue size, tested on V8 6.0 - 6.6. Must be power of two.
const kSize$2 = 2048;
const kMask = kSize$2 - 1;

// The FixedQueue is implemented as a singly-linked list of fixed-size
// circular buffers. It looks something like this:
//
//  head                                                       tail
//    |                                                          |
//    v                                                          v
// +-----------+ <-----\       +-----------+ <------\         +-----------+
// |  [null]   |        \----- |   next    |         \------- |   next    |
// +-----------+               +-----------+                  +-----------+
// |   item    | <-- bottom    |   item    | <-- bottom       |  [empty]  |
// |   item    |               |   item    |                  |  [empty]  |
// |   item    |               |   item    |                  |  [empty]  |
// |   item    |               |   item    |                  |  [empty]  |
// |   item    |               |   item    |       bottom --> |   item    |
// |   item    |               |   item    |                  |   item    |
// |    ...    |               |    ...    |                  |    ...    |
// |   item    |               |   item    |                  |   item    |
// |   item    |               |   item    |                  |   item    |
// |  [empty]  | <-- top       |   item    |                  |   item    |
// |  [empty]  |               |   item    |                  |   item    |
// |  [empty]  |               |  [empty]  | <-- top  top --> |  [empty]  |
// +-----------+               +-----------+                  +-----------+
//
// Or, if there is only one circular buffer, it looks something
// like either of these:
//
//  head   tail                                 head   tail
//    |     |                                     |     |
//    v     v                                     v     v
// +-----------+                               +-----------+
// |  [null]   |                               |  [null]   |
// +-----------+                               +-----------+
// |  [empty]  |                               |   item    |
// |  [empty]  |                               |   item    |
// |   item    | <-- bottom            top --> |  [empty]  |
// |   item    |                               |  [empty]  |
// |  [empty]  | <-- top            bottom --> |   item    |
// |  [empty]  |                               |   item    |
// +-----------+                               +-----------+
//
// Adding a value means moving `top` forward by one, removing means
// moving `bottom` forward by one. After reaching the end, the queue
// wraps around.
//
// When `top === bottom` the current queue is empty and when
// `top + 1 === bottom` it's full. This wastes a single space of storage
// but allows much quicker checks.

class FixedCircularBuffer {
  constructor() {
    this.bottom = 0;
    this.top = 0;
    this.list = new Array(kSize$2);
    this.next = null;
  }

  isEmpty() {
    return this.top === this.bottom;
  }

  isFull() {
    return ((this.top + 1) & kMask) === this.bottom;
  }

  push(data) {
    this.list[this.top] = data;
    this.top = (this.top + 1) & kMask;
  }

  shift() {
    const nextItem = this.list[this.bottom];
    if (nextItem === undefined)
      return null;
    this.list[this.bottom] = undefined;
    this.bottom = (this.bottom + 1) & kMask;
    return nextItem;
  }
}

var fixedQueue = class FixedQueue {
  constructor() {
    this.head = this.tail = new FixedCircularBuffer();
  }

  isEmpty() {
    return this.head.isEmpty();
  }

  push(data) {
    if (this.head.isFull()) {
      // Head is full: Creates a new queue, sets the old queue's `.next` to it,
      // and sets it as the new main queue.
      this.head = this.head.next = new FixedCircularBuffer();
    }
    this.head.push(data);
  }

  shift() {
    const tail = this.tail;
    const next = tail.shift();
    if (tail.isEmpty() && tail.next !== null) {
      // If there is another queue, it forms the new tail.
      this.tail = tail.next;
    }
    return next;
  }
};

const { kFree: kFree$1, kConnected: kConnected$3, kPending: kPending$1, kQueued: kQueued$1, kRunning: kRunning$2, kSize: kSize$1 } = symbols$4;
const kPool = Symbol('pool');

let PoolStats$1 = class PoolStats {
  constructor (pool) {
    this[kPool] = pool;
  }

  get connected () {
    return this[kPool][kConnected$3]
  }

  get free () {
    return this[kPool][kFree$1]
  }

  get pending () {
    return this[kPool][kPending$1]
  }

  get queued () {
    return this[kPool][kQueued$1]
  }

  get running () {
    return this[kPool][kRunning$2]
  }

  get size () {
    return this[kPool][kSize$1]
  }
};

var poolStats = PoolStats$1;

const DispatcherBase$2 = dispatcherBase;
const FixedQueue = fixedQueue;
const { kConnected: kConnected$2, kSize, kRunning: kRunning$1, kPending, kQueued, kBusy, kFree, kUrl: kUrl$2, kClose: kClose$4, kDestroy: kDestroy$2, kDispatch: kDispatch$1 } = symbols$4;
const PoolStats = poolStats;

const kClients$4 = Symbol('clients');
const kNeedDrain$2 = Symbol('needDrain');
const kQueue = Symbol('queue');
const kClosedResolve = Symbol('closed resolve');
const kOnDrain$1 = Symbol('onDrain');
const kOnConnect$1 = Symbol('onConnect');
const kOnDisconnect$1 = Symbol('onDisconnect');
const kOnConnectionError$1 = Symbol('onConnectionError');
const kGetDispatcher$2 = Symbol('get dispatcher');
const kAddClient$2 = Symbol('add client');
const kRemoveClient$1 = Symbol('remove client');
const kStats = Symbol('stats');

let PoolBase$2 = class PoolBase extends DispatcherBase$2 {
  constructor () {
    super();

    this[kQueue] = new FixedQueue();
    this[kClients$4] = [];
    this[kQueued] = 0;

    const pool = this;

    this[kOnDrain$1] = function onDrain (origin, targets) {
      const queue = pool[kQueue];

      let needDrain = false;

      while (!needDrain) {
        const item = queue.shift();
        if (!item) {
          break
        }
        pool[kQueued]--;
        needDrain = !this.dispatch(item.opts, item.handler);
      }

      this[kNeedDrain$2] = needDrain;

      if (!this[kNeedDrain$2] && pool[kNeedDrain$2]) {
        pool[kNeedDrain$2] = false;
        pool.emit('drain', origin, [pool, ...targets]);
      }

      if (pool[kClosedResolve] && queue.isEmpty()) {
        Promise
          .all(pool[kClients$4].map(c => c.close()))
          .then(pool[kClosedResolve]);
      }
    };

    this[kOnConnect$1] = (origin, targets) => {
      pool.emit('connect', origin, [pool, ...targets]);
    };

    this[kOnDisconnect$1] = (origin, targets, err) => {
      pool.emit('disconnect', origin, [pool, ...targets], err);
    };

    this[kOnConnectionError$1] = (origin, targets, err) => {
      pool.emit('connectionError', origin, [pool, ...targets], err);
    };

    this[kStats] = new PoolStats(this);
  }

  get [kBusy] () {
    return this[kNeedDrain$2]
  }

  get [kConnected$2] () {
    return this[kClients$4].filter(client => client[kConnected$2]).length
  }

  get [kFree] () {
    return this[kClients$4].filter(client => client[kConnected$2] && !client[kNeedDrain$2]).length
  }

  get [kPending] () {
    let ret = this[kQueued];
    for (const { [kPending]: pending } of this[kClients$4]) {
      ret += pending;
    }
    return ret
  }

  get [kRunning$1] () {
    let ret = 0;
    for (const { [kRunning$1]: running } of this[kClients$4]) {
      ret += running;
    }
    return ret
  }

  get [kSize] () {
    let ret = this[kQueued];
    for (const { [kSize]: size } of this[kClients$4]) {
      ret += size;
    }
    return ret
  }

  get stats () {
    return this[kStats]
  }

  async [kClose$4] () {
    if (this[kQueue].isEmpty()) {
      return Promise.all(this[kClients$4].map(c => c.close()))
    } else {
      return new Promise((resolve) => {
        this[kClosedResolve] = resolve;
      })
    }
  }

  async [kDestroy$2] (err) {
    while (true) {
      const item = this[kQueue].shift();
      if (!item) {
        break
      }
      item.handler.onError(err);
    }

    return Promise.all(this[kClients$4].map(c => c.destroy(err)))
  }

  [kDispatch$1] (opts, handler) {
    const dispatcher = this[kGetDispatcher$2]();

    if (!dispatcher) {
      this[kNeedDrain$2] = true;
      this[kQueue].push({ opts, handler });
      this[kQueued]++;
    } else if (!dispatcher.dispatch(opts, handler)) {
      dispatcher[kNeedDrain$2] = true;
      this[kNeedDrain$2] = !this[kGetDispatcher$2]();
    }

    return !this[kNeedDrain$2]
  }

  [kAddClient$2] (client) {
    client
      .on('drain', this[kOnDrain$1])
      .on('connect', this[kOnConnect$1])
      .on('disconnect', this[kOnDisconnect$1])
      .on('connectionError', this[kOnConnectionError$1]);

    this[kClients$4].push(client);

    if (this[kNeedDrain$2]) {
      queueMicrotask(() => {
        if (this[kNeedDrain$2]) {
          this[kOnDrain$1](client[kUrl$2], [this, client]);
        }
      });
    }

    return this
  }

  [kRemoveClient$1] (client) {
    client.close(() => {
      const idx = this[kClients$4].indexOf(client);
      if (idx !== -1) {
        this[kClients$4].splice(idx, 1);
      }
    });

    this[kNeedDrain$2] = this[kClients$4].some(dispatcher => (
      !dispatcher[kNeedDrain$2] &&
      dispatcher.closed !== true &&
      dispatcher.destroyed !== true
    ));
  }
};

var poolBase = {
  PoolBase: PoolBase$2,
  kClients: kClients$4,
  kNeedDrain: kNeedDrain$2,
  kAddClient: kAddClient$2,
  kRemoveClient: kRemoveClient$1,
  kGetDispatcher: kGetDispatcher$2
};

const {
  PoolBase: PoolBase$1,
  kClients: kClients$3,
  kNeedDrain: kNeedDrain$1,
  kAddClient: kAddClient$1,
  kGetDispatcher: kGetDispatcher$1
} = poolBase;
const Client$3 = client;
const {
  InvalidArgumentError: InvalidArgumentError$f
} = errors$1;
const util$e = util$m;
const { kUrl: kUrl$1, kInterceptors: kInterceptors$3 } = symbols$4;
const buildConnector$2 = connect$3;

const kOptions$3 = Symbol('options');
const kConnections = Symbol('connections');
const kFactory$3 = Symbol('factory');

function defaultFactory$3 (origin, opts) {
  return new Client$3(origin, opts)
}

let Pool$5 = class Pool extends PoolBase$1 {
  constructor (origin, {
    connections,
    factory = defaultFactory$3,
    connect,
    connectTimeout,
    tls,
    maxCachedSessions,
    socketPath,
    autoSelectFamily,
    autoSelectFamilyAttemptTimeout,
    allowH2,
    ...options
  } = {}) {
    super();

    if (connections != null && (!Number.isFinite(connections) || connections < 0)) {
      throw new InvalidArgumentError$f('invalid connections')
    }

    if (typeof factory !== 'function') {
      throw new InvalidArgumentError$f('factory must be a function.')
    }

    if (connect != null && typeof connect !== 'function' && typeof connect !== 'object') {
      throw new InvalidArgumentError$f('connect must be a function or an object')
    }

    if (typeof connect !== 'function') {
      connect = buildConnector$2({
        ...tls,
        maxCachedSessions,
        allowH2,
        socketPath,
        timeout: connectTimeout,
        ...(util$e.nodeHasAutoSelectFamily && autoSelectFamily ? { autoSelectFamily, autoSelectFamilyAttemptTimeout } : undefined),
        ...connect
      });
    }

    this[kInterceptors$3] = options.interceptors?.Pool && Array.isArray(options.interceptors.Pool)
      ? options.interceptors.Pool
      : [];
    this[kConnections] = connections || null;
    this[kUrl$1] = util$e.parseOrigin(origin);
    this[kOptions$3] = { ...util$e.deepClone(options), connect, allowH2 };
    this[kOptions$3].interceptors = options.interceptors
      ? { ...options.interceptors }
      : undefined;
    this[kFactory$3] = factory;
  }

  [kGetDispatcher$1] () {
    for (const client of this[kClients$3]) {
      if (!client[kNeedDrain$1]) {
        return client
      }
    }

    if (!this[kConnections] || this[kClients$3].length < this[kConnections]) {
      const dispatcher = this[kFactory$3](this[kUrl$1], this[kOptions$3]);
      this[kAddClient$1](dispatcher);
      return dispatcher
    }
  }
};

var pool = Pool$5;

const {
  BalancedPoolMissingUpstreamError,
  InvalidArgumentError: InvalidArgumentError$e
} = errors$1;
const {
  PoolBase,
  kClients: kClients$2,
  kNeedDrain,
  kAddClient,
  kRemoveClient,
  kGetDispatcher
} = poolBase;
const Pool$4 = pool;
const { kUrl, kInterceptors: kInterceptors$2 } = symbols$4;
const { parseOrigin } = util$m;
const kFactory$2 = Symbol('factory');

const kOptions$2 = Symbol('options');
const kGreatestCommonDivisor = Symbol('kGreatestCommonDivisor');
const kCurrentWeight = Symbol('kCurrentWeight');
const kIndex = Symbol('kIndex');
const kWeight = Symbol('kWeight');
const kMaxWeightPerServer = Symbol('kMaxWeightPerServer');
const kErrorPenalty = Symbol('kErrorPenalty');

function getGreatestCommonDivisor (a, b) {
  if (b === 0) return a
  return getGreatestCommonDivisor(b, a % b)
}

function defaultFactory$2 (origin, opts) {
  return new Pool$4(origin, opts)
}

let BalancedPool$1 = class BalancedPool extends PoolBase {
  constructor (upstreams = [], { factory = defaultFactory$2, ...opts } = {}) {
    super();

    this[kOptions$2] = opts;
    this[kIndex] = -1;
    this[kCurrentWeight] = 0;

    this[kMaxWeightPerServer] = this[kOptions$2].maxWeightPerServer || 100;
    this[kErrorPenalty] = this[kOptions$2].errorPenalty || 15;

    if (!Array.isArray(upstreams)) {
      upstreams = [upstreams];
    }

    if (typeof factory !== 'function') {
      throw new InvalidArgumentError$e('factory must be a function.')
    }

    this[kInterceptors$2] = opts.interceptors?.BalancedPool && Array.isArray(opts.interceptors.BalancedPool)
      ? opts.interceptors.BalancedPool
      : [];
    this[kFactory$2] = factory;

    for (const upstream of upstreams) {
      this.addUpstream(upstream);
    }
    this._updateBalancedPoolStats();
  }

  addUpstream (upstream) {
    const upstreamOrigin = parseOrigin(upstream).origin;

    if (this[kClients$2].find((pool) => (
      pool[kUrl].origin === upstreamOrigin &&
      pool.closed !== true &&
      pool.destroyed !== true
    ))) {
      return this
    }
    const pool = this[kFactory$2](upstreamOrigin, Object.assign({}, this[kOptions$2]));

    this[kAddClient](pool);
    pool.on('connect', () => {
      pool[kWeight] = Math.min(this[kMaxWeightPerServer], pool[kWeight] + this[kErrorPenalty]);
    });

    pool.on('connectionError', () => {
      pool[kWeight] = Math.max(1, pool[kWeight] - this[kErrorPenalty]);
      this._updateBalancedPoolStats();
    });

    pool.on('disconnect', (...args) => {
      const err = args[2];
      if (err && err.code === 'UND_ERR_SOCKET') {
        // decrease the weight of the pool.
        pool[kWeight] = Math.max(1, pool[kWeight] - this[kErrorPenalty]);
        this._updateBalancedPoolStats();
      }
    });

    for (const client of this[kClients$2]) {
      client[kWeight] = this[kMaxWeightPerServer];
    }

    this._updateBalancedPoolStats();

    return this
  }

  _updateBalancedPoolStats () {
    this[kGreatestCommonDivisor] = this[kClients$2].map(p => p[kWeight]).reduce(getGreatestCommonDivisor, 0);
  }

  removeUpstream (upstream) {
    const upstreamOrigin = parseOrigin(upstream).origin;

    const pool = this[kClients$2].find((pool) => (
      pool[kUrl].origin === upstreamOrigin &&
      pool.closed !== true &&
      pool.destroyed !== true
    ));

    if (pool) {
      this[kRemoveClient](pool);
    }

    return this
  }

  get upstreams () {
    return this[kClients$2]
      .filter(dispatcher => dispatcher.closed !== true && dispatcher.destroyed !== true)
      .map((p) => p[kUrl].origin)
  }

  [kGetDispatcher] () {
    // We validate that pools is greater than 0,
    // otherwise we would have to wait until an upstream
    // is added, which might never happen.
    if (this[kClients$2].length === 0) {
      throw new BalancedPoolMissingUpstreamError()
    }

    const dispatcher = this[kClients$2].find(dispatcher => (
      !dispatcher[kNeedDrain] &&
      dispatcher.closed !== true &&
      dispatcher.destroyed !== true
    ));

    if (!dispatcher) {
      return
    }

    const allClientsBusy = this[kClients$2].map(pool => pool[kNeedDrain]).reduce((a, b) => a && b, true);

    if (allClientsBusy) {
      return
    }

    let counter = 0;

    let maxWeightIndex = this[kClients$2].findIndex(pool => !pool[kNeedDrain]);

    while (counter++ < this[kClients$2].length) {
      this[kIndex] = (this[kIndex] + 1) % this[kClients$2].length;
      const pool = this[kClients$2][this[kIndex]];

      // find pool index with the largest weight
      if (pool[kWeight] > this[kClients$2][maxWeightIndex][kWeight] && !pool[kNeedDrain]) {
        maxWeightIndex = this[kIndex];
      }

      // decrease the current weight every `this[kClients].length`.
      if (this[kIndex] === 0) {
        // Set the current weight to the next lower weight.
        this[kCurrentWeight] = this[kCurrentWeight] - this[kGreatestCommonDivisor];

        if (this[kCurrentWeight] <= 0) {
          this[kCurrentWeight] = this[kMaxWeightPerServer];
        }
      }
      if (pool[kWeight] >= this[kCurrentWeight] && (!pool[kNeedDrain])) {
        return pool
      }
    }

    this[kCurrentWeight] = this[kClients$2][maxWeightIndex][kWeight];
    this[kIndex] = maxWeightIndex;
    return this[kClients$2][maxWeightIndex]
  }
};

var balancedPool = BalancedPool$1;

const { InvalidArgumentError: InvalidArgumentError$d } = errors$1;
const { kClients: kClients$1, kRunning, kClose: kClose$3, kDestroy: kDestroy$1, kDispatch, kInterceptors: kInterceptors$1 } = symbols$4;
const DispatcherBase$1 = dispatcherBase;
const Pool$3 = pool;
const Client$2 = client;
const util$d = util$m;
const createRedirectInterceptor$1 = redirectInterceptor;

const kOnConnect = Symbol('onConnect');
const kOnDisconnect = Symbol('onDisconnect');
const kOnConnectionError = Symbol('onConnectionError');
const kMaxRedirections = Symbol('maxRedirections');
const kOnDrain = Symbol('onDrain');
const kFactory$1 = Symbol('factory');
const kOptions$1 = Symbol('options');

function defaultFactory$1 (origin, opts) {
  return opts && opts.connections === 1
    ? new Client$2(origin, opts)
    : new Pool$3(origin, opts)
}

let Agent$4 = class Agent extends DispatcherBase$1 {
  constructor ({ factory = defaultFactory$1, maxRedirections = 0, connect, ...options } = {}) {
    super();

    if (typeof factory !== 'function') {
      throw new InvalidArgumentError$d('factory must be a function.')
    }

    if (connect != null && typeof connect !== 'function' && typeof connect !== 'object') {
      throw new InvalidArgumentError$d('connect must be a function or an object')
    }

    if (!Number.isInteger(maxRedirections) || maxRedirections < 0) {
      throw new InvalidArgumentError$d('maxRedirections must be a positive number')
    }

    if (connect && typeof connect !== 'function') {
      connect = { ...connect };
    }

    this[kInterceptors$1] = options.interceptors?.Agent && Array.isArray(options.interceptors.Agent)
      ? options.interceptors.Agent
      : [createRedirectInterceptor$1({ maxRedirections })];

    this[kOptions$1] = { ...util$d.deepClone(options), connect };
    this[kOptions$1].interceptors = options.interceptors
      ? { ...options.interceptors }
      : undefined;
    this[kMaxRedirections] = maxRedirections;
    this[kFactory$1] = factory;
    this[kClients$1] = new Map();

    this[kOnDrain] = (origin, targets) => {
      this.emit('drain', origin, [this, ...targets]);
    };

    this[kOnConnect] = (origin, targets) => {
      this.emit('connect', origin, [this, ...targets]);
    };

    this[kOnDisconnect] = (origin, targets, err) => {
      this.emit('disconnect', origin, [this, ...targets], err);
    };

    this[kOnConnectionError] = (origin, targets, err) => {
      this.emit('connectionError', origin, [this, ...targets], err);
    };
  }

  get [kRunning] () {
    let ret = 0;
    for (const client of this[kClients$1].values()) {
      ret += client[kRunning];
    }
    return ret
  }

  [kDispatch] (opts, handler) {
    let key;
    if (opts.origin && (typeof opts.origin === 'string' || opts.origin instanceof URL)) {
      key = String(opts.origin);
    } else {
      throw new InvalidArgumentError$d('opts.origin must be a non-empty string or URL.')
    }

    let dispatcher = this[kClients$1].get(key);

    if (!dispatcher) {
      dispatcher = this[kFactory$1](opts.origin, this[kOptions$1])
        .on('drain', this[kOnDrain])
        .on('connect', this[kOnConnect])
        .on('disconnect', this[kOnDisconnect])
        .on('connectionError', this[kOnConnectionError]);

      // This introduces a tiny memory leak, as dispatchers are never removed from the map.
      // TODO(mcollina): remove te timer when the client/pool do not have any more
      // active connections.
      this[kClients$1].set(key, dispatcher);
    }

    return dispatcher.dispatch(opts, handler)
  }

  async [kClose$3] () {
    const closePromises = [];
    for (const client of this[kClients$1].values()) {
      closePromises.push(client.close());
    }
    this[kClients$1].clear();

    await Promise.all(closePromises);
  }

  async [kDestroy$1] (err) {
    const destroyPromises = [];
    for (const client of this[kClients$1].values()) {
      destroyPromises.push(client.destroy(err));
    }
    this[kClients$1].clear();

    await Promise.all(destroyPromises);
  }
};

var agent = Agent$4;

const { kProxy, kClose: kClose$2, kDestroy, kInterceptors } = symbols$4;
const { URL: URL$1 } = require$$1$1;
const Agent$3 = agent;
const Pool$2 = pool;
const DispatcherBase = dispatcherBase;
const { InvalidArgumentError: InvalidArgumentError$c, RequestAbortedError: RequestAbortedError$7, SecureProxyConnectionError } = errors$1;
const buildConnector$1 = connect$3;

const kAgent$1 = Symbol('proxy agent');
const kClient = Symbol('proxy client');
const kProxyHeaders = Symbol('proxy headers');
const kRequestTls = Symbol('request tls settings');
const kProxyTls = Symbol('proxy tls settings');
const kConnectEndpoint = Symbol('connect endpoint function');

function defaultProtocolPort (protocol) {
  return protocol === 'https:' ? 443 : 80
}

function defaultFactory (origin, opts) {
  return new Pool$2(origin, opts)
}

let ProxyAgent$1 = class ProxyAgent extends DispatcherBase {
  constructor (opts) {
    super();

    if (!opts || (typeof opts === 'object' && !(opts instanceof URL$1) && !opts.uri)) {
      throw new InvalidArgumentError$c('Proxy uri is mandatory')
    }

    const { clientFactory = defaultFactory } = opts;
    if (typeof clientFactory !== 'function') {
      throw new InvalidArgumentError$c('Proxy opts.clientFactory must be a function.')
    }

    const url = this.#getUrl(opts);
    const { href, origin, port, protocol, username, password, hostname: proxyHostname } = url;

    this[kProxy] = { uri: href, protocol };
    this[kInterceptors] = opts.interceptors?.ProxyAgent && Array.isArray(opts.interceptors.ProxyAgent)
      ? opts.interceptors.ProxyAgent
      : [];
    this[kRequestTls] = opts.requestTls;
    this[kProxyTls] = opts.proxyTls;
    this[kProxyHeaders] = opts.headers || {};

    if (opts.auth && opts.token) {
      throw new InvalidArgumentError$c('opts.auth cannot be used in combination with opts.token')
    } else if (opts.auth) {
      /* @deprecated in favour of opts.token */
      this[kProxyHeaders]['proxy-authorization'] = `Basic ${opts.auth}`;
    } else if (opts.token) {
      this[kProxyHeaders]['proxy-authorization'] = opts.token;
    } else if (username && password) {
      this[kProxyHeaders]['proxy-authorization'] = `Basic ${Buffer.from(`${decodeURIComponent(username)}:${decodeURIComponent(password)}`).toString('base64')}`;
    }

    const connect = buildConnector$1({ ...opts.proxyTls });
    this[kConnectEndpoint] = buildConnector$1({ ...opts.requestTls });
    this[kClient] = clientFactory(url, { connect });
    this[kAgent$1] = new Agent$3({
      ...opts,
      connect: async (opts, callback) => {
        let requestedHost = opts.host;
        if (!opts.port) {
          requestedHost += `:${defaultProtocolPort(opts.protocol)}`;
        }
        try {
          const { socket, statusCode } = await this[kClient].connect({
            origin,
            port,
            path: requestedHost,
            signal: opts.signal,
            headers: {
              ...this[kProxyHeaders],
              host: requestedHost
            },
            servername: this[kProxyTls]?.servername || proxyHostname
          });
          if (statusCode !== 200) {
            socket.on('error', () => {}).destroy();
            callback(new RequestAbortedError$7(`Proxy response (${statusCode}) !== 200 when HTTP Tunneling`));
          }
          if (opts.protocol !== 'https:') {
            callback(null, socket);
            return
          }
          let servername;
          if (this[kRequestTls]) {
            servername = this[kRequestTls].servername;
          } else {
            servername = opts.servername;
          }
          this[kConnectEndpoint]({ ...opts, servername, httpSocket: socket }, callback);
        } catch (err) {
          if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
            // Throw a custom error to avoid loop in client.js#connect
            callback(new SecureProxyConnectionError(err));
          } else {
            callback(err);
          }
        }
      }
    });
  }

  dispatch (opts, handler) {
    const { host } = new URL$1(opts.origin);
    const headers = buildHeaders(opts.headers);
    throwIfProxyAuthIsSent(headers);
    return this[kAgent$1].dispatch(
      {
        ...opts,
        headers: {
          ...headers,
          host
        }
      },
      handler
    )
  }

  /**
   * @param {import('../types/proxy-agent').ProxyAgent.Options | string | URL} opts
   * @returns {URL}
   */
  #getUrl (opts) {
    if (typeof opts === 'string') {
      return new URL$1(opts)
    } else if (opts instanceof URL$1) {
      return opts
    } else {
      return new URL$1(opts.uri)
    }
  }

  async [kClose$2] () {
    await this[kAgent$1].close();
    await this[kClient].close();
  }

  async [kDestroy] () {
    await this[kAgent$1].destroy();
    await this[kClient].destroy();
  }
};

/**
 * @param {string[] | Record<string, string>} headers
 * @returns {Record<string, string>}
 */
function buildHeaders (headers) {
  // When using undici.fetch, the headers list is stored
  // as an array.
  if (Array.isArray(headers)) {
    /** @type {Record<string, string>} */
    const headersPair = {};

    for (let i = 0; i < headers.length; i += 2) {
      headersPair[headers[i]] = headers[i + 1];
    }

    return headersPair
  }

  return headers
}

/**
 * @param {Record<string, string>} headers
 *
 * Previous versions of ProxyAgent suggests the Proxy-Authorization in request headers
 * Nevertheless, it was changed and to avoid a security vulnerability by end users
 * this check was created.
 * It should be removed in the next major version for performance reasons
 */
function throwIfProxyAuthIsSent (headers) {
  const existProxyAuth = headers && Object.keys(headers)
    .find((key) => key.toLowerCase() === 'proxy-authorization');
  if (existProxyAuth) {
    throw new InvalidArgumentError$c('Proxy-Authorization should be sent in ProxyAgent constructor')
  }
}

var proxyAgent = ProxyAgent$1;

const assert$4 = require$$0;

const { kRetryHandlerDefaultRetry } = symbols$4;
const { RequestRetryError } = errors$1;
const { isDisturbed, parseHeaders, parseRangeHeader } = util$m;

function calculateRetryAfterHeader (retryAfter) {
  const current = Date.now();
  const diff = new Date(retryAfter).getTime() - current;

  return diff
}

let RetryHandler$3 = class RetryHandler {
  constructor (opts, handlers) {
    const { retryOptions, ...dispatchOpts } = opts;
    const {
      // Retry scoped
      retry: retryFn,
      maxRetries,
      maxTimeout,
      minTimeout,
      timeoutFactor,
      // Response scoped
      methods,
      errorCodes,
      retryAfter,
      statusCodes
    } = retryOptions ?? {};

    this.dispatch = handlers.dispatch;
    this.handler = handlers.handler;
    this.opts = dispatchOpts;
    this.abort = null;
    this.aborted = false;
    this.retryOpts = {
      retry: retryFn ?? RetryHandler[kRetryHandlerDefaultRetry],
      retryAfter: retryAfter ?? true,
      maxTimeout: maxTimeout ?? 30 * 1000, // 30s,
      minTimeout: minTimeout ?? 500, // .5s
      timeoutFactor: timeoutFactor ?? 2,
      maxRetries: maxRetries ?? 5,
      // What errors we should retry
      methods: methods ?? ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'TRACE'],
      // Indicates which errors to retry
      statusCodes: statusCodes ?? [500, 502, 503, 504, 429],
      // List of errors to retry
      errorCodes: errorCodes ?? [
        'ECONNRESET',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ENETDOWN',
        'ENETUNREACH',
        'EHOSTDOWN',
        'EHOSTUNREACH',
        'EPIPE',
        'UND_ERR_SOCKET'
      ]
    };

    this.retryCount = 0;
    this.retryCountCheckpoint = 0;
    this.start = 0;
    this.end = null;
    this.etag = null;
    this.resume = null;

    // Handle possible onConnect duplication
    this.handler.onConnect(reason => {
      this.aborted = true;
      if (this.abort) {
        this.abort(reason);
      } else {
        this.reason = reason;
      }
    });
  }

  onRequestSent () {
    if (this.handler.onRequestSent) {
      this.handler.onRequestSent();
    }
  }

  onUpgrade (statusCode, headers, socket) {
    if (this.handler.onUpgrade) {
      this.handler.onUpgrade(statusCode, headers, socket);
    }
  }

  onConnect (abort) {
    if (this.aborted) {
      abort(this.reason);
    } else {
      this.abort = abort;
    }
  }

  onBodySent (chunk) {
    if (this.handler.onBodySent) return this.handler.onBodySent(chunk)
  }

  static [kRetryHandlerDefaultRetry] (err, { state, opts }, cb) {
    const { statusCode, code, headers } = err;
    const { method, retryOptions } = opts;
    const {
      maxRetries,
      minTimeout,
      maxTimeout,
      timeoutFactor,
      statusCodes,
      errorCodes,
      methods
    } = retryOptions;
    const { counter } = state;

    // Any code that is not a Undici's originated and allowed to retry
    if (
      code &&
      code !== 'UND_ERR_REQ_RETRY' &&
      !errorCodes.includes(code)
    ) {
      cb(err);
      return
    }

    // If a set of method are provided and the current method is not in the list
    if (Array.isArray(methods) && !methods.includes(method)) {
      cb(err);
      return
    }

    // If a set of status code are provided and the current status code is not in the list
    if (
      statusCode != null &&
      Array.isArray(statusCodes) &&
      !statusCodes.includes(statusCode)
    ) {
      cb(err);
      return
    }

    // If we reached the max number of retries
    if (counter > maxRetries) {
      cb(err);
      return
    }

    let retryAfterHeader = headers?.['retry-after'];
    if (retryAfterHeader) {
      retryAfterHeader = Number(retryAfterHeader);
      retryAfterHeader = Number.isNaN(retryAfterHeader)
        ? calculateRetryAfterHeader(retryAfterHeader)
        : retryAfterHeader * 1e3; // Retry-After is in seconds
    }

    const retryTimeout =
      retryAfterHeader > 0
        ? Math.min(retryAfterHeader, maxTimeout)
        : Math.min(minTimeout * timeoutFactor ** (counter - 1), maxTimeout);

    setTimeout(() => cb(null), retryTimeout);
  }

  onHeaders (statusCode, rawHeaders, resume, statusMessage) {
    const headers = parseHeaders(rawHeaders);

    this.retryCount += 1;

    if (statusCode >= 300) {
      if (this.retryOpts.statusCodes.includes(statusCode) === false) {
        return this.handler.onHeaders(
          statusCode,
          rawHeaders,
          resume,
          statusMessage
        )
      } else {
        this.abort(
          new RequestRetryError('Request failed', statusCode, {
            headers,
            count: this.retryCount
          })
        );
        return false
      }
    }

    // Checkpoint for resume from where we left it
    if (this.resume != null) {
      this.resume = null;

      if (statusCode !== 206) {
        return true
      }

      const contentRange = parseRangeHeader(headers['content-range']);
      // If no content range
      if (!contentRange) {
        this.abort(
          new RequestRetryError('Content-Range mismatch', statusCode, {
            headers,
            count: this.retryCount
          })
        );
        return false
      }

      // Let's start with a weak etag check
      if (this.etag != null && this.etag !== headers.etag) {
        this.abort(
          new RequestRetryError('ETag mismatch', statusCode, {
            headers,
            count: this.retryCount
          })
        );
        return false
      }

      const { start, size, end = size } = contentRange;

      assert$4(this.start === start, 'content-range mismatch');
      assert$4(this.end == null || this.end === end, 'content-range mismatch');

      this.resume = resume;
      return true
    }

    if (this.end == null) {
      if (statusCode === 206) {
        // First time we receive 206
        const range = parseRangeHeader(headers['content-range']);

        if (range == null) {
          return this.handler.onHeaders(
            statusCode,
            rawHeaders,
            resume,
            statusMessage
          )
        }

        const { start, size, end = size } = range;
        assert$4(
          start != null && Number.isFinite(start),
          'content-range mismatch'
        );
        assert$4(
          end != null && Number.isFinite(end),
          'invalid content-length'
        );

        this.start = start;
        this.end = end;
      }

      // We make our best to checkpoint the body for further range headers
      if (this.end == null) {
        const contentLength = headers['content-length'];
        this.end = contentLength != null ? Number(contentLength) : null;
      }

      assert$4(Number.isFinite(this.start));
      assert$4(
        this.end == null || Number.isFinite(this.end),
        'invalid content-length'
      );

      this.resume = resume;
      this.etag = headers.etag != null ? headers.etag : null;

      return this.handler.onHeaders(
        statusCode,
        rawHeaders,
        resume,
        statusMessage
      )
    }

    const err = new RequestRetryError('Request failed', statusCode, {
      headers,
      count: this.retryCount
    });

    this.abort(err);

    return false
  }

  onData (chunk) {
    this.start += chunk.length;

    return this.handler.onData(chunk)
  }

  onComplete (rawTrailers) {
    this.retryCount = 0;
    return this.handler.onComplete(rawTrailers)
  }

  onError (err) {
    if (this.aborted || isDisturbed(this.opts.body)) {
      return this.handler.onError(err)
    }

    // We reconcile in case of a mix between network errors
    // and server error response
    if (this.retryCount - this.retryCountCheckpoint > 0) {
      // We count the difference between the last checkpoint and the current retry count
      this.retryCount = this.retryCountCheckpoint + (this.retryCount - this.retryCountCheckpoint);
    } else {
      this.retryCount += 1;
    }

    this.retryOpts.retry(
      err,
      {
        state: { counter: this.retryCount },
        opts: { retryOptions: this.retryOpts, ...this.opts }
      },
      onRetry.bind(this)
    );

    function onRetry (err) {
      if (err != null || this.aborted || isDisturbed(this.opts.body)) {
        return this.handler.onError(err)
      }

      if (this.start !== 0) {
        this.opts = {
          ...this.opts,
          headers: {
            ...this.opts.headers,
            range: `bytes=${this.start}-${this.end ?? ''}`
          }
        };
      }

      try {
        this.retryCountCheckpoint = this.retryCount;
        this.dispatch(this.opts, this);
      } catch (err) {
        this.handler.onError(err);
      }
    }
  }
};

var retryHandler = RetryHandler$3;

const Dispatcher$2 = dispatcher;
const RetryHandler$2 = retryHandler;

let RetryAgent$1 = class RetryAgent extends Dispatcher$2 {
  #agent = null
  #options = null
  constructor (agent, options = {}) {
    super(options);
    this.#agent = agent;
    this.#options = options;
  }

  dispatch (opts, handler) {
    const retry = new RetryHandler$2({
      ...opts,
      retryOptions: this.#options
    }, {
      dispatch: this.#agent.dispatch.bind(this.#agent),
      handler
    });
    return this.#agent.dispatch(opts, retry)
  }

  close () {
    return this.#agent.close()
  }

  destroy () {
    return this.#agent.destroy()
  }
};

var retryAgent = RetryAgent$1;

var api$1 = {};

var apiRequest = {exports: {}};

const assert$3 = require$$0;
const { Readable: Readable$2 } = require$$0$1;
const { RequestAbortedError: RequestAbortedError$6, NotSupportedError, InvalidArgumentError: InvalidArgumentError$b, AbortError } = errors$1;
const util$c = util$m;
const { ReadableStreamFrom } = util$m;

const kConsume = Symbol('kConsume');
const kReading = Symbol('kReading');
const kBody = Symbol('kBody');
const kAbort = Symbol('kAbort');
const kContentType = Symbol('kContentType');
const kContentLength$1 = Symbol('kContentLength');

const noop = () => {};

class BodyReadable extends Readable$2 {
  constructor ({
    resume,
    abort,
    contentType = '',
    contentLength,
    highWaterMark = 64 * 1024 // Same as nodejs fs streams.
  }) {
    super({
      autoDestroy: true,
      read: resume,
      highWaterMark
    });

    this._readableState.dataEmitted = false;

    this[kAbort] = abort;
    this[kConsume] = null;
    this[kBody] = null;
    this[kContentType] = contentType;
    this[kContentLength$1] = contentLength;

    // Is stream being consumed through Readable API?
    // This is an optimization so that we avoid checking
    // for 'data' and 'readable' listeners in the hot path
    // inside push().
    this[kReading] = false;
  }

  destroy (err) {
    if (!err && !this._readableState.endEmitted) {
      err = new RequestAbortedError$6();
    }

    if (err) {
      this[kAbort]();
    }

    return super.destroy(err)
  }

  _destroy (err, callback) {
    // Workaround for Node "bug". If the stream is destroyed in same
    // tick as it is created, then a user who is waiting for a
    // promise (i.e micro tick) for installing a 'error' listener will
    // never get a chance and will always encounter an unhandled exception.
    // - tick => process.nextTick(fn)
    // - micro tick => queueMicrotask(fn)
    queueMicrotask(() => {
      callback(err);
    });
  }

  on (ev, ...args) {
    if (ev === 'data' || ev === 'readable') {
      this[kReading] = true;
    }
    return super.on(ev, ...args)
  }

  addListener (ev, ...args) {
    return this.on(ev, ...args)
  }

  off (ev, ...args) {
    const ret = super.off(ev, ...args);
    if (ev === 'data' || ev === 'readable') {
      this[kReading] = (
        this.listenerCount('data') > 0 ||
        this.listenerCount('readable') > 0
      );
    }
    return ret
  }

  removeListener (ev, ...args) {
    return this.off(ev, ...args)
  }

  push (chunk) {
    if (this[kConsume] && chunk !== null) {
      consumePush(this[kConsume], chunk);
      return this[kReading] ? super.push(chunk) : true
    }
    return super.push(chunk)
  }

  // https://fetch.spec.whatwg.org/#dom-body-text
  async text () {
    return consume(this, 'text')
  }

  // https://fetch.spec.whatwg.org/#dom-body-json
  async json () {
    return consume(this, 'json')
  }

  // https://fetch.spec.whatwg.org/#dom-body-blob
  async blob () {
    return consume(this, 'blob')
  }

  // https://fetch.spec.whatwg.org/#dom-body-arraybuffer
  async arrayBuffer () {
    return consume(this, 'arrayBuffer')
  }

  // https://fetch.spec.whatwg.org/#dom-body-formdata
  async formData () {
    // TODO: Implement.
    throw new NotSupportedError()
  }

  // https://fetch.spec.whatwg.org/#dom-body-bodyused
  get bodyUsed () {
    return util$c.isDisturbed(this)
  }

  // https://fetch.spec.whatwg.org/#dom-body-body
  get body () {
    if (!this[kBody]) {
      this[kBody] = ReadableStreamFrom(this);
      if (this[kConsume]) {
        // TODO: Is this the best way to force a lock?
        this[kBody].getReader(); // Ensure stream is locked.
        assert$3(this[kBody].locked);
      }
    }
    return this[kBody]
  }

  async dump (opts) {
    let limit = Number.isFinite(opts?.limit) ? opts.limit : 128 * 1024;
    const signal = opts?.signal;

    if (signal != null && (typeof signal !== 'object' || !('aborted' in signal))) {
      throw new InvalidArgumentError$b('signal must be an AbortSignal')
    }

    signal?.throwIfAborted();

    if (this._readableState.closeEmitted) {
      return null
    }

    return await new Promise((resolve, reject) => {
      if (this[kContentLength$1] > limit) {
        this.destroy(new AbortError());
      }

      const onAbort = () => {
        this.destroy(signal.reason ?? new AbortError());
      };
      signal?.addEventListener('abort', onAbort);

      this
        .on('close', function () {
          signal?.removeEventListener('abort', onAbort);
          if (signal?.aborted) {
            reject(signal.reason ?? new AbortError());
          } else {
            resolve(null);
          }
        })
        .on('error', noop)
        .on('data', function (chunk) {
          limit -= chunk.length;
          if (limit <= 0) {
            this.destroy();
          }
        })
        .resume();
    })
  }
}

// https://streams.spec.whatwg.org/#readablestream-locked
function isLocked (self) {
  // Consume is an implicit lock.
  return (self[kBody] && self[kBody].locked === true) || self[kConsume]
}

// https://fetch.spec.whatwg.org/#body-unusable
function isUnusable (self) {
  return util$c.isDisturbed(self) || isLocked(self)
}

async function consume (stream, type) {
  assert$3(!stream[kConsume]);

  return new Promise((resolve, reject) => {
    if (isUnusable(stream)) {
      const rState = stream._readableState;
      if (rState.destroyed && rState.closeEmitted === false) {
        stream
          .on('error', err => {
            reject(err);
          })
          .on('close', () => {
            reject(new TypeError('unusable'));
          });
      } else {
        reject(rState.errored ?? new TypeError('unusable'));
      }
    } else {
      queueMicrotask(() => {
        stream[kConsume] = {
          type,
          stream,
          resolve,
          reject,
          length: 0,
          body: []
        };

        stream
          .on('error', function (err) {
            consumeFinish(this[kConsume], err);
          })
          .on('close', function () {
            if (this[kConsume].body !== null) {
              consumeFinish(this[kConsume], new RequestAbortedError$6());
            }
          });

        consumeStart(stream[kConsume]);
      });
    }
  })
}

function consumeStart (consume) {
  if (consume.body === null) {
    return
  }

  const { _readableState: state } = consume.stream;

  if (state.bufferIndex) {
    const start = state.bufferIndex;
    const end = state.buffer.length;
    for (let n = start; n < end; n++) {
      consumePush(consume, state.buffer[n]);
    }
  } else {
    for (const chunk of state.buffer) {
      consumePush(consume, chunk);
    }
  }

  if (state.endEmitted) {
    consumeEnd(this[kConsume]);
  } else {
    consume.stream.on('end', function () {
      consumeEnd(this[kConsume]);
    });
  }

  consume.stream.resume();

  while (consume.stream.read() != null) {
    // Loop
  }
}

/**
 * @param {Buffer[]} chunks
 * @param {number} length
 */
function chunksDecode$1 (chunks, length) {
  if (chunks.length === 0 || length === 0) {
    return ''
  }
  const buffer = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, length);
  const bufferLength = buffer.length;

  // Skip BOM.
  const start =
    bufferLength > 2 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
      ? 3
      : 0;
  return buffer.utf8Slice(start, bufferLength)
}

function consumeEnd (consume) {
  const { type, body, resolve, stream, length } = consume;

  try {
    if (type === 'text') {
      resolve(chunksDecode$1(body, length));
    } else if (type === 'json') {
      resolve(JSON.parse(chunksDecode$1(body, length)));
    } else if (type === 'arrayBuffer') {
      const dst = new Uint8Array(length);

      let pos = 0;
      for (const buf of body) {
        dst.set(buf, pos);
        pos += buf.byteLength;
      }

      resolve(dst.buffer);
    } else if (type === 'blob') {
      resolve(new Blob(body, { type: stream[kContentType] }));
    }

    consumeFinish(consume);
  } catch (err) {
    stream.destroy(err);
  }
}

function consumePush (consume, chunk) {
  consume.length += chunk.length;
  consume.body.push(chunk);
}

function consumeFinish (consume, err) {
  if (consume.body === null) {
    return
  }

  if (err) {
    consume.reject(err);
  } else {
    consume.resolve();
  }

  consume.type = null;
  consume.stream = null;
  consume.resolve = null;
  consume.reject = null;
  consume.length = 0;
  consume.body = null;
}

var readable = { Readable: BodyReadable, chunksDecode: chunksDecode$1 };

const assert$2 = require$$0;
const {
  ResponseStatusCodeError
} = errors$1;

const { chunksDecode } = readable;
const CHUNK_LIMIT = 128 * 1024;

async function getResolveErrorBodyCallback$2 ({ callback, body, contentType, statusCode, statusMessage, headers }) {
  assert$2(body);

  let chunks = [];
  let length = 0;

  for await (const chunk of body) {
    chunks.push(chunk);
    length += chunk.length;
    if (length > CHUNK_LIMIT) {
      chunks = null;
      break
    }
  }

  const message = `Response status code ${statusCode}${statusMessage ? `: ${statusMessage}` : ''}`;

  if (statusCode === 204 || !contentType || !chunks) {
    queueMicrotask(() => callback(new ResponseStatusCodeError(message, statusCode, headers)));
    return
  }

  const stackTraceLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = 0;
  let payload;

  try {
    if (isContentTypeApplicationJson(contentType)) {
      payload = JSON.parse(chunksDecode(chunks, length));
    } else if (isContentTypeText(contentType)) {
      payload = chunksDecode(chunks, length);
    }
  } catch {
    // process in a callback to avoid throwing in the microtask queue
  } finally {
    Error.stackTraceLimit = stackTraceLimit;
  }
  queueMicrotask(() => callback(new ResponseStatusCodeError(message, statusCode, headers, payload)));
}

const isContentTypeApplicationJson = (contentType) => {
  return (
    contentType.length > 15 &&
    contentType[11] === '/' &&
    contentType[0] === 'a' &&
    contentType[1] === 'p' &&
    contentType[2] === 'p' &&
    contentType[3] === 'l' &&
    contentType[4] === 'i' &&
    contentType[5] === 'c' &&
    contentType[6] === 'a' &&
    contentType[7] === 't' &&
    contentType[8] === 'i' &&
    contentType[9] === 'o' &&
    contentType[10] === 'n' &&
    contentType[12] === 'j' &&
    contentType[13] === 's' &&
    contentType[14] === 'o' &&
    contentType[15] === 'n'
  )
};

const isContentTypeText = (contentType) => {
  return (
    contentType.length > 4 &&
    contentType[4] === '/' &&
    contentType[0] === 't' &&
    contentType[1] === 'e' &&
    contentType[2] === 'x' &&
    contentType[3] === 't'
  )
};

var util$b = {
  getResolveErrorBodyCallback: getResolveErrorBodyCallback$2,
  isContentTypeApplicationJson,
  isContentTypeText
};

const { addAbortListener } = util$m;
const { RequestAbortedError: RequestAbortedError$5 } = errors$1;

const kListener = Symbol('kListener');
const kSignal = Symbol('kSignal');

function abort (self) {
  if (self.abort) {
    self.abort(self[kSignal]?.reason);
  } else {
    self.onError(self[kSignal]?.reason ?? new RequestAbortedError$5());
  }
}

function addSignal$5 (self, signal) {
  self[kSignal] = null;
  self[kListener] = null;

  if (!signal) {
    return
  }

  if (signal.aborted) {
    abort(self);
    return
  }

  self[kSignal] = signal;
  self[kListener] = () => {
    abort(self);
  };

  addAbortListener(self[kSignal], self[kListener]);
}

function removeSignal$5 (self) {
  if (!self[kSignal]) {
    return
  }

  if ('removeEventListener' in self[kSignal]) {
    self[kSignal].removeEventListener('abort', self[kListener]);
  } else {
    self[kSignal].removeListener('abort', self[kListener]);
  }

  self[kSignal] = null;
  self[kListener] = null;
}

var abortSignal = {
  addSignal: addSignal$5,
  removeSignal: removeSignal$5
};

const { Readable: Readable$1 } = readable;
const {
  InvalidArgumentError: InvalidArgumentError$a,
  RequestAbortedError: RequestAbortedError$4
} = errors$1;
const util$a = util$m;
const { getResolveErrorBodyCallback: getResolveErrorBodyCallback$1 } = util$b;
const { AsyncResource: AsyncResource$4 } = require$$4$2;
const { addSignal: addSignal$4, removeSignal: removeSignal$4 } = abortSignal;

class RequestHandler extends AsyncResource$4 {
  constructor (opts, callback) {
    if (!opts || typeof opts !== 'object') {
      throw new InvalidArgumentError$a('invalid opts')
    }

    const { signal, method, opaque, body, onInfo, responseHeaders, throwOnError, highWaterMark } = opts;

    try {
      if (typeof callback !== 'function') {
        throw new InvalidArgumentError$a('invalid callback')
      }

      if (highWaterMark && (typeof highWaterMark !== 'number' || highWaterMark < 0)) {
        throw new InvalidArgumentError$a('invalid highWaterMark')
      }

      if (signal && typeof signal.on !== 'function' && typeof signal.addEventListener !== 'function') {
        throw new InvalidArgumentError$a('signal must be an EventEmitter or EventTarget')
      }

      if (method === 'CONNECT') {
        throw new InvalidArgumentError$a('invalid method')
      }

      if (onInfo && typeof onInfo !== 'function') {
        throw new InvalidArgumentError$a('invalid onInfo callback')
      }

      super('UNDICI_REQUEST');
    } catch (err) {
      if (util$a.isStream(body)) {
        util$a.destroy(body.on('error', util$a.nop), err);
      }
      throw err
    }

    this.responseHeaders = responseHeaders || null;
    this.opaque = opaque || null;
    this.callback = callback;
    this.res = null;
    this.abort = null;
    this.body = body;
    this.trailers = {};
    this.context = null;
    this.onInfo = onInfo || null;
    this.throwOnError = throwOnError;
    this.highWaterMark = highWaterMark;

    if (util$a.isStream(body)) {
      body.on('error', (err) => {
        this.onError(err);
      });
    }

    addSignal$4(this, signal);
  }

  onConnect (abort, context) {
    if (!this.callback) {
      throw new RequestAbortedError$4()
    }

    this.abort = abort;
    this.context = context;
  }

  onHeaders (statusCode, rawHeaders, resume, statusMessage) {
    const { callback, opaque, abort, context, responseHeaders, highWaterMark } = this;

    const headers = responseHeaders === 'raw' ? util$a.parseRawHeaders(rawHeaders) : util$a.parseHeaders(rawHeaders);

    if (statusCode < 200) {
      if (this.onInfo) {
        this.onInfo({ statusCode, headers });
      }
      return
    }

    const parsedHeaders = responseHeaders === 'raw' ? util$a.parseHeaders(rawHeaders) : headers;
    const contentType = parsedHeaders['content-type'];
    const contentLength = parsedHeaders['content-length'];
    const body = new Readable$1({ resume, abort, contentType, contentLength, highWaterMark });

    this.callback = null;
    this.res = body;
    if (callback !== null) {
      if (this.throwOnError && statusCode >= 400) {
        this.runInAsyncScope(getResolveErrorBodyCallback$1, null,
          { callback, body, contentType, statusCode, statusMessage, headers }
        );
      } else {
        this.runInAsyncScope(callback, null, null, {
          statusCode,
          headers,
          trailers: this.trailers,
          opaque,
          body,
          context
        });
      }
    }
  }

  onData (chunk) {
    const { res } = this;
    return res.push(chunk)
  }

  onComplete (trailers) {
    const { res } = this;

    removeSignal$4(this);

    util$a.parseHeaders(trailers, this.trailers);

    res.push(null);
  }

  onError (err) {
    const { res, callback, body, opaque } = this;

    removeSignal$4(this);

    if (callback) {
      // TODO: Does this need queueMicrotask?
      this.callback = null;
      queueMicrotask(() => {
        this.runInAsyncScope(callback, null, err, { opaque });
      });
    }

    if (res) {
      this.res = null;
      // Ensure all queued handlers are invoked before destroying res.
      queueMicrotask(() => {
        util$a.destroy(res, err);
      });
    }

    if (body) {
      this.body = null;
      util$a.destroy(body, err);
    }
  }
}

function request$2 (opts, callback) {
  if (callback === undefined) {
    return new Promise((resolve, reject) => {
      request$2.call(this, opts, (err, data) => {
        return err ? reject(err) : resolve(data)
      });
    })
  }

  try {
    this.dispatch(opts, new RequestHandler(opts, callback));
  } catch (err) {
    if (typeof callback !== 'function') {
      throw err
    }
    const opaque = opts?.opaque;
    queueMicrotask(() => callback(err, { opaque }));
  }
}

apiRequest.exports = request$2;
apiRequest.exports.RequestHandler = RequestHandler;

var apiRequestExports = apiRequest.exports;

const { finished, PassThrough: PassThrough$1 } = require$$0$1;
const {
  InvalidArgumentError: InvalidArgumentError$9,
  InvalidReturnValueError: InvalidReturnValueError$1,
  RequestAbortedError: RequestAbortedError$3
} = errors$1;
const util$9 = util$m;
const { getResolveErrorBodyCallback } = util$b;
const { AsyncResource: AsyncResource$3 } = require$$4$2;
const { addSignal: addSignal$3, removeSignal: removeSignal$3 } = abortSignal;

class StreamHandler extends AsyncResource$3 {
  constructor (opts, factory, callback) {
    if (!opts || typeof opts !== 'object') {
      throw new InvalidArgumentError$9('invalid opts')
    }

    const { signal, method, opaque, body, onInfo, responseHeaders, throwOnError } = opts;

    try {
      if (typeof callback !== 'function') {
        throw new InvalidArgumentError$9('invalid callback')
      }

      if (typeof factory !== 'function') {
        throw new InvalidArgumentError$9('invalid factory')
      }

      if (signal && typeof signal.on !== 'function' && typeof signal.addEventListener !== 'function') {
        throw new InvalidArgumentError$9('signal must be an EventEmitter or EventTarget')
      }

      if (method === 'CONNECT') {
        throw new InvalidArgumentError$9('invalid method')
      }

      if (onInfo && typeof onInfo !== 'function') {
        throw new InvalidArgumentError$9('invalid onInfo callback')
      }

      super('UNDICI_STREAM');
    } catch (err) {
      if (util$9.isStream(body)) {
        util$9.destroy(body.on('error', util$9.nop), err);
      }
      throw err
    }

    this.responseHeaders = responseHeaders || null;
    this.opaque = opaque || null;
    this.factory = factory;
    this.callback = callback;
    this.res = null;
    this.abort = null;
    this.context = null;
    this.trailers = null;
    this.body = body;
    this.onInfo = onInfo || null;
    this.throwOnError = throwOnError || false;

    if (util$9.isStream(body)) {
      body.on('error', (err) => {
        this.onError(err);
      });
    }

    addSignal$3(this, signal);
  }

  onConnect (abort, context) {
    if (!this.callback) {
      throw new RequestAbortedError$3()
    }

    this.abort = abort;
    this.context = context;
  }

  onHeaders (statusCode, rawHeaders, resume, statusMessage) {
    const { factory, opaque, context, callback, responseHeaders } = this;

    const headers = responseHeaders === 'raw' ? util$9.parseRawHeaders(rawHeaders) : util$9.parseHeaders(rawHeaders);

    if (statusCode < 200) {
      if (this.onInfo) {
        this.onInfo({ statusCode, headers });
      }
      return
    }

    this.factory = null;

    let res;

    if (this.throwOnError && statusCode >= 400) {
      const parsedHeaders = responseHeaders === 'raw' ? util$9.parseHeaders(rawHeaders) : headers;
      const contentType = parsedHeaders['content-type'];
      res = new PassThrough$1();

      this.callback = null;
      this.runInAsyncScope(getResolveErrorBodyCallback, null,
        { callback, body: res, contentType, statusCode, statusMessage, headers }
      );
    } else {
      if (factory === null) {
        return
      }

      res = this.runInAsyncScope(factory, null, {
        statusCode,
        headers,
        opaque,
        context
      });

      if (
        !res ||
        typeof res.write !== 'function' ||
        typeof res.end !== 'function' ||
        typeof res.on !== 'function'
      ) {
        throw new InvalidReturnValueError$1('expected Writable')
      }

      // TODO: Avoid finished. It registers an unnecessary amount of listeners.
      finished(res, { readable: false }, (err) => {
        const { callback, res, opaque, trailers, abort } = this;

        this.res = null;
        if (err || !res.readable) {
          util$9.destroy(res, err);
        }

        this.callback = null;
        this.runInAsyncScope(callback, null, err || null, { opaque, trailers });

        if (err) {
          abort();
        }
      });
    }

    res.on('drain', resume);

    this.res = res;

    const needDrain = res.writableNeedDrain !== undefined
      ? res.writableNeedDrain
      : res._writableState?.needDrain;

    return needDrain !== true
  }

  onData (chunk) {
    const { res } = this;

    return res ? res.write(chunk) : true
  }

  onComplete (trailers) {
    const { res } = this;

    removeSignal$3(this);

    if (!res) {
      return
    }

    this.trailers = util$9.parseHeaders(trailers);

    res.end();
  }

  onError (err) {
    const { res, callback, opaque, body } = this;

    removeSignal$3(this);

    this.factory = null;

    if (res) {
      this.res = null;
      util$9.destroy(res, err);
    } else if (callback) {
      this.callback = null;
      queueMicrotask(() => {
        this.runInAsyncScope(callback, null, err, { opaque });
      });
    }

    if (body) {
      this.body = null;
      util$9.destroy(body, err);
    }
  }
}

function stream$1 (opts, factory, callback) {
  if (callback === undefined) {
    return new Promise((resolve, reject) => {
      stream$1.call(this, opts, factory, (err, data) => {
        return err ? reject(err) : resolve(data)
      });
    })
  }

  try {
    this.dispatch(opts, new StreamHandler(opts, factory, callback));
  } catch (err) {
    if (typeof callback !== 'function') {
      throw err
    }
    const opaque = opts?.opaque;
    queueMicrotask(() => callback(err, { opaque }));
  }
}

var apiStream = stream$1;

const {
  Readable,
  Duplex,
  PassThrough
} = require$$0$1;
const {
  InvalidArgumentError: InvalidArgumentError$8,
  InvalidReturnValueError,
  RequestAbortedError: RequestAbortedError$2
} = errors$1;
const util$8 = util$m;
const { AsyncResource: AsyncResource$2 } = require$$4$2;
const { addSignal: addSignal$2, removeSignal: removeSignal$2 } = abortSignal;
const assert$1 = require$$0;

const kResume = Symbol('resume');

class PipelineRequest extends Readable {
  constructor () {
    super({ autoDestroy: true });

    this[kResume] = null;
  }

  _read () {
    const { [kResume]: resume } = this;

    if (resume) {
      this[kResume] = null;
      resume();
    }
  }

  _destroy (err, callback) {
    this._read();

    callback(err);
  }
}

class PipelineResponse extends Readable {
  constructor (resume) {
    super({ autoDestroy: true });
    this[kResume] = resume;
  }

  _read () {
    this[kResume]();
  }

  _destroy (err, callback) {
    if (!err && !this._readableState.endEmitted) {
      err = new RequestAbortedError$2();
    }

    callback(err);
  }
}

class PipelineHandler extends AsyncResource$2 {
  constructor (opts, handler) {
    if (!opts || typeof opts !== 'object') {
      throw new InvalidArgumentError$8('invalid opts')
    }

    if (typeof handler !== 'function') {
      throw new InvalidArgumentError$8('invalid handler')
    }

    const { signal, method, opaque, onInfo, responseHeaders } = opts;

    if (signal && typeof signal.on !== 'function' && typeof signal.addEventListener !== 'function') {
      throw new InvalidArgumentError$8('signal must be an EventEmitter or EventTarget')
    }

    if (method === 'CONNECT') {
      throw new InvalidArgumentError$8('invalid method')
    }

    if (onInfo && typeof onInfo !== 'function') {
      throw new InvalidArgumentError$8('invalid onInfo callback')
    }

    super('UNDICI_PIPELINE');

    this.opaque = opaque || null;
    this.responseHeaders = responseHeaders || null;
    this.handler = handler;
    this.abort = null;
    this.context = null;
    this.onInfo = onInfo || null;

    this.req = new PipelineRequest().on('error', util$8.nop);

    this.ret = new Duplex({
      readableObjectMode: opts.objectMode,
      autoDestroy: true,
      read: () => {
        const { body } = this;

        if (body?.resume) {
          body.resume();
        }
      },
      write: (chunk, encoding, callback) => {
        const { req } = this;

        if (req.push(chunk, encoding) || req._readableState.destroyed) {
          callback();
        } else {
          req[kResume] = callback;
        }
      },
      destroy: (err, callback) => {
        const { body, req, res, ret, abort } = this;

        if (!err && !ret._readableState.endEmitted) {
          err = new RequestAbortedError$2();
        }

        if (abort && err) {
          abort();
        }

        util$8.destroy(body, err);
        util$8.destroy(req, err);
        util$8.destroy(res, err);

        removeSignal$2(this);

        callback(err);
      }
    }).on('prefinish', () => {
      const { req } = this;

      // Node < 15 does not call _final in same tick.
      req.push(null);
    });

    this.res = null;

    addSignal$2(this, signal);
  }

  onConnect (abort, context) {
    const { ret, res } = this;

    assert$1(!res, 'pipeline cannot be retried');

    if (ret.destroyed) {
      throw new RequestAbortedError$2()
    }

    this.abort = abort;
    this.context = context;
  }

  onHeaders (statusCode, rawHeaders, resume) {
    const { opaque, handler, context } = this;

    if (statusCode < 200) {
      if (this.onInfo) {
        const headers = this.responseHeaders === 'raw' ? util$8.parseRawHeaders(rawHeaders) : util$8.parseHeaders(rawHeaders);
        this.onInfo({ statusCode, headers });
      }
      return
    }

    this.res = new PipelineResponse(resume);

    let body;
    try {
      this.handler = null;
      const headers = this.responseHeaders === 'raw' ? util$8.parseRawHeaders(rawHeaders) : util$8.parseHeaders(rawHeaders);
      body = this.runInAsyncScope(handler, null, {
        statusCode,
        headers,
        opaque,
        body: this.res,
        context
      });
    } catch (err) {
      this.res.on('error', util$8.nop);
      throw err
    }

    if (!body || typeof body.on !== 'function') {
      throw new InvalidReturnValueError('expected Readable')
    }

    body
      .on('data', (chunk) => {
        const { ret, body } = this;

        if (!ret.push(chunk) && body.pause) {
          body.pause();
        }
      })
      .on('error', (err) => {
        const { ret } = this;

        util$8.destroy(ret, err);
      })
      .on('end', () => {
        const { ret } = this;

        ret.push(null);
      })
      .on('close', () => {
        const { ret } = this;

        if (!ret._readableState.ended) {
          util$8.destroy(ret, new RequestAbortedError$2());
        }
      });

    this.body = body;
  }

  onData (chunk) {
    const { res } = this;
    return res.push(chunk)
  }

  onComplete (trailers) {
    const { res } = this;
    res.push(null);
  }

  onError (err) {
    const { ret } = this;
    this.handler = null;
    util$8.destroy(ret, err);
  }
}

function pipeline$1 (opts, handler) {
  try {
    const pipelineHandler = new PipelineHandler(opts, handler);
    this.dispatch({ ...opts, body: pipelineHandler.req }, pipelineHandler);
    return pipelineHandler.ret
  } catch (err) {
    return new PassThrough().destroy(err)
  }
}

var apiPipeline = pipeline$1;

const { InvalidArgumentError: InvalidArgumentError$7, RequestAbortedError: RequestAbortedError$1, SocketError: SocketError$1 } = errors$1;
const { AsyncResource: AsyncResource$1 } = require$$4$2;
const util$7 = util$m;
const { addSignal: addSignal$1, removeSignal: removeSignal$1 } = abortSignal;
const assert = require$$0;

class UpgradeHandler extends AsyncResource$1 {
  constructor (opts, callback) {
    if (!opts || typeof opts !== 'object') {
      throw new InvalidArgumentError$7('invalid opts')
    }

    if (typeof callback !== 'function') {
      throw new InvalidArgumentError$7('invalid callback')
    }

    const { signal, opaque, responseHeaders } = opts;

    if (signal && typeof signal.on !== 'function' && typeof signal.addEventListener !== 'function') {
      throw new InvalidArgumentError$7('signal must be an EventEmitter or EventTarget')
    }

    super('UNDICI_UPGRADE');

    this.responseHeaders = responseHeaders || null;
    this.opaque = opaque || null;
    this.callback = callback;
    this.abort = null;
    this.context = null;

    addSignal$1(this, signal);
  }

  onConnect (abort, context) {
    if (!this.callback) {
      throw new RequestAbortedError$1()
    }

    this.abort = abort;
    this.context = null;
  }

  onHeaders () {
    throw new SocketError$1('bad upgrade', null)
  }

  onUpgrade (statusCode, rawHeaders, socket) {
    const { callback, opaque, context } = this;

    assert.strictEqual(statusCode, 101);

    removeSignal$1(this);

    this.callback = null;
    const headers = this.responseHeaders === 'raw' ? util$7.parseRawHeaders(rawHeaders) : util$7.parseHeaders(rawHeaders);
    this.runInAsyncScope(callback, null, null, {
      headers,
      socket,
      opaque,
      context
    });
  }

  onError (err) {
    const { callback, opaque } = this;

    removeSignal$1(this);

    if (callback) {
      this.callback = null;
      queueMicrotask(() => {
        this.runInAsyncScope(callback, null, err, { opaque });
      });
    }
  }
}

function upgrade$1 (opts, callback) {
  if (callback === undefined) {
    return new Promise((resolve, reject) => {
      upgrade$1.call(this, opts, (err, data) => {
        return err ? reject(err) : resolve(data)
      });
    })
  }

  try {
    const upgradeHandler = new UpgradeHandler(opts, callback);
    this.dispatch({
      ...opts,
      method: opts.method || 'GET',
      upgrade: opts.protocol || 'Websocket'
    }, upgradeHandler);
  } catch (err) {
    if (typeof callback !== 'function') {
      throw err
    }
    const opaque = opts?.opaque;
    queueMicrotask(() => callback(err, { opaque }));
  }
}

var apiUpgrade = upgrade$1;

const { AsyncResource } = require$$4$2;
const { InvalidArgumentError: InvalidArgumentError$6, RequestAbortedError, SocketError } = errors$1;
const util$6 = util$m;
const { addSignal, removeSignal } = abortSignal;

class ConnectHandler extends AsyncResource {
  constructor (opts, callback) {
    if (!opts || typeof opts !== 'object') {
      throw new InvalidArgumentError$6('invalid opts')
    }

    if (typeof callback !== 'function') {
      throw new InvalidArgumentError$6('invalid callback')
    }

    const { signal, opaque, responseHeaders } = opts;

    if (signal && typeof signal.on !== 'function' && typeof signal.addEventListener !== 'function') {
      throw new InvalidArgumentError$6('signal must be an EventEmitter or EventTarget')
    }

    super('UNDICI_CONNECT');

    this.opaque = opaque || null;
    this.responseHeaders = responseHeaders || null;
    this.callback = callback;
    this.abort = null;

    addSignal(this, signal);
  }

  onConnect (abort, context) {
    if (!this.callback) {
      throw new RequestAbortedError()
    }

    this.abort = abort;
    this.context = context;
  }

  onHeaders () {
    throw new SocketError('bad connect', null)
  }

  onUpgrade (statusCode, rawHeaders, socket) {
    const { callback, opaque, context } = this;

    removeSignal(this);

    this.callback = null;

    let headers = rawHeaders;
    // Indicates is an HTTP2Session
    if (headers != null) {
      headers = this.responseHeaders === 'raw' ? util$6.parseRawHeaders(rawHeaders) : util$6.parseHeaders(rawHeaders);
    }

    this.runInAsyncScope(callback, null, null, {
      statusCode,
      headers,
      socket,
      opaque,
      context
    });
  }

  onError (err) {
    const { callback, opaque } = this;

    removeSignal(this);

    if (callback) {
      this.callback = null;
      queueMicrotask(() => {
        this.runInAsyncScope(callback, null, err, { opaque });
      });
    }
  }
}

function connect$1 (opts, callback) {
  if (callback === undefined) {
    return new Promise((resolve, reject) => {
      connect$1.call(this, opts, (err, data) => {
        return err ? reject(err) : resolve(data)
      });
    })
  }

  try {
    const connectHandler = new ConnectHandler(opts, callback);
    this.dispatch({ ...opts, method: 'CONNECT' }, connectHandler);
  } catch (err) {
    if (typeof callback !== 'function') {
      throw err
    }
    const opaque = opts?.opaque;
    queueMicrotask(() => callback(err, { opaque }));
  }
}

var apiConnect = connect$1;

api$1.request = apiRequestExports;
api$1.stream = apiStream;
api$1.pipeline = apiPipeline;
api$1.upgrade = apiUpgrade;
api$1.connect = apiConnect;

const { UndiciError: UndiciError$1 } = errors$1;

let MockNotMatchedError$1 = class MockNotMatchedError extends UndiciError$1 {
  constructor (message) {
    super(message);
    Error.captureStackTrace(this, MockNotMatchedError);
    this.name = 'MockNotMatchedError';
    this.message = message || 'The request does not match any registered mock dispatches';
    this.code = 'UND_MOCK_ERR_MOCK_NOT_MATCHED';
  }
};

var mockErrors$1 = {
  MockNotMatchedError: MockNotMatchedError$1
};

var mockSymbols = {
  kAgent: Symbol('agent'),
  kOptions: Symbol('options'),
  kFactory: Symbol('factory'),
  kDispatches: Symbol('dispatches'),
  kDispatchKey: Symbol('dispatch key'),
  kDefaultHeaders: Symbol('default headers'),
  kDefaultTrailers: Symbol('default trailers'),
  kContentLength: Symbol('content length'),
  kMockAgent: Symbol('mock agent'),
  kMockAgentSet: Symbol('mock agent set'),
  kMockAgentGet: Symbol('mock agent get'),
  kMockDispatch: Symbol('mock dispatch'),
  kClose: Symbol('close'),
  kOriginalClose: Symbol('original agent close'),
  kOrigin: Symbol('origin'),
  kIsMockActive: Symbol('is mock active'),
  kNetConnect: Symbol('net connect'),
  kGetNetConnect: Symbol('get net connect'),
  kConnected: Symbol('connected')
};

const { MockNotMatchedError } = mockErrors$1;
const {
  kDispatches: kDispatches$4,
  kMockAgent: kMockAgent$2,
  kOriginalDispatch: kOriginalDispatch$2,
  kOrigin: kOrigin$2,
  kGetNetConnect: kGetNetConnect$1
} = mockSymbols;
const { buildURL: buildURL$1, nop } = util$m;
const { STATUS_CODES } = require$$2;
const {
  types: {
    isPromise
  }
} = require$$0$2;

function matchValue$1 (match, value) {
  if (typeof match === 'string') {
    return match === value
  }
  if (match instanceof RegExp) {
    return match.test(value)
  }
  if (typeof match === 'function') {
    return match(value) === true
  }
  return false
}

function lowerCaseEntries (headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([headerName, headerValue]) => {
      return [headerName.toLocaleLowerCase(), headerValue]
    })
  )
}

/**
 * @param {import('../../index').Headers|string[]|Record<string, string>} headers
 * @param {string} key
 */
function getHeaderByName (headers, key) {
  if (Array.isArray(headers)) {
    for (let i = 0; i < headers.length; i += 2) {
      if (headers[i].toLocaleLowerCase() === key.toLocaleLowerCase()) {
        return headers[i + 1]
      }
    }

    return undefined
  } else if (typeof headers.get === 'function') {
    return headers.get(key)
  } else {
    return lowerCaseEntries(headers)[key.toLocaleLowerCase()]
  }
}

/** @param {string[]} headers */
function buildHeadersFromArray (headers) { // fetch HeadersList
  const clone = headers.slice();
  const entries = [];
  for (let index = 0; index < clone.length; index += 2) {
    entries.push([clone[index], clone[index + 1]]);
  }
  return Object.fromEntries(entries)
}

function matchHeaders (mockDispatch, headers) {
  if (typeof mockDispatch.headers === 'function') {
    if (Array.isArray(headers)) { // fetch HeadersList
      headers = buildHeadersFromArray(headers);
    }
    return mockDispatch.headers(headers ? lowerCaseEntries(headers) : {})
  }
  if (typeof mockDispatch.headers === 'undefined') {
    return true
  }
  if (typeof headers !== 'object' || typeof mockDispatch.headers !== 'object') {
    return false
  }

  for (const [matchHeaderName, matchHeaderValue] of Object.entries(mockDispatch.headers)) {
    const headerValue = getHeaderByName(headers, matchHeaderName);

    if (!matchValue$1(matchHeaderValue, headerValue)) {
      return false
    }
  }
  return true
}

function safeUrl (path) {
  if (typeof path !== 'string') {
    return path
  }

  const pathSegments = path.split('?');

  if (pathSegments.length !== 2) {
    return path
  }

  const qp = new URLSearchParams(pathSegments.pop());
  qp.sort();
  return [...pathSegments, qp.toString()].join('?')
}

function matchKey (mockDispatch, { path, method, body, headers }) {
  const pathMatch = matchValue$1(mockDispatch.path, path);
  const methodMatch = matchValue$1(mockDispatch.method, method);
  const bodyMatch = typeof mockDispatch.body !== 'undefined' ? matchValue$1(mockDispatch.body, body) : true;
  const headersMatch = matchHeaders(mockDispatch, headers);
  return pathMatch && methodMatch && bodyMatch && headersMatch
}

function getResponseData$1 (data) {
  if (Buffer.isBuffer(data)) {
    return data
  } else if (typeof data === 'object') {
    return JSON.stringify(data)
  } else {
    return data.toString()
  }
}

function getMockDispatch (mockDispatches, key) {
  const basePath = key.query ? buildURL$1(key.path, key.query) : key.path;
  const resolvedPath = typeof basePath === 'string' ? safeUrl(basePath) : basePath;

  // Match path
  let matchedMockDispatches = mockDispatches.filter(({ consumed }) => !consumed).filter(({ path }) => matchValue$1(safeUrl(path), resolvedPath));
  if (matchedMockDispatches.length === 0) {
    throw new MockNotMatchedError(`Mock dispatch not matched for path '${resolvedPath}'`)
  }

  // Match method
  matchedMockDispatches = matchedMockDispatches.filter(({ method }) => matchValue$1(method, key.method));
  if (matchedMockDispatches.length === 0) {
    throw new MockNotMatchedError(`Mock dispatch not matched for method '${key.method}' on path '${resolvedPath}'`)
  }

  // Match body
  matchedMockDispatches = matchedMockDispatches.filter(({ body }) => typeof body !== 'undefined' ? matchValue$1(body, key.body) : true);
  if (matchedMockDispatches.length === 0) {
    throw new MockNotMatchedError(`Mock dispatch not matched for body '${key.body}' on path '${resolvedPath}'`)
  }

  // Match headers
  matchedMockDispatches = matchedMockDispatches.filter((mockDispatch) => matchHeaders(mockDispatch, key.headers));
  if (matchedMockDispatches.length === 0) {
    const headers = typeof key.headers === 'object' ? JSON.stringify(key.headers) : key.headers;
    throw new MockNotMatchedError(`Mock dispatch not matched for headers '${headers}' on path '${resolvedPath}'`)
  }

  return matchedMockDispatches[0]
}

function addMockDispatch$1 (mockDispatches, key, data) {
  const baseData = { timesInvoked: 0, times: 1, persist: false, consumed: false };
  const replyData = typeof data === 'function' ? { callback: data } : { ...data };
  const newMockDispatch = { ...baseData, ...key, pending: true, data: { error: null, ...replyData } };
  mockDispatches.push(newMockDispatch);
  return newMockDispatch
}

function deleteMockDispatch (mockDispatches, key) {
  const index = mockDispatches.findIndex(dispatch => {
    if (!dispatch.consumed) {
      return false
    }
    return matchKey(dispatch, key)
  });
  if (index !== -1) {
    mockDispatches.splice(index, 1);
  }
}

function buildKey$1 (opts) {
  const { path, method, body, headers, query } = opts;
  return {
    path,
    method,
    body,
    headers,
    query
  }
}

function generateKeyValues (data) {
  const keys = Object.keys(data);
  const result = [];
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i];
    const value = data[key];
    const name = Buffer.from(`${key}`);
    if (Array.isArray(value)) {
      for (let j = 0; j < value.length; ++j) {
        result.push(name, Buffer.from(`${value[j]}`));
      }
    } else {
      result.push(name, Buffer.from(`${value}`));
    }
  }
  return result
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 * @param {number} statusCode
 */
function getStatusText (statusCode) {
  return STATUS_CODES[statusCode] || 'unknown'
}

async function getResponse (body) {
  const buffers = [];
  for await (const data of body) {
    buffers.push(data);
  }
  return Buffer.concat(buffers).toString('utf8')
}

/**
 * Mock dispatch function used to simulate undici dispatches
 */
function mockDispatch (opts, handler) {
  // Get mock dispatch from built key
  const key = buildKey$1(opts);
  const mockDispatch = getMockDispatch(this[kDispatches$4], key);

  mockDispatch.timesInvoked++;

  // Here's where we resolve a callback if a callback is present for the dispatch data.
  if (mockDispatch.data.callback) {
    mockDispatch.data = { ...mockDispatch.data, ...mockDispatch.data.callback(opts) };
  }

  // Parse mockDispatch data
  const { data: { statusCode, data, headers, trailers, error }, delay, persist } = mockDispatch;
  const { timesInvoked, times } = mockDispatch;

  // If it's used up and not persistent, mark as consumed
  mockDispatch.consumed = !persist && timesInvoked >= times;
  mockDispatch.pending = timesInvoked < times;

  // If specified, trigger dispatch error
  if (error !== null) {
    deleteMockDispatch(this[kDispatches$4], key);
    handler.onError(error);
    return true
  }

  // Handle the request with a delay if necessary
  if (typeof delay === 'number' && delay > 0) {
    setTimeout(() => {
      handleReply(this[kDispatches$4]);
    }, delay);
  } else {
    handleReply(this[kDispatches$4]);
  }

  function handleReply (mockDispatches, _data = data) {
    // fetch's HeadersList is a 1D string array
    const optsHeaders = Array.isArray(opts.headers)
      ? buildHeadersFromArray(opts.headers)
      : opts.headers;
    const body = typeof _data === 'function'
      ? _data({ ...opts, headers: optsHeaders })
      : _data;

    // util.types.isPromise is likely needed for jest.
    if (isPromise(body)) {
      // If handleReply is asynchronous, throwing an error
      // in the callback will reject the promise, rather than
      // synchronously throw the error, which breaks some tests.
      // Rather, we wait for the callback to resolve if it is a
      // promise, and then re-run handleReply with the new body.
      body.then((newData) => handleReply(mockDispatches, newData));
      return
    }

    const responseData = getResponseData$1(body);
    const responseHeaders = generateKeyValues(headers);
    const responseTrailers = generateKeyValues(trailers);

    handler.abort = nop;
    handler.onHeaders(statusCode, responseHeaders, resume, getStatusText(statusCode));
    handler.onData(Buffer.from(responseData));
    handler.onComplete(responseTrailers);
    deleteMockDispatch(mockDispatches, key);
  }

  function resume () {}

  return true
}

function buildMockDispatch$2 () {
  const agent = this[kMockAgent$2];
  const origin = this[kOrigin$2];
  const originalDispatch = this[kOriginalDispatch$2];

  return function dispatch (opts, handler) {
    if (agent.isMockActive) {
      try {
        mockDispatch.call(this, opts, handler);
      } catch (error) {
        if (error instanceof MockNotMatchedError) {
          const netConnect = agent[kGetNetConnect$1]();
          if (netConnect === false) {
            throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect disabled)`)
          }
          if (checkNetConnect(netConnect, origin)) {
            originalDispatch.call(this, opts, handler);
          } else {
            throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect is not enabled for this origin)`)
          }
        } else {
          throw error
        }
      }
    } else {
      originalDispatch.call(this, opts, handler);
    }
  }
}

function checkNetConnect (netConnect, origin) {
  const url = new URL(origin);
  if (netConnect === true) {
    return true
  } else if (Array.isArray(netConnect) && netConnect.some((matcher) => matchValue$1(matcher, url.host))) {
    return true
  }
  return false
}

function buildMockOptions$1 (opts) {
  if (opts) {
    const { agent, ...mockOptions } = opts;
    return mockOptions
  }
}

var mockUtils = {
  getResponseData: getResponseData$1,
  getMockDispatch,
  addMockDispatch: addMockDispatch$1,
  deleteMockDispatch,
  buildKey: buildKey$1,
  generateKeyValues,
  matchValue: matchValue$1,
  getResponse,
  getStatusText,
  mockDispatch,
  buildMockDispatch: buildMockDispatch$2,
  checkNetConnect,
  buildMockOptions: buildMockOptions$1,
  getHeaderByName,
  buildHeadersFromArray
};

var mockInterceptor = {};

const { getResponseData, buildKey, addMockDispatch } = mockUtils;
const {
  kDispatches: kDispatches$3,
  kDispatchKey,
  kDefaultHeaders,
  kDefaultTrailers,
  kContentLength,
  kMockDispatch
} = mockSymbols;
const { InvalidArgumentError: InvalidArgumentError$5 } = errors$1;
const { buildURL } = util$m;

/**
 * Defines the scope API for an interceptor reply
 */
class MockScope {
  constructor (mockDispatch) {
    this[kMockDispatch] = mockDispatch;
  }

  /**
   * Delay a reply by a set amount in ms.
   */
  delay (waitInMs) {
    if (typeof waitInMs !== 'number' || !Number.isInteger(waitInMs) || waitInMs <= 0) {
      throw new InvalidArgumentError$5('waitInMs must be a valid integer > 0')
    }

    this[kMockDispatch].delay = waitInMs;
    return this
  }

  /**
   * For a defined reply, never mark as consumed.
   */
  persist () {
    this[kMockDispatch].persist = true;
    return this
  }

  /**
   * Allow one to define a reply for a set amount of matching requests.
   */
  times (repeatTimes) {
    if (typeof repeatTimes !== 'number' || !Number.isInteger(repeatTimes) || repeatTimes <= 0) {
      throw new InvalidArgumentError$5('repeatTimes must be a valid integer > 0')
    }

    this[kMockDispatch].times = repeatTimes;
    return this
  }
}

/**
 * Defines an interceptor for a Mock
 */
let MockInterceptor$2 = class MockInterceptor {
  constructor (opts, mockDispatches) {
    if (typeof opts !== 'object') {
      throw new InvalidArgumentError$5('opts must be an object')
    }
    if (typeof opts.path === 'undefined') {
      throw new InvalidArgumentError$5('opts.path must be defined')
    }
    if (typeof opts.method === 'undefined') {
      opts.method = 'GET';
    }
    // See https://github.com/nodejs/undici/issues/1245
    // As per RFC 3986, clients are not supposed to send URI
    // fragments to servers when they retrieve a document,
    if (typeof opts.path === 'string') {
      if (opts.query) {
        opts.path = buildURL(opts.path, opts.query);
      } else {
        // Matches https://github.com/nodejs/undici/blob/main/lib/web/fetch/index.js#L1811
        const parsedURL = new URL(opts.path, 'data://');
        opts.path = parsedURL.pathname + parsedURL.search;
      }
    }
    if (typeof opts.method === 'string') {
      opts.method = opts.method.toUpperCase();
    }

    this[kDispatchKey] = buildKey(opts);
    this[kDispatches$3] = mockDispatches;
    this[kDefaultHeaders] = {};
    this[kDefaultTrailers] = {};
    this[kContentLength] = false;
  }

  createMockScopeDispatchData (statusCode, data, responseOptions = {}) {
    const responseData = getResponseData(data);
    const contentLength = this[kContentLength] ? { 'content-length': responseData.length } : {};
    const headers = { ...this[kDefaultHeaders], ...contentLength, ...responseOptions.headers };
    const trailers = { ...this[kDefaultTrailers], ...responseOptions.trailers };

    return { statusCode, data, headers, trailers }
  }

  validateReplyParameters (statusCode, data, responseOptions) {
    if (typeof statusCode === 'undefined') {
      throw new InvalidArgumentError$5('statusCode must be defined')
    }
    if (typeof data === 'undefined') {
      throw new InvalidArgumentError$5('data must be defined')
    }
    if (typeof responseOptions !== 'object' || responseOptions === null) {
      throw new InvalidArgumentError$5('responseOptions must be an object')
    }
  }

  /**
   * Mock an undici request with a defined reply.
   */
  reply (replyData) {
    // Values of reply aren't available right now as they
    // can only be available when the reply callback is invoked.
    if (typeof replyData === 'function') {
      // We'll first wrap the provided callback in another function,
      // this function will properly resolve the data from the callback
      // when invoked.
      const wrappedDefaultsCallback = (opts) => {
        // Our reply options callback contains the parameter for statusCode, data and options.
        const resolvedData = replyData(opts);

        // Check if it is in the right format
        if (typeof resolvedData !== 'object') {
          throw new InvalidArgumentError$5('reply options callback must return an object')
        }

        const { statusCode, data = '', responseOptions = {} } = resolvedData;
        this.validateReplyParameters(statusCode, data, responseOptions);
        // Since the values can be obtained immediately we return them
        // from this higher order function that will be resolved later.
        return {
          ...this.createMockScopeDispatchData(statusCode, data, responseOptions)
        }
      };

      // Add usual dispatch data, but this time set the data parameter to function that will eventually provide data.
      const newMockDispatch = addMockDispatch(this[kDispatches$3], this[kDispatchKey], wrappedDefaultsCallback);
      return new MockScope(newMockDispatch)
    }

    // We can have either one or three parameters, if we get here,
    // we should have 1-3 parameters. So we spread the arguments of
    // this function to obtain the parameters, since replyData will always
    // just be the statusCode.
    const [statusCode, data = '', responseOptions = {}] = [...arguments];
    this.validateReplyParameters(statusCode, data, responseOptions);

    // Send in-already provided data like usual
    const dispatchData = this.createMockScopeDispatchData(statusCode, data, responseOptions);
    const newMockDispatch = addMockDispatch(this[kDispatches$3], this[kDispatchKey], dispatchData);
    return new MockScope(newMockDispatch)
  }

  /**
   * Mock an undici request with a defined error.
   */
  replyWithError (error) {
    if (typeof error === 'undefined') {
      throw new InvalidArgumentError$5('error must be defined')
    }

    const newMockDispatch = addMockDispatch(this[kDispatches$3], this[kDispatchKey], { error });
    return new MockScope(newMockDispatch)
  }

  /**
   * Set default reply headers on the interceptor for subsequent replies
   */
  defaultReplyHeaders (headers) {
    if (typeof headers === 'undefined') {
      throw new InvalidArgumentError$5('headers must be defined')
    }

    this[kDefaultHeaders] = headers;
    return this
  }

  /**
   * Set default reply trailers on the interceptor for subsequent replies
   */
  defaultReplyTrailers (trailers) {
    if (typeof trailers === 'undefined') {
      throw new InvalidArgumentError$5('trailers must be defined')
    }

    this[kDefaultTrailers] = trailers;
    return this
  }

  /**
   * Set reply content length header for replies on the interceptor
   */
  replyContentLength () {
    this[kContentLength] = true;
    return this
  }
};

mockInterceptor.MockInterceptor = MockInterceptor$2;
mockInterceptor.MockScope = MockScope;

const { promisify: promisify$1 } = require$$0$2;
const Client$1 = client;
const { buildMockDispatch: buildMockDispatch$1 } = mockUtils;
const {
  kDispatches: kDispatches$2,
  kMockAgent: kMockAgent$1,
  kClose: kClose$1,
  kOriginalClose: kOriginalClose$1,
  kOrigin: kOrigin$1,
  kOriginalDispatch: kOriginalDispatch$1,
  kConnected: kConnected$1
} = mockSymbols;
const { MockInterceptor: MockInterceptor$1 } = mockInterceptor;
const Symbols$1 = symbols$4;
const { InvalidArgumentError: InvalidArgumentError$4 } = errors$1;

/**
 * MockClient provides an API that extends the Client to influence the mockDispatches.
 */
let MockClient$2 = class MockClient extends Client$1 {
  constructor (origin, opts) {
    super(origin, opts);

    if (!opts || !opts.agent || typeof opts.agent.dispatch !== 'function') {
      throw new InvalidArgumentError$4('Argument opts.agent must implement Agent')
    }

    this[kMockAgent$1] = opts.agent;
    this[kOrigin$1] = origin;
    this[kDispatches$2] = [];
    this[kConnected$1] = 1;
    this[kOriginalDispatch$1] = this.dispatch;
    this[kOriginalClose$1] = this.close.bind(this);

    this.dispatch = buildMockDispatch$1.call(this);
    this.close = this[kClose$1];
  }

  get [Symbols$1.kConnected] () {
    return this[kConnected$1]
  }

  /**
   * Sets up the base interceptor for mocking replies from undici.
   */
  intercept (opts) {
    return new MockInterceptor$1(opts, this[kDispatches$2])
  }

  async [kClose$1] () {
    await promisify$1(this[kOriginalClose$1])();
    this[kConnected$1] = 0;
    this[kMockAgent$1][Symbols$1.kClients].delete(this[kOrigin$1]);
  }
};

var mockClient = MockClient$2;

const { promisify } = require$$0$2;
const Pool$1 = pool;
const { buildMockDispatch } = mockUtils;
const {
  kDispatches: kDispatches$1,
  kMockAgent,
  kClose,
  kOriginalClose,
  kOrigin,
  kOriginalDispatch,
  kConnected
} = mockSymbols;
const { MockInterceptor } = mockInterceptor;
const Symbols = symbols$4;
const { InvalidArgumentError: InvalidArgumentError$3 } = errors$1;

/**
 * MockPool provides an API that extends the Pool to influence the mockDispatches.
 */
let MockPool$2 = class MockPool extends Pool$1 {
  constructor (origin, opts) {
    super(origin, opts);

    if (!opts || !opts.agent || typeof opts.agent.dispatch !== 'function') {
      throw new InvalidArgumentError$3('Argument opts.agent must implement Agent')
    }

    this[kMockAgent] = opts.agent;
    this[kOrigin] = origin;
    this[kDispatches$1] = [];
    this[kConnected] = 1;
    this[kOriginalDispatch] = this.dispatch;
    this[kOriginalClose] = this.close.bind(this);

    this.dispatch = buildMockDispatch.call(this);
    this.close = this[kClose];
  }

  get [Symbols.kConnected] () {
    return this[kConnected]
  }

  /**
   * Sets up the base interceptor for mocking replies from undici.
   */
  intercept (opts) {
    return new MockInterceptor(opts, this[kDispatches$1])
  }

  async [kClose] () {
    await promisify(this[kOriginalClose])();
    this[kConnected] = 0;
    this[kMockAgent][Symbols.kClients].delete(this[kOrigin]);
  }
};

var mockPool = MockPool$2;

const singulars = {
  pronoun: 'it',
  is: 'is',
  was: 'was',
  this: 'this'
};

const plurals = {
  pronoun: 'they',
  is: 'are',
  was: 'were',
  this: 'these'
};

var pluralizer = class Pluralizer {
  constructor (singular, plural) {
    this.singular = singular;
    this.plural = plural;
  }

  pluralize (count) {
    const one = count === 1;
    const keys = one ? singulars : plurals;
    const noun = one ? this.singular : this.plural;
    return { ...keys, count, noun }
  }
};

const { Transform } = require$$0$1;
const { Console } = require$$1$2;

const PERSISTENT = process.versions.icu ? '✅' : 'Y ';
const NOT_PERSISTENT = process.versions.icu ? '❌' : 'N ';

/**
 * Gets the output of `console.table(…)` as a string.
 */
var pendingInterceptorsFormatter = class PendingInterceptorsFormatter {
  constructor ({ disableColors } = {}) {
    this.transform = new Transform({
      transform (chunk, _enc, cb) {
        cb(null, chunk);
      }
    });

    this.logger = new Console({
      stdout: this.transform,
      inspectOptions: {
        colors: !disableColors && !process.env.CI
      }
    });
  }

  format (pendingInterceptors) {
    const withPrettyHeaders = pendingInterceptors.map(
      ({ method, path, data: { statusCode }, persist, times, timesInvoked, origin }) => ({
        Method: method,
        Origin: origin,
        Path: path,
        'Status code': statusCode,
        Persistent: persist ? PERSISTENT : NOT_PERSISTENT,
        Invocations: timesInvoked,
        Remaining: persist ? Infinity : times - timesInvoked
      }));

    this.logger.table(withPrettyHeaders);
    return this.transform.read().toString()
  }
};

const { kClients } = symbols$4;
const Agent$2 = agent;
const {
  kAgent,
  kMockAgentSet,
  kMockAgentGet,
  kDispatches,
  kIsMockActive,
  kNetConnect,
  kGetNetConnect,
  kOptions,
  kFactory
} = mockSymbols;
const MockClient$1 = mockClient;
const MockPool$1 = mockPool;
const { matchValue, buildMockOptions } = mockUtils;
const { InvalidArgumentError: InvalidArgumentError$2, UndiciError } = errors$1;
const Dispatcher$1 = dispatcher;
const Pluralizer = pluralizer;
const PendingInterceptorsFormatter = pendingInterceptorsFormatter;

let MockAgent$1 = class MockAgent extends Dispatcher$1 {
  constructor (opts) {
    super(opts);

    this[kNetConnect] = true;
    this[kIsMockActive] = true;

    // Instantiate Agent and encapsulate
    if ((opts?.agent && typeof opts.agent.dispatch !== 'function')) {
      throw new InvalidArgumentError$2('Argument opts.agent must implement Agent')
    }
    const agent = opts?.agent ? opts.agent : new Agent$2(opts);
    this[kAgent] = agent;

    this[kClients] = agent[kClients];
    this[kOptions] = buildMockOptions(opts);
  }

  get (origin) {
    let dispatcher = this[kMockAgentGet](origin);

    if (!dispatcher) {
      dispatcher = this[kFactory](origin);
      this[kMockAgentSet](origin, dispatcher);
    }
    return dispatcher
  }

  dispatch (opts, handler) {
    // Call MockAgent.get to perform additional setup before dispatching as normal
    this.get(opts.origin);
    return this[kAgent].dispatch(opts, handler)
  }

  async close () {
    await this[kAgent].close();
    this[kClients].clear();
  }

  deactivate () {
    this[kIsMockActive] = false;
  }

  activate () {
    this[kIsMockActive] = true;
  }

  enableNetConnect (matcher) {
    if (typeof matcher === 'string' || typeof matcher === 'function' || matcher instanceof RegExp) {
      if (Array.isArray(this[kNetConnect])) {
        this[kNetConnect].push(matcher);
      } else {
        this[kNetConnect] = [matcher];
      }
    } else if (typeof matcher === 'undefined') {
      this[kNetConnect] = true;
    } else {
      throw new InvalidArgumentError$2('Unsupported matcher. Must be one of String|Function|RegExp.')
    }
  }

  disableNetConnect () {
    this[kNetConnect] = false;
  }

  // This is required to bypass issues caused by using global symbols - see:
  // https://github.com/nodejs/undici/issues/1447
  get isMockActive () {
    return this[kIsMockActive]
  }

  [kMockAgentSet] (origin, dispatcher) {
    this[kClients].set(origin, dispatcher);
  }

  [kFactory] (origin) {
    const mockOptions = Object.assign({ agent: this }, this[kOptions]);
    return this[kOptions] && this[kOptions].connections === 1
      ? new MockClient$1(origin, mockOptions)
      : new MockPool$1(origin, mockOptions)
  }

  [kMockAgentGet] (origin) {
    // First check if we can immediately find it
    const client = this[kClients].get(origin);
    if (client) {
      return client
    }

    // If the origin is not a string create a dummy parent pool and return to user
    if (typeof origin !== 'string') {
      const dispatcher = this[kFactory]('http://localhost:9999');
      this[kMockAgentSet](origin, dispatcher);
      return dispatcher
    }

    // If we match, create a pool and assign the same dispatches
    for (const [keyMatcher, nonExplicitDispatcher] of Array.from(this[kClients])) {
      if (nonExplicitDispatcher && typeof keyMatcher !== 'string' && matchValue(keyMatcher, origin)) {
        const dispatcher = this[kFactory](origin);
        this[kMockAgentSet](origin, dispatcher);
        dispatcher[kDispatches] = nonExplicitDispatcher[kDispatches];
        return dispatcher
      }
    }
  }

  [kGetNetConnect] () {
    return this[kNetConnect]
  }

  pendingInterceptors () {
    const mockAgentClients = this[kClients];

    return Array.from(mockAgentClients.entries())
      .flatMap(([origin, scope]) => scope[kDispatches].map(dispatch => ({ ...dispatch, origin })))
      .filter(({ pending }) => pending)
  }

  assertNoPendingInterceptors ({ pendingInterceptorsFormatter = new PendingInterceptorsFormatter() } = {}) {
    const pending = this.pendingInterceptors();

    if (pending.length === 0) {
      return
    }

    const pluralizer = new Pluralizer('interceptor', 'interceptors').pluralize(pending.length);

    throw new UndiciError(`
${pluralizer.count} ${pluralizer.noun} ${pluralizer.is} pending:

${pendingInterceptorsFormatter.format(pending)}
`.trim())
  }
};

var mockAgent = MockAgent$1;

// We include a version number for the Dispatcher API. In case of breaking changes,
// this version number must be increased to avoid conflicts.
const globalDispatcher = Symbol.for('undici.globalDispatcher.1');
const { InvalidArgumentError: InvalidArgumentError$1 } = errors$1;
const Agent$1 = agent;

if (getGlobalDispatcher$1() === undefined) {
  setGlobalDispatcher$1(new Agent$1());
}

function setGlobalDispatcher$1 (agent) {
  if (!agent || typeof agent.dispatch !== 'function') {
    throw new InvalidArgumentError$1('Argument agent must implement Agent')
  }
  Object.defineProperty(globalThis, globalDispatcher, {
    value: agent,
    writable: true,
    enumerable: false,
    configurable: false
  });
}

function getGlobalDispatcher$1 () {
  return globalThis[globalDispatcher]
}

var global$1 = {
  setGlobalDispatcher: setGlobalDispatcher$1,
  getGlobalDispatcher: getGlobalDispatcher$1
};

var decoratorHandler = class DecoratorHandler {
  constructor (handler) {
    this.handler = handler;
  }

  onConnect (...args) {
    return this.handler.onConnect(...args)
  }

  onError (...args) {
    return this.handler.onError(...args)
  }

  onUpgrade (...args) {
    return this.handler.onUpgrade(...args)
  }

  onHeaders (...args) {
    return this.handler.onHeaders(...args)
  }

  onData (...args) {
    return this.handler.onData(...args)
  }

  onComplete (...args) {
    return this.handler.onComplete(...args)
  }

  onBodySent (...args) {
    return this.handler.onBodySent(...args)
  }
};

const RedirectHandler$1 = redirectHandler;

var redirect = opts => {
  const globalMaxRedirections = opts?.maxRedirections;
  return dispatch => {
    return function redirectInterceptor (opts, handler) {
      const { maxRedirections = globalMaxRedirections, ...baseOpts } = opts;

      if (!maxRedirections) {
        return dispatch(opts, handler)
      }

      const redirectHandler = new RedirectHandler$1(
        dispatch,
        maxRedirections,
        opts,
        handler
      );

      return dispatch(baseOpts, redirectHandler)
    }
  }
};

const RetryHandler$1 = retryHandler;

var retry = globalOpts => {
  return dispatch => {
    return function retryInterceptor (opts, handler) {
      return dispatch(
        opts,
        new RetryHandler$1(
          { ...opts, retryOptions: { ...globalOpts, ...opts.retryOptions } },
          {
            handler,
            dispatch
          }
        )
      )
    }
  }
};

var headers;
var hasRequiredHeaders;

function requireHeaders () {
	if (hasRequiredHeaders) return headers;
	hasRequiredHeaders = 1;

	const { kHeadersList, kConstruct } = symbols$4;
	const { kGuard } = requireSymbols$3();
	const { kEnumerableProperty } = util$m;
	const {
	  iteratorMixin,
	  isValidHeaderName,
	  isValidHeaderValue
	} = requireUtil$5();
	const { webidl } = requireWebidl();
	const assert = require$$0;
	const util = require$$0$2;

	const kHeadersMap = Symbol('headers map');
	const kHeadersSortedMap = Symbol('headers map sorted');

	/**
	 * @param {number} code
	 */
	function isHTTPWhiteSpaceCharCode (code) {
	  return code === 0x00a || code === 0x00d || code === 0x009 || code === 0x020
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#concept-header-value-normalize
	 * @param {string} potentialValue
	 */
	function headerValueNormalize (potentialValue) {
	  //  To normalize a byte sequence potentialValue, remove
	  //  any leading and trailing HTTP whitespace bytes from
	  //  potentialValue.
	  let i = 0; let j = potentialValue.length;

	  while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(j - 1))) --j;
	  while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(i))) ++i;

	  return i === 0 && j === potentialValue.length ? potentialValue : potentialValue.substring(i, j)
	}

	function fill (headers, object) {
	  // To fill a Headers object headers with a given object object, run these steps:

	  // 1. If object is a sequence, then for each header in object:
	  // Note: webidl conversion to array has already been done.
	  if (Array.isArray(object)) {
	    for (let i = 0; i < object.length; ++i) {
	      const header = object[i];
	      // 1. If header does not contain exactly two items, then throw a TypeError.
	      if (header.length !== 2) {
	        throw webidl.errors.exception({
	          header: 'Headers constructor',
	          message: `expected name/value pair to be length 2, found ${header.length}.`
	        })
	      }

	      // 2. Append (header’s first item, header’s second item) to headers.
	      appendHeader(headers, header[0], header[1]);
	    }
	  } else if (typeof object === 'object' && object !== null) {
	    // Note: null should throw

	    // 2. Otherwise, object is a record, then for each key → value in object,
	    //    append (key, value) to headers
	    const keys = Object.keys(object);
	    for (let i = 0; i < keys.length; ++i) {
	      appendHeader(headers, keys[i], object[keys[i]]);
	    }
	  } else {
	    throw webidl.errors.conversionFailed({
	      prefix: 'Headers constructor',
	      argument: 'Argument 1',
	      types: ['sequence<sequence<ByteString>>', 'record<ByteString, ByteString>']
	    })
	  }
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#concept-headers-append
	 */
	function appendHeader (headers, name, value) {
	  // 1. Normalize value.
	  value = headerValueNormalize(value);

	  // 2. If name is not a header name or value is not a
	  //    header value, then throw a TypeError.
	  if (!isValidHeaderName(name)) {
	    throw webidl.errors.invalidArgument({
	      prefix: 'Headers.append',
	      value: name,
	      type: 'header name'
	    })
	  } else if (!isValidHeaderValue(value)) {
	    throw webidl.errors.invalidArgument({
	      prefix: 'Headers.append',
	      value,
	      type: 'header value'
	    })
	  }

	  // 3. If headers’s guard is "immutable", then throw a TypeError.
	  // 4. Otherwise, if headers’s guard is "request" and name is a
	  //    forbidden header name, return.
	  // Note: undici does not implement forbidden header names
	  if (headers[kGuard] === 'immutable') {
	    throw new TypeError('immutable')
	  } else if (headers[kGuard] === 'request-no-cors') ;

	  // 6. Otherwise, if headers’s guard is "response" and name is a
	  //    forbidden response-header name, return.

	  // 7. Append (name, value) to headers’s header list.
	  return headers[kHeadersList].append(name, value, false)

	  // 8. If headers’s guard is "request-no-cors", then remove
	  //    privileged no-CORS request headers from headers
	}

	function compareHeaderName (a, b) {
	  return a[0] < b[0] ? -1 : 1
	}

	class HeadersList {
	  /** @type {[string, string][]|null} */
	  cookies = null

	  constructor (init) {
	    if (init instanceof HeadersList) {
	      this[kHeadersMap] = new Map(init[kHeadersMap]);
	      this[kHeadersSortedMap] = init[kHeadersSortedMap];
	      this.cookies = init.cookies === null ? null : [...init.cookies];
	    } else {
	      this[kHeadersMap] = new Map(init);
	      this[kHeadersSortedMap] = null;
	    }
	  }

	  /**
	   * @see https://fetch.spec.whatwg.org/#header-list-contains
	   * @param {string} name
	   * @param {boolean} isLowerCase
	   */
	  contains (name, isLowerCase) {
	    // A header list list contains a header name name if list
	    // contains a header whose name is a byte-case-insensitive
	    // match for name.

	    return this[kHeadersMap].has(isLowerCase ? name : name.toLowerCase())
	  }

	  clear () {
	    this[kHeadersMap].clear();
	    this[kHeadersSortedMap] = null;
	    this.cookies = null;
	  }

	  /**
	   * @see https://fetch.spec.whatwg.org/#concept-header-list-append
	   * @param {string} name
	   * @param {string} value
	   * @param {boolean} isLowerCase
	   */
	  append (name, value, isLowerCase) {
	    this[kHeadersSortedMap] = null;

	    // 1. If list contains name, then set name to the first such
	    //    header’s name.
	    const lowercaseName = isLowerCase ? name : name.toLowerCase();
	    const exists = this[kHeadersMap].get(lowercaseName);

	    // 2. Append (name, value) to list.
	    if (exists) {
	      const delimiter = lowercaseName === 'cookie' ? '; ' : ', ';
	      this[kHeadersMap].set(lowercaseName, {
	        name: exists.name,
	        value: `${exists.value}${delimiter}${value}`
	      });
	    } else {
	      this[kHeadersMap].set(lowercaseName, { name, value });
	    }

	    if (lowercaseName === 'set-cookie') {
	      (this.cookies ??= []).push(value);
	    }
	  }

	  /**
	   * @see https://fetch.spec.whatwg.org/#concept-header-list-set
	   * @param {string} name
	   * @param {string} value
	   * @param {boolean} isLowerCase
	   */
	  set (name, value, isLowerCase) {
	    this[kHeadersSortedMap] = null;
	    const lowercaseName = isLowerCase ? name : name.toLowerCase();

	    if (lowercaseName === 'set-cookie') {
	      this.cookies = [value];
	    }

	    // 1. If list contains name, then set the value of
	    //    the first such header to value and remove the
	    //    others.
	    // 2. Otherwise, append header (name, value) to list.
	    this[kHeadersMap].set(lowercaseName, { name, value });
	  }

	  /**
	   * @see https://fetch.spec.whatwg.org/#concept-header-list-delete
	   * @param {string} name
	   * @param {boolean} isLowerCase
	   */
	  delete (name, isLowerCase) {
	    this[kHeadersSortedMap] = null;
	    if (!isLowerCase) name = name.toLowerCase();

	    if (name === 'set-cookie') {
	      this.cookies = null;
	    }

	    this[kHeadersMap].delete(name);
	  }

	  /**
	   * @see https://fetch.spec.whatwg.org/#concept-header-list-get
	   * @param {string} name
	   * @param {boolean} isLowerCase
	   * @returns {string | null}
	   */
	  get (name, isLowerCase) {
	    // 1. If list does not contain name, then return null.
	    // 2. Return the values of all headers in list whose name
	    //    is a byte-case-insensitive match for name,
	    //    separated from each other by 0x2C 0x20, in order.
	    return this[kHeadersMap].get(isLowerCase ? name : name.toLowerCase())?.value ?? null
	  }

	  * [Symbol.iterator] () {
	    // use the lowercased name
	    for (const { 0: name, 1: { value } } of this[kHeadersMap]) {
	      yield [name, value];
	    }
	  }

	  get entries () {
	    const headers = {};

	    if (this[kHeadersMap].size) {
	      for (const { name, value } of this[kHeadersMap].values()) {
	        headers[name] = value;
	      }
	    }

	    return headers
	  }

	  // https://fetch.spec.whatwg.org/#convert-header-names-to-a-sorted-lowercase-set
	  toSortedArray () {
	    const size = this[kHeadersMap].size;
	    const array = new Array(size);
	    // In most cases, you will use the fast-path.
	    // fast-path: Use binary insertion sort for small arrays.
	    if (size <= 32) {
	      if (size === 0) {
	        // If empty, it is an empty array. To avoid the first index assignment.
	        return array
	      }
	      // Improve performance by unrolling loop and avoiding double-loop.
	      // Double-loop-less version of the binary insertion sort.
	      const iterator = this[kHeadersMap][Symbol.iterator]();
	      const firstValue = iterator.next().value;
	      // set [name, value] to first index.
	      array[0] = [firstValue[0], firstValue[1].value];
	      // https://fetch.spec.whatwg.org/#concept-header-list-sort-and-combine
	      // 3.2.2. Assert: value is non-null.
	      assert(firstValue[1].value !== null);
	      for (
	        let i = 1, j = 0, right = 0, left = 0, pivot = 0, x, value;
	        i < size;
	        ++i
	      ) {
	        // get next value
	        value = iterator.next().value;
	        // set [name, value] to current index.
	        x = array[i] = [value[0], value[1].value];
	        // https://fetch.spec.whatwg.org/#concept-header-list-sort-and-combine
	        // 3.2.2. Assert: value is non-null.
	        assert(x[1] !== null);
	        left = 0;
	        right = i;
	        // binary search
	        while (left < right) {
	          // middle index
	          pivot = left + ((right - left) >> 1);
	          // compare header name
	          if (array[pivot][0] <= x[0]) {
	            left = pivot + 1;
	          } else {
	            right = pivot;
	          }
	        }
	        if (i !== pivot) {
	          j = i;
	          while (j > left) {
	            array[j] = array[--j];
	          }
	          array[left] = x;
	        }
	      }
	      /* c8 ignore next 4 */
	      if (!iterator.next().done) {
	        // This is for debugging and will never be called.
	        throw new TypeError('Unreachable')
	      }
	      return array
	    } else {
	      // This case would be a rare occurrence.
	      // slow-path: fallback
	      let i = 0;
	      for (const { 0: name, 1: { value } } of this[kHeadersMap]) {
	        array[i++] = [name, value];
	        // https://fetch.spec.whatwg.org/#concept-header-list-sort-and-combine
	        // 3.2.2. Assert: value is non-null.
	        assert(value !== null);
	      }
	      return array.sort(compareHeaderName)
	    }
	  }
	}

	// https://fetch.spec.whatwg.org/#headers-class
	class Headers {
	  constructor (init = undefined) {
	    if (init === kConstruct) {
	      return
	    }
	    this[kHeadersList] = new HeadersList();

	    // The new Headers(init) constructor steps are:

	    // 1. Set this’s guard to "none".
	    this[kGuard] = 'none';

	    // 2. If init is given, then fill this with init.
	    if (init !== undefined) {
	      init = webidl.converters.HeadersInit(init);
	      fill(this, init);
	    }
	  }

	  // https://fetch.spec.whatwg.org/#dom-headers-append
	  append (name, value) {
	    webidl.brandCheck(this, Headers);

	    webidl.argumentLengthCheck(arguments, 2, { header: 'Headers.append' });

	    name = webidl.converters.ByteString(name);
	    value = webidl.converters.ByteString(value);

	    return appendHeader(this, name, value)
	  }

	  // https://fetch.spec.whatwg.org/#dom-headers-delete
	  delete (name) {
	    webidl.brandCheck(this, Headers);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'Headers.delete' });

	    name = webidl.converters.ByteString(name);

	    // 1. If name is not a header name, then throw a TypeError.
	    if (!isValidHeaderName(name)) {
	      throw webidl.errors.invalidArgument({
	        prefix: 'Headers.delete',
	        value: name,
	        type: 'header name'
	      })
	    }

	    // 2. If this’s guard is "immutable", then throw a TypeError.
	    // 3. Otherwise, if this’s guard is "request" and name is a
	    //    forbidden header name, return.
	    // 4. Otherwise, if this’s guard is "request-no-cors", name
	    //    is not a no-CORS-safelisted request-header name, and
	    //    name is not a privileged no-CORS request-header name,
	    //    return.
	    // 5. Otherwise, if this’s guard is "response" and name is
	    //    a forbidden response-header name, return.
	    // Note: undici does not implement forbidden header names
	    if (this[kGuard] === 'immutable') {
	      throw new TypeError('immutable')
	    } else if (this[kGuard] === 'request-no-cors') ;

	    // 6. If this’s header list does not contain name, then
	    //    return.
	    if (!this[kHeadersList].contains(name, false)) {
	      return
	    }

	    // 7. Delete name from this’s header list.
	    // 8. If this’s guard is "request-no-cors", then remove
	    //    privileged no-CORS request headers from this.
	    this[kHeadersList].delete(name, false);
	  }

	  // https://fetch.spec.whatwg.org/#dom-headers-get
	  get (name) {
	    webidl.brandCheck(this, Headers);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'Headers.get' });

	    name = webidl.converters.ByteString(name);

	    // 1. If name is not a header name, then throw a TypeError.
	    if (!isValidHeaderName(name)) {
	      throw webidl.errors.invalidArgument({
	        prefix: 'Headers.get',
	        value: name,
	        type: 'header name'
	      })
	    }

	    // 2. Return the result of getting name from this’s header
	    //    list.
	    return this[kHeadersList].get(name, false)
	  }

	  // https://fetch.spec.whatwg.org/#dom-headers-has
	  has (name) {
	    webidl.brandCheck(this, Headers);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'Headers.has' });

	    name = webidl.converters.ByteString(name);

	    // 1. If name is not a header name, then throw a TypeError.
	    if (!isValidHeaderName(name)) {
	      throw webidl.errors.invalidArgument({
	        prefix: 'Headers.has',
	        value: name,
	        type: 'header name'
	      })
	    }

	    // 2. Return true if this’s header list contains name;
	    //    otherwise false.
	    return this[kHeadersList].contains(name, false)
	  }

	  // https://fetch.spec.whatwg.org/#dom-headers-set
	  set (name, value) {
	    webidl.brandCheck(this, Headers);

	    webidl.argumentLengthCheck(arguments, 2, { header: 'Headers.set' });

	    name = webidl.converters.ByteString(name);
	    value = webidl.converters.ByteString(value);

	    // 1. Normalize value.
	    value = headerValueNormalize(value);

	    // 2. If name is not a header name or value is not a
	    //    header value, then throw a TypeError.
	    if (!isValidHeaderName(name)) {
	      throw webidl.errors.invalidArgument({
	        prefix: 'Headers.set',
	        value: name,
	        type: 'header name'
	      })
	    } else if (!isValidHeaderValue(value)) {
	      throw webidl.errors.invalidArgument({
	        prefix: 'Headers.set',
	        value,
	        type: 'header value'
	      })
	    }

	    // 3. If this’s guard is "immutable", then throw a TypeError.
	    // 4. Otherwise, if this’s guard is "request" and name is a
	    //    forbidden header name, return.
	    // 5. Otherwise, if this’s guard is "request-no-cors" and
	    //    name/value is not a no-CORS-safelisted request-header,
	    //    return.
	    // 6. Otherwise, if this’s guard is "response" and name is a
	    //    forbidden response-header name, return.
	    // Note: undici does not implement forbidden header names
	    if (this[kGuard] === 'immutable') {
	      throw new TypeError('immutable')
	    } else if (this[kGuard] === 'request-no-cors') ;

	    // 7. Set (name, value) in this’s header list.
	    // 8. If this’s guard is "request-no-cors", then remove
	    //    privileged no-CORS request headers from this
	    this[kHeadersList].set(name, value, false);
	  }

	  // https://fetch.spec.whatwg.org/#dom-headers-getsetcookie
	  getSetCookie () {
	    webidl.brandCheck(this, Headers);

	    // 1. If this’s header list does not contain `Set-Cookie`, then return « ».
	    // 2. Return the values of all headers in this’s header list whose name is
	    //    a byte-case-insensitive match for `Set-Cookie`, in order.

	    const list = this[kHeadersList].cookies;

	    if (list) {
	      return [...list]
	    }

	    return []
	  }

	  // https://fetch.spec.whatwg.org/#concept-header-list-sort-and-combine
	  get [kHeadersSortedMap] () {
	    if (this[kHeadersList][kHeadersSortedMap]) {
	      return this[kHeadersList][kHeadersSortedMap]
	    }

	    // 1. Let headers be an empty list of headers with the key being the name
	    //    and value the value.
	    const headers = [];

	    // 2. Let names be the result of convert header names to a sorted-lowercase
	    //    set with all the names of the headers in list.
	    const names = this[kHeadersList].toSortedArray();

	    const cookies = this[kHeadersList].cookies;

	    // fast-path
	    if (cookies === null || cookies.length === 1) {
	      // Note: The non-null assertion of value has already been done by `HeadersList#toSortedArray`
	      return (this[kHeadersList][kHeadersSortedMap] = names)
	    }

	    // 3. For each name of names:
	    for (let i = 0; i < names.length; ++i) {
	      const { 0: name, 1: value } = names[i];
	      // 1. If name is `set-cookie`, then:
	      if (name === 'set-cookie') {
	        // 1. Let values be a list of all values of headers in list whose name
	        //    is a byte-case-insensitive match for name, in order.

	        // 2. For each value of values:
	        // 1. Append (name, value) to headers.
	        for (let j = 0; j < cookies.length; ++j) {
	          headers.push([name, cookies[j]]);
	        }
	      } else {
	        // 2. Otherwise:

	        // 1. Let value be the result of getting name from list.

	        // 2. Assert: value is non-null.
	        // Note: This operation was done by `HeadersList#toSortedArray`.

	        // 3. Append (name, value) to headers.
	        headers.push([name, value]);
	      }
	    }

	    // 4. Return headers.
	    return (this[kHeadersList][kHeadersSortedMap] = headers)
	  }

	  [util.inspect.custom] (depth, options) {
	    options.depth ??= depth;

	    return `Headers ${util.formatWithOptions(options, this[kHeadersList].entries)}`
	  }
	}

	Object.defineProperty(Headers.prototype, util.inspect.custom, {
	  enumerable: false
	});

	iteratorMixin('Headers', Headers, kHeadersSortedMap, 0, 1);

	Object.defineProperties(Headers.prototype, {
	  append: kEnumerableProperty,
	  delete: kEnumerableProperty,
	  get: kEnumerableProperty,
	  has: kEnumerableProperty,
	  set: kEnumerableProperty,
	  getSetCookie: kEnumerableProperty,
	  [Symbol.toStringTag]: {
	    value: 'Headers',
	    configurable: true
	  }
	});

	webidl.converters.HeadersInit = function (V) {
	  if (webidl.util.Type(V) === 'Object') {
	    const iterator = Reflect.get(V, Symbol.iterator);

	    if (typeof iterator === 'function') {
	      return webidl.converters['sequence<sequence<ByteString>>'](V, iterator.bind(V))
	    }

	    return webidl.converters['record<ByteString, ByteString>'](V)
	  }

	  throw webidl.errors.conversionFailed({
	    prefix: 'Headers constructor',
	    argument: 'Argument 1',
	    types: ['sequence<sequence<ByteString>>', 'record<ByteString, ByteString>']
	  })
	};

	headers = {
	  fill,
	  // for test.
	  compareHeaderName,
	  Headers,
	  HeadersList
	};
	return headers;
}

var response;
var hasRequiredResponse;

function requireResponse () {
	if (hasRequiredResponse) return response;
	hasRequiredResponse = 1;

	const { Headers, HeadersList, fill } = requireHeaders();
	const { extractBody, cloneBody, mixinBody } = requireBody();
	const util = util$m;
	const nodeUtil = require$$0$2;
	const { kEnumerableProperty } = util;
	const {
	  isValidReasonPhrase,
	  isCancelled,
	  isAborted,
	  isBlobLike,
	  serializeJavascriptValueToJSONString,
	  isErrorLike,
	  isomorphicEncode
	} = requireUtil$5();
	const {
	  redirectStatusSet,
	  nullBodyStatus
	} = requireConstants$2();
	const { kState, kHeaders, kGuard, kRealm } = requireSymbols$3();
	const { webidl } = requireWebidl();
	const { FormData } = requireFormdata();
	const { getGlobalOrigin } = requireGlobal();
	const { URLSerializer } = requireDataUrl();
	const { kHeadersList, kConstruct } = symbols$4;
	const assert = require$$0;
	const { types } = require$$0$2;

	const textEncoder = new TextEncoder('utf-8');

	// https://fetch.spec.whatwg.org/#response-class
	class Response {
	  // Creates network error Response.
	  static error () {
	    // TODO
	    const relevantRealm = { settingsObject: {} };

	    // The static error() method steps are to return the result of creating a
	    // Response object, given a new network error, "immutable", and this’s
	    // relevant Realm.
	    const responseObject = fromInnerResponse(makeNetworkError(), 'immutable', relevantRealm);

	    return responseObject
	  }

	  // https://fetch.spec.whatwg.org/#dom-response-json
	  static json (data, init = {}) {
	    webidl.argumentLengthCheck(arguments, 1, { header: 'Response.json' });

	    if (init !== null) {
	      init = webidl.converters.ResponseInit(init);
	    }

	    // 1. Let bytes the result of running serialize a JavaScript value to JSON bytes on data.
	    const bytes = textEncoder.encode(
	      serializeJavascriptValueToJSONString(data)
	    );

	    // 2. Let body be the result of extracting bytes.
	    const body = extractBody(bytes);

	    // 3. Let responseObject be the result of creating a Response object, given a new response,
	    //    "response", and this’s relevant Realm.
	    const relevantRealm = { settingsObject: {} };
	    const responseObject = fromInnerResponse(makeResponse({}), 'response', relevantRealm);

	    // 4. Perform initialize a response given responseObject, init, and (body, "application/json").
	    initializeResponse(responseObject, init, { body: body[0], type: 'application/json' });

	    // 5. Return responseObject.
	    return responseObject
	  }

	  // Creates a redirect Response that redirects to url with status status.
	  static redirect (url, status = 302) {
	    const relevantRealm = { settingsObject: {} };

	    webidl.argumentLengthCheck(arguments, 1, { header: 'Response.redirect' });

	    url = webidl.converters.USVString(url);
	    status = webidl.converters['unsigned short'](status);

	    // 1. Let parsedURL be the result of parsing url with current settings
	    // object’s API base URL.
	    // 2. If parsedURL is failure, then throw a TypeError.
	    // TODO: base-URL?
	    let parsedURL;
	    try {
	      parsedURL = new URL(url, getGlobalOrigin());
	    } catch (err) {
	      throw new TypeError(`Failed to parse URL from ${url}`, { cause: err })
	    }

	    // 3. If status is not a redirect status, then throw a RangeError.
	    if (!redirectStatusSet.has(status)) {
	      throw new RangeError(`Invalid status code ${status}`)
	    }

	    // 4. Let responseObject be the result of creating a Response object,
	    // given a new response, "immutable", and this’s relevant Realm.
	    const responseObject = fromInnerResponse(makeResponse({}), 'immutable', relevantRealm);

	    // 5. Set responseObject’s response’s status to status.
	    responseObject[kState].status = status;

	    // 6. Let value be parsedURL, serialized and isomorphic encoded.
	    const value = isomorphicEncode(URLSerializer(parsedURL));

	    // 7. Append `Location`/value to responseObject’s response’s header list.
	    responseObject[kState].headersList.append('location', value, true);

	    // 8. Return responseObject.
	    return responseObject
	  }

	  // https://fetch.spec.whatwg.org/#dom-response
	  constructor (body = null, init = {}) {
	    if (body === kConstruct) {
	      return
	    }

	    if (body !== null) {
	      body = webidl.converters.BodyInit(body);
	    }

	    init = webidl.converters.ResponseInit(init);

	    // TODO
	    this[kRealm] = { settingsObject: {} };

	    // 1. Set this’s response to a new response.
	    this[kState] = makeResponse({});

	    // 2. Set this’s headers to a new Headers object with this’s relevant
	    // Realm, whose header list is this’s response’s header list and guard
	    // is "response".
	    this[kHeaders] = new Headers(kConstruct);
	    this[kHeaders][kGuard] = 'response';
	    this[kHeaders][kHeadersList] = this[kState].headersList;
	    this[kHeaders][kRealm] = this[kRealm];

	    // 3. Let bodyWithType be null.
	    let bodyWithType = null;

	    // 4. If body is non-null, then set bodyWithType to the result of extracting body.
	    if (body != null) {
	      const [extractedBody, type] = extractBody(body);
	      bodyWithType = { body: extractedBody, type };
	    }

	    // 5. Perform initialize a response given this, init, and bodyWithType.
	    initializeResponse(this, init, bodyWithType);
	  }

	  // Returns response’s type, e.g., "cors".
	  get type () {
	    webidl.brandCheck(this, Response);

	    // The type getter steps are to return this’s response’s type.
	    return this[kState].type
	  }

	  // Returns response’s URL, if it has one; otherwise the empty string.
	  get url () {
	    webidl.brandCheck(this, Response);

	    const urlList = this[kState].urlList;

	    // The url getter steps are to return the empty string if this’s
	    // response’s URL is null; otherwise this’s response’s URL,
	    // serialized with exclude fragment set to true.
	    const url = urlList[urlList.length - 1] ?? null;

	    if (url === null) {
	      return ''
	    }

	    return URLSerializer(url, true)
	  }

	  // Returns whether response was obtained through a redirect.
	  get redirected () {
	    webidl.brandCheck(this, Response);

	    // The redirected getter steps are to return true if this’s response’s URL
	    // list has more than one item; otherwise false.
	    return this[kState].urlList.length > 1
	  }

	  // Returns response’s status.
	  get status () {
	    webidl.brandCheck(this, Response);

	    // The status getter steps are to return this’s response’s status.
	    return this[kState].status
	  }

	  // Returns whether response’s status is an ok status.
	  get ok () {
	    webidl.brandCheck(this, Response);

	    // The ok getter steps are to return true if this’s response’s status is an
	    // ok status; otherwise false.
	    return this[kState].status >= 200 && this[kState].status <= 299
	  }

	  // Returns response’s status message.
	  get statusText () {
	    webidl.brandCheck(this, Response);

	    // The statusText getter steps are to return this’s response’s status
	    // message.
	    return this[kState].statusText
	  }

	  // Returns response’s headers as Headers.
	  get headers () {
	    webidl.brandCheck(this, Response);

	    // The headers getter steps are to return this’s headers.
	    return this[kHeaders]
	  }

	  get body () {
	    webidl.brandCheck(this, Response);

	    return this[kState].body ? this[kState].body.stream : null
	  }

	  get bodyUsed () {
	    webidl.brandCheck(this, Response);

	    return !!this[kState].body && util.isDisturbed(this[kState].body.stream)
	  }

	  // Returns a clone of response.
	  clone () {
	    webidl.brandCheck(this, Response);

	    // 1. If this is unusable, then throw a TypeError.
	    if (this.bodyUsed || this.body?.locked) {
	      throw webidl.errors.exception({
	        header: 'Response.clone',
	        message: 'Body has already been consumed.'
	      })
	    }

	    // 2. Let clonedResponse be the result of cloning this’s response.
	    const clonedResponse = cloneResponse(this[kState]);

	    // 3. Return the result of creating a Response object, given
	    // clonedResponse, this’s headers’s guard, and this’s relevant Realm.
	    return fromInnerResponse(clonedResponse, this[kHeaders][kGuard], this[kRealm])
	  }

	  [nodeUtil.inspect.custom] (depth, options) {
	    if (options.depth === null) {
	      options.depth = 2;
	    }

	    options.colors ??= true;

	    const properties = {
	      status: this.status,
	      statusText: this.statusText,
	      headers: this.headers,
	      body: this.body,
	      bodyUsed: this.bodyUsed,
	      ok: this.ok,
	      redirected: this.redirected,
	      type: this.type,
	      url: this.url
	    };

	    return `Response ${nodeUtil.formatWithOptions(options, properties)}`
	  }
	}

	mixinBody(Response);

	Object.defineProperties(Response.prototype, {
	  type: kEnumerableProperty,
	  url: kEnumerableProperty,
	  status: kEnumerableProperty,
	  ok: kEnumerableProperty,
	  redirected: kEnumerableProperty,
	  statusText: kEnumerableProperty,
	  headers: kEnumerableProperty,
	  clone: kEnumerableProperty,
	  body: kEnumerableProperty,
	  bodyUsed: kEnumerableProperty,
	  [Symbol.toStringTag]: {
	    value: 'Response',
	    configurable: true
	  }
	});

	Object.defineProperties(Response, {
	  json: kEnumerableProperty,
	  redirect: kEnumerableProperty,
	  error: kEnumerableProperty
	});

	// https://fetch.spec.whatwg.org/#concept-response-clone
	function cloneResponse (response) {
	  // To clone a response response, run these steps:

	  // 1. If response is a filtered response, then return a new identical
	  // filtered response whose internal response is a clone of response’s
	  // internal response.
	  if (response.internalResponse) {
	    return filterResponse(
	      cloneResponse(response.internalResponse),
	      response.type
	    )
	  }

	  // 2. Let newResponse be a copy of response, except for its body.
	  const newResponse = makeResponse({ ...response, body: null });

	  // 3. If response’s body is non-null, then set newResponse’s body to the
	  // result of cloning response’s body.
	  if (response.body != null) {
	    newResponse.body = cloneBody(response.body);
	  }

	  // 4. Return newResponse.
	  return newResponse
	}

	function makeResponse (init) {
	  return {
	    aborted: false,
	    rangeRequested: false,
	    timingAllowPassed: false,
	    requestIncludesCredentials: false,
	    type: 'default',
	    status: 200,
	    timingInfo: null,
	    cacheState: '',
	    statusText: '',
	    ...init,
	    headersList: init?.headersList
	      ? new HeadersList(init?.headersList)
	      : new HeadersList(),
	    urlList: init?.urlList ? [...init.urlList] : []
	  }
	}

	function makeNetworkError (reason) {
	  const isError = isErrorLike(reason);
	  return makeResponse({
	    type: 'error',
	    status: 0,
	    error: isError
	      ? reason
	      : new Error(reason ? String(reason) : reason),
	    aborted: reason && reason.name === 'AbortError'
	  })
	}

	// @see https://fetch.spec.whatwg.org/#concept-network-error
	function isNetworkError (response) {
	  return (
	    // A network error is a response whose type is "error",
	    response.type === 'error' &&
	    // status is 0
	    response.status === 0
	  )
	}

	function makeFilteredResponse (response, state) {
	  state = {
	    internalResponse: response,
	    ...state
	  };

	  return new Proxy(response, {
	    get (target, p) {
	      return p in state ? state[p] : target[p]
	    },
	    set (target, p, value) {
	      assert(!(p in state));
	      target[p] = value;
	      return true
	    }
	  })
	}

	// https://fetch.spec.whatwg.org/#concept-filtered-response
	function filterResponse (response, type) {
	  // Set response to the following filtered response with response as its
	  // internal response, depending on request’s response tainting:
	  if (type === 'basic') {
	    // A basic filtered response is a filtered response whose type is "basic"
	    // and header list excludes any headers in internal response’s header list
	    // whose name is a forbidden response-header name.

	    // Note: undici does not implement forbidden response-header names
	    return makeFilteredResponse(response, {
	      type: 'basic',
	      headersList: response.headersList
	    })
	  } else if (type === 'cors') {
	    // A CORS filtered response is a filtered response whose type is "cors"
	    // and header list excludes any headers in internal response’s header
	    // list whose name is not a CORS-safelisted response-header name, given
	    // internal response’s CORS-exposed header-name list.

	    // Note: undici does not implement CORS-safelisted response-header names
	    return makeFilteredResponse(response, {
	      type: 'cors',
	      headersList: response.headersList
	    })
	  } else if (type === 'opaque') {
	    // An opaque filtered response is a filtered response whose type is
	    // "opaque", URL list is the empty list, status is 0, status message
	    // is the empty byte sequence, header list is empty, and body is null.

	    return makeFilteredResponse(response, {
	      type: 'opaque',
	      urlList: Object.freeze([]),
	      status: 0,
	      statusText: '',
	      body: null
	    })
	  } else if (type === 'opaqueredirect') {
	    // An opaque-redirect filtered response is a filtered response whose type
	    // is "opaqueredirect", status is 0, status message is the empty byte
	    // sequence, header list is empty, and body is null.

	    return makeFilteredResponse(response, {
	      type: 'opaqueredirect',
	      status: 0,
	      statusText: '',
	      headersList: [],
	      body: null
	    })
	  } else {
	    assert(false);
	  }
	}

	// https://fetch.spec.whatwg.org/#appropriate-network-error
	function makeAppropriateNetworkError (fetchParams, err = null) {
	  // 1. Assert: fetchParams is canceled.
	  assert(isCancelled(fetchParams));

	  // 2. Return an aborted network error if fetchParams is aborted;
	  // otherwise return a network error.
	  return isAborted(fetchParams)
	    ? makeNetworkError(Object.assign(new DOMException('The operation was aborted.', 'AbortError'), { cause: err }))
	    : makeNetworkError(Object.assign(new DOMException('Request was cancelled.'), { cause: err }))
	}

	// https://whatpr.org/fetch/1392.html#initialize-a-response
	function initializeResponse (response, init, body) {
	  // 1. If init["status"] is not in the range 200 to 599, inclusive, then
	  //    throw a RangeError.
	  if (init.status !== null && (init.status < 200 || init.status > 599)) {
	    throw new RangeError('init["status"] must be in the range of 200 to 599, inclusive.')
	  }

	  // 2. If init["statusText"] does not match the reason-phrase token production,
	  //    then throw a TypeError.
	  if ('statusText' in init && init.statusText != null) {
	    // See, https://datatracker.ietf.org/doc/html/rfc7230#section-3.1.2:
	    //   reason-phrase  = *( HTAB / SP / VCHAR / obs-text )
	    if (!isValidReasonPhrase(String(init.statusText))) {
	      throw new TypeError('Invalid statusText')
	    }
	  }

	  // 3. Set response’s response’s status to init["status"].
	  if ('status' in init && init.status != null) {
	    response[kState].status = init.status;
	  }

	  // 4. Set response’s response’s status message to init["statusText"].
	  if ('statusText' in init && init.statusText != null) {
	    response[kState].statusText = init.statusText;
	  }

	  // 5. If init["headers"] exists, then fill response’s headers with init["headers"].
	  if ('headers' in init && init.headers != null) {
	    fill(response[kHeaders], init.headers);
	  }

	  // 6. If body was given, then:
	  if (body) {
	    // 1. If response's status is a null body status, then throw a TypeError.
	    if (nullBodyStatus.includes(response.status)) {
	      throw webidl.errors.exception({
	        header: 'Response constructor',
	        message: `Invalid response status code ${response.status}`
	      })
	    }

	    // 2. Set response's body to body's body.
	    response[kState].body = body.body;

	    // 3. If body's type is non-null and response's header list does not contain
	    //    `Content-Type`, then append (`Content-Type`, body's type) to response's header list.
	    if (body.type != null && !response[kState].headersList.contains('content-type', true)) {
	      response[kState].headersList.append('content-type', body.type, true);
	    }
	  }
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#response-create
	 * @param {any} innerResponse
	 * @param {'request' | 'immutable' | 'request-no-cors' | 'response' | 'none'} guard
	 * @param {any} [realm]
	 * @returns {Response}
	 */
	function fromInnerResponse (innerResponse, guard, realm) {
	  const response = new Response(kConstruct);
	  response[kState] = innerResponse;
	  response[kRealm] = realm;
	  response[kHeaders] = new Headers(kConstruct);
	  response[kHeaders][kHeadersList] = innerResponse.headersList;
	  response[kHeaders][kGuard] = guard;
	  response[kHeaders][kRealm] = realm;
	  return response
	}

	webidl.converters.ReadableStream = webidl.interfaceConverter(
	  ReadableStream
	);

	webidl.converters.FormData = webidl.interfaceConverter(
	  FormData
	);

	webidl.converters.URLSearchParams = webidl.interfaceConverter(
	  URLSearchParams
	);

	// https://fetch.spec.whatwg.org/#typedefdef-xmlhttprequestbodyinit
	webidl.converters.XMLHttpRequestBodyInit = function (V) {
	  if (typeof V === 'string') {
	    return webidl.converters.USVString(V)
	  }

	  if (isBlobLike(V)) {
	    return webidl.converters.Blob(V, { strict: false })
	  }

	  if (ArrayBuffer.isView(V) || types.isArrayBuffer(V)) {
	    return webidl.converters.BufferSource(V)
	  }

	  if (util.isFormDataLike(V)) {
	    return webidl.converters.FormData(V, { strict: false })
	  }

	  if (V instanceof URLSearchParams) {
	    return webidl.converters.URLSearchParams(V)
	  }

	  return webidl.converters.DOMString(V)
	};

	// https://fetch.spec.whatwg.org/#bodyinit
	webidl.converters.BodyInit = function (V) {
	  if (V instanceof ReadableStream) {
	    return webidl.converters.ReadableStream(V)
	  }

	  // Note: the spec doesn't include async iterables,
	  // this is an undici extension.
	  if (V?.[Symbol.asyncIterator]) {
	    return V
	  }

	  return webidl.converters.XMLHttpRequestBodyInit(V)
	};

	webidl.converters.ResponseInit = webidl.dictionaryConverter([
	  {
	    key: 'status',
	    converter: webidl.converters['unsigned short'],
	    defaultValue: 200
	  },
	  {
	    key: 'statusText',
	    converter: webidl.converters.ByteString,
	    defaultValue: ''
	  },
	  {
	    key: 'headers',
	    converter: webidl.converters.HeadersInit
	  }
	]);

	response = {
	  isNetworkError,
	  makeNetworkError,
	  makeResponse,
	  makeAppropriateNetworkError,
	  filterResponse,
	  Response,
	  cloneResponse,
	  fromInnerResponse
	};
	return response;
}

var dispatcherWeakref;
var hasRequiredDispatcherWeakref;

function requireDispatcherWeakref () {
	if (hasRequiredDispatcherWeakref) return dispatcherWeakref;
	hasRequiredDispatcherWeakref = 1;

	const { kConnected, kSize } = symbols$4;

	class CompatWeakRef {
	  constructor (value) {
	    this.value = value;
	  }

	  deref () {
	    return this.value[kConnected] === 0 && this.value[kSize] === 0
	      ? undefined
	      : this.value
	  }
	}

	class CompatFinalizer {
	  constructor (finalizer) {
	    this.finalizer = finalizer;
	  }

	  register (dispatcher, key) {
	    if (dispatcher.on) {
	      dispatcher.on('disconnect', () => {
	        if (dispatcher[kConnected] === 0 && dispatcher[kSize] === 0) {
	          this.finalizer(key);
	        }
	      });
	    }
	  }

	  unregister (key) {}
	}

	dispatcherWeakref = function () {
	  // FIXME: remove workaround when the Node bug is fixed
	  // https://github.com/nodejs/node/issues/49344#issuecomment-1741776308
	  if (process.env.NODE_V8_COVERAGE) {
	    return {
	      WeakRef: CompatWeakRef,
	      FinalizationRegistry: CompatFinalizer
	    }
	  }
	  return { WeakRef, FinalizationRegistry }
	};
	return dispatcherWeakref;
}

/* globals AbortController */

var request$1;
var hasRequiredRequest;

function requireRequest () {
	if (hasRequiredRequest) return request$1;
	hasRequiredRequest = 1;

	const { extractBody, mixinBody, cloneBody } = requireBody();
	const { Headers, fill: fillHeaders, HeadersList } = requireHeaders();
	const { FinalizationRegistry } = requireDispatcherWeakref()();
	const util = util$m;
	const nodeUtil = require$$0$2;
	const {
	  isValidHTTPToken,
	  sameOrigin,
	  normalizeMethod,
	  makePolicyContainer,
	  normalizeMethodRecord
	} = requireUtil$5();
	const {
	  forbiddenMethodsSet,
	  corsSafeListedMethodsSet,
	  referrerPolicy,
	  requestRedirect,
	  requestMode,
	  requestCredentials,
	  requestCache,
	  requestDuplex
	} = requireConstants$2();
	const { kEnumerableProperty } = util;
	const { kHeaders, kSignal, kState, kGuard, kRealm, kDispatcher } = requireSymbols$3();
	const { webidl } = requireWebidl();
	const { getGlobalOrigin } = requireGlobal();
	const { URLSerializer } = requireDataUrl();
	const { kHeadersList, kConstruct } = symbols$4;
	const assert = require$$0;
	const { getMaxListeners, setMaxListeners, getEventListeners, defaultMaxListeners } = require$$0$4;

	const kAbortController = Symbol('abortController');

	const requestFinalizer = new FinalizationRegistry(({ signal, abort }) => {
	  signal.removeEventListener('abort', abort);
	});

	let patchMethodWarning = false;

	// https://fetch.spec.whatwg.org/#request-class
	class Request {
	  // https://fetch.spec.whatwg.org/#dom-request
	  constructor (input, init = {}) {
	    if (input === kConstruct) {
	      return
	    }

	    webidl.argumentLengthCheck(arguments, 1, { header: 'Request constructor' });

	    input = webidl.converters.RequestInfo(input);
	    init = webidl.converters.RequestInit(init);

	    // https://html.spec.whatwg.org/multipage/webappapis.html#environment-settings-object
	    this[kRealm] = {
	      settingsObject: {
	        baseUrl: getGlobalOrigin(),
	        get origin () {
	          return this.baseUrl?.origin
	        },
	        policyContainer: makePolicyContainer()
	      }
	    };

	    // 1. Let request be null.
	    let request = null;

	    // 2. Let fallbackMode be null.
	    let fallbackMode = null;

	    // 3. Let baseURL be this’s relevant settings object’s API base URL.
	    const baseUrl = this[kRealm].settingsObject.baseUrl;

	    // 4. Let signal be null.
	    let signal = null;

	    // 5. If input is a string, then:
	    if (typeof input === 'string') {
	      this[kDispatcher] = init.dispatcher;

	      // 1. Let parsedURL be the result of parsing input with baseURL.
	      // 2. If parsedURL is failure, then throw a TypeError.
	      let parsedURL;
	      try {
	        parsedURL = new URL(input, baseUrl);
	      } catch (err) {
	        throw new TypeError('Failed to parse URL from ' + input, { cause: err })
	      }

	      // 3. If parsedURL includes credentials, then throw a TypeError.
	      if (parsedURL.username || parsedURL.password) {
	        throw new TypeError(
	          'Request cannot be constructed from a URL that includes credentials: ' +
	            input
	        )
	      }

	      // 4. Set request to a new request whose URL is parsedURL.
	      request = makeRequest({ urlList: [parsedURL] });

	      // 5. Set fallbackMode to "cors".
	      fallbackMode = 'cors';
	    } else {
	      this[kDispatcher] = init.dispatcher || input[kDispatcher];

	      // 6. Otherwise:

	      // 7. Assert: input is a Request object.
	      assert(input instanceof Request);

	      // 8. Set request to input’s request.
	      request = input[kState];

	      // 9. Set signal to input’s signal.
	      signal = input[kSignal];
	    }

	    // 7. Let origin be this’s relevant settings object’s origin.
	    const origin = this[kRealm].settingsObject.origin;

	    // 8. Let window be "client".
	    let window = 'client';

	    // 9. If request’s window is an environment settings object and its origin
	    // is same origin with origin, then set window to request’s window.
	    if (
	      request.window?.constructor?.name === 'EnvironmentSettingsObject' &&
	      sameOrigin(request.window, origin)
	    ) {
	      window = request.window;
	    }

	    // 10. If init["window"] exists and is non-null, then throw a TypeError.
	    if (init.window != null) {
	      throw new TypeError(`'window' option '${window}' must be null`)
	    }

	    // 11. If init["window"] exists, then set window to "no-window".
	    if ('window' in init) {
	      window = 'no-window';
	    }

	    // 12. Set request to a new request with the following properties:
	    request = makeRequest({
	      // URL request’s URL.
	      // undici implementation note: this is set as the first item in request's urlList in makeRequest
	      // method request’s method.
	      method: request.method,
	      // header list A copy of request’s header list.
	      // undici implementation note: headersList is cloned in makeRequest
	      headersList: request.headersList,
	      // unsafe-request flag Set.
	      unsafeRequest: request.unsafeRequest,
	      // client This’s relevant settings object.
	      client: this[kRealm].settingsObject,
	      // window window.
	      window,
	      // priority request’s priority.
	      priority: request.priority,
	      // origin request’s origin. The propagation of the origin is only significant for navigation requests
	      // being handled by a service worker. In this scenario a request can have an origin that is different
	      // from the current client.
	      origin: request.origin,
	      // referrer request’s referrer.
	      referrer: request.referrer,
	      // referrer policy request’s referrer policy.
	      referrerPolicy: request.referrerPolicy,
	      // mode request’s mode.
	      mode: request.mode,
	      // credentials mode request’s credentials mode.
	      credentials: request.credentials,
	      // cache mode request’s cache mode.
	      cache: request.cache,
	      // redirect mode request’s redirect mode.
	      redirect: request.redirect,
	      // integrity metadata request’s integrity metadata.
	      integrity: request.integrity,
	      // keepalive request’s keepalive.
	      keepalive: request.keepalive,
	      // reload-navigation flag request’s reload-navigation flag.
	      reloadNavigation: request.reloadNavigation,
	      // history-navigation flag request’s history-navigation flag.
	      historyNavigation: request.historyNavigation,
	      // URL list A clone of request’s URL list.
	      urlList: [...request.urlList]
	    });

	    const initHasKey = Object.keys(init).length !== 0;

	    // 13. If init is not empty, then:
	    if (initHasKey) {
	      // 1. If request’s mode is "navigate", then set it to "same-origin".
	      if (request.mode === 'navigate') {
	        request.mode = 'same-origin';
	      }

	      // 2. Unset request’s reload-navigation flag.
	      request.reloadNavigation = false;

	      // 3. Unset request’s history-navigation flag.
	      request.historyNavigation = false;

	      // 4. Set request’s origin to "client".
	      request.origin = 'client';

	      // 5. Set request’s referrer to "client"
	      request.referrer = 'client';

	      // 6. Set request’s referrer policy to the empty string.
	      request.referrerPolicy = '';

	      // 7. Set request’s URL to request’s current URL.
	      request.url = request.urlList[request.urlList.length - 1];

	      // 8. Set request’s URL list to « request’s URL ».
	      request.urlList = [request.url];
	    }

	    // 14. If init["referrer"] exists, then:
	    if (init.referrer !== undefined) {
	      // 1. Let referrer be init["referrer"].
	      const referrer = init.referrer;

	      // 2. If referrer is the empty string, then set request’s referrer to "no-referrer".
	      if (referrer === '') {
	        request.referrer = 'no-referrer';
	      } else {
	        // 1. Let parsedReferrer be the result of parsing referrer with
	        // baseURL.
	        // 2. If parsedReferrer is failure, then throw a TypeError.
	        let parsedReferrer;
	        try {
	          parsedReferrer = new URL(referrer, baseUrl);
	        } catch (err) {
	          throw new TypeError(`Referrer "${referrer}" is not a valid URL.`, { cause: err })
	        }

	        // 3. If one of the following is true
	        // - parsedReferrer’s scheme is "about" and path is the string "client"
	        // - parsedReferrer’s origin is not same origin with origin
	        // then set request’s referrer to "client".
	        if (
	          (parsedReferrer.protocol === 'about:' && parsedReferrer.hostname === 'client') ||
	          (origin && !sameOrigin(parsedReferrer, this[kRealm].settingsObject.baseUrl))
	        ) {
	          request.referrer = 'client';
	        } else {
	          // 4. Otherwise, set request’s referrer to parsedReferrer.
	          request.referrer = parsedReferrer;
	        }
	      }
	    }

	    // 15. If init["referrerPolicy"] exists, then set request’s referrer policy
	    // to it.
	    if (init.referrerPolicy !== undefined) {
	      request.referrerPolicy = init.referrerPolicy;
	    }

	    // 16. Let mode be init["mode"] if it exists, and fallbackMode otherwise.
	    let mode;
	    if (init.mode !== undefined) {
	      mode = init.mode;
	    } else {
	      mode = fallbackMode;
	    }

	    // 17. If mode is "navigate", then throw a TypeError.
	    if (mode === 'navigate') {
	      throw webidl.errors.exception({
	        header: 'Request constructor',
	        message: 'invalid request mode navigate.'
	      })
	    }

	    // 18. If mode is non-null, set request’s mode to mode.
	    if (mode != null) {
	      request.mode = mode;
	    }

	    // 19. If init["credentials"] exists, then set request’s credentials mode
	    // to it.
	    if (init.credentials !== undefined) {
	      request.credentials = init.credentials;
	    }

	    // 18. If init["cache"] exists, then set request’s cache mode to it.
	    if (init.cache !== undefined) {
	      request.cache = init.cache;
	    }

	    // 21. If request’s cache mode is "only-if-cached" and request’s mode is
	    // not "same-origin", then throw a TypeError.
	    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
	      throw new TypeError(
	        "'only-if-cached' can be set only with 'same-origin' mode"
	      )
	    }

	    // 22. If init["redirect"] exists, then set request’s redirect mode to it.
	    if (init.redirect !== undefined) {
	      request.redirect = init.redirect;
	    }

	    // 23. If init["integrity"] exists, then set request’s integrity metadata to it.
	    if (init.integrity != null) {
	      request.integrity = String(init.integrity);
	    }

	    // 24. If init["keepalive"] exists, then set request’s keepalive to it.
	    if (init.keepalive !== undefined) {
	      request.keepalive = Boolean(init.keepalive);
	    }

	    // 25. If init["method"] exists, then:
	    if (init.method !== undefined) {
	      // 1. Let method be init["method"].
	      let method = init.method;

	      const mayBeNormalized = normalizeMethodRecord[method];

	      if (mayBeNormalized !== undefined) {
	        // Note: Bypass validation DELETE, GET, HEAD, OPTIONS, POST, PUT, PATCH and these lowercase ones
	        request.method = mayBeNormalized;
	      } else {
	        // 2. If method is not a method or method is a forbidden method, then
	        // throw a TypeError.
	        if (!isValidHTTPToken(method)) {
	          throw new TypeError(`'${method}' is not a valid HTTP method.`)
	        }

	        if (forbiddenMethodsSet.has(method.toUpperCase())) {
	          throw new TypeError(`'${method}' HTTP method is unsupported.`)
	        }

	        // 3. Normalize method.
	        method = normalizeMethod(method);

	        // 4. Set request’s method to method.
	        request.method = method;
	      }

	      if (!patchMethodWarning && request.method === 'patch') {
	        process.emitWarning('Using `patch` is highly likely to result in a `405 Method Not Allowed`. `PATCH` is much more likely to succeed.', {
	          code: 'UNDICI-FETCH-patch'
	        });

	        patchMethodWarning = true;
	      }
	    }

	    // 26. If init["signal"] exists, then set signal to it.
	    if (init.signal !== undefined) {
	      signal = init.signal;
	    }

	    // 27. Set this’s request to request.
	    this[kState] = request;

	    // 28. Set this’s signal to a new AbortSignal object with this’s relevant
	    // Realm.
	    // TODO: could this be simplified with AbortSignal.any
	    // (https://dom.spec.whatwg.org/#dom-abortsignal-any)
	    const ac = new AbortController();
	    this[kSignal] = ac.signal;
	    this[kSignal][kRealm] = this[kRealm];

	    // 29. If signal is not null, then make this’s signal follow signal.
	    if (signal != null) {
	      if (
	        !signal ||
	        typeof signal.aborted !== 'boolean' ||
	        typeof signal.addEventListener !== 'function'
	      ) {
	        throw new TypeError(
	          "Failed to construct 'Request': member signal is not of type AbortSignal."
	        )
	      }

	      if (signal.aborted) {
	        ac.abort(signal.reason);
	      } else {
	        // Keep a strong ref to ac while request object
	        // is alive. This is needed to prevent AbortController
	        // from being prematurely garbage collected.
	        // See, https://github.com/nodejs/undici/issues/1926.
	        this[kAbortController] = ac;

	        const acRef = new WeakRef(ac);
	        const abort = function () {
	          const ac = acRef.deref();
	          if (ac !== undefined) {
	            // Currently, there is a problem with FinalizationRegistry.
	            // https://github.com/nodejs/node/issues/49344
	            // https://github.com/nodejs/node/issues/47748
	            // In the case of abort, the first step is to unregister from it.
	            // If the controller can refer to it, it is still registered.
	            // It will be removed in the future.
	            requestFinalizer.unregister(abort);

	            // Unsubscribe a listener.
	            // FinalizationRegistry will no longer be called, so this must be done.
	            this.removeEventListener('abort', abort);

	            ac.abort(this.reason);
	          }
	        };

	        // Third-party AbortControllers may not work with these.
	        // See, https://github.com/nodejs/undici/pull/1910#issuecomment-1464495619.
	        try {
	          // If the max amount of listeners is equal to the default, increase it
	          // This is only available in node >= v19.9.0
	          if (typeof getMaxListeners === 'function' && getMaxListeners(signal) === defaultMaxListeners) {
	            setMaxListeners(100, signal);
	          } else if (getEventListeners(signal, 'abort').length >= defaultMaxListeners) {
	            setMaxListeners(100, signal);
	          }
	        } catch {}

	        util.addAbortListener(signal, abort);
	        // The third argument must be a registry key to be unregistered.
	        // Without it, you cannot unregister.
	        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
	        // abort is used as the unregister key. (because it is unique)
	        requestFinalizer.register(ac, { signal, abort }, abort);
	      }
	    }

	    // 30. Set this’s headers to a new Headers object with this’s relevant
	    // Realm, whose header list is request’s header list and guard is
	    // "request".
	    this[kHeaders] = new Headers(kConstruct);
	    this[kHeaders][kHeadersList] = request.headersList;
	    this[kHeaders][kGuard] = 'request';
	    this[kHeaders][kRealm] = this[kRealm];

	    // 31. If this’s request’s mode is "no-cors", then:
	    if (mode === 'no-cors') {
	      // 1. If this’s request’s method is not a CORS-safelisted method,
	      // then throw a TypeError.
	      if (!corsSafeListedMethodsSet.has(request.method)) {
	        throw new TypeError(
	          `'${request.method} is unsupported in no-cors mode.`
	        )
	      }

	      // 2. Set this’s headers’s guard to "request-no-cors".
	      this[kHeaders][kGuard] = 'request-no-cors';
	    }

	    // 32. If init is not empty, then:
	    if (initHasKey) {
	      /** @type {HeadersList} */
	      const headersList = this[kHeaders][kHeadersList];
	      // 1. Let headers be a copy of this’s headers and its associated header
	      // list.
	      // 2. If init["headers"] exists, then set headers to init["headers"].
	      const headers = init.headers !== undefined ? init.headers : new HeadersList(headersList);

	      // 3. Empty this’s headers’s header list.
	      headersList.clear();

	      // 4. If headers is a Headers object, then for each header in its header
	      // list, append header’s name/header’s value to this’s headers.
	      if (headers instanceof HeadersList) {
	        for (const [key, val] of headers) {
	          headersList.append(key, val);
	        }
	        // Note: Copy the `set-cookie` meta-data.
	        headersList.cookies = headers.cookies;
	      } else {
	        // 5. Otherwise, fill this’s headers with headers.
	        fillHeaders(this[kHeaders], headers);
	      }
	    }

	    // 33. Let inputBody be input’s request’s body if input is a Request
	    // object; otherwise null.
	    const inputBody = input instanceof Request ? input[kState].body : null;

	    // 34. If either init["body"] exists and is non-null or inputBody is
	    // non-null, and request’s method is `GET` or `HEAD`, then throw a
	    // TypeError.
	    if (
	      (init.body != null || inputBody != null) &&
	      (request.method === 'GET' || request.method === 'HEAD')
	    ) {
	      throw new TypeError('Request with GET/HEAD method cannot have body.')
	    }

	    // 35. Let initBody be null.
	    let initBody = null;

	    // 36. If init["body"] exists and is non-null, then:
	    if (init.body != null) {
	      // 1. Let Content-Type be null.
	      // 2. Set initBody and Content-Type to the result of extracting
	      // init["body"], with keepalive set to request’s keepalive.
	      const [extractedBody, contentType] = extractBody(
	        init.body,
	        request.keepalive
	      );
	      initBody = extractedBody;

	      // 3, If Content-Type is non-null and this’s headers’s header list does
	      // not contain `Content-Type`, then append `Content-Type`/Content-Type to
	      // this’s headers.
	      if (contentType && !this[kHeaders][kHeadersList].contains('content-type', true)) {
	        this[kHeaders].append('content-type', contentType);
	      }
	    }

	    // 37. Let inputOrInitBody be initBody if it is non-null; otherwise
	    // inputBody.
	    const inputOrInitBody = initBody ?? inputBody;

	    // 38. If inputOrInitBody is non-null and inputOrInitBody’s source is
	    // null, then:
	    if (inputOrInitBody != null && inputOrInitBody.source == null) {
	      // 1. If initBody is non-null and init["duplex"] does not exist,
	      //    then throw a TypeError.
	      if (initBody != null && init.duplex == null) {
	        throw new TypeError('RequestInit: duplex option is required when sending a body.')
	      }

	      // 2. If this’s request’s mode is neither "same-origin" nor "cors",
	      // then throw a TypeError.
	      if (request.mode !== 'same-origin' && request.mode !== 'cors') {
	        throw new TypeError(
	          'If request is made from ReadableStream, mode should be "same-origin" or "cors"'
	        )
	      }

	      // 3. Set this’s request’s use-CORS-preflight flag.
	      request.useCORSPreflightFlag = true;
	    }

	    // 39. Let finalBody be inputOrInitBody.
	    let finalBody = inputOrInitBody;

	    // 40. If initBody is null and inputBody is non-null, then:
	    if (initBody == null && inputBody != null) {
	      // 1. If input is unusable, then throw a TypeError.
	      if (util.isDisturbed(inputBody.stream) || inputBody.stream.locked) {
	        throw new TypeError(
	          'Cannot construct a Request with a Request object that has already been used.'
	        )
	      }

	      // 2. Set finalBody to the result of creating a proxy for inputBody.
	      // https://streams.spec.whatwg.org/#readablestream-create-a-proxy
	      const identityTransform = new TransformStream();
	      inputBody.stream.pipeThrough(identityTransform);
	      finalBody = {
	        source: inputBody.source,
	        length: inputBody.length,
	        stream: identityTransform.readable
	      };
	    }

	    // 41. Set this’s request’s body to finalBody.
	    this[kState].body = finalBody;
	  }

	  // Returns request’s HTTP method, which is "GET" by default.
	  get method () {
	    webidl.brandCheck(this, Request);

	    // The method getter steps are to return this’s request’s method.
	    return this[kState].method
	  }

	  // Returns the URL of request as a string.
	  get url () {
	    webidl.brandCheck(this, Request);

	    // The url getter steps are to return this’s request’s URL, serialized.
	    return URLSerializer(this[kState].url)
	  }

	  // Returns a Headers object consisting of the headers associated with request.
	  // Note that headers added in the network layer by the user agent will not
	  // be accounted for in this object, e.g., the "Host" header.
	  get headers () {
	    webidl.brandCheck(this, Request);

	    // The headers getter steps are to return this’s headers.
	    return this[kHeaders]
	  }

	  // Returns the kind of resource requested by request, e.g., "document"
	  // or "script".
	  get destination () {
	    webidl.brandCheck(this, Request);

	    // The destination getter are to return this’s request’s destination.
	    return this[kState].destination
	  }

	  // Returns the referrer of request. Its value can be a same-origin URL if
	  // explicitly set in init, the empty string to indicate no referrer, and
	  // "about:client" when defaulting to the global’s default. This is used
	  // during fetching to determine the value of the `Referer` header of the
	  // request being made.
	  get referrer () {
	    webidl.brandCheck(this, Request);

	    // 1. If this’s request’s referrer is "no-referrer", then return the
	    // empty string.
	    if (this[kState].referrer === 'no-referrer') {
	      return ''
	    }

	    // 2. If this’s request’s referrer is "client", then return
	    // "about:client".
	    if (this[kState].referrer === 'client') {
	      return 'about:client'
	    }

	    // Return this’s request’s referrer, serialized.
	    return this[kState].referrer.toString()
	  }

	  // Returns the referrer policy associated with request.
	  // This is used during fetching to compute the value of the request’s
	  // referrer.
	  get referrerPolicy () {
	    webidl.brandCheck(this, Request);

	    // The referrerPolicy getter steps are to return this’s request’s referrer policy.
	    return this[kState].referrerPolicy
	  }

	  // Returns the mode associated with request, which is a string indicating
	  // whether the request will use CORS, or will be restricted to same-origin
	  // URLs.
	  get mode () {
	    webidl.brandCheck(this, Request);

	    // The mode getter steps are to return this’s request’s mode.
	    return this[kState].mode
	  }

	  // Returns the credentials mode associated with request,
	  // which is a string indicating whether credentials will be sent with the
	  // request always, never, or only when sent to a same-origin URL.
	  get credentials () {
	    // The credentials getter steps are to return this’s request’s credentials mode.
	    return this[kState].credentials
	  }

	  // Returns the cache mode associated with request,
	  // which is a string indicating how the request will
	  // interact with the browser’s cache when fetching.
	  get cache () {
	    webidl.brandCheck(this, Request);

	    // The cache getter steps are to return this’s request’s cache mode.
	    return this[kState].cache
	  }

	  // Returns the redirect mode associated with request,
	  // which is a string indicating how redirects for the
	  // request will be handled during fetching. A request
	  // will follow redirects by default.
	  get redirect () {
	    webidl.brandCheck(this, Request);

	    // The redirect getter steps are to return this’s request’s redirect mode.
	    return this[kState].redirect
	  }

	  // Returns request’s subresource integrity metadata, which is a
	  // cryptographic hash of the resource being fetched. Its value
	  // consists of multiple hashes separated by whitespace. [SRI]
	  get integrity () {
	    webidl.brandCheck(this, Request);

	    // The integrity getter steps are to return this’s request’s integrity
	    // metadata.
	    return this[kState].integrity
	  }

	  // Returns a boolean indicating whether or not request can outlive the
	  // global in which it was created.
	  get keepalive () {
	    webidl.brandCheck(this, Request);

	    // The keepalive getter steps are to return this’s request’s keepalive.
	    return this[kState].keepalive
	  }

	  // Returns a boolean indicating whether or not request is for a reload
	  // navigation.
	  get isReloadNavigation () {
	    webidl.brandCheck(this, Request);

	    // The isReloadNavigation getter steps are to return true if this’s
	    // request’s reload-navigation flag is set; otherwise false.
	    return this[kState].reloadNavigation
	  }

	  // Returns a boolean indicating whether or not request is for a history
	  // navigation (a.k.a. back-forward navigation).
	  get isHistoryNavigation () {
	    webidl.brandCheck(this, Request);

	    // The isHistoryNavigation getter steps are to return true if this’s request’s
	    // history-navigation flag is set; otherwise false.
	    return this[kState].historyNavigation
	  }

	  // Returns the signal associated with request, which is an AbortSignal
	  // object indicating whether or not request has been aborted, and its
	  // abort event handler.
	  get signal () {
	    webidl.brandCheck(this, Request);

	    // The signal getter steps are to return this’s signal.
	    return this[kSignal]
	  }

	  get body () {
	    webidl.brandCheck(this, Request);

	    return this[kState].body ? this[kState].body.stream : null
	  }

	  get bodyUsed () {
	    webidl.brandCheck(this, Request);

	    return !!this[kState].body && util.isDisturbed(this[kState].body.stream)
	  }

	  get duplex () {
	    webidl.brandCheck(this, Request);

	    return 'half'
	  }

	  // Returns a clone of request.
	  clone () {
	    webidl.brandCheck(this, Request);

	    // 1. If this is unusable, then throw a TypeError.
	    if (this.bodyUsed || this.body?.locked) {
	      throw new TypeError('unusable')
	    }

	    // 2. Let clonedRequest be the result of cloning this’s request.
	    const clonedRequest = cloneRequest(this[kState]);

	    // 3. Let clonedRequestObject be the result of creating a Request object,
	    // given clonedRequest, this’s headers’s guard, and this’s relevant Realm.
	    // 4. Make clonedRequestObject’s signal follow this’s signal.
	    const ac = new AbortController();
	    if (this.signal.aborted) {
	      ac.abort(this.signal.reason);
	    } else {
	      util.addAbortListener(
	        this.signal,
	        () => {
	          ac.abort(this.signal.reason);
	        }
	      );
	    }

	    // 4. Return clonedRequestObject.
	    return fromInnerRequest(clonedRequest, ac.signal, this[kHeaders][kGuard], this[kRealm])
	  }

	  [nodeUtil.inspect.custom] (depth, options) {
	    if (options.depth === null) {
	      options.depth = 2;
	    }

	    options.colors ??= true;

	    const properties = {
	      method: this.method,
	      url: this.url,
	      headers: this.headers,
	      destination: this.destination,
	      referrer: this.referrer,
	      referrerPolicy: this.referrerPolicy,
	      mode: this.mode,
	      credentials: this.credentials,
	      cache: this.cache,
	      redirect: this.redirect,
	      integrity: this.integrity,
	      keepalive: this.keepalive,
	      isReloadNavigation: this.isReloadNavigation,
	      isHistoryNavigation: this.isHistoryNavigation,
	      signal: this.signal
	    };

	    return `Request ${nodeUtil.formatWithOptions(options, properties)}`
	  }
	}

	mixinBody(Request);

	function makeRequest (init) {
	  // https://fetch.spec.whatwg.org/#requests
	  const request = {
	    method: 'GET',
	    localURLsOnly: false,
	    unsafeRequest: false,
	    body: null,
	    client: null,
	    reservedClient: null,
	    replacesClientId: '',
	    window: 'client',
	    keepalive: false,
	    serviceWorkers: 'all',
	    initiator: '',
	    destination: '',
	    priority: null,
	    origin: 'client',
	    policyContainer: 'client',
	    referrer: 'client',
	    referrerPolicy: '',
	    mode: 'no-cors',
	    useCORSPreflightFlag: false,
	    credentials: 'same-origin',
	    useCredentials: false,
	    cache: 'default',
	    redirect: 'follow',
	    integrity: '',
	    cryptoGraphicsNonceMetadata: '',
	    parserMetadata: '',
	    reloadNavigation: false,
	    historyNavigation: false,
	    userActivation: false,
	    taintedOrigin: false,
	    redirectCount: 0,
	    responseTainting: 'basic',
	    preventNoCacheCacheControlHeaderModification: false,
	    done: false,
	    timingAllowFailed: false,
	    ...init,
	    headersList: init.headersList
	      ? new HeadersList(init.headersList)
	      : new HeadersList()
	  };
	  request.url = request.urlList[0];
	  return request
	}

	// https://fetch.spec.whatwg.org/#concept-request-clone
	function cloneRequest (request) {
	  // To clone a request request, run these steps:

	  // 1. Let newRequest be a copy of request, except for its body.
	  const newRequest = makeRequest({ ...request, body: null });

	  // 2. If request’s body is non-null, set newRequest’s body to the
	  // result of cloning request’s body.
	  if (request.body != null) {
	    newRequest.body = cloneBody(request.body);
	  }

	  // 3. Return newRequest.
	  return newRequest
	}

	/**
	 * @see https://fetch.spec.whatwg.org/#request-create
	 * @param {any} innerRequest
	 * @param {AbortSignal} signal
	 * @param {'request' | 'immutable' | 'request-no-cors' | 'response' | 'none'} guard
	 * @param {any} [realm]
	 * @returns {Request}
	 */
	function fromInnerRequest (innerRequest, signal, guard, realm) {
	  const request = new Request(kConstruct);
	  request[kState] = innerRequest;
	  request[kRealm] = realm;
	  request[kSignal] = signal;
	  request[kSignal][kRealm] = realm;
	  request[kHeaders] = new Headers(kConstruct);
	  request[kHeaders][kHeadersList] = innerRequest.headersList;
	  request[kHeaders][kGuard] = guard;
	  request[kHeaders][kRealm] = realm;
	  return request
	}

	Object.defineProperties(Request.prototype, {
	  method: kEnumerableProperty,
	  url: kEnumerableProperty,
	  headers: kEnumerableProperty,
	  redirect: kEnumerableProperty,
	  clone: kEnumerableProperty,
	  signal: kEnumerableProperty,
	  duplex: kEnumerableProperty,
	  destination: kEnumerableProperty,
	  body: kEnumerableProperty,
	  bodyUsed: kEnumerableProperty,
	  isHistoryNavigation: kEnumerableProperty,
	  isReloadNavigation: kEnumerableProperty,
	  keepalive: kEnumerableProperty,
	  integrity: kEnumerableProperty,
	  cache: kEnumerableProperty,
	  credentials: kEnumerableProperty,
	  attribute: kEnumerableProperty,
	  referrerPolicy: kEnumerableProperty,
	  referrer: kEnumerableProperty,
	  mode: kEnumerableProperty,
	  [Symbol.toStringTag]: {
	    value: 'Request',
	    configurable: true
	  }
	});

	webidl.converters.Request = webidl.interfaceConverter(
	  Request
	);

	// https://fetch.spec.whatwg.org/#requestinfo
	webidl.converters.RequestInfo = function (V) {
	  if (typeof V === 'string') {
	    return webidl.converters.USVString(V)
	  }

	  if (V instanceof Request) {
	    return webidl.converters.Request(V)
	  }

	  return webidl.converters.USVString(V)
	};

	webidl.converters.AbortSignal = webidl.interfaceConverter(
	  AbortSignal
	);

	// https://fetch.spec.whatwg.org/#requestinit
	webidl.converters.RequestInit = webidl.dictionaryConverter([
	  {
	    key: 'method',
	    converter: webidl.converters.ByteString
	  },
	  {
	    key: 'headers',
	    converter: webidl.converters.HeadersInit
	  },
	  {
	    key: 'body',
	    converter: webidl.nullableConverter(
	      webidl.converters.BodyInit
	    )
	  },
	  {
	    key: 'referrer',
	    converter: webidl.converters.USVString
	  },
	  {
	    key: 'referrerPolicy',
	    converter: webidl.converters.DOMString,
	    // https://w3c.github.io/webappsec-referrer-policy/#referrer-policy
	    allowedValues: referrerPolicy
	  },
	  {
	    key: 'mode',
	    converter: webidl.converters.DOMString,
	    // https://fetch.spec.whatwg.org/#concept-request-mode
	    allowedValues: requestMode
	  },
	  {
	    key: 'credentials',
	    converter: webidl.converters.DOMString,
	    // https://fetch.spec.whatwg.org/#requestcredentials
	    allowedValues: requestCredentials
	  },
	  {
	    key: 'cache',
	    converter: webidl.converters.DOMString,
	    // https://fetch.spec.whatwg.org/#requestcache
	    allowedValues: requestCache
	  },
	  {
	    key: 'redirect',
	    converter: webidl.converters.DOMString,
	    // https://fetch.spec.whatwg.org/#requestredirect
	    allowedValues: requestRedirect
	  },
	  {
	    key: 'integrity',
	    converter: webidl.converters.DOMString
	  },
	  {
	    key: 'keepalive',
	    converter: webidl.converters.boolean
	  },
	  {
	    key: 'signal',
	    converter: webidl.nullableConverter(
	      (signal) => webidl.converters.AbortSignal(
	        signal,
	        { strict: false }
	      )
	    )
	  },
	  {
	    key: 'window',
	    converter: webidl.converters.any
	  },
	  {
	    key: 'duplex',
	    converter: webidl.converters.DOMString,
	    allowedValues: requestDuplex
	  },
	  {
	    key: 'dispatcher', // undici specific option
	    converter: webidl.converters.any
	  }
	]);

	request$1 = { Request, makeRequest, fromInnerRequest, cloneRequest };
	return request$1;
}

var fetch_1;
var hasRequiredFetch;

function requireFetch () {
	if (hasRequiredFetch) return fetch_1;
	hasRequiredFetch = 1;

	const {
	  makeNetworkError,
	  makeAppropriateNetworkError,
	  filterResponse,
	  makeResponse,
	  fromInnerResponse
	} = requireResponse();
	const { HeadersList } = requireHeaders();
	const { Request, cloneRequest } = requireRequest();
	const zlib = require$$1;
	const {
	  bytesMatch,
	  makePolicyContainer,
	  clonePolicyContainer,
	  requestBadPort,
	  TAOCheck,
	  appendRequestOriginHeader,
	  responseLocationURL,
	  requestCurrentURL,
	  setRequestReferrerPolicyOnRedirect,
	  tryUpgradeRequestToAPotentiallyTrustworthyURL,
	  createOpaqueTimingInfo,
	  appendFetchMetadata,
	  corsCheck,
	  crossOriginResourcePolicyCheck,
	  determineRequestsReferrer,
	  coarsenedSharedCurrentTime,
	  createDeferredPromise,
	  isBlobLike,
	  sameOrigin,
	  isCancelled,
	  isAborted,
	  isErrorLike,
	  fullyReadBody,
	  readableStreamClose,
	  isomorphicEncode,
	  urlIsLocal,
	  urlIsHttpHttpsScheme,
	  urlHasHttpsScheme,
	  clampAndCoarsenConnectionTimingInfo,
	  simpleRangeHeaderValue,
	  buildContentRange,
	  createInflate,
	  extractMimeType
	} = requireUtil$5();
	const { kState, kDispatcher } = requireSymbols$3();
	const assert = require$$0;
	const { safelyExtractBody, extractBody } = requireBody();
	const {
	  redirectStatusSet,
	  nullBodyStatus,
	  safeMethodsSet,
	  requestBodyHeader,
	  subresourceSet
	} = requireConstants$2();
	const EE = require$$0$4;
	const { Readable, pipeline } = require$$0$1;
	const { addAbortListener, isErrored, isReadable, nodeMajor, nodeMinor, bufferToLowerCasedHeaderName } = util$m;
	const { dataURLProcessor, serializeAMimeType, minimizeSupportedMimeType } = requireDataUrl();
	const { getGlobalDispatcher } = global$1;
	const { webidl } = requireWebidl();
	const { STATUS_CODES } = require$$2;
	const GET_OR_HEAD = ['GET', 'HEAD'];

	const defaultUserAgent = typeof __UNDICI_IS_NODE__ !== 'undefined' || typeof esbuildDetection !== 'undefined'
	  ? 'node'
	  : 'undici';

	/** @type {import('buffer').resolveObjectURL} */
	let resolveObjectURL;

	class Fetch extends EE {
	  constructor (dispatcher) {
	    super();

	    this.dispatcher = dispatcher;
	    this.connection = null;
	    this.dump = false;
	    this.state = 'ongoing';
	  }

	  terminate (reason) {
	    if (this.state !== 'ongoing') {
	      return
	    }

	    this.state = 'terminated';
	    this.connection?.destroy(reason);
	    this.emit('terminated', reason);
	  }

	  // https://fetch.spec.whatwg.org/#fetch-controller-abort
	  abort (error) {
	    if (this.state !== 'ongoing') {
	      return
	    }

	    // 1. Set controller’s state to "aborted".
	    this.state = 'aborted';

	    // 2. Let fallbackError be an "AbortError" DOMException.
	    // 3. Set error to fallbackError if it is not given.
	    if (!error) {
	      error = new DOMException('The operation was aborted.', 'AbortError');
	    }

	    // 4. Let serializedError be StructuredSerialize(error).
	    //    If that threw an exception, catch it, and let
	    //    serializedError be StructuredSerialize(fallbackError).

	    // 5. Set controller’s serialized abort reason to serializedError.
	    this.serializedAbortReason = error;

	    this.connection?.destroy(error);
	    this.emit('terminated', error);
	  }
	}

	// https://fetch.spec.whatwg.org/#fetch-method
	function fetch (input, init = undefined) {
	  webidl.argumentLengthCheck(arguments, 1, { header: 'globalThis.fetch' });

	  // 1. Let p be a new promise.
	  const p = createDeferredPromise();

	  // 2. Let requestObject be the result of invoking the initial value of
	  // Request as constructor with input and init as arguments. If this throws
	  // an exception, reject p with it and return p.
	  let requestObject;

	  try {
	    requestObject = new Request(input, init);
	  } catch (e) {
	    p.reject(e);
	    return p.promise
	  }

	  // 3. Let request be requestObject’s request.
	  const request = requestObject[kState];

	  // 4. If requestObject’s signal’s aborted flag is set, then:
	  if (requestObject.signal.aborted) {
	    // 1. Abort the fetch() call with p, request, null, and
	    //    requestObject’s signal’s abort reason.
	    abortFetch(p, request, null, requestObject.signal.reason);

	    // 2. Return p.
	    return p.promise
	  }

	  // 5. Let globalObject be request’s client’s global object.
	  const globalObject = request.client.globalObject;

	  // 6. If globalObject is a ServiceWorkerGlobalScope object, then set
	  // request’s service-workers mode to "none".
	  if (globalObject?.constructor?.name === 'ServiceWorkerGlobalScope') {
	    request.serviceWorkers = 'none';
	  }

	  // 7. Let responseObject be null.
	  let responseObject = null;

	  // 8. Let relevantRealm be this’s relevant Realm.
	  const relevantRealm = null;

	  // 9. Let locallyAborted be false.
	  let locallyAborted = false;

	  // 10. Let controller be null.
	  let controller = null;

	  // 11. Add the following abort steps to requestObject’s signal:
	  addAbortListener(
	    requestObject.signal,
	    () => {
	      // 1. Set locallyAborted to true.
	      locallyAborted = true;

	      // 2. Assert: controller is non-null.
	      assert(controller != null);

	      // 3. Abort controller with requestObject’s signal’s abort reason.
	      controller.abort(requestObject.signal.reason);

	      // 4. Abort the fetch() call with p, request, responseObject,
	      //    and requestObject’s signal’s abort reason.
	      abortFetch(p, request, responseObject, requestObject.signal.reason);
	    }
	  );

	  // 12. Let handleFetchDone given response response be to finalize and
	  // report timing with response, globalObject, and "fetch".
	  const handleFetchDone = (response) =>
	    finalizeAndReportTiming(response, 'fetch');

	  // 13. Set controller to the result of calling fetch given request,
	  // with processResponseEndOfBody set to handleFetchDone, and processResponse
	  // given response being these substeps:

	  const processResponse = (response) => {
	    // 1. If locallyAborted is true, terminate these substeps.
	    if (locallyAborted) {
	      return
	    }

	    // 2. If response’s aborted flag is set, then:
	    if (response.aborted) {
	      // 1. Let deserializedError be the result of deserialize a serialized
	      //    abort reason given controller’s serialized abort reason and
	      //    relevantRealm.

	      // 2. Abort the fetch() call with p, request, responseObject, and
	      //    deserializedError.

	      abortFetch(p, request, responseObject, controller.serializedAbortReason);
	      return
	    }

	    // 3. If response is a network error, then reject p with a TypeError
	    // and terminate these substeps.
	    if (response.type === 'error') {
	      p.reject(new TypeError('fetch failed', { cause: response.error }));
	      return
	    }

	    // 4. Set responseObject to the result of creating a Response object,
	    // given response, "immutable", and relevantRealm.
	    responseObject = fromInnerResponse(response, 'immutable', relevantRealm);

	    // 5. Resolve p with responseObject.
	    p.resolve(responseObject);
	  };

	  controller = fetching({
	    request,
	    processResponseEndOfBody: handleFetchDone,
	    processResponse,
	    dispatcher: requestObject[kDispatcher] // undici
	  });

	  // 14. Return p.
	  return p.promise
	}

	// https://fetch.spec.whatwg.org/#finalize-and-report-timing
	function finalizeAndReportTiming (response, initiatorType = 'other') {
	  // 1. If response is an aborted network error, then return.
	  if (response.type === 'error' && response.aborted) {
	    return
	  }

	  // 2. If response’s URL list is null or empty, then return.
	  if (!response.urlList?.length) {
	    return
	  }

	  // 3. Let originalURL be response’s URL list[0].
	  const originalURL = response.urlList[0];

	  // 4. Let timingInfo be response’s timing info.
	  let timingInfo = response.timingInfo;

	  // 5. Let cacheState be response’s cache state.
	  let cacheState = response.cacheState;

	  // 6. If originalURL’s scheme is not an HTTP(S) scheme, then return.
	  if (!urlIsHttpHttpsScheme(originalURL)) {
	    return
	  }

	  // 7. If timingInfo is null, then return.
	  if (timingInfo === null) {
	    return
	  }

	  // 8. If response’s timing allow passed flag is not set, then:
	  if (!response.timingAllowPassed) {
	    //  1. Set timingInfo to a the result of creating an opaque timing info for timingInfo.
	    timingInfo = createOpaqueTimingInfo({
	      startTime: timingInfo.startTime
	    });

	    //  2. Set cacheState to the empty string.
	    cacheState = '';
	  }

	  // 9. Set timingInfo’s end time to the coarsened shared current time
	  // given global’s relevant settings object’s cross-origin isolated
	  // capability.
	  // TODO: given global’s relevant settings object’s cross-origin isolated
	  // capability?
	  timingInfo.endTime = coarsenedSharedCurrentTime();

	  // 10. Set response’s timing info to timingInfo.
	  response.timingInfo = timingInfo;

	  // 11. Mark resource timing for timingInfo, originalURL, initiatorType,
	  // global, and cacheState.
	  markResourceTiming(
	    timingInfo,
	    originalURL.href,
	    initiatorType,
	    globalThis,
	    cacheState
	  );
	}

	// https://w3c.github.io/resource-timing/#dfn-mark-resource-timing
	const markResourceTiming = (nodeMajor > 18 || (nodeMajor === 18 && nodeMinor >= 2))
	  ? performance.markResourceTiming
	  : () => {};

	// https://fetch.spec.whatwg.org/#abort-fetch
	function abortFetch (p, request, responseObject, error) {
	  // 1. Reject promise with error.
	  p.reject(error);

	  // 2. If request’s body is not null and is readable, then cancel request’s
	  // body with error.
	  if (request.body != null && isReadable(request.body?.stream)) {
	    request.body.stream.cancel(error).catch((err) => {
	      if (err.code === 'ERR_INVALID_STATE') {
	        // Node bug?
	        return
	      }
	      throw err
	    });
	  }

	  // 3. If responseObject is null, then return.
	  if (responseObject == null) {
	    return
	  }

	  // 4. Let response be responseObject’s response.
	  const response = responseObject[kState];

	  // 5. If response’s body is not null and is readable, then error response’s
	  // body with error.
	  if (response.body != null && isReadable(response.body?.stream)) {
	    response.body.stream.cancel(error).catch((err) => {
	      if (err.code === 'ERR_INVALID_STATE') {
	        // Node bug?
	        return
	      }
	      throw err
	    });
	  }
	}

	// https://fetch.spec.whatwg.org/#fetching
	function fetching ({
	  request,
	  processRequestBodyChunkLength,
	  processRequestEndOfBody,
	  processResponse,
	  processResponseEndOfBody,
	  processResponseConsumeBody,
	  useParallelQueue = false,
	  dispatcher = getGlobalDispatcher() // undici
	}) {
	  // Ensure that the dispatcher is set accordingly
	  assert(dispatcher);

	  // 1. Let taskDestination be null.
	  let taskDestination = null;

	  // 2. Let crossOriginIsolatedCapability be false.
	  let crossOriginIsolatedCapability = false;

	  // 3. If request’s client is non-null, then:
	  if (request.client != null) {
	    // 1. Set taskDestination to request’s client’s global object.
	    taskDestination = request.client.globalObject;

	    // 2. Set crossOriginIsolatedCapability to request’s client’s cross-origin
	    // isolated capability.
	    crossOriginIsolatedCapability =
	      request.client.crossOriginIsolatedCapability;
	  }

	  // 4. If useParallelQueue is true, then set taskDestination to the result of
	  // starting a new parallel queue.
	  // TODO

	  // 5. Let timingInfo be a new fetch timing info whose start time and
	  // post-redirect start time are the coarsened shared current time given
	  // crossOriginIsolatedCapability.
	  const currentTime = coarsenedSharedCurrentTime(crossOriginIsolatedCapability);
	  const timingInfo = createOpaqueTimingInfo({
	    startTime: currentTime
	  });

	  // 6. Let fetchParams be a new fetch params whose
	  // request is request,
	  // timing info is timingInfo,
	  // process request body chunk length is processRequestBodyChunkLength,
	  // process request end-of-body is processRequestEndOfBody,
	  // process response is processResponse,
	  // process response consume body is processResponseConsumeBody,
	  // process response end-of-body is processResponseEndOfBody,
	  // task destination is taskDestination,
	  // and cross-origin isolated capability is crossOriginIsolatedCapability.
	  const fetchParams = {
	    controller: new Fetch(dispatcher),
	    request,
	    timingInfo,
	    processRequestBodyChunkLength,
	    processRequestEndOfBody,
	    processResponse,
	    processResponseConsumeBody,
	    processResponseEndOfBody,
	    taskDestination,
	    crossOriginIsolatedCapability
	  };

	  // 7. If request’s body is a byte sequence, then set request’s body to
	  //    request’s body as a body.
	  // NOTE: Since fetching is only called from fetch, body should already be
	  // extracted.
	  assert(!request.body || request.body.stream);

	  // 8. If request’s window is "client", then set request’s window to request’s
	  // client, if request’s client’s global object is a Window object; otherwise
	  // "no-window".
	  if (request.window === 'client') {
	    // TODO: What if request.client is null?
	    request.window =
	      request.client?.globalObject?.constructor?.name === 'Window'
	        ? request.client
	        : 'no-window';
	  }

	  // 9. If request’s origin is "client", then set request’s origin to request’s
	  // client’s origin.
	  if (request.origin === 'client') {
	    // TODO: What if request.client is null?
	    request.origin = request.client?.origin;
	  }

	  // 10. If all of the following conditions are true:
	  // TODO

	  // 11. If request’s policy container is "client", then:
	  if (request.policyContainer === 'client') {
	    // 1. If request’s client is non-null, then set request’s policy
	    // container to a clone of request’s client’s policy container. [HTML]
	    if (request.client != null) {
	      request.policyContainer = clonePolicyContainer(
	        request.client.policyContainer
	      );
	    } else {
	      // 2. Otherwise, set request’s policy container to a new policy
	      // container.
	      request.policyContainer = makePolicyContainer();
	    }
	  }

	  // 12. If request’s header list does not contain `Accept`, then:
	  if (!request.headersList.contains('accept', true)) {
	    // 1. Let value be `*/*`.
	    const value = '*/*';

	    // 2. A user agent should set value to the first matching statement, if
	    // any, switching on request’s destination:
	    // "document"
	    // "frame"
	    // "iframe"
	    // `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
	    // "image"
	    // `image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5`
	    // "style"
	    // `text/css,*/*;q=0.1`
	    // TODO

	    // 3. Append `Accept`/value to request’s header list.
	    request.headersList.append('accept', value, true);
	  }

	  // 13. If request’s header list does not contain `Accept-Language`, then
	  // user agents should append `Accept-Language`/an appropriate value to
	  // request’s header list.
	  if (!request.headersList.contains('accept-language', true)) {
	    request.headersList.append('accept-language', '*', true);
	  }

	  // 14. If request’s priority is null, then use request’s initiator and
	  // destination appropriately in setting request’s priority to a
	  // user-agent-defined object.
	  if (request.priority === null) ;

	  // 15. If request is a subresource request, then:
	  if (subresourceSet.has(request.destination)) ;

	  // 16. Run main fetch given fetchParams.
	  mainFetch(fetchParams)
	    .catch(err => {
	      fetchParams.controller.terminate(err);
	    });

	  // 17. Return fetchParam's controller
	  return fetchParams.controller
	}

	// https://fetch.spec.whatwg.org/#concept-main-fetch
	async function mainFetch (fetchParams, recursive = false) {
	  // 1. Let request be fetchParams’s request.
	  const request = fetchParams.request;

	  // 2. Let response be null.
	  let response = null;

	  // 3. If request’s local-URLs-only flag is set and request’s current URL is
	  // not local, then set response to a network error.
	  if (request.localURLsOnly && !urlIsLocal(requestCurrentURL(request))) {
	    response = makeNetworkError('local URLs only');
	  }

	  // 4. Run report Content Security Policy violations for request.
	  // TODO

	  // 5. Upgrade request to a potentially trustworthy URL, if appropriate.
	  tryUpgradeRequestToAPotentiallyTrustworthyURL(request);

	  // 6. If should request be blocked due to a bad port, should fetching request
	  // be blocked as mixed content, or should request be blocked by Content
	  // Security Policy returns blocked, then set response to a network error.
	  if (requestBadPort(request) === 'blocked') {
	    response = makeNetworkError('bad port');
	  }
	  // TODO: should fetching request be blocked as mixed content?
	  // TODO: should request be blocked by Content Security Policy?

	  // 7. If request’s referrer policy is the empty string, then set request’s
	  // referrer policy to request’s policy container’s referrer policy.
	  if (request.referrerPolicy === '') {
	    request.referrerPolicy = request.policyContainer.referrerPolicy;
	  }

	  // 8. If request’s referrer is not "no-referrer", then set request’s
	  // referrer to the result of invoking determine request’s referrer.
	  if (request.referrer !== 'no-referrer') {
	    request.referrer = determineRequestsReferrer(request);
	  }

	  // 9. Set request’s current URL’s scheme to "https" if all of the following
	  // conditions are true:
	  // - request’s current URL’s scheme is "http"
	  // - request’s current URL’s host is a domain
	  // - Matching request’s current URL’s host per Known HSTS Host Domain Name
	  //   Matching results in either a superdomain match with an asserted
	  //   includeSubDomains directive or a congruent match (with or without an
	  //   asserted includeSubDomains directive). [HSTS]
	  // TODO

	  // 10. If recursive is false, then run the remaining steps in parallel.
	  // TODO

	  // 11. If response is null, then set response to the result of running
	  // the steps corresponding to the first matching statement:
	  if (response === null) {
	    response = await (async () => {
	      const currentURL = requestCurrentURL(request);

	      if (
	        // - request’s current URL’s origin is same origin with request’s origin,
	        //   and request’s response tainting is "basic"
	        (sameOrigin(currentURL, request.url) && request.responseTainting === 'basic') ||
	        // request’s current URL’s scheme is "data"
	        (currentURL.protocol === 'data:') ||
	        // - request’s mode is "navigate" or "websocket"
	        (request.mode === 'navigate' || request.mode === 'websocket')
	      ) {
	        // 1. Set request’s response tainting to "basic".
	        request.responseTainting = 'basic';

	        // 2. Return the result of running scheme fetch given fetchParams.
	        return await schemeFetch(fetchParams)
	      }

	      // request’s mode is "same-origin"
	      if (request.mode === 'same-origin') {
	        // 1. Return a network error.
	        return makeNetworkError('request mode cannot be "same-origin"')
	      }

	      // request’s mode is "no-cors"
	      if (request.mode === 'no-cors') {
	        // 1. If request’s redirect mode is not "follow", then return a network
	        // error.
	        if (request.redirect !== 'follow') {
	          return makeNetworkError(
	            'redirect mode cannot be "follow" for "no-cors" request'
	          )
	        }

	        // 2. Set request’s response tainting to "opaque".
	        request.responseTainting = 'opaque';

	        // 3. Return the result of running scheme fetch given fetchParams.
	        return await schemeFetch(fetchParams)
	      }

	      // request’s current URL’s scheme is not an HTTP(S) scheme
	      if (!urlIsHttpHttpsScheme(requestCurrentURL(request))) {
	        // Return a network error.
	        return makeNetworkError('URL scheme must be a HTTP(S) scheme')
	      }

	      // - request’s use-CORS-preflight flag is set
	      // - request’s unsafe-request flag is set and either request’s method is
	      //   not a CORS-safelisted method or CORS-unsafe request-header names with
	      //   request’s header list is not empty
	      //    1. Set request’s response tainting to "cors".
	      //    2. Let corsWithPreflightResponse be the result of running HTTP fetch
	      //    given fetchParams and true.
	      //    3. If corsWithPreflightResponse is a network error, then clear cache
	      //    entries using request.
	      //    4. Return corsWithPreflightResponse.
	      // TODO

	      // Otherwise
	      //    1. Set request’s response tainting to "cors".
	      request.responseTainting = 'cors';

	      //    2. Return the result of running HTTP fetch given fetchParams.
	      return await httpFetch(fetchParams)
	    })();
	  }

	  // 12. If recursive is true, then return response.
	  if (recursive) {
	    return response
	  }

	  // 13. If response is not a network error and response is not a filtered
	  // response, then:
	  if (response.status !== 0 && !response.internalResponse) {
	    // If request’s response tainting is "cors", then:
	    if (request.responseTainting === 'cors') ;

	    // Set response to the following filtered response with response as its
	    // internal response, depending on request’s response tainting:
	    if (request.responseTainting === 'basic') {
	      response = filterResponse(response, 'basic');
	    } else if (request.responseTainting === 'cors') {
	      response = filterResponse(response, 'cors');
	    } else if (request.responseTainting === 'opaque') {
	      response = filterResponse(response, 'opaque');
	    } else {
	      assert(false);
	    }
	  }

	  // 14. Let internalResponse be response, if response is a network error,
	  // and response’s internal response otherwise.
	  let internalResponse =
	    response.status === 0 ? response : response.internalResponse;

	  // 15. If internalResponse’s URL list is empty, then set it to a clone of
	  // request’s URL list.
	  if (internalResponse.urlList.length === 0) {
	    internalResponse.urlList.push(...request.urlList);
	  }

	  // 16. If request’s timing allow failed flag is unset, then set
	  // internalResponse’s timing allow passed flag.
	  if (!request.timingAllowFailed) {
	    response.timingAllowPassed = true;
	  }

	  // 17. If response is not a network error and any of the following returns
	  // blocked
	  // - should internalResponse to request be blocked as mixed content
	  // - should internalResponse to request be blocked by Content Security Policy
	  // - should internalResponse to request be blocked due to its MIME type
	  // - should internalResponse to request be blocked due to nosniff
	  // TODO

	  // 18. If response’s type is "opaque", internalResponse’s status is 206,
	  // internalResponse’s range-requested flag is set, and request’s header
	  // list does not contain `Range`, then set response and internalResponse
	  // to a network error.
	  if (
	    response.type === 'opaque' &&
	    internalResponse.status === 206 &&
	    internalResponse.rangeRequested &&
	    !request.headers.contains('range', true)
	  ) {
	    response = internalResponse = makeNetworkError();
	  }

	  // 19. If response is not a network error and either request’s method is
	  // `HEAD` or `CONNECT`, or internalResponse’s status is a null body status,
	  // set internalResponse’s body to null and disregard any enqueuing toward
	  // it (if any).
	  if (
	    response.status !== 0 &&
	    (request.method === 'HEAD' ||
	      request.method === 'CONNECT' ||
	      nullBodyStatus.includes(internalResponse.status))
	  ) {
	    internalResponse.body = null;
	    fetchParams.controller.dump = true;
	  }

	  // 20. If request’s integrity metadata is not the empty string, then:
	  if (request.integrity) {
	    // 1. Let processBodyError be this step: run fetch finale given fetchParams
	    // and a network error.
	    const processBodyError = (reason) =>
	      fetchFinale(fetchParams, makeNetworkError(reason));

	    // 2. If request’s response tainting is "opaque", or response’s body is null,
	    // then run processBodyError and abort these steps.
	    if (request.responseTainting === 'opaque' || response.body == null) {
	      processBodyError(response.error);
	      return
	    }

	    // 3. Let processBody given bytes be these steps:
	    const processBody = (bytes) => {
	      // 1. If bytes do not match request’s integrity metadata,
	      // then run processBodyError and abort these steps. [SRI]
	      if (!bytesMatch(bytes, request.integrity)) {
	        processBodyError('integrity mismatch');
	        return
	      }

	      // 2. Set response’s body to bytes as a body.
	      response.body = safelyExtractBody(bytes)[0];

	      // 3. Run fetch finale given fetchParams and response.
	      fetchFinale(fetchParams, response);
	    };

	    // 4. Fully read response’s body given processBody and processBodyError.
	    await fullyReadBody(response.body, processBody, processBodyError);
	  } else {
	    // 21. Otherwise, run fetch finale given fetchParams and response.
	    fetchFinale(fetchParams, response);
	  }
	}

	// https://fetch.spec.whatwg.org/#concept-scheme-fetch
	// given a fetch params fetchParams
	function schemeFetch (fetchParams) {
	  // Note: since the connection is destroyed on redirect, which sets fetchParams to a
	  // cancelled state, we do not want this condition to trigger *unless* there have been
	  // no redirects. See https://github.com/nodejs/undici/issues/1776
	  // 1. If fetchParams is canceled, then return the appropriate network error for fetchParams.
	  if (isCancelled(fetchParams) && fetchParams.request.redirectCount === 0) {
	    return Promise.resolve(makeAppropriateNetworkError(fetchParams))
	  }

	  // 2. Let request be fetchParams’s request.
	  const { request } = fetchParams;

	  const { protocol: scheme } = requestCurrentURL(request);

	  // 3. Switch on request’s current URL’s scheme and run the associated steps:
	  switch (scheme) {
	    case 'about:': {
	      // If request’s current URL’s path is the string "blank", then return a new response
	      // whose status message is `OK`, header list is « (`Content-Type`, `text/html;charset=utf-8`) »,
	      // and body is the empty byte sequence as a body.

	      // Otherwise, return a network error.
	      return Promise.resolve(makeNetworkError('about scheme is not supported'))
	    }
	    case 'blob:': {
	      if (!resolveObjectURL) {
	        resolveObjectURL = require$$6.resolveObjectURL;
	      }

	      // 1. Let blobURLEntry be request’s current URL’s blob URL entry.
	      const blobURLEntry = requestCurrentURL(request);

	      // https://github.com/web-platform-tests/wpt/blob/7b0ebaccc62b566a1965396e5be7bb2bc06f841f/FileAPI/url/resources/fetch-tests.js#L52-L56
	      // Buffer.resolveObjectURL does not ignore URL queries.
	      if (blobURLEntry.search.length !== 0) {
	        return Promise.resolve(makeNetworkError('NetworkError when attempting to fetch resource.'))
	      }

	      const blob = resolveObjectURL(blobURLEntry.toString());

	      // 2. If request’s method is not `GET`, blobURLEntry is null, or blobURLEntry’s
	      //    object is not a Blob object, then return a network error.
	      if (request.method !== 'GET' || !isBlobLike(blob)) {
	        return Promise.resolve(makeNetworkError('invalid method'))
	      }

	      // 3. Let blob be blobURLEntry’s object.
	      // Note: done above

	      // 4. Let response be a new response.
	      const response = makeResponse();

	      // 5. Let fullLength be blob’s size.
	      const fullLength = blob.size;

	      // 6. Let serializedFullLength be fullLength, serialized and isomorphic encoded.
	      const serializedFullLength = isomorphicEncode(`${fullLength}`);

	      // 7. Let type be blob’s type.
	      const type = blob.type;

	      // 8. If request’s header list does not contain `Range`:
	      // 9. Otherwise:
	      if (!request.headersList.contains('range', true)) {
	        // 1. Let bodyWithType be the result of safely extracting blob.
	        // Note: in the FileAPI a blob "object" is a Blob *or* a MediaSource.
	        // In node, this can only ever be a Blob. Therefore we can safely
	        // use extractBody directly.
	        const bodyWithType = extractBody(blob);

	        // 2. Set response’s status message to `OK`.
	        response.statusText = 'OK';

	        // 3. Set response’s body to bodyWithType’s body.
	        response.body = bodyWithType[0];

	        // 4. Set response’s header list to « (`Content-Length`, serializedFullLength), (`Content-Type`, type) ».
	        response.headersList.set('content-length', serializedFullLength, true);
	        response.headersList.set('content-type', type, true);
	      } else {
	        // 1. Set response’s range-requested flag.
	        response.rangeRequested = true;

	        // 2. Let rangeHeader be the result of getting `Range` from request’s header list.
	        const rangeHeader = request.headersList.get('range', true);

	        // 3. Let rangeValue be the result of parsing a single range header value given rangeHeader and true.
	        const rangeValue = simpleRangeHeaderValue(rangeHeader, true);

	        // 4. If rangeValue is failure, then return a network error.
	        if (rangeValue === 'failure') {
	          return Promise.resolve(makeNetworkError('failed to fetch the data URL'))
	        }

	        // 5. Let (rangeStart, rangeEnd) be rangeValue.
	        let { rangeStartValue: rangeStart, rangeEndValue: rangeEnd } = rangeValue;

	        // 6. If rangeStart is null:
	        // 7. Otherwise:
	        if (rangeStart === null) {
	          // 1. Set rangeStart to fullLength − rangeEnd.
	          rangeStart = fullLength - rangeEnd;

	          // 2. Set rangeEnd to rangeStart + rangeEnd − 1.
	          rangeEnd = rangeStart + rangeEnd - 1;
	        } else {
	          // 1. If rangeStart is greater than or equal to fullLength, then return a network error.
	          if (rangeStart >= fullLength) {
	            return Promise.resolve(makeNetworkError('Range start is greater than the blob\'s size.'))
	          }

	          // 2. If rangeEnd is null or rangeEnd is greater than or equal to fullLength, then set
	          //    rangeEnd to fullLength − 1.
	          if (rangeEnd === null || rangeEnd >= fullLength) {
	            rangeEnd = fullLength - 1;
	          }
	        }

	        // 8. Let slicedBlob be the result of invoking slice blob given blob, rangeStart,
	        //    rangeEnd + 1, and type.
	        const slicedBlob = blob.slice(rangeStart, rangeEnd, type);

	        // 9. Let slicedBodyWithType be the result of safely extracting slicedBlob.
	        // Note: same reason as mentioned above as to why we use extractBody
	        const slicedBodyWithType = extractBody(slicedBlob);

	        // 10. Set response’s body to slicedBodyWithType’s body.
	        response.body = slicedBodyWithType[0];

	        // 11. Let serializedSlicedLength be slicedBlob’s size, serialized and isomorphic encoded.
	        const serializedSlicedLength = isomorphicEncode(`${slicedBlob.size}`);

	        // 12. Let contentRange be the result of invoking build a content range given rangeStart,
	        //     rangeEnd, and fullLength.
	        const contentRange = buildContentRange(rangeStart, rangeEnd, fullLength);

	        // 13. Set response’s status to 206.
	        response.status = 206;

	        // 14. Set response’s status message to `Partial Content`.
	        response.statusText = 'Partial Content';

	        // 15. Set response’s header list to « (`Content-Length`, serializedSlicedLength),
	        //     (`Content-Type`, type), (`Content-Range`, contentRange) ».
	        response.headersList.set('content-length', serializedSlicedLength, true);
	        response.headersList.set('content-type', type, true);
	        response.headersList.set('content-range', contentRange, true);
	      }

	      // 10. Return response.
	      return Promise.resolve(response)
	    }
	    case 'data:': {
	      // 1. Let dataURLStruct be the result of running the
	      //    data: URL processor on request’s current URL.
	      const currentURL = requestCurrentURL(request);
	      const dataURLStruct = dataURLProcessor(currentURL);

	      // 2. If dataURLStruct is failure, then return a
	      //    network error.
	      if (dataURLStruct === 'failure') {
	        return Promise.resolve(makeNetworkError('failed to fetch the data URL'))
	      }

	      // 3. Let mimeType be dataURLStruct’s MIME type, serialized.
	      const mimeType = serializeAMimeType(dataURLStruct.mimeType);

	      // 4. Return a response whose status message is `OK`,
	      //    header list is « (`Content-Type`, mimeType) »,
	      //    and body is dataURLStruct’s body as a body.
	      return Promise.resolve(makeResponse({
	        statusText: 'OK',
	        headersList: [
	          ['content-type', { name: 'Content-Type', value: mimeType }]
	        ],
	        body: safelyExtractBody(dataURLStruct.body)[0]
	      }))
	    }
	    case 'file:': {
	      // For now, unfortunate as it is, file URLs are left as an exercise for the reader.
	      // When in doubt, return a network error.
	      return Promise.resolve(makeNetworkError('not implemented... yet...'))
	    }
	    case 'http:':
	    case 'https:': {
	      // Return the result of running HTTP fetch given fetchParams.

	      return httpFetch(fetchParams)
	        .catch((err) => makeNetworkError(err))
	    }
	    default: {
	      return Promise.resolve(makeNetworkError('unknown scheme'))
	    }
	  }
	}

	// https://fetch.spec.whatwg.org/#finalize-response
	function finalizeResponse (fetchParams, response) {
	  // 1. Set fetchParams’s request’s done flag.
	  fetchParams.request.done = true;

	  // 2, If fetchParams’s process response done is not null, then queue a fetch
	  // task to run fetchParams’s process response done given response, with
	  // fetchParams’s task destination.
	  if (fetchParams.processResponseDone != null) {
	    queueMicrotask(() => fetchParams.processResponseDone(response));
	  }
	}

	// https://fetch.spec.whatwg.org/#fetch-finale
	function fetchFinale (fetchParams, response) {
	  // 1. Let timingInfo be fetchParams’s timing info.
	  let timingInfo = fetchParams.timingInfo;

	  // 2. If response is not a network error and fetchParams’s request’s client is a secure context,
	  //    then set timingInfo’s server-timing headers to the result of getting, decoding, and splitting
	  //    `Server-Timing` from response’s internal response’s header list.
	  // TODO

	  // 3. Let processResponseEndOfBody be the following steps:
	  const processResponseEndOfBody = () => {
	    // 1. Let unsafeEndTime be the unsafe shared current time.
	    const unsafeEndTime = Date.now(); // ?

	    // 2. If fetchParams’s request’s destination is "document", then set fetchParams’s controller’s
	    //    full timing info to fetchParams’s timing info.
	    if (fetchParams.request.destination === 'document') {
	      fetchParams.controller.fullTimingInfo = timingInfo;
	    }

	    // 3. Set fetchParams’s controller’s report timing steps to the following steps given a global object global:
	    fetchParams.controller.reportTimingSteps = () => {
	      // 1. If fetchParams’s request’s URL’s scheme is not an HTTP(S) scheme, then return.
	      if (fetchParams.request.url.protocol !== 'https:') {
	        return
	      }

	      // 2. Set timingInfo’s end time to the relative high resolution time given unsafeEndTime and global.
	      timingInfo.endTime = unsafeEndTime;

	      // 3. Let cacheState be response’s cache state.
	      let cacheState = response.cacheState;

	      // 4. Let bodyInfo be response’s body info.
	      const bodyInfo = response.bodyInfo;

	      // 5. If response’s timing allow passed flag is not set, then set timingInfo to the result of creating an
	      //    opaque timing info for timingInfo and set cacheState to the empty string.
	      if (!response.timingAllowPassed) {
	        timingInfo = createOpaqueTimingInfo(timingInfo);

	        cacheState = '';
	      }

	      // 6. Let responseStatus be 0.
	      let responseStatus = 0;

	      // 7. If fetchParams’s request’s mode is not "navigate" or response’s has-cross-origin-redirects is false:
	      if (fetchParams.request.mode !== 'navigator' || !response.hasCrossOriginRedirects) {
	        // 1. Set responseStatus to response’s status.
	        responseStatus = response.status;

	        // 2. Let mimeType be the result of extracting a MIME type from response’s header list.
	        const mimeType = extractMimeType(response.headersList);

	        // 3. If mimeType is not failure, then set bodyInfo’s content type to the result of minimizing a supported MIME type given mimeType.
	        if (mimeType !== 'failure') {
	          bodyInfo.contentType = minimizeSupportedMimeType(mimeType);
	        }
	      }

	      // 8. If fetchParams’s request’s initiator type is non-null, then mark resource timing given timingInfo,
	      //    fetchParams’s request’s URL, fetchParams’s request’s initiator type, global, cacheState, bodyInfo,
	      //    and responseStatus.
	      if (fetchParams.request.initiatorType != null) {
	        // TODO: update markresourcetiming
	        markResourceTiming(timingInfo, fetchParams.request.url.href, fetchParams.request.initiatorType, globalThis, cacheState, bodyInfo, responseStatus);
	      }
	    };

	    // 4. Let processResponseEndOfBodyTask be the following steps:
	    const processResponseEndOfBodyTask = () => {
	      // 1. Set fetchParams’s request’s done flag.
	      fetchParams.request.done = true;

	      // 2. If fetchParams’s process response end-of-body is non-null, then run fetchParams’s process
	      //    response end-of-body given response.
	      if (fetchParams.processResponseEndOfBody != null) {
	        queueMicrotask(() => fetchParams.processResponseEndOfBody(response));
	      }

	      // 3. If fetchParams’s request’s initiator type is non-null and fetchParams’s request’s client’s
	      //    global object is fetchParams’s task destination, then run fetchParams’s controller’s report
	      //    timing steps given fetchParams’s request’s client’s global object.
	      if (fetchParams.request.initiatorType != null) {
	        fetchParams.controller.reportTimingSteps();
	      }
	    };

	    // 5. Queue a fetch task to run processResponseEndOfBodyTask with fetchParams’s task destination
	    queueMicrotask(() => processResponseEndOfBodyTask());
	  };

	  // 4. If fetchParams’s process response is non-null, then queue a fetch task to run fetchParams’s
	  //    process response given response, with fetchParams’s task destination.
	  if (fetchParams.processResponse != null) {
	    queueMicrotask(() => fetchParams.processResponse(response));
	  }

	  // 5. Let internalResponse be response, if response is a network error; otherwise response’s internal response.
	  const internalResponse = response.type === 'error' ? response : (response.internalResponse ?? response);

	  // 6. If internalResponse’s body is null, then run processResponseEndOfBody.
	  // 7. Otherwise:
	  if (internalResponse.body == null) {
	    processResponseEndOfBody();
	  } else {
	    // 1. Let transformStream be a new TransformStream.
	    // 2. Let identityTransformAlgorithm be an algorithm which, given chunk, enqueues chunk in transformStream.
	    // 3. Set up transformStream with transformAlgorithm set to identityTransformAlgorithm and flushAlgorithm
	    //    set to processResponseEndOfBody.
	    const transformStream = new TransformStream({
	      start () { },
	      transform (chunk, controller) {
	        controller.enqueue(chunk);
	      },
	      flush: processResponseEndOfBody
	    });

	    // 4. Set internalResponse’s body’s stream to the result of internalResponse’s body’s stream piped through transformStream.
	    internalResponse.body.stream.pipeThrough(transformStream);

	    const byteStream = new ReadableStream({
	      readableStream: transformStream.readable,
	      async start () {
	        this._bodyReader = this.readableStream.getReader();
	      },
	      async pull (controller) {
	        while (controller.desiredSize >= 0) {
	          const { done, value } = await this._bodyReader.read();

	          if (done) {
	            queueMicrotask(() => readableStreamClose(controller));
	            break
	          }

	          controller.enqueue(value);
	        }
	      },
	      type: 'bytes'
	    });

	    internalResponse.body.stream = byteStream;
	  }
	}

	// https://fetch.spec.whatwg.org/#http-fetch
	async function httpFetch (fetchParams) {
	  // 1. Let request be fetchParams’s request.
	  const request = fetchParams.request;

	  // 2. Let response be null.
	  let response = null;

	  // 3. Let actualResponse be null.
	  let actualResponse = null;

	  // 4. Let timingInfo be fetchParams’s timing info.
	  const timingInfo = fetchParams.timingInfo;

	  // 5. If request’s service-workers mode is "all", then:
	  if (request.serviceWorkers === 'all') ;

	  // 6. If response is null, then:
	  if (response === null) {
	    // 1. If makeCORSPreflight is true and one of these conditions is true:
	    // TODO

	    // 2. If request’s redirect mode is "follow", then set request’s
	    // service-workers mode to "none".
	    if (request.redirect === 'follow') {
	      request.serviceWorkers = 'none';
	    }

	    // 3. Set response and actualResponse to the result of running
	    // HTTP-network-or-cache fetch given fetchParams.
	    actualResponse = response = await httpNetworkOrCacheFetch(fetchParams);

	    // 4. If request’s response tainting is "cors" and a CORS check
	    // for request and response returns failure, then return a network error.
	    if (
	      request.responseTainting === 'cors' &&
	      corsCheck(request, response) === 'failure'
	    ) {
	      return makeNetworkError('cors failure')
	    }

	    // 5. If the TAO check for request and response returns failure, then set
	    // request’s timing allow failed flag.
	    if (TAOCheck(request, response) === 'failure') {
	      request.timingAllowFailed = true;
	    }
	  }

	  // 7. If either request’s response tainting or response’s type
	  // is "opaque", and the cross-origin resource policy check with
	  // request’s origin, request’s client, request’s destination,
	  // and actualResponse returns blocked, then return a network error.
	  if (
	    (request.responseTainting === 'opaque' || response.type === 'opaque') &&
	    crossOriginResourcePolicyCheck(
	      request.origin,
	      request.client,
	      request.destination,
	      actualResponse
	    ) === 'blocked'
	  ) {
	    return makeNetworkError('blocked')
	  }

	  // 8. If actualResponse’s status is a redirect status, then:
	  if (redirectStatusSet.has(actualResponse.status)) {
	    // 1. If actualResponse’s status is not 303, request’s body is not null,
	    // and the connection uses HTTP/2, then user agents may, and are even
	    // encouraged to, transmit an RST_STREAM frame.
	    // See, https://github.com/whatwg/fetch/issues/1288
	    if (request.redirect !== 'manual') {
	      fetchParams.controller.connection.destroy(undefined, false);
	    }

	    // 2. Switch on request’s redirect mode:
	    if (request.redirect === 'error') {
	      // Set response to a network error.
	      response = makeNetworkError('unexpected redirect');
	    } else if (request.redirect === 'manual') {
	      // Set response to an opaque-redirect filtered response whose internal
	      // response is actualResponse.
	      // NOTE(spec): On the web this would return an `opaqueredirect` response,
	      // but that doesn't make sense server side.
	      // See https://github.com/nodejs/undici/issues/1193.
	      response = actualResponse;
	    } else if (request.redirect === 'follow') {
	      // Set response to the result of running HTTP-redirect fetch given
	      // fetchParams and response.
	      response = await httpRedirectFetch(fetchParams, response);
	    } else {
	      assert(false);
	    }
	  }

	  // 9. Set response’s timing info to timingInfo.
	  response.timingInfo = timingInfo;

	  // 10. Return response.
	  return response
	}

	// https://fetch.spec.whatwg.org/#http-redirect-fetch
	function httpRedirectFetch (fetchParams, response) {
	  // 1. Let request be fetchParams’s request.
	  const request = fetchParams.request;

	  // 2. Let actualResponse be response, if response is not a filtered response,
	  // and response’s internal response otherwise.
	  const actualResponse = response.internalResponse
	    ? response.internalResponse
	    : response;

	  // 3. Let locationURL be actualResponse’s location URL given request’s current
	  // URL’s fragment.
	  let locationURL;

	  try {
	    locationURL = responseLocationURL(
	      actualResponse,
	      requestCurrentURL(request).hash
	    );

	    // 4. If locationURL is null, then return response.
	    if (locationURL == null) {
	      return response
	    }
	  } catch (err) {
	    // 5. If locationURL is failure, then return a network error.
	    return Promise.resolve(makeNetworkError(err))
	  }

	  // 6. If locationURL’s scheme is not an HTTP(S) scheme, then return a network
	  // error.
	  if (!urlIsHttpHttpsScheme(locationURL)) {
	    return Promise.resolve(makeNetworkError('URL scheme must be a HTTP(S) scheme'))
	  }

	  // 7. If request’s redirect count is 20, then return a network error.
	  if (request.redirectCount === 20) {
	    return Promise.resolve(makeNetworkError('redirect count exceeded'))
	  }

	  // 8. Increase request’s redirect count by 1.
	  request.redirectCount += 1;

	  // 9. If request’s mode is "cors", locationURL includes credentials, and
	  // request’s origin is not same origin with locationURL’s origin, then return
	  //  a network error.
	  if (
	    request.mode === 'cors' &&
	    (locationURL.username || locationURL.password) &&
	    !sameOrigin(request, locationURL)
	  ) {
	    return Promise.resolve(makeNetworkError('cross origin not allowed for request mode "cors"'))
	  }

	  // 10. If request’s response tainting is "cors" and locationURL includes
	  // credentials, then return a network error.
	  if (
	    request.responseTainting === 'cors' &&
	    (locationURL.username || locationURL.password)
	  ) {
	    return Promise.resolve(makeNetworkError(
	      'URL cannot contain credentials for request mode "cors"'
	    ))
	  }

	  // 11. If actualResponse’s status is not 303, request’s body is non-null,
	  // and request’s body’s source is null, then return a network error.
	  if (
	    actualResponse.status !== 303 &&
	    request.body != null &&
	    request.body.source == null
	  ) {
	    return Promise.resolve(makeNetworkError())
	  }

	  // 12. If one of the following is true
	  // - actualResponse’s status is 301 or 302 and request’s method is `POST`
	  // - actualResponse’s status is 303 and request’s method is not `GET` or `HEAD`
	  if (
	    ([301, 302].includes(actualResponse.status) && request.method === 'POST') ||
	    (actualResponse.status === 303 &&
	      !GET_OR_HEAD.includes(request.method))
	  ) {
	    // then:
	    // 1. Set request’s method to `GET` and request’s body to null.
	    request.method = 'GET';
	    request.body = null;

	    // 2. For each headerName of request-body-header name, delete headerName from
	    // request’s header list.
	    for (const headerName of requestBodyHeader) {
	      request.headersList.delete(headerName);
	    }
	  }

	  // 13. If request’s current URL’s origin is not same origin with locationURL’s
	  //     origin, then for each headerName of CORS non-wildcard request-header name,
	  //     delete headerName from request’s header list.
	  if (!sameOrigin(requestCurrentURL(request), locationURL)) {
	    // https://fetch.spec.whatwg.org/#cors-non-wildcard-request-header-name
	    request.headersList.delete('authorization', true);

	    // https://fetch.spec.whatwg.org/#authentication-entries
	    request.headersList.delete('proxy-authorization', true);

	    // "Cookie" and "Host" are forbidden request-headers, which undici doesn't implement.
	    request.headersList.delete('cookie', true);
	    request.headersList.delete('host', true);
	  }

	  // 14. If request’s body is non-null, then set request’s body to the first return
	  // value of safely extracting request’s body’s source.
	  if (request.body != null) {
	    assert(request.body.source != null);
	    request.body = safelyExtractBody(request.body.source)[0];
	  }

	  // 15. Let timingInfo be fetchParams’s timing info.
	  const timingInfo = fetchParams.timingInfo;

	  // 16. Set timingInfo’s redirect end time and post-redirect start time to the
	  // coarsened shared current time given fetchParams’s cross-origin isolated
	  // capability.
	  timingInfo.redirectEndTime = timingInfo.postRedirectStartTime =
	    coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);

	  // 17. If timingInfo’s redirect start time is 0, then set timingInfo’s
	  //  redirect start time to timingInfo’s start time.
	  if (timingInfo.redirectStartTime === 0) {
	    timingInfo.redirectStartTime = timingInfo.startTime;
	  }

	  // 18. Append locationURL to request’s URL list.
	  request.urlList.push(locationURL);

	  // 19. Invoke set request’s referrer policy on redirect on request and
	  // actualResponse.
	  setRequestReferrerPolicyOnRedirect(request, actualResponse);

	  // 20. Return the result of running main fetch given fetchParams and true.
	  return mainFetch(fetchParams, true)
	}

	// https://fetch.spec.whatwg.org/#http-network-or-cache-fetch
	async function httpNetworkOrCacheFetch (
	  fetchParams,
	  isAuthenticationFetch = false,
	  isNewConnectionFetch = false
	) {
	  // 1. Let request be fetchParams’s request.
	  const request = fetchParams.request;

	  // 2. Let httpFetchParams be null.
	  let httpFetchParams = null;

	  // 3. Let httpRequest be null.
	  let httpRequest = null;

	  // 4. Let response be null.
	  let response = null;

	  // 8. Run these steps, but abort when the ongoing fetch is terminated:

	  //    1. If request’s window is "no-window" and request’s redirect mode is
	  //    "error", then set httpFetchParams to fetchParams and httpRequest to
	  //    request.
	  if (request.window === 'no-window' && request.redirect === 'error') {
	    httpFetchParams = fetchParams;
	    httpRequest = request;
	  } else {
	    // Otherwise:

	    // 1. Set httpRequest to a clone of request.
	    httpRequest = cloneRequest(request);

	    // 2. Set httpFetchParams to a copy of fetchParams.
	    httpFetchParams = { ...fetchParams };

	    // 3. Set httpFetchParams’s request to httpRequest.
	    httpFetchParams.request = httpRequest;
	  }

	  //    3. Let includeCredentials be true if one of
	  const includeCredentials =
	    request.credentials === 'include' ||
	    (request.credentials === 'same-origin' &&
	      request.responseTainting === 'basic');

	  //    4. Let contentLength be httpRequest’s body’s length, if httpRequest’s
	  //    body is non-null; otherwise null.
	  const contentLength = httpRequest.body ? httpRequest.body.length : null;

	  //    5. Let contentLengthHeaderValue be null.
	  let contentLengthHeaderValue = null;

	  //    6. If httpRequest’s body is null and httpRequest’s method is `POST` or
	  //    `PUT`, then set contentLengthHeaderValue to `0`.
	  if (
	    httpRequest.body == null &&
	    ['POST', 'PUT'].includes(httpRequest.method)
	  ) {
	    contentLengthHeaderValue = '0';
	  }

	  //    7. If contentLength is non-null, then set contentLengthHeaderValue to
	  //    contentLength, serialized and isomorphic encoded.
	  if (contentLength != null) {
	    contentLengthHeaderValue = isomorphicEncode(`${contentLength}`);
	  }

	  //    8. If contentLengthHeaderValue is non-null, then append
	  //    `Content-Length`/contentLengthHeaderValue to httpRequest’s header
	  //    list.
	  if (contentLengthHeaderValue != null) {
	    httpRequest.headersList.append('content-length', contentLengthHeaderValue, true);
	  }

	  //    9. If contentLengthHeaderValue is non-null, then append (`Content-Length`,
	  //    contentLengthHeaderValue) to httpRequest’s header list.

	  //    10. If contentLength is non-null and httpRequest’s keepalive is true,
	  //    then:
	  if (contentLength != null && httpRequest.keepalive) ;

	  //    11. If httpRequest’s referrer is a URL, then append
	  //    `Referer`/httpRequest’s referrer, serialized and isomorphic encoded,
	  //     to httpRequest’s header list.
	  if (httpRequest.referrer instanceof URL) {
	    httpRequest.headersList.append('referer', isomorphicEncode(httpRequest.referrer.href), true);
	  }

	  //    12. Append a request `Origin` header for httpRequest.
	  appendRequestOriginHeader(httpRequest);

	  //    13. Append the Fetch metadata headers for httpRequest. [FETCH-METADATA]
	  appendFetchMetadata(httpRequest);

	  //    14. If httpRequest’s header list does not contain `User-Agent`, then
	  //    user agents should append `User-Agent`/default `User-Agent` value to
	  //    httpRequest’s header list.
	  if (!httpRequest.headersList.contains('user-agent', true)) {
	    httpRequest.headersList.append('user-agent', defaultUserAgent);
	  }

	  //    15. If httpRequest’s cache mode is "default" and httpRequest’s header
	  //    list contains `If-Modified-Since`, `If-None-Match`,
	  //    `If-Unmodified-Since`, `If-Match`, or `If-Range`, then set
	  //    httpRequest’s cache mode to "no-store".
	  if (
	    httpRequest.cache === 'default' &&
	    (httpRequest.headersList.contains('if-modified-since', true) ||
	      httpRequest.headersList.contains('if-none-match', true) ||
	      httpRequest.headersList.contains('if-unmodified-since', true) ||
	      httpRequest.headersList.contains('if-match', true) ||
	      httpRequest.headersList.contains('if-range', true))
	  ) {
	    httpRequest.cache = 'no-store';
	  }

	  //    16. If httpRequest’s cache mode is "no-cache", httpRequest’s prevent
	  //    no-cache cache-control header modification flag is unset, and
	  //    httpRequest’s header list does not contain `Cache-Control`, then append
	  //    `Cache-Control`/`max-age=0` to httpRequest’s header list.
	  if (
	    httpRequest.cache === 'no-cache' &&
	    !httpRequest.preventNoCacheCacheControlHeaderModification &&
	    !httpRequest.headersList.contains('cache-control', true)
	  ) {
	    httpRequest.headersList.append('cache-control', 'max-age=0', true);
	  }

	  //    17. If httpRequest’s cache mode is "no-store" or "reload", then:
	  if (httpRequest.cache === 'no-store' || httpRequest.cache === 'reload') {
	    // 1. If httpRequest’s header list does not contain `Pragma`, then append
	    // `Pragma`/`no-cache` to httpRequest’s header list.
	    if (!httpRequest.headersList.contains('pragma', true)) {
	      httpRequest.headersList.append('pragma', 'no-cache', true);
	    }

	    // 2. If httpRequest’s header list does not contain `Cache-Control`,
	    // then append `Cache-Control`/`no-cache` to httpRequest’s header list.
	    if (!httpRequest.headersList.contains('cache-control', true)) {
	      httpRequest.headersList.append('cache-control', 'no-cache', true);
	    }
	  }

	  //    18. If httpRequest’s header list contains `Range`, then append
	  //    `Accept-Encoding`/`identity` to httpRequest’s header list.
	  if (httpRequest.headersList.contains('range', true)) {
	    httpRequest.headersList.append('accept-encoding', 'identity', true);
	  }

	  //    19. Modify httpRequest’s header list per HTTP. Do not append a given
	  //    header if httpRequest’s header list contains that header’s name.
	  //    TODO: https://github.com/whatwg/fetch/issues/1285#issuecomment-896560129
	  if (!httpRequest.headersList.contains('accept-encoding', true)) {
	    if (urlHasHttpsScheme(requestCurrentURL(httpRequest))) {
	      httpRequest.headersList.append('accept-encoding', 'br, gzip, deflate', true);
	    } else {
	      httpRequest.headersList.append('accept-encoding', 'gzip, deflate', true);
	    }
	  }

	  httpRequest.headersList.delete('host', true);

	  //    21. If there’s a proxy-authentication entry, use it as appropriate.
	  //    TODO: proxy-authentication

	  //    22. Set httpCache to the result of determining the HTTP cache
	  //    partition, given httpRequest.
	  //    TODO: cache

	  //    23. If httpCache is null, then set httpRequest’s cache mode to
	  //    "no-store".
	  {
	    httpRequest.cache = 'no-store';
	  }

	  //    24. If httpRequest’s cache mode is neither "no-store" nor "reload",
	  //    then:
	  if (httpRequest.mode !== 'no-store' && httpRequest.mode !== 'reload') ;

	  // 9. If aborted, then return the appropriate network error for fetchParams.
	  // TODO

	  // 10. If response is null, then:
	  if (response == null) {
	    // 1. If httpRequest’s cache mode is "only-if-cached", then return a
	    // network error.
	    if (httpRequest.mode === 'only-if-cached') {
	      return makeNetworkError('only if cached')
	    }

	    // 2. Let forwardResponse be the result of running HTTP-network fetch
	    // given httpFetchParams, includeCredentials, and isNewConnectionFetch.
	    const forwardResponse = await httpNetworkFetch(
	      httpFetchParams,
	      includeCredentials,
	      isNewConnectionFetch
	    );

	    // 3. If httpRequest’s method is unsafe and forwardResponse’s status is
	    // in the range 200 to 399, inclusive, invalidate appropriate stored
	    // responses in httpCache, as per the "Invalidation" chapter of HTTP
	    // Caching, and set storedResponse to null. [HTTP-CACHING]
	    if (
	      !safeMethodsSet.has(httpRequest.method) &&
	      forwardResponse.status >= 200 &&
	      forwardResponse.status <= 399
	    ) ;

	    // 5. If response is null, then:
	    if (response == null) {
	      // 1. Set response to forwardResponse.
	      response = forwardResponse;

	      // 2. Store httpRequest and forwardResponse in httpCache, as per the
	      // "Storing Responses in Caches" chapter of HTTP Caching. [HTTP-CACHING]
	      // TODO: cache
	    }
	  }

	  // 11. Set response’s URL list to a clone of httpRequest’s URL list.
	  response.urlList = [...httpRequest.urlList];

	  // 12. If httpRequest’s header list contains `Range`, then set response’s
	  // range-requested flag.
	  if (httpRequest.headersList.contains('range', true)) {
	    response.rangeRequested = true;
	  }

	  // 13. Set response’s request-includes-credentials to includeCredentials.
	  response.requestIncludesCredentials = includeCredentials;

	  // 14. If response’s status is 401, httpRequest’s response tainting is not
	  // "cors", includeCredentials is true, and request’s window is an environment
	  // settings object, then:
	  // TODO

	  // 15. If response’s status is 407, then:
	  if (response.status === 407) {
	    // 1. If request’s window is "no-window", then return a network error.
	    if (request.window === 'no-window') {
	      return makeNetworkError()
	    }

	    // 2. ???

	    // 3. If fetchParams is canceled, then return the appropriate network error for fetchParams.
	    if (isCancelled(fetchParams)) {
	      return makeAppropriateNetworkError(fetchParams)
	    }

	    // 4. Prompt the end user as appropriate in request’s window and store
	    // the result as a proxy-authentication entry. [HTTP-AUTH]
	    // TODO: Invoke some kind of callback?

	    // 5. Set response to the result of running HTTP-network-or-cache fetch given
	    // fetchParams.
	    // TODO
	    return makeNetworkError('proxy authentication required')
	  }

	  // 16. If all of the following are true
	  if (
	    // response’s status is 421
	    response.status === 421 &&
	    // isNewConnectionFetch is false
	    !isNewConnectionFetch &&
	    // request’s body is null, or request’s body is non-null and request’s body’s source is non-null
	    (request.body == null || request.body.source != null)
	  ) {
	    // then:

	    // 1. If fetchParams is canceled, then return the appropriate network error for fetchParams.
	    if (isCancelled(fetchParams)) {
	      return makeAppropriateNetworkError(fetchParams)
	    }

	    // 2. Set response to the result of running HTTP-network-or-cache
	    // fetch given fetchParams, isAuthenticationFetch, and true.

	    // TODO (spec): The spec doesn't specify this but we need to cancel
	    // the active response before we can start a new one.
	    // https://github.com/whatwg/fetch/issues/1293
	    fetchParams.controller.connection.destroy();

	    response = await httpNetworkOrCacheFetch(
	      fetchParams,
	      isAuthenticationFetch,
	      true
	    );
	  }

	  // 18. Return response.
	  return response
	}

	// https://fetch.spec.whatwg.org/#http-network-fetch
	async function httpNetworkFetch (
	  fetchParams,
	  includeCredentials = false,
	  forceNewConnection = false
	) {
	  assert(!fetchParams.controller.connection || fetchParams.controller.connection.destroyed);

	  fetchParams.controller.connection = {
	    abort: null,
	    destroyed: false,
	    destroy (err, abort = true) {
	      if (!this.destroyed) {
	        this.destroyed = true;
	        if (abort) {
	          this.abort?.(err ?? new DOMException('The operation was aborted.', 'AbortError'));
	        }
	      }
	    }
	  };

	  // 1. Let request be fetchParams’s request.
	  const request = fetchParams.request;

	  // 2. Let response be null.
	  let response = null;

	  // 3. Let timingInfo be fetchParams’s timing info.
	  const timingInfo = fetchParams.timingInfo;

	  // 5. If httpCache is null, then set request’s cache mode to "no-store".
	  {
	    request.cache = 'no-store';
	  }

	  // 8. Switch on request’s mode:
	  if (request.mode === 'websocket') ;

	  // 9. Run these steps, but abort when the ongoing fetch is terminated:

	  //    1. If connection is failure, then return a network error.

	  //    2. Set timingInfo’s final connection timing info to the result of
	  //    calling clamp and coarsen connection timing info with connection’s
	  //    timing info, timingInfo’s post-redirect start time, and fetchParams’s
	  //    cross-origin isolated capability.

	  //    3. If connection is not an HTTP/2 connection, request’s body is non-null,
	  //    and request’s body’s source is null, then append (`Transfer-Encoding`,
	  //    `chunked`) to request’s header list.

	  //    4. Set timingInfo’s final network-request start time to the coarsened
	  //    shared current time given fetchParams’s cross-origin isolated
	  //    capability.

	  //    5. Set response to the result of making an HTTP request over connection
	  //    using request with the following caveats:

	  //        - Follow the relevant requirements from HTTP. [HTTP] [HTTP-SEMANTICS]
	  //        [HTTP-COND] [HTTP-CACHING] [HTTP-AUTH]

	  //        - If request’s body is non-null, and request’s body’s source is null,
	  //        then the user agent may have a buffer of up to 64 kibibytes and store
	  //        a part of request’s body in that buffer. If the user agent reads from
	  //        request’s body beyond that buffer’s size and the user agent needs to
	  //        resend request, then instead return a network error.

	  //        - Set timingInfo’s final network-response start time to the coarsened
	  //        shared current time given fetchParams’s cross-origin isolated capability,
	  //        immediately after the user agent’s HTTP parser receives the first byte
	  //        of the response (e.g., frame header bytes for HTTP/2 or response status
	  //        line for HTTP/1.x).

	  //        - Wait until all the headers are transmitted.

	  //        - Any responses whose status is in the range 100 to 199, inclusive,
	  //        and is not 101, are to be ignored, except for the purposes of setting
	  //        timingInfo’s final network-response start time above.

	  //    - If request’s header list contains `Transfer-Encoding`/`chunked` and
	  //    response is transferred via HTTP/1.0 or older, then return a network
	  //    error.

	  //    - If the HTTP request results in a TLS client certificate dialog, then:

	  //        1. If request’s window is an environment settings object, make the
	  //        dialog available in request’s window.

	  //        2. Otherwise, return a network error.

	  // To transmit request’s body body, run these steps:
	  let requestBody = null;
	  // 1. If body is null and fetchParams’s process request end-of-body is
	  // non-null, then queue a fetch task given fetchParams’s process request
	  // end-of-body and fetchParams’s task destination.
	  if (request.body == null && fetchParams.processRequestEndOfBody) {
	    queueMicrotask(() => fetchParams.processRequestEndOfBody());
	  } else if (request.body != null) {
	    // 2. Otherwise, if body is non-null:

	    //    1. Let processBodyChunk given bytes be these steps:
	    const processBodyChunk = async function * (bytes) {
	      // 1. If the ongoing fetch is terminated, then abort these steps.
	      if (isCancelled(fetchParams)) {
	        return
	      }

	      // 2. Run this step in parallel: transmit bytes.
	      yield bytes;

	      // 3. If fetchParams’s process request body is non-null, then run
	      // fetchParams’s process request body given bytes’s length.
	      fetchParams.processRequestBodyChunkLength?.(bytes.byteLength);
	    };

	    // 2. Let processEndOfBody be these steps:
	    const processEndOfBody = () => {
	      // 1. If fetchParams is canceled, then abort these steps.
	      if (isCancelled(fetchParams)) {
	        return
	      }

	      // 2. If fetchParams’s process request end-of-body is non-null,
	      // then run fetchParams’s process request end-of-body.
	      if (fetchParams.processRequestEndOfBody) {
	        fetchParams.processRequestEndOfBody();
	      }
	    };

	    // 3. Let processBodyError given e be these steps:
	    const processBodyError = (e) => {
	      // 1. If fetchParams is canceled, then abort these steps.
	      if (isCancelled(fetchParams)) {
	        return
	      }

	      // 2. If e is an "AbortError" DOMException, then abort fetchParams’s controller.
	      if (e.name === 'AbortError') {
	        fetchParams.controller.abort();
	      } else {
	        fetchParams.controller.terminate(e);
	      }
	    };

	    // 4. Incrementally read request’s body given processBodyChunk, processEndOfBody,
	    // processBodyError, and fetchParams’s task destination.
	    requestBody = (async function * () {
	      try {
	        for await (const bytes of request.body.stream) {
	          yield * processBodyChunk(bytes);
	        }
	        processEndOfBody();
	      } catch (err) {
	        processBodyError(err);
	      }
	    })();
	  }

	  try {
	    // socket is only provided for websockets
	    const { body, status, statusText, headersList, socket } = await dispatch({ body: requestBody });

	    if (socket) {
	      response = makeResponse({ status, statusText, headersList, socket });
	    } else {
	      const iterator = body[Symbol.asyncIterator]();
	      fetchParams.controller.next = () => iterator.next();

	      response = makeResponse({ status, statusText, headersList });
	    }
	  } catch (err) {
	    // 10. If aborted, then:
	    if (err.name === 'AbortError') {
	      // 1. If connection uses HTTP/2, then transmit an RST_STREAM frame.
	      fetchParams.controller.connection.destroy();

	      // 2. Return the appropriate network error for fetchParams.
	      return makeAppropriateNetworkError(fetchParams, err)
	    }

	    return makeNetworkError(err)
	  }

	  // 11. Let pullAlgorithm be an action that resumes the ongoing fetch
	  // if it is suspended.
	  const pullAlgorithm = async () => {
	    await fetchParams.controller.resume();
	  };

	  // 12. Let cancelAlgorithm be an algorithm that aborts fetchParams’s
	  // controller with reason, given reason.
	  const cancelAlgorithm = (reason) => {
	    fetchParams.controller.abort(reason);
	  };

	  // 13. Let highWaterMark be a non-negative, non-NaN number, chosen by
	  // the user agent.
	  // TODO

	  // 14. Let sizeAlgorithm be an algorithm that accepts a chunk object
	  // and returns a non-negative, non-NaN, non-infinite number, chosen by the user agent.
	  // TODO

	  // 15. Let stream be a new ReadableStream.
	  // 16. Set up stream with byte reading support with pullAlgorithm set to pullAlgorithm,
	  //     cancelAlgorithm set to cancelAlgorithm.
	  const stream = new ReadableStream(
	    {
	      async start (controller) {
	        fetchParams.controller.controller = controller;
	      },
	      async pull (controller) {
	        await pullAlgorithm();
	      },
	      async cancel (reason) {
	        await cancelAlgorithm(reason);
	      },
	      type: 'bytes'
	    }
	  );

	  // 17. Run these steps, but abort when the ongoing fetch is terminated:

	  //    1. Set response’s body to a new body whose stream is stream.
	  response.body = { stream, source: null, length: null };

	  //    2. If response is not a network error and request’s cache mode is
	  //    not "no-store", then update response in httpCache for request.
	  //    TODO

	  //    3. If includeCredentials is true and the user agent is not configured
	  //    to block cookies for request (see section 7 of [COOKIES]), then run the
	  //    "set-cookie-string" parsing algorithm (see section 5.2 of [COOKIES]) on
	  //    the value of each header whose name is a byte-case-insensitive match for
	  //    `Set-Cookie` in response’s header list, if any, and request’s current URL.
	  //    TODO

	  // 18. If aborted, then:
	  // TODO

	  // 19. Run these steps in parallel:

	  //    1. Run these steps, but abort when fetchParams is canceled:
	  fetchParams.controller.onAborted = onAborted;
	  fetchParams.controller.on('terminated', onAborted);
	  fetchParams.controller.resume = async () => {
	    // 1. While true
	    while (true) {
	      // 1-3. See onData...

	      // 4. Set bytes to the result of handling content codings given
	      // codings and bytes.
	      let bytes;
	      let isFailure;
	      try {
	        const { done, value } = await fetchParams.controller.next();

	        if (isAborted(fetchParams)) {
	          break
	        }

	        bytes = done ? undefined : value;
	      } catch (err) {
	        if (fetchParams.controller.ended && !timingInfo.encodedBodySize) {
	          // zlib doesn't like empty streams.
	          bytes = undefined;
	        } else {
	          bytes = err;

	          // err may be propagated from the result of calling readablestream.cancel,
	          // which might not be an error. https://github.com/nodejs/undici/issues/2009
	          isFailure = true;
	        }
	      }

	      if (bytes === undefined) {
	        // 2. Otherwise, if the bytes transmission for response’s message
	        // body is done normally and stream is readable, then close
	        // stream, finalize response for fetchParams and response, and
	        // abort these in-parallel steps.
	        readableStreamClose(fetchParams.controller.controller);

	        finalizeResponse(fetchParams, response);

	        return
	      }

	      // 5. Increase timingInfo’s decoded body size by bytes’s length.
	      timingInfo.decodedBodySize += bytes?.byteLength ?? 0;

	      // 6. If bytes is failure, then terminate fetchParams’s controller.
	      if (isFailure) {
	        fetchParams.controller.terminate(bytes);
	        return
	      }

	      // 7. Enqueue a Uint8Array wrapping an ArrayBuffer containing bytes
	      // into stream.
	      const buffer = new Uint8Array(bytes);
	      if (buffer.byteLength) {
	        fetchParams.controller.controller.enqueue(buffer);
	      }

	      // 8. If stream is errored, then terminate the ongoing fetch.
	      if (isErrored(stream)) {
	        fetchParams.controller.terminate();
	        return
	      }

	      // 9. If stream doesn’t need more data ask the user agent to suspend
	      // the ongoing fetch.
	      if (fetchParams.controller.controller.desiredSize <= 0) {
	        return
	      }
	    }
	  };

	  //    2. If aborted, then:
	  function onAborted (reason) {
	    // 2. If fetchParams is aborted, then:
	    if (isAborted(fetchParams)) {
	      // 1. Set response’s aborted flag.
	      response.aborted = true;

	      // 2. If stream is readable, then error stream with the result of
	      //    deserialize a serialized abort reason given fetchParams’s
	      //    controller’s serialized abort reason and an
	      //    implementation-defined realm.
	      if (isReadable(stream)) {
	        fetchParams.controller.controller.error(
	          fetchParams.controller.serializedAbortReason
	        );
	      }
	    } else {
	      // 3. Otherwise, if stream is readable, error stream with a TypeError.
	      if (isReadable(stream)) {
	        fetchParams.controller.controller.error(new TypeError('terminated', {
	          cause: isErrorLike(reason) ? reason : undefined
	        }));
	      }
	    }

	    // 4. If connection uses HTTP/2, then transmit an RST_STREAM frame.
	    // 5. Otherwise, the user agent should close connection unless it would be bad for performance to do so.
	    fetchParams.controller.connection.destroy();
	  }

	  // 20. Return response.
	  return response

	  function dispatch ({ body }) {
	    const url = requestCurrentURL(request);
	    /** @type {import('../..').Agent} */
	    const agent = fetchParams.controller.dispatcher;

	    return new Promise((resolve, reject) => agent.dispatch(
	      {
	        path: url.pathname + url.search,
	        origin: url.origin,
	        method: request.method,
	        body: agent.isMockActive ? request.body && (request.body.source || request.body.stream) : body,
	        headers: request.headersList.entries,
	        maxRedirections: 0,
	        upgrade: request.mode === 'websocket' ? 'websocket' : undefined
	      },
	      {
	        body: null,
	        abort: null,

	        onConnect (abort) {
	          // TODO (fix): Do we need connection here?
	          const { connection } = fetchParams.controller;

	          // Set timingInfo’s final connection timing info to the result of calling clamp and coarsen
	          // connection timing info with connection’s timing info, timingInfo’s post-redirect start
	          // time, and fetchParams’s cross-origin isolated capability.
	          // TODO: implement connection timing
	          timingInfo.finalConnectionTimingInfo = clampAndCoarsenConnectionTimingInfo(undefined, timingInfo.postRedirectStartTime, fetchParams.crossOriginIsolatedCapability);

	          if (connection.destroyed) {
	            abort(new DOMException('The operation was aborted.', 'AbortError'));
	          } else {
	            fetchParams.controller.on('terminated', abort);
	            this.abort = connection.abort = abort;
	          }

	          // Set timingInfo’s final network-request start time to the coarsened shared current time given
	          // fetchParams’s cross-origin isolated capability.
	          timingInfo.finalNetworkRequestStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
	        },

	        onResponseStarted () {
	          // Set timingInfo’s final network-response start time to the coarsened shared current
	          // time given fetchParams’s cross-origin isolated capability, immediately after the
	          // user agent’s HTTP parser receives the first byte of the response (e.g., frame header
	          // bytes for HTTP/2 or response status line for HTTP/1.x).
	          timingInfo.finalNetworkResponseStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
	        },

	        onHeaders (status, rawHeaders, resume, statusText) {
	          if (status < 200) {
	            return
	          }

	          /** @type {string[]} */
	          let codings = [];
	          let location = '';

	          const headersList = new HeadersList();

	          // For H2, the rawHeaders are a plain JS object
	          // We distinguish between them and iterate accordingly
	          if (Array.isArray(rawHeaders)) {
	            for (let i = 0; i < rawHeaders.length; i += 2) {
	              headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString('latin1'), true);
	            }
	            const contentEncoding = headersList.get('content-encoding', true);
	            if (contentEncoding) {
	              // https://www.rfc-editor.org/rfc/rfc7231#section-3.1.2.1
	              // "All content-coding values are case-insensitive..."
	              codings = contentEncoding.toLowerCase().split(',').map((x) => x.trim());
	            }
	            location = headersList.get('location', true);
	          }

	          this.body = new Readable({ read: resume });

	          const decoders = [];

	          const willFollow = location && request.redirect === 'follow' &&
	            redirectStatusSet.has(status);

	          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
	          if (request.method !== 'HEAD' && request.method !== 'CONNECT' && !nullBodyStatus.includes(status) && !willFollow) {
	            for (let i = 0; i < codings.length; ++i) {
	              const coding = codings[i];
	              // https://www.rfc-editor.org/rfc/rfc9112.html#section-7.2
	              if (coding === 'x-gzip' || coding === 'gzip') {
	                decoders.push(zlib.createGunzip({
	                  // Be less strict when decoding compressed responses, since sometimes
	                  // servers send slightly invalid responses that are still accepted
	                  // by common browsers.
	                  // Always using Z_SYNC_FLUSH is what cURL does.
	                  flush: zlib.constants.Z_SYNC_FLUSH,
	                  finishFlush: zlib.constants.Z_SYNC_FLUSH
	                }));
	              } else if (coding === 'deflate') {
	                decoders.push(createInflate());
	              } else if (coding === 'br') {
	                decoders.push(zlib.createBrotliDecompress());
	              } else {
	                decoders.length = 0;
	                break
	              }
	            }
	          }

	          resolve({
	            status,
	            statusText,
	            headersList,
	            body: decoders.length
	              ? pipeline(this.body, ...decoders, () => { })
	              : this.body.on('error', () => { })
	          });

	          return true
	        },

	        onData (chunk) {
	          if (fetchParams.controller.dump) {
	            return
	          }

	          // 1. If one or more bytes have been transmitted from response’s
	          // message body, then:

	          //  1. Let bytes be the transmitted bytes.
	          const bytes = chunk;

	          //  2. Let codings be the result of extracting header list values
	          //  given `Content-Encoding` and response’s header list.
	          //  See pullAlgorithm.

	          //  3. Increase timingInfo’s encoded body size by bytes’s length.
	          timingInfo.encodedBodySize += bytes.byteLength;

	          //  4. See pullAlgorithm...

	          return this.body.push(bytes)
	        },

	        onComplete () {
	          if (this.abort) {
	            fetchParams.controller.off('terminated', this.abort);
	          }

	          if (fetchParams.controller.onAborted) {
	            fetchParams.controller.off('terminated', fetchParams.controller.onAborted);
	          }

	          fetchParams.controller.ended = true;

	          this.body.push(null);
	        },

	        onError (error) {
	          if (this.abort) {
	            fetchParams.controller.off('terminated', this.abort);
	          }

	          this.body?.destroy(error);

	          fetchParams.controller.terminate(error);

	          reject(error);
	        },

	        onUpgrade (status, rawHeaders, socket) {
	          if (status !== 101) {
	            return
	          }

	          const headersList = new HeadersList();

	          for (let i = 0; i < rawHeaders.length; i += 2) {
	            headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString('latin1'), true);
	          }

	          resolve({
	            status,
	            statusText: STATUS_CODES[status],
	            headersList,
	            socket
	          });

	          return true
	        }
	      }
	    ))
	  }
	}

	fetch_1 = {
	  fetch,
	  Fetch,
	  fetching,
	  finalizeAndReportTiming
	};
	return fetch_1;
}

var symbols$2;
var hasRequiredSymbols$2;

function requireSymbols$2 () {
	if (hasRequiredSymbols$2) return symbols$2;
	hasRequiredSymbols$2 = 1;

	symbols$2 = {
	  kState: Symbol('FileReader state'),
	  kResult: Symbol('FileReader result'),
	  kError: Symbol('FileReader error'),
	  kLastProgressEventFired: Symbol('FileReader last progress event fired timestamp'),
	  kEvents: Symbol('FileReader events'),
	  kAborted: Symbol('FileReader aborted')
	};
	return symbols$2;
}

var progressevent;
var hasRequiredProgressevent;

function requireProgressevent () {
	if (hasRequiredProgressevent) return progressevent;
	hasRequiredProgressevent = 1;

	const { webidl } = requireWebidl();

	const kState = Symbol('ProgressEvent state');

	/**
	 * @see https://xhr.spec.whatwg.org/#progressevent
	 */
	class ProgressEvent extends Event {
	  constructor (type, eventInitDict = {}) {
	    type = webidl.converters.DOMString(type);
	    eventInitDict = webidl.converters.ProgressEventInit(eventInitDict ?? {});

	    super(type, eventInitDict);

	    this[kState] = {
	      lengthComputable: eventInitDict.lengthComputable,
	      loaded: eventInitDict.loaded,
	      total: eventInitDict.total
	    };
	  }

	  get lengthComputable () {
	    webidl.brandCheck(this, ProgressEvent);

	    return this[kState].lengthComputable
	  }

	  get loaded () {
	    webidl.brandCheck(this, ProgressEvent);

	    return this[kState].loaded
	  }

	  get total () {
	    webidl.brandCheck(this, ProgressEvent);

	    return this[kState].total
	  }
	}

	webidl.converters.ProgressEventInit = webidl.dictionaryConverter([
	  {
	    key: 'lengthComputable',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'loaded',
	    converter: webidl.converters['unsigned long long'],
	    defaultValue: 0
	  },
	  {
	    key: 'total',
	    converter: webidl.converters['unsigned long long'],
	    defaultValue: 0
	  },
	  {
	    key: 'bubbles',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'cancelable',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'composed',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  }
	]);

	progressevent = {
	  ProgressEvent
	};
	return progressevent;
}

var encoding;
var hasRequiredEncoding;

function requireEncoding () {
	if (hasRequiredEncoding) return encoding;
	hasRequiredEncoding = 1;

	/**
	 * @see https://encoding.spec.whatwg.org/#concept-encoding-get
	 * @param {string|undefined} label
	 */
	function getEncoding (label) {
	  if (!label) {
	    return 'failure'
	  }

	  // 1. Remove any leading and trailing ASCII whitespace from label.
	  // 2. If label is an ASCII case-insensitive match for any of the
	  //    labels listed in the table below, then return the
	  //    corresponding encoding; otherwise return failure.
	  switch (label.trim().toLowerCase()) {
	    case 'unicode-1-1-utf-8':
	    case 'unicode11utf8':
	    case 'unicode20utf8':
	    case 'utf-8':
	    case 'utf8':
	    case 'x-unicode20utf8':
	      return 'UTF-8'
	    case '866':
	    case 'cp866':
	    case 'csibm866':
	    case 'ibm866':
	      return 'IBM866'
	    case 'csisolatin2':
	    case 'iso-8859-2':
	    case 'iso-ir-101':
	    case 'iso8859-2':
	    case 'iso88592':
	    case 'iso_8859-2':
	    case 'iso_8859-2:1987':
	    case 'l2':
	    case 'latin2':
	      return 'ISO-8859-2'
	    case 'csisolatin3':
	    case 'iso-8859-3':
	    case 'iso-ir-109':
	    case 'iso8859-3':
	    case 'iso88593':
	    case 'iso_8859-3':
	    case 'iso_8859-3:1988':
	    case 'l3':
	    case 'latin3':
	      return 'ISO-8859-3'
	    case 'csisolatin4':
	    case 'iso-8859-4':
	    case 'iso-ir-110':
	    case 'iso8859-4':
	    case 'iso88594':
	    case 'iso_8859-4':
	    case 'iso_8859-4:1988':
	    case 'l4':
	    case 'latin4':
	      return 'ISO-8859-4'
	    case 'csisolatincyrillic':
	    case 'cyrillic':
	    case 'iso-8859-5':
	    case 'iso-ir-144':
	    case 'iso8859-5':
	    case 'iso88595':
	    case 'iso_8859-5':
	    case 'iso_8859-5:1988':
	      return 'ISO-8859-5'
	    case 'arabic':
	    case 'asmo-708':
	    case 'csiso88596e':
	    case 'csiso88596i':
	    case 'csisolatinarabic':
	    case 'ecma-114':
	    case 'iso-8859-6':
	    case 'iso-8859-6-e':
	    case 'iso-8859-6-i':
	    case 'iso-ir-127':
	    case 'iso8859-6':
	    case 'iso88596':
	    case 'iso_8859-6':
	    case 'iso_8859-6:1987':
	      return 'ISO-8859-6'
	    case 'csisolatingreek':
	    case 'ecma-118':
	    case 'elot_928':
	    case 'greek':
	    case 'greek8':
	    case 'iso-8859-7':
	    case 'iso-ir-126':
	    case 'iso8859-7':
	    case 'iso88597':
	    case 'iso_8859-7':
	    case 'iso_8859-7:1987':
	    case 'sun_eu_greek':
	      return 'ISO-8859-7'
	    case 'csiso88598e':
	    case 'csisolatinhebrew':
	    case 'hebrew':
	    case 'iso-8859-8':
	    case 'iso-8859-8-e':
	    case 'iso-ir-138':
	    case 'iso8859-8':
	    case 'iso88598':
	    case 'iso_8859-8':
	    case 'iso_8859-8:1988':
	    case 'visual':
	      return 'ISO-8859-8'
	    case 'csiso88598i':
	    case 'iso-8859-8-i':
	    case 'logical':
	      return 'ISO-8859-8-I'
	    case 'csisolatin6':
	    case 'iso-8859-10':
	    case 'iso-ir-157':
	    case 'iso8859-10':
	    case 'iso885910':
	    case 'l6':
	    case 'latin6':
	      return 'ISO-8859-10'
	    case 'iso-8859-13':
	    case 'iso8859-13':
	    case 'iso885913':
	      return 'ISO-8859-13'
	    case 'iso-8859-14':
	    case 'iso8859-14':
	    case 'iso885914':
	      return 'ISO-8859-14'
	    case 'csisolatin9':
	    case 'iso-8859-15':
	    case 'iso8859-15':
	    case 'iso885915':
	    case 'iso_8859-15':
	    case 'l9':
	      return 'ISO-8859-15'
	    case 'iso-8859-16':
	      return 'ISO-8859-16'
	    case 'cskoi8r':
	    case 'koi':
	    case 'koi8':
	    case 'koi8-r':
	    case 'koi8_r':
	      return 'KOI8-R'
	    case 'koi8-ru':
	    case 'koi8-u':
	      return 'KOI8-U'
	    case 'csmacintosh':
	    case 'mac':
	    case 'macintosh':
	    case 'x-mac-roman':
	      return 'macintosh'
	    case 'iso-8859-11':
	    case 'iso8859-11':
	    case 'iso885911':
	    case 'tis-620':
	    case 'windows-874':
	      return 'windows-874'
	    case 'cp1250':
	    case 'windows-1250':
	    case 'x-cp1250':
	      return 'windows-1250'
	    case 'cp1251':
	    case 'windows-1251':
	    case 'x-cp1251':
	      return 'windows-1251'
	    case 'ansi_x3.4-1968':
	    case 'ascii':
	    case 'cp1252':
	    case 'cp819':
	    case 'csisolatin1':
	    case 'ibm819':
	    case 'iso-8859-1':
	    case 'iso-ir-100':
	    case 'iso8859-1':
	    case 'iso88591':
	    case 'iso_8859-1':
	    case 'iso_8859-1:1987':
	    case 'l1':
	    case 'latin1':
	    case 'us-ascii':
	    case 'windows-1252':
	    case 'x-cp1252':
	      return 'windows-1252'
	    case 'cp1253':
	    case 'windows-1253':
	    case 'x-cp1253':
	      return 'windows-1253'
	    case 'cp1254':
	    case 'csisolatin5':
	    case 'iso-8859-9':
	    case 'iso-ir-148':
	    case 'iso8859-9':
	    case 'iso88599':
	    case 'iso_8859-9':
	    case 'iso_8859-9:1989':
	    case 'l5':
	    case 'latin5':
	    case 'windows-1254':
	    case 'x-cp1254':
	      return 'windows-1254'
	    case 'cp1255':
	    case 'windows-1255':
	    case 'x-cp1255':
	      return 'windows-1255'
	    case 'cp1256':
	    case 'windows-1256':
	    case 'x-cp1256':
	      return 'windows-1256'
	    case 'cp1257':
	    case 'windows-1257':
	    case 'x-cp1257':
	      return 'windows-1257'
	    case 'cp1258':
	    case 'windows-1258':
	    case 'x-cp1258':
	      return 'windows-1258'
	    case 'x-mac-cyrillic':
	    case 'x-mac-ukrainian':
	      return 'x-mac-cyrillic'
	    case 'chinese':
	    case 'csgb2312':
	    case 'csiso58gb231280':
	    case 'gb2312':
	    case 'gb_2312':
	    case 'gb_2312-80':
	    case 'gbk':
	    case 'iso-ir-58':
	    case 'x-gbk':
	      return 'GBK'
	    case 'gb18030':
	      return 'gb18030'
	    case 'big5':
	    case 'big5-hkscs':
	    case 'cn-big5':
	    case 'csbig5':
	    case 'x-x-big5':
	      return 'Big5'
	    case 'cseucpkdfmtjapanese':
	    case 'euc-jp':
	    case 'x-euc-jp':
	      return 'EUC-JP'
	    case 'csiso2022jp':
	    case 'iso-2022-jp':
	      return 'ISO-2022-JP'
	    case 'csshiftjis':
	    case 'ms932':
	    case 'ms_kanji':
	    case 'shift-jis':
	    case 'shift_jis':
	    case 'sjis':
	    case 'windows-31j':
	    case 'x-sjis':
	      return 'Shift_JIS'
	    case 'cseuckr':
	    case 'csksc56011987':
	    case 'euc-kr':
	    case 'iso-ir-149':
	    case 'korean':
	    case 'ks_c_5601-1987':
	    case 'ks_c_5601-1989':
	    case 'ksc5601':
	    case 'ksc_5601':
	    case 'windows-949':
	      return 'EUC-KR'
	    case 'csiso2022kr':
	    case 'hz-gb-2312':
	    case 'iso-2022-cn':
	    case 'iso-2022-cn-ext':
	    case 'iso-2022-kr':
	    case 'replacement':
	      return 'replacement'
	    case 'unicodefffe':
	    case 'utf-16be':
	      return 'UTF-16BE'
	    case 'csunicode':
	    case 'iso-10646-ucs-2':
	    case 'ucs-2':
	    case 'unicode':
	    case 'unicodefeff':
	    case 'utf-16':
	    case 'utf-16le':
	      return 'UTF-16LE'
	    case 'x-user-defined':
	      return 'x-user-defined'
	    default: return 'failure'
	  }
	}

	encoding = {
	  getEncoding
	};
	return encoding;
}

var util$5;
var hasRequiredUtil$4;

function requireUtil$4 () {
	if (hasRequiredUtil$4) return util$5;
	hasRequiredUtil$4 = 1;

	const {
	  kState,
	  kError,
	  kResult,
	  kAborted,
	  kLastProgressEventFired
	} = requireSymbols$2();
	const { ProgressEvent } = requireProgressevent();
	const { getEncoding } = requireEncoding();
	const { serializeAMimeType, parseMIMEType } = requireDataUrl();
	const { types } = require$$0$2;
	const { StringDecoder } = require$$5$1;
	const { btoa } = require$$6;

	/** @type {PropertyDescriptor} */
	const staticPropertyDescriptors = {
	  enumerable: true,
	  writable: false,
	  configurable: false
	};

	/**
	 * @see https://w3c.github.io/FileAPI/#readOperation
	 * @param {import('./filereader').FileReader} fr
	 * @param {import('buffer').Blob} blob
	 * @param {string} type
	 * @param {string?} encodingName
	 */
	function readOperation (fr, blob, type, encodingName) {
	  // 1. If fr’s state is "loading", throw an InvalidStateError
	  //    DOMException.
	  if (fr[kState] === 'loading') {
	    throw new DOMException('Invalid state', 'InvalidStateError')
	  }

	  // 2. Set fr’s state to "loading".
	  fr[kState] = 'loading';

	  // 3. Set fr’s result to null.
	  fr[kResult] = null;

	  // 4. Set fr’s error to null.
	  fr[kError] = null;

	  // 5. Let stream be the result of calling get stream on blob.
	  /** @type {import('stream/web').ReadableStream} */
	  const stream = blob.stream();

	  // 6. Let reader be the result of getting a reader from stream.
	  const reader = stream.getReader();

	  // 7. Let bytes be an empty byte sequence.
	  /** @type {Uint8Array[]} */
	  const bytes = [];

	  // 8. Let chunkPromise be the result of reading a chunk from
	  //    stream with reader.
	  let chunkPromise = reader.read();

	  // 9. Let isFirstChunk be true.
	  let isFirstChunk = true

	  // 10. In parallel, while true:
	  // Note: "In parallel" just means non-blocking
	  // Note 2: readOperation itself cannot be async as double
	  // reading the body would then reject the promise, instead
	  // of throwing an error.
	  ;(async () => {
	    while (!fr[kAborted]) {
	      // 1. Wait for chunkPromise to be fulfilled or rejected.
	      try {
	        const { done, value } = await chunkPromise;

	        // 2. If chunkPromise is fulfilled, and isFirstChunk is
	        //    true, queue a task to fire a progress event called
	        //    loadstart at fr.
	        if (isFirstChunk && !fr[kAborted]) {
	          queueMicrotask(() => {
	            fireAProgressEvent('loadstart', fr);
	          });
	        }

	        // 3. Set isFirstChunk to false.
	        isFirstChunk = false;

	        // 4. If chunkPromise is fulfilled with an object whose
	        //    done property is false and whose value property is
	        //    a Uint8Array object, run these steps:
	        if (!done && types.isUint8Array(value)) {
	          // 1. Let bs be the byte sequence represented by the
	          //    Uint8Array object.

	          // 2. Append bs to bytes.
	          bytes.push(value);

	          // 3. If roughly 50ms have passed since these steps
	          //    were last invoked, queue a task to fire a
	          //    progress event called progress at fr.
	          if (
	            (
	              fr[kLastProgressEventFired] === undefined ||
	              Date.now() - fr[kLastProgressEventFired] >= 50
	            ) &&
	            !fr[kAborted]
	          ) {
	            fr[kLastProgressEventFired] = Date.now();
	            queueMicrotask(() => {
	              fireAProgressEvent('progress', fr);
	            });
	          }

	          // 4. Set chunkPromise to the result of reading a
	          //    chunk from stream with reader.
	          chunkPromise = reader.read();
	        } else if (done) {
	          // 5. Otherwise, if chunkPromise is fulfilled with an
	          //    object whose done property is true, queue a task
	          //    to run the following steps and abort this algorithm:
	          queueMicrotask(() => {
	            // 1. Set fr’s state to "done".
	            fr[kState] = 'done';

	            // 2. Let result be the result of package data given
	            //    bytes, type, blob’s type, and encodingName.
	            try {
	              const result = packageData(bytes, type, blob.type, encodingName);

	              // 4. Else:

	              if (fr[kAborted]) {
	                return
	              }

	              // 1. Set fr’s result to result.
	              fr[kResult] = result;

	              // 2. Fire a progress event called load at the fr.
	              fireAProgressEvent('load', fr);
	            } catch (error) {
	              // 3. If package data threw an exception error:

	              // 1. Set fr’s error to error.
	              fr[kError] = error;

	              // 2. Fire a progress event called error at fr.
	              fireAProgressEvent('error', fr);
	            }

	            // 5. If fr’s state is not "loading", fire a progress
	            //    event called loadend at the fr.
	            if (fr[kState] !== 'loading') {
	              fireAProgressEvent('loadend', fr);
	            }
	          });

	          break
	        }
	      } catch (error) {
	        if (fr[kAborted]) {
	          return
	        }

	        // 6. Otherwise, if chunkPromise is rejected with an
	        //    error error, queue a task to run the following
	        //    steps and abort this algorithm:
	        queueMicrotask(() => {
	          // 1. Set fr’s state to "done".
	          fr[kState] = 'done';

	          // 2. Set fr’s error to error.
	          fr[kError] = error;

	          // 3. Fire a progress event called error at fr.
	          fireAProgressEvent('error', fr);

	          // 4. If fr’s state is not "loading", fire a progress
	          //    event called loadend at fr.
	          if (fr[kState] !== 'loading') {
	            fireAProgressEvent('loadend', fr);
	          }
	        });

	        break
	      }
	    }
	  })();
	}

	/**
	 * @see https://w3c.github.io/FileAPI/#fire-a-progress-event
	 * @see https://dom.spec.whatwg.org/#concept-event-fire
	 * @param {string} e The name of the event
	 * @param {import('./filereader').FileReader} reader
	 */
	function fireAProgressEvent (e, reader) {
	  // The progress event e does not bubble. e.bubbles must be false
	  // The progress event e is NOT cancelable. e.cancelable must be false
	  const event = new ProgressEvent(e, {
	    bubbles: false,
	    cancelable: false
	  });

	  reader.dispatchEvent(event);
	}

	/**
	 * @see https://w3c.github.io/FileAPI/#blob-package-data
	 * @param {Uint8Array[]} bytes
	 * @param {string} type
	 * @param {string?} mimeType
	 * @param {string?} encodingName
	 */
	function packageData (bytes, type, mimeType, encodingName) {
	  // 1. A Blob has an associated package data algorithm, given
	  //    bytes, a type, a optional mimeType, and a optional
	  //    encodingName, which switches on type and runs the
	  //    associated steps:

	  switch (type) {
	    case 'DataURL': {
	      // 1. Return bytes as a DataURL [RFC2397] subject to
	      //    the considerations below:
	      //  * Use mimeType as part of the Data URL if it is
	      //    available in keeping with the Data URL
	      //    specification [RFC2397].
	      //  * If mimeType is not available return a Data URL
	      //    without a media-type. [RFC2397].

	      // https://datatracker.ietf.org/doc/html/rfc2397#section-3
	      // dataurl    := "data:" [ mediatype ] [ ";base64" ] "," data
	      // mediatype  := [ type "/" subtype ] *( ";" parameter )
	      // data       := *urlchar
	      // parameter  := attribute "=" value
	      let dataURL = 'data:';

	      const parsed = parseMIMEType(mimeType || 'application/octet-stream');

	      if (parsed !== 'failure') {
	        dataURL += serializeAMimeType(parsed);
	      }

	      dataURL += ';base64,';

	      const decoder = new StringDecoder('latin1');

	      for (const chunk of bytes) {
	        dataURL += btoa(decoder.write(chunk));
	      }

	      dataURL += btoa(decoder.end());

	      return dataURL
	    }
	    case 'Text': {
	      // 1. Let encoding be failure
	      let encoding = 'failure';

	      // 2. If the encodingName is present, set encoding to the
	      //    result of getting an encoding from encodingName.
	      if (encodingName) {
	        encoding = getEncoding(encodingName);
	      }

	      // 3. If encoding is failure, and mimeType is present:
	      if (encoding === 'failure' && mimeType) {
	        // 1. Let type be the result of parse a MIME type
	        //    given mimeType.
	        const type = parseMIMEType(mimeType);

	        // 2. If type is not failure, set encoding to the result
	        //    of getting an encoding from type’s parameters["charset"].
	        if (type !== 'failure') {
	          encoding = getEncoding(type.parameters.get('charset'));
	        }
	      }

	      // 4. If encoding is failure, then set encoding to UTF-8.
	      if (encoding === 'failure') {
	        encoding = 'UTF-8';
	      }

	      // 5. Decode bytes using fallback encoding encoding, and
	      //    return the result.
	      return decode(bytes, encoding)
	    }
	    case 'ArrayBuffer': {
	      // Return a new ArrayBuffer whose contents are bytes.
	      const sequence = combineByteSequences(bytes);

	      return sequence.buffer
	    }
	    case 'BinaryString': {
	      // Return bytes as a binary string, in which every byte
	      //  is represented by a code unit of equal value [0..255].
	      let binaryString = '';

	      const decoder = new StringDecoder('latin1');

	      for (const chunk of bytes) {
	        binaryString += decoder.write(chunk);
	      }

	      binaryString += decoder.end();

	      return binaryString
	    }
	  }
	}

	/**
	 * @see https://encoding.spec.whatwg.org/#decode
	 * @param {Uint8Array[]} ioQueue
	 * @param {string} encoding
	 */
	function decode (ioQueue, encoding) {
	  const bytes = combineByteSequences(ioQueue);

	  // 1. Let BOMEncoding be the result of BOM sniffing ioQueue.
	  const BOMEncoding = BOMSniffing(bytes);

	  let slice = 0;

	  // 2. If BOMEncoding is non-null:
	  if (BOMEncoding !== null) {
	    // 1. Set encoding to BOMEncoding.
	    encoding = BOMEncoding;

	    // 2. Read three bytes from ioQueue, if BOMEncoding is
	    //    UTF-8; otherwise read two bytes.
	    //    (Do nothing with those bytes.)
	    slice = BOMEncoding === 'UTF-8' ? 3 : 2;
	  }

	  // 3. Process a queue with an instance of encoding’s
	  //    decoder, ioQueue, output, and "replacement".

	  // 4. Return output.

	  const sliced = bytes.slice(slice);
	  return new TextDecoder(encoding).decode(sliced)
	}

	/**
	 * @see https://encoding.spec.whatwg.org/#bom-sniff
	 * @param {Uint8Array} ioQueue
	 */
	function BOMSniffing (ioQueue) {
	  // 1. Let BOM be the result of peeking 3 bytes from ioQueue,
	  //    converted to a byte sequence.
	  const [a, b, c] = ioQueue;

	  // 2. For each of the rows in the table below, starting with
	  //    the first one and going down, if BOM starts with the
	  //    bytes given in the first column, then return the
	  //    encoding given in the cell in the second column of that
	  //    row. Otherwise, return null.
	  if (a === 0xEF && b === 0xBB && c === 0xBF) {
	    return 'UTF-8'
	  } else if (a === 0xFE && b === 0xFF) {
	    return 'UTF-16BE'
	  } else if (a === 0xFF && b === 0xFE) {
	    return 'UTF-16LE'
	  }

	  return null
	}

	/**
	 * @param {Uint8Array[]} sequences
	 */
	function combineByteSequences (sequences) {
	  const size = sequences.reduce((a, b) => {
	    return a + b.byteLength
	  }, 0);

	  let offset = 0;

	  return sequences.reduce((a, b) => {
	    a.set(b, offset);
	    offset += b.byteLength;
	    return a
	  }, new Uint8Array(size))
	}

	util$5 = {
	  staticPropertyDescriptors,
	  readOperation,
	  fireAProgressEvent
	};
	return util$5;
}

var filereader;
var hasRequiredFilereader;

function requireFilereader () {
	if (hasRequiredFilereader) return filereader;
	hasRequiredFilereader = 1;

	const {
	  staticPropertyDescriptors,
	  readOperation,
	  fireAProgressEvent
	} = requireUtil$4();
	const {
	  kState,
	  kError,
	  kResult,
	  kEvents,
	  kAborted
	} = requireSymbols$2();
	const { webidl } = requireWebidl();
	const { kEnumerableProperty } = util$m;

	class FileReader extends EventTarget {
	  constructor () {
	    super();

	    this[kState] = 'empty';
	    this[kResult] = null;
	    this[kError] = null;
	    this[kEvents] = {
	      loadend: null,
	      error: null,
	      abort: null,
	      load: null,
	      progress: null,
	      loadstart: null
	    };
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#dfn-readAsArrayBuffer
	   * @param {import('buffer').Blob} blob
	   */
	  readAsArrayBuffer (blob) {
	    webidl.brandCheck(this, FileReader);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FileReader.readAsArrayBuffer' });

	    blob = webidl.converters.Blob(blob, { strict: false });

	    // The readAsArrayBuffer(blob) method, when invoked,
	    // must initiate a read operation for blob with ArrayBuffer.
	    readOperation(this, blob, 'ArrayBuffer');
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#readAsBinaryString
	   * @param {import('buffer').Blob} blob
	   */
	  readAsBinaryString (blob) {
	    webidl.brandCheck(this, FileReader);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FileReader.readAsBinaryString' });

	    blob = webidl.converters.Blob(blob, { strict: false });

	    // The readAsBinaryString(blob) method, when invoked,
	    // must initiate a read operation for blob with BinaryString.
	    readOperation(this, blob, 'BinaryString');
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#readAsDataText
	   * @param {import('buffer').Blob} blob
	   * @param {string?} encoding
	   */
	  readAsText (blob, encoding = undefined) {
	    webidl.brandCheck(this, FileReader);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FileReader.readAsText' });

	    blob = webidl.converters.Blob(blob, { strict: false });

	    if (encoding !== undefined) {
	      encoding = webidl.converters.DOMString(encoding);
	    }

	    // The readAsText(blob, encoding) method, when invoked,
	    // must initiate a read operation for blob with Text and encoding.
	    readOperation(this, blob, 'Text', encoding);
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#dfn-readAsDataURL
	   * @param {import('buffer').Blob} blob
	   */
	  readAsDataURL (blob) {
	    webidl.brandCheck(this, FileReader);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'FileReader.readAsDataURL' });

	    blob = webidl.converters.Blob(blob, { strict: false });

	    // The readAsDataURL(blob) method, when invoked, must
	    // initiate a read operation for blob with DataURL.
	    readOperation(this, blob, 'DataURL');
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#dfn-abort
	   */
	  abort () {
	    // 1. If this's state is "empty" or if this's state is
	    //    "done" set this's result to null and terminate
	    //    this algorithm.
	    if (this[kState] === 'empty' || this[kState] === 'done') {
	      this[kResult] = null;
	      return
	    }

	    // 2. If this's state is "loading" set this's state to
	    //    "done" and set this's result to null.
	    if (this[kState] === 'loading') {
	      this[kState] = 'done';
	      this[kResult] = null;
	    }

	    // 3. If there are any tasks from this on the file reading
	    //    task source in an affiliated task queue, then remove
	    //    those tasks from that task queue.
	    this[kAborted] = true;

	    // 4. Terminate the algorithm for the read method being processed.
	    // TODO

	    // 5. Fire a progress event called abort at this.
	    fireAProgressEvent('abort', this);

	    // 6. If this's state is not "loading", fire a progress
	    //    event called loadend at this.
	    if (this[kState] !== 'loading') {
	      fireAProgressEvent('loadend', this);
	    }
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#dom-filereader-readystate
	   */
	  get readyState () {
	    webidl.brandCheck(this, FileReader);

	    switch (this[kState]) {
	      case 'empty': return this.EMPTY
	      case 'loading': return this.LOADING
	      case 'done': return this.DONE
	    }
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#dom-filereader-result
	   */
	  get result () {
	    webidl.brandCheck(this, FileReader);

	    // The result attribute’s getter, when invoked, must return
	    // this's result.
	    return this[kResult]
	  }

	  /**
	   * @see https://w3c.github.io/FileAPI/#dom-filereader-error
	   */
	  get error () {
	    webidl.brandCheck(this, FileReader);

	    // The error attribute’s getter, when invoked, must return
	    // this's error.
	    return this[kError]
	  }

	  get onloadend () {
	    webidl.brandCheck(this, FileReader);

	    return this[kEvents].loadend
	  }

	  set onloadend (fn) {
	    webidl.brandCheck(this, FileReader);

	    if (this[kEvents].loadend) {
	      this.removeEventListener('loadend', this[kEvents].loadend);
	    }

	    if (typeof fn === 'function') {
	      this[kEvents].loadend = fn;
	      this.addEventListener('loadend', fn);
	    } else {
	      this[kEvents].loadend = null;
	    }
	  }

	  get onerror () {
	    webidl.brandCheck(this, FileReader);

	    return this[kEvents].error
	  }

	  set onerror (fn) {
	    webidl.brandCheck(this, FileReader);

	    if (this[kEvents].error) {
	      this.removeEventListener('error', this[kEvents].error);
	    }

	    if (typeof fn === 'function') {
	      this[kEvents].error = fn;
	      this.addEventListener('error', fn);
	    } else {
	      this[kEvents].error = null;
	    }
	  }

	  get onloadstart () {
	    webidl.brandCheck(this, FileReader);

	    return this[kEvents].loadstart
	  }

	  set onloadstart (fn) {
	    webidl.brandCheck(this, FileReader);

	    if (this[kEvents].loadstart) {
	      this.removeEventListener('loadstart', this[kEvents].loadstart);
	    }

	    if (typeof fn === 'function') {
	      this[kEvents].loadstart = fn;
	      this.addEventListener('loadstart', fn);
	    } else {
	      this[kEvents].loadstart = null;
	    }
	  }

	  get onprogress () {
	    webidl.brandCheck(this, FileReader);

	    return this[kEvents].progress
	  }

	  set onprogress (fn) {
	    webidl.brandCheck(this, FileReader);

	    if (this[kEvents].progress) {
	      this.removeEventListener('progress', this[kEvents].progress);
	    }

	    if (typeof fn === 'function') {
	      this[kEvents].progress = fn;
	      this.addEventListener('progress', fn);
	    } else {
	      this[kEvents].progress = null;
	    }
	  }

	  get onload () {
	    webidl.brandCheck(this, FileReader);

	    return this[kEvents].load
	  }

	  set onload (fn) {
	    webidl.brandCheck(this, FileReader);

	    if (this[kEvents].load) {
	      this.removeEventListener('load', this[kEvents].load);
	    }

	    if (typeof fn === 'function') {
	      this[kEvents].load = fn;
	      this.addEventListener('load', fn);
	    } else {
	      this[kEvents].load = null;
	    }
	  }

	  get onabort () {
	    webidl.brandCheck(this, FileReader);

	    return this[kEvents].abort
	  }

	  set onabort (fn) {
	    webidl.brandCheck(this, FileReader);

	    if (this[kEvents].abort) {
	      this.removeEventListener('abort', this[kEvents].abort);
	    }

	    if (typeof fn === 'function') {
	      this[kEvents].abort = fn;
	      this.addEventListener('abort', fn);
	    } else {
	      this[kEvents].abort = null;
	    }
	  }
	}

	// https://w3c.github.io/FileAPI/#dom-filereader-empty
	FileReader.EMPTY = FileReader.prototype.EMPTY = 0;
	// https://w3c.github.io/FileAPI/#dom-filereader-loading
	FileReader.LOADING = FileReader.prototype.LOADING = 1;
	// https://w3c.github.io/FileAPI/#dom-filereader-done
	FileReader.DONE = FileReader.prototype.DONE = 2;

	Object.defineProperties(FileReader.prototype, {
	  EMPTY: staticPropertyDescriptors,
	  LOADING: staticPropertyDescriptors,
	  DONE: staticPropertyDescriptors,
	  readAsArrayBuffer: kEnumerableProperty,
	  readAsBinaryString: kEnumerableProperty,
	  readAsText: kEnumerableProperty,
	  readAsDataURL: kEnumerableProperty,
	  abort: kEnumerableProperty,
	  readyState: kEnumerableProperty,
	  result: kEnumerableProperty,
	  error: kEnumerableProperty,
	  onloadstart: kEnumerableProperty,
	  onprogress: kEnumerableProperty,
	  onload: kEnumerableProperty,
	  onabort: kEnumerableProperty,
	  onerror: kEnumerableProperty,
	  onloadend: kEnumerableProperty,
	  [Symbol.toStringTag]: {
	    value: 'FileReader',
	    writable: false,
	    enumerable: false,
	    configurable: true
	  }
	});

	Object.defineProperties(FileReader, {
	  EMPTY: staticPropertyDescriptors,
	  LOADING: staticPropertyDescriptors,
	  DONE: staticPropertyDescriptors
	});

	filereader = {
	  FileReader
	};
	return filereader;
}

var symbols$1;
var hasRequiredSymbols$1;

function requireSymbols$1 () {
	if (hasRequiredSymbols$1) return symbols$1;
	hasRequiredSymbols$1 = 1;

	symbols$1 = {
	  kConstruct: symbols$4.kConstruct
	};
	return symbols$1;
}

var util$4;
var hasRequiredUtil$3;

function requireUtil$3 () {
	if (hasRequiredUtil$3) return util$4;
	hasRequiredUtil$3 = 1;

	const assert = require$$0;
	const { URLSerializer } = requireDataUrl();
	const { isValidHeaderName } = requireUtil$5();

	/**
	 * @see https://url.spec.whatwg.org/#concept-url-equals
	 * @param {URL} A
	 * @param {URL} B
	 * @param {boolean | undefined} excludeFragment
	 * @returns {boolean}
	 */
	function urlEquals (A, B, excludeFragment = false) {
	  const serializedA = URLSerializer(A, excludeFragment);

	  const serializedB = URLSerializer(B, excludeFragment);

	  return serializedA === serializedB
	}

	/**
	 * @see https://github.com/chromium/chromium/blob/694d20d134cb553d8d89e5500b9148012b1ba299/content/browser/cache_storage/cache_storage_cache.cc#L260-L262
	 * @param {string} header
	 */
	function getFieldValues (header) {
	  assert(header !== null);

	  const values = [];

	  for (let value of header.split(',')) {
	    value = value.trim();

	    if (isValidHeaderName(value)) {
	      values.push(value);
	    }
	  }

	  return values
	}

	util$4 = {
	  urlEquals,
	  getFieldValues
	};
	return util$4;
}

var cache;
var hasRequiredCache;

function requireCache () {
	if (hasRequiredCache) return cache;
	hasRequiredCache = 1;

	const { kConstruct } = requireSymbols$1();
	const { urlEquals, getFieldValues } = requireUtil$3();
	const { kEnumerableProperty, isDisturbed } = util$m;
	const { webidl } = requireWebidl();
	const { Response, cloneResponse, fromInnerResponse } = requireResponse();
	const { Request, fromInnerRequest } = requireRequest();
	const { kState } = requireSymbols$3();
	const { fetching } = requireFetch();
	const { urlIsHttpHttpsScheme, createDeferredPromise, readAllBytes } = requireUtil$5();
	const assert = require$$0;

	/**
	 * @see https://w3c.github.io/ServiceWorker/#dfn-cache-batch-operation
	 * @typedef {Object} CacheBatchOperation
	 * @property {'delete' | 'put'} type
	 * @property {any} request
	 * @property {any} response
	 * @property {import('../../types/cache').CacheQueryOptions} options
	 */

	/**
	 * @see https://w3c.github.io/ServiceWorker/#dfn-request-response-list
	 * @typedef {[any, any][]} requestResponseList
	 */

	class Cache {
	  /**
	   * @see https://w3c.github.io/ServiceWorker/#dfn-relevant-request-response-list
	   * @type {requestResponseList}
	   */
	  #relevantRequestResponseList

	  constructor () {
	    if (arguments[0] !== kConstruct) {
	      webidl.illegalConstructor();
	    }

	    this.#relevantRequestResponseList = arguments[1];
	  }

	  async match (request, options = {}) {
	    webidl.brandCheck(this, Cache);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'Cache.match' });

	    request = webidl.converters.RequestInfo(request);
	    options = webidl.converters.CacheQueryOptions(options);

	    const p = this.#internalMatchAll(request, options, 1);

	    if (p.length === 0) {
	      return
	    }

	    return p[0]
	  }

	  async matchAll (request = undefined, options = {}) {
	    webidl.brandCheck(this, Cache);

	    if (request !== undefined) request = webidl.converters.RequestInfo(request);
	    options = webidl.converters.CacheQueryOptions(options);

	    return this.#internalMatchAll(request, options)
	  }

	  async add (request) {
	    webidl.brandCheck(this, Cache);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'Cache.add' });

	    request = webidl.converters.RequestInfo(request);

	    // 1.
	    const requests = [request];

	    // 2.
	    const responseArrayPromise = this.addAll(requests);

	    // 3.
	    return await responseArrayPromise
	  }

	  async addAll (requests) {
	    webidl.brandCheck(this, Cache);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'Cache.addAll' });

	    // 1.
	    const responsePromises = [];

	    // 2.
	    const requestList = [];

	    // 3.
	    for (let request of requests) {
	      if (request === undefined) {
	        throw webidl.errors.conversionFailed({
	          prefix: 'Cache.addAll',
	          argument: 'Argument 1',
	          types: ['undefined is not allowed']
	        })
	      }

	      request = webidl.converters.RequestInfo(request);

	      if (typeof request === 'string') {
	        continue
	      }

	      // 3.1
	      const r = request[kState];

	      // 3.2
	      if (!urlIsHttpHttpsScheme(r.url) || r.method !== 'GET') {
	        throw webidl.errors.exception({
	          header: 'Cache.addAll',
	          message: 'Expected http/s scheme when method is not GET.'
	        })
	      }
	    }

	    // 4.
	    /** @type {ReturnType<typeof fetching>[]} */
	    const fetchControllers = [];

	    // 5.
	    for (const request of requests) {
	      // 5.1
	      const r = new Request(request)[kState];

	      // 5.2
	      if (!urlIsHttpHttpsScheme(r.url)) {
	        throw webidl.errors.exception({
	          header: 'Cache.addAll',
	          message: 'Expected http/s scheme.'
	        })
	      }

	      // 5.4
	      r.initiator = 'fetch';
	      r.destination = 'subresource';

	      // 5.5
	      requestList.push(r);

	      // 5.6
	      const responsePromise = createDeferredPromise();

	      // 5.7
	      fetchControllers.push(fetching({
	        request: r,
	        processResponse (response) {
	          // 1.
	          if (response.type === 'error' || response.status === 206 || response.status < 200 || response.status > 299) {
	            responsePromise.reject(webidl.errors.exception({
	              header: 'Cache.addAll',
	              message: 'Received an invalid status code or the request failed.'
	            }));
	          } else if (response.headersList.contains('vary')) { // 2.
	            // 2.1
	            const fieldValues = getFieldValues(response.headersList.get('vary'));

	            // 2.2
	            for (const fieldValue of fieldValues) {
	              // 2.2.1
	              if (fieldValue === '*') {
	                responsePromise.reject(webidl.errors.exception({
	                  header: 'Cache.addAll',
	                  message: 'invalid vary field value'
	                }));

	                for (const controller of fetchControllers) {
	                  controller.abort();
	                }

	                return
	              }
	            }
	          }
	        },
	        processResponseEndOfBody (response) {
	          // 1.
	          if (response.aborted) {
	            responsePromise.reject(new DOMException('aborted', 'AbortError'));
	            return
	          }

	          // 2.
	          responsePromise.resolve(response);
	        }
	      }));

	      // 5.8
	      responsePromises.push(responsePromise.promise);
	    }

	    // 6.
	    const p = Promise.all(responsePromises);

	    // 7.
	    const responses = await p;

	    // 7.1
	    const operations = [];

	    // 7.2
	    let index = 0;

	    // 7.3
	    for (const response of responses) {
	      // 7.3.1
	      /** @type {CacheBatchOperation} */
	      const operation = {
	        type: 'put', // 7.3.2
	        request: requestList[index], // 7.3.3
	        response // 7.3.4
	      };

	      operations.push(operation); // 7.3.5

	      index++; // 7.3.6
	    }

	    // 7.5
	    const cacheJobPromise = createDeferredPromise();

	    // 7.6.1
	    let errorData = null;

	    // 7.6.2
	    try {
	      this.#batchCacheOperations(operations);
	    } catch (e) {
	      errorData = e;
	    }

	    // 7.6.3
	    queueMicrotask(() => {
	      // 7.6.3.1
	      if (errorData === null) {
	        cacheJobPromise.resolve(undefined);
	      } else {
	        // 7.6.3.2
	        cacheJobPromise.reject(errorData);
	      }
	    });

	    // 7.7
	    return cacheJobPromise.promise
	  }

	  async put (request, response) {
	    webidl.brandCheck(this, Cache);
	    webidl.argumentLengthCheck(arguments, 2, { header: 'Cache.put' });

	    request = webidl.converters.RequestInfo(request);
	    response = webidl.converters.Response(response);

	    // 1.
	    let innerRequest = null;

	    // 2.
	    if (request instanceof Request) {
	      innerRequest = request[kState];
	    } else { // 3.
	      innerRequest = new Request(request)[kState];
	    }

	    // 4.
	    if (!urlIsHttpHttpsScheme(innerRequest.url) || innerRequest.method !== 'GET') {
	      throw webidl.errors.exception({
	        header: 'Cache.put',
	        message: 'Expected an http/s scheme when method is not GET'
	      })
	    }

	    // 5.
	    const innerResponse = response[kState];

	    // 6.
	    if (innerResponse.status === 206) {
	      throw webidl.errors.exception({
	        header: 'Cache.put',
	        message: 'Got 206 status'
	      })
	    }

	    // 7.
	    if (innerResponse.headersList.contains('vary')) {
	      // 7.1.
	      const fieldValues = getFieldValues(innerResponse.headersList.get('vary'));

	      // 7.2.
	      for (const fieldValue of fieldValues) {
	        // 7.2.1
	        if (fieldValue === '*') {
	          throw webidl.errors.exception({
	            header: 'Cache.put',
	            message: 'Got * vary field value'
	          })
	        }
	      }
	    }

	    // 8.
	    if (innerResponse.body && (isDisturbed(innerResponse.body.stream) || innerResponse.body.stream.locked)) {
	      throw webidl.errors.exception({
	        header: 'Cache.put',
	        message: 'Response body is locked or disturbed'
	      })
	    }

	    // 9.
	    const clonedResponse = cloneResponse(innerResponse);

	    // 10.
	    const bodyReadPromise = createDeferredPromise();

	    // 11.
	    if (innerResponse.body != null) {
	      // 11.1
	      const stream = innerResponse.body.stream;

	      // 11.2
	      const reader = stream.getReader();

	      // 11.3
	      readAllBytes(reader).then(bodyReadPromise.resolve, bodyReadPromise.reject);
	    } else {
	      bodyReadPromise.resolve(undefined);
	    }

	    // 12.
	    /** @type {CacheBatchOperation[]} */
	    const operations = [];

	    // 13.
	    /** @type {CacheBatchOperation} */
	    const operation = {
	      type: 'put', // 14.
	      request: innerRequest, // 15.
	      response: clonedResponse // 16.
	    };

	    // 17.
	    operations.push(operation);

	    // 19.
	    const bytes = await bodyReadPromise.promise;

	    if (clonedResponse.body != null) {
	      clonedResponse.body.source = bytes;
	    }

	    // 19.1
	    const cacheJobPromise = createDeferredPromise();

	    // 19.2.1
	    let errorData = null;

	    // 19.2.2
	    try {
	      this.#batchCacheOperations(operations);
	    } catch (e) {
	      errorData = e;
	    }

	    // 19.2.3
	    queueMicrotask(() => {
	      // 19.2.3.1
	      if (errorData === null) {
	        cacheJobPromise.resolve();
	      } else { // 19.2.3.2
	        cacheJobPromise.reject(errorData);
	      }
	    });

	    return cacheJobPromise.promise
	  }

	  async delete (request, options = {}) {
	    webidl.brandCheck(this, Cache);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'Cache.delete' });

	    request = webidl.converters.RequestInfo(request);
	    options = webidl.converters.CacheQueryOptions(options);

	    /**
	     * @type {Request}
	     */
	    let r = null;

	    if (request instanceof Request) {
	      r = request[kState];

	      if (r.method !== 'GET' && !options.ignoreMethod) {
	        return false
	      }
	    } else {
	      assert(typeof request === 'string');

	      r = new Request(request)[kState];
	    }

	    /** @type {CacheBatchOperation[]} */
	    const operations = [];

	    /** @type {CacheBatchOperation} */
	    const operation = {
	      type: 'delete',
	      request: r,
	      options
	    };

	    operations.push(operation);

	    const cacheJobPromise = createDeferredPromise();

	    let errorData = null;
	    let requestResponses;

	    try {
	      requestResponses = this.#batchCacheOperations(operations);
	    } catch (e) {
	      errorData = e;
	    }

	    queueMicrotask(() => {
	      if (errorData === null) {
	        cacheJobPromise.resolve(!!requestResponses?.length);
	      } else {
	        cacheJobPromise.reject(errorData);
	      }
	    });

	    return cacheJobPromise.promise
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#dom-cache-keys
	   * @param {any} request
	   * @param {import('../../types/cache').CacheQueryOptions} options
	   * @returns {Promise<readonly Request[]>}
	   */
	  async keys (request = undefined, options = {}) {
	    webidl.brandCheck(this, Cache);

	    if (request !== undefined) request = webidl.converters.RequestInfo(request);
	    options = webidl.converters.CacheQueryOptions(options);

	    // 1.
	    let r = null;

	    // 2.
	    if (request !== undefined) {
	      // 2.1
	      if (request instanceof Request) {
	        // 2.1.1
	        r = request[kState];

	        // 2.1.2
	        if (r.method !== 'GET' && !options.ignoreMethod) {
	          return []
	        }
	      } else if (typeof request === 'string') { // 2.2
	        r = new Request(request)[kState];
	      }
	    }

	    // 4.
	    const promise = createDeferredPromise();

	    // 5.
	    // 5.1
	    const requests = [];

	    // 5.2
	    if (request === undefined) {
	      // 5.2.1
	      for (const requestResponse of this.#relevantRequestResponseList) {
	        // 5.2.1.1
	        requests.push(requestResponse[0]);
	      }
	    } else { // 5.3
	      // 5.3.1
	      const requestResponses = this.#queryCache(r, options);

	      // 5.3.2
	      for (const requestResponse of requestResponses) {
	        // 5.3.2.1
	        requests.push(requestResponse[0]);
	      }
	    }

	    // 5.4
	    queueMicrotask(() => {
	      // 5.4.1
	      const requestList = [];

	      // 5.4.2
	      for (const request of requests) {
	        const requestObject = fromInnerRequest(
	          request,
	          new AbortController().signal,
	          'immutable',
	          { settingsObject: request.client }
	        );
	        // 5.4.2.1
	        requestList.push(requestObject);
	      }

	      // 5.4.3
	      promise.resolve(Object.freeze(requestList));
	    });

	    return promise.promise
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#batch-cache-operations-algorithm
	   * @param {CacheBatchOperation[]} operations
	   * @returns {requestResponseList}
	   */
	  #batchCacheOperations (operations) {
	    // 1.
	    const cache = this.#relevantRequestResponseList;

	    // 2.
	    const backupCache = [...cache];

	    // 3.
	    const addedItems = [];

	    // 4.1
	    const resultList = [];

	    try {
	      // 4.2
	      for (const operation of operations) {
	        // 4.2.1
	        if (operation.type !== 'delete' && operation.type !== 'put') {
	          throw webidl.errors.exception({
	            header: 'Cache.#batchCacheOperations',
	            message: 'operation type does not match "delete" or "put"'
	          })
	        }

	        // 4.2.2
	        if (operation.type === 'delete' && operation.response != null) {
	          throw webidl.errors.exception({
	            header: 'Cache.#batchCacheOperations',
	            message: 'delete operation should not have an associated response'
	          })
	        }

	        // 4.2.3
	        if (this.#queryCache(operation.request, operation.options, addedItems).length) {
	          throw new DOMException('???', 'InvalidStateError')
	        }

	        // 4.2.4
	        let requestResponses;

	        // 4.2.5
	        if (operation.type === 'delete') {
	          // 4.2.5.1
	          requestResponses = this.#queryCache(operation.request, operation.options);

	          // TODO: the spec is wrong, this is needed to pass WPTs
	          if (requestResponses.length === 0) {
	            return []
	          }

	          // 4.2.5.2
	          for (const requestResponse of requestResponses) {
	            const idx = cache.indexOf(requestResponse);
	            assert(idx !== -1);

	            // 4.2.5.2.1
	            cache.splice(idx, 1);
	          }
	        } else if (operation.type === 'put') { // 4.2.6
	          // 4.2.6.1
	          if (operation.response == null) {
	            throw webidl.errors.exception({
	              header: 'Cache.#batchCacheOperations',
	              message: 'put operation should have an associated response'
	            })
	          }

	          // 4.2.6.2
	          const r = operation.request;

	          // 4.2.6.3
	          if (!urlIsHttpHttpsScheme(r.url)) {
	            throw webidl.errors.exception({
	              header: 'Cache.#batchCacheOperations',
	              message: 'expected http or https scheme'
	            })
	          }

	          // 4.2.6.4
	          if (r.method !== 'GET') {
	            throw webidl.errors.exception({
	              header: 'Cache.#batchCacheOperations',
	              message: 'not get method'
	            })
	          }

	          // 4.2.6.5
	          if (operation.options != null) {
	            throw webidl.errors.exception({
	              header: 'Cache.#batchCacheOperations',
	              message: 'options must not be defined'
	            })
	          }

	          // 4.2.6.6
	          requestResponses = this.#queryCache(operation.request);

	          // 4.2.6.7
	          for (const requestResponse of requestResponses) {
	            const idx = cache.indexOf(requestResponse);
	            assert(idx !== -1);

	            // 4.2.6.7.1
	            cache.splice(idx, 1);
	          }

	          // 4.2.6.8
	          cache.push([operation.request, operation.response]);

	          // 4.2.6.10
	          addedItems.push([operation.request, operation.response]);
	        }

	        // 4.2.7
	        resultList.push([operation.request, operation.response]);
	      }

	      // 4.3
	      return resultList
	    } catch (e) { // 5.
	      // 5.1
	      this.#relevantRequestResponseList.length = 0;

	      // 5.2
	      this.#relevantRequestResponseList = backupCache;

	      // 5.3
	      throw e
	    }
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#query-cache
	   * @param {any} requestQuery
	   * @param {import('../../types/cache').CacheQueryOptions} options
	   * @param {requestResponseList} targetStorage
	   * @returns {requestResponseList}
	   */
	  #queryCache (requestQuery, options, targetStorage) {
	    /** @type {requestResponseList} */
	    const resultList = [];

	    const storage = targetStorage ?? this.#relevantRequestResponseList;

	    for (const requestResponse of storage) {
	      const [cachedRequest, cachedResponse] = requestResponse;
	      if (this.#requestMatchesCachedItem(requestQuery, cachedRequest, cachedResponse, options)) {
	        resultList.push(requestResponse);
	      }
	    }

	    return resultList
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#request-matches-cached-item-algorithm
	   * @param {any} requestQuery
	   * @param {any} request
	   * @param {any | null} response
	   * @param {import('../../types/cache').CacheQueryOptions | undefined} options
	   * @returns {boolean}
	   */
	  #requestMatchesCachedItem (requestQuery, request, response = null, options) {
	    // if (options?.ignoreMethod === false && request.method === 'GET') {
	    //   return false
	    // }

	    const queryURL = new URL(requestQuery.url);

	    const cachedURL = new URL(request.url);

	    if (options?.ignoreSearch) {
	      cachedURL.search = '';

	      queryURL.search = '';
	    }

	    if (!urlEquals(queryURL, cachedURL, true)) {
	      return false
	    }

	    if (
	      response == null ||
	      options?.ignoreVary ||
	      !response.headersList.contains('vary')
	    ) {
	      return true
	    }

	    const fieldValues = getFieldValues(response.headersList.get('vary'));

	    for (const fieldValue of fieldValues) {
	      if (fieldValue === '*') {
	        return false
	      }

	      const requestValue = request.headersList.get(fieldValue);
	      const queryValue = requestQuery.headersList.get(fieldValue);

	      // If one has the header and the other doesn't, or one has
	      // a different value than the other, return false
	      if (requestValue !== queryValue) {
	        return false
	      }
	    }

	    return true
	  }

	  #internalMatchAll (request, options, maxResponses = Infinity) {
	    // 1.
	    let r = null;

	    // 2.
	    if (request !== undefined) {
	      if (request instanceof Request) {
	        // 2.1.1
	        r = request[kState];

	        // 2.1.2
	        if (r.method !== 'GET' && !options.ignoreMethod) {
	          return []
	        }
	      } else if (typeof request === 'string') {
	        // 2.2.1
	        r = new Request(request)[kState];
	      }
	    }

	    // 5.
	    // 5.1
	    const responses = [];

	    // 5.2
	    if (request === undefined) {
	      // 5.2.1
	      for (const requestResponse of this.#relevantRequestResponseList) {
	        responses.push(requestResponse[1]);
	      }
	    } else { // 5.3
	      // 5.3.1
	      const requestResponses = this.#queryCache(r, options);

	      // 5.3.2
	      for (const requestResponse of requestResponses) {
	        responses.push(requestResponse[1]);
	      }
	    }

	    // 5.4
	    // We don't implement CORs so we don't need to loop over the responses, yay!

	    // 5.5.1
	    const responseList = [];

	    // 5.5.2
	    for (const response of responses) {
	      // 5.5.2.1
	      const responseObject = fromInnerResponse(response, 'immutable', { settingsObject: {} });

	      responseList.push(responseObject.clone());

	      if (responseList.length >= maxResponses) {
	        break
	      }
	    }

	    // 6.
	    return Object.freeze(responseList)
	  }
	}

	Object.defineProperties(Cache.prototype, {
	  [Symbol.toStringTag]: {
	    value: 'Cache',
	    configurable: true
	  },
	  match: kEnumerableProperty,
	  matchAll: kEnumerableProperty,
	  add: kEnumerableProperty,
	  addAll: kEnumerableProperty,
	  put: kEnumerableProperty,
	  delete: kEnumerableProperty,
	  keys: kEnumerableProperty
	});

	const cacheQueryOptionConverters = [
	  {
	    key: 'ignoreSearch',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'ignoreMethod',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'ignoreVary',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  }
	];

	webidl.converters.CacheQueryOptions = webidl.dictionaryConverter(cacheQueryOptionConverters);

	webidl.converters.MultiCacheQueryOptions = webidl.dictionaryConverter([
	  ...cacheQueryOptionConverters,
	  {
	    key: 'cacheName',
	    converter: webidl.converters.DOMString
	  }
	]);

	webidl.converters.Response = webidl.interfaceConverter(Response);

	webidl.converters['sequence<RequestInfo>'] = webidl.sequenceConverter(
	  webidl.converters.RequestInfo
	);

	cache = {
	  Cache
	};
	return cache;
}

var cachestorage;
var hasRequiredCachestorage;

function requireCachestorage () {
	if (hasRequiredCachestorage) return cachestorage;
	hasRequiredCachestorage = 1;

	const { kConstruct } = requireSymbols$1();
	const { Cache } = requireCache();
	const { webidl } = requireWebidl();
	const { kEnumerableProperty } = util$m;

	class CacheStorage {
	  /**
	   * @see https://w3c.github.io/ServiceWorker/#dfn-relevant-name-to-cache-map
	   * @type {Map<string, import('./cache').requestResponseList}
	   */
	  #caches = new Map()

	  constructor () {
	    if (arguments[0] !== kConstruct) {
	      webidl.illegalConstructor();
	    }
	  }

	  async match (request, options = {}) {
	    webidl.brandCheck(this, CacheStorage);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'CacheStorage.match' });

	    request = webidl.converters.RequestInfo(request);
	    options = webidl.converters.MultiCacheQueryOptions(options);

	    // 1.
	    if (options.cacheName != null) {
	      // 1.1.1.1
	      if (this.#caches.has(options.cacheName)) {
	        // 1.1.1.1.1
	        const cacheList = this.#caches.get(options.cacheName);
	        const cache = new Cache(kConstruct, cacheList);

	        return await cache.match(request, options)
	      }
	    } else { // 2.
	      // 2.2
	      for (const cacheList of this.#caches.values()) {
	        const cache = new Cache(kConstruct, cacheList);

	        // 2.2.1.2
	        const response = await cache.match(request, options);

	        if (response !== undefined) {
	          return response
	        }
	      }
	    }
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#cache-storage-has
	   * @param {string} cacheName
	   * @returns {Promise<boolean>}
	   */
	  async has (cacheName) {
	    webidl.brandCheck(this, CacheStorage);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'CacheStorage.has' });

	    cacheName = webidl.converters.DOMString(cacheName);

	    // 2.1.1
	    // 2.2
	    return this.#caches.has(cacheName)
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#dom-cachestorage-open
	   * @param {string} cacheName
	   * @returns {Promise<Cache>}
	   */
	  async open (cacheName) {
	    webidl.brandCheck(this, CacheStorage);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'CacheStorage.open' });

	    cacheName = webidl.converters.DOMString(cacheName);

	    // 2.1
	    if (this.#caches.has(cacheName)) {
	      // await caches.open('v1') !== await caches.open('v1')

	      // 2.1.1
	      const cache = this.#caches.get(cacheName);

	      // 2.1.1.1
	      return new Cache(kConstruct, cache)
	    }

	    // 2.2
	    const cache = [];

	    // 2.3
	    this.#caches.set(cacheName, cache);

	    // 2.4
	    return new Cache(kConstruct, cache)
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#cache-storage-delete
	   * @param {string} cacheName
	   * @returns {Promise<boolean>}
	   */
	  async delete (cacheName) {
	    webidl.brandCheck(this, CacheStorage);
	    webidl.argumentLengthCheck(arguments, 1, { header: 'CacheStorage.delete' });

	    cacheName = webidl.converters.DOMString(cacheName);

	    return this.#caches.delete(cacheName)
	  }

	  /**
	   * @see https://w3c.github.io/ServiceWorker/#cache-storage-keys
	   * @returns {Promise<string[]>}
	   */
	  async keys () {
	    webidl.brandCheck(this, CacheStorage);

	    // 2.1
	    const keys = this.#caches.keys();

	    // 2.2
	    return [...keys]
	  }
	}

	Object.defineProperties(CacheStorage.prototype, {
	  [Symbol.toStringTag]: {
	    value: 'CacheStorage',
	    configurable: true
	  },
	  match: kEnumerableProperty,
	  has: kEnumerableProperty,
	  open: kEnumerableProperty,
	  delete: kEnumerableProperty,
	  keys: kEnumerableProperty
	});

	cachestorage = {
	  CacheStorage
	};
	return cachestorage;
}

var constants$1;
var hasRequiredConstants$1;

function requireConstants$1 () {
	if (hasRequiredConstants$1) return constants$1;
	hasRequiredConstants$1 = 1;

	// https://wicg.github.io/cookie-store/#cookie-maximum-attribute-value-size
	const maxAttributeValueSize = 1024;

	// https://wicg.github.io/cookie-store/#cookie-maximum-name-value-pair-size
	const maxNameValuePairSize = 4096;

	constants$1 = {
	  maxAttributeValueSize,
	  maxNameValuePairSize
	};
	return constants$1;
}

var util$3;
var hasRequiredUtil$2;

function requireUtil$2 () {
	if (hasRequiredUtil$2) return util$3;
	hasRequiredUtil$2 = 1;

	const assert = require$$0;
	const { kHeadersList } = symbols$4;

	/**
	 * @param {string} value
	 * @returns {boolean}
	 */
	function isCTLExcludingHtab (value) {
	  for (let i = 0; i < value.length; ++i) {
	    const code = value.charCodeAt(i);

	    if (
	      (code >= 0x00 && code <= 0x08) ||
	      (code >= 0x0A && code <= 0x1F) ||
	      code === 0x7F
	    ) {
	      return true
	    }
	  }
	  return false
	}

	/**
	 CHAR           = <any US-ASCII character (octets 0 - 127)>
	 token          = 1*<any CHAR except CTLs or separators>
	 separators     = "(" | ")" | "<" | ">" | "@"
	                | "," | ";" | ":" | "\" | <">
	                | "/" | "[" | "]" | "?" | "="
	                | "{" | "}" | SP | HT
	 * @param {string} name
	 */
	function validateCookieName (name) {
	  for (let i = 0; i < name.length; ++i) {
	    const code = name.charCodeAt(i);

	    if (
	      code < 0x21 || // exclude CTLs (0-31), SP and HT
	      code > 0x7E || // exclude non-ascii and DEL
	      code === 0x22 || // "
	      code === 0x28 || // (
	      code === 0x29 || // )
	      code === 0x3C || // <
	      code === 0x3E || // >
	      code === 0x40 || // @
	      code === 0x2C || // ,
	      code === 0x3B || // ;
	      code === 0x3A || // :
	      code === 0x5C || // \
	      code === 0x2F || // /
	      code === 0x5B || // [
	      code === 0x5D || // ]
	      code === 0x3F || // ?
	      code === 0x3D || // =
	      code === 0x7B || // {
	      code === 0x7D // }
	    ) {
	      throw new Error('Invalid cookie name')
	    }
	  }
	}

	/**
	 cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
	 cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
	                       ; US-ASCII characters excluding CTLs,
	                       ; whitespace DQUOTE, comma, semicolon,
	                       ; and backslash
	 * @param {string} value
	 */
	function validateCookieValue (value) {
	  let len = value.length;
	  let i = 0;

	  // if the value is wrapped in DQUOTE
	  if (value[0] === '"') {
	    if (len === 1 || value[len - 1] !== '"') {
	      throw new Error('Invalid cookie value')
	    }
	    --len;
	    ++i;
	  }

	  while (i < len) {
	    const code = value.charCodeAt(i++);

	    if (
	      code < 0x21 || // exclude CTLs (0-31)
	      code > 0x7E || // non-ascii and DEL (127)
	      code === 0x22 || // "
	      code === 0x2C || // ,
	      code === 0x3B || // ;
	      code === 0x5C // \
	    ) {
	      throw new Error('Invalid cookie value')
	    }
	  }
	}

	/**
	 * path-value        = <any CHAR except CTLs or ";">
	 * @param {string} path
	 */
	function validateCookiePath (path) {
	  for (let i = 0; i < path.length; ++i) {
	    const code = path.charCodeAt(i);

	    if (
	      code < 0x20 || // exclude CTLs (0-31)
	      code === 0x7F || // DEL
	      code === 0x3B // ;
	    ) {
	      throw new Error('Invalid cookie path')
	    }
	  }
	}

	/**
	 * I have no idea why these values aren't allowed to be honest,
	 * but Deno tests these. - Khafra
	 * @param {string} domain
	 */
	function validateCookieDomain (domain) {
	  if (
	    domain.startsWith('-') ||
	    domain.endsWith('.') ||
	    domain.endsWith('-')
	  ) {
	    throw new Error('Invalid cookie domain')
	  }
	}

	const IMFDays = [
	  'Sun', 'Mon', 'Tue', 'Wed',
	  'Thu', 'Fri', 'Sat'
	];

	const IMFMonths = [
	  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];

	const IMFPaddedNumbers = Array(61).fill(0).map((_, i) => i.toString().padStart(2, '0'));

	/**
	 * @see https://www.rfc-editor.org/rfc/rfc7231#section-7.1.1.1
	 * @param {number|Date} date
	  IMF-fixdate  = day-name "," SP date1 SP time-of-day SP GMT
	  ; fixed length/zone/capitalization subset of the format
	  ; see Section 3.3 of [RFC5322]

	  day-name     = %x4D.6F.6E ; "Mon", case-sensitive
	              / %x54.75.65 ; "Tue", case-sensitive
	              / %x57.65.64 ; "Wed", case-sensitive
	              / %x54.68.75 ; "Thu", case-sensitive
	              / %x46.72.69 ; "Fri", case-sensitive
	              / %x53.61.74 ; "Sat", case-sensitive
	              / %x53.75.6E ; "Sun", case-sensitive
	  date1        = day SP month SP year
	                  ; e.g., 02 Jun 1982

	  day          = 2DIGIT
	  month        = %x4A.61.6E ; "Jan", case-sensitive
	              / %x46.65.62 ; "Feb", case-sensitive
	              / %x4D.61.72 ; "Mar", case-sensitive
	              / %x41.70.72 ; "Apr", case-sensitive
	              / %x4D.61.79 ; "May", case-sensitive
	              / %x4A.75.6E ; "Jun", case-sensitive
	              / %x4A.75.6C ; "Jul", case-sensitive
	              / %x41.75.67 ; "Aug", case-sensitive
	              / %x53.65.70 ; "Sep", case-sensitive
	              / %x4F.63.74 ; "Oct", case-sensitive
	              / %x4E.6F.76 ; "Nov", case-sensitive
	              / %x44.65.63 ; "Dec", case-sensitive
	  year         = 4DIGIT

	  GMT          = %x47.4D.54 ; "GMT", case-sensitive

	  time-of-day  = hour ":" minute ":" second
	              ; 00:00:00 - 23:59:60 (leap second)

	  hour         = 2DIGIT
	  minute       = 2DIGIT
	  second       = 2DIGIT
	 */
	function toIMFDate (date) {
	  if (typeof date === 'number') {
	    date = new Date(date);
	  }

	  return `${IMFDays[date.getUTCDay()]}, ${IMFPaddedNumbers[date.getUTCDate()]} ${IMFMonths[date.getUTCMonth()]} ${date.getUTCFullYear()} ${IMFPaddedNumbers[date.getUTCHours()]}:${IMFPaddedNumbers[date.getUTCMinutes()]}:${IMFPaddedNumbers[date.getUTCSeconds()]} GMT`
	}

	/**
	 max-age-av        = "Max-Age=" non-zero-digit *DIGIT
	                       ; In practice, both expires-av and max-age-av
	                       ; are limited to dates representable by the
	                       ; user agent.
	 * @param {number} maxAge
	 */
	function validateCookieMaxAge (maxAge) {
	  if (maxAge < 0) {
	    throw new Error('Invalid cookie max-age')
	  }
	}

	/**
	 * @see https://www.rfc-editor.org/rfc/rfc6265#section-4.1.1
	 * @param {import('./index').Cookie} cookie
	 */
	function stringify (cookie) {
	  if (cookie.name.length === 0) {
	    return null
	  }

	  validateCookieName(cookie.name);
	  validateCookieValue(cookie.value);

	  const out = [`${cookie.name}=${cookie.value}`];

	  // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-cookie-prefixes-00#section-3.1
	  // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-cookie-prefixes-00#section-3.2
	  if (cookie.name.startsWith('__Secure-')) {
	    cookie.secure = true;
	  }

	  if (cookie.name.startsWith('__Host-')) {
	    cookie.secure = true;
	    cookie.domain = null;
	    cookie.path = '/';
	  }

	  if (cookie.secure) {
	    out.push('Secure');
	  }

	  if (cookie.httpOnly) {
	    out.push('HttpOnly');
	  }

	  if (typeof cookie.maxAge === 'number') {
	    validateCookieMaxAge(cookie.maxAge);
	    out.push(`Max-Age=${cookie.maxAge}`);
	  }

	  if (cookie.domain) {
	    validateCookieDomain(cookie.domain);
	    out.push(`Domain=${cookie.domain}`);
	  }

	  if (cookie.path) {
	    validateCookiePath(cookie.path);
	    out.push(`Path=${cookie.path}`);
	  }

	  if (cookie.expires && cookie.expires.toString() !== 'Invalid Date') {
	    out.push(`Expires=${toIMFDate(cookie.expires)}`);
	  }

	  if (cookie.sameSite) {
	    out.push(`SameSite=${cookie.sameSite}`);
	  }

	  for (const part of cookie.unparsed) {
	    if (!part.includes('=')) {
	      throw new Error('Invalid unparsed')
	    }

	    const [key, ...value] = part.split('=');

	    out.push(`${key.trim()}=${value.join('=')}`);
	  }

	  return out.join('; ')
	}

	let kHeadersListNode;

	function getHeadersList (headers) {
	  if (headers[kHeadersList]) {
	    return headers[kHeadersList]
	  }

	  if (!kHeadersListNode) {
	    kHeadersListNode = Object.getOwnPropertySymbols(headers).find(
	      (symbol) => symbol.description === 'headers list'
	    );

	    assert(kHeadersListNode, 'Headers cannot be parsed');
	  }

	  const headersList = headers[kHeadersListNode];
	  assert(headersList);

	  return headersList
	}

	util$3 = {
	  isCTLExcludingHtab,
	  validateCookieName,
	  validateCookiePath,
	  validateCookieValue,
	  toIMFDate,
	  stringify,
	  getHeadersList
	};
	return util$3;
}

var parse;
var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse;
	hasRequiredParse = 1;

	const { maxNameValuePairSize, maxAttributeValueSize } = requireConstants$1();
	const { isCTLExcludingHtab } = requireUtil$2();
	const { collectASequenceOfCodePointsFast } = requireDataUrl();
	const assert = require$$0;

	/**
	 * @description Parses the field-value attributes of a set-cookie header string.
	 * @see https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4
	 * @param {string} header
	 * @returns if the header is invalid, null will be returned
	 */
	function parseSetCookie (header) {
	  // 1. If the set-cookie-string contains a %x00-08 / %x0A-1F / %x7F
	  //    character (CTL characters excluding HTAB): Abort these steps and
	  //    ignore the set-cookie-string entirely.
	  if (isCTLExcludingHtab(header)) {
	    return null
	  }

	  let nameValuePair = '';
	  let unparsedAttributes = '';
	  let name = '';
	  let value = '';

	  // 2. If the set-cookie-string contains a %x3B (";") character:
	  if (header.includes(';')) {
	    // 1. The name-value-pair string consists of the characters up to,
	    //    but not including, the first %x3B (";"), and the unparsed-
	    //    attributes consist of the remainder of the set-cookie-string
	    //    (including the %x3B (";") in question).
	    const position = { position: 0 };

	    nameValuePair = collectASequenceOfCodePointsFast(';', header, position);
	    unparsedAttributes = header.slice(position.position);
	  } else {
	    // Otherwise:

	    // 1. The name-value-pair string consists of all the characters
	    //    contained in the set-cookie-string, and the unparsed-
	    //    attributes is the empty string.
	    nameValuePair = header;
	  }

	  // 3. If the name-value-pair string lacks a %x3D ("=") character, then
	  //    the name string is empty, and the value string is the value of
	  //    name-value-pair.
	  if (!nameValuePair.includes('=')) {
	    value = nameValuePair;
	  } else {
	    //    Otherwise, the name string consists of the characters up to, but
	    //    not including, the first %x3D ("=") character, and the (possibly
	    //    empty) value string consists of the characters after the first
	    //    %x3D ("=") character.
	    const position = { position: 0 };
	    name = collectASequenceOfCodePointsFast(
	      '=',
	      nameValuePair,
	      position
	    );
	    value = nameValuePair.slice(position.position + 1);
	  }

	  // 4. Remove any leading or trailing WSP characters from the name
	  //    string and the value string.
	  name = name.trim();
	  value = value.trim();

	  // 5. If the sum of the lengths of the name string and the value string
	  //    is more than 4096 octets, abort these steps and ignore the set-
	  //    cookie-string entirely.
	  if (name.length + value.length > maxNameValuePairSize) {
	    return null
	  }

	  // 6. The cookie-name is the name string, and the cookie-value is the
	  //    value string.
	  return {
	    name, value, ...parseUnparsedAttributes(unparsedAttributes)
	  }
	}

	/**
	 * Parses the remaining attributes of a set-cookie header
	 * @see https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4
	 * @param {string} unparsedAttributes
	 * @param {[Object.<string, unknown>]={}} cookieAttributeList
	 */
	function parseUnparsedAttributes (unparsedAttributes, cookieAttributeList = {}) {
	  // 1. If the unparsed-attributes string is empty, skip the rest of
	  //    these steps.
	  if (unparsedAttributes.length === 0) {
	    return cookieAttributeList
	  }

	  // 2. Discard the first character of the unparsed-attributes (which
	  //    will be a %x3B (";") character).
	  assert(unparsedAttributes[0] === ';');
	  unparsedAttributes = unparsedAttributes.slice(1);

	  let cookieAv = '';

	  // 3. If the remaining unparsed-attributes contains a %x3B (";")
	  //    character:
	  if (unparsedAttributes.includes(';')) {
	    // 1. Consume the characters of the unparsed-attributes up to, but
	    //    not including, the first %x3B (";") character.
	    cookieAv = collectASequenceOfCodePointsFast(
	      ';',
	      unparsedAttributes,
	      { position: 0 }
	    );
	    unparsedAttributes = unparsedAttributes.slice(cookieAv.length);
	  } else {
	    // Otherwise:

	    // 1. Consume the remainder of the unparsed-attributes.
	    cookieAv = unparsedAttributes;
	    unparsedAttributes = '';
	  }

	  // Let the cookie-av string be the characters consumed in this step.

	  let attributeName = '';
	  let attributeValue = '';

	  // 4. If the cookie-av string contains a %x3D ("=") character:
	  if (cookieAv.includes('=')) {
	    // 1. The (possibly empty) attribute-name string consists of the
	    //    characters up to, but not including, the first %x3D ("=")
	    //    character, and the (possibly empty) attribute-value string
	    //    consists of the characters after the first %x3D ("=")
	    //    character.
	    const position = { position: 0 };

	    attributeName = collectASequenceOfCodePointsFast(
	      '=',
	      cookieAv,
	      position
	    );
	    attributeValue = cookieAv.slice(position.position + 1);
	  } else {
	    // Otherwise:

	    // 1. The attribute-name string consists of the entire cookie-av
	    //    string, and the attribute-value string is empty.
	    attributeName = cookieAv;
	  }

	  // 5. Remove any leading or trailing WSP characters from the attribute-
	  //    name string and the attribute-value string.
	  attributeName = attributeName.trim();
	  attributeValue = attributeValue.trim();

	  // 6. If the attribute-value is longer than 1024 octets, ignore the
	  //    cookie-av string and return to Step 1 of this algorithm.
	  if (attributeValue.length > maxAttributeValueSize) {
	    return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList)
	  }

	  // 7. Process the attribute-name and attribute-value according to the
	  //    requirements in the following subsections.  (Notice that
	  //    attributes with unrecognized attribute-names are ignored.)
	  const attributeNameLowercase = attributeName.toLowerCase();

	  // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4.1
	  // If the attribute-name case-insensitively matches the string
	  // "Expires", the user agent MUST process the cookie-av as follows.
	  if (attributeNameLowercase === 'expires') {
	    // 1. Let the expiry-time be the result of parsing the attribute-value
	    //    as cookie-date (see Section 5.1.1).
	    const expiryTime = new Date(attributeValue);

	    // 2. If the attribute-value failed to parse as a cookie date, ignore
	    //    the cookie-av.

	    cookieAttributeList.expires = expiryTime;
	  } else if (attributeNameLowercase === 'max-age') {
	    // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4.2
	    // If the attribute-name case-insensitively matches the string "Max-
	    // Age", the user agent MUST process the cookie-av as follows.

	    // 1. If the first character of the attribute-value is not a DIGIT or a
	    //    "-" character, ignore the cookie-av.
	    const charCode = attributeValue.charCodeAt(0);

	    if ((charCode < 48 || charCode > 57) && attributeValue[0] !== '-') {
	      return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList)
	    }

	    // 2. If the remainder of attribute-value contains a non-DIGIT
	    //    character, ignore the cookie-av.
	    if (!/^\d+$/.test(attributeValue)) {
	      return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList)
	    }

	    // 3. Let delta-seconds be the attribute-value converted to an integer.
	    const deltaSeconds = Number(attributeValue);

	    // 4. Let cookie-age-limit be the maximum age of the cookie (which
	    //    SHOULD be 400 days or less, see Section 4.1.2.2).

	    // 5. Set delta-seconds to the smaller of its present value and cookie-
	    //    age-limit.
	    // deltaSeconds = Math.min(deltaSeconds * 1000, maxExpiresMs)

	    // 6. If delta-seconds is less than or equal to zero (0), let expiry-
	    //    time be the earliest representable date and time.  Otherwise, let
	    //    the expiry-time be the current date and time plus delta-seconds
	    //    seconds.
	    // const expiryTime = deltaSeconds <= 0 ? Date.now() : Date.now() + deltaSeconds

	    // 7. Append an attribute to the cookie-attribute-list with an
	    //    attribute-name of Max-Age and an attribute-value of expiry-time.
	    cookieAttributeList.maxAge = deltaSeconds;
	  } else if (attributeNameLowercase === 'domain') {
	    // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4.3
	    // If the attribute-name case-insensitively matches the string "Domain",
	    // the user agent MUST process the cookie-av as follows.

	    // 1. Let cookie-domain be the attribute-value.
	    let cookieDomain = attributeValue;

	    // 2. If cookie-domain starts with %x2E ("."), let cookie-domain be
	    //    cookie-domain without its leading %x2E (".").
	    if (cookieDomain[0] === '.') {
	      cookieDomain = cookieDomain.slice(1);
	    }

	    // 3. Convert the cookie-domain to lower case.
	    cookieDomain = cookieDomain.toLowerCase();

	    // 4. Append an attribute to the cookie-attribute-list with an
	    //    attribute-name of Domain and an attribute-value of cookie-domain.
	    cookieAttributeList.domain = cookieDomain;
	  } else if (attributeNameLowercase === 'path') {
	    // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4.4
	    // If the attribute-name case-insensitively matches the string "Path",
	    // the user agent MUST process the cookie-av as follows.

	    // 1. If the attribute-value is empty or if the first character of the
	    //    attribute-value is not %x2F ("/"):
	    let cookiePath = '';
	    if (attributeValue.length === 0 || attributeValue[0] !== '/') {
	      // 1. Let cookie-path be the default-path.
	      cookiePath = '/';
	    } else {
	      // Otherwise:

	      // 1. Let cookie-path be the attribute-value.
	      cookiePath = attributeValue;
	    }

	    // 2. Append an attribute to the cookie-attribute-list with an
	    //    attribute-name of Path and an attribute-value of cookie-path.
	    cookieAttributeList.path = cookiePath;
	  } else if (attributeNameLowercase === 'secure') {
	    // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4.5
	    // If the attribute-name case-insensitively matches the string "Secure",
	    // the user agent MUST append an attribute to the cookie-attribute-list
	    // with an attribute-name of Secure and an empty attribute-value.

	    cookieAttributeList.secure = true;
	  } else if (attributeNameLowercase === 'httponly') {
	    // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4.6
	    // If the attribute-name case-insensitively matches the string
	    // "HttpOnly", the user agent MUST append an attribute to the cookie-
	    // attribute-list with an attribute-name of HttpOnly and an empty
	    // attribute-value.

	    cookieAttributeList.httpOnly = true;
	  } else if (attributeNameLowercase === 'samesite') {
	    // https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4.7
	    // If the attribute-name case-insensitively matches the string
	    // "SameSite", the user agent MUST process the cookie-av as follows:

	    // 1. Let enforcement be "Default".
	    let enforcement = 'Default';

	    const attributeValueLowercase = attributeValue.toLowerCase();
	    // 2. If cookie-av's attribute-value is a case-insensitive match for
	    //    "None", set enforcement to "None".
	    if (attributeValueLowercase.includes('none')) {
	      enforcement = 'None';
	    }

	    // 3. If cookie-av's attribute-value is a case-insensitive match for
	    //    "Strict", set enforcement to "Strict".
	    if (attributeValueLowercase.includes('strict')) {
	      enforcement = 'Strict';
	    }

	    // 4. If cookie-av's attribute-value is a case-insensitive match for
	    //    "Lax", set enforcement to "Lax".
	    if (attributeValueLowercase.includes('lax')) {
	      enforcement = 'Lax';
	    }

	    // 5. Append an attribute to the cookie-attribute-list with an
	    //    attribute-name of "SameSite" and an attribute-value of
	    //    enforcement.
	    cookieAttributeList.sameSite = enforcement;
	  } else {
	    cookieAttributeList.unparsed ??= [];

	    cookieAttributeList.unparsed.push(`${attributeName}=${attributeValue}`);
	  }

	  // 8. Return to Step 1 of this algorithm.
	  return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList)
	}

	parse = {
	  parseSetCookie,
	  parseUnparsedAttributes
	};
	return parse;
}

var cookies;
var hasRequiredCookies;

function requireCookies () {
	if (hasRequiredCookies) return cookies;
	hasRequiredCookies = 1;

	const { parseSetCookie } = requireParse();
	const { stringify, getHeadersList } = requireUtil$2();
	const { webidl } = requireWebidl();
	const { Headers } = requireHeaders();

	/**
	 * @typedef {Object} Cookie
	 * @property {string} name
	 * @property {string} value
	 * @property {Date|number|undefined} expires
	 * @property {number|undefined} maxAge
	 * @property {string|undefined} domain
	 * @property {string|undefined} path
	 * @property {boolean|undefined} secure
	 * @property {boolean|undefined} httpOnly
	 * @property {'Strict'|'Lax'|'None'} sameSite
	 * @property {string[]} unparsed
	 */

	/**
	 * @param {Headers} headers
	 * @returns {Record<string, string>}
	 */
	function getCookies (headers) {
	  webidl.argumentLengthCheck(arguments, 1, { header: 'getCookies' });

	  webidl.brandCheck(headers, Headers, { strict: false });

	  const cookie = headers.get('cookie');
	  const out = {};

	  if (!cookie) {
	    return out
	  }

	  for (const piece of cookie.split(';')) {
	    const [name, ...value] = piece.split('=');

	    out[name.trim()] = value.join('=');
	  }

	  return out
	}

	/**
	 * @param {Headers} headers
	 * @param {string} name
	 * @param {{ path?: string, domain?: string }|undefined} attributes
	 * @returns {void}
	 */
	function deleteCookie (headers, name, attributes) {
	  webidl.argumentLengthCheck(arguments, 2, { header: 'deleteCookie' });

	  webidl.brandCheck(headers, Headers, { strict: false });

	  name = webidl.converters.DOMString(name);
	  attributes = webidl.converters.DeleteCookieAttributes(attributes);

	  // Matches behavior of
	  // https://github.com/denoland/deno_std/blob/63827b16330b82489a04614027c33b7904e08be5/http/cookie.ts#L278
	  setCookie(headers, {
	    name,
	    value: '',
	    expires: new Date(0),
	    ...attributes
	  });
	}

	/**
	 * @param {Headers} headers
	 * @returns {Cookie[]}
	 */
	function getSetCookies (headers) {
	  webidl.argumentLengthCheck(arguments, 1, { header: 'getSetCookies' });

	  webidl.brandCheck(headers, Headers, { strict: false });

	  const cookies = getHeadersList(headers).cookies;

	  if (!cookies) {
	    return []
	  }

	  // In older versions of undici, cookies is a list of name:value.
	  return cookies.map((pair) => parseSetCookie(Array.isArray(pair) ? pair[1] : pair))
	}

	/**
	 * @param {Headers} headers
	 * @param {Cookie} cookie
	 * @returns {void}
	 */
	function setCookie (headers, cookie) {
	  webidl.argumentLengthCheck(arguments, 2, { header: 'setCookie' });

	  webidl.brandCheck(headers, Headers, { strict: false });

	  cookie = webidl.converters.Cookie(cookie);

	  const str = stringify(cookie);

	  if (str) {
	    headers.append('Set-Cookie', str);
	  }
	}

	webidl.converters.DeleteCookieAttributes = webidl.dictionaryConverter([
	  {
	    converter: webidl.nullableConverter(webidl.converters.DOMString),
	    key: 'path',
	    defaultValue: null
	  },
	  {
	    converter: webidl.nullableConverter(webidl.converters.DOMString),
	    key: 'domain',
	    defaultValue: null
	  }
	]);

	webidl.converters.Cookie = webidl.dictionaryConverter([
	  {
	    converter: webidl.converters.DOMString,
	    key: 'name'
	  },
	  {
	    converter: webidl.converters.DOMString,
	    key: 'value'
	  },
	  {
	    converter: webidl.nullableConverter((value) => {
	      if (typeof value === 'number') {
	        return webidl.converters['unsigned long long'](value)
	      }

	      return new Date(value)
	    }),
	    key: 'expires',
	    defaultValue: null
	  },
	  {
	    converter: webidl.nullableConverter(webidl.converters['long long']),
	    key: 'maxAge',
	    defaultValue: null
	  },
	  {
	    converter: webidl.nullableConverter(webidl.converters.DOMString),
	    key: 'domain',
	    defaultValue: null
	  },
	  {
	    converter: webidl.nullableConverter(webidl.converters.DOMString),
	    key: 'path',
	    defaultValue: null
	  },
	  {
	    converter: webidl.nullableConverter(webidl.converters.boolean),
	    key: 'secure',
	    defaultValue: null
	  },
	  {
	    converter: webidl.nullableConverter(webidl.converters.boolean),
	    key: 'httpOnly',
	    defaultValue: null
	  },
	  {
	    converter: webidl.converters.USVString,
	    key: 'sameSite',
	    allowedValues: ['Strict', 'Lax', 'None']
	  },
	  {
	    converter: webidl.sequenceConverter(webidl.converters.DOMString),
	    key: 'unparsed',
	    defaultValue: []
	  }
	]);

	cookies = {
	  getCookies,
	  deleteCookie,
	  getSetCookies,
	  setCookie
	};
	return cookies;
}

var events;
var hasRequiredEvents;

function requireEvents () {
	if (hasRequiredEvents) return events;
	hasRequiredEvents = 1;

	const { webidl } = requireWebidl();
	const { kEnumerableProperty } = util$m;
	const { MessagePort } = require$$2$1;

	/**
	 * @see https://html.spec.whatwg.org/multipage/comms.html#messageevent
	 */
	class MessageEvent extends Event {
	  #eventInit

	  constructor (type, eventInitDict = {}) {
	    webidl.argumentLengthCheck(arguments, 1, { header: 'MessageEvent constructor' });

	    type = webidl.converters.DOMString(type);
	    eventInitDict = webidl.converters.MessageEventInit(eventInitDict);

	    super(type, eventInitDict);

	    this.#eventInit = eventInitDict;
	  }

	  get data () {
	    webidl.brandCheck(this, MessageEvent);

	    return this.#eventInit.data
	  }

	  get origin () {
	    webidl.brandCheck(this, MessageEvent);

	    return this.#eventInit.origin
	  }

	  get lastEventId () {
	    webidl.brandCheck(this, MessageEvent);

	    return this.#eventInit.lastEventId
	  }

	  get source () {
	    webidl.brandCheck(this, MessageEvent);

	    return this.#eventInit.source
	  }

	  get ports () {
	    webidl.brandCheck(this, MessageEvent);

	    if (!Object.isFrozen(this.#eventInit.ports)) {
	      Object.freeze(this.#eventInit.ports);
	    }

	    return this.#eventInit.ports
	  }

	  initMessageEvent (
	    type,
	    bubbles = false,
	    cancelable = false,
	    data = null,
	    origin = '',
	    lastEventId = '',
	    source = null,
	    ports = []
	  ) {
	    webidl.brandCheck(this, MessageEvent);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'MessageEvent.initMessageEvent' });

	    return new MessageEvent(type, {
	      bubbles, cancelable, data, origin, lastEventId, source, ports
	    })
	  }
	}

	/**
	 * @see https://websockets.spec.whatwg.org/#the-closeevent-interface
	 */
	class CloseEvent extends Event {
	  #eventInit

	  constructor (type, eventInitDict = {}) {
	    webidl.argumentLengthCheck(arguments, 1, { header: 'CloseEvent constructor' });

	    type = webidl.converters.DOMString(type);
	    eventInitDict = webidl.converters.CloseEventInit(eventInitDict);

	    super(type, eventInitDict);

	    this.#eventInit = eventInitDict;
	  }

	  get wasClean () {
	    webidl.brandCheck(this, CloseEvent);

	    return this.#eventInit.wasClean
	  }

	  get code () {
	    webidl.brandCheck(this, CloseEvent);

	    return this.#eventInit.code
	  }

	  get reason () {
	    webidl.brandCheck(this, CloseEvent);

	    return this.#eventInit.reason
	  }
	}

	// https://html.spec.whatwg.org/multipage/webappapis.html#the-errorevent-interface
	class ErrorEvent extends Event {
	  #eventInit

	  constructor (type, eventInitDict) {
	    webidl.argumentLengthCheck(arguments, 1, { header: 'ErrorEvent constructor' });

	    super(type, eventInitDict);

	    type = webidl.converters.DOMString(type);
	    eventInitDict = webidl.converters.ErrorEventInit(eventInitDict ?? {});

	    this.#eventInit = eventInitDict;
	  }

	  get message () {
	    webidl.brandCheck(this, ErrorEvent);

	    return this.#eventInit.message
	  }

	  get filename () {
	    webidl.brandCheck(this, ErrorEvent);

	    return this.#eventInit.filename
	  }

	  get lineno () {
	    webidl.brandCheck(this, ErrorEvent);

	    return this.#eventInit.lineno
	  }

	  get colno () {
	    webidl.brandCheck(this, ErrorEvent);

	    return this.#eventInit.colno
	  }

	  get error () {
	    webidl.brandCheck(this, ErrorEvent);

	    return this.#eventInit.error
	  }
	}

	Object.defineProperties(MessageEvent.prototype, {
	  [Symbol.toStringTag]: {
	    value: 'MessageEvent',
	    configurable: true
	  },
	  data: kEnumerableProperty,
	  origin: kEnumerableProperty,
	  lastEventId: kEnumerableProperty,
	  source: kEnumerableProperty,
	  ports: kEnumerableProperty,
	  initMessageEvent: kEnumerableProperty
	});

	Object.defineProperties(CloseEvent.prototype, {
	  [Symbol.toStringTag]: {
	    value: 'CloseEvent',
	    configurable: true
	  },
	  reason: kEnumerableProperty,
	  code: kEnumerableProperty,
	  wasClean: kEnumerableProperty
	});

	Object.defineProperties(ErrorEvent.prototype, {
	  [Symbol.toStringTag]: {
	    value: 'ErrorEvent',
	    configurable: true
	  },
	  message: kEnumerableProperty,
	  filename: kEnumerableProperty,
	  lineno: kEnumerableProperty,
	  colno: kEnumerableProperty,
	  error: kEnumerableProperty
	});

	webidl.converters.MessagePort = webidl.interfaceConverter(MessagePort);

	webidl.converters['sequence<MessagePort>'] = webidl.sequenceConverter(
	  webidl.converters.MessagePort
	);

	const eventInit = [
	  {
	    key: 'bubbles',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'cancelable',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'composed',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  }
	];

	webidl.converters.MessageEventInit = webidl.dictionaryConverter([
	  ...eventInit,
	  {
	    key: 'data',
	    converter: webidl.converters.any,
	    defaultValue: null
	  },
	  {
	    key: 'origin',
	    converter: webidl.converters.USVString,
	    defaultValue: ''
	  },
	  {
	    key: 'lastEventId',
	    converter: webidl.converters.DOMString,
	    defaultValue: ''
	  },
	  {
	    key: 'source',
	    // Node doesn't implement WindowProxy or ServiceWorker, so the only
	    // valid value for source is a MessagePort.
	    converter: webidl.nullableConverter(webidl.converters.MessagePort),
	    defaultValue: null
	  },
	  {
	    key: 'ports',
	    converter: webidl.converters['sequence<MessagePort>'],
	    get defaultValue () {
	      return []
	    }
	  }
	]);

	webidl.converters.CloseEventInit = webidl.dictionaryConverter([
	  ...eventInit,
	  {
	    key: 'wasClean',
	    converter: webidl.converters.boolean,
	    defaultValue: false
	  },
	  {
	    key: 'code',
	    converter: webidl.converters['unsigned short'],
	    defaultValue: 0
	  },
	  {
	    key: 'reason',
	    converter: webidl.converters.USVString,
	    defaultValue: ''
	  }
	]);

	webidl.converters.ErrorEventInit = webidl.dictionaryConverter([
	  ...eventInit,
	  {
	    key: 'message',
	    converter: webidl.converters.DOMString,
	    defaultValue: ''
	  },
	  {
	    key: 'filename',
	    converter: webidl.converters.USVString,
	    defaultValue: ''
	  },
	  {
	    key: 'lineno',
	    converter: webidl.converters['unsigned long'],
	    defaultValue: 0
	  },
	  {
	    key: 'colno',
	    converter: webidl.converters['unsigned long'],
	    defaultValue: 0
	  },
	  {
	    key: 'error',
	    converter: webidl.converters.any
	  }
	]);

	events = {
	  MessageEvent,
	  CloseEvent,
	  ErrorEvent
	};
	return events;
}

var constants;
var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;

	// This is a Globally Unique Identifier unique used
	// to validate that the endpoint accepts websocket
	// connections.
	// See https://www.rfc-editor.org/rfc/rfc6455.html#section-1.3
	const uid = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

	/** @type {PropertyDescriptor} */
	const staticPropertyDescriptors = {
	  enumerable: true,
	  writable: false,
	  configurable: false
	};

	const states = {
	  CONNECTING: 0,
	  OPEN: 1,
	  CLOSING: 2,
	  CLOSED: 3
	};

	const sentCloseFrameState = {
	  NOT_SENT: 0,
	  PROCESSING: 1,
	  SENT: 2
	};

	const opcodes = {
	  CONTINUATION: 0x0,
	  TEXT: 0x1,
	  BINARY: 0x2,
	  CLOSE: 0x8,
	  PING: 0x9,
	  PONG: 0xA
	};

	const maxUnsigned16Bit = 2 ** 16 - 1; // 65535

	const parserStates = {
	  INFO: 0,
	  PAYLOADLENGTH_16: 2,
	  PAYLOADLENGTH_64: 3,
	  READ_DATA: 4
	};

	const emptyBuffer = Buffer.allocUnsafe(0);

	constants = {
	  uid,
	  sentCloseFrameState,
	  staticPropertyDescriptors,
	  states,
	  opcodes,
	  maxUnsigned16Bit,
	  parserStates,
	  emptyBuffer
	};
	return constants;
}

var symbols;
var hasRequiredSymbols;

function requireSymbols () {
	if (hasRequiredSymbols) return symbols;
	hasRequiredSymbols = 1;

	symbols = {
	  kWebSocketURL: Symbol('url'),
	  kReadyState: Symbol('ready state'),
	  kController: Symbol('controller'),
	  kResponse: Symbol('response'),
	  kBinaryType: Symbol('binary type'),
	  kSentClose: Symbol('sent close'),
	  kReceivedClose: Symbol('received close'),
	  kByteParser: Symbol('byte parser')
	};
	return symbols;
}

var util$2;
var hasRequiredUtil$1;

function requireUtil$1 () {
	if (hasRequiredUtil$1) return util$2;
	hasRequiredUtil$1 = 1;

	const { kReadyState, kController, kResponse, kBinaryType, kWebSocketURL } = requireSymbols();
	const { states, opcodes } = requireConstants();
	const { MessageEvent, ErrorEvent } = requireEvents();

	/* globals Blob */

	/**
	 * @param {import('./websocket').WebSocket} ws
	 * @returns {boolean}
	 */
	function isConnecting (ws) {
	  // If the WebSocket connection is not yet established, and the connection
	  // is not yet closed, then the WebSocket connection is in the CONNECTING state.
	  return ws[kReadyState] === states.CONNECTING
	}

	/**
	 * @param {import('./websocket').WebSocket} ws
	 * @returns {boolean}
	 */
	function isEstablished (ws) {
	  // If the server's response is validated as provided for above, it is
	  // said that _The WebSocket Connection is Established_ and that the
	  // WebSocket Connection is in the OPEN state.
	  return ws[kReadyState] === states.OPEN
	}

	/**
	 * @param {import('./websocket').WebSocket} ws
	 * @returns {boolean}
	 */
	function isClosing (ws) {
	  // Upon either sending or receiving a Close control frame, it is said
	  // that _The WebSocket Closing Handshake is Started_ and that the
	  // WebSocket connection is in the CLOSING state.
	  return ws[kReadyState] === states.CLOSING
	}

	/**
	 * @param {import('./websocket').WebSocket} ws
	 * @returns {boolean}
	 */
	function isClosed (ws) {
	  return ws[kReadyState] === states.CLOSED
	}

	/**
	 * @see https://dom.spec.whatwg.org/#concept-event-fire
	 * @param {string} e
	 * @param {EventTarget} target
	 * @param {EventInit | undefined} eventInitDict
	 */
	function fireEvent (e, target, eventConstructor = Event, eventInitDict = {}) {
	  // 1. If eventConstructor is not given, then let eventConstructor be Event.

	  // 2. Let event be the result of creating an event given eventConstructor,
	  //    in the relevant realm of target.
	  // 3. Initialize event’s type attribute to e.
	  const event = new eventConstructor(e, eventInitDict); // eslint-disable-line new-cap

	  // 4. Initialize any other IDL attributes of event as described in the
	  //    invocation of this algorithm.

	  // 5. Return the result of dispatching event at target, with legacy target
	  //    override flag set if set.
	  target.dispatchEvent(event);
	}

	/**
	 * @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
	 * @param {import('./websocket').WebSocket} ws
	 * @param {number} type Opcode
	 * @param {Buffer} data application data
	 */
	function websocketMessageReceived (ws, type, data) {
	  // 1. If ready state is not OPEN (1), then return.
	  if (ws[kReadyState] !== states.OPEN) {
	    return
	  }

	  // 2. Let dataForEvent be determined by switching on type and binary type:
	  let dataForEvent;

	  if (type === opcodes.TEXT) {
	    // -> type indicates that the data is Text
	    //      a new DOMString containing data
	    try {
	      dataForEvent = new TextDecoder('utf-8', { fatal: true }).decode(data);
	    } catch {
	      failWebsocketConnection(ws, 'Received invalid UTF-8 in text frame.');
	      return
	    }
	  } else if (type === opcodes.BINARY) {
	    if (ws[kBinaryType] === 'blob') {
	      // -> type indicates that the data is Binary and binary type is "blob"
	      //      a new Blob object, created in the relevant Realm of the WebSocket
	      //      object, that represents data as its raw data
	      dataForEvent = new Blob([data]);
	    } else {
	      // -> type indicates that the data is Binary and binary type is "arraybuffer"
	      //      a new ArrayBuffer object, created in the relevant Realm of the
	      //      WebSocket object, whose contents are data
	      dataForEvent = new Uint8Array(data).buffer;
	    }
	  }

	  // 3. Fire an event named message at the WebSocket object, using MessageEvent,
	  //    with the origin attribute initialized to the serialization of the WebSocket
	  //    object’s url's origin, and the data attribute initialized to dataForEvent.
	  fireEvent('message', ws, MessageEvent, {
	    origin: ws[kWebSocketURL].origin,
	    data: dataForEvent
	  });
	}

	/**
	 * @see https://datatracker.ietf.org/doc/html/rfc6455
	 * @see https://datatracker.ietf.org/doc/html/rfc2616
	 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=398407
	 * @param {string} protocol
	 */
	function isValidSubprotocol (protocol) {
	  // If present, this value indicates one
	  // or more comma-separated subprotocol the client wishes to speak,
	  // ordered by preference.  The elements that comprise this value
	  // MUST be non-empty strings with characters in the range U+0021 to
	  // U+007E not including separator characters as defined in
	  // [RFC2616] and MUST all be unique strings.
	  if (protocol.length === 0) {
	    return false
	  }

	  for (let i = 0; i < protocol.length; ++i) {
	    const code = protocol.charCodeAt(i);

	    if (
	      code < 0x21 || // CTL, contains SP (0x20) and HT (0x09)
	      code > 0x7E ||
	      code === 0x22 || // "
	      code === 0x28 || // (
	      code === 0x29 || // )
	      code === 0x2C || // ,
	      code === 0x2F || // /
	      code === 0x3A || // :
	      code === 0x3B || // ;
	      code === 0x3C || // <
	      code === 0x3D || // =
	      code === 0x3E || // >
	      code === 0x3F || // ?
	      code === 0x40 || // @
	      code === 0x5B || // [
	      code === 0x5C || // \
	      code === 0x5D || // ]
	      code === 0x7B || // {
	      code === 0x7D // }
	    ) {
	      return false
	    }
	  }

	  return true
	}

	/**
	 * @see https://datatracker.ietf.org/doc/html/rfc6455#section-7-4
	 * @param {number} code
	 */
	function isValidStatusCode (code) {
	  if (code >= 1000 && code < 1015) {
	    return (
	      code !== 1004 && // reserved
	      code !== 1005 && // "MUST NOT be set as a status code"
	      code !== 1006 // "MUST NOT be set as a status code"
	    )
	  }

	  return code >= 3000 && code <= 4999
	}

	/**
	 * @param {import('./websocket').WebSocket} ws
	 * @param {string|undefined} reason
	 */
	function failWebsocketConnection (ws, reason) {
	  const { [kController]: controller, [kResponse]: response } = ws;

	  controller.abort();

	  if (response?.socket && !response.socket.destroyed) {
	    response.socket.destroy();
	  }

	  if (reason) {
	    // TODO: process.nextTick
	    fireEvent('error', ws, ErrorEvent, {
	      error: new Error(reason)
	    });
	  }
	}

	util$2 = {
	  isConnecting,
	  isEstablished,
	  isClosing,
	  isClosed,
	  fireEvent,
	  isValidSubprotocol,
	  isValidStatusCode,
	  failWebsocketConnection,
	  websocketMessageReceived
	};
	return util$2;
}

var connection;
var hasRequiredConnection;

function requireConnection () {
	if (hasRequiredConnection) return connection;
	hasRequiredConnection = 1;

	const { uid, states, sentCloseFrameState } = requireConstants();
	const {
	  kReadyState,
	  kSentClose,
	  kByteParser,
	  kReceivedClose
	} = requireSymbols();
	const { fireEvent, failWebsocketConnection } = requireUtil$1();
	const { channels } = diagnostics;
	const { CloseEvent } = requireEvents();
	const { makeRequest } = requireRequest();
	const { fetching } = requireFetch();
	const { Headers } = requireHeaders();
	const { getDecodeSplit } = requireUtil$5();
	const { kHeadersList } = symbols$4;

	/** @type {import('crypto')} */
	let crypto;
	try {
	  crypto = require('node:crypto');
	/* c8 ignore next 3 */
	} catch {

	}

	/**
	 * @see https://websockets.spec.whatwg.org/#concept-websocket-establish
	 * @param {URL} url
	 * @param {string|string[]} protocols
	 * @param {import('./websocket').WebSocket} ws
	 * @param {(response: any) => void} onEstablish
	 * @param {Partial<import('../../types/websocket').WebSocketInit>} options
	 */
	function establishWebSocketConnection (url, protocols, ws, onEstablish, options) {
	  // 1. Let requestURL be a copy of url, with its scheme set to "http", if url’s
	  //    scheme is "ws", and to "https" otherwise.
	  const requestURL = url;

	  requestURL.protocol = url.protocol === 'ws:' ? 'http:' : 'https:';

	  // 2. Let request be a new request, whose URL is requestURL, client is client,
	  //    service-workers mode is "none", referrer is "no-referrer", mode is
	  //    "websocket", credentials mode is "include", cache mode is "no-store" ,
	  //    and redirect mode is "error".
	  const request = makeRequest({
	    urlList: [requestURL],
	    serviceWorkers: 'none',
	    referrer: 'no-referrer',
	    mode: 'websocket',
	    credentials: 'include',
	    cache: 'no-store',
	    redirect: 'error'
	  });

	  // Note: undici extension, allow setting custom headers.
	  if (options.headers) {
	    const headersList = new Headers(options.headers)[kHeadersList];

	    request.headersList = headersList;
	  }

	  // 3. Append (`Upgrade`, `websocket`) to request’s header list.
	  // 4. Append (`Connection`, `Upgrade`) to request’s header list.
	  // Note: both of these are handled by undici currently.
	  // https://github.com/nodejs/undici/blob/68c269c4144c446f3f1220951338daef4a6b5ec4/lib/client.js#L1397

	  // 5. Let keyValue be a nonce consisting of a randomly selected
	  //    16-byte value that has been forgiving-base64-encoded and
	  //    isomorphic encoded.
	  const keyValue = crypto.randomBytes(16).toString('base64');

	  // 6. Append (`Sec-WebSocket-Key`, keyValue) to request’s
	  //    header list.
	  request.headersList.append('sec-websocket-key', keyValue);

	  // 7. Append (`Sec-WebSocket-Version`, `13`) to request’s
	  //    header list.
	  request.headersList.append('sec-websocket-version', '13');

	  // 8. For each protocol in protocols, combine
	  //    (`Sec-WebSocket-Protocol`, protocol) in request’s header
	  //    list.
	  for (const protocol of protocols) {
	    request.headersList.append('sec-websocket-protocol', protocol);
	  }

	  // 9. Let permessageDeflate be a user-agent defined
	  //    "permessage-deflate" extension header value.
	  // https://github.com/mozilla/gecko-dev/blob/ce78234f5e653a5d3916813ff990f053510227bc/netwerk/protocol/websocket/WebSocketChannel.cpp#L2673
	  // TODO: enable once permessage-deflate is supported
	  const permessageDeflate = ''; // 'permessage-deflate; 15'

	  // 10. Append (`Sec-WebSocket-Extensions`, permessageDeflate) to
	  //     request’s header list.
	  // request.headersList.append('sec-websocket-extensions', permessageDeflate)

	  // 11. Fetch request with useParallelQueue set to true, and
	  //     processResponse given response being these steps:
	  const controller = fetching({
	    request,
	    useParallelQueue: true,
	    dispatcher: options.dispatcher,
	    processResponse (response) {
	      // 1. If response is a network error or its status is not 101,
	      //    fail the WebSocket connection.
	      if (response.type === 'error' || response.status !== 101) {
	        failWebsocketConnection(ws, 'Received network error or non-101 status code.');
	        return
	      }

	      // 2. If protocols is not the empty list and extracting header
	      //    list values given `Sec-WebSocket-Protocol` and response’s
	      //    header list results in null, failure, or the empty byte
	      //    sequence, then fail the WebSocket connection.
	      if (protocols.length !== 0 && !response.headersList.get('Sec-WebSocket-Protocol')) {
	        failWebsocketConnection(ws, 'Server did not respond with sent protocols.');
	        return
	      }

	      // 3. Follow the requirements stated step 2 to step 6, inclusive,
	      //    of the last set of steps in section 4.1 of The WebSocket
	      //    Protocol to validate response. This either results in fail
	      //    the WebSocket connection or the WebSocket connection is
	      //    established.

	      // 2. If the response lacks an |Upgrade| header field or the |Upgrade|
	      //    header field contains a value that is not an ASCII case-
	      //    insensitive match for the value "websocket", the client MUST
	      //    _Fail the WebSocket Connection_.
	      if (response.headersList.get('Upgrade')?.toLowerCase() !== 'websocket') {
	        failWebsocketConnection(ws, 'Server did not set Upgrade header to "websocket".');
	        return
	      }

	      // 3. If the response lacks a |Connection| header field or the
	      //    |Connection| header field doesn't contain a token that is an
	      //    ASCII case-insensitive match for the value "Upgrade", the client
	      //    MUST _Fail the WebSocket Connection_.
	      if (response.headersList.get('Connection')?.toLowerCase() !== 'upgrade') {
	        failWebsocketConnection(ws, 'Server did not set Connection header to "upgrade".');
	        return
	      }

	      // 4. If the response lacks a |Sec-WebSocket-Accept| header field or
	      //    the |Sec-WebSocket-Accept| contains a value other than the
	      //    base64-encoded SHA-1 of the concatenation of the |Sec-WebSocket-
	      //    Key| (as a string, not base64-decoded) with the string "258EAFA5-
	      //    E914-47DA-95CA-C5AB0DC85B11" but ignoring any leading and
	      //    trailing whitespace, the client MUST _Fail the WebSocket
	      //    Connection_.
	      const secWSAccept = response.headersList.get('Sec-WebSocket-Accept');
	      const digest = crypto.createHash('sha1').update(keyValue + uid).digest('base64');
	      if (secWSAccept !== digest) {
	        failWebsocketConnection(ws, 'Incorrect hash received in Sec-WebSocket-Accept header.');
	        return
	      }

	      // 5. If the response includes a |Sec-WebSocket-Extensions| header
	      //    field and this header field indicates the use of an extension
	      //    that was not present in the client's handshake (the server has
	      //    indicated an extension not requested by the client), the client
	      //    MUST _Fail the WebSocket Connection_.  (The parsing of this
	      //    header field to determine which extensions are requested is
	      //    discussed in Section 9.1.)
	      const secExtension = response.headersList.get('Sec-WebSocket-Extensions');

	      if (secExtension !== null && secExtension !== permessageDeflate) {
	        failWebsocketConnection(ws, 'Received different permessage-deflate than the one set.');
	        return
	      }

	      // 6. If the response includes a |Sec-WebSocket-Protocol| header field
	      //    and this header field indicates the use of a subprotocol that was
	      //    not present in the client's handshake (the server has indicated a
	      //    subprotocol not requested by the client), the client MUST _Fail
	      //    the WebSocket Connection_.
	      const secProtocol = response.headersList.get('Sec-WebSocket-Protocol');

	      if (secProtocol !== null) {
	        const requestProtocols = getDecodeSplit('sec-websocket-protocol', request.headersList);

	        // The client can request that the server use a specific subprotocol by
	        // including the |Sec-WebSocket-Protocol| field in its handshake.  If it
	        // is specified, the server needs to include the same field and one of
	        // the selected subprotocol values in its response for the connection to
	        // be established.
	        if (!requestProtocols.includes(secProtocol)) {
	          failWebsocketConnection(ws, 'Protocol was not set in the opening handshake.');
	          return
	        }
	      }

	      response.socket.on('data', onSocketData);
	      response.socket.on('close', onSocketClose);
	      response.socket.on('error', onSocketError);

	      if (channels.open.hasSubscribers) {
	        channels.open.publish({
	          address: response.socket.address(),
	          protocol: secProtocol,
	          extensions: secExtension
	        });
	      }

	      onEstablish(response);
	    }
	  });

	  return controller
	}

	/**
	 * @param {Buffer} chunk
	 */
	function onSocketData (chunk) {
	  if (!this.ws[kByteParser].write(chunk)) {
	    this.pause();
	  }
	}

	/**
	 * @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
	 * @see https://datatracker.ietf.org/doc/html/rfc6455#section-7.1.4
	 */
	function onSocketClose () {
	  const { ws } = this;

	  // If the TCP connection was closed after the
	  // WebSocket closing handshake was completed, the WebSocket connection
	  // is said to have been closed _cleanly_.
	  const wasClean = ws[kSentClose] === sentCloseFrameState.SENT && ws[kReceivedClose];

	  let code = 1005;
	  let reason = '';

	  const result = ws[kByteParser].closingInfo;

	  if (result) {
	    code = result.code ?? 1005;
	    reason = result.reason;
	  } else if (ws[kSentClose] !== sentCloseFrameState.SENT) {
	    // If _The WebSocket
	    // Connection is Closed_ and no Close control frame was received by the
	    // endpoint (such as could occur if the underlying transport connection
	    // is lost), _The WebSocket Connection Close Code_ is considered to be
	    // 1006.
	    code = 1006;
	  }

	  // 1. Change the ready state to CLOSED (3).
	  ws[kReadyState] = states.CLOSED;

	  // 2. If the user agent was required to fail the WebSocket
	  //    connection, or if the WebSocket connection was closed
	  //    after being flagged as full, fire an event named error
	  //    at the WebSocket object.
	  // TODO

	  // 3. Fire an event named close at the WebSocket object,
	  //    using CloseEvent, with the wasClean attribute
	  //    initialized to true if the connection closed cleanly
	  //    and false otherwise, the code attribute initialized to
	  //    the WebSocket connection close code, and the reason
	  //    attribute initialized to the result of applying UTF-8
	  //    decode without BOM to the WebSocket connection close
	  //    reason.
	  // TODO: process.nextTick
	  fireEvent('close', ws, CloseEvent, {
	    wasClean, code, reason
	  });

	  if (channels.close.hasSubscribers) {
	    channels.close.publish({
	      websocket: ws,
	      code,
	      reason
	    });
	  }
	}

	function onSocketError (error) {
	  const { ws } = this;

	  ws[kReadyState] = states.CLOSING;

	  if (channels.socketError.hasSubscribers) {
	    channels.socketError.publish(error);
	  }

	  this.destroy();
	}

	connection = {
	  establishWebSocketConnection
	};
	return connection;
}

var frame;
var hasRequiredFrame;

function requireFrame () {
	if (hasRequiredFrame) return frame;
	hasRequiredFrame = 1;

	const { maxUnsigned16Bit } = requireConstants();

	/** @type {import('crypto')} */
	let crypto;
	try {
	  crypto = require('node:crypto');
	/* c8 ignore next 3 */
	} catch {

	}

	class WebsocketFrameSend {
	  /**
	   * @param {Buffer|undefined} data
	   */
	  constructor (data) {
	    this.frameData = data;
	    this.maskKey = crypto.randomBytes(4);
	  }

	  createFrame (opcode) {
	    const bodyLength = this.frameData?.byteLength ?? 0;

	    /** @type {number} */
	    let payloadLength = bodyLength; // 0-125
	    let offset = 6;

	    if (bodyLength > maxUnsigned16Bit) {
	      offset += 8; // payload length is next 8 bytes
	      payloadLength = 127;
	    } else if (bodyLength > 125) {
	      offset += 2; // payload length is next 2 bytes
	      payloadLength = 126;
	    }

	    const buffer = Buffer.allocUnsafe(bodyLength + offset);

	    // Clear first 2 bytes, everything else is overwritten
	    buffer[0] = buffer[1] = 0;
	    buffer[0] |= 0x80; // FIN
	    buffer[0] = (buffer[0] & 0xF0) + opcode; // opcode

	    /*! ws. MIT License. Einar Otto Stangvik <einaros@gmail.com> */
	    buffer[offset - 4] = this.maskKey[0];
	    buffer[offset - 3] = this.maskKey[1];
	    buffer[offset - 2] = this.maskKey[2];
	    buffer[offset - 1] = this.maskKey[3];

	    buffer[1] = payloadLength;

	    if (payloadLength === 126) {
	      buffer.writeUInt16BE(bodyLength, 2);
	    } else if (payloadLength === 127) {
	      // Clear extended payload length
	      buffer[2] = buffer[3] = 0;
	      buffer.writeUIntBE(bodyLength, 4, 6);
	    }

	    buffer[1] |= 0x80; // MASK

	    // mask body
	    for (let i = 0; i < bodyLength; i++) {
	      buffer[offset + i] = this.frameData[i] ^ this.maskKey[i % 4];
	    }

	    return buffer
	  }
	}

	frame = {
	  WebsocketFrameSend
	};
	return frame;
}

var receiver;
var hasRequiredReceiver;

function requireReceiver () {
	if (hasRequiredReceiver) return receiver;
	hasRequiredReceiver = 1;

	const { Writable } = require$$0$1;
	const { parserStates, opcodes, states, emptyBuffer, sentCloseFrameState } = requireConstants();
	const { kReadyState, kSentClose, kResponse, kReceivedClose } = requireSymbols();
	const { channels } = diagnostics;
	const { isValidStatusCode, failWebsocketConnection, websocketMessageReceived } = requireUtil$1();
	const { WebsocketFrameSend } = requireFrame();

	// This code was influenced by ws released under the MIT license.
	// Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	// Copyright (c) 2013 Arnout Kazemier and contributors
	// Copyright (c) 2016 Luigi Pinca and contributors

	class ByteParser extends Writable {
	  #buffers = []
	  #byteOffset = 0

	  #state = parserStates.INFO

	  #info = {}
	  #fragments = []

	  constructor (ws) {
	    super();

	    this.ws = ws;
	  }

	  /**
	   * @param {Buffer} chunk
	   * @param {() => void} callback
	   */
	  _write (chunk, _, callback) {
	    this.#buffers.push(chunk);
	    this.#byteOffset += chunk.length;

	    this.run(callback);
	  }

	  /**
	   * Runs whenever a new chunk is received.
	   * Callback is called whenever there are no more chunks buffering,
	   * or not enough bytes are buffered to parse.
	   */
	  run (callback) {
	    while (true) {
	      if (this.#state === parserStates.INFO) {
	        // If there aren't enough bytes to parse the payload length, etc.
	        if (this.#byteOffset < 2) {
	          return callback()
	        }

	        const buffer = this.consume(2);

	        this.#info.fin = (buffer[0] & 0x80) !== 0;
	        this.#info.opcode = buffer[0] & 0x0F;

	        // If we receive a fragmented message, we use the type of the first
	        // frame to parse the full message as binary/text, when it's terminated
	        this.#info.originalOpcode ??= this.#info.opcode;

	        this.#info.fragmented = !this.#info.fin && this.#info.opcode !== opcodes.CONTINUATION;

	        if (this.#info.fragmented && this.#info.opcode !== opcodes.BINARY && this.#info.opcode !== opcodes.TEXT) {
	          // Only text and binary frames can be fragmented
	          failWebsocketConnection(this.ws, 'Invalid frame type was fragmented.');
	          return
	        }

	        const payloadLength = buffer[1] & 0x7F;

	        if (payloadLength <= 125) {
	          this.#info.payloadLength = payloadLength;
	          this.#state = parserStates.READ_DATA;
	        } else if (payloadLength === 126) {
	          this.#state = parserStates.PAYLOADLENGTH_16;
	        } else if (payloadLength === 127) {
	          this.#state = parserStates.PAYLOADLENGTH_64;
	        }

	        if (this.#info.fragmented && payloadLength > 125) {
	          // A fragmented frame can't be fragmented itself
	          failWebsocketConnection(this.ws, 'Fragmented frame exceeded 125 bytes.');
	          return
	        } else if (
	          (this.#info.opcode === opcodes.PING ||
	            this.#info.opcode === opcodes.PONG ||
	            this.#info.opcode === opcodes.CLOSE) &&
	          payloadLength > 125
	        ) {
	          // Control frames can have a payload length of 125 bytes MAX
	          failWebsocketConnection(this.ws, 'Payload length for control frame exceeded 125 bytes.');
	          return
	        } else if (this.#info.opcode === opcodes.CLOSE) {
	          if (payloadLength === 1) {
	            failWebsocketConnection(this.ws, 'Received close frame with a 1-byte body.');
	            return
	          }

	          const body = this.consume(payloadLength);

	          this.#info.closeInfo = this.parseCloseBody(body);

	          if (this.ws[kSentClose] !== sentCloseFrameState.SENT) {
	            // If an endpoint receives a Close frame and did not previously send a
	            // Close frame, the endpoint MUST send a Close frame in response.  (When
	            // sending a Close frame in response, the endpoint typically echos the
	            // status code it received.)
	            let body = emptyBuffer;
	            if (this.#info.closeInfo.code) {
	              body = Buffer.allocUnsafe(2);
	              body.writeUInt16BE(this.#info.closeInfo.code, 0);
	            }
	            const closeFrame = new WebsocketFrameSend(body);

	            this.ws[kResponse].socket.write(
	              closeFrame.createFrame(opcodes.CLOSE),
	              (err) => {
	                if (!err) {
	                  this.ws[kSentClose] = sentCloseFrameState.SENT;
	                }
	              }
	            );
	          }

	          // Upon either sending or receiving a Close control frame, it is said
	          // that _The WebSocket Closing Handshake is Started_ and that the
	          // WebSocket connection is in the CLOSING state.
	          this.ws[kReadyState] = states.CLOSING;
	          this.ws[kReceivedClose] = true;

	          this.end();

	          return
	        } else if (this.#info.opcode === opcodes.PING) {
	          // Upon receipt of a Ping frame, an endpoint MUST send a Pong frame in
	          // response, unless it already received a Close frame.
	          // A Pong frame sent in response to a Ping frame must have identical
	          // "Application data"

	          const body = this.consume(payloadLength);

	          if (!this.ws[kReceivedClose]) {
	            const frame = new WebsocketFrameSend(body);

	            this.ws[kResponse].socket.write(frame.createFrame(opcodes.PONG));

	            if (channels.ping.hasSubscribers) {
	              channels.ping.publish({
	                payload: body
	              });
	            }
	          }

	          this.#state = parserStates.INFO;

	          if (this.#byteOffset > 0) {
	            continue
	          } else {
	            callback();
	            return
	          }
	        } else if (this.#info.opcode === opcodes.PONG) {
	          // A Pong frame MAY be sent unsolicited.  This serves as a
	          // unidirectional heartbeat.  A response to an unsolicited Pong frame is
	          // not expected.

	          const body = this.consume(payloadLength);

	          if (channels.pong.hasSubscribers) {
	            channels.pong.publish({
	              payload: body
	            });
	          }

	          if (this.#byteOffset > 0) {
	            continue
	          } else {
	            callback();
	            return
	          }
	        }
	      } else if (this.#state === parserStates.PAYLOADLENGTH_16) {
	        if (this.#byteOffset < 2) {
	          return callback()
	        }

	        const buffer = this.consume(2);

	        this.#info.payloadLength = buffer.readUInt16BE(0);
	        this.#state = parserStates.READ_DATA;
	      } else if (this.#state === parserStates.PAYLOADLENGTH_64) {
	        if (this.#byteOffset < 8) {
	          return callback()
	        }

	        const buffer = this.consume(8);
	        const upper = buffer.readUInt32BE(0);

	        // 2^31 is the maxinimum bytes an arraybuffer can contain
	        // on 32-bit systems. Although, on 64-bit systems, this is
	        // 2^53-1 bytes.
	        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Invalid_array_length
	        // https://source.chromium.org/chromium/chromium/src/+/main:v8/src/common/globals.h;drc=1946212ac0100668f14eb9e2843bdd846e510a1e;bpv=1;bpt=1;l=1275
	        // https://source.chromium.org/chromium/chromium/src/+/main:v8/src/objects/js-array-buffer.h;l=34;drc=1946212ac0100668f14eb9e2843bdd846e510a1e
	        if (upper > 2 ** 31 - 1) {
	          failWebsocketConnection(this.ws, 'Received payload length > 2^31 bytes.');
	          return
	        }

	        const lower = buffer.readUInt32BE(4);

	        this.#info.payloadLength = (upper << 8) + lower;
	        this.#state = parserStates.READ_DATA;
	      } else if (this.#state === parserStates.READ_DATA) {
	        if (this.#byteOffset < this.#info.payloadLength) {
	          // If there is still more data in this chunk that needs to be read
	          return callback()
	        } else if (this.#byteOffset >= this.#info.payloadLength) {
	          // If the server sent multiple frames in a single chunk

	          const body = this.consume(this.#info.payloadLength);

	          this.#fragments.push(body);

	          // If the frame is unfragmented, or a fragmented frame was terminated,
	          // a message was received
	          if (!this.#info.fragmented || (this.#info.fin && this.#info.opcode === opcodes.CONTINUATION)) {
	            const fullMessage = Buffer.concat(this.#fragments);

	            websocketMessageReceived(this.ws, this.#info.originalOpcode, fullMessage);

	            this.#info = {};
	            this.#fragments.length = 0;
	          }

	          this.#state = parserStates.INFO;
	        }
	      }

	      if (this.#byteOffset === 0) {
	        callback();
	        break
	      }
	    }
	  }

	  /**
	   * Take n bytes from the buffered Buffers
	   * @param {number} n
	   * @returns {Buffer|null}
	   */
	  consume (n) {
	    if (n > this.#byteOffset) {
	      return null
	    } else if (n === 0) {
	      return emptyBuffer
	    }

	    if (this.#buffers[0].length === n) {
	      this.#byteOffset -= this.#buffers[0].length;
	      return this.#buffers.shift()
	    }

	    const buffer = Buffer.allocUnsafe(n);
	    let offset = 0;

	    while (offset !== n) {
	      const next = this.#buffers[0];
	      const { length } = next;

	      if (length + offset === n) {
	        buffer.set(this.#buffers.shift(), offset);
	        break
	      } else if (length + offset > n) {
	        buffer.set(next.subarray(0, n - offset), offset);
	        this.#buffers[0] = next.subarray(n - offset);
	        break
	      } else {
	        buffer.set(this.#buffers.shift(), offset);
	        offset += next.length;
	      }
	    }

	    this.#byteOffset -= n;

	    return buffer
	  }

	  parseCloseBody (data) {
	    // https://datatracker.ietf.org/doc/html/rfc6455#section-7.1.5
	    /** @type {number|undefined} */
	    let code;

	    if (data.length >= 2) {
	      // _The WebSocket Connection Close Code_ is
	      // defined as the status code (Section 7.4) contained in the first Close
	      // control frame received by the application
	      code = data.readUInt16BE(0);
	    }

	    // https://datatracker.ietf.org/doc/html/rfc6455#section-7.1.6
	    /** @type {Buffer} */
	    let reason = data.subarray(2);

	    // Remove BOM
	    if (reason[0] === 0xEF && reason[1] === 0xBB && reason[2] === 0xBF) {
	      reason = reason.subarray(3);
	    }

	    if (code !== undefined && !isValidStatusCode(code)) {
	      return null
	    }

	    try {
	      // TODO: optimize this
	      reason = new TextDecoder('utf-8', { fatal: true }).decode(reason);
	    } catch {
	      return null
	    }

	    return { code, reason }
	  }

	  get closingInfo () {
	    return this.#info.closeInfo
	  }
	}

	receiver = {
	  ByteParser
	};
	return receiver;
}

var websocket;
var hasRequiredWebsocket;

function requireWebsocket () {
	if (hasRequiredWebsocket) return websocket;
	hasRequiredWebsocket = 1;

	const { webidl } = requireWebidl();
	const { URLSerializer } = requireDataUrl();
	const { getGlobalOrigin } = requireGlobal();
	const { staticPropertyDescriptors, states, sentCloseFrameState, opcodes, emptyBuffer } = requireConstants();
	const {
	  kWebSocketURL,
	  kReadyState,
	  kController,
	  kBinaryType,
	  kResponse,
	  kSentClose,
	  kByteParser
	} = requireSymbols();
	const {
	  isConnecting,
	  isEstablished,
	  isClosed,
	  isClosing,
	  isValidSubprotocol,
	  failWebsocketConnection,
	  fireEvent
	} = requireUtil$1();
	const { establishWebSocketConnection } = requireConnection();
	const { WebsocketFrameSend } = requireFrame();
	const { ByteParser } = requireReceiver();
	const { kEnumerableProperty, isBlobLike } = util$m;
	const { getGlobalDispatcher } = global$1;
	const { types } = require$$0$2;

	let experimentalWarned = false;

	// https://websockets.spec.whatwg.org/#interface-definition
	class WebSocket extends EventTarget {
	  #events = {
	    open: null,
	    error: null,
	    close: null,
	    message: null
	  }

	  #bufferedAmount = 0
	  #protocol = ''
	  #extensions = ''

	  /**
	   * @param {string} url
	   * @param {string|string[]} protocols
	   */
	  constructor (url, protocols = []) {
	    super();

	    webidl.argumentLengthCheck(arguments, 1, { header: 'WebSocket constructor' });

	    if (!experimentalWarned) {
	      experimentalWarned = true;
	      process.emitWarning('WebSockets are experimental, expect them to change at any time.', {
	        code: 'UNDICI-WS'
	      });
	    }

	    const options = webidl.converters['DOMString or sequence<DOMString> or WebSocketInit'](protocols);

	    url = webidl.converters.USVString(url);
	    protocols = options.protocols;

	    // 1. Let baseURL be this's relevant settings object's API base URL.
	    const baseURL = getGlobalOrigin();

	    // 1. Let urlRecord be the result of applying the URL parser to url with baseURL.
	    let urlRecord;

	    try {
	      urlRecord = new URL(url, baseURL);
	    } catch (e) {
	      // 3. If urlRecord is failure, then throw a "SyntaxError" DOMException.
	      throw new DOMException(e, 'SyntaxError')
	    }

	    // 4. If urlRecord’s scheme is "http", then set urlRecord’s scheme to "ws".
	    if (urlRecord.protocol === 'http:') {
	      urlRecord.protocol = 'ws:';
	    } else if (urlRecord.protocol === 'https:') {
	      // 5. Otherwise, if urlRecord’s scheme is "https", set urlRecord’s scheme to "wss".
	      urlRecord.protocol = 'wss:';
	    }

	    // 6. If urlRecord’s scheme is not "ws" or "wss", then throw a "SyntaxError" DOMException.
	    if (urlRecord.protocol !== 'ws:' && urlRecord.protocol !== 'wss:') {
	      throw new DOMException(
	        `Expected a ws: or wss: protocol, got ${urlRecord.protocol}`,
	        'SyntaxError'
	      )
	    }

	    // 7. If urlRecord’s fragment is non-null, then throw a "SyntaxError"
	    //    DOMException.
	    if (urlRecord.hash || urlRecord.href.endsWith('#')) {
	      throw new DOMException('Got fragment', 'SyntaxError')
	    }

	    // 8. If protocols is a string, set protocols to a sequence consisting
	    //    of just that string.
	    if (typeof protocols === 'string') {
	      protocols = [protocols];
	    }

	    // 9. If any of the values in protocols occur more than once or otherwise
	    //    fail to match the requirements for elements that comprise the value
	    //    of `Sec-WebSocket-Protocol` fields as defined by The WebSocket
	    //    protocol, then throw a "SyntaxError" DOMException.
	    if (protocols.length !== new Set(protocols.map(p => p.toLowerCase())).size) {
	      throw new DOMException('Invalid Sec-WebSocket-Protocol value', 'SyntaxError')
	    }

	    if (protocols.length > 0 && !protocols.every(p => isValidSubprotocol(p))) {
	      throw new DOMException('Invalid Sec-WebSocket-Protocol value', 'SyntaxError')
	    }

	    // 10. Set this's url to urlRecord.
	    this[kWebSocketURL] = new URL(urlRecord.href);

	    // 11. Let client be this's relevant settings object.

	    // 12. Run this step in parallel:

	    //    1. Establish a WebSocket connection given urlRecord, protocols,
	    //       and client.
	    this[kController] = establishWebSocketConnection(
	      urlRecord,
	      protocols,
	      this,
	      (response) => this.#onConnectionEstablished(response),
	      options
	    );

	    // Each WebSocket object has an associated ready state, which is a
	    // number representing the state of the connection. Initially it must
	    // be CONNECTING (0).
	    this[kReadyState] = WebSocket.CONNECTING;

	    this[kSentClose] = sentCloseFrameState.NOT_SENT;

	    // The extensions attribute must initially return the empty string.

	    // The protocol attribute must initially return the empty string.

	    // Each WebSocket object has an associated binary type, which is a
	    // BinaryType. Initially it must be "blob".
	    this[kBinaryType] = 'blob';
	  }

	  /**
	   * @see https://websockets.spec.whatwg.org/#dom-websocket-close
	   * @param {number|undefined} code
	   * @param {string|undefined} reason
	   */
	  close (code = undefined, reason = undefined) {
	    webidl.brandCheck(this, WebSocket);

	    if (code !== undefined) {
	      code = webidl.converters['unsigned short'](code, { clamp: true });
	    }

	    if (reason !== undefined) {
	      reason = webidl.converters.USVString(reason);
	    }

	    // 1. If code is present, but is neither an integer equal to 1000 nor an
	    //    integer in the range 3000 to 4999, inclusive, throw an
	    //    "InvalidAccessError" DOMException.
	    if (code !== undefined) {
	      if (code !== 1000 && (code < 3000 || code > 4999)) {
	        throw new DOMException('invalid code', 'InvalidAccessError')
	      }
	    }

	    let reasonByteLength = 0;

	    // 2. If reason is present, then run these substeps:
	    if (reason !== undefined) {
	      // 1. Let reasonBytes be the result of encoding reason.
	      // 2. If reasonBytes is longer than 123 bytes, then throw a
	      //    "SyntaxError" DOMException.
	      reasonByteLength = Buffer.byteLength(reason);

	      if (reasonByteLength > 123) {
	        throw new DOMException(
	          `Reason must be less than 123 bytes; received ${reasonByteLength}`,
	          'SyntaxError'
	        )
	      }
	    }

	    // 3. Run the first matching steps from the following list:
	    if (isClosing(this) || isClosed(this)) ; else if (!isEstablished(this)) {
	      // If the WebSocket connection is not yet established
	      // Fail the WebSocket connection and set this's ready state
	      // to CLOSING (2).
	      failWebsocketConnection(this, 'Connection was closed before it was established.');
	      this[kReadyState] = WebSocket.CLOSING;
	    } else if (this[kSentClose] === sentCloseFrameState.NOT_SENT) {
	      // If the WebSocket closing handshake has not yet been started
	      // Start the WebSocket closing handshake and set this's ready
	      // state to CLOSING (2).
	      // - If neither code nor reason is present, the WebSocket Close
	      //   message must not have a body.
	      // - If code is present, then the status code to use in the
	      //   WebSocket Close message must be the integer given by code.
	      // - If reason is also present, then reasonBytes must be
	      //   provided in the Close message after the status code.

	      this[kSentClose] = sentCloseFrameState.PROCESSING;

	      const frame = new WebsocketFrameSend();

	      // If neither code nor reason is present, the WebSocket Close
	      // message must not have a body.

	      // If code is present, then the status code to use in the
	      // WebSocket Close message must be the integer given by code.
	      if (code !== undefined && reason === undefined) {
	        frame.frameData = Buffer.allocUnsafe(2);
	        frame.frameData.writeUInt16BE(code, 0);
	      } else if (code !== undefined && reason !== undefined) {
	        // If reason is also present, then reasonBytes must be
	        // provided in the Close message after the status code.
	        frame.frameData = Buffer.allocUnsafe(2 + reasonByteLength);
	        frame.frameData.writeUInt16BE(code, 0);
	        // the body MAY contain UTF-8-encoded data with value /reason/
	        frame.frameData.write(reason, 2, 'utf-8');
	      } else {
	        frame.frameData = emptyBuffer;
	      }

	      /** @type {import('stream').Duplex} */
	      const socket = this[kResponse].socket;

	      socket.write(frame.createFrame(opcodes.CLOSE), (err) => {
	        if (!err) {
	          this[kSentClose] = sentCloseFrameState.SENT;
	        }
	      });

	      // Upon either sending or receiving a Close control frame, it is said
	      // that _The WebSocket Closing Handshake is Started_ and that the
	      // WebSocket connection is in the CLOSING state.
	      this[kReadyState] = states.CLOSING;
	    } else {
	      // Otherwise
	      // Set this's ready state to CLOSING (2).
	      this[kReadyState] = WebSocket.CLOSING;
	    }
	  }

	  /**
	   * @see https://websockets.spec.whatwg.org/#dom-websocket-send
	   * @param {NodeJS.TypedArray|ArrayBuffer|Blob|string} data
	   */
	  send (data) {
	    webidl.brandCheck(this, WebSocket);

	    webidl.argumentLengthCheck(arguments, 1, { header: 'WebSocket.send' });

	    data = webidl.converters.WebSocketSendData(data);

	    // 1. If this's ready state is CONNECTING, then throw an
	    //    "InvalidStateError" DOMException.
	    if (isConnecting(this)) {
	      throw new DOMException('Sent before connected.', 'InvalidStateError')
	    }

	    // 2. Run the appropriate set of steps from the following list:
	    // https://datatracker.ietf.org/doc/html/rfc6455#section-6.1
	    // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

	    if (!isEstablished(this) || isClosing(this)) {
	      return
	    }

	    /** @type {import('stream').Duplex} */
	    const socket = this[kResponse].socket;

	    // If data is a string
	    if (typeof data === 'string') {
	      // If the WebSocket connection is established and the WebSocket
	      // closing handshake has not yet started, then the user agent
	      // must send a WebSocket Message comprised of the data argument
	      // using a text frame opcode; if the data cannot be sent, e.g.
	      // because it would need to be buffered but the buffer is full,
	      // the user agent must flag the WebSocket as full and then close
	      // the WebSocket connection. Any invocation of this method with a
	      // string argument that does not throw an exception must increase
	      // the bufferedAmount attribute by the number of bytes needed to
	      // express the argument as UTF-8.

	      const value = Buffer.from(data);
	      const frame = new WebsocketFrameSend(value);
	      const buffer = frame.createFrame(opcodes.TEXT);

	      this.#bufferedAmount += value.byteLength;
	      socket.write(buffer, () => {
	        this.#bufferedAmount -= value.byteLength;
	      });
	    } else if (types.isArrayBuffer(data)) {
	      // If the WebSocket connection is established, and the WebSocket
	      // closing handshake has not yet started, then the user agent must
	      // send a WebSocket Message comprised of data using a binary frame
	      // opcode; if the data cannot be sent, e.g. because it would need
	      // to be buffered but the buffer is full, the user agent must flag
	      // the WebSocket as full and then close the WebSocket connection.
	      // The data to be sent is the data stored in the buffer described
	      // by the ArrayBuffer object. Any invocation of this method with an
	      // ArrayBuffer argument that does not throw an exception must
	      // increase the bufferedAmount attribute by the length of the
	      // ArrayBuffer in bytes.

	      const value = Buffer.from(data);
	      const frame = new WebsocketFrameSend(value);
	      const buffer = frame.createFrame(opcodes.BINARY);

	      this.#bufferedAmount += value.byteLength;
	      socket.write(buffer, () => {
	        this.#bufferedAmount -= value.byteLength;
	      });
	    } else if (ArrayBuffer.isView(data)) {
	      // If the WebSocket connection is established, and the WebSocket
	      // closing handshake has not yet started, then the user agent must
	      // send a WebSocket Message comprised of data using a binary frame
	      // opcode; if the data cannot be sent, e.g. because it would need to
	      // be buffered but the buffer is full, the user agent must flag the
	      // WebSocket as full and then close the WebSocket connection. The
	      // data to be sent is the data stored in the section of the buffer
	      // described by the ArrayBuffer object that data references. Any
	      // invocation of this method with this kind of argument that does
	      // not throw an exception must increase the bufferedAmount attribute
	      // by the length of data’s buffer in bytes.

	      const ab = Buffer.from(data, data.byteOffset, data.byteLength);

	      const frame = new WebsocketFrameSend(ab);
	      const buffer = frame.createFrame(opcodes.BINARY);

	      this.#bufferedAmount += ab.byteLength;
	      socket.write(buffer, () => {
	        this.#bufferedAmount -= ab.byteLength;
	      });
	    } else if (isBlobLike(data)) {
	      // If the WebSocket connection is established, and the WebSocket
	      // closing handshake has not yet started, then the user agent must
	      // send a WebSocket Message comprised of data using a binary frame
	      // opcode; if the data cannot be sent, e.g. because it would need to
	      // be buffered but the buffer is full, the user agent must flag the
	      // WebSocket as full and then close the WebSocket connection. The data
	      // to be sent is the raw data represented by the Blob object. Any
	      // invocation of this method with a Blob argument that does not throw
	      // an exception must increase the bufferedAmount attribute by the size
	      // of the Blob object’s raw data, in bytes.

	      const frame = new WebsocketFrameSend();

	      data.arrayBuffer().then((ab) => {
	        const value = Buffer.from(ab);
	        frame.frameData = value;
	        const buffer = frame.createFrame(opcodes.BINARY);

	        this.#bufferedAmount += value.byteLength;
	        socket.write(buffer, () => {
	          this.#bufferedAmount -= value.byteLength;
	        });
	      });
	    }
	  }

	  get readyState () {
	    webidl.brandCheck(this, WebSocket);

	    // The readyState getter steps are to return this's ready state.
	    return this[kReadyState]
	  }

	  get bufferedAmount () {
	    webidl.brandCheck(this, WebSocket);

	    return this.#bufferedAmount
	  }

	  get url () {
	    webidl.brandCheck(this, WebSocket);

	    // The url getter steps are to return this's url, serialized.
	    return URLSerializer(this[kWebSocketURL])
	  }

	  get extensions () {
	    webidl.brandCheck(this, WebSocket);

	    return this.#extensions
	  }

	  get protocol () {
	    webidl.brandCheck(this, WebSocket);

	    return this.#protocol
	  }

	  get onopen () {
	    webidl.brandCheck(this, WebSocket);

	    return this.#events.open
	  }

	  set onopen (fn) {
	    webidl.brandCheck(this, WebSocket);

	    if (this.#events.open) {
	      this.removeEventListener('open', this.#events.open);
	    }

	    if (typeof fn === 'function') {
	      this.#events.open = fn;
	      this.addEventListener('open', fn);
	    } else {
	      this.#events.open = null;
	    }
	  }

	  get onerror () {
	    webidl.brandCheck(this, WebSocket);

	    return this.#events.error
	  }

	  set onerror (fn) {
	    webidl.brandCheck(this, WebSocket);

	    if (this.#events.error) {
	      this.removeEventListener('error', this.#events.error);
	    }

	    if (typeof fn === 'function') {
	      this.#events.error = fn;
	      this.addEventListener('error', fn);
	    } else {
	      this.#events.error = null;
	    }
	  }

	  get onclose () {
	    webidl.brandCheck(this, WebSocket);

	    return this.#events.close
	  }

	  set onclose (fn) {
	    webidl.brandCheck(this, WebSocket);

	    if (this.#events.close) {
	      this.removeEventListener('close', this.#events.close);
	    }

	    if (typeof fn === 'function') {
	      this.#events.close = fn;
	      this.addEventListener('close', fn);
	    } else {
	      this.#events.close = null;
	    }
	  }

	  get onmessage () {
	    webidl.brandCheck(this, WebSocket);

	    return this.#events.message
	  }

	  set onmessage (fn) {
	    webidl.brandCheck(this, WebSocket);

	    if (this.#events.message) {
	      this.removeEventListener('message', this.#events.message);
	    }

	    if (typeof fn === 'function') {
	      this.#events.message = fn;
	      this.addEventListener('message', fn);
	    } else {
	      this.#events.message = null;
	    }
	  }

	  get binaryType () {
	    webidl.brandCheck(this, WebSocket);

	    return this[kBinaryType]
	  }

	  set binaryType (type) {
	    webidl.brandCheck(this, WebSocket);

	    if (type !== 'blob' && type !== 'arraybuffer') {
	      this[kBinaryType] = 'blob';
	    } else {
	      this[kBinaryType] = type;
	    }
	  }

	  /**
	   * @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
	   */
	  #onConnectionEstablished (response) {
	    // processResponse is called when the "response’s header list has been received and initialized."
	    // once this happens, the connection is open
	    this[kResponse] = response;

	    const parser = new ByteParser(this);
	    parser.on('drain', function onParserDrain () {
	      this.ws[kResponse].socket.resume();
	    });

	    response.socket.ws = this;
	    this[kByteParser] = parser;

	    // 1. Change the ready state to OPEN (1).
	    this[kReadyState] = states.OPEN;

	    // 2. Change the extensions attribute’s value to the extensions in use, if
	    //    it is not the null value.
	    // https://datatracker.ietf.org/doc/html/rfc6455#section-9.1
	    const extensions = response.headersList.get('sec-websocket-extensions');

	    if (extensions !== null) {
	      this.#extensions = extensions;
	    }

	    // 3. Change the protocol attribute’s value to the subprotocol in use, if
	    //    it is not the null value.
	    // https://datatracker.ietf.org/doc/html/rfc6455#section-1.9
	    const protocol = response.headersList.get('sec-websocket-protocol');

	    if (protocol !== null) {
	      this.#protocol = protocol;
	    }

	    // 4. Fire an event named open at the WebSocket object.
	    fireEvent('open', this);
	  }
	}

	// https://websockets.spec.whatwg.org/#dom-websocket-connecting
	WebSocket.CONNECTING = WebSocket.prototype.CONNECTING = states.CONNECTING;
	// https://websockets.spec.whatwg.org/#dom-websocket-open
	WebSocket.OPEN = WebSocket.prototype.OPEN = states.OPEN;
	// https://websockets.spec.whatwg.org/#dom-websocket-closing
	WebSocket.CLOSING = WebSocket.prototype.CLOSING = states.CLOSING;
	// https://websockets.spec.whatwg.org/#dom-websocket-closed
	WebSocket.CLOSED = WebSocket.prototype.CLOSED = states.CLOSED;

	Object.defineProperties(WebSocket.prototype, {
	  CONNECTING: staticPropertyDescriptors,
	  OPEN: staticPropertyDescriptors,
	  CLOSING: staticPropertyDescriptors,
	  CLOSED: staticPropertyDescriptors,
	  url: kEnumerableProperty,
	  readyState: kEnumerableProperty,
	  bufferedAmount: kEnumerableProperty,
	  onopen: kEnumerableProperty,
	  onerror: kEnumerableProperty,
	  onclose: kEnumerableProperty,
	  close: kEnumerableProperty,
	  onmessage: kEnumerableProperty,
	  binaryType: kEnumerableProperty,
	  send: kEnumerableProperty,
	  extensions: kEnumerableProperty,
	  protocol: kEnumerableProperty,
	  [Symbol.toStringTag]: {
	    value: 'WebSocket',
	    writable: false,
	    enumerable: false,
	    configurable: true
	  }
	});

	Object.defineProperties(WebSocket, {
	  CONNECTING: staticPropertyDescriptors,
	  OPEN: staticPropertyDescriptors,
	  CLOSING: staticPropertyDescriptors,
	  CLOSED: staticPropertyDescriptors
	});

	webidl.converters['sequence<DOMString>'] = webidl.sequenceConverter(
	  webidl.converters.DOMString
	);

	webidl.converters['DOMString or sequence<DOMString>'] = function (V) {
	  if (webidl.util.Type(V) === 'Object' && Symbol.iterator in V) {
	    return webidl.converters['sequence<DOMString>'](V)
	  }

	  return webidl.converters.DOMString(V)
	};

	// This implements the propsal made in https://github.com/whatwg/websockets/issues/42
	webidl.converters.WebSocketInit = webidl.dictionaryConverter([
	  {
	    key: 'protocols',
	    converter: webidl.converters['DOMString or sequence<DOMString>'],
	    get defaultValue () {
	      return []
	    }
	  },
	  {
	    key: 'dispatcher',
	    converter: (V) => V,
	    get defaultValue () {
	      return getGlobalDispatcher()
	    }
	  },
	  {
	    key: 'headers',
	    converter: webidl.nullableConverter(webidl.converters.HeadersInit)
	  }
	]);

	webidl.converters['DOMString or sequence<DOMString> or WebSocketInit'] = function (V) {
	  if (webidl.util.Type(V) === 'Object' && !(Symbol.iterator in V)) {
	    return webidl.converters.WebSocketInit(V)
	  }

	  return { protocols: webidl.converters['DOMString or sequence<DOMString>'](V) }
	};

	webidl.converters.WebSocketSendData = function (V) {
	  if (webidl.util.Type(V) === 'Object') {
	    if (isBlobLike(V)) {
	      return webidl.converters.Blob(V, { strict: false })
	    }

	    if (ArrayBuffer.isView(V) || types.isArrayBuffer(V)) {
	      return webidl.converters.BufferSource(V)
	    }
	  }

	  return webidl.converters.USVString(V)
	};

	websocket = {
	  WebSocket
	};
	return websocket;
}

var util$1;
var hasRequiredUtil;

function requireUtil () {
	if (hasRequiredUtil) return util$1;
	hasRequiredUtil = 1;

	/**
	 * Checks if the given value is a valid LastEventId.
	 * @param {string} value
	 * @returns {boolean}
	 */
	function isValidLastEventId (value) {
	  // LastEventId should not contain U+0000 NULL
	  return value.indexOf('\u0000') === -1
	}

	/**
	 * Checks if the given value is a base 10 digit.
	 * @param {string} value
	 * @returns {boolean}
	 */
	function isASCIINumber (value) {
	  if (value.length === 0) return false
	  for (let i = 0; i < value.length; i++) {
	    if (value.charCodeAt(i) < 0x30 || value.charCodeAt(i) > 0x39) return false
	  }
	  return true
	}

	// https://github.com/nodejs/undici/issues/2664
	function delay (ms) {
	  return new Promise((resolve) => {
	    setTimeout(resolve, ms).unref();
	  })
	}

	util$1 = {
	  isValidLastEventId,
	  isASCIINumber,
	  delay
	};
	return util$1;
}

var eventsourceStream;
var hasRequiredEventsourceStream;

function requireEventsourceStream () {
	if (hasRequiredEventsourceStream) return eventsourceStream;
	hasRequiredEventsourceStream = 1;
	const { Transform } = require$$0$1;
	const { isASCIINumber, isValidLastEventId } = requireUtil();

	/**
	 * @type {number[]} BOM
	 */
	const BOM = [0xEF, 0xBB, 0xBF];
	/**
	 * @type {10} LF
	 */
	const LF = 0x0A;
	/**
	 * @type {13} CR
	 */
	const CR = 0x0D;
	/**
	 * @type {58} COLON
	 */
	const COLON = 0x3A;
	/**
	 * @type {32} SPACE
	 */
	const SPACE = 0x20;

	/**
	 * @typedef {object} EventSourceStreamEvent
	 * @type {object}
	 * @property {string} [event] The event type.
	 * @property {string} [data] The data of the message.
	 * @property {string} [id] A unique ID for the event.
	 * @property {string} [retry] The reconnection time, in milliseconds.
	 */

	/**
	 * @typedef eventSourceSettings
	 * @type {object}
	 * @property {string} lastEventId The last event ID received from the server.
	 * @property {string} origin The origin of the event source.
	 * @property {number} reconnectionTime The reconnection time, in milliseconds.
	 */

	class EventSourceStream extends Transform {
	  /**
	   * @type {eventSourceSettings}
	   */
	  state = null

	  /**
	   * Leading byte-order-mark check.
	   * @type {boolean}
	   */
	  checkBOM = true

	  /**
	   * @type {boolean}
	   */
	  crlfCheck = false

	  /**
	   * @type {boolean}
	   */
	  eventEndCheck = false

	  /**
	   * @type {Buffer}
	   */
	  buffer = null

	  pos = 0

	  event = {
	    data: undefined,
	    event: undefined,
	    id: undefined,
	    retry: undefined
	  }

	  /**
	   * @param {object} options
	   * @param {eventSourceSettings} options.eventSourceSettings
	   * @param {Function} [options.push]
	   */
	  constructor (options = {}) {
	    // Enable object mode as EventSourceStream emits objects of shape
	    // EventSourceStreamEvent
	    options.readableObjectMode = true;

	    super(options);

	    this.state = options.eventSourceSettings || {};
	    if (options.push) {
	      this.push = options.push;
	    }
	  }

	  /**
	   * @param {Buffer} chunk
	   * @param {string} _encoding
	   * @param {Function} callback
	   * @returns {void}
	   */
	  _transform (chunk, _encoding, callback) {
	    if (chunk.length === 0) {
	      callback();
	      return
	    }

	    // Cache the chunk in the buffer, as the data might not be complete while
	    // processing it
	    // TODO: Investigate if there is a more performant way to handle
	    // incoming chunks
	    // see: https://github.com/nodejs/undici/issues/2630
	    if (this.buffer) {
	      this.buffer = Buffer.concat([this.buffer, chunk]);
	    } else {
	      this.buffer = chunk;
	    }

	    // Strip leading byte-order-mark if we opened the stream and started
	    // the processing of the incoming data
	    if (this.checkBOM) {
	      switch (this.buffer.length) {
	        case 1:
	          // Check if the first byte is the same as the first byte of the BOM
	          if (this.buffer[0] === BOM[0]) {
	            // If it is, we need to wait for more data
	            callback();
	            return
	          }
	          // Set the checkBOM flag to false as we don't need to check for the
	          // BOM anymore
	          this.checkBOM = false;

	          // The buffer only contains one byte so we need to wait for more data
	          callback();
	          return
	        case 2:
	          // Check if the first two bytes are the same as the first two bytes
	          // of the BOM
	          if (
	            this.buffer[0] === BOM[0] &&
	            this.buffer[1] === BOM[1]
	          ) {
	            // If it is, we need to wait for more data, because the third byte
	            // is needed to determine if it is the BOM or not
	            callback();
	            return
	          }

	          // Set the checkBOM flag to false as we don't need to check for the
	          // BOM anymore
	          this.checkBOM = false;
	          break
	        case 3:
	          // Check if the first three bytes are the same as the first three
	          // bytes of the BOM
	          if (
	            this.buffer[0] === BOM[0] &&
	            this.buffer[1] === BOM[1] &&
	            this.buffer[2] === BOM[2]
	          ) {
	            // If it is, we can drop the buffered data, as it is only the BOM
	            this.buffer = Buffer.alloc(0);
	            // Set the checkBOM flag to false as we don't need to check for the
	            // BOM anymore
	            this.checkBOM = false;

	            // Await more data
	            callback();
	            return
	          }
	          // If it is not the BOM, we can start processing the data
	          this.checkBOM = false;
	          break
	        default:
	          // The buffer is longer than 3 bytes, so we can drop the BOM if it is
	          // present
	          if (
	            this.buffer[0] === BOM[0] &&
	            this.buffer[1] === BOM[1] &&
	            this.buffer[2] === BOM[2]
	          ) {
	            // Remove the BOM from the buffer
	            this.buffer = this.buffer.subarray(3);
	          }

	          // Set the checkBOM flag to false as we don't need to check for the
	          this.checkBOM = false;
	          break
	      }
	    }

	    while (this.pos < this.buffer.length) {
	      // If the previous line ended with an end-of-line, we need to check
	      // if the next character is also an end-of-line.
	      if (this.eventEndCheck) {
	        // If the the current character is an end-of-line, then the event
	        // is finished and we can process it

	        // If the previous line ended with a carriage return, we need to
	        // check if the current character is a line feed and remove it
	        // from the buffer.
	        if (this.crlfCheck) {
	          // If the current character is a line feed, we can remove it
	          // from the buffer and reset the crlfCheck flag
	          if (this.buffer[this.pos] === LF) {
	            this.buffer = this.buffer.subarray(this.pos + 1);
	            this.pos = 0;
	            this.crlfCheck = false;

	            // It is possible that the line feed is not the end of the
	            // event. We need to check if the next character is an
	            // end-of-line character to determine if the event is
	            // finished. We simply continue the loop to check the next
	            // character.

	            // As we removed the line feed from the buffer and set the
	            // crlfCheck flag to false, we basically don't make any
	            // distinction between a line feed and a carriage return.
	            continue
	          }
	          this.crlfCheck = false;
	        }

	        if (this.buffer[this.pos] === LF || this.buffer[this.pos] === CR) {
	          // If the current character is a carriage return, we need to
	          // set the crlfCheck flag to true, as we need to check if the
	          // next character is a line feed so we can remove it from the
	          // buffer
	          if (this.buffer[this.pos] === CR) {
	            this.crlfCheck = true;
	          }

	          this.buffer = this.buffer.subarray(this.pos + 1);
	          this.pos = 0;
	          if (
	            this.event.data !== undefined || this.event.event || this.event.id || this.event.retry) {
	            this.processEvent(this.event);
	          }
	          this.clearEvent();
	          continue
	        }
	        // If the current character is not an end-of-line, then the event
	        // is not finished and we have to reset the eventEndCheck flag
	        this.eventEndCheck = false;
	        continue
	      }

	      // If the current character is an end-of-line, we can process the
	      // line
	      if (this.buffer[this.pos] === LF || this.buffer[this.pos] === CR) {
	        // If the current character is a carriage return, we need to
	        // set the crlfCheck flag to true, as we need to check if the
	        // next character is a line feed
	        if (this.buffer[this.pos] === CR) {
	          this.crlfCheck = true;
	        }

	        // In any case, we can process the line as we reached an
	        // end-of-line character
	        this.parseLine(this.buffer.subarray(0, this.pos), this.event);

	        // Remove the processed line from the buffer
	        this.buffer = this.buffer.subarray(this.pos + 1);
	        // Reset the position as we removed the processed line from the buffer
	        this.pos = 0;
	        // A line was processed and this could be the end of the event. We need
	        // to check if the next line is empty to determine if the event is
	        // finished.
	        this.eventEndCheck = true;
	        continue
	      }

	      this.pos++;
	    }

	    callback();
	  }

	  /**
	   * @param {Buffer} line
	   * @param {EventStreamEvent} event
	   */
	  parseLine (line, event) {
	    // If the line is empty (a blank line)
	    // Dispatch the event, as defined below.
	    // This will be handled in the _transform method
	    if (line.length === 0) {
	      return
	    }

	    // If the line starts with a U+003A COLON character (:)
	    // Ignore the line.
	    const colonPosition = line.indexOf(COLON);
	    if (colonPosition === 0) {
	      return
	    }

	    let field = '';
	    let value = '';

	    // If the line contains a U+003A COLON character (:)
	    if (colonPosition !== -1) {
	      // Collect the characters on the line before the first U+003A COLON
	      // character (:), and let field be that string.
	      // TODO: Investigate if there is a more performant way to extract the
	      // field
	      // see: https://github.com/nodejs/undici/issues/2630
	      field = line.subarray(0, colonPosition).toString('utf8');

	      // Collect the characters on the line after the first U+003A COLON
	      // character (:), and let value be that string.
	      // If value starts with a U+0020 SPACE character, remove it from value.
	      let valueStart = colonPosition + 1;
	      if (line[valueStart] === SPACE) {
	        ++valueStart;
	      }
	      // TODO: Investigate if there is a more performant way to extract the
	      // value
	      // see: https://github.com/nodejs/undici/issues/2630
	      value = line.subarray(valueStart).toString('utf8');

	      // Otherwise, the string is not empty but does not contain a U+003A COLON
	      // character (:)
	    } else {
	      // Process the field using the steps described below, using the whole
	      // line as the field name, and the empty string as the field value.
	      field = line.toString('utf8');
	      value = '';
	    }

	    // Modify the event with the field name and value. The value is also
	    // decoded as UTF-8
	    switch (field) {
	      case 'data':
	        if (event[field] === undefined) {
	          event[field] = value;
	        } else {
	          event[field] += `\n${value}`;
	        }
	        break
	      case 'retry':
	        if (isASCIINumber(value)) {
	          event[field] = value;
	        }
	        break
	      case 'id':
	        if (isValidLastEventId(value)) {
	          event[field] = value;
	        }
	        break
	      case 'event':
	        if (value.length > 0) {
	          event[field] = value;
	        }
	        break
	    }
	  }

	  /**
	   * @param {EventSourceStreamEvent} event
	   */
	  processEvent (event) {
	    if (event.retry && isASCIINumber(event.retry)) {
	      this.state.reconnectionTime = parseInt(event.retry, 10);
	    }

	    if (event.id && isValidLastEventId(event.id)) {
	      this.state.lastEventId = event.id;
	    }

	    // only dispatch event, when data is provided
	    if (event.data !== undefined) {
	      this.push({
	        type: event.event || 'message',
	        options: {
	          data: event.data,
	          lastEventId: this.state.lastEventId,
	          origin: this.state.origin
	        }
	      });
	    }
	  }

	  clearEvent () {
	    this.event = {
	      data: undefined,
	      event: undefined,
	      id: undefined,
	      retry: undefined
	    };
	  }
	}

	eventsourceStream = {
	  EventSourceStream
	};
	return eventsourceStream;
}

var eventsource;
var hasRequiredEventsource;

function requireEventsource () {
	if (hasRequiredEventsource) return eventsource;
	hasRequiredEventsource = 1;

	const { pipeline } = require$$0$1;
	const { fetching } = requireFetch();
	const { makeRequest } = requireRequest();
	const { getGlobalOrigin } = requireGlobal();
	const { webidl } = requireWebidl();
	const { EventSourceStream } = requireEventsourceStream();
	const { parseMIMEType } = requireDataUrl();
	const { MessageEvent } = requireEvents();
	const { isNetworkError } = requireResponse();
	const { delay } = requireUtil();
	const { kEnumerableProperty } = util$m;

	let experimentalWarned = false;

	/**
	 * A reconnection time, in milliseconds. This must initially be an implementation-defined value,
	 * probably in the region of a few seconds.
	 *
	 * In Comparison:
	 * - Chrome uses 3000ms.
	 * - Deno uses 5000ms.
	 *
	 * @type {3000}
	 */
	const defaultReconnectionTime = 3000;

	/**
	 * The readyState attribute represents the state of the connection.
	 * @enum
	 * @readonly
	 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#dom-eventsource-readystate-dev
	 */

	/**
	 * The connection has not yet been established, or it was closed and the user
	 * agent is reconnecting.
	 * @type {0}
	 */
	const CONNECTING = 0;

	/**
	 * The user agent has an open connection and is dispatching events as it
	 * receives them.
	 * @type {1}
	 */
	const OPEN = 1;

	/**
	 * The connection is not open, and the user agent is not trying to reconnect.
	 * @type {2}
	 */
	const CLOSED = 2;

	/**
	 * Requests for the element will have their mode set to "cors" and their credentials mode set to "same-origin".
	 * @type {'anonymous'}
	 */
	const ANONYMOUS = 'anonymous';

	/**
	 * Requests for the element will have their mode set to "cors" and their credentials mode set to "include".
	 * @type {'use-credentials'}
	 */
	const USE_CREDENTIALS = 'use-credentials';

	/**
	 * @typedef {object} EventSourceInit
	 * @property {boolean} [withCredentials] indicates whether the request
	 * should include credentials.
	 */

	/**
	 * The EventSource interface is used to receive server-sent events. It
	 * connects to a server over HTTP and receives events in text/event-stream
	 * format without closing the connection.
	 * @extends {EventTarget}
	 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events
	 * @api public
	 */
	class EventSource extends EventTarget {
	  #events = {
	    open: null,
	    error: null,
	    message: null
	  }

	  #url = null
	  #withCredentials = false

	  #readyState = CONNECTING

	  #request = null
	  #controller = null

	  /**
	   * @type {object}
	   * @property {string} lastEventId
	   * @property {number} reconnectionTime
	   * @property {any} reconnectionTimer
	   */
	  #settings = null

	  /**
	   * Creates a new EventSource object.
	   * @param {string} url
	   * @param {EventSourceInit} [eventSourceInitDict]
	   * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#the-eventsource-interface
	   */
	  constructor (url, eventSourceInitDict = {}) {
	    // 1. Let ev be a new EventSource object.
	    super();

	    webidl.argumentLengthCheck(arguments, 1, { header: 'EventSource constructor' });

	    if (!experimentalWarned) {
	      experimentalWarned = true;
	      process.emitWarning('EventSource is experimental, expect them to change at any time.', {
	        code: 'UNDICI-ES'
	      });
	    }

	    url = webidl.converters.USVString(url);
	    eventSourceInitDict = webidl.converters.EventSourceInitDict(eventSourceInitDict);

	    // 2. Let settings be ev's relevant settings object.
	    // https://html.spec.whatwg.org/multipage/webappapis.html#environment-settings-object
	    this.#settings = {
	      origin: getGlobalOrigin(),
	      policyContainer: {
	        referrerPolicy: 'no-referrer'
	      },
	      lastEventId: '',
	      reconnectionTime: defaultReconnectionTime
	    };

	    let urlRecord;

	    try {
	      // 3. Let urlRecord be the result of encoding-parsing a URL given url, relative to settings.
	      urlRecord = new URL(url, this.#settings.origin);
	      this.#settings.origin = urlRecord.origin;
	    } catch (e) {
	      // 4. If urlRecord is failure, then throw a "SyntaxError" DOMException.
	      throw new DOMException(e, 'SyntaxError')
	    }

	    // 5. Set ev's url to urlRecord.
	    this.#url = urlRecord.href;

	    // 6. Let corsAttributeState be Anonymous.
	    let corsAttributeState = ANONYMOUS;

	    // 7. If the value of eventSourceInitDict's withCredentials member is true,
	    // then set corsAttributeState to Use Credentials and set ev's
	    // withCredentials attribute to true.
	    if (eventSourceInitDict.withCredentials) {
	      corsAttributeState = USE_CREDENTIALS;
	      this.#withCredentials = true;
	    }

	    // 8. Let request be the result of creating a potential-CORS request given
	    // urlRecord, the empty string, and corsAttributeState.
	    const initRequest = {
	      redirect: 'follow',
	      keepalive: true,
	      // @see https://html.spec.whatwg.org/multipage/urls-and-fetching.html#cors-settings-attributes
	      mode: 'cors',
	      credentials: corsAttributeState === 'anonymous'
	        ? 'same-origin'
	        : 'omit',
	      referrer: 'no-referrer'
	    };

	    // 9. Set request's client to settings.
	    initRequest.client = this.#settings;

	    // 10. User agents may set (`Accept`, `text/event-stream`) in request's header list.
	    initRequest.headersList = [['accept', { name: 'accept', value: 'text/event-stream' }]];

	    // 11. Set request's cache mode to "no-store".
	    initRequest.cache = 'no-store';

	    // 12. Set request's initiator type to "other".
	    initRequest.initiator = 'other';

	    initRequest.urlList = [new URL(this.#url)];

	    // 13. Set ev's request to request.
	    this.#request = makeRequest(initRequest);

	    this.#connect();
	  }

	  /**
	   * Returns the state of this EventSource object's connection. It can have the
	   * values described below.
	   * @returns {0|1|2}
	   * @readonly
	   */
	  get readyState () {
	    return this.#readyState
	  }

	  /**
	   * Returns the URL providing the event stream.
	   * @readonly
	   * @returns {string}
	   */
	  get url () {
	    return this.#url
	  }

	  /**
	   * Returns a boolean indicating whether the EventSource object was
	   * instantiated with CORS credentials set (true), or not (false, the default).
	   */
	  get withCredentials () {
	    return this.#withCredentials
	  }

	  #connect () {
	    if (this.#readyState === CLOSED) return

	    this.#readyState = CONNECTING;

	    const fetchParam = {
	      request: this.#request
	    };

	    // 14. Let processEventSourceEndOfBody given response res be the following step: if res is not a network error, then reestablish the connection.
	    const processEventSourceEndOfBody = (response) => {
	      if (isNetworkError(response)) {
	        this.dispatchEvent(new Event('error'));
	        this.close();
	      }

	      this.#reconnect();
	    };

	    // 15. Fetch request, with processResponseEndOfBody set to processEventSourceEndOfBody...
	    fetchParam.processResponseEndOfBody = processEventSourceEndOfBody;

	    // and processResponse set to the following steps given response res:
	    fetchParam.processResponse = (response) => {
	      // 1. If res is an aborted network error, then fail the connection.

	      if (isNetworkError(response)) {
	        // 1. When a user agent is to fail the connection, the user agent
	        // must queue a task which, if the readyState attribute is set to a
	        // value other than CLOSED, sets the readyState attribute to CLOSED
	        // and fires an event named error at the EventSource object. Once the
	        // user agent has failed the connection, it does not attempt to
	        // reconnect.
	        if (response.aborted) {
	          this.close();
	          this.dispatchEvent(new Event('error'));
	          return
	          // 2. Otherwise, if res is a network error, then reestablish the
	          // connection, unless the user agent knows that to be futile, in
	          // which case the user agent may fail the connection.
	        } else {
	          this.#reconnect();
	          return
	        }
	      }

	      // 3. Otherwise, if res's status is not 200, or if res's `Content-Type`
	      // is not `text/event-stream`, then fail the connection.
	      const contentType = response.headersList.get('content-type', true);
	      const mimeType = contentType !== null ? parseMIMEType(contentType) : 'failure';
	      const contentTypeValid = mimeType !== 'failure' && mimeType.essence === 'text/event-stream';
	      if (
	        response.status !== 200 ||
	        contentTypeValid === false
	      ) {
	        this.close();
	        this.dispatchEvent(new Event('error'));
	        return
	      }

	      // 4. Otherwise, announce the connection and interpret res's body
	      // line by line.

	      // When a user agent is to announce the connection, the user agent
	      // must queue a task which, if the readyState attribute is set to a
	      // value other than CLOSED, sets the readyState attribute to OPEN
	      // and fires an event named open at the EventSource object.
	      // @see https://html.spec.whatwg.org/multipage/server-sent-events.html#sse-processing-model
	      this.#readyState = OPEN;
	      this.dispatchEvent(new Event('open'));

	      // If redirected to a different origin, set the origin to the new origin.
	      this.#settings.origin = response.urlList[response.urlList.length - 1].origin;

	      const eventSourceStream = new EventSourceStream({
	        eventSourceSettings: this.#settings,
	        push: (event) => {
	          this.dispatchEvent(new MessageEvent(
	            event.type,
	            event.options
	          ));
	        }
	      });

	      pipeline(response.body.stream,
	        eventSourceStream,
	        (error) => {
	          if (
	            error?.aborted === false
	          ) {
	            this.close();
	            this.dispatchEvent(new Event('error'));
	          }
	        });
	    };

	    this.#controller = fetching(fetchParam);
	  }

	  /**
	   * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#sse-processing-model
	   * @returns {Promise<void>}
	   */
	  async #reconnect () {
	    // When a user agent is to reestablish the connection, the user agent must
	    // run the following steps. These steps are run in parallel, not as part of
	    // a task. (The tasks that it queues, of course, are run like normal tasks
	    // and not themselves in parallel.)

	    // 1. Queue a task to run the following steps:

	    //   1. If the readyState attribute is set to CLOSED, abort the task.
	    if (this.#readyState === CLOSED) return

	    //   2. Set the readyState attribute to CONNECTING.
	    this.#readyState = CONNECTING;

	    //   3. Fire an event named error at the EventSource object.
	    this.dispatchEvent(new Event('error'));

	    // 2. Wait a delay equal to the reconnection time of the event source.
	    await delay(this.#settings.reconnectionTime);

	    // 5. Queue a task to run the following steps:

	    //   1. If the EventSource object's readyState attribute is not set to
	    //      CONNECTING, then return.
	    if (this.#readyState !== CONNECTING) return

	    //   2. Let request be the EventSource object's request.
	    //   3. If the EventSource object's last event ID string is not the empty
	    //      string, then:
	    //      1. Let lastEventIDValue be the EventSource object's last event ID
	    //         string, encoded as UTF-8.
	    //      2. Set (`Last-Event-ID`, lastEventIDValue) in request's header
	    //         list.
	    if (this.#settings.lastEventId !== '') {
	      this.#request.headersList.set('last-event-id', this.#settings.lastEventId, true);
	    }

	    //   4. Fetch request and process the response obtained in this fashion, if any, as described earlier in this section.
	    this.#connect();
	  }

	  /**
	   * Closes the connection, if any, and sets the readyState attribute to
	   * CLOSED.
	   */
	  close () {
	    webidl.brandCheck(this, EventSource);

	    if (this.#readyState === CLOSED) return
	    this.#readyState = CLOSED;
	    clearTimeout(this.#settings.reconnectionTimer);
	    this.#controller.abort();

	    if (this.#request) {
	      this.#request = null;
	    }
	  }

	  get onopen () {
	    return this.#events.open
	  }

	  set onopen (fn) {
	    if (this.#events.open) {
	      this.removeEventListener('open', this.#events.open);
	    }

	    if (typeof fn === 'function') {
	      this.#events.open = fn;
	      this.addEventListener('open', fn);
	    } else {
	      this.#events.open = null;
	    }
	  }

	  get onmessage () {
	    return this.#events.message
	  }

	  set onmessage (fn) {
	    if (this.#events.message) {
	      this.removeEventListener('message', this.#events.message);
	    }

	    if (typeof fn === 'function') {
	      this.#events.message = fn;
	      this.addEventListener('message', fn);
	    } else {
	      this.#events.message = null;
	    }
	  }

	  get onerror () {
	    return this.#events.error
	  }

	  set onerror (fn) {
	    if (this.#events.error) {
	      this.removeEventListener('error', this.#events.error);
	    }

	    if (typeof fn === 'function') {
	      this.#events.error = fn;
	      this.addEventListener('error', fn);
	    } else {
	      this.#events.error = null;
	    }
	  }
	}

	const constantsPropertyDescriptors = {
	  CONNECTING: {
	    __proto__: null,
	    configurable: false,
	    enumerable: true,
	    value: CONNECTING,
	    writable: false
	  },
	  OPEN: {
	    __proto__: null,
	    configurable: false,
	    enumerable: true,
	    value: OPEN,
	    writable: false
	  },
	  CLOSED: {
	    __proto__: null,
	    configurable: false,
	    enumerable: true,
	    value: CLOSED,
	    writable: false
	  }
	};

	Object.defineProperties(EventSource, constantsPropertyDescriptors);
	Object.defineProperties(EventSource.prototype, constantsPropertyDescriptors);

	Object.defineProperties(EventSource.prototype, {
	  close: kEnumerableProperty,
	  onerror: kEnumerableProperty,
	  onmessage: kEnumerableProperty,
	  onopen: kEnumerableProperty,
	  readyState: kEnumerableProperty,
	  url: kEnumerableProperty,
	  withCredentials: kEnumerableProperty
	});

	webidl.converters.EventSourceInitDict = webidl.dictionaryConverter([
	  { key: 'withCredentials', converter: webidl.converters.boolean, defaultValue: false }
	]);

	eventsource = {
	  EventSource,
	  defaultReconnectionTime
	};
	return eventsource;
}

const Client = client;
const Dispatcher = dispatcher;
const Pool = pool;
const BalancedPool = balancedPool;
const Agent = agent;
const ProxyAgent = proxyAgent;
const RetryAgent = retryAgent;
const errors = errors$1;
const util = util$m;
const { InvalidArgumentError } = errors;
const api = api$1;
const buildConnector = connect$3;
const MockClient = mockClient;
const MockAgent = mockAgent;
const MockPool = mockPool;
const mockErrors = mockErrors$1;
const RetryHandler = retryHandler;
const { getGlobalDispatcher, setGlobalDispatcher } = global$1;
const DecoratorHandler = decoratorHandler;
const RedirectHandler = redirectHandler;
const createRedirectInterceptor = redirectInterceptor;

Object.assign(Dispatcher.prototype, api);

var Dispatcher_1 = undici.Dispatcher = Dispatcher;
var Client_1 = undici.Client = Client;
var Pool_1 = undici.Pool = Pool;
var BalancedPool_1 = undici.BalancedPool = BalancedPool;
var Agent_1 = undici.Agent = Agent;
var ProxyAgent_1 = undici.ProxyAgent = ProxyAgent;
var RetryAgent_1 = undici.RetryAgent = RetryAgent;
var RetryHandler_1 = undici.RetryHandler = RetryHandler;

var DecoratorHandler_1 = undici.DecoratorHandler = DecoratorHandler;
var RedirectHandler_1 = undici.RedirectHandler = RedirectHandler;
var createRedirectInterceptor_1 = undici.createRedirectInterceptor = createRedirectInterceptor;
var interceptors = undici.interceptors = {
  redirect: redirect,
  retry: retry
};

var buildConnector_1 = undici.buildConnector = buildConnector;
var errors_1 = undici.errors = errors;
var util_1 = undici.util = {
  parseHeaders: util.parseHeaders,
  headerNameToString: util.headerNameToString
};

function makeDispatcher (fn) {
  return (url, opts, handler) => {
    if (typeof opts === 'function') {
      handler = opts;
      opts = null;
    }

    if (!url || (typeof url !== 'string' && typeof url !== 'object' && !(url instanceof URL))) {
      throw new InvalidArgumentError('invalid url')
    }

    if (opts != null && typeof opts !== 'object') {
      throw new InvalidArgumentError('invalid opts')
    }

    if (opts && opts.path != null) {
      if (typeof opts.path !== 'string') {
        throw new InvalidArgumentError('invalid opts.path')
      }

      let path = opts.path;
      if (!opts.path.startsWith('/')) {
        path = `/${path}`;
      }

      url = new URL(util.parseOrigin(url).origin + path);
    } else {
      if (!opts) {
        opts = typeof url === 'object' ? url : {};
      }

      url = util.parseURL(url);
    }

    const { agent, dispatcher = getGlobalDispatcher() } = opts;

    if (agent) {
      throw new InvalidArgumentError('unsupported opts.agent. Did you mean opts.client?')
    }

    return fn.call(dispatcher, {
      ...opts,
      origin: url.origin,
      path: url.search ? `${url.pathname}${url.search}` : url.pathname,
      method: opts.method || (opts.body ? 'PUT' : 'GET')
    }, handler)
  }
}

var setGlobalDispatcher_1 = undici.setGlobalDispatcher = setGlobalDispatcher;
var getGlobalDispatcher_1 = undici.getGlobalDispatcher = getGlobalDispatcher;

const fetchImpl = requireFetch().fetch;
var fetch = undici.fetch = async function fetch (init, options = undefined) {
  try {
    return await fetchImpl(init, options)
  } catch (err) {
    if (err && typeof err === 'object') {
      Error.captureStackTrace(err, this);
    }

    throw err
  }
};
var Headers = undici.Headers = requireHeaders().Headers;
var Response = undici.Response = requireResponse().Response;
var Request = undici.Request = requireRequest().Request;
var FormData = undici.FormData = requireFormdata().FormData;
var File = undici.File = requireFile().File;
var FileReader = undici.FileReader = requireFilereader().FileReader;

const { setGlobalOrigin, getGlobalOrigin } = requireGlobal();

var setGlobalOrigin_1 = undici.setGlobalOrigin = setGlobalOrigin;
var getGlobalOrigin_1 = undici.getGlobalOrigin = getGlobalOrigin;

const { CacheStorage } = requireCachestorage();
const { kConstruct } = requireSymbols$1();

// Cache & CacheStorage are tightly coupled with fetch. Even if it may run
// in an older version of Node, it doesn't have any use without fetch.
var caches = undici.caches = new CacheStorage(kConstruct);

const { deleteCookie, getCookies, getSetCookies, setCookie } = requireCookies();

var deleteCookie_1 = undici.deleteCookie = deleteCookie;
var getCookies_1 = undici.getCookies = getCookies;
var getSetCookies_1 = undici.getSetCookies = getSetCookies;
var setCookie_1 = undici.setCookie = setCookie;

const { parseMIMEType, serializeAMimeType } = requireDataUrl();

var parseMIMEType_1 = undici.parseMIMEType = parseMIMEType;
var serializeAMimeType_1 = undici.serializeAMimeType = serializeAMimeType;

const { CloseEvent, ErrorEvent, MessageEvent } = requireEvents();
var WebSocket = undici.WebSocket = requireWebsocket().WebSocket;
var CloseEvent_1 = undici.CloseEvent = CloseEvent;
var ErrorEvent_1 = undici.ErrorEvent = ErrorEvent;
var MessageEvent_1 = undici.MessageEvent = MessageEvent;

var request = undici.request = makeDispatcher(api.request);
var stream = undici.stream = makeDispatcher(api.stream);
var pipeline = undici.pipeline = makeDispatcher(api.pipeline);
var connect = undici.connect = makeDispatcher(api.connect);
var upgrade = undici.upgrade = makeDispatcher(api.upgrade);

var MockClient_1 = undici.MockClient = MockClient;
var MockPool_1 = undici.MockPool = MockPool;
var MockAgent_1 = undici.MockAgent = MockAgent;
var mockErrors_1 = undici.mockErrors = mockErrors;

const { EventSource } = requireEventsource();

var EventSource_1 = undici.EventSource = EventSource;

export { Agent_1 as Agent, BalancedPool_1 as BalancedPool, Client_1 as Client, CloseEvent_1 as CloseEvent, DecoratorHandler_1 as DecoratorHandler, Dispatcher_1 as Dispatcher, ErrorEvent_1 as ErrorEvent, EventSource_1 as EventSource, File, FileReader, FormData, Headers, MessageEvent_1 as MessageEvent, MockAgent_1 as MockAgent, MockClient_1 as MockClient, MockPool_1 as MockPool, Pool_1 as Pool, ProxyAgent_1 as ProxyAgent, RedirectHandler_1 as RedirectHandler, Request, Response, RetryAgent_1 as RetryAgent, RetryHandler_1 as RetryHandler, WebSocket, buildConnector_1 as buildConnector, caches, connect, createRedirectInterceptor_1 as createRedirectInterceptor, undici as default, deleteCookie_1 as deleteCookie, errors_1 as errors, fetch, getCookies_1 as getCookies, getGlobalDispatcher_1 as getGlobalDispatcher, getGlobalOrigin_1 as getGlobalOrigin, getSetCookies_1 as getSetCookies, interceptors, mockErrors_1 as mockErrors, parseMIMEType_1 as parseMIMEType, pipeline, request, serializeAMimeType_1 as serializeAMimeType, setCookie_1 as setCookie, setGlobalDispatcher_1 as setGlobalDispatcher, setGlobalOrigin_1 as setGlobalOrigin, stream, upgrade, util_1 as util };
