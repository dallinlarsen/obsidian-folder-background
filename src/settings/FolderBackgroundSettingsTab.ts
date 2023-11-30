import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";
import FolderBackgroundPlugin from "../FolderBackgroundPlugin";
import { FolderSuggest } from "./suggesters/FolderSuggester";
import { FileSuggest, FileSuggestMode } from "./suggesters/FileSuggester";

function arrayBufferToBase64(buffer: ArrayBuffer) {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

function getMimeType(filePath: string) {
	const extension = filePath.split(".").pop().toLowerCase();
	switch (extension) {
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		// Add other file types as needed
		default:
			return "";
	}
}

export default class FolderBackgroundSettingsTab extends PluginSettingTab {
	plugin: FolderBackgroundPlugin;

	constructor(app: App, plugin: FolderBackgroundPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Background Image")
			.setDesc("File Path to Background Image")
			.addText((text) => {
				new FileSuggest(
					text.inputEl,
					this.plugin,
					FileSuggestMode.BackgroundImages
				);
				text.setPlaceholder("File Path");
				text.inputEl.style.width = "100%";
				text.setValue(this.plugin.settings.backgroundImage).onChange(
					async (value) => {
						this.plugin.settings.backgroundImage = value;
						await this.plugin.saveSettings();
						console.log(value);
						const arrayBuffer = await this.app.vault.adapter.readBinary(
							value
						);
						console.log(arrayBuffer);
						const base64 = arrayBufferToBase64(arrayBuffer);
						const mimeType = getMimeType(value);
						console.log(base64);
						document.body.style.setProperty('--image-url', `url(data:${mimeType};base64,${base64})`);
					}
				);
			});

		new Setting(containerEl)
			.setName("Background Image Folder")
			.addSearch((search) => {
				new FolderSuggest(search.inputEl);
				search.setPlaceholder("Folder Name");
				search
					.setValue(this.plugin.settings.backgroundImageFolder)
					.onChange(async (value) => {
						this.plugin.settings.backgroundImageFolder = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
