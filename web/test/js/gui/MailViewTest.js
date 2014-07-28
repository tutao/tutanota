"use strict";

goog.provide('MailViewTest');

TestCase("MailViewTest", {
	
	"test splitMailTextQuotationTutanota": function() {
		var mailView = new tutao.tutanota.gui.MailView();
		assertEquals({text: "text", quotation: "<blockquote class=\"tutanota_quote\">quote</blockquote>signature"}, mailView.splitMailTextQuotation("text<blockquote class=\"tutanota_quote\">quote</blockquote>signature"));
		assertEquals({text: "", quotation: "<blockquote class=\"tutanota_quote\">quote</blockquote>"}, mailView.splitMailTextQuotation("<blockquote class=\"tutanota_quote\">quote</blockquote>"));
		assertEquals({text: "text", quotation: "<blockquote class=\"tutanota_quote\"><blockquote class=\"tutanota_quote\">sub-quote</blockquote>quote</blockquote>"}, mailView.splitMailTextQuotation("text<blockquote class=\"tutanota_quote\"><blockquote class=\"tutanota_quote\">sub-quote</blockquote>quote</blockquote>"));
		assertEquals({text: "text<div><blockquote class=\"tutanota_quote\">quote</blockquote></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><blockquote class=\"tutanota_quote\">quote</blockquote></div>"));
	},

	"test splitMailTextQuotationThunderbird": function() {
		var mailView = new tutao.tutanota.gui.MailView();
		assertEquals({text: "text", quotation: "<blockquote class=\"thunderbird_quote\">quote</blockquote>signature"}, mailView.splitMailTextQuotation("text<blockquote class=\"thunderbird_quote\">quote</blockquote>signature"));
		assertEquals({text: "", quotation: "<blockquote class=\"tutanota_quote\">quote</blockquote>"}, mailView.splitMailTextQuotation("<blockquote class=\"tutanota_quote\">quote</blockquote>"));
		assertEquals({text: "text", quotation: "<blockquote class=\"thunderbird_quote\"><blockquote class=\"thunderbird_quote\">sub-quote</blockquote>quote</blockquote>"}, mailView.splitMailTextQuotation("text<blockquote class=\"thunderbird_quote\"><blockquote class=\"thunderbird_quote\">sub-quote</blockquote>quote</blockquote>"));
		assertEquals({text: "text<div><blockquote class=\"thunderbird_quote\">quote</blockquote></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><blockquote class=\"thunderbird_quote\">quote</blockquote></div>"));
	},

	"test splitMailTextQuotationGmail": function() {
		var mailView = new tutao.tutanota.gui.MailView();
		assertEquals({text: "text", quotation: "<blockquote class=\"gmail_quote\">quote</blockquote>signature"}, mailView.splitMailTextQuotation("text<blockquote class=\"gmail_quote\">quote</blockquote>signature"));
		assertEquals({text: "", quotation: "<blockquote class=\"gmail_quote\">quote</blockquote>"}, mailView.splitMailTextQuotation("<blockquote class=\"gmail_quote\">quote</blockquote>"));
		assertEquals({text: "text", quotation: "<blockquote class=\"gmail_quote\"><blockquote class=\"gmail_quote\">sub-quote</blockquote>quote</blockquote>"}, mailView.splitMailTextQuotation("text<blockquote class=\"gmail_quote\"><blockquote class=\"gmail_quote\">sub-quote</blockquote>quote</blockquote>"));
		assertEquals({text: "text<div><blockquote class=\"gmail_quote\">quote</blockquote></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><blockquote class=\"gmail_quote\">quote</blockquote></div>"));
	},

	"test splitMailTextQuotationOutlook": function() {
		var mailView = new tutao.tutanota.gui.MailView();
		assertEquals({text: "text", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>signature"}, mailView.splitMailTextQuotation("text<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>signature"));
		assertEquals({text: "", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>"}, mailView.splitMailTextQuotation("<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>"));
		assertEquals({text: "text", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\"><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">sub-quote</div>quote</div>"}, mailView.splitMailTextQuotation("text<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\"><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">sub-quote</div>quote</div>"));
		assertEquals({text: "text<div></div>", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>"}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div></div>"));
		// multiple quotes in parallel
		assertEquals({text: "text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div>"));
		// two quotes on different levels (parallel)
		assertEquals({text: "text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div></div>", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div>"}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div></div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div>"));
		// two quotes on different levels (in one hierarchy)
		assertEquals({text: "text<div></div>", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div>"}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div></div>"));
	},

	"test splitMailTextQuotationNoQuotation": function() {
		var mailView = new tutao.tutanota.gui.MailView();
		assertEquals({text: "text", quotation: ""}, mailView.splitMailTextQuotation("text"));
	}
});
