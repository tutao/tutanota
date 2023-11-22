import m, { Children, Component, Vnode } from "mithril"
import { Button, ButtonColor, ButtonType } from "../base/Button.js"
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

export interface DrawerMenuAttrs {
	logins: LoginController
	newsModel: NewsModel
	desktopSystemFacade: DesktopSystemFacade | null
}

export class DrawerMenu implements Component<DrawerMenuAttrs> {
	view(vnode: Vnode<DrawerMenuAttrs>): Children {
		const { logins, newsModel, desktopSystemFacade } = vnode.attrs
		const liveNewsCount = newsModel.liveNewsIds.length

		return m(
			"drawer-menu",
			{
				...landmarkAttrs(AriaLandmarks.Contentinfo, "drawer menu"),
				style: {
					"padding-left": getSafeAreaInsetLeft(),
					"border-top-right-radius": styles.isDesktopLayout() ? px(size.border_radius_big) : "",
				},
			},
			m(".flex.col.height-100p.items-center.pt.pb", [
				m(".flex-grow"),
				logins.isUserLoggedIn()
					? m(".news-button", [
							m(Button, {
								icon: () => Icons.Bulb,
								label: "news_label",
								click: () => showNewsDialog(newsModel),
								type: ButtonType.ActionLarge,
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
				logins.isGlobalAdminUserLoggedIn() && logins.getUserController().isPremiumAccount()
					? m(Button, {
							icon: () => Icons.Gift,
							label: "buyGiftCard_label",
							click: () => {
								m.route.set("/settings/subscription")
								import("../../subscription/giftcards/PurchaseGiftCardDialog").then(({ showPurchaseGiftCardDialog }) => {
									return showPurchaseGiftCardDialog()
								})
							},
							type: ButtonType.ActionLarge,
							colors: ButtonColor.DrawerNav,
					  })
					: null,
				desktopSystemFacade
					? m(Button, {
							icon: () => Icons.NewWindow,
							label: "openNewWindow_action",
							click: () => {
								desktopSystemFacade.openNewWindow()
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
				m(Button, {
					label: "showHelp_action",
					icon: () => BootIcons.Help,
					type: ButtonType.ActionLarge,
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
					noBubble: true,
					colors: ButtonColor.DrawerNav,
				}),
				logins.isInternalUserLoggedIn()
					? m(Button, {
							icon: () => BootIcons.Settings,
							label: "settings_label",
							click: () => m.route.set(SETTINGS_PREFIX),
							type: ButtonType.ActionLarge,
							colors: ButtonColor.DrawerNav,
					  })
					: null,
				m(Button, {
					icon: () => BootIcons.Logout,
					label: "switchAccount_action",
					click: () => m.route.set(LogoutUrl),
					type: ButtonType.ActionLarge,
					colors: ButtonColor.DrawerNav,
				}),
			]),
		)
	}
}
