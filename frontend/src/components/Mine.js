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
            {/* ADD ? BUTTON THAT SAYS:
            Estimated fee for minining (in addition to the gas). Because the fee is denominated in gas, it fluctuates with the price of gas. Feel free to increase the amount of
            ETH to ensure the transaction does not fail. Any excess ETH paid for mining is returned.
            */}
            <div className="col-auto">
                {/* <label>ETH Amount</label> */}
                <input
                    style={{ width: "130px" }}
                    className="form-control"
                    type="number"
                    step="1"
                    name="amount"
                    placeholder={maxFeeETH()}
                    disabled={!enable}
                />
                {/* REPLACE PLACEHOLDER TEXT WITH REAL TIME ON THE ESTIMATED AMOUNT OF ETH TO MINE*/}
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
