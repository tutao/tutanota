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

using Microsoft.Phone.Tasks;
using Microsoft.Phone.UserData;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Runtime.Serialization;
using System.Windows;
using DeviceContacts = Microsoft.Phone.UserData.Contacts;


namespace WPCordovaClassLib.Cordova.Commands
{
    [DataContract]
    public class SearchOptions
    {
        [DataMember]
        public string filter { get; set; }

        [DataMember]
        public bool multiple { get; set; }

        [DataMember]
        public string[] desiredFields { get; set; }
    }

    [DataContract]
    public class ContactSearchParams
    {
        [DataMember]
        public string[] fields { get; set; }

        [DataMember]
        public SearchOptions options { get; set; }
    }

    [DataContract]
    public class JSONContactAddress
    {
        [DataMember]
        public string formatted { get; set; }

        [DataMember]
        public string type { get; set; }

        [DataMember]
        public string streetAddress { get; set; }

        [DataMember]
        public string locality { get; set; }

        [DataMember]
        public string region { get; set; }

        [DataMember]
        public string postalCode { get; set; }

        [DataMember]
        public string country { get; set; }

        [DataMember]
        public bool pref { get; set; }
    }

    [DataContract]
    public class JSONContactName
    {
        [DataMember]
        public string formatted { get; set; }

        [DataMember]
        public string familyName { get; set; }

        [DataMember]
        public string givenName { get; set; }

        [DataMember]
        public string middleName { get; set; }

        [DataMember]
        public string honorificPrefix { get; set; }

        [DataMember]
        public string honorificSuffix { get; set; }
    }

    [DataContract]
    public class JSONContactField
    {
        [DataMember]
        public string type { get; set; }

        [DataMember]
        public string value { get; set; }

        [DataMember]
        public bool pref { get; set; }
    }

    [DataContract]
    public class JSONContactOrganization
    {
        [DataMember]
        public string type { get; set; }

        [DataMember]
        public string name { get; set; }

        [DataMember]
        public bool pref { get; set; }

        [DataMember]
        public string department { get; set; }

        [DataMember]
        public string title { get; set; }
    }

    [DataContract]
    public class JSONContact
    {
        [DataMember]
        public string id { get; set; }

        [DataMember]
        public string rawId { get; set; }

        [DataMember]
        public string displayName { get; set; }

        [DataMember]
        public string nickname { get; set; }

        [DataMember]
        public string note { get; set; }

        [DataMember]
        public JSONContactName name { get; set; }

        [DataMember]
        public JSONContactField[] emails { get; set; }

        [DataMember]
        public JSONContactField[] phoneNumbers { get; set; }

        [DataMember]
        public JSONContactField[] ims { get; set; }

        [DataMember]
        public JSONContactField[] photos { get; set; }

        [DataMember]
        public JSONContactField[] categories { get; set; }

        [DataMember]
        public JSONContactField[] urls { get; set; }

        [DataMember]
        public JSONContactOrganization[] organizations { get; set; }

        [DataMember]
        public JSONContactAddress[] addresses { get; set; }
    }


    public class Contacts : BaseCommand
    {
        public const int UNKNOWN_ERROR = 0;
        public const int INVALID_ARGUMENT_ERROR = 1;
        public const int TIMEOUT_ERROR = 2;
        public const int PENDING_OPERATION_ERROR = 3;
        public const int IO_ERROR = 4;
        public const int NOT_SUPPORTED_ERROR = 5;
        public const int PERMISSION_DENIED_ERROR = 20;
        public const int SYNTAX_ERR = 8;

        // refer here for contact properties we can access: http://msdn.microsoft.com/en-us/library/microsoft.phone.tasks.savecontacttask_members%28v=VS.92%29.aspx
        public void save(string jsonContact)
        {
            // jsonContact is actually an array of 1 {contact}
            string[] args = JSON.JsonHelper.Deserialize<string[]>(jsonContact);


            JSONContact contact = JSON.JsonHelper.Deserialize<JSONContact>(args[0]);

            SaveContactTask contactTask = new SaveContactTask();

            if (contact.nickname != null)
            {
                contactTask.Nickname = contact.nickname;
            }
            if (contact.urls != null && contact.urls.Length > 0)
            {
                contactTask.Website = contact.urls[0].value;
            }
            if (contact.note != null)
            {
                contactTask.Notes = contact.note;
            }

            #region contact.name

            if (contact.name != null)
            {
                if (contact.name.givenName != null)
                    contactTask.FirstName = contact.name.givenName;
                if (contact.name.familyName != null)
                    contactTask.LastName = contact.name.familyName;
                if (contact.name.middleName != null)
                    contactTask.MiddleName = contact.name.middleName;
                if (contact.name.honorificSuffix != null)
                    contactTask.Suffix = contact.name.honorificSuffix;
                if (contact.name.honorificPrefix != null)
                    contactTask.Title = contact.name.honorificPrefix;
            }

            #endregion

            #region contact.org

            if (contact.organizations != null && contact.organizations.Count() > 0)
            {
                contactTask.Company = contact.organizations[0].name;
                contactTask.JobTitle = contact.organizations[0].title;
            }

            #endregion

            #region contact.phoneNumbers

            if (contact.phoneNumbers != null && contact.phoneNumbers.Length > 0)
            {
                foreach (JSONContactField field in contact.phoneNumbers)
                {
                    string fieldType = field.type.ToLower();
                    if (fieldType == "work")
                    {
                        contactTask.WorkPhone = field.value;
                    }
                    else if (fieldType == "home")
                    {
                        contactTask.HomePhone = field.value;
                    }
                    else if (fieldType == "mobile")
                    {
                        contactTask.MobilePhone = field.value;
                    }
                }
            }

            #endregion

            #region contact.emails

            if (contact.emails != null && contact.emails.Length > 0)
            {
                // set up different email types if they are not explicitly defined
                foreach (string type in new[] {"personal", "work", "other"})
                {
                    foreach (JSONContactField field in contact.emails)
                    {
                        if (field != null && String.IsNullOrEmpty(field.type))
                        {
                            field.type = type;
                            break;
                        }
                    }
                }

                foreach (JSONContactField field in contact.emails)
                {
                    if (field != null)
                    {
                        if (field.type != null && field.type != "other")
                        {
                            string fieldType = field.type.ToLower();
                            if (fieldType == "work")
                            {
                                contactTask.WorkEmail = field.value;
                            }
                            else if (fieldType == "home" || fieldType == "personal")
                            {
                                contactTask.PersonalEmail = field.value;
                            }
                        }
                        else
                        {
                            contactTask.OtherEmail = field.value;
                        }
                    }
                }
            }

            #endregion

            if (contact.note != null && contact.note.Length > 0)
            {
                contactTask.Notes = contact.note;
            }

            #region contact.addresses

            if (contact.addresses != null && contact.addresses.Length > 0)
            {
                foreach (JSONContactAddress address in contact.addresses)
                {
                    if (address.type == null)
                    {
                        address.type = "home"; // set a default
                    }
                    string fieldType = address.type.ToLower();
                    if (fieldType == "work")
                    {
                        contactTask.WorkAddressCity = address.locality;
                        contactTask.WorkAddressCountry = address.country;
                        contactTask.WorkAddressState = address.region;
                        contactTask.WorkAddressStreet = address.streetAddress;
                        contactTask.WorkAddressZipCode = address.postalCode;
                    }
                    else if (fieldType == "home" || fieldType == "personal")
                    {
                        contactTask.HomeAddressCity = address.locality;
                        contactTask.HomeAddressCountry = address.country;
                        contactTask.HomeAddressState = address.region;
                        contactTask.HomeAddressStreet = address.streetAddress;
                        contactTask.HomeAddressZipCode = address.postalCode;
                    }
                    else
                    {
                        // no other address fields available ...
                        Debug.WriteLine("Creating contact with unsupported address type :: " + address.type);
                    }
                }
            }

            #endregion

            contactTask.Completed += ContactSaveTaskCompleted;
            contactTask.Show();
        }

        private void ContactSaveTaskCompleted(object sender, SaveContactResult e)
        {
            SaveContactTask task = sender as SaveContactTask;

            if (e.TaskResult == TaskResult.OK)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                    {
                        var deviceContacts = new DeviceContacts();
                        deviceContacts.SearchCompleted +=
                            postAdd_SearchCompleted;

                        if (task != null)
                        {
                            string displayName = String.Format("{0}{2}{1}", task.FirstName, task.LastName,
                                                               String.IsNullOrEmpty(task.FirstName) ? "" : " ");

                            deviceContacts.SearchAsync(displayName, FilterKind.DisplayName, task);
                        }
                    });
            }
            else if (e.TaskResult == TaskResult.Cancel)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Operation cancelled."));
            }
        }

        private void postAdd_SearchCompleted(object sender, ContactsSearchEventArgs e)
        {
            if (e.Results.Any())
            {
                new List<Contact>();

                int n = (from Contact contact in e.Results select contact.GetHashCode()).Max();
                Contact newContact = (from Contact contact in e.Results
                                      where contact.GetHashCode() == n
                                      select contact).First();

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, newContact.ToJson(null)));
            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.NO_RESULT));
            }
        }


        public void remove(string id)
        {
            // note id is wrapped in [] and always has exactly one string ...
            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "{\"code\":" + NOT_SUPPORTED_ERROR + "}"));
        }

        public void pickContact(string arguments)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(arguments);

            // Use custom contact picker because WP8 api doesn't provide its' own
            // contact picker, only PhoneNumberChooser or EmailAddressChooserTask 
            var task = new ContactPickerTask();
            var desiredFields = JSON.JsonHelper.Deserialize<string[]>(args[0]);

            task.Completed += delegate(Object sender, ContactPickerTask.PickResult e)
                {
                    if (e.TaskResult == TaskResult.OK)
                    {
                        string strResult = e.Contact.ToJson(desiredFields);
                        var result = new PluginResult(PluginResult.Status.OK)
                            {
                                Message = strResult
                            };
                        DispatchCommandResult(result);
                    }
                    if (e.TaskResult == TaskResult.Cancel)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Operation cancelled."));
                    }
                };

            task.Show();
        }

        public void search(string searchCriteria)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(searchCriteria);

            ContactSearchParams searchParams = new ContactSearchParams();
            try
            {
                searchParams.fields = JSON.JsonHelper.Deserialize<string[]>(args[0]);
                searchParams.options = JSON.JsonHelper.Deserialize<SearchOptions>(args[1]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, INVALID_ARGUMENT_ERROR));
                return;
            }

            if (searchParams.options == null)
            {
                searchParams.options = new SearchOptions();
                searchParams.options.filter = "";
                searchParams.options.multiple = true;
            }
            else if (searchParams.options.filter == null)
            {
                searchParams.options.filter = "";
            }

            DeviceContacts deviceContacts = new DeviceContacts();
            deviceContacts.SearchCompleted += contacts_SearchCompleted;

            // default is to search all fields
            FilterKind filterKind = FilterKind.None;
            // if only one field is specified, we will try the 3 available DeviceContact search filters
            if (searchParams.fields.Count() == 1)
            {
                if (searchParams.fields.Contains("name"))
                {
                    filterKind = FilterKind.DisplayName;
                }
                else if (searchParams.fields.Contains("emails"))
                {
                    filterKind = FilterKind.EmailAddress;
                }
                else if (searchParams.fields.Contains("phoneNumbers"))
                {
                    filterKind = FilterKind.PhoneNumber;
                }
            }

            try
            {
                deviceContacts.SearchAsync(searchParams.options.filter, filterKind, searchParams);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("search contacts exception :: " + ex.Message);
            }
        }

        private void contacts_SearchCompleted(object sender, ContactsSearchEventArgs e)
        {
            var searchParams = (ContactSearchParams) e.State;

            List<Contact> foundContacts = null;
            // used for comparing strings, ""  instantiates with InvariantCulture
            CultureInfo culture = new CultureInfo("");
            // make the search comparisons case insensitive.
            CompareOptions compare_option = CompareOptions.IgnoreCase;

            // if we have multiple search fields

            if (!String.IsNullOrEmpty(searchParams.options.filter) && searchParams.fields.Count() > 1)
            {
                foundContacts = new List<Contact>();
                if (searchParams.fields.Contains("emails"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           from ContactEmailAddress a in con.EmailAddresses
                                           where
                                               culture.CompareInfo.IndexOf(a.EmailAddress, searchParams.options.filter,
                                                                           compare_option) >= 0
                                           select con);
                }
                if (searchParams.fields.Contains("displayName"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           where
                                               culture.CompareInfo.IndexOf(con.DisplayName, searchParams.options.filter,
                                                                           compare_option) >= 0
                                           select con);
                }
                if (searchParams.fields.Contains("name"))
                {
                    foundContacts.AddRange(
                        from Contact con in e.Results
                        where con.CompleteName != null && (
                            (con.CompleteName.FirstName != null     && culture.CompareInfo.IndexOf(con.CompleteName.FirstName, searchParams.options.filter, compare_option) >= 0) ||
                            (con.CompleteName.LastName != null      && culture.CompareInfo.IndexOf(con.CompleteName.LastName, searchParams.options.filter, compare_option) >= 0) ||
                            (con.CompleteName.MiddleName != null    && culture.CompareInfo.IndexOf(con.CompleteName.MiddleName, searchParams.options.filter, compare_option) >= 0) ||
                            (con.CompleteName.Nickname != null      && culture.CompareInfo.IndexOf(con.CompleteName.Nickname, searchParams.options.filter, compare_option) >= 0) ||
                            (con.CompleteName.Suffix != null        && culture.CompareInfo.IndexOf(con.CompleteName.Suffix, searchParams.options.filter, compare_option) >= 0) ||
                            (con.CompleteName.Title != null         && culture.CompareInfo.IndexOf(con.CompleteName.Title, searchParams.options.filter, compare_option) >= 0) ||
                            (con.CompleteName.YomiFirstName != null && culture.CompareInfo.IndexOf(con.CompleteName.YomiFirstName, searchParams.options.filter, compare_option) >= 0) ||
                            (con.CompleteName.YomiLastName != null  && culture.CompareInfo.IndexOf(con.CompleteName.YomiLastName, searchParams.options.filter, compare_option) >= 0))
                        select con);
                }
                if (searchParams.fields.Contains("phoneNumbers"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           from ContactPhoneNumber a in con.PhoneNumbers
                                           where
                                               culture.CompareInfo.IndexOf(a.PhoneNumber, searchParams.options.filter,
                                                                           compare_option) >= 0
                                           select con);
                }
                if (searchParams.fields.Contains("urls"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           from string a in con.Websites
                                           where
                                               culture.CompareInfo.IndexOf(a, searchParams.options.filter,
                                                                           compare_option) >= 0
                                           select con);
                }
            }
            else
            {
                foundContacts = new List<Contact>(e.Results);
            }

            string strResult = "";

            IEnumerable<Contact> distinctContacts = foundContacts.Distinct();

            foreach (Contact contact in distinctContacts)
            {
                strResult += contact.ToJson(searchParams.options.desiredFields) + ",";

                if (!searchParams.options.multiple)
                {
                    break; // just return the first item
                }
            }
            PluginResult result = new PluginResult(PluginResult.Status.OK);
            result.Message = "[" + strResult.TrimEnd(',') + "]";
            DispatchCommandResult(result);
        }
    }
}