#ifndef MEL_LEARNING_H
#define MEL_LEARNING_H

typedef struct {
    char *pattern;
    char *context;
    float confidence;
    int usage_count;
} MelLearningPattern;

void mel_learning_init(void);
void mel_learning_cleanup(void);
void mel_learning_record_interaction(const char* context, const char* action);
char* mel_learning_get_suggestion(const char* context);

#endif /* MEL_LEARNING_H */