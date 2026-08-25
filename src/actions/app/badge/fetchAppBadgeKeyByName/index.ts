import selectAppBadgeKeyByName from "./queries/selectAppBadgeKeyByName";

interface IFetchAppBadgeKeyByName {
    badgeName: string;
}

/**
 * The BadgeUnlocked payload carries the badge's display name, because that is
 * the published contract, so a consumer has to translate it back to the key the
 * data model is keyed by.
 */
const fetchAppBadgeKeyByName = async ({
    badgeName,
}: IFetchAppBadgeKeyByName) => {
    const data = await selectAppBadgeKeyByName({ badgeName });

    return { data };
};

export default fetchAppBadgeKeyByName;
