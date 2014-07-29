"use strict";

describe("MailViewBlockquoteSplittingTest", function () {

    var assert = chai.assert;

    it(" after first", function () {
        var html = $("<div><blockquote>1<blockquote>2<blockquote>3</blockquote>4</blockquote>5</blockquote></div>");
        tutao.tutanota.gui.MailView.splitBlockquote(html.find("blockquote").get(0).childNodes[0], html.get(0));
        assert.equal("<blockquote>1</blockquote><p>&nbsp;</p><blockquote><blockquote>2<blockquote>3</blockquote>4</blockquote>5</blockquote>", html.html());
    });

    it(" after second", function () {
        var html = $("<div><blockquote>1<blockquote>2<blockquote>3</blockquote>4</blockquote>5</blockquote></div>");
        tutao.tutanota.gui.MailView.splitBlockquote(html.find("blockquote").get(1).childNodes[0], html.get(0));
        assert.equal("<blockquote>1<blockquote>2</blockquote></blockquote><p>&nbsp;</p><blockquote><blockquote><blockquote>3</blockquote>4</blockquote>5</blockquote>", html.html());
    });

    it(" after third", function () {
        var html = $("<div><blockquote>1<blockquote>2<blockquote>3</blockquote>4</blockquote>5</blockquote></div>");
        tutao.tutanota.gui.MailView.splitBlockquote(html.find("blockquote").get(2).childNodes[0], html.get(0));
        assert.equal("<blockquote>1<blockquote>2<blockquote>3</blockquote></blockquote></blockquote><p>&nbsp;</p><blockquote><blockquote>4</blockquote>5</blockquote>", html.html());
    });

    it(" after fourth", function () {
        var html = $("<div><blockquote>1<blockquote>2<blockquote>3</blockquote>4</blockquote>5</blockquote></div>");
        tutao.tutanota.gui.MailView.splitBlockquote(html.find("blockquote").get(1).childNodes[2], html.get(0));
        assert.equal("<blockquote>1<blockquote>2<blockquote>3</blockquote>4</blockquote></blockquote><p>&nbsp;</p><blockquote>5</blockquote>", html.html());
    });

    it(" after fifth", function () {
        var html = $("<div><blockquote>1<blockquote>2<blockquote>3</blockquote>4</blockquote>5</blockquote></div>");
        tutao.tutanota.gui.MailView.splitBlockquote(html.find("blockquote").get(0).childNodes[2], html.get(0));
        assert.equal("<blockquote>1<blockquote>2<blockquote>3</blockquote>4</blockquote>5</blockquote><p>&nbsp;</p>", html.html());
    });

    it(" that the class and style attributes are copied", function () {
        var html = $("<div><blockquote class=\"a\" style=\"border-width: 1px;\">1<blockquote>2</blockquote></blockquote></div>");
        tutao.tutanota.gui.MailView.splitBlockquote(html.find("blockquote").get(0).childNodes[0], html.get(0));
        assert.isTrue(HtmlTestUtils.equals($("<div><blockquote class=\"a\" style=\"border-width: 1px;\">1</blockquote><p>&nbsp;</p><blockquote class=\"a\" style=\"border-width: 1px;\"><blockquote>2</blockquote></blockquote></div>").get(0), html.get(0)));
    });

    it(" that linebreaks are split correctly", function () {
        var html = $("<div><blockquote><br><br><br><br></blockquote></div>");
        tutao.tutanota.gui.MailView.splitBlockquote(html.find("blockquote").get(0).childNodes[1], html.get(0));
        assert.equal("<blockquote><br><br></blockquote><p>&nbsp;</p><blockquote><br><br></blockquote>", html.html());
    });

    it(" that splitting text works fine", function () {
        var html = $("<div><blockquote class=\"tutanota_quote\">abcd</blockquote></div>");
        var range = document.createRange();
        var textNode = html.find("blockquote").get(0).childNodes[0];
        $("body").append(html);
        range.setStart(textNode, 2);
        range.setEnd(textNode, 2);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        tutao.tutanota.gui.MailView.handleMailComposerReturnKey(null, {target: html.get(0), keyCode: 13});

        assert.equal("<blockquote class=\"tutanota_quote\">ab</blockquote><p>&nbsp;</p><blockquote class=\"tutanota_quote\">cd</blockquote>", html.html());
    });

    it(" that splitting text works fine with linebreaks", function () {
        var html = $("<div><blockquote class=\"tutanota_quote\"><br><br><br><br></blockquote></div>");
        var range = document.createRange();
        var node = html.find("blockquote").get(0).childNodes[1];
        $("body").append(html);
        range.setStart(node, 0);
        range.setEnd(node, 0);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        tutao.tutanota.gui.MailView.handleMailComposerReturnKey(null, {target: html.get(0), keyCode: 13});

        assert.equal("<blockquote class=\"tutanota_quote\"><br><br></blockquote><p>&nbsp;</p><blockquote class=\"tutanota_quote\"><br><br></blockquote>", html.html());
    });

    it(" that splitting text works fine with linebreaks and range offset", function () {
        var html = $("<div><blockquote class=\"tutanota_quote\"><br><br><br><br></blockquote></div>");
        var range = document.createRange();
        var node = html.find("blockquote").get(0);
        $("body").append(html);
        range.setStart(node, 1);
        range.setEnd(node, 1);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        tutao.tutanota.gui.MailView.handleMailComposerReturnKey(null, {target: html.get(0), keyCode: 13});

        assert.equal("<blockquote class=\"tutanota_quote\"><br><br></blockquote><p>&nbsp;</p><blockquote class=\"tutanota_quote\"><br><br></blockquote>", html.html());
    });

    it(" default behaviour for normal carriage returns (outside of a blockquote)", function () {
        var html = $("<div>Start<blockquote class=\"tutanota_quote\">abcd</blockquote></div>");
        var range = document.createRange();
        var textNode = html.get(0).childNodes[0];
        $("body").append(html);
        range.setStart(textNode, 2);
        range.setEnd(textNode, 2);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        tutao.tutanota.gui.MailView.handleMailComposerReturnKey(null, {target: html.get(0), keyCode: 13});

        assert.equal("Start<blockquote class=\"tutanota_quote\">abcd</blockquote>", html.html());
    });


});