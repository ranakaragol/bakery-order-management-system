export const getHealth = (req, res) => {
  res.json({
    status: "ok",
    service: "bakery-backend"
  });
};
