import { Component, OnInit } from '@angular/core';
import { CLIService } from '../services/cli.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ChatService } from '../services/chat.service';
import { StorageService } from '../services/storage.service';

@Component({
	selector: 'app-admin',
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
	constructor(
		private _cli: CLIService,
		private _activatedRoute: ActivatedRoute,
		private _router: Router,
		private _chatService: ChatService,
		private _storageService: StorageService
	) {}

	adminLogin(reuse: string | boolean): Promise<any> {
		let history = this._cli.history();
		history.disable();

		if (reuse !== false) {
			//There is an email, we can reuse it
			return new Promise((resolve, reject) => {
				this._cli.set_prompt(`Password:`, false, false);
				this._cli.set_mask('');

				this._cli.push(async (password) => {
					let huyUserName = environment.huyUserName;

					try {
						await this._cli.initUserSession(huyUserName, true, reuse as string, password);
						this._cli.pop();
						this._cli.set_mask(false);
						resolve();
					} catch (error) {
						this._cli.pop();
						this._cli.set_mask(false);
						reject(error);
					}
				});
			});
		} else {
			return new Promise((resolve, reject) => {
				this._cli.set_prompt(`Email:`, false, false);

				this._cli.push((email) => {
					this._cli.set_prompt(`Password:`, false, false);
					this._cli.set_mask('');

					this._cli.push(async (password) => {
						let huyUserName = environment.huyUserName;

						try {
							await this._cli.initUserSession(huyUserName, true, email, password);
							this._cli.pop();
							this._cli.set_mask(false);
							resolve();
						} catch (error) {
							this._cli.pop();
							this._cli.set_mask(false);
							reject(error);
						}
					});
				});
			});
		}
	}

	useExistingSession(): Promise<boolean | string> {
		let email = this._storageService.read('email');

		return new Promise((resolve, reject) => {
			if (email) {
				this._cli.set_prompt(
					`It looks like an admin has logged in. Would you like to continue as [[;#FEC006;]${email}]? [[;#bfff00;](Y/N)]`,
					false,
					false
				);
				this._cli.push(async (command) => {
					if (command.match(/^(y|yes)$/i)) {
						resolve(email);
					} else if (command.match(/^(n|no)$/i)) {
						resolve(false);
					}
				});
			} else {
				resolve(false);
			}
		});
	}

	async ngOnInit() {
		//Get roomId
		let roomId = this._activatedRoute.snapshot.params.id;

		//Init terminal
		this._cli.init('#terminal', this._cli.getDefaultInterpreter(), this._cli.getDefaultOptions());

		//Get formatter
		const pen = this._cli.formatter;

		//Turn on admin mode
		this._cli.enableAdminMode();

		//If a session exists, we can re-use the email info
		let reuseInfo = await this.useExistingSession();

		//Welcome user
		if (!reuseInfo) {
			this._cli.echo('Admin mode is enabled. Please log in.');
		}

		//Log in as admin
		try {
			await this.adminLogin(reuseInfo);
		} catch (error) {
			this._cli.error(error);
			this._cli.set_prompt(`\nWould you like to retry? ${pen.green('(Y/N)')}`, false, false);

			this._cli.push(async (command) => {
				if (command.match(/^(y|yes)$/i)) {
					//Reload current route
					this._cli.removeLastLine(); //Last line got duplicated
					location.reload();
				} else if (command.match(/^(n|no)$/i)) {
					this._cli.error('\nNo admin access granted. You will be redirected to the home page...');
					this._cli.startSpinner();
					setTimeout(() => {
						this._router.navigate(['../../'], { relativeTo: this._activatedRoute });
					}, 5000);
				}
			});

			return;
		}

		let userId = this._cli.getCurrentUserId();
		let userName = this._cli.getCurrentUserName();

		//Greetings
		this._cli.echo(pen.orange(`\nWelcome, ${userName}! Please wait while your chat is being initialized...`));

		//If roomId is set, start setting up chat
		if (!roomId) return;

		//Check if there is member waiting in room
		if (await this._chatService.isRoomActive(roomId)) {
			//Init room
			this._cli.echo(`\nInitiating session ${pen.em(roomId)}...`);
			this._chatService.init(this._cli, roomId);

			//Add Huy to the room
			this._cli.echo(''); //Line break
			this._cli.echo(pen.info('i', 'chat', `Executing ${pen.em('user session')} script.`, 'lightblue'));
			this._chatService.addUser(userId, userName);

			//Set up listeners
			this._cli.echo(pen.info('i', 'chat', `Setting up ${pen.em('member listener')} service.`, 'green'));
			await this._chatService.setUpMemberListener();
			this._cli.echo(pen.info('i', 'chat', `Setting up ${pen.em('chat listener')} service.`, 'lightblue'));
			await this._chatService.setUpChatListener(false);

			this._cli.echo(pen.info('ok', 'chat', `Chat session initialized.`, 'lightblue'));
			this._cli.echo(pen.em(`\nInitialization completed.\n`));
		} else {
			this._cli.echo(`There is no active chat room for the session ${pen.em(roomId)}.\n`);
		}
	}
}
