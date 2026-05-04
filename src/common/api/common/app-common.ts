// @bundleInto:common-min

import { IWindowFacade } from "../../../ui/IWindowFacade"
import { modal } from "../../../ui/base/Modal"
import { MainStyles } from "../../../ui/main-styles"
import { ThemeController } from "../../../ui/ThemeController"

//FIXME use from calendar-app and drive
export function initUiSingletons(windowFacade: IWindowFacade, themeController: ThemeController) {
	const mainStyles = new MainStyles(themeController, windowFacade)
	mainStyles.init()
	modal.init(windowFacade)
}
