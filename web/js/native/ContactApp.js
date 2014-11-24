"use strict";

tutao.provide('tutao.native.ContactApp');

/**
 * Functions to retrieve all contacts that are store on the phone
 * @interface
 */
tutao.native.ContactApp = function(){};

tutao.native.ContactApp.prototype.findRecipients = function(text, maxNumberOfSuggestions, suggestions) {
	var self = this;
	return new Promise(function (resolve, reject) {
        var options      = new ContactFindOptions();
        options.filter   = text;
        options.multiple = true;
        var fields       = [navigator.contacts.fieldType.formatted, navigator.contacts.fieldType.givenName, navigator.contacts.fieldType.familyName, navigator.contacts.fieldType.emails];
		options.desiredFields = [navigator.contacts.fieldType.name, navigator.contacts.fieldType.formatted, navigator.contacts.fieldType.givenName, navigator.contacts.fieldType.familyName, navigator.contacts.fieldType.emails];

        navigator.contacts.find(fields, function(nativeContacts) {
            try {
                for(var i=0;i < nativeContacts.length; i++) {
                    var nativeContact = nativeContacts[i];
					// we do not provide contacts without mail address
					if (nativeContact.emails != null) {
						self._addSuggetionsFromContact(suggestions, text, nativeContact, maxNumberOfSuggestions);
					}
					if (suggestions.length >= maxNumberOfSuggestions) {
						break;
					}
                }
                resolve();
            } catch(e) {
                reject(e);
            }
        }, reject, options);
    }).caught(function(e) {
		// ignore errors from native calls - find throws an error if contact access is deactivated for tutanota.
		return Promise.resolve();
	});
};

tutao.native.ContactApp.prototype._addSuggetionsFromContact = function(suggestions, text, nativeContact, maxNumberOfSuggestions) {
	var contactWrapper = null; // only create the contact wrapper if we actually want to add a suggestion to avoid that attribute encryption/decryption is reducing performance
	var addAllMailAddresses = (text == "" ||
			tutao.util.StringUtils.startsWith(nativeContact.name.givenName.toLowerCase(), text) ||
			tutao.util.StringUtils.startsWith(nativeContact.name.familyName.toLowerCase(), text) ||
			tutao.util.StringUtils.startsWith(nativeContact.name.formatted.toLowerCase(), text));
	for (var a = 0; a < nativeContact.emails.length; a++) {
		var mailAddress = nativeContact.emails[a].value.trim().toLowerCase();
		if ((addAllMailAddresses || tutao.util.StringUtils.startsWith(mailAddress, text))
				&& tutao.tutanota.util.Formatter.isMailAddress(mailAddress)
				&& !this._containsSuggestionForMailAddress(suggestions, mailAddress)) {
			var suggestionText = nativeContact.name.formatted;
            var additionalText = mailAddress;
			if (!contactWrapper) {
				contactWrapper = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper();
				contactWrapper.getContact().setFirstName(nativeContact.name.givenName);
				contactWrapper.getContact().setLastName(nativeContact.name.familyName);
			}
			var newma = new tutao.entity.tutanota.ContactMailAddress(contactWrapper.getContact());
			newma.setAddress(mailAddress);
			newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER);
			newma.setCustomTypeName("");
			contactWrapper.getContact().getMailAddresses().push(newma);
			suggestions.push(new tutao.tutanota.ctrl.bubbleinput.Suggestion({ contactWrapper: contactWrapper, mailAddress: mailAddress }, suggestionText, additionalText));
			if (suggestions.length >= maxNumberOfSuggestions) {
				break;
			}
		}
	}
};

tutao.native.ContactApp.prototype._containsSuggestionForMailAddress = function(suggestions, mailAddress) {
	for( var i=0; i<suggestions.length; i++){
		if(suggestions[i].id.mailAddress == mailAddress){
			return true;
		}
	}
	return false;
};
