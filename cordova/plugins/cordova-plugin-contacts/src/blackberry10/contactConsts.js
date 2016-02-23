/*
* Copyright 2012 Research In Motion Limited.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var ATTRIBUTE_KIND,
    ATTRIBUTE_SUBKIND,
    kindAttributeMap = {},
    subKindAttributeMap = {},
    _TITLE = 26,
    _START_DATE = 43,
    _END_DATE = 44;

function populateKindAttributeMap() {
    ATTRIBUTE_KIND = {
        Invalid: 0,
        Phone: 1,
        Fax: 2,
        Pager: 3,
        Email: 4,
        Website: 5,
        Feed: 6,
        Profile: 7,
        Family: 8,
        Person: 9,
        Date: 10,
        Group: 11,
        Name: 12,
        StockSymbol: 13,
        Ranking: 14,
        OrganizationAffiliation: 15,
        Education: 16,
        Note: 17,
        InstantMessaging: 18,
        VideoChat: 19,
        ConnectionCount: 20,
        Hidden: 21,
        Biography: 22,
        Sound: 23,
        Notification: 24,
        MessageSound: 25,
        MessageNotification: 26
    };

    kindAttributeMap[ATTRIBUTE_KIND.Phone] = "phoneNumbers";
    kindAttributeMap[ATTRIBUTE_KIND.Fax] = "faxNumbers";
    kindAttributeMap[ATTRIBUTE_KIND.Pager] = "pagerNumber";
    kindAttributeMap[ATTRIBUTE_KIND.Email] = "emails";
    kindAttributeMap[ATTRIBUTE_KIND.Website] = "urls";
    kindAttributeMap[ATTRIBUTE_KIND.Profile] = "socialNetworks";
    kindAttributeMap[ATTRIBUTE_KIND.OrganizationAffiliation] = "organizations";
    kindAttributeMap[ATTRIBUTE_KIND.Education] = "education";
    kindAttributeMap[ATTRIBUTE_KIND.Note] = "note";
    kindAttributeMap[ATTRIBUTE_KIND.InstantMessaging] = "ims";
    kindAttributeMap[ATTRIBUTE_KIND.VideoChat] = "videoChat";
    kindAttributeMap[ATTRIBUTE_KIND.Sound] = "ringtone";
}

function populateSubKindAttributeMap() {
    ATTRIBUTE_SUBKIND = {
        Invalid: 0,
        Other: 1,
        Home: 2,
        Work: 3,
        PhoneMobile: 4,
        FaxDirect: 5,
        Blog: 6,
        WebsiteResume: 7,
        WebsitePortfolio: 8,
        WebsitePersonal: 9,
        WebsiteCompany: 10,
        ProfileFacebook: 11,
        ProfileTwitter: 12,
        ProfileLinkedIn: 13,
        ProfileGist: 14,
        ProfileTungle: 15,
        FamilySpouse: 16,
        FamilyChild: 17,
        FamilyParent: 18,
        PersonManager: 19,
        PersonAssistant: 20,
        DateBirthday: 21,
        DateAnniversary: 22,
        GroupDepartment: 23,
        NameGiven: 24,
        NameSurname: 25,
        Title: _TITLE,
        NameSuffix: 27,
        NameMiddle: 28,
        NameNickname: 29,
        NameAlias: 30,
        NameDisplayName: 31,
        NamePhoneticGiven: 32,
        NamePhoneticSurname: 33,
        StockSymbolNyse: 34,
        StockSymbolNasdaq: 35,
        StockSymbolTse: 36,
        StockSymbolLse: 37,
        StockSymbolTsx: 38,
        RankingKlout: 39,
        RankingTrstRank: 40,
        OrganizationAffiliationName: 41,
        OrganizationAffiliationPhoneticName: 42,
        OrganizationAffiliationTitle: _TITLE,
        StartDate: _START_DATE,
        EndDate: _END_DATE,
        OrganizationAffiliationDetails: 45,
        EducationInstitutionName: 46,
        EducationStartDate: _START_DATE,
        EducationEndDate: _END_DATE,
        EducationDegree: 47,
        EducationConcentration: 48,
        EducationActivities: 49,
        EducationNotes: 50,
        InstantMessagingBbmPin: 51,
        InstantMessagingAim: 52,
        InstantMessagingAliwangwang: 53,
        InstantMessagingGoogleTalk: 54,
        InstantMessagingSametime: 55,
        InstantMessagingIcq: 56,
        InstantMessagingIrc: 57,
        InstantMessagingJabber: 58,
        InstantMessagingMsLcs: 59,
        InstantMessagingMsn: 60,
        InstantMessagingQq: 61,
        InstantMessagingSkype: 62,
        InstantMessagingYahooMessenger: 63,
        InstantMessagingYahooMessengerJapan: 64,
        VideoChatBbPlaybook: 65,
        HiddenLinkedIn: 66,
        HiddenFacebook: 67,
        HiddenTwitter: 68,
        ConnectionCountLinkedIn: 69,
        ConnectionCountFacebook: 70,
        ConnectionCountTwitter: 71,
        HiddenChecksum: 72,
        HiddenSpeedDial: 73,
        BiographyFacebook: 74,
        BiographyTwitter: 75,
        BiographyLinkedIn: 76,
        SoundRingtone: 77,
        SimContactType: 78,
        EcoID: 79,
        Personal: 80,
        StockSymbolAll: 81,
        NotificationVibration: 82,
        NotificationLED: 83,
        MessageNotificationVibration: 84,
        MessageNotificationLED: 85,
        MessageNotificationDuringCall: 86,
        VideoChatPin: 87
    };

    subKindAttributeMap[ATTRIBUTE_SUBKIND.Other] = "other";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.Home] = "home";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.Work] = "work";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.PhoneMobile] = "mobile";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.FaxDirect] = "direct";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.Blog] = "blog";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.WebsiteResume] = "resume";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.WebsitePortfolio] = "portfolio";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.WebsitePersonal] = "personal";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.WebsiteCompany] = "company";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.ProfileFacebook] = "facebook";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.ProfileTwitter] = "twitter";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.ProfileLinkedIn] = "linkedin";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.ProfileGist] = "gist";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.ProfileTungle] = "tungle";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.DateBirthday] = "birthday";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.DateAnniversary] = "anniversary";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NameGiven] = "givenName";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NameSurname] = "familyName";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.Title] = "honorificPrefix";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NameSuffix] = "honorificSuffix";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NameMiddle] = "middleName";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NamePhoneticGiven] = "phoneticGivenName";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NamePhoneticSurname] = "phoneticFamilyName";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NameNickname] = "nickname";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.NameDisplayName] = "displayName";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.OrganizationAffiliationName] = "name";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.OrganizationAffiliationDetails] = "department";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.Title] = "title";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingBbmPin] = "BbmPin";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingAim] = "Aim";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingAliwangwang] = "Aliwangwang";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingGoogleTalk] = "GoogleTalk";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingSametime] = "Sametime";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingIcq] = "Icq";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingJabber] = "Jabber";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingMsLcs] = "MsLcs";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingSkype] = "Skype";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingYahooMessenger] = "YahooMessenger";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.InstantMessagingYahooMessengerJapan] = "YahooMessegerJapan";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.VideoChatBbPlaybook] = "BbPlaybook";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.SoundRingtone] = "ringtone";
    subKindAttributeMap[ATTRIBUTE_SUBKIND.Personal] = "personal";
}

module.exports = {
    getKindAttributeMap: function () {
        if (!ATTRIBUTE_KIND) {
            populateKindAttributeMap();
        }

        return kindAttributeMap;
    },
    getSubKindAttributeMap: function () {
        if (!ATTRIBUTE_SUBKIND) {
            populateSubKindAttributeMap();
        }

        return subKindAttributeMap;
    }
};
