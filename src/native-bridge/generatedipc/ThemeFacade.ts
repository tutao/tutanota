/* generated file, don't edit. */

export interface ThemeFacade {
	getThemes(): Promise<ReadonlyArray<Record<string, string>>>

	setThemes(themes: ReadonlyArray<Record<string, string>>): Promise<void>

	getThemePreference(): Promise<string | null>

	setThemePreference(themePreference: string): Promise<void>

	prefersDark(): Promise<boolean>
}
