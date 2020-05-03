import {Command} from './index';

export class CommandMap {
	public readonly commands: Command[] = [];
	protected keywordLookup: {[key: string]: Command} = {};

	public add(command: Command) {
		if (this.commands.indexOf(command) !== -1)
			return;

		this.commands.push(command);

		for (const keyword of command.getKeywords())
			this.keywordLookup[keyword] = command;
	}

	public find(keyword: string) {
		return this.keywordLookup[keyword] ?? null;
	}
}
