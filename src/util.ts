export function ucfirst(input: string) {
	return input.charAt(0).toUpperCase() + input.substr(1);
}

export enum WeekDay {
	MONDAY = 1,
	TUESDAY,
	WEDNESDAY,
	THURSDAY,
	FRIDAY,
	SATURDAY,
	SUNDAY,
}
