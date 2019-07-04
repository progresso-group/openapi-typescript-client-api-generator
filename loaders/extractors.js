
function propertyExtractor(obj) {
    var props = [];

    for (var propName in obj) {
        if (obj.hasOwnProperty(propName)) {
            obj[propName].name = propName;
            props.push(obj[propName]);
        }
    }

    return props;
}

function refExtractor(ref) {
    const qualifierArray = ref.split("/");
    const typeName = qualifierArray[qualifierArray.length - 1];

    if (ref.includes("/requestBodies/")) {
        return { name: typeName, isRequestBody: true };
    }

    return typeName;
}

module.exports = {
    propertyExtractor,
    refExtractor
};