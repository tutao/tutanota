import {
	BadGatewayError,
	GatewayTimeoutError,
	InternalServerError,
	NotAuthorizedError,
	ServiceUnavailableError,
	TooManyRequestsError,
} from "@tutao/http-client/error"
import { MigrationError } from "../../api/common/error/MigrationError"
import electron from "electron"

const RATE_LIMIT_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded"])
const DAILY_LIMIT_REASON = "dailyLimitExceeded"

export const API_CLIENT_MAX_REQUEST_ATTEMPTS = 8
export const API_CLIENT_REQUEST_TIMEOUT = 60 * 1000

export function parseRetryAfterMs(retryAfter: string | null | undefined, now: number = Date.now()): number | null {
	if (!retryAfter) {
		return null
	}
	const seconds = parseInt(retryAfter)
	if (Number.isFinite(seconds)) {
		return seconds * 1000
	}
	const date = Date.parse(retryAfter)
	return Number.isFinite(date) ? Math.max(date - now, 0) : null
}

export class ApiClientError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly retryAfter?: string | null,
	) {
		super(message)
	}
}

export class GmailApiError extends ApiClientError {
	constructor(
		message: string,
		readonly status: number,
		readonly reason?: string,
		readonly retryAfter?: string | null,
	) {
		super(message, status, retryAfter)
	}
}

export function isRetryableGmailError(e: any): boolean {
	if (e instanceof GmailApiError) {
		return (
			e.status === InternalServerError.CODE ||
			e.status === BadGatewayError.CODE ||
			e.status === ServiceUnavailableError.CODE ||
			e.status === GatewayTimeoutError.CODE ||
			isGmailRateLimitError(e)
		)
	}
	return !(e instanceof MigrationError)
}

export function isGmailRateLimitError(e: any): boolean {
	return e?.status === TooManyRequestsError.CODE || (e?.status === NotAuthorizedError.CODE && RATE_LIMIT_REASONS.has(e?.reason))
}

export function isGmailDailyLimitError(e: any): boolean {
	return e?.status === NotAuthorizedError.CODE && e?.reason === DAILY_LIMIT_REASON
}

// Google reports the end of a rate limit as "Retry after 2026-10-02T10:00:00.000Z" in the error message, without a Retry-After header.
export function parseRetryAfterFromMessage(message: string | undefined, now: number): number | null {
	const retryAfter = message?.match(/Retry after (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/i)
	const date = retryAfter ? Date.parse(retryAfter[1]) : NaN
	return Number.isFinite(date) ? Math.max(date - now, 0) : null
}

export class GraphApiError extends ApiClientError {
	constructor(
		message: string,
		readonly status: number,
		readonly code?: string,
		readonly retryAfter?: string | null,
	) {
		super(message, status, retryAfter)
	}
}

export function isRetryableGraphApiError(e: any): boolean {
	if (e instanceof GraphApiError) {
		return (
			e.status === TooManyRequestsError.CODE ||
			e.status === InternalServerError.CODE ||
			e.status === BadGatewayError.CODE ||
			e.status === ServiceUnavailableError.CODE ||
			e.status === GatewayTimeoutError.CODE
		)
	}
	return !(e instanceof MigrationError)
}
