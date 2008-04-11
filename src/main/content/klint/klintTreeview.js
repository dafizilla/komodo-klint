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
function KlintTreeView() {
    this._count = 0;
    this._resultsObj = null;

    this.treebox = null;
    this.lastSortDirection = 1; // 1 ascending, -1 descending
}

KlintTreeView.prototype = {
    setResultsObj : function(resultsObj, count) {
        this._resultsObj = resultsObj;
        var offsetCount = count - this._count;
        this._count = count;
        this.treebox.rowCountChanged(this.rowCount, offsetCount);
        this.refresh();
    },

    invalidate : function() {
        this.treebox.invalidate();
    },

    sort : function (useCurrentDirection) {
        var direction = useCurrentDirection ? this.lastSortDirection : -this.lastSortDirection;

        function sortByProperty(a, b) {
            if (a.type != b.type) {
                return direction * (a.type - b.type);
            }
            return direction * a.file.path.toLowerCase()
                      .localeCompare(b.file.path.toLowerCase());
        }

        this.items.sort(sortByProperty);

        this.refresh();
        this.lastSortDirection = direction;
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
                return this._resultsObj.value[row].lineStart;
            case "klint-message":
                return this._resultsObj.value[row].description;
            case "klint-messageType":
                switch (this._resultsObj.value[row].severity) {
                    case Components.interfaces.koILintResult.SEV_INFO:
                        return "Info";
                    case Components.interfaces.koILintResult.SEV_ERROR:
                        return "Error";
                    case Components.interfaces.koILintResult.SEV_WARNING:
                        return "Wwarning";
                }
                break;
        }

        return "";
    },

    get selectedItem() {
        return this._resultsObj.value[this.selection.currentIndex];
    },
    
    get rowCount() {
        return this._count;
    },

    cycleCell: function(row, column) {},

    getImageSrc: function (row, column) {
        switch (column.id || column) {
            case "klint-messageType":
                switch (this._resultsObj.value[row].severity) {
                    case Components.interfaces.koILintResult.SEV_INFO:
                        return "chrome://klint/skin/icon_check_info.png";
                    case Components.interfaces.koILintResult.SEV_ERROR:
                        return "chrome://klint/skin/icon_check_error.png";
                    case Components.interfaces.koILintResult.SEV_WARNING:
                        return "chrome://klint/skin/icon_check_warning.png";
                }
                break;
        }
        return null;
    },

    setTree: function(treebox){
        this.treebox = treebox;
    },

    cycleHeader: function(col, elem) {},
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(row){ return false; },
    getLevel: function(row){ return 0; },
    getRowProperties: function(row,props){},
    getCellProperties: function(row,col,props){},
    getColumnProperties: function(colid,col,props){}
};
