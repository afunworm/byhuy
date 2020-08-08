import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CLIService } from '../services/cli.service';
import { CommandService } from '../services/command.service';
import { StorageService } from '../services/storage.service';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-visitor',
	templateUrl: './visitor.component.html',
	styleUrls: ['./visitor.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class VisitorComponent implements OnInit {
	constructor(
		private _cli: CLIService,
		private _storageService: StorageService,
		private _activatedRoute: ActivatedRoute
	) {}

	async getUserName(): Promise<void> {
		const pen = this._cli.formatter;

		return new Promise((resolve) => {
			//Remove current session, if any
			this._cli.endUserSession();

			this._cli.echo('What is your name?');
			this._cli.set_prompt('Your name:', false, false);

			this._cli.push((userName) => {
				if (userName) {
					this._cli.set_prompt(
						`You've entered ${pen.em(userName)}. Is it correct? ${pen.green('(Y/N)')}`,
						false,
						false
					);

					this._cli.push(async (command) => {
						if (command.match(/^(y|yes)$/i)) {
							try {
								this._cli.startSpinner();
								await this._cli.initUserSession(userName);

								this._cli.echo(
									`${pen.orange(
										`\nWelcome, ${userName}! It's nice to have you here.`
									)}\nYou can start by typing <${pen.green(
										'help'
									)}> for a list of available commands.\n`
								);
								this._cli.pop(2);
								this._cli.set_prompt();
								this._cli.stopSpinner();
								resolve();
							} catch (error) {
								this._cli.error(`Failed to initiate session. Your session will not be saved.`);
								this._cli.error(`${error}\n`);
								this._cli.pop(2);
								this._cli.set_prompt();
								this._cli.stopSpinner();
								resolve();
							}
						} else if (command.match(/^(n|no)$/i)) {
							this._cli.pop(1);
						}
					});
				}
			});
		});
	}

	ngOnInit() {
		//Init terminal
		this._cli.init('#terminal', this._cli.getDefaultInterpreter(), this._cli.getDefaultOptions());

		//Welcome user
		this._cli.echo(`Welcome to ${this._cli.formatter.link('byh.uy', 'https://byh.uy/')} - Everything by Huy.\n`);

		//Load userName from history
		let history = this._cli.history();
		let userName = this._storageService.read('name');
		let pen = this._cli.formatter;

		if (userName && typeof userName === 'string') {
			this._cli.echo('Oh hey, I remember seeing you here before!');
			this._cli.set_prompt(`You're ${userName}, right? ${pen.green('(Y/N)')}`, false, false);
			history.disable();

			this._cli.push(async (command) => {
				if (command.match(/^(y|yes)$/i)) {
					this._cli.startSpinner();

					try {
						await this._cli.initUserSession(userName);

						this._cli.echo(
							`${pen.orange(
								`\nWelcome back, ${userName}! It's nice to see you again.`
							)}\nAs usual, you can start by typing <${pen.green(
								'help'
							)}> for a list of available commands, or if you are familiar with it already, just navigate away!\n`
						);
						this._cli.pop();
						this._cli.set_prompt();
						history.enable();
						this._cli.stopSpinner();
					} catch (error) {
						this._cli.error(`Failed to initiate session. Your session will not be saved.`);
						this._cli.error(`${error}\n`);
						this._cli.pop();
						this._cli.set_prompt();
						history.enable();
						this._cli.stopSpinner();
					}
				} else if (command.match(/^(n|no)$/i)) {
					this._cli.pop();
					this.getUserName().then(() => {
						history.enable();
					});
				}
			});
		} else {
			this.getUserName().then(() => {
				history.enable();
			});
		}
	}
}
