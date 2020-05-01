import {DateTime} from 'luxon';
import {SellData} from '../Models/SellData';
import {WeekDay} from '../util';
import {Command, Emoji, notifyServers, TIMEZONE_REQUIRED_MESSAGE} from './index';

// Syntax: sell[ing] [...] <amount>
export const execute: Command = async (sender, args) => {
	if (!sender.userInfo?.timezone) {
		await sender.message.reply(TIMEZONE_REQUIRED_MESSAGE);

		return;
	}

	const now = DateTime.fromObject({zone: sender.userInfo.timezone});

	if (now.weekday !== WeekDay.SUNDAY || now.hour >= 12) {
		await sender.message.reply('Daisy Mae only sells turnips on Sunday morning.');

		return;
	} else if (now.hour < 5) {
		await sender.message.reply('Daisy Mae has not arrived on your island yet.');

		return;
	}

	const price = parseInt(args.find(arg => /\d+/.test(arg)) || '', 10);

	if (isNaN(price)) {
		await sender.message.reply(
			'Sorry, I didn\'t quite get that. Tell me sell prices like this: `@TurnipBot selling for 100`.',
		);

		return;
	}

	await SellData.findOneAndUpdate(
		{
			userId: sender.user.id,
			year: now.year,
			week: now.weekNumber,
		},
		{
			'$set': {
				price,
			},
		},
		{
			upsert: true,
		},
	);

	sender.userInfo.currentData = sender.userInfo.currentData || {};

	const expiration = now.plus({hours: 12 - now.hour}).startOf('hour').toUTC();

	sender.userInfo.currentData.sellPrice = price;
	sender.userInfo.currentData.sellExpiration = expiration.toJSDate();

	await sender.userInfo.save();

	await sender.message.react(Emoji.CHECKMARK);

	console.debug('Updated sell price to %d for %s (valid until %s)', price, sender.user.tag, expiration.toISO());

	await notifyServers(sender, `**:displayName** updated their current sell price to ${price} bells.`);
};
