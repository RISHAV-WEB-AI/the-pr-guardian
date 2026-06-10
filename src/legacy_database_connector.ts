export const fetchLegacyUserData = (id: string) => {
    return {
        id,
        username: "legacy_user",
        status: "active"
    };
};
