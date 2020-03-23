import {Document, model, Schema, SchemaTypes} from 'mongoose';

export interface IBuyData extends Document {
	userId: string;
	year: number;
	week: number;
	day: number;
	morning: boolean;
	price: number;
}

const BuyDataSchema = new Schema({
	userId: {
		type: SchemaTypes.String,
		required: true,
	},
	year: {
		type: SchemaTypes.Number,
		required: true,
	},
	week: {
		type: SchemaTypes.Number,
		required: true,
	},
	day: {
		type: SchemaTypes.Number,
		required: true,
	},
	morning: {
		type: SchemaTypes.Boolean,
		required: true,
	},
	price: {
		type: SchemaTypes.Number,
		required: true,
	},
});

export const BuyData = model<IBuyData>('BuyData', BuyDataSchema, 'buy_data');
