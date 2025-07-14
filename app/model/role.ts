import type {Category} from "~/model/category";
import type {Member} from "~/model/member";

export class Role {

    public primaryMember: Member | null = null;
    public secondaryMember: Member | null = null;
    public label: string;
    public category: Category;
    public roleName: string;

    public constructor(roleName: string, category: Category) {
        this.roleName = roleName;
        this.label = roleName;
        this.category = category;
    }
}