/* generated file, don't edit. */


export interface ThemeFacade {

	getThemes(
	): Promise<ReadonlyArray<Record<string, string>>>
	
	setThemes(
		themes: ReadonlyArray<Record<string, string>>,
	): Promise<void>
	
	getSelectedTheme(
	): Promise<string | null>
	
	setSelectedTheme(
		themeId: string,
	): Promise<void>
	
}
