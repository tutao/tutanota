/* generated file, don't edit. */

/**
 * Common operations used by all native platforms.
 */
export interface CommonNativeFacade {
	/**
	 * Opens mail editor to write a new email. If `mailToUrlString` is specified it takes priority.
	 */
	createMailEditor(filesUris: ReadonlyArray<string>, text: string, addresses: ReadonlyArray<string>, subject: string, mailToUrlString: string): Promise<void>

	/**
	 * Opens the mailbox of an address, optionally to an email specified by requestedPath
	 */
	openMailBox(userId: string, address: string, requestedPath: string | null): Promise<void>

	openCalendar(userId: string): Promise<void>

	showAlertDialog(translationKey: string): Promise<void>

	/**
	 * All local alarms have been deleted, reschedule alarms for the current user.
	 */
	invalidateAlarms(): Promise<void>

	/**
	 * Called when the system theme preference has changed
	 */
	updateTheme(): Promise<void>

	/**
	 * prompt the user to enter a new password and a confirmation, taking an optional old password into account
	 */
	promptForNewPassword(title: string, oldPassword: string | null): Promise<string>

	/**
	 * prompt the user to enter a password
	 */
	promptForPassword(title: string): Promise<string>

	/**
	 * Pass a list of files (.vcf) to be handled by the app and if compatible, import them
	 */
	handleFileImport(filesUris: ReadonlyArray<string>): Promise<void>
}
