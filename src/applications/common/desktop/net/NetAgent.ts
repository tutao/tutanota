import type { HeadersInit, RequestInit, Response } from "undici"
import { Agent, buildConnector, fetch as undiciFetch, Headers, setGlobalDispatcher } from "undici"
import net from "node:net"
import tls from "node:tls"
import { CONNECTION_TIMEOUT_MS, connectWithHappyEyeballs } from "./HappyEyeballsConnector.js"

export type UndiciResponse = Response
export type UndiciRequestInit = RequestInit
export type UndiciHeadersInit = HeadersInit
export type FetchResult = Awaited<ReturnType<FetchImpl>>
export type FetchImpl = (target: string | URL, init?: UndiciRequestInit) => Promise<UndiciResponse>

/** How long the socket should stay open without any data sent over it. See IDLE_TIMEOUT_MS in tutadb. */
const SOCKET_IDLE_TIMEOUT_MS = 5 * 60 * 1000 + 1000
/** Timeout between reading data. */
const READ_TIMEOUT_MS = 20_000
const MAX_CACHED_TLS_SESSIONS = 100

const defaultConnector = buildConnector({ allowH2: false, timeout: CONNECTION_TIMEOUT_MS })
const tlsSessions = new Map<string, Buffer>()

const happyEyeballsConnector: NonNullable<Agent.Options["connect"]> = (options, callback) => {
	if (options.socketPath != null) {
		callback(new Error("Unix socket connections are not supported by the desktop network agent"), null)
		return
	}
	if (options.httpSocket != null || (options.protocol !== "http:" && options.protocol !== "https:")) {
		defaultConnector(options, callback)
		return
	}

	const secure = options.protocol === "https:"
	const port = Number(options.port || (secure ? 443 : 80))
	const servername = options.servername ?? (net.isIP(options.hostname) === 0 ? options.hostname : undefined)
	const sessionKey = `${servername ?? options.hostname}:${port}`

	void connectWithHappyEyeballs({
		hostname: options.hostname,
		port,
		localAddress: options.localAddress ?? undefined,
		readyEvent: secure ? "secureConnect" : "connect",
		createConnection: (candidate) => {
			const tcpSocket = net.connect({
				host: candidate.address,
				port,
				family: candidate.family,
				localAddress: options.localAddress ?? undefined,
			})
			const socket = secure
				? tls.connect({
						socket: tcpSocket,
						servername,
						ALPNProtocols: ["http/1.1"],
						session: tlsSessions.get(sessionKey),
					})
				: tcpSocket

			socket.setKeepAlive(true, 60_000)
			socket.setNoDelay(true)
			if (socket instanceof tls.TLSSocket) {
				socket.on("session", (session) => cacheTlsSession(sessionKey, session))
			}
			return socket
		},
	}).then(
		(socket) => callback(null, socket),
		(error) => callback(error, null),
	)
}

// We do not enable HTTP2 yet because it is still experimental (and buggy).
const agent = new Agent({
	connections: 3,
	keepAliveTimeout: SOCKET_IDLE_TIMEOUT_MS,
	bodyTimeout: READ_TIMEOUT_MS,
	headersTimeout: READ_TIMEOUT_MS,
	connect: happyEyeballsConnector,
})

// Node's built-in fetch uses Undici's global dispatcher. Install the same
// bounded agent used by customFetch so every main-process fetch follows the
// same connection race and per-origin connection limit.
setGlobalDispatcher(agent)

export const customFetch: FetchImpl = async (target: string | URL, init?: UndiciRequestInit): Promise<UndiciResponse> => {
	if (init?.body != null) {
		// undici throws an error if this is not taken care of.
		init.duplex = "half"
	}
	return await undiciFetch(target, init)
}

/**
 * UndiciHeaderInit is slightly different from the Headers we handle in electron,
 * for example in the protocol interceptors.
 */
export function convertHeaders(headers: globalThis.Headers): UndiciHeadersInit {
	const result = new Headers()
	// false positive: Headers are not arrays and also not really iterable
	// eslint-disable-next-line unicorn/no-array-for-each
	headers.forEach((val, key) => {
		result.append(key, val)
	})
	return result
}

/**
 * UndiciResponse.formData.get can return a File as defined in undici/types/file.d.ts (no .path or .webkitRelativePath)
 * the protocol handler expects it to return a file as defined at https://developer.mozilla.org/en-US/docs/Web/API/File
 * which contains .webkitRelativePath. we don't use formData, so we can ignore it.
 *
 * this fixes up the type of just those fields and should be relatively safe even if undici changes their response type.
 */
export function toGlobalResponse(response: FetchResult): globalThis.Response {
	return response as unknown as globalThis.Response
}

function cacheTlsSession(key: string, session: Buffer) {
	tlsSessions.delete(key)
	tlsSessions.set(key, session)
	if (tlsSessions.size > MAX_CACHED_TLS_SESSIONS) {
		const oldestKey = tlsSessions.keys().next().value
		if (oldestKey != null) tlsSessions.delete(oldestKey)
	}
}
