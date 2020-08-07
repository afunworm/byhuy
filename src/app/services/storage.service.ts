import { Injectable } from '@angular/core';
import * as Cookies from 'js-cookie';

@Injectable({ providedIn: 'root' })
export class StorageService {
	private storageAvailable(type) {
		var storage;
		try {
			storage = window[type];
			var x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch (e) {
			return (
				e instanceof DOMException &&
				// everything except Firefox
				(e.code === 22 ||
					// Firefox
					e.code === 1014 ||
					// test name field too, because code might not be present
					// everything except Firefox
					e.name === 'QuotaExceededError' ||
					// Firefox
					e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
				// acknowledge QuotaExceededError only if there's something already stored
				storage &&
				storage.length !== 0
			);
		}
	}

	private createCookies(key: string, data: {}): void {
		let dataString: any = '';
		try {
			dataString = JSON.stringify(data);
		} catch (error) {
			throw new Error(error);
		}
		Cookies.set(key, dataString, { expires: 365 });
	}

	private createLocalStorage(key: string, data: {}): void {
		let dataString: any = '';
		try {
			dataString = JSON.stringify(data);
		} catch (error) {
			throw new Error(error);
		}
		localStorage.setItem(key, dataString);
	}

	private readCookies(key: string): any {
		return JSON.parse(Cookies.get(key));
	}

	private readLocalStorage(key: string): any {
		return JSON.parse(localStorage.getItem(key));
	}

	private deleteCookies(key?: string) {
		if (key === undefined) {
			//Delete all cookies
			Object.keys(Cookies.get()).forEach((cookieName) => {
				Cookies.remove(cookieName);
			});
		} else {
			//Delete a single cookie
			Cookies.remove(key);
		}
	}

	private deleteLocalStorae(key?: string): any {
		if (key === undefined) {
			//Delete all items
			localStorage.clear();
		} else {
			//Delete a single item
			localStorage.removeItem(key);
		}
	}

	public create(key: string, data: {}): void {
		if (!key) return;

		if (this.storageAvailable('localStorage')) {
			//Store data in local storage
			this.createLocalStorage(key, data);
		} else {
			//Store data in cookies
			this.createCookies(key, data);
		}
	}

	public read(key: string): any {
		if (!key) return;

		if (this.storageAvailable('localStorage')) {
			//Read data in local storage
			return this.readLocalStorage(key);
		} else {
			//Read data in cookies
			return this.readCookies(key);
		}
	}

	public delete(key: string): void {
		if (!key) return;

		if (this.storageAvailable('localStorage')) {
			//Remove data in local storage
			this.deleteLocalStorae(key);
		} else {
			//Remove data in cookies
			this.deleteCookies(key);
		}
	}
}
