const knex = require("./db");

class Mensajes {
  constructor() {
    this.message = [];
  }

  async save(message) {
    await knex("messages").insert(message);
  }

  async getAll() {
    let data = [];
    await knex
      .select("name",  "message", "shippingDate")
      .from("messages")
      .then((res) => {
        data = res;
      });
    
    return data;
  }
}

module.exports = Mensajes;