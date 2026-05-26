import type { IWindowFacade } from "../../ui/IWindowFacade"
import { assertMainOrNodeBoot } from "@tutao/app-env"
import type { BaseThemeProvider } from "../../ui/theme"

assertMainOrNodeBoot()

export async function initUiSingletons(windowFacade: IWindowFacade, themeController: BaseThemeProvider) {
	const { MainStyles } = await import("../../ui/main-styles")
	const { modal } = await import("../../ui/base/Modal")
	const { Dialog } = await import("../../ui/base/Dialog")

	const mainStyles = new MainStyles(themeController, windowFacade)
	mainStyles.init()
	modal.init(windowFacade)

	windowFacade.addKeyboardSizeListener(Dialog.onKeyboardSizeChanged)
}
