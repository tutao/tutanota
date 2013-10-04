"use strict";

goog.provide('tutao.tutanota.ctrl.LanguageViewModel');

/**
 * Provides all localizations of strings on our gui.
 * @constructor
 */
tutao.tutanota.ctrl.LanguageViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	var lang = tutao.tutanota.util.LocalStore.load('language');
	if (!lang) {
		lang = tutao.tutanota.util.ClientDetector.getDefaultLanguage();
	}
	this._current = ko.observable(lang);
};

/**
 * Provides the current language, one of "en" and "de"
 * @return {string} The current language.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.getCurrentLanguage = function() {
	return this._current();
};

/**
 * Sets the current language.
 * @param {string} lang The language to set, one of "en" and "de".
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.setCurrentLanguage = function(lang) {
	if (lang != "en" && lang != "de") {
		throw new Error("invalid language: " + lang);
	}
	tutao.tutanota.util.LocalStore.store('language', lang);
	this._current(lang);
};

/**
 * Provides the text with the given id and the given params in the currently selected language.
 * @param {string} id One of the ids defined in tutao.tutanota.ctrl.LanguageViewModel.en or tutao.tutanota.ctrl.LanguageViewModel.de.
 * @param {Object<String,String>} params An object whose property keys are the strings that shall be replaced by the corresponding property value in the text.
 * @return {string} The text.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.get = function(id, params) {
	if (id == null) {
		return "";
	}
	var text = tutao.tutanota.ctrl.LanguageViewModel[this._current()][id];
	if (!text) {
		throw new Error("no translation found for id " + id);
	}
	if (params instanceof Object) {
		for (var param in params) {
			text = text.replace(param, params[param]);
		}
	}
	return text;
};

/**
 * Defines the english translations of all texts in Tutanota.
 * The actual identifier is in camel case and the type is appended by an underscore.
 * Types: label, action, msg, title, alt, placeholder
 */
tutao.tutanota.ctrl.LanguageViewModel.en = {
	// mail
	deleteMail_msg:	"Delete new email without saving?",
	tooBigAttachment_msg: "The following files could not be attached because their size exceeds 25 MB: ",
	received_action: "Received",
	receivedMail_alt: "Received email",
	receivedMails_alt: "Received emails",
	sent_action: "Sent",
	sentMail_alt: "Sent email",
	sentMails_alt: "Sent emails",
	trash_action: "Trash",
	trashedMail_alt: "Trashed email",
	trashedMails_alt: "Trashed emails",
	mailWithAttachment_alt: "Email with attachment",
	meNominative_label: "Me",
	meDativ_label: "Me",
	meAccusative_label: "Me",
	from_label: "from:",
	to_label: "to:",
	cc_label: "CC:",
	bcc_label: "BCC:",
	ccBcc_label: "B/CC:",
	closedLock_alt: 'Closed lock',
	openedLock_alt: 'Open lock',
	attachFiles_action: "attach files",
	removeAttachment_alt: "Remove attachment",
	contactDataForSms_label: "Password transmission to external recipients",
	atLeastOneMobileNumber_label: "At least one german mobile number or a pre-shared password per recipient is needed",
	secureMail_title: 'Email is encrypted for external recipients.',
	unsecureMail_title: 'Email is not encrypted for external recipients.',
	noRecipients_msg: 'Please provide recipients for your email.',
	invalidRecipients_msg: 'Please correct the invalid email addresses\n in the recipients fields.',
	noSubject_msg: 'Please provide a subject for your email.',
	noPasswordChannels_msg: 'Please provide password channels for all external recipients.',
	invalidPasswordChannels_msg: 'Please check the password channels again for invalid phone numbers.',
	maxSizeExceeded_msg: "The maximum message size of $ to unsecure external recipients is exceeded.",
	send_action: "send",
	reply_action: "reply",
	replyAll_action: "reply all",
	forward_action: "forward",
	replyConfidential_action: "reply confidentially",
	subject_placeholder: "Subject",
	by_label: "by",
	date_label: "Date:",
	subject_label: "Subject:",
	showQuotation_action: "+ quotes",
	hideQuotation_action: "- quotes",
	legacyNoReply_msg: "This Internet Explorer is an old version and does not support replying to your received email. Please update or use one of the following browsers:",
	clickToSave_label: "click to save",
	confidential_action: "confidential",
	nonConfidential_action: "not confidential",
	noMails_msg: "There are no emails in this list.",
	noMail_msg: "No email selected.",
	newMailInfo_msg: "Click on this icon in the menu bar above to write a new email:",
	addMobileNumber_msg: "Add additional mobile phone number",
	setPresharedPassword_action: "Set pre-shared password",
	presharedPassword_label: "pre-shared password",
	mobileNumberNotValid_msg: "Invalid format",
	fromAddressBook_label: "From address book: ",
	presharedPasswordNotStrongEnough_msg: "One or more pre-shared passwords are not secure enough. Send the email anyway?",

	// contact
	discardContact_msg: "Discard new contact?",
	discardContactChanges_msg: "Discard contact modifications?",
	discardContactChangesFor_msg: "Discard contact modifications for $?",
	deleteContact_msg: "Are you sure to delete the contact?",
	private_label: "private",
	mobile_label: "mobile",
	fax_label: "fax",
	work_label: "work",
	other_label: "other",
	custom_label: "custom",
	twitter_label: "twitter",
	facebook_label: "facebook",
	xing_label: "xing",
	linkedin_label: "linked in",
	email_label: "Email:",
	phone_label: "Phone:",
	address_label: "Address:",
	social_label: "Social:",
	comment_label: "Comment:",
	birthday_alt: "Birthday",
	contactImage_alt: "Photo of this contact",
	removePhoneNumber_alt: "Remove phone number",
	removeMailAddress_alt: "Delete this email address",
	removeAddress_alt: "Delete this address",
	removeSocial_alt: "Delete this social id",
	sendMail_alt: "Send email to this address",
	callNumber_alt: "Call this number",
	showAddress_alt: "Show this address in google maps",
	openSocial_alt: "Open this social account",
	firstName_placeholder: "first name",
	lastName_placeholder: "last name",
	birthdayWithFormat_placeholder: "birthday (dd.mm.yyyy)",
	company_placeholder: "company",
	title_placeholder: "title",
	noContacts_msg: "There are no contacts in this list.",
	noContact_msg: "No contact selected.",
	newContactInfo_msg: "Click on this icon in the menu bar above to create a new contact:",
	passwordsHeading_label: "Passwords:",
	presharedPasswordHeading_label: "Pre-shared:",
	autoTransmitPasswordHeading_label: "SMS:",
	showPassword_alt: "Keep button pressed to show the password.",
	
	// settings
	accountSettings_action: "account",
	securitySettings_action: "security",
	changePasswordSettings_action: "change password",
	
	// account settings
	accountType_label: "account type",
	mailAddress_label: "email address",
	mailName_label: "email name",
	mailNameInfo_msg: "This name is shown to recipients of your emails.",
	
	// security settings
	lastSuccessfulLogin_label: "last successful login",
	lastSuccessfulLoginInfo_msg: "The time of your last successful login before the current one.",
	failedLogins_label: "failed logins",
	failedLoginsInfo_msg: "The number of failed login attempts since your last successful login.",
	
	// change password
	passwordValid_msg: "Password ok",
	oldPassword_label: "old password",
	oldPasswordNeutral_msg: "Please enter old password",
	oldPasswordInvalid_msg: "Incorrect password",
	newPassword_label: "new password",
	securePasswords_link: "https://en.wikipedia.org/wiki/Password_strength#Guidelines_for_strong_passwords",
	password1Neutral_msg: "Please enter new password",
	password1InvalidSame_msg: "New password is same as old",
	password1InvalidUnsecure_msg: "New password not secure enough",
	password2Neutral_msg: "Please confirm your password here",
	password2Invalid_msg: "Confirmed password is different",
	verificationCode_msg: "You will receive the verification code via SMS.",
	code_label: "verification code",
	pwChangeNeutral_msg: "You will receive a verification code via SMS to $.",
	pwChangeNeutralSendingCode_msg: "Code is sent...",
	pwChangeValid_msg: "Password was changed.",
	pwChangeInvalidServerNotAvailable_msg: "Could not reach server. Password has not been changed. Please try again later.",
	pwChangeInvalidTooManyVerifyAttempts_msg: "Number of allowed attempts exceeded. Please try again later.",
	pwChangeInvalidTooManyChangeAttempts_msg: "Your password was changed too often. Please try again later.",
	pwChangeButtonSendCode_action: "Send code",
	pwChangeButtonChangePw_action: "Change password",
	serverNotReachable_msg: "Could not reach server. Please try again later.",

	// general
	emptyString_msg: "\u2008", // an empty string or normal whitespace makes a label collapse, so enter this invisible character
	save_action: "save",
	cancel_action: "cancel",
	edit_action: "edit",
	delete_action: "delete",
	undelete_action: "undelete",
	print_action: "print",
	back_action: "back",
	monthNames_label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	busy_alt: "Busy",
	close_alt: "close",
	german_alt: "deutsch",
	english_alt: "english",
	check_msg: "Checking...",
	
	// code verification
	codeNeutralEnterCode_msg: "Please enter the verification code.",
	codeValid_msg: "Code format ok",
	codeInvalid_msg: "Incorrect code. Please check again.",

	// external login
	invalidLink_msg: "Sorry, this link is not valid.",
	smsError_msg: "Could not send SMS.",
	smsSent_msg: "The SMS should arrive in not more than 60s.",
	smsResent_msg: "If no SMS has been arrived you may resend it now.",
	smsSentOften_msg: "Too many sent SMS. Please ask the sender of the message to resend it.",
	invalidPassword_msg: "Invalid password. Please check it again.",
	showMail_action: "show email",
	chooseNumber_msg: "Please choose a phone number. The password for the email will be sent to that number (maximum of three SMS):",
	sendPasswordTo_action: "Send password to: ",
	storePassword_action: "Store password in browser",
	enterPresharedPassword_msg: "Please enter the password which you have agreed upon with the sender.",
	sendingSms_msg: "Sending SMS...",
	onlyPrivateComputer_msg: "Only choose this option if you are using a private computer.",
	loadingMail_msg: "Loading email...",
	enterPassword_msg: "Please enter the password here.",

	// login
	welcome_msg: "Welcome to Tutanota",
	afterRegistration_msg: "Congratulations and welcome aboard! You are now a member of the Tutanota family. Login - and enjoy!",
	loginFailedOften_msg: "Too many failed login attempts. Please try again later.",
	loginFailed_msg: "Invalid login credentials. Please try again.",
	login_action: "log in",
	emailAddress_placeholder: "email address",

	// header
	logo_alt: "Tutanota logo",
	letter_alt: "letter",
	forUser_label: "for $",
	featureNotAvailable_msg: "This feature will be available in 2014!",
	new_label: "New",
	emails_label: "Emails",
	emails_alt: "Emails",
	newMail_alt: "New Email",
	contacts_label: "Contacts",
	contacts_alt: "Contacts",
	newContact_alt: "New Contact",
	newFolder_alt: "New Folder",
	files_alt: "Files",
	files_label: "Files",
	calendar_label: "Calendar",
	calendar_alt: "Calendar",
	tasks_label: "Tasks",
	tasks_alt: "Tasks",
	feedback_label: "Feedback",
	feedback_alt: "Feedback",
	logout_label: "Logout",
	logout_alt: "Logout",
	settings_label: "Settings",
	settings_alt: "Settings",

	// not supported
	for_label: "for",
	oldBrowser_msg: "Oh! We are sorry. Unfortunately, you are using an outdated browser with severe security breaches. Please upgrade to the latest version of one of the following browsers:",
	unsupportedBrowser_msg: "Oh! We are sorry. Unfortunately, you are using an unsupported browser. Please upgrade to the latest version of one of the following browsers:",
	browserNoKeygen_msg: "Dear Tutanota prospect, during the registration process secure keys are generated. Unfortunately the key generation needs more performance than your currently used browser or device may provide. Please use one of the following browsers on a desktop or laptop computer:",
	thanks_msg: "Thank you for your cooperation.\nYour team from Tutanota",
	claim_label: "Tutanota - mail. done. right.",

	// registration
	registration1Headline_msg: "Registration (step 1 of 2)",
	registration2Headline_msg: "Registration (step 2 of 2)",
	company_label: "Company",
	invoiceAddress_label: "Invoice address",
	domain_label: "Domain",
	companyNameNeutral_msg: "Please enter company name",
	companyNameValid_msg: "Company name ok",
	verifyingCode_msg: "Verifying code. Please wait.",
	sendingSms_alt: "Sending SMS. Please wait.",
	creatingAccount_alt: "Creating account. Please wait.",
	loginNameInfo_msg: "Optional: email recipients may identify you by this name.",
	mobileNumberInfo_msg: "Your mobile phone number is needed to authorize you when you want to change your passphrase.",
	mobileNumberNeutral_msg: "Please enter mobile phone number",
	mobileNumberValid_msg: "Mobile phone number ok",
	mobileNumberInvalid_msg: "Mobile phone number is not valid",
	mailAddressInfo_msg: "This will be your new tutanota.de email address. Register with a unique name. First come, first serve. At least four letters required.",
	mailAddressNeutral_msg: "Please enter mail address",
	mailAddressInvalid_msg: "Mail address is not valid",
	mailAddressAvailable_msg: "Mail address is available",
	mailAddressNA_msg: "Mail address is not available",
	mailAddressBusy_msg: "Verifying mail address...",
		pwStrength_title: "This shows the security level of your entered passphrase.",
	goodPassphrase_action: "How to find a good passphrase?",
	termsAndConditions_action: "terms & conditions",
	join_action: "join",
	joinNeutral_msg: "Join to receive your personal verification code via SMS verifying your mobile number.",
	joinRunning_msg: "An SMS is sent...",
	joinFailure_msg: "Sorry, we could not send the SMS. Please try again later.",
	codeInputInfo_msg: "The code was sent to $",
	change_action: "ändern",
	createAccount_action: "create account",
	createAccountRunning_msg: "Account is being created...",
	createAccountTooManyAttempts_msg: "Too many wrong attemptCodeIns. Please try again later.",
	createAccountError_msg: "Sorry, but there was an error. Please try again later.",
	createAccountInfo_msg: "Depending on your computer's individual performance it may take some minutes to generate your secure keys.",
	acceptConditions_label: "Accept",
	name_label: "name",
	mobileNumber_label: "mobile phone number",
	desiredAddress_label: "desired email address",
	password_label: 'password',
	repeatedPassword_label: 'repeat password',
	registrationCodeInput_label: "verification code",
	progress_msg: "Progress",
	terms_label: "Terms & conditions",
	termsAcceptedNeutral_msg: "Please accept the terms & conditions",

	// feedback
	screenshot_msg: "A screenshot will be sent along with your message to us!",
	sendFeedbackFailed_msg: "Sorry, sending feedback failed. Please try again later.",
};

tutao.tutanota.ctrl.LanguageViewModel.de = {
	// mail
	deleteMail_msg:	"Neue E-Mail verwerfen ohne zu speichern?",
	tooBigAttachment_msg: "Die folgenden Dateien konnten nicht angehängt werden, da sie größer als 25 MB sind: ",
	received_action: "Empfangen",
	receivedMail_alt: "Empfangene E-Mail",
	receivedMails_alt: "Empfangene E-Mails",
	sent_action: "Gesendet",
	sentMail_alt: "Gesendete E-Mail",
	sentMails_alt: "Gesendete E-Mails",
	trash_action: "Gelöscht",
	trashedMail_alt: "Gelöschte E-Mail",
	trashedMails_alt: "Gelöschte E-Mails",
	mailWithAttachment_alt: "E-Mail mit Anhang",
	meNominative_label: "Ich",
	meDativ_label: "Mir",
	meAccusative_label: "Mich",
	from_label: "Von:",
	to_label: "An:",
	cc_label: "CC:",
	bcc_label: "BCC:",
	ccBcc_label: "B/CC:",
	closedLock_alt: 'geschlossenes Schloss',
	openedLock_alt: 'offenes Schloss',
	attachFiles_action: "Dateien anhängen",
	removeAttachment_alt: "Anhang entfernen",
	contactDataForSms_label: "Passwortübertragung an externe Empfänger",
	atLeastOneMobileNumber_label: "Mindestens eine deutsche Mobilfunknummer oder ein zuvor vereinbartes Passwort wird pro Empfänger benötigt",
	secureMail_title: 'Die E-Mail wird für alle externen Empfänger verschlüsselt.',
	unsecureMail_title: 'Die E-Mail wird unverschlüsselt an externe Empfänger gesendet.',
	noRecipients_msg: 'Sie müssen mindestens einen Empfänger angeben.',
	invalidRecipients_msg: 'Bitte korrigieren Sie die ungültigen E-Mail-Adressen der Empfänger.',
	noSubject_msg: 'Bitte geben Sie einen Betreff für die E-Mail an.',
	noPasswordChannels_msg: 'Bitte geben Sie eine Mobilfunknummer für jeden externen Empfänger an.',
	invalidPasswordChannels_msg: 'Bitte überprüfen Sie die Mobilfunknummern auf Gültigkeit.',
	maxSizeExceeded_msg: "Die maximale Größe von $ für unsichere Nachrichten an externe Empfänger wurde überschritten.",
	send_action: "Absenden",
	reply_action: "Antworten",
	replyAll_action: "Allen antworten",
	forward_action: "Weiterleiten",
	replyConfidential_action: "Vertraulich antworten",
	subject_placeholder: "Betreff",
	by_label: "von",
	date_label: "Datum:",
	subject_label: "Betreff:",
	showQuotation_action: "+ Details",
	hideQuotation_action: "- Details",
	legacyNoReply_msg: "Dies ist eine alte Version des Internet Explorer und unterstützt nicht das Antworten auf Ihre empfangene E-Mail. Bitte aktualisieren Sie den Browser oder verwenden einen der folgenden:",
	clickToSave_label: "klicken zum speichern",
	confidential_action: "vertraulich",
	nonConfidential_action: "nicht vertraulich",
	noMails_msg: "Keine E-Mails in dieser Liste.",
	noMail_msg: "Keine E-Mail ausgewählt.",
	newMailInfo_msg: "Klicken Sie auf dieses Symbon in dem obigen Menü, um eine neue E-Mail zu schreiben:",
	addMobileNumber_msg: "Zusätzliche Mobilfunknummer eingeben",
	setPresharedPassword_action: "Vereinbartes Passwort setzen",
	presharedPassword_label: "vereinbartes Passwort",
	mobileNumberNotValid_msg: "Format ist nicht gültig",
	fromAddressBook_label: "Aus Adressbuch: ",
	presharedPasswordNotStrongEnough_msg: "Ein oder mehrere vereinbarte Passwörter sind nicht sicher genug. Wollen Sie die E-Mail trotzdem senden?",

	// contact
	discardContact_msg: "Neuen Kontakt verwerfen?",
	discardContactChanges_msg: "Änderungen an Kontakt verwerfen?",
	discardContactChangesFor_msg: "Änderungen an Kontakt \"$\" verwerfen?",
	deleteContact_msg: "Möchten Sie den Kontakt tatsächlich löschen?",
	private_label: "privat",
	mobile_label: "mobil",
	fax_label: "Fax",
	work_label: "Arbeit",
	other_label: "anderes",
	custom_label: "eigenes",
	twitter_label: "Twitter",
	facebook_label: "Facebook",
	xing_label: "Xing",
	linkedin_label: "Linked in",
	email_label: "E-Mail:",
	phone_label: "Telefon:",
	address_label: "Addresse:",
	social_label: "Soziale Netzwerke:",
	comment_label: "Kommentar:",
	birthday_alt: "Geburtstag",
	contactImage_alt: "Foto dieses Kontakts",
	removePhoneNumber_alt: "Telefonnummer löschen",
	removeMailAddress_alt: "E-Mail-Adresse löschen",
	removeAddress_alt: "Adresse löschen",
	removeSocial_alt: "Link auf dieses Profil löschen",
	sendMail_alt: "E-Mail an diese Adresse senden",
	callNumber_alt: "Diese Telefonnummer anrufen",
	showAddress_alt: "Diese Adresse in Google Maps anzeigen",
	openSocial_alt: "Profil des Nutzers öffnen",
	firstName_placeholder: "Vorname",
	lastName_placeholder: "Nachnahme",
	birthdayWithFormat_placeholder: "Geburtstag (dd.mm.yyyy)",
	company_placeholder: "Firma",
	title_placeholder: "Titel",
	noContacts_msg: "Keine Kontakte in der Liste.",
	noContact_msg: "Kein Kontakt ausgewählt.",
	newContactInfo_msg: "Klicken Sie auf dieses Symbol in dem obigen Menü, um einen neuen Kontakt anzulegen:",
	passwordsHeading_label: "E-Mail-Passwörter:",
	presharedPasswordHeading_label: "Vereinbart:",
	autoTransmitPasswordHeading_label: "SMS:",
	showPassword_alt: "Button gedrückt halten, um das Passwort anzuzeigen.",
	
	// settings
	accountSettings_action: "Account",
	securitySettings_action: "Sicherheit",
	changePasswordSettings_action: "Passwort ändern",
	
	// account settings
	accountType_label: "Account-Typ",
	mailAddress_label: "E-Mail-Adresse",
	mailName_label: "E-Mail-Name",
	mailNameInfo_msg: "Dieser Name wird Empfängern Ihrer E-Mails angezeigt.",
	
	// security settings
	lastSuccessfulLogin_label: "Letzter erfolgreicher Login",
	lastSuccessfulLoginInfo_msg: "Der Zeitpunkt des letzten erfolgreichen Logins vor dem aktuellen Login.",
	failedLogins_label: "Fehlgeschlagene Logins",
	failedLoginsInfo_msg: "Die Anzahl fehlgeschlagener Login-Versuche seit dem letzten erfolgreichen Login.",
	
	// change password
	passwordValid_msg: "Passwort ok",
	oldPassword_label: "Altes Passwort",
	oldPasswordNeutral_msg: "Bitte altes Passwort eingeben",
	oldPasswordInvalid_msg: "Passwort nicht korrekt",
	newPassword_label: "Neues Passwort",
	securePasswords_link: "http://de.wikipedia.org/wiki/Passwortsicherheit#Wahl_sicherer_Passw.C3.B6rter",
	password1Neutral_msg: "Bitte neues Passwort eingeben",
	password1InvalidSame_msg: "Neues und altes Passwort sind identisch",
	password1InvalidUnsecure_msg: "Neues Passwort ist nicht sicher genug",
	password2Neutral_msg: "Bitte neues Passwort wiederholen",
	password2Invalid_msg: "Passwörter sind nicht identisch",
	verificationCode_msg: "Der Bestätigungs-Code wird Ihnen per SMS zugesendet.",
	code_label: "Bestätigungs-Code",
	pwChangeNeutral_msg: "Sie werden einen Bestätigungs-Code als SMS an $ erhalten.",
	pwChangeNeutralSendingCode_msg: "Code wird gesendet...",
	pwChangeValid_msg: "Passwort wurde geändert.",
	pwChangeInvalidServerNotAvailable_msg: "Der Server ist nicht erreichbar. Das Passwort wurde nicht geändert. Bitte versuchen Sie es später erneut.",
	pwChangeInvalidTooManyVerifyAttempts_msg: "Anzahl erlaubter Versuche überschritten. Bitte versuchen Sie es es später erneut.",
	pwChangeInvalidTooManyChangeAttempts_msg: "Das Passwort wurde zu häufig geändert. Bitte versuchen Sie es es später erneut.",
	pwChangeButtonSendCode_action: "Code senden",
	pwChangeButtonChangePw_action: "Passwort ändern",
	serverNotReachable_msg: "Der Server ist nicht erreichbar. Bitte versuchen Sie es es später erneut.",

	// general
	emptyString_msg: "\u2008",
	save_action: "Speichern",
	cancel_action: "Verwerfen",
	edit_action: "Ändern",
	delete_action: "Löschen",
	undelete_action: "Wiederherstellen",
	print_action: "Drucken",
	back_action: "Zurück",
	monthNames_label: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
	busy_alt: "Bitte warten...",
	close_alt: "Schließen",
	german_alt: "Deutsch",
	english_alt: "English",
	check_msg: "Überprüfe...",
	
	// code verification
	codeNeutralEnterCode_msg: "Bitte den Code eingeben.",
	codeValid_msg: "Code-Format ok",
	codeInvalid_msg: "Der Code ist nicht korrekt, bitte überprüfen Sie ihn erneut.",

	// external login
	invalidLink_msg: "Leider ist dieser Link ungültig.",
	smsError_msg: "Die SMS konnte nicht gesendet werden",
	smsSent_msg: "Die SMS sollte innerhalb von 60s ankommen.",
	smsResent_msg: "Wenn die SMS nicht angekommen ist, dann können Sie diese nun erneut senden.",
	smsSentOften_msg: "Es wurden zu viele SMS versendet. Fragen Sie den Sender der Nachricht, ob er Ihnen diese erneut zukommen lassen kann.",
	invalidPassword_msg: "Das Passwort ist leider ungültig.",
	showMail_action: "E-Mail anzeigen",
	chooseNumber_msg: "Bitte wählen Sie eine Telefonnummer. Das Passwort für die E-Mail wird an diese Nummer versendet (maximal drei SMS):",
	sendPasswordTo_action: "Passwort senden an: ",
	storePassword_action: "Passwort in Browser speichern",
	enterPresharedPassword_msg: "Bitte geben Sie das mit dem Absender vereinbarte Passwort ein.",
	sendingSms_msg: "SMS wird gesendet...",
	onlyPrivateComputer_msg: "Wählen Sie diese Option nur, wenn Sie einen privaten Computer verwenden.",
	loadingMail_msg: "Lade E-Mail...",
	enterPassword_msg: "Bitte geben Sie hier das Passwort ein.",

	// login
	welcome_msg: "Herzlich willkommen bei Tutanota",
	afterRegistration_msg: "Herzlich Willkommen und viel Spaß als Mitglied der Tutanota-Familie!",
	loginFailedOften_msg: "Es sind zu viele Login-Versuche fehlgeschlagen. Bitte versuchen Sie es später erneut.",
	loginFailed_msg: "Ungültige E-Mail-Adresse oder Passwort. Bitte versuchen Sie es erneut.",
	login_action: "Anmelden",
	emailAddress_placeholder: "E-Mail-Addresse",

	// header
	logo_alt: "Tutanota-Logo",
	letter_alt: "Brief",
	forUser_label: "für $",
	featureNotAvailable_msg: "Diese Funktion wird in 2014 verfügbar sein!",
	new_label: "Neu",
	emails_label: "E-Mails",
	emails_alt: "E-Mails",
	newMail_alt: "Neue E-Mail",
	contacts_label: "Kontakte",
	contacts_alt: "Kontakte",
	newContact_alt: "Neuer Kontakt",
	newFolder_alt: "Neuer Ordner",
	files_alt: "Dateien",
	files_label: "Dateien",
	calendar_label: "Kalender",
	calendar_alt: "Kalender",
	tasks_label: "Aufgaben",
	tasks_alt: "Aufgaben",
	feedback_label: "Feedback",
	feedback_alt: "Feedback",
	logout_label: "Abmelden",
	logout_alt: "Abmelden",
	settings_label: "Einstellungen",
	settings_alt: "Einstellungen",

	// not supported
	for_label: "für",
	oldBrowser_msg: "Oh, Das tut uns leid. Sie verwenden eine veraltete Version Ihres Browsers mit erheblichen Sicherheitslücken. Bitte nutzen Sie einen der folgenden Internetbrowser:",
	unsupportedBrowser_msg: "Oh! Das tut uns leid. Sie verwenden einen nicht unterstützten Browser. Bitte nutzen Sie einen der folgenden Internetbrowser:",
	browserNoKeygen_msg: "Lieber Interessent von Tutanota, während der Registrierung werden Schlüssel erzeugt. Die Erzeugung dieser Schlüssel benötigt mehr Rechenleistung als Ihr momentan verwendetes Gerät bereitstellt. Daher registrieren Sie sich bitte am besten auf einem Desktoprechner oder Laptop und verwenden dabei einen der folgenden Browser:",
	thanks_msg: "Vielen Dank für Ihr Verständnis.\nIhr Team von Tutanota",

	// registration
	claim_label: "Tutanota - einfach. sicher. mailen.",
	registration1Headline_msg: "Registrierung (Schritt 1 von 2)",
	registration2Headline_msg: "Registration (step 2 of 2)",
	company_label: "Firma",
	invoiceAddress_label: "Rechnungsadresse",
	domain_label: "Domain",
	companyNameNeutral_msg: "Bitte Firmennamen eingeben",
	companyNameValid_msg: "Firmenname ok",
	verifyingCode_msg: "Der Code wird überprüft. Bitte haben Sie einen Moment Geduld.",
	sendingSms_alt: "SMS wird gesendet. Bitte haben Sie einen Moment Geduld.",
	creatingAccount_alt: "Ihr Account wird angelegt. Bitte haben Sie einen Moment Geduld.",
	loginNameInfo_msg: "Optional: Wenn Sie eine E-Mail senden, wird dieser Name als Absender verwendet.",
	mobileNumberInfo_msg: "Ihre Mobilfunknummer wird zur Autorisierung benötigt, wenn Sie Ihr Passwort ändern möchten.",
	mobileNumberNeutral_msg: "Bitte Mobilfunknummer eingeben",
	mobileNumberValid_msg: "Mobilfunknummer ok",
	mobileNumberInvalid_msg: "Ungültige Mobilfunknummer",
	mailAddressInfo_msg: "Dies wird Ihre neue \"tutanota.de\"-E-Mail-Adresse. Es werden mindestens vier Buchstaben benötigt.",
	mailAddressNeutral_msg: "Bitte E-Mail-Adresse eingeben",
	mailAddressInvalid_msg: "Ungültige E-Mail-Adresse",
	mailAddressAvailable_msg: "E-Mail-Adresse ist verfügbar",
	mailAddressNA_msg: "E-Mail-Adresse ist bereits vergeben",
	mailAddressBusy_msg: "E-Mail-Adresse wird überprüft...",
		pwStrength_title: "Zeigt den Sicherheitsgrad des verwendeten Passworts an",
	goodPassphrase_action: "Wie finde ich ein gutes Passwort?",
	termsAndConditions_action: "Nutzungsbedingungen",
	join_action: "Fortfahren",
	joinNeutral_msg: "Fortfahren, um einen Bestätigungscode für die angegebene Mobilfunknummer per SMS zu erhalten.",
	joinRunning_msg: "Die SMS wird gesendet...",
	joinFailure_msg: "Leider konnte die SMS nicht gesendet werden. Bitte versuchen Sie es später erneut.",
	codeInputInfo_msg: "Der Code wurde gesendet an $",
	change_action: "ändern",
	createAccount_action: "Account anlegen",
	createAccountRunning_msg: "Account wird erstellt...",
	createAccountTooManyAttempts_msg: "Zu viele falsche Versuche. Bitte versuchen Sie es später erneut.",
	createAccountError_msg: "Leider ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
	createAccountInfo_msg: "Abhängig von der Geschwindigkeit Ihres Computers kann es einige Minuten dauern bis Ihre sicheren Schlüssel erzeugt wurden.",
	acceptConditions_label: "Ich akzeptiere die",
	name_label: "Name",
	mobileNumber_label: "Mobilfunknummer",
	desiredAddress_label: "gewünschte E-Mail-Adresse",
	password_label: 'Passwort',
	repeatedPassword_label: 'Passwort wiederholen',
	registrationCodeInput_label: "Bestätigungs-Code",
	progress_msg: "Fortschritt",
	terms_label: "Nutzungsbedingungen",
	termsAcceptedNeutral_msg: "Bitte akzeptieren Sie die Nutzungsbedingungen",

	// feedback
	screenshot_msg: "Ein Screenshot wird mit der Nachricht an uns versendet!",
	sendFeedbackFailed_msg: "Leider konnte das Feedback nicht gesendet werden. Bitte versuchen Sie es später erneut.",
};
