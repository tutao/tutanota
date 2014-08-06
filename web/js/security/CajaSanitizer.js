"use strict";

tutao.provide('tutao.tutanota.security.CajaSanitizer');

/**
 * Uses the sanitizer of google-caja.
 * @interface
 */
tutao.tutanota.security.CajaSanitizer = function() {};

tutao.tutanota.security.CajaSanitizer.prototype._urlTransformer = function(url) {
	return url;
};

tutao.tutanota.security.CajaSanitizer.prototype._nameIdClassTransformer = function(s) {
	return s;
};

/**
 * @inherit
 */
tutao.tutanota.security.CajaSanitizer.prototype.sanitize = function(html) {
	try {
		var cleanHtml = html_sanitize(html, this._urlTransformer, this._nameIdClassTransformer);
		// set target="_blank" for all links
		var domHtml = $('<div>').append(cleanHtml);
		domHtml.find("a").attr("target", "_blank");
		return domHtml.html();
	} catch (e) {
		console.log("error in html: " + html, e);
		return "";
	}
};
