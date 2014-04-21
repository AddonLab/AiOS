
var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;

var webPanel;
if(document.getElementById('web-panels-browser')) webPanel = document.getElementById('web-panels-browser');


/*
    Initialisierung
        => Aufruf durch onload in console.xul
*/
function aios_init() {
    // Sidebar-/Fenster-Titel setzen
    aios_setSBLabel();

    // Buttons aktivieren/deaktivieren
    aios_setOptions();

    window.setTimeout(function() {
        aios_setSSR();
    }, 50);

    // fuer CSS-Zwecke speichern
    AiOS_HELPER.rememberAppInfo( document.getElementById('webpanels-window') );
}


/*
    modifizierte Original-Ueberwachungsfunktion aus web-panels.js
*/
var panelProgressListener = {
    onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress,
        aCurTotalProgress, aMaxTotalProgress) {
    },

    onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
        if(!aRequest) return;

        // Sidebar-/Fenster-Titel setzen
        aios_setSBLabel();

        // Small Screen Rendering?
        //aios_setSSR();

        // Buttons aktivieren/deaktivieren
        //aios_setOptions();

        //ignore local/resource:/chrome: files
        if(aStatus == NS_NET_STATUS_READ_FROM || aStatus == NS_NET_STATUS_WROTE_TO) return;

        const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
        const nsIChannel = Components.interfaces.nsIChannel;

        if(aStateFlags & nsIWebProgressListener.STATE_START && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
            if(window.parent.document.getElementById('sidebar-throbber'))
                window.parent.document.getElementById('sidebar-throbber').setAttribute("loading", "true");
        }
        else if(aStateFlags & nsIWebProgressListener.STATE_STOP && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
            if(window.parent.document.getElementById('sidebar-throbber'))
                window.parent.document.getElementById('sidebar-throbber').removeAttribute("loading");
        }
    },

    onLocationChange: function(aWebProgress, aRequest, aLocation) {
        // Buttons aktivieren/deaktivieren
        aios_setOptions();
    },

    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {
        // Small Screen Rendering?
        aios_setSSR();
    },

    onSecurityChange: function(aWebProgress, aRequest, aState) {
    },

    QueryInterface: function(aIID) {
        if(aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
            return this;

        throw Components.results.NS_NOINTERFACE;
    }
};


/*
    Oeffnet im MultiPanel die im Browser angezeigte Webseite
        => Aufruf durch Buttons, aios_panelTab()
*/
function aios_setMultiPanel(aMode) {
    var label, panelLoc;
    var aios_CONTENT = AiOS_HELPER.mostRecentWindow.document.getElementById('content');

    // about:-Eintraege
    if(aMode.indexOf("about:") == 0 && aMode != "about:blank") {
        panelLoc = (aMode == "about:config") ? "chrome://global/content/config.xul" : aMode;
        label = aMode;
    }
    // WebPanel-Page
    else {
        try {
            panelLoc = aios_CONTENT.currentURI.spec;
            label = aios_CONTENT.selectedTab.label;
        } catch(e) { }

        // ich bin das MultiPanel im Tab
        if(top.toString() == "[object Window]" && AiOS_HELPER.mostRecentWindow.aiosLastSelTab) {
            panelLoc = AiOS_HELPER.mostRecentWindow.aiosLastSelTab.document.location.href;
        }
    }

    // wenn auf "Page" geklickt wird, waehrend im Tab das MultiPanel geladen ist
    if(panelLoc == "chrome://browser/content/web-panels.xul") {
        panelLoc = aios_CONTENT.contentDocument.getElementById('web-panels-browser').getAttribute('cachedurl');
    }

    var newLabel = "";

    // MultiPanel oeffnen bzw. Inhalt laden
    if(top.document.getElementById('sidebar') && top.toString() != "[object Window]")   top.openWebPanel(newLabel, panelLoc);
    else webPanel.contentDocument.location.href = panelLoc;
}


/*
    aktiviert/deaktiviert die Toolbarbuttons und Radio-Menuitems (about)
        => Aufruf durch onLocationChange() wenn sich MultiPanel-URL aendert (panelProgressListener)
*/
function aios_setOptions() {

    var mode, i;

    var aboutGroup = document.getElementById('aboutGroup').childNodes;
    var panelLoc = webPanel.contentDocument.location.href;

    if(panelLoc != "about:blank") {
        mode = "page";
        if(panelLoc.indexOf("about:") == 0 && panelLoc != "about:home") mode = "about";
        if(panelLoc == "chrome://global/content/config.xul") mode = "about";
    }

    if(!mode) return false;

    if(mode != "page") document.getElementById('page-button').setAttribute('checked', false);
    if(mode != "about") document.getElementById('about-button').setAttribute('checked', false);
    document.getElementById(mode + '-button').setAttribute('checked', true);

    if(mode == "page") {
        for(i = 0; i < aboutGroup.length; i++) {
            if(aboutGroup[i].tagName == "menuitem") aboutGroup[i].setAttribute('checked', false);
        }
    }
    else {
        for(i = 0; i < aboutGroup.length; i++) {
            var label = aboutGroup[i].getAttribute('label');
            var isActive = label == panelLoc;
            isActive = (label == "about:config" && panelLoc == "chrome://global/content/config.xul");
            if(aboutGroup[i].tagName == "menuitem" && isActive) aboutGroup[i].setAttribute('checked', true);
        }
    }

    webPanel.setAttribute('cachedurl', panelLoc);
    document.persist('web-panels-browser', "cachedurl");

    return true;
}


/*
    Sidebar-Label einstellen
        => Aufruf durch onload-Event und onStateChange() wenn sich MultiPanel-URL aendert (panelProgressListener)
*/
function aios_setSBLabel() {
    var newLabel = "";

    var mpLabel = AiOS_HELPER.mostRecentWindow.document.getElementById('viewWebPanelsSidebar').getAttribute('label');

    if(webPanel && webPanel.contentDocument) {
        var loc = webPanel.contentDocument.location.href;

        if(webPanel.contentDocument.title != "") newLabel = newLabel + webPanel.contentDocument.title;
    }

    if(newLabel != "") newLabel = newLabel + " - " + mpLabel;
    else newLabel = mpLabel;

    if(top.document.getElementById('sidebar-title'))
        top.document.getElementById('sidebar-title').setAttribute('value', newLabel);

    if(!top.document.getElementById('sidebar-title')) top.document.title = newLabel;
}


/*
    Small Screen Rendering ein/aus
        => Aufruf durch onStateChange() wenn sich MultiPanel-URL aendert (panelProgressListener)
        Original-Code in Teilen von: Daniel Glazman <glazman@netscape.com>
*/
function aios_setSSR() {
    //if(!aios_getBoolean("ssr-mitem", "checked")) return false;

    var ssrURL = "chrome://aios/skin/css/multipanel_ssr.css";

    try {
        var doc = webPanel.contentDocument;
    //var docRoot = doc.documentElement;    // Abfrage verursacht bei einigen Seiten einen groesser skalierten Text ???
    //var docRootName = docRoot.nodeName.toLowerCase();
    } catch(e) { }

    //if(!doc || !docRoot || !docRootName || !doc.body || !aios_getBoolean("page-button", "checked")) return false;
    if(!doc || !doc.body || !aios_getBoolean("page-button", "checked")) return false;

    // is the document using frames ? we don't like frames for the moment
    //if(docRootName == "html" && doc.body.nodeName.toLowerCase() == "frameset") {
    if(doc.body.nodeName.toLowerCase() == "frameset") {
        dump("Small Screen Rendering, No frames allowed");
        return false;
    }

    var styleSheets = doc.styleSheets;
    for(var i = 0; i < styleSheets.length; ++i) {
        var currentStyleSheet = styleSheets[i];

        if(/multipanel_ssr/.test(currentStyleSheet.href)) {
            currentStyleSheet.disabled = !aios_getBoolean("ssr-mitem", "checked");
            var aiosSidebar = aios_getBoolean("ssr-mitem", "checked") && aios_getBoolean("ssrSidebar-mitem", "checked");
            doc.body.setAttribute('aiosSidebar', aiosSidebar);
            return true;
        }
    }

    // we have to attach the stylesheet to the document...
    // what's the document root ? html ?
    //if(docRootName == "html" && aios_getBoolean("ssr-mitem", "checked")) {
    if(aios_getBoolean("ssr-mitem", "checked")) {
        // let's create a link element
        var headElement = doc.getElementsByTagName("head")[0];
        var linkElement = doc.createElement("link");
        linkElement.setAttribute("rel", "stylesheet");
        linkElement.setAttribute("type", "text/css");
        linkElement.setAttribute("href", ssrURL);

        headElement.appendChild(linkElement);
    }

    return true;
}


/*
    MultiPanel-Unload
*/
function aios_unloadMultiPanel() {
    if(webPanel && !aios_getBoolean("aios-remMultiPanel", "checked")) {
        webPanel.setAttribute('cachedurl', '');
        document.persist('web-panels-browser', "cachedurl");
    }
}


function aios_getPageOptions() {
    document.getElementById('ssrSidebar-mitem').setAttribute('disabled', !aios_getBoolean("ssr-mitem", "checked"));
}