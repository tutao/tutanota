import m, { Children } from "mithril"
import { assertMainOrNode, SecondFactorType } from "@tutao/appEnv"
import { assertNotNull, LazyLoaded, neverNull, noOp } from "@tutao/utils"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { InfoLink, lang } from "../../../misc/LanguageViewModel.js"
import type { TableAttrs, TableLineAttrs } from "../../../gui/base/Table.js"
import { ColumnWidth, Table } from "../../../gui/base/Table.js"
import { restError } from "@tutao/restClient"
import { ifAllowedTutaLinks } from "../../../gui/base/GuiUtils.js"
import { locator } from "../../../api/main/CommonLocator.js"
import { SecondFactorEditDialog } from "./SecondFactorEditDialog.js"
import { SecondFactorTypeToNameTextId } from "./SecondFactorEditModel.js"
import { IconButtonAttrs } from "../../../gui/base/IconButton.js"
import { ButtonSize } from "../../../gui/base/ButtonSize.js"
import { appIdToLoginUrl } from "../../../misc/2fa/SecondFactorUtils.js"
import { DomainConfigProvider } from "../../../api/common/DomainConfigProvider.js"
import { MoreInfoLink } from "../../../misc/news/MoreInfoLink.js"
import { showRequestPasswordDialog } from "../../../misc/passwords/PasswordRequestDialog"
import { LoginFacade } from "../../../api/worker/facades/LoginFacade"
import { showProgressDialog } from "../../../gui/dialogs/ProgressDialog"
import { Dialog } from "../../../gui/base/Dialog"
import { assertEnumValue, entityUpdateUtils, sysTypeRefs } from "@tutao/typeRefs"

assertMainOrNode()

export class SecondFactorsEditForm {
	_2FALineAttrs: TableLineAttrs[]

	constructor(
		private readonly user: LazyLoaded<sysTypeRefs.User>,
		private readonly domainConfigProvider: DomainConfigProvider,
		private readonly loginFacade: LoginFacade,
		private askForPassword: boolean,
		private isDeactivated: boolean,
	) {
		this._2FALineAttrs = []

		this._updateSecondFactors()

		this.view = this.view.bind(this)
	}

	view(): Children {
		const secondFactorTableAttrs: TableAttrs = {
			columnHeading: ["name_label", "type_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			lines: this._2FALineAttrs,
			showActionButtonColumn: true,
			addButtonAttrs: {
				title: "addSecondFactor_action",
				click: () => {
					if (this.isDeactivated) {
						Dialog.message("userAccountDeactivated_msg")
					} else if (this.askForPassword) {
						this.showAddSecondFactorDialogWithPasswordCheck()
					} else {
						this.showAddSecondFactorDialog()
					}
				},
				icon: Icons.Plus,
				size: ButtonSize.Compact,
			},
		}
		return [
			m(".h4.mt-32", lang.get("secondFactorAuthentication_label")),
			m(Table, secondFactorTableAttrs),
			this.domainConfigProvider.getCurrentDomainConfig().firstPartyDomain
				? [
						ifAllowedTutaLinks(locator.logins, InfoLink.SecondFactor, (link) =>
							m(MoreInfoLink, {
								link: link,
								isSmall: true,
							}),
						),
					]
				: null,
		]
	}

	async _updateSecondFactors(): Promise<void> {
		const user = await this.user.getAsync()
		const factors = await locator.entityClient.loadAll(sysTypeRefs.SecondFactorTypeRef, neverNull(user.auth).secondFactors)
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
				click: () => {
					if (this.isDeactivated) {
						Dialog.message("userAccountDeactivated_msg")
					} else if (this.askForPassword) {
						this.removeSecondFactorWithPasswordCheck(f)
					} else {
						this.removeSecondFactor(f)
					}
				},
				icon: Icons.X,
				size: ButtonSize.Compact,
			}

			const factorName = this.formatSecondFactorName(f, loginDomains)
			const type = assertEnumValue(SecondFactorType, f.type)
			return {
				cells: [factorName, lang.get(SecondFactorTypeToNameTextId[type])],
				actionButtonAttrs: locator.logins.getUserController().isGlobalAdmin() ? removeButtonAttrs : null,
			}
		})
		m.redraw()
	}

	private formatSecondFactorName(factor: sysTypeRefs.SecondFactor, loginDomains: ReadonlySet<string>): string {
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

	private showAddSecondFactorDialogWithPasswordCheck() {
		const dialog = showRequestPasswordDialog({
			action: async (passphrase) => {
				try {
					const token = await this.loginFacade.getVerifierToken(passphrase)
					this.showAddSecondFactorDialog(token)
				} catch (e) {
					if (e instanceof restError.NotAuthorizedError) {
						return lang.get("invalidPassword_msg")
					} else {
						throw e
					}
				}
				dialog.close()
				return ""
			},
			cancel: {
				textId: "cancel_action",
				action: noOp,
			},
		})
	}

	private showAddSecondFactorDialog(token?: string) {
		SecondFactorEditDialog.loadAndShow(locator.entityClient, this.user, token)
	}

	private removeSecondFactorWithPasswordCheck(secondFactorToRemove: sysTypeRefs.SecondFactor) {
		const dialog = showRequestPasswordDialog({
			action: async (passphrase) => {
				let token = undefined
				try {
					token = await this.loginFacade.getVerifierToken(passphrase)
				} catch (e) {
					if (e instanceof restError.NotAuthorizedError) {
						return lang.get("invalidPassword_msg")
					} else {
						throw e
					}
				}
				this.removeSecondFactor(secondFactorToRemove, token)
				dialog.close()
				return ""
			},
			messageText: lang.get("confirmDeleteSecondFactor_msg"),
			cancel: {
				textId: "cancel_action",
				action: noOp,
			},
		})
	}

	private removeSecondFactor(secondFactorToRemove: sysTypeRefs.SecondFactor, token?: string) {
		try {
			let options = undefined
			if (token) {
				options = { extraHeaders: { token } }
			}
			showProgressDialog("pleaseWait_msg", locator.entityClient.erase(secondFactorToRemove, options))
		} catch (e) {
			if (e instanceof restError.NotFoundError) {
				console.log("could not delete second factor (already deleted)")
			} else {
				throw e
			}
		}
	}

	entityEventReceived(update: entityUpdateUtils.EntityUpdateData): Promise<void> {
		if (entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.SecondFactorTypeRef, update)) {
			return this._updateSecondFactors()
		} else {
			return Promise.resolve()
		}
	}
}
