import {Info} from 'luxon';
import {UserInfo} from '../Models/UserInfo';
import {CommandExecutor, Emoji} from './index';

// Syntax: (tz|timezone) <ianaTimezone>
export const execute: CommandExecutor = async (sender, args) => {
	if (!Info.isValidIANAZone(args[0])) {
		await sender.message.reply(
			'Sorry, I didn\'t quite get that.\n\nTimezones need to be provided in an IANA-compatible format, e.g. ' +
			'`America/New_York`. You can find your timezone by visiting https://tz.turnipbot.com in your browser!',
		);

		return;
	}

	const doc: any = {
		'$set': {
			timezone: args[0],
		},
	};

	if (sender.message.guild)
		doc['$addToSet'] = {serverIds: sender.message.guild.id};

	await UserInfo.findOneAndUpdate({userId: sender.user.id}, doc, {upsert: true});

	await sender.message.react(Emoji.CHECKMARK);

	console.debug('Updated local timezone to %s for %s', args[0], sender.user.tag);
};
