import { sprintf } from 'sprintf-js';

import { TestCase } from '../../entity/TestCase';
import { TestCaseArgument } from '../../entity/TestCaseArgument';
import { IArgumentsMap } from '../../interface/solution/IArgumentsMap';
import { IStringFormatArgumentsMap } from '../../interface/solution/IStringFormatArgumentsMap';
import { IPython3ArgumentsMap } from '../../interface/solution/python3/IPython3ArgumentsMap';
import { IPython3StringFormatArgumentsMap } from '../../interface/solution/python3/IPython3StringFormatArgumentsMap';
import { FileService } from '../FileService';

class Python3SolutionFileService extends FileService {
	protected getMainArgumentsMap(): IArgumentsMap {
		const challengeName: string = this.challenge.getName();
		const testCases: TestCase[] = this.challenge.getTestCases();
		const argumentsMap: IPython3ArgumentsMap = {
			METHOD_NAME: challengeName,
			TEST_OUTPUTS: testCases.map(testCase => this.getTestCaseArgumentValue(testCase.getOutput())).join(', '),
			METHOD_ARGS_DEFINITION: '',
			METHOD_ARGS: '',
			METHOD_ARGS_STRING_FORMAT_TEMPLATE: '',
			METHOD_ARGS_STRING_FORMAT_VALUES: '',
			TEST_INPUTS: '',
			NUM_TESTS_ASSERTION: ''
		};
		const inputTypes: string[] = testCases[0].getInputs().map(input => input.getType());
		let delimiter: string;
		let isLastIteration: boolean;
		for (const [index, inputType] of inputTypes.entries()) {
			isLastIteration = index == inputTypes.length - 1;
			delimiter = isLastIteration ? '' : '\n\t';
			argumentsMap.TEST_INPUTS += sprintf('input%d = [%s]%s', index, testCases.map(testCase => this.getTestCaseArgumentValue(testCase.getInputs()[index])).join(', '), delimiter);
			argumentsMap.NUM_TESTS_ASSERTION += sprintf('assert len(input%d) == len(expectedOutput), \'# input%d = \{\}, # expectedOutput = \{\}\'.format(len(input%d), len(expectedOutput))%s', index, index, index, delimiter);
			delimiter = isLastIteration ? '' : ', ';
			argumentsMap.METHOD_ARGS += sprintf('input%d[i]%s', index, delimiter);
			argumentsMap.METHOD_ARGS_STRING_FORMAT_TEMPLATE += sprintf('%s%s', this.getStringFormat(inputType), delimiter);
			argumentsMap.METHOD_ARGS_STRING_FORMAT_VALUES += sprintf('input%s[i]%s', index, delimiter);
			argumentsMap.METHOD_ARGS_DEFINITION += sprintf('input%s%s', index, delimiter);
		}
		this.setMainArgumentsMapValues(argumentsMap);
		return argumentsMap;
	}
	protected getStringFormatArgumentsMap(): IStringFormatArgumentsMap {
		const map: IPython3StringFormatArgumentsMap = {
			DEFAULT: {
				type: 'default',
				format: '{}'
			},
			STRING: {
				type: 'String',
				format: '\\"{}\\"'
			},
			BOOLEAN: {
				type: 'boolean',
				format: '{}'
			}
		};
		return map;
	}
	protected getTestCaseArgumentValue(testCaseArgument: TestCaseArgument): string {
		switch (testCaseArgument.getType()) {
			case this.getStringFormatArgumentsMap().BOOLEAN.type:
				return testCaseArgument.getValue().toPascalCase();
			default:
				return testCaseArgument.getValue();
		}
	}
	protected setMainArgumentsMapValues(argumentsMap: IArgumentsMap): void {
		return;
	}
}

export { Python3SolutionFileService };