import m, { Children } from "mithril"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { ExtendedNotificationMode } from "../../common/native/common/generatedipc/ExtendedNotificationMode.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { PushIdentifier, PushIdentifierTypeRef, User } from "../../common/api/entities/sys/TypeRefs.js"
import { locator } from "../../common/api/main/CommonLocator.js"
import { lang } from "../../common/misc/LanguageViewModel.js"
import { IconButton } from "../../common/gui/base/IconButton.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"
import { isApp, isBrowser, isDesktop } from "../../common/api/common/Env.js"
import { PushServiceType } from "../../common/api/common/TutanotaConstants.js"
import { mailLocator } from "../mailLocator.js"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { NotificationContentSelector } from "./NotificationContentSelector.js"
import { NotificationTargetsList, NotificationTargetsListAttrs } from "../../common/settings/NotificationTargetsList.js"
import { IdentifierRow } from "../../common/settings/IdentifierRow.js"
import { DropDownSelector, type DropDownSelectorAttrs } from "../../common/gui/base/DropDownSelector.js"
import { PermissionType } from "../../common/native/common/generatedipc/PermissionType.js"
import { NotificationSettingsViewerModel } from "./NotificationSettingsViewerModel"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { NotFoundError } from "../../common/api/common/error/RestError"

export class NotificationSettingsViewer implements UpdatableSettingsViewer {
	private extendedNotificationMode: ExtendedNotificationMode | null = null
	private readonly expanded: Stream<boolean>
	private readonly user: User
	private hasNotificationPermission: boolean = true
	private receiveCalendarNotifications: boolean = true
	private readonly model: NotificationSettingsViewerModel

	constructor() {
		this.expanded = stream<boolean>(false)
		this.user = locator.logins.getUserController().user
		this.model = new NotificationSettingsViewerModel(locator.pushService, this.user, locator.entityClient)

		if (isApp() || isDesktop()) {
			const promises: Promise<any>[] = [locator.pushService.getExtendedNotificationMode()]

			if (isApp()) {
				promises.push(
					locator.systemPermissionHandler.hasPermission(PermissionType.Notification),
					locator.pushService.getReceiveCalendarNotificationConfig(),
				)
			}
			Promise.all(promises).then(([extendedNotificationMode, hasPermission, canReceiveCalendarNotifications]) => {
				this.extendedNotificationMode = extendedNotificationMode
				if (isApp()) {
					if (this.hasNotificationPermission !== hasPermission) this.hasNotificationPermission = hasPermission
					if (this.receiveCalendarNotifications !== canReceiveCalendarNotifications)
						this.receiveCalendarNotifications = canReceiveCalendarNotifications
				}
				m.redraw()
			})
		}

		this.reloadPushIdentifiers()
	}

	private togglePushIdentifier(identifier: PushIdentifier) {
		identifier.disabled = !identifier.disabled
		locator.entityClient.update(identifier).then(() => m.redraw)

		if (!isBrowser() && identifier.identifier === this.model.getCurrentIdentifier()) {
			if (identifier.disabled) {
				locator.pushService.invalidateAlarmsForUser(this.user._id)
			} else {
				locator.pushService.reRegister()
			}
		}
	}

	view(): Children {
		const rowAdd = m(".full-width.flex-space-between.items-center.mb-8", [
			lang.get("emailPushNotification_action"),
			m(IconButton, {
				title: "emailPushNotification_action",
				click: () => this.showAddEmailNotificationDialog(),
				icon: Icons.Add,
				size: ButtonSize.Compact,
			}),
		])

		const rows = this.model.getLoadedPushIdentifiers().map((identifier) => {
			const isCurrentDevice = (isApp() || isDesktop()) && identifier.identifier === this.model.getCurrentIdentifier()

			return m(IdentifierRow, {
				name: this.identifierDisplayName(isCurrentDevice, identifier.pushServiceType, identifier.displayName),
				disabled: identifier.disabled,
				identifier: identifier.identifier,
				current: isCurrentDevice,
				removeClicked: () => {
					locator.entityClient.erase(identifier).catch(ofClass(NotFoundError, noOp))
				},
				formatIdentifier: identifier.pushServiceType !== PushServiceType.EMAIL,
				disableClicked: () => this.togglePushIdentifier(identifier),
			})
		})

		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m(".flex.col", [
				m(".flex-space-between.items-center.mt-32.mb-8", [m(".h4", lang.get("notificationSettings_action"))]),
				this.extendedNotificationMode
					? m(
							"#content",
							m(NotificationContentSelector, {
								extendedNotificationMode: this.extendedNotificationMode,
								onChange: (value: ExtendedNotificationMode) => {
									locator.pushService.setExtendedNotificationMode(value)
									this.extendedNotificationMode = value
									// We can assume "true" because onChange is only triggered if permission was granted
									this.hasNotificationPermission = true
								},
							}),
						)
					: null,
				isApp() ? this.renderCalendarNotificationsDropdown() : null,
				m("#targets", m(NotificationTargetsList, { rows, rowAdd, onExpandedChange: this.expanded } satisfies NotificationTargetsListAttrs)),
			]),
		])
	}

	private renderCalendarNotificationsDropdown(): Children {
		return m(DropDownSelector, {
			label: "receiveCalendarNotifications_label",
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
			],
			selectedValue: this.receiveCalendarNotifications,
			selectionChangedHandler: async (value) => {
				if (this.receiveCalendarNotifications !== value) {
					locator.pushService.setReceiveCalendarNotificationConfig(value)
					this.receiveCalendarNotifications = value
					if (value) {
						await locator.pushService.reRegister()
					} else {
						await locator.pushService.invalidateAlarmsForUser(this.user._id)
					}
				}
			},
			disabled: !this.hasNotificationPermission,
			selectedValueDisplay: !this.hasNotificationPermission ? lang.get("deactivated_label") : undefined,
		} satisfies DropDownSelectorAttrs<boolean>)
	}

	private async showAddEmailNotificationDialog() {
		const dialog = await mailLocator.addNotificationEmailDialog()
		dialog.show()
	}

	private identifierDisplayName(current: boolean, type: NumberString, displayName: string): string {
		if (current) {
			return lang.get("pushIdentifierCurrentDevice_label")
		} else if (displayName) {
			return displayName
		} else {
			return ["Android FCM", "iOS", lang.get("adminEmailSettings_action"), "Android Tutanota"][Number(type)]
		}
	}

	async entityEventsReceived(updates: readonly EntityUpdateData[]): Promise<void> {
		if (updates.some((update) => isUpdateForTypeRef(PushIdentifierTypeRef, update))) {
			await this.reloadPushIdentifiers()
		}
	}

	private async reloadPushIdentifiers() {
		await this.model.reload()
		m.redraw()
	}
}
