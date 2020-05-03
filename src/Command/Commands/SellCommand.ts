import {DateTime} from 'luxon';
import {SellData} from '../../Models/SellData';
import {WeekDay} from '../../util';
import {
	Command,
	CommandSender,
	createTimezoneRequiredMessage,
	createUseHelpMessage,
	Emoji,
	notifyServers,
} from '../index';

export class SellCommand implements Command {
	public getKeywords(): string[] {
		return [
			'sell',
			'selling',
		];
	}

	getUsage(): string {
		return '<amount>';
	}

	getSummary(): string {
		return 'Updates your island\'s current sell price.';
	}

	getHelpText(): string {
		return 'This command can only be run on Sunday, when Daisy Mae is visiting your island (between 5am and ' +
			'12pm). Sell prices will automatically be expired when Daisy Mae leaves your island at noon.\n\n' +
			'You _must_ set your timezone with `:prefix timezone` before you can use this command.';
	}

	public async execute(sender: CommandSender, args: string[]): Promise<void> {
		if (!sender.userInfo?.timezone) {
			await sender.message.reply(createTimezoneRequiredMessage(sender.channel));

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
			await sender.message.reply(createUseHelpMessage(sender.channel, this));

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
	}
}
