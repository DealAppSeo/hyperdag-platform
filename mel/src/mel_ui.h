#ifndef MEL_UI_H
#define MEL_UI_H

#include <geanyplugin.h>
#include <gtk/gtk.h>

void mel_ui_init(GeanyData *data);
void mel_ui_cleanup(void);
void mel_ui_show_suggestion(const char* suggestion);

#endif /* MEL_UI_H */