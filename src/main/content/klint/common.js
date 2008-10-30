/*
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Initial Developer of the Original Code is
# Davide Ficano.
# Portions created by the Initial Developer are Copyright (C) 2007
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Davide Ficano <davide.ficano@gmail.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
*/
CommonUtil.locale = Components.classes["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .createBundle("chrome://klint/locale/klint.properties");

function CommonUtil() {
    return this;
}

CommonUtil.makeLocalFile = function(path, arrayAppendPaths) {
    var file;

    try {
        file = path.QueryInterface(Components.interfaces.nsILocalFile);
    } catch (err) {
        file = Components.classes["@mozilla.org/file/local;1"]
               .createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(path);
    }

    if (arrayAppendPaths != null
        && arrayAppendPaths != undefined
        && arrayAppendPaths.length) {
        for (var i = 0; i < arrayAppendPaths.length; i++) {
            file.append(arrayAppendPaths[i]);
        }
    }
    return file;
}

CommonUtil.getLocalizedMessage = function(msg) {
    return CommonUtil.locale.GetStringFromName(msg);
}

CommonUtil.getFormattedMessage = function(msg, ar) {
    return CommonUtil.locale.formatStringFromName(msg, ar, ar.length);
}

CommonUtil.makeFilePicker = function(win, title, mode, displayDirectory) {
    const nsIFilePicker                 = Components.interfaces.nsIFilePicker;
    const CONTRACTID_FILE_PICKER        = "@mozilla.org/filepicker;1";

    if (mode == null || mode == undefined) {
        mode = nsIFilePicker.modeOpen;
    }
    var fp = Components.classes[CONTRACTID_FILE_PICKER]
                .createInstance(nsIFilePicker);
    fp.init(win, title, mode);
    if (displayDirectory) {
        fp.displayDirectory = displayDirectory;
    }

    return fp;
}

CommonUtil.getProfileDir = function() {
    return CommonUtil.getPrefDir("PrefD");
}

CommonUtil.getUserHome = function() {
    return CommonUtil.getPrefDir("Home");
}

CommonUtil.getPrefDir = function(dir) {
    const CONTRACTID_DIR = "@mozilla.org/file/directory_service;1";
    const nsDir = Components.interfaces.nsIProperties;

    var dirService = Components.classes[CONTRACTID_DIR].getService(nsDir);
    return dirService.get(dir, Components.interfaces.nsILocalFile);
}

CommonUtil.makeFileURL = function(aFile) {
    var theFile = CommonUtil.makeLocalFile(aFile);

    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    return ioService.newFileURI(theFile);
}


CommonUtil.copyToClipboard = function(str) {
    Components.classes["@mozilla.org/widget/clipboardhelper;1"]
        .getService(Components.interfaces.nsIClipboardHelper)
        .copyString(str);
}

CommonUtil.changeUriView = function(view, uri) {
    var docSvc = Components
        .classes["@activestate.com/koDocumentService;1"]
        .getService(Components.interfaces.koIDocumentService);
    var newDoc = docSvc.createDocumentFromURI(uri);
    // Otherwise it's initially loaded as an empty document
    newDoc.load();
    view.document = newDoc;
}

CommonUtil.renameFile = function(uri, newName) {
    var koFileEx = CommonUtil.makeIFileExFromURI(uri);
    var oldPath = koFileEx.path;
    var newPath;

    if (koFileEx.isRemoteFile) {
        var rcSvc = Components
                    .classes["@activestate.com/koRemoteConnectionService;1"]
                    .getService(Components.interfaces.koIRemoteConnectionService);
        var conn = rcSvc.getConnectionUsingUri(uri);
        var parent = conn.getParentPath(oldPath);
        conn.rename(oldPath, parent + "/" + newName);
        // replace uri leaf with newName
        newPath = uri.replace(/\/[^\/]*$/, "/" + newName);
    } else {
        var oldLocalFile = CommonUtil.makeLocalFile(oldPath);
        newPath = CommonUtil.makeLocalFile(oldLocalFile.parent, [newName]).path;
        oldLocalFile.moveTo(null, newName);
    }

    return newPath;
}

CommonUtil.deleteFile = function(uri) {
    var koFileEx = CommonUtil.makeIFileExFromURI(uri);
    var path = koFileEx.path;

    if (koFileEx.isRemoteFile) {
        var rcSvc = Components
                    .classes["@activestate.com/koRemoteConnectionService;1"]
                    .getService(Components.interfaces.koIRemoteConnectionService);
        var conn = rcSvc.getConnectionUsingUri(uri);
        conn.removeFile(path);
    } else {
        CommonUtil.makeLocalFile(path).remove(false);
    }
}

CommonUtil.isRemotePath = function(ko, path) {
    try {
        ko.uriparse.localPathToURI(path);
    } catch (err) {
        return true;
    }
    return false;
}

CommonUtil.getObserverService = function () {
    const CONTRACTID_OBSERVER = "@mozilla.org/observer-service;1";
    const nsObserverService = Components.interfaces.nsIObserverService;

    return Components.classes[CONTRACTID_OBSERVER].getService(nsObserverService);
}

CommonUtil.makeIFileExFromURI = function (uri) {
    var file = Components
                    .classes["@activestate.com/koFileEx;1"]
                    .createInstance(Components.interfaces.koIFileEx);
    file.path = uri;

    return file;
}

CommonUtil.clone = function(obj, shallow) {
    if (obj == null || typeof(obj) != 'object') {
        return obj;
    }
    var cloned = {};

    for(var i in obj) {
        if (shallow) {
            cloned[i] = obj[i];
        } else {
            cloned[i] = CommonUtil.clone(obj[i], shallow);
        }
    }
    return cloned;
}

CommonUtil.log = function(message) {
    ko.logging.getLogger("klint").warn((new Date()) + ": " + message);
}