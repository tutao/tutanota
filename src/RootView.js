// @flow
import m from "mithril"
import {header} from "./gui/base/Header"
import {modal} from "./gui/base/Modal"
import {assertMainOrNodeBoot} from "./api/Env"
import {overlay} from "./gui/base/Overlay"
import {styles} from "./gui/styles"
import {NavButtonN} from "./gui/base/NavButtonN"
import {BootIcons} from "./gui/base/icons/BootIcons"

assertMainOrNodeBoot()

class RootView {
	view: Function;
	viewCache: {[key: string]: Function};

	constructor() {
		this.viewCache = {}

		// On first mouse event disable outline. This is a compromise between keyboard navigation users and mouse users.
		let onmousedown = (e) => {
			styles.registerStyle("outline", () => ({
				"*": {
					outline: "none",
				}
			}))
			// remove event listener after the first click to not re-register style
			onmousedown = null
			// It is important to not redraw at this point because click event may be lost otherwise and saved login button would not be
			// actually pressed. It's unclear why but preventing redraw (this way or setting listener manually) helps.
			// It's also useless to redraw for this click handler because we just want to add a global style definition.
			e.redraw = false
		}


		this.view = (vnode): VirtualElement => {
			return m("#root", {onmousedown}, [
				m(overlay),
				m(header),
				m(modal),
				vnode.children,
				m(".flex.abs.items-center.bottom-nav", [
					m(NavButtonN, {
							label: 'emails_label',
							icon: () => BootIcons.Mail,
							href: () => "/mail",
							vertical: true,
						}
					),
					m(NavButtonN, {
							label: "search_label",
							icon: () => BootIcons.Search,
							href: "/search/mail",
							isSelectedPrefix: "/search",
							vertical: true,
						}
					),
					m(NavButtonN, {
						label: 'calendar_label',
						icon: () => BootIcons.Calendar,
						href: () => "/calendar",
						vertical: true,
					}),
					m(NavButtonN, {
						label: 'settings_label',
						icon: () => BootIcons.Settings,
						href: () => "/settings",
						vertical: true,
					})
				]),
			])
		}
	}
}


export const root: RootView = new RootView()
