import type { SseDelay } from "./SseClient.js"
import { CONNECTION_TIMEOUT_MS } from "../net/HappyEyeballsConnector.js"
import { randomInt } from "node:crypto"

const MAX_SSE_RECONNECT_INTERVAL_MS = 120_000
type RandomInt = (minimum: number, maximum: number) => number

export class DesktopSseDelay implements SseDelay {
	constructor(private readonly randomInteger: RandomInt = randomInt) {}

	connectionLostDelay(): number {
		return this.withEqualJitter(CONNECTION_TIMEOUT_MS)
	}

	connectionFailureDelay(attempt: number): number {
		const interval = Math.min(CONNECTION_TIMEOUT_MS * Math.pow(2, Math.max(0, attempt - 1)), MAX_SSE_RECONNECT_INTERVAL_MS)
		return this.withEqualJitter(interval)
	}

	private withEqualJitter(maximum: number): number {
		const minimum = Math.ceil(maximum / 2)
		return this.randomInteger(minimum, maximum + 1)
	}
}
