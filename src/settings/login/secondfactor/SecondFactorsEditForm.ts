import m, { Children } from "mithril"
import { assertMainOrNode, isTutanotaDomain } from "../../../api/common/Env.js"
import type { User } from "../../../api/entities/sys/TypeRefs.js"
import { SecondFactorTypeRef } from "../../../api/entities/sys/TypeRefs.js"
import { assertNotNull, LazyLoaded, neverNull, ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { Dialog } from "../../../gui/base/Dialog.js"
import { InfoLink, lang } from "../../../misc/LanguageViewModel.js"
import { assertEnumValue, SecondFactorType } from "../../../api/common/TutanotaConstants.js"
import { logins } from "../../../api/main/LoginController.js"
import { appIdToLoginDomain } from "../../../misc/2fa/SecondFactorHandler.js"
import { showProgressDialog } from "../../../gui/dialogs/ProgressDialog.js"
import type { TableAttrs, TableLineAttrs } from "../../../gui/base/Table.js"
import { ColumnWidth, Table } from "../../../gui/base/Table.js"
import { NotFoundError } from "../../../api/common/error/RestError.js"
import type { EntityUpdateData } from "../../../api/main/EventController.js"
import { isUpdateForTypeRef } from "../../../api/main/EventController.js"
import { ifAllowedTutanotaLinks } from "../../../gui/base/GuiUtils.js"
import { locator } from "../../../api/main/MainLocator.js"
import { SecondFactorEditDialog } from "./SecondFactorEditDialog.js"
import { SecondFactorTypeToNameTextId } from "./SecondFactorEditModel.js"
import { IconButtonAttrs } from "../../../gui/base/IconButton.js"
import { ButtonSize } from "../../../gui/base/ButtonSize.js"

assertMainOrNode()

export class SecondFactorsEditForm {
	_2FALineAttrs: TableLineAttrs[]
	_user: LazyLoaded<User>

	constructor(user: LazyLoaded<User>) {
		this._2FALineAttrs = []
		this._user = user

		this._updateSecondFactors()
	}

	view(): Children {
		const secondFactorTableAttrs: TableAttrs = {
			columnHeading: ["name_label", "type_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			lines: this._2FALineAttrs,
			showActionButtonColumn: true,
			addButtonAttrs: {
				title: "addSecondFactor_action",
				click: () => this._showAddSecondFactorDialog(),
				icon: Icons.Add,
				size: ButtonSize.Compact,
			},
		}
		return [
			m(".h4.mt-l", lang.get("secondFactorAuthentication_label")),
			m(Table, secondFactorTableAttrs),
			isTutanotaDomain()
				? [
						m("span.small", lang.get("moreInfo_msg") + " "),
						ifAllowedTutanotaLinks(InfoLink.SecondFactor, (link) => m("span.small.text-break", [m(`a[href=${link}][target=_blank]`, link)])),
				  ]
				: null,
		]
	}

	async _updateSecondFactors(): Promise<void> {
		const user = await this._user.getAsync()
		const factors = await locator.entityClient.loadAll(SecondFactorTypeRef, neverNull(user.auth).secondFactors)
		// If we have keys registered on multiple domains (read: whitelabel) then we display domain for each
		const loginDomains = new Set<string>()

		for (const f of factors) {
			const isU2F = f.type === SecondFactorType.u2f || f.type === SecondFactorType.webauthn

			if (isU2F) {
				const loginDomain = appIdToLoginDomain(assertNotNull(f.u2f).appId)
				loginDomains.add(loginDomain)
			}
		}

		this._2FALineAttrs = factors.map((f) => {
			const isU2F = f.type === SecondFactorType.u2f || f.type === SecondFactorType.webauthn
			const removeButtonAttrs: IconButtonAttrs = {
				title: "remove_action",
				click: () =>
					Dialog.confirm("confirmDeleteSecondFactor_msg")
						.then((res) => (res ? showProgressDialog("pleaseWait_msg", locator.entityClient.erase(f)) : Promise.resolve()))
						.catch(ofClass(NotFoundError, (e) => console.log("could not delete second factor (already deleted)", e))),
				icon: Icons.Cancel,
				size: ButtonSize.Compact,
			}
			const domainInfo = isU2F && loginDomains.size > 1 ? (f.name.length > 0 ? " - " : "") + appIdToLoginDomain(neverNull(f.u2f).appId) : ""
			const type = assertEnumValue(SecondFactorType, f.type)
			return {
				cells: [f.name + domainInfo, lang.get(SecondFactorTypeToNameTextId[type])],
				actionButtonAttrs: logins.getUserController().isGlobalOrLocalAdmin() ? removeButtonAttrs : null,
			}
		})
		m.redraw()
	}

	_showAddSecondFactorDialog() {
		const mailAddress = assertNotNull(logins.getUserController().userGroupInfo.mailAddress)
		SecondFactorEditDialog.loadAndShow(locator.entityClient, this._user, mailAddress)
	}

	entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(SecondFactorTypeRef, update)) {
			return this._updateSecondFactors()
		} else {
			return Promise.resolve()
		}
	}
}
