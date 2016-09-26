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
     * Get the free disk space
     * 
     * @return 		Size in KB or -1 if not available
     */
    public static long getFreeDiskSpace(boolean checkInternal) {
        String status = Environment.getExternalStorageState();
        long freeSpace = 0;

        // If SD card exists
        if (status.equals(Environment.MEDIA_MOUNTED)) {
            freeSpace = freeSpaceCalculation(Environment.getExternalStorageDirectory().getPath());
        }
        else if (checkInternal) {
            freeSpace = freeSpaceCalculation("/");
        }
        // If no SD card and we haven't been asked to check the internal directory then return -1
        else {
            return -1;
        }

        return freeSpace;
    }

    /**
     * Given a path return the number of free KB
     * 
     * @param path to the file system
     * @return free space in KB
     */
    private static long freeSpaceCalculation(String path) {
        StatFs stat = new StatFs(path);
        long blockSize = stat.getBlockSize();
        long availableBlocks = stat.getAvailableBlocks();
        return availableBlocks * blockSize / 1024;
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
