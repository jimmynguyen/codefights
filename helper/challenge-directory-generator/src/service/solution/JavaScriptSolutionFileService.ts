import { sprintf } from 'sprintf-js';

import { Challenge } from '../../entity/Challenge';
import { TestCase } from '../../entity/TestCase';
import { TestCaseArgument } from '../../entity/TestCaseArgument';
import { IMainArgumentsMap } from '../../interface/solution/IMainArgumentsMap';
import { IStringFormatArgumentsMap } from '../../interface/solution/IStringFormatArgumentsMap';
import { IJavaScriptStringFormatArgumentsMap } from '../../interface/solution/js/IJavaScriptStringFormatArgumentsMap';
import { IMainJavaScriptArgumentsMap } from '../../interface/solution/js/IMainJavaScriptArgumentsMap';
import { FileService } from '../FileService';

class JavaScriptSolutionFileService extends FileService {
	protected templatesDirPath: string;
	constructor(challenge: Challenge) {
		super(challenge);
		this.templatesDirPath = sprintf('%sjs/', this.TEMPLATES_DIR_PATH);
	}
	protected getChallengeTestBashFile(): string {
		return sprintf('node %s.js', this.challenge.getName());
	}
	protected createChallengeSolutionFiles(): void {
		this.createMainSolutionFile('main.js', sprintf('%s.js', this.challenge.getName()));
	}
	protected getMainArgumentsMap(): IMainArgumentsMap {
		const challengeName: string = this.challenge.getName();
		const outputType: string = this.challenge.getTestCases()[0].getOutput().getType();
		const testCases: TestCase[] = this.challenge.getTestCases();
		const argumentsMap: IMainJavaScriptArgumentsMap = {
			METHOD_NAME: challengeName,
			TEST_OUTPUTS: testCases.map(testCase => this.getTestCaseArgumentValue(testCase.getOutput())).join(', '),
			TEST_INPUTS: '',
			NUM_TESTS_ASSERTION: '',
			METHOD_ARGS: '',
			METHOD_ARGS_DEFINITION: ''
		};
		let delimiter: string;
		let isLastIteration: boolean;
		const numInputs = testCases[0].getInputs().length;
		for (let index = 0; index < numInputs; index++) {
			isLastIteration = index == numInputs - 1;
			delimiter = isLastIteration ? '' : '\n\t';
			argumentsMap.TEST_INPUTS += sprintf('const input%d = [%s];%s', index, testCases.map(testCase => this.getTestCaseArgumentValue(testCase.getInputs()[index])).join(', '), delimiter);
			argumentsMap.NUM_TESTS_ASSERTION += sprintf('console.assert(input%d.length == expectedOutput.length, `# input%d = ${input%d.length}, # expectedOutput = ${expectedOutput.length}`);%s', index, index, index, delimiter);
			delimiter = isLastIteration ? '' : ', ';
			argumentsMap.METHOD_ARGS += sprintf('input%d[i]%s', index, delimiter);
			argumentsMap.METHOD_ARGS_DEFINITION += sprintf('input%d%s', index, delimiter);
		}
		return argumentsMap;
	}
	protected getStringFormatArgumentsMap(): IStringFormatArgumentsMap {
		const map: IJavaScriptStringFormatArgumentsMap = {
			DEFAULT: {
				type: 'default',
				format: '%s'
			}
		}
		return map;
	}
	protected getTestCaseArgumentValue(testCaseArgument: TestCaseArgument): string {
		switch (testCaseArgument.getType()) {
			default:
				return testCaseArgument.getValue();
		}
	}

}

export { JavaScriptSolutionFileService };