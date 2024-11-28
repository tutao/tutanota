import type { HeadersInit, RequestInit, Response } from "undici"
import { Agent, fetch as undiciFetch } from "undici"

export type UndiciResponse = Response
export type UndiciRequestInit = RequestInit
export type UndiciHeadersInit = HeadersInit

/** How long the socket should stay open without any data sent over it. See IDLE_TIMEOUT_MS in tutadb. */
const SOCKET_IDLE_TIMEOUT_MS = 5 * 60 * 1000 + 1000
/** Timeout between reading data. */
const READ_TIMEOUT_MS = 20_000

// We do not enable HTTP2 yet because it is still experimental (and buggy).
const agent = new Agent({
	connections: 3,
	keepAliveTimeout: SOCKET_IDLE_TIMEOUT_MS,
	bodyTimeout: READ_TIMEOUT_MS,
	headersTimeout: READ_TIMEOUT_MS,
	connectTimeout: READ_TIMEOUT_MS,
	// this is needed to address issues in some cases where IPv6 does not really work
	autoSelectFamily: true,
})

export type FetchResult = Awaited<ReturnType<FetchImpl>>
export type FetchImpl = (target: string | URL, init?: UndiciRequestInit) => Promise<UndiciResponse>

export const customFetch: FetchImpl = async (target: string | URL, init?: UndiciRequestInit): Promise<UndiciResponse> => {
	if (init?.body != null) {
		// undici throws an error if this is not taken care of.
		init.duplex = "half"
	}
	return await undiciFetch(target, {
		...(init ?? {}),
		dispatcher: agent,
	})
}

/**
 * UndiciHeaderInit is slightly different from the Headers we handle in electron,
 * for example in the protocol interceptors.
 */
export function convertHeaders(headers: globalThis.Headers): UndiciHeadersInit {
	const result: Record<string, string | ReadonlyArray<string>> = {}
	// false positive: Headers are not arrays and also not really iterable
	// eslint-disable-next-line unicorn/no-array-for-each
	headers.forEach((val, key) => (result[key] = val))
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
	return response as typeof response & Pick<globalThis.Response, "formData" | "clone">
}
