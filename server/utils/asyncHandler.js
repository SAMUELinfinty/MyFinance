/**
 * Async handler wrapper to eliminate try-catch blocks in Express controllers
 * @param {Function} requestHandler - Async express controller function
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
