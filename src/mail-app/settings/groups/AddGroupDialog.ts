import m, { Children, Component, Vnode } from "mithril"
import { BookingItemFeatureType, FeatureType, GroupType } from "../../../common/api/common/TutanotaConstants.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import type { ValidationResult } from "../../../common/settings/SelectMailAddressForm.js"
import { SelectMailAddressForm } from "../../../common/settings/SelectMailAddressForm.js"
import { getGroupTypeDisplayName } from "../../../common/settings/groups/GroupDetailsView.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { InfoLink, lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { showBuyDialog } from "../../../common/subscription/BuyDialog.js"
import { PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs.js"
import { TemplateGroupPreconditionFailedReason } from "../../../common/sharing/GroupUtils.js"
import { DropDownSelector } from "../../../common/gui/base/DropDownSelector.js"
import { TextField } from "../../../common/gui/base/TextField.js"
import { getFirstOrThrow, ofClass } from "@tutao/tutanota-utils"
import type { GroupManagementFacade } from "../../../common/api/worker/facades/lazy/GroupManagementFacade.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { assertMainOrNode } from "../../../common/api/common/Env.js"
import { EmailDomainData, getAvailableDomains } from "../../../common/settings/mailaddress/MailAddressesUtils.js"
import { getAvailablePlansWithTemplates, toFeatureType } from "../../../common/subscription/SubscriptionUtils.js"
import { MoreInfoLink } from "../../../common/misc/news/MoreInfoLink.js"

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
						m(".mt-m", ""),
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

	createMailGroup(): Promise<void> {
		return this._groupManagementFacade.createMailGroup(this.groupName, this.mailAddress)
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
							return viewModel.createMailGroup()
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
			title: viewModel.groupType == GroupType.Mail ? lang.get("createSharedMailbox_label") : lang.get("addGroup_label"),
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
						Dialog.message(() => e.message)
					}

					return false
				}),
			),
	)
}
