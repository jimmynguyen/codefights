import { sprintf } from 'sprintf-js';

import { TestCase } from '../../entity/TestCase';
import { TestCaseArgument } from '../../entity/TestCaseArgument';
import { IArgumentsMap } from '../../interface/solution/IArgumentsMap';
import { IStringFormatArgumentsMap } from '../../interface/solution/IStringFormatArgumentsMap';
import { IJavaArgumentsMap } from '../../interface/solution/java/IJavaArgumentsMap';
import { IJavaStringFormatArgumentsMap } from '../../interface/solution/java/IJavaStringFormatArgumentsMap';
import { FileService } from '../FileService';

class JavaSolutionFileService extends FileService {
	protected importTemplateString: string = 'import %s;\n';
	protected getChallengeTestBashFileParameter(): string {
		return this.challenge.getName().toPascalCase();
	}
	protected getMainArgumentsMap(): IArgumentsMap {
		const challengeName: string = this.challenge.getName();
		const outputType: string = this.challenge.getTestCases()[0].getOutput().getType();
		const argumentsMap: IJavaArgumentsMap = {
			CLASS_NAME: challengeName.toPascalCase(),
			OUTPUT_TYPE: '',
			METHOD_NAME: challengeName,
			ACTUAL_EXPECTED_COMPARISON: '',
			OUTPUT_TYPE_STRING_FORMAT_TEMPLATE: this.getStringFormat(outputType),
			TEST_OUTPUTS: '',
			TEST_INPUTS: '',
			NUM_TESTS_ASSERTION: '',
			METHOD_ARGS: '',
			METHOD_ARGS_STRING_FORMAT_TEMPLATE: '',
			METHOD_ARGS_STRING_FORMAT_VALUES: '',
			METHOD_ARGS_DEFINITION: '',
			ACTUAL_OUTPUT_STRING_FORMAT_VALUE: '',
			EXPECTED_OUTPUT_STRING_FORMAT_VALUE: '',
			IMPORTS: ''
		};
		this.setMainArgumentsMapValues(argumentsMap);
		return argumentsMap;
	}
	protected getStringFormatArgumentsMap(): IStringFormatArgumentsMap {
		const map: IJavaStringFormatArgumentsMap = {
			DEFAULT: {
				type: 'default',
				format: '%s'
			},
			STRING: {
				type: 'String',
				format: '\\"%s\\"'
			},
			INT: {
				type: 'int',
				format: '%d'
			},
			DOUBLE: {
				type: 'double',
				format: '%f'
			},
			BOOLEAN: {
				type: 'boolean',
				format: '%b'
			},
			INT_ARRAY: {
				type: 'int[]',
				format: '%s'
			}
		};
		return map;
	}
	protected getTestCaseArgumentValue(testCaseArgument: TestCaseArgument): string {
		switch (testCaseArgument.getType()) {
			case this.getStringFormatArgumentsMap().INT_ARRAY.type:
				return testCaseArgument.getValue().replace('[', '{').replace(']', '}');
			default:
				return testCaseArgument.getValue();
		}
	}
	protected setMainArgumentsMapValues(argumentsMap: IArgumentsMap): void {
		let imports: string[] = this.initializeImports();
		const testCases: TestCase[] = this.challenge.getTestCases();
		const inputTypes: string[] = testCases[0].getInputs().map(input => input.getType());
		let delimiter: string;
		let isLastIteration: boolean;
		for (const [index, inputType] of inputTypes.entries()) {
			isLastIteration = index == inputTypes.length - 1;
			delimiter = isLastIteration ? '' : '\n\t\t';
			this.setTestInputs(argumentsMap, inputType, testCases, index, delimiter);
			this.setNumTestsAssertion(argumentsMap, index, delimiter);
			delimiter = isLastIteration ? '' : ', ';
			this.setMethodArgs(argumentsMap, index, delimiter);
			this.setMethodArgsDefinition(argumentsMap, inputType, index, delimiter);
			this.setMethodArgsStringFormatTemplate(argumentsMap, inputType, delimiter);
			this.setMethodArgsStringFormatValues(argumentsMap, imports, inputType, sprintf('input%d[i]', index), delimiter);
		}
		this.setOutputType(argumentsMap);
		this.setTestOutputs(argumentsMap, testCases);
		this.setActualExpectedComparison(argumentsMap, imports);
		this.setOutputStringFormatValues(argumentsMap, imports);
		this.setImports(argumentsMap, imports);
	}
	protected initializeImports(): string[] {
		return ['java.util.stream.IntStream'];
	}
	protected setActualExpectedComparison(argumentsMap: IArgumentsMap, imports: string[]): void {
		const outputType: string = this.challenge.getTestCases()[0].getOutput().getType();
		if (this.isArray(outputType)) {
			argumentsMap.ACTUAL_EXPECTED_COMPARISON = 'Arrays.equals(actualOutput, expectedOutput[i])';
			imports.push('java.util.Arrays');
		} else if (outputType.charAt(0) == outputType.charAt(0).toUpperCase()) {
			argumentsMap.ACTUAL_EXPECTED_COMPARISON = 'actualOutput.equals(expectedOutput[i])';
		} else {
			argumentsMap.ACTUAL_EXPECTED_COMPARISON = 'actualOutput == expectedOutput[i]';
		}
	}
	protected setOutputStringFormatValues(argumentsMap: IArgumentsMap, imports: string[]): void {
		const outputType: string = this.challenge.getTestCases()[0].getOutput().getType();
		argumentsMap.ACTUAL_OUTPUT_STRING_FORMAT_VALUE = this.getStringFormatValue(outputType, 'actualOutput', imports);
		argumentsMap.EXPECTED_OUTPUT_STRING_FORMAT_VALUE = this.getStringFormatValue(outputType, 'expectedOutput[i]', imports);
	}
	protected getStringFormatValue(type: string, variable: string, imports: string[]): string {
		if (this.isArray(type)) {
			imports.push('java.util.Arrays');
			return sprintf('Arrays.toString(%s)', variable);
		} else {
			return variable;
		}
	}
	protected setImports(argumentsMap: IArgumentsMap, imports: string[]): void {
		if (imports.length == 0) {
			return;
		}
		let uniqueImports: string[] = [];
		for (let x of imports) {
			if (!uniqueImports.includes(x)) {
				uniqueImports.push(x);
			}
		}
		argumentsMap.IMPORTS = uniqueImports.sort().map((x) => sprintf(this.importTemplateString, x)).join('');
	}
	protected setOutputType(argumentsMap: IArgumentsMap) {
		argumentsMap.OUTPUT_TYPE = this.challenge.getTestCases()[0].getOutput().getType();
	}
	protected setTestOutputs(argumentsMap: IArgumentsMap, testCases: TestCase[]) {
		argumentsMap.TEST_OUTPUTS += testCases.map(testCase => this.getTestCaseArgumentValue(testCase.getOutput())).join(', ');
	}
	protected setTestInputs(argumentsMap: IArgumentsMap, inputType: string, testCases: TestCase[], index: number, delimiter: string) {
		argumentsMap.TEST_INPUTS += sprintf('%s[] input%d = new %s[] {%s};%s', inputType, index, inputType, testCases.map(testCase => this.getTestCaseArgumentValue(testCase.getInputs()[index])).join(', '), delimiter);
	}
	protected setNumTestsAssertion(argumentsMap: IArgumentsMap, index: number, delimiter: string) {
		argumentsMap.NUM_TESTS_ASSERTION += sprintf('assert input%d.length == expectedOutput.length : String.format("# input%d = %%d, # expectedOutput = %%d", input%d.length, expectedOutput.length);%s', index, index, index, delimiter);
	}
	protected setMethodArgs(argumentsMap: IArgumentsMap, index: number, delimiter: string) {
		argumentsMap.METHOD_ARGS += sprintf('input%d[i]%s', index, delimiter);
	}
	protected setMethodArgsDefinition(argumentsMap: IArgumentsMap, inputType: string, index: number, delimiter: string) {
		argumentsMap.METHOD_ARGS_DEFINITION += sprintf('%s input%d%s', inputType, index, delimiter);
	}
	protected setMethodArgsStringFormatTemplate(argumentsMap: IArgumentsMap, inputType: string, delimiter: string) {
		argumentsMap.METHOD_ARGS_STRING_FORMAT_TEMPLATE += sprintf('%s%s', this.getStringFormat(inputType), delimiter);
	}
	protected setMethodArgsStringFormatValues(argumentsMap: IArgumentsMap, imports: string[], type: string, variable: string, delimiter: string) {
		argumentsMap.METHOD_ARGS_STRING_FORMAT_VALUES += sprintf('%s%s', this.getStringFormatValue(type, variable, imports), delimiter);
	}
}

export { JavaSolutionFileService };