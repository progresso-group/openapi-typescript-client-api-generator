const { propertyExtractor, refExtractor } = require("./extractors");

function endpointsLoader(config, models, requestBodies) {
    const loadedEndpoints = [];
    const paths = propertyExtractor(config.paths);

    paths.forEach(path => loadedEndpoints.push(...endpointLoader(path, models, requestBodies)));

    return loadedEndpoints;
}

function endpointLoader(endpoint, models, requestBodies) {
    const path = endpoint.name.replace(/\{/g, "${");

    const methods = [];
    if (endpoint.get) {
        methods.push("get");
    }
    if (endpoint.post) {
        methods.push("post");
    }
    if (endpoint.put) {
        methods.push("put");
    }
    if (endpoint.delete) {
        methods.push("delete");
    }

    return methods.map(method => {
        const operationName = endpoint[method].operationId;
        const description = endpoint[method].description;
        const schema = loadResponseSchema(endpoint[method].responses);
        const returnType = endpoint[method].responses ? loadType(schema, models).name : "void";
        const subReturnTypes = loadSubReturnTypes(returnType, models);
        const body = endpoint[method].requestBody ? loadRequestBody(endpoint[method].requestBody, models, requestBodies) : null;

        let parameters = endpoint[method].parameters ? endpoint[method].parameters.map(param => ({
            name: param.name,
            type: loadType(param.schema).name,
            description: param.description,
            required: param.required,
            in: param.in
        })) : [];

        parameters = parameters.filter(param => param.required).concat(parameters.filter(param => !param.required));
        
        if (body) {
            parameters.push({
                name: "body",
                type: body.type,
                description: body.description,
                required: true,
                in: "body",
                isBody: body.isRequestBody
            })
        }

        if (parameters.length > 0) {
            parameters[parameters.length - 1].isLastParam = true;
        }
    
        const pathParameters = parameters.filter(param => param.in === "path");
        const queryParameters = parameters.filter(param => param.in === "query");

        return {
            tag: endpoint[method].tags[0],
            isGet: method === "get",
            isPost: method === "post",
            isPut: method === "put",
            isDelete: method === "delete",
            name: operationName,
            description:  description,
            path: path,
            parameters: parameters,
            pathParameters: pathParameters,
            queryParameters: queryParameters,
            hasQueryParameters: queryParameters.length > 0,
            body: body,
            returnType: returnType,
            returnTypeIsArray: returnType.includes("[]"),
            subReturnTypes: subReturnTypes
        }
    });
}

function loadResponseSchema(responses) {
    const defaultSchema = { type: "void" };

    if (!responses) {
        return defaultSchema;
    }

    const hasSuccessResponse = responses.default || responses["200"];
    if (!hasSuccessResponse) {
        return defaultSchema;
    }

    const successResponse = responses.default ? responses.default : responses["200"];
    if (successResponse.schema) {
        return successResponse.schema;
    }

    if (successResponse.content) {
        return successResponse.content["application/json"].schema;
    }

    return defaultSchema;
}

function loadSubReturnTypes(returnType, models) {
    if (returnType === "void") {
        return [];
    }

    returnType = returnType.replace("[]", "");
    return models.filter(model => model.supertype && model.supertype.name === returnType);
}

function loadType(schema, models, requestBodies) {
    let oneOfs = [];

    if (schema.type !== "array") {
        oneOfs = schema.oneOf;
        if (!oneOfs) {
            if (schema.type) {
                return { name: mapType(schema.type) };
            } else {
                oneOfs = [ schema ];
            }
        }
    } else {
        if (schema.items.type) {
            return { name: `${mapType(schema.items.type)}[]` };
        }

        oneOfs = schema.items.oneOf ? schema.items.oneOf : [ schema.items ];
    }

    let isRequestBody = false;
    const possibleTypeNames = oneOfs.map(oneOf => {
        const ref = refExtractor(oneOf["$ref"]);
        if (ref.isRequestBody) {
            isRequestBody = true;
            return ref.name;
        }

        return ref;
    });

    let possibleTypes = [];
    if (isRequestBody) {
        possibleTypes = requestBodies.filter(requestBody => possibleTypeNames.includes(requestBody.name));
    } else {
        possibleTypes = models.filter(model => possibleTypeNames.includes(model.name));
    }

    const supertype = possibleTypes[0].supertype;
    if (possibleTypes.some(type => type.supertype !== supertype)) {
        throw "Types with different direct supertypes are not supported yet."
    }
    
    if (!supertype) {
        return { name: `${possibleTypes[0].name}${schema.type === "array" ? "[]" : ""}`, isRequestBody: isRequestBody };
    }  

    return { name: `${supertype}${schema.type === "array" ? "[]" : ""}`, isRequestBody: isRequestBody };
}

function mapType(type) {
    if (type === "integer") {
        type = "number";
    }

    return type;
}

function loadRequestBody(body, models, requestBodies) {
    const schema = body.content ? (body.content["application/json"] ? body.content["application/json"].schema : { type: "object" }) : body;
    const typeDefinition = loadType(schema, models, requestBodies);
    return {
        type: typeDefinition.name,
        isRequestBody: typeDefinition.isRequestBody,
        description: body.description
    };
}

module.exports = {
    endpointsLoader
};