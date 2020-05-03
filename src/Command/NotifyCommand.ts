import {TextChannel} from 'discord.js';
import {ServerConfig} from '../Models/ServerConfig';
import {CommandExecutor} from './index';

enum Action {
	Enable,
	Disable,
	Toggle,
}

export const execute: CommandExecutor = async (sender, args) => {
	if (!(sender.channel instanceof TextChannel)) {
		await sender.channel.send('This command can only be run from within a Discord server.');

		return;
	}

	const action = toAction(args[0] ?? null);

	if (action === null) {
		await sender.message.reply(
			'Sorry, I didn\'t quite get that. You can manage notifications like this: ' +
			'`@TurnipBot notify on #channel` or `@TurnipBot notify off #channel`',
		);

		return;
	}

	const config = sender.config ?? new ServerConfig({
		serverId: sender.channel.guild.id,
	});

	const channels: TextChannel[] = [];

	// No channels mentioned means that we're managing notifications for the channel the message was sent in.
	if (sender.message.mentions.channels.size === 0)
		channels.push(sender.channel);
	else
		sender.message.mentions.channels.forEach(channel => channels.push(channel));

	console.log(channels.length);
	console.log(channels.map(channel => channel.name));

	const skipped: TextChannel[] = [];

	for (const channel of channels) {
		if (!channel.permissionsFor(sender.user)?.has('MANAGE_CHANNELS')) {
			skipped.push(channel);

			continue;
		}

		if (action === Action.Enable)
			enable(config.notifyChannels, channel.id);
		else if (action === Action.Disable)
			disable(config.notifyChannels, channel.id);
		else
			toggle(config.notifyChannels, channel.id);
	}

	if (skipped.length === channels.length) {
		await sender.message.reply(
			'Sorry, you don\'t have sufficient permissions for any of the channels you mentioned.',
		);

		return;
	}

	if (skipped.length > 0) {
		await sender.message.reply(
			`I was only able to update notification settings for ${channels.length - skipped.length} of the channels ` +
			'you mentioned. You don\'t have sufficient permissions to enable notifications for the following ' +
			`channel(s): ${skipped.map(channel => channel.name).join(', ')}`,
		);
	} else
		await sender.message.reply('Notification settings updated!');

	console.log(config.notifyChannels);

	await config.save();
};

function toAction(input: string | null): Action | null {
	if (input === null || input.charAt(0) === '<')
		return Action.Toggle;

	switch (input.toLowerCase()) {
		case 'on':
		case 'enable':
			return Action.Enable;

		case 'off':
		case 'disable':
			return Action.Disable;

		default:
			return null;
	}
}

function enable(channels: string[], id: string, index?: number): string[] {
	index = index ?? channels.indexOf(id);

	if (index === -1)
		channels.push(id);

	return channels;
}

function disable(channels: string[], id: string, index?: number): string[] {
	index = index ?? channels.indexOf(id);

	if (index !== -1)
		channels.splice(index, 1);

	return channels;
}

function toggle(channels: string[], id: string): string[] {
	const index = channels.indexOf(id);

	return index === -1 ? enable(channels, id, index) : disable(channels, id, index);
}
