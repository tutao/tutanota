/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @enum
 * Enum for RequestMethods
 * @property {string} GET - The get request type
 * @property {string} PATCH - The patch request type
 * @property {string} POST - The post request type
 * @property {string} PUT - The put request type
 * @property {string} DELETE - The delete request type
 */
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["GET"] = "GET";
    RequestMethod["PATCH"] = "PATCH";
    RequestMethod["POST"] = "POST";
    RequestMethod["PUT"] = "PUT";
    RequestMethod["DELETE"] = "DELETE";
})(RequestMethod || (RequestMethod = {}));

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @module Constants
 */
/**
 * @constant
 * A Default API endpoint version for a request
 */
const GRAPH_API_VERSION = "v1.0";
/**
 * @constant
 * A Default base url for a request
 */
const GRAPH_BASE_URL = "https://graph.microsoft.com/";
/**
 * To hold list of the service root endpoints for Microsoft Graph and Graph Explorer for each national cloud.
 * Set(iterable:Object) is not supported in Internet Explorer. The consumer is recommended to use a suitable polyfill.
 */
const GRAPH_URLS = new Set(["graph.microsoft.com", "graph.microsoft.us", "dod-graph.microsoft.us", "graph.microsoft.de", "microsoftgraph.chinacloudapi.cn", "canary.graph.microsoft.com"]);

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @module GraphClientError
 */
/**
 * @class
 * Create GraphClientError object to handle client-side errors
 * encountered within the JavaScript Client SDK.
 * Whereas GraphError Class should be used to handle errors in the response from the Graph API.
 */
class GraphClientError extends Error {
    /**
     * @public
     * @static
     * @async
     * To set the GraphClientError object
     * @param {any} error - The error returned encountered by the Graph JavaScript Client SDK while processing request
     * @returns GraphClientError object set to the error passed
     */
    static setGraphClientError(error) {
        let graphClientError;
        if (error instanceof Error) {
            graphClientError = error;
        }
        else {
            graphClientError = new GraphClientError();
            graphClientError.customError = error;
        }
        return graphClientError;
    }
    /**
     * @public
     * @constructor
     * Creates an instance of GraphClientError
     * @param {string} message? - Error message
     * @returns An instance of GraphClientError
     */
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, GraphClientError.prototype);
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @module GraphRequestUtil
 */
/**
 * To hold list of OData query params
 */
const oDataQueryNames = ["$select", "$expand", "$orderby", "$filter", "$top", "$skip", "$skipToken", "$count"];
/**
 * To construct the URL by appending the segments with "/"
 * @param {string[]} urlSegments - The array of strings
 * @returns The constructed URL string
 */
const urlJoin = (urlSegments) => {
    const removePostSlash = (s) => s.replace(/\/+$/, "");
    const removePreSlash = (s) => s.replace(/^\/+/, "");
    const joiner = (pre, cur) => [removePostSlash(pre), removePreSlash(cur)].join("/");
    const parts = Array.prototype.slice.call(urlSegments);
    return parts.reduce(joiner);
};
/**
 * Serializes the content
 * @param {any} content - The content value that needs to be serialized
 * @returns The serialized content
 *
 * Note:
 * This conversion is required due to the following reasons:
 * Body parameter of Request method of isomorphic-fetch only accepts Blob, ArrayBuffer, FormData, TypedArrays string.
 * Node.js platform does not support Blob, FormData. Javascript File object inherits from Blob so it is also not supported in node. Therefore content of type Blob, File, FormData will only come from browsers.
 * Parallel to ArrayBuffer in javascript, node provides Buffer interface. Node's Buffer is able to send the arbitrary binary data to the server successfully for both Browser and Node platform. Whereas sending binary data via ArrayBuffer or TypedArrays was only possible using Browser. To support both Node and Browser, `serializeContent` converts TypedArrays or ArrayBuffer to `Node Buffer`.
 * If the data received is in JSON format, `serializeContent` converts the JSON to string.
 */
const serializeContent = (content) => {
    const className = content && content.constructor && content.constructor.name;
    if (className === "Buffer" || className === "Blob" || className === "File" || className === "FormData" || typeof content === "string") {
        return content;
    }
    if (className === "ArrayBuffer") {
        content = Buffer.from(content);
    }
    else if (className === "Int8Array" || className === "Int16Array" || className === "Int32Array" || className === "Uint8Array" || className === "Uint16Array" || className === "Uint32Array" || className === "Uint8ClampedArray" || className === "Float32Array" || className === "Float64Array" || className === "DataView") {
        content = Buffer.from(content.buffer);
    }
    else {
        try {
            content = JSON.stringify(content);
        }
        catch (error) {
            throw new Error("Unable to stringify the content");
        }
    }
    return content;
};
/**
 * Checks if the url is one of the service root endpoints for Microsoft Graph and Graph Explorer.
 * @param {string} url - The url to be verified
 * @returns {boolean} - Returns true if the url is a Graph URL
 */
const isGraphURL = (url) => {
    return isValidEndpoint(url);
};
/**
 * Checks if the url is for one of the custom hosts provided during client initialization
 * @param {string} url - The url to be verified
 * @param {Set} customHosts - The url to be verified
 * @returns {boolean} - Returns true if the url is a for a custom host
 */
const isCustomHost = (url, customHosts) => {
    customHosts.forEach((host) => isCustomHostValid(host));
    return isValidEndpoint(url, customHosts);
};
/**
 * Checks if the url is for one of the provided hosts.
 * @param {string} url - The url to be verified
 * @param {Set<string>} allowedHosts - A set of hosts.
 * @returns {boolean} - Returns true is for one of the provided endpoints.
 */
const isValidEndpoint = (url, allowedHosts = GRAPH_URLS) => {
    // Valid Graph URL pattern - https://graph.microsoft.com/{version}/{resource}?{query-parameters}
    // Valid Graph URL example - https://graph.microsoft.com/v1.0/
    url = url.toLowerCase();
    if (url.indexOf("https://") !== -1) {
        url = url.replace("https://", "");
        // Find where the host ends
        const startofPortNoPos = url.indexOf(":");
        const endOfHostStrPos = url.indexOf("/");
        let hostName = "";
        if (endOfHostStrPos !== -1) {
            if (startofPortNoPos !== -1 && startofPortNoPos < endOfHostStrPos) {
                hostName = url.substring(0, startofPortNoPos);
                return allowedHosts.has(hostName);
            }
            // Parse out the host
            hostName = url.substring(0, endOfHostStrPos);
            return allowedHosts.has(hostName);
        }
    }
    return false;
};
/**
 * Throws error if the string is not a valid host/hostname and contains other url parts.
 * @param {string} host - The host to be verified
 */
const isCustomHostValid = (host) => {
    if (host.indexOf("/") !== -1) {
        throw new GraphClientError("Please add only hosts or hostnames to the CustomHosts config. If the url is `http://example.com:3000/`, host is `example:3000`");
    }
};

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * Class representing MiddlewareControl
 */
class MiddlewareControl {
    /**
     * @public
     * @constructor
     * Creates an instance of MiddlewareControl
     * @param {MiddlewareOptions[]} [middlewareOptions = []] - The array of middlewareOptions
     * @returns The instance of MiddlewareControl
     */
    constructor(middlewareOptions = []) {
        this.middlewareOptions = new Map();
        for (const option of middlewareOptions) {
            const fn = option.constructor;
            this.middlewareOptions.set(fn, option);
        }
    }
    /**
     * @public
     * To get the middleware option using the class of the option
     * @param {Function} fn - The class of the strongly typed option class
     * @returns The middleware option
     * @example
     * // if you wanted to return the middleware option associated with this class (MiddlewareControl)
     * // call this function like this:
     * getMiddlewareOptions(MiddlewareControl)
     */
    getMiddlewareOptions(fn) {
        return this.middlewareOptions.get(fn);
    }
    /**
     * @public
     * To set the middleware options using the class of the option
     * @param {Function} fn - The class of the strongly typed option class
     * @param {MiddlewareOptions} option - The strongly typed middleware option
     * @returns nothing
     */
    setMiddlewareOptions(fn, option) {
        this.middlewareOptions.set(fn, option);
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @constant
 * To generate the UUID
 * @returns The UUID string
 */
const generateUUID = () => {
    let uuid = "";
    for (let j = 0; j < 32; j++) {
        if (j === 8 || j === 12 || j === 16 || j === 20) {
            uuid += "-";
        }
        uuid += Math.floor(Math.random() * 16).toString(16);
    }
    return uuid;
};
/**
 * @constant
 * To get the request header from the request
 * @param {RequestInfo} request - The request object or the url string
 * @param {FetchOptions|undefined} options - The request options object
 * @param {string} key - The header key string
 * @returns A header value for the given key from the request
 */
const getRequestHeader = (request, options, key) => {
    let value = null;
    if (typeof Request !== "undefined" && request instanceof Request) {
        value = request.headers.get(key);
    }
    else if (typeof options !== "undefined" && options.headers !== undefined) {
        if (typeof Headers !== "undefined" && options.headers instanceof Headers) {
            value = options.headers.get(key);
        }
        else if (options.headers instanceof Array) {
            const headers = options.headers;
            for (let i = 0, l = headers.length; i < l; i++) {
                if (headers[i][0] === key) {
                    value = headers[i][1];
                    break;
                }
            }
        }
        else if (options.headers[key] !== undefined) {
            value = options.headers[key];
        }
    }
    return value;
};
/**
 * @constant
 * To set the header value to the given request
 * @param {RequestInfo} request - The request object or the url string
 * @param {FetchOptions|undefined} options - The request options object
 * @param {string} key - The header key string
 * @param {string } value - The header value string
 * @returns Nothing
 */
const setRequestHeader = (request, options, key, value) => {
    if (typeof Request !== "undefined" && request instanceof Request) {
        request.headers.set(key, value);
    }
    else if (typeof options !== "undefined") {
        if (options.headers === undefined) {
            options.headers = new Headers({
                [key]: value,
            });
        }
        else {
            if (typeof Headers !== "undefined" && options.headers instanceof Headers) {
                options.headers.set(key, value);
            }
            else if (options.headers instanceof Array) {
                let i = 0;
                const l = options.headers.length;
                for (; i < l; i++) {
                    const header = options.headers[i];
                    if (header[0] === key) {
                        header[1] = value;
                        break;
                    }
                }
                if (i === l) {
                    options.headers.push([key, value]);
                }
            }
            else {
                Object.assign(options.headers, { [key]: value });
            }
        }
    }
};
/**
 * @constant
 * To append the header value to the given request
 * @param {RequestInfo} request - The request object or the url string
 * @param {FetchOptions|undefined} options - The request options object
 * @param {string} key - The header key string
 * @param {string } value - The header value string
 * @returns Nothing
 */
const appendRequestHeader = (request, options, key, value) => {
    if (typeof Request !== "undefined" && request instanceof Request) {
        request.headers.append(key, value);
    }
    else if (typeof options !== "undefined") {
        if (options.headers === undefined) {
            options.headers = new Headers({
                [key]: value,
            });
        }
        else {
            if (typeof Headers !== "undefined" && options.headers instanceof Headers) {
                options.headers.append(key, value);
            }
            else if (options.headers instanceof Array) {
                options.headers.push([key, value]);
            }
            else if (options.headers === undefined) {
                options.headers = { [key]: value };
            }
            else if (options.headers[key] === undefined) {
                options.headers[key] = value;
            }
            else {
                options.headers[key] += `, ${value}`;
            }
        }
    }
};
/**
 * @constant
 * To clone the request with the new url
 * @param {string} url - The new url string
 * @param {Request} request - The request object
 * @returns A promise that resolves to request object
 */
const cloneRequestWithNewUrl = (newUrl, request) => __awaiter(void 0, void 0, void 0, function* () {
    const body = request.headers.get("Content-Type") ? yield request.blob() : yield Promise.resolve(undefined);
    const { method, headers, referrer, referrerPolicy, mode, credentials, cache, redirect, integrity, keepalive, signal } = request;
    return new Request(newUrl, { method, headers, body, referrer, referrerPolicy, mode, credentials, cache, redirect, integrity, keepalive, signal });
});

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * @implements MiddlewareOptions
 * Class representing AuthenticationHandlerOptions
 */
class AuthenticationHandlerOptions {
    /**
     * @public
     * @constructor
     * To create an instance of AuthenticationHandlerOptions
     * @param {AuthenticationProvider} [authenticationProvider] - The authentication provider instance
     * @param {AuthenticationProviderOptions} [authenticationProviderOptions] - The authentication provider options instance
     * @returns An instance of AuthenticationHandlerOptions
     */
    constructor(authenticationProvider, authenticationProviderOptions) {
        this.authenticationProvider = authenticationProvider;
        this.authenticationProviderOptions = authenticationProviderOptions;
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @enum
 * @property {number} NONE - The hexadecimal flag value for nothing enabled
 * @property {number} REDIRECT_HANDLER_ENABLED - The hexadecimal flag value for redirect handler enabled
 * @property {number} RETRY_HANDLER_ENABLED - The hexadecimal flag value for retry handler enabled
 * @property {number} AUTHENTICATION_HANDLER_ENABLED - The hexadecimal flag value for the authentication handler enabled
 */
var FeatureUsageFlag;
(function (FeatureUsageFlag) {
    /* eslint-disable  @typescript-eslint/naming-convention */
    FeatureUsageFlag[FeatureUsageFlag["NONE"] = 0] = "NONE";
    FeatureUsageFlag[FeatureUsageFlag["REDIRECT_HANDLER_ENABLED"] = 1] = "REDIRECT_HANDLER_ENABLED";
    FeatureUsageFlag[FeatureUsageFlag["RETRY_HANDLER_ENABLED"] = 2] = "RETRY_HANDLER_ENABLED";
    FeatureUsageFlag[FeatureUsageFlag["AUTHENTICATION_HANDLER_ENABLED"] = 4] = "AUTHENTICATION_HANDLER_ENABLED";
    /* eslint-enable  @typescript-eslint/naming-convention */
})(FeatureUsageFlag || (FeatureUsageFlag = {}));
/**
 * @class
 * @implements MiddlewareOptions
 * Class for TelemetryHandlerOptions
 */
class TelemetryHandlerOptions {
    constructor() {
        /**
         * @private
         * A member to hold the OR of feature usage flags
         */
        this.featureUsage = FeatureUsageFlag.NONE;
    }
    /**
     * @public
     * @static
     * To update the feature usage in the context object
     * @param {Context} context - The request context object containing middleware options
     * @param {FeatureUsageFlag} flag - The flag value
     * @returns nothing
     */
    static updateFeatureUsageFlag(context, flag) {
        let options;
        if (context.middlewareControl instanceof MiddlewareControl) {
            options = context.middlewareControl.getMiddlewareOptions(TelemetryHandlerOptions);
        }
        else {
            context.middlewareControl = new MiddlewareControl();
        }
        if (typeof options === "undefined") {
            options = new TelemetryHandlerOptions();
            context.middlewareControl.setMiddlewareOptions(TelemetryHandlerOptions, options);
        }
        options.setFeatureUsage(flag);
    }
    /**
     * @private
     * To set the feature usage flag
     * @param {FeatureUsageFlag} flag - The flag value
     * @returns nothing
     */
    setFeatureUsage(flag) {
        this.featureUsage = this.featureUsage | flag;
    }
    /**
     * @public
     * To get the feature usage
     * @returns A feature usage flag as hexadecimal string
     */
    getFeatureUsage() {
        return this.featureUsage.toString(16);
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * @implements Middleware
 * Class representing AuthenticationHandler
 */
class AuthenticationHandler {
    /**
     * @public
     * @constructor
     * Creates an instance of AuthenticationHandler
     * @param {AuthenticationProvider} authenticationProvider - The authentication provider for the authentication handler
     */
    constructor(authenticationProvider) {
        this.authenticationProvider = authenticationProvider;
    }
    /**
     * @public
     * @async
     * To execute the current middleware
     * @param {Context} context - The context object of the request
     * @returns A Promise that resolves to nothing
     */
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = typeof context.request === "string" ? context.request : context.request.url;
            if (isGraphURL(url) || (context.customHosts && isCustomHost(url, context.customHosts))) {
                let options;
                if (context.middlewareControl instanceof MiddlewareControl) {
                    options = context.middlewareControl.getMiddlewareOptions(AuthenticationHandlerOptions);
                }
                let authenticationProvider;
                let authenticationProviderOptions;
                if (options) {
                    authenticationProvider = options.authenticationProvider;
                    authenticationProviderOptions = options.authenticationProviderOptions;
                }
                if (!authenticationProvider) {
                    authenticationProvider = this.authenticationProvider;
                }
                const token = yield authenticationProvider.getAccessToken(authenticationProviderOptions);
                const bearerKey = `Bearer ${token}`;
                appendRequestHeader(context.request, context.options, AuthenticationHandler.AUTHORIZATION_HEADER, bearerKey);
                TelemetryHandlerOptions.updateFeatureUsageFlag(context, FeatureUsageFlag.AUTHENTICATION_HANDLER_ENABLED);
            }
            else {
                if (context.options.headers) {
                    delete context.options.headers[AuthenticationHandler.AUTHORIZATION_HEADER];
                }
            }
            return yield this.nextMiddleware.execute(context);
        });
    }
    /**
     * @public
     * To set the next middleware in the chain
     * @param {Middleware} next - The middleware instance
     * @returns Nothing
     */
    setNext(next) {
        this.nextMiddleware = next;
    }
}
/**
 * @private
 * A member representing the authorization header name
 */
AuthenticationHandler.AUTHORIZATION_HEADER = "Authorization";

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * @implements Middleware
 * Class for HTTPMessageHandler
 */
class HTTPMessageHandler {
    /**
     * @public
     * @async
     * To execute the current middleware
     * @param {Context} context - The request context object
     * @returns A promise that resolves to nothing
     */
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.response = yield fetch(context.request, context.options);
        });
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * @implements MiddlewareOptions
 * Class for RetryHandlerOptions
 */
class RetryHandlerOptions {
    /**
     * @public
     * @constructor
     * To create an instance of RetryHandlerOptions
     * @param {number} [delay = RetryHandlerOptions.DEFAULT_DELAY] - The delay value in seconds
     * @param {number} [maxRetries = RetryHandlerOptions.DEFAULT_MAX_RETRIES] - The maxRetries value
     * @param {ShouldRetry} [shouldRetry = RetryHandlerOptions.DEFAULT_SHOULD_RETRY] - The shouldRetry callback function
     * @returns An instance of RetryHandlerOptions
     */
    constructor(delay = RetryHandlerOptions.DEFAULT_DELAY, maxRetries = RetryHandlerOptions.DEFAULT_MAX_RETRIES, shouldRetry = RetryHandlerOptions.defaultShouldRetry) {
        if (delay > RetryHandlerOptions.MAX_DELAY && maxRetries > RetryHandlerOptions.MAX_MAX_RETRIES) {
            const error = new Error(`Delay and MaxRetries should not be more than ${RetryHandlerOptions.MAX_DELAY} and ${RetryHandlerOptions.MAX_MAX_RETRIES}`);
            error.name = "MaxLimitExceeded";
            throw error;
        }
        else if (delay > RetryHandlerOptions.MAX_DELAY) {
            const error = new Error(`Delay should not be more than ${RetryHandlerOptions.MAX_DELAY}`);
            error.name = "MaxLimitExceeded";
            throw error;
        }
        else if (maxRetries > RetryHandlerOptions.MAX_MAX_RETRIES) {
            const error = new Error(`MaxRetries should not be more than ${RetryHandlerOptions.MAX_MAX_RETRIES}`);
            error.name = "MaxLimitExceeded";
            throw error;
        }
        else if (delay < 0 && maxRetries < 0) {
            const error = new Error(`Delay and MaxRetries should not be negative`);
            error.name = "MinExpectationNotMet";
            throw error;
        }
        else if (delay < 0) {
            const error = new Error(`Delay should not be negative`);
            error.name = "MinExpectationNotMet";
            throw error;
        }
        else if (maxRetries < 0) {
            const error = new Error(`MaxRetries should not be negative`);
            error.name = "MinExpectationNotMet";
            throw error;
        }
        this.delay = Math.min(delay, RetryHandlerOptions.MAX_DELAY);
        this.maxRetries = Math.min(maxRetries, RetryHandlerOptions.MAX_MAX_RETRIES);
        this.shouldRetry = shouldRetry;
    }
    /**
     * @public
     * To get the maximum delay
     * @returns A maximum delay
     */
    getMaxDelay() {
        return RetryHandlerOptions.MAX_DELAY;
    }
}
/**
 * @private
 * @static
 * A member holding default delay value in seconds
 */
RetryHandlerOptions.DEFAULT_DELAY = 3;
/**
 * @private
 * @static
 * A member holding default maxRetries value
 */
RetryHandlerOptions.DEFAULT_MAX_RETRIES = 3;
/**
 * @private
 * @static
 * A member holding maximum delay value in seconds
 */
RetryHandlerOptions.MAX_DELAY = 180;
/**
 * @private
 * @static
 * A member holding maximum maxRetries value
 */
RetryHandlerOptions.MAX_MAX_RETRIES = 10;
/**
 * @private
 * A member holding default shouldRetry callback
 */
RetryHandlerOptions.defaultShouldRetry = () => true;

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * @implements Middleware
 * Class for RetryHandler
 */
class RetryHandler {
    /**
     * @public
     * @constructor
     * To create an instance of RetryHandler
     * @param {RetryHandlerOptions} [options = new RetryHandlerOptions()] - The retry handler options value
     * @returns An instance of RetryHandler
     */
    constructor(options = new RetryHandlerOptions()) {
        this.options = options;
    }
    /**
     *
     * @private
     * To check whether the response has the retry status code
     * @param {Response} response - The response object
     * @returns Whether the response has retry status code or not
     */
    isRetry(response) {
        return RetryHandler.RETRY_STATUS_CODES.indexOf(response.status) !== -1;
    }
    /**
     * @private
     * To check whether the payload is buffered or not
     * @param {RequestInfo} request - The url string or the request object value
     * @param {FetchOptions} options - The options of a request
     * @returns Whether the payload is buffered or not
     */
    isBuffered(request, options) {
        const method = typeof request === "string" ? options.method : request.method;
        const isPutPatchOrPost = method === RequestMethod.PUT || method === RequestMethod.PATCH || method === RequestMethod.POST;
        if (isPutPatchOrPost) {
            const isStream = getRequestHeader(request, options, "Content-Type") === "application/octet-stream";
            if (isStream) {
                return false;
            }
        }
        return true;
    }
    /**
     * @private
     * To get the delay for a retry
     * @param {Response} response - The response object
     * @param {number} retryAttempts - The current attempt count
     * @param {number} delay - The delay value in seconds
     * @returns A delay for a retry
     */
    getDelay(response, retryAttempts, delay) {
        const getRandomness = () => Number(Math.random().toFixed(3));
        const retryAfter = response.headers !== undefined ? response.headers.get(RetryHandler.RETRY_AFTER_HEADER) : null;
        let newDelay;
        if (retryAfter !== null) {
            if (Number.isNaN(Number(retryAfter))) {
                newDelay = Math.round((new Date(retryAfter).getTime() - Date.now()) / 1000);
            }
            else {
                newDelay = Number(retryAfter);
            }
        }
        else {
            // Adding randomness to avoid retrying at a same
            newDelay = retryAttempts >= 2 ? this.getExponentialBackOffTime(retryAttempts) + delay + getRandomness() : delay + getRandomness();
        }
        return Math.min(newDelay, this.options.getMaxDelay() + getRandomness());
    }
    /**
     * @private
     * To get an exponential back off value
     * @param {number} attempts - The current attempt count
     * @returns An exponential back off value
     */
    getExponentialBackOffTime(attempts) {
        return Math.round((1 / 2) * (Math.pow(2, attempts) - 1));
    }
    /**
     * @private
     * @async
     * To add delay for the execution
     * @param {number} delaySeconds - The delay value in seconds
     * @returns Nothing
     */
    sleep(delaySeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const delayMilliseconds = delaySeconds * 1000;
            return new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
        });
    }
    getOptions(context) {
        let options;
        if (context.middlewareControl instanceof MiddlewareControl) {
            options = context.middlewareControl.getMiddlewareOptions(this.options.constructor);
        }
        if (typeof options === "undefined") {
            options = Object.assign(new RetryHandlerOptions(), this.options);
        }
        return options;
    }
    /**
     * @private
     * @async
     * To execute the middleware with retries
     * @param {Context} context - The context object
     * @param {number} retryAttempts - The current attempt count
     * @param {RetryHandlerOptions} options - The retry middleware options instance
     * @returns A Promise that resolves to nothing
     */
    executeWithRetry(context, retryAttempts, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.nextMiddleware.execute(context);
            if (retryAttempts < options.maxRetries && this.isRetry(context.response) && this.isBuffered(context.request, context.options) && options.shouldRetry(options.delay, retryAttempts, context.request, context.options, context.response)) {
                ++retryAttempts;
                setRequestHeader(context.request, context.options, RetryHandler.RETRY_ATTEMPT_HEADER, retryAttempts.toString());
                const delay = this.getDelay(context.response, retryAttempts, options.delay);
                yield this.sleep(delay);
                return yield this.executeWithRetry(context, retryAttempts, options);
            }
            else {
                return;
            }
        });
    }
    /**
     * @public
     * @async
     * To execute the current middleware
     * @param {Context} context - The context object of the request
     * @returns A Promise that resolves to nothing
     */
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const retryAttempts = 0;
            const options = this.getOptions(context);
            TelemetryHandlerOptions.updateFeatureUsageFlag(context, FeatureUsageFlag.RETRY_HANDLER_ENABLED);
            return yield this.executeWithRetry(context, retryAttempts, options);
        });
    }
    /**
     * @public
     * To set the next middleware in the chain
     * @param {Middleware} next - The middleware instance
     * @returns Nothing
     */
    setNext(next) {
        this.nextMiddleware = next;
    }
}
/**
 * @private
 * @static
 * A list of status codes that needs to be retried
 */
RetryHandler.RETRY_STATUS_CODES = [
    429,
    503,
    504, // Gateway timeout
];
/**
 * @private
 * @static
 * A member holding the name of retry attempt header
 */
RetryHandler.RETRY_ATTEMPT_HEADER = "Retry-Attempt";
/**
 * @private
 * @static
 * A member holding the name of retry after header
 */
RetryHandler.RETRY_AFTER_HEADER = "Retry-After";

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * @implements MiddlewareOptions
 * A class representing RedirectHandlerOptions
 */
class RedirectHandlerOptions {
    /**
     * @public
     * @constructor
     * To create an instance of RedirectHandlerOptions
     * @param {number} [maxRedirects = RedirectHandlerOptions.DEFAULT_MAX_REDIRECTS] - The max redirects value
     * @param {ShouldRedirect} [shouldRedirect = RedirectHandlerOptions.DEFAULT_SHOULD_RETRY] - The should redirect callback
     * @returns An instance of RedirectHandlerOptions
     */
    constructor(maxRedirects = RedirectHandlerOptions.DEFAULT_MAX_REDIRECTS, shouldRedirect = RedirectHandlerOptions.defaultShouldRedirect) {
        if (maxRedirects > RedirectHandlerOptions.MAX_MAX_REDIRECTS) {
            const error = new Error(`MaxRedirects should not be more than ${RedirectHandlerOptions.MAX_MAX_REDIRECTS}`);
            error.name = "MaxLimitExceeded";
            throw error;
        }
        if (maxRedirects < 0) {
            const error = new Error(`MaxRedirects should not be negative`);
            error.name = "MinExpectationNotMet";
            throw error;
        }
        this.maxRedirects = maxRedirects;
        this.shouldRedirect = shouldRedirect;
    }
}
/**
 * @private
 * @static
 * A member holding default max redirects value
 */
RedirectHandlerOptions.DEFAULT_MAX_REDIRECTS = 5;
/**
 * @private
 * @static
 * A member holding maximum max redirects value
 */
RedirectHandlerOptions.MAX_MAX_REDIRECTS = 20;
/**
 * @private
 * A member holding default shouldRedirect callback
 */
RedirectHandlerOptions.defaultShouldRedirect = () => true;

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * Class
 * @implements Middleware
 * Class representing RedirectHandler
 */
class RedirectHandler {
    /**
     * @public
     * @constructor
     * To create an instance of RedirectHandler
     * @param {RedirectHandlerOptions} [options = new RedirectHandlerOptions()] - The redirect handler options instance
     * @returns An instance of RedirectHandler
     */
    constructor(options = new RedirectHandlerOptions()) {
        this.options = options;
    }
    /**
     * @private
     * To check whether the response has the redirect status code or not
     * @param {Response} response - The response object
     * @returns A boolean representing whether the response contains the redirect status code or not
     */
    isRedirect(response) {
        return RedirectHandler.REDIRECT_STATUS_CODES.indexOf(response.status) !== -1;
    }
    /**
     * @private
     * To check whether the response has location header or not
     * @param {Response} response - The response object
     * @returns A boolean representing the whether the response has location header or not
     */
    hasLocationHeader(response) {
        return response.headers.has(RedirectHandler.LOCATION_HEADER);
    }
    /**
     * @private
     * To get the redirect url from location header in response object
     * @param {Response} response - The response object
     * @returns A redirect url from location header
     */
    getLocationHeader(response) {
        return response.headers.get(RedirectHandler.LOCATION_HEADER);
    }
    /**
     * @private
     * To check whether the given url is a relative url or not
     * @param {string} url - The url string value
     * @returns A boolean representing whether the given url is a relative url or not
     */
    isRelativeURL(url) {
        return url.indexOf("://") === -1;
    }
    /**
     * @private
     * To check whether the authorization header in the request should be dropped for consequent redirected requests
     * @param {string} requestUrl - The request url value
     * @param {string} redirectUrl - The redirect url value
     * @returns A boolean representing whether the authorization header in the request should be dropped for consequent redirected requests
     */
    shouldDropAuthorizationHeader(requestUrl, redirectUrl) {
        const schemeHostRegex = /^[A-Za-z].+?:\/\/.+?(?=\/|$)/;
        const requestMatches = schemeHostRegex.exec(requestUrl);
        let requestAuthority;
        let redirectAuthority;
        if (requestMatches !== null) {
            requestAuthority = requestMatches[0];
        }
        const redirectMatches = schemeHostRegex.exec(redirectUrl);
        if (redirectMatches !== null) {
            redirectAuthority = redirectMatches[0];
        }
        return typeof requestAuthority !== "undefined" && typeof redirectAuthority !== "undefined" && requestAuthority !== redirectAuthority;
    }
    /**
     * @private
     * @async
     * To update a request url with the redirect url
     * @param {string} redirectUrl - The redirect url value
     * @param {Context} context - The context object value
     * @returns Nothing
     */
    updateRequestUrl(redirectUrl, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.request = typeof context.request === "string" ? redirectUrl : yield cloneRequestWithNewUrl(redirectUrl, context.request);
        });
    }
    /**
     * @private
     * To get the options for execution of the middleware
     * @param {Context} context - The context object
     * @returns A options for middleware execution
     */
    getOptions(context) {
        let options;
        if (context.middlewareControl instanceof MiddlewareControl) {
            options = context.middlewareControl.getMiddlewareOptions(RedirectHandlerOptions);
        }
        if (typeof options === "undefined") {
            options = Object.assign(new RedirectHandlerOptions(), this.options);
        }
        return options;
    }
    /**
     * @private
     * @async
     * To execute the next middleware and to handle in case of redirect response returned by the server
     * @param {Context} context - The context object
     * @param {number} redirectCount - The redirect count value
     * @param {RedirectHandlerOptions} options - The redirect handler options instance
     * @returns A promise that resolves to nothing
     */
    executeWithRedirect(context, redirectCount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.nextMiddleware.execute(context);
            const response = context.response;
            if (redirectCount < options.maxRedirects && this.isRedirect(response) && this.hasLocationHeader(response) && options.shouldRedirect(response)) {
                ++redirectCount;
                if (response.status === RedirectHandler.STATUS_CODE_SEE_OTHER) {
                    context.options.method = RequestMethod.GET;
                    delete context.options.body;
                }
                else {
                    const redirectUrl = this.getLocationHeader(response);
                    if (!this.isRelativeURL(redirectUrl) && this.shouldDropAuthorizationHeader(response.url, redirectUrl)) {
                        delete context.options.headers[RedirectHandler.AUTHORIZATION_HEADER];
                    }
                    yield this.updateRequestUrl(redirectUrl, context);
                }
                yield this.executeWithRedirect(context, redirectCount, options);
            }
            else {
                return;
            }
        });
    }
    /**
     * @public
     * @async
     * To execute the current middleware
     * @param {Context} context - The context object of the request
     * @returns A Promise that resolves to nothing
     */
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const redirectCount = 0;
            const options = this.getOptions(context);
            context.options.redirect = RedirectHandler.MANUAL_REDIRECT;
            TelemetryHandlerOptions.updateFeatureUsageFlag(context, FeatureUsageFlag.REDIRECT_HANDLER_ENABLED);
            return yield this.executeWithRedirect(context, redirectCount, options);
        });
    }
    /**
     * @public
     * To set the next middleware in the chain
     * @param {Middleware} next - The middleware instance
     * @returns Nothing
     */
    setNext(next) {
        this.nextMiddleware = next;
    }
}
/**
 * @private
 * @static
 * A member holding the array of redirect status codes
 */
RedirectHandler.REDIRECT_STATUS_CODES = [
    301,
    302,
    303,
    307,
    308, // Moved Permanently
];
/**
 * @private
 * @static
 * A member holding SeeOther status code
 */
RedirectHandler.STATUS_CODE_SEE_OTHER = 303;
/**
 * @private
 * @static
 * A member holding the name of the location header
 */
RedirectHandler.LOCATION_HEADER = "Location";
/**
 * @private
 * @static
 * A member representing the authorization header name
 */
RedirectHandler.AUTHORIZATION_HEADER = "Authorization";
/**
 * @private
 * @static
 * A member holding the manual redirect value
 */
RedirectHandler.MANUAL_REDIRECT = "manual";

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
// THIS FILE IS AUTO GENERATED
// ANY CHANGES WILL BE LOST DURING BUILD
/**
 * @module Version
 */
const PACKAGE_VERSION = "3.0.7";

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * @implements Middleware
 * Class for TelemetryHandler
 */
class TelemetryHandler {
    /**
     * @public
     * @async
     * To execute the current middleware
     * @param {Context} context - The context object of the request
     * @returns A Promise that resolves to nothing
     */
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = typeof context.request === "string" ? context.request : context.request.url;
            if (isGraphURL(url) || (context.customHosts && isCustomHost(url, context.customHosts))) {
                // Add telemetry only if the request url is a Graph URL.
                // Errors are reported as in issue #265 if headers are present when redirecting to a non Graph URL
                let clientRequestId = getRequestHeader(context.request, context.options, TelemetryHandler.CLIENT_REQUEST_ID_HEADER);
                if (!clientRequestId) {
                    clientRequestId = generateUUID();
                    setRequestHeader(context.request, context.options, TelemetryHandler.CLIENT_REQUEST_ID_HEADER, clientRequestId);
                }
                let sdkVersionValue = `${TelemetryHandler.PRODUCT_NAME}/${PACKAGE_VERSION}`;
                let options;
                if (context.middlewareControl instanceof MiddlewareControl) {
                    options = context.middlewareControl.getMiddlewareOptions(TelemetryHandlerOptions);
                }
                if (options) {
                    const featureUsage = options.getFeatureUsage();
                    sdkVersionValue += ` (${TelemetryHandler.FEATURE_USAGE_STRING}=${featureUsage})`;
                }
                appendRequestHeader(context.request, context.options, TelemetryHandler.SDK_VERSION_HEADER, sdkVersionValue);
            }
            else {
                // Remove telemetry headers if present during redirection.
                delete context.options.headers[TelemetryHandler.CLIENT_REQUEST_ID_HEADER];
                delete context.options.headers[TelemetryHandler.SDK_VERSION_HEADER];
            }
            return yield this.nextMiddleware.execute(context);
        });
    }
    /**
     * @public
     * To set the next middleware in the chain
     * @param {Middleware} next - The middleware instance
     * @returns Nothing
     */
    setNext(next) {
        this.nextMiddleware = next;
    }
}
/**
 * @private
 * @static
 * A member holding the name of the client request id header
 */
TelemetryHandler.CLIENT_REQUEST_ID_HEADER = "client-request-id";
/**
 * @private
 * @static
 * A member holding the name of the sdk version header
 */
TelemetryHandler.SDK_VERSION_HEADER = "SdkVersion";
/**
 * @private
 * @static
 * A member holding the language prefix for the sdk version header value
 */
TelemetryHandler.PRODUCT_NAME = "graph-js";
/**
 * @private
 * @static
 * A member holding the key for the feature usage metrics
 */
TelemetryHandler.FEATURE_USAGE_STRING = "featureUsage";

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @enum
 * Enum for ResponseType values
 * @property {string} ARRAYBUFFER - To download response content as an [ArrayBuffer]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer}
 * @property {string} BLOB - To download content as a [binary/blob] {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob}
 * @property {string} DOCUMENT - This downloads content as a document or stream
 * @property {string} JSON - To download response content as a json
 * @property {string} STREAM - To download response as a [stream]{@link https://nodejs.org/api/stream.html}
 * @property {string} TEXT - For downloading response as a text
 */
var ResponseType;
(function (ResponseType) {
    ResponseType["ARRAYBUFFER"] = "arraybuffer";
    ResponseType["BLOB"] = "blob";
    ResponseType["DOCUMENT"] = "document";
    ResponseType["JSON"] = "json";
    ResponseType["RAW"] = "raw";
    ResponseType["STREAM"] = "stream";
    ResponseType["TEXT"] = "text";
})(ResponseType || (ResponseType = {}));

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @enum
 * Enum for document types
 * @property {string} TEXT_HTML - The text/html content type
 * @property {string} TEXT_XML - The text/xml content type
 * @property {string} APPLICATION_XML - The application/xml content type
 * @property {string} APPLICATION_XHTML - The application/xhml+xml content type
 */
var DocumentType;
(function (DocumentType) {
    DocumentType["TEXT_HTML"] = "text/html";
    DocumentType["TEXT_XML"] = "text/xml";
    DocumentType["APPLICATION_XML"] = "application/xml";
    DocumentType["APPLICATION_XHTML"] = "application/xhtml+xml";
})(DocumentType || (DocumentType = {}));
/**
 * @enum
 * Enum for Content types
 * @property {string} TEXT_PLAIN - The text/plain content type
 * @property {string} APPLICATION_JSON - The application/json content type
 */
var ContentType;
(function (ContentType) {
    ContentType["TEXT_PLAIN"] = "text/plain";
    ContentType["APPLICATION_JSON"] = "application/json";
})(ContentType || (ContentType = {}));
/**
 * @enum
 * Enum for Content type regex
 * @property {string} DOCUMENT - The regex to match document content types
 * @property {string} IMAGE - The regex to match image content types
 */
var ContentTypeRegexStr;
(function (ContentTypeRegexStr) {
    ContentTypeRegexStr["DOCUMENT"] = "^(text\\/(html|xml))|(application\\/(xml|xhtml\\+xml))$";
    ContentTypeRegexStr["IMAGE"] = "^image\\/.+";
})(ContentTypeRegexStr || (ContentTypeRegexStr = {}));
/**
 * @class
 * Class for GraphResponseHandler
 */
class GraphResponseHandler {
    /**
     * @private
     * @static
     * To parse Document response
     * @param {Response} rawResponse - The response object
     * @param {DocumentType} type - The type to which the document needs to be parsed
     * @returns A promise that resolves to a document content
     */
    static parseDocumentResponse(rawResponse, type) {
        if (typeof DOMParser !== "undefined") {
            return new Promise((resolve, reject) => {
                rawResponse.text().then((xmlString) => {
                    try {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(xmlString, type);
                        resolve(xmlDoc);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
        }
        else {
            return Promise.resolve(rawResponse.body);
        }
    }
    /**
     * @private
     * @static
     * @async
     * To convert the native Response to response content
     * @param {Response} rawResponse - The response object
     * @param {ResponseType} [responseType] - The response type value
     * @returns A promise that resolves to the converted response content
     */
    static convertResponse(rawResponse, responseType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (rawResponse.status === 204) {
                // NO CONTENT
                return Promise.resolve();
            }
            let responseValue;
            const contentType = rawResponse.headers.get("Content-type");
            switch (responseType) {
                case ResponseType.ARRAYBUFFER:
                    responseValue = yield rawResponse.arrayBuffer();
                    break;
                case ResponseType.BLOB:
                    responseValue = yield rawResponse.blob();
                    break;
                case ResponseType.DOCUMENT:
                    responseValue = yield GraphResponseHandler.parseDocumentResponse(rawResponse, DocumentType.TEXT_XML);
                    break;
                case ResponseType.JSON:
                    responseValue = yield rawResponse.json();
                    break;
                case ResponseType.STREAM:
                    responseValue = yield Promise.resolve(rawResponse.body);
                    break;
                case ResponseType.TEXT:
                    responseValue = yield rawResponse.text();
                    break;
                default:
                    if (contentType !== null) {
                        const mimeType = contentType.split(";")[0];
                        if (new RegExp(ContentTypeRegexStr.DOCUMENT).test(mimeType)) {
                            responseValue = yield GraphResponseHandler.parseDocumentResponse(rawResponse, mimeType);
                        }
                        else if (new RegExp(ContentTypeRegexStr.IMAGE).test(mimeType)) {
                            responseValue = rawResponse.blob();
                        }
                        else if (mimeType === ContentType.TEXT_PLAIN) {
                            responseValue = yield rawResponse.text();
                        }
                        else if (mimeType === ContentType.APPLICATION_JSON) {
                            responseValue = yield rawResponse.json();
                        }
                        else {
                            responseValue = Promise.resolve(rawResponse.body);
                        }
                    }
                    else {
                        /**
                         * RFC specification {@link https://tools.ietf.org/html/rfc7231#section-3.1.1.5} says:
                         *  A sender that generates a message containing a payload body SHOULD
                         *  generate a Content-Type header field in that message unless the
                         *  intended media type of the enclosed representation is unknown to the
                         *  sender.  If a Content-Type header field is not present, the recipient
                         *  MAY either assume a media type of "application/octet-stream"
                         *  ([RFC2046], Section 4.5.1) or examine the data to determine its type.
                         *
                         *  So assuming it as a stream type so returning the body.
                         */
                        responseValue = Promise.resolve(rawResponse.body);
                    }
                    break;
            }
            return responseValue;
        });
    }
    /**
     * @public
     * @static
     * @async
     * To get the parsed response
     * @param {Response} rawResponse - The response object
     * @param {ResponseType} [responseType] - The response type value
     * @param {GraphRequestCallback} [callback] - The graph request callback function
     * @returns The parsed response
     */
    static getResponse(rawResponse, responseType, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (responseType === ResponseType.RAW) {
                return Promise.resolve(rawResponse);
            }
            else {
                const response = yield GraphResponseHandler.convertResponse(rawResponse, responseType);
                if (rawResponse.ok) {
                    // Status Code 2XX
                    if (typeof callback === "function") {
                        callback(null, response);
                    }
                    else {
                        return response;
                    }
                }
                else {
                    // NOT OK Response
                    throw response;
                }
            }
        });
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * Class representing CustomAuthenticationProvider
 * @extends AuthenticationProvider
 */
class CustomAuthenticationProvider {
    /**
     * @public
     * @constructor
     * Creates an instance of CustomAuthenticationProvider
     * @param {AuthProviderCallback} provider - An authProvider function
     * @returns An instance of CustomAuthenticationProvider
     */
    constructor(provider) {
        this.provider = provider;
    }
    /**
     * @public
     * @async
     * To get the access token
     * @returns The promise that resolves to an access token
     */
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.provider((error, accessToken) => __awaiter(this, void 0, void 0, function* () {
                    if (accessToken) {
                        resolve(accessToken);
                    }
                    else {
                        if (!error) {
                            const invalidTokenMessage = "Access token is undefined or empty.\
						Please provide a valid token.\
						For more help - https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CustomAuthenticationProvider.md";
                            error = new GraphClientError(invalidTokenMessage);
                        }
                        const err = yield GraphClientError.setGraphClientError(error);
                        reject(err);
                    }
                }));
            });
        });
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @module GraphError
 */
/**
 * @class
 * Class for GraphError
 * @NOTE: This is NOT what is returned from the Graph
 * GraphError is created from parsing JSON errors returned from the graph
 * Some fields are renamed ie, "request-id" => requestId so you can use dot notation
 */
class GraphError extends Error {
    /**
     * @public
     * @constructor
     * Creates an instance of GraphError
     * @param {number} [statusCode = -1] - The status code of the error
     * @param {string} [message] - The message of the error
     * @param {Error} [baseError] - The base error
     * @returns An instance of GraphError
     */
    constructor(statusCode = -1, message, baseError) {
        super(message || (baseError && baseError.message));
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, GraphError.prototype);
        this.statusCode = statusCode;
        this.code = null;
        this.requestId = null;
        this.date = new Date();
        this.body = null;
        this.stack = baseError ? baseError.stack : this.stack;
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * Class for GraphErrorHandler
 */
class GraphErrorHandler {
    /**
     * @private
     * @static
     * Populates the GraphError instance with Error instance values
     * @param {Error} error - The error returned by graph service or some native error
     * @param {number} [statusCode] - The status code of the response
     * @returns The GraphError instance
     */
    static constructError(error, statusCode, rawResponse) {
        const gError = new GraphError(statusCode, "", error);
        if (error.name !== undefined) {
            gError.code = error.name;
        }
        gError.body = error.toString();
        gError.date = new Date();
        gError.headers = rawResponse === null || rawResponse === void 0 ? void 0 : rawResponse.headers;
        return gError;
    }
    /**
     * @private
     * @static
     * @async
     * Populates the GraphError instance from the Error returned by graph service
     * @param {GraphAPIErrorResponse} graphError - The error possibly returned by graph service or some native error
     * @param {number} statusCode - The status code of the response
     * @returns A promise that resolves to GraphError instance
     *
     * Example error for https://graph.microsoft.com/v1.0/me/events?$top=3&$search=foo
     * {
     *      "error": {
     *          "code": "SearchEvents",
     *          "message": "The parameter $search is not currently supported on the Events resource.",
     *          "innerError": {
     *              "request-id": "b31c83fd-944c-4663-aa50-5d9ceb367e19",
     *              "date": "2016-11-17T18:37:45"
     *          }
     *      }
     *  }
     */
    static constructErrorFromResponse(graphError, statusCode, rawResponse) {
        const error = graphError.error;
        const gError = new GraphError(statusCode, error.message);
        gError.code = error.code;
        if (error.innerError !== undefined) {
            gError.requestId = error.innerError["request-id"];
            gError.date = new Date(error.innerError.date);
        }
        gError.body = JSON.stringify(error);
        gError.headers = rawResponse === null || rawResponse === void 0 ? void 0 : rawResponse.headers;
        return gError;
    }
    /**
     * @public
     * @static
     * @async
     * To get the GraphError object
     * Reference - https://docs.microsoft.com/en-us/graph/errors
     * @param {any} [error = null] - The error returned by graph service or some native error
     * @param {number} [statusCode = -1] - The status code of the response
     * @param {GraphRequestCallback} [callback] - The graph request callback function
     * @returns A promise that resolves to GraphError instance
     */
    static getError(error = null, statusCode = -1, callback, rawResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            let gError;
            if (error && error.error) {
                gError = GraphErrorHandler.constructErrorFromResponse(error, statusCode, rawResponse);
            }
            else if (error instanceof Error) {
                gError = GraphErrorHandler.constructError(error, statusCode, rawResponse);
            }
            else {
                gError = new GraphError(statusCode);
                gError.body = error; // if a custom error is passed which is not instance of Error object or a graph API response
            }
            if (typeof callback === "function") {
                callback(gError, null);
            }
            else {
                return gError;
            }
        });
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * A Class representing GraphRequest
 */
class GraphRequest {
    /**
     * @public
     * @constructor
     * Creates an instance of GraphRequest
     * @param {HTTPClient} httpClient - The HTTPClient instance
     * @param {ClientOptions} config - The options for making request
     * @param {string} path - A path string
     */
    constructor(httpClient, config, path) {
        /**
         * @private
         * Parses the path string and creates URLComponents out of it
         * @param {string} path - The request path string
         * @returns Nothing
         */
        this.parsePath = (path) => {
            // Strips out the base of the url if they passed in
            if (path.indexOf("https://") !== -1) {
                path = path.replace("https://", "");
                // Find where the host ends
                const endOfHostStrPos = path.indexOf("/");
                if (endOfHostStrPos !== -1) {
                    // Parse out the host
                    this.urlComponents.host = "https://" + path.substring(0, endOfHostStrPos);
                    // Strip the host from path
                    path = path.substring(endOfHostStrPos + 1, path.length);
                }
                // Remove the following version
                const endOfVersionStrPos = path.indexOf("/");
                if (endOfVersionStrPos !== -1) {
                    // Parse out the version
                    this.urlComponents.version = path.substring(0, endOfVersionStrPos);
                    // Strip version from path
                    path = path.substring(endOfVersionStrPos + 1, path.length);
                }
            }
            // Strip out any leading "/"
            if (path.charAt(0) === "/") {
                path = path.substr(1);
            }
            const queryStrPos = path.indexOf("?");
            if (queryStrPos === -1) {
                // No query string
                this.urlComponents.path = path;
            }
            else {
                this.urlComponents.path = path.substr(0, queryStrPos);
                // Capture query string into oDataQueryParams and otherURLQueryParams
                const queryParams = path.substring(queryStrPos + 1, path.length).split("&");
                for (const queryParam of queryParams) {
                    this.parseQueryParameter(queryParam);
                }
            }
        };
        this.httpClient = httpClient;
        this.config = config;
        this.urlComponents = {
            host: this.config.baseUrl,
            version: this.config.defaultVersion,
            oDataQueryParams: {},
            otherURLQueryParams: {},
            otherURLQueryOptions: [],
        };
        this._headers = {};
        this._options = {};
        this._middlewareOptions = [];
        this.parsePath(path);
    }
    /**
     * @private
     * Adds the query parameter as comma separated values
     * @param {string} propertyName - The name of a property
     * @param {string|string[]} propertyValue - The vale of a property
     * @param {IArguments} additionalProperties - The additional properties
     * @returns Nothing
     */
    addCsvQueryParameter(propertyName, propertyValue, additionalProperties) {
        // If there are already $propertyName value there, append a ","
        this.urlComponents.oDataQueryParams[propertyName] = this.urlComponents.oDataQueryParams[propertyName] ? this.urlComponents.oDataQueryParams[propertyName] + "," : "";
        let allValues = [];
        if (additionalProperties.length > 1 && typeof propertyValue === "string") {
            allValues = Array.prototype.slice.call(additionalProperties);
        }
        else if (typeof propertyValue === "string") {
            allValues.push(propertyValue);
        }
        else {
            allValues = allValues.concat(propertyValue);
        }
        this.urlComponents.oDataQueryParams[propertyName] += allValues.join(",");
    }
    /**
     * @private
     * Builds the full url from the URLComponents to make a request
     * @returns The URL string that is qualified to make a request to graph endpoint
     */
    buildFullUrl() {
        const url = urlJoin([this.urlComponents.host, this.urlComponents.version, this.urlComponents.path]) + this.createQueryString();
        if (this.config.debugLogging) {
            console.log(url);
        }
        return url;
    }
    /**
     * @private
     * Builds the query string from the URLComponents
     * @returns The Constructed query string
     */
    createQueryString() {
        // Combining query params from oDataQueryParams and otherURLQueryParams
        const urlComponents = this.urlComponents;
        const query = [];
        if (Object.keys(urlComponents.oDataQueryParams).length !== 0) {
            for (const property in urlComponents.oDataQueryParams) {
                if (Object.prototype.hasOwnProperty.call(urlComponents.oDataQueryParams, property)) {
                    query.push(property + "=" + urlComponents.oDataQueryParams[property]);
                }
            }
        }
        if (Object.keys(urlComponents.otherURLQueryParams).length !== 0) {
            for (const property in urlComponents.otherURLQueryParams) {
                if (Object.prototype.hasOwnProperty.call(urlComponents.otherURLQueryParams, property)) {
                    query.push(property + "=" + urlComponents.otherURLQueryParams[property]);
                }
            }
        }
        if (urlComponents.otherURLQueryOptions.length !== 0) {
            for (const str of urlComponents.otherURLQueryOptions) {
                query.push(str);
            }
        }
        return query.length > 0 ? "?" + query.join("&") : "";
    }
    /**
     * @private
     * Parses the query parameters to set the urlComponents property of the GraphRequest object
     * @param {string|KeyValuePairObjectStringNumber} queryDictionaryOrString - The query parameter
     * @returns The same GraphRequest instance that is being called with
     */
    parseQueryParameter(queryDictionaryOrString) {
        if (typeof queryDictionaryOrString === "string") {
            if (queryDictionaryOrString.charAt(0) === "?") {
                queryDictionaryOrString = queryDictionaryOrString.substring(1);
            }
            if (queryDictionaryOrString.indexOf("&") !== -1) {
                const queryParams = queryDictionaryOrString.split("&");
                for (const str of queryParams) {
                    this.parseQueryParamenterString(str);
                }
            }
            else {
                this.parseQueryParamenterString(queryDictionaryOrString);
            }
        }
        else if (queryDictionaryOrString.constructor === Object) {
            for (const key in queryDictionaryOrString) {
                if (Object.prototype.hasOwnProperty.call(queryDictionaryOrString, key)) {
                    this.setURLComponentsQueryParamater(key, queryDictionaryOrString[key]);
                }
            }
        }
        return this;
    }
    /**
     * @private
     * Parses the query parameter of string type to set the urlComponents property of the GraphRequest object
     * @param {string} queryParameter - the query parameters
     * returns nothing
     */
    parseQueryParamenterString(queryParameter) {
        /* The query key-value pair must be split on the first equals sign to avoid errors in parsing nested query parameters.
                 Example-> "/me?$expand=home($select=city)" */
        if (this.isValidQueryKeyValuePair(queryParameter)) {
            const indexOfFirstEquals = queryParameter.indexOf("=");
            const paramKey = queryParameter.substring(0, indexOfFirstEquals);
            const paramValue = queryParameter.substring(indexOfFirstEquals + 1);
            this.setURLComponentsQueryParamater(paramKey, paramValue);
        }
        else {
            /* Push values which are not of key-value structure.
            Example-> Handle an invalid input->.query(test), .query($select($select=name)) and let the Graph API respond with the error in the URL*/
            this.urlComponents.otherURLQueryOptions.push(queryParameter);
        }
    }
    /**
     * @private
     * Sets values into the urlComponents property of GraphRequest object.
     * @param {string} paramKey - the query parameter key
     * @param {string} paramValue - the query paramter value
     * @returns nothing
     */
    setURLComponentsQueryParamater(paramKey, paramValue) {
        if (oDataQueryNames.indexOf(paramKey) !== -1) {
            const currentValue = this.urlComponents.oDataQueryParams[paramKey];
            const isValueAppendable = currentValue && (paramKey === "$expand" || paramKey === "$select" || paramKey === "$orderby");
            this.urlComponents.oDataQueryParams[paramKey] = isValueAppendable ? currentValue + "," + paramValue : paramValue;
        }
        else {
            this.urlComponents.otherURLQueryParams[paramKey] = paramValue;
        }
    }
    /**
     * @private
     * Check if the query parameter string has a valid key-value structure
     * @param {string} queryString - the query parameter string. Example -> "name=value"
     * #returns true if the query string has a valid key-value structure else false
     */
    isValidQueryKeyValuePair(queryString) {
        const indexofFirstEquals = queryString.indexOf("=");
        if (indexofFirstEquals === -1) {
            return false;
        }
        const indexofOpeningParanthesis = queryString.indexOf("(");
        if (indexofOpeningParanthesis !== -1 && queryString.indexOf("(") < indexofFirstEquals) {
            // Example -> .query($select($expand=true));
            return false;
        }
        return true;
    }
    /**
     * @private
     * Updates the custom headers and options for a request
     * @param {FetchOptions} options - The request options object
     * @returns Nothing
     */
    updateRequestOptions(options) {
        const optionsHeaders = Object.assign({}, options.headers);
        if (this.config.fetchOptions !== undefined) {
            const fetchOptions = Object.assign({}, this.config.fetchOptions);
            Object.assign(options, fetchOptions);
            if (typeof this.config.fetchOptions.headers !== undefined) {
                options.headers = Object.assign({}, this.config.fetchOptions.headers);
            }
        }
        Object.assign(options, this._options);
        if (options.headers !== undefined) {
            Object.assign(optionsHeaders, options.headers);
        }
        Object.assign(optionsHeaders, this._headers);
        options.headers = optionsHeaders;
    }
    /**
     * @private
     * @async
     * Adds the custom headers and options to the request and makes the HTTPClient send request call
     * @param {RequestInfo} request - The request url string or the Request object value
     * @param {FetchOptions} options - The options to make a request
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the response content
     */
    send(request, options, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let rawResponse;
            const middlewareControl = new MiddlewareControl(this._middlewareOptions);
            this.updateRequestOptions(options);
            const customHosts = (_a = this.config) === null || _a === void 0 ? void 0 : _a.customHosts;
            try {
                const context = yield this.httpClient.sendRequest({
                    request,
                    options,
                    middlewareControl,
                    customHosts,
                });
                rawResponse = context.response;
                const response = yield GraphResponseHandler.getResponse(rawResponse, this._responseType, callback);
                return response;
            }
            catch (error) {
                if (error instanceof GraphClientError) {
                    throw error;
                }
                let statusCode;
                if (rawResponse) {
                    statusCode = rawResponse.status;
                }
                const gError = yield GraphErrorHandler.getError(error, statusCode, callback, rawResponse);
                throw gError;
            }
        });
    }
    /**
     * @private
     * Checks if the content-type is present in the _headers property. If not present, defaults the content-type to application/json
     * @param none
     * @returns nothing
     */
    setHeaderContentType() {
        if (!this._headers) {
            this.header("Content-Type", "application/json");
            return;
        }
        const headerKeys = Object.keys(this._headers);
        for (const headerKey of headerKeys) {
            if (headerKey.toLowerCase() === "content-type") {
                return;
            }
        }
        // Default the content-type to application/json in case the content-type is not present in the header
        this.header("Content-Type", "application/json");
    }
    /**
     * @public
     * Sets the custom header for a request
     * @param {string} headerKey - A header key
     * @param {string} headerValue - A header value
     * @returns The same GraphRequest instance that is being called with
     */
    header(headerKey, headerValue) {
        this._headers[headerKey] = headerValue;
        return this;
    }
    /**
     * @public
     * Sets the custom headers for a request
     * @param {KeyValuePairObjectStringNumber | HeadersInit} headers - The request headers
     * @returns The same GraphRequest instance that is being called with
     */
    headers(headers) {
        for (const key in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, key)) {
                this._headers[key] = headers[key];
            }
        }
        return this;
    }
    /**
     * @public
     * Sets the option for making a request
     * @param {string} key - The key value
     * @param {any} value - The value
     * @returns The same GraphRequest instance that is being called with
     */
    option(key, value) {
        this._options[key] = value;
        return this;
    }
    /**
     * @public
     * Sets the options for making a request
     * @param {{ [key: string]: any }} options - The options key value pair
     * @returns The same GraphRequest instance that is being called with
     */
    options(options) {
        for (const key in options) {
            if (Object.prototype.hasOwnProperty.call(options, key)) {
                this._options[key] = options[key];
            }
        }
        return this;
    }
    /**
     * @public
     * Sets the middleware options for a request
     * @param {MiddlewareOptions[]} options - The array of middleware options
     * @returns The same GraphRequest instance that is being called with
     */
    middlewareOptions(options) {
        this._middlewareOptions = options;
        return this;
    }
    /**
     * @public
     * Sets the api endpoint version for a request
     * @param {string} version - The version value
     * @returns The same GraphRequest instance that is being called with
     */
    version(version) {
        this.urlComponents.version = version;
        return this;
    }
    /**
     * @public
     * Sets the api endpoint version for a request
     * @param {ResponseType} responseType - The response type value
     * @returns The same GraphRequest instance that is being called with
     */
    responseType(responseType) {
        this._responseType = responseType;
        return this;
    }
    /**
     * @public
     * To add properties for select OData Query param
     * @param {string|string[]} properties - The Properties value
     * @returns The same GraphRequest instance that is being called with, after adding the properties for $select query
     */
    /*
     * Accepts .select("displayName,birthday")
     *     and .select(["displayName", "birthday"])
     *     and .select("displayName", "birthday")
     *
     */
    select(properties) {
        this.addCsvQueryParameter("$select", properties, arguments);
        return this;
    }
    /**
     * @public
     * To add properties for expand OData Query param
     * @param {string|string[]} properties - The Properties value
     * @returns The same GraphRequest instance that is being called with, after adding the properties for $expand query
     */
    expand(properties) {
        this.addCsvQueryParameter("$expand", properties, arguments);
        return this;
    }
    /**
     * @public
     * To add properties for orderby OData Query param
     * @param {string|string[]} properties - The Properties value
     * @returns The same GraphRequest instance that is being called with, after adding the properties for $orderby query
     */
    orderby(properties) {
        this.addCsvQueryParameter("$orderby", properties, arguments);
        return this;
    }
    /**
     * @public
     * To add query string for filter OData Query param. The request URL accepts only one $filter Odata Query option and its value is set to the most recently passed filter query string.
     * @param {string} filterStr - The filter query string
     * @returns The same GraphRequest instance that is being called with, after adding the $filter query
     */
    filter(filterStr) {
        this.urlComponents.oDataQueryParams.$filter = filterStr;
        return this;
    }
    /**
     * @public
     * To add criterion for search OData Query param. The request URL accepts only one $search Odata Query option and its value is set to the most recently passed search criterion string.
     * @param {string} searchStr - The search criterion string
     * @returns The same GraphRequest instance that is being called with, after adding the $search query criteria
     */
    search(searchStr) {
        this.urlComponents.oDataQueryParams.$search = searchStr;
        return this;
    }
    /**
     * @public
     * To add number for top OData Query param. The request URL accepts only one $top Odata Query option and its value is set to the most recently passed number value.
     * @param {number} n - The number value
     * @returns The same GraphRequest instance that is being called with, after adding the number for $top query
     */
    top(n) {
        this.urlComponents.oDataQueryParams.$top = n;
        return this;
    }
    /**
     * @public
     * To add number for skip OData Query param. The request URL accepts only one $skip Odata Query option and its value is set to the most recently passed number value.
     * @param {number} n - The number value
     * @returns The same GraphRequest instance that is being called with, after adding the number for the $skip query
     */
    skip(n) {
        this.urlComponents.oDataQueryParams.$skip = n;
        return this;
    }
    /**
     * @public
     * To add token string for skipToken OData Query param. The request URL accepts only one $skipToken Odata Query option and its value is set to the most recently passed token value.
     * @param {string} token - The token value
     * @returns The same GraphRequest instance that is being called with, after adding the token string for $skipToken query option
     */
    skipToken(token) {
        this.urlComponents.oDataQueryParams.$skipToken = token;
        return this;
    }
    /**
     * @public
     * To add boolean for count OData Query param. The URL accepts only one $count Odata Query option and its value is set to the most recently passed boolean value.
     * @param {boolean} isCount - The count boolean
     * @returns The same GraphRequest instance that is being called with, after adding the boolean value for the $count query option
     */
    count(isCount = true) {
        this.urlComponents.oDataQueryParams.$count = isCount.toString();
        return this;
    }
    /**
     * @public
     * Appends query string to the urlComponent
     * @param {string|KeyValuePairObjectStringNumber} queryDictionaryOrString - The query value
     * @returns The same GraphRequest instance that is being called with, after appending the query string to the url component
     */
    /*
     * Accepts .query("displayName=xyz")
     *     and .select({ name: "value" })
     */
    query(queryDictionaryOrString) {
        return this.parseQueryParameter(queryDictionaryOrString);
    }
    /**
     * @public
     * @async
     * Makes a http request with GET method
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the get response
     */
    get(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.buildFullUrl();
            const options = {
                method: RequestMethod.GET,
            };
            const response = yield this.send(url, options, callback);
            return response;
        });
    }
    /**
     * @public
     * @async
     * Makes a http request with POST method
     * @param {any} content - The content that needs to be sent with the request
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the post response
     */
    post(content, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.buildFullUrl();
            const options = {
                method: RequestMethod.POST,
                body: serializeContent(content),
            };
            const className = content && content.constructor && content.constructor.name;
            if (className === "FormData") {
                // Content-Type headers should not be specified in case the of FormData type content
                options.headers = {};
            }
            else {
                this.setHeaderContentType();
                options.headers = this._headers;
            }
            return yield this.send(url, options, callback);
        });
    }
    /**
     * @public
     * @async
     * Alias for Post request call
     * @param {any} content - The content that needs to be sent with the request
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the post response
     */
    create(content, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post(content, callback);
        });
    }
    /**
     * @public
     * @async
     * Makes http request with PUT method
     * @param {any} content - The content that needs to be sent with the request
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the put response
     */
    put(content, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.buildFullUrl();
            this.setHeaderContentType();
            const options = {
                method: RequestMethod.PUT,
                body: serializeContent(content),
            };
            return yield this.send(url, options, callback);
        });
    }
    /**
     * @public
     * @async
     * Makes http request with PATCH method
     * @param {any} content - The content that needs to be sent with the request
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the patch response
     */
    patch(content, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.buildFullUrl();
            this.setHeaderContentType();
            const options = {
                method: RequestMethod.PATCH,
                body: serializeContent(content),
            };
            return yield this.send(url, options, callback);
        });
    }
    /**
     * @public
     * @async
     * Alias for PATCH request
     * @param {any} content - The content that needs to be sent with the request
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the patch response
     */
    update(content, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.patch(content, callback);
        });
    }
    /**
     * @public
     * @async
     * Makes http request with DELETE method
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the delete response
     */
    delete(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.buildFullUrl();
            const options = {
                method: RequestMethod.DELETE,
            };
            return yield this.send(url, options, callback);
        });
    }
    /**
     * @public
     * @async
     * Alias for delete request call
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the delete response
     */
    del(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.delete(callback);
        });
    }
    /**
     * @public
     * @async
     * Makes a http request with GET method to read response as a stream.
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the getStream response
     */
    getStream(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.buildFullUrl();
            const options = {
                method: RequestMethod.GET,
            };
            this.responseType(ResponseType.STREAM);
            return yield this.send(url, options, callback);
        });
    }
    /**
     * @public
     * @async
     * Makes a http request with GET method to read response as a stream.
     * @param {any} stream - The stream instance
     * @param {GraphRequestCallback} [callback] - The callback function to be called in response with async call
     * @returns A promise that resolves to the putStream response
     */
    putStream(stream, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.buildFullUrl();
            const options = {
                method: RequestMethod.PUT,
                headers: {
                    "Content-Type": "application/octet-stream",
                },
                body: stream,
            };
            return yield this.send(url, options, callback);
        });
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @class
 * Class representing HTTPClient
 */
class HTTPClient {
    /**
     * @public
     * @constructor
     * Creates an instance of a HTTPClient
     * @param {...Middleware} middleware - The first middleware of the middleware chain or a sequence of all the Middleware handlers
     */
    constructor(...middleware) {
        if (!middleware || !middleware.length) {
            const error = new Error();
            error.name = "InvalidMiddlewareChain";
            error.message = "Please provide a default middleware chain or custom middleware chain";
            throw error;
        }
        this.setMiddleware(...middleware);
    }
    /**
     * @private
     * Processes the middleware parameter passed to set this.middleware property
     * The calling function should validate if middleware is not undefined or not empty.
     * @param {...Middleware} middleware - The middleware passed
     * @returns Nothing
     */
    setMiddleware(...middleware) {
        if (middleware.length > 1) {
            this.parseMiddleWareArray(middleware);
        }
        else {
            this.middleware = middleware[0];
        }
    }
    /**
     * @private
     * Processes the middleware array to construct the chain
     * and sets this.middleware property to the first middleware handler of the array
     * The calling function should validate if middleware is not undefined or not empty
     * @param {Middleware[]} middlewareArray - The array of middleware handlers
     * @returns Nothing
     */
    parseMiddleWareArray(middlewareArray) {
        middlewareArray.forEach((element, index) => {
            if (index < middlewareArray.length - 1) {
                element.setNext(middlewareArray[index + 1]);
            }
        });
        this.middleware = middlewareArray[0];
    }
    /**
     * @public
     * @async
     * To send the request through the middleware chain
     * @param {Context} context - The context of a request
     * @returns A promise that resolves to the Context
     */
    sendRequest(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof context.request === "string" && context.options === undefined) {
                const error = new Error();
                error.name = "InvalidRequestOptions";
                error.message = "Unable to execute the middleware, Please provide valid options for a request";
                throw error;
            }
            yield this.middleware.execute(context);
            return context;
        });
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @module HTTPClientFactory
 */
/**
 * @private
 * To check whether the environment is node or not
 * @returns A boolean representing the environment is node or not
 */
const isNodeEnvironment = () => {
    return typeof process === "object" && typeof require === "function";
};
/**
 * @class
 * Class representing HTTPClientFactory
 */
class HTTPClientFactory {
    /**
     * @public
     * @static
     * Creates HTTPClient with default middleware chain
     * @param {AuthenticationProvider} authProvider - The authentication provider instance
     * @returns A HTTPClient instance
     *
     * NOTE: These are the things that we need to remember while doing modifications in the below default pipeline.
     * 		* HTTPMessageHandler should be the last one in the middleware pipeline, because this makes the actual network call of the request
     * 		* TelemetryHandler should be the one prior to the last middleware in the chain, because this is the one which actually collects and appends the usage flag and placing this handler 	*		  before making the actual network call ensures that the usage of all features are recorded in the flag.
     * 		* The best place for AuthenticationHandler is in the starting of the pipeline, because every other handler might have to work for multiple times for a request but the auth token for
     * 		  them will remain same. For example, Retry and Redirect handlers might be working multiple times for a request based on the response but their auth token would remain same.
     */
    static createWithAuthenticationProvider(authProvider) {
        const authenticationHandler = new AuthenticationHandler(authProvider);
        const retryHandler = new RetryHandler(new RetryHandlerOptions());
        const telemetryHandler = new TelemetryHandler();
        const httpMessageHandler = new HTTPMessageHandler();
        authenticationHandler.setNext(retryHandler);
        if (isNodeEnvironment()) {
            const redirectHandler = new RedirectHandler(new RedirectHandlerOptions());
            retryHandler.setNext(redirectHandler);
            redirectHandler.setNext(telemetryHandler);
        }
        else {
            retryHandler.setNext(telemetryHandler);
        }
        telemetryHandler.setNext(httpMessageHandler);
        return HTTPClientFactory.createWithMiddleware(authenticationHandler);
    }
    /**
     * @public
     * @static
     * Creates a middleware chain with the given one
     * @property {...Middleware} middleware - The first middleware of the middleware chain or a sequence of all the Middleware handlers
     * @returns A HTTPClient instance
     */
    static createWithMiddleware(...middleware) {
        // Middleware should not empty or undefined. This is check is present in the HTTPClient constructor.
        return new HTTPClient(...middleware);
    }
}

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @constant
 * @function
 * Validates availability of Promise and fetch in global context
 * @returns The true in case the Promise and fetch available, otherwise throws error
 */
const validatePolyFilling = () => {
    if (typeof Promise === "undefined" && typeof fetch === "undefined") {
        const error = new Error("Library cannot function without Promise and fetch. So, please provide polyfill for them.");
        error.name = "PolyFillNotAvailable";
        throw error;
    }
    else if (typeof Promise === "undefined") {
        const error = new Error("Library cannot function without Promise. So, please provide polyfill for it.");
        error.name = "PolyFillNotAvailable";
        throw error;
    }
    else if (typeof fetch === "undefined") {
        const error = new Error("Library cannot function without fetch. So, please provide polyfill for it.");
        error.name = "PolyFillNotAvailable";
        throw error;
    }
    return true;
};

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * @module Client
 */
class Client {
    /**
     * @public
     * @static
     * To create a client instance with options and initializes the default middleware chain
     * @param {Options} options - The options for client instance
     * @returns The Client instance
     */
    static init(options) {
        const clientOptions = {};
        for (const i in options) {
            if (Object.prototype.hasOwnProperty.call(options, i)) {
                clientOptions[i] = i === "authProvider" ? new CustomAuthenticationProvider(options[i]) : options[i];
            }
        }
        return Client.initWithMiddleware(clientOptions);
    }
    /**
     * @public
     * @static
     * To create a client instance with the Client Options
     * @param {ClientOptions} clientOptions - The options object for initializing the client
     * @returns The Client instance
     */
    static initWithMiddleware(clientOptions) {
        return new Client(clientOptions);
    }
    /**
     * @private
     * @constructor
     * Creates an instance of Client
     * @param {ClientOptions} clientOptions - The options to instantiate the client object
     */
    constructor(clientOptions) {
        /**
         * @private
         * A member which stores the Client instance options
         */
        this.config = {
            baseUrl: GRAPH_BASE_URL,
            debugLogging: false,
            defaultVersion: GRAPH_API_VERSION,
        };
        validatePolyFilling();
        for (const key in clientOptions) {
            if (Object.prototype.hasOwnProperty.call(clientOptions, key)) {
                this.config[key] = clientOptions[key];
            }
        }
        let httpClient;
        if (clientOptions.authProvider !== undefined && clientOptions.middleware !== undefined) {
            const error = new Error();
            error.name = "AmbiguityInInitialization";
            error.message = "Unable to Create Client, Please provide either authentication provider for default middleware chain or custom middleware chain not both";
            throw error;
        }
        else if (clientOptions.authProvider !== undefined) {
            httpClient = HTTPClientFactory.createWithAuthenticationProvider(clientOptions.authProvider);
        }
        else if (clientOptions.middleware !== undefined) {
            httpClient = new HTTPClient(...[].concat(clientOptions.middleware));
        }
        else {
            const error = new Error();
            error.name = "InvalidMiddlewareChain";
            error.message = "Unable to Create Client, Please provide either authentication provider for default middleware chain or custom middleware chain";
            throw error;
        }
        this.httpClient = httpClient;
    }
    /**
     * @public
     * Entry point to make requests
     * @param {string} path - The path string value
     * @returns The graph request instance
     */
    api(path) {
        return new GraphRequest(this.httpClient, this.config, path);
    }
}

export { Client };
