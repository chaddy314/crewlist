import type { Role } from "./role";
import {v4 as uuidv4} from "uuid";

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
        if( this.primaryRoles.length === 0) {
            return "";
        }
        return this.primaryRoles.map(role => role.label).join(", ");
    }

    public get secondaryList(): string {
        if( this.secondaryRoles.length === 0) {
            return "";
        }
        return this.secondaryRoles.map(role => role.label).join(", ");
    }

}