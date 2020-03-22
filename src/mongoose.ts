import mongoose from 'mongoose';

export const connect = (uri: string) => {
	mongoose.connect(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}).then(() => {
		console.info('Database connection established');
	}).catch(err => {
		console.error('Could not establish database connection; reason: ' + err);

		process.exit(1);
	});

	mongoose.connection.on('disconnected', () => {
		console.info('Database connection lost, attempting to reconnect...');

		connect(uri);
	});
};
