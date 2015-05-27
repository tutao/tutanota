"use strict";

tutao.provide('tutao.tutanota.security.CajaSanitizer');

/**
 * Uses the sanitizer of google-caja.
 * @interface
 */
tutao.tutanota.security.CajaSanitizer = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._blockExternalContent = false;
	this._urlReplacementMap = [];
};

tutao.tutanota.security.CajaSanitizer.prototype._urlTransformer = function(url) {
	//console.log(url);
	if (this._blockExternalContent){
		// only external links
		if ( tutao.util.StringUtils.startsWith( url.getScheme(),  "http") ){
			var originalUrl = url.toString();
			// Replace the external url with a non existing local reference and store
			// the replacement in a map.
			url.setDomain(null);
			url.setScheme(null);
			url.setPort(null);
			url.setQuery(null);
			url.setPath("replacement_" + (this._urlReplacementMap.length + 1));
			var replacementUrl = url.toString();
			this._urlReplacementMap.push( {replacement:replacementUrl, original: originalUrl });
		}
	}
	return url;
};

tutao.tutanota.security.CajaSanitizer.prototype._nameIdClassTransformer = function(s) {
	//console.log(s);
	return s;
};

/**
 * @inherit
 */
tutao.tutanota.security.CajaSanitizer.prototype.sanitize = function(html, blockExternalContent) {
	try {
		// To prevent external image loading we replace all external image references (including background images)
		// with a local reference to a special icon: PREVENT_EXTERNAL_IMAGE_LOADING_ICON.
		// To find img tags and background images we use the jQuery parseHTML method. Because this method may load
		// external images in some browsers (e.g. Safari on OSX or IE10 on WIN7) we replace all external images
		// with non existing references first using the _urlTransform callback. After replacing the external images
		// with the PREVENT_EXTERNAL_IMAGE_LOADING_ICON all other replaced external links are restored to the original links.

		// reset replacement map first.
		this._urlReplacementMap = [];
		// must be set to use in _urlTransformer callback
		this._blockExternalContent = blockExternalContent;

		// clean html contains only local references to non existing resources now (images and links)
		var cleanHtml = html_sanitize(html, this._urlTransformer, this._nameIdClassTransformer);

		// parse html for image references and replace them with the local prevent icon.
		var htmlNodes = $.parseHTML(cleanHtml);
		var externalImages = [];
		if (this._blockExternalContent){
			externalImages = this._preventExternalImageLoading(htmlNodes);
		}

		// set target="_blank" for all links
		var domHtml = $('<div>').append(htmlNodes);
		domHtml.find("a").attr("target", "_blank");

		var htmlText = domHtml.html();

		// Restore all other external links to the original reference.
		htmlText = this._restoreReplacedUrls(htmlText);
		return {"text" : htmlText, "externalImages" : externalImages };
	} catch (e) {
		console.log("error in html: " + html, e);
		return "";
	}
};



tutao.tutanota.security.CajaSanitizer.prototype._preventExternalImageLoading = function(htmlNodes) {
	var externalImages = [];
	// find external images
	this._replaceImageTags(htmlNodes, externalImages);
	// find external background images
	this._replaceBackgroundImages(htmlNodes, externalImages);
	return externalImages;
};


tutao.tutanota.security.CajaSanitizer.prototype._replaceImageTags = function(htmlNodes, externalImages) {
	for( var i=0; i<htmlNodes.length; i++){
		var htmlNode = htmlNodes[i];
		var imageSrc = htmlNode.src || htmlNode.poster;
		if (imageSrc){
			var originalLink = this._getOriginalLink(imageSrc);
			if (originalLink){
				externalImages.push(originalLink);
				if (htmlNode.src){
					htmlNode.src = tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON;
				}
				if (htmlNode.poster){
					htmlNode.poster = tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON;
				}
			}
		}
		this._replaceImageTags(htmlNodes[i].childNodes, externalImages);
	}
};


tutao.tutanota.security.CajaSanitizer.prototype._replaceBackgroundImages = function(htmlNodes, externalImages) {
	for( var i=0; i<htmlNodes.length; i++){
		var htmlNode = htmlNodes[i];
		if (htmlNode.style && htmlNode.style.backgroundImage){
			var originalLink = this._getOriginalLink(htmlNode.style.backgroundImage);
			if(originalLink){
				externalImages.push(originalLink);
				htmlNode.style.backgroundImage = "url(" + tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON + ")";
			}
		}
		this._replaceBackgroundImages(htmlNodes[i].childNodes, externalImages);
	}
};


/**
 * Returns the original link for the given link from the replacement map. Returns null if the link
 * is not available.
 */
tutao.tutanota.security.CajaSanitizer.prototype._getOriginalLink = function(link) {
	for( var i=0; i<this._urlReplacementMap.length; i++){
		if (link.indexOf(this._urlReplacementMap[i].replacement)  != -1){
			console.log("found originalLink for: " + link + "->" + this._urlReplacementMap[i].original);
			return this._urlReplacementMap[i].original;
		}
	}
	console.log("no originalLink for: " + link );
	return null;
};

tutao.tutanota.security.CajaSanitizer.prototype._restoreReplacedUrls = function(htmlText) {
	var newHtmlText = htmlText;
	for( var i=0; i<this._urlReplacementMap.length; i++){
		newHtmlText = newHtmlText.replace(this._urlReplacementMap[i].replacement, this._urlReplacementMap[i].original)
	}
	return newHtmlText;
};

