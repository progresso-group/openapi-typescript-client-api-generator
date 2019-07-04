const fs = require("fs");
const { join } = require("path");
const { capitalizeFirstChar } = require("./stringManipulators");

function serverModelsLoader(path) {
    const files = getFiles(path);
    return files.map(file => loadServerModel(file));
}

function getFiles(path) {
    const files = [];
    const itemNames = fs.readdirSync(path);

    itemNames.forEach(itemName => {
        const name = join(path, itemName);
        if (fs.statSync(name).isDirectory()) {
            files.push(...getFiles(name));
        } else {
            files.push({ path: name, name: capitalizeFirstChar(itemName.substr(0, itemName.length - 3)) });
        }
    });

    return files;
}

function loadServerModel(file) {
    const fileContent = String(fs.readFileSync(file.path, "utf8"));

    const supertype = loadSupertype(file.name, fileContent);
    const properties = loadProperties(file.name, fileContent);

    const model = {
        name: file.name,
        supertype: supertype,
        properties: properties
    };

    return model;
}

function loadSupertype(name, fileContent) {
    const supertypePattern = `export class ${name} extends `;
    const supertypeMatch = fileContent.match(new RegExp(`${supertypePattern}\\w*`, "g"));

    let supertype = null;
    if (supertypeMatch) {
        supertype = supertypeMatch[0].substr(supertypePattern.length);
    }

    return supertype;
}

function loadProperties(fileName, fileContent) {
    const decoratorPattern = "@ApiModelProperty\\(.*\\)\\r\\n\\s*public \\w*";
    const decoratorMatches = fileContent.match(new RegExp(decoratorPattern, "g"));

    if (!decoratorMatches) {
        return [];
    }

    return decoratorMatches.map(match => {
        const nameMatch = match.match(new RegExp("\\w*", "g"));
        const name = nameMatch[nameMatch.length - 2];

        const descriptionPatternPart = "description: '";
        const descriptionMatch = match.match(new RegExp(`${descriptionPatternPart}.*?'`, "g"));
        const description = descriptionMatch ? descriptionMatch[0].substring(descriptionPatternPart.length, descriptionMatch[0].length - 1) : null;

        const typePatternPart = "type: ";
        let type = null;
        let typeMatch = match.match(new RegExp(`${typePatternPart}[^']\\w*`, "g"));
        if (!typeMatch) {
            typeMatch = match.match(new RegExp(`${typePatternPart}'.*?'`, "g"));
            type = typeMatch ? typeMatch[0].substring(typePatternPart.length + 1, typeMatch[0].length - 1 ) : null;
        } else {
            type = typeMatch[0].substring(typePatternPart.length);
        }

        if (!type) {
            console.log(`Warning: property ${name} of ${fileName} does not have a type defined.`);
        }

        const isArrayPatternPart = "isArray: ";
        const isArrayMatch = match.match(new RegExp(`${isArrayPatternPart}\\w*`, "g"));
        const isArray = isArrayMatch ? isArrayMatch[0].substring(isArrayPatternPart.length) : null;

        return {
            name,
            description,
            type: type,
            isArray: isArray === null ? null : isArray === "true"
        };
    });
}

module.exports = {
    serverModelsLoader
};