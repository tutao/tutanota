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
package org.apache.cordova.file;

import android.os.Environment;
import android.os.StatFs;

import java.io.File;

/**
 * This class provides file directory utilities.
 * All file operations are performed on the SD card.
 *
 * It is used by the FileUtils class.
 */
public class DirectoryManager {

    @SuppressWarnings("unused")
    private static final String LOG_TAG = "DirectoryManager";

    /**
     * Determine if a file or directory exists.
     * @param name				The name of the file to check.
     * @return					T=exists, F=not found
     */
    public static boolean testFileExists(String name) {
        boolean status;

        // If SD card exists
        if ((testSaveLocationExists()) && (!name.equals(""))) {
            File path = Environment.getExternalStorageDirectory();
            File newPath = constructFilePaths(path.toString(), name);
            status = newPath.exists();
        }
        // If no SD card
        else {
            status = false;
        }
        return status;
    }

    /**
     * Get the free space in external storage
     *
     * @return 		Size in KB or -1 if not available
     */
    public static long getFreeExternalStorageSpace() {
        String status = Environment.getExternalStorageState();
        long freeSpaceInBytes = 0;

        // Check if external storage exists
        if (status.equals(Environment.MEDIA_MOUNTED)) {
            freeSpaceInBytes = getFreeSpaceInBytes(Environment.getExternalStorageDirectory().getPath());
        } else {
            // If no external storage then return -1
            return -1;
        }

        return freeSpaceInBytes / 1024;
    }

    /**
     * Given a path return the number of free bytes in the filesystem containing the path.
     *
     * @param path to the file system
     * @return free space in bytes
     */
    public static long getFreeSpaceInBytes(String path) {
        try {
            StatFs stat = new StatFs(path);
            long blockSize = stat.getBlockSize();
            long availableBlocks = stat.getAvailableBlocks();
            return availableBlocks * blockSize;
        } catch (IllegalArgumentException e) {
            // The path was invalid. Just return 0 free bytes.
            return 0;
        }
    }

    /**
     * Determine if SD card exists.
     *
     * @return				T=exists, F=not found
     */
    public static boolean testSaveLocationExists() {
        String sDCardStatus = Environment.getExternalStorageState();
        boolean status;

        // If SD card is mounted
        if (sDCardStatus.equals(Environment.MEDIA_MOUNTED)) {
            status = true;
        }

        // If no SD card
        else {
            status = false;
        }
        return status;
    }

    /**
     * Create a new file object from two file paths.
     *
     * @param file1			Base file path
     * @param file2			Remaining file path
     * @return				File object
     */
    private static File constructFilePaths (String file1, String file2) {
        File newPath;
        if (file2.startsWith(file1)) {
            newPath = new File(file2);
        }
        else {
            newPath = new File(file1 + "/" + file2);
        }
        return newPath;
    }
}
