//@flow

import m from "mithril"
import {ButtonColors, ButtonN, ButtonType} from "../base/ButtonN"
import {BootIcons} from "../base/icons/BootIcons"
import {LogoutUrl} from "../base/Header"
import {showSupportDialog, showUpgradeDialog, writeInviteMail} from "./NavFunctions"
import {isDesktop, isIOSApp} from "../../api/Env"
import {logins} from "../../api/main/LoginController"
import {navButtonRoutes} from "../../misc/RouteChange"
import {getSafeAreaInsetLeft} from "../HtmlUtils"
import {isNewMailActionAvailable} from "../../mail/MailView"
import {Icons} from "../base/icons/Icons"
import {nativeApp} from "../../native/NativeWrapper"
import {Request} from "../../api/common/WorkerProtocol"
import {AriaLandmarks, landmarkAttrs} from "../../api/common/utils/AriaUtils"
import { attachDropdown } from "../base/DropdownN"
import { noOp } from "../../api/common/utils/Utils"
import { keyManager } from "../../misc/KeyManager"
import { Keys } from "../../api/common/TutanotaConstants"

type Attrs = void

export class DrawerMenu implements MComponent<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		return m("drawer-menu" + landmarkAttrs(AriaLandmarks.Contentinfo, "drawer menu"), {
			style: {
				'padding-left': getSafeAreaInsetLeft()
			},
		}, m(".flex.col.height-100p.items-center.pt.pb", [
			m(".flex-grow"),
			isDesktop()
				? m(ButtonN, {
					icon: () => Icons.NewWindow,
					label: "openNewWindow_action",
					click: () => nativeApp.invokeNative(new Request('openNewWindow', [])),
					type: ButtonType.ActionLarge,
					colors: ButtonColors.DrawerNav
				})
				: null,
			!isIOSApp() && logins.isUserLoggedIn() && logins.getUserController().isFreeAccount()
				? m(ButtonN, {
					icon: () => BootIcons.Premium,
					label: "upgradePremium_label",
					click: () => showUpgradeDialog(),
					type: ButtonType.ActionLarge,
					colors: ButtonColors.DrawerNav
				})
				: null,
			m(ButtonN, attachDropdown(
				{
					label: "supportMenu_label" ,
					icon: () => BootIcons.Help,
					type: ButtonType.ActionLarge,
					click: noOp,
					noBubble: true,
					colors: ButtonColors.DrawerNav,
				},
				() => [
					{
						label: "supportMenu_label",
						click: () => writeSupportMail(),
						type: ButtonType.Dropdown,
						colors: ButtonColors.DrawerNav,
					},
					{
						label: "keyboardShortcuts_title",
						click: () => keyManager.openF1Help(),
						type: ButtonType.Dropdown,
						colors: ButtonColors.DrawerNav,
					}
				],
				() => {
					// if the account is premium let the user choice, otherwise open the F1-Help
					if (logins.isUserLoggedIn() && logins.getUserController().isPremiumAccount()) {
						return true;
					} else {
						keyManager.openF1Help();
						return false;
					}
				}
			)),
			isNewMailActionAvailable()
				? m(ButtonN, {
					icon: () => BootIcons.Share,
					label: "invite_alt",
					click: () => writeInviteMail(),
					type: ButtonType.ActionLarge,
					colors: ButtonColors.DrawerNav
				})
				: null,
			logins.isInternalUserLoggedIn()
				? m(ButtonN, {
					icon: () => BootIcons.Settings,
					label: "settings_label",
					click: () => m.route.set(navButtonRoutes.settingsUrl),
					type: ButtonType.ActionLarge,
					colors: ButtonColors.DrawerNav,
				})
				: null,
			m(ButtonN, {
				icon: () => BootIcons.Logout,
				label: "logout_label",
				click: () => m.route.set(LogoutUrl),
				type: ButtonType.ActionLarge,
				colors: ButtonColors.DrawerNav,
			}),
			isDesktop()
				? m(ButtonN, {
					icon: () => Icons.Power,
					label: "quit_action",
					click: () => nativeApp.invokeNative(new Request('closeApp', [])),
					type: ButtonType.ActionLarge,
					colors: ButtonColors.DrawerNav
				})
				: null,
		]))
	}
}