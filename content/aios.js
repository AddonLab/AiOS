var AiOS = {

    mainWindow: document.getElementById('main-window'),


    initOnDOMLoaded: function() {

        AiOS_HELPER.rememberAppInfo( AiOS.mainWindow );

    },


    // initOnLoad: function() {

    // },


    beforeCustomization: function() {

        var toolbars = new Array(AiOS_HELPER.aiosToolbar, AiOS_HELPER.sbhToolbar);

        PlacesToolbarHelper.customizeStart();

        for(var i in toolbars) {

            toolbars[i].setAttribute('_toolbox', toolbars[i].parentNode.id);

            toolbars[i].setAttribute('_context', toolbars[i].getAttribute('context'));
            toolbars[i].setAttribute('context', 'toolbar-context-menu');
            toolbars[i].setAttribute('_orient', toolbars[i].getAttribute('orient'));
            toolbars[i].setAttribute('orient', 'horizontal');
            toolbars[i].setAttribute('_mode', toolbars[i].getAttribute('mode'));
            toolbars[i].setAttribute('mode', 'icons');

            toolbars[i].setAttribute('align', 'center');

            var label = document.createElement('label');
            label.setAttribute('value', toolbars[i].getAttribute('toolbarlabel'));
            toolbars[i].insertBefore(label, toolbars[i].firstChild);

            gNavToolbox.appendChild(toolbars[i]);

        }

        PlacesToolbarHelper.customizeDone();

    },


    afterCustomization: function() {

        var toolbars = new Array(AiOS_HELPER.aiosToolbar, AiOS_HELPER.sbhToolbar);

        PlacesToolbarHelper.customizeStart();

        for(var i in toolbars) {

            toolbars[i].removeChild(toolbars[i].querySelector('label'));

            toolbars[i].setAttribute('context', toolbars[i].getAttribute('_context'));
            toolbars[i].removeAttribute('_context');
            toolbars[i].setAttribute('orient', toolbars[i].getAttribute('_orient'));
            toolbars[i].removeAttribute('_orient');
            toolbars[i].setAttribute('mode', toolbars[i].getAttribute('_mode'));
            toolbars[i].removeAttribute('_mode');

            toolbars[i].removeAttribute('align');

            document.getElementById(toolbars[i].getAttribute('_toolbox')).appendChild(toolbars[i]);
            toolbars[i].removeAttribute('_toolbox');

        }

        PlacesToolbarHelper.customizeDone();

    },


    unload: function() {
        window.removeEventListener("DOMContentLoaded", AiOS.initOnDOMLoaded);
        //window.removeEventListener("load", AiOS.initOnLoad);
        window.removeEventListener("unload", AiOS.unload);

        gNavToolbox.removeEventListener("beforecustomization", AiOS.beforeCustomization);
        gNavToolbox.removeEventListener("aftercustomization", AiOS.afterCustomization);
    }

};

window.addEventListener("DOMContentLoaded", AiOS.initOnDOMLoaded, false);
//window.addEventListener("load", AiOS.initOnLoad, false);
window.addEventListener("unload", AiOS.unload, false);

gNavToolbox.addEventListener("beforecustomization", AiOS.beforeCustomization, false);
gNavToolbox.addEventListener("aftercustomization", AiOS.afterCustomization, false);