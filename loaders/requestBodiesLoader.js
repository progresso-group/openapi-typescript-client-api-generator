const { propertyExtractor, refExtractor } = require("./extractors");
const { lowercaseFirstChar } = require("./stringManipulators");

function requestBodiesLoader(config) {
    const requestBodies = propertyExtractor(config.components.requestBodies);
    return requestBodies.map(requestBody => requestBodyLoader(requestBody));
}

function requestBodyLoader(requestBody) {
    console.log(`Loading requestBody ${requestBody.name}`);

    const schema = requestBody.content["application/json"].schema;

    const isArray = schema.type === "array";
    const type = isArray ? refExtractor(schema.items["$ref"]) : refExtractor(schema["$ref"]);

    return {
        name: requestBody.name,
        fileName: lowercaseFirstChar(requestBody.name),
        type: type,
        typeFileName: lowercaseFirstChar(type),
        isArray: isArray
    };
}

module.exports = {
    requestBodiesLoader
};