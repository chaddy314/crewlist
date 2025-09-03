import type { Role } from "./role";
import {v4 as uuidv4} from "uuid";
import {useI18n} from "vue-i18n";


export class Member {

    public primaryRoles: Role[];
    public secondaryRoles: Role[];
    public id: string;

    public constructor(public firstName: string, public lastName: string) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.primaryRoles = [];
        this.secondaryRoles = [];
        this.id = uuidv4();
    }

    public get fullName(): string {
        return this.firstName + " " + this.lastName;
    }

    public get label(): string {
        return this.fullName;
    }

    public get primaryList(): string {
        const i18n = useI18n();
        if( this.primaryRoles.length === 0) {
            return i18n.t("noPrimary");
        }
        return this.primaryRoles.map(role => role.label).join(", ");
    }

    public get secondaryList(): string {
        const i18n = useI18n();
        if( this.secondaryRoles.length === 0) {
            return i18n.t("noSecondary");
        }
        return this.secondaryRoles.map(role => role.label).join(", ");
    }

}