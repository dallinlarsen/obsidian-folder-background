import { MarkdownView, Plugin } from "obsidian";
import FolderBackgroundSettingsTab from "./settings/FolderBackgroundSettingsTab";

interface FolderBackgroundSettings {
	backgroundImage: string;
    backgroundImageFolder: string;
}

const DEFAULT_SETTINGS: FolderBackgroundSettings = {
	backgroundImage: "",
    backgroundImageFolder: "",
};

export default class FolderBackgroundPlugin extends Plugin {
	settings: FolderBackgroundSettings;

	async onload() {
		console.log("onload initialized");
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				let activeView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					console.log(activeView.file?.path);
				}
			})
		);

		this.addSettingTab(new FolderBackgroundSettingsTab(this.app, this));
	}

	onunload() {
		console.log("onunload initialized");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
