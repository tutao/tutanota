import o from "@tutao/otest"
import { createWizardDialog, WizardPageWrapper } from "../../../../src/ui/base/WizardDialog.js"
import { Dialog, DialogType } from "../../../../src/ui/base/Dialog.js"
import { EnterDomainPageAttrs } from "../../../../src/applications/mail-app/settings/emaildomain/EnterDomainPage.js"
import stream from "mithril/stream"
import { DomainDnsStatus } from "../../../../src/applications/mail-app/settings/DomainDnsStatus.js"
import { AddDomainData } from "../../../../src/applications/mail-app/settings/emaildomain/AddDomainWizard.js"
import { MailAddressTableModel } from "../../../../src/applications/common/settings/mailaddress/MailAddressTableModel.js"
import { object } from "testdouble"
import { noOp } from "@tutao/utils"
import { createTestEntity } from "../../TestUtils.js"
import { windowFacade } from "../../../../src/applications/common/misc/WindowFacade"
import { CustomerInfoTypeRef, DnsRecordTypeRef } from "@tutao/entities/sys"

const data: AddDomainData = {
	domain: stream("domain"),
	customerInfo: createTestEntity(CustomerInfoTypeRef),
	expectedVerificationRecord: createTestEntity(DnsRecordTypeRef),
	editAliasFormAttrs: {
		model: object<MailAddressTableModel>(),
		expanded: false,
		onExpanded: noOp,
	},
	domainStatus: new DomainDnsStatus("domain"),
}

const wizardPages: WizardPageWrapper<AddDomainData>[] = [
	{
		attrs: new EnterDomainPageAttrs(data),
		view: () => null,
	},
]

let counter = 0

const closeAction = () => {
	counter += 1
	return Promise.resolve()
}

o.spec("WizardDialogN", function () {
	o("createWizardDialog without pages", function () {
		const dialogBuilder = createWizardDialog({
			data,
			pages: [],
			dialogType: DialogType.EditLarge,
			windowFacade,
		})
		o(dialogBuilder.dialog instanceof Dialog).equals(true)
		o(dialogBuilder.attrs.currentPage).equals(null)
		o(dialogBuilder.attrs.pages.length).equals(0)
	})

	o("createWizardDialog with pages and closeAction", function () {
		const dialogBuilder = createWizardDialog({
			data,
			pages: wizardPages,
			closeAction,
			dialogType: DialogType.EditLarge,
			windowFacade,
		})
		o(dialogBuilder.attrs.currentPage).equals(wizardPages[0])
		o(dialogBuilder.attrs.pages.length).equals(1)
		const before = counter
		dialogBuilder.attrs.closeAction()
		o(counter).equals(before + 1)
	})

	o("createWizardDialog with pages and without closeAction", function () {
		const dialogBuilder = createWizardDialog({
			data,
			pages: wizardPages,
			dialogType: DialogType.EditLarge,
			windowFacade,
		})
		o(dialogBuilder.attrs.currentPage).equals(wizardPages[0])
		o(dialogBuilder.attrs.pages.length).equals(1)
		const before = counter
		dialogBuilder.attrs.closeAction()
		o(counter).equals(before)
	})
})
