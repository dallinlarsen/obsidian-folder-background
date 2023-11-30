// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { Notice, TAbstractFile, TFile, TFolder, Vault, normalizePath } from "obsidian";
import { TextInputSuggest } from "./suggest";
import FolderBackgroundPlugin from "main";

export enum FileSuggestMode {
	BackgroundImages
}

export function resolve_tfolder(folder_str: string): TFolder {
	folder_str = normalizePath(folder_str);

	const folder = app.vault.getAbstractFileByPath(folder_str);
	if (!folder) {
		throw new TemplaterError(`Folder "${folder_str}" doesn't exist`);
	}
	if (!(folder instanceof TFolder)) {
		throw new TemplaterError(`${folder_str} is a file, not a folder`);
	}

	return folder;
}

export function get_tfiles_from_folder(folder_str: string): Array<TFile> {
	const folder = resolve_tfolder(folder_str);

	const files: Array<TFile> = [];
	Vault.recurseChildren(folder, (file: TAbstractFile) => {
		if (file instanceof TFile) {
			files.push(file);
		}
	});

	files.sort((a, b) => {
		return a.basename.localeCompare(b.basename);
	});

	return files;
}

export class TemplaterError extends Error {
	constructor(msg: string, public console_msg?: string) {
		super(msg);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export function log_error(e: Error | TemplaterError): void {
	const notice = new Notice("", 8000);
	if (e instanceof TemplaterError && e.console_msg) {
		// TODO: Find a better way for this
		// @ts-ignore
		notice.noticeEl.innerHTML = `<b>Folder Background Error</b>:<br/>${e.message}<br/>Check console for more information`;
		console.error(`Folder Background Error:`, e.message, "\n", e.console_msg);
	} else {
		// @ts-ignore
		notice.noticeEl.innerHTML = `<b>Folder Background Error</b>:<br/>${e.message}`;
	}
}

export function errorWrapperSync<T>(fn: () => T, msg: string): T {
	try {
		return fn();
	} catch (e) {
		log_error(new TemplaterError(msg, e.message));
		return null as T;
	}
}

export class FileSuggest extends TextInputSuggest<TFile> {
	constructor(
		public inputEl: HTMLInputElement,
		private plugin: FolderBackgroundPlugin,
		private mode: FileSuggestMode
	) {
		super(inputEl);
	}

	get_folder(mode: FileSuggestMode): string {
		switch (mode) {
			case FileSuggestMode.BackgroundImages:
                return this.plugin.settings.backgroundImageFolder;
		}
	}

	get_error_msg(mode: FileSuggestMode): string {
		switch (mode) {
			case FileSuggestMode.BackgroundImages:
				return `Background Image folder doesn't exist`;
		}
	}

	getSuggestions(input_str: string): TFile[] {
		const all_files = errorWrapperSync(
			() => get_tfiles_from_folder(this.get_folder(this.mode)),
			this.get_error_msg(this.mode)
		);
		if (!all_files) {
			return [];
		}

		const files: TFile[] = [];
		const lower_input_str = input_str.toLowerCase();

		all_files.forEach((file: TAbstractFile) => {
			if (
				file instanceof TFile &&
				(file.extension === "jpg" || file.extension === "png") &&
				file.path.toLowerCase().contains(lower_input_str)
			) {
				files.push(file);
			}
		});

		return files;
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.inputEl.value = file.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
