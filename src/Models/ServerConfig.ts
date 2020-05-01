import {Document, model, Schema, SchemaTypes} from 'mongoose';

export interface IServerConfig extends Document {
	serverId: string;
	notifyChannels: string[];
}

const ServerConfigSchema = new Schema({
	serverId: {
		type: SchemaTypes.String,
		required: true,
	},
	notifyChannels: {
		type: [SchemaTypes.String],
		default: [],
	},
});

export const ServerConfig = model<IServerConfig>('ServerConfig', ServerConfigSchema, 'server_config');
