import {Client, Message} from 'discord.js';
import {BuyData} from './Models/BuyData';
import {SellData} from './Models/SellData';
import * as mongoose from './mongoose';
import {getBestBuy, getBestSell, ucfirst} from './util';

if (!process.env.MONGO_URI)
	throw new Error('You must provide a MONGO_URI environment variable');

mongoose.connect(process.env.MONGO_URI);

const client = new Client();

client.on('ready', () => {
	console.log('TurnipBot ready.');
});

client.on('guildMemberRemove', async member => {
	await SellData.remove({
		userId: member.id,
	});

	await BuyData.remove({
		userId: member.id,
	});
});

// Commands:
//   buy[ing] [for] <amount>
//   sell[ing] [for] <amount>
//   prices [<limit = 1>]

client.on('message', async (message: Message) => {
	if (!client.user)
		return;
	else if (!message.mentions?.has(client.user, {ignoreRoles: true, ignoreEveryone: true}))
		return;
	else if (!message.content)
		return;

	const parts = message.content.toLowerCase().split(' ').map(part => part.trim()).filter(part => part.length > 0);
	parts.shift();

	if (parts[0].indexOf('buy') === 0) {
		const day = message.createdAt.getDay();

		if (day === 0) {
			await message.reply('Turnips can\'t be sold on Sunday.');

			return;
		}

		const value = parts.find(item => /\d+/.test(item));

		if (!value) {
			await message.reply(
				'Sorry, I didn\'t quite get that. Tell me buy prices like this: "buying for 125"',
			);

			return;
		}

		BuyData.findOneAndUpdate(
			{
				userId: message.author.id,
			},
			{
				price: parseInt(value, 10),
			},
			{
				upsert: true,
			},
		).then(async () => {
			await message.react('✅');
		});
	} else if (parts[0].indexOf('sell') === 0) {
		if (message.createdAt.getDay() !== 0) {
			await message.reply('Daisy Mae only sells turnips on Sunday.');

			return;
		}

		const value = parts.find(item => /\d+/.test(item));

		if (!value) {
			await message.reply(
				'Sorry, I didn\'t quite get that. Tell me sell prices like this: "selling for 100"',
			);

			return;
		}

		SellData.findOneAndUpdate(
			{
				userId: message.author.id,
			},
			{
				price: parseInt(value, 10),
			},
			{
				upsert: true,
			},
		).then(async () => {
			await message.react('✅');
		});
	} else if (parts[0] === 'prices') {
		const limit = parts.length >= 2 ? parseInt(parts[1], 10) : 1;

		let lines: string[];
		let prefix: string;

		if (message.createdAt.getDay() === 0) {
			prefix = 'sell';

			lines = (await getBestSell(limit)).map(item => formatDataLine(
				message.guild?.member(item.userId)?.displayName,
				item.price,
			));
		} else {
			prefix = 'buy';

			lines = (await getBestBuy(limit)).map(item => formatDataLine(
				message.guild?.member(item.userId)?.displayName,
				item.price,
			));
		}

		if (lines.length === 0)
			await message.channel.send(`No one has reported any ${prefix} prices yet.`);
		else if (lines.length === 1)
			await message.channel.send(`The best known ${prefix} price is ${lines[0]}.`);
		else {
			await message.channel.send(
				`**Top ${limit} ${ucfirst(prefix)} Prices**\n${lines.map(line => '• ' + line).join('\n')}`,
			);
		}
	}
});

if (process.env.DISCORD_APP_TOKEN) {
	client.login(process.env.DISCORD_APP_TOKEN).then(() => {
		console.log('TurnipBot logged in to Discord servers');
	}).catch(err => {
		console.error('Could not log in; reason: ' + err);
	});
}

function formatDataLine(name: string | undefined, price: number) {
	return `${price} bells on ${name}'s island`;
}
