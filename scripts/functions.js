const { execSync } = require("child_process");
const fs = require("fs");
const math = require("mathjs");
const { ethers } = require("hardhat");
const _ = require("lodash");

module.exports = {
    toProgressiveJPEG: function (fromBMP, toJPG) {
        execSync(
            `${__dirname}\\..\\libjpeg-turbo\\bin\\cjpeg.exe -quality 85 -optimize -progressive -sample 1x1 -outfile ${__dirname}\\..\\images\\${toJPG}.jpg -scans ${__dirname}\\scan_script.sh ${__dirname}\\..\\images\\${fromBMP}.bmp`
        );
    },

    getScans: function (imageName) {
        // Open JPEG in binary
        let JPEG = fs.readFileSync(`${__dirname}/../images/${imageName}.jpg`);

        // Store as many JPEGS as scans exist in the progressive JPEG.
        function search2Bytes(buffer, byte1, byte2, start = 0) {
            let index = start;
            do {
                index++;
                index = buffer.indexOf(byte1, index);
                if (buffer[index + 1] === byte2) return index;
            } while (index !== -1);
            return -1;
        }

        JPEG = JPEG.slice(0, JPEG.length - 2);
        let indexEndShard;
        let offset;
        const JpegScans = [];
        // console.log('__________________________________');
        do {
            let index0xFFDA = search2Bytes(JPEG, 0xff, 0xda, offset);
            let index0xFFC4 = search2Bytes(JPEG.slice(0, index0xFFDA), 0xff, 0xc4, offset);

            if (index0xFFC4 === -1) {
                indexEndShard = index0xFFDA === -1 ? JPEG.length : index0xFFDA;
                offset = 0;
            } else {
                indexEndShard = index0xFFC4;
                offset = index0xFFDA - index0xFFC4 + 1;
            }

            let shard = JPEG.slice(0, indexEndShard);
            JpegScans.push(shard);
            // if(JpegScans.length===1) console.log(`Header is ${shard.length} bytes.`);
            // else console.log(`Scan ${JpegScans.length-1} is ${shard.length} bytes.`);

            JPEG = JPEG.slice(indexEndShard, JPEG.length);
        } while (JPEG.length > 0);

        const JpegHeader = JpegScans.shift();
        const JpegFooter = Buffer.from([0xff, 0xd9]);

        // console.log(`${JpegScans.length} scans:`);
        // console.log(`a) Mean length: ${Math.round(math.mean(JpegScans.map(shard=>shard.length)))} bytes`);
        // console.log(`b) Length std: ${Math.round(math.std(JpegScans.map(shard=>shard.length),'unbiased'))} bytes`);
        // console.log('__________________________________');

        return {
            JpegHeader: JpegHeader,
            JpegScans: JpegScans,
            JpegFooter: JpegFooter
        };
    },

    saveShardedJPEGs: function ({ JpegHeader, JpegScans, JpegFooter }) {
        JpegScans.reduce((prevScans, currShard, ind) => {
            const currScans = Buffer.concat([prevScans, currShard]);
            const data = Buffer.concat([JpegHeader, currScans, JpegFooter]);
            fs.writeFileSync(`${__dirname}/../images/shards/test${String(ind).padStart(3, "0")}.jpg`, data);

            return currScans;
        }, Buffer.alloc(0));
    },

    convertScansToB64: function ({ JpegHeader, JpegScans, JpegFooter }) {
        function addTrailingBytes(buf) {
            if (buf.length % 3 === 0) {
                return buf;
            } else {
                return Buffer.concat([buf, Buffer.alloc(3 - (buf.length % 3))]);
            }
        }
        // const JpegHeaderB64 = `data:image/jpeg;base64,${addTrailingBytes(JpegHeader).toString("base64")}`;
        const JpegHeaderB64 = addTrailingBytes(JpegHeader).toString("base64");
        const JpegFooterB64 = JpegFooter.toString("base64");
        const JpegScansB64 = JpegScans.map((shard) => addTrailingBytes(shard).toString("base64"));

        JpegScansB64.forEach((scan, id) => {
            if (scan.length > 24576) throw `Scan ${id} is ${scan.length} bytes`;
        });

        return {
            JpegHeaderB64: JpegHeaderB64,
            JpegScansB64: JpegScansB64,
            JpegFooterB64: JpegFooterB64
        };
    },

    saveShardedJPEGSinB64: function ({ JpegHeaderB64, JpegScansB64, JpegFooterB64 }) {
        // console.log("");
        JpegScansB64.reduce((prevScans, currShard, ind) => {
            const currScansB64 = `${prevScans}${currShard}`;
            const dataB64 = `${JpegHeaderB64}${currScansB64}${JpegFooterB64}`;
            fs.writeFileSync(`${__dirname}/../images/shards/test${String(ind).padStart(3, "0")}B64.txt`, dataB64);

            // console.log(`Scan ${ind} is ${JpegScans[ind].length} bytes.`);
            // console.log(`Scan ${ind} in B64 is ${currShard.length} bytes.`);
            // console.log(`Scan ${ind} in B64 is ${Math.round(currShard.length/JpegScans[ind].length*100)}% larger.`);
            return currScansB64;
        }, "");
    },

    hashScans: function (JpegScansB64) {
        return JpegScansB64.map((scan) => ethers.utils.solidityKeccak256(["string"], [scan]));
    }
};
