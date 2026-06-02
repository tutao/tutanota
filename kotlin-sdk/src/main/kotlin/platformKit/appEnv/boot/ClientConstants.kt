/* Generated file. Do not edit by hand!*/
package de.tutao.platformKit.appEnv.boot;

import org.tutao.env.assertMainOrNodeBoot;
import org.tutao.clientDetector.clientPlatform;
assertMainOrNodeBoot();

public enum errorReportClientType { browser, android, ios, macOS, linux, windows }
public enum browserType { cHROME, fIREFOX, eDGE, sAFARI, aNDROID, oPERA, oTHER }
public enum deviceType { iPHONE, iPAD, aNDROID, dESKTOP, oTHERMOBILE }
public data class browserData(needsMicrotaskHack: boolean, needsExplicitIDBIds: boolean, indexedDbSupported: boolean, clientPlatform: clientPlatform)
const val companyTeamLabel: string = "Tuta Team";

