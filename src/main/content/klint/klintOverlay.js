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
var gKlint = {
    onLoad : function() {
        try {
            this.initControls();

            var obs = CommonUtil.getObserverService();
            obs.addObserver(gKlint, "current_view_changed", false);
            obs.addObserver(gKlint, "current_view_check_status", false);
            this.addListeners();
            sizeToContent();
        } catch (err) {
            alert("klint onLoad " + err);
        }
    },

    initControls : function() {
        this.oLintTree = document.getElementById("klint-tree");
        this.oCount = document.getElementById("klint-count");

        this.initValues();
    },

    initValues : function() {
        this.lintTreeView = new KlintTreeView();

        this.oLintTree.view = this.lintTreeView;
        this.lintTreeView.refresh();
    },

    _fillLintTree : function (view) {
        var items = null;
        var count = 0;
        var numErrs = 0;
        var numWarns = 0;
        try {
        if (!view || typeof(view.lintBuffer) == "undefined" || !view.lintBuffer) {
            // No linting on this view.
        } else {
            // results is a koILintResults xpcom object
            var results = view.lintBuffer.lintResults;
            var countMessage = "";
            
            if (results) {
                var resultsObj = new Object();
                var numResultsObj = new Object();
                results.getResults(resultsObj, numResultsObj);
                
                if (numResultsObj.value > 0) {
                    items = resultsObj;
                    count = numResultsObj.value;
                    numErrs = results.getNumErrors();
                    numWarns = results.getNumWarnings();
                    // There are results, each one is a koILintResult xpcom object
                    //alert(this.lintTreeView._resultsObj.length);
                    //for (var i = 0; i < numResultsObj.value; i++) {
                    //    this.lintTreeView._resultsObj.push(resultsObj.value[i].description);
                    //}
                } else {
                    // No lint results here.
                }
            } else {
                // Linting is in progess
            }
            this.lintTreeView.setResultsObj(items, count);
            this.oCount.value = CommonUtil.getFormattedMessage("error.count.label",
                                                                [numErrs, numWarns]);
        }
        } catch (err) {
            alert("_fillLintTree " + err);
        }
    },

    onDblClick : function(event) {
        try {
        if (event.button == 0) {
            var view = this.oLintTree.view;
            var selection = view.selection;
            if (selection.count) {
                this.moveCursorToMessage(ko.views.manager.currentView,
                                           this.lintTreeView.selectedItem);
                ko.views.manager.currentView.setFocus();
            }
        }
        } catch (err) {
            alert(err);
        }
    },
 
    moveCursorToMessage : function(view, result) {
        var line = result.lineStart - 1;
        var column = result.columnStart - 1;
        var pos = view.scimoz.positionAtColumn(line, column);

        view.scimoz.ensureVisibleEnforcePolicy(line);
        view.scimoz.gotoPos(pos);
        view.scimoz.selectionStart = pos;
        view.scimoz.selectionEnd = pos;
    },

    openDialog : function() {
        window.openDialog("chrome://klint/content/test.xul",
                          "_blank",
                          "chrome,resizable=yes,dependent=yes");
    },
    
    onUnLoad : function() {
        var obs = CommonUtil.getObserverService();
        obs.removeObserver(gKlint, "current_view_changed");
        obs.removeObserver(gKlint, "current_view_check_status");
        this.removeListeners();
    },

    observe : function(subject, topic, data) {
        try {
        switch (topic) {
            case "current_view_changed":
                this._fillLintTree(subject);
                break;
            case "current_view_check_status":
                this._fillLintTree(ko.views.manager.currentView);
                break;
        }
        } catch (err) {
//            alert(topic + "--" + data + "\n" + err);
        }
    },

    addListeners : function() {
        var self = this;

        this.handle_current_view_changed_setup = function(event) {
            self.onCurrentViewChanged(event);
        };
        this.handle_current_view_check_status_setup = function(event) {
            self.onCurrentViewCheckStatus(event);
        };

        window.addEventListener('current_view_changed',
                                this.handle_current_view_changed_setup, false);
        window.addEventListener('current_view_check_status',
                                this.handle_current_view_check_status_setup, false);
    },

    removeListeners : function() {
        window.removeEventListener('current_view_changed',
                                this.handle_current_view_changed_setup, false);
        window.removeEventListener('current_view_check_status',
                                this.handle_current_view_check_status_setup, false);
    },

    onCurrentViewChanged : function(event) {
        var currView = event.originalTarget;

        this._fillLintTree(currView);
    },

    onCurrentViewCheckStatus : function(event) {
        this._fillLintTree(ko.views.manager.currentView);
    }
};

window.addEventListener("load", function(event) {gKlint.onLoad(event);}, false);
window.addEventListener("unload", function(event) {gKlint.onUnLoad(event);}, false);
