const { join } = require("path");
const fs = require("fs");
const fx = require('mkdir-recursive');
const mustache = require("mustache");

function serviceFilesGenerator(paths, apiInfo, services) {
    fx.mkdirSync(paths.services);
    const classTemplate = loadTemplate("service");
    const interfaceTemplate = loadTemplate("serviceInterface");
    services.forEach(service => serviceFileGenerator(paths, apiInfo, service, classTemplate, interfaceTemplate))
}

function serviceFileGenerator(paths, apiInfo, service, classTemplate, interfaceTemplate) {
    const view = service;
    view.apiInfo = apiInfo;
    view.relativeModelsPath = paths.relativeModels;
    view.relativeServiceBasePath = paths.relativeServiceBase;

    saveFile(paths, `${view.fileName}.ts`, classTemplate, view);
    saveFile(paths, `${view.fileName}.interface.ts`, interfaceTemplate, view);
}

function loadTemplate(name) {
    const path = join(__dirname, `./templates/${name}.mst`);
    return fs.readFileSync(path, "utf8");
}

function saveFile(paths, fileName, template, view) {
    const fileContent = mustache.render(template, view);
    fileName = join(paths.services, fileName);

    fs.writeFileSync(fileName, fileContent);
}

module.exports = {
    serviceFilesGenerator
};
