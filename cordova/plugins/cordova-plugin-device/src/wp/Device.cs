/*  
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
    http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

using Microsoft.Phone.Info;
using System;
using System.IO;
using System.IO.IsolatedStorage;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class Device : BaseCommand
    {
        public void getDeviceInfo(string notused)
        {
            string res = String.Format("\"name\":\"{0}\",\"platform\":\"{1}\",\"uuid\":\"{2}\",\"version\":\"{3}\",\"model\":\"{4}\",\"manufacturer\":\"{5}\",\"isVirtual\":{6}",
                                        DeviceStatus.DeviceName,
                                        Environment.OSVersion.Platform.ToString(),
                                        UUID,
                                        Environment.OSVersion.Version.ToString(),
                                        DeviceStatus.DeviceName,
                                        DeviceStatus.DeviceManufacturer,
                                        IsVirtual ? "true" : "false");
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "{" + res + "}"));
        }


        public bool IsVirtual
        {
            get 
            {
                return (Microsoft.Devices.Environment.DeviceType == Microsoft.Devices.DeviceType.Emulator);
            }
        }

        public string UUID
        {
            get
            {
                object id;

                UserExtendedProperties.TryGetValue("ANID", out id);
                if (id != null)
                {
                    return id.ToString().Substring(2, 32);
                }

                UserExtendedProperties.TryGetValue("ANID2", out id);
                if (id != null)
                {
                    return id.ToString();
                }

                string returnVal = "???unknown???";

                using (IsolatedStorageFile appStorage = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    try
                    {
                        IsolatedStorageFileStream fileStream = new IsolatedStorageFileStream("DeviceID.txt", FileMode.Open, FileAccess.Read, appStorage);

                        using (StreamReader reader = new StreamReader(fileStream))
                        {
                            returnVal = reader.ReadLine();
                        }
                    }
                    catch (Exception /*ex*/)
                    {

                    }
                }

                return returnVal;
            }
        }
    }
}
