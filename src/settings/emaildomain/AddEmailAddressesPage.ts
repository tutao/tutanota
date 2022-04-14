import {SelectMailAddressForm, SelectMailAddressFormAttrs} from "../SelectMailAddressForm"
import {logins} from "../../api/main/LoginController"
import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import {getAliasLineAttrs, updateNbrOfAliases} from "../EditAliasesFormN"
import type {AddDomainData} from "./AddDomainWizard"
import type {EntityEventsListener} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {GroupInfoTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {OperationType} from "../../api/common/TutanotaConstants"
import {neverNull, noOp, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {ActionDialogProps, Dialog} from "../../gui/base/Dialog"
import {locator} from "../../api/main/MainLocator"
import {CustomerTypeRef} from "../../api/entities/sys/TypeRefs.js"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {TableAttrs} from "../../gui/base/TableN"
import {ColumnWidth, TableN} from "../../gui/base/TableN"
import {theme} from "../../gui/theme"
import type {WizardPageAttrs} from "../../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../../gui/base/WizardDialogN"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {InvalidDataError, LimitReachedError} from "../../api/common/error/RestError"
import {isSameId} from "../../api/common/utils/EntityUtils"
import {assertMainOrNode} from "../../api/common/Env"
import {downcast} from "@tutao/tutanota-utils";
import {Icons} from "../../gui/base/icons/Icons";

assertMainOrNode()

export class AddEmailAddressesPage implements Component<AddEmailAddressesPageAttrs> {
	private _entityEventListener: EntityEventsListener | null = null

	oncreate(vnode: Vnode<AddEmailAddressesPageAttrs>) {
		const wizardAttrs = vnode.attrs

		this._entityEventListener = updates => {
			return promiseMap(updates, update => {
				const {instanceListId, instanceId, operation} = update

				if (
					isUpdateForTypeRef(GroupInfoTypeRef, update) &&
					operation === OperationType.UPDATE &&
					isSameId(logins.getUserController().userGroupInfo._id, [neverNull(instanceListId), instanceId])
				) {
					return locator.entityClient.load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then(groupInfo => {
						wizardAttrs.data.editAliasFormAttrs.userGroupInfo = groupInfo
						m.redraw()
					})
				}
			}).then(noOp)
		}

		locator.eventController.addEntityListener(this._entityEventListener)
		updateNbrOfAliases(wizardAttrs.data.editAliasFormAttrs)
	}

	onremove() {
		if (this._entityEventListener) {
			locator.eventController.removeEntityListener(this._entityEventListener)
		}
	}

	view(vnode: Vnode<AddEmailAddressesPageAttrs>): Children {
		const a = vnode.attrs
		const aliasesTableAttrs: TableAttrs = {
			columnWidths: [ColumnWidth.Largest],
			showActionButtonColumn: true,
			addButtonAttrs: null,
			lines: getAliasLineAttrs(a.data.editAliasFormAttrs).map(row => {
				return {
					actionButtonAttrs: row.actionButtonAttrs ?? null,
					cells: () => [
						{
							// @ts-ignore
							main: row.cells[0],
							// @ts-ignore
							info: [row.cells[1]],
						},
					],
				}
			}),
		}
		const addUsersDialogAttrs: ActionDialogProps = {
			title: lang.get("addUsers_title"),
			child: {
				view: () => {
					return [m("p", lang.get("userManagementRedirect_msg"))]
				},
			},
			okAction: confirmationDialog => {
				m.route.set("/settings/users")
				confirmationDialog.close()
				const vnodeDom = vnode as VnodeDOM<AddEmailAddressesPageAttrs>
				emitWizardEvent(vnodeDom.dom as HTMLElement, WizardEventType.CLOSEDIALOG)
			},
		}
		const mailFormAttrs: SelectMailAddressFormAttrs = {
			availableDomains: [a.data.domain()],
			onEmailChanged: (email, validationResult) => {
				if (validationResult.isValid) {
					a.mailAddress = email
					a.errorMessageId = null
				} else {
					a.errorMessageId = validationResult.errorId
				}
			},
			onBusyStateChanged: isBusy => (a.isMailVerificationBusy = isBusy),
			injectionsRightButtonAttrs: {
				label: "addEmailAlias_label",
				icon: () => Icons.Checkmark,
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
			m(
				".small.left",
				a.data.editAliasFormAttrs.aliasCount.availableToCreate === 0
					? lang.get("adminMaxNbrOfAliasesReached_msg")
					: lang.get("mailAddressAliasesMaxNbr_label", {
						"{1}": a.data.editAliasFormAttrs.aliasCount.availableToCreate,
					}),
			),
			logins.getUserController().userGroupInfo.mailAddressAliases.length ? m(TableN, aliasesTableAttrs) : null,
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
							Dialog.showActionDialog(addUsersDialogAttrs)
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
					m(ButtonN, {
						type: ButtonType.Login,
						label: "next_action",
						click: () => emitWizardEvent(
							(vnode as VnodeDOM<AddEmailAddressesPageAttrs>).dom as HTMLElement,
							WizardEventType.SHOWNEXTPAGE
						),
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
			const hasAliases = logins.getUserController().userGroupInfo.mailAddressAliases.some(alias => alias.mailAddress.endsWith(`@${this.data.domain()}`))

			if (hasAliases) {
				return true
			} else {
				return locator.entityClient
							  .load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
							  .then(customer => locator.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups))
							  .then(allUserGroupInfos => {
								  return allUserGroupInfos.some(
									  u =>
										  neverNull(u.mailAddress).endsWith("@" + this.data.domain()) ||
										  u.mailAddressAliases.some(a => neverNull(a.mailAddress).endsWith("@" + this.data.domain())),
								  )
							  })
			}
		})
		return showProgressDialog("pleaseWait_msg", checkMailAddresses).then(nextAllowed => {
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
			return showProgressDialog(
				"pleaseWait_msg",
				locator.mailAddressFacade.addMailAlias(this.data.editAliasFormAttrs.userGroupInfo.group, this.mailAddress),
			)
				.then(() => {
					return true
				})
				.catch(ofClass(InvalidDataError, () => Dialog.message("mailAddressNA_msg").then(() => false)))
				.catch(ofClass(LimitReachedError, () => Dialog.message("adminMaxNbrOfAliasesReached_msg").then(() => false)))
				.finally(() => updateNbrOfAliases(this.data.editAliasFormAttrs))
		}
	}
}