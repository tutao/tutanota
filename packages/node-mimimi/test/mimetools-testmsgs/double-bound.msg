Return-Path: eryq@rhine.gsfc.nasa.gov
Sender: john-bigboote
Date: Thu, 11 Apr 1996 01:10:30 -0500
From: Eryq <eryq@rhine.gsfc.nasa.gov>
Organization: Yoyodyne Propulsion Systems
X-Mailer: Mozilla 2.0 (X11; I; Linux 1.1.18 i486)
MIME-Version: 1.0
To: john-bigboote@eryq.pr.mcs.net
Subject: test of double-boundary behavior
Content-Type: multipart/mixed; boundary="------------299A70B339B65A93542D2AE"

This is a multi-part message in MIME format.

--------------299A70B339B65A93542D2AE
--------------299A70B339B65A93542D2AE
Content-Type: text/html; charset=us-ascii
Content-Transfer-Encoding: 7bit
Subject: [2] this should be text/html, but double-bound may mess it up

<p>This message contains double boundaries all over the
place.  We want to make sure that bad things don't happen.

<p>One bad thing is that the doubled-boundary above can
be mistaken for a single boundary plus a bogus premature
end of headers.

--------------299A70B339B65A93542D2AE
--------------299A70B339B65A93542D2AE
Content-Type: text/html; charset=us-ascii
Subject: [4] this should be text/html, but double-bound may mess it up

<p>Hello?  Am I here?

--------------299A70B339B65A93542D2AE

--------------299A70B339B65A93542D2AE
Content-Type: text/html; charset=us-ascii
Subject: [6] this should be text/html, but double-bound may mess it up

<p>Hello?  Am I here?

--------------299A70B339B65A93542D2AE
Content-Type: text/html; charset=us-ascii
Subject: [7] this header is improperly terminated
--------------299A70B339B65A93542D2AE
Content-Type: text/html; charset=us-ascii
Subject: [8] this body is empty

--------------299A70B339B65A93542D2AE
Content-Type: text/html; charset=us-ascii
Subject: [9] this body also empty

--------------299A70B339B65A93542D2AE
Content-Type: image/gif; name="3d-eye.gif"
Content-Transfer-Encoding: base64
Subject: [10] just an image

R0lGODdhKAAoAPMAAAAAAAAAzN3u/76+voiIiG5ubszd7v///+fn5wAAAAAAAAAAAAAAAAAA
AAAAAAAAACwAAAAAKAAoAAAE/hDJSau9eJbMOy4bMoxkaZ5oCkoD6L5wLMfiWns41oZt7lM7
VujnC96IRVsPWQE4nxPjkvmsQmu8oc/KBUSVWk7XepGGLeNrxoxJO1MjILjthg/kWXQ6wO/7
+3dCeRRjfAKHiImJAV+DCF0BiW5VAo1CElaRh5NjlkeYmpyTgpcTAKGiaaSfpwKpVQaxVatL
rU8GaQdOBAQAB7+yXliXTrgAxsW4vFabv8BOtBsBt7cGvwCIT9nOyNEIxuC4zrqKzc9XbODJ
vs7Y5ewH3d7Fxe3jB4rj8t6PuNa6r2bhKQXN17FYCBMqTGiBzSNhx5g0nEMhlsSJjiRYvDjw
E0cdGxQ/gswosoKUkmuU2FnJcsSKGTBjypxJsyaICAA7
--------------299A70B339B65A93542D2AE--


