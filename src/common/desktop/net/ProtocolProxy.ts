import path from "node:path"
import fs from "node:fs"
import { log } from "../DesktopLog.js"
import { Session } from "electron"
import { errorToObj } from "../../api/common/threading/MessageDispatcher.js"
import { lazyMemoized } from "@tutao/tutanota-utils"
import { getMimeTypeForFile } from "../files/DesktopFileFacade.js"
import { convertHeaders, customFetch, FetchImpl, toGlobalResponse, UndiciRequestInit } from "./NetAgent"

const TAG = "[ProtocolProxy]"

export const ASSET_PROTOCOL = "asset"

/**
 * intercept & proxy https, http and asset requests on a session
 * @param session the webContents session we want to intercept requests on
 * @param assetDir the base directory of allowable scripts, images and other resources that the app may load.
 */
export function handleProtocols(session: Session, assetDir: string): void {
	doHandleProtocols(session, assetDir, customFetch, path, fs)
}

/**
 *  exported for testing
 */
export function doHandleProtocols(session: Session, assetDir: string, fetchImpl: FetchImpl, pathModule: typeof path, fsModule: typeof fs): void {
	if (!interceptProtocol("http", session, fetchImpl)) throw new Error("could not intercept http protocol")
	if (!interceptProtocol("https", session, fetchImpl)) throw new Error("could not intercept https protocol")
	if (!handleAssetProtocol(session, assetDir, pathModule, fsModule)) throw new Error("could not register asset protocol")
}

/**
 * intercept and proxy all requests for a protocol coming from a session. OPTIONS requests will be
 * answered immediately without actually calling the server.
 * @param session the session to intercept requests for
 * @param protocol http and https use different modules, so we need to intercept them separately.
 * @param fetchImpl an implementation of the fetch API (Request) => Promise<Response>
 */
function interceptProtocol(protocol: string, session: Session, fetchImpl: FetchImpl): boolean {
	if (session.protocol.isProtocolHandled(protocol)) return true
	session.protocol.handle(protocol, async (request: GlobalRequest): Promise<Response> => {
		const { method, url, headers: globalHeaders } = request
		const startTime: number = Date.now()
		if (!url.startsWith(protocol)) {
			return new Response(null, { status: 400 })
		} else if (method == "OPTIONS") {
			// this actually doesn't seem to be called when the actual request is intercepted,
			// but we'll handle it anyway.
			log.debug(TAG, "intercepted options request, returning canned response")
			return optionsResponse()
		} else {
			try {
				const options: UndiciRequestInit = { method, keepalive: true }
				const body = await request.arrayBuffer()
				if (body.byteLength > 0) {
					globalHeaders.set("Content-Length", String(body.byteLength))
					options.body = body
					options.duplex = "half"
				}
				options.headers = convertHeaders(globalHeaders)
				const response = await fetchImpl(url, options)
				return toGlobalResponse(response)
			} catch (e) {
				const parsedUrl = new URL(url)
				const noQueryUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`
				log.debug(TAG, `error for ${method} ${noQueryUrl}:`)
				log.debug(TAG, e)
				log.debug(TAG, JSON.stringify(errorToObj(e)))
				log.debug(TAG, `failed after ${Date.now() - startTime}ms`)
				return Response.error()
			}
		}
	})
	return session.protocol.isProtocolHandled(protocol)
}

/**
 * assign a custom handler the asset protocol scheme on the session if it has not been done yet.
 * the handler will handle all relative requests for resources and ensures that only
 */
function handleAssetProtocol(session: Session, assetDir: string, pathModule: typeof path, fsModule: typeof fs): boolean {
	if (session.protocol.isProtocolHandled(ASSET_PROTOCOL)) return true
	session.protocol.handle(ASSET_PROTOCOL, async (request: Request): Promise<Response> => {
		const fail = (msg: string) => {
			log.debug(TAG, msg)
			return new Response(null, { status: 404 })
		}
		// in node, new URL will normalize the path and remove /.. and /. elements.
		// this doesn't work in browsers, so the startsWith check below should stay just to be sure
		const url = new URL(request.url)
		if (url.protocol.slice(0, -1) !== ASSET_PROTOCOL) {
			return fail(`passed non-asset url to asset handler: ${url}`)
		} else if (url.hostname !== "app" || !url.pathname.startsWith("/")) {
			return fail(`Invalid asset:// URL: ${request.url}`)
		} else {
			const filePath = pathModule.resolve(assetDir, url.pathname.substring(1))
			if (!filePath.startsWith(assetDir)) {
				return fail(`Invalid asset URL ${request.url} w/ pathname ${url.pathname} got resolved to ${filePath})`)
			} else {
				try {
					return fileFetch(filePath, fsModule)
				} catch (e) {
					return fail(`failed to read asset at ${request.url}: ${e.message}`)
				}
			}
		}
	})
	return session.protocol.isProtocolHandled(ASSET_PROTOCOL)
}

const optionsResponse = lazyMemoized<Response>(() => {
	const headers = new Headers()
	headers.set("Access-Control-Allow-Origin", "*")
	headers.set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE")
	headers.set("Access-Control-Allow-Headers", "*")
	return new Response(null, {
		status: 200,
		headers,
	})
})

/**
 * fetch for file:// is not implemented in node 20, so we're getting it by hand.
 * you can test support with (note that electron's node might be a different version)
 *   $ node -e "fetch('file://egal.txt')"
 */
export async function fileFetch(filePath: string, fsModule: typeof fs): Promise<Response> {
	const content = await fsModule.promises.readFile(filePath)
	const headers = new Headers({
		"Content-Length": String(content.byteLength),
		"Content-Type": await getMimeTypeForFile(filePath),
	})
	return new Response(content, { status: 200, headers })
}
