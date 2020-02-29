#!/usr/bin/env node

var ArgumentParser = require("argparse").ArgumentParser;
var main = require("../lib/main");

var parser = new ArgumentParser({
    addHelp: true
});

var outputGroup = parser.addMutuallyExclusiveGroup();

outputGroup.addArgument(["docx-path"], {
    type: "string",
    nargs: "?",
    help: "Path to the .docx file to convert."
});

outputGroup.addArgument(["--input-path"], {
    type: "string",
    help: "Path to all input documents. All .docx files will be converted to the output-dir."
});

var outputGroup = parser.addMutuallyExclusiveGroup();
outputGroup.addArgument(["output-path"], {
    type: "string",
    nargs: "?",
    help: "Output path for the generated document. Images will be stored inline in the output document. Output is written to stdout if not set."
});
outputGroup.addArgument(["--output-dir"], {
    type: "string",
    help: "Output directory for generated HTML and images. Images will be stored in separate files. Mutually exclusive with output-path."
});

parser.addArgument(["--output-format"], {
    defaultValue: "html",
    choices: ["html", "markdown"],
    help: "Output format."
});

parser.addArgument(["--style-map"], {
    type: "string",
    help: "File containg a style map."
});



main(parser.parseArgs());
