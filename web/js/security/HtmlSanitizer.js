"use strict";

tutao.provide('tutao.tutanota.security.HtmlSanitizer');

/**
 * This Interface provides an abstraction of a Html sanitizer.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.tutanota.security.HtmlSanitizer = function() {};

/**
 * Sanitizes the given html.
 * @param {string} html The html content to sanitize.
 * @param {boolean} blockExternalContent True if external content should be blocked
 * @return {string} The safe html.
 */
tutao.tutanota.security.HtmlSanitizer.prototype.sanitize = function(html, blockExternalContent) {};
