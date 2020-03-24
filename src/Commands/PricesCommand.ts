import {DateTime} from 'luxon';
import {FilterQuery, Model} from 'mongoose';
import {BuyData, IBuyData} from '../Models/BuyData';
import {ISellData, SellData} from '../Models/SellData';
import {UserInfo} from '../Models/UserInfo';
import {ucfirst, WeekDay} from '../util';
import {Command, TIMEZONE_REQUIRED_MESSAGE} from './index';

enum PriceType {
	BUY = 'buy',
	SELL = 'sell',
}

// Syntax: prices [<limit=1> [<type=auto>]]
export const execute: Command = async (sender, args) => {
	const guild = sender.message.guild;

	if (!guild) {
		await sender.message.reply('Sorry, this command can only be used from within a Discord server.');

		return;
	}

	const limit = args.length >= 1 ? parseInt(args[0], 10) || 1 : 1;

	let type: string;

	if (args.length >= 2) {
		type = args[1];

		if (!(type in PriceType)) {
			await sender.message.reply('Sorry, I didn\'t quite get that. Allowed price types are "buy" and "sell."');

			return;
		}
	} else {
		if (!sender.userInfo?.timezone) {
			await sender.message.reply(TIMEZONE_REQUIRED_MESSAGE);

			return;
		}

		const now = DateTime.fromObject({zone: sender.userInfo.timezone});

		if (now.weekday === WeekDay.SUNDAY)
			type = PriceType.SELL;
		else
			type = PriceType.BUY;
	}

	const lines = (await (type === PriceType.BUY ? getBestBuyPrices : getBestSellPrices)(guild.id, limit))
		.map(item => formatPriceLine(
			guild.member(item.userId)?.displayName || '[redacted]',
			item.price,
		));

	if (lines.length === 0)
		await sender.channel.send(`No one has reported any ${type} prices yet.`);
	else if (lines.length === 1)
		await sender.channel.send(`The best known ${type} price is ${lines[0]}.`);
	else {
		await sender.channel.send(
			`**Top ${limit} ${ucfirst(type)} Prices**\n${lines.map(line => '• ' + line).join('\n')}`,
		);
	}
};

function formatPriceLine(name: string, price: number) {
	return `${price} bells on ${name}'s island`;
}

async function getBestSellPrices(serverId: string, limit: number = 1): Promise<ISellData[]> {
	return getBestPrices(SellData, serverId, 1, limit);
}

async function getBestBuyPrices(serverId: string, limit: number = 1): Promise<IBuyData[]> {
	return getBestPrices(BuyData, serverId, -1, limit);
}

async function getBestPrices<T extends IBuyData | ISellData>(
	source: Model<T>,
	serverId: string,
	sort: -1 | 1,
	limit: number = 1,
): Promise<T[]> {
	return (await source.find(
		{
			userId: {
				'$in': (await UserInfo.find({
					serverIds: serverId,
				}, '_id')).map(item => item.id),
			},
		} as FilterQuery<T>,
		null,
		{
			limit,
			sort: {
				price: sort,
			},
		},
	));
}