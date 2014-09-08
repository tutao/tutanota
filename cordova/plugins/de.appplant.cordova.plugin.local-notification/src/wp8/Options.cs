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
using System.Runtime.Serialization;

namespace De.APPPlant.Cordova.Plugin.LocalNotification
{
    /// <summary>
    /// Represents LiveTile options
    /// </summary>
    [DataContract]
    class Options
    {
        /// <summary>
        /// The Title that is displayed
        /// </summary>
        [DataMember(IsRequired = false, Name = "title")]
        public string Title { get; set; }

        /// <summary>
        /// The message that is displayed
        /// </summary>
        [DataMember(IsRequired = false, Name = "message")]
        public string Message { get; set; }

        /// <summary>
        /// Gekürzte Nachricht (alles ab dem Zeilenumbruch entfernt)
        /// </summary>
        public string ShortMessage
        {
            get
            {
                string[] separator = new string[] { "\r\n", "\n" };

                return Message.Split(separator, StringSplitOptions.RemoveEmptyEntries).First();
            }
        }

        /// <summary>
        /// Displays number badge to notification
        /// </summary>
        [DataMember(IsRequired = false, Name = "badge")]
        public int Badge { get; set; }

        /// <summary>
        /// Tile count
        /// </summary>
        [DataMember(IsRequired = false, Name = "Date")]
        public int Date { get; set; }

        /// <summary>
        /// Has the options of daily', 'weekly',''monthly','yearly')
        /// </summary>
        [DataMember(IsRequired = false, Name = "repeat")]
        public string Repeat { get; set; }

        /// <summary>
        /// Notification specific data
        /// </summary>
        [DataMember(IsRequired = false, Name = "json")]
        public string JSON { get; set; }

        /// <summary>
        /// Message-ID
        /// </summary>
        [DataMember(IsRequired = false, Name = "id")]
        public string ID { get; set; }

        /// <summary>
        /// Setting this flag will make it so the notification is automatically canceled when the user clicks it
        /// </summary>
        [DataMember(IsRequired = false, Name = "autoCancel")]
        public bool AutoCancel { get; set; }

        /// <summary>
        /// The notification small background image to be displayed
        /// </summary>
        [DataMember(IsRequired = false, Name = "smallImage")]
        public string SmallImage { get; set; }

        /// <summary>
        /// The notification background image to be displayed
        /// </summary>
        [DataMember(IsRequired = false, Name = "image")]
        public string Image { get; set; }

        /// <summary>
        /// The notification wide background image to be displayed
        /// </summary>
        [DataMember(IsRequired = false, Name = "wideImage")]
        public string WideImage { get; set; }
    }
}
