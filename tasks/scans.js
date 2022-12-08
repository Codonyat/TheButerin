const utils = require("../scripts/functions.js");

task("scans", "Generate scans and saves them")
    .addParam("imageName", "The name of the image without .bmp extension")
    .addParam("scanName", "The name of the scan without .sh extension")
    .setAction(async ({ imageName, scanName }) => {
        utils.toProgressiveJPEG(imageName, scanName);

        // Open JPEG in binary
        const scans = utils.getScans(imageName, scanName);

        // Convert scans to B64
        const jpegChunksB64 = utils.convertScansToB64(scans);

        // jpegChunksB64.JpegScansB64.forEach((scan, id) => {
        //     if (scan.length > 24576) {
        //         console.log(`Scan ${id} is ${scan.length} bytes`);
        //         throw `Scan ${id} is ${scan.length} bytes`;
        //     }
        // });

        // Save Base64 links
        utils.saveShardedJPEGSinB64(jpegChunksB64, imageName, scanName);

        // Save JPEGs
        utils.saveShardedJPEGs(jpegChunksB64, imageName, scanName);

        console.log("Files generated and saved");
    });
