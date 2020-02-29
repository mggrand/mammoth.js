/* global process */

var fs = require("fs");
var path = require("path");

var mammoth = require("./");
var promises = require("./promises");
var images = require("./images");
var transforms = require("../lib/transforms");
var _ = require("underscore");

function main(argv) {
    var docxPath = argv["docx-path"];
    
    var inputPath = argv.input_path;
    var outputPath = argv["output-path"];
    var outputDir = argv.output_dir;
    var outputFormat = argv.output_format;
    var styleMapPath = argv.style_map;

    var links = [];
    
    readStyleMap(styleMapPath).then(function(styleMap) {
        var options = {
            styleMap: styleMap,
            outputFormat: outputFormat
        };
        
        var files = [];
        if(inputPath){
            fs.readdirSync(inputPath).forEach(file => {
                if(path.extname(file) == '.docx')
                {
                    files.push(path.join(inputPath,file));
                }
            });
        }
        else{
            files.push(docxPath);
        }

        files.forEach(file => {
        if (outputDir) {
            var basename = path.basename(file, ".docx");
            outputPath = path.join(outputDir, basename + ".html");
            var imageIndex = 0;
            options.convertImage = images.imgElement(function(element) {
                imageIndex++;
                var extension = element.contentType.split("/")[1];
                var filename = basename + "_" +  imageIndex + "." + extension;
                
                return element.read().then(function(imageBuffer) {
                    var imagePath = path.join(outputDir, filename);
                    return promises.nfcall(fs.writeFile, imagePath, imageBuffer);
                }).then(function() {
                    return {src: filename};
                });
            });
        }

        options.transformDocument = function transformElement(element) {
            function transformParagraph(element)
            {
                var regex = /[hH]eading\s[1-6]/
                if(element.styleName && regex.exec(element.styleName))
                {
                    links.push({file: file, type: "Header", text: mammoth.convertElementToRawText(element)});
                }
                return element;
            }
            
            
            function transformRun(element){
                if(element.styleId && element.styleId == 'C1HJump')
                {
                    links.push({file: file, type: "Jump", text: mammoth.convertElementToRawText(element)});
                }
                return element;
            }

            if (element.children) {
                var children = _.map(element.children, transformElement);
                element = {...element, children: children};
            }
        
            if(!element ||  !element.type)
            {return element;}
        
            if (element.type === "paragraph") {
                element = transformParagraph(element);
            }
        
            if (element.type === "run") {
                element = transformRun(element);
            }
        
            return element;
        }
        
        
        
        return mammoth.convert({path: file}, options)
            .then(function(result) {
                result.messages.forEach(function(message) {
                    process.stderr.write(message.message);
                    process.stderr.write("\n");
                });
                
                var outputStream = outputPath ? fs.createWriteStream(outputPath) : process.stdout;
                
                outputStream.write(result.value);
            }).done((f) => {
                var out = fs.createWriteStream("D:\\working\\OnlineHelpTest\\links.txt");
                out.write(JSON.stringify(links));
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



module.exports = main;

