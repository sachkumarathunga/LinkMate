const protectedController = (req, res) => {
    res.status(200).json({
      message: 'You have accessed a protected route!',
      user: req.user, // This comes from the `protect` middleware
    });
  };
  
  module.exports = protectedController;
  