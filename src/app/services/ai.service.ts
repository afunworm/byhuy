import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as moment from 'moment';
import * as $ from 'jquery';

export interface Text {
	text: string[];
}

export interface FulfillmentMessage {
	platform: string;
	text: Text;
	message: string;
}

export interface Field {}

export interface Parameter {
	fields: Field;
}

export interface Intent {
	inputContextNames: any[];
	events: any[];
	trainingPhrases: any[];
	outputContexts: any[];
	parameters: any[];
	messages: any[];
	defaultResponsePlatforms: any[];
	followupIntentInfo: any[];
	name: string;
	displayName: string;
	priority: number;
	isFallback: boolean;
	webhookState: string;
	action: string;
	resetContexts: boolean;
	rootFollowupIntentName: string;
	parentFollowupIntentName: string;
	mlDisabled: boolean;
}

export interface QueryResult {
	fulfillmentMessages: FulfillmentMessage[];
	outputContexts: any[];
	queryText: string;
	speechRecognitionConfidence: number;
	action: string;
	parameters: Parameter;
	allRequiredParamsPresent: boolean;
	fulfillmentText: string;
	webhookSource: string;
	webhookPayload?: any;
	intent: Intent;
	intentDetectionConfidence: number;
	diagnosticInfo?: any;
	languageCode: string;
	sentimentAnalysisResult?: any;
}

export interface OutputAudio {
	type: string;
	data: any[];
}

export interface Data {
	responseId: string;
	queryResult: QueryResult;
	webhookStatus?: any;
	outputAudio: OutputAudio;
	outputAudioConfig?: any;
}

export interface AIPayload {
	data: Data;
}

export interface AIResponse {
	responseId: string;
	responseText: string;
	queryText: string;
	action: string;
	intent: string;
	intentDetectionConfidence: number;
	allRequiredParamsPresent: boolean;
}

@Injectable({ providedIn: 'root' })
export class AIService {
	private _APIEndPoint: string = environment.AIEndPoint;
	private _sessionId: string = '';
	private _AIName: string = environment.AIName;
	private _userName: string = '';
	private _userId: string = '';
	private _CLI;

	init(cli, sessionId: string) {
		if (!sessionId) {
			throw new Error('Session Id is required to call AI');
		}

		this._sessionId = sessionId;
		this._CLI = cli;
	}

	startChat() {
		const cli = this._CLI;
		const pen = cli.formatter;
		cli.set_prompt('/chat');

		/*---------------------------------------------------------------*
		 * Allowing chat
		 *---------------------------------------------------------------*/
		cli.push(async (command) => {
			if (command === '/exit') {
				cli.echo(pen.orange(`You have ended the chat session with ${this._AIName}.\n`));
				cli.pop();
				cli.set_prompt();
			} else {
				if (!command) return;

				cli.removeLastLine();
				this.sendUserMessage(command);
			}
		});
	}

	addUser(userId: string, userName: string) {
		this._userId = userId;
		this._userName = userName;
	}

	displayMessage(message: string, userName: string, isAIMessage: boolean = true) {
		const cli = this._CLI;
		const pen = cli.formatter;

		let time = moment(new Date()).format('MM/DD/YYYY HH:mm');

		if (isAIMessage) {
			cli.echo(`${pen.white('[' + time + '\\]')} ${pen.green('(AI)' + this._AIName)}: ${message}`);
		} else {
			cli.echo(`${pen.white('[' + time + '\\]')} ${pen.lightblue(userName)}: ${message}`);
		}

		cli.scrollToChatBottom();
	}

	async sendUserMessage(message: string) {
		const cli = this._CLI;
		try {
			this.displayMessage(message, this._userName, false);
			cli.untilTerminalReady(async () => {
				cli.startSpinner();
				let response = await this.send(message);
				await this.processAIResponse(response);
				cli.stopSpinner();
			});
		} catch (error) {
			cli.error(error);
			return Promise.reject(error);
		}
	}

	processAIResponse(response: AIResponse) {
		let {
			action,
			allRequiredParamsPresent,
			intent,
			intentDetectionConfidence,
			queryText,
			responseId,
			responseText,
		} = response;
		this.displayMessage(responseText, '', true);
	}

	private async send(message: string): Promise<AIResponse | null> {
		return new Promise((resolve, reject) => {
			if (!this._sessionId) {
				reject('Session Id is required to call AI');
			}

			if (!message) {
				reject('Message cannot be empty');
			}

			$.ajax({
				url: this._APIEndPoint,
				method: 'POST',
				dataType: 'json',
				processData: false,
				contentType: 'application/json',
				data: JSON.stringify({
					sessionId: this._sessionId,
					message: message,
				}),
			})
				.then((response: AIPayload) => {
					let data: AIResponse = {
						responseId: response.data.responseId,
						responseText: response.data.queryResult.fulfillmentText,
						queryText: response.data.queryResult.queryText,
						action: response.data.queryResult.intent.action,
						intent: response.data.queryResult.intent.displayName,
						intentDetectionConfidence: response.data.queryResult.intentDetectionConfidence,
						allRequiredParamsPresent: response.data.queryResult.allRequiredParamsPresent,
					};
					resolve(data);
				})
				.catch((xhr, status, error) => {
					reject('Unable to communicate with AI');
				});
		});
	}
}
