const { join, relative } = require("path");

function createPaths(configFilePath, relativeServiceBasePath, relativeServicesPath, relativeModelsPath, relativeServerModelsPath) {
    const basePath = process.cwd();

    const absoluteConfigFilePath = join(basePath, configFilePath);
    const absoluteServiceBasePath = join(basePath, relativeServiceBasePath);
    const absoluteServicesPath = join(basePath, relativeServicesPath);
    const absoluteModelsPath = join(basePath, relativeModelsPath);
    const absoluteServerModelsPath = join(basePath, relativeServerModelsPath);

    const serviceBasePathRelativeToServices = relative(absoluteServicesPath, absoluteServiceBasePath);
    const modelsPathRelativeToServices = relative(absoluteServicesPath, absoluteModelsPath);

    return {    
        configFile: absoluteConfigFilePath,
        relativeServiceBase: serviceBasePathRelativeToServices.replace(/\\/g, "/"),
        services: absoluteServicesPath,
        models: absoluteModelsPath,
        relativeModels: modelsPathRelativeToServices.replace(/\\/g, "/"),
        serverModels: absoluteServerModelsPath
    };
}

module.exports = {
    createPaths
};