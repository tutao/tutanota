/** Default impl of timeout functions, useful for testing */
export type SystemTimeout = {
	// Copying it because ts has some weird properties attach to it in node tslib.
	// no-arg version because lambadas exist.
	setTimeout(callback: () => void, ms: number): number
	clearTimeout: typeof clearTimeout
}
