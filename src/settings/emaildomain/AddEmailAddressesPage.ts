import { SelectMailAddressForm, SelectMailAddressFormAttrs } from "../SelectMailAddressForm"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { getAliasLineAttrs } from "../mailaddress/MailAddressTable.js"
import type { AddDomainData } from "./AddDomainWizard"
import { CustomerTypeRef, GroupInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { neverNull, ofClass } from "@tutao/tutanota-utils"
import { Dialog } from "../../gui/base/Dialog"
import { locator } from "../../api/main/MainLocator"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { TableAttrs } from "../../gui/base/Table.js"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import { theme } from "../../gui/theme"
import type { WizardPageAttrs } from "../../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../gui/base/WizardDialog.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { InvalidDataError, LimitReachedError } from "../../api/common/error/RestError"
import { assertMainOrNode } from "../../api/common/Env"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import type Stream from "mithril/stream"

assertMainOrNode()

export class AddEmailAddressesPage implements Component<AddEmailAddressesPageAttrs> {
	private redrawSubscription: Stream<void> | null = null

	oncreate({ attrs }: VnodeDOM<AddEmailAddressesPageAttrs>) {
		attrs.data.editAliasFormAttrs.model.init()
		this.redrawSubscription = attrs.data.editAliasFormAttrs.model.redraw.map(m.redraw)
	}

	onremove({ attrs }: Vnode<AddEmailAddressesPageAttrs>) {
		attrs.data.editAliasFormAttrs.model.dispose()
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
		const mailFormAttrs: SelectMailAddressFormAttrs = {
			availableDomains: [a.data.domain()],
			onValidationResult: (email, validationResult) => {
				if (validationResult.isValid) {
					a.mailAddress = email
					a.errorMessageId = null
				} else {
					a.errorMessageId = validationResult.errorId
				}
			},
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
			m(".mt.mb", lang.get("addCustomDomainAdresses_msg")),
			m(".h4.mt", lang.get("emailAlias_label")),
			m(".mt", lang.get("addCustomDomainAliases_msg")),
			m(SelectMailAddressForm, mailFormAttrs),
			this.renderAliasCount(a),
			locator.logins.getUserController().userGroupInfo.mailAddressAliases.length ? m(Table, aliasesTableAttrs) : null,
			m(".h4.mt", lang.get("bookingItemUsers_label")),
			m(".mt", [
				lang.get("addCustomDomainUsers_msg"),
				" ",
				m(
					"span.nav-button",
					{
						style: {
							color: theme.content_accent,
						},
						onclick: (e: MouseEvent) => {
							this.showAddUsersDialog(e.target as HTMLElement)
						},
					},
					lang.get("adminUserList_action"),
				),
			]),
			m(
				".flex-center.full-width.pt-l.mb-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(Button, {
						type: ButtonType.Login,
						label: "next_action",
						click: () => emitWizardEvent((vnode as VnodeDOM<AddEmailAddressesPageAttrs>).dom as HTMLElement, WizardEventType.SHOWNEXTPAGE),
					}),
				),
			),
		])
	}

	private renderAliasCount(a: AddEmailAddressesPageAttrs): Children {
		const model = a.data.editAliasFormAttrs.model
		const aliasCount = model.aliasCount()
		if (aliasCount == null) {
			return null
		}
		return m(
			".small.left",
			aliasCount.availableToCreate === 0
				? lang.get("adminMaxNbrOfAliasesReached_msg")
				: lang.get("mailAddressAliasesMaxNbr_label", { "{1}": aliasCount.availableToCreate }),
		)
	}

	private showAddUsersDialog(dom: HTMLElement) {
		Dialog.showActionDialog({
			title: lang.get("addUsers_title"),
			child: {
				view: () => {
					return [m("p", lang.get("userManagementRedirect_msg"))]
				},
			},
			okAction: (confirmationDialog) => {
				m.route.set("/settings/users")
				confirmationDialog.close()
				emitWizardEvent(dom, WizardEventType.CLOSEDIALOG)
			},
		})
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
		this.errorMessageId = null
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
	addAliasFromInput(): Promise<boolean> {
		const error = this.errorMessageId

		if (error) {
			return Dialog.message(error).then(() => false)
		} else {
			const mailAddressTableModel = this.data.editAliasFormAttrs.model
			return showProgressDialog(
				"pleaseWait_msg",
				// Using default sender name for now
				mailAddressTableModel.addAlias(this.mailAddress, mailAddressTableModel.defaultSenderName()),
			)
				.then(() => {
					return true
				})
				.catch(ofClass(InvalidDataError, () => Dialog.message("mailAddressNA_msg").then(() => false)))
				.catch(ofClass(LimitReachedError, () => Dialog.message("adminMaxNbrOfAliasesReached_msg").then(() => false)))
		}
	}
}
