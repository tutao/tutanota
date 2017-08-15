//@flow
import {assertMainOrNode} from "../api/Env"
import {ContactSuggestion} from "../mail/MailEditor"
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {PermissionError} from "../api/common/error/PermissionError"

assertMainOrNode()

/**
 * Functions to retrieve all contacts that are store on the phone
 */
export const contactApp = {
	findRecipients
}

function findRecipients(text: string, maxNumberOfSuggestions: number, suggestions: ContactSuggestion[]): Promise<void> {
	return nativeApp.invokeNative(new Request("findSuggestions", [text]))
		.then((addressBookSuggestions: {name: string, mailAddress:string}[]) => {
			let contactSuggestions = addressBookSuggestions.map(s => new ContactSuggestion(s.name, s.mailAddress, null))
			suggestions.push(...contactSuggestions)
			suggestions.length = maxNumberOfSuggestions
		}).catch(PermissionError, () => {
		}) // we do not add contacts from the native address book to the suggestions in case of a non-granted permission
}