import {Client, Message} from 'discord.js';
import * as Commands from './Commands';
import {CommandSender} from './Commands';
import {BuyData} from './Models/BuyData';
import {SellData} from './Models/SellData';
import {UserInfo} from './Models/UserInfo';
import * as mongoose from './mongoose';

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

client.on('message', async (message: Message) => {
	if (!client.user) {
		console.warn('Messages received before logging in will be discarded!');

		return;
	} else if (!message.content || !message.mentions.has(client.user, {ignoreRoles: true, ignoreEveryone: true}))
		return;

	const user = await UserInfo.findOne({userId: message.author.id});
	const args = message.content.toLowerCase().split(' ').reduce((parts, part) => {
		part = part.trim();

		if (part.length)
			parts.push(part);

		return parts;
	}, [] as string[]);

	// throw away the mention
	args.shift();

	await Commands.execute(new CommandSender(message, user), args);
});

if (process.env.DISCORD_APP_TOKEN) {
	client.login(process.env.DISCORD_APP_TOKEN).then(() => {
		console.log('TurnipBot logged in to Discord servers');
	}).catch(err => {
		console.error('Could not log in; reason: ' + err);
	});
}
