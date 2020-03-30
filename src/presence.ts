import {ActivityType, Client} from 'discord.js';

const STATUSES: Array<{ type?: ActivityType, value: string }> = [
	{
		value: 'Animal Crossing: New Horizons',
	},
	{
		value: 'the Stalk Market',
	},
	{
		value: 'on your island',
	},
	{
		type: 'WATCHING',
		value: 'you miss fish',
	},
	{
		type: 'WATCHING',
		value: 'you miss bugs',
	},
	{
		value: 'in the Museum',
	},
	{
		type: 'LISTENING',
		value: 'to K.K. Slider',
	},
	{
		value: 'in the Roost',
	},
];

export async function start(client: Client) {
	// Defaults to a 1 hour delay between presence updates
	await change(client, parseInt(process.env.PRESENCE_UPDATE_DELAY || '', 10) || 3_600_000);
}

async function change(client: Client, delay: number) {
	const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

	await client.user?.setActivity({
		type: status.type || 'PLAYING',
		name: status.value,
	});

	setInterval(() => change(client, delay), delay);
}
