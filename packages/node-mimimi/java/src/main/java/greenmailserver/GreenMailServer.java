package greenmailserver;

import com.icegreen.greenmail.user.GreenMailUser;
import com.icegreen.greenmail.user.UserException;
import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.ByteArrayInputStream;


public class GreenMailServer {
	public static final String imapsHost = "127.0.0.1";

	private GreenMail greenMail;

	public GreenMailUser userMap;
	public GreenMailUser userSug;

	public GreenMailServer(Integer p) {
		setSystemClassLoaderForCurrentThreadContext();

		ServerSetup defaultImapsProps = new ServerSetup(p, imapsHost, "imaps");
		try {
			greenMail = new GreenMail(defaultImapsProps);
		} catch (Exception e) {
			e.printStackTrace();
		}

		greenMail.start();

		try {
			userMap = greenMail.getUserManager().createUser("map@example.org", "map@example.org", "map");
			userSug = greenMail.getUserManager().createUser("sug@example.org", "sug@example.org", "sug");
		} catch (UserException e) {
			throw new RuntimeException(e);
		}
	}

	public void stop() {
		greenMail.stop();
	}

	public void store_mail(String recipientAddress, String mimeMsg) throws MessagingException {
	    var recipient = greenMail.getUserManager().getUserByEmail(recipientAddress);
		var mimeMessage = new MimeMessage(null, new ByteArrayInputStream(mimeMsg.getBytes()));
		recipient.deliver(mimeMessage);
	}


	// ========= configuration required for (rust) jni interface ==================

	// For the class loaded by jni, .getCurrentThread().getContextClassLoader() will be null
	// set it to systemClassLoader
	public static void setSystemClassLoaderForCurrentThreadContext() {
		if (Thread.currentThread().getContextClassLoader() == null) {
			ClassLoader cl = ClassLoader.getSystemClassLoader();
			Thread.currentThread().setContextClassLoader(cl);
		}
	}

}
