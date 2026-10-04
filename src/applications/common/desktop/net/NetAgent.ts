import type { HeadersInit, RequestInit, Response } from "undici"
import { Agent, fetch as undiciFetch, Headers } from "undici"
import { networkInterfaces } from "node:os"

export type UndiciResponse = Response
export type UndiciRequestInit = RequestInit
export type UndiciHeadersInit = HeadersInit
export type FetchResult = Awaited<ReturnType<FetchImpl>>
export type FetchImpl = (target: string | URL, init?: UndiciRequestInit) => Promise<UndiciResponse>

/** How long the socket should stay open without any data sent over it. See IDLE_TIMEOUT_MS in tutadb. */
const SOCKET_IDLE_TIMEOUT_MS = 5 * 60 * 1000 + 1000
/** Timeout between reading data. */
const READ_TIMEOUT_MS = 20_000

const DEFAULT_AGENT_OPTIONS: Agent.Options = {
	connections: 3,
	keepAliveTimeout: SOCKET_IDLE_TIMEOUT_MS,
	bodyTimeout: READ_TIMEOUT_MS,
	headersTimeout: READ_TIMEOUT_MS,
	connectTimeout: READ_TIMEOUT_MS,
	// this is needed to address issues in some cases where IPv6 does not really work
	autoSelectFamily: true,
	// this hinges on our patch to fix node:http2 import in undici
	allowH2: true,
}

// Underlying connection is probably dead (e.g. after the IP address changed).
const CONNECTION_FAILURE_CODES = new Set(["UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET"])

/**
 * Wraps an undici {@link Agent} and replaces it if a request fails in a way that suggests a dead connection *and* the
 * network has changed since the agent was created.
 *
 * With HTTP/2 all requests share one session. If the network changes underneath it, the socket is silently dead, undici
 * only resets the single timed-out stream and keeps the session, and the HTTP/2 PING has no timeout. Without replacing
 * the agent every following request would time out as well until the process is restarted.
 *
 * We deliberately do not replace the agent on timeouts alone so that a slow or unreachable server does not make us
 * throw away healthy connections.
 */
export class NetAgent {
	private agent: Agent
	private currentFingerprint: string

	constructor() {
		this.agent = new Agent(DEFAULT_AGENT_OPTIONS)
		this.currentFingerprint = this.networkFingerprint()
	}

	readonly fetch: FetchImpl = async (target, init) => {
		if (init?.body != null) {
			// undici throws an error if this is not taken care of.
			init.duplex = "half"
		}
		const used = this.agent
		try {
			return await undiciFetch(target, { ...(init ?? {}), dispatcher: used })
		} catch (e) {
			if (this.isConnectionFailure(e)) {
				this.replaceIfNetworkChanged(used)
			}
			throw e
		}
	}

	private replaceIfNetworkChanged(failed: Agent) {
		const newFingerprint = this.networkFingerprint()
		if (failed !== this.agent || newFingerprint === this.currentFingerprint) {
			// someone else already replaced it or nothing changed
			return
		}
		this.agent = new Agent(DEFAULT_AGENT_OPTIONS)
		this.currentFingerprint = newFingerprint
		// fail in-flight requests right away instead of letting them time out
		void failed.destroy().catch(() => {})
	}

	isConnectionFailure(e: Error | null): boolean {
		const err = e as { code?: string; cause?: { code?: string } } | null
		return CONNECTION_FAILURE_CODES.has(err?.cause?.code ?? err?.code ?? "")
	}

	networkFingerprint(): string {
		const entries: string[] = []
		for (const [name, addresses] of Object.entries(networkInterfaces())) {
			for (const address of addresses ?? []) {
				if (!address.internal) entries.push(`${name}|${address.address}`)
			}
		}
		return entries.sort().join(",")
	}
}

export const customFetch: FetchImpl = new NetAgent().fetch

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
