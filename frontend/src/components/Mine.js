import React from "react";

export function Mine({ mineFunc, maxFeeETH, next, enable }) {
    return (
        <form
            className="row g-2 align-items-end justify-content-center"
            onSubmit={(event) => {
                // This function just calls the transferTokens callback with the
                // form's data.
                event.preventDefault();

                const formData = new FormData(event.target);
                const amount = formData.get("amount");

                mineFunc(amount);
            }}
        >
            <div className="col-auto" style={{ position: "relative" }}>
                <input
                    style={{ width: "130px" }}
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.1"
                    name="amount"
                    placeholder={maxFeeETH()}
                    disabled={!enable}
                />
            </div>
            <div className="col-auto">
                <input
                    style={{ width: "130px" }}
                    className="btn btn-primary"
                    type="submit"
                    value={next === undefined ? "" : `Mine #${next.toString().padStart(2, 0)}`}
                    disabled={!enable}
                />
                {/* PASS THE NEXT TO MINE */}
            </div>
        </form>
    );
}

// const formElementStyle = {
//     "-ms-flex": "0 0 530px",
//     flex: "0 0 530px",
//     "background-color": "greenyellow"
// };
