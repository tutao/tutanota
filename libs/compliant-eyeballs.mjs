import 'node:http';
import * as https from 'node:https';
import { isIP, connect, Socket } from 'node:net';
import { getSystemErrorMap } from 'node:util';
import { checkServerIdentity, connect as connect$1 } from 'node:tls';
import { performance } from 'node:perf_hooks';
import { lookup } from 'node:dns';

const defaults = Object.freeze({
    resolutionDelayMs: 50, attemptDelayMs: 250, minAttemptDelayMs: 100,
    maxAttemptDelayMs: 2000, firstAddressFamilyCount: 1, connectTimeoutMs: 20000,
});
const MAX_TIMER_MS = 2 ** 31 - 1;
const proxyKeys = ['proxy', 'proxyEnv', 'proxyAgent', 'proxyUrl', 'proxyUri', 'httpProxy', 'httpsProxy', 'socksProxy', 'pac', 'pacUrl'];
const externalTransportKeys = ['httpSocket', 'socket', 'socketPath', 'path', 'createConnection'];
function proxyOption(options) {
    const values = options;
    return proxyKeys.find(key => values[key] !== undefined && values[key] !== null);
}
function directOnlyError(key) {
    return new TypeError(`${key} is a proxy setting; use the owning proxy agent or dispatcher instead of a direct connection`);
}
function requireDirect(options) {
    const key = proxyOption(options);
    if (key)
        throw directOnlyError(key);
}
function requireOwnedTransport(options) {
    const values = options;
    const key = externalTransportKeys.find(name => values[name] !== undefined && values[name] !== null);
    if (key)
        throw new TypeError(`${key} requires its owning transport integration; direct connections do not use it`);
}
function timing(options) {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
        if (options[key] !== undefined)
            result[key] = options[key];
        if (!Number.isFinite(result[key]))
            throw new RangeError(`${key} must be finite`);
    }
    if (result.resolutionDelayMs < 0)
        throw new RangeError('resolutionDelayMs must be nonnegative');
    if (result.minAttemptDelayMs < 10)
        throw new RangeError('minAttemptDelayMs must be at least 10');
    if (result.maxAttemptDelayMs < result.minAttemptDelayMs)
        throw new RangeError('maxAttemptDelayMs must be at least minAttemptDelayMs');
    if (result.attemptDelayMs < result.minAttemptDelayMs || result.attemptDelayMs > result.maxAttemptDelayMs)
        throw new RangeError('attemptDelayMs must lie between minAttemptDelayMs and maxAttemptDelayMs');
    if (!Number.isSafeInteger(result.firstAddressFamilyCount) || result.firstAddressFamilyCount < 1)
        throw new RangeError('firstAddressFamilyCount must be a positive integer');
    if (result.connectTimeoutMs <= 0 || result.connectTimeoutMs > MAX_TIMER_MS)
        throw new RangeError('connectTimeoutMs must be positive and at most 2147483647');
    return result;
}
function destination(options) {
    requireDirect(options);
    requireOwnedTransport(options);
    for (const key of ['preferredFamily', 'defaultFamily']) {
        if (key in options)
            throw new TypeError(`${key} is not supported`);
    }
    const hostname = options.hostname?.replace(/^\[([^\]]+)\]$/, '$1');
    if (!hostname || typeof hostname !== 'string')
        throw new TypeError('hostname is required');
    if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535)
        throw new RangeError('port must be between 1 and 65535');
    if (options.family !== undefined && ![0, 4, 6].includes(options.family))
        throw new RangeError('family must be 0, 4 or 6');
    const localFamily = options.localAddress === undefined ? 0 : isIP(options.localAddress);
    if (options.localAddress !== undefined && !localFamily)
        throw new TypeError('localAddress must be an IP literal');
    if (options.family && localFamily && options.family !== localFamily)
        throw new TypeError('family conflicts with localAddress');
    if (options.localPort !== undefined && (!Number.isInteger(options.localPort) || options.localPort < 0 || options.localPort > 65535))
        throw new RangeError('invalid localPort');
    if (options.socketTimeoutMs !== undefined && (!Number.isFinite(options.socketTimeoutMs) || options.socketTimeoutMs < 0 || options.socketTimeoutMs > MAX_TIMER_MS))
        throw new RangeError('invalid socketTimeoutMs');
    if (options.resolver && options.lookup)
        throw new TypeError('provide resolver or lookup, not both');
    return { hostname, family: (options.family || localFamily) };
}

function asError(value) { return value instanceof Error ? value : new Error(String(value)); }
/** Custom errors (including DOMException) may have non-Node numeric codes. */
function errorCode(error) {
    const code = error.code;
    return typeof code === 'string' ? code : undefined;
}
function abortError(reason) {
    return Object.assign(new Error('The operation was aborted', { cause: reason }), { name: 'AbortError', code: 'ABORT_ERR' });
}
class AttemptError extends Error {
    address;
    family;
    port;
    code;
    constructor(candidate, port, cause) {
        super(`Connection attempt to ${candidate.address}:${port} failed`, { cause });
        this.name = 'AttemptError';
        this.address = candidate.address;
        this.family = candidate.family;
        this.port = port;
        this.code = errorCode(cause);
    }
}
class ConnectionError extends AggregateError {
    code;
    constructor(errors, code, deadlineExceeded = code === 'ETIMEDOUT') {
        const codes = [...new Set(errors.map(errorCode).filter((value) => !!value))];
        const detail = codes.length > 1 ? ` (${codes.join(', ')})` : '';
        super(errors, `${deadlineExceeded ? 'Connection deadline exceeded' : 'No connection could be established'}${detail}`);
        this.code = code;
        this.name = 'ConnectionError';
    }
}
/** A single failed candidate has the same error shape as a native connection. */
function exhaustedError(errors) {
    const attempts = errors.filter((error) => error instanceof AttemptError);
    if (attempts.length === 1)
        return attempts[0].cause;
    const relevant = attempts.length ? attempts : errors;
    const codes = relevant.map(errorCode);
    const commonCode = codes.length && codes[0] && codes.every(code => code === codes[0]) ? codes[0] : undefined;
    if (!attempts.length && (errors.length === 1 || commonCode))
        return errors[0];
    const code = attempts.length
        ? commonCode ?? 'ECONNFAILED'
        : commonCode ?? (codes.includes('EAI_AGAIN') ? 'EAI_AGAIN' : errors.length ? 'ECONNFAILED' : 'ENOTFOUND');
    return new ConnectionError(errors, code, false);
}

/** OS-backed lookups preserve hosts files and system name-service policy. */
function createSystemResolver(lookup$1 = lookup, hints) {
    return ({ hostname, families, signal }, update) => {
        let subscribed = true;
        for (const family of families) {
            if (signal.aborted)
                break;
            try {
                lookup$1(hostname, { family, all: true, verbatim: true, hints }, (error, addresses) => {
                    if (!subscribed || signal.aborted)
                        return;
                    update({ family, addresses: error ? [] : typeof addresses === 'string' ? [addresses] : addresses.filter(a => a.family === family).map(a => a.address), complete: true, error: error ?? undefined });
                });
            }
            catch (error) {
                if (!signal.aborted && subscribed)
                    update({ family, addresses: [], complete: true, error: asError(error) });
            }
        }
        return () => { subscribed = false; };
    };
}

const clock = { now: () => performance.now(), set: (fn, ms) => setTimeout(fn, Math.min(MAX_TIMER_MS, Math.max(1, Math.ceil(ms)))), clear: id => clearTimeout(id) };
function key(candidate) {
    let address = candidate.address;
    if (candidate.family === 6 && !address.includes('%'))
        address = new URL(`http://[${address}]/`).hostname;
    return `${candidate.family}:${address}`;
}
function race(options, create, ready, time = clock) {
    return new Promise((resolve, reject) => {
        const config = timing(options);
        const { hostname, family } = destination(options);
        const started = time.now();
        const deadline = started + config.connectTimeoutMs;
        const controller = new AbortController();
        const families = family ? [family] : [6, 4];
        const complete = new Set();
        const addresses = new Map([[6, []], [4, []]]);
        const attempted = new Set();
        const active = new Map();
        const errors = [];
        let done = false;
        let lastStart = -Infinity;
        let firstFamily;
        let lastFamily;
        let initialCount = 0;
        let accelerated = false;
        let resolutionUntil;
        let timer;
        let unsubscribe;
        const emit = (event) => {
            // Diagnostic observers cannot change connection ownership by throwing.
            try {
                options.onDiagnostic?.(Object.freeze({ ...event, candidate: event.candidate && Object.freeze({ ...event.candidate }), elapsedMs: time.now() - started }));
            }
            catch { /* observer only */ }
        };
        const clearTimer = () => { if (timer !== undefined)
            time.clear(timer); timer = undefined; };
        const discard = (socket) => {
            // Errors already queued by a failed/cancelled socket may arrive before
            // close. Keep a guard for that interval, then release it.
            const ignore = () => { };
            socket.on('error', ignore);
            socket.once('close', () => socket.removeListener('error', ignore));
            socket.destroy();
        };
        const dispose = (winner) => {
            clearTimer();
            options.signal?.removeEventListener('abort', cancel);
            controller.abort();
            try {
                unsubscribe?.();
            }
            catch { /* cleanup must not prevent settlement */ }
            for (const [socket, detach] of active) {
                detach();
                if (socket !== winner)
                    discard(socket);
            }
            active.clear();
        };
        const fail = (error, cancelled = false) => {
            if (done)
                return;
            done = true;
            dispose();
            if (cancelled)
                emit({ type: 'cancellation', code: errorCode(error) });
            reject(error);
        };
        const cancel = () => fail(abortError(options.signal?.reason), true);
        const expired = () => {
            if (time.now() < deadline)
                return false;
            fail(new ConnectionError(errors, 'ETIMEDOUT', true), true);
            return true;
        };
        const pending = (f) => addresses.get(f).filter(c => !attempted.has(key(c)));
        const next = () => {
            const six = pending(6), four = pending(4);
            if (!firstFamily) {
                if (six.length)
                    return six[0];
                if (!four.length)
                    return;
                if (families.includes(6) && !complete.has(6)) {
                    resolutionUntil ??= time.now() + config.resolutionDelayMs;
                    if (time.now() < resolutionUntil)
                        return;
                }
                return four[0];
            }
            const target = initialCount < config.firstAddressFamilyCount ? firstFamily : lastFamily === 6 ? 4 : 6;
            return (target === 6 ? six[0] ?? four[0] : four[0] ?? six[0]);
        };
        const launch = (candidate) => {
            lastStart = time.now();
            accelerated = false;
            attempted.add(key(candidate));
            firstFamily ??= candidate.family;
            lastFamily = candidate.family;
            initialCount++;
            emit({ type: 'attempt', candidate });
            if (done || expired())
                return;
            let socket;
            try {
                socket = create(candidate);
            }
            catch (cause) {
                errors.push(new AttemptError(candidate, options.port, asError(cause)));
                emit({ type: 'failure', candidate, code: errorCode(asError(cause)) });
                accelerated = true;
                return;
            }
            // A user hook may have aborted synchronously during socket creation.
            if (done) {
                discard(socket);
                return;
            }
            let finished = false;
            const detach = () => {
                socket.removeListener(ready, success);
                socket.removeListener('error', failure);
                socket.removeListener('close', closed);
                socket.removeListener('timeout', timeout);
            };
            const failure = (cause, alreadyClosed = false) => {
                if (finished || done)
                    return;
                finished = true;
                detach();
                active.delete(socket);
                if (alreadyClosed)
                    socket.destroy();
                else
                    discard(socket);
                errors.push(new AttemptError(candidate, options.port, cause));
                emit({ type: 'failure', candidate, code: errorCode(cause) });
                accelerated = true;
                pump();
            };
            const closed = () => failure(Object.assign(new Error('Closed before readiness'), { code: 'ECONNRESET' }), true);
            const timeout = () => options.onTimeout?.(socket);
            const success = () => {
                if (finished || done) {
                    socket.destroy();
                    return;
                }
                if (expired())
                    return;
                finished = true;
                done = true;
                dispose(socket);
                emit({ type: 'selection', candidate });
                // Selection observers may abort at the ownership boundary.
                if (options.signal?.aborted) {
                    discard(socket);
                    reject(abortError(options.signal.reason));
                }
                else
                    resolve(socket);
            };
            active.set(socket, detach);
            socket.once(ready, success).once('error', failure).once('close', closed).on('timeout', timeout);
            if (options.socketTimeoutMs)
                socket.setTimeout(options.socketTimeoutMs);
            if (socket.destroyed)
                closed();
        };
        function pump() {
            if (done || expired())
                return;
            clearTimer();
            const candidate = next();
            const due = lastStart + (accelerated ? config.minAttemptDelayMs : config.attemptDelayMs);
            if (candidate && time.now() >= due) {
                launch(candidate);
                if (done)
                    return;
            }
            if (families.every(f => complete.has(f)) && !pending(4).length && !pending(6).length && !active.size) {
                fail(exhaustedError(errors));
                return;
            }
            let wake = deadline;
            if (next())
                wake = Math.min(wake, lastStart + (accelerated ? config.minAttemptDelayMs : config.attemptDelayMs));
            else if (!firstFamily && resolutionUntil !== undefined && resolutionUntil > time.now())
                wake = Math.min(wake, resolutionUntil);
            timer = time.set(pump, Math.max(0, wake - time.now()));
        }
        const update = (value) => {
            if (done || expired() || !families.includes(value.family) || complete.has(value.family))
                return;
            const unique = new Map();
            for (const address of value.addresses) {
                if (isIP(address) !== value.family)
                    continue;
                const candidate = { address, family: value.family };
                if (!unique.has(key(candidate)))
                    unique.set(key(candidate), candidate);
            }
            addresses.set(value.family, [...unique.values()]);
            if (value.error)
                errors.push(value.error);
            if (value.complete)
                complete.add(value.family);
            emit({ type: 'resolution', family: value.family, count: unique.size, code: value.error && errorCode(value.error) });
            pump();
        };
        if (options.signal?.aborted) {
            cancel();
            return;
        }
        options.signal?.addEventListener('abort', cancel, { once: true });
        pump();
        const literal = isIP(hostname);
        if (literal) {
            for (const f of families)
                update({ family: f, addresses: f === literal ? [hostname] : [], complete: true });
        }
        else {
            try {
                unsubscribe = (options.resolver ?? createSystemResolver(options.lookup, options.hints))({ hostname, families, signal: controller.signal }, update);
                if (done) {
                    try {
                        unsubscribe?.();
                    }
                    catch { /* cleanup */ }
                }
            }
            catch (error) {
                fail(asError(error));
            }
        }
    });
}

function tcpOptions(options, candidate) {
    if (options.blockList?.check(candidate.address, candidate.family === 6 ? 'ipv6' : 'ipv4')) {
        throw Object.assign(new Error(`IP(${candidate.address}) is blocked by net.BlockList`), { code: 'ERR_IP_BLOCKED' });
    }
    return {
        host: candidate.address, port: options.port, family: candidate.family, autoSelectFamily: false,
        localAddress: options.localAddress, localPort: options.localPort, blockList: options.blockList,
        noDelay: options.noDelay ?? true, keepAlive: options.keepAlive, keepAliveInitialDelay: options.keepAliveInitialDelay,
    };
}
function tcp(options, observe) {
    return race(options, candidate => { const socket = connect(tcpOptions(options, candidate)); observe?.(socket); return socket; }, 'connect');
}
function secure(options, observe) {
    try {
        requireDirect(options.tls ?? {});
        requireOwnedTransport(options.tls ?? {});
    }
    catch (error) {
        return Promise.reject(error);
    }
    return race(options, candidate => {
        const { hostname } = destination(options);
        const tls = options.tls ?? {};
        // Adapters may pass an object with extra HTTP fields. Never let a path,
        // supplied socket, lookup or signal bypass the race's transport ownership.
        const safe = { ...tls };
        for (const name of ['path', 'socket', 'socketPath', 'lookup', 'signal', 'timeout'])
            delete safe[name];
        const supplied = tls.servername ?? hostname;
        const servername = supplied && !isIP(supplied) ? supplied : '';
        const verify = tls.checkServerIdentity ?? checkServerIdentity;
        const socket = connect$1({
            ...safe, ...tcpOptions(options, candidate), servername,
            // Node would otherwise verify the raced address or SNI name. The destination
            // remains authoritative even when SNI is disabled or explicitly overridden.
            checkServerIdentity: (_name, certificate) => verify(hostname, certificate),
        });
        observe?.(socket);
        return socket;
    }, 'secureConnect');
}

const entryKey = Symbol('compliant-eyeballs request');
function failRequest(req, error) {
    req.onSocket(undefined, error);
}
function nativeHttpsError(error) {
    // Native ClientRequest writes before TLS readiness and reports OpenSSL
    // protocol failures as write EPROTO. This agent waits for secureConnect.
    const code = errorCode(error);
    if (!code?.startsWith('ERR_SSL_') || error.library !== 'SSL routines')
        return error;
    // Node reports libuv errno values, which differ from OS errno on Windows.
    const errno = [...getSystemErrorMap()].find(([, [name]]) => name === 'EPROTO')[0];
    return Object.assign(new Error(`write EPROTO ${error.message}`, { cause: error }), {
        code: 'EPROTO', syscall: 'write', errno,
    });
}
function requireDirectOptions(options) {
    requireDirect(options);
    if ('createConnection' in options)
        throw new TypeError('Direct agents do not own createConnection; retain the existing connection integration');
}
function install(agent, connection, tls) {
    connection = { ...connection, tls: { ...connection.tls } };
    timing(connection);
    const originalAdd = agent.addRequest.bind(agent);
    const originalCreate = agent.createSocket.bind(agent);
    const originalDestroy = agent.destroy.bind(agent);
    const pending = new Map();
    const connecting = new Set();
    const sessions = new Map();
    const policies = new WeakMap();
    let policyId = 0;
    const policyKey = (value) => {
        if (!value)
            return 0;
        if (!policies.has(value))
            policies.set(value, ++policyId);
        return policies.get(value);
    };
    let destroyed = false;
    const removeQueued = (req) => {
        for (const [name, queue] of Object.entries(agent.requests)) {
            const index = queue.indexOf(req);
            if (index >= 0)
                queue.splice(index, 1);
            if (!queue.length)
                delete agent.requests[name];
        }
    };
    agent.addRequest = (req, options) => {
        // A pre-aborted request signal destroys ClientRequest before addRequest.
        // Report its saved error without waiting for DNS or the race deadline.
        if (req.destroyed) {
            process.nextTick(() => failRequest(req));
            return;
        }
        if (destroyed) {
            process.nextTick(() => failRequest(req, abortError('Agent destroyed')));
            return;
        }
        // ws supplies a request-level createConnection even when an Agent owns the
        // socket. It is not evidence that this direct Agent owns a proxy route.
        const proxyKey = proxyOption(options);
        if (proxyKey) {
            process.nextTick(() => failRequest(req, directOnlyError(proxyKey)));
            return;
        }
        const controller = new AbortController();
        const destroyDescriptor = Object.getOwnPropertyDescriptor(req, 'destroy');
        const timeoutDescriptor = Object.getOwnPropertyDescriptor(req, 'setTimeout');
        const requestDestroy = req.destroy;
        const requestTimeout = req.setTimeout;
        const restore = (name, descriptor) => {
            if (descriptor)
                Object.defineProperty(req, name, descriptor);
            else
                delete req[name];
        };
        const entry = {
            req, controller, active: false, handed: false, sockets: new Set(), closeHooks: new Map(),
            timeout: options.timeout ?? agent.options.timeout,
            cleanup() {
                pending.delete(req);
                if (req.destroy === wrappedDestroy)
                    restore('destroy', destroyDescriptor);
                if (req.setTimeout === wrappedTimeout)
                    restore('setTimeout', timeoutDescriptor);
                req.removeListener('socket', onSocket);
                req.removeListener('close', onClose);
                connection.signal?.removeEventListener('abort', onAbort);
                for (const [socket, listener] of entry.closeHooks)
                    socket.removeListener('close', listener);
                entry.closeHooks.clear();
                entry.sockets.clear();
            },
        };
        function wrappedDestroy(error) {
            const result = requestDestroy.call(this, error);
            if (this !== req)
                return result;
            controller.abort(error);
            for (const socket of entry.sockets)
                socket.destroy();
            removeQueued(req);
            if (!entry.active && !entry.handed) {
                entry.handed = true;
                failRequest(req);
            }
            return result;
        }
        function wrappedTimeout(ms, callback) {
            const result = requestTimeout.call(this, ms, callback);
            if (this === req) {
                entry.timeout = ms;
                for (const socket of entry.sockets)
                    socket.setTimeout(ms);
            }
            return result;
        }
        const onSocket = () => { entry.handed = true; entry.cleanup(); };
        const onClose = () => { controller.abort(); entry.cleanup(); };
        const onAbort = () => req.destroy(abortError(connection.signal?.reason));
        pending.set(req, entry);
        req.destroy = wrappedDestroy;
        req.setTimeout = wrappedTimeout;
        req.once('socket', onSocket).once('close', onClose);
        connection.signal?.addEventListener('abort', onAbort, { once: true });
        if (connection.signal?.aborted) {
            onAbort();
            return;
        }
        try {
            originalAdd(req, { ...options, [entryKey]: entry });
        }
        catch (error) {
            entry.cleanup();
            throw error;
        }
    };
    agent.createSocket = (req, options, callback) => {
        const entry = pending.get(req);
        if (entry)
            entry.active = true;
        originalCreate(req, { ...options, [entryKey]: entry }, callback);
    };
    agent.createConnection = (raw, callback) => {
        const options = raw;
        const finish = callback;
        if (!finish)
            throw new TypeError('This agent requires the asynchronous createConnection callback');
        if (destroyed) {
            process.nextTick(() => finish(abortError('Agent destroyed')));
            return undefined;
        }
        const entry = options[entryKey];
        const proxyKey = proxyOption(options);
        if (proxyKey) {
            process.nextTick(() => finish(directOnlyError(proxyKey)));
            return undefined;
        }
        if (options.socketPath || 'socket' in options || 'httpSocket' in options || options.path && !options.port) {
            process.nextTick(() => finish(new TypeError('Direct agents do not implement Unix sockets or proxy tunnels; keep the owning agent')));
            return undefined;
        }
        const hostname = options.hostname ?? options.host ?? 'localhost';
        const name = options._agentKey ?? agent.getName(options);
        const controller = entry?.controller ?? new AbortController();
        const cancel = () => controller.abort(connection.signal?.reason);
        connection.signal?.addEventListener('abort', cancel, { once: true });
        if (connection.signal?.aborted)
            cancel();
        connecting.add(controller);
        // Native Agent only accounts for a socket after asynchronous completion.
        // Reserve one pool slot for the whole race so maxSockets/maxTotalSockets
        // also constrain DNS and handshakes. No candidate reaches HTTP prematurely.
        const reservation = new Socket();
        (agent.sockets[name] ??= []).push(reservation);
        agent.totalSocketCount++;
        const release = () => {
            connecting.delete(controller);
            connection.signal?.removeEventListener('abort', cancel);
            // This reservation remains in the named bucket until release; normal
            // Agent destruction destroys sockets but does not remove the bucket.
            const list = agent.sockets[name];
            const index = list.indexOf(reservation);
            if (index >= 0)
                list.splice(index, 1);
            if (!list.length)
                delete agent.sockets[name];
            agent.totalSocketCount--;
            reservation.destroy();
        };
        const settings = {
            ...connection, hostname, port: Number(options.port ?? (443 )),
            family: (options.family ?? connection.family),
            localAddress: options.localAddress ?? connection.localAddress,
            localPort: options.localPort ?? connection.localPort,
            lookup: options.lookup ?? connection.lookup,
            hints: options.hints ?? connection.hints,
            signal: controller.signal,
            socketTimeoutMs: entry?.timeout ?? options.timeout ?? connection.socketTimeoutMs,
            onTimeout: socket => { if (entry && !entry.controller.signal.aborted)
                entry.req.emit('timeout'); connection.onTimeout?.(socket); },
        };
        const tlsOptions = { ...connection.tls, ...options };
        // HTTPS request paths and ws's request-level createConnection are not
        // transport instructions for this Agent's TLS socket.
        delete tlsOptions.path;
        delete tlsOptions.createConnection;
        const sessionKey = JSON.stringify([name, hostname, policyKey(tlsOptions.checkServerIdentity), policyKey(tlsOptions.secureContext)]);
        const sessionLimit = agent.options.maxCachedSessions ?? 100;
        let winner;
        const tickets = new WeakMap();
        const cache = (session) => {
            if (destroyed || !winner?.authorized || sessionLimit <= 0)
                return;
            sessions.delete(sessionKey);
            sessions.set(sessionKey, session);
            while (sessions.size > sessionLimit)
                sessions.delete(sessions.keys().next().value);
        };
        const observe = (socket) => {
            entry?.sockets.add(socket);
            if (entry) {
                const closed = () => { entry.sockets.delete(socket); entry.closeHooks.delete(socket); };
                entry.closeHooks.set(socket, closed);
                socket.once('close', closed);
            }
            socket.on('session', session => { if (winner === socket)
                    cache(session);
                else if (!winner)
                    tickets.set(socket, session); });
        };
        const promise = secure({ ...settings, tls: { ...tlsOptions, session: tlsOptions.session ?? sessions.get(sessionKey) } }, observe) ;
        const failed = (error) => {
            if (entry) {
                entry.handed = true;
                removeQueued(entry.req);
            }
            // ClientRequest already owns the destroy error (including native signal
            // wrapping), and distinguishes destroy() from abort(). Let onSocket use it.
            if (entry?.req.destroyed)
                failRequest(entry.req);
            else
                finish(entry?.req.writableLength ? nativeHttpsError(error) : error);
        };
        promise.then(socket => {
            release();
            if (controller.signal.aborted || destroyed) {
                socket.destroy();
                failed(abortError(controller.signal.reason));
                agent.removeSocket(reservation, options);
            }
            else {
                {
                    winner = socket;
                    const ticket = tickets.get(socket);
                    if (ticket)
                        cache(ticket);
                }
                if (entry)
                    entry.handed = true;
                finish(null, socket);
            }
        }, error => {
            release();
            failed(error);
            agent.removeSocket(reservation, options);
        });
        return undefined;
    };
    agent.destroy = () => {
        destroyed = true;
        sessions.clear();
        for (const entry of [...pending.values()])
            entry.req.destroy(abortError('Agent destroyed'));
        for (const controller of connecting)
            controller.abort('Agent destroyed');
        originalDestroy();
    };
}
class HappyEyeballsHttpsAgent extends https.Agent {
    constructor({ connection = {}, ...options } = {}) {
        requireDirectOptions(options);
        requireDirect(connection);
        requireDirect(connection.tls ?? {});
        requireOwnedTransport(connection);
        requireOwnedTransport(connection.tls ?? {});
        super(options);
        install(this, connection);
    }
}

function createUndiciConnector(config = {}) {
    config = { ...config };
    requireDirect(config);
    requireDirect(config.tls ?? {});
    requireOwnedTransport(config);
    requireOwnedTransport(config.tls ?? {});
    timing(config);
    const capacity = config.maxCachedSessions ?? 100;
    if (!Number.isSafeInteger(capacity) || capacity < 0)
        throw new RangeError('maxCachedSessions must be a nonnegative integer');
    // Copy option properties; caller-owned buffers and SecureContext objects must
    // stay unchanged. Separate TLS policies require separate connectors and caches.
    const tls = { ...config.tls };
    const sessions = new Map();
    const pending = new Set();
    let destroyed = false;
    const connector = (options, callback) => {
        if (destroyed) {
            queueMicrotask(() => callback(abortError('Connector destroyed'), null));
            return;
        }
        const proxyKey = proxyOption(options);
        if (proxyKey) {
            queueMicrotask(() => callback(directOnlyError(proxyKey), null));
            return;
        }
        if (options.httpSocket || options.socketPath || !['http:', 'https:'].includes(options.protocol)) {
            // Delegation is only for a transport already selected by another owner.
            // A proxy route cannot be inferred from an ordinary origin connection.
            if (config.fallbackConnector) {
                config.fallbackConnector(options, callback);
                return;
            }
            queueMicrotask(() => callback(new TypeError('A proxy tunnel, Unix socket or alternate protocol requires its owning fallbackConnector'), null));
            return;
        }
        const controller = new AbortController();
        pending.add(controller);
        const signals = [...new Set([options.signal, config.signal].filter((s) => !!s))];
        const listeners = signals.map(signal => {
            const abort = () => controller.abort(signal.reason);
            signal.addEventListener('abort', abort, { once: true });
            if (signal.aborted)
                abort();
            return { signal, abort };
        });
        const cleanup = () => { pending.delete(controller); for (const { signal, abort } of listeners)
            signal.removeEventListener('abort', abort); };
        const port = Number(options.port || (options.protocol === 'https:' ? 443 : 80));
        const settings = { ...config, hostname: options.hostname, port, localAddress: options.localAddress ?? config.localAddress, signal: controller.signal };
        const servername = options.servername ?? tls.servername;
        const key = JSON.stringify([options.hostname, port, servername, settings.localAddress]);
        let selected;
        const tickets = new WeakMap();
        const cache = (session) => {
            if (!capacity || destroyed || !selected?.authorized)
                return;
            sessions.delete(key);
            sessions.set(key, session);
            while (sessions.size > capacity)
                sessions.delete(sessions.keys().next().value);
        };
        const promise = options.protocol === 'https:'
            ? secure({ ...settings, tls: { ...tls, servername, ALPNProtocols: tls.ALPNProtocols ?? (config.allowH2 ? ['h2', 'http/1.1'] : ['http/1.1']), session: tls.session ?? sessions.get(key) } }, socket => {
                // Tickets from failed/losing connections never enter the cache.
                socket.on('session', session => { if (selected === socket)
                    cache(session);
                else if (!selected)
                    tickets.set(socket, session); });
            })
            : tcp(settings);
        promise.then(socket => {
            cleanup();
            if (controller.signal.aborted || destroyed) {
                socket.destroy();
                callback(abortError(controller.signal.reason), null);
                return;
            }
            if ('authorized' in socket) {
                selected = socket;
                const ticket = tickets.get(selected);
                if (ticket)
                    cache(ticket);
            }
            callback(null, socket);
        }, error => { cleanup(); callback(asError(error), null); });
    };
    connector.destroy = reason => { destroyed = true; for (const controller of pending)
        controller.abort(reason); sessions.clear(); };
    return connector;
}

export { HappyEyeballsHttpsAgent, createUndiciConnector };
