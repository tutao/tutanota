import { SelectMailAddressForm, SelectMailAddressFormAttrs } from "../../../common/settings/SelectMailAddressForm.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { getAliasLineAttrs } from "../../../common/settings/mailaddress/MailAddressTable.js"
import type { AddDomainData } from "./AddDomainWizard"
import { CustomerTypeRef, GroupInfoTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import { neverNull } from "@tutao/tutanota-utils"
import { Dialog } from "../../../common/gui/base/Dialog"
import { locator } from "../../../common/api/main/CommonLocator"
import type { TranslationKey } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { TableAttrs } from "../../../common/gui/base/Table.js"
import { ColumnWidth, Table } from "../../../common/gui/base/Table.js"
import type { WizardPageAttrs } from "../../../common/gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../../common/gui/base/WizardDialog.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { InvalidDataError, LimitReachedError } from "../../../common/api/common/error/RestError"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { UpgradeRequiredError } from "../../../common/api/main/UpgradeRequiredError.js"
import { showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs.js"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton.js"

assertMainOrNode()

/**
 * Part of the custom domain wizard where user can add mail addresses for the new domain.
 */
export class AddEmailAddressesPage implements Component<AddEmailAddressesPageAttrs> {
	oncreate({ attrs }: VnodeDOM<AddEmailAddressesPageAttrs>) {
		attrs.data.editAliasFormAttrs.model.init()
	}

	onremove({ attrs }: Vnode<AddEmailAddressesPageAttrs>) {
		// MailAddressTableModel.dispose is handled by the AddDomainWizard close action in order to allow going back and forth navigation within the wizard dialog.
	}

	view(vnode: Vnode<AddEmailAddressesPageAttrs>): Children {
		const a = vnode.attrs
		const aliasesTableAttrs: TableAttrs = {
			columnWidths: [ColumnWidth.Largest],
			showActionButtonColumn: true,
			addButtonAttrs: null,
			lines: getAliasLineAttrs(a.data.editAliasFormAttrs).map((row) => {
				return {
					actionButtonAttrs: row.actionButtonAttrs ?? null,
					cells: row.cells,
				}
			}),
		}
		let domainInfo = { domain: a.data.domain(), isPaid: false }
		const mailFormAttrs: SelectMailAddressFormAttrs = {
			selectedDomain: domainInfo,
			// it is a custom domain so it's not a special one
			availableDomains: [domainInfo],
			onValidationResult: (email, validationResult) => {
				if (validationResult.isValid) {
					a.mailAddress = email
					a.errorMessageId = null
				} else {
					a.errorMessageId = validationResult.errorId
				}
			},
			onDomainChanged: (domain) => (domainInfo = domain),
			onBusyStateChanged: (isBusy) => (a.isMailVerificationBusy = isBusy),
			injectionsRightButtonAttrs: {
				title: "addEmailAlias_label",
				icon: Icons.Add,
				size: ButtonSize.Compact,
				click: () =>
					vnode.attrs.addAliasFromInput().then(() => {
						m.redraw()
					}),
			},
		}
		return m("", [
			m("h4.mt-l.text-center", lang.get("addCustomDomainAddresses_title")),
			m(".mt.mb", lang.get("addCustomDomainAddAdresses_msg")),
			m(SelectMailAddressForm, mailFormAttrs),
			locator.logins.getUserController().userGroupInfo.mailAddressAliases.length ? m(Table, aliasesTableAttrs) : null,
			m(
				".flex-center.full-width.pt-l.mb-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: "next_action",
						onclick: () => emitWizardEvent((vnode as VnodeDOM<AddEmailAddressesPageAttrs>).dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE),
					}),
				),
			),
		])
	}
}

export class AddEmailAddressesPageAttrs implements WizardPageAttrs<AddDomainData> {
	data: AddDomainData
	mailAddress: string
	errorMessageId: TranslationKey | null
	isMailVerificationBusy: boolean

	constructor(domainData: AddDomainData) {
		this.data = domainData
		this.mailAddress = ""
		this.errorMessageId = "mailAddressNeutral_msg" // we need to set this message id to prevent that an empty input is initially regarded as valid
		this.isMailVerificationBusy = false
	}

	headerTitle(): string {
		return lang.get("domainSetup_title")
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		if (this.isMailVerificationBusy) return Promise.resolve(false)

		//We try to add an alias from the input field, if it is not empty and error dialogs are allowed
		if (showErrorDialog && this.errorMessageId) {
			//We already showed one error dialog if failing to add an alias from the input field.
			//The user has to clean the input field up before proceeding to the next page (even if there is already an alias)
			//We are done if we succeeded to add the alias
			return this.addAliasFromInput()
		}

		//Otherwise we check that there is either an alias or a user (or an alias for some other user) defined for the custom domain regardless of activation status
		const checkMailAddresses = Promise.resolve().then(() => {
			const hasAliases = locator.logins
				.getUserController()
				.userGroupInfo.mailAddressAliases.some((alias) => alias.mailAddress.endsWith(`@${this.data.domain()}`))

			if (hasAliases) {
				return true
			} else {
				return locator.entityClient
					.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
					.then((customer) => locator.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups))
					.then((allUserGroupInfos) => {
						return allUserGroupInfos.some(
							(u) =>
								neverNull(u.mailAddress).endsWith("@" + this.data.domain()) ||
								u.mailAddressAliases.some((a) => neverNull(a.mailAddress).endsWith("@" + this.data.domain())),
						)
					})
			}
		})
		return showProgressDialog("pleaseWait_msg", checkMailAddresses).then((nextAllowed) => {
			if (showErrorDialog && !nextAllowed) Dialog.message("enforceAliasSetup_msg")
			return nextAllowed
		})
	}

	isSkipAvailable(): boolean {
		return true
	}

	isEnabled(): boolean {
		return true
	}

	/**
	 * Try to add an alias from input field and return true if it succeeded
	 */
	async addAliasFromInput(): Promise<boolean> {
		const error = this.errorMessageId

		if (error) {
			await Dialog.message(error)
			return false
		} else {
			const mailAddressTableModel = this.data.editAliasFormAttrs.model
			try {
				await showProgressDialog(
					"pleaseWait_msg",
					// Using default sender name for now
					mailAddressTableModel.addAlias(this.mailAddress, mailAddressTableModel.defaultSenderName()),
				)
				return true
			} catch (e) {
				if (e instanceof InvalidDataError) {
					await Dialog.message("mailAddressNA_msg")
				} else if (e instanceof LimitReachedError) {
					// ignore
				} else if (e instanceof UpgradeRequiredError) {
					await showPlanUpgradeRequiredDialog(e.plans, e.message)
				} else {
					throw e
				}
				return false
			}
		}
	}
}
