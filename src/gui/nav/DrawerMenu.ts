import m, {Children, Component, Vnode} from "mithril"
import {Button, ButtonColor, ButtonType} from "../base/Button.js"
import {BootIcons} from "../base/icons/BootIcons"
import {LogoutUrl} from "../Header.js"
import {isNewMailActionAvailable, showSupportDialog, showUpgradeDialog, writeInviteMail} from "./NavFunctions"
import {isDesktop, isIOSApp} from "../../api/common/Env"
import {logins} from "../../api/main/LoginController"
import {navButtonRoutes} from "../../misc/RouteChange"
import {getSafeAreaInsetLeft} from "../HtmlUtils"
import {Icons} from "../base/icons/Icons"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import {createDropdown} from "../base/Dropdown.js"
import {keyManager} from "../../misc/KeyManager"
import {CounterBadge} from "../base/CounterBadge.js"
import {px} from "../size.js"
import {theme} from "../theme.js"
import {showUsageTestOptInDialog} from "../../misc/UsageTestModel.js"
import {locator} from "../../api/main/MainLocator.js"

type Attrs = {
	openNewWindow(): unknown
}

export class DrawerMenu implements Component<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		const showUsageDataOptInIndicator = locator.usageTestModel ? locator.usageTestModel.showOptInIndicator() : false

		return m(
			"drawer-menu" + landmarkAttrs(AriaLandmarks.Contentinfo, "drawer menu"),
			{
				style: {
					"padding-left": getSafeAreaInsetLeft(),
				},
			},
			m(".flex.col.height-100p.items-center.pt.pb", [
				m(".flex-grow"),
				logins.isUserLoggedIn() && showUsageDataOptInIndicator
					?
					m(".news-button", [
						m(ButtonN, {
							icon: () => Icons.Bulb,
							label: "news_label",
							click: showUsageTestOptInDialog,
							type: ButtonType.ActionLarge,
							colors: ButtonColor.DrawerNav,
						}),
						m(CounterBadge, {
							count: 1,
							position: {
								top: px(0),
								right: px(3),
							},
							color: "white",
							background: theme.list_accent_fg,
						}),
					])
					: null,
				logins.isGlobalAdminUserLoggedIn() && logins.getUserController().isPremiumAccount()
					? m(Button, {
						icon: () => Icons.Gift,
						label: "buyGiftCard_label",
						click: () => {
							m.route.set("/settings/subscription")
							import("../../subscription/giftcards/PurchaseGiftCardDialog").then(({showPurchaseGiftCardDialog}) => {
								return showPurchaseGiftCardDialog()
							})
						},
						type: ButtonType.ActionLarge,
						colors: ButtonColor.DrawerNav,
					})
					: null,
				isDesktop()
					? m(Button, {
						icon: () => Icons.NewWindow,
						label: "openNewWindow_action",
						click: () => {
							vnode.attrs.openNewWindow()
						},
						type: ButtonType.ActionLarge,
						colors: ButtonColor.DrawerNav,
					})
					: null,
				!isIOSApp() && logins.isUserLoggedIn() && logins.getUserController().isFreeAccount()
					? m(Button, {
						icon: () => BootIcons.Premium,
						label: "upgradePremium_label",
						click: () => showUpgradeDialog(),
						type: ButtonType.ActionLarge,
						colors: ButtonColor.DrawerNav,
					})
					: null,
				m(
					Button,
					{
						label: "showHelp_action",
						icon: () => BootIcons.Help,
						type: ButtonType.ActionLarge,
						click: (e, dom) => {
							if (logins.isUserLoggedIn() && logins.getUserController().isPremiumAccount()) {
								createDropdown({
									width: 300,
									lazyButtons: () => [
										{
											label: "supportMenu_label",
											click: () => showSupportDialog(),
										},
										{
											label: "keyboardShortcuts_title",
											click: () => keyManager.openF1Help(true),
										},
									],
								})(e, dom)
							} else {
								keyManager.openF1Help()
							}
						},
						noBubble: true,
						colors: ButtonColor.DrawerNav,
					},
				),
				isNewMailActionAvailable() && logins.getUserController().isGlobalAdmin()
					? m(Button, {
						icon: () => BootIcons.Share,
						label: "invite_alt",
						click: () => writeInviteMail(),
						type: ButtonType.ActionLarge,
						colors: ButtonColor.DrawerNav,
					})
					: null,
				logins.isInternalUserLoggedIn()
					? m(Button, {
						icon: () => BootIcons.Settings,
						label: "settings_label",
						click: () => m.route.set(navButtonRoutes.settingsUrl),
						type: ButtonType.ActionLarge,
						colors: ButtonColor.DrawerNav,
					})
					: null,
				m(Button, {
					icon: () => BootIcons.Logout,
					label: "logout_label",
					click: () => m.route.set(LogoutUrl),
					type: ButtonType.ActionLarge,
					colors: ButtonColor.DrawerNav,
				}),
			]),
		)
	}
}