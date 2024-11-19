MIME-Version: 1.0
From: Lord John Whorfin <whorfin@yoyodyne.com>
To: <john-yaya@yoyodyne.com>
Subject: A complex nested multipart example
Content-Type: multipart/mixed;
     boundary=unique-boundary-1

The preamble of the outer multipart message.
Mail readers that understand multipart format
should ignore this preamble.
If you are reading this text, you might want to
consider changing to a mail reader that understands
how to properly display multipart messages.
--unique-boundary-1

Part 1 of the outer message.
[Note that the preceding blank line means
no header fields were given and this is text,
with charset US ASCII.  It could have been
done with explicit typing as in the next part.]

--unique-boundary-1
Content-type: text/plain; charset=US-ASCII

Part 2 of the outer message.
This could have been part of the previous part,
but illustrates explicit versus implicit
typing of body parts.

--unique-boundary-1
Subject: Part 3 of the outer message is multipart!
Content-Type: multipart/parallel;
     boundary=unique-boundary-2

A one-line preamble for the inner multipart message.
--unique-boundary-2
Content-Type: image/gif
Content-Transfer-Encoding: base64
Content-Disposition: inline; filename="3d-vise.gif"
Subject: Part 1 of the inner message is a GIF, "3d-vise.gif"

R0lGODdhKAAoAOMAAAAAAAAAgB6Q/y9PT25ubnCAkKBSLb6+vufn5/Xes/+lAP/6zQAAAAAA
AAAAAAAAACwAAAAAKAAoAAAE/hDJSau9eJLMOyYbcoxkaZ5oCkoH6L5wLMfiWqd4btZhmxbA
oFCY47EIqMJgyWw2ATjj7aRkAq5YwDMl9VGtKO0SiuoiTVlscsxt9c4HgXxUIA0EAVOVfDKT
8Hl1B3kDAYYle202XnGGgoMHhYckiWVuR3+OTgCGeZRslotwgJ2lnYigfZdTjQULr7ALBZN0
qTurjHgLKAu0B5Wqopm7J72etQN8t8Ijury+wMtvw8/Hv7Ylfs0BxCbGqMmK0yOOQ0GTCgrR
2bhwJGlXJQYG6mMKoeNoWSbzCWIACe5JwxQm3AkDAbUAQCiQhDZEBeBl6afgCsOBrD45edIv
QceGWSMevpOYhl6CkydBHhBZQmGKjihVshypjB9ClAHZMTugzOU7mzhBPiSZ5uDNnA7b/aTZ
0mhMnfl0pDBFa6bUElSPWb0qtYuHrxlwcR17YsWMs2jTql3LFkQEADs=
--unique-boundary-2
Content-Type: image/gif
Content-Transfer-Encoding: base64
Content-Disposition: inline; filename="3d-eye.gif"
Subject: Part 2 of the inner message is another GIF, "3d-eye.gif"

R0lGODdhKAAoAPMAAAAAAAAAzN3u/76+voiIiG5ubszd7v///+fn5wAAAAAAAAAAAAAAAAAA
AAAAAAAAACwAAAAAKAAoAAAE/hDJSau9eJbMOy4bMoxkaZ5oCkoD6L5wLMfiWns41oZt7lM7
VujnC96IRVsPWQE4nxPjkvmsQmu8oc/KBUSVWk7XepGGLeNrxoxJO1MjILjthg/kWXQ6wO/7
+3dCeRRjfAKHiImJAV+DCF0BiW5VAo1CElaRh5NjlkeYmpyTgpcTAKGiaaSfpwKpVQaxVatL
rU8GaQdOBAQAB7+yXliXTrgAxsW4vFabv8BOtBsBt7cGvwCIT9nOyNEIxuC4zrqKzc9XbODJ
vs7Y5ewH3d7Fxe3jB4rj8t6PuNa6r2bhKQXN17FYCBMqTGiBzSNhx5g0nEMhlsSJjiRYvDjw
E0cdGxQ/gswosoKUkmuU2FnJcsSKGTBjypxJsyaICAA7
--unique-boundary-2--

The epilogue for the inner multipart message.

--unique-boundary-1
Content-type: text/richtext

This is <bold>part 4 of the outer message</bold>
<smaller>as defined in RFC1341</smaller><nl>
<nl>
Isn't it <bigger><bigger>cool?</bigger></bigger>

--unique-boundary-1
Content-Type: message/rfc822; name="/evil/filename";

From: (mailbox in US-ASCII)
To: (address in US-ASCII)
Subject: Part 5 of the outer message is itself an RFC822 message!
Content-Type: Text/plain; charset=ISO-8859-1
Content-Transfer-Encoding: Quoted-printable

Part 5 of the outer message is itself an RFC822 message!

--unique-boundary-1--

The epilogue for the outer message.

