import o from "@tutao/otest"
import { createWizardDialog, WizardPageWrapper } from "../../../../src/common/gui/base/WizardDialog.js"
import { Dialog, DialogType } from "../../../../src/common/gui/base/Dialog.js"
import { EnterDomainPageAttrs } from "../../../../src/mail-app/settings/emaildomain/EnterDomainPage.js"
import stream from "mithril/stream"
import { CustomerInfoTypeRef, DnsRecordTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { DomainDnsStatus } from "../../../../src/mail-app/settings/DomainDnsStatus.js"
import { AddDomainData } from "../../../../src/mail-app/settings/emaildomain/AddDomainWizard.js"
import { MailAddressTableModel } from "../../../../src/common/settings/mailaddress/MailAddressTableModel.js"
import { object } from "testdouble"
import { noOp } from "@tutao/tutanota-utils"
import { createTestEntity } from "../../TestUtils.js"

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
		const dialogBuilder = createWizardDialog(data, [], null, DialogType.EditLarge)
		o(dialogBuilder.dialog instanceof Dialog).equals(true)
		o(dialogBuilder.attrs.currentPage).equals(null)
		o(dialogBuilder.attrs.pages.length).equals(0)
	})

	o("createWizardDialog with pages and closeAction", function () {
		const dialogBuilder = createWizardDialog(data, wizardPages, closeAction, DialogType.EditLarge)
		o(dialogBuilder.attrs.currentPage).equals(wizardPages[0])
		o(dialogBuilder.attrs.pages.length).equals(1)
		const before = counter
		dialogBuilder.attrs.closeAction()
		o(counter).equals(before + 1)
	})

	o("createWizardDialog with pages and without closeAction", function () {
		const dialogBuilder = createWizardDialog(data, wizardPages, null, DialogType.EditLarge)
		o(dialogBuilder.attrs.currentPage).equals(wizardPages[0])
		o(dialogBuilder.attrs.pages.length).equals(1)
		const before = counter
		dialogBuilder.attrs.closeAction()
		o(counter).equals(before)
	})
})
