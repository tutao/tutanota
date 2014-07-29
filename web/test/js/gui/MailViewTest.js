"use strict";

describe("MailViewTest", function () {

    var assert = chai.assert;

    it(" splitMailTextQuotationTutanota", function () {
        var mailView = new tutao.tutanota.gui.MailView();
        assert.deepEqual({text: "text", quotation: "<blockquote class=\"tutanota_quote\">quote</blockquote>signature"}, mailView.splitMailTextQuotation("text<blockquote class=\"tutanota_quote\">quote</blockquote>signature"));
        assert.deepEqual({text: "", quotation: "<blockquote class=\"tutanota_quote\">quote</blockquote>"}, mailView.splitMailTextQuotation("<blockquote class=\"tutanota_quote\">quote</blockquote>"));
        assert.deepEqual({text: "text", quotation: "<blockquote class=\"tutanota_quote\"><blockquote class=\"tutanota_quote\">sub-quote</blockquote>quote</blockquote>"}, mailView.splitMailTextQuotation("text<blockquote class=\"tutanota_quote\"><blockquote class=\"tutanota_quote\">sub-quote</blockquote>quote</blockquote>"));
        assert.deepEqual({text: "text<div><blockquote class=\"tutanota_quote\">quote</blockquote></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><blockquote class=\"tutanota_quote\">quote</blockquote></div>"));
    });

    it(" splitMailTextQuotationThunderbird", function () {
        var mailView = new tutao.tutanota.gui.MailView();
        assert.deepEqual({text: "text", quotation: "<blockquote class=\"thunderbird_quote\">quote</blockquote>signature"}, mailView.splitMailTextQuotation("text<blockquote class=\"thunderbird_quote\">quote</blockquote>signature"));
        assert.deepEqual({text: "", quotation: "<blockquote class=\"tutanota_quote\">quote</blockquote>"}, mailView.splitMailTextQuotation("<blockquote class=\"tutanota_quote\">quote</blockquote>"));
        assert.deepEqual({text: "text", quotation: "<blockquote class=\"thunderbird_quote\"><blockquote class=\"thunderbird_quote\">sub-quote</blockquote>quote</blockquote>"}, mailView.splitMailTextQuotation("text<blockquote class=\"thunderbird_quote\"><blockquote class=\"thunderbird_quote\">sub-quote</blockquote>quote</blockquote>"));
        assert.deepEqual({text: "text<div><blockquote class=\"thunderbird_quote\">quote</blockquote></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><blockquote class=\"thunderbird_quote\">quote</blockquote></div>"));
    });

    it(" splitMailTextQuotationGmail", function () {
        var mailView = new tutao.tutanota.gui.MailView();
        assert.deepEqual({text: "text", quotation: "<blockquote class=\"gmail_quote\">quote</blockquote>signature"}, mailView.splitMailTextQuotation("text<blockquote class=\"gmail_quote\">quote</blockquote>signature"));
        assert.deepEqual({text: "", quotation: "<blockquote class=\"gmail_quote\">quote</blockquote>"}, mailView.splitMailTextQuotation("<blockquote class=\"gmail_quote\">quote</blockquote>"));
        assert.deepEqual({text: "text", quotation: "<blockquote class=\"gmail_quote\"><blockquote class=\"gmail_quote\">sub-quote</blockquote>quote</blockquote>"}, mailView.splitMailTextQuotation("text<blockquote class=\"gmail_quote\"><blockquote class=\"gmail_quote\">sub-quote</blockquote>quote</blockquote>"));
        assert.deepEqual({text: "text<div><blockquote class=\"gmail_quote\">quote</blockquote></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><blockquote class=\"gmail_quote\">quote</blockquote></div>"));
    });

    it(" splitMailTextQuotationOutlook", function () {
        var mailView = new tutao.tutanota.gui.MailView();
        assert.deepEqual({text: "text", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>signature"}, mailView.splitMailTextQuotation("text<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>signature"));
        assert.deepEqual({text: "", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>"}, mailView.splitMailTextQuotation("<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>"));
        assert.deepEqual({text: "text", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\"><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">sub-quote</div>quote</div>"}, mailView.splitMailTextQuotation("text<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\"><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">sub-quote</div>quote</div>"));
        assert.deepEqual({text: "text<div></div>", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div>"}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote</div></div>"));
        // multiple quotes in parallel
        assert.deepEqual({text: "text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div>", quotation: ""}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div>"));
        // two quotes on different levels (parallel)
        assert.deepEqual({text: "text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div></div>", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div>"}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1</div></div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div>"));
        // two quotes on different levels (in one hierarchy)
        assert.deepEqual({text: "text<div></div>", quotation: "<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div>"}, mailView.splitMailTextQuotation("text<div><div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote1<div style=\"border-left-color: blue; border-left-width: 1.5pt; border-left-style: solid;\">quote2</div></div></div>"));
    });

    it(" splitMailTextQuotationNoQuotation", function () {
        var mailView = new tutao.tutanota.gui.MailView();
        assert.deepEqual({text: "text", quotation: ""}, mailView.splitMailTextQuotation("text"));
    });

});