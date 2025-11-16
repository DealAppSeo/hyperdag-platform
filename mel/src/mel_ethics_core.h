#ifndef MEL_ETHICS_CORE_H
#define MEL_ETHICS_CORE_H

typedef enum {
    MEL_ETHICS_APPROVED,
    MEL_ETHICS_REJECTED,
    MEL_ETHICS_NEEDS_REVIEW
} MelEthicsResult;

void mel_ethics_core_init(void);
void mel_ethics_core_cleanup(void);
MelEthicsResult mel_ethics_check_suggestion(const char* suggestion);
int mel_ethics_check_privacy(const char* data);

#endif /* MEL_ETHICS_CORE_H */