"use strict";

goog.provide('tutao.tutanota.util.ThunderbirdContactCsvConverter');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.ContactCsvHandler}
 */
tutao.tutanota.ctrl.ThunderbirdContactCsvConverter = function() {

};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.csvToContacts = function(csvString) {
	return tutao.tutanota.ctrl.ContactCsvConverter.csvToContacts(csvString, this);
};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.startContact = function(contact) {
	this.birthday = null;
	this.additionalComment = "";
	this.homeAddress = null; 
	this.homeAddress2 = null; 
	this.homeCity = null; 
	this.homeState = null; 
	this.homeZipCode = null; 
	this.homeCountry = null; 
	this.workAddress = null; 
	this.workAddress2 = null;
	this.workCity = null; 
	this.workState = null; 
	this.workZipCode = null; 
	this.workCountry = null;
};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.addField = function(contact, name, value) {
	if (!value) {
		return true;
	}
	switch (name) {
	case "First Name":
		contact.setFirstName(value);
		return true;
	case "Last Name":
		contact.setLastName(value);
		return true;
	case "Primary Email":
	case "Secondary Email":
		var mailAddress = new tutao.entity.tutanota.ContactMailAddress(contact);
		mailAddress.setAddress(value);
		mailAddress.setCustomTypeName("");
		mailAddress.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER);
		contact.getMailAddresses().push(mailAddress);
		return true;
	case "Work Phone":
		this.addPhoneNumber(contact, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_WORK, "", value);
		return true;
	case "Home Phone":
		this.addPhoneNumber(contact, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE, "", value);
		return true;
	case "Fax Number":
		this.addPhoneNumber(contact, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_FAX, "", value);
		return true;
	case "Pager Number": 
		this.addPhoneNumber(contact, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_CUSTOM, "Pager", value);
		return true;
	case "Mobile Number":
		this.addPhoneNumber(contact, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_MOBILE, "", value);
		return true;
	case "Job Title": 
		contact.setTitle(value);
		return true;
	case "Organization":
		contact.setCompany(value);
		return true;
	case "Notes":
		contact.setComment(value);
		return true;
	case "Birth Year":
		if (!this.birthday) {
			this.birthday = new Date();
		}
		this.birthday.setYear(value);
		return true;
	case "Birth Month":
		if (!this.birthday) {
			this.birthday = new Date();
		}
		this.birthday.setMonth(value);
		return true;
	case "Birth Day":
		if (!this.birthday) {
			this.birthday = new Date();
		}
		this.birthday.setDate(value);
		return true;
	case "Home Address": 
		this.homeAddress = value;
		return true;
	case "Home Address 2":
		this.homeAddress2 = value;
		return true; 
	case "Home City":
		this.homeCity = value;
		return true; 
	case "Home State":
		this.homeState = value;
		return true;
	case "Home ZipCode":
		this.homeZipCode = value;
		return true; 
	case "Home Country":
		this.homeCountry = value;
		return true; 
	case "Work Address":
		this.workAddress = value;
		return true; 
	case "Work Address 2":
		this.workAddress2 = value;
		return true;
	case "Work City":
		this.workCity = value;
		return true; 
	case "Work State":
		this.workState = value;
		return true; 
	case "Work ZipCode":
		this.workZipCode = value;
		return true; 
	case "Work Country":
		this.workCountry = value;
		return true;
	case "Display Name":
	case "Screen Name": 
		return true;
	case "Nickname":
	case "Department": 
	case "Web Page 1": 
	case "Web Page 2": 
	case "Custom 1": 
	case "Custom 2": 
	case "Custom 3": 
	case "Custom 4": 
		this.additionalComment += ("\n" + name + ": " + value);
		return true;
	default:
		return false;
	}
	return true;
};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.finishContact = function(contact) {
	contact.setBirthday(this.birthday);
	if (this.additionalComment) {
		contact.setComment(contact.getComment() + "\n" + this.additionalComment);
	}
	var homeAddr = this.combineAddress(this.homeAddress, this.homeAddress2, this.homeZipCode, this.homeCity, this.homeState, this.homeCountry);
	this.addAddress(contact, tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_PRIVATE, homeAddr);
	var workAddr = this.combineAddress(this.workAddress, this.workAddress2, this.workZipCode, this.workCity, this.workState, this.workCountry);
	this.addAddress(contact, tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_WORK, workAddr);
	return true;
};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.combineAddress = function(address1, address2, zipCode, city, state, country) {
	var address = "";
	if (address1) {
		address += address1 + "\n";
	}
	if (address2) {
		address += address2 + "\n";
	}
	if (zipCode && city) {
		address += zipCode + " " + city + "\n";
	} else if (zipCode) {
		address += zipCode + "\n";
	} else if (city) {
		address += city + "\n";
	}			
	if (state) {
		address += state + "\n";
	}
	if (country) {
		address += country + "\n";
	}

	if (address) {
		return address;
	} else {
		return null;
	}
};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.addPhoneNumber = function(contact, type, customTypeName, number) {
	if (number) {
		var n = new tutao.entity.tutanota.ContactPhoneNumber(contact);
		n.setNumber(number);
		n.setType(type);
		n.setCustomTypeName(customTypeName);
		contact.getPhoneNumbers().push(n);
	}
};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.addAddress = function(contact, type, address) {
	if (address) {
		var n = new tutao.entity.tutanota.ContactAddress(contact);
		n.setAddress(address);
		n.setType(type);
		n.setCustomTypeName("");
		contact.getAddresses().push(n);
	}
};

tutao.tutanota.ctrl.ThunderbirdContactCsvConverter.prototype.contactsToCsv = function(contacts) {
	return tutao.tutanota.ctrl.ContactCsvConverter.contactsToCsv(contacts, function(contact, callback) {
		
	});
};
