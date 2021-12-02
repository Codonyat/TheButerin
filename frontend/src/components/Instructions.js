import React from "react";

export function Instructions() {
    return (
        <>
            {/* USE MINECRAFT FONT?
                        STYLE LIST
                    */}
            <p>
                Collective effort to <span style={{ fontStyle: "italic" }}>JPEG-mine</span> the largest on-chain image (
                <strong>1 MB</strong>) on Ethereum.
            </p>
            <p>
                <strong>JPEG-mining</strong> is like minting but you also upload a piece of JPEG data in the process.
            </p>
            <p>
                Thanks to the forgotten{" "}
                <a href="https://www.liquidweb.com/kb/what-is-a-progressive-jpeg/" className="text-reset">
                    progressive JPEG
                </a>{" "}
                tech from the 56k-modem era, <strong>the final image is gradually revealed</strong> during the mining
                process.
            </p>
            <p className="m-0">
                The JPEG is split in <strong>100 pieces</strong> of data and each miner gets a unique JPEG with
                different degrees of quality:
            </p>
            <ul className="list-unstyled">
                <li className="ms-4">
                    <i class="bi bi-arrow-return-right"></i>
                    #0 - #10 are in{" "}
                    <span style={{ fontWeight: "bold", backgroundColor: "white", color: "black" }}>black</span>&
                    <span
                        style={{
                            fontWeight: "bold",
                            backgroundColor: "black",
                            color: "white"
                        }}
                    >
                        white
                    </span>
                </li>
                <li className="ms-4">
                    #11 - #32 introduce{" "}
                    <span
                        style={{
                            fontWeight: "bold",
                            background: "red",
                            background:
                                "-webkit-linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                            background: "-o-linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                            background:
                                "-moz-linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                            background: "linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                            WebkitBackgroundClip: "text",
                            color: "transparent"
                        }}
                    >
                        color
                    </span>{" "}
                    to the image
                </li>
                <li className="ms-4">
                    #33 - #98 improve the <span style={{ fontWeight: "bold", fontSize: "large" }}>resolution</span>
                </li>
                <li className="ms-4">
                    #99 gets the <strong>final image</strong>
                </li>
                {/* MENTION THE REVEAL OF THE IMAGE SOMEWHERE */}
            </ul>
            INCLUDE PHOTO HERE OF THE PHASES
            <p>
                The total cost (tx fee + minting fee) is <strong>denonimanted in gas</strong>, and therefore it
                fluctuates with gas prices! (<strong>Trick</strong>: wait for low gas prices)
            </p>
            {/* <p>
                        Any <strong>ETH paid in excess is returned back</strong> so do not
                        worry about overpaying.
                    </p> */}
            <p>For #0 mining costs 3M gas (minting + tx fee), and increases up to 10M gas for #99.</p>
            {/* <ul>
                        <li>Previous cost of mining: X gas</li>
                        <li>Current cost of mining: Y gas</li>
                        <li>Next cost of mining: Z gas</li>
                    </ul> */}
            <p className="m-0">Good mining (gm)</p>
        </>
    );
}
