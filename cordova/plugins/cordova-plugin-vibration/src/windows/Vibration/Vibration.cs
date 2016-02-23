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

using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Text;
using Windows.Phone.Devices.Notification;

namespace Vibration
{
    public sealed class Vibration
    {
        private static VibrationDevice _vibrationDevice = VibrationDevice.GetDefault();

        public static void vibrate([ReadOnlyArray()] object[] args)
        {
            // set default
            int duration = 200;

            try 
            {
                duration = Convert.ToInt32(args[0]);
            }
            catch 
            { 

            }

            _vibrationDevice.Vibrate(TimeSpan.FromMilliseconds(duration));
        }

        public static void cancelVibration()
        {
            _vibrationDevice.Cancel();
        }
    }
}
