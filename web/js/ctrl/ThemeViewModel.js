"use strict";

tutao.provide('tutao.tutanota.ctrl.ThemeViewModel');

tutao.tutanota.ctrl.ThemeViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	var self = this;

	this.themes = ko.observableArray(['main', 'new']);
	this.theme = ko.observable(this.themes()[1]);
	this.theme.subscribe(function(newValue) {
		// remove existing styles and replace with newly selected ones
		if (typeof less === 'undefined') {
			$('link#theme').attr({ href: 'css/' + self.theme() + '.css' });
		} else {
			$('link#theme').attr({ href: 'css/' + self.theme() + '.less' });
			$('style[id^="less:"]').remove();
			less.refresh();
		}
	});
};
