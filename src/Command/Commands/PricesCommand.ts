import {DateTime} from 'luxon';
import {UserInfo} from '../../Models/UserInfo';
import {ucfirst, WeekDay} from '../../util';
import {Command, CommandSender} from '../index';

enum PriceType {
	BUY = 'buy',
	SELL = 'sell',
}

export class PricesCommand implements Command {
	public getKeywords(): string[] {
		return [
			'prices',
		];
	}

	public getUsage(): string {
		return '[<limit>]';
	}

	public getSummary(): string {
		return 'Displays current buy or sell prices, depending on the day of the week.';
	}

	public getHelpText(): string {
		return 'Running this command on Sunday will show you which island is currently selling turnips for the ' +
			'lowest price. On every other day of the week, it shows which island\'s shop will buy turnips for the ' +
			'highest price. The optional `limit` argument can be used to control how many islands are included in ' +
			'the response. By default, only the best price will be displayed.';
	}

	public async execute(sender: CommandSender, args: string[]): Promise<void> {
		const guild = sender.message.guild;

		if (!guild) {
			await sender.message.reply('Sorry, this command can only be used from within a Discord server.');

			return;
		}

		const now = DateTime.utc();
		const limit = args.length >= 1 ? parseInt(args[0], 10) || 1 : 1;

		let type: string;

		if (args.length >= 2)
			type = args[1];
		else if (now.weekday === WeekDay.SUNDAY)
			type = PriceType.SELL;
		else
			type = PriceType.BUY;

		let lines: string[];

		if (type === PriceType.BUY) {
			lines = (await UserInfo.find(
				{
					serverIds: guild.id,
					'currentData.buyExpiration': {
						'$gt': now.toJSDate(),
					},
				},
				'-serverIds',
				{
					limit,
					sort: {
						'currentData.buyPrice': -1,
					},
				},
			)).map(item => this.formatPriceLine(
				guild.member(item.userId)?.displayName || '[redacted]',
				item.currentData.buyPrice,
				item.currentData.buyExpiration,
			));
		} else if (type === PriceType.SELL) {
			lines = (await UserInfo.find(
				{
					serverIds: guild.id,
					'currentData.sellExpiration': {
						'$gt': now.toJSDate(),
					},
				},
				'-serverIds',
				{
					limit,
					sort: {
						'currentData.sellPrice': 1,
					},
				},
			)).map(item => this.formatPriceLine(
				guild.member(item.userId)?.displayName || '[redacted]',
				item.currentData.sellPrice,
				item.currentData.sellExpiration,
			));
		} else {
			await sender.message.reply('Sorry, I didn\'t quite get that. Allowed price types are "buy" and "sell."');

			return;
		}

		if (lines.length === 0)
			await sender.channel.send(`No one has reported any ${type} prices yet.`);
		else if (lines.length === 1)
			await sender.channel.send(`The best known ${type} price is ${lines[0]}.`);
		else {
			await sender.channel.send(
				`**Top ${limit} ${ucfirst(type)} Prices**\n${lines.map(line => '• ' + line).join('\n')}`,
			);
		}
	}

	protected formatPriceLine(name: string, price: number, expiration: Date) {
		const diff = DateTime.fromJSDate(expiration).diff(DateTime.utc());

		return `${price} bells on ${name}'s island (${diff.toFormat('hh:mm')} remaining)`;
	}
}
