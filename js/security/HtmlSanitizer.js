"use strict";

goog.provide('tutao.tutanota.security.HtmlSanitizer');

/**
 * This Interface provides an abstraction of a Html sanitizer.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.tutanota.security.HtmlSanitizer = function() {};

/**
 * Sanitizes the given html.
 * @param {string} html The html content to sanitize.
 * @return {string} The save html.
 */
tutao.tutanota.security.HtmlSanitizer.prototype.sanitize = function(html) {};
