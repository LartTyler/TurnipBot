import {BuyData, IBuyData} from './Models/BuyData';
import {ISellData, SellData} from './Models/SellData';

export const getBestSell = async (limit: number = 1): Promise<ISellData[]> => {
	return (await SellData.find({}, null, {
		limit,
		sort: {
			price: 1,
		},
	}));
};

export const getBestBuy = async (limit: number = 1): Promise<IBuyData[]> => {
	return (await BuyData.find({}, null, {
		limit,
		sort: {
			price: 1,
		},
	}));
};

export function ucfirst(input: string) {
	return input.charAt(0).toUpperCase() + input.substr(1);
}
