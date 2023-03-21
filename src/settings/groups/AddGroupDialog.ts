import m, { Children, Component, Vnode } from "mithril"
import { BookingItemFeatureType, FeatureType, GroupType } from "../../api/common/TutanotaConstants.js"
import { Dialog } from "../../gui/base/Dialog.js"
import type { ValidationResult } from "../SelectMailAddressForm.js"
import { SelectMailAddressForm } from "../SelectMailAddressForm.js"
import { getGroupTypeDisplayName } from "./GroupDetailsView.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import type { TranslationKey } from "../../misc/LanguageViewModel.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { showBuyDialog } from "../../subscription/BuyDialog.js"
import { PreconditionFailedError } from "../../api/common/error/RestError.js"
import { showBusinessFeatureRequiredDialog } from "../../misc/SubscriptionDialogs.js"
import { TemplateGroupPreconditionFailedReason } from "../../sharing/GroupUtils.js"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { TextField } from "../../gui/base/TextField.js"
import { getFirstOrThrow, ofClass } from "@tutao/tutanota-utils"
import type { GroupManagementFacade } from "../../api/worker/facades/lazy/GroupManagementFacade.js"
import { locator } from "../../api/main/MainLocator.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { getAvailableDomains } from "../mailaddress/MailAddressesUtils.js"

assertMainOrNode()

export type AddGroupDialogAttrs = {
	groupType: GroupType
	availableDomains: Array<string>
	availableGroupTypes: Array<GroupType>
	name: string
	onGroupNameChanged: (name: string) => unknown
	onGroupTypeChanged: (type: GroupType) => unknown
	onEmailChanged: (arg0: string, arg1: ValidationResult) => unknown
	onBusyStateChanged: (arg0: boolean) => unknown
}

export class AddGroupDialog implements Component<AddGroupDialogAttrs> {
	view(vnode: Vnode<AddGroupDialogAttrs>): Children {
		const { availableGroupTypes, groupType, availableDomains, onEmailChanged, onBusyStateChanged } = vnode.attrs
		return [
			m(DropDownSelector, {
				label: "groupType_label",
				items: availableGroupTypes.map((t) => {
					return {
						name: getGroupTypeDisplayName(t),
						value: t,
					}
				}),
				selectedValue: groupType,
				selectionChangedHandler: vnode.attrs.onGroupTypeChanged,
			}),
			m(TextField, {
				label: "name_label",
				value: vnode.attrs.name,
				oninput: vnode.attrs.onGroupNameChanged,
			}),
			groupType === GroupType.Mail
				? m(SelectMailAddressForm, {
						availableDomains,
						onValidationResult: onEmailChanged,
						onBusyStateChanged,
				  })
				: m(""),
		]
	}
}

export class AddGroupDialogViewModel {
	groupName: string
	mailAddress: string
	groupTypes: Array<GroupType>
	errorMessageId: TranslationKey | null
	availableDomains: Array<string>
	groupType: GroupType
	isVerifactionBusy: boolean
	_groupManagementFacade: GroupManagementFacade

	constructor(availableDomains: Array<string>, groupManagementFacade: GroupManagementFacade) {
		this.availableDomains = availableDomains
		this._groupManagementFacade = groupManagementFacade
		this.groupTypes = this.getAvailableGroupTypes()
		this.groupType = getFirstOrThrow(this.groupTypes)
		this.groupName = availableDomains[0]
		this.mailAddress = ""
		this.errorMessageId = "mailAddressNeutral_msg"
		this.isVerifactionBusy = false
	}

	createMailGroup(): Promise<void> {
		return this._groupManagementFacade.createMailGroup(this.groupName, this.mailAddress)
	}

	createLocalAdminGroup(): Promise<void> {
		return this._groupManagementFacade.createLocalAdminGroup(this.groupName)
	}

	validateAddGroupInput(): TranslationKey | null {
		if (this.groupType === GroupType.Mail) {
			return this.errorMessageId
		} else if (this.groupType === GroupType.Template || (this.groupType === GroupType.MailingList && this.groupName.trim() === "")) {
			return "enterName_msg"
		} else {
			return null
		}
	}

	getAvailableGroupTypes(): GroupType[] {
		if (locator.logins.isEnabled(FeatureType.WhitelabelChild)) {
			return []
		} else {
			return locator.logins.getUserController().isGlobalAdmin() ? [GroupType.Mail, GroupType.LocalAdmin] : [GroupType.Mail]
		}
	}

	onEmailChanged(email: string, validationResult: ValidationResult) {
		this.errorMessageId = validationResult.errorId

		if (validationResult.isValid) {
			this.mailAddress = email
		}
	}
}

export function show(): void {
	getAvailableDomains(locator.entityClient, locator.logins).then((availableDomains) => {
		const viewModel = new AddGroupDialogViewModel(availableDomains, locator.groupManagementFacade)
		if (viewModel.getAvailableGroupTypes().length === 0) return Dialog.message("selectionNotAvailable_msg")

		let addGroupOkAction = (dialog: Dialog) => {
			if (viewModel.isVerifactionBusy) return
			const errorId = viewModel.validateAddGroupInput()

			if (errorId) {
				Dialog.message(errorId)
				return
			}

			if (viewModel.groupType === GroupType.Mail) {
				showProgressDialog(
					"pleaseWait_msg",
					showBuyDialog({ featureType: BookingItemFeatureType.SharedMailGroup, count: 1, freeAmount: 0, reactivate: false }).then((accepted) => {
						if (accepted) {
							dialog.close()
							return viewModel.createMailGroup()
						}
					}),
				)
			} else if (viewModel.groupType === GroupType.LocalAdmin) {
				showProgressDialog(
					"pleaseWait_msg",
					showBuyDialog({ featureType: BookingItemFeatureType.LocalAdminGroup, count: 1, freeAmount: 0, reactivate: false }).then((accepted) => {
						if (accepted) {
							dialog.close()
							return viewModel.createLocalAdminGroup()
						}
					}),
				)
			} else if (viewModel.groupType === GroupType.Template) {
				addTemplateGroup(viewModel.groupName).then((success) => {
					if (success) {
						dialog.close()
					}
				})
			}
		}

		Dialog.showActionDialog({
			title: lang.get("addGroup_label"),
			child: () =>
				m(AddGroupDialog, {
					groupType: viewModel.groupType,
					availableDomains: availableDomains,
					availableGroupTypes: viewModel.groupTypes,
					name: viewModel.groupName,
					onGroupNameChanged: (newName) => (viewModel.groupName = newName),
					onGroupTypeChanged: (newType) => (viewModel.groupType = newType),
					onEmailChanged: (mailAddress, validationResult) => viewModel.onEmailChanged(mailAddress, validationResult),
					onBusyStateChanged: (isBusy) => (viewModel.isVerifactionBusy = isBusy),
				}),
			okAction: addGroupOkAction,
		})
	})
}

/**
 * @returns {Promise<boolean>} true if group was added, false otherwise
 */
function addTemplateGroup(name: string): Promise<boolean> {
	return showProgressDialog(
		"pleaseWait_msg",
		locator.groupManagementFacade
			.createTemplateGroup(name)
			.then(() => true)
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					if (e.data === TemplateGroupPreconditionFailedReason.BUSINESS_FEATURE_REQUIRED) {
						showBusinessFeatureRequiredDialog("businessFeatureRequiredGeneral_msg")
					} else {
						Dialog.message(() => e.message)
					}

					return false
				}),
			),
	)
}
