import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { lang, TranslationText } from "../../../common/misc/LanguageViewModel.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { calendarLocator } from "../../calendarLocator.js"
import { SettingsFolder } from "../../../common/settings/SettingsFolder.js"
import { SettingsNavButton, SettingsNavButtonAttrs } from "../../gui/SettingsNavButton.js"
import { NavButtonAttrs, NavButtonColor } from "../../../common/gui/base/NavButton.js"
import { AboutDialog } from "../../../common/settings/AboutDialog.js"
import { theme } from "../../../common/gui/theme.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { LoginSettingsViewer } from "../../../common/settings/login/LoginSettingsViewer.js"
import { isApp, isIOSApp } from "../../../common/api/common/Env.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { AppearanceSettingsViewer } from "../../../common/settings/AppearanceSettingsViewer.js"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer.js"
import stream from "mithril/stream"
import { FeatureType } from "../../../common/api/common/TutanotaConstants.js"
import { SubscriptionViewer } from "../../../common/subscription/SubscriptionViewer.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { PaymentViewer } from "../../../common/subscription/PaymentViewer.js"
import { ReferralSettingsViewer } from "../../../common/settings/ReferralSettingsViewer.js"
import { GlobalSettingsViewer } from "./GlobalSettingsViewer.js"
import { WhitelabelSettingsViewer } from "../../../common/settings/whitelabel/WhitelabelSettingsViewer.js"

interface SettingsPopupAttrs {
	logins: LoginController
}

class SettingsPopup implements Component<SettingsPopupAttrs> {
	private readonly userFolders: SettingsFolder<unknown>[]
	private readonly adminFolders: SettingsFolder<unknown>[]
	private readonly subscriptionFolders: SettingsFolder<unknown>[]
	private showBusinessSettings: stream<boolean> = stream(false)
	private currentView: Children = null

	constructor() {
		this.userFolders = [
			new SettingsFolder(
				"login_label",
				() => BootIcons.Contacts,
				"login",
				() => new LoginSettingsViewer(calendarLocator.credentialsProvider, isApp() ? calendarLocator.systemFacade : null),
				undefined,
			),
			new SettingsFolder(
				"appearanceSettings_label",
				() => Icons.Palette,
				"appearance",
				() => new AppearanceSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				"notificationSettings_action",
				() => Icons.Bell,
				"notifications",
				() => new NotificationSettingsViewer(),
				undefined,
			),
		]

		this.adminFolders = []
		this.subscriptionFolders = []
	}

	oncreate(vnode: Vnode<SettingsPopupAttrs>) {
		this.populateAdminFolders(vnode.attrs.logins)
		this.populateSubscriptionFolders(vnode.attrs.logins)
	}

	private async populateSubscriptionFolders(logins: LoginController) {
		if (logins.isEnabled(FeatureType.WhitelabelChild) || !logins.getUserController().isGlobalAdmin()) {
			return
		}

		const currentPlanType = await logins.getUserController().getPlanType()

		this.subscriptionFolders.push(
			new SettingsFolder<void>(
				"adminSubscription_action",
				() => BootIcons.Premium,
				"subscription",
				() => new SubscriptionViewer(currentPlanType, isIOSApp() ? locator.mobilePaymentsFacade : null, locator.appStorePaymentPicker),
				undefined,
			).setIsVisibleHandler(() => !isIOSApp() || !logins.getUserController().isFreeAccount()),
		)

		this.subscriptionFolders.push(
			new SettingsFolder<void>(
				"adminPayment_action",
				() => Icons.CreditCard,
				"invoice",
				() => new PaymentViewer(),
				undefined,
			),
		)

		this.subscriptionFolders.push(
			new SettingsFolder(
				"referralSettings_label",
				() => BootIcons.Share,
				"referral",
				() => new ReferralSettingsViewer(),
				undefined,
			).setIsVisibleHandler(() => !this.showBusinessSettings()),
		)

		m.redraw()
	}

	private async populateAdminFolders(logins: LoginController) {
		await this.updateShowBusinessSettings(logins)

		if (!logins.getUserController().isGlobalAdmin()) {
			return
		}

		this.adminFolders.push(
			new SettingsFolder(
				"globalSettings_label",
				() => BootIcons.Settings,
				"global",
				() => new GlobalSettingsViewer(),
				undefined,
			),
		)

		if (!logins.isEnabled(FeatureType.WhitelabelChild) && !isIOSApp()) {
			this.adminFolders.push(
				new SettingsFolder(
					"whitelabel_label",
					() => Icons.Wand,
					"whitelabel",
					() => new WhitelabelSettingsViewer(calendarLocator.entityClient, logins),
					undefined,
				),
			)
		}
		m.redraw()
	}

	private async updateShowBusinessSettings(logins: LoginController) {
		this.showBusinessSettings((await logins.getUserController().loadCustomer()).businessUse)
	}

	view(vnode: Vnode<SettingsPopupAttrs>) {
		return this.getCurrentView(vnode.attrs.logins)
	}

	private getCurrentView(logins: LoginController) {
		if (this.currentView == null) {
			this.currentView = this.renderMainView(logins)
		}

		return this.currentView
	}

	private renderMainView(logins: LoginController) {
		return m(".flex.flex-grow.col.full-height", [
			this.renderSettingsNavigation(this.userFolders, "userSettings_label"),
			this.renderLoggedInNavigationLinks(logins),
			calendarLocator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain ? this._aboutThisSoftwareLink() : null,
		])
	}

	_aboutThisSoftwareLink(): Children {
		const label = lang.get("about_label")
		const versionLabel = `Tuta v${env.versionNumber}`
		return m(".pb.pt-l.flex-no-shrink.flex.col.justify-end", [
			m(
				"button.text-center.small.no-text-decoration",
				{
					style: {
						backgroundColor: "transparent",
					},
					href: "#",
					"aria-label": label,
					"aria-description": versionLabel,
					"aria-haspopup": "dialog",
					onclick: () => {
						setTimeout(() => {
							const dialog = Dialog.showActionDialog({
								title: () => lang.get("about_label"),
								child: () =>
									m(AboutDialog, {
										onShowSetupWizard: () => {
											dialog.close()
											calendarLocator.showSetupWizard()
										},
									}),
								allowOkWithReturn: true,
								okAction: (dialog: Dialog) => dialog.close(),
								allowCancel: false,
							})
						}, 200)
					},
				},
				[
					m("", versionLabel),
					m(
						".b",
						{
							style: {
								color: theme.navigation_button_selected,
							},
						},
						label,
					),
				],
			),
		])
	}

	private renderLoggedInNavigationLinks(logins: LoginController) {
		if (!logins.isUserLoggedIn()) {
			return m.fragment({}, [])
		}

		return m.fragment({}, [
			this.renderSettingsNavigation(this.adminFolders, "adminSettings_label"),
			this.renderSettingsNavigation(this.subscriptionFolders, "subscriptionSettings_label"),
		])
	}

	_createSettingsFolderNavButton(folder: SettingsFolder<unknown>): NavButtonAttrs {
		return {
			label: folder.name,
			icon: folder.icon,
			href: folder.url,
			colors: NavButtonColor.Nav,
			click: () => {
				this.currentView = m(folder.viewerCreator())
				m.redraw()
			},
			persistentBackground: true,
		}
	}

	renderSettingsNavigation(folders: SettingsFolder<unknown>[], title: TranslationText): Children {
		if (folders.length === 0) {
			return null
		}

		return m(".flex.col.pr-m.pl-vpad-m.pt-s.pb-s", [
			m("span.uppercase.pb-s", lang.getMaybeLazy(title)),
			m(
				".flex.col.border-radius-m.list-bg",
				folders
					.filter((folder) => folder.isVisible())
					.map((folder) => {
						const buttonAttrs = this._createSettingsFolderNavButton(folder)

						return m(SettingsNavButton, {
							label: buttonAttrs.label,
							click: buttonAttrs.click ?? (() => null),
							icon: buttonAttrs.icon,
							class: "settings-item",
						} satisfies SettingsNavButtonAttrs)
					}),
			),
		])
	}
}

export function showSettingsDialog(logins: LoginController) {
	return Dialog.createSettingsDialog({
		title: stream("settings_label"),
		child: () =>
			m(SettingsPopup, {
				logins,
			}),
		navigationAction: () => null,
		navigationTextId: stream("close_alt"),
	}).show()
}
