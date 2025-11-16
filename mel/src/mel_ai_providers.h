#ifndef MEL_AI_PROVIDERS_H
#define MEL_AI_PROVIDERS_H

typedef enum {
    MEL_PROVIDER_OPENAI,
    MEL_PROVIDER_ANTHROPIC,
    MEL_PROVIDER_GOOGLE,
    MEL_PROVIDER_LOCAL
} MelAIProvider;

void mel_ai_providers_init(void);
void mel_ai_providers_cleanup(void);
char* mel_ai_query(MelAIProvider provider, const char* prompt);

#endif /* MEL_AI_PROVIDERS_H */