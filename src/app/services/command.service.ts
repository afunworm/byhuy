import { Injectable } from '@angular/core';
import * as $ from 'jquery';

@Injectable({ providedIn: 'root' })
export class CommandService {
	random(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	public fileExists(path) {
		return new Promise((resolve, reject) => {
			$.ajax({
				url: path,
				method: 'HEAD',
			})
				.then(() => {
					resolve(true);
				})
				.catch(() => {
					resolve(false);
				});
		});
	}

	public async execute(command: string, withRandomDelay: boolean = true): Promise<any> {
		let hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		let path = `/app/commands/${command}.js?cache=${hash}`;
		let delay = withRandomDelay ? this.random(200, 1000) : 0;

		return new Promise(async (resolve, reject) => {
			setTimeout(async () => {
				//Check if command exists
				let commandExists = await this.fileExists(path);

				//Throw error if not exists
				if (!commandExists) {
					return reject(`Unknown command ${command}`);
				}

				//Run command if exists
				$.ajax({
					url: path,
					method: 'GET',
					dataType: 'text',
				})
					.then((result) => {
						resolve(result);
					})
					.catch(() => {
						reject(`Script error for command ${command}`);
					});
			}, delay);
		});
	}
}
