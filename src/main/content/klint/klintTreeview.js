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

function KlintInfo(filter) {
    if (typeof(filter) == "undefined" || filter == null) {
        this.filter = KlintTreeView.ALL;
    }
    this.currentSortColumnName = "klint-linenum";
    this.sortInfo = {};

    this.sortInfo["klint-linenum"] = { isAscending: true, sorter :
                function(direction) {
                    return function(a, b) {
                        return direction * (a.lineStart - b.lineStart);
                    }
                }
            };
    this.sortInfo["klint-messageType"] = { isAscending: true, sorter :
                function(direction) {
                    return function(a, b) {
                        if (a.severity == b.severity) {
                            return a.lineStart - b.lineStart;
                        }
                        return direction * (a.severity - b.severity);
                    }
                }
            };
    this.sortInfo["klint-message"] = { isAscending: true, sorter :
                function(direction) {
                    return function(a, b) {
                        var cmp = a.description.toLowerCase()
                                  .localeCompare(b.description.toLowerCase());
                        if (cmp == 0) {
                            if (a.lineStart == b.lineStart) {
                                return a.severity - b.severity;
                            }
                            return a.lineStart - b.lineStart;
                        }
                        return direction * cmp;
                    }
                }
            };
}

KlintInfo.prototype = {
    /**
     * Return true if column has been sorted ascending, false otherwise
     */
    changeSortColumn : function(columnName) {
        if (this.currentSortColumnName == columnName) {
            if (columnName in this.sortInfo) {
                this.sortInfo[columnName].isAscending = !this.sortInfo[columnName].isAscending;
            } else {
                alert("Unable to find column '" + columnName + "'");
            }
        } else {
            this.currentSortColumnName = columnName;
        }
        return this.sortInfo[columnName].isAscending;
    },

    getSortInfo : function() {
        return this.sortInfo[this.currentSortColumnName];
    }

}

function KlintTreeView() {
    this._count = 0;
    this._resultsObj = null;
    this._visibleItems = [];

    this.treebox = null;
}

KlintTreeView.INFO = Components.interfaces.koILintResult.SEV_INFO;
KlintTreeView.ERROR = Components.interfaces.koILintResult.SEV_ERROR;
KlintTreeView.WARNING = Components.interfaces.koILintResult.SEV_WARNING;
KlintTreeView.ALL = KlintTreeView.INFO | KlintTreeView.ERROR | KlintTreeView.WARNING;
KlintTreeView.NONE = -1;

// Properties to style tree
KlintTreeView.props = [];
KlintTreeView.props[KlintTreeView.INFO] =
    Components.classes["@mozilla.org/atom-service;1"]
        .getService(Components.interfaces.nsIAtomService)
        .getAtom("info");
KlintTreeView.props[KlintTreeView.ERROR] =
    Components.classes["@mozilla.org/atom-service;1"]
        .getService(Components.interfaces.nsIAtomService)
        .getAtom("error");
KlintTreeView.props[KlintTreeView.WARNING] =
    Components.classes["@mozilla.org/atom-service;1"]
        .getService(Components.interfaces.nsIAtomService)
        .getAtom("warning");

// Messages
KlintTreeView.messages = [];
KlintTreeView.messages[KlintTreeView.INFO] = CommonUtil.getLocalizedMessage("info.label");
KlintTreeView.messages[KlintTreeView.ERROR] = CommonUtil.getLocalizedMessage("error.label");
KlintTreeView.messages[KlintTreeView.WARNING] = CommonUtil.getLocalizedMessage("warning.label");

KlintTreeView.prototype = {
    setResultsObj : function(resultsObj, count, info) {
        this._resultsObj = resultsObj;
        this._count = count;

        if (typeof(info) == "undefined") {
            info = new KlintInfo();
        }
        this.filterVisibleItems(info);
    },

    filterVisibleItems : function(info) {
        var currentCount = this._visibleItems.length;
        this._visibleItems = [];

        if (info.filter != KlintTreeView.NONE) {
            for (var i = 0; i < this._count; i++) {
                var result = this._resultsObj.value[i];
                if (result.severity & info.filter) {
                    this._visibleItems.push(result);
                }
            }
            // sort at every new filter, very inefficient
            this.sort(info.getSortInfo());
        }
        var offsetCount = this._visibleItems.length - currentCount;
        this.treebox.rowCountChanged(this._visibleItems.length, offsetCount);
    },

    invalidate : function() {
        this.treebox.invalidate();
    },

    sort : function (sortInfo) {
        var direction = sortInfo.isAscending ? 1 : -1;

        this._visibleItems.sort(sortInfo.sorter(direction));
    },

    removeAllItems : function() {
        this.selection.clearSelection();
    },

    refresh : function() {
        this.selection.clearSelection();
        this.selection.select(0);
        this.treebox.invalidate();
        this.treebox.ensureRowIsVisible(0);
    },

    getCellText : function(row, column){
        switch (column.id || column) {
            case "klint-linenum":
                return this._visibleItems[row].lineStart;
            case "klint-message":
                return this._visibleItems[row].description;
            case "klint-messageType":
                return KlintTreeView.messages[this._visibleItems[row].severity];
        }

        return "";
    },

    get selectedItem() {
        return this._visibleItems[this.selection.currentIndex];
    },

    get rowCount() {
        return this._visibleItems.length;
    },

    cycleCell: function(row, column) {},

    getImageSrc: function (row, column) {
        return null;
    },

    setTree: function(treebox){
        this.treebox = treebox;
    },

    getCellProperties: function(row, column, props) {
        var prop = null;

        switch (column.id || column) {
            case "klint-message":
                var severity = this._visibleItems[row].severity;
                prop = KlintTreeView.props[severity];
                break;
        }
        if (prop) {
            props.AppendElement(prop);
        }
    },

    cycleHeader: function(col, elem) {},
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(row){ return false; },
    getLevel: function(row){ return 0; },
    getRowProperties: function(row,props){},
    getColumnProperties: function(colid,col,props){}
};
