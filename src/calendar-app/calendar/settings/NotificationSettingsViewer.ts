import m, { Children } from "mithril"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { IdentifierRow } from "../../../common/settings/IdentifierRow.js"
import { noOp, ofClass } from "@tutao/utils"
import { restError } from "@tutao/rest-client"
import { isApp, isBrowser, isDesktop, PushServiceType } from "@tutao/app-env"
import { NotificationTargetsList, NotificationTargetsListAttrs } from "../../../common/settings/NotificationTargetsList.js"
import { calendarLocator } from "../../calendarLocator.js"
import { AppType } from "../../../common/misc/ClientConstants.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { entityUpdateUtils, sysTypeRefs } from "@tutao/typerefs"

export class NotificationSettingsViewer implements UpdatableSettingsViewer {
	private currentIdentifier: string | null = null
	private readonly expanded: Stream<boolean>
	private readonly user: sysTypeRefs.User
	private identifiers: sysTypeRefs.PushIdentifier[]

	constructor() {
		this.expanded = stream<boolean>(false)
		this.identifiers = []
		this.user = calendarLocator.logins.getUserController().user
		this.loadPushIdentifiers()
	}

	private togglePushIdentifier(identifier: sysTypeRefs.PushIdentifier) {
		identifier.disabled = !identifier.disabled
		locator.entityClient.update(identifier).then(() => m.redraw)

		if (!isBrowser() && identifier.identifier === this.currentIdentifier) {
			if (identifier.disabled) {
				locator.pushService.invalidateAlarmsForUser(this.user._id)
			} else {
				locator.pushService.reRegister()
			}
		}
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
						calendarLocator.entityClient.erase(identifier).catch(ofClass(restError.NotFoundError, noOp))
					},
					formatIdentifier: identifier.pushServiceType !== PushServiceType.EMAIL,
					disableClicked: () => this.togglePushIdentifier(identifier),
				})
			})
			.sort((l, r) => +r.attrs.current - +l.attrs.current)

		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m(".flex.col", [
				m(".flex-space-between.items-center.mt-32.mb-8", [m(".h4", lang.get("notificationSettings_action"))]),
				m(NotificationTargetsList, { rowAdd: null, rows, onExpandedChange: this.expanded } satisfies NotificationTargetsListAttrs),
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
			this.identifiers = (await calendarLocator.entityClient.loadAll(sysTypeRefs.PushIdentifierTypeRef, list.list)).filter(
				(identifier) => identifier.app === AppType.Calendar,
			) // Filter out mail targets

			m.redraw()
		}
	}

	private getCurrentIdentifier(): string | null {
		const identifier = calendarLocator.pushService.getLoadedPushIdentifier()?.identifier
		return (isApp() || isDesktop()) && identifier ? identifier : null
	}

	async entityEventsReceived(updates: readonly entityUpdateUtils.EntityUpdateData[]): Promise<void> {
		for (let update of updates) {
			if (entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.PushIdentifierTypeRef, update)) {
				await this.loadPushIdentifiers()
			}
		}
	}
}
