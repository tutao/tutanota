import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { assertMainOrNode, isIOSApp } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, decodeBase64, decodeQuotedPrintable, defer, getFirstOrThrow, ofClass, pMap } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { ContactAddressType, ContactMessengerHandleType, ContactPhoneNumberType, ContactRelationshipType, ContactWebsiteType } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import { size } from "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { createBirthday, createContact, createContactAddress, createContactCustomDate, createContactMailAddress, createContactMessengerHandle, createContactPhoneNumber, createContactPronouns, createContactRelationship, createContactWebsite } from "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import "./DeviceConfig-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import "./EntityRestClient-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import { ImportError } from "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./EntityClient-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import { ParsingError, birthdayToIsoDate, isValidBirthday, isoDateToBirthday } from "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./FolderSystem-chunk.js";
import "./GroupUtils-chunk.js";
import "./MailChecks-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import "./Icons-chunk.js";
import { DialogHeaderBar } from "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { Dialog, DialogType } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import "./SharedMailUtils-chunk.js";
import "./ContactUtils-chunk.js";
import "./ExternalLink-chunk.js";
import "./ColumnEmptyMessageBox-chunk.js";
import "./SnackBar-chunk.js";
import "./NotificationOverlay-chunk.js";
import { Checkbox } from "./Checkbox-chunk.js";
import "./BubbleButton-chunk.js";
import { List, ListLoadingState, MultiselectMode } from "./List-chunk.js";
import "./SelectableRowContainer-chunk.js";
import "./RouteChange-chunk.js";
import "./CustomerUtils-chunk.js";
import { mailLocator } from "./mailLocator-chunk.js";
import "./LoginButton-chunk.js";
import "./ListColumnWrapper-chunk.js";
import { KindaContactRow } from "./ContactListView-chunk.js";
import { AttachmentType, getAttachmentType } from "./AttachmentBubble-chunk.js";
import "./UsageTestModel-chunk.js";
import "./MailUtils-chunk.js";
import "./BrowserWebauthn-chunk.js";
import { PermissionType$1 as PermissionType } from "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import "./SearchUtils-chunk.js";
import { SelectAllCheckbox } from "./SelectAllCheckbox-chunk.js";

//#region src/mail-app/contacts/VCardImporter.ts
assertMainOrNode();
function vCardFileToVCards(vCardFileData) {
	let V4 = "\nVERSION:4.0";
	let V3 = "\nVERSION:3.0";
	let V2 = "\nVERSION:2.1";
	let B = "BEGIN:VCARD\n";
	let E = "END:VCARD";
	vCardFileData = vCardFileData.replace(/begin:vcard/g, "BEGIN:VCARD");
	vCardFileData = vCardFileData.replace(/end:vcard/g, "END:VCARD");
	vCardFileData = vCardFileData.replace(/version:2.1/g, "VERSION:2.1");
	if (vCardFileData.indexOf("BEGIN:VCARD") > -1 && vCardFileData.indexOf(E) > -1 && (vCardFileData.indexOf(V4) > -1 || vCardFileData.indexOf(V3) > -1 || vCardFileData.indexOf(V2) > -1)) {
		vCardFileData = vCardFileData.replace(/\r/g, "");
		vCardFileData = vCardFileData.replace(/\n /g, "");
		vCardFileData = vCardFileData.replace(/\nEND:VCARD\n\n/g, "");
		vCardFileData = vCardFileData.replace(/\nEND:VCARD\n/g, "");
		vCardFileData = vCardFileData.replace(/\nEND:VCARD/g, "");
		vCardFileData = vCardFileData.substring(vCardFileData.indexOf(B) + B.length);
		return vCardFileData.split(B);
	} else return null;
}
function vCardEscapingSplit(details) {
	details = details.replace(/\\\\/g, "--bslashbslash++");
	details = details.replace(/\\;/g, "--semiColonsemiColon++");
	details = details.replace(/\\:/g, "--dPunktdPunkt++");
	let array = details.split(";");
	array = array.map((elem) => {
		return elem.trim();
	});
	return array;
}
function vCardReescapingArray(details) {
	return details.map((a) => {
		a = a.replace(/--bslashbslash\+\+/g, "\\");
		a = a.replace(/--semiColonsemiColon\+\+/g, ";");
		a = a.replace(/--dPunktdPunkt\+\+/g, ":");
		a = a.replace(/\\n/g, "\n");
		a = a.replace(/\\,/g, ",");
		return a;
	});
}
function vCardEscapingSplitAdr(addressDetails) {
	addressDetails = addressDetails.replace(/\\\\/g, "--bslashbslash++");
	addressDetails = addressDetails.replace(/\\;/g, "--semiColonsemiColon++");
	let array = addressDetails.split(";");
	return array.map((elem) => {
		if (elem.trim().length > 0) return elem.trim().concat("\n");
else return "";
	});
}
function _decodeTag(encoding, charset, text) {
	let decoder = (cs, l) => l;
	switch (encoding.toLowerCase()) {
		case "quoted-printable:":
			decoder = decodeQuotedPrintable;
			break;
		case "base64:": decoder = decodeBase64;
	}
	return text.split(";").map((line) => decoder(charset, line)).join(";");
}
function getPropertyValue(property, tagValue) {
	const exp = new RegExp(property + "=(.*?)[:;]", "gi");
	return (Array.from(tagValue.matchAll(exp), (m) => m[1])[0] ?? "").trim();
}
function vCardListToContacts(vCardList, ownerGroupId) {
	let contacts = [];
	for (let i = 0; i < vCardList.length; i++) {
		let lastName = "";
		let firstName = "";
		let title = null;
		let birthdayIso = null;
		let company = "";
		let comment = "";
		let nickname = null;
		let role = "";
		let department = "";
		let middleName = "";
		let suffix = "";
		const addresses = [];
		const mailAddresses = [];
		const phoneNumbers = [];
		const websites = [];
		const relationships = [];
		const pronouns = [];
		const messengerHandles = [];
		let vCardLines = vCardList[i].split("\n");
		for (let j = 0; j < vCardLines.length; j++) {
			let indexAfterTag = vCardLines[j].indexOf(":");
			let tagAndTypeString = vCardLines[j].substring(0, indexAfterTag).toUpperCase();
			let tagName = tagAndTypeString.split(";")[0];
			let tagValue = vCardLines[j].substring(indexAfterTag + 1);
			let encodingObj = vCardLines[j].split(";").find((line) => line.includes("ENCODING="));
			let encoding = encodingObj ? encodingObj.split("=")[1] : "";
			let charsetObj = vCardLines[j].split(";").find((line) => line.includes("CHARSET="));
			let charset = charsetObj ? charsetObj.split("=")[1] : "utf-8";
			tagValue = _decodeTag(encoding, charset, tagValue);
			switch (tagName) {
				case "N": {
					let nameDetails = vCardReescapingArray(vCardEscapingSplit(tagValue));
					for (let i$1 = nameDetails.length; nameDetails.length < 4; i$1++) nameDetails.push("");
					lastName = nameDetails[0];
					firstName = nameDetails[1];
					middleName = nameDetails[2];
					title = nameDetails[3];
					suffix = nameDetails[4];
					break;
				}
				case "FN":
					if (firstName === "" && lastName === "" && title == null && middleName === "" && suffix === "") {
						let fullName = vCardReescapingArray(vCardEscapingSplit(tagValue));
						firstName = fullName.join(" ").replace(/"/g, "");
					}
					break;
				case "BDAY": {
					let indexOfT = tagValue.indexOf("T");
					let bDayDetails = null;
					if (tagValue.match(/--\d{4}/g)) bDayDetails = createBirthday({
						month: tagValue.substring(2, 4),
						day: tagValue.substring(4, 6),
						year: null
					});
else if (tagValue.match(/\d{4}-\d{2}-\d{2}/g)) {
						let bDay = tagValue.substring(0, indexOfT !== -1 ? indexOfT : tagValue.length).split("-");
						bDayDetails = createBirthday({
							year: bDay[0].trim(),
							month: bDay[1].trim(),
							day: bDay[2].trim()
						});
					} else if (tagValue.match(/\d{8}/g)) bDayDetails = createBirthday({
						year: tagValue.substring(0, 4),
						month: tagValue.substring(4, 6),
						day: tagValue.substring(6, 8)
					});
					if (bDayDetails && bDayDetails.year === "1111") bDayDetails.year = null;
					try {
						birthdayIso = bDayDetails && isValidBirthday(bDayDetails) ? birthdayToIsoDate(bDayDetails) : null;
					} catch (e) {
						if (e instanceof ParsingError) console.log("failed to parse birthday", e);
else throw e;
					}
					break;
				}
				case "ORG": {
					let orgDetails = vCardReescapingArray(vCardEscapingSplit(tagValue));
					for (let i$1 = orgDetails.length; orgDetails.length < 2; i$1++) orgDetails.push("");
					department = orgDetails.pop() ?? "";
					company = orgDetails.join(" ");
					break;
				}
				case "NOTE": {
					let note = vCardReescapingArray(vCardEscapingSplit(tagValue));
					comment = note.join(" ");
					break;
				}
				case "ADR":
				case "ITEM1.ADR":
				case "ITEM2.ADR":
					if (tagAndTypeString.indexOf("HOME") > -1) _addAddress(tagValue, addresses, ContactAddressType.PRIVATE);
else if (tagAndTypeString.indexOf("WORK") > -1) _addAddress(tagValue, addresses, ContactAddressType.WORK);
else _addAddress(tagValue, addresses, ContactAddressType.OTHER);
					break;
				case "EMAIL":
				case "ITEM1.EMAIL":
				case "ITEM2.EMAIL":
					if (tagAndTypeString.indexOf("HOME") > -1) _addMailAddress(tagValue, mailAddresses, ContactAddressType.PRIVATE);
else if (tagAndTypeString.indexOf("WORK") > -1) _addMailAddress(tagValue, mailAddresses, ContactAddressType.WORK);
else _addMailAddress(tagValue, mailAddresses, ContactAddressType.OTHER);
					break;
				case "TEL":
				case "ITEM1.TEL":
				case "ITEM2.TEL":
					tagValue = tagValue.replace(/[\u2000-\u206F]/g, "");
					if (tagAndTypeString.indexOf("HOME") > -1) _addPhoneNumber(tagValue, phoneNumbers, ContactPhoneNumberType.PRIVATE);
else if (tagAndTypeString.indexOf("WORK") > -1) _addPhoneNumber(tagValue, phoneNumbers, ContactPhoneNumberType.WORK);
else if (tagAndTypeString.indexOf("FAX") > -1) _addPhoneNumber(tagValue, phoneNumbers, ContactPhoneNumberType.FAX);
else if (tagAndTypeString.indexOf("CELL") > -1) _addPhoneNumber(tagValue, phoneNumbers, ContactPhoneNumberType.MOBILE);
else _addPhoneNumber(tagValue, phoneNumbers, ContactPhoneNumberType.OTHER);
					break;
				case "URL":
				case "ITEM1.URL":
				case "ITEM2.URL":
					addWebsite(tagValue, websites);
					break;
				case "NICKNAME": {
					let nick = vCardReescapingArray(vCardEscapingSplit(tagValue));
					nickname = nick.join(" ");
					break;
				}
				case "PHOTO": break;
				case "ROLE":
				case "TITLE": {
					let vcardRole = vCardReescapingArray(vCardEscapingSplit(tagValue));
					role += (" " + vcardRole.join(" ")).trim();
					break;
				}
				case "RELATED": {
					let type = ContactRelationshipType.OTHER;
					const vCardPropertyType = getPropertyValue("TYPE", tagAndTypeString).toLowerCase();
					if (vCardPropertyType === "friend") type = ContactRelationshipType.FRIEND;
else if (vCardPropertyType === "child") type = ContactRelationshipType.CHILD;
else if (vCardPropertyType === "parent") type = ContactRelationshipType.PARENT;
else if (vCardPropertyType === "spouse") type = ContactRelationshipType.SPOUSE;
					addRelationship(tagValue, relationships, type);
					break;
				}
				case "PRONOUNS": {
					const lang$1 = getPropertyValue("LANG", tagAndTypeString);
					addPronouns(tagValue, pronouns, lang$1);
					break;
				}
				case "IMPP": {
					const imRawType = getPropertyValue("TYPE", tagAndTypeString);
					let imType = ContactMessengerHandleType.OTHER;
					let customTypeName = "";
					if (imRawType.toLowerCase() === "telegram") imType = ContactMessengerHandleType.TELEGRAM;
else if (imRawType.toLowerCase() === "whatsapp") imType = ContactMessengerHandleType.WHATSAPP;
else if (imRawType.toLowerCase() === "signal") imType = ContactMessengerHandleType.SIGNAL;
else if (imRawType.toLowerCase() === "discord") imType = ContactMessengerHandleType.DISCORD;
else if (imRawType.trim() != "") {
						imType = ContactMessengerHandleType.CUSTOM;
						customTypeName = imRawType.trim();
					}
					const handleData = tagValue.indexOf(":") > -1 ? tagValue.substring(tagValue.indexOf(":") + 1) : tagValue;
					addMessengerHandle(handleData, messengerHandles, imType, customTypeName);
					break;
				}
				default:
			}
		}
		contacts[i] = createContact({
			_ownerGroup: ownerGroupId,
			lastName,
			firstName,
			title,
			birthdayIso,
			company,
			comment,
			nickname,
			role,
			addresses,
			mailAddresses,
			phoneNumbers,
			department,
			middleName,
			websites,
			relationships,
			pronouns,
			messengerHandles,
			nameSuffix: suffix,
			phoneticFirst: null,
			phoneticLast: null,
			phoneticMiddle: null,
			customDate: [],
			socialIds: [],
			presharedPassword: null,
			photo: null,
			oldBirthdayDate: null,
			oldBirthdayAggregate: null
		});
	}
	function _addAddress(vCardAddressValue, addresses, type) {
		let addressDetails = vCardReescapingArray(vCardEscapingSplitAdr(vCardAddressValue));
		let address = createContactAddress({
			type,
			address: addressDetails.join("").trim(),
			customTypeName: ""
		});
		addresses.push(address);
	}
	function _addPhoneNumber(vCardPhoneNumberValue, phoneNumbers, type) {
		let phoneNumber = createContactPhoneNumber({
			type,
			number: vCardPhoneNumberValue,
			customTypeName: ""
		});
		phoneNumbers.push(phoneNumber);
	}
	function _addMailAddress(vCardMailAddressValue, mailAddresses, type) {
		let email = createContactMailAddress({
			type,
			address: vCardMailAddressValue,
			customTypeName: ""
		});
		mailAddresses.push(email);
	}
	function addRelationship(relationshipPerson, relationships, type) {
		const relationship = createContactRelationship({
			type,
			person: relationshipPerson,
			customTypeName: ""
		});
		relationships.push(relationship);
	}
	function addPronouns(pronouns, pronounsArray, lang$1) {
		const pronounsToAdd = createContactPronouns({
			language: lang$1,
			pronouns
		});
		pronounsArray.push(pronounsToAdd);
	}
	function addMessengerHandle(handle, messengerHandleArray, type, customTypeName) {
		const newHandle = createContactMessengerHandle({
			handle,
			type,
			customTypeName
		});
		messengerHandleArray.push(newHandle);
	}
	function addWebsite(tagValue, websites) {
		let website = createContactWebsite({
			type: ContactWebsiteType.OTHER,
			url: vCardReescapingArray(vCardEscapingSplit(tagValue)).join(""),
			customTypeName: ""
		});
		websites.push(website);
	}
	return contacts;
}

//#endregion
//#region src/mail-app/contacts/view/ImportNativeContactBooksDialog.ts
var ImportNativeContactBooksDialog = class {
	selectedContactBooks;
	constructor(contactBooks) {
		this.contactBooks = contactBooks;
		this.selectedContactBooks = new Set(this.contactBooks.map((book) => book.id));
	}
	show() {
		const deferred = defer();
		const dialog = Dialog.showActionDialog({
			title: "importContacts_label",
			type: DialogType.EditMedium,
			allowCancel: true,
			child: () => {
				return mithril_default(".scroll", this.contactBooks.map((book) => this.renderRow(book)));
			},
			okAction: () => {
				deferred.resolve(this.contactBooks.filter((book) => this.selectedContactBooks.has(book.id)));
				dialog.close();
			},
			cancelAction: () => deferred.resolve(null)
		});
		return deferred.promise;
	}
	renderRow(book) {
		const checked = this.selectedContactBooks.has(book.id);
		return mithril_default(".flex.items-center", mithril_default(Checkbox, {
			checked,
			label: () => book.name ?? lang.get("pushIdentifierCurrentDevice_label"),
			onChecked: () => {
				if (checked) this.selectedContactBooks.delete(book.id);
else this.selectedContactBooks.add(book.id);
			}
		}));
	}
};

//#endregion
//#region src/mail-app/contacts/ContactImporter.ts
var ContactImporter = class ContactImporter {
	constructor(contactFacade, systemPermissionHandler, mobileContactsFacade, nativeContactSyncManager) {
		this.contactFacade = contactFacade;
		this.systemPermissionHandler = systemPermissionHandler;
		this.mobileContactsFacade = mobileContactsFacade;
		this.nativeContactSyncManager = nativeContactSyncManager;
	}
	async importContactsFromFile(vCardData, contactListId) {
		const vCardList = Array.isArray(vCardData) ? ContactImporter.combineVCardData(vCardData) : vCardFileToVCards(vCardData);
		if (vCardList == null) throw new UserError("importVCardError_msg");
		const contactMembership = getFirstOrThrow(locator.logins.getUserController().getContactGroupMemberships());
		const contacts = vCardListToContacts(vCardList, contactMembership.group);
		return showContactImportDialog(contacts, (dialog, selectedContacts) => {
			dialog.close();
			this.importContacts(selectedContacts, contactListId);
		}, "importVCard_action");
	}
	static combineVCardData(vCardData) {
		const combinedVCardData = vCardData.flatMap((itemData) => vCardFileToVCards(itemData));
		return combinedVCardData.filter((vCard) => vCard != null);
	}
	async importContacts(contacts, contactListId) {
		const importPromise = this.contactFacade.importContactList(contacts, contactListId).catch(ofClass(ImportError, (e) => Dialog.message(lang.makeTranslation("confirm_msg", lang.get("importContactsError_msg", {
			"{amount}": e.numFailed + "",
			"{total}": contacts.length + ""
		}))))).catch(() => Dialog.message("unknownError_msg"));
		await showProgressDialog("pleaseWait_msg", importPromise);
		await Dialog.message(lang.makeTranslation("confirm_msg", lang.get("importVCardSuccess_msg", { "{1}": contacts.length })));
	}
	async importContactsFromDeviceSafely() {
		const isContactPermissionGranted = await this.systemPermissionHandler.requestPermission(PermissionType.Contacts, "grantContactPermissionAction");
		if (isContactPermissionGranted) await this.importContactsFromDevice();
	}
	async importContactsFromDevice() {
		const mobileContactsFacade = assertNotNull(this.mobileContactsFacade);
		const books = await this.selectContactBooks(mobileContactsFacade);
		if (books == null) return;
		const contactListId = await locator.contactModel.getContactListId();
		const contactGroupId = await locator.contactModel.getContactGroupId();
		const allImportableStructuredContacts = (await pMap(books, async (book) => await mobileContactsFacade.getContactsInContactBook(book.id, locator.logins.getUserController().loginUsername))).flat();
		const allImportableContacts = new Map(allImportableStructuredContacts.map((structuredContact) => [this.contactFromStructuredContact(contactGroupId, structuredContact), structuredContact]));
		showContactImportDialog([...allImportableContacts.keys()], async (dialog, selectedContacts) => {
			dialog.close();
			await this.onContactImportConfirmed(contactListId, selectedContacts, allImportableContacts);
		}, "importContacts_label");
	}
	async onContactImportConfirmed(contactListId, selectedContacts, allImportableContacts) {
		const importer = await mailLocator.contactImporter();
		const mobileContactsFacade = assertNotNull(this.mobileContactsFacade);
		const nativeContactSyncManager = assertNotNull(this.nativeContactSyncManager);
		const selectedStructuredContacts = selectedContacts.map((selectedContact) => assertNotNull(allImportableContacts.get(selectedContact)));
		await importer.importContacts(selectedContacts, assertNotNull(contactListId));
		const imported = nativeContactSyncManager.isEnabled() && await nativeContactSyncManager.syncContacts();
		if (imported && isIOSApp()) {
			const contactsWeJustImported = selectedStructuredContacts.map((contact) => assertNotNull(contact.rawId));
			const remove = await Dialog.confirm("importContactRemoveImportedContactsConfirm_msg");
			if (remove) await showProgressDialog("progressDeleting_msg", mobileContactsFacade.deleteLocalContacts(contactsWeJustImported));
		}
	}
	async selectContactBooks(mobileContactsFacade) {
		const contactBooks = await showProgressDialog("pleaseWait_msg", mobileContactsFacade.getContactBooks());
		if (contactBooks.length === 0) return null;
else if (contactBooks.length === 1) return contactBooks;
else {
			const importDialog = new ImportNativeContactBooksDialog(contactBooks);
			const selectedBooks = await importDialog.show();
			if (selectedBooks == null || selectedBooks.length === 0) return null;
			return selectedBooks;
		}
	}
	contactFromStructuredContact(ownerGroupId, contact) {
		return createContact({
			_ownerGroup: ownerGroupId,
			nickname: contact.nickname,
			firstName: contact.firstName,
			lastName: contact.lastName,
			company: contact.company,
			addresses: contact.addresses.map((address) => createContactAddress({
				type: address.type,
				address: address.address,
				customTypeName: address.customTypeName
			})),
			mailAddresses: contact.mailAddresses.map((address) => createContactMailAddress({
				type: address.type,
				address: address.address,
				customTypeName: address.customTypeName
			})),
			phoneNumbers: contact.phoneNumbers.map((number) => createContactPhoneNumber({
				type: number.type,
				number: number.number,
				customTypeName: number.customTypeName
			})),
			oldBirthdayAggregate: null,
			oldBirthdayDate: null,
			photo: null,
			presharedPassword: null,
			socialIds: [],
			birthdayIso: this.validateBirthdayOfContact(contact),
			pronouns: [],
			customDate: contact.customDate.map((date) => createContactCustomDate(date)),
			department: contact.department,
			messengerHandles: contact.messengerHandles.map((handle) => createContactMessengerHandle(handle)),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			relationships: contact.relationships.map((relation) => createContactRelationship(relation)),
			websites: contact.websites.map((website) => createContactWebsite(website)),
			comment: contact.notes,
			title: contact.title ?? "",
			role: contact.role
		});
	}
	validateBirthdayOfContact(contact) {
		if (contact.birthday != null) try {
			isoDateToBirthday(contact.birthday);
			return contact.birthday;
		} catch (_) {
			return null;
		}
else return null;
	}
};
function showContactImportDialog(contacts, okAction, title) {
	const viewModel = new ContactImportDialogViewModel();
	viewModel.selectContacts(contacts);
	const renderConfig = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			return new KindaContactRow(dom, (selectedContact) => viewModel.selectSingleContact(selectedContact), () => true);
		}
	};
	const dialog = new Dialog(DialogType.EditSmall, { view: () => [mithril_default(DialogHeaderBar, {
		left: [{
			type: ButtonType.Secondary,
			label: "cancel_action",
			click: () => {
				dialog.close();
			}
		}],
		middle: title,
		right: [{
			type: ButtonType.Primary,
			label: "import_action",
			click: () => {
				const selectedContacts = [...viewModel.getSelectedContacts()];
				if (selectedContacts.length <= 0) Dialog.message("noContact_msg");
else okAction(dialog, selectedContacts);
			}
		}]
	}), mithril_default(".dialog-max-height.plr-s.pb.text-break.nav-bg", [mithril_default(".list-bg.border-radius.mt-s.ml-s.mr-s", mithril_default(SelectAllCheckbox, {
		style: { "padding-left": "0" },
		selected: viewModel.isAllContactsSelected(contacts),
		selectNone: () => viewModel.clearSelection(),
		selectAll: () => viewModel.selectContacts(contacts)
	})), mithril_default(".flex.col.rel.mt-s", { style: { height: "80vh" } }, mithril_default(List, {
		renderConfig,
		state: {
			items: contacts,
			loadingStatus: ListLoadingState.Done,
			loadingAll: false,
			selectedItems: viewModel.getSelectedContacts(),
			inMultiselect: true,
			activeIndex: null
		},
		onLoadMore() {},
		onRangeSelectionTowards(item) {},
		onRetryLoading() {},
		onSingleSelection(item) {
			viewModel.selectSingleContact(item);
		},
		onSingleTogglingMultiselection(item) {},
		onStopLoading() {}
	}))])] }).show();
}
var ContactImportDialogViewModel = class {
	selectedContacts = new Set();
	getSelectedContacts() {
		return new Set(this.selectedContacts);
	}
	isAllContactsSelected(contacts) {
		const unselectedContacts = contacts.filter((contact) => !this.selectedContacts.has(contact));
		return unselectedContacts.length <= 0;
	}
	clearSelection() {
		this.selectedContacts.clear();
	}
	selectSingleContact(selectedContact) {
		if (this.selectedContacts.has(selectedContact)) this.selectedContacts.delete(selectedContact);
else this.selectedContacts.add(selectedContact);
	}
	selectContacts(contacts) {
		this.selectedContacts.clear();
		for (const contact of contacts) this.selectedContacts.add(contact);
	}
};
async function parseContacts(fileList, fileApp) {
	const rawContacts = [];
	for (const file of fileList) if (getAttachmentType(file.mimeType) === AttachmentType.CONTACT) {
		const dataFile = await fileApp.readDataFile(file.location);
		if (dataFile == null) continue;
		const decoder = new TextDecoder("utf-8");
		const vCardData = decoder.decode(dataFile.data);
		rawContacts.push(vCardData);
	}
	return rawContacts;
}

//#endregion
export { ContactImporter, parseContacts };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGFjdEltcG9ydGVyLWNodW5rLmpzIiwibmFtZXMiOlsidkNhcmRGaWxlRGF0YTogc3RyaW5nIiwiZGV0YWlsczogc3RyaW5nIiwiZGV0YWlsczogc3RyaW5nW10iLCJhZGRyZXNzRGV0YWlsczogc3RyaW5nIiwiZW5jb2Rpbmc6IHN0cmluZyIsImNoYXJzZXQ6IHN0cmluZyIsInRleHQ6IHN0cmluZyIsImNzOiBzdHJpbmciLCJsOiBzdHJpbmciLCJwcm9wZXJ0eTogc3RyaW5nIiwidGFnVmFsdWU6IHN0cmluZyIsInZDYXJkTGlzdDogc3RyaW5nW10iLCJvd25lckdyb3VwSWQ6IElkIiwiY29udGFjdHM6IENvbnRhY3RbXSIsImxhc3ROYW1lOiBzdHJpbmciLCJmaXJzdE5hbWU6IHN0cmluZyIsInRpdGxlOiBzdHJpbmcgfCBudWxsIiwiYmlydGhkYXlJc286IHN0cmluZyB8IG51bGwiLCJjb21wYW55OiBzdHJpbmciLCJjb21tZW50OiBzdHJpbmciLCJuaWNrbmFtZTogc3RyaW5nIHwgbnVsbCIsImFkZHJlc3NlczogQXJyYXk8Q29udGFjdEFkZHJlc3M+IiwibWFpbEFkZHJlc3NlczogQXJyYXk8Q29udGFjdE1haWxBZGRyZXNzPiIsInBob25lTnVtYmVyczogQXJyYXk8Q29udGFjdFBob25lTnVtYmVyPiIsIndlYnNpdGVzOiBBcnJheTxDb250YWN0V2Vic2l0ZT4iLCJyZWxhdGlvbnNoaXBzOiBBcnJheTxDb250YWN0UmVsYXRpb25zaGlwPiIsInByb25vdW5zOiBBcnJheTxDb250YWN0UHJvbm91bnM+IiwibWVzc2VuZ2VySGFuZGxlczogQXJyYXk8Q29udGFjdE1lc3NlbmdlckhhbmRsZT4iLCJpIiwiYkRheURldGFpbHM6IEJpcnRoZGF5IHwgbnVsbCIsImxhbmciLCJ2Q2FyZEFkZHJlc3NWYWx1ZTogc3RyaW5nIiwidHlwZTogQ29udGFjdEFkZHJlc3NUeXBlIiwidkNhcmRQaG9uZU51bWJlclZhbHVlOiBzdHJpbmciLCJ0eXBlOiBDb250YWN0UGhvbmVOdW1iZXJUeXBlIiwidkNhcmRNYWlsQWRkcmVzc1ZhbHVlOiBzdHJpbmciLCJyZWxhdGlvbnNoaXBQZXJzb246IHN0cmluZyIsInR5cGU6IENvbnRhY3RSZWxhdGlvbnNoaXBUeXBlIiwicHJvbm91bnM6IHN0cmluZyIsInByb25vdW5zQXJyYXk6IEFycmF5PENvbnRhY3RQcm9ub3Vucz4iLCJsYW5nOiBzdHJpbmciLCJoYW5kbGU6IHN0cmluZyIsIm1lc3NlbmdlckhhbmRsZUFycmF5OiBBcnJheTxDb250YWN0TWVzc2VuZ2VySGFuZGxlPiIsInR5cGU6IENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlIiwiY3VzdG9tVHlwZU5hbWU6IHN0cmluZyIsImNvbnRhY3RCb29rczogUmVhZG9ubHlBcnJheTxDb250YWN0Qm9vaz4iLCJib29rOiBDb250YWN0Qm9vayIsImNvbnRhY3RGYWNhZGU6IENvbnRhY3RGYWNhZGUiLCJzeXN0ZW1QZXJtaXNzaW9uSGFuZGxlcjogU3lzdGVtUGVybWlzc2lvbkhhbmRsZXIiLCJtb2JpbGVDb250YWN0c0ZhY2FkZTogTW9iaWxlQ29udGFjdHNGYWNhZGUgfCBudWxsIiwibmF0aXZlQ29udGFjdFN5bmNNYW5hZ2VyOiBOYXRpdmVDb250YWN0c1N5bmNNYW5hZ2VyIHwgbnVsbCIsInZDYXJkRGF0YTogc3RyaW5nIHwgc3RyaW5nW10iLCJjb250YWN0TGlzdElkOiBzdHJpbmciLCJ2Q2FyZERhdGE6IHN0cmluZ1tdIiwiY29udGFjdHM6IFJlYWRvbmx5QXJyYXk8Q29udGFjdD4iLCJhbGxJbXBvcnRhYmxlU3RydWN0dXJlZENvbnRhY3RzOiBTdHJ1Y3R1cmVkQ29udGFjdFtdIiwiY29udGFjdExpc3RJZDogc3RyaW5nIHwgbnVsbCIsInNlbGVjdGVkQ29udGFjdHM6IENvbnRhY3RbXSIsImFsbEltcG9ydGFibGVDb250YWN0czogTWFwPENvbnRhY3QsIFN0cnVjdHVyZWRDb250YWN0PiIsInNlbGVjdGVkU3RydWN0dXJlZENvbnRhY3RzOiBTdHJ1Y3R1cmVkQ29udGFjdFtdIiwibW9iaWxlQ29udGFjdHNGYWNhZGU6IE1vYmlsZUNvbnRhY3RzRmFjYWRlIiwib3duZXJHcm91cElkOiBJZCIsImNvbnRhY3Q6IFN0cnVjdHVyZWRDb250YWN0IiwiY29udGFjdHM6IENvbnRhY3RbXSIsIm9rQWN0aW9uOiAoZGlhbG9nOiBEaWFsb2csIHNlbGVjdGVkQ29udGFjdHM6IENvbnRhY3RbXSkgPT4gdW5rbm93biIsInRpdGxlOiBNYXliZVRyYW5zbGF0aW9uIiwidmlld01vZGVsOiBDb250YWN0SW1wb3J0RGlhbG9nVmlld01vZGVsIiwicmVuZGVyQ29uZmlnOiBSZW5kZXJDb25maWc8Q29udGFjdCwgS2luZGFDb250YWN0Um93PiIsInNlbGVjdGVkQ29udGFjdDogQ29udGFjdCIsIml0ZW06IENvbnRhY3QiLCJmaWxlTGlzdDogRmlsZVJlZmVyZW5jZVtdIiwiZmlsZUFwcDogTmF0aXZlRmlsZUFwcCIsInJhd0NvbnRhY3RzOiBzdHJpbmdbXSJdLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWlsLWFwcC9jb250YWN0cy9WQ2FyZEltcG9ydGVyLnRzIiwiLi4vc3JjL21haWwtYXBwL2NvbnRhY3RzL3ZpZXcvSW1wb3J0TmF0aXZlQ29udGFjdEJvb2tzRGlhbG9nLnRzIiwiLi4vc3JjL21haWwtYXBwL2NvbnRhY3RzL0NvbnRhY3RJbXBvcnRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRCaXJ0aGRheSxcblx0Q29udGFjdCxcblx0Q29udGFjdEFkZHJlc3MsXG5cdENvbnRhY3RNYWlsQWRkcmVzcyxcblx0Q29udGFjdE1lc3NlbmdlckhhbmRsZSxcblx0Q29udGFjdFBob25lTnVtYmVyLFxuXHRDb250YWN0UHJvbm91bnMsXG5cdENvbnRhY3RSZWxhdGlvbnNoaXAsXG5cdENvbnRhY3RXZWJzaXRlLFxuXHRjcmVhdGVCaXJ0aGRheSxcblx0Y3JlYXRlQ29udGFjdCxcblx0Y3JlYXRlQ29udGFjdEFkZHJlc3MsXG5cdGNyZWF0ZUNvbnRhY3RNYWlsQWRkcmVzcyxcblx0Y3JlYXRlQ29udGFjdE1lc3NlbmdlckhhbmRsZSxcblx0Y3JlYXRlQ29udGFjdFBob25lTnVtYmVyLFxuXHRjcmVhdGVDb250YWN0UHJvbm91bnMsXG5cdGNyZWF0ZUNvbnRhY3RSZWxhdGlvbnNoaXAsXG5cdGNyZWF0ZUNvbnRhY3RXZWJzaXRlLFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRDb250YWN0QWRkcmVzc1R5cGUsXG5cdENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlLFxuXHRDb250YWN0UGhvbmVOdW1iZXJUeXBlLFxuXHRDb250YWN0UmVsYXRpb25zaGlwVHlwZSxcblx0Q29udGFjdFdlYnNpdGVUeXBlLFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgZGVjb2RlQmFzZTY0LCBkZWNvZGVRdW90ZWRQcmludGFibGUgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGJpcnRoZGF5VG9Jc29EYXRlLCBpc1ZhbGlkQmlydGhkYXkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQmlydGhkYXlVdGlsc1wiXG5pbXBvcnQgeyBQYXJzaW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUGFyc2luZ0Vycm9yXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbi8qKlxuICogc3BsaXQgZmlsZSBjb250ZW50IHdpdGggbXVsdGlwbGUgdkNhcmRzIGludG8gYSBsaXN0IG9mIHZDYXJkIHN0cmluZ3NcbiAqIEBwYXJhbSB2Q2FyZEZpbGVEYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2Q2FyZEZpbGVUb1ZDYXJkcyh2Q2FyZEZpbGVEYXRhOiBzdHJpbmcpOiBzdHJpbmdbXSB8IG51bGwge1xuXHRsZXQgVjQgPSBcIlxcblZFUlNJT046NC4wXCJcblx0bGV0IFYzID0gXCJcXG5WRVJTSU9OOjMuMFwiXG5cdGxldCBWMiA9IFwiXFxuVkVSU0lPTjoyLjFcIlxuXHRsZXQgQiA9IFwiQkVHSU46VkNBUkRcXG5cIlxuXHRsZXQgRSA9IFwiRU5EOlZDQVJEXCJcblx0dkNhcmRGaWxlRGF0YSA9IHZDYXJkRmlsZURhdGEucmVwbGFjZSgvYmVnaW46dmNhcmQvZywgXCJCRUdJTjpWQ0FSRFwiKVxuXHR2Q2FyZEZpbGVEYXRhID0gdkNhcmRGaWxlRGF0YS5yZXBsYWNlKC9lbmQ6dmNhcmQvZywgXCJFTkQ6VkNBUkRcIilcblx0dkNhcmRGaWxlRGF0YSA9IHZDYXJkRmlsZURhdGEucmVwbGFjZSgvdmVyc2lvbjoyLjEvZywgXCJWRVJTSU9OOjIuMVwiKVxuXG5cdGlmIChcblx0XHR2Q2FyZEZpbGVEYXRhLmluZGV4T2YoXCJCRUdJTjpWQ0FSRFwiKSA+IC0xICYmXG5cdFx0dkNhcmRGaWxlRGF0YS5pbmRleE9mKEUpID4gLTEgJiZcblx0XHQodkNhcmRGaWxlRGF0YS5pbmRleE9mKFY0KSA+IC0xIHx8IHZDYXJkRmlsZURhdGEuaW5kZXhPZihWMykgPiAtMSB8fCB2Q2FyZEZpbGVEYXRhLmluZGV4T2YoVjIpID4gLTEpXG5cdCkge1xuXHRcdHZDYXJkRmlsZURhdGEgPSB2Q2FyZEZpbGVEYXRhLnJlcGxhY2UoL1xcci9nLCBcIlwiKVxuXHRcdHZDYXJkRmlsZURhdGEgPSB2Q2FyZEZpbGVEYXRhLnJlcGxhY2UoL1xcbiAvZywgXCJcIikgLy9mb2xkaW5nIHN5bWJvbHMgcmVtb3ZlZFxuXG5cdFx0dkNhcmRGaWxlRGF0YSA9IHZDYXJkRmlsZURhdGEucmVwbGFjZSgvXFxuRU5EOlZDQVJEXFxuXFxuL2csIFwiXCIpXG5cdFx0dkNhcmRGaWxlRGF0YSA9IHZDYXJkRmlsZURhdGEucmVwbGFjZSgvXFxuRU5EOlZDQVJEXFxuL2csIFwiXCIpXG5cdFx0dkNhcmRGaWxlRGF0YSA9IHZDYXJkRmlsZURhdGEucmVwbGFjZSgvXFxuRU5EOlZDQVJEL2csIFwiXCIpXG5cdFx0dkNhcmRGaWxlRGF0YSA9IHZDYXJkRmlsZURhdGEuc3Vic3RyaW5nKHZDYXJkRmlsZURhdGEuaW5kZXhPZihCKSArIEIubGVuZ3RoKVxuXHRcdHJldHVybiB2Q2FyZEZpbGVEYXRhLnNwbGl0KEIpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdkNhcmRFc2NhcGluZ1NwbGl0KGRldGFpbHM6IHN0cmluZyk6IHN0cmluZ1tdIHtcblx0ZGV0YWlscyA9IGRldGFpbHMucmVwbGFjZSgvXFxcXFxcXFwvZywgXCItLWJzbGFzaGJzbGFzaCsrXCIpXG5cdGRldGFpbHMgPSBkZXRhaWxzLnJlcGxhY2UoL1xcXFw7L2csIFwiLS1zZW1pQ29sb25zZW1pQ29sb24rK1wiKVxuXHRkZXRhaWxzID0gZGV0YWlscy5yZXBsYWNlKC9cXFxcOi9nLCBcIi0tZFB1bmt0ZFB1bmt0KytcIilcblx0bGV0IGFycmF5ID0gZGV0YWlscy5zcGxpdChcIjtcIilcblx0YXJyYXkgPSBhcnJheS5tYXAoKGVsZW0pID0+IHtcblx0XHRyZXR1cm4gZWxlbS50cmltKClcblx0fSlcblx0cmV0dXJuIGFycmF5XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2Q2FyZFJlZXNjYXBpbmdBcnJheShkZXRhaWxzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcblx0cmV0dXJuIGRldGFpbHMubWFwKChhKSA9PiB7XG5cdFx0YSA9IGEucmVwbGFjZSgvLS1ic2xhc2hic2xhc2hcXCtcXCsvZywgXCJcXFxcXCIpXG5cdFx0YSA9IGEucmVwbGFjZSgvLS1zZW1pQ29sb25zZW1pQ29sb25cXCtcXCsvZywgXCI7XCIpXG5cdFx0YSA9IGEucmVwbGFjZSgvLS1kUHVua3RkUHVua3RcXCtcXCsvZywgXCI6XCIpXG5cdFx0YSA9IGEucmVwbGFjZSgvXFxcXG4vZywgXCJcXG5cIilcblx0XHRhID0gYS5yZXBsYWNlKC9cXFxcLC9nLCBcIixcIilcblx0XHRyZXR1cm4gYVxuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdkNhcmRFc2NhcGluZ1NwbGl0QWRyKGFkZHJlc3NEZXRhaWxzOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG5cdGFkZHJlc3NEZXRhaWxzID0gYWRkcmVzc0RldGFpbHMucmVwbGFjZSgvXFxcXFxcXFwvZywgXCItLWJzbGFzaGJzbGFzaCsrXCIpXG5cdGFkZHJlc3NEZXRhaWxzID0gYWRkcmVzc0RldGFpbHMucmVwbGFjZSgvXFxcXDsvZywgXCItLXNlbWlDb2xvbnNlbWlDb2xvbisrXCIpXG5cdGxldCBhcnJheSA9IGFkZHJlc3NEZXRhaWxzLnNwbGl0KFwiO1wiKVxuXHRyZXR1cm4gYXJyYXkubWFwKChlbGVtKSA9PiB7XG5cdFx0aWYgKGVsZW0udHJpbSgpLmxlbmd0aCA+IDApIHtcblx0XHRcdHJldHVybiBlbGVtLnRyaW0oKS5jb25jYXQoXCJcXG5cIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbmVlZGVkIGZvciBvbmx5IFNwYWNlIGVsZW1lbnRzIGluIEFkZHJlc3Ncblx0XHRcdHJldHVybiBcIlwiXG5cdFx0fVxuXHR9KVxufVxuXG5mdW5jdGlvbiBfZGVjb2RlVGFnKGVuY29kaW5nOiBzdHJpbmcsIGNoYXJzZXQ6IHN0cmluZywgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcblx0bGV0IGRlY29kZXIgPSAoY3M6IHN0cmluZywgbDogc3RyaW5nKSA9PiBsXG5cblx0c3dpdGNoIChlbmNvZGluZy50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0Y2FzZSBcInF1b3RlZC1wcmludGFibGU6XCI6XG5cdFx0XHRkZWNvZGVyID0gZGVjb2RlUXVvdGVkUHJpbnRhYmxlXG5cdFx0XHRicmVha1xuXG5cdFx0Y2FzZSBcImJhc2U2NDpcIjpcblx0XHRcdGRlY29kZXIgPSBkZWNvZGVCYXNlNjRcblx0fVxuXG5cdHJldHVybiB0ZXh0XG5cdFx0LnNwbGl0KFwiO1wiKVxuXHRcdC5tYXAoKGxpbmUpID0+IGRlY29kZXIoY2hhcnNldCwgbGluZSkpXG5cdFx0LmpvaW4oXCI7XCIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5OiBzdHJpbmcsIHRhZ1ZhbHVlOiBzdHJpbmcpIHtcblx0Y29uc3QgZXhwID0gbmV3IFJlZ0V4cChwcm9wZXJ0eSArIFwiPSguKj8pWzo7XVwiLCBcImdpXCIpXG5cdHJldHVybiAoQXJyYXkuZnJvbSh0YWdWYWx1ZS5tYXRjaEFsbChleHApLCAobSkgPT4gbVsxXSlbMF0gPz8gXCJcIikudHJpbSgpXG59XG5cbi8qKlxuICogQHJldHVybnMgVGhlIGxpc3Qgb2YgY3JlYXRlZCBDb250YWN0IGluc3RhbmNlcyAoYnV0IG5vdCB5ZXQgc2F2ZWQpIG9yIG51bGwgaWYgdkNhcmRGaWxlRGF0YSBpcyBub3QgYSB2YWxpZCB2Q2FyZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2Q2FyZExpc3RUb0NvbnRhY3RzKHZDYXJkTGlzdDogc3RyaW5nW10sIG93bmVyR3JvdXBJZDogSWQpOiBDb250YWN0W10ge1xuXHRsZXQgY29udGFjdHM6IENvbnRhY3RbXSA9IFtdXG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2Q2FyZExpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgbGFzdE5hbWU6IHN0cmluZyA9IFwiXCJcblx0XHRsZXQgZmlyc3ROYW1lOiBzdHJpbmcgPSBcIlwiXG5cdFx0bGV0IHRpdGxlOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXHRcdGxldCBiaXJ0aGRheUlzbzogc3RyaW5nIHwgbnVsbCA9IG51bGxcblx0XHRsZXQgY29tcGFueTogc3RyaW5nID0gXCJcIlxuXHRcdGxldCBjb21tZW50OiBzdHJpbmcgPSBcIlwiXG5cdFx0bGV0IG5pY2tuYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXHRcdGxldCByb2xlID0gXCJcIlxuXHRcdGxldCBkZXBhcnRtZW50ID0gXCJcIlxuXHRcdGxldCBtaWRkbGVOYW1lID0gXCJcIlxuXHRcdGxldCBzdWZmaXggPSBcIlwiXG5cdFx0Y29uc3QgYWRkcmVzc2VzOiBBcnJheTxDb250YWN0QWRkcmVzcz4gPSBbXVxuXHRcdGNvbnN0IG1haWxBZGRyZXNzZXM6IEFycmF5PENvbnRhY3RNYWlsQWRkcmVzcz4gPSBbXVxuXHRcdGNvbnN0IHBob25lTnVtYmVyczogQXJyYXk8Q29udGFjdFBob25lTnVtYmVyPiA9IFtdXG5cdFx0Y29uc3Qgd2Vic2l0ZXM6IEFycmF5PENvbnRhY3RXZWJzaXRlPiA9IFtdXG5cdFx0Y29uc3QgcmVsYXRpb25zaGlwczogQXJyYXk8Q29udGFjdFJlbGF0aW9uc2hpcD4gPSBbXVxuXHRcdGNvbnN0IHByb25vdW5zOiBBcnJheTxDb250YWN0UHJvbm91bnM+ID0gW11cblx0XHRjb25zdCBtZXNzZW5nZXJIYW5kbGVzOiBBcnJheTxDb250YWN0TWVzc2VuZ2VySGFuZGxlPiA9IFtdXG5cdFx0bGV0IHZDYXJkTGluZXMgPSB2Q2FyZExpc3RbaV0uc3BsaXQoXCJcXG5cIilcblxuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgdkNhcmRMaW5lcy5sZW5ndGg7IGorKykge1xuXHRcdFx0bGV0IGluZGV4QWZ0ZXJUYWcgPSB2Q2FyZExpbmVzW2pdLmluZGV4T2YoXCI6XCIpXG5cdFx0XHRsZXQgdGFnQW5kVHlwZVN0cmluZyA9IHZDYXJkTGluZXNbal0uc3Vic3RyaW5nKDAsIGluZGV4QWZ0ZXJUYWcpLnRvVXBwZXJDYXNlKClcblx0XHRcdGxldCB0YWdOYW1lID0gdGFnQW5kVHlwZVN0cmluZy5zcGxpdChcIjtcIilbMF1cblx0XHRcdGxldCB0YWdWYWx1ZSA9IHZDYXJkTGluZXNbal0uc3Vic3RyaW5nKGluZGV4QWZ0ZXJUYWcgKyAxKVxuXHRcdFx0bGV0IGVuY29kaW5nT2JqID0gdkNhcmRMaW5lc1tqXS5zcGxpdChcIjtcIikuZmluZCgobGluZSkgPT4gbGluZS5pbmNsdWRlcyhcIkVOQ09ESU5HPVwiKSlcblx0XHRcdGxldCBlbmNvZGluZyA9IGVuY29kaW5nT2JqID8gZW5jb2RpbmdPYmouc3BsaXQoXCI9XCIpWzFdIDogXCJcIlxuXHRcdFx0bGV0IGNoYXJzZXRPYmogPSB2Q2FyZExpbmVzW2pdLnNwbGl0KFwiO1wiKS5maW5kKChsaW5lKSA9PiBsaW5lLmluY2x1ZGVzKFwiQ0hBUlNFVD1cIikpXG5cdFx0XHRsZXQgY2hhcnNldCA9IGNoYXJzZXRPYmogPyBjaGFyc2V0T2JqLnNwbGl0KFwiPVwiKVsxXSA6IFwidXRmLThcIlxuXHRcdFx0dGFnVmFsdWUgPSBfZGVjb2RlVGFnKGVuY29kaW5nLCBjaGFyc2V0LCB0YWdWYWx1ZSlcblxuXHRcdFx0c3dpdGNoICh0YWdOYW1lKSB7XG5cdFx0XHRcdGNhc2UgXCJOXCI6IHtcblx0XHRcdFx0XHRsZXQgbmFtZURldGFpbHMgPSB2Q2FyZFJlZXNjYXBpbmdBcnJheSh2Q2FyZEVzY2FwaW5nU3BsaXQodGFnVmFsdWUpKVxuXG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IG5hbWVEZXRhaWxzLmxlbmd0aDsgbmFtZURldGFpbHMubGVuZ3RoIDwgNDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRuYW1lRGV0YWlscy5wdXNoKFwiXCIpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGFzdE5hbWUgPSBuYW1lRGV0YWlsc1swXVxuXHRcdFx0XHRcdGZpcnN0TmFtZSA9IG5hbWVEZXRhaWxzWzFdXG5cdFx0XHRcdFx0bWlkZGxlTmFtZSA9IG5hbWVEZXRhaWxzWzJdXG5cdFx0XHRcdFx0dGl0bGUgPSBuYW1lRGV0YWlsc1szXVxuXHRcdFx0XHRcdHN1ZmZpeCA9IG5hbWVEZXRhaWxzWzRdXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgXCJGTlwiOlxuXHRcdFx0XHRcdC8vVGh1bmRlcmJpcmQgY2FuIGV4cG9ydCBGVUxMTkFNRSB0YWcgaWYgdGhhdCBpcyBnaXZlbiB3aXRoIHRoZSBlbWFpbCBhZGRyZXNzIGF1dG9tYXRpYyBjb250YWN0IGNyZWF0aW9uLiBJZiB0aGVyZSBpcyBubyBmaXJzdCBuYW1lIG9yIHNlY29uZCBuYW1lIHRoZSBuYW1lc3RyaW5nIHdpbGwgYmUgc2F2ZWQgYXMgZnVsbCBuYW1lLlxuXHRcdFx0XHRcdGlmIChmaXJzdE5hbWUgPT09IFwiXCIgJiYgbGFzdE5hbWUgPT09IFwiXCIgJiYgdGl0bGUgPT0gbnVsbCAmJiBtaWRkbGVOYW1lID09PSBcIlwiICYmIHN1ZmZpeCA9PT0gXCJcIikge1xuXHRcdFx0XHRcdFx0bGV0IGZ1bGxOYW1lID0gdkNhcmRSZWVzY2FwaW5nQXJyYXkodkNhcmRFc2NhcGluZ1NwbGl0KHRhZ1ZhbHVlKSlcblx0XHRcdFx0XHRcdGZpcnN0TmFtZSA9IGZ1bGxOYW1lLmpvaW4oXCIgXCIpLnJlcGxhY2UoL1wiL2csIFwiXCIpIC8vVGh1bmRlcmJpcmQgc2F2ZXMgdGhlIEZ1bGxuYW1lIGluIFwicXVvdGVhdGlvbnMgbWFya3NcIiB0aGV5IGFyZSBkZWxldGVkIGhlcmVcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRicmVha1xuXG5cdFx0XHRcdGNhc2UgXCJCREFZXCI6IHtcblx0XHRcdFx0XHRsZXQgaW5kZXhPZlQgPSB0YWdWYWx1ZS5pbmRleE9mKFwiVFwiKVxuXHRcdFx0XHRcdGxldCBiRGF5RGV0YWlsczogQmlydGhkYXkgfCBudWxsID0gbnVsbFxuXG5cdFx0XHRcdFx0aWYgKHRhZ1ZhbHVlLm1hdGNoKC8tLVxcZHs0fS9nKSkge1xuXHRcdFx0XHRcdFx0YkRheURldGFpbHMgPSBjcmVhdGVCaXJ0aGRheSh7XG5cdFx0XHRcdFx0XHRcdG1vbnRoOiB0YWdWYWx1ZS5zdWJzdHJpbmcoMiwgNCksXG5cdFx0XHRcdFx0XHRcdGRheTogdGFnVmFsdWUuc3Vic3RyaW5nKDQsIDYpLFxuXHRcdFx0XHRcdFx0XHR5ZWFyOiBudWxsLFxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRhZ1ZhbHVlLm1hdGNoKC9cXGR7NH0tXFxkezJ9LVxcZHsyfS9nKSkge1xuXHRcdFx0XHRcdFx0bGV0IGJEYXkgPSB0YWdWYWx1ZS5zdWJzdHJpbmcoMCwgaW5kZXhPZlQgIT09IC0xID8gaW5kZXhPZlQgOiB0YWdWYWx1ZS5sZW5ndGgpLnNwbGl0KFwiLVwiKVxuXHRcdFx0XHRcdFx0YkRheURldGFpbHMgPSBjcmVhdGVCaXJ0aGRheSh7XG5cdFx0XHRcdFx0XHRcdHllYXI6IGJEYXlbMF0udHJpbSgpLFxuXHRcdFx0XHRcdFx0XHRtb250aDogYkRheVsxXS50cmltKCksXG5cdFx0XHRcdFx0XHRcdGRheTogYkRheVsyXS50cmltKCksXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGFnVmFsdWUubWF0Y2goL1xcZHs4fS9nKSkge1xuXHRcdFx0XHRcdFx0YkRheURldGFpbHMgPSBjcmVhdGVCaXJ0aGRheSh7XG5cdFx0XHRcdFx0XHRcdHllYXI6IHRhZ1ZhbHVlLnN1YnN0cmluZygwLCA0KSxcblx0XHRcdFx0XHRcdFx0bW9udGg6IHRhZ1ZhbHVlLnN1YnN0cmluZyg0LCA2KSxcblx0XHRcdFx0XHRcdFx0ZGF5OiB0YWdWYWx1ZS5zdWJzdHJpbmcoNiwgOCksXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChiRGF5RGV0YWlscyAmJiBiRGF5RGV0YWlscy55ZWFyID09PSBcIjExMTFcIikge1xuXHRcdFx0XHRcdFx0Ly8gd2UgdXNlIDExMTEgYXMgbWFya2VyIGlmIG5vIHllYXIgaGFzIGJlZW4gZGVmaW5lZCBhcyB2Y2FyZCAzLjAgZG9lcyBub3Qgc3VwcG9ydCBkYXRlcyB3aXRob3V0IHllYXJcblx0XHRcdFx0XHRcdGJEYXlEZXRhaWxzLnllYXIgPSBudWxsXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGJpcnRoZGF5SXNvID0gYkRheURldGFpbHMgJiYgaXNWYWxpZEJpcnRoZGF5KGJEYXlEZXRhaWxzKSA/IGJpcnRoZGF5VG9Jc29EYXRlKGJEYXlEZXRhaWxzKSA6IG51bGxcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFBhcnNpbmdFcnJvcikge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImZhaWxlZCB0byBwYXJzZSBiaXJ0aGRheVwiLCBlKVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlIFwiT1JHXCI6IHtcblx0XHRcdFx0XHRsZXQgb3JnRGV0YWlscyA9IHZDYXJkUmVlc2NhcGluZ0FycmF5KHZDYXJkRXNjYXBpbmdTcGxpdCh0YWdWYWx1ZSkpXG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IG9yZ0RldGFpbHMubGVuZ3RoOyBvcmdEZXRhaWxzLmxlbmd0aCA8IDI7IGkrKykge1xuXHRcdFx0XHRcdFx0b3JnRGV0YWlscy5wdXNoKFwiXCIpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZGVwYXJ0bWVudCA9IG9yZ0RldGFpbHMucG9wKCkgPz8gXCJcIlxuXHRcdFx0XHRcdGNvbXBhbnkgPSBvcmdEZXRhaWxzLmpvaW4oXCIgXCIpXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgXCJOT1RFXCI6IHtcblx0XHRcdFx0XHRsZXQgbm90ZSA9IHZDYXJkUmVlc2NhcGluZ0FycmF5KHZDYXJkRXNjYXBpbmdTcGxpdCh0YWdWYWx1ZSkpXG5cdFx0XHRcdFx0Y29tbWVudCA9IG5vdGUuam9pbihcIiBcIilcblx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSBcIkFEUlwiOlxuXHRcdFx0XHRjYXNlIFwiSVRFTTEuQURSXCI6IC8vIG5lY2Vzc2FyeSBmb3IgYXBwbGUgdmNhcmRzXG5cdFx0XHRcdGNhc2UgXCJJVEVNMi5BRFJcIjpcblx0XHRcdFx0XHQvLyBuZWNlc3NhcnkgZm9yIGFwcGxlIHZjYXJkc1xuXHRcdFx0XHRcdGlmICh0YWdBbmRUeXBlU3RyaW5nLmluZGV4T2YoXCJIT01FXCIpID4gLTEpIHtcblx0XHRcdFx0XHRcdF9hZGRBZGRyZXNzKHRhZ1ZhbHVlLCBhZGRyZXNzZXMsIENvbnRhY3RBZGRyZXNzVHlwZS5QUklWQVRFKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGFnQW5kVHlwZVN0cmluZy5pbmRleE9mKFwiV09SS1wiKSA+IC0xKSB7XG5cdFx0XHRcdFx0XHRfYWRkQWRkcmVzcyh0YWdWYWx1ZSwgYWRkcmVzc2VzLCBDb250YWN0QWRkcmVzc1R5cGUuV09SSylcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X2FkZEFkZHJlc3ModGFnVmFsdWUsIGFkZHJlc3NlcywgQ29udGFjdEFkZHJlc3NUeXBlLk9USEVSKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBcIkVNQUlMXCI6XG5cdFx0XHRcdGNhc2UgXCJJVEVNMS5FTUFJTFwiOiAvLyBuZWNlc3NhcnkgZm9yIGFwcGxlIGFuZCBwcm90b25tYWlsIHZjYXJkc1xuXHRcdFx0XHRjYXNlIFwiSVRFTTIuRU1BSUxcIjpcblx0XHRcdFx0XHQvLyBuZWNlc3NhcnkgZm9yIGFwcGxlIHZjYXJkc1xuXHRcdFx0XHRcdGlmICh0YWdBbmRUeXBlU3RyaW5nLmluZGV4T2YoXCJIT01FXCIpID4gLTEpIHtcblx0XHRcdFx0XHRcdF9hZGRNYWlsQWRkcmVzcyh0YWdWYWx1ZSwgbWFpbEFkZHJlc3NlcywgQ29udGFjdEFkZHJlc3NUeXBlLlBSSVZBVEUpXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0YWdBbmRUeXBlU3RyaW5nLmluZGV4T2YoXCJXT1JLXCIpID4gLTEpIHtcblx0XHRcdFx0XHRcdF9hZGRNYWlsQWRkcmVzcyh0YWdWYWx1ZSwgbWFpbEFkZHJlc3NlcywgQ29udGFjdEFkZHJlc3NUeXBlLldPUkspXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdF9hZGRNYWlsQWRkcmVzcyh0YWdWYWx1ZSwgbWFpbEFkZHJlc3NlcywgQ29udGFjdEFkZHJlc3NUeXBlLk9USEVSKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBcIlRFTFwiOlxuXHRcdFx0XHRjYXNlIFwiSVRFTTEuVEVMXCI6IC8vIG5lY2Vzc2FyeSBmb3IgYXBwbGUgdmNhcmRzXG5cdFx0XHRcdGNhc2UgXCJJVEVNMi5URUxcIjpcblx0XHRcdFx0XHQvLyBuZWNlc3NhcnkgZm9yIGFwcGxlIHZjYXJkc1xuXHRcdFx0XHRcdHRhZ1ZhbHVlID0gdGFnVmFsdWUucmVwbGFjZSgvW1xcdTIwMDAtXFx1MjA2Rl0vZywgXCJcIilcblxuXHRcdFx0XHRcdGlmICh0YWdBbmRUeXBlU3RyaW5nLmluZGV4T2YoXCJIT01FXCIpID4gLTEpIHtcblx0XHRcdFx0XHRcdF9hZGRQaG9uZU51bWJlcih0YWdWYWx1ZSwgcGhvbmVOdW1iZXJzLCBDb250YWN0UGhvbmVOdW1iZXJUeXBlLlBSSVZBVEUpXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0YWdBbmRUeXBlU3RyaW5nLmluZGV4T2YoXCJXT1JLXCIpID4gLTEpIHtcblx0XHRcdFx0XHRcdF9hZGRQaG9uZU51bWJlcih0YWdWYWx1ZSwgcGhvbmVOdW1iZXJzLCBDb250YWN0UGhvbmVOdW1iZXJUeXBlLldPUkspXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0YWdBbmRUeXBlU3RyaW5nLmluZGV4T2YoXCJGQVhcIikgPiAtMSkge1xuXHRcdFx0XHRcdFx0X2FkZFBob25lTnVtYmVyKHRhZ1ZhbHVlLCBwaG9uZU51bWJlcnMsIENvbnRhY3RQaG9uZU51bWJlclR5cGUuRkFYKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGFnQW5kVHlwZVN0cmluZy5pbmRleE9mKFwiQ0VMTFwiKSA+IC0xKSB7XG5cdFx0XHRcdFx0XHRfYWRkUGhvbmVOdW1iZXIodGFnVmFsdWUsIHBob25lTnVtYmVycywgQ29udGFjdFBob25lTnVtYmVyVHlwZS5NT0JJTEUpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdF9hZGRQaG9uZU51bWJlcih0YWdWYWx1ZSwgcGhvbmVOdW1iZXJzLCBDb250YWN0UGhvbmVOdW1iZXJUeXBlLk9USEVSKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBcIlVSTFwiOlxuXHRcdFx0XHRjYXNlIFwiSVRFTTEuVVJMXCI6IC8vIG5lY2Vzc2FyeSBmb3IgYXBwbGUgdmNhcmRzXG5cdFx0XHRcdGNhc2UgXCJJVEVNMi5VUkxcIjpcblx0XHRcdFx0XHQvLyBuZWNlc3NhcnkgZm9yIGFwcGxlIHZjYXJkc1xuXHRcdFx0XHRcdGFkZFdlYnNpdGUodGFnVmFsdWUsIHdlYnNpdGVzKVxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBcIk5JQ0tOQU1FXCI6IHtcblx0XHRcdFx0XHRsZXQgbmljayA9IHZDYXJkUmVlc2NhcGluZ0FycmF5KHZDYXJkRXNjYXBpbmdTcGxpdCh0YWdWYWx1ZSkpXG5cdFx0XHRcdFx0bmlja25hbWUgPSBuaWNrLmpvaW4oXCIgXCIpXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgXCJQSE9UT1wiOlxuXHRcdFx0XHRcdC8vIGlmIChpbmRleEFmdGVyVGFnIDwgdGFnVmFsdWUuaW5kZXhPZihcIjpcIikpIHtcblx0XHRcdFx0XHQvLyBcdGluZGV4QWZ0ZXJUYWcgPSB0YWdWYWx1ZS5pbmRleE9mKFwiOlwiKVxuXHRcdFx0XHRcdC8vIH1cblx0XHRcdFx0XHQvLyAvKkhlcmUgd2lsbCBiZSB0aGUgcGhvdG8gaW1wb3J0Ki9cblx0XHRcdFx0XHRicmVha1xuXG5cdFx0XHRcdGNhc2UgXCJST0xFXCI6XG5cdFx0XHRcdGNhc2UgXCJUSVRMRVwiOiB7XG5cdFx0XHRcdFx0bGV0IHZjYXJkUm9sZSA9IHZDYXJkUmVlc2NhcGluZ0FycmF5KHZDYXJkRXNjYXBpbmdTcGxpdCh0YWdWYWx1ZSkpXG5cdFx0XHRcdFx0cm9sZSArPSAoXCIgXCIgKyB2Y2FyZFJvbGUuam9pbihcIiBcIikpLnRyaW0oKVxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBUaGUgY29udGVudCBiZWxsb3cgdGhpcyBjb21tZW50IGlzIHByZXNlbnQgb25seSBvbiB2Q2FyZCA0LjArIC0gUkZDIDYzNTBcblx0XHRcdFx0Y2FzZSBcIlJFTEFURURcIjoge1xuXHRcdFx0XHRcdGxldCB0eXBlID0gQ29udGFjdFJlbGF0aW9uc2hpcFR5cGUuT1RIRVJcblx0XHRcdFx0XHRjb25zdCB2Q2FyZFByb3BlcnR5VHlwZSA9IGdldFByb3BlcnR5VmFsdWUoXCJUWVBFXCIsIHRhZ0FuZFR5cGVTdHJpbmcpLnRvTG93ZXJDYXNlKClcblx0XHRcdFx0XHRpZiAodkNhcmRQcm9wZXJ0eVR5cGUgPT09IFwiZnJpZW5kXCIpIHtcblx0XHRcdFx0XHRcdHR5cGUgPSBDb250YWN0UmVsYXRpb25zaGlwVHlwZS5GUklFTkRcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHZDYXJkUHJvcGVydHlUeXBlID09PSBcImNoaWxkXCIpIHtcblx0XHRcdFx0XHRcdHR5cGUgPSBDb250YWN0UmVsYXRpb25zaGlwVHlwZS5DSElMRFxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodkNhcmRQcm9wZXJ0eVR5cGUgPT09IFwicGFyZW50XCIpIHtcblx0XHRcdFx0XHRcdHR5cGUgPSBDb250YWN0UmVsYXRpb25zaGlwVHlwZS5QQVJFTlRcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHZDYXJkUHJvcGVydHlUeXBlID09PSBcInNwb3VzZVwiKSB7XG5cdFx0XHRcdFx0XHR0eXBlID0gQ29udGFjdFJlbGF0aW9uc2hpcFR5cGUuU1BPVVNFXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YWRkUmVsYXRpb25zaGlwKHRhZ1ZhbHVlLCByZWxhdGlvbnNoaXBzLCB0eXBlKVxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlIFwiUFJPTk9VTlNcIjoge1xuXHRcdFx0XHRcdGNvbnN0IGxhbmcgPSBnZXRQcm9wZXJ0eVZhbHVlKFwiTEFOR1wiLCB0YWdBbmRUeXBlU3RyaW5nKVxuXHRcdFx0XHRcdGFkZFByb25vdW5zKHRhZ1ZhbHVlLCBwcm9ub3VucywgbGFuZylcblx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSBcIklNUFBcIjoge1xuXHRcdFx0XHRcdGNvbnN0IGltUmF3VHlwZSA9IGdldFByb3BlcnR5VmFsdWUoXCJUWVBFXCIsIHRhZ0FuZFR5cGVTdHJpbmcpXG5cdFx0XHRcdFx0bGV0IGltVHlwZSA9IENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlLk9USEVSXG5cdFx0XHRcdFx0bGV0IGN1c3RvbVR5cGVOYW1lID0gXCJcIlxuXG5cdFx0XHRcdFx0aWYgKGltUmF3VHlwZS50b0xvd2VyQ2FzZSgpID09PSBcInRlbGVncmFtXCIpIHtcblx0XHRcdFx0XHRcdGltVHlwZSA9IENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlLlRFTEVHUkFNXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChpbVJhd1R5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJ3aGF0c2FwcFwiKSB7XG5cdFx0XHRcdFx0XHRpbVR5cGUgPSBDb250YWN0TWVzc2VuZ2VySGFuZGxlVHlwZS5XSEFUU0FQUFxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoaW1SYXdUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwic2lnbmFsXCIpIHtcblx0XHRcdFx0XHRcdGltVHlwZSA9IENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlLlNJR05BTFxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoaW1SYXdUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwiZGlzY29yZFwiKSB7XG5cdFx0XHRcdFx0XHRpbVR5cGUgPSBDb250YWN0TWVzc2VuZ2VySGFuZGxlVHlwZS5ESVNDT1JEXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChpbVJhd1R5cGUudHJpbSgpICE9IFwiXCIpIHtcblx0XHRcdFx0XHRcdGltVHlwZSA9IENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlLkNVU1RPTVxuXHRcdFx0XHRcdFx0Y3VzdG9tVHlwZU5hbWUgPSBpbVJhd1R5cGUudHJpbSgpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gUmVtb3ZlIHRoZSBpbToveG1wcDogYWRkZWQgYnkgdGhlIHZjYXJkIHN0YW5kYXJkXG5cdFx0XHRcdFx0Y29uc3QgaGFuZGxlRGF0YSA9IHRhZ1ZhbHVlLmluZGV4T2YoXCI6XCIpID4gLTEgPyB0YWdWYWx1ZS5zdWJzdHJpbmcodGFnVmFsdWUuaW5kZXhPZihcIjpcIikgKyAxKSA6IHRhZ1ZhbHVlXG5cdFx0XHRcdFx0YWRkTWVzc2VuZ2VySGFuZGxlKGhhbmRsZURhdGEsIG1lc3NlbmdlckhhbmRsZXMsIGltVHlwZSwgY3VzdG9tVHlwZU5hbWUpXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0fVxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0fVxuXHRcdH1cblx0XHRjb250YWN0c1tpXSA9IGNyZWF0ZUNvbnRhY3Qoe1xuXHRcdFx0X293bmVyR3JvdXA6IG93bmVyR3JvdXBJZCxcblx0XHRcdGxhc3ROYW1lLFxuXHRcdFx0Zmlyc3ROYW1lLFxuXHRcdFx0dGl0bGUsXG5cdFx0XHRiaXJ0aGRheUlzbyxcblx0XHRcdGNvbXBhbnksXG5cdFx0XHRjb21tZW50LFxuXHRcdFx0bmlja25hbWUsXG5cdFx0XHRyb2xlLFxuXHRcdFx0YWRkcmVzc2VzLFxuXHRcdFx0bWFpbEFkZHJlc3Nlcyxcblx0XHRcdHBob25lTnVtYmVycyxcblx0XHRcdGRlcGFydG1lbnQsXG5cdFx0XHRtaWRkbGVOYW1lLFxuXHRcdFx0d2Vic2l0ZXMsXG5cdFx0XHRyZWxhdGlvbnNoaXBzLFxuXHRcdFx0cHJvbm91bnMsXG5cdFx0XHRtZXNzZW5nZXJIYW5kbGVzLFxuXHRcdFx0bmFtZVN1ZmZpeDogc3VmZml4LFxuXHRcdFx0cGhvbmV0aWNGaXJzdDogbnVsbCxcblx0XHRcdHBob25ldGljTGFzdDogbnVsbCxcblx0XHRcdHBob25ldGljTWlkZGxlOiBudWxsLFxuXHRcdFx0Y3VzdG9tRGF0ZTogW10sXG5cdFx0XHRzb2NpYWxJZHM6IFtdLFxuXHRcdFx0cHJlc2hhcmVkUGFzc3dvcmQ6IG51bGwsXG5cdFx0XHRwaG90bzogbnVsbCxcblx0XHRcdG9sZEJpcnRoZGF5RGF0ZTogbnVsbCxcblx0XHRcdG9sZEJpcnRoZGF5QWdncmVnYXRlOiBudWxsLFxuXHRcdH0pXG5cdH1cblxuXHRmdW5jdGlvbiBfYWRkQWRkcmVzcyh2Q2FyZEFkZHJlc3NWYWx1ZTogc3RyaW5nLCBhZGRyZXNzZXM6IEFycmF5PENvbnRhY3RBZGRyZXNzPiwgdHlwZTogQ29udGFjdEFkZHJlc3NUeXBlKSB7XG5cdFx0bGV0IGFkZHJlc3NEZXRhaWxzID0gdkNhcmRSZWVzY2FwaW5nQXJyYXkodkNhcmRFc2NhcGluZ1NwbGl0QWRyKHZDYXJkQWRkcmVzc1ZhbHVlKSlcblx0XHRsZXQgYWRkcmVzcyA9IGNyZWF0ZUNvbnRhY3RBZGRyZXNzKHtcblx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRhZGRyZXNzOiBhZGRyZXNzRGV0YWlscy5qb2luKFwiXCIpLnRyaW0oKSxcblx0XHRcdGN1c3RvbVR5cGVOYW1lOiBcIlwiLFxuXHRcdH0pXG5cdFx0YWRkcmVzc2VzLnB1c2goYWRkcmVzcylcblx0fVxuXG5cdGZ1bmN0aW9uIF9hZGRQaG9uZU51bWJlcih2Q2FyZFBob25lTnVtYmVyVmFsdWU6IHN0cmluZywgcGhvbmVOdW1iZXJzOiBBcnJheTxDb250YWN0UGhvbmVOdW1iZXI+LCB0eXBlOiBDb250YWN0UGhvbmVOdW1iZXJUeXBlKSB7XG5cdFx0bGV0IHBob25lTnVtYmVyID0gY3JlYXRlQ29udGFjdFBob25lTnVtYmVyKHtcblx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRudW1iZXI6IHZDYXJkUGhvbmVOdW1iZXJWYWx1ZSxcblx0XHRcdGN1c3RvbVR5cGVOYW1lOiBcIlwiLFxuXHRcdH0pXG5cdFx0cGhvbmVOdW1iZXJzLnB1c2gocGhvbmVOdW1iZXIpXG5cdH1cblxuXHRmdW5jdGlvbiBfYWRkTWFpbEFkZHJlc3ModkNhcmRNYWlsQWRkcmVzc1ZhbHVlOiBzdHJpbmcsIG1haWxBZGRyZXNzZXM6IEFycmF5PENvbnRhY3RNYWlsQWRkcmVzcz4sIHR5cGU6IENvbnRhY3RBZGRyZXNzVHlwZSkge1xuXHRcdGxldCBlbWFpbCA9IGNyZWF0ZUNvbnRhY3RNYWlsQWRkcmVzcyh7XG5cdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0YWRkcmVzczogdkNhcmRNYWlsQWRkcmVzc1ZhbHVlLFxuXHRcdFx0Y3VzdG9tVHlwZU5hbWU6IFwiXCIsXG5cdFx0fSlcblx0XHRtYWlsQWRkcmVzc2VzLnB1c2goZW1haWwpXG5cdH1cblxuXHRmdW5jdGlvbiBhZGRSZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwUGVyc29uOiBzdHJpbmcsIHJlbGF0aW9uc2hpcHM6IEFycmF5PENvbnRhY3RSZWxhdGlvbnNoaXA+LCB0eXBlOiBDb250YWN0UmVsYXRpb25zaGlwVHlwZSkge1xuXHRcdGNvbnN0IHJlbGF0aW9uc2hpcCA9IGNyZWF0ZUNvbnRhY3RSZWxhdGlvbnNoaXAoe1xuXHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdHBlcnNvbjogcmVsYXRpb25zaGlwUGVyc29uLFxuXHRcdFx0Y3VzdG9tVHlwZU5hbWU6IFwiXCIsXG5cdFx0fSlcblx0XHRyZWxhdGlvbnNoaXBzLnB1c2gocmVsYXRpb25zaGlwKVxuXHR9XG5cblx0ZnVuY3Rpb24gYWRkUHJvbm91bnMocHJvbm91bnM6IHN0cmluZywgcHJvbm91bnNBcnJheTogQXJyYXk8Q29udGFjdFByb25vdW5zPiwgbGFuZzogc3RyaW5nKSB7XG5cdFx0Y29uc3QgcHJvbm91bnNUb0FkZCA9IGNyZWF0ZUNvbnRhY3RQcm9ub3Vucyh7XG5cdFx0XHRsYW5ndWFnZTogbGFuZyxcblx0XHRcdHByb25vdW5zLFxuXHRcdH0pXG5cdFx0cHJvbm91bnNBcnJheS5wdXNoKHByb25vdW5zVG9BZGQpXG5cdH1cblxuXHRmdW5jdGlvbiBhZGRNZXNzZW5nZXJIYW5kbGUoaGFuZGxlOiBzdHJpbmcsIG1lc3NlbmdlckhhbmRsZUFycmF5OiBBcnJheTxDb250YWN0TWVzc2VuZ2VySGFuZGxlPiwgdHlwZTogQ29udGFjdE1lc3NlbmdlckhhbmRsZVR5cGUsIGN1c3RvbVR5cGVOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBuZXdIYW5kbGUgPSBjcmVhdGVDb250YWN0TWVzc2VuZ2VySGFuZGxlKHtcblx0XHRcdGhhbmRsZSxcblx0XHRcdHR5cGUsXG5cdFx0XHRjdXN0b21UeXBlTmFtZSxcblx0XHR9KVxuXHRcdG1lc3NlbmdlckhhbmRsZUFycmF5LnB1c2gobmV3SGFuZGxlKVxuXHR9XG5cblx0ZnVuY3Rpb24gYWRkV2Vic2l0ZSh0YWdWYWx1ZTogc3RyaW5nLCB3ZWJzaXRlczogQXJyYXk8Q29udGFjdFdlYnNpdGU+KSB7XG5cdFx0bGV0IHdlYnNpdGUgPSBjcmVhdGVDb250YWN0V2Vic2l0ZSh7XG5cdFx0XHR0eXBlOiBDb250YWN0V2Vic2l0ZVR5cGUuT1RIRVIsXG5cdFx0XHR1cmw6IHZDYXJkUmVlc2NhcGluZ0FycmF5KHZDYXJkRXNjYXBpbmdTcGxpdCh0YWdWYWx1ZSkpLmpvaW4oXCJcIiksXG5cdFx0XHRjdXN0b21UeXBlTmFtZTogXCJcIixcblx0XHR9KVxuXHRcdHdlYnNpdGVzLnB1c2god2Vic2l0ZSlcblx0fVxuXG5cdHJldHVybiBjb250YWN0c1xufVxuIiwiaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgQ29udGFjdEJvb2sgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0NvbnRhY3RCb29rLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQ2hlY2tib3ggfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NoZWNrYm94LmpzXCJcbmltcG9ydCB7IGRlZmVyIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcblxuLyoqXG4gKiBEaXNwbGF5cyBhIGxpc3Qgb2YgY29udGFjdCBib29rcyB0byBpbXBvcnQgY29udGFjdHMgZnJvbS5cbiAqL1xuZXhwb3J0IGNsYXNzIEltcG9ydE5hdGl2ZUNvbnRhY3RCb29rc0RpYWxvZyB7XG5cdHByaXZhdGUgcmVhZG9ubHkgc2VsZWN0ZWRDb250YWN0Qm9va3M6IFNldDxzdHJpbmc+XG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjb250YWN0Qm9va3M6IFJlYWRvbmx5QXJyYXk8Q29udGFjdEJvb2s+KSB7XG5cdFx0dGhpcy5zZWxlY3RlZENvbnRhY3RCb29rcyA9IG5ldyBTZXQodGhpcy5jb250YWN0Qm9va3MubWFwKChib29rKSA9PiBib29rLmlkKSlcblx0fVxuXG5cdHNob3coKTogUHJvbWlzZTxDb250YWN0Qm9va1tdIHwgbnVsbD4ge1xuXHRcdGNvbnN0IGRlZmVycmVkID0gZGVmZXI8Q29udGFjdEJvb2tbXSB8IG51bGw+KClcblx0XHRjb25zdCBkaWFsb2cgPSBEaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0XHR0aXRsZTogXCJpbXBvcnRDb250YWN0c19sYWJlbFwiLFxuXHRcdFx0dHlwZTogRGlhbG9nVHlwZS5FZGl0TWVkaXVtLFxuXHRcdFx0YWxsb3dDYW5jZWw6IHRydWUsXG5cdFx0XHRjaGlsZDogKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XHRcIi5zY3JvbGxcIixcblx0XHRcdFx0XHR0aGlzLmNvbnRhY3RCb29rcy5tYXAoKGJvb2spID0+IHRoaXMucmVuZGVyUm93KGJvb2spKSxcblx0XHRcdFx0KVxuXHRcdFx0fSxcblx0XHRcdG9rQWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUodGhpcy5jb250YWN0Qm9va3MuZmlsdGVyKChib29rKSA9PiB0aGlzLnNlbGVjdGVkQ29udGFjdEJvb2tzLmhhcyhib29rLmlkKSkpXG5cdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHR9LFxuXHRcdFx0Y2FuY2VsQWN0aW9uOiAoKSA9PiBkZWZlcnJlZC5yZXNvbHZlKG51bGwpLFxuXHRcdH0pXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2Vcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyUm93KGJvb2s6IENvbnRhY3RCb29rKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGNoZWNrZWQgPSB0aGlzLnNlbGVjdGVkQ29udGFjdEJvb2tzLmhhcyhib29rLmlkKVxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmxleC5pdGVtcy1jZW50ZXJcIixcblx0XHRcdG0oQ2hlY2tib3gsIHtcblx0XHRcdFx0Y2hlY2tlZCxcblx0XHRcdFx0bGFiZWw6ICgpID0+IGJvb2submFtZSA/PyBsYW5nLmdldChcInB1c2hJZGVudGlmaWVyQ3VycmVudERldmljZV9sYWJlbFwiKSxcblx0XHRcdFx0b25DaGVja2VkOiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGNoZWNrZWQpIHtcblx0XHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRDb250YWN0Qm9va3MuZGVsZXRlKGJvb2suaWQpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRDb250YWN0Qm9va3MuYWRkKGJvb2suaWQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgeyBEaWFsb2csIERpYWxvZ1R5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBnZXRGaXJzdE9yVGhyb3csIG9mQ2xhc3MsIHByb21pc2VNYXAgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgdkNhcmRGaWxlVG9WQ2FyZHMsIHZDYXJkTGlzdFRvQ29udGFjdHMgfSBmcm9tIFwiLi9WQ2FyZEltcG9ydGVyLmpzXCJcbmltcG9ydCB7IEltcG9ydEVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0ltcG9ydEVycm9yLmpzXCJcbmltcG9ydCB7IGxhbmcsIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBDb250YWN0RmFjYWRlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Db250YWN0RmFjYWRlLmpzXCJcbmltcG9ydCB7XG5cdENvbnRhY3QsXG5cdGNyZWF0ZUNvbnRhY3QsXG5cdGNyZWF0ZUNvbnRhY3RBZGRyZXNzLFxuXHRjcmVhdGVDb250YWN0Q3VzdG9tRGF0ZSxcblx0Y3JlYXRlQ29udGFjdE1haWxBZGRyZXNzLFxuXHRjcmVhdGVDb250YWN0TWVzc2VuZ2VySGFuZGxlLFxuXHRjcmVhdGVDb250YWN0UGhvbmVOdW1iZXIsXG5cdGNyZWF0ZUNvbnRhY3RSZWxhdGlvbnNoaXAsXG5cdGNyZWF0ZUNvbnRhY3RXZWJzaXRlLFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBMaXN0LCBMaXN0QXR0cnMsIExpc3RMb2FkaW5nU3RhdGUsIE11bHRpc2VsZWN0TW9kZSwgUmVuZGVyQ29uZmlnIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0LmpzXCJcbmltcG9ydCB7IHNpemUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yLmpzXCJcbmltcG9ydCB7IERpYWxvZ0hlYWRlckJhciwgRGlhbG9nSGVhZGVyQmFyQXR0cnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZ0hlYWRlckJhci5qc1wiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgSW1wb3J0TmF0aXZlQ29udGFjdEJvb2tzRGlhbG9nIH0gZnJvbSBcIi4vdmlldy9JbXBvcnROYXRpdmVDb250YWN0Qm9va3NEaWFsb2cuanNcIlxuaW1wb3J0IHsgU3RydWN0dXJlZENvbnRhY3QgfSBmcm9tIFwiLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1N0cnVjdHVyZWRDb250YWN0LmpzXCJcbmltcG9ydCB7IGlzb0RhdGVUb0JpcnRoZGF5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0JpcnRoZGF5VXRpbHMuanNcIlxuaW1wb3J0IHsgQ29udGFjdEJvb2sgfSBmcm9tIFwiLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0NvbnRhY3RCb29rLmpzXCJcbmltcG9ydCB7IFBlcm1pc3Npb25UeXBlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9QZXJtaXNzaW9uVHlwZS5qc1wiXG5pbXBvcnQgeyBTeXN0ZW1QZXJtaXNzaW9uSGFuZGxlciB9IGZyb20gXCIuLi8uLi9jb21tb24vbmF0aXZlL21haW4vU3lzdGVtUGVybWlzc2lvbkhhbmRsZXIuanNcIlxuaW1wb3J0IHsgS2luZGFDb250YWN0Um93IH0gZnJvbSBcIi4vdmlldy9Db250YWN0TGlzdFZpZXcuanNcIlxuaW1wb3J0IHsgU2VsZWN0QWxsQ2hlY2tib3ggfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9TZWxlY3RBbGxDaGVja2JveC5qc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi9tYWlsTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBGaWxlUmVmZXJlbmNlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0ZpbGVVdGlscy5qc1wiXG5pbXBvcnQgeyBBdHRhY2htZW50VHlwZSwgZ2V0QXR0YWNobWVudFR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9BdHRhY2htZW50QnViYmxlLmpzXCJcbmltcG9ydCB7IE5hdGl2ZUZpbGVBcHAgfSBmcm9tIFwiLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vRmlsZUFwcC5qc1wiXG5pbXBvcnQgeyBNb2JpbGVDb250YWN0c0ZhY2FkZSB9IGZyb20gXCIuLi8uLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlQ29udGFjdHNGYWNhZGUuanNcIlxuaW1wb3J0IHsgTmF0aXZlQ29udGFjdHNTeW5jTWFuYWdlciB9IGZyb20gXCIuL21vZGVsL05hdGl2ZUNvbnRhY3RzU3luY01hbmFnZXJcIlxuaW1wb3J0IHsgaXNJT1NBcHAgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcblxuZXhwb3J0IGNsYXNzIENvbnRhY3RJbXBvcnRlciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29udGFjdEZhY2FkZTogQ29udGFjdEZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHN5c3RlbVBlcm1pc3Npb25IYW5kbGVyOiBTeXN0ZW1QZXJtaXNzaW9uSGFuZGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IG1vYmlsZUNvbnRhY3RzRmFjYWRlOiBNb2JpbGVDb250YWN0c0ZhY2FkZSB8IG51bGwsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBuYXRpdmVDb250YWN0U3luY01hbmFnZXI6IE5hdGl2ZUNvbnRhY3RzU3luY01hbmFnZXIgfCBudWxsLFxuXHQpIHt9XG5cblx0YXN5bmMgaW1wb3J0Q29udGFjdHNGcm9tRmlsZSh2Q2FyZERhdGE6IHN0cmluZyB8IHN0cmluZ1tdLCBjb250YWN0TGlzdElkOiBzdHJpbmcpIHtcblx0XHRjb25zdCB2Q2FyZExpc3QgPSBBcnJheS5pc0FycmF5KHZDYXJkRGF0YSkgPyBDb250YWN0SW1wb3J0ZXIuY29tYmluZVZDYXJkRGF0YSh2Q2FyZERhdGEpIDogdkNhcmRGaWxlVG9WQ2FyZHModkNhcmREYXRhKVxuXG5cdFx0aWYgKHZDYXJkTGlzdCA9PSBudWxsKSB0aHJvdyBuZXcgVXNlckVycm9yKFwiaW1wb3J0VkNhcmRFcnJvcl9tc2dcIilcblxuXHRcdGNvbnN0IGNvbnRhY3RNZW1iZXJzaGlwID0gZ2V0Rmlyc3RPclRocm93KGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuZ2V0Q29udGFjdEdyb3VwTWVtYmVyc2hpcHMoKSlcblx0XHRjb25zdCBjb250YWN0cyA9IHZDYXJkTGlzdFRvQ29udGFjdHModkNhcmRMaXN0LCBjb250YWN0TWVtYmVyc2hpcC5ncm91cClcblxuXHRcdHJldHVybiBzaG93Q29udGFjdEltcG9ydERpYWxvZyhcblx0XHRcdGNvbnRhY3RzLFxuXHRcdFx0KGRpYWxvZywgc2VsZWN0ZWRDb250YWN0cykgPT4ge1xuXHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHR0aGlzLmltcG9ydENvbnRhY3RzKHNlbGVjdGVkQ29udGFjdHMsIGNvbnRhY3RMaXN0SWQpXG5cdFx0XHR9LFxuXHRcdFx0XCJpbXBvcnRWQ2FyZF9hY3Rpb25cIixcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBjb21iaW5lVkNhcmREYXRhKHZDYXJkRGF0YTogc3RyaW5nW10pOiBzdHJpbmdbXSB8IG51bGwge1xuXHRcdGNvbnN0IGNvbWJpbmVkVkNhcmREYXRhID0gdkNhcmREYXRhLmZsYXRNYXAoKGl0ZW1EYXRhKSA9PiB2Q2FyZEZpbGVUb1ZDYXJkcyhpdGVtRGF0YSkpXG5cdFx0cmV0dXJuIGNvbWJpbmVkVkNhcmREYXRhLmZpbHRlcigodkNhcmQpID0+IHZDYXJkICE9IG51bGwpIGFzIHN0cmluZ1tdXG5cdH1cblxuXHRhc3luYyBpbXBvcnRDb250YWN0cyhjb250YWN0czogUmVhZG9ubHlBcnJheTxDb250YWN0PiwgY29udGFjdExpc3RJZDogc3RyaW5nKSB7XG5cdFx0Y29uc3QgaW1wb3J0UHJvbWlzZSA9IHRoaXMuY29udGFjdEZhY2FkZVxuXHRcdFx0LmltcG9ydENvbnRhY3RMaXN0KGNvbnRhY3RzLCBjb250YWN0TGlzdElkKVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKEltcG9ydEVycm9yLCAoZSkgPT5cblx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShcblx0XHRcdFx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcdFx0XHRcImNvbmZpcm1fbXNnXCIsXG5cdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwiaW1wb3J0Q29udGFjdHNFcnJvcl9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFwie2Ftb3VudH1cIjogZS5udW1GYWlsZWQgKyBcIlwiLFxuXHRcdFx0XHRcdFx0XHRcdFwie3RvdGFsfVwiOiBjb250YWN0cy5sZW5ndGggKyBcIlwiLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaCgoKSA9PiBEaWFsb2cubWVzc2FnZShcInVua25vd25FcnJvcl9tc2dcIikpXG5cdFx0YXdhaXQgc2hvd1Byb2dyZXNzRGlhbG9nKFwicGxlYXNlV2FpdF9tc2dcIiwgaW1wb3J0UHJvbWlzZSlcblx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShcblx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcImNvbmZpcm1fbXNnXCIsXG5cdFx0XHRcdGxhbmcuZ2V0KFwiaW1wb3J0VkNhcmRTdWNjZXNzX21zZ1wiLCB7XG5cdFx0XHRcdFx0XCJ7MX1cIjogY29udGFjdHMubGVuZ3RoLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0KVxuXHR9XG5cblx0Ly8gd2lsbCBjaGVjayBmb3IgcGVybWlzc2lvbiBhbmQgYXNrIGZvciBpdCBpZiBpdCBpcyBub3QgZ3JhbnRlZFxuXHRhc3luYyBpbXBvcnRDb250YWN0c0Zyb21EZXZpY2VTYWZlbHkoKSB7XG5cdFx0Ly8gY2hlY2sgZm9yIHBlcm1pc3Npb25cblx0XHRjb25zdCBpc0NvbnRhY3RQZXJtaXNzaW9uR3JhbnRlZCA9IGF3YWl0IHRoaXMuc3lzdGVtUGVybWlzc2lvbkhhbmRsZXIucmVxdWVzdFBlcm1pc3Npb24oUGVybWlzc2lvblR5cGUuQ29udGFjdHMsIFwiZ3JhbnRDb250YWN0UGVybWlzc2lvbkFjdGlvblwiKVxuXG5cdFx0aWYgKGlzQ29udGFjdFBlcm1pc3Npb25HcmFudGVkKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmltcG9ydENvbnRhY3RzRnJvbURldmljZSgpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbXBvcnRDb250YWN0c0Zyb21EZXZpY2UoKSB7XG5cdFx0Ly8gdGhlc2Ugd2lsbCBvbmx5IGV2ZXIgYmUgbnVsbCBpZiAhaXNBcHAoKVxuXHRcdGNvbnN0IG1vYmlsZUNvbnRhY3RzRmFjYWRlID0gYXNzZXJ0Tm90TnVsbCh0aGlzLm1vYmlsZUNvbnRhY3RzRmFjYWRlKVxuXG5cdFx0Y29uc3QgYm9va3MgPSBhd2FpdCB0aGlzLnNlbGVjdENvbnRhY3RCb29rcyhtb2JpbGVDb250YWN0c0ZhY2FkZSlcblx0XHRpZiAoYm9va3MgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgY29udGFjdExpc3RJZCA9IGF3YWl0IGxvY2F0b3IuY29udGFjdE1vZGVsLmdldENvbnRhY3RMaXN0SWQoKVxuXHRcdGNvbnN0IGNvbnRhY3RHcm91cElkID0gYXdhaXQgbG9jYXRvci5jb250YWN0TW9kZWwuZ2V0Q29udGFjdEdyb3VwSWQoKVxuXG5cdFx0Y29uc3QgYWxsSW1wb3J0YWJsZVN0cnVjdHVyZWRDb250YWN0czogU3RydWN0dXJlZENvbnRhY3RbXSA9IChcblx0XHRcdGF3YWl0IHByb21pc2VNYXAoXG5cdFx0XHRcdGJvb2tzLFxuXHRcdFx0XHRhc3luYyAoYm9vaykgPT4gYXdhaXQgbW9iaWxlQ29udGFjdHNGYWNhZGUuZ2V0Q29udGFjdHNJbkNvbnRhY3RCb29rKGJvb2suaWQsIGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkubG9naW5Vc2VybmFtZSksXG5cdFx0XHQpXG5cdFx0KS5mbGF0KClcblx0XHRjb25zdCBhbGxJbXBvcnRhYmxlQ29udGFjdHMgPSBuZXcgTWFwKFxuXHRcdFx0YWxsSW1wb3J0YWJsZVN0cnVjdHVyZWRDb250YWN0cy5tYXAoKHN0cnVjdHVyZWRDb250YWN0KSA9PiBbXG5cdFx0XHRcdHRoaXMuY29udGFjdEZyb21TdHJ1Y3R1cmVkQ29udGFjdChjb250YWN0R3JvdXBJZCwgc3RydWN0dXJlZENvbnRhY3QpLFxuXHRcdFx0XHRzdHJ1Y3R1cmVkQ29udGFjdCxcblx0XHRcdF0pLFxuXHRcdClcblxuXHRcdHNob3dDb250YWN0SW1wb3J0RGlhbG9nKFxuXHRcdFx0Wy4uLmFsbEltcG9ydGFibGVDb250YWN0cy5rZXlzKCldLFxuXHRcdFx0YXN5bmMgKGRpYWxvZywgc2VsZWN0ZWRDb250YWN0cykgPT4ge1xuXHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRhd2FpdCB0aGlzLm9uQ29udGFjdEltcG9ydENvbmZpcm1lZChjb250YWN0TGlzdElkLCBzZWxlY3RlZENvbnRhY3RzLCBhbGxJbXBvcnRhYmxlQ29udGFjdHMpXG5cdFx0XHR9LFxuXHRcdFx0XCJpbXBvcnRDb250YWN0c19sYWJlbFwiLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgb25Db250YWN0SW1wb3J0Q29uZmlybWVkKGNvbnRhY3RMaXN0SWQ6IHN0cmluZyB8IG51bGwsIHNlbGVjdGVkQ29udGFjdHM6IENvbnRhY3RbXSwgYWxsSW1wb3J0YWJsZUNvbnRhY3RzOiBNYXA8Q29udGFjdCwgU3RydWN0dXJlZENvbnRhY3Q+KSB7XG5cdFx0Y29uc3QgaW1wb3J0ZXIgPSBhd2FpdCBtYWlsTG9jYXRvci5jb250YWN0SW1wb3J0ZXIoKVxuXHRcdGNvbnN0IG1vYmlsZUNvbnRhY3RzRmFjYWRlID0gYXNzZXJ0Tm90TnVsbCh0aGlzLm1vYmlsZUNvbnRhY3RzRmFjYWRlKVxuXHRcdGNvbnN0IG5hdGl2ZUNvbnRhY3RTeW5jTWFuYWdlciA9IGFzc2VydE5vdE51bGwodGhpcy5uYXRpdmVDb250YWN0U3luY01hbmFnZXIpXG5cblx0XHRjb25zdCBzZWxlY3RlZFN0cnVjdHVyZWRDb250YWN0czogU3RydWN0dXJlZENvbnRhY3RbXSA9IHNlbGVjdGVkQ29udGFjdHMubWFwKChzZWxlY3RlZENvbnRhY3QpID0+XG5cdFx0XHRhc3NlcnROb3ROdWxsKGFsbEltcG9ydGFibGVDb250YWN0cy5nZXQoc2VsZWN0ZWRDb250YWN0KSksXG5cdFx0KVxuXG5cdFx0YXdhaXQgaW1wb3J0ZXIuaW1wb3J0Q29udGFjdHMoc2VsZWN0ZWRDb250YWN0cywgYXNzZXJ0Tm90TnVsbChjb250YWN0TGlzdElkKSlcblx0XHRjb25zdCBpbXBvcnRlZCA9IG5hdGl2ZUNvbnRhY3RTeW5jTWFuYWdlci5pc0VuYWJsZWQoKSAmJiAoYXdhaXQgbmF0aXZlQ29udGFjdFN5bmNNYW5hZ2VyLnN5bmNDb250YWN0cygpKVxuXG5cdFx0Ly8gT24gaU9TLCB3ZSB3YW50IHRvIGdpdmUgdGhlIG9wdGlvbiB0byByZW1vdmUgdGhlIGNvbnRhY3RzIGxvY2FsbHksIGJ1dCB3ZSBvYnZpb3VzbHkgb25seSB3YW50IHRvIGRvXG5cdFx0Ly8gdGhpcyBpZiBzeW5jaW5nIGlzIHN1Y2Nlc3NmdWwsIGFzc3VtaW5nIHN5bmNpbmcgaXMgZW5hYmxlZC5cblx0XHQvL1xuXHRcdC8vIERvIG5vdGhpbmcgZnVydGhlciBpZiBub3Qgb24gaU9TLCBvciBpZiBzeW5jaW5nIGlzIGRpc2FibGVkIG9yIGZhaWxlZC5cblx0XHRpZiAoaW1wb3J0ZWQgJiYgaXNJT1NBcHAoKSkge1xuXHRcdFx0Y29uc3QgY29udGFjdHNXZUp1c3RJbXBvcnRlZCA9IHNlbGVjdGVkU3RydWN0dXJlZENvbnRhY3RzLm1hcCgoY29udGFjdCkgPT4gYXNzZXJ0Tm90TnVsbChjb250YWN0LnJhd0lkKSlcblx0XHRcdGNvbnN0IHJlbW92ZSA9IGF3YWl0IERpYWxvZy5jb25maXJtKFwiaW1wb3J0Q29udGFjdFJlbW92ZUltcG9ydGVkQ29udGFjdHNDb25maXJtX21zZ1wiKVxuXHRcdFx0aWYgKHJlbW92ZSkge1xuXHRcdFx0XHRhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwcm9ncmVzc0RlbGV0aW5nX21zZ1wiLCBtb2JpbGVDb250YWN0c0ZhY2FkZS5kZWxldGVMb2NhbENvbnRhY3RzKGNvbnRhY3RzV2VKdXN0SW1wb3J0ZWQpKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VsZWN0Q29udGFjdEJvb2tzKG1vYmlsZUNvbnRhY3RzRmFjYWRlOiBNb2JpbGVDb250YWN0c0ZhY2FkZSk6IFByb21pc2U8cmVhZG9ubHkgQ29udGFjdEJvb2tbXSB8IG51bGw+IHtcblx0XHRjb25zdCBjb250YWN0Qm9va3MgPSBhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwbGVhc2VXYWl0X21zZ1wiLCBtb2JpbGVDb250YWN0c0ZhY2FkZS5nZXRDb250YWN0Qm9va3MoKSlcblx0XHRpZiAoY29udGFjdEJvb2tzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9IGVsc2UgaWYgKGNvbnRhY3RCb29rcy5sZW5ndGggPT09IDEpIHtcblx0XHRcdHJldHVybiBjb250YWN0Qm9va3Ncblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgaW1wb3J0RGlhbG9nID0gbmV3IEltcG9ydE5hdGl2ZUNvbnRhY3RCb29rc0RpYWxvZyhjb250YWN0Qm9va3MpXG5cdFx0XHRjb25zdCBzZWxlY3RlZEJvb2tzID0gYXdhaXQgaW1wb3J0RGlhbG9nLnNob3coKVxuXHRcdFx0aWYgKHNlbGVjdGVkQm9va3MgPT0gbnVsbCB8fCBzZWxlY3RlZEJvb2tzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGxcblx0XHRcdHJldHVybiBzZWxlY3RlZEJvb2tzXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjb250YWN0RnJvbVN0cnVjdHVyZWRDb250YWN0KG93bmVyR3JvdXBJZDogSWQsIGNvbnRhY3Q6IFN0cnVjdHVyZWRDb250YWN0KTogQ29udGFjdCB7XG5cdFx0cmV0dXJuIGNyZWF0ZUNvbnRhY3Qoe1xuXHRcdFx0X293bmVyR3JvdXA6IG93bmVyR3JvdXBJZCxcblx0XHRcdG5pY2tuYW1lOiBjb250YWN0Lm5pY2tuYW1lLFxuXHRcdFx0Zmlyc3ROYW1lOiBjb250YWN0LmZpcnN0TmFtZSxcblx0XHRcdGxhc3ROYW1lOiBjb250YWN0Lmxhc3ROYW1lLFxuXHRcdFx0Y29tcGFueTogY29udGFjdC5jb21wYW55LFxuXHRcdFx0YWRkcmVzc2VzOiBjb250YWN0LmFkZHJlc3Nlcy5tYXAoKGFkZHJlc3MpID0+XG5cdFx0XHRcdGNyZWF0ZUNvbnRhY3RBZGRyZXNzKHtcblx0XHRcdFx0XHR0eXBlOiBhZGRyZXNzLnR5cGUsXG5cdFx0XHRcdFx0YWRkcmVzczogYWRkcmVzcy5hZGRyZXNzLFxuXHRcdFx0XHRcdGN1c3RvbVR5cGVOYW1lOiBhZGRyZXNzLmN1c3RvbVR5cGVOYW1lLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtYWlsQWRkcmVzc2VzOiBjb250YWN0Lm1haWxBZGRyZXNzZXMubWFwKChhZGRyZXNzKSA9PlxuXHRcdFx0XHRjcmVhdGVDb250YWN0TWFpbEFkZHJlc3Moe1xuXHRcdFx0XHRcdHR5cGU6IGFkZHJlc3MudHlwZSxcblx0XHRcdFx0XHRhZGRyZXNzOiBhZGRyZXNzLmFkZHJlc3MsXG5cdFx0XHRcdFx0Y3VzdG9tVHlwZU5hbWU6IGFkZHJlc3MuY3VzdG9tVHlwZU5hbWUsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRcdHBob25lTnVtYmVyczogY29udGFjdC5waG9uZU51bWJlcnMubWFwKChudW1iZXIpID0+XG5cdFx0XHRcdGNyZWF0ZUNvbnRhY3RQaG9uZU51bWJlcih7XG5cdFx0XHRcdFx0dHlwZTogbnVtYmVyLnR5cGUsXG5cdFx0XHRcdFx0bnVtYmVyOiBudW1iZXIubnVtYmVyLFxuXHRcdFx0XHRcdGN1c3RvbVR5cGVOYW1lOiBudW1iZXIuY3VzdG9tVHlwZU5hbWUsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRcdG9sZEJpcnRoZGF5QWdncmVnYXRlOiBudWxsLFxuXHRcdFx0b2xkQmlydGhkYXlEYXRlOiBudWxsLFxuXHRcdFx0cGhvdG86IG51bGwsXG5cdFx0XHRwcmVzaGFyZWRQYXNzd29yZDogbnVsbCxcblx0XHRcdHNvY2lhbElkczogW10sXG5cdFx0XHRiaXJ0aGRheUlzbzogdGhpcy52YWxpZGF0ZUJpcnRoZGF5T2ZDb250YWN0KGNvbnRhY3QpLFxuXHRcdFx0cHJvbm91bnM6IFtdLFxuXHRcdFx0Y3VzdG9tRGF0ZTogY29udGFjdC5jdXN0b21EYXRlLm1hcCgoZGF0ZSkgPT4gY3JlYXRlQ29udGFjdEN1c3RvbURhdGUoZGF0ZSkpLFxuXHRcdFx0ZGVwYXJ0bWVudDogY29udGFjdC5kZXBhcnRtZW50LFxuXHRcdFx0bWVzc2VuZ2VySGFuZGxlczogY29udGFjdC5tZXNzZW5nZXJIYW5kbGVzLm1hcCgoaGFuZGxlKSA9PiBjcmVhdGVDb250YWN0TWVzc2VuZ2VySGFuZGxlKGhhbmRsZSkpLFxuXHRcdFx0bWlkZGxlTmFtZTogY29udGFjdC5taWRkbGVOYW1lLFxuXHRcdFx0bmFtZVN1ZmZpeDogY29udGFjdC5uYW1lU3VmZml4LFxuXHRcdFx0cGhvbmV0aWNGaXJzdDogY29udGFjdC5waG9uZXRpY0ZpcnN0LFxuXHRcdFx0cGhvbmV0aWNMYXN0OiBjb250YWN0LnBob25ldGljTGFzdCxcblx0XHRcdHBob25ldGljTWlkZGxlOiBjb250YWN0LnBob25ldGljTWlkZGxlLFxuXHRcdFx0cmVsYXRpb25zaGlwczogY29udGFjdC5yZWxhdGlvbnNoaXBzLm1hcCgocmVsYXRpb24pID0+IGNyZWF0ZUNvbnRhY3RSZWxhdGlvbnNoaXAocmVsYXRpb24pKSxcblx0XHRcdHdlYnNpdGVzOiBjb250YWN0LndlYnNpdGVzLm1hcCgod2Vic2l0ZSkgPT4gY3JlYXRlQ29udGFjdFdlYnNpdGUod2Vic2l0ZSkpLFxuXHRcdFx0Y29tbWVudDogY29udGFjdC5ub3Rlcyxcblx0XHRcdHRpdGxlOiBjb250YWN0LnRpdGxlID8/IFwiXCIsXG5cdFx0XHRyb2xlOiBjb250YWN0LnJvbGUsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgdmFsaWRhdGVCaXJ0aGRheU9mQ29udGFjdChjb250YWN0OiBTdHJ1Y3R1cmVkQ29udGFjdCkge1xuXHRcdGlmIChjb250YWN0LmJpcnRoZGF5ICE9IG51bGwpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlzb0RhdGVUb0JpcnRoZGF5KGNvbnRhY3QuYmlydGhkYXkpXG5cdFx0XHRcdHJldHVybiBjb250YWN0LmJpcnRoZGF5XG5cdFx0XHR9IGNhdGNoIChfKSB7XG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogU2hvdyBhIGRpYWxvZyB3aXRoIGEgcHJldmlldyBvZiBhIGdpdmVuIGxpc3Qgb2YgY29udGFjdHNcbiAqIEBwYXJhbSBjb250YWN0cyBUaGUgY29udGFjdCBsaXN0IHRvIGJlIHByZXZpZXdlZFxuICogQHBhcmFtIG9rQWN0aW9uIFRoZSBhY3Rpb24gdG8gYmUgZXhlY3V0ZWQgd2hlbiB0aGUgdXNlciBwcmVzcyB0aGUgaW1wb3J0IGJ1dHRvbiB3aXRoIGF0IGxlYXN0IG9uZSBjb250YWN0IHNlbGVjdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaG93Q29udGFjdEltcG9ydERpYWxvZyhjb250YWN0czogQ29udGFjdFtdLCBva0FjdGlvbjogKGRpYWxvZzogRGlhbG9nLCBzZWxlY3RlZENvbnRhY3RzOiBDb250YWN0W10pID0+IHVua25vd24sIHRpdGxlOiBNYXliZVRyYW5zbGF0aW9uKSB7XG5cdGNvbnN0IHZpZXdNb2RlbDogQ29udGFjdEltcG9ydERpYWxvZ1ZpZXdNb2RlbCA9IG5ldyBDb250YWN0SW1wb3J0RGlhbG9nVmlld01vZGVsKClcblx0dmlld01vZGVsLnNlbGVjdENvbnRhY3RzKGNvbnRhY3RzKVxuXHRjb25zdCByZW5kZXJDb25maWc6IFJlbmRlckNvbmZpZzxDb250YWN0LCBLaW5kYUNvbnRhY3RSb3c+ID0ge1xuXHRcdGl0ZW1IZWlnaHQ6IHNpemUubGlzdF9yb3dfaGVpZ2h0LFxuXHRcdG11bHRpc2VsZWN0aW9uQWxsb3dlZDogTXVsdGlzZWxlY3RNb2RlLkVuYWJsZWQsXG5cdFx0c3dpcGU6IG51bGwsXG5cdFx0Y3JlYXRlRWxlbWVudDogKGRvbSkgPT4ge1xuXHRcdFx0cmV0dXJuIG5ldyBLaW5kYUNvbnRhY3RSb3coXG5cdFx0XHRcdGRvbSxcblx0XHRcdFx0KHNlbGVjdGVkQ29udGFjdDogQ29udGFjdCkgPT4gdmlld01vZGVsLnNlbGVjdFNpbmdsZUNvbnRhY3Qoc2VsZWN0ZWRDb250YWN0KSxcblx0XHRcdFx0KCkgPT4gdHJ1ZSxcblx0XHRcdClcblx0XHR9LFxuXHR9XG5cblx0Y29uc3QgZGlhbG9nID0gbmV3IERpYWxvZyhEaWFsb2dUeXBlLkVkaXRTbWFsbCwge1xuXHRcdHZpZXc6ICgpID0+IFtcblx0XHRcdC8qKiBmaXhlZC1oZWlnaHQgaGVhZGVyIHdpdGggYSB0aXRsZSwgbGVmdCBhbmQgcmlnaHQgYnV0dG9ucyB0aGF0J3MgZml4ZWQgdG8gdGhlIHRvcCBvZiB0aGUgZGlhbG9nJ3MgYXJlYSAqL1xuXHRcdFx0bShEaWFsb2dIZWFkZXJCYXIsIHtcblx0XHRcdFx0bGVmdDogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0bGFiZWw6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdFx0bWlkZGxlOiB0aXRsZSxcblx0XHRcdFx0cmlnaHQ6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHRcdFx0XHRsYWJlbDogXCJpbXBvcnRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBzZWxlY3RlZENvbnRhY3RzID0gWy4uLnZpZXdNb2RlbC5nZXRTZWxlY3RlZENvbnRhY3RzKCldXG5cdFx0XHRcdFx0XHRcdGlmIChzZWxlY3RlZENvbnRhY3RzLmxlbmd0aCA8PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJub0NvbnRhY3RfbXNnXCIpXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0b2tBY3Rpb24oZGlhbG9nLCBzZWxlY3RlZENvbnRhY3RzKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdF0sXG5cdFx0XHR9IHNhdGlzZmllcyBEaWFsb2dIZWFkZXJCYXJBdHRycyksXG5cdFx0XHQvKiogdmFyaWFibGUtc2l6ZSBjaGlsZCBjb250YWluZXIgdGhhdCBtYXkgYmUgc2Nyb2xsYWJsZS4gKi9cblx0XHRcdG0oXCIuZGlhbG9nLW1heC1oZWlnaHQucGxyLXMucGIudGV4dC1icmVhay5uYXYtYmdcIiwgW1xuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmxpc3QtYmcuYm9yZGVyLXJhZGl1cy5tdC1zLm1sLXMubXItc1wiLFxuXHRcdFx0XHRcdG0oU2VsZWN0QWxsQ2hlY2tib3gsIHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IFwiMFwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHNlbGVjdGVkOiB2aWV3TW9kZWwuaXNBbGxDb250YWN0c1NlbGVjdGVkKGNvbnRhY3RzKSxcblx0XHRcdFx0XHRcdHNlbGVjdE5vbmU6ICgpID0+IHZpZXdNb2RlbC5jbGVhclNlbGVjdGlvbigpLFxuXHRcdFx0XHRcdFx0c2VsZWN0QWxsOiAoKSA9PiB2aWV3TW9kZWwuc2VsZWN0Q29udGFjdHMoY29udGFjdHMpLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXguY29sLnJlbC5tdC1zXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBcIjgwdmhcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRtKExpc3QsIHtcblx0XHRcdFx0XHRcdHJlbmRlckNvbmZpZyxcblx0XHRcdFx0XHRcdHN0YXRlOiB7XG5cdFx0XHRcdFx0XHRcdGl0ZW1zOiBjb250YWN0cyxcblx0XHRcdFx0XHRcdFx0bG9hZGluZ1N0YXR1czogTGlzdExvYWRpbmdTdGF0ZS5Eb25lLFxuXHRcdFx0XHRcdFx0XHRsb2FkaW5nQWxsOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0c2VsZWN0ZWRJdGVtczogdmlld01vZGVsLmdldFNlbGVjdGVkQ29udGFjdHMoKSxcblx0XHRcdFx0XHRcdFx0aW5NdWx0aXNlbGVjdDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0YWN0aXZlSW5kZXg6IG51bGwsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b25Mb2FkTW9yZSgpIHt9LFxuXHRcdFx0XHRcdFx0b25SYW5nZVNlbGVjdGlvblRvd2FyZHMoaXRlbTogQ29udGFjdCkge30sXG5cdFx0XHRcdFx0XHRvblJldHJ5TG9hZGluZygpIHt9LFxuXHRcdFx0XHRcdFx0b25TaW5nbGVTZWxlY3Rpb24oaXRlbTogQ29udGFjdCkge1xuXHRcdFx0XHRcdFx0XHR2aWV3TW9kZWwuc2VsZWN0U2luZ2xlQ29udGFjdChpdGVtKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uU2luZ2xlVG9nZ2xpbmdNdWx0aXNlbGVjdGlvbihpdGVtOiBDb250YWN0KSB7fSxcblx0XHRcdFx0XHRcdG9uU3RvcExvYWRpbmcoKSB7fSxcblx0XHRcdFx0XHR9IHNhdGlzZmllcyBMaXN0QXR0cnM8Q29udGFjdCwgS2luZGFDb250YWN0Um93PiksXG5cdFx0XHRcdCksXG5cdFx0XHRdKSxcblx0XHRdLFxuXHR9KS5zaG93KClcbn1cblxuLy8gQ29udHJvbHMgdGhlIHNlbGVjdGVkIGNvbnRhY3RzIGluIGBzaG93Q29udGFjdEltcG9ydERpYWxvZygpYFxuY2xhc3MgQ29udGFjdEltcG9ydERpYWxvZ1ZpZXdNb2RlbCB7XG5cdHByaXZhdGUgcmVhZG9ubHkgc2VsZWN0ZWRDb250YWN0czogU2V0PENvbnRhY3Q+ID0gbmV3IFNldCgpXG5cblx0Z2V0U2VsZWN0ZWRDb250YWN0cygpOiBTZXQ8Q29udGFjdD4ge1xuXHRcdHJldHVybiBuZXcgU2V0KHRoaXMuc2VsZWN0ZWRDb250YWN0cylcblx0fVxuXG5cdC8vIENvbXBhcmVzIHRoZSBzZWxlY3RlZCBjb250YWN0cyBhZ2FpbnN0IGEgbGlzdCBvZiBjb250YWN0cyBhbmQgcmV0dXJucyB3aGV0aGVyIHRoZXkgY29udGFpbiB0aGUgc2FtZSBjb250YWN0c1xuXHRpc0FsbENvbnRhY3RzU2VsZWN0ZWQoY29udGFjdHM6IENvbnRhY3RbXSk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IHVuc2VsZWN0ZWRDb250YWN0cyA9IGNvbnRhY3RzLmZpbHRlcigoY29udGFjdCkgPT4gIXRoaXMuc2VsZWN0ZWRDb250YWN0cy5oYXMoY29udGFjdCkpXG5cdFx0cmV0dXJuIHVuc2VsZWN0ZWRDb250YWN0cy5sZW5ndGggPD0gMFxuXHR9XG5cblx0Ly8gRGVzZWxlY3RzIGFsbCB0aGUgc2VsZWN0ZWQgY29udGFjdHNcblx0Y2xlYXJTZWxlY3Rpb24oKTogdm9pZCB7XG5cdFx0dGhpcy5zZWxlY3RlZENvbnRhY3RzLmNsZWFyKClcblx0fVxuXG5cdC8vIFRvZ2dsZXMgdGhlIHByZXNlbmNlIG9mIGEgY29udGFjdCB3aXRoaW4gdGhlIHNlbGVjdGVkIGNvbnRhY3RzXG5cdHNlbGVjdFNpbmdsZUNvbnRhY3Qoc2VsZWN0ZWRDb250YWN0OiBDb250YWN0KTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuc2VsZWN0ZWRDb250YWN0cy5oYXMoc2VsZWN0ZWRDb250YWN0KSkge1xuXHRcdFx0dGhpcy5zZWxlY3RlZENvbnRhY3RzLmRlbGV0ZShzZWxlY3RlZENvbnRhY3QpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc2VsZWN0ZWRDb250YWN0cy5hZGQoc2VsZWN0ZWRDb250YWN0KVxuXHRcdH1cblx0fVxuXG5cdC8vIFJlcGxhY2VzIHRoZSBzZWxlY3RlZCBjb250YWN0cyB3aXRoIHRoZSBwcm92aWRlZCBjb250YWN0c1xuXHRzZWxlY3RDb250YWN0cyhjb250YWN0czogQ29udGFjdFtdKTogdm9pZCB7XG5cdFx0dGhpcy5zZWxlY3RlZENvbnRhY3RzLmNsZWFyKClcblx0XHRmb3IgKGNvbnN0IGNvbnRhY3Qgb2YgY29udGFjdHMpIHtcblx0XHRcdHRoaXMuc2VsZWN0ZWRDb250YWN0cy5hZGQoY29udGFjdClcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQ29udGFjdHMoZmlsZUxpc3Q6IEZpbGVSZWZlcmVuY2VbXSwgZmlsZUFwcDogTmF0aXZlRmlsZUFwcCkge1xuXHRjb25zdCByYXdDb250YWN0czogc3RyaW5nW10gPSBbXVxuXHRmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZUxpc3QpIHtcblx0XHRpZiAoZ2V0QXR0YWNobWVudFR5cGUoZmlsZS5taW1lVHlwZSkgPT09IEF0dGFjaG1lbnRUeXBlLkNPTlRBQ1QpIHtcblx0XHRcdGNvbnN0IGRhdGFGaWxlID0gYXdhaXQgZmlsZUFwcC5yZWFkRGF0YUZpbGUoZmlsZS5sb2NhdGlvbilcblx0XHRcdGlmIChkYXRhRmlsZSA9PSBudWxsKSBjb250aW51ZVxuXG5cdFx0XHRjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKFwidXRmLThcIilcblx0XHRcdGNvbnN0IHZDYXJkRGF0YSA9IGRlY29kZXIuZGVjb2RlKGRhdGFGaWxlLmRhdGEpXG5cblx0XHRcdHJhd0NvbnRhY3RzLnB1c2godkNhcmREYXRhKVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiByYXdDb250YWN0c1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0NBLGtCQUFrQjtBQU1YLFNBQVMsa0JBQWtCQSxlQUF3QztDQUN6RSxJQUFJLEtBQUs7Q0FDVCxJQUFJLEtBQUs7Q0FDVCxJQUFJLEtBQUs7Q0FDVCxJQUFJLElBQUk7Q0FDUixJQUFJLElBQUk7QUFDUixpQkFBZ0IsY0FBYyxRQUFRLGdCQUFnQixjQUFjO0FBQ3BFLGlCQUFnQixjQUFjLFFBQVEsY0FBYyxZQUFZO0FBQ2hFLGlCQUFnQixjQUFjLFFBQVEsZ0JBQWdCLGNBQWM7QUFFcEUsS0FDQyxjQUFjLFFBQVEsY0FBYyxHQUFHLE1BQ3ZDLGNBQWMsUUFBUSxFQUFFLEdBQUcsT0FDMUIsY0FBYyxRQUFRLEdBQUcsR0FBRyxNQUFNLGNBQWMsUUFBUSxHQUFHLEdBQUcsTUFBTSxjQUFjLFFBQVEsR0FBRyxHQUFHLEtBQ2hHO0FBQ0Qsa0JBQWdCLGNBQWMsUUFBUSxPQUFPLEdBQUc7QUFDaEQsa0JBQWdCLGNBQWMsUUFBUSxRQUFRLEdBQUc7QUFFakQsa0JBQWdCLGNBQWMsUUFBUSxvQkFBb0IsR0FBRztBQUM3RCxrQkFBZ0IsY0FBYyxRQUFRLGtCQUFrQixHQUFHO0FBQzNELGtCQUFnQixjQUFjLFFBQVEs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