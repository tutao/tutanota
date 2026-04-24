/* generated file, don't edit. */

/**
 * messages to be sent from one desktop window to another, transferred through the native part.
 */
export interface InterWindowEventFacade {
	/**
	 * stored credentials for this user Id were deleted, so they are unusable. other windows should do the same.
	 */
	localUserDataInvalidated(userId: string): Promise<void>

	/**
	 * reload the deviceConfig for all windows, for example when the encryption mode on the credentials was changed, so we need to replace them.
	 */
	reloadDeviceConfig(): Promise<void>
}
