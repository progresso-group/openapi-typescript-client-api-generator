const { createPaths } = require("./pathCreator");

const { configFileLoader } = require("./loaders/configFileLoader");
const { apiInfoLoader } = require("./loaders/apiInfoLoader");
const { modelsLoader } = require("./loaders/modelsLoader");
const { requestBodiesLoader } = require("./loaders/requestBodiesLoader");
const { servicesLoader } = require("./loaders/servicesLoader");

const { modelFilesGenerator } = require("./generators/modelFilesGenerator");
const { requestBodiesGenerator } = require("./generators/requestBodiesGenerator");
const { serviceFilesGenerator } = require("./generators/serviceFilesGenerator");

const args = process.argv.slice(2);
const errorMessage = "Too few arguments. Specify openapi config file with -c <path>, path of service base class location with -cb <path>, path of service generation destination with -s <path>, path of models generation destination with -m <path> and path of server models location with -sm <path>.";
if (!args || !args[1] || !args[3] || !args[5] || !args[7] || !args[9]) {
    console.log(errorMessage);
    return;
}

async function generate() {
    console.log("InStage client api generator");
    const paths = createPaths(args[1], args[3], args[5], args[7], args[9]);
    
    console.log("Loading config file...");
    const config = await configFileLoader(paths.configFile, paths.serverModels);
    console.log("Config file loaded.");
    
    console.log("Loading api info...");
    const apiInfo = apiInfoLoader(config);
    console.log("Done.");
    
    console.log("Loading models...");
    const models = modelsLoader(config);
    console.log(`Loaded ${models.length} models.`);

    console.log("Generating model files...");
    modelFilesGenerator(paths.models, apiInfo, models);
    console.log(`Generated ${models.length} model files.`);

    console.log("Loading request bodies...");
    const requestBodies = requestBodiesLoader(config);
    console.log(`Loaded ${requestBodies.length} request bodies.`);
    
    console.log("Generating request body files...");
    requestBodiesGenerator(paths.models, apiInfo, requestBodies);
    console.log(`Generated ${requestBodies.length} request body files.`);
    
    const services = servicesLoader(config, models, requestBodies);
    serviceFilesGenerator(paths, apiInfo, services);
    
    console.log(`Generated ${services.length} services.`);
}

generate();

