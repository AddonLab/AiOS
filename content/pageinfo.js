
var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;
var aios_inTab = (AiOS_HELPER.mostRecentWindow.aiosLastSelTab) ? true : false;

// Listener fuer automatische Aktualisierung hinzufuegen u. entfernen
if(aios_inSidebar) {
    window.addEventListener("load", function(e) {
        top.gBrowser.addProgressListener(aiosProgListener);
    }, false);

    window.addEventListener("unload",function(e) {
        top.gBrowser.removeProgressListener(aiosProgListener);
    }, false);
}



function aios_init() {
    // Menueleiste unter Mac OS X ausblenden
    aios_hideMacMenubar();

    // fuer CSS-Zwecke speichern
    AiOS_HELPER.rememberAppInfo( document.getElementById('main-window') );

    try {
        var enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("pi.layout");
        var enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("pi.layoutall");
        if((enable_layout && aios_inSidebar) || enable_layoutall) aios_sidebarLayout();
    }
    catch(e) { }

    // Tastaturkuerzel entfernen, um nicht die des Hauptbrowsers zu blockieren
    if(aios_inSidebar) aios_removeAccesskeys();
}


function aios_sidebarLayout() {
    var vbox;

    // CSS fuer Sidebar-Optimierungen aktivieren
    aios_addCSS("pageinfo.css", "main-window");

    // Label der Radio-Buttons unsichtbar machen => nur wenn es Icons gibt
    var cStyle = document.defaultView.getComputedStyle(document.getElementById('generalTab'), '');
    if(cStyle.listStyleImage && cStyle.listStyleImage != "none") {
        if(document.getElementById('viewGroup')) document.getElementById('viewGroup').setAttribute("hideLabel", true);
    }

    // Radio-Buttons mit Tooltip
    if(document.getElementById('viewGroup')) {
        var radioChilds = document.getElementById('viewGroup').childNodes;
        for(var i = 0; i < radioChilds.length; i++) {
            if(radioChilds[i].tagName == "radio") radioChilds[i].setAttribute('tooltiptext', radioChilds[i].label);
        }
    }

    // Media-Panel: Save as... button umbrechen
    var hbox = document.getElementById('mediaPreviewBox').getElementsByTagName('hbox')[0];
    hbox.setAttribute('align', 'start');
    hbox.setAttribute('orient', 'vertical');
    hbox.removeChild(hbox.getElementsByTagName('spacer')[0]);
    hbox.appendChild(hbox.getElementsByTagName('vbox')[0]);

    // Security-Panel: Texte und Buttons umbrechen
    // Identity
    var groupbox = document.getElementById('security-identity-groupbox');
    groupbox.removeChild(groupbox.getElementsByTagName('spacer')[0]);
    groupbox.getElementsByTagName('hbox')[0].setAttribute('orient', 'vertical');
    groupbox.getElementsByTagName('hbox')[0].setAttribute('align', 'start');

    // History
    var historyrow = document.getElementById('security-privacy-history-label').parentNode;
    vbox = document.createElement("vbox");
    while(historyrow.childNodes.length != 0) {
        vbox.appendChild(historyrow.firstChild);
    }
    vbox.setAttribute('flex', '100');
    historyrow.appendChild(vbox);

    // Cookies
    var cookierow = document.getElementById('security-privacy-cookies-label').parentNode;
    vbox = document.createElement("vbox");
    while(cookierow.childNodes.length != 0) {
        vbox.appendChild(cookierow.firstChild);
    }
    vbox.setAttribute('flex', '100');
    cookierow.appendChild(vbox);

    // Passwords
    var pwdrow = document.getElementById('security-privacy-passwords-label').parentNode;
    vbox = document.createElement("vbox");
    while(pwdrow.childNodes.length != 0) {
        vbox.appendChild(pwdrow.firstChild);
    }
    vbox.setAttribute('flex', '100');
    pwdrow.appendChild(vbox);
}


// automatische Aktualisierung => Aufruf durch aiosProgListener (_helper.js)
function aios_onLocationChange() {
    if(aios_inSidebar) {
        aios_persistSelTab();
        location.reload();
    }
}


function aios_onStateChange() {
    aios_onLocationChange();
}


// letzten selektierten Tab merken
function aios_persistSelTab() {
    document.getElementById('main-window').setAttribute("seltab", document.getElementById('viewGroup').selectedIndex);
}


/* Called when PageInfo window is loaded.  Arguments are:
 *  window.arguments[0] - (optional) an object consisting of
 *                         - doc: (optional) document to use for source. if not provided,
 *                                the calling window's document will be used
 *                         - initialTab: (optional) id of the inital tab to display
 */
function onLoadPageInfo() {
    gBundle = document.getElementById("pageinfobundle");
    gStrings.unknown = gBundle.getString("unknown");
    gStrings.notSet = gBundle.getString("notset");
    gStrings.mediaImg = gBundle.getString("mediaImg");
    gStrings.mediaBGImg = gBundle.getString("mediaBGImg");
    gStrings.mediaObject = gBundle.getString("mediaObject");
    gStrings.mediaEmbed = gBundle.getString("mediaEmbed");
    gStrings.mediaLink = gBundle.getString("mediaLink");
    gStrings.mediaInput = gBundle.getString("mediaInput");
    //@line 292 "e:\builds\moz2_slave\rel-cen-w32-bld\build\browser\base\content\pageinfo\pageInfo.js"
    gStrings.mediaVideo = gBundle.getString("mediaVideo");
    gStrings.mediaAudio = gBundle.getString("mediaAudio");
    //@line 295 "e:\builds\moz2_slave\rel-cen-w32-bld\build\browser\base\content\pageinfo\pageInfo.js"

    var args = "arguments" in window &&
    window.arguments.length >= 1 &&
    window.arguments[0];

    // mod by eXXile
    if(aios_inSidebar) {
        var aios_sidebar = top.document.getElementById('sidebar-box');
        var aios_window = document.getElementById('main-window');

        gDocument = AiOS_HELPER.mostRecentWindow.content.document;
        gWindow = AiOS_HELPER.mostRecentWindow.content.window;
    }
    else if(aios_inTab) {

        gDocument = AiOS_HELPER.mostRecentWindow.aiosLastSelTab.document;
        gWindow = AiOS_HELPER.mostRecentWindow.content.window;
    }
    // Original-FF-Teil
    else {
        if (!args || !args.doc) {
            gWindow = window.opener.content;
            gDocument = gWindow.document;
        }
    }

    // init media view
    var imageTree = document.getElementById("imagetree");
    imageTree.view = gImageView;

    /* Select the requested tab, if the name is specified */
    loadTab(args);
    Components.classes["@mozilla.org/observer-service;1"]
    .getService(Components.interfaces.nsIObserverService)
    .notifyObservers(window, "page-info-dialog-loaded", null);
}


var security = {
    // Display the server certificate (static)
    viewCert : function () {
        var cert = security._cert;
        //viewCertHelper(window, cert);

        // mod by eXXile
        if(aios_inSidebar) viewCertHelper(AiOS_HELPER.mostRecentWindow.content.window, cert);
        else if(aios_inTab) viewCertHelper(AiOS_HELPER.mostRecentWindow.aiosLastSelTab.window, cert);
        else viewCertHelper(window, cert);
    // endmod by eXXile
    },

    _getSecurityInfo : function() {
        const nsIX509Cert = Components.interfaces.nsIX509Cert;
        //mod by exxile const nsIX509CertDB = Components.interfaces.nsIX509CertDB;
        const nsX509CertDB = "@mozilla.org/security/x509certdb;1";
        const nsISSLStatusProvider = Components.interfaces.nsISSLStatusProvider;
        const nsISSLStatus = Components.interfaces.nsISSLStatus;

        // We don't have separate info for a frame, return null until further notice
        // (see bug 138479)
        if (gWindow != gWindow.top)
            return null;

        var hName = null;
        try {
            hName = gWindow.location.host;
        }
        catch (exception) { }

        var ui = security._getSecurityUI();
        if (!ui)
            return null;

        var isBroken =
        (ui.state & Components.interfaces.nsIWebProgressListener.STATE_IS_BROKEN);
        var isInsecure =
        (ui.state & Components.interfaces.nsIWebProgressListener.STATE_IS_INSECURE);
        var isEV =
        (ui.state & Components.interfaces.nsIWebProgressListener.STATE_IDENTITY_EV_TOPLEVEL);
        ui.QueryInterface(nsISSLStatusProvider);
        var status = ui.SSLStatus;

        if (!isInsecure && status) {
            status.QueryInterface(nsISSLStatus);
            var cert = status.serverCert;
            var issuerName =
            this.mapIssuerOrganization(cert.issuerOrganization) || cert.issuerName;

            var retval = {
                hostName : hName,
                cAName : issuerName,
                encryptionAlgorithm : undefined,
                encryptionStrength : undefined,
                isBroken : isBroken,
                isEV : isEV,
                cert : cert,
                fullLocation : gWindow.location
            };

            try {
                retval.encryptionAlgorithm = status.cipherName;
                retval.encryptionStrength = status.secretKeyLength;
            }
            catch (e) {
            }

            return retval;
        } else {
            return {
                hostName : hName,
                cAName : "",
                encryptionAlgorithm : "",
                encryptionStrength : 0,
                isBroken : isBroken,
                isEV : isEV,
                cert : null,
                fullLocation : gWindow.location
            };
        }
    },

    // Find the secureBrowserUI object (if present)
    _getSecurityUI : function() {
        // mod by eXXile
        if(aios_inSidebar) {
            if("gBrowser" in top) return top.gBrowser.securityUI;
            return null;
        }
        else if(aios_inTab) {
            return AiOS_HELPER.mostRecentWindow.aiosLastSelTab.securityUI;
        }
        // Original-FF-Teil
        else {
            if (window.opener.gBrowser) return window.opener.gBrowser.securityUI;
            return null;
        }
    },

    // Interface for mapping a certificate issuer organization to
    // the value to be displayed.
    // Bug 82017 - this implementation should be moved to pipnss C++ code
    mapIssuerOrganization: function(name) {
        if (!name) return null;

        if (name == "RSA Data Security, Inc.") return "Verisign, Inc.";

        // No mapping required
        return name;
    },

    /**
   * Open the cookie manager window
   */
    viewCookies : function() {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
        var win = wm.getMostRecentWindow("Browser:Cookies");
        var eTLDService = Components.classes["@mozilla.org/network/effective-tld-service;1"].
        getService(Components.interfaces.nsIEffectiveTLDService);

        var eTLD;
        var uri = gDocument.documentURIObject;
        try {
            eTLD = eTLDService.getBaseDomain(uri);
        }
        catch (e) {
            // getBaseDomain will fail if the host is an IP address or is empty
            eTLD = uri.asciiHost;
        }

        if (win) {
            win.gCookiesWindow.setFilter(eTLD);
            win.focus();
        }
        else
            window.openDialog("chrome://browser/content/preferences/cookies.xul",
                "Browser:Cookies", "", {
                    filterString : eTLD
                });
    },

    /**
   * Open the login manager window
   */
    viewPasswords : function() {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
        var win = wm.getMostRecentWindow("Toolkit:PasswordManager");
        if (win) {
            win.setFilter(this._getSecurityInfo().hostName);
            win.focus();
        }
        else
            window.openDialog("chrome://passwordmgr/content/passwordManager.xul",
                "Toolkit:PasswordManager", "",
                {
                    filterString : this._getSecurityInfo().hostName
                });
    },

    _cert : null
};
