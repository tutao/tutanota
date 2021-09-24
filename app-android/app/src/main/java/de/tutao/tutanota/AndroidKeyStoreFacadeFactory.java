package de.tutao.tutanota;

import android.content.Context;
import android.os.Build;

import de.tutao.tutanota.credentials.DataKeyGenerator;
import de.tutao.tutanota.credentials.DataKeyGeneratorBeforeAPI30;
import de.tutao.tutanota.credentials.DataKeyGeneratorFromAPI30;

/**
 * We use a factory for this to be able to cleanly separate code for different Android API versions.
 */
public class AndroidKeyStoreFacadeFactory {
	public static AndroidKeyStoreFacade create(Context context) {
		DataKeyGenerator dataKeyGenerator;
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
			dataKeyGenerator = new DataKeyGeneratorBeforeAPI30();
		} else {
			dataKeyGenerator = new DataKeyGeneratorFromAPI30();
		}
		return new AndroidKeyStoreFacade(context, dataKeyGenerator);
	}
}
