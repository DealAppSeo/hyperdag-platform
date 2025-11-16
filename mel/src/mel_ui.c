#include "mel_ui.h"

static GtkWidget *mel_panel = NULL;

void mel_ui_init(GeanyData *data) {
    // Create Mel panel in Geany
    mel_panel = gtk_vbox_new(FALSE, 0);
    
    // Add to Geany's message window
    // Set up event handlers
    // Initialize suggestion popup
}

void mel_ui_cleanup(void) {
    if (mel_panel) {
        gtk_widget_destroy(mel_panel);
        mel_panel = NULL;
    }
}

void mel_ui_show_suggestion(const char* suggestion) {
    // Display AI suggestion in popup or panel
    // Handle user interaction (accept/reject)
}