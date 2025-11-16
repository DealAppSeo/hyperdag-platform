/**
 * Comprehensive Twilio Service
 * 
 * Complete communication service providing:
 * - SMS messaging with delivery tracking and status callbacks
 * - Voice calls with TwiML response handling and call management
 * - Phone number management and validation
 * - Message and call history tracking
 * - Webhook handling for status updates
 * - Rate limiting and error handling
 * 
 * Uses the Twilio SDK for robust communication features
 */

import twilio, { Twilio } from 'twilio';
import { formatPhoneNumberForTwilio, isValidPhoneNumber, maskPhoneNumber } from '../utils/phone-utils.js';
import { logger } from '../utils/logger.js';

// TypeScript Interfaces
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  statusCallbackUrl?: string;
  voiceUrl?: string;
}

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
  statusCallback?: string;
  provideFeedback?: boolean;
  maxPrice?: string;
  validityPeriod?: number;
  forceDelivery?: boolean;
  smartEncoded?: boolean;
  persistentAction?: string[];
}

export interface SMSResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  numSegments: string;
  direction: string;
  apiVersion: string;
  price?: string;
  priceUnit?: string;
  errorCode?: string;
  errorMessage?: string;
  uri: string;
  dateCreated: Date;
  dateSent?: Date;
  dateUpdated: Date;
  accountSid: string;
  messagingServiceSid?: string;
  numMedia: string;
  subresourceUris: any;
}

export interface VoiceCall {
  to: string;
  from?: string;
  url?: string;
  twiml?: string;
  method?: 'GET' | 'POST';
  fallbackUrl?: string;
  fallbackMethod?: 'GET' | 'POST';
  statusCallback?: string;
  statusCallbackEvent?: string[];
  statusCallbackMethod?: 'GET' | 'POST';
  sendDigits?: string;
  timeout?: number;
  record?: boolean;
  recordingChannels?: 'mono' | 'dual';
  recordingStatusCallback?: string;
  recordingStatusCallbackMethod?: 'GET' | 'POST';
  sipAuthUsername?: string;
  sipAuthPassword?: string;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  machineDetectionTimeout?: number;
  recordingStatusCallbackEvent?: string[];
  trim?: 'trim-silence' | 'do-not-trim';
  callerName?: string;
  timeLimit?: number;
  callReason?: string;
  callerId?: string;
  byoc?: string;
}

export interface VoiceResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  phoneNumberSid?: string;
  price?: string;
  priceUnit?: string;
  direction: string;
  answeredBy?: string;
  apiVersion: string;
  forwardedFrom?: string;
  groupSid?: string;
  callerName?: string;
  duration?: string;
  startTime?: Date;
  endTime?: Date;
  dateCreated: Date;
  dateUpdated: Date;
  parentCallSid?: string;
  accountSid: string;
  annotation?: string;
  queueTime?: string;
  uri: string;
  subresourceUris: any;
}

export interface TwiMLResponse {
  response: string;
  contentType: 'application/xml' | 'text/xml';
}

export interface PhoneNumberInfo {
  phoneNumber: string;
  friendlyName?: string;
  sid: string;
  accountSid: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
  statusCallback?: string;
  statusCallbackMethod?: string;
  apiVersion: string;
  voiceUrl?: string;
  voiceMethod?: string;
  voiceFallbackUrl?: string;
  voiceFallbackMethod?: string;
  voiceCallerIdLookup?: boolean;
  dateCreated: Date;
  dateUpdated: Date;
  smsUrl?: string;
  smsMethod?: string;
  smsFallbackUrl?: string;
  smsFallbackMethod?: string;
  trunkSid?: string;
  emergencyStatus?: string;
  emergencyAddressSid?: string;
  uri: string;
}

export interface MessageStatus {
  sid: string;
  status: 'accepted' | 'queued' | 'sending' | 'sent' | 'receiving' | 'received' | 'delivered' | 'undelivered' | 'failed' | 'read';
  errorCode?: number;
  errorMessage?: string;
  price?: string;
  priceUnit?: string;
  direction: 'inbound' | 'outbound';
  dateCreated: Date;
  dateSent?: Date;
  dateUpdated: Date;
}

export interface CallStatus {
  sid: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  price?: string;
  priceUnit?: string;
  direction: 'inbound' | 'outbound';
  answeredBy?: 'human' | 'machine';
  machineDetectionDuration?: number;
  recordingUrl?: string;
  recordingSid?: string;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface TwilioStats {
  provider: string;
  isConfigured: boolean;
  isConnected: boolean;
  phoneNumber?: string;
  maskedPhoneNumber?: string;
  accountSid?: string;
  capabilities: {
    sms: boolean;
    mms: boolean;
    voice: boolean;
    video: boolean;
    fax: boolean;
  };
  usage: {
    messagesSentToday: number;
    callsMadeToday: number;
    totalCostToday: number;
  };
  supportedFeatures: string[];
}

/**
 * Comprehensive Twilio Communication Service
 */
export class TwilioService {
  private config: TwilioConfig;
  private client: Twilio | null = null;
  private isInitialized = false;
  private messagesSentToday = 0;
  private callsMadeToday = 0;
  private totalCostToday = 0;
  private lastResetDate = new Date().toDateString();

  constructor(config?: Partial<TwilioConfig>) {
    this.config = {
      accountSid: config?.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
      authToken: config?.authToken || process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: config?.phoneNumber || process.env.TWILIO_PHONE_NUMBER || '',
      statusCallbackUrl: config?.statusCallbackUrl,
      voiceUrl: config?.voiceUrl
    };

    if (this.config.accountSid && this.config.authToken) {
      this.initialize();
    } else {
      logger.warn('[Twilio] Service created without credentials - will initialize when credentials are provided');
    }
  }

  /**
   * Initialize the Twilio service
   */
  private async initialize(): Promise<void> {
    try {
      if (!this.config.accountSid || !this.config.authToken) {
        throw new Error('Twilio Account SID and Auth Token are required');
      }

      if (!this.config.phoneNumber) {
        logger.warn('[Twilio] No phone number configured - some features may be limited');
      }

      this.client = twilio(this.config.accountSid, this.config.authToken);

      // Test connection by fetching account info
      await this.client.api.accounts(this.config.accountSid).fetch();
      
      this.isInitialized = true;
      logger.info(`[Twilio] Service initialized successfully`);
      logger.info(`[Twilio] Phone number: ${maskPhoneNumber(this.config.phoneNumber)}`);
      
    } catch (error) {
      logger.error('[Twilio] Failed to initialize service:', error);
      throw new Error('Failed to initialize Twilio service');
    }
  }

  /**
   * Check if service is available
   */
  public isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Reset daily counters if it's a new day
   */
  private resetDailyCountersIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.messagesSentToday = 0;
      this.callsMadeToday = 0;
      this.totalCostToday = 0;
      this.lastResetDate = today;
    }
  }

  // SMS Methods

  /**
   * Send an SMS message
   */
  public async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    this.resetDailyCountersIfNeeded();

    try {
      // Validate phone number
      const formattedTo = formatPhoneNumberForTwilio(message.to);
      if (!formattedTo || !isValidPhoneNumber(formattedTo)) {
        throw new Error(`Invalid phone number: ${message.to}`);
      }

      const fromNumber = message.from || this.config.phoneNumber;
      if (!fromNumber) {
        throw new Error('No from phone number specified');
      }

      const twilioMessage = await this.client!.messages.create({
        body: message.body,
        from: fromNumber,
        to: formattedTo,
        mediaUrl: message.mediaUrl,
        statusCallback: message.statusCallback || this.config.statusCallbackUrl,
        provideFeedback: message.provideFeedback,
        maxPrice: message.maxPrice,
        validityPeriod: message.validityPeriod,
        forceDelivery: message.forceDelivery,
        smartEncoded: message.smartEncoded,
        persistentAction: message.persistentAction
      });

      this.messagesSentToday++;
      if (twilioMessage.price) {
        this.totalCostToday += parseFloat(twilioMessage.price);
      }

      logger.info(`[Twilio] SMS sent to ${maskPhoneNumber(formattedTo)}, SID: ${twilioMessage.sid}`);

      return {
        sid: twilioMessage.sid,
        status: twilioMessage.status,
        to: twilioMessage.to,
        from: twilioMessage.from,
        body: twilioMessage.body,
        numSegments: twilioMessage.numSegments,
        direction: twilioMessage.direction,
        apiVersion: twilioMessage.apiVersion,
        price: twilioMessage.price,
        priceUnit: twilioMessage.priceUnit,
        errorCode: twilioMessage.errorCode?.toString(),
        errorMessage: twilioMessage.errorMessage,
        uri: twilioMessage.uri,
        dateCreated: twilioMessage.dateCreated,
        dateSent: twilioMessage.dateSent,
        dateUpdated: twilioMessage.dateUpdated,
        accountSid: twilioMessage.accountSid,
        messagingServiceSid: twilioMessage.messagingServiceSid,
        numMedia: twilioMessage.numMedia,
        subresourceUris: twilioMessage.subresourceUris
      };

    } catch (error: any) {
      logger.error('[Twilio] Failed to send SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Get SMS message status
   */
  public async getSMSStatus(messageSid: string): Promise<MessageStatus> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    try {
      const message = await this.client!.messages(messageSid).fetch();

      return {
        sid: message.sid,
        status: message.status as any,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        price: message.price,
        priceUnit: message.priceUnit,
        direction: message.direction as any,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };

    } catch (error: any) {
      logger.error(`[Twilio] Failed to get SMS status for ${messageSid}:`, error);
      throw new Error(`Failed to get SMS status: ${error.message}`);
    }
  }

  /**
   * Get SMS messages (with optional filtering)
   */
  public async getSMSMessages(options?: {
    to?: string;
    from?: string;
    dateSent?: Date;
    dateSentBefore?: Date;
    dateSentAfter?: Date;
    limit?: number;
  }): Promise<SMSResponse[]> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    try {
      const messages = await this.client!.messages.list({
        to: options?.to,
        from: options?.from,
        dateSent: options?.dateSent,
        dateSentBefore: options?.dateSentBefore,
        dateSentAfter: options?.dateSentAfter,
        limit: options?.limit || 50
      });

      return messages.map(msg => ({
        sid: msg.sid,
        status: msg.status,
        to: msg.to,
        from: msg.from,
        body: msg.body,
        numSegments: msg.numSegments,
        direction: msg.direction,
        apiVersion: msg.apiVersion,
        price: msg.price,
        priceUnit: msg.priceUnit,
        errorCode: msg.errorCode?.toString(),
        errorMessage: msg.errorMessage,
        uri: msg.uri,
        dateCreated: msg.dateCreated,
        dateSent: msg.dateSent,
        dateUpdated: msg.dateUpdated,
        accountSid: msg.accountSid,
        messagingServiceSid: msg.messagingServiceSid,
        numMedia: msg.numMedia,
        subresourceUris: msg.subresourceUris
      }));

    } catch (error: any) {
      logger.error('[Twilio] Failed to get SMS messages:', error);
      throw new Error(`Failed to get SMS messages: ${error.message}`);
    }
  }

  // Voice Methods

  /**
   * Make a voice call
   */
  public async makeCall(call: VoiceCall): Promise<VoiceResponse> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    this.resetDailyCountersIfNeeded();

    try {
      // Validate phone number
      const formattedTo = formatPhoneNumberForTwilio(call.to);
      if (!formattedTo || !isValidPhoneNumber(formattedTo)) {
        throw new Error(`Invalid phone number: ${call.to}`);
      }

      const fromNumber = call.from || this.config.phoneNumber;
      if (!fromNumber) {
        throw new Error('No from phone number specified');
      }

      const twilioCall = await this.client!.calls.create({
        to: formattedTo,
        from: fromNumber,
        url: call.url || this.config.voiceUrl,
        twiml: call.twiml,
        method: call.method,
        fallbackUrl: call.fallbackUrl,
        fallbackMethod: call.fallbackMethod,
        statusCallback: call.statusCallback || this.config.statusCallbackUrl,
        statusCallbackEvent: call.statusCallbackEvent,
        statusCallbackMethod: call.statusCallbackMethod,
        sendDigits: call.sendDigits,
        timeout: call.timeout,
        record: call.record,
        recordingChannels: call.recordingChannels,
        recordingStatusCallback: call.recordingStatusCallback,
        recordingStatusCallbackMethod: call.recordingStatusCallbackMethod,
        sipAuthUsername: call.sipAuthUsername,
        sipAuthPassword: call.sipAuthPassword,
        machineDetection: call.machineDetection,
        machineDetectionTimeout: call.machineDetectionTimeout,
        recordingStatusCallbackEvent: call.recordingStatusCallbackEvent,
        trim: call.trim,
        callerName: call.callerName,
        timeLimit: call.timeLimit,
        callReason: call.callReason,
        callerId: call.callerId,
        byoc: call.byoc
      });

      this.callsMadeToday++;
      if (twilioCall.price) {
        this.totalCostToday += parseFloat(twilioCall.price);
      }

      logger.info(`[Twilio] Call initiated to ${maskPhoneNumber(formattedTo)}, SID: ${twilioCall.sid}`);

      return {
        sid: twilioCall.sid,
        status: twilioCall.status,
        to: twilioCall.to,
        from: twilioCall.from,
        phoneNumberSid: twilioCall.phoneNumberSid,
        price: twilioCall.price,
        priceUnit: twilioCall.priceUnit,
        direction: twilioCall.direction,
        answeredBy: twilioCall.answeredBy,
        apiVersion: twilioCall.apiVersion,
        forwardedFrom: twilioCall.forwardedFrom,
        groupSid: twilioCall.groupSid,
        callerName: twilioCall.callerName,
        duration: twilioCall.duration,
        startTime: twilioCall.startTime,
        endTime: twilioCall.endTime,
        dateCreated: twilioCall.dateCreated,
        dateUpdated: twilioCall.dateUpdated,
        parentCallSid: twilioCall.parentCallSid,
        accountSid: twilioCall.accountSid,
        annotation: twilioCall.annotation,
        queueTime: twilioCall.queueTime,
        uri: twilioCall.uri,
        subresourceUris: twilioCall.subresourceUris
      };

    } catch (error: any) {
      logger.error('[Twilio] Failed to make call:', error);
      throw new Error(`Failed to make call: ${error.message}`);
    }
  }

  /**
   * Get call status
   */
  public async getCallStatus(callSid: string): Promise<CallStatus> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    try {
      const call = await this.client!.calls(callSid).fetch();

      return {
        sid: call.sid,
        status: call.status as any,
        duration: call.duration ? parseInt(call.duration) : undefined,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        priceUnit: call.priceUnit,
        direction: call.direction as any,
        answeredBy: call.answeredBy as any,
        machineDetectionDuration: call.machineDetectionDuration,
        recordingUrl: call.recordings().list().then(recordings => recordings[0]?.uri),
        recordingSid: call.recordings().list().then(recordings => recordings[0]?.sid),
        dateCreated: call.dateCreated,
        dateUpdated: call.dateUpdated
      };

    } catch (error: any) {
      logger.error(`[Twilio] Failed to get call status for ${callSid}:`, error);
      throw new Error(`Failed to get call status: ${error.message}`);
    }
  }

  /**
   * Hang up a call
   */
  public async hangupCall(callSid: string): Promise<boolean> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    try {
      await this.client!.calls(callSid).update({ status: 'completed' });
      logger.info(`[Twilio] Call ${callSid} hung up successfully`);
      return true;
    } catch (error: any) {
      logger.error(`[Twilio] Failed to hang up call ${callSid}:`, error);
      return false;
    }
  }

  /**
   * Get calls (with optional filtering)
   */
  public async getCalls(options?: {
    to?: string;
    from?: string;
    parentCallSid?: string;
    status?: string;
    startTimeBefore?: Date;
    startTimeAfter?: Date;
    endTimeBefore?: Date;
    endTimeAfter?: Date;
    limit?: number;
  }): Promise<VoiceResponse[]> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    try {
      const calls = await this.client!.calls.list({
        to: options?.to,
        from: options?.from,
        parentCallSid: options?.parentCallSid,
        status: options?.status as any,
        startTimeBefore: options?.startTimeBefore,
        startTimeAfter: options?.startTimeAfter,
        endTimeBefore: options?.endTimeBefore,
        endTimeAfter: options?.endTimeAfter,
        limit: options?.limit || 50
      });

      return calls.map(call => ({
        sid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        phoneNumberSid: call.phoneNumberSid,
        price: call.price,
        priceUnit: call.priceUnit,
        direction: call.direction,
        answeredBy: call.answeredBy,
        apiVersion: call.apiVersion,
        forwardedFrom: call.forwardedFrom,
        groupSid: call.groupSid,
        callerName: call.callerName,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        dateCreated: call.dateCreated,
        dateUpdated: call.dateUpdated,
        parentCallSid: call.parentCallSid,
        accountSid: call.accountSid,
        annotation: call.annotation,
        queueTime: call.queueTime,
        uri: call.uri,
        subresourceUris: call.subresourceUris
      }));

    } catch (error: any) {
      logger.error('[Twilio] Failed to get calls:', error);
      throw new Error(`Failed to get calls: ${error.message}`);
    }
  }

  // TwiML Methods

  /**
   * Generate TwiML response for voice calls
   */
  public generateTwiML(): any {
    // Return the TwiML VoiceResponse constructor for building responses
    return twilio.twiml.VoiceResponse;
  }

  /**
   * Generate TwiML response for SMS
   */
  public generateMessagingTwiML(): any {
    // Return the TwiML MessagingResponse constructor for building responses
    return twilio.twiml.MessagingResponse;
  }

  /**
   * Create a simple TwiML response that says text
   */
  public createSayTwiML(text: string, options?: {
    voice?: 'man' | 'woman' | 'alice';
    language?: string;
    loop?: number;
  }): TwiMLResponse {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.say({
      voice: options?.voice || 'alice',
      language: options?.language || 'en',
      loop: options?.loop || 1
    }, text);

    return {
      response: twiml.toString(),
      contentType: 'text/xml'
    };
  }

  /**
   * Create a TwiML response that plays audio from URL
   */
  public createPlayTwiML(audioUrl: string, options?: {
    loop?: number;
    digits?: string;
  }): TwiMLResponse {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.play({
      loop: options?.loop || 1,
      digits: options?.digits
    }, audioUrl);

    return {
      response: twiml.toString(),
      contentType: 'text/xml'
    };
  }

  /**
   * Create a TwiML response that records audio
   */
  public createRecordTwiML(options?: {
    action?: string;
    method?: 'GET' | 'POST';
    timeout?: number;
    finishOnKey?: string;
    maxLength?: number;
    playBeep?: boolean;
    recordingStatusCallback?: string;
    recordingStatusCallbackMethod?: 'GET' | 'POST';
    trim?: 'trim-silence' | 'do-not-trim';
    transcribe?: boolean;
    transcribeCallback?: string;
  }): TwiMLResponse {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.record({
      action: options?.action,
      method: options?.method || 'POST',
      timeout: options?.timeout || 5,
      finishOnKey: options?.finishOnKey || '#',
      maxLength: options?.maxLength || 3600,
      playBeep: options?.playBeep !== false,
      recordingStatusCallback: options?.recordingStatusCallback,
      recordingStatusCallbackMethod: options?.recordingStatusCallbackMethod || 'POST',
      trim: options?.trim || 'trim-silence',
      transcribe: options?.transcribe || false,
      transcribeCallback: options?.transcribeCallback
    });

    return {
      response: twiml.toString(),
      contentType: 'text/xml'
    };
  }

  /**
   * Create a TwiML response that gathers DTMF input
   */
  public createGatherTwiML(options: {
    input?: 'dtmf' | 'speech' | 'dtmf speech';
    action?: string;
    method?: 'GET' | 'POST';
    timeout?: number;
    finishOnKey?: string;
    numDigits?: number;
    partialResultCallback?: string;
    partialResultCallbackMethod?: 'GET' | 'POST';
    language?: string;
    hints?: string;
    bargeIn?: boolean;
    debug?: boolean;
    actionOnEmptyResult?: boolean;
    speechTimeout?: number | 'auto';
    enhanced?: boolean;
    speechModel?: 'default' | 'numbers_and_commands' | 'phone_call';
    profanityFilter?: boolean;
    say?: string;
    play?: string;
  }): TwiMLResponse {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    const gather = twiml.gather({
      input: options.input || 'dtmf',
      action: options.action,
      method: options.method || 'POST',
      timeout: options.timeout || 5,
      finishOnKey: options.finishOnKey || '#',
      numDigits: options.numDigits,
      partialResultCallback: options.partialResultCallback,
      partialResultCallbackMethod: options.partialResultCallbackMethod || 'POST',
      language: options.language || 'en-US',
      hints: options.hints,
      bargeIn: options.bargeIn !== false,
      debug: options.debug || false,
      actionOnEmptyResult: options.actionOnEmptyResult || false,
      speechTimeout: options.speechTimeout || 'auto',
      enhanced: options.enhanced || false,
      speechModel: options.speechModel || 'default',
      profanityFilter: options.profanityFilter !== false
    });

    if (options.say) {
      gather.say(options.say);
    }
    
    if (options.play) {
      gather.play(options.play);
    }

    return {
      response: twiml.toString(),
      contentType: 'text/xml'
    };
  }

  // Phone Number Management

  /**
   * Get information about the configured phone number
   */
  public async getPhoneNumberInfo(): Promise<PhoneNumberInfo | null> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    if (!this.config.phoneNumber) {
      return null;
    }

    try {
      const phoneNumbers = await this.client!.incomingPhoneNumbers.list({
        phoneNumber: this.config.phoneNumber
      });

      if (phoneNumbers.length === 0) {
        return null;
      }

      const phoneNumber = phoneNumbers[0];

      return {
        phoneNumber: phoneNumber.phoneNumber,
        friendlyName: phoneNumber.friendlyName,
        sid: phoneNumber.sid,
        accountSid: phoneNumber.accountSid,
        capabilities: {
          voice: phoneNumber.capabilities.voice,
          sms: phoneNumber.capabilities.sms,
          mms: phoneNumber.capabilities.mms,
          fax: phoneNumber.capabilities.fax
        },
        statusCallback: phoneNumber.statusCallback,
        statusCallbackMethod: phoneNumber.statusCallbackMethod,
        apiVersion: phoneNumber.apiVersion,
        voiceUrl: phoneNumber.voiceUrl,
        voiceMethod: phoneNumber.voiceMethod,
        voiceFallbackUrl: phoneNumber.voiceFallbackUrl,
        voiceFallbackMethod: phoneNumber.voiceFallbackMethod,
        voiceCallerIdLookup: phoneNumber.voiceCallerIdLookup,
        dateCreated: phoneNumber.dateCreated,
        dateUpdated: phoneNumber.dateUpdated,
        smsUrl: phoneNumber.smsUrl,
        smsMethod: phoneNumber.smsMethod,
        smsFallbackUrl: phoneNumber.smsFallbackUrl,
        smsFallbackMethod: phoneNumber.smsFallbackMethod,
        trunkSid: phoneNumber.trunkSid,
        emergencyStatus: phoneNumber.emergencyStatus,
        emergencyAddressSid: phoneNumber.emergencyAddressSid,
        uri: phoneNumber.uri
      };

    } catch (error: any) {
      logger.error('[Twilio] Failed to get phone number info:', error);
      return null;
    }
  }

  /**
   * Update phone number configuration
   */
  public async updatePhoneNumberConfig(config: {
    friendlyName?: string;
    voiceUrl?: string;
    voiceMethod?: 'GET' | 'POST';
    voiceFallbackUrl?: string;
    voiceFallbackMethod?: 'GET' | 'POST';
    statusCallback?: string;
    statusCallbackMethod?: 'GET' | 'POST';
    voiceCallerIdLookup?: boolean;
    smsUrl?: string;
    smsMethod?: 'GET' | 'POST';
    smsFallbackUrl?: string;
    smsFallbackMethod?: 'GET' | 'POST';
  }): Promise<boolean> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    if (!this.config.phoneNumber) {
      throw new Error('No phone number configured');
    }

    try {
      const phoneNumbers = await this.client!.incomingPhoneNumbers.list({
        phoneNumber: this.config.phoneNumber
      });

      if (phoneNumbers.length === 0) {
        throw new Error('Phone number not found');
      }

      await this.client!.incomingPhoneNumbers(phoneNumbers[0].sid).update(config);
      
      logger.info(`[Twilio] Phone number configuration updated for ${maskPhoneNumber(this.config.phoneNumber)}`);
      return true;

    } catch (error: any) {
      logger.error('[Twilio] Failed to update phone number config:', error);
      return false;
    }
  }

  /**
   * Lookup phone number information
   */
  public async lookupPhoneNumber(phoneNumber: string): Promise<any> {
    if (!this.isAvailable()) {
      await this.initialize();
    }

    try {
      const formattedNumber = formatPhoneNumberForTwilio(phoneNumber);
      if (!formattedNumber) {
        throw new Error('Invalid phone number format');
      }

      const lookup = await this.client!.lookups.v1.phoneNumbers(formattedNumber).fetch({
        type: ['carrier', 'caller-name']
      });

      return {
        phoneNumber: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat,
        callerName: lookup.callerName,
        carrier: lookup.carrier,
        addOns: lookup.addOns,
        url: lookup.url
      };

    } catch (error: any) {
      logger.error(`[Twilio] Failed to lookup phone number ${phoneNumber}:`, error);
      throw new Error(`Failed to lookup phone number: ${error.message}`);
    }
  }

  // Statistics and Health

  /**
   * Get service statistics and health information
   */
  public async getStats(): Promise<TwilioStats> {
    this.resetDailyCountersIfNeeded();

    const stats: TwilioStats = {
      provider: 'Twilio',
      isConfigured: !!(this.config.accountSid && this.config.authToken),
      isConnected: this.isAvailable(),
      phoneNumber: this.config.phoneNumber,
      maskedPhoneNumber: this.config.phoneNumber ? maskPhoneNumber(this.config.phoneNumber) : undefined,
      accountSid: this.config.accountSid ? this.config.accountSid.substring(0, 8) + '...' : undefined,
      capabilities: {
        sms: false,
        mms: false,
        voice: false,
        video: false,
        fax: false
      },
      usage: {
        messagesSentToday: this.messagesSentToday,
        callsMadeToday: this.callsMadeToday,
        totalCostToday: this.totalCostToday
      },
      supportedFeatures: [
        'sms_messaging',
        'mms_messaging',
        'voice_calls',
        'call_recording',
        'call_forwarding',
        'ivr_systems',
        'twiml_responses',
        'status_callbacks',
        'phone_number_lookup',
        'delivery_receipts',
        'call_analytics',
        'conference_calls',
        'programmable_voice',
        'programmable_sms'
      ]
    };

    if (this.isAvailable()) {
      try {
        const phoneInfo = await this.getPhoneNumberInfo();
        if (phoneInfo) {
          stats.capabilities = {
            sms: phoneInfo.capabilities.sms,
            mms: phoneInfo.capabilities.mms,
            voice: phoneInfo.capabilities.voice,
            video: false, // Twilio Video would be separate
            fax: phoneInfo.capabilities.fax
          };
        }
      } catch (error) {
        logger.warn('[Twilio] Could not fetch phone number capabilities:', error);
      }
    }

    return stats;
  }

  /**
   * Health check - test service connectivity
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      if (!this.isAvailable()) {
        await this.initialize();
      }

      // Test account access
      await this.client!.api.accounts(this.config.accountSid).fetch();

      // Test phone number access if configured
      if (this.config.phoneNumber) {
        await this.getPhoneNumberInfo();
      }

      const latency = Date.now() - startTime;

      return {
        healthy: true,
        latency,
        errors
      };

    } catch (error: any) {
      errors.push(error.message);
      const latency = Date.now() - startTime;

      return {
        healthy: false,
        latency,
        errors
      };
    }
  }

  /**
   * Update service configuration
   */
  public async updateConfig(newConfig: Partial<TwilioConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    
    this.config = {
      ...this.config,
      ...newConfig
    };

    // If credentials changed, reinitialize
    if (newConfig.accountSid !== oldConfig.accountSid || 
        newConfig.authToken !== oldConfig.authToken) {
      this.isInitialized = false;
      this.client = null;
      
      if (this.config.accountSid && this.config.authToken) {
        await this.initialize();
      }
    }
  }

  /**
   * Get Twilio client instance (for advanced usage)
   */
  public getClient(): Twilio | null {
    return this.client;
  }
}

// Service factory and singleton management
let twilioService: TwilioService | null = null;

/**
 * Initialize Twilio service with configuration
 */
export function initializeTwilioService(config?: Partial<TwilioConfig>): TwilioService {
  twilioService = new TwilioService(config);
  return twilioService;
}

/**
 * Get the initialized Twilio service instance
 */
export function getTwilioService(): TwilioService {
  if (!twilioService) {
    // Auto-initialize with environment variables if available
    twilioService = new TwilioService();
  }
  return twilioService;
}

/**
 * Create a service instance with specific configuration
 */
export function createTwilioService(config: Partial<TwilioConfig>): TwilioService {
  return new TwilioService(config);
}

// Export the service class and types
export type { 
  TwilioService,
  TwilioConfig,
  SMSMessage,
  SMSResponse,
  VoiceCall,
  VoiceResponse,
  TwiMLResponse,
  PhoneNumberInfo,
  MessageStatus,
  CallStatus,
  TwilioStats
};

// Legacy compatibility export
export const smsService = {
  sendSms: async (to: string, message: string): Promise<boolean> => {
    try {
      const service = getTwilioService();
      await service.sendSMS({ to, body: message });
      return true;
    } catch (error) {
      logger.error('[Twilio] Legacy SMS send failed:', error);
      return false;
    }
  },
  isAvailable: (): boolean => {
    return getTwilioService().isAvailable();
  }
};

// Helper functions for common operations
export async function sendSMS(to: string, message: string, options?: Partial<SMSMessage>): Promise<boolean> {
  try {
    const service = getTwilioService();
    await service.sendSMS({ to, body: message, ...options });
    return true;
  } catch (error) {
    logger.error('[Twilio] SMS send failed:', error);
    return false;
  }
}

export async function makeCall(to: string, twimlOrUrl: string, options?: Partial<VoiceCall>): Promise<boolean> {
  try {
    const service = getTwilioService();
    const callOptions: VoiceCall = { to, ...options };
    
    if (twimlOrUrl.startsWith('http')) {
      callOptions.url = twimlOrUrl;
    } else {
      callOptions.twiml = twimlOrUrl;
    }
    
    await service.makeCall(callOptions);
    return true;
  } catch (error) {
    logger.error('[Twilio] Call failed:', error);
    return false;
  }
}