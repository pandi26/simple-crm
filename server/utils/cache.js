const { redisClient } = require("../config/redis");

// Get data from Redis
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Redis GET Error:", error.message);
    return null;
  }
};

// Store data in Redis
const setCache = async (key, data, expiry = 60) => {
  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: expiry,
    });
  } catch (error) {
    console.error("Redis SET Error:", error.message);
  }
};

// Delete cache
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis DELETE Error:", error.message);
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
};