const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/expenseApp", {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
})

const db = mongoose.connection

module.exports = db