import { ApiClientError, isGmailRateLimitError, API_CLIENT_MAX_REQUEST_ATTEMPTS, parseRetryAfterFromMessage, parseRetryAfterMs } from "./ApiClientRequestUtils"

const REQUEST_RETRY_BASE_DELAY = 1000
const MAX_REQUEST_RETRY_DELAY = 2 * 60 * 1000

export class ApiClientRequestPacer {
	private quotaUnitsPerSecond
	private nextRequestStart = 0

	constructor(
		private readonly sleep: (ms: number) => Promise<void>,
		private readonly now: () => number,
		private readonly isRetryableApiError: (e: any) => boolean,
		private readonly maxQuotaUnitsPerSecond: number,
		private readonly minQuotaUnitsPerSecond: number,
	) {
		this.quotaUnitsPerSecond = maxQuotaUnitsPerSecond !== 0 ? maxQuotaUnitsPerSecond : 1
	}

	private async acquire(quotaCost: number): Promise<void> {
		const start = Math.max(this.now(), this.nextRequestStart)
		this.nextRequestStart = start + (quotaCost / this.quotaUnitsPerSecond) * 1000
		const waitMs = start - this.now()
		if (waitMs > 0) {
			await this.sleep(waitMs)
		}
	}

	private onSuccess() {
		this.quotaUnitsPerSecond = Math.min(this.quotaUnitsPerSecond * 1.02, this.maxQuotaUnitsPerSecond)
	}

	onRateLimited(retryAfterMs: number) {
		this.quotaUnitsPerSecond = Math.max(this.quotaUnitsPerSecond / 2, this.minQuotaUnitsPerSecond)
		this.nextRequestStart = Math.max(this.nextRequestStart, this.now() + retryAfterMs)
	}

	async withRetry<T>(quotaCost: number, request: () => Promise<T>): Promise<T> {
		for (let attempt = 1; ; attempt++) {
			await this.acquire(quotaCost)
			try {
				const result = await request()
				this.onSuccess()
				return result
			} catch (error) {
				if (attempt >= API_CLIENT_MAX_REQUEST_ATTEMPTS || !this.isRetryableApiError(error)) {
					throw error
				}
				const retryAfterMs = this.getRetryDelay(error instanceof ApiClientError ? error : null, attempt)
				if (isGmailRateLimitError(error)) {
					this.onRateLimited(retryAfterMs)
				} else {
					await this.sleep(retryAfterMs)
				}
			}
		}
	}

	getRetryDelay(error: ApiClientError | null, attempt: number): number {
		const backoffMs = REQUEST_RETRY_BASE_DELAY * 2 ** (attempt - 1) + Math.random() * 250
		return Math.min(
			parseRetryAfterMs(error?.retryAfter, this.now()) ?? parseRetryAfterFromMessage(error?.message, this.now()) ?? backoffMs,
			MAX_REQUEST_RETRY_DELAY,
		)
	}
}
