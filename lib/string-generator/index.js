//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
module.exports = {
  generateRandomString : function() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
