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
            obs.addObserver(this, "current_view_changed", false);
            obs.addObserver(this, "current_view_check_status", false);
            obs.addObserver(this, "view_opened", false);
            this.addListeners();
            sizeToContent();
        } catch (err) {
            alert("klint onLoad " + err);
        }
    },

    initControls : function() {
        this.lintTree = document.getElementById("klint-tree");
        this.countLabel = document.getElementById("klint-count");
        this.menuFilterType = document.getElementById("klint-filter-type");
        this.textFilterPattern = document.getElementById("klint-filter-pattern")

        this.initValues();
    },

    initValues : function() {
        this.lintTreeView = new KlintTreeView();

        this.lintTree.view = this.lintTreeView;
        this.lintTreeView.refresh();
    },

    fillLintTree : function (view) {
        var items = null;
        var count = 0;
        var numErrs = 0;
        var numWarns = 0;
        var klintInfo = null;

        try {
        if (!view || typeof(view.lintBuffer) == "undefined" || !view.lintBuffer) {
            // No linting on this view.
            items = [];
        } else {
            klintInfo = view.__klintInfo__;
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
        }
        this.lintTreeView.setResultsObj(items, count, klintInfo);
        this.lintTreeView.refresh();
        this.countLabel.value = CommonUtil.getFormattedMessage(
            "error.count.label", [numErrs, numWarns]);
        } catch (err) {
            alert("fillLintTree " + err);
        }
    },

    onDblClick : function(event) {
        try {
        if (event.button == 0) {
            var view = this.lintTree.view;
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

    onUnLoad : function() {
        var obs = CommonUtil.getObserverService();
        obs.removeObserver(this, "current_view_changed");
        obs.removeObserver(this, "current_view_check_status");
        obs.removeObserver(this, "view_opened");
        this.removeListeners();
    },

    observe : function(subject, topic, data) {
        try {
        switch (topic) {
            case "current_view_changed":
                this.updateUI(subject);
                this.updateSortIndicator(subject);
                this.fillLintTree(subject);
                break;
            case "current_view_check_status":
                this.fillLintTree(ko.views.manager.currentView);
                break;
            case "view_opened":
                //var view = subject;
                //ko.logging.getLogger("extensions.klint").warn("view is " + view);
                //
                //if (view.document) {
                //    ko.logging.getLogger("extensions.klint").warn("document is " + document);
                //    ko.logging.getLogger("extensions.klint").warn("file " + view.document.file.ext);
                //    if (view.document.file.ext == ".log") {
                //        ko.logging.getLogger("extensions.klint").warn("check disabled");
                //        view.prefs.setBooleanPref("editUseLinting", false);
                //    }
                //}
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
        this.handle_current_view_opened_setup = function(event) {
            self.onCurrentViewOpened(event);
        }
        this.handle_current_view_closed_setup = function(event) {
            self.onCurrentViewClosed(event);
        }

        window.addEventListener('current_view_changed',
                                this.handle_current_view_changed_setup, false);
        window.addEventListener('current_view_check_status',
                                this.handle_current_view_check_status_setup, false);
        window.addEventListener('view_opened',
                                this.handle_current_view_opened_setup, false);
        
        // Under ko5 clear tree content if it is the view last
        window.addEventListener('view_closed',
                                this.handle_current_view_closed_setup, false);
    },

    removeListeners : function() {
        window.removeEventListener('current_view_changed',
                                this.handle_current_view_changed_setup, false);
        window.removeEventListener('current_view_check_status',
                                this.handle_current_view_check_status_setup, false);
        window.removeEventListener('view_opened',
                                this.handle_current_view_opened_setup, false);
    },

    onCurrentViewChanged : function(event) {
        var currView = event.originalTarget;

        this.updateUI(currView);
        this.updateSortIndicator(currView);
        this.fillLintTree(currView);
    },

    onCurrentViewCheckStatus : function(event) {
        this.fillLintTree(ko.views.manager.currentView);
    },

    onCurrentViewOpened : function(event) {
        //var view = event.originalTarget;
        //ko.logging.getLogger("extensions.klint").warn("listener view is " + view);
        //
        //if (view.document) {
        //    ko.logging.getLogger("extensions.klint").warn("document is " + document);
        //    ko.logging.getLogger("extensions.klint").warn("file " + view.document.file.ext);
        //    if (view.document.file.ext == ".log") {
        //        ko.logging.getLogger("extensions.klint").warn("check disabled");
        //        view.prefs.setBooleanPref("editUseLinting", false);
        //    }
        //}
    },

    onCurrentViewClosed : function(event) {
        var view = event.originalTarget;
        this.fillLintTree(view);
    },

    getKlintInfo : function(view) {
        if (!("__klintInfo__" in view)) {
            view.__klintInfo__ = new KlintInfo();
        }
        return view.__klintInfo__;
    },

    filterVisibleItems : function(what) {
        view = ko.views.manager.currentView;
        var klintInfo = this.getKlintInfo(view);
        klintInfo.filterPattern = this.textFilterPattern.value;
        klintInfo.filterType = what;
        this.lintTreeView.filterVisibleItems(klintInfo);
        this.lintTreeView.refresh();
    },

    sort : function(event) {
        var selectedColumn = event.target;
        view = ko.views.manager.currentView;
        this.getKlintInfo(view).changeSortColumn(selectedColumn.id);
        this.updateSortIndicator(ko.views.manager.currentView);
        this.lintTreeView.sort(this.getKlintInfo(view).getCurrentSortInfo());
        this.lintTreeView.refresh();
    },
    
    updateSortIndicator : function(view) {
        if (!view) {
            return;
        }
        var selectedColumn = document.getElementById(
            this.getKlintInfo(view).currentSortColumnName);
        var sortInfo = this.getKlintInfo(view).getCurrentSortInfo();
        var sortDirection = sortInfo.isAscending ? "ascending" : "descending"
        var cols = this.lintTree.columns;

        for (var i = 0; i < cols.count; i++) {
            var el = cols.getColumnAt(i).element;

            if (el == selectedColumn) {
                el.setAttribute("sortActive", "true");
                el.setAttribute("sortDirection", sortDirection);
            } else {
                el.removeAttribute("sortActive");
                el.removeAttribute("sortDirection");
            }
        }
    },        

    updateUI : function (view) {
        var filterType = KlintTreeView.ALL;
        var filterText = "";

        if (view && "__klintInfo__" in view) {
            filterType = view.__klintInfo__.filterType;
            filterText = view.__klintInfo__.filterPattern;
        }

        switch (filterType) {
            case KlintTreeView.ALL:
                this.menuFilterType.selectedItem = document.getElementById("klint-filter-all");
                break;
            case KlintTreeView.ERROR:
                this.menuFilterType.selectedItem = document.getElementById("klint-filter-error");
                break;
            case KlintTreeView.WARNING:
                this.menuFilterType.selectedItem = document.getElementById("klint-filter-warning");
                break;
            case KlintTreeView.INFO:
                this.menuFilterType.selectedItem = document.getElementById("klint-filter-info");
                break;
            case KlintTreeView.NONE:
                this.menuFilterType.selectedItem = document.getElementById("klint-filter-none");
                break;
            default:
                this.menuFilterType.selectedItem = document.getElementById("klint-filter-all");
                break;
        }

        this.textFilterPattern.value = filterText;
    },
    
    onTextFilterInput : function(event) {
        view = ko.views.manager.currentView;
        var klintInfo = this.getKlintInfo(view);
        this.filterVisibleItems(klintInfo.filterType);
    },
    
    onTextFilterKeypress : function(event) {
        if (event.keyCode == KeyEvent.DOM_VK_ESCAPE) {
            event.target.value = "";
            this.onTextFilterInput(event);
        }
    }
};

window.addEventListener("load", function(event) {gKlint.onLoad(event);}, false);
window.addEventListener("unload", function(event) {gKlint.onUnLoad(event);}, false);
