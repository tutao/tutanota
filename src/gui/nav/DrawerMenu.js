//@flow

import m from "mithril"
import {ButtonColors, ButtonN, ButtonType} from "../base/ButtonN"
import {BootIcons} from "../base/icons/BootIcons"
import {LogoutUrl} from "../base/Header"
import {showUpgradeDialog, writeInviteMail, writeSupportMail} from "./NavFunctions"
import {isIOSApp} from "../../api/Env"
import {logins} from "../../api/main/LoginController"
import {navButtonRoutes} from "../../misc/RouteChange"

type Attrs = void

export class DrawerMenu implements MComponent<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		return m("drawer-menu", m(".flex.col.height-100p.items-center.pt.pb", [
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
				icon: () => BootIcons.Share,
				label: "invite_alt",
				click: () => writeInviteMail(),
				type: ButtonType.ActionLarge,
				colors: ButtonColors.DrawerNav
			}),
			m(ButtonN, {
				icon: () => BootIcons.Settings,
				label: "settings_label",
				click: () => m.route.set(navButtonRoutes.settingsUrl),
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