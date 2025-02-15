import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, clone, downcast, findAndRemove, lastIndex, lastThrow, noOp, typedEntries } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { DefaultAnimationTime, animations, height, opacity } from "./styles-chunk.js";
import { ContactAddressType, ContactCustomDateType, ContactMessengerHandleType, ContactPhoneNumberType, ContactRelationshipType, ContactSocialType, ContactWebsiteType, GroupType, Keys } from "./TutanotaConstants-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { timestampToGeneratedId } from "./EntityUtils-chunk.js";
import { createBirthday, createContact, createContactAddress, createContactCustomDate, createContactMailAddress, createContactMessengerHandle, createContactPhoneNumber, createContactPronouns, createContactRelationship, createContactSocialId, createContactWebsite } from "./TypeRefs-chunk.js";
import { isMailAddress } from "./FormatValidator-chunk.js";
import { LockedError, NotFoundError, PayloadTooLargeError } from "./RestError-chunk.js";
import { birthdayToIsoDate } from "./BirthdayUtils-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Autocapitalize, Autocomplete, Dialog, TextField, TextFieldType, attachDropdown } from "./Dialog-chunk.js";
import { BootIcons } from "./Icon-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import { formatDate } from "./Formatter-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { formatBirthdayNumeric, formatContactDate } from "./ContactUtils-chunk.js";
import { parseBirthday } from "./DateParser-chunk.js";
import { PasswordField } from "./PasswordField-chunk.js";
import { ContactCustomDateTypeToLabel, ContactCustomWebsiteTypeToLabel, ContactMailAddressTypeToLabel, ContactMessengerHandleTypeToLabel, ContactPhoneNumberTypeToLabel, ContactRelationshipTypeToLabel, ContactSocialTypeToLabel, getContactAddressTypeLabel, getContactCustomDateTypeToLabel, getContactCustomWebsiteTypeToLabel, getContactMessengerHandleTypeToLabel, getContactPhoneNumberTypeLabel, getContactRelationshipTypeToLabel, getContactSocialTypeLabel } from "./ContactGuiUtils-chunk.js";

//#region src/mail-app/contacts/ContactAggregateEditor.ts
var ContactAggregateEditor = class {
	oncreate(vnode) {
		const animate = typeof vnode.attrs.animateCreate === "boolean" ? vnode.attrs.animateCreate : true;
		if (animate) this.animate(vnode.dom, true);
	}
	async onbeforeremove(vnode) {
		await this.animate(vnode.dom, false);
	}
	view(vnode) {
		const attrs = vnode.attrs;
		return mithril_default(".flex.items-center.child-grow", [mithril_default(TextField, {
			value: attrs.value,
			label: attrs.label,
			type: attrs.fieldType,
			autocapitalize: attrs.autocapitalizeTextField,
			helpLabel: () => lang.getTranslationText(attrs.helpLabel),
			injectionsRight: () => this._moreButtonFor(attrs),
			oninput: (value) => attrs.onUpdate(value)
		}), this._cancelButtonFor(attrs)]);
	}
	_doesAllowCancel(attrs) {
		return typeof attrs.allowCancel === "boolean" ? attrs.allowCancel : true;
	}
	_cancelButtonFor(attrs) {
		if (this._doesAllowCancel(attrs)) return mithril_default(IconButton, {
			title: "remove_action",
			click: () => attrs.cancelAction(),
			icon: Icons.Cancel
		});
else return mithril_default(".icon-button");
	}
	_moreButtonFor(attrs) {
		return mithril_default(IconButton, attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: BootIcons.Expand,
				size: ButtonSize.Compact
			},
			childAttrs: () => attrs.typeLabels.map(([key, value]) => {
				return {
					label: value,
					click: () => attrs.onTypeSelected(key)
				};
			})
		}));
	}
	animate(domElement, fadein) {
		let childHeight = domElement.offsetHeight;
		if (fadein) domElement.style.opacity = "0";
		const opacityP = animations.add(domElement, fadein ? opacity(0, 1, true) : opacity(1, 0, true));
		const heightP = animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0));
		heightP.then(() => {
			domElement.style.height = "";
		});
		return Promise.all([opacityP, heightP]);
	}
};

//#endregion
//#region src/mail-app/contacts/ContactEditor.ts
assertMainOrNode();
const TAG = "[ContactEditor]";
var ContactEditor = class {
	dialog;
	hasInvalidBirthday;
	mailAddresses;
	phoneNumbers;
	addresses;
	socialIds;
	websites;
	relationships;
	messengerHandles;
	pronouns;
	customDates;
	birthday;
	windowCloseUnsubscribe;
	isNewContact;
	contact;
	listId;
	saving = false;
	constructor(entityClient, contact, listId, newContactIdReceiver = null) {
		this.entityClient = entityClient;
		this.newContactIdReceiver = newContactIdReceiver;
		this.contact = contact ? clone(contact) : createContact({
			mailAddresses: [],
			title: null,
			socialIds: [],
			role: "",
			presharedPassword: null,
			photo: null,
			phoneNumbers: [],
			oldBirthdayDate: null,
			nickname: null,
			lastName: "",
			firstName: "",
			company: "",
			comment: "",
			birthdayIso: null,
			addresses: [],
			oldBirthdayAggregate: null,
			department: null,
			middleName: null,
			nameSuffix: null,
			phoneticFirst: null,
			phoneticLast: null,
			phoneticMiddle: null,
			customDate: [],
			messengerHandles: [],
			pronouns: [],
			relationships: [],
			websites: []
		});
		this.isNewContact = contact?._id == null;
		if (this.isNewContact && listId == null) throw new ProgrammingError("must provide contact with Id to edit or listId for the new contact");
else this.listId = listId ? listId : assertNotNull(contact, "got an existing contact without id")._id[0];
		const id = (entity) => entity._id || this.newId();
		this.mailAddresses = this.contact.mailAddresses.map((address) => [address, id(address)]);
		this.mailAddresses.push(this.newMailAddress());
		this.phoneNumbers = this.contact.phoneNumbers.map((phoneNumber) => [phoneNumber, id(phoneNumber)]);
		this.phoneNumbers.push(this.newPhoneNumber());
		this.addresses = this.contact.addresses.map((address) => [address, id(address)]);
		this.addresses.push(this.newAddress());
		this.socialIds = this.contact.socialIds.map((socialId) => [socialId, id(socialId)]);
		this.socialIds.push(this.newSocialId());
		this.websites = this.contact.websites.map((website) => [website, id(website)]);
		this.websites.push(this.newWebsite());
		this.relationships = this.contact.relationships.map((relation) => [relation, id(relation)]);
		this.relationships.push(this.newRelationship());
		this.messengerHandles = this.contact.messengerHandles.map((handler) => [handler, id(handler)]);
		this.messengerHandles.push(this.newMessengerHandler());
		this.pronouns = this.contact.pronouns.map((pronoun) => [pronoun, id(pronoun)]);
		this.pronouns.push(this.newPronoun());
		this.customDates = this.contact.customDate.map((date) => [{
			...date,
			date: formatContactDate(date.dateIso),
			isValid: true
		}, id(date)]);
		this.customDates.push(this.newCustomDate());
		this.hasInvalidBirthday = false;
		this.birthday = formatContactDate(this.contact.birthdayIso) || "";
		this.dialog = this.createDialog();
		this.windowCloseUnsubscribe = noOp;
	}
	oncreate() {
		this.windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {});
	}
	onremove() {
		this.windowCloseUnsubscribe();
	}
	view() {
		return mithril_default("#contact-editor", [
			mithril_default(".wrapping-row", [this.renderFirstNameField(), this.renderLastNameField()]),
			mithril_default(".wrapping-row", [this.renderField("middleName", "middleName_placeholder"), this.renderTitleField()]),
			mithril_default(".wrapping-row", [this.renderField("nameSuffix", "nameSuffix_placeholder"), this.renderField("phoneticFirst", "phoneticFirst_placeholder")]),
			mithril_default(".wrapping-row", [this.renderField("phoneticMiddle", "phoneticMiddle_placeholder"), this.renderField("phoneticLast", "phoneticLast_placeholder")]),
			mithril_default(".wrapping-row", [this.renderField("nickname", "nickname_placeholder"), this.renderBirthdayField()]),
			mithril_default(".wrapping-row", [
				this.renderRoleField(),
				this.renderField("department", "department_placeholder"),
				this.renderCompanyField(),
				this.renderCommentField()
			]),
			mithril_default(".wrapping-row", [
				mithril_default(".custom-dates.mt-xl", [mithril_default(".h4", lang.get("dates_label")), mithril_default(".aggregateEditors", [this.customDates.map(([date, id], index) => {
					const lastEditor = index === lastIndex(this.customDates);
					return this.renderCustomDatesEditor(id, !lastEditor, date);
				})])]),
				mithril_default(".mail.mt-xl", [mithril_default(".h4", lang.get("email_label")), mithril_default(".aggregateEditors", [this.mailAddresses.map(([address, id], index) => {
					const lastEditor = index === lastIndex(this.mailAddresses);
					return this.renderMailAddressesEditor(id, !lastEditor, address);
				})])]),
				mithril_default(".phone.mt-xl", [mithril_default(".h4", lang.get("phone_label")), mithril_default(".aggregateEditors", [this.phoneNumbers.map(([phoneNumber, id], index) => {
					const lastEditor = index === lastIndex(this.phoneNumbers);
					return this.renderPhonesEditor(id, !lastEditor, phoneNumber);
				})])]),
				mithril_default(".relationship.mt-xl", [mithril_default(".h4", lang.get("relationships_label")), mithril_default(".aggregateEditors", [this.relationships.map(([relationship, id], index) => {
					const lastEditor = index === lastIndex(this.relationships);
					return this.renderRelationshipsEditor(id, !lastEditor, relationship);
				})])]),
				mithril_default(".address.mt-xl", [mithril_default(".h4", lang.get("address_label")), mithril_default(".aggregateEditors", [this.addresses.map(([address, id], index) => {
					const lastEditor = index === lastIndex(this.addresses);
					return this.renderAddressesEditor(id, !lastEditor, address);
				})])])
			]),
			mithril_default(".wrapping-row", [
				mithril_default(".pronouns.mt-xl", [mithril_default(".h4", lang.get("pronouns_label")), mithril_default(".aggregateEditors", [this.pronouns.map(([pronouns, id], index) => {
					const lastEditor = index === lastIndex(this.pronouns);
					return this.renderPronounsEditor(id, !lastEditor, pronouns);
				})])]),
				mithril_default(".social.mt-xl", [mithril_default(".h4", lang.get("social_label")), mithril_default(".aggregateEditors", [this.socialIds.map(([socialId, id], index) => {
					const lastEditor = index === lastIndex(this.socialIds);
					return this.renderSocialsEditor(id, !lastEditor, socialId);
				})])]),
				mithril_default(".website.mt-xl", [mithril_default(".h4", lang.get("websites_label")), mithril_default(".aggregateEditors", [this.websites.map(([website, id], index) => {
					const lastEditor = index === lastIndex(this.websites);
					return this.renderWebsitesEditor(id, !lastEditor, website);
				})])]),
				mithril_default(".instant-message.mt-xl", [mithril_default(".h4", lang.get("messenger_handles_label")), mithril_default(".aggregateEditors", [this.messengerHandles.map(([handle, id], index) => {
					const lastEditor = index === lastIndex(this.messengerHandles);
					return this.renderMessengerHandleEditor(id, !lastEditor, handle);
				})])])
			]),
			this.renderPresharedPasswordField(),
			mithril_default(".pb")
		]);
	}
	show() {
		this.dialog.show();
	}
	close() {
		this.dialog.close();
	}
	/**
	* * validate the input data
	* * create or update the contact, depending on status
	* * if successful, close the dialog.
	*
	* will not call the save function again if the operation is already running
	* @private
	*/
	async validateAndSave() {
		if (this.hasInvalidBirthday) return Dialog.message("invalidBirthday_msg");
		if (this.saving) return;
		this.saving = true;
		this.contact.mailAddresses = this.mailAddresses.map((e) => e[0]).filter((e) => e.address.trim().length > 0);
		this.contact.phoneNumbers = this.phoneNumbers.map((e) => e[0]).filter((e) => e.number.trim().length > 0);
		this.contact.addresses = this.addresses.map((e) => e[0]).filter((e) => e.address.trim().length > 0);
		this.contact.socialIds = this.socialIds.map((e) => e[0]).filter((e) => e.socialId.trim().length > 0);
		this.contact.customDate = this.customDates.map((e) => e[0]).filter((e) => e.dateIso.trim().length > 0);
		this.contact.relationships = this.relationships.map((e) => e[0]).filter((e) => e.person.trim().length > 0);
		this.contact.websites = this.websites.map((e) => e[0]).filter((e) => e.url.length > 0);
		this.contact.messengerHandles = this.messengerHandles.map((e) => e[0]).filter((e) => e.handle.length > 0);
		this.contact.pronouns = this.pronouns.map((e) => e[0]).filter((e) => e.pronouns.length > 0);
		try {
			if (this.isNewContact) await this.saveNewContact();
else await this.updateExistingContact();
			this.close();
		} catch (e) {
			this.saving = false;
			if (e instanceof PayloadTooLargeError) return Dialog.message("requestTooLarge_msg");
			if (e instanceof LockedError) return Dialog.message("operationStillActive_msg");
		}
	}
	async updateExistingContact() {
		try {
			await this.entityClient.update(this.contact);
		} catch (e) {
			if (e instanceof NotFoundError) console.log(TAG, `could not update contact ${this.contact._id}: not found`);
		}
	}
	async saveNewContact() {
		this.contact._ownerGroup = assertNotNull(locator.logins.getUserController().user.memberships.find((m) => m.groupType === GroupType.Contact), "did not find contact group membership").group;
		const contactId = await this.entityClient.setup(this.listId, this.contact);
		if (this.newContactIdReceiver) this.newContactIdReceiver(contactId);
	}
	renderCustomDatesEditor(id, allowCancel, date) {
		let dateHelpText = () => {
			let bday = createBirthday({
				day: "22",
				month: "9",
				year: "2000"
			});
			return !date.isValid ? lang.getTranslation("invalidDateFormat_msg", { "{1}": formatBirthdayNumeric(bday) }) : lang.getTranslation("emptyString_msg");
		};
		const typeLabels = typedEntries(ContactCustomDateTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: date.date,
			fieldType: TextFieldType.Text,
			label: getContactCustomDateTypeToLabel(downcast(date.type), date.customTypeName),
			helpLabel: dateHelpText(),
			cancelAction: () => {
				findAndRemove(this.customDates, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				date.date = value;
				if (value.trim().length > 0) {
					let parsedDate = parseBirthday(value, (referenceDate) => formatDate(referenceDate));
					if (parsedDate) try {
						date.dateIso = birthdayToIsoDate(parsedDate);
						if (date === lastThrow(this.customDates)[0]) this.customDates.push(this.newCustomDate());
						date.isValid = true;
					} catch (e) {
						date.isValid = false;
					}
else date.isValid = false;
				} else date.isValid = true;
			},
			animateCreate: !date.dateIso,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactCustomDateType.CUSTOM, type, date)
		});
	}
	renderMailAddressesEditor(id, allowCancel, mailAddress) {
		let helpLabel;
		if (mailAddress.address.trim().length > 0 && !isMailAddress(mailAddress.address.trim(), false)) helpLabel = "invalidInputFormat_msg";
else helpLabel = "emptyString_msg";
		const typeLabels = typedEntries(ContactMailAddressTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: mailAddress.address,
			fieldType: TextFieldType.Email,
			label: getContactAddressTypeLabel(downcast(mailAddress.type), mailAddress.customTypeName),
			helpLabel,
			cancelAction: () => {
				findAndRemove(this.mailAddresses, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				mailAddress.address = value;
				if (mailAddress === lastThrow(this.mailAddresses)[0]) this.mailAddresses.push(this.newAddress());
			},
			animateCreate: !mailAddress.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactAddressType.CUSTOM, type, mailAddress)
		});
	}
	renderPhonesEditor(id, allowCancel, phoneNumber) {
		const typeLabels = typedEntries(ContactPhoneNumberTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: phoneNumber.number,
			fieldType: TextFieldType.Text,
			label: getContactPhoneNumberTypeLabel(downcast(phoneNumber.type), phoneNumber.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.phoneNumbers, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				phoneNumber.number = value;
				if (phoneNumber === lastThrow(this.phoneNumbers)[0]) this.phoneNumbers.push(this.newPhoneNumber());
			},
			animateCreate: !phoneNumber.number,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactPhoneNumberType.CUSTOM, type, phoneNumber)
		});
	}
	renderAddressesEditor(id, allowCancel, address) {
		const typeLabels = typedEntries(ContactMailAddressTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: address.address,
			fieldType: TextFieldType.Area,
			label: getContactAddressTypeLabel(downcast(address.type), address.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.addresses, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				address.address = value;
				if (address === lastThrow(this.addresses)[0]) this.addresses.push(this.newAddress());
			},
			animateCreate: !address.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactAddressType.CUSTOM, type, address)
		});
	}
	renderSocialsEditor(id, allowCancel, socialId) {
		const typeLabels = typedEntries(ContactSocialTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: socialId.socialId,
			fieldType: TextFieldType.Text,
			label: getContactSocialTypeLabel(downcast(socialId.type), socialId.customTypeName),
			helpLabel: "emptyString_msg",
			autocapitalizeTextField: Autocapitalize.none,
			cancelAction: () => {
				findAndRemove(this.socialIds, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				socialId.socialId = value;
				if (socialId === lastThrow(this.socialIds)[0]) this.socialIds.push(this.newSocialId());
			},
			animateCreate: !socialId.socialId,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactSocialType.CUSTOM, type, socialId)
		});
	}
	renderWebsitesEditor(id, allowCancel, website) {
		const typeLabels = typedEntries(ContactCustomWebsiteTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: website.url,
			fieldType: TextFieldType.Text,
			label: getContactCustomWebsiteTypeToLabel(downcast(website.type), website.customTypeName),
			helpLabel: "emptyString_msg",
			autocapitalizeTextField: Autocapitalize.none,
			cancelAction: () => {
				findAndRemove(this.websites, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				website.url = value;
				if (website === lastThrow(this.websites)[0]) this.websites.push(this.newWebsite());
			},
			animateCreate: !website.url,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactWebsiteType.CUSTOM, type, website)
		});
	}
	renderRelationshipsEditor(id, allowCancel, relationship) {
		const typeLabels = typedEntries(ContactRelationshipTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: relationship.person,
			fieldType: TextFieldType.Text,
			label: getContactRelationshipTypeToLabel(downcast(relationship.type), relationship.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.relationships, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				relationship.person = value;
				if (relationship === lastThrow(this.relationships)[0]) this.relationships.push(this.newRelationship());
			},
			animateCreate: !relationship.person,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactRelationshipType.CUSTOM, type, relationship)
		});
	}
	renderMessengerHandleEditor(id, allowCancel, messengerHandle) {
		const typeLabels = typedEntries(ContactMessengerHandleTypeToLabel);
		return mithril_default(ContactAggregateEditor, {
			value: messengerHandle.handle,
			fieldType: TextFieldType.Text,
			label: getContactMessengerHandleTypeToLabel(downcast(messengerHandle.type), messengerHandle.customTypeName),
			helpLabel: "emptyString_msg",
			autocapitalizeTextField: Autocapitalize.none,
			cancelAction: () => {
				findAndRemove(this.messengerHandles, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				messengerHandle.handle = value;
				if (messengerHandle === lastThrow(this.messengerHandles)[0]) this.messengerHandles.push(this.newMessengerHandler());
			},
			animateCreate: !messengerHandle.handle,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactMessengerHandleType.CUSTOM, type, messengerHandle)
		});
	}
	renderPronounsEditor(id, allowCancel, pronouns) {
		const typeLabels = typedEntries({ "0": "language_label" });
		return mithril_default(ContactAggregateEditor, {
			value: pronouns.pronouns,
			fieldType: TextFieldType.Text,
			label: lang.makeTranslation("lang", pronouns.language),
			helpLabel: "emptyString_msg",
			autocapitalizeTextField: Autocapitalize.none,
			cancelAction: () => {
				findAndRemove(this.pronouns, (t) => t[1] === id);
			},
			onUpdate: (value) => {
				pronouns.pronouns = value;
				if (pronouns === lastThrow(this.pronouns)[0]) this.pronouns.push(this.newPronoun());
			},
			animateCreate: !pronouns.pronouns,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: () => this.onLanguageSelect(pronouns)
		});
	}
	renderCommentField() {
		return mithril_default(StandaloneField, {
			label: "comment_label",
			value: this.contact.comment,
			oninput: (value) => this.contact.comment = value,
			type: TextFieldType.Area
		});
	}
	renderFirstNameField() {
		return mithril_default(StandaloneField, {
			label: "firstName_placeholder",
			value: this.contact.firstName,
			oninput: (value) => this.contact.firstName = value
		});
	}
	renderField(fieldName, label) {
		return mithril_default(StandaloneField, {
			label,
			value: this.contact[fieldName] ?? "",
			oninput: (value) => {
				if (typeof value === "string") this.contact[fieldName] = downcast(value);
			}
		});
	}
	renderLastNameField() {
		return mithril_default(StandaloneField, {
			label: "lastName_placeholder",
			value: this.contact.lastName,
			oninput: (value) => this.contact.lastName = value
		});
	}
	renderBirthdayField() {
		let birthdayHelpText = () => {
			let bday = createBirthday({
				day: "22",
				month: "9",
				year: "2000"
			});
			return this.hasInvalidBirthday ? lang.get("invalidDateFormat_msg", { "{1}": formatBirthdayNumeric(bday) }) : "";
		};
		return mithril_default(StandaloneField, {
			label: "birthday_alt",
			value: this.birthday,
			helpLabel: birthdayHelpText,
			oninput: (value) => {
				this.birthday = value;
				if (value.trim().length === 0) {
					this.contact.birthdayIso = null;
					this.hasInvalidBirthday = false;
				} else {
					let birthday = parseBirthday(value, (referenceDate) => formatDate(referenceDate));
					if (birthday) try {
						this.contact.birthdayIso = birthdayToIsoDate(birthday);
						this.hasInvalidBirthday = false;
					} catch (e) {
						this.hasInvalidBirthday = true;
					}
else this.hasInvalidBirthday = true;
				}
			}
		});
	}
	renderCompanyField() {
		return mithril_default(StandaloneField, {
			label: "company_label",
			value: this.contact.company,
			oninput: (value) => this.contact.company = value
		});
	}
	renderRoleField() {
		return mithril_default(StandaloneField, {
			label: "role_placeholder",
			value: this.contact.role,
			oninput: (value) => this.contact.role = value
		});
	}
	renderTitleField() {
		return mithril_default(StandaloneField, {
			label: "title_placeholder",
			value: this.contact.title || "",
			oninput: (value) => this.contact.title = value
		});
	}
	renderPresharedPasswordField() {
		if (!this.isNewContact && !this.contact.presharedPassword) return null;
		return mithril_default(".wrapping-row", [mithril_default(".passwords.mt-xl", [mithril_default(".h4", lang.get("presharedPassword_label")), mithril_default(PasswordField, {
			value: this.contact.presharedPassword ?? "",
			autocompleteAs: Autocomplete.newPassword,
			oninput: (value) => this.contact.presharedPassword = value
		})]), mithril_default(".spacer")]);
	}
	createCloseButtonAttrs() {
		return {
			label: "close_alt",
			click: () => this.close(),
			type: ButtonType.Secondary
		};
	}
	newPhoneNumber() {
		const phoneNumber = createContactPhoneNumber({
			type: ContactPhoneNumberType.MOBILE,
			customTypeName: "",
			number: ""
		});
		return [phoneNumber, this.newId()];
	}
	newMailAddress() {
		const mailAddress = createContactMailAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: ""
		});
		return [mailAddress, this.newId()];
	}
	newAddress() {
		const address = createContactAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: ""
		});
		return [address, this.newId()];
	}
	newSocialId() {
		const socialId = createContactSocialId({
			type: ContactSocialType.TWITTER,
			customTypeName: "",
			socialId: ""
		});
		return [socialId, this.newId()];
	}
	newRelationship() {
		const relationship = createContactRelationship({
			person: "",
			type: ContactRelationshipType.ASSISTANT,
			customTypeName: ""
		});
		return [relationship, this.newId()];
	}
	newMessengerHandler() {
		const messengerHandler = createContactMessengerHandle({
			handle: "",
			type: ContactMessengerHandleType.SIGNAL,
			customTypeName: ""
		});
		return [messengerHandler, this.newId()];
	}
	newPronoun() {
		const contactPronouns = createContactPronouns({
			language: "",
			pronouns: ""
		});
		return [contactPronouns, this.newId()];
	}
	newCustomDate() {
		const contactDate = createContactCustomDate({
			dateIso: "",
			type: ContactCustomDateType.ANNIVERSARY,
			customTypeName: ""
		});
		return [{
			...contactDate,
			date: "",
			isValid: true
		}, this.newId()];
	}
	newWebsite() {
		const website = createContactWebsite({
			type: ContactWebsiteType.PRIVATE,
			url: "",
			customTypeName: ""
		});
		return [website, this.newId()];
	}
	newId() {
		return timestampToGeneratedId(Date.now());
	}
	onTypeSelected(isCustom, key, aggregate) {
		if (isCustom) setTimeout(() => {
			Dialog.showTextInputDialog({
				title: "customLabel_label",
				label: "customLabel_label",
				defaultValue: aggregate.customTypeName
			}).then((name) => {
				aggregate.customTypeName = name;
				aggregate.type = key;
			});
		}, DefaultAnimationTime);
else aggregate.type = key;
	}
	onLanguageSelect(pronouns) {
		setTimeout(() => {
			Dialog.showTextInputDialog({
				title: "language_label",
				label: "language_label",
				defaultValue: pronouns.language.length > 0 ? pronouns.language : ""
			}).then((name) => {
				pronouns.language = name;
			});
		}, DefaultAnimationTime);
	}
	createDialog() {
		const headerBarAttrs = {
			left: [this.createCloseButtonAttrs()],
			middle: lang.makeTranslation("name", this.contact.firstName + " " + this.contact.lastName),
			right: [{
				label: "save_action",
				click: () => this.validateAndSave(),
				type: ButtonType.Primary
			}]
		};
		return Dialog.largeDialog(headerBarAttrs, this).addShortcut({
			key: Keys.ESC,
			exec: () => this.close(),
			help: "close_alt"
		}).addShortcut({
			key: Keys.S,
			ctrlOrCmd: true,
			exec: () => {
				this.validateAndSave();
			},
			help: "save_action"
		}).setCloseHandler(() => this.close());
	}
};
var StandaloneField = class {
	view({ attrs }) {
		return mithril_default(".flex.child-grow", [mithril_default(TextField, attrs), mithril_default(".icon-button")]);
	}
};

//#endregion
export { ContactEditor };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGFjdEVkaXRvci1jaHVuay5qcyIsIm5hbWVzIjpbInZub2RlOiBWbm9kZURPTTxBZ2dyZWdhdGVFZGl0b3JBdHRyczxhbnk+PiIsInZub2RlOiBWbm9kZTxBZ2dyZWdhdGVFZGl0b3JBdHRyczxhbnk+PiIsImF0dHJzOiBBZ2dyZWdhdGVFZGl0b3JBdHRyczxhbnk+IiwiYXR0cnM6IEFnZ3JlZ2F0ZUVkaXRvckF0dHJzPHVua25vd24+IiwiZG9tRWxlbWVudDogSFRNTEVsZW1lbnQiLCJmYWRlaW46IGJvb2xlYW4iLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImNvbnRhY3Q6IENvbnRhY3QgfCBudWxsIiwibGlzdElkPzogSWQiLCJuZXdDb250YWN0SWRSZWNlaXZlcjogKChjb250YWN0SWQ6IElkKSA9PiB1bmtub3duKSB8IG51bGwiLCJlbnRpdHk6IHsgX2lkOiBJZCB9IiwiaWQ6IElkIiwiYWxsb3dDYW5jZWw6IGJvb2xlYW4iLCJkYXRlOiBDb21wbGV0ZUN1c3RvbURhdGUiLCJ0eXBlTGFiZWxzOiBBcnJheTxbQ29udGFjdEN1c3RvbURhdGVUeXBlLCBUcmFuc2xhdGlvbktleV0+IiwibWFpbEFkZHJlc3M6IENvbnRhY3RNYWlsQWRkcmVzcyIsImhlbHBMYWJlbDogVHJhbnNsYXRpb25LZXkiLCJ0eXBlTGFiZWxzOiBBcnJheTxbQ29udGFjdEFkZHJlc3NUeXBlLCBUcmFuc2xhdGlvbktleV0+IiwicGhvbmVOdW1iZXI6IENvbnRhY3RQaG9uZU51bWJlciIsImFkZHJlc3M6IENvbnRhY3RBZGRyZXNzIiwic29jaWFsSWQ6IENvbnRhY3RTb2NpYWxJZCIsIndlYnNpdGU6IENvbnRhY3RXZWJzaXRlIiwicmVsYXRpb25zaGlwOiBDb250YWN0UmVsYXRpb25zaGlwIiwibWVzc2VuZ2VySGFuZGxlOiBDb250YWN0TWVzc2VuZ2VySGFuZGxlIiwicHJvbm91bnM6IENvbnRhY3RQcm9ub3VucyIsImZpZWxkTmFtZToga2V5b2YgQ29udGFjdCIsImxhYmVsOiBUcmFuc2xhdGlvbktleSIsInZhbHVlOiBzdHJpbmciLCJpc0N1c3RvbTogYm9vbGVhbiIsImtleTogSyIsImFnZ3JlZ2F0ZTogVCIsImhlYWRlckJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWlsLWFwcC9jb250YWN0cy9Db250YWN0QWdncmVnYXRlRWRpdG9yLnRzIiwiLi4vc3JjL21haWwtYXBwL2NvbnRhY3RzL0NvbnRhY3RFZGl0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXV0b2NhcGl0YWxpemUsIFRleHRGaWVsZCwgVGV4dEZpZWxkVHlwZSB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IGxhbmcsIFRyYW5zbGF0aW9uS2V5LCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlLCBWbm9kZURPTSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBhbmltYXRpb25zLCBoZWlnaHQsIG9wYWNpdHkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9hbmltYXRpb24vQW5pbWF0aW9uc1wiXG5pbXBvcnQgeyBhdHRhY2hEcm9wZG93biB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29ucy5qc1wiXG5pbXBvcnQgeyBCdXR0b25TaXplIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b25TaXplLmpzXCJcblxuZXhwb3J0IHR5cGUgQWdncmVnYXRlRWRpdG9yQXR0cnM8QWdncmVnYXRlVHlwZT4gPSB7XG5cdHZhbHVlOiBzdHJpbmdcblx0Y2FuY2VsQWN0aW9uOiAoKSA9PiB1bmtub3duXG5cdGtleTogc3RyaW5nXG5cdGFuaW1hdGVDcmVhdGU/OiBib29sZWFuXG5cdGFuaW1hdGVDYW5jZWw/OiBib29sZWFuXG5cdGFsbG93Q2FuY2VsPzogYm9vbGVhblxuXHRmaWVsZFR5cGU6IFRleHRGaWVsZFR5cGVcblx0b25VcGRhdGU6IChuZXdWYWx1ZTogc3RyaW5nKSA9PiB1bmtub3duXG5cdGxhYmVsOiBNYXliZVRyYW5zbGF0aW9uXG5cdGhlbHBMYWJlbDogTWF5YmVUcmFuc2xhdGlvblxuXHR0eXBlTGFiZWxzOiBSZWFkb25seUFycmF5PFtBZ2dyZWdhdGVUeXBlLCBUcmFuc2xhdGlvbktleV0+XG5cdG9uVHlwZVNlbGVjdGVkOiAoYXJnMDogQWdncmVnYXRlVHlwZSkgPT4gdW5rbm93blxuXHRhdXRvY2FwaXRhbGl6ZVRleHRGaWVsZD86IEF1dG9jYXBpdGFsaXplXG59XG5cbmV4cG9ydCBjbGFzcyBDb250YWN0QWdncmVnYXRlRWRpdG9yIGltcGxlbWVudHMgQ29tcG9uZW50PEFnZ3JlZ2F0ZUVkaXRvckF0dHJzPGFueT4+IHtcblx0b25jcmVhdGUodm5vZGU6IFZub2RlRE9NPEFnZ3JlZ2F0ZUVkaXRvckF0dHJzPGFueT4+KSB7XG5cdFx0Y29uc3QgYW5pbWF0ZSA9IHR5cGVvZiB2bm9kZS5hdHRycy5hbmltYXRlQ3JlYXRlID09PSBcImJvb2xlYW5cIiA/IHZub2RlLmF0dHJzLmFuaW1hdGVDcmVhdGUgOiB0cnVlXG5cdFx0aWYgKGFuaW1hdGUpIHRoaXMuYW5pbWF0ZSh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQsIHRydWUpXG5cdH1cblxuXHRhc3luYyBvbmJlZm9yZXJlbW92ZSh2bm9kZTogVm5vZGVET008QWdncmVnYXRlRWRpdG9yQXR0cnM8YW55Pj4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCB0aGlzLmFuaW1hdGUodm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50LCBmYWxzZSlcblx0fVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPEFnZ3JlZ2F0ZUVkaXRvckF0dHJzPGFueT4+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGF0dHJzID0gdm5vZGUuYXR0cnNcblx0XHRyZXR1cm4gbShcIi5mbGV4Lml0ZW1zLWNlbnRlci5jaGlsZC1ncm93XCIsIFtcblx0XHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdHZhbHVlOiBhdHRycy52YWx1ZSxcblx0XHRcdFx0bGFiZWw6IGF0dHJzLmxhYmVsLFxuXHRcdFx0XHR0eXBlOiBhdHRycy5maWVsZFR5cGUsXG5cdFx0XHRcdGF1dG9jYXBpdGFsaXplOiBhdHRycy5hdXRvY2FwaXRhbGl6ZVRleHRGaWVsZCxcblx0XHRcdFx0aGVscExhYmVsOiAoKSA9PiBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChhdHRycy5oZWxwTGFiZWwpLFxuXHRcdFx0XHRpbmplY3Rpb25zUmlnaHQ6ICgpID0+IHRoaXMuX21vcmVCdXR0b25Gb3IoYXR0cnMpLFxuXHRcdFx0XHRvbmlucHV0OiAodmFsdWUpID0+IGF0dHJzLm9uVXBkYXRlKHZhbHVlKSxcblx0XHRcdH0pLFxuXHRcdFx0dGhpcy5fY2FuY2VsQnV0dG9uRm9yKGF0dHJzKSxcblx0XHRdKVxuXHR9XG5cblx0X2RvZXNBbGxvd0NhbmNlbChhdHRyczogQWdncmVnYXRlRWRpdG9yQXR0cnM8YW55Pik6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0eXBlb2YgYXR0cnMuYWxsb3dDYW5jZWwgPT09IFwiYm9vbGVhblwiID8gYXR0cnMuYWxsb3dDYW5jZWwgOiB0cnVlXG5cdH1cblxuXHRfY2FuY2VsQnV0dG9uRm9yKGF0dHJzOiBBZ2dyZWdhdGVFZGl0b3JBdHRyczx1bmtub3duPik6IENoaWxkcmVuIHtcblx0XHRpZiAodGhpcy5fZG9lc0FsbG93Q2FuY2VsKGF0dHJzKSkge1xuXHRcdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHR0aXRsZTogXCJyZW1vdmVfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiBhdHRycy5jYW5jZWxBY3Rpb24oKSxcblx0XHRcdFx0aWNvbjogSWNvbnMuQ2FuY2VsLFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gcGxhY2Vob2xkZXIgc28gdGhhdCB0aGUgdGV4dCBmaWVsZCBkb2VzIG5vdCBqdW1wIGFyb3VuZFxuXHRcdFx0cmV0dXJuIG0oXCIuaWNvbi1idXR0b25cIilcblx0XHR9XG5cdH1cblxuXHRfbW9yZUJ1dHRvbkZvcihhdHRyczogQWdncmVnYXRlRWRpdG9yQXR0cnM8YW55Pik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdEljb25CdXR0b24sXG5cdFx0XHRhdHRhY2hEcm9wZG93bih7XG5cdFx0XHRcdG1haW5CdXR0b25BdHRyczoge1xuXHRcdFx0XHRcdHRpdGxlOiBcIm1vcmVfbGFiZWxcIixcblx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuRXhwYW5kLFxuXHRcdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2hpbGRBdHRyczogKCkgPT5cblx0XHRcdFx0XHRhdHRycy50eXBlTGFiZWxzLm1hcCgoW2tleSwgdmFsdWVdKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogdmFsdWUsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBhdHRycy5vblR5cGVTZWxlY3RlZChrZXkpLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0YW5pbWF0ZShkb21FbGVtZW50OiBIVE1MRWxlbWVudCwgZmFkZWluOiBib29sZWFuKTogUHJvbWlzZTxhbnk+IHtcblx0XHRsZXQgY2hpbGRIZWlnaHQgPSBkb21FbGVtZW50Lm9mZnNldEhlaWdodFxuXG5cdFx0aWYgKGZhZGVpbikge1xuXHRcdFx0ZG9tRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gXCIwXCJcblx0XHR9XG5cblx0XHRjb25zdCBvcGFjaXR5UCA9IGFuaW1hdGlvbnMuYWRkKGRvbUVsZW1lbnQsIGZhZGVpbiA/IG9wYWNpdHkoMCwgMSwgdHJ1ZSkgOiBvcGFjaXR5KDEsIDAsIHRydWUpKVxuXHRcdGNvbnN0IGhlaWdodFAgPSBhbmltYXRpb25zLmFkZChkb21FbGVtZW50LCBmYWRlaW4gPyBoZWlnaHQoMCwgY2hpbGRIZWlnaHQpIDogaGVpZ2h0KGNoaWxkSGVpZ2h0LCAwKSlcblx0XHRoZWlnaHRQLnRoZW4oKCkgPT4ge1xuXHRcdFx0ZG9tRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBcIlwiXG5cdFx0fSlcblx0XHRyZXR1cm4gUHJvbWlzZS5hbGwoW29wYWNpdHlQLCBoZWlnaHRQXSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGlzTWFpbEFkZHJlc3MgfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvRm9ybWF0VmFsaWRhdG9yXCJcbmltcG9ydCB7IGZvcm1hdEJpcnRoZGF5TnVtZXJpYywgZm9ybWF0Q29udGFjdERhdGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0VXRpbHMuanNcIlxuaW1wb3J0IHtcblx0Q29udGFjdEFkZHJlc3NUeXBlLFxuXHRDb250YWN0Q3VzdG9tRGF0ZVR5cGUsXG5cdENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlLFxuXHRDb250YWN0UGhvbmVOdW1iZXJUeXBlLFxuXHRDb250YWN0UmVsYXRpb25zaGlwVHlwZSxcblx0Q29udGFjdFNvY2lhbFR5cGUsXG5cdENvbnRhY3RXZWJzaXRlVHlwZSxcblx0R3JvdXBUeXBlLFxuXHRLZXlzLFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHtcblx0Q29udGFjdCxcblx0Q29udGFjdEFkZHJlc3MsXG5cdENvbnRhY3RDdXN0b21EYXRlLFxuXHRDb250YWN0TWFpbEFkZHJlc3MsXG5cdENvbnRhY3RNZXNzZW5nZXJIYW5kbGUsXG5cdENvbnRhY3RQaG9uZU51bWJlcixcblx0Q29udGFjdFByb25vdW5zLFxuXHRDb250YWN0UmVsYXRpb25zaGlwLFxuXHRDb250YWN0U29jaWFsSWQsXG5cdENvbnRhY3RXZWJzaXRlLFxuXHRjcmVhdGVCaXJ0aGRheSxcblx0Y3JlYXRlQ29udGFjdCxcblx0Y3JlYXRlQ29udGFjdEFkZHJlc3MsXG5cdGNyZWF0ZUNvbnRhY3RDdXN0b21EYXRlLFxuXHRjcmVhdGVDb250YWN0TWFpbEFkZHJlc3MsXG5cdGNyZWF0ZUNvbnRhY3RNZXNzZW5nZXJIYW5kbGUsXG5cdGNyZWF0ZUNvbnRhY3RQaG9uZU51bWJlcixcblx0Y3JlYXRlQ29udGFjdFByb25vdW5zLFxuXHRjcmVhdGVDb250YWN0UmVsYXRpb25zaGlwLFxuXHRjcmVhdGVDb250YWN0U29jaWFsSWQsXG5cdGNyZWF0ZUNvbnRhY3RXZWJzaXRlLFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBjbG9uZSwgZG93bmNhc3QsIGZpbmRBbmRSZW1vdmUsIGxhc3RJbmRleCwgbGFzdFRocm93LCBub09wLCB0eXBlZEVudHJpZXMgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IHdpbmRvd0ZhY2FkZSB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9XaW5kb3dGYWNhZGVcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IsIE5vdEZvdW5kRXJyb3IsIFBheWxvYWRUb29MYXJnZUVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQgdHlwZSB7IEJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IGJpcnRoZGF5VG9Jc29EYXRlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0JpcnRoZGF5VXRpbHNcIlxuaW1wb3J0IHtcblx0Q29udGFjdEN1c3RvbURhdGVUeXBlVG9MYWJlbCxcblx0Q29udGFjdEN1c3RvbVdlYnNpdGVUeXBlVG9MYWJlbCxcblx0Q29udGFjdE1haWxBZGRyZXNzVHlwZVRvTGFiZWwsXG5cdENvbnRhY3RNZXNzZW5nZXJIYW5kbGVUeXBlVG9MYWJlbCxcblx0Q29udGFjdFBob25lTnVtYmVyVHlwZVRvTGFiZWwsXG5cdENvbnRhY3RSZWxhdGlvbnNoaXBUeXBlVG9MYWJlbCxcblx0Q29udGFjdFNvY2lhbFR5cGVUb0xhYmVsLFxuXHRnZXRDb250YWN0QWRkcmVzc1R5cGVMYWJlbCxcblx0Z2V0Q29udGFjdEN1c3RvbURhdGVUeXBlVG9MYWJlbCxcblx0Z2V0Q29udGFjdEN1c3RvbVdlYnNpdGVUeXBlVG9MYWJlbCxcblx0Z2V0Q29udGFjdE1lc3NlbmdlckhhbmRsZVR5cGVUb0xhYmVsLFxuXHRnZXRDb250YWN0UGhvbmVOdW1iZXJUeXBlTGFiZWwsXG5cdGdldENvbnRhY3RSZWxhdGlvbnNoaXBUeXBlVG9MYWJlbCxcblx0Z2V0Q29udGFjdFNvY2lhbFR5cGVMYWJlbCxcbn0gZnJvbSBcIi4vdmlldy9Db250YWN0R3VpVXRpbHNcIlxuaW1wb3J0IHsgcGFyc2VCaXJ0aGRheSB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9EYXRlUGFyc2VyXCJcbmltcG9ydCB0eXBlIHsgVGV4dEZpZWxkQXR0cnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBBdXRvY2FwaXRhbGl6ZSwgQXV0b2NvbXBsZXRlLCBUZXh0RmllbGQsIFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB7IHRpbWVzdGFtcFRvR2VuZXJhdGVkSWQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHsgQWdncmVnYXRlRWRpdG9yQXR0cnMsIENvbnRhY3RBZ2dyZWdhdGVFZGl0b3IgfSBmcm9tIFwiLi9Db250YWN0QWdncmVnYXRlRWRpdG9yXCJcbmltcG9ydCB7IERlZmF1bHRBbmltYXRpb25UaW1lIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYW5pbWF0aW9uL0FuaW1hdGlvbnNcIlxuaW1wb3J0IHsgRGlhbG9nSGVhZGVyQmFyQXR0cnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZ0hlYWRlckJhclwiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBmb3JtYXREYXRlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBQYXNzd29yZEZpZWxkIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL3Bhc3N3b3Jkcy9QYXNzd29yZEZpZWxkLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbmNvbnN0IFRBRyA9IFwiW0NvbnRhY3RFZGl0b3JdXCJcblxuaW50ZXJmYWNlIENvbXBsZXRlQ3VzdG9tRGF0ZSBleHRlbmRzIENvbnRhY3RDdXN0b21EYXRlIHtcblx0ZGF0ZTogc3RyaW5nXG5cdGlzVmFsaWQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNsYXNzIENvbnRhY3RFZGl0b3Ige1xuXHRwcml2YXRlIHJlYWRvbmx5IGRpYWxvZzogRGlhbG9nXG5cdHByaXZhdGUgaGFzSW52YWxpZEJpcnRoZGF5OiBib29sZWFuXG5cdHByaXZhdGUgcmVhZG9ubHkgbWFpbEFkZHJlc3NlczogQXJyYXk8W0NvbnRhY3RNYWlsQWRkcmVzcywgSWRdPlxuXHRwcml2YXRlIHJlYWRvbmx5IHBob25lTnVtYmVyczogQXJyYXk8W0NvbnRhY3RQaG9uZU51bWJlciwgSWRdPlxuXHRwcml2YXRlIHJlYWRvbmx5IGFkZHJlc3NlczogQXJyYXk8W0NvbnRhY3RBZGRyZXNzLCBJZF0+XG5cdHByaXZhdGUgcmVhZG9ubHkgc29jaWFsSWRzOiBBcnJheTxbQ29udGFjdFNvY2lhbElkLCBJZF0+XG5cdHByaXZhdGUgcmVhZG9ubHkgd2Vic2l0ZXM6IEFycmF5PFtDb250YWN0V2Vic2l0ZSwgSWRdPlxuXHRwcml2YXRlIHJlYWRvbmx5IHJlbGF0aW9uc2hpcHM6IEFycmF5PFtDb250YWN0UmVsYXRpb25zaGlwLCBJZF0+XG5cdHByaXZhdGUgcmVhZG9ubHkgbWVzc2VuZ2VySGFuZGxlczogQXJyYXk8W0NvbnRhY3RNZXNzZW5nZXJIYW5kbGUsIElkXT5cblx0cHJpdmF0ZSByZWFkb25seSBwcm9ub3VuczogQXJyYXk8W0NvbnRhY3RQcm9ub3VucywgSWRdPlxuXHRwcml2YXRlIHJlYWRvbmx5IGN1c3RvbURhdGVzOiBBcnJheTxbQ29tcGxldGVDdXN0b21EYXRlLCBJZF0+XG5cdHByaXZhdGUgYmlydGhkYXk6IHN0cmluZ1xuXHR3aW5kb3dDbG9zZVVuc3Vic2NyaWJlOiAoKSA9PiB1bmtub3duXG5cdHByaXZhdGUgcmVhZG9ubHkgaXNOZXdDb250YWN0OiBib29sZWFuXG5cdHByaXZhdGUgcmVhZG9ubHkgY29udGFjdDogQ29udGFjdFxuXHRwcml2YXRlIHJlYWRvbmx5IGxpc3RJZDogSWRcblxuXHRwcml2YXRlIHNhdmluZzogYm9vbGVhbiA9IGZhbHNlXG5cblx0Lypcblx0ICogVGhlIGNvbnRhY3QgdGhhdCBzaG91bGQgYmUgdXBkYXRlIG9yIHRoZSBjb250YWN0IGxpc3QgdGhhdCB0aGUgbmV3IGNvbnRhY3Qgc2hvdWxkIGJlIHdyaXR0ZW4gdG8gbXVzdCBiZSBwcm92aWRlZFxuXHQgKiBAcGFyYW0gZW50aXR5Q2xpZW50XG5cdCAqIEBwYXJhbSBjb250YWN0IEFuIGV4aXN0aW5nIG9yIG5ldyBjb250YWN0LiBJZiBudWxsIGEgbmV3IGNvbnRhY3QgaXMgY3JlYXRlZC5cblx0ICogQHBhcmFtIGxpc3RJZCBUaGUgbGlzdCBpZCBvZiB0aGUgbmV3IGNvbnRhY3QuXG5cdCAqIEBwYXJhbSBuZXdDb250YWN0SWRSZWNlaXZlci4gSXMgY2FsbGVkIHJlY2VpdmluZyB0aGUgY29udGFjdCBpZCBhcyBzb29uIGFzIHRoZSBuZXcgY29udGFjdCB3YXMgc2F2ZWQuXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdGNvbnRhY3Q6IENvbnRhY3QgfCBudWxsLFxuXHRcdGxpc3RJZD86IElkLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbmV3Q29udGFjdElkUmVjZWl2ZXI6ICgoY29udGFjdElkOiBJZCkgPT4gdW5rbm93bikgfCBudWxsID0gbnVsbCxcblx0KSB7XG5cdFx0dGhpcy5jb250YWN0ID0gY29udGFjdFxuXHRcdFx0PyBjbG9uZShjb250YWN0KVxuXHRcdFx0OiBjcmVhdGVDb250YWN0KHtcblx0XHRcdFx0XHRtYWlsQWRkcmVzc2VzOiBbXSxcblx0XHRcdFx0XHR0aXRsZTogbnVsbCxcblx0XHRcdFx0XHRzb2NpYWxJZHM6IFtdLFxuXHRcdFx0XHRcdHJvbGU6IFwiXCIsXG5cdFx0XHRcdFx0cHJlc2hhcmVkUGFzc3dvcmQ6IG51bGwsXG5cdFx0XHRcdFx0cGhvdG86IG51bGwsXG5cdFx0XHRcdFx0cGhvbmVOdW1iZXJzOiBbXSxcblx0XHRcdFx0XHRvbGRCaXJ0aGRheURhdGU6IG51bGwsXG5cdFx0XHRcdFx0bmlja25hbWU6IG51bGwsXG5cdFx0XHRcdFx0bGFzdE5hbWU6IFwiXCIsXG5cdFx0XHRcdFx0Zmlyc3ROYW1lOiBcIlwiLFxuXHRcdFx0XHRcdGNvbXBhbnk6IFwiXCIsXG5cdFx0XHRcdFx0Y29tbWVudDogXCJcIixcblx0XHRcdFx0XHRiaXJ0aGRheUlzbzogbnVsbCxcblx0XHRcdFx0XHRhZGRyZXNzZXM6IFtdLFxuXHRcdFx0XHRcdG9sZEJpcnRoZGF5QWdncmVnYXRlOiBudWxsLFxuXHRcdFx0XHRcdGRlcGFydG1lbnQ6IG51bGwsXG5cdFx0XHRcdFx0bWlkZGxlTmFtZTogbnVsbCxcblx0XHRcdFx0XHRuYW1lU3VmZml4OiBudWxsLFxuXHRcdFx0XHRcdHBob25ldGljRmlyc3Q6IG51bGwsXG5cdFx0XHRcdFx0cGhvbmV0aWNMYXN0OiBudWxsLFxuXHRcdFx0XHRcdHBob25ldGljTWlkZGxlOiBudWxsLFxuXHRcdFx0XHRcdGN1c3RvbURhdGU6IFtdLFxuXHRcdFx0XHRcdG1lc3NlbmdlckhhbmRsZXM6IFtdLFxuXHRcdFx0XHRcdHByb25vdW5zOiBbXSxcblx0XHRcdFx0XHRyZWxhdGlvbnNoaXBzOiBbXSxcblx0XHRcdFx0XHR3ZWJzaXRlczogW10sXG5cdFx0XHQgIH0pXG5cdFx0dGhpcy5pc05ld0NvbnRhY3QgPSBjb250YWN0Py5faWQgPT0gbnVsbFxuXG5cdFx0aWYgKHRoaXMuaXNOZXdDb250YWN0ICYmIGxpc3RJZCA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIm11c3QgcHJvdmlkZSBjb250YWN0IHdpdGggSWQgdG8gZWRpdCBvciBsaXN0SWQgZm9yIHRoZSBuZXcgY29udGFjdFwiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmxpc3RJZCA9IGxpc3RJZCA/IGxpc3RJZCA6IGFzc2VydE5vdE51bGwoY29udGFjdCwgXCJnb3QgYW4gZXhpc3RpbmcgY29udGFjdCB3aXRob3V0IGlkXCIpLl9pZFswXVxuXHRcdH1cblxuXHRcdGNvbnN0IGlkID0gKGVudGl0eTogeyBfaWQ6IElkIH0pID0+IGVudGl0eS5faWQgfHwgdGhpcy5uZXdJZCgpXG5cblx0XHR0aGlzLm1haWxBZGRyZXNzZXMgPSB0aGlzLmNvbnRhY3QubWFpbEFkZHJlc3Nlcy5tYXAoKGFkZHJlc3MpID0+IFthZGRyZXNzLCBpZChhZGRyZXNzKV0pXG5cdFx0dGhpcy5tYWlsQWRkcmVzc2VzLnB1c2godGhpcy5uZXdNYWlsQWRkcmVzcygpKVxuXHRcdHRoaXMucGhvbmVOdW1iZXJzID0gdGhpcy5jb250YWN0LnBob25lTnVtYmVycy5tYXAoKHBob25lTnVtYmVyKSA9PiBbcGhvbmVOdW1iZXIsIGlkKHBob25lTnVtYmVyKV0pXG5cdFx0dGhpcy5waG9uZU51bWJlcnMucHVzaCh0aGlzLm5ld1Bob25lTnVtYmVyKCkpXG5cdFx0dGhpcy5hZGRyZXNzZXMgPSB0aGlzLmNvbnRhY3QuYWRkcmVzc2VzLm1hcCgoYWRkcmVzcykgPT4gW2FkZHJlc3MsIGlkKGFkZHJlc3MpXSlcblx0XHR0aGlzLmFkZHJlc3Nlcy5wdXNoKHRoaXMubmV3QWRkcmVzcygpKVxuXHRcdHRoaXMuc29jaWFsSWRzID0gdGhpcy5jb250YWN0LnNvY2lhbElkcy5tYXAoKHNvY2lhbElkKSA9PiBbc29jaWFsSWQsIGlkKHNvY2lhbElkKV0pXG5cdFx0dGhpcy5zb2NpYWxJZHMucHVzaCh0aGlzLm5ld1NvY2lhbElkKCkpXG5cblx0XHR0aGlzLndlYnNpdGVzID0gdGhpcy5jb250YWN0LndlYnNpdGVzLm1hcCgod2Vic2l0ZSkgPT4gW3dlYnNpdGUsIGlkKHdlYnNpdGUpXSlcblx0XHR0aGlzLndlYnNpdGVzLnB1c2godGhpcy5uZXdXZWJzaXRlKCkpXG5cdFx0dGhpcy5yZWxhdGlvbnNoaXBzID0gdGhpcy5jb250YWN0LnJlbGF0aW9uc2hpcHMubWFwKChyZWxhdGlvbikgPT4gW3JlbGF0aW9uLCBpZChyZWxhdGlvbildKVxuXHRcdHRoaXMucmVsYXRpb25zaGlwcy5wdXNoKHRoaXMubmV3UmVsYXRpb25zaGlwKCkpXG5cdFx0dGhpcy5tZXNzZW5nZXJIYW5kbGVzID0gdGhpcy5jb250YWN0Lm1lc3NlbmdlckhhbmRsZXMubWFwKChoYW5kbGVyKSA9PiBbaGFuZGxlciwgaWQoaGFuZGxlcildKVxuXHRcdHRoaXMubWVzc2VuZ2VySGFuZGxlcy5wdXNoKHRoaXMubmV3TWVzc2VuZ2VySGFuZGxlcigpKVxuXHRcdHRoaXMucHJvbm91bnMgPSB0aGlzLmNvbnRhY3QucHJvbm91bnMubWFwKChwcm9ub3VuKSA9PiBbcHJvbm91biwgaWQocHJvbm91bildKVxuXHRcdHRoaXMucHJvbm91bnMucHVzaCh0aGlzLm5ld1Byb25vdW4oKSlcblx0XHR0aGlzLmN1c3RvbURhdGVzID0gdGhpcy5jb250YWN0LmN1c3RvbURhdGUubWFwKChkYXRlKSA9PiBbXG5cdFx0XHR7XG5cdFx0XHRcdC4uLmRhdGUsXG5cdFx0XHRcdGRhdGU6IGZvcm1hdENvbnRhY3REYXRlKGRhdGUuZGF0ZUlzbyksXG5cdFx0XHRcdGlzVmFsaWQ6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0aWQoZGF0ZSksXG5cdFx0XSlcblx0XHR0aGlzLmN1c3RvbURhdGVzLnB1c2godGhpcy5uZXdDdXN0b21EYXRlKCkpXG5cblx0XHR0aGlzLmhhc0ludmFsaWRCaXJ0aGRheSA9IGZhbHNlXG5cdFx0dGhpcy5iaXJ0aGRheSA9IGZvcm1hdENvbnRhY3REYXRlKHRoaXMuY29udGFjdC5iaXJ0aGRheUlzbykgfHwgXCJcIlxuXHRcdHRoaXMuZGlhbG9nID0gdGhpcy5jcmVhdGVEaWFsb2coKVxuXHRcdHRoaXMud2luZG93Q2xvc2VVbnN1YnNjcmliZSA9IG5vT3Bcblx0fVxuXG5cdG9uY3JlYXRlKCkge1xuXHRcdHRoaXMud2luZG93Q2xvc2VVbnN1YnNjcmliZSA9IHdpbmRvd0ZhY2FkZS5hZGRXaW5kb3dDbG9zZUxpc3RlbmVyKCgpID0+IHt9KVxuXHR9XG5cblx0b25yZW1vdmUoKSB7XG5cdFx0dGhpcy53aW5kb3dDbG9zZVVuc3Vic2NyaWJlKClcblx0fVxuXG5cdHZpZXcoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwiI2NvbnRhY3QtZWRpdG9yXCIsIFtcblx0XHRcdG0oXCIud3JhcHBpbmctcm93XCIsIFt0aGlzLnJlbmRlckZpcnN0TmFtZUZpZWxkKCksIHRoaXMucmVuZGVyTGFzdE5hbWVGaWVsZCgpXSksXG5cdFx0XHRtKFwiLndyYXBwaW5nLXJvd1wiLCBbdGhpcy5yZW5kZXJGaWVsZChcIm1pZGRsZU5hbWVcIiwgXCJtaWRkbGVOYW1lX3BsYWNlaG9sZGVyXCIpLCB0aGlzLnJlbmRlclRpdGxlRmllbGQoKV0pLFxuXHRcdFx0bShcIi53cmFwcGluZy1yb3dcIiwgW3RoaXMucmVuZGVyRmllbGQoXCJuYW1lU3VmZml4XCIsIFwibmFtZVN1ZmZpeF9wbGFjZWhvbGRlclwiKSwgdGhpcy5yZW5kZXJGaWVsZChcInBob25ldGljRmlyc3RcIiwgXCJwaG9uZXRpY0ZpcnN0X3BsYWNlaG9sZGVyXCIpXSksXG5cdFx0XHRtKFwiLndyYXBwaW5nLXJvd1wiLCBbXG5cdFx0XHRcdHRoaXMucmVuZGVyRmllbGQoXCJwaG9uZXRpY01pZGRsZVwiLCBcInBob25ldGljTWlkZGxlX3BsYWNlaG9sZGVyXCIpLFxuXHRcdFx0XHR0aGlzLnJlbmRlckZpZWxkKFwicGhvbmV0aWNMYXN0XCIsIFwicGhvbmV0aWNMYXN0X3BsYWNlaG9sZGVyXCIpLFxuXHRcdFx0XSksXG5cdFx0XHRtKFwiLndyYXBwaW5nLXJvd1wiLCBbdGhpcy5yZW5kZXJGaWVsZChcIm5pY2tuYW1lXCIsIFwibmlja25hbWVfcGxhY2Vob2xkZXJcIiksIHRoaXMucmVuZGVyQmlydGhkYXlGaWVsZCgpXSksXG5cdFx0XHRtKFwiLndyYXBwaW5nLXJvd1wiLCBbXG5cdFx0XHRcdHRoaXMucmVuZGVyUm9sZUZpZWxkKCksXG5cdFx0XHRcdHRoaXMucmVuZGVyRmllbGQoXCJkZXBhcnRtZW50XCIsIFwiZGVwYXJ0bWVudF9wbGFjZWhvbGRlclwiKSxcblx0XHRcdFx0dGhpcy5yZW5kZXJDb21wYW55RmllbGQoKSxcblx0XHRcdFx0dGhpcy5yZW5kZXJDb21tZW50RmllbGQoKSxcblx0XHRcdF0pLFxuXHRcdFx0bShcIi53cmFwcGluZy1yb3dcIiwgW1xuXHRcdFx0XHRtKFwiLmN1c3RvbS1kYXRlcy5tdC14bFwiLCBbXG5cdFx0XHRcdFx0bShcIi5oNFwiLCBsYW5nLmdldChcImRhdGVzX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgW1xuXHRcdFx0XHRcdFx0dGhpcy5jdXN0b21EYXRlcy5tYXAoKFtkYXRlLCBpZF0sIGluZGV4KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGxhc3RFZGl0b3IgPSBpbmRleCA9PT0gbGFzdEluZGV4KHRoaXMuY3VzdG9tRGF0ZXMpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckN1c3RvbURhdGVzRWRpdG9yKGlkLCAhbGFzdEVkaXRvciwgZGF0ZSlcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcIi5tYWlsLm10LXhsXCIsIFtcblx0XHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwiZW1haWxfbGFiZWxcIikpLFxuXHRcdFx0XHRcdG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCBbXG5cdFx0XHRcdFx0XHR0aGlzLm1haWxBZGRyZXNzZXMubWFwKChbYWRkcmVzcywgaWRdLCBpbmRleCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBsYXN0RWRpdG9yID0gaW5kZXggPT09IGxhc3RJbmRleCh0aGlzLm1haWxBZGRyZXNzZXMpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlck1haWxBZGRyZXNzZXNFZGl0b3IoaWQsICFsYXN0RWRpdG9yLCBhZGRyZXNzKVxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHRtKFwiLnBob25lLm10LXhsXCIsIFtcblx0XHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwicGhvbmVfbGFiZWxcIikpLFxuXHRcdFx0XHRcdG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCBbXG5cdFx0XHRcdFx0XHR0aGlzLnBob25lTnVtYmVycy5tYXAoKFtwaG9uZU51bWJlciwgaWRdLCBpbmRleCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBsYXN0RWRpdG9yID0gaW5kZXggPT09IGxhc3RJbmRleCh0aGlzLnBob25lTnVtYmVycylcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyUGhvbmVzRWRpdG9yKGlkLCAhbGFzdEVkaXRvciwgcGhvbmVOdW1iZXIpXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XSksXG5cdFx0XHRcdG0oXCIucmVsYXRpb25zaGlwLm10LXhsXCIsIFtcblx0XHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwicmVsYXRpb25zaGlwc19sYWJlbFwiKSksXG5cdFx0XHRcdFx0bShcIi5hZ2dyZWdhdGVFZGl0b3JzXCIsIFtcblx0XHRcdFx0XHRcdHRoaXMucmVsYXRpb25zaGlwcy5tYXAoKFtyZWxhdGlvbnNoaXAsIGlkXSwgaW5kZXgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbGFzdEVkaXRvciA9IGluZGV4ID09PSBsYXN0SW5kZXgodGhpcy5yZWxhdGlvbnNoaXBzKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJSZWxhdGlvbnNoaXBzRWRpdG9yKGlkLCAhbGFzdEVkaXRvciwgcmVsYXRpb25zaGlwKVxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHRtKFwiLmFkZHJlc3MubXQteGxcIiwgW1xuXHRcdFx0XHRcdG0oXCIuaDRcIiwgbGFuZy5nZXQoXCJhZGRyZXNzX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgW1xuXHRcdFx0XHRcdFx0dGhpcy5hZGRyZXNzZXMubWFwKChbYWRkcmVzcywgaWRdLCBpbmRleCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBsYXN0RWRpdG9yID0gaW5kZXggPT09IGxhc3RJbmRleCh0aGlzLmFkZHJlc3Nlcylcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyQWRkcmVzc2VzRWRpdG9yKGlkLCAhbGFzdEVkaXRvciwgYWRkcmVzcylcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdF0pLFxuXHRcdFx0bShcIi53cmFwcGluZy1yb3dcIiwgW1xuXHRcdFx0XHRtKFwiLnByb25vdW5zLm10LXhsXCIsIFtcblx0XHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwicHJvbm91bnNfbGFiZWxcIikpLFxuXHRcdFx0XHRcdG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCBbXG5cdFx0XHRcdFx0XHR0aGlzLnByb25vdW5zLm1hcCgoW3Byb25vdW5zLCBpZF0sIGluZGV4KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGxhc3RFZGl0b3IgPSBpbmRleCA9PT0gbGFzdEluZGV4KHRoaXMucHJvbm91bnMpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlclByb25vdW5zRWRpdG9yKGlkLCAhbGFzdEVkaXRvciwgcHJvbm91bnMpXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XSksXG5cdFx0XHRcdG0oXCIuc29jaWFsLm10LXhsXCIsIFtcblx0XHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwic29jaWFsX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgW1xuXHRcdFx0XHRcdFx0dGhpcy5zb2NpYWxJZHMubWFwKChbc29jaWFsSWQsIGlkXSwgaW5kZXgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbGFzdEVkaXRvciA9IGluZGV4ID09PSBsYXN0SW5kZXgodGhpcy5zb2NpYWxJZHMpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlclNvY2lhbHNFZGl0b3IoaWQsICFsYXN0RWRpdG9yLCBzb2NpYWxJZClcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcIi53ZWJzaXRlLm10LXhsXCIsIFtcblx0XHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwid2Vic2l0ZXNfbGFiZWxcIikpLFxuXHRcdFx0XHRcdG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCBbXG5cdFx0XHRcdFx0XHR0aGlzLndlYnNpdGVzLm1hcCgoW3dlYnNpdGUsIGlkXSwgaW5kZXgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbGFzdEVkaXRvciA9IGluZGV4ID09PSBsYXN0SW5kZXgodGhpcy53ZWJzaXRlcylcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyV2Vic2l0ZXNFZGl0b3IoaWQsICFsYXN0RWRpdG9yLCB3ZWJzaXRlKVxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHRtKFwiLmluc3RhbnQtbWVzc2FnZS5tdC14bFwiLCBbXG5cdFx0XHRcdFx0bShcIi5oNFwiLCBsYW5nLmdldChcIm1lc3Nlbmdlcl9oYW5kbGVzX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgW1xuXHRcdFx0XHRcdFx0dGhpcy5tZXNzZW5nZXJIYW5kbGVzLm1hcCgoW2hhbmRsZSwgaWRdLCBpbmRleCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBsYXN0RWRpdG9yID0gaW5kZXggPT09IGxhc3RJbmRleCh0aGlzLm1lc3NlbmdlckhhbmRsZXMpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlck1lc3NlbmdlckhhbmRsZUVkaXRvcihpZCwgIWxhc3RFZGl0b3IsIGhhbmRsZSlcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdF0pLFxuXHRcdFx0dGhpcy5yZW5kZXJQcmVzaGFyZWRQYXNzd29yZEZpZWxkKCksXG5cdFx0XHRtKFwiLnBiXCIpLFxuXHRcdF0pXG5cdH1cblxuXHRzaG93KCkge1xuXHRcdHRoaXMuZGlhbG9nLnNob3coKVxuXHR9XG5cblx0cHJpdmF0ZSBjbG9zZSgpIHtcblx0XHR0aGlzLmRpYWxvZy5jbG9zZSgpXG5cdH1cblxuXHQvKipcblx0ICogKiB2YWxpZGF0ZSB0aGUgaW5wdXQgZGF0YVxuXHQgKiAqIGNyZWF0ZSBvciB1cGRhdGUgdGhlIGNvbnRhY3QsIGRlcGVuZGluZyBvbiBzdGF0dXNcblx0ICogKiBpZiBzdWNjZXNzZnVsLCBjbG9zZSB0aGUgZGlhbG9nLlxuXHQgKlxuXHQgKiB3aWxsIG5vdCBjYWxsIHRoZSBzYXZlIGZ1bmN0aW9uIGFnYWluIGlmIHRoZSBvcGVyYXRpb24gaXMgYWxyZWFkeSBydW5uaW5nXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIHZhbGlkYXRlQW5kU2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAodGhpcy5oYXNJbnZhbGlkQmlydGhkYXkpIHtcblx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcImludmFsaWRCaXJ0aGRheV9tc2dcIilcblx0XHR9XG5cblx0XHRpZiAodGhpcy5zYXZpbmcpIHtcblx0XHRcdC8vIG5vdCBzaG93aW5nIGEgbWVzc2FnZS4gaWYgdGhlIHJlc291cmNlIGlzIGxvY2tlZCwgd2UnbGwgc2hvdyBvbmUgd2hlbiBhcHByb3ByaWF0ZS5cblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHR0aGlzLnNhdmluZyA9IHRydWVcblxuXHRcdHRoaXMuY29udGFjdC5tYWlsQWRkcmVzc2VzID0gdGhpcy5tYWlsQWRkcmVzc2VzLm1hcCgoZSkgPT4gZVswXSkuZmlsdGVyKChlKSA9PiBlLmFkZHJlc3MudHJpbSgpLmxlbmd0aCA+IDApXG5cdFx0dGhpcy5jb250YWN0LnBob25lTnVtYmVycyA9IHRoaXMucGhvbmVOdW1iZXJzLm1hcCgoZSkgPT4gZVswXSkuZmlsdGVyKChlKSA9PiBlLm51bWJlci50cmltKCkubGVuZ3RoID4gMClcblx0XHR0aGlzLmNvbnRhY3QuYWRkcmVzc2VzID0gdGhpcy5hZGRyZXNzZXMubWFwKChlKSA9PiBlWzBdKS5maWx0ZXIoKGUpID0+IGUuYWRkcmVzcy50cmltKCkubGVuZ3RoID4gMClcblx0XHR0aGlzLmNvbnRhY3Quc29jaWFsSWRzID0gdGhpcy5zb2NpYWxJZHMubWFwKChlKSA9PiBlWzBdKS5maWx0ZXIoKGUpID0+IGUuc29jaWFsSWQudHJpbSgpLmxlbmd0aCA+IDApXG5cdFx0dGhpcy5jb250YWN0LmN1c3RvbURhdGUgPSB0aGlzLmN1c3RvbURhdGVzLm1hcCgoZSkgPT4gZVswXSBhcyBDb250YWN0Q3VzdG9tRGF0ZSkuZmlsdGVyKChlKSA9PiBlLmRhdGVJc28udHJpbSgpLmxlbmd0aCA+IDApXG5cdFx0dGhpcy5jb250YWN0LnJlbGF0aW9uc2hpcHMgPSB0aGlzLnJlbGF0aW9uc2hpcHMubWFwKChlKSA9PiBlWzBdKS5maWx0ZXIoKGUpID0+IGUucGVyc29uLnRyaW0oKS5sZW5ndGggPiAwKVxuXHRcdHRoaXMuY29udGFjdC53ZWJzaXRlcyA9IHRoaXMud2Vic2l0ZXMubWFwKChlKSA9PiBlWzBdKS5maWx0ZXIoKGUpID0+IGUudXJsLmxlbmd0aCA+IDApXG5cdFx0dGhpcy5jb250YWN0Lm1lc3NlbmdlckhhbmRsZXMgPSB0aGlzLm1lc3NlbmdlckhhbmRsZXMubWFwKChlKSA9PiBlWzBdKS5maWx0ZXIoKGUpID0+IGUuaGFuZGxlLmxlbmd0aCA+IDApXG5cdFx0dGhpcy5jb250YWN0LnByb25vdW5zID0gdGhpcy5wcm9ub3Vucy5tYXAoKGUpID0+IGVbMF0pLmZpbHRlcigoZSkgPT4gZS5wcm9ub3Vucy5sZW5ndGggPiAwKVxuXHRcdHRyeSB7XG5cdFx0XHRpZiAodGhpcy5pc05ld0NvbnRhY3QpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5zYXZlTmV3Q29udGFjdCgpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhd2FpdCB0aGlzLnVwZGF0ZUV4aXN0aW5nQ29udGFjdCgpXG5cdFx0XHR9XG5cdFx0XHR0aGlzLmNsb3NlKClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLnNhdmluZyA9IGZhbHNlXG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFBheWxvYWRUb29MYXJnZUVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcInJlcXVlc3RUb29MYXJnZV9tc2dcIilcblx0XHRcdH1cblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTG9ja2VkRXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwib3BlcmF0aW9uU3RpbGxBY3RpdmVfbXNnXCIpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIGlmIHdlIGdvdCBoZXJlLCB3ZSdyZSBjbG9zaW5nIHRoZSBkaWFsb2cgYW5kIGRvbid0IGhhdmUgdG8gcmVzZXQgdGhpcy5zYXZpbmdcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlRXhpc3RpbmdDb250YWN0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmVudGl0eUNsaWVudC51cGRhdGUodGhpcy5jb250YWN0KVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhUQUcsIGBjb3VsZCBub3QgdXBkYXRlIGNvbnRhY3QgJHt0aGlzLmNvbnRhY3QuX2lkfTogbm90IGZvdW5kYClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNhdmVOZXdDb250YWN0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuY29udGFjdC5fb3duZXJHcm91cCA9IGFzc2VydE5vdE51bGwoXG5cdFx0XHRsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIubWVtYmVyc2hpcHMuZmluZCgobSkgPT4gbS5ncm91cFR5cGUgPT09IEdyb3VwVHlwZS5Db250YWN0KSxcblx0XHRcdFwiZGlkIG5vdCBmaW5kIGNvbnRhY3QgZ3JvdXAgbWVtYmVyc2hpcFwiLFxuXHRcdCkuZ3JvdXBcblx0XHRjb25zdCBjb250YWN0SWQgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5zZXR1cCh0aGlzLmxpc3RJZCwgdGhpcy5jb250YWN0KVxuXHRcdGlmICh0aGlzLm5ld0NvbnRhY3RJZFJlY2VpdmVyKSB7XG5cdFx0XHR0aGlzLm5ld0NvbnRhY3RJZFJlY2VpdmVyKGNvbnRhY3RJZClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckN1c3RvbURhdGVzRWRpdG9yKGlkOiBJZCwgYWxsb3dDYW5jZWw6IGJvb2xlYW4sIGRhdGU6IENvbXBsZXRlQ3VzdG9tRGF0ZSk6IENoaWxkcmVuIHtcblx0XHRsZXQgZGF0ZUhlbHBUZXh0ID0gKCk6IFRyYW5zbGF0aW9uID0+IHtcblx0XHRcdGxldCBiZGF5ID0gY3JlYXRlQmlydGhkYXkoe1xuXHRcdFx0XHRkYXk6IFwiMjJcIixcblx0XHRcdFx0bW9udGg6IFwiOVwiLFxuXHRcdFx0XHR5ZWFyOiBcIjIwMDBcIixcblx0XHRcdH0pXG5cdFx0XHRyZXR1cm4gIWRhdGUuaXNWYWxpZFxuXHRcdFx0XHQ/IGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJpbnZhbGlkRGF0ZUZvcm1hdF9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XCJ7MX1cIjogZm9ybWF0QmlydGhkYXlOdW1lcmljKGJkYXkpLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbGFuZy5nZXRUcmFuc2xhdGlvbihcImVtcHR5U3RyaW5nX21zZ1wiKVxuXHRcdH1cblxuXHRcdGNvbnN0IHR5cGVMYWJlbHM6IEFycmF5PFtDb250YWN0Q3VzdG9tRGF0ZVR5cGUsIFRyYW5zbGF0aW9uS2V5XT4gPSB0eXBlZEVudHJpZXMoQ29udGFjdEN1c3RvbURhdGVUeXBlVG9MYWJlbClcblx0XHRyZXR1cm4gbShDb250YWN0QWdncmVnYXRlRWRpdG9yLCB7XG5cdFx0XHR2YWx1ZTogZGF0ZS5kYXRlLFxuXHRcdFx0ZmllbGRUeXBlOiBUZXh0RmllbGRUeXBlLlRleHQsXG5cdFx0XHRsYWJlbDogZ2V0Q29udGFjdEN1c3RvbURhdGVUeXBlVG9MYWJlbChkb3duY2FzdChkYXRlLnR5cGUpLCBkYXRlLmN1c3RvbVR5cGVOYW1lKSxcblx0XHRcdGhlbHBMYWJlbDogZGF0ZUhlbHBUZXh0KCksXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0ZmluZEFuZFJlbW92ZSh0aGlzLmN1c3RvbURhdGVzLCAodCkgPT4gdFsxXSA9PT0gaWQpXG5cdFx0XHR9LFxuXHRcdFx0b25VcGRhdGU6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRkYXRlLmRhdGUgPSB2YWx1ZVxuXHRcdFx0XHRpZiAodmFsdWUudHJpbSgpLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRsZXQgcGFyc2VkRGF0ZSA9IHBhcnNlQmlydGhkYXkodmFsdWUsIChyZWZlcmVuY2VEYXRlKSA9PiBmb3JtYXREYXRlKHJlZmVyZW5jZURhdGUpKVxuXG5cdFx0XHRcdFx0aWYgKHBhcnNlZERhdGUpIHtcblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdGRhdGUuZGF0ZUlzbyA9IGJpcnRoZGF5VG9Jc29EYXRlKHBhcnNlZERhdGUpXG5cdFx0XHRcdFx0XHRcdGlmIChkYXRlID09PSBsYXN0VGhyb3codGhpcy5jdXN0b21EYXRlcylbMF0pIHRoaXMuY3VzdG9tRGF0ZXMucHVzaCh0aGlzLm5ld0N1c3RvbURhdGUoKSlcblx0XHRcdFx0XHRcdFx0ZGF0ZS5pc1ZhbGlkID0gdHJ1ZVxuXHRcdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0XHRkYXRlLmlzVmFsaWQgPSBmYWxzZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRkYXRlLmlzVmFsaWQgPSBmYWxzZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkYXRlLmlzVmFsaWQgPSB0cnVlXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhbmltYXRlQ3JlYXRlOiAhZGF0ZS5kYXRlSXNvLFxuXHRcdFx0YWxsb3dDYW5jZWwsXG5cdFx0XHRrZXk6IGlkLFxuXHRcdFx0dHlwZUxhYmVscyxcblx0XHRcdG9uVHlwZVNlbGVjdGVkOiAodHlwZSkgPT4gdGhpcy5vblR5cGVTZWxlY3RlZCh0eXBlID09PSBDb250YWN0Q3VzdG9tRGF0ZVR5cGUuQ1VTVE9NLCB0eXBlLCBkYXRlKSxcblx0XHR9IHNhdGlzZmllcyBBZ2dyZWdhdGVFZGl0b3JBdHRyczxhbnk+KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJNYWlsQWRkcmVzc2VzRWRpdG9yKGlkOiBJZCwgYWxsb3dDYW5jZWw6IGJvb2xlYW4sIG1haWxBZGRyZXNzOiBDb250YWN0TWFpbEFkZHJlc3MpOiBDaGlsZHJlbiB7XG5cdFx0bGV0IGhlbHBMYWJlbDogVHJhbnNsYXRpb25LZXlcblxuXHRcdGlmIChtYWlsQWRkcmVzcy5hZGRyZXNzLnRyaW0oKS5sZW5ndGggPiAwICYmICFpc01haWxBZGRyZXNzKG1haWxBZGRyZXNzLmFkZHJlc3MudHJpbSgpLCBmYWxzZSkpIHtcblx0XHRcdGhlbHBMYWJlbCA9IFwiaW52YWxpZElucHV0Rm9ybWF0X21zZ1wiXG5cdFx0fSBlbHNlIHtcblx0XHRcdGhlbHBMYWJlbCA9IFwiZW1wdHlTdHJpbmdfbXNnXCJcblx0XHR9XG5cblx0XHRjb25zdCB0eXBlTGFiZWxzOiBBcnJheTxbQ29udGFjdEFkZHJlc3NUeXBlLCBUcmFuc2xhdGlvbktleV0+ID0gdHlwZWRFbnRyaWVzKENvbnRhY3RNYWlsQWRkcmVzc1R5cGVUb0xhYmVsKVxuXHRcdHJldHVybiBtKENvbnRhY3RBZ2dyZWdhdGVFZGl0b3IsIHtcblx0XHRcdHZhbHVlOiBtYWlsQWRkcmVzcy5hZGRyZXNzLFxuXHRcdFx0ZmllbGRUeXBlOiBUZXh0RmllbGRUeXBlLkVtYWlsLFxuXHRcdFx0bGFiZWw6IGdldENvbnRhY3RBZGRyZXNzVHlwZUxhYmVsKGRvd25jYXN0KG1haWxBZGRyZXNzLnR5cGUpLCBtYWlsQWRkcmVzcy5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHRoZWxwTGFiZWwsXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0ZmluZEFuZFJlbW92ZSh0aGlzLm1haWxBZGRyZXNzZXMsICh0KSA9PiB0WzFdID09PSBpZClcblx0XHRcdH0sXG5cdFx0XHRvblVwZGF0ZTogKHZhbHVlKSA9PiB7XG5cdFx0XHRcdG1haWxBZGRyZXNzLmFkZHJlc3MgPSB2YWx1ZVxuXHRcdFx0XHRpZiAobWFpbEFkZHJlc3MgPT09IGxhc3RUaHJvdyh0aGlzLm1haWxBZGRyZXNzZXMpWzBdKSB0aGlzLm1haWxBZGRyZXNzZXMucHVzaCh0aGlzLm5ld0FkZHJlc3MoKSlcblx0XHRcdH0sXG5cdFx0XHRhbmltYXRlQ3JlYXRlOiAhbWFpbEFkZHJlc3MuYWRkcmVzcyxcblx0XHRcdGFsbG93Q2FuY2VsLFxuXHRcdFx0a2V5OiBpZCxcblx0XHRcdHR5cGVMYWJlbHMsXG5cdFx0XHRvblR5cGVTZWxlY3RlZDogKHR5cGUpID0+IHRoaXMub25UeXBlU2VsZWN0ZWQodHlwZSA9PT0gQ29udGFjdEFkZHJlc3NUeXBlLkNVU1RPTSwgdHlwZSwgbWFpbEFkZHJlc3MpLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclBob25lc0VkaXRvcihpZDogSWQsIGFsbG93Q2FuY2VsOiBib29sZWFuLCBwaG9uZU51bWJlcjogQ29udGFjdFBob25lTnVtYmVyKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHR5cGVMYWJlbHMgPSB0eXBlZEVudHJpZXMoQ29udGFjdFBob25lTnVtYmVyVHlwZVRvTGFiZWwpXG5cdFx0cmV0dXJuIG0oQ29udGFjdEFnZ3JlZ2F0ZUVkaXRvciwge1xuXHRcdFx0dmFsdWU6IHBob25lTnVtYmVyLm51bWJlcixcblx0XHRcdGZpZWxkVHlwZTogVGV4dEZpZWxkVHlwZS5UZXh0LFxuXHRcdFx0bGFiZWw6IGdldENvbnRhY3RQaG9uZU51bWJlclR5cGVMYWJlbChkb3duY2FzdChwaG9uZU51bWJlci50eXBlKSwgcGhvbmVOdW1iZXIuY3VzdG9tVHlwZU5hbWUpLFxuXHRcdFx0aGVscExhYmVsOiBcImVtcHR5U3RyaW5nX21zZ1wiLFxuXHRcdFx0Y2FuY2VsQWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRcdGZpbmRBbmRSZW1vdmUodGhpcy5waG9uZU51bWJlcnMsICh0KSA9PiB0WzFdID09PSBpZClcblx0XHRcdH0sXG5cdFx0XHRvblVwZGF0ZTogKHZhbHVlKSA9PiB7XG5cdFx0XHRcdHBob25lTnVtYmVyLm51bWJlciA9IHZhbHVlXG5cdFx0XHRcdGlmIChwaG9uZU51bWJlciA9PT0gbGFzdFRocm93KHRoaXMucGhvbmVOdW1iZXJzKVswXSkgdGhpcy5waG9uZU51bWJlcnMucHVzaCh0aGlzLm5ld1Bob25lTnVtYmVyKCkpXG5cdFx0XHR9LFxuXHRcdFx0YW5pbWF0ZUNyZWF0ZTogIXBob25lTnVtYmVyLm51bWJlcixcblx0XHRcdGFsbG93Q2FuY2VsLFxuXHRcdFx0a2V5OiBpZCxcblx0XHRcdHR5cGVMYWJlbHMsXG5cdFx0XHRvblR5cGVTZWxlY3RlZDogKHR5cGUpID0+IHRoaXMub25UeXBlU2VsZWN0ZWQodHlwZSA9PT0gQ29udGFjdFBob25lTnVtYmVyVHlwZS5DVVNUT00sIHR5cGUsIHBob25lTnVtYmVyKSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJBZGRyZXNzZXNFZGl0b3IoaWQ6IElkLCBhbGxvd0NhbmNlbDogYm9vbGVhbiwgYWRkcmVzczogQ29udGFjdEFkZHJlc3MpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgdHlwZUxhYmVscyA9IHR5cGVkRW50cmllcyhDb250YWN0TWFpbEFkZHJlc3NUeXBlVG9MYWJlbClcblx0XHRyZXR1cm4gbShDb250YWN0QWdncmVnYXRlRWRpdG9yLCB7XG5cdFx0XHR2YWx1ZTogYWRkcmVzcy5hZGRyZXNzLFxuXHRcdFx0ZmllbGRUeXBlOiBUZXh0RmllbGRUeXBlLkFyZWEsXG5cdFx0XHRsYWJlbDogZ2V0Q29udGFjdEFkZHJlc3NUeXBlTGFiZWwoZG93bmNhc3QoYWRkcmVzcy50eXBlKSwgYWRkcmVzcy5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHRoZWxwTGFiZWw6IFwiZW1wdHlTdHJpbmdfbXNnXCIsXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0ZmluZEFuZFJlbW92ZSh0aGlzLmFkZHJlc3NlcywgKHQpID0+IHRbMV0gPT09IGlkKVxuXHRcdFx0fSxcblx0XHRcdG9uVXBkYXRlOiAodmFsdWUpID0+IHtcblx0XHRcdFx0YWRkcmVzcy5hZGRyZXNzID0gdmFsdWVcblx0XHRcdFx0aWYgKGFkZHJlc3MgPT09IGxhc3RUaHJvdyh0aGlzLmFkZHJlc3NlcylbMF0pIHRoaXMuYWRkcmVzc2VzLnB1c2godGhpcy5uZXdBZGRyZXNzKCkpXG5cdFx0XHR9LFxuXHRcdFx0YW5pbWF0ZUNyZWF0ZTogIWFkZHJlc3MuYWRkcmVzcyxcblx0XHRcdGFsbG93Q2FuY2VsLFxuXHRcdFx0a2V5OiBpZCxcblx0XHRcdHR5cGVMYWJlbHMsXG5cdFx0XHRvblR5cGVTZWxlY3RlZDogKHR5cGUpID0+IHRoaXMub25UeXBlU2VsZWN0ZWQodHlwZSA9PT0gQ29udGFjdEFkZHJlc3NUeXBlLkNVU1RPTSwgdHlwZSwgYWRkcmVzcyksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU29jaWFsc0VkaXRvcihpZDogSWQsIGFsbG93Q2FuY2VsOiBib29sZWFuLCBzb2NpYWxJZDogQ29udGFjdFNvY2lhbElkKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHR5cGVMYWJlbHMgPSB0eXBlZEVudHJpZXMoQ29udGFjdFNvY2lhbFR5cGVUb0xhYmVsKVxuXHRcdHJldHVybiBtKENvbnRhY3RBZ2dyZWdhdGVFZGl0b3IsIHtcblx0XHRcdHZhbHVlOiBzb2NpYWxJZC5zb2NpYWxJZCxcblx0XHRcdGZpZWxkVHlwZTogVGV4dEZpZWxkVHlwZS5UZXh0LFxuXHRcdFx0bGFiZWw6IGdldENvbnRhY3RTb2NpYWxUeXBlTGFiZWwoZG93bmNhc3Q8Q29udGFjdFNvY2lhbFR5cGU+KHNvY2lhbElkLnR5cGUpLCBzb2NpYWxJZC5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHRoZWxwTGFiZWw6IFwiZW1wdHlTdHJpbmdfbXNnXCIsXG5cdFx0XHRhdXRvY2FwaXRhbGl6ZVRleHRGaWVsZDogQXV0b2NhcGl0YWxpemUubm9uZSxcblx0XHRcdGNhbmNlbEFjdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRmaW5kQW5kUmVtb3ZlKHRoaXMuc29jaWFsSWRzLCAodCkgPT4gdFsxXSA9PT0gaWQpXG5cdFx0XHR9LFxuXHRcdFx0b25VcGRhdGU6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRzb2NpYWxJZC5zb2NpYWxJZCA9IHZhbHVlXG5cdFx0XHRcdGlmIChzb2NpYWxJZCA9PT0gbGFzdFRocm93KHRoaXMuc29jaWFsSWRzKVswXSkgdGhpcy5zb2NpYWxJZHMucHVzaCh0aGlzLm5ld1NvY2lhbElkKCkpXG5cdFx0XHR9LFxuXHRcdFx0YW5pbWF0ZUNyZWF0ZTogIXNvY2lhbElkLnNvY2lhbElkLFxuXHRcdFx0YWxsb3dDYW5jZWwsXG5cdFx0XHRrZXk6IGlkLFxuXHRcdFx0dHlwZUxhYmVscyxcblx0XHRcdG9uVHlwZVNlbGVjdGVkOiAodHlwZSkgPT4gdGhpcy5vblR5cGVTZWxlY3RlZCh0eXBlID09PSBDb250YWN0U29jaWFsVHlwZS5DVVNUT00sIHR5cGUsIHNvY2lhbElkKSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJXZWJzaXRlc0VkaXRvcihpZDogSWQsIGFsbG93Q2FuY2VsOiBib29sZWFuLCB3ZWJzaXRlOiBDb250YWN0V2Vic2l0ZSk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB0eXBlTGFiZWxzID0gdHlwZWRFbnRyaWVzKENvbnRhY3RDdXN0b21XZWJzaXRlVHlwZVRvTGFiZWwpXG5cdFx0cmV0dXJuIG0oQ29udGFjdEFnZ3JlZ2F0ZUVkaXRvciwge1xuXHRcdFx0dmFsdWU6IHdlYnNpdGUudXJsLFxuXHRcdFx0ZmllbGRUeXBlOiBUZXh0RmllbGRUeXBlLlRleHQsXG5cdFx0XHRsYWJlbDogZ2V0Q29udGFjdEN1c3RvbVdlYnNpdGVUeXBlVG9MYWJlbChkb3duY2FzdDxDb250YWN0V2Vic2l0ZVR5cGU+KHdlYnNpdGUudHlwZSksIHdlYnNpdGUuY3VzdG9tVHlwZU5hbWUpLFxuXHRcdFx0aGVscExhYmVsOiBcImVtcHR5U3RyaW5nX21zZ1wiLFxuXHRcdFx0YXV0b2NhcGl0YWxpemVUZXh0RmllbGQ6IEF1dG9jYXBpdGFsaXplLm5vbmUsXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0ZmluZEFuZFJlbW92ZSh0aGlzLndlYnNpdGVzLCAodCkgPT4gdFsxXSA9PT0gaWQpXG5cdFx0XHR9LFxuXHRcdFx0b25VcGRhdGU6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHR3ZWJzaXRlLnVybCA9IHZhbHVlXG5cdFx0XHRcdGlmICh3ZWJzaXRlID09PSBsYXN0VGhyb3codGhpcy53ZWJzaXRlcylbMF0pIHRoaXMud2Vic2l0ZXMucHVzaCh0aGlzLm5ld1dlYnNpdGUoKSlcblx0XHRcdH0sXG5cdFx0XHRhbmltYXRlQ3JlYXRlOiAhd2Vic2l0ZS51cmwsXG5cdFx0XHRhbGxvd0NhbmNlbCxcblx0XHRcdGtleTogaWQsXG5cdFx0XHR0eXBlTGFiZWxzLFxuXHRcdFx0b25UeXBlU2VsZWN0ZWQ6ICh0eXBlKSA9PiB0aGlzLm9uVHlwZVNlbGVjdGVkKHR5cGUgPT09IENvbnRhY3RXZWJzaXRlVHlwZS5DVVNUT00sIHR5cGUsIHdlYnNpdGUpLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclJlbGF0aW9uc2hpcHNFZGl0b3IoaWQ6IElkLCBhbGxvd0NhbmNlbDogYm9vbGVhbiwgcmVsYXRpb25zaGlwOiBDb250YWN0UmVsYXRpb25zaGlwKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHR5cGVMYWJlbHMgPSB0eXBlZEVudHJpZXMoQ29udGFjdFJlbGF0aW9uc2hpcFR5cGVUb0xhYmVsKVxuXHRcdHJldHVybiBtKENvbnRhY3RBZ2dyZWdhdGVFZGl0b3IsIHtcblx0XHRcdHZhbHVlOiByZWxhdGlvbnNoaXAucGVyc29uLFxuXHRcdFx0ZmllbGRUeXBlOiBUZXh0RmllbGRUeXBlLlRleHQsXG5cdFx0XHRsYWJlbDogZ2V0Q29udGFjdFJlbGF0aW9uc2hpcFR5cGVUb0xhYmVsKGRvd25jYXN0PENvbnRhY3RSZWxhdGlvbnNoaXBUeXBlPihyZWxhdGlvbnNoaXAudHlwZSksIHJlbGF0aW9uc2hpcC5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHRoZWxwTGFiZWw6IFwiZW1wdHlTdHJpbmdfbXNnXCIsXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0ZmluZEFuZFJlbW92ZSh0aGlzLnJlbGF0aW9uc2hpcHMsICh0KSA9PiB0WzFdID09PSBpZClcblx0XHRcdH0sXG5cdFx0XHRvblVwZGF0ZTogKHZhbHVlKSA9PiB7XG5cdFx0XHRcdHJlbGF0aW9uc2hpcC5wZXJzb24gPSB2YWx1ZVxuXHRcdFx0XHRpZiAocmVsYXRpb25zaGlwID09PSBsYXN0VGhyb3codGhpcy5yZWxhdGlvbnNoaXBzKVswXSkgdGhpcy5yZWxhdGlvbnNoaXBzLnB1c2godGhpcy5uZXdSZWxhdGlvbnNoaXAoKSlcblx0XHRcdH0sXG5cdFx0XHRhbmltYXRlQ3JlYXRlOiAhcmVsYXRpb25zaGlwLnBlcnNvbixcblx0XHRcdGFsbG93Q2FuY2VsLFxuXHRcdFx0a2V5OiBpZCxcblx0XHRcdHR5cGVMYWJlbHMsXG5cdFx0XHRvblR5cGVTZWxlY3RlZDogKHR5cGUpID0+IHRoaXMub25UeXBlU2VsZWN0ZWQodHlwZSA9PT0gQ29udGFjdFJlbGF0aW9uc2hpcFR5cGUuQ1VTVE9NLCB0eXBlLCByZWxhdGlvbnNoaXApLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1lc3NlbmdlckhhbmRsZUVkaXRvcihpZDogSWQsIGFsbG93Q2FuY2VsOiBib29sZWFuLCBtZXNzZW5nZXJIYW5kbGU6IENvbnRhY3RNZXNzZW5nZXJIYW5kbGUpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgdHlwZUxhYmVscyA9IHR5cGVkRW50cmllcyhDb250YWN0TWVzc2VuZ2VySGFuZGxlVHlwZVRvTGFiZWwpXG5cdFx0cmV0dXJuIG0oQ29udGFjdEFnZ3JlZ2F0ZUVkaXRvciwge1xuXHRcdFx0dmFsdWU6IG1lc3NlbmdlckhhbmRsZS5oYW5kbGUsXG5cdFx0XHRmaWVsZFR5cGU6IFRleHRGaWVsZFR5cGUuVGV4dCxcblx0XHRcdGxhYmVsOiBnZXRDb250YWN0TWVzc2VuZ2VySGFuZGxlVHlwZVRvTGFiZWwoZG93bmNhc3Q8Q29udGFjdE1lc3NlbmdlckhhbmRsZVR5cGU+KG1lc3NlbmdlckhhbmRsZS50eXBlKSwgbWVzc2VuZ2VySGFuZGxlLmN1c3RvbVR5cGVOYW1lKSxcblx0XHRcdGhlbHBMYWJlbDogXCJlbXB0eVN0cmluZ19tc2dcIixcblx0XHRcdGF1dG9jYXBpdGFsaXplVGV4dEZpZWxkOiBBdXRvY2FwaXRhbGl6ZS5ub25lLFxuXHRcdFx0Y2FuY2VsQWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRcdGZpbmRBbmRSZW1vdmUodGhpcy5tZXNzZW5nZXJIYW5kbGVzLCAodCkgPT4gdFsxXSA9PT0gaWQpXG5cdFx0XHR9LFxuXHRcdFx0b25VcGRhdGU6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRtZXNzZW5nZXJIYW5kbGUuaGFuZGxlID0gdmFsdWVcblx0XHRcdFx0aWYgKG1lc3NlbmdlckhhbmRsZSA9PT0gbGFzdFRocm93KHRoaXMubWVzc2VuZ2VySGFuZGxlcylbMF0pIHRoaXMubWVzc2VuZ2VySGFuZGxlcy5wdXNoKHRoaXMubmV3TWVzc2VuZ2VySGFuZGxlcigpKVxuXHRcdFx0fSxcblx0XHRcdGFuaW1hdGVDcmVhdGU6ICFtZXNzZW5nZXJIYW5kbGUuaGFuZGxlLFxuXHRcdFx0YWxsb3dDYW5jZWwsXG5cdFx0XHRrZXk6IGlkLFxuXHRcdFx0dHlwZUxhYmVscyxcblx0XHRcdG9uVHlwZVNlbGVjdGVkOiAodHlwZSkgPT4gdGhpcy5vblR5cGVTZWxlY3RlZCh0eXBlID09PSBDb250YWN0TWVzc2VuZ2VySGFuZGxlVHlwZS5DVVNUT00sIHR5cGUsIG1lc3NlbmdlckhhbmRsZSksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyUHJvbm91bnNFZGl0b3IoaWQ6IElkLCBhbGxvd0NhbmNlbDogYm9vbGVhbiwgcHJvbm91bnM6IENvbnRhY3RQcm9ub3Vucyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB0eXBlTGFiZWxzID0gdHlwZWRFbnRyaWVzKHsgXCIwXCI6IFwibGFuZ3VhZ2VfbGFiZWxcIiB9IGFzIFJlY29yZDxzdHJpbmcsIFRyYW5zbGF0aW9uS2V5Pilcblx0XHRyZXR1cm4gbShDb250YWN0QWdncmVnYXRlRWRpdG9yLCB7XG5cdFx0XHR2YWx1ZTogcHJvbm91bnMucHJvbm91bnMsXG5cdFx0XHRmaWVsZFR5cGU6IFRleHRGaWVsZFR5cGUuVGV4dCxcblx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImxhbmdcIiwgcHJvbm91bnMubGFuZ3VhZ2UpLFxuXHRcdFx0aGVscExhYmVsOiBcImVtcHR5U3RyaW5nX21zZ1wiLFxuXHRcdFx0YXV0b2NhcGl0YWxpemVUZXh0RmllbGQ6IEF1dG9jYXBpdGFsaXplLm5vbmUsXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0ZmluZEFuZFJlbW92ZSh0aGlzLnByb25vdW5zLCAodCkgPT4gdFsxXSA9PT0gaWQpXG5cdFx0XHR9LFxuXHRcdFx0b25VcGRhdGU6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRwcm9ub3Vucy5wcm9ub3VucyA9IHZhbHVlXG5cdFx0XHRcdGlmIChwcm9ub3VucyA9PT0gbGFzdFRocm93KHRoaXMucHJvbm91bnMpWzBdKSB0aGlzLnByb25vdW5zLnB1c2godGhpcy5uZXdQcm9ub3VuKCkpXG5cdFx0XHR9LFxuXHRcdFx0YW5pbWF0ZUNyZWF0ZTogIXByb25vdW5zLnByb25vdW5zLFxuXHRcdFx0YWxsb3dDYW5jZWwsXG5cdFx0XHRrZXk6IGlkLFxuXHRcdFx0dHlwZUxhYmVscyxcblx0XHRcdG9uVHlwZVNlbGVjdGVkOiAoKSA9PiB0aGlzLm9uTGFuZ3VhZ2VTZWxlY3QocHJvbm91bnMpLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNvbW1lbnRGaWVsZCgpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oU3RhbmRhbG9uZUZpZWxkLCB7XG5cdFx0XHRsYWJlbDogXCJjb21tZW50X2xhYmVsXCIsXG5cdFx0XHR2YWx1ZTogdGhpcy5jb250YWN0LmNvbW1lbnQsXG5cdFx0XHRvbmlucHV0OiAodmFsdWUpID0+ICh0aGlzLmNvbnRhY3QuY29tbWVudCA9IHZhbHVlKSxcblx0XHRcdHR5cGU6IFRleHRGaWVsZFR5cGUuQXJlYSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJGaXJzdE5hbWVGaWVsZCgpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oU3RhbmRhbG9uZUZpZWxkLCB7XG5cdFx0XHRsYWJlbDogXCJmaXJzdE5hbWVfcGxhY2Vob2xkZXJcIixcblx0XHRcdHZhbHVlOiB0aGlzLmNvbnRhY3QuZmlyc3ROYW1lLFxuXHRcdFx0b25pbnB1dDogKHZhbHVlKSA9PiAodGhpcy5jb250YWN0LmZpcnN0TmFtZSA9IHZhbHVlKSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJGaWVsZChmaWVsZE5hbWU6IGtleW9mIENvbnRhY3QsIGxhYmVsOiBUcmFuc2xhdGlvbktleSk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShTdGFuZGFsb25lRmllbGQsIHtcblx0XHRcdGxhYmVsLFxuXHRcdFx0dmFsdWU6ICh0aGlzLmNvbnRhY3RbZmllbGROYW1lXSA/PyBcIlwiKSBhcyBzdHJpbmcsXG5cdFx0XHRvbmlucHV0OiAodmFsdWU6IHN0cmluZykgPT4ge1xuXHRcdFx0XHQvLyBUeXBlc2NyaXB0IHdpbGwgY29tcGxhaW4gYWJvdXQgaXQgYXMgYW4gVW5uZWNlc3NhcnkgdHlwZSBjaGVjaywgYnV0IHdoZW4gdGhlIGNvZGUgZ2V0c1xuXHRcdFx0XHQvLyB0cmFuc3BpbGVkIHRvIGphdmFzY3JpcHQsIHdpdGhvdXQgdGhlIGNoZWNrLCB3ZSBjYW4gcGFzcyBhbnkgdmFsdWVcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHRcdHRoaXMuY29udGFjdFtmaWVsZE5hbWVdID0gZG93bmNhc3QodmFsdWUpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0fSBzYXRpc2ZpZXMgVGV4dEZpZWxkQXR0cnMpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckxhc3ROYW1lRmllbGQoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFN0YW5kYWxvbmVGaWVsZCwge1xuXHRcdFx0bGFiZWw6IFwibGFzdE5hbWVfcGxhY2Vob2xkZXJcIixcblx0XHRcdHZhbHVlOiB0aGlzLmNvbnRhY3QubGFzdE5hbWUsXG5cdFx0XHRvbmlucHV0OiAodmFsdWUpID0+ICh0aGlzLmNvbnRhY3QubGFzdE5hbWUgPSB2YWx1ZSksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQmlydGhkYXlGaWVsZCgpOiBDaGlsZHJlbiB7XG5cdFx0bGV0IGJpcnRoZGF5SGVscFRleHQgPSAoKSA9PiB7XG5cdFx0XHRsZXQgYmRheSA9IGNyZWF0ZUJpcnRoZGF5KHtcblx0XHRcdFx0ZGF5OiBcIjIyXCIsXG5cdFx0XHRcdG1vbnRoOiBcIjlcIixcblx0XHRcdFx0eWVhcjogXCIyMDAwXCIsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHRoaXMuaGFzSW52YWxpZEJpcnRoZGF5XG5cdFx0XHRcdD8gbGFuZy5nZXQoXCJpbnZhbGlkRGF0ZUZvcm1hdF9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XCJ7MX1cIjogZm9ybWF0QmlydGhkYXlOdW1lcmljKGJkYXkpLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogXCJcIlxuXHRcdH1cblxuXHRcdHJldHVybiBtKFN0YW5kYWxvbmVGaWVsZCwge1xuXHRcdFx0bGFiZWw6IFwiYmlydGhkYXlfYWx0XCIsXG5cdFx0XHR2YWx1ZTogdGhpcy5iaXJ0aGRheSxcblx0XHRcdGhlbHBMYWJlbDogYmlydGhkYXlIZWxwVGV4dCxcblx0XHRcdG9uaW5wdXQ6ICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHR0aGlzLmJpcnRoZGF5ID0gdmFsdWVcblx0XHRcdFx0aWYgKHZhbHVlLnRyaW0oKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHR0aGlzLmNvbnRhY3QuYmlydGhkYXlJc28gPSBudWxsXG5cdFx0XHRcdFx0dGhpcy5oYXNJbnZhbGlkQmlydGhkYXkgPSBmYWxzZVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxldCBiaXJ0aGRheSA9IHBhcnNlQmlydGhkYXkodmFsdWUsIChyZWZlcmVuY2VEYXRlKSA9PiBmb3JtYXREYXRlKHJlZmVyZW5jZURhdGUpKVxuXG5cdFx0XHRcdFx0aWYgKGJpcnRoZGF5KSB7XG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmNvbnRhY3QuYmlydGhkYXlJc28gPSBiaXJ0aGRheVRvSXNvRGF0ZShiaXJ0aGRheSlcblx0XHRcdFx0XHRcdFx0dGhpcy5oYXNJbnZhbGlkQmlydGhkYXkgPSBmYWxzZVxuXHRcdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmhhc0ludmFsaWRCaXJ0aGRheSA9IHRydWVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5oYXNJbnZhbGlkQmlydGhkYXkgPSB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNvbXBhbnlGaWVsZCgpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oU3RhbmRhbG9uZUZpZWxkLCB7XG5cdFx0XHRsYWJlbDogXCJjb21wYW55X2xhYmVsXCIsXG5cdFx0XHR2YWx1ZTogdGhpcy5jb250YWN0LmNvbXBhbnksXG5cdFx0XHRvbmlucHV0OiAodmFsdWUpID0+ICh0aGlzLmNvbnRhY3QuY29tcGFueSA9IHZhbHVlKSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJSb2xlRmllbGQoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFN0YW5kYWxvbmVGaWVsZCwge1xuXHRcdFx0bGFiZWw6IFwicm9sZV9wbGFjZWhvbGRlclwiLFxuXHRcdFx0dmFsdWU6IHRoaXMuY29udGFjdC5yb2xlLFxuXHRcdFx0b25pbnB1dDogKHZhbHVlKSA9PiAodGhpcy5jb250YWN0LnJvbGUgPSB2YWx1ZSksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyVGl0bGVGaWVsZCgpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oU3RhbmRhbG9uZUZpZWxkLCB7XG5cdFx0XHRsYWJlbDogXCJ0aXRsZV9wbGFjZWhvbGRlclwiLFxuXHRcdFx0dmFsdWU6IHRoaXMuY29udGFjdC50aXRsZSB8fCBcIlwiLFxuXHRcdFx0b25pbnB1dDogKHZhbHVlKSA9PiAodGhpcy5jb250YWN0LnRpdGxlID0gdmFsdWUpLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclByZXNoYXJlZFBhc3N3b3JkRmllbGQoKTogQ2hpbGRyZW4ge1xuXHRcdGlmICghdGhpcy5pc05ld0NvbnRhY3QgJiYgIXRoaXMuY29udGFjdC5wcmVzaGFyZWRQYXNzd29yZCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRyZXR1cm4gbShcIi53cmFwcGluZy1yb3dcIiwgW1xuXHRcdFx0bShcIi5wYXNzd29yZHMubXQteGxcIiwgW1xuXHRcdFx0XHRtKFwiLmg0XCIsIGxhbmcuZ2V0KFwicHJlc2hhcmVkUGFzc3dvcmRfbGFiZWxcIikpLFxuXHRcdFx0XHRtKFBhc3N3b3JkRmllbGQsIHtcblx0XHRcdFx0XHR2YWx1ZTogdGhpcy5jb250YWN0LnByZXNoYXJlZFBhc3N3b3JkID8/IFwiXCIsXG5cdFx0XHRcdFx0YXV0b2NvbXBsZXRlQXM6IEF1dG9jb21wbGV0ZS5uZXdQYXNzd29yZCxcblx0XHRcdFx0XHRvbmlucHV0OiAodmFsdWUpID0+ICh0aGlzLmNvbnRhY3QucHJlc2hhcmVkUGFzc3dvcmQgPSB2YWx1ZSksXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSksXG5cdFx0XHRtKFwiLnNwYWNlclwiKSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVDbG9zZUJ1dHRvbkF0dHJzKCk6IEJ1dHRvbkF0dHJzIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bGFiZWw6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRjbGljazogKCkgPT4gdGhpcy5jbG9zZSgpLFxuXHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBuZXdQaG9uZU51bWJlcigpOiBbQ29udGFjdFBob25lTnVtYmVyLCBJZF0ge1xuXHRcdGNvbnN0IHBob25lTnVtYmVyID0gY3JlYXRlQ29udGFjdFBob25lTnVtYmVyKHtcblx0XHRcdHR5cGU6IENvbnRhY3RQaG9uZU51bWJlclR5cGUuTU9CSUxFLFxuXHRcdFx0Y3VzdG9tVHlwZU5hbWU6IFwiXCIsXG5cdFx0XHRudW1iZXI6IFwiXCIsXG5cdFx0fSlcblx0XHRyZXR1cm4gW3Bob25lTnVtYmVyLCB0aGlzLm5ld0lkKCldXG5cdH1cblxuXHRwcml2YXRlIG5ld01haWxBZGRyZXNzKCk6IFtDb250YWN0TWFpbEFkZHJlc3MsIElkXSB7XG5cdFx0Y29uc3QgbWFpbEFkZHJlc3MgPSBjcmVhdGVDb250YWN0TWFpbEFkZHJlc3Moe1xuXHRcdFx0dHlwZTogQ29udGFjdEFkZHJlc3NUeXBlLldPUkssXG5cdFx0XHRjdXN0b21UeXBlTmFtZTogXCJcIixcblx0XHRcdGFkZHJlc3M6IFwiXCIsXG5cdFx0fSlcblx0XHRyZXR1cm4gW21haWxBZGRyZXNzLCB0aGlzLm5ld0lkKCldXG5cdH1cblxuXHRwcml2YXRlIG5ld0FkZHJlc3MoKTogW0NvbnRhY3RBZGRyZXNzLCBJZF0ge1xuXHRcdGNvbnN0IGFkZHJlc3MgPSBjcmVhdGVDb250YWN0QWRkcmVzcyh7XG5cdFx0XHR0eXBlOiBDb250YWN0QWRkcmVzc1R5cGUuV09SSyxcblx0XHRcdGN1c3RvbVR5cGVOYW1lOiBcIlwiLFxuXHRcdFx0YWRkcmVzczogXCJcIixcblx0XHR9KVxuXHRcdHJldHVybiBbYWRkcmVzcywgdGhpcy5uZXdJZCgpXVxuXHR9XG5cblx0cHJpdmF0ZSBuZXdTb2NpYWxJZCgpOiBbQ29udGFjdFNvY2lhbElkLCBJZF0ge1xuXHRcdGNvbnN0IHNvY2lhbElkID0gY3JlYXRlQ29udGFjdFNvY2lhbElkKHtcblx0XHRcdHR5cGU6IENvbnRhY3RTb2NpYWxUeXBlLlRXSVRURVIsXG5cdFx0XHRjdXN0b21UeXBlTmFtZTogXCJcIixcblx0XHRcdHNvY2lhbElkOiBcIlwiLFxuXHRcdH0pXG5cdFx0cmV0dXJuIFtzb2NpYWxJZCwgdGhpcy5uZXdJZCgpXVxuXHR9XG5cblx0cHJpdmF0ZSBuZXdSZWxhdGlvbnNoaXAoKTogW0NvbnRhY3RSZWxhdGlvbnNoaXAsIElkXSB7XG5cdFx0Y29uc3QgcmVsYXRpb25zaGlwID0gY3JlYXRlQ29udGFjdFJlbGF0aW9uc2hpcCh7XG5cdFx0XHRwZXJzb246IFwiXCIsXG5cdFx0XHR0eXBlOiBDb250YWN0UmVsYXRpb25zaGlwVHlwZS5BU1NJU1RBTlQsXG5cdFx0XHRjdXN0b21UeXBlTmFtZTogXCJcIixcblx0XHR9KVxuXHRcdHJldHVybiBbcmVsYXRpb25zaGlwLCB0aGlzLm5ld0lkKCldXG5cdH1cblxuXHRwcml2YXRlIG5ld01lc3NlbmdlckhhbmRsZXIoKTogW0NvbnRhY3RNZXNzZW5nZXJIYW5kbGUsIElkXSB7XG5cdFx0Y29uc3QgbWVzc2VuZ2VySGFuZGxlciA9IGNyZWF0ZUNvbnRhY3RNZXNzZW5nZXJIYW5kbGUoe1xuXHRcdFx0aGFuZGxlOiBcIlwiLFxuXHRcdFx0dHlwZTogQ29udGFjdE1lc3NlbmdlckhhbmRsZVR5cGUuU0lHTkFMLFxuXHRcdFx0Y3VzdG9tVHlwZU5hbWU6IFwiXCIsXG5cdFx0fSlcblx0XHRyZXR1cm4gW21lc3NlbmdlckhhbmRsZXIsIHRoaXMubmV3SWQoKV1cblx0fVxuXG5cdHByaXZhdGUgbmV3UHJvbm91bigpOiBbQ29udGFjdFByb25vdW5zLCBJZF0ge1xuXHRcdGNvbnN0IGNvbnRhY3RQcm9ub3VucyA9IGNyZWF0ZUNvbnRhY3RQcm9ub3Vucyh7XG5cdFx0XHRsYW5ndWFnZTogXCJcIixcblx0XHRcdHByb25vdW5zOiBcIlwiLFxuXHRcdH0pXG5cdFx0cmV0dXJuIFtjb250YWN0UHJvbm91bnMsIHRoaXMubmV3SWQoKV1cblx0fVxuXG5cdHByaXZhdGUgbmV3Q3VzdG9tRGF0ZSgpOiBbQ29tcGxldGVDdXN0b21EYXRlLCBJZF0ge1xuXHRcdGNvbnN0IGNvbnRhY3REYXRlID0gY3JlYXRlQ29udGFjdEN1c3RvbURhdGUoe1xuXHRcdFx0ZGF0ZUlzbzogXCJcIixcblx0XHRcdHR5cGU6IENvbnRhY3RDdXN0b21EYXRlVHlwZS5BTk5JVkVSU0FSWSxcblx0XHRcdGN1c3RvbVR5cGVOYW1lOiBcIlwiLFxuXHRcdH0pXG5cdFx0cmV0dXJuIFt7IC4uLmNvbnRhY3REYXRlLCBkYXRlOiBcIlwiLCBpc1ZhbGlkOiB0cnVlIH0sIHRoaXMubmV3SWQoKV1cblx0fVxuXG5cdHByaXZhdGUgbmV3V2Vic2l0ZSgpOiBbQ29udGFjdFdlYnNpdGUsIElkXSB7XG5cdFx0Y29uc3Qgd2Vic2l0ZSA9IGNyZWF0ZUNvbnRhY3RXZWJzaXRlKHtcblx0XHRcdHR5cGU6IENvbnRhY3RXZWJzaXRlVHlwZS5QUklWQVRFLFxuXHRcdFx0dXJsOiBcIlwiLFxuXHRcdFx0Y3VzdG9tVHlwZU5hbWU6IFwiXCIsXG5cdFx0fSlcblx0XHRyZXR1cm4gW3dlYnNpdGUsIHRoaXMubmV3SWQoKV1cblx0fVxuXG5cdHByaXZhdGUgbmV3SWQoKTogSWQge1xuXHRcdHJldHVybiB0aW1lc3RhbXBUb0dlbmVyYXRlZElkKERhdGUubm93KCkpXG5cdH1cblxuXHRwcml2YXRlIG9uVHlwZVNlbGVjdGVkPFxuXHRcdEssXG5cdFx0VCBleHRlbmRzIHtcblx0XHRcdHR5cGU6IEtcblx0XHRcdGN1c3RvbVR5cGVOYW1lOiBzdHJpbmdcblx0XHR9LFxuXHQ+KGlzQ3VzdG9tOiBib29sZWFuLCBrZXk6IEssIGFnZ3JlZ2F0ZTogVCk6IHZvaWQge1xuXHRcdGlmIChpc0N1c3RvbSkge1xuXHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdERpYWxvZy5zaG93VGV4dElucHV0RGlhbG9nKHtcblx0XHRcdFx0XHR0aXRsZTogXCJjdXN0b21MYWJlbF9sYWJlbFwiLFxuXHRcdFx0XHRcdGxhYmVsOiBcImN1c3RvbUxhYmVsX2xhYmVsXCIsXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBhZ2dyZWdhdGUuY3VzdG9tVHlwZU5hbWUsXG5cdFx0XHRcdH0pLnRoZW4oKG5hbWUpID0+IHtcblx0XHRcdFx0XHRhZ2dyZWdhdGUuY3VzdG9tVHlwZU5hbWUgPSBuYW1lXG5cdFx0XHRcdFx0YWdncmVnYXRlLnR5cGUgPSBrZXlcblx0XHRcdFx0fSlcblx0XHRcdH0sIERlZmF1bHRBbmltYXRpb25UaW1lKSAvLyB3YWl0IHRpbGwgdGhlIGRyb3Bkb3duIGlzIGhpZGRlblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRhZ2dyZWdhdGUudHlwZSA9IGtleVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgb25MYW5ndWFnZVNlbGVjdChwcm9ub3VuczogQ29udGFjdFByb25vdW5zKTogdm9pZCB7XG5cdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHREaWFsb2cuc2hvd1RleHRJbnB1dERpYWxvZyh7XG5cdFx0XHRcdHRpdGxlOiBcImxhbmd1YWdlX2xhYmVsXCIsXG5cdFx0XHRcdGxhYmVsOiBcImxhbmd1YWdlX2xhYmVsXCIsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogcHJvbm91bnMubGFuZ3VhZ2UubGVuZ3RoID4gMCA/IHByb25vdW5zLmxhbmd1YWdlIDogXCJcIixcblx0XHRcdH0pLnRoZW4oKG5hbWUpID0+IHtcblx0XHRcdFx0cHJvbm91bnMubGFuZ3VhZ2UgPSBuYW1lXG5cdFx0XHR9KVxuXHRcdH0sIERlZmF1bHRBbmltYXRpb25UaW1lKSAvLyB3YWl0IHRpbGwgdGhlIGRyb3Bkb3duIGlzIGhpZGRlblxuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVEaWFsb2coKTogRGlhbG9nIHtcblx0XHRjb25zdCBoZWFkZXJCYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMgPSB7XG5cdFx0XHRsZWZ0OiBbdGhpcy5jcmVhdGVDbG9zZUJ1dHRvbkF0dHJzKCldLFxuXHRcdFx0bWlkZGxlOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcIm5hbWVcIiwgdGhpcy5jb250YWN0LmZpcnN0TmFtZSArIFwiIFwiICsgdGhpcy5jb250YWN0Lmxhc3ROYW1lKSxcblx0XHRcdHJpZ2h0OiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsYWJlbDogXCJzYXZlX2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLnZhbGlkYXRlQW5kU2F2ZSgpLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fVxuXHRcdHJldHVybiBEaWFsb2cubGFyZ2VEaWFsb2coaGVhZGVyQmFyQXR0cnMsIHRoaXMpXG5cdFx0XHQuYWRkU2hvcnRjdXQoe1xuXHRcdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB0aGlzLmNsb3NlKCksXG5cdFx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHR9KVxuXHRcdFx0LmFkZFNob3J0Y3V0KHtcblx0XHRcdFx0a2V5OiBLZXlzLlMsXG5cdFx0XHRcdGN0cmxPckNtZDogdHJ1ZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdC8vIG5vaW5zcGVjdGlvbiBKU0lnbm9yZWRQcm9taXNlRnJvbUNhbGxcblx0XHRcdFx0XHR0aGlzLnZhbGlkYXRlQW5kU2F2ZSgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwic2F2ZV9hY3Rpb25cIixcblx0XHRcdH0pXG5cdFx0XHQuc2V0Q2xvc2VIYW5kbGVyKCgpID0+IHRoaXMuY2xvc2UoKSlcblx0fVxufVxuXG4vKiogUmVuZGVycyBUZXh0RmllbGQgd2l0aCB3cmFwcGVyIGFuZCBwYWRkaW5nIGVsZW1lbnQgdG8gYWxpZ24gdGhlbSBhbGwuICovXG5jbGFzcyBTdGFuZGFsb25lRmllbGQgaW1wbGVtZW50cyBDb21wb25lbnQ8VGV4dEZpZWxkQXR0cnM+IHtcblx0dmlldyh7IGF0dHJzIH06IFZub2RlPFRleHRGaWVsZEF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmNoaWxkLWdyb3dcIiwgW20oVGV4dEZpZWxkLCBhdHRycyksIG0oXCIuaWNvbi1idXR0b25cIildKVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBMEJhLHlCQUFOLE1BQTZFO0NBQ25GLFNBQVNBLE9BQTRDO0VBQ3BELE1BQU0saUJBQWlCLE1BQU0sTUFBTSxrQkFBa0IsWUFBWSxNQUFNLE1BQU0sZ0JBQWdCO0FBQzdGLE1BQUksUUFBUyxNQUFLLFFB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