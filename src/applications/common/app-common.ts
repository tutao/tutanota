import type { IWindowFacade } from "../../ui/IWindowFacade"
import { assertMainOrNodeBoot } from "@tutao/app-env"
import type { BaseThemeProvider } from "../../ui/theme"
import { TopLevelAttrs, TopLevelView } from "../../ui/base/TopLevelView"
import { LoginController } from "./api/main/LoginController"
import { RouteResolver } from "mithril"

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

export type MakeViewResolverOptions<FullAttrs extends TopLevelAttrs, ComponentType extends TopLevelView<FullAttrs>, RouteCache> = {
	/**
	 * called once per route change. Use it for everything async that should happen before the route change. The result is preserved for
	 * as long as RouteResolver lives if you need to persist things between routes. It receives the route cache from the previous call if there was one.
	 @param cache
	 */
	prepareRoute: (cache: RouteCache | null) => Promise<{
		component: Class<ComponentType>
		cache: RouteCache
	}>
	/**
	 * called once per redraw. The result of it will be added to TopLevelAttrs to make full attributes.
	 * @param cache
	 */
	prepareAttrs: (cache: RouteCache) => Omit<FullAttrs, keyof TopLevelAttrs>
	/**
	 * enforce login policy to either redirect to the login page or reload
	 */
	requireLogin?: boolean
}
/**
 * Wrap top-level component with necessary logic.
 * Note: I can't make type inference work with attributes and components because of how broken mithril typedefs are so they are "never" by default and you
 * have to specify generic types manually.
 *
 * @template FullAttrs type of the attributes that the component takes
 * @template ComponentType type of the component
 * @template RouteCache info that is prepared async on route change and can be used later to create attributes on every render. Is also persisted between
 * the route changes.
 *
 * @param options {@link MakeViewResolverOptions}
 * @param logins logincontroller to ask about login state
 */
export type MakeViewResolver = <FullAttrs extends TopLevelAttrs = never, ComponentType extends TopLevelView<FullAttrs> = never, RouteCache = undefined>(
	options: MakeViewResolverOptions<FullAttrs, ComponentType, RouteCache>,
	logins: LoginController,
) => RouteResolver
