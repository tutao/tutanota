/*
    Copyright 2013-2014 appPlant UG

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

using System;
using System.Linq;

using Microsoft.Phone.Shell;

using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;
using System.IO.IsolatedStorage;

namespace Cordova.Extension.Commands
{
    public class Badge : BaseCommand
    {
        /// <summary>
        /// Name for the shared preferences
        /// <summary>
        private const string KEY = "badge";

        /// <summary>
        /// Clears the count property of the live tile
        /// </summary>
        public void clearBadge(string args)
        {
            setBadge(args);
        }

        /// <summary>
        /// Sets the count property of the live tile
        /// </summary>
        public void setBadge(string args)
        {
            // Application Tile is always the first Tile, even if it is not pinned to Start.
            ShellTile tile = ShellTile.ActiveTiles.First();

            // Application should always be found
            if (tile != null)
            {
                string[] ary = JsonHelper.Deserialize<string[]>(args);
                int count = 0;
                string title = "";

                try
                {
                    count = int.Parse(ary[0]);
                }
                catch (FormatException) { };

                if (ary.Length > 1)
                {
                    title = ary[1].Replace("%d", "{0}");
                    title = String.Format(title, count);
                }

                StandardTileData TileData = new StandardTileData
                {
                    Count = count,
                    BackTitle = title
                };

                SaveBadge(count);

                tile.Update(TileData);

                DispatchCommandResult();
            }
        }

        /// <summary>
        /// Gets the count property of the live tile
        /// </summary>
        public void getBadge(string args)
        {
            // Application Tile is always the first Tile, even if it is not pinned to Start.
            ShellTile tile = ShellTile.ActiveTiles.First();

            // Application should always be found
            if (tile != null)
            {
                IsolatedStorageSettings settings = IsolatedStorageSettings.ApplicationSettings;
                int badge = 0;
                PluginResult result;

                if (settings.Contains(KEY))
                {
                    badge = (int)settings[KEY];
                }

                result = new PluginResult(PluginResult.Status.OK, badge);

                DispatchCommandResult(result);
            }
        }

        /// <summery>
        /// Informs if the app has the permission to show badges.
        /// </summery>
        public void hasPermission(string args)
        {
            PluginResult result;

            result = new PluginResult(PluginResult.Status.OK, true);

            DispatchCommandResult(result);
        }

        /// <summery>
        /// Ask for permission to show badges.
        /// </summery>
        public void promptForPermission(string args)
        {
            DispatchCommandResult();
        }

        /// <summary>
        /// Persist the badge of the app icon so that `getBadge` is able to return
        /// the badge number back to the client.
        /// </summary>
        private void SaveBadge(int badge)
        {
            IsolatedStorageSettings settings = IsolatedStorageSettings.ApplicationSettings;

            if (settings.Contains(KEY))
            {
                settings[KEY] = badge;
            }
            else
            {
                settings.Add(KEY, badge);
            }
        }
    }
}
