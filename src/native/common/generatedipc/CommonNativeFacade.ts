/* generated file, don't edit. */


export interface CommonNativeFacade {

	createMailEditor(
		filesUris: ReadonlyArray<string>,
		text: string,
		addresses: ReadonlyArray<string>,
		subject: string,
		mailToUrlString: string,
	): Promise<void>
	
	openMailBox(
		userId: string,
		address: string,
		requestedPath: string | null,
	): Promise<void>
	
	openCalendar(
		userId: string,
	): Promise<void>
	
	showAlertDialog(
		translationKey: string,
	): Promise<void>
	
	invalidateAlarms(
	): Promise<void>
	
}
