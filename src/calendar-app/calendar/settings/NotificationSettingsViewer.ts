import m, { Children } from "mithril"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"
import { PushIdentifier, PushIdentifierTypeRef, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { isApp, isDesktop } from "../../../common/api/common/Env.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { IdentifierRow } from "../../../mail-app/settings/IdentifierRow.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { PushServiceType } from "../../../common/api/common/TutanotaConstants.js"
import { SettingsNotificationTargets, SettingsNotificationTargetsAttrs } from "../../../common/settings/SettingsNotificationTargets.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { calendarLocator } from "../../calendarLocator.js"
import { PushIdentifierAppType } from "../../../common/native/main/NativePushServiceApp.js"

export class NotificationSettingsViewer implements UpdatableSettingsViewer {
	private currentIdentifier: string | null = null
	private readonly expanded: Stream<boolean>
	private readonly user: User
	private identifiers: PushIdentifier[]

	constructor() {
		this.expanded = stream<boolean>(false)
		this.identifiers = []
		this.user = calendarLocator.logins.getUserController().user
		this.loadPushIdentifiers()
	}

	private disableIdentifier(identifier: PushIdentifier) {
		identifier.disabled = !identifier.disabled
		calendarLocator.entityClient.update(identifier).then(m.redraw)
	}

	view(): Children {
		const rows = this.identifiers
			.map((identifier) => {
				const isCurrentDevice = (isApp() || isDesktop()) && identifier.identifier === this.currentIdentifier

				return m(IdentifierRow, {
					name: this.identifierDisplayName(isCurrentDevice, identifier.pushServiceType, identifier.displayName),
					disabled: identifier.disabled,
					identifier: identifier.identifier,
					current: isCurrentDevice,
					removeClicked: () => {
						calendarLocator.entityClient.erase(identifier).catch(ofClass(NotFoundError, noOp))
					},
					formatIdentifier: identifier.pushServiceType !== PushServiceType.EMAIL,
					disableClicked: () => this.disableIdentifier(identifier),
				})
			})
			.sort((l, r) => +r.attrs.current - +l.attrs.current)

		return m(".fill-absolute.scroll.plr-l.pb-xl", [
			m(".flex.col", [
				m(".flex-space-between.items-center.mt-l.mb-s", [m(".h4", lang.get("notificationSettings_action"))]),
				m(SettingsNotificationTargets, { rowAdd: null, rows, onExpandedChange: this.expanded } satisfies SettingsNotificationTargetsAttrs),
			]),
		])
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

	private async loadPushIdentifiers() {
		this.currentIdentifier = this.getCurrentIdentifier()
		const list = this.user.pushIdentifierList

		if (list) {
			this.identifiers = (await calendarLocator.entityClient.loadAll(PushIdentifierTypeRef, list.list)).filter(
				(identifier) => identifier.app === PushIdentifierAppType.Calendar,
			) // Filter out mail targets

			m.redraw()
		}
	}

	private getCurrentIdentifier(): string | null {
		return isApp() || isDesktop() ? calendarLocator.pushService.getLoadedPushIdentifier() : null
	}

	async entityEventsReceived(updates: readonly EntityUpdateData[]): Promise<void> {
		for (let update of updates) {
			if (isUpdateForTypeRef(PushIdentifierTypeRef, update)) {
				await this.loadPushIdentifiers()
			}
		}
	}
}
