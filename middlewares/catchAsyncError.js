// export const catchAsyncError = () => {
//     return(

//     );
// }

// or export const catchAsyncError = () => () => {} || BOTH ARE Same. They "retun" same way

export const catchAsyncError = (passedFunction) => (req, res, next) => {
    Promise.resolve(passedFunction(req, res, next)).catch(next);
};
