const timeCheck = () => {
   const currentTime = new Date();
   return `The current time is: ${currentTime.toLocaleString()}`;
};
module.exports = timeCheck;
