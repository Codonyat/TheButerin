import React from "react";

export function ErrorMessage({ errorMessage }) {
    return (
        <div className="row justify-content-center">
            <div className="col-3">
                <img src="/dwarf.png" style={{ width: "100%" }}></img>
            </div>
            <div className="col-9">
                <p className="text-left" style={{ height: "100%", display: "flex", alignItems: "center" }}>
                    {errorMessage}
                </p>
            </div>
        </div>
    );
}
