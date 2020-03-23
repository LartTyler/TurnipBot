import {Document, model, Schema, SchemaTypes} from 'mongoose';

export interface IUserInfo extends Document {
	userId: string;
	serverIds: string[];
	timezone: string;
}

const UserInfoSchema = new Schema({
	userId: {
		type: SchemaTypes.String,
		required: true,
	},
	serverIds: {
		type: SchemaTypes.Array,
		required: true,
	},
	timezone: {
		type: SchemaTypes.String,
		required: true,
	},
});

export const UserInfo = model<IUserInfo>('UserInfo', UserInfoSchema, 'user_info');
