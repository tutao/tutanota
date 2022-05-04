import {DrawerMenu} from "../nav/DrawerMenu"
import {theme} from "../theme"
import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import type {clickHandler} from "./GuiUtils"
import type {lazy} from "@tutao/tutanota-utils"
import {Request} from "../../api/common/MessageDispatcher"
import {WsConnectionState} from "../../api/main/WorkerClient"
import {FolderColumnHeaderButton} from "./buttons/FolderColumnHeaderButton"

export type Attrs = {
	/** Button to be displayed on top of the column*/
	button: | {label: TranslationKey, click: clickHandler} | null | undefined
	content: Children
	ariaLabel: TranslationKey | lazy<string>
}

export class FolderColumnView implements Component<Attrs> {
	private wsState: WsConnectionState = WsConnectionState.connecting

	constructor() {
		import("../../api/main/MainLocator").then(async ({locator}) => {
			await locator.initialized
			const worker = locator.worker
			this.wsState = worker.wsConnection()()
			worker.wsConnection().map(state => {
				this.wsState = state
				m.redraw()
			})
			m.redraw()
		})
	}

	view({attrs}: Vnode<Attrs>): Children {
		return m(".flex.height-100p", [
			m(DrawerMenu, {
				openNewWindow: async () => {
					const {locator} = await import("../../api/main/MainLocator")
					return locator.native.invokeNative(new Request("openNewWindow", []))
				},
			}),
			m(".folder-column.flex-grow.overflow-x-hidden.flex.col" + landmarkAttrs(AriaLandmarks.Navigation, lang.getMaybeLazy(attrs.ariaLabel)), [
				m(".mlr-l.mt.mb", this.renderMainButton(attrs)),
				m(
					".scroll.overflow-x-hidden.flex.col.flex-grow",
					{
						onscroll: (e: Event) => {
							const target = e.target as HTMLElement
							if (attrs.button == null || target.scrollTop === 0) {
								target.style.borderTop = ""
							} else {
								target.style.borderTop = `1px solid ${theme.content_border}`
							}
						},
					},
					attrs.content,
				),
			]),
		])
	}

	private renderMainButton(attrs: Attrs): Children {
		return attrs.button ? m(FolderColumnHeaderButton, {
			label: attrs.button.label,
			click: attrs.button.click,
		}) : null
	}
}