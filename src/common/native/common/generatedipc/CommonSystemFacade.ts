/* generated file, don't edit. */

/**
 * Common operations implemented by each platform.
 */
export interface CommonSystemFacade {
	/**
	 * Must be called before any other methods are called.
	 */
	initializeRemoteBridge(): Promise<void>

	/**
	 * Reload the webpage with the specified query arguments.
	 */
	reload(query: Record<string, string>): Promise<void>

	/**
	 * Returns the log contents of the native process.
	 */
	getLog(): Promise<string>
}
