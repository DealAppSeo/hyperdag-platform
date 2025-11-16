#ifndef MEL_DB_H
#define MEL_DB_H

#include <sqlite3.h>

typedef struct {
    sqlite3 *db;
    char *db_path;
} MelDatabase;

int mel_db_init(void);
void mel_db_cleanup(void);
int mel_db_store_learning_data(const char* pattern, const char* response);
char* mel_db_get_learning_data(const char* pattern);

#endif /* MEL_DB_H */