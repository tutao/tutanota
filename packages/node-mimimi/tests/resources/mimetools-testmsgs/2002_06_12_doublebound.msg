From: Lars Hecking <lhecking@nmrc.ie>
To: mutt-dev@mutt.org
Subject: MIME handling bug demo
Mime-Version: 1.0
Content-Type: multipart/mixed; boundary="ReaqsoxgOBHFXBhH"
Content-Disposition: inline
Content-Transfer-Encoding: 8bit
X-Mutt-Fcc: 
Status: RO
Content-Length: 11138
Lines: 226


--ReaqsoxgOBHFXBhH
Content-Type: text/plain; charset=us-ascii
Content-Disposition: inline


-- 
The plot was designed in a light vein that somehow became varicose.
                -- David Lardner

--ReaqsoxgOBHFXBhH
--ReaqsoxgOBHFXBhH
Content-Type: text/html; charset=iso-8859-15
Content-Disposition: attachment; filename="The Mutt E-Mail Client.html"
Content-Transfer-Encoding: 8bit

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"><html><head><title>The Mutt E-Mail Client</title></head>



<body>

<center>
<h1>The Mutt E-Mail Client</h1>
<p>
<cite>
"All mail clients suck.  This one just sucks less."  -me, circa 1995
</cite>
</p></center>
<p>
<a href="http://www.mutt.org/links.html#mirrors">mirrors</a>
</p><hr><p>
</p><h2>Latest News</h2>
<!-- Stick important news (security, etc.) here, cycled out to news.html. -->
<p>
Mutt 1.3.28 was released on March 13, 2002.  This is a <strong>release
candidate</strong> for 1.4.
</p><p>
Mutt 1.2.5.1 and 1.3.25 were released on January 1, 2002.  These releases both
fix a <strong>security hole</strong> which can be remotely exploited.  For more
information, see the
<a href="http://www.mutt.org/announce/mutt-1.2.5.1-1.3.25.html">release announcement</a>.
</p><p>
Mutt 1.3.24 was released on November 30, 2001.  This is a <strong>beta</strong>
development release toward the next stable public release version.  There have
been several large changes since 1.2.x, so please check the
<a href="http://www.mutt.org/changes.html">recent changes page</a>.
</p><p>
The Mutt CVS server has <strong>moved</strong> from ftp.guug.de to ftp.mutt.org.
</p><p>
<a href="http://www.mutt.org/news.html">more news</a>
</p><p></p><hr><p>
</p><h2>General Info</h2>
<p>
Mutt is a small but very powerful text-based mail client for Unix operating
systems.  The latest public release version is 1.3.28, which is a
<strong>release candidate</strong> for 1.4.  The current stable public release
version is 1.2.5.1. For more information, see the following:
</p><p>
</p><ul><li><a href="#features">Features</a>
    </li><li><a href="http://www.mutt.org/screenshots/">Screenshots</a>
    </li><li>Documentation
        <ul><li><a href="http://www.fefe.de/muttfaq/faq">FAQ</a>
        (maintained by Felix von Leitner)
            </li><li><a href="http://www.mutt.org/doc/man_page.html">Man Page</a>
            </li><li>Manual
                <ul><li><a href="http://www.mutt.org/doc/manual/">HTML</a>
                        (<a href="http://www.mutt.org/doc/manual.html.tar.gz">gzipped</a>)
                    </li><li><a href="http://www.mutt.org/doc/manual.txt">Text</a>
                        (<a href="http://www.mutt.org/doc/manual.txt.gz">gzipped</a>)
                </li></ul>
            </li><li><a href="http://www.mutt.org/changes.html">Recent Changes to Mutt</a>
                (please read if upgrading)
            </li><li><a href="http://www.mutt.org/links.html#config">Sample Configuration (.muttrc, etc.) Files</a>
            </li><li><a href="http://mutt.sourceforge.net/imap/">Mutt and IMAP</a>
                (maintained by Brendan Cully)
            </li><li>Using Mutt with GPG/PGP
                <ul><li><a href="http://www.mutt.org/doc/PGP-Notes.txt">Official Mutt doc</a>
                        (included in the release)
                    </li><li><a href="http://codesorcery.net/mutt/mutt-gnupg-howto">Alternate version</a>
                        (for PGP/GPG newbies, by Justin R. Miller)
                    </li><li><a href="http://www.linuxdoc.org/HOWTO/Mutt-GnuPG-PGP-HOWTO.html">Alternate version</a>
                        (from the LDP)
                </li></ul>
            </li><li><a href="http://mutt.blackfish.org.uk/">Mutt overview for newbies</a>
                (maintained by Bruno Postle)
        </li></ul>
    </li><li><a href="http://www.mutt.org/download.html">Downloading</a>
    </li><li><a href="http://www.mutt.org/news.html">News</a> (releases, security alerts, etc.)
    </li><li><a href="http://bugs.guug.de/db/pa/lmutt.html">Current Reported Bugs</a>
    </li><li><a href="#discuss">User Discussion</a>
        (mailing lists, newsgroups, IRC, etc.)
    </li><li><a href="http://www.mutt.org/links.html">Links</a> (user advocacy, international pages,
        user contributed docs, patches, scripts, add-ons, other recommended
        programs, etc.)
    </li><li><a href="#press">What Other People Are Saying About Mutt</a> (press)
</li></ul>
<p>
<img src="The%20Mutt%20E-Mail%20Client_files/mutt_button.gif" alt="[Mutt Mail Agent Button]" border="0" width="88" height="31">
<!--
<img src="image/mutt_bar.gif" alt="[Mutt Running Dog Bar]" border=0
width=200 height=35>
-->
</p><p></p><hr><p>
</p><h2><a name="features">Features</a></h2>
<p>
Some of Mutt's features include:
</p><p>
</p><ul><li>color support
    </li><li>message threading
    </li><li>MIME support (including RFC2047 support for encoded headers)
    </li><li>PGP/MIME (RFC2015)
    </li><li>various features to support mailing lists, including list-reply
    </li><li>active development community
    </li><li>POP3 support
    </li><li>IMAP support
    </li><li>full control of message headers when composing
    </li><li>support for multiple mailbox formats (mbox, MMDF, MH, maildir)
    </li><li><strong>highly</strong> customizable, including keybindings and macros
    </li><li>change configuration automatically based on recipients, current
        folder, etc.
    </li><li>searches using regular expressions, including an internal pattern
        matching language 
    </li><li>Delivery Status Notification (DSN) support
    </li><li>postpone message composition indefinetly for later recall
    </li><li>easily include attachments when composing, even from the command line
    </li><li>ability to specify alternate addresses for recognition of mail 
        forwarded from other accounts, with ability to set the From: headers
        on replies/etc. accordingly
    </li><li>multiple message tagging
    </li><li>reply to or forward multiple messages at once
    </li><li><i>.mailrc</i> style configuration files
    </li><li>easy to install (uses GNU autoconf)
    </li><li>compiles against either curses/ncurses or S-lang
    </li><li>translation into at least 20 languages
    </li><li>small and efficient
    </li><li><em>It's free!</em> (no cost and GPL'ed)
</li></ul>
<p>
<a href="http://www.mutt.org/screenshots/">Screenshots</a> demonstrating some of Mutt's
capabilities are available.
</p><p>
Though written from scratch, Mutt's initial interface was based largely on the
<a href="http://www.myxa.com/elm.html">ELM</a> mail client.  To a large extent,
Mutt is still very ELM-like in presentation of information in menus (and in
fact, ELM users will find it quite painless to switch as the default key
bindings are identical).  As development progressed, features found in other
popular clients such as PINE and MUSH have been added, the result being a
hybrid, or "mutt." At present, it most closely resembles the <a href="http://space.mit.edu/%7Edavis/slrn.html">SLRN</a> news client.  Mutt was
originally written by <a href="http://www.cs.hmc.edu/%7Eme/">Michael Elkins</a>
but is now developed and maintained by the members of the Mutt development
<a href="#discuss">mailing list</a>.
</p><p>
<a href="#">top</a>
</p><p></p><hr><p>
</p><h2><a name="discuss">Mutt User Discussion</a></h2>
<p>
</p><ul><li>Mailing Lists
        <ul><li>mutt-announce@mutt.org -- Announcements.
            </li><li><a href="mailto:mutt-users@mutt.org">mutt-users@mutt.org</a>
                -- General Discussion.
            </li><li><a href="http://marc.theaimsgroup.com/?l=mutt-users">mutt-users Archive</a>
                (AIMS)
            </li><li><a href="http://mail-archive.com/mutt-users%40mutt.org/">mutt-users Archive</a>
                (mail-archive.com)
            </li><li><a href="http://www.egroups.com/group/mutt-users/">mutt-users Archive</a>
                (Egroups)
            </li><li><a href="mailto:mutt-dev@mutt.org">mutt-dev@mutt.org</a> --
                Development Community.
            </li><li><a href="http://marc.theaimsgroup.com/?l=mutt-dev">mutt-dev Archive</a>
                (AIMS)
            </li><li><a href="http://www.egroups.com/group/mutt-dev/">mutt-dev Archive</a>
                (Egroups)
            </li><li><a href="mailto:mutt-po@mutt.org">mutt-po@mutt.org</a> --
                Translation Issues.
            </li><li><a href="http://www.mutt.org/mail-lists.html">Subscribe to the lists through this web site</a>.
                (You need to be subscribed to the lists to post to them.)
        </li></ul>
        <p>
    </p></li><li>Newsgroup
        <ul><li><a href="news://comp.mail.mutt/">comp.mail.mutt</a>
            </li><li><a href="http://www.deja.com/dnquery.xp?query=%7Eg%20comp.mail.mutt">comp.mail.mutt Archive</a>
                (Deja.com)
        </li></ul>
        <p>
    </p></li><li>IRC -- Channel #mutt on
        <a href="http://www.openprojects.net/irc_servers.shtml/">irc.openprojects.net</a>
</li></ul>
<p>
<a href="#">top</a>
</p><p></p><hr><p>
</p><h2><a name="press">Press About Mutt</a></h2>
<p>
</p><ul><li><a href="http://www.devshed.com/Server_Side/Administration/Mutt/page1.html">A Man And His Mutt</a>
        -- <a href="http://www.devshed.com/">Developer Shed</a>
    </li><li><a href="http://www.linuxnovice.org/main_software.php3?VIEW=VIEW&amp;t_id=146">Mutt: An e-mail user's best friend -- Part One</a>
        -- <a href="http://www.linuxnovice.org/">LinuxNovice.org</a>.
        <a href="http://www.linuxnovice.org/main_software.php3?VIEW=VIEW&amp;t_id=164">Part Two</a>
    </li><li><a href="http://www.linuxcare.com/viewpoints/ap-of-the-wk/03-31-00.epl">Mutt</a> -- Mutt was the app of the week at
        <a href="http://www.linuxcare.com/">Linuxcare</a>.
    </li><li><a href="http://www.linuxworld.com/linuxworld/lw-1999-12/lw-12-mutt.html">Man's Best Friend</a>
        -- <a href="http://www.linuxworld.com/">Linux World</a>.
    </li><li><a href="http://www.32bitsonline.com/article.php3?file=issues/199812/mutt&amp;page=1">Mutt: A Unix Mailer for Experts</a>
        -- an article from
        <a href="http://www.32bitsonline.com/">32BitsOnline</a>.
    </li><li><a href="http://www.ssc.com/lg/issue14/mutt.html">The Mutt Mailer</a>
        -- an (old) article from the
        <a href="http://www.ssc.com/lg/">Linux Gazette</a>.
</li></ul>
<p>
<a href="#">top</a>
</p><p></p><hr>
<address>Last updated on March 13, 2002 by
  <a href="http://jblosser.firinn.org/">Jeremy Blosser</a>.
</address>
URL:&lt;http://www.mutt.org/index.html&gt;<br>
Copyright © 1996-9 Michael R. Elkins.  All rights reserved.<br>
Copyright © 1999-2002 Jeremy Blosser.  All rights reserved.
<hr>
<!-- BEGIN HOSTED BY -->
<a href="http://www.gbnet.net/"><img src="The%20Mutt%20E-Mail%20Client_files/gbnettek_w100_transb.gif" width="100" height="64" alt="GBNet/NetTek" border="0" vspace="10"></a>
<br><small>hosted by<br>
<a href="http://www.gbnet.net/">GBNet/NetTek</a></small>
<!-- END HOSTED BY -->

</body></html>
--ReaqsoxgOBHFXBhH--

