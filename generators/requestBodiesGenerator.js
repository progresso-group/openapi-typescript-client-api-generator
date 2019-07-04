const { join } = require("path");
const fs = require("fs");
const fx = require('mkdir-recursive');
const mustache = require("mustache");

function requestBodiesGenerator(path, apiInfo, requestBodies) {
    const requestBodiesPath = join(path, "/requestBodies");
    fx.mkdirSync(requestBodiesPath);
    const template = loadTemplate();
    requestBodies.forEach(requestBody => requestBodyGenerator(requestBodiesPath, apiInfo, requestBody, template))
}

function requestBodyGenerator(path, apiInfo, requestBody, template) {
    const view = requestBody;
    view.apiInfo = apiInfo;

    saveFile(path, template, view);
}

function loadTemplate() {
    const path = join(__dirname, "./templates/requestBody.mst");
    return fs.readFileSync(path, "utf8");
}

function saveFile(path, template, view) {
    const fileContent = mustache.render(template, view);
    const fileName = join(path, `${view.fileName}.ts`);

    fs.writeFileSync(fileName, fileContent);
}

module.exports = {
    requestBodiesGenerator
};
