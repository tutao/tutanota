/* generated file, don't edit. */


export interface DesktopSystemFacade {

	openNewWindow(
	): Promise<void>
	
	focusApplicationWindow(
	): Promise<void>
	
	sendSocketMessage(
		message: string,
	): Promise<void>
	
}
