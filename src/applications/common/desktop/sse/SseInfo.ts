/**
 * Data used for notifications
 */
export interface SseInfo {
	/** device identifier */
	identifier: string
	/** origin to connect to */
	sseOrigin: string
	userIds: Array<string>
}
