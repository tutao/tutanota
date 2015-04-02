"use strict";

tutao.provide('tutao.tutanota.security.CajaSanitizer');

/**
 * Uses the sanitizer of google-caja.
 * @interface
 */
tutao.tutanota.security.CajaSanitizer = function() {};

tutao.tutanota.security.CajaSanitizer.prototype._urlTransformer = function(url) {
	console.log(url);
	return url;
};

tutao.tutanota.security.CajaSanitizer.prototype._nameIdClassTransformer = function(s) {
	return s;
};

/**
 * @inherit
 */
tutao.tutanota.security.CajaSanitizer.prototype.sanitize = function(html, blockExternalContent) {
	try {
		var cleanHtml = html_sanitize(html, this._urlTransformer, this._nameIdClassTransformer);
		// set target="_blank" for all links
		var domHtml = $('<div>').append(cleanHtml);
		domHtml.find("a").attr("target", "_blank");

		var externalImages = [];
		if (blockExternalContent){
			externalImages = this._preventExternalImageLoading(domHtml);
		}
		
		return {"text" : domHtml.html(), "externalImages" : externalImages };
	} catch (e) {
		console.log("error in html: " + html, e);
		return "";
	}
};




tutao.tutanota.security.CajaSanitizer.prototype._preventExternalImageLoading = function(domHtml) {
	var self = this;
	var externalImages = [];
	var localPreventIcon = "graphics/ion-alert-circled.svg";

	// find external images
	domHtml.find("img").each(function(index){
		var srcAttr = $(this).attr("src");
		if (self._isExternalLink(srcAttr)){
			$(this).attr("src", localPreventIcon);
			$(this).attr("alt", "Image src");
			externalImages.push(srcAttr);
		}
	});

	// find external background images
	domHtml.find("[style]").each(function(index){
		var backgroundImage = $(this).css("background-image");
		if (self._isExternalLink(backgroundImage)){
			externalImages.push(backgroundImage);
			$(this).css("background-image", "url(" +localPreventIcon + ")");
			externalImages.push(backgroundImage);
		}
	});
	return externalImages;
};

tutao.tutanota.security.CajaSanitizer.prototype._isExternalLink = function(link) {
	if (link) {
		if (link.indexOf("http://") != -1){
			return true;
		}
		if (link.indexOf("https://") != -1){
			return true;
		}
	}
	return false;
};
