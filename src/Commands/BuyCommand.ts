import {DateTime} from 'luxon';
import {BuyData} from '../Models/BuyData';
import {WeekDay} from '../util';
import {Command, Emoji, TIMEZONE_REQUIRED_MESSAGE} from './index';

// Syntax: buy[ing] [...] <amount>
export const execute: Command = async (sender, args) => {
	if (!sender.userInfo?.timezone) {
		await sender.message.reply(TIMEZONE_REQUIRED_MESSAGE);

		return;
	}

	const now = DateTime.fromObject({zone: sender.userInfo.timezone});

	if (now.weekday === WeekDay.SUNDAY) {
		await sender.message.reply('The shop doesn\'t buy turnips on Sunday.');

		return;
	} else if (now.hour >= 22 || now.hour < 3) {
		await sender.message.reply('The shop on your island has already closed.');

		return;
	} else if (now.hour < 8) {
		await sender.message.reply('The shop on your island hasn\'t opened yet.');

		return;
	}

	const price = parseInt(args.find(arg => /\d+/.test(arg)) || '', 10);

	if (isNaN(price)) {
		await sender.message.reply(
			'Sorry, I didn\'t quite get that. Tell me buy prices like this: `@TurnipBot buying for 125`.',
		);

		return;
	}

	await BuyData.findOneAndUpdate(
		{
			userId: sender.user.id,
			year: now.year,
			week: now.weekNumber,
			day: now.weekday,
			morning: now.hour < 12,
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

	let expiration: DateTime;

	if (now.hour < 12)
		expiration = now.plus({hours: 12 - now.hour}).startOf('hour');
	else
		expiration = now.plus({days: 1}).startOf('day').minus({hours: 2});

	sender.userInfo.currentData = sender.userInfo.currentData || {};

	sender.userInfo.currentData.buyPrice = price;
	sender.userInfo.currentData.buyExpiration = expiration.toUTC().toJSDate();

	await sender.userInfo.save();

	await sender.message.react(Emoji.CHECKMARK);

	console.debug(
		'Updated buy price to %d for %s (valid until %s)',
		price,
		sender.user.tag,
		expiration.toUTC().toISO(),
	);
};
