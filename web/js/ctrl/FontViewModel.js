"use strict";

tutao.provide('tutao.tutanota.ctrl.FontViewModel');

tutao.tutanota.ctrl.FontViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	var self = this;

	this.fonts = ko.observableArray(["DejaVu Sans", "Helvetica", "Droid Sans", "News Cycle", "Ubuntu Condensed", "Open Sans", "Yanone Kaffeesatz", "Oswald", "Source Sans Pro", "lucida grande", "tahoma"]);
	this.font = ko.observable("DejaVu Sans");
	this.font.subscribe(function() {
		$("body, input, button, select, textarea").css("font-family", self.font());
	});
};
