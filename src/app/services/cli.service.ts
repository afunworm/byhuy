import { Injectable } from '@angular/core';
import 'jquery';
import 'jquery.terminal';
import { CommandService } from './command.service';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { StorageService } from './storage.service';
import { ChatService } from './chat.service';
import { AIService } from './ai.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CLIService {
	private _version = '1.1.5';
	private _spinner = {
		data: {
			line: { interval: 200, frames: ['-', '\\\\', '|', '/'] },
		},
		current: '',
		isAnimating: false,
		counter: 0,
		timer: null,
		prompt: null,
	};
	private _cliSelector: string = '';
	private _cli: JQueryTerminal;
	private _disableInput: boolean = false;
	private _currentUser = {
		name: '',
		uid: '',
	};
	private _isAdminMode: boolean = false;
	private _colors = {
		ORANGE: '#FFC107',
		BLUE: '#2196F3',
		LIGHTBLUE: '#00E5FF',
		GREEN: '#bfff00',
		RED: '#DD0031',
		WHITE: '#FFFFFF',
		BLACK: '#000',
		DEFAULT: '#aaa',
	};

	public get formatter() {
		let colors = this._colors;
		return {
			format(
				text: string = '',
				format: 'u' | 's' | 'o' | 'i' | 'b' | 'g' | '' = '',
				textColor: 'orange' | 'blue' | 'lightblue' | 'green' | 'red' | 'white' | 'black' | '' = '',
				backgroundColor: 'orange' | 'blue' | 'green' | 'red' | 'white' | 'black' | '' = ''
			) {
				return `[[${format};${colors[textColor.toUpperCase()]};${
					colors[backgroundColor.toUpperCase()]
				}]${text}]`;
			},
			link(
				linkText: string,
				linkUrl: string,
				color: 'orange' | 'blue' | 'lightblue' | 'green' | 'red' | 'white' | 'black' | '' = 'blue'
			) {
				let textColor = colors[color.toUpperCase()];
				return `[[!;${textColor};;;${linkUrl}]${linkText}]`;
			},
			em(text: string) {
				return this.format(text, '', 'white');
			},
			highlight(text: string) {
				return this.format(text, '', 'orange');
			},
			orange: (text: string) => {
				let color = this._colors.ORANGE;
				return `[[;${color};]${text}]`;
			},
			blue: (text: string) => {
				let color = this._colors.BLUE;
				return `[[;${color};]${text}]`;
			},
			lightblue: (text: string) => {
				let color = this._colors.LIGHTBLUE;
				return `[[;${color};]${text}]`;
			},
			green: (text: string) => {
				let color = this._colors.GREEN;
				return `[[;${color};]${text}]`;
			},
			red: (text: string) => {
				let color = this._colors.RED;
				return `[[;${color};]${text}]`;
			},
			white: (text: string) => {
				let color = this._colors.WHITE;
				return `[[;${color};]${text}]`;
			},
			black: (text: string) => {
				let color = this._colors.BLACK;
				return `[[;${color};]${text}]`;
			},
			info(
				icon: string = 'i',
				title: string = '',
				text: string = '',
				metaColor: 'orange' | 'blue' | 'lightblue' | 'green' | 'red' | 'white' | 'black' | '' = 'lightblue'
			) {
				if (icon === 'ok') icon = '&check;';
				let t = title ? this.format('&lsqb;' + icon + '&rsqb;  ' + title + ': ', '', metaColor) : '';
				return t + text;
			},
		};
	}

	constructor(
		private _commandService: CommandService,
		private _storageService: StorageService,
		private _chatService: ChatService,
		private _AIService: AIService
	) {}

	public get version(): string {
		return this._version;
	}

	private isMobile(): boolean {
		let check = false;
		(function (a) {
			if (
				/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
					a
				) ||
				/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
					a.substr(0, 4)
				)
			)
				check = true;
		})(navigator.userAgent || navigator.vendor);

		return check;
	}

	private getGreetingMessage(): string {
		let message = `
     ___           ___           ___           ___           ___           ___           ___           ___     
    /\\  \\         /\\__\\         /\\  \\         /\\  \\         /\\  \\         /\\  \\         /\\  \\         /\\  \\    
   /::\\  \\       /:/ _/_        \\:\\  \\        \\:\\  \\       _\\:\\  \\       /::\\  \\       /::\\  \\       |::\\  \\   
  /:/\\:\\  \\     /:/ /\\__\\        \\:\\  \\        \\:\\  \\     /\\ \\:\\  \\     /:/\\:\\  \\     /:/\\:\\__\\      |:|:\\  \\  
 /:/ /::\\  \\   /:/ /:/  /    ___  \\:\\  \\   _____\\:\\  \\   _\\:\\ \\:\\  \\   /:/  \\:\\  \\   /:/ /:/  /    __|:|\\:\\  \\ 
/:/_/:/\\:\\__\\ /:/_/:/  /    /\\  \\  \\:\\__\\ /::::::::\\__\\ /\\ \\:\\ \\:\\__\\ /:/__/ \\:\\__\\ /:/_/:/__/___ /::::|_\\:\\__\\
\\:\\/:/  \\/__/ \\:\\/:/  /     \\:\\  \\ /:/  / \\:\\~~\\~~\\/__/ \\:\\ \\:\\/:/  / \\:\\  \\ /:/  / \\:\\/:::::/  / \\:\\~~\\  \\/__/
 \\::/__/       \\::/__/       \\:\\  /:/  /   \\:\\  \\        \\:\\ \\::/  /   \\:\\  /:/  /   \\::/~~/~~~~   \\:\\  \\      
  \\:\\  \\        \\:\\  \\        \\:\\/:/  /     \\:\\  \\        \\:\\/:/  /     \\:\\/:/  /     \\:\\~~\\        \\:\\  \\     
   \\:\\__\\        \\:\\__\\        \\::/  /       \\:\\__\\        \\::/  /       \\::/  /       \\:\\__\\        \\:\\__\\    
    \\/__/         \\/__/         \\/__/         \\/__/         \\/__/         \\/__/         \\/__/         \\/__/  

Copyright &copy; 2015 - {{currentYear}} afunworm - v${this.version}
Made with love and ${this.formatter.link('Angular', 'https://angular.io/', 'red')}
  `.replace('{{currentYear}}', new Date().getFullYear().toString());
		return this.isMobile()
			? `Copyright &copy; ${new Date().getFullYear().toString()} afunworm - v${this.version}\r\n`
			: message;
	}

	public init(
		selector: string,
		interpreter: TypeOrArray<JQueryTerminal.Interpreter> = [],
		options: TerminalOptions = {}
	) {
		this._cliSelector = selector;
		this._cli = $(selector).terminal(interpreter, options);
		return this._cli;
	}

	public get isInputDisabled(): boolean {
		return this._disableInput;
	}

	public disableInput(): void {
		this._disableInput = true;
	}

	public enableInput(): void {
		this._disableInput = false;
	}

	public getCommandService() {
		return this._commandService;
	}

	public getStorageService() {
		return this._storageService;
	}

	public getChatService() {
		return this._chatService;
	}

	public getAIService() {
		return this._AIService;
	}

	public getInstance(): JQueryTerminal {
		return this._cli;
	}

	public setCurrentUserName(name: string): void {
		this._currentUser.name = name;
	}

	public getCurrentUserName(): string {
		return this._currentUser.name;
	}

	public setCurrentUserId(uid: string): void {
		this._currentUser.uid = uid;
	}

	public getCurrentUserId(): string {
		return this._currentUser.uid;
	}

	public enableAdminMode(): void {
		this._isAdminMode = true;
	}

	public disableAdminMode(): void {
		this._isAdminMode = false;
	}

	public isAdminMode(): boolean {
		return this._isAdminMode;
	}

	public set_mask(option: string | boolean) {
		return this._cli.set_mask(option);
	}

	public getDefaultOptions() {
		return {
			greetings: this.getGreetingMessage(),
			prompt: '> ',
			keydown: () => {
				if (this.isInputDisabled) return false;
			},
		};
	}

	public getDefaultInterpreter() {
		return [
			{
				test: function () {
					this.echo('Everything is working!');
				},
			},
			async (cmd) => {
				this.startSpinner();
				let noDelayCommands = ['reload', 'help'];

				//Scroll to bottom
				this.scroll_to_bottom();

				try {
					//Execute script
					let script = await this._commandService.execute(cmd, false || !noDelayCommands.includes(cmd));

					//Run the command
					new Function(script).call(this);

					//Do not stop spinner if command is reload
					if (cmd !== 'reload') this.stopSpinner();

					//Scroll one more time, why not?
					this.scroll_to_bottom();
				} catch (error) {
					this.error(`${error}\n`);
					this.stopSpinner();

					//Scroll one more time, why not?
					this.scroll_to_bottom();
				}
			},
		];
	}

	public startSpinner(cli?: JQueryTerminal, spinner = 'line') {
		if (this._spinner.current) return;

		let terminal = this._cli;

		let set = () => {
			this._spinner.counter++;

			var text = this._spinner.data[spinner].frames[
				this._spinner.counter % this._spinner.data[spinner].frames.length
			];

			terminal.set_prompt(text);
		};

		this._spinner.prompt = terminal.get_prompt();
		terminal.find('.cmd-cursor').hide();
		set();
		this.scroll_to_bottom();
		this._spinner.timer = setInterval(set, this._spinner.data[spinner].interval);

		this.disableInput();
		this._spinner.isAnimating = true;
		this._spinner.current = spinner;
	}

	public stopSpinner(cli?: JQueryTerminal) {
		if (!this._spinner.current) return;

		let terminal = cli ? cli : this._cli;

		clearInterval(this._spinner.timer);
		let frame = this._spinner.data[this._spinner.current].frames[
			this._spinner.counter % this._spinner.data[this._spinner.current].frames.length
		];
		terminal.set_prompt(this._spinner.prompt).echo(frame);
		terminal.find('.cmd-cursor').show();
		terminal.find('.terminal-output').children().last().hide();

		this._spinner.isAnimating = false;
		this.enableInput();
		this._spinner.current = '';
	}

	public echo(message: string) {
		return this._cli.echo(message);
	}

	public error(message: string) {
		return this.echo(this.formatter.red(message));
	}

	public push(fn: TypeOrArray<JQueryTerminal.Interpreter>) {
		return this._cli.push(fn);
	}

	public get level() {
		return this._cli.level();
	}

	public get index() {
		return this.level - 1;
	}

	public pop(fullIndexOrTimes: number | boolean = true) {
		let times = 0;
		if (fullIndexOrTimes === true) {
			//we'll pop everything
			times = this.index;
		} else {
			times = Number(fullIndexOrTimes);
		}

		for (let i = 0; i < times; i++) {
			this._cli.pop();
		}
		return this._cli;
	}

	public set_prompt(
		prompt: JQueryTerminal.ExtendedPrompt = '',
		includeUserName: boolean = true,
		includeCarat: boolean = true
	) {
		//Wrap in setTimeout as a hack for loading remote js files
		setTimeout(() => {
			let userName = this.getCurrentUserName();
			let promptString = userName && typeof userName === 'string' && includeUserName ? userName + prompt : prompt;
			promptString = includeCarat ? promptString + '> ' : promptString + ' ';
			this._cli.set_prompt(promptString);
		}, 0);
		return this._cli;
	}

	public history() {
		return this._cli.history();
	}

	public initUserSession(
		userName: string,
		connectToAuth: boolean = false,
		email: string = '',
		password: string = ''
	): Promise<any> {
		const auth = firebase.auth();
		return new Promise(async (resolve, reject) => {
			if (!connectToAuth) {
				this._storageService.create('name', userName);
				this.setCurrentUserName(userName);
				resolve(null);
			}

			//Sign out the current user
			if (this.isAdminMode()) {
				await auth.signOut().catch((error) => {
					reject(error);
				});
			}

			if (email) {
				//Sign in with email & password
				auth.signInWithEmailAndPassword(email, password).catch((error) => {
					reject(error);
				});
			} else {
				//Sign in anonymously
				auth.signInAnonymously().catch((error) => {
					reject(error);
				});
			}

			firebase.auth().onAuthStateChanged((user) => {
				if (user) {
					if (email) {
						this._storageService.create('email', email);
					}
					this._storageService.create('name', userName);
					this._storageService.create('uid', user.uid);
					this.setCurrentUserName(userName);
					this.setCurrentUserId(user.uid);
					resolve(user);
				}
			});
		});
	}

	public endUserSession(): void {
		this._storageService.delete('name');
		this._storageService.delete('uid');
		this.setCurrentUserName('');
		this.setCurrentUserId('');
	}

	public notifyIncomingChatRequest(): Promise<any> {
		const endPoint = environment.notificationEndPoint;
		const userId = this.getCurrentUserId();
		const userName = this.getCurrentUserName();

		//Use jQuery to make it quick since we already imported it
		return new Promise((resolve, reject) => {
			$.post(endPoint, { userId: userId, userName: userName })
				.done(() => {
					resolve();
				})
				.fail((xhr, status, error) => {
					reject('Cannot notify Huy of upcoming chat request.');
				});
		});
	}

	public removeLastLine(): void {
		this._cli.remove_line(-1);
	}

	public scroll_to_bottom(): JQueryTerminal {
		setTimeout(() => {
			$(this._cliSelector).scrollTop($(`${this._cliSelector} .cmd-end-line`).position().top);
		}, 100);
		return this._cli; //.scroll_to_bottom();
	}

	public scrollToBottom(): JQueryTerminal {
		setTimeout(() => {
			$(this._cliSelector).scrollTop($(`${this._cliSelector} .cmd-end-line`).position().top);
		}, 100);
		return this._cli;
	}

	public untilTerminalReady(fn: Function) {
		return setTimeout(fn, 0);
	}
}
