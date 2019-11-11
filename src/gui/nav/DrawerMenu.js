//@flow

import m from "mithril"
import {theme} from "../theme"
import {ButtonN} from "../base/ButtonN"
import {BootIcons} from "../base/icons/BootIcons"
import {ButtonType} from "../base/Button"
import {LogoutUrl} from "../base/Header"
import {showUpgradeDialog, writeInviteMail, writeSupportMail} from "./NavFunctions"

type Attrs = void

export class DrawerMenu implements MComponent<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		return m("drawer-menu", {
			style: {
				width: "60px",
				background: theme.navigation_menu_bg,
			},
		}, m(".flex.col.height-100p.items-center..pt.pb", {}, [
			m(".mb-s", {
				style: {
					width: "32px",
					height: "32px",
					"border-radius": "16px",
					"text-align": "center",
					"line-height": "26px", // 32 - 3*2
					background: theme.content_button,
					color: theme.content_button_icon,
					border: `3px solid ${theme.content_accent}`
				}
			}, "A"),
			m(".mb-s", {
				style: {
					width: "32px",
					height: "32px",
					"border-radius": "16px",
					"text-align": "center",
					"line-height": "32px",
					background: theme.content_button,
					color: theme.content_button_icon,
				}
			}, "B"),
			m(".flex-grow"),
			m(ButtonN, {
				icon: () => BootIcons.Premium,
				label: "upgradePremium_label",
				click: () => showUpgradeDialog(),
				type: ButtonType.ActionLarge,
			}),
			m(ButtonN, {
				icon: () => BootIcons.Share,
				label: "invite_alt",
				click: () => writeInviteMail(),
				type: ButtonType.ActionLarge,
			}),
			m(ButtonN, {
				icon: () => BootIcons.Help,
				label: "supportMenu_label",
				click: () => writeSupportMail(),
				type: ButtonType.ActionLarge
			}),
			m(ButtonN, {
				icon: () => BootIcons.Settings,
				label: "settings_label",
				click: () => m.route.set("/settings"),
				type: ButtonType.ActionLarge
			}),
			m(ButtonN, {
				icon: () => BootIcons.Logout,
				label: "logout_label",
				click: () => m.route.set(LogoutUrl),
				type: ButtonType.ActionLarge
			})
		]))
	}
}