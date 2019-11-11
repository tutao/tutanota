//@flow

import m from "mithril"
import {theme} from "../theme"
import {ButtonColors, ButtonN} from "../base/ButtonN"
import {BootIcons} from "../base/icons/BootIcons"
import {ButtonType} from "../base/Button"
import {LogoutUrl} from "../base/Header"
import {showUpgradeDialog, writeInviteMail, writeSupportMail} from "./NavFunctions"
import {styles} from "../styles"
import {isIOSApp} from "../../api/Env"
import {logins} from "../../api/main/LoginController"

type Attrs = void

export class DrawerMenu implements MComponent<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		return m("drawer-menu", {
			style: {
				width: styles.isDesktopLayout() ? "48px" : "60px",
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
			!isIOSApp() && logins.getUserController().isFreeAccount()
				? m(ButtonN, {
					icon: () => BootIcons.Premium,
					label: "upgradePremium_label",
					click: () => showUpgradeDialog(),
					type: ButtonType.ActionLarge,
					colors: ButtonColors.DrawerNav
				})
				: null,
			m(ButtonN, {
				icon: () => BootIcons.Share,
				label: "invite_alt",
				click: () => writeInviteMail(),
				type: ButtonType.ActionLarge,
				colors: ButtonColors.DrawerNav
			}),
			logins.getUserController().isPremiumAccount()
				? m(ButtonN, {
					icon: () => BootIcons.Help,
					label: "supportMenu_label",
					click: () => writeSupportMail(),
					type: ButtonType.ActionLarge,
					colors: ButtonColors.DrawerNav,
				})
				: null,
			m(ButtonN, {
				icon: () => BootIcons.Settings,
				label: "settings_label",
				click: () => m.route.set("/settings"),
				type: ButtonType.ActionLarge,
				colors: ButtonColors.DrawerNav,
			}),
			m(ButtonN, {
				icon: () => BootIcons.Logout,
				label: "logout_label",
				click: () => m.route.set(LogoutUrl),
				type: ButtonType.ActionLarge,
				colors: ButtonColors.DrawerNav,
			})
		]))
	}
}