import insertAppUser from "./queries/insertAppUser";

interface ICreateAppUser {
    emailAddress: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
}

const createAppUser = async ({
    emailAddress,
    firstName,
    middleName,
    lastName,
}: ICreateAppUser) => {
    const data = await insertAppUser({
        emailAddress,
        firstName,
        middleName,
        lastName,
    });

    return { data };
};

export default createAppUser;
