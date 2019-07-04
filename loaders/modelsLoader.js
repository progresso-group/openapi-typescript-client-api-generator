const { propertyExtractor, refExtractor } = require("./extractors");
const { lowercaseFirstChar } = require("./stringManipulators");

function modelsLoader(config) {
    const models = propertyExtractor(config.components.schemas);
    const modelData = models.map(model => modelLoader(model));

    return modelData.map(model => augmentWithSupertypeData(model, modelData));
}

function modelLoader(model) {
    let usedTypes = [];

    const inheritance = model.allOf ? (model.allOf[0] ? refExtractor(model.allOf[0]["$ref"]) : null) : null;
    if (inheritance) {
        usedTypes.push(inheritance);
    }
    
    let { properties, usedTypesInProperties } = loadProperties(model);
    usedTypes = usedTypes.concat(usedTypesInProperties);

    return {
        name: model.name,
        fileName: lowercaseFirstChar(model.name),
        supertype: inheritance,
        description: model.description,
        usedTypes: usedTypes.map(usedType => ({ name: usedType, fileName: lowercaseFirstChar(usedType)})),
        hasUsedTypes: usedTypes.length > 0,
        properties: properties.map((prop, index) => (index === properties.length - 1) ? {...prop, isLast: true} : prop)
    };
}

function augmentWithSupertypeData(model, models) {
    if (!model.supertype) {
        return model;
    }

    const supertype = models.find(m => m.name === model.supertype);
    model.supertype = supertype;
    model.usedTypes = [...new Set(model.usedTypes.concat(supertype.usedTypes))];

    return model;
}

function loadProperties(model) {
    const usedTypes = [];

    let properties = propertyExtractor(model.properties).map(prop => loadProperty(prop, usedTypes));

    if (model.allOf) {
        const entries = model.allOf.filter(entry => entry.properties);
        entries.forEach(entry => {
            const props = propertyExtractor(entry.properties).map(prop => loadProperty(prop, usedTypes));
            properties = properties.concat(props);
        }); 
    }

    return { properties, usedTypesInProperties: usedTypes };
}

// TODO: required field
function loadProperty(prop, usedTypes) {
    const { type, ref, isArray } = mapType(prop);
    if (ref) {
        usedTypes.push(type);
    }

    return {
        name: prop.name, 
        description: prop.description,
        type: type,
        typeIsArray: isArray
    };
}

function mapType(prop) {
    var type = prop.type;

    if (!type) {
        return { type: refExtractor(prop["$ref"]), ref: true, isArray: false };
    }

    if (type === "array") {
        const itemType = mapType(prop.items);
        return { type: itemType.type, ref: itemType.ref, isArray: true };
    }

    if (type === "integer") {
        type = "number";
    }

    return { type: type, ref: false, isArray: false }
}

module.exports = {
    modelsLoader
};