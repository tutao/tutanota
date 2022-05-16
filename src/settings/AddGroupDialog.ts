import m, {Children, Component, Vnode} from "mithril"
import {BookingItemFeatureType, FeatureType, GroupType} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import type {ValidationResult} from "./SelectMailAddressForm"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {getGroupTypeName} from "./GroupViewer"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {logins} from "../api/main/LoginController"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream"
import {showBuyDialog} from "../subscription/BuyDialog"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {showBusinessFeatureRequiredDialog} from "../misc/SubscriptionDialogs"
import {TemplateGroupPreconditionFailedReason} from "../sharing/GroupUtils"
import * as AddUserDialog from "./AddUserDialog"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {firstThrow, ofClass} from "@tutao/tutanota-utils"
import type {GroupManagementFacade} from "../api/worker/facades/GroupManagementFacade"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()
const BUSINESS_FEATURE_REQUIRED = "templategroup.business_feature_required"
export type AddGroupDialogAttrs = {
	groupType: GroupType
	availableDomains: Array<string>
	availableGroupTypes: Array<GroupType>
	name: string
	onGroupNameChanged: (arg0: string) => unknown
	onGroupTypeChanged: (arg0: GroupType) => unknown
	onEmailChanged: (arg0: string, arg1: ValidationResult) => unknown
	onBusyStateChanged: (arg0: boolean) => unknown
}

export class AddGroupDialog implements Component<AddGroupDialogAttrs> {
	view(vnode: Vnode<AddGroupDialogAttrs>): Children {
		const {availableGroupTypes, groupType, availableDomains, onEmailChanged, onBusyStateChanged} = vnode.attrs
		return [
			m(DropDownSelectorN, {
				label: "groupType_label",
				items: availableGroupTypes.map(t => {
					return {
						name: getGroupTypeName(t),
						value: t,
					}
				}),
				selectedValue: stream(groupType),
				selectionChangedHandler: vnode.attrs.onGroupTypeChanged,
			}),
			m(TextFieldN, {
				label: "name_label",
				value: stream(vnode.attrs.name),
				oninput: vnode.attrs.onGroupNameChanged,
			}),
			groupType === GroupType.Mail
				? m(SelectMailAddressForm, {
					availableDomains,
					onEmailChanged,
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
		this.groupType = firstThrow(this.groupTypes)
		this.groupName = availableDomains[0]
		this.mailAddress = ""
		this.errorMessageId = null
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
		if (logins.isEnabled(FeatureType.WhitelabelChild)) {
			return []
		} else {
			return logins.getUserController().isGlobalAdmin() ? [GroupType.Mail, GroupType.LocalAdmin] : [GroupType.Mail]
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
	AddUserDialog.getAvailableDomains().then(availableDomains => {
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
					showBuyDialog({featureType: BookingItemFeatureType.SharedMailGroup, count: 1, freeAmount: 0, reactivate: false}).then(accepted => {
						if (accepted) {
							dialog.close()
							return viewModel.createMailGroup()
						}
					}),
				)
			} else if (viewModel.groupType === GroupType.LocalAdmin) {
				showProgressDialog(
					"pleaseWait_msg",
					showBuyDialog({featureType: BookingItemFeatureType.LocalAdminGroup, count: 1, freeAmount: 0, reactivate: false}).then(accepted => {
						if (accepted) {
							dialog.close()
							return viewModel.createLocalAdminGroup()
						}
					}),
				)
			} else if (viewModel.groupType === GroupType.Template) {
				addTemplateGroup(viewModel.groupName).then(success => {
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
					onGroupNameChanged: newName => (viewModel.groupName = newName),
					onGroupTypeChanged: newType => (viewModel.groupType = newType),
					onEmailChanged: (mailAddress, validationResult) => viewModel.onEmailChanged(mailAddress, validationResult),
					onBusyStateChanged: isBusy => (viewModel.isVerifactionBusy = isBusy),
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
				   ofClass(PreconditionFailedError, e => {
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