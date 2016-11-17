"use strict";

tutao.provide('tutao.tutanota.util.Formatter');

/**
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'hh:mm:ss'.
 */
tutao.tutanota.util.Formatter.formatLocalTime = function(date) {
	return tutao.util.StringUtils.pad(date.getHours(), 2) + ":" + tutao.util.StringUtils.pad(date.getMinutes(), 2) + ":" + tutao.util.StringUtils.pad(date.getSeconds(), 2);
};

/**
 * Parses a time string and returns the corresponding milliseconds.
 * @param {string} string The formatted date in the form 'hh:mm:ss'.
 * @return {Number} The date.
 */
tutao.tutanota.util.Formatter.parseLocalTime = function(string) {
	var parts = string.split(":");
	return (Number(parts[0]) * 60 * 60 + Number(parts[1]) * 60 + Number(parts[2])) * 1000 + (new Date().getTimezoneOffset() * 60000);  
};

/**
 * Provides a formatted time with millis.
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'hh:mm:ss.SSS'.
 */
tutao.tutanota.util.Formatter.formatTimeMillis = function(date) {
	return tutao.util.StringUtils.pad(date.getHours(), 2) + ":" + tutao.util.StringUtils.pad(date.getMinutes(), 2) + ":" + tutao.util.StringUtils.pad(date.getSeconds(), 2) + "." + tutao.util.StringUtils.pad(date.getMilliseconds(), 2);
};

/**
 * @see http://www.elated.com/articles/working-with-dates/
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'EE dd. Month [yyyy] hh:mm'.
 */
tutao.tutanota.util.Formatter.formatDateTime = function(date) {
	return tutao.tutanota.util.Formatter.formatDateWithWeekday(date) + " " + tutao.util.StringUtils.pad(date.getHours(), 2) + ":" + tutao.util.StringUtils.pad(date.getMinutes(), 2);
};

/**
 * @see http://www.elated.com/articles/working-with-dates/
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'EE dd. Month [yyyy] hh:mm'.
 */
tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn = function(date) {
	var dateString = null;
	var startOfToday = new Date().setHours(0,0,0,0);
	var startOfYesterday = startOfToday - 1000*60*60*24;
	if (date.getTime() >= startOfToday) {
		dateString = "";
	} else if (startOfToday > date.getTime() && date.getTime() >= startOfYesterday) {
		dateString = tutao.locator.languageViewModel.get("yesterday_label");
	} else {
		dateString = tutao.tutanota.util.Formatter.formatDateWithWeekday(date);
	}
	return (dateString + " " + tutao.util.StringUtils.pad(date.getHours(), 2) + ":" + tutao.util.StringUtils.pad(date.getMinutes(), 2)).trim();
};

/**
 * Provides the date as a string.
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form '[d]d. Month yyyy hh:mm'.
 */
tutao.tutanota.util.Formatter.formatFullDateTime = function(date) {
	var monthNames = tutao.locator.languageViewModel.get("monthNames_label");
	return date.getDate() + ". " + monthNames[date.getMonth()] + " " + (1900 + date.getYear()) + " " + tutao.util.StringUtils.pad(date.getHours(), 2) + ":" + tutao.util.StringUtils.pad(date.getMinutes(), 2);
};

/**
 * Provides the date as a string.
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'Day of week, [d]d Month yyyy hh:mm:ss +zone', e.g. Thu, 20 Mar 2014 11:58:26 +0100.
 */
tutao.tutanota.util.Formatter.formatSmtpDateTime = function(date) {
    var dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return dayNames[date.getUTCDay()] + ", " + date.getUTCDate() + " " + monthNames[date.getUTCMonth()] + " " + date.getUTCFullYear() + " " + tutao.util.StringUtils.pad(date.getUTCHours(), 2) + ":" + tutao.util.StringUtils.pad(date.getUTCMinutes(), 2) + ":" + tutao.util.StringUtils.pad(date.getUTCSeconds(), 2) + " +0000";
};

/**
 * Formats the date into a string that is convenient for the user to read. Use this function if there is no need to convert the string back to a date.
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form '[d]d. Month yyyy'.
 */
tutao.tutanota.util.Formatter.formatDate = function(date) {
	var monthNames = tutao.locator.languageViewModel.get("monthNames_label");
	var currentYear = new Date().getYear();
	var yearString = (date.getYear() == currentYear) ? "" : " " + (1900 + date.getYear());
	return date.getDate() + ". " + monthNames[date.getMonth()] + yearString;
};

/**
 * @see http://www.elated.com/articles/working-with-dates/
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'EE [d]d. Month [yyyy]'.
 */
tutao.tutanota.util.Formatter.formatDateWithWeekday = function(date) {
	var dayNames = tutao.locator.languageViewModel.get("weekDays_label");
	return dayNames[date.getDay()] + " " + tutao.tutanota.util.Formatter.formatDate(date);
};

/**
 * Converts a date to a string. Use this function for datetime attributes or if the conversion from string to date is needed (dashStringToDate).
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'yyyy-mm-dd'.
 */
tutao.tutanota.util.Formatter.dateToDashString = function(date) {
	return tutao.util.StringUtils.pad(date.getFullYear(), 4) + "-" + tutao.util.StringUtils.pad(date.getMonth() + 1, 2) + "-" + tutao.util.StringUtils.pad(date.getDate(), 2);
};

/**
 * Converts a string to a date.
 * @param {string} string the formatted date in the form 'yyyy-mm-dd'.
 * @return {Date} The date or null if the dash string has no valid format.
 */
tutao.tutanota.util.Formatter.dashStringToDate = function(string) {
    // the constructor Date(string) would be in UTC, so in order to get local time we use Date(yyyy,mm,dd)
    var parts = string.split("-");
    if (parts.length != 3) {
        return null;
    }
	var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
	if (isNaN(date.getTime())) {
		return null;
	} else {
		return date;
	}
};

/**
 * Checks if the given string is a valid email address format.
 * @param {string} string The string to check.
 * @param {string} checkUserNameLength If true checks that the part before the @ is not longter than 64 characters.
 * @return {boolean} If the string is an email address.
 */
tutao.tutanota.util.Formatter.isMailAddress = function(string, checkUserNameLength) {
	/* KEEP IN SYNC WITH JAVA VERSION IN PhoneNumberUtils.js (except uppercase) */
	// check trailing whitespaces because they are not covered by the following regexp
    // allow uppercase addresses in input check, convert them before sending to server.
	if (string == null || string != string.trim()) {
		return false;
	}
    if (tutao.util.StringUtils.startsWith(string, "-")) {
        return false;
    }
	// check lengths (see https://tools.ietf.org/html/rfc5321#section-4.5.3)
	if (string.length > 254) { // 256 minus "<" and ">" of the path
		return false;
	}
	if (checkUserNameLength && string.indexOf("@") > 64) {
		return false;
	}
	// see http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
	return /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(string);
};

/**
 * Checks if the given string is a valid domain name.
 * @param {string} string The string to check.
 * @return {boolean} If the string is a domain name.
 */
tutao.tutanota.util.Formatter.isDomainName = function(string) {
	if (string == null || string != string.trim()) {
		return false;
	}
	if (tutao.util.StringUtils.startsWith(string, "-")) {
		return false;
	}
	return /^[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(string);
};


/**
 * Checks if the given mail address ends with a Tutanota domain.
 * @param mailAddress The mail address
 * @returns {boolean} True if the domain is one of the Tutanota mail address domains.
 */
tutao.tutanota.util.Formatter.isTutanotaMailAddress = function(mailAddress) {
	var tutanotaDomains = tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS;
	for ( var i=0; i< tutanotaDomains.length; i++){
		if ( tutao.util.StringUtils.endsWith(mailAddress, "@" + tutanotaDomains[i])){
			return true;
		}
	}
	return false;
};

/**
 * Provides the domain name without sub-domains.
 * @param mailAddress The email address to get the domain from.
 * @return {string} The domain name.
 */
tutao.tutanota.util.Formatter.getDomainWithoutSubdomains = function(mailAddress) {
	var domain = mailAddress.substring(mailAddress.indexOf("@") + 1).toLowerCase();
	var lastDot = domain.lastIndexOf(".");
	var lastButOneDot = domain.lastIndexOf(".", lastDot - 1);
	if (lastButOneDot == -1) {
		return domain;
	} else {
		return domain.substring(lastButOneDot + 1);
	}
};

/**
 * Returns a cleaned mail address from the input mail address. Removes leading or trailing whitespaces and converters
 * the address to lower case.
 * @param {string} mailAddress The input mail address.
 * @return {string} The cleaned mail address.
 */
tutao.tutanota.util.Formatter.getCleanedMailAddress = function(mailAddress){
    var cleanedMailAddress = mailAddress.toLowerCase().trim();
    if (tutao.tutanota.util.Formatter.isMailAddress(cleanedMailAddress, false)) {
		return cleanedMailAddress;
	}	
   	return null;
};


/**
 * Checks if the given string is a valid local part of a Tutanota email address.
 * @param {string} string The string to check.
 * @return {boolean} If the string is valid.
 */
tutao.tutanota.util.Formatter.isValidTutanotaLocalPart = function(string) {
	// check uppercase and leading or trailing whitespaces because they are not covered by the following regexp
	if (string != string.toLowerCase().trim()) {
		return false;
	}
	if (string[0] == '.' || string[string.length - 1] == '.') {
		return false;
	}
	if (string.indexOf("..") != -1) {
		return false;
	}
	// see http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
	return /^[a-zA-Z0-9_\-\.]+$/.test(string);
};

/**
 * Parses the given string for a name and mail address. The following formats are recognized: [name][<]mailAddress[>] Additionally, whitespaces at any positions outside name and mailAddress are ignored.
 * @param {string} string The string to check.
 * @return {Object.<string,string>=} Returns an object with the attributes "name" and "mailAddress" or null if nothing was found.
 */
tutao.tutanota.util.Formatter.stringToNameAndMailAddress = function(string) {
	string = string.trim();
	if (string == "") {
		return null;
	}
	var startIndex = string.indexOf("<");
	if (startIndex != -1) {
		var endIndex = string.indexOf(">", startIndex);
		if (endIndex == -1) {
			return null;
		}
        var cleanedMailAddress = this.getCleanedMailAddress(string.substring(startIndex + 1, endIndex));

		if (!tutao.tutanota.util.Formatter.isMailAddress(cleanedMailAddress, false)) {
			return null;
		}
		var name = string.substring(0, startIndex).trim();
		return {name: name, mailAddress: cleanedMailAddress};
	} else {
		var startIndex = string.lastIndexOf(" ");
		startIndex++;
        var cleanedMailAddress = this.getCleanedMailAddress(string.substring(startIndex));
		if (!tutao.tutanota.util.Formatter.isMailAddress(cleanedMailAddress, false)) {
			return null;
		}
		var name = string.substring(0, startIndex).trim();
		return {name: name, mailAddress: cleanedMailAddress};
	}
};

/**
 * Parses the given string for a fist name and a last name separated by whitespace. If there is only one part it is regarded as first name. If there are more than two parts, only the first one is regarded as first name.
 * @param {string} fullName The full name to check.
 * @return {Object.<string,string>=} Returns an object with the attributes "firstName" and "lastName".
 */
tutao.tutanota.util.Formatter.fullNameToFirstAndLastName = function(fullName) {
    fullName = fullName.trim();
    if (fullName == "") {
        return { firstName: "", lastName: "" };
    }
    var separator = fullName.indexOf(" ");
    if (separator != -1) {
        return { firstName: fullName.substring(0, separator), lastName: fullName.substring(separator + 1) };
    } else {
        return { firstName: fullName, lastName: "" };
    }
};

/**
 * Parses the given email address for a fist name and a last name separated by whitespace, comma, dot or underscore.
 * @param {string} mailAddress The email address to check.
 * @return {Object.<string,string>=} Returns an object with the attributes "firstName" and "lastName".
 */
tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName = function(mailAddress) {
    var addr = mailAddress.substring(0, mailAddress.indexOf("@"));
    var nameData = [];
    if (addr.indexOf(".") != -1) {
        nameData = addr.split(".");
    } else if (addr.indexOf("_") != -1) {
        nameData = addr.split("_");
    } else if (addr.indexOf("-") != -1) {
        nameData = addr.split("-");
    } else {
        nameData = [addr];
    }
    // first character upper case
    for (var i = 0; i < nameData.length; i++) {
        if (nameData[i].length > 0) {
            nameData[i] = nameData[i].substring(0, 1).toUpperCase() + nameData[i].substring(1);
        }
    }
    return { firstName: nameData[0], lastName: nameData.slice(1).join(" ") };
};

/**
 * Formats the given size in bytes to a better human readable string using B, KB, MB, GB, TB.
 * @param {number} size The size in bytes.
 */
tutao.tutanota.util.Formatter.formatFileSize = function(size) {
	var unit = ["B", "KB", "MB", "GB", "TB"];
	var unitIndex = 0;
	while (size >= 1000) {
		size /= 1024;
		unitIndex++;
	}
	// round to 1 digit after comma
	size = Math.floor(size * 10) / 10;
	return size + " " + unit[unitIndex];
};

/**
 * Provides the cleaned phone number. Format: +<country_code><number_without_0>. Uses the country code +49 if none is provided.
 * Accepts and removes ' ', '/', '-', '(', ')' from the given phoneNumber.
 * @param {string} phoneNumber The phone number to clean.
 * @return {string?} The cleaned phone number or null if the phone number is not valid.
 */
tutao.tutanota.util.Formatter.getCleanedPhoneNumber = function(phoneNumber) {
	/* KEEP IN SYNC WITH JAVA VERSION IN PhoneNumberUtils.java */
	phoneNumber = phoneNumber.replace(/ /g, "");
	phoneNumber = phoneNumber.replace(/\//g, "");
	phoneNumber = phoneNumber.replace(/-/g, "");
	phoneNumber = phoneNumber.replace(/\(/g, "");
	phoneNumber = phoneNumber.replace(/\)/g, "");
	return (/^\+[1-9]{1}[0-9]+$/.test(phoneNumber)) ? phoneNumber : null;
};

/**
 * Provides the information if the given cleaned phone number is a german mobile phone number.
 * @param {?string} cleanPhoneNumber The phone number to check.
 * @return {boolean} True if it is a mobile phone number, false otherwise.
 */
tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber = function(cleanPhoneNumber) {
	/* KEEP IN SYNC WITH JAVA VERSION IN Formatutils.java and CommonCodes.java */
	if (!cleanPhoneNumber || cleanPhoneNumber.length < (3 + 10) || cleanPhoneNumber.length > (3 + 11) || !tutao.util.StringUtils.startsWith(cleanPhoneNumber, "+49")) {
		return false;
	}
	var germanMobileAreaCodes = ["0151", "0160", "0170", "0171", "0175", /* telekom */
	                             "0152", "0162", "0172", "0173", "0174", /* vodafone */
	                             "0155", "0157", "0163", "0177", "0178", /* e-plus */
	                             "0159", "0176", "0179"]; /* o2 */
	for (var i = 0; i < germanMobileAreaCodes.length; i++) {
		if (tutao.util.StringUtils.startsWith(cleanPhoneNumber.substring(3), germanMobileAreaCodes[i].substring(1))) {
			return true;
		}
	}
	return false;
};

/**
 * Replaces plain text links in the given text by html links. Already existing html links are not changed.
 * @param text The text to be checked for links.
 * @returns {string} The text with html links.
 */
tutao.tutanota.util.Formatter.urlify = function(text) {
    return Autolinker.link(text, {stripPrefix:false, urls:true, emails:true, phone:false, twitter:false, hashtag:false, replaceFn : function( autolinker, match ) {
		switch( match.getType() ) {
			case 'url' :
				// true: let Autolinker perform its normal anchor tag replacement,  false: don't auto-link this particular item leave as-is
				if (tutao.util.StringUtils.startsWith( match.getMatchedText(),  "http") || tutao.util.StringUtils.startsWith( match.getMatchedText(),  "www.")) {
					var tag = match.buildTag(); // returns an `Autolinker.HtmlTag` instance for an <a> tag
					tag.setAttr('target', '_blank');
					tag.setAttr('rel', 'noopener noreferrer');
					return tag;
				} else {
					return false;
				}
		}
	}});
};

/**
 * Replaces all starting and ending html tag symbols with their url code representation.
 * @param text The text containing html nodes
 * @returns The encoded string.
 */
tutao.tutanota.util.Formatter.urlEncodeHtmlTags = function(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};


/**
 * Formates the given storage size in bytes to string.
 * @param Number The storage size value in bytes
 * @returns {string} The formated bytes.
 */
tutao.tutanota.util.Formatter.formatStorageSize = function(bytes) {
	var mByte = Math.pow(1000, 2); // or 1024 for binary
	var gByte = Math.pow(1000, 3);
	var floatValueAsString = "0";
	if ( bytes > mByte) { // storage is at least 1 MB
		 floatValueAsString = (bytes / gByte).toString();
	}
	var parts = floatValueAsString.split('.');
	if (parts.length > 1) { // cut of last
		var decimalPlaces = parts[1];
		if (decimalPlaces.length > 3) {
			decimalPlaces = decimalPlaces.substr(0,3);
		}
		if ( Number(decimalPlaces) > 0){
			floatValueAsString = parts[0] + ',' + decimalPlaces;
		} else {
			floatValueAsString = parts[0];
		}
	}
	return floatValueAsString + ' GB';
};



/**
 * Returns a cleaned mime type string. Removes leading or trailing quotation marks.
 *
 * @param {string} mimeType The input mime type.
 * @return {string} The cleaned mime type.
 */
tutao.tutanota.util.Formatter.getCleanedMimeType = function(mimeType){
	return mimeType.replace("\"", "").replace("'", "");
};
