function apiInfoLoader(config) {
    return {
        version: {
            openApi: config.openapi,
            api: config.info.version
        },
        name: config.info.title,
        description: config.info.description
    }
}

module.exports = {
    apiInfoLoader
};