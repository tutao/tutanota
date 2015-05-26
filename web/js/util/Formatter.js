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
 * Provides the date as a string with the year skipped if it is the current year.
 * TODO (timely) switch to google Date tools for all date formattings, esp. for different locales?
 *
 * @see http://www.elated.com/articles/working-with-dates/
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form '[d]d. Month [yyyy]'.
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
	var monthNames = tutao.locator.languageViewModel.get("monthNames_label");
	var currentYear = new Date().getYear();
	var yearString = (date.getYear() == currentYear) ? "" : " " + (1900 + date.getYear());
	return dayNames[date.getDay()] + " " + date.getDate() + ". " + monthNames[date.getMonth()] + yearString;
};

/**
 * Converts a date to a string.
 * @param {Date} date The date to format.
 * @return {string} the formatted date in the form 'dd.mm.yyyy'.
 */
tutao.tutanota.util.Formatter.dateToSimpleString = function(date) {
	return tutao.util.StringUtils.pad(date.getDate(), 2) + "." + tutao.util.StringUtils.pad(date.getMonth() + 1, 2) + "." + tutao.util.StringUtils.pad(date.getFullYear(), 4);
};

/**
 * Converts a date to a string.
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
	var date = new Date(string);
	if (isNaN(date.getTime())) {
		return null;
	} else {
		return date;
	}
};

/**
 * Converts a string to a date.
 * @param  {string} string The string to convert in the form '[d]d.[m]m.yyyy'.
 * @return {Date=} date The date or null if the string could not be parsed.
 */
tutao.tutanota.util.Formatter.simpleStringToDate = function(string) {
	if (string.indexOf("-") != -1) {
		return null;
	}
	var s = string.split('.');
	if (s.length != 3 || (s[0].length != 1 && s[0].length != 2) || (s[1].length != 1 && s[1].length != 2) || s[2].length != 4 || isNaN(s[0]) || isNaN(s[1]) || isNaN(s[2])) {
		return null;
	}
	var day = Number(s[0]);
	var month = Number(s[1]);
	var year = Number(s[2]);
	if (day < 1 || day > 31 || month < 1 || month > 12) {
		return null;
	}
	return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Checks if the given string is a valid email address format.
 * @param {string} string The string to check.
 * @return {boolean} If the string is an email address.
 */
tutao.tutanota.util.Formatter.isMailAddress = function(string) {
	/* KEEP IN SYNC WITH JAVA VERSION IN PhoneNumberUtils.js (except uppercase) */
	// check trailing whitespaces because they are not covered by the following regexp
    // allow uppercase addresses in input check, convert them before sending to server.
	if (string == null || string != string.trim()) {
		return false;
	}
    if (tutao.util.StringUtils.startsWith(string, "-")) {
        return false;
    }
	// see http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
	return /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(string);
};

/**
 * Returns a cleaned mail address from the input mail address. Removes leading or trailing whitespaces and converters
 * the address to lower case.
 * @param {string} mailAddress The input mail address.
 * @return {string} The cleaned mail address.
 */
tutao.tutanota.util.Formatter.getCleanedMailAddress = function(mailAddress){
    var cleanedMailAddress = mailAddress.toLowerCase().trim();
    if (tutao.tutanota.util.Formatter.isMailAddress(cleanedMailAddress)) {
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

		if (!tutao.tutanota.util.Formatter.isMailAddress(cleanedMailAddress)) {
			return null;
		}
		var name = string.substring(0, startIndex).trim();
		return {name: name, mailAddress: cleanedMailAddress};
	} else {
		var startIndex = string.lastIndexOf(" ");
		startIndex++;
        var cleanedMailAddress = this.getCleanedMailAddress(string.substring(startIndex));
		if (!tutao.tutanota.util.Formatter.isMailAddress(cleanedMailAddress)) {
			return null;
		}
		var name = string.substring(0, startIndex).trim();
		return {name: name, mailAddress: cleanedMailAddress};
	}
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
				return tutao.util.StringUtils.startsWith( match.getMatchedText(),  "http");
		}
	}});
};