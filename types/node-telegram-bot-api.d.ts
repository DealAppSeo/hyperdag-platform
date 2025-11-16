declare module 'node-telegram-bot-api' {
  interface Message {
    message_id: number;
    from?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  }
  
  interface BotOptions {
    polling?: boolean | {
      interval?: number;
      autoStart?: boolean;
      params?: {
        timeout?: number;
        limit?: number;
        offset?: number;
      };
    };
    webHook?: {
      host?: string;
      port?: number;
      key?: string;
      cert?: string;
      pfx?: string;
      autoOpen?: boolean;
      https?: any;
      healthEndpoint?: string;
    };
    onlyFirstMatch?: boolean;
    baseApiUrl?: string;
    filepath?: boolean;
    badRejection?: boolean;
    request?: any;
    testEnvironment?: boolean;
  }
  
  class TelegramBot {
    constructor(token: string, options?: BotOptions);
    on(event: string, listener: (msg: Message) => void): this;
    sendMessage(chatId: number | string, text: string, options?: any): Promise<Message>;
    stopPolling(): Promise<void>;
    startPolling(): Promise<void>;
  }
  
  export default TelegramBot;
}
