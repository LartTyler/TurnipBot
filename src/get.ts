import express from 'express';

if (!process.env.CLIENT_ID)
	throw new Error('Missing required environment variable CLIENT_ID');

const clientId = process.env.CLIENT_ID;
const botPermissions = process.env.BOT_PERMISSIONS || 2112;

const app = express();
app.set('port', process.env.PORT || 3000);

app.get('*', (_, res) => {
	res.redirect(
		`https://discordapp.com/api/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=${botPermissions}`,
	);
});

app.listen(app.get('port'), () => {
	console.log('  Application listening on http://localhost:' + app.get('port'));
});
