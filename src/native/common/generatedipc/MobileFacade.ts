/* generated file, don't edit. */


export interface MobileFacade {

	handleBackPress(
	): Promise<boolean>
	
	visibilityChange(
		visibility: boolean,
	): Promise<void>
	
	keyboardSizeChanged(
		newSize: number,
	): Promise<void>
	
}
