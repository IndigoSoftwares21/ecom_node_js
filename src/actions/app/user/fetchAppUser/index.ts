import type { DatabaseExecutor } from "@/database/executor";
import selectAppUser from "./queries/selectAppUser";

interface IFetchAppUser {
    trx: DatabaseExecutor;
    userId: string;
}

const fetchAppUser = async ({ trx, userId }: IFetchAppUser) => {
    const data = await selectAppUser({ trx, userId });

    return { data };
};

export default fetchAppUser;
