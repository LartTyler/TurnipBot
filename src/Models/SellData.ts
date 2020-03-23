import {Document, model, Schema, SchemaTypes} from 'mongoose';

export interface ISellData extends Document {
	userId: string;
	year: number;
	week: number;
	price: number;
}

const SellDataSchema = new Schema({
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
	price: {
		type: SchemaTypes.Number,
		required: true,
	},
});

export const SellData = model<ISellData>('SellData', SellDataSchema, 'sell_data');
