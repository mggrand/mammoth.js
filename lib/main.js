/* global process */

var fs = require("fs");
var fsProm = require("fs").promises;
var path = require("path");

var mammoth = require("./");
var promises = require("./promises");
var images = require("./images");

const docxExtension = ".docx";

var outputImages = {};
var imageIndex = 0;

function main(argv) {
    var inputDir = argv["input-dir"];
    var outputDir = argv["output-dir"];
    var outputFormat = argv.output_format;
    var styleMapPath = argv.style_map;

    fsProm.readdir(outputDir)
        .then(function (files) {
            files.forEach(function (file) {
                fs.unlink(path.join(outputDir, file), err => {
                    if (err) throw err;
                });
            });
        });

    readStyleMap(styleMapPath).then(function (styleMap) {
        var options = {
            styleMap: styleMap,
            outputFormat: outputFormat,
            convertImage: images.imgElement(function (element) {
                imageIndex++;
                var extension = element.contentType.split("/")[1];
                var filename = imageIndex + "." + extension;

                return element.read().then(function (imageBuffer) {
                    var pathFromBuffer = outputImages[imageBuffer]
                    if (pathFromBuffer === undefined) {
                        outputImages[imageBuffer] = filename;
                        var imagePath = path.join(outputDir, filename);
                        return promises.nfcall(fs.writeFile, imagePath, imageBuffer);
                    }
                    else {
                        filename = pathFromBuffer;
                        return promises.resolve(null);
                    }
                }).then(function () {
                    return { src: filename };
                });
            })
        };

        return fsProm.readdir(inputDir)
            .then(function (files) {
                return promises.resolve(files
                    .filter(f => path.extname(f) === docxExtension)
                    .map(docx => path.join(inputDir, docx)));
            })
            .then(function (filePaths) {
                filePaths.forEach(function (file) {
                    var basename = path.basename(file, docxExtension);
                    var outputPath = path.join(outputDir, basename + getOutputFormatExtension(outputFormat));
                    return mammoth.convert({ path: file }, options)
                        .then(function (result) {
                            result.messages.forEach(function (message) {
                                process.stderr.write(message.message);
                                process.stderr.write("\n");
                            });

                            var outputStream = outputPath ? fs.createWriteStream(outputPath) : process.stdout;

                            outputStream.write(result.value);
                        });
                });
            });
    }).done();
}

function readStyleMap(styleMapPath) {
    if (styleMapPath) {
        return promises.nfcall(fs.readFile, styleMapPath, "utf8");
    } else {
        return promises.resolve(null);
    }
}

function getOutputFormatExtension(outputFormat) {
    if (outputFormat === 'markdown') {
        return ".md";
    }
    else {
        return ".html";
    }
}

module.exports = main;
