export enum DefaultRates {
    FullPlate = 'Full Plate',
    HalfPlate = 'Half Plate',
    TwoFiftyGm = '250 gm',
    ThreeFiftyGm = '350 gm',
    FiveHundredGm = '500 gm',
    SevenFiftyGm = '750 gm',
    OneKg = '1 kg',
    Hall = 'Hall',
    Family = 'Family',
    MultiCuisine = 'Multi Cuisine',
}

export const getDefaultRates = (): { type: string; price: number }[] => {
    return Object.values(DefaultRates).map((rateType) => ({
        type: rateType,
        price: 0,
    }));
};