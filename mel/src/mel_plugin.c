#include <geanyplugin.h>
#include "mel_core.h"

GeanyPlugin *geany_plugin;
GeanyData *geany_data;

PLUGIN_VERSION_CHECK(237)

PLUGIN_SET_INFO("Mel",
    "Adaptive AI Assistant for Geany",
    "1.0.0",
    "dealappseo (https://melchizedekai.com)")

void plugin_init(GeanyData *data) {
    mel_core_init(data);
}

void plugin_cleanup(void) {
    mel_core_cleanup();
}