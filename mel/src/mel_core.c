#include "mel_core.h"
#include "mel_ui.h"
#include "mel_ai_providers.h"
#include "mel_db.h"
#include "mel_learning.h"
#include "mel_ethics_core.h"

void mel_core_init(GeanyData *data) {
    // Initialize database
    mel_db_init();
    
    // Initialize AI providers
    mel_ai_providers_init();
    
    // Initialize learning system
    mel_learning_init();
    
    // Initialize ethics core
    mel_ethics_core_init();
    
    // Initialize UI
    mel_ui_init(data);
}

void mel_core_cleanup(void) {
    mel_ui_cleanup();
    mel_ethics_core_cleanup();
    mel_learning_cleanup();
    mel_ai_providers_cleanup();
    mel_db_cleanup();
}