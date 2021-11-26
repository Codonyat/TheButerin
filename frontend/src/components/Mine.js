import React from "react";

export function Mine({ mineFunc, estimateETH, next }) {
    return (
        <form
            className="row g-2 align-items-end justify-content-center"
            onSubmit={(event) => {
                // This function just calls the transferTokens callback with the
                // form's data.
                event.preventDefault();

                const formData = new FormData(event.target);
                const amount = formData.get("amount");

                if (amount) {
                    mineFunc(amount);
                }
            }}
        >
            <div className="col-1">
                <label>ETH Amount</label>
                <input className="form-control" type="number" step="1" name="amount" placeholder={estimateETH} />
                {/* REPLACE PLACEHOLDER TEXT WITH REAL TIME ON THE ESTIMATED AMOUNT OF ETH TO MINE*/}
            </div>
            <div className="col-auto">
                <input className="btn btn-primary" type="submit" value={`Mine #${next}`} />
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
