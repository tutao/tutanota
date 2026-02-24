import m, { Children, Component, Vnode } from "mithril"
import { BookingItemFeatureType, FeatureType, GroupType } from "../../api/common/TutanotaConstants.js"
import { Dialog } from "../../gui/base/Dialog.js"
import type { ValidationResult } from "../SelectMailAddressForm.js"
import { SelectMailAddressForm } from "../SelectMailAddressForm.js"
import { getGroupTypeDisplayName } from "./GroupDetailsView.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { InfoLink, lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { showBuyDialog } from "../../subscription/BuyDialog.js"
import { PreconditionFailedError } from "../../api/common/error/RestError.js"
import { showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs.js"
import { TemplateGroupPreconditionFailedReason } from "../../sharing/GroupUtils.js"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { TextField } from "../../gui/base/TextField.js"
import { getFirstOrThrow, ofClass } from "@tutao/tutanota-utils"
import type { GroupManagementFacade } from "../../api/worker/facades/lazy/GroupManagementFacade.js"
import { locator } from "../../api/main/CommonLocator.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { EmailDomainData, getAvailableDomains } from "../mailaddress/MailAddressesUtils.js"
import { getAvailablePlansWithTemplates, toFeatureType } from "../../subscription/utils/SubscriptionUtils.js"
import { MoreInfoLink } from "../../misc/news/MoreInfoLink.js"

assertMainOrNode()

export type AddGroupDialogAttrs = {
	groupType: GroupType
	selectedDomain: EmailDomainData
	availableDomains: Array<EmailDomainData>
	availableGroupTypes: Array<GroupType>
	name: string
	onGroupNameChanged: (name: string) => unknown
	onGroupTypeChanged: (type: GroupType) => unknown
	onEmailChanged: (emailAddress: string, validationResult: ValidationResult) => unknown
	onBusyStateChanged: (busy: boolean) => unknown
	onDomainChanged: (domain: EmailDomainData) => unknown
}

export class AddGroupDialog implements Component<AddGroupDialogAttrs> {
	view(vnode: Vnode<AddGroupDialogAttrs>): Children {
		const { availableGroupTypes, groupType, availableDomains, onEmailChanged, onBusyStateChanged, selectedDomain, onDomainChanged } = vnode.attrs
		return [
			availableGroupTypes.length > 1
				? m(DropDownSelector, {
						label: "groupType_label",
						items: availableGroupTypes.map((t) => {
							return {
								name: getGroupTypeDisplayName(t),
								value: t,
							}
						}),
						selectedValue: groupType,
						selectionChangedHandler: vnode.attrs.onGroupTypeChanged,
					})
				: null,
			m(TextField, {
				label: "name_label",
				value: vnode.attrs.name,
				oninput: vnode.attrs.onGroupNameChanged,
			}),
			groupType === GroupType.Mail
				? m("", [
						m(SelectMailAddressForm, {
							selectedDomain,
							availableDomains,
							onValidationResult: onEmailChanged,
							onBusyStateChanged,
							onDomainChanged,
						}),
						m(".mt-12", ""),
						m(MoreInfoLink, { link: InfoLink.SharedMailboxes, isSmall: true }),
					])
				: m(""),
		]
	}
}

export class AddGroupDialogViewModel {
	groupName: string
	mailAddress: string
	groupTypes: Array<GroupType>
	errorMessageId: TranslationKey | null
	availableDomains: Array<EmailDomainData>
	selectedDomain: EmailDomainData
	groupType: GroupType
	isVerifactionBusy: boolean
	_groupManagementFacade: GroupManagementFacade

	constructor(availableDomains: Array<EmailDomainData>, groupManagementFacade: GroupManagementFacade) {
		this.availableDomains = availableDomains
		this._groupManagementFacade = groupManagementFacade
		this.groupTypes = this.getAvailableGroupTypes()
		this.groupType = getFirstOrThrow(this.groupTypes)
		this.groupName = ""
		this.mailAddress = ""
		this.errorMessageId = "mailAddressNeutral_msg"
		this.isVerifactionBusy = false

		this.selectedDomain = getFirstOrThrow(availableDomains)
	}

	createSharedMailGroup(): Promise<void> {
		return this._groupManagementFacade.createSharedMailGroup(this.groupName, this.mailAddress)
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
			return [GroupType.Mail]
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
	getAvailableDomains(locator.logins).then((availableDomains) => {
		const viewModel = new AddGroupDialogViewModel(availableDomains, locator.groupManagementFacade)
		if (viewModel.getAvailableGroupTypes().length === 0) return Dialog.message("selectionNotAvailable_msg")

		let addGroupOkAction = async (dialog: Dialog) => {
			if (viewModel.isVerifactionBusy) return
			const errorId = viewModel.validateAddGroupInput()

			if (errorId) {
				Dialog.message(errorId)
				return
			}

			const userController = locator.logins.getUserController()
			const planType = await userController.getPlanType()
			const useLegacyBookingItem = await userController.useLegacyBookingItem()

			if (viewModel.groupType === GroupType.Mail) {
				showProgressDialog(
					"pleaseWait_msg",
					showBuyDialog({
						featureType: useLegacyBookingItem ? toFeatureType(planType) : BookingItemFeatureType.SharedMailGroup,
						bookingText: "sharedMailbox_label",
						count: 1,
						freeAmount: 0,
						reactivate: false,
					}).then((accepted) => {
						if (accepted) {
							dialog.close()
							return viewModel.createSharedMailGroup()
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
			title: viewModel.groupType === GroupType.Mail ? "createSharedMailbox_label" : "addGroup_label",
			child: () =>
				m(AddGroupDialog, {
					selectedDomain: viewModel.selectedDomain,
					groupType: viewModel.groupType,
					availableDomains: availableDomains,
					availableGroupTypes: viewModel.groupTypes,
					name: viewModel.groupName,
					onGroupNameChanged: (newName) => (viewModel.groupName = newName),
					onGroupTypeChanged: (newType) => (viewModel.groupType = newType),
					onEmailChanged: (mailAddress, validationResult) => viewModel.onEmailChanged(mailAddress, validationResult),
					onBusyStateChanged: (isBusy) => (viewModel.isVerifactionBusy = isBusy),
					onDomainChanged: (domain) => (viewModel.selectedDomain = domain),
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
				ofClass(PreconditionFailedError, async (e) => {
					if (
						e.data === TemplateGroupPreconditionFailedReason.BUSINESS_FEATURE_REQUIRED ||
						e.data === TemplateGroupPreconditionFailedReason.UNLIMITED_REQUIRED
					) {
						const plans = await getAvailablePlansWithTemplates()
						showPlanUpgradeRequiredDialog(plans)
					} else {
						Dialog.message(lang.makeTranslation("confirm_msg", e.message))
					}

					return false
				}),
			),
	)
}
