import {Document, model, Schema, SchemaTypes} from 'mongoose';

export interface IBuyData extends Document {
	userId: string;
	price: number;
}

const BuyDataSchema = new Schema({
	userId: {
		type: SchemaTypes.String,
		required: true,
	},
	price: {
		type: SchemaTypes.Number,
		required: true,
	},
});

export const BuyData = model<IBuyData>('BuyData', BuyDataSchema, 'buy_data');
