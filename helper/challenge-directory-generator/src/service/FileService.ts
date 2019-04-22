import { Challenge } from '../entity/Challenge';
import { sprintf } from 'sprintf-js';
import { ErrorService } from './ErrorService';
import { UserInputService } from './UserInputService';
import { Logger } from '../util/Logger';
import { IMainArgumentsMap } from '../interface/IMainArgumentsMap';
import * as rimraf from 'rimraf';
import * as fs from 'fs';
import { IStringFormatArgumentsMap } from '../interface/IStringFormatArgumentsMap';
import { IStringFormatArgument } from '../interface/IStringFormatArgument';
import { TestCaseArgument } from '../entity/TestCaseArgument';
import { MarkdownLink } from '../entity/MarkdownLink';

abstract class FileService {
	protected REPOSITORY_ROOT_PATH: string = '../../';
	protected CHALLENGES_DIR_PATH: string = sprintf('%schallenges/', this.REPOSITORY_ROOT_PATH);
	protected TEMPLATES_DIR_PATH: string = './template/';
	protected REPOSITORY_README_TEXT_TO_SEARCH: string = '| --------- | :------: |';
	protected GITHUB_CHALLENGE_LINK_TEMPLATE: string = 'https://github.com/jimmynguyen/codesignal-challenges/tree/master/challenges/%s/%s';
	protected challenge: Challenge;
	protected challengeDirPath: string;
	protected challengeSolutionDirPath: string;
	public constructor(challenge: Challenge) {
		this.challenge = challenge;
		this.challengeDirPath = sprintf('%s%s/', this.CHALLENGES_DIR_PATH, challenge.getName());
		this.challengeSolutionDirPath = sprintf('%s%s/', this.challengeDirPath, challenge.getLanguage());
	}
	public async updateREADMEFile(): Promise<void> {
		const readmeFilePath: string = sprintf('%sREADME.md', this.REPOSITORY_ROOT_PATH);
		let readmeFile: string = fs.readFileSync(readmeFilePath, 'utf8');
		if (readmeFile.indexOf(this.REPOSITORY_README_TEXT_TO_SEARCH) < 0) {
			Logger.warn(ErrorService.ERRORS.FAILED_TO_UPDATE_README);
			return;
		}
		if (readmeFile.indexOf(sprintf('[%s]', this.challenge.getName())) < 0) {
			fs.writeFileSync(readmeFilePath, readmeFile.split(this.REPOSITORY_README_TEXT_TO_SEARCH).join(sprintf('%s\n| [%s](%s) | [%s](%s) |', this.REPOSITORY_README_TEXT_TO_SEARCH, this.challenge.getName(), this.challenge.getLink(), this.challenge.getLanguage().toPascalCase(), this.getGithubChallengeLink())));
		} else {
			this.insertLanguageSolutionLinkIntoREADME(readmeFile, readmeFilePath);
		}
	}
	private insertLanguageSolutionLinkIntoREADME(readmeFile: string, readmeFilePath: string): void {
		const challengeNameIndex: number = readmeFile.indexOf(sprintf('[%s]', this.challenge.getName()));
		const solutionStartIndex: number = readmeFile.indexOf(') | [', challengeNameIndex);
		const solutionEndIndex: number = readmeFile.indexOf(') |', solutionStartIndex + 1);
		const markdownLinks: MarkdownLink[] = this.getMarkdownLinks(readmeFile.substring(solutionStartIndex + 4, solutionEndIndex + 1));
		if (markdownLinks.filter(markdownLink => markdownLink.getText() == this.challenge.getLanguage().toPascalCase()).length == 0) {
			markdownLinks.push(new MarkdownLink(this.challenge.getLanguage().toPascalCase(), this.getGithubChallengeLink()));
			markdownLinks.sort((a, b) => a.getText().localeCompare(b.getText()));
			fs.writeFileSync(readmeFilePath, sprintf('%s%s%s', readmeFile.substring(0, solutionStartIndex + 4), markdownLinks.map(markdownLink => markdownLink.toString()).join(', '), readmeFile.substring(solutionEndIndex + 1)));
		}
	}
	private getMarkdownLinks(challengeSolutions: string): MarkdownLink[] {
		const challengeSolutionLinks: string[] = challengeSolutions.split('), [');
		let challengeSolutionLinkSplit: string[];
		let markdownLinks: MarkdownLink[] = [];
		for (const challengeSolutionLink of challengeSolutionLinks) {
			challengeSolutionLinkSplit = challengeSolutionLink.split('](');
			markdownLinks.push(new MarkdownLink(challengeSolutionLinkSplit[0].substring(1), challengeSolutionLinkSplit[1].substring(0, challengeSolutionLinkSplit[1].length-1)));
		}
		return markdownLinks;
	}
	private getGithubChallengeLink(): string {
		return sprintf(this.GITHUB_CHALLENGE_LINK_TEMPLATE, this.challenge.getName(), this.challenge.getLanguage());
	}
	public async generateChallengeDirectory(): Promise<void> {
		if (!fs.existsSync(this.challengeDirPath)) {
			fs.mkdirSync(this.challengeDirPath);
		}
		this.createChallengeREADMEFile();
		if (fs.existsSync(this.challengeSolutionDirPath)) {
			const deleteChallengeSolutionDir: boolean = await UserInputService.confirm(UserInputService.INPUTS.DELETE_EXISTING_CHALLENGE_SOLUTION_DIR);
			if (!deleteChallengeSolutionDir) {
				return;
			}
			rimraf.sync(this.challengeSolutionDirPath);
		}
		fs.mkdirSync(this.challengeSolutionDirPath);
		this.createChallengeTestBashFile();
		this.createChallengeSolutionFiles();
	}
	private createChallengeREADMEFile(): void {
		const readmeFilePath = sprintf('%sREADME.md', this.challengeDirPath);
		fs.writeFileSync(readmeFilePath, sprintf('# %s\n\nLink to Challenge: [%s](%s)', this.challenge.getName(), this.challenge.getLink(), this.challenge.getLink()));
	}
	protected createChallengeTestBashFile(): void {
		const testBashFile: string = this.getChallengeTestBashFile();
		const testBashFilePath = sprintf('%stest.sh', this.challengeSolutionDirPath);
		fs.writeFileSync(testBashFilePath, testBashFile);
	}
	protected createMainSolutionFile(mainTemplateFileName: string, mainFileName: string): void {
		const mainTemplateFilePath: string = sprintf('%s%s', this.templatesDirPath, mainTemplateFileName);
		let mainFile: string = fs.readFileSync(mainTemplateFilePath, 'utf8');
		const argumentsMap: IMainArgumentsMap = this.getMainArgumentsMap();
		mainFile = this.replaceArguments(mainFile, argumentsMap);
		const mainFilePath: string = sprintf('%s%s', this.challengeSolutionDirPath, mainFileName);
		fs.writeFileSync(mainFilePath, mainFile);
	}
	protected replaceArguments(file: string, argumentsMap: IMainArgumentsMap): string {
		for (const argument in argumentsMap) {
			file = file.split(sprintf('[%s]', argument)).join(argumentsMap[argument]);
		}
		return file;
	}
	protected getStringFormat(type: string): string {
		const stringFormatArgumentsMap: IStringFormatArgumentsMap = this.getStringFormatArgumentsMap();
		for (const key in stringFormatArgumentsMap) {
			const stringFormatArgument: IStringFormatArgument = stringFormatArgumentsMap[key];
			if (stringFormatArgument.type == type) {
				return stringFormatArgument.format;
			}
		}
		return stringFormatArgumentsMap.DEFAULT.format;
	}
	protected abstract templatesDirPath: string;
	protected abstract getChallengeTestBashFile(): string;
	protected abstract createChallengeSolutionFiles(): void;
	protected abstract getMainArgumentsMap(): IMainArgumentsMap;
	protected abstract getStringFormatArgumentsMap(): IStringFormatArgumentsMap;
	protected abstract getTestCaseArgumentValue(testCaseArgument: TestCaseArgument): string;
}

export { FileService };