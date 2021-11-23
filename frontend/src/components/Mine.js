import React from "react";

export function Mine({ mineFunc }) {
    return (
        <div>
            <h4>Mine</h4>
            <form
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
                <div className="form-group">
                    <label>Amount of ETH</label>
                    <input className="form-control" type="number" step="1" name="amount" placeholder="1" required />
                </div>
                <div className="form-group">
                    <input className="btn btn-primary" type="submit" value="Transfer" />
                </div>
            </form>
        </div>
    );
}
