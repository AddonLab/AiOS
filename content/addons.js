var AiOS_Addons = {};

(function() {
    // Registration
    var namespaces = [];

    this.ns = function(fn) {
        var ns = {};
        namespaces.push(fn, ns);
        return ns;
    };


    this.isInSidebar = (top.document.getElementById('sidebar-box') || debug === true) ? true : false;

    // Initialization
    this.initialize = function() {

        for (var i=0; i<namespaces.length; i+=2) {
            var fn = namespaces[i];

            var ns = namespaces[i+1];
            fn.apply(ns);
        }

        var self = AiOS_Addons,
            debug = false;

        if(self.isInSidebar) self.setSidebarLayout();

    };


    this.setSidebarLayout = function() {

        var self = AiOS_Addons,
            before,
            insertedElement,
            nav_tmp,
            nav,
            updatesBox,
            managerWindow = document.getElementById("addons-page");

        self.checkNotification();
        self.setTitle(true);

        // fuer CSS-Zwecke speichern
        AiOS_HELPER.rememberAppInfo( managerWindow );

        // CSS aktivieren
        managerWindow.setAttribute('aios-inSidebar', 'true');

        // Navigation horizontal ausrichten
        nav_tmp = document.getElementById("category-search").parentNode,
        nav = nav_tmp.ownerDocument.getAnonymousNodes(nav_tmp);
        nav[0].setAttribute("orient", "horizontal");
        nav[0].setAttribute("style", "overflow:hidden;");

        // Toolbar mit Suchfeld usw. verschieben
        // before = document.getElementById("view-port-container");
        // insertedElement = before.parentNode.insertBefore(document.getElementById("header"), before);

        // Label bei Suche ohne Suchergebnisse kuerzen
        // document.getElementById("search-list-empty").childNodes[1].childNodes[0].setAttribute("crop", "end");

        // Container mit Update-Meldungen verschieben => ansonsten werden die Meldungen im Header angezeigt
        before = document.getElementById("header");
        insertedElement = before.parentNode.insertBefore(document.getElementById("updates-container"), before);

        // Inhalt der gelben Notificationbox vertikal anordnen
        updatesBox = document.createElement("vbox");
        updatesBox.setAttribute("align", "left");
        updatesBox.appendChild(document.getElementById("updates-noneFound"));
        updatesBox.appendChild(document.getElementById("updates-manualUpdatesFound-btn"));
        updatesBox.appendChild(document.getElementById("updates-progress"));
        updatesBox.appendChild(document.getElementById("updates-installed"));
        updatesBox.appendChild(document.getElementById("updates-downloaded"));
        updatesBox.appendChild(document.getElementById("updates-restart-btn"));
        document.getElementById("updates-container").insertBefore(updatesBox, document.getElementById("updates-container").childNodes[1]);

        // Navigationsbuttons immer sichtbar machen
        // document.getElementById('back-btn').setAttribute('hidden', false);
        // document.getElementById('forward-btn').setAttribute('hidden', false);

    };


    this.setDetailLayout = function() {

        var self = AiOS_Addons,
            pendingContainer,
            pendingBox,
            summary,
            newParent,
            hbox,
            screenshot,
            descriptionContainer;

        if(!self.isInSidebar) return false;

        // Detail-Ansicht: Buttons in der Pending-Box (Updateinstallation) rechts ausrichten und vertikal anordnen
        pendingContainer = document.getElementById("pending-container");
        pendingContainer.setAttribute("align", "left");

        pendingBox = document.createElement("vbox");
        pendingBox.setAttribute("align", "end");
        pendingBox.appendChild(document.getElementById("detail-restart-btn"));
        pendingBox.appendChild(document.getElementById("detail-undo-btn"));
        pendingContainer.appendChild(pendingBox);

        // neue Anordnung des Headerbereichs der Detail-Ansicht
        summary = document.getElementById("detail-summary");
        newParent = summary.parentNode;
        hbox = document.createElement("hbox");
        hbox.setAttribute("id", "detail-header");
        hbox.setAttribute("align", "left"); // Icons werden nicht verzerrt, wenn sie nicht 64x64 sind
        hbox.appendChild(document.getElementById("detail-icon"));
        hbox.appendChild(summary);
        newParent.insertBefore(hbox, document.getElementById("detail-desc-container"));

        // Name ueber der Versionsnummer platzieren
        summary.insertBefore(document.getElementById("detail-name"), document.getElementById("detail-name-container"));

        // Screenshot verschieben
        screenshot = document.getElementById("detail-screenshot").parentNode;
        screenshot.setAttribute("align", "left"); // Bild wird nicht verzerrt

        descriptionContainer = document.getElementById("detail-desc-container");
        descriptionContainer.childNodes[1].insertBefore(screenshot, document.getElementById("detail-fulldesc"));

        // Detail-Ansicht: Buttons in der Spenden-Box rechts ausrichten
        document.getElementById("detail-contributions").childNodes[1].removeAttribute("align");

    };


    // gelbe Notification-Box abhaengig von vorhandenen Notifications ein- oder ausblenden
    this.checkNotification = function() {

        if( !document.getElementById('updates-noneFound').hidden ||
            !document.getElementById('updates-manualUpdatesFound-btn').hidden ||
            !document.getElementById('updates-progress').hidden ||
            !document.getElementById('updates-installed').hidden ||
            !document.getElementById('updates-downloaded').hidden ||
            !document.getElementById('updates-restart-btn').hidden) {

            document.getElementById('updates-container').hidden = false;
        }
        else {
            document.getElementById('updates-container').hidden = true;
        }

    };


    // gelbe Notification-Box ausblenden
    this.hideNotification = function() {

        document.getElementById('updates-container').hidden = true;

    };


    // Elemente zaehlen und anzeigen
    this.setTitle = function(aDelay) {

        // without the timeout the childNodes.length of "addon-list" will be 0
        if(aDelay) {

            window.setTimeout( function() {
                AiOS_Addons.setTitle();
            }, 200 );

            return;
        }

        var origTitle,
            viewTitle,
            newTitle,

            numberOfItems,
            count = AiOS_HELPER.prefBranchAiOS.getBoolPref("em.count"),
            selectedCategory = document.getElementById('categories').getAttribute('last-selected'),
            isInSidebar = (top.document.getElementById('sidebar-box')) ? true : false;

        if(!isInSidebar || selectedCategory === "category-discover") {
            count = false;
        }

        // bisherigen Titel feststellen
        if(AiOS_HELPER.mostRecentWindow.document.getElementById("viewAddonsSidebar")) {
            origTitle = AiOS_HELPER.mostRecentWindow.document.getElementById("viewAddonsSidebar").getAttribute('label');
        }

        // originalen Titel um das aktivierte Panel erweitern
        if(document.getElementById("categories") && document.getElementById("categories").selectedItem) {
            viewTitle = document.getElementById("categories").selectedItem.getAttribute('name');
            origTitle = origTitle + " - " + viewTitle;
        }

        newTitle = origTitle;

        // wenn Elemente gezaehlt werden sollen...
        if(count) {
            numberOfItems = AiOS_Addons.countItems(selectedCategory, "/");
            newTitle = origTitle + " [" + numberOfItems + "]";
        }

        // neuen Titel setzen
        if(top.document.getElementById('sidebar-title')) {
            document.title = newTitle;
            top.document.getElementById('sidebar-title').setAttribute("value", newTitle);
        }

        // Sidebartitel im Broadcaster speichern
        // => so kann beim Schliessen/oeffnen der Sidebar wiederhergestellt werden
        if(top.document.getElementById('viewAddonsSidebar')) {
            top.document.getElementById('viewAddonsSidebar').setAttribute('sidebartitle', newTitle);
        }

        return;
    };


    // Elemente zaehlen und zurueckgeben
    this.countItems = function(selectedCategory, divider) {

        /*
        category-search             => search-list
        category-discover           => -
        category-languages          => addon-list
        category-searchengines      => addon-list
        category-extensions         => addon-list
        category-themes             => addon-list
        category-plugins            => addon-list
        category-availableUpdates   => updates-list
        category-recentUpdates      => updates-list
        category-scripts            => addon-list
        */

        var type = "all",
            the_list = "addon-list",

            exts,
            str_count,
            list_enabled = 0,
            list_disabled = 0;

        if(selectedCategory === "category-search") {
            the_list = "search-list";
            type = document.getElementById("search-filter-radiogroup").getAttribute("value");
        }
        else if(selectedCategory === "category-availableUpdates" || selectedCategory === "category-recentUpdates") {
            the_list = "updates-list";
        }

        exts = AiOS_Addons.filterItems(the_list, type);

        for(var i = 0; i < exts.length; i++) {
            if(exts[i].getAttribute('active') === "true") list_enabled++;
            else  list_disabled++;
        }

        str_count = list_enabled;
        if(list_disabled > 0) str_count = str_count + divider + list_disabled;

        return(str_count);

    };


    // Richlistitems filtern
    this.filterItems = function(aList, aType) {

        var r = [],
            childs = document.getElementById(aList).childNodes;

        for(var i = 0; i < childs.length; i++) {

            if(childs[i].nodeName === "richlistitem" && childs[i].getAttribute('hidden') !== "true") {

                if(aType === "all") {
                    r.push(childs[i]);
                }
                else if(aType === "local" && childs[i].getAttribute('remote') === "false") {
                    r.push(childs[i]);
                }
                else if(aType === "remote" && childs[i].getAttribute('remote') === "true") {
                    r.push(childs[i]);
                }

            }

        }

        return r;

    };


    // Clean up
    this.shutdown = function() {
        window.removeEventListener("DOMContentLoaded", AiOS_Addons.initialize);
        window.removeEventListener("load", AiOS_Addons.setDetailLayout);
        window.removeEventListener("unload", AiOS_Addons.shutdown);
    };

    // Register handlers
    window.addEventListener("DOMContentLoaded", this.initialize);
    window.addEventListener("load", this.setDetailLayout);
    window.addEventListener("unload", this.shutdown);

}).apply(AiOS_Addons);
