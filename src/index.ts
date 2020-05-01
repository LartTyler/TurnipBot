import {Client, Message, TextChannel, User} from 'discord.js';
import * as Commands from './Commands';
import {CommandSender} from './Commands';
import {BuyData} from './Models/BuyData';
import {SellData} from './Models/SellData';
import {ServerConfig} from './Models/ServerConfig';
import {UserInfo} from './Models/UserInfo';
import * as mongoose from './mongoose';
import * as Presence from './presence';

if (!process.env.MONGO_URI)
	throw new Error('You must provide a MONGO_URI environment variable');

mongoose.connect(process.env.MONGO_URI);

const client = new Client();

client.on('ready', async () => {
	console.log('TurnipBot ready.');

	await Presence.start(client);
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
	} else if (!message.content || message.author === client.user)
		return;

	const doc: any = {};

	// A message isn't a direct message if it has a `guild` prop
	if (message.guild) {
		const member = message.guild.member(client.user);

		if (!member || !message.mentions.has(member, {ignoreEveryone: true}))
			return;

		doc['$addToSet'] = {
			serverIds: message.guild.id,
		};
	}

	console.debug('Got command "%s" from "%s"', message.content, message.author.tag);

	const user = await UserInfo.findOneAndUpdate(
		{
			userId: message.author.id,
		},
		doc,
		{
			upsert: true,
		},
	);

	if (!user) {
		console.error('Could not create UserInfo for user!');

		return;
	}

	const config = message.guild ? await ServerConfig.findOne({
		serverId: message.guild.id,
	}) : null;

	const args = message.content.toLowerCase().split(' ').reduce((parts, part) => {
		part = part.trim();

		if (part.length)
			parts.push(part);

		return parts;
	}, [] as string[]);

	// Throw away the mention, if this is NOT a direct message
	if (message.guild)
		args.shift();

	await Commands.execute(new CommandSender(message, user, config), args);
});

if (process.env.DISCORD_APP_TOKEN) {
	client.login(process.env.DISCORD_APP_TOKEN).then(() => {
		console.log('TurnipBot logged in to Discord servers');
	}).catch(err => {
		console.error('Could not log in; reason: ' + err);
	});
}

export async function notifyServers(user: User, currentServerId: string | null, serverIds: string[], message: string) {
	const configs = await ServerConfig.find({
		serverId: {
			$in: serverIds,
		},
	});

	for (const config of configs) {
		if (config.serverId === currentServerId)
			continue;

		const guild = client.guilds.resolve(config.serverId);

		if (!guild)
			continue;

		const displayName = guild.member(user)?.displayName;

		if (!displayName)
			continue;

		for (const channelId of config.notifyChannels) {
			const channel = guild.channels.resolve(channelId);

			if (!channel || !(channel instanceof TextChannel))
				continue;

			await channel.send(message.replace(':displayName', displayName));
		}
	}
}
