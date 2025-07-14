export class Voyage {
    public constructor(public shipName: string, public callSign: string, public MMSI: string, public beginDate: Date, public endDate: Date) {
        this.shipName = shipName;
        this.callSign = callSign;
        this.MMSI = MMSI;
        this.beginDate = beginDate;
        this.endDate = endDate;
    }
}