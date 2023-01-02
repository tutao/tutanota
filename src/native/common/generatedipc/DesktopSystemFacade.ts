/* generated file, don't edit. */

export interface DesktopSystemFacade {
	openNewWindow(): Promise<void>

	/**
	 * Focuses sending window on the OS level
	 */
	focusApplicationWindow(): Promise<void>

	/**
	 * Sends message to the admin socket.
	 */
	sendSocketMessage(message: string): Promise<void>
}
