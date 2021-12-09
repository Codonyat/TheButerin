import React from "react";

export function ErrorMessage({ errorMessage, OSlink }) {
    return (
        <div className="row justify-content-center" style={{ alignItems: "center" }}>
            <div className="col-3">
                <img src="/dwarf.png" style={{ width: "100%" }}></img>
            </div>
            <div className="col-9">
                {OSlink && (
                    <span>
                        <a href={OSlink} className="text-reset" target="_blank">
                            Your NFT
                        </a>{" "}
                        can be viewed in{" "}
                        <a href="https://opensea.io/collection/mined-jpeg" className="text-reset" target="_blank">
                            OpeanSea.
                        </a>
                        <br></br>
                        Join us in{" "}
                        <a href="https://discord.gg/QDnGyHR2FM" className="text-reset" target="_blank">
                            Discord.
                        </a>
                    </span>
                )}
                <strong className="text-left m-0" style={{ height: "100%", display: "flex", alignItems: "center" }}>
                    {errorMessage}
                </strong>
            </div>
        </div>
    );
}
