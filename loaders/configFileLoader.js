const fs = require("fs");
const converter = require("swagger2openapi");
const { propertyExtractor } = require("./extractors");

const { serverModelsLoader } = require("./serverModelsLoader");

async function configFileLoader(configFilePath, serverModelsPath) {
    const rawdata = fs.readFileSync(configFilePath);
    const config = JSON.parse(rawdata);
    console.log(`Config file with version ${(config.openapi ? config.openapi : config.swagger)} found.`);

    if (config.openapi && config.openapi.startsWith("3")) {
        return config;
    }

    const converted = await convertToV3(config);

    console.log("Augmenting config with server models...")
    return augmentConfigByServerModels(converted, serverModelsPath);
}

async function convertToV3(config) {
    console.log("Running converter...");
    const converted = await converter.convertObj(config, { direct: true });
    console.log("Converted.");

    return converted;
}

function augmentConfigByServerModels(config, serverModelsPath) {
    const serverModels = serverModelsLoader(serverModelsPath);
    console.log(`Loaded ${serverModels.length} server models.`);

    const existingModelNames = propertyExtractor(config.components.schemas).map(model => model.name);
    const modelsToAdd = serverModels.filter(model => existingModelNames.every(existingModelName => existingModelName !== model.name));

    const transformedModels = modelsToAdd.map(model => transformModel(model));

    transformedModels.forEach(model => {
        config.components.schemas[model.name] = model.model;
    });
    console.log(`Added ${transformedModels.length} server models to the configuration.`)

    // TODO: change structure of existing models: i.e. if ListConfiguration was present in json before, add inheritance info

    // console.log(transformedModels);

    return config;
}

function transformModel(model) {
    const transformedModel = { properties: {} };

    const transformedProperties = model.properties.map(prop => {
        if (prop.type === "number") {
            prop.type = "integer";
        }

        const basicDataTypes = ["string", "number", "integer", "boolean"];
        const isRef = basicDataTypes.every(type => prop.type !== type);

        if (isRef) {
            const ref = { "$ref":  `#/components/schemas/${prop.type}` }
            if (prop.isArray) {
                transformedProperty = {
                    type: "array",
                    items: ref
                }
            } else {
                transformedProperty = ref
            }
        } else {
            if (prop.isArray) {
                transformedProperty = {
                    type: "array",
                    items: {
                        type: prop.type
                    }
                };
                if (prop.type === "integer") {
                    transformedProperty.items.format = "int32";
                }
            } else {
                transformedProperty = {
                    type: prop.type
                };
                if (prop.type === "integer") {
                    transformedProperty.format = "int32";
                }
            }
        }

        transformedProperty.description = prop.description;

        return { name: prop.name, prop: transformedProperty };
    });

    if (model.supertype) {
        transformedModel.allOf = [
            { "$ref": `#/components/schemas/${model.supertype}`,
            properties: {}
        }];
        transformedProperties.forEach(prop => transformedModel.allOf[0].properties[prop.name] = prop.prop);
    } else {
        transformedModel.type = "object";
        transformedModel.properties = {};
        transformedProperties.forEach(prop => transformedModel.properties[prop.name] = prop.prop);
    }

    // console.log(transformedModel);

    return {
        name: model.name,
        model: transformedModel
    }
}


module.exports = {
    configFileLoader
};