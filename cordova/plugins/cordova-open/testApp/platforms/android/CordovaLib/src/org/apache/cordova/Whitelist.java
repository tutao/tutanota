/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova;

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.cordova.LOG;

import android.net.Uri;

public class Whitelist {
    private static class URLPattern {
        public Pattern scheme;
        public Pattern host;
        public Integer port;
        public Pattern path;

        private String regexFromPattern(String pattern, boolean allowWildcards) {
            final String toReplace = "\\.[]{}()^$?+|";
            StringBuilder regex = new StringBuilder();
            for (int i=0; i < pattern.length(); i++) {
                char c = pattern.charAt(i);
                if (c == '*' && allowWildcards) {
                    regex.append(".");
                } else if (toReplace.indexOf(c) > -1) {
                    regex.append('\\');
                }
                regex.append(c);
            }
            return regex.toString();
        }

        public URLPattern(String scheme, String host, String port, String path) throws MalformedURLException {
            try {
                if (scheme == null || "*".equals(scheme)) {
                    this.scheme = null;
                } else {
                    this.scheme = Pattern.compile(regexFromPattern(scheme, false), Pattern.CASE_INSENSITIVE);
                }
                if ("*".equals(host)) {
                    this.host = null;
                } else if (host.startsWith("*.")) {
                    this.host = Pattern.compile("([a-z0-9.-]*\\.)?" + regexFromPattern(host.substring(2), false), Pattern.CASE_INSENSITIVE);
                } else {
                    this.host = Pattern.compile(regexFromPattern(host, false), Pattern.CASE_INSENSITIVE);
                }
                if (port == null || "*".equals(port)) {
                    this.port = null;
                } else {
                    this.port = Integer.parseInt(port,10);
                }
                if (path == null || "/*".equals(path)) {
                    this.path = null;
                } else {
                    this.path = Pattern.compile(regexFromPattern(path, true));
                }
            } catch (NumberFormatException e) {
                throw new MalformedURLException("Port must be a number");
            }
        }

        public boolean matches(Uri uri) {
            try {
                return ((scheme == null || scheme.matcher(uri.getScheme()).matches()) &&
                        (host == null || host.matcher(uri.getHost()).matches()) &&
                        (port == null || port.equals(uri.getPort())) &&
                        (path == null || path.matcher(uri.getPath()).matches()));
            } catch (Exception e) {
                LOG.d(TAG, e.toString());
                return false;
            }
        }
    }

    private ArrayList<URLPattern> whiteList;

    public static final String TAG = "Whitelist";

    public Whitelist() {
        this.whiteList = new ArrayList<URLPattern>();
    }

    /* Match patterns (from http://developer.chrome.com/extensions/match_patterns.html)
     *
     * <url-pattern> := <scheme>://<host><path>
     * <scheme> := '*' | 'http' | 'https' | 'file' | 'ftp' | 'chrome-extension'
     * <host> := '*' | '*.' <any char except '/' and '*'>+
     * <path> := '/' <any chars>
     *
     * We extend this to explicitly allow a port attached to the host, and we allow
     * the scheme to be omitted for backwards compatibility. (Also host is not required
     * to begin with a "*" or "*.".)
     */
    public void addWhiteListEntry(String origin, boolean subdomains) {
        if (whiteList != null) {
            try {
                // Unlimited access to network resources
                if (origin.compareTo("*") == 0) {
                    LOG.d(TAG, "Unlimited access to network resources");
                    whiteList = null;
                }
                else { // specific access
                    Pattern parts = Pattern.compile("^((\\*|[A-Za-z-]+):(//)?)?(\\*|((\\*\\.)?[^*/:]+))?(:(\\d+))?(/.*)?");
                    Matcher m = parts.matcher(origin);
                    if (m.matches()) {
                        String scheme = m.group(2);
                        String host = m.group(4);
                        // Special case for two urls which are allowed to have empty hosts
                        if (("file".equals(scheme) || "content".equals(scheme)) && host == null) host = "*";
                        String port = m.group(8);
                        String path = m.group(9);
                        if (scheme == null) {
                            // XXX making it stupid friendly for people who forget to include protocol/SSL
                            whiteList.add(new URLPattern("http", host, port, path));
                            whiteList.add(new URLPattern("https", host, port, path));
                        } else {
                            whiteList.add(new URLPattern(scheme, host, port, path));
                        }
                    }
                }
            } catch (Exception e) {
                LOG.d(TAG, "Failed to add origin %s", origin);
            }
        }
    }


    /**
     * Determine if URL is in approved list of URLs to load.
     *
     * @param uri
     * @return true if wide open or whitelisted
     */
    public boolean isUrlWhiteListed(String uri) {
        // If there is no whitelist, then it's wide open
        if (whiteList == null) return true;

        Uri parsedUri = Uri.parse(uri);
        // Look for match in white list
        Iterator<URLPattern> pit = whiteList.iterator();
        while (pit.hasNext()) {
            URLPattern p = pit.next();
            if (p.matches(parsedUri)) {
                return true;
            }
        }
        return false;
    }

}
