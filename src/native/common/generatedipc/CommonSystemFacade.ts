/* generated file, don't edit. */


export interface CommonSystemFacade {

	initializeRemoteBridge(
	): Promise<void>
	
	reload(
		query: Record<string, string>,
	): Promise<void>
	
	getLog(
	): Promise<string>
	
}
