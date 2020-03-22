import {Document, model, Schema, SchemaTypes} from 'mongoose';

export interface ISellData extends Document {
	userId: string;
	price: number;
}

const SellDataSchema = new Schema({
	userId: {
		type: SchemaTypes.String,
		required: true,
	},
	price: {
		type: SchemaTypes.Number,
		required: true,
	},
});

export const SellData = model<ISellData>('SellData', SellDataSchema, 'sell_data');
