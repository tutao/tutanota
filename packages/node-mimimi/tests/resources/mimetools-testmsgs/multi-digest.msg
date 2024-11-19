From: Nathaniel Borenstein <nsb@bellcore.com>
To:  Ned Freed <ned@innosoft.com>
Subject: Sample digest message
MIME-Version: 1.0
Content-type: multipart/digest; boundary="simple
 boundary"

This is the preamble.  It is to be ignored, though it
is a handy place for mail composers to include an
explanatory note to non-MIME conformant readers.
--simple boundary

From: noone@nowhere.org
Subject: embedded message 1

This is implicitly-typed ASCII text.
It does NOT end with a linebreak.
--simple boundary
Content-type: message/rfc822; charset=us-ascii

From: noone@nowhere.org
Subject: embedded message 2
Content-type: text

This is explicitly typed plain ASCII text.
It DOES end with a linebreak.

--simple boundary--
This is the epilogue.  It is also to be ignored.

