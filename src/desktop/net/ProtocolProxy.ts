import http from "http"
import https from "https"
import path from "path"
import { log } from "../DesktopLog.js"
import { ProtocolRequest, ProtocolResponse, Session } from "electron"
import { Duplex, PassThrough } from "stream"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { errorToObj } from "../../api/common/MessageDispatcher.js"

const TAG = "[ProtocolProxy]"

export const ASSET_PROTOCOL = "asset"
const PROXIED_REQUEST_READ_TIMEOUT = 20000

// https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h
const enum NetErrorCode {
	OTHER = -2,
	INVALID_ARGUMENT = -4,
	NOT_FOUND = -6,
	TIMED_OUT = -7,
}

class ProxyError extends Error {
	constructor(readonly code: NetErrorCode) {
		super(`net operation failed with code ${code}`)
	}
}

/**
 * intercept & proxy https, http and asset requests on a session
 * @param session the webContents session we want to intercept requests on
 * @param assetDir the base directory of allowable scripts, images and other resources that the app may load.
 */
export function handleProtocols(session: Session, assetDir: string): void {
	doHandleProtocols(session, assetDir, http, https, path)
}

/**
 *  exported for testing
 */
export function doHandleProtocols(session: Session, assetDir: string, httpModule: typeof http, httpsModule: typeof https, pathModule: typeof path): void {
	if (!interceptProtocol("http", session, httpModule)) throw new Error("could not intercept http protocol")
	if (!interceptProtocol("https", session, httpsModule)) throw new Error("could not intercept https protocol")
	if (!handleAssetProtocol(session, assetDir, pathModule)) throw new Error("could not register asset protocol")
}

/**
 * intercept and proxy all requests for a protocol coming from a session. OPTIONS requests will be
 * answered immediately without actually calling the server.
 * @param session the session to intercept requests for
 * @param protocol http and https use different modules, so we need to intercept them separately.
 * @param net the net module to use (http if protocol is http, https if protocol is https)
 */
function interceptProtocol(protocol: string, session: Session, net: typeof http | typeof https): boolean {
	if (session.protocol.isProtocolIntercepted(protocol)) return true

	const agent = new net.Agent({
		keepAlive: true,
		maxSockets: 4,
		keepAliveMsecs: 7000 * 1000, // server has a 7200s tls session ticket timeout, so we keep the socket for 7000s
		timeout: PROXIED_REQUEST_READ_TIMEOUT, // this is an idle timeout (empirically determined)
	})

	const handler = async ({ method, headers, url, uploadData, referrer }: ProtocolRequest, sendResponse: (resp: ProtocolResponse) => void) => {
		const startTime: number = Date.now()
		const handleError = (e: Error) => {
			const parsedUrl = new URL(url)
			const noQueryUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`
			log.debug(TAG, `error for ${method} ${noQueryUrl}:`)
			log.debug(TAG, e)
			log.debug(TAG, JSON.stringify(errorToObj(e)))
			log.debug(TAG, `failed after ${Date.now() - startTime}ms`)
			// Passing anything but the codes mentioned in https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h
			// will lead to an immediate crash of the renderer without warning.
			if (e instanceof ProxyError) {
				sendResponse({ error: e.code })
			} else {
				sendResponse({ error: NetErrorCode.OTHER })
			}
		}

		if (!url.startsWith(protocol)) {
			handleError(new ProxyError(NetErrorCode.INVALID_ARGUMENT))
			return
		}
		if (method == "OPTIONS") {
			// this actually doesn't seem to be called when the actual request is intercepted,
			// but we'll handle it anyway.
			log.debug(TAG, "intercepted options request, returning canned response")
			return sendResponse({
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, GET, PUT, DELETE",
					"Access-Control-Allow-Headers": "*",
				},
			})
		}
		let actualData: Buffer | null = null
		if (uploadData) {
			const firstData = uploadData[0]
			if (firstData.blobUUID) {
				actualData = await session.getBlobData(firstData.blobUUID)
			} else if (firstData.file) {
				throw new ProgrammingError("Uploading files by path is not implemented")
			} else {
				actualData = firstData.bytes
			}
			headers["Content-Length"] = String(actualData.length)
		}
		const clientRequest: http.ClientRequest = net.request(url, { method, headers, agent })
		clientRequest.on("response", (res: http.IncomingMessage) => {
			const responseStream: Duplex = new PassThrough()
			res.on("data", (d) => responseStream.push(d))
			res.on("end", () => responseStream.end())
			res.on("error", (e) => {
				log.debug(TAG, `response error`, url)
				responseStream.end()
			})
			// casting because typescript doesn't accept http.IncomingHttpHeaders as a Record even though it's just an object.
			const resHeaders: Record<string, string | string[]> = res.headers as unknown as Record<string, string | string[]>
			sendResponse({ statusCode: res.statusCode, headers: resHeaders, data: responseStream })
		})
		clientRequest.on("error", (e) => handleError(e))
		clientRequest.on("timeout", () => clientRequest.destroy(new ProxyError(NetErrorCode.TIMED_OUT)))
		clientRequest.end(actualData ?? undefined)
	}
	return session.protocol.interceptStreamProtocol(protocol, handler)
}

/**
 * assign a custom handler the asset protocol scheme on the session if it has not been done yet.
 * the handler will handle all relative requests for resources and ensures that only
 */
function handleAssetProtocol(session: Session, assetDir: string, pathModule: typeof path): boolean {
	if (session.protocol.isProtocolRegistered(ASSET_PROTOCOL)) return true
	return session.protocol.registerFileProtocol(ASSET_PROTOCOL, (request, sendResponse) => {
		const fail = (msg: string) => {
			log.debug(TAG, msg)
			return sendResponse({ error: NetErrorCode.NOT_FOUND })
		}
		// in node, new URL will normalize the path and remove /.. and /. elements.
		// this doesn't work in browsers, so the startsWith check below should stay just to be sure
		const url = new URL(request.url)
		if (url.protocol.slice(0, -1) !== ASSET_PROTOCOL) return fail(`passed non-asset url to asset handler: ${url}`)
		if (url.hostname !== "app" || !url.pathname.startsWith("/")) return fail(`Invalid asset:// URL: ${request.url}`)
		const filePath = pathModule.resolve(assetDir, url.pathname.substring(1))
		if (!filePath.startsWith(assetDir)) {
			return fail(`Invalid asset URL ${request.url} w/ pathname ${url.pathname} got resolved to ${filePath})`)
		} else {
			return sendResponse({ path: filePath })
		}
	})
}
