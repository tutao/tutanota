/* generated file, don't edit. */

/**
 * Common operations used by all native platforms.
 */
export interface CommonNativeFacade {
	/**
	 * Opens mail editor to write a new email. If `mailToUrlString` is specified it takes priority.
	 */
	createMailEditor(filesUris: ReadonlyArray<string>, text: string, addresses: ReadonlyArray<string>, subject: string, mailToUrlString: string): Promise<void>

	openMailBox(userId: string, address: string, requestedPath: string | null): Promise<void>

	openCalendar(userId: string): Promise<void>

	showAlertDialog(translationKey: string): Promise<void>

	/**
	 * All local alarms have been deleted, reschedule alarms for the current user.
	 */
	invalidateAlarms(): Promise<void>
}
