import { isUndefined } from 'util';

import { ILanguage } from '../interface/ILanguage';
import { ILanguages } from '../interface/ILanguages';
import { UserInputService } from './UserInputService';

class LanguageService {
	public static LANGUAGES: ILanguages = {
		JAVA: {
			name: 'java',
			fullName: 'Java',
			fileExtension: 'java'
		},
		JAVASCRIPT: {
			name: 'js',
			fullName: 'JavaScript',
			fileExtension: 'js'
		},
		PYTHON3: {
			name: 'python3',
			fullName: 'Python3',
			fileExtension: 'py'
		},
		OCTAVE: {
			name: 'octave',
			fullName: 'Octave',
			fileExtension: 'm'
		}
	};
	public static async getLanguage(): Promise<ILanguage> {
		let languageName: string;
		if (process.argv.length > 2) {
			languageName = process.argv[2];
		} else {
			languageName = await UserInputService.get(UserInputService.INPUTS.LANGUAGE);
		}
		let language: ILanguage | undefined = LanguageService.findLanguageByName(languageName);
		if (isUndefined(language)) {
			language = {
				name: languageName,
				fullName: await UserInputService.get(UserInputService.INPUTS.LANGUAGE_FULL_NAME),
				fileExtension: await UserInputService.get(UserInputService.INPUTS.LANGUAGE_FILE_EXTENSION)
			};
		}
		return language;
	}
	private static findLanguageByName(name: string): ILanguage | undefined {
		for (const languageKey in this.LANGUAGES) {
			if (this.LANGUAGES[languageKey].name == name && this.LANGUAGES[languageKey].name != this.LANGUAGES.NOT_FOUND.name) {
				return this.LANGUAGES[languageKey];
			}
		}
		return undefined;
	}
}

export { LanguageService };