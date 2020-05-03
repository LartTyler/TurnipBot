import {Channel, Client, Message, TextChannel, User} from 'discord.js';
import * as Commands from './Command';
import {CommandSender} from './Command';
import {BuyData} from './Models/BuyData';
import {SellData} from './Models/SellData';
import {ServerConfig} from './Models/ServerConfig';
import {UserInfo} from './Models/UserInfo';
import * as mongoose from './mongoose';
import * as Presence from './presence';

if (!process.env.MONGO_URI)
	throw new Error('You must provide a MONGO_URI environment variable');

mongoose.connect(process.env.MONGO_URI);
Commands.init();

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

	// A message isn't a direct message if it has a `guild` prop
	if (message.guild && !message.mentions.has(client.user, {ignoreEveryone: true}))
		return;

	console.debug('Got command "%s" from "%s"', message.content, message.author.tag);

	const user = await UserInfo.findOne({
		userId: message.author.id,
	}) || new UserInfo({
		userId: message.author.id,
	});

	if (message.guild && user.serverIds.indexOf(message.guild.id) === -1) {
		user.serverIds.push(message.guild.id);

		await user.save();
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

	// Throw away the mention, if this is NOT a direct message OR if the message appears to start with a mention.
	if (message.guild || (args[0] ?? '').charAt(0) === '<')
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

export async function notifyServers(user: User, currentChannelId: string | null, serverIds: string[], message: string) {
	const configs = await ServerConfig.find({
		serverId: {
			$in: serverIds,
		},
	});

	for (const config of configs) {
		const guild = client.guilds.resolve(config.serverId);

		if (!guild)
			continue;

		const displayName = guild.member(user)?.displayName;

		if (!displayName)
			continue;

		for (const channelId of config.notifyChannels) {
			if (channelId === currentChannelId)
				continue;

			const channel = guild.channels.resolve(channelId);

			if (!channel || !(channel instanceof TextChannel))
				continue;

			await channel.send(message.replace(':displayName', displayName));
		}
	}
}

export function getBotDisplayName(channel: Channel): string {
	if (!client.user)
		return 'TurnipBot';

	return (channel instanceof TextChannel && channel.guild.member(client.user)?.displayName) || 'TurnipBot';
}
