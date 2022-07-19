/* generated file, don't edit. */


/**
 * messages to be sent from one desktop window to another, transferred through the native part.
 */
export interface InterWindowEventFacade {

	/**
	 * stored credentials for this user Id were deleted, so they are unusable
	 */
	localUserDataInvalidated(
		userId: string,
	): Promise<void>
	
}
