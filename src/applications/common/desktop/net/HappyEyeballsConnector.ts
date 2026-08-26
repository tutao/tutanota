import dns from "node:dns"
import net from "node:net"
import os from "node:os"

export const CONNECTION_ATTEMPT_DELAY_MS = 1_000
export const CONNECTION_TIMEOUT_MS = 20_000
const IP_FAMILY_HINT_CACHE_MS = 5 * 60 * 1_000

type IpFamily = 4 | 6

let cachedIpFamilyHint: { family: IpFamily; expiresAt: number } | null = null

export type ConnectionCandidate = {
	address: string
	family: IpFamily
}

export type HappyEyeballsOptions<T extends net.Socket> = {
	hostname: string
	port: number
	family?: number
	localAddress?: string
	readyEvent: "connect" | "secureConnect"
	createConnection: (candidate: ConnectionCandidate) => T
}

/**
 * Staggers connection attempts while keeping previous attempts alive. The first
 * socket to complete the requested handshake wins and all other sockets are
 * closed. DNS resolution and all connection attempts share one overall timeout.
 */
export function connectWithHappyEyeballs<T extends net.Socket>(options: HappyEyeballsOptions<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		let candidates: ReadonlyArray<ConnectionCandidate> = []
		let nextCandidateIndex = 0
		let nextAttemptTimer: NodeJS.Timeout | null = null
		let settled = false
		const activeSockets = new Set<T>()
		const connectionErrors: Array<Error> = []

		const overallTimeout = setTimeout(() => {
			const error = new Error(`Connection to ${options.hostname}:${options.port} timed out after ${CONNECTION_TIMEOUT_MS} ms`)
			;(error as NodeJS.ErrnoException).code = "ETIMEDOUT"
			finishWithError(error)
		}, CONNECTION_TIMEOUT_MS)

		function clearNextAttemptTimer() {
			if (nextAttemptTimer != null) {
				clearTimeout(nextAttemptTimer)
				nextAttemptTimer = null
			}
		}

		function closeActiveSockets(winner?: T) {
			for (const socket of activeSockets) {
				if (socket !== winner) socket.destroy()
			}
			activeSockets.clear()
		}

		function finishWithSocket(socket: T) {
			if (settled) {
				socket.destroy()
				return
			}
			settled = true
			clearTimeout(overallTimeout)
			clearNextAttemptTimer()
			closeActiveSockets(socket)
			resolve(socket)
		}

		function finishWithError(error: Error) {
			if (settled) return
			settled = true
			clearTimeout(overallTimeout)
			clearNextAttemptTimer()
			closeActiveSockets()
			reject(error)
		}

		function finishWhenExhausted() {
			if (nextCandidateIndex < candidates.length || activeSockets.size > 0) return
			finishWithError(new AggregateError(connectionErrors, `Could not connect to ${options.hostname}:${options.port}`))
		}

		function startNextConnection() {
			if (settled) return
			clearNextAttemptTimer()

			let attempt: { candidate: ConnectionCandidate; socket: T } | null = null
			while (attempt == null) {
				const candidate = candidates[nextCandidateIndex]
				if (candidate == null) {
					finishWhenExhausted()
					return
				}
				nextCandidateIndex += 1

				try {
					attempt = { candidate, socket: options.createConnection(candidate) }
				} catch (error) {
					connectionErrors.push(asError(error))
				}
			}
			const { candidate, socket } = attempt

			activeSockets.add(socket)
			let attemptFinished = false
			const cleanupAttemptListeners = () => {
				socket.removeListener(options.readyEvent, onConnected)
				socket.removeListener("error", onError)
				socket.removeListener("close", onClose)
			}

			const onConnected = () => {
				if (attemptFinished) return
				attemptFinished = true
				cleanupAttemptListeners()
				activeSockets.delete(socket)
				finishWithSocket(socket)
			}

			const onError = (error: Error) => {
				if (attemptFinished) return
				attemptFinished = true
				cleanupAttemptListeners()
				activeSockets.delete(socket)
				if (settled) return
				socket.destroy()
				connectionErrors.push(error)
				if (nextCandidateIndex < candidates.length) {
					startNextConnection()
				} else {
					finishWhenExhausted()
				}
			}

			const onClose = () => {
				if (attemptFinished) return
				const error = new Error(`Connection to ${candidate.address}:${options.port} closed before completing the handshake`)
				;(error as NodeJS.ErrnoException).code = "ECONNRESET"
				onError(error)
			}

			socket.once(options.readyEvent, onConnected)
			socket.once("error", onError)
			socket.once("close", onClose)

			// One second gives the preferred route a head start without imposing
			// Node's short per-address cutoff; previous attempts remain active.
			if (nextCandidateIndex < candidates.length) {
				nextAttemptTimer = setTimeout(startNextConnection, CONNECTION_ATTEMPT_DELAY_MS)
			}
		}

		resolveConnectionCandidates(options.hostname, options.family, options.localAddress).then(
			(resolvedCandidates) => {
				if (settled) return
				candidates = resolvedCandidates
				if (candidates.length === 0) {
					const error = new Error(`No usable addresses found for ${options.hostname}`)
					;(error as NodeJS.ErrnoException).code = "ENOTFOUND"
					finishWithError(error)
					return
				}
				startNextConnection()
			},
			(error) => finishWithError(asError(error)),
		)
	})
}

async function resolveConnectionCandidates(hostname: string, requestedFamily?: number, localAddress?: string): Promise<Array<ConnectionCandidate>> {
	const hostnameFamily = net.isIP(hostname)
	const localAddressFamily = localAddress == null ? 0 : net.isIP(localAddress)
	const explicitFamily = asIpFamily(requestedFamily)
	const sourceFamily = asIpFamily(localAddressFamily)
	if (explicitFamily != null && sourceFamily != null && explicitFamily !== sourceFamily) return []
	const requiredFamily = explicitFamily ?? sourceFamily

	if (hostnameFamily !== 0) {
		const family = hostnameFamily as IpFamily
		return requiredFamily == null || requiredFamily === family ? [{ address: hostname, family }] : []
	}

	const lookupResults = await dns.promises.lookup(hostname, { all: true })
	const uniqueCandidates: Array<ConnectionCandidate> = []
	const seen = new Set<string>()
	for (const result of lookupResults) {
		const family = asIpFamily(result.family)
		if (family == null || (requiredFamily != null && family !== requiredFamily)) continue
		const key = `${family}:${result.address}`
		if (!seen.has(key)) {
			seen.add(key)
			uniqueCandidates.push({ address: result.address, family })
		}
	}

	return interleaveCandidates(uniqueCandidates, getPreferredIpFamily())
}

/**
 * Uses configured interface addresses as an ordering hint. IPv4 remains the
 * default unless there is a usable IPv6 address and no usable IPv4 address.
 * Both families are still attempted regardless of this preference.
 */
export function determinePreferredIpFamily(networkInterfaces = os.networkInterfaces()): IpFamily {
	let hasIpv4Hint = false
	let hasIpv6Hint = false

	for (const addresses of Object.values(networkInterfaces)) {
		for (const address of addresses ?? []) {
			if (address.internal || isLinkLocalAddress(address.address, address.family)) continue
			if (address.family === "IPv4") hasIpv4Hint = true
			if (address.family === "IPv6") hasIpv6Hint = true
		}
	}

	return !hasIpv4Hint && hasIpv6Hint ? 6 : 4
}

function getPreferredIpFamily(): IpFamily {
	const now = Date.now()
	if (cachedIpFamilyHint == null || cachedIpFamilyHint.expiresAt <= now) {
		cachedIpFamilyHint = {
			family: determinePreferredIpFamily(),
			expiresAt: now + IP_FAMILY_HINT_CACHE_MS,
		}
	}
	return cachedIpFamilyHint.family
}

function isLinkLocalAddress(address: string, family: string): boolean {
	if (family === "IPv4") return address.startsWith("169.254.")
	if (family !== "IPv6") return false
	const firstHextet = Number.parseInt(address.split(":", 1)[0], 16)
	return firstHextet >= 0xfe80 && firstHextet <= 0xfebf
}

function interleaveCandidates(candidates: ReadonlyArray<ConnectionCandidate>, preferredFamily: IpFamily): Array<ConnectionCandidate> {
	const ipv4Candidates = candidates.filter((candidate) => candidate.family === 4)
	const ipv6Candidates = candidates.filter((candidate) => candidate.family === 6)
	const interleaved: Array<ConnectionCandidate> = []
	const length = Math.max(ipv4Candidates.length, ipv6Candidates.length)
	const preferredCandidates = preferredFamily === 4 ? ipv4Candidates : ipv6Candidates
	const fallbackCandidates = preferredFamily === 4 ? ipv6Candidates : ipv4Candidates

	for (let index = 0; index < length; index += 1) {
		const preferredCandidate = preferredCandidates[index]
		const fallbackCandidate = fallbackCandidates[index]
		if (preferredCandidate != null) interleaved.push(preferredCandidate)
		if (fallbackCandidate != null) interleaved.push(fallbackCandidate)
	}

	return interleaved
}

function asIpFamily(family: number | undefined): IpFamily | null {
	return family === 4 || family === 6 ? family : null
}

function asError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error))
}
