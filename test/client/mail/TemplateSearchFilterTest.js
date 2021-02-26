// @flow

import o from "ospec"
import {searchInTemplates} from "../../../src/templates/model/TemplateSearchFilter"
import type {EmailTemplate} from "../../../src/api/entities/tutanota/EmailTemplate"
import {createEmailTemplate} from "../../../src/api/entities/tutanota/EmailTemplate"
import {createEmailTemplateContent} from "../../../src/api/entities/tutanota/EmailTemplateContent"


o.spec("TemplateSearchFilter", function () {
	o("finds in title", function () {
		const emailTemplate: EmailTemplate = createEmailTemplate({
			tag: "more_steps_needed",
			title: "Please provide more steps",
			contents: [
				createEmailTemplateContent({languageCode: "en", text: "We will require more information"}),
				createEmailTemplateContent({languageCode: "de", text: "Wir benötigen mehr Informationen, um"})
			]
		})
		o(searchInTemplates("Please provide", [emailTemplate])).deepEquals([emailTemplate])
	})
	o("finds in one content", function () {
		const emailTemplate: Array<EmailTemplate> = [
			createEmailTemplate({
				tag: "more_steps_needed",
				title: "Please provide more steps",
				contents: [
					createEmailTemplateContent(
						{languageCode: "en", text: "We will require more information"}
					)
				]
			}),
			createEmailTemplate({
				tag: "account_access",
				title: "Account cannot be accessed",
				contents: [
					createEmailTemplateContent({languageCode: "en", text: "Cannot access account"}),
					createEmailTemplateContent({languageCode: "de", text: "Zugriff auf Konto nicht möglich"})
				]
			}),
		]
		o(searchInTemplates("access", emailTemplate)).deepEquals([emailTemplate[1]]) // should find the last one
	})
	o("finds in both content and one title", function () { // 2nd template should be found first
		const emailTemplate: Array<EmailTemplate> = [
			createEmailTemplate({
				tag: "account_access_lost",
				title: "Lost access",
				contents: [
					createEmailTemplateContent({languageCode: "en", text: "Lost access to account"}),
					createEmailTemplateContent({languageCode: "de", text: "Zugangsdaten zum Konto verloren"})
				]
			}),
			createEmailTemplate({
				tag: "account_refund",
				title: "Account Refund",
				contents: [
					createEmailTemplateContent({languageCode: "en", text: "Refund account"}),
					createEmailTemplateContent({languageCode: "de", text: "Zahlung stornieren"})
				]
			})
		]
		o(searchInTemplates("account", emailTemplate)).deepEquals([emailTemplate[0], emailTemplate[1]])
	})
	o("finds in tag", function () {
		const emailTemplate: EmailTemplate = createEmailTemplate({
			tag: "#account_info",
			title: "Account information required",
			contents: [
				createEmailTemplateContent({languageCode: "en", text: "Please provide more information regarding"}),
				createEmailTemplateContent({languageCode: "de", text: "Wir benötigen weitere Informationen, um"})
			]
		})
		o(searchInTemplates("account_info", [emailTemplate])).deepEquals([emailTemplate])
	})
	o("finds in multiple tags", function () {
		const emailTemplate: Array<EmailTemplate> = [
			createEmailTemplate({
				tag: "#account_access",
				title: "Cannot access account",
				contents: [
					createEmailTemplateContent({languageCode: "en", text: "If you cannot access your account"}),
					createEmailTemplateContent({languageCode: "de", text: "Wenn Sie auf Ihr Konto nicht zugreifen können"})
				]
			}),
			createEmailTemplate({
				tag: "#account_refund",
				title: "Refund account",
				contents: [
					createEmailTemplateContent({languageCode: "en", text: "Refund account"}),
					createEmailTemplateContent({languageCode: "de", text: "Zahlung stonieren"})
				]
			})
		]
		o(searchInTemplates("account", emailTemplate)).deepEquals(emailTemplate)
	})
	o("finds in content with multiple languages", function () {
		const emailTemplate: Array<EmailTemplate> = [
			createEmailTemplate({
				tag: "account_refund",
				title: "Access",
				contents: [
					createEmailTemplateContent({languageCode: "en", text: "Account access"}),
					createEmailTemplateContent({languageCode: "de", text: "Account Zugriff"})
				]
			}),
			createEmailTemplate({
				tag: "account_refund",
				title: "Refund",
				contents: [
					createEmailTemplateContent({languageCode: "en", text: "Account refund"}),
					createEmailTemplateContent({languageCode: "de", text: "Account stornieren"})
				]
			})
		]
		o(searchInTemplates("Account", emailTemplate)).deepEquals(emailTemplate)
	})
})