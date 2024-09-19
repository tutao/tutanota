import m, { Children, Component, Vnode } from "mithril"
import { ButtonColor } from "../base/Button.js"
import { BootIcons } from "../base/icons/BootIcons"
import { showSupportDialog, showUpgradeDialog } from "./NavFunctions"
import { isIOSApp } from "../../api/common/Env"
import { LogoutUrl, SETTINGS_PREFIX } from "../../misc/RouteChange"
import { getSafeAreaInsetLeft } from "../HtmlUtils"
import { Icons } from "../base/icons/Icons"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils"
import { createDropdown } from "../base/Dropdown.js"
import { keyManager } from "../../misc/KeyManager"
import { CounterBadge } from "../base/CounterBadge.js"
import { px, size } from "../size.js"
import { theme } from "../theme.js"
import { showNewsDialog } from "../../misc/news/NewsDialog.js"
import { LoginController } from "../../api/main/LoginController.js"
import { NewsModel } from "../../misc/news/NewsModel.js"
import { DesktopSystemFacade } from "../../native/common/generatedipc/DesktopSystemFacade.js"
import { styles } from "../styles.js"
import { IconButton } from "../base/IconButton.js"

export interface DrawerMenuAttrs {
	logins: LoginController
	newsModel: NewsModel
	desktopSystemFacade: DesktopSystemFacade | null
}

export class DrawerMenu implements Component<DrawerMenuAttrs> {
	view(vnode: Vnode<DrawerMenuAttrs>): Children {
		const { logins, newsModel, desktopSystemFacade } = vnode.attrs
		const liveNewsCount = newsModel.liveNewsIds.length

		const isInternalUser = logins.isInternalUserLoggedIn()
		const isLoggedIn = logins.isUserLoggedIn()
		const userController = logins.getUserController()

		return m(
			"drawer-menu.flex.col.items-center.pt.pb",
			{
				...landmarkAttrs(AriaLandmarks.Contentinfo, "drawer menu"),
				style: {
					"padding-left": getSafeAreaInsetLeft(),
					"border-top-right-radius": styles.isDesktopLayout() ? px(size.border_radius_larger) : "",
				},
			},
			[
				m(".flex-grow"),
				isInternalUser && isLoggedIn
					? m(".news-button", [
							m(IconButton, {
								icon: Icons.Bulb,
								title: "news_label",
								click: () => showNewsDialog(newsModel),
								colors: ButtonColor.DrawerNav,
							}),
							liveNewsCount > 0
								? m(CounterBadge, {
										count: liveNewsCount,
										position: {
											top: px(0),
											right: px(3),
										},
										color: "white",
										background: theme.list_accent_fg,
								  })
								: null,
					  ])
					: null,
				logins.isGlobalAdminUserLoggedIn() && userController.isPremiumAccount()
					? m(IconButton, {
							icon: Icons.Gift,
							title: "buyGiftCard_label",
							click: () => {
								m.route.set("/settings/subscription")
								import("../../subscription/giftcards/PurchaseGiftCardDialog").then(({ showPurchaseGiftCardDialog }) => {
									return showPurchaseGiftCardDialog()
								})
							},
							colors: ButtonColor.DrawerNav,
					  })
					: null,
				desktopSystemFacade
					? m(IconButton, {
							icon: Icons.NewWindow,
							title: "openNewWindow_action",
							click: () => {
								desktopSystemFacade.openNewWindow()
							},
							colors: ButtonColor.DrawerNav,
					  })
					: null,
				!isIOSApp() && isLoggedIn && userController.isFreeAccount()
					? m(IconButton, {
							icon: BootIcons.Premium,
							title: "upgradePremium_label",
							click: () => showUpgradeDialog(),
							colors: ButtonColor.DrawerNav,
					  })
					: null,
				m(IconButton, {
					title: "showHelp_action",
					icon: BootIcons.Help,
					click: (e, dom) =>
						createDropdown({
							width: 300,
							lazyButtons: () => [
								{
									label: "supportMenu_label",
									click: () => showSupportDialog(logins),
								},
								{
									label: "keyboardShortcuts_title",
									click: () => keyManager.openF1Help(true),
								},
							],
						})(e, dom),
					colors: ButtonColor.DrawerNav,
				}),
				isInternalUser
					? m(IconButton, {
							icon: BootIcons.Settings,
							title: "settings_label",
							click: () => m.route.set(SETTINGS_PREFIX),
							colors: ButtonColor.DrawerNav,
					  })
					: null,
				m(IconButton, {
					icon: BootIcons.Logout,
					title: "switchAccount_action",
					click: () => m.route.set(LogoutUrl),
					colors: ButtonColor.DrawerNav,
				}),
			],
		)
	}
}
