import {DateTime} from 'luxon';
import {SellData} from '../Models/SellData';
import {WeekDay} from '../util';
import {Command, Emoji, TIMEZONE_REQUIRED_MESSAGE} from './index';

// Syntax: sell[ing] [...] <amount>
export const execute: Command = async (sender, args) => {
	if (!sender.userInfo?.timezone) {
		await sender.message.reply(TIMEZONE_REQUIRED_MESSAGE);

		return;
	}

	const now = DateTime.fromObject({zone: sender.userInfo.timezone});

	if (now.weekday !== WeekDay.SUNDAY) {
		await sender.message.reply('Daisy Mae only sells turnips on Sunday.');

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
			price,
		},
		{
			upsert: true,
		},
	);

	await sender.message.react(Emoji.CHECKMARK);
};
