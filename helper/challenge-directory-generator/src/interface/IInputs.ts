import * as prompts from 'prompts';

interface IInputs {
	USERNAME: prompts.PromptObject<string>;
	PASSWORD: prompts.PromptObject<string>;
	CHALLENGE_ID: prompts.PromptObject<string>;
	LANGUAGE: prompts.PromptObject<string>;
	LANGUAGE_FULL_NAME: prompts.PromptObject<string>;
	LANGUAGE_FILE_EXTENSION: prompts.PromptObject<string>;
	RUN_HEADLESS: prompts.PromptObject<string>;
	TEST_BASH_FILE: prompts.PromptObject<string>;
	DELETE_EXISTING_CHALLENGE_SOLUTION_DIR: prompts.PromptObject<string>;
}

export { IInputs };