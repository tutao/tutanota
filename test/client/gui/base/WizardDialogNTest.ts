import o from "ospec"
import {createWizardDialog, WizardPageWrapper} from "../../../../src/gui/base/WizardDialogN"
import {Dialog} from "../../../../src/gui/base/Dialog"
import {EnterDomainPageAttrs} from "../../../../src/settings/emaildomain/EnterDomainPage"
import stream from "mithril/stream";
import {createCustomerInfo} from "../../../../src/api/entities/sys/TypeRefs.js";
import {createDnsRecord} from "../../../../src/api/entities/sys/TypeRefs.js";
import {DomainDnsStatus} from "../../../../src/settings/DomainDnsStatus";
import {AddDomainData} from "../../../../src/settings/emaildomain/AddDomainWizard";
import {createGroupInfo} from "../../../../src/api/entities/sys/TypeRefs.js";

const data: AddDomainData = {
	domain: stream("domain"),
	customerInfo: createCustomerInfo(),
	expectedVerificationRecord: createDnsRecord(),
	editAliasFormAttrs: {
		userGroupInfo: createGroupInfo(),
		aliasCount: {
			availableToCreate: 1,
			availableToEnable: 1,
		},
		expanded: stream(false),
	},
	domainStatus: new DomainDnsStatus("domain"),
}


const wizardPages: WizardPageWrapper<AddDomainData>[] = [
	{
		attrs: new EnterDomainPageAttrs(data),
		view: () => null,
	}
]

let counter = 0

const closeAction = () => {
	counter += 1
	return Promise.resolve()
}

o.spec("WizardDialogN", function () {
	o("createWizardDialog without pages", function () {
		const dialogBuilder = createWizardDialog(data, [])
		o(dialogBuilder.dialog instanceof Dialog).equals(true)
		o(dialogBuilder.attrs.currentPage).equals(null)
		o(dialogBuilder.attrs.pages.length).equals(0)
	})

	o("createWizardDialog with pages and closeAction", function () {
		const dialogBuilder = createWizardDialog(data, wizardPages, closeAction)
		o(dialogBuilder.attrs.currentPage).equals(wizardPages[0])
		o(dialogBuilder.attrs.pages.length).equals(1)
		const before = counter
		dialogBuilder.attrs.closeAction()
		o(counter).equals(before + 1)
	})

	o("createWizardDialog with pages and without closeAction", function () {
		const dialogBuilder = createWizardDialog(data, wizardPages)
		o(dialogBuilder.attrs.currentPage).equals(wizardPages[0])
		o(dialogBuilder.attrs.pages.length).equals(1)
		const before = counter
		dialogBuilder.attrs.closeAction()
		o(counter).equals(before)
	})
})