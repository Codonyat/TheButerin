import React from "react";

export function Instructions() {
    return (
        <>
            {/* USE MINECRAFT FONT?
                        STYLE LIST
                    */}
            ADD COLOR TO NUMBERS
            <p>
                <span style={{ fontFamily: '"Source Code Pro", monospace', fontSize: "xx-large" }}>1</span> Collective
                effort to <span style={{ fontStyle: "italic" }}>JPEG-mine</span>{" "}
                <strong>the largest ever on-chain image</strong> (1 MB) on Ethereum.
            </p>
            <p>
                <span style={{ fontFamily: '"Source Code Pro", monospace', fontSize: "xx-large" }}>2</span>{" "}
                <strong>JPEG-mining</strong> is like minting but you also upload a piece of JPEG in the process.
            </p>
            <p>
                <span style={{ fontFamily: '"Source Code Pro", monospace', fontSize: "xx-large" }}>3</span> Thanks to
                the{" "}
                <a href="https://www.liquidweb.com/kb/what-is-a-progressive-jpeg/" className="text-reset">
                    forgotten tech from the 56k-modem era
                </a>
                , <strong>the final image is revealed during the mining process</strong>.
            </p>
            <p className="m-0">
                <span style={{ fontFamily: '"Source Code Pro", monospace', fontSize: "xx-large" }}>4</span> The JPEG is
                split in <strong>100 pieces</strong> and each miner gets the same JPEG but with different degrees of
                quality:
            </p>
            <ul className="list-unstyled">
                <li className="ms-4">
                    {/* <svg class="bi" width="32" height="32" fill="currentColor">
                        <use xlink:href="arrow-return-right" />
                    </svg> */}
                    <img src="/arrow-return-right.svg" alt="Bootstrap" width="16" height="16"></img> #00 - #10 are in{" "}
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
                    <img src="/arrow-return-right.svg" alt="Bootstrap" width="16" height="16"></img> #11 - #32 introduce{" "}
                    <span
                        style={{
                            fontWeight: "bold",
                            background: "green",
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
                    <img src="/arrow-return-right.svg" alt="Bootstrap" width="16" height="16"></img> #33 - #98 improve
                    the{" "}
                    <span
                        // className="align-middle"
                        style={{
                            fontSize: "xx-large",
                            fontFamily: '"Sacramento", cursive',
                            display: "inline-block",
                            marginTop: "-7px",
                            marginBottom: "-12px"
                        }}
                    >
                        resolution
                    </span>
                </li>
                <li className="ms-4">
                    <img src="/arrow-return-right.svg" alt="Bootstrap" width="16" height="16"></img> #99 gets the{" "}
                    <strong>final image</strong>
                </li>
                {/* MENTION THE REVEAL OF THE IMAGE SOMEWHERE */}
            </ul>
            <p>
                <span style={{ fontFamily: '"Source Code Pro", monospace', fontSize: "xx-large" }}>5</span> The total
                cost (tx fee + minting fee) is <strong>denonimanted in gas</strong>, and therefore it fluctuates with
                gas prices! (<strong>Trick</strong>: wait for low gas prices)
            </p>
            {/* <p>
                        Any <strong>ETH paid in excess is returned back</strong> so do not
                        worry about overpaying.
                    </p> */}
            <p>
                <span style={{ fontFamily: '"Source Code Pro", monospace', fontSize: "xx-large" }}>6</span>{" "}
                <strong>#0 is the cheapest</strong> (minting + tx fee cost 3M gas) and{" "}
                <strong>#99 is the most expensive</strong> (10M gas!).
            </p>
            {/* <ul>
                    <li>Previous cost of mining: X gas</li>
                    <li>Current cost of mining: Y gas</li>
                    <li>Next cost of mining: Z gas</li>
                </ul> */}
            <p className="m-0">Good mining (gm)</p>
        </>
    );
}
