/* generated file, don't edit. */

import { ThemeFacade } from "./ThemeFacade.js"

export class ThemeFacadeReceiveDispatcher {
	constructor(private readonly facade: ThemeFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "getThemes": {
				return this.facade.getThemes()
			}
			case "setThemes": {
				const themes: ReadonlyArray<Record<string, string>> = arg[0]
				return this.facade.setThemes(themes)
			}
			case "getThemePreference": {
				return this.facade.getThemePreference()
			}
			case "setThemePreference": {
				const themePreference: string = arg[0]
				return this.facade.setThemePreference(themePreference)
			}
			case "prefersDark": {
				return this.facade.prefersDark()
			}
		}
	}
}
