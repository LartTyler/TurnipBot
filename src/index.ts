import {Client} from 'discord.js';
import * as mongoose from './mongoose';

if (!process.env.MONGO_URI)
	throw new Error('You must provide a MONGO_URI environment variable');

mongoose.connect(process.env.MONGO_URI);

const client = new Client();

client.on('ready', () => {
	console.log('TurnipBot ready.');
});

client.on('message', message => {
	if (message.content === 'ping')
		message.channel?.send('pong!');
});

if (process.env.DISCORD_APP_TOKEN) {
	client.login(process.env.DISCORD_APP_TOKEN).then(() => {
		console.log('TurnipBot logged in to Discord servers');
	}).catch(err => {
		console.error('Could not log in; reason: ' + err);
	});
}
