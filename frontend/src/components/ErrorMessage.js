import React from "react";

export function ErrorMessage({ errorMessage }) {
    return (
        <div className="row justify-content-center" style={{ alignItems: "center" }}>
            <div className="col-3">
                <img src="/dwarf.png" style={{ width: "100%" }}></img>
            </div>
            <div className="col-9">
                <strong className="text-left m-0" style={{ height: "100%", display: "flex", alignItems: "center" }}>
                    {errorMessage}
                </strong>
            </div>
        </div>
    );
}
