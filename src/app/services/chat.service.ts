import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { environment } from '../../environments/environment';
import * as moment from 'moment';

interface Member {
	_createdAt: firebase.firestore.Timestamp;
	_lastActionAt: firebase.firestore.Timestamp;
	userName: String;
}

interface Message {
	_createdAt: firebase.firestore.Timestamp;
	_createdBy: string;
	message: string;
	userName: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
	private _roomId: string = '';
	private _huyUserId: string = environment.huyUserId;
	private _huyUserName: string = environment.huyUserName;
	private unsubscribeMemberListener;
	private unsubscribeChatListener;
	private _initTime: Date;
	private _historyMessages: any[] = [];
	private _unreadMessages: any[] = [];

	public init(roomId: string) {
		this._roomId = roomId;
		this._initTime = new Date();
	}

	public getRoomId(): string {
		return this._roomId;
	}

	public async addUser(userId: string, userName: string): Promise<any> {
		const firestore = firebase.firestore();
		const roomId = this.getRoomId();

		return new Promise(async (resolve, reject) => {
			try {
				//Remove Huy if he is already in the room
				await firestore.collection('Chat').doc(roomId).collection('Members').doc(this._huyUserId).delete();

				await firestore.collection('Chat').doc(roomId).collection('Members').doc(userId).set({
					userName: userName,
					_createdAt: firebase.firestore.FieldValue.serverTimestamp(),
					_lastActionAt: firebase.firestore.FieldValue.serverTimestamp(),
				});

				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	public loadHistory(): Promise<any> {
		const firestore = firebase.firestore();
		const roomId = this.getRoomId();

		return new Promise(async (resolve, reject) => {
			try {
				let messages = await firestore
					.collection('Chat')
					.doc(roomId)
					.collection('Messages')
					.orderBy('_createdAt', 'asc')
					.get();

				let result = [];
				messages.forEach((message) => {
					result.push({
						...message.data(),
						id: message.id,
					});
				});

				resolve(result);
			} catch (error) {
				resolve([]); //On first time initialization, this will throw an error due to Firebase permissions
			}
		});
	}

	public postMessage(cli, message: string) {
		const firestore = firebase.firestore();
		const roomId = this.getRoomId();
		const userId = cli.getCurrentUserId();
		const userName = cli.getCurrentUserName();

		return firestore.collection('Chat').doc(roomId).collection('Messages').add({
			_createdBy: userId,
			_createdAt: firebase.firestore.FieldValue.serverTimestamp(),
			userName: userName,
			message: message,
		});
	}

	displayMessage(cli, messageId: string, data: Message) {
		let { message, _createdBy, _createdAt, userName } = data;
		const pen = cli.formatter;

		let time = _createdAt
			? moment(_createdAt.toDate()).format('MM/DD/YYYY HH:mm')
			: moment(new Date()).format('MM/DD/YYYY HH:mm'); //In case serverTimestamp hasn't picked up

		if (!_createdBy || (!_createdAt && _createdAt !== null) || !userName) return;

		if (_createdBy === this._huyUserId) {
			cli.echo(`[[;#FFF;;${messageId};${messageId}]\[${time}\\]] ${pen.green(userName)}: ${message}`);
		} else {
			cli.echo(`[[;#FFF;;${messageId};${messageId}]\[${time}\\]] ${pen.lightblue(userName)}: ${message}`);
		}
	}

	public removeUser(userId: string): Promise<any> {
		const firestore = firebase.firestore();
		const roomId = this.getRoomId();

		return firestore.collection('Chat').doc(roomId).collection('Members').doc(userId).delete();
	}

	public loadHistoryConfirm(cli): Promise<any> {
		const pen = cli.formatter;
		return new Promise((resolve, reject) => {
			cli.set_prompt(`Would you like to display previous messages (if any)? ${pen.green('(Y/N)')}`, false, false);
			cli.push((command) => {
				if (command.match(/^(y|yes)$/i)) {
					cli.pop(1);
					resolve(true);
				} else {
					cli.pop(1);
					resolve(false);
				}
			});
		});
	}

	public isRoomActive(roomId: string): Promise<boolean> {
		const firestore = firebase.firestore();
		return new Promise(async (resolve, reject) => {
			try {
				let snapshot = await firestore.collection('Chat').doc(roomId).collection('Members').get();

				let members = [];
				snapshot.forEach((member) => {
					//Exclude Huy
					if (member.id !== this._huyUserId) members.push(member);
				});

				resolve(members.length > 0);
			} catch (error) {
				reject(error);
			}
		});
	}

	private destroyListener(): void {
		if (this.unsubscribeMemberListener) this.unsubscribeMemberListener();
		if (this.unsubscribeChatListener) this.unsubscribeChatListener();
	}

	public setUpMemberListener(cli): Promise<any> {
		const firestore = firebase.firestore();
		const roomId = this.getRoomId();
		const currentUserId = cli.getCurrentUserId();
		const pen = cli.formatter;
		let firstLoad = true;
		let firstTimeEnterRoom = true;
		let firstAlert = true;

		return new Promise((resolve, reject) => {
			this.unsubscribeMemberListener = firestore
				.collection('Chat')
				.doc(roomId)
				.collection('Members')
				.onSnapshot(
					(snapshot) => {
						// if (firstLoad) {
						// 	firstLoad = false;
						// 	return;
						// }

						snapshot.docChanges().forEach((change) => {
							if (change.type === 'added') {
								let doc = change.doc;
								let user = doc.data() as Member;
								let userId = change.doc.id;

								if (userId === this._huyUserId) {
									cli.stopSpinner();

									//Load history messages
									this._historyMessages.forEach((message) => {
										this.displayMessage(cli, message.id, message);
									});

									//Only alert messages if the current user is not Huy
									if (this._huyUserId !== currentUserId) {
										if (firstAlert) {
											alert(`${this._huyUserName} has joined and ready to chat!`);
											cli.echo(
												pen.orange(
													`${
														this._huyUserName
													} has joined the chat. You can start chatting now.\nUse ${pen.green(
														'/exit'
													)} to exit the chat any time. Use ${pen.green(
														'/history'
													)} to load previous messages (if any).\n`
												)
											);
											firstAlert = false;
										} else {
											cli.echo(pen.orange(`${this._huyUserName} has joined the chat.\n`));
										}
									}

									cli.set_prompt('/chat');

									/*---------------------------------------------------------------*
									 * Allowing chat
									 *---------------------------------------------------------------*/
									cli.push(async (command) => {
										if (command === '/exit') {
											cli.echo(pen.orange(`You have ended the chat session.\n`));
											this.removeUser(currentUserId);
											this.destroyListener();
											cli.pop();
										} else if (command === '/history') {
											let messages = await this.loadHistory();

											cli.echo(pen.green(`----------- LOADING HISTORY -----------]\n`));
											messages.forEach((message) => {
												this.displayMessage(cli, message.id, message);
											});
										} else {
											if (!command) return;

											cli.removeLastLine();
											this.postMessage(cli, command);
										}
									});
								} else if (currentUserId === userId) {
									if (firstTimeEnterRoom) {
										firstTimeEnterRoom = false;
										return;
									}
									cli.echo(pen.orange(`You joined the chat.\n`));
								} else {
									cli.echo(pen.orange(`${user.userName} has joined the chat.\n`));
								}
							} else if (change.type === 'removed') {
								let user = change.doc.data() as Member;
								let userId = change.doc.id;
								if (userId === currentUserId) {
									cli.echo(pen.orange(`You left the chat.\n`));
								} else {
									cli.echo(pen.orange(`${user.userName} has left the chat.\n`));
								}
							}
						});
					},
					(error) => {
						reject(error.message);
					}
				);

			resolve();
		});
	}

	public setUpChatListener(cli, loadHistory: boolean = true): Promise<any> {
		const firestore = firebase.firestore();
		const roomId = this.getRoomId();
		const userId = cli.getCurrentUserId();
		let firstLoad = true;

		return new Promise(async (resolve, reject) => {
			if (loadHistory) {
				this._historyMessages = await this.loadHistory();
			}

			this.unsubscribeChatListener = firestore
				.collection('Chat')
				.doc(roomId)
				.collection('Messages')
				.onSnapshot(
					(snapshot) => {
						if (firstLoad) {
							firstLoad = false;
							return;
						}

						snapshot.docChanges().forEach((change) => {
							if (change.type === 'added') {
								let doc = change.doc;
								let chat = doc.data() as Message;

								this.displayMessage(cli, doc.id, chat);
							} else if (change.type === 'removed') {
							}
						});
					},
					(error) => {
						reject(error.message);
					}
				);

			resolve();
		});
	}
}
