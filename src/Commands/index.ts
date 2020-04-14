import {DMChannel, Message, TextChannel, User} from 'discord.js';
import {IUserInfo} from '../Models/UserInfo';
import * as BuyCommand from './BuyCommand';
import * as PricesCommand from './PricesCommand';
import * as SellCommand from './SellCommand';
import * as TimezoneCommand from './TimezoneCommand';
import * as TrendsCommand from './TrendsCommand';

export async function execute(sender: CommandSender, args: string[]): Promise<void> {
	switch (args.shift()) {
		case 'buy':
		case 'buying':
			return BuyCommand.execute(sender, args);

		case 'price':
		case 'prices':
			return PricesCommand.execute(sender, args);

		case 'sell':
		case 'selling':
			return SellCommand.execute(sender, args);

		case 'tz':
		case 'timezone':
			return TimezoneCommand.execute(sender, args);

		case 'trend':
		case 'trends':
			return TrendsCommand.execute(sender, args);

		default:
			await sender.message.react(Emoji.CROSS);

			return;
	}
}

export type Command = (sender: CommandSender, args: string[]) => Promise<void>;

export class CommandSender {
	public readonly channel: TextChannel | DMChannel;
	public readonly user: User;
	public readonly message: Message;
	public readonly userInfo: IUserInfo;

	public constructor(message: Message, userInfo: IUserInfo) {
		this.channel = message.channel;
		this.user = message.author;
		this.message = message;
		this.userInfo = userInfo;
	}
}

export enum Emoji {
	CHECKMARK = '✅',
	CROSS = '❌',
}

export const TIMEZONE_REQUIRED_MESSAGE = 'I don\'t know what timezone you\'re in, so I can\'t record your buy ' +
	'price correctly. Can you set your timezone using `@TurnipBot timezone <timezone>`, then try again?';
