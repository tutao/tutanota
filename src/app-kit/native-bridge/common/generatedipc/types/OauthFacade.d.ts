/* generated file, don't edit. */

/**
 * Implemented by the native desktop client to handle opening the oauth window and handling the callback
 */
export interface OauthFacade {
	/**
	 * Opens a window with url that should target redirectUrl on success
	 */
	openOauthWindow(url: string, redirectUrl: string): Promise<string | null>
}
