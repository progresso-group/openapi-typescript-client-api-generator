
function lowercaseFirstChar(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function capitalizeFirstChar(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
    lowercaseFirstChar,
    capitalizeFirstChar
};