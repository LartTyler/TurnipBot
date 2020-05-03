import {DMChannel, Message, TextChannel, User} from 'discord.js';
import {getBotDisplayName, notifyServers as doNotifyServers} from '../index';
import {IServerConfig} from '../Models/ServerConfig';
import {IUserInfo} from '../Models/UserInfo';
import {CommandMap} from './CommandMap';
import {BuyCommand} from './Commands/BuyCommand';
import {NotifyCommand} from './Commands/NotifyCommand';
import {PricesCommand} from './Commands/PricesCommand';
import {SellCommand} from './Commands/SellCommand';
import {TimezoneCommand} from './Commands/TimezoneCommand';
import {TrendsCommand} from './Commands/TrendsCommand';

const PREFIX_REGEX = /:prefix\b/g;
const COMMAND_MAP = new CommandMap();

export function init() {
	COMMAND_MAP.add(new BuyCommand());
	COMMAND_MAP.add(new SellCommand());
	COMMAND_MAP.add(new PricesCommand());
	COMMAND_MAP.add(new TrendsCommand());
	COMMAND_MAP.add(new TimezoneCommand());
	COMMAND_MAP.add(new NotifyCommand());
	COMMAND_MAP.add(new HelpCommand());

	console.debug('Commands loaded.');
}

export async function execute(sender: CommandSender, args: string[]): Promise<void> {
	const command = COMMAND_MAP.find(args.shift() ?? '');

	if (!command) {
		await sender.channel.send(
			`Sorry, I didn't quite get that. For help, type \`@${getBotDisplayName(sender.channel)} help\``,
		);

		return;
	}

	return command.execute(sender, args);
}

export class HelpCommand implements Command {
	public getKeywords(): string[] {
		return [
			'help',
		];
	}

	public getSummary(): string {
		return 'This command. Can be used to list all available commands or to get more information about a command.';
	}

	public getUsage(): string {
		return '[<command>]';
	}

	public getHelpText(): string {
		return 'You want help... with the help command?';
	}

	public async execute(sender: CommandSender, args: string[]): Promise<void> {
		if (args.length)
			return this.executeHelp(sender, args[0]);
		else
			return this.executeList(sender);
	}

	protected async executeHelp(sender: CommandSender, commandName: string): Promise<void> {
		const command = COMMAND_MAP.find(commandName);

		if (!command) {
			await sender.message.reply('Sorry, I don\'t recognize that command.');

			return;
		}

		const prefix = getBotDisplayName(sender.channel);
		const lines = [
			`**Usage:** ${this.createUsageText(prefix, command)}`.replace(/:prefix\b/, prefix),
		];

		if (command.getKeywords().length > 1) {
			const aliases = command.getKeywords().slice(1);

			lines.push(`**Alias${aliases.length > 1 ? 'es' : ''}:** ${aliases.join(', ')}`);
		}

		lines.push('\n' + command.getSummary());

		if (command.getHelpText().length > 0)
			lines.push('\n' + command.getHelpText());

		await sender.channel.send(lines.join('\n').replace(PREFIX_REGEX, '@' + prefix));
	}

	protected async executeList(sender: CommandSender): Promise<void> {
		const prefix = getBotDisplayName(sender.channel);
		const commands = COMMAND_MAP.commands.map(command => (
			`${this.createUsageText(prefix, command)}\n` +
			`    ${command.getSummary()}`
		));

		await sender.channel.send(
			`All commands should begin with \`@${prefix}\`, unless the command is being sent in a DM. For more ` +
			`information on any of the commands listed below, you can type \`@${prefix} help <command>\`.\n\n` +
			'**Commands:**\n' +
			commands.join('\n\n').replace(PREFIX_REGEX, '@' + prefix),
		);
	}

	protected createUsageText(prefix: string, command: Command): string {
		return '`' + `@${prefix} ${command.getKeywords()[0]} ${command.getUsage()}`.trim() + '`';
	}
}

export interface Command {
	getKeywords(): string[];

	execute(sender: CommandSender, args: string[]): Promise<void>;

	getUsage(): string;

	getHelpText(): string;

	getSummary(): string;
}

export class CommandSender {
	public readonly channel: TextChannel | DMChannel;
	public readonly user: User;
	public readonly message: Message;
	public readonly userInfo: IUserInfo;
	public readonly config: IServerConfig | null;

	public constructor(message: Message, userInfo: IUserInfo, config: IServerConfig | null) {
		this.channel = message.channel;
		this.user = message.author;
		this.message = message;
		this.userInfo = userInfo;
		this.config = config;
	}
}

export enum Emoji {
	CHECKMARK = '✅',
	CROSS = '❌',
}

export const TIMEZONE_REQUIRED_MESSAGE = 'I don\'t know what timezone you\'re in, so I can\'t record your buy ' +
	'price correctly. Can you set your timezone using `@TurnipBot timezone <timezone>`, then try again?';

export async function notifyServers(sender: CommandSender, message: string) {
	await doNotifyServers(
		sender.user,
		sender.channel instanceof TextChannel ? sender.channel.id : null,
		sender.userInfo.serverIds,
		message,
	);
}
