import {DateTime} from 'luxon';
import {BuyData, IBuyData} from '../Models/BuyData';
import {SellData} from '../Models/SellData';
import {IUserInfo, UserInfo} from '../Models/UserInfo';
import {WeekDay} from '../util';
import {Command} from './index';

const buyDays = [
	WeekDay.MONDAY,
	WeekDay.TUESDAY,
	WeekDay.WEDNESDAY,
	WeekDay.THURSDAY,
	WeekDay.FRIDAY,
	WeekDay.SATURDAY,
];

export const execute: Command = async (sender, args) => {
	const users: IUserInfo[] = [];

	if (args.length === 0)
		users.push(sender.userInfo);
	else {
		if (!sender.message.guild) {
			await sender.message.reply('This command can only be run from within a Discord server.');

			return;
		}

		if (args[0] === 'all') {
			(await UserInfo.find({
				serverIds: sender.message.guild.id,
			})).map(user => users.push(user));
		} else {
			(await UserInfo.find({
				userId: {
					'$in': sender.message.mentions.users.map(user => user.id),
				},
			})).map(user => users.push(user));
		}
	}

	const data: string[] = [];

	for (const user of users) {
		if (!user.timezone)
			continue;

		const local = DateTime.fromObject({zone: user.timezone});

		const sellData = await SellData.findOne({
			userId: user.userId,
			week: local.weekNumber - (local.weekday === WeekDay.SUNDAY ? 0 : 1),
		});

		if (!sellData)
			continue;

		const parts = [sellData.price.toString(10)];
		let buyData: IBuyData[];

		if (local.weekday !== WeekDay.SUNDAY) {
			buyData = await BuyData.find({
				userId: user.userId,
				week: local.weekNumber,
			}, null, {
				sort: {
					day: 1,
					morning: -1,
				},
			});

			let index = 0;

			for (const day of buyDays) {
				for (let i = 1; i >= 0 && index < buyData.length; i--) {
					if (buyData[index]?.day === day && buyData[index]?.morning === !!i)
						parts.push(buyData[index++].price.toString(10));
					else
						parts.push('');
				}

				if (index >= buyData.length)
					break;
			}
		}

		// If guild isn't null, this came from a server, and should use display names. Otherwise, it was a direct
		// message, and we're only processing results for the sender.
		const displayName = sender.message.guild ?
			sender.message.guild.member(user.userId)?.displayName || '[redacted]' :
			sender.user.username;

		data.push(`**${displayName}'s** trends for this week:\n<https://ac-turnip.com/share?f=${parts.join('-')}>`);
	}

	if (data.length === 0)
		await sender.message.reply('There isn\'t any trend data available right now.');
	else
		await sender.message.channel.send(data.join('\n\n'));
};
