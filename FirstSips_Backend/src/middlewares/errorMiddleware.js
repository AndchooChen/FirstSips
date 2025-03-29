const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.type === 'StripeError') {
      return res.status(400).json({
        error: err.message
      });
    }
  
    res.status(500).json({
      error: 'Internal server error'
    });
  };
  
  module.exports = errorHandler;