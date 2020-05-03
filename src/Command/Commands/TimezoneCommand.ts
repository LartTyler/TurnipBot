import {Info} from 'luxon';
import {UserInfo} from '../../Models/UserInfo';
import {Command, CommandSender, createUseHelpMessage, Emoji} from '../index';

export class TimezoneCommand implements Command {
	public getKeywords(): string[] {
		return [
			'timezone',
			'tz',
		];
	}

	getUsage(): string {
		return '<ianaTimezone>';
	}

	getSummary(): string {
		return 'Updates your island\'s current timezone. Necessary for buy and sell price tracking.';
	}

	getHelpText(): string {
		return 'This command accepts any valid IANA timezone name. To find your current timezone, simply visit ' +
			'<https://tz.turnipbot.com> in your browser, and copy the value displayed on the page.';
	}

	public async execute(sender: CommandSender, args: string[]): Promise<void> {
		if (!Info.isValidIANAZone(args[0])) {
			await sender.message.reply(createUseHelpMessage(sender.channel, this));

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
	}
}
