const { endpointsLoader } = require("./endpointsLoader");
const { lowercaseFirstChar, capitalizeFirstChar } = require("./stringManipulators");

function servicesLoader(config, models, requestBodies) {
    const tags = config.tags.map(tag => tag.name);
    const endpoints = endpointsLoader(config, models, requestBodies);

    const services = tags.map(tag => {
        const endpointsForService = endpoints.filter(endpoint => endpoint.tag === tag);
        const usedTypes = loadUsedTypes(endpointsForService);
        const usedRequestBodies = loadUsedRequestBodies(endpointsForService);

        return {
            name: `${capitalizeFirstChar(tag)}Service`,
            fileName: `${tag}Service`,
            endpoints: endpointsForService.map((service, index) => (index === endpointsForService.length - 1) ? {...service, isLast: true} : service),
            usedTypes: usedTypes.map(usedType => ({ name: usedType, fileName: lowercaseFirstChar(usedType)})),
            usedRequestBodies: usedRequestBodies.map(usedRequestBody => ({ name: usedRequestBody, fileName: lowercaseFirstChar(usedRequestBody)}))
        };
    });

    return services;
}

function loadUsedTypes(endpoints) {
    const blacklist = ["void", "object", "string", "number"];
    const returnTypes = endpoints.map(endpoint => endpoint.returnType.replace("[]", "")).concat(...endpoints.map(endpoint => endpoint.subReturnTypes.map(type => type.name)));
    const requestBodyTypes = endpoints.filter(endpoint => endpoint.body && !endpoint.body.isRequestBody).map(endpoint => endpoint.body.type.replace("[]", ""));

    const usedTypes = [...new Set(returnTypes.concat(requestBodyTypes))].filter(type => blacklist.every(blackListType => blackListType !== type));

    return usedTypes;
}

function loadUsedRequestBodies(endpoints) {
    const blacklist = ["void", "object", "string", "number"];
    const requestBodyTypes = endpoints.filter(endpoint => endpoint.body && endpoint.body.isRequestBody).map(endpoint => endpoint.body.type.replace("[]", ""));
    const usedRequestBodies = [...new Set(requestBodyTypes)].filter(type => blacklist.every(blackListType => blackListType !== type));

    return usedRequestBodies;
}

module.exports = {
    servicesLoader
};