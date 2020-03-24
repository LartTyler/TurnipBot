import {Document, model, Schema, SchemaTypes} from 'mongoose';

export interface IUserInfo extends Document {
	userId: string;
	serverIds: string[];
	timezone: string;
	currentData: IUserCurrentData;
}

export interface IUserCurrentData extends Document {
	buyPrice: number;
	buyExpiration: Date;
	sellPrice: number;
	sellExpiration: Date;
}

const UserCurrentDataSchema = new Schema({
	buyPrice: {
		type: SchemaTypes.Number,
	},
	buyExpiration: {
		type: SchemaTypes.Date,
	},
	sellPrice: {
		type: SchemaTypes.Number,
	},
	sellExpiration: {
		type: SchemaTypes.Date,
	},
});

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
	currentData: UserCurrentDataSchema,
});

export const UserInfo = model<IUserInfo>('UserInfo', UserInfoSchema, 'user_info');
