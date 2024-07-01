import m, { Children } from "mithril"
import { assertMainOrNode } from "../../../../common/api/common/Env.js"
import type { SecondFactor, User } from "../../../../common/api/entities/sys/TypeRefs.js"
import { SecondFactorTypeRef } from "../../../../common/api/entities/sys/TypeRefs.js"
import { assertNotNull, LazyLoaded, neverNull, ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { Dialog } from "../../../../common/gui/base/Dialog.js"
import { InfoLink, lang } from "../../../../common/misc/LanguageViewModel.js"
import { assertEnumValue, SecondFactorType } from "../../../../common/api/common/TutanotaConstants.js"
import { showProgressDialog } from "../../../../common/gui/dialogs/ProgressDialog.js"
import type { TableAttrs, TableLineAttrs } from "../../../../common/gui/base/Table.js"
import { ColumnWidth, Table } from "../../../../common/gui/base/Table.js"
import { NotFoundError } from "../../../../common/api/common/error/RestError.js"
import { ifAllowedTutaLinks } from "../../../../common/gui/base/GuiUtils.js"
<<<<<<<< HEAD:src/common/settings/login/secondfactor/SecondFactorsEditForm.ts
import { locator } from "../../../../common/api/main/CommonLocator.js"
========
import { locator } from "../../../../common/api/main/MainLocator.js"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/settings/login/secondfactor/SecondFactorsEditForm.ts
import { SecondFactorEditDialog } from "./SecondFactorEditDialog.js"
import { SecondFactorTypeToNameTextId } from "./SecondFactorEditModel.js"
import { IconButtonAttrs } from "../../../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { appIdToLoginUrl } from "../../../../common/misc/2fa/SecondFactorUtils.js"
import { DomainConfigProvider } from "../../../../common/api/common/DomainConfigProvider.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../common/api/common/utils/EntityUpdateUtils.js"
import { MoreInfoLink } from "../../../../common/misc/news/MoreInfoLink.js"

assertMainOrNode()

export class SecondFactorsEditForm {
	_2FALineAttrs: TableLineAttrs[]

	constructor(private readonly user: LazyLoaded<User>, private readonly domainConfigProvider: DomainConfigProvider) {
		this._2FALineAttrs = []

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
			this.domainConfigProvider.getCurrentDomainConfig().firstPartyDomain
				? [ifAllowedTutaLinks(locator.logins, InfoLink.SecondFactor, (link) => m(MoreInfoLink, { link: link, isSmall: true }))]
				: null,
		]
	}

	async _updateSecondFactors(): Promise<void> {
		const user = await this.user.getAsync()
		const factors = await locator.entityClient.loadAll(SecondFactorTypeRef, neverNull(user.auth).secondFactors)
		// If we have keys registered on multiple domains (read: whitelabel) then we display domain for each
		const loginDomains = new Set<string>()

		for (const f of factors) {
			const isU2F = f.type === SecondFactorType.u2f || f.type === SecondFactorType.webauthn

			if (isU2F) {
				const loginDomain = appIdToLoginUrl(assertNotNull(f.u2f).appId, this.domainConfigProvider)
				loginDomains.add(loginDomain)
			}
		}

		this._2FALineAttrs = factors.map((f) => {
			const removeButtonAttrs: IconButtonAttrs = {
				title: "remove_action",
				click: () =>
					Dialog.confirm("confirmDeleteSecondFactor_msg")
						.then((res) => (res ? showProgressDialog("pleaseWait_msg", locator.entityClient.erase(f)) : Promise.resolve()))
						.catch(ofClass(NotFoundError, (e) => console.log("could not delete second factor (already deleted)", e))),
				icon: Icons.Cancel,
				size: ButtonSize.Compact,
			}

			const factorName = this.formatSecondFactorName(f, loginDomains)
			const type = assertEnumValue(SecondFactorType, f.type)
			return {
				cells: [factorName, lang.get(SecondFactorTypeToNameTextId[type])],
				actionButtonAttrs: locator.logins.getUserController().isGlobalOrLocalAdmin() ? removeButtonAttrs : null,
			}
		})
		m.redraw()
	}

	private formatSecondFactorName(factor: SecondFactor, loginDomains: ReadonlySet<string>): string {
		const isU2F = factor.type === SecondFactorType.u2f || factor.type === SecondFactorType.webauthn
		// we only show the domains when we have keys registered for different domains
		const requiresDomainDisambiguation = isU2F && loginDomains.size > 1

		if (requiresDomainDisambiguation) {
			const prefix = factor.name.length > 0 ? " - " : ""
			const loginUrlString = appIdToLoginUrl(neverNull(factor.u2f).appId, this.domainConfigProvider)
			const loginDomain = new URL(loginUrlString).hostname
			return factor.name + prefix + loginDomain
		} else {
			return factor.name
		}
	}

	_showAddSecondFactorDialog() {
		const mailAddress = assertNotNull(locator.logins.getUserController().userGroupInfo.mailAddress)
		SecondFactorEditDialog.loadAndShow(locator.entityClient, this.user, mailAddress)
	}

	entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(SecondFactorTypeRef, update)) {
			return this._updateSecondFactors()
		} else {
			return Promise.resolve()
		}
	}
}
