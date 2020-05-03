import {TextChannel} from 'discord.js';
import {ServerConfig} from '../../Models/ServerConfig';
import {Command, CommandSender} from '../index';

enum Action {
	Enable,
	Disable,
	Toggle,
}

export class NotifyCommand implements Command {
	getKeywords(): string[] {
		return [
			'notify',
			'notifications',
		];
	}

	getUsage(): string {
		return '(on | off) [channels...]';
	}

	getSummary(): string {
		return 'Manages buy and sell price notification messages for a channel. Cannot be used in direct messages.';
	}

	getHelpText(): string {
		return 'This command can be used to specify channels that the bot should post to if a user posts a price ' +
			'update to another server, or via direct message. This command has three main forms.\n\n' +
			'• `:prefix notify`\n' +
			'> Toggles notifications for the specified channels.\n\n' +
			'• `:prefix notify on`\n' +
			'> Enables notifications for the specified channels.\n\n' +
			'• `:prefix notify off`\n' +
			'> Disables notifications for the specified channels.\n\n' +
			'All forms accept an optional list of channels that should be updated, e.g. ' +
			'`:prefix notify #channel-a #channel-b #channel-c`. If no channels are specified, only the channel the ' +
			'command was run in will be updated.';
	}

	public async execute(sender: CommandSender, args: string[]): Promise<void> {
		if (!(sender.channel instanceof TextChannel)) {
			await sender.channel.send('This command can only be run from within a Discord server.');

			return;
		}

		const action = this.toAction(args[0] ?? null);

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
				this.enableNotifications(config.notifyChannels, channel.id);
			else if (action === Action.Disable)
				this.disableNotifications(config.notifyChannels, channel.id);
			else
				this.toggleNotifications(config.notifyChannels, channel.id);
		}

		if (skipped.length === channels.length) {
			await sender.message.reply(
				'Sorry, you don\'t have sufficient permissions for any of the channels you mentioned.',
			);

			return;
		}

		if (skipped.length > 0) {
			await sender.message.reply(
				`I was only able to update notification settings for ${channels.length -
				skipped.length} of the channels ` +
				'you mentioned. You don\'t have sufficient permissions to enable notifications for the following ' +
				`channel(s): ${skipped.map(channel => channel.name).join(', ')}`,
			);
		} else
			await sender.message.reply('Notification settings updated!');

		await config.save();
	}

	protected toAction(input: string | null): Action | null {
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

	protected enableNotifications(channels: string[], id: string, index?: number): string[] {
		index = index ?? channels.indexOf(id);

		if (index === -1)
			channels.push(id);

		return channels;
	}

	protected disableNotifications(channels: string[], id: string, index?: number): string[] {
		index = index ?? channels.indexOf(id);

		if (index === -1)
			channels.push(id);

		return channels;

	}

	protected toggleNotifications(channels: string[], id: string): string[] {
		const index = channels.indexOf(id);

		return index === -1 ? this.enableNotifications(channels, id, index) :
			this.disableNotifications(channels, id, index);
	}
}
