var AiOS_Places = {};

(function() {
    // Registration
    var namespaces = [];

    this.ns = function(fn) {
        var ns = {};
        namespaces.push(fn, ns);
        return ns;
    };


    document.getElementById('search-box').parentNode.setAttribute('id', 'places-toolbar');

    this.mode = (document.getElementById('bookmarksPanel')) ? "bookmarks" : "history";

    if(this.mode === "bookmarks") {
        this.managerWindow = document.getElementById('bookmarksPanel');
        this.managerTree = document.getElementById("bookmarks-view");
    }
    else {
        this.managerWindow = document.getElementById('history-panel');
        this.managerTree = document.getElementById("historyTree");
    }

    this.treeBoxObject = this.managerTree.treeBoxObject;

    this.searchObj = document.getElementById("search-box");

    // Initialization
    this.initialize = function() {

        var self = AiOS_Places,
            isInSidebar = (top.document.getElementById('sidebar-box')) ? true : false;

        self.checkFolderOptions();

        // Chronik = >dem "Extras"-Menue den Separator und die drei Menuepunkte hinzufuegen
        if(self.mode === "history") {

            var viewButton = document.getElementById("viewButton"),
                popUp = viewButton.firstChild;

            popUp.appendChild(document.getElementById('close-separator'));

            popUp.appendChild(document.getElementById('aios-enableAutoClose'));
            popUp.appendChild(document.getElementById('aios-rememberFolder'));
            popUp.appendChild(document.getElementById('aios-scrollToFolder'));

            popUp.appendChild(document.getElementById('close-separator').cloneNode(true));

            popUp.appendChild(document.getElementById('aios-viewClose'));

            viewButton.removeAttribute('accesskey');
            viewButton.removeChild(document.getElementById('viewPopUp'));
        }

        if(isInSidebar) self.setSidebarLayout();

    };


    this.checkFolderOptions = function() {

        var self = AiOS_Places,
            lastRowToSelect,
            lastFolderPref = (self.mode === "bookmarks") ? "lastBookmarkFolder": "lastHistoryFolder",
            options = (aios_getBoolean("aios-enableAutoClose", "checked") || aios_getBoolean("aios-rememberFolder", "checked") || aios_getBoolean("aios-scrollToFolder", "checked"));

        if(options) {

            self.managerTree.addEventListener("click", self.closeOtherFolders);

            // zuletzt geoeffneten Ordner markieren
            if(aios_getBoolean("aios-rememberFolder", "checked")) {

                if(AiOS_HELPER.prefBranchAiOS.prefHasUserValue(lastFolderPref)) {

                    lastRowToSelect = AiOS_HELPER.prefBranchAiOS.getIntPref(lastFolderPref);

                    window.setTimeout(function() {
                        AiOS_Places.selectFolder(lastRowToSelect);
                    }, 10);

                }

            }
        }
        else {
            self.managerTree.removeEventListener("click", self.closeOtherFolders);
        }

    };


    this.toggleButton = function(aElem) {

        document.getElementById( aElem.getAttribute('data-dependent') ).setAttribute( 'hidden', !aios_getBoolean(aElem, "checked") );

    };


    this.setSidebarLayout = function() {

        var self = AiOS_Places;

        // fuer CSS-Zwecke speichern
        AiOS_HELPER.rememberAppInfo( self.managerWindow );

        // CSS aktivieren
        self.managerWindow.setAttribute('aios-inSidebar', 'true');

        // Tooltip, focus- und blur-Funktionen hinzufuegen
        // => erst hier bei init(), weil es sonst Skript-Fehler geben wuerde
        // => nicht aktivieren in Verbindung mit Bookmark Duplicate Detector
        if(typeof Bookmarkdd !== "object") {
            self.searchObj.addEventListener("focus", AiOS_Places.focusBlurText);
            self.searchObj.addEventListener("blur", AiOS_Places.focusBlurText);
        }

        // Folder-Close <button> durch einen <toolbarbutton> ersetzen
        if(document.getElementById("closeFolder")) {

            var closeButton = document.getElementById("closeFolder"),
                closeAttr = closeButton.attributes,
                new_closeButton = document.createElement("toolbarbutton");

            // alten <button> entfernen
            closeButton.parentNode.removeChild(closeButton);

            // alle Attribute des alten Buttons uebernehmen
            for(var i = 0; i < closeAttr.length; i++) {
                new_closeButton.setAttribute(closeAttr[i].name, closeAttr[i].value);
            }

            // neuen <toolbarbutton> einfuegen
            self.searchObj.parentNode.appendChild(new_closeButton);
        }

        // Tools-Button <button> durch einen <toolbarbutton> ersetzen
        if(document.getElementById("viewButton")) {

            var viewButton = document.getElementById("viewButton"),
                popUp = viewButton.firstChild.cloneNode(true),
                viewAttr = viewButton.attributes,
                new_viewButton = document.createElement("toolbarbutton");

            // alten <button> entfernen
            viewButton.parentNode.removeChild(viewButton);

            // alle Attribute des alten Buttons uebernehmen
            for(var j = 0; j < viewAttr.length; j++) {
                new_viewButton.setAttribute(viewAttr[j].name, viewAttr[j].value);
            }

            // neuen <toolbarbutton> einfuegen
            new_viewButton.appendChild(popUp);
            self.searchObj.parentNode.appendChild(new_viewButton);
        }

    };


    this.focusBlurText = function(e) {

        var self = AiOS_Places,
            strings = document.getElementById("propSetStrings"),
            blurText = strings.getString('bm_hi.search.blur');

        if(e.type === "focus" && self.searchObj.value === blurText) {
            self.searchObj.className = "";
            self.searchObj.value = "";
        }
        else if(e.type === "blur" && self.searchObj.value === "") {
            self.searchObj.className = "blur";
            self.searchObj.value = blurText;
        }

    };


    this.selectFolder = function(index) {

        var self = AiOS_Places;

        if (self.treeBoxObject.view.rowCount >= index) {

            self.treeBoxObject.view.selection.select(index);

            // check if we really need to scroll
            if( aios_getBoolean("aios-scrollToFolder", "checked") && (self.treeBoxObject.view.rowCount > self.treeBoxObject.getPageLength()) ) {

                self.treeBoxObject.scrollToRow(index);

            }

            self.treeBoxObject.ensureRowIsVisible(index);
        }

    };


    this.closeOtherFolders = function(e) {

        // Rechts-Klick nicht beachten
        if(e.button >= 2) return;

        var sidebarType = AiOS_Places.mode;

        var dotoggle = (e.button === 0);    //wenn es kein links-klick war, dann fuehre nur die standardaktion aus
        var tree = AiOS_Places.managerTree;
        var tbo = tree.treeBoxObject;

        //wenn man auf das + zeichen vor dem ordner klickt, dann soll er einfach nur aufgehen und die anderen nicht geschlossen werden
        var row = {}, col = {}, obj = {};
        tbo.getCellAt(e.clientX, e.clientY, row, col, obj);
        if (row.value === -1 || obj.value === "twisty")
        {
            return;
        }

        var x = {}, y = {}, w = {}, h = {};
        tbo.getCoordsForCellItem(row.value, col.value, "image", x, y, w, h);
        var isLTR = (window.getComputedStyle(tree).direction === "ltr");
        var mouseInGutter = isLTR ? (e.clientX < x.value) : (e.clientX > x.value);

        var tboView = tree.view;
        var modifKey = (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey);
        row = tree.currentIndex;
        var isContainer = tboView.isContainer(row);
        if (dotoggle && isContainer && !modifKey)
        {
            //jetzt der teil, der die anderen offenen ordner schliesst
            var parents = [];
            //nun werden alle ober-ordner des aktuellen gesucht
            while (row !== -1)
            {
                parents.push(row);
                row = tboView.getParentIndex(row);
            }
            parents.reverse();  //dreht reihenfolge im array um

            for (var i = tboView.rowCount-1; i >= 0; i--)    //geht einfach jede zeile durch und testet ...
            {
                if (parents.length > 0 && parents[parents.length-1] === i)
                {   //bei den ober-ordnern soll sich nix tun, sollen also offen bleiben
                    parents.pop();
                }
                else
                {
                    if (tboView.isContainer(i) && tboView.isContainerOpen(i))
                    {
                        //andere elemente, die ordner sind, sollen geschlossen werden
                        tboView.toggleOpenState(i);
                    }
                }
            }

            if (aios_getBoolean("aios-scrollToFolder", "checked") && (tboView.rowCount > tbo.getPageLength()))    //falls gescrollt werden soll, aber nur wenn das auch wirklich noetig ist
            {
                tbo.scrollToRow(tree.currentIndex);
            }

            tbo.ensureRowIsVisible(tree.currentIndex);    // scrollt zum index nur wenn noetig.

            if (aios_getBoolean("aios-rememberFolder", "checked"))
            {
                switch(sidebarType)
                {
                    case "bookmarks":
                        AiOS_HELPER.prefBranchAiOS.setIntPref("lastBookmarkFolder", tree.currentIndex);
                        break;

                    case "history":
                        AiOS_HELPER.prefBranchAiOS.setIntPref("lastHistoryFolder", tree.currentIndex);
                        break;
                }
            }
        }
        /*// schliesse sidebar nach linksklick auf lesezeichen/history eintrag
        if (dotoggle && !isContainer && (this._Prefs.CloseSidebar&2) === 2)
        {
            e.stopPropagation();
            e.preventDefault();
            top.toggleSidebar();
        }*/

    };


    this.closeAllFolders = function() {

        var aView = AiOS_Places.managerTree.treeBoxObject.view;

        // zuletzt geoeffneten Ordner "vergessen"
        try {
            if(document.getElementById('bookmarksPanel')) AiOS_HELPER.prefBranchAiOS.clearUserPref("lastBookmarkFolder");
            else if(document.getElementById('history-panel')) AiOS_HELPER.prefBranchAiOS.clearUserPref("lastHistoryFolder");
        }
        catch(e) {  }

        // Ordner schliessen
        if (aView) {
            aView.batching(true);
            for(var i = aView.rowCount - 1; i >= 0; i--) {
                if(aView.isContainer(i) && aView.isContainerOpen(i)) aView.toggleOpenState(i);
            }
            aView.batching(false);
        }

    };


    // Clean up
    this.shutdown = function() {
        window.removeEventListener("DOMContentLoaded", AiOS_Places.initialize, false);
        window.removeEventListener("unload", AiOS_Places.shutdown);

        AiOS_Places.managerTree.removeEventListener("click", AiOS_Places.closeOtherFolders);
        AiOS_Places.searchObj.removeEventListener("focus", AiOS_Places.focusBlurText);
        AiOS_Places.searchObj.removeEventListener("blur", AiOS_Places.focusBlurText);
    };

    // Register handlers
    window.addEventListener("DOMContentLoaded", this.initialize, false);
    window.addEventListener("unload", this.shutdown);

}).apply(AiOS_Places);