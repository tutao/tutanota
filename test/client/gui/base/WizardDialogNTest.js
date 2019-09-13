import o from "ospec"
import {createWizardDialog} from "../../../../src/gui/base/WizardDialogN"
import {Dialog} from "../../../../src/gui/base/Dialog"
import {EnterDomainPage, EnterDomainPageAttrs} from "../../../../src/settings/emaildomain/EnterDomainPage"

const data = {
	test: "t"
}

const wizardPages = [
	{
		attrs: new EnterDomainPageAttrs(data),
		componentClass: EnterDomainPage
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
		o(dialogBuilder.attrs.currentPage).equals(undefined)
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